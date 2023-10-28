const _ = require('lodash');
const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const PackageContainer = require('../../../modules/containers/package');
const Properties = require('../../../modules/mysql/property');
const telemetry = require('../../../config/telemetry');
const PackageConstant = require('../../../modules/constants/paymentPackage');
const Flagr = require('../../../modules/Utility.flagr');
const FlagrContainer = require('../../../modules/containers/Utility.flagr');
const Data = require('../../../data/data');
const PaypalSubscription = require('../../../modules/mysql/paypal');
const FlagrUtility = require('../../../modules/Utility.flagr');


let db;
let config;

async function fetchDefaultPackages(studentId, showSelection) {
    const variant_attachment = await Flagr.getVariantAttachment(studentId.toString(), {}, config.package_subscription_flagr_id, 500);

    console.log('variant_attachment', variant_attachment);
    let duration_in_days_list;

    if (!_.isEmpty(variant_attachment) && variant_attachment.package_duration != undefined) {
        duration_in_days_list = variant_attachment.package_duration;
    } else {
        duration_in_days_list = config.default_package_duration_list;
    }

    console.log('duration_in_days_after', duration_in_days_list);
    const packageList = await Package.getPackagesByDuration(db.mysql.read, duration_in_days_list);

    for (let i = 0; i < packageList.length; i++) {
        packageList[i].offer_amount = parseInt(packageList[i].offer_amount);
        packageList[i].original_amount = parseInt(packageList[i].original_amount);
        packageList[i].duration = PackageContainer.parseDuration(packageList[i].duration_in_days);
        packageList[i].off = `${parseInt(Math.ceil((1 - (packageList[i].offer_amount / packageList[i].original_amount)) * 100))}%\noff`;
    }
    if (showSelection) {
        packageList[2].selected = true;
    }

    PackageContainer.updateUserSeenPackageInMongo(db.mongo.write, {
        createdAt: new Date(),
        studentId,
        durationList: duration_in_days_list,
    });

    return packageList;
}

async function fetchPaymentHelp() {
    const payment_help = {};
    const help = await Properties.getNameAndValueByBucket(db.mysql.read, 'payment_help');

    payment_help.title = 'FAQs';
    payment_help.list = help;

    return payment_help;
}

function fetchVIPCardDetails(student_package, now) {
    const vip_card = {};

    vip_card.title = 'Doubtnut VIP';
    vip_card.days_left = moment(student_package.end_date).diff(now, 'days');

    if (vip_card.days_left) {
        vip_card.sub_title = `${vip_card.days_left} VIP Days Left`;
    } else {
        vip_card.sub_title = 'VIP expires TODAY';
    }
    vip_card.validity_text = `Valid till : ${moment(student_package.end_date).format('Do MMMM YYYY')}`;
    vip_card.description = 'Ask Unlimited Doubts Everyday';

    return vip_card;
}


async function fetchVIPDaysInfo(student_package) {
    const active_student_packages = await Package.getAllActiveStudentPackages(db.mysql.read, student_package.student_id);

    let details_paid = {};
    let
        details_referral;
    let days_total_by_referral = 0;
    let days_total_by_paid = 0;
    let last_referral_invite;
    for (let i = 0; i < active_student_packages.length; i++) {
        if (parseInt(active_student_packages[i].amount) > 0) { // paid for the plan
            details_paid.title = 'Paid';
            details_paid.date_info = moment(active_student_packages[i].created_at).format('DD MMM YYYY hh:mm A');
            days_total_by_paid += moment(active_student_packages[i].end_date).diff(moment(active_student_packages[i].start_date), 'days');
        } else { // earned by referral
            days_total_by_referral += moment(active_student_packages[i].end_date).diff(moment(active_student_packages[i].start_date), 'days');
            last_referral_invite = moment(active_student_packages[i].created_at).format('DD MMM YYYY hh:mm A');
        }
    }

    if (days_total_by_referral > 0) {
        details_referral = {
            title: 'Invite Friends',
            date_info: last_referral_invite,
            days_earned: `${PackageContainer.parseDuration(days_total_by_referral)}`,
        };
    }

    if (days_total_by_paid > 0) {
        details_paid.days_earned = `${PackageContainer.parseDuration(days_total_by_paid)}`;
    } else {
        details_paid = undefined;
    }

    const vip_days = {};

    vip_days.show_more = true;
    vip_days.show_more_text = 'view all';

    vip_days.title = 'Doubtnut VIP Details';

    if (!_.isEmpty(details_paid)) vip_days.details_paid = details_paid;
    if (!_.isEmpty(details_referral)) vip_days.details_referral = details_referral;

    vip_days.total_days = {};
    vip_days.total_days.title = 'Total Days';
    vip_days.total_days.days_earned = `${PackageContainer.parseDuration(days_total_by_paid + days_total_by_referral)}`;

    return vip_days;
}

