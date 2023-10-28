const _ = require('lodash');
const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const CourseMysql = require('../../../modules/mysql/course');
const CourseHelperV4 = require('../../v4/course/course.helper');
const PackageContainer = require('../../../modules/containers/package');
const telemetry = require('../../../config/telemetry');
const Flagr = require('../../../modules/containers/Utility.flagr');
const Data = require('../../../data/data');
const PackageHelper = require('./package.helper');
const Properties = require('../../../modules/mysql/property');
const Liveclass = require('../../../modules/mysql/liveclass');

let db;
let config;

async function emiPayment(variantAttachment, packageList) {
    const emiPackages = packageList.filter((e) => e.type === 'emi');
    const childPackages = await Package.getChildPackages(db.mysql.read);

    for (let j = 0; j < emiPackages.length; j++) {
        const child = childPackages.filter((e) => e.master_parent === emiPackages[j].id);
        const emiDetails = variantAttachment.emi_details.filter((e) => parseInt(e.package_duration) === emiPackages[j].duration_in_days)[0];
        emiPackages[j].downpayment = `₹ ${emiDetails.downpayment[0]}`;
        emiPackages[j].offer_amount = parseInt(emiDetails.price);
        emiPackages[j].emi_options = [
            {
                id: child[0].child_id,
                text: `First payment ${emiDetails.downpayment[0]}`,
                text1: '',
                amount: emiDetails.downpayment[0],
                is_completed: false,
            },
        ];
        let month = 0;
        for (let k = 1; k < child.length; k++) {
            month += emiDetails.duration[k - 1] / 30;
            emiPackages[j].emi_options.push(
                {
                    id: child[k].child_id,
                    text: `After ${month} month ${emiDetails.downpayment[k]}`,
                    text1: '',
                    amount: emiDetails.downpayment[k],
                    is_completed: false,
                },
            );
        }
    }

    return packageList;
}

async function fetchDefaultPackages(studentId, showSelection, flagrResponse, onlyEMi, selectedPackage, courseType, categoryId) {
    let { variantAttachment } = flagrResponse;
    if (variantAttachment.is_new) variantAttachment = variantAttachment[courseType];
    let durationInDaysList;
    let packageList = [];
    if (onlyEMi) {
        packageList = await Package.getPackageById(db.mysql.read, selectedPackage[0].master_parent);
    } else {
        if (!_.isEmpty(variantAttachment) && typeof variantAttachment.package_duration !== 'undefined') {
            durationInDaysList = variantAttachment.package_duration;
        } else {
            durationInDaysList = config.default_package_duration_list;
        }
        if (durationInDaysList.length > 0) {
            const durationInDaysListEmi = [];
            if (variantAttachment.emi) {
                variantAttachment.emi_details.forEach((e) => durationInDaysListEmi.push(e.package_duration));
            }
            const promise = [];
            promise.push(Package.getPackagesByDaysAndCategoryIDAndCourseType(db.mysql.read, durationInDaysList, categoryId, courseType));
            if (durationInDaysListEmi.length) {
                promise.push(Package.getPackagesByDaysAndCategoryIDAndCourseTypeEmi(db.mysql.read, durationInDaysListEmi, categoryId, courseType));
            }
            packageList = await Promise.all(promise);
            if (packageList.length > 1) {
                packageList = [...packageList[0], ...packageList[1]];
            } else {
                packageList = packageList[0];
            }

        }
    }
    for (let i = 0; i < packageList.length; i++) {
        // const offerAmount = packageList[i].original_amount - parseInt(variantAttachment.final_price[i]);
        packageList[i].offer_amount = parseInt(variantAttachment.final_price[i]);
        packageList[i].duration = PackageContainer.parseDuration(packageList[i].duration_in_days);
        packageList[i].off = `${parseInt(Math.ceil((1 - (variantAttachment.final_price[i] / packageList[i].original_amount)) * 100))}%\noff`;
        packageList[i].selected = false;
        packageList[i].view_type = 'default';
        packageList[i].duration = packageList[i].name;
        packageList[i].original_amount = parseInt(packageList[i].original_amount);
        if (packageList[i].type === 'emi') {
            packageList[i].view_type = 'emi';
            packageList[i].title1 = Data.emi_options.title1;
            packageList[i].title2 = Data.emi_options.title2;
            packageList[i].sub_title1 = Data.emi_options.subTitle1;
            packageList[i].sub_title2 = Data.emi_options.subTitle2;
            packageList[i].title_color = Data.emi_options.titleColor;
            packageList[i].bottom_title = '';
        }
    }
    if (packageList.length > 0) {
        if (showSelection) {
            packageList[0].selected = true;
        }
    }

    packageList = await emiPayment(variantAttachment, packageList);

    return packageList;
}

