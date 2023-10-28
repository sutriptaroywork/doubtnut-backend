const _ = require('lodash');
const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const PackageContainer = require('../../../modules/containers/package');
const Properties = require('../../../modules/mysql/property');
// const telemetry = require('../../../config/telemetry');
const Flagr = require('../../../modules/containers/Utility.flagr');
const CourseContainer = require('../../../modules/containers/course');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const CourseHelper = require('../../helpers/course');
const CourseV2Redis = require('../../../modules/redis/coursev2');
const Data = require('../../../data/data');
const Utility = require('../../../modules/utility');
const redisAnswer = require('../../../modules/redis/answer');
const StudentContainer = require('../../../modules/containers/student');

let db;
let config;

async function fetchDefaultPackages(studentId, showSelection, flagrResponse) {
    // const flagrResponse = await Flagr.evaluate(studentId.toString(), {}, config.package_subscription_flagr_id, 500);
    const variant_attachment = flagrResponse.variantAttachment;
    console.log('variant_attachment', variant_attachment);
    let duration_in_days_list;

    if (!_.isEmpty(variant_attachment) && variant_attachment.package_duration != undefined) {
        duration_in_days_list = variant_attachment.package_duration;
    } else {
        duration_in_days_list = config.default_package_duration_list;
    }
    const packageList = await Package.getPackagesByDuration2(db.mysql.read, duration_in_days_list);
    for (let i = 0; i < packageList.length; i++) {
        // const offerAmount = packageList[i].original_amount - parseInt(variant_attachment.final_price[i]);
        packageList[i].offer_amount = parseInt(variant_attachment.final_price[i]);
        packageList[i].original_amount = parseInt(packageList[i].original_amount);
        packageList[i].duration = PackageContainer.parseDuration(packageList[i].duration_in_days);
        packageList[i].off = `${parseInt(Math.ceil((1 - (variant_attachment.final_price[i] / packageList[i].original_amount)) * 100))}%\noff`;
    }
    if (showSelection) {
        packageList[2].selected = true;
    }

    // PackageContainer.updateUserSeenPackageInMongo(db.mongo.write, {
    //     createdAt: new Date(),
    //     studentId,
    //     durationList: duration_in_days_list,
    //     variantAttachment: duration_in_days_list,
    //     variantID: flagrResponse.variantID,
    //     ab: 1,
    // });

    return packageList;
}

async function fetchPaymentHelp() {
    const payment_help = {};
    const help = await Properties.getNameAndValueByBucket(db.mysql.read, 'payment_help_etoos');

    payment_help.title = 'Payment Help';
    payment_help.list = help;

    return payment_help;
}

async function fetchInfoForUserOnSubscription(student_package, now, flagrResponse) {
    const response = {};

    const main = {};

    main.subscription = true;

    main.description = `Your Doubtnut VIP is Valid till ${moment(student_package.end_date).format('Do MMMM YYYY')}`;

    const days_left = moment(student_package.end_date).diff(now, 'days');
    const selectedPackage = await Package.getPackageById(db.mysql.read, student_package.student_package_id);

    if (selectedPackage[0].name == 'trial') {
        main.title = 'Apna Plan Select karo';

        main.package_list = await fetchDefaultPackages(student_package.student_id, true, flagrResponse);

        if (days_left) {
            main.description = `Your Free Trial expires in ${PackageContainer.parseDuration(days_left)}`;
        } else {
            main.description = `Your Free Trial expires ${PackageContainer.parseDuration(days_left)}`;
        }

        main.cta_text = 'BUY NOW (All Courses)';
        main.trial = true;
    } else {
        main.title = 'Apka current plan';

        selectedPackage[0].offer_amount = flagrResponse.variantAttachment.final_price[flagrResponse.variantAttachment.package_duration.indexOf(selectedPackage[0].duration_in_days)];
        selectedPackage[0].original_amount = parseInt(selectedPackage[0].original_amount);
        selectedPackage[0].duration = PackageContainer.parseDuration(selectedPackage[0].duration_in_days);
        selectedPackage[0].off = `${parseInt(Math.ceil((1 - (selectedPackage[0].offer_amount / selectedPackage[0].original_amount)) * 100))}%\noff`;

        main.package_list = selectedPackage;
        main.package_list[0].selected = true;

        main.cta_text = 'STUDY NOW';

        if (days_left <= config.subscription_threshold) {
            main.renewal = true;
            main.title = 'Apna Plan Select karo';
            main.cta_text = 'RENEW NOW';

            if (days_left) {
                main.description = `Your VIP plan expires in ${PackageContainer.parseDuration(days_left)}`;
            } else {
                main.description = `Your VIP plan expires ${PackageContainer.parseDuration(days_left)}`;
            }
        }
    }

    response.main = main;
    return response;
}

