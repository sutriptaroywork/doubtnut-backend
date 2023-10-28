const axios = require('axios');
const _ = require('lodash');
const moment = require('moment');
const { google } = require('googleapis');
const mysqlCourse = require('../../modules/mysql/course');
const logger = require('../../config/winston').winstonLogger;
const MysqlCourseV2 = require('../../modules/mysql/coursev2');
const Student = require('../../modules/mysql/student');
const StudentContainer = require('../../modules/containers/student');
const Data = require('../../data/data');
const PackageContainer = require('../../modules/containers/package');
const WalletUtil = require('../../modules/wallet/Utility.wallet');
const Package = require('../../modules/mysql/package');
const Flagr = require('../../modules/containers/Utility.flagr');
const BountyPostDetail = require('../../modules/bounytPostDetail');
const PayMySQL = require('../../modules/mysql/payment');
// const Properties = require('../../modules/mysql/property');
const SMS2F = require('../../modules/Utility.SMS');
const Utility = require('../../modules/utility');
const newtonNotifications = require('../../modules/newtonNotifications');
const PayConstant = require('../../modules/constants/paymentPackage');
const PaypalSubscription = require('../../modules/mysql/paypal');
const PayPalHelper = require('../../modules/paypal/helper');
const DataUS = require('../../data/data.us');
const CourseHelper = require('./course');
const TGHelper = require('./target-group');
const CouponContainer = require('../../modules/containers/coupon');

const androidpublisher = google.androidpublisher('v3');
const courseV2Redis = require('../../modules/redis/coursev2');
const courseV2Mysql = require('../../modules/mysql/coursev2');
const CourseContainer = require('../../modules/containers/coursev2');
const StudentRedis = require('../../modules/redis/student');
const CourseMysqlV2 = require('../../modules/mysql/coursev2');
const UtilityTranslate = require('../../modules/utility.translation');
const PaymentConstants = require('../../data/data.payment');
const MailUtility = require('../../modules/Utility.mail');
const ShipRocketHelper = require('../../modules/shiprocket/helper');
const RzpHelper = require('../../modules/razorpay/helper');
const PayuHelper = require('../../modules/payu/helper');
const PayuHash = require('../../modules/payu/hash');
const redisUtility = require('../../modules/redis/utility.redis');
const WhatsappUtility = require('../../modules/whatsapp');
const campaignHelper = require('./campaign');

