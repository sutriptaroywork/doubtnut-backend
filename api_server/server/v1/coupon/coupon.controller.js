const _ = require('lodash');
const moment = require('moment');
const axios = require('axios');
const Coupon = require('../../../modules/mysql/coupon');
const UtilityTranslate = require('../../../modules/utility.translation');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CouponContainer = require('../../../modules/containers/coupon');
const Data = require('../../../data/data');
const Properties = require('../../../modules/mysql/property');
const Utility = require('../../../modules/utility');
const Token = require('../../../modules/token');
const PayMySQL = require('../../../modules/mysql/payment');
const PaymentHelper = require('../../helpers/payment');
const PaidUserChampionshipMysql = require('../../../modules/mysql/paidUserChampionship');
const Student = require('../../../modules/mysql/student');
const StudentModulesHelper = require('../../../modules/student');
const StudentHelper = require('../../helpers/student.helper');
const redisUtility = require('../../../modules/redis/utility.redis');
const StudentContainer = require('../../../modules/containers/student');

let db;
let config;

async function couponCodeCheck(req, res) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { couponcode } = req.query;
        console.log(req);
        const couponInfo = await Coupon.getCouponByCode(
            couponcode,
            db.mysql.read,
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: couponInfo,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function couponCodePost(req, res, next) {
    try {
        const {
            title,
            description,
            type,
            coupon_code,
            start_date,
            end_date,
            value_type,
            coupon_applicability_type,
            value,
            min_version_code,
            max_version_code,
            limit_per_student,
            claim_limit,
            max_limit,
            package_id,
            created_by,
            student_id,
            target_group_id,
            assortment,
        } = req.body;

        config = req.app.get('config');
        db = req.app.get('db');
        const couponData = {};
        couponData.title = title;
        couponData.description = description;
        couponData.type = type;
        couponData.coupon_code = coupon_code;
        couponData.start_date = start_date;
        couponData.end_date = end_date;
        couponData.value_type = value_type;
        couponData.value = value;
        couponData.created_by = created_by;
        couponData.min_version_code = min_version_code;
        couponData.max_version_code = max_version_code;
        couponData.limit_per_student = limit_per_student;
        couponData.claim_limit = claim_limit;
        couponData.max_limit = max_limit;

        const couponInfo = await Coupon.insert_coupon(
            db.mysql.write,
            couponData,
        );

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: couponInfo,
        };

        if (package_id != 'null') {
            couponCodepackage(req, res, coupon_code, package_id);
        }

        if (student_id != 'null') {
            couponCodestudent(
                req,
                res,
                coupon_code,
                student_id,
                coupon_applicability_type,
            );
        }
        const couponCodeTargetData = {};
        if (target_group_id != 'null' && target_group_id) {
            couponCodeTargetData.coupon_code = coupon_code;
            couponCodeTargetData.type = coupon_applicability_type;
            couponCodeTargetData.value = target_group_id;

            await Coupon.insert_coupon_target_group_id_mapping(
                db.mysql.write,
                couponCodeTargetData,
            );
        }
        const couponCodeAssortmentData = {};
        if (assortment != 'null' && assortment) {
            couponCodeAssortmentData.coupon_code = coupon_code;
            couponCodeAssortmentData.type = coupon_applicability_type;
            couponCodeAssortmentData.value = assortment;

            await Coupon.insert_coupon_assortment_mapping(
                db.mysql.write,
                couponCodeAssortmentData,
            );
        }
        const couponCodeGenricData = {};
        if (coupon_applicability_type == 'generic') {
            couponCodeGenricData.coupon_code = coupon_code;
            couponCodeGenricData.type = coupon_applicability_type;

            await Coupon.insert_coupon_assortment_mapping(
                db.mysql.write,
                couponCodeGenricData,
            );
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        next(e);
        return console.error(e);
    }
}

async function couponCodepackage(req, res, coupon_code, package_id) {
    config = req.app.get('config');
    db = req.app.get('db');
    JSON.parse(package_id).forEach((element) => Coupon.insert_coupon_package_id_mapping(
        element,
        coupon_code,
        db.mysql.write,
    ));
}

async function couponCodestudent(
    req,
    res,
    coupon_code,
    student_id,
    coupon_applicability_type,
) {
    config = req.app.get('config');
    db = req.app.get('db');
    JSON.parse(student_id).forEach((element) => Coupon.insert_coupon_student_id_mapping(
        element,
        coupon_code,
        coupon_applicability_type,
        db.mysql.write,
    ));
}

async function getTargetGroup(req, res) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { couponcode } = req.query;
        console.log(req);
        const couponInfo = await Coupon.getTargetGroupCouponByCode(
            couponcode,
            db.mysql.read,
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: couponInfo,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function postTargetGroup(req, res) {
    try {
        const {
            id,
            user_exam,
            user_class,
            user_locale,
            sql,
            expert_id,
        } = req.body;
        config = req.app.get('config');
        db = req.app.get('db');
        const targetGroupData = {};
        targetGroupData.id = id;
        targetGroupData.user_exam = user_exam;
        targetGroupData.user_class = user_class;
        targetGroupData.user_locale = user_locale;
        targetGroupData.sql = sql;
        targetGroupData.updated_by = expert_id;
        const couponInfo = await Coupon.postTargetGroupCouponByCode(
            targetGroupData,
            db.mysql.write,
        );
        const coupons = await Coupon.getCouponCodeByTargetGroupId(db.mysql.read, id);
        const couponList = [];
        for (let i = 0; i < coupons.length; i++) {
            couponList.push(coupons[i].coupon_code);
        }
        const xAuthToken = Token.sign({ id: 724515 }, config.jwt_secret_new);
        await Utility.updatePercolateIndex(couponList, xAuthToken);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: couponInfo,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function updateCouponIndex(req, res) {
    try {
        const {
            coupon_codes,
        } = req.body;
        config = req.app.get('config');
        if (coupon_codes) {
            const couponList = coupon_codes.split(',');
            if (couponList.length) {
                const xAuthToken = Token.sign({ id: 724515 }, config.jwt_secret_new);
                const result = await Utility.updatePercolateIndex(couponList, xAuthToken);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: result,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: [],
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getTargetGroupById(req, res) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { id } = req.query;
        console.log(req);
        const groupInfo = await Coupon.TargetGroupByid(
            id,
            db.mysql.read,
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: groupInfo,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getPackagesByCouponCode(req, res) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { coupon_code } = req.query;
        const packageInfo = await Coupon.getPckagesByCouponCode(
            coupon_code,
            db.mysql.read,
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: packageInfo,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getApplicableTgCoupons(db, activeTgCoupons, studentID, sClass, locale, packageInfo) {
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

    console.log(applicableTgCoupons);
    return applicableTgCoupons;
}

async function applicableCouponCodes(req, res) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        let { student_id, locale } = req.user;
        const { student_class } = req.user;
        const { version_code } = req.headers;
        const { variant_id, payment_for, student_mobile_for_reseller } = req.body;
        const { switch_assortment } = req.body || '';

        if (!_.isEmpty(student_mobile_for_reseller)) {
            let studentInfo = await Student.getStudentByPhone(student_mobile_for_reseller, db.mysql.read);
            if (_.isEmpty(studentInfo)) {
                const studentInsertObj = {
                    phone_number: student_mobile_for_reseller,
                    language: 'en',
                    is_web: 0,
                    student_username: `Guest_${student_mobile_for_reseller}`,
                    is_online: 950,
                    updated_at: moment().add(5, 'h').add(30, 'minute').toISOString(),
                };
                const studentInfoInsert = await StudentModulesHelper.addByMobileUpdated(studentInsertObj, db.mysql.write);
                studentInsertObj.student_id = studentInfoInsert.insertId;
                studentInfo = [studentInsertObj];
            }
            student_id = studentInfo[0].student_id;
        }

        const [apiToUse, currencyAndCountryObj] = await Promise.all([
            Properties.getValueByBucketAndName(db.mysql.read, 'coupons', 'dn_cpn_api'),
            StudentHelper.getUserCountryAndCurrency(db, student_id),
        ]);
        // if (!_.isEmpty(apiToUse) && apiToUse[0].value == 1) {
        // eslint-disable-next-line no-constant-condition
        console.log(apiToUse);
        const finalDatum = {};
        finalDatum.title = `${global.t8[locale].t('Apply Coupon'.toUpperCase(), 'Apply Coupon')}`;
        finalDatum.heading1 = `${global.t8[locale].t('Coupon Code'.toUpperCase(), 'Coupon Code')}`;
        finalDatum.btn_cta = `${global.t8[locale].t('Apply')}`;
        finalDatum.hint_text = `${global.t8[locale].t('Apply Coupon'.toUpperCase(), 'Apply Coupon')}`;
        finalDatum.heading2 = `${global.t8[locale].t('Applicable Coupons'.toUpperCase(), 'Applicable Coupons')}`;
        finalDatum.coupon_list = [];
        responseData.data = finalDatum;

        if (payment_for == 'course_package' || payment_for == 'doubt' || payment_for == 'explore_view' || payment_for === 'paid_user_championship') {
            if (!_.isEmpty(apiToUse) && apiToUse[0].value == '1') {
                let { 'x-auth-token': xAuthToken } = req.headers;
                if (!_.isEmpty(student_mobile_for_reseller)) {
                    xAuthToken = Token.sign({ id: student_id }, config.jwt_secret_new);
                }
                const params = {
                    student_id,
                    variant_id,
                    is_show: 1,
                    switch_assortment,
                };
                responseData.data = await CouponContainer.getApplicableCouponsFromCpn(xAuthToken, params);
            } else {
                const finalData = {};
                finalData.title = `${global.t8[locale].t('Apply Coupon'.toUpperCase(), 'Apply Coupon')}`;
                finalData.heading1 = `${global.t8[locale].t('Coupon Code'.toUpperCase(), 'Coupon Code')}`;
                finalData.btn_cta = `${global.t8[locale].t('Apply')}`;
                finalData.hint_text = `${global.t8[locale].t('Apply Coupon'.toUpperCase(), 'Apply Coupon')}`;
                finalData.heading2 = `${global.t8[locale].t('Applicable Coupons'.toUpperCase(), 'Applicable Coupons')}`;
                finalData.coupon_list = await CouponContainer.getAllCouponsForStudentUsingVariantID(db, {
                    variant_id, student_class, locale, version_code, student_id, is_show: 1,
                });
                finalData.widgets = [
                    {
                        type: 'widget_coupon_list',
                        data: {
                            title: 'Available Offers',
                            items: finalData.coupon_list,
                        },
                    },
                ];
                finalData.button_text = 'Close';

                responseData.data = finalData;
            }
            if (payment_for === 'paid_user_championship' && +version_code >= 973) {
                // const data = await PaidUserChampionshipMysql.getUnclaimedTshirts(db.mysql.read, student_id);
                // if (data.length > 0) {
                //     responseData.data.widgets[0].data.items.push({
                //         coupon_title: locale === 'hi' ? 'टी-शर्ट' : 'T-shirt',
                //         amount: 0,
                //         amount_saved: '',
                //         validity: `Valid till ${moment(data[0].created_at).add(30, 'days').format('hh:mm A DD-MM-yy')}`,
                //         btn_cta: locale !== 'hi' ? 'Apply Coupon' : 'कूपन लगाएं',
                //         coupon_code_text: locale === 'hi' ? 'अभी पाओ' : 'Claim Now',
                //         deeplink: `doubtnutapp://submit_address_dialog?type=paid_user_championship_reward&id=${data[0].id}`,
                //     });
                // }
                if (_.get(responseData, 'data.widgets[0].data.items', []).length === 0) {
                    // if (true) {
                    responseData.data = {
                        show_close_btn: true,
                        wrap_height: true,
                        widgets: [
                            {
                                type: 'promo_list',
                                data: {
                                    items: [
                                        {
                                            image_url: `${config.staticCDN}engagement_framework/2B6B4738-5804-77CB-67FB-9D39D8E6CCDE.webp`,
                                            scale_type: 'FIT_CENTER',
                                            width: '128',
                                            height: '128',
                                        },
                                    ],
                                    ratio: '1:1',
                                    height: '128',
                                },
                                layout_config: {
                                    margin_top: 14,
                                    margin_left: 24,
                                    margin_right: 24,
                                },
                            },
                            {
                                type: 'text_widget',
                                data: {
                                    title: locale === 'hi' ? 'अभी आपके पास कोई रिवॉर्ड नहीं है। पढो और जीतो रिवॉर्ड्स, कूपन्स और फीस बैक' : 'Abhi aapke pass koi reward nahi hai.Padho aur Jeeto rewards, coupons and fees back',
                                    text_color: '#000000',
                                    text_size: '14',
                                    background_color: '',
                                    isBold: 'false',
                                    alignment: 'center',
                                },
                                layout_config: {
                                    margin_top: 6,
                                    margin_left: 24,
                                    margin_right: 24,
                                },
                            },
                            {
                                data: {
                                    text_one: locale === 'hi' ? 'अभी पढ़ना शुरू करें' : 'Abhi padhna shuru karein',
                                    text_one_size: '14',
                                    text_one_color: '#eb532c',
                                    bg_color: '#00000000',
                                    bg_stroke_color: '#eb532c',
                                    assortment_id: '',
                                    deep_link: '',
                                    corner_radius: '4.0',
                                    elevation: '4.0',
                                    min_height: '36',
                                },
                                type: 'widget_button_border',
                                layout_config: {
                                    margin_top: 12,
                                    margin_left: 49,
                                    margin_right: 49,
                                    margin_bottom: 21,
                                },
                            },
                        ],
                    };
                }
            }
        }
        if (currencyAndCountryObj.country != 'IN') {
            locale = 'uk_en';
        }
        if (version_code >= 972) {
            responseData.data.title = `${global.t8[locale].t('Select a Coupon'.toUpperCase(), 'Select a Coupon')}`;
            responseData.data.heading1 = `${global.t8[locale].t('Apne course ke liye best coupon chuniye'.toUpperCase(), 'Apne course ke liye best coupon chuniye')}`;
            responseData.data.hint_text = `${global.t8[locale].t('Enter Coupon Code')}`;
            responseData.data.heading2 = `${global.t8[locale].t('Applicable Coupons'.toUpperCase(), 'Applicable Coupons')}`;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function postCouponPackages(req, res) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { coupon_code, packages } = req.body;
        const packageArray = packages.split(',');
        const packageList = [];
        for (let i = 0; i < packageArray.length; i++) {
            packageList.push([coupon_code, packageArray[i], 'system']);
        }
        const packageInfo = await Coupon.insertPackageMapping(
            db.mysql.write,
            packageList,
        );
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

function generateCouponCode() {
    let result = '';
    const length = 8;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result.toUpperCase();
}

async function createResellerCouponObj(couponCode, maxAmount) {
    const obj = {
        title: 'Reseller Coupon',
        type: 'instant',
        coupon_code: couponCode,
        start_date: moment().startOf('day').format('YYYY-MM-DD HH:mm:ss'),
        end_date: moment().add(1, 'years').endOf('day').format('YYYY-MM-DD HH:mm:ss'),
        value_type: 'percent',
        value: 100,
        is_show: 0,
        Is_active: 1,
        min_version_code: 754,
        max_version_code: 10000,
        limit_per_student: 1,
        claim_limit: 1,
        max_limit: maxAmount,
        ignore_min_limit: 1,
        created_by: 'reseller',
    };
    return obj;
}

async function createResellerCoupon(req, res, next) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { package_id: packageId } = req.body;
        const { variant_id: variantId } = req.body;
        const { buyer_mobile: mobile } = req.body;
        const isDirectActivation = parseInt(req.body.is_direct_activation);
        const { amount_received: amountReceived } = req.body;
        const { net_amount: amount } = req.body;
        const { pin } = req.body;
        const { student_id: resellerStudentId } = req.user;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        const dataHerdingKey = `PRE_RESELLER_COUPON_DATA_CACHE_${resellerStudentId}`;
        if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, dataHerdingKey)) {
            responseData.data.status = 'FAILURE';
            responseData.data.message = 'Transaction already in progress. Please check ledger';
            return res.status(responseData.meta.code).json(responseData);
        }
        await redisUtility.setCacheHerdingKeyNew(db.redis.write, dataHerdingKey);

        const verifyReseller = await PayMySQL.getResellerInfoByStudentId(db.mysql.read, resellerStudentId);

        if (verifyReseller[0].pin && verifyReseller[0].pin != pin) {
            responseData.data.status = 'FAILURE';
            responseData.data.message = 'Incorrect Pin';
            return res.status(responseData.meta.code).json(responseData);
        }

        if (verifyReseller.length) {
            const couponList = [];
            const walletTransfer = await PaymentHelper.resellerWalletCashDebit(resellerStudentId, amount, db);
            console.log(walletTransfer);
            if (walletTransfer.status == 'SUCCESS') {
                while (!couponList.length) {
                    const couponCode = generateCouponCode();
                    const findCoupon = await Coupon.getCouponByCode(couponCode, db.mysql.read);
                    if (_.isEmpty(findCoupon)) {
                        try {
                            const packageInfo = await Package.getNewPackageFromVariantIdWithCourseDetailsv1(db.mysql.read, variantId);
                            const maxAmount = !_.isEmpty(packageInfo) ? parseInt(packageInfo[0].final_amount) : 100000;
                            const couponObj = await createResellerCouponObj(couponCode, maxAmount);
                            const couponApplicabilityObj = {
                                coupon_code: couponCode,
                                type: 'assortment-type',
                                value: 'course',
                            };
                            const couponResellerMappingObj = {
                                coupon_code: couponCode,
                                reseller_student_id: resellerStudentId,
                                buyer_mobile: mobile,
                                package_id: packageId,
                                variant_id: variantId,
                                package_amount: amount,
                                cash_collected: amountReceived,
                                is_direct_activation: isDirectActivation,
                            };
                            await Promise.all([
                                Coupon.insert_coupon(db.mysql.write, couponObj),
                                Coupon.insert_coupon_package_id_mapping(packageId, couponCode, db.mysql.write),
                                Coupon.insert_coupon_assortment_mapping(db.mysql.write, couponApplicabilityObj),
                                Coupon.insertCouponResellerMapping(db.mysql.write, couponResellerMappingObj),
                            ]);
                            couponList.push(couponObj);
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }
                if (isDirectActivation) {
                    const orderId = (moment(new Date()).format('YYYYMMDDHHmmssSSS')).toString() + Math.floor(Math.random() * 100);
                    let studentInfo = await Student.getStudentByPhone(mobile, db.mysql.read);
                    if (_.isEmpty(studentInfo)) {
                        const studentInsertObj = {
                            phone_number: mobile,
                            language: 'en',
                            is_web: 0,
                            student_username: `Guest_${mobile}`,
                            is_online: 950,
                            updated_at: moment().add(5, 'h').add(30, 'minute').toISOString(),
                        };
                        const studentInfoInsert = await StudentModulesHelper.addByMobileUpdated(studentInsertObj, db.mysql.write);
                        studentInsertObj.student_id = studentInfoInsert.insertId;
                        studentInfo = [studentInsertObj];
                    }
                    const insertObj = {};
                    insertObj.order_id = orderId;
                    insertObj.payment_for = 'course_package';
                    insertObj.amount = 0;
                    insertObj.student_id = studentInfo[0].student_id;
                    insertObj.status = 'SUCCESS';
                    insertObj.source = 'RESELLER';
                    insertObj.total_amount = amount;
                    insertObj.discount = amount;
                    insertObj.coupon_code = couponList[0].coupon_code;
                    insertObj.payment_for_id = resellerStudentId;
                    insertObj.variant_id = variantId;
                    insertObj.partner_order_id = orderId;
                    insertObj.mode = 'DN';
                    insertObj.partner_txn_id = orderId;
                    insertObj.partner_txn_time = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                    const insertPaymentInfo = await PayMySQL.createPayment(db.mysql.write, insertObj);
                    insertObj.id = insertPaymentInfo.insertId;
                    const paymentInfo = [insertObj];
                    await PaymentHelper.doSuccessPaymentProcedure(db, config, paymentInfo, {});
                    responseData.data.status = 'SUCCESS';
                    responseData.data.message = 'Course Activated Successfully';
                } else {
                    responseData.data.status = 'SUCCESS';
                    responseData.data.coupon_code = couponList[0].coupon_code;
                }
            } else {
                responseData.meta.message = 'FAILURE';
                responseData.data.message = walletTransfer.message;
                responseData.data.reason = walletTransfer.reason;
            }
        } else {
            responseData.meta.message = 'FAILURE';
            responseData.data.message = 'Something Went Wrong, Contact Tech Team';
            responseData.data.reason = 'Reseller Not Verified';
        }
        await redisUtility.removeCacheHerdingKeyNew(db.redis.write, dataHerdingKey);
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getResellerCouponLedger(req, res, next) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const { student_id: resellerStudentId } = req.user;
        console.log(resellerStudentId);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };

        const verifyReseller = await PayMySQL.getResellerInfoByStudentId(db.mysql.read, resellerStudentId);
        if (verifyReseller.length) {
            const couponHistoryList = await Coupon.getResellerCouponHistory(db.mysql.read, resellerStudentId);
            const finalData = [];
            for (let i = 0; i < couponHistoryList.length; i++) {
                const finalDatum = {
                    date: moment(couponHistoryList[i].created_at).format('h:mm a, DD MMM'),
                    package_name: couponHistoryList[i].package_name,
                    package_amount: couponHistoryList[i].package_amount,
                    cash_collected: couponHistoryList[i].cash_collected,
                    variant_id: couponHistoryList[i].variant_id,
                    buyer_mobile: couponHistoryList[i].buyer_mobile,
                    coupon_code: couponHistoryList[i].coupon_code,
                    status: '',
                };
                if (couponHistoryList[i].is_direct_activation == 1) {
                    finalDatum.status = 'Course Activated';
                }
                finalData.push(finalDatum);
            }
            responseData.data.reseller_coupon_ledger = finalData;
        } else {
            responseData.meta.message = 'FAILURE';
            responseData.data.message = 'Something Went Wrong, Contact Tech Team';
            responseData.data.reason = 'Reseller Not Verified';
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    couponCodeCheck,
    couponCodePost,
    couponCodepackage,
    couponCodestudent,
    getTargetGroup,
    postTargetGroup,
    getTargetGroupById,
    getPackagesByCouponCode,
    applicableCouponCodes,
    postCouponPackages,
    updateCouponIndex,
    createResellerCoupon,
    getResellerCouponLedger,
};
