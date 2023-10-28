/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const bluebird = require('bluebird');
require('../../../modules/mongo/comment');
const mongoose = require('mongoose');

bluebird.promisifyAll(mongoose);
const StudentContainer = require('../../../modules/containers/student');

const CDN_URL = 'https://d10lpgp6xz60nq.cloudfront.net/images/';
const { recommended_sqlpost_formatter, sqlpost_formatter } = require('./tesla.utils');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');

// const { cricket_widget_data } = require('./tesla.data');

// function getCurrentEpochInSecs() {
//     // start time already in utc for games
//     const epochInMillis = moment();
//     // .add(5, 'hours').add(30, 'minutes').valueOf();
//     return epochInMillis / 1000;
// }

// function formatStartMatchTime(epochInSecs) {
//     const date = new Date((epochInSecs + 19800) * 1000);

//     let hours = date.getHours();
//     const minutes = date.getMinutes().toString().padStart(2, 0);
//     const ampm = hours >= 12 ? 'pm' : 'am';
//     hours %= 12;
//     hours = hours || 12; // the hour '0' should be '12'

//     const formattedDate = `${date.getDate().toString().padStart(2, 0)}/${(date.getMonth() + 1).toString().padStart(2, 0)}/${date.getFullYear().toString().slice(2)} (${hours}:${minutes} ${ampm})`;

//     return formattedDate;
// }
// async function getCricketScoreWidget(db) {
//     try {
//         const matchData = await db.mongo.read.collection('cricket_ipl').find({}).sort({ start_at: 1 }).toArray();
//         const currEpochInSecs = getCurrentEpochInSecs();

//         const recentMatches = matchData
//             .filter((match) => (match.start_at < currEpochInSecs) && match.match_result)
//             .map((match) => {
//                 match.match_status = 'Recent';
//                 return match;
//             }).reverse();
//         const liveMatches = matchData
//             .filter((match) => (match.start_at < currEpochInSecs) && !match.match_result)
//             .map((match) => {
//                 match.match_status = 'Live';
//                 match.team_one_score = '0/0 in 0';
//                 match.team_two_score = '0/0 in 0';
//                 match.match_result = 'Refreshing';
//                 return match;
//             });

//         let upcomingMatches = matchData.filter((match) => match.start_at > currEpochInSecs);
//         upcomingMatches = upcomingMatches.map((match) => {
//             match.match_result = formatStartMatchTime(match.start_at);
//             match.match_status = 'Upcoming';
//             match.team_one_score = 'Yet to start';
//             match.team_two_score = 'Yet to start';

//             return match;
//         });

//         const widget = _.cloneDeep(cricket_widget_data);
//         widget.widget_data.items.Recent = recentMatches;
//         widget.widget_data.items.Upcoming = upcomingMatches;
//         if (liveMatches.length) {
//             const liveTab = {
//                 key: 'Live',
//                 title: 'Live',
//                 is_selected: true,
//             };
//             widget.widget_data.tabs.splice(1, 0, liveTab);
//             widget.widget_data.tabs[0].is_selected = false;

//             widget.widget_data.items.Live = liveMatches;
//             widget.widget_data.widget_room_id = liveMatches[0].key;
//         }
//         return widget;
//     } catch (err) {
//         return null;
//     }
// }

