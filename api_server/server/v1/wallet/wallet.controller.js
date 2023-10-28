const _ = require('lodash');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const Student = require('../../../modules/mysql/student');
const PayMySQL = require('../../../modules/mysql/payment');
const PaymentHelper = require('../../helpers/payment');
const CourseHelper = require('../../helpers/course');
const { getWalletBalance } = require('../../../modules/wallet/Utility.wallet');

function getPDFData(data, purchaseCheck, oneTapPayment) {
    const o = {
        pdf_url: data.resource_reference,
        assortment_id: data.assortment_id,
        resource_type: 'pdf',
        title: `${data.display}`,
        title2: `By ${data.expert_name}`,
        is_premium: true,
        show_emi_dialog: false,
        variant_id: data.variant_id,
        is_onetap_payment: oneTapPayment,
        icon_url: '',
        set_width: true,
        resource_text: 'PDF',
        button_state: 'payment',
        payment_deeplink: `doubtnutapp://vip?assortment_id=${data.assortment_id}`,
    };
    const checkPurchase = (obj) => obj.id === data.package_id;

    if (purchaseCheck.some(checkPurchase)) {
        o.is_purchased = true;
        o.buy_text = 'EXPLORE';
        o.is_vip = true;
        o.lock_state = 2;
    } else {
        o.is_purchased = false;
        o.amount_to_pay = `₹${data.display_price}`;
        o.amount_strike_through = data.base_price !== data.display_price ? `₹${data.base_price}` : '';
        o.buy_text = 'BUY NOW';
        o.discount = data.base_price - data.display_price > 0 ? `(${Math.round(((data.base_price - data.display_price) / data.base_price) * 100)}% OFF)` : '';
        o.display_price = data.display_price;
        o.is_vip = false;
        o.lock_state = 1;
    }
    return {
        type: 'widget_course_resource',
        data: o,
    };
}

async function suggestedResources(req, res, next) {
    try {
        const db = req.app.get('db');
        let { studentClass } = req.query;
        const { student_id: studentId } = req.user;
        const { locale } = req.user;
        const config = req.app.get('config');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        let { version_code: versionCode } = req.headers;
        const xAuthToken = req.headers['x-auth-token'];
        if (!versionCode) {
            versionCode = 602;
        }

        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;

        let walletPdfData = [];
        let courses = [];
        let purchaseCheck = [];

        const rewardStatus = await CourseMysqlV2.checkRewardExistence(db.mysql.read, studentId);

        const walletAmt = await getWalletBalance({ xAuthToken: req.headers['x-auth-token'] });

        // For PDF - passing resourceType = 2
        if (!_.isNull(walletAmt) && walletAmt.meta.success && walletAmt.data.is_active === 1) {
            const resourceLanguage = locale === 'en' ? 'ENGLISH' : 'HINDI';
            walletPdfData = await CourseMysqlV2.getResourcesWalletPage(db.mysql.read, studentClass, 2, parseInt(walletAmt.data.amount), resourceLanguage);

            const packageList = [];
            for (let i = 0; i < walletPdfData.length; i++) {
                packageList[i] = walletPdfData[i].package_id;
            }
            if (packageList.length > 0) {
                purchaseCheck = await CourseMysqlV2.checkPurchasedPdf(db.mysql.read, packageList, studentId);
            }
        }

        const oneTapPayment = Boolean(rewardStatus[0].EXIST);
        const promises = [];
        for (let i = 0; i < walletPdfData.length; i++) {
            promises.push(getPDFData(walletPdfData[i], purchaseCheck, oneTapPayment));
        }
        let items = await Promise.all(promises);
        items = items.filter((e) => e !== 0);

        const data = {
            type: 'widget_parent',
            data: {
                title: 'VIP - PDF Notes',
                link_text: '',
                deeplink: '',
                items,
            },
        };
        courses.push(data);

        let popularCourseItems = await CourseHelper.getPaidAssortmentsData({
            db,
            studentClass,
            config,
            versionCode,
            studentId,
            studentLocale: locale,
            xAuthToken,
            page: 'WALLET',
            eventPage: 'WALLET',
            pznElasticSearchInstance,
        });
        popularCourseItems = popularCourseItems && popularCourseItems.items ? popularCourseItems.items : [];
        const popularCourseWidget = {
            widget_type: 'widget_parent',
            widget_data: {
                title: locale === 'hi' ? 'लोकप्रिय कोर्सेस' : 'Popular Courses',
                link_text: '',
                deeplink: '',
                items: popularCourseItems,
            },
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
        };
        if (!_.isEmpty(popularCourseItems)) {
            courses.unshift(popularCourseWidget);
        }
        if (items.length === 0) {
            courses = null;
        }

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: { courses },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function showWalletVpa(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId, locale } = req.user;
        const { version_code: versionCode } = req.headers;
        let vpaDetails = {};

        if (versionCode >= 939) {
            const vpaSummary = await PaymentHelper.getVpaDetails({ db, student_id: studentId, locale });

            if (!_.isEmpty(vpaSummary)) {
                vpaDetails = { ...vpaSummary };
            } else {
                vpaDetails.description = 'Something Went Wrong';
                vpaDetails.details = [];
                vpaDetails.btn_show = false;
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { ...vpaDetails },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    suggestedResources,
    showWalletVpa,
};
