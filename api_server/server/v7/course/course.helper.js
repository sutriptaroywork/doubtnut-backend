/* eslint-disable prefer-const */
/* eslint-disable no-await-in-loop */
const moment = require('moment');
const _ = require('lodash');
const { ObjectId } = require('mongodb');
const LiveclassHelper = require('../../helpers/liveclass');
const LiveclassData = require('../../../data/liveclass.data');
const CourseHelper = require('../../helpers/course');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const PackageMysql = require('../../../modules/mysql/package');
const Data = require('../../../data/data');
const WidgetHelper = require('../../widgets/liveclass');
const HomepageWidgetHelper = require('../../widgets/homepage');
const CourseContainer = require('../../../modules/containers/coursev2');
const { autoScrollTime } = require('../../../data/data');
const AnswerContainer = require('../../v13/answer/answer.container');
const NudgeHelper = require('../../helpers/nudge');
const { getAssortmentIdParams } = require('../../../modules/containers/paidUserChampionship');
const PaidUserChampionshipRedis = require('../../../modules/redis/paidUserChampionship');
const { getProgressWidget, calculatePaidUserChampionshipLeaderBoardScore, checkIfLeaderboardsHasEntry } = require('../../helpers/paidUserChamionship');
const FreeClassListingPageMysql = require('../../../modules/mysql/freeClassListingPage');
const randomNumberGenerator = require('../../../modules/randomNumberGenerator');
const TGHelper = require('../../helpers/target-group');
const freeClassListingPageContainer = require('../../../modules/containers/freeClassListingPage');
const Coursev2Container = require('../../../modules/containers/coursev2');
const freeClassListingPageText = require('../../../data/freeClassListingText');
const studentRedis = require('../../../modules/redis/student');
const FreeChapterListingHelper = require('../../helpers/freeChapterListing');
const pzn = require('../../../modules/containers/pzn');
const clpMysql = require('../../../modules/mysql/clp');
const referralFlowHelper = require('../../helpers/referralFlow');
const altAppData = require('../../../data/alt-app');

function getBannerWidgetObject() {
    return {
        type: 'promo_list',
        data: {
            auto_scroll_time_in_sec: autoScrollTime,
            items: [],
            ratio: '5:1',
        },
    };
}

async function getBannersForCoursePage(db, assortmentID, batchID) {
    const banner = getBannerWidgetObject();
    banner.data.items = await CourseHelper.getBanners(db, assortmentID, banner.data.items, false, batchID);
    if (banner.data.items.length) {
        return banner;
    }
    return {};
}

function getShareData(courseDetail, studentID) {
    let shareableMessage;
    const shareImage = courseDetail[0].demo_video_thumbnail;
    const competitive = ['IIT JEE', 'IIT JEE | NEET', 'NDA', 'NEET'];
    if (courseDetail[0].is_free) {
        shareableMessage = competitive.indexOf(courseDetail[0].category) !== -1 ? LiveclassData.getShareMessageFree(courseDetail[0].category, courseDetail[0].meta_info) : LiveclassData.getShareMessageFree(courseDetail[0].display_name, courseDetail[0].meta_info);
    } else if (!courseDetail[0].is_free) {
        shareableMessage = competitive.indexOf(courseDetail[0].category) !== -1 ? LiveclassData.getShareMessagePaid(courseDetail[0].category, courseDetail[0].meta_info) : shareableMessage = LiveclassData.getShareMessagePaid(courseDetail[0].display_name, courseDetail[0].meta_info);
    }
    return {
        shareable_message: shareableMessage,
        control_params: {
            id: `${courseDetail[0].assortment_id}||${courseDetail[0].class}`,
            student_class: `${courseDetail[0].class}`,
            referrer_student_id: `${studentID}`,
        },
        feature_name: 'course_details',
        channel: `CRS_DET500_${courseDetail[0].assortment_id}_${courseDetail[0].class}`,
        campaign_id: 'CRS_SHARE_EARN',
        share_image: shareImage,
    };
}

function getCourseBuyButtonData(courseDetail, assortmentPriceMapping, locale, isTrialExpired, couponAndUserData = null) {
    const assortmentID = courseDetail[0].assortment_id;
    const priceObj = courseDetail[0].parent === 4 ? assortmentPriceMapping[138829] : assortmentPriceMapping[assortmentID];
    const obj = {
        text_one: locale === 'hi' ? 'प्लान देखें' : 'View Plans Starting at',
        text_one_size: locale === 'hi' ? '16' : '14',
        text_one_color: '#ffffff',
        text_two: courseDetail[0].sub_assortment_type === 'mock_test' ? `₹${priceObj.display_price}` : `₹${priceObj.monthly_price}/${locale === 'hi' ? 'महीना से शुरू' : 'Month'}`,
        strike_through_text: `<s>₹${Math.floor(priceObj.base_price / Math.floor(priceObj.duration / 30))}</s>`,
        text_two_size: '22',
        text_two_color: '#fcfcfc',
        bg_color: '#eb532c',
        show_icon_end: 'ru',
        deep_link: `doubtnutapp://bundle_dialog?id=${courseDetail[0].parent === 4 ? 138829 : assortmentID}&source=PRE_PURCHASE_BUY_BUTTON${isTrialExpired ? '||TRIAL_END_STATE' : ''}`,
        extra_params: {
            assortment_id: assortmentID,
        },
    };
    if (!priceObj.multiple && courseDetail[0].sub_assortment_type !== 'mock_test') {
        obj.text_one = locale === 'hi' ? 'एडमिशन लें' : 'Get Admission';
        obj.text_two = `₹${priceObj.monthly_price}/${locale === 'hi' ? 'महीना' : 'Month'}`;
        obj.deep_link = `doubtnutapp://vip?variant_id=${priceObj.package_variant}`;
    }
    if (couponAndUserData) {
        obj.header_title = `Only available with ${couponAndUserData.username}'s Code '${couponAndUserData.coupon_code}'`;
        obj.header_title_text_size = 14;
        obj.header_title_text_color = '#3c9d00';
        obj.header_background_color = '#edffe1';
    }
    if ([1000359, 1000360, 1067132, 1067539].includes(assortmentID)) {
        obj.text_two = `₹${priceObj.display_price}`;
        obj.strike_through_text = '';
    }
    return obj;
}

async function getPrePurchaseCourseTabs(locale, courseDetail, db) {
    const items = [
        {
            id: 'course_details',
            text: (locale === 'hi') ? 'कोर्स सम्बंधित जानकारी' : 'Course Details ',
        },
        {
            id: 'sample_content',
            text: (locale === 'hi') ? 'सैंपल कंटेंट' : 'Sample Content',
        },
        {
            id: 'syllabus',
            text: (locale === 'hi') ? 'सिलेबस' : 'Syllabus',
        },
    ];
    if (courseDetail[0].sub_assortment_type !== 'mock_test') {
        items.push({
            id: 'timetable',
            text: (locale === 'hi') ? 'टाइम टेबल' : 'Time Table',
        });
    }
    if (courseDetail[0].assortment_type === 'course' && courseDetail[0].sub_assortment_type !== 'mock_test') {
        let subjectList = await CourseMysqlV2.getSubjectsListByCourseAssortment(db.mysql.read, courseDetail[0].assortment_id);
        subjectList = subjectList.filter((item) => item.display_name !== 'GUIDANCE' && item.demo_video_thumbnail);
        if (subjectList.length) {
            items.push({
                id: 'related_course',
                text: (locale === 'hi') ? 'सम्बंधित कोर्स' : 'Related Courses',
            });
        }
    }
    return items;
}

async function getIntroVideoForPrePurchase({
    batchID,
    db,
    courseDetail,
    config,
    checkTrialEligibility,
    locale,
    assortmentPriceMapping,
    versionCode,
}) {
    const sch = '';
    const demoVideo = await CourseHelper.getCourseDemoVideoData(db, config, courseDetail, checkTrialEligibility, locale, assortmentPriceMapping, sch);
    if (demoVideo.qid) {
        if (batchID > 1) {
            const latestBatchData = await CourseContainer.getLastestBatchByAssortment(db, courseDetail[0].assortment_id);
            if (latestBatchData.length && latestBatchData[0].demo_video_qid) {
                demoVideo.qid = latestBatchData[0].demo_video_qid;
            }
        }
        const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, demoVideo.qid);
        if (answerData.length) {
            const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideo.qid, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
            demoVideo.video_resources = videoResources;
        }
    }
    return demoVideo;
}

async function getDemoVideosList({
    db, courseDetail, assortmentID, batchID,
}) {
    let data = courseDetail[0].assortment_type && courseDetail[0].assortment_type.includes('course') ? await CourseContainer.getDemoVideoExperiment(db, assortmentID, courseDetail[0].class) : await CourseContainer.getDemoVideoSubject(db, assortmentID);
    const batchWiseData = data.filter((item) => item.batch_id === batchID);
    data = batchWiseData.length ? batchWiseData : data;
    // if (courseDetail[0].assortment_type === 'course') {
    //     const batchIntroVideo = introVideo.filter((item) => item.batch_id === batchID);
    //     data = batchIntroVideo.length ? batchIntroVideo : introVideo;
    //     if (data.length > 1) {
    //         data = data.slice(0, 1);
    //     }
    // }
    const result = data;
    return result;
}

async function getDemoVideosForPrePurchase({
    db,
    config,
    locale,
    batchID,
    versionCode,
    assortmentID,
    courseDetail,
    bottomSheet,
    source,
}) {
    const result = await getDemoVideosList({
        db, courseDetail, assortmentID, batchID, showAllSubjects: false,
    });
    const home = result.length > 1;
    let widgetDemo = {};
    if (result.length) {
        widgetDemo = await WidgetHelper.getPostPuchaseLecturesWidget({
            db,
            home,
            locale,
            config,
            result: bottomSheet ? result.splice(0, 1) : result,
            assortmentID,
            carousel: { carousel_type: 'widget_autoplay' },
            newDemoVideoExperiment: true,
            versionCode,
            source,
        });
        if (bottomSheet) {
            widgetDemo.data.items[0].data.card_width = '1';
        }
    }
    return widgetDemo;
}

async function getDemoVideosForPrePurchaseByQid({
    db,
    config,
    locale,
    versionCode,
    assortmentID,
    bottomSheet,
    source,
    qid,
}) {
    const result = await CourseMysqlV2.getLiveclassResourceByResourceReference(db.mysql.read, qid.toString());
    const home = result.length > 1;
    let widgetDemo = {};
    if (result.length) {
        widgetDemo = await WidgetHelper.getPostPuchaseLecturesWidget({
            db,
            home,
            locale,
            config,
            result: bottomSheet ? result.splice(0, 1) : result,
            assortmentID,
            carousel: { carousel_type: 'widget_autoplay' },
            newDemoVideoExperiment: true,
            versionCode,
            source,
        });
        _.set(widgetDemo, 'data.title', '');
        if (bottomSheet) {
            widgetDemo.data.items[0].data.card_width = '1';
        }
    }
    return widgetDemo;
}

function contentFilters(locale, filterData) {
    const items = [];
    if (filterData.video) {
        items.push({
            id: 'video',
            text: locale === 'hi' ? 'वीडियो' : 'Videos',
        });
    }
    if (filterData.notes) {
        items.push({
            id: 'notes',
            text: locale === 'hi' ? 'नोट्स' : 'Notes',
        });
    }
    if (filterData.books) {
        items.push({
            id: 'books',
            text: locale === 'hi' ? 'किताबें' : 'Books',
        });
    }
    if (filterData.test) {
        items.push({
            id: 'test',
            text: locale === 'hi' ? 'टेस्ट' : 'Tests',
        });
    }
    return items;
}

async function getRelatedContentData({
    db,
    config,
    studentID,
    courseDetail,
    versionCode,
    locale,
}) {
    const widgets = [];
    const subjectList = await CourseMysqlV2.getSubjectsListByCourseAssortment(db.mysql.read, courseDetail[0].assortment_id);
    const assortmentList = [];
    subjectList.map((item) => assortmentList.push(item.assortment_id));
    const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
    const promises = [];
    for (let i = 0; i < subjectList.length; i++) {
        if (subjectList[i].display_name !== 'GUIDANCE' && subjectList[i].demo_video_thumbnail) {
            promises.push(CourseHelper.generateAssortmentObject({
                data: subjectList[i],
                config,
                paymentCardState: { isVip: false },
                assortmentPriceMapping,
                db,
                setWidth: null,
                versionCode,
                assortmentFlagrResponse: {},
                locale,
                category: null,
                page: 'PRE_PURCHASE_SUBJECT_LIST',
                studentId: studentID,
            }));
        }
    }
    const items = await Promise.all(promises);
    widgets.push({
        type: 'widget_parent',
        data: {
            items,
            scroll_direction: 'vertical',
        },
    });
    widgets.push(WidgetHelper.getPrePurchaseCallWidget({
        config, locale, text: locale === 'hi' ? 'कोर्स की अधिक जानकारी के लिए कॉल करें' : 'Discuss more details about this course on a call', assortmentID: courseDetail[0].assortment_id, tab: 'related_courses',
    }));
    widgets.push(WidgetHelper.borderButtonWidget({ text: locale === 'hi' ? 'सभी कोर्स देखें' : 'Explore All Courses', deeplink: `doubtnutapp://course_category?category_id=${courseDetail[0].category}`, type: 'explore_all_courses' }));
    return widgets;
}