function fetchFeedbackDetails() {
    const feedback_card = {};
    feedback_card.title = 'Hume batayen ki aap Doubtnut VIP se kya-kya features expect karte hai?';
    feedback_card.button_text = 'Give Feedback';

    return feedback_card;
}


async function fetchInfoForUserOnSubscription(student_package, now, studentId) {
    console.log('student_package1', student_package);
    const response = {};


    response.title = 'Your Current Plan Details';
    response.subscription = true;

    response.vip_card = fetchVIPCardDetails(student_package, now);
    response.vip_days = await fetchVIPDaysInfo(student_package);
    response.feedback_card = fetchFeedbackDetails();


    if (response.vip_card.days_left <= config.subscription_threshold) {
        response.renewal_info = {};

        if (response.vip_card.days_left) {
            response.renewal_info.title = `Your VIP plan expires in ${PackageContainer.parseDuration(response.vip_card.days_left)}`;
        } else {
            response.renewal_info.title = `Your VIP plan expires ${PackageContainer.parseDuration(response.vip_card.days_left)}`;
        }
        response.renewal_info.package = {};
        response.renewal_info.package.title = 'Apna Plan Choose Kare';

        response.renewal_info.package.list = await fetchDefaultPackages(studentId, true);
    }
    return response;
}


function fetchVIPCardDetailsPlan() {
    const vip_card = {};

    vip_card.title = 'Doubtnut VIP Kharide';
    vip_card.sub_title = 'Unlimited Doubts';
    vip_card.description = 'Puche ab har din';

    return vip_card;
}


async function fetchSubscriptionDetails(studentId) {
    const response = {};

    response.subscription = false;
    response.title = 'VIP Plan Details';
    response.vip_card = fetchVIPCardDetailsPlan();

    const packageList = await fetchDefaultPackages(studentId, true);


    response.feedback_card = fetchFeedbackDetails();

    response.package = {};
    response.package.title = 'Apna Plan Choose Kare';
    response.package.list = packageList;

    return response;
}


async function getTimerByStudentId(studentId) {
    const key = `${PackageConstant.constants.doubt_time_prefix}${studentId}`;

    const ttl = await db.redis.write.ttlAsync(key);

    return ttl - 1;
}

async function VIPPromptSeen(studentId) {
    const key = `${PackageConstant.constants.vip_prompt_prefix}${studentId}`;
    const is_prompt_seen = await db.redis.read.getAsync(key);

    if (is_prompt_seen) {
        return true;
    }

    db.redis.write.multi()
        .set(key, 1)
        .expire(key, 60 * 60 * 24)
        .execAsync();

    return false;
}


async function setTimerByStudentId(studentId) {
    const key = `${PackageConstant.constants.doubt_time_prefix}${studentId}`;
    await db.redis.write.multi()
        .set(key, 1)
        .expire(key, PackageConstant.constants.timer_value)
        .execAsync();
}

