const _ = require('lodash');
// const { result } = require('lodash');
const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/course');
const CourseHelperV2 = require('../../v2/course/course.helper');
const PackageContainer = require('../../../modules/containers/package');
const Flagr = require('../../../modules/containers/Utility.flagr');
const Liveclass = require('../../../modules/mysql/liveclass');
const LiveclassHelper = require('../../helpers/liveclass');
const Data = require('../../../data/liveclass.data');

let db;
let config;

async function fetchDefaultPackages(studentId, showSelection, flagrResponse) {
    const { variantAttachment } = flagrResponse;
    console.log('variant_attachment', variantAttachment);
    let durationInDaysList;

    if (!_.isEmpty(variantAttachment) && typeof variantAttachment.package_duration !== 'undefined') {
        durationInDaysList = variantAttachment.package_duration;
    } else {
        durationInDaysList = config.default_package_duration_list;
    }
    let packageList = [];
    if (durationInDaysList.length > 0) {
        packageList = await Package.getPackagesByDuration2(db.mysql.read, durationInDaysList);
    }
    for (let i = 0; i < packageList.length; i++) {
        // const offerAmount = packageList[i].original_amount - parseInt(variantAttachment.final_price[i]);
        packageList[i].offer_amount = parseInt(variantAttachment.final_price[i]);
        packageList[i].original_amount = parseInt(packageList[i].original_amount);
        packageList[i].duration = PackageContainer.parseDuration(packageList[i].duration_in_days);
        packageList[i].off = `${parseInt(Math.ceil((1 - (variantAttachment.final_price[i] / packageList[i].original_amount)) * 100))}%\noff`;
        packageList[i].selected = false;
    }
    if (packageList.length > 0) {
        if (showSelection) {
            packageList[0].selected = true;
        }
    }

    return packageList;
}

async function fetchInfoForUserOnSubscription(studentPackage, now, flagrResponse) {
    const response = {};
    const main = {};
    main.subscription = true;
    main.description = `Your Doubtnut VIP is Valid till ${moment(studentPackage.end_date).format('Do MMMM YYYY')}`;
    const daysLeft = moment(studentPackage.end_date).diff(now, 'days');
    const selectedPackage = await Package.getPackageById(db.mysql.read, studentPackage.student_package_id);
    if (selectedPackage[0].original_amount === -1.00) {
        main.title = 'Apna Plan Select karo';
        main.package_list = await fetchDefaultPackages(studentPackage.student_id, true, flagrResponse);
        if (daysLeft) {
            main.description = `Your Free Trial expires in ${PackageContainer.parseDuration(daysLeft)}`;
        } else {
            main.description = `Your Free Trial expires ${PackageContainer.parseDuration(daysLeft)}`;
        }
        main.cta_text = 'BUY NOW (All Courses)';
        main.trial = true;
    } else {
        main.title = 'Apka current plan';
        let checkSelected = 0;
        main.package_list = await fetchDefaultPackages(studentPackage.student_id, true, flagrResponse);
        for (let i = 0; i < main.package_list.length; i++) {
            main.package_list[i].offer_amount = parseInt(main.package_list[i].offer_amount);
            main.package_list[i].original_amount = parseInt(main.package_list[i].original_amount);
            main.package_list[i].duration = PackageContainer.parseDuration(main.package_list[i].duration_in_days);
            main.package_list[i].off = `${parseInt(Math.ceil((1 - (main.package_list[i].offer_amount / main.package_list[i].original_amount)) * 100))}%\noff`;
            main.package_list[i].selected = false;
            if (main.package_list[i].id === selectedPackage[0].id) {
                main.package_list[i].selected = true;
                checkSelected = 1;
            }
        }
        if (!checkSelected) {
            main.package_list[0].selected = true;
        }

        main.cta_text = 'UPGRADE PLAN';

        if (daysLeft <= config.subscription_threshold) {
            main.renewal = true;
            main.title = 'Apna Plan Select karo';
            main.cta_text = 'RENEW NOW';
            if (daysLeft) {
                main.description = `Your VIP plan expires in ${PackageContainer.parseDuration(daysLeft)}`;
            } else {
                main.description = `Your VIP plan expires ${PackageContainer.parseDuration(daysLeft)}`;
            }
        }
    }
    response.main = main;
    return response;
}