async function getFaqsWidgets({
    db, courseDetail, batchID, versionCode, faqsData, locale, config,
}) {
    let demoVideo = courseDetail[0].demo_video_qid;
    let widgetData = [];
    if (demoVideo) {
        if (batchID > 1) {
            const latestBatchData = await CourseMysqlV2.getLastestBatchByAssortment(db.mysql.read, courseDetail[0].assortment_id);
            if (latestBatchData.length && latestBatchData[0].demo_video_qid) {
                demoVideo = latestBatchData[0].demo_video_qid;
            }
        }
        const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, demoVideo);
        if (answerData.length) {
            const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideo, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
            widgetData = CourseHelper.getPrePurchaseCourseFAQs(faqsData, locale, videoResources, true, false, versionCode, demoVideo);
        } else {
            widgetData = CourseHelper.getPrePurchaseCourseFAQs(faqsData, locale, [], true, false, versionCode, demoVideo);
        }
    } else {
        widgetData = CourseHelper.getPrePurchaseCourseFAQs(faqsData, locale, [], true, false, versionCode, demoVideo);
    }
    return widgetData;
}

async function getCourseDetailsTabData({
    db,
    config,
    batchID,
    studentID,
    courseDetail,
    versionCode,
    locale,
    showTrial,
    courseAssormentData,
    checkTrialAvailibilty,
    campaign,
}) {
    const widgets = [];
    const assortmentID = courseDetail[0].assortment_id;
    const superCategory = _.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA'], courseDetail[0].category) ? courseDetail[0].category : 'State Board (Named)';
    const referralCampaignData = versionCode >= 1012 ? await referralFlowHelper.getRefererSidAndCouponCode(db, studentID) : false;
    let type = 'default';
    if (campaign === 'UAC_InApp_CBSE_9-12_Board_EM') {
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
    let [
        courseFeatures,
        faqsData,
        teachersData,
        reviewDataByAssortmentId,
        reviewDataByCategory,
        reviewData,
        packageDetails,
        userQuizReward,
    ] = await Promise.all([
        CourseHelper.getPrePurchaseCourseFeatures(db, locale, courseAssormentData.length ? courseAssormentData[0].assortment_id : assortmentID, true),
        CourseMysqlV2.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', batchID),
        CourseMysqlV2.getTeachersByAssortmentId(db.mysql.read, assortmentID, courseDetail[0].assortment_type),
        CourseMysqlV2.getCourseReviewsByAssortmentId(db.mysql.read, assortmentID, superCategory, courseDetail[0].meta_info, courseDetail[0].class),
        CourseMysqlV2.getCourseReviewsByCategory(db.mysql.read, superCategory, courseDetail[0].category, courseDetail[0].meta_info, courseDetail[0].class),
        CourseMysqlV2.getCourseReviews(db.mysql.read, superCategory, courseDetail[0].meta_info, courseDetail[0].class),
        packageDetailsPromise,
        CourseMysqlV2.checkUserQuizReward(db.mysql.read, studentID),
    ]);
    reviewData.unshift(...reviewDataByCategory);
    reviewData.unshift(...reviewDataByAssortmentId);

    // moving the topper reviews to begining (topper reviews have negative review_order negative)
    const reviewsByToppers = reviewData.filter(((review) => review.review_order < 0));
    const reviewsNotByToppers = reviewData.filter(((review) => review.review_order >= 0));
    reviewData = [...reviewsByToppers, ...reviewsNotByToppers];

    widgets.push(courseFeatures);
    if (userQuizReward.length) {
        widgets.push(WidgetHelper.borderButtonWidget({
            text: locale === 'hi' ? `${userQuizReward[0].coupon_code.replace('GETFREE', '')} दिन का मुफ्त ट्रायल शुरू करें` : `Start ${userQuizReward[0].coupon_code.replace('GETFREE', '')} Free Trial`, type: 'trial', icon: `${config.cdn_url}engagement_framework/7858A952-60E9-0731-2A2B-A58037C1F65D.webp`, deeplink: '', assortmentID,
        }));
    }
    // TODO:- revert later
    // const banner = await getBannersForCoursePage(db, assortmentID, batchID);
    // if (!_.isEmpty(banner)) {
    //     widgets.push(banner);
    // }

    if (reviewData.length) {
        widgets.push(WidgetHelper.getCourseReviewWidget({
            result: reviewData, locale, config, assortmentID,
        }));
    }
    if (teachersData.length) {
        widgets.push(CourseHelper.getPrePurchaseCourseTeachers(teachersData, locale, versionCode));
    }
    if (packageDetails.length) {
        widgets.push(WidgetHelper.getCourseBuyPlansWidget({
            packageDetails, locale, config, tab: 'course_details',
        }));
    }
    if (!checkTrialAvailibilty.length && showTrial) {
        widgets.push(WidgetHelper.borderButtonWidget({ assortmentID: courseDetail[0].assortment_id, text: locale === 'hi' ? '1 दिन का मुफ्त ट्रायल शुरू करें' : 'Start 1 Day Free Trial', type: 'trial' }));
    }
    widgets.push(WidgetHelper.getPrePurchaseCallWidget({
        config, locale, text: locale === 'hi' ? 'कोर्स की अधिक जानकारी के लिए कॉल करें' : 'Discuss more details about this course on a call', assortmentID: courseDetail[0].assortment_id, tab: 'course_details',
    }));
    if (faqsData.length) {
        const widgetData = await getFaqsWidgets({
            db, courseDetail, batchID, versionCode, faqsData, locale, config,
        });
        widgets.push(widgetData);
    }
    return widgets;
}

async function getPrePurchaseTabsDataByTabId({
    db,
    tabID,
    config,
    locale,
    batchID,
    filterValue,
    studentID,
    courseDetail,
    versionCode,
    showTrial,
    checkTrialAvailibilty,
    campaign,
}) {
    const widgets = [];
    let courseAssormentData = [];
    if (courseDetail[0].assortment_type === 'subject') {
        courseAssormentData = await CourseMysqlV2.getAllParentAssortments(db.mysql.read, [courseDetail[0].assortment_id]);
    }
    if (tabID === 'course_details') {
        const widgetData = await getCourseDetailsTabData({
            db,
            config,
            batchID,
            studentID,
            courseDetail,
            versionCode,
            locale,
            showTrial,
            courseAssormentData,
            checkTrialAvailibilty,
            campaign,
        });
        widgets.push(...widgetData);
    } else if (tabID === 'syllabus') {
        const courseAssortment = _.includes(['course', 'course_bundle'], courseDetail[0].assortment_type) ? courseDetail[0].assortment_id : courseAssormentData[0].assortment_id;
        let syllabusData = await PackageMysql.getCourseSyllabus(db.mysql.read, courseAssortment);
        if (courseDetail[0].assortment_type === 'subject') {
            syllabusData = syllabusData.filter((item) => item.subject === courseDetail[0].display_name);
        }
        if (syllabusData.length) {
            widgets.push(WidgetHelper.getPrePurchaseSyllabusWidget({ result: syllabusData, locale }));
        }
    } else if (tabID === 'timetable') {
        const timetableData = await CourseMysqlV2.getCourseSchedule(db.mysql.read, courseDetail[0].assortment_id, null, batchID);
        widgets.push(WidgetHelper.getPrePurchaseCourseSchedule({ data: timetableData, locale, carousel: { carousel_type: 'widget_course_time_table' } }));
    } else if (tabID === 'sample_content') {
        const courseAssortment = _.includes(['course', 'course_bundle'], courseDetail[0].assortment_type) ? courseDetail[0].assortment_id : courseAssormentData[0].assortment_id;
        const [
            sampleBooks,
            samplePdfData,
            sampleVideos,
            sampleTests,
        ] = await Promise.all([
            CourseMysqlV2.getBooksResourcesOfAssortment(db.mysql.read, courseAssortment, 'Reference Book', 0, courseDetail[0].assortment_type === 'subject' ? courseDetail[0].display_name : null),
            PackageMysql.getCourseSamplePDF(db.mysql.read, courseAssortment, courseDetail[0].assortment_type === 'subject' ? courseDetail[0].display_name : null),
            courseDetail[0].assortment_type === 'subject' ? CourseContainer.getDemoVideoSubject(db, courseDetail[0].assortment_id) : CourseContainer.getDemoVideoExperiment(db, courseDetail[0].assortment_id),
            CourseMysqlV2.getSampleTestForAssortment(db.mysql.read, courseDetail[0].assortment_id, studentID),
        ]);
        let batchWiseVideoData = sampleVideos.filter((item) => item.batch_id === batchID);
        // batchWiseVideoData = _.includes(['course', 'course_bundle'], courseDetail[0].assortment_type) ? _.uniqBy(batchWiseVideoData, 'expert_name') : batchWiseVideoData;
        const filterData = {
            video: batchWiseVideoData.length,
            test: versionCode > 924 ? sampleTests.length : 0,
            notes: samplePdfData.length,
            books: sampleBooks.length,
        };
        const selectedFilter = filterValue || (batchWiseVideoData.length ? 'video' : 'test');
        widgets.push(WidgetHelper.getContentFiltersWidget({ result: contentFilters(locale, filterData), value: selectedFilter }));
        if (selectedFilter === 'video') {
            const videoWidget = await WidgetHelper.getPostPuchaseLecturesWidget({
                db,
                home: false,
                locale,
                config,
                result: batchWiseVideoData,
                carousel: { title: '', carousel_type: 'widget_autoplay' },
                assortmentID: courseDetail[0].assortment_id,
                versionCode,
            });
            widgets.push(videoWidget);
        } else if (selectedFilter === 'notes') {
            widgets.push(WidgetHelper.getPrePurchaseCourseSamplePdf({ result: samplePdfData, locale, config }));
        } else if (selectedFilter === 'test') {
            widgets.push(...WidgetHelper.getCourseTestsWidget({
                result: sampleTests, locale, showNewDesign: true, config,
            }));
        } else if (selectedFilter === 'books') {
            widgets.push(...WidgetHelper.getCourseBooksWidget({
                result: sampleBooks, locale, title: '', isSample: true,
            }));
        }
    } else if (tabID === 'related_course') {
        const widgetData = await getRelatedContentData({
            db,
            config,
            studentID,
            courseDetail,
            versionCode,
            locale,
        });
        widgets.push(...widgetData);
    }
    if (tabID !== 'related_course' && tabID !== 'course_details') {
        const referralCampaignData = versionCode >= 1012 ? await referralFlowHelper.getRefererSidAndCouponCode(db, studentID) : false;
        let type = 'default';
        if (campaign === 'UAC_InApp_CBSE_9-12_Board_EM') {
            type = 'bnb_autosales';
        } else if (referralCampaignData) {
            type = 'referral';
        }
        let packageDetails;
        if (type === 'bnb_autosales') {
            packageDetails = await CourseHelper.getPackagesForAssortmentAutosalesCampaign(db, studentID, [courseDetail[0].assortment_id]);
        } else if (type === 'referral') {
            packageDetails = await CourseHelper.getPackagesForAssortmentReferral(db, studentID, [courseDetail[0].assortment_id]);
        } else {
            packageDetails = await CourseHelper.getPackagesForAssortment(db, studentID, [courseDetail[0].assortment_id]);
        }
        if (packageDetails.length) {
            widgets.push(WidgetHelper.getCourseBuyPlansWidget({
                packageDetails, locale, config, tab: tabID,
            }));
        }
        if (!checkTrialAvailibilty.length && showTrial) {
            widgets.push(WidgetHelper.borderButtonWidget({ assortmentID: courseDetail[0].assortment_id, text: locale === 'hi' ? '1 दिन का मुफ्त ट्रायल शुरू करें' : 'Start 1 Day Free Trial', type: 'trial' }));
        }
        widgets.push(WidgetHelper.getPrePurchaseCallWidget({
            config, locale, text: locale === 'hi' ? 'कोर्स की अधिक जानकारी के लिए कॉल करें' : 'Discuss more details about this course on a call', assortmentID: courseDetail[0].assortment_id, tab: tabID,
        }));
    }
    return widgets;
}

async function getBannersData(database, courseDetail, activeSubs, locale, config, vip, studentClass, versionCode, studentId, variantID) {
    const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
    const banner = {
        type: 'promo_list',
        data: {
            auto_scroll_time_in_sec: autoScrollTime,
            items: [],
            ratio: '5:1',
        },
    };
    if (!vip) {
        let deeplink = '';
        const referralBanner = await CourseMysqlV2.checkForReferralBanner(database, studentId);
        if (['9', '10', '11', '12', '13', '14'].includes(studentClass) && referralBanner && referralBanner.length > 0 && moment().diff(moment(referralBanner[0].created_at), 'days') <= 7 && referralBanner[0].referrer_student_id % 2 == 0) {
            banner.data.items.push({
                id: 'REFERRAL_PAYTM',
                image_url: LiveclassData.referralPaytmCourseDetailsBanner,
                deeplink: `doubtnutapp://vip?variant_id=${variantID}`,
            });
        } else {
            if (courseDetail[0].parent === 4) {
                deeplink = versionCode >= 861 ? 'doubtnutapp://bundle_dialog?id=138829&source=COURSE_BANNER' : 'doubtnutapp://vip?assortment_id=138829';
            }
            banner.data.items.push({
                id: 395,
                image_url: courseDetail[0].display_image_rectangle,
                deeplink,
            });
        }
    } else {
        let imageUrl = '';
        const bannerEndDate = moment(courseDetail[0].start_date).add(8, 'days').startOf('day');
        if (studentClass == 12 && bannerEndDate > now) {
            imageUrl = locale === 'hi' ? `${config.staticCDN}engagement_framework/869C4BE7-C0DD-215D-FEBB-B389DDA4FE2D.webp` : `${config.staticCDN}engagement_framework/471146A0-9F97-49CC-6322-5015745FC728.webp`;
        } else if (studentClass == 10 && bannerEndDate > now) {
            imageUrl = locale === 'hi' ? `${config.staticCDN}engagement_framework/956B3230-7E23-2820-476F-A715D4E4DA17.webp` : `${config.staticCDN}engagement_framework/B8BCAAAE-45EB-ED28-FD9D-E3749A010160.webp`;
        } else if ((studentClass == 11 || studentClass == 9) && bannerEndDate > now) {
            imageUrl = locale === 'hi' ? `${config.staticCDN}engagement_framework/CB6EDDEE-DA68-AFAC-3217-322772BEC375.webp` : `${config.staticCDN}engagement_framework/8BAC35A5-8849-F91A-4DBE-3599EEC17354.webp`;
        }
        if (imageUrl) {
            banner.data.items.push({
                image_url: imageUrl,
                deeplink: '',
            });
            banner.data.ratio = '4:1';
        }
    }
    if (activeSubs.length) {
        const lastEmi = activeSubs[activeSubs.length - 1];
        const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
            .endOf('day');
        if (lastEmi.package_validity >= now && lastEmi.package_validity <= end && !lastEmi.is_last) {
            const emiBanner = {
                image_url: LiveclassData.emiReminderImage(locale, config),
                deeplink: `doubtnutapp://vip?assortment_id=${courseDetail[0].assortment_id}`,
            };
            banner.data.items.unshift(emiBanner);
        }
    }

    return banner;
}

async function getSubjectFilters(db, assortmentId, locale, subject, tab, isMultiple) {
    try {
        const bookType = tab === 'books' ? 'Reference Book' : `${tab === 'ncert' ? 'NCERT' : 'Previous Year'}`;
        let subList = [];
        if (isMultiple) {
            subList = await CourseMysqlV2.getSubjectsListByCourseAssortmentMultiple(db.mysql.read, assortmentId);
        } else {
            subList = _.includes(['previousYears', 'books', 'ncert'], tab) ? await CourseMysqlV2.getSubjectFiltersForBooks(db.mysql.read, assortmentId, bookType) : await CourseMysqlV2.getSubjectsListByCourseAssortment(db.mysql.read, assortmentId);
        }
        const subReturn = [];
        if (subList.length === 1) {
            return null;
        }
        for (let i = 0; i < subList.length; i++) {
            if (subList[i].display_name !== 'ALL' && !(subList[i].display_name === 'GUIDANCE' && tab === 'homework')) {
                let displayName = locale === 'hi' && Data.subjectHindi[subList[i].display_name.toUpperCase()] ? Data.subjectHindi[subList[i].display_name.toUpperCase()] : subList[i].display_name.toUpperCase();
                if (!isMultiple && (+assortmentId === 15 || +assortmentId === 16)) {
                    if (_.includes([180, 182, 184, 185, 186, 187], subList[i].course_resource_id)) {
                        displayName = `${displayName} - XI`;
                    } else {
                        displayName = `${displayName} - XII`;
                    }
                }
                subReturn.push({
                    filter_id: subList[i].display_name,
                    text: displayName,
                    color: LiveclassHelper.getBarColorForLiveclassHomepage(subList[i].display_name.toUpperCase()),
                    is_selected: subject === subList[i].display_name,
                });
            }
        }
        if (tab === 'upcoming') {
            subReturn.push({
                filter_id: 'WEEKLY TEST',
                text: locale === 'hi' ? 'साप्ताहिक टेस्ट' : 'WEEKLY TEST',
                color: LiveclassHelper.getBarColorForLiveclassHomepage('WEEKLY TEST'),
                is_selected: subject === 'WEEKLY TEST',
            });
        }
        return {
            type: 'subject_filters',
            data: {
                items: subReturn,
            },
            extra_params: {
                page_type: tab,
            },
        };
    } catch (e) {
        throw new Error(e);
    }
}

async function getNotesFilters(db, notesType, locale, courseDetail) {
    try {
        const data = await CourseContainer.getDistinctNotesType(db, courseDetail[0].assortment_id, courseDetail[0].assortment_type);
        if (data.length === 1) {
            return null;
        }
        const items = [];
        for (let i = 0; i < data.length; i++) {
            items.push({
                id: data[i].meta_info,
                display: locale === 'hi' && LiveclassData.notesFilterHindi[data[i].meta_info] ? LiveclassData.notesFilterHindi[data[i].meta_info] : data[i].meta_info,
                is_selected: data[i].meta_info === notesType,
            });
        }
        items.unshift({
            id: 'all',
            display: locale === 'hi' ? 'सभी नोट्स' : 'All',
            is_selected: notesType === 'all',
        });
        const subtitle = locale === 'hi' ? 'नोट्स के प्रकार' : 'Types of Notes';
        const notesTypeDisplay = notesType && locale === 'hi' && LiveclassData.notesFilterHindi[notesType] ? LiveclassData.notesFilterHindi[notesType] : notesType;
        return {
            type: 'notes_filter2',
            data: {
                title: locale === 'hi' ? 'फ़िल्टर:' : 'Filter By:',
                sub_title: notesTypeDisplay || subtitle,
                items,
            },
        };
    } catch (e) {
        throw new Error(e);
    }
}

function getCourseHelpFlowData(resData, locale, config, assortmentID, showPopup, showChangeRequest) {
    resData.support_options = [
        {
            id: 'c',
            title: locale === 'hi' ? 'मेरे डाउनलोड' : 'My Downloads',
            title_color: '#504949',
            icon_url: `${config.cdn_url}engagement_framework/55384ADD-3300-A0D5-5506-56872243EB4E.webp`,
            deeplink: 'doubtnutapp://my_downloads',
            event_params: {
                icon: 'post_purchase_my_downloads_click',
            },
        },
        {
            id: 'c',
            title: locale === 'hi' ? 'ऐप कैसे इस्तेमाल करें' : 'How to use App',
            title_color: '#504949',
            icon_url: `${config.cdn_url}engagement_framework/1FFD011F-36BE-55BC-7D05-EE97004ADA9F.webp`,
            deeplink: 'doubtnutapp://faq',
            event_params: {
                icon: 'post_purchase_how_to_use_app',
            },
        },
    ];
    if (showChangeRequest) {
        resData.support_options.push({
            id: 'c',
            title: locale === 'hi' ? 'कोर्स बदलें' : 'Request Change Course',
            title_color: '#504949',
            icon_url: `${config.cdn_url}engagement_framework/C24ECF57-04E4-060A-EF80-F876E464D501.webp`,
            deeplink: assortmentID ? `doubtnutapp://course_change?assortment_id=${assortmentID}` : 'doubtnutapp://course_select?page=request_course_change',
            event_params: {
                icon: 'post_purchase_request_course_change',
            },
        });
    }
    if (showPopup) {
        resData.course_change_popup = {
            title: locale === 'hi' ? 'आपको कोर्स से सम्बंधित कोई मदद चाहिए ?' : 'Aapko kya help chahiye?',
            subtitle: locale === 'hi' ? 'क्या आपने गलत कोर्स खरीद लिया है? हमें बताइये की आप कौनसा कोर्स खरीदना चाहते थे...' : 'Kya aapne galat course purchase liya hai? Batao humein ki aap kaunsa course khareedna chahte the...',
            request_button_text: locale === 'hi' ? 'कोर्स बदलें' : 'Request Course Change',
            cancel_button_text: locale === 'hi' ? 'नहीं, धन्यवाद' : 'No Thanks',
            deeplink: assortmentID ? `doubtnutapp://course_change?assortment_id=${assortmentID}` : 'doubtnutapp://course_select?page=request_course_change',
        };
    }
}

function getHomeworkFilters(notesType, locale) {
    try {
        const items = [
            {
                id: 'completed',
                display: locale === 'hi' ? 'पूरा हुआ' : 'Completed',
                is_selected: notesType === 'completed',
            },
            {
                id: 'pending',
                display: locale === 'hi' ? 'बचा हुआ' : 'Pending',
                is_selected: notesType === 'pending',
            },
            {
                id: 'homework_all',
                display: locale === 'hi' ? 'सभी होमवर्क' : 'All',
                is_selected: notesType === 'homework_all',
            },
        ];
        const subtitle = locale === 'hi' ? 'सभी होमवर्क' : 'All homeworks';
        const notesTypeDisplay = notesType && _.find(items, ['id', notesType]) ? _.find(items, ['id', notesType]).display : notesType;
        return {
            type: 'notes_filter2',
            data: {
                title: locale === 'hi' ? 'फ़िल्टर:' : 'Filter By:',
                sub_title: notesTypeDisplay || subtitle,
                items,
            },
        };
    } catch (e) {
        throw new Error(e);
    }
}

async function getFiltersForBookmarkTabs(db, subTabId, locale, studentID, courseDetail, batchID) {
    try {
        const [
            notes, classes, doubts,
        ] = await Promise.all([
            CourseHelper.getCourseDataByCardId({
                db, cardID: 'bookmark', studentID, courseDetail, subTabId: 'notes', batchID, page: 1,
            }),
            CourseHelper.getCourseDataByCardId({
                db, cardID: 'bookmark', studentID, courseDetail, subTabId: 'bookmarked_classes', batchID, page: 1,
            }),
            CourseHelper.getCourseDataByCardId({
                db, cardID: 'bookmark', studentID, courseDetail, subTabId: 'doubts', batchID, page: 1,
            }),
        ]);
        const items = [];
        if (notes.length) {
            items.push({
                id: 'notes',
                title: locale === 'hi' ? 'PDF नोट्स' : 'PDF Notes',
                is_selected: subTabId === 'notes',
            });
        }
        if (classes.length) {
            items.push({
                id: 'bookmarked_classes',
                title: locale === 'hi' ? 'क्लासेस' : 'Classes',
                is_selected: subTabId === 'bookmarked_classes',
            });
        }
        if (doubts.length) {
            items.push({
                id: 'doubts',
                title: locale === 'hi' ? 'डाउट्स' : 'Doubts',
                is_selected: subTabId === 'doubts',
            });
        }
        return {
            items,
        };
    } catch (e) {
        throw new Error(e);
    }
}

function getPrePurchaseCourseFeaturesSachet(topicsCount, resourcesCount, assortmentType, locale) {
    const items = [];
    const syllabusOrTopicItem = assortmentType === 'chapter' || !topicsCount.length ? {
        title: locale === 'hi' ? 'पूरा' : 'Full',
        subtitle: locale === 'hi' ? 'अध्याय' : `${assortmentType}`,
    } : {
        title: topicsCount[0].count,
        subtitle: locale === 'hi' ? 'टॉपिक' : `${topicsCount[0].count === 1 ? 'Topic' : 'Topics'}`,
    };
    items.push(syllabusOrTopicItem);
    for (let i = 0; i < resourcesCount.length; i++) {
        if (resourcesCount[i].assortment_type === 'resource_video' && resourcesCount[i].count > 0) {
            items.push({
                title: resourcesCount[i].count,
                subtitle: locale === 'hi' ? 'वीडियो' : 'Videos',
            });
        }
        if (resourcesCount[i].assortment_type === 'resource_pdf' && resourcesCount[i].count > 0) {
            items.push({
                title: resourcesCount[i].count,
                subtitle: locale === 'hi' ? 'पीडीऍफ़' : 'PDFS',
            });
        }
    }
    return {
        type: 'course_features',
        data: {
            items,
        },
    };
}

async function getCarouselDataByUserState(db, studentID, assortmentID, data, batchID) {
    const studentAssortmentProgress = await CourseMysqlV2.getStudentAssortmentProgress(db.mysql.read, studentID, assortmentID);
    let recommendedLectures = await CourseContainer.getDemoVideoExperiment(db, assortmentID);
    recommendedLectures = recommendedLectures.filter((item) => item.subject !== 'GUIDANCE' && item.subject !== 'ANNOUNCEMENT');
    recommendedLectures = _.uniqBy(recommendedLectures, 'subject');
    if (!studentAssortmentProgress.length || (studentAssortmentProgress.length && !studentAssortmentProgress[0].video_history)) {
        data = [...data, ...recommendedLectures];
    } else if (studentAssortmentProgress.length) {
        const watchedSubjects = JSON.parse(studentAssortmentProgress[0].video_history) || {};
        recommendedLectures = recommendedLectures.filter((item) => !watchedSubjects[item.subject] && item.subject !== 'INTRODUCTION');
        if (!_.isEmpty(watchedSubjects)) {
            const questionIdList = [];
            const continueWatchingList = [];
            for (const key in watchedSubjects) {
                if (watchedSubjects[key]) {
                    questionIdList.push(watchedSubjects[key].toString());
                }
            }
            if (questionIdList.length) {
                const vvsData = await CourseMysqlV2.getVideoProgressOfStudent(db.mysql.read, studentID, questionIdList);
                for (let i = 0; i < vvsData.length; i++) {
                    if (!vvsData[i].duration || (vvsData[i].duration - vvsData[i].video_time >= 600)) {
                        continueWatchingList.push(vvsData[i].question_id.toString());
                    }
                }
                const [
                    continueWatchingData,
                    // nextUpLectures,
                ] = await Promise.all([
                    continueWatchingList.length ? CourseMysqlV2.getResourcesDataFromQuestionIdsList(db.mysql.read, continueWatchingList, batchID) : [],
                    // CourseMysqlV2.getNextLectureOfSameSubject(db.mysql.read, [], batchID),
                ]);
                const nextUpLectures = [];
                data = [...data, ...continueWatchingData, ...recommendedLectures, ...nextUpLectures];
            } else {
                data = [...data, ...recommendedLectures];
            }
        } else {
            data = CourseMysqlV2.getMissedClassesForPastDays(db.mysql.read, assortmentID, studentID, 'course', 0);
        }
    }
    return data;
}

async function createWidgetPadhoAurJeeto(db, batchID, studentID, assortmentId, locale, studentDataFromReq, config) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    let rank = await PaidUserChampionshipRedis.getStudentRankMontly(db.redis.read, studentID, assortmentId, now.month());
    if (_.isNull(rank)) {
        rank = 'NA';
    }
    let studentScoreData = JSON.parse(await PaidUserChampionshipRedis.getStudentMonthlyData(db.redis.read, studentID, assortmentId, now.month()));
    if (_.isNull(studentScoreData)) {
        studentScoreData = {
            class_attended: 0,
            total_time_class_attended: 0,
            homework_attempted: 0,
            pdf_downloaded: 0,
            quiz_attempted: 0,
        };
    }
    const studentData = [studentDataFromReq];
    let userName;
    const sli = studentData[0].mobile.slice(0, 6);
    const phone = studentData[0].mobile.replace(sli, 'xxxxxx');
    if (studentData[0].student_fname !== null) {
        if (studentData[0].student_lname !== null) {
            userName = `${studentData[0].student_fname} ${studentData[0].student_lname}`;
            userName = userName.replace(/\n/g, ' ');
        } else {
            userName = `${studentData[0].student_fname}`;
        }
    } else {
        userName = phone;
    }
    const fields = ['class_attended', 'total_time_class_attended', 'homework_attempted', 'pdf_downloaded', 'quiz_attempted'];
    const assortmentFields = ['video_count', 'total_time', 'homework_count', 'pdf_count', 'quiz_count'];
    const maxScores = await getAssortmentIdParams(db, assortmentId, batchID);
    const score = calculatePaidUserChampionshipLeaderBoardScore(studentScoreData, maxScores.monthly);
    const data = {
        type: 'widget_padho_aur_jeeto',
        data: {
            title: locale === 'hi' ? 'पढो और जीतो' : 'Padho aur Jeeto',
            title_text_size: '18',
            title_text_color: '#000000',
            subtitle: locale === 'hi' ? 'टॉप 10 छात्रों को आज मिलेगा 20% का ऑफ कूपन' : "Top 10 students will get <font color='#2a52d1'>20% OFF coupon</font> today",
            subtitle_text_size: '15',
            subtitle_text_color: '#3f3f3f',
            more_text: 'Available rewards',
            more_text_size: '11',
            more_text_color: '#000000',
            more_text_deeplink: 'doubtnutapp://coupon_list?page=paid_user_championship',
            widgets: [
                {
                    type: 'widget_leaderboard',
                    data: {
                        bg_color: '#ffffff',
                        bg_stroke_color: '#ffffff',
                        item: {
                            rank: rank !== 'NA' ? rank + 1 : rank,
                            rank_text_color: '#000000',
                            rank_text_size: '19',
                            image: studentData[0].img_url ? studentData[0].img_url : null,
                            image_size: '33',
                            name: userName,
                            name_text_size: '14',
                            name_text_color: '#000000',
                            name_text_bold: true,
                            marks: score ? `${score.toFixed(2)}%` : '0.00%',
                            marks_text_color: '#000000',
                            marks_text_size: '16',
                            student_id: studentData[0].student_id,
                            icon: `${config.staticCDN}/engagement_framework/1EE5536A-4D82-F73D-0A4C-114B401EB938.webp`,
                            profile_deeplink: '',
                            text_footer_end: 'Course completion',
                            text_footer_end_color: '#000000',
                            text_footer_end_size: '8',
                            padding_top: 0,
                            padding_bottom: 0,
                        },
                    },
                    layout_config: {
                        margin_top: 6,
                        margin_left: 8,
                        margin_right: 14,
                    },

                },
                {
                    type: 'text_widget',
                    data: {
                        title: rank < 10 && rank !== 'NA' ? 'Aapke pass 7 days k liye 20% OFF coupon code hai' : 'Thodi aur mehnat se milega 20% OFF coupon',
                        text_color: '#ea532c',
                        text_size: '13',
                    },
                    layout_config: {
                        margin_top: 4,
                        margin_left: 8,
                        margin_right: 13,
                    },
                },

            ],
        },
        layout_config: {
            margin_top: 10,
            margin_left: 14,
            margin_right: 14,
        },
    };
    for (let i = 0; i < fields.length; i++) {
        const layoutConfig = {
            margin_left: 13,
            margin_top: 12,
            margin_right: 13,
        };
        data.data.widgets.push(getProgressWidget(fields[i], (studentScoreData[fields[i]] * 100) / maxScores.monthly[assortmentFields[i]], layoutConfig, locale, 0));
    }
    data.data.widgets.push({
        type: 'widget_button_border',
        data: {
            text_one: locale === 'hi' ? 'लीडरबोर्ड देखें' : 'View leaderboard',
            text_one_size: '16',
            text_one_color: '#ffffff',
            bg_color: '#541488',
            bg_stroke_color: '#00000000',
            assortment_id: assortmentId,
            deep_link: `doubtnutapp://leaderboard?source=course&assortment_id=${assortmentId}&type=paid_user_championship`,
            corner_radius: '4.0',
            elevation: '4.0',
            min_height: '40',
            icon: `${config.staticCDN}/engagement_framework/3156EE27-E45A-2141-F172-DC2AE15AEB30.webp`,
            icon_size: '12',
            icon_gravity: '4',
            icon_color: '#ffffff',
        },
        layout_config: {
            margin_left: 8,
            margin_top: 12,
            margin_right: 8,
            margin_bottom: 8,
        },
    });
    return data;
}

