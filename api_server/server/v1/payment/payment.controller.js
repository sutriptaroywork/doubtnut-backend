/* eslint-disable no-unused-vars */
const request = require('request');
const _ = require('lodash');
const Razorpay = require('razorpay');
const moment = require('moment');
const axios = require('axios');
const PayMySQL = require('../../../modules/mysql/payment');
const Properties = require('../../../modules/mysql/property');
const Student = require('../../../modules/mysql/student');
const StudentHelper = require('../../../modules/student');
const ContestMysql = require('../../../modules/contest');
const PackageContainer = require('../../../modules/containers/package');
const newtonNotifications = require('../../../modules/newtonNotifications');
const PayConstant = require('../../../modules/constants/paymentPackage');
const PaytmHelper = require('../../../modules/paytm/helper');
const PaypalHelper = require('../../../modules/paypal/helper');
const Utility = require('../../../modules/utility');
const UtilityEncrypt = require('../../../modules/Utility.encryption');
const UtilityTranslate = require('../../../modules/utility.translation');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CouponMySQL = require('../../../modules/mysql/coupon');
const logger = require('../../../config/winston').winstonLogger;
const Data = require('../../../data/data');
const DataPayment = require('../../../data/data.payment');
const DataUS = require('../../../data/data.us');
const PaymentConstants = require('../../../data/data.payment');
const RzpHelper = require('../../../modules/razorpay/helper');
const DNProperty = require('../../../modules/mysql/property');
const NudgeMysql = require('../../../modules/mysql/nudge');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const PaymentHelper = require('../../helpers/payment');
const RazorpayHelper = require('../../../modules/razorpay/helper');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TGHelper = require('../../helpers/target-group');
const CouponContainer = require('../../../modules/containers/coupon');
const PhoneUtility = require('../../../modules/Utility.phone');
const CourseHelper = require('../../helpers/course');
const PaymentRedis = require('../../../modules/redis/payment');
const EventsModule = require('../../../modules/events/events');
const OtpFactory = require('../../helpers/otpfactory/otpfactoryservices.helper');
const ShipRocketHelper = require('../../../modules/shiprocket/helper');
const SMS2F = require('../../../modules/Utility.SMS');
const messages = require('../../helpers/sendsms.handler');
const Token = require('../../../modules/token');
const axiosInstance = require('../../../modules/axiosInstances');
const MailUtility = require('../../../modules/Utility.mail');
const GrayQuestHelper = require('../../../modules/grayquest/helper');
const ShopseHelper = require('../../../modules/shopse/helper');
const redisUtility = require('../../../modules/redis/utility.redis');
const SlackUtility = require('../../../modules/Utility.Slack');
const kafka = require('../../../config/kafka');
const StudentContainer = require('../../../modules/containers/student');

let db;
let config;

function addUserPackageBuyFeedPost(studentId) {
    const data = {
        msg: Data.feed_post.live_class.msg[Math.floor(Math.random() * (Data.feed_post.live_class.msg.length))],
        type: 'dn_activity',
        student_id: studentId,
        image_url: Data.feed_post.live_class.image_url[Math.floor(Math.random() * (Data.feed_post.live_class.image_url.length))],
        activity_title: 'buyer_post_click',
        activity_type: 'live_class',
        event_name: 'vip_page_open',
        source: 'lc_vip_post_feed',
        deeplink: encodeURI(Data.feed_post.live_class.deeplink_url),
        show_button: false,
        show_play: false,
        disable_lcsf_bar: true,
        is_active: true,
        is_deleted: false,
    };
    db.mongo.write.collection('tesla_liveclass').save(data);
}

async function rzpCheckSuccessPayment(razorPayResponse, updateObj, notesObj) {
    let unixCreatedAt = razorPayResponse.items[0].created_at;
    for (let i = 0; i < razorPayResponse.count; i++) {
        updateObj.partner_txn_id = razorPayResponse.items[i].id;
        updateObj.partner_order_id = razorPayResponse.items[i].order_id;
        updateObj.mode = razorPayResponse.items[i].method;
        updateObj.method = razorPayResponse.items[i].wallet || razorPayResponse.items[i].bank;
        unixCreatedAt = Math.max(unixCreatedAt, razorPayResponse.items[i].created_at);
        if (razorPayResponse.items[i].status == 'captured') {
            updateObj.status = 'SUCCESS';
            if (_.isEmpty(notesObj.notes)) {
                notesObj.notes = razorPayResponse.items[i].notes;
            }
            updateObj.partner_txn_time = moment.unix(unixCreatedAt).add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            return true;
        }
    }
    updateObj.partner_txn_time = moment.unix(unixCreatedAt).add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');

    return false;
}

async function CODPaymentComplete(partner_txn_response, student_id) {
    try {
        const uniqueCodeInfo = await PayMySQL.checkUniqueCodeValidity(db.mysql.read, partner_txn_response.unique_code);
        let responseData;
        if (uniqueCodeInfo.length) {
            const payment_info = await PayMySQL.getPaymentInfoById(db.mysql.read, uniqueCodeInfo[0].payment_info_id);

            if (payment_info[0].status == 'INITIATED') {
                await PayMySQL.updatePaymentByOrderId(db.mysql.write, {
                    status: 'SUCCESS',
                    order_id: payment_info[0].order_id,
                    partner_txn_id: payment_info[0].partner_order_id,
                    mode: 'cash',
                });
                payment_info[0].partner_txn_id = payment_info[0].partner_order_id;
                Package.markSubscriptionInactive(db.mysql.write, uniqueCodeInfo[0].sps_id);
                await PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info, '');
                await PayMySQL.updatePaymentInfoShiprocketSuccessfulOrder(db.mysql.write, {
                    unique_code: partner_txn_response.unique_code,
                    is_active: 0,
                });

                let deeplink;
                if (payment_info[0].variant_id) {
                    const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, payment_info[0].variant_id);
                    if (course_details.length) {
                        deeplink = `doubtnutapp://course_details?id=${course_details[0].assortment_id}`;
                    }
                }
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: {
                        mesage: 'Course Purchased Successfully',
                        deeplink,
                    },
                };
            } else {
                responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'SUCCESS',
                    },
                    data: {
                        mesage: 'Error processing the coupon code',
                    },
                };
            }
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'SUCCESS',
                },
                data: {
                    mesage: 'Error processing the coupon code',
                },
            };
        }

        console.log(responseData);
        return responseData;
    } catch (e) {
        console.log(e);
    }
}

async function razorPayPaymentComplete(razorpay_payment_response, notes, createDeeplink = false, database, configuration) {
    try {
        if (_.isEmpty(db)) {
            db = database;
        }
        if (_.isEmpty(config)) {
            config = configuration;
        }
        let responseData = {};
        const updateObj = {};
        const notesObj = {};
        let { razorpay_order_id } = razorpay_payment_response;
        const { razorpay_payment_id } = razorpay_payment_response;
        let course_details;
        let razorPayResponse;
        const source = 'RAZORPAY';
        let failure_reason;

        const rzp = new Razorpay({
            key_id: config.RAZORPAY_KEY_ID,
            key_secret: config.RAZORPAY_KEY_SECRET,
        });
        let assortment_type; let assortment_id; let
            schedule_type;
        let is_recorded = false;

        notesObj.notes = notes;

        if (razorpay_payment_id) {
            razorPayResponse = await RazorpayHelper.fetchPaymentsByPaymentId(razorpay_payment_id);
            console.log(razorPayResponse);
            razorpay_order_id = razorPayResponse.order_id;

            // modifying the object so that order can be checked in the same way
            razorPayResponse = {
                count: 1,
                items: [JSON.parse(JSON.stringify(razorPayResponse))],
            };
        } else {
            razorPayResponse = await RazorpayHelper.fetchPaymentsByOrderId(razorpay_order_id);
        }
        const payment_info = await PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.write, razorpay_order_id);
        let deeplink = '';
        if (createDeeplink) {
            deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'ADITYA_USER', `doubtnutapp://course_details?id=${assortment_id}`);
        }
        if (_.isEmpty(payment_info)) {
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'FAILURE',
                },
                data: {
                    status: 'FAILURE', reason: 'Invalid Order ID',
                },
            };
            return responseData;
        }

        if (payment_info[0].variant_id) {
            course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, payment_info[0].variant_id);
            if (course_details.length) {
                assortment_type = course_details[0].assortment_type;
                assortment_id = course_details[0].assortment_id;
                schedule_type = course_details[0].schedule_type;
                is_recorded = schedule_type === 'recorded';
            }
        }

        if (payment_info[0].status == 'SUCCESS') {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    status: payment_info[0].status, order_id: payment_info[0].order_id, payment_for: payment_info[0].payment_for, assortment_type, assortment_id, is_recorded, deeplink,
                },
            };
            return responseData;
        }

        const studentId = payment_info[0].student_id;

        updateObj.status = '';
        // Payload For Notification to Send in case Of Failure
        const notificationToSend = JSON.parse(JSON.stringify(PayConstant.notification.notification_payment_failure));
        if (payment_info[0].variant_id != null) {
            notificationToSend.event = 'vip';
            notificationToSend.data = JSON.stringify({
                assortment_id,
                variant_id: payment_info[0].variant_id,
            });
        } else if (payment_info[0].payment_for.toLowerCase() == 'wallet') {
            notificationToSend.event = 'wallet';
        }
        console.log(notificationToSend);

        if (!_.isEmpty(razorPayResponse) && razorPayResponse.count > 0) {
            updateObj.partner_txn_time = moment.unix(razorPayResponse.items[0].created_at).add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            updateObj.partner_txn_response = JSON.stringify(razorPayResponse);

            const paymentStatus = await rzpCheckSuccessPayment(razorPayResponse, updateObj, notesObj);

            if (!paymentStatus) {
                updateObj.status = 'FAILURE';
                updateObj.partner_order_id = razorpay_order_id;
                // if the latest payment is not a success, we can pick the latest index and update payment_failure
                if (razorPayResponse.items[0].error_code) {
                    failure_reason = `${razorPayResponse.items[0].error_description} | ${razorPayResponse.items[0].error_reason}`;
                    PayMySQL.createPaymentFailure(db.mysql.write, {
                        payment_info_id: payment_info[0].id, reason: razorPayResponse.items[0].error_reason, description: razorPayResponse.items[0].error_description, source: razorPayResponse.items[0].error_source, step: razorPayResponse.items[0].error_step,
                    });
                }
                newtonNotifications.sendNotification(studentId, notificationToSend, db.mysql.read);
            }
        } else {
            updateObj.status = 'FAILURE';
            updateObj.partner_order_id = razorpay_order_id;
            newtonNotifications.sendNotification(studentId, notificationToSend, db.mysql.read);
        }

        if (payment_info[0].status == 'RECONCILE' && updateObj.status == 'FAILURE') {
            const subscriptionDetails = await Package.getSubscriptionDetailsWithPaymentInfoIdAndVariantId(db.mysql.write, payment_info[0].id, payment_info[0].variant_id);
            if (!_.isEmpty(subscriptionDetails)) {
                Package.markSubscriptionInactive(db.mysql.write, subscriptionDetails[0].id);
            }
            PayMySQL.createPaymentInfoReconcile(db.mysql.write, {
                payment_info_id: payment_info[0].id,
                status: 'FAILURE',
            });
        }

        if (updateObj.partner_order_id != null) {
            let { mode } = payment_info[0];
            try {
                if (mode == 'upi_collect' && updateObj.mode == 'upi');
                else {
                    mode = updateObj.mode;
                }
                await PayMySQL.updatePaymentByPartnerOrderId(db.mysql.write, {
                    status: updateObj.status, partner_txn_id: updateObj.partner_txn_id, partner_order_id: updateObj.partner_order_id, partner_txn_response: updateObj.partner_txn_response, mode, partner_txn_time: updateObj.partner_txn_time,
                });
            } catch (e) {
                MailUtility.sendMailViaSendGrid(
                    config,
                    PaymentConstants.payments_team.mail_details.autobotMailID,
                    PaymentConstants.payments_team.mail_details.paymentsTechTeamMailID,
                    'PAYMENTS ERROR | Update Payment Info Error',
                    JSON.stringify(e),
                    PaymentConstants.payments_team.mail_details.paymentsTechTeamCCID,
                );
            }
        }

        if (updateObj.method) {
            PayMySQL.setPaymentInfoMeta(db.mysql.write, { payment_info_id: payment_info[0].id, method: updateObj.method });
        }

        if (updateObj.status == 'SUCCESS') {
            payment_info[0].partner_txn_id = updateObj.partner_txn_id;
            try {
                await PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info, notesObj.notes);
            } catch (e) {
                console.log(e);
                MailUtility.sendMailViaSendGrid(
                    config,
                    PaymentConstants.payments_team.mail_details.autobotMailID,
                    PaymentConstants.payments_team.mail_details.paymentsTechTeamMailID,
                    'PAYMENTS ERROR | Success Payment Procedure Error',
                    JSON.stringify(e),
                    PaymentConstants.payments_team.mail_details.paymentsTechTeamCCID,
                );
            }
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    status: 'SUCCESS', order_id: payment_info[0].order_id, payment_for: payment_info[0].payment_for, assortment_type, assortment_id, deeplink,
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'FAILURE',
                },
                data: { status: 'FAILURE', order_id: payment_info[0].order_id, reason: failure_reason },
            };
        }
        return responseData;
    } catch (e) {
        return {
            meta: {
                code: 500,
                success: false,
                message: 'FAILURE',
            },
        };
    }
}

async function razorPayPaymentCompleteVPA(rzpRes, notes, createDeeplink = false, database, configuration) {
    if (_.isEmpty(db)) {
        db = database;
    }
    if (_.isEmpty(config)) {
        config = configuration;
    }
    const razorpay_payment_id = rzpRes.payload.payment.entity.id;
    const redislockKeyName = `PRE_PAYMENT_COMPLETE_${razorpay_payment_id}`;
    if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, redislockKeyName)) {
        return {};
    }
    await redisUtility.setCacheHerdingKeyWithTtll(db.redis.write, redislockKeyName, 5);
    try {
        const virtualAccountId = rzpRes.payload.virtual_account.entity.id;

        const [activeVPA, activeQR, paymentInfoEntry] = await Promise.all([
            PayMySQL.getActiveVPAByVirtualAccountId(db.mysql.read, virtualAccountId),
            PayMySQL.getActiveQRByVirtualAccountId(db.mysql.read, virtualAccountId),
            PayMySQL.getorderIDByPartnerID(db.mysql.write, razorpay_payment_id),
        ]);
        const amount = rzpRes.payload.payment.entity.amount / 100;

        if (!_.isEmpty(paymentInfoEntry) && paymentInfoEntry[0].status == 'SUCCESS') {
            return true;
        }
        if (activeVPA.length) {
            const insertObj = {};
            insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
            insertObj.partner_order_id = razorpay_payment_id;
            insertObj.partner_txn_id = razorpay_payment_id;
            insertObj.partner_txn_response = JSON.stringify(rzpRes.payload.payment.entity);
            insertObj.payment_for = 'WALLET';
            insertObj.amount = amount;
            insertObj.student_id = activeVPA[0].student_id;
            insertObj.status = 'SUCCESS';
            insertObj.source = 'RAZORPAY';
            insertObj.total_amount = amount;
            insertObj.mode = rzpRes.payload.payment.entity.method;
            insertObj.partner_txn_time = moment.unix(rzpRes.created_at).add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, insertObj);
            await WalletUtil.makeWalletTransaction({
                student_id: activeVPA[0].student_id,
                cash_amount: rzpRes.payload.payment.entity.amount / 100,
                type: 'CREDIT',
                payment_info_id: paymentInfoResult.insertId,
                reason: 'add_wallet_payment',
                expiry: null,
            });

            try {
                // const studentInfo = await Student.getById(activeVPA[0].student_id, db.mysql.read);
                const studentInfo = await StudentContainer.getById(activeVPA[0].student_id, db);
                SMS2F.sendSMS(config, 'wallet_add_success', [amount, studentInfo[0].mobile], studentInfo[0].mobile);
                const notificationToSend = JSON.parse(JSON.stringify(PayConstant.walletConstants.notification_payment_success));
                notificationToSend.title = notificationToSend.title.replace('<amount>', amount);
                newtonNotifications.sendNotification(activeVPA[0].student_id, notificationToSend, db.mysql.read);
            } catch (e) {
                console.log(e);
            }
            const smartCollectUpdateObj = {
                amount_paid: rzpRes.payload.virtual_account.entity.amount_paid / 100,
            };
            await PayMySQL.updatePaymentInfoSmartCollect(db.mysql.write, smartCollectUpdateObj, virtualAccountId);
        } else if (activeQR.length) {
            const { payment_info_id } = activeQR[0];
            const payment_info = await PayMySQL.getPaymentInfoById(db.mysql.read, payment_info_id);

            if (amount >= activeQR[0].amount_expected) {
                await Promise.all([
                    PayMySQL.updatePaymentByPartnerOrderId(db.mysql.write, {
                        status: 'SUCCESS', partner_txn_id: razorpay_payment_id, partner_order_id: payment_info[0].partner_order_id, partner_txn_response: JSON.stringify(rzpRes), mode: rzpRes.payload.payment.entity.method, partner_txn_time: moment.unix(rzpRes.created_at).add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
                    }),
                    PayMySQL.updatePaymentInfoQR(db.mysql.write, {
                        payment_info_id: payment_info[0].id, amount_paid: amount,
                    }),
                ]);
                payment_info[0].partner_txn_id = razorpay_payment_id;
                try {
                    await PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info, notes);
                } catch (e) {
                    console.log(e);
                    MailUtility.sendMailViaSendGrid(
                        config,
                        PaymentConstants.payments_team.mail_details.autobotMailID,
                        PaymentConstants.payments_team.mail_details.paymentsTechTeamMailID,
                        'PAYMENTS ERROR | Success Payment Procedure Error',
                        JSON.stringify(e),
                        PaymentConstants.payments_team.mail_details.paymentsTechTeamCCID,
                    );
                }
                await RazorpayHelper.closeVPA(virtualAccountId);
            }
        }
    } catch (e) {
        console.log(e);
    } finally {
        await redisUtility.removeCacheHerdingKeyNew(db.redis.write, redislockKeyName);
    }
}

async function BBPSPaymentComplete(partner_response, student_id) {
    try {
        let responseData = {};
        /*
        {
            "billerBillID": "123456789",
            "paymentDetails": {
            "additionalInfo": {},
            "amountPaid": {
                "currencyCode": "INR",
                    "value":2003000
            },
            "billAmount": {
                "currencyCode": "INR",
                    "value": 2003000
            },
            "instrument": "UPI",
                "uniquePaymentRefID": "CXRA37834"
        },
            "platformBillID": "NUP06112008550345687v4"
        }
        */

        const payment_info = await PayMySQL.getBBPSActivePayment(db.mysql.read, student_id);

        let order_id; let payment_for;
        if (payment_info.length) {
            // course exist and needs to be activated
            // check if wallet_balance is greater than the course amount due
            const final_amount_to_pay = payment_info[0].total_amount - payment_info[0].discount;
            if (partner_response.wallet_balance >= final_amount_to_pay) {
                payment_info[0].partner_txn_id = `BBPS_PI_${partner_response.payment_info_id}`;
                await PayMySQL.updatePaymentByOrderId(db.mysql.write, {
                    partner_txn_id: payment_info[0].partner_txn_id,
                    partner_txn_response: JSON.stringify(partner_response),
                    order_id: payment_info[0].order_id,
                    status: 'SUCCESS',
                    mode: partner_response.paymentDetails.instrument,
                });
                await PayMySQL.setBBPSByStudentAndPaymentInfo(db.mysql.write, {
                    payment_info_id: payment_info[0].id,
                    student_id,
                    unique_payment_ref_id: partner_response.uniquePaymentRefID,
                    platform_transaction_ref_id: partner_response.platformTransactionRefID,
                    platform_bill_id: partner_response.platformBillID,
                    status: 'USED',
                });
                await PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info, {});
            }
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                status: 'SUCCESS',
            },
        };

        return responseData;
    } catch (e) {
        console.log(e);
    }
}

