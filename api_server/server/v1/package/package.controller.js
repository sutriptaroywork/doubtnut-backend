const _ = require("lodash");
const moment = require("moment");
const Package = require("../../../modules/mysql/package");
const PackageContainer = require("../../../modules/containers/package");
const Properties = require("../../../modules/mysql/property");
const telemetry = require("../../../config/telemetry");
const MailUtility = require("../../../modules/Utility.mail");
const PackageConstant = require("../../../modules/constants/paymentPackage");
const Student = require("../../../modules/mysql/student");
const Course = require("../../../modules/mysql/course");
const CourseMysql = require("../../../modules/mysql/coursev2");
const CouponMysql = require("../../../modules/mysql/coupon");
const TestSeriesMysql = require("../../../modules/mysql/testseries");
const Flagr = require("../../../modules/containers/Utility.flagr");
const Data = require("../../../data/data");
const DataPayment = require('../../../data/data.payment');
const DataUS = require("../../../data/data.us");
const crypto = require("crypto");
const UtilitySMS = require("../../../modules/Utility.SMS");
const PayMySQL = require("../../../modules/mysql/payment");
const Razorpay = require("razorpay");
const Trail = require("../../../modules/mysql/trail");
const PaypalSubscription = require("../../../modules/mysql/paypal");
const PayPalHelper = require('../../../modules/paypal/helper.js');
const PaymentHelper = require('../../helpers/payment');
const Utility = require("../../../modules/utility");
const DNProperty = require('../../../modules/mysql/property');
const FlagrUtility = require('../../../modules/Utility.flagr');
const Feedback = require('../../../modules/mysql/feedback');
const CouponContainer = require('../../../modules/containers/coupon');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const CourseHelper = require('../../helpers/course');
const RzpHelper = require('../../../modules/razorpay/helper.js');
const StudentContainer = require('../../../modules/containers/student');
const Token = require('../../../modules/token');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const StudentRedis = require('../../../modules/redis/student');
const kafka = require('../../../config/kafka');
const StudentHelper = require('../../helpers/student.helper');


let db;
let config;

async function getTimerByStudentId(studentId) {
    const key = `${PackageConstant.constants.doubt_time_prefix}${studentId}`;

    const ttl = await db.redis.read.ttlAsync(key);

    return ttl - 1;
}

async function VIPPromptSeen(studentId) {
    const key = `${PackageConstant.constants.vip_prompt_prefix}${studentId}`;
    const is_prompt_seen = await db.redis.read.getAsync(key);

    if (is_prompt_seen) {
        return true;
    }

    db.redis.write
        .multi()
        .set(key, 1)
        .expire(key, 60 * 60 * 24)
        .execAsync();

    return false;
}

async function setTimerByStudentId(studentId) {
    const key = `${PackageConstant.constants.doubt_time_prefix}${studentId}`;
    await db.redis.write
        .multi()
        .set(key, 1)
        .expire(key, PackageConstant.constants.timer_value)
        .execAsync();
}

async function isUserBlockedFromQuestionAsk(studentId) {
    const key = `${PackageConstant.constants.doubt_time_prefix}${studentId}`;

    console.log("key", key);
    const ttl = await db.redis.read.ttlAsync(key);

    console.log("ttl", ttl);
    return ttl > 0;
}

async function prepareDialogView(
    questionInfo,
    studentId,
    doubt_limit,
    packageList,
    country = 'IN',
) {
    questionInfo.dialog_view = true;

    questionInfo.dialog_view_info = {};
    questionInfo.dialog_view_info.is_cancel = false;
    questionInfo.dialog_view_info.description_1 = country != 'IN' ? 'Buy Doubts Gold Pass' : 'Doubts Gold Pass Kharide';
    questionInfo.dialog_view_info.description_2 =
    country != 'IN' ? 'And Ask Unlimited\nDoubts Every Day' : 'Aur Pooche Unlimited\nDoubts Har Din';

    questionInfo.dialog_view_info.main_title = country != 'IN' ? `Your ${doubt_limit} is over now` : `Aapki ${doubt_limit} Doubts Limit Khatam Ho Gayi Hai.`;

    questionInfo.dialog_view_info.timer = await getTimerByStudentId(studentId);
    questionInfo.dialog_view_info.timer_postfix = country != 'IN' ? 'After' : 'ke baad';
    questionInfo.dialog_view_info.main_desc = "";
    questionInfo.dialog_view_info.package = {};
    questionInfo.dialog_view_info.package.list = packageList;
}

async function prepareDialogViewPromptBeforeBlock(
    questionInfo,
    studentId,
    packageList
) {
    questionInfo.dialog_view = true;

    questionInfo.dialog_view_info = {};
    questionInfo.dialog_view_info.is_cancel = true;
    questionInfo.dialog_view_info.description_1 = "Doubts Gold Pass Kharide";
    questionInfo.dialog_view_info.description_2 =
        "Aur Pooche Unlimited\nDoubts Har Din";

    questionInfo.dialog_view_info.package = {};
    questionInfo.dialog_view_info.package.list = packageList;
}

async function prepareAlertView(questionInfo, questions_remaining) {
    questionInfo.alert_view = true;
    questionInfo.alert_view_text = `Doubts left : ${questions_remaining}`;
}

async function fetchDefaultDoubtPackages(studentId, showSelection) {
    const packageList = await Package.getDoubtLimitPackagesByDuration(
        db.mysql.read,
        Data.doubtPayWallDefaultPackageDurationList,
        "IN"
    );
    for (let i = 0; i < packageList.length; i++) {
        packageList[i].offer_amount = parseInt(packageList[i].display_price);
        packageList[i].original_amount = parseInt(packageList[i].base_price);
        packageList[i].duration = PackageContainer.parseDuration(
            packageList[i].duration_in_days
        );
        packageList[i].off = `${parseInt(
            Math.ceil(
                (1 -
                    packageList[i].offer_amount /
                        packageList[i].original_amount) *
                    100
            )
        )}%\noff`;
    }
    if (showSelection) {
        packageList[2].selected = true;
    }

    return packageList;
}

async function fetchGulfCountriesDoubtPackages(studentId, packageIds, country, showSelection) {
    const packageList = await Package.getDoubtLimitPackagesByPackageIdsAndCountry(
        db.mysql.read,
        packageIds,
        country,
    );
    console.log(packageList);
    for (let i = 0; i < packageList.length; i++) {
        packageList[i].offer_amount = parseInt(packageList[i].display_price);
        packageList[i].original_amount = parseInt(packageList[i].base_price);
        packageList[i].duration = PackageContainer.parseDuration(
            packageList[i].duration_in_days
        );
        packageList[i].off = `${parseInt(
            Math.ceil(
                (1 -
                    packageList[i].offer_amount /
                        packageList[i].original_amount) *
                    100
            )
        )}%\noff`;
    }
    if (showSelection) {
        packageList[packageList.length - 1].selected = true;
    }

    return packageList;
}

async function fetchPaymentHelp() {
    const payment_help = {};
    const help = await Properties.getNameAndValueByBucket(
        db.mysql.read,
        "payment_help_doubt"
    );

    payment_help.title = "FAQs";
    payment_help.list = help;

    return payment_help;
}

function fetchVIPCardDetails(student_package, now) {
    const vip_card = {};

    vip_card.title = "Doubts Gold Pass";
    vip_card.days_left = moment(student_package.end_date).diff(now, "days");

    if (vip_card.days_left) {
        vip_card.sub_title = `${vip_card.days_left} VIP Days Left`;
    } else {
        vip_card.sub_title = "VIP expires TODAY";
    }
    vip_card.validity_text = `Valid till : ${moment(
        student_package.end_date
    ).format("Do MMMM YYYY")}`;
    vip_card.description = "Ask Unlimited Doubts Everyday";

    return vip_card;
}

async function fetchVIPDaysInfo(student_package) {
    const active_student_packages = await Package.getAllActiveStudentDoubtPackages(
        db.mysql.read,
        student_package.student_id
    );

    let details_paid = {};
    let details_referral;
    let days_total_by_referral = 0;
    let days_total_by_paid = 0;
    let last_referral_invite;
    for (let i = 0; i < active_student_packages.length; i++) {
        if (parseInt(active_student_packages[i].amount) > 0) {
            // paid for the plan
            details_paid.title = "Paid";
            details_paid.date_info = moment(
                active_student_packages[i].created_at
            ).format("DD MMM YYYY hh:mm A");
            days_total_by_paid += moment(
                active_student_packages[i].end_date
            ).diff(moment(active_student_packages[i].start_date), "days");
        } else {
            // earned by referral
            days_total_by_referral += moment(
                active_student_packages[i].end_date
            ).diff(moment(active_student_packages[i].start_date), "days");
            last_referral_invite = moment(
                active_student_packages[i].created_at
            ).format("DD MMM YYYY hh:mm A");
        }
    }

    if (days_total_by_referral > 0) {
        details_referral = {
            title: "Invite Friends",
            date_info: last_referral_invite,
            days_earned: `${PackageContainer.parseDuration(
                days_total_by_referral
            )}`,
        };
    }

    if (days_total_by_paid > 0) {
        details_paid.days_earned = `${PackageContainer.parseDuration(
            days_total_by_paid
        )}`;
    } else {
        details_paid = undefined;
    }

    const vip_days = {};

    vip_days.show_more = true;
    vip_days.show_more_text = "view all";

    vip_days.title = "Doubts Gold Pass Details";

    if (!_.isEmpty(details_paid)) vip_days.details_paid = details_paid;
    if (!_.isEmpty(details_referral))
        vip_days.details_referral = details_referral;

    vip_days.total_days = {};
    vip_days.total_days.title = "Total Days";
    vip_days.total_days.days_earned = `${PackageContainer.parseDuration(
        days_total_by_paid + days_total_by_referral
    )}`;

    return vip_days;
}

function fetchFeedbackDetails(country = 'IN') {
    const feedback_card = {};
    feedback_card.title = country != 'IN' ? 'Did you Like Doubts Gold Pass Plans? Tell Us': 'Aapko Doubts Gold Pass Plans Kaise Lagey? Humey Bataiye';
    feedback_card.button_text = 'Give Feedback';

    return feedback_card;
}

async function fetchInfoForUserOnSubscription(student_package, now, studentId, country, packageIds = []) {
    console.log("student_package1", student_package);
    const response = {};

    response.title = "Your Current Plan Details";
    response.subscription = true;

    response.vip_card = fetchVIPCardDetails(student_package, now);
    response.vip_days = await fetchVIPDaysInfo(student_package);
    response.feedback_card = fetchFeedbackDetails();

    if (response.vip_card.days_left <= Data.doubtPayWallReminderThreshold) {
        response.renewal_info = {};

        if (response.vip_card.days_left) {
            response.renewal_info.title = `Your VIP plan expires in ${PackageContainer.parseDuration(
                response.vip_card.days_left
            )}`;
        } else {
            response.renewal_info.title = `Your VIP plan expires ${PackageContainer.parseDuration(
                response.vip_card.days_left
            )}`;
        }
        response.renewal_info.package = {};
        response.renewal_info.package.title = country != 'IN' ? 'Choose Your Plan' :'Apna Plan Choose Kare';

        if (country != 'IN' && !_.isEmpty(packageIds)) {
            response.renewal_info.package.list = await fetchGulfCountriesDoubtPackages(studentId, packageIds, country, true);
        } else {
            response.renewal_info.package.list = await fetchDefaultDoubtPackages(studentId, true);
        }

    }
    return response;
}

function fetchVIPCardDetailsPlan(country = 'IN') {
    const vip_card = {};

    vip_card.title = country != 'IN' ? 'Buy Doubts Gold Pass' : 'Doubts Gold Pass Kharide';
    vip_card.sub_title = 'Unlimited Doubts';
    vip_card.description = country != 'IN' ? 'Ask everyday' : 'Puche ab har din';

    return vip_card;
}

async function fetchSubscriptionDetails(studentId, country, packageIds = []) {
    const response = {};

    response.subscription = false;
    response.title = 'Doubts Gold Pass Details';
    response.vip_card = fetchVIPCardDetailsPlan(country);
    let packageList;
    if (country != 'IN' && !_.isEmpty(packageIds)) {
        packageList = await fetchGulfCountriesDoubtPackages(studentId, packageIds, country, true);
    } else {
        packageList = await fetchDefaultDoubtPackages(studentId, true);
    }

    response.feedback_card = fetchFeedbackDetails(country);

    response.package = {};
    response.package.title = country != 'IN' ? 'Choose Your Plan' : 'Apna Plan Choose Kare';
    response.package.list = packageList;

    return response;
}

async function status(req, res) {
    const responseData = {
        data: {},
        meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
        },
    };

    res.status(responseData.meta.code).json(responseData);
}

