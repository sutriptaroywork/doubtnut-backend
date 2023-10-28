/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const PackageContainer = require('../../modules/containers/package');
const iconsMysql = require('../../modules/mysql/icons');
const CourseMysql = require('../../modules/mysql/coursev2');
const RedisUtil = require('../../modules/redis/utility.redis');
const { buildStaticCdnUrl } = require('./buildStaticCdnUrl');
const UtilityFlagr = require('../../modules/Utility.flagr');
const CourseContainer = require('../../modules/containers/coursev2');
const scholarshipHelper = require('../v1/scholarship/scholarship.helper');
const ExamCornerMysql = require('../../modules/mysql/examCorner');
const StudentRedis = require('../../modules/redis/student');
const StudentMysql = require('../../modules/mysql/student');
// const Utility = require('../../modules/utility');
const IconsHelper = require('../v1/icons/icons.helper');
const Data = require('../../data/data');
const config = require('../../config/config');
const dnExamRewardsHelper = require('../v1/dn_exam_rewards/dn_exam_rewards.helper');
const QuestionMysql = require('../../modules/mysql/question');
const redisQuestionContainer = require('../../modules/redis/question');

async function getEmiReminderIcon(db, config, studentID, type) {
    try {
        // get remaining days of next emi package payment
        const result = await PackageContainer.getActiveEmiPackageAndRemainingDays(db, config, studentID);
        const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        const allUserPackages = await CourseContainer.getUserAllPurchasedPackages(db, studentID);
        const renewalPackages = allUserPackages.filter((e) => ((moment(e.end_date).add(7, 'days') > now && moment(e.end_date) < now) || (moment(e.end_date).subtract(8, 'days') < now && moment(e.end_date) > now)) && e.type === 'subscription' && e.amount > -1);
        const emiData = {
            id: 628,
            title: renewalPackages.length ? 'Renew Now' : 'Pay EMI',
            position: -2,
            feature_type: 'external_url',
            time: '2020-11-29T18:14:09.000Z',
            is_show: '1',
            link: `${config.cdn_url}images/icons/pay-emi.webp`,
            playlist_id: '',
            playlist_title: '',
        };
        if (renewalPackages.length) {
            emiData.external_url = `doubtnutapp://bundle_dialog?assortment_id=${renewalPackages[0].assortment_id}`;
            if (type === 'new') {
                delete emiData.link;
                delete emiData.external_url;
                emiData.new_link = `${config.cdn_url}images/icons/pay-emi.webp`;
                emiData.deeplink = `doubtnutapp://bundle_dialog?id=${renewalPackages[0].assortment_id}`;
            }
            return emiData;
        }
        if (result.length > 0) {
            const masterParent = result[0].master_parent;
            let emiOrder = result[0].emi_order;
            // get next variant
            emiOrder += 1;
            const packageDetails = await PackageContainer.getNextPackageVariant(db, config, masterParent, emiOrder);
            if (packageDetails.length > 0) {
                emiData.external_url = `doubtnutapp://vip?variant_id=${packageDetails[0].variant_id}`;
                if (type === 'new') {
                    delete emiData.link;
                    delete emiData.external_url;
                    emiData.new_link = `${config.cdn_url}images/icons/pay-emi.webp`;
                    emiData.deeplink = `doubtnutapp://vip?variant_id=${packageDetails[0].variant_id}`;
                }
                return emiData;
            }
        }
        return false;
    } catch (e) {
        throw new Error(e);
    }
}

async function getLiveClassIconText(xAuthToken, locale) {
    const flagData = { xAuthToken, body: { capabilities: { liveclass_bottom_icon: {} } } };
    const flagrResponse = await UtilityFlagr.getFlagrResp(flagData);
    const flagrLocale = locale === 'hi' ? 'hi' : 'en';
    let iconText = _.get(flagrResponse, `liveclass_bottom_icon.payload[${flagrLocale}]`, null);
    if (!iconText) {
        iconText = locale === 'hi' ? 'लाइव क्लास' : 'Live Class';
    }
    return iconText;
}