async function fetchSubscriptionDetails(studentId, flagrResponse) {
    const response = {};

    const main = {};

    main.subscription = false;
    main.title = 'Apna Plan Select karo';

    main.package_list = await fetchDefaultPackages(studentId, true, flagrResponse);

    main.cta_text = 'BUY NOW (All Courses)';

    const secondary_cta_show = _.isEmpty(await Package.getStudentHasHadPackage(db.mysql.read, studentId));

    if (secondary_cta_show) {
        const trialDuration = flagrResponse.variantAttachment.trial_duration;
        main.secondary_cta_text = `${trialDuration} DAY FREE TRIAL (All Courses)`;
    }

    main.package_list = await fetchDefaultPackages(studentId, true, flagrResponse);
    response.main = main;
    return response;
}

async function fetchHeaderContent(lectureId) {
    const header = {};

    header.title = 'Doubtnut VIP';
    header.sub_title = 'Access all the courses of top Vmc faculty';
    header.short_desc = ['25+ faculty', '10,000 lectures', '3 Lakh minutes'];

    if (lectureId == 0) {
        header.image_content = [{ image_url: `${config.staticCDN}images/faculty_mug_41.webp`, name: 'NV Sir' },
            { image_url: `${config.staticCDN}images/faculty_mug_43.webp`, name: 'PS Sir' },
            { image_url: `${config.staticCDN}images/faculty_mug_45.webp`, name: 'GB Sir' }];
    } else {
        try {
            const faculty_info = await CourseContainer.getTopFacultyFromLectureId(db, lectureId);

            header.image_content = [];
            for (let i = 0; i < faculty_info.length; i++) {
                header.image_content.push({ name: faculty_info[i].nickname, image_url: faculty_info[i].square_image_url });
            }
        } catch (e) {
            console.log(e);
            header.image_content = [{ image_url: `${config.staticCDN}images/faculty_mug_41.webp`, name: 'NV Sir' },
                { image_url: `${config.staticCDN}images/faculty_mug_43.webp`, name: 'PS Sir' },
                { image_url: `${config.staticCDN}images/faculty_mug_45.webp`, name: 'GB Sir' }];
        }
    }

    return header;
}