async function paytmPaymentComplete(partner_txn_response, createDeeplink = false) {
    let responseData = {};
    const updateObj = {};
    let course_details;
    let assortment_type; let assortment_id; let
        schedule_type;
    let is_recorded = false;
    const payment_info = await PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.write, partner_txn_response.ORDERID);

    if (_.isEmpty(payment_info)) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Order ID not found',
            },
        };
        return responseData;
    }

    if (payment_info[0].variant_id) {
        course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, payment_info[0].variant_id);
        if (course_details.length) {
            assortment_type = course_details[0].assortment_type;
            assortment_id = course_details[0].assortment_id;
            schedule_type = course_details[0].schedule_type;
            is_recorded = schedule_type === 'recorded';
        }
    }
    let deeplink = '';
    if (createDeeplink) {
        deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'ADITYA_USER', `doubtnutapp://course_details?id=${assortment_id}`);
    }
    if (payment_info[0].status == 'SUCCESS') {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                status: payment_info[0].status, order_id: payment_info[0].order_id, payment_for: payment_info[0].payment_for, assortment_type, assortment_id, is_recorded, deeplink,
            },
        };

        return responseData;
    }

    const paytmTransactionStatus = await PaytmHelper.transactionStatus(payment_info[0].partner_order_id);
    console.log('paytmTransactionStatus', paytmTransactionStatus);

    if (paytmTransactionStatus == 'TXN_SUCCESS') {
        updateObj.status = 'SUCCESS';
    } else if (paytmTransactionStatus == 'TXN_FAILURE') {
        updateObj.status = 'FAILURE';
    } else {
        updateObj.status = 'PENDING';
    }

    updateObj.partner_txn_id = partner_txn_response.TXNID;
    updateObj.mode = partner_txn_response.PAYMENTMODE;
    updateObj.partner_order_id = partner_txn_response.ORDERID;
    updateObj.partner_txn_response = JSON.stringify(partner_txn_response);

    console.log(updateObj);

    await PayMySQL.updatePaymentByPartnerOrderId(db.mysql.write, updateObj);

    if (updateObj.status == 'SUCCESS') {
        payment_info[0].partner_txn_id = updateObj.partner_txn_id;
        await PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info, {});

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                status: 'SUCCESS', order_id: payment_info[0].order_id, payment_for: payment_info[0].payment_for, assortment_type, assortment_id, deeplink,
            },
        };
    } else if (updateObj.status == 'PENDING') {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { status: 'PENDING', order_id: payment_info[0].order_id },
        };
    } else {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'FAILURE',
            },
            data: { status: 'FAILURE', order_id: payment_info[0].order_id },
        };
    }

    return responseData;
}

async function paypalPaymentComplete(partner_txn_response) {
    let responseData = {};
    const updateObj = {};

    // const source = 'PAYPAL';

    const payment_info = await PayMySQL.getPaymentInfoByOrderId(db.mysql.write, partner_txn_response.id);

    console.log(payment_info);
    if (payment_info[0].status == 'SUCCESS') {
        responseData.data = {
            title: 'Congratulations',
            description: 'Your trial has been activated successfully',
            img_url: `${Data.cdnUrl}/images/payment_success_confetti.webp`,
            status: 'SUCCESS',
        };

        return responseData;
    }

    if (_.isEmpty(payment_info)) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Order ID not found',
            },
        };
        return responseData;
    }
    console.log('paypalSubscriptionInfo', 1);

    const paypalSubscriptionInfo = await PaypalHelper.getSubscriptionInfo(payment_info[0].partner_order_id);
    console.log('paypalSubscriptionInfo', paypalSubscriptionInfo);
    const paypalSubscriptionStatus = paypalSubscriptionInfo.status;
    console.log(paypalSubscriptionInfo);
    if (paypalSubscriptionStatus == 'ACTIVE') {
        updateObj.status = 'SUCCESS';
    } else if (paypalSubscriptionStatus == 'APPROVAL_PENDING') {
        updateObj.status = 'PENDING';
    } else {
        updateObj.status = 'FAILURE';
    }

    updateObj.order_id = paypalSubscriptionInfo.custom_id;
    updateObj.partner_txn_response = JSON.stringify(paypalSubscriptionInfo);

    console.log(updateObj);

    await PayMySQL.updatePaymentByOrderId(db.mysql.write, updateObj);

    if (updateObj.status == 'SUCCESS') {
        payment_info[0].partner_txn_id = updateObj.partner_txn_id;

        PaymentHelper.cancelPaypalSubscription(db, payment_info[0].student_id, paypalSubscriptionInfo.id, 'new subscription alloted');

        PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info, {});

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                title: 'Congratulations',
                description: 'Your trial has been activated successfully',
                img_url: `${Data.cdnUrl}/images/payment_success_confetti.webp`,
                status: 'SUCCESS',
            },
        };
    } else if (updateObj.status == 'PENDING') {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { status: 'PENDING', order_id: payment_info[0].order_id },
        };
    } else {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'FAILURE',
            },
            data: { status: 'FAILURE', order_id: payment_info[0].order_id },
        };
    }

    return responseData;
}

async function startPayment(req, res, next) {
    try {
        throw new Error('Update the app');

        /*
        db = req.app.get('db');
        config = req.app.get('config');

        const studentId = req.user.student_id;
        const { amount } = req.body;
        const packageId = req.body.package_id;
        // amount is 0 throw error;

        if (_.isEmpty(amount) || amount == 0 || amount.length == 0) {
            const responseData = {
                meta: {
                    code: 500,
                    success: false,
                    message: 'Invalid amount',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        db.redis.write.multi()
            .set(`subscription_payment_id_${studentId}`, packageId)
            .expire(`subscription_payment_id_${studentId}`, 60 * 60 * 24 * 7)
            .execAsync();

        const insertObj = {};

        insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
        insertObj.payment_for = req.body.payment_for;
        insertObj.payment_for_id = req.body.payment_for_id;
        insertObj.amount = amount;
        insertObj.student_id = studentId;
        insertObj.status = 'INITIATED';
        insertObj.source = req.body.source;

        const responseInfo = {};

        responseInfo.txn_id = insertObj.order_id;

        if (req.body.source == 'RAZORPAY') {
            const rzp = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET,
            });

            const razorpayResponse = await rzp.orders.create({
                amount: amount * 100,
                currency: 'INR',
                receipt: insertObj.order_id,
                payment_capture: true,
            });

            responseInfo.txn_id = razorpayResponse.id;

            insertObj.partner_order_id = razorpayResponse.id;
        } else if (req.body.source == 'PAYTM') {
            responseInfo.txnToken = await PaytmHelper.createTransactionToken(insertObj.order_id, studentId, amount);
        }

        const student_info = await Student.getById(studentId, db.mysql.read);

        responseInfo.email = (!_.isEmpty(student_info[0].student_email)) ? student_info[0].student_email.trim() : `payments+${studentId}@doubtnut.com`;
        responseInfo.phone = (!_.isEmpty(student_info[0].mobile)) ? student_info[0].mobile : studentId;

        const result = await PayMySQL.createPayment(db.mysql.write, insertObj);

        console.log(result);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: responseInfo,
        };

        res.status(responseData.meta.code).json(responseData);
        */
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function completePayment(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        console.log('completePayment', req.body);
        let createDeeplink = false;

        if (!req.headers['user-agent'].includes('okhttp')) {
            createDeeplink = true;
        }

        const { source } = req.body;
        const { country } = req.headers;
        const { student_id } = req.user;

        const partner_txn_response = req.body.payment_response;

        if (source == 'RAZORPAY') {
            responseData = await razorPayPaymentComplete(partner_txn_response, partner_txn_response.notes, createDeeplink);
        } else if (source == 'PAYTM') {
            responseData = await paytmPaymentComplete(partner_txn_response, createDeeplink);
        } else if (source == 'PAYPAL') {
            responseData = await paypalPaymentComplete(partner_txn_response);
        } else if (source == 'BBPS') {
            responseData = await BBPSPaymentComplete(partner_txn_response, student_id);
        } else if (source == 'SHIPROCKET') {
            responseData = await CODPaymentComplete(partner_txn_response, student_id);
        } else if (source == 'GOOGLE' && country == 'US') {
            await PaymentHelper.inAppBillingAck(config, partner_txn_response.purchaseToken, partner_txn_response.subscriptionId);
            const purchaseInfo = await PaymentHelper.inAppBillingPaymentStatus(config, partner_txn_response.purchaseToken, partner_txn_response.subscriptionId);

            const studentId = purchaseInfo.obfuscatedExternalAccountId;
            if (purchaseInfo.paymentState == 2) {
                // create a package with 7 days trial

                const insertObj = {};

                insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
                insertObj.payment_for = 'doubt';
                insertObj.amount = 0;
                insertObj.student_id = studentId;
                insertObj.status = 'SUCCESS';
                insertObj.source = 'GOOGLE';
                insertObj.currency = 'USD';
                insertObj.total_amount = 0;
                insertObj.variant_id = DataUS.freeTrialVariantId;

                insertObj.partner_order_id = purchaseInfo.orderId;

                const result = await PayMySQL.createPayment(db.mysql.write, insertObj);
                const paymentInfo = await PayMySQL.getPaymentInfoById(db.mysql.write, result.insertId);

                await PaymentHelper.doSuccessPaymentProcedure(db, config, paymentInfo, {});
            } else if (purchaseInfo.paymentState == 1) {
                // create a package with 7 days trial

                const insertObj = {};

                insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
                insertObj.payment_for = 'doubt';
                insertObj.amount = 0;
                insertObj.student_id = studentId;
                insertObj.status = 'SUCCESS';
                insertObj.source = 'GOOGLE';
                insertObj.currency = 'USD';
                insertObj.total_amount = purchaseInfo.priceAmountMicros / 1000000;
                insertObj.variant_id = DataUS.OneMonth20VariantId;

                insertObj.partner_order_id = purchaseInfo.orderId;

                const result = await PayMySQL.createPayment(db.mysql.write, insertObj);
                const paymentInfo = await PayMySQL.getPaymentInfoById(db.mysql.write, result.insertId);

                await PaymentHelper.doSuccessPaymentProcedure(db, config, paymentInfo, {});
            }

            PayMySQL.setInAppBillingInfo(db.mysql.write, {
                student_id: studentId, subscription_id: partner_txn_response.subscriptionId, purchase_token: partner_txn_response.purchaseToken, payment_state: purchaseInfo.paymentState, partner_order_id: purchaseInfo.orderId, auto_renewing: purchaseInfo.autoRenewing, cancel_reason: purchaseInfo.cancelReason, expiry: purchaseInfo.expiryTimeMillis,
            });

            responseData.meta = {
                code: 200,
                success: true,
                message: 'SUCCESS',

            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'FAILURE',
                },
                data: {
                    status: 'FAILURE', reason: 'No Source Found',
                },
            };
        }
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'FAILURE',
            },
            data: {
                status: 'FAILURE', reason: 'Something went wrong',
            },
        };
    }

    res.status(responseData.meta.code).json(responseData);
}