async function feedbackSubmit(req, res, next) {
    const responseData = {
        meta: {
            code: 500,
            success: false,
            message: "FAILURE",
        },
    };

    config = req.app.get("config");
    db = req.app.get("db");
    const { student_id, mobile } = req.user;
    const feedback = req.body.feedback || "";

    if (_.isEmpty(feedback.trim())) {
        responseData.message = "Feedback cannot be empty";
        responseData.meta.code = 200;
        return res.status(responseData.meta.code).json(responseData);
    }
    try {
        await Package.setUserFeedback(db.mysql.write, { student_id, feedback });

        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = "SUCCESS";

        responseData.data = {
            message: "Your Feedback is Successfully Submitted!",
        };

        MailUtility.sendMailViaSendGrid(
            config,
            PackageConstant.constants.autobotMailID,
            PackageConstant.constants.paymentMailID,
            `${PackageConstant.constants.feedbackSubject} ${student_id} (${mobile})`,
            feedback
        );
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function planDays(req, res, next) {
    config = req.app.get("config");
    db = req.app.get("db");
    const studentId = req.user.student_id;

    try {
        const studentPackageList = await Package.getAllActiveStudentDoubtPackages(
            db.mysql.read,
            studentId
        );

        const response = [];
        for (let i = 0; i < studentPackageList.length; i++) {
            const responseSingle = {};
            responseSingle.days = `${PackageContainer.parseDuration(
                moment(studentPackageList[i].end_date).diff(
                    moment(studentPackageList[i].start_date),
                    "days"
                )
            )}`;
            responseSingle.date = moment(
                studentPackageList[i].created_at
            ).format("Do MMMM YYYY hh:mm A");
            responseSingle.title = studentPackageList[i].amount
                ? "Paid"
                : "Invite";

            response.push(responseSingle);
        }

        const responseData = {};
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = "SUCCESS";

        responseData.data = response;

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function info(req, res) {
    config = req.app.get("config");
    db = req.app.get("db");

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: "SUCCESS",
        },
        data: {
            id: 1,
            created_at: "2019-12-13T13:32:19.000Z",
            updated_at: "2020-01-27T19:43:43.000Z",
            is_active: 1,
            student_id: 11670187,
            amount: 99,
            start_date: "2020-02-19T00:00:00.000Z",
            end_date: "2020-03-20T23:59:59.000Z",
            student_package_id: 1,
            doubt_ask: -1,
            updated_by: "system",
            name: "default",
            description: "",
            original_amount: 500,
            offer_amount: 99,
            duration_in_days: 30,
            valid_on: null,
            doubt_limit: 20,
            type: "subscription",
            reference_package: 0,
            priority: 30,
            header_title: "Doubtnut VIP",
            main_title: "",
            main_desc: "Enjoy Unlimited Doubtnut VIP",
            subscription_active: 1,
            package_id: 1,
            validity: "20th March 2020",
            days_to_expiry: 29,
            banner_img: [
                `${config.staticCDN}images/vipvip.webp`,
            ],
            duration_month: "1 Month",
            payment_help: {
                title: "FAQs",
                list: await Properties.getNameAndValueByBucket(
                    db.mysql.read,
                    "payment_help"
                ),
            },
        },
    };

    res.status(responseData.meta.code).json(responseData);
}

async function trial(req, res, next) {
    console.log("here");
    config = req.app.get("config");
    db = req.app.get("db");

    const studentId = req.user.student_id;

    let data;
    try {
        // call flaggr
        const flagrResponse = await Flagr.evaluate(
            db,
            studentId.toString(),
            {},
            config.package_subscription_flagr_id,
            2000
        );
        const trialDuration = flagrResponse.variantAttachment.trial_duration;
        if (
            _.isEmpty(
                await Package.getStudentHasHadPackage(db.mysql.write, studentId)
            )
        ) {
            // const trialPackage = await Package.getPackageByName(db.mysql.read, 'trial');
            const trialPackage = await Package.getTrialPackagesByDuration(
                db.mysql.write,
                trialDuration
            );

            const result = await PackageContainer.createSubscriptionEntryForStudentIdByPackageIdAndAmount(
                db,
                studentId,
                trialPackage[0].id,
                trialPackage[0].original_amount,
                config,
                flagrResponse
            );
            if (!_.isEmpty(result)) {
                data = {
                    status: "SUCCESS",
                    message: `Your FREE TRIAL is activated for ${trialDuration} day`,
                };
            } else {
                data = { status: "FAILURE", message: "Something went wrong" };
            }
        } else {
            data = {
                status: "FAILURE",
                message:
                    "User already subscribed to package in past. Trial cannot be given.",
            };
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function infoForPanel(req, res, next) {
    try {
        db = req.app.get("db");
        config = req.app.get('config');

        const { mobile, student_id, expert_id } = req.query;
        let promise = [];
        let studentDetails;
        // get student id by mobile
        if (mobile) {
            studentDetails = await Student.getStudentByPhoneV1(
                mobile,
                db.mysql.read
            );
        } else {
            studentDetails = await StudentContainer.getById(
                student_id,
                db
            );
        }
        if (studentDetails.length > 0) {
            const isStudentTrial = await Package.checkTrail(
                db.mysql.read,
                studentDetails[0].student_id
            );

            let totalTime = "0";
            let eachTime = "0";
            let StudentTrailPackageDetails = "";
            if (isStudentTrial.length) {
                const packageQuestionInfo = await Trail.getpackageQuestion(
                    db.mysql.read,
                    isStudentTrial[0].new_package_id
                );
                console.log("packageQuestionInfo"+JSON.stringify(packageQuestionInfo))
                const questionIds = new Array();
                packageQuestionInfo.forEach((element) =>
                    questionIds.push(element.resource_reference)
                );
                let questionId = questionIds.join();
                questionId = "'" + questionId.split(",").join("','") + "'";
                console.log("isStudentTrial" + JSON.stringify(questionId));
                totalTime = await Trail.getTotalEngTime(
                    db.mysql.read,
                    questionId,
                    studentDetails[0].student_id
                );

                eachTime = await Trail.getTotalEngTimEeach(
                    db.mysql.read,
                    questionId,
                    studentDetails[0].student_id
                );


                StudentTrailPackageDetails = await Package.getStudentTrailPackageDetails(
                    db.mysql.read,
                    studentDetails[0].student_id
                )
                console.log("StudentTrailPackageDetails" + JSON.stringify(StudentTrailPackageDetails));
            }
            let subsriptionDetails = [];
            let isEligible = [];
            let resolvedPromise = [];
            promise.push(
                Student.getActiveSubscriptions(
                    db.mysql.read,
                    studentDetails[0].student_id
                )
            );
            promise.push(Package.getAllMasterVariants(db.mysql.read));
            promise.push(Package.getAllPaymentSummary(db.mysql.read, studentDetails[0].student_id));
            promise.push(PayMySQL.checkActiveCODWithPackageDetailsUsingStudentID(db.mysql.read, studentDetails[0].student_id));
            promise.push(PayMySQL.checkNkcOldStudent(db.mysql.read, studentDetails[0].student_id));
            promise.push(Properties.getValueByBucketAndName(db.mysql.read, 'doubtnut_emi', 'expert_ids'));
            resolvedPromise = await Promise.all(promise);
            if (resolvedPromise[0].length > 0) {
                const details = _.groupBy(resolvedPromise[0], "master_variant_id");
                let nullEntriesForNonEmi = [];
                _.forOwn(details, function (value, key) {
                    if (key == "null") {
                        nullEntriesForNonEmi = value;
                    } else {
                        subsriptionDetails.push(value);
                    }
                });
                for (let k = 0; k < nullEntriesForNonEmi.length; k++) {
                    const arr = [];
                    arr.push(nullEntriesForNonEmi[k]);
                    subsriptionDetails.push(arr);
                }
            }
            for (let i = 0; i < subsriptionDetails.length; i++) {
                var start = moment(
                    subsriptionDetails[i][0].master_subscription_start_date
                );
                const date = new Date();
                let end = moment(date.toISOString().split("T")[0]);
                subsriptionDetails[i] = _.orderBy(subsriptionDetails[i], ['subscription_id'], ['desc']);
                if(end.diff(moment(subsriptionDetails[i][0].master_subscription_end_date), "days") > 0 && end.diff(moment(subsriptionDetails[i][0].master_subscription_end_date), "days") <= 30 && !subsriptionDetails[i][0].is_refunded) {
                    isEligible.push(2);
                } else if(end.diff(moment(subsriptionDetails[i][0].master_subscription_end_date), "days") > 30 || subsriptionDetails[i][0].is_refunded) {
                    isEligible.push(0);
                } else if(['subject', 'chapter'].includes(subsriptionDetails[i][0].assortment_type)) {
                    isEligible.push(3);
                } else if(subsriptionDetails[i][0].package_type === 'emi' && subsriptionDetails[i][0].last_emi_package != 1 && resolvedPromise[5].length && _.includes(resolvedPromise[5][0].value, expert_id)) {
                    isEligible.push(4);
                } else if(subsriptionDetails[i][0].package_type === 'emi' && (subsriptionDetails[i][0].last_emi_package == 1 || resolvedPromise[5].length == 0 || !_.includes(resolvedPromise[5][0].value, expert_id))) {
                    isEligible.push(0);
                } else {
                    isEligible.push(1);
                }
                if(subsriptionDetails[i][0].pdf_url)
                    subsriptionDetails[i][0].pdf_url = subsriptionDetails[i][0].pdf_url.replace('pdf_download', 'pdf_open');
                subsriptionDetails[i][0].recent_history = await Package.getRecentHistory(db.mysql.read, subsriptionDetails[i][0].subcategory_id, subsriptionDetails[i][0].batch_id);
            }
            const nkc = {
                isNkcStudent : 0,
                proof:'',
                showProof: false,
            }
            if (resolvedPromise[4].length > 0) {
                nkc.isNkcStudent=1;
                nkc.showProof = (resolvedPromise[4][0].is_approved == 0) ? 1 : 0;
                if (nkc.showProof) {
                    nkc.proof = resolvedPromise[4][0].old_proof_url;
                }
                if (resolvedPromise[4][0].is_approved == 1) {
                    nkc.status = 'Approved';
                } else if (resolvedPromise[4][0].is_approved == -1) {
                    nkc.status = 'Rejected';
                } else if (resolvedPromise[4][0].is_approved == 0) {
                    nkc.status = 'Under Review';
                }
            }
            const xAuthToken = Token.sign({ id: studentDetails[0].student_id }, config.jwt_secret_new);
            let walletDetails = {};
            try {
                const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken });
                console.log(walletInfo.data);
                walletDetails.wallet_cash_balance = +walletInfo.data.cash_amount;
                walletDetails.wallet_reward_balance = +walletInfo.data.reward_amount;
            } catch (e) {
                walletDetails.wallet_cash_balance = 0;
                walletDetails.wallet_reward_balance = 0;
                console.log(e);
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: {
                    // variant: flagrResponse,
                    subscription_details: subsriptionDetails,
                    isEligible: isEligible,
                    masterVariants: resolvedPromise[1],
                    doubtPackages:
                        (
                            await Package.isStudentInDoubtPaywall(
                                db.mysql.read,
                                studentDetails[0].student_id
                            )
                        ).length > 0
                            ? await Package.getDoubtLimitPackagesByDuration(
                            db.mysql.read,
                            [30, 180, 365],
                            "IN"
                            )
                            : [],
                    totalTime: totalTime,
                    eachTime: eachTime,
                    StudentTrailPackageDetails: StudentTrailPackageDetails,
                    studentDetails:studentDetails,
                    payment_summary:resolvedPromise[2],
                    active_COD_orders : resolvedPromise[3],
                    wallet_details: walletDetails,
                    nkc
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        } else{
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: "STUDENT NOT FOUND",
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }

    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getVariantInfo(req, res, next) {
    try {
        db = req.app.get("db");
        const { flag_id: flagID } = req.query;
        const result = await Flagr.getVariantList(db, flagID);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data: result,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function setStudentPackage(req, res, next) {
    try {
        db = req.app.get("db");
        const { variant_id: variantID, flag_id: flagID, mobile } = req.query;
        const result = await Flagr.getVariantList(db, flagID);
        const studentDetails = await Student.getStudentByPhone(
            mobile,
            db.mysql.read
        );
        const studentID = studentDetails[0].student_id;
        let data = null;
        for (let i = 0; i < result.length; i++) {
            if (result[i].id == variantID) {
                data = JSON.stringify(result[i].attachment);
            }
        }
        if (
            !_.isNull(data) &&
            !_.isNull(studentID) &&
            !_.isNull(flagID) &&
            !_.isNull(variantID)
        ) {
            // upsert
            const obj = {};
            obj.student_id = studentID;
            obj.flag_id = flagID;
            obj.variant_id = variantID;
            obj.data = data;
            const qresult = await Package.setUserPackage(db.mysql.write, obj);
            if (qresult) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: "Invalid request",
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getSubscriptionStatus(req, res, next) {
    const sId = req.user.student_id;

    db = req.app.get("db");
    try {
        let data = {};
        let isVip = false;
        let isTrial = false;
        let isTrialExpired = false;
        let purchaseCount = 0;



        let promise = []
        promise.push(Course.checkVipWithExpiry(db.mysql.read, sId));
        promise.push(CourseMysql.getPaidAssortmentsOfUser(db.mysql.read, sId));
        CouponContainer.createReferralCoupon(db, sId);
        const [studentData,paidAssortments ] = await Promise.all(promise);

        const assortmentList = paidAssortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
        console.log(studentData);

        if (studentData.length > 0) {
            if (studentData[0].amount === -1 && studentData[0].diff > 0)
                isTrial = true;

            for (let i = 0; i < studentData.length; i++) {
                if (studentData[i].amount === -1 && studentData[i].diff < 0)
                    isTrialExpired = true;
                if (studentData[i].amount > 0) purchaseCount++;
                if (studentData[i].diff > 0) isVip = true;
            }
        }

        data = {
            isVip,
            isTrial,
            isTrialExpired,
            purchaseCount,
            purchased_assortments: assortmentList,
            active_course: true,
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getPaymentInfo(req, res, next) {
    try {
        db = req.app.get("db");
        const { mobile } = req.query;
        console.log(req);
        // get student id by mobile
        const studentDetails = await Student.getStudentByPhone(
            mobile,
            db.mysql.read
        );
        console.log(studentDetails);
        if (studentDetails && studentDetails.length > 0) {
            const paymentInfo = await Student.getPaymentInfoData(
                db.mysql.read,
                studentDetails[0].student_id
            );
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: paymentInfo,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: "INVALID PHONE  NUMBER",
                },
                data: {},
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
    }
}

async function followUp(req, res, next) {
    try {
        db = req.app.get("db");
        config = req.app.get("config");
        const { id, mobile } = req.query;
        const promise = [];
        const type = "new_sale";
        promise.push(Package.getPaymentSummaryFromId(db.mysql.read, id));
        promise.push(Student.getStudentByPhone(mobile, db.mysql.read));
        const resolvedPromises = await Promise.all(promise);
        // const paymentSummary = await Package.getPaymentSummaryFromId(db.mysql.read, id);
        // const studentDetails = await Student.getStudentByPhone(mobile, db.mysql.read);
        //get next emi package id
        if (
            resolvedPromises[0] &&
            resolvedPromises[0].length > 0 &&
            resolvedPromises[1] &&
            resolvedPromises[1].length > 0
        ) {
            // const nextPackageId = await Package.getNextPackageId(db.mysql.read, resolvedPromises[0][0].master_package_id, resolvedPromises[0][0].emi_order+1);
            const variantDetails = await Package.getVariantFromMasterVariant(
                db.mysql.read,
                resolvedPromises[0][0].master_variant_id,
                resolvedPromises[0][0].variant_id
            );
            const nextPackage = await Package.getNewPackageById(
                db.mysql.read,
                variantDetails[0].package_id
            );
            const insertObj = {};
            insertObj.order_id = crypto.randomBytes(16).toString("hex");
            insertObj.payment_for = "vip_offline";
            // insertObj.payment_for_id = nextPackageId[0].id;
            insertObj.amount = resolvedPromises[0][0].next_part_payment_amount;
            insertObj.student_id = resolvedPromises[1][0].student_id;
            insertObj.status = "INITIATED";
            insertObj.source = "RAZORPAY";
            if (variantDetails[0]) {
                insertObj.variant_id = variantDetails[0].id;
            }
            console.log(insertObj);
            const rzp = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET,
            });
            const date = new Date();
            date.setDate(date.getDate() + 2);
            let rzpObj = {
                type: "link",
                description: `Payment for ${nextPackage[0].duration_in_days}-Days Unlimited Pass`,
                amount:
                    parseFloat(
                        resolvedPromises[0][0].next_part_payment_amount
                    ) * 100,
                expire_by: Math.floor(date / 1000),
                notes: { type },
            };
            const razorpayResponse = await RzpHelper.createStandardLink(rzpObj);

            insertObj.partner_order_id = razorpayResponse.id;
            const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, insertObj);
            PayMySQL.setRzpPaymentLink(db.mysql.write, { payment_info_id: paymentInfoResult.insertId, student_id: paymentInfoResult.student_id, link_id: paymentInfoResult.partner_order_id, status: 'INITIATED' });
            UtilitySMS.sendSMS(
                config,
                "offline_payment_link_2",
                [
                    `${nextPackage[0].duration_in_days}-Days Unlimited Pass`,
                    resolvedPromises[0][0].next_part_payment_amount,
                    razorpayResponse.short_url,
                ],
                mobile
            );
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: { url: razorpayResponse.short_url },
            };

            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
    }
}

async function getPackageDetails(req, res, next) {
    try {
        //Need to refactor this api
        db = req.app.get("db");
        config = req.app.get("config");
        const { student_id } = req.user;
        const { variant_id, coupon_code } = req.body;
        let { version_code } = req.headers;
        let { student_class } = req.user;
        const { locale } = req.user;
        const package = await Package.getNewPackageFromVariantId(
            db.mysql.read,
            variant_id
        );
        const studentCCM = req.user.ccm_data;

        if (package.length > 0) {
            // do not show coupon if emi package
            // if(package[0].type == 'emi') {
            //     package[0].show_coupon = 0;
            // } else {
            //     package[0].show_coupon = 1;
            // }
            package[0].show_coupon = 1;
            //coupon code validation
            /*
            start and end date check : done
            min and max version code check : done
            claim limit check: done
            limit per student check : done
            coupon tg check
            coupon package applicability check : done
            */
            if (coupon_code) {
                const promise = [];
                //start and end date check, min and max version code check
                promise.push(
                    Package.getCouponDetailsUsingCouponCode(
                        db.mysql.read,
                        coupon_code,
                        version_code
                    )
                );
                promise.push(Package.getCouponTg(db.mysql.read, coupon_code));
                //coupon package applicability check
                promise.push(
                    Package.getCouponPackageByCouponAndPackageID(
                        db.mysql.read,
                        coupon_code,
                        package[0].package_id
                    )
                );
                promise.push(
                    Package.getCouponPackages(db.mysql.read, coupon_code)
                );
                const [
                    couponDetails,
                    couponTg,
                    couponPackageId,
                    couponPackages,
                ] = await Promise.all(promise);
                if (
                    (couponDetails.length > 0 &&
                        couponPackageId.length == 0 &&
                        couponPackages.length == 0) ||
                    (couponDetails.length > 0 &&
                        couponPackageId.length > 0 &&
                        couponPackages.length > 0)
                ) {
                    //get total number of times the coupon was claimed and number of times the coupon was claimed by student
                    // console.log(couponDetails);
                    const totalCouponsClaimed = await Package.getGetCouponClaimedTotal(
                        db.mysql.read,
                        coupon_code
                    );
                    if (
                        couponDetails[0].claim_limit == null ||
                        couponDetails[0].claim_limit >
                            totalCouponsClaimed.length
                    ) {
                        var obj = _.countBy(totalCouponsClaimed, function (c) {
                            return c.student_id == student_id;
                        });
                        // console.log(obj)
                        if (!obj.true) obj.true = 0;
                        if (
                            obj.true < couponDetails[0].limit_per_student ||
                            totalCouponsClaimed.length == 0
                        ) {
                            let tgCheck = false;
                            //TG Check
                            if (couponTg.length > 0) {
                                for (let j = 0; j < couponTg.length; j++) {
                                    if (couponTg[j].type == "generic") {
                                        tgCheck = true;
                                        break;
                                    } else if (
                                        couponTg[j].type == "specific" &&
                                        couponTg[j].value == student_id
                                    ) {
                                        tgCheck = true;
                                        break;
                                    } else if (
                                        couponTg[j].type == "target-group"
                                    ) {
                                        const tg = await Package.getTG(
                                            db.mysql.read,
                                            couponTg[j].value
                                        );
                                        if (
                                            tg[0].sql == null &&
                                            (tg[0].user_class ==
                                                student_class ||
                                                tg[0].user_class == null) &&
                                            (tg[0].user_locale == locale ||
                                                tg[0].user_locale == null)
                                        ) {
                                            if (tg[0].user_exam == null) {
                                                tgCheck = true;
                                                break;
                                            } else if (
                                                tg[0].user_exam != null
                                            ) {
                                                let ccmExists = false;
                                                const examArray = tg[0].user_exam.split(
                                                    ","
                                                );
                                                console.log(examArray);
                                                for (
                                                    let k = 0;
                                                    k < studentCCM.length;
                                                    k++
                                                ) {
                                                    if (
                                                        examArray.includes(
                                                            studentCCM[
                                                                k
                                                            ].id.toString()
                                                        )
                                                    ) {
                                                        ccmExists = true;
                                                        break;
                                                    }
                                                }
                                                if (ccmExists) {
                                                    tgCheck = true;
                                                    break;
                                                }
                                            }
                                        } else if (tg[0].sql != null) {
                                            const res = await Package.runTgSql(
                                                db.mysql.read,
                                                tg[0].sql
                                            );
                                            const a = _.find(res, [
                                                "student_id",
                                                student_id,
                                            ]);
                                            if (_.isObject(a)) {
                                                tgCheck = true;
                                                break;
                                            }
                                        }
                                    } else if (
                                        couponTg[j].type == "assortment-type"
                                    ) {
                                        const assortmentDetails = await CourseMysql.getAssortmentDetailsFromId(
                                            db.mysql.read,
                                            [package[0].assortment_id],
                                            student_class
                                        );
                                        if (
                                            assortmentDetails.length &&
                                            assortmentDetails[0]
                                                .assortment_type ==
                                                couponTg[j].value
                                        ) {
                                            tgCheck = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (tgCheck) {
                                //coupon is valid
                                let final_amount = package[0].final_amount;
                                let discountAmount = 0;
                                if (couponDetails[0].value_type == "amount") {
                                    package[0].final_amount =
                                        package[0].final_amount -
                                        couponDetails[0].value;
                                    discountAmount = couponDetails[0].value;
                                } else if (
                                    couponDetails[0].value_type == "percent"
                                ) {
                                    discountAmount =
                                        (couponDetails[0].value *
                                            package[0].final_amount) /
                                        100;
                                    if (
                                        discountAmount >
                                        couponDetails[0].max_limit
                                    ) {
                                        discountAmount =
                                            couponDetails[0].max_limit;
                                    }
                                    package[0].final_amount =
                                        package[0].final_amount -
                                        discountAmount;
                                }
                                console.log(package[0].final_amount);
                                if (
                                    package[0].final_amount <
                                    package[0].min_limit
                                ) {
                                    discountAmount =
                                        final_amount - package[0].min_limit;
                                    package[0].final_amount =
                                        package[0].min_limit;
                                }
                                if (coupon_code.toLowerCase() === "internal") {
                                    package[0].final_amount = 1;
                                }
                                package[0].coupon_code = coupon_code;
                                package[0].coupon_status_text =
                                    "Coupon successfully applied";
                                package[0].coupon_status = "SUCCESS";
                                package[0].coupon_discount = discountAmount;
                                package[0].total_amount =
                                    package[0].final_amount + discountAmount;
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: "SUCCESS",
                                    },
                                    data: package[0],
                                };

                                res.status(responseData.meta.code).json(
                                    responseData
                                );
                            } else {
                                if (coupon_code) {
                                    package[0].coupon_code = coupon_code;
                                    package[0].coupon_status_text =
                                        "Invalid Coupon";
                                    package[0].coupon_status = "FAILURE";
                                }
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: "SUCCESS",
                                    },
                                    data: package[0],
                                };

                                res.status(responseData.meta.code).json(
                                    responseData
                                );
                            }
                        } else {
                            if (coupon_code) {
                                package[0].coupon_code = coupon_code;
                                package[0].coupon_status_text =
                                    "Coupon already claimed";
                                package[0].coupon_status = "FAILURE";
                            }
                            const responseData = {
                                meta: {
                                    code: 200,
                                    success: true,
                                    message: "SUCCESS",
                                },
                                data: package[0],
                            };

                            res.status(responseData.meta.code).json(
                                responseData
                            );
                        }
                    } else {
                        if (coupon_code) {
                            package[0].coupon_code = coupon_code;
                            package[0].coupon_status_text =
                                "Coupon claim limit reached";
                            package[0].coupon_status = "FAILURE";
                        }
                        const responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: "SUCCESS",
                            },
                            data: package[0],
                        };

                        res.status(responseData.meta.code).json(responseData);
                    }
                } else {
                    if (coupon_code) {
                        package[0].coupon_code = coupon_code;
                        package[0].coupon_status_text = "Invalid Coupon";
                        package[0].coupon_status = "FAILURE";
                        const expiryCheck = await Package.getCouponDetailsUsingCouponCodeForExpiryCheck(
                            db.mysql.read,
                            coupon_code
                        );
                        if (expiryCheck.length > 0) {
                            package[0].coupon_status_text =
                                "Your coupon has expired";
                        }
                    }
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: "SUCCESS",
                        },
                        data: package[0],
                    };

                    res.status(responseData.meta.code).json(responseData);
                }
            } else {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: package[0],
                };

                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "Invalid Package ID",
                },
            };

            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
    }
}

// async function getCouponList(req, res, next) {
//     try {
//         const db = req.app.get('db');
//         const config = req.app.get('config');
//         const { mobile, package_id } = req.query;
//         const studentDetails = await Student.getStudentByPhone(db.mysql.read, mobile);
//         const studentID = studentDetails[0].student_id;

//     } catch (e) {
//         console.log(e);
//     }
// }

async function doubtInfo(req, res, next) {
    config = req.app.get("config");
    db = req.app.get("db");
    const studentId = req.user.student_id;

    const now = moment().add(5, "hours").add(30, "minutes");
    const nowFormatted = now.format("YYYY-MM-DD");

    try {
        // check if user is on subscription

        const [student_package, bucketDetails, countryDetails] = await Promise.all ([
            Package.getStudentActivePackageDoubtLimit(db.mysql.read, studentId, nowFormatted),
            Package.getDoubtnutPaywallUserBucketWithPackageId(db.mysql.read, studentId),
            StudentHelper.getUserCountryAndCurrency(db, studentId),
        ]);
        const {country, currency_symbol: currencySymbol} = countryDetails;

        const doubtPackageIds = [];
        for(let i = 0; i<bucketDetails.length; i++) {
            console.log(bucketDetails[i].package_id);
            doubtPackageIds.push(bucketDetails[i].package_id);
        }

        let user_on_subscription = false;
        if (!_.isEmpty(student_package)) user_on_subscription = true;

        let response = {};
        if (user_on_subscription) {
            // student is on subscription
            response = await fetchInfoForUserOnSubscription(
                student_package[0],
                now,
                studentId,
                country,
                doubtPackageIds
            );
        } else {
            // student is NOT on a subscription
            response = await fetchSubscriptionDetails(studentId, country, doubtPackageIds);
        }

        response.payment_help = await fetchPaymentHelp();
        response.currency_symbol = currencySymbol;

        const responseData = {};
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = "SUCCESS";
        responseData.data = response;

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        telemetry.addTelemetry(telemetry.eventNames.subscription, "error", {
            source: "pkgctrl",
        });
        console.log(e);
        next(e);
    }
}

async function offlineSalesGetPackages(req, res, next) {
    try{
        db = req.app.get("db");
        config = req.app.get("config");
        const {package_class, type, year, category, language, board, assortment_id, variant_id, coupon_code, sale_type, previous_package_amount, batch_id, subscriptionId, trial_duration, expert_id, fromPanel=false} = req.query;
        let { mobile, login_id } = req.query;
        if (mobile) {
            mobile = mobile.substr(-10);
        }
        if(type == 'category') {
            const categories = await Package.getPackageSubAssortment(db.mysql.read, package_class);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: categories,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type == 'year') {
            const year = await Package.getPackageYear(db.mysql.read, package_class, category);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: year,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type == 'language') {
            const language = await Package.getPackageLanguage(db.mysql.read, package_class, category, year);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: language,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type == 'board') {
            const board = await Package.getPackageBoard(db.mysql.read, package_class, category, year, language);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: board,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type == 'package') {
            let [studentDetails, packages] = await Promise.all([
                Student.getStudentByPhoneV1(mobile,db.mysql.read),
                Package.getPackages(db.mysql.read, package_class, category, year, language, board),

            ]);
            const subscriptionDetails = await Student.getActiveSubscriptions(db.mysql.read,studentDetails[0].student_id);
            const distinctAssortment = _.map(_.uniqBy(subscriptionDetails,  'subcategory_id'), 'subcategory_id');
            const assortmentArray = [];
            const newpackages = [];
            for(let i=0; i< packages.length; i++) {
                if ((packages[i].is_active_sales && packages[i].pkg_is_active && packages[i].year_exam == year) || distinctAssortment.includes(packages[i].assortment_id)) {
                    if(packages[i].pdf_url) {
                        packages[i].pdf_url = packages[i].pdf_url.replace('pdf_download', 'pdf_open');
                    } else {
                        packages[i].pdf_url = "";
                    }
                    if (!assortmentArray.includes(packages[i].assortment_id)) {
                        assortmentArray.push(packages[i].assortment_id);
                    }
                    const checkTrialEligibility = await CourseV2Mysql.getUserPackagesByAssortment(db.mysql.read, studentDetails[0].student_id, packages[i].assortment_id);
                    if (checkTrialEligibility.length > 0) {
                        packages[i].showTrial = 0;
                    } else {
                        packages[i].showTrial = 1;
                    }
                    newpackages.push(packages[i]);
                }
            }
            console.log(newpackages);
            let batchPackages = [];
            if (sale_type) {
                batchPackages = newpackages;
            } else {
                const batchAssortmentID = await CourseHelper.getBatchByAssortmentListAndStudentId(db,studentDetails[0].student_id, assortmentArray)
                for(let i=0; i< newpackages.length; i++) {
                    if (batchAssortmentID[newpackages[i].assortment_id] == newpackages[i].batch_id) {
                        batchPackages.push(newpackages[i]);
                    }
                }
            }
            if (login_id && studentDetails) {
                Package.insertCRMLogging(db.mysql.write, { student_id: studentDetails[0].student_id, login_id, assortment_list : assortmentArray.join(',') });
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: batchPackages,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type == 'variants') {
            let [studentDetails, doubtnutEmiExperts, variants] = await Promise.all([
                Student.getStudentByPhoneV1(mobile,db.mysql.read),
                Properties.getValueByBucketAndName(db.mysql.read, 'doubtnut_emi', 'expert_ids'),
                sale_type == 'next-emi' && !_.isEmpty(subscriptionId) ? Package.getNextEMIVariant(db.mysql.read, assortment_id, subscriptionId): Package.getVariants(db.mysql.read, assortment_id,
                ),
            ]);
            let batchAssortmentID = 1;
            if (sale_type && batch_id) {
                batchAssortmentID = batch_id;
            } else {
                batchAssortmentID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db,studentDetails[0].student_id, assortment_id);
            }

            const experimentPackages = await PackageContainer.getFlagIDKeysFromAssortmentId(db, [assortment_id], batchAssortmentID || 1)
            variants = variants.filter((item)=> item.batch_id == batchAssortmentID)
            if (!fromPanel || doubtnutEmiExperts.length == 0 || !_.includes(doubtnutEmiExperts[0].value, expert_id)) {
                variants = variants.filter((item)=> item.type != 'emi')
            }
            let experimentPricing = [];
            if (experimentPackages.length) {
                console.log(experimentPackages);
                experimentPricing = await CourseHelper.pricingExperiment(db, experimentPackages, studentDetails[0].student_id);
                experimentPricing = experimentPricing.filter((item) => [assortment_id].indexOf(item.assortment_id) > -1);
            }
            // const pricingExperiments =  await CourseHelper.pricingExperiment(db,[{assortment_id,assortment_id: 'pricing_experiment'}], studentDetails[0].student_id );
            for (let i=0; i< variants.length; i++) {
                const a  = _.find(experimentPricing, ['package_id', variants[i].package_id]);
                if(a) {
                    if(a.variant_id == variants[i].id) {
                        variants[i].is_default = 1;
                    } else {
                        variants[i].is_default = 0;
                    }
                }
                if (variants[i].type == 'emi') {
                    const emiDetails = await Package.getEMIVariants(db.mysql.read, assortment_id, variants[i].package_id);
                    variants[i].name = `${variants[i].name}<br>EMI Plans:`;
                    for (let j=0; j<emiDetails.length;j++) {
                        variants[i].name = `${variants[i].name}<br>EMI-${emiDetails[j].emi_order}, Amount- ${emiDetails[j].display_price}, Duration- ${emiDetails[j].emi_duration}`;
                    }
                    variants[i].id = emiDetails[0].id;
                }
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: variants,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type == 'coupons') {
                const [studentDetails, apiToUse, variantDetails] = await Promise.all([
                    Student.getStudentByPhoneV1(
                        mobile,
                        db.mysql.read
                    ),
                    Properties.getValueByBucketAndName(db.mysql.read, 'coupons', 'dn_cpn_api'),
                    Package.getVariantDetailsById(db.mysql.read, variant_id),
                ])
                let coupon_list = [];

                if (variantDetails.length == 0 || variantDetails[0].type != 'emi') {
                    if (!_.isEmpty(apiToUse) && apiToUse[0].value == '1') {
                        const xAuthToken = Token.sign({ id: studentDetails[0].student_id }, config.jwt_secret_new);
                        const cpnResult = await CouponContainer.getApplicableCouponsFromCpn(xAuthToken, {variant_id, student_id:studentDetails[0].student_id, is_show: 2, sale_type});
                        coupon_list = cpnResult.coupon_list;
                    } else {
                        coupon_list = await CouponContainer.getAllCouponsForStudentUsingVariantID(db, {variant_id, student_class:studentDetails[0].student_class, locale: studentDetails[0].locale, version_code: studentDetails[0].is_online, student_id:studentDetails[0].student_id, is_show: 2});
                    }
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: coupon_list,
                };
                return res.status(responseData.meta.code).json(responseData);
        } else if(type =='coupons_apply') {
            const promise = [];
            let switch_assortment='';
            promise.push(await Student.getStudentByPhoneV1(
                mobile,
                db.mysql.read
            ));
            promise.push(Package.getNewPackageFromVariantId(db.mysql.read, variant_id));
            const [studentDetails, packageInfo] =  await Promise.all(promise);
            if (['upgrade', 'switch'].includes(sale_type)) {
                packageInfo[0].final_amount = packageInfo[0].final_amount- parseInt(previous_package_amount);
            }
            packageInfo[0].min_limit = Math.ceil(packageInfo[0].final_amount * (packageInfo[0].min_limit_percentage / 100));
            if (subscriptionId && sale_type == 'switch') {
                const subDetails = await Package.getPackageDetailsUsingSubscriptionId(db.mysql.read, subscriptionId);
                if (subDetails.length > 0) {
                    switch_assortment = subDetails[0].assortment_id
                    packageInfo[0].min_limit = packageInfo[0].final_amount;
                }
            }
            const xAuthToken = Token.sign({ id: studentDetails[0].student_id }, config.jwt_secret_new);
            const coupon_data = await CouponContainer.fetchCouponApplyData(db, studentDetails[0], coupon_code , packageInfo, studentDetails[0].is_online, xAuthToken, switch_assortment);
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: "INVALID COUPON",
                },
                data: coupon_data,
            };
            if (coupon_data.status == 'SUCCESS') {
                responseData.meta.message = 'SUCCESS';
                responseData.meta.success = true;
            }
            return res.status(responseData.meta.code).json(responseData);

        } else if (type =='subject_variants') {
            const variants = await Package.getSubjectVariantsFromAssortmentAndBatchID(db.mysql.read, assortment_id, batch_id);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: variants,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type =='trial') {
            const studentDetails = await Student.getStudentByPhoneV1(mobile,db.mysql.read);
            const result = await PackageContainer.createSubscriptionEntryForTrialV1(db, studentDetails[0].student_id, assortment_id, -1, trial_duration);
            if (!_.isEmpty(result)) {
                await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                    expert_id: expert_id || null,
                    student_id: studentDetails[0].student_id,
                    type: 4,
                    variant_id: assortment_id,
                    sale_type: 'trial',
                });
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: null,
                };
                return res.status(responseData.meta.code).json(responseData);
            } else {
                const responseData = {
                    meta: {
                        code: 500,
                        success: true,
                        message: "FAILURE",
                    },
                    data: null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        } else{
            const classes = await Package.getPackageClasses(db.mysql.read);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: classes,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch(e) {
        console.log(e);
        next(e);
    }
}

async function offlineSalesDeeplink(req, res, next) {
    try{
        db = req.app.get("db");
        config = req.app.get("config");
        const {id, type, assortment_id, view, agent_id} = req.query;
        let { mobile } = req.query;
        if (mobile) {
            mobile = mobile.substr(-10);
        }
        if(type === 'course') {
            const courseDetails = await Package.getCourseDetailsFromAssortmentId(db.mysql.read, id);
            const deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, "COURSE", 'OFFLINE_SALES' ,courseDetails[0].parent ==4 ? `doubtnutapp://course_category?category=Kota Classes&referrer_student_id=` : `doubtnutapp://course_details?id=${id}&referrer_student_id=`);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: deeplink.url,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type === 'lecture') {
            const courseResources = await Package.getCourseResourcesDetailsFromResourceId(db.mysql.read, id);
            const deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, "LECTURE", 'OFFLINE_SALES' , `doubtnutapp://video?qid=${courseResources[0].resource_reference}&page=DEEPLINK&referrer_student_id=`);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: deeplink.url,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type === 'payment') {
            const deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, "PAYMENT", 'OFFLINE_SALES' , `doubtnutapp://vip?variant_id=${id}&page=DEEPLINK&referrer_student_id=`);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: deeplink.url,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else if(type === 'share') {
            const whaLink = 'https://tiny.doubtnut.com/m56ypnxt';
            //First check which whatsapp number was he using
            // const response = await db.mongo.client.db('whatsappdb')
            //     .collection('whatsapp_sessions')
            //     .find({ phone: `91${mobile}` }).sort({ updatedAt: -1 })
            //     .toArray();
            // if (response.length > 0) {
            //     if (moment().diff(moment(response[0].updated_at), 'hours') <= 168) {
            //         // show top icon
            //         if (response.length == 1) {
            //             if(response[0].source.includes('6003008001')) {
            //                 whaLink = 'https://tiny.doubtnut.com/nwd4mf63';
            //             }
            //         }
            //     }
            // }

            const [courseDetails, brochureShareURL] = await Promise.all([Package.getCourseDetailsFromAssortmentId(db.mysql.read, (assortment_id) ? assortment_id: id), Utility.createTinyURL(`https://app.doubtnut.com/share?cli=${mobile}&assortment_id=${(assortment_id) ? assortment_id: id}&view=${view}`, 'brochure_sales_agent')])
            const message = Data.salesCRM.SMS[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].replace('{1}', courseDetails[0].display_name).replace('{2}', brochureShareURL).replace('{3}', whaLink);
            Utility.sendSMSToReferral(config, { mobile: mobile, message, locale: courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
            if (view == 'basic-details' && agent_id) {
                db.mongo.write.collection('crm_expert_share_link_log').save(req.query);
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch(e) {
        console.log(e);
        next(e);
    }
}

async function nkcQc(req, res, next) {
    try {
        db = req.app.get("db");
        const { expert_id, student_id, status } = req.body;
        await Package.updateNkcQc(db.mysql.write, status, expert_id, student_id);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            }
        };
        return res.status(responseData.meta.code).json(responseData);

    } catch(e) {
        console.log(e);
        next(e);
    }
}

async function crmSendDispositionMessage(req, res, next) {
    try {
        const { agent_id, student_id } = req.body;
        db = req.app.get("db");
        config = req.app.get("config");
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
        req.body.isMessageSent = 0;
        req.body.assortmentList = [];
        if (agent_id && student_id) {
            const [result, studentDetails] = await Promise.all([Package.getAssortmentsUsingAgentIdStudentIdFromCrmLogs(db.mysql.read, {agent_id, student_id}), StudentContainer.getById(student_id, db)]);
            if (result.length > 0 && studentDetails.length > 0) {
                const assortmentList = result[0].assortment_list;
                if (assortmentList) {
                    const assortmentArray = assortmentList.split(',');
                    const whaLink = 'https://tiny.doubtnut.com/m56ypnxt';
                    if (assortmentArray.length > 0) {
                        for (let i=0; i < assortmentArray.length; i++) {
                            const [courseDetails, brochureShareURL] = await Promise.all([Package.getCourseDetailsFromAssortmentId(db.mysql.read, assortmentArray[i]), Utility.createTinyURL(`https://app.doubtnut.com/share?cli=${studentDetails[0].mobile}&assortment_id=${assortmentArray[i]}&view=basic-details`, 'brochure_sales_agent')])
                            const message = Data.salesCRM.SMS[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].replace('{1}', courseDetails[0].display_name).replace('{2}', brochureShareURL).replace('{3}', whaLink);
                            Utility.sendSMSToReferral(config, { mobile: studentDetails[0].mobile, message, locale: courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                        }
                        req.body.isMessageSent = 1;
                        req.body.assortmentList = assortmentArray;
                    }
                }
            }
        }
        db.mongo.write.collection('crm_disposition_message_log').save(req.body);
    } catch(e) {
        console.log(e);
        next(e);
    }
}

async function crmGetStudentDetails(req, res, next) {
    try {
        db = req.app.get("db");
        config = req.app.get("config");
        let { mobile, AddOn, student_id } = req.query;
        if (mobile) {
            mobile = mobile.substr(-10);
        }
        if(req.query.AddOn) {
            req.query.AddOn = validateAddOn(req.query.AddOn);
        }
        if (student_id) {
            const stDetails = await StudentContainer.getById(student_id, db);
            mobile= stDetails[0].mobile;
            req.query.mobile = stDetails[0].mobile;
        }
        const isAuthenticated = await panelApiAuthentication(req);
        if (isAuthenticated.status) {
            if (isAuthenticated.replacePrimary) {
                mobile= isAuthenticated.primaryMobile.substr(-10);
            }
            const studentDetails =  await Student.getStudentByPhoneV2(mobile,db.mysql.read);
            if (studentDetails.length >0) {
                const [videoWatched, questionAsked, walletBalance, packageDetails, ccmDetails, locationDetails, leadSource, latestLongForm, codDetails, alternateNumbers, archivedVideoWatched, archivedQuestionAsked, diagTestData] = await Promise.all([
                    Student.getLast30DaysVideoWatched(db.mysql.read, studentDetails[0].student_id),
                    Student.getLast30DaysQuestionsAsked(db.mysql.read, studentDetails[0].student_id),
                    Student.getWalletBalance(db.mysql.read, studentDetails[0].student_id),
                    Student.getActiveSubscriptions(db.mysql.read,studentDetails[0].student_id),
                    Student.getCCMID(db.mysql.read, studentDetails[0].student_id),
                    Student.getStudentLocation(db.mysql.read, studentDetails[0].student_id),
                    Utility.getLeadSourceData('dnCRMLeadAssortmentInfo!qaz@wsx#edc', mobile),
                    Utility.getLatestLongForm(config, studentDetails[0].student_id),
                    PayMySQL.checkActiveCODWithPackageDetailsUsingStudentID(db.mysql.read, studentDetails[0].student_id),
                    Student.getStudentAlternateNumbers(db.mysql.read, studentDetails[0].student_id),
                    Student.getArchivedVideoWatched(db.mysql.read, studentDetails[0].student_id),
                    Student.getArchivedQuestionsAsked(db.mysql.read, studentDetails[0].student_id),
                    TestSeriesMysql.getDiagTestData(db.mysql.read, studentDetails[0].student_id)
                ]);
                const totalVideoWatched = [...archivedVideoWatched,...videoWatched];
                const totalQuestionAsked = [...archivedQuestionAsked,...questionAsked];
                const last30DaysVideoWatched = totalVideoWatched.filter((item) => {
                    return item.created_at >= moment().subtract(1, 'months');
                });
                const last30DaysQuestionAsked = totalQuestionAsked.filter((item) => {
                    return item.timestamp >= moment().subtract(1, 'months');
                });
                for (let i=0; i< packageDetails.length; i++) {
                    packageDetails[i].purchased_on = moment(packageDetails[i].created_at).format('DD MMM YY ');
                    let text = 0;
                    if (packageDetails[i].is_active) {
                        packageDetails[i].text = 'Active - ends on '+ moment(packageDetails[i].master_subscription_end_date).format('DD MMM YY');
                    }  else {
                        if (!_.isNull(packageDetails[i].next_ps_id)) {
                            packageDetails[i].text = 'Inactive - package was switched/upgraded';
                        } else {
                            packageDetails[i].text = 'Inactive - ended on '+ moment(packageDetails[i].master_subscription_end_date).format('DD MMM YY');
                        }
                    }
                }
                const basic_details = {};
                basic_details.joined_since = moment().diff(moment(studentDetails[0].timestamp), 'days');
                basic_details.last_30_days_activity = [`${last30DaysQuestionAsked.length} Questions Asked`, `${last30DaysVideoWatched.length} Video Views`, (last30DaysQuestionAsked.length == 0) ? '0 % Match Rate' : `${parseInt((_.uniq(_.map(last30DaysVideoWatched, 'parent_id')).filter(val => val !== 0).length / last30DaysQuestionAsked.length * 100).toString())} % Match Rate`];
                basic_details.lifetime_activity = [`${totalQuestionAsked.length} Questions Asked`, `${totalVideoWatched.length} Video Views`, (totalQuestionAsked.length == 0) ? '0 % Match Rate' : `${parseInt((_.uniq(_.map(totalVideoWatched, 'parent_id')).filter(val => val !== 0).length / totalQuestionAsked.length * 100).toString())} % Match Rate`];
                if (walletBalance.length) {
                    basic_details.wallet_balance = [`${walletBalance[0].cash_amount} cash`, `${walletBalance[0].reward_amount} rewards`];
                } else {
                    basic_details.wallet_balance = [`0 cash`, `0 rewards`];
                }
                if (isAuthenticated.alternate_numbers.length && !alternateNumbers.length) {
                    const numberArray = [];
                    // studentDetails[0].alternate_numbers = isAuthenticated.alternate_numbers;
                    isAuthenticated.alternate_numbers.map(v => {
                        numberArray.push([studentDetails[0].student_id, v.alternate_number, v.relation])
                    })
                    Student.setStudentAlternateNumbers(db.mysql.write, numberArray);
                }
                studentDetails[0].alternate_numbers = isAuthenticated.alternate_numbers;
                let last5QA=[];
                let lastVideoWatched = [];
                for (let i=0; i <= 7; i++) {
                    if(questionAsked[i]) {
                        let obj = {};
                        obj.question_image = `https://d10lpgp6xz60nq.cloudfront.net/images/${questionAsked[i].question_image}`;
                        obj.is_matched = _.find(videoWatched, ['parent_id', questionAsked[i].question_id]) ? 1 : 0;
                        last5QA.push(obj);
                    }
                    if(videoWatched[i]) {
                        let obj = {};
                        obj.question_image = `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${videoWatched[i].question_id}.png`;
                        obj.question_id = videoWatched[i].question_id;
                        obj.engage_time = videoWatched[i].engage_time;
                        lastVideoWatched.push(obj);
                    }
                }
                if (locationDetails.length) {
                    studentDetails[0].location = `${locationDetails[0].city}, ${locationDetails[0].state}`
                } else {
                    studentDetails[0].location = '';
                }
                if (ccmDetails.length) {
                    studentDetails[0].ccm_id =  ccmDetails[0].list_course;
                }
                if (leadSource && leadSource.data && leadSource.data.assortment_info) {
                    studentDetails[0].assortment_info = leadSource.data.assortment_info;
                } else {
                    studentDetails[0].assortment_info = {};
                }
                const testSeriesData = [];
                if (req.query.AddOn && diagTestData.length > 0) {
                    const questionPromise = [];
                    const resultPromise = [];
                    for (let i=0; i < diagTestData.length; i++) {
                        questionPromise.push(TestSeriesMysql.getQuestionDataByTestId(db.mysql.read, diagTestData[i]['test_id']));
                        resultPromise.push(TestSeriesMysql.getResultDataByTestIdSectionWise(db.mysql.read, diagTestData[i]['test_id'], studentDetails[0].student_id));
                    }
                    const questionPromiseResponse = await Promise.all(questionPromise);
                    const resultPromiseResponse = await Promise.all(resultPromise);
                    for (let i=0; i< questionPromiseResponse.length; i++) {
                        const testSeries = {};
                        testSeries.test_id = diagTestData[i].test_id;
                        testSeries.title = diagTestData[i].title;
                        testSeries.registered_at = diagTestData[i].registered_at;
                        testSeries.sections = [];
                        for (let j=0; j< questionPromiseResponse[i].length; j++) {
                            let section = {};
                            section.section_code = questionPromiseResponse[i][j].section_code;
                            section.total_number_of_questions = questionPromiseResponse[i][j].noq;
                            if (resultPromiseResponse[i].length > 0) {
                                const groupedResult = _.groupBy(resultPromiseResponse[i], 'section_code');
                                section.number_of_questions_attempted = groupedResult[section.section_code].length;
                                section.number_of_correct_answers = _.sumBy(groupedResult[section.section_code], 'is_correct');
                                section.number_of_questions_skipped = _.sumBy(groupedResult[section.section_code], 'is_skipped');
                                section.number_of_incorrect_answers = section.total_number_of_questions - section.number_of_correct_answers - section.number_of_questions_skipped;
                            } else {
                                section.number_of_questions_attempted = 0;
                                section.number_of_correct_answers = 0;
                                section.number_of_questions_skipped = 0;
                                section.number_of_incorrect_answers = section.total_number_of_questions - section.number_of_correct_answers - section.number_of_questions_skipped;
                            }
                            testSeries.sections.push(section);
                        }
                        testSeriesData.push(testSeries);
                    }
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: {
                        studentDetails, basic_details, packageDetails, last5QA, lastVideoWatched, latestLongForm: latestLongForm.latest_long_form_videos, codDetails, testSeriesData
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: false,
                message: "MOBILE NOT FOUND",
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);

    } catch(e) {
        console.log(e);
        next(e);
    }
}

function validateAddOn(addOn) {
    if(addOn) {
        if (addOn[8] != '-') {
            addOn = addOn.slice(0, 8) + "-" + addOn.slice(8);
        }
        if (addOn[13] != '-') {
            addOn = addOn.slice(0, 13) + "-" + addOn.slice(13);
        }
        if (addOn[18] != '-') {
            addOn = addOn.slice(0, 18) + "-" + addOn.slice(18);
        }
        if (addOn[23] != '-') {
            addOn = addOn.slice(0, 23) + "-" + addOn.slice(23);
        }
    }
    return addOn;
}


function getTimetableResponse(courseTimetable, timetable) {
    const weekDayMapping = {
        'Monday': '1',
        'Tuesday': '2',
        'Wednesday': '3',
        'Thursday': '4',
        'Friday': '5',
        'Saturday': '6',
        'Sunday': '7'
    }
    if (courseTimetable) {
        // const labelArray = ;
        // moment("15", "hh").format('LT')
        const distinctScheduleTimes = _.uniq(_.map(courseTimetable, 'schedule_time'));
        const sortedDistinctScheduleTimes = _.sortBy(distinctScheduleTimes);
        sortedDistinctScheduleTimes.map((x) => {
            timetable.tableData[0].push(moment(x, "hh:mm").format('LT'));
            timetable.tableData[1].push([]);
            timetable.tableData[2].push([]);
            timetable.tableData[3].push([]);
            timetable.tableData[4].push([]);
            timetable.tableData[5].push([]);
            timetable.tableData[6].push([]);
        });
        const groupedCourseTimetable = _.groupBy(courseTimetable, 'week_day_num');
        for (let i=1; i < timetable.tableData.length; i++) {
            if (groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]] && groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]].length) {
                for (let j=0; j< groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]].length; j++) {
                    const index =  timetable.tableData[0].findIndex(obj => obj === moment(groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]][j].schedule_time, "hh:mm").format('LT'));
                    // console.log(index);
                    if (index >= 0) {
                        const calender_link = encodeURI(groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]][j].calendar_link.replace('<calendar_title>', groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]][j].calendar_title).replace('<calendar_description>', groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]][j].calendar_description).replace('<group_week_days>', groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]][j].group_week_days));
                        timetable.tableData[i][index].push(`${groupedCourseTimetable[weekDayMapping[timetable.tableData[i][0]]][j].subject_display_name}##${calender_link}`);
                    }
                }
            }
        }
        return timetable;
    }
    return timetable;
}