async function isUserBlockedFromQuestionAsk(studentId) {
    const key = `${PackageConstant.constants.doubt_time_prefix}${studentId}`;

    console.log('key', key);
    const ttl = await db.redis.read.ttlAsync(key);

    console.log('ttl', ttl);
    return ttl > 0;
}


async function prepareDialogView(questionInfo, studentId, doubt_limit, packageList) {
    questionInfo.dialog_view = true;

    questionInfo.dialog_view_info = {};
    questionInfo.dialog_view_info.is_cancel = false;
    questionInfo.dialog_view_info.description_1 = 'Doubtnut VIP Kharide';
    questionInfo.dialog_view_info.description_2 = 'Aur Pooche Unlimited\nDoubts Har Din';

    questionInfo.dialog_view_info.main_title = `Aapki ${doubt_limit} Doubts Limit Khatam Ho Gayi Hai. Puche apna agla Doubt`;

    questionInfo.dialog_view_info.timer = await getTimerByStudentId(studentId);
    questionInfo.dialog_view_info.timer_postfix = 'ke baad';
    questionInfo.dialog_view_info.main_desc = '';
    questionInfo.dialog_view_info.package = {};
    questionInfo.dialog_view_info.package.list = packageList;
}

async function prepareDialogViewPromptBeforeBlock(questionInfo, studentId, packageList) {
    questionInfo.dialog_view = true;

    questionInfo.dialog_view_info = {};
    questionInfo.dialog_view_info.is_cancel = true;
    questionInfo.dialog_view_info.description_1 = 'Doubtnut VIP Kharide';
    questionInfo.dialog_view_info.description_2 = 'Aur Pooche Unlimited\nDoubts Har Din';

    questionInfo.dialog_view_info.package = {};
    questionInfo.dialog_view_info.package.list = packageList;
}


async function prepareAlertView(questionInfo, questions_remaining) {
    questionInfo.alert_view = true;
    questionInfo.alert_view_text = `Doubts left : ${questions_remaining}`;
}


async function status(req, res) {
    const responseData = {

        data: {},
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },

    };

    res.status(responseData.meta.code).json(responseData);
}

async function info(req, res) {
    config = req.app.get('config');
    db = req.app.get('db');

    const responseData = {

        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {
            title: 'Doubtnut VIP',
            subscription: true,
            vip_card: {
                title: 'Doubtnut VIP',
                days_left: 29,
                sub_title: 'Enjoy Unlimited Doubtnut VIP',
                validity_text: '',
                description: 'Ask Unlimited Doubts Everyday',
            },
            feedback_card: {
                title: 'Hume batayen ki aap Doubtnut VIP se kya-kya features expect karte hai?',
                button_text: 'Give Feedback',
            },
            payment_help: await fetchPaymentHelp(),
        },
    };
    res.status(responseData.meta.code).json(responseData);
}

