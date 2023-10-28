/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const couponMysql = require('../../../modules/mysql/coupon');
const CourseContainer = require('../../../modules/containers/coursev2');
const CourseRedis = require('../../../modules/redis/coursev2');
const LiveclassHelperLocal = require('./course.helper');
const CourseHelper = require('../../helpers/course');
const NudgeMysql = require('../../../modules/mysql/nudge');
const StudentRedis = require('../../../modules/redis/student');
const searchBl = require('../../v4/search/search.bl');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const liveclassData = require('../../../data/liveclass.data');
const AnswerContainer = require('../../v13/answer/answer.container');
const { autoScrollTime } = require('../../../data/data');
const PayMySQL = require('../../../modules/mysql/payment');
const NudgeHelper = require('../../helpers/nudge');
const StudentContainer = require('../../../modules/containers/student');
const TeacherContainer = require('../../../modules/containers/teacher');
const Data = require('../../../data/data');
const altAppData = require('../../../data/alt-app');

const referralFlowHelper = require('../../helpers/referralFlow');
const CampaignMysql = require('../../../modules/mysql/campaign');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');
const BranchContainer = require('../../../modules/containers/branch');

async function getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass) {
    let studentPackageAssortments = [];
    const assortmentList = [];
    const etoosAssortment = [];
    let result = [];
    if (studentPackageList.length) {
        for (let i = 0; i < studentPackageList.length; i++) {
            if (studentPackageList[i].assortment_id && studentPackageList[i].assortment_id === 138829) {
                etoosAssortment.push(138829);
            } else if (studentPackageList[i].assortment_id) {
                assortmentList.push(studentPackageList[i].assortment_id);
            }
        }
        if (assortmentList.length) {
            result = await CourseHelper.getAllAssortments(db, assortmentList, studentClass);
            result = result.totalAssortments;
        }
        studentPackageAssortments = [...assortmentList, ...etoosAssortment, ...result];
    }
    return studentPackageAssortments;
}

async function getEmiPackageAssortments(db, emiPackageList, studentClass, studentID) {
    try {
        let studentEmiPackageAssortments = [];
        const emiCheck = await LiveclassHelperLocal.checkEmiCounter(db, studentID);
        if (emiPackageList.length && emiCheck) {
            const lastEmi = emiPackageList[emiPackageList.length - 1];
            const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
                .endOf('day');
            if (lastEmi.end_date >= now && lastEmi.end_date <= end && !lastEmi.is_last) {
                studentEmiPackageAssortments = await getChildAssortmentsOfUserPackages(db, emiPackageList, studentClass);
            }
        }
        return studentEmiPackageAssortments;
    } catch (e) {
        throw new Error(e);
    }
}

