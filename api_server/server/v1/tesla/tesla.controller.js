const moment = require('moment');
const _ = require('lodash');
const bluebird = require('bluebird');
const mongoose = require('mongoose');

const { ObjectId } = require('mongodb'); // or ObjectID
const Utility = require('../../../modules/utility');

const CDN_URL = 'https://d10lpgp6xz60nq.cloudfront.net/images/';
const CommentContainer = require('../../../modules/containers/comment');
require('../../../modules/mongo/comment');
const inst = require('../../../modules/axiosInstances');

bluebird.promisifyAll(mongoose);
const Comment = mongoose.model('Comment');
const tencentcloud = require('../../../node_modules/tencentcloud-sdk-nodejs-intl-en');
const notification = require('../../../modules/newtonNotifications');
const Tencent = require('../../../modules/tencent/tencent');
const BannedUser = require('../../../modules/mysql/banneduser');
const GamesMysql = require('../../../modules/mysql/games');
const banner = require('../../helpers/banUser');
const redisClient = require('../../../config/redis');
const studentRedis = require('../../../modules/redis/student');
const BranchContainer = require('../../../modules/containers/branch');
const classCourseMappingMysql = require('../../../modules/mysql/classCourseMapping');
const CourseHelper = require('../../helpers/course');
const { isStudyGroupEnabled } = require('../studyGroup/studyGroup.controller');
const PopularStudents = require('../../../modules/containers/popular_students');
const Data = require('../../../data/data');
const freeLiveClassHelper = require('../../helpers/freeLiveClass');
const CourseContainer = require('../../../modules/containers/coursev2');
const redisAnswer = require('../../../modules/redis/answer');
const teslaHelper = require('./tesla.helper');
const OneTapPosts = require('../../../modules/mysql/oneTapPosts');
const { getActivityBasedWidget } = require('../../v3/tesla/tesla.controller');
const altAppData = require('../../../data/alt-app');

const hash_expiry = 60 * 60 * 24; // 1 days
const GAME_POST_MSG_ARRAY = [
    'Wow! I just discovered this super cool Game on Doubtnut. Play Now!',
    'Oh yeh kaafi Cool Game hain. Doubtnut par Games khelo!',
    'Kya tumhe pata hain Doubtnut par Games hain! Check it out!',
    'Padhai ke stress ko kam karo! Doubtnut par Games Khelo :)',
    'Padhai se lo ek chota break ! Doubtnut par khelke Games!',
];

const DEFAULT_COUNTRY = 'IN';
// IDs for which game Post should be posted
const GAME_POST_ID = [
    // 19, // Maze Friend
    // 18, // Light Rays
    // 20, // Vilage Stories
    // 2, // Sudoku
    // 4, // hextrix
    27, // Filled-Glass
    23, // Quiz-Master
    // 30, // Connect-Merge
    // 32, // NonStop-4-Letters
    // 21, // Word-Master
    24, // Quick MAth
    // 31, // Fill
    // 22, // Roll the Ball
    33, // Knot Logical
    8, // Rescue Juliet
    34, // POP SOAP
];
// LIVE STATUS  1 = live 2 = scheduled 3 = ended
function json2table(json, classes) {
    const cols = Object.keys(json[0]);

    let headerRow = '';
    let bodyRows = '';

    classes = classes || '';

    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    cols.map((col) => {
        headerRow += `<th>${capitalizeFirstLetter(col)}</th>`;
        return 1;
    });

    json.map((row) => {
        bodyRows += '<tr style="border-style: solid">';

        cols.map((colName) => {
            bodyRows += `<td>${row[colName]}</td>`;
            return 1;
        });
        bodyRows += '</tr>';
        return 1;
    });

    return `<table class="${classes}"><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table><style> table {border - collapse: collapse;} table, td, th {border: 1px solid black;}</style > `;
}

function dailyStreakJsonBuilder(streak) {
    const streak_json = [];
    for (let i = streak; i <= streak + 4; i++) {
        const streak_obj = {
            title: `Day ${i}`,
            icon: '',
            is_achieved: i <= streak ? 1 : 0,
            type: 'NONBADGE',
            points: i * 4,
        };
        if (i % 5 === 0) {
            streak_obj.icon = 'Starred ICON URL';
            streak_obj.type = 'BADGE';
        }

        streak_json.push(streak_obj);
    }
    return streak_json;
}

async function getSigned(req, res, next) {
    try {
        const s3 = req.app.get('s3');
        const signedUrlExpireSeconds = 60 * 60;
        const { content_type, file_ext, file_name } = req.query;
        const { student_id } = req.user;
        const timestamp = moment().unix();
        let tfile_name = '';
        if (!file_name) {
            tfile_name = '';
        } else {
            tfile_name = file_name.replace(`.${file_ext}`, '');
        }
        const fileName = `${tfile_name}_feed_upload_${student_id}_${timestamp}.${file_ext}`;
        const myBucket = 'doubtnut-static/images';
        const url = s3.getSignedUrl('putObject', {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: 'public-read',
            ContentType: content_type,
        });
        next({
            data: {
                url,
                file_name: fileName,
                full_image_url: `${req.app.get('config').cdn_url}images/${fileName}`,
            },
        });
    } catch (error) {
        next(error);
    }
}
async function sendNotification(config, db, postId) {
    const postData = await db.mongo.read.collection('tesla').findOne({ _id: ObjectId(postId) });
    let data;
    if (postData.is_paid == true) {
        data = await db.mongo.read.collection('tesla_payments').find({ post_id: postId.toString(), is_paid: true }).toArray();
    } else {
        data = [];
    }
    const notification_data = {
        event: 'post_detail',
        title: 'Watch Now',
        message: postData.is_paid ? 'The session you booked is starting now' : 'The session you bookmarked is starting now',
        data: JSON.stringify({ post_id: postId }),
    };
    data.forEach((element) => {
        console.log(element);
        notification.sendNotification(element.student_id, notification_data, db.mysql.read);
    });
}
async function getLiveStreamUrl(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');
        const { postId } = req.params;
        const streamUrl = await Utility.getStreamUrlPost(config.liveclass.pushDomainName, config.liveclass.appName, postId, config.liveclass.authKey);
        await db.mongo.write.collection('tesla').findOneAndUpdate(
            { _id: ObjectId(postId) }, // query
            {
                $set: {
                    live_status: 1,
                    stream_link: `rtmp://${config.liveclass.playbackDomainName}/live/${postId}`,
                },
            },
            {
                upsert: true,
            }, // options
            (err, object) => {
                if (err) {
                    console.warn(err.message);
                } else {
                    console.dir(object);
                }
            },
        );
        sendNotification(config, db, postId);
        next({ data: streamUrl });
    } catch (error) {
        console.log(error);
    }
}