async function fetchSubscriptionDetails(studentId, flagrResponse, paymentCardState) {
    const response = {};

    const main = {};

    main.subscription = false;
    main.trial = false;
    main.title = 'Apna Plan Select karo';
    main.description = 'Get unlimited access to all teachers, courses and material';
    // main.description = 'Dear student, We are upgrading KOTA CLASSES. Payment options will be available from 12 June, 2020. Keep Learning!';
    main.package_list = await fetchDefaultPackages(studentId, true, flagrResponse);

    main.cta_text = 'BUY VIP PASS';

    if (!paymentCardState.expiredTrial && !paymentCardState.expiredVip) {
        const topCard = {
            type: 'trial_card',
            action: {
                action_activity: 'start_trial',
                action_data: null,
            },
            title: `For ${flagrResponse.variantAttachment.trial_duration} Days get all the course material and teachers' lectures for free`,
            button_text: `START FREE TRIAL (${flagrResponse.variantAttachment.trial_duration} DAYS)`,
            data: {
                variant_id: paymentCardState.variantId,
            },
        };
        main.top_card = topCard;
    }

    main.package_list = await fetchDefaultPackages(studentId, true, flagrResponse);
    response.main = main;
    return response;
}

async function info(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const studentID = req.user.student_id;
    const { type, course_id: courseID } = req.query;
    const isLiveclass = (type !== undefined && type === 'liveclass');
    const xAuthToken = req.headers['x-auth-token'];
    const flagrResponse = await Flagr.evaluateServiceWrapper({
        db,
        xAuthToken,
        entityContext: { studentId: studentID.toString() },
        flagID: (isLiveclass) ? config.package_subscription_liveclass_flagr_id : config.package_subscription_flagr_id,
        timeout: 3000,
    });
    const now = moment().add(5, 'hours').add(30, 'minutes');
    try {
    // check if user is on subscription
        let studentPackageList = [];
        let courseDetails = [];
        let paymentCardState = {};
        let userOnSubscription = false;
        let response = {};

        if (isLiveclass) {
            courseDetails = await Liveclass.getBoardDetails(db.mysql.read, courseID);
            studentPackageList = await Liveclass.checkSubscription(db.mysql.write, studentID, courseID);
            if (studentPackageList.length > 0) userOnSubscription = true;
            if (userOnSubscription) {
                // student is on subscription
                response = await LiveclassHelper.fetchInfoForUserOnSubscription(db, studentPackageList[0], now, flagrResponse, config, courseID);
            } else {
                // student is NOT on a subscription
                response = await LiveclassHelper.fetchSubscriptionDetails(db, studentID, flagrResponse, config, courseID);
            }
        } else {
            studentPackageList = await CourseMysql.checkVipWithExpiry(db.mysql.read, studentID);
            paymentCardState = await CourseHelperV2.getPaymentCardState({
                moment,
                data: studentPackageList,
                flagrResponse,
            });
            if (paymentCardState.isVip || paymentCardState.isTrial) userOnSubscription = true;

            if (userOnSubscription) {
                // student is on subscription
                response = await fetchInfoForUserOnSubscription(studentPackageList[0], now, flagrResponse, config);
            } else {
                // student is NOT on a subscription
                response = await fetchSubscriptionDetails(studentID, flagrResponse, paymentCardState);
            }
        }

        if (isLiveclass) {
            let subDesc = 'English & Hindi';
            if (courseDetails[0].locale === 'english') {
                subDesc = 'English';
            } else if (courseDetails[0].locale === 'hindi') {
                subDesc = 'Hindi';
            }
            response.main.package_description = {};
            response.main.package_description.title = courseDetails[0].title;
            response.main.package_description.includes = Data.packageDetailsInvludes;
            response.main.package_description.subjects = [Data.packageeSubjects, subDesc];
        }
        response.variant_id = paymentCardState.variantId;
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

module.exports = {
    info,
};