function getBookResponse(refBooks) {
    const  referenceBooks = {
        heading: "REFERENCE BOOKS",
        note : '<strong>NOTE</strong> -- We will <strong>not provide the scan copy of these books</strong> -- we will, though, provide chapter wise video solutions of all questions of these books - which students can <strong>download as PDF</strong> as well. Please dont commit that you will provide the scan of physical book',
        subjects: [],
    };
    if (refBooks && refBooks.length) {
        const distinctSubjects = _.uniq(_.map(refBooks, 'subject'));
        if (distinctSubjects.length) {
            for (let i=0; i < distinctSubjects.length; i++) {
                const obj = {};
                obj.subjectName = distinctSubjects[i];
                const a =_.filter(refBooks, { 'subject': distinctSubjects[i]});
                if (a.length) {
                   obj.books = a;
                } else{
                    obj.books = [];
                }
                referenceBooks.subjects.push(obj);
            }
        }
    }
    return referenceBooks;
}

function getTeachersResponse(teachersData) {
    const  teachers = {
        heading: "TEACHERS",
        subjects: [],
    };
    if (teachersData && teachersData.length) {
        const distinctSubjects = _.uniq(_.map(teachersData, 'subject'));
        if (distinctSubjects.length) {
            for (let i=0; i < distinctSubjects.length; i++) {
                const obj = {};
                obj.subjectName = distinctSubjects[i];
                const a =_.filter(teachersData, { 'subject': distinctSubjects[i]});
                if (a.length) {
                    obj.teachers = a;
                } else{
                    obj.teachers = [];
                }
                teachers.subjects.push(obj);
            }
        }
    }
    return teachers;
}