async function postDataFetcher(post,
    student_id,
    db) {
    let entity_id;
    if (typeof post._id === 'string' && post._id.toString().includes('_pinned')) {
        entity_id = post._id;
    } else if (typeof post._id === 'string' && post._id.toString().includes('_engagement')) {
        entity_id = post._id;
    } else if (typeof post._id === 'string' && post._id.toString().includes('_recommended')) {
        entity_id = post._id;
    } else if (typeof post._id === 'string' && post._id.toString().includes('whatsappadmin')) {
        entity_id = post._id;
    } else {
        entity_id = ObjectId(post._id);
        post.created_at = moment(ObjectId(post._id).getTimestamp())
            .utcOffset(330)
            .format();
    }

    // const [studentData, gamificationMeta] = await Promise.all([
    //     StudentContainer.getById(post.student_id, db),
    //     GamificationMysql.getGamificationUserMeta(db.mysql.read, post.student_id),
    // ]);
    const studentData = await StudentContainer.getById(post.student_id, db);
    if (studentData[0]) {
        studentData[0].img_url = buildStaticCdnUrl(studentData[0].img_url);
    }
    // let old_entity_comments;
    // let comments = CommentContainer.getCommentCount('new_feed_type', post._id, Comment, db);
    // if (post.old_entity_id) {
    //     old_entity_comments = CommentContainer.getCommentCount(post.old_entity_type, post.old_entity_id, Comment, db);
    // }
    // let recentComment = CommentContainer.getTopComment('new_feed_type', post._id, Comment, db);

    let is_booked = false;
    let booked_count = 0;
    let viewer_count = 0;
    if (post.type === 'live') {
        let is_paid_by_user = db.mongo.read.collection('tesla_payments').find({ student_id: parseInt(student_id), post_id: post._id.toString(), is_paid: true }).toArray();

        booked_count = db.mongo.read.collection('tesla_payments').countDocuments({
            post_id: post._id.toString(), is_paid: true,
        });
        viewer_count = db.redis.read.getAsync(`viewer_count_${post._id}`);
        is_paid_by_user = await is_paid_by_user;
        booked_count = await booked_count;
        viewer_count = await viewer_count;
        if (is_paid_by_user.length) {
            is_booked = true;
        }
    }
    let is_verified = await db.mongo.read.collection('verified_users').countDocuments({ student_id: parseInt(post.student_id), is_verified: true });

    //  const is_follower_sql = 'SELECT *  from user_connections where user_id = ? and connection_id = ? and is_deleted = 0 ';
    // comments = await comments;
    // recentComment = await recentComment;
    // recentComment = recentComment.map((comment) => {
    //     // comment.student_avatar = buildStaticCdnUrl(comment.student_avatar);
    //     comment.student_avatar = null;
    //     return comment;
    // });
    // if (post.old_entity_id) {
    //     old_entity_comments = await old_entity_comments;
    // } else {
    //     old_entity_comments = 0;
    // }
    // let is_follower = db.mysql.read.query(is_follower_sql, [
    //     student_id,
    //     post.student_id,
    // ]);
    // is_follower = await is_follower;
    is_verified = await is_verified;
    try {
        if (studentData[0] && !_.isEmpty(studentData[0].student_fname)) {
            studentData[0].student_username = studentData[0].student_fname;

            if (!_.isEmpty(studentData[0].student_lname)) {
                studentData[0].student_username = `${studentData[0].student_fname}`
                    + ' '
                    + `${studentData[0].student_lname}`;
            }
        }
        const student_meta = {
            is_verified: !!is_verified,
            student_username: studentData[0].student_username,
            student_exam: studentData[0].ex_board,
            student_school: studentData[0].school_name,
            student_level: null,
            student_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5359795C-30F7-7F07-8B72-134AF38E02D5.webp',
            student_vip: 'status',
            follow_relationship: 0,
        };
        const engagment_meta = {
            like_count: 0,
            bookmarked_count: 0,
            // comment_count: comments + old_entity_comments,
            comment_count: 0,
            share_count: 0,
            is_liked: 0,
            is_starred: 0,
            // featured_comment: recentComment[0],
            featured_comment: null,
            show_comments: false,
            is_booked,
            booked_count,
            viewer_count: parseInt(viewer_count),
        };
        if (!post.attachment) {
            post.attachment = [];
        }
        if (!post.cdn_url) {
            post.cdn_url = buildStaticCdnUrl(CDN_URL);
        }
        if (post.widget_type === 'banner_image') {
            return {
                widget_type: 'banner_image',
                widget_data: {
                    ...post,
                    ...student_meta,
                    ...engagment_meta,
                },
            };
        }
        return {
            widget_type: 'feed_post',
            widget_data: {
                ...post,
                ...student_meta,
                ...engagment_meta,
            },
        };
    } catch (e) {
        console.log(post);
        console.log(e);
    }
}
async function postAggregator(
    postData,
    student_id,
    db,
    is_bookmark_data,
    config,
    version_code = 602,
    supportedMediaList,
) {
    let sendData = [];

    try {
        student_id = parseInt(student_id);
        const promises = [];

        for (const elem of postData) {
            let post = elem;
            // CHECK
            // IF dn_activity && live class && classes 6th-9th dont show
            if ((parseInt(version_code) <= 776 && post.type)
                && (post.type === 'dn_activity' && post.activity_type === 'live_class')
            ) {
                continue;
            }
            if (is_bookmark_data) {
                post = elem.entity[0];
                if (typeof elem.entity_id === 'string' && elem.entity_id.includes('_pinned_experiment')) {
                    const pinned_id = elem.entity_id.replace(/_pinned_experiment/g, '');
                    const pinned_sql = 'select * from  pinned_post_experiments where id = ?';
                    const pinned = await db.mysql.read.query(pinned_sql, [pinned_id]);
                    post = await sqlpost_formatter(db, pinned[0], 'pinned_experiment', student_id, supportedMediaList, version_code, config);
                } else if (typeof elem.entity_id === 'string' && elem.entity_id.includes('_pinned')) {
                    const pinned_id = elem.entity_id.replace(/_pinned/g, '');
                    const pinned_sql = 'select * from  pinned_post where id = ?';
                    const pinned = await db.mysql.read.query(pinned_sql, [pinned_id]);
                    post = await sqlpost_formatter(db, pinned[0], 'pinned', student_id, supportedMediaList, version_code, config);
                } else if (typeof elem.entity_id === 'string' && elem.entity_id.includes('_engagement')) {
                    const engagement_id = elem.entity_id.replace(/_engagement/g, '');
                    const engagementPostSql = `SELECT 'doubtnut'  as student_username,'${config.logo_path}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE  id = ${engagement_id}`;
                    const engagementData = await db.mysql.read.query(engagementPostSql);
                    post = await sqlpost_formatter(db, engagementData[0], 'engagement', student_id, supportedMediaList, version_code, config);
                } else if (typeof elem.entity_id === 'string' && elem.entity_id.includes('_recommended')) {
                    const question_id = elem.entity_id.replace(/_recommended/g, '');
                    post = await recommended_sqlpost_formatter(db, { id: question_id, title: 'Saved Video' }, supportedMediaList, version_code, config);
                }
            }
            if (
                post
                && (!is_bookmark_data || post.is_deleted == false)
            ) {
                promises.push(postDataFetcher(post, student_id,
                    db));
            }
        }
        sendData = await Promise.all(promises);
        sendData = sendData.filter((post) => {
            if (post) return post;
            return 0;
        });
        if (sendData) {
            for (let i = 0; i < sendData.length; i++) {
                if (sendData[i].widget_data.attachment_compressed && sendData[i].widget_data.attachment && sendData[i].widget_data.attachment_compressed.length === sendData[i].widget_data.attachment.length) {
                    sendData[i].widget_data.attachment = sendData[i].widget_data.attachment_compressed;
                }
            }
        }
        sendData = _.orderBy(sendData, ['widget_data.created_at'], ['desc']);
        return sendData;
    } catch (error) {
        console.log(error);
    }
}

