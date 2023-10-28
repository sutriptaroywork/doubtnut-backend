/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const { ObjectId } = require('mongodb');
// or ObjectID
const CDN_URL = 'https://d10lpgp6xz60nq.cloudfront.net/images/';
const bluebird = require('bluebird');
require('../../../modules/mongo/comment');
const mongoose = require('mongoose');
const moment = require('moment');
const zlib = require('zlib');

bluebird.promisifyAll(mongoose);
const jsonToTable = require('json-to-table');
const { Parser } = require('json2csv');
const md5 = require('md5');
const logger = require('../../../config/winston').winstonLogger;

const Utility = require('../../../modules/utility');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const Data = require('../../../data/data');
const { getHomeCarousels, addPostPurchaseExplainer } = require('./feed.helper');
// const GamificationMysql = require('../../../modules/mysql/gamification');
// const DoubtPeCharchaHelper = require('../../helpers/doubtPeCharcha');
const Coursev2Container = require('../../../modules/containers/coursev2');
const IconsHelperV1 = require('../../v1/icons/icons.helper');
const {
    sqlpost_formatter, getIconsDetails, getPinnedPosts, getPinnedPostsV2,
    recommended_sqlpost_formatter, getEngagementPosts, getPopularWidget, getPopularStudentWidget,
} = require('./tesla.utils');
const { getSendData, postAggregator, getPostionForFeedCarousel } = require('./tesla.bl');

const iconsMysql = require('../../../modules/mysql/icons');
const courseMysql = require('../../../modules/mysql/course');
const iconHelper = require('../../helpers/icons');
const redisClient = require('../../../config/redis');
const studentRedis = require('../../../modules/redis/student');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
// eslint-disable-next-line no-unused-vars
const liveclassData = require('../../../data/liveclass.data');
const DoubtfeedMysql = require('../../../modules/mysql/doubtfeed');
const scholarshipHelper = require('../../v1/scholarship/scholarship.helper');
// eslint-disable-next-line no-unused-vars
const StudyTimer = require('../../v1/studyTimer/studyTimer.controller');

const { isStudyGroupEnabled } = require('../../v1/studyGroup/studyGroup.controller');
const StudentContainer = require('../../../modules/containers/student');
const CourseContainer = require('../../../modules/containers/coursev2');
const CourseHelper = require('../../helpers/course');
const { autoScrollTime } = require('../../../data/data');
const redisQuestionContainer = require('../../../modules/redis/question');
const OneTapPosts = require('../../../modules/mysql/oneTapPosts');
const { packageMapping } = require('../../../data/alt-app');
const { unsubscribeMatch } = require('./cricket.helper');
const microService = require('../../../modules/microservice');
const dnExamRewardsHelper = require('../../v1/dn_exam_rewards/dn_exam_rewards.helper');
const CampaignMysql = require('../../../modules/mysql/campaign');
const { getCarouselsForFeed } = require('./feed.carousel.helper')

async function getOneTapPostTemplate(posts) {
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

async function getOneTapPostsForFeed(req, totalPosts, carouselType) {
    try {
        const db = req.app.get('db');
        const studentClass = req.user.student_class;
        const { locale } = req.user;
        const { version_code: versionCode } = req.headers;
        const oneTapPostData = await OneTapPosts.getActiveOneTapPosts(db.mysql.read, versionCode, studentClass, locale, totalPosts, 0, carouselType);
        if (_.isEmpty(oneTapPostData)) {
            return {};
        }
        const items = await getOneTapPostTemplate(oneTapPostData);
        return {
            widget_type: 'widget_parent',
            layout_config: {
                margin_top: 10,
                margin_right: 0,
                margin_left: 0,
            },
            widget_data: {
                title: 'Share with your friends',
                deeplink: `doubtnutapp://one_tap_posts_list?carousel_type=${carouselType}`,
                subtitle: 'You can post your thoughts!',
                subtitle_text_color: '#999999',
                is_title_bold: true,
                link_text: 'View All',
                text_one_size: '19',
                text_icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/84A17AE6-3DEE-D5B7-11D7-408FE4B9180E.webp',
                items,
            },
        };
    } catch (err) {
        console.log(err);
        return {};
    }
}

async function getActivityBasedWidget(req, totalPosts, offset) {
    try {
        let items = {};
        const db = req.app.get('db');
        const data = { message: 'Reinstalling Rewarding Student' };
        const postUrl = '/api/dnr/achieved-activities';
        const { version_code: versionCode } = req.headers;
        const activitiesData = await microService.requestMicroServer(postUrl, data, req.headers['x-auth-token'], versionCode);
        if (activitiesData && activitiesData.data) {
            const carouselTypeList = Object.keys(activitiesData.data.data);
            carouselTypeList.push('activity_based');
            console.log(carouselTypeList, ' allAchieved');
            const oneTapPostData = await OneTapPosts.getCarouselTypeWisePosts(db.mysql.read, carouselTypeList.join("','"), totalPosts, offset);
            items = await getOneTapPostTemplate(oneTapPostData, 'activity_based');
        }
        return items;
    } catch (err) {
        console.log(err);
        return {};
    }
}

async function getCompleteStructureActivityPost(req, totalPosts, offset) {
    const items = await getActivityBasedWidget(req, totalPosts, offset);
    return {
        widget_type: 'widget_parent',
        layout_config: {
            margin_top: 10,
            margin_right: 0,
            margin_left: 0,
        },
        widget_data: {
            title: 'Share with your friends',
            deeplink: 'doubtnutapp://one_tap_posts_list?carousel_type=activity_based',
            subtitle: 'You can post your thoughts!',
            subtitle_text_color: '#999999',
            is_title_bold: true,
            link_text: 'View All',
            text_one_size: '19',
            text_icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/84A17AE6-3DEE-D5B7-11D7-408FE4B9180E.webp',
            items,
        },
    };
}

async function getFeedItem(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id } = req.user;
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        let { supported_media_type } = req.query;
        // Fix For Android Side Missing ParamsNew
        supported_media_type = supported_media_type || 'DASH%2CHLS%2CRTMP%2CBLOB%2CYOUTUBE';
        supported_media_type = decodeURIComponent(supported_media_type);
        let supportedMediaList = [];
        if (supported_media_type) {
            supportedMediaList = _.split(supported_media_type, ',');
        }
        let post;
        if (typeof req.params.id === 'string' && req.params.id.includes('_pinned_experiment')) {
            const pinned_id = req.params.id.replace(/_pinned_experiment/g, '');
            const pinned_sql = `select * from  pinned_post_experiments where id = ${pinned_id}`;
            const pinned = await db.mysql.read.query(pinned_sql);
            post = await sqlpost_formatter(db, pinned[0], 'pinned_experiment', student_id, supportedMediaList, version_code, config);
        } else if (typeof req.params.id === 'string' && req.params.id.includes('_pinned')) {
            const pinned_id = req.params.id.replace(/_pinned/g, '');
            const pinned_sql = `select * from  pinned_post where id = ${pinned_id}`;
            const pinned = await db.mysql.read.query(pinned_sql);
            post = await sqlpost_formatter(db, pinned[0], 'pinned', student_id, supportedMediaList, version_code, config);
        } else if (typeof req.params.id === 'string' && req.params.id.includes('_engagement')) {
            const engagement_id = req.params.id.replace(/_engagement/g, '');
            const engagementPostSql = `SELECT 'doubtnut'  as student_username,'${config.logo_path}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE  id = ${engagement_id}`;
            const engagementData = await db.mysql.read.query(engagementPostSql);
            post = await sqlpost_formatter(db, engagementData[0], 'engagement', student_id, supportedMediaList, version_code, config);
        } else if (typeof req.params.id === 'string' && req.params.id.includes('_recommended')) {
            const question_id = req.params.id.replace(/_recommended/g, '');
            post = await recommended_sqlpost_formatter(db, { id: question_id, title: 'Saved Video' }, supportedMediaList, version_code, config);
        } else {
            post = {};
        }
        const sendData = await postAggregator([post], req.user.student_id, db, 0, 1, config, version_code, supportedMediaList);
        next({
            data: sendData[0] ? sendData[0] : {},
        });
    } catch (error) {
        next(error);
    }
}

