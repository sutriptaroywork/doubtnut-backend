const _ = require('lodash');
const moment = require('moment');
const PackageMySQL = require('../mysql/package');
const PackageRedis = require('../redis/package');
// const telemetry = require('../../config/telemetry');
const PayConstant = require('../constants/paymentPackage');
const newtonNotifications = require('../newtonNotifications');
const Properties = require('../mysql/property');
// const Flagr = require('../Utility.flagr');
const SMS2F = require('../Utility.SMS');
// const StudentMySQL = require('../student');
const StudentContainer = require('./student');
const CourseMySQL = require('../mysql/course');
const CourseMySQL2 = require('../mysql/coursev2');
const CourseRedis = require('../redis/coursev2');
const CouponMySQL = require('../mysql/coupon');
const PayMySQL = require('../mysql/payment');
const Data = require('../../data/data');
const WalletUtil = require('../wallet/Utility.wallet');
const CouponContainer = require('./coupon');
const Utility = require('../utility');
const logger = require('../../config/winston').winstonLogger;
const config = require('../../config/config');

const kafka = require('../../config/kafka');

module.exports = class Package {
    static getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    static async setPostPurchaseAssortmentForExplainerVideo(db, assortment_id, studentID) {
        try {
            const res = await PackageRedis.getBoughtAssortments(db.redis.read, studentID);
            if (!_.isNull(res)) {
                const assortmentArray = JSON.parse(res);
                assortmentArray.push(assortment_id);
                // set the assortmentArray in redis
                await PackageRedis.setBoughtAssortments(db.redis.write, studentID, assortmentArray);
            } else {
                // set the assortment id in redis
                await PackageRedis.setBoughtAssortments(db.redis.write, studentID, [assortment_id]);
            }
        } catch (e) {
            console.log(e);
        }
    }

    static async createSubscriptionEntryForStudentId(database, studentId, is_referral) {
        try {
            const { now, today } = this.getNowAndTodayInIST();

            let package_info = await PackageMySQL.getActivePackageForDate(database, today);

            if (_.isEmpty(package_info)) {
                package_info = await PackageMySQL.getDefaultPackageByDuration(database, 30);
            }

            package_info = package_info[0];

            const insertSPS = {};

            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(package_info.duration_in_days, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = is_referral ? 0 : package_info.offer_amount;
            insertSPS.student_package_id = package_info.id;
            insertSPS.is_active = 1;
            insertSPS.doubt_ask = package_info.doubt_ask;

            newtonNotifications.sendNotification(studentId, PayConstant.notification.notification_payment_success, database);

            return await PackageMySQL.startSubscriptionForStudentId(database, insertSPS);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createSubscriptionEntryForStudentIdJoinedViaReferral(database, studentId) {
        try {
            const { now, today } = this.getNowAndTodayInIST();

            let package_info = await PackageMySQL.getActivePackageForDate(database, today);

            if (_.isEmpty(package_info)) {
                package_info = await PackageMySQL.getDefaultPackageByDuration(database, 30);
            }

            package_info = package_info[0];

            let daysToExtend;
            try {
                daysToExtend = await Properties.getValueByBucketAndName(database, PayConstant.referralInfo.bucket, PayConstant.referralInfo.name);
                console.log('daysToExtend', daysToExtend);

                if (_.isEmpty(daysToExtend)) throw Error;
                daysToExtend = parseInt(daysToExtend[0].value);
            } catch (e) {
                console.log(e);
                daysToExtend = 10;
            }

            const insertSPS = {};

            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(daysToExtend, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = 0;
            insertSPS.student_package_id = package_info.id;
            insertSPS.is_active = 1;
            insertSPS.doubt_ask = package_info.doubt_ask;

            newtonNotifications.sendNotification(studentId, PayConstant.notification.notification_payment_success, database);

            return await PackageMySQL.startSubscriptionForStudentId(database, insertSPS);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async extendSubscriptionEntryForStudentId(database, package_info, is_referral, isFirstReferral) {
        try {
            console.log('package_info', package_info);
            const now = moment().add(5, 'hours').add(30, 'minutes');
            let daysToExtend;

            if (isFirstReferral) {
                daysToExtend = 30;
            } else {
                try {
                    daysToExtend = await Properties.getValueByBucketAndName(database, PayConstant.referralInfo.bucket, PayConstant.referralInfo.name);
                    console.log('daysToExtend', daysToExtend);

                    if (_.isEmpty(daysToExtend)) throw Error;
                    daysToExtend = parseInt(daysToExtend[0].value);
                } catch (e) {
                    console.log(e);
                    daysToExtend = 10;
                }
            }
            console.log('daysToExtend', daysToExtend);

            const insertSPS = {};

            const studentId = package_info.student_id;
            insertSPS.student_id = studentId;

            if (moment(package_info.end_date).isBefore(now, 'day')) {
                // user's subscription has expired
                insertSPS.start_date = moment(now).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            } else {
                // start after date of their expiry
                insertSPS.start_date = moment(package_info.end_date).add(1, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            }

            insertSPS.end_date = moment(insertSPS.start_date).add(daysToExtend, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = is_referral ? 0 : package_info.offer_amount;
            insertSPS.student_package_id = package_info.id;
            insertSPS.is_active = 1;
            insertSPS.doubt_ask = package_info.doubt_ask;

            const notificationToSend = PayConstant.notification.notification_referral_extend;

            notificationToSend.title.replace('<days>', daysToExtend);

            newtonNotifications.sendNotification(studentId, PayConstant.notification.notification_referral_extend, database);

            return await PackageMySQL.startSubscriptionForStudentId(database, insertSPS);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createSubscriptionEntryForStudentIdByPackageId(db, studentId, packageId, amount = 199) {
        try {
            let package_info = await PackageMySQL.getNewPackageById(db.mysql.read, packageId);

            if (_.isEmpty(package_info)) {
                package_info = await PackageMySQL.getDefaultPackageByDuration(db.mysql.read, 30);
            }

            package_info = package_info[0];

            const { now, today } = this.getNowAndTodayInIST();

            const student_package_active = await PackageMySQL.getStudentActivePackage(db.mysql.read, studentId, today);

            let days_to_start_from = 0;
            if (!_.isEmpty(student_package_active)) {
                const end = moment(student_package_active[0].end_date, 'YYYY-MM-DD');
                days_to_start_from = end.diff(today, 'days') + 1;
            }

            const insertSPS = {};

            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).add(days_to_start_from, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(package_info.duration_in_days, 'days').add(days_to_start_from, 'days').endOf('day')
                .format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = amount;
            insertSPS.student_package_id = package_info.id;
            insertSPS.new_package_id = package_info.id;

            insertSPS.doubt_ask = package_info.doubt_ask;
            insertSPS.is_active = 1;

            newtonNotifications.sendNotification(studentId, PayConstant.notification.notification_payment_success, db.mysql.read);
            return await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async savePackageDetailsSummary(db, studentId, summary) {
        try {
            let packageType = 'nonemi';
            let total = 0;
            let delta_revenue = 0;
            summary.master_subscription_start_date = summary.start_date;
            summary.master_subscription_end_date = summary.validity;
            if (summary.packageDetail[0].type === 'emi') {
                packageType = 'emi';
                const emiCount = await PackageMySQL.getEmiCount(db.mysql.read, summary.master_package_id);
                total = emiCount[0].count;
                if (summary.packageDetail[0].emi_order === 1) {
                    summary.master_subscription_end_date = moment(summary.start_date).add(summary.packageDetail[0].duration_in_days, 'days').format('YYYY-MM-DD HH:mm:ss');
                    console.log(moment(summary.start_date).add(summary.packageDetail[0].duration_in_days, 'days'));
                } else {
                    const prevEmi = await PackageMySQL.getPreviousEmiDetails(db.mysql.read, summary.master_package_id, studentId);
                    summary.master_subscription_start_date = prevEmi[prevEmi.length - 1].master_subscription_start_date;
                    summary.master_subscription_end_date = prevEmi[prevEmi.length - 1].master_subscription_end_date;
                }
            }

            // let prevPackage;
            // if (summary.prev_package) {
            //     prevPackage = await PackageMySQL.getPackageById(db.mysql.write, summary.prev_package);
            //     if (prevPackage && prevPackage.length > 0) {
            //         if (prevPackage[0].subcategory_id === summary.packageDetail[0].subcategory_id) {
            //             packageType = prevPackage[0].duration_in_days < summary.packageDetail[0].duration_in_days ? `upgrade-${packageType}` : packageType;
            //         } else {
            //             packageType = prevPackage[0].duration_in_days <= summary.packageDetail[0].duration_in_days ? `switch-${packageType}` : packageType;
            //         }
            //     }
            // }

            let mStartDate = summary.master_subscription_start_date;
            let mEndDate = summary.master_subscription_end_date;

            if (summary.notes && (summary.notes.type === 'upgrade' || summary.notes.type === 'switch')) {
                const prevSum = await PackageMySQL.prevPaymentSummary(db.mysql.write, summary.notes.packageFrom, studentId);
                if (summary.notes.type === 'upgrade') {
                    mStartDate = moment(prevSum[0].master_subscription_start_date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                    mEndDate = moment(mStartDate).add(summary.packageDetail[0].duration_in_days, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
                }
                delta_revenue = summary.package_amount - prevSum[0].package_amount;
                console.log(prevSum);
                for (let i = 0; i < prevSum.length; i++) {
                    const promise = [];
                    promise.push(PackageMySQL.updateNextPackageInPaymentSummary(db.mysql.write, prevSum[i].id, summary.packageDetail[0].id));
                    promise.push(PackageMySQL.markSubscriptionInactive(db.mysql.write, prevSum[i].subscription_id));
                    await Promise.all(promise);
                }
                packageType = `${summary.notes.type}-${packageType}`;
            }

            const insertObj = {
                student_id: studentId,
                package_id: summary.packageDetail[0].id,
                package_amount: summary.package_amount,
                type: summary.packageDetail[0].type,
                package_duration: summary.packageDetail[0].duration_in_days,
                amount_paid: summary.payment_info[0].amount,
                txn_id: summary.payment_info[0].partner_txn_id,
                payment_type: packageType,
                next_part_payment_amount: summary.next_amount,
                next_part_payment_date: summary.next_payment_date,
                pending_amount: summary.pending_amount,
                is_valid: true,
                package_validity: summary.validity,
                master_package_id: summary.master_package_id,
                subscription_id: summary.subscription_id,
                subscription_start: summary.start_date,
                master_subscription_start_date: mStartDate,
                master_subscription_end_date: mEndDate,
                emi_order: summary.packageDetail[0].emi_order,
                total_emi: total,
                delta_revenue,
            };

            return await PackageMySQL.setPaymentSummary(db.mysql.write, insertObj);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createSubscriptionEntryForTrial(db, studentId, packageId, amount, flagrResponse) {
        try {
            let packageInfo = await PackageMySQL.getPackageById(db.mysql.write, packageId);
            // get flagger details

            const variantId = flagrResponse.variantID;
            const flagId = flagrResponse.flagID;
            packageInfo = packageInfo[0];

            const { now } = this.getNowAndTodayInIST();
            const insertSPS = {};

            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(packageInfo.duration_in_days, 'days').endOf('day')
                .format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = amount;
            insertSPS.student_package_id = packageInfo.id;
            insertSPS.doubt_ask = packageInfo.doubt_ask;
            insertSPS.is_active = 1;
            insertSPS.meta_info = JSON.stringify({ flag_id: flagId, variant_id: variantId });
            return await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createSubscriptionEntryForTrialV1(db, studentId, assortmentID, amount, trialDuration, metaInfo = null) {
        try {
            // eslint-disable-next-line prefer-const
            let [packageInfo, trialEntryByAssortment] = await Promise.all([
                PackageMySQL.getPackageByAssortmentIdForTrial(db.mysql.read, assortmentID),
                PackageMySQL.getTrialEntryByAssortmentId(db.mysql.read, studentId, assortmentID),
            ]);
            if (trialEntryByAssortment.length) {
                trialEntryByAssortment[0].insertId = trialEntryByAssortment[0].id;
                return trialEntryByAssortment[0];
            }
            packageInfo = packageInfo[packageInfo.length - 1];
            const { now } = this.getNowAndTodayInIST();
            const insertSPS = {};
            const diff = moment(packageInfo.start_date).diff(now, 'days');
            if (diff > 0) {
                trialDuration += (diff + 1);
            }
            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(trialDuration, 'days').endOf('day')
                .format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = amount;
            insertSPS.meta_info = metaInfo;

            insertSPS.student_package_id = 0;
            insertSPS.new_package_id = packageInfo.id;
            insertSPS.doubt_ask = packageInfo.doubt_ask;
            insertSPS.is_active = 1;
            return await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createSubscriptionEntryForTrialUsingPackageId(db, studentId, package_id, amount) {
        try {
            const [packageInfo, studentDetails] = await Promise.all([
                PackageMySQL.getPackageDetailsFromPackageId(db.mysql.read, package_id),
                StudentContainer.getById(studentId, db),
            ]);
            let trialDuration = packageInfo[0].duration_in_days;
            const { now } = this.getNowAndTodayInIST();
            const insertSPS = {};
            const diff = moment(packageInfo[0].start_date).diff(now, 'days');
            if (diff > 0) {
                trialDuration += (diff + 1);
            }
            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(trialDuration, 'days').endOf('day')
                .format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = amount;
            insertSPS.student_package_id = 0;
            insertSPS.new_package_id = packageInfo[0].id;
            insertSPS.doubt_ask = packageInfo[0].doubt_ask;
            insertSPS.is_active = 1;
            await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
            const notificationPayload = {
                event: 'course_details',
                title: Data.postPurchaseCommunication.freeCourseStart.notification.title,
                message: Data.postPurchaseCommunication.freeCourseStart.notification.message,
                firebase_eventtag: Data.postPurchaseCommunication.freeCourseStart.notification.firebaseTag,
                s_n_id: Data.postPurchaseCommunication.freeCourseStart.notification.firebaseTag,
                data: JSON.stringify({
                    id: packageInfo[0].assortment_id,
                }),
            };
            Utility.sendFcm(studentId, studentDetails[0].gcm_reg_id, notificationPayload);
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async getDaysToStart(packageInfo, db, studentId, packageId) {
        let daysToStartFrom = 0;
        const { today } = this.getNowAndTodayInIST();
        const subscription = await CourseMySQL.getUserSubscription(db.mysql.read, studentId);
        const MasterCategory = await PackageMySQL.getMasterCategory(db.mysql.read, packageInfo.subcategory_id);
        const trialCategory = await PackageMySQL.getTrialCategory(db.mysql.read, MasterCategory[0].category_id);
        let sameCategorySub;
        if (subscription && subscription.length) sameCategorySub = subscription.filter((e) => e.subcategory_id === packageInfo.subcategory_id || (e.original_amount === -1 && e.package_id === trialCategory[0].id));
        if (sameCategorySub && sameCategorySub.length) {
            sameCategorySub = sameCategorySub.reverse();
            const end = moment(sameCategorySub[0].end_date, 'YYYY-MM-DD');
            const momentEnd = moment(sameCategorySub[0].end_date);
            const momentNow = moment().add(5, 'hours').add(30, 'minutes');
            if (momentEnd > momentNow) daysToStartFrom = end.diff(today, 'days') + 1;
        }
        return daysToStartFrom;
    }

    static async getDaysToStartByVariantId(db, student_id, variant_id) {
        let daysToStartFrom = 0;
        const { today } = this.getNowAndTodayInIST();
        const promise = [];
        promise.push(CourseMySQL.getUserSubscriptionByVariantId(db.mysql.read, student_id));
        promise.push(PackageMySQL.getVariantInfo(db.mysql.read, variant_id));
        const [userSubscription, variantInfo] = await Promise.all(promise);
        let sameCategorySub = [];

        if (userSubscription && userSubscription.length && variantInfo && variantInfo.length) {
            for (let i = 0; i < userSubscription.length; i++) {
                if (userSubscription[i].assortment_id == variantInfo[0].assortment_id && userSubscription[i].amount > -1) {
                    sameCategorySub.push(userSubscription[i]);
                } else if (userSubscription[i].assortment_id == variantInfo[0].assortment_id && userSubscription[i].amount == -1) {
                    PackageMySQL.markSubscriptionInactive(db.mysql.write, userSubscription[i].sub_id);
                }
            }
        }
        if (sameCategorySub && sameCategorySub.length) {
            sameCategorySub = sameCategorySub.reverse();
            const end = moment(sameCategorySub[0].end_date, 'YYYY-MM-DD');
            const momentEnd = moment(sameCategorySub[0].end_date);
            const momentNow = moment().add(5, 'hours').add(30, 'minutes');
            if (momentEnd > momentNow) daysToStartFrom = end.diff(today, 'days') + 1;
        }
        return daysToStartFrom;
    }

    static async sendNotificationMessage(db, package_info, studentId) {
        const MasterCategory = await PackageMySQL.getMasterCategory(db.mysql.read, package_info.subcategory_id);
        const categoryName = MasterCategory[0] ? (MasterCategory[0].category_id != 1 ? MasterCategory[0].category : 'VMC') : 'VMC';
        const meessage = PayConstant.getPaymentSuccessMessage(categoryName);
        console.log(meessage);
        newtonNotifications.sendNotification(studentId, meessage, db.mysql.write);
        return meessage;
    }

    static async createSubscriptionEntryForStudentIdByPackageIdAndAmount(db, studentId, packageId, amount, config = null, flagrResponse, paymentFor, summary, payment_info_id = null, version) {
        try {
            let package_info = await PackageMySQL.getPackageById(db.mysql.write, packageId);
            let isTrial = 0;
            // get flagger details
            if (!summary) {
                isTrial = amount == -1 ? 1 : 0;
                summary = {
                    packageId,
                    payment_info: [
                        {
                            amount: 0,
                            order_id: null,
                        },
                    ],
                };
            }
            summary.packageDetail = [];

            if (_.isEmpty(package_info)) {
                package_info = await PackageMySQL.getDefaultPackageByAmount(db.mysql.write, amount);
            }
            summary.packageDetail[0] = package_info[0];
            // const flagrResponse = await Flagr.evaluate(db, studentId.toString(), {}, config.package_subscription_flagr_id, 500);
            let { variantAttachment } = flagrResponse;
            if (variantAttachment.is_new) variantAttachment = variantAttachment[summary.category[0].course_type];
            const variantId = flagrResponse.variantID;
            const flagId = flagrResponse.flagID;
            for (let i = 0; i < variantAttachment.package_duration.length; i++) {
                if (variantAttachment.package_duration[i] == package_info[0].duration_in_days) {
                    // set offer amount
                    summary.package_amount = variantAttachment.final_price[i];
                }
            }
            package_info = package_info[0];

            const { now, today } = this.getNowAndTodayInIST();
            const referenceType = (paymentFor !== undefined && paymentFor === 'liveclass') ? paymentFor : 'default';
            const student_package_active = await PackageMySQL.getStudentActivePackageByReference(db.mysql.write, studentId, today, referenceType);
            let daysToStartFrom = await Package.getDaysToStart(package_info, db, studentId, packageId);

            const insertSPS = {};
            if (summary.notes && (summary.notes.type === 'upgrade' || summary.notes.type === 'switch')) daysToStartFrom = 0;

            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).add(daysToStartFrom, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(package_info.duration_in_days, 'days').add(daysToStartFrom, 'days').endOf('day')
                .format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = amount;
            insertSPS.student_package_id = package_info.id;
            insertSPS.doubt_ask = package_info.doubt_ask;
            insertSPS.is_active = 1;
            insertSPS.meta_info = JSON.stringify({ flag_id: flagId, variant_id: variantId });
            // (paymentFor !== undefined && paymentFor === 'liveclass') ? PayConstant.liveclassNotification.notification_payment_success : PayConstant.notification.notification_payment_success;
            await Package.sendNotificationMessage(db, package_info, studentId);

            // const studentInfo = await StudentMySQL.getStudent(studentId, db.mysql.write);
            const studentInfo = await StudentContainer.getById(studentId, db);
            if (referenceType === 'default') {
                SMS2F.sendSMS(config, 'vip_purchase_successful', [package_info.duration_in_days, 'Days', 'Doubtnut Classes', studentInfo[0].mobile], studentInfo[0].mobile);
            }
            summary.validity = insertSPS.end_date;
            summary.next_amount = 0;
            summary.pending_amount = 0;
            summary.next_payment_date = null;
            summary.prev_package = student_package_active.length ? student_package_active[0].student_package_id : null;
            summary.master_package_id = packageId;
            summary.start_date = insertSPS.start_date;
            const newPackageDetails = await PackageMySQL.getNewPackageId(db.mysql.read, insertSPS.student_package_id, amount);
            if (newPackageDetails && newPackageDetails.length > 0) {
                // insertSPS.student_package_id = newPackageDetails[0].id;
                // await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
                insertSPS.variant_id = newPackageDetails[0].id;
                insertSPS.new_package_id = newPackageDetails[0].package_id;
            }
            insertSPS.payment_info_id = payment_info_id;
            const [spsInfo, psInfo] = await Promise.all([
                PackageMySQL.getSubscriptionDetailsWithPaymentInfoId(db.mysql.write, payment_info_id),
                PackageMySQL.getPaymentSummaryWithTxnId(db.mysql.write, summary.payment_info[0].partner_txn_id),
            ]);
            let result = {};
            if (spsInfo.length === 0) {
                result = await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
                summary.subscription_id = result.insertId;
            } else {
                summary.subscription_id = spsInfo[0].id;
            }
            if (!isTrial && psInfo.length === 0) {
                await Package.savePackageDetailsSummary(db, studentId, summary);
            }
            StudentContainer.generatePinBL(db, Math.floor(1000 + Math.random() * 9000).toString(), studentInfo[0], false);

            return result;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async setTrendingCoursesDataInRedis(db, variantInfo, studentID) {
        try {
            let expiry = 60 * 24 * 30;
            CourseRedis.setTrendingCourses(db.redis.write, 1, `${variantInfo[0].class}_${variantInfo[0].category}`, variantInfo[0].assortment_id, expiry);
            const userLocation = await CourseMySQL2.getStudentLocation(db.mysql.read, studentID);
            if (userLocation.length && userLocation[0].state) {
                expiry = 60 * 24;
                CourseRedis.setTrendingCourses(db.redis.write, 1, `${variantInfo[0].class}_location_${userLocation[0].state}`, variantInfo[0].assortment_id, expiry);
            }
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createSubscriptionEntryForStudentIdByPackageIdAndAmountV1(db, studentId, packageId, amount, config = null, flagrResponse, paymentFor, package_info, summary, payment_info_id = null, version) {
        try {
            if (_.isEmpty(package_info)) {
                package_info = await PackageMySQL.getDefaultPackageByAmount(db.mysql.write, amount);
            }
            const variantId = flagrResponse.variantID;
            const flagId = flagrResponse.flagID;
            let next_amount = 0;
            let pending_amount = 0;
            package_info = package_info[0];

            let { variantAttachment } = flagrResponse;
            if (variantAttachment.is_new) variantAttachment = variantAttachment[summary.category[0].course_type];

            let emiEndDate; const emiDetails = variantAttachment.emi_details.filter((e) => e.package_duration === package_info.duration_in_days);
            if (!package_info.is_last) {
                next_amount = emiDetails[0].downpayment[package_info.emi_order];
                pending_amount = _.sum(emiDetails[0].downpayment.slice(package_info.emi_order));
                emiEndDate = emiDetails[0].duration[package_info.emi_order - 1];
            } else {
                emiEndDate = emiDetails[0].package_duration - (_.sum(emiDetails[0].duration));
            }

            const { now, today } = this.getNowAndTodayInIST();
            const referenceType = (paymentFor !== undefined && paymentFor === 'liveclass') ? paymentFor : 'default';
            const student_package_active = await PackageMySQL.getStudentActivePackageByReference(db.mysql.write, studentId, today, referenceType);

            let daysToStartFrom = await Package.getDaysToStart(package_info, db, studentId, package_info.master_parent);

            const insertSPS = {};
            if (summary.notes && (summary.notes.type === 'upgrade' || summary.notes.type === 'switch')) daysToStartFrom = 0;

            insertSPS.student_id = studentId;
            insertSPS.start_date = moment(now).add(daysToStartFrom, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
            insertSPS.end_date = moment(now).add(emiEndDate, 'days').add(daysToStartFrom, 'days').endOf('day')
                .format('YYYY-MM-DD HH:mm:ss');
            insertSPS.amount = amount;
            insertSPS.student_package_id = package_info.id;
            insertSPS.doubt_ask = package_info.doubt_ask;
            insertSPS.is_active = 1;
            insertSPS.meta_info = JSON.stringify({ flag_id: flagId, variant_id: variantId });
            // const meessage = (paymentFor !== undefined && paymentFor === 'liveclass') ? PayConstant.liveclassNotification.notification_payment_success : PayConstant.notification.notification_payment_success;
            await Package.sendNotificationMessage(db, package_info, studentId);
            // const studentInfo = await StudentMySQL.getStudent(studentId, db.mysql.write);
            const studentInfo = await StudentContainer.getById(studentId, db);
            if (referenceType === 'default') {
                SMS2F.sendSMS(config, 'vip_purchase_successful', [package_info.duration_in_days, 'Days', 'Doubtnut Classes', studentInfo[0].mobile], studentInfo[0].mobile);
            }

            summary.validity = insertSPS.end_date;
            summary.next_amount = next_amount;
            summary.pending_amount = pending_amount;
            summary.next_payment_date = pending_amount > 0 ? insertSPS.end_date : null;
            summary.master_package_id = package_info.master_parent;
            summary.package_amount = emiDetails[0].price;
            if (package_info.emi_order === 1) summary.prev_package = student_package_active.length ? student_package_active[0].student_package_id : null;
            summary.start_date = insertSPS.start_date;
            const newPackageDetails = await PackageMySQL.getNewPackageId(db.mysql.read, insertSPS.student_package_id, amount);
            if (newPackageDetails && newPackageDetails.length > 0) {
                // insertSPS.student_package_id = newPackageDetails[0].id;
                // await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
                insertSPS.variant_id = newPackageDetails[0].id;
                insertSPS.new_package_id = newPackageDetails[0].package_id;
            }
            insertSPS.payment_info_id = payment_info_id;
            const [spsInfo, psInfo] = await Promise.all([
                PackageMySQL.getSubscriptionDetailsWithPaymentInfoId(db.mysql.write, payment_info_id),
                PackageMySQL.getPaymentSummaryWithTxnId(db.mysql.write, summary.payment_info[0].partner_txn_id),
            ]);
            let result = {};
            if (spsInfo.length === 0) {
                result = await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
                summary.subscription_id = result.insertId;
            } else {
                summary.subscription_id = spsInfo[0].id;
            }
            if (psInfo.length === 0) {
                await Package.savePackageDetailsSummary(db, studentId, summary);
            }

            StudentContainer.generatePinBL(db, Math.floor(1000 + Math.random() * 9000).toString(), studentInfo[0], false);
            return result;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async createEntriesInSpsAndPsTable(db, variantInfo, payment_info, notes, isBundle = false, bundleListValue, walletTransactionDetails = []) {
        try {
            let couponDetails = [];
            const insertSPS = {};
            insertSPS.is_active = 1;
            insertSPS.doubt_ask = variantInfo[0].doubt_ask;
            insertSPS.student_id = payment_info[0].student_id;
            insertSPS.variant_id = payment_info[0].variant_id;
            insertSPS.new_package_id = variantInfo[0].package_id;
            insertSPS.amount = payment_info[0].amount;
            insertSPS.payment_info_id = payment_info[0].id;
            if (isBundle) {
                insertSPS.meta_info = payment_info[0].variant_id;
                insertSPS.variant_id = variantInfo[0].vid;
                insertSPS.amount = bundleListValue ? 0 : payment_info[0].amount;
            }
            if (!_.isEmpty(payment_info[0].updated_by) && payment_info[0].updated_by != 'system') {
                insertSPS.updated_by = payment_info[0].updated_by;
            }
            const { now, today } = this.getNowAndTodayInIST();
            let packageDuration = 0;
            let next_amount = 0;
            const delta_revenue = 0;
            let upgradeCallFromApp = false;
            let prevSum;
            const daysToStartFrom = await Package.getDaysToStartByVariantId(db, payment_info[0].student_id, payment_info[0].variant_id);
            if (variantInfo[0].type.toLowerCase() == 'emi') {
                packageDuration += variantInfo[0].emi_duration;
            } else {
                packageDuration += variantInfo[0].duration_in_days;
            }
            if (_.isEmpty(notes)) {
                const [paymentMeta, upgradeCheck] = await Promise.all([
                    PayMySQL.getPaymentInfoMeta(db.mysql.read, { payment_info_id: payment_info[0].id }),
                    this.getDifferenceAmountForUpgradeSubscription({
                        db, studentID: payment_info[0].student_id, assortmentID: variantInfo[0].assortment_id,
                    }),
                ]);
                if (paymentMeta.length && !paymentMeta[0].is_web && !_.isNull(paymentMeta[0].notes)) {
                    try {
                        notes = JSON.parse(paymentMeta[0].notes);
                    } catch (e) {
                        logger.error('Payment Error: Payment Meta Notes Error', e);
                    }
                } else if (!_.isEmpty(upgradeCheck) && variantInfo[0].display_price > upgradeCheck.amount && upgradeCheck.duration < variantInfo[0].duration_in_days) {
                    notes = {};
                    notes.type = 'upgrade';
                    notes.subscriptionId = upgradeCheck.subscription_id;
                    upgradeCallFromApp = true;
                }
            }
            if (!_.isEmpty(notes) && (notes.type === 'upgrade' || notes.type === 'switch') && notes.subscriptionId) {
                if (insertSPS.amount < 0) {
                    insertSPS.amount = 0;
                }
                if (notes.type === 'upgrade' && !upgradeCallFromApp) {
                    const subscriptionCheck = await this.getDifferenceAmountForUpgradeSubscription({
                        db, studentID: payment_info[0].student_id, assortmentID: variantInfo[0].assortment_id,
                    });
                    if (!_.isEmpty(subscriptionCheck)) {
                        notes.subscriptionId = subscriptionCheck.subscription_id;
                    }
                }
                prevSum = await PackageMySQL.prevPaymentSummaryFromNewPackageId(db.mysql.write, notes.subscriptionId, payment_info[0].student_id);
                insertSPS.start_date = moment(prevSum[0].master_subscription_start_date).startOf('day').format('YYYY-MM-DD HH:mm:ss');
                if (notes.type === 'upgrade' && moment(now).diff(moment(prevSum[0].master_subscription_end_date), 'days') > 0) {
                    insertSPS.start_date = moment(now).startOf('day').startOf('day').format('YYYY-MM-DD HH:mm:ss');
                }
                let days = 0;
                if (notes.type === 'upgrade' && moment(now).diff(prevSum[0].master_subscription_end_date, 'days') > 0) {
                    days = packageDuration - prevSum[0].package_duration;
                } else {
                    days = packageDuration;
                }
                insertSPS.end_date = moment(insertSPS.start_date).add(days, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
                // Check if we need to recompute endate or not (Ony for no condition switch panel for AS)
                if (notes.type === 'switch' && notes.changeEndDate) {
                    insertSPS.end_date = moment(prevSum[0].master_subscription_end_date).endOf('day').format('YYYY-MM-DD HH:mm:ss');
                }
            } else {
                let courseStartDays = 0;
                let courseStartDate = variantInfo[0].start_date;
                if (variantInfo[0].batch_id > 1) {
                    const latestBatchDetails = await CourseMySQL2.getLastestBatchByAssortment(db.mysql.read, variantInfo[0].assortment_id);
                    courseStartDate = (latestBatchDetails.length) ? latestBatchDetails[0].start_date : courseStartDate;
                }
                if (courseStartDate && moment(now).add(5, 'hours').add(30, 'minutes') < courseStartDate && daysToStartFrom == 0) {
                    courseStartDays = moment(courseStartDate).diff(moment(now).add(5, 'hours').add(30, 'minutes'), 'days') + 1;
                }
                insertSPS.start_date = moment(now).add(daysToStartFrom, 'days').startOf('day').format('YYYY-MM-DD HH:mm:ss');
                insertSPS.end_date = moment(now).add(packageDuration, 'days').add(courseStartDays, 'days').add(daysToStartFrom, 'days')
                    .endOf('day')
                    .format('YYYY-MM-DD HH:mm:ss');
            }
            if (payment_info[0].coupon_code) {
                couponDetails = await CouponMySQL.getCouponByCode(payment_info[0].coupon_code, db.mysql.read);
                if (couponDetails.length && couponDetails[0].type === 'extend') {
                    insertSPS.end_date = moment(insertSPS.end_date).add(couponDetails[0].value, 'days').format('YYYY-MM-DD HH:mm:ss');
                }
            }
            const [spsInfo, psInfo] = await Promise.all([
                PackageMySQL.getSubscriptionDetailsWithPaymentInfoIdAndVariantId(db.mysql.write, payment_info[0].id, insertSPS.variant_id),
                PackageMySQL.getPaymentSummaryWithTxnIdAndVariantId(db.mysql.write, payment_info[0].partner_txn_id, insertSPS.variant_id),
            ]);
            let result = {};
            if (spsInfo.length === 0) {
                result = await PackageMySQL.startSubscriptionForStudentId(db.mysql.write, insertSPS);
            } else {
                if (payment_info[0].status === 'FAILURE') {
                    const paymentInfoReconcile = await PayMySQL.getPaymentInfoReconcileByPaymentInfoId(db.mysql.write, payment_info[0].id);
                    let reconcileEntry = false;

                    if (!_.isEmpty(paymentInfoReconcile) && moment(spsInfo[0].end_date).diff(moment(), 'd') >= 0) {
                        reconcileEntry = true;
                        const spsUpdateObj = {
                            is_active: 1,
                        };
                        PackageMySQL.updateSubscriptionById(db.mysql.write, spsInfo[0].id, spsUpdateObj);
                    }
                    db.mongo.write.collection('payment_failure_reconcile').save({ id: payment_info[0].id, status: reconcileEntry, webhook_created_at: moment().add(5, 'hours').add(30, 'minutes').toDate() });
                }
                result.insertId = spsInfo[0].id;
            }
            if (psInfo.length === 0) {
                const insertSummary = {};
                insertSummary.student_id = payment_info[0].student_id;
                insertSummary.type = variantInfo[0].type;
                insertSummary.package_duration = variantInfo[0].duration_in_days;
                insertSummary.amount_paid = payment_info[0].amount;
                if (!_.isEmpty(walletTransactionDetails)) {
                    insertSummary.amount_paid += (walletTransactionDetails[0].cash_amount || 0);
                }
                insertSummary.txn_id = payment_info[0].partner_txn_id;
                if (variantInfo[0].type.toLowerCase() == 'subscription') {
                    insertSummary.payment_type = 'nonemi';
                } else {
                    insertSummary.payment_type = 'emi';
                }
                insertSummary.is_valid = 1;
                insertSummary.subscription_id = result.insertId;
                if (variantInfo[0].type.toLowerCase() == 'emi') {
                    const packageAmountDetail = await PackageMySQL.getVariantInfo(db.mysql.read, variantInfo[0].master_parent_variant_id);
                    insertSummary.package_amount = packageAmountDetail[0].display_price;
                    if (!variantInfo[0].is_last) {
                        const nextEmiPackage = await PackageMySQL.getEmiPackageDetails(db.mysql.read, variantInfo[0].master_parent_variant_id, variantInfo[0].emi_order + 1);
                        next_amount = nextEmiPackage[0].display_price;
                        const nextEmiPackages = await PackageMySQL.getNextEmiPackageDetails(db.mysql.read, variantInfo[0].master_parent_variant_id, variantInfo[0].emi_order);
                        insertSummary.pending_amount = _.sumBy(nextEmiPackages, (p) => p.display_price);
                    } else {
                        insertSummary.pending_amount = 0;
                    }
                    insertSummary.next_part_payment_amount = next_amount;
                    insertSummary.next_part_payment_date = insertSPS.end_date;
                    if (variantInfo[0].emi_order == 1) {
                        const emiPackageDuration = await PackageMySQL.getNewPackageById(db.mysql.read, variantInfo[0].master_parent);
                        insertSummary.master_subscription_start_date = insertSPS.start_date;
                        insertSummary.master_subscription_end_date = moment(insertSPS.start_date).add(emiPackageDuration[0].duration_in_days, 'days').endOf('day').format('YYYY-MM-DD HH:mm:ss');
                    } else {
                        // const firstEmiPackage = await PackageMySQL.getEmiPackageDetails(db.mysql.read, variantInfo[0].master_parent_variant_id, 1);
                        // const sub = await PackageMySQL.getSubscriptionDetails(db.mysql.read, payment_info[0].student_id, firstEmiPackage[0].variant_id);
                        const firstEmiSummary = await PackageMySQL.getPreviousEmiDetailsByVariant(db.mysql.read, payment_info[0].student_id, variantInfo[0].master_parent_variant_id);
                        insertSummary.master_subscription_start_date = firstEmiSummary[0].master_subscription_start_date;
                        insertSummary.master_subscription_end_date = firstEmiSummary[0].master_subscription_end_date;
                    }
                    insertSummary.emi_order = variantInfo[0].emi_order;
                    insertSummary.total_emi = variantInfo[0].total_emi;
                } else {
                    insertSummary.package_amount = variantInfo[0].display_price;
                    insertSummary.master_subscription_start_date = insertSPS.start_date;
                    insertSummary.master_subscription_end_date = insertSPS.end_date;
                }
                insertSummary.package_validity = insertSPS.end_date;
                insertSummary.subscription_start = insertSPS.start_date;
                insertSummary.coupon_code = payment_info[0].coupon_code;
                insertSummary.total_amount = payment_info[0].total_amount;
                insertSummary.discount = payment_info[0].discount;
                insertSummary.variant_id = payment_info[0].variant_id;
                insertSummary.new_package_id = variantInfo[0].package_id;
                insertSummary.master_variant_id = variantInfo[0].master_parent_variant_id;
                CourseRedis.deleteUserEmiPackages(db.redis.write, payment_info[0].student_id);
                // const studentInfo = await StudentMySQL.getStudent(payment_info[0].student_id, db.mysql.write);
                const studentInfo = await StudentContainer.getById(payment_info[0].student_id, db);
                StudentContainer.generatePinBL(db, Math.floor(1000 + Math.random() * 9000).toString(), studentInfo[0], false);
                // coupon section
                const courseDetails = await CourseMySQL2.getCourseDetailsFromVariantId(db.mysql.write, payment_info[0].variant_id);
                if (courseDetails.length && _.includes(['course', 'course_bundle'], courseDetails[0].assortment_type)) {
                    CouponContainer.createReferralCoupon(db, payment_info[0].student_id);
                    try {
                        /**
                         * Old Flow
                         const [referralCoupon, ceoReferralCouponClaims] = await Promise.all([
                            CouponMySQL.getStudentDetailsByStudentReferralCoupons(db.mysql.read, payment_info[0].coupon_code),
                            PackageMySQL.getGetCouponClaimedTotal(db.mysql.read, payment_info[0].coupon_code),
                         ]);
                         */
                        const referralCoupon = await CouponMySQL.getStudentDetailsByStudentReferralCoupons(db.mysql.read, payment_info[0].coupon_code);

                        if (referralCoupon.length) {
                            await PayMySQL.createPaymentReferralEntry(db.mysql.write, {
                                payment_info_id: payment_info[0].id,
                                coupon_code: payment_info[0].coupon_code,
                            });
                            const mlmReferralKafkaData = {
                                payment_info_id: payment_info[0].id,
                            };
                            kafka.publish(kafka.topics.mlmReferral, 1, mlmReferralKafkaData);

                            /**
                             * Old Flow
                            const checkUserForCEOReferralTg = await CouponMySQL.getUserForCEOReferralProgramWithStudentId(db.mysql.read, referralCoupon[0].student_id);
                            console.log(checkUserForCEOReferralTg);
                            let amount = 0;
                            console.log(ceoReferralCouponClaims.length);
                            console.log(checkUserForCEOReferralTg.length > 0 && !_.isEmpty(Data.ceoReferralProgram.claim_no[ceoReferralCouponClaims.length]));
                            if (checkUserForCEOReferralTg.length > 0 && !_.isEmpty(Data.ceoReferralProgram.claim_no[ceoReferralCouponClaims.length])) {
                                amount = Data.ceoReferralProgram.claim_no[ceoReferralCouponClaims.length].referral_amount;
                            } else if (referralCoupon[0].student_id % 2 === 0 && !checkUserForCEOReferralTg.length) {
                                amount = 150;
                            }
                            console.log(amount);
                            if (amount > 0) {
                                CouponMySQL.addReferrerStudentIdForPaytmDisburse(db.mysql.write, {
                                    invitor_student_id: referralCoupon[0].student_id,
                                    mobile: referralCoupon[0].mobile,
                                    invitee_student_id: payment_info[0].student_id,
                                    amount,
                                    payment_info_id: payment_info[0].id,
                                    entry_for: 'Old Method',
                                    order_id: (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100),
                                });
                            }
                             */
                        }
                        if (['course', 'class'].includes(variantInfo[0].assortment_type) && insertSPS.amount >= 0) {
                            this.setPostPurchaseAssortmentForExplainerVideo(db, variantInfo[0].assortment_id, payment_info[0].student_id);
                        }
                    } catch (e) {
                        logger.error('Payment Error: Payment Error', e);
                    }
                }
                if (isBundle) {
                    insertSummary.variant_id = variantInfo[0].vid;
                    insertSummary.amount_paid = bundleListValue ? 0 : insertSummary.amount_paid;
                }
                if (!_.isEmpty(notes) && (notes.type.toLowerCase() === 'upgrade' || notes.type.toLowerCase() === 'switch')) {
                    insertSummary.payment_type = `${notes.type}-${insertSummary.payment_type}`;
                    insertSummary.delta_revenue = insertSummary.package_amount - prevSum[0].package_amount;
                    const promise = [];
                    promise.push(PackageMySQL.markSubscriptionInactive(db.mysql.write, notes.subscriptionId));
                    promise.push(PackageMySQL.setPaymentSummary(db.mysql.write, insertSummary));
                    const [inactiveSubscription, resultInsert] = await Promise.all(promise);
                    insertSummary.next_ps_id = resultInsert.insertId;
                    PackageMySQL.updateNextPackageInPaymentSummaryUsingSubscriptionId(db.mysql.write, { subscriptionId: notes.subscriptionId, next_package_id: variantInfo[0].package_id, next_ps_id: insertSummary.next_ps_id });
                    return resultInsert;
                }
                if (payment_info[0].coupon_code) {
                    couponDetails = couponDetails.length ? couponDetails : await CouponMySQL.getCouponByCode(payment_info[0].coupon_code, db.mysql.read);
                    if (couponDetails.length && couponDetails[0].type === 'trial') {
                        this.createSubscriptionEntryForTrialV1(db, payment_info[0].student_id, couponDetails[0].trial_coupon_assortment, -1, couponDetails[0].value);
                    } else if (couponDetails.length && couponDetails[0].type === 'cashback' && couponDetails[0].value_type === 'percent') {
                        const walletDetails = await PayMySQL.getWalletTransactionByPaymentInfoId(db.mysql.read, payment_info[0].id);
                        const cashbackAmount = (((payment_info[0].amount + walletDetails[0].cash_amount) * couponDetails[0].value) / 100);
                        const totalCashbackAmount = cashbackAmount > couponDetails[0].max_limit ? couponDetails[0].max_limit : cashbackAmount;
                        WalletUtil.makeWalletTransaction({
                            student_id: payment_info[0].student_id,
                            reward_amount: parseInt((totalCashbackAmount).toString()),
                            type: 'CREDIT',
                            payment_info_id: payment_info[0].id,
                            reason: 'coupon_cashback',
                            expiry: null,
                        });
                    } else if (couponDetails.length && couponDetails[0].type === 'instant-trial') {
                        if (!_.isNull(couponDetails[0].trial_coupon_assortment)) {
                            this.createSubscriptionEntryForTrialUsingPackageId(db, payment_info[0].student_id, couponDetails[0].trial_coupon_assortment, -2);
                        }
                    }
                }
                PackageMySQL.updateStudentRenewalTargetGroup(db.mysql.write, payment_info[0].student_id, variantInfo[0].assortment_id);
                if (variantInfo[0].assortment_type === 'course') {
                    this.setTrendingCoursesDataInRedis(db, variantInfo, payment_info[0].student_id);
                }
                if (courseDetails[0].assortment_type === 'subject' && courseDetails[0].display_name && courseDetails[0].display_name.toLowerCase().includes('english')) {
                    const otherEnglishSubjectAssortment = await CourseMySQL2.getEnglishSubjectAssortmentsOfCourse(db.mysql.read, courseDetails[0].assortment_id);
                    if (otherEnglishSubjectAssortment.length && otherEnglishSubjectAssortment[0].assortment_id) {
                        this.createSubscriptionEntryForTrialV1(db, payment_info[0].student_id, otherEnglishSubjectAssortment[0].assortment_id, 0, variantInfo[0].duration_in_days);
                    }
                }
                return await PackageMySQL.setPaymentSummary(db.mysql.write, insertSummary);
            }
            if (spsInfo.length === 0 && psInfo.length) {
                const updateObj = {
                    subscription_id: result.insertId,
                };
                await PackageMySQL.updatePaymentSummaryObjWithId(db.mysql.write, updateObj, psInfo[0].id);
            }
            if (psInfo.length && payment_info[0].status === 'RECONCILE') {
                const updateObj = {
                    txn_id: payment_info[0].partner_txn_id,
                };
                await PackageMySQL.updatePaymentSummaryObjWithId(db.mysql.write, updateObj, psInfo[0].id);
            }
        } catch (e) {
            logger.error('Payment Error: Payment Create Entry in Sps and Ps Error', e);
            throw e;
        }
    }

    static async createSubscriptionEntryForStudentIdByVariantIdIdAndAmount(db, config, payment_info, notes, walletTransactionDetails = []) {
        try {
            const variantInfo = await PackageMySQL.getVariantInfo(db.mysql.read, payment_info[0].variant_id);
            console.log(variantInfo);
            if (variantInfo.length > 0) {
                if (variantInfo[0].assortment_type === 'course_bundle') {
                    const childCourses = await CourseMySQL2.getChildCoursesOfBundleAssortment(db.mysql.read, variantInfo[0].assortment_id);
                    for (let i = 0; i < childCourses.length; i++) {
                        childCourses[i].duration_in_days = variantInfo[0].duration_in_days;
                        // eslint-disable-next-line no-await-in-loop
                        await this.createEntriesInSpsAndPsTable(db, [childCourses[i]], payment_info, notes, true, i, walletTransactionDetails);
                    }
                } else {
                    await this.createEntriesInSpsAndPsTable(db, variantInfo, payment_info, notes, false, 1, walletTransactionDetails);
                }
            }
        } catch (e) {
            logger.error('Payment Error: Create Subscription Entry Error', e);
            throw e;
        }
    }

    static changeDailyDoubtVariable(payment_help, doubt_limit_today) {
        for (let i = 0; i < payment_help.length; i++) {
            payment_help[i].value = _.replace(payment_help[i].value, /##doubt##/g, doubt_limit_today);
        }
    }

    static parseDuration(duration) {
        switch (duration) {
            case 0:
                return 'Today';
            case 1:
                return '1 Day';
            /* case 7:
      return '7 Days';
  case 30:
      return '30 Days';
  case 60:
      return '60 Days';
  case 90:
      return '90 Days'; */
            case 180:
                return '6 Months';
            case 365:
                return '1 Year';
            case 730:
                return '2 Year';
            default:
                return `${duration} Days`;
        }
    }

    static updateUserSeenPackageInMongo(mongoHandler, doc) {
        mongoHandler.collection(PayConstant.constants.mongoDocument).replaceOne({ studentId: doc.studentId }, {
            updatedAt: new Date(),
            studentId: doc.studentId,
            packageList: doc.durationList,
        }, { upsert: true });
    }

    /* odd student ID is VIP
     * even student ID will not be shown VIP at all
     *
     * */

    static showVIPToUser(studentId) {
        // odd
        if (studentId % 2) {
            return true;
        }
        return false;
    }

    static async getActiveEmiPackageAndRemainingDays(db, config, studentID) {
        try {
            let data;
            if (config.caching) {
                data = await PackageRedis.getActiveEmiPackageAndRemainingDays(db.redis.read, studentID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await PackageMySQL.getActiveEmiPackageAndRemainingDays(db.mysql.read, studentID);
            if (data.length) {
                await PackageRedis.setActiveEmiPackageAndRemainingDays(db.redis.write, studentID, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getDifferenceAmountForUpgradeSubscription({ db, studentID, assortmentID }) {
        const [
            userActiveSubscriptions,
            maxValidityPackage,
        ] = await Promise.all([
            CourseMySQL2.getUserPaymentSummaryDetailsByAssortment(db.mysql.read, assortmentID, studentID),
            PackageMySQL.getMaxValidityPackageFromAssortmentID(db.mysql.read, assortmentID),
        ]);
        const resultLength = userActiveSubscriptions.length;
        if (resultLength && maxValidityPackage.length && userActiveSubscriptions[resultLength - 1].duration_in_days < maxValidityPackage[0].duration_in_days) {
            return {
                amount: userActiveSubscriptions[resultLength - 1].package_amount, duration: userActiveSubscriptions[resultLength - 1].duration_in_days, assortment_id: assortmentID, subscription_id: userActiveSubscriptions[resultLength - 1].subscription_id,
            };
        }
        return {};
    }

    static async getNextPackageVariant(db, config, masterParent, emiOrder) {
        try {
            let data;
            if (config.caching) {
                data = await PackageRedis.getNextPackageVariant(db.redis.read, masterParent, emiOrder);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await PackageMySQL.getNextPackageVariant(db.mysql.read, masterParent, emiOrder);
            if (data.length) {
                await PackageRedis.setNextPackageVariant(db.redis.write, masterParent, emiOrder, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
    // static saveEmiPackageDetails(db, flagrResponse, studentId) {
    //     // PackageMySQL.saveEmiPackageDetails(db.read_flagr,studentId,flagrResponse.variantAttachment)
    //     // const { now, today } = this.getNowAndTodayInIST();
    //     // const activePackage = PackageMySQL.getStudentActivePackage(db.mysql.read, studentId, today)
    //     // if(activePackage.downpayment_amount)
    // }

    static async getFlagIDKeysFromAssortmentId(db, assortmentId, batchID) {
        let data;
        if (config.caching) {
            data = await PackageRedis.getFlagIDKeysFromAssortmentId(db.redis.read, assortmentId, batchID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await PackageMySQL.getFlagIDKeysFromAssortmentId(db.mysql.read, [assortmentId], batchID);
        PackageRedis.setFlagIDKeysFromAssortmentId(db.redis.write, assortmentId, batchID, data);
        return data;
    }

    static async getFlagIDKeysFromAssortmentIds(db, assortmentIds, batchID) {
        const promises = [];
        assortmentIds.forEach((assortmentId) => promises.push(this.getFlagIDKeysFromAssortmentId(db, assortmentId, batchID)));
        const resolvedPromises = await Promise.all(promises);
        return _.flatten(resolvedPromises);
    }

    static async getFlagIDKeysFromAssortmentIdWithReferralPackages(db, assortmentId, batchID) {
        let data;
        if (config.caching) {
            data = await PackageRedis.getFlagIDKeysFromAssortmentIdWithReferralPackages(db.redis.read, assortmentId, batchID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await PackageMySQL.getFlagIDKeysFromAssortmentIdWithReferralPackages(db.mysql.read, [assortmentId], batchID);
        PackageRedis.setFlagIDKeysFromAssortmentIdWithReferralPackages(db.redis.write, assortmentId, batchID, data);
        return data;
    }

    static async getFlagIDKeysFromAssortmentIdsWithReferralPackages(db, assortmentIds, batchID) {
        const promises = [];
        assortmentIds.forEach((assortmentId) => promises.push(this.getFlagIDKeysFromAssortmentIdWithReferralPackages(db, assortmentId, batchID)));
        const resolvedPromises = await Promise.all(promises);
        return _.flatten(resolvedPromises);
    }

    static async getFlagIDKeysFromAssortmentIdWithAutosalesCampaign(db, assortmentId, batchID) {
        let data;
        if (config.caching) {
            data = await PackageRedis.getFlagIDKeysFromAssortmentIdWithAutosalesCampaign(db.redis.read, assortmentId, batchID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await PackageMySQL.getFlagIDKeysFromAssortmentIdWithAutosalesCampaign(db.mysql.read, [assortmentId], batchID);
        PackageRedis.setFlagIDKeysFromAssortmentIdWithAutosalesCampaign(db.redis.write, assortmentId, batchID, data);
        return data;
    }

    static async getFlagIDKeysFromAssortmentIdsWithAutosalesCampaign(db, assortmentIds, batchID) {
        const promises = [];
        assortmentIds.forEach((assortmentId) => promises.push(this.getFlagIDKeysFromAssortmentIdWithAutosalesCampaign(db, assortmentId, batchID)));
        const resolvedPromises = await Promise.all(promises);
        return _.flatten(resolvedPromises);
    }
};