function getCompetitionAnalysis(competitionAnalysisData) {
    const  competitionAnalysis = {
        heading: "COMPETITION",
        competitors: [],
    };
    if (competitionAnalysisData && competitionAnalysisData.length) {
        const distinctCompetitors = _.uniq(_.map(competitionAnalysisData, 'comp_id'));
        if (distinctCompetitors.length) {
            for (let i=0; i < distinctCompetitors.length; i++) {
                const obj ={};
                const a =_.filter(competitionAnalysisData, { 'comp_id': distinctCompetitors[i]});
                if (a.length) {
                    obj.comp_id = a[0].comp_id;
                    obj.name = a[0].comp_name;
                    obj.comparison = a;
                    competitionAnalysis.competitors.push(obj);
                }
            }
        }
    }
    return competitionAnalysis;
}

async function panelApiAuthentication(req) {
    if (req.headers &&  req.headers['x-forwarded-for']) {
        const ipArray = req.headers['x-forwarded-for'].split(',');
        const found = ['65.0.59.12'].some(r=> ipArray.includes(r));
        if (found) {
            return {status :true, alternate_numbers: []};
        }
    }
    //do authentication
    if (req.query.mobile && req.query.AddOn) {
        if (req.query.AddOn == '9632c630-9185-11eb-9806-0278d7aae882' || (req.query.is_public)) {
            return {status :true, alternate_numbers: [], replacePrimary : false};
        }
        //call api to get phone number from lead id
        const response = await Utility.getLeadNumber('dnCRMLeadGetLeadNumber!qaz@wsx#edc', req.query.AddOn.split('^')[0]);
        console.log(response);
        console.log(response.lead_phone_number);
        console.log(req.query.mobile);
        if (response && response.status && response.lead_phone_number.substr(-10) == req.query.mobile.substr(-10)){
            return {status :true, alternate_numbers: response.alternate_numbers, replacePrimary : false};
        } else {
            if (response.alternate_numbers.length > 0) {
                const altNumberArray = [];
                response.alternate_numbers.map((v)=>(altNumberArray.push(v.alternate_number)));
                if (altNumberArray.includes(req.query.mobile.toString())) {
                    return { status :true, alternate_numbers: response.alternate_numbers, replacePrimary : true, primaryMobile: response.lead_phone_number.substr(-10)};
                }
            }
            return {status :false, alternate_numbers: [], replacePrimary : false};
        }
    }
    return {status :false, alternate_numbers: [], replacePrimary : false};
}