// async function getPostsFromBucket(db, bucketName, pageNumber, pageSize, offsetCursor, versionCode) {
//     try {
//         const query = (versionCode < 783)
//             ? {}
//             : { _id: { $lt: ObjectId(offsetCursor) } };
//         Object.assign(query, { is_active: true, is_deleted: false });
//         return db
//             .collection(bucketName)
//             .find(query)
//             .sort({
//                 _id: -1,
//             })
//             .skip(pageNumber * pageSize)
//             .limit(pageSize)
//             .toArray();
//     } catch (e) {
//         logger.warn('Tesla Mongo Fetch', e);
//         return [];
//     }
// }

async function getBirthdayPostsFromBucket(db, bucketName, pageNumber, pageSize, offsetCursor, versionCode, studentId) {
    try {
        const query = (versionCode < 783)
            ? { visible_to: studentId }
            : { _id: { $lt: ObjectId(offsetCursor) }, visible_to: studentId };
        Object.assign(query, { is_active: true, is_deleted: false });
        return db
            .collection(bucketName)
            .find(query)
            .sort({
                _id: -1,
            })
            .skip(pageNumber * pageSize)
            .limit(pageSize)
            .toArray();
    } catch (e) {
        // logger.warn('Tesla Mongo Fetch', e);
        return [];
    }
}

async function getOneTapPostsFromBucket(db, pageNumber, pageSize, offsetCursor) {
    try {
        const query = { _id: { $lt: ObjectId(offsetCursor) } };
        Object.assign(query, { is_active: true, is_deleted: false });
        return db
            .collection('tesla_one_tap_posts')
            .find(query)
            .sort({
                _id: -1,
            })
            .skip(pageNumber * pageSize)
            .limit(pageSize)
            .toArray();
    } catch (e) {
        // logger.warn('Tesla Mongo Fetch', e);
        return [];
    }
}

async function getCouponCodePostForCampaignUsers(db, pageNumber, pageSize, offsetCursor) {
    try {
        console.log('getting feed coupon code post');
        const query = { _id: { $lt: ObjectId(offsetCursor) } };
        Object.assign(query, { is_active: true, is_deleted: false });
        return db
            .collection('feed_coupon_code_post')
            .find(query)
            .sort({
                _id: -1,
            })
            .skip(pageNumber * pageSize)
            .limit(pageSize)
            .toArray();
    } catch (e) {
        // logger.warn('Tesla Mongo Fetch', e);
        return [];
    }
}

async function getFeed(req, res, next) {
    try {
        const db = req.app.get('db');
        const { mobile } = req.user;
        const { campaign } = req.user;
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        let page_number = 0;
        let { student_class } = req.user;
        const { isDropper } = req.user;
        const { student_id } = req.user;
        const registeredDate = new Date(req.user.timestamp);
        if (_.isNull(student_class)) {
            student_class = 12;
        }
        // eslint-disable-next-line prefer-const
        let { version_code, flagr_variation_ids } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        let supportedMediaList = req.query.supported_media_type;
        supportedMediaList = decodeURIComponent(supportedMediaList);
        if (supportedMediaList) {
            supportedMediaList = _.split(supportedMediaList, ',');
        }
        const config = req.app.get('config');
        const student_locale = req.user.locale;
        const featureIds = _.split(flagr_variation_ids, ',');
        let flagVariants = [];
        flagVariants.push(Data.defaultFlagVariantsForHomepage);
        if (featureIds) {
            if (Array.isArray(featureIds)) {
                flagVariants = [...flagVariants, ...featureIds];
            } else {
                flagVariants.push(featureIds);
            }
        }
        // const page_size = 10;
        const { force_show_all_categories: forceShowAllCategories } = req.query;
        if (req.query.page) {
            page_number = +req.query.page - 1;
        }
        let { offsetCursor } = req.query;
        if (!offsetCursor) {
            offsetCursor = `${Math.floor(new Date().getTime() / 1000).toString(16)}0000000000000000`;
        }

        // checking if user is campaign user
        let campaignUser = false;
        if (req.user.campaign) {
            const campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Feed');
            if (!_.isEmpty(campaignDetails)) {
                campaignUser = true;
            }
        }

        let postsData = [];
        const packageValue = (!_.isEmpty(req.headers.package_name)) ? packageMapping[req.headers.package_name] : 'default';

        let carouselsData = [];
        let feedCarouselData = [];
        let showHomepageCategories = false;
        //* * On Home Page Zero  Send Only Carousels **//
        const userHomepageVisitCount = await studentRedis.getUserHomepageVisitCount(db.redis.read, student_id);
        if (userHomepageVisitCount && !_.isNull(userHomepageVisitCount)) {
            if (+userHomepageVisitCount !== -1) {
                studentRedis.updateUserHomepageVisitCount(db.redis.write, student_id);
            }
        } else {
            studentRedis.setUserHomepageVisitCount(db.redis.write, student_id, 1);
        }
        if (req.query.source === 'home' && page_number === 0) {
            const data = {};
            data.student_id = +student_id;
            showHomepageCategories = version_code >= 955;
            carouselsData = await getHomeCarousels(db, config, student_id, version_code, flagVariants, student_class, student_locale, req.query, req.headers, isDropper, pznElasticSearchInstance, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, req.query.user_assortment, packageValue, campaign);
            if (req.headers.country && req.headers.country.toLowerCase() !== 'us') {
                const promise = [];
                promise.push(Utility.getPersonalizedHomePageUsingVariantAttachment({ endpoint: Data.userGetMostClickedWidget }, data));
                const resolvedPromises = await Promise.all(promise);
                const newCourousalData = [];
                if (resolvedPromises[0] && resolvedPromises[0].data && resolvedPromises[0].data.length) {
                    const d = resolvedPromises[0].data;
                    for (let j = 0; j < d.length; j++) {
                        const a = carouselsData.find((el) => el.widget_data._id.toString() === d[j]);
                        if (_.isObject(a)) {
                            newCourousalData.push(a);
                        }
                    }
                    for (let k = 0; k < carouselsData.length; k++) {
                        if (carouselsData[k].widget_data._id && !d.includes(carouselsData[k].widget_data._id.toString())) {
                            newCourousalData.push(carouselsData[k]);
                        }
                    }
                    carouselsData = newCourousalData;
                }
            }

            if (student_locale !== 'hi') {
                const hindiLiveClassIndex = carouselsData.findIndex((x) => (x && x.widget_data && x.widget_data.carousel_id ? x.widget_data.carousel_id === 903 : false));
                const englishLiveClassIndex = carouselsData.findIndex((x) => (x && x.widget_data && x.widget_data.carousel_id ? x.widget_data.carousel_id === 902 : false));
                const b = carouselsData[hindiLiveClassIndex];
                carouselsData[hindiLiveClassIndex] = carouselsData[englishLiveClassIndex];
                carouselsData[englishLiveClassIndex] = b;
            }
        } else if (packageValue === 'default') {
            const checkForCampaign = await CampaignMysql.getFeedCarouselCampaign(db.mysql.read, campaign);
            // Home Page Non Zero Page Set Page Counter to -1 to Offset Carousel Page//
            if (req.query.source === 'home') {
                page_number -= 1;
            }

            if (!Utility.disableFeedForAltApp(req.headers) && req.query.source !== 'home') {
                // Fetch All Posts , Pinned , Engagement ,Recommended
                const promises = [];

                // disabling tesla posts
                // promises.push(getPostsFromBucket(db.mongo.read, 'tesla', page_number, page_size, offsetCursor, version_code));
                let couponCodePosts = [];
                if (campaignUser) {
                    couponCodePosts = await getCouponCodePostForCampaignUsers(db.mongo.read, page_number, 10, offsetCursor);
                }
                promises.push(getBirthdayPostsFromBucket(db.mongo.read, 'tesla_birthday', page_number, 10, offsetCursor, version_code, student_id));
                promises.push(getOneTapPostsFromBucket(db.mongo.read, page_number, 10, offsetCursor));
                promises.push(getEngagementPosts(config, db, student_class, page_number, student_id, supportedMediaList, version_code));
                promises.push(getPinnedPosts(db, student_class, student_id, supportedMediaList, version_code, config, page_number));
                // promises.push(getRecommendedWidgets(req, student_id, page_number, db, config, student_locale, version_code, supportedMediaList, student_class));
                const [birthdayPost, oneTapPost, engagementPosts, pinnedPosts] = await Promise.all(promises);

                postsData = [...couponCodePosts, ...engagementPosts, ...birthdayPost, ...oneTapPost, ...pinnedPosts];
                showHomepageCategories = version_code >= 955;
                if (checkForCampaign.length) {
                    feedCarouselData = await getCarouselsForFeed(db, config, student_id, version_code, flagVariants, student_class, student_locale, req.query, req.headers, isDropper, pznElasticSearchInstance, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, req.query.user_assortment, packageValue, campaign);
                } else {
                    feedCarouselData = [];
                }
            }
        }
        res.locals = {
            carouselsData,
            offsetCursor,
            postsData,
            db,
            config,
            version_code,
            supportedMediaList,
            page_number,
            student_id,
            flagVariants,
            student_class,
            student_locale,
            packageValue,
            showHomepageCategories,
            feedCarouselData,
        };
        next();
    } catch (err) {
        next({ err });
    }
}