module.exports = class PaymentHelper {
    static async checkVipUser(db, studentId) {
        try {
            const data = mysqlCourse.checkVip(db.mysql.read, studentId);
            if (!data.length) {
                return false;
            }
            return true;
        } catch (e) {
            console.log(e);
        }
    }

    //
    // async function checkVipUserBasedOnPackage(db, studentId, ecmId, studentClass, courseType) {
    //     const obj = {
    //         isVip: false,
    //         packageId: null,
    //     }
    //     try {
    //         const subscription = await mysqlCourse.checkVipV1(db.mysql.read, studentId);
    //         console.log(subscription);
    //         if (subscription.length) {
    //             for (let i = 0; i < subscription.length; i++) {
    //                 const categoryId = subscription[i].category_id;
    //                 if (subscription[0].course_type === 'all') {
    //                     const packageCategoryIds = await Package.getAllPackagesByCategory(db.mysql.read, categoryId);
    //                     const courseData = packageCategoryIds.filter((e) => e.course_id === courseId)[0];
    //                     if (courseData) {
    //                         obj.isVip = true;
    //                         obj.packageId = subscription[i].student_package_id;
    //                     }
    //                 } else {
    //                     if (subscription[i].course_type === courseType) {
    //                         const courseData = await mysqlCourse.getEcmByPackageId(db.mysql.read, subscription[i].subcategory_id, ecmId, studentClass, subscription[i].course_type);
    //                         if(courseData && courseData.length ) {
    //                             obj.isVip = true;
    //                             obj.packageId = subscription[i].student_package_id;
    //                         }
    //                     }
    //                 }
    //             }
    //         }
    //         return obj;
    //     } catch (e) {
    //         console.log(e);
    //     }
    // }

    static async paidUserChampionshipNotification(courseDetails, studentDetails) {
        const notificationPayload = {
            event: courseDetails[0].parent == 4 ? 'course_category' : 'course_details',
            title: Data.postPurchaseCommunication.paidUserChampionship.notification.title,
            message: 'Padho Aur Jeeto',
            image: Data.postPurchaseCommunication.paidUserChampionship.notification.image_url,
            firebase_eventtag: Data.postPurchaseCommunication.paidUserChampionship.notification.firebaseTag,
            s_n_id: Data.postPurchaseCommunication.paidUserChampionship.notification.firebaseTag,
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
        newtonNotifications.sendNotificationByFCM([{ id: studentDetails[0].student_id, gcmId: studentDetails[0].gcm_reg_id }], notificationPayload);
    }

    static async deletePendingPaymentCarouselData(db, studentID) {
        courseV2Redis.deletepaymentPendingDetails(db.redis.write, studentID);
    }

    static async deletePaidUserLandingDeeplink(db, studentID) {
        StudentRedis.deletePaidUserLandingDeeplink(db.redis.write, studentID);
    }

    static addUserPackageBuyFeedPost(db, studentId) {
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

    static async postPurchaseCommunicationNew(data) {
        const {
            db,
            paymentInfo,
            config,
        } = data;
        if (paymentInfo.length > 0 && !_.isNull(paymentInfo[0].variant_id)) {
            // get assortment id details
            const [courseDetails, studentDetails, paymentSummaryDetails] = await Promise.all([
                MysqlCourseV2.getCourseDetailsFromVariantId(db.mysql.read, paymentInfo[0].variant_id),
                StudentContainer.getById(paymentInfo[0].student_id, db),
                Package.getPaymentSummaryWithTxnId(db.mysql.read, paymentInfo[0].partner_txn_id),
            ]);
            if (courseDetails.length > 0 && (_.includes(['course', 'class'], courseDetails[0].assortment_type))) {
                const notificationPayload = {
                    event: courseDetails[0].parent == 4 ? 'course_category' : 'course_details',
                    title: Data.postPurchaseCommunication.courseStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].title.replace('{1}', courseDetails[0].meta_info === 'HINDI' ? `कक्षा ${courseDetails[0].class}` : `Class ${courseDetails[0].class}`),
                    image: (courseDetails[0] && courseDetails[0].demo_video_thumbnail) ? courseDetails[0].demo_video_thumbnail : '',
                    message: Data.postPurchaseCommunication.courseStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message,
                    firebase_eventtag: Data.postPurchaseCommunication.courseStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                    s_n_id: Data.postPurchaseCommunication.courseStart.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                    // data: JSON.stringify({
                    //     id: courseDetails[0].assortment_id,
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
                Utility.sendFcm(studentDetails[0].student_id, studentDetails[0].gcm_reg_id, notificationPayload);
                if (_.isNull(courseDetails[0].sub_assortment_type)) {
                    this.paidUserChampionshipNotification(courseDetails, studentDetails);
                }
                const timeTableDetails = await CourseMysqlV2.getBanners(db.mysql.read, courseDetails[0].assortment_id, courseDetails[0].batch_id);
                if (timeTableDetails && timeTableDetails.length > 0) {
                    const notificationPayloadWithTimeTable = {
                        event: 'pdf_viewer',
                        title: Data.postPurchaseCommunication.courseStartTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].title.replace('{1}', courseDetails[0].meta_info === 'HINDI' ? `कक्षा ${courseDetails[0].class}` : `Class ${courseDetails[0].class}`),
                        image: (courseDetails[0] && courseDetails[0].demo_video_thumbnail) ? courseDetails[0].demo_video_thumbnail : '',
                        message: Data.postPurchaseCommunication.courseStartTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message,
                        firebase_eventtag: Data.postPurchaseCommunication.courseStartTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                        s_n_id: Data.postPurchaseCommunication.courseStartTimeTable.notification[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].firebaseTag,
                        data: JSON.stringify({
                            pdf_url: timeTableDetails[0].pdf_url,
                        }),
                    };
                    Utility.sendFcm(studentDetails[0].student_id, studentDetails[0].gcm_reg_id, notificationPayloadWithTimeTable);
                    const branchLinkWhatsapp = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_whatsapp', 'COURSE_BUY_TIMETABLE', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${courseDetails[0].assortment_id}&referrer_student_id=`);
                    Utility.sendWhatsAppHSMMedia(config, {
                        mobile: studentDetails[0].mobile,
                        msg_type: 'DOCUMENT',
                        caption: Data.postPurchaseCommunication.courseStartTimeTable.whatsapp[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkWhatsapp.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb'),
                        url: timeTableDetails[0].pdf_url,
                        filename: timeTableDetails[0].pdf_url.substring(timeTableDetails[0].pdf_url.lastIndexOf('/') + 1),
                    });
                    const branchLinkSMS = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_SMS', 'COURSE_BUY_TIMETABLE', `doubtnutapp://course_details?id=${courseDetails[0].assortment_id}&referrer_student_id=`);
                    const branchLinkTimetableSMS = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'timetable_SMS', 'COURSE_BUY_TIMETABLE', timeTableDetails[0].action_data);
                    Utility.sendSMSToReferral(config, {
                        mobile: studentDetails[0].mobile,
                        message: Data.postPurchaseCommunication.courseStartTimeTable.SMS[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkSMS.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb').replace('{4}', branchLinkTimetableSMS.url),
                        locale: courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en',
                    });
                } else {
                    const branchLinkWhatsapp = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_whatsapp', 'COURSE_BUY', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${courseDetails[0].assortment_id}&referrer_student_id=`);
                    Utility.sendWhatsAppHSMMedia(config, {
                        mobile: studentDetails[0].mobile,
                        msg_type: 'IMAGE',
                        caption: Data.postPurchaseCommunication.courseStart.whatsapp[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkWhatsapp.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb'),
                        url: courseDetails[0].demo_video_thumbnail,
                        filename: courseDetails[0].demo_video_thumbnail.substring(courseDetails[0].demo_video_thumbnail.lastIndexOf('/') + 1),
                    });
                    // Utility.sendWhatsAppHSMToReferral(config, { mobile, message: Data.postPurchaseCommunication.trialStart.whatsapp[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkWhatsapp.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb') });
                    const branchLinkSMS = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'course_details_SMS', 'COURSE_BUY', courseDetails[0].parent == 4 ? 'doubtnutapp://course_category?category_id=Kota Classes&referrer_student_id=' : `doubtnutapp://course_details?id=${courseDetails[0].assortment_id}&referrer_student_id=`);
                    Utility.sendSMSToReferral(config, {
                        mobile: studentDetails[0].mobile,
                        message: Data.postPurchaseCommunication.courseStart.SMS[courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en'].message.replace('{1}', courseDetails[0].display_name).replace('{2}', branchLinkSMS.url).replace('{3}', 'https://doubtnut.app.link/8JpTU0rkTeb'),
                        locale: courseDetails[0].meta_info === 'HINDI' ? 'hi' : 'en',
                    });
                }
            }
            // New Whatsapp HSM
            _.orderBy(paymentSummaryDetails, (item) => item.package_validity);
            if (courseDetails.length > 0 && (_.includes(['course', 'class', 'subject', 'course_bundle'], courseDetails[0].assortment_type))) {
                let hsmText = PaymentConstants.post_purchase.whatsapp.hsm_text;
                const studnetFName = studentDetails[0].student_fname ? studentDetails[0].student_fname.trim().split(' ')[0] : 'Student';
                hsmText = hsmText.replace('{{1}}', studnetFName).replace('{{2}}', (paymentInfo[0].amount + paymentInfo[0].wallet_amount).toString()).replace('{{3}}', courseDetails[0].display_name).replace('{{4}}', moment(paymentSummaryDetails[0].package_validity).format('MMMM d, YYYY'));
                const hsmFooter = PaymentConstants.post_purchase.whatsapp.footer_text;
                const hsmActions = PaymentConstants.post_purchase.whatsapp.hsm_actions;
                const hsmData = {
                    sources: {
                        // eslint-disable-next-line no-useless-escape
                        6003009004: hsmText,
                    },
                    attributes: [],
                    payload: {
                        footer: hsmFooter,
                    },
                };
                WhatsappUtility.sendCoursePurchaseTextMsg(studentDetails[0].mobile, studentDetails[0].student_id, hsmText, hsmData, ['6003009004'], hsmActions, hsmFooter);
            }
        }
    }

    // async function postPurchaseCommunication(data) {
    //     const {
    //         db,
    //         paymentInfo,
    //         config,
    //     } = data;
    //     if (paymentInfo.length > 0 && !_.isNull(paymentInfo[0].variant_id)) {
    //         // get assortment id details
    //         const [courseDetails, studentDetails] = await Promise.all([
    //             MysqlCourseV2.getCourseDetailsFromVariantId(db.mysql.read, paymentInfo[0].variant_id),
    //             StudentContainer.getById(paymentInfo[0].student_id, db),
    //         ]);
    //         if (courseDetails.length > 0 && (courseDetails[0].assortment_type === 'course' || courseDetails[0].assortment_type === 'class')) {
    //             const deeplink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'POST_PURCHASE', 'ANKUR', `doubtnutapp://course_details?id=${courseDetails[0].assortment_id}`);
    //             let title = 'Ab aap Doubtnut ke VIP member hain! 😎';
    //             let smsTemplate = 'course_eng';
    //             let whatsappTemplate = 101627;
    //             let whatsappMessage = `Congratulations on buying "${courseDetails[0].display_name}" course from Doubtnut!

    // To study from this course, click on this link and save it for future.
    //             "${deeplink.url}"`;
    //             // send notification
    //             const payload = {
    //                 event: 'course_details',
    //                 title,
    //                 message: 'Apne course ki padhai karne ke liye yahan click karein',
    //                 image: '',
    //                 firebase_eventtag: 'POST_PURCHASE',
    //                 data: JSON.stringify({ id: courseDetails[0].assortment_id }),
    //             };
    //             if (courseDetails[0].meta_info === 'HINDI') {
    //                 whatsappMessage = `Doubtnut पर "${courseDetails[0].display_name}" कोर्स खरीदने पर बधाई हो!

    // अपने कोर्स की पढ़ाई करने के लिए इस लिंक पर क्लिक करें और आगे के लिए कहीं सुरक्षित करके रख लें|
    //                 "${deeplink.url}"`;
    //                 whatsappTemplate = 101628;
    //                 smsTemplate = 'course_hi_new';
    //                 title = 'अब आप Doubtnut के VIP सदस्य हैं! 😎';
    //                 payload.title = title;
    //                 payload.message = 'अपने कोर्स की पढ़ाई करने के लिए यहाँ क्लिक करेें';
    //             }
    //             // send notification
    //             Utility.sendFcm(paymentInfo[0].student_id, studentDetails[0].gcm_reg_id, payload);
    //             // send sms
    //             if (courseDetails[0].meta_info !== 'HINDI') {
    //                 SMS2F.sendSMS(config, smsTemplate, [courseDetails[0].display_name, deeplink.url], studentDetails[0].mobile);
    //             }
    //             // send whats app push
    //             Whatsapp.send(db, studentDetails[0].mobile, whatsappTemplate, studentDetails[0].student_id, [courseDetails[0].display_name, deeplink.url], whatsappMessage, 'POST_PURCHASE');
    //             courseV2Redis.deleteUserActivePackages(db.redis.write, paymentInfo[0].student_id);
    //         }
    //     }
    // }

    static async cancelUnpaidLinksAndQrs(db, config, studentId) {
        try {
            const [unpaidPaymentLinks, unpaidQrs] = await Promise.all([
                PayMySQL.getActivePaymentLinkIdsByStudentId(db.mysql.read, studentId, 'INITIATED'),
                PayMySQL.getActiveQrByStudentId(db.mysql.read, studentId),
            ]);
            console.log('active links and qrs', unpaidPaymentLinks, unpaidQrs);
            const cancelPromises = [];
            for (let i = 0; i < unpaidPaymentLinks.length; i++) {
                try {
                    const linkId = unpaidPaymentLinks[i].link_id;
                    cancelPromises.push(RzpHelper.cancelStandardLink(linkId), PayMySQL.updateRzpPaymentLinkStatus(db.mysql.write, linkId, 'CANCELLED'));
                } catch (e) {
                    console.log(e);
                }
            }
            for (let i = 0; i < unpaidQrs.length; i++) {
                try {
                    const virtualAccountId = unpaidQrs[i].virtual_account_id;
                    cancelPromises.push(RzpHelper.closeVPA(virtualAccountId), PayMySQL.setInactiveQRByVirtualAccountId(db.mysql.write, virtualAccountId));
                } catch (e) {
                    console.log(e);
                }
            }
            await Promise.all(cancelPromises);
        } catch (e) {
            console.log(e);
            MailUtility.sendMailViaSendGrid(
                config,
                PaymentConstants.payments_team.mail_details.autobotMailID,
                PaymentConstants.payments_team.mail_details.paymentsTechTeamMailID,
                'PAYMENTS ERROR | Link & Qr cancellation Error',
                JSON.stringify(e),
                PaymentConstants.payments_team.mail_details.paymentsTechTeamCCID,
            );
        }
    }

    static async doSuccessPaymentProcedure(db, config, payment_info, notes) {
        const redislockKeyName = `PRE_PAYMENT_COMPLETE_ENTRIES_${payment_info[0].partner_txn_id}`;
        if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, redislockKeyName)) {
            return {};
        }
        await redisUtility.setCacheHerdingKeyWithTtll(db.redis.write, redislockKeyName, 5);
        try {
            const [studentDetails, walletInfo] = await Promise.all([
                // Student.getById(payment_info[0].student_id, db.mysql.read),
                StudentContainer.getById(payment_info[0].student_id, db),
                PayMySQL.getWalletTransactionByPaymentInfoId(db.mysql.write, payment_info[0].id),
            ]);
            console.log('studentDetails', studentDetails, walletInfo);
            this.addUserPackageBuyFeedPost(db, payment_info[0].student_id);
            const version = studentDetails[0].is_online;
            console.log(payment_info);
            // delete pending payment data
            this.deletePendingPaymentCarouselData(db, payment_info[0].student_id);
            this.deletePaidUserLandingDeeplink(db, payment_info[0].student_id);
            if (payment_info[0].payment_for.toLowerCase() == 'wallet' && walletInfo.length === 0) {
                try {
                    await WalletUtil.makeWalletTransaction({
                        student_id: payment_info[0].student_id,
                        cash_amount: payment_info[0].amount,
                        type: 'CREDIT',
                        payment_info_id: payment_info[0].id,
                        reason: 'add_wallet_payment',
                        expiry: null,
                    });

                    // const studentInfo = await Student.getById(payment_info[0].student_id, db.mysql.read);
                    const studentInfo = await StudentContainer.getById(payment_info[0].student_id, db);

                    try {
                        SMS2F.sendSMS(config, 'wallet_add_success', [payment_info[0].amount, studentInfo[0].mobile], studentInfo[0].mobile);
                        const notificationToSend = JSON.parse(JSON.stringify(PayConstant.walletConstants.notification_payment_success));
                        notificationToSend.title = notificationToSend.title.replace('<amount>', payment_info[0].amount);
                        newtonNotifications.sendNotification(payment_info[0].student_id, notificationToSend, db.mysql.read);
                    } catch (e) {
                        logger.error('Payments Error: Wallet Add Money Notification error', e);
                    }
                } catch (e) {
                    logger.error('Payments Error: Wallet credit error', e);
                }
                return;
            }

            if (payment_info[0].wallet_amount > 0 && payment_info[0].payment_for.toLowerCase() != 'wallet' && walletInfo.length === 0) {
                const debitObj = {
                    student_id: payment_info[0].student_id,
                    type: 'DEBIT',
                    payment_info_id: payment_info[0].id,
                    reason: `debit_${payment_info[0].payment_for}`,
                    expiry: null,
                };

                if (payment_info[0].source.toLowerCase() == 'bbps') {
                    // for BBPS, when amount is added, we need to debit both - the wallet_amount and the amount
                    debitObj.amount = payment_info[0].wallet_amount + payment_info[0].amount;

                    try {
                        const walletDebitStatus = await WalletUtil.makeWalletTransaction(debitObj);
                        console.log(walletDebitStatus);
                    } catch (e) {
                        logger.error('Payments Error: Wallet Debit error bbps', e);
                    }
                } else {
                    let walletSplitAvailable = false;
                    const walletSplitConfig = await PayMySQL.getPaymentInfoMeta(db.mysql.write, { payment_info_id: payment_info[0].id });
                    if (walletSplitConfig.length) { // payment with wallet configuration exist
                        for (let i = 0; i < walletSplitConfig.length; i++) {
                            if (!walletSplitAvailable && (walletSplitConfig[i].wallet_cash_amount != 0 || walletSplitConfig[i].wallet_reward_amount != 0)) {
                                try {
                                    debitObj.cash_amount = walletSplitConfig[0].wallet_cash_amount;
                                    debitObj.reward_amount = walletSplitConfig[0].wallet_reward_amount;
                                    // eslint-disable-next-line no-await-in-loop
                                    const walletDebitStatus = await WalletUtil.makeWalletTransaction(debitObj);
                                    walletSplitAvailable = true;
                                    console.log(walletDebitStatus);
                                    break;
                                } catch (e) {
                                    logger.error('Payment Error: Wallet Debit Error', e);
                                }
                            }
                        }
                    }
                    if (!walletSplitAvailable) {
                        // do usual debit from amount giving priority to cash then reward
                        try {
                            debitObj.amount = payment_info[0].wallet_amount;
                            const walletDebitStatus = await WalletUtil.makeWalletTransaction(debitObj);
                            console.log(walletDebitStatus);
                        } catch (e) {
                            logger.error('Payment Error: Wallet Debit Error', e);
                        }
                    }
                }
            }

            let walletTransactionDetails = [];
            if (walletInfo.length === 0) {
                walletTransactionDetails = await PayMySQL.getWalletTransactionByPaymentInfoId(db.mysql.write, payment_info[0].id);
                if (payment_info[0].wallet_amount > 0 && walletTransactionDetails.length == 0) {
                    throw new Error('Wallet Debit Entry Not Found');
                }
            } else {
                walletTransactionDetails = walletInfo;
            }
            if (payment_info[0].variant_id == null) {
                if (payment_info[0].payment_for == 'bounty') {
                    await BountyPostDetail.updateBountyPost(db.mysql.write, {
                        bounty_id: payment_info[0].payment_for_id,
                        student_id: payment_info[0].student_id,
                        is_active: 1,
                    });
                } else if (payment_info[0].payment_for == 'livepost') {
                    await db.mongo.write.collection('tesla_payments').save({
                        post_id: payment_info[0].payment_for_id,
                        student_id: payment_info[0].student_id,
                        is_paid: true,
                    });
                } else {
                    // const packageId = await db.redis.read.getAsync(`subscription_payment_id_${payment_info[0].student_id}`);
                    const packageId = payment_info[0].payment_for_id;
                    const packageDetail = await Package.getPackageById(db.mysql.write, packageId);
                    let flagID;
                    let category;
                    if (packageDetail[0].reference_type === 'v3' || version >= 754) {
                        category = await Package.getPackageCategory(db.mysql.write, packageDetail[0].subcategory_id);
                        flagID = category.length && category[0].category_id ? Data.categoryIDFlagrMap[category[0].category_id] : Data.categoryIDFlagrMap[1];
                    } else {
                        flagID = (payment_info[0].payment_for == 'liveclass') ? Data.categoryIDFlagrMap[category[0].category_id] : config.package_subscription_flagr_id;
                        if (packageDetail[0].type === 'emi') flagID = (payment_info[0].payment_for == 'liveclass') ? Data.categoryIDFlagrMap[category[0].categoryId] : config.package_subscription_emi_flagr_id;
                    }
                    const flagrResponse = await Flagr.evaluate(db, payment_info[0].student_id.toString(), {}, flagID, 2000);

                    const summary = {
                        packageId,
                        packageDetail,
                        payment_info,
                        category,
                        notes,
                    };
                    try {
                        if (packageDetail[0].type === 'emi') {
                            await PackageContainer.createSubscriptionEntryForStudentIdByPackageIdAndAmountV1(db, payment_info[0].student_id, packageId, payment_info[0].amount, config, flagrResponse, payment_info[0].payment_for, packageDetail, summary, payment_info[0].id);
                        } else {
                            await PackageContainer.createSubscriptionEntryForStudentIdByPackageIdAndAmount(db, payment_info[0].student_id, packageId, payment_info[0].amount, config, flagrResponse, payment_info[0].payment_for, summary, payment_info[0].id);
                        }
                    } catch (e) {
                        logger.error('Payment Error: Create Subscription Error, Variant Id is null', e);
                        MailUtility.sendMailViaSendGrid(
                            config,
                            PaymentConstants.payments_team.mail_details.autobotMailID,
                            PaymentConstants.payments_team.mail_details.paymentsTechTeamMailID,
                            'PAYMENTS ERROR | Create Subscription Error, Variant Id is null',
                            JSON.stringify(e),
                            PaymentConstants.payments_team.mail_details.paymentsTechTeamCCID,
                        );
                    }
                }
            } else {
                try {
                    await PackageContainer.createSubscriptionEntryForStudentIdByVariantIdIdAndAmount(db, config, payment_info, notes, walletTransactionDetails);
                    this.postPurchaseCommunicationNew({ db, config, paymentInfo: payment_info });
                    courseV2Redis.deleteUserActivePackages(db.redis.write, payment_info[0].student_id);
                    campaignHelper.deleteCourseRefreeNotification(db, payment_info[0].student_id);
                } catch (e) {
                    logger.error('Payment Error: Create Subscription Error', e);
                    MailUtility.sendMailViaSendGrid(
                        config,
                        PaymentConstants.payments_team.mail_details.autobotMailID,
                        PaymentConstants.payments_team.mail_details.paymentsTechTeamMailID,
                        'PAYMENTS ERROR | Create Subscription Error',
                        JSON.stringify(e),
                        PaymentConstants.payments_team.mail_details.paymentsTechTeamCCID,
                    );
                }
            }
            PayMySQL.updateBBPSByStudent(db.mysql.write, { student_id: payment_info[0].student_id, status: 'INACTIVE' });
            this.cancelUnpaidLinksAndQrs(db, config, payment_info[0].student_id);

            // To create invoice for course_packge and vip_offline purchases
            try {
                if (payment_info[0].payment_for.toLowerCase() == 'course_package' || payment_info[0].payment_for.toLowerCase() == 'vip_offline') {
                    const headers = { 'Content-Type': 'application/json' };
                    const data = { paymentId: payment_info[0].id };
                    axios({
                        method: 'POST',
                        url: `${config.microUrl}/invoice/create`,
                        headers,
                        data,
                    });
                }
            } catch (e) {
                logger.error('Payments Error: Do Success', e);
            }
        } catch (e) {
            logger.error('Payments Error: Do Success', e);
        } finally {
            await redisUtility.removeCacheHerdingKeyNew(db.redis.write, redislockKeyName);
        }
    }

    static async walletPaymentComplete(db, config, payment_info) {
        payment_info[0].status = 'SUCCESS';
        payment_info[0].partner_txn_id = payment_info[0].order_id;
        payment_info[0].partner_txn_time = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        await PayMySQL.updatePaymentByOrderId(db.mysql.write, payment_info[0]);
        await this.doSuccessPaymentProcedure(db, config, payment_info, {});
        return true;
    }

    static async walletRefund(db, config, payment_info) {
        try {
            const walletObj = {
                student_id: payment_info.student_id,
                type: 'CREDIT',
                payment_info_id: payment_info.id,
                reason: 'credit_refund',
                expiry: null,
            };

            const walletSplitConfig = await PayMySQL.getPaymentInfoMeta(db.mysql.read, { payment_info_id: payment_info.id });

            if (walletSplitConfig.length && (walletSplitConfig[0].wallet_cash_amount != 0 || walletSplitConfig[0].wallet_reward_amount != 0)) {
                walletObj.cash_amount = walletSplitConfig[0].wallet_cash_amount;
                walletObj.reward_amount = walletSplitConfig[0].wallet_reward_amount;
            } else {
                walletObj.amount = payment_info.wallet_amount;
            }
            const walletRefundStatus = await WalletUtil.makeWalletTransaction(walletObj);

            return walletRefundStatus;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async couponValidate(db, coupon_code, student_id, version_code, packageDetails, studentClass, locale) {
        const promise = [];
        // start and end date check, min and max version code check
        promise.push(Package.getCouponDetailsUsingCouponCode(db.mysql.read, coupon_code, version_code));
        promise.push(Package.getCouponTg(db.mysql.read, coupon_code));
        // coupon package applicability check
        promise.push(Package.getCouponPackageByCouponAndPackageID(db.mysql.read, coupon_code, packageDetails[0].package_id));
        promise.push(Package.getCouponPackages(db.mysql.read, coupon_code));
        // eslint-disable-next-line no-unused-vars
        const [couponDetails, couponTg, couponPackageId, couponPackages] = await Promise.all(promise);
        if ((couponDetails.length > 0 && couponPackageId.length == 0 && couponPackages.length == 0) || (couponDetails.length > 0 && couponPackageId.length > 0 && couponPackages.length > 0)) {
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
                                    db, studentId: student_id, tgID: couponTg[j].value, studentClass, locale,
                                });
                            } else if (couponTg[j].type == 'assortment-type') {
                                // eslint-disable-next-line no-await-in-loop
                                const assortmentDetails = await courseV2Mysql.getAssortmentDetailsFromId(db.mysql.read, [packageDetails[0].assortment_id], studentClass);
                                if (assortmentDetails.length && assortmentDetails[0].assortment_type == couponTg[j].value) {
                                    tgCheck = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (tgCheck) {
                        const { final_amount } = packageDetails[0];
                        let discountAmount = 0;
                        if (couponDetails[0].value_type == 'amount') {
                            // eslint-disable-next-line operator-assignment
                            packageDetails[0].final_amount = packageDetails[0].final_amount - couponDetails[0].value;
                            discountAmount = couponDetails[0].value;
                        } else if (couponDetails[0].value_type == 'percent' && !['cashback'].includes(couponDetails[0].type)) {
                            discountAmount = Math.round((couponDetails[0].value * packageDetails[0].final_amount) / 100);
                            if (!_.isNull(couponDetails[0].max_limit) && discountAmount > couponDetails[0].max_limit) {
                                discountAmount = couponDetails[0].max_limit;
                            }
                            // eslint-disable-next-line operator-assignment
                            packageDetails[0].final_amount = packageDetails[0].final_amount - discountAmount;
                        } else if (couponDetails[0].value_type == 'flat') {
                            if (packageDetails[0].final_amount > couponDetails[0].value) {
                                discountAmount = packageDetails[0].final_amount - couponDetails[0].value;
                                packageDetails[0].final_amount = couponDetails[0].value;
                            } else {
                                return 0;
                            }
                        }
                        if (!_.isNull(packageDetails[0].min_limit) && packageDetails[0].final_amount < packageDetails[0].min_limit && couponDetails[0].value_type !== 'flat') {
                            discountAmount = final_amount - packageDetails[0].min_limit;
                            packageDetails[0].final_amount = packageDetails[0].min_limit;
                        }
                        return packageDetails[0].final_amount;
                    }
                }
            }
        }
        return 0;
    }

    /* eslint-disable no-await-in-loop */

    static async cancelPaypalSubscription(db, student_id, to_active_subscription, reason) {
        const toCancelSubscription = await PaypalSubscription.getActiveSubscriptionByStudentId(db.mysql.read, student_id);

        try {
            for (let i = 0; i < toCancelSubscription.length; i++) {
                console.log('toCancelSubscription', toCancelSubscription[i].subscription_id, to_active_subscription);
                if (toCancelSubscription[i].subscription_id == to_active_subscription) continue;
                await PayPalHelper.cancelSubscription(toCancelSubscription[i].subscription_id, reason);
                await PaypalSubscription.cancelSubscriptionByStudentAndSubscriptionId(db.mysql.write, student_id, toCancelSubscription[i].subscription_id);
            }
        } catch (e) {
            console.log('unable to cancel subscription', e);
        }
    }

    static assortmentIsSachetOrEmpty(assortmentDetails) {
        if (assortmentDetails.length === 0) {
            return true;
        }

        if (assortmentDetails[0].assortment_type
            && _.includes(['resource_video', 'resource_pdf', 'resource_test'], assortmentDetails[0].assortment_type)) {
            return true;
        }
        return false;
    }

    static async insertBuyNowDataInCRM(db, kinesisClient, studentID, config, packageObject, assortmentDetails) {
        try {
            if (this.assortmentIsSachetOrEmpty(assortmentDetails)) {
                return;
            }

            kinesisClient.putRecord({
                StreamName: `bnb-leads-${process.env.NODE_ENV}`,
                Data: Buffer.from(JSON.stringify({ studentID, packageObject, assortmentDetails })),
                PartitionKey: process.pid.toString(),
            }, (err, data) => {
                console.log(err, data);
            });
        } catch (e) {
            console.log('bnb-leads-production-failed', e);
        }
    }

    static async inAppBillingAck(config, token, subscriptionId) {
        const serviceAccount = {
            project_id: config.firebase.project_id,
            private_key: config.firebase.private_key,
            client_email: config.firebase.client_email,
        };
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccount,
            // Scopes can be specified either as an array or as a single, space-delimited string.
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });

        // Acquire an auth client, and bind it to all future calls
        const authClient = await auth.getClient();
        google.options({ auth: authClient });
        const ackResponse = await androidpublisher.purchases.subscriptions.acknowledge({
            // The package name of the application for which this subscription was purchased (for example, 'com.some.thing').
            packageName: DataUS.packageName,
            // The purchased subscription ID (for example, 'monthly001').
            subscriptionId,
            // The token provided to the user's device when the subscription was purchased.
            token,

        });

        console.log('ackResponse', ackResponse);
    }

    static async inAppBillingPaymentStatus(config, token, subscriptionId) {
        const serviceAccount = {
            project_id: config.firebase.project_id,
            private_key: config.firebase.private_key,
            client_email: config.firebase.client_email,
        };
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccount,
            // Scopes can be specified either as an array or as a single, space-delimited string.
            scopes: ['https://www.googleapis.com/auth/androidpublisher'],
        });

        // Acquire an auth client, and bind it to all future calls
        const authClient = await auth.getClient();
        google.options({ auth: authClient });
        const paymentStatus = await androidpublisher.purchases.subscriptions.get({
            // The package name of the application for which this subscription was purchased (for example, 'com.some.thing').
            packageName: DataUS.packageName,
            // The purchased subscription ID (for example, 'monthly001').
            subscriptionId,
            // The token provided to the user's device when the subscription was purchased.
            token,

        });

        console.log(paymentStatus.data);
        return paymentStatus.data;
    }

    static async continueWithCourseCarouselHandler(db, packageInfo, couponCode, studentID, variantID, versionCode) {
        const courseDetails = await CourseContainer.getCourseDetailsFromVariantId(db, variantID);
        if (courseDetails && courseDetails.length > 0 && courseDetails[0].assortment_type === 'course') {
            const courseData = {
                variantId: packageInfo[0].id,
                packageId: packageInfo[0].package_id,
                assortmentId: packageInfo[0].assortment_id,
                price: packageInfo[0].final_amount,
                crossed_price: packageInfo[0].original_amount,
                subtitle: courseDetails[0].display_name,
                couponCode: (couponCode) || null,
                image_url: courseDetails[0].display_image_rectangle,
                title: 'Course kharidne mein ho rhi dikkat ?',
            };
            // courseV2Redis.setpaymentPendingDetails(db.redis.write, studentID, courseData);
            if (versionCode > 912) {
                courseV2Redis.setCallingCardWidgetData(db.redis.write, studentID, courseData);
            }
        }
    }

    static async fetchCheckoutAudio(db, audioObj, localizedData) {
        const audio_info = await PayMySQL.getCheckoutAudio(db.mysql.read, audioObj);
        if (audio_info.length) {
            localizedData.checkout_audio = {
                title: audio_info[0].meta_text || '',
                audio_url: audio_info[0].url,
            };
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async hasOnlinePaymentFingerprints(db, config, obj) {
        // const [isOnlineUser, isInternal, isCodEligible] = await Promise.all([
        //     PayMySQL.getPaymentInfoOnlinePaymentStudentId(db.mysql.read, obj),
        //     CourseMysqlV2.getInternalSubscriptions(db.mysql.read, obj.student_id),
        //     Properties.checkEntryInBucketByNameAndValue(db.mysql.read, 'student_cod_eligible', obj.student_id, '0'),
        // ]);

        // if (isInternal.length) return false;
        // if (isOnlineUser.length) return true;
        return false;
    }

    // Preferred Payment Method
    // obj1 = localizedData;
    // obj2 = payment_link_localized;
    static async sortPaymentByPreferredMode(db, student_id, locale, obj1, obj2) {
        const userPaymentMethod = await PayMySQL.getPaymentModeByStudentId(db.mysql.read, student_id);
        if (userPaymentMethod.length) {
            obj1.payment_info[0].is_selected = false;
            obj1.preferred_payment_hidden = false;
            obj1.payment_method_collapsed = false;
            obj2.payment_link_collapsed = true;
            // Check if the 2 modes are same => Remove duplicates
            if (userPaymentMethod.length == 2 && userPaymentMethod[0].mode == userPaymentMethod[1].mode) {
                if (userPaymentMethod[0].mode == 'upi') {
                    userPaymentMethod.splice(1, 1);
                } else if (userPaymentMethod[0].method == userPaymentMethod[1].method) {
                    userPaymentMethod.splice(1, 1);
                }
            }
            // Main implementation: Find required index => Clone the element => add the clone to new array
            for (let i = userPaymentMethod.length - 1; i >= 0; i--) {
                const idx = _.findIndex(obj1.payment_info, (o) => (o.method == userPaymentMethod[i].mode) || (o.type && o.type == userPaymentMethod[i].method) || (o.method == 'upi_collect' && userPaymentMethod[i].mode == 'upi'));
                if (idx >= 0) {
                    const temp = obj1.payment_info[idx];

                    if (temp.method == 'COD') {
                        continue;
                    } else if (temp.method == 'wallet') {
                        if (!userPaymentMethod[i].method) {
                            continue;
                        }
                        const inner_idx = _.findIndex(temp.preferred_methods, (o) => o.code == userPaymentMethod[i].method);
                        const inner_temp = { ...temp.preferred_methods[inner_idx] };
                        inner_temp.name = `${inner_temp.name} ${global.t8[locale].t('Wallet'.toUpperCase(), 'Wallet')}`;
                        inner_temp.type = temp.preferred_methods[inner_idx].code;
                        obj1.preferred_payment_methods.splice(0, 0, inner_temp);
                    } else if (temp.method == 'netbanking') {
                        if (!userPaymentMethod[i].method) {
                            continue;
                        }
                        let inner_idx = _.findIndex(temp.preferred_methods, (o) => o.code == userPaymentMethod[i].method);
                        if (inner_idx === -1) {
                            inner_idx = _.findIndex(temp.more_banks_data.list, (o) => o.code == userPaymentMethod[i].method);
                            const inner_temp = { ...temp.more_banks_data.list[inner_idx] };
                            inner_temp.name = `${inner_temp.name} ${global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking')}`;
                            inner_temp.method = 'netbanking_selected_bank';
                            inner_temp.bank_code = inner_temp.code;
                            obj1.preferred_payment_methods.splice(0, 0, inner_temp);
                        } else {
                            const inner_temp = { ...temp.preferred_methods[inner_idx] };
                            inner_temp.name = `${inner_temp.name} ${global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking')}`;
                            inner_temp.method = 'netbanking_selected_bank';
                            inner_temp.bank_code = inner_temp.code;
                            obj1.preferred_payment_methods.splice(0, 0, inner_temp);
                        }
                    } else {
                        // obj1.payment_info.splice(idx,1);
                        const inner_temp = { ...temp };
                        obj1.preferred_payment_methods.splice(0, 0, inner_temp);
                    }
                }
            }
        }
    }

    // Preferred Payment Method for V3 Checkout
    static async sortPaymentByPreferredModeV2(obj) {
        const {
            db, studentId, locale, onlineMethodsCheckoutWidget, offlineMethodsCheckoutWidget, checkoutComputeObj, autoProceedTime, dnWalletPayment, responseData, currency_symbol,
        } = obj;
        const userPaymentMethod = await PayMySQL.getPaymentModeByStudentId(db.mysql.read, studentId);
        if (userPaymentMethod.length) {
            const pasandeedaVidhiWidget = {
                data: {
                    title: global.t8[locale].t('Pasandeeda Vidhi'.toUpperCase(), 'Pasandeeda Vidhi'),
                    items: [],
                },
                type: 'widget_parent_checkout',
            };
            // Mark the selected item as false because now we will select this as default in the checkout
            onlineMethodsCheckoutWidget.data.items[0].data.is_selected = false;

            // Check if the 2 modes are same => Remove duplicates
            if (userPaymentMethod.length == 2 && userPaymentMethod[0].mode == userPaymentMethod[1].mode) {
                if (userPaymentMethod[0].mode == 'upi') {
                    userPaymentMethod.splice(1, 1);
                } else if (userPaymentMethod[0].method == userPaymentMethod[1].method) {
                    userPaymentMethod.splice(1, 1);
                }
            }

            console.log(userPaymentMethod);
            // Main implementation: Find required index => Clone the element => add the clone to new array
            for (let i = userPaymentMethod.length - 1; i >= 0; i--) {
                const widgetItem = {
                    data: {
                        method: '',
                        title: '',
                        subtitle: '',
                        button_text: `${global.t8[locale].t('Pay'.toUpperCase(), 'Pay')} ${currency_symbol}${global.t8[locale].t('price', { val: checkoutComputeObj.net_amount })}`,
                        auto_apply_timer: autoProceedTime.toString(),
                        hyper_text: '',
                        image_url: '',
                        image_ratio: '',
                        has_deeplink: false,
                        is_selected: false,
                        is_disabled: dnWalletPayment,
                    },
                    type: 'widget_checkout_payment_method',
                };
                let offlineIdx = false;
                let idx = _.findIndex(onlineMethodsCheckoutWidget.data.items, (o) => ((o.data.method == userPaymentMethod[i].method) || (o.data.method == userPaymentMethod[i].mode) || (o.data.method == 'upi_collect' && userPaymentMethod[i].mode == 'upi')));
                if (idx === -1) {
                    offlineIdx = true;
                    idx = _.findIndex(offlineMethodsCheckoutWidget.data.items, (o) => (o.method == userPaymentMethod[i].mode));
                }
                if (idx >= 0) {
                    const temp = offlineIdx ? offlineMethodsCheckoutWidget.data.items[idx] : onlineMethodsCheckoutWidget.data.items[idx];
                    console.log('temp', temp);
                    if (temp.data.method == 'COD') {
                        const innerTemp = { ...temp };
                        pasandeedaVidhiWidget.data.items.splice(0, 0, innerTemp);
                        offlineMethodsCheckoutWidget.data.items.splice(idx, 1);
                    } else if (temp.data.method == 'wallet') {
                        if (!userPaymentMethod[i].method) {
                            continue;
                        }
                        const inner_idx = _.findIndex(temp.data.dialog_data.items, (o) => o.code == userPaymentMethod[i].method);
                        widgetItem.data.method = 'wallet';
                        if (inner_idx === -1) {
                            continue;
                        }
                        widgetItem.data.title = `${temp.data.dialog_data.items[inner_idx].name} ${global.t8[locale].t('Wallet'.toUpperCase(), 'Wallet')}`;
                        widgetItem.data.code = temp.data.dialog_data.items[inner_idx].code;
                        widgetItem.data.image_url = temp.data.dialog_data.items[inner_idx].image_url;
                        widgetItem.data.image_ratio = temp.data.dialog_data.items[inner_idx].image_ratio;
                        widgetItem.data.hyper_text = temp.data.dialog_data.items[inner_idx].hyper_text || '';
                        pasandeedaVidhiWidget.data.items.splice(0, 0, widgetItem);
                        onlineMethodsCheckoutWidget.data.items[idx].data.dialog_data.items.splice(inner_idx, 1);
                    } else if (temp.data.method == 'netbanking') {
                        if (!userPaymentMethod[i].method) {
                            continue;
                        }
                        let inner_idx = _.findIndex(temp.data.dialog_data.netbanking_data.items, (o) => o.code == userPaymentMethod[i].method);
                        if (inner_idx === -1) {
                            inner_idx = _.findIndex(temp.data.dialog_data.netbanking_data.more_banks_data.items, (o) => o.code == userPaymentMethod[i].method);
                            if (inner_idx === -1) {
                                continue;
                            }
                            widgetItem.data.method = 'netbanking_selected_bank';
                            widgetItem.data.title = `${temp.data.dialog_data.netbanking_data.more_banks_data.items[inner_idx].name} ${global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking')}`;
                            widgetItem.data.code = temp.data.dialog_data.netbanking_data.more_banks_data.items[inner_idx].code;
                            widgetItem.data.image_url = temp.data.dialog_data.netbanking_data.more_banks_data.items[inner_idx].image_url || '';
                            widgetItem.data.image_ratio = temp.data.dialog_data.netbanking_data.more_banks_data.items[inner_idx].image_ratio || '1:1';
                            widgetItem.data.hyper_text = temp.data.dialog_data.netbanking_data.more_banks_data.items[inner_idx].hyper_text || '';
                            onlineMethodsCheckoutWidget.data.items[idx].data.dialog_data.netbanking_data.more_banks_data.items.splice(inner_idx, 1);
                        } else {
                            widgetItem.data.method = 'netbanking_selected_bank';
                            widgetItem.data.title = `${temp.data.dialog_data.netbanking_data.items[inner_idx].name} ${global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking')}`;
                            widgetItem.data.code = temp.data.dialog_data.netbanking_data.items[inner_idx].code;
                            widgetItem.data.image_url = temp.data.dialog_data.netbanking_data.items[inner_idx].image_url;
                            widgetItem.data.image_ratio = temp.data.dialog_data.netbanking_data.items[inner_idx].image_ratio;
                            widgetItem.data.hyper_text = temp.data.dialog_data.netbanking_data.items[inner_idx].hyper_text || '';
                            onlineMethodsCheckoutWidget.data.items[idx].data.dialog_data.netbanking_data.items.splice(inner_idx, 1);
                        }
                        console.log(widgetItem);
                        pasandeedaVidhiWidget.data.items.splice(0, 0, widgetItem);
                    } else if (!offlineIdx) {
                        const innerTemp = { ...temp };
                        pasandeedaVidhiWidget.data.items.splice(0, 0, innerTemp);
                        onlineMethodsCheckoutWidget.data.items.splice(idx, 1);
                    }
                }
            }

            if (pasandeedaVidhiWidget.data.items.length) {
                pasandeedaVidhiWidget.data.items[0].data.is_selected = !dnWalletPayment;
                responseData.data.widgets.push(pasandeedaVidhiWidget);
                onlineMethodsCheckoutWidget.data.hide_widget = true;
                offlineMethodsCheckoutWidget.data.hide_widget = true;
            } else {
                onlineMethodsCheckoutWidget.data.items[0].data.is_selected = !dnWalletPayment;
            }
        }
    }

    static async cancelCODOrderWithPISId(db, pisID) {
        const shiprocketInfo = await PayMySQL.getShiprocketPaymentInfoByID(db.mysql.read, pisID);

        const srOrderCancelResponse = await ShipRocketHelper.cancelOrder(shiprocketInfo[0].shiprocket_order_id);
        console.log(srOrderCancelResponse);

        const shiprocketObj = {
            order_status: 'CANCELLED',
            is_active: 0,
        };

        await PayMySQL.updatePaymentInfoShiprocket(db.mysql.write, shiprocketObj, pisID);

        await Package.markSubscriptionInactive(db.mysql.write, shiprocketInfo[0].sps_id);

        const piObj = {
            status: 'FAILURE',
        };

        await PayMySQL.updatePaymentById(db.mysql.write, piObj, shiprocketInfo[0].payment_info_id);
        // const studentMetaEntry = await Properties.getValueByBucketAndName(db.mysql.read, 'student_cod_eligible', shiprocketInfo[0].student_id);

        // if (studentMetaEntry.length) {
        //     await Properties.updateValueByBucketAndName(db.mysql.write, 'student_cod_eligible', shiprocketInfo[0].student_id, '0');
        // } else {
        //     const studentMetaObj = {
        //         bucket: 'student_cod_eligible',
        //         name: shiprocketInfo[0].student_id,
        //         value: 0,
        //         is_active: 1,
        //     };
        //     await Properties.createDnPropertyEntry(db.mysql.write, studentMetaObj);
        // }
    }

    static async makeWalletCashTransfer(senderStudentId, receiverStudentId, amount, db) {
        // Check Sender wallet cash amount
        const senderWalletSummary = await PayMySQL.getWalletBalance(db.mysql.read, senderStudentId);

        if (senderWalletSummary[0].cash_amount >= amount) {
            // Wallet Transaction for sender
            const debitEntry = await WalletUtil.makeWalletTransaction({
                student_id: senderStudentId,
                cash_amount: amount,
                type: 'DEBIT',
                reason: 'wallet_transfer',
                payment_info_id: 'dedsorupiyadega',
                expiry: null,
            });

            if (debitEntry) {
                // Wallet Transaction For receiver
                const creditEntry = await WalletUtil.makeWalletTransaction({
                    student_id: receiverStudentId,
                    cash_amount: amount,
                    type: 'CREDIT',
                    reason: 'wallet_transfer',
                    reason_ref_id: senderStudentId,
                    payment_info_id: 'dedsorupiyadega',
                    expiry: null,
                });
                if (creditEntry) {
                    return {
                        status: 'SUCCESS',
                        credit_entry: creditEntry,
                        debit_entry: debitEntry,
                    };
                }

                // Wallet Credit to sender
                const senderCreditEntry = await WalletUtil.makeWalletTransaction({
                    student_id: senderStudentId,
                    cash_amount: amount,
                    type: 'CREDIT',
                    reason: 'wallet_transfer_refund',
                    reason_ref_id: debitEntry,
                    payment_info_id: 'dedsorupiyadega',
                    expiry: null,
                });
                if (senderCreditEntry) {
                    return {
                        status: 'FAILURE',
                        message: 'Something Went Wrong, Contact Tech Team',
                        reason: 'Not able to add money in Student\'s wallet, refunded back to Sender',
                    };
                }
                return {
                    status: 'FAILURE',
                    message: 'Something Went Wrong, Contact Tech Team',
                    reason: 'Money Debited from sender but not credited to anyone',
                };
            }
            return {
                status: 'FAILURE',
                message: 'Something Went Wrong, Contact Tech Team',
                reason: 'Not able to debit money from sender',
            };
        }
        return {
            status: 'FAILURE',
            message: 'Something Went Wrong, Contact Tech Team',
            reason: 'Not Enough Money in Sender Wallet',
        };
    }

    static async computeCheckoutDetails(db, obj) {
        const {
            payment_for, coupon_code, switch_assortment, student_info, amount, xAuthToken, variant_id, remove_coupon, version_code, variant_details, sale_type = '', currency_symbol,
        } = obj;
        let { use_wallet_reward, use_wallet_cash } = obj;

        let audioObj = {};
        const order_info = {};
        let packageInfo;
        const amount_info = {};
        const eventName = coupon_code ? 'COUPONCODE_APPLIED' : 'BUYNOW_CLICK';
        let upgradeCheck = {};
        let coupon_info;
        let wallet_info;

        let package_original_amount = 0;
        let package_min_limit = 0;
        let package_discount = 0;
        let package_final_amount = 0;
        let wallet_amount_usable = 0;
        let wallet_cash_amount = 0;
        let wallet_reward_amount = 0;
        let wallet_reward_amount_usable = 0;
        let wallet_reward_amount_usable_display = 0;
        let show_wallet = 0;
        let coupon_amount = 0;
        let is_upgrade = false;
        let is_panel = 0;

        if (payment_for == 'vip_offline') {
            is_panel = 1;
        }

        coupon_info = PaymentConstants.coupon_info_vc888(student_info.locale);
        wallet_info = PaymentConstants.wallet_info(student_info.locale);

        if (payment_for == 'course_package' || payment_for == 'doubt' || payment_for == 'vip_offline') {
            if (!variant_details) {
                packageInfo = await Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variant_id);
            } else {
                packageInfo = variant_details;
            }

            if (packageInfo.length > 0) {
                package_original_amount = packageInfo[0].original_amount;
                package_discount = packageInfo[0].discount_amount;
                package_final_amount = packageInfo[0].final_amount;

                order_info.package_duration = `${parseInt(packageInfo[0].duration_in_days / 30)} Months`;
                order_info.title = packageInfo[0].package_name;
                order_info.variant_id = variant_id;
                order_info.description = '';

                // amount_info.amount = packageInfo[0].original_amount;
                // amount_info.discount = packageInfo[0].discount_amount;
            }
            if ((payment_for === 'course_package' || payment_for === 'vip_offline') && packageInfo && packageInfo.length && packageInfo[0].type !== 'emi') {
                if (switch_assortment) {
                    upgradeCheck = await CourseHelper.getDifferenceAmountForSwitchSubscription({
                        db, studentID: student_info.student_id, activeAssortmentID: switch_assortment, packageInfo, isPanel: is_panel,
                    });
                } else {
                    upgradeCheck = await CourseHelper.getDifferenceAmountForUpgradeSubscription({
                        db,
                        studentID: student_info.student_id,
                        assortmentID: packageInfo[0].assortment_id,
                        isPanel: is_panel,
                    });
                }
                if (sale_type !== 'new_sale' && ((!_.isEmpty(upgradeCheck) && upgradeCheck.amount < packageInfo[0].total_amount && upgradeCheck.duration < packageInfo[0].duration_in_days) || (!_.isEmpty(upgradeCheck) && switch_assortment && upgradeCheck.amount <= packageInfo[0].total_amount))) {
                    package_discount += upgradeCheck.amount;
                    packageInfo[0].final_amount -= upgradeCheck.amount;
                    package_final_amount -= upgradeCheck.amount;
                    is_upgrade = true;
                }
                audioObj = { entity_type: 'assortment_id', entity_id: packageInfo[0].assortment_id };
            } else if (payment_for === 'doubt') {
                audioObj = { entity_type: 'doubt_payment', entity_id: 0 };
            }
            if (packageInfo.length > 0) {
                package_min_limit = Math.ceil(package_final_amount * (packageInfo[0].min_limit_percentage / 100));
                if (switch_assortment && is_upgrade) {
                    package_min_limit = Math.ceil(package_final_amount * (PaymentConstants.min_limit_percentage_switch_case / 100));
                }
                packageInfo[0].min_limit = package_min_limit;
            }
            if (package_min_limit > package_final_amount && packageInfo.length) {
                logger.error({ tag: 'Payment', source: 'computeCheckoutDetails', error: `Min limit error:\nvariant_id: ${packageInfo[0].variant_id}` });
                throw new Error('Payment error');
            }
        } else if (payment_for == 'wallet') {
            use_wallet_reward = false;
            use_wallet_cash = false;
            package_original_amount = amount;
            package_final_amount = amount;
            amount_info.amount = amount;
            audioObj = { entity_type: 'wallet_payment', entity_id: 0 };

            order_info.package_duration = '';
            order_info.title = `Amount to be added: ${currency_symbol}${amount}`;
        } else if (payment_for == 'bounty') {
            amount_info.amount = amount;
            use_wallet_reward = false;
            package_original_amount = amount;
            package_final_amount = amount;
            audioObj = { entity_type: 'bounty_payment', entity_id: 0 };

            order_info.title = 'Pay for Padhao aur Kamao';
            order_info.description = '';
        }
        // wallet section starts here

        let wallet_cash_show = 0;
        let wallet_reward_show = 0;
        //
        if (payment_for == 'course_package' || payment_for == 'doubt' || payment_for == 'vip_offline') {
            try {
                const walletInfo = await WalletUtil.getWalletBalance({ xAuthToken });
                console.log(walletInfo.data);
                wallet_cash_amount = +walletInfo.data.cash_amount;
                wallet_reward_amount = +walletInfo.data.reward_amount;
            } catch (e) {
                console.log(e);
            }
        }

        if (wallet_cash_amount) wallet_cash_show = 1;
        if (wallet_reward_amount) wallet_reward_show = 1;

        wallet_info.show_add_money = false;
        wallet_info.total_amount.value += `${wallet_cash_amount + wallet_reward_amount}`;
        wallet_info.total_amount.numeric_value = wallet_cash_amount + wallet_reward_amount;

        /*
         * The minlimit check is also happening in fetchCouponApplyData function. No need for it again as coupons are now given presidence over rewards.
        */
        if (packageInfo && packageInfo.length && !remove_coupon && packageInfo[0].type !== 'emi') {
            const is_show_panel = is_panel ? 2 : 0;
            const coupon_data = await CouponContainer.fetchCouponApplyData(db, student_info, coupon_code, packageInfo, version_code, xAuthToken, switch_assortment, is_show_panel, sale_type);
            coupon_info.status = coupon_data.status == 'SUCCESS';
            coupon_info.message = coupon_data.status_text;
            coupon_info.coupon_type = coupon_data.coupon_type;
            coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_code.webp`;
            if (coupon_data.status == 'SUCCESS') {
                coupon_info.cta_button = 'Applied';
                coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_tick.webp`;
                coupon_info.dialog_title = '####';
                coupon_info.dialog_subtitle = '####';
                coupon_amount = coupon_data.amount;
            } else if (coupon_code.length != 0) {
                coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_code.webp`;
                coupon_info.status = false;
            } else {
                coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_code.webp`;
                coupon_info.status = null;
            }
            coupon_info.code = coupon_data.code;
        } else {
            coupon_info.image_url = `${Data.cdnUrl}/images/payment/coupon_code.webp`;
            coupon_info.status = null;
            coupon_info.code = coupon_code;
            coupon_info.message = '';
        }
        if (package_final_amount == package_min_limit) {
            if (['instant'].includes(coupon_info.coupon_type)) {
                coupon_info.status = false;
                coupon_info.message = 'iss course par aur discount laagu nahi ho sakta hai';
            }
        }

        if (coupon_info.cta_button == 'Applied') {
            coupon_info.cta_button = `${global.t8[student_info.locale].t('Remove'.toUpperCase(), 'Remove')}`;
        }
        if (coupon_info.status == null) {
            coupon_info.status = false;
        }

        // **************************Computation**************************

        // 1. Coupon
        let package_final_amount_after_coupon_discount = package_final_amount;
        if (coupon_amount > 0) {
            coupon_amount = Math.min(coupon_amount, package_final_amount);
            package_final_amount_after_coupon_discount -= coupon_amount;
        }
        if (payment_for == 'wallet' || payment_for == 'bounty') {
            coupon_info = null;
        }
        // 1 end

        // 2. Wallet Cash
        if (!wallet_cash_show) {
            delete wallet_info.cash_amount;
        } else {
            wallet_info.cash_amount.value += `${wallet_cash_amount}`;
        }
        if (!use_wallet_cash) wallet_cash_amount = 0;

        const wallet_cash_amount_usable = Math.min(wallet_cash_amount, package_final_amount_after_coupon_discount);
        // 2 end

        // 3. Wallet Reward
        if (payment_for == 'course_package' || payment_for == 'doubt' || payment_for == 'vip_offline') {
            show_wallet = 1;

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

            wallet_reward_amount_usable_display = wallet_reward_amount_usable;
        }

        if (!wallet_reward_show) {
            delete wallet_info.reward_amount;
        } else {
            wallet_info.reward_amount.value += `${wallet_reward_amount_usable_display}`;
            wallet_info.reward_amount.title += `${wallet_reward_amount}`;
            wallet_info.reward_amount.description = wallet_info.reward_amount.description.replace('{{reward_amount}}', wallet_reward_amount_usable_display);
        }
        if (!use_wallet_reward) wallet_reward_amount_usable = 0;
        // 3 end

        wallet_amount_usable = wallet_cash_amount_usable + wallet_reward_amount_usable;

        // Net Amount: Since all the discount components have sanity checks, no need for step calculation.
        const net_amount = Math.max(package_final_amount - coupon_amount - wallet_amount_usable, 0);

        wallet_info.show_wallet = show_wallet;
        const wallet_total_amount_display = wallet_info.total_amount.numeric_value;

        if (coupon_info && coupon_info.dialog_title && coupon_info.dialog_subtitle) {
            coupon_info.dialog_title = `'${coupon_code}' Applied`;
            coupon_info.dialog_subtitle = `Yay! You saved ${currency_symbol}${coupon_amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}!`;
        }

        const reponse = {
            packageInfo,
            package_original_amount,
            package_discount,
            package_final_amount,
            coupon_amount,
            coupon_info,
            wallet_info,
            net_amount,
            wallet_amount_usable,
            wallet_cash_amount_usable,
            wallet_total_amount_display,
            wallet_cash_amount,
            wallet_reward_amount_usable,
            wallet_reward_amount_usable_display,
            wallet_reward_amount,
            eventName,
            audioObj,
            order_info,
            is_upgrade,
        };
        return reponse;
    }

    static async resellerWalletCashDebit(resellerStudentId, amount, db) {
        const resellerWalletSummary = await PayMySQL.getWalletBalance(db.mysql.read, resellerStudentId);

        if (resellerWalletSummary.length && resellerWalletSummary[0].cash_amount > amount) {
            const debitEntry = await WalletUtil.makeWalletTransaction({
                student_id: resellerStudentId,
                cash_amount: amount,
                type: 'DEBIT',
                reason: 'wallet_transfer',
                payment_info_id: 'dedsorupiyadega',
                expiry: null,
            });

            if (debitEntry) {
                return {
                    status: 'SUCCESS',
                    debit_entry: debitEntry,
                };
            }
            return {
                status: 'FAILURE',
                message: 'Something Went Wrong, Contact Tech Team',
                reason: 'Not able to debit money from sender',
            };
        }
        return {
            status: 'FAILURE',
            message: 'Something Went Wrong, Contact Tech Team',
            reason: 'Not Enough Money in Sender Wallet',
        };
    }

    static async getVpaDetails(obj) {
        const {
            db, student_id: studentId, locale, is_upi_offline: isUpiOffline = 0, source = 'wallet',
        } = obj;
        let razorpayResponse;
        let vbaObj;
        let vpaDetails = {};
        // const studentDetails = await Student.getById(studentId, db.mysql.read);
        const studentDetails = await StudentContainer.getById(studentId, db);
        const mobileNumber = studentDetails[0].mobile;

        const rzpVbaObj = {
            description: `Payment for ${mobileNumber} | DN Wallet`,
            mobile: `91${mobileNumber}`,
            descriptor: `DN${mobileNumber}`,
        };

        const activeVPA = await PayMySQL.getActiveVPAByStudentId(db.mysql.read, studentId);

        if (activeVPA.length) {
            vbaObj = {
                id: activeVPA[0].id,
                account_number: activeVPA[0].account_number,
                ifsc: activeVPA[0].ifsc_code,
                bank_name: activeVPA[0].bank_name,
                name: 'Doubtnut',
                upi_id: activeVPA[0].upi_id || '',
                virtual_account_id: activeVPA[0].virtual_account_id,
            };
            if (_.isEmpty(activeVPA[0].upi_id)) {
                razorpayResponse = await RzpHelper.addUpiIdToVBA({ id: activeVPA[0].virtual_account_id, descriptor: `DN${mobileNumber}` });
                const upiIndex = _.findIndex(razorpayResponse.receivers, (o) => o.entity == 'vpa');
                vbaObj.upi_id = upiIndex > -1 ? razorpayResponse.receivers[upiIndex].address : null;
                await PayMySQL.updatePaymentInfoSmartCollect(db.mysql.write, { upi_id: vbaObj.upi_id }, vbaObj.virtual_account_id);
            }
        } else {
            razorpayResponse = await RzpHelper.createVPA(rzpVbaObj, true);
            console.log(razorpayResponse);
            if (razorpayResponse.receivers) {
                let bankAccountIndex = _.findIndex(razorpayResponse.receivers, (o) => o.entity == 'bank_account');
                const upiIndex = _.findIndex(razorpayResponse.receivers, (o) => o.entity == 'vpa');

                bankAccountIndex = bankAccountIndex < 0 ? 0 : bankAccountIndex;
                vbaObj = {
                    account_number: razorpayResponse.receivers[bankAccountIndex].account_number,
                    ifsc: razorpayResponse.receivers[bankAccountIndex].ifsc,
                    bank_name: razorpayResponse.receivers[bankAccountIndex].bank_name,
                    name: razorpayResponse.receivers[bankAccountIndex].name,
                    upi_id: upiIndex > -1 ? razorpayResponse.receivers[upiIndex].address : null,
                    virtual_account_id: razorpayResponse.id,
                };
                const smartCollectResponse = await PayMySQL.setPaymentInfoSmartCollect(db.mysql.write, {
                    student_id: studentId,
                    virtual_account_id: razorpayResponse.id,
                    account_number: razorpayResponse.receivers[bankAccountIndex].account_number,
                    ifsc_code: razorpayResponse.receivers[bankAccountIndex].ifsc,
                    bank_name: razorpayResponse.receivers[bankAccountIndex].bank_name,
                    upi_id: upiIndex > -1 ? razorpayResponse.receivers[upiIndex].address : null,
                    is_active: 1,
                    created_by: 'system',
                });
                vbaObj.id = smartCollectResponse.insertId;
            } else {
                vbaObj = {};
            }
        }
        if (!_.isEmpty(vbaObj) && source == 'wallet') {
            vpaDetails = PaymentConstants.vpa_details(locale);
            if (isUpiOffline) {
                vpaDetails.description = global.t8[locale].t('A Govt. of India Initiative\n08045163666 pe call karke paise transfer karein apne DN Wallet mein.\nAapki account details hain:');
            }

            vpaDetails.details[0].value = vbaObj.account_number;
            vpaDetails.details[1].value = vbaObj.ifsc;
            if (isUpiOffline) {
                vpaDetails.details[2].name = 'Bank Name';
                vpaDetails.details[2].value = vbaObj.bank_name || 'RBL Bank';
                vpaDetails.wa_details = `A Govt. of India Initiative\nCall 08045163666 and select account transfer.\nA/c No: ${vbaObj.account_number}\nIFSC: ${vbaObj.ifsc}\nBank Name: ${vpaDetails.details[2].value}`;
                db.mongo.write.collection('123_pay_clicks').save({ student_id: studentId });
            } else {
                vpaDetails.details[2].value = vbaObj.name;
                vpaDetails.wa_details = `A/c No: ${vbaObj.account_number}\nIFSC: ${vbaObj.ifsc}\nName: ${vbaObj.name}`;
            }
        } else if (!_.isEmpty(vbaObj) && source == 'qr') {
            vpaDetails = { ...vbaObj };
        }
        return vpaDetails;
    }

    static async doShopseSuccess(db, config, shopseRes, responseData) {
        const payment_info = await PayMySQL.getPaymentInfoByOrderId(db.mysql.read, shopseRes.orderId);
        let deeplink;

        if (payment_info && payment_info[0].status == 'INITIATED') {
            await PayMySQL.updatePaymentByOrderId(db.mysql.write, {
                status: 'SUCCESS',
                mode: 'emi',
                order_id: payment_info[0].order_id,
                partner_txn_id: shopseRes.shopSeTxnId,
                partner_txn_time: moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
            });
            payment_info[0].status = 'SUCCESS';
            payment_info[0].partner_txn_id = shopseRes.shopSeTxnId;
            payment_info[0].partner_txn_time = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
            await this.doSuccessPaymentProcedure(db, config, payment_info, '');

            if (payment_info[0].variant_id) {
                const course_details = await MysqlCourseV2.getCourseDetailsFromVariantId(db.mysql.read, payment_info[0].variant_id);
                if (course_details.length) {
                    deeplink = `doubtnutapp://course_details?id=${course_details[0].assortment_id}`;
                }
            }
        }
        responseData.data = {
            currentTime: shopseRes.currentTime,
            orderId: shopseRes.orderId,
            shopSeTxnId: shopseRes.shopSeTxnId,
            status: shopseRes.status,
            statusCode: shopseRes.statusCode,
            statusMessage: shopseRes.statusMessage,
            deeplink,
        };
    }

    static async doPayUComplete(db, config, payuResponse, host, isWebhook) {
        const salt = config.PAYU.SALT;
        const keyString = `${payuResponse.key}|${payuResponse.txnid}|${payuResponse.amount}|${payuResponse.productinfo}|${payuResponse.firstname}|${payuResponse.email}||||||||||`;
        const keyArray = keyString.split('|');
        const reverseKeyArray = keyArray.reverse();
        const reverseKeyString = `${salt}|${payuResponse.status}|${reverseKeyArray.join('|')}`;
        const isHash = PayuHash.validateHash(reverseKeyString, payuResponse.hash);

        const paymentInfo = await PayMySQL.getPaymentInfoByOrderId(db.mysql.write, payuResponse.txnid);
        let statusMessage = 'Aapki payment fail ho gayi hai';

        if (!_.isEmpty(paymentInfo) && (payuResponse.status != 'success' || !isHash)) {
            await PayMySQL.updatePaymentByOrderId(db.mysql.write, {
                status: 'FAILURE',
                mode: 'emi',
                order_id: paymentInfo[0].order_id,
                partner_order_id: payuResponse.mihpayid,
                partner_txn_id: payuResponse.mihpayid,
                partner_txn_time: moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
            });
            if (isWebhook) {
                const responseData = {
                    currentTime: payuResponse.addedon,
                    orderId: payuResponse.txnid,
                    payuTxnId: payuResponse.mihpayid,
                    status: payuResponse.status,
                    statusMessage,
                };
                return responseData;
            }
            return `https://${host}/static/payu_complete.html?status=0&statusMessage=${encodeURIComponent(statusMessage).replace('%20', '+')}`;
        }
        let deeplink;
        for (let retries = 0; retries < 3; retries++) {
            try {
                const verifyResponse = await PayuHelper.verifyPayment(payuResponse.txnid);
                if (!_.isEmpty(paymentInfo) && verifyResponse && verifyResponse.status == 1 && verifyResponse.transaction_details[`${payuResponse.txnid}`].status == 'success') {
                    if (paymentInfo[0].status != 'SUCCESS') {
                        await PayMySQL.updatePaymentByOrderId(db.mysql.write, {
                            status: 'SUCCESS',
                            mode: 'emi',
                            order_id: paymentInfo[0].order_id,
                            partner_order_id: payuResponse.mihpayid,
                            partner_txn_id: payuResponse.mihpayid,
                            partner_txn_time: moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
                            partner_txn_response: JSON.stringify(payuResponse),
                        });
                        paymentInfo[0].status = 'SUCCESS';
                        paymentInfo[0].partner_txn_id = payuResponse.mihpayid;
                        paymentInfo[0].partner_txn_time = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                        await this.doSuccessPaymentProcedure(db, config, paymentInfo, {});
                    }
                    if (paymentInfo[0].variant_id) {
                        const courseDetails = await MysqlCourseV2.getCourseDetailsFromVariantId(db.mysql.read, paymentInfo[0].variant_id);
                        if (courseDetails.length) {
                            deeplink = `doubtnutapp://course_details?id=${courseDetails[0].assortment_id}`;
                        }
                    }
                    statusMessage = 'Congratulations! Aapki payment successful hui. Ab aap padhai start kar sakte hain';
                    break;
                }
            } catch (e) {
                console.log(e);
            }
        }
        if (isWebhook) {
            const responseData = {
                currentTime: payuResponse.addedon,
                orderId: payuResponse.txnid,
                payuTxnId: payuResponse.mihpayid,
                status: payuResponse.status,
                statusMessage,
            };
            return responseData;
        }
        return `https://${host}/static/payu_complete.html?status=1&deeplink=${deeplink}&statusMessage=${encodeURIComponent(statusMessage).replace('%20', '+')}`;
    }
};