async function getCourseDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const locale = req.user ? req.user.locale : 'en';
        const studentID = req.user ? req.user.student_id : 0;
        let { assortment_id: assortmentId, studentClass } = req.query;
        if (req.query.student_class) {
            studentClass = req.query.student_class;
        }
        let { version_code: versionCode } = req.headers;
        const xAuthToken = req.headers['x-auth-token'];
        const event = 'lc_paid_course_back';
        if (!versionCode) {
            versionCode = 1000;
        }
        const classValue = assortmentId.split('||')[1];
        const gotCoupon = assortmentId.split('||')[2];
        assortmentId = assortmentId.split('||')[0];
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        if (typeof classValue !== 'undefined' && classValue) {
            studentClass = classValue;
        }
        if (assortmentId.includes('scholarship_test')) {
            const dataSch = await LiveclassHelperLocal.scholarshipLanding(db, config, studentID, xAuthToken, locale, assortmentId, versionCode);
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: dataSch,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (assortmentId.includes('xxxx')) {
            const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentID);
            assortmentId = await CourseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, (assortmentId.split('_')[1]) ? assortmentId.split('_')[1] : locale);
        }
        if (!assortmentId) assortmentId = 148;
        let { subject } = req.query;
        if (!subject) subject = 'ALL';
        let isTrial = false;
        const limit = 40;
        const offset = 0;
        const widgets = [];
        let resData = {};
        if (typeof gotCoupon !== 'undefined' && gotCoupon.length > 0) {
            const couponData = {};
            couponData.student_id = studentID;
            couponData.coupon_code = gotCoupon;
            couponData.source = 'COURSE_DETAIL';
            CourseMysqlV2.setPreAppliedReferralCode(db.mysql.write, couponData);
        }
        const [
            activeSubs,
            courseDetail,
            studentPackageList,
            checkTrialEligibility,
        ] = await Promise.all([
            CourseMysqlV2.getUserEmiPackages(db.mysql.read, studentID),
            CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, [assortmentId], studentClass),
            CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID),
            CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, assortmentId),
        ]);
        const flagrResponseByFlagKey = {};
        let studentPackageAssortments = [];
        let userPackageCurrentAssortment = [];
        let paymentCardState = {
            isVip: false,
        };
        if (_.find(studentPackageList, ['assortment_id', +assortmentId])) {
            userPackageCurrentAssortment.push(_.find(studentPackageList, ['assortment_id', +assortmentId]));
            paymentCardState = {
                isVip: true,
            };
        } else if (_.find(studentPackageList, ['assortment_id', 138829]) && courseDetail[0].parent === 4) {
            userPackageCurrentAssortment.push(_.find(studentPackageList, ['assortment_id', 138829]));
            paymentCardState = {
                isVip: true,
            };
        } else {
            studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);
            userPackageCurrentAssortment = studentPackageAssortments.filter((e) => e === parseInt(assortmentId));
            paymentCardState = {
                isVip: userPackageCurrentAssortment.length > 0,
            };
        }
        let assortmentPriceMapping;
        // no trial taken structure
        if (courseDetail[0].parent === 4 && !userPackageCurrentAssortment.length) {
            assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [138829], studentID, false, xAuthToken);
            const [
                demoVideos,
                checkTrialEtoos,
            ] = await Promise.all([
                CourseMysqlV2.getFreeResourceDetailsFromAssortmentId(db.mysql.read, assortmentId, studentClass, 0),
                CourseMysqlV2.getUserPackagesByAssortment(db.mysql.read, studentID, 138829),
            ]);
            let tabDetails = [0, 0];
            const topicsLength = courseDetail[0].assortment_type !== 'chapter' ? 1 : 0;
            tabDetails.push(topicsLength);
            widgets.push(LiveclassHelperLocal.getCourseInfo(courseDetail, config));
            if (!checkTrialEtoos.length) {
                widgets.push(CourseHelper.getTrialWidget(138829, false, null, null, courseDetail[0].class, locale));
            }
            const result = await CourseHelper.getCoursePageResponse({
                studentPackageAssortments, db, config, data: demoVideos, title: 'Demo Videos', assortmentPriceMapping, versionCode, paymentCardState,
            });
            if (result.data.items.length) {
                widgets.push(result);
            }
            const bannerData = await LiveclassHelperLocal.getBannersData(courseDetail, [], locale, config, paymentCardState.isVip, studentClass, db);
            if (bannerData.data.items.length) {
                widgets.push(bannerData);
            }
            if (courseDetail[0].assortment_type === 'chapter') {
                const data = await CourseMysqlV2.getPastVideoResourcesOfChapter(db.mysql.read, [assortmentId]);
                tabDetails = [data.length];
            }
            const tabsData = CourseHelper.getCourseTabs(tabDetails, locale);
            resData = {
                widgets,
                tabs: tabsData,
            };
        } else if (!courseDetail[0].is_free && !userPackageCurrentAssortment.length && courseDetail[0].assortment_type === 'course' && versionCode >= 850) {
            const [
                timetableData,
                faqsData,
                teachersData,
            ] = await Promise.all([
                CourseMysqlV2.getTimetableByAssortment(db.mysql.read, assortmentId),
                CourseMysqlV2.getFAQsByAssortment(db.mysql.read, assortmentId, locale === 'hi' ? locale : 'en'),
                CourseMysqlV2.getTeachersByAssortmentId(db.mysql.read, assortmentId),
            ]);
            assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [assortmentId], studentID, false, xAuthToken);
            widgets.push(CourseHelper.getPrePurchaseCourseInfo(courseDetail, assortmentPriceMapping, locale));
            const banner = {
                type: 'promo_list',
                data: {
                    auto_scroll_time_in_sec: autoScrollTime,
                    items: [],
                    ratio: '5:1',
                },
            };
            banner.data.items = await CourseHelper.getBanners(db, assortmentId, banner.data.items, paymentCardState.isVip);
            const referralBanner = await CourseMysqlV2.checkForReferralBanner(db.mysql.read, studentID);
            if (['9', '10', '11', '12', '13', '14'].includes(studentClass) && referralBanner && referralBanner.length > 0 && moment().diff(moment(referralBanner[0].created_at), 'days') <= 7 && referralBanner[0].referrer_student_id % 2 == 0) {
                banner.data.items.unshift({
                    id: 'REFERRAL_PAYTM',
                    image_url: liveclassData.referralPaytmCourseDetailsBanner,
                    deeplink: `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentId].package_variant}`,
                });
            } else if (+studentClass === 14) {
                let bannerId = liveclassData.exampurAssortmentBanners[assortmentId];
                if (bannerId) {
                    bannerId = locale === 'hi' ? bannerId.hi : bannerId.en;
                    const bannerData = await CourseMysqlV2.getBannersFromId(db.mysql.read, [bannerId]);
                    if (bannerData.length) {
                        banner.data.items.unshift({
                            id: bannerData[0].id,
                            image_url: bannerData[0].image_url,
                            deeplink: `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentId].package_variant}`,
                        });
                    }
                }
            }
            if (banner.data.items.length) {
                widgets.push(banner);
            }
            const courseFeatures = await CourseHelper.getPrePurchaseCourseFeatures(db, locale, assortmentId, false);
            widgets.push(courseFeatures);
            const emiWidget = await CourseHelper.getPrePurchaseCourseEmiDetails(db, config, assortmentPriceMapping, assortmentId, locale);
            if (emiWidget) {
                widgets.push(emiWidget);
            }
            if (faqsData.length) {
                widgets.push(CourseHelper.getPrePurchaseCourseFAQs(faqsData, locale));
            }
            if (timetableData.length) {
                widgets.push(CourseHelper.getPrePurchaseCourseTimetable(timetableData, locale));
            }
            if (teachersData.length) {
                widgets.push(CourseHelper.getPrePurchaseCourseTeachers(teachersData, locale));
            }
            const sch = '';
            const demoVideo = await CourseHelper.getCourseDemoVideoData(db, config, courseDetail, checkTrialEligibility, locale, assortmentPriceMapping, sch);
            if (demoVideo.qid) {
                const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, demoVideo.qid);
                if (answerData.length) {
                    const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideo.qid, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
                    demoVideo.video_resources = videoResources;
                }
            }
            resData.demo_video = demoVideo;
            resData.extra_widgets = widgets;
        } else {
            let allAssortments = await CourseRedis.getAllAssortments(db.redis.read, assortmentId, studentClass);
            allAssortments = JSON.parse(allAssortments);
            if (!allAssortments || !allAssortments.totalAssortments || !allAssortments.assortmentList) {
                allAssortments = await CourseHelper.getAllAssortments(db, [parseInt(assortmentId)], studentClass);
                CourseRedis.setAllAssortments(db.redis.write, assortmentId, studentClass, allAssortments);
            }
            const arr = allAssortments.assortmentList;
            allAssortments = allAssortments.totalAssortments;
            if (arr.indexOf(assortmentId) < 0) {
                arr.push(parseInt(assortmentId));
            }
            const batchID = userPackageCurrentAssortment.length ? userPackageCurrentAssortment[0].batch_id : 1;
            const now = moment().add(4, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:00:00');
            const end = moment().add(6, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:00:00');
            const allfutureAssortments = await CourseMysqlV2.getAllFutureAssortments(db.mysql.read, now.toString(), end.toString());
            const requiredFutureAssortments = [parseInt(assortmentId)];
            for (let i = 0; i < allfutureAssortments.length; i++) {
                if (arr.indexOf(allfutureAssortments[i].assortment_id) >= 0) {
                    requiredFutureAssortments.push(allfutureAssortments[i].assortment_id);
                }
            }
            const pastAssortments = arr.filter((n) => !requiredFutureAssortments.includes(n));
            if (!pastAssortments.length) {
                pastAssortments.push(parseInt(assortmentId));
            }
            if (allAssortments.indexOf(assortmentId) < 0) {
                allAssortments.push(parseInt(assortmentId));
            }
            const flagData = { xAuthToken, body: { capabilities: { lc_course_video_order: {} } } };
            const [
                data,
                recent,
                // upcoming,
                topics,
                notes,
                previousYears,
                studentProgress,
                otherStudentsProgress,
                nudge,
                flagrResponse,
            ] = await Promise.all([
                CourseContainer.getLiveSectionFromAssortment(db, assortmentId, requiredFutureAssortments, subject, studentClass, batchID),
                CourseContainer.getResourceDetailsFromAssortmentId(db, pastAssortments, limit, offset, subject, studentClass, assortmentId, batchID),
                // CourseContainer.getUpcomingResourceDetailsFromAssortmentId(db, arr, limit, offset, subject, studentClass, assortmentId),
                CourseMysqlV2.getTopicListFromAssortment(db.mysql.read, arr, 5, offset, subject, studentClass),
                CourseContainer.getNotesFromAssortmentId(db, arr, limit, offset, subject, null, studentClass, assortmentId, batchID),
                CourseContainer.getNotesFromAssortmentId(db, arr, limit, offset, subject, 'Previous Year Papers', studentClass, assortmentId, batchID),
                CourseMysqlV2.getStudentAssortmentProgress(db.mysql.read, studentID, assortmentId),
                CourseMysqlV2.getOtherStudentsAssortmentProgress(db.mysql.read, studentID, assortmentId),
                NudgeMysql.getByEventAndResourceId(db.mysql.read, event, studentClass, assortmentId),
                UtilityFlagr.getFlagrResp(flagData),
            ]);
            const tabDetails = [];
            tabDetails.push(recent.length);
            tabDetails.push(requiredFutureAssortments.length - 1);
            const topicsLength = (topics.length === 0 || topics.length === 1) ? 0 : topics.length;
            tabDetails.push(topicsLength);
            tabDetails.push(previousYears.length);
            tabDetails.push(notes.length);
            if (courseDetail.length && versionCode > 789 && courseDetail[0].assortment_type === 'course') {
                tabDetails.push(!courseDetail[0].is_free);
            }
            const studentEmiPackageAssortments = await getEmiPackageAssortments(db, activeSubs, studentClass, studentID);
            paymentCardState.emiDialog = studentEmiPackageAssortments.indexOf(parseInt(assortmentId)) >= 0;
            const currentTime = moment().add(5, 'hours').add(30, 'minutes');
            widgets.push(LiveclassHelperLocal.getCourseInfo(courseDetail, config));
            if (paymentCardState.isVip) {
                const paymentHistory = userPackageCurrentAssortment;
                if (paymentHistory.length && paymentHistory.amount > 0) {
                    widgets.push({
                        type: 'purchase_history',
                        data: {
                            title: `Purchased on ${moment(paymentHistory[0].purchase_date).format('Do MMM')}`,
                            link_text: 'Payment History',
                            deeplink: '',
                        },
                    });
                    const progressBar = await LiveclassHelperLocal.getProgressCarousel(db, studentProgress, otherStudentsProgress, courseDetail);
                    widgets.push(progressBar);
                } else if (paymentHistory.length && paymentHistory[0].amount === -1 && paymentHistory[0].end_date > currentTime) {
                    isTrial = true;
                    widgets.push(CourseHelper.getTrialWidget(assortmentId, true, paymentHistory[0].end_date, null, studentClass, locale));
                }
            } else if (!checkTrialEligibility.length && !courseDetail[0].is_free && _.includes(['course', 'class'], courseDetail[0].assortment_type)) {
                if (versionCode > 845) {
                    if (typeof flagrResponse !== 'undefined' && typeof flagrResponse.lc_course_trial_buynow !== 'undefined' && typeof flagrResponse.lc_course_trial_buynow.payload !== 'undefined' && flagrResponse.lc_course_trial_buynow.payload.enabled) {
                        const deeplink = `doubtnutapp://vip?assortment_id=${assortmentId}`;
                        widgets.push(CourseHelper.getTrialWidget(assortmentId, false, null, deeplink, studentClass, locale));
                    } else if (typeof flagrResponse !== 'undefined' && typeof flagrResponse.lc_course_trial_buynow !== 'undefined' && flagrResponse.lc_course_trial_buynow.enabled) {
                        widgets.push(CourseHelper.getTrialWidget(assortmentId, false, null, null, studentClass, locale));
                    }
                } else {
                    widgets.push(CourseHelper.getTrialWidget(assortmentId, false, null, null, null, locale));
                }
            }
            widgets.push(await LiveclassHelperLocal.getSubjectFilters(db, arr, assortmentId, studentClass));

            // a/b on recent and upcoming classes
            let liveSectionData = [];
            const tomorrow = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
                .startOf('day');

            if (data.length) {
                liveSectionData = data.filter((e) => moment(e.live_at) < tomorrow);
            }
            let liveSectionTitle = (locale === 'hi') ? 'लाइव और आगामी वीडियो' : 'Live And Upcoming Lectures';
            let paidAssortments = requiredFutureAssortments;

            // for recent classes data
            if (courseDetail[0].parent === 4) {
                liveSectionData = await CourseMysqlV2.getFreeResourceDetailsFromAssortmentId(db.mysql.read, assortmentId, studentClass, 0);
                liveSectionTitle = (locale === 'hi') ? 'हाल के वीडियो' : 'Recent Lectures';
            } else if (typeof flagrResponse !== 'undefined' && typeof flagrResponse.lc_course_video_order !== 'undefined' && typeof flagrResponse.lc_course_video_order.payload !== 'undefined' && flagrResponse.lc_course_video_order.payload.enabled) {
                paidAssortments = [];
                liveSectionData = await CourseContainer.getLiveSectionFromAssortmentHome(db, assortmentId, arr, studentClass, subject);
                liveSectionData.forEach((e) => {
                    if (!e.is_free) {
                        paidAssortments.push(e.assortment_id);
                    }
                });
                liveSectionTitle = (locale === 'hi') ? 'लाइव और हाल के वीडियो' : 'Live And Recent Lectures';
            }
            paidAssortments.push(assortmentId);
            if (courseDetail[0].parent === 4) {
                paidAssortments.push(138829);
            }
            assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, paidAssortments, studentID, false, xAuthToken);
            const result = await CourseHelper.getCoursePageResponse({
                studentPackageAssortments, db, config, data: liveSectionData, title: liveSectionTitle, assortmentPriceMapping, versionCode, paymentCardState,
            });
            if (result.data.items.length) {
                widgets.push(result);
            }

            const tabsData = CourseHelper.getCourseTabs(tabDetails, locale);
            resData = {
                widgets,
                tabs: tabsData,
            };
            resData.is_trial = isTrial;
            resData.chat_header = courseDetail[0].display_name ? courseDetail[0].display_name : '';
            if (courseDetail[0] && !courseDetail[0].is_free) {
                const bannerData = await LiveclassHelperLocal.getBannersData(courseDetail, activeSubs, locale, config, paymentCardState.isVip, studentClass, db);
                if (bannerData.data.items.length) {
                    resData.widgets.push(bannerData);
                }

                if (nudge.length) {
                    resData.nudge_id = nudge[0].id;
                    resData.is_show = true;
                    resData.count = nudge[0].count;
                }
            }
        }
        let currentAssortmentEmi = [];
        if (activeSubs.length) {
            currentAssortmentEmi = activeSubs.filter((e) => e.assortment_id == assortmentId);
        }
        if (!courseDetail[0].is_free && (!paymentCardState.isVip || (paymentCardState.isVip && isTrial)) && !(currentAssortmentEmi.length && !currentAssortmentEmi[currentAssortmentEmi.length - 1].is_last)) {
            const buyButton = await CourseHelper.getBuyButton(db, assortmentPriceMapping, courseDetail[0].parent === 4 ? 138829 : assortmentId, versionCode, locale, courseDetail[0].assortment_type, gotCoupon, 'explore');
            widgets[0].data.description = courseDetail[0].parent === 4 ? widgets[0].data.description : buyButton.description;
            resData.buy_button = buyButton;
            if (_.includes(['course', 'class'], courseDetail[0].assortment_type) && (checkTrialEligibility.length || versionCode < 803)) {
                resData.call_data = {
                    title: (locale === 'hi') ? 'हमें कॉल करें' : 'Call us',
                    number: '01247158250',
                };
            }
        }
        let shareableMessage;
        const competitive = ['IIT JEE', 'IIT JEE | NEET', 'NDA', 'NEET'];
        if (courseDetail[0].is_free) {
            if (competitive.indexOf(courseDetail[0].category) !== -1) {
                shareableMessage = liveclassData.getShareMessageFree(courseDetail[0].category, courseDetail[0].meta_info);
            } else {
                shareableMessage = liveclassData.getShareMessageFree(courseDetail[0].display_name, courseDetail[0].meta_info);
            }
        } else if (!courseDetail[0].is_free) {
            if (competitive.indexOf(courseDetail[0].category) !== -1) {
                shareableMessage = liveclassData.getShareMessagePaid(courseDetail[0].category, courseDetail[0].meta_info);
            } else {
                shareableMessage = liveclassData.getShareMessagePaid(courseDetail[0].display_name, courseDetail[0].meta_info);
            }
        }
        resData.shareable_message = shareableMessage;
        if (courseDetail[0].meta_info === 'HINDI') {
            if (courseDetail[0].is_free) {
                resData.share_image = `${config.staticCDN}engagement_framework/1C8BE7C9-8F62-F8DC-275D-3A2FECC54332.webp`;
            } else if (!courseDetail[0].is_free) {
                resData.share_image = `${config.staticCDN}engagement_framework/331FEB53-7A38-1077-DED8-3AAFA8BC0F4C.webp`;
            }
        } else if (courseDetail[0].is_free) {
            resData.share_image = `${config.staticCDN}engagement_framework/3218303E-408B-6F68-29BE-4CF250EF208B.webp`;
        } else if (!courseDetail[0].is_free) {
            resData.share_image = `${config.staticCDN}engagement_framework/6010273F-BBBB-9208-83E4-08B2CA5BA8CD.webp`;
        }
        const coupon = await couponMysql.getInfoByStudentId(db.mysql.read, studentID);
        resData.feature_name = 'course_details';
        resData.campaign_id = 'CRS_SHARE_EARN';
        resData.channel = `CRS_DET500_${assortmentId}_${studentClass}`;
        const shareData = {
            student_class: `${studentClass}`,
            referrer_student_id: `${studentID}`,
        };
        if (typeof coupon[0] !== 'undefined' && !_.isNull(coupon[0].coupon_code)) {
            shareData.id = `${assortmentId}||${studentClass}||${coupon[0].coupon_code}`;
        } else {
            shareData.id = `${assortmentId}||${studentClass}`;
        }
        resData.control_params = shareData;
        const variantInfo = [];
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: resData,
        };
        if (_.get(flagrResponseByFlagKey, 'lc_course_trial_buynow.enabled', null)) {
            variantInfo.push({
                flag_name: 'lc_course_trial_buynow',
                variant_id: flagrResponseByFlagKey.lc_course_trial_buynow.variantId,
            });
        }
        if (_.get(flagrResponseByFlagKey, 'lc_course_video_order.enabled', null)) {
            variantInfo.push({
                flag_name: 'lc_course_video_order',
                variant_id: flagrResponseByFlagKey.lc_course_video_order.variantId,
            });
        }
        if (variantInfo.length) {
            responseData.meta.analytics = { variant_info: variantInfo };
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function courseTabDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const xAuthToken = req.headers['x-auth-token'];
        const { version_code: versionCode } = req.headers;
        const { student_id: studentID, locale } = req.user;
        let {
            assortment_id: assortmentId, studentClass, tab, subject,
        } = req.query;
        const classValue = assortmentId.split('||')[1];
        assortmentId = assortmentId.split('||')[0];
        if (!assortmentId) assortmentId = 148;
        const { page } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        if (typeof classValue !== 'undefined' && classValue) {
            studentClass = classValue;
        }

        if (assortmentId.includes('xxxx')) {
            const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentID);
            assortmentId = await CourseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, (assortmentId.split('_')[1]) ? assortmentId.split('_')[1] : locale);
        }
        const flagrResponse = await CourseHelper.resourcesToBundlePageExperiment(db, xAuthToken, studentID);
        let allAssortments = await CourseRedis.getAllAssortments(db.redis.read, assortmentId, studentClass);
        allAssortments = JSON.parse(allAssortments);
        if (!allAssortments || !allAssortments.totalAssortments || !allAssortments.assortmentList) {
            allAssortments = await CourseHelper.getAllAssortments(db, [parseInt(assortmentId)], studentClass);
            CourseRedis.setAllAssortments(db.redis.write, assortmentId, studentClass, allAssortments);
        }
        const arr = allAssortments.assortmentList;
        if (arr.indexOf(assortmentId) < 0) {
            arr.push(parseInt(assortmentId));
        }

        if (!subject) subject = 'ALL';
        if (!tab) tab = 'recent';

        const limit = 40;
        const offset = (page - 1) * 40;
        const [
            studentPackageList,
            emiPackageList,
            courseDetail,
        ] = await Promise.all([
            CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID),
            CourseMysqlV2.getUserEmiPackages(db.mysql.read, studentID),
            CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, [assortmentId], studentClass),
        ]);
        let studentPackageAssortments = [];
        let userPackageCurrentAssortment = [];
        let paymentCardState = {
            isVip: false,
        };
        if (_.find(studentPackageList, ['assortment_id', +assortmentId])) {
            userPackageCurrentAssortment.push(_.find(studentPackageList, ['assortment_id', +assortmentId]));
            paymentCardState = {
                isVip: true,
            };
        } else if (_.find(studentPackageList, ['assortment_id', 138829]) && courseDetail[0].parent === 4) {
            userPackageCurrentAssortment.push(_.find(studentPackageList, ['assortment_id', 138829]));
            paymentCardState = {
                isVip: true,
            };
        } else {
            studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);
            userPackageCurrentAssortment = studentPackageAssortments.filter((e) => e === parseInt(assortmentId));
            paymentCardState = {
                isVip: userPackageCurrentAssortment.length > 0,
            };
        }
        const batchID = userPackageCurrentAssortment.length ? userPackageCurrentAssortment[0].batch_id : 1;
        const studentEmiPackageAssortments = await getEmiPackageAssortments(db, emiPackageList, studentClass, studentID);

        let widgets = [];
        if (tab === 'recent') {
            const scheduleTypeData = await CourseMysqlV2.getScheduleType(db.mysql.read, arr[0]);
            const schedultType = scheduleTypeData.length ? scheduleTypeData[0].schedule_type : 'scheduled';
            const data = await CourseContainer.getResourceDetailsFromAssortmentId(db, arr, limit, offset, subject, studentClass, assortmentId, schedultType, batchID);
            const result = await CourseHelper.getRelatedLectures(data, config, studentPackageAssortments, studentEmiPackageAssortments, db, studentID, true, flagrResponse, versionCode, paymentCardState);
            widgets.push({ type: 'related_lecture', data: { bg_color: '#66e0eaff', items: result } });
        } else if (tab === 'upcoming') {
            const data = await CourseContainer.getUpcomingResourceDetailsFromAssortmentId(db, arr, limit, offset, subject, studentClass, assortmentId, batchID);
            const result = await CourseHelper.getRelatedLectures(data, config, studentPackageAssortments, studentEmiPackageAssortments, db, studentID, true, flagrResponse, versionCode, paymentCardState);
            widgets.push({ type: 'related_lecture', data: { bg_color: '#66e0eaff', items: result } });
        } else if (tab === 'previous_year_papers') {
            const data = await CourseContainer.getNotesFromAssortmentId(db, arr, limit, offset, subject, 'Previous Year Papers', studentClass, assortmentId);
            let result = CourseHelper.getNotesData(data, studentPackageAssortments, studentEmiPackageAssortments, flagrResponse, paymentCardState);
            result = _.groupBy(result, 'master_chapter');
            for (const key in result) {
                if ({}.hasOwnProperty.call(result, key)) {
                    widgets.push({ type: 'resource_notes', data: { title: `${key} - ${result[key][0].subject}`, items: result[key], showsearch: false } });
                }
            }
        } else if (tab === 'notes') {
            const { notes_type } = req.query;
            const filters = await LiveclassHelperLocal.getNotesFilters(notes_type, db, arr, subject, studentClass);
            if (+page === 1 && filters.data.items.length > 1) {
                widgets.push(filters);
            }
            const data = await CourseContainer.getNotesFromAssortmentId(db, arr, limit, offset, subject, notes_type, studentClass, assortmentId, batchID);
            let result = CourseHelper.getNotesData(data, studentPackageAssortments, studentEmiPackageAssortments, flagrResponse, paymentCardState);
            result = _.groupBy(result, 'master_chapter');
            for (const key in result) {
                if (result[key]) {
                    widgets.push({ type: 'resource_notes', data: { title: `${key} - ${result[key][0].subject}`, items: result[key], showsearch: false } });
                }
            }
        } else if (tab === 'topics') {
            const data = await CourseMysqlV2.getTopicListFromAssortment(db.mysql.read, arr, limit, offset, subject, studentClass);
            const result = await CourseHelper.getTopicsData(db, data);
            widgets.push({ type: 'course_topics', data: { items: result, showsearch: false } });
        }

        if ((widgets.length && widgets[0].data.items.length === 0) || widgets.length === 0) {
            if (+page === 0) {
                widgets = [
                    {
                        type: 'simple_text',
                        data: {
                            title: 'No Data Available.',
                        },
                    },
                ];
            } else {
                widgets = [];
            }
        }

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