// eslint-disable-next-line no-unused-vars
async function getStudentCategory(db, studentId, studentClass) {
    try {
        const [
            coursesResult,
            categoriesResult,
        ] = await Promise.all([
            CourseMysql.getCoursesClassCourseMapping(db.mysql.read, studentId),
            CourseMysql.getDistinctCategories(db.mysql.read, studentClass),
        ]);
        let courses = coursesResult.reduce((acc, obj) => acc.concat(obj.course), []);
        const categories = categoriesResult.reduce((acc, obj) => acc.concat(obj.id), []);
        const priority = {
            'IIT JEE': 1,
            NEET: 2,
            CBSE: 3,
            BOARD: 4,
        };

        courses.sort((courseA, courseB) => {
            const priorityValueA = courseA in priority ? priority[courseA] : 5;
            const priorityValueB = courseB in priority ? priority[courseB] : 5;
            if (priorityValueA < priorityValueB) {
                return -1;
            }
            if (priorityValueA > priorityValueB) {
                return 1;
            }
            return 0;
        });

        courses = courses.reduce((acc, course) => {
            if (course.includes('CBSE') && categories.includes('CBSE Boards')) {
                acc.push('CBSE Boards');
            } else if (course.includes('Board') && categories.includes('State Boards')) {
                acc.push('State Boards');
            } else {
                const index = categories.findIndex((element) => element.includes(course));
                if (index !== -1) {
                    acc.push(categories[index]);
                }
            }
            return acc;
        }, []);

        return courses.length > 0 ? courses[0] : null;
    } catch (e) {
        console.log(e);
    }
}