async function checkSelectedPackage(main, checkSelected, selectedPackage, studentPackage, flagrResponse, missDueDate, courseType) {
    let emiStartDate;
    console.log(selectedPackage)
    if (selectedPackage[0].type === 'emi') {
        emiStartDate = await Package.getFirstEmiDate(db.mysql.read, selectedPackage[0].master_parent, studentPackage.student_id);
        const result = await Package.getLatestEmiPayment(db.mysql.read, studentPackage.student_id, selectedPackage[0].master_parent);
        if (result[0] && (result[0].end_date > new Date()) && result[0].is_active) {
            selectedPackage = result;
        }
    }
    for (let i = 0; i < main.package_list.length; i++) {
        main.package_list[i].offer_amount = parseInt(main.package_list[i].offer_amount);
        main.package_list[i].original_amount = parseInt(main.package_list[i].original_amount);
        main.package_list[i].duration = PackageContainer.parseDuration(main.package_list[i].duration_in_days);
        main.package_list[i].off = `${parseInt(Math.ceil((1 - (main.package_list[i].offer_amount / main.package_list[i].original_amount)) * 100))}%\noff`;
        main.package_list[i].selected = false;
        if (main.package_list[i].id === selectedPackage[0].student_package_id) {
            main.package_list[i].selected = true;
            checkSelected = 1;
        } else if (selectedPackage[0].type === 'emi' && main.package_list[i].id === selectedPackage[0].master_parent) {
            console.log('yes');
            checkSelected = 1;
            let { variantAttachment } = flagrResponse;
            if (variantAttachment.is_new) variantAttachment = variantAttachment[courseType];
            const downpaymentList = variantAttachment.emi_details.filter((e) => parseInt(e.package_duration) === main.package_list[i].duration_in_days)[0];
            main.package_list[i].title1 = Data.emi_options.middleTitle1;
            main.package_list[i].title2 = `due in ${downpaymentList.duration[selectedPackage[0].emi_order - 1]} days`;
            main.package_list[i].bottom_title = missDueDate ? Data.emi_options.middleBottomTitle : '';
            main.package_list[i].downpayment = `₹ ${downpaymentList.downpayment[selectedPackage[0].emi_order]}`;
            if (selectedPackage[0].is_last) {
                main.package_list[i].title1 = Data.emi_options.endTitle1;
                main.package_list[i].bottom_title = `All payments cleared. Your plan is valid till ${moment(selectedPackage[0].end_date).format('Do MMMM YYYY')}`;
                main.package_list[i].title2 = '';
                main.package_list[i].downpayment = '';
            } else {
                main.package_list[i].emi_options[selectedPackage[0].emi_order].text1 = 'PAY NOW';
            }
            let daysDuration = 0;
            for (let j = 0; j < main.package_list[i].emi_options.length; j++) {
                if (j > 0) {
                    daysDuration += downpaymentList.duration[j - 1];
                    const startDate = moment(emiStartDate[0].start_date).add(daysDuration, 'days');
                    main.package_list[i].emi_options[j].text = `Before ${startDate.format('DD-MMM-YYYY')}, ${downpaymentList.downpayment[j]}`;
                }
                if (main.package_list[i].emi_options[j].id <= selectedPackage[0].student_package_id) {
                    main.package_list[i].emi_options[j].is_completed = true;
                    main.package_list[i].emi_options[j].text = `${main.package_list[i].emi_options[j].text} - PAID`;
                }
            }
        }
    }
    return checkSelected;
}

async function fetchInfoForUserOnSubscription(studentPackage, now, flagrResponse, selectedPackage, missDueDate, courseType, categoryId) {
    const main = {};
    let onlyEMi = false;
    selectedPackage = [selectedPackage];
    let checkSelected = 0;
    if (selectedPackage[0].type === 'emi' || missDueDate) { onlyEMi = true; }
    main.package_list = await fetchDefaultPackages(studentPackage.student_id, true, flagrResponse, onlyEMi, selectedPackage, courseType, categoryId);
    checkSelected = await checkSelectedPackage(main, checkSelected, selectedPackage, studentPackage, flagrResponse, missDueDate, courseType);

    if (!checkSelected) {
        main.package_list[0].selected = true;
    }
    return main.package_list;
}

