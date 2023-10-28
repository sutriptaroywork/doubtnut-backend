/* eslint-disable prefer-const */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const NudgeMysql = require('../../../modules/mysql/nudge');
const courseV2Redis = require('../../../modules/redis/coursev2');
const CourseContainer = require('../../../modules/containers/coursev2');
const CourseRedisV2 = require('../../../modules/redis/coursev2');
const LiveclassHelperLocal = require('./course.helper');
const CourseHelper = require('../../helpers/course');
const Data = require('../../../data/data');
const courseHelperV6 = require('../../v6/course/course.helper');
const WidgetHelper = require('../../widgets/liveclass');
const NudgeHelper = require('../../helpers/nudge');
const TGHelper = require('../../helpers/target-group');
const PayMySQL = require('../../../modules/mysql/payment');
const { autoScrollTime } = require('../../../data/data');
const StudentContainer = require('../../../modules/containers/student');
const gamificationHelper = require('../../helpers/gamification-leaderboard');
const PackageContainer = require('../../../modules/containers/package');
// const PaidUserChampionshipRedis = require('../../../modules/redis/paidUserChampionship');
const StudentRedis = require('../../../modules/redis/student');
const RewardsHelper = require('../../helpers/rewards');
const { winstonLogger: logger } = require('../../../config/winston');
const { freeClassListingPageFlagrResp } = require('../../helpers/freeChapterListing');
const referralFlowHelper = require('../../helpers/referralFlow');
const studentHelper = require('../../helpers/student.helper');
const BranchContainer = require('../../../modules/containers/branch');
const altAppData = require('../../../data/alt-app');

async function checkVipForParentAssortments(db, studentPackageList, courseDetail) {
    const userPackageCurrentAssortment = [];
    const parentAssortments = await CourseHelper.getParentAssortmentListV1(db, [courseDetail[0].assortment_id], courseDetail[0].class);
    const parentAssortmentList = parentAssortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
    for (let i = 0; i < studentPackageList.length; i++) {
        if (parentAssortmentList.indexOf(+studentPackageList[i].assortment_id) >= 0) {
            userPackageCurrentAssortment.push(studentPackageList[i]);
        }
    }
    return userPackageCurrentAssortment;
}
function getEnrolledStudentsCount(enrolledStudents) {
    let enrolledStudentsCount = 4 + (enrolledStudents.length ? Math.ceil(enrolledStudents[0].count / 10) / 100 : 0);
    enrolledStudentsCount = enrolledStudentsCount.toFixed(2);
    return enrolledStudentsCount;
}

async function getCourseInfo({
    courseDetail, locale, bottomSheet, bannerDetails, studentID, assortmentPriceMapping, checkTrialEligibility, deviceType, db, studentClass, versionCode,
}) {
    const courseInfo = WidgetHelper.prePurchaseCourseInfo(courseDetail, locale);
    if (bottomSheet) {
        LiveclassHelperLocal.setBottomSheetDetails(courseInfo, courseDetail, assortmentPriceMapping, locale, checkTrialEligibility);
    } else {
        courseInfo.data.download_url = bannerDetails.length ? bannerDetails[0].pdf_url : '';
        courseInfo.data.share_data = LiveclassHelperLocal.getShareData(courseDetail, studentID);
        if (courseDetail[0].assortment_type === 'subject') {
            const courseAssormentData = await CourseMysqlV2.getAllParentAssortmentsWithDetails(db.mysql.read, [courseDetail[0].assortment_id]);
            courseInfo.data.title = courseAssormentData.length ? `${courseInfo.data.title} | ${courseAssormentData[0].display_name}` : courseInfo.data.title;
        }
        if (_.includes([465140, 495269], courseDetail[0].assortment_id) && !checkTrialEligibility.length) {
            courseInfo.data.btn_text = locale === 'hi' ? '3 दिन का मुफ्त ट्रायल शुरू करें' : 'Start 3 Day Free Trial';
            courseInfo.data.btn_text_size = 16;
            courseInfo.data.btn_deeplink = '';
            courseInfo.data.is_buy_now_btn = false;
        }

        // add trial button based on tg check
        if (deviceType === 'merchant') {
            const R2V2Student = await StudentContainer.checkR2V2Student(db, studentID);
            if (parseInt(R2V2Student) === 1) {
                courseInfo.data.btn_text = locale === 'hi' ? '1 दिन मुफ्त ट्रायल' : '1 Day Free Trial';
                courseInfo.data.btn_text_size = 16;
                courseInfo.data.btn_deeplink = '';
                courseInfo.data.is_buy_now_btn = false;
            }
        } else if (!checkTrialEligibility.length && courseDetail[0].promo_applicable) {
            let showTrialButton = false;
            if (courseDetail[0].promo_applicable === 1) {
                showTrialButton = true;
            } else if (courseDetail[0].promo_applicable === 2) {
                const trialCarousel = await CourseMysqlV2.getCaraouselDataCoursePage(db.mysql.read, 12, locale, versionCode, 'course_pre_purchase');
                if (trialCarousel.length) {
                    const tgIds = trialCarousel[0].filters.split(',');
                    for (let i = 0; i < tgIds.length; i++) {
                        showTrialButton = trialCarousel[0].filters ? await TGHelper.targetGroupCheck({
                            db, studentId: studentID, tgID: tgIds[i], studentClass, locale,
                        }) : true;
                    }
                }
            } else {
                showTrialButton = await TGHelper.targetGroupCheck({
                    db, studentId: studentID, tgID: courseDetail[0].promo_applicable, studentClass, locale,
                });
            }
            if (showTrialButton) {
                courseInfo.data.btn_text = locale === 'hi' ? '3 दिन मुफ्त ट्रायल' : '3 Days Free Trial';
                courseInfo.data.btn_text_size = 16;
                courseInfo.data.btn_deeplink = '';
                courseInfo.data.is_buy_now_btn = false;
            }
        }
    }
    return courseInfo;
}
async function campaignSpecificCourseDetail({
    widgets, db, config, locale, batchID, courseDetail, studentID, assortmentID, versionCode, bottomSheet, page, deviceType, checkTrialEligibility, bannerDetails, source, couponAndUserData, next, studentClass, enrolledStudentsCount, studentBatchDetails,
}) {
    const superCategory = _.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA'], courseDetail[0].category) ? courseDetail[0].category : 'State Board (Named)';
    // loading widgets that need to be populated for which data is already available
    let [
        reviewDataByAssortmentId,
        reviewDataByCategory,
        reviewData,
        checkTrialAvailibilty,
        demoVideosData,
        demoVideoList,
        assortmentPriceMapping,
    ] = await Promise.all([
        CourseMysqlV2.getCourseReviewsByAssortmentId(db.mysql.read, parseInt(assortmentID), superCategory, courseDetail[0].meta_info, courseDetail[0].class),
        CourseMysqlV2.getCourseReviewsByCategory(db.mysql.read, superCategory, courseDetail[0].category, courseDetail[0].meta_info, courseDetail[0].class),
        CourseMysqlV2.getCourseReviews(db.mysql.read, superCategory, courseDetail[0].meta_info, courseDetail[0].class),
        CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, assortmentID),
        LiveclassHelperLocal.getDemoVideosForPrePurchaseByQid({
            db,
            config,
            locale,
            batchID,
            versionCode,
            assortmentID,
            courseDetail,
            flagrResponse: {},
            bottomSheet,
            source,
            qid: 649453459,
        }),
        LiveclassHelperLocal.getDemoVideosList({
            db, courseDetail, assortmentID, batchID, showAllSubjects: true,
        }),
        couponAndUserData ? await CourseHelper.generateAssortmentVariantMappingForReferral(db, [assortmentID], studentID, true) : await CourseHelper.generateAssortmentVariantMapping(db, [assortmentID], studentID, false),
    ]);
    reviewData.unshift(...reviewDataByCategory);
    reviewData.unshift(...reviewDataByAssortmentId);

    // moving the topper reviews to begining (topper reviews have negative review_order negative)
    const reviewsByToppers = reviewData.filter(((review) => review.review_order < 0));
    const reviewsNotByToppers = reviewData.filter(((review) => review.review_order >= 0));
    reviewData = [...reviewsByToppers, ...reviewsNotByToppers];

    // creating rest of the widgets which need data from the first promise call
    let [timetable, courseInfo, demoWidgetForCampaign] = await Promise.all([
        +page === 1 ? await LiveclassHelperLocal.getPrePurchaseTabsDataByTabId({
            db,
            config,
            locale,
            studentID,
            tabID: 'timetable',
            batchID,
            courseDetail,
            filterValue: undefined,
            versionCode,
            showTrial: false,
            checkTrialAvailibilty,
        }) : [],
        getCourseInfo({
            courseDetail, locale, bottomSheet, bannerDetails, studentID, assortmentPriceMapping, checkTrialEligibility, deviceType, db, studentClass, versionCode,
        }), WidgetHelper.getMostViewedClassesWidget({
            db, locale, config, carousel: { title: '', carousel_type: 'widget_most_viewed_classes' }, result: demoVideoList || [], assortmentID, trialExpired: true,
        }),
    ]);

    if (!_.isNull(demoVideosData) && !_.isEmpty(demoVideosData)) {
        widgets.push(demoVideosData);
    }
    widgets.push(courseInfo);
    if (!bottomSheet) {
        widgets.push(WidgetHelper.prePurchaseCourseOptions(courseDetail, locale, enrolledStudentsCount, studentBatchDetails));
    }

    // timetable has buy help button at second position, so pushing it before, it also has choose yolur plan at position 1.
    widgets.push(timetable[2]);
    // text for timetable above
    widgets.push(
        {
            type: 'text_widget',
            data: {
                title: locale === 'hi' ? 'समय सारणी' : 'Timetable',
                text_color: '#000000',
                text_size: '16',
                isBold: true,
            },
        },
    );
    // actual timetable data
    widgets.push(timetable[0]);

    // title widget
    widgets.push(
        {
            type: 'text_widget',
            data: {
                title: locale === 'hi' ? 'डेमो वीडियो' : 'Demo Videos',
                text_color: '#000000',
                text_size: '16',
                isBold: true,
            },
        },
    );
    widgets.push(demoWidgetForCampaign);
    widgets.push(
        {
            type: 'course_calling_widget',
            data: {
                title: locale === 'hi' ? 'पूरा पाठ्यक्रम डाउनलोड करें' : 'Download Detailed Syllabus',
                title_color: '#000000',
                icon_url: `${config.staticCDN}engagement_framework/42ED3461-3F08-9B71-21FC-F200BD22A5C0.webp`,
                bg_image_url: `${config.staticCDN}engagement_framework/C74538CB-08D9-88CF-0508-2793A97AD034.webp`,
                deeplink: `doubtnutapp://pdf_viewer?pdf_url=${config.cdn_url}Soorma_Bihar_hi_Syllabus.pdf`,
            },
            extra_params: {
                assortment_id: courseDetail[0].assortment_id,
                type: 'download_detailed_syllabus',
                tab: 'course_details',
            },
        },
    );
    let planButton;

    if ((courseDetail[0].parent === 4 && assortmentPriceMapping[138829]) || assortmentPriceMapping[assortmentID]) {
        planButton = LiveclassHelperLocal.getCourseBuyButtonData(courseDetail, assortmentPriceMapping, locale);
    }
    if (reviewData.length) {
        widgets.push(WidgetHelper.getCourseReviewWidget({
            result: reviewData, locale, config, assortmentID,
        }));
    }
    const talkToUsWidget = {
        data: {
            title: locale === 'hi' ? 'अभी भी सहायता चाहिए?   ' : 'Still looking for help?   ',
            subtitle: locale === 'hi' ? 'हमसे बात करें' : 'Talk to Us',
            deeplink: 'doubtnutapp://dialer?mobile=01247158250',
        },
        type: 'widget_checkout_talk_to_us',
    };
    widgets.push(talkToUsWidget);
    return next({ data: { extra_widgets: widgets, widget_view_plan_button: planButton } });
}

async function showPrePurchaseCampaignChanges(db, studentId) {
    const flagrResp = await CourseContainer.getFlagrResp(db, 'prepurchase_campaign_flagr', studentId);
    return _.get(flagrResp, 'prepurchase_campaign_flagr.payload.enabled', false);
}

async function iconsListCheck(resolvedPromises, courseCardIconWidget, carouselCategory, chapterAssortmentListAllSubject, chapterAssortmentListCurrentAffairs, chapterAssortmentList, db, page, courseDetail, versionCode, batchID, studentID) {
    const promise = [];
    for (let i = 0; i < resolvedPromises[courseCardIconWidget].length; i++) {
        if (carouselCategory === 'trial_end_state') {
            promise.push([]);
        } else if (resolvedPromises[courseCardIconWidget][i].card_id.includes('tests')) {
            promise.push(CourseHelper.getCourseDataByCardId({
                db, cardID: resolvedPromises[courseCardIconWidget][i].card_id, chapterAssortmentList: chapterAssortmentListAllSubject, page, courseDetail, batchID, isPostPurchaseHome: true,
            }));
        } else {
            const chaptersList = resolvedPromises[courseCardIconWidget][i].card_id === 'magazine' ? chapterAssortmentListCurrentAffairs : chapterAssortmentList;
            promise.push(CourseHelper.getCourseDataByCardId({
                db, cardID: resolvedPromises[courseCardIconWidget][i].card_id, chapterAssortmentList: chaptersList, page, courseDetail, batchID, versionCode, isPostPurchaseHome: true, studentID,
            }));
        }
    }
    const cardData = await Promise.all(promise);
    const tempStore = [];
    for (let i = 0; i < resolvedPromises[courseCardIconWidget].length; i++) {
        if (cardData[i] !== -1 && !_.isEmpty(cardData[i])) {
            tempStore.push(resolvedPromises[courseCardIconWidget][i]);
        }
    }
    return tempStore;
}

