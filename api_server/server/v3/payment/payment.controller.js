const _ = require('lodash');
const moment = require('moment');
const Razorpay = require('razorpay');
const PayMySQL = require('../../../modules/mysql/payment');
const PackageRedis = require('../../../modules/redis/package');
const PaymentHelper = require('../../helpers/payment');
const RazorpayHelper = require('../../../modules/razorpay/helper');
const Student = require('../../../modules/mysql/student');
const StudentHelper = require('../../helpers/student.helper');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const Data = require('../../../data/data');
const PaymentConstants = require('../../../data/data.payment');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CouponContainer = require('../../../modules/containers/coupon');
const DataPayment = require('../../../data/data.payment');
const CourseHelper = require('../../helpers/course');
const PaymentRedis = require('../../../modules/redis/payment');
const EventsModule = require('../../../modules/events/events');
const UtilityEncrypt = require('../../../modules/Utility.encryption');
const DNProperty = require('../../../modules/mysql/property');
const bl = require('./payment.bl');

let db;
let config;

async function startPayment(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        db.mongo.write.collection('payment_log').save({ ...req.body, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });

        let { country } = req.headers;
        const { version_code, 'x-auth-token': xAuthToken } = req.headers;

        const { payment_info } = req.body;
        const { payment_for } = req.body;
        let source = req.body.source || 'RAZORPAY';
        const { locale } = req.user;
        const {
            variant_id,
        } = payment_info;

        let { dn_wallet, coupon_code } = payment_info;
        let { method } = req.body;

        if (coupon_code == 'null') {
            coupon_code = '';
        }
        if (!country) {
            country = 'IN';
        }
        // discount is the coupon amount used for payment
        let total_amount; let package_min_limit = 0; let wallet_reward_amount_usable = 0; let assortment_type; let assortment_id; let wallet_amount = 0; let wallet_cash_amount = 0; let wallet_reward_amount = 0; let discount = 0; let packageInfo; let insert_coupon_flag = 0; let partner_order_id; let is_wallet_payment = false; let upgradeCheck = {};
        let razorpayResponse;
        let packageName;
        let isUpgraded = false;

        const studentId = req.user.student_id;
        const student_info = await Student.getById(studentId, db.mysql.read);
        // const userEmail = (!_.isEmpty(student_info[0].student_email) && /\S+@\S+\.\S+/.test(student_info[0].student_email)) ? student_info[0].student_email.trim() : `payments+${studentId}@doubtnut.com`;
        const userEmail = `payments+${studentId}@doubtnut.com`;
        const userPhone = (!_.isEmpty(student_info[0].mobile)) ? student_info[0].mobile : studentId;

        let responseInfo = {};

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        // wallet not to be used in payments
        if (payment_info.is_web) dn_wallet = false;

        const order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);

        if (payment_for == 'course_package' || payment_for == 'doubt') {
            packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);
            // Inactive packages/variant handling
            if (packageInfo.length && (!packageInfo[0].active_variant || !packageInfo[0].active_package)) {
                responseData.meta = {
                    code: 204,
                    success: true,
                    message: 'Inactive course',
                };
                responseData.data.message = 'Inactive course';
                return res.status(responseData.meta.code).json(responseData);
            }
            upgradeCheck = await CourseHelper.getDifferenceAmountForUpgradeSubscription({
                db, studentID: studentId, assortmentID: packageInfo[0].assortment_id,
            });
            if (!_.isEmpty(upgradeCheck) && upgradeCheck.amount < packageInfo[0].final_amount && upgradeCheck.duration < packageInfo[0].duration_in_days) {
                packageInfo[0].final_amount -= upgradeCheck.amount;
                isUpgraded = true;
            }

            total_amount = packageInfo[0].final_amount;
            package_min_limit = Math.ceil(total_amount * (packageInfo[0].min_limit_percentage / 100));
            packageInfo[0].min_limit = package_min_limit;
            const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, variant_id);
            if (course_details.length) {
                assortment_type = course_details[0].assortment_type;
                assortment_id = course_details[0].assortment_id;
            }
        } else if (payment_for == 'wallet') {
            total_amount = payment_info.amount;
            dn_wallet = false;
        } else if (payment_for == 'bounty') {
            total_amount = payment_info.amount;
            dn_wallet = false;
        }

        if (dn_wallet) {
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
            coupon_data = await CouponContainer.fetchCouponApplyData(db, req.user, coupon_code, packageInfo, version_code, xAuthToken);
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
        if (!dn_wallet) {
            wallet_reward_amount = 0;
            wallet_cash_amount = 0;
            wallet_reward_amount_usable = 0;
        }
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
        // 3 end

        // bug resolve for coupon not coming  in upi_intent code
        // hack for fix

        if (version_code <= 901 && method == 'upi_intent') {
            const cartDataString = await PaymentRedis.getPaymentCartOption(db.redis.read, studentId);

            if (cartDataString && cartDataString.length) {
                let cartDetails = {};

                cartDetails = JSON.parse(cartDataString);

                const cartObj = _.groupBy(cartDetails.cart_info, 'key');
                discount = Math.abs(cartObj.coupon_code[0].value);
                console.log(discount);
            }
        }

        wallet_amount = wallet_cash_amount + wallet_reward_amount_usable;
        let amount = Math.max(total_amount - discount - wallet_amount, 0);
        console.log('total_amount, discount, wallet_cash_amount, wallet_reward_amount, upgradeCheck', total_amount, discount, wallet_cash_amount, wallet_reward_amount_usable, upgradeCheck);
        if (amount <= 0 && (method != 'upi_intent' && method != 'payment_link')) {
            source = 'WALLET';
            amount = 0;
            wallet_amount = total_amount - discount;
            if (isUpgraded) {
                // eslint-disable-next-line operator-assignment
                // wallet_amount = wallet_amount - upgradeCheck.amount;
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

            if (method != 'payment_link') {
                razorpayResponse = await rzp.orders.create({
                    amount: amount * 100,
                    currency: 'INR',
                    receipt: order_id,
                    payment_capture: true,
                });
                partner_order_id = razorpayResponse.id;
            } else {
                const date = new Date();
                date.setDate(date.getDate() + 2);
                packageName = 'Doubtnut';
                if ((payment_for == 'course_package' || payment_for == 'doubt') && payment_info.variant_id) {
                    packageName = `${packageInfo[0].package_name} package`;
                }
                const obj = {
                    type: 'link',
                    description: `Payment for ${userPhone} | ${packageName}`,
                    amount: parseFloat(amount) * 100,
                    expire_by: Math.floor(date / 1000),
                    customer: {
                        contact: userPhone,
                        email: userEmail,
                    },
                };
                if (isUpgraded) {
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
        if (insert_coupon_flag) {
            insertObj.coupon_code = coupon_data.code;
        }
        if (payment_info.variant_id && payment_for != 'bounty') insertObj.variant_id = payment_info.variant_id;
        if (payment_info.payment_for_id) insertObj.payment_for_id = payment_info.payment_for_id;
        insertObj.partner_order_id = partner_order_id;
        if (method == 'payment_link') insertObj.created_from = 'app-payment-link';
        insertObj.mode = method;

        const paymentInfoResult = await PayMySQL.createPayment(db.mysql.write, insertObj);

        if (method == 'payment_link') {
            PayMySQL.setRzpPaymentLink(db.mysql.write, {
                payment_info_id: paymentInfoResult.insertId, student_id: studentId, link_id: partner_order_id, status: 'INITIATED',
            });
        }

        if (wallet_amount > 0 || payment_info.is_web) {
            PayMySQL.setPaymentInfoMeta(db.mysql.write, {
                payment_info_id: paymentInfoResult.insertId, is_web: payment_info.is_web ? 1 : 0, wallet_cash_amount, wallet_reward_amount: wallet_reward_amount_usable,
            });
        }

        /*
        if (total_amount - discount - wallet_amount - amount !== 0) {
            throw new Error('something went wrong ');
        }
        */

        if (method == 'netbanking' || method == 'card' || method == 'upi' || method == 'paytm' || method == 'wallet') {
            responseInfo.order_id = partner_order_id;
            responseInfo.email = userEmail;
            responseInfo.phone = userPhone;
            responseInfo.amount = amount;
            method = 'razorpay_payment';
        } else if (method == 'upi_intent') {
            responseInfo = Data.upiCheckout(locale);
            if (payment_for == 'course_package' || payment_for == 'doubt') {
                packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);
                responseInfo.header = `${packageInfo[0].package_name}`;
                responseInfo.title = `${responseInfo.title}\n${responseInfo.payment_count_text}`;
            } else if (payment_for == 'bounty') {
                responseInfo.header = global.t8[locale].t('Padhao Aur Kamao'.toUpperCase(), 'Padhao Aur Kamao');
                responseInfo.title = `${responseInfo.title}\n${responseInfo.payment_count_text}`;
            } else if (payment_for == 'wallet') {
                responseInfo.header = global.t8[locale].t('DN Wallet'.toUpperCase(), 'DN Wallet');
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
                    const qrIdDetails = await PayMySQL.createPaymentQR(db.mysql.write, { payment_info_id: paymentInfoResult.insertId });
                    const date = new Date();
                    date.setDate(date.getDate() + 7);
                    const num = qrIdDetails.insertId;
                    const descriptor = num.toString().padStart(12, '0');
                    const rzpVbaObj = {
                        description: `Payment for QR | PIQR ID: ${descriptor}`,
                        descriptor,
                        amount,
                        close_by: Math.floor(date / 1000),
                    };
                    const razorpayUpiResponse = await RazorpayHelper.createUpiId(rzpVbaObj);
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

        responseData.data = {
            [method]: responseInfo, assortment_type, assortment_id, is_wallet_payment, payment_id: paymentInfoResult.insertId,
        };
        console.log(responseData);
        res.status(responseData.meta.code).json(responseData);
        await PackageRedis.deleteActiveEmiPackageAndRemainingDays(db.redis.write, studentId);
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
    const pageType = req.query.pagetype;
    console.log('page', page);
    console.log('pageType', pageType);
    const limit = 10;

    let { country } = req.headers;
    if (!country) {
        country = 'IN';
    }

    const currencyAndCountryObj = await StudentHelper.getUserCountryAndCurrency(db, studentId);
    country = currencyAndCountryObj.country;
    const { currency_symbol: currencySymbol } = currencyAndCountryObj;

    const { locale } = req.user;

    const { version_code } = req.headers;
    try {
        const finalData = [];
        if (pageType.toLowerCase() == 'successful') {
            const paymentHistory = await PayMySQL.getSuccessfulTransactionHistoryByStudentId(db.mysql.read, studentId, limit, limit * (page - 1), version_code);
            for (let i = 0; i < paymentHistory.length; i++) {
                const finalDatum = {};
                console.log(paymentHistory[i]);
                finalDatum.date = moment(paymentHistory[i].updated_at).format('hh:mm A Do MMMM YYYY');
                finalDatum.payment_for = paymentHistory[i].payment_for;
                finalDatum.name = paymentHistory[i].name;
                if (_.isEmpty(finalDatum.name)) {
                    finalDatum.name = global.t8[locale].t('Doubtnut Payment'.toUpperCase(), 'Doubtnut Payment');
                }
                if (!_.isEmpty(paymentHistory[i].order_id)) {
                    finalDatum.order_id = `${global.t8[locale].t('Order ID'.toUpperCase(), 'Order ID')} ${paymentHistory[i].order_id}`;
                }
                finalDatum.type = paymentHistory[i].type;
                finalDatum.status = paymentHistory[i].status;
                finalDatum.partner_txn_id = paymentHistory[i].partner_txn_id;
                finalDatum.image_url = `${config.staticCDN}engagement_framework/313CDD1C-0CA4-6772-5917-89AC9E611A73.webp`;
                // finalDatum.invoice_url = '';
                if (finalDatum.payment_for.toLowerCase() === 'doubt' && country == 'IN') {
                    finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                    finalDatum.name = global.t8[locale].t('Doubt VIP Pass'.toUpperCase(), 'Doubt VIP Pass');
                }
                if (finalDatum.payment_for.toLowerCase() === 'doubt' && country == 'US') {
                    // finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                    finalDatum.name = 'Doubtnut VIP';
                }
                if (finalDatum.payment_for.toLowerCase() === 'doubt' && finalDatum.cu) {
                    finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                    finalDatum.name = global.t8[locale].t('Doubt VIP Pass'.toUpperCase(), 'Doubt VIP Pass');
                } else if (finalDatum.payment_for.toLowerCase() == 'wallet') {
                    finalDatum.image_url = `${Data.cdnUrl}/images/dn_wallet_icon_1.webp`;
                    finalDatum.name = global.t8[locale].t('Wallet TOP-UP'.toUpperCase(), 'Wallet TOP-UP');
                    finalDatum.type = 'CREDIT';
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                }
                if (finalDatum.payment_for.toLowerCase() == 'course_package' || finalDatum.payment_for.toLowerCase() == 'vip_offline') {
                    // eslint-disable-next-line no-await-in-loop
                    const course_info = await PayMySQL.getCourseInfoByOrderId(db.mysql.write, paymentHistory[i].order_id);
                    finalDatum.name = course_info[0].package_name;
                    console.log(course_info[0].type.toLowerCase());
                    if (_.isEmpty(course_info[0].image_url)) {
                        finalDatum.image_url = `${config.staticCDN}engagement_framework/313CDD1C-0CA4-6772-5917-89AC9E611A73.webp`;
                    } else {
                        finalDatum.image_url = course_info[0].image_url;
                    }
                    if (course_info[0].type.toLowerCase() === 'resource_video') {
                        finalDatum.btn1_text = global.t8[locale].t('View Video'.toUpperCase(), 'View Video');
                        finalDatum.btn1_deeplink = `doubtnutapp://course_details?id=${course_info[0].assortment_id}`;
                    } else if (course_info[0].type.toLowerCase() === 'resource_pdf') {
                        finalDatum.btn1_text = global.t8[locale].t('View PDF'.toUpperCase(), 'View PDF');
                        // eslint-disable-next-line no-await-in-loop
                        const pdfLink = await PayMySQL.getPDFLinkByAssortmentID(db.mysql.write, course_info[0].assortment_id);
                        finalDatum.image_url = `${Data.cdnUrl}/images/payment/pdf_icon.webp`;
                        finalDatum.pdf_url = `${pdfLink[0].resource_reference}`;
                        finalDatum.btn1_deeplink = null;
                    } else {
                        finalDatum.btn1_text = global.t8[locale].t('View Course'.toUpperCase(), 'View Course');
                        finalDatum.btn1_deeplink = course_info[0].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${course_info[0].assortment_id}`;
                    }
                    if (!_.isEmpty(course_info[0].invoice_url)) {
                        finalDatum.btn2_text = global.t8[locale].t('View Invoice'.toUpperCase(), 'View Invoice');
                        finalDatum.btn2_deeplink = `${config.staticCDN}${course_info[0].invoice_url}`;
                        finalDatum.invoice_url = `${config.staticCDN}${course_info[0].invoice_url}`;
                    }
                    if (paymentHistory[i].cod_purchase == 1) {
                        finalDatum.btn1_text = global.t8[locale].t('Track Order'.toUpperCase(), 'Track Order');
                        const json_payload = {
                            course_name: course_info[0].package_name.replace(/&/g, 'and'),
                            coupon_code: '',
                            variant_id: course_info[0].variant_id,
                            mobile: req.user.mobile,
                            version_code,
                            show_activation: 0,
                            locale,
                        };
                        finalDatum.btn1_deeplink = `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=`;
                        finalDatum.btn1_deeplink += req.headers['x-auth-token'];
                    }
                } else if (finalDatum.payment_for.toLowerCase() == 'add_referral_payment') {
                    finalDatum.name = global.t8[locale].t('Referral Reward'.toUpperCase(), 'Referral Reward');
                    finalDatum.image_url = `${Data.cdnUrl}/images/icon_small_gift.webp`;
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                } else if (finalDatum.payment_for.toLowerCase() == 'add_attendance_reward') {
                    finalDatum.name = global.t8[locale].t('Daily Attendance Reward'.toUpperCase(), 'Daily Attendance Reward');
                    finalDatum.image_url = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/288DCCAF-1279-B860-0F92-4BB6CD008AB5.webp';
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                } else if (finalDatum.payment_for.toLowerCase() == 'add_topic_booster_reward') {
                    finalDatum.name = global.t8[locale].t('Topic Booster Reward'.toUpperCase(), 'Topic Booster Reward');
                    finalDatum.image_url = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9341C6A5-7065-CF72-7B91-69B5CBBF9E30.webp';
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                } else if (finalDatum.payment_for.toLowerCase() == 'bounty') {
                    finalDatum.name = global.t8[locale].t('Bounty'.toUpperCase(), 'Bounty');
                    finalDatum.image_url = `${Data.cdnUrl}/images/dn_wallet_icon_1.webp`;
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                } else if (finalDatum.payment_for == 'padhao_aur_kamao') {
                    finalDatum.name = global.t8[locale].t('Padhao Aur Kamao'.toUpperCase(), 'Padhao Aur Kamao');
                    finalDatum.image_url = `${Data.cdnUrl}/images/icons/feed-bounty.webp`;
                } else if (finalDatum.payment_for == 'khelo_jeeto_reward') {
                    finalDatum.name = global.t8[locale].t('Khelo Aur Jeeto'.toUpperCase(), 'Khelo Aur Jeeto');
                    finalDatum.image_url = `${Data.cdnUrl}/images/dn_wallet_icon_1.webp`;
                    finalDatum.image_url = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9341C6A5-7065-CF72-7B91-69B5CBBF9E30.webp';
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                } else if (finalDatum.payment_for == 'daily_goal_reward') {
                    finalDatum.name = global.t8[locale].t('Daily Goal'.toUpperCase(), 'Daily Goal');
                    finalDatum.image_url = 'https://d10lpgp6xz60nq.cloudfront.net/daily_feed_resources/daily-goal-top-icon.webp';
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                } else if (finalDatum.payment_for == 'dnr_reward') {
                    finalDatum.name = global.t8[locale].t('DNR'.toUpperCase(), 'DNR');
                    finalDatum.image_url = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp';
                    finalDatum.btn1_text = global.t8[locale].t('View DN Wallet'.toUpperCase(), 'View DN Wallet');
                    finalDatum.btn1_deeplink = 'doubtnutapp://wallet';
                }

                if (paymentHistory[i].expiry) {
                    // eslint-disable-next-line no-await-in-loop
                    const expired_status = await PayMySQL.getWalletTransactionExpiredByWalletTransactionId(db.mysql.read, paymentHistory[i].id);

                    if (expired_status.length && expired_status[0].status != null && expired_status[0].status == 'USED') {
                        finalDatum.order_id = 'Used';
                    } else {
                        const diffInDays = moment(paymentHistory[i].expiry).endOf('days').diff(moment().add(5, 'hours').add(30, 'minutes').endOf('days'), 'hours') / 24;
                        if (diffInDays == 0) {
                            finalDatum.order_id = global.t8[locale].t('Expiring today'.toUpperCase(), 'Expiring today');
                        } else if (diffInDays == 1) {
                            finalDatum.order_id = global.t8[locale].t('Expiring tomorrow'.toUpperCase(), 'Expiring tomorrow');
                        } else if (diffInDays > 1) {
                            finalDatum.order_id = global.t8[locale].t('Expires in {{math_ceil}} days', { math_ceil: Math.ceil(diffInDays) });
                        } else if (diffInDays < 0) {
                            finalDatum.order_id = `${global.t8[locale].t('Expired on'.toUpperCase(), 'Expired on')} ${moment(paymentHistory[i].expiry).format('Do MMM YYYY')}`;
                        }
                    }
                }
                finalDatum.amount_color = finalDatum.type === 'DEBIT' ? '#ff4e61' : '#1cb972';
                const amountSign = finalDatum.type === 'DEBIT' ? '-' : '+';
                finalDatum.amount = country == 'US' ? `${amountSign} $${paymentHistory[i].amount}` : `${amountSign} ${currencySymbol}${paymentHistory[i].amount}`;
                finalDatum.currency_symbol = currencySymbol;

                // console.log(finalDatum.payment_for);
                finalData.push(finalDatum);
            }
        } else if (pageType.toLowerCase() == 'failure') {
            const paymentHistory = await PayMySQL.getFailedTransactionHistoryByStudentId(db.mysql.read, studentId, limit, limit * (page - 1));
            for (let i = 0; i < paymentHistory.length; i++) {
                const finalDatum = {};
                finalDatum.date = moment(paymentHistory[i].updated_at).format('hh:mm A Do MMMM YYYY');
                finalDatum.payment_for = paymentHistory[i].payment_for;
                finalDatum.name = paymentHistory[i].name;
                if (_.isEmpty(finalDatum.name)) {
                    finalDatum.name = global.t8[locale].t('Doubtnut Payment'.toUpperCase(), 'Doubtnut Payment');
                }
                if (!_.isEmpty(paymentHistory[i].order_id)) {
                    finalDatum.order_id = `${global.t8[locale].t('Order ID'.toUpperCase(), 'Order ID')} ${paymentHistory[i].order_id}`;
                }
                finalDatum.type = paymentHistory[i].type;
                finalDatum.status = paymentHistory[i].status;
                finalDatum.partner_txn_id = paymentHistory[i].partner_txn_id;
                finalDatum.image_url = `${config.staticCDN}engagement_framework/313CDD1C-0CA4-6772-5917-89AC9E611A73.webp`;
                if (finalDatum.payment_for.toLowerCase() === 'doubt' && country == 'IN') {
                    finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                    finalDatum.name = global.t8[locale].t('Doubt VIP Pass'.toUpperCase(), 'Doubt VIP Pass');
                }
                if (finalDatum.payment_for.toLowerCase() === 'doubt' && country == 'US') {
                    // finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                    finalDatum.name = 'Doubtnut VIP';
                }
                if (finalDatum.payment_for.toLowerCase() === 'doubt' && finalDatum.cu) {
                    finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                    finalDatum.name = global.t8[locale].t('Doubt VIP Pass'.toUpperCase(), 'Doubt VIP Pass');
                } else if (finalDatum.payment_for.toLowerCase() == 'wallet') {
                    finalDatum.image_url = `${Data.cdnUrl}/images/dn_wallet_icon_1.webp`;
                    finalDatum.name = global.t8[locale].t('Wallet TOP-UP'.toUpperCase(), 'Wallet TOP-UP');
                    finalDatum.type = 'CREDIT';
                }
                if (finalDatum.payment_for.toLowerCase() == 'course_package' || finalDatum.payment_for.toLowerCase() == 'vip_offline') {
                    // eslint-disable-next-line no-await-in-loop
                    const course_info = await PayMySQL.getCourseInfoByOrderId(db.mysql.write, paymentHistory[i].order_id);
                    finalDatum.name = course_info[0].package_name;
                    if (_.isEmpty(course_info[0].image_url)) {
                        finalDatum.image_url = `${config.staticCDN}engagement_framework/313CDD1C-0CA4-6772-5917-89AC9E611A73.webp`;
                    } else {
                        finalDatum.image_url = course_info[0].image_url;
                    }
                } else if (finalDatum.payment_for.toLowerCase() == 'bounty') {
                    finalDatum.name = global.t8[locale].t('Bounty'.toUpperCase(), 'Bounty');
                    finalDatum.image_url = `${Data.cdnUrl}/images/dn_wallet_icon_1.webp`;
                }
                const amountSign = finalDatum.type === 'DEBIT' ? '-' : '+';
                finalDatum.amount = country == 'US' ? `${amountSign} $${paymentHistory[i].amount}` : `${amountSign} ${currencySymbol}${paymentHistory[i].amount}`;
                finalDatum.currency_symbol = currencySymbol;
                // console.log(finalDatum.payment_for);
                finalData.push(finalDatum);
            }
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

async function checkoutPage(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id, locale } = req.user;
        const {
            variant_id, amount, payment_for, switch_assortment, selected_wallet = null, has_upi_app: upiApp, remove_coupon,
        } = req.body;
        let { country } = req.headers;
        const { package_name: altAppPackageName } = req.headers;
        if (!country) {
            country = 'IN';
        }
        let {
            coupon_code,
        } = req.body;
        const {
            version_code, is_browser: isBrowser, 'x-auth-token': xAuthToken,
        } = req.headers;

        if (coupon_code == 'null' || !coupon_code) {
            coupon_code = '';
        }
        console.log(selected_wallet);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                title: global.t8[locale].t('Payment'.toUpperCase(), 'Payment'),
                widgets: [],
            },
        };

        // DN Reward: key -> 1
        // DN Cash: key -> 2
        // If selected_wallet is empty by deafult all wallets are selected
        let use_wallet_cash = false;
        let use_wallet_reward = false;
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

        const [variant_details, currencyAndCountryObj] = await Promise.all([
            Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variant_id),
            StudentHelper.getUserCountryAndCurrency(db, student_id),
        ]);
        country = currencyAndCountryObj.country;
        const { currency_symbol: currencySymbol } = currencyAndCountryObj;

        // course notification refree and referrer
        const courseNotifPromise = _.includes([11, 12, 13], +req.user.student_class) ? [bl.setCourseNotificationData(db, variant_details, student_id, req.user.student_class, req.user.fname || '', altAppPackageName)] : [];

        // Inactive packages/variant handling
        if ((variant_details.length && (!variant_details[0].active_variant || !variant_details[0].active_package)) || (country != 'IN' && variant_details[0].reference_type != 'doubt')) {
            const inactivePackageResponse = PaymentConstants.checkout_widget.inactive_package(locale);
            responseData.data.widgets.push(inactivePackageResponse);
            return res.status(responseData.meta.code).json(responseData);
        }

        if (country != 'IN') {
            use_wallet_reward = false;
            use_wallet_cash = false;
        }
        console.log('req.user', req.user);
        console.log('country', country);

        const [checkoutComputeObj, redisCount] = await Promise.all([
            PaymentHelper.computeCheckoutDetails(db, {
                payment_for, coupon_code, switch_assortment, student_info: req.user, use_wallet_cash, use_wallet_reward, amount, xAuthToken, variant_id, remove_coupon, version_code, variant_details, currency_symbol: currencySymbol,
            }),
            PaymentRedis.getCheckoutPageViewStat(db.redis.read, req.user.student_id),
        ]);

        const audioCheckoutObj = {};
        if (!_.isEmpty(checkoutComputeObj.audioObj)) await PaymentHelper.fetchCheckoutAudio(db, checkoutComputeObj.audioObj, audioCheckoutObj);

        if (_.isEmpty(audioCheckoutObj)) {
            audioCheckoutObj.checkout_audio = {};
        }

        // App response starts here
        // *********** Header Widget Start ***********
        let headerTitle;
        console.log(checkoutComputeObj.order_info, checkoutComputeObj.packageInfo);
        if (!_.isEmpty(checkoutComputeObj.packageInfo)) {
            headerTitle = checkoutComputeObj.packageInfo[0].package_name;
        } else {
            headerTitle = (!_.isEmpty(checkoutComputeObj.order_info) && !_.isEmpty(checkoutComputeObj.order_info.title) ? checkoutComputeObj.order_info.title : null);
        }

        const packageDuration = (!_.isEmpty(checkoutComputeObj.order_info) && !_.isEmpty(checkoutComputeObj.order_info.title)) ? ` | ${checkoutComputeObj.order_info.package_duration}` : '';
        let headerSubtitle = '';
        if (!_.isEmpty(audioCheckoutObj.checkout_audio)) {
            headerSubtitle = `${audioCheckoutObj.checkout_audio.title}${packageDuration}`;
        } else {
            headerSubtitle = `${(!_.isEmpty(checkoutComputeObj.order_info) && !_.isEmpty(checkoutComputeObj.order_info.title)) ? checkoutComputeObj.order_info.package_duration : ''}`;
        }
        const headerWidget = {
            data: {
                title: headerTitle || global.t8[locale].t('DOUBTNUT PAYMENT', 'Doubtnut Payment'),
                subtitle: headerSubtitle,
                price: `${currencySymbol}${global.t8[locale].t('price', { val: checkoutComputeObj.net_amount })}`,
                dialog_data: {
                    title: global.t8[locale].t('Price Breakup'.toUpperCase(), 'Price Breakup'),
                    bottom_text: global.t8[locale].t('Final Price'.toUpperCase(), 'Final Price'),
                    price: `${currencySymbol}${global.t8[locale].t('price', { val: checkoutComputeObj.net_amount })}`,
                    price_breakup: [
                        {
                            title: global.t8[locale].t('Original'.toUpperCase(), 'Original'),
                            amount: `${global.t8[locale].t('price', { val: checkoutComputeObj.package_original_amount })}`,
                        },
                    ],
                },
                audio_url: audioCheckoutObj.checkout_audio.audio_url,
            },

            type: 'widget_checkout_header',
        };

        if (checkoutComputeObj.package_discount != 0) {
            headerWidget.data.dialog_data.price_breakup.push({
                title: global.t8[locale].t('Discount'.toUpperCase(), 'Discount'),
                amount: `-${global.t8[locale].t('price', { val: checkoutComputeObj.package_discount })}`,
            });
        }

        if (checkoutComputeObj.coupon_amount != 0 && !(remove_coupon) && checkoutComputeObj.coupon_amount) {
            headerWidget.data.dialog_data.price_breakup.push({
                title: global.t8[locale].t('Coupon'.toUpperCase(), 'Coupon'),
                amount: `-${global.t8[locale].t('price', { val: checkoutComputeObj.coupon_amount })}`,
            });
        }

        if (checkoutComputeObj.wallet_cash_amount != 0 && country == 'IN') {
            headerWidget.data.dialog_data.price_breakup.push({
                title: global.t8[locale].t('Dn Cash'.toUpperCase(), 'Dn Cash'),
                amount: `-${global.t8[locale].t('price', { val: checkoutComputeObj.wallet_cash_amount_usable })}`,
            });
        }

        if (checkoutComputeObj.wallet_reward_amount_usable != 0 && country == 'IN') {
            headerWidget.data.dialog_data.price_breakup.push({
                title: global.t8[locale].t('Dn Reward Cash'.toUpperCase(), 'Dn Reward Cash'),
                amount: `-${global.t8[locale].t('price', { val: checkoutComputeObj.wallet_reward_amount_usable })}`,
            });
        }
        responseData.data.widgets.push(headerWidget);
        // *********** Header Widget Ends ***********

        // Terms and Conditions Widget
        const tAndCWidget = {
            data: {
                title: global.t8[locale].t('By proceeding further, you accept the '),
                subtitle: global.t8[locale].t('Terms and Conditions'),
                deeplink: 'doubtnutapp://action_web_view?url=https://www.doubtnut.com/terms-and-conditions',
            },
            type: 'widget_checkout_talk_to_us',
        };
        responseData.data.widgets.push(tAndCWidget);

        // *********** Coupon Widget Start ***********
        if ((payment_for === 'course_package' || payment_for === 'doubt')) {
            // Coupon Widget
            const couponWidget = {
                data: {
                    title: global.t8[locale].t('Enter/Select Coupon'.toUpperCase(), 'Enter/Select Coupon'),
                    text: checkoutComputeObj.coupon_info.cta_button,
                    coupon_hint: global.t8[locale].t('Hint'.toUpperCase(), 'Hint'),
                    image_url: checkoutComputeObj.coupon_info.image_url,
                    message: checkoutComputeObj.coupon_info.message,
                    code: checkoutComputeObj.coupon_info.code,
                    coupon_type: checkoutComputeObj.coupon_info.coupon_type, // optional
                    status: checkoutComputeObj.coupon_info.status,
                    coupon_amount: `${currencySymbol}${global.t8[locale].t('price', { val: checkoutComputeObj.coupon_amount })}`,
                },
                type: 'widget_checkout_coupon',
            };
            responseData.data.widgets.push(couponWidget);
        }
        // *********** Coupon Widget Ends ***********

        /**
         * Flagr for auto proceed option and disable payment options in case of 0 net amount
         * autoProceedTime = 0 -> auto proceed false, by deafult auto proceed, flagr name is different don't get confused
         */
        let autoProceedTime = 2000;
        const autoProceedFlagrKey = 'checkout_page_auto_proceed';

        const flagrResponse = await CourseHelper.getFlagrResponseByFlagKey(xAuthToken, [autoProceedFlagrKey]);
        console.log('autoProceedFlagrResponse', flagrResponse);
        if (!_.isEmpty(flagrResponse) && flagrResponse.checkout_page_auto_proceed && flagrResponse.checkout_page_auto_proceed.enabled == true && flagrResponse.checkout_page_auto_proceed.payload.enabled == true) {
            autoProceedTime = 0;
        }

        // Delete Payment options in case of wallet Payment True Only when net amount = 0 and disableOptionFlagr value is false
        const deletePaymentOptionsFlag = false;
        /**
         * Disable delete options Flagr
         * const disableOptionsFlagrKey = 'checkout_page_disable_payment_options';
         * if (!_.isEmpty(flagrResponse) && flagrResponse.checkout_page_disable_payment_options && flagrResponse.checkout_page_disable_payment_options.enabled == true && flagrResponse.checkout_page_disable_payment_options.payload.enabled == false && checkoutComputeObj.net_amount === 0 && checkoutComputeObj.wallet_cash_amount_usable >= 0 && checkoutComputeObj.wallet_total_amount_display != 0) {
         *    deletePaymentOptionsFlag = true;
         * }
         */

        // *********** Wallet Widget Start ***********
        const dnWalletPayment = !!((checkoutComputeObj.net_amount === 0 && checkoutComputeObj.wallet_cash_amount_usable >= 0 && checkoutComputeObj.wallet_total_amount_display != 0));
        if (checkoutComputeObj.wallet_total_amount_display != 0 && (payment_for === 'course_package' || payment_for === 'doubt' || payment_for === 'bounty') && country == 'IN') {
            const walletWidget = {
                data: {
                    title: global.t8[locale].t('Wallet'.toUpperCase(), 'Wallet'),
                    tooltip_text: PaymentConstants.wallet_info(locale).reward_amount.tooltip_text,
                    help: '',
                    items: [],
                },
                type: 'widget_checkout_wallet',
            };
            if (!_.isEmpty(checkoutComputeObj.wallet_info.reward_amount)) {
                let subtitle = '';

                // wallet_reward_amount_usable_display -> reward amount which can be used for this order
                // wallet_reward_amount -> total wallet reward amount
                // wallet_reward_amount_usable -> reward amount which is used for this computation(0 in case wallet reward is desellected)
                if (checkoutComputeObj.wallet_reward_amount_usable_display < checkoutComputeObj.wallet_reward_amount && (checkoutComputeObj.wallet_reward_amount_usable !== 0 || !use_wallet_reward)) {
                    subtitle = global.t8[locale].t('Only {{currencySymbol}}{{usableAmount, number}} can be used out of {{currencySymbol}}{{totalAmount, number}}', { currencySymbol, usableAmount: checkoutComputeObj.wallet_reward_amount_usable_display, totalAmount: checkoutComputeObj.wallet_reward_amount });
                } else if (checkoutComputeObj.wallet_reward_amount_usable === 0) {
                    subtitle = global.t8[locale].t('This amount can not be used for this order. Available Balance {{currencySymbol}}{{totalAmount, number}}', { currencySymbol, totalAmount: checkoutComputeObj.wallet_reward_amount });
                }
                walletWidget.data.items.push({
                    title: global.t8[locale].t('DN Reward Balance'.toUpperCase(), 'DN Reward Balance'),
                    subtitle,
                    key: 1,
                    is_selected: use_wallet_reward,
                    amount_text: `${currencySymbol}${global.t8[locale].t('price', { val: checkoutComputeObj.wallet_reward_amount_usable_display })}`,
                });
            }
            if (!_.isEmpty(checkoutComputeObj.wallet_info.cash_amount)) {
                walletWidget.data.items.push({
                    title: global.t8[locale].t('DN Cash Balance'.toUpperCase(), 'DN Cash Balance'),
                    subtitle: '',
                    key: 2,
                    is_selected: use_wallet_cash,
                    amount_text: `${currencySymbol}${global.t8[locale].t('price', { val: checkoutComputeObj.wallet_cash_amount })}`,
                });
            }
            if (walletWidget.data.items.length) {
                if (dnWalletPayment) {
                    walletWidget.data.button_text = `${global.t8[locale].t('Buy Now'.toUpperCase(), 'Buy Now')}`;
                    walletWidget.data.bottom_text = global.t8[locale].t('**Baki methods use karne ke liye, please DN Cash Balance ko un select karein');
                }
                responseData.data.widgets.push(walletWidget);
            }
        }
        // *********** Wallet Widget Ends ***********

        if (country == 'IN') {
            if (!deletePaymentOptionsFlag) {
                // Static Data for Online and Offline Methods
                const paymentObj = {
                    locale,
                    netAmount: checkoutComputeObj.net_amount,
                    autoProceedTime,
                };
                const offlineMethodsCheckoutWidget = PaymentConstants.checkout_widget.offline_methods(paymentObj);
                const onlineMethodsCheckoutWidget = PaymentConstants.checkout_widget.online_methods(paymentObj);
                const emiMethodsCheckoutWidget = PaymentConstants.checkout_widget.emi_methods(paymentObj);

                // Net Amount is 0 disable rest of the payment options for the user
                if (dnWalletPayment) {
                    onlineMethodsCheckoutWidget.data.items.forEach((element) => {
                        element.data.is_disabled = true;
                    });
                    onlineMethodsCheckoutWidget.data.is_disabled = true;
                    onlineMethodsCheckoutWidget.data.items[0].data.is_selected = false;
                    offlineMethodsCheckoutWidget.data.items.forEach((element) => {
                        element.data.is_disabled = true;
                    });
                    offlineMethodsCheckoutWidget.data.is_disabled = true;
                    emiMethodsCheckoutWidget.data.items.forEach((element) => {
                        element.data.is_disabled = true;
                    });
                    emiMethodsCheckoutWidget.data.is_disabled = true;
                }

                // has UPI App
                const upiCollectIndex = _.findIndex(onlineMethodsCheckoutWidget.data.items, (o) => o.data.method === 'upi_collect');
                const upiIndex = _.findIndex(onlineMethodsCheckoutWidget.data.items, (o) => o.data.method === 'upi');
                console.log('Upi App', upiApp);
                if (upiApp && upiCollectIndex > -1) {
                    onlineMethodsCheckoutWidget.data.items.splice(upiCollectIndex, 1);
                } else if (!upiApp && upiIndex > -1) {
                    console.log('No upi app');
                    onlineMethodsCheckoutWidget.data.items.splice(upiIndex, 1);
                }

                // Pasandeeda Vidhi
                await PaymentHelper.sortPaymentByPreferredModeV2({
                    db, studentId: student_id, locale, onlineMethodsCheckoutWidget, offlineMethodsCheckoutWidget, checkoutComputeObj, autoProceedTime, dnWalletPayment, responseData, currency_symbol: currencySymbol,
                });

                // *********** Shopse add deeplink or remove Shopse option Start ***********
                const shopse_index = _.findIndex(emiMethodsCheckoutWidget.data.items, (o) => o.data.method === 'shopse');

                if (shopse_index > -1 && payment_for == 'course_package' && checkoutComputeObj.net_amount >= DataPayment.shopse_emi_min_limit) {
                    const json_payload = {
                        course_name: `${checkoutComputeObj.packageInfo[0].package_name.trim().replace(/&/g, 'and')} | ${parseInt(checkoutComputeObj.packageInfo[0].duration_in_days / 30)} Months`,
                        variant_id,
                        amount: checkoutComputeObj.package_final_amount,
                        student_id,
                        version_code,
                        locale: req.user.locale,
                    };
                    emiMethodsCheckoutWidget.data.items[shopse_index].data.deeplink = `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/shopse.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=`;
                    emiMethodsCheckoutWidget.data.items[shopse_index].data.deeplink += req.headers['x-auth-token'];
                } else {
                    emiMethodsCheckoutWidget.data.items.splice(shopse_index, 1);
                }
                // *********** Shopse add deeplink or remove Shopse option Ends ***********

                // *********** PayU add deeplink or remove PayU option Start ***********
                const payu_index = _.findIndex(emiMethodsCheckoutWidget.data.items, (o) => o.data.method === 'payu');

                if (payu_index > -1 && payment_for == 'course_package' && checkoutComputeObj.net_amount >= DataPayment.payu_emi_min_limit) {
                    let courseName = `${checkoutComputeObj.packageInfo[0].package_name.trim().replace(/&/g, 'and')} | ${parseInt(checkoutComputeObj.packageInfo[0].duration_in_days / 30)} Months`;
                    if (courseName.length > 100) {
                        courseName = `${courseName.substring(0, 97)}...`;
                    }
                    const json_payload = {
                        course_name: courseName,
                        variant_id,
                        amount: checkoutComputeObj.package_final_amount,
                        student_id,
                        version_code,
                        locale: req.user.locale,
                    };
                    emiMethodsCheckoutWidget.data.items[payu_index].data.deeplink = `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/payu.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=`;
                    emiMethodsCheckoutWidget.data.items[payu_index].data.deeplink += req.headers['x-auth-token'];
                } else {
                    emiMethodsCheckoutWidget.data.items.splice(payu_index, 1);
                }
                // *********** PayU add deeplink or remove PayU option Ends ***********

                // *********** COD add deeplink or remove COD option Start ***********
                const cod_index = _.findIndex(offlineMethodsCheckoutWidget.data.items, (o) => o.data.method === 'COD');

                if (cod_index !== -1 && (payment_for == 'course_package' || payment_for == 'doubt') && checkoutComputeObj.net_amount >= 500 && !(await PaymentHelper.hasOnlinePaymentFingerprints(db, config, { student_id }))) {
                    const json_payload = {
                        course_name: checkoutComputeObj.packageInfo[0].package_name.replace(/&/g, 'and'),
                        coupon_code,
                        variant_id,
                        mobile: req.user.mobile,
                        version_code,
                        show_activation: 0,
                        locale: req.user.locale,
                    };
                    offlineMethodsCheckoutWidget.data.items[cod_index].data.deeplink = `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=`;
                    offlineMethodsCheckoutWidget.data.items[cod_index].data.deeplink += req.headers['x-auth-token'];
                } else if (cod_index !== -1) {
                    offlineMethodsCheckoutWidget.data.items.splice(cod_index, 1);
                }
                // *********** COD add deeplink or remove COD option Ends ***********

                // *********** BBPS Starts***********```
                const bbps_index = _.findIndex(offlineMethodsCheckoutWidget.data.items, (o) => o.data.method === 'bbps');

                if (bbps_index > -1 && payment_for == 'course_package') {
                    const token = {
                        x_auth: req.headers['x-auth-token'], student_id: req.user.student_id, variant_id, locale: req.user.locale, payment_for, phone_number: req.user.mobile, order_info: checkoutComputeObj.order_info, version_code,
                    };
                    offlineMethodsCheckoutWidget.data.items[bbps_index].data.deeplink = `doubtnutapp://web_view?chrome_custom_tab=false&title=फोन%20नंबर%20से%20पेमेंट&url=https://${req.headers.host}/static/bbps.html?token=`;
                    offlineMethodsCheckoutWidget.data.items[bbps_index].data.deeplink += UtilityEncrypt.encrypt(JSON.stringify(token));
                } else {
                    offlineMethodsCheckoutWidget.data.items.splice(bbps_index, 1);
                }

                // ***********  RTGS, NEFT add deeplink Starts***********```
                const bankTransferIndex = _.findIndex(offlineMethodsCheckoutWidget.data.items, (o) => o.data.method === 'bank_transfer');
                if (bankTransferIndex > -1) {
                    offlineMethodsCheckoutWidget.data.items[bankTransferIndex].data.deeplink = DataPayment.bank_transfer_deeplink;
                }
                const upiOfflineIndex = _.findIndex(offlineMethodsCheckoutWidget.data.items, (o) => o.data.method === 'upi_offline');
                if (upiOfflineIndex > -1) {
                    offlineMethodsCheckoutWidget.data.items[upiOfflineIndex].data.deeplink = DataPayment.upi_offline_deeplink;
                }
                responseData.data.widgets.push(onlineMethodsCheckoutWidget);
                if (!_.isEmpty(emiMethodsCheckoutWidget.data.items)) {
                    responseData.data.widgets.push(emiMethodsCheckoutWidget);
                }
                responseData.data.widgets.push(offlineMethodsCheckoutWidget);
            }

            // Redis data needed in bbps and COD
            const payment_details = {

                title: global.t8[locale].t('PAYMENT DETAILS'),
                cart_info: [{
                    name: global.t8[locale].t('Original'.toUpperCase(), 'Original'),
                    key: 'amount',
                    value: checkoutComputeObj.package_original_amount,
                    color: '#222222',
                }, {
                    name: global.t8[locale].t('Discount'.toUpperCase(), 'Discount'),
                    key: 'discount',
                    value: checkoutComputeObj.package_discount != 0 ? -checkoutComputeObj.package_discount : null,
                    color: '#222222',
                }, {
                    name: global.t8[locale].t('Coupon Code'.toUpperCase(), 'Coupon Code'),
                    key: 'coupon_code',
                    value: checkoutComputeObj.coupon_amount != 0 ? -checkoutComputeObj.coupon_amount : null,
                    color: '#54B726',
                }, {
                    name: global.t8[locale].t('DN Wallet'.toUpperCase(), 'DN Wallet'),
                    key: 'wallet_amount',
                    value: checkoutComputeObj.wallet_amount_usable != 0 ? -checkoutComputeObj.wallet_amount_usable : null,
                    color: '#333333',
                }, {
                    name: global.t8[locale].t('Final Price'.toUpperCase(), 'Final Price'),
                    key: 'net_amount',
                    value: checkoutComputeObj.net_amount,
                    color: '#273de9',
                }],

                view_details_text: global.t8[locale].t('VIEW DETAILS'),
                action_button: global.t8[locale].t('BUY NOW'),
                coupon_info: checkoutComputeObj.coupon_info,
                wallet_info: checkoutComputeObj.wallet_info,
            };
            PaymentRedis.setPaymentCartOption(db.redis.write, student_id, payment_details);
            if (isBrowser) {
                const eventData = {
                    student_id,
                    assortment_id: checkoutComputeObj.packageInfo[0].assortment_id,
                    coupon_code,
                    event_name: checkoutComputeObj.eventName,
                    ip: req.ip,
                    hostname: req.hostname,
                    student_locale: locale,
                    student_class: req.user.student_class,
                };
                EventsModule.putEventIntoMongoWrapper(db, eventData);
            }
            // carousel handling
            PaymentHelper.continueWithCourseCarouselHandler(db, checkoutComputeObj.packageInfo, coupon_code, student_id, variant_id, version_code);

            // Help

            responseData.data.help = PaymentConstants.payment_help(req.user.locale);

            if (redisCount <= PaymentConstants.checkout_tooltip_threshold) {
                PaymentRedis.setCheckoutPageViewStat(db.redis.write, req.user.student_id);
            }

            if (redisCount >= PaymentConstants.checkout_tooltip_threshold) {
                delete responseData.data.help.page_title_tooltip;
            }
        } else {
            const gulfCountryObj = {
                locale,
                currencySymbol,
                netAmount: checkoutComputeObj.net_amount,
                autoProceedTime,
            };
            const gulfCountryMethodsCheckoutWidget = PaymentConstants.checkout_widget.gulf_countries_methods(gulfCountryObj);
            responseData.data.widgets.push(gulfCountryMethodsCheckoutWidget);
        }

        // Talk to us widget
        const talkToUsWidget = {
            data: {
                title: global.t8[locale].t('Still looking for help?'),
                subtitle: global.t8[locale].t('Talk to Us'),
                deeplink: 'doubtnutapp://dialer?mobile=01247158250',
            },
            type: 'widget_checkout_talk_to_us',
        };
        responseData.data.widgets.push(talkToUsWidget);

        // Secure strip widget
        const bottomImageBannerWidget = {
            type: 'promo_list',
            data: {
                items: [
                    {
                        id: '',
                        image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/checkout_bottom_banner.webp',
                        deeplink: '',
                    },
                ],
                ratio: '360:36',
                margin: false,
            },
        };
        responseData.data.widgets.push(bottomImageBannerWidget);

        // Event details
        responseData.data.event_info = {
            variant_id,
            assortment_type: !_.isEmpty(checkoutComputeObj.packageInfo) ? checkoutComputeObj.packageInfo[0].assortment_type : '',
            amount: checkoutComputeObj.net_amount,
            package_description: !_.isEmpty(checkoutComputeObj.packageInfo) ? checkoutComputeObj.packageInfo[0].package_name : '',
            courseId: !_.isEmpty(checkoutComputeObj.packageInfo) ? checkoutComputeObj.packageInfo[0].assortment_id : '',
            package_id: !_.isEmpty(checkoutComputeObj.packageInfo) ? checkoutComputeObj.packageInfo[0].package_id : '',
            duration_in_days: !_.isEmpty(checkoutComputeObj.packageInfo) ? checkoutComputeObj.packageInfo[0].duration_in_days : '',
            assortment_id: !_.isEmpty(checkoutComputeObj.packageInfo) ? checkoutComputeObj.packageInfo[0].assortment_id : '',
        };

        // coupon info obj for coupon page handling
        responseData.data.coupon_info = checkoutComputeObj.coupon_info;
        responseData.data.currency_symbol = currencySymbol;

        await Promise.all(courseNotifPromise);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    startPayment,
    txnHistory,
    checkoutPage,
};