async function fetchSubscriptionDetails(studentId, flagrResponse, paymentCardState, courseType, categoryId) {
    // const response = {};
    //
    // const main = {};
    //
    // main.subscription = false;
    // main.trial = false;
    // main.title = 'Apna Plan Select karo';
    // main.description = 'Get unlimited access to all teachers, courses and material';
    // main.description = 'Dear student, We are upgrading KOTA CLASSES. Payment options will be available from 12 June, 2020. Keep Learning!';
    const packageList = await fetchDefaultPackages(studentId, true, flagrResponse, false, [], courseType, categoryId);

    // main.cta_text = 'BUY VIP PASS';

    // if (!paymentCardState.expiredTrial && !paymentCardState.expiredVip) {
    //     const topCard = {
    //         type: 'trial_card',
    //         action: {
    //             action_activity: 'start_trial',
    //             action_data: null,
    //         },
    //         title: `For ${flagrResponse.variantAttachment.trial_duration} Days get all the course material and teachers' lectures for free`,
    //         button_text: `START FREE TRIAL (${flagrResponse.variantAttachment.trial_duration} DAYS)`,
    //         data: {
    //             variant_id: paymentCardState.variantId,
    //         },
    //     };
    //     main.top_card = topCard;
    // }
    //
    // main.package_list = await fetchDefaultPackages(studentId, true, flagrResponse, false, [], courseType, categoryId);
    // response.main = main;
    return packageList;
}