async function generateAssortmentArray(db, carouselsData, studentClass, studentID, studentCcmData) {
    const assortmentIds = [];
    for (let i = 0; i < carouselsData.length; i++) {
        let arr = [];
        if (carouselsData[i].filters) {
            if (carouselsData[i].carousel_type === 'course_subject') {
                const filters = carouselsData[i].filters.split('|') ? carouselsData[i].filters.split('|') : carouselsData[i].filters;
                for (let j = 0; j < filters.length; j++) {
                    const sql = JSON.parse(filters[j]).query;
                    const result = await db.mysql.read.query(sql);
                    arr.push(result[0].assortment_id);
                }
            } else if (carouselsData[i].data_type === 'campaign_query') {
                const filters = JSON.parse(carouselsData[i].filters);
                const sql = filters.query;
                const result = await CourseContainer.getExploreCampaignCarouselData(db, sql, carouselsData[i].id);
                arr = result.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            } else {
                const filters = JSON.parse(carouselsData[i].filters);
                const sql = filters.query;
                const result = await db.mysql.read.query(sql);
                arr = result.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            }
            assortmentIds.push(arr);
        } else if (carouselsData[i].data_type === 'resources' && carouselsData[i].view_type === 'playlist') {
            const res = await CourseRedis.getPlaylistForEtoos(db.redis.read, studentID);
            if (!_.isNull(res)) {
                arr = JSON.parse(res);
                if (arr.length < 5) {
                    const relatedAssortments = await CourseMysqlV2.getRelatedVideosAssortmentsOfChapter(db.mysql.read, arr[arr.length - 1]);
                    const relatedArr = [];
                    relatedAssortments.map((e) => relatedArr.push(e.course_resource_id));
                    arr = [...arr, ...relatedArr];
                }
                assortmentIds.push(arr);
            } else {
                arr = await CourseHelper.getAllAssortments(db, carouselsData[i].assortment_list.split(','), studentClass);
                assortmentIds.push(arr.assortmentList);
            }
        } else if (carouselsData[i].data_type === 'resources' && carouselsData[i].view_type === 'recommended') {
            arr = await CourseRedis.getUserWatchedTopicsFromSRP(db.redis.read, studentID);
            if (!_.isNull(arr)) {
                assortmentIds.push(JSON.parse(arr));
            } else {
                assortmentIds.push([]);
            }
        } else if (carouselsData[i].data_type === 'resources' && carouselsData[i].view_type === 'live_classes') {
            arr = carouselsData[i].assortment_list.split(',');
            const iitNeetCourses = [];
            if (_.includes([11, 12, 13], +studentClass)) {
                const freeNeetCourses = _.find(studentCcmData, ['category', 'IIT JEE']) ? [] : await CourseContainer.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
                const freeIitCourses = _.find(studentCcmData, ['category', 'NEET']) ? [] : await CourseContainer.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
                if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
                    freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
                }
                if (_.find(studentCcmData, ['category', 'NEET'])) {
                    freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
                }
                if (!iitNeetCourses.length) {
                    freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
                    freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
                }
            }
            arr = [...arr, ...iitNeetCourses];
            assortmentIds.push(arr);
        } else if (carouselsData[i].data_type === 'resources') {
            arr = await CourseHelper.getAllAssortments(db, carouselsData[i].assortment_list.split(','), studentClass);
            assortmentIds.push(arr.assortmentList);
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'trending_exam') {
            let neetSelected = false;
            if (_.find(studentCcmData, ['category', 'NEET'])) {
                neetSelected = true;
                carouselsData[i].title = carouselsData[i].locale === 'hi' ? 'ख़ास NEET छात्रों के लिए' : 'Popular with NEET Students';
                carouselsData[i].see_all_category = 'NEET_CT';
                arr = await CourseRedis.getTrendingCourses(db.redis.read, `${studentClass}_NEET`, 0, 9);
            }
            if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
                carouselsData[i].title = carouselsData[i].locale === 'hi' ? 'ख़ास IIT JEE छात्रों के लिए' : 'Popular with IIT JEE Students';
                if (neetSelected) {
                    carouselsData[i].title = carouselsData[i].locale === 'hi' ? 'ख़ास IIT JEE & NEET छात्रों के लिए' : 'Popular with IIT JEE & NEET Students';
                }
                carouselsData[i].see_all_category = 'IIT JEE_CT';
                arr = [...arr, ...await CourseRedis.getTrendingCourses(db.redis.read, `${studentClass}_IIT JEE`, 0, 9)];
            }
            assortmentIds.push(arr);
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'trending_board') {
            if (studentCcmData.length) {
                carouselsData[i].see_all_category = studentCcmData[0].category;
                carouselsData[i].title = carouselsData[i].locale === 'hi' ? `ख़ास ${studentCcmData[0].category} छात्रों के लिए` : `Popular with ${studentCcmData[0].category} Students`;
                arr = await CourseRedis.getTrendingCourses(db.redis.read, `${studentClass}_${studentCcmData[0].category}`, 0, 9);
            }
            assortmentIds.push(arr);
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'recently_sold') {
            const userLocation = await CourseMysqlV2.getStudentLocation(db.mysql.read, studentID);
            if (userLocation.length && userLocation[0].state) {
                carouselsData[i].title = carouselsData[i].title.replace('$', userLocation[0].state);
                arr = await CourseRedis.getTrendingCourses(db.redis.read, `${studentClass}_location_${userLocation[0].state}`, 0, 9);
            }
            assortmentIds.push(arr);
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'continue_buying') {
            arr = await CourseRedis.getContineBuyingCoursesData(db.redis.read, studentID);
            if (arr) {
                arr = JSON.parse(arr);
                assortmentIds.push(arr);
            } else {
                assortmentIds.push([]);
            }
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'latest_courses') {
            const courseList = await CourseContainer.getLatestLauncedCourses(db, studentClass, carouselsData[i].locale, studentID);
            courseList.forEach((item) => arr.push(item.assortment_id));
            assortmentIds.push(arr);
        } else {
            arr = carouselsData[i].assortment_list;
            assortmentIds.push(arr.split(','));
        }
    }
    return assortmentIds;
}