async function qrStatus(req, res, next) {
    try {
        const responseData = {};
        let responseInfo = {};
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const { version_code } = req.headers;
        const { locale } = req.user;
        // const student_info = await Student.getById(studentId, db.mysql.read);
        const student_info = await StudentContainer.getById(studentId, db);
        const userEmail = (!_.isEmpty(student_info[0].student_email) && /\S+@\S+\.\S+/.test(student_info[0].student_email)) ? student_info[0].student_email.trim() : `payments+${studentId}@doubtnut.com`;

        const payment_info = await PayMySQL.getPaymentInfoByOrderId(db.mysql.write, req.body.order_id);

        if (payment_info.length) {
            if (payment_info[0].status == 'SUCCESS') {
                responseInfo.payment_status = 'SUCCESS';
                responseInfo.order_id = payment_info[0].order_id;
                responseInfo.partner_txn_id = payment_info[0].partner_txn_id;
                if (payment_info[0].variant_id) {
                    const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, payment_info[0].variant_id);
                    if (course_details.length) {
                        responseInfo.assortment_type = course_details[0].assortment_type;
                        responseInfo.assortment_id = course_details[0].assortment_id;
                    }
                }
            } else {
                responseInfo = Data.upiCheckout(locale);
                // responseInfo = req.user.locale === 'hi' ? Data.upiCheckout_hi : Data.upiCheckout_en;
                if (payment_info[0].payment_for == 'course_package' || payment_info[0].payment_for == 'doubt') {
                    const packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, payment_info[0].variant_id);
                    responseInfo.header += `${packageInfo[0].package_name}`;
                } else if (payment_info[0].payment_for == 'bounty') {
                    responseInfo.header += global.t8[locale].t('Padhao Aur Kamao'.toUpperCase(), 'Padhao Aur Kamao');
                } else if (payment_info[0].payment_for == 'wallet') {
                    responseInfo.header += global.t8[locale].t('DN Wallet'.toUpperCase(), 'DN Wallet');
                }
                responseInfo.header += ` : ₹${payment_info[0].amount}`;
                responseInfo.footer_image_url = `${Data.cdnUrl}/images/upi_logo_collection.webp`;
                responseInfo.order_id = payment_info[0].order_id;
                responseInfo.upi_intent_link = await RazorpayHelper.createUPILink(payment_info[0].partner_order_id, userEmail, req.user.mobile, 'Payment', (payment_info[0].amount - payment_info[0].wallet_amount) * 100);
            }

            if (version_code >= 858) {
                responseInfo = { upi_intent: responseInfo };
            }
        }
        responseData.data = responseInfo;

        responseData.meta = {
            code: 200,
            success: true,
            message: 'SUCCESS',

        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function txnHistory(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const studentId = req.user.student_id;
    const { page } = req.params;
    console.log('page', page);
    const limit = 20;

    try {
        const paymentHistory = await PayMySQL.getPaymentInfoByStudentId(db.mysql.read, studentId, limit, limit * (page - 1));

        const finalData = [];
        for (let i = 0; i < paymentHistory.length; i++) {
            const finalDatum = {};

            finalDatum.date = moment(paymentHistory[i].updated_at).utc().format('hh:mm A Do MMMM YYYY');
            finalDatum.status = paymentHistory[i].status;

            if (_.isEmpty(paymentHistory[i].partner_order_id)) finalDatum.order_id = paymentHistory[i].order_id;
            else finalDatum.order_id = paymentHistory[i].partner_order_id;

            finalDatum.amount = paymentHistory[i].amount;
            finalDatum.mode = paymentHistory[i].mode;
            finalDatum.payment_for = paymentHistory[i].payment_for;
            finalDatum.name = paymentHistory[i].name;

            finalData.push(finalDatum);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: finalData,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function txnHistoryByType(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { page, type } = req.params;
    console.log('page', page);
    const limit = 20;

    try {
        const paymentHistory = await PayMySQL.getPaymentInfoByPaymentFor(db.mysql.write, type, limit, limit * (page - 1));

        const finalData = [];
        for (let i = 0; i < paymentHistory.length; i++) {
            const finalDatum = {};

            finalDatum.date = moment(paymentHistory[i].updated_at).utc().format('hh:mm A Do MMMM YYYY');
            finalDatum.status = paymentHistory[i].status;
            finalDatum.studentId = paymentHistory[i].student_id;
            finalDatum.studentMobile = paymentHistory[i].mobile;

            if (_.isEmpty(paymentHistory[i].partner_order_id)) finalDatum.order_id = paymentHistory[i].order_id;
            else finalDatum.order_id = paymentHistory[i].partner_order_id;

            finalDatum.amount = paymentHistory[i].amount;
            finalDatum.mode = paymentHistory[i].mode;
            finalDatum.payment_for = paymentHistory[i].payment_for;

            finalData.push(finalDatum);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: finalData,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
async function handleRazorPayRefund(rzpRes, database, configuration) {
    try {
        if (_.isEmpty(db)) {
            db = database;
        }
        if (_.isEmpty(config)) {
            config = configuration;
        }
        const { payload } = rzpRes;
        const result = await PayMySQL.getorderIDByPartnerID(db.mysql.read, payload.refund.entity.payment_id);
        const refund = await PayMySQL.getPaymentRefundByPaymentId(db.mysql.read, result[0].id);
        if (refund && refund.length > 0) {
            const txnID = result[0].partner_txn_id;
            const refundAmount = payload.refund.entity.amount / 100;
            const refundId = payload.refund.entity.id;
            const insertObj = {
                payment_info_id: result[0].id,
                amount: refundAmount,
                partner_txn_id: refundId,
                partner_txn_response: JSON.stringify(payload.refund),
            };
            if (rzpRes.event == 'refund.created') {
                // get refund row
                console.log(insertObj, refund);
                await PayMySQL.updatePaymentSummary(db.mysql.write, txnID, refundAmount, refund[0].id);
                await PayMySQL.deactivateSubscriptionForRefund(db.mysql.write, txnID);
            } else if (rzpRes.event == 'refund.processed') {
                insertObj.status = 'SUCCESS';
                const notifPayload = JSON.parse(JSON.stringify(PayConstant.notification.notification_successful_refund).replace(/##amount##/g, insertObj.amount));
                newtonNotifications.sendNotification(result[0].student_id, notifPayload, db.mysql.read);
            } else if (rzpRes.event == 'refund.failed') {
                insertObj.status = 'FAILURE';
                const slackAuth = PaymentConstants.payments_team.slack_details.authKey;
                const slackUsers = PaymentConstants.payments_team.slack_details.slack_ids;
                const slackChannel = PaymentConstants.payments_team.slack_details.dev_channel;
                const failureDetails = { ...insertObj, student_id: result[0].student_id };
                const messageBlock = [{
                    type: 'section',
                    text: { type: 'mrkdwn', text: `*Refund Failure* ${slackUsers.join(' ')}:\n\`\`\`${JSON.stringify(failureDetails.map((obj) => obj))}\`\`\`` },
                }];
                SlackUtility.sendMessage(slackChannel, messageBlock, slackAuth);
            }
            const refundDetails = await PayMySQL.updatePaymentRefund(db.mysql.write, insertObj);
        }
    } catch (e) {
        throw new Error(e);
    }
}

async function handlePaytmPayRefund(payload) {
    /*
    {
  head: {
    signature: 'sFIKuqNstU7VTEZm962j73ToK9X+KB3h0E1B4Fb+C8RjvCiGS3Y1bNP2rjwqrrE3xv3x1jaPOnbT5tr7AdAw/8TzLnyJFhXlO+E/GFgVBG8=',
    version: 'v1'
  },
  body: {
    source: 'MERCHANT',
    txnId: '20200902111212800110168986201863757',
    orderId: '2020090215042107829',
    txnAmount: '11.00',
    mid: 'YdRTlv14200785527533',
    refundAmount: '1.00',
    txnTimestamp: '2020-09-02 20:34:41.0',
    totalRefundAmount: '2.00',
    acceptRefundTimestamp: '2020-09-02 21:41:56.0',
    refId: 'REFUND_2020090215042107829',
    merchantRefundRequestTimestamp: '2020-09-02 21:41:55.0',
    userCreditInitiateTimestamp: '2020-09-02 21:41:56.0',
    refundId: '20200902111212801300168308802673936',
    refundDetailInfoList: [ [Object] ]
  }
}
     */
    try {
        const orderID = payload.body.orderId;
        const result = await PayMySQL.getorderIDByPartnerID(db.mysql.read, payload.body.txnId);
        if (result.length > 0) {
            const txnID = result[0].partner_txn_id;
            const { refundId } = payload.body;
            const { refundAmount } = payload.body;
            const insertObj = {
                payment_info_id: result[0].id,
                amount: refundAmount,
                partner_txn_id: refundId,
                partner_txn_response: JSON.stringify(payload),
                status: 'SUCCESS',
            };
            // get refund row
            const refund = await PayMySQL.getPaymentRefundByPaymentId(db.mysql.read, insertObj.payment_info_id);
            if (refund && refund.length > 0) {
                const refundDetails = await PayMySQL.updatePaymentRefund(db.mysql.write, insertObj);
                await PayMySQL.updatePaymentSummary(db.mysql.write, txnID, refundAmount, refund[0].id);
                await PayMySQL.deactivateSubscriptionForRefund(db.mysql.write, txnID);
            }
            // const refundDetails = await PayMySQL.setRefundDetails(db.mysql.write, insertObj);
            // await PayMySQL.updateRefundStatus(db.mysql.write, orderID, refundAmount, refundDetails.insertId);
            // await PayMySQL.deactivateSubscriptionForRefund(db.mysql.write, orderID);
        }
    } catch (e) {
        throw new Error(e);
    }
}

async function rzpHook(req, res) {
    const rzpRes = req.body;

    db = req.app.get('db');
    config = req.app.get('config');
    console.log('rzpRes.event', rzpRes.event, Date.now());
    console.log('rzpRes', rzpRes);

    db.mongo.write.collection('payment_webhook').save({ ...rzpRes, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });
    kafka.publish(kafka.topics.paymentWebhook, 1, { source: 'RAZORPAY', data: rzpRes });

    /**
     * if (rzpRes.event == 'payment.captured' && !rzpRes.payload.payment.entity.invoice_id) {
     *     setTimeout(async () => {
     *         const razorpay_order_id = rzpRes.payload.payment.entity.order_id;
     *         const razorpay_payment_id = rzpRes.payload.payment.entity.id;
     *         const { notes } = rzpRes.payload.payment.entity;
     *         let plink_postfix = rzpRes.payload.payment.entity.description;
     *         // exclusively for payment links
     *         if (!_.isEmpty(rzpRes.payload.payment.entity.description) && rzpRes.payload.payment.entity.description.charAt(0) == '#') {
     *             plink_postfix = plink_postfix.substring(1);
     *             await PayMySQL.updatePartnerOrderIdByPaymentLinkId(db.mysql.write, razorpay_order_id, `plink_${plink_postfix}`);
     *         }
     *         razorPayPaymentComplete({ razorpay_order_id, razorpay_payment_id }, notes);
     *     }, 2000);
     * } else if (rzpRes.event == 'payment.authorized') {
     *     setTimeout(() => {
     *         const rzp = new Razorpay({
     *             key_id: config.RAZORPAY_KEY_ID,
     *             key_secret: config.RAZORPAY_KEY_SECRET,
     *         });
     *         rzp.payments.capture(rzpRes.payload.payment.entity.id, rzpRes.payload.payment.entity.amount, rzpRes.payload.payment.entity.currency);
     *     }, 4000);
     * } else if (rzpRes.event == 'payment.failed') {
     *     setTimeout(async () => {
     *         const razorpay_payment_id = rzpRes.payload.payment.entity.id;
     *         const razorpay_order_id = rzpRes.payload.payment.entity.order_id;
     *         let plink_postfix = rzpRes.payload.payment.entity.description;
     *         // exclusively for payment links
     *         if (!_.isEmpty(rzpRes.payload.payment.entity.description) && rzpRes.payload.payment.entity.description.charAt(0) == '#') {
     *             plink_postfix = plink_postfix.substring(1);
     *             await PayMySQL.updatePartnerOrderIdByPaymentLinkId(db.mysql.write, razorpay_order_id, `plink_${plink_postfix}`);
     *         }
     *         razorPayPaymentComplete({ razorpay_order_id, razorpay_payment_id });
     *     }, 1000);
     * } else if (rzpRes.event == 'payment_link.paid') {
     *     setTimeout(async () => {
     *         const razorpay_order_id = rzpRes.payload.order.entity.id;
     *         const payment_link_id = rzpRes.payload.payment_link.entity.id;
     *         const razorpay_payment_id = rzpRes.payload.payment.entity.id;
 * 
     *         const { notes } = rzpRes.payload.order.entity;
     *         await Promise.all([
     *             PayMySQL.updatePaymentByPaymentLinkId(db.mysql.write, { partner_order_id: razorpay_order_id, payment_link_id }),
     *             PayMySQL.updateRzpPaymentLinkStatus(db.mysql.write, payment_link_id, 'PAID'),
     *         ]);
     *         razorPayPaymentComplete({ razorpay_order_id, razorpay_payment_id }, notes);
     *     }, 3000);
     * }
     * // for virtual accounts credited
     * if (rzpRes.event == 'virtual_account.credited') {
     *     setTimeout(() => {
     *         const { notes } = rzpRes.payload.virtual_account.entity;
     *         razorPayPaymentCompleteVPA(rzpRes, notes);
     *     }, 1000);
     * }

     * // for virtual accounts closed
     * if (rzpRes.event == 'virtual_account.closed') {
     *     const virtual_account_id = rzpRes.payload.virtual_account.entity.id;
     *     const [activeVPA, activeQR] = await Promise.all([
     *         PayMySQL.getActiveVPAByVirtualAccountId(db.mysql.read, virtual_account_id),
     *         PayMySQL.getActiveQRByVirtualAccountId(db.mysql.read, virtual_account_id),
     *     ]);
     *     setTimeout(() => {
     *         if (activeVPA.length) {
     *             PayMySQL.setInActiveVPAByVirtualAccountId(db.mysql.write, virtual_account_id);
     *         } else if (activeQR.length) {
     *             PayMySQL.setInactiveQRByVirtualAccountId(db.mysql.write, virtual_account_id);
     *         }
     *     }, 0);
     * }
 * 
     * if (_.includes(['refund.created', 'refund.processed', 'refund.failed'], rzpRes.event)) {
     *     await handleRazorPayRefund(rzpRes);
     * }
     */
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
    };

    res.status(responseData.meta.code).json(responseData);
}

async function paypalHook(req, res) {
    const paypalBody = req.body;

    db = req.app.get('db');
    config = req.app.get('config');
    console.log('paypalBody', paypalBody);
    console.log('paypalBody', JSON.stringify(paypalBody));

    // a subscription has been made active
    if (paypalBody.event_type == 'BILLING.SUBSCRIPTION.ACTIVATED') {
        // check for previous subscription and cancel it.

        const paymentInfo = await PayMySQL.getPaymentInfoByOrderId(db.mysql.read, paypalBody.resource.custom_id);

        await PaymentHelper.cancelPaypalSubscription(db, paymentInfo[0].student_id, paypalBody.resource.id, 'new subscription alloted');

        const paypalInsertObj = {
            student_id: paymentInfo[0].student_id,
            subscription_id: paypalBody.resource.id,
            plan_id: paypalBody.resource.plan_id,
            response: JSON.stringify(paypalBody),
            status: 'ACTIVE',
            is_active: 1,
        };
        PayMySQL.createPaypalSubscription(db.mysql.write, paypalInsertObj);

        await paypalPaymentComplete({ id: paymentInfo[0].order_id });
    }
    /*

    if(paypalBody.event_type == "BILLING.SUBSCRIPTION.CANCELLED")
    {
        //check for previous subscription and cancel it.

        let paymentInfo = await PayMySQL.getPaymentInfoByOrderId(db.mysql.read, paypalBody.resource.custom_id);

        await PaymentHelper.cancelPaypalSubscription(db,paymentInfo[0].student_id,null, "cancelled");

    }
*/

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
    };

    res.status(responseData.meta.code).json(responseData);
}

async function rzpCreateInvoice(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');

    const {
        amount, mobileNumber, paymentForId, paymentFor, type, packageFrom, packageAmount, variantId, multiPhone, subscriptionId, expert_id, coupon_code, discount_amount, vba, inputMobile, inputEmail, inputName,
    } = req.body;

    let {
        use_wallet_cash = false, use_wallet_reward = false, isShopse, interestedInEmi,
    } = req.body;

    use_wallet_cash = use_wallet_cash === 'true';
    use_wallet_reward = use_wallet_reward === 'true';

    isShopse = parseInt(isShopse);

    if (isShopse) {
        use_wallet_reward = false;
    }

    const studentDetails = await Student.getStudentByPhone(mobileNumber, db.mysql.read);

    if (!studentDetails.length) {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'FAILURE',
            },
            data: { mesage: 'StudentId not found' },
        };

        res.status(responseData.meta.code).json(responseData);
    }
    try {
        const studentId = studentDetails[0].student_id;
        const xAuthToken = Token.sign({ id: studentId }, config.jwt_secret_new);
        const insertObj = {};
        const [variantDetails, grayQuestAgents, earlySalaryAgents] = await Promise.all([
            Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variantId),
            Properties.getValueByBucketAndName(db.mysql.read, 'payment_emi_partner_agents', 'grayquest'),
            Properties.getValueByBucketAndName(db.mysql.read, 'payment_emi_partner_agents', 'earlysalary'),
        ]);
        let message;
        let vba_obj;
        let vba_details;
        if (variantDetails.length && variantDetails[0].type === 'emi') {
            isShopse = 0;
            interestedInEmi = 0;
        }

        if (parseInt(interestedInEmi)) {
            if (variantId === undefined) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'FAILURE',
                    },
                    data: null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
            insertObj.payment_for = paymentFor;
            insertObj.student_id = studentId;
            insertObj.status = 'INITIATED';
            console.log(grayQuestAgents[0]);
            if (_.includes(grayQuestAgents[0].value, expert_id)) {
                insertObj.source = 'grayquest';
            } else if (_.includes(earlySalaryAgents[0].value, expert_id)) {
                insertObj.source = 'earlysalary';
            } else {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'FAILURE',
                    },
                    data: null,
                };

                return res.status(responseData.meta.code).json(responseData);
            }
            let checkoutDetails = {};
            let activeSubscription = [];
            if (type === 'upgrade' || type === 'switch') {
                activeSubscription = await Package.getPackageFromActiveSubscriptionsV1UsingSubscriptionID(db.mysql.read, subscriptionId, studentId);
            }
            if (type == 'switch') {
                checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                    payment_for: paymentFor, coupon_code, switch_assortment: activeSubscription[0].assortment_id, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward, use_wallet_cash,
                });
            } else {
                // For both upgrade & new_sale cases
                checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                    payment_for: paymentFor, coupon_code, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward: false, use_wallet_cash, sale_type: type,
                });
            }
            if (coupon_code) {
                insertObj.discount = checkoutDetails.coupon_amount ? checkoutDetails.coupon_amount : 0;
                insertObj.coupon_code = coupon_code;
            }
            insertObj.total_amount = checkoutDetails.packageInfo[0].final_amount;
            insertObj.amount = checkoutDetails.net_amount;

            if (insertObj.amount > 0) {
                if (variantDetails[0]) {
                    insertObj.variant_id = variantDetails[0].id;
                }
                const piInsert = await PayMySQL.createPayment(db.mysql.write, insertObj);
                await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                    expert_id, student_id: studentId, type: 1, pi_id: piInsert.insertId, variant_id: variantId, sale_type: type, package_from: packageFrom, coupon_code, link: 'interested_in_emi_partners',
                });
                if (checkoutDetails.is_upgrade) {
                    // if Upgrade and switch case
                    PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                        payment_info_id: piInsert.insertId, is_web: 0, wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable, wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom: activeSubscription[0].new_package_id, type, subscriptionId: activeSubscription[0].subscription_id }),
                    });
                } else {
                    // new_sale case
                    PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                        payment_info_id: piInsert.insertId, is_web: 0, wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable, wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom: null, type: 'new_sale', subscriptionId: null }),
                    });
                }
                const emiObject = {
                    text: `Emi Request intitated for No: ${mobileNumber} with student_id: ${insertObj.order_id}`,
                    orderId: insertObj.order_id,
                    amount: `Request Amount ${insertObj.amount}`,
                };
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: {
                        emi: emiObject,
                    },
                };

                return res.status(responseData.meta.code).json(responseData);
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'FAILURE',
                },
                data: null,
            };

            return res.status(responseData.meta.code).json(responseData);
        }

        if (parseInt(vba)) {
            let razorpayResponse;
            const rzpVbaObj = {
                description: `Payment for ${mobileNumber} | DN Wallet`,
                notes: { type },
                mobile: `91${mobileNumber}`,
                descriptor: `DN${mobileNumber}`,
                // close_by: Math.floor(date / 1000),
            };

            const activeVPA = await PayMySQL.getActiveVPAByStudentId(db.mysql.read, studentId);

            if (activeVPA.length) {
                vba_obj = {
                    id: activeVPA[0].id,
                    account_number: activeVPA[0].account_number,
                    ifsc: activeVPA[0].ifsc_code,
                    bank_name: activeVPA[0].bank_name,
                    name: 'Doubtnut',
                };
            } else {
                razorpayResponse = await RazorpayHelper.createVPA(rzpVbaObj, true);
                console.log(razorpayResponse);

                let bankAccountIndex = _.findIndex(razorpayResponse.receivers, (o) => o.entity == 'bank_account');
                const upiIndex = _.findIndex(razorpayResponse.receivers, (o) => o.entity == 'vpa');

                bankAccountIndex = bankAccountIndex < 0 ? 0 : bankAccountIndex;
                vba_obj = {
                    account_number: razorpayResponse.receivers[bankAccountIndex].account_number,
                    ifsc: razorpayResponse.receivers[bankAccountIndex].ifsc,
                    bank_name: razorpayResponse.receivers[bankAccountIndex].bank_name,
                    name: razorpayResponse.receivers[bankAccountIndex].name,
                };
                const smartCollectResponse = await PayMySQL.setPaymentInfoSmartCollect(db.mysql.write, {
                    student_id: studentId,
                    virtual_account_id: razorpayResponse.id,
                    account_number: razorpayResponse.receivers[bankAccountIndex].account_number,
                    ifsc_code: razorpayResponse.receivers[bankAccountIndex].ifsc,
                    bank_name: razorpayResponse.receivers[bankAccountIndex].bank_name,
                    is_active: 1,
                    upi_id: upiIndex > -1 ? razorpayResponse.receivers[upiIndex].address : null,
                    created_by: expert_id,
                });
                vba_obj.id = smartCollectResponse.insertId;
            }
            await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                expert_id, student_id: studentId, type: 1, variant_id: variantId, sale_type: type, package_from: packageFrom, vba_details: vba_obj.id,
            });
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    vba: vba_obj,

                },
            };

            return res.status(responseData.meta.code).json(responseData);
        }

        if (type == 'new_sale') {
            let razorpayResponse;
            if (variantId != undefined) {
                insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
                insertObj.payment_for = paymentFor;
                insertObj.total_amount = variantDetails[0].total_amount;
                insertObj.student_id = studentId;
                insertObj.status = 'INITIATED';
                insertObj.source = isShopse ? 'SHOPSE' : 'razorpay';
                const checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                    payment_for: paymentFor, coupon_code, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward, use_wallet_cash, sale_type: type,
                });
                if (coupon_code) {
                    insertObj.discount = checkoutDetails.coupon_amount ? checkoutDetails.coupon_amount : 0;
                    insertObj.coupon_code = coupon_code;
                }
                if (use_wallet_cash || use_wallet_reward) {
                    insertObj.wallet_amount = checkoutDetails.wallet_amount_usable;
                }
                insertObj.amount = checkoutDetails.net_amount;
                if (insertObj.amount > 0) {
                    if (variantDetails[0]) {
                        insertObj.variant_id = variantDetails[0].id;
                    }
                    if (isShopse) {
                        const shopseObj = {
                            studentId,
                            amount: insertObj.amount,
                            mobile: inputMobile,
                            orderId: insertObj.order_id,
                            email: inputEmail,
                            courseName: `${variantDetails[0].package_name} - ${variantDetails[0].duration_in_days} days`,
                            variantId,
                            consumerName: inputName,
                            expertId: expert_id,
                        };
                        const shopseResponse = await ShopseHelper.createPaymentLink(shopseObj);
                        if (!_.isEmpty(shopseResponse)) {
                            let tinyUrl;
                            try {
                                tinyUrl = await axiosInstance.configMicroInst({
                                    method: 'POST',
                                    url: `${config.microUrl}/api/deeplink/tinyurl`,
                                    data: {
                                        url: shopseResponse.emailPaymentLink,
                                        tag: 'shopseEmiLink',
                                    },
                                });
                                console.log('response micro', tinyUrl.data);
                            } catch (e) {
                                console.error('error', e);
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: false,
                                        message: 'FAILURE',
                                    },
                                    data: null,
                                };
                                res.status(responseData.meta.code).json(responseData);
                            }
                            razorpayResponse = {
                                short_url: tinyUrl.data,
                            };
                        }
                        insertObj.partner_order_id = insertObj.order_id;
                    } else {
                        const rzp = new Razorpay({
                            key_id: config.RAZORPAY_KEY_ID,
                            key_secret: config.RAZORPAY_KEY_SECRET,
                        });
                        const date = new Date();
                        date.setDate(date.getDate() + 2);
                        const rzpObj = {
                            type: 'link',
                            description: `${mobileNumber} | ${variantDetails[0].package_name} - ${variantDetails[0].duration_in_days} days.`,
                            amount: parseFloat(insertObj.amount) * 100,
                            expire_by: Math.floor(date / 1000),
                            notes: { type },
                        };
                        razorpayResponse = await RazorpayHelper.createStandardLink(rzpObj);
                        insertObj.partner_order_id = razorpayResponse.id;
                    }
                    const piInsert = await PayMySQL.createPayment(db.mysql.write, insertObj);
                    await PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                        payment_info_id: piInsert.insertId, is_web: 0, wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable, wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom: null, type, subscriptionId: null }),
                    });

                    await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                        expert_id, student_id: studentId, type: 1, link: razorpayResponse.short_url, pi_id: piInsert.insertId, variant_id: variantId, sale_type: type, package_from: packageFrom, coupon_code,
                    });
                    PayMySQL.setRzpPaymentLink(db.mysql.write, {
                        payment_info_id: piInsert.insertId, student_id: studentId, link_id: piInsert.partner_order_id, status: 'INITIATED',
                    });
                    // Message Notification for payment links. Not for VPA payments
                    if (!parseInt(vba)) {
                        if (variantDetails[0].meta_info === 'HINDI') {
                            message = Data.panelCourseMessages.SMS.payment_link.hi.replace('{2}', insertObj.amount).replace('{1}', `${variantDetails[0].display_name} - ${variantDetails[0].duration_in_days} days`).replace('{3}', razorpayResponse.short_url);
                        } else {
                            message = Data.panelCourseMessages.SMS.payment_link.en.replace('{1}', insertObj.amount).replace('{2}', `${variantDetails[0].display_name} - ${variantDetails[0].duration_in_days} days`).replace('{3}', razorpayResponse.short_url);
                        }
                        Utility.sendSMSToReferral(config, { mobile: mobileNumber, message, locale: variantDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                        // const branchDeeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'SALES', 'ADITYA_USER', variantDetails[0].parent ==4 ? `doubtnutapp://course_category?category_id=Kota Classes` : `doubtnutapp://course_details?id=${variantDetails[0].assortment_id}&referrer_student_id=`)
                        // Utility.sendSMSToReferral(config, { mobile: mobileNumber, message: Data.panelCourseMessages.SMS.course_link['hi'].replace('{1}', variantDetails[0].display_name).replace('{2}', branchDeeplink.url), locale: 'hi' });

                        // UtilitySMS.sendSMS(config, 'offline_payment_link_2', [`${variantDetails[0].duration_in_days} - Doubts Gold Pass`, variantDetails[0].final_amount, razorpayResponse.short_url], mobileNumber);
                        if (multiPhone) {
                            const phoneArray = multiPhone.split(',');
                            for (let i = 0; i < phoneArray.length; i++) {
                                Utility.sendSMSToReferral(config, { mobile: phoneArray[i], message: Data.panelCourseMessages.SMS.payment_link[variantDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].replace('{1}', insertObj.amount).replace('{2}', variantDetails[0].display_name).replace('{3}', razorpayResponse.short_url), locale: variantDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                                // UtilitySMS.sendSMS(config, 'offline_payment_link_2', [`${variantDetails[0].duration_in_days} - Doubts Gold Pass`, variantDetails[0].final_amount, razorpayResponse.short_url], phoneArray[i]);
                            }
                        }
                    }
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: {
                            url: razorpayResponse.short_url,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                } else if (insertObj.amount == 0) {
                    insertObj.source = 'WALLET';
                    insertObj.mode = 'DN';
                    insertObj.partner_order_id = insertObj.order_id;
                    const piInsert = await PayMySQL.createPayment(db.mysql.write, insertObj);
                    insertObj.id = piInsert.insertId;
                    if (variantDetails[0]) {
                        insertObj.variant_id = variantDetails[0].id;
                    }
                    const payment_info_array = [];
                    payment_info_array.push(insertObj);
                    await PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                        payment_info_id: piInsert.insertId, is_web: 0, wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable, wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom: null, type, subscriptionId: null }),
                    });
                    await Promise.all([
                        PaymentHelper.walletPaymentComplete(db, config, payment_info_array),
                        PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                            expert_id, student_id: studentId, type: 1, variant_id: variantId, sale_type: type, package_from: packageFrom,
                        }),
                    ]);
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: { url: `PLAN ACTIVATED: AMOUNT ₹${insertObj.wallet_amount} DEBITED FROM WALLET` },
                    };
                    res.status(responseData.meta.code).json(responseData);
                } else {
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'FAILURE',
                        },
                        data: null,
                    };

                    res.status(responseData.meta.code).json(responseData);
                }
            }
        } else if (type == 'upgrade' || type == 'switch' || type == 'next-emi') {
            const [activeSubscription, assortmentSubscriptions] = await Promise.all([
                Package.getPackageFromActiveSubscriptionsV1UsingSubscriptionID(db.mysql.read, subscriptionId, studentId),
                CourseMysqlV2.getUserPaymentSummaryDetailsByAssortmentV1AllPurchases(db.mysql.read, variantDetails[0].assortment_id, studentId),
            ]);
            let refundInfo;
            let amountToBePaid = 0;
            let amountPaid = 0;
            /**
             * Only in case of Upgardes Previous total amount_paid is considered
             * For switch previous package_amount is considered
             */

            // sort by descending order to back trace (failsafe)
            _.sortBy(assortmentSubscriptions, [(o) => !o.ps_id]);

            if (activeSubscription.length && type == 'upgrade') {
                let backTracePaymentSummaryId = activeSubscription[0].id;
                amountPaid += activeSubscription[0].amount_paid;
                for (let i = 0; i < assortmentSubscriptions.length; i++) {
                    // include the previous payments of active subscription
                    if (assortmentSubscriptions[i].next_ps_id === backTracePaymentSummaryId) {
                        amountPaid += assortmentSubscriptions[i].amount_paid;
                        backTracePaymentSummaryId = assortmentSubscriptions[i].ps_id;
                    }
                }
            } else if (type == 'switch') {
                amountPaid = activeSubscription[0].package_amount;
            }
            amountToBePaid = variantDetails[0].final_amount - amountPaid;
            insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 1000);
            insertObj.payment_for = paymentFor;
            insertObj.payment_for_id = variantDetails[0].package_id;
            insertObj.total_amount = amountToBePaid.toFixed(2);
            insertObj.amount = amountToBePaid.toFixed(2);
            insertObj.student_id = studentId;
            insertObj.status = 'INITIATED';
            insertObj.source = isShopse ? 'SHOPSE' : 'razorpay';
            insertObj.discount = 0;
            if (variantDetails[0]) {
                insertObj.variant_id = variantDetails[0].id;
            }
            if (coupon_code) {
                insertObj.discount = discount_amount;
                insertObj.amount -= insertObj.discount;
                insertObj.coupon_code = coupon_code;
                amountToBePaid -= insertObj.discount;
            }
            // For switch cases
            if (amountToBePaid < 0) {
                amountToBePaid += activeSubscription[0].pi_discount;
                insertObj.discount -= activeSubscription[0].pi_discount;
                insertObj.amount = amountToBePaid.toFixed(2);
            }
            if (amountToBePaid == 0) {
                const payment_info_array = [];
                payment_info_array.push(insertObj);
                payment_info_array[0].discount = 0;
                await Promise.all([
                    PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info_array, { packageFrom, type, subscriptionId }),
                    PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                        expert_id, student_id: studentId, type: 1, variant_id: variantId, sale_type: type, package_from: packageFrom,
                    }),
                ]);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: { url: 'PLAN ACTIVATED AS THE AMOUNT WAS RS. 0' },
                };
                res.status(responseData.meta.code).json(responseData);
            } else if (amountToBePaid < 0) {
                let isRefunded = false;
                if (activeSubscription[0].source.toLowerCase() == 'razorpay' || activeSubscription[0].source.toLowerCase() == 'wallet') {
                    let totalAmountToBeRefunded = amountToBePaid;
                    if (totalAmountToBeRefunded >= 0) {
                        totalAmountToBeRefunded = 0;
                        amountToBePaid = 0;
                        isRefunded = true;
                    }
                    // calculate refund amount for wallet
                    if (activeSubscription[0].pi_wallet_amount > 0 && !isRefunded) {
                        // refund wallet amount
                        const walletRefundAmount = (amountToBePaid * -1) > activeSubscription[0].pi_wallet_amount ? activeSubscription[0].pi_wallet_amount : (amountToBePaid * -1);
                        const walletCreditStatus = await WalletUtil.makeWalletTransaction({
                            student_id: studentId,
                            amount: walletRefundAmount,
                            type: 'CREDIT',
                            payment_info_id: activeSubscription[0].pi_id,
                            reason: 'add_wallet_credit_downsell',
                            expiry: null,
                        });
                        if (walletCreditStatus && walletCreditStatus.meta.message == 'SUCCESS') {
                            amountToBePaid += walletRefundAmount;
                            const refundInsertObj = {
                                payment_info_id: activeSubscription[0].pi_id,
                                amount: amountToBePaid * -1,
                                status: 'INITIATED',
                                reason: 'switch/upgrade',
                                updated_by: 'system',
                                wallet_status: 'SUCCESS',
                                wallet_amount: walletRefundAmount,
                            };
                            if (amountToBePaid >= 0) {
                                refundInsertObj.status = 'SUCCESS';
                                isRefunded = true;
                            }
                            refundInfo = await PayMySQL.setRefundDetails(db.mysql.write, refundInsertObj);
                        } else {
                            const responseData = {
                                meta: {
                                    code: 200,
                                    success: false,
                                    message: 'FAILURE: WALLET CREDIT',
                                },
                                data: null,
                            };

                            return res.status(responseData.meta.code).json(responseData);
                        }
                        // if(isRefunded) {
                        //
                        // }
                    }
                    // calculate refund amount for razorpay
                    if (!isRefunded && amountToBePaid < 0 && activeSubscription[0].source.toLowerCase() == 'razorpay') {
                        if ((amountToBePaid * -1) < activeSubscription[0].pi_amount) {
                            if (_.isEmpty(refundInfo)) {
                                const refundInsertObj = {
                                    payment_info_id: activeSubscription[0].pi_id,
                                    amount: amountToBePaid * -1,
                                    status: 'INITIATED',
                                    reason: 'switch/upgrade',
                                    updated_by: 'system',
                                };
                                refundInfo = await PayMySQL.setRefundDetails(db.mysql.write, refundInsertObj);
                            }
                            const refundResponse = await RzpHelper.refund(activeSubscription[0].partner_txn_id, amountToBePaid * -100);
                            if (refundResponse && refundResponse.id) {
                                isRefunded = true;
                                amountToBePaid = 0;
                                const updateObj = {
                                    payment_info_id: activeSubscription[0].pi_id,
                                    partner_txn_id: refundResponse.id,
                                };
                                const refundDetails = await PayMySQL.updatePaymentRefundByPaymentInfoId(db.mysql.write, updateObj);
                            }
                        } else {
                            const responseData = {
                                meta: {
                                    code: 200,
                                    success: false,
                                    message: 'FAILURE',
                                },
                                data: null,
                            };
                            return res.status(responseData.meta.code).json(responseData);
                        }
                    }
                    if (isRefunded) {
                        const payment_info_array = [];
                        payment_info_array.push(insertObj);
                        payment_info_array[0].discount = 0;
                        console.log(insertObj);
                        //  update payment_summary, deactivate the previous subscription add the new package
                        await PayMySQL.updatePaymentSummary(db.mysql.write, activeSubscription[0].partner_txn_id, totalAmountToBeRefunded * -1, (refundInfo && refundInfo.insertId) ? refundInfo.insertId : null);
                        await PaymentHelper.doSuccessPaymentProcedure(db, config, payment_info_array, { packageFrom, type, subscriptionId });
                        await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                            expert_id, student_id: studentId, type: 1, variant_id: variantId, sale_type: type, package_from: packageFrom,
                        });
                        await PayMySQL.deactivateSubscriptionForRefund(db.mysql.write, activeSubscription[0].partner_txn_id);
                        const responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: 'SUCCESS',
                            },
                            data: { url: 'PLAN ACTIVATED' },
                        };

                        return res.status(responseData.meta.code).json(responseData);
                    }
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'FAILURE: PAYMENT MODE NOT RAZORPAY OR WALLET',
                    },
                    data: null,
                };

                return res.status(responseData.meta.code).json(responseData);
            } else if (amountToBePaid > 0) {
                let checkoutDetails = {};
                if (type == 'switch') {
                    checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                        payment_for: paymentFor, coupon_code, switch_assortment: activeSubscription[0].assortment_id, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward, use_wallet_cash,
                    });
                } else if (type == 'upgrade' || type == 'next-emi') {
                    checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                        payment_for: paymentFor, coupon_code, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward, use_wallet_cash,
                    });
                }
                if (coupon_code) {
                    insertObj.discount = checkoutDetails.coupon_amount ? checkoutDetails.coupon_amount : 0;
                    insertObj.coupon_code = coupon_code;
                }
                if (use_wallet_cash || use_wallet_reward) {
                    insertObj.wallet_amount = checkoutDetails.wallet_amount_usable;
                }
                insertObj.amount = checkoutDetails.net_amount;
                if (insertObj.amount > 0) {
                    let razorpayResponse;
                    if (isShopse) {
                        const shopseObj = {
                            studentId,
                            amount: insertObj.amount,
                            mobile: inputMobile,
                            orderId: insertObj.order_id,
                            email: inputEmail,
                            courseName: `${variantDetails[0].package_name} - ${variantDetails[0].duration_in_days} days`,
                            variantId,
                            consumerName: inputName,
                            expertId: expert_id,
                        };
                        const shopseResponse = await ShopseHelper.createPaymentLink(shopseObj);
                        if (!_.isEmpty(shopseResponse)) {
                            let tinyUrl;
                            try {
                                tinyUrl = await axiosInstance.configMicroInst({
                                    method: 'POST',
                                    url: `${config.microUrl}/api/deeplink/tinyurl`,
                                    data: {
                                        url: shopseResponse.emailPaymentLink,
                                        tag: 'shopseEmiLink',
                                    },
                                });
                                console.log('response micro', tinyUrl.data);
                            } catch (e) {
                                console.error('error', e);
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: false,
                                        message: 'FAILURE',
                                    },
                                    data: null,
                                };
                                res.status(responseData.meta.code).json(responseData);
                            }
                            razorpayResponse = {
                                short_url: tinyUrl.data,
                            };
                        }
                        insertObj.partner_order_id = insertObj.order_id;
                    } else {
                        const rzp = new Razorpay({
                            key_id: config.RAZORPAY_KEY_ID,
                            key_secret: config.RAZORPAY_KEY_SECRET,
                        });
                        const date = new Date();
                        date.setDate(date.getDate() + 2);
                        const rzpObj = {
                            type: 'link',
                            description: `Payment for ${mobileNumber} | ${variantDetails[0].package_name} - ${variantDetails[0].duration_in_days} days.`,
                            amount: parseFloat(insertObj.amount) * 100,
                            notes: { packageFrom, type, subscriptionId },
                            expire_by: Math.floor(date / 1000),
                        };
                        razorpayResponse = await RazorpayHelper.createStandardLink(rzpObj);
                        insertObj.partner_order_id = razorpayResponse.id;
                    }
                    const piInsert = await PayMySQL.createPayment(db.mysql.write, insertObj);
                    await PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                        payment_info_id: piInsert.insertId, is_web: 0, wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable, wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom, type, subscriptionId }),
                    });
                    await PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                        expert_id, student_id: studentId, type: 1, link: razorpayResponse.short_url, pi_id: piInsert.insertId, variant_id: variantId, sale_type: type, package_from: packageFrom, coupon_code,
                    });
                    PayMySQL.setRzpPaymentLink(db.mysql.write, {
                        payment_info_id: piInsert.insertId, student_id: studentId, link_id: piInsert.partner_order_id, status: 'INITIATED',
                    });
                    if (!parseInt(vba)) {
                        if (variantDetails[0].meta_info === 'HINDI') {
                            message = Data.panelCourseMessages.SMS.payment_link.hi.replace('{2}', insertObj.amount).replace('{1}', variantDetails[0].display_name).replace('{3}', razorpayResponse.short_url);
                        } else {
                            message = Data.panelCourseMessages.SMS.payment_link.en.replace('{1}', insertObj.amount).replace('{2}', variantDetails[0].display_name).replace('{3}', razorpayResponse.short_url);
                        }
                        Utility.sendSMSToReferral(config, { mobile: mobileNumber, message, locale: variantDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                        // const branchDeeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'SALES', 'ADITYA_USER', variantDetails[0].parent ==4 ? `doubtnutapp://course_category?category_id=Kota Classes` : `doubtnutapp://course_details?id=${variantDetails[0].assortment_id}&referrer_student_id=`)
                        // Utility.sendSMSToReferral(config, { mobile: mobileNumber, message: Data.panelCourseMessages.SMS.course_link['hi'].replace('{1}', variantDetails[0].display_name).replace('{2}', branchDeeplink.url), locale: 'hi' });
                        // UtilitySMS.sendSMS(config, 'offline_payment_link_2', [`${variantDetails[0].duration_in_days}-Days Unlimited Pass`, amountToBePaid, razorpayResponse.short_url], mobileNumber);
                        if (multiPhone) {
                            const phoneArray = multiPhone.split(',');
                            for (let i = 0; i < phoneArray.length; i++) {
                                Utility.sendSMSToReferral(config, { mobile: phoneArray[i], message: Data.panelCourseMessages.SMS.payment_link[variantDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].replace('{1}', amountToBePaid).replace('{2}', variantDetails[0].display_name).replace('{3}', razorpayResponse.short_url), locale: variantDetails[0].meta_info === 'HINDI' ? 'hi' : 'en' });
                                // UtilitySMS.sendSMS(config, 'offline_payment_link_2', [`${variantDetails[0].duration_in_days}-Days Unlimited Pass`, amountToBePaid, razorpayResponse.short_url], phoneArray[i]);
                            }
                        }
                    }
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: {
                            url: razorpayResponse.short_url,
                            vba: vba_obj,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                } else if (insertObj.amount == 0) {
                    insertObj.source = 'WALLET';
                    insertObj.mode = 'DN';
                    insertObj.partner_order_id = insertObj.order_id;
                    const piInsert = await PayMySQL.createPayment(db.mysql.write, insertObj);
                    insertObj.id = piInsert.insertId;
                    const payment_info_array = [];
                    payment_info_array.push(insertObj);
                    await PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                        payment_info_id: piInsert.insertId, is_web: 0, wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable, wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom, type, subscriptionId }),
                    });
                    await Promise.all([
                        PaymentHelper.walletPaymentComplete(db, config, payment_info_array),
                        PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                            expert_id, student_id: studentId, type: 1, variant_id: variantId, sale_type: type, package_from: packageFrom,
                        }),
                    ]);
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: { url: `PLAN ACTIVATED: AMOUNT ₹${insertObj.wallet_amount} DEBITED FROM WALLET` },
                    };

                    res.status(responseData.meta.code).json(responseData);
                }
            } else {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'FAILURE',
                    },
                    data: null,
                };

                res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: true,
                message: 'FAIL',
            },
            data: e,
        };

        res.status(responseData.meta.code).json(responseData);
    }
}

