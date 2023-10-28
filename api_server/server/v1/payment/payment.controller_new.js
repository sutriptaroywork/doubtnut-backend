const _ = require('lodash');
const moment = require('moment');
const queryString = require('query-string');
const request = require('request');
const logger = require('../../../config/winston').winstonLogger;
const Student = require('../../../modules/mysql/student');
const Package = require('../../../modules/mysql/package');
const PayMySQL = require('../../../modules/mysql/payment');
const PaymentRedis = require('../../../modules/redis/payment');
const PaymentHelper = require('../../helpers/payment');
const Data = require('../../../data/data');
const PaymentConstants = require('../../../data/data.payment');
const RzpHelper = require('../../../modules/razorpay/helper');
const ShopseHelper = require('../../../modules/shopse/helper');
const ShopseCrypt = require('../../../modules/shopse/crypt');
const ShopseSignature = require('../../../modules/shopse/signature');
const PayUHelper = require('../../../modules/payu/helper');
const PayUHash = require('../../../modules/payu/hash');
const kafka = require('../../../config/kafka');
const CouponMySQL = require('../../../modules/mysql/coupon');
const StudentContainer = require('../../../modules/containers/student');

let db;
let config;

async function fetchPaymentByType(req, res, next) {
    try {
        const responseData = {};
        let responseInfo = {};
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            type, info,
        } = req.body;
        let rzpHookRes = {};
        let paymentInfo = [];
        let studentId;
        let rmn;
        let amountPaid;
        let packageDuration;
        let title;

        if (type == 'utr') {
            rzpHookRes = await db.mongo.read.collection('payment_webhook').findOne({ event: 'payment.captured', 'payload.payment.entity.acquirer_data.rrn': info });
            if (!_.isEmpty(rzpHookRes)) {
                paymentInfo = await PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.read, rzpHookRes.payload.payment.entity.order_id);
            }
        } else if (type == 'paymentId') {
            let pay_id = info;
            if (!info.includes('pay_')) pay_id = `pay_${info}`;

            rzpHookRes = await db.mongo.read.collection('payment_webhook').findOne({ event: 'payment.captured', 'payload.payment.entity.id': pay_id });
            if (!_.isEmpty(rzpHookRes)) {
                paymentInfo = await PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.read, rzpHookRes.payload.payment.entity.order_id);
            }
        } else if (type == 'bankAccount') {
            rzpHookRes = await db.mongo.read.collection('payment_webhook').findOne({ event: 'virtual_account.credited', 'payload.virtual_account.entity.receivers.account_number': info }, { sort: { _id: -1 } });
            console.log('rzpHookRes', rzpHookRes);
            if (!_.isEmpty(rzpHookRes)) {
                paymentInfo = await PayMySQL.getorderIDByPartnerID(db.mysql.read, rzpHookRes.payload.payment.entity.id);
            }
        }

        if (paymentInfo.length) {
            studentId = paymentInfo[0].student_id;
            // const studentInfo = await Student.getById(studentId, db.mysql.read);
            const studentInfo = await StudentContainer.getById(studentId, db);

            if (paymentInfo[0].variant_id) {
                const packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, paymentInfo[0].variant_id);
                packageDuration = `${parseInt(packageInfo[0].duration_in_days / 30)} Months`;
                title = packageInfo[0].package_name;
            }
            rmn = studentInfo[0].mobile;
            if (type == 'utr' || type == 'paymentId') {
                amountPaid = rzpHookRes.payload.payment.entity.amount / 100;
            } else if (type == 'bankAccount') {
                amountPaid = rzpHookRes.payload.payment.entity.amount / 100;
            }
        }

        if (type == 'plink') {
            let linkResponse;
            [paymentInfo, linkResponse] = await Promise.all([
                PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.read, info),
                RzpHelper.fetchStandardLinkInfo(info),
            ]);
            if (linkResponse.status == 'paid') {
                if (!paymentInfo.length) {
                    paymentInfo = await PayMySQL.getPaymentInfoByPartnerOrderId(db.mysql.read, linkResponse.order_id);
                }
                if (paymentInfo.length) {
                    studentId = paymentInfo[0].student_id;
                    // const studentInfo = await Student.getById(studentId, db.mysql.read);
                    const studentInfo = await StudentContainer.getById(studentId, db);
                    if (paymentInfo[0].variant_id) {
                        const packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, paymentInfo[0].variant_id);
                        packageDuration = `${parseInt(packageInfo[0].duration_in_days / 30)} Months`;
                        title = packageInfo[0].package_name;
                    }
                    rmn = studentInfo[0].mobile;
                    amountPaid = linkResponse.amount_paid / 100;
                }
            }
        }

        responseData.meta = {
            code: 200,
            success: true,
        };
        if (paymentInfo.length) {
            responseInfo = {
                student_id: studentId,
                rmn,
                amount_paid: amountPaid,
                package_duration: packageDuration,
                title,
            };
            responseData.meta.message = 'SUCCESS';
        } else {
            responseData.meta.message = 'FAILURE';
        }
        responseData.data = responseInfo;
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function transferWalletCash(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const senderMobileNumber = req.body.sender_mobile;
        const receiverMobileNumber = req.body.receiver_mobile;
        const expertId = req.body.expert_id;
        const { amount } = req.body;

        const response = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        if (senderMobileNumber.length !== 10 || !(new RegExp('^[6-9]\\d{9}$').test(senderMobileNumber))) {
            response.data.message = 'Incorrect Sender Mobile Number';
            return res.status(response.meta.code).json(response);
        }
        if (receiverMobileNumber.length !== 10 || !(new RegExp('^[6-9]\\d{9}$').test(receiverMobileNumber))) {
            response.data.message = 'Incorrect Receiver Mobile Number';
            return res.status(response.meta.code).json(response);
        }
        if (amount <= 0 || amount.length > 5 || !(new RegExp('^\\d+$').test(amount))) {
            response.data.message = 'Incorrect Amount';
            return res.status(response.meta.code).json(response);
        }
        if (senderMobileNumber == receiverMobileNumber) {
            response.data.message = 'Sender and Receiver mobile cannot be same';
            return res.status(response.meta.code).json(response);
        }

        const [senderInfo, receiverInfo] = await Promise.all([
            Student.getStudentByPhone(senderMobileNumber, db.mysql.read),
            Student.getStudentByPhone(receiverMobileNumber, db.mysql.read),
        ]);

        if (!_.isEmpty(senderInfo) && !_.isEmpty(receiverInfo)) {
            const walletTransfer = await PaymentHelper.makeWalletCashTransfer(senderInfo[0].student_id, receiverInfo[0].student_id, amount, db);

            if (walletTransfer.status == 'SUCCESS') {
                PayMySQL.createExpertLinkMappingEntry(db.mysql.write, {
                    expert_id: expertId, student_id: receiverInfo[0].student_id, package_from: senderInfo[0].student_id, type: 3, sale_type: 'wallet_transfer', wallet_amount: amount,
                });

                response.data.message = 'SUCCESS';
                response.data.status = 'SUCCESS';
                response.data.reason = `Rs. ${amount} has been transfered to the Doubtnut Wallet of ${receiverMobileNumber} from ${senderMobileNumber}`;
            } else {
                response.data.message = walletTransfer.message;
                response.data.status = 'FAILURE';
                response.data.reason = walletTransfer.reason;
            }
        } else {
            response.data.message = 'Something Went Wrong, Contact Tech Team';
            response.data.status = 'FAILURE';
            response.data.reason = 'Receiver or Sender Student ID not found';
        }
        res.status(response.meta.code).json(response);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getShopseOTP(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const {
            amount, mobile, email, consumerName,
        } = req.body;
        const variantId = req.body.products[0].productId;
        const courseName = req.body.products[0].name;
        const { studentId } = req.body.customParams;

        const shopseResponse = await ShopseHelper.getOTP({
            studentId, amount, mobile, email, courseName, variantId, consumerName,
        });

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: shopseResponse,
        };

        if (_.isEmpty(shopseResponse) || shopseResponse.code != 0) {
            responseData.meta.success = false;
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function verifyShopseOTP(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const { otp, shopSeRefNo } = req.body;

        const shopseResponse = await ShopseHelper.verifyOTP({ otp, shopSeRefNo });

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: shopseResponse,
        };

        if (_.isEmpty(shopseResponse) || shopseResponse.code != 0) {
            responseData.meta.success = false;
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function createShopseTransaction(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            mobile, email, consumerName,
        } = req.body;
        const variantId = req.body.products[0].productId;
        const courseName = req.body.products[0].name;
        const { studentId } = req.body.customParams;
        const orderId = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
        let walletAmount = 0;
        let discount = 0;
        let couponCode = null;
        const packageInfo = await Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variantId);
        let totalAmount = packageInfo[0].final_amount;
        let amount = packageInfo[0].final_amount;

        try {
            const cartDetails = JSON.parse(await PaymentRedis.getPaymentCartOption(db.redis.read, studentId));
            const cartObj = _.groupBy(cartDetails.cart_info, 'key');
            amount = cartObj.net_amount[0].value;
            const couponAmount = Math.abs(cartObj.coupon_code[0].value);
            if (couponAmount) {
                discount = couponAmount;
                couponCode = cartDetails.coupon_info.code;
            }
            walletAmount = Math.abs(cartObj.wallet_amount[0].value);
            totalAmount = Math.abs(cartObj.amount[0].value) - Math.abs(cartObj.discount[0].value);
        } catch (e) {
            logger.error(`Payment Redis Parsing Error for studentId: ${studentId}`, e);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        const shopseResponse = await ShopseHelper.createTransaction({
            studentId, amount, mobile, orderId, email, courseName, variantId, consumerName,
        });

        if (!_.isEmpty(shopseResponse) && shopseResponse.shopSeTxnId) {
            const insertObj = {};
            insertObj.order_id = orderId;
            insertObj.payment_for = 'course_package';
            insertObj.amount = amount;
            insertObj.student_id = studentId;
            insertObj.status = 'INITIATED';
            insertObj.source = 'SHOPSE';
            insertObj.wallet_amount = walletAmount;
            insertObj.total_amount = totalAmount;
            insertObj.discount = discount;

            if (discount) insertObj.coupon_code = couponCode;

            insertObj.variant_id = variantId;
            insertObj.mode = 'shopse';
            insertObj.partner_order_id = shopseResponse.shopSeTxnId;

            const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, insertObj);
            responseData.data = shopseResponse;
            responseData.data.paymentInfoId = paymentInfoResult.insertId;
        } else {
            responseData.meta.success = false;
        }
        responseData.data = shopseResponse;
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function shopsePaymentComplete(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { encryptedResponse } = req.body;

        const modifiedResponse = encryptedResponse.replace(/ /g, '+');
        const decryptedQuery = ShopseCrypt.decrypt(modifiedResponse).replace(/"/g, '');
        const parsedQuery = queryString.parse(decryptedQuery);
        const signatureRes = ShopseSignature.generateSignature(decryptedQuery);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        // statusCode is 0 in case of successful payments
        if (parsedQuery.statusCode != 0) {
            responseData.data = {
                currentTime: parsedQuery.currentTime,
                orderId: parsedQuery.orderId,
                shopSeTxnId: parsedQuery.shopSeTxnId,
                status: parsedQuery.status,
                statusCode: parsedQuery.statusCode,
                statusMessage: parsedQuery.statusMessage,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (!signatureRes) {
            responseData.meta.success = false;
            responseData.data.statusMessage = 'ShopSe Signature could not be verified';
            return res.status(responseData.meta.code).json(responseData);
        }
        if (parsedQuery.statusCode == 0) {
            await PaymentHelper.doShopseSuccess(db, config, parsedQuery, responseData);
            console.log(responseData);
            return res.status(responseData.meta.code).json(responseData);
        }
        res.status(500).json({});
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function checkShopseEligibility(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            amount, mobile, email, consumerName,
        } = req.body;
        const variantId = req.body.products[0].productId;
        const courseName = req.body.products[0].name;
        const { studentId, expertId } = req.body.customParams;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        if (amount < PaymentConstants.shopse_emi_min_limit) {
            responseData.data.eligibility = false;
            return res.status(responseData.meta.code).json(responseData);
        }

        const shopseResponse = await ShopseHelper.checkEligibility({
            studentId, amount, mobile, email, courseName, variantId, consumerName, expertId,
        });

        if (!_.isEmpty(shopseResponse)) {
            if (shopseResponse.instantEmiEligibility == 'Y' && shopseResponse.ccEmiAvailability == 'Y') {
                responseData.data = shopseResponse;
                responseData.data.eligibility = true;
                responseData.data.message = 'Eligible for Debit and Credit card EMI';
            } else if (shopseResponse.ccEmiAvailability == 'Y') {
                responseData.data = shopseResponse;
                responseData.data.eligibility = true;
                responseData.data.message = 'Eligible for only Credit card EMI';
            } else {
                responseData.data = shopseResponse;
                responseData.data.eligibility = false;
                responseData.data.message = 'Not Eligible for EMI';
            }
        } else {
            responseData.meta.success = false;
            responseData.data.eligibility = false;
            responseData.data.message = 'Something went wrong | Not Eligible for EMI';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function shopseWebhook(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { encryptedResponse } = req.body;
        const decryptedResponse = ShopseCrypt.decrypt(encryptedResponse);
        const shopseRes = JSON.parse(decryptedResponse);
        const signatureRes = ShopseSignature.generateWebhookSignature(shopseRes);
        shopseRes.source = 'SHOPSE';
        console.log('shopseRes', shopseRes);
        db.mongo.write.collection('shopse_webhook').save({ ...shopseRes, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        if (shopseRes.statusCode != 0) {
            responseData.data = {
                currentTime: shopseRes.currentTime,
                orderId: shopseRes.orderId,
                shopSeTxnId: shopseRes.shopSeTxnId,
                status: shopseRes.status,
                statusCode: shopseRes.statusCode,
                statusMessage: shopseRes.statusMessage,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (!signatureRes) {
            responseData.meta.success = false;
            responseData.data.statusMessage = 'ShopSe Signature could not be verified';
            return res.status(responseData.meta.code).json(responseData);
        }
        if (shopseRes.statusCode == 0) {
            await PaymentHelper.doShopseSuccess(db, config, shopseRes, responseData);
            return res.status(responseData.meta.code).json(responseData);
        }
        res.status(500).json({});
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function checkPayUEligibility(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const {
            amount, cardBin,
        } = req.body;
        const studentId = req.user.student_id;

        const responseData = JSON.parse(JSON.stringify(Data.responseTemplate));

        if (cardBin.length != 6) {
            responseData.meta.success = false;
            responseData.meta.message = 'FAILURE';
            return res.status(responseData.meta.code).json(responseData);
        }

        const payUResponse = await PayUHelper.checkEligibility(cardBin);
        responseData.data = payUResponse;

        if (_.isEmpty(payUResponse) || payUResponse.status == 0) {
            responseData.meta.success = false;
            responseData.meta.message = 'FAILURE';
        } else if (payUResponse.details.isEligible && payUResponse.details.isEligible == 1 && payUResponse.details.minAmount && payUResponse.details.minAmount >= amount) {
            responseData.data.details.isEligible = 0;
        }
        const payuMongoObj = {
            student_id: studentId,
            card_bin: cardBin,
            payu_response: payUResponse,
        };
        db.mongo.write.collection('payu_emi_eligibility').save({ ...payuMongoObj, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function computePayUEmiInterest(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const { amount } = req.body;

        const responseData = JSON.parse(JSON.stringify(Data.responseTemplate));

        const payUResponse = await PayUHelper.computeEmiInterest(amount);
        responseData.data = payUResponse;

        if (_.isEmpty(payUResponse) || payUResponse.status == 0) {
            responseData.meta.success = false;
            responseData.meta.message = 'FAILURE';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function createPayUTransaction(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            email, courseName, consumerName, studentId, variantId,
        } = req.body;
        const orderId = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
        const key = config.PAYU.KEY;
        const salt = config.PAYU.SALT;
        const baseUrl = config.PAYU.BASE_URL;
        const furl = `https://${req.headers.host}/v1/payment/payu/payment-complete`;
        const surl = `https://${req.headers.host}/v1/payment/payu/payment-complete`;

        let walletAmount = 0;
        let discount = 0;
        let couponCode = null;
        const packageInfo = await Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variantId);
        let totalAmount = packageInfo[0].final_amount;
        let amount = packageInfo[0].final_amount;

        try {
            const cartDetails = JSON.parse(await PaymentRedis.getPaymentCartOption(db.redis.read, studentId));
            const cartObj = _.groupBy(cartDetails.cart_info, 'key');
            amount = cartObj.net_amount[0].value;
            const couponAmount = Math.abs(cartObj.coupon_code[0].value);
            if (couponAmount) {
                discount = couponAmount;
                couponCode = cartDetails.coupon_info.code;
            }
            walletAmount = Math.abs(cartObj.wallet_amount[0].value);
            totalAmount = Math.abs(cartObj.amount[0].value) - Math.abs(cartObj.discount[0].value);
        } catch (e) {
            logger.error(`Payment Redis Parsing Error for studentId: ${studentId}`, e);
        }

        const responseData = JSON.parse(JSON.stringify(Data.responseTemplate));

        const insertObj = {};
        insertObj.order_id = orderId;
        insertObj.payment_for = 'course_package';
        insertObj.amount = amount;
        insertObj.student_id = studentId;
        insertObj.status = 'INITIATED';
        insertObj.source = 'PAYU';
        insertObj.wallet_amount = walletAmount;
        insertObj.total_amount = totalAmount;
        insertObj.discount = discount;

        if (discount) insertObj.coupon_code = couponCode;

        insertObj.variant_id = variantId;
        insertObj.mode = 'emi';

        const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, insertObj);
        if (paymentInfoResult.insertId) {
            const text = `${key}|${orderId}|${insertObj.amount}|${courseName}|${consumerName}|${email}|||||||||||${salt}`;
            const hash = PayUHash.generateHash(text);

            responseData.data = {
                base_url: baseUrl,
                key,
                txnid: orderId,
                hash,
                furl,
                surl,
                amount: insertObj.amount,
            };
        } else {
            responseData.meta.success = false;
            responseData.meta.message = 'FAILURE';
        }

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function payUPaymentComplete(req, res, next) {
    // Redirection is required in this API since PayU was sending POST request on their return URL and we have to show Post Purchase based on that response.
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const payuResponse = req.body;

        const url = await PaymentHelper.doPayUComplete(db, config, payuResponse, req.headers.host, 0);
        res.redirect(url);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function payUWebhook(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const payuResponse = req.body;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        db.mongo.write.collection('payu_webhook').save({ ...payuResponse, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });

        responseData.data = await PaymentHelper.doPayUComplete(db, config, payuResponse, req.headers.host, 1);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function referralKafkaManualEntries(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const { payment_info_id: paymnentInfoID, created_at: createdAt } = req.query;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        console.log(studentId);
        if (!_.includes([73615406, 3215112], studentId)) {
            responseData.meta = {
                code: 401,
                success: false,
                message: 'Unauthorized',
            };
            responseData.data = 'Unauthorized';
            return res.status(responseData.meta.code).json(responseData);
        }

        const paymentEntry = await PayMySQL.getPaymentByPaymentInfoIdAndCreatedAt(db.mysql.read, paymnentInfoID, createdAt);
        if (paymentEntry.length) {
            const referralCoupon = await CouponMySQL.getStudentDetailsByStudentReferralCoupons(db.mysql.read, paymentEntry[0].coupon_code);
            if (referralCoupon.length) {
                await PayMySQL.createPaymentReferralEntry(db.mysql.write, {
                    payment_info_id: paymentEntry[0].id,
                    coupon_code: paymentEntry[0].coupon_code,
                });
                const mlmReferralKafkaData = {
                    payment_info_id: paymentEntry[0].id,
                };
                await kafka.publish(kafka.topics.mlmReferral, 1, mlmReferralKafkaData);
                responseData.data = 'Successfully Published';
            } else {
                responseData.data = 'Not a referral coupon purchase';
            }
        } else {
            responseData.data = 'No Payment Info Entry found';
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        next(e);
    }
}

async function switchCourse(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const oldPaymentSummaryId = req.body.payment_summary_id;
        const newCourseVariantId = req.body.new_package_variant_id;
        const expertId = req.body.expert_id;
        const studentId = req.body.student_id;
        const changeCourseEndDate = JSON.parse(req.body.recompute_course_end_date) || false;
        const switchCompleteBundle = JSON.parse(req.body.switch_complete_bundle) || false;
        const response = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        if (!(_.includes([10004, 20260, 20261], expertId) || _.includes(['10004', '20260', '20261'], expertId))) {
            response.data.message = 'You don\'t have this access. Please connect with tech team';
            return res.status(response.meta.code).json(response);
        }
        const [variantDetails, activeSubscriptionDetails] = await Promise.all([
            Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, newCourseVariantId),
            Package.getActiveSubscriptionPaymentSummaryFromId(db.mysql.read, oldPaymentSummaryId),
        ]);
        if (_.isEmpty(activeSubscriptionDetails)) {
            response.data.message = 'No active packages on this Payment Summary Id. Please check again';
            return res.status(response.meta.code).json(response);
        }
        console.log(activeSubscriptionDetails);
        if (activeSubscriptionDetails[0].student_id != studentId) {
            response.data.message = 'Wrong Payment Summary Id, Please check again';
            return res.status(response.meta.code).json(response);
        }
        const insertObj = {};
        insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 1000);
        insertObj.payment_for = 'course_package';
        insertObj.payment_for_id = variantDetails[0].package_id;
        insertObj.partner_txn_id = insertObj.order_id;
        insertObj.total_amount = 0;
        insertObj.amount = 0;
        insertObj.student_id = studentId;
        insertObj.status = 'INITIATED';
        insertObj.source = 'razorpay';
        insertObj.discount = 0;
        insertObj.variant_id = variantDetails[0].id;
        insertObj.discount = 0;
        insertObj.amount = 0;
        insertObj.updated_by = `expert_id:${expertId}`;
        await PaymentHelper.doSuccessPaymentProcedure(db, config, [insertObj], {
            packageFrom: activeSubscriptionDetails[0].new_package_id, type: 'switch', subscriptionId: activeSubscriptionDetails[0].subscription_id, changeEndDate: !changeCourseEndDate, // ! of changeCourseEndDate as in later stages it is handled in reverse manner.
        });

        if (switchCompleteBundle == true && activeSubscriptionDetails[0].meta_info) {
            const [getAllBundleSpsEntries, oldSubscription] = await Promise.all([
                Package.getPaymentSummaryWithTxnId(db.mysql.read, activeSubscriptionDetails[0].txn_id),
                Package.getPaymentSummaryFromId(db.mysql.read, oldPaymentSummaryId),
            ]);
            // const subscriptionIds = [];
            for (let i = 0; i < getAllBundleSpsEntries.length; i++) {
                Package.markSubscriptionInactive(db.mysql.write, getAllBundleSpsEntries[i].subscription_id);
                Package.updateNextPackageInPaymentSummaryUsingSubscriptionId(db.mysql.write, { subscriptionId: getAllBundleSpsEntries[i].subscription_id, next_package_id: oldSubscription[0].next_package_id, next_ps_id: oldSubscription[0].next_ps_id });
            }
        }
        response.data.message = 'Course switched succesfully';
        res.status(response.meta.code).json(response);
    } catch (e) {
        console.error(e);
        next(e);
    }
}

async function activateFintechEmi(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { source } = req.body;
        const studentId = req.body.student_id;
        const expertId = req.body.expert_id;
        const orderIdList = req.body.order_id_list;
        const partnerOrderId = req.body.partner_order_id;
        const downPayment = req.body.down_payment;

        const response = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        if (!(_.includes(PaymentConstants.fintech_activation_expert_ids, expertId))) {
            response.meta.success = false;
            response.meta.message = 'FAILURE';
            response.data.message = 'You don\'t have this access. Please connect with tech team';
            return res.status(response.meta.code).json(response);
        }

        const paymentInfoIdList = [];
        let updateFlag = 1;
        const updatePromises = [];

        for (let i = 0; i < orderIdList.length; i++) {
            const paymentInfo = await PayMySQL.getPaymentInfoByOrderId(db.mysql.read, orderIdList[i]);
            if (!_.isEmpty(paymentInfo) && paymentInfo[0].status != 'SUCCESS') {
                const updateObj = {
                    status: 'SUCCESS',
                    partner_order_id: partnerOrderId,
                    partner_txn_id: partnerOrderId,
                    source,
                    mode: 'emi',
                    updated_by: expertId,
                };
                paymentInfoIdList.push(paymentInfo[0].id);
                if (i == 0 && source == 'bajaj') {
                    const walletSummary = await PayMySQL.getWalletBalance(db.mysql.read, studentId);
                    if (walletSummary[0].cash_amount < downPayment) {
                        response.meta.success = false;
                        response.meta.message = 'FAILURE';
                        response.data.message = 'Insufficient Wallet Balance';
                        return res.status(response.meta.code).json(response);
                    }
                    if (paymentInfo[0].amount < downPayment) {
                        response.meta.success = false;
                        response.meta.message = 'FAILURE';
                        response.data.message = 'Request Amount for Course 1 cannot be less than DP';
                        return res.status(response.meta.code).json(response);
                    }
                    updateObj.wallet_amount = downPayment;
                    updateObj.amount = paymentInfo[0].amount - downPayment;
                }
                if (orderIdList.length > 1) {
                    updateObj.partner_order_id = `${partnerOrderId}-${i + 1}`;
                    updateObj.partner_txn_id = `${partnerOrderId}-${i + 1}`;
                }
                updateObj.order_id = orderIdList[i];
                updatePromises.push(PayMySQL.updatePaymentByOrderId(db.mysql.write, updateObj));
            } else if (!_.isEmpty(paymentInfo) && paymentInfo[0].status == 'SUCCESS') {
                paymentInfoIdList.push(paymentInfo[0].id);
            } else {
                updateFlag = 0;
            }
        }

        // Update call only if correct Order ID is found in DB
        if (updateFlag) {
            response.data.payment_info_id_list = paymentInfoIdList;
            await Promise.all(updatePromises);
        } else {
            response.meta.success = false;
            response.meta.message = 'FAILURE';
            response.data.message = 'Incorrect Order ID';
            return res.status(response.meta.code).json(response);
        }

        res.status(response.meta.code).json(response);
    } catch (e) {
        console.error(e);
        next(e);
    }
}

async function getQrByPaymentInfo(req, res, next) {
    try {
        config = req.app.get('config');
        request({
            url: `${config.staticCDN}images/payment/qr/${req.query.paymentInfoId}.png`,
            encoding: null,
        },
        (err, response, buffer) => {
            if (!err && response.statusCode === 200) {
                res.set('Content-Type', 'image/png');
                res.send(response.body);
            }
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    fetchPaymentByType,
    transferWalletCash,
    getShopseOTP,
    verifyShopseOTP,
    createShopseTransaction,
    shopsePaymentComplete,
    checkShopseEligibility,
    shopseWebhook,
    checkPayUEligibility,
    computePayUEmiInterest,
    createPayUTransaction,
    payUPaymentComplete,
    payUWebhook,
    referralKafkaManualEntries,
    switchCourse,
    activateFintechEmi,
    getQrByPaymentInfo,
};