async function getCourseDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let { locale } = req.user ? req.user : {};
        locale = locale === 'hi' ? locale : 'en';
        const { student_id: studentID, student_class: userStudentClass, isDropper } = req.user ? req.user : {};
        let { assortment_id: assortmentID, studentClass, bottom_sheet: bottomSheet = false } = req.query;
        if (bottomSheet) bottomSheet = JSON.parse(bottomSheet);
        const { source } = req.query;
        let { page } = req.query;
        if (!_.isEmpty(source)) {
            try {
                const sourceObj = JSON.parse(source);
                console.log(sourceObj);
                /**
                 * source={"type":"trial","value":2} added as a param in deeplink
                 * Source type = trial is used to activate trial for n number of days
                 * For the course (used through deeplinks)
                 */
                if (!_.isEmpty(sourceObj) && sourceObj.type == 'trial') {
                    await PackageContainer.createSubscriptionEntryForTrialV1(db, studentID, assortmentID, -1, sourceObj.value);
                }
            } catch (e) {
                console.log(e);
            }
        }
        studentClass = (typeof studentClass === 'undefined') ? userStudentClass : studentClass;
        const {
            'x-auth-token': xAuthToken, version_code: versionCode, is_browser: isBrowser, dn_device_type: deviceType,
        } = req.headers;
        const gotCoupon = assortmentID.split('||')[2];
        assortmentID = assortmentID.split('||')[0];
        let WAchatDeeplink = null;
        if (req.user && req.user.campaign && await RewardsHelper.isBNBCampaignEnabledForDNR(req)) {
            const courseNotificationData = {
                reward_type: 'bnb_course_page_visit',
                deeplink: `doubtnutapp://course_details?id=${assortmentID}`,
                event: 'bnb_course_page_visit',
                course_id: assortmentID,
            };
            RewardsHelper.creditInDNR(req, courseNotificationData);
        }
        if ((assortmentID.includes('scholarship_test')) && studentID) {
            const dataSch = await courseHelperV6.scholarshipLanding(db, config, studentID, xAuthToken, locale, assortmentID, versionCode);
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: dataSch,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentID);

        if (assortmentID.includes('xxxx') && (assortmentID.split('_')[1] || assortmentID.split('_')[2]) && !assortmentID.includes('board')) {
            assortmentID = await CourseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, (assortmentID.split('_')[1]) ? assortmentID.split('_')[1] : locale, assortmentID);
        } else if (assortmentID.includes('xxxx') && studentID) {
            const categoriesResult = await CourseContainer.getCategoriesFromCcmId(db, studentCcmData.map((item) => item.id));
            const category = [];
            categoriesResult.forEach((item) => category.push(item.category));
            let result = await CourseContainer.getCoursesForHomepageIcons(db, studentClass, category, locale);
            result.forEach((item, index) => {
                const categoryType = categoriesResult.filter((item1) => item.category === item1.category);
                result[index].category_type_1 = categoryType[0].category_type;
            });
            const boardCourses = result.filter((item) => item.category_type_1 === 'board');
            const examCourses = result.filter((item) => item.category_type_1 === 'exam');
            if (result.length > 0) {
                assortmentID = assortmentID.includes('board') && boardCourses.length && result.length ? boardCourses[0].assortment_id : _.get(examCourses, '[0].assortment_id', result[0].assortment_id);
            } else {
                assortmentID = await CourseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, (assortmentID.split('_')[1]) ? assortmentID.split('_')[1] : locale, assortmentID);
            }
        }
        if (!locale) locale = 'en';
        if (isBrowser && !page) {
            page = 1;
        }
        const limit = 16;
        const offset = (page - 1) * limit;
        const widgets = [];
        const resData = {};
        if (source === 'HOMEPAGE') {
            StudentRedis.setUserHomepageVisitCount(db.redis.write, studentID, -1);
        }
        if (typeof gotCoupon !== 'undefined' && gotCoupon.length > 0 && studentID) {
            const couponData = {};
            couponData.student_id = studentID;
            couponData.coupon_code = gotCoupon;
            couponData.source = 'COURSE_DETAIL';
            CourseMysqlV2.setPreAppliedReferralCode(db.mysql.write, couponData);
        }
        const [studentPackageList, campaignData] = await Promise.all([studentID ? CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID) : [], req.user && req.user.campaign ? BranchContainer.getByCampaign(db, req.user.campaign) : []]);
        if (assortmentID === 'paid') {
            assortmentID = studentPackageList.length ? studentPackageList[0].assortment_id : 165057;
        }

        const [
            courseDetail,
            liveclassCourseDetails,
            checkTrialEligibility,
            couponAndUserData,
            prePurchaseCampaignChangesFlagr,
        ] = await Promise.all([
            CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID),
            CourseMysqlV2.getLiveClassCourseFromAssortment(db.mysql.read, assortmentID),
            studentID ? CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, assortmentID) : [],
            (studentID && versionCode >= 1012) ? referralFlowHelper.getRefererSidAndCouponCode(db, studentID) : false,
            (+assortmentID === 1258266) && (req.user.campaign && _.get(campaignData, '[0].description', '').includes('bnb_campaign_vijay')) ? showPrePurchaseCampaignChanges(db, studentID) : false,
        ]);
        let username = '';
        if (couponAndUserData) {
            username = await studentHelper.getStudentName(db, couponAndUserData.student_id);
            if (username) {
                username = username.length > 15 ? 'friend' : username;
            }
        }
        let {
            class_type: classTypeOption, medium: mediumOption, subject_flp: subjectOption, chapter: chapterOption, teacher: teacherOption, sort: sortOption,
        } = req.query;
        if ((courseDetail[0].is_free && (courseDetail[0].assortment_type === 'chapter' || courseDetail[0].assortment_type === 'subject')) || (classTypeOption || mediumOption || subjectOption || chapterOption || teacherOption || sortOption)) {
            const flagrResp = await freeClassListingPageFlagrResp(versionCode, db, studentID);
            if ((classTypeOption || mediumOption || subjectOption || chapterOption || teacherOption || sortOption) || flagrResp) {
                return LiveclassHelperLocal.freeChapterListingPage(req, res, next, courseDetail);
            }
        }

        if (!courseDetail.length) {
            // logger.warn(`CONTENT_ISSUE: No course found for assortment ID ${assortmentID}`);
        }

        if (courseDetail.length && courseDetail[0].is_active === 0) {
            // logger.warn(`CONTENT_ISSUE: course is Inactive for assortment ID ${assortmentID}`);
        }

        const variantInfo = [];
        const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        if (source === 'RECOMMENDATION' && parseInt(versionCode) > 926 && courseDetail[0].assortment_type === 'course') {
            CourseMysqlV2.setStickyNotification(db.mysql.write, studentID, assortmentID);
        }
        let userPackageCurrentAssortment = studentPackageList.filter((e) => e.assortment_id === +assortmentID);
        if (!userPackageCurrentAssortment.length) {
            userPackageCurrentAssortment = await checkVipForParentAssortments(db, studentPackageList, courseDetail);
        }
        // for post trial end state
        // Note:- keeping the merchant check so that post trial end state is not shown for r2v2 user
        if (!userPackageCurrentAssortment.length && checkTrialEligibility.length === 1 && checkTrialEligibility[0].amount === -1 && moment(checkTrialEligibility[0].end_date).add(1, 'month') >= today && versionCode >= 967 && deviceType !== 'merchant') {
            checkTrialEligibility[0].sps_is_active = 0;
            userPackageCurrentAssortment = checkTrialEligibility;
        }
        let assortmentPriceMapping = {};
        // no trial taken structure
        resData.is_vip = false;
        resData.is_kota_classes = courseDetail[0].parent === 4;
        const newDemoVideoExperiment = true;
        let callData = {
            title: (locale === 'hi') ? 'हमें कॉल करें' : 'Call us',
            number: '01247158250',
        };
        if (courseDetail[0].parent === 4 && !userPackageCurrentAssortment.length) {
            // for etoos faculty course level assortment when user is nonvip
            assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [138829], studentID, false);
            if (!assortmentPriceMapping[assortmentID] || _.isEmpty(assortmentPriceMapping[138829])) {
                logger.error({
                    tag: 'coursePageApi',
                    source: 'courseGetDetail',
                    error: `package doesn't exist for assortmentId- ${assortmentID}`,
                });
            }
            const [
                topics,
                demoVideos,
                checkTrialEtoos,
            ] = await Promise.all([
                CourseMysqlV2.getTopicListFromSubjectAssortment(db.mysql.read, assortmentID, 10, (page - 1) * 10, courseDetail[0].class),
                CourseMysqlV2.getFreeResourceDetailsFromAssortmentId(db.mysql.read, assortmentID, courseDetail[0].class, 0),
                studentID ? CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, 138829) : [],
            ]);
            widgets.push(LiveclassHelperLocal.getCourseInfo(courseDetail, config));
            if (!checkTrialEtoos.length) {
                widgets.push(CourseHelper.getTrialWidget(138829, false, null, null, courseDetail[0].class, locale));
            }
            const paymentCardState = {
                isVip: false,
            };
            const result = await CourseHelper.getCoursePageResponse({
                studentPackageAssortments: [], db, config, data: demoVideos, title: 'Demo Videos', assortmentPriceMapping, versionCode, paymentCardState,
            });
            if (result.data.items.length) {
                widgets.push(result);
            }
            const bannerData = studentID ? await LiveclassHelperLocal.getBannersData(db.mysql.read, courseDetail, [], locale, config, false, courseDetail[0].class, versionCode, studentID, assortmentPriceMapping[138829].package_variant) : {};
            if (!_.isEmpty(bannerData) && bannerData.data.items.length && bannerData.data.items[0].image_url) {
                widgets.push(bannerData);
            }
            if (topics.length) {
                const topicWidget = await CourseHelper.getTopicsData(db, topics);
                widgets.push({ type: 'course_topics', data: { items: topicWidget, showsearch: false } });
            }
            if (courseDetail[0].assortment_type === 'chapter') {
                const data = await CourseMysqlV2.getPastVideoResourcesOfChapter(db.mysql.read, [assortmentID], 1);
                const widget = studentID ? await CourseHelper.getRelatedLectures(data, config, [], [], db, studentID, true, {}, versionCode, {}) : [];
                if (widget.length) {
                    widgets.push({ type: 'related_lecture', data: { bg_color: '#66e0eaff', items: widget } });
                }
            }

            resData.extra_widgets = widgets;
            if (!courseDetail[0].is_free) {
                const buyButton = await CourseHelper.getBuyButton(db, assortmentPriceMapping, 138829, versionCode, locale, courseDetail[0].assortment_type, gotCoupon);
                resData.buy_button = buyButton;
            }
        } else if (courseDetail.length && !courseDetail[0].is_free && !userPackageCurrentAssortment.length && versionCode > 921 && _.includes(['subject', 'course', 'course_bundle'], courseDetail[0].assortment_type)) {
            // new pre purchase course page for version code > 921
            if (courseDetail[0].assortment_type !== 'chapter' && courseDetail[0].assortment_type !== 'subject') {
                courseV2Redis.setCallingCardWidgetData(db.redis.write, studentID, {
                    subtitle: courseDetail[0].display_name,
                    image_url: courseDetail[0].demo_video_thumbnail,
                    assortmentId: assortmentID,
                    title: 'Course kharidne mein ho rhi dikkat ?',
                });
                CourseContainer.getContineBuyingCoursesData(db, assortmentID, studentID);
            }
            WAchatDeeplink = await LiveclassHelperLocal.getCourseIDforCallingCard(db, studentID, assortmentID);
            const batchID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID);
            const [
                enrolledStudents,
                bannerDetails,
                batchDetails,
            ] = await Promise.all([
                CourseContainer.getEnrolledStudentsInCourse(db, assortmentID),
                CourseMysqlV2.getBanners(db.mysql.read, assortmentID, batchID, 'timetable'),
                CourseContainer.getLastestBatchByAssortment(db, assortmentID),
            ]);
            const studentBatchDetails = batchDetails.filter((item) => +item.batch_id === +batchID);
            if (studentBatchDetails.length) {
                courseDetail[0].display_name = studentBatchDetails[0].display_name || courseDetail[0].display_name;
                courseDetail[0].display_description = studentBatchDetails[0].display_description || courseDetail[0].display_description;
                courseDetail[0].demo_video_thumbnail = studentBatchDetails[0].demo_video_thumbnail || courseDetail[0].demo_video_thumbnail;
            }
            let enrolledStudentsCount = getEnrolledStudentsCount(enrolledStudents);
            assortmentPriceMapping[assortmentID] = {};
            let demoVideosData;
            if ((+assortmentID === 1258266) && (_.get(campaignData, '[0].description', '').includes('bnb_campaign_vijay')) && prePurchaseCampaignChangesFlagr) {
                return campaignSpecificCourseDetail({
                    widgets, db, config, locale, batchID, courseDetail, studentID, assortmentID, versionCode, bottomSheet, page, deviceType, assortmentPriceMapping, checkTrialEligibility, bannerDetails, source, couponAndUserData, next, studentClass,
                });
            }
            demoVideosData = await LiveclassHelperLocal.getDemoVideosForPrePurchase({
                db,
                config,
                locale,
                batchID,
                versionCode,
                assortmentID,
                courseDetail,
                flagrResponse: {},
                bottomSheet,
                source,
            });

            if (!_.isNull(demoVideosData) && !_.isEmpty(demoVideosData)) {
                widgets.push(demoVideosData);
            }
            if (req.user.campaign === 'UAC_InApp_CBSE_9-12_Board_EM') {
                assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMappingForAutosalesCampaign(db, [assortmentID], studentID, true);
            } else if (couponAndUserData) {
                assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMappingForReferral(db, [assortmentID], studentID, true);
            } else {
                assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [assortmentID], studentID, false);
            }
            if (!assortmentPriceMapping[assortmentID] || _.isEmpty(assortmentPriceMapping[assortmentID])) {
                logger.error({
                    tag: 'coursePageApi',
                    source: 'courseGetDetail',
                    error: `package doesn't exist for assortmentId- ${assortmentID}`,
                });
            }
            const courseInfo = WidgetHelper.prePurchaseCourseInfo(courseDetail, locale);
            if (bottomSheet) {
                LiveclassHelperLocal.setBottomSheetDetails(courseInfo, courseDetail, assortmentPriceMapping, locale, checkTrialEligibility);
            } else {
                courseInfo.data.download_url = bannerDetails.length ? bannerDetails[0].pdf_url : '';
                courseInfo.data.share_data = LiveclassHelperLocal.getShareData(courseDetail, studentID);
                if (courseDetail[0].assortment_type === 'subject') {
                    const courseAssormentData = await CourseMysqlV2.getAllParentAssortmentsWithDetails(db.mysql.read, [courseDetail[0].assortment_id]);
                    courseInfo.data.title = courseAssormentData.length ? `${courseInfo.data.title} | ${courseAssormentData[0].display_name}` : courseInfo.data.title;
                }
                if (_.includes([465140, 495269], courseDetail[0].assortment_id) && !checkTrialEligibility.length) {
                    courseInfo.data.btn_text = locale === 'hi' ? '3 दिन का मुफ्त ट्रायल शुरू करें' : 'Start 3 Day Free Trial';
                    courseInfo.data.btn_text_size = 16;
                    courseInfo.data.btn_deeplink = '';
                    courseInfo.data.is_buy_now_btn = false;
                }

                // add trial button based on tg check
                if (deviceType === 'merchant') {
                    const R2V2Student = await StudentContainer.checkR2V2Student(db, studentID);
                    if (parseInt(R2V2Student) === 1) {
                        courseInfo.data.btn_text = locale === 'hi' ? '1 दिन मुफ्त ट्रायल' : '1 Day Free Trial';
                        courseInfo.data.btn_text_size = 16;
                        courseInfo.data.btn_deeplink = '';
                        courseInfo.data.is_buy_now_btn = false;
                    }
                } else if (!checkTrialEligibility.length && courseDetail[0].promo_applicable) {
                    let showTrialButton = false;
                    if (courseDetail[0].promo_applicable === 1) {
                        showTrialButton = true;
                    } else if (courseDetail[0].promo_applicable === 2) {
                        const trialCarousel = await CourseMysqlV2.getCaraouselDataCoursePage(db.mysql.read, 12, locale, versionCode, 'course_pre_purchase');
                        if (trialCarousel.length) {
                            const tgIds = trialCarousel[0].filters.split(',');
                            for (let i = 0; i < tgIds.length; i++) {
                                showTrialButton = trialCarousel[0].filters ? await TGHelper.targetGroupCheck({
                                    db, studentId: studentID, tgID: tgIds[i], studentClass, locale,
                                }) : true;
                            }
                        }
                    } else {
                        showTrialButton = await TGHelper.targetGroupCheck({
                            db, studentId: studentID, tgID: courseDetail[0].promo_applicable, studentClass, locale,
                        });
                    }
                    if (showTrialButton) {
                        courseInfo.data.btn_text = locale === 'hi' ? '3 दिन मुफ्त ट्रायल' : '3 Days Free Trial';
                        courseInfo.data.btn_text_size = 16;
                        courseInfo.data.btn_deeplink = '';
                        courseInfo.data.is_buy_now_btn = false;
                    }
                }
            }
            widgets.push(courseInfo);

            if (couponAndUserData && ['course', 'course_bundle'].includes(courseDetail[0].assortment_type)) {
                widgets.push(
                    {
                        type: 'course_calling_widget',
                        data: {
                            title: locale === 'hi' ? `${username} का कूपन ${couponAndUserData.coupon_code} लगाओ और पाओ 30% की बचत <img src='${config.staticCDN}engagement_framework/E0B81A32-D01A-08C3-F2A8-313FF545B0EE.webp'>` : `Extra <font color='#307d00'>30% off </font> with <font color='#307d00'>${username}'s</font> code '${couponAndUserData.coupon_code}' <img src='${config.staticCDN}engagement_framework/E0B81A32-D01A-08C3-F2A8-313FF545B0EE.webp'>`,
                            title_color: '#000000',
                            icon_url: `${config.staticCDN}engagement_framework/2DDD22DB-B205-16EC-2F33-A254FF499DAF.webp`,
                            bg_image_url: `${config.staticCDN}engagement_framework/3EB031D6-0722-5928-2D9D-EB63B3E52E51.webp`,
                            deeplink: `doubtnutapp://copy?text=${couponAndUserData.coupon_code}&label=doubtnut_coupon_code&toast_message=Code Copied`,
                            deeplink2: assortmentPriceMapping[assortmentID] && !assortmentPriceMapping[assortmentID].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentID].package_variant}` : `doubtnutapp://bundle_dialog?id=${assortmentID}&source=PRE_PURCHASE_BUY_BUTTON`,
                        },
                        extra_params: {
                            assortment_id: courseDetail[0].assortment_id,
                            type: 'referral_nudge_prepurchase',
                            tab: 'course_details',
                        },
                    },
                );
            }

            if (!bottomSheet) {
                widgets.push(WidgetHelper.prePurchaseCourseOptions(courseDetail, locale, enrolledStudentsCount, studentBatchDetails));
            }
            // TODO :- remove later
            const banner = await LiveclassHelperLocal.getBannersForCoursePage(db, assortmentID, batchID);
            if (!_.isEmpty(banner)) {
                widgets.push(banner);
            }
            if (bottomSheet) {
                const buyDeeplink = assortmentPriceMapping[assortmentID] && !assortmentPriceMapping[assortmentID].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentID].package_variant}` : `doubtnutapp://bundle_dialog?id=${assortmentID}`;
                widgets.push(WidgetHelper.borderButtonWidget({
                    assortmentID: courseDetail[0].assortment_id, text: locale === 'hi' ? 'अभी खरीदें' : 'Buy Now', deeplink: buyDeeplink, type: 'course_preview',
                }));
                widgets.push(WidgetHelper.getPrePurchaseCallWidget({ config, locale, assortmentID }));
                widgets.push(WidgetHelper.prePurchaseCourseOptions(courseDetail, locale, enrolledStudentsCount, studentBatchDetails));
            } else {
                widgets.push(WidgetHelper.getPrePurchaseCallWidget({ config, locale, assortmentID }));
                resData.tabs = await LiveclassHelperLocal.getPrePurchaseCourseTabs(locale, courseDetail, db);
                if ((courseDetail[0].parent === 4 && assortmentPriceMapping[138829]) || assortmentPriceMapping[assortmentID]) {
                    resData.widget_view_plan_button = LiveclassHelperLocal.getCourseBuyButtonData(courseDetail, assortmentPriceMapping, locale);
                }
            }
            resData.widgets = widgets;
            if (liveclassCourseDetails.length) {
                if (versionCode >= 935) {
                    resData.fab = {
                        image_url: `${config.staticCDN}engagement_framework/E54435B5-629F-A8B3-515A-D60F479798FF.webp`,
                        deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Mujhe Course ID %23${liveclassCourseDetails[0].liveclass_course_id} ki jaankari chahiye`,
                    };
                } else {
                    resData.chat_deeplink = `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Mujhe Course ID %23${liveclassCourseDetails[0].liveclass_course_id} ki jaankari chahiye`;
                }
            }
        } else if (courseDetail.length && !courseDetail[0].is_free && !userPackageCurrentAssortment.length) {
            // pre purchase course page older version
            const assortmentType = courseDetail[0].assortment_type;
            const batchID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID);
            if (assortmentType === 'chapter') {
                const [
                    teachersData,
                    resourcesCount,
                    contentList,
                ] = await Promise.all([
                    CourseMysqlV2.getTeachersByAssortmentId(db.mysql.read, assortmentID, assortmentType),
                    CourseContainer.getResourcesCountFromChapterAssortment(db, assortmentID),
                    CourseMysqlV2.getLectureAndNotesListOfSubject(db.mysql.read, assortmentID),
                ]);
                assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [assortmentID], studentID, false);
                if (!assortmentPriceMapping[assortmentID] || _.isEmpty(assortmentPriceMapping[assortmentID])) {
                    logger.error({
                        tag: 'coursePageApi',
                        source: 'courseGetDetail',
                        error: `package doesn't exist for assortmentId- ${assortmentID}`,
                    });
                }
                if (assortmentPriceMapping[assortmentID]) {
                    widgets.push(CourseHelper.getPrePurchaseCourseInfo(courseDetail, assortmentPriceMapping, locale));
                }
                const courseFeatures = await LiveclassHelperLocal.getPrePurchaseCourseFeaturesSachet(0, resourcesCount, assortmentType, locale);
                widgets.push(courseFeatures);
                if (contentList.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseTimetable(contentList, locale));
                }
                if (teachersData.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseTeachers(teachersData, locale, versionCode));
                }
            } else if (assortmentType === 'subject') {
                const subjectHindi = Data.subjectHindi[courseDetail[0].display_name] || '';
                const superCategory = _.includes(['IIT JEE', 'NEET', 'CBSE Boards'], courseDetail[0].category) ? courseDetail[0].category : 'State Board (Named)';
                const courseAssortment = await CourseMysqlV2.getAllParentAssortments(db.mysql.read, [assortmentID]);
                let [
                    timetableData,
                    teachersData,
                    resourcesCount,
                    chaptersList,
                    reviewDataByAssortmentId,
                    reviewDataByCategory,
                    reviewData,
                    faqsData,
                ] = await Promise.all([
                    CourseMysqlV2.getTimetableByAssortment(db.mysql.read, courseAssortment[0].assortment_id),
                    CourseMysqlV2.getTeachersByAssortmentId(db.mysql.read, assortmentID, assortmentType),
                    CourseContainer.getResourcesCountFromSubjectAssortment(db, assortmentID, batchID),
                    CourseMysqlV2.getChapterListOfSubject(db.mysql.read, assortmentID),
                    CourseMysqlV2.getCourseReviewsByAssortmentId(db.mysql.read, parseInt(assortmentID), superCategory, courseDetail[0].meta_info, courseDetail[0].class),
                    CourseMysqlV2.getCourseReviewsByCategory(db.mysql.read, superCategory, courseDetail[0].category, courseDetail[0].meta_info, courseDetail[0].class),
                    CourseMysqlV2.getCourseReviews(db.mysql.read, superCategory, courseDetail[0].meta_info, courseDetail[0].class),
                    CourseMysqlV2.getFAQsBySubjectAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en'),
                ]);
                reviewData.unshift(...reviewDataByCategory);
                reviewData.unshift(...reviewDataByAssortmentId);

                // moving the topper reviews to begining (topper reviews have negative review_order negative)
                const reviewsByToppers = reviewData.filter(((review) => review.review_order < 0));
                const reviewsNotByToppers = reviewData.filter(((review) => review.review_order >= 0));
                reviewData = [...reviewsByToppers, ...reviewsNotByToppers];

                const requiredTimetableData = timetableData.filter((item) => item.subject === courseDetail[0].display_name || item.subject === subjectHindi);
                const subjectTimetable = requiredTimetableData.length ? requiredTimetableData : chaptersList;
                const numberOfTopics = [{ count: subjectTimetable.length }];
                assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [assortmentID], studentID, false);
                if (!assortmentPriceMapping[assortmentID] || _.isEmpty(assortmentPriceMapping[assortmentID])) {
                    logger.error({
                        tag: 'coursePageApi',
                        source: 'courseGetDetail',
                        error: `package doesn't exist for assortmentId- ${assortmentID}`,
                    });
                }
                if (assortmentPriceMapping[assortmentID]) {
                    widgets.push(CourseHelper.getPrePurchaseCourseInfo(courseDetail, assortmentPriceMapping, locale));
                }
                const banner = {
                    type: 'promo_list',
                    data: {
                        auto_scroll_time_in_sec: autoScrollTime,
                        items: [],
                        ratio: '5:1',
                    },
                };

                banner.data.items = await CourseHelper.getBanners(db, assortmentID, banner.data.items, userPackageCurrentAssortment.length > 0);
                if (banner.data.items.length) {
                    widgets.push(banner);
                }
                const courseFeatures = await LiveclassHelperLocal.getPrePurchaseCourseFeaturesSachet(numberOfTopics, resourcesCount, assortmentType, locale);
                widgets.push(courseFeatures);
                if (faqsData.length) {
                    widgets.push(CourseHelper.getPrePurchaseSubjectFAQs(faqsData, locale));
                }
                if (subjectTimetable.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseTimetable(subjectTimetable, locale));
                }
                if (teachersData.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseTeachers(teachersData, locale, versionCode));
                }
                if (reviewData.length) {
                    widgets.push(WidgetHelper.getCourseReviewWidget({
                        result: reviewData, locale, config, assortmentID,
                    }));
                }
                if (versionCode > 869) {
                    const result = await CourseContainer.getDemoVideoSubject(db, assortmentID);
                    // eslint-disable-next-line no-shadow
                    const home = true;
                    let widgetDemo;
                    if (result && result[0]) {
                        widgetDemo = await WidgetHelper.getPostPuchaseLecturesWidget({
                            db,
                            home,
                            locale,
                            config,
                            result,
                            assortmentID,
                            carousel: { carousel_type: 'widget_autoplay' },
                            newDemoVideoExperiment,
                            versionCode,
                        });
                    }
                    if (widgetDemo && widgetDemo.data && widgetDemo.data.items && widgetDemo.data.items.length !== 0) {
                        widgetDemo.data.title = (locale !== 'hi') ? 'Demo videos dekhe ...' : 'डेमो वीडियोस देखे ...';
                        widgetDemo.data.default_mute = false;
                        widgets.unshift(widgetDemo);
                    }
                }
                if (isBrowser) {
                    const demoVideo = await LiveclassHelperLocal.getIntroVideoForPrePurchase({
                        batchID,
                        db,
                        courseDetail,
                        config,
                        checkTrialEligibility,
                        locale,
                        assortmentPriceMapping,
                        versionCode,
                    });
                    resData.demo_video = demoVideo;
                }
            } else {
                if (versionCode > 912) {
                    courseV2Redis.setCallingCardWidgetData(db.redis.write, studentID, {
                        subtitle: courseDetail[0].display_name,
                        image_url: courseDetail[0].demo_video_thumbnail,
                        assortmentId: assortmentID,
                        title: 'Course kharidne mein ho rhi dikkat ?',
                    });
                }
                if (versionCode > 921) {
                    WAchatDeeplink = await LiveclassHelperLocal.getCourseIDforCallingCard(db, studentID, assortmentID);
                }
                const superCategory = _.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA'], courseDetail[0].category) ? courseDetail[0].category : 'State Board (Named)';
                let [
                    timetableData,
                    faqsData,
                    teachersData,
                    reviewDataByAssortmentId,
                    reviewDataByCategory,
                    reviewData,
                ] = await Promise.all([
                    CourseMysqlV2.getTimetableByAssortment(db.mysql.read, assortmentID),
                    CourseMysqlV2.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', batchID),
                    CourseMysqlV2.getTeachersByAssortmentId(db.mysql.read, assortmentID, assortmentType),
                    CourseMysqlV2.getCourseReviewsByAssortmentId(db.mysql.read, parseInt(assortmentID), superCategory, courseDetail[0].meta_info, courseDetail[0].class),
                    CourseMysqlV2.getCourseReviewsByCategory(db.mysql.read, superCategory, courseDetail[0].category, courseDetail[0].meta_info, courseDetail[0].class),
                    CourseMysqlV2.getCourseReviews(db.mysql.read, superCategory, courseDetail[0].meta_info, courseDetail[0].class),
                ]);
                reviewData.unshift(...reviewDataByCategory);
                reviewData.unshift(...reviewDataByAssortmentId);

                // moving the topper reviews to begining (topper reviews have negative review_order negative)
                const reviewsByToppers = reviewData.filter(((review) => review.review_order < 0));
                const reviewsNotByToppers = reviewData.filter(((review) => review.review_order >= 0));
                reviewData = [...reviewsByToppers, ...reviewsNotByToppers];

                assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [assortmentID], studentID, false);
                // medium change widget
                if (!assortmentPriceMapping[assortmentID] || _.isEmpty(assortmentPriceMapping[assortmentID])) {
                    logger.error({
                        tag: 'coursePageApi',
                        source: 'courseGetDetail',
                        error: `package doesn't exist for assortmentId- ${assortmentID}`,
                    });
                }
                if (assortmentPriceMapping[assortmentID]) {
                    widgets.push(CourseHelper.getPrePurchaseCourseInfo(courseDetail, assortmentPriceMapping, locale, liveclassCourseDetails));
                }
                const banner = await LiveclassHelperLocal.getBannersForCoursePage(db, assortmentID, batchID);
                if (!_.isEmpty(banner)) {
                    widgets.push(banner);
                }

                const courseFeatures = await CourseHelper.getPrePurchaseCourseFeatures(db, locale, assortmentID, false);
                widgets.push(courseFeatures);
                const emiWidget = await CourseHelper.getPrePurchaseCourseEmiDetails(db, config, assortmentPriceMapping, assortmentID, locale);
                if (emiWidget) {
                    widgets.push(emiWidget);
                }
                const demoVideo = await LiveclassHelperLocal.getIntroVideoForPrePurchase({
                    batchID,
                    db,
                    courseDetail,
                    config,
                    checkTrialEligibility,
                    locale,
                    assortmentPriceMapping,
                    versionCode,
                });
                if (versionCode > 869) {
                    const demoVideosData = await LiveclassHelperLocal.getDemoVideosForPrePurchase({
                        db,
                        config,
                        locale,
                        versionCode,
                        assortmentID,
                        courseDetail,
                        source,
                    });
                    if (!_.isEmpty(demoVideosData) && demoVideosData.data.items.length) {
                        widgets.unshift(demoVideosData);
                    } else {
                        resData.demo_video = demoVideo;
                    }
                } else {
                    resData.demo_video = demoVideo;
                }
                if (!resData.demo_video && isBrowser) {
                    resData.demo_video = demoVideo;
                    if (resData.demo_video.bottom_sub_title) {
                        let demoSubtitle = resData.demo_video.bottom_sub_title;
                        if (demoSubtitle.slice(-1) === '!') {
                            demoSubtitle = demoSubtitle.slice(0, -1);
                        }
                        demoSubtitle += ' app par';
                        resData.demo_video.bottom_sub_title = demoSubtitle;
                    }
                }
                const demo = !!resData.demo_video;
                if (timetableData.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseTimetable(timetableData, locale));
                }
                if (faqsData.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseFAQs(faqsData, locale, demoVideo.video_resources, newDemoVideoExperiment, demo, versionCode, courseDetail[0].demo_video_qid));
                }
                if (teachersData.length) {
                    widgets.push(CourseHelper.getPrePurchaseCourseTeachers(teachersData, locale, versionCode));
                }
                if (reviewData.length) {
                    widgets.push(WidgetHelper.getCourseReviewWidget({
                        result: reviewData, locale, config, assortmentID,
                    }));
                }
                if (versionCode > 912) {
                    const otherCourse = await CourseContainer.getOtherLanguageCourse(db, assortmentID, courseDetail[0].meta_info);
                    if (otherCourse && otherCourse[0]) {
                        const details = {
                            type: 'widget_medium_switch',
                            data: {
                                title: courseDetail[0].meta_info === 'HINDI' ? 'Ye course English medium mai bhi available hai' : 'यह कोर्स हिंदी माध्यम में भी उपलब्ध है|',
                                button_cta_text: courseDetail[0].meta_info === 'HINDI' ? 'English mai dekhein' : 'हिंदी में देखें',
                                deeplink: courseDetail[0].meta_info === 'HINDI' ? `doubtnutapp://course_details?id=${otherCourse[0].english_assortment_id}` : `doubtnutapp://course_details?id=${otherCourse[0].hindi_assortment_id}`,
                            },
                        };
                        widgets.unshift(details);
                    }
                }
            }
            resData.extra_widgets = widgets;
            if (!courseDetail[0].is_free && versionCode > 921) {
                if ((courseDetail[0].parent === 4 && assortmentPriceMapping[138829]) || assortmentPriceMapping[assortmentID]) {
                    resData.widget_view_plan_button = LiveclassHelperLocal.getCourseBuyButtonData(courseDetail, assortmentPriceMapping, locale);
                }
            } else if (!courseDetail[0].is_free) {
                const buyButton = await CourseHelper.getBuyButton(db, assortmentPriceMapping, assortmentID, versionCode, locale, courseDetail[0].assortment_type, gotCoupon, 'COURSE_PAGE', courseDetail[0].sub_assortment_type);
                for (let i = 0; i < widgets.length; i++) {
                    if (widgets[i].type === 'course_info_v1') {
                        widgets[i].data.description = buyButton.description;
                        break;
                    }
                }
                if (isBrowser) {
                    if (buyButton.deeplink && buyButton.deeplink.startsWith('doubtnutapp://bundle_dialog')) {
                        buyButton.bottom_sheet = true;
                    } else {
                        buyButton.bottom_sheet = false;
                    }
                }
                resData.buy_button = buyButton;
            }
        } else {
            // post purchase course page
            resData.is_vip = true;
            // PaidUserChampionshipRedis.incrementStudentPaidCourseInteractionCount(db.redis.write, studentID);
            const batchID = userPackageCurrentAssortment.length ? userPackageCurrentAssortment[0].batch_id : 1;
            const batchDetails = await CourseMysqlV2.getBatchDetailsByAssortment(db.mysql.read, assortmentID, batchID);
            if (batchDetails.length) {
                courseDetail[0].display_name = batchDetails[0].display_name || courseDetail[0].display_name;
                courseDetail[0].display_description = batchDetails[0].display_description || courseDetail[0].display_description;
            }
            const isTrial = !!userPackageCurrentAssortment.length && userPackageCurrentAssortment[0].amount === -1;
            resData.is_trial = isTrial;
            let carouselCategory = 'course_detail';
            if (isTrial && userPackageCurrentAssortment[0].sps_is_active === 1 && versionCode > 966) {
                carouselCategory = 'trial_state';
            } else if (isTrial && userPackageCurrentAssortment[0].sps_is_active === 0 && versionCode > 966) {
                carouselCategory = 'trial_end_state';
            }
            const assortmentType = courseDetail[0].assortment_type;
            const chapterAssortmentList = [];
            const chapterAssortmentListAllSubject = [];
            const chapterAssortmentListCurrentAffairs = [];
            const chapterAssortmentListAnnouncement = [];
            let carousels = await CourseMysqlV2.getCaraouselDataCoursePage(db.mysql.read, 12, locale, versionCode, carouselCategory);
            if (assortmentType === 'chapter') {
                chapterAssortmentList.push(+assortmentID);
            } else {
                let courseAssortment = assortmentID;
                if (assortmentType === 'subject') {
                    const parentMappings = await CourseMysqlV2.getAllParentAssortments(db.mysql.read, [assortmentID]);
                    courseAssortment = parentMappings[0].assortment_id;
                }
                // get chapter assortments list to get resources
                const [
                    chapterList,
                    chapterListAllSubject,
                    chapterListCurrentAffairs,
                    chapterListAnnouncementSubject,
                ] = await Promise.all([
                    CourseMysqlV2.getChapterListOfAssortmentWithoutChapterOrder(db.mysql.read, null, assortmentID, assortmentType, limit, offset),
                    CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, 'WEEKLY TEST', courseAssortment, 'course', limit, offset),
                    CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, 'CURRENT AFFAIRS', assortmentID, assortmentType, limit, offset),
                    CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, 'ANNOUNCEMENT', assortmentID, assortmentType, limit, offset),
                ]);
                chapterList.map((item) => chapterAssortmentList.push(item.course_resource_id));
                chapterListAllSubject.map((item) => chapterAssortmentListAllSubject.push(item.course_resource_id));
                chapterListCurrentAffairs.map((item) => chapterAssortmentListCurrentAffairs.push(item.course_resource_id));
                chapterListAnnouncementSubject.map((item) => chapterAssortmentListAnnouncement.push(item.course_resource_id));
            }
            let tabDetails = {};
            let promise = [];
            let courseCardWidget = -1;
            let courseCardIconWidget = -1;
            let videoWidget = -1;
            if (_.includes(['subject', 'chapter'], assortmentType)) {
                carousels = carousels.filter((e) => e.carousel_type !== 'course_subject_v1');
            }
            const validityEndingSubscription = studentID ? await CourseHelper.checkUserPackageRenewals({
                db,
                studentID,
                studentSubscriptionDetails: userPackageCurrentAssortment,
            }) : [];
            const showUpgradeWidget = userPackageCurrentAssortment.length && (moment(userPackageCurrentAssortment[0].start_date) < moment().add(5, 'hours').add(30, 'minutes').startOf('day'));
            const differenceAmountForUpgradeSubscription = await CourseHelper.getDifferenceAmountForUpgradeSubscription({ db, assortmentID: courseDetail[0].parent === 4 ? 138829 : assortmentID, studentID });
            const checkUpgrade = courseDetail[0].is_free || !studentID || !showUpgradeWidget ? {} : differenceAmountForUpgradeSubscription;
            if ((!_.isEmpty(checkUpgrade) || validityEndingSubscription.length) && versionCode > 906) {
                const isEligible = await NudgeHelper.checkEligiblityForRenewalNudge({
                    db, studentID, assortmentID, type: 'renewal',
                });
                if (!isEligible) {
                    carousels = carousels.filter((e) => !(e.carousel_type === 'widget_nudge'));
                }
            }
            // if (!_.isEmpty(checkUpgrade) && validityEndingSubscription.length) {
            //     carousels = carousels.filter((e) => !((e.carousel_type === 'validity_widget' || e.carousel_type === 'widget_nudge') && e.view_type.toLowerCase() === 'upgrade'));
            // }
            // timer nudge for renewals
            if (courseDetail[0].sub_assortment_type === 'mock_test') {
                carousels = carousels.filter((e) => !(e.carousel_type === 'promo_list'));
            }
            // renewal check for renewal campaign
            const campaignNudge = carousels.filter((e) => e.carousel_type === 'widget_nudge' && e.view_type.toLowerCase() === 'target_group');
            if (!validityEndingSubscription.length && studentID && campaignNudge.length) {
                const isEligibleForNudge = campaignNudge[0].filters ? await TGHelper.targetGroupCheck({
                    db, studentId: studentID, tgID: parseInt(campaignNudge[0].filters), studentClass, locale,
                }) : true;
                if (!isEligibleForNudge) {
                    carousels = carousels.filter((e) => !(e.carousel_type === 'widget_nudge' && e.view_type.toLowerCase() === 'target_group'));
                }
            }
            // this loop generates data for all carousels
            const packageValue = req.headers.package_name;
            const isFreeApp = packageValue === altAppData.freeAppPackageName;

            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].data_type === 'banners' && carousels[i].view_type === 'app_banners') {
                    if (isFreeApp) {
                        promise.push(CourseMysqlV2.getBannersFromId(db.mysql.read, carousels[i].assortment_list.split(',')));
                    } else {
                        promise.push([]);
                    }
                } else if (carousels[i].carousel_type === 'widget_autoplay' && studentID) {
                    videoWidget = i;
                    if (courseDetail[0].parent === 4) {
                        promise.push(CourseMysqlV2.getEtoosContinueWatchingVideosByAssortmentID(db.mysql.read, assortmentID, studentID, 0));
                    } else if (assortmentType === 'course') {
                        carousels[i].title = locale === 'hi' ? 'आपके लिए वीडियो' : 'Apke liye Videos';
                        carousels[i].view_all_link = `doubtnutapp://course_detail_info?assortment_id=${assortmentID}&tab=recent`;
                        const liveClassCache = await CourseRedisV2.getLiveClassesByAssortmentID(db.redis.read, assortmentID, batchID);
                        if (!_.isNull(liveClassCache)) {
                            promise.push(JSON.parse(liveClassCache));
                        } else {
                            promise.push([]);
                        }
                    } else {
                        promise.push(CourseMysqlV2.getMissedClassesForPastDays(db.mysql.read, assortmentID, studentID, assortmentType, offset, batchID));
                    }
                } else if (carousels[i].carousel_type === 'validity_widget' && carousels[i].view_type.toLowerCase() === 'upgrade') {
                    promise.push(checkUpgrade);
                } else if (carousels[i].carousel_type === 'validity_widget') {
                    promise.push(validityEndingSubscription);
                } else if (carousels[i].data_type === 'course_cards') {
                    courseCardWidget = i;
                    promise.push(CourseMysqlV2.getPostPurchaseCourseCards(db.mysql.read, locale, 0, assortmentType, courseDetail[0].sub_assortment_type, carousels[i].category, versionCode));
                } else if (carousels[i].data_type === 'course_subject') {
                    promise.push(CourseMysqlV2.getSubjectsListByCourseAssortment(db.mysql.read, assortmentID));
                } else if (carousels[i].carousel_type === 'widget_nudge' && carousels[i].view_type.toLowerCase() === 'target_group') {
                    promise.push(NudgeMysql.getByID(db.mysql.read, carousels[i].assortment_list));
                } else if (carousels[i].carousel_type === 'widget_nudge' && carousels[i].view_type.toLowerCase() === 'upgrade') {
                    if (!_.isEmpty(checkUpgrade)) {
                        promise.push([{
                            bg_image_url: carousels[i].image_url,
                            widget_id: 'upgrade',
                            is_banner: true,
                            ratio: carousels[i].resource_types || '16:2',
                            deeplink: `doubtnutapp://bundle_dialog?id=${assortmentID}&source=POST_PURCHASE`,
                            display_image_rectangle: carousels[i].image_url,
                        }]);
                    } else {
                        promise.push([]);
                    }
                } else if (carousels[i].carousel_type === 'widget_nudge' && carousels[i].view_type.toLowerCase() === 'renewal') {
                    if (validityEndingSubscription.length) {
                        validityEndingSubscription[0].widget_id = 'renewal';
                        validityEndingSubscription[0].is_banner = false;
                        validityEndingSubscription[0].ratio = carousels[i].resource_types || '16:5';
                        validityEndingSubscription[0].display_image_rectangle = carousels[i].image_url;
                        validityEndingSubscription[0].display_image_square = `${config.cdn_url}engagement_framework/D4A0C250-5C76-6C2C-BDD3-24FCF0EEC525.webp`;
                        validityEndingSubscription[0].subtitle_text = locale === 'hi' ? `इस कोर्स की वैलिडिटी बस ${moment(validityEndingSubscription[0].end_date).diff(today, 'days') + 1} दिन के लिए रह गयी है` : `Iss course ki validity sirf ${moment(validityEndingSubscription[0].end_date).diff(today, 'days') + 1} din reh gayi hai.`;
                        validityEndingSubscription[0].text = locale === 'hi' ? 'इस कोर्स की वैलिडिटी ख़तम होने वाली है !' : 'Course ki validity khatam hone wali hai !';
                        validityEndingSubscription[0].display_text = locale === 'hi' ? 'पैक को रीचार्ज करें' : 'Apna package recharge karein';
                        validityEndingSubscription[0].deeplink = `doubtnutapp://bundle_dialog?id=${assortmentID}&source=POST_PURCHASE`;
                    }
                    promise.push(validityEndingSubscription);
                } else if (carousels[i].carousel_type === 'widget_coupon_banner') {
                    promise.push(NudgeMysql.getByID(db.mysql.read, carousels[i].assortment_list));
                } else if (carousels[i].carousel_type === 'text_widget') {
                    promise.push(CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, assortmentID));
                } else if (carousels[i].carousel_type === 'widget_padho_aur_jeeto') {
                    promise.push([assortmentType, courseDetail[0].sub_assortment_type, courseDetail[0].is_free, req.user]);
                } else if (carousels[i].data_type === 'timetable') {
                    promise.push(CourseMysqlV2.getCourseSchedule(db.mysql.read, assortmentID, null, batchID));
                } else if (carousels[i].data_type === 'calling_card') {
                    promise.push([]);
                } else if (carousels[i].carousel_type === 'course_testimonial') {
                    const superCategory = _.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA'], courseDetail[0].category) ? courseDetail[0].category : 'State Board (Named)';
                    promise.push(CourseMysqlV2.getAllCourseReviews(db.mysql.read, superCategory, courseDetail[0].meta_info, courseDetail[0].class, assortmentID, courseDetail[0].category));
                } else if (carousels[i].data_type === 'faqs') {
                    promise.push(CourseMysqlV2.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', batchID));
                } else if (carousels[i].data_type === 'icons_list') {
                    carousels[i].assortment_list = carousels[i].assortment_list.split(',');
                    promise.push(CourseMysqlV2.getCoursePageIconsDetail(db.mysql.read, carousels[i].assortment_list));
                    courseCardIconWidget = i;
                } else if (carousels[i].data_type === 'pricing_details') {
                    let referralCampaignData = false;
                    if (versionCode >= 1012) {
                        referralCampaignData = await referralFlowHelper.getRefererSidAndCouponCode(db, studentID);
                    }
                    let type = 'default';
                    if (req.user.campaign === 'UAC_InApp_CBSE_9-12_Board_EM') {
                        type = 'bnb_autosales';
                    } else if (referralCampaignData && versionCode >= 1012) {
                        type = 'referral';
                    }
                    let packageDetailsPromise;
                    if (type === 'bnb_autosales') {
                        packageDetailsPromise = CourseHelper.getPackagesForAssortmentAutosalesCampaign(db, studentID, [courseDetail[0].assortment_id]);
                    } else if (type === 'referral') {
                        packageDetailsPromise = CourseHelper.getPackagesForAssortmentReferral(db, studentID, [courseDetail[0].assortment_id]);
                    } else {
                        packageDetailsPromise = CourseHelper.getPackagesForAssortment(db, studentID, [courseDetail[0].assortment_id]);
                    }
                    promise.push(packageDetailsPromise);
                } else if (carousels[i].data_type === 'demo_videos') {
                    promise.push(LiveclassHelperLocal.getDemoVideosList({
                        db, courseDetail, assortmentID, batchID, showAllSubjects: true,
                    }));
                } else if (carousels[i].data_type === 'suggested_videos') {
                    promise.push(LiveclassHelperLocal.getCarouselDataByUserState(db, studentID, assortmentID, [], batchID));
                } else if (carousels[i].data_type === 'banners') {
                    if (isFreeApp) {
                        promise.push(CourseMysqlV2.getBanners(db.mysql.read, assortmentID, batchID, carousels[i].filters));
                    } else {
                        promise.push([]);
                    }
                }
            }
            const resolvedPromises = await Promise.all(promise);
            let liveVideosCount = videoWidget > -1 ? resolvedPromises[videoWidget].length : 0;
            if (videoWidget > -1 && courseDetail[0].parent === 4 && resolvedPromises[videoWidget].length && resolvedPromises[videoWidget].length < 8) {
                const userRelatedLectures = await CourseMysqlV2.getRelatedVideosOfChapter(db.mysql.read, resolvedPromises[videoWidget][resolvedPromises[videoWidget].length - 1].assortment_id);
                resolvedPromises[videoWidget] = [...resolvedPromises[videoWidget], ...userRelatedLectures];
            } else if (videoWidget > -1 && courseDetail[0].parent === 4 && resolvedPromises[videoWidget].length === 0) {
                resolvedPromises[videoWidget] = await CourseMysqlV2.getFreeResourceDetailsFromAssortmentId(db.mysql.read, assortmentID, courseDetail[0].class, 0);
            } else if (videoWidget > -1 && assortmentType === 'course') {
                resolvedPromises[videoWidget] = await LiveclassHelperLocal.getCarouselDataByUserState(db, studentID, assortmentID, resolvedPromises[videoWidget], batchID);
                const day = moment().add(5, 'hours').add(30, 'minutes').day();
                const testData = day === 7 || day === 1 ? await CourseMysqlV2.getMissedTestForLastWeek(db.mysql.read, assortmentID, studentID, batchID) : [];
                if (testData.length && !isBrowser && !isTrial) {
                    const testCarousel = {
                        carousel_type: 'widget_autoplay',
                        title: locale === 'hi' ? 'इस हफ्ते के टेस्ट' : "This week's test",
                        view_all_link: `doubtnutapp://course_detail_info?assortment_id=${assortmentID}&tab=tests`,
                    };
                    if (videoWidget === 0) {
                        carousels.unshift(testCarousel);
                        resolvedPromises.unshift(testData);
                    } else {
                        carousels.splice(videoWidget - 1, 0, testCarousel);
                        resolvedPromises.splice(videoWidget - 1, 0, testData);
                    }
                    videoWidget++;
                    courseCardWidget++;
                    courseCardIconWidget++;
                }
            }
            if ((assortmentType === 'course' && versionCode < 915) || assortmentType !== 'course') {
                // course leaderboard
                resolvedPromises[courseCardWidget] = resolvedPromises[courseCardWidget].filter((e) => e.card_id !== 'leaderboard');
            }

            // add announcement data
            if (courseDetail[0].assortment_type === 'course' && !courseDetail[0].is_free && chapterAssortmentListAnnouncement.length) {
                const announcementData = await CourseHelper.getCourseDataByCardId({
                    db, cardID: 'recent', chapterAssortmentList: chapterAssortmentListAnnouncement, page, courseDetail, batchID,
                });
                if (announcementData.length && resolvedPromises[videoWidget]) {
                    resolvedPromises[videoWidget].splice(liveVideosCount, 0, ...announcementData);
                    // resolvedPromises[videoWidget] = [...announcementData, ...resolvedPromises[videoWidget]];
                }
            }

            if (resolvedPromises[courseCardWidget] && resolvedPromises[courseCardWidget].length && courseDetail[0].schedule_type === 'recorded') {
                resolvedPromises[courseCardWidget] = resolvedPromises[courseCardWidget].filter((e) => !_.includes(['homework', 'upcoming', 'timetable'], e.card_id));
            }
            if (resolvedPromises[courseCardWidget] && resolvedPromises[courseCardWidget].length) {
                promise = [];
                const currentTime = moment().add(5, 'hours').add(30, 'minutes');
                for (let i = 0; i < resolvedPromises[courseCardWidget].length; i++) {
                    if (carouselCategory === 'trial_end_state') {
                        promise.push([]);
                    } else if (resolvedPromises[courseCardWidget][i].card_id.includes('tests')) {
                        promise.push(CourseHelper.getCourseDataByCardId({
                            db, cardID: resolvedPromises[courseCardWidget][i].card_id, chapterAssortmentList: chapterAssortmentListAllSubject, page, courseDetail, batchID, isPostPurchaseHome: true,
                        }));
                    } else {
                        const chaptersList = resolvedPromises[courseCardWidget][i].card_id === 'magazine' ? chapterAssortmentListCurrentAffairs : chapterAssortmentList;
                        promise.push(CourseHelper.getCourseDataByCardId({
                            db, cardID: resolvedPromises[courseCardWidget][i].card_id, chapterAssortmentList: chaptersList, page, courseDetail, batchID, versionCode, isPostPurchaseHome: true, studentID,
                        }));
                    }
                }
                const cardData = await Promise.all(promise);
                for (let i = 0; i < resolvedPromises[courseCardWidget].length; i++) {
                    tabDetails[resolvedPromises[courseCardWidget][i].card_id] = cardData[i] === -1 ? cardData[i] : cardData[i].length;
                    // if (resolvedPromises[courseCardWidget][i].card_id === 'ncert') {
                    //     tabDetails[resolvedPromises[courseCardWidget][i].card_id] = cardData[i] === -1 ? cardData[i] : cardData[i][0];
                    // }
                    if (moment(courseDetail[0].end_date) < currentTime && !cardData[i].length) {
                        tabDetails[resolvedPromises[courseCardWidget][i].card_id] = -1;
                    }
                    if (resolvedPromises[courseCardWidget][i].card_id === 'timetable') {
                        if (cardData[i].length && versionCode < 911) {
                            resolvedPromises[courseCardWidget][i].deeplink = userPackageCurrentAssortment.length > 0 ? cardData[i][0].action_data : cardData[i][0].prepurchase_action_data;
                        }
                        tabDetails[resolvedPromises[courseCardWidget][i].card_id] = !cardData[i].length ? -1 : cardData[i][0];
                    }
                }
                tabDetails.faq = 1;
                if (versionCode > 912 && !courseDetail[0].is_free && userPackageCurrentAssortment.length && today.diff(moment(userPackageCurrentAssortment[0].start_date), 'days') > 7) {
                    tabDetails.faq = -1;
                }
                if (tabDetails.upcoming === 0 && courseDetail[0].start_date < today && carouselCategory !== 'trial_end_state') {
                    let courseAssortment = assortmentID;
                    let checkInLiveclassSchedule;
                    if (courseDetail[0].assortment_type === 'subject') {
                        const parentMappings = await CourseMysqlV2.getAllParentAssortments(db.mysql.read, [courseAssortment]);
                        courseAssortment = parentMappings[0].assortment_id;
                        checkInLiveclassSchedule = await CourseMysqlV2.getCourseSchedule(db.mysql.read, courseAssortment, courseDetail[0].display_name, batchID);
                    } else {
                        checkInLiveclassSchedule = await CourseMysqlV2.getCourseSchedule(db.mysql.read, courseAssortment, null, batchID);
                    }
                    tabDetails.upcoming = checkInLiveclassSchedule.length || -1;
                }
            }
            if (resolvedPromises[courseCardIconWidget] && resolvedPromises[courseCardIconWidget].length) {
                const modified = await iconsListCheck(resolvedPromises, courseCardIconWidget, carouselCategory, chapterAssortmentListAllSubject, chapterAssortmentListCurrentAffairs, chapterAssortmentList, db, page, courseDetail, versionCode, batchID, studentID);
                resolvedPromises[courseCardIconWidget] = modified;
            }
            resData.title = courseDetail[0].assortment_type === 'subject' ? courseDetail[0].display_description : courseDetail[0].display_name;
            let enrolledStudentsCount = 0;
            if (versionCode > 964) {
                const enrolledStudents = await CourseContainer.getEnrolledStudentsInCourse(db, assortmentID);
                enrolledStudentsCount = getEnrolledStudentsCount(enrolledStudents);
            }
            // genrate widegt json for all carousels
            resData.widgets = await LiveclassHelperLocal.getCaraouselDataForCoursePage({
                db,
                config,
                locale,
                studentID,
                carousels,
                tabDetails,
                courseDetail,
                assortmentID,
                studentClass,
                isBrowser,
                resolvedPromises,
                batchID,
                userPackageCurrentAssortment,
                versionCode,
                enrolledStudentsCount,
                isFreeApp,
            });
            if (courseDetail[0].start_date > today) {
                const banner = {
                    type: 'promo_list',
                    data: {
                        auto_scroll_time_in_sec: autoScrollTime,
                        items: [],
                        ratio: '5:1',
                    },
                };
                banner.data.items = await CourseHelper.getBanners(db, assortmentID, banner.data.items, userPackageCurrentAssortment.length > 0, batchID);
                if (banner.data.items.length) {
                    resData.widgets.unshift(banner);
                }
            }
            // * Reward banner for maximum validity package users
            if (_.isEmpty(differenceAmountForUpgradeSubscription) && !courseDetail[0].is_free && studentID && !isDropper) {
                const items = [];
                const rewardDeeplink = await CourseHelper.getRewardBannerDeeplink(db, studentID, 'COURSE_PAGE');
                if (!_.isNull(rewardDeeplink)) {
                    const banners = await CourseMysqlV2.getBannersFromId(db.mysql.read, [965, 966]);
                    if (banners.length) {
                        const bannerDetails = locale === 'hi' ? banners[1] || banners[0] : banners[0];
                        items.push({
                            id: bannerDetails.id,
                            deeplink: rewardDeeplink,
                            image_url: bannerDetails.image_url,
                        });
                        const banner = {
                            type: 'promo_list',
                            data: {
                                auto_scroll_time_in_sec: autoScrollTime,
                                items,
                                ratio: '5:1',
                            },
                        };
                        resData.widgets.unshift(banner);
                    }
                }
            }
            if (userPackageCurrentAssortment.length && userPackageCurrentAssortment[0].amount === -1) {
                assortmentID = courseDetail[0].parent === 4 ? 138829 : assortmentID;
                assortmentPriceMapping = couponAndUserData ? await CourseHelper.generateAssortmentVariantMappingForReferral(db, [assortmentID], studentID, true) : await CourseHelper.generateAssortmentVariantMapping(db, [assortmentID], studentID, false);
                if (!assortmentPriceMapping[assortmentID] || _.isEmpty(assortmentPriceMapping[assortmentID])) {
                    logger.error({
                        tag: 'coursePageApi',
                        source: 'courseGetDetail',
                        error: `package doesn't exist for assortmentId- ${assortmentID}`,
                    });
                }
                const purchaseDetails = await CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, assortmentID);
                const activePurchaseDetails = purchaseDetails.filter((e) => e.amount > -1 && e.is_active === 1);
                if (!activePurchaseDetails.length) {
                    // if COD activation or if COD order Show Tracking Option
                    const [CODActivation, CODOrder] = await Promise.all([
                        CourseMysqlV2.checkIfCODActivation(db.mysql.read, studentID),
                        PayMySQL.checkActiveCODOrderWithStudentId(db.mysql.read, studentID),
                    ]);
                    if (CODActivation.length) {
                        const json_payload = {
                            course_name: '', coupon_code: '', variant_id: CODActivation[0].variant_id, mobile: '', version_code: versionCode, show_activation: 1, locale: req.user.locale,
                        };
                        resData.trial_widget = [{
                            type: 'trial_timer',
                            data: {
                                title: locale === 'hi' ? 'मे एक्टिवेट\nकरें' : 'left to activate\nthe course',
                                deeplink: `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=${req.headers['x-auth-token']}`,
                                end_time: moment(CODActivation[0].end_date).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000,
                                button_text: locale === 'hi' ? 'अभी एक्टिवेट करें' : 'Activate Now',
                            },
                        }];
                    } else if (CODOrder.length) {
                        const json_payload = {
                            course_name: '', coupon_code: '', variant_id: CODOrder[0].variant_id, mobile: '', version_code: versionCode, show_activation: 0, locale: req.user.locale,
                        };
                        resData.trial_widget = [{
                            type: 'trial_timer',
                            data: {
                                title: locale === 'hi' ? 'मे एक्टिवेट\nकरें' : 'left to activate\nthe course',
                                deeplink: `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=${req.headers['x-auth-token']}`,
                                end_time: moment(CODOrder[0].end_date).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000,
                                button_text: locale === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Order',
                            },
                        }];
                    } else if (versionCode < 967) {
                        resData.trial_widget = [{
                            type: 'trial_timer',
                            data: {
                                title: locale === 'hi' ? 'बचे है ट्रायल में' : 'left in trial',
                                deeplink: versionCode >= 861 ? `doubtnutapp://bundle_dialog?id=${assortmentID}&source='POST_PURCHASE_TRIAL'` : `doubtnutapp://vip?assortment_id=${assortmentID}`,
                                end_time: moment(userPackageCurrentAssortment[0].end_date).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000,
                                button_text: locale === 'hi' ? 'अभी खरीदें' : 'Buy Now',
                            },
                        }];
                    }
                }
            } else if (userPackageCurrentAssortment.length) {
                if (_.isEmpty(checkUpgrade) && !validityEndingSubscription.length) {
                    callData = null;
                }
            }
            const courseList = [];
            courseList.push({
                id: `${courseDetail[0].assortment_id}`,
                display: courseDetail[0].display_name,
                is_selected: true,
            });
            const batchPromise = [];
            for (let i = 0; i < studentPackageList.length; i++) {
                batchPromise.push(CourseContainer.getBatchDetailsByAssortment(db, studentPackageList[i].assortment_id, studentPackageList[i].batch_id));
            }
            const studentBatchDetails = await Promise.all(batchPromise);
            // generate my courses selection list on top of post purchase page
            for (let i = 0; i < studentPackageList.length; i++) {
                if (!_.find(courseList, ['id', studentPackageList[i].assortment_id.toString()]) && (studentPackageList[i].assortment_id !== 138829 || versionCode >= 891)) {
                    const obj = {
                        id: `${studentPackageList[i].assortment_id}`,
                        display: studentPackageList[i].assortment_type === 'subject' ? studentPackageList[i].display_description : studentPackageList[i].display_name,
                        is_selected: false,
                    };
                    if (studentBatchDetails[i] && studentBatchDetails[i].length && studentBatchDetails[i][0].display_name) {
                        obj.display = studentBatchDetails[i][0].display_name;
                    }
                    if (studentPackageList[i].assortment_id === 138829) {
                        obj.category_id = 'Kota Classes';
                    }
                    courseList.push(obj);
                }
            }
            if (courseList.length > 1) {
                resData.course_list = courseList;
            }
            if (userPackageCurrentAssortment.length && userPackageCurrentAssortment[0].amount > -1 && ['course', 'class'].includes(userPackageCurrentAssortment[0].assortment_type) && studentID) {
                const deeplink = await CourseHelper.setPostPurchaseExplainerVideo(db, studentID, userPackageCurrentAssortment[0].start_date, locale, 'POST_PURCHASE_COURSE_DETAILS', userPackageCurrentAssortment[0].assortment_id);
                if (deeplink) {
                    resData.pop_up_deeplink = deeplink;
                }
            }
            // course switch module code
            if (courseDetail[0].assortment_type === 'course' && versionCode > 912 && !courseDetail[0].is_free && userPackageCurrentAssortment.length && userPackageCurrentAssortment[0].amount > -1) {
                const paymentType = await CourseMysqlV2.getPaymentSummaryBySubscription(db.mysql.read, userPackageCurrentAssortment[0].subscription_id);
                const checkCallBackData = await CourseMysqlV2.getCallBackLogsDetails(db.mysql.read, studentID, userPackageCurrentAssortment[0].subscription_id);
                const showChangeRequest = !checkCallBackData.length && paymentType.length && paymentType[0].payment_type !== 'switch-nonemi';
                const activeCourses = studentPackageList.filter((item) => item.assortment_type === 'course');
                let showPopup = _.includes([1, 8, 30], today.diff(moment(userPackageCurrentAssortment[0].start_date), 'days'));
                if (showPopup) {
                    const getPopupData = await courseV2Redis.getCourseChangeRequestData(db.redis.read, studentID, assortmentID);
                    if (_.isNull(getPopupData)) {
                        courseV2Redis.setCourseChangeRequestData(db.redis.write, studentID, assortmentID);
                    } else {
                        showPopup = false;
                    }
                }
                LiveclassHelperLocal.getCourseHelpFlowData(resData, locale, config, activeCourses.length > 1 ? null : assortmentID, showPopup, showChangeRequest);
            }
            if (versionCode >= 935) {
                resData.fab = {
                    image_url: `${config.staticCDN}engagement_framework/E0C75CE9-4108-5C4F-A8FF-2E236D8235F5.webp`,
                    deeplink: carouselCategory === 'trial_end_state' ? `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Mujhe Course ID %23${liveclassCourseDetails[0].liveclass_course_id} ki jaankari chahiye` : 'doubtnutapp://course_recommendation?page=post_purchase_page',
                };
            }
            resData.subtitle = userPackageCurrentAssortment.length ? `Valid till ${moment(userPackageCurrentAssortment[0].end_date).format('DD MMM YYYY')}` : '';
            if (isTrial && versionCode > 966) {
                resData.extra_widgets = resData.widgets;
                delete resData.widgets;
                resData.trial_title_size = '';
                resData.trial_title_color = '#000000';
                resData.time = moment(userPackageCurrentAssortment[0].end_date).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
                resData.time_text_color = '#ff0000';
                resData.time_text_size = '';
                resData.image_url = `${config.cdn_url}engagement_framework/trial_timer_new.gif`;
                resData.trial_title_expired = 'Trial Expired';
                resData.bg_color_one_expired = '#ff6262';
                resData.bg_color_two_expired = '#f6b2b2';
                resData.trial_title = 'Trial Activated';
                resData.subtitle = resData.time ? `Valid till ${moment(userPackageCurrentAssortment[0].end_date).format('DD MMM YYYY')}` : '';
                resData.bg_color_one = '#ffca62';
                resData.bg_color_two = '#fff3c7';
                if (carouselCategory === 'trial_end_state') {
                    resData.trial_title = 'Trial Expired';
                    resData.bg_color_one = '#ff6262';
                    resData.bg_color_two = '#f6b2b2';
                }
                if ((courseDetail[0].parent === 4 && assortmentPriceMapping[138829]) || assortmentPriceMapping[assortmentID]) {
                    resData.widget_view_plan_button = LiveclassHelperLocal.getCourseBuyButtonData(courseDetail, assortmentPriceMapping, locale, carouselCategory === 'trial_end_state');
                }
            }
        }
        if (versionCode < 913) {
            if (!courseDetail[0].is_free && !userPackageCurrentAssortment.length && source !== 'my_courses_tab' && versionCode > 884) {
                resData.chat_text = locale === 'hi' ? 'हमसे चैट करें' : 'Chat with Us';
                resData.call_data = callData;
            } else if (source !== 'my_courses_tab' && callData && !userPackageCurrentAssortment.length) {
                resData.call_data = callData;
            }
        }
        if (WAchatDeeplink) {
            resData.calling_card_chat_deeplink = WAchatDeeplink;
        }
        resData.assortment_id = assortmentID;
        resData.class = courseDetail.length ? `${courseDetail[0].class}` : `${studentClass}`;
        if (versionCode > 906 && !resData.pop_up_deeplink) {
            resData.pop_up_deeplink = await NudgeHelper.getPopUpDeeplink({
                db,
                locale,
                studentClass,
                event: !resData.is_vip ? 'prepurchase' : 'postpurchase',
                studentID,
            });
        }
        // course nudge popup
        if (versionCode > 941 && !resData.pop_up_deeplink) {
            resData.pop_up_deeplink = await NudgeHelper.getPopUpDeeplink({
                db,
                locale,
                studentClass,
                event: !resData.is_vip ? 'prepurchase_course' : 'postpurchase_course',
                studentID,
            });
            if (!resData.pop_up_deeplink) {
                resData.pop_up_deeplink = await NudgeHelper.getSurveyBottomSheetDeeplink({
                    db,
                    locale,
                    studentID,
                    studentClass,
                    event: !resData.is_vip ? 'prepurchase' : 'postpurchase',
                });
            }
        }

        // backpress nudge popup
        if (versionCode > 941) {
            resData.deeplink_back = await NudgeHelper.getPopUpDeeplink({
                db,
                locale,
                studentClass,
                event: !resData.is_vip ? 'prepurchase_course_back' : 'postpurchase_course_back',
                studentID,
            });
            if (!resData.deeplink_back) {
                resData.deeplink_back = await NudgeHelper.getSurveyBottomSheetDeeplink({
                    db,
                    locale,
                    studentID,
                    studentClass,
                    event: !resData.is_vip ? 'prepurchase_back' : 'postpurchase_back',
                });
            }
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: resData,
        };
        if (variantInfo.length) {
            responseData.meta.analytics = { variant_info: variantInfo };
        }
        return next({
            data: resData,
            meta: responseData.meta.analytics,
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function courseSubjectDetail({
    db,
    config,
    locale,
    subject,
    batchID,
    courseDetail,
    studentID,
    assortmentID,
    chapterAssortmentList,
    isBrowser,
    versionCode,
}) {
    try {
        const tabsData = await CourseMysqlV2.getPostPurchaseCourseCards(db.mysql.read, locale, 1, '', null, 'course_detail', versionCode);
        const tabs = [];
        tabsData.map((item) => tabs.push(item.card_id));
        const promises = [];
        for (let i = 0; i < tabs.length; i++) {
            promises.push(CourseHelper.getCourseDataByCardId({
                db, cardID: tabs[i], chapterAssortmentList, assortmentID, studentID, courseDetail, subject, batchID,
            }));
        }

        const result = await Promise.all(promises);
        const widgets = await LiveclassHelperLocal.getMultiCourseCardsWidgets({
            locale,
            result,
            subject,
            config,
            tabs: tabsData,
            assortmentID,
            isBrowser,
            db,
        });

        const data = {
            title: locale === 'hi' ? Data.subjectHindi[subject] : subject,
            widgets,
        };
        return data;
    } catch (e) {
        console.log(e);
    }
}

async function getSachetLevelDetails({
    db,
    config,
    page,
    studentPackageList,
    locale,
    studentID,
    tab,
    limit,
    offset,
    subject,
}) {
    let widgets = [];
    const chapterDetails = studentPackageList.filter((item) => item.assortment_type === 'chapter');
    const purchasedVideos = studentPackageList.filter((item) => item.assortment_type === 'resource_video');
    const purchasedPDFs = studentPackageList.filter((item) => item.assortment_type === 'resource_pdf');
    if (tab === 'sachet') {
        if (+page >= 2) {
            return widgets;
        }
        widgets = await LiveclassHelperLocal.getSachetDetails({
            db,
            config,
            chapterDetails,
            purchasedPDFs,
            purchasedVideos,
            locale,
            studentID,
        });
        return {
            title: locale === 'hi' ? 'मेरे खरीदे हुए वीडियोस और नोट्स' : 'My Videos & PDF Notes',
            widgets,
        };
    }
    if (tab === 'chapter') {
        widgets = await LiveclassHelperLocal.getChapterResourceDetails({
            db,
            config,
            chapterDetails,
            locale,
            limit,
            offset,
            subject,
        });
        return {
            title: locale === 'hi' ? 'मेरे खरीदे हुए अध्याय' : 'My Purchased Chapters',
            widgets: widgets.widgets,
            filter_widgets: [widgets.filter_widgets],
        };
    }
    if (tab === 'video') {
        widgets = await LiveclassHelperLocal.getPurchasedVideosDetails({
            db,
            config,
            purchasedVideos,
            locale,
            limit,
            offset,
            subject,
        });
        return {
            title: locale === 'hi' ? 'मेरे खरीदे हुए वीडियो' : 'My Purchased Videos',
            widgets: widgets.widgets,
            filter_widgets: [widgets.filter_widgets],
        };
    }
    if (tab === 'pdf') {
        widgets = await LiveclassHelperLocal.getPurchasedPDFDetails({
            db,
            config,
            purchasedPDFs,
            locale,
            limit,
            offset,
        });
        return {
            title: locale === 'hi' ? 'मेरे खरीदे हुए PDF' : 'My Purchased PDFs',
            widgets,
        };
    }
    return {
        widgets,
    };
}

async function courseTabDetail(req, res, next) {
    try {
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;
        const {
            tab, notes_type: notesType,
        } = req.query;
        const { is_browser: isBrowser, version_code: versionCode } = req.headers;
        let { assortment_id: assortmentID, subject, sub_tab_id: subTabId } = req.query;
        const { page } = req.query;
        if (tab === 'tests') {
            subject = 'WEEKLY TEST';
        }
        if (tab === 'magazine') {
            subject = 'CURRENT AFFAIRS';
        }
        const limit = 10;
        const offset = (page - 1) * limit;
        const studentPackageList = await CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID);
        let responseData = null;
        let data = null;
        if (tab === 'sachet' || tab === 'chapter' || tab === 'video' || tab === 'pdf') {
            const widgetData = await getSachetLevelDetails({
                db,
                config,
                locale,
                page,
                tab,
                studentID,
                studentPackageList,
                limit,
                offset,
                subject,
            });
            responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: widgetData,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        let isMultiple = false;
        if (assortmentID.includes(',')) {
            assortmentID = assortmentID.split(',');
            isMultiple = true;
        }
        const courseDetail = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID);
        const isVod = !!courseDetail[0].course_id;
        let courseAssortment = assortmentID;
        if (courseDetail[0].assortment_type === 'subject' && tab === 'tests') {
            const parentMappings = await CourseMysqlV2.getAllParentAssortments(db.mysql.read, [assortmentID]);
            courseAssortment = parentMappings[0].assortment_id;
        }
        const [
            tabDetail,
            chapterList,
        ] = await Promise.all([
            CourseMysqlV2.getPostPurchaseCourseCardsById(db.mysql.read, tab, locale),
            isVod ? CourseMysqlV2.getChapterListOfAssortmentVod(db.mysql.read, subject, courseAssortment, tab === 'tests' ? 'course' : courseDetail[0].assortment_type, limit, offset, tab, isMultiple) : CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, subject, courseAssortment, tab === 'tests' ? 'course' : courseDetail[0].assortment_type, limit, offset, tab),
        ]);
        let userPackageCurrentAssortment = [];
        if (!isMultiple) {
            userPackageCurrentAssortment = studentPackageList.filter((e) => e.assortment_id === +assortmentID);
            if (!userPackageCurrentAssortment.length) {
                userPackageCurrentAssortment = await checkVipForParentAssortments(db, studentPackageList, courseDetail);
            }
            if (!userPackageCurrentAssortment.length && !courseDetail[0].is_free) {
                responseData = {
                    meta: {
                        code: 200,
                        message: 'Not Subscribed',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        const batchID = userPackageCurrentAssortment.length ? userPackageCurrentAssortment[0].batch_id : 1;
        if (courseDetail[0].assortment_type.includes('resource') && offset) {
            responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: {
                    title: '',
                    widgets: [],
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        let chapterAssortmentList = [];
        if (notesType) {
            const allChapterList = isVod ? await CourseMysqlV2.getChapterListOfAssortmentVodAll(db.mysql.read, subject, courseAssortment, tab === 'tests' ? 'course' : courseDetail[0].assortment_type, tab) : await CourseMysqlV2.getChapterListOfAssortmentAll(db.mysql.read, subject, courseAssortment, tab === 'tests' ? 'course' : courseDetail[0].assortment_type, limit, offset, tab);
            allChapterList.map((item) => chapterAssortmentList.push(item.course_resource_id));
            if (+page > 1) {
                chapterAssortmentList = [];
            }
        } else {
            chapterList.map((item) => chapterAssortmentList.push(item.course_resource_id));
        }
        if (courseDetail[0].assortment_type === 'chapter' && !offset) {
            chapterAssortmentList.push(+assortmentID);
        }
        if (tab === 'subject') {
            if (+page === 2) {
                data = {
                    widgets: [],
                };
            } else {
                data = await courseSubjectDetail({
                    db,
                    config,
                    locale,
                    subject,
                    batchID,
                    studentID,
                    courseDetail,
                    assortmentID,
                    chapterAssortmentList,
                    isBrowser,
                    versionCode,
                });
            }
        } else if (tab === 'revision') {
            let cardValues = await CourseMysqlV2.getPostPurchaseCourseCards(db.mysql.read, locale, 0, 'course', 'revision', 'course_detail', versionCode);
            cardValues = cardValues.filter((item) => item.sub_level === 'revision');
            const promise = [];
            const tabDetails = {};
            for (let i = 0; i < cardValues.length; i++) {
                promise.push(CourseHelper.getCourseDataByCardId({
                    db, cardID: cardValues[i].card_id, chapterAssortmentList: [1], page, courseDetail, batchID,
                }));
            }
            const cardData = await Promise.all(promise);
            for (let i = 0; i < cardValues.length; i++) {
                tabDetails[cardValues[i].card_id] = cardData[i] === -1 ? cardData[i] : cardData[i].length;
            }
            const widgets = [];
            if (+page === 1) {
                const result = await WidgetHelper.getPostPuchaseCourseCardsWidget({
                    locale,
                    tabDetails,
                    assortmentID,
                    courseDetail,
                    carousel: { title: locale === 'hi' ? 'रिवीज़न' : 'Revision', carousel_type: 'course_cards' },
                    result: cardValues || [],
                    isBrowser,
                    config,
                    studentID,
                    batchID,
                    db,
                    isFreeApp,
                });
                widgets.push(result);
            }
            data = {
                widgets,
            };
        } else {
            let tabData = [];
            if (tab === 'bookmark') {
                tabData = await LiveclassHelperLocal.getFiltersForBookmarkTabs(db, subTabId, locale, studentID, courseDetail, batchID);
                subTabId = subTabId || tabData.items[0].id;
            }
            let result = await CourseHelper.getCourseDataByCardId({
                db, cardID: tab, chapterAssortmentList, studentID, notesType, courseDetail, subject, offset, page, batchID, versionCode, subTabId,
            });
            if (isBrowser && result && result.length) {
                result = result.filter((item) => item.stream_status !== 'ACTIVE');
            }
            // let i = 1;
            // while (!result.length && i < 3) {
            // chapterAssortmentList = [];
            // const chapterListNext = isVod ? await CourseMysqlV2.getChapterListOfAssortmentVod(db.mysql.read, subject, courseAssortment, tab === 'tests' ? 'course' : courseDetail[0].assortment_type, limit, offset + (i * limit), tab) : await CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, subject, assortmentID, courseDetail[0].assortment_type, limit, offset + (i * limit));
            // // eslint-disable-next-line no-loop-func
            // chapterListNext.forEach((item) => chapterAssortmentList.push(item.course_resource_id));
            // result = await CourseHelper.getCourseDataByCardId({
            //     db, cardID: tab, chapterAssortmentList, studentID, notesType, courseDetail, subject, offset, page, batchID, subTabId,
            // });
            if (isBrowser && result && result.length) {
                result = result.filter((item) => item.stream_status !== 'ACTIVE');
            }
            // i++;
            // }
            let subjectFilters;
            if (tab === 'upcoming' && !offset) {
                const { coursePsudoSchedule, subjectList } = await CourseHelper.getCoursePsudoSchedule({
                    db,
                    assortmentId: courseDetail[0].assortment_id,
                    subject: req.query.subject,
                    batchId: batchID,
                    courseDetail: courseDetail[0],
                    locale,
                });
                if (coursePsudoSchedule.length) {
                    result = [...result, ...coursePsudoSchedule];
                    const classHash = [];
                    result = result.filter((elem) => {
                        const classHashValue = [elem.week, elem.day, elem.month, elem.year, moment(elem.live_at).hour()].join('_!_');
                        if (!classHash.includes(classHashValue)) {
                            classHash.push(classHashValue);
                            return 1;
                        }
                        return false;
                    });
                }
                if (subjectList) {
                    subjectFilters = subjectList;
                }
            }
            const widgets = result.length ? await LiveclassHelperLocal.getCourseCardsWidgets({
                db,
                page,
                locale,
                result,
                config,
                batchID,
                cardID: tab === 'bookmark' ? subTabId : tab,
                assortmentID,
                chapterAssortmentList,
                isMultiple,
            }) : [];

            data = {
                title: tabDetail.length ? tabDetail[0].title : tab,
                widgets,
            };

            if (subjectFilters) {
                data.filter_widgets = [subjectFilters];
            }

            if (courseDetail[0].parent === 4 && tab === 'missed_classes') {
                data.title = locale === 'hi' ? 'हाल ही में देखे गए' : 'Recently watched';
            }

            if (courseDetail[0].assortment_type === 'course' && _.includes(['recent', 'notes', 'homework', 'previousYears', 'books', 'ncert', 'imp_ques_subjective', 'imp_ques_objective', 'sample_paper'], tab)) {
                const subjectList = await LiveclassHelperLocal.getSubjectFilters(db, assortmentID, locale, subject, tab, isMultiple);
                if (subjectList) {
                    data.filter_widgets = [subjectList];
                }
            }

            if (tab === 'notes' && courseDetail[0].assortment_type !== 'resource_pdf') {
                const notesFilters = await LiveclassHelperLocal.getNotesFilters(db, notesType, locale, courseDetail);
                if (notesFilters) {
                    if (data.filter_widgets) {
                        data.filter_widgets.push(notesFilters);
                    } else {
                        data.filter_widgets = [notesFilters];
                    }
                }
            } else if (tab === 'homework') {
                const homeworkFilters = LiveclassHelperLocal.getHomeworkFilters(notesType, locale);
                if (homeworkFilters) {
                    if (data.filter_widgets) {
                        data.filter_widgets.push(homeworkFilters);
                    } else {
                        data.filter_widgets = [homeworkFilters];
                    }
                }
            } else if (tab === 'bookmark') {
                data.tab_data = tabData;
            }

            // course leaderboard
            if (tab === 'tests' && page == 1 && versionCode > 914) {
                const min = 0;
                const max = 0;
                let newId;
                if (batchID) {
                    newId = `${assortmentID}_${batchID}`;
                }
                const leaderBoard = await CourseRedisV2.getCourseLeaderboardAll(db.redis.read, newId, min, max);
                const myRank = await CourseRedisV2.getUserCourseLeaderboardAllRank(db.redis.read, newId, studentID);
                const score = await CourseMysqlV2.getStudentScoreAll(db.mysql.read, assortmentID, studentID);
                let myScore = 0;
                let totalMarks = 0;
                if (score && score[0]) {
                    for (let j = 0; j < score.length; j++) {
                        myScore += score[j].totalscore;
                        totalMarks += score[j].totalmarks;
                    }
                }
                const [topperScores, studentDetails] = await Promise.all([CourseMysqlV2.getStudentScoreAll(db.mysql.read, assortmentID, leaderBoard[0]), StudentContainer.getById(leaderBoard[0], db)]);
                let topperScore = 0;
                let totalMarksTopper = 0;
                if (topperScores && topperScores[0]) {
                    for (let j = 0; j < topperScores.length; j++) {
                        topperScore += topperScores[j].totalscore;
                        totalMarksTopper += topperScores[j].totalmarks;
                    }
                }
                if (leaderBoard && leaderBoard[0]) {
                    const pageDescription = 'course_tab_details';
                    const deepLink = `doubtnutapp://leaderboard?source=course&assortment_id=${assortmentID}`;
                    const item = [{
                        id: 3,
                        tab: 1,
                        title1: (topperScores && topperScores[0]) ? `${topperScore}` : '0',
                        title2: (topperScores && topperScores[0]) ? `/ ${totalMarksTopper}` : '/ 100',
                        marks: (topperScores && topperScores[0]) ? `${topperScore}` : '0',
                        total_marks: (topperScores && topperScores[0]) ? `${totalMarksTopper}` : '100',
                        type: 'topper_marks',
                        bottom_text: locale === 'hi' ? 'टॉपर के मार्क्स ' : "Topper's Marks",
                        image: (studentDetails && studentDetails[0] && studentDetails[0].img_url) ? studentDetails[0].img_url : `${config.staticCDN}/engagement_framework/B40E545F-068A-04AF-5AD9-B894FE532184.webp`,
                        title1_font_size: 22,
                        title2_font_size: 16,
                        bottom_text_font_size: 14,
                        title1_color: '#ea4053',
                        title2_color: '#ea4053',
                        bottom_text_color: '#504949',
                        deeplink: deepLink,
                    }];
                    const profileData = gamificationHelper.getStudentProfile(config, 1, locale, myRank, myScore, totalMarks, deepLink, pageDescription);
                    item.unshift(profileData[1]);
                    item.unshift(profileData[0]);
                    data.widgets.unshift({
                        type: 'widget_leaderboard_personal',
                        data: {
                            margin: true,
                            items: item,
                        },
                    });
                }
            }
        }

        responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getAllFiltersForChapterDetails(db, assortmentID, locale, studentClass, selectedLanguage, selectedClass, course) {
    studentClass = selectedClass || studentClass;
    let language = selectedLanguage || (locale === 'hi' ? 'HINDI' : 'ENGLISH');
    language = (studentClass === '13') ? 'ENGLISH' : language;
    language = (studentClass === '14') ? 'HINDI' : language;
    let classWithMultiAssortmentId; let languageWithMultiAssortmentId;

    const allAssortmentDetails = await CourseMysqlV2.getAllChapterDetails(db.mysql.read);
    const classItems = [];
    const courseItems = [];
    let assortmentClass;
    assortmentID = ((selectedLanguage || selectedClass) && !course) ? null : assortmentID;
    assortmentID = course || assortmentID;

    for (let i = 0; i < allAssortmentDetails.length; i++) {
        if ((assortmentID && allAssortmentDetails[i].assortment_id === +assortmentID) || (!assortmentID && allAssortmentDetails[i].class === +studentClass && allAssortmentDetails[i].medium === language && (allAssortmentDetails[i].category_type === 'BOARDS/SCHOOL/TUITION' || studentClass === '13'))) {
            if (assortmentID && allAssortmentDetails[i].assortment_id === +assortmentID && allAssortmentDetails[i].class === +selectedClass && allAssortmentDetails[i].medium === selectedLanguage) {
                classWithMultiAssortmentId = allAssortmentDetails[i].class;
                languageWithMultiAssortmentId = allAssortmentDetails[i].medium;
            }
            assortmentID = allAssortmentDetails[i].assortment_id;
            language = allAssortmentDetails[i].medium;
            assortmentClass = allAssortmentDetails[i].class;
        }
        if (allAssortmentDetails[i].class && allAssortmentDetails[i].class === 13) {
            classItems.push({ value: allAssortmentDetails[i].class, label: 'Dropper', is_selected: false });
        } else if (allAssortmentDetails[i].class && allAssortmentDetails[i].class === 14) {
            classItems.push({ value: allAssortmentDetails[i].class, label: 'Govt. Exams', is_selected: false });
        } else {
            classItems.push({ value: allAssortmentDetails[i].class, label: allAssortmentDetails[i].class, is_selected: false });
        }
    }
    assortmentClass = classWithMultiAssortmentId || assortmentClass;
    language = languageWithMultiAssortmentId || language;

    // filter out selected items
    classItems.forEach((x) => {
        if (assortmentClass && x.value === assortmentClass) {
            x.is_selected = true;
        }
    });
    allAssortmentDetails.forEach((x) => {
        if (x.class === assortmentClass && x.medium === language) {
            const courseObj = { value: x.assortment_id, label: x.course_name, is_selected: false };
            if (assortmentID && x.assortment_id === assortmentID) {
                courseObj.is_selected = true;
            }
            courseItems.push(courseObj);
        }
    });

    let languageItems = language === 'HINDI' ? [{ value: 'ENGLISH', label: 'English', is_selected: false }, { value: 'HINDI', label: 'Hindi', is_selected: true }] : [{ value: 'ENGLISH', label: 'English', is_selected: true }, { value: 'HINDI', label: 'Hindi', is_selected: false }];
    languageItems = studentClass === '14' ? [{ value: 'HINDI', label: 'Hindi', is_selected: true }] : languageItems;
    languageItems = studentClass === '13' ? [{ value: 'ENGLISH', label: 'English', is_selected: true }] : languageItems;

    const singleSelectFilterWidget = [{
        label: 'Class', key: 'class', list: _.unionBy(classItems, 'value'),
    }, {
        label: 'Medium', key: 'language', list: languageItems,
    }, {
        label: 'Course', key: 'course', list: courseItems,
    }];
    locale = language === 'HINDI' ? 'hi' : 'en';
    return { selectedAssortmentId: assortmentID, selectedLocale: locale, singleSelectFilterWidget };
}

// have copied all the code from above api cause it can be used in future
async function courseTabDetailNew(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, student_class: studentClass } = req.user;
        let { locale } = req.user;
        const {
            tab, notes_type: notesType, language, class: selectedClass, course,
        } = req.query;
        let { subject, assortment_id: assortmentID } = req.query;
        const { page } = req.query;
        if (tab === 'tests') {
            subject = 'ALL';
        }
        let filterDataForRecentTab;
        const limit = 10;
        const offset = (page - 1) * limit;
        // checking for other filters
        if (tab === 'recent') {
            const { selectedAssortmentId, selectedLocale, singleSelectFilterWidget } = await getAllFiltersForChapterDetails(db, assortmentID, locale, studentClass, language, selectedClass, course);
            assortmentID = selectedAssortmentId;
            locale = selectedLocale;
            filterDataForRecentTab = singleSelectFilterWidget;
        }

        const courseDetail = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID);
        const isVod = !!courseDetail[0].course_id;
        const [
            tabDetail,
            chapterList,
            studentPackageList,
        ] = await Promise.all([
            CourseMysqlV2.getPostPurchaseCourseCardsById(db.mysql.read, tab, locale),
            isVod ? CourseMysqlV2.getChapterListOfAssortmentVod(db.mysql.read, subject, assortmentID, courseDetail[0].assortment_type, limit, offset, tab) : CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, subject, assortmentID, courseDetail[0].assortment_type, limit, offset, tab),
            CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID),
        ]);
        let userPackageCurrentAssortment = studentPackageList.filter((e) => e.assortment_id === +assortmentID);
        if (!userPackageCurrentAssortment.length) {
            userPackageCurrentAssortment = await checkVipForParentAssortments(db, studentPackageList, courseDetail);
        }
        let responseData = null;
        let data = null;
        if (!userPackageCurrentAssortment.length && !courseDetail[0].is_free) {
            responseData = {
                meta: {
                    code: 200,
                    message: 'Not Subscribed',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const batchID = userPackageCurrentAssortment.length ? userPackageCurrentAssortment[0].batch_id : 1;
        if (courseDetail[0].assortment_type.includes('resource') && offset) {
            responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: {
                    title: '',
                    widgets: [],
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const chapterAssortmentList = [];
        chapterList.map((item) => chapterAssortmentList.push(item.course_resource_id));
        if (courseDetail[0].assortment_type === 'chapter' && !offset) {
            chapterAssortmentList.push(+assortmentID);
        }
        if (tab === 'subject') {
            if (+page === 2) {
                data = {
                    widgets: [],
                };
            } else {
                data = await courseSubjectDetail({
                    db,
                    config,
                    locale,
                    subject,
                    batchID,
                    studentID,
                    courseDetail,
                    assortmentID,
                    chapterAssortmentList,
                });
            }
        } else {
            let result = await CourseHelper.getCourseDataByCardId({
                db, cardID: tab, chapterAssortmentList, studentID, notesType, courseDetail, subject, offset, batchID,
            });

            let i = 1;
            while (!result.length && i < 6) {
                const chapterListNext = await CourseMysqlV2.getChapterListOfAssortment(db.mysql.read, subject, assortmentID, courseDetail[0].assortment_type, limit, offset + (i * limit));
                chapterListNext.map((item) => chapterAssortmentList.push(item.course_resource_id));
                result = await CourseHelper.getCourseDataByCardId({
                    db, cardID: tab, chapterAssortmentList, studentID, notesType, courseDetail, subject, offset, batchID,
                });
                i++;
            }

            const widgets = result.length ? await LiveclassHelperLocal.getCourseCardsWidgets({
                db,
                page,
                locale,
                result,
                config,
                cardID: tab,
                assortmentID,
            }) : [];

            data = {
                title: tabDetail.length ? tabDetail[0].title : tab,
                widgets,
            };

            if (courseDetail[0].parent === 4 && tab === 'missed_classes') {
                data.title = locale === 'hi' ? 'हाल ही में देखे गए' : 'Recently watched';
            }

            if (courseDetail[0].assortment_type === 'course' && _.includes(['recent', 'notes', 'homework', 'upcoming'], tab)) {
                const subjectList = await LiveclassHelperLocal.getSubjectFilters(db, assortmentID, locale, subject, tab);
                if (subjectList) {
                    data.filter_widgets = [subjectList];
                }
            }

            if (tab === 'notes' && courseDetail[0].assortment_type !== 'resource_pdf') {
                const notesFilters = await LiveclassHelperLocal.getNotesFilters(db, notesType, locale, courseDetail);
                if (notesFilters) {
                    if (data.filter_widgets) {
                        data.filter_widgets.push(notesFilters);
                    } else {
                        data.filter_widgets = [notesFilters];
                    }
                }
            }
        }
        if (tab === 'recent' && data && data.widgets && data.widgets.length && filterDataForRecentTab) {
            data.single_select_filter_widget = filterDataForRecentTab;
        }

        responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function prePurchaseTabDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, student_class: studentClass } = req.user;
        let { locale } = req.user ? req.user : {};
        locale = locale === 'hi' ? locale : 'en';
        const {
            tab, page, filter_value: filterValue,
        } = req.query;
        let { assortment_id: assortmentID } = req.query;
        const { version_code: versionCode, package_name: packageName } = req.headers;
        assortmentID = assortmentID.split('||')[0];
        if (assortmentID.includes('xxxx') && studentID) {
            const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentID);
            assortmentID = await CourseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, (assortmentID.split('_')[1]) ? assortmentID.split('_')[1] : locale, assortmentID);
        }
        const [
            courseDetail,
            batchID,
            checkTrialAvailibilty,
            ccNotifData,
            ppPageNotifCount,
        ] = await Promise.all([
            CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID),
            CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID),
            CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, assortmentID),
            _.includes([11, 12, 13], +studentClass) ? CourseContainer.getCourseCampNotifData(db, studentID) : [], // user is from ceo-referrer program
            CourseRedisV2.getCourseNotificationData(db.redis.read, `COURSE_NOTIFICATION:${studentID}`, 'pp_notif_count'), // check user already notif sent or not
        ]);

        if (ccNotifData.length && !ppPageNotifCount && packageName !== altAppData.freeAppPackageName) {
            CourseRedisV2.setCourseNotificationData(db.redis.write, 'REFREE_PREPURCHASE_PAGE_VISITED', +studentID, `${assortmentID}`, 60 * 60 * 24);
        }
        const showTrial = false;
        const widgets = +page === 1 ? await LiveclassHelperLocal.getPrePurchaseTabsDataByTabId({
            db,
            config,
            locale,
            studentID,
            tabID: tab,
            batchID,
            courseDetail,
            filterValue,
            versionCode,
            showTrial,
            checkTrialAvailibilty,
            campaign: req.user.campaign,
        }) : [];
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    getCourseDetail,
    courseTabDetail,
    courseTabDetailNew,
    prePurchaseTabDetail,
};