// eslint-disable-next-line no-unused-vars
async function makeIconData(db, config, requestData, callFlagr) {
    let [
        data,
        // eslint-disable-next-line prefer-const
        userActivePackages,
    ] = await Promise.all([
        iconsMysql.getTopIconsByLangVersionVariant(db.mysql.read, requestData.studentClass, requestData.versionCode, requestData.studentLocale, requestData.flagVariants),
        CourseMysql.getUserActivePackages(db.mysql.read, requestData.studentId),
    ]);
    const isGupShupUser = await RedisUtil.sismember(db.redis.read, 'gupshup_show', requestData.studentId);
    let bountyFlagIndex = -1;
    let gupshupFlag = -1;
    let examCornerFlag = 0;

    for (let i = 0; i < data.length; i++) {
        if (requestData.type === 'old') {
            delete data[i].deeplink;
            delete data[i].new_link;
        }
        data[i].playlist_id = '';
        data[i].playlist_title = '';
        data[i].external_url = '';
        data[i].is_last = '';
        data[i].link = buildStaticCdnUrl(data[i].link);
        if (data[i].playlist_details.length > 0) {
            const temp = JSON.parse(data[i].playlist_details);
            data[i].playlist_id = temp.playlist_id;
            data[i].playlist_title = temp.name;
            data[i].external_url = temp.external_url ? temp.external_url : '';
            data[i].is_last = temp.is_last;
        }
        if (data[i].feature_type === 'bounty_feed') {
            bountyFlagIndex = i;
        }
        if (data[i].feature_type === 'gupshup' && !isGupShupUser) gupshupFlag = i;
        if (data[i].feature_type === 'schedule') {
            data[i].playlist_details = JSON.stringify({ name: data[i].title, playlist_id: '', external_url: `https://doubtnut.com/referral?sid=${requestData.studentId}` });
            if (requestData.versionCode >= 988) {
                data[i].deeplink = 'doubtnutapp://referral';
            } else {
                data[i].deeplink = 'doubtnutapp://referral_page';
            }
            data[i].external_url = `https://doubtnut.com/referral?sid=${requestData.studentId}`;
        }
        if (data[i].feature_type.includes('scholarship_test')) {
            console.log(data[i].feature_type);
            const type = data[i].feature_type.replace('scholarship_test_', '');
            data[i].deeplink = await scholarshipHelper.scholarshipDeeplink(requestData.versionCode, db, type, requestData.xAuthToken, requestData.studentId);
        }

        if (data[i].feature_type.includes('dn_exam_rewards')) { // DN EXAM REWARDS
            data[i].deeplink = await dnExamRewardsHelper.redirect(requestData.studentClass, requestData.versionCode, requestData.studentlocale, requestData.xAuthToken);
        }
        // check if exam_corner icon is to be shown
        if (data[i].feature_type === 'exam_corner') {
            const { studentId, studentClass } = requestData;
            // check if studentCcmIds available in redis
            let studentCcmIds = await StudentRedis.getStudentCcmIds(db.redis.read, studentId);
            studentCcmIds = JSON.parse(studentCcmIds);
            if (_.isNull(studentCcmIds)) {
                // if not available  in redis getting from mysql and caching in redis
                studentCcmIds = await StudentMysql.getCcmIdbyStudentId(db.mysql.read, studentId);
                studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
                // adding the data to student hset
                StudentRedis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
            }
            // checking if article for any of class or ccm_id is set active on redis
            const promisesData = [];
            promisesData.push(StudentRedis.getExamCornerArticleAvailableByClass(db.redis.read, studentClass));
            for (let index = 0; index < studentCcmIds.length; index++) {
                promisesData.push(StudentRedis.getExamCornerArticleAvailableByCcmId(db.redis.read, studentCcmIds[index]));
            }
            const resolvedPromises = await Promise.all(promisesData);
            let countTrue = resolvedPromises.filter((item) => item === '1').length;
            const countFalse = resolvedPromises.filter((item) => item === '0').length;
            // if any true then Top icon has to be shown
            // if none are true and all are false then not to be shown
            // if data not in redis for some while none are true, then query it from mysql and update in redis

            if (countTrue === 0 && countFalse !== resolvedPromises.length) {
                const result = await ExamCornerMysql.examCornerArticlesForTopIconCheck(db.mysql.read, studentCcmIds, studentClass);
                const trueCcmIds = result.map((item) => item.ccm_id).filter((item) => Boolean(item));
                const falseCcmIds = studentCcmIds.filter((item) => !trueCcmIds.includes(item));

                const isThereAnArticleForTheWholeClass = result.some((item) => item.ccm_id === null);

                if (isThereAnArticleForTheWholeClass) {
                    StudentRedis.setExamCornerArticleAvailableByClass(db.redis.read, studentClass, 1);
                } else {
                    StudentRedis.setExamCornerArticleAvailableByClass(db.redis.read, studentClass, 0);
                }
                trueCcmIds.forEach((item) => StudentRedis.setExamCornerArticleAvailableByCcmId(db.redis.read, item, 1));
                falseCcmIds.forEach((item) => StudentRedis.setExamCornerArticleAvailableByCcmId(db.redis.read, item, 0));
                countTrue = result.length;
            }
            if (countTrue) {
                examCornerFlag = 1;
            }
        }
    }
    if (!examCornerFlag) {
        data = data.filter((item) => item.feature_type !== 'exam_corner');
    }
    if (requestData.studentId % config.bounty_mod_factor !== 0 && requestData.versionCode > 685 && bountyFlagIndex > -1) {
        data.splice(bountyFlagIndex, 1);
        if (bountyFlagIndex < gupshupFlag) gupshupFlag--;
    }
    if (gupshupFlag > -1) {
        data.splice(gupshupFlag, 1);
    }
    // const studentClasses = [6, 7, 8, 13, 14];
    // emi reminder icon handler
    const iconData = await getEmiReminderIcon(db, config, requestData.studentId, requestData.type);
    console.log('ctr');
    console.log(iconData);
    let doesUserHaveCourseOrClass = true;
    // data.push({
    //     id: 628,
    //     title: 'test icon',
    //     position: 3,
    //     feature_type: 'external_url',
    //     time: '2020-11-29T18:14:09.000Z',
    //     is_show: '1',
    //     link: 'https://d10lpgp6xz60nq.cloudfront.net/images/whatsapp_topicon.webp',
    //     playlist_id: '',
    //     playlist_title: 'TEST',
    //     external_url: 'doubtnutapp://vip?assortment_id=42',
    // });
    // for versions greater >= 745  send all icons, condition here otherwise
    data = (requestData.versionCode < 746 && data.length > 8) ? data.slice(0, 8) : data;
    let packageType = userActivePackages.filter((e) => e.assortment_type === 'course' && e.assortment_id !== 138829);
    const etoosAssortment = userActivePackages.filter((e) => e.assortment_id === 138829);
    const flagDataforFaq = { xAuthToken: requestData.xAuthToken, body: { capabilities: { faq_top_icon_ab: {} } } };
    const flagrRespforFaq = await UtilityFlagr.getFlagrResp(flagDataforFaq);
    let removeLiveClassIcon = false;
    for (let i = 0; i < data.length; i++) {
        if (iconData && requestData.versionCode > 814) {
            if (data[i].feature_type === 'external_url') {
                const { position } = data[i];
                data[i] = iconData;
                data[i].position = position;
            }
        }
        data[i].position = i + 1;
        if (requestData.versionCode >= 828 && data[i].feature_type === 'live_class_home') {
            if (userActivePackages.length) {
                if (requestData.versionCode < 868) {
                    packageType = packageType.filter((e) => e.class === +requestData.studentClass);
                }
                if (packageType.length) {
                    data[i].title = (requestData.studentLocale === 'hi') ? 'मेरा कोर्स' : 'My Courses';
                    data[i].link = `${config.staticCDN}engagement_framework/35454CD4-CD82-99C2-3053-733F809BE9ED.webp`;
                    data[i].new_link = `${config.staticCDN}engagement_framework/35454CD4-CD82-99C2-3053-733F809BE9ED.webp`;
                    data[i].deeplink = ((packageType.length > 1) || (etoosAssortment.length && packageType.length)) && requestData.versionCode >= 891 ? 'doubtnutapp://course_select' : `doubtnutapp://course_details?id=${packageType[packageType.length - 1].assortment_id}`;
                    if (requestData.user_assortment && requestData.versionCode >= 901) {
                        data[i].deeplink = +requestData.user_assortment === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${requestData.user_assortment}`;
                    }
                }
                if (requestData.versionCode >= 971) { // as an experiment
                    const obj = {
                        id: 12345678,
                        title: (requestData.studentLocale === 'hi') ? 'फ्री क्लासेस' : 'Free Classes',
                        link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A8990839-4756-87DC-D9A7-FBDFA5103BBB.webp',
                        new_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/A8990839-4756-87DC-D9A7-FBDFA5103BBB.webp',
                        deeplink: 'doubtnutapp://library_tab?tag=free_classes',
                    };
                    data.splice(i + 1, 0, obj);
                    if (packageType.length === 0) {
                        // removing live class icon and keeping free classes icon in case of pdf, subject etc. case VIP user
                        removeLiveClassIcon = true;
                    }
                }
            }
            data[i].training_id = data[i].title;
        }
        if (data[i].feature_type === 'faq_icon' && requestData.versionCode >= 861) {
            const userActiveCourses = userActivePackages.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'class');
            if (userActiveCourses.length) {
                if (_.get(flagrRespforFaq, 'faq_top_icon_ab.payload.enabled', null)) {
                    data[i].title = (requestData.studentLocale === 'hi') ? 'सहायता' : 'FAQ';
                    data[i].deeplink = 'doubtnutapp://faq';
                } else {
                    data[i].title = 'CEO Refer & Earn';
                    if (requestData.versionCode >= 988) {
                        data[i].deeplink = 'doubtnutapp://referral';
                    } else {
                        data[i].deeplink = 'doubtnutapp://referral_page';
                    }
                    data[i].new_link = `${config.staticCDN}engagement_framework/AA456585-0CA3-E258-51E4-68B72AA905FC.webp`;
                }
            } else {
                doesUserHaveCourseOrClass = false;
            }
        }
    }
    const ceoIcon = await IconsHelper.getDnCeoIcon(db, requestData.studentId, requestData.versionCode);
    if (ceoIcon) {
        if (['मेरा कोर्स', 'My Courses'].includes(data[0].title)) {
            data.splice(1, 0,
                {
                    id: 1063,
                    title: 'CEO Refer & Earn',
                    feature_type: 'dn_ceo',
                    link: ceoIcon.icon,
                    new_link: ceoIcon.icon,
                    deeplink: ceoIcon.deeplink,
                });
        } else {
            data.unshift({
                id: 1063,
                title: 'CEO Refer & Earn',
                feature_type: 'dn_ceo',
                link: ceoIcon.icon,
                new_link: ceoIcon.icon,
                deeplink: ceoIcon.deeplink,
            });
        }
    }

    if (userActivePackages.length && requestData.versionCode >= 837) {
        data.splice(4, 0, {
            id: 768,
            title: 'My Homework',
            position: 4,
            feature_type: 'homework_list',
            time: '2021-01-23T21:15:49.000Z',
            is_show: '1',
            link: `${config.staticCDN}engagement_framework/8E6EE4CD-F658-5852-70E1-21416E2AC243.webp`,
            playlist_details: '',
            playlist_id: '',
            playlist_title: '',
            external_url: '',
            is_last: '',
            deeplink: 'doubtnutapp://homework_list',
        });
    } else {
        const base64StudentId = Buffer.from(requestData.studentId.toString()).toString('base64');
        data = [...[{
            id: 768,
            title: (requestData.studentLocale === 'hi') ? 'डेली क्लास कांटेस्ट' : 'Daily Class Contest',
            position: 4,
            feature_type: 'external_url',
            time: '2021-01-23T21:15:49.000Z',
            is_show: '1',
            link: `${config.staticCDN}engagement_framework/C9A3C1D2-BA05-F4B5-0257-8228D5258B3A.webp`,
            playlist_details: '',
            playlist_id: '',
            playlist_title: '',
            external_url: '',
            is_last: '',
            deeplink: `doubtnutapp://external_url?url=https://doubtnut.com/contest-result?student_id=${base64StudentId}`,
        }], ...data];
    }
    if (!userActivePackages.length || +requestData.versionCode < 861 || !doesUserHaveCourseOrClass) {
        data = data.filter((item) => (item.feature_type !== 'faq_icon'));
    }
    if (packageType.length && !etoosAssortment.length) {
        data = data.filter((item) => (item.feature_type !== 'course_iit'));
    } else if (!packageType.length && etoosAssortment.length) {
        data = data.filter((item) => (item.feature_type !== 'live_class_home'));
    }
    if (!_.get(flagrRespforFaq, 'faq_top_icon_ab.payload.enabled', null)) {
        data = data.filter((item) => (item.feature_type !== 'schedule'));
    }
    if (removeLiveClassIcon) {
        data = data.filter((item) => (item.feature_type !== 'live_class_home'));
        const index1 = data.findIndex((item) => (item.id === 12345678));
        const index2 = data.findIndex((item) => (item.feature_type === 'courses'));
        if (index1 !== -1 && index2 !== -1) {
            const tmp = data[index1];
            data[index1] = data[index2];
            data[index2] = tmp;
        }
    } else {
        data = data.filter((item) => (item.feature_type !== 'courses'));
    }
    return data;
}

function getPopularFeaturesListWidget(db, iconsList) {
    try {
        const items = [];
        for (let i = 0; i < iconsList.length; i++) {
            const obj = {
                widget_type: 'widget_dnr_redeem_voucher',
                widget_data: {
                    title: iconsList[i].title,
                    title_text_size: 15,
                    title_color: iconsList[i].title_color,
                    subtitle: iconsList[i].description,
                    subtitle_text_size: 12,
                    subtitle_color: iconsList[i].description_color,
                    cta: '',
                    cta_color: '',
                    cta_background_color: '',
                    dnr_image: '',
                    deeplink: iconsList[i].deeplink,
                    background_color: Data.cameraPageBottomSheet.icons_bg_color[iconsList[i].feature_type],
                    voucher_image: iconsList[i].new_link,
                    voucher_background_color: '#ffffff',
                    is_title_multiline: true,
                    is_subtitle_multiline: true,
                    image_card_elevation: 0,
                    visibility_layout_redirect: false,
                    image_height: 60,
                    image_background_color: Data.cameraPageBottomSheet.icons_bg_color[iconsList[i].feature_type],
                },
                layout_config: Data.cameraPageBottomSheet.iconsListWidgetLayout.layout_config,
            };

            items.push(obj);
        }
        return items;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
function makeAppNavigationIconsListWidget(iconsList, totalEngagementTime, isPaidUser, campaignUser, versionCode) {
    const finalObj = {};
    let todaysDate = moment().add('5', 'hours').add('30', 'minutes').format('YYYY-MM-DD');
    todaysDate = todaysDate.concat(' 00:00:00');
    for (let i = 0; i < iconsList.length; i++) {
        let { deeplink } = iconsList[i];
        if (iconsList[i].feature_type === 'navigate_live_class' && !isPaidUser && !campaignUser && totalEngagementTime < 1200) {
            deeplink = 'doubtnutapp://library_tab?id=1&tag=free_classes&recreate=true';
        }
        finalObj[`tab${i + 1}`] = {
            name: iconsList[i].title,
            icon_url_active: iconsList[i].new_link ? iconsList[i].new_link : iconsList[i].link,
            deeplink,
            tag: iconsList[i].feature_type,
            is_selectable: true, // true if screen of the icons contains the app nav icons and false for vie versa
            show_notification_badge: versionCode >= '1011' ? iconsList[i].feature_type === 'navigate_shorts' : false,
            last_updated_time: moment(todaysDate).valueOf(),
        };
    }
    return finalObj;
}

async function getNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, studentId) {
    let lastId = lastVideoAccessId[0].id;
    const lastQid = lastVideoAccessId[0].question_id;
    const lastVideoDetails = await QuestionMysql.getLastWatchedVideoDetails(db.mysql.read, lastQid, studentId);
    if (lastVideoDetails[0] && lastVideoDetails[0].duration != null && lastVideoDetails[0].duration != '' && lastVideoDetails[0].duration == lastVideoDetails[0].video_time) {
        lastId++;
        const nextVideoDetails = await QuestionMysql.getNcertNextVideoDetails(db.mysql.read, lastId);
        if (nextVideoDetails.length > 0 && nextVideoDetails[0].book_playlist_id == ncertIdDetails[0]) {
            nextQid = nextVideoDetails[0].question_id;
        }
    } else {
        nextQid = ncertIdDetails[1];
    }
    return nextQid;
}

async function ncertTopIconDeeplinkCategorisedHomepage(db, iconsResult, studentClass, studentId, process = 'new') {
    const ncertTitles = Data.ncertNewFlowTitleArr;
    const noBookListClassList = [6, 7, 8];
    const ncertWatchDetails = await redisQuestionContainer.getNcertLastWatchedDetails(db.redis.read, `ncert_new_flow_lv_${studentClass}`, studentId);
    if (!_.isNull(ncertWatchDetails)) {
        let nextQid = 0;
        const ncertIdDetails = ncertWatchDetails.split('_');
        const lastVideoAccessId = await QuestionMysql.getNcertLastVideoAccessId(db.mysql.read, ncertIdDetails[0], ncertIdDetails[1]);
        nextQid = await getNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, studentId);
        if (nextQid != 0) {
            iconsResult.forEach((item) => {
                if (((process === 'old' || process === 'new_flow') && Data.ncertIconsTitles.includes(item.title)) || ncertTitles.includes(item.title_one)) {
                    item.deeplink = `doubtnutapp://video?qid=${nextQid}&page=NCERT_NEW_FLOW&playlist_id=${ncertIdDetails[0]}`;
                }
            });
        }
    } else if (noBookListClassList.includes(parseInt(studentClass))) {
        const ncertIconData = iconsResult.filter((item) => ((process === 'old' || process === 'new_flow') && Data.ncertIconsTitles.includes(item.title)) || ncertTitles.includes(item.title_one));
        if (!_.isEmpty(ncertIconData)) {
            const ncertIconDeeplink = ncertIconData[0].deeplink;
            let deeplinkArr = ncertIconDeeplink.split('ncert?');
            deeplinkArr = deeplinkArr[1].split('&');
            deeplinkArr = deeplinkArr[0].split('=');
            const ncertPlaylistId = deeplinkArr[1];
            const parentOfPlaylist = await QuestionMysql.getPlaylistDetailsForParent(db.mysql.read, ncertPlaylistId);
            if (parentOfPlaylist.length == 1 && parentOfPlaylist[0].master_parent != null) {
                iconsResult.forEach((item) => {
                    if (((process === 'old' || process === 'new_flow') && Data.ncertIconsTitles.includes(item.title)) || ncertTitles.includes(item.title_one)) {
                        item.deeplink = `doubtnutapp://ncert?playlist_id=${parentOfPlaylist[0].master_parent}&playlist_title=NCERT%20Books%20Solutions&is_last=0&page=NCERT_NEW_FLOW`;
                    }
                });
            }
        }
    } else if (studentClass != 14) {
        iconsResult.forEach((item) => {
            if (((process === 'old' || process === 'new_flow') && Data.ncertIconsTitles.includes(item.title)) || ncertTitles.includes(item.title_one)) {
                item.deeplink = `${item.deeplink}&page=NCERT_NEW_FLOW`;
            }
        });
    }
    return iconsResult;
}

module.exports = {
    getEmiReminderIcon,
    makeIconData,
    getLiveClassIconText,
    getPopularFeaturesListWidget,
    makeAppNavigationIconsListWidget,
    ncertTopIconDeeplinkCategorisedHomepage,
};
