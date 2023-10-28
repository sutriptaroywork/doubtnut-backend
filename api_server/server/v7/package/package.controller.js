const _ = require('lodash');
const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CourseHelper = require('../../helpers/course');
const WidgetHelper = require('../../widgets/liveclass');
// const PackageContainer = require('../../../modules/containers/package');
const Flagr = require('../../../modules/containers/Utility.flagr');
const PackageHelper = require('./package.helper');
const NudgeMysql = require('../../../modules/mysql/nudge');
const PaymentHelper = require('../../helpers/payment');
const TargetGroupHelper = require('../../helpers/target-group');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const Data = require('../../../data/data');
const Utility = require('../../../modules/utility');
const StudentContainer = require('../../../modules/containers/student');
const EventsModule = require('../../../modules/events/events');
const { autoScrollTime } = require('../../../data/data');
const logger = require('../../../config/winston').winstonLogger;
const referralFlowHelper = require('../../helpers/referralFlow');
const studentHelper = require('../../helpers/student.helper');

function getIconHeader() {
    const obj = {
        type: 'icon_header',
        data: {
            title: 'VIP PASS',
            color: '#c7a453',
            icon_url: '',
        },
    };
    return obj;
}

function getEmiIconHeader() {
    const obj = {
        type: 'icon_header',
        data: {
            title: 'Emi Reminder',
            subtitle: '',
            color: '#c7a453',
            icon_url: '',
        },
    };
    return obj;
}

async function getPlanInfo(db, flagrResponse, assortmentId) {
    let title = 'Apna plan chuniye';
    if (flagrResponse && flagrResponse.variantAttachment && flagrResponse.variantAttachment.title) {
        const assortmentDetails = await CourseMysql.getChapterAssortmentDetails(db.mysql.read, assortmentId);
        if (assortmentDetails.length) {
            title = `${assortmentDetails[0].display_name} se related plan chuniye`;
        }
    }
    const obj = {
        type: 'plan_info',
        data: {
            title,
            description: 'Live classes ke wajah se ab book ki bhi zarurat nahi',
            icon_url: '',
        },
    };
    return obj;
}

async function getAllAssortment(db, assortmentId, level, studentClass) {
    const arr = [];
    arr.push(assortmentId);
    let assortments = [assortmentId];
    for (let k = 0; k < level; k++) {
        if (assortments.length) {
            // eslint-disable-next-line no-await-in-loop
            const data = await CourseMysql.getRelatedAssortments(db.mysql.read, assortments, studentClass);
            assortments = [];
            for (let i = 0; i < data.length; i++) {
                if (arr.indexOf(data[i].assortment_id) < 0) {
                    arr.push(data[i].assortment_id);
                    assortments.push(data[i].assortment_id);
                }
            }
        }
    }
    return arr;
}

async function getEmiReminder(db, emiDetails, config) {
    const obj = await CourseHelper.emiReminderData(db, emiDetails, config);
    const data = {
        type: 'package_details',
        data: {
            items: [obj],
        },
    };
    return data;
}