async function info(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const studentId = req.user.student_id;

    const { lectureId } = req.params;
    const flagrResponse = await Flagr.evaluate(db, studentId.toString(), {}, config.package_subscription_flagr_id, 500);

    const now = moment().add(5, 'hours').add(30, 'minutes');
    const nowFormatted = now.format('YYYY-MM-DD');

    try {
    // check if user is on subscription

        const student_package = await Package.getStudentActivePackage(db.mysql.read, studentId, nowFormatted);

        let user_on_subscription = false;
        if (!_.isEmpty(student_package)) user_on_subscription = true;

        let response = {};
        if (user_on_subscription) {
            // student is on subscription
            response = await fetchInfoForUserOnSubscription(student_package[0], now, flagrResponse);
        } else {
            // student is NOT on a subscription
            response = await fetchSubscriptionDetails(studentId, flagrResponse);
        }

        response.header = await fetchHeaderContent(lectureId);

        response.feedback = { button_text: 'Feedback De' };

        response.payment_help = await fetchPaymentHelp();

        const responseData = {};
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = 'SUCCESS';

        // responseData.data = response;

        responseData.data = response;

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function createTrial(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const studentId = req.user.student_id;
    let assortmentID = req.query.assortment_id.split('||')[0];
    const { dn_device_type: deviceType } = req.headers;
    const { locale, gcm_reg_id, mobile } = req.user;
    let studentClass = req.user.student_class;
    let { country } = req.query;
    if (!country) {
        country = 'IN';
    }
    const startCardTime = moment().add(5, 'h').add(30, 'minutes').unix();
    redisAnswer.setUserLiveClassWatchedVideo(db.redis.read, +studentId, startCardTime, 'LIVECLASS_VIDEO_LF_ET_TRIAL_DISCOUNT_CARD');
    if (assortmentID === 'xxxx') {
        const classValue = req.query.assortment_id.split('||')[1];
        if (typeof classValue !== 'undefined' && classValue) {
            studentClass = classValue;
        }
        const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentId);
        assortmentID = await CourseHelper.getAssortmentByCategory(db, studentCcmData, studentClass, locale);
    }

    let data;
    try {
        let trialDuration = assortmentID === 138829 ? 2 : 3;
        if (deviceType === 'merchant') {
            const R2V2Student = await StudentContainer.checkR2V2Student(db, studentId);
            if (parseInt(R2V2Student) === 1) {
                trialDuration = 1;
            }
        }
        const quizReward = await CourseMysqlV2.checkUserQuizReward(db.mysql.read, studentId);
        if (quizReward.length) {
            trialDuration = quizReward[0].coupon_code.replace('GETFREE', '') ? parseInt(quizReward[0].coupon_code.replace('GETFREE', '')) : trialDuration;
        }
        const result = await PackageContainer.createSubscriptionEntryForTrialV1(db, studentId, assortmentID, -1, trialDuration);
        if (!_.isEmpty(result)) {
            data = { status: 'SUCCESS', message: locale === 'hi' ? 'आपका मुफ्त ट्रायल चालू हो गया है!' : 'Aapka trial activate ho gaya hai' };
        } else {
            data = { status: 'FAILURE', message: 'Something went wrong' };
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        CourseV2Redis.deleteUserActivePackages(db.redis.write, studentId);
        res.status(responseData.meta.code).json(responseData);
        const [
            courseDetails,
            timeTableDetails,
        ] = await Promise.all([
            CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentID, null),
            CourseMysqlV2.getBanners(db.mysql.read, assortmentID),
        ]);
        if (courseDetails.length > 0 && (courseDetails[0].assortment_type === 'course' || courseDetails[0].assortment_type === 'class')) {
            const notificationPayload = {
                event: 'course_details',
                title: Data.postPurchaseCommunication.trialStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].title.replace('{1}', courseDetails[0].meta_info === 'HINDI' ? `कक्षा ${courseDetails[0].class}` : `Class ${courseDetails[0].class}`),
                image: (courseDetails[0] && courseDetails[0].demo_video_thumbnail) ? courseDetails[0].demo_video_thumbnail : '',
                message: Data.postPurchaseCommunication.trialStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message,
                firebase_eventtag: Data.postPurchaseCommunication.trialStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                s_n_id: Data.postPurchaseCommunication.trialStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                // data: JSON.stringify({
                //     id: assortmentID,
                // }),
            };
            if (courseDetails[0].parent == 4) {
                notificationPayload.data = JSON.stringify({
                    category_id: 'Kota Classes',
                });
            } else {
                notificationPayload.data = JSON.stringify({
                    id: courseDetails[0].assortment_id,
                });
            }
            Utility.sendFcm(studentId, gcm_reg_id, notificationPayload);
            if (timeTableDetails && timeTableDetails.length > 0) {
                const notificationPayloadWithTimeTable = {
                    event: 'pdf_viewer',
                    title: Data.postPurchaseCommunication.trialStartWithTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].title.replace('{1}', courseDetails[0].meta_info === 'HINDI' ? `कक्षा ${courseDetails[0].class}` : `Class ${courseDetails[0].class}`),
                    image: (courseDetails[0] && courseDetails[0].demo_video_thumbnail) ? courseDetails[0].demo_video_thumbnail : '',
                    message: Data.postPurchaseCommunication.trialStartWithTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message,
                    firebase_eventtag: Data.postPurchaseCommunication.trialStartWithTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                    s_n_id: Data.postPurchaseCommunication.trialStartWithTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                    data: JSON.stringify({
                        pdf_url: timeTableDetails[0].pdf_url,
                    }),
                };
                Utility.sendFcm(studentId, gcm_reg_id, notificationPayloadWithTimeTable);
                const branchLinkWhatsapp = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_whatsapp', 'TRIAL_ACTIVATE_TIMETABLE', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${assortmentID}&referrer_student_id=`);
                Utility.sendWhatsAppHSMMedia(config, {
                    mobile, msg_type: 'DOCUMENT', caption: Data.postPurchaseCommunication.trialStartWithTimeTable.whatsapp[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkWhatsapp.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb'), url: timeTableDetails[0].pdf_url, filename: timeTableDetails[0].pdf_url.substring(timeTableDetails[0].pdf_url.lastIndexOf('/') + 1),
                });
                const branchLinkSMS = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_SMS', 'TRIAL_ACTIVATE_TIMETABLE', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${assortmentID}&referrer_student_id=`);
                const branchLinkTimetableSMS = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'timetable_SMS', 'TRIAL_ACTIVATE_TIMETABLE', timeTableDetails[0].action_data);
                Utility.sendSMSToReferral(config, { mobile, message: Data.postPurchaseCommunication.trialStartWithTimeTable.SMS[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkSMS.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb').replace('{4}', branchLinkTimetableSMS.url), locale: courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
            } else {
                const branchLinkWhatsapp = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_whatsapp', 'TRIAL_ACTIVATE', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${assortmentID}&referrer_student_id=`);
                Utility.sendWhatsAppHSMMedia(config, {
                    mobile, msg_type: 'IMAGE', caption: Data.postPurchaseCommunication.trialStart.whatsapp[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkWhatsapp.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb'), url: courseDetails[0].demo_video_thumbnail, filename: courseDetails[0].demo_video_thumbnail.substring(courseDetails[0].demo_video_thumbnail.lastIndexOf('/') + 1),
                });
                // Utility.sendWhatsAppHSMToReferral(config, { mobile, message: Data.postPurchaseCommunication.trialStart.whatsapp[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkWhatsapp.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb') });
                const branchLinkSMS = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_SMS', 'TRIAL_ACTIVATE_TIMETABLE', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${assortmentID}&referrer_student_id=`);
                Utility.sendSMSToReferral(config, { mobile, message: Data.postPurchaseCommunication.trialStart.SMS[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'hi'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkSMS.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb'), locale: courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'hi' });
            }
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    info,
    createTrial,
};
