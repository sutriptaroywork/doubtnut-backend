const _ = require('lodash');
const moment = require('moment');
// const Razorpay = require('razorpay');
const PayMySQL = require('../../../modules/mysql/payment');
// const PackageRedis = require('../../../modules/redis/package');
const PaymentHelper = require('../../helpers/payment');
// const PaytmHelper = require('../../../modules/paytm/helper.js');
// const PayPalHelper = require('../../../modules/paypal/helper.js');
// const RazorpayHelper = require('../../../modules/razorpay/helper.js');
// const Student = require('../../../modules/mysql/student');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const UtilityEncrypt = require('../../../modules/Utility.encryption');
const Data = require('../../../data/data');
const PaymentConstants = require('../../../data/data.payment');
const Package = require('../../../modules/mysql/package');
const PaymentRedis = require('../../../modules/redis/payment');
const CourseMysql = require('../../../modules/mysql/coursev2');
const NudgeMysql = require('../../../modules/mysql/nudge');
const CourseHelper = require('../../helpers/course');
const CouponContainer = require('../../../modules/containers/coupon');
const UtilityTranslate = require('../../../modules/utility.translation');
const EventsModule = require('../../../modules/events/events');

let db;
let config;

async function txnHistory(req, res, next) {
    db = req.app.get('db');
    // config = req.app.get('config');
    const studentId = req.user.student_id;
    const { page } = req.params;
    console.log('page', page);
    const limit = 20;

    let { country } = req.headers;
    if (!country) {
        country = 'IN';
    }

    try {
        const paymentHistory = await PayMySQL.getTransactionHistoryByStudentId(db.mysql.read, studentId, limit, limit * (page - 1));

        const finalData = [];
        for (let i = 0; i < paymentHistory.length; i++) {
            const finalDatum = {};

            console.log(paymentHistory[i]);
            finalDatum.date = moment(paymentHistory[i].updated_at).utc().format('hh:mm A Do MMMM YYYY');
            // finalDatum.status = paymentHistory[i].status;

            // if (_.isEmpty(paymentHistory[i].partner_order_id)) finalDatum.order_id = paymentHistory[i].order_id;
            // else finalDatum.order_id = paymentHistory[i].partner_order_id;

            finalDatum.amount = country == 'US' ? `$${paymentHistory[i].amount}` : paymentHistory[i].amount;
            // finalDatum.mode = paymentHistory[i].mode;
            finalDatum.payment_for = paymentHistory[i].payment_for;
            finalDatum.name = paymentHistory[i].name;
            finalDatum.order_id = paymentHistory[i].order_id;
            finalDatum.type = paymentHistory[i].type;
            finalDatum.status = paymentHistory[i].status;
            finalDatum.partner_txn_id = paymentHistory[i].partner_txn_id;

            if (finalDatum.payment_for.toLowerCase() === 'doubt' && country == 'IN') {
                finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                finalDatum.name = '';
            }
            if (finalDatum.payment_for.toLowerCase() === 'doubt' && country == 'US') {
                // finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                finalDatum.name = 'Doubtnut VIP';
            }
            if (finalDatum.payment_for.toLowerCase() === 'doubt' && finalDatum.cu) {
                finalDatum.image_url = `${Data.cdnUrl}/images/doubts_gold_pass_03.webp`;
                finalDatum.name = '';
            } else if (finalDatum.payment_for.toLowerCase() == 'wallet') {
                finalDatum.image_url = `${Data.cdnUrl}/images/dn_wallet_icon_1.webp`;
                finalDatum.name = 'DN Wallet';
                finalDatum.type = 'CREDIT';
            }
            console.log(finalDatum.payment_for);

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

async function startPayment(req, res, next) {
    try {
        throw new Error('Update the app');

        /*
        db = req.app.get('db');
        config = req.app.get('config');
        let { country } = req.headers;

        if (!country) {
            country = 'IN';
        }

        const studentId = req.user.student_id;
        const student_info = await Student.getById(studentId, db.mysql.read);
        const userEmail = (!_.isEmpty(student_info[0].student_email) && /\S+@\S+\.\S+/.test(student_info[0].student_email)) ? student_info[0].student_email : `payments+${studentId}@doubtnut.com`;

        const {
            use_wallet, pay_using_wallet, amount, packageId, final_amount, final_amount_with_wallet,
        } = req.body;

        let { wallet_amount } = req.body;
        let { source } = req.body;
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

        let server_wallet_amount_in_paise; let
            wallet_amount_in_paise;
        let amount_via_pg = amount;
        server_wallet_amount_in_paise = 0; wallet_amount_in_paise = 0; const amount_in_paise = parseInt(parseFloat(amount).toFixed(2) * 100);
        if (use_wallet) {
            wallet_amount_in_paise = parseInt(parseFloat(wallet_amount).toFixed(2) * 100);
            // get wallet balance of user
            try {
                const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken: req.headers['x-auth-token'] });
                console.log(walletInfo);
                if (walletInfo.meta.success) {
                    server_wallet_amount_in_paise = parseInt(parseFloat(walletInfo.data.amount).toFixed(2) * 100);
                }
            } catch (e) {
                const responseData = {
                    meta: {
                        code: 500,
                        success: false,
                        message: 'Unable to fetch wallet details',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }

            if (server_wallet_amount_in_paise !== wallet_amount_in_paise) {
                const responseData = {
                    meta: {
                        code: 500,
                        success: false,
                        message: 'Wallet amount mismatch',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }

            if (pay_using_wallet && server_wallet_amount_in_paise >= amount_in_paise) {
                // for full wallet payment
                wallet_amount = amount;
                source = 'WALLET';
                amount_via_pg = 0;
            } else {
                // for partial wallet payment
                wallet_amount = server_wallet_amount_in_paise / 100;
                amount_via_pg = amount - wallet_amount;
            }
        } else {
            // do not use wallet
            wallet_amount = 0;
        }

        /!*
        db.redis.write.multi()
            .set(`subscription_payment_id_${studentId}`, packageId)
            .expire(`subscription_payment_id_${studentId}`, 60 * 60 * 24 * 7)
            .execAsync();
*!/

        if (amount_via_pg > 0 && amount_via_pg < 1) amount_via_pg = 1;

        const insertObj = {};
        insertObj.order_id = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
        insertObj.payment_for = req.body.payment_for;
        insertObj.amount = amount;
        insertObj.student_id = studentId;
        insertObj.status = 'INITIATED';
        insertObj.source = source;
        insertObj.wallet_amount = wallet_amount;
        insertObj.total_amount = req.body.amount;
        if (req.body.coupon_code) {
            insertObj.coupon_code = req.body.coupon_code;
        }
        if (req.body.discount) insertObj.discount = req.body.discount;
        if (req.body.variant_id) insertObj.variant_id = req.body.variant_id;

        const result = await PayMySQL.createPayment(db.mysql.write, insertObj);
        const paymentInfo = await PayMySQL.getPaymentInfoById(db.mysql.write, result.insertId);

        console.log(result);

        let responseInfo = {};

        responseInfo.txn_id = insertObj.order_id;

        if (source == 'PAYPAL' && country == 'US') {
            const accessToken = await PayPalHelper.fetchAccessToken();

            const buyLink = await PayPalHelper.getSubscriptionLink(accessToken, 'P-23452940RW135674TL775NOI', insertObj.order_id, req.user);
            console.log(buyLink);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { url: buyLink },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        if (source == 'WALLET' && use_wallet && server_wallet_amount_in_paise >= amount_in_paise) {
            await PaymentHelper.walletPaymentComplete(db, config, paymentInfo);
            responseInfo.is_wallet_payment = true;
            responseInfo.amount = wallet_amount;
            if (insertObj.variant_id) {
                const course_details = await CourseMysql.getCourseDetailsFromVariantId(db.mysql.read, insertObj.variant_id);
                if (course_details.length) {
                    responseInfo.assortment_type = course_details[0].assortment_type;
                    responseInfo.assortment_id = course_details[0].assortment_id;
                }
            }
        } else if (source === 'RAZORPAY') {
            const rzp = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET,
            });

            const razorpayResponse = await rzp.orders.create({
                amount: amount_via_pg * 100,
                currency: 'INR',
                receipt: insertObj.order_id,
                payment_capture: true,
            });

            responseInfo.txn_id = razorpayResponse.id;

            insertObj.partner_order_id = razorpayResponse.id;
            await PayMySQL.updatePaymentByOrderId(db.mysql.write, insertObj);

            if (req.body.method == 'upi_intent') {
                responseInfo = Data.upiCheckout;
                responseInfo.footer_image_url = `${Data.cdnUrl}/images/upi_logo_collection.webp`;
                responseInfo.order_id = insertObj.order_id;
                responseInfo.upi_intent_link = await RazorpayHelper.createUPILink(insertObj.partner_order_id, userEmail, req.user.mobile, 'Payment', (insertObj.amount - insertObj.wallet_amount) * 100);
                PayMySQL.createPaymentQR(db.mysql.write, { payment_info_id: paymentInfo[0].id });
            }
        } else if (source === 'PAYTM') {
            responseInfo.txnToken = await PaytmHelper.createTransactionToken(insertObj.order_id, studentId, amount_via_pg);
        }

        responseInfo.email = userEmail;
        responseInfo.phone = (!_.isEmpty(student_info[0].mobile)) ? student_info[0].mobile : studentId;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: responseInfo,
        };
        res.status(responseData.meta.code).json(responseData);
        await PackageRedis.deleteActiveEmiPackageAndRemainingDays(db.redis.write, studentId);
        */
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function checkoutPage(req, res, next) {
    db = req.app.get('db');
    // config = req.app.get('config');

    const { variant_id } = req.body;
    const { payment_for } = req.body;
    const { amount } = req.body;
    let { has_upi_app } = req.body;
    const { source } = req.query;
    const { version_code } = req.headers;
    const { student_id } = req.user;
    let payAmount;
    let nudge = [];

    let audioObj = {};
    try {
        const order_info = {};
        let assortment_type = '';
        if (payment_for == 'course_package' || payment_for == 'doubt') {
            const variantDetails = await Package.getVariantById(db.mysql.read, variant_id);
            const packageInfo = await Package.getNewPackageFromVariantId(db.mysql.read, variant_id);

            payAmount = variantDetails[0].display_price;
            if (packageInfo.length > 0) {
                order_info.package_duration = `${parseInt(packageInfo[0].duration_in_days / 30)} Months`;
                order_info.title = packageInfo[0].package_name;
                order_info.variant_id = variant_id;
                order_info.description = '';

                if (payment_for == 'course_package') {
                    const event = 'vip_payment_failure';
                    const { student_class: studentClass } = req.user;

                    if (packageInfo.length) {
                        nudge = await NudgeMysql.getByEventAndResourceId(db.mysql.read, event, studentClass, packageInfo[0].assortment_id);
                    }
                    const nudgeByClass = await NudgeMysql.getByEventAndNoResource(db.mysql.read, event, studentClass);
                    if (!nudge.length) {
                        const assortmentDetails = await CourseMysql.getAssortmentDetailsFromId(db.mysql.read, packageInfo[0].assortment_id, studentClass);
                        if (assortmentDetails.length) {
                            assortment_type = assortmentDetails[0].assortment_type;
                            if (assortmentDetails[0].assortment_type === 'course') {
                                nudge = nudgeByClass;
                            }
                        }
                    }

                    audioObj = { entity_type: 'assortment_id', entity_id: packageInfo[0].assortment_id };
                } else if (payment_for == 'doubt') {
                    audioObj = { entity_type: 'doubt_payment', entity_id: 0 };
                }
            }
        } else if (payment_for == 'wallet') {
            payAmount = amount;
            order_info.package_duration = '';
            order_info.title = `Amount to be added: ₹${amount}`;
            audioObj = { entity_type: 'wallet_payment', entity_id: 0 };
        } else if (payment_for == 'bounty') {
            payAmount = amount;
            order_info.title = 'Pay for Padhao aur Kamao';
            order_info.description = '';
            audioObj = { entity_type: 'bounty_payment', entity_id: 0 };
        }

        let wallet_amount = 0; let wallet_cash_amount = 0; let
            wallet_reward_amount = 0;
        try {
            const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken: req.headers['x-auth-token'] });
            console.log(walletInfo);
            if (walletInfo.meta.success) {
                wallet_amount = +walletInfo.data.amount;
                wallet_cash_amount = +walletInfo.data.cash_amount;
                wallet_reward_amount = +walletInfo.data.reward_amount;
            }
        } catch (e) {
            console.log(e);
        }
        if (payment_for == 'course_package' || payment_for == 'doubt') {
            // get percentage of reward to be used
            // 50% upto 500;
            wallet_reward_amount = Math.min(PaymentConstants.wallet_reward_options.max_amount, PaymentConstants.wallet_reward_options.factor * payAmount, wallet_reward_amount);
        }

        wallet_amount = wallet_cash_amount + wallet_reward_amount;

        let localizedData = PaymentConstants.checkout(req.user.locale);
        const payment_link_localized = PaymentConstants.payment_link_info(req.user.locale);
        const payment_help = PaymentConstants.payment_help(req.user.locale);

        localizedData.assortment_type = assortment_type;

        // Version code was 932 when Pasandeeda Vidhi and UPI ID were released
        if (version_code < 932) {
            const upi_collect_index = _.findIndex(localizedData.payment_info, (o) => o.method == 'upi_collect');
            if (upi_collect_index >= 0) {
                localizedData.payment_info.splice(upi_collect_index, 1);
            }
        }

        if (version_code >= 932) {
            const cod_index = _.findIndex(localizedData.payment_info, (o) => o.method == 'COD');
            localizedData.payment_info[cod_index].description = null;
            // UPI ID vs UPI
            const upi_collect_index = _.findIndex(localizedData.payment_info, (o) => o.method == 'upi_collect');
            const upi_index = _.findIndex(localizedData.payment_info, (o) => o.method == 'upi');
            try {
                // Optimization
                if (version_code >= 939) {
                    if (has_upi_app) {
                        localizedData.payment_info.splice(upi_collect_index, 1);
                    } else {
                        if (localizedData.payment_info[upi_index].is_selected) {
                            localizedData.payment_info[upi_index].is_selected = false;
                            localizedData.payment_info[upi_collect_index].is_selected = true;
                        }
                        localizedData.payment_info.splice(upi_index, 1);
                    }
                } else {
                    const upiAppPackage = JSON.parse(JSON.stringify(PaymentConstants.upi_app_package));
                    const studentId = parseInt(req.user.student_id);
                    const studentAppData = await db.mongo.read.collection('student_app_data').findOne({ student_id: studentId });
                    has_upi_app = 1;
                    if (!(_.isEmpty(studentAppData) || _.isEmpty(studentAppData.app_data) || _.isEmpty(studentAppData.app_data.installedAppList))) {
                        const appList = studentAppData.app_data.installedAppList;
                        has_upi_app = 0;
                        for (let i = 0; i < appList.length; i++) {
                            for (let j = 0; j < upiAppPackage.list.length; j++) {
                                if (appList[i].appPackageName == upiAppPackage.list[j]) {
                                    has_upi_app = 1;
                                    break;
                                }
                            }
                            if (has_upi_app == 1) {
                                break;
                            }
                        }
                    }
                    if (has_upi_app == 1) {
                        localizedData.payment_info.splice(upi_collect_index, 1);
                    } else if (has_upi_app == 0) {
                        if (localizedData.payment_info[upi_index].is_selected) {
                            localizedData.payment_info[upi_index].is_selected = false;
                            localizedData.payment_info[upi_collect_index].is_selected = true;
                        }
                        localizedData.payment_info.splice(upi_index, 1);
                    }
                }
            } catch (e) {
                console.log(e);
            }

            // Checkout according to preferred payment mode
            try {
                await PaymentHelper.sortPaymentByPreferredMode(db, req.user.student_id, req.user.locale, localizedData, payment_link_localized);
                if (localizedData.preferred_payment_methods.length) {
                    localizedData.preferred_payment_methods[0].is_selected = true;
                } else {
                    localizedData.payment_info[0].is_selected = true;
                }
            } catch (e) {
                console.log(e);
            }
        }

        // try {
        //     const cod_index = _.findIndex(localizedData.payment_info, (o) => o.method == 'COD');
        //     const studentId = parseInt(req.user.student_id);
        //     if (studentId % 2 == 0) {
        //         localizedData.payment_info[cod_index].name = `${UtilityTranslate.translate('Pay On Delivery', req.user.locale, PaymentConstants)}`;
        //     }
        // } catch (e) {
        //     console.log(e);
        // }

        // version 873 when BBPS was released on the app
        if (version_code >= 873 && payment_for == 'course_package') {
            const token = {
                x_auth: req.headers['x-auth-token'], student_id: req.user.student_id, variant_id, locale: req.user.locale, payment_for, phone_number: req.user.mobile, order_info, version_code,
            };

            payment_link_localized.bbps.deeplink += UtilityEncrypt.encrypt(JSON.stringify(token));
        } else {
            delete payment_link_localized.bbps;
        }

        // version 891, when payment help was released on the app
        if (version_code >= 891) {
            // const [redisCount, paymentSuccessCount] = await Promise.all([PaymentRedis.getCheckoutPageViewStat(db.redis.read, req.user.student_id), PayMySQL.getPaymentInfoSuccessCountByStudentId(db.mysql.read, req.user.student_id)]);
            const redisCount = await PaymentRedis.getCheckoutPageViewStat(db.redis.read, req.user.student_id);

            if (redisCount <= PaymentConstants.checkout_tooltip_threshold) {
                PaymentRedis.setCheckoutPageViewStat(db.redis.write, req.user.student_id);
            }

            if (redisCount >= PaymentConstants.checkout_tooltip_threshold) {
                delete payment_help.page_title_tooltip;
            }
        }

        const codHelpOption = await PaymentHelper.hasOnlinePaymentFingerprints(db, config, { student_id });
        if (!(payment_for == 'course_package' || payment_for == 'doubt') || codHelpOption) {
            _.remove(payment_help.content.list, (n) => n.type == 'cod');
        }

        localizedData = { ...localizedData, ...{ payment_help } };

        if (version_code >= 906 && !_.isEmpty(audioObj)) await PaymentHelper.fetchCheckoutAudio(db, audioObj, localizedData);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: localizedData,
        };

        responseData.data.order_info = order_info;

        if (payAmount > wallet_amount || payment_for == 'wallet') {
            responseData.data.payment_link = payment_link_localized;
        }

        // nudge event

        if (nudge.length) {
            responseData.data.payment_link.link.nudge_id = nudge[0].count;
            responseData.data.payment_link.link.is_show = source !== 'nudge' && source !== 'notification';
            responseData.data.payment_link.link.count = nudge[0].id;
        }

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
        const { student_id, locale } = req.user;
        const {
            variant_id, amount, payment_for, remove_coupon, switch_assortment, use_wallet_cash, use_wallet_reward,
        } = req.body;

        let { coupon_code } = req.body;
        const { version_code, is_browser: isBrowser, 'x-auth-token': xAuthToken } = req.headers;

        if (coupon_code == 'null') {
            coupon_code = '';
        }

        const checkoutComputeObj = await PaymentHelper.computeCheckoutDetails(db, {
            payment_for, coupon_code, switch_assortment, student_info: req.user, use_wallet_cash, use_wallet_reward, amount, xAuthToken, variant_id, remove_coupon, version_code,
        });

        const payment_details = {

            title: global.t8[locale].t('Payment Details'.toUpperCase(), 'Payment Details'),
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

            view_details_text: global.t8[locale].t('View Details'.toUpperCase(), 'View Details'),
            action_button: global.t8[locale].t('Buy Now'.toUpperCase(), 'Buy Now'),
            coupon_info: checkoutComputeObj.coupon_info,
            wallet_info: checkoutComputeObj.wallet_info,
        };

        if ((payment_for == 'course_package' || payment_for == 'doubt') && checkoutComputeObj.net_amount >= 500 && !(await PaymentHelper.hasOnlinePaymentFingerprints(db, config, { student_id }))) {
            const json_payload = {
                course_name: checkoutComputeObj.packageInfo[0].package_name,
                coupon_code,
                variant_id,
                mobile: req.user.mobile,
                version_code,
                show_activation: 0,
                locale: req.user.locale,
            };
            payment_details.cod = {
                is_show: true,
                deeplink: `doubtnutapp://action_web_view?url=https://${req.headers.host}/static/sr.html%3Finfo=${encodeURI(JSON.stringify(json_payload))}%26token=`,
            };
            payment_details.cod.deeplink += req.headers['x-auth-token'];
        }

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
module.exports = {
    txnHistory,
    startPayment,
    checkoutPage,
    checkoutPaymentDetails,
};