async function getVariantsResponse(experimentPackages, assortment_id, studentDetails, variants) {
    let experimentPricing = [];
    if (experimentPackages.length) {
        console.log(experimentPackages);
        experimentPricing = await CourseHelper.pricingExperiment(db, experimentPackages, studentDetails[0].student_id);
        experimentPricing = experimentPricing.filter((item) => [assortment_id].indexOf(item.assortment_id) > -1);
    }
    // const pricingExperiments =  await CourseHelper.pricingExperiment(db,[{assortment_id,assortment_id: 'pricing_experiment'}], studentDetails[0].student_id );
    for (let i=0; i< variants.length; i++) {
        const a  = _.find(experimentPricing, ['package_id', variants[i].package_id]);
        if(a) {
            if(a.variant_id == variants[i].id) {
                variants[i].is_default = 1;
            } else {
                variants[i].is_default = 0;
            }
        }
        if(variants[i].is_default == 0) {
            variants.splice(i, 1);
        }
    }
    return variants;
}

function getPDFResponse(sample_pdf) {
    const samplePDFResponse = [];
    if (sample_pdf.length) {
        const distinctSubject = _.uniq(_.map(sample_pdf, 'subject'));
        if (distinctSubject.length) {
            for (let i=0; i < distinctSubject.length; i++) {
                let obj = {};
                obj.subject = distinctSubject[i];
                const a =_.filter(sample_pdf, { 'subject': distinctSubject[i]});
                if (a.length) {
                    obj.data= a;
                } else {
                    obj.data = [];
                }
                samplePDFResponse.push(obj);
            }
        }
    }
    return samplePDFResponse;
}