async function fetchPackagesInfo(db, arr, studentID, config, locale, bottomSheet, source, assortmentDetails, upgradeDifferenceAmount, versionCode, campaign) {
    const referralCouponData = await referralFlowHelper.getRefererSidAndCouponCode(db, studentID, locale);
    let username = '';
    if (referralCouponData) {
        username = await studentHelper.getStudentName(db, referralCouponData.student_id);
        if (username) {
            username = username.length > 15 ? 'friend' : username;
        }
    }
    let packageDetails;
    if (campaign === 'UAC_InApp_CBSE_9-12_Board_EM') {
        packageDetails = await CourseHelper.getPackagesForAssortmentAutosalesCampaign(db, studentID, arr);
    } else if (referralCouponData) {
        packageDetails = await CourseHelper.getPackagesForAssortmentReferral(db, studentID, arr);
    } else {
        packageDetails = await CourseHelper.getPackagesForAssortment(db, studentID, arr);
    }
    let activePackageDetails = [];
    if (source && source.includes('COURSE_CHANGE_LISTING')) {
        activePackageDetails = await CourseMysql.getUserPaymentSummaryDetailsByAssortment(db.mysql.read, source.split('||')[1], studentID);
        const higherAmountPackages = packageDetails.filter((item) => item.display_price >= activePackageDetails[0].package_amount);
        packageDetails = higherAmountPackages.length ? higherAmountPackages : packageDetails.slice(0, 1);
    }
    if (packageDetails.length > 0) {
        packageDetails[0].bestseller = true;
    }
    const packagesWidget = [];
    for (let i = 0; i < packageDetails.length; i++) {
        const obj = {};
        if (packageDetails[i].reference_type === 'referral') {
            obj.header_title = locale === 'hi' ? `सिर्फ ${username} के कूपन '${referralCouponData.coupon_code}' के साथ उपलब्ध` : `Only available with ${username}'s Code '${referralCouponData.coupon_code}'`;
            obj.header_title_text_size = 14;
            obj.header_title_text_color = '#3c9d00';
            obj.header_background_color = '#edffe1';
        }
        if (packageDetails[i].reference_type === 'bnb_autosales') {
            obj.header_title = locale === 'hi' ? 'लिमिटेड टाइम धमाका ऑफर!' : 'Limited time offer!';
            obj.header_title_text_size = 14;
            obj.header_title_text_color = '#3c9d00';
            obj.header_background_color = '#edffe1';
        }
        obj.id = packageDetails[i].id;
        obj.assortment_id = packageDetails[i].assortment_id;
        obj.type = 'default';
        obj.title = locale === 'hi' ? `${packageDetails[i].duration_in_days} दिनों का पैक` : `${packageDetails[i].duration_in_days} days pack`;
        obj.bestseller = packageDetails[i].bestseller || false;
        const duration = Math.floor(packageDetails[i].duration_in_days / 30);
        obj.duration = locale === 'hi' ? `${packageDetails[i].duration_in_days} दिनों का पैक` : `${packageDetails[i].duration_in_days} days pack`;

        // obj.duration = packageDetails[i].name; // duration === 1 ? `${duration} Month` : `${duration} Months`;
        // if (locale === 'hi') {
        //     obj.duration = duration === 1 ? `${duration} महीना` : `${duration} महीने`;
        // }
        obj.duration_color = '#000000';
        const basePrice = packageDetails[i].base_price;
        const displayPrice = !_.isEmpty(upgradeDifferenceAmount) && (packageDetails[i].duration_in_days > upgradeDifferenceAmount.duration) ? packageDetails[i].display_price - upgradeDifferenceAmount.amount : packageDetails[i].display_price;
        // const showMonthlyPrice = bottomSheet && source && !source.includes('COURSE_CHANGE_LISTING') && !source.includes('PRE_PURCHASE_BUY_BUTTON');
        const showMonthlyPrice = false;
        obj.amount_to_pay = showMonthlyPrice ? `₹${CourseHelper.numberWithCommas(Math.floor(displayPrice / duration))}/Month` : `₹${CourseHelper.numberWithCommas(displayPrice)}`;
        obj.amount_to_pay_color = '#000000';
        obj.emi = `₹${CourseHelper.numberWithCommas(Math.floor(displayPrice / duration))}/Month`;

        // obj.amount_strike_through = showMonthlyPrice ? '' : `${CourseHelper.numberWithCommas(basePrice)}`;
        obj.amount_strike_through_color = '#808080';
        // obj.discount = basePrice - displayPrice > 0 ? `Save ${packageDetails[i].amount_saving_percentage}%` : '';
        // keys for package_details_v4
        if (source && source.includes('PRE_PURCHASE_BUY_BUTTON')) {
            obj.duration_color = '#000000';
            obj.emi = `Total ₹${CourseHelper.numberWithCommas(displayPrice)}`;
            obj.emi_size = '12';
            obj.emi_color = '#504949';
            const maxMonthlyPriceDuration = packageDetails[packageDetails.length - 1].duration_in_days / 30;
            const maxMonthlyPrice = packageDetails[packageDetails.length - 1].display_price / maxMonthlyPriceDuration;
            obj.emi = locale === 'hi' ? `${CourseHelper.numberWithCommas(Math.floor(displayPrice / duration))} हर महीने का` : `₹${CourseHelper.numberWithCommas(Math.floor(displayPrice / duration))}/Month`;

            // obj.amount_strike_through = i < (packageDetails.length - 1) ? `${CourseHelper.numberWithCommas(Math.floor(maxMonthlyPrice))}/Month` : '';
            if (versionCode > 945) {
                obj.emi = locale === 'hi' ? `${CourseHelper.numberWithCommas(Math.floor(displayPrice / duration))} हर महीने का` : `₹${CourseHelper.numberWithCommas(Math.floor(displayPrice / duration))}/Month`;

                // obj.emi = `Total ₹${CourseHelper.numberWithCommas(displayPrice)}`;
                const monthlyPrice = Math.floor(displayPrice / duration);
                obj.amount_to_pay = `Total ₹${CourseHelper.numberWithCommas(displayPrice)}`;
                // obj.discount = packageDetails.length > 1 && i < packageDetails.length - 1 ? `Save ${Math.floor(((maxMonthlyPrice - monthlyPrice) * 100) / maxMonthlyPrice)}%` : '';
            }
        }
        obj.bestseller_text = locale === 'hi' ? 'बेस्ट सेल्लेर' : 'Bestseller';
        obj.bestseller_text_color = '#54b726';
        obj.subtitle = locale === 'hi' ? `${duration} ${duration > 1 ? 'महीनों' : 'माह'} के लिए` : `For ${duration} ${duration > 1 ? 'Months' : 'Month'}`;
        if (assortmentDetails.length && assortmentDetails[0].parent === 4) {
            obj.subtitle = locale === 'hi' ? `बस ₹${Math.floor(displayPrice / duration)} प्रति माह पूरे कोटा कोर्स के लिए` : `Only ₹${Math.floor(displayPrice / duration)} per month for full access`;
        }
        if (!_.isEmpty(upgradeDifferenceAmount) && (packageDetails[i].duration_in_days > upgradeDifferenceAmount.duration)) {
            obj.subtitle = locale === 'hi' ? `${duration - Math.floor(upgradeDifferenceAmount.duration / 30)} और महीनों के लिए ₹${CourseHelper.numberWithCommas(displayPrice)}` : `₹${CourseHelper.numberWithCommas(displayPrice)} for ${duration - Math.floor(upgradeDifferenceAmount.duration / 30)} more months`;
        } else if (!_.isEmpty(upgradeDifferenceAmount)) {
            obj.subtitle = locale === 'hi' ? `${duration} और ${duration > 1 ? 'महीनों' : 'माह'} के लिए ₹${CourseHelper.numberWithCommas(displayPrice)}` : `₹${CourseHelper.numberWithCommas(displayPrice)} for ${duration} more ${duration > 1 ? 'months' : 'month'}`;
        }
        obj.subtitle_color = '#808080';
        obj.amount_saving = '';
        packageDetails[i].amount_saving_percentage = Math.round(((basePrice - displayPrice) / basePrice) * 100);
        obj.discount_color = '#854ce3';
        obj.discount_size = '13';
        obj.pay_text = 'Buy Now';
        obj.bg_color = '#f7fff1';
        obj.bg_image = `${config.cdn_url}engagement_framework/105D1B3C-3EBD-344F-CA29-B31665B46102.webp`;
        obj.deeplink = `doubtnutapp://vip?variant_id=${packageDetails[i].variant_id}`;
        packageDetails[i].deeplink = obj.deeplink;
        if (source && source.includes('POST_PURCHASE_RENEWAL')) {
            obj.deeplink = `doubtnutapp://vip?variant_id=${packageDetails[i].variant_id}&coupon_code=${source.split('||')[1]}`;
        }
        obj.note_title = locale === 'hi' ? 'नोट:' : 'Note:';
        obj.note_title_color = '#808080';
        obj.cta_text = locale === 'hi' ? 'अभी खरीदें >' : 'BUY NOW >';
        obj.cta_color = '#eb532c';
        // source=COURSE_CHANGE_LISTING comes from course switch module on post purchase page
        if (source && source.includes('COURSE_CHANGE_LISTING') && activePackageDetails.length && displayPrice <= activePackageDetails[0].package_amount) {
            obj.deeplink = `doubtnutapp://course_change?type=callback&selected_assortment=${packageDetails[i].variant_id}&assortment_id=${source.split('||')[1]}`;
            obj.subtitle = '';
            if (displayPrice === activePackageDetails[0].package_amount) {
                obj.note_text = locale === 'hi' ? 'इस कोर्स की कीमत आपके अभी के कोर्स जितनी ही है' : 'Iss course aur aapke abhi ke course ka price same hi hai';
            } else if (packageDetails[i].duration_in_days === activePackageDetails[0].duration_in_days) {
                obj.note_text = locale === 'hi' ? 'इस कोर्स की वैलिडिटी आपके अभी के कोर्स जितनी ही है' : 'Aapke course ki validity same rahegi';
            } else {
                obj.note_text = locale === 'hi' ? `आपके कोर्स की वैलिडिटी अब ${moment(activePackageDetails[0].master_subscription_end_date).format('DD MMM YYYY')} की जगह ${moment(activePackageDetails[0].master_subscription_start_date).add(packageDetails[i].duration_in_days, 'days').format('DD MMM YYYY')} को समाप्त होगी` : `Aapka course ab ${moment(activePackageDetails[0].master_subscription_end_date).format('DD MMM YYYY')} ki jagah ${moment(activePackageDetails[0].master_subscription_start_date).add(packageDetails[i].duration_in_days, 'days').format('DD MMM YYYY')} ko expire hoga`;
            }
        } else if (source && source.includes('COURSE_CHANGE_LISTING')) {
            obj.deeplink = `doubtnutapp://course_change?type=confirm&selected_assortment=${packageDetails[i].variant_id}&assortment_id=${source.split('||')[1]}`;
            obj.subtitle = '';
            if (packageDetails[i].duration_in_days === activePackageDetails[0].duration_in_days) {
                obj.note_text = locale === 'hi' ? 'इस कोर्स की वैलिडिटी आपके अभी के कोर्स जितनी ही है' : 'Aapke course ki validity same rahegi';
            } else {
                obj.note_text = locale === 'hi' ? `आपके कोर्स की वैलिडिटी अब ${moment(activePackageDetails[0].master_subscription_end_date).format('DD MMM YYYY')} की जगह ${moment(activePackageDetails[0].master_subscription_start_date).add(packageDetails[i].duration_in_days, 'days').format('DD MMM YYYY')} को समाप्त होगी` : `Aapka course ab ${moment(activePackageDetails[0].master_subscription_end_date).format('DD MMM YYYY')} ki jagah ${moment(activePackageDetails[0].master_subscription_start_date).add(packageDetails[i].duration_in_days, 'days').format('DD MMM YYYY')} ko expire hoga`;
            }
        }
        obj.pointers = [];
        let pointers = [];
        if (packageDetails[i].description) {
            pointers = packageDetails[i].description.split('|');
        }
        pointers.push(`Validity - ${packageDetails[i].duration_in_days} days`);
        pointers.forEach((e) => {
            obj.pointers.push(e.trim());
        });
        obj.upfront_variant = packageDetails[i].variant_id;
        const emiPackage = [];
        for (let j = 0; j < emiPackage.length; j++) {
            const emiPackageObj = emiPackage[j];
            const finalObj = _.clone(obj);
            finalObj.pointers = _.clone(obj.pointers);
            if (emiPackageObj && (emiPackageObj.is_emi || emiPackageObj.type === 'emi')) {
                const emiDetails = emiPackageObj.type === 'emi' ? [emiPackageObj] : packages.filter((e) => e.variant_id === emiPackageObj.emi_variant);
                const childPackages = await Package.getChildPackagesFromVariant(db.mysql.read, emiPackageObj.emi_variant);
                finalObj.type = 'emi';
                finalObj.pay_installment_text = 'Pay in Installments';
                finalObj.emi_variant = childPackages[0].id;
                finalObj.emi = CourseHelper.createEmiObject(childPackages, emiDetails);
                if (emiPackage.length > 1) {
                    finalObj.title = `${finalObj.title} Plan-${j + 1}`;
                    finalObj.pointers.push('Asaan EMI ke saath try karein');
                    finalObj.pointers.push(`Total ${emiPackageObj.total_emi} EMIs`);
                    finalObj.pointers.push(`Agli EMI har ${childPackages[1].emi_duration / 30} months baad`);
                }
            }
            const data = {
                type: bottomSheet ? 'package_details_v2' : 'package_details',
                extra_params: {
                    assortment_id: arr[0],
                    source,
                    package_id: packageDetails[i].id,
                },
                data: {
                    items: [finalObj],
                },
            };
            if (source && source.includes('COURSE_CHANGE_LISTING')) {
                data.type = 'package_details_v3';
            }
            packagesWidget.push(data);
        }
        if (!emiPackage.length) {
            const data = {
                type: bottomSheet ? 'package_details_v4' : 'package_details',
                extra_params: {
                    assortment_id: arr[0],
                    source,
                    package_id: packageDetails[i].id,
                },
                data: {
                    items: [obj],
                },
            };
            if (source && source.includes('COURSE_CHANGE_LISTING')) {
                data.type = 'package_details_v3';
            } else if (source && source.includes('PRE_PURCHASE_BUY_BUTTON')) {
                data.type = 'package_details_v4';
            }
            packagesWidget.push(data);
        }
    }
    const extraWidgets = [];
    // // source=PRE_PURCHASE_BUY_BUTTON is for pricing bottom sheet on prepurchse course page
    // if (source && source.includes('PRE_PURCHASE_BUY_BUTTON') && packageDetails.length > 1) {
    //     if (versionCode > 945) {
    //         extraWidgets.push(WidgetHelper.getBuyCompleteWidgetV1({ result: packageDetails[0], text: locale === 'hi' ? 'पूरा कोर्स' : 'Complete Course', locale }));
    //         extraWidgets.push(WidgetHelper.getBuyCompleteWidgetV1({
    //             result: packageDetails[packageDetails.length - 1], text: locale === 'hi' ? `${Math.ceil(packageDetails[packageDetails.length - 1].duration_in_days / 30)} महीने का ट्रायल` : `Try ${Math.ceil(packageDetails[packageDetails.length - 1].duration_in_days / 30)} Month`, type: 'trial', locale,
    //         }));
    //         extraWidgets.push({
    //             type: 'text_widget',
    //             data: {
    //                 title: locale === 'hi' ? 'कॅश पेमेंट अवेलेबल' : 'Cash on Delivery Available',
    //                 isBold: true,
    //                 alignment: 'center',
    //                 is_center_aligned: true,
    //             },
    //             layout_config: {
    //                 margin_left: 16,
    //             },
    //         });
    //     } else {
    //         extraWidgets.push(WidgetHelper.getTryPaymentWidget({ result: packageDetails[packageDetails.length - 1], locale }));
    //         extraWidgets.push(WidgetHelper.getBuyCompleteWidget({ result: packageDetails[0], text: locale === 'hi' ? 'पूरा कोर्स खरीदें' : 'Buy Complete Course' }));
    //     }
    // }
    return { packagesWidget, extraWidgets };
}