async function info(req, res, next) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        const studentID = req.user.student_id;
        const xAuthToken = req.headers['x-auth-token'];
        const versionCode = req.headers.version_code;
        const widgets = [];
        const actionTabWidget = PackageHelper.getActionTabWidget();
        const pageType = req.query.page_type ? req.query.page_type : actionTabWidget.data.items[0].id;
        const { payment_details: payDetails } = req.query;
        let pageRef = 'detail';
        let pageTypeCategory = 'boards';
        let categoryIdPay;
        let courseTypePay;
        if (payDetails) {
            pageRef = JSON.parse(payDetails).page_ref;
            pageTypeCategory = JSON.parse(payDetails).page_type;
            categoryIdPay = JSON.parse(payDetails).category_id;
            courseTypePay = JSON.parse(payDetails).course_type;
        }
        let { studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        let showPaymentButton = true;
        // get action tabs
        widgets.push(actionTabWidget);
        // check if user is subscribed to category id and course type
        const studentPackageList = await CourseMysql.getUserSubscription(db.mysql.read, studentID);
        let categoryID;
        let flagrResponse;
        if (pageType === 'buy') {
            // get category tabs
            categoryID = req.query.category_id ? req.query.category_id : (req.query.id ? req.query.id : req.query.course_id);
            if (req.query.id || req.query.course_id) {
                const courseD = await Liveclass.getCourseDetails(db.mysql.read, categoryID);
                categoryID = courseD[0].category_id;
            }
            if (!categoryID) categoryID = categoryIdPay;
            categoryID = parseInt(categoryID);
            let categoryWidget;
            const categories = [];
            if (categoryID && versionCode >= 773) {
                categoryWidget = await PackageHelper.getCategoryWidget(db, [categoryID]);
            } else {
                let categoryData = await Package.getCategoriesByClass(db.mysql.read, studentClass);
                let showCategories = [];
                if (categoryData.length) {
                    categoryData.forEach((e) => showCategories.push(e.id));
                    categoryWidget = await PackageHelper.getCategoryWidget(db, showCategories);
                    if (categoryWidget.data.items.length) {
                        if(!categoryID) categoryID = categoryWidget.data.items[0].filter_id;
                    } else {
                        categoryData = await Package.getPackageCategories(db.mysql.read);
                        showCategories = [];
                        categoryData.forEach((e) => showCategories.push(e.filter_id));
                        categoryWidget = await PackageHelper.getCategoryWidget(db, showCategories);
                        if(!categoryID) categoryID = categoryWidget.data.items[0].filter_id;
                    }
                } else {
                    categoryData = await Package.getPackageCategories(db.mysql.read);
                    showCategories = [];
                    categoryData.forEach((e) => showCategories.push(e.filter_id));
                    categoryWidget = await PackageHelper.getCategoryWidget(db, showCategories);
                    if (!categoryID) categoryID = categoryWidget.data.items[0].filter_id;
                }
            }

            // get course type tabs
            let courseTypeWidget = await PackageHelper.getCourseTypeWidget(db, [categoryID]);
            if (pageRef == 'home') {
                if (pageTypeCategory == 'boards') {
                    let categoryData = await CourseMysql.getDistinctCategoryFromClass(db.mysql.read, studentClass);
                    categoryData.forEach((e)=> categories.push(e.category_id));
                    categoryWidget = await PackageHelper.getCategoryWidget(db, categories);
                } else {
                    let categoryData = await CourseMysql.getDistinctCategoryIITFromClass(db.mysql.read, studentClass);
                    categoryData.forEach((e) => categories.push(e.category_id));
                    categoryWidget = await PackageHelper.getCategoryWidget(db, categories);
                }
            }
            const courseType = req.query.course_type ? req.query.course_type : (courseTypePay ? courseTypePay : courseTypeWidget.data.items[0].id);
            if (!req.query.course_type) {
                if (courseTypeWidget.data.items[0].id != courseType) {
                    courseTypeWidget.data.items = courseTypeWidget.data.items.reverse();
                }
            }
            // courseTypeWidget.data.selected = courseType;
            widgets.push(categoryWidget);
            widgets.push(courseTypeWidget);

            // get info widget
            const infoWidget = await PackageHelper.getInfoWidget(categoryID,courseType);
            widgets.push(infoWidget);
            // get user package lists
            flagrResponse = await Flagr.evaluateServiceWrapper({
                db,
                xAuthToken,
                entityContext: { studentId: studentID.toString() },
                flagID: Data.categoryIDFlagrMap[categoryID],
                timeout: 3000,
            });

            const paymentCardState = CourseHelperV4.getPaymentCardStateV2({
                data: studentPackageList,
                flagrResponse,
                courseType,
                categoryID,
            });
            const packageDetail = paymentCardState.packageDetails;
            let userOnSubscription = false;
            let missDueDate = false;
            if (paymentCardState.isVip || paymentCardState.isTrial) {
                userOnSubscription = true;
            }
            // emi check
            if (!userOnSubscription && studentPackageList.length) {
                if (!_.isNull(packageDetail) && packageDetail.type === 'emi' && (!packageDetail.is_last)) {
                    missDueDate = true;
                }
            }
            let { variantAttachment } = flagrResponse;
            if (variantAttachment.is_new) variantAttachment = variantAttachment[courseType];
            console.log(variantAttachment.trial_duration)
            if (paymentCardState.noTrial && variantAttachment.trial_duration != -1) {
                const paymentCardWidget = await PackageHelper.paymentCard(paymentCardState, categoryID, paymentCardState.isVip);
                if (categoryID === 6) {
                    const similarActivePackages = await Package.similarActivePackages(db.mysql.read, studentID);
                    if (!similarActivePackages.length) {
                        widgets.push(paymentCardWidget);
                    }
                } else {
                    widgets.push(paymentCardWidget);
                }
            } else {
                let title = paymentCardState.isVip && !paymentCardState.isTrial ? `Your Doubtnut VIP is Valid till ${moment(packageDetail.end_date).format('Do MMMM YYYY')}` : paymentCardState.message.text;
                const daysLeft = paymentCardState.remainingDays;
                if (daysLeft <= config.subscription_threshold && !paymentCardState.isTrial && paymentCardState.isVip) {
                    if (missDueDate) {
                        title = 'Your VIP plan has expired';
                    } else if (daysLeft) {
                        title = `Your VIP plan expires in ${PackageContainer.parseDuration(daysLeft)}`;
                    } else {
                        title = `Your VIP plan expires ${PackageContainer.parseDuration(daysLeft)}`;
                    }
                }
                const simpleTextWidget = {
                    type: 'simple_text',
                    data: {
                        title: categoryID === 1 ? 'Learn From VMC Top Faculty' : 'पढ़ें भारत के सर्वश्रेष्ठ App पर',
                        margin_top: 0,
                    },
                };
                widgets.push(simpleTextWidget);
            }

            let packageList = [];
            const now = moment().add(5, 'hours').add(30, 'minutes');
            if (userOnSubscription || missDueDate) {
                // student is on subscription
                packageList = await fetchInfoForUserOnSubscription(studentPackageList[0], now, flagrResponse, packageDetail, missDueDate, courseType, categoryID);
            } else {
                // student is NOT on a subscription
                packageList = await fetchSubscriptionDetails(studentID, flagrResponse, paymentCardState, courseType, categoryID);
            }
            const packageListWidget = PackageHelper.getPackageListWidget(packageList);
            widgets.push(packageListWidget);
        } else {
            // my plan widget
            showPaymentButton = false;
            const simpleTextWidget = {
                type: 'simple_text',
                data: {
                    title: 'You have currently not purchased any courses.',
                },
            };
            const activePackages = await PackageHelper.getActivePackages(studentPackageList);
            if (activePackages.length === 0) {
                widgets.push(simpleTextWidget);
            } else {
                const packageListWidget = PackageHelper.getMyPlansWidget(activePackages);
                widgets.push(packageListWidget);
            }
        }
        const data = {
            title: 'Select Your Plan',
            widgets,
            course_id: categoryID,
            variant_id: pageType === 'buy' ? flagrResponse.variantID : 1,
            payment_help: { title: 'FAQs', list: await Properties.getNameAndValueByBucket(db.mysql.read, 'payment_help_vmc') },
            show_payment_button: showPaymentButton,
            payment_button_text: 'BUY NOW',
        };
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
};