async function getCaraouselDataForCoursePage({
    db,
    config,
    locale,
    studentID,
    carousels,
    tabDetails,
    courseDetail,
    assortmentID,
    studentClass,
    resolvedPromises,
    isBrowser,
    batchID,
    userPackageCurrentAssortment,
    versionCode,
    enrolledStudentsCount,
    isFreeApp,
}) {
    try {
        const caraouselList = [];
        const trialExpired = userPackageCurrentAssortment && !!userPackageCurrentAssortment.length && userPackageCurrentAssortment[0].sps_is_active === 0;
        for (let i = 0; i < carousels.length; i++) {
            if (carousels[i].carousel_type === 'promo_list' && resolvedPromises[i].length && (carousels[i].view_type === 'across_course' || carousels[i].view_type === 'target-group')) {
                if (isFreeApp) {
                    continue;
                }
                // show banner on specific assortment_id (or specific course) postpurchase page with tg check, driven from course_detail_banners table
                caraouselList.push(CourseHelper.generateBannerDataV2({
                    db, config, locale, studentID, studentClass, carouselsData: carousels[i], result: resolvedPromises[i] || [], versionCode,
                }));
            } else if (carousels[i].carousel_type === 'promo_list' && resolvedPromises[i].length && studentID && carousels[i].view_type === 'app_banners') {
                if (isFreeApp) {
                    continue;
                }
                // show banner on all assortment_ids (or all course) postpurchase page with tg check, driven from app_bannners table
                carousels[i].banner_source = 'app_banners';
                caraouselList.push(CourseHelper.generateBannerData({
                    db, config, locale, studentID, studentClass, carouselsData: carousels[i], result: resolvedPromises[i] || [], versionCode,
                }));
            } else if (carousels[i].carousel_type === 'course_cards' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getPostPuchaseCourseCardsWidget({
                    locale,
                    tabDetails,
                    assortmentID,
                    courseDetail,
                    carousel: carousels[i],
                    result: resolvedPromises[i] || [],
                    isBrowser,
                    config,
                    studentID,
                    batchID,
                    db,
                    trialExpired,
                    isFreeApp,
                }));
            } else if (carousels[i].carousel_type === 'course_subject_v1' && resolvedPromises[i].length > 1) {
                caraouselList.push(WidgetHelper.getPostPuchaseCourseSubjectsWidget({
                    locale,
                    assortmentID,
                    carousel: carousels[i],
                    result: resolvedPromises[i],
                }));
            } else if (carousels[i].carousel_type === 'widget_autoplay' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getPostPuchaseLecturesWidget({
                    db,
                    locale,
                    config,
                    assortmentID,
                    home: true,
                    carousel: carousels[i],
                    result: resolvedPromises[i] || [],
                    isBrowser,
                }));
            } else if (carousels[i].carousel_type === 'widget_nudge' && carousels[i].view_type.toLowerCase() === 'target_group' && resolvedPromises[i].length) {
                let tgCheck = true;
                if (resolvedPromises[i][0].target_group) {
                    tgCheck = await NudgeHelper.checkTargetGroupEligibilityForNudge({
                        db, studentId: studentID, tgID: resolvedPromises[i][0].target_group, studentClass, locale,
                    });
                }
                if (tgCheck) {
                    resolvedPromises[i][0].deeplink = resolvedPromises[i][0].deeplink || `doubtnutapp://bundle_dialog?id=${assortmentID}&source=POST_PURCHASE_RENEWAL||${resolvedPromises[i][0].coupon_id}`;
                    resolvedPromises[i][0].is_banner = true;
                    resolvedPromises[i][0].ratio = carousels[i].resource_types;
                    caraouselList.push(WidgetHelper.getRenewalNudgesWidget({
                        config,
                        locale,
                        assortmentID: resolvedPromises[i][0].id,
                        nudgeType: 'renewal',
                        result: resolvedPromises[i] || [],
                    }));
                }
            } else if (carousels[i].carousel_type === 'validity_widget' && carousels[i].view_type.toLowerCase() === 'upgrade' && !_.isEmpty(resolvedPromises[i])) {
                caraouselList.push(WidgetHelper.getPostPuchasePaymentWidget({
                    locale,
                    carousel: carousels[i],
                    result: resolvedPromises[i] ? [resolvedPromises[i]] : [],
                }));
            } else if (carousels[i].carousel_type === 'validity_widget' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getPostPuchasePaymentWidget({
                    locale,
                    carousel: carousels[i],
                    result: resolvedPromises[i] || [],
                }));
            } else if (carousels[i].carousel_type === 'widget_nudge' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getRenewalNudgesWidget({
                    config,
                    locale,
                    assortmentID,
                    nudgeType: 'upgrade',
                    result: resolvedPromises[i] || [],
                }));
            } else if (carousels[i].carousel_type === 'widget_coupon_banner' && resolvedPromises[i].length) {
                resolvedPromises[i][0].deeplink = `doubtnutapp://bundle_dialog?id=${assortmentID}&source=POST_PURCHASE_RENEWAL||${resolvedPromises[i][0].coupon_id}`;
                caraouselList.push(WidgetHelper.getTimerBannerWidget({ result: resolvedPromises[i] }));
            } else if (carousels[i].carousel_type === 'text_widget' && resolvedPromises[i].length) {
                const renewedPackage = resolvedPromises[i].filter((e) => e.subscription_id > userPackageCurrentAssortment[0].subscription_id && e.is_active === 1);
                const endDate = renewedPackage.length ? renewedPackage[0].end_date : userPackageCurrentAssortment[0].end_date;

                caraouselList.push(WidgetHelper.getSubscriptionValidityWidget({ result: { end_date: endDate }, locale }));
            } else if (carousels[i].carousel_type === 'widget_padho_aur_jeeto' && resolvedPromises[i][0] === 'course' && resolvedPromises[i][1] === null && resolvedPromises[i][2] === 0) {
                if ((await checkIfLeaderboardsHasEntry(db, assortmentID, batchID))) {
                    caraouselList.push(createWidgetPadhoAurJeeto(db, batchID, studentID, assortmentID, locale, resolvedPromises[i][3], config));
                }
            } else if (carousels[i].carousel_type === 'widget_course_time_table_v2' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getPrePurchaseCourseSchedule({ data: resolvedPromises[i], locale, carousel: carousels[i] }));
            } else if (carousels[i].carousel_type === 'widget_course_time_table' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getPrePurchaseCourseSchedule({ data: resolvedPromises[i], locale, carousel: carousels[i] }));
            } else if (carousels[i].carousel_type === 'course_calling_widget') {
                caraouselList.push(WidgetHelper.getPrePurchaseCallWidget({
                    config, locale, text: carousels[i].title, assortmentID, tab: 'postpurchase_trial',
                }));
            } else if (carousels[i].carousel_type === 'course_testimonial' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getCourseReviewWidget({
                    result: resolvedPromises[i], locale, config, assortmentID,
                }));
            } else if (carousels[i].carousel_type === 'course_faqs' && resolvedPromises[i].length) {
                caraouselList.push(getFaqsWidgets({
                    db, courseDetail, batchID, versionCode, faqsData: resolvedPromises[i], locale, config,
                }));
            } else if (carousels[i].carousel_type === 'widget_explore_card' && resolvedPromises[i].length) {
                if (isFreeApp && carousels[i].data_type === 'icons_list') {
                    continue;
                }
                carousels[i].secondary_data = trialExpired ? '#fcfcfc' : '#eae7f2';
                carousels[i].title_hindi = carousels[i].title;
                if (carousels[i].data_type === 'course_subject') {
                    carousels[i].secondary_data = trialExpired ? '#fcfcfc' : '#feebe7';
                    resolvedPromises[i].forEach((item) => {
                        item.image_url = LiveclassData.topSellingSubjectIcons(item.display_name.toUpperCase()) || item.image_url;
                        if (trialExpired) {
                            item.image_url = LiveclassData.topSellingSubjectDisabledIcons(item.display_name.toUpperCase()) || item.image_url;
                        }
                        item.deeplink = trialExpired ? `doubtnutapp://bundle_dialog?id=${assortmentID}&source=PRE_PURCHASE_BUY_BUTTON||TRIAL_END_STATE` : `doubtnutapp://course_detail_info?subject=${item.display_name}&assortment_id=${item.course_assortment}&tab=subject`;
                        item.title_hindi = Data.subjectHindi[item.title.toUpperCase()] || '';
                    });
                } else {
                    resolvedPromises[i].forEach((item) => {
                        item.deeplink = trialExpired ? `doubtnutapp://bundle_dialog?id=${assortmentID}&source=PRE_PURCHASE_BUY_BUTTON||TRIAL_END_STATE` : `${item.deeplink}&assortment_id=${assortmentID}`;
                        if (trialExpired) {
                            item.image_url = item.grey_image_url;
                        }
                    });
                }
                if (carousels[i].data_type === 'icons_list') {
                    const iconsList = carousels[i].assortment_list;
                    resolvedPromises[i].sort((a, b) => iconsList.map(Number).indexOf(a.id) - iconsList.map(Number).indexOf(b.id));
                }
                caraouselList.push(HomepageWidgetHelper.getCategoryIconsWidget({
                    data: resolvedPromises[i], studentLocale: locale, carousel: carousels[i], source: 'postpurchase', assortmentID,
                }));
            } else if (carousels[i].carousel_type === 'widget_course_plan' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getCourseBuyPlansWidget({
                    packageDetails: resolvedPromises[i], locale, config, tab: 'postpurchase_trial', userPackageCurrentAssortment, enrolledStudentsCount,
                }));
            } else if (carousels[i].carousel_type === 'widget_most_viewed_classes' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getMostViewedClassesWidget({
                    db, locale, config, carousel: carousels[i], result: resolvedPromises[i] || [], assortmentID, trialExpired,
                }));
            }
        }
        const result = await Promise.all(caraouselList);
        for (let i = 0; i < result.length; i++) {
            if (result[i].type === 'promo_list' && result[i].data.items && !result[i].data.items.length) {
                result.splice(i, 1);
            }
        }
        return result;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getCourseCardsWidgets(data) {
    const {
        db,
        locale,
        cardID,
        result,
        config,
        batchID,
        assortmentID,
        isSachet,
        chapterAssortmentList,
        isMultiple,
    } = data;
    let widgets = [];
    if (cardID === 'recent' || cardID === 'one_shot_classes') {
        const chapterGroupedData = db || isSachet ? _.groupBy(result, 'chapter') : _.groupBy(result, '');
        const notesData = chapterAssortmentList && chapterAssortmentList.length ? await CourseMysqlV2.getNotesCountInChapter(db.mysql.read, chapterAssortmentList, batchID) : [];
        const homeworkData = notesData.filter((e) => e.meta_info === 'Homework');
        for (const key in chapterGroupedData) {
            if (chapterGroupedData[key]) {
                const thisChapterNotes = notesData.filter((e) => e.name === key);
                const thisChapterHomework = homeworkData.filter((e) => e.name === key);
                widgets.push(WidgetHelper.getAllClassesWidget({
                    result: chapterGroupedData[key], chapterName: key, locale, showNotes: !!thisChapterNotes.length, showHomework: !!thisChapterHomework.length, chapterAssortment: thisChapterNotes.length ? thisChapterNotes[0].assortment_id : 0,
                }));
            }
        }
        if (widgets.length === 1) {
            widgets[0].data.is_expanded = true;
        }
        if (isSachet) {
            widgets = widgets.splice(0, 3);
        }
    } else if (cardID === 'upcoming') {
        widgets = CourseHelper.getTimetableData(db, config, result, true, locale);
    } else if (_.includes(['previous_year_papers', 'notes', 'imp_ques_subjective', 'imp_ques_objective', 'sample_paper', 'magazine'], cardID)) {
        if (isMultiple) {
            result.forEach((item) => {
                item.topic = item.display ? item.display : item.topic;
                item.course_assortment_id = item.assortment_id;
            });
        } else {
            result.forEach((item) => {
                item.topic = item.display ? item.display : item.topic;
                item.course_assortment_id = assortmentID;
            });
        }
        let notesData = CourseHelper.getNotesData(result, [], [], {}, {}, config);
        notesData = db ? _.groupBy(notesData, 'master_chapter') : _.groupBy(notesData, '');
        for (const key in notesData) {
            if (notesData[key]) {
                widgets.push({
                    type: 'resource_notes',
                    data: {
                        title: `${key} - ${notesData[key][0].subject}`, items: notesData[key], showsearch: false,
                    },
                    extra_params: {
                        source: 'course_notes_card',
                    },
                });
            }
        }
    } else if (cardID.includes('tests') || _.includes(['revision_mock_test', 'revision_chapter_test'], cardID)) {
        widgets = WidgetHelper.getCourseTestsWidget({
            locale, result, showNewDesign: false, config,
        });
    } else if (cardID === 'homework') {
        let homeworkData = WidgetHelper.getCourseHomeworkWidget({ result, locale, config });
        homeworkData = _.groupBy(homeworkData.data.items, 'chapter');
        for (const key in homeworkData) {
            if (homeworkData[key]) {
                widgets.push({
                    type: 'course_homework',
                    data: {
                        title: `${key} - ${homeworkData[key][0].subject}`, items: homeworkData[key], showsearch: false,
                    },
                    extra_params: {
                        source: 'course_homework_card',
                    },
                });
            }
        }
    } else if (cardID === 'books' || cardID === 'previousYears' || cardID === 'ncert') {
        const title = cardID === 'books' ? `${locale === 'hi' ? 'अतिरक्त पाठ्य पुस्तिकायें' : 'Reference Books'}` : '';
        widgets = WidgetHelper.getCourseBooksWidget({ result, title, locale });
    } else if (cardID === 'missed_classes' && result.length) {
        const widgetData = await WidgetHelper.getPostPuchaseLecturesWidget({
            db,
            locale,
            config,
            result,
            assortmentID,
            carousel: { carousel_type: 'widget_autoplay' },
        });
        widgets.push(widgetData);
    } else if (cardID === 'timetable' && result.length) {
        const widgetData = WidgetHelper.getPrePurchaseCourseSchedule({ data: result, locale, carousel: { carousel_type: 'widget_course_time_table' } });
        widgets.push(widgetData);
    } else if (cardID === 'doubts' && result.length > 1 && result[1].length) {
        const chapterGroupedData = _.groupBy(result[1], 'chapter');
        for (const key in chapterGroupedData) {
            if (chapterGroupedData[key]) {
                const commentsByChapter = [];
                for (let i = 0; i < chapterGroupedData[key].length; i++) {
                    const comment = _.find(result[0], ['_id', ObjectId(chapterGroupedData[key][i].comment_id)]);
                    comment.is_bookmarked = chapterGroupedData[key][i].is_bookmarked;
                    commentsByChapter.push(comment);
                }
                widgets.push(WidgetHelper.getBookmarkDoubtsWidget({
                    result: commentsByChapter, chapterName: key, locale, subject: chapterGroupedData[key][0].subject, assortmentID,
                }));
            }
        }
    } else if (cardID === 'bookmarked_classes') {
        widgets = WidgetHelper.getWidgetCourseClasses({
            lectureList: result, locale,
        });
        // const widgetResult = CourseHelper.getTimetableData(db, config, result, true, locale);
        // const obj = {
        //     type: 'widget_parent',
        //     data: {
        //         title: '',
        //         items: [],
        //         scroll_direction: 'vertical',
        //     },
        // };
        // if (widgetResult[0].data && widgetResult[0].data.resources.length) {
        //     for (let i = 0; i < widgetResult[0].data.resources.length; i++) {
        //         obj.data.items.push(widgetResult[0].data.resources[i]);
        //     }
        // }
    }
    return widgets;
}

