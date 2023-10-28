const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const Data = require('../../../data/data');

function getActionTabWidget() {
    return {
        type: 'plan_filters',
        data: {
            items: [
                {
                    id: 'buy',
                    display: 'BUY NOW',
                },
                {
                    id: 'my',
                    display: 'MY PLANS',
                },
            ],
        },
    };
}

async function getCategoryWidget(db, category) {
    const result = await Package.getPackageCategoriesByCategory(db.mysql.read, category);
    return {
        type: 'course_exam_tabs',
        data: {
            title: 'You are buying for',
            items: result,
        },
    };
}

async function getCourseTypeWidget(db, categoryID) {
    const result = await Package.getPackageSubCategories(db.mysql.read, categoryID);
    return {
        type: 'course_type_filters',
        data: {
            title: 'Course Type',
            items: result,
        },
    };
}

function getInfoWidget(categoryID, courseType) {
    const data = Data.getInfoWidgetForPaymentByCategory(categoryID, courseType);
    return {
        type: 'package_info',
        data: {
            items: [{
                title: data.get.title,
                icon_correct: true,
                list: data.get.items // courseTye === 'vod' ? Data.recordedClassInfoIIT.get : Data.liveClassInfoIIT.get,
            },
            {
                title: data.dontGet.title,
                icon_correct: false,
                list: data.dontGet.items, //courseTye === 'vod' ? Data.recordedClassInfoIIT.dontGet : Data.liveClassInfoIIT.dontGet,
            },
            ],
        },
    };
}

function paymentCard(paymentCardState, categoryID, isVip) {
    return {
        type: 'payment_card_list',
        data: {
            items: [{
                text1: paymentCardState.message.text,
                text2: '',
                button_text: paymentCardState.message.button_text,
                variant_id: paymentCardState.variantId,
                event_name: !isVip ? 'trial' : 'vip',
                action: {
                    action_activity: !isVip ? 'trial' : 'payment_page',
                    action_data: {
                        category_id: categoryID,
                        page_type: 'buy',
                    },
                },
            }],
        },
    };
}

function getPackageListWidget(packageList) {
    return {
        type: 'package_list',
        data: {
            items: packageList,
        },
    };
}
function getMyPlansWidget(packageList) {
    // transform
    return {
        type: 'my_plan',
        data: {
            items: packageList,
        },
    };
}
function getActivePackages(packageList) {
    const momentNow = moment().add(5, 'hours').add(30, 'minutes');
    return packageList.reduce((filtered, option) => {
        if ((momentNow.isBefore(option.end_date) && option.sub_active)) {
            const obj = {};
            obj.title = option.category;
            obj.sub_title = option.package_subcategory;
            obj.bottom_title = option.name;
            filtered.push(obj);
        }
        return filtered;
    }, []);
}
module.exports = {
    getActionTabWidget,
    getCategoryWidget,
    getCourseTypeWidget,
    getInfoWidget,
    paymentCard,
    getPackageListWidget,
    getMyPlansWidget,
    getActivePackages,
};