async function panelCheckoutDetails(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');

    const {
        mobile, type, payment_for, coupon_code, variant_id, use_wallet_reward, use_wallet_cash, subscriptionId,
    } = req.body;

    const studentDetails = await Student.getStudentByPhone(mobile, db.mysql.read);

    if (!studentDetails.length) {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'FAILURE',
            },
            data: { mesage: 'StudentId not found' },
        };

        res.status(responseData.meta.code).json(responseData);
    }
    try {
        const studentId = studentDetails[0].student_id;
        const xAuthToken = Token.sign({ id: studentId }, config.jwt_secret_new);
        const variantDetails = await Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variant_id);
        let checkoutDetails;
        if (type == 'new_sale' || type == 'upgrade' || type == 'next-emi') {
            checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                payment_for, coupon_code, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward, use_wallet_cash, sale_type: type,
            });
        } else if (type == 'switch') {
            const activeSubscription = await Package.getPackageFromActiveSubscriptionsV1UsingSubscriptionID(db.mysql.read, subscriptionId, studentId);
            checkoutDetails = await PaymentHelper.computeCheckoutDetails(db, {
                payment_for, coupon_code, switch_assortment: activeSubscription[0].assortment_id, student_info: studentDetails[0], xAuthToken, remove_coupon: !coupon_code, variant_details: variantDetails, use_wallet_reward, use_wallet_cash,
            });
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                net_amount: checkoutDetails.net_amount,
                package_final_amount: checkoutDetails.package_final_amount,
                coupon_amount: checkoutDetails.coupon_amount,
                wallet_amount: checkoutDetails.wallet_amount_usable,
                wallet_cash_amount: checkoutDetails.wallet_cash_amount_usable,
                wallet_reward_amount: checkoutDetails.wallet_reward_amount_usable,
                coupon_info: checkoutDetails.coupon_info,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: true,
                message: 'FAIL',
            },
            data: e,
        };

        res.status(responseData.meta.code).json(responseData);
    }
}

async function paytmHook(req, res) {
    const paytmResponse = req.body;
    console.log(paytmResponse);

    db.mongo.write.collection('payment_webhook_paytm').save({ ...paytmResponse, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });

    if (paytmResponse.ORDERID != undefined && paytmResponse.TXNID != undefined && paytmResponse.CHECKSUMHASH != undefined) {
        // these value come only in txn successful

        setTimeout(() => {
            db = req.app.get('db');
            config = req.app.get('config');
            paytmPaymentComplete(paytmResponse);
        }, 2000);
    } else if (paytmResponse.body != undefined && paytmResponse.head != undefined) {
        setTimeout(() => {
            db = req.app.get('db');
            config = req.app.get('config');
            handlePaytmPayRefund(paytmResponse);
        }, 2000);
    }

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
    };

    res.status(responseData.meta.code).json(responseData);
}

async function payoutPaytmReferralSuccess(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            paytm_number: paytmNumber, student_id: studentID,
        } = req.body;
        let responseData;
        let info = Buffer.from(studentID, 'base64').toString('ascii');
        console.log(info);
        info = info.split('XX');
        const infoSid = info[0];
        const disbursementId = info[1];
        const validityRow = await ContestMysql.checkForDisbursementValidity(db.mysql.read, infoSid, disbursementId);
        if (validityRow && validityRow.length == 1) {
            if (validityRow[0].is_paytm_disbursed == 1) {
                if (!_.isNull(validityRow[0].paytm_response_retry)) {
                    const response = JSON.parse(validityRow[0].paytm_response_retry);
                    if (response.status == 'SUCCESS') {
                        responseData = {
                            meta: {
                                code: 200,
                                success: false,
                                message: 'SUCCESS',
                            },
                            data: { message: '"Dost ko lao Paise kamao Offer" ke chalte aap jeet chuke hain ₹150 ka Cash Prize apne Paytm Wallet mein.', mobile: validityRow[0].mobile_retry, order_id: validityRow[0].order_id },
                        };
                        return res.status(responseData.meta.code).json(responseData);
                    }
                }
                if (!_.isNull(validityRow[0].paytm_response)) {
                    const response = JSON.parse(validityRow[0].paytm_response);
                    if (response.status == 'SUCCESS') {
                        responseData = {
                            meta: {
                                code: 200,
                                success: false,
                                message: 'SUCCESS',
                            },
                            data: { message: 'We have sent you paytm cash and the transaction was successful. Please contact info@doubtnut.com for any further details.', mobile: validityRow[0].mobile, order_id: validityRow[0].order_id },
                        };
                        return res.status(responseData.meta.code).json(responseData);
                    }
                }
            }
        }
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'FAILURE',
            },
            data: { message: 'Invalid URL' },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function payoutPaytmReferral(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        // console.log(Buffer.from("724515XX1").toString('base64'));
        // return 1;
        let responseData;
        const {
            paytm_number: paytmNumber, student_id: studentID,
        } = req.body;
        let info = Buffer.from(studentID, 'base64').toString('ascii');
        console.log(info);
        info = info.split('XX');
        const infoSid = info[0];
        const disbursementId = info[1];
        const validityRow = await ContestMysql.checkForDisbursementValidity(db.mysql.read, infoSid, disbursementId);
        if (validityRow && validityRow.length == 1) {
            if (!PhoneUtility.isValidNumberByCountry(paytmNumber, 'IN')) {
                responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'FAILURE',
                    },
                    data: { message: 'Wrong mobile Number' },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            if (validityRow[0].is_paytm_disbursed == 2) {
                responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'FAILURE',
                    },
                    data: { message: 'We have already sent you paytm cash and the transaction is in pending state. You will receive the amount in 24 hours' },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            if (validityRow[0].is_paytm_disbursed == 1) {
                responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'FAILURE',
                    },
                    data: { message: 'We have already sent you paytm cash and the transaction was successfull. Please contact info@doubtnut.com' },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            if (!_.isNull(validityRow[0].is_paytm_disbursed) && _.isNull(validityRow[0].mobile_retry)) {
                if (paytmNumber != validityRow[0].mobile) {
                    await CouponMySQL.updateReferrerMobileForPaytmDisburse(db.mysql.write, {
                        invitor_student_id: infoSid,
                        mobile: paytmNumber,
                        id: disbursementId,
                        is_paytm_disbursed: 3,
                    });
                    responseData = {
                        meta: {
                            code: 200,
                            success: false,
                            message: 'SUCCESS',
                        },
                        data: { message: 'We have initiated the request.You will receive the paytm cash in 24 hours. Please contact info@doubtnut.com for any further assistance' },
                    };
                    return res.status(responseData.meta.code).json(responseData);
                }
                responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'FAILURE',
                    },
                    data: { message: 'We have already tried sending your paytm cash on this phone number. Please try some other phone number' },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'FAILURE',
                },
                data: { message: 'Limit Reached. Please contact info@doubtnut.com' },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'FAILURE',
            },
            data: { message: 'Invalid URL' },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function payoutDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let responseData;
        const {
            paytm_number: paytmNumber, student_id: studentID,
        } = req.body;
        let info = Buffer.from(studentID, 'base64').toString('ascii');
        info = info.split('XX');
        const infoSid = info[1];
        const contestWinnersID = info[0];
        // check if its already paid or not
        const details = await ContestMysql.getContestWinnerTransactionDetails(db.mysql.read, contestWinnersID);
        if (details.length === 1 && details[0].student_id == infoSid) {
            // do payment
            const rowStudentID = details[0].student_id;
            const previousOrderID = details[0].order_id;
            const newOrderID = `${previousOrderID}_V2`;
            const winningAmount = details[0].amount;
            const result = await PaytmHelper.disburse(paytmNumber, newOrderID, winningAmount);
            const updateObj = {};
            updateObj.paytm_number = paytmNumber;
            updateObj.student_id = rowStudentID;
            updateObj.contest_winners_id = contestWinnersID;
            updateObj.order_id = newOrderID;
            updateObj.payment_status = result.status;
            updateObj.status_code = result.statusCode;
            await PayMySQL.setStudentPayoutDetails(db.mysql.write, updateObj);
            await ContestMysql.updateContestWinners(db.mysql.write, { payment_try_count: 2 }, contestWinnersID);
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'FAILURE',
            },
            data: { message: 'Invalid data' },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function paytmUpdateNumber(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    let responseData;

    const { student_id } = req.user;
    const { phone } = req.body;

    if (phone.length < 10) {
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'FAILURE',
            },
            data: 'Phone number is less than 10 digits',
        };
    } else {
        const is_updated = await PayMySQL.updatePaytmPhoneByStudentId(db.mysql.write, student_id, phone);

        if (is_updated) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: 'Updated successfully',
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'FAILURE',
                },
                data: 'Something went wrong',
            };
        }
    }

    res.status(responseData.meta.code).json(responseData);
}