async function getMultiCourseCardsWidgets(data) {
    const {
        locale,
        tabs,
        result,
        subject,
        config,
        assortmentID,
        isSachet,
        isBrowser,
        db,
    } = data;
    let branchDeeplink;
    if (isBrowser) {
        branchDeeplink = await CourseContainer.getCourseDetailInfoBranchDeeplinkFromAppDeeplink(db, assortmentID, subject);
    }
    const widgets = [];
    for (let i = 0; i < tabs.length; i++) {
        if (!result[i].length) {
            continue;
        }
        let spliceResultList = [];
        if (isBrowser) {
            spliceResultList = result[i].filter((item) => item.stream_status !== 'ACTIVE');
            spliceResultList = spliceResultList.splice(0, 3);
        } else {
            spliceResultList = result[i].splice(0, 3);
        }
        const childWidget = await getCourseCardsWidgets({
            locale, cardID: tabs[i].card_id, result: isSachet && tabs[i].type === 'chapters' ? result[i] : spliceResultList, config, isSachet, assortmentID,
        });
        const items = [];
        if (isSachet && tabs[i].type === 'chapters') {
            childWidget.map((item) => items.push(item));
        } else if (isSachet && tabs[i].type === 'videos') {
            childWidget.forEach((item) => {
                item.data.items.forEach((element) => {
                    items.push({
                        type: 'widget_course_classes',
                        data: element,
                    });
                });
            });
        } else {
            childWidget[0].data.items.forEach((element) => {
                if (tabs[i].card_id === 'notes' || tabs[i].card_id === 'homework') {
                    element = { ...element, deeplink: branchDeeplink };
                    items.push({
                        type: childWidget[0].type === 'all_classes' ? 'widget_course_classes' : childWidget[0].type,
                        data: {
                            items: [element],
                        },
                        extra_params: {
                            source: 'course_subject_page',
                        },
                    });
                } else {
                    items.push({
                        type: childWidget[0].type === 'all_classes' ? 'widget_course_classes' : childWidget[0].type,
                        data: element,
                    });
                }
            });
        }
        widgets.push({
            data: {
                title: tabs[i].title,
                link_text: tabs[i].link_text,
                deeplink: assortmentID ? `${tabs[i].deeplink}&assortment_id=${assortmentID}&subject=${subject}` : tabs[i].deeplink,
                items,
            },
            type: 'widget_course_parent',
            extra_params: {
                button_type: tabs[i].title,
                subject,
            },
        });
    }

    return widgets;
}