async function sendFeedForCountriesIfNecessary(req, res, next) {
    try {
        const { carouselsData, offsetCursor } = res.locals;
        const { headers: { country = null } } = req;
        if (country && country.toLowerCase() === 'us') {
            return next({
                data: { feeddata: [...carouselsData], offsetCursor },
            });
        }
        next();
    } catch (err) {
        next({ err });
    }
}

async function setPostsData(req, res, next) {
    try {
        const {
            offsetCursor, postsData, db, config, version_code, supportedMediaList, page_number, student_id, flagVariants, student_class, student_locale, packageValue, showHomepageCategories, feedCarouselData, 
        } = res.locals;
        let { carouselsData } = res.locals;
        const isWhatsapp = { show: 0, index: -1 };
        let sendData = await getSendData(postsData, req, db, config, version_code, supportedMediaList, page_number);
        const pageSize = sendData.length;
        const newcarouselPosition = await getPostionForFeedCarousel(db)
        let feedCourses;
        let feedNudge;
        let feedTrending;
        for (let i = 0; i < feedCarouselData.length; i++) {
            if (feedCarouselData[i].widget_type) {
                if (feedCarouselData[i].widget_type === 'widget_parent') {
                    feedCourses = feedCarouselData[i]
                }
                else if (feedCarouselData[i].widget_type === 'widget_nudge') {
                    feedNudge = feedCarouselData[i]
                }
            }
            if (feedCarouselData[i].type && feedCarouselData[i].type === 'widget_popular_course') {
                feedTrending = feedCarouselData[i];
            }
        }
        let flagCourse = 1;
        let flagNudge = 1;
        let flagTrend = 1;
        const carouselPosition = [];
        if (newcarouselPosition.length) {
            carouselPosition.push(newcarouselPosition[0])
        }
        for (let i = 1; i < newcarouselPosition.length; i++) {
            if (newcarouselPosition[i].type !== carouselPosition[carouselPosition.length - 1].type && newcarouselPosition[i].carousel_position !== carouselPosition[carouselPosition.length - 1].carousel_position) {
                carouselPosition.push(newcarouselPosition[i])
            }
        }
        if (feedCarouselData.length) {
            for (let i = 0; i < carouselPosition.length; i++) {
                if (carouselPosition[i].carousel_position <= (pageSize * (page_number + 1)) && carouselPosition[i].carousel_position >= (pageSize * (page_number))) {
                    if (carouselPosition[i].type === 'COURSES' && flagCourse === 1) {
                        sendData.splice(carouselPosition[i].carousel_position, 0, feedCourses)
                        flagCourse = 0
                    }
                    else if (carouselPosition[i].type === 'NUDGE' && flagNudge === 1) {
                        sendData.splice(carouselPosition[i].carousel_position, 0, feedNudge)
                        flagNudge = 0
                    }
                    else if ((carouselPosition[i].type === 'TRENDING_EXAM' || carouselPosition[i].type === 'TRENDING_BOARD') && flagTrend === 1) {
                        sendData.splice(carouselPosition[i].carousel_position, 0, feedTrending)
                        flagTrend = 0
                    } else if (flagCourse === 0 && flagNudge === 0 && flagTrend === 0) {
                        break
                    }
                } else {
                    break
                }
            }
        }
        // ADDED Popular Stories Widget PlaceHolder START
        // if (version_code > 838 && +req.query.page === 1 && packageValue === 'default') {
        //     const popularWidget = getPopularWidget();
        //     sendData = sendData.concat(popularWidget);
        // }
        // END
        if (carouselsData[0] === carouselsData[1]) {
            carouselsData = carouselsData.slice(1,carouselsData.length)
        }
        if (sendData.length && version_code >= 1000) {
            const appSocialData = {
                widget_type: 'banner_image',
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                    margin_right: 0,
                    margin_left: 0,
                },
                widget_data: {
                    _id: 'app_social_banner',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/BC2EB3EB-9148-0384-DE47-3F626546B0E1.webp',
                    card_ratio: '31:5',
                },
            };
            if (feedCarouselData.length) {
                sendData.splice(1, 0, appSocialData);
            }
            else {
                sendData.unshift(appSocialData)
            }
        }

        // ADDED Popular student Widget PlaceHolder START
        // if (version_code > 848 && +req.query.page === 1 && !Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers) && packageValue === 'default') {
        //     const popularStudentWidget = getPopularStudentWidget(student_id);
        //     sendData.splice(3, 0, popularStudentWidget);
        //     if (version_code >= 991) {
        //         const oneTapData = await getOneTapPostsForFeed(req, 5, 'auto');
        //         if (oneTapData) {
        //             sendData.splice(3, 0, oneTapData);
        //         }
        //         const activityBasedPosts = await getCompleteStructureActivityPost(req, 5, 0);
        //         if (activityBasedPosts) {
        //             sendData.splice(7, 0, activityBasedPosts);
        //         }
        //     }
        // }
        // END
        if (packageValue !== 'default') {
            return next({
                data: { feeddata: [...carouselsData, ...sendData], offsetCursor },
            });
        }
        // // TODO need to remove this call it gets app banner on feed page
        // if (isFeedForPagesOtherThanHomeRequired(req.query.source, page_number)) {
        //     const homeCarousels = await getHomeCarousels(db, config, student_id, version_code, flagVariants, student_class, student_locale, req.query, req.header);
        //     if (homeCarousels && homeCarousels[0]) {
        //         sendData.splice(3, 0, homeCarousels[0]);
        //     }
        // }

        // TODO Bring It Back On SeparateCall  Iteration Introduced in  New Home Page Experiment ..    Homepage > 783 < Topicon + Homepage
        if (version_code < 783) {
            next({
                data: [...carouselsData, ...sendData],
            });
        } else {
            // TODO Remove home_page_experiment dependancy
            if (req.query.home_page_experiment && req.query.home_page_experiment === 'true' && req.query.source == 'home' && +req.query.page === 1) {
                const xAuthToken = req.headers['x-auth-token'];
                let studentSubscriptionDetails = courseMysql.checkVipV1(db.mysql.read, student_id);
                //* * TODO @sutripto dont do select *  for .length checks Update cacheKeyAlso when You change **//
                let doubtFeedData = DoubtfeedMysql.getDoubtFeedInfo(db.mysql.read, student_id);

                //* * Async Data Collection **//
                studentSubscriptionDetails = await studentSubscriptionDetails;
                doubtFeedData = await doubtFeedData;

                let cacheKey = md5(JSON.stringify({
                    studentSubscriptionDetails, hasDoubtFeedData: !!doubtFeedData.length, student_class, student_locale, version_code,
                }));
                const ncertWatchDetails = await redisQuestionContainer.getNcertLastWatchedDetails(db.redis.read, `ncert_lv_${student_class}`, student_id);
                if (!_.isNull(ncertWatchDetails)) {
                    cacheKey = md5(JSON.stringify({
                        studentSubscriptionDetails, hasDoubtFeedData: !!doubtFeedData.length, student_class, student_locale, ncertWatchDetails, version_code,
                    }));
                }
                let iconsObj = [];

                if (!showHomepageCategories) { // generating top icons only if old homepage
                    const getFromCache = await studentRedis.getUserTopIcons(db.redis.read, student_id, cacheKey);
                    if (!getFromCache) {
                        let iconsList = [];

                        // TODO check if 732 is home_page_experiment flag
                        // eslint-disable-next-line no-shadow
                        const flagVariantsList = [1];
                        if (flagVariants.includes('732')) {
                            flagVariantsList.push(732);
                        }
                        if (version_code >= 940 && flagVariants.includes('1365')) {
                            flagVariantsList.push(1365);
                        }
                        if (version_code >= 943) {
                            flagVariantsList.push(1407);
                        }
                        if (version_code >= 952 && flagVariants.includes('1414')) {
                            flagVariantsList.push(1414);
                        }
                        // TODO TOPICON condition Home page 0
                        if (studentSubscriptionDetails.length === 0) {
                            iconsList = await iconsMysql.getTopIconsByLangVersionVariant(db.mysql.read, student_class, version_code, student_locale, flagVariantsList);
                            if (doubtFeedData.length == 0 && version_code < 921) {
                                iconsList = iconsList.filter((item) => item.feature_type !== 'doubt_feed');
                            } else if (version_code >= 902 && version_code < 921 && !flagVariants.includes('1169')) {
                                iconsList = iconsList.filter((item) => item.feature_type !== 'doubt_feed');
                            } else if (!flagVariants.includes('1169')) {
                                iconsList = iconsList.filter((item) => item.feature_type !== 'doubt_feed');
                            }
                            for (let j = 0; j < iconsList.length; j++) {
                                if (iconsList[j].feature_type.includes('scholarship_test')) {
                                    const type = iconsList[j].feature_type.replace('scholarship_test_', '');
                                    iconsList[j].deeplink = await scholarshipHelper.scholarshipDeeplink(version_code, db, type, req.headers['x-auth-token'], req.user.student_id);
                                }
                                if (iconsList[j].feature_type.includes('dn_exam_rewards')) {
                                    const x = await dnExamRewardsHelper.redirect(student_class, version_code, student_locale, xAuthToken);
                                    iconsList[j].deeplink = await dnExamRewardsHelper.redirect(student_class, version_code, student_locale, xAuthToken);
                                }
                            }
                            iconsList = iconsList.filter((item) => item.feature_type !== 'faq_icon');
                            for (let j = 0; j < iconsList.length; j++) {
                                if (iconsList[j].feature_type === 'topic_booster') {
                                    try {
                                        const lastPlayedData = await studentRedis.getLastAvailableTopic(student_id, redisClient);
                                        // console.log(lastPlayedData, ' lastPlayedData');
                                        if (lastPlayedData) {
                                            // console.log('redis key exist');
                                            let lastTopicData = JSON.parse(lastPlayedData);
                                            if (typeof lastTopicData === 'string') {
                                                lastTopicData = JSON.parse(lastTopicData);
                                            }
                                            // console.log(lastTopicData, ' parsed data', typeof lastTopicData);
                                            // console.log(lastTopicData.question_id, ' parsed data');
                                            if (lastTopicData.question_id && lastTopicData.chapter_alias) {
                                                // console.log('condition matched, can show topic game');
                                                iconsList[j].deeplink = `doubtnutapp://topic_booster_game?qid=${lastTopicData.question_id}`;
                                                studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', student_id, 1);
                                            } else {
                                                iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                            }
                                        } else {
                                            // console.log('Redis key not found');
                                            iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                        }
                                    } catch (e) {
                                        iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                    }
                                } else if (iconsList[j].feature_type === 'studygroup') {
                                    const isStudyGroup = await isStudyGroupEnabled(req);
                                    iconsList[j].deeplink = `doubtnutapp://study_group?is_study_group_exist=${isStudyGroup.isGroupExist}`;
                                } else if (iconsList[j].feature_type === 'gupshup') {
                                    iconsList = iconsList.filter((i) => i.feature_type !== 'gupshup');
                                } else if (iconsList[j].feature_type === 'khelo_jeeto') {
                                    if (version_code >= 916) {
                                        iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                    } else {
                                        try {
                                            iconsList = iconsList.filter((i) => i.feature_type !== 'khelo_jeeto');
                                            const lastPlayedData = await studentRedis.getLastAvailableTopic(student_id, redisClient);
                                            // console.log(lastPlayedData, ' lastPlayedData');
                                            if (lastPlayedData) {
                                                // console.log('redis key exist');
                                                let lastTopicData = JSON.parse(lastPlayedData);
                                                if (typeof lastTopicData === 'string') {
                                                    lastTopicData = JSON.parse(lastTopicData);
                                                }
                                                // console.log(lastTopicData, ' parsed data', typeof lastTopicData);
                                                // console.log(lastTopicData.question_id, ' parsed data');
                                                if (lastTopicData.question_id && lastTopicData.chapter_alias) {
                                                    // console.log('condition matched, can show topic game');
                                                    iconsList[j].deeplink = `doubtnutapp://topic_booster_game?qid=${lastTopicData.question_id}`;
                                                    studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', student_id, 1);
                                                } else {
                                                    iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                                }
                                            } else {
                                                // console.log('Redis key not found');
                                                iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                            }
                                        } catch (e) {
                                            iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                        }
                                    }
                                } else if (iconsList[j].feature_type === 'live_class_home' && version_code >= 901) {
                                    iconsList[j].title = (student_locale === 'hi') ? 'फ्री क्लासेस' : 'Free Classes';
                                } else if (iconsList[j].feature_type === 'external_url' && iconsList[j].title.toLowerCase().includes('whatsapp')) {
                                    // This collection is specially created for home page and consists of last 15days data, hence can be used without cache
                                    // const response = await db.mongo.client.db('whatsappdb')
                                    //     .collection('whatsapp_sessions')
                                    //     .find({ phone: `91${mobile}` }).sort({ updatedAt: -1 })
                                    //     .toArray();
                                    // if (response.length > 0) {
                                    //     if (moment().diff(moment(response[0].updated_at), 'hours') <= 168) {
                                    //         // show top icon
                                    //         if (response.length == 1) {
                                    //             iconsList[j].title = `WhatsApp ${response[0].source}`;
                                    //             if (iconsList[j].deeplink) {
                                    //                 iconsList[j].deeplink = iconsList[j].deeplink.replace('6003008001', response[0].source).replace('8400400400', response[0].source);
                                    //             }
                                    //             isWhatsapp.show = 1;
                                    //             isWhatsapp.index = j;
                                    //         } else {
                                    //             iconsList[j].title = 'WhatsApp 8400400400';
                                    //             if (iconsList[j].deeplink) {
                                    //                 iconsList[j].deeplink = iconsList[j].deeplink.replace('6003008001', '8400400400');
                                    //             }
                                    //         }
                                    //         isWhatsapp.show = 1;
                                    //         isWhatsapp.index = j;
                                    //     }
                                    // } else if (moment().diff(moment(studentCreatedAt), 'hours') <= 168) {
                                    //     // show top icon
                                    //     iconsList[j].title = 'WhatsApp 8400400400';
                                    //     if (iconsList[j].deeplink) {
                                    //         iconsList[j].deeplink = iconsList[j].deeplink.replace('6003008001', '8400400400');
                                    //     }
                                    //     isWhatsapp.show = 1;
                                    //     isWhatsapp.index = j;
                                    // }
                                    iconsList[j].title = 'WhatsApp 8400400400';
                                    if (iconsList[j].deeplink) {
                                        iconsList[j].deeplink = iconsList[j].deeplink.replace('6003008001', '8400400400');
                                    }
                                    isWhatsapp.show = 1;
                                    isWhatsapp.index = j;
                                }
                            }
                            if (isWhatsapp && isWhatsapp.show) {
                                iconsList.splice(1, 0, iconsList.splice(isWhatsapp.index, 1)[0]);
                            }
                            const iitIconIndex = iconsList.findIndex(((obj) => obj.feature_type === 'course_iit'));
                            if (iitIconIndex !== -1) {
                                iconsList[iitIconIndex].title = (student_locale === 'hi') ? 'कोर्स का सुझाव' : 'Recommended Course';
                                iconsList[iitIconIndex].new_link = `${config.staticCDN}engagement_framework/3E61AF2E-30E6-2C6A-A96A-F3D22F539B56.webp`;
                                iconsList[iitIconIndex].deeplink = 'doubtnutapp://course_details?id=xxxx';
                            }
                            const referAndEarnIndex = iconsList.findIndex(((obj) => obj.feature_type === 'schedule'));
                            if (referAndEarnIndex !== -1) {
                                if (version_code >= 988) {
                                    iconsList[referAndEarnIndex].deeplink = 'doubtnutapp://referral';
                                } else {
                                    iconsList[referAndEarnIndex].deeplink = 'doubtnutapp://referral_page';
                                }
                            }
                            let homepageVisitCount = await studentRedis.getUserHomepageVisitCount(db.redis.read, student_id);
                            homepageVisitCount = JSON.parse(homepageVisitCount);
                            const finalResult = [];
                            const courseIcon = [];
                            for (let i = 0; i < iconsList.length; i++) {
                                if (iconsList[i].feature_type === 'live_class_home') {
                                    iconsList[i].deepLink = 'doubtnutapp://library_tab?library_screen_selected_Tab=1';
                                }
                                if (iconsList[i].feature_type !== 'courses') {
                                    finalResult.push(iconsList[i]);
                                } else {
                                    iconsList[i].title = (student_locale === 'hi') ? 'कोर्सेस' : iconsList[i].title;
                                    if (!_.isNull(homepageVisitCount) && +homepageVisitCount === -1) {
                                        courseIcon.push(iconsList[i]);
                                    } else {
                                        finalResult.push(iconsList[i]);
                                    }
                                }
                            }
                            const ceoIcon = await IconsHelperV1.getDnCeoIcon(db, student_id, version_code);
                            const ceoIcons = [];
                            if (ceoIcon) {
                                ceoIcons.push({
                                    id: ceoIcons.icon_id,
                                    title: ceoIcon.title_one,
                                    feature_type: 'dn_ceo',
                                    link: ceoIcon.icon,
                                    new_link: ceoIcon.icon,
                                    deeplink: ceoIcon.deeplink,
                                });
                            }
                            iconsList = [...courseIcon, ...ceoIcons, ...finalResult];
                            // leaderboard data
                            // const base64StudentId = Buffer.from(student_id.toString()).toString('base64');
                            // iconsList = [...[{
                            //     id: 768,
                            //     title: (req.user.locale === 'hi') ? 'डेली क्लास कांटेस्ट' : 'Daily Class Contest',
                            //     position: 4,
                            //     feature_type: 'external_url',
                            //     time: '2021-01-23T21:15:49.000Z',
                            //     is_show: '1',
                            //     link: `${config.staticCDN}engagement_framework/C9A3C1D2-BA05-F4B5-0257-8228D5258B3A.webp`,
                            //     playlist_details: '',
                            //     deeplink: `doubtnutapp://external_url?url=https://doubtnut.com/contest-result?student_id=${base64StudentId}`,
                            // }], ...iconsList];
                        } else {
                            const requestData = {
                                studentId: student_id,
                                versionCode: version_code,
                                studentLocale: student_locale,
                                studentClass: student_class,
                                flagVariants: flagVariantsList,
                                xAuthToken,
                                type: 'new',
                                user_assortment: req.query.user_assortment,
                            };
                            iconsList = await iconHelper.makeIconData(db, config, requestData, true);
                            if (doubtFeedData.length == 0 && version_code < 921) {
                                iconsList = iconsList.filter((item) => item.feature_type !== 'doubt_feed');
                            } else if (version_code >= 902 && version_code < 921 && !flagVariants.includes('1169')) {
                                iconsList = iconsList.filter((item) => item.feature_type !== 'doubt_feed');
                            } else if (!flagVariants.includes('1169')) {
                                iconsList = iconsList.filter((item) => item.feature_type !== 'doubt_feed');
                            }
                            for (let j = 0; j < iconsList.length; j++) {
                                if (iconsList[j].feature_type === 'topic_booster') {
                                    try {
                                        const lastPlayedData = await studentRedis.getLastAvailableTopic(student_id, redisClient);
                                        // console.log(lastPlayedData, ' lastPlayedData');
                                        if (lastPlayedData) {
                                            // console.log('redis key exist');
                                            let lastTopicData = JSON.parse(lastPlayedData);
                                            if (typeof lastTopicData === 'string') {
                                                lastTopicData = JSON.parse(lastTopicData);
                                            }
                                            // console.log(lastTopicData, ' parsed data', typeof lastTopicData);
                                            // console.log(lastTopicData.question_id, ' parsed data');
                                            if (lastTopicData.question_id && lastTopicData.chapter_alias) {
                                                // console.log('condition matched, can show topic game');
                                                iconsList[j].deeplink = `doubtnutapp://topic_booster_game?qid=${lastTopicData.question_id}`;
                                                studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', student_id, 1);
                                            } else {
                                                iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                            }
                                        } else {
                                            // console.log('Redis key not found');
                                            iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                        }
                                    } catch (e) {
                                        iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                    }
                                } else if (iconsList[j].feature_type === 'studygroup') {
                                    const isStudyGroup = await isStudyGroupEnabled(req);
                                    iconsList[j].deeplink = `doubtnutapp://study_group?is_study_group_exist=${isStudyGroup.isGroupExist}`;
                                } else if (iconsList[j].feature_type === 'gupshup') {
                                    iconsList = iconsList.filter((i) => i.feature_type !== 'gupshup');
                                } else if (iconsList[j].feature_type === 'khelo_jeeto') {
                                    if (version_code >= 916) {
                                        iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                    } else {
                                        try {
                                            iconsList = iconsList.filter((i) => i.feature_type !== 'khelo_jeeto');
                                            const lastPlayedData = await studentRedis.getLastAvailableTopic(student_id, redisClient);
                                            // console.log(lastPlayedData, ' lastPlayedData');
                                            if (lastPlayedData) {
                                                // console.log('redis key exist');
                                                let lastTopicData = JSON.parse(lastPlayedData);
                                                if (typeof lastTopicData === 'string') {
                                                    lastTopicData = JSON.parse(lastTopicData);
                                                }
                                                // console.log(lastTopicData, ' parsed data', typeof lastTopicData);
                                                // console.log(lastTopicData.question_id, ' parsed data');
                                                if (lastTopicData.question_id && lastTopicData.chapter_alias) {
                                                    // console.log('condition matched, can show topic game');
                                                    iconsList[j].deeplink = `doubtnutapp://topic_booster_game?qid=${lastTopicData.question_id}`;
                                                    studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', student_id, 1);
                                                } else {
                                                    iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                                }
                                            } else {
                                                // console.log('Redis key not found');
                                                iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                            }
                                        } catch (e) {
                                            iconsList = iconsList.filter((i) => i.feature_type !== 'topic_booster');
                                        }
                                    }
                                } else if (iconsList[j].feature_type === 'external_url' && iconsList[j].title.toLowerCase().includes('whatsapp')) {
                                    iconsList[j].title = 'WhatsApp 8400400400';
                                    if (iconsList[j].deeplink) {
                                        iconsList[j].deeplink = iconsList[j].deeplink.replace('6003008001', '8400400400');
                                    }
                                }
                            }
                        }
                        const dplIconExperimentData = await UtilityFlagr.getFlagrResp({
                            xAuthToken,
                            body: {
                                capabilities: {
                                    dpl_top_icon: {},
                                },
                            },
                        });
                        // console.log('**************************', iconsList);
                        if (version_code >= 943 && _.get(dplIconExperimentData, 'dpl_top_icon.payload.enabled', null)) {
                            const { position } = dplIconExperimentData.dpl_top_icon.payload;
                            const dplIcon = iconsList.filter((i) => i.feature_type === 'dpl');
                            iconsList = iconsList.filter((i) => i.feature_type !== 'dpl');
                            iconsList.splice(position, 0, ...dplIcon);
                        }
                        let showItem = 8;
                        let showViewAll = 0;
                        const iconsDetails = await getIconsDetails(iconsList, carouselsData, student_id, student_class, version_code, db);
                        if (iconsDetails.length > showItem) {
                            showViewAll = 1;
                            const viewAllObj = {
                                id: 0,
                                title: 'View All',
                                icon: Data.viewAllTopIconNewLink,
                                deepLink: '',
                            };
                            if (version_code > 987) {
                                viewAllObj.deepLink = 'doubtnutapp://top_icons?screen=HOME_ALL';
                            }
                            iconsDetails.splice((showItem - 1), 0, viewAllObj);
                        } else {
                            showItem = iconsDetails.length;
                        }
                        iconsObj = [
                            {
                                widget_data: {
                                    show_view_all: showViewAll,
                                    shown_item_count: showItem,
                                    items: iconsDetails,
                                    card_width: '4.5',
                                },
                                widget_type: 'widget_top_option',
                                layout_config: {
                                    margin_top: 16,
                                    bg_color: '#ffffff',
                                },
                                order: -9600,
                            },
                        ];
                        iconsObj[0].widget_data.shown_item_count = 8;
                        iconsObj[0].widget_data.card_width = '4.3';
                        studentRedis.setUserTopIcons(db.redis.write, student_id, cacheKey, iconsObj);
                    } else {
                        //* * Populate From Cache **//
                        iconsObj = JSON.parse(getFromCache);
                    }
                }

                if (version_code > 846) {
                    const bannerArray = [];
                    const items = {};
                    // if (['9', '10', '11', '12', '13', '14'].includes(student_class)) {
                    //     const referralBanner = await CourseMysqlV2.checkForReferralBanner(db.mysql.read, student_id);
                    //     if (referralBanner && referralBanner.length > 0 && moment().diff(moment(referralBanner[0].created_at), 'days') <= 7 && referralBanner[0].referrer_student_id % 2 == 0 && referralBanner[0].referral_amount != 150) {
                    //         bannerArray.push({
                    //             id: 'REFERRAL_PAYTM_HOME',
                    //             image_url: liveclassData.referralPaytmHomePageBanner,
                    //             deeplink: 'doubtnutapp://course_details?id=xxxx&referrer_student_id=',
                    //         });
                    //     }
                    // }
                    if (version_code >= 870) {
                        const addExplainer = await addPostPurchaseExplainer(db, student_id);
                        if (addExplainer) {
                            const item = {};
                            item.deeplink = student_locale === 'hi' ? Data.explainerVideo.deeplink.hi : Data.explainerVideo.deeplink.en;
                            item.image_url = student_locale === 'hi' ? Data.explainerVideo.image_url.hi : Data.explainerVideo.image_url.en;
                            bannerArray.push(item);
                        }
                    }
                    // * Reward banner
                    if (version_code < 907) {
                        const rewardDeeplink = await CourseHelper.getRewardBannerDeeplink(db, student_id);
                        if (!_.isNull(rewardDeeplink) && !req.user.isDropper) {
                            const rewardBannerDetails = await CourseMysqlV2.getBannersFromId(db.mysql.read, [963, 964]);
                            if (rewardBannerDetails.length) {
                                const rewardBanner = student_locale === 'hi' ? rewardBannerDetails[1] || rewardBannerDetails[0] : rewardBannerDetails[0];
                                bannerArray.unshift({
                                    id: rewardBanner.id,
                                    deeplink: rewardDeeplink,
                                    image_url: rewardBanner.image_url,
                                });
                            }
                        }
                    }
                    const testData = await CourseContainer.getScholarshipExams(db);
                    const timeEnd = moment.duration('05:30:00');
                    let showBanner = false;
                    if (testData && testData[0]) {
                        for (let i = 0; i < testData.length; i++) {
                            const bannerEndTime = moment(testData[i].homepage_banner_date).subtract(timeEnd).format();
                            if (moment().isBefore(bannerEndTime)) {
                                showBanner = true;
                                break;
                            }
                        }
                    }
                    if (testData && testData[0] && showBanner) {
                        const isStudentRegisteredForScholarship = await StudentContainer.getStudentScholarshipRegistered(db, student_id);
                        isStudentRegisteredForScholarship.sort((a, b) => b.test_id - a.test_id);
                        if (isStudentRegisteredForScholarship && isStudentRegisteredForScholarship.length) {
                            for (let i = 0; i < isStudentRegisteredForScholarship.length; i++) {
                                // eslint-disable-next-line no-return-assign
                                const thisTestData = testData.filter((e) => e.test_id === isStudentRegisteredForScholarship[i].test_id);
                                if (thisTestData && thisTestData[0]) {
                                    const endTime = moment(thisTestData[0].homepage_banner_date).subtract(timeEnd).format();
                                    if (moment().isBefore(endTime)) {
                                        let subscriptionId = await StudentContainer.getTestSeriesData(db, student_id, isStudentRegisteredForScholarship[i].test_id);
                                        if (subscriptionId && subscriptionId[0]) {
                                            for (let j = 0; j < subscriptionId.length; j++) {
                                                if (subscriptionId && subscriptionId[j] && subscriptionId[j].status === 'COMPLETED') {
                                                    subscriptionId = [subscriptionId[j]];
                                                    break;
                                                }
                                            }
                                        }
                                        let progress;
                                        const { type } = thisTestData[0];
                                        const testDataForDeeplink = [isStudentRegisteredForScholarship[i]];
                                        const deeplink = await scholarshipHelper.scholarshipDeeplink(version_code, db, type, xAuthToken, student_id, testDataForDeeplink, subscriptionId);
                                        if (isStudentRegisteredForScholarship && isStudentRegisteredForScholarship[0] && isStudentRegisteredForScholarship[i].progress_id == 2 && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
                                            progress = 2;
                                        } else if (isStudentRegisteredForScholarship && isStudentRegisteredForScholarship[0] && isStudentRegisteredForScholarship[i].progress_id == 2 && subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
                                            progress = 3;
                                        } else if (isStudentRegisteredForScholarship && isStudentRegisteredForScholarship[0] && isStudentRegisteredForScholarship[i].progress_id == 4) {
                                            progress = 4;
                                        }
                                        const bannerImage = await CourseContainer.getScholarshipAppGeneralBanner(db, isStudentRegisteredForScholarship[i].test_id, student_locale, progress);
                                        if (bannerImage && bannerImage[0] && bannerImage[0].url) {
                                            const banner = {
                                                id: 'SCHOLARSHIP_REGISTERED_BANNER',
                                                deeplink,
                                                image_url: bannerImage[0].url,
                                            };
                                            bannerArray.splice(1, 0, banner);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    // if (version_code >= 906) {
                    //     const p2pObj = new DoubtPeCharchaHelper(req, student_class, student_id, student_locale, db, config, db.mongo);
                    //     const p2pWidget = await p2pObj.getHomeWidget();
                    //     if (!_.isEmpty(p2pWidget)) {
                    //         carouselsData.splice(1, 0, p2pWidget);
                    //     }
                    // }
                    // if (version_code >= 946) {
                    //     const unreadMessage = await unreadMessageWidget(req);
                    //     if (unreadMessage) {
                    //         carouselsData.splice(1, 0, unreadMessage);
                    //     }
                    // }

                    const myCourses = carouselsData.filter((item) => item.widget_type === 'widget_my_courses');
                    const notMyCourses = carouselsData.filter((item) => item.widget_type !== 'widget_my_courses');
                    carouselsData = [...myCourses, ...notMyCourses];
                    if (bannerArray.length > 0) {
                        items.items = bannerArray;
                        items.title = '';
                        items._id = '';
                        items.auto_scroll_time_in_sec = autoScrollTime;
                        items.full_width_cards = true;

                        const bannerObj = {
                            widget_data: items,
                            widget_type: 'carousel_list',
                            layout_config: {
                                margin_top: 2,
                                margin_left: 0,
                                margin_right: 0,
                                margin_bottom: 0,
                            },
                            order: 1,
                        };
                        carouselsData.unshift(bannerObj);

                        const idx = _.findIndex(carouselsData, (o) => (o.widget_type == 'widget_coupon_banner'));
                        if (idx > -1) {
                            const temp = { ...carouselsData[idx] };
                            carouselsData.splice(0, 0, temp);
                            carouselsData.splice(idx + 1, 1);
                        }
                    }

                    if (showHomepageCategories) {
                        const topIcons = carouselsData.filter((item) => ['widget_favourite_explore_card', 'widget_explore_card'].includes(item.type));
                        const rest = carouselsData.filter((item) => !(['widget_favourite_explore_card', 'widget_explore_card'].includes(item.type)));
                        const questionAskesWidgetPosition = myCourses.length + bannerArray.length + topIcons.length; // to set on which position we need to show question asked widget
                        await studentRedis.setQuestionAskedWidgetPosition(db.redis.write, student_id, questionAskesWidgetPosition);

                        return next({
                            data: { feeddata: [...topIcons, ...rest, ...sendData], offsetCursor },
                        });
                    }
                    return next({
                        data: { feeddata: [...iconsObj, ...carouselsData, ...sendData], offsetCursor },
                    });
                }

                return next({
                    data: { feeddata: [...iconsObj, ...carouselsData, ...sendData], offsetCursor },
                });
            }
            next({
                data: { feeddata: [...carouselsData, ...sendData], offsetCursor },
            });
        }
    } catch (err) {
        next({ err });
    }
}


async function getUserPosts(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const student_id = parseInt(req.params.studentId);
        let page_number = 0;
        const page_size = 10;
        let postsData = [];
        let { version_code } = req.headers;
        next({
            data: [],
        });
        // if (!version_code) {
        //     version_code = 602;
        // }
        // let supportedMediaList = req.query.supported_media_type;
        // supportedMediaList = decodeURIComponent(supportedMediaList);
        // if (supportedMediaList) {
        //     supportedMediaList = _.split(supportedMediaList, ',');
        // }
        // if (req.query.page) {
        //     page_number = parseInt(req.query.page) - 1;
        // }
        // if (!Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
        //     if (student_id === 98) {
        //         let { student_class } = req.user;
        //         if (_.isNull(student_class)) {
        //             student_class = 12;
        //         }
        //         const engagementPostSql = `SELECT 'doubtnut'  as student_username,'${config.logo_path}' as profile_image,id,en_correct_option as correct_option,type,en_title as title,en_text as text,case when en_image = '' then null else en_image end as image_url,en_options as options,start_date as created_at,blog_url,question_id,data as action_data,action,poll_category FROM engagement WHERE class in (?,'all') and start_date <= CURRENT_TIMESTAMP and type in ('viral_videos','youtube','news','polling') order by created_at DESC LIMIT ? OFFSET ?`;
        //         const engagementData = await db.mysql.read.query(engagementPostSql, [student_class, page_size, page_number * page_size]);
        //         if (engagementData && engagementData.length) {
        //             try {
        //                 for (let i = 0; i < page_size; i++) {
        //                     const engagementPost = await sqlpost_formatter(db, engagementData[i], 'engagement', student_id, supportedMediaList, version_code, config);
        //                     postsData.push(engagementPost);
        //                 }
        //             } catch (error) {
        //                 // Something Wrong In Data Format
        //                 console.error(error);
        //             }
        //         }
        //     } else {
        //         postsData = await db.mongo.read
        //             .collection('tesla')
        //             .find({
        //                 student_id,
        //                 is_deleted: false,
        //             })
        //             .sort({
        //                 _id: -1,
        //             })
        //             .skip(page_number * page_size)
        //             .limit(page_size)
        //             .toArray();
        //         const oneTapPosts = await db.mongo.read
        //             .collection('tesla_one_tap_posts')
        //             .find({
        //                 student_id,
        //                 is_deleted: false,
        //             })
        //             .sort({
        //                 _id: -1,
        //             })
        //             .skip(page_number * page_size)
        //             .limit(page_size)
        //             .toArray();
        //         Array.prototype.push.apply(postsData, oneTapPosts);
        //     }
        // }
        // const sendData = await postAggregator(
        //     postsData,
        //     req.user.student_id,
        //     db,
        //     0,
        //     1, config, version_code, supportedMediaList,
        // );
        // next({
        //     data: sendData,
        // });
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

async function feedBrowser(req, res) {
    const db = req.app.get('db');
    let {
        // eslint-disable-next-line prefer-const
        type, attachment_count, days, page_size,
    } = req.query;
    let page_number = 0;
    if (req.query.page) {
        page_number = parseInt(req.query.page) - 1;
    }
    if (page_size) {
        page_size = parseInt(page_size);
    } else {
        page_size = 100;
    }

    const data = [];
    const x = data.map((post) => {
        delete post._id;
        if (post.attachment) {
            post.attachment = post.attachment.map((elem) => {
                elem = CDN_URL + elem;
                return elem;
            });
        }

        return post;
    });
    const tabled = jsonToTable(x);
    const fields = tabled.shift();

    const opts = { fields };
    const parser = new Parser(opts);
    const csv = parser.parse(x);
    res.setHeader('Content-disposition', 'attachment; filename=testing.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
}

async function feedStats(req, res, next) {
    const data = [];
    data.push({ _id: 'total', count: 0 });
    next({ data });
}

async function livePosts(req, res, next) {
    next({ data: [] });
}

async function topicpost(req, res, next) {
    next({ data: [] });
}

async function getPinnedPostsWidgets(req, res, next) {
    try {
        const db = req.app.get('db');
        let { student_class } = req.user;
        const { student_id } = req.user;
        let { campaign } = req.user;
        if (_.isNull(student_class)) {
            student_class = 12;
        }
        // eslint-disable-next-line prefer-const
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        let supportedMediaList = req.query.supported_media_type || 'DASH%2CHLS%2CRTMP%2CBLOB%2CYOUTUBE';

        supportedMediaList = decodeURIComponent(supportedMediaList);
        if (supportedMediaList) {
            supportedMediaList = _.split(supportedMediaList, ',');
        }
        const config = req.app.get('config');
        let checkForSpecificCampaign = [];
        checkForSpecificCampaign = await CourseMysqlV2.getCampaignScreenType(db.mysql.read, campaign)
        const widgets = await getPinnedPostsV2(db, student_class, student_id, supportedMediaList, version_code, config, 0);
        let WidgetsWithDeeplink = widgets;

        if ((+version_code) >= 1015 && !checkForSpecificCampaign.length) {
            WidgetsWithDeeplink = widgets.map((w) => {
                w.data.deeplink = `doubtnutapp://video?qid=${w.data.video_obj.question_id}`;
                return w;
            });
        }
        else {
            WidgetsWithDeeplink = []
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                widget_data: {
                    title: WidgetsWithDeeplink.length ? "What's new on Doubtnut!" : "",
                    items: WidgetsWithDeeplink,
                    full_width_cards: true,
                    default_mute: true,
                    auto_play: true,
                    id: '',
                    auto_play_initiation: 200,
                    auto_scroll_time_in_sec: 15,
                },
                widget_type: 'widget_autoplay',
            },
        };
        return res.json(responseData);
    } catch (error) {
        next(error);
    }
}

function rawBody(req, res, next) {
    req.rawBody = '';
    req.chunks = [];

    console.log(req.body);
    req.on('data', (chunk) => {
        req.chunks.push(Buffer.from(chunk));
    });
    req.on('end', () => {
        next();
    });
}

async function webhookCricket(req, res, next) {
    const db = req.app.get('db');
    try {
        // console.log(req.body);
        const buffer = Buffer.concat(req.chunks);
        zlib.unzip(
            buffer,
            // { finishFlush: zlib.constants.Z_SYNC_FLUSH },
            async (err, dataBuffer) => {
                if (!err) {
                    const resData = JSON.parse(dataBuffer.toString()).data;

                    const matchKey = _.get(resData, 'key', 'unknown');
                    const matchStatus = _.get(resData, 'status', 'started');

                    if (matchKey !== 'unkown') {
                        const matchData = {
                            team_one_score: '0/0 in O',
                            team_two_score: '0/0 in O',
                            match_result: 'Yet to Start',
                        };
                        if (resData && resData.toss) {
                            matchData.match_result = `${resData.teams[resData.toss.winner].code} elected to ${resData.toss.elected}`;
                            const finalResult = _.get(resData, 'play.result.msg', null);
                            if (finalResult) {
                                matchData.match_result = finalResult;
                            }
                        }

                        const teamOneScore = _.get(resData, 'play.innings.a_1.score_str', '0/0 in O.0');
                        const teamOneScoreArr = teamOneScore.split('in').map((e) => e.trim());
                        matchData.team_one_score = `(${teamOneScoreArr[1]} ov) ${teamOneScoreArr[0]}`;

                        const teamtwoScore = _.get(resData, 'play.innings.b_1.score_str', '0/0 in O.0');
                        const teamtwoScoreArr = teamtwoScore.split('in').map((e) => e.trim());
                        matchData.team_two_score = `(${teamtwoScoreArr[1]} ov) ${teamtwoScoreArr[0]}`;

                        await db.redis.write.hsetAsync(`IPL:${matchKey}`, 'match_status', matchStatus);
                        await db.redis.write.hsetAsync(`IPL:${matchKey}`, 'match_data', JSON.stringify(matchData));
                        if (matchStatus == 'completed') {
                            console.log('here');
                            await unsubscribeMatch(db, matchKey);
                            await db.redis.write.hsetAsync(`IPL:${matchKey}`, 'match_subscribe_status', 'unsubscribed');
                            await db.mongo.read.collection('cricket_ipl').updateOne(
                                { key: matchKey },
                                {
                                    $set: {
                                        match_result: matchData.match_result,
                                        team_one_score: matchData.team_one_score,
                                        team_two_score: matchData.team_two_score,
                                    },
                                },
                            );
                        }
                        // console.log('Data', resData, typeof (resData));
                    }
                    res.send(JSON.stringify({ status: true }));
                } else {
                    res.send(JSON.stringify({ status: false }));
                }
            },
        );
        // return res.send('hi');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getFeed,
    feedBrowser,
    feedStats,
    getFeedItem,
    getUserPosts,
    getBookmarkedPosts,
    topicpost,
    livePosts,
    setPostsData,
    sendFeedForCountriesIfNecessary,
    getPinnedPostsWidgets,
    rawBody,
    webhookCricket,
    getActivityBasedWidget,
};