async function getPaytmNumber(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.user;

    const data = await PayMySQL.getPaytmPhoneByStudentId(db.mysql.read, student_id);

    let responseData;

    if (!_.isEmpty(data)) {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { phone: data[0].phone },
        };
    } else {
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'FAILURE',
            },
            data: { message: 'no record found' },
        };
    }

    res.status(responseData.meta.code).json(responseData);
}

async function paytmDisburse(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');

    try {
        const response = await PaytmHelper.disburse(req.body.phone, req.body.orderId, req.body.amount);

        res.status(200).json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function paytmDisburseStatus(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const response = await PaytmHelper.disburseStatus(req.body.orderId);

        res.status(200).json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function initiateRefund(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const payload = req.body;
        const paymentInfoId = payload.id;
        const createdAt = payload.created_at;
        const { reason, updated_by } = payload;
        const { student_id: studentId } = req.user;
        let refundResponse = {};
        let walletRefundResponse = {};

        if (!_.includes(PaymentConstants.payments_team.student_ids, studentId)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const result = await PayMySQL.getTxnIdByPaymentInfoId(db.mysql.read, paymentInfoId, createdAt);

        if (result.length > 0) {
            const insertObj = {
                payment_info_id: paymentInfoId,
                amount: result[0].amount,
                status: 'INITIATED',
                reason,
                updated_by,
            };

            if (result[0].wallet_amount) {
                insertObj.wallet_status = 'INITIATED';
                insertObj.wallet_amount = result[0].wallet_amount;
            }

            const refundInfo = await PayMySQL.setRefundDetails(db.mysql.write, insertObj);

            console.log(refundInfo);

            if (result[0].source.toLowerCase() == 'razorpay') {
                console.log(result);

                refundResponse = await RzpHelper.refund(result[0].partner_txn_id, insertObj.amount * 100);

                /* DUMMY RESPONSE
                    { id: 'rfnd_FXPS9VHG29zaDX',
                        entity: 'refund',
                        amount: 400000,
                        currency: 'INR',
                        payment_id: 'pay_FX3Ri7eBhC25MC',
                        notes: [],
                        receipt: null,
                        acquirer_data: { arn: null },
                        created_at: 1598885561,
                        batch_id: null,
                        status: 'processed',
                        speed_processed: 'normal',
                        speed_requested: 'optimum'
                    }
                */

                if (refundResponse && refundResponse.id) {
                    const updateObj = {
                        payment_info_id: paymentInfoId,
                        partner_txn_id: refundResponse.id,
                    };
                    const refundDetails = await PayMySQL.updatePaymentRefundByPaymentInfoId(db.mysql.write, updateObj);
                }
            } else if (result[0].source.toLowerCase() == 'paytm') {
                refundResponse = await PaytmHelper.refund(result[0].order_id, result[0].partner_txn_id, result[0].amount);
                if (refundResponse && refundResponse.body.refundId) {
                    const updateObj = {
                        payment_info_id: paymentInfoId,
                        partner_txn_id: refundResponse.body.refundId,
                    };
                    await PayMySQL.updatePaymentRefundByPaymentInfoId(db.mysql.write, updateObj);
                }
            } else if (result[0].source.toLowerCase() == 'wallet') {
                refundResponse = await PaymentHelper.walletRefund(db, config, result[0]);
                if (refundResponse.meta.success) {
                    const updateObj = {
                        payment_info_id: paymentInfoId,
                        partner_txn_id: `refund_${result[0].order_id}`,
                        wallet_status: refundResponse.meta.success ? 'SUCCESS' : 'FAILURE',
                        status: refundResponse.meta.success ? 'SUCCESS' : 'FAILURE',
                        wallet_amount: result[0].wallet_amount,
                        wallet_response: JSON.stringify(refundResponse),
                    };
                    const refundDetails = await PayMySQL.updatePaymentRefundByPaymentInfoId(db.mysql.write, updateObj);

                    await PayMySQL.updatePaymentSummary(db.mysql.write, result[0].partner_txn_id, result[0].amount, refundInfo.insertId);
                    await PayMySQL.deactivateSubscriptionForRefund(db.mysql.write, result[0].partner_txn_id);
                }
            } else {
                const updateObj = {
                    payment_info_id: paymentInfoId,
                    partner_txn_id: `refund_${result[0].partner_order_id}`,
                    status: 'SUCCESS',
                    partner_txn_response: `${result[0].source} refund initiated`,
                };
                refundResponse = updateObj;
                const refundDetails = await PayMySQL.updatePaymentRefundByPaymentInfoId(db.mysql.write, updateObj);

                await PayMySQL.updatePaymentSummary(db.mysql.write, result[0].partner_txn_id, result[0].amount, refundInfo.insertId);
                await PayMySQL.deactivateSubscriptionForRefund(db.mysql.write, result[0].partner_txn_id);
            }

            if (result[0].source.toLowerCase() != 'wallet' && result[0].wallet_amount > 0) {
                walletRefundResponse = await PaymentHelper.walletRefund(db, config, result[0]);

                const updateObj = {
                    payment_info_id: paymentInfoId,
                    wallet_status: walletRefundResponse.meta.success ? 'SUCCESS' : 'FAILURE',
                    wallet_amount: result[0].wallet_amount,
                    wallet_response: JSON.stringify(walletRefundResponse),
                };

                await PayMySQL.updatePaymentRefundByPaymentInfoId(db.mysql.write, updateObj);
            }

            res.status(200).json(refundResponse);
        } else {
            res.status(200).json({ message: 'No payment info found !!' });
        }
        // res.status(200);
    } catch (e) {
        console.log(e);
        next(e);
        // throw new Error(e);
    }
}

async function paymentLinkInfo(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_class: studentClass } = req.user;
        const { source } = req.query;
        const { page } = req.query;
        const event = 'vip_payment_failure';

        let paymentLink;
        const nudge = await NudgeMysql.getByEvent(db.mysql.read, event, studentClass);
        if (page === 'wallet') {
            paymentLink = await DNProperty.getNameAndValueByBucket(db.mysql.read, 'payment_link_wallet');
        } else {
            paymentLink = await DNProperty.getNameAndValueByBucket(db.mysql.read, 'payment_link');
        }
        const groupedPaymentLink = _.groupBy(paymentLink, 'name');
        const finalResponse = {};
        finalResponse.title = groupedPaymentLink.title[0].value;
        finalResponse.action_button_text = 'Share payment link';
        finalResponse.description = groupedPaymentLink.description[0].value.split('###');
        if (nudge.length) {
            finalResponse.nudge_id = nudge[0].id;
            finalResponse.is_show = source !== 'nudge' && source !== 'notification';
            finalResponse.count = nudge[0].count;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: finalResponse,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getPaymentLinkObj(assortmentId, studentClass, source, version_code, pay_using_wallet) {
    const event = 'vip_payment_failure';
    let nudge = await NudgeMysql.getByEventAndResourceId(db.mysql.read, event, studentClass, assortmentId);
    const nudgeByClass = await NudgeMysql.getByEventAndNoResource(db.mysql.read, event, studentClass);
    if (!nudge.length) {
        const assortmentDetails = await CourseMysql.getAssortmentDetailsFromId(db.mysql.read, assortmentId, studentClass);
        if (assortmentDetails.length && assortmentDetails[0].assortment_type === 'course') {
            nudge = nudgeByClass;
        }
    }
    const paymentLink = await DNProperty.getNameAndValueByBucket(db.mysql.read, 'payment_link');

    if (version_code < 840) {
        const paymentLinkGrouped = _.groupBy(paymentLink, 'name');
        const finalResponse = {};
        finalResponse.title = paymentLinkGrouped.title[0].value;
        finalResponse.action_button_text = 'Share payment link';
        finalResponse.description = paymentLinkGrouped.description[0].value.split('###');
        if (nudge.length) {
            finalResponse.nudge_id = nudge[0].count;
            finalResponse.is_show = source !== 'nudge' && source !== 'notification';
            finalResponse.count = nudge[0].id;
        }
        return finalResponse;
    }

    const payment_link = {};
    const paymentLinkGrouped = _.groupBy(paymentLink, 'name');
    const finalResponse = {};
    finalResponse.title = paymentLinkGrouped.title[0].value;
    finalResponse.action_button_text = 'Share Link';
    finalResponse.text2 = 'Via payment link';
    finalResponse.text3 = 'Pay via debit/credit card/UPI';
    finalResponse.description = paymentLinkGrouped.description[0].value.split('###');
    if (nudge.length) {
        finalResponse.nudge_id = nudge[0].count;
        finalResponse.is_show = source !== 'nudge' && source !== 'notification';
        finalResponse.count = nudge[0].id;
    }

    payment_link.link = finalResponse;
    if (!pay_using_wallet) {
        payment_link.qr = {
            text2: 'Via QR Code',
            text3: 'Pay Via GooglePay/PhonePe/Paytm UPI',
            action_button_text: 'View QR Code',

        };
    }
    return payment_link;
}

async function getWalletObj(req) {
    let walletObj;
    const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken: req.headers['x-auth-token'] });
    if (walletInfo && walletInfo.data) {
        walletObj = { amount: walletInfo.data.is_active ? walletInfo.data.amount : 0, show_add_money: false };
    } else {
        walletObj = { amount: 0, show_add_money: false };
    }
    walletObj.info = `Available Balance: ₹${walletObj.amount}`;
    return walletObj;
}

async function checkoutPage(req, res, next) {
    try {
        // Need to refactor this api
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const { variant_id } = req.body;
        let { coupon_code } = req.body;
        const { version_code } = req.headers;
        const { student_class } = req.user;
        const { locale } = req.user;
        const { source } = req.query;
        const { payment_for } = req.body;
        let preAppliedCoupon = false;
        let responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        responseData.data.info = {};

        const referralCodeValid = 0;

        let packageInfo;
        if (payment_for == 'WALLET') {
            responseData.data.info.final_amount = req.body.amount;
        } else {
            packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);
            if (packageInfo.length > 0) {
            // do not show coupon if emi package
            /*
                        if(package[0].type == 'emi') {
                            package[0].show_coupon = 0;
                        } else {
                            package[0].show_coupon = 1;
                        }
            */
                packageInfo[0].show_coupon = 1;
                packageInfo[0].emi_order = packageInfo[0].emi_order ? `EMI Installment - ${packageInfo[0].emi_order} |` : '';
                packageInfo[0].package_duration = `${parseInt(packageInfo[0].duration_in_days / 30)} Months`;
                if (!coupon_code) {
                // check for pre applied referral coupons
                    const couponData = await CourseMysqlV2.getPreAppliedCoupon(db.mysql.read, student_id);
                    if (couponData.length > 0) {
                        coupon_code = couponData[0].coupon_code;
                        preAppliedCoupon = true;
                    }
                }

                // coupon code validation
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
                    // start and end date check, min and max version code check
                    promise.push(Package.getCouponDetailsUsingCouponCode(db.mysql.read, coupon_code, version_code));
                    promise.push(Package.getCouponTg(db.mysql.read, coupon_code));
                    // coupon package applicability check
                    promise.push(Package.getCouponPackageByCouponAndPackageID(db.mysql.read, coupon_code, packageInfo[0].package_id));
                    promise.push(Package.getCouponPackages(db.mysql.read, coupon_code));
                    promise.push(CouponMySQL.getInfoByStudentId(db.mysql.read, student_id));
                    promise.push(CouponMySQL.getInfoByStudentReferalCoupons(db.mysql.read, coupon_code));
                    const [couponDetails, couponTg, couponPackageId, couponPackages, referralInfo, couponReferralInfo] = await Promise.all(promise);

                    // eslint-disable-next-line no-mixed-operators
                    if ((referralInfo.length == 0 || (referralInfo[0].coupon_code != coupon_code)) && (couponDetails.length > 0 && couponPackageId.length == 0 && couponPackages.length == 0) || (couponDetails.length > 0 && couponPackageId.length > 0 && couponPackages.length > 0)) {
                    // get total number of times the coupon was claimed and number of times the coupon was claimed by student
                    // console.log(couponDetails);
                        const totalCouponsClaimed = await Package.getGetCouponClaimedTotal(db.mysql.read, coupon_code);
                        if (couponDetails[0].claim_limit == null || couponDetails[0].claim_limit > totalCouponsClaimed.length) {
                            const obj = _.countBy(totalCouponsClaimed, (c) => c.student_id == student_id);
                            // console.log(obj)
                            if (!obj.true) obj.true = 0;
                            if (obj.true < couponDetails[0].limit_per_student || totalCouponsClaimed.length == 0) {
                                let tgCheck = false;
                                // TG Check
                                if (couponTg.length > 0) {
                                    for (let j = 0; j < couponTg.length; j++) {
                                        if (couponTg[j].type == 'generic') {
                                            tgCheck = true;
                                            break;
                                        } else if (couponTg[j].type == 'specific' && couponTg[j].value == student_id) {
                                            tgCheck = true;
                                            break;
                                        } else if (couponTg[j].type == 'target-group') {
                                            // eslint-disable-next-line no-await-in-loop
                                            tgCheck = await TGHelper.targetGroupCheck({
                                                db, studentId: student_id, tgID: couponTg[j].value, studentClass: student_class, locale,
                                            });
                                        } else if (couponTg[j].type == 'assortment-type') {
                                            // eslint-disable-next-line no-await-in-loop
                                            const assortmentDetails = await CourseMysql.getAssortmentDetailsFromId(db.mysql.read, [packageInfo[0].assortment_id], student_class);
                                            if (assortmentDetails.length && assortmentDetails[0].assortment_type == couponTg[j].value) {
                                                tgCheck = true;
                                                break;
                                            }
                                        }
                                    }
                                }

                                if (tgCheck) {
                                    const { final_amount } = packageInfo[0];
                                    packageInfo[0].min_limit = Math.ceil(final_amount * (packageInfo[0].min_limit_percentage / 100));
                                    let invalidCoupon = false;
                                    let discountAmount = 0;
                                    if (couponReferralInfo && couponReferralInfo.length > 0) {
                                        if (packageInfo[0].final_amount >= 1500) {
                                            couponDetails[0].value_type = 'amount';
                                            couponDetails[0].value = Data.referralDetails.referral_paytm.referral_amount;
                                        } else {
                                            invalidCoupon = true;
                                        }
                                    }
                                    if (couponDetails[0].value_type == 'amount') {
                                        packageInfo[0].final_amount -= couponDetails[0].value;
                                        discountAmount = couponDetails[0].value;
                                    } else if (couponDetails[0].value_type == 'percent') {
                                        discountAmount = Math.round((couponDetails[0].value * packageInfo[0].final_amount) / 100);
                                        if (discountAmount > couponDetails[0].max_limit) {
                                            discountAmount = couponDetails[0].max_limit;
                                        }
                                        packageInfo[0].final_amount -= discountAmount;
                                    } else if (couponDetails[0].value_type == 'flat') {
                                        if (packageInfo[0].final_amount > couponDetails[0].value) {
                                            discountAmount = packageInfo[0].final_amount - couponDetails[0].value;
                                            packageInfo[0].final_amount = couponDetails[0].value;
                                        } else {
                                            invalidCoupon = true;
                                        }
                                    }
                                    if (invalidCoupon) {
                                        packageInfo[0].coupon_code = coupon_code;
                                        packageInfo[0].coupon_status_text = 'Invalid Coupon';
                                        packageInfo[0].coupon_status = 'FAILURE';
                                        responseData.data.info = packageInfo[0];
                                    } else {
                                        if (packageInfo[0].final_amount < packageInfo[0].min_limit && couponDetails[0].value_type !== 'flat') {
                                            discountAmount = final_amount - packageInfo[0].min_limit;
                                            packageInfo[0].final_amount = packageInfo[0].min_limit;
                                        }
                                        if (coupon_code.toLowerCase() === 'internal') {
                                            packageInfo[0].final_amount = 1;
                                        }
                                        packageInfo[0].coupon_code = coupon_code;
                                        packageInfo[0].coupon_status_text = 'Coupon successfully applied';
                                        packageInfo[0].coupon_status = 'SUCCESS';
                                        packageInfo[0].coupon_discount = discountAmount;
                                        packageInfo[0].total_amount = packageInfo[0].final_amount + discountAmount;

                                        responseData.data.info = packageInfo[0];
                                    }
                                } else {
                                    if (coupon_code && !preAppliedCoupon) {
                                        packageInfo[0].coupon_code = coupon_code;
                                        packageInfo[0].coupon_status_text = 'Invalid Coupon';
                                        packageInfo[0].coupon_status = 'FAILURE';
                                    }

                                    responseData.data.info = packageInfo[0];
                                }
                            } else {
                                if (coupon_code) {
                                    packageInfo[0].coupon_code = coupon_code;
                                    packageInfo[0].coupon_status_text = 'Coupon already claimed';
                                    packageInfo[0].coupon_status = 'FAILURE';
                                }
                                responseData.data.info = packageInfo[0];
                            }
                        } else {
                            if (coupon_code) {
                                packageInfo[0].coupon_code = coupon_code;
                                packageInfo[0].coupon_status_text = 'Coupon claim limit reached';
                                packageInfo[0].coupon_status = 'FAILURE';
                            }
                            responseData.data.info = packageInfo[0];
                        }
                    } else {
                        if (coupon_code && !preAppliedCoupon) {
                            packageInfo[0].coupon_code = coupon_code;
                            packageInfo[0].coupon_status_text = 'Invalid Coupon';
                            packageInfo[0].coupon_status = 'FAILURE';
                            const expiryCheck = await Package.getCouponDetailsUsingCouponCodeForExpiryCheck(db.mysql.read, coupon_code);
                            if (expiryCheck.length > 0) {
                                packageInfo[0].coupon_status_text = 'Your coupon has expired';
                            }
                        }
                        responseData.data.info = packageInfo[0];
                    }
                } else {
                    responseData.data.info = packageInfo[0];
                }
            } else {
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Invalid Package ID',
                    },
                };
            }
        }
        /*
        // Adding banners like APB etc
        let banners =  await Properties.getNameAndValueByBucket(db.mysql.read, "payment_banner");
        banners = banners.map(option => {
            // const key = option.name;
            const value = {};
            option.value.split('#!#').map( data => {
                const pairs = data.split('#!!#');
                Object.assign(value,{[pairs[0]] : pairs[1]});
            });
            return value;
        });
        responseData.data.info.banners = banners;
*/

        if (payment_for != 'WALLET') {
            responseData.data.wallet = {};
            responseData.data.wallet = await getWalletObj(req);
            responseData.data.info.show_coupon = 1;
            responseData.data.info.wallet_amount = responseData.data.wallet.amount;
            responseData.data.info.final_amount_with_wallet = responseData.data.info.final_amount - responseData.data.info.wallet_amount;
            responseData.data.info.pay_using_wallet = responseData.data.info.final_amount_with_wallet <= 0;

            if (responseData.data.info.final_amount_with_wallet <= 0) {
                responseData.data.info.final_amount_with_wallet = 0;
            }
        }

        // get paymentlink info

        // for wallet send assortment as null

        /*
        if (version_code >= 813) {
            responseData.data.payment_link = {};
            responseData.data.payment_link = await getPaymentLinkObj(payment_for != 'WALLET' ? packageInfo[0].assortment_id : 0, student_class, source, version_code, responseData.data.info.pay_using_wallet);
        } else {
*/
        responseData.data.payment_link = null;
        // }

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function paymentLinkCreate(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const { amount } = req.body;
        const packageId = req.body.package_id;
        // amount is 0 throw error;

        let amountCheck = true;
        if (req.body.variant_id && req.body.payment_for === 'course_package' && (req.body.coupon_code == null || _.isEmpty(req.body.coupon_code))) {
            const variantDetails = await Package.getVariantByIdAndAmount(db.mysql.read, req.body.variant_id, req.body.amount);
            if (!variantDetails.length) {
                amountCheck = false;
            }
        }

        if (_.isEmpty(amount) || amount == 0 || amount.length == 0 || !amountCheck) {
            const responseData = {
                meta: {
                    code: 500,
                    success: false,
                    message: 'Invalid amount',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        const insertObjPI = {};

        insertObjPI.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
        insertObjPI.payment_for = req.body.payment_for;
        insertObjPI.amount = amount;
        insertObjPI.student_id = studentId;
        insertObjPI.status = 'INITIATED';
        insertObjPI.source = 'RAZORPAY';
        insertObjPI.created_from = 'app-payment-link';
        insertObjPI.total_amount = req.body.total_amount;
        if (req.body.coupon_code) {
            if (!parseInt(req.body.discount)) {
                const coupon_info = await Package.getCouponInfo(db.mysql.read, req.body.coupon_code);
                if (coupon_info.length) {
                    req.body.discount = coupon_info[0].value;
                }
            }
            insertObjPI.coupon_code = req.body.coupon_code;
        }
        if (req.body.discount) insertObjPI.discount = req.body.discount;
        if (req.body.variant_id) insertObjPI.variant_id = req.body.variant_id;
        const responseInfo = {};

        const date = new Date();
        date.setDate(date.getDate() + 2);

        const rzp = new Razorpay({
            key_id: config.RAZORPAY_KEY_ID,
            key_secret: config.RAZORPAY_KEY_SECRET,
        });

        let packageName = 'Doubtnut';
        if (insertObjPI.variant_id) {
            const packageInfo = await Package.getVariantInfo(db.mysql.read, insertObjPI.variant_id);
            packageName = `${packageInfo[0].name} package`;
        }

        console.log('insertObjPI', insertObjPI);
        console.log('req.body.coupon_code', req.body);

        const fetchPaymentInfoObj = _.clone(insertObjPI);

        const previousPaymentLink = await PayMySQL.getPaymentInfoForPaymentLink(db.mysql.read, insertObjPI);

        console.log('previousPaymentLink', previousPaymentLink);

        const rzpObj = {
            type: 'link',
            description: `Payment for ${packageName}`,
            amount: parseFloat(amount) * 100,
            expire_by: Math.floor(date / 1000),
            customer: {
                contact: req.user.mobile,
                email: `payments+${studentId}@doubtnut.com`,
            },
        };

        const razorpayResponse = await RazorpayHelper.createStandardLink(rzpObj);

        console.log('razorpayResponse', razorpayResponse);
        insertObjPI.partner_order_id = razorpayResponse.id;
        await PayMySQL.createPayment(db.mysql.write, insertObjPI);
        PayMySQL.setRzpPaymentLink(db.mysql.write, {
            payment_info_id: insertObjPI.insertId, student_id: studentId, link_id: insertObjPI.partner_order_id, status: 'INITIATED',
        });

        if (insertObjPI.payment_for.toLowerCase() == 'wallet') {
            responseInfo.share_message = `Mere liye Doubtnut par wallet me ₹${amount} add karne ke liye iss link par click kijiye : ${razorpayResponse.short_url}`;
        } else {
            responseInfo.share_message = `Mere liye Doubtnut par ₹${amount} ka ${packageName.trim()} buy karne ke liye iss link par click kijiye : ${razorpayResponse.short_url}`;
        }
        responseInfo.url = razorpayResponse.short_url;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: responseInfo,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function checkoutPaymentDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let upgradeCheck = {};
        const { student_id, locale } = req.user;
        const {
            variant_id, amount, payment_for, remove_coupon,
        } = req.body;

        let { use_wallet, coupon_code } = req.body;
        const { version_code, is_browser: isBrowser, 'x-auth-token': xAuthToken } = req.headers;

        let package_original_amount = 0; let package_min_limit = 0; let package_discount = 0; let
            package_final_amount = 0;
        let wallet_amount_usable = 0; let wallet_cash_amount = 0; let wallet_reward_amount = 0; let wallet_reward_amount_usable = 0;
        let coupon_amount = 0;
        let coupon_info;

        if (coupon_code == 'null') {
            coupon_code = '';
        }
        let packageInfo;
        const amount_info = {};
        const eventName = coupon_code ? 'COUPONCODE_APPLIED' : 'BUYNOW_CLICK';

        if (version_code >= 888) {
            coupon_info = PaymentConstants.coupon_info_vc888(req.user.locale);
        } else {
            // eslint-disable-next-line no-lonely-if
            coupon_info = PaymentConstants.coupon_info(req.user.locale);
        }
        const wallet_info = {
            amount: '',
            show_add_money: false,
            info: 'Usable Balance: ₹',
            show_wallet: 1,
        };

        if (payment_for == 'course_package' || payment_for == 'doubt') {
            packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);

            if (packageInfo.length > 0) {
                package_original_amount = packageInfo[0].original_amount;
                package_discount = packageInfo[0].discount_amount;
                package_final_amount = packageInfo[0].final_amount;
            }
            if (payment_for == 'course_package' && packageInfo && packageInfo.length) {
                upgradeCheck = await CourseHelper.getDifferenceAmountForUpgradeSubscription({
                    db, studentID: student_id, assortmentID: packageInfo[0].assortment_id,
                });
                if (!_.isEmpty(upgradeCheck) && upgradeCheck.amount < packageInfo[0].total_amount && upgradeCheck.duration < packageInfo[0].duration_in_days) {
                    package_discount += upgradeCheck.amount;
                    packageInfo[0].final_amount -= upgradeCheck.amount;
                    package_final_amount -= upgradeCheck.amount;
                }
            }
            if (packageInfo.length > 0) {
                package_min_limit = Math.ceil(package_final_amount * (packageInfo[0].min_limit_percentage / 100));
                packageInfo[0].min_limit = package_min_limit;
            }
            if (packageInfo.length > 0 && package_min_limit > package_final_amount) {
                logger.error({ tag: 'Payment', source: 'checkoutPaymentDetails', error: `Min limit error:\nvariant_id: ${packageInfo[0].variant_id}` });
                throw new Error('Payment error');
            }
        } else if (payment_for == 'wallet') {
            use_wallet = 0;
            package_original_amount = amount;
            package_final_amount = amount;
        } else if (payment_for == 'bounty') {
            package_original_amount = amount;
            package_final_amount = amount;
            use_wallet = 0;
        }

        try {
            const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken: req.headers['x-auth-token'] });
            wallet_cash_amount = +walletInfo.data.cash_amount;
            wallet_reward_amount = +walletInfo.data.reward_amount;
        } catch (e) {
            console.log(e);
        }

        if (packageInfo && packageInfo.length && !remove_coupon) {
            const coupon_data = await CouponContainer.fetchCouponApplyData(db, req.user, coupon_code, packageInfo, version_code, xAuthToken);
            console.log('coupon_data', coupon_data);
            coupon_info.status = coupon_data.status == 'SUCCESS';
            coupon_info.message = coupon_data.status_text;
            coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_code.webp`;
            coupon_info.code = coupon_code;

            if (coupon_data.status == 'SUCCESS') {
                coupon_info.cta_button = 'Applied';
                coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_tick.webp`;
                coupon_amount = coupon_data.amount;
            } else if (coupon_code.length != 0) {
                coupon_info.code = coupon_code;
                coupon_info.status = false;
            } else {
                coupon_info.code = coupon_code;
                coupon_info.status = null;
            }
            coupon_info.code = coupon_data.code;
        } else {
            coupon_info.status = null;
            coupon_info.code = coupon_code;
            coupon_info.message = '';
        }
        if (package_final_amount == package_min_limit) {
            coupon_info.status = false;
            coupon_info.message = 'iss course par aur discount laagu nahi ho sakta hai';
        }
        // For version >=880 coupon_info.status is either false or SUCCESS
        if (version_code >= 888) {
            if (coupon_info.cta_button == 'Applied') {
                coupon_info.cta_button = `${global.t8[locale].t('Remove'.toUpperCase(), 'Remove')}`;
            }
            if (coupon_info.status == null) {
                coupon_info.status = false;
            }
        }
        // For version >=880 coupon_info.status is either false or SUCCESS
        if (version_code >= 888) {
            if (coupon_info.cta_button == 'Applied') {
                coupon_info.cta_button = `${global.t8[locale].t('Remove'.toUpperCase(), 'Remove')}`;
            }
            if (coupon_info.status == null) {
                coupon_info.status = false;
            }
        }

        /** ************************Computation************************* */

        // 1. Coupon
        let package_final_amount_after_coupon_discount = package_final_amount;
        if (coupon_amount > 0) {
            coupon_amount = Math.min(coupon_amount, package_final_amount);
            package_final_amount_after_coupon_discount = package_final_amount - coupon_amount;
        }
        if (payment_for == 'wallet' || payment_for == 'bounty') {
            coupon_info = null;
        }
        // 1 end

        // 2. Wallet Cash
        let wallet_cash_amount_usable = Math.min(wallet_cash_amount, package_final_amount_after_coupon_discount);
        // 2 end

        // 3. Wallet Reward
        if (payment_for == 'course_package') {
            wallet_reward_amount_usable = Math.min(
                PaymentConstants.wallet_reward_options.max_amount,
                package_final_amount_after_coupon_discount * PaymentConstants.wallet_reward_options.factor,
                wallet_reward_amount,
                package_final_amount_after_coupon_discount - package_min_limit,
                package_final_amount_after_coupon_discount - wallet_cash_amount_usable,
            );

            /*
            * In case of upgrades when total_amount < min_limit, wallet_reward_amount will be 0 otherwise complete upgrade can be done using wallet.
            */
            if (package_final_amount_after_coupon_discount < package_min_limit) {
                wallet_reward_amount_usable = 0;
            }
        }
        // 3 end

        wallet_amount_usable = wallet_cash_amount_usable + wallet_reward_amount_usable;

        if (!use_wallet) {
            wallet_amount_usable = 0;
            wallet_cash_amount_usable = 0;
            wallet_reward_amount_usable = 0;
        }

        if (wallet_cash_amount + wallet_reward_amount == 0) {
            wallet_info.info = `Total Balance: ₹${wallet_cash_amount}`;
        } else {
            wallet_info.info = `Total Balance: ₹${wallet_cash_amount + wallet_reward_amount}\nUsable Balance: ₹${wallet_amount_usable}`;
        }

        // eslint-disable-next-line no-nested-ternary
        wallet_info.show_wallet = payment_for != 'wallet' && payment_for != 'bounty' ? wallet_amount_usable > 0 ? 1 : 2 : 0;

        // Net Amount: Since all the discount components have sanity checks, no need for step calculation.
        const net_amount = Math.max(package_final_amount - coupon_amount - wallet_amount_usable, 0);

        const payment_details = {

            title: global.t8[locale].t('Payment Details'.toUpperCase(), 'Payment Details'),
            cart_info: [{
                name: global.t8[locale].t('Original'.toUpperCase(), 'Original'),
                key: 'amount',
                value: package_original_amount,
                color: '#222222',
            }, {
                name: global.t8[locale].t('Discount'.toUpperCase(), 'Discount'),
                key: 'discount',
                value: package_discount != 0 ? -package_discount : null,
                color: '#222222',
            }, {
                name: global.t8[locale].t('Coupon Code'.toUpperCase(), 'Coupon Code'),
                key: 'coupon_code',
                value: coupon_amount != 0 ? -coupon_amount : null,
                color: '#54B726',
            }, {
                name: global.t8[locale].t('DN Wallet'.toUpperCase(), 'DN Wallet'),
                key: 'wallet_amount',
                value: wallet_amount_usable != 0 ? -wallet_amount_usable : null,
                color: '#333333',
            }, {
                name: global.t8[locale].t('Final Price'.toUpperCase(), 'Final Price'),
                key: 'net_amount',
                value: net_amount,
                color: '#273de9',
            }],

            view_details_text: global.t8[locale].t('View Details'.toUpperCase(), 'View Details'),
            action_button: global.t8[locale].t('Buy Now'.toUpperCase(), 'Buy Now'),
            coupon_info,
            wallet_info,
        };

        PaymentRedis.setPaymentCartOption(db.redis.write, student_id, payment_details);
        if (isBrowser) {
            const eventData = {
                student_id,
                assortment_id: packageInfo[0].assortment_id,
                coupon_code,
                event_name: eventName,
                ip: req.ip,
                hostname: req.hostname,
                student_locale: locale,
                student_class: req.user.student_class,
            };
            EventsModule.putEventIntoMongoWrapper(db, eventData);
        }

        // carousel handling
        PaymentHelper.continueWithCourseCarouselHandler(db, packageInfo, coupon_code, student_id, variant_id, version_code);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: payment_details,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function bbpsInfo(req, res, next) {
    try {
        db = req.app.get('db');
        const { token } = req.query;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        const payload = JSON.parse(UtilityEncrypt.decrypt(token));

        console.log(payload);

        const {
            student_id, variant_id, locale, x_auth, payment_for, phone_number, order_info, version_code,
        } = payload;

        const cartDataString = await PaymentRedis.getPaymentCartOption(db.redis.read, student_id);

        let cartDetails = {};
        if (cartDataString && cartDataString.length) {
            cartDetails = JSON.parse(cartDataString);

            const coupon_code = (cartDetails.coupon_info) ? cartDetails.coupon_info.code : null;
            const cartObj = _.groupBy(cartDetails.cart_info, 'key');
            order_info.wallet_amount = cartObj.wallet_amount[0].value;
            order_info.total_amount = Math.abs(cartObj.amount[0].value);
            order_info.net_amount = cartObj.net_amount[0].value;
            order_info.discount = cartObj.discount[0].value;
            order_info.coupon_amount = cartObj.coupon_code[0].value;

            if (order_info.net_amount > 0) {
                const headers = { 'Content-Type': 'application/json' };
                headers['x-auth-token'] = x_auth;
                headers.version_code = version_code;
                const { data } = await axios({
                    method: 'POST',
                    url: `${PaymentConstants.api_url}v3/payment/start`,
                    timeout: 10000,
                    headers,
                    data: {
                        method: 'bbps', source: 'BBPS', payment_for, payment_info: { variant_id, coupon_code, dn_wallet: true },
                    },
                });

                await PayMySQL.updateBBPSByStudent(db.mysql.write, {
                    student_id, status: 'INACTIVE',
                });

                PayMySQL.setBBPSMapping(db.mysql.write, {
                    student_id, status: 'ACTIVE', payment_info_id: data.data.payment_id,
                });

                responseData.data.bbps = true;
                responseData.data.order_info = order_info;
                responseData.data.order_info.phone_number = phone_number;

                return res.status(responseData.meta.code).json(responseData);
            }
        }

        responseData.data.bbps = false;
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function shiprocketHook(req, res) {
    const shiprocketBody = req.body;

    db = req.app.get('db');
    config = req.app.get('config');
    console.log('shiprocketBody', shiprocketBody);

    const obj = {
        order_status: shiprocketBody.shipment_status,
        etd: shiprocketBody.etd,
    };

    db.mongo.write.collection('shiprocket_webhook').save({ ...shiprocketBody, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });
    const spsEndDate = moment(shiprocketBody.etd).add(2, 'd').endOf('day').format('YYYY-MM-DD HH:mm:ss');
    // Send tracking Update SMS to user if shipment_status is new
    const shiprocketInfo = await PayMySQL.getShiprocketPaymentInfoByOrderId(db.mysql.read, shiprocketBody.order_id);

    if (shiprocketInfo.length) {
        if (shiprocketInfo[0].etd == null) {
            const spsObj = {
                end_date: spsEndDate,
            };
            await PayMySQL.updateStudentPackageSubscriptionByOrderId(db.mysql.write, spsObj, shiprocketBody.order_id);
        }

        if (shiprocketInfo[0].order_status != shiprocketBody.shipment_status) {
            if (['OUT FOR DELIVERY'].includes(shiprocketBody.shipment_status)) {
                const json_payload = {
                    course_name: '', coupon_code: '', variant_id: shiprocketInfo[0].variant_id, mobile: '', version_code: shiprocketInfo[0].version_code, show_activation: 1, locale: shiprocketInfo[0].locale,
                };
                const xAuthToken = Token.sign({ id: shiprocketInfo[0].student_id }, config.jwt_secret_new);
                let tinyUrl;
                try {
                    tinyUrl = await axiosInstance.configMicroInst({
                        method: 'POST',
                        url: `${config.microUrl}/api/deeplink/tinyurl`,
                        data: {
                            url: `https://api.doubtnut.com/static/sr.html?info=${encodeURI(JSON.stringify(json_payload))}&token=${xAuthToken}`,
                            tag: 'cod',
                        },
                    });
                    console.log('response micro', tinyUrl.data);
                } catch (e) {
                    console.error('error', e);
                }
                const deeplink = `doubtnutapp://action_web_view?url=${tinyUrl.data}`;
                const smsDeeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'ADITYA_USER', deeplink);
                console.log(deeplink);
                console.log(smsDeeplink);
                messages.sendSms({
                    mobile: shiprocketInfo[0].student_mobile,
                    msg: `Dear Student, \nHurray aaj aapka order aapke ghar aa raha ha🎉🥳\nAmount 💸 : ${shiprocketInfo[0].amount} \nCourse activate karein: ${smsDeeplink.url}\n\n-Team Doubtnut`,
                    msg_type: 'Unicode_Text',
                });
            } else if (['IN TRANSIT'].includes(shiprocketBody.shipment_status)) {
                const json_payload = {
                    course_name: '', coupon_code: '', variant_id: shiprocketInfo[0].variant_id, mobile: '', version_code: shiprocketInfo[0].version_code, show_activation: 0, locale: shiprocketInfo[0].locale,
                };
                const xAuthToken = Token.sign({ id: shiprocketInfo[0].student_id }, config.jwt_secret_new);
                let tinyUrl;
                try {
                    tinyUrl = await axiosInstance.configMicroInst({
                        method: 'POST',
                        url: `${config.microUrl}/api/deeplink/tinyurl`,
                        data: {
                            url: `https://api.doubtnut.com/static/sr.html?info=${encodeURI(JSON.stringify(json_payload))}&token=${xAuthToken}`,
                            tag: 'cod',
                        },
                    });
                    console.log('response micro', tinyUrl.data);
                } catch (e) {
                    console.error('error', e);
                }
                const deeplink = `doubtnutapp://action_web_view?url=${tinyUrl.data}`;
                const smsDeeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'ADITYA_USER', deeplink);
                console.log(deeplink);
                console.log(smsDeeplink);

                messages.sendSms({
                    mobile: shiprocketInfo[0].student_mobile,
                    msg: `Dear Student, \nAapka order pack hogayi hai 🎁🧧\nAbhi Track kare  ✈️: ${smsDeeplink.url}\n\n-Team Doubtnut`,
                    msg_type: 'Unicode_Text',
                });
            }
        }

        await PayMySQL.updatePaymentInfoShiprocketByOrderId(db.mysql.write, obj, shiprocketBody.order_id);
    }

    const shipmentStatusObj = {
        order_id: shiprocketBody.order_id,
        shipment_activity: shiprocketBody.scans[0].activity,
        shipment_location: shiprocketBody.scans[0].location,
        shipment_date: shiprocketBody.scans[0].date,
        order_status: shiprocketBody.shipment_status,
    };

    PayMySQL.addShipmentTrackingActivity(db.mysql.write, shipmentStatusObj);

    const activeStudentSubscription = await PayMySQL.getActiveStudentPackageSubscriptionByOrderId(db.mysql.read, shiprocketBody.order_id);
    if (shiprocketBody.shipment_status == 'UNDELIVERED' && activeStudentSubscription.length) {
        const studentSubscriptionObj = {
            is_active: 0,
        };
        await PayMySQL.updateStudentPackageSubscriptionByOrderId(db.mysql.write, studentSubscriptionObj, shiprocketBody.order_id);
    }
    if (shiprocketBody.shipment_status.includes('RTO') && shiprocketInfo.length) {
        await PaymentHelper.cancelCODOrderWithPISId(db, shiprocketInfo[0].id);
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
    };

    res.status(responseData.meta.code).json(responseData);
}