function getCourseSyllabus(syllabus) {
    const sampleSyllabusResponse = [];
    if (syllabus.length) {
        const distinctSubject = _.uniq(_.map(syllabus, 'subject_display'));
        if (distinctSubject.length) {
            for (let i=0; i < distinctSubject.length; i++) {
                let obj = {};
                obj.subject = distinctSubject[i];
                const a =_.filter(syllabus, { 'subject_display': distinctSubject[i]});
                if (a.length) {
                    obj.data= a;
                } else {
                    obj.data = [];
                }
                sampleSyllabusResponse.push(obj);
            }
        }
    }
    return sampleSyllabusResponse;
}


function getCredibilityResponse(credibilityData) {
    const credibilityResponse = [];
    if (credibilityData.length) {
        const distinctDimension = _.uniq(_.map(credibilityData, 'dimension'));
        if (distinctDimension.length) {
            for (let i=0; i < distinctDimension.length; i++) {
                let obj = {};
                obj.heading = distinctDimension[i];
                const a =_.filter(credibilityData, { 'dimension': distinctDimension[i]});
                if (a.length) {
                    obj.data= a;
                } else {
                    obj.data = [];
                }
                credibilityResponse.push(obj);
            }
        }
    }
    return credibilityResponse;
}

function getRecentHistoryResponse(recentClassesData) {
    if(recentClassesData.length) {
        for (let i=0; i< recentClassesData.length; i++) {
            recentClassesData[i].live_at_display = moment(recentClassesData[i].live_at).format('DD MMM YYYY hh:mm A');
        }
    }
    return recentClassesData;
}