/**
 *
 * @param {*} postsData
 * @param { user , query } req
 * @param {db object} db
 * @param {*} config
 * @param {*} version_code
 * @param {*} supportedMediaList
 * @param {*} page_number
 */
async function getSendData(postsData, { user, query }, db, config, version_code, supportedMediaList, page_number) {
    let sendData = [];
    if (postsData.length) {
        sendData = await postAggregator(
            // (feedranked.concat(postsData)).concat(dn_activity),
            postsData,
            user.student_id,
            db,
            0,
            config,
            version_code,
            supportedMediaList,
        );
        if (version_code < 987) {
            if (!(parseInt(user.student_id) % 4)) {
                const bountyQuestionSql = "select bpd.*, count(bad.answer_id) as answer_count, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username, c.img_url, 'question' as tag, 'all' as type, now() as curr_time from (select * from (SELECT * FROM `bounty_post_detail` WHERE is_delete = 0 and is_active = 1 and is_answered=0 order by bounty_id desc limit 150) as t1 order by rand() limit 1) bpd join bounty_answer_detail bad on bpd.bounty_id = bad.bounty_id join students c on bpd.student_id = c.student_id";
                const BountyQuestion = await db.mysql.read.query(bountyQuestionSql);
                if (BountyQuestion.length) {
                    BountyQuestion[0].time_left = moment(BountyQuestion[0].expired_at).diff(BountyQuestion[0].curr_time);
                    sendData.splice(3, 0, { widget_type: 'bounty_question_widget', widget_data: BountyQuestion[0] });
                }
            }
        }
    }
    if (query.source !== 'home' && page_number === 0 && parseInt(version_code) > 738) {
        // const livePostsData = await db.mongo.read.collection('tesla').find({ type: 'live', is_deleted: false, live_status: { $lt: 3 } }).sort({ live_status: 1, _id: -1 }).limit(5)
        //     .toArray();
        const livePostsData = [];
        if (livePostsData.length) {
            const livePostFeedData = await postAggregator(
                livePostsData,
                user.student_id,
                db,
                0,
                1,
                version_code,
                supportedMediaList,
            );
            const carousel = {};
            carousel.items = livePostFeedData.map((elem) => {
                // console.log('elem')
                // console.log(elem)
                const mappedObject = {
                    title: elem.widget_data.msg,
                    subtitle: elem.widget_data.topic,
                    show_whatsapp: false,
                    show_video: false,
                    image_url: (elem.widget_data.attachment && elem.widget_data.attachment.length) ? `${elem.widget_data.cdn_url}${elem.widget_data.attachment[0]}` : elem.widget_data.student_image_url,
                    card_width: '2.5x',
                    deeplink: `doubtnutapp://post_detail?post_id=${elem.widget_data._id}`,
                    aspect_ratio: '',
                    id: elem.widget_data._id,
                };
                return mappedObject;
            });
            carousel.deeplink = 'doubtnutapp://feed_liveposts?type=upcoming';
            if (livePostsData[0].live_status === 1) {
                carousel.deeplink = 'doubtnutapp://feed_liveposts?type=live';
            }
            carousel.title = 'Live Posts';
            carousel.show_view_all = 1;
            sendData.splice(3, 0, {
                widget_type: 'horizontal_list',
                widget_data: carousel,
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
            });
        }
    }

    // if ((page_number == 0 && postsData.length) && (parseInt(version_code) >= 992)) {
    //     const cricketScoreWidget = await getCricketScoreWidget(db);
    //     if (cricketScoreWidget) {
    //         sendData.unshift(cricketScoreWidget);
    //     }
    // }
    return sendData;
}

async function getPostionForFeedCarousel(db) {
    const feedSql = 'select type, carousel_position from feed_caraousel where type in (\'COURSES\',\'NUDGE\',\'TRENDING_EXAM\',\'TRENDING_BOARD\') order by carousel_position ';
    const feedCarousel = await db.mysql.read.query(feedSql);
    return feedCarousel;
}

module.exports = {
    getSendData,
    postAggregator,
    getPostionForFeedCarousel,
};