async function checkForPincodeServiceability(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { delivery_postcode } = req.query;
    const { student_id } = req.user.student_id;
    let cod_status = false; let state; let city;

    try {
        if (delivery_postcode.length == 6) {
            const queryString = {
                pickup_postcode: '122009',
                delivery_postcode,
                cod: '1',
                weight: '0.2',
            };
            let shiprocketResponse = await ShipRocketHelper.pinCodeCheck(queryString);

            shiprocketResponse = JSON.parse(shiprocketResponse);

            if (shiprocketResponse && shiprocketResponse.data && shiprocketResponse.data.available_courier_companies) {
                cod_status = true;
            }
            let postalCodeInfo = await new Promise((resolve, reject) => {
                request({
                    method: 'GET',
                    url: `http://www.postalpincode.in/api/pincode/${delivery_postcode}`,
                    headers: {},
                }, (error, response) => {
                    if (error) throw new Error(error);
                    resolve(response.body);
                });
            });

            postalCodeInfo = JSON.parse(postalCodeInfo);

            if (postalCodeInfo && postalCodeInfo.PostOffice && postalCodeInfo.PostOffice.length) {
                state = postalCodeInfo.PostOffice[0].State;
                city = postalCodeInfo.PostOffice[0].District;
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { cod_status, state, city },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function confirmCODOrder(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const studentId = req.user.student_id;
        const { session_id, payment_info_id, otp_not_required } = req.body;
        const { otp: otp_entered_by_user } = req.body;

        if (!otp_not_required) {
            const params = {
                sessionId: session_id,
                otp_entered_by_user: parseInt(otp_entered_by_user),
            };
            let rpResp = {};

            try {
                rpResp = await OtpFactory.verifyOtpResponse(params);
            } catch (e) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'Wrong OTP',
                    },
                };
                console.log(responseData);
                return res.status(responseData.meta.code).json(responseData);
            }
        }

        // const student_info = await Student.getById(studentId, db.mysql.read);
        const student_info = await StudentContainer.getById(studentId, db);
        const userEmail = (!_.isEmpty(student_info[0].student_email) && /\S+@\S+\.\S+/.test(student_info[0].student_email)) ? student_info[0].student_email.trim() : `payments+${studentId}@doubtnut.com`;
        const userPhone = (!_.isEmpty(student_info[0].mobile)) ? student_info[0].mobile : studentId;
        const shiprocketInfo = await PayMySQL.getShiprocketPaymentInfo(db.mysql.read, payment_info_id);
        if (shiprocketInfo[0].is_otp_verified == 1) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Unable to Place Order',
                },
            };
            console.log(responseData);
            return res.status(responseData.meta.code).json(responseData);
        }
        console.log(shiprocketInfo);
        const packageInfo = await Package.getNewPackageWithTransliterationFromVariantId(db.mysql.read, shiprocketInfo[0].variant_id);
        const addressInfo = await PayMySQL.getAddressWithStudentIdAndAddressId(db.mysql.read, studentId, shiprocketInfo[0].student_address_mapping_id);
        if (packageInfo[0].package_name_trans_manual) {
            packageInfo[0].package_name = packageInfo[0].package_name_trans_manual;
        } else if (packageInfo[0].package_name_trans) {
            packageInfo[0].package_name = packageInfo[0].package_name_trans;
        }
        console.log(packageInfo[0].package_name);
        console.log(addressInfo);
        const payload = JSON.stringify({
            order_id: shiprocketInfo[0].order_id,
            order_date: (moment(new Date()).format('YYYY-MM-DD HH:mm')).toString(),
            pickup_location: 'Primary',
            channel_id: '',
            comment: '',
            billing_customer_name: addressInfo[0].student_name,
            billing_last_name: '',
            billing_address: addressInfo[0].address_line_1,
            billing_address_2: `${addressInfo[0].address_line_2}, ${addressInfo[0].landmark}`,
            billing_city: addressInfo[0].city,
            billing_pincode: addressInfo[0].pincode,
            billing_state: addressInfo[0].state,
            billing_country: 'India',
            billing_email: addressInfo[0].email,
            billing_phone: addressInfo[0].student_mobile,
            shipping_is_billing: true,
            order_items: [
                {
                    name: packageInfo[0].package_name,
                    sku: packageInfo[0].assortment_id, // course Id here or vairant id here
                    units: 1,
                    selling_price: shiprocketInfo[0].amount,
                },
            ],
            payment_method: 'COD',
            sub_total: shiprocketInfo[0].amount,
            length: 20,
            breadth: 10,
            height: 1,
            weight: 0.05,
        });

        const shiprocketResponse = await ShipRocketHelper.createOrder(payload);
        console.log('shiprocketResponse', typeof shiprocketResponse, shiprocketResponse);
        if (shiprocketResponse.shipment_id == null) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Unable to Place Order',
                },
            };
            console.log(responseData);
            res.status(responseData.meta.code).json(responseData);
        } else {
            const uniqueCode = CouponContainer.makeSomeRandom(6);
            const spsId = await PackageContainer.createSubscriptionEntryForTrialV1(db, studentId, packageInfo[0].assortment_id, -1, 10);
            console.log('spsId', spsId);
            await PayMySQL.updatePaymentInfoShiprocket(db.mysql.write, {
                unique_code: uniqueCode,
                is_otp_verified: 1,
                shipment_id: shiprocketResponse.shipment_id,
                shiprocket_order_id: shiprocketResponse.order_id,
                sps_id: spsId.insertId,
            }, shiprocketInfo[0].id);

            await PayMySQL.updatePaymentByOrderId(db.mysql.write, {
                partner_order_id: shiprocketResponse.order_id,
                order_id: shiprocketInfo[0].order_id,
            });

            const duration = Math.floor(packageInfo[0].duration_in_days / 30);
            const validity = duration === 1 ? `${duration} Month` : `${duration} Months`;
            messages.sendSms({
                mobile: addressInfo[0].student_mobile,
                msg: `Dear Student, \nAapki Order successfully place hogayi hai 😋\n\nCourse Name: ${packageInfo[0].package_name}\nCourse Validity: ${validity}\nCourse Amount: ${shiprocketInfo[0].amount}\n\n- Team Doubtnut`,
                msg_type: 'Unicode_Text',
            });
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    shipment_id: shiprocketResponse.shipment_id,
                    course_name: packageInfo[0].package_name,
                    amount: shiprocketInfo[0].amount,
                    validity: duration === 1 ? `${duration} Month` : `${duration} Months`,
                    deeplink: `doubtnutapp://course_details?id=${packageInfo[0].assortment_id}`,
                },
            };
            console.log(responseData);
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function generateOtp(phone) {
    const params = {
        phone,
        retryDelay: 15,
    };
    let response = {};
    let otpResendCount = 0;
    do {
        // eslint-disable-next-line no-await-in-loop
        response = await OtpFactory.otpServices(params);
        otpResendCount++;
        params.serviceStartIndex += 1;
    }
    while (!response && otpResendCount <= 4);
    return response;
}