async function crmGetPackageDetails(req, res, next) {
    try{
        db = req.app.get("db");
        config = req.app.get("config");
        const {assortment_id} = req.query;
        let { mobile } = req.query;
        if (mobile) {
            mobile = mobile.substr(-10);
        }
        if(req.query.AddOn) {
            req.query.AddOn = validateAddOn(req.query.AddOn);
        }
        const isAuthenticated = await panelApiAuthentication(req);
        if (isAuthenticated.status) {
            if (isAuthenticated.replacePrimary) {
                mobile= isAuthenticated.primaryMobile;
            }
            const timetableData = {
                'heading': 'TIME - TABLE',
                "info": ["#3 Hours a day", "#7 Days a week"],
                'tableData' : [
                    ["Time/Day"],
                    ["Monday"],
                    ["Tuesday"],
                    ["Wednesday"],
                    ["Thursday"],
                    ["Friday"],
                    ["Saturday"],
                ],
            }
            if (assortment_id) {
                const studentDetails = await Student.getStudentByPhoneV2(mobile,db.mysql.read);
                const batchAssortmentID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db,studentDetails[0].student_id, assortment_id)
                const [teachersData, subjects, testimonials, demoVideos, syllabus, sample_pdf, variantsData, experimentPackages, courseTimetable, referrenceBooks, competitionAnalysisData, whyDoubtnut, credibilityData, recentClassesData, paymentTutorials, basicDetails, courseDNSpecial, subjectVariant, courseTimeTablePDF] = await Promise.all([
                    Package.getCourseTeachers(db.mysql.read, assortment_id),
                    Package.getCourseSubjects(db.mysql.read, assortment_id),
                    Package.getCourseTestimonials(db.mysql.read, assortment_id),
                    Package.getCourseDemoVideos(db.mysql.read, assortment_id),
                    Package.getCourseSyllabus(db.mysql.read, assortment_id),
                    Package.getCourseSamplePDF(db.mysql.read, assortment_id, null),
                    Package.getVariants(db.mysql.read, assortment_id),
                    PackageContainer.getFlagIDKeysFromAssortmentId(db, [assortment_id], batchAssortmentID),
                    Package.getCourseTimeTable(db.mysql.read, assortment_id, batchAssortmentID),
                    Package.getReferrenceBooks(db.mysql.read, assortment_id),
                    Package.getCompetitionAnalysis(db.mysql.read),
                    Package.getWhyDoubtnut(db.mysql.read),
                    Package.getCredibility(db.mysql.read),
                    Package.getRecentHistory(db.mysql.read, assortment_id, batchAssortmentID),
                    Package.getPaymentTutorials(db.mysql.read),
                    Package.getCourseBasicDetails(db.mysql.read, assortment_id),
                    Package.getCourseDnSpecial(db.mysql.read, assortment_id),
                    Package.getSubjectVariants(db.mysql.read, assortment_id, batchAssortmentID),
                    Package.getTimeTablePDF(db.mysql.read, assortment_id, batchAssortmentID),
                ]);
                if (courseTimeTablePDF.length) {
                    timetableData.pdf_url = courseTimeTablePDF[0].pdf_url;
                }
                const variantsWithBatchID = variantsData.filter((item)=> item.batch_id == batchAssortmentID && item.type != 'emi');
                const [ variants, timetable, referenceBooks, teachers, competitionAnalysis, credibility, samplePDF, courseSyllabus, recentClasses ] = await Promise.all([
                    getVariantsResponse(experimentPackages, assortment_id, studentDetails, variantsWithBatchID),
                    getTimetableResponse(courseTimetable, timetableData),
                    getBookResponse(referrenceBooks),
                    getTeachersResponse(teachersData),
                    getCompetitionAnalysis(competitionAnalysisData),
                    getCredibilityResponse(credibilityData),
                    getPDFResponse(sample_pdf),
                    getCourseSyllabus(syllabus),
                    getRecentHistoryResponse(recentClassesData),
                ]);
                if(demoVideos) {
                    basicDetails[0].demo_videos = demoVideos;
                } else {
                    basicDetails[0].demo_videos = [];
                }
                basicDetails[0].inclusions = 'Daily Classes, Daily Homework, Previous Year Papers Video Solutions, Teacher Notes, NCERT Video solutions, Doubt Solving, Weekly Live Interaction, Top Reference Books Solutions, PDF Practice Papers, Weekly Tests';
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: {
                        variants, teachers,  subjects, testimonials, courseSyllabus, samplePDF, timetable, referenceBooks, competitionAnalysis, whyDoubtnut, credibility, recentClasses, paymentTutorials, basicDetails: basicDetails[0], courseDNSpecial, subjectVariant
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            const responseData = {
                meta: {
                    code: 500,
                    success: false,
                    message: "FAILURE",
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: "MOBILE NOT FOUND",
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch(e) {
        console.log(e);
        next(e);
    }
}


async function sendDeeplink(req, res, next) {
    try{
        db = req.app.get("db");
        config = req.app.get("config");
        const {variant_id, coupon_code, mobile, discount_amount, expert_id, type} = req.query;
        //get student id through mobile phone
        const studentDetails = await Student.getStudentByPhoneV1(
            mobile,
            db.mysql.read
        );
        let message;
        if(studentDetails && studentDetails.length > 0) {
            const studentId = studentDetails[0].student_id;
            const package = await Package.getNewPackageFromVariantIdWithCourseDetails(db.mysql.read, variant_id);
            //coupon validation
            if(coupon_code && coupon_code.length > 0) {
                if(package.length > 0) {
                    const link  = await Utility.generateDeepLinkForPayments(config, 'SALES', 'vip', 'ADITYA_USER', variant_id, coupon_code);
                    await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {expert_id, student_id: studentId, type: 2, link: link.url, variant_id, sale_type: type, coupon_code})
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: "SUCCESS",
                        },
                        data: link,
                    };

                    res.status(responseData.meta.code).json(responseData);
                    if(package[0].meta_info === 'HINDI') {
                        message = Data.panelCourseMessages.SMS.payment_link['hi'].replace("{2}", coupon_code ? package[0].final_amount-discount_amount : package[0].final_amount ).replace('{1}', package[0].display_name).replace('{3}', link.url)
                    } else {
                        message = Data.panelCourseMessages.SMS.payment_link['en'].replace("{1}", coupon_code ? package[0].final_amount-discount_amount : package[0].final_amount ).replace('{2}', package[0].display_name).replace('{3}', link.url)
                    }
                    Utility.sendSMSToReferral(config, { mobile: mobile, message, locale: package[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                    // const branchDeeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'SALES', 'ADITYA_USER', package[0].parent ==4 ? `doubtnutapp://course_category?category_id=Kota Classes` : `doubtnutapp://course_details?id=${package[0].assortment_id}&referrer_student_id=`)
                    // Utility.sendSMSToReferral(config, { mobile: mobile, message: Data.panelCourseMessages.SMS.course_link['hi'].replace('{1}', package[0].display_name).replace('{2}', branchDeeplink.url), locale: 'hi' });
                }else{
                    const responseData = {
                        meta: {
                            code: 200,
                            success: false,
                            message: "Package not found",
                        },
                        data: null,
                    };

                    res.status(responseData.meta.code).json(responseData);
                }
            } else {
                const link  = await Utility.generateDeepLinkForPayments(config, 'SALES', 'vip', 'SALES_PANEL', variant_id, '');
                await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {expert_id, student_id: studentId, type: 2, link: link.url, variant_id, sale_type: type})
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: link,
                };

                res.status(responseData.meta.code).json(responseData);
                if(package[0].meta_info === 'HINDI') {
                    message = Data.panelCourseMessages.SMS.payment_link['hi'].replace("{2}", coupon_code ? package[0].final_amount-discount_amount : package[0].final_amount ).replace('{1}', package[0].display_name).replace('{3}', link.url)
                } else {
                    message = Data.panelCourseMessages.SMS.payment_link['en'].replace("{1}", coupon_code ? package[0].final_amount-discount_amount : package[0].final_amount ).replace('{2}', package[0].display_name).replace('{3}', link.url)
                }
                Utility.sendSMSToReferral(config, { mobile: mobile, message, locale: package[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                // const branchDeeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'SALES', 'ADITYA_USER', package[0].parent ==4 ? `doubtnutapp://course_category?category_id=Kota Classes` : `doubtnutapp://course_details?id=${package[0].assortment_id}&referrer_student_id=`)
                // Utility.sendSMSToReferral(config, { mobile: mobile, message: Data.panelCourseMessages.SMS.course_link['hi'].replace('{1}', package[0].display_name).replace('{2}', branchDeeplink.url), locale: 'hi' });
            }
        }else{
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: "Student not found",
                },
                data: null,
            };

            res.status(responseData.meta.code).json(responseData);
        }

    }catch(e) {
        console.log(e);
        next(e);
    }
}

async function doubtStatus(req, res, next) {
    config = req.app.get("config");
    db = req.app.get("db");

    const responseData = {};
    responseData.data = {};

    const studentId = req.user.student_id;
    const studentClass = req.user.student_class;

    const {country, currency_symbol: currencySymbol} = await StudentHelper.getUserCountryAndCurrency(db, studentId);

    const subscriptionInfo = {};
    const questionInfo = {};

    let isStudentEligibleForPayWall = false;

    const now = moment().add(5, "hours").add(30, "minutes");

    const nowFormatted = now.format("YYYY-MM-DD");
    let promise = [];

    console.log('country', country);
    // Gulf Country Users
    if (country != 'IN') {
        try {
            let [userQuestionCountRedis, bucketDetails, student_package] = await Promise.all([
                StudentRedis.getUserQuestionAskCountForDoubtnutPaywallFromRedis(db.redis.read, studentId),
                Package.getDoubtnutPaywallUserBucketWithPackageId(db.mysql.read, studentId),
                Package.getStudentActivePackageDoubtLimit(db.mysql.read, studentId, nowFormatted),
            ]);
            bucketDetails = bucketDetails

            userQuestionCountRedis = JSON.parse(userQuestionCountRedis);

            const doubtPackageIds = [];
            for(let i = 0; i<bucketDetails.length; i++) {
                console.log(bucketDetails[i].package_id);
                doubtPackageIds.push(bucketDetails[i].package_id);
            }
            console.log('doubtPackageIds', doubtPackageIds);

            if (!_.isEmpty(student_package)) {
                subscriptionInfo.status = true;
                subscriptionInfo.end_date = student_package[0].end_date;
                subscriptionInfo.image_url = student_package[0].image_url_rectangle;

                const end = moment(subscriptionInfo.end_date, "YYYY-MM-DD");

                subscriptionInfo.ends_in_days = end.diff(nowFormatted, "days");

                if (
                    subscriptionInfo.ends_in_days <=
                    Data.doubtPayWallReminderThreshold
                ) {
                    subscriptionInfo.alert_view = true;
                    subscriptionInfo.alert_view_text = `Your VIP Expires${
                        subscriptionInfo.ends_in_days == 0
                            ? " Today"
                            : subscriptionInfo.ends_in_days == 1
                            ? ` In ${subscriptionInfo.ends_in_days} day`
                            : ` In ${subscriptionInfo.ends_in_days} days`
                    }`;

                    // check if the dialog has been seen by the user

                    const is_dialog_seen = await db.redis.read.getAsync(
                        `subscription_${studentId}_${nowFormatted}`
                    );

                    if (_.isEmpty(is_dialog_seen)) {
                        subscriptionInfo.dialog_view = true;
                        const packageList = await fetchGulfCountriesDoubtPackages(studentId, doubtPackageIds, country, false);

                        subscriptionInfo.dialog_view_info = {};
                        subscriptionInfo.dialog_view_info.is_cancel = true;
                        subscriptionInfo.dialog_view_info.description_1 =
                            country != 'IN' ? 'Buy Doubt Gold Pass' : 'Doubt Gold Pass Kharide';
                        subscriptionInfo.dialog_view_info.description_2 =
                        country != 'IN' ? 'And Ask Unlimited\nDoubts Everyday' : 'Aur Pooche Unlimited\nDoubts Har Din';
                        subscriptionInfo.dialog_view_info.package = {};
                        subscriptionInfo.dialog_view_info.package.list = packageList;

                        const expiry_in_seconds = moment(now)
                            .endOf("day")
                            .diff(now, "seconds");

                        console.log("expiry_in_seconds", expiry_in_seconds);
                        db.redis.write
                            .multi()
                            .set(`subscription_${studentId}_${nowFormatted}`, 1)
                            .expire(
                                `subscription_${studentId}_${nowFormatted}`,
                                expiry_in_seconds
                            )
                            .execAsync();
                    }
                }
            } else {
                console.log('bucketdetails',bucketDetails.length);
                console.log('bucketdetails',bucketDetails);
                console.log('userQuestionCountRedis',userQuestionCountRedis);
                console.log('userQuestionCountRedis',_.isEmpty(userQuestionCountRedis));
                if (_.isEmpty(bucketDetails) || (_.isEmpty(userQuestionCountRedis) && parseInt(bucketDetails[0].value) != 0)) {
                    const kafkaData = {
                        student_id: studentId,
                    };
                    kafka.publish(kafka.topics.doubtnutPaywallQuestionCount, 1, kafkaData);
                    const responseData = {
                        data: {},
                        meta: {
                            code: 200,
                            success: true,
                            message: "SUCCESS",
                        },
                    };
                    console.log('true paywall');

                    return res.status(responseData.meta.code).json(responseData);
                }

                if (_.isEmpty(userQuestionCountRedis)) {
                    userQuestionCountRedis = {};
                    userQuestionCountRedis.question_ask_total_count = 0;
                }
                questionInfo.question_limit_for_interval = parseInt(bucketDetails[0].value);
                questionInfo.asked_in_interval = userQuestionCountRedis.question_ask_total_count;
                questionInfo.remaining = questionInfo.question_limit_for_interval - questionInfo.asked_in_interval;

                let isUserBlocked = false;
                if (questionInfo.remaining <= 0) {
                    // await setTimerByStudentId(studentId);
                    isUserBlocked = true;
                }

                if (isUserBlocked) {
                    const packageList = await fetchGulfCountriesDoubtPackages(studentId, doubtPackageIds, country, false);
                    await prepareDialogView(
                        questionInfo,
                        studentId,
                        questionInfo.question_asked_limit_for_interval,
                        packageList,
                        country,
                    );
                }
                if (questionInfo.asked_in_interval != 0 && questionInfo.remaining > 0 && (bucketDetails.legth == 0 || bucketDetails[0].dn_property_bucket_id != '7135')) {
                    await prepareAlertView(questionInfo, questionInfo.remaining);
                } else if (questionInfo.asked_in_interval != 0 && questionInfo.remaining == 1 && bucketDetails.length && bucketDetails[0].dn_property_bucket_id == '7135') {
                    await prepareAlertView(questionInfo, questionInfo.remaining);
                }
            }

            responseData.data.subscription = subscriptionInfo;
            responseData.data.question = questionInfo;

            responseData.meta = {};
            responseData.meta.code = 200;
            responseData.meta.success = true;
            responseData.meta.message = "SUCCESS";

            return res.status(responseData.meta.code).json(responseData);
        } catch (e) {
            console.error('Doubt Paywall Error:', e);
            next(e);
        }
    }

    promise.push(
        Properties.getValueByBucketAndName(
            db.mysql.read,
            "doubt_limit",
            "min_student_id"
        )
    );
    promise.push(Package.getStudentDoubtPaywallCount(db.mysql.read));
    promise.push(Package.isStudentInDoubtPaywall(db.mysql.read, studentId));
    const [
        minStudentIdForDoubtLimit,
        studentsInBucketSoFar,
        isStudentInPaywall,
    ] = await Promise.all(promise);

    if (isStudentInPaywall.length > 0)
    {
        isStudentEligibleForPayWall = true;
    }
    else if (studentsInBucketSoFar[0].count <= Data.doubtPayWallMaxUsers &&
            studentId >= minStudentIdForDoubtLimit[0].value &&
            studentId % 2 == 0 && studentClass >= 11 && studentClass <= 13) {
            Package.setStudentInDoubtPaywall(db.mysql.write, studentId);
            isStudentEligibleForPayWall = true;
        }


    if (!isStudentEligibleForPayWall) {
        const responseData = {
            data: {},
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    }

    try {
        const student_package = await Package.getStudentActivePackageDoubtLimit(
            db.mysql.read,
            studentId,
            nowFormatted
        );

        if (!_.isEmpty(student_package)) {
            subscriptionInfo.status = true;
            subscriptionInfo.end_date = student_package[0].end_date;
            subscriptionInfo.image_url = student_package[0].image_url_rectangle;

            const end = moment(subscriptionInfo.end_date, "YYYY-MM-DD");

            subscriptionInfo.ends_in_days = end.diff(nowFormatted, "days");

            if (
                subscriptionInfo.ends_in_days <=
                Data.doubtPayWallReminderThreshold
            ) {
                subscriptionInfo.alert_view = true;
                subscriptionInfo.alert_view_text = `Your VIP Expires${
                    subscriptionInfo.ends_in_days == 0
                        ? " Today"
                        : subscriptionInfo.ends_in_days == 1
                        ? ` In ${subscriptionInfo.ends_in_days} day`
                        : ` In ${subscriptionInfo.ends_in_days} days`
                }`;

                // check if the dialog has been seen by the user

                const is_dialog_seen = await db.redis.read.getAsync(
                    `subscription_${studentId}_${nowFormatted}`
                );

                if (_.isEmpty(is_dialog_seen)) {
                    subscriptionInfo.dialog_view = true;
                    const packageList = await fetchDefaultDoubtPackages(
                        studentId,
                        false
                    );

                    subscriptionInfo.dialog_view_info = {};
                    subscriptionInfo.dialog_view_info.is_cancel = true;
                    subscriptionInfo.dialog_view_info.description_1 =
                        "Doubt Gold Pass Kharide";
                    subscriptionInfo.dialog_view_info.description_2 =
                        "Aur Pooche Unlimited\nDoubts Har Din";
                    subscriptionInfo.dialog_view_info.package = {};
                    subscriptionInfo.dialog_view_info.package.list = packageList;

                    const expiry_in_seconds = moment(now)
                        .endOf("day")
                        .diff(now, "seconds");

                    console.log("expiry_in_seconds", expiry_in_seconds);
                    db.redis.write
                        .multi()
                        .set(`subscription_${studentId}_${nowFormatted}`, 1)
                        .expire(
                            `subscription_${studentId}_${nowFormatted}`,
                            expiry_in_seconds
                        )
                        .execAsync();
                }
            }
        } else {
            subscriptionInfo.status = false;

            // check for user question asked for the day
            promise = [];

            promise.push(
                Package.getTotalQuestionCountByStudentId(
                    db.mysql.read,
                    studentId
                )
            );
            promise.push(
                Properties.getValueByBucketAndName(
                    db.mysql.read,
                    "doubt_limit",
                    "question_ask_limit"
                )
            );
            promise.push(fetchDefaultDoubtPackages(studentId, false));

            const [
                studentQuestionCount,
                questionAskLimit,
                packageList,
            ] = await Promise.all(promise);

            const question_asked_limit_for_interval = questionAskLimit[0].value;
            questionInfo.asked_in_interval =
                studentQuestionCount[0].question_count;
            questionInfo.question_limit_for_interval = question_asked_limit_for_interval;

            questionInfo.remaining =
                questionInfo.question_limit_for_interval -
                questionInfo.asked_in_interval;

            // let isUserBlocked = await isUserBlockedFromQuestionAsk(studentId);
            let isUserBlocked = false;
            if (questionInfo.remaining <= 0) {
                // await setTimerByStudentId(studentId);
                isUserBlocked = true;
            }

            if (isUserBlocked) {
                await prepareDialogView(
                    questionInfo,
                    studentId,
                    question_asked_limit_for_interval,
                    packageList
                );
            } else if (
                questionInfo.remaining <= Data.doubtPayWallQuestionThreshold &&
                studentQuestionCount[0].question_count > 5
            ) {
                await prepareAlertView(questionInfo, questionInfo.remaining);
            }
        }

        responseData.data.subscription = subscriptionInfo;
        responseData.data.question = questionInfo;

        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = "SUCCESS";

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        telemetry.addTelemetry(telemetry.eventNames.subscription, "error", {
            source: "pkgctrl",
        });
        console.log(e);
        next(e);
    }
}



async function doubtTrial(req, res, next) {
    console.log("here");
    config = req.app.get("config");
    db = req.app.get("db");
    let { country } = req.headers;
    if (!country) {
        country = 'IN';
    }

    let data;
    try {
        data = {
            status: "SUCCESS",
            title: `Your trial has been successfully activated`,
            message: `Please note that you will be charged after your trial period expires.`,
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: "SUCCESS",
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}


async function doubtBillingInfo(req, res, next) {
    config = req.app.get("config");
    db = req.app.get("db");
    let {country} = req.headers;
    if (!country) {
        country = 'IN';
    }

    const studentId = req.user.student_id;

    let responseData;

    try {
        //check if user has a package
        let hadDoubtPackage = await Package.getStudentHasHadDoubtPackage(db.mysql.read, studentId, country);

        let variantInfo;
            if (hadDoubtPackage.length == 0) {// trial info


                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: {
                        "title": "Affordable Tutoring only at $10 per Hour!",
                        "subtitle": "Free Trial Class if you Book Now!",
                        "product_id": DataUS.subscriptionId,
                        "description": [
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "Choose topics you find difficult for your Tutoring Session"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "Choose your convenient time for Tutoring Session"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "Ask Unlimited Doubts via this App"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "90000+ Detailed Video Solutions"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "50+ Solved Practice Tests with Video Solutions"
                            },
                        ],
                        "package_text": `Pay only $0.99 to get started`,
                        "button_text": `Continue`,
                        "billing_info": {
                            "type": "trial",
                            "reason": "start with 7 days trial",
                        },
                        "disclaimer": ""
                    },
                };
            } else {
                // has had a package
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "SUCCESS",
                    },
                    data: {
                        "title": "Affordable Tutoring only at $10 per Hour!",
                        "product_id": DataUS.subscriptionId,
                        "subtitle": `Free Trial Class if you Book Now!`,
                        "description": [
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "Choose topics you find difficult for your Tutoring Session"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "Choose your convenient time for Tutoring Session"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "Ask Unlimited Doubts via this App"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "90000+ Detailed Video Solutions"
                            },
                            {
                                "image_url": `${Data.cdnUrl}/images/tick_mark_green.webp`,
                                value: "50+ Solved Practice Tests with Video Solutions"
                            },
                        ],
                        "package_text": `Pay only $0.99 to get started`,
                        "button_text": `Continue`,
                        "billing_info": {
                            "type": "regular",
                            "reason": "subscribe user",
                        },
                        // "disclaimer": "The Doubtnut monthly subscription will continue to auto renew every month until you cancel. You can cancel anytime from Google Play Subscriptions, effective at the end of the month."
                        "disclaimer": ""
                    },
                };
            }
        res.status(responseData.meta.code).json(responseData);

        } catch (e) {
            console.log(e);
            next(e);
        }

}



function generateUsername(firstname, lastname, username){
    let name = "";
    if (firstname) {
        name = firstname;
        if (lastname) {
            name = `${firstname} ${lastname}`;
        }
    } else {
        name = username;
    }
    return name;
}

async function doubtSubscriptionDo(req, res, next) {
    config = req.app.get("config");
    db = req.app.get("db");
    let { country } = req.headers;
    if (!country) {
        country = 'IN';
    }
    const type = req.body.type;
    const studentId = req.user.student_id;
    const reason = req.body.reason;

    let plan_id;
    let variant_id,variantInfo;

    try {


        if(type== "trial" || type == "extend" || type == "regular")
        {

            //feedback sumbit
            if(type == "extend" || type == "regular") {
                try {
                    const feedback = {
                        reason: req.body.reason,
                        type: req.body.type || 'end',
                        student_id: req.user.student_id,
                        class: req.user.student_class,
                        mobile: req.user.mobile,
                        country_code: req.user.country_code,
                        email: req.user.student_email,
                        username: generateUsername(req.user.student_fname, req.user.student_lname, req.user.student_username),
                        country,
                    };
                    Feedback.usAppFeedback(db.mysql.write, feedback);
                } catch (e) {
                    console.log(e);
                }
            }

            try {
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


                console.log("flagrResp", flagrResp);

                if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload && flagrResp[exp].payload.package_variant) {
                    variant_id = flagrResp[exp].payload.package_variant;
                }
                variantInfo = await Package.getVariantDetails(db.mysql.read, variant_id);

            } catch (e) {
                console.log(e);
                variantInfo = await Package.getDefaultDoubtPackageByCountry(db.mysql.read, country);
            }

            variant_id = variantInfo[0].id;
            let variantDetails;
            let hadPackage = await Package.getStudentHasHadDoubtPackage(db.mysql.read, studentId, country);
            if(type == "trial" && hadPackage.length ==0)
            {
                const paypalSubscriptionInfo = await PaypalSubscription.getByVariantIdAndTrial(db.mysql.read,variant_id, 1 );
                console.log(paypalSubscriptionInfo);
                if(paypalSubscriptionInfo.length)
                {

                    plan_id = paypalSubscriptionInfo[0].plan_id;
                    variant_id = paypalSubscriptionInfo[0].trial_variant_id;
                    variantDetails = await Package.getVariantDetails(db.mysql.read, variant_id);

                }
                else {
                    throw  new Error("plan id not found");
                }

            }

            else if(type == "extend" && hadPackage.length == 1 && hadPackage[0].is_active == 1 && hadPackage[0].amount == -1)
            {

                const paypalSubscriptionInfo = await PaypalSubscription.getByVariantIdAndTrial(db.mysql.read,variant_id, 1 );
                if(paypalSubscriptionInfo.length)
                {
                    plan_id = paypalSubscriptionInfo[0].plan_id;
                    variant_id = paypalSubscriptionInfo[0].trial_variant_id;
                    variantDetails = await Package.getVariantDetails(db.mysql.read, variant_id);

                }
                else {
                    throw  new Error("plan id not found");
                }
            }

            else if(type == "regular" && hadPackage.length)
            {
                const paypalSubscriptionInfo = await PaypalSubscription.getByVariantIdAndTrial(db.mysql.read,variant_id, 0 );
                if(paypalSubscriptionInfo.length)
                {
                    plan_id = paypalSubscriptionInfo[0].plan_id;
                    variant_id = paypalSubscriptionInfo[0].subscription_variant_id;
                    variantDetails = await Package.getVariantDetails(db.mysql.read, variant_id);
                }
                else {
                    throw  new Error("plan id not found");
                }

            }


            const insertObj = {};

            insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
            insertObj.payment_for = "doubt";
            insertObj.amount = variantDetails[0].base_price;
            insertObj.student_id = studentId;
            insertObj.status = 'INITIATED';
            insertObj.source = 'PAYPAL';
            insertObj.currency = "USD";
            insertObj.total_amount = variantDetails[0].base_price;
            insertObj.variant_id = variant_id;

            const {buyLink , partner_order_id }  = await PayPalHelper.getSubscriptionLink(plan_id, insertObj.order_id, req.user);

            insertObj.partner_order_id = partner_order_id;


            //get plan on
            const result = await PayMySQL.createPayment(db.mysql.write, insertObj);

            console.log(buyLink);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { url: buyLink, amount: variantDetails[0].base_price},
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        else if(req.body.type == "cancel")
        {

            const toCancelSubscription = await PaypalSubscription.getActiveSubscriptionByStudentId(db.mysql.read, studentId);

            try {
                for (let i = 0; i < toCancelSubscription.length; i++) {
                    await PayPalHelper.cancelSubscription(toCancelSubscription[i].subscription_id, reason);
                    await PaypalSubscription.cancelSubscriptionByStudentAndSubscriptionId(db.mysql.write, studentId, toCancelSubscription[i].subscription_id);
                }
            }
            catch(e){
                throw new Error("Unable to cancel subscription");
            }

            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: "SUCCESS",
                },
                data: {
                    "title":"SUCCESS",
                    "subtitle":"Your subscription has been cancelled",
                    "description":"We are unhappy to see you go",

                },
            };
           return res.status(responseData.meta.code).json(responseData);
        }

        else{
            const responseData = {
                meta: {
                    code: 500,
                    success: false,
                    message: "FAILURE",
                },
                data: {
                    "message":"No supported action provided",

                },
            };
            return res.status(responseData.meta.code).json(responseData);

        }


    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    info,
    status,
    feedbackSubmit,
    planDays,
    trial,
    infoForPanel,
    getVariantInfo,
    setStudentPackage,
    getSubscriptionStatus,
    getPaymentInfo,
    followUp,
    getPackageDetails,
    doubtInfo,
    doubtStatus,
    doubtTrial,
    doubtBillingInfo,
    doubtSubscriptionDo,
    sendDeeplink,
    offlineSalesDeeplink,
    offlineSalesGetPackages,
    crmGetPackageDetails,
    crmGetStudentDetails,
    crmSendDispositionMessage,
    nkcQc
};