async function sendCouponForBNBClickers(db, config, studentID, locale, assortmentDetails) {
    const isStudentIDPresentInBNBClickersTable = await CourseContainerV2.getStudentRecordFromBNBClickersTable(db, studentID);
    if (!isStudentIDPresentInBNBClickersTable.length) {
        const studentDetails = await StudentContainer.getById(studentID, db);
        // * send notification
        const notificationPayload = {
            event: 'live_class',
            title: Data.bnbClickers.notification[locale === 'hi' ? 'hi' : 'en'].title,
            message: Data.bnbClickers.notification[locale === 'hi' ? 'hi' : 'en'].message,
            firebase_eventtag: Data.bnbClickers.notification[locale === 'hi' ? 'hi' : 'en'].firebaseTag,
            s_n_id: Data.bnbClickers.notification[locale === 'hi' ? 'hi' : 'en'].firebaseTag,
        };
        notificationPayload.data = JSON.stringify({
            id: '644832544',
            page: 'DEEPLINK',
            resource_type: 'video',
        });
        Utility.sendFcm(studentDetails[0].student_id, studentDetails[0].gcm_reg_id, notificationPayload);
        // * Insert into bnb_clickers table
        await CourseMysql.insertIntoBNBClickers(db.mysql.write, studentID, 1, 1, assortmentDetails.meta_info);
    }
}