async function categoryList({
    db, category, studentClass, filters = [], studentID, page, locale, studentCategoryData, xAuthToken,
}) {
    try {
        let filterData = [];
        let defaultData = [];
        const studentCategory = studentCategoryData.length ? studentCategoryData[0].category : 'State Boards';
        const [
            filterDataByLocaleCategory,
            filterDataByLocale,
            filterDataEnCategory,
            filterDataEn,
        ] = await Promise.all([
            CourseMysqlV2.getDefaultDataForCategory(db.mysql.read, category, studentClass, locale),
            CourseMysqlV2.getDefaultDataForCategory(db.mysql.read, null, studentClass, locale),
            CourseMysqlV2.getDefaultDataForCategory(db.mysql.read, category, studentClass, 'en'),
            CourseMysqlV2.getDefaultDataForCategory(db.mysql.read, null, studentClass, 'en'),
        ]);
        if (filterDataByLocaleCategory.length) {
            defaultData = filterDataByLocaleCategory;
        } else if (filterDataEnCategory.length) {
            defaultData = filterDataEnCategory;
        } else if (filterDataByLocale.length) {
            defaultData = filterDataByLocale;
        } else {
            defaultData = filterDataEn;
        }
        if (!filters.length) {
            filterData = defaultData;
        } else {
            filterData = await CourseMysqlV2.getFilterDataForCategory(db.mysql.read, filters);
        }
        let assortmentPriceMapping = {};
        let result = [];
        let assortmentList = [];
        let free = false;
        let desc = false;
        const subject = filterData.filter((e) => e.master_filter == 'Subject');
        let content = filterData.filter((e) => e.master_filter == 'Content-Type');
        let sort = filterData.filter((e) => e.master_filter == 'Sort By');

        if (!content.length) {
            filterData = defaultData;
            content = filterData.filter((e) => e.master_filter == 'Content-Type');
        }
        if (!sort.length) {
            sort = defaultData.filter((e) => e.master_filter == 'Sort By');
        }
        if (sort.length) {
            if (sort[0].child_filter_id == 'free') {
                free = true;
            } else if (sort[0].child_filter_id == 'paid-desc') {
                desc = true;
            }
        }
        if (content[0].child_filter_id.includes('course')) {
            result = await CourseMysqlV2.getCoursesFromCategoryType(db.mysql.read, category, studentCategory, free, studentClass, (page - 1) * 20);
        } else if (content[0].child_filter_id.includes('chapter')) {
            if (subject.length) {
                result = await CourseMysqlV2.getChaptersFromCategoryType(db.mysql.read, category, studentCategory, subject[0].child_filter_id, free, studentClass, (page - 1) * 20);
            } else {
                result = await CourseMysqlV2.getChaptersFromCategoryType(db.mysql.read, category, studentCategory, null, free, studentClass, (page - 1) * 20);
            }
        } else if (content[0].child_filter_id.includes('subject')) {
            if (subject.length) {
                result = await CourseMysqlV2.getSubjectFromCategoryType(db.mysql.read, category, studentCategory, subject[0].child_filter_id, free, studentClass, (page - 1) * 20);
            } else {
                result = await CourseMysqlV2.getSubjectFromCategoryType(db.mysql.read, category, studentCategory, null, free, studentClass, (page - 1) * 20);
            }
        } else {
            let resourceTypes = [];
            let assortmentType = 'resource_video';
            if (content[0].child_filter_id.includes('video')) {
                resourceTypes = [1, 4, 8];
            } else if (content[0].child_filter_id.includes('pdf')) {
                resourceTypes = [2, 3];
                assortmentType = 'resource_pdf';
            } else {
                resourceTypes = [9];
                assortmentType = 'resource_test';
            }
            let arr = [];
            if (content[0].assortment_id) {
                arr = await CourseHelper.getAllAssortments(db, content[0].assortment_id.split(','), studentClass);
                assortmentList = arr.assortmentList;
            } else if (subject.length) {
                if (category === 'others') {
                    arr = await CourseMysqlV2.getChildAssortmentsExcludingStudentCategory(db.mysql.read, studentCategory, studentClass, assortmentType, subject[0].child_filter_id, free, desc, (page - 1) * 50);
                    assortmentList = arr.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
                } else {
                    arr = await CourseContainer.getChildAssortmentsByResourceType(db, category, studentClass, assortmentType, subject[0].child_filter_id, free, desc, (page - 1) * 50);
                    assortmentList = arr.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
                }
            } else if (category === 'others') {
                arr = await CourseMysqlV2.getChildAssortmentsExcludingStudentCategory(db.mysql.read, studentCategory, studentClass, assortmentType, null, free, desc, (page - 1) * 50);
                assortmentList = arr.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            } else {
                arr = await CourseContainer.getChildAssortmentsByResourceType(db, category, studentClass, assortmentType, null, free, desc, (page - 1) * 50);
                assortmentList = arr.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            }

            if (assortmentList.length) {
                if (subject.length && content[0].assortment_id) {
                    result = await CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, assortmentList, resourceTypes, studentClass, subject[0].child_filter_id, (page - 1) * 20);
                } else if (content[0].assortment_id) {
                    result = await CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, assortmentList, resourceTypes, studentClass, null, (page - 1) * 20);
                } else {
                    result = await CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, assortmentList, resourceTypes, studentClass, null, 0);
                }
            }
        }
        for (let i = 0; i < result.length; i++) {
            const arr = result.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            assortmentList = arr;
        }

        if (assortmentList.length) {
            assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, false, xAuthToken);
        }

        return { result, assortmentPriceMapping, sort };
    } catch (e) {
        throw new Error(e);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function getTeachersCarousel(db, studentID, locale, isDropper, studentClass, studentCcmData) {
    try {
        let teacherByCCM = [];
        let subscribedTeachersIds = await StudentContainer.getSubscribedTeachersData(db, studentID);
        subscribedTeachersIds = subscribedTeachersIds.filter((thing, index, self) => index === self.findIndex((t) => (
            t.teacher_id === thing.teacher_id
        )));
        const promises = [];
        for (let i = 0; i < subscribedTeachersIds.length; i++) {
            promises.push(StudentContainer.getTeacherData(db, subscribedTeachersIds[i].teacher_id));
        }
        const setteledPromise = await Promise.allSettled(promises);
        let subscribedTeachersData = setteledPromise.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        subscribedTeachersData = subscribedTeachersData.filter((value) => !_.isEmpty(value) && !_.isNull(value));
        subscribedTeachersData = _.flatten(subscribedTeachersData);
        const subscribedTeachers = [];
        if (studentClass == '12' && isDropper) {
            studentClass = '13';
        }
        subscribedTeachersData.forEach((item) => subscribedTeachers.push(item.teacher_id));
        const localeTemp = locale === 'hi' ? 'Hindi Medium' : 'English Medium';
        if (_.includes(['6', '7', '8', '14'], studentClass)) {
            const teacherByLocale = await TeacherContainer.getTeacherByClassLocale(db, studentClass, locale);
            const groupTeacherByLocale = _.groupBy(teacherByLocale, 'teacher_id');
            for (const key in groupTeacherByLocale) {
                if ({}.hasOwnProperty.call(groupTeacherByLocale, key)) {
                    let subject = [];
                    for (let i = 0; i < groupTeacherByLocale[key].length; i++) {
                        if (groupTeacherByLocale[key][i].subjects !== null) {
                            const temp = groupTeacherByLocale[key][i].subjects.split(',');
                            subject.push(temp);
                        }
                    }
                    subject = subject.flat();
                    subject = [...new Set(subject)];
                    subject = subject.splice(0, 3);
                    subject = subject.join(',');
                    groupTeacherByLocale[key][0].subject = subject;
                    groupTeacherByLocale[key][0].exam = localeTemp;
                    teacherByCCM.push(groupTeacherByLocale[key][0]);
                }
            }
        } else {
            const ccmIdArrayExam = [];
            const ccmIdArrayBoard = [];
            const studentCcmDataExam = studentCcmData.filter((item) => item.ccm_category === 'exam' || item.ccm_category === 'other-exam');
            const studentCcmDataBoard = studentCcmData.filter((item) => item.ccm_category === 'board' || item.ccm_category === 'other-board');
            studentCcmDataExam.forEach((item) => ccmIdArrayExam.push(item.id));
            studentCcmDataBoard.forEach((item) => ccmIdArrayBoard.push(item.id));
            const workerTeacherByCCMExam = [];
            const workerTeacherByCCMBoard = [];
            for (let i = 0; i < ccmIdArrayExam.length; i++) {
                workerTeacherByCCMExam.push(TeacherContainer.getTeacherByCCMExam(db, ccmIdArrayExam[i], studentClass));
            }
            for (let i = 0; i < ccmIdArrayBoard.length; i++) {
                workerTeacherByCCMBoard.push(TeacherContainer.getTeacherByCCMBoard(db, ccmIdArrayBoard[i], studentClass));
            }
            let teacherByCCMBoard = await Promise.all(workerTeacherByCCMBoard);
            let teacherByCCMExam = await Promise.all(workerTeacherByCCMExam);
            teacherByCCMBoard = teacherByCCMBoard.flat(1);
            teacherByCCMExam = teacherByCCMExam.flat(1);
            teacherByCCMBoard = teacherByCCMBoard.filter((item) => item !== null || item !== undefined);
            teacherByCCMExam = teacherByCCMExam.filter((item) => item !== null || item !== undefined);
            teacherByCCMBoard = teacherByCCMBoard.concat(teacherByCCMExam);
            const groupTeacherByCCMBoard = _.groupBy(teacherByCCMBoard, 'teacher_id');
            const finalTeacherByCCMBoard = [];
            for (const key in groupTeacherByCCMBoard) {
                if ({}.hasOwnProperty.call(groupTeacherByCCMBoard, key)) {
                    let exam = [];
                    let subject = [];
                    for (let i = 0; i < groupTeacherByCCMBoard[key].length; i++) {
                        if (groupTeacherByCCMBoard[key][i].board && groupTeacherByCCMBoard[key][i].board !== null) {
                            const temp1 = groupTeacherByCCMBoard[key][i].board.split(',');
                            exam.push(temp1);
                        }
                        if (groupTeacherByCCMBoard[key][i].exam && groupTeacherByCCMBoard[key][i].exam !== null) {
                            const temp2 = groupTeacherByCCMBoard[key][i].exam.split(',');
                            exam.push(temp2);
                        }
                        if (groupTeacherByCCMBoard[key][i].subjects !== null) {
                            const temp3 = groupTeacherByCCMBoard[key][i].subjects.split(',');
                            subject.push(temp3);
                        }
                    }
                    exam = exam.flat();
                    exam = [...new Set(exam)];
                    subject = subject.flat();
                    subject = [...new Set(subject)];
                    subject = subject.splice(0, 3);
                    subject = subject.join(',');
                    groupTeacherByCCMBoard[key][0].subject = subject;
                    let examNew = [];
                    for (let i = 0; i < exam.length; i++) {
                        const index = studentCcmData.findIndex((item) => item.id == exam[i]);
                        if (index !== -1) {
                            examNew.push(studentCcmData[index].course);
                        }
                    }
                    examNew = examNew.splice(0, 3);
                    if (!_.isEmpty(examNew)) {
                        groupTeacherByCCMBoard[key][0].exam = examNew.join(', ');
                    } else {
                        groupTeacherByCCMBoard[key][0].exam = localeTemp;
                    }
                    finalTeacherByCCMBoard.push(groupTeacherByCCMBoard[key][0]);
                }
            }
            teacherByCCM = finalTeacherByCCMBoard;
        }
        teacherByCCM = teacherByCCM.filter((item) => !subscribedTeachers.includes(item.teacher_id));
        teacherByCCM = teacherByCCM.filter((thing, index, self) => index === self.findIndex((t) => (
            t.teacher_id === thing.teacher_id
        )));
        let item = [];
        const subsTotal = await CourseHelper.getTeacherSubscription({ db, teacherList: teacherByCCM, isInternal: false });
        for (let i = 0; i < teacherByCCM.length; i++) {
            let userName;
            if (teacherByCCM[i].fname !== null && teacherByCCM[i].lname !== null) {
                userName = `${teacherByCCM[i].fname} ${teacherByCCM[i].lname}`;
            } else {
                userName = `${teacherByCCM[i].fname}`;
            }
            const last = parseInt(teacherByCCM[i].teacher_id.toString().slice(-3));
            const hours = parseInt(42 + last / 10);
            const years = parseInt(5 + last / 100);
            const bgArr = Data.teacherChannelVideoBackgroundArr;
            item.push({
                id: teacherByCCM[i].teacher_id,
                name: userName,
                // image_url: teacherByCCM[i].img_url ? Utility.convertoWebP(teacherByCCM[i].img_url) : Data.teacherDefaultImage,
                image_url: teacherByCCM[i].img_url ? teacherByCCM[i].img_url : Data.teacherDefaultImage,
                subscriber: !_.isNull(subsTotal) && !_.isEmpty(subsTotal) && subsTotal ? `${subsTotal[i]}` : '0',
                hours_taught: `${hours}Hr`,
                experience: teacherByCCM[i].year_of_experience ? `${teacherByCCM[i].year_of_experience} Years` : `${years} Years`,
                button_text: 'Subscribe',
                deeplink: `doubtnutapp://teacher_channel?teacher_id=${teacherByCCM[i].teacher_id}&type=external`,
                background_color: bgArr[i % 5],
                tag: teacherByCCM[i].exam ? teacherByCCM[i].exam : '',
                subjects: teacherByCCM[i].subject ? teacherByCCM[i].subject : '',
                card_width: '2.0',
                card_ratio: '16:19',
            });
        }
        item = shuffleArray(item);
        const dataz = {
            title: locale === 'hi' ? 'लोकल शिक्षक अब डाउटनट पर' : 'Local Teachers now on Doubtnut',
            items: item,
        };
        if (dataz.items.length !== 0) {
            return {
                widget_type: 'teacher_channel_list',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                widget_data: dataz,
            };
        }
        return [];
    } catch (e) {
        throw new Error(e);
    }
}

async function home(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const xAuthToken = req.headers['x-auth-token'];
        const { student_id: studentID } = req.user;
        let { locale } = req.user;
        const { page } = req.query;
        let { studentClass, filters_list: filters, category } = req.query;
        const { version_code: versionCode, has_upi: hasUPI } = req.headers;
        const { isDropper } = req.user;
        const couponCode = [];
        if (locale !== 'hi') locale = 'en';
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        if (typeof filters === 'string') {
            filters = filters.split(',');
        }
        const [
            studentCcmData,
            internalSubscriptions,
            carouselsDataByLocale,
            allCategories,
            studentPackageList,
            emiPackageList,
            flagrResponse,
            expiredPackages,
            // couponAndUserData,
            campaignData,
        ] = await Promise.all([
            ClassCourseMappingContainer.getStudentsExamsBoardsData(db, studentID),
            CourseMysqlV2.getInternalSubscriptions(db.mysql.read, studentID),
            CourseContainer.getCaraouselDataLandingPage(db, studentClass, locale, category, versionCode),
            CourseMysqlV2.getDistinctCategories(db.mysql.read, studentClass),
            CourseContainer.getUserActivePackages(db, studentID),
            CourseMysqlV2.getUserEmiPackages(db.mysql.read, studentID),
            CourseHelper.getFlagrResponseByFlagKey(xAuthToken, ['explore_page_top_icons', 'explore_page_revamp_campaign']),
            CourseContainer.getUserExpiredPackagesIncludingTrial(db, studentID),
            // (studentID && versionCode >= 1012) ? referralFlowHelper.getRefererSidAndCouponCode(db, studentID) : false,
            req.user.campaign ? BranchContainer.getByCampaign(db, req.user.campaign) : [],
        ]);

        for (let i = 0; i < studentCcmData.length; i++) {
            studentCcmData[i].ccm_category = studentCcmData[i].category;
        }
        if (versionCode > 912) {
            let flagrResp;
            const exp = 'calling_card_explore_page';
            let f = await CourseContainer.getFlagrResp(db, exp, studentID);
            if (!_.isEmpty(f)) {
                flagrResp = f;
                if (_.get(flagrResp, 'calling_card_explore_page.payload.enabled', false)) {
                    CourseRedis.setCallingCardWidgetData(db.redis.write, studentID, {
                        subtitle: '',
                        image_url: '',
                        assortmentId: '',
                        title: 'Course dhundhne mein ho rhi dikkat ?',
                    });
                }
            } else {
                f = {
                    exp: {
                        payload: {
                            enabled: true,
                        },
                    },
                };
                flagrResp = f;
            }
        }
        const assortmentFlagrResponse = {};
        let studentCourseOrClassSubcriptionDetails = studentPackageList.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'class' || (versionCode >= 893 && item.assortment_type === 'subject'));
        if (versionCode >= 893 && !category) {
            const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            let filterExpiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30 && (versionCode > 966 || item.amount > -1));
            filterExpiredPackages = filterExpiredPackages.filter((item) => !_.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', item.assortment_id]));
            studentCourseOrClassSubcriptionDetails = [...studentCourseOrClassSubcriptionDetails, ...filterExpiredPackages];
        }
        const finalCategory = CourseHelper.getCategoryByStudentCCM(studentCcmData);
        const newClpCategory = category;
        if (filters) {
            const others = [];
            for (let i = 0; i < filters.length; i++) {
                const isCategory = !(filters[i].substring(0, 2) === '$$') && filters[i] !== 'NA';
                // eslint-disable-next-line no-restricted-globals
                if (isNaN(filters[i]) && !isCategory && filters[i] !== 'NA') {
                    couponCode.push(filters[i].substring(2));
                } else if (isCategory) {
                    category = filters[i];
                    others.push(filters[i]);
                    // eslint-disable-next-line no-restricted-globals
                } else if (!isNaN(filters[i]) && filters[i] !== 'NA') {
                    others.push(filters[i]);
                }
            }
            filters = others;
        }
        if (couponCode.length > 0) {
            const data = {};
            data.student_id = studentID;
            data.coupon_code = couponCode[0];
            data.source = 'COURSE_LISTING';
            CourseMysqlV2.setPreAppliedReferralCode(db.mysql.write, data);
        }
        let usecampaignFlow = false;
        let priceFlow = false;
        let categoryFlow = false;
        if (req.user.campaign && !category) {
            const campaign = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Explore');
            if (!_.isEmpty(campaign) && _.get(flagrResponse, 'explore_page_revamp_campaign.payload.enabled1', false)) {
                usecampaignFlow = true;
            }
            if (!_.isEmpty(campaign) && _.get(flagrResponse, 'explore_page_revamp_campaign.payload.enabled2', false)) {
                priceFlow = true;
            }
            if (!_.isEmpty(campaign) && _.get(flagrResponse, 'explore_page_revamp_campaign.payload.enabled3', false)) {
                categoryFlow = true;
                category = 'xxxx';
            }
        }
        if ((category && category.includes('xxxx')) || categoryFlow) {
            const categoriesResult = _.get(studentCcmData, 'length', 0) ? await CourseContainer.getCategoriesFromCcmId(db, studentCcmData.map((item) => item.id)) : [];
            const categories = [];
            categoriesResult.forEach((item) => categories.push(item.category));
            const result = categories.length ? await CourseContainer.getCoursesForHomepageIcons(db, studentClass, categories, locale) : [];
            result.forEach((item, index) => {
                const categoryType = categoriesResult.filter((item1) => item.category === item1.category);
                if (categoryType.length > 0) {
                    result[index].category_type_1 = categoryType[0].category_type;
                } else {
                    result[index].category_type_1 = null;
                }
            });
            const boardCourses = result.filter((item) => item.category_type_1 === 'board');
            const examCourses = result.filter((item) => item.category_type_1 === 'exam');
            if (result.length > 0) {
                category = category.includes('board') && boardCourses.length && result.length ? boardCourses[0].category : _.get(examCourses, '[0].category', result[0].category);
            } else if (finalCategory) {
                category = finalCategory;
            } else if (+studentClass === 13) {
                category = 'IIT JEE';
            } else {
                category = +studentClass === 14 ? 'Defence' : liveclassData.examCategoryMapping.CBSE;
            }
        }

        const studentCategoryData = studentCcmData.filter((item) => !_.includes(['IIT JEE', 'NEET', 'CBSE Boards', 'NDA'], item.category));

        let studentPackageAssortments = category === 'Kota Classes' || internalSubscriptions.length || versionCode > 934 ? [] : await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);
        const studentEmiPackageAssortments = [];
        let widgets = [];
        let data = {};
        const listingFlagr = {};
        if (category && versionCode > 897 && !_.includes(['free_classes', 'Kota Classes'], category)) {
            if (newClpCategory && newClpCategory.includes('new_clp')) {
                if (newClpCategory === category) {
                    category = category.split('||')[1];
                }
                widgets = await CourseHelper.getResponseForNewCategoryListingPage({
                    db, studentClass, filters, category, assortmentFlagrResponse: listingFlagr, locale, config, studentID, versionCode, vipCourses: studentCourseOrClassSubcriptionDetails, page, studentCcmData, xAuthToken, pznElasticSearchInstance,
                });
            } else if (category.includes('xxxxx_en') || category.includes('xxxxx_hi')) {
                const categoryItems = category.split('_');
                if (+page === 1) {
                    const source = categoryItems.length > 3 ? `CATEGORY_LIST_DEEPLINK_${categoryItems[3]}` : 'CATEGORY_LIST_DEEPLINK';
                    // eslint-disable-next-line prefer-const
                    let { items, assortmentList } = await CourseHelper.getPaidAssortmentsData({
                        db,
                        studentClass: categoryItems[2] || studentClass,
                        config,
                        versionCode,
                        studentId: studentID,
                        studentLocale: category.includes('xxxxx_hi') ? 'hi' : 'en',
                        xAuthToken,
                        page: source,
                        pznElasticSearchInstance,
                    });
                    if (categoryItems.length > 4) {
                        const duration = categoryItems[4];
                        items = await LiveclassHelperLocal.filterCourseListByDuration(db, items, duration, assortmentList);
                    }
                    widgets.push({
                        type: 'widget_parent',
                        data: {
                            items,
                            scroll_direction: 'vertical',
                        },
                    });
                }
            } else if (category.includes('assortments')) {
                widgets = +page === 1 ? await LiveclassHelperLocal.getCoursesListByIdsForCLP({
                    db, category, studentID, locale, config, versionCode,
                }) : [];
            } else {
                widgets = await CourseHelper.getResponseForCategoryListingPage({
                    db, studentClass, filters, category, assortmentFlagrResponse: listingFlagr, locale, config, studentID, versionCode, vipCourses: studentCourseOrClassSubcriptionDetails, page, studentCcmData, campaignData,
                });
            }
            data.widgets = widgets;
        } else if (category && versionCode > 815 && !_.includes(['free_classes', 'Kota Classes'], category)) {
            const [
                categoryMasterFilters,
                categoryChildFiltersByLocaleCategory,
                categoryChildFiltersDefaultCategory,
                categoryChildFiltersByLocale,
                categoryChildFiltersDefault,
            ] = await Promise.all([
                CourseMysqlV2.getCategoryMasterFilters(db.mysql.read, studentClass, category),
                CourseMysqlV2.getCategoryChildFilters(db.mysql.read, studentClass, category, locale),
                CourseMysqlV2.getCategoryChildFilters(db.mysql.read, studentClass, category, 'en'),
                CourseMysqlV2.getCategoryChildFilters(db.mysql.read, studentClass, null, locale),
                CourseMysqlV2.getCategoryChildFilters(db.mysql.read, studentClass, null, 'en'),
            ]);
            let obj;
            if (category.includes('xxxxx_en') || category.includes('xxxxx_hi')) {
                const categoryCLass = category.split('_');
                if (+page === 1) {
                    const { items } = await CourseHelper.getPaidAssortmentsData({
                        db,
                        studentClass: categoryCLass[2] || studentClass,
                        config,
                        versionCode,
                        studentId: studentID,
                        studentLocale: category.includes('xxxxx_hi') ? 'hi' : 'en',
                        xAuthToken,
                        page: 'CATEGORY_LIST_DEEPLINK',
                        pznElasticSearchInstance,
                    });
                    obj = {
                        type: 'widget_parent',
                        data: {
                            items,
                        },
                    };
                } else {
                    obj = {
                        type: 'widget_parent',
                        data: {
                            items: [],
                        },
                    };
                }
            } else {
                let categoryChildFilters = [];
                if (categoryChildFiltersByLocaleCategory.length) {
                    categoryChildFilters = categoryChildFiltersByLocaleCategory;
                } else if (categoryChildFiltersDefaultCategory.length) {
                    categoryChildFilters = categoryChildFiltersDefaultCategory;
                } else if (categoryChildFiltersByLocale.length) {
                    categoryChildFilters = categoryChildFiltersByLocale;
                } else {
                    categoryChildFilters = categoryChildFiltersDefault;
                }
                if (page == 1) {
                    const courseCategories = [];
                    const studentCategory = studentCategoryData.length ? studentCategoryData[0].category : '';
                    const requiredCategories = allCategories.filter((item) => _.includes(['CBSE Boards', 'IIT JEE', 'NEET', studentCategory], item.id));
                    for (let i = 0; i < requiredCategories.length; i++) {
                        courseCategories.push({
                            id: requiredCategories[i].id,
                            child_filter: requiredCategories[i].id,
                            master_filter: 'Exam Name',
                        });
                    }
                    if (+studentClass !== 14) {
                        courseCategories.push({
                            id: 'others',
                            child_filter: 'Other Boards',
                            master_filter: 'Exam Name',
                        });
                    }
                    categoryMasterFilters.push({ master_filter: 'Exam Name' });
                    categoryChildFilters = [...categoryChildFilters, ...courseCategories];
                    widgets.push(CourseHelper.getCategoryFilters(categoryMasterFilters, categoryChildFilters, filters, versionCode));
                }
                const { result, assortmentPriceMapping, sort } = await categoryList({
                    db, category, studentClass, studentID, filters, page, locale, studentCategoryData, xAuthToken,
                });
                const caraouselData = {
                    title: '',
                    carousel_type: 'widget_parent',
                    view_type: 'past',
                    assortment_list: '0',
                };
                obj = await LiveclassHelperLocal.generateViewByResourceType({
                    db,
                    caraouselData,
                    config,
                    result,
                    versionCode,
                    studentID,
                    assortmentPriceMapping,
                    assortmentFlagrResponse,
                    studentPackageAssortments,
                    studentEmiPackageAssortments,
                    locale,
                    category,
                });
                if (sort.length && sort[0].child_filter_id == 'paid-asc') {
                    obj.data.items = _.orderBy(obj.data.items, ['data.display_price'], ['asc']);
                } else if (sort.length && sort[0].child_filter_id == 'paid-desc') {
                    obj.data.items = _.orderBy(obj.data.items, ['data.display_price'], ['desc']);
                }
            }

            obj.data.scroll_direction = 'vertical';
            if (obj.data.items.length) {
                widgets.push(obj);
            } else if (page == 1) {
                widgets.push({
                    type: 'simple_text',
                    data: {
                        title: 'No Data Available.',
                    },
                });
            }

            data = {
                widgets,
            };
        } else {
            let carouselsData = carouselsDataByLocale;
            carouselsData = carouselsData.filter((item) => item.min_version_code <= versionCode && item.max_version_code >= versionCode);
            if (usecampaignFlow || priceFlow) {
                if (page <= 1) {
                    carouselsData = carouselsData.filter((item) => item.data_type && item.data_type === 'campaign_query');
                } else {
                    carouselsData = [];
                }
            } else {
                carouselsData = carouselsData.filter((item) => item.data_type && item.data_type !== 'campaign_query');
                if (_.get(flagrResponse, 'explore_page_top_icons.payload.scroll', null) && versionCode > 950) {
                    carouselsData = carouselsData.filter((item) => item.carousel_type !== 'widget_explore_course_v2_circle' && item.carousel_type !== 'widget_course_v3');
                } else if (_.get(flagrResponse, 'explore_page_top_icons.payload.enabled', null) && versionCode > 950) {
                    carouselsData = carouselsData.filter((item) => item.carousel_type !== 'widget_explore_course_v2_square' && item.carousel_type !== 'widget_parent_tab2');
                } else {
                    carouselsData = carouselsData.filter((item) => item.carousel_type !== 'widget_explore_course_v2_circle' && item.carousel_type !== 'widget_explore_course_v2_square' && item.carousel_type !== 'widget_parent_tab2');
                }
                if (+page === 1 && !_.get(flagrResponse, 'explore_page_top_icons.payload.scroll', null)) {
                    carouselsData = carouselsData.slice(0, 7);
                } else if (!_.get(flagrResponse, 'explore_page_top_icons.payload.scroll', null)) {
                    carouselsData = carouselsData.slice(7);
                } else if (+page > 1) {
                    carouselsData = [];
                }
            }
            let doesUserHaveActiveCourses = false;
            const userActiveCODOrders = await PayMySQL.checkActiveCODOrderWithStudentId(db.mysql.read, studentID);
            if (studentCourseOrClassSubcriptionDetails.length) {
                const activeCoursesAssortmentIds = studentCourseOrClassSubcriptionDetails.map((item) => item.assortment_id);
                if (internalSubscriptions.length) {
                    studentPackageAssortments = activeCoursesAssortmentIds;
                }
                carouselsData = carouselsData.map((item) => {
                    if (item.view_type === 'my_courses') {
                        item.assortment_list = `${activeCoursesAssortmentIds.join(',')}`;
                    }
                    return item;
                });
                doesUserHaveActiveCourses = true;
            }
            const etoosSubscription = _.find(studentPackageList, ['assortment_id', 138829]);
            if (category === 'Kota Classes' && etoosSubscription && etoosSubscription.amount === -1) {
                carouselsData = carouselsData.filter((item) => item.is_vip === '-1' || !item.is_vip);
            } else if (category === 'Kota Classes' && etoosSubscription) {
                carouselsData = carouselsData.filter((item) => item.is_vip === '1' || !item.is_vip);
            } else if (category === 'Kota Classes') {
                carouselsData = carouselsData.filter((item) => item.is_vip === '0' || !item.is_vip);
            }
            if (!doesUserHaveActiveCourses) {
                carouselsData = carouselsData.filter((item) => item.view_type !== 'my_courses');
            }
            if (category === 'Kota Classes') {
                const isNEETSelected = _.find(studentCcmData, ['category', 'NEET']);
                let ccmRelatedCarousels = [];
                if (isNEETSelected) {
                    ccmRelatedCarousels = carouselsData.filter((e) => e.ccm_id === 12);
                    carouselsData = carouselsData.filter((e) => e.ccm_id !== 12);
                } else {
                    ccmRelatedCarousels = carouselsData.filter((e) => e.ccm_id === 11);
                    carouselsData = carouselsData.filter((e) => e.ccm_id !== 11);
                }
                if (ccmRelatedCarousels.length && !etoosSubscription) {
                    carouselsData = [...carouselsData.slice(0, 1), ...ccmRelatedCarousels, ...carouselsData.slice(1)];
                } else if (ccmRelatedCarousels.length) {
                    carouselsData = [...carouselsData.slice(0, 2), ...ccmRelatedCarousels, ...carouselsData.slice(2)];
                }
            }
            // make array of list of assortments depending on carousel type
            const assortmentIds = await generateAssortmentArray(db, carouselsData, studentClass, studentID, studentCcmData);
            const batchCheckAssortments = [];
            carouselsData.forEach((item) => {
                if (item.data_type === 'resources') {
                    batchCheckAssortments.push(item.assortment_list.split(',')[0]);
                }
            });
            let assortmentList = [];
            // get data from db for all carousels
            const resolvedPromises = await LiveclassHelperLocal.getDataByCarouselTypes({
                db, studentClass, config, versionCode, studentID, xAuthToken, locale, carouselsData, batchCheckAssortments, pznElasticSearchInstance, assortmentIds, category, studentCcmData, studentPackageList, allCategories, studentCategoryData,
            });
            let courseAssortmentList = [];
            // get prices of all paid assortments
            for (let i = 0; i < carouselsData.length && category !== 'free_classes'; i++) {
                if (_.includes(['resources', 'recommended_assortment', 'test_series'], carouselsData[i].data_type) || _.includes(['related', 'subject', 'course_subject', 'exams'], carouselsData[i].view_type)) {
                    const recentAssortments = [];
                    resolvedPromises[i].forEach((e) => {
                        if (e && !e.is_free) {
                            recentAssortments.push(e.assortment_id);
                        }
                    });
                    assortmentList = [...assortmentList, ...recentAssortments];
                } else if (carouselsData[i].data_type !== 'banners') {
                    assortmentList = [...assortmentList, ...assortmentIds[i]];
                }
                if (carouselsData[i].data_type === 'assortment') {
                    courseAssortmentList = [...courseAssortmentList, ...assortmentIds[i]];
                }
            }
            const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, false, xAuthToken) : {};

            if (userActiveCODOrders.length && !doesUserHaveActiveCourses) {
                carouselsData.push({
                    carousel_type: 'widget_parent',
                    view_type: 'my_courses',
                    data_type: 'assortment',
                    is_cod_carousel: true,
                });
            }
            // get enrolled students count in each course
            const courseStudentEnrolledCount = courseAssortmentList.length ? await LiveclassHelperLocal.generateAssortmentStudentEnrolledMapping(db, courseAssortmentList) : {};
            widgets = await LiveclassHelperLocal.getCaraouselData({
                carouselsData,
                db,
                config,
                studentClass,
                resolvedPromises,
                assortmentIds,
                studentID,
                isDropper: req.user.isDropper,
                studentCcmData,
                assortmentFlagrResponse,
                versionCode,
                emiPackageList,
                studentPackageList,
                assortmentPriceMapping,
                courseStudentEnrolledCount,
                studentPackageAssortments,
                studentEmiPackageAssortments,
                locale,
                category,
                xAuthToken,
                hasUPI,
                studentCourseOrClassSubcriptionDetails,
                priceFlow,
            });

            // to add top category icons
            if (!category && _.includes([9, 10, 11, 12], +studentClass) && +page === 1 && !usecampaignFlow) {
                const categoryItems = LiveclassHelperLocal.getCategoryIconsForExplorePage({
                    widgets,
                    versionCode,
                    allCategories,
                    studentClass,
                    studentCategoryData,
                });
                if (categoryItems.length && versionCode < 935) {
                    const categories = {
                        type: 'course_category_carousel',
                        data: {
                            categoryItems,
                        },
                    };
                    widgets.unshift(categories);
                } else if (categoryItems.length && widgets.length && (!_.get(flagrResponse, 'explore_page_top_icons.payload.enabled', null) || versionCode < 951)) {
                    if (widgets[0].type === 'widget_autoplay') {
                        widgets[0].data.category_items = categoryItems;
                    }
                }
            }

            data = {
                widgets: +page <= 2 ? widgets : [],
            };
        }

        if (category) {
            data.title = locale === 'hi' ? 'आप के लिए कोर्सेस' : 'Aap ke liye courses';
        }
        const doesUserHaveEtoos = _.find(studentPackageList, ['assortment_id', 138829]);
        if (category === 'Kota Classes' && versionCode >= 878 && (!doesUserHaveEtoos || (doesUserHaveEtoos && doesUserHaveEtoos.amount === -1))) {
            const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [138829], studentID, false, xAuthToken);
            const buyButton = await CourseHelper.getBuyButton(db, assortmentPriceMapping, 138829, versionCode, locale, 'course', couponCode.length ? couponCode[0] : '', 'KOTA_EXPLORE');
            buyButton.assortment_id = 138829;
            data.buy_button = buyButton;
        }
        if (category === 'Kota Classes' && versionCode >= 891 && doesUserHaveEtoos && studentPackageList.length > 1) {
            const courseList = [];
            for (let i = 0; i < studentPackageList.length; i++) {
                if (!_.find(courseList, ['id', studentPackageList[i].assortment_id.toString()])) {
                    const obj = {
                        id: `${studentPackageList[i].assortment_id}`,
                        display: studentPackageList[i].display_name,
                        is_selected: studentPackageList[i].assortment_id === 138829,
                    };
                    if (studentPackageList[i].assortment_id === 138829) {
                        obj.category_id = 'Kota Classes';
                    }
                    courseList.push(obj);
                }
            }
            data.course_list = courseList;
            data.title = 'KOTA CLASSES (ALL)';
        } else if (+page === 1 && category === 'Kota Classes' && versionCode >= 891) {
            widgets.unshift({
                type: 'text_widget',
                layout_config: {
                    margin_left: 120,
                    margin_bottom: 5,
                    margin_top: 10,
                },
                data: {
                    title: 'KOTA CLASSES (ALL)',
                    isBold: true,
                },
            });
        }
        // for getting nudge popup on explore page
        if (versionCode > 906 && !category && +page === 1) {
            data.popup_deeplink = await NudgeHelper.getPopUpDeeplink({
                db,
                locale,
                studentClass,
                event: 'explore_page',
                studentID,
            });
        }

        if (versionCode > 950 && category === 'free_classes' && +page === 1) {
            const teachersWidget = await getTeachersCarousel(db, studentID, locale, isDropper, studentClass, studentCcmData);
            if (teachersWidget && teachersWidget.widget_data && teachersWidget.widget_data.items && teachersWidget.widget_data.items.length) {
                data.widgets.push(teachersWidget);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data,
        };
        const variantInfo = [];
        if (variantInfo.length) {
            responseData.meta.analytics = {
                variant_info: variantInfo,
            };
        }

        if (versionCode >= 893 && +page === 1 && !category && (await couponMysql.isTimerPromoStudent(db.mysql.read, studentID)).length && !usecampaignFlow) {
            responseData.data.widgets.splice(2, 0, {
                type: 'widget_coupon_banner',
                data: {
                    title: 'Bachao 15%',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/coupon_timer_bg.webp',
                    subtitle: "coupon code 'TIMEBOMB15'",
                    description: 'sabhi courses pe laagu',
                    heading: 'Expires In',
                    time: 3600000,
                    deeplink: '',
                    text_color: '#000000',
                },
            });
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getList(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        const { id, page, subject } = req.query;
        const { version_code: versionCode } = req.headers;
        let { studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;

        const [
            studentPackageList,
            emiPackageList,
        ] = await Promise.all([
            CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID),
            CourseMysqlV2.getUserEmiPackages(db.mysql.read, studentID),
        ]);

        const studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);
        const studentEmiPackageAssortments = await getEmiPackageAssortments(db, emiPackageList, studentClass, studentID);
        const widgets = [];
        let title;
        if (!subject) {
            const carousel = await CourseMysqlV2.getCaraouselDetails(db.mysql.read, id);
            const offset = (page - 1) * 40;
            let result;
            let assortmentList = [];
            const assortmentIds = await generateAssortmentArray(db, carousel, studentClass, studentID);
            if (carousel[0].data_type === 'assortment') {
                result = await CourseMysqlV2.getAllCourses(db.mysql.read, studentClass, carousel[0].category, offset);
                assortmentList = assortmentIds[0];
            } else {
                const arr = assortmentIds[0];
                arr.forEach((e) => {
                    if (e.assortment_id) {
                        assortmentList.push(e.assortment_id);
                    } else if (Number.isInteger(e)) {
                        assortmentList.push(e);
                    }
                });
                const resourceTypes = carousel[0].resource_types ? carousel[0].resource_types.split(',') : [1, 2, 3, 4, 8, 9];
                if (carousel[0].view_type === 'all') {
                    result = await CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, assortmentList, resourceTypes, studentClass, carousel[0].subject_filter, offset);
                } else if (carousel[0].view_type === 'recorded') {
                    result = await CourseMysqlV2.getRecordedResourceDetailsFromAssortmentId(db.mysql.read, arr, resourceTypes, studentClass, carousel[0].subject_filter, offset);
                } else {
                    result = await CourseMysqlV2.getPastResourceDetailsFromAssortmentId(db.mysql.read, assortmentList, resourceTypes, studentClass, carousel[0].subject_filter, offset);
                }
            }
            if (result.length) {
                const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID);
                const obj = await LiveclassHelperLocal.generateViewByResourceType({
                    db,
                    caraouselData: carousel[0],
                    config,
                    result,
                    studentID,
                    versionCode,
                    assortmentPriceMapping,
                    studentPackageAssortments,
                    studentEmiPackageAssortments,
                });
                widgets.push(obj);
                if (widgets[0].data.items[0].type === 'widget_course_resource') {
                    widgets[0].data.scroll_direction = 'grid';
                } else {
                    widgets[0].data.scroll_direction = 'vertical';
                }
                widgets[0].data.link_text = '';
                title = `${carousel[0].category} - ${widgets[0].data.title}`;
                widgets[0].data.title = '';
            }
        } else {
            const offset = (page - 1) * 200;
            const subjectAssortments = await CourseMysqlV2.getSubjectAssortmentByCategory(db.mysql.read, id, studentClass, subject);
            const subjectAssortmentIds = subjectAssortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            const assortmentIds = await CourseMysqlV2.getChildAssortmentsFromSubjectAssortment(db.mysql.read, subjectAssortmentIds);
            let arr = [];
            assortmentIds.forEach((e) => {
                if (e.assortment_id) {
                    arr.push(e.assortment_id);
                } else if (Number.isInteger(e)) {
                    arr.push(e);
                }
            });
            const resourceTypes = [1, 8];
            if (offset + 200 > arr.length) {
                arr = arr.slice(1 + offset, 200 + offset);
            }
            const resources = await CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, arr, resourceTypes, studentClass, subject, offset);
            if (resources.length) {
                const paidAssortments = [];
                for (let i = 0; i < resources.length; i++) {
                    if (!resources[i].is_free) {
                        paidAssortments.push(resources[i].assortment_id);
                    }
                }
                let assortmentPriceMapping;
                if (paidAssortments.length) {
                    assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, paidAssortments, studentID);
                }
                const groupedData = _.groupBy(resources, 'topic');
                for (const key in groupedData) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (groupedData.hasOwnProperty(key)) {
                        const result = groupedData[key];
                        const caraouselData = {
                            title: key,
                            carousel_type: 'widget_parent',
                            view_type: 'past',
                            assortment_list: id,
                        };
                        if (result.length) {
                            // eslint-disable-next-line no-await-in-loop
                            const obj = await LiveclassHelperLocal.generateViewByResourceType({
                                db,
                                caraouselData,
                                config,
                                setWidth: true,
                                result,
                                versionCode,
                                studentID,
                                assortmentPriceMapping,
                                studentPackageAssortments,
                                studentEmiPackageAssortments,
                            });
                            widgets.push(obj);
                        }
                    }
                }
                title = subject;
            }
        }

        const data = {
            title,
            widgets,
        };

        const responseData = {
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

async function getEmiReminder(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        const { assortment_id: assortmentId } = req.query;
        const parentAssortments = await CourseHelper.getParentAssortmentListV1(db, [assortmentId]);
        const assortmentIds = parentAssortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
        const emiPackageList = await CourseMysqlV2.getUserPaymentSummaryByAssortment(db.mysql.read, assortmentIds, studentID);
        StudentRedis.setEMiReminderCounter(db.redis.write, studentID);
        const data = await CourseHelper.emiReminderData(db, emiPackageList, config);

        const responseData = {
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

async function getTrendingCoursesList(req, res, next) {
    try {
        const db = req.app.get('db');
        const { assortment_id: assortmentId, keyId } = req.query;
        const a = await CourseRedis.setTrendingCourses(db.redis.write, 1, keyId, assortmentId);
        console.log(a);
        const data = await CourseRedis.getTrendingCourses(db.redis.read, keyId, 0, 9);
        const responseData = {
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

async function liveclassSearch(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
        const { student_id: studentID, student_class: studentClass, locale } = req.user;
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const { text, page } = req.body;
        const offset = (page - 1) * 20;
        const searchResult = await elasticSearchTestInstance.liveclassSearch(text, studentClass);
        const studentPackageList = await CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID);
        const studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);
        const assortmentFlagrResponse = await CourseHelper.getFlagrResponseByFlagKey(xAuthToken, ['popular_courses_thumbnails']);
        const assortmentList = [];
        let assortmentPriceMapping = {};
        const promise = [];
        let title = 'Showing all Topics';
        let imageUrl = null;
        let noResultText = null;
        let suggestionText = '';
        if (searchResult.hits && searchResult.hits.hits.length) {
            const result = searchResult.hits.hits;
            const resourceAssortments = [];
            const parentAssortments = [];
            title = `Showing Results for <b>'${text}'</b>`;
            for (let i = offset; i < offset + 20 && i < result.length; i++) {
                const assortmentId = parseInt(result[i]._source.id);
                assortmentList.push(assortmentId);
                if (_.includes(['resource_pdf', 'resource_video', 'resource_test'], result[i]._source.type)) {
                    resourceAssortments.push(assortmentId);
                } else {
                    parentAssortments.push(assortmentId);
                }
            }
            if (resourceAssortments.length) {
                promise.push(CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, resourceAssortments, [1, 4, 8, 2], studentClass, null, 0));
            }
            if (parentAssortments.length) {
                promise.push(CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, parentAssortments, studentClass));
            }
        } else {
            const [
                trendingTopics,
                chapterList,
            ] = await Promise.all([
                CourseMysqlV2.getTrendingTopics(db.mysql.read, studentClass, 2),
                CourseMysqlV2.getChaptersByClass(db.mysql.read, studentClass, offset),
            ]);
            for (let i = 0; i < chapterList.length; i++) {
                assortmentList.push(chapterList[i].assortment_id);
                promise.push(CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, [chapterList[i].assortment_id], studentClass));
            }
            imageUrl = `${config.staticCDN}engagement_framework/99C05A0C-FBC5-7C1F-2F40-3859DE4B3B10.webp`;
            noResultText = `Couldn't find anything for <b>'${text}'</b>`;
            if (trendingTopics.length > 1) {
                suggestionText = `Try searching for a topic name like '${trendingTopics[0].chapter}' or '${trendingTopics[1].chapter}'`;
            }
        }
        const resolvedPromises = await Promise.all(promise);
        if (assortmentList.length) {
            assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true, xAuthToken);
        }

        const caraouselData = {
            title: '',
            carousel_type: 'widget_parent',
            view_type: 'past',
            assortment_list: '0',
        };
        const widgets = [];
        for (let i = 0; i < resolvedPromises.length; i++) {
            const widgetData = await LiveclassHelperLocal.generateViewByResourceType({
                db,
                locale,
                caraouselData,
                config,
                result: resolvedPromises[i],
                versionCode,
                studentID,
                assortmentFlagrResponse,
                assortmentPriceMapping,
                studentPackageAssortments,
                studentEmiPackageAssortments: [],
            });
            widgets.push(widgetData);
            widgets[0].data.scroll_direction = 'vertical';
        }

        const data = {
            widgets,
            title,
            image_url: imageUrl,
            no_result_text: noResultText,
            suggestion_text: suggestionText,
        };

        const responseData = {
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

async function autoSuggest(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID, student_class: studentClass } = req.user;
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const { text } = req.body;
        const items = [];
        let title = '';
        if (text && text !== '') {
            const searchResult = await elasticSearchTestInstance.liveclassSearch(text, studentClass);
            const studentPackageList = await CourseMysqlV2.getUserActivePackages(db.mysql.read, studentID);
            const studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);
            const assortmentList = [];
            if (searchResult.hits && searchResult.hits.hits.length) {
                const result = searchResult.hits.hits;
                for (let i = 0; i < result.length && i < 8; i++) {
                    const assortmentId = parseInt(result[i]._source.id);
                    if (_.includes(['resource_pdf', 'resource_video', 'resource_test'], result[i]._source.type)) {
                        assortmentList.push(assortmentId);
                    }
                }
                const resourcesData = await CourseMysqlV2.getResourceDataFromAssortmentId(db.mysql.read, assortmentList, studentClass, 0);
                for (let i = 0; i < result.length && i < 8; i++) {
                    const assortmentId = parseInt(result[i]._source.id);
                    if (_.includes(['resource_pdf', 'resource_video', 'resource_test'], result[i]._source.type)) {
                        const obj = resourcesData.filter((e) => e.assortment_id === assortmentId);
                        if (obj.length) {
                            let deeplink = `doubtnutapp://pdf_viewer?pdf_url=${obj[0].resource_data}`;
                            if (result[i]._source.type === 'resource_video') {
                                deeplink = `doubtnutapp://video?qid=${obj[0].resource_data}&page=COURSE_LANDING`;
                            }
                            items.push({
                                display_name: obj[0].display,
                                display_type: result[i]._source.type.replace('resource_', ''),
                                display_type_title: result[i]._source.type.replace('resource_', ''),
                                resource_reference: obj[0].resource_data,
                                page: 'COURSE_LANDING',
                                is_premium: !obj[0].is_free,
                                is_vip: studentPackageAssortments.indexOf(assortmentId) >= 0,
                                payment_deeplink: `doubtnutapp://vip?assortment_id=${assortmentId}`,
                                deeplink,
                            });
                        }
                    } else {
                        items.push({
                            display_name: result[i]._source.search_key,
                            display_type: result[i]._source.type,
                            display_type_title: result[i]._source.type,
                            deeplink: `doubtnutapp://course_details?id=${assortmentId}`,
                        });
                    }
                }
            }
        }
        if (!items.length) {
            title = 'Popular Searches';
            const trendingTopics = await searchBl.getTrendingPlaylist(db, studentClass);
            const { playlist } = trendingTopics;
            if (playlist) {
                for (let i = 0; i < playlist.length; i++) {
                    items.push({
                        display_name: playlist[i].display,
                        display_type: '',
                        display_type_title: '',
                        deeplink: '',
                    });
                }
            }
        }

        const data = {
            title,
            items,
        };

        const responseData = {
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

async function getFreeLiveClassData(req, res, next) {
    try {
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_class: stClass } = req.user;
        let { locale } = req.user;
        const { version_code: versionCode } = req.headers;
        const { page } = req.query;
        const { isDropper } = req.user;
        const caraouselLimit = 10;
        const studentID = req.user.student_id;
        const widgets = [];
        locale = locale && locale === 'hi' ? 'hi' : 'en';

        const [freeCourseCarousel, couponTrialCard] = await Promise.all([
            CourseContainer.getFreeLiveClassCaraousel(db, stClass, locale, versionCode, page, caraouselLimit) || [],
            (+page === 1 && (!isFreeApp)) ? LiveclassHelperLocal.getLiveClassCouponTrialCard(db, studentID, versionCode, stClass) : null,
        ]);
        const promise = [];
        for (let i = 0; i < freeCourseCarousel.length; i++) {
            if (freeCourseCarousel[i].carousel_type === 'you_were_watching_v2') {
                promise.push(LiveclassHelperLocal.getLiveClassYouWereWatchingData(db, studentID, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_autoplay' && freeCourseCarousel[i].view_type === 'free_live_class_all') {
                promise.push(LiveclassHelperLocal.getLiveClassFreeData(db, studentID, stClass, locale, versionCode, config, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_autoplay' && freeCourseCarousel[i].view_type === 'free_live_class_subject') {
                promise.push(LiveclassHelperLocal.getLiveClassPastData(db, stClass, locale, versionCode, config, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_top_selling_subject' && freeCourseCarousel[i].view_type === 'free_live_class_subject') {
                promise.push(LiveclassHelperLocal.getLiveClassTopSellingSubjectData(db, stClass, locale, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_autoplay' && freeCourseCarousel[i].view_type === 'free_live_class_recommended') {
                promise.push(LiveclassHelperLocal.getLiveClassRecommendedData(db, stClass, locale, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_classes_by_teacher' && (!isFreeApp)) {
                promise.push(LiveclassHelperLocal.getLiveClassTopTeachersData(db, stClass, locale, freeCourseCarousel[i], versionCode));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_top_topics') {
                promise.push(LiveclassHelperLocal.getLiveClassTopTopicsData(db, stClass, locale, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_autoplay' && freeCourseCarousel[i].view_type === 'free_live_class_exams') {
                promise.push(LiveclassHelperLocal.getLiveClassFreeNeetAndJeeData(db, stClass, locale, versionCode, config, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'widget_chapter_by_classes' && freeCourseCarousel[i].view_type === 'free_live_class_chapter') {
                promise.push(LiveclassHelperLocal.getLiveClassChapterSubjectWiseData(db, stClass, locale, freeCourseCarousel[i], versionCode, studentID));
            } else if (freeCourseCarousel[i].carousel_type === 'library_video') { // additional section
                promise.push(LiveclassHelperLocal.getLiveClassVideoUsingLibrary(db, stClass, studentID, locale, freeCourseCarousel[i]));
            } else if (freeCourseCarousel[i].carousel_type === 'external_teacher_channel' && (!isFreeApp)) {
                const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMappingWithCategory(db.mysql.read, studentID);
                promise.push(getTeachersCarousel(db, studentID, locale, isDropper, stClass, studentCcmData));
            }
        }
        const freeTabData = await Promise.all(promise);
        for (let i = 0; i < freeTabData.length; i++) {
            if (freeTabData[i].length) {
                widgets.push(freeTabData[i][0]);
            } else if (freeTabData[i].widget_data && freeTabData[i].widget_data.items && freeTabData[i].widget_data.items.length) {
                widgets.push(freeTabData[i]);
            }
        }
        if (couponTrialCard) {
            widgets.splice(3, 0, couponTrialCard);
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: { widgets },
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
    home,
    getList,
    autoSuggest,
    getEmiReminder,
    liveclassSearch,
    getTrendingCoursesList,
    getFreeLiveClassData,
};