async function trial(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const xAuthToken = req.headers['x-auth-token'];
    console.log(req.user);
    const studentId = req.user.student_id;
    const categoryID = req.query.category_id;
    let data;
    try {
        // call flaggr
        const flagrResponse = await FlagrContainer.evaluateServiceWrapper({
            db,
            xAuthToken,
            entityContext: { studentId: studentId.toString() },
            flagID: Data.categoryIDFlagrMap[categoryID],
            timeout: 3000,
        });
        const trialDuration = flagrResponse.variantAttachment.trial_duration;
        if (_.isEmpty(await Package.getStudentHasHadPackageByCategoryID(db.mysql.write, studentId, categoryID))) {
            const trialPackage = await Package.getTrialPackagesByDurationV2(db.mysql.write, trialDuration, categoryID);

            const result = await PackageContainer.createSubscriptionEntryForTrial(db, studentId, trialPackage[0].id, trialPackage[0].original_amount, flagrResponse);
            if (!_.isEmpty(result)) {
                data = { status: 'SUCCESS', message: `Your FREE TRIAL is activated for ${trialDuration} day` };
            } else {
                data = { status: 'FAILURE', message: 'Something went wrong' };
            }
        } else {
            data = { status: 'FAILURE', message: 'User already subscribed to package in past. Trial cannot be given.' };
        }

        const responseData = {

            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}


async function doubtInfo(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const studentId = req.user.student_id;

    const now = moment().add(5, 'hours').add(30, 'minutes');
    const nowFormatted = now.format('YYYY-MM-DD');

    try {
        // check if user is on subscription

        const student_package = await Package.getStudentActivePackageDoubtLimit(
            db.mysql.read,
            studentId,
            nowFormatted,
        );

        let user_on_subscription = false;
        if (!_.isEmpty(student_package)) user_on_subscription = true;

        let response = {};
        if (user_on_subscription) {
            // student is on subscription
            response = await fetchInfoForUserOnSubscription(
                student_package[0],
                now,
                studentId,
            );
        } else {
            // student is NOT on a subscription
            response = await fetchSubscriptionDetails(studentId);
        }

        response.payment_help = await fetchPaymentHelp();

        const responseData = {};
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = 'SUCCESS';

        responseData.data = response;

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        telemetry.addTelemetry(telemetry.eventNames.subscription, 'error', {
            source: 'pkgctrl',
        });
        console.log(e);
        next(e);
    }
}

async function doubtStatus(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    let { country } = req.headers;
    if (!country) {
        country = 'IN';
    }

    const responseData = {};
    responseData.data = {};

    const studentId = req.user.student_id;

    const subscriptionInfo = {};


    const now = moment();
    const nowFormatted = now.format('YYYY-MM-DD');

    try {
        const promise = [];
        promise.push(Package.getStudentActivePackageDoubtLimit(
            db.mysql.read,
            studentId,
            nowFormatted,
        ));
        promise.push(PaypalSubscription.getAllSubscriptionByStudentId(db.mysql.read, studentId));

        let variantInfo;
        try {
            let variant_id;
            const exp = 'us_doubt_package';
            const flagrResp = await FlagrUtility.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: studentId.toString(),
                    capabilities: {
                        [exp]: {
                            entityId: studentId.toString(),
                        },
                    },
                },
            }, 2000);

            if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload && flagrResp[exp].payload.package_variant) {
                variant_id = flagrResp[exp].payload.package_variant;
            }
            variantInfo = await Package.getVariantDetails(db.mysql.read, variant_id);
        } catch (e) {
            console.log(e);
            variantInfo = await Package.getDefaultDoubtPackageByCountry(db.mysql.read, country);
        }

        const [student_package, paypalSubscription] = await Promise.all(promise);

        if (!_.isEmpty(student_package) && paypalSubscription.length && paypalSubscription[0].status != 'CANCELLED') {
            subscriptionInfo.status = true;
            subscriptionInfo.title = 'Membership Info';

            subscriptionInfo.end_date = student_package[0].end_date;
            subscriptionInfo.type = 'monthly plan';
            subscriptionInfo.pricing = `${Data.country_currency_mapping[country]}${variantInfo[0].base_price}/mo`;
            subscriptionInfo.button_text = 'Cancel Membership';
            subscriptionInfo.end_in_days = moment(student_package[0].end_date, 'YYYY-MM-DD').diff(nowFormatted, 'days');

            if (student_package[0].amount == -1 && paypalSubscription.length == 1) {
                subscriptionInfo.subscription_type = 'trial';
            } else {
                subscriptionInfo.subscription_type = 'subscription';
            }
        } else {
            subscriptionInfo.status = false;
            subscriptionInfo.payment_type = 'trial';
        }

        responseData.data.subscription = subscriptionInfo;
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = 'SUCCESS';

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    info,
    status,
    trial,
    doubtInfo,
    doubtStatus,
};