async function info(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const studentID = req.user.student_id;
        const { locale } = req.user;
        const { source } = req.query;
        const kinesisClient = req.app.get('kinesis');
        const event = 'lc_bundle_back';
        let widgets = [];
        const { 'x-auth-token': xAuthToken, is_browser: isBrowser, version_code: versionCode } = req.headers;
        const flagrResponse = await CourseHelper.resourcesToBundlePageExperiment(db, xAuthToken, studentID);
        const assortmentId = parseInt(req.query.assortment_id);
        const level = 4;
        let { student_class: studentClass, bottom_sheet: bottomSheet } = req.query;
        if (bottomSheet !== 'true') {
            bottomSheet = false;
        }
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        const assortmentDetails = await CourseMysql.getAssortmentDetailsFromIdForExplorePage(db.mysql.read, [assortmentId], studentClass);
        // TODO: if assortmentDetails is an empty array, we should handle it directly from here. At the same time, we should send a signal somewhere so that the content stakeholders are aware of this and can correct the data
        // Relevant log message: https://doubtnut.app.coralogix.in/#/query-new/logs?permalink=true&startTime=1645509972012&endTime=1645509972014&logId=346d6135-874a-40ff-8467-6ff71708f854
        const arr = bottomSheet ? [assortmentId] : await getAllAssortment(db, assortmentId, level, studentClass);
        const activeSubs = await CourseMysql.getUserPaymentSummaryByAssortment(db.mysql.read, arr, studentID);
        const nudge = await NudgeMysql.getByEventAndResourceId(db.mysql.read, event, studentClass, assortmentId);
        const len = activeSubs.length;
        const upgradeDifferenceAmount = await CourseHelper.getDifferenceAmountForUpgradeSubscription({ db, studentID, assortmentID: arr[0] });
        // * Send notification only if the assortment_type is course and is_free is 0
        if (assortmentDetails.length && assortmentDetails[0].assortment_type === 'course' && assortmentDetails[0].is_free === 0) {
            await sendCouponForBNBClickers(db, config, studentID, locale, assortmentDetails[0]);
        }
        if (isBrowser) {
            // * If the request from web, then store the event in mongo
            const eventData = {
                event_name: 'BUYNOW_CLICK',
                student_id: studentID,
                assortment_id: assortmentId,
                source,
                ip: req.ip,
                hostname: req.hostname,
                student_locale: locale,
                student_class: studentClass,
            };
            EventsModule.putEventIntoMongoWrapper(db, eventData);
        }
        if (len && !activeSubs[len - 1].is_last) {
            widgets.push(getEmiIconHeader());
            const emiObj = await getEmiReminder(db, activeSubs, config);
            widgets.push(emiObj);
        } else {
            if (!bottomSheet) {
                widgets.push(getIconHeader());
                const planInfo = await getPlanInfo(db, flagrResponse, assortmentId);
                widgets.push(planInfo);
            }
            const { packagesWidget, extraWidgets } = await fetchPackagesInfo(db, arr, studentID, config, locale, bottomSheet, source, assortmentDetails, upgradeDifferenceAmount, versionCode, req.user.campaign);
            widgets = [...widgets, ...packagesWidget, ...extraWidgets];
            let packageObj;
            if (packagesWidget[packagesWidget.length - 1].data && packagesWidget[packagesWidget.length - 1].data.items[0]) {
                packageObj = packagesWidget[packagesWidget.length - 1].data.items[0];
            }
            // make an async call to the payment helper method insertBuyNowDataInCRM with the appropriate data
            PaymentHelper.insertBuyNowDataInCRM(db, kinesisClient, studentID, config, packageObj, assortmentDetails);
        }
        const items = [];
        let title = locale === 'hi' ? `${assortmentDetails.length ? assortmentDetails[0].display_name : ''} के लिए वैलिडिटी चुने` : `Choose Validity for ${assortmentDetails.length ? assortmentDetails[0].display_name : ''}`;
        if (bottomSheet) {
            // this will show any active banner in app_banners table with pagevalue=BOTTOM_SHEET (with target group check conditions)
            const bannerData = await CourseMysql.getBannerByPageValue(db.mysql.read, 'BOTTOM_SHEET');
            for (let i = 0; i < bannerData.length; i++) {
                let deeplink = bannerData[i].action_activity ? `doubtnutapp://${bannerData[i].action_activity}?` : '';
                // eslint-disable-next-line guard-for-in
                for (const action in bannerData[i].action_data) {
                    deeplink = `${deeplink}${action}=${bannerData[i].action_data[action]}&`;
                }
                if (bannerData[i].target_group_id) {
                    const tgCheck = await TargetGroupHelper.targetGroupCheck({
                        db, studentId: studentID, tgID: bannerData[i].target_group_id, studentClass, locale,
                    });
                    if (tgCheck) {
                        items.push({
                            image_url: bannerData[i].image_url,
                            deeplink,
                        });
                    }
                } else {
                    items.push({
                        image_url: bannerData[i].image_url,
                        deeplink,
                    });
                }
            }
            if (assortmentDetails.length === 0) {
                // logger.warn(`CONTENT_ISSUE: No assortment details found for assortment ID ${assortmentId}`);
                const responseData = {
                    meta: {
                        code: 204,
                        success: true,
                        message: 'CONTENT_ISSUE',
                    },
                    data: {
                        message: `No assortment details found for assortment ID ${assortmentId}`,
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            if (assortmentDetails[0].parent === 4) {
                title = locale === 'hi' ? 'वैलिडिटी चुने पूरे कोटा कोर्स के लिए' : 'Select Validity for Full Kota Classes';
                items.push({
                    image_url: locale === 'hi' ? `${config.cdn_url}engagement_framework/827E0A2A-7150-8D29-7BFA-7AAE05A19676.webp` : `${config.cdn_url}engagement_framework/4AE01C6F-FD73-E0C0-0EF4-9AA1B1CC34A4.webp`,
                    deeplink: '',
                });
            }
            if (!_.isEmpty(upgradeDifferenceAmount)) {
                const couponData = {};
                couponData.student_id = studentID;
                couponData.coupon_code = 'LAGERAHO';
                couponData.source = 'BOTTOM_SHEET';
                CourseMysql.setPreAppliedReferralCode(db.mysql.write, couponData);
                title = locale === 'hi' ? `${assortmentDetails.length ? assortmentDetails[0].display_name : ''} के लिए वैलिडिटी बढ़ाएं` : `Increase Validity for ${assortmentDetails.length ? assortmentDetails[0].display_name : ''}`;
            }
        } else if (locale === 'hi') {
            items.push({
                image_url: `${config.cdn_url}engagement_framework/AA83CD44-18F9-321C-E5FA-89815C50C3F7.webp`,
                deeplink: '',
            });
        } else {
            items.push({
                image_url: `${config.cdn_url}engagement_framework/2FE5C9DF-FF3E-9817-9DD4-C9622AC2B0BC.webp`,
                deeplink: '',
            });
        }
        const promo = {
            type: 'promo_list',
            data: {
                auto_scroll_time_in_sec: autoScrollTime,
                items,
                ratio: bottomSheet ? '4:1' : '1:1',
            },
        };
        if (items.length) {
            widgets.push(promo);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                title,
                widgets,
            },
        };
        if (source === 'PRE_PURCHASE_BUY_BUTTON||TRIAL_END_STATE') {
            responseData.data.header_title = locale === 'hi' ? 'कॅश पेमेंट अवेलेबल' : 'Your Free Trial has Expired';
            responseData.data.header_title_size = '16';
            responseData.data.header_title_color = '#ff0000';
            responseData.data.header_icon = `${config.cdn_url}images/2022/01/08/07-07-50-634-AM_sad_face.webp`;
        }
        if (nudge.length) {
            responseData.data.nudge_id = nudge[0].id;
            responseData.data.is_show = true;
            responseData.data.count = nudge[0].count;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getEmiDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        const { variant_id: variantId } = req.query;
        const [
            childPackages,
            emiDetails,
        ] = await Promise.all([
            Package.getChildPackagesFromVariant(db.mysql.read, variantId),
            Package.getPackageFromVariant(db.mysql.read, variantId),
        ]);
        const data = CourseHelper.createEmiObject(childPackages, emiDetails);

        const widgets = [
            {
                type: 'emi_details',
                data,
            },
        ];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            widgets,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function flagr(req, res, next) {
    try {
        const db = req.app.get('db');
        const flagrArr = ['boards-XI-pricing-Hindi', 'boards-IX-pricing-Hindi', '1'];
        const studentId = '724515';
        console.log('hi');
        const obj = await Flagr.evaluateServiceWrapperPricing({
            db,
            studentId,
            flagrArr,
        });
        console.log(obj);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function myPlans(req, res, next) {
    try {
        const db = req.app.get('db');
        const studentID = req.user.student_id;
        let { studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        const activePackages = await Package.getAllActiveStudentPackagesWithPackagetDetails(db.mysql.read, studentID, studentClass);
        if (activePackages && activePackages.length > 0) {
            const emiIndex = [];
            const promise = [];
            for (let i = 0; i < activePackages.length; i++) {
                if (activePackages[i].type == 'emi') {
                    promise.push(Package.getBulkPackageDetailFromEmiPackageId(db.mysql.read, activePackages[i].new_package_id));
                    emiIndex.push(i);
                }
            }
            const resolvedPromises = await await Promise.all(promise);
            for (let j = 0; j < resolvedPromises.length; j++) {
                activePackages[emiIndex[j]].name = resolvedPromises[j][0].name;
                activePackages[emiIndex[j]].sub_title = resolvedPromises[j][0].description;
                console.log(activePackages);
            }
        }

        const data = [];
        const simpleTextWidget = {
            type: 'simple_text',
            data: {
                title: 'You have currently not purchased any courses.',
            },
        };
        if (activePackages.length === 0) {
            const activeSubs = await CourseMysql.getUserEmiReminder(db.mysql.read, studentID);
            const len = activeSubs.length;
            if (len && !(activeSubs[len - 1].emi_order == activeSubs[len - 1].total_emi)) {
                const packageListWidget = PackageHelper.getMyPlansWidget(activePackages, true);
                data.push(packageListWidget);
            } else {
                data.push(simpleTextWidget);
            }
        } else {
            const packageListWidget = PackageHelper.getMyPlansWidget(activePackages, false);
            data.push(packageListWidget);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    info,
    getEmiDetails,
    flagr,
    myPlans,
};