function getCourseInfo(courseDetail) {
    const obj = {
        type: 'course_info',
        data: {
            title: courseDetail[0].display_name ? courseDetail[0].display_name : '',
            description: courseDetail[0].display_description,
            link: '',
        },
    };
    return obj;
}

async function getSachetDetails({
    db,
    config,
    locale,
    studentID,
    chapterDetails,
    purchasedVideos,
    purchasedPDFs,
}) {
    try {
        const chapterAssortmentList = [];
        const pdfAssortmentList = [];
        const videosAssortmentList = [];
        chapterDetails.map((chapter) => chapterAssortmentList.push(chapter.assortment_id));
        purchasedVideos.map((video) => videosAssortmentList.push(video.assortment_id));
        purchasedPDFs.map((pdf) => pdfAssortmentList.push(pdf.assortment_id));
        const promises = [];
        let purchasedPDFIndex = -1;
        let chapterIndex = -1;
        let purchasedVideosIndex = -1;
        const tabsData = [];
        if (chapterDetails.length) {
            promises.push(CourseMysqlV2.getPastVideoResourcesOfChapter(db.mysql.read, chapterAssortmentList));
            chapterIndex = promises.length - 1;
            tabsData.push({
                card_id: 'recent',
                title: locale === 'hi' ? 'अध्याय' : 'Chapters',
                deeplink: 'doubtnutapp://course_detail_info?tab=chapter&assortment_id=chapter',
                link_text: locale === 'hi' ? 'सारे अध्याय देखें' : 'View all chapters',
                type: 'chapters',
            });
        }
        if (purchasedVideos.length) {
            promises.push(CourseMysqlV2.getResourcesFromResourceAssortments(db.mysql.read, videosAssortmentList));
            tabsData.push({
                card_id: 'recent',
                title: locale === 'hi' ? 'वीडियो' : 'Videos',
                deeplink: 'doubtnutapp://course_detail_info?tab=video&assortment_id=video',
                link_text: locale === 'hi' ? 'सारे वीडियो देखें' : 'View all videos',
                type: 'videos',
            });
            purchasedVideosIndex = promises.length - 1;
        }
        if (purchasedPDFs.length) {
            promises.push(CourseMysqlV2.getResourceDetailsFromIdWithoutClass(db.mysql.read, pdfAssortmentList, [2], 3, 0));
            purchasedPDFIndex = promises.length - 1;
            tabsData.push({
                card_id: 'notes',
                title: 'PDFs',
                deeplink: 'doubtnutapp://course_detail_info?tab=pdf&assortment_id=pdf',
                link_text: locale === 'hi' ? 'सारे PDF देखें' : 'View all PDFs',
                type: 'notes',
            });
        }

        const result = await Promise.all(promises);
        if (chapterIndex >= 0) {
            const qIdList = [];
            result[chapterIndex].sort((chapter1, chapter2) => {
                const index1 = chapterDetails.findIndex((chapter) => chapter.display_name === chapter1.chapter);
                const index2 = chapterDetails.findIndex((chapter) => chapter.display_name === chapter2.chapter);
                if (index1 !== -1 && index1 < index2) {
                    return -1;
                }
                if (index2 !== -1 && index2 < index1) {
                    return 1;
                }
                return 0;
            });
            result[chapterIndex].forEach((e) => {
                qIdList.push(e.resource_reference);
            });
            if (qIdList.length) {
                const resolvedPromises = await CourseMysqlV2.getVideoProgressOfStudent(db.mysql.read, studentID, qIdList);
                for (let i = 0; i < result[chapterIndex].length; i++) {
                    const qid = result[chapterIndex][i].resource_reference;
                    const vvsData = resolvedPromises.filter((e) => e.question_id == qid);
                    result[chapterIndex][i].progress_status = vvsData.length ? (vvsData[0].video_time / vvsData[0].duration) * 100 : 0;
                    result[chapterIndex][i].video_time = vvsData.length ? vvsData[0].video_time : 0;
                }
            }
        }
        if (purchasedPDFIndex >= 0) {
            for (let i = 0; i < result[purchasedPDFIndex].length; i++) {
                result[purchasedPDFIndex][i].is_free = 1;
            }
        }

        const widgets = await getMultiCourseCardsWidgets({
            locale,
            result,
            config,
            tabs: tabsData,
            isSachet: true,
        });

        if (chapterIndex >= 0 && widgets[chapterIndex]) {
            if (widgets[chapterIndex].data) {
                widgets[chapterIndex].data.items.forEach((item) => {
                    if (item.data) {
                        item.data.is_expanded = false;
                    }
                });
            }
        }
        if (purchasedVideosIndex >= 0 && widgets[purchasedVideosIndex]) {
            if (widgets[purchasedVideosIndex].data) {
                widgets[purchasedVideosIndex].data.items.forEach((item) => {
                    item.layout_config = {
                        margin_left: 16,
                        margin_right: 16,
                    };
                });
            }
        }
        console.log(widgets);
        return widgets;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getChapterResourceDetails({
    db,
    config,
    locale,
    limit,
    offset,
    subject,
    chapterDetails,
}) {
    try {
        const allChapterAssortments = chapterDetails.map((chapter) => chapter.assortment_id);
        let chapterAssortmentList = chapterDetails.map((chapter) => chapter.assortment_id);
        if (subject && chapterAssortmentList.length) {
            const chapterSubjectDetails = await CourseMysqlV2.getChapterAssormtentsFromSubjectAndChapter(db.mysql.read, subject, chapterAssortmentList);
            chapterAssortmentList = chapterSubjectDetails.map((chapter) => chapter.assortment_id);
        }
        const filterChapterAssortmentList = [];
        for (let i = offset; i < (offset + limit) && i < chapterAssortmentList.length; i++) {
            filterChapterAssortmentList.push(chapterAssortmentList[i]);
        }
        if (!filterChapterAssortmentList.length) {
            return {
                widgets: [],
                filter_widgets: [],
            };
        }
        const [
            result,
            subjectDetails,
        ] = await Promise.all([
            CourseMysqlV2.getPastVideoResourcesOfChapter(db.mysql.read, filterChapterAssortmentList),
            CourseMysqlV2.getUserSubjectsFromChapterAssortments(db.mysql.read, allChapterAssortments),
        ]);
        result.sort((chapter1, chapter2) => {
            const index1 = chapterDetails.findIndex((chapter) => chapter.display_name === chapter1.chapter);
            const index2 = chapterDetails.findIndex((chapter) => chapter.display_name === chapter2.chapter);
            if (index1 !== -1 && index1 < index2) {
                return -1;
            }
            if (index2 !== -1 && index2 < index1) {
                return 1;
            }
            return 0;
        });
        const subjects = subjectDetails.map((subjectDetail) => subjectDetail.subject);
        const widgets = result.length ? await getCourseCardsWidgets({
            db,
            locale,
            result,
            config,
            cardID: 'recent',
        }) : [];
        const subjectFilters = [];
        for (let i = 0; i < subjects.length && subjects.length > 1; i++) {
            subjectFilters.push({
                filter_id: subjects[i],
                text: locale === 'hi' && Data.subjectHindi[subjects[i].toUpperCase()] ? Data.subjectHindi[subjects[i].toUpperCase()] : subjects[i],
                color: LiveclassHelper.getBarColorForLiveclassHomepage(subjects[i].toUpperCase()),
                is_selected: subject === subjects[i],
            });
        }
        const filter_widgets = {
            type: 'subject_filters',
            data: {
                items: subjectFilters,
            },
            extra_params: {
                page_type: 'CHAPTER_SACHET',
            },
        };
        return {
            widgets,
            filter_widgets,
        };
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getPurchasedVideosDetails({
    db,
    config,
    purchasedVideos,
    locale,
    limit,
    offset,
    subject,
}) {
    try {
        const purchasedVideoAssortments = [];
        purchasedVideos.forEach((video) => purchasedVideoAssortments.push(video.assortment_id));
        if (!purchasedVideos.length) {
            return {
                widgets: [],
                filter_widgets: [],
            };
        }
        let videoDetails = [];
        videoDetails = await CourseMysqlV2.getResourcesFromResourceAssortments(db.mysql.read, purchasedVideoAssortments);
        const subjectMapping = _.groupBy(videoDetails, 'subject');
        const subjects = [];
        for (const key in subjectMapping) {
            if (subjectMapping[key]) {
                subjects.push(key);
            }
        }
        if (subject) {
            videoDetails = videoDetails.filter((video) => video.subject === subject);
        }
        const videoDetailsOffset = [];
        for (let i = offset; i < (offset + limit) && i < videoDetails.length; i++) {
            videoDetailsOffset.push(videoDetails[i]);
        }
        if (!videoDetailsOffset.length) {
            return {
                widgets: [],
                filter_widgets: [],
            };
        }
        const childWidget = await getCourseCardsWidgets({
            locale, cardID: 'recent', result: videoDetailsOffset, config,
        });
        const items = [];
        console.log(childWidget);
        childWidget[0].data.items.forEach((element) => {
            items.push({
                type: 'widget_course_classes',
                data: element,
                layout_config: {
                    margin_left: 16,
                    margin_right: 16,
                },
            });
        });
        const subjectFilters = [];
        for (let i = 0; i < subjects.length && subjects.length > 1; i++) {
            subjectFilters.push({
                filter_id: subjects[i],
                text: locale === 'hi' && Data.subjectHindi[subjects[i].toUpperCase()] ? Data.subjectHindi[subjects[i].toUpperCase()] : subjects[i],
                color: LiveclassHelper.getBarColorForLiveclassHomepage(subjects[i].toUpperCase()),
                is_selected: subject === subjects[i],
            });
        }
        const filter_widgets = {
            type: 'subject_filters',
            data: {
                items: subjectFilters,
            },
            extra_params: {
                page_type: 'VIDEOS_SACHET',
            },
        };
        return {
            widgets: items,
            filter_widgets,
        };
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getPurchasedPDFDetails({
    db,
    config,
    purchasedPDFs,
    locale,
    limit,
    offset,
}) {
    try {
        const purchasedPDFAssortments = [];
        purchasedPDFs.forEach((pdf) => purchasedPDFAssortments.push(pdf.assortment_id));
        if (!purchasedPDFAssortments.length) {
            return purchasedPDFAssortments;
        }
        const result = await CourseMysqlV2.getResourceDetailsFromIdWithoutClass(db.mysql.read, purchasedPDFAssortments, [2], limit, offset);
        for (let i = 0; i < result.length; i++) {
            result[i].is_free = 1;
        }
        const widgets = await getCourseCardsWidgets({
            db,
            config,
            locale,
            result,
            cardID: 'notes',
        });
        widgets.forEach((widget) => {
            if (widget.data) {
                delete widget.data.title;
            }
            if (widget.extra_params) {
                widget.extra_params.source = 'PDF_SACHET';
            }
        });
        return widgets;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getCourseIDforCallingCard(db, studentID, assortmentID) {
    try {
        let deeplink = null;
        const exp = 'calling_card';
        const WAflag = await CourseContainer.getFlagrResp(db, exp, studentID);
        if (WAflag && WAflag.calling_card && WAflag.calling_card.payload && WAflag.calling_card.payload.WA) {
            const courseID = await CourseMysqlV2.getCourseID(db.mysql.read, assortmentID);
            if (courseID && courseID[0]) {
                deeplink = `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?phone=918400400400&text=Mujhe%20Course%20ID%20%23${courseID[0].liveclass_course_id}%20ki%20jaankari%20chahiye`;
            }
        }
        return deeplink;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function setBottomSheetDetails(courseInfo, courseDetail, assortmentPriceMapping, locale, checkTrialEligibility) {
    if (!checkTrialEligibility.length) {
        courseInfo.data.btn_text = locale === 'hi' ? '3 दिन का मुफ्त ट्रायल शुरू करें' : 'Start 3 Day Free Trial';
        courseInfo.data.btn_text_size = 16;
        courseInfo.data.btn_deeplink = '';
        courseInfo.data.is_buy_now_btn = false;
    }
    courseInfo.data.text_one = `₹${assortmentPriceMapping[courseDetail[0].assortment_id].display_price}`;
    courseInfo.data.text_one_size = 20;
    courseInfo.data.text_one_color = '#17181f';
    courseInfo.data.text_one_strike_through = false;
    courseInfo.data.text_two = `₹${assortmentPriceMapping[courseDetail[0].assortment_id].base_price}`;
    courseInfo.data.text_two_size = 10;
    courseInfo.data.text_two_color = '#969696';
    courseInfo.data.text_two_strike_through = true;
    courseInfo.data.title_text_size = 20;
    delete courseInfo.data.tag_two_text;
    delete courseInfo.data.tag_two_bg_color;
    delete courseInfo.data.tag_two_deeplink;
}

function getWidgetFilterSort(locale, chapter, subject, filter, sort, config) {
    return {
        type: 'widget_filter_sort',
        is_sticky: true,
        data: {
            is_sticky: true,
            title_one: freeClassListingPageText.traslateText(locale, 'Free Classes For You'),
            title_one_text_size: '16',
            title_one_text_color: '#424242',
            items: [
                {
                    type: 'CHAPTER',
                    id: chapter,
                    title_one: chapter,
                    title_one_text_size: '12',
                    title_one_text_color: '#000000',
                    icon: `${config.staticCDN}engagement_framework/B4413C10-B60E-8034-03EB-1FC944741D3E.webp`,
                    max_length: 25,
                    deeplink: '',
                },
                {
                    type: 'SUBJECT',
                    id: subject,
                    title_one: subject,
                    title_one_text_size: '12',
                    title_one_text_color: '#000000',
                    icon: `${config.staticCDN}engagement_framework/B4413C10-B60E-8034-03EB-1FC944741D3E.webp`,
                    max_length: 25,
                },
                {
                    type: 'FILTER',
                    id: filter,
                    title_one: freeClassListingPageText.traslateText(locale, 'Filter'),
                    title_one_text_size: '12',
                    title_one_text_color: '#000000',
                    icon: `${config.staticCDN}engagement_framework/C75DA5AF-52E2-B0D1-529A-FBE8524A3EF5.webp`,
                    max_length: 25,
                    deeplink: '',
                },
                {
                    type: 'SORT',
                    id: sort,
                    title_one: freeClassListingPageText.traslateText(locale, 'Sort'),
                    title_one_text_size: '12',
                    title_one_text_color: '#000000',
                    icon: `${config.staticCDN}engagement_framework/29DE6723-70D7-017B-F81D-4D72F1692279.webp`,
                    max_length: 25,
                    deeplink: '',
                },
            ],
        },
        layout_config: {
            margin_top: 25,
            margin_bottom: 0,
            margin_left: 0,
            margin_right: 0,
        },

    };
}

function getWidgetTwoTextsHorizontal(locale, title1, classCount) {
    return {
        type: 'widget_two_texts_horizontal',
        data: {
            title_one: title1,
            title_one_text_size: '14',
            title_one_text_color: '#424242',
            title_two: `${classCount} ${freeClassListingPageText.traslateText(locale, 'classes')}`,
            title_two_text_size: '10',
            title_two_text_color: '#424242',
        },
        layout_config: {
            margin_top: 25,
            margin_bottom: 0,
            margin_left: 16,
            margin_right: 16,
        },
    };
}

function widgetWatchAndWin(locale, config) {
    return {
        type: 'widget_watch_and_win',
        data: {
            title_one: freeClassListingPageText.bannerText1(locale),
            title_one_text_size: '16',
            title_one_text_color: '#424242',
            title_two: freeClassListingPageText.bannerText2(locale),
            title_two_text_size: '14',
            title_two_text_color: '#424242',
            image_url1: `${config.staticCDN}engagement_framework/BBFAA8BA-857A-B559-53DE-230B4770CF36.webp`,
            title_three: freeClassListingPageText.bannerText3(locale),
            title_three_text_size: '10',
            title_three_text_color: '#6112e1',
            image_url2: `${config.staticCDN}engagement_framework/58C03B90-65F3-D78A-00C9-22749A2F58EE.webp`,
            bg_color1: '#b588ff',
            bg_color2: '#888dff',
            cta_deeplink: '',
            deeplink: '',
        },
        layout_config: {
            margin_top: 10,
            margin_bottom: 0,
            margin_left: 0,
            margin_right: 0,
        },
    };
}

function getTabsFreeChapterListing(continueWatchingCount, notWatchedCount, watchedCount, selectedTab, locale) {
    const data = {
        type: 'widgets_two_texts_vertical_tabs',
        data: {
            items: [
                {
                    id: 'continue_watching',
                    title_one: freeClassListingPageText.traslateText(locale, 'Continue watching'),
                    title_one_text_size: '12',
                    title_one_text_color: '#424242',
                    title_two: `(${continueWatchingCount} classes)`,
                    title_two_text_size: '10',
                    title_two_text_color: '#424242',
                    is_selected: selectedTab === 'continue_watching',
                },
                {
                    id: 'not_watched',
                    title_one: freeClassListingPageText.traslateText(locale, 'Not Watched'),
                    title_one_text_size: '12',
                    title_one_text_color: '#424242',
                    title_two: `(${notWatchedCount} classes)`,
                    title_two_text_size: '10',
                    title_two_text_color: '#424242',
                    is_selected: selectedTab === 'not_watched',
                },
                {
                    id: 'watched',
                    title_one: freeClassListingPageText.traslateText(locale, 'Watched'),
                    title_one_text_size: '12',
                    title_one_text_color: '#424242',
                    title_two: `(${watchedCount} classes)`,
                    title_two_text_size: '10',
                    title_two_text_color: '#424242',
                    is_selected: selectedTab === 'watched',
                },
            ],
        },
        layout_config: {
            margin_top: 10,
            margin_bottom: 0,
            margin_left: 0,
            margin_right: 0,
        },
    };
    if (continueWatchingCount === 0) {
        // eslint-disable-next-line no-nested-ternary
        data.data.items.sort((a, b) => (a.id === 'continue_watching' ? 1 : b.id == 'continue_watching' ? -1 : 0));
    }
    return data;
}
function getWidgerWatchNow(badgeTitle, lectureTitle, expertName, date, questionId, views, watchedTime, totalTime, actionTitleOne, reminderSet = null, imageUrl, bgColor = '#FCB750', badgeBgColor = '#eb532c', config, locale) {
    return {
        type: 'widget_watch_now',
        data: {
            badge_title: freeClassListingPageText.traslateText(locale, badgeTitle),
            badge_title_text_size: '12',
            badge_title_text_color: '#ffffff',
            badge_bg_color: badgeBgColor,
            image_url1: imageUrl,
            image_url2: `${config.staticCDN}engagement_framework/FEA13D18-995C-034A-1B8E-2517BE3B2C40.webp`,
            bg_color1: bgColor,
            title_one: lectureTitle,
            title_one_text_size: '12',
            title_one_text_color: '#424242',
            title_two: `By ${expertName}`,
            title_two_text_size: '12',
            title_two_text_color: '#504949',
            title_three: freeClassListingPageText.getWatchingAndDurationText(locale, badgeTitle, views, Math.floor(totalTime / 60)),
            title_three_text_size: '9',
            title_three_text_color: '#5b5b5b',
            title_four: moment(date).format('DD MMM YYYY'),
            title_four_text_size: '9',
            title_four_text_color: '#5b5b5b',
            progress_highlight_color: '#2062d3',
            progress_background_color: '#c0c0c0',
            id: questionId,
            watched_time: watchedTime,
            total_time: badgeTitle === 'Upcoming' ? null : totalTime,
            action_title_one: actionTitleOne,
            action_title_one_notified: 'Reminder set',
            action_title_one_text_size: '10',
            action_title_one_text_color: '#ffffff',
            is_notified: reminderSet,
            duration: badgeTitle !== 'Upcoming' ? moment(date).unix() : moment(date).unix(),
            action_deeplink: badgeTitle !== 'Upcoming' ? `doubtnutapp://video?qid=${questionId}&page=FREE_CLASS_LIST` : '',
            deeplink: `doubtnutapp://video?qid=${questionId}&page=FREE_CLASS_LIST`,
        },
        layout_config: {
            margin_top: 14,
            margin_bottom: 0,
            margin_left: 16,
            margin_right: 16,
        },
    };
}

function getWidgetNoData(imageUrl, text, deeplink, showFiltersBottomSheet, buttonText, tabId) {
    return {
        type: 'widget_no_data',
        data: {
            image_url1: imageUrl,
            title_one: text,
            title_one_text_size: '16',
            title_one_text_color: '#000000',
            action_title_one: buttonText,
            action_title_one_text_size: '14',
            action_title_one_text_color: '#ffffff',
            deeplink,
            show_filters_bottom_sheet: showFiltersBottomSheet,
            tab_id: tabId,
        },
        layout_config: {
            margin_top: 0,
            margin_bottom: 64,
            margin_left: 16,
            margin_right: 16,
        },
    };
}

async function showIASFlagr(db, studentId) {
    const flagrResp = await Coursev2Container.getFlagrResp(db, 'free_class_listing_ias', studentId);
    return _.get(flagrResp, 'free_class_listing_ias.payload.enable', true);
}
async function freeChapterListingPage(req, res, next, courseDetail) {
    const db = req.app.get('db');
    const config = req.app.get('config');
    let { locale, student_id: studentId, student_class: studentClass } = req.user ? req.user : {};
    const { version_code: versionCode } = req.headers;

    locale = locale === 'hi' ? locale : 'en';
    let { tab_id: tabId } = req.query;
    let {
        class_type: classTypeOption, medium: mediumOption, subject_flp: subjectOption, chapter: chapterOption, teacher: teacherOption, sort: sortOption,
    } = req.query;
    // if (subjectOption && subjectOption.includes(';;;')) {
    //     mediumOption = subjectOption.split(';;;')[1];
    //     subjectOption = subjectOption.split(';;;')[0];
    // }
    if (classTypeOption) {
        classTypeOption = classTypeOption.split(',');
    }
    if (teacherOption) {
        teacherOption = teacherOption.split(',');
    }
    let chapterData;
    // filter flows

    if (!courseDetail.length || (studentClass && mediumOption && subjectOption && teacherOption && chapterOption)) {
        // if we have all filtes use data of filters or if courseDetail doesnt have data
        const chapterResp = await clpMysql.getChapterDataByAssortmentId(db.mysql.read, +chapterOption);
        chapterData = [{
            chapter_assortment_id: +chapterOption, chapter_name: chapterResp[0].display_name, subject_name: subjectOption, meta_info: mediumOption,
        }];
    } else if (studentClass && chapterOption) {
        // if we have chapter option from chapter's bottom sheet then use chapterOption(assortment id of chapter to fetch data)

        const subjectData = await FreeClassListingPageMysql.getSubjectDataFromChapterAssortmentId(db.mysql.read, courseDetail[0].assortment_id);
        const subjectName = subjectData[0].display_name;
        const metaInfo = subjectData[0].meta_info;
        const chapterResp = await clpMysql.getChapterDataByAssortmentId(db.mysql.read, +chapterOption);
        chapterData = [{
            chapter_assortment_id: +chapterOption, chapter_name: chapterResp[0].display_name, subject_name: subjectName, meta_info: metaInfo,
        }];
    } else if (studentClass && subjectOption) {
        // if we have subject option and no chapter option then get data for subjects
        const metaInfo = mediumOption || (locale === 'hi' ? 'HINDI' : 'ENGLISH');
        // subject's assortment ids are stored in redis
        const { subject_assortments: subjectAssortments, chapter_assortments: allChapterAssortments } = await freeClassListingPageContainer.getSubjectAssortmentIds(db, studentClass, metaInfo, subjectOption);
        const chapterAssortmentId = await CourseMysqlV2.getLatestChapterOfSubject(db.mysql.read, subjectAssortments, allChapterAssortments);
        const chapData = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, chapterAssortmentId[0].chapter_assortment_id, studentClass);
        chapterData = [{
            chapter_assortment_id: +chapterAssortmentId[0].chapter_assortment_id, chapter_name: chapData[0].display_name, subject_name: subjectOption, meta_info: locale === 'hi' ? 'HINDI' : 'ENGLISH',
        }];
    } else if (courseDetail[0].assortment_type === 'subject') {
        // if user is trying to access a free subject's assortment from a entry point
        const { subject_assortments: subjectAssortments, chapter_assortments: allChapterAssortments } = await freeClassListingPageContainer.getSubjectAssortmentIds(db, studentClass, courseDetail[0].meta_info, courseDetail[0].display_name);

        const chapterAssortmentId = await CourseMysqlV2.getLatestChapterOfSubject(db.mysql.read, subjectAssortments, allChapterAssortments);
        const chapterDataResp = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, chapterAssortmentId[0].chapter_assortment_id, studentClass);
        chapterData = [{ chapter_assortment_id: chapterDataResp[0].assortment_id, chapter_name: chapterDataResp[0].display_name, subject_name: courseDetail[0].display_name }];
    } else {
        // if user is trying to access a free chapters's assortment from a entry point

        const subjectData = await FreeClassListingPageMysql.getSubjectDataFromChapterAssortmentId(db.mysql.read, courseDetail[0].assortment_id);
        chapterData = [{ chapter_assortment_id: courseDetail[0].assortment_id, chapter_name: courseDetail[0].display_name, subject_name: subjectData[0].display_name }];
    }

    const assortmentId = chapterData[0].chapter_assortment_id;
    const chapterName = chapterData[0].chapter_name;

    const subjectName = chapterData[0].subject_name;
    let pastClasses = [];
    if (!classTypeOption || classTypeOption.includes('pc') || classTypeOption.includes('All') || classTypeOption.includes('lc')) {
        pastClasses = await FreeClassListingPageMysql.getPastVideoResourcesOfChapter(db.mysql.read, [assortmentId], 1);
    }

    let liveClasses = [];
    const liveQid = [];
    if (!classTypeOption || classTypeOption.includes('lc') || classTypeOption.includes('All')) {
        liveClasses = pastClasses.filter((item) => item.stream_status === 'ACTIVE' && item.question_id);
        liveClasses.forEach((item) => {
            liveQid.push(item.question_id);
        });
    }
    if (!classTypeOption || classTypeOption.includes('pc') || classTypeOption.includes('All')) {
        pastClasses = pastClasses.filter((item) => !liveQid.includes(item.question_id) && item.question_id && moment(item.live_at).add(item.duration, 'seconds').isBefore(moment().add(5, 'hours').add(30, 'minutes')));
    } else {
        pastClasses = [];
    }
    let upcomingClasses = [];
    if (!classTypeOption || classTypeOption.includes('uc') || classTypeOption.includes('All')) {
        upcomingClasses = await FreeClassListingPageMysql.getUpcomingVideoResourcesOfChapter(db.mysql.read, [assortmentId], 1);
    }

    upcomingClasses = upcomingClasses.filter((item) => item.question_id);
    if (_.get(teacherOption, 'length', 0) > 0) {
        liveClasses = liveClasses.filter((item) => teacherOption.includes(`${item.faculty_id}`));
        pastClasses = pastClasses.filter((item) => teacherOption.includes(`${item.faculty_id}`));
        upcomingClasses = upcomingClasses.filter((item) => teacherOption.includes(`${item.faculty_id}`));
    }
    const qids = [];
    liveClasses.forEach((item) => {
        qids.push(item.question_id);
    });

    pastClasses.forEach((item) => {
        qids.push(item.question_id);
    });
    let viewData = {};
    if (qids.length) {
        viewData = await pzn.getViewTimeForStudentsByQidList(studentId, qids);
    }
    upcomingClasses.forEach((item) => {
        qids.push(item.question_id);
    });
    liveClasses.forEach((item, index) => {
        liveClasses[index].duration_watched = _.get(viewData, `${item.question_id}`, 0.00);
    });
    pastClasses.forEach((item, index) => {
        pastClasses[index].duration_watched = _.get(viewData, `${item.question_id}`, 0.00);
    });

    const videoWidgets = [];
    liveClasses.forEach((item) => {
        const views = Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(item.question_id)[0] / 100);
        videoWidgets.push(getWidgerWatchNow('LIVE', item.display, item.expert_name, item.live_at, item.question_id, views - 2000, item.duration_watched, item.duration, freeClassListingPageText.traslateText(locale, 'Watch Now'), null, item.expert_image, '#FCB750', '#eb532c', config, locale));
    });
    pastClasses.forEach((item) => {
        const views = Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(item.question_id)[0] / 100);
        videoWidgets.push(getWidgerWatchNow('', item.display, item.expert_name, item.live_at, item.question_id, views + 20000, item.duration_watched, item.duration, freeClassListingPageText.traslateText(locale, 'Watch Now'), null, item.expert_image, '#6194F5', '#3c5c9e', config, locale));
    });
    const upcomingQids = [];
    upcomingClasses.forEach((item) => upcomingQids.push(item.question_id));
    let interestedData;
    if (upcomingQids.length) {
        interestedData = await FreeClassListingPageMysql.getReminderSetData(db.mysql.read, studentId, upcomingQids);
    }
    upcomingClasses.forEach((item) => {
        let reminderStatus = false;
        interestedData.forEach((temp) => {
            if (temp.resource_reference === +item.question_id) {
                reminderStatus = true;
            }
        });
        const views = Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(item.question_id)[0] / 100);
        videoWidgets.push(getWidgerWatchNow('Upcoming', item.display, item.expert_name, item.live_at, item.question_id, views + 2000, item.duration_watched, item.duration, !reminderStatus ? freeClassListingPageText.traslateText(locale, 'Notify Me') : 'Reminder Set', reminderStatus, item.expert_image, '#F3754D', '#50A463', config, locale));
    });

    const continueWatching = [];
    const watched = [];
    const notWatched = [];

    videoWidgets.forEach((item) => {
        const totalTime = _.get(item, 'data.total_time');
        const watchedTime = _.get(item, 'data.watched_time');
        if (!watchedTime) {
            item.data.bg_color1 = '#6194F5';
            notWatched.push(item);
        } else if (watchedTime === totalTime) {
            item.data.bg_color1 = '#F3754D';
            watched.push(item);
        } else {
            item.data.bg_color1 = '#FCB750';
            continueWatching.push(item);
        }
    });
    let finalVideoWidgets = [];
    let widgetNoData;
    tabId = tabId || (continueWatching.length === 0 ? 'not_watched' : 'continue_watching');
    let tabData = null;
    if ([continueWatching.length, notWatched.length, watched.length].filter((item) => item > 0).length > 1) {
        tabData = getTabsFreeChapterListing(continueWatching.length, notWatched.length, watched.length, tabId, locale);
    } else if ([continueWatching.length, notWatched.length, watched.length].filter((item) => item > 0).length === 1) {
        // eslint-disable-next-line no-nested-ternary
        tabId = continueWatching.length > 0 ? 'continue_watching' : (notWatched.length > 0 ? 'not_watched' : 'watched');
    }
    if (tabId === 'continue_watching') {
        const emptyText = freeClassListingPageText.redirectToNotWatched(locale, notWatched.length);
        const goTo = 'not_watched';
        const imageUrl = locale === 'hi' ? `${config.staticCDN}engagement_framework/1CFDA82F-BFDF-9DDB-1A8B-C6A4E3F8CDDE.webp` : `${config.staticCDN}engagement_framework/8D896F1A-36A4-2AB9-1901-FE34765D16CE.webp`;
        if (continueWatching.length === 0) {
            widgetNoData = getWidgetNoData(imageUrl, emptyText, `doubtnutapp://course_details?id=${assortmentId}&tab_id=${goTo}`, false, freeClassListingPageText.traslateText(locale, 'Watch Now'), 'not_watched');
        }
        finalVideoWidgets = continueWatching;
    } else if (tabId === 'not_watched') {
        const emptyText = freeClassListingPageText.redirectToNotWatched2(locale, continueWatching.length);
        const goTo = 'continue_watching';
        const imageUrl = locale === 'hi' ? `${config.staticCDN}engagement_framework/1CFDA82F-BFDF-9DDB-1A8B-C6A4E3F8CDDE.webp` : `${config.staticCDN}engagement_framework/8D896F1A-36A4-2AB9-1901-FE34765D16CE.webp`;
        if (notWatched.length === 0) {
            widgetNoData = getWidgetNoData(imageUrl, emptyText, `doubtnutapp://course_details?id=${assortmentId}&tab_id=${goTo}`, false, freeClassListingPageText.traslateText(locale, 'Complete Now'), 'continue_watching');
        }
        finalVideoWidgets = notWatched;
    } else if (tabId === 'watched') {
        const emptyText = freeClassListingPageText.redirectToContinueWatching(locale, continueWatching.length);
        const goTo = 'continue_watching';
        const imageUrl = locale === 'hi' ? `${config.staticCDN}engagement_framework/07F8F690-5856-ADB2-0A3A-612BC8A34DCD.webp` : `${config.staticCDN}engagement_framework/5FBBB661-55A2-3D39-B030-3C6315525843.webp`;
        if (watched.length === 0) {
            widgetNoData = getWidgetNoData(imageUrl, emptyText, `doubtnutapp://course_details?id=${assortmentId}&tab_id=${goTo}`, false, freeClassListingPageText.traslateText(locale, 'Complete Now'), 'continue_watching');
        }
        finalVideoWidgets = watched;
    }
    if (sortOption === 'Oldest') {
        finalVideoWidgets = _.orderBy(finalVideoWidgets, ['data.duration'], ['asc']);
    } else {
        finalVideoWidgets = _.orderBy(finalVideoWidgets, ['data.duration'], ['desc']);
    }

    const finalBanners = [];
    const packageValue = req.headers.package_name;
    const isFreeApp = packageValue === altAppData.freeAppPackageName;

    if (!isFreeApp) {
        const bannerData = await FreeClassListingPageMysql.getBanners(db.mysql.read, +versionCode, +studentClass, locale === 'hi' ? 'hi' : 'en');

        for (let i = 0; i < bannerData.length && finalBanners.length <= 3; i++) {
            if (bannerData.target_group_id) {
                const tgCheck = await TGHelper.targetGroupCheck({
                    db, studentId, tgID: bannerData.target_group_id, studentClass: studentId, locale,
                });
                if (tgCheck) {
                    finalBanners.push(bannerData[i]);
                }
            } else {
                finalBanners.push(bannerData[i]);
            }
        }
    }
    const widgets = [];
    const classesCount = pastClasses.length + liveClasses.length + upcomingClasses.length;
    const promises = [showIASFlagr(db, studentId), FreeChapterListingHelper.createBannerData(db, studentId, finalBanners)];
    const resolvedPromises = await Promise.all(promises);
    const showInAppSearch = resolvedPromises[0];
    const stickyWidgets = [];

    if (showInAppSearch) {
        stickyWidgets.push({
            type: 'widget_ias',
            data: {
                show_back_icon: true,
                title: 'Search for subject, chapter and topic',
                source: 'free_class_listing_page',
            },
        });
    }

    const promoList = resolvedPromises[1];
    stickyWidgets.push(getWidgetFilterSort(locale, chapterName, freeClassListingPageText.traslateText(locale, subjectName), '', 'most_recent', config));

    if (tabData && classesCount) {
        stickyWidgets.push(tabData);
    }

    widgets.push({
        widget_type: 'widget_parent',
        data: {
            scroll_direction: 'vertical',
            items: stickyWidgets,
        },
        is_sticky: true,
        layout_config: {
            margin_top: 0,
            margin_bottom: 0,
            margin_left: 0,
            margin_right: 0,
            bg_color: '#ffffff',
        },
    });
    const lastShownDate = JSON.parse(await studentRedis.getFreeClassListingPageBannerLastShownDate(db.redis.read, studentId));
    widgets.push(getWidgetTwoTextsHorizontal(locale, `${freeClassListingPageText.traslateText(locale, subjectName)}: ${chapterName}`, classesCount));

    if (!lastShownDate || moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD') !== lastShownDate) {
        studentRedis.setFreeClassListingPageBannerLastShownDate(db.redis.write, studentId, moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD'));
        widgets.push(widgetWatchAndWin(locale, config));
    }
    if (!classesCount) {
        const emptyText = freeClassListingPageText.traslateText(locale, 'iss filter ke liye koi results available nahi hai');
        const goTo = '';
        const imageUrl = `${config.staticCDN}engagement_framework/0EFF801D-DA0B-9B40-A20B-2E3DB7A8AFF2.webp`;
        widgets.push(getWidgetNoData(imageUrl, emptyText, `doubtnutapp://clp_filter_bottom_sheet?source=filter_sort_widget&assortment_id=${assortmentId}&filters=${JSON.stringify({ class_type: classTypeOption })}`, true, freeClassListingPageText.traslateText(locale, 'Change filter'), goTo));
    }

    if (finalVideoWidgets.length && classesCount) {
        widgets.push(...finalVideoWidgets);
    } else if (classesCount) {
        widgets.push(widgetNoData);
    }

    if (_.get(promoList, 'widget_data.items.length', false) && widgets.length > 5 && classesCount) {
        widgets.splice(10, 0, promoList);
    }

    const data = {
        is_vip: false,
        is_trial: false,
        show_in_app_search: false,
        in_app_search_title: 'Search for subject, chapter and topic',
        extra_widgets: widgets,
        assortment_id: assortmentId,
        show_pre_purchase_calling_card: false,
    };
    return next({ data });
}
async function automatedReplyOnFreeClasses(db, name, message, is_simulated, is_free, result, config, is_doubt, comment_id) {
    message = message.split(' ');
    const branchLink = await Coursev2Container.getAutomatedReplyBranchDeeplinkFromAppDeeplink(db);
    if (is_free && is_doubt) {
        if (message[0] === '#डाउट') {
            result.message = `Hello ${name}! आपके सारे डाउट के समाधान आपको VIP कोर्सेस में मिलेंगे. वो भी दिन में कभी भी!आपके लिए ये रहा स्पेशल कोर्स.${branchLink}`;
        } else {
            result.message = `Hello ${name}! Aapke sare Doubt ke solutions aapko VIP courses main milege. Wo bhi din main kabhi bhi! Aapke liye ye raha special course.${branchLink}`;
        }
        result.is_deleted = false;
        result.student_username = 'DOUBTNUT';
        result.student_avatar = config.logo_path;
        result.original_message = result.message;
        result.entity_type = 'comment';
        result.entity_id = comment_id;
        result.is_answer = true;
        result.user_tag = 'Verified';
        result.is_admin = true;
        result.student_id = 98;
    }

    return result;
}

module.exports = {
    getCourseInfo,
    getCourseHelpFlowData,
    getSubjectFilters,
    getNotesFilters,
    getBannersData,
    getHomeworkFilters,
    getCourseCardsWidgets,
    getMultiCourseCardsWidgets,
    getCaraouselDataForCoursePage,
    getPrePurchaseCourseFeaturesSachet,
    getSachetDetails,
    getChapterResourceDetails,
    getPurchasedVideosDetails,
    getPurchasedPDFDetails,
    getCarouselDataByUserState,
    getDemoVideosForPrePurchase,
    getPrePurchaseCourseTabs,
    getPrePurchaseTabsDataByTabId,
    getCourseBuyButtonData,
    getShareData,
    getIntroVideoForPrePurchase,
    getCourseIDforCallingCard,
    setBottomSheetDetails,
    getBannersForCoursePage,
    getDemoVideosList,
    getFiltersForBookmarkTabs,
    freeChapterListingPage,
    automatedReplyOnFreeClasses,
    getDemoVideosForPrePurchaseByQid,
};
