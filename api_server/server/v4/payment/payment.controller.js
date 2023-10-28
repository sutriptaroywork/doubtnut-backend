const _ = require('lodash');
const moment = require('moment');
const Razorpay = require('razorpay');
const PayMySQL = require('../../../modules/mysql/payment');
const PackageRedis = require('../../../modules/redis/package');
const PaymentHelper = require('../../helpers/payment');
// const PaytmHelper = require('../../../modules/paytm/helper.js');
// const PayPalHelper = require('../../../modules/paypal/helper.js');
const RazorpayHelper = require('../../../modules/razorpay/helper');
const StudentContainer = require('../../../modules/containers/student');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const Data = require('../../../data/data');
const StudentHelper = require('../../helpers/student.helper');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CouponContainer = require('../../../modules/containers/coupon');
const UtilityTranslate = require('../../../modules/utility.translation');
const DataPayment = require('../../../data/data.payment');
const CourseHelper = require('../../helpers/course');
// const PaymentRedis = require('../../../modules/redis/payment');
const EventsModule = require('../../../modules/events/events');
const DNProperty = require('../../../modules/mysql/property');
const redisAnswer = require('../../../modules/redis/answer');

let db;
let config;

async function startPayment(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const logsObj = req.body;
        logsObj.student_id = req.user.student_id.toString();
        db.mongo.write.collection('payment_log').save({ ...logsObj, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });

        let { country } = req.headers;
        const { version_code, 'x-auth-token': xAuthToken } = req.headers;

        const { payment_info } = req.body;
        const { payment_for } = req.body;
        let source = req.body.source || 'RAZORPAY';
        const { locale } = req.user;
        const {
            variant_id, switch_assortment,
        } = payment_info;

        let { coupon_code, use_wallet_cash, use_wallet_reward } = payment_info;

        // for version code >= 960 selected wallets array is passed instead of use_wallet_cash and use_wallet_reward
        // DN Reward: key -> 1
        // DN Cash: key -> 2
        // If selected_wallet is empty by deafult all wallets are selected
        if (version_code >= 960) {
            const { selected_wallet = null } = payment_info;
            if (!_.isEmpty(selected_wallet)) {
                for (let i = 0; i < selected_wallet.length; i++) {
                    if (selected_wallet[i] == 1) {
                        use_wallet_reward = true;
                    } else if (selected_wallet[i] == 2) {
                        use_wallet_cash = true;
                    }
                }
            } else if (selected_wallet === null || selected_wallet === 'null') {
                use_wallet_reward = true;
                use_wallet_cash = true;
            } else {
                use_wallet_reward = false;
                use_wallet_cash = false;
            }
        }
        let { method } = req.body;

        if (coupon_code == 'null') {
            coupon_code = '';
        }
        if (!country) {
            country = 'IN';
        }
        // discount is the coupon amount used for payment
        let total_amount; let package_min_limit = 0; let wallet_reward_amount_usable = 0; let assortment_type; let assortment_id; let wallet_amount = 0; let wallet_cash_amount = 0; let wallet_reward_amount = 0; let discount = 0; let packageInfo; let insert_coupon_flag = 0; let partner_order_id; let is_wallet_payment = false; let upgradeCheck = {}; let batchId;
        let razorpayResponse;
        let packageName;
        let is_upgraded = false;

        const studentId = req.user.student_id;
        const [student_info, currencyAndCountryObj] = await Promise.all([
            // Student.getById(studentId, db.mysql.read),
            StudentContainer.getById(studentId, db),
            StudentHelper.getUserCountryAndCurrency(db, studentId),
        ]);
        // const userEmail = (!_.isEmpty(student_info[0].student_email) && /\S+@\S+\.\S+/.test(student_info[0].student_email)) ? student_info[0].student_email.trim() : `payments+${studentId}@doubtnut.com`;
        const userEmail = `payments+${studentId}@doubtnut.com`;
        const userPhone = (!_.isEmpty(student_info[0].mobile)) ? student_info[0].mobile : studentId;

        let responseInfo = {};
        country = currencyAndCountryObj.country;
        const { currency_symbol: currencySymbol, currency } = currencyAndCountryObj;

        if (country != 'IN') {
            use_wallet_reward = false;
            use_wallet_cash = false;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        const order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);

        if (payment_for == 'course_package' || payment_for == 'doubt') {
            packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);
            if ((packageInfo.length && (!packageInfo[0].active_variant || !packageInfo[0].active_package)) || (country != 'IN' && packageInfo[0].reference_type != 'doubt')) {
                responseData.meta = {
                    code: 204,
                    success: true,
                    message: 'Inactive course',
                };
                responseData.data.message = 'Inactive course';
                return res.status(responseData.meta.code).json(responseData);
            }
            if (switch_assortment) {
                upgradeCheck = await CourseHelper.getDifferenceAmountForSwitchSubscription({
                    db, studentID: studentId, activeAssortmentID: switch_assortment, packageInfo,
                });
            } else {
                upgradeCheck = await CourseHelper.getDifferenceAmountForUpgradeSubscription({
                    db, studentID: studentId, assortmentID: packageInfo[0].assortment_id,
                });
            }
            if ((!_.isEmpty(upgradeCheck) && upgradeCheck.amount < packageInfo[0].final_amount && upgradeCheck.duration < packageInfo[0].duration_in_days) || (!_.isEmpty(upgradeCheck) && switch_assortment && upgradeCheck.amount <= packageInfo[0].total_amount)) {
                packageInfo[0].final_amount -= upgradeCheck.amount;
                is_upgraded = true;
            }
            total_amount = packageInfo[0].final_amount;
            if (is_upgraded && switch_assortment) {
                package_min_limit = Math.ceil(total_amount * (DataPayment.min_limit_percentage_switch_case / 100));
            } else {
                package_min_limit = Math.ceil(total_amount * (packageInfo[0].min_limit_percentage / 100));
            }
            packageInfo[0].min_limit = package_min_limit;
            const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, variant_id);
            if (course_details.length) {
                assortment_type = course_details[0].assortment_type;
                assortment_id = course_details[0].assortment_id;
                batchId = course_details[0].batch_id;
            }
        } else if (payment_for == 'wallet') {
            total_amount = payment_info.amount;
            use_wallet_reward = false;
            use_wallet_cash = false;
        } else if (payment_for == 'bounty') {
            total_amount = payment_info.amount;
            use_wallet_reward = false;
            use_wallet_cash = false;
        }

        // if wallet amount is being used
        if (use_wallet_reward || use_wallet_cash) {
            try {
                const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken: req.headers['x-auth-token'] });
                console.log(walletInfo);
                if (walletInfo.meta.success) {
                    wallet_cash_amount = +walletInfo.data.cash_amount;
                    wallet_reward_amount = +walletInfo.data.reward_amount;
                }
            } catch (e) {
                console.log(e);
            }
        }

        // 1. Coupon
        // Check if coupon used and is legit coupon. Min Limit check is being done in fetchCouponApplyData, so no need again
        let coupon_data;
        if (coupon_code && packageInfo.length) {
            coupon_data = await CouponContainer.fetchCouponApplyData(db, req.user, coupon_code, packageInfo, version_code, xAuthToken, switch_assortment);
            if (coupon_data.status == 'SUCCESS') {
                discount = coupon_data.amount;
                insert_coupon_flag = 1;
            }
        }
        let package_final_amount_after_coupon_discount = total_amount;
        if (discount > 0) {
            discount = Math.min(discount, total_amount);
            package_final_amount_after_coupon_discount -= discount;
        }
        // 1 end

        // 2. Wallet Cash
        if (!use_wallet_cash) wallet_cash_amount = 0;
        wallet_cash_amount = Math.min(wallet_cash_amount, package_final_amount_after_coupon_discount);
        // 2 end

        // 3. Wallet Reward
        if (payment_for == 'course_package' || payment_for == 'doubt') {
            // check how much wallet reward can be used
            wallet_reward_amount_usable = Math.min(
                DataPayment.wallet_reward_options.max_amount,
                package_final_amount_after_coupon_discount * DataPayment.wallet_reward_options.factor,
                wallet_reward_amount,
                package_final_amount_after_coupon_discount - package_min_limit,
                package_final_amount_after_coupon_discount - wallet_cash_amount,
            );

            // In case of upgrades when total_amount < min_limit, wallet_reward_amount will be 0 otherwise complete upgrade can be done using wallet.
            if (package_final_amount_after_coupon_discount < package_min_limit) {
                wallet_reward_amount_usable = 0;
            }
        }
        if (!use_wallet_reward) wallet_reward_amount_usable = 0;
        // 3 end

        wallet_amount = wallet_cash_amount + wallet_reward_amount_usable;
        let amount = Math.max(total_amount - discount - wallet_amount, 0);

        console.log('total_amount, discount, wallet_cash_amount, wallet_reward_amount', total_amount, discount, wallet_cash_amount, wallet_reward_amount_usable);

        if (amount <= 0 && (method != 'upi_intent' && method != 'payment_link')) {
            source = 'WALLET';
            amount = 0;
            wallet_amount = total_amount - discount;
            if (is_upgraded) {
                // eslint-disable-next-line operator-assignment
                if (wallet_amount < 0) {
                    wallet_amount = 0;
                }
            }
            partner_order_id = order_id;
            method = 'DN';
        } else if (source == 'RAZORPAY') {
            const rzp = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET,
            });

            if (method != 'payment_link' && method != 'upi_intent') {
                razorpayResponse = await rzp.orders.create({
                    amount: amount * 100,
                    currency,
                    receipt: order_id,
                    payment_capture: true,
                });
                partner_order_id = razorpayResponse.id;
            } else if (method == 'upi_intent') {
                partner_order_id = order_id;
            } else {
                const date = new Date();
                date.setDate(date.getDate() + 2);
                packageName = 'Doubtnut';
                let duration = '';
                if ((payment_for == 'course_package' || payment_for == 'doubt') && payment_info.variant_id) {
                    packageName = `${packageInfo[0].package_name} package`;
                    if (packageInfo[0].duration_in_days) {
                        duration = `${packageInfo[0].duration_in_days} days`;
                    }
                }

                const description = `${userPhone} | ${packageName} - ${duration}`;

                const obj = {
                    type: 'link',
                    description,
                    amount: parseFloat(amount) * 100,
                    currency,
                    expire_by: Math.floor(date / 1000),
                    customer: {
                        contact: userPhone,
                        email: userEmail,
                    },
                };
                if (is_upgraded) {
                    obj.notes = {
                        type: 'upgrade',
                        subscriptionId: upgradeCheck.subscription_id,
                    };
                }
                console.log(obj);
                razorpayResponse = await RazorpayHelper.createStandardLink(obj);
                partner_order_id = razorpayResponse.id;
            }
        }

        const insertObj = {};
        insertObj.order_id = order_id;
        insertObj.payment_for = req.body.payment_for;
        insertObj.amount = amount;
        insertObj.student_id = studentId;
        insertObj.status = 'INITIATED';
        insertObj.source = source;
        insertObj.wallet_amount = wallet_amount;
        insertObj.total_amount = total_amount;
        insertObj.discount = discount;
        insertObj.currency = currency;
        if (insert_coupon_flag) {
            insertObj.coupon_code = coupon_data.code;
        }
        if (payment_info.variant_id && payment_for != 'bounty') insertObj.variant_id = payment_info.variant_id;
        if (payment_info.payment_for_id) insertObj.payment_for_id = payment_info.payment_for_id;
        insertObj.partner_order_id = partner_order_id;
        if (method == 'payment_link') insertObj.created_from = 'app-payment-link';
        if (payment_info.created_from) insertObj.created_from = payment_info.created_from;
        insertObj.mode = method;

        const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, insertObj);

        if (is_upgraded && !_.isEmpty(upgradeCheck) && switch_assortment) {
            PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                payment_info_id: paymentInfoResult.insertId, is_web: 0, wallet_cash_amount, wallet_reward_amount: wallet_reward_amount_usable, notes: JSON.stringify({ packageFrom: upgradeCheck.package_id, type: 'switch', subscriptionId: upgradeCheck.subscription_id }),
            });
        } else if (wallet_amount > 0 || payment_info.is_web) {
            PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                payment_info_id: paymentInfoResult.insertId, is_web: payment_info.is_web ? 1 : 0, wallet_cash_amount, wallet_reward_amount: wallet_reward_amount_usable,
            });
        }

        if (method == 'payment_link') {
            PayMySQL.setRzpPaymentLink(db.mysql.write, {
                payment_info_id: paymentInfoResult.insertId, student_id: studentId, link_id: partner_order_id, status: 'INITIATED',
            });
        }

        /*
        if (total_amount - discount - wallet_amount - amount !== 0) {
            throw new Error('something went wrong');
        }
        */

        if (method == 'netbanking' || method == 'card' || method == 'upi' || method == 'paytm' || method == 'wallet' || method == 'upi_collect' || method == 'upi_select') {
            responseInfo.order_id = partner_order_id;
            responseInfo.email = userEmail;
            responseInfo.phone = userPhone;
            responseInfo.amount = amount;
            responseInfo.currency = currency;
            method = 'razorpay_payment';
        } else if (method == 'upi_intent') {
            responseInfo = JSON.parse(JSON.stringify(Data.upiCheckout(locale)));
            if (payment_for == 'course_package' || payment_for == 'doubt') {
                packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);
                responseInfo.header = `${packageInfo[0].package_name}`;
                responseInfo.title = `${responseInfo.title}\n${responseInfo.payment_count_text}`;
                responseInfo.share_message = `Doubtnut par ₹${amount} ka ${packageInfo[0].package_name.trim()} package mere liye buy karne ke liye iss QR code par payment kariye`;
            } else if (payment_for == 'bounty') {
                responseInfo.header = global.t8[locale].t('Padhao Aur Kamao'.toUpperCase(), 'Padhao Aur Kamao');
                responseInfo.title = `${responseInfo.title}\n${responseInfo.payment_count_text}`;
                responseInfo.share_message = `Doubtnut par ₹${amount} ke Padhao or Kamao ke liye iss QR code par payment kariye`;
            } else if (payment_for == 'wallet') {
                responseInfo.header = global.t8[locale].t('DN Wallet'.toUpperCase(), 'DN Wallet');
                responseInfo.share_message = `Mere Doubtnut wallet me ₹${amount} add karne ke liye iss QR code par payment kariye`;
            }
            responseInfo.header += ` : ₹${amount}`;
            responseInfo.footer_image_url = `${Data.cdnUrl}/images/upi_logo_collection.webp`;
            responseInfo.order_id = order_id;
            const activeShareableQR = await DNProperty.getValueByBucketAndName(db.mysql.read, 'payment', 'shareable_qr');
            if (activeShareableQR.length && activeShareableQR[0].value) {
                let upiId = '';
                if (payment_for == 'wallet') {
                    const vpaDetails = await PaymentHelper.getVpaDetails({
                        db, student_id: studentId, locale, source: 'qr',
                    });
                    upiId = vpaDetails.upi_id;
                } else {
                    const date = new Date();
                    date.setDate(date.getDate() + 7);
                    const qrIdDetails = await PayMySQL.createPaymentQR(db.mysql.write, { payment_info_id: paymentInfoResult.insertId });
                    const num = qrIdDetails.insertId;
                    const descriptor = num.toString().padStart(12, '0');
                    const rzpVbaObj = {
                        description: `Payment for QR | PIQR ID: ${descriptor}`,
                        descriptor,
                        amount,
                        close_by: Math.floor(date / 1000),
                    };
                    const razorpayUpiResponse = await RazorpayHelper.createUpiId(rzpVbaObj);
                    console.log(razorpayUpiResponse);
                    upiId = razorpayUpiResponse.receivers[0].address;
                    await PayMySQL.updatePaymentInfoQR(db.mysql.write, {
                        payment_info_id: paymentInfoResult.insertId,
                        virtual_account_id: razorpayUpiResponse.id,
                        upi_id: upiId,
                        amount_expected: amount,
                    });
                }
                let upiIntentLink = DataPayment.upi_intent_link;
                upiIntentLink = upiIntentLink.replace(/##upiId##/g, upiId);
                upiIntentLink = upiIntentLink.replace(/##amount##/g, amount);
                responseInfo.upi_intent_link = upiIntentLink;
            } else {
                responseInfo.upi_intent_link = await RazorpayHelper.createUPILink(partner_order_id, userEmail, userPhone, 'Payment', (amount) * 100);
                PayMySQL.createPaymentQR(db.mysql.write, { payment_info_id: paymentInfoResult.insertId });
            }
        }
        if (method == 'payment_link') {
            if (payment_for == 'wallet') {
                responseInfo.share_message = `Mere Doubtnut wallet me ₹${amount} add karne ke liye iss link se payment kariye : ${razorpayResponse.short_url}`;
            } else {
                responseInfo.share_message = `Doubtnut par ₹${amount} ka ${packageName.trim()} mere liye buy karne ke liye iss link par click kariye : ${razorpayResponse.short_url}`;
            }
            responseInfo.url = razorpayResponse.short_url;
            responseInfo.currency = currency;
        }
        if (method == 'DN') {
            const paymentInfo = await PayMySQL.getPaymentInfoById(db.mysql.write, paymentInfoResult.insertId);
            await PaymentHelper.walletPaymentComplete(db, config, paymentInfo);
            responseInfo.amount = total_amount;
            responseInfo.order_id = order_id;
            is_wallet_payment = true;
            method = 'razorpay_payment';
            if (insertObj.variant_id) {
                const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, insertObj.variant_id);
                if (course_details.length) {
                    assortment_type = course_details[0].assortment_type;
                    assortment_id = course_details[0].assortment_id;
                }
            }
        }

        if (payment_info.is_web) {
            const eventData = {
                student_id: studentId,
                assortment_id: packageInfo[0].assortment_id,
                coupon_code,
                event_name: 'BUYNOW_CLICK',
                source: 'CHECKOUT_PAGE',
                ip: req.ip,
                hostname: req.hostname,
                student_locale: locale,
                student_class: req.user.student_class,
            };
            EventsModule.putEventIntoMongoWrapper(db, eventData);
        }

        if (paymentInfoResult.insertId) {
            const startCardTime = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD');
            redisAnswer.setUserLiveClassWatchedVideo(db.redis.read, +req.user.student_id, startCardTime, 'LIVECLASS_VIDEO_LF_ET_TRIAL_DISCOUNT_CARD');
        }

        responseData.data = {
            [method]: responseInfo, assortment_type, currency_symbol: currencySymbol, assortment_id, is_wallet_payment, payment_id: paymentInfoResult.insertId, batch_id: batchId,
        };
        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
        await PackageRedis.deleteActiveEmiPackageAndRemainingDays(db.redis.write, studentId);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    startPayment,
};
