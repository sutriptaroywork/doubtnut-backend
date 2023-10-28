const _ = require('lodash');
// const { result } = require('lodash');
const moment = require('moment');
const Package = require('../../../modules/mysql/package');
const Properties = require('../../../modules/mysql/property');
const CourseMysql = require('../../../modules/mysql/course');
const CourseHelperV2 = require('../../v2/course/course.helper');
const CourseHelperV4 = require('../../v4/course/course.helper');
const PackageContainer = require('../../../modules/containers/package');
const telemetry = require('../../../config/telemetry');
const Flagr = require('../../../modules/containers/Utility.flagr');
const Liveclass = require('../../../modules/mysql/liveclass');
const LiveclassHelper = require('../../helpers/liveclass');
const Data = require('../../../data/liveclass.data');
const EmiData = require('../../../data/data');
// const { studentId } = require('../../../modules/mongo/whatspp.netcore');

let db;
let config;

async function emiPayment(variantAttachment, packageList) {
    const emiPackages = packageList.filter((e) => e.type === 'emi');
    const childPackages = await Package.getChildPackages(db.mysql.read);
    console.log(packageList);

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

async function fetchDefaultPackages(studentId, showSelection, variantAttachment, onlyEMi, selectedPackage, isLiveclass, courseDetails) {
    // let { variantAttachment } = flagrResponse;
    console.log('variant_attachment', variantAttachment);
    let durationInDaysList;
    let packageList = [];
    if (onlyEMi) {
        packageList = await Package.getPackageById(db.mysql.read, selectedPackage[0].master_parent);
    } else {
        if (isLiveclass) {
            const durationInDaysListEmi = [];
            durationInDaysList = variantAttachment.package_duration;
            variantAttachment.emi_details.forEach((e) => durationInDaysListEmi.push(e.package_duration));
            const promise = [];
            promise.push(Package.getPackagesByDaysAndCategoryIDAndCourseType(db.mysql.read, durationInDaysList, courseDetails[0].category_id, courseDetails[0].course_type));
            if (durationInDaysListEmi.length) {
                promise.push(Package.getPackagesByDaysAndCategoryIDAndCourseTypeEmi(db.mysql.read, durationInDaysListEmi, courseDetails[0].category_id, courseDetails[0].course_type));
            }
            packageList = await Promise.all(promise);
            if (packageList.length > 1) {
                packageList = [...packageList[0], ...packageList[1]];
            } else {
                packageList = packageList[0];
            }
        } else {
            if (!_.isEmpty(variantAttachment) && typeof variantAttachment.package_duration !== 'undefined') {
                durationInDaysList = variantAttachment.package_duration;
            } else {
                durationInDaysList = config.default_package_duration_list;
            }
            if (durationInDaysList.length > 0) {
                packageList = await Package.getPackagesByDuration3(db.mysql.read, durationInDaysList);
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
        packageList[i].original_amount = parseInt(packageList[i].original_amount);
        packageList[i].duration = packageList[i].name;
        if (packageList[i].type === 'emi') {
            packageList[i].view_type = 'emi';
            packageList[i].title1 = EmiData.emi_options.title1;
            packageList[i].title2 = EmiData.emi_options.title2;
            packageList[i].sub_title1 = EmiData.emi_options.subTitle1;
            packageList[i].sub_title2 = EmiData.emi_options.subTitle2;
            packageList[i].title_color = EmiData.emi_options.titleColor;
            packageList[i].bottom_title = EmiData.emi_options.bottomTitle;
        }
    }
    if (packageList.length > 0) {
        if (showSelection) {
            packageList[0].selected = true;
        }
    }

    packageList = await emiPayment(variantAttachment, packageList, false);

    return packageList;
}

async function checkSelectedPackage(main, checkSelected, selectedPackage, studentPackage, variantAttachment, missDueDate) {
    let emiStartDate;
    console.log(selectedPackage)
    if (selectedPackage[0].type === 'emi') {
        emiStartDate = await Package.getFirstEmiDate(db.mysql.read, selectedPackage[0].master_parent, studentPackage.student_id);
    }
    for (let i = 0; i < main.package_list.length; i++) {
        main.package_list[i].offer_amount = parseInt(main.package_list[i].offer_amount);
        main.package_list[i].original_amount = parseInt(main.package_list[i].original_amount);
        main.package_list[i].duration = PackageContainer.parseDuration(main.package_list[i].duration_in_days);
        main.package_list[i].off = `${parseInt(Math.ceil((1 - (main.package_list[i].offer_amount / main.package_list[i].original_amount)) * 100))}%\noff`;
        main.package_list[i].selected = false;
        if (main.package_list[i].id === selectedPackage[0].id) {
            main.package_list[i].selected = true;
            checkSelected = 1;
        } else if (selectedPackage[0].type === 'emi' && main.package_list[i].id === selectedPackage[0].master_parent) {
            checkSelected = 1;
            const downpaymentList = variantAttachment.emi_details.filter((e) => parseInt(e.package_duration) === main.package_list[i].duration_in_days)[0];
            main.package_list[i].title1 = EmiData.emi_options.middleTitle1;
            main.package_list[i].title2 = `due in ${downpaymentList.duration[selectedPackage[0].emi_order - 1]} days`;
            main.package_list[i].bottom_title = missDueDate ? EmiData.emi_options.middleBottomTitle : '';
            main.package_list[i].downpayment = `₹ ${downpaymentList.downpayment[selectedPackage[0].emi_order]}`;
            if (selectedPackage[0].is_last) {
                main.package_list[i].title1 = EmiData.emi_options.endTitle1;
                main.package_list[i].bottom_title = `All payments cleared. Your plan is valid till ${moment(studentPackage.end_date).format('Do MMMM YYYY')}`;
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
                if (main.package_list[i].emi_options[j].id <= selectedPackage[0].id) {
                    main.package_list[i].emi_options[j].is_completed = true;
                    main.package_list[i].emi_options[j].text = `${main.package_list[i].emi_options[j].text} - PAID`;
                }
            }
        }
    }
    return checkSelected;
}

async function fetchInfoForUserOnSubscription(studentPackage, now, variantAttachment, selectedPackage, missDueDate, isLiveclass, courseDetails) {
    const response = {};
    const main = {};
    main.subscription = true;
    main.description = `Your Doubtnut VIP is Valid till ${moment(studentPackage.end_date).format('Do MMMM YYYY')}`;
    const daysLeft = moment(studentPackage.end_date).diff(now, 'days');
    let onlyEMi = false;

    // const selectedPackage = await Package.getPackageById(db.mysql.read, studentPackage.student_package_id);
    if (selectedPackage[0].original_amount === -1.00) {
        main.title = 'Apna Plan Select karo';
        main.package_list = await fetchDefaultPackages(studentPackage.student_id, true, variantAttachment, onlyEMi, selectedPackage, isLiveclass, courseDetails);
        if (daysLeft) {
            main.description = `Your Free Trial expires in ${PackageContainer.parseDuration(daysLeft)}`;
        } else {
            main.description = `Your Free Trial expires ${PackageContainer.parseDuration(daysLeft)}`;
        }
        main.cta_text = 'BUY NOW (All Courses)';
        main.trial = true;
    } else {
        main.title = 'Apka current plan';
        let checkSelected = 0;
        if (selectedPackage[0].type === 'emi' || missDueDate) { onlyEMi = true; }
        main.package_list = await fetchDefaultPackages(studentPackage.student_id, true, variantAttachment, onlyEMi, selectedPackage, isLiveclass, courseDetails);
        checkSelected = await checkSelectedPackage(main, checkSelected, selectedPackage, studentPackage, variantAttachment, missDueDate);

        if (!checkSelected) {
            main.package_list[0].selected = true;
        }

        main.cta_text = 'UPGRADE PLAN';

        if (daysLeft <= config.subscription_threshold) {
            main.renewal = true;
            main.title = 'Apna Plan Select karo';
            main.cta_text = 'RENEW NOW';
            if (missDueDate) {
                main.description = 'Your VIP plan has expired';
            } else if (daysLeft) {
                main.description = `Your VIP plan expires in ${PackageContainer.parseDuration(daysLeft)}`;
            } else {
                main.description = `Your VIP plan expires ${PackageContainer.parseDuration(daysLeft)}`;
            }
        }
    }
    response.main = main;
    return response;
}

async function fetchSubscriptionDetails(studentId, variantAttachment, paymentCardState, isLiveclass, courseDetails) {
    const response = {};

    const main = {};

    main.subscription = false;
    main.trial = false;
    main.title = 'Apna Plan Select karo';
    main.description = '';
    // main.description = 'Dear student, We are upgrading KOTA CLASSES. Payment options will be available from 12 June, 2020. Keep Learning!';
    main.package_list = await fetchDefaultPackages(studentId, true, variantAttachment, false, [], isLiveclass, courseDetails);

    main.cta_text = 'BUY VIP PASS';

    if (!paymentCardState.expiredTrial && !paymentCardState.expiredVip && !isLiveclass) {
        const topCard = {
            type: 'trial_card',
            action: {
                action_activity: 'start_trial',
                action_data: null,
            },
            title: `For ${variantAttachment.trial_duration} Days get all the course material and teachers' lectures for free`,
            button_text: `START FREE TRIAL (${variantAttachment.trial_duration} DAYS)`,
            data: {
                variant_id: paymentCardState.variantId,
            },
        };
        main.top_card = topCard;
    }

    // main.package_list = await fetchDefaultPackages(studentId, true, flagrResponse);
    response.main = main;
    return response;
}

async function info(req, res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const studentID = req.user.student_id;
    const { type, course_id: courseID } = req.query;
    const isLiveclass = (type !== undefined && type === 'liveclass');
    const xAuthToken = req.headers['x-auth-token'];
    
    const now = moment().add(5, 'hours').add(30, 'minutes');
    try {
    // check if user is on subscription
        let studentPackageList = [];
        let courseDetails = [];
        let paymentCardState = {};
        let userOnSubscription = false;
        let response = {};

        if (isLiveclass) {
            courseDetails = await Liveclass.getBoardDetails(db.mysql.read, courseID);
            // studentPackageList = await Liveclass.checkSubscription(db.mysql.write, studentID, courseID);
            // if (studentPackageList.length > 0) userOnSubscription = true;
            // if (userOnSubscription) {
            //     // student is on subscription
            //     response = await LiveclassHelper.fetchInfoForUserOnSubscription(db, studentPackageList[0], now, flagrResponse, config, courseID);
            // } else {
            //     // student is NOT on a subscription
            //     response = await LiveclassHelper.fetchSubscriptionDetails(db, studentID, flagrResponse, config, courseID);
            // }
        } // else {
        const flagrResponse = await Flagr.evaluateServiceWrapper({
            db,
            xAuthToken,
            entityContext: { studentId: studentID.toString() },
            flagID: (isLiveclass) ? EmiData.categoryIDFlagrMap[courseDetails[0].category_id] : config.package_subscription_emi_flagr_id,
            timeout: 3000,
        });
            studentPackageList = await CourseMysql.checkVipWithExpiry(db.mysql.read, studentID);
            // paymentCardState = await CourseHelperV2.getPaymentCardState({
            //     moment,
            //     data: studentPackageList,
            //     flagrResponse,
            // });
            const studentPackageListV1 = await CourseMysql.getUserSubscription(db.mysql.read, studentID);
            paymentCardState = CourseHelperV4.getPaymentCardStateV2({
                data: studentPackageListV1,
                flagrResponse,
                courseType: courseDetails.length ? courseDetails[0].course_type : 'vod',
                categoryID: courseDetails.length ? courseDetails[0].category_id : 1,
            });
            // if (isLiveclass) {
            //     const studentPackageListV1 = await CourseMysql.getUserSubscription(db.mysql.read, studentID);
            //     paymentCardState = CourseHelperV4.getPaymentCardStateV2({
            //         data: studentPackageListV1,
            //         flagrResponse,
            //         courseType: courseDetails[0].course_type,
            //         categoryID: courseDetails[0].category_id,
            //     });
            // }
            if (paymentCardState.isVip || paymentCardState.isTrial) userOnSubscription = true;
            let packageDetail;
            let missDueDate = false;

            if (studentPackageList.length) {
                packageDetail = await Package.getPackageById(db.mysql.read, studentPackageList[0].student_package_id);
            }

            if (!userOnSubscription && studentPackageList.length) {
                if (packageDetail[0].type === 'emi' && (!packageDetail[0].is_last)) {
                    missDueDate = true;
                }
            }
            // const checkEmiExpiry = await CourseMysql.checkEmiExpiry(db.mysql.read, studentID)
            let { variantAttachment } = flagrResponse;
            if (isLiveclass) {
                variantAttachment = variantAttachment[courseDetails[0].course_type];
            }
            if (userOnSubscription || missDueDate) {
                // student is on subscription
                response = await fetchInfoForUserOnSubscription(studentPackageList[0], now, variantAttachment, packageDetail, missDueDate, isLiveclass, courseDetails);
            } else {
                // student is NOT on a subscription
                response = await fetchSubscriptionDetails(studentID, variantAttachment, paymentCardState, isLiveclass, courseDetails);
            }
        // }

        if (isLiveclass) {
            let subDesc = 'English & Hindi';
            if (courseDetails[0].locale === 'english') {
                subDesc = 'English';
            } else if (courseDetails[0].locale === 'hindi') {
                subDesc = 'Hindi';
            }
            response.main.package_description = {};
            response.main.package_description.title = courseDetails[0].title;
            response.main.package_description.includes = EmiData.getInfoWidgetForPaymentByCategory(courseDetails[0].category_id, courseDetails[0].course_type).get.items;
            response.main.package_description.subjects = 'Maths, Science (Physics, Chemistry & Biology), English';
        }
        response.variant_id = paymentCardState.variantId;
        const responseData = {};
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = 'SUCCESS';

        // responseData.data = response;

        responseData.data = response;
        responseData.data.payment_help = { title: 'FAQs', list: await Properties.getNameAndValueByBucket(db.mysql.read, 'payment_help_vmc') };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    info,
};