function putCompression(config, type, attachment, id) {
    const formatting = { images: 'image', videos: 'video' };
    let entityId;
    try {
        entityId = formatting[type];
    } catch (error) { return; }
    try {
        inst.configMicroInst({
            method: 'PUT',
            url: `${config.microUrl}/api/tesla-pipeline/${entityId}`,
            timeout: 5000,
            headers: { 'Content-Type': 'application/json' },
            data: { feedId: id, resource: attachment },
        });
        return;
    } catch (error) {
        console.log(error);
    }
}

async function checkUserd3Allow(creationTimestamp) {
    const userCreated = new Date(creationTimestamp);

    const day3Ago = new Date();
    day3Ago.setDate(day3Ago.getDate() - 3);

    return userCreated.valueOf() < day3Ago.valueOf();
}

async function postFeed(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const {
            msg,
            type,
            category,
            attachment,
            tags,
            location,
            privacy,
            stream_date,
            is_paid,
            stream_fee,
            stream_start_time,
            stream_end_time,
            live_status,
            feed_category,
        } = req.body;
        const data = {
            msg,
            type,
            category,
            attachment,
            tags,
            location,
            privacy,
            stream_date,
            is_paid,
            stream_fee,
            stream_start_time,
            stream_end_time,
            live_status,
        };
        data.student_id = parseInt(req.user.student_id);
        data.class = req.user.student_class;
        if (data.live_status) {
            data.live_status = parseInt(live_status);
        }
        if (data.attachment) {
            data.attachment = _.split(attachment, ',');
        }
        if (data.tags) {
            data.tags = _.split(tags, ',');
        }
        data.is_deleted = true;
        data.feed_category = feed_category || 'popular';

        if (data.type == 'live') {
            data.is_deleted = false;
        }
        data.is_profane = false;
        data.is_active = true;
        const checkbanned = await BannedUser.getBannedUserBystudentIdAndModule(db.mysql.read, data.student_id);
        if (checkbanned && checkbanned.length > 0) {
            data.is_deleted = true;
        }
        if (data.msg) {
            // IF POST MSG
            // CHECK IF SAME POST POSTED TWICE
            const lastPost = await db.mongo.read.collection('tesla').findOne(
                { student_id: data.student_id },
                { sort: { _id: -1 } },
            );
            if (lastPost && lastPost.msg === data.msg) {
                // NOT REQUIRED JUST DOING FOR READABILITY
                // console.log('SAME POST!');
                data.is_duplicated = true;
            }
            // console.log("ENTERED CHECK",lastPost.msg,data.msg,data.is_duplicated)
        }

        // disable post-feed
        data.is_deleted = true;

        await db.mongo.write.collection('tesla').save(data);
        data.cdn_url = CDN_URL;

        let triggerProfaneCheck = true;
        const isUserd3Old = checkUserd3Allow(req.user.timestamp);

        const allowedCountryCode = (req.user.country_code != '91' || req.user.country_code != '+91' || req.user.country_code != '');

        if (!allowedCountryCode || (data.type == 'video' && !isUserd3Old)) {
            triggerProfaneCheck = false;
        }
        if (triggerProfaneCheck && checkbanned && checkbanned.length == 0 && !data.is_duplicated) {
            // Utility.sqsTrigger(sqs, config.profanity_sqs, { entity: data, entity_type: 'POST_TESLA' });
        }
        if (data.attachment) {
            // eslint-disable-next-line array-callback-return
            data.attachment.map((item) => { putCompression(config, data.type, item, data._id); });
        }
        next({
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function endStream(req, res, next) {
    const config = req.app.get('config');
    const db = req.app.get('db');

    const resourceID = req.params.postId;
    await db.mongo.write.collection('tesla').findOneAndUpdate(
        { _id: ObjectId(resourceID) }, // query
        {
            $set: {
                live_status: 3,
            },
        },
        {
            upsert: false,
        },
    );
    next({ data: 'ended' });

    const secretID = config.tencent_secret_id;
    const secretKey = config.tencent_secret_key;
    const VodClient = tencentcloud.vod.v20180717.Client;
    //  const models = tencentcloud.vod.v20180717.Models;
    const { Credential } = tencentcloud.common;
    const cred = new Credential(secretID, secretKey);
    const client = new VodClient(cred, 'ap-mumbai');
    const req1 = new Tencent.SearchMediaRequest({ StreamId: resourceID });
    client.SearchMedia(req1, async (err, response) => {
        // console.log(response)
        // The request is returned exceptionally, and the exception information is printed
        if (err) {
            console.log(err);
            // res.send(err);
        }
        console.log(response);
        // The request is returned normally, and the response object is printed
        let vodUrl = '';
        for (let j = 0; j < response.MediaInfoSet.length; j++) {
            // const creationDate = moment(response.MediaInfoSet[j].BasicInfo.CreateTime);
            const resourceIDPattern = new RegExp(resourceID, 'g');
            console.log(response.MediaInfoSet[j].BasicInfo.Name);
            if (response.MediaInfoSet[j].BasicInfo.Name.match(resourceIDPattern) && response.MediaInfoSet[j].BasicInfo.Type === 'm3u8') {
                if (vodUrl.length === 0) {
                    vodUrl = response.MediaInfoSet[j].BasicInfo.MediaUrl;
                }
            }
        }
        if (vodUrl.length > 0) {
            console.log(vodUrl);
            // update vod url
            await db.mongo.write.collection('tesla').findOneAndUpdate(
                { _id: ObjectId(resourceID) }, // query
                {
                    $set: {
                        live_status: 3,
                        vod_link: vodUrl,
                    },
                },
                {
                    upsert: false,
                },
            );
        }
    });
}

async function getFeedItem(req, res, next) {
    try {
        const db = req.app.get('db');
        let post = await db.mongo.read.collection('tesla').findOne({
            _id: ObjectId(req.params.id),
        });
        if (!post.length) {
            post = await db.mongo.read.collection('tesla_one_tap_posts').findOne({
                _id: ObjectId(req.params.id),
            });
        }
        // eslint-disable-next-line no-use-before-define
        const sendData = await postAggregator([post], req.user.student_id, db, 0, 1);
        next({
            data: sendData[0] ? sendData[0] : {},
        });
    } catch (error) {
        next(error);
    }
}
async function getFeed(req, res, next) {
    try {
        const db = req.app.get('db');
        let page_number = 0;
        const feed_algo_size = 8;
        const page_size = 10;
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1;
        }

        let with_video_type = 0;
        if (req.query.with_video_type) {
            with_video_type = parseInt(req.query.with_video_type);
        }
        let see_feed = await db.redis.read.zrevrangeAsync(
            'tesla_rank',
            feed_algo_size * page_number,
            feed_algo_size * (page_number + 1),
        );
        const recent_post_size = page_size - see_feed.length;
        let feedranked = [];
        see_feed = _.map(see_feed, (id) => ObjectId(id));
        if (see_feed.length) {
            feedranked = await db.mongo.read
                .collection('tesla')
                .find({
                    _id: {
                        $in: see_feed,
                    },
                })
                .toArray();
        }
        const postsData = await db.mongo.read
            .collection('tesla')
            .find({
                is_active: true,
                is_deleted: false,
            })
            .sort({
                _id: -1,
            })
            .skip(page_number * recent_post_size)
            .limit(recent_post_size)
            .toArray();

        // eslint-disable-next-line no-use-before-define
        const sendData = await postAggregator(
            feedranked.concat(postsData),
            req.user.student_id,
            db,
            0,
            with_video_type,
        );

        next({
            data: sendData,
        });
    } catch (error) {
        next(error);
    }
}
async function saveVisibilityData(req, res, next) {
    try {
        const db = req.app.get('db');
        db.mongo.write.collection('teslatracker').save(req.body);

        next({
            data: req.body,
        });
    } catch (error) {
        next(error);
    }
}

async function bookmarkEntity(req, res, next) {
    try {
        const student_id = parseInt(req.user.student_id);
        const { entityId } = req.params;
        const data = {
            student_id,
            entity_id: entityId,
        };
        next({
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function rateEntity(req, res, next) {
    try {
        const student_id = parseInt(req.user.student_id);
        const { entityId } = req.params;
        const data = {
            student_id,
            entity_id: entityId,
        };
        next({
            data,
        });
    } catch (error) {
        next(error);
    }
}
function getStudentProfileData(db, student_id, caller_id, region) {
    const promises = [];
    const student_course_sql = 'select ccm.id, course,category from student_course_mapping scm join class_course_mapping ccm on ccm.id = scm.ccm_id where scm.student_id = ? and ccm.category in ("exam","board")';
    promises.push(db.mysql.read.query(student_course_sql, [student_id]));
    let student_data_sql;
    if (region === 'IN') {
        student_data_sql = 'select student_id,student_fname, student_lname, gender, img_url, school_name, country_code, student_username, '
            + 'coaching,lvl, points, redeemable_points, coins, badges, max_daily_streak, banner_img, coins_earned, student_class '
            + 'from students left join gamification_user_meta on student_id = user_id where student_id = ?';
        promises.push(db.mysql.read.query(student_data_sql, [student_id]));
        const follows_sql = 'SELECT count(*) as count FROM user_connections WHERE user_id = ? and is_deleted = 0';
        promises.push(db.mysql.read.query(follows_sql, [student_id]));
        const following_sql = 'SELECT count(*) as count FROM user_connections WHERE connection_id = ? and is_deleted = 0';
        promises.push(db.mysql.read.query(following_sql, [student_id]));
        const is_follower_sql = 'SELECT * from user_connections where user_id = ? and connection_id = ? and is_deleted = 0 ';
        promises.push(db.mysql.read.query(is_follower_sql, [caller_id, student_id]));
    } else {
        // NOT IN --> CURRENTLY US
        student_data_sql = 'select * from students where student_id = ?';
        promises.push(db.mysql.read.query(student_data_sql, [student_id]));
    }
    return promises;
}
async function getProfile(req, res, next) {
    try {
        const db = req.app.get('db');
        const student_id = req.params.studentId;
        let last_srp_qid = null;
        const { version_code } = req.headers;
        const { social_auth_display_count } = req.query;
        const region = req.headers.country || DEFAULT_COUNTRY;
        const examExistClass = [11, 12, 13, 14];
        const boardExistClass = [9, 10, 11, 12];
        const courses = [];

        // const is_verified = await db.mongo.read.collection('verified_users').countDocuments({ student_id: parseInt(student_id), is_verified: true });
        const is_verified = false;
        const [student_course, student_data, follows = [{ count: 0 }], following = [{ count: 0 }], is_follower = []] = await Promise.all(getStudentProfileData(db, student_id, req.user.student_id, region));
        const student_class_display_sql = 'SELECT * FROM class_display_mapping where class = ?';
        const student_class = await db.mysql.read.query(student_class_display_sql, [student_data[0].student_class]);
        // console.log(student_course, student_data, follows, following, is_follower , student_data[0].class, student_class);

        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        student_data[0].student_username = student_data[0].student_username ? student_data[0].student_username.replace(/\s+/g, ' ').trim() : '';
        student_data[0].student_fname = student_data[0].student_fname ? student_data[0].student_fname.replace(/\s+/g, ' ').trim() : '';
        student_data[0].student_lname = student_data[0].student_lname ? student_data[0].student_lname.replace(/\s+/g, ' ').trim() : '';

        student_data[0].display_exam = [];
        const ccmIdList = [];
        student_course.forEach((element) => {
            ccmIdList.push(element.id);
            if (element.category == 'board') {
                student_data[0].display_board = element.course;
            }
            if (element.category == 'exam') {
                student_data[0].display_exam.push(element.course);
            }
        });
        student_data[0].is_verified = !!is_verified;
        student_data[0].follower = following[0].count;
        student_data[0].follows = follows[0].count;
        student_data[0].is_follower = is_follower.length;
        student_data[0].display_class = student_class[0].english;
        student_data[0].display_exam = _.join(student_data[0].display_exam, ',');
        student_data[0].locale = '';

        if (isFreeApp) {
            return next({
                data: student_data[0],
            });
        }
        if ((region === 'IN')) {
            const daily_streak_var = student_data[0].daily_streak || 1;
            const daily_streak = dailyStreakJsonBuilder(daily_streak_var);
            student_data[0].daily_streak_progress = daily_streak;
        }
        let canBeInvitedToGroup = false;
        let studyGroupInviteCtaText = null;
        let canStartPersonalChat = false;
        let personalChatInviteCtaText = null;

        if (version_code >= 878) {
            try {
                const lastPlayedData = await studentRedis.getLastAvailableTopic(student_id, redisClient);
                if (lastPlayedData) {
                    let lastTopicData = JSON.parse(lastPlayedData);
                    if (typeof lastTopicData === 'string') {
                        lastTopicData = JSON.parse(lastTopicData);
                    }
                    if (lastTopicData.question_id) {
                        last_srp_qid = lastTopicData.question_id;
                        studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', student_id, 1);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        }
        if (student_id !== req.user.student_id) {
            if (version_code >= 946) {
                canStartPersonalChat = true;
                canBeInvitedToGroup = true;
                studyGroupInviteCtaText = (req.user.locale === 'hi' ? 'स्टडी ग्रुप में आमंत्रित करें' : 'Invite to Study Group');
                personalChatInviteCtaText = (req.user.locale === 'hi' ? 'चैट' : 'Chat');
            } else if (version_code >= 898) {
                const isStudyGroup = await isStudyGroupEnabled(req);
                canBeInvitedToGroup = isStudyGroup.isGroupExist;
                studyGroupInviteCtaText = (req.user.locale === 'hi' ? 'स्टडी ग्रुप में आमंत्रित करें' : 'Invite to Study Group');
            }
        }
        student_data[0].last_srp_qid = last_srp_qid;
        student_data[0].can_be_invited_to_group = canBeInvitedToGroup;
        student_data[0].study_group_invite_cta_text = studyGroupInviteCtaText;
        student_data[0].can_start_personal_chat = canStartPersonalChat;
        student_data[0].personal_chat_invite_cta_text = personalChatInviteCtaText;

        if (!boardExistClass.includes(parseInt(student_data[0].student_class))) {
            student_data[0].display_board = '';
        }

        if (+version_code >= 976 && student_class && student_class.length && student_class[0].class && +student_class[0].class !== 14) {
            const [userCategory, userActiveCourses, startTime] = await Promise.all([
                freeLiveClassHelper.getUserEngageCategory(+student_id),
                CourseContainer.getUserActivePackages(db, student_id),
                redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, +student_id, 'LIVECLASS_VIDEO_LF_ET_TRIAL_DISCOUNT_CARD'),
            ]);

            const timeStamp = moment().add(5, 'h').add(30, 'minutes').unix();
            let trailCardStatus = true;
            if (startTime && (timeStamp - (+startTime)) > 0) {
                trailCardStatus = false;
            }
            if (trailCardStatus && (!userActiveCourses || !userActiveCourses.length)) {
                student_data[0].trial_discount_card = freeLiveClassHelper.getUserTrailAndDiscountCouponCard(userCategory);
                if (student_data[0].trial_discount_card) {
                    student_data[0].trial_discount_card.layout_config.margin_left = 12;
                    student_data[0].trial_discount_card.layout_config.margin_right = 12;
                    if (!startTime) {
                        const startCardTime = moment().add(7, 'days').add(5, 'h').add(30, 'minutes')
                            .unix();
                        redisAnswer.setUserLiveClassWatchedVideo(db.redis.read, +student_id, startCardTime, 'LIVECLASS_VIDEO_LF_ET_TRIAL_DISCOUNT_CARD');
                    }
                }
            }
        }

        if (version_code >= 922) {
            const { campaign } = req.user;
            student_data[0].popular_courses = null;
            let campaignScreenTypes = [];
            if (!_.isNull(campaign) && !_.isUndefined(campaign)) {
                campaignScreenTypes = await BranchContainer.getScreenTypeByCampaign(db, campaign);
                campaignScreenTypes = campaignScreenTypes.map((x) => x.screen_type);
            }
            if (!campaignScreenTypes.includes('Profile')) {
                student_data[0].popular_courses = await teslaHelper.getTopVideosBySubject(db, student_id, req.user.student_class || 12, req.user.locale || 'en', ccmIdList, version_code);
            }

            if (campaignScreenTypes.includes('Profile') || (!campaignScreenTypes.includes('Profile') && !student_data[0].popular_courses)) {
                let popularCourseItems = await CourseHelper.getPaidAssortmentsData({
                    db,
                    studentClass: req.user.student_class,
                    config: req.app.get('config'),
                    versionCode: version_code,
                    studentId: parseInt(student_id),
                    studentLocale: req.user.locale,
                    xAuthToken: req.headers['x-auth-token'],
                    page: 'PROFILE',
                    eventPage: 'PROFILE',
                    pznElasticSearchInstance: req.app.get('pznElasticSearchInstance'),
                });
                popularCourseItems = popularCourseItems && popularCourseItems.items ? popularCourseItems.items : [];
                const popularCourseWidget = {
                    widget_type: 'widget_parent',
                    widget_data: {
                        title: req.user.locale === 'hi' ? 'लोकप्रिय कोर्सेस' : 'Popular Courses',
                        link_text: '',
                        deeplink: '',
                        items: popularCourseItems,
                    },
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                };
                if (!_.isEmpty(popularCourseItems)) {
                    courses.push(popularCourseWidget);
                }
                student_data[0].popular_courses = courses.length > 0 ? courses : null;
            }
        }

        if (!examExistClass.includes(parseInt(student_data[0].student_class))) {
            student_data[0].display_exam = '';
        } else {
            const examList = await classCourseMappingMysql.getActiveExams(db.mysql.read, student_data[0].student_class);
            const dispExam = student_data[0].display_exam.indexOf(',') > -1 ? student_data[0].display_exam.split(',') : [student_data[0].display_exam];
            if (examList.length > 0) {
                let flag = 0;
                examList.forEach((x) => {
                    if (flag === 0 && dispExam.includes(x.course)) {
                        flag = 1;
                    }
                });

                if (flag === 0) {
                    student_data[0].display_exam = '';
                }
            }
        }

        if (social_auth_display_count < Data.social_auth_profile_page_display_count_max && !req.user.is_email_verified) {
            student_data[0].popup_deeplink = 'doubtnutapp://google_auth';
        }
        if (student_data.length === 0 || _.isNull(student_data[0])) {
            return next({
                message: 'Invalid profile',
                status: 3,
                isPublic: true,
            });
        }

        // setting default image as empty on profile page
        student_data[0].img_url = '';

        next({
            data: student_data[0],
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

async function getUserPosts(req, res, next) {
    try {
        const db = req.app.get('db');
        const student_id = parseInt(req.params.studentId);
        let page_number = 0;
        const page_size = 10;
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1;
        }
        const postsData = await db.mongo.read
            .collection('tesla')
            .find({
                student_id,
                is_deleted: false,
            })
            .sort({
                _id: -1,
            })
            .skip(page_number * page_size)
            .limit(page_size)
            .toArray();
        // eslint-disable-next-line no-use-before-define
        const sendData = await postAggregator(
            postsData,
            req.user.student_id,
            db,
            0,
            1,
        );
        next({
            data: sendData,
        });
    } catch (error) {
        next(error);
    }
}
async function getBookmarkedPosts(req, res, next) {
    try {
        next({
            data: [],
        });
    } catch (error) {
        next(error);
    }
}
async function follow(req, res, next) {
    try {
        const db = req.app.get('db');
        const is_follower_sql = 'SELECT *    from user_connections where user_id = ? and connection_id = ? ';
        const is_follower = await db.mysql.read.query(is_follower_sql, [
            req.user.student_id,
            req.body.student_id,
        ]);
        const data = {
            user_id: req.user.student_id,
            connection_type: 'Follow',
            connection_id: req.body.student_id,
        };
        let is_deleted = 0;
        if (is_follower.length) {
            if (req.body.connection_type.toLowerCase() == 'unfollow') {
                is_deleted = 1;
            }
            const update_sql = 'UPDATE user_connections SET is_deleted = ?    WHERE     id = ? ';
            await db.mysql.write.query(update_sql, [
                is_deleted,
                is_follower[0].id,
            ]);
        } else {
            const follow_sql = 'INSERT INTO user_connections SET ?';
            await db.mysql.write.query(follow_sql, data);
            // eslint-disable-next-line no-undef
            let popularStudents = PopularStudents.getPopularStudents(user_id, db);
            // eslint-disable-next-line camelcase
            // eslint-disable-next-line no-undef
            const index = popularStudents.findIndex(({ student_id }) => student_id === connection_id);
            popularStudents = popularStudents.splice(index, 1);
            // eslint-disable-next-line no-undef
            PopularStudents.updatePopularStudents(user_id, popularStudents, db);
        }
        next({
            data,
        });
    } catch (error) {
        next(error);
    }
}

async function postAggregator(
    postData,
    student_id,
    db,
    is_bookmark_data,
    with_video_type,
) {
    const sendData = [];
    student_id = parseInt(student_id);
    for (const elem of postData) {
        let post = elem;
        if (is_bookmark_data) {
            post = elem.entity[0];
        }
        if (
            post
            && (with_video_type || post.type !== 'video')
            && (!is_bookmark_data || post.is_deleted == false) && post.type !== 'live'
        ) {
            const student_data_sql = 'select * from students left join gamification_user_meta on student_id = user_id where student_id = ?';
            let student_data = db.mysql.read.query(student_data_sql, [
                post.student_id,
            ]);
            let old_entity_comments;
            let comments = CommentContainer.getCommentCount('new_feed_type', post._id, Comment, db);
            if (post.old_entity_id) {
                old_entity_comments = CommentContainer.getCommentCount(post.old_entity_type, post.old_entity_id, Comment, db);
            }
            let recentComment = CommentContainer.getTopComment('new_feed_type', post._id, Comment, db);
            console.log(recentComment);

            const is_follower_sql = 'SELECT *    from user_connections where user_id = ? and connection_id = ? and is_deleted = 0 ';
            // eslint-disable-next-line no-await-in-loop
            student_data = await student_data;
            // eslint-disable-next-line no-await-in-loop
            comments = await comments;
            // eslint-disable-next-line no-await-in-loop
            recentComment = await recentComment;
            if (post.old_entity_id) {
                // eslint-disable-next-line no-await-in-loop
                old_entity_comments = await old_entity_comments;
            } else {
                old_entity_comments = 0;
            }
            // eslint-disable-next-line no-await-in-loop
            const is_follower = await db.mysql.read.query(is_follower_sql, [
                student_id,
                post.student_id,
            ]);
            if (!_.isEmpty(student_data[0].student_fname)) {
                student_data[0].student_username = student_data[0].student_fname;

                if (!_.isEmpty(student_data[0].student_lname)) {
                    student_data[0].student_username = `${student_data[0].student_fname}`
                        + ' '
                        + `${student_data[0].student_lname}`;
                }
            }
            const student_meta = {
                student_username: student_data[0].student_username,
                student_exam: student_data[0].ex_board,
                student_school: student_data[0].school_name,
                student_level: student_data[0].lvl,
                student_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5359795C-30F7-7F07-8B72-134AF38E02D5.webp',
                student_vip: 'status',
                follow_relationship: is_follower.length,
            };
            const engagment_meta = {
                like_count: 0,
                bookmarked_count: 0,
                comment_count: comments + old_entity_comments,
                share_count: 0,
                is_liked: 0,
                is_starred: 0,
                featured_comment: recentComment[0],
            };
            if (!post.attachment) {
                post.attachment = [];
            }
            post.created_at = moment(ObjectId(post._id).getTimestamp())
                .utcOffset(330)
                .format();
            post.cdn_url = CDN_URL;
            sendData.push({
                ...post,
                ...student_meta,
                ...engagment_meta,
            });
        }
    }
    return sendData;
}
async function deletePost(req, res, next) {
    try {
        const db = req.app.get('db');
        const response = await db.mongo.read.collection('tesla').updateOne(
            {
                _id: ObjectId(req.body.post_id),
                student_id: parseInt(req.user.student_id),
            },
            {
                $set: {
                    is_deleted: true,
                },
            },
        );
        if (response.matchedCount === 0) {
            await db.mongo.read.collection('tesla_one_tap_posts').updateOne(
                {
                    _id: ObjectId(req.body.post_id),
                    student_id: parseInt(req.user.student_id),
                },
                {
                    $set: {
                        is_deleted: true,
                    },
                },
            );
        }
        next({
            data: 'success',
        });
    } catch (error) {
        next(error);
    }
}

// prevTime is minutes
function getObjectId(prevTime) {
    const now = new Date();
    now.setTime(now.getTime() - 1000 * 60 * prevTime);
    return `${Math.floor(now.getTime() / 1000).toString(16)}0000000000000000`;
}

async function reportPost(req, res, next) {
    try {
        const db = req.app.get('db');
        const data = {
            student_id: parseInt(req.user.student_id),
            entity_id: ObjectId(req.body.post_id),
        };
        // ADMINS are Moderators, a report by them leads to a direct BAN
        const admins = [
            7232, // Aditya Shankar
            666, // Umang sharma
            4413678, // Parth
            28075529, // Sanjeev
            25787005, // Charmi
            13098982, // Aditya Pathak
            122775514, // mohit
            24593286, // amar
            19211105, // mukesh
            40350141, // ankur
            24593113, // rohan
            72487696, // sumant
            19412426, // gt
            8306072, //   Vikas Pal
            45917205, // Shubham Kumar
            60385821, // Sachin
            62298148, // Sandeep
            81692214, // Vaibhav
        ];
        await db.mongo.write.collection('tesla_reports').findAndModify(
            data, // query
            [['_id', 'desc']], // sort order
            {
                $set: {
                    reason: req.body.reason,
                },
            },
            {
                upsert: true,
            },
        );

        const isAdmin = admins.includes(data.student_id);
        const reportCount = await db.mongo.read.collection('tesla_reports').countDocuments({ entity_id: ObjectId(req.body.post_id) });
        if (reportCount > 5 || isAdmin) {
            // Ban User If Report Count > 3
            const post = await db.mongo.read.collection('tesla').findOne({ _id: ObjectId(req.body.post_id) });
            if (post) {
                // Check if banned Manually or Auto
                if (isAdmin) {
                    await BannedUser.banUserByAdmin(db.mysql.write, post.student_id, data.student_id);
                } else {
                    await banner.banUser(db, post.student_id);
                }
            }
            await db.mongo.write.collection('tesla').findOneAndUpdate(
                { _id: ObjectId(req.body.post_id) }, // query
                {
                    $set: {
                        is_banned: true,
                        is_deleted: true,
                    },
                },
            );

            // remove 1 day previous posts
            const prevDayObjectID = getObjectId(24 * 60);
            console.log(prevDayObjectID, post.student_id);
            await db.mongo.write.collection('tesla').updateMany(
                {
                    student_id: post.student_id,
                    _id: { $gt: ObjectId(prevDayObjectID) },
                },
                {
                    $set: {
                        reason: req.body.reason,
                        is_banned: true,
                        is_deleted: true,
                    },
                },
            );
        }
        next({
            data,
        });
    } catch (error) {
        next(error);
    }
}
async function labelData(req, res, next) {
    try {
        const db = req.app.get('db');
        let page_number = 0;
        const page_size = 100;
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1;
        }
        const labelsData = await db.mongo.read.collection('tesla_label').find().sort({
            _id: 1,
        })
            .skip(page_number * page_size)
            .limit(page_size)
            .toArray();
        for (const elem of labelsData) {
            elem.labelString = elem.label.reduce((concat_string, current_label) => `${concat_string} ${current_label.description} ${current_label.score} `, '');
            elem.imagebox = `<img src="${elem.image}" alt="Smiley face" height="200" width="200">`;
            delete elem.label;
            delete elem.image;
        }

        res.set('Content-Type', 'text/html');
        // eslint-disable-next-line no-buffer-constructor
        res.send(new Buffer(json2table(labelsData, 'table')));
    } catch (error) {
        next(error);
    }
}
async function checkUgc(req, res, next) {
    try {
        const db = req.app.get('db');
        let page_number = 0;
        const page_size = 100;
        if (req.query.page) {
            page_number = parseInt(req.query.page) - 1;
        }
        const ugc_table = req.query.ugc;
        const { student_id } = req.query;

        const labelsData = await db.mongo.read.collection(ugc_table).find({ student_id }).sort({
            _id: -1,
        })
            .skip(page_number * page_size)
            .limit(page_size)
            .toArray();
        res.set('Content-Type', 'text/html');
        // eslint-disable-next-line no-buffer-constructor
        res.send(new Buffer(json2table(labelsData, 'table')));
    } catch (error) {
        next(error);
    }
}
async function markSelfie(req, res, next) {
    try {
        // const db = req.app.get('db');
        // TO DO
        next({});
    } catch (error) {
        next(error);
    }
}

async function createPostMeta(req, res, next) {
    const meta = {
        image: [
            'Question',
            'Puzzle',
            'Selfie',
            'Meme',
            'Shayari',
            'Joke',
            'Formula Sheet',
            'Exam Paper',
            ' Practice Question',
            'Class Note',
            'Home Work',
            'Report Card',
            'Drawing',
            'Painting',
            'Handwriting',
            'Tips and Tricks',
            'Announcements',
            'Other',
        ],
        pdf: [
            ' Previous Paper',
            'Model Question Paper',
            'Formula Sheet',
            'Class Note',
            ' Exam Paper',
            'Solution PDF',
            'Tips and Tricks',
            'NCERT Chapter',
            'CBSE Chapter',
            'Announcements',
            'Books',
            'Other',
        ],
        link: [
            'Education',
            'News',
            'Funny',
            'Others',
        ],
        video: [
            'Tik Tok',
            'Practice Problem',
            'NCERT Solution',
            'CBSE Solution',
            'Tips and Tricks',
            'Motivational',
            'News',
            'Others',
        ],
        live: [
            'Maths',
            'Physics',
            'Chemistry',
        ],
    };
    next({ data: { topic: meta } });
}
async function topicpost(req, res, next) {
    next({ data: [] });
}

async function requestVerification(req, res, next) {
    const db = req.app.get('db');
    const { student_id } = req.user;
    const { reason } = req.body;

    await db.mongo.write.collection('verified_users').findOneAndUpdate(
        { student_id }, // query
        {
            $set: {
                student_id,
                reason,
                is_verified: false,
            },
        },
        {
            upsert: true,
        }, // options
        (err, object) => {
            if (err) {
                console.warn(err.message);
            } else {
                console.dir(object);
            }
        },
    );
    const data = {
        verification_title: 'Verification Submitted',
        verification_subtitle: 'Aapka Verifiication Request Doubtnut Team ko mil chuka hai. Hum usse review karege aur aapko update kiya jaega!',
    };
    next({ data });
}
async function isVerified(req, res, next) {
    const db = req.app.get('db');
    const { student_id } = req.user;
    const student_verified_record = await db.mongo.read.collection('verified_users').find({ student_id }).toArray();
    let data = {};
    if (student_verified_record.length) {
        if (student_verified_record[0].is_verified) {
            data = {
                is_verified: true,
                can_verify: false,
                verification_title: 'Verify your Profile',
                verification_subtitle: 'Doubtnut Community pe LIVE class lene ke liye Verified Creator baniye aur apne followers badhaiye!',
            };
        } else if (student_verified_record[0].is_rejected) {
            data = {
                is_verified: false,
                can_verify: false,
                verification_title: 'Verification Rejected',
                verification_subtitle: 'Aapka Doubtnut Profile does not follow our Community Guidelines. Isliye hum aapka Verification Request approve nahi kar paye hai.',
            };
        } else {
            data = {
                is_verified: false,
                can_verify: false,
                verification_title: 'Verify your Profile',
                verification_subtitle: 'Doubtnut Community pe LIVE class lene ke liye Verified Creator baniye aur apne followers badhaiye!',
            };
        }
    } else {
        data = {
            is_verified: false,
            can_verify: true,
            verification_title: 'Verify your Profile',
            verification_subtitle: 'Doubtnut Community pe LIVE class lene ke liye Verified Creator baniye aur apne followers badhaiye!',
        };
    }
    next({ data });
}
// async function viewerCount(req, res, next) {
//     const streamId = req.params.postId;
//     const nowTime = moment().unix();
//     const pastMax = moment().unix() - (21000);
//     const start = moment.unix(pastMax).format('YYYY-MM-DD HH:mm:SS');
//     const end = moment.unix(nowTime).format('YYYY-MM-DD HH:mm:SS');

//     const config = req.app.get('config');
//     const secretID = config.tencent_secret_id;
//     const secretKey = config.tencent_secret_key;

//     const LiveClient = tencentcloud.live.v20180801.Client;
//     const models = tencentcloud.live.v20180801.Models;

//     const { Credential } = tencentcloud.common;
//     const { ClientProfile } = tencentcloud.common;
//     const { HttpProfile } = tencentcloud.common;

//     const cred = new Credential(secretID, secretKey);
//     const httpProfile = new HttpProfile();
//     httpProfile.endpoint = 'live.tencentcloudapi.com';

//     const clientProfile = new ClientProfile();
//     clientProfile.httpProfile = httpProfile;
//     const client = new LiveClient(cred, 'ap-mumbai', clientProfile);
//     const req1 = new models.DescribeStreamPlayInfoListRequest();
//     const params = `{"StreamName":"${streamId}","StartTime":"${start}","EndTime":"${end}"}`;
//     req1.from_json_string(params);
//     client.DescribeStreamPushInfoList(req1, (errMsg, response) => {
//         if (errMsg) {
//             console.log(errMsg);
//             return;
//         }

//         console.log(response);
//     });
// }

async function joinLivePost(req, res, next) {
    const db = req.app.get('db');
    const { postId } = req.params;
    // Update Redis
    await db.redis.write.multi()
        .incrby(`viewer_count_${postId}`, 1)
        .expireat(`viewer_count_${postId}`, parseInt((+new Date()) / 1000) + hash_expiry)
        .execAsync();
    next({ data: 'Updated Count' });
}

async function leftLivePost(req, res, next) {
    const db = req.app.get('db');
    const { postId } = req.params;
    // Update Redis
    await db.redis.write.multi()
        .incrby(`viewer_count_${postId}`, -1)
        .expireat(`viewer_count_${postId}`, parseInt((+new Date()) / 1000) + hash_expiry)
        .execAsync();
    next({ data: 'Updated Count' });
}

async function viewerCountOnPost(req, res, next) {
    const db = req.app.get('db');
    const { postId } = req.params;
    const post = await db.mongo.read.collection('tesla').findOne({
        _id: ObjectId(postId),
    });
    let count;
    if (post.live_status == 3) {
        count = -1;
    } else {
        count = await db.redis.read.getAsync(`viewer_count_${postId}`);
        if (!count) {
            count = 0;
        }
    }

    next({ data: { count: parseInt(count) } });
}

async function getGamePost(req, res, next) {
    try {
        const db = req.app.get('db');
        const studentID = req.user.student_id;
        const { gameId } = req.params;
        const redisKey = `games_daily_${studentID}_${gameId}`;
        const is_exist = await db.redis.read.getAsync(redisKey);
        let responseData = null;
        if (!GAME_POST_ID.includes(parseInt(gameId))) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    post_posted: false,
                    msg: 'Game not eligible for Post',
                },
            };
        } else if (is_exist) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    post_posted: false,
                    msg: 'Posted Once Already',
                },
            };
        } else {
            // const { version_code: versionCode } = req.headers;
            const game = await GamesMysql.getGameByID(db.mysql.read, gameId);
            const data = {
                msg: GAME_POST_MSG_ARRAY[Math.floor(Math.random() * (GAME_POST_MSG_ARRAY.length))],
                type: 'dn_activity',
                student_id: studentID,
                image_url: game[0].image_url,
                activity_type: 'game',
                event_name: 'games_click',
                activity_title: `${game[0].title}`,
                deeplink: encodeURI(`doubtnutapp://games?game_title=${game[0].title}&game_url=${(_.isNull(game[0].download_url) || game[0].download_url.length === 0) ? game[0].fallback_url : game[0].download_url}&game_id=${game[0].id}`),
                show_button: false,
                show_play: false,
                disable_lcsf_bar: true,
                is_active: true,
                is_deleted: false,
                game_id: parseInt(gameId),
            };

            await db.mongo.write.collection('tesla_games').save(data);
            // Expires at End of Day
            const todayEnd = new Date().setHours(23, 59, 59, 999);
            await db.redis.write.multi()
                .set(redisKey, 'PlayedAlready')
                .expireat(redisKey, parseInt(todayEnd / 1000))
                .execAsync();

            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    post_posted: true,
                    msg: 'New Game Post Published',
                },
            };
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

async function getPostCreateStatus(req, res, next) {
    try {
        const { student_id: studentId } = req.user;
        let showSticky = false;
        let showTopButton = false;
        if (studentId == 122775514) {
            showSticky = true;
        }
        if (studentId == 119342424) {
            showTopButton = true;
        }
        if (studentId == 62298148) {
            showSticky = true;
            showTopButton = true;
        }
        next({ data: { create_sticky: showSticky, create_button_top: showTopButton } });
    } catch (err) {
        next(err);
    }
}

async function getOneTapTemplate(posts) {
    const items = [];
    for (let i = 0; i < posts.length; i++) {
        const imageWidgetObj = {
            widget_type: 'image_card',
            widget_data: {
                id: posts[i].id,
                title: 'Post',
                title_bg_color: '#ea532c',
                title_text_color: '#ffffff',
                title_alignment: 'bottom',
                corner_radius: 4,
                card_width: 2.0,
                scale_type: 'FIT_XY',
                is_circle: false,
                image_url: posts[i].img_url,
            },
        };
        items.push(imageWidgetObj);
    }
    return items;
}

async function getOneTapPosts(req, res, next) {
    try {
        const paginationLimitOfPosts = 10;
        const db = req.app.get('db');
        const studentClass = req.user.student_class;
        const { locale } = req.user;
        const { version_code: versionCode } = req.headers;
        let { page } = req.query;
        const { carousel_type: carouselType } = req.query;
        page = parseInt(page);
        const start = page * paginationLimitOfPosts;
        let items;
        if (carouselType === 'activity_based') {
            items = await getActivityBasedWidget(req, paginationLimitOfPosts, start);
        } else {
            const oneTapPostData = await OneTapPosts.getActiveOneTapPosts(db.mysql.read, versionCode, studentClass, locale, paginationLimitOfPosts, start, carouselType);
            items = await getOneTapTemplate(oneTapPostData);
        }
        if (_.isEmpty(items)) {
            page = null;
        } else {
            page++;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                message: 'Successful',
                title: 'Share with friends',
                page,
                widgets: [
                    {
                        widget_type: 'widget_parent',
                        layout_config: {
                            margin_top: 5,
                            margin_right: 0,
                            margin_left: 0,
                        },
                        widget_data: {
                            scroll_direction: 'grid',
                            grid_span_count: 2,
                            items,
                            widget_type: 'widget_parent',
                            order: 1,
                        },
                    }],
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

async function postOneTapPosts(req, res, next) {
    try {
        let message = 'Successfully posted!';
        let deeplink = 'doubtnutapp://feeds';
        const db = req.app.get('db');
        const { post_id: postId } = req.body;
        const redisKey = `TOTAL_ACT_POST_${postId}_${req.user.student_id}`;
        const totalPostedCount = await db.redis.read.getAsync(redisKey);
        if (!totalPostedCount || totalPostedCount < 2) {
            const oneTapPostData = await OneTapPosts.getImageUrl(db.mysql.read, postId);
            if (oneTapPostData.length) {
                const imageUrl = oneTapPostData[0].img_url;
                const imageNameIndex = imageUrl.lastIndexOf('/') + 1;
                await db.mongo.write.collection('tesla_one_tap_posts').insertOne({
                    msg: '',
                    type: 'image',
                    student_id: req.user.student_id,
                    is_deleted: false,
                    is_profane: false,
                    is_active: true,
                    attachment: [imageUrl.substr(imageNameIndex)],
                    cdn_url: imageUrl.substr(0, imageNameIndex),
                });
                await db.redis.write.multi()
                    .incrby(redisKey, 1)
                    .expireat(redisKey, parseInt((+new Date()) / 1000) + hash_expiry)
                    .execAsync();
            }
        } else {
            message = 'You have already posted this. Try again tomorrow';
            deeplink = null;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                message,
                deeplink,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

module.exports = {
    getSigned,
    postFeed,
    getFeedItem,
    getFeed,
    saveVisibilityData,
    bookmarkEntity,
    rateEntity,
    getProfile,
    getUserPosts,
    getBookmarkedPosts,
    follow,
    deletePost,
    reportPost,
    labelData,
    markSelfie,
    createPostMeta,
    topicpost,
    checkUgc,
    getLiveStreamUrl,
    endStream,
    requestVerification,
    isVerified,
    joinLivePost,
    leftLivePost,
    viewerCountOnPost,
    getGamePost,
    getPostCreateStatus,
    getStudentProfileData,
    getOneTapPosts,
    postOneTapPosts,
};
