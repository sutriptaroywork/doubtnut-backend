const moment = require('moment');
const _ = require('lodash');
const axios = require('axios');
const CouponMySQL = require('../mysql/coupon');
const Data = require('../../data/data');
const Package = require('../mysql/package');
const CourseMysql = require('../mysql/coursev2');
const TGHelper = require('../../server/helpers/target-group');
const UtilityTranslate = require('../utility.translation');
const Properties = require('../mysql/property');
const Utility = require('../utility');
const config = require('../../config/config');
const StudentContainer = require('./student');

module.exports = class Coupon {
    static getNowAndTodayInIST() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const today = now.format('YYYY-MM-DD');
        return { now, today };
    }

    static makeSomeRandom(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result.toUpperCase();
    }

    static async getDifferenceAmountForUpgradeSubscription({ db, studentID, assortmentID }) {
        const [
            userActiveSubscriptions,
            maxValidityPackage,
        ] = await Promise.all([
            CourseMysql.getUserPaymentSummaryDetailsByAssortment(db.mysql.read, assortmentID, studentID),
            Package.getMaxValidityPackageFromAssortmentID(db.mysql.read, assortmentID),
        ]);
        const resultLength = userActiveSubscriptions.length;
        if (resultLength && maxValidityPackage.length && userActiveSubscriptions[resultLength - 1].duration_in_days < maxValidityPackage[0].duration_in_days) {
            return {
                amount: userActiveSubscriptions[resultLength - 1].package_amount, duration: userActiveSubscriptions[resultLength - 1].duration_in_days, assortment_id: assortmentID, subscription_id: userActiveSubscriptions[resultLength - 1].subscription_id,
            };
        }
        return {};
    }

    static async createReferralCoupon(db, student_id) {
        if (!(await CouponMySQL.getInfoByStudentId(db.mysql.read, student_id)).length) {
            // create coupon entries
            let referralCoupon;
            let doesCouponAlreadyExist;
            do {
                referralCoupon = this.makeSomeRandom(8);
                // eslint-disable-next-line no-await-in-loop
                doesCouponAlreadyExist = await CouponMySQL.getInfoByStudentReferalCoupons(db.mysql.read, referralCoupon);
            } while (doesCouponAlreadyExist.length);

            const { couponData } = Data.referralInfo;
            couponData.coupon_code = referralCoupon;
            couponData.start_date = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
            couponData.end_date = moment().add(365, 'd').endOf('day').format('YYYY-MM-DD HH:mm:ss');
            CouponMySQL.insert_coupon(db.mysql.write, couponData);
            CouponMySQL.insert_coupon_student_id_mapping_obj(db.mysql.write, { coupon_code: referralCoupon, type: 'assortment-type', value: 'course' });
            const branchLink = (await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'whatsapp_refer', `CEO_REFERRAL_TB;;;${student_id}`, 'doubtnutapp://library_tab?tag=check_all_courses')).url;

            CouponMySQL.setInfoByStudentReferalCoupons(db.mysql.write, {
                student_id,
                coupon_code: referralCoupon,
                branch_link: branchLink,
            });
        }
    }

    static async createRewardCoupon(db, student_id, couponCode, discountPercentage, validity) {
        const { couponData } = Data.rewardCouponInfo;
        couponData.coupon_code = couponCode;
        couponData.start_date = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        couponData.end_date = moment().add(validity, 'd').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        couponData.value = discountPercentage;
        CouponMySQL.insert_coupon(db.mysql.write, couponData);
        CouponMySQL.insert_coupon_student_id_mapping_obj(db.mysql.write, { coupon_code: couponCode, type: 'specific', value: student_id });
    }

    static async createKheloJeetoCoupon(db, student_id, couponCode, discountPercentage, validity, maxCouponAmt) {
        const { couponData } = Data.rewardKJCouponInfo;
        couponData.max_limit = maxCouponAmt;
        couponData.coupon_code = couponCode;
        couponData.start_date = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        couponData.end_date = moment().add(validity, 'd').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        couponData.value = discountPercentage;
        CouponMySQL.insert_coupon(db.mysql.write, couponData);
        CouponMySQL.insert_coupon_student_id_mapping_obj(db.mysql.write, { coupon_code: couponCode, type: 'specific', value: student_id });
    }

    static async couponCourseDetailsCheck(couponPackageDetails, packageDetails) {
        for (let i = 0; i < couponPackageDetails.length; i++) {
            const couponCourseDetailsObj = couponPackageDetails[i];
            let rowCheck = true;
            for (const key in couponCourseDetailsObj) {
                // eslint-disable-next-line no-prototype-builtins
                if (couponCourseDetailsObj.hasOwnProperty(key)) {
                    if (key == 'is_multi_year' && couponCourseDetailsObj[key] == 2);
                    // eslint-disable-next-line no-prototype-builtins
                    else if (packageDetails.hasOwnProperty(key) && (!_.isEmpty(couponCourseDetailsObj[key]) || !_.isNull(couponCourseDetailsObj[key])) && couponCourseDetailsObj[key] != packageDetails[key]) {
                        rowCheck = false;
                        break;
                    } else if (key == 'course_min_original_amount' && (!_.isEmpty(couponCourseDetailsObj[key]) || !_.isNull(couponCourseDetailsObj[key])) && packageDetails.original_amount < parseInt(couponCourseDetailsObj[key])) {
                        rowCheck = false;
                        break;
                    }
                }
            }
            if (rowCheck) {
                return true;
            }
        }
        return false;
    }

    static async fetchCouponApplyData(db, studentInfo, coupon_code, packageInfo, version_code, xAuthToken = null, switch_assortment = '', is_show, sale_type = '') {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        let preAppliedCoupon = false;
        let ignore_package_min_limit = 0;
        let coupon_type = '';

        coupon_code = coupon_code.toUpperCase();

        if (!coupon_code) {
            // check for pre applied referral coupons
            try {
                const [preAppliedCouponData, ceoReferralEntry] = await Promise.all([
                    CourseMysql.getPreAppliedCoupon(db.mysql.read, studentInfo.student_id),
                    CouponMySQL.getCeoReferralEntryFromCampaign(db.mysql.write, studentInfo.student_id),
                ]);
                console.log(ceoReferralEntry, studentInfo);
                if (ceoReferralEntry.length && moment().diff(moment(ceoReferralEntry[0].created_at), 'days') < 30) {
                    const preAppliedReferralCouponData = await CouponMySQL.getInfoByStudentId(db.mysql.read, (ceoReferralEntry[0].campaign.split(';;;')[1]));
                    coupon_code = preAppliedReferralCouponData[0].coupon_code;
                    preAppliedCoupon = true;
                } else if (preAppliedCouponData.length > 0) {
                    coupon_code = preAppliedCouponData[0].coupon_code;
                    preAppliedCoupon = true;
                }
            } catch (e) {
                console.error(e);
            }
        }

        const { final_amount } = packageInfo[0];
        if (coupon_code) {
        // const apiToUse = await Properties.getValueByBucketAndName(db.mysql.read, 'coupons', 'dn_cpn_api');
            const [apiToUse, couponInfo, totalCouponsClaimed, totalCouponsClaimedByStudent] = await Promise.all([
                Properties.getValueByBucketAndName(db.mysql.read, 'coupons', 'dn_cpn_api'),
                CouponMySQL.getCouponByCode(coupon_code, db.mysql.read),
                Package.getCouponClaimedTotalCount(db.mysql.write, coupon_code),
                Package.getCouponClaimedTotalCountByStudentId(db.mysql.write, coupon_code, studentInfo.student_id),
            ]);
            console.log(couponInfo);
            if ((!_.isEmpty(apiToUse) && apiToUse[0].value == '1') && (couponInfo.length > 0 && !['rewards', 'referral', 'reseller', 'prashant'].includes(couponInfo[0].created_by))) {
                console.log('if');
                ignore_package_min_limit = couponInfo[0].ignore_min_limit;
                coupon_type = couponInfo[0].type;
                console.log('if2');
                if (couponInfo[0].claim_limit == null || totalCouponsClaimed.length == 0 || couponInfo[0].claim_limit > totalCouponsClaimed[0].success_count) {
                    console.log('if3');
                    if (totalCouponsClaimedByStudent.length < couponInfo[0].limit_per_student || totalCouponsClaimed.length == 0 || totalCouponsClaimed[0].success_count == 0) {
                        let invalidCoupon = false;
                        const params = {
                            student_id: studentInfo.student_id,
                            variant_id: packageInfo[0].id,
                            coupon_code,
                            switch_assortment,
                            is_show,
                            sale_type,
                        };
                        let dnCpnResult = {};
                        console.log('if4');

                        try {
                            const { data } = await axios({
                                method: 'get',
                                url: `${Data.cpn_url}api/v1/validate-coupon-code`,
                                headers: {
                                    'x-auth-token': xAuthToken,
                                    'Content-Type': 'application/json',
                                },
                                params,
                            });
                            dnCpnResult = data;
                        } catch (e) {
                            console.error(e);
                        }
                        if (coupon_type === 'extend' && packageInfo[0].duration_in_days <= 31) {
                            invalidCoupon = true;
                        }
                        if (invalidCoupon) {
                            console.log('if6');
                            if (coupon_code && !preAppliedCoupon) {
                                packageInfo[0].coupon_code = coupon_code;
                                packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Invalid Coupon', studentInfo.locale, Data)}`;
                                packageInfo[0].coupon_status = 'FAILURE';
                            }
                            responseData.data.info = packageInfo[0];
                        } else {
                            if (dnCpnResult.final_amount < packageInfo[0].min_limit && couponInfo[0].value_type !== 'flat' && !ignore_package_min_limit) {
                                dnCpnResult.amount = final_amount - packageInfo[0].min_limit;
                                if (dnCpnResult.amount < 0) {
                                    dnCpnResult.amount = 0;
                                }
                            }
                            if (coupon_code.toLowerCase() === 'internal') {
                                dnCpnResult.amount = final_amount - 1;
                            }

                            console.log('else', dnCpnResult);
                            return {
                                code: dnCpnResult.coupon_code, status: dnCpnResult.status, status_text: dnCpnResult.status_text, amount: dnCpnResult.amount, ignore_package_min_limit: dnCpnResult.ignore_package_min_limit, coupon_type: dnCpnResult.coupon_type,
                            };
                        }
                    } else {
                        if (coupon_code) {
                            packageInfo[0].coupon_code = coupon_code;
                            packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Coupon already claimed', studentInfo.locale, Data)}`;
                            packageInfo[0].coupon_status = 'FAILURE';
                        }
                        responseData.data.info = packageInfo[0];
                    }
                } else {
                    if (coupon_code) {
                        packageInfo[0].coupon_code = coupon_code;
                        packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Coupon claim limit reached', studentInfo.locale, Data)}`;
                        packageInfo[0].coupon_status = 'FAILURE';
                    }
                    responseData.data.info = packageInfo[0];
                }
                return {
                    code: responseData.data.info.coupon_code, status: responseData.data.info.coupon_status, status_text: responseData.data.info.coupon_status_text, amount: responseData.data.info.coupon_discount, ignore_package_min_limit, coupon_type,
                };
            }
            // eslint-disable-next-line no-lonely-if
            console.log('else call');
            const promise = [];
            // start and end date check, min and max version code check
            promise.push(Package.getCouponDetailsUsingCouponCode(db.mysql.read, coupon_code, version_code));
            promise.push(Package.getCouponTg(db.mysql.read, coupon_code));
            // coupon package applicability check
            promise.push(Package.getPackageDetailsForCouponCheckByPackageId(db.mysql.read, packageInfo[0].package_id));
            promise.push(Package.getCouponPackages(db.mysql.read, coupon_code));
            promise.push(CouponMySQL.getInfoByStudentId(db.mysql.read, studentInfo.student_id));
            promise.push(CouponMySQL.getInfoByStudentReferalCoupons(db.mysql.read, coupon_code));
            promise.push(Properties.getValueByBucketAndName(db.mysql.read, 'ceo_referral_program', 'min_purchase_amount'));
            const [couponDetails, couponTg, packageDetails, couponPackageDetails, referralInfo, couponReferralInfo, minPurchaseAmountCEOReferral] = await Promise.all(promise);
            let checkUserForCEOReferralTg = [];
            if (couponReferralInfo.length > 0) {
                checkUserForCEOReferralTg = await CouponMySQL.getUserForCEOReferralProgramWithStudentId(db.mysql.read, couponReferralInfo[0].student_id);
            }
            packageDetails[0].original_amount = packageInfo[0].original_amount;

            // eslint-disable-next-line no-mixed-operators
            if ((couponDetails.length > 0 && couponPackageDetails.length == 0) || (couponDetails.length > 0 && couponPackageDetails.length > 0 && (await this.couponCourseDetailsCheck(couponPackageDetails, packageDetails[0])))) {
                ignore_package_min_limit = couponDetails[0].ignore_min_limit;
                coupon_type = couponDetails[0].type;
                // get total number of times the coupon was claimed and number of times the coupon was claimed by student
                // console.log(couponDetails);
                if (couponDetails[0].claim_limit == null || totalCouponsClaimed.length == 0 || couponDetails[0].claim_limit > totalCouponsClaimed[0].success_count) {
                    if (totalCouponsClaimedByStudent.length < couponDetails[0].limit_per_student || totalCouponsClaimed.length == 0 || totalCouponsClaimed[0].success_count == 0) {
                        const tgCheck = {
                            check_exists: false,
                            check_valid: false,
                        };
                        const couponAssortmentTypeCheck = {
                            check_exists: false,
                            check_valid: false,
                        };
                        // TG Check
                        if (couponTg.length > 0) {
                            for (let j = 0; j < couponTg.length; j++) {
                                if (couponTg[j].type == 'generic') {
                                    tgCheck.check_exists = true;
                                    tgCheck.check_valid = true;
                                } else if (couponTg[j].type == 'specific') {
                                    tgCheck.check_exists = true;
                                    if (couponTg[j].value == studentInfo.student_id) {
                                        tgCheck.check_valid = true;
                                    }
                                } else if (couponTg[j].type == 'target-group') {
                                    tgCheck.check_exists = true;
                                    // eslint-disable-next-line no-await-in-loop
                                    tgCheck.check_valid = await TGHelper.targetGroupCheck({
                                        db, studentId: studentInfo.student_id, tgID: couponTg[j].value, studentClass: studentInfo.student_class, locale: studentInfo.locale,
                                    });
                                } else if (couponTg[j].type == 'assortment-type') {
                                    couponAssortmentTypeCheck.check_exists = true;
                                    // eslint-disable-next-line no-await-in-loop
                                    const assortmentDetails = await CourseMysql.getAssortmentDetailsFromId(db.mysql.read, [packageInfo[0].assortment_id], '');
                                    if (assortmentDetails.length && assortmentDetails[0].assortment_type == couponTg[j].value) {
                                        couponAssortmentTypeCheck.check_valid = true;
                                    } else if (couponReferralInfo.length && _.includes(['course', 'course_bundle'], assortmentDetails[0].assortment_type)) {
                                        couponAssortmentTypeCheck.check_valid = true;
                                    }
                                }
                            }
                        }
                        if (tgCheck.check_exists && tgCheck.check_valid && coupon_type === 'extend' && packageInfo[0].duration_in_days <= 31) {
                            tgCheck.check_valid = false;
                        }
                        /**
                         * check if the user assortment purchase(assortment-type) and user(target-group) is valid or not
                         * valid only if check doesn't exist or if check exits and is valid
                         * Finally user coupon applicabillity is tru if both assortment-check and tg-check are valid
                         */
                        const validAssortmentTypeCheck = (!couponAssortmentTypeCheck.check_exists || (couponAssortmentTypeCheck.check_exists && couponAssortmentTypeCheck.check_valid));
                        const validTgCheck = (!tgCheck.check_exists || (tgCheck.check_exists && tgCheck.check_valid));
                        const couponApplicabilityCheck = (validAssortmentTypeCheck && validTgCheck);
                        if (couponApplicabilityCheck) {
                            // coupon is valid
                            let invalidCoupon = false;
                            let discountAmount = 0;
                            if (couponReferralInfo && couponReferralInfo.length > 0) {
                                if ((packageInfo[0].final_amount >= parseInt(minPurchaseAmountCEOReferral[0].value) || packageInfo[0].reference_type == 'referral') && checkUserForCEOReferralTg.length && !_.includes(['upgrade', 'switch'], sale_type)) {
                                    couponDetails[0].value_type = Data.ceoReferralProgram.couponData.value_type;
                                    couponDetails[0].value = Data.ceoReferralProgram.couponData.value;
                                    couponDetails[0].limit_per_student = Data.ceoReferralProgram.couponData.limit_per_student;
                                    couponDetails[0].max_limit = Data.ceoReferralProgram.couponData.max_limit;
                                } else {
                                    invalidCoupon = true;
                                }
                                /**
                                 * Old Referral Flow
                                 * else if (packageInfo[0].final_amount >= 1500 && !checkUserForCEOReferralTg.length) {
                                    couponDetails[0].value_type = 'amount';
                                    couponDetails[0].value = Data.referralDetails.referral_paytm.referral_amount;
                                    }
                                 */
                            }
                            if (couponDetails[0].value_type == 'amount') {
                                packageInfo[0].final_amount -= couponDetails[0].value;
                                discountAmount = couponDetails[0].value;
                            } else if (couponDetails[0].value_type == 'percent' && !['cashback'].includes(couponDetails[0].type)) {
                                discountAmount = Math.round((couponDetails[0].value * packageInfo[0].final_amount) / 100);
                                if (discountAmount > couponDetails[0].max_limit) {
                                    discountAmount = couponDetails[0].max_limit;
                                }
                                packageInfo[0].final_amount -= discountAmount;
                            } else if (couponDetails[0].value_type === 'flat') {
                                if (packageInfo[0].final_amount > couponDetails[0].value) {
                                    discountAmount = packageInfo[0].final_amount - couponDetails[0].value;
                                    packageInfo[0].final_amount = couponDetails[0].value;
                                } else {
                                    invalidCoupon = true;
                                }
                            }
                            if (invalidCoupon) {
                                packageInfo[0].coupon_code = coupon_code;
                                packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Invalid Coupon', studentInfo.locale, Data)}`;
                                packageInfo[0].coupon_status = 'FAILURE';
                                responseData.data.info = packageInfo[0];
                            } else {
                                if (packageInfo[0].final_amount < packageInfo[0].min_limit && couponDetails[0].value_type !== 'flat' && !ignore_package_min_limit) {
                                    discountAmount = final_amount - packageInfo[0].min_limit;
                                    packageInfo[0].final_amount = packageInfo[0].min_limit;
                                    if (discountAmount < 0) {
                                        discountAmount = 0;
                                    }
                                }
                                if (coupon_code.toLowerCase() === 'internal') {
                                    discountAmount = final_amount - 1;
                                    packageInfo[0].final_amount = 1;
                                }
                                packageInfo[0].coupon_code = coupon_code;
                                packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Coupon successfully applied', studentInfo.locale, Data)}`;
                                packageInfo[0].coupon_status = 'SUCCESS';
                                packageInfo[0].coupon_discount = discountAmount;
                                packageInfo[0].total_amount = packageInfo[0].final_amount + discountAmount;

                                responseData.data.info = packageInfo[0];
                            }
                        } else {
                            if (coupon_code && !preAppliedCoupon) {
                                packageInfo[0].coupon_code = coupon_code;
                                packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Invalid Coupon', studentInfo.locale, Data)}`;
                                packageInfo[0].coupon_status = 'FAILURE';
                            }

                            responseData.data.info = packageInfo[0];
                        }
                    } else {
                        if (coupon_code) {
                            packageInfo[0].coupon_code = coupon_code;
                            packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Coupon already claimed', studentInfo.locale, Data)}`;
                            packageInfo[0].coupon_status = 'FAILURE';
                        }
                        responseData.data.info = packageInfo[0];
                    }
                } else {
                    if (coupon_code) {
                        packageInfo[0].coupon_code = coupon_code;
                        packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Coupon claim limit reached', studentInfo.locale, Data)}`;
                        packageInfo[0].coupon_status = 'FAILURE';
                    }
                    responseData.data.info = packageInfo[0];
                }
            } else {
                if (coupon_code && !preAppliedCoupon) {
                    packageInfo[0].coupon_code = coupon_code;
                    packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Invalid Coupon', studentInfo.locale, Data)}`;
                    packageInfo[0].coupon_status = 'FAILURE';
                    const expiryCheck = await Package.getCouponDetailsUsingCouponCodeForExpiryCheck(db.mysql.read, coupon_code);
                    if (expiryCheck.length > 0) {
                        packageInfo[0].coupon_status_text = `${UtilityTranslate.translate('Your coupon has expired', studentInfo.locale, Data)}`;
                    }
                }
                responseData.data.info = packageInfo[0];
            }

            return {
                code: responseData.data.info.coupon_code, status: responseData.data.info.coupon_status, status_text: responseData.data.info.coupon_status_text, amount: responseData.data.info.coupon_discount, ignore_package_min_limit, coupon_type,
            };
        }

        return {
            code: coupon_code, status: false, status_text: '', amount: 0, ignore_package_min_limit, coupon_type,
        };
    }

    static async getAllCouponsForStudentUsingVariantID(db, data) {
        const couponList = [];
        // Target Group Coupons
        let packageInfo = [];
        let activeTgCoupons = [];
        let assortmentType = 'course';
        if (data.variant_id) {
            [packageInfo, activeTgCoupons] = await Promise.all([Package.getNewPackageFromVariantId(db.mysql.read, data.variant_id), CouponMySQL.getActiveTgCoupons(db.mysql.read, parseInt(data.version_code), data.locale, data.student_class)]);
            const [upgradeCheck, assortmentDetails] = await Promise.all([this.getDifferenceAmountForUpgradeSubscription({
                db, studentID: data.student_id, assortmentID: packageInfo[0].assortment_id,
            }), CourseMysql.getAssortmentDetailsFromId(db.mysql.read, [packageInfo[0].assortment_id], '')]);
            if (!_.isEmpty(upgradeCheck) && upgradeCheck.amount < packageInfo[0].total_amount) {
                // eslint-disable-next-line operator-assignment
                packageInfo[0].final_amount = packageInfo[0].final_amount - upgradeCheck.amount;
            }
            assortmentType = assortmentDetails[0].assortment_type;
        }
        // Generic Coupons, Assortment Type Coupons and Specific Coupons
        const [genericCoupons, applicableTgCoupons] = await Promise.all([CouponMySQL.getApplicableCoupons(db.mysql.read, parseInt(data.version_code), assortmentType, data.student_id), this.getApplicableTgCoupons(db, activeTgCoupons, data.student_id, data.student_class, data.locale, packageInfo)]);
        const finalCouponList = [...genericCoupons, ...applicableTgCoupons];
        for (let i = 0; i < finalCouponList.length; i++) {
            // show only coupons which have is_show 1 (app) and 3(both: panel, app);
            if (finalCouponList[i].is_show == data.is_show || finalCouponList[i].is_show == 3) {
                const finalDatum = {};
                finalDatum.coupon_title = finalCouponList[i].coupon_code;
                let amountSaved;
                if (finalCouponList[i].value_type == 'amount') {
                    amountSaved = finalCouponList[i].value;
                } else if (finalCouponList[i].value_type == 'percent' && !['cashback'].includes(finalCouponList[i].type)) {
                    amountSaved = packageInfo.length ? Math.round((finalCouponList[i].value * packageInfo[0].final_amount) / 100) : finalCouponList[i].value * 50;
                    if (amountSaved > finalCouponList[i].max_limit) {
                        amountSaved = finalCouponList[i].max_limit;
                    }
                } else if (finalCouponList[i].value_type == 'flat') {
                    amountSaved = finalCouponList[i].value;
                }
                finalDatum.amount_saved = _.includes(['trial', 'extend', 'cashback'], finalCouponList[i].type) ? finalCouponList[i].description : `${UtilityTranslate.translate('BACHAO MAXIMUM', data.locale, Data)} ₹${amountSaved.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
                if (!data.variant_id) {
                    finalDatum.amount_saved = finalCouponList[i].description || '';
                }
                finalDatum.amount = amountSaved;
                finalDatum.validity = `${UtilityTranslate.translate('Valid till', data.locale, Data)} ${moment(finalCouponList[i].end_date).format('hh:mm A DD-MM-YY')}`;
                finalDatum.btn_cta = `${UtilityTranslate.translate('Apply Coupon', data.locale, Data)}`;
                finalDatum.coupon_code_text = `${UtilityTranslate.translate('Copy Coupon', data.locale, Data)}`;
                couponList.push(finalDatum);
            }
        }
        return _.orderBy(couponList, ['amount'], ['desc']);
    }

    static async getApplicableCouponsFromCpn(xAuthToken, params) {
        try {
            const { data } = await axios({
                method: 'get',
                url: `${Data.cpn_url}api/v1/applicable-coupon-codes`,
                headers: {
                    'x-auth-token': xAuthToken,
                    'Content-Type': 'application/json',
                },
                params,
            });
            return data;
        } catch (e) {
            console.error(e);
            throw new Error(e);
        }
    }

    static async getApplicableTgCoupons(db, activeTgCoupons, studentID, sClass, locale, packageInfo) {
        const applicableTgCoupons = [];
        const sqlPromise = [];
        const sqlPromiseIndex = [];
        for (let i = 0; i < activeTgCoupons.length; i++) {
            if (activeTgCoupons[i].sql == null && activeTgCoupons[i].user_class == sClass && activeTgCoupons[i].user_locale == locale) {
                applicableTgCoupons.push(activeTgCoupons[i]);
            } else if (activeTgCoupons[i].sql == null && (activeTgCoupons[i].user_exam != null || !_.isEmpty(activeTgCoupons[i].user_exam))) {
                const studentCCM = await StudentContainer.getStudentCcmIds(db, studentID);
                let ccmExists = false;
                const examArray = activeTgCoupons[i].user_exam.split(',');
                for (let k = 0; k < studentCCM.length; k++) {
                    if (examArray.includes(studentCCM[k].toString())) {
                        ccmExists = true;
                        break;
                    }
                }
                if (ccmExists) {
                    applicableTgCoupons.push(activeTgCoupons[i]);
                }
            } else if (activeTgCoupons[i].sql != null) {
                if (activeTgCoupons[i].sql[activeTgCoupons[i].sql.length - 1] === ';') {
                    activeTgCoupons[i].sql = activeTgCoupons[i].sql.slice(0, activeTgCoupons[i].sql.length - 1);
                }
                if (activeTgCoupons[i].sql.split(' ').includes('where')) {
                    activeTgCoupons[i].sql = `${activeTgCoupons[i].sql} and student_id=${studentID}`;
                } else {
                    activeTgCoupons[i].sql = `${activeTgCoupons[i].sql} where student_id=${studentID}`;
                }

                sqlPromise.push(Package.runTgSql(db.mysql.read, activeTgCoupons[i].sql));
                sqlPromiseIndex.push(activeTgCoupons[i]);
            }
        }

        const res = await Promise.all(sqlPromise);
        for (let i = 0; i < res.length; i++) {
            const a = _.find(res[i], ['student_id', studentID]);
            if (_.isObject(a)) {
                applicableTgCoupons.push(sqlPromiseIndex[i]);
            }
        }

        return applicableTgCoupons;
    }
};