async function createCODOrder(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { billing_info } = req.body;
        const { otp_not_required } = req.body;
        const { payment_info } = req.body;
        const { payment_for } = req.body;
        const { version_code } = req.headers;

        const {
            variant_id,
        } = payment_info;

        let { payment_info_id } = payment_info;
        const {
            address_id,
        } = billing_info;

        const studentId = req.user.student_id;
        let paymentEntry; let coupon_code;

        // check if any order is existing
        const codOrderInfo = await PayMySQL.checkActiveCODOrderWithStudentId(db.mysql.read, studentId);

        if (codOrderInfo.length) {
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'FAILURE',
                },
                data: { message: 'COD Order Already Exists' },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        if (payment_info_id != null) {
            paymentEntry = await PayMySQL.getPaymentInfoByIdAndStudentId(db.mysql.read, payment_info_id, studentId);
        }

        const address_details = await PayMySQL.getAddressWithStudentIdAndAddressId(db.mysql.read, studentId, address_id);

        let otpResponse;
        if (!otp_not_required) {
            otpResponse = await generateOtp(address_details[0].student_mobile);
            console.log(otpResponse);
        }
        if (payment_info_id == null || _.isEmpty(paymentEntry)) {
            const packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);

            const cartDataString = await PaymentRedis.getPaymentCartOption(db.redis.read, studentId);
            let cartDetails = {};
            if (cartDataString && cartDataString.length) {
                cartDetails = JSON.parse(cartDataString);

                const cartObj = _.groupBy(cartDetails.cart_info, 'key');
                const wallet_amount = Math.abs(cartObj.wallet_amount[0].value);
                const coupon_discount_amount = Math.abs(cartObj.coupon_code[0].value);
                const total_amount = Math.abs(packageInfo[0].final_amount);
                const net_amount = cartObj.net_amount[0].value;
                let discount = 0;
                let insert_coupon_flag = 0;
                if (coupon_discount_amount) {
                    discount = coupon_discount_amount;
                    insert_coupon_flag = 1;
                    coupon_code = cartDetails.coupon_info.code;
                }
                const order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
                const insertObj = {};
                insertObj.order_id = order_id;
                insertObj.payment_for = 'course_package';
                insertObj.amount = total_amount - discount - wallet_amount;
                insertObj.student_id = studentId;
                insertObj.source = 'SHIPROCKET';
                insertObj.status = 'INITIATED';
                insertObj.wallet_amount = wallet_amount;
                insertObj.total_amount = total_amount;
                insertObj.discount = discount;

                if (insert_coupon_flag) insertObj.coupon_code = coupon_code;

                insertObj.variant_id = variant_id;
                insertObj.mode = 'cod';

                const paymentInfoCreated = await PayMySQL.createPayment(db.mysql.write, insertObj);
                payment_info_id = paymentInfoCreated.insertId;
                const shipment_address = `${address_details[0].address_line_1}, ${address_details[0].address_line_2}, ${address_details[0].landmark}, ${address_details[0].city}, ${address_details[0].state}, ${address_details[0].pincode}`;
                await PayMySQL.createPaymentInfoShiprocket(db.mysql.write, {
                    student_id: studentId,
                    is_otp_verified: 0,
                    student_address_mapping_id: address_id,
                    payment_info_id,
                    is_active: 1,
                    shipment_address,
                });
            }
        }
        let responseData;
        if (!otp_not_required) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { sessionId: otpResponse.sessionId, ship_mobile: address_details[0].student_mobile, payment_info_id },
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { ship_mobile: address_details[0].student_mobile, payment_info_id },
            };
        }
        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function cancelCODOrder(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { pis_id } = req.query;

        await PaymentHelper.cancelCODOrderWithPISId(db, pis_id);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getAddressObj(studentId) {
    const addressList = await PayMySQL.getAddressWithStudentId(db.mysql.read, studentId);
    const addListFinal = [];
    if (addressList.length) {
        for (let i = 0; i < addressList.length; i++) {
            let responseInfo = {};
            responseInfo = {
                fullname: addressList[i].student_name,
                mobile_number: addressList[i].student_mobile,
                pincode: addressList[i].pincode,
                address_line_1: addressList[i].address_line_1,
                address_line_2: addressList[i].address_line_2,
                landmark: addressList[i].landmark,
                city: addressList[i].city,
                state: addressList[i].state,
                id: addressList[i].id,
            };
            console.log(responseInfo);
            addListFinal.push(responseInfo);
        }
    }
    return addListFinal;
}

async function codPricingDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const responseObj = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const { student_id, locale } = req.user;
        const cartDetails = JSON.parse(await PaymentRedis.getPaymentCartOption(db.redis.read, student_id));
        const cartObj = _.groupBy(cartDetails.cart_info, 'key');
        responseObj.data.wallet_amount = cartObj.wallet_amount[0].value;
        responseObj.data.total_amount = Math.abs(cartObj.amount[0].value);
        responseObj.data.net_amount = cartObj.net_amount[0].value;
        responseObj.data.discount = cartObj.discount[0].value;
        responseObj.data.coupon_amount = cartObj.coupon_code[0].value;
        responseObj.meta = {
            code: 200,
            success: true,
            message: 'SUCCESS',
        };
        res.status(responseObj.meta.code).json(responseObj);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function codPage(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const responseObj = {};
        const { student_id, locale } = req.user;

        const [codOrderInfo, cartDataString, studentInfo] = await Promise.all([
            PayMySQL.checkActiveCODOrderWithStudentId(db.mysql.read, student_id),
            PaymentRedis.getPaymentCartOption(db.redis.read, student_id),
            // Student.getById(student_id, db.mysql.read),
            StudentContainer.getById(student_id, db),
        ]);

        responseObj.userPhone = studentInfo[0].mobile;

        const { show_activation } = req.body;
        let cartDetails = {}; const order_info = {};

        if (codOrderInfo.length) {
            if (codOrderInfo[0].variant_id == req.body.variant_id) {
                // if order is shipped and has tracking as delivered :
                if (show_activation) {
                    responseObj.is_cod_order = true;
                    responseObj.show_activation = true;
                } else {
                    const [shiprocketTrackingResponse, courseDetails, isOrderShippedInfo] = await Promise.all([
                        ShipRocketHelper.trackOrder(codOrderInfo[0].shipment_id),
                        Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, codOrderInfo[0].variant_id),
                        PayMySQL.getShipmentTrackingActivityByOrderId(db.mysql.read, codOrderInfo[0].order_id),
                    ]);
                    const trackingArray = [];
                    // order_status_no : 1-Created, 2-Shipped, 3-OFD, 4-Undelivered, 5-Delivered, 6-CourseActivation
                    const json_payload = {
                        course_name: courseDetails[0].display_name,
                        coupon_code: '',
                        variant_id: codOrderInfo[0].variant_id,
                        mobile: req.user.mobile,
                        version_code: req.headers.version_code,
                        show_activation: 1,
                        locale,
                    };
                    let activation_deeplink = `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=`;
                    activation_deeplink += req.headers['x-auth-token'];
                    trackingArray.push({
                        order_status: global.t8[locale].t('Order Placed'.toUpperCase(), 'Order Placed'),
                        date: moment(codOrderInfo[0].created_at).format('Do MMMM YYYY'),
                        order_status_no: 1,
                        deeplink: activation_deeplink,
                    });
                    if (isOrderShippedInfo.length) {
                        trackingArray.push({
                            order_status: global.t8[locale].t('Shipped'.toUpperCase(), 'Shipped'),
                            order_status_no: 2,
                            date: moment(isOrderShippedInfo[0].shipment_date).format('Do MMMM YYYY'),
                            deeplink: activation_deeplink,
                        });
                    }
                    if (['UNDELIVERED', 'OUT FOR DELIVERY'].includes(codOrderInfo[0].order_status)) {
                        trackingArray.push({
                            order_status: ['OUT FOR DELIVERY'].includes(codOrderInfo[0].order_status) ? global.t8[locale].t('Out For Delivery'.toUpperCase(), 'Out For Delivery') : global.t8[locale].t('Undelivered'.toUpperCase(), 'Undelivered'),
                            order_status_no: ['OUT FOR DELIVERY'].includes(codOrderInfo[0].order_status) ? 3 : 4,
                            date: moment(codOrderInfo[0].updated_at).format('Do MMMM YYYY'),
                            deeplink: activation_deeplink,
                        });
                    } else if (['DELIVERED'].includes(codOrderInfo[0].order_status)) {
                        trackingArray.push({
                            order_status: global.t8[locale].t('Delivered'.toUpperCase(), 'Delivered'),
                            order_status_no: 5,
                            date: moment(codOrderInfo[0].updated_at).format('Do MMMM YYYY'),
                            deeplink: activation_deeplink,
                        },
                        {
                            order_status: global.t8[locale].t('Course Activation Pending'.toUpperCase(), 'Course Activation Pending'),
                            order_status_no: 6,
                            date: moment(codOrderInfo[0].updated_at).format('Do MMMM YYYY'),
                            deeplink: activation_deeplink,
                        });
                    }
                    responseObj.is_cod_order = true;
                    responseObj.show_activation = false;
                    let { etd } = codOrderInfo[0];
                    if (etd == null) {
                        etd = moment(codOrderInfo[0].created_at).add(7, 'd');
                    }
                    etd = moment().diff(etd, 'day') === 0 || ['OUT FOR DELIVERY'].includes(codOrderInfo[0].order_status) ? global.t8[locale].t('aaj'.toUpperCase(), 'aaj') : moment(etd).format('Do MMMM');
                    const orderTrackingInfo = {
                        course_name: courseDetails[0].display_name,
                        order_amount: codOrderInfo[0].amount,
                        etd: ['UNDELIVERED'].includes(codOrderInfo[0].order_status) ? '' : etd,
                        shipment_tracking: trackingArray,
                        // eslint-disable-next-line no-nested-ternary
                        header_text_end: ['UNDELIVERED'].includes(codOrderInfo[0].order_status) ? global.t8[locale].t('deliver nahi ho paya'.toUpperCase(), 'deliver nahi ho paya') : etd == global.t8[locale].t('aaj'.toUpperCase(), 'aaj') ? global.t8[locale].t('deliver hoga!'.toUpperCase(), 'deliver hoga!') : global.t8[locale].t('tak deliver ho jayega!'.toUpperCase(), 'tak deliver ho jayega!'),
                        order_tracking_deeplink: _.isEmpty(shiprocketTrackingResponse.tracking_data) ? '' : `doubtnutapp://action_web_view?url=${shiprocketTrackingResponse.tracking_data.track_url}`,
                    };
                    responseObj.activation_help_deeplink = 'doubtnutapp://video_url?url=https://d10lpgp6xz60nq.cloudfront.net/images/payment/sr_activation_new.mp4';
                    responseObj.order_tracking = orderTrackingInfo;
                }
            } else {
                responseObj.is_cod_order = false;
            }
        } else {
            if (cartDataString && cartDataString.length) {
                cartDetails = JSON.parse(cartDataString);

                const coupon_code = cartDetails.coupon_info.code;
                const cartObj = _.groupBy(cartDetails.cart_info, 'key');
                order_info.wallet_amount = cartObj.wallet_amount[0].value;
                order_info.total_amount = Math.abs(cartObj.amount[0].value);
                order_info.net_amount = cartObj.net_amount[0].value;
                order_info.discount = cartObj.discount[0].value;
                order_info.coupon_amount = cartObj.coupon_code[0].value;
            }
            responseObj.order_info = order_info;

            const studentAddressList = await getAddressObj(student_id);
            if (studentAddressList.length) {
                responseObj.addressList = studentAddressList;
            } else {
                responseObj.addressList = [];
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: responseObj,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getAddressArray(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const studentId = req.user.student_id;
    try {
        const addList = await getAddressObj(studentId);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: addList,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getAddressById(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { id } = req.params;

    const studentId = req.user.student_id;
    try {
        const add = await PayMySQL.getAddressByIdAndStudentId(db.mysql.read, id, studentId);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: add[0],
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function updateAddress(req, res) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const {
            mobile, student_name, pincode, address_line_1, address_line_2, landmark, city, state, address_id,
        } = req.body;
        const { student_id } = req.user;
        const obj = {
            student_id,
            pincode,
            address_line_1,
            student_name,
            student_mobile: mobile,
            address_line_2,
            landmark,
            city,
            state,
            is_active: 1,
            id: address_id,
        };
        const updateData = await PayMySQL.updateAddressEntry(db.mysql.write, obj);
        let responseData;
        if (updateData.affectedRows === 1) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    message: 'Address Updated Successfully',
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    message: 'Error Updating Address',
                },
            };
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function createAddress(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const {
            mobile, student_name, pincode, address_line_1, address_line_2, landmark, city, state, address_id,
        } = req.body;
        const { student_id } = req.user;
        const obj = {
            student_id,
            pincode,
            address_line_1,
            student_name,
            student_mobile: mobile,
            address_line_2,
            landmark,
            city,
            state,
            is_active: 1,
        };
        const updateData = await PayMySQL.createAddressEntry(db.mysql.write, obj);
        let responseData;
        if (updateData.affectedRows === 1) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    mesage: 'Address Added Successfully',
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'FAILED',
                },
                data: {
                    mesage: 'Error adding address',
                },
            };
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getTempRewardWidgetDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { locale, student_id } = req.user;
        const { order_id } = req.query;
        const xAuthToken = req.headers['x-auth-token'];

        // return empty response to shutdown the feature
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { },
        };
        return res.status(responseData.meta.code).json(responseData);

        // un-comment from next-line to get the working code
        // let responseData;
        // const paymentInfo = await PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.read, order_id);
        // console.log(paymentInfo);

        // if (_.isEmpty(paymentInfo) || student_id % 2) {
        //     responseData = {
        //         meta: {
        //             code: 200,
        //             success: true,
        //             message: 'SUCCESS',
        //         },
        //         data: { },
        //     };
        //     return res.status(responseData.meta.code).json(responseData);
        // }

        // if (paymentInfo[0].payment_for == 'course_package') {
        //     const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, paymentInfo[0].variant_id);
        //     const tracebackReward = await PayMySQL.getTracebackRewardEntryByStudentIdAndAssortmentId(db.mysql.read, paymentInfo[0].student_id, course_details[0].assortment_id);

        //     if (course_details[0].assortment_type == 'course' && _.isEmpty(tracebackReward)) {
        //         const newCoupon = `TB_${paymentInfo[0].student_id}_${paymentInfo[0].variant_id}`;
        //         let newCouponTitle;
        //         if (_.isEmpty(paymentInfo[0].coupon_code)) {
        //             newCouponTitle = 'Traceback Reward Coupon';
        //         } else {
        //             newCouponTitle = `Traceback Reward Coupon add-on to ${paymentInfo[0].coupon_code}`;
        //         }
        //         const widgetValidityTime = 60;
        //         const couponValidityTime = 10 + Math.floor(widgetValidityTime / 60);
        //         // const rewardCouponDiscount = 25;
        //         const rewardCouponDiscount = Math.floor(Math.random() * 25 + 1);
        //         const createNewCoupon = {
        //             title: newCouponTitle,
        //             description: '',
        //             type: 'instant',
        //             coupon_code: newCoupon,
        //             start_date: `${moment().format('YYYY-MM-DD HH:mm:ss')}`,
        //             end_date: `${moment().add(couponValidityTime, 'minutes').format('YYYY-MM-DD HH:mm:ss')}`,
        //             value_type: 'percent',
        //             value: rewardCouponDiscount,
        //             is_show: 0,
        //             is_active: 1,
        //             created_by: 'Traceback Reward Window',
        //             min_version_code: 754,
        //             max_version_code: 2000,
        //             limit_per_student: 1,
        //             claim_limit: 1,
        //             max_limit: 1,
        //         };

        //         await db.mongo.write.collection('traceback_reward_coupons').save(createNewCoupon);
        //         // console.log(createNewCoupon);
        //         const additionalDiscount = Math.floor(paymentInfo[0].amount * (rewardCouponDiscount / 100));
        //         const newDiscount = paymentInfo[0].discount + additionalDiscount;
        //         const newAmount = paymentInfo[0].amount - additionalDiscount;
        //         const rewardWidgetShown = 1;

        //         // Create New Rzp Order as the amount has Changed
        //         const rzp = new Razorpay({
        //             key_id: config.RAZORPAY_KEY_ID,
        //             key_secret: config.RAZORPAY_KEY_SECRET,
        //         });
        //         const razorpayResponse = await rzp.orders.create({
        //             amount: newAmount * 100,
        //             currency: 'INR',
        //             receipt: paymentInfo[0].order_id,
        //             payment_capture: true,
        //         });
        //         const newPartnerOrderId = razorpayResponse.id;

        //         const updatePaymentInfoObj = {
        //             order_id: paymentInfo[0].order_id,
        //             partner_order_id: newPartnerOrderId,
        //             amount: newAmount,
        //             coupon_code: newCoupon,
        //             discount: newDiscount,
        //         };

        //         const orderId = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
        //         const newPaymentInfoObj = {
        //             order_id: orderId,
        //             payment_for: paymentInfo[0].payment_for,
        //             amount: newAmount,
        //             student_id: paymentInfo[0].student_id,
        //             status: 'INITIATED',
        //             source: paymentInfo[0].source,
        //             wallet_amount: paymentInfo[0].wallet_amount,
        //             total_amount: paymentInfo[0].total_amount,
        //             discount: newDiscount,
        //             coupon_code: newCoupon,
        //             variant_id: paymentInfo[0].variant_id,
        //             payment_for_id: paymentInfo[0].payment_for_id || null,
        //             partner_order_id: newPartnerOrderId,
        //             created_from: paymentInfo[0].created_from || null,
        //             mode: paymentInfo[0].mode,
        //         };

        //         const tracebackObj = {
        //             student_id: paymentInfo[0].student_id,
        //             assortment_id: course_details[0].assortment_id,
        //             traceback_reward_used: 0,
        //         };
        //         const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, newPaymentInfoObj);
        //         PayMySQL.createTracebackRewardEntry(db.mysql.write, tracebackObj);

        //  
        //         const dataPayload = JSON.parse(JSON.stringify(DataPayment.reward_widget_info(locale)));
        //         }
        //         dataPayload.validityTime = widgetValidityTime;
        //         dataPayload.payment_id = paymentInfoResult.insertId;
        //         dataPayload.discount = rewardCouponDiscount + dataPayload.discount;
        //         dataPayload.order_id = newPartnerOrderId;
        //         dataPayload.newAmount = `₹${newAmount}`;
        //         dataPayload.oldAmount = `₹${paymentInfo[0].amount}`;
        //         responseData = {
        //             meta: {
        //                 code: 200,
        //                 success: true,
        //                 message: 'SUCCESS',
        //             },
        //             data: dataPayload,
        //         };
        //     } else {
        //         responseData = {
        //             meta: {
        //                 code: 200,
        //                 success: true,
        //                 message: 'SUCCESS',
        //             },
        //             data: { },
        //         };
        //     }
        // } else {
        //     responseData = {
        //         meta: {
        //             code: 200,
        //             success: true,
        //             message: 'SUCCESS',
        //         },
        //         data: { },
        //     };
        // }
        // return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function tempRewardsContinuePayment(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { payment_info_id } = req.body;
        console.log(payment_info_id);
        const { student_id } = req.user;
        const paymentInfo = await PayMySQL.getPaymentInfoByIdAndStudentId(db.mysql.read, payment_info_id, student_id);
        console.log(paymentInfo);

        const [student_info, course_details] = await Promise.all([
            // Student.getById(paymentInfo[0].student_id, db.mysql.read),
            StudentContainer.getById(paymentInfo[0].student_id, db),
            CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, paymentInfo[0].variant_id),
        ]);

        const userEmail = (!_.isEmpty(student_info[0].student_email) && /\S+@\S+\.\S+/.test(student_info[0].student_email)) ? student_info[0].student_email.trim() : `payments+${paymentInfo[0].student_id}@doubtnut.com`;
        const userPhone = (!_.isEmpty(student_info[0].mobile)) ? student_info[0].mobile : paymentInfo[0].student_id;

        let assortment_type;
        let assortment_id;
        const is_wallet_payment = false;
        if (course_details.length) {
            assortment_type = course_details[0].assortment_type;
            assortment_id = course_details[0].assortment_id;
        }
        await PayMySQL.updateTracebackRewardEntry(db.mysql.write, paymentInfo[0].student_id, assortment_id);
        const method = 'razorpay_payment';
        const responseInfo = {
            order_id: paymentInfo[0].partner_order_id,
            email: userEmail,
            phone: userPhone,
            amount: paymentInfo[0].amount,
        };
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                [method]: responseInfo, assortment_type, assortment_id, is_wallet_payment, payment_id: payment_info_id,
            },
        };

        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function createMissingPaymentEntries(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            from, to, payment_info_id, payment_info_id_list,
        } = req.query;

        console.log('from', from);
        console.log('to', to);
        console.log('pid', payment_info_id);
        console.log('pid_list', payment_info_id_list);
        let missingPayments = [];
        if (from && to) {
            missingPayments = await PayMySQL.getSuccessfulMissingPaymentsEntryByTime(db.mysql.read, moment(from).format('YYYY-MM-DD HH:mm:ss'), moment(to).format('YYYY-MM-DD HH:mm:ss'));
        } else if (!_.isEmpty(payment_info_id)) {
            missingPayments = await PayMySQL.getPaymentInfoById(db.mysql.read, payment_info_id);
        } else if (!_.isEmpty(payment_info_id_list)) {
            const paymentInfoIdList = JSON.parse(payment_info_id_list);
            for (let i = 0; i < paymentInfoIdList.length; i++) {
                const missingPayment = await PayMySQL.getPaymentInfoById(db.mysql.read, paymentInfoIdList[i]);
                missingPayments.push(missingPayment[0]);
            }
        }

        console.log(missingPayments);
        const promises = [];
        for (let i = 0; i < missingPayments.length; i++) {
            promises.push(db.mongo.read.collection('payment_webhook').findOne({ 'payload.payment.entity.id': missingPayments[i].partner_txn_id }));
        }
        const webhookData = await Promise.all(promises);

        console.log('webhookData', webhookData);
        const successPaymentPromises = [];
        for (let i = 0; i < missingPayments.length; i++) {
            const notes = _.isEmpty(webhookData[i]) ? '' : webhookData[i].payload.payment.entity.notes || '';
            successPaymentPromises.push(PaymentHelper.doSuccessPaymentProcedure(db, config, [missingPayments[i]], notes));
        }
        await Promise.all(successPaymentPromises);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                message: 'All entries Created',
            },
        };

        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function reconcilePaymentByOrderId(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { partner_order_id, source } = req.query;
        console.log('partner_order_id', partner_order_id);
        console.log('source', source);
        if (source.toLowerCase() == 'razorpay') {
            await razorPayPaymentComplete({ razorpay_order_id: partner_order_id }, []);
        } else if (source.toLowerCase() == 'paytm') {
            const webHookData = await db.mongo.read.collection('payment_webhook_paytm').findOne({ ORDERID: partner_order_id });
            console.log('webHookData', webHookData);
            if (!_.isEmpty(webHookData) && webHookData.STATUS == 'TXN_SUCCESS') {
                await paytmPaymentComplete(webHookData);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                message: 'Payment Entry Updated Successfully',
            },
        };

        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function updateSalesAttribution(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            payment_info_id, bda_name, tl_name, sm_name, auto_tele, osp_status, final_status,
        } = req.body;

        const updateObj = {};
        updateObj.payment_info_id = payment_info_id;

        if (bda_name) { updateObj.bda_name = bda_name; }
        if (tl_name) { updateObj.tl_name = tl_name; }
        if (sm_name) { updateObj.sm_name = sm_name; }
        if (auto_tele) { updateObj.auto_tele = auto_tele; }
        if (osp_status) { updateObj.osp_status = osp_status; }
        if (final_status) { updateObj.final_status = final_status; }
        await PayMySQL.updatePaymentSalesAttributionData(db.mysql.write, updateObj);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                message: 'Info Updated',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function createResellerTransaction(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const mobileNumber = req.body.mobile;
        const { amount } = req.body;
        const { pin } = req.body;
        const resellerStudentId = req.user.student_id;
        const isResellerTransfer = parseInt(req.body.is_reseller_transfer);
        const receiverName = req.body.receiver_name;

        const response = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        const dataHerdingKey = `PRE_RESELLER_TRANSACTION_DATA_CACHE_${resellerStudentId}`;

        if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, dataHerdingKey)) {
            response.data.status = 'FAILURE';
            response.data.message = 'Transaction already in progress. Please check ledger';
            return res.status(response.meta.code).json(response);
        }

        await redisUtility.setCacheHerdingKeyNew(db.redis.write, dataHerdingKey);

        if (mobileNumber.length !== 10 || !(new RegExp('^[6-9]\\d{9}$').test(mobileNumber))) {
            response.data.status = 'FAILURE';
            response.data.message = 'Incorrect Mobile Number';
            return res.status(response.meta.code).json(response);
        }
        if (amount.length > 6 || !(new RegExp('^\\d+$').test(amount))) {
            response.data.status = 'FAILURE';
            response.data.message = 'Incorrect Amount';
            return res.status(response.meta.code).json(response);
        }

        const [verifyReseller, studentInfo] = await Promise.all([
            PayMySQL.getResellerInfoByStudentId(db.mysql.read, resellerStudentId),
            Student.getStudentByPhone(mobileNumber, db.mysql.read),
        ]);

        if (verifyReseller[0].pin && verifyReseller[0].pin != pin) {
            response.data.status = 'FAILURE';
            response.data.message = 'Incorrect Pin';
            return res.status(response.meta.code).json(response);
        }

        console.log(verifyReseller, studentInfo, resellerStudentId, checkReseller);

        if (!_.isEmpty(verifyReseller)) {
            let receiverStudentId;
            let walletTransfer;
            if (!_.isEmpty(studentInfo)) {
                receiverStudentId = studentInfo[0].student_id;
            } else {
                const newStudentInfo = await StudentHelper.addByMobileUpdated({
                    phone_number: mobileNumber,
                    language: 'en',
                    is_web: 0,
                    student_username: `Guest_${mobileNumber}`,
                    updated_at: moment().add(5, 'h').add(30, 'minute').toISOString(),
                }, db.mysql.write);
                receiverStudentId = newStudentInfo.insertId;
            }
            if (isResellerTransfer) {
                const checkReseller = await PayMySQL.getResellerInfoByStudentId(db.mysql.read, receiverStudentId);
                if (_.isEmpty(checkReseller)) {
                    await PayMySQL.createResellerInfo(db.mysql.write, {
                        student_id: receiverStudentId,
                        name: receiverName,
                    });
                }
            }
            walletTransfer = await PaymentHelper.makeWalletCashTransfer(resellerStudentId, receiverStudentId, amount, db);

            console.log(walletTransfer);
            if (walletTransfer.status == 'SUCCESS') {
                messages.sendSms({
                    mobile: mobileNumber,
                    msg: `Hello!\n${verifyReseller[0].name} ne aapke Doubtnut wallet me Rs. ${amount} transfer kar diye hai!\nApne mobile no. ${mobileNumber} se Doubtnut app pe login karke aaj hi apna course activate karo \n-Team Doubtnut`,
                    msg_type: 'Unicode_Text',
                });

                response.data.message = 'SUCCESS';
                response.data.status = 'SUCCESS';
                response.data.reason = `Rs. ${amount} has been transfered to the Doubtnut Wallet of ${mobileNumber}`;
            } else {
                response.data.message = walletTransfer.message;
                response.data.status = 'FAILURE';
                response.data.reason = walletTransfer.reason;
            }
        } else {
            response.data.message = 'Something Went Wrong, Contact Tech Team';
            response.data.status = 'FAILURE';
            response.data.reason = 'Reseller Not Verified';
        }
        await redisUtility.removeCacheHerdingKeyNew(db.redis.write, dataHerdingKey);
        res.status(response.meta.code).json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function verifyResellerByPhone(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { mobile } = req.body;

        const response = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        if (mobile.length !== 10 || !(new RegExp('^[6-9]\\d{9}$').test(mobile))) {
            response.data.status = 'FAILURE';
            response.data.message = 'Incorrect Mobile Number';
            return res.status(response.meta.code).json(response);
        }

        const verifyReseller = await PayMySQL.getResellerInfoByMobile(db.mysql.read, mobile);

        if (!_.isEmpty(verifyReseller)) {
            response.data.is_reseller = true;
        } else {
            response.data.is_reseller = false;
        }
        res.status(response.meta.code).json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function resellerTransactionHistory(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const resellerStudentId = req.user.student_id;

        const verifyReseller = await PayMySQL.getResellerInfoByStudentId(db.mysql.read, resellerStudentId);

        const response = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        if (!_.isEmpty(verifyReseller)) {
            const transactionList = await PayMySQL.getWalletTransactionByReasonRefId(db.mysql.read, resellerStudentId);
            const finalData = [];
            console.log(transactionList);
            for (let i = 0; i < transactionList.length; i++) {
                const finalDatum = {
                    date: moment(transactionList[i].created_at).format('h:mm a, DD MMM'),
                    amount: transactionList[i].cash_amount,
                    header: `Paid to ${transactionList[i].mobile}`,
                };
                finalData.push(finalDatum);
            }
            response.data.name = verifyReseller[0].name;
            response.data.status = 'SUCCESS';
            response.data.transactions = finalData;
        } else {
            console.log('else');
            response.data.message = 'Reseller Not Verified';
            response.data.status = 'FAILURE';
        }
        res.status(response.meta.code).json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function grayQuestHook(req, res) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const grayQuestBody = req.body;
        const grayQuestHeaders = req.headers;
        console.log('grayQuestBody', grayQuestBody);
        console.log('grayQuestHeaders', grayQuestHeaders);
        const grayQuestMongoObj = {
            grayQuestBody,
            grayQuestHeaders,
        };
        db.mongo.write.collection('grayquest_webhook').save({ ...grayQuestMongoObj, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        return res.status(responseData.meta.code).json({});

        // Configure webhook secret
        const verifySignRes = await GrayQuestHelper.verifySignature(config.GRAYQUEST.WEBHOOK_SECRET, grayQuestSignature, grayQuestBody);

        if (grayQuestBody && grayQuestBody.student_details && grayQuestBody.student_details.student_id && verifySignRes && verifySignRes.data && verifySignRes.data.verified) {
            const paymentInfo = await PayMySQL.getPaymentInfoByOrderId(db.mysql.read, grayQuestBody.student_details.student_id);
            if (paymentInfo.length) {
                const updateObj = {};
                updateObj.status = 'SUCCESS';
                updateObj.partner_order_id = grayQuestBody.application_id;
                updateObj.partner_txn_id = grayQuestBody.application_id;
                updateObj.mode = 'grayquest';
                updateObj.partner_txn_response = JSON.stringify(grayQuestBody);

                await PayMySQL.updatePaymentByOrderId(db.mysql.write, updateObj);
                await PaymentHelper.doSuccessPaymentProcedure(db, config, paymentInfo, '');
            }
        }
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    startPayment,
    completePayment,
    paytmUpdateNumber,
    getPaytmNumber,
    rzpHook,
    txnHistory,
    payoutDetails,
    paytmDisburse,
    paytmDisburseStatus,
    paytmHook,
    rzpCreateInvoice,
    panelCheckoutDetails,
    txnHistoryByType,
    handlePaytmPayRefund,
    initiateRefund,
    paymentLinkInfo,
    paymentLinkCreate,
    checkoutPage,
    paypalHook,
    qrStatus,
    checkoutPaymentDetails,
    payoutPaytmReferral,
    payoutPaytmReferralSuccess,
    bbpsInfo,
    shiprocketHook,
    checkForPincodeServiceability,
    confirmCODOrder,
    createCODOrder,
    cancelCODOrder,
    codPricingDetails,
    codPage,
    getAddressById,
    getAddressArray,
    updateAddress,
    createAddress,
    getTempRewardWidgetDetails,
    tempRewardsContinuePayment,
    createMissingPaymentEntries,
    reconcilePaymentByOrderId,
    updateSalesAttribution,
    createResellerTransaction,
    verifyResellerByPhone,
    resellerTransactionHistory,
    grayQuestHook,
    razorPayPaymentComplete,
    razorPayPaymentCompleteVPA,
    handleRazorPayRefund,
};
