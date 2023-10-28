/* eslint-disable no-await-in-loop */
const moment = require('moment');
const _ = require('lodash');
const axios = require('axios');
const LiveclassHelper = require('../../helpers/liveclass');
const StructuredCourse = require('../../../modules/mysql/eStructuredCourse');
const CourseContainer = require('../../../modules/containers/coursev2');
const StudentContainer = require('../../../modules/containers/student');

const LiveclassData = require('../../../data/liveclass.data');
const Data = require('../../../data/data');
const CourseHelper = require('../../helpers/course');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const TestSeries = require('../../../modules/mysql/testseries');
const NudgeHelper = require('../../helpers/nudge');
const StudentRedis = require('../../../modules/redis/student');
const WidgetHelper = require('../../widgets/liveclass');
const { getFaqLanding } = require('../../v1/scholarship/scholarship.controller');
const AnswerContainer = require('../../v13/answer/answer.container');
const scholarshipHelper = require('../../v1/scholarship/scholarship.helper');
const TgHelper = require('../../helpers/target-group');
const { autoScrollTime } = require('../../../data/data');
const QuestionContainer = require('../../../modules/containers/question');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const NudgeMysql = require('../../../modules/mysql/nudge');
const PaymentMysql = require('../../../modules/mysql/payment');
const ExamCornerHelper = require('../../helpers/examcorner');
const ExamCornerMysql = require('../../../modules/mysql/examCorner');
const Utility = require('../../../modules/utility');
const answerContainer = require('../../../modules/containers/answer');
const redisAnswer = require('../../../modules/redis/answer');
const CourseWidgetHelper = require('../../widgets/course');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const freeLiveClassHelper = require('../../helpers/freeLiveClass');
const { freeClassListingPageFlagrResp } = require('../../helpers/freeChapterListing');

async function getCoursesListByIdsForCLP({
    db, category, studentID, locale, config, versionCode,
}) {
    const assortmentList = category.split('_');
    assortmentList.splice(0, 1);
    const coursesList = await CourseMysqlV2.getAssortmentDetailsFromId(db.mysql.read, assortmentList);
    const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
    const promises = [];
    for (let i = 0; i < coursesList.length; i++) {
        promises.push(CourseHelper.generateAssortmentObject({
            data: coursesList[i],
            config,
            paymentCardState: { isVip: false },
            assortmentPriceMapping,
            db,
            setWidth: null,
            versionCode,
            assortmentFlagrResponse: {},
            locale,
            category: null,
            page: 'CATEGORY_LISTING',
            studentId: studentID,
        }));
    }
    const widgets = await Promise.all(promises);
    return [
        {
            type: 'widget_parent',
            data: {
                title: 'Apke liye Courses',
                link_text: '',
                deeplink: '',
                items: widgets,
                scroll_direction: 'vertical',
            },
        },
    ];
}

async function filterCourseListByDuration(db, items, duration, assortmentList) {
    const packagesList = await CourseMysqlV2.getPackagesOfAssortmentsByDuration(db.mysql.read, assortmentList, duration);
    items = items.filter((item) => _.find(packagesList, ['assortment_id', item.data.assortment_id]));
    return items;
}

async function checkEmiCounter(db, studentID) {
    const emiData = await StudentRedis.getEMiReminderCounter(db.redis.read, studentID);
    if (emiData) {
        return false;
    }
    return true;
}

async function getBannersData(courseDetail, activeSubs, locale, config, vip, studentClass, db) {
    const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
    const banner = {
        type: 'promo_list',
        data: {
            auto_scroll_time_in_sec: autoScrollTime,
            items: [],
            ratio: '5:1',
        },
    };
    banner.data.items = await CourseHelper.getBanners(db, courseDetail[0].assortment_id, banner.data.items, vip);
    if (!vip) {
        banner.data.items.push({
            image_url: courseDetail[0].display_image_rectangle,
            deeplink: '',
        });
    }
    if (activeSubs.length) {
        const lastEmi = activeSubs[activeSubs.length - 1];
        const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
            .endOf('day');
        if (lastEmi.package_validity >= now && lastEmi.package_validity <= end && !lastEmi.is_last) {
            const emiBanner = {
                image_url: LiveclassData.emiReminderImage(locale, config),
                deeplink: `doubtnutapp://vip?assortment_id=${courseDetail[0].assortment_id}`,
            };
            banner.data.items.unshift(emiBanner);
        }
    }

    return banner;
}

async function getSubjectFilters(db, assortmentIds, parentAssortmentID, studentClass) {
    try {
        const subList = await CourseContainer.getSubjectsList(db, parentAssortmentID, assortmentIds, studentClass);
        const subReturn = [];
        subReturn.push({
            filter_id: 'ALL',
            color: LiveclassHelper.getBarColorHomepage('ALL'),
        });
        for (let i = 0; i < subList.length; i++) {
            if (subList[i].subject !== 'ALL') {
                subReturn.push({
                    filter_id: subList[i].subject, color: LiveclassHelper.getBarColorHomepage(subList[i].subject.toUpperCase()),
                });
            }
        }
        return {
            type: 'subject_filters',
            data: {
                items: subReturn,
            },
        };
    } catch (e) {
        throw new Error(e);
    }
}

async function getNotesFilters(notesType, db, arr, subject, studentClass) {
    try {
        const data = await CourseMysqlV2.getNotesFilter(db.mysql.read, arr, subject, studentClass);
        const items = [];
        for (let i = 0; i < data.length; i++) {
            items.push({
                filter_id: data[i].meta_info,
                text: data[i].meta_info,
                is_selected: notesType === data[i].meta_info,
            });
        }

        const obj = {
            type: 'notes_filter',
            data: {
                items,
            },
        };
        return obj;
    } catch (e) {
        throw new Error(e);
    }
}

function getCourseInfo(courseDetail) {
    const obj = {
        type: 'course_info',
        data: {
            title: courseDetail[0].display_name ? courseDetail[0].display_name : '',
            description: courseDetail[0].display_description,
            link: '', // 'What Will I Learn?',
        },
    };
    return obj;
}

function generateSubjectListData({
    carouselsData,
    data,
    config,
    locale,
    assortmentIds,
}) {
    const items = [];
    for (let i = 0; i < assortmentIds.length; i++) {
        const assortmentDetail = data.filter((e) => e.assortment_id == assortmentIds[i]);
        const o = {};
        o.id = assortmentDetail[0].assortment_id;
        o.bg_image = assortmentDetail[0].display_image_square ? assortmentDetail[0].display_image_square : `${config.staticCDN}engagement_framework/351520E8-C934-0393-DAED-D7B979330E13.webp`;
        o.image_url = assortmentDetail[0].display_icon_image ? `${assortmentDetail[0].display_icon_image}` : `${config.staticCDN}engagement_framework/B2F41293-45DE-C4ED-504E-A17DAF467360.webp`;
        o.title = locale === 'hi' ? `${Data.subjectHindi[assortmentDetail[0].display_name.toUpperCase()]}` : `${assortmentDetail[0].display_name}`;
        if (carouselsData.view_type === 'drill') {
            o.deeplink = `doubtnutapp://resource_list?id=${assortmentDetail[0].category}&subject=${assortmentDetail[0].display_name}`;
        } else {
            o.deeplink = `doubtnutapp://course_details?id=${assortmentDetail[0].assortment_id}`;
        }
        items.push(o);
    }
    const obj = {
        type: carouselsData.carousel_type,
        data: {
            title: carouselsData.title,
            items,
            link_text: '',
        },
    };
    return obj;
}

async function generateTestData(data, db, paymentCardState, studentID, assortmentPriceMapping) {
    const o = {};
    const mockTestDetails = await StructuredCourse.getMockTestDetails(data.resource_reference, studentID, db.mysql.read);
    o.id = data.resource_reference;
    o.assortment_id = data.assortment_id;
    o.resource_type = 'test';
    o.pdf_url = data.resource_reference;
    o.title = `${mockTestDetails[0] ? mockTestDetails[0].no_of_questions : 1} Questions`;
    o.title2 = mockTestDetails[0] ? parseInt(mockTestDetails[0].duration_in_min) * 60 : 0;
    o.is_premium = !data.is_free;
    o.is_vip = paymentCardState.isVip;
    o.lock_state = 0;
    if (!data.is_free) {
        o.lock_state = paymentCardState.isVip ? 2 : 1;
        if (!paymentCardState.isVip) {
            const basePrice = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].base_price : 0;
            const displayPrice = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].display_price : 0;
            o.amount_to_pay = displayPrice > 0 ? `₹${displayPrice}` : '';
            o.amount_strike_through = basePrice > 0 && (basePrice !== displayPrice) ? `₹${basePrice}` : '';
            o.buy_text = 'BUY NOW';
            o.discount = basePrice - displayPrice > 0 ? `(${Math.round(((basePrice - displayPrice) / basePrice) * 100)}% OFF)` : '';
            o.display_price = displayPrice;
        }
    }
    o.icon_url = '';
    o.resource_text = 'TEST';
    o.buy_text = 'BUY';
    o.button_state = 'payment';
    o.payment_deeplink = `doubtnutapp://vip?assortment_id=${data.assortment_id}`;
    const obj = {
        type: 'widget_course_resource',
        data: o,
    };
    return obj;
}

function generatePdfData(data, paymentCardState, assortmentPriceMapping, setWidth) {
    const o = {};
    o.pdf_url = data.resource_reference;
    o.assortment_id = data.assortment_id;
    o.resource_type = 'pdf';
    o.title = `${data.display}`;
    o.title2 = `By ${data.mapped_faculty_name}, ${data.degree ? data.degree : ''}`;
    o.is_premium = !data.is_free;
    o.lock_state = 0;
    o.show_emi_dialog = paymentCardState.emiDialog;
    o.is_vip = paymentCardState.isVip;
    o.icon_url = '';
    o.set_width = setWidth != null;
    o.resource_text = 'PDF';
    if (!data.is_free) {
        o.lock_state = paymentCardState.isVip ? 2 : 1;
        if (!paymentCardState.isVip) {
            const basePrice = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].base_price : 0;
            const displayPrice = assortmentPriceMapping && assortmentPriceMapping[data.assortment_id] ? assortmentPriceMapping[data.assortment_id].display_price : 0;
            o.amount_to_pay = displayPrice > 0 ? `₹${displayPrice}` : '';
            o.amount_strike_through = basePrice > 0 && (basePrice !== displayPrice) ? `₹${basePrice}` : '';
            o.buy_text = 'BUY NOW';
            o.discount = basePrice - displayPrice > 0 ? `(${Math.round(((basePrice - displayPrice) / basePrice) * 100)}% OFF)` : '';
            o.display_price = displayPrice;
        }
    } else {
        // o.buy_text = 'DOWNLOAD';
    }
    o.button_state = 'payment';
    o.payment_deeplink = `doubtnutapp://vip?assortment_id=${data.assortment_id}`;
    const obj = {
        type: 'widget_course_resource',
        data: o,
    };
    return obj;
}

async function generateViewByResourceType(data) {
    const {
        db,
        caraouselData,
        config,
        result,
        versionCode,
        assortmentFlagrResponse,
        studentID,
        setWidth,
        assortmentPriceMapping,
        studentPackageAssortments,
        studentEmiPackageAssortments,
        locale,
        category,
        studentPackageList,
    } = data;
    const promises = [];
    // * User assortment mapping to payment state
    const userAssortmentPaymentState = studentPackageList ? studentPackageList.reduce((acc, item) => ({
        ...acc,
        [item.assortment_id]: {
            isTrial: item.amount === -1,
            isVip: item.amount !== -1,
            timeLeft: moment(item.end_date).diff(new Date(), 'hours'),
        },
    }), {}) : {};
    for (let i = 0; i < result.length; i++) {
        const paymentCardState = {
            isVip: studentPackageAssortments.indexOf(result[i].assortment_id) >= 0,
            emiDialog: studentEmiPackageAssortments.indexOf(result[i].assortment_id) >= 0,
            isTrial: studentPackageAssortments.indexOf(result[i].assortment_id) >= 0 && userAssortmentPaymentState[result[i].assortment_id] && userAssortmentPaymentState[result[i].assortment_id].isTrial,
            timeLeft: studentPackageAssortments.indexOf(result[i].assortment_id) >= 0 && userAssortmentPaymentState[result[i].assortment_id] && userAssortmentPaymentState[result[i].assortment_id].timeLeft,
        };
        if (result[i].resource_type === 2 || result[i].resource_type === 3 || result[i].assortment_type === 'resource_pdf') {
            promises.push(generatePdfData(result[i], paymentCardState, assortmentPriceMapping, setWidth));
        } else if (result[i].resource_type === 1 || result[i].resource_type === 4 || result[i].resource_type === 8 || result[i].assortment_type === 'resource_video') {
            promises.push(CourseHelper.generateResourceVideoViewData({
                result: result[i],
                db,
                config,
                setWidth,
                flagrResponse: {},
                paymentCardState,
                assortmentPriceMapping,
                masterAssortment: caraouselData.view_type != 'related' && caraouselData.view_type != 'playlist' ? caraouselData.assortment_list : `${result[i].masterAssortment}`,
                versionCode,
            }));
        } else if (result[i].resource_type === 9 || result[i].assortment_type === 'resource_test' || result[i].assortment_type === 'resource_quiz') {
            promises.push(generateTestData(result[i], db, paymentCardState, studentID, assortmentPriceMapping));
        } else if (result[i].assortment_type === 'course' || result[i].assortment_type === 'class') {
            promises.push(CourseHelper.generateAssortmentObject({
                data: result[i],
                config,
                paymentCardState,
                assortmentPriceMapping,
                db,
                setWidth,
                versionCode,
                assortmentFlagrResponse,
                locale,
                category,
                page: 'CATEGORY_PAGE',
                studentId: studentID,
            }));
        } else {
            promises.push(CourseHelper.generateAssortmentObject({
                data: result[i],
                config,
                paymentCardState,
                assortmentPriceMapping,
                db,
                setWidth,
                versionCode: 852,
                assortmentFlagrResponse,
                locale,
                category,
                page: 'CATEGORY_PAGE',
                studentId: studentID,
            }));
        }
    }
    let items = await Promise.all(promises);
    items = items.filter((e) => e !== 0);
    const obj = {
        type: caraouselData.carousel_type,
        data: {
            title: caraouselData.title,
            link_text: caraouselData.show_see_more ? 'See more' : '',
            deeplink: caraouselData.show_see_more ? `doubtnutapp://resource_list?id=${caraouselData.id}` : '',
            items,
        },
    };
    return obj;
}

async function generateMultiResourceCarousel(data) {
    const {
        db,
        caraouselData,
        config,
        result,
        locale,
        versionCode,
        assortmentIds,
        studentPackageList,
        studentID,
        assortmentPriceMapping,
        assortmentFlagrResponse,
        studentPackageAssortments,
        studentEmiPackageAssortments,
        category,
    } = data;
    const sortedData = [];
    for (let i = 0; i < assortmentIds.length; i++) {
        const o = result.filter((e) => e.assortment_id == assortmentIds[i])[0];
        if (o) {
            sortedData.push(o);
        }
    }
    const obj = await generateViewByResourceType({
        result: sortedData,
        db,
        config,
        locale,
        setWidth: true,
        studentPackageList,
        studentID,
        versionCode,
        caraouselData,
        studentPackageAssortments,
        assortmentFlagrResponse,
        studentEmiPackageAssortments,
        assortmentPriceMapping,
        category,
    });
    return obj;
}

async function includeChapterAssortment(db, result) {
    const promises = [];
    for (let i = 0; i < result.length; i++) {
        promises.push(CourseContainer.getChapterAssortment(db, result[i].assortment_id));
    }
    const data = await Promise.all(promises);
    if (data.length) {
        for (let i = 0; i < result.length; i++) {
            result[i].masterAssortment = [data[i][0].assortment_id];
        }
    }
    return result;
}

async function generateRelatedViewingData(data) {
    const {
        db,
        caraouselData,
        config,
        studentID,
        studentClass,
        studentPackageList,
        assortmentPriceMapping,
        studentPackageAssortments,
        studentEmiPackageAssortments,
        category,
    } = data;
    let { result } = data;
    const response = await axios({
        method: 'POST',
        url: `${config.PASCAL_URL}api/events/video-views/info`,
        body: {
            sort: 'eventTime',
            eventAction: 'video_view',
            userId: studentID,
        },
    });
    if (response.data.length) {
        const distictChapters = _.uniqBy(response.data, 'chapter');
        let resources = [];
        if (distictChapters.length && distictChapters[0].chapter && distictChapters[0].subTopic) {
            let queryStr = `(select * from (select id,topic,chapter,expert_name as mapped_faculty_name, expert_image as image_bg_liveclass,player_type,subject, stream_status as is_active,resource_type, display, resource_reference, meta_info from course_resources where topic like '%${LiveclassHelper.quotesEscape(distictChapters[0].subTopic.trim())}%' OR chapter like '%${LiveclassHelper.quotesEscape(distictChapters[0].chapter.trim())}%' and resource_type in (1,8) limit 1) as a inner join (select live_at, assortment_id,course_resource_id from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id inner join (select assortment_id,is_free from course_details where class=${studentClass}) as c on c.assortment_id=b.assortment_id)`;
            for (let i = 1; i < distictChapters.length; i++) {
                if (distictChapters[i].chapter && distictChapters[i].subTopic) {
                    queryStr += ` union (select * from (select id,topic,chapter,expert_name as mapped_faculty_name, expert_image as image_bg_liveclass,player_type,subject, stream_status as is_active,resource_type, display, resource_reference, meta_info from course_resources where topic like '%${LiveclassHelper.quotesEscape(distictChapters[i].subTopic.trim())}%' OR chapter like '%${LiveclassHelper.quotesEscape(distictChapters[i].chapter.trim())}%' and resource_type in (1,8) limit 1) as a inner join (select live_at, assortment_id,course_resource_id from course_resource_mapping where resource_type='resource') as b on a.id=b.course_resource_id inner join (select assortment_id,is_free from course_details where class=${studentClass}) as c on c.assortment_id=b.assortment_id)`;
                }
            }
            resources = await db.mysql.read.query(queryStr);
        }

        if (resources.length > 0) {
            if (resources.length < 10) {
                result = [...resources, ...result];
            } else {
                result = resources;
            }
        }

        result = await includeChapterAssortment(db, result);
    }
    const obj = await generateViewByResourceType({
        result,
        db,
        config,
        setWidth: true,
        studentPackageList,
        studentID,
        caraouselData,
        studentPackageAssortments,
        studentEmiPackageAssortments,
        assortmentPriceMapping,
        category,
    });
    return obj;
}

async function getRecommendedCourses(db, config, locale, studentId, isDropper, studentClass) {
    const result = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentId);
    const courses = result.reduce((acc, obj) => acc.concat(obj.course), []);
    const ccmIds = result.reduce((acc, obj) => acc.concat(obj.id), []);

    const class10CCMIds = [1002, 1003];
    const higherClasses = [11, 12, 13];
    if (+studentClass === 12 && isDropper) studentClass = 13;
    const assortmentPrefernces = {
        11: {
            hi: {
                iit: {
                    assortmentId: 85743,
                    id: 85743,
                    imageUrl: `${config.staticCDN}engagement_framework/1803A01B-8D31-6C8D-1172-A0448CF12D4A.webp`,
                },
                neet: {
                    assortmentId: 85744,
                    id: 85744,
                    imageUrl: `${config.staticCDN}engagement_framework/2478AC26-D35C-10CF-677D-27824B43302B.webp`,
                },
                board: {
                    assortmentId: 28,
                    id: 28,
                    imageUrl: `${config.staticCDN}engagement_framework/96D738E7-0FBB-3051-C24F-EEE0341C1369.webp`,
                },
            },
            non_hi: {
                iit: {
                    assortmentId: 78895,
                    id: 78895,
                    imageUrl: `${config.staticCDN}engagement_framework/1803A01B-8D31-6C8D-1172-A0448CF12D4A.webp`,
                },
                neet: {
                    assortmentId: 87685,
                    id: 87685,
                    imageUrl: `${config.staticCDN}engagement_framework/2478AC26-D35C-10CF-677D-27824B43302B.webp`,
                },
            },
        },
        12: {
            hi: {
                iit: {
                    assortmentId: 91155,
                    id: 91155,
                    imageUrl: `${config.staticCDN}engagement_framework/C610A908-50FB-1805-1008-EEB996A4A62E.webp`,
                },
                neet: {
                    assortmentId: 85745,
                    id: 85745,
                    imageUrl: `${config.staticCDN}engagement_framework/B4CFC2CF-DDB9-24AE-DB9E-A6BB93875C0B.webp`,
                },
                board: {
                    assortmentId: 22,
                    id: 22,
                    imageUrl: `${config.staticCDN}engagement_framework/96D738E7-0FBB-3051-C24F-EEE0341C1369.webp`,
                },
            },
            non_hi: {
                iit: {
                    assortmentId: 58145,
                    id: 58145,
                    imageUrl: `${config.staticCDN}engagement_framework/C610A908-50FB-1805-1008-EEB996A4A62E.webp`,
                },
                neet: {
                    assortmentId: 87686,
                    id: 87686,
                    imageUrl: `${config.staticCDN}engagement_framework/B4CFC2CF-DDB9-24AE-DB9E-A6BB93875C0B.webp`,
                },
                board: {
                    assortmentId: 58144,
                    id: 58144,
                    imageUrl: `${config.staticCDN}engagement_framework/96D738E7-0FBB-3051-C24F-EEE0341C1369.webp`,
                },
            },
        },
        13: {
            hi: {
                iit: {
                    assortmentId: 91155,
                    id: 91155,
                    imageUrl: `${config.staticCDN}engagement_framework/C610A908-50FB-1805-1008-EEB996A4A62E.webp`,
                },
                neet: {
                    assortmentId: 85745,
                    id: 85745,
                    imageUrl: `${config.staticCDN}engagement_framework/B4CFC2CF-DDB9-24AE-DB9E-A6BB93875C0B.webp`,
                },
            },
            non_hi: {
                iit: {
                    assortmentId: 58145,
                    id: 58145,
                    imageUrl: `${config.staticCDN}engagement_framework/C610A908-50FB-1805-1008-EEB996A4A62E.webp`,
                },
                neet: {
                    assortmentId: 87686,
                    id: 87686,
                    imageUrl: `${config.staticCDN}engagement_framework/B4CFC2CF-DDB9-24AE-DB9E-A6BB93875C0B.webp`,
                },
            },
        },
    };
    const items = [];

    if (studentClass === '10') {
        const flag = ccmIds.some((item) => class10CCMIds.includes(item));
        if (flag) {
            const o = {
                id: 20,
                image_url: `${config.staticCDN}engagement_framework/96D738E7-0FBB-3051-C24F-EEE0341C1369.webp`,
                deeplink: `doubtnutapp://course_details?id=${20}&`, // `doubtnutapp://${result[i].deeplink}`,
            };
            items.push(o);
        } else {
            const o = {
                id: 17928,
                image_url: `${config.staticCDN}engagement_framework/96D738E7-0FBB-3051-C24F-EEE0341C1369.webp`,
                deeplink: `doubtnutapp://course_details?id=${17928}&`, // `doubtnutapp://${result[i].deeplink}`,
            };
            items.push(o);
        }
    } else if (higherClasses.includes(+studentClass)) {
        const priority = {
            'IIT JEE': 1,
            NEET: 2,
            BOARD: 3,
        };

        courses.sort((courseA, courseB) => {
            const priorityValueA = courseA in priority ? priority[courseA] : 4;
            const priorityValueB = courseB in priority ? priority[courseB] : 4;
            if (priorityValueA < priorityValueB) {
                return -1;
                // eslint-disable-next-line no-else-return
            } else if (priorityValueA > priorityValueB) {
                return 1;
            }
            return 0;
        });

        // eslint-disable-next-line array-callback-return
        courses.map((course) => {
            const lang = locale === 'hi' ? locale : 'non_hi';
            course = ['IIT JEE', 'NEET', 'NDA'].includes(course) ? course : 'board';
            if (course === 'IIT JEE') course = 'iit';
            if (course.toUpperCase() === 'NDA') return;
            const obj = assortmentPrefernces[studentClass][lang][course.toLowerCase()];
            const { assortmentId, id, imageUrl } = obj || {};
            if (!assortmentId && !id && !imageUrl) return;
            const o = {
                id,
                image_url: imageUrl,
                deeplink: `doubtnutapp://course_details?id=${assortmentId}&`,
            };
            items.push(o);
        });

        const filterItems = items.reduce((acc, obj) => {
            const key = acc.find((item) => item.id === obj.id);
            if (!key) {
                return acc.concat([obj]);
            }
            return acc;
        }, []);
        return filterItems;
    }

    return items;
}

function generateEmiBannerData(data) {
    const {
        carouselsData,
        result,
        emiPackageList,
    } = data;
    const items = [];
    const o = {
        id: result[0].id,
        image_url: result[0].image_url,
        deeplink: `doubtnutapp://${result[0].action_activity}?assortment_id=${emiPackageList[0].assortment_id}`, // `doubtnutapp://${result[i].deeplink}`,
    };
    items.push(o);

    const obj = {
        type: carouselsData.carousel_type,
        data: {
            items,
            ratio: carouselsData.resource_types,
        },
    };
    if (obj.type === 'promo_list') {
        obj.data.auto_scroll_time_in_sec = autoScrollTime;
    }
    return obj;
}

async function generateMyCoursesCarousel({
    db,
    studentId,
    studentClass,
    versionCode,
    setWidth,
    config,
    studentCourseOrClassSubcriptionDetails,
    coursePage,
    result,
    studentLocale,
    xAuthToken,
    caraouselData,
}) {
    const widget = await CourseHelper.getUserCoursesCarousel({
        db,
        studentId,
        studentClass,
        studentCourseOrClassSubcriptionDetails,
        versionCode,
        setWidth,
        config,
        studentLocale,
        coursePage,
        assortmentDetails: result,
        xAuthToken,
        caraouselData,
    });
    const obj = {
        type: 'widget_my_courses',
        data: {
            title: studentLocale === 'hi' ? 'मेरे कोर्स' : 'My Courses',
            items: widget.filter(Boolean),
            background_color: '#fafafa',
        },
        extra_params: {
            be_source: coursePage,
            widget_type: 'widget_my_courses',
        },
        layout_config: {
            margin_top: 0,
            margin_bottom: 0,
        },
    };
    return obj;
}

async function getLibraryVideoCarousel({
    carouselsData,
    result,
    config,
    db,
    studentID,
    studentClass,
}) {
    let libraryData = await QuestionContainer.getLibraryVideos(carouselsData.view_type, config.staticCDN, '', carouselsData.data_type, '', 'EXPLORE_PAGE', '', studentClass, studentID, carouselsData.assortment_list, 'english', carouselsData.data_limit, '', db);
    libraryData = libraryData.map((libraryItem) => {
        libraryItem.image_url = buildStaticCdnUrl(libraryItem.image_url);
        return libraryItem;
    });
    const carousel = {};
    if (libraryData && libraryData.length > 0) {
        carousel.items = libraryData.map((elem) => {
            const mappedObject = {
                title: elem.question,
                subtitle: '',
                show_whatsapp: true,
                show_video: true,
                image_url: elem.image_url,
                card_width: carouselsData.scroll_size || '1.5x', // percentage of screen width
                deeplink: encodeURI(`doubtnutapp://video?qid=${elem.question_id}&page=TEACHER_INTRO&playlist_id=${carouselsData.view_type}`),
                aspect_ratio: '',
                id: elem.question_id,
            };
            return mappedObject;
        });
        // carousel.widget_type = 'horizontal_list';
        carousel.show_view_all = 1;
        carousel.title = carouselsData.title;
        carousel.deeplink = encodeURI(`doubtnutapp://playlist?playlist_id=${carouselsData.assortment_list}&playlist_title=${carousel.title}&is_last=1`);
        return {
            ...result,
            widget_data: carousel,
        };
    }
}

function getTopIconsForExplorePage(carouselsData, config, locale) {
    let coursePostion = 0;
    let examPostion = 0;
    let subjectPostion = 0;
    let testPostion = 0;
    for (let i = 0; i < carouselsData.length; i++) {
        if (carouselsData[i].carousel_type === 'widget_parent_tab2' && carouselsData[i].view_type === 'exams') {
            examPostion = i;
        } else if (carouselsData[i].carousel_type === 'widget_parent_tab2' && carouselsData[i].view_type === 'course_subject') {
            coursePostion = i;
        } else if (carouselsData[i].carousel_type === 'widget_top_selling_subject') {
            subjectPostion = i;
        } else if (carouselsData[i].carousel_type === 'widget_test_series') {
            testPostion = i;
        }
    }
    const items = [];
    if (coursePostion) {
        items.push({
            id: '',
            title: locale === 'hi' ? 'बोर्ड के लिए कोर्स' : 'Courses for Boards',
            image_url: `${config.cdn_url}engagement_framework/11CFD3BA-E202-D9A5-453B-F4C1AF70088C.webp`,
            position: coursePostion,
        });
    }
    if (examPostion) {
        items.push({
            id: '',
            title: locale === 'hi' ? 'परीक्षा के लिए कोर्स' : 'Courses for Exams',
            image_url: `${config.cdn_url}engagement_framework/5F568922-4579-98E4-4984-C7075A800DD7.webp`,
            position: examPostion,
        });
    }
    if (subjectPostion) {
        items.push({
            id: '',
            title: locale === 'hi' ? 'विषय कोर्स' : 'Subject Courses',
            image_url: `${config.cdn_url}engagement_framework/FED9373E-CE2D-51EB-9B62-DA857F1D3236.webp`,
            position: subjectPostion,
        });
    }
    if (testPostion) {
        items.push({
            id: 'test',
            title: locale === 'hi' ? 'टेस्ट सीरीज' : 'Test Series',
            image_url: `${config.cdn_url}engagement_framework/DD02D29B-F79B-69FA-F75F-5132DB769347.webp`,
            position: testPostion,
        });
    }
    return items;
}

function getCategoryIconsForExplorePage({
    allCategories,
    studentClass,
    versionCode,
    studentPackageList,
    studentCategoryData,
}) {
    const items = [];
    const studentCategory = studentCategoryData.length ? studentCategoryData[0].category : '';
    const requiredCategories = [];
    for (let i = 0; i < allCategories.length; i++) {
        if (_.includes(['IIT JEE', 'NEET'], allCategories[i].id)) {
            requiredCategories.unshift(allCategories[i]);
        } else if (_.includes([studentCategory, 'CBSE Boards'], allCategories[i].id)) {
            requiredCategories.push(allCategories[i]);
        }
    }
    allCategories = requiredCategories;
    if (_.find(studentPackageList, ['assortment_id', 138829])) {
        allCategories.push({
            id: 'Kota Classes',
        });
    }
    for (let i = 0; i < allCategories.length; i++) {
        const obj = {
            title: allCategories[i].id,
            image_url: versionCode > 934 ? LiveclassData.getcategoryIcons(allCategories[i].id, versionCode) : allCategories[i].image_url || LiveclassData.getcategoryIcons(allCategories[i].id, versionCode),
            id: allCategories[i].id,
            deeplink: `doubtnutapp://course_category?category_id=${allCategories[i].id === 'NDA' ? 'DEFENCE/NDA/NAVY_CT' : allCategories[i].id}`,
        };
        if (allCategories[i].id === 'Kota Classes' && !_.includes([6, 7, 8], +studentClass) && allCategories[i].id !== 'State Boards') {
            items.push(obj);
        } else if (!(_.includes([6, 7, 8], +studentClass) && allCategories[i].id === 'Kota Classes') && allCategories[i].id !== 'State Boards') {
            items.push(obj);
        }
    }
    items.push({
        title: 'Other Boards',
        image_url: LiveclassData.getcategoryIcons('Other Boards', versionCode),
        id: 'others',
        deeplink: 'doubtnutapp://course_category?category_id=others',
    });
    return items;
}

async function getExamCornerWidgetForExplorePage({
    db, carousel, result, studentID, locale,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        result[i].exam_corner_id = result[i].id;
        items.push(WidgetHelper.createExamCornerDefaultWidget({
            widget: result[i], isBookmarked: await ExamCornerHelper.isBookmarkedFunc(db, studentID, result[i].id), locale,
        }));
    }
    return {
        type: 'widget_parent',
        data: {
            title: carousel.title,
            show_indicator: true,
            items,
        },
    };
}

async function getLatestSoldCourseWidget({
    db,
    config,
    locale,
    carousel,
    result,
    versionCode,
    assortmentPriceMapping,
}) {
    const demoVideoQids = [];
    result.map((item) => demoVideoQids.push(item.demo_video_qid));
    const promise = [];
    for (let i = 0; i < result.length; i++) {
        if (demoVideoQids[i]) {
            const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, demoVideoQids[i]);
            if (answerData.length) {
                promise.push(AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideoQids[i], ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true));
            } else {
                promise.push([]);
            }
        } else {
            promise.push([]);
        }
    }
    const videoResources = await Promise.all(promise);
    return WidgetHelper.getLatestSoldCourseWidget({
        config,
        locale,
        carousel,
        result,
        videoResources,
        assortmentPriceMapping,
    });
}

async function getCourseWidgetWithWalletAmount({
    db, result, config, carousel, studentID,
}) {
    const walletData = await PaymentMysql.getWalletBalance(db.mysql.read, studentID);
    if (walletData.length && (walletData[0].cash_amount + walletData[0].reward_amount)) {
        const assortmentList = [];
        result.map((item) => assortmentList.push(item.assortment_id));
        const assormentBatchMapping = await CourseHelper.getBatchByAssortmentListAndStudentId(db, studentID, assortmentList);
        const applicableCoursesList = result.filter((item) => item.batch_id === assormentBatchMapping[item.assortment_id.toString()]);
        if (applicableCoursesList.length) {
            return WidgetHelper.getCoursesWithWalletWidget({
                carousel,
                config,
                walletData,
                result: applicableCoursesList,
            });
        }
        return {};
    }
    return {};
}

async function getTrendingCourseWidget({
    db,
    result,
    carousel,
    locale,
    config,
    studentID,
    versionCode,
    assortmentPriceMapping,
    buyWithUpiFlag,
}) {
    const items = [];
    const assortmentList = [];
    result.map((item) => assortmentList.push(item.assortment_id));
    for (let i = 0; i < result.length; i++) {
        const priceObj = assortmentPriceMapping[result[i].assortment_id] || {};
        priceObj.deeplink = `doubtnutapp://course_details_bottom_sheet?ids=${assortmentList.join(',')}&position=${i}`;
        priceObj.base_price = priceObj.base_price ? Math.floor(priceObj.base_price / Math.floor(priceObj.duration / 30)) : 0;
        priceObj.buy_deeplink = assortmentPriceMapping[result[i].assortment_id] && !assortmentPriceMapping[result[i].assortment_id].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`;
        if (assortmentPriceMapping[result[i].assortment_id] && buyWithUpiFlag) {
            priceObj.buy_deeplink = `doubtnutapp://payment_upi_select?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}&upi_package=com`;
        }
        items.push(CourseHelper.getNewCourseThumbnailv2({
            data: result[i],
            config,
            paymentCardState: { isVip: false },
            o: priceObj,
            db,
            setWidth: true,
            versionCode,
            locale,
            category: null,
            page: 'EXPLORE_TRENDING',
            studentId: studentID,
        }));
    }
    return {
        type: 'widget_popular_course',
        data: {
            title: carousel.title,
            link_text: '',
            deeplink: '',
            flagr_id: 1,
            variant_id: 1,
            more_text: locale === 'hi' ? 'सभी देखें' : 'See all',
            more_deeplink: `doubtnutapp://course_category?category_id=${carousel.see_all_category}`,
            background_color: '#ffffff',
            auto_scroll_time_in_sec: Data.popular_courses_carousel.auto_scroll_time_in_sec,
            items,
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
    };
}

async function getRecommendedAssortments({
    // eslint-disable-next-line no-unused-vars
    db, studentCcmData, studentPackageList, studentClass, locale, studentID, pznElasticSearchInstance,
}) {
    let courseList = [];
    let subjectList = [];
    const pdfList = [];
    const boardCategory = studentCcmData.length ? studentCcmData[0].category : 'CBSE Boards';
    const examCategory = studentCcmData.length > 2 ? studentCcmData[1].category : 'IIT JEE';
    if (+studentClass < 11 && _.find(studentPackageList, ['category_type', 'BOARDS/SCHOOL/TUITION'])) {
        return [];
    }
    if (_.includes([11, 12], +studentClass) && _.find(studentPackageList, ['category_type', 'BOARDS/SCHOOL/TUITION']) && (_.find(studentPackageList, ['category_type', 'IIT JEE']) || _.find(studentPackageList, ['category_type', 'NEET']))) {
        return [];
    }
    // const recentAskedQuestion = await pznElasticSearchInstance.getLatestWatchedVideoDetails(studentID);
    if (+studentClass < 11 || (_.includes([11, 12], +studentClass) && (_.find(studentPackageList, ['category_type', 'IIT JEE']) || _.find(studentPackageList, ['category_type', 'NEET'])))) {
        // if user has exam category course but no boards category course, show only boards courses
        courseList = await CourseMysqlV2.getCoursesList(db.mysql.read, [boardCategory], studentClass);
        subjectList = await CourseMysqlV2.getSubjectFromCategoryTypeForExplore(db.mysql.read, boardCategory, studentClass, locale);
        courseList = courseList.filter((item) => item.is_free === 0 && item.meta_info === (locale === 'hi' ? 'HINDI' : 'ENGLISH') && !item.sub_assortment_type);
    } else if (_.find(studentPackageList, ['category_type', 'BOARDS/SCHOOL/TUITION'])) {
        // if user has boards category courses but no exam category course, show only itt neet courses
        courseList = await CourseMysqlV2.getCoursesList(db.mysql.read, [examCategory], studentClass);
        subjectList = await CourseMysqlV2.getSubjectFromCategoryTypeForExplore(db.mysql.read, examCategory, studentClass, locale);
        courseList = courseList.filter((item) => item.is_free === 0 && item.meta_info === (locale === 'hi' ? 'HINDI' : 'ENGLISH') && !item.sub_assortment_type);
    } else if (_.includes([11, 12], +studentClass)) {
        // if user is non-vip user, show all courses
        let examCourses = examCategory !== 'For All' ? await CourseMysqlV2.getCoursesList(db.mysql.read, [examCategory], studentClass) : [];
        let boardCourses = await CourseMysqlV2.getCoursesList(db.mysql.read, [boardCategory], studentClass);
        const localeFilteredBoardCourses = boardCourses.filter((item) => item.is_free === 0 && item.meta_info === (locale === 'hi' ? 'HINDI' : 'ENGLISH') && !item.sub_assortment_type);
        boardCourses = localeFilteredBoardCourses.length ? localeFilteredBoardCourses : boardCourses;
        examCourses = examCourses.filter((item) => item.is_free === 0 && item.meta_info === (locale === 'hi' ? 'HINDI' : 'ENGLISH') && !item.sub_assortment_type);
        if (examCourses.length) {
            courseList.push(examCourses[0]);
        }
        if (boardCourses.length) {
            courseList.push(boardCourses[0]);
        }
        subjectList = await CourseMysqlV2.getSubjectFromCategoryTypeForExplore(db.mysql.read, boardCategory, studentClass, locale);
    }
    courseList = _.orderBy(courseList, 'year_exam', 'desc');
    courseList = courseList.slice(0, 2);
    // console.log(courseList)
    // if (recentAskedQuestion.hits.hits.length) {
    //     const { subject, topic } = recentAskedQuestion.hits.hits[0]._source;
    //     const userWatchedSubject = subjectList.filter((item) => item.display_name === subject);
    //     if (userWatchedSubject.length) {
    //         subjectList = userWatchedSubject;
    //         pdfList = await CourseMysqlV2.getPdfsByChapterName(db.mysql.read, topic);
    //     }
    // }
    subjectList = subjectList.filter((item) => item.demo_video_thumbnail);
    subjectList = courseList.length > 1 ? subjectList.slice(0, 2) : subjectList.slice(0, 3);
    return [...courseList, ...subjectList, ...pdfList];
}

async function getDataByCarouselTypes({
    db,
    studentClass,
    allCategories,
    config,
    versionCode,
    studentID,
    xAuthToken,
    locale,
    carouselsData,
    assortmentIds,
    category,
    studentCcmData,
    studentCategoryData,
    studentPackageList,
    batchCheckAssortments,
    pznElasticSearchInstance,
}) {
    // this funnction populate data based on data_type of carousels
    const batchAssortmentMapping = await CourseHelper.getBatchByAssortmentListAndStudentId(db, studentID, batchCheckAssortments);
    const promise = [];
    const userCourseAssortments = [];
    studentPackageList.map((item) => userCourseAssortments.push(item.assortment_id));
    for (let i = 0; i < carouselsData.length; i++) {
        if (carouselsData[i].data_type === 'assortment' && carouselsData[i].ccm_id === 1 && carouselsData[i].view_type === 'subject') {
            if (+carouselsData[i].is_vip === 0) {
                promise.push(CourseMysqlV2.getFreeSubjectsForExplore(db.mysql.read, studentClass, locale, carouselsData[i].subject_filter));
            } else if (studentCcmData.length) {
                carouselsData[i].title = locale === 'hi' ? `${studentCcmData[0].category} के लिए लोकप्रिय विषय` : `Top Selling Subjects for ${studentCcmData[0].category}`;
                promise.push(CourseMysqlV2.getSubjectFromCategoryTypeForExplore(db.mysql.read, studentCcmData[0].category, studentClass, locale));
            } else if (_.includes([6, 7, 8], +studentClass)) {
                carouselsData[i].title = locale === 'hi' ? 'CBSE Boards के लिए लोकप्रिय विषय' : 'Top Selling Subjects for CBSE Boards';
                promise.push(CourseMysqlV2.getSubjectFromCategoryTypeForExplore(db.mysql.read, 'CBSE Boards', studentClass, locale));
            } else {
                promise.push([]);
            }
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].ccm_id === 1 && carouselsData[i].carousel_type === 'widget_course_v3') {
            promise.push(CourseHelper.getDataForPopularCourseCarousel({
                db,
                studentClass,
                config,
                versionCode,
                studentId: studentID,
                studentLocale: locale,
                xAuthToken,
                page: 'EXPLORE_PAGE',
                userCourseAssortments,
                pznElasticSearchInstance,
            }));
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].ccm_id === 1) {
            promise.push(CourseHelper.getPaidAssortmentsData({
                db,
                studentClass,
                config,
                versionCode,
                studentId: studentID,
                studentLocale: locale,
                xAuthToken,
                page: 'EXPLORE_PAGE',
                pznElasticSearchInstance,
            }));
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'my_courses') {
            if (versionCode <= 892) {
                promise.push(CourseMysqlV2.getAssortmentDetailsWithOnlyId(db.mysql.read, assortmentIds[i], studentID));
            } else {
                promise.push(CourseMysqlV2.getAssortmentDetailsFromIdForMyCoursesCarousel(db.mysql.read, assortmentIds[i]));
            }
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type.includes('trending')) {
            assortmentIds[i] = assortmentIds[i].filter((e) => userCourseAssortments.indexOf(+e) < 0);
            if (assortmentIds[i].length) {
                promise.push(CourseMysqlV2.getAssortmentDetailsFromIdWithCourseThumbnails(db.mysql.read, assortmentIds[i], 'widget_popular_course', versionCode, null));
            } else {
                promise.push([]);
            }
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'course_subject') {
            promise.push(CourseMysqlV2.getCoursesAndSubjectsOfClassForBoards(db.mysql.read, studentClass));
        } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'exams') {
            promise.push(CourseMysqlV2.getCoursesAndSubjectsOfClassForEntranceExams(db.mysql.read, studentClass));
        } else if (carouselsData[i].data_type === 'assortment') {
            assortmentIds[i] = assortmentIds[i].filter((e) => userCourseAssortments.indexOf(+e) < 0);
            if (assortmentIds[i].length) {
                promise.push(CourseMysqlV2.getAssortmentDetailsFromIdForExplorePage(db.mysql.read, assortmentIds[i], category === 'Kota Classes' ? null : studentClass));
            } else {
                promise.push([]);
            }
        } else if (carouselsData[i].data_type === 'text') {
            promise.push([]);
        } else if (carouselsData[i].data_type === 'predefined') {
            promise.push(db.mysql.read.query(`${carouselsData[i].query_to_use}`));
        } else if (carouselsData[i].data_type === 'banners') {
            promise.push(CourseMysqlV2.getBannersFromId(db.mysql.read, assortmentIds[i]));
        } else if (carouselsData[i].data_type === 'testimonial') {
            promise.push(CourseMysqlV2.getTopperTestimonial(db.mysql.read, studentClass, locale === 'hi' ? 'Hindi' : 'English'));
        } else if (carouselsData[i].data_type === 'nudge') {
            const event = 'data_watch_time';
            promise.push(NudgeMysql.getByEvent(db.mysql.read, event, studentClass));
        } else if (carouselsData[i].data_type === 'library_video') {
            promise.push({
                widget_type: 'horizontal_list',
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
            });
        } else if (carouselsData[i].data_type === 'test_series') {
            const categories = [];
            studentCcmData.map((item) => categories.push(item.category));
            if (categories.length) {
                promise.push(CourseMysqlV2.getTestSeriesAssortments(db.mysql.read, categories, studentClass, locale === 'hi' ? 'HINDI' : 'ENGLISH'));
            } else {
                promise.push([]);
            }
        } else if (carouselsData[i].data_type === 'calling_card') {
            promise.push([]);
        } else if (carouselsData[i].data_type === 'resources' && carouselsData[i].view_type === 'recommended') {
            const isVipUser = studentPackageList.filter((item) => item.amount > -1);
            if (!isVipUser.length && assortmentIds[i].length) {
                const free = carouselsData[i].category === 'free_classes' ? 1 : 0;
                const resourceTypes = carouselsData[i].resource_types.split(',');
                const topic = assortmentIds[i];
                promise.push(CourseMysqlV2.getResourcesByChapterName(db.mysql.read, topic, studentClass, resourceTypes, free));
            } else {
                promise.push([]);
            }
        } else if (carouselsData[i].data_type === 'recommended_assortment') {
            promise.push(getRecommendedAssortments({
                db, studentCcmData, studentPackageList, studentClass, locale, studentID, pznElasticSearchInstance,
            }));
        } else if (carouselsData[i].data_type === 'course_wallet') {
            promise.push(CourseMysqlV2.getCourseListByClass(db.mysql.read, studentClass, locale));
        } else if (carouselsData[i].data_type === 'video_banners') {
            promise.push(CourseMysqlV2.getVideoBannersFromId(db.mysql.read, assortmentIds[i]));
        } else if (carouselsData[i].data_type === 'exam_corner') {
            promise.push(ExamCornerMysql.examCornerArticlesClassWise(db.mysql.read, studentClass, locale));
        } else if (carouselsData[i].data_type === 'resources' && carouselsData[i].view_type === 'live_classes') {
            promise.push(CourseContainer.getLiveclassTvCarouselData(db, 'live_now', assortmentIds[i]));
        } else if (carouselsData[i].data_type === 'top_icons' && carouselsData[i].view_type === 'subjects') {
            promise.push(CourseMysqlV2.getSubjectFromCategoryTypeForExplore(db.mysql.read, 'CBSE Boards', studentClass, locale));
        } else if (carouselsData[i].data_type === 'top_icons' && carouselsData[i].view_type === 'courses') {
            promise.push(getCategoryIconsForExplorePage({
                allCategories, studentCategoryData, versionCode, studentPackageList,
            }));
        } else if (carouselsData[i].data_type === 'top_icons' && carouselsData[i].view_type === 'all') {
            promise.push(getTopIconsForExplorePage(carouselsData, config, locale));
        } else if (carouselsData[i].data_type === 'campaign_query') {
            assortmentIds[i] = assortmentIds[i].filter((e) => userCourseAssortments.indexOf(+e) < 0);
            if (assortmentIds[i].length) {
                promise.push(CourseHelper.getDataForPopularCourseCarouselCampaign({
                    db,
                    studentClass,
                    studentId: studentID,
                    studentLocale: locale,
                    assortments: assortmentIds[i],
                }));
            } else {
                promise.push([]);
            }
        } else {
            const resourceTypes = carouselsData[i].resource_types ? carouselsData[i].resource_types.split(',') : [1, 2, 4, 8, 9];
            let arr = [];
            assortmentIds[i].forEach((e) => {
                if (e.assortment_id) {
                    arr.push(e.assortment_id);
                } else if (Number.isInteger(e)) {
                    arr.push(e);
                }
            });
            const batchID = batchAssortmentMapping[carouselsData[i].assortment_list.split(',')[0]] || 1;
            if (carouselsData[i].view_type === 'past') {
                if (arr.length > 40) {
                    arr = arr.slice(20);
                }
                promise.push(CourseContainer.getPastResourceDetailsFromAssortmentId(db, arr, resourceTypes, studentClass, carouselsData[i].subject_filter, carouselsData[i].id, 1));
            } else if (carouselsData[i].view_type === 'upcoming') {
                if (arr.length > 40) {
                    arr = arr.slice(20);
                }
                promise.push(CourseMysqlV2.getUpcomingResourcesFromAssortmentId(db.mysql.read, arr, resourceTypes, studentClass, carouselsData[i].subject_filter, 0, batchID));
            } else if (carouselsData[i].view_type === 'recorded') {
                if (arr.length > 40) {
                    arr = arr.slice(20);
                }
                promise.push(CourseMysqlV2.getRecordedResourceDetailsFromAssortmentId(db.mysql.read, arr, resourceTypes, studentClass, carouselsData[i].subject_filter, 0));
            } else if (carouselsData[i].view_type === 'playlist') {
                arr = _.uniq(arr);
                if (arr.length > 40) {
                    arr = arr.slice(20);
                }
                promise.push(CourseMysqlV2.getRecordedResourceForEtoos(db.mysql.read, arr, resourceTypes, studentClass, 0));
            } else {
                if (arr.length > 40) {
                    arr = arr.slice(20);
                }
                promise.push(CourseMysqlV2.getAllResourceDetailsFromAssortmentId(db.mysql.read, arr, resourceTypes, studentClass, carouselsData[i].subject_filter, 0, batchID));
            }
        }
    }
    const resolvedPromises = await Promise.all(promise);
    return resolvedPromises;
}

async function getBannerAndVideoCarouselData({
    db,
    config,
    locale,
    studentClass,
    isDropper,
    carouselsData,
    result,
    studentID,
    xAuthToken,
    versionCode,
}) {
    const bannerdata = await CourseHelper.generateBannerData({
        db,
        config,
        locale,
        studentClass,
        isDropper,
        carouselsData,
        result,
        studentID,
        xAuthToken,
        versionCode,
    });
    const obj = WidgetHelper.bannerVideoPromoList({
        carousel: carouselsData,
        result: bannerdata.data.items,
    });
    return obj;
}

async function getCoursesWithCategoryTabsWidget({
    db,
    data,
    config,
    locale,
    carousel,
    studentCcmData,
    courseStudentEnrolledCount,
    assortmentPriceMapping,
}) {
    const items = [];
    for (let i = 0; i < studentCcmData.length; i++) {
        studentCcmData[i].category = LiveclassData.examCategoryMapping[studentCcmData[i].course];
    }
    for (let i = 0; i < data.length; i++) {
        if (_.find(studentCcmData, ['category', data[i].category])) {
            const ccmCategory = data[i];
            data.splice(i, 1);
            data.unshift(ccmCategory);
        }
    }
    const groupedData = _.groupBy(data, 'category');
    for (const key in groupedData) {
        if (groupedData[key]) {
            let childItems = [];
            if (carousel.view_type === 'course_subject') {
                // console.log(groupedData[key][i].length)
                const widget = WidgetHelper.getRecommendedCoursesWidget({
                    config,
                    locale,
                    scrollDirection: 'grid',
                    assortmentPriceMapping,
                    courseStudentEnrolledCount,
                    carousel,
                    result: groupedData[key].splice(0, 4),
                    hideSeeAll: true,
                });
                childItems = widget.data.items;
            } else if (carousel.view_type === 'exams') {
                const widget = await CourseWidgetHelper.getPopularCourseWidgetData({
                    db, result: groupedData[key], carousel, config, locale, assortmentPriceMapping,
                });
                widget.data.title = '';
                childItems.push(widget);
            }
            items.push({
                title: key === 'IIT JEE|NEET|FOUNDATION' ? 'Kota Classes' : key,
                items: childItems,
                see_all_text: locale === 'hi' ? `सभी ${key === 'IIT JEE|NEET|FOUNDATION' ? 'Kota Classes' : key} कोर्स देखें` : `See All Courses For ${key === 'IIT JEE|NEET|FOUNDATION' ? 'Kota Classes' : key}`,
                deeplink: key === 'IIT JEE|NEET|FOUNDATION' ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_category?category_id=${key}`,
            });
        }
    }
    return {
        type: carousel.carousel_type,
        data: {
            title: carousel.title,
            items,
            scroll_direction: carousel.view_type === 'course_subject' ? 'grid' : 'vertical',
        },
    };
}

async function getCaraouselData(data) {
    const {
        carouselsData,
        db,
        config,
        resolvedPromises,
        studentID,
        isDropper,
        versionCode,
        emiPackageList,
        studentCcmData,
        assortmentFlagrResponse,
        assortmentIds,
        studentClass,
        studentPackageList,
        assortmentPriceMapping,
        studentPackageAssortments,
        courseStudentEnrolledCount,
        studentEmiPackageAssortments,
        locale,
        category,
        xAuthToken,
        hasUPI,
        studentCourseOrClassSubcriptionDetails,
        priceFlow = false,
    } = data;
    try {
        const caraouselList = [];
        const userCourseAssortments = [];
        const buyWithUpiFlag = await Utility.buyWithUpiStatus(xAuthToken, hasUPI);
        studentPackageList.map((item) => userCourseAssortments.push(item.assortment_id));
        for (let i = 0; i < carouselsData.length; i++) {
            if (carouselsData[i].carousel_type === 'widget_parent') {
                if (carouselsData[i].view_type === 'related') {
                    caraouselList.push(generateRelatedViewingData({
                        caraouselData: carouselsData[i],
                        db,
                        config,
                        studentID,
                        studentClass,
                        studentPackageList,
                        result: resolvedPromises[i],
                        studentPackageAssortments,
                        studentEmiPackageAssortments,
                        assortmentPriceMapping,
                        category,
                    }));
                } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].view_type === 'my_courses' && versionCode >= 893) {
                    caraouselList.push(generateMyCoursesCarousel({
                        db,
                        studentId: studentID,
                        studentClass,
                        versionCode,
                        setWidth: true,
                        config,
                        studentLocale: locale,
                        studentCourseOrClassSubcriptionDetails,
                        coursePage: 'MY_COURSES_EXPLORE',
                        result: resolvedPromises[i],
                        caraouselData: carouselsData[i],
                        xAuthToken,
                    }));
                } else if (carouselsData[i].data_type === 'assortment' && carouselsData[i].ccm_id === 1) {
                    caraouselList.push({
                        type: carouselsData[i].carousel_type,
                        data: {
                            title: carouselsData[i].title,
                            items: resolvedPromises[i] ? resolvedPromises[i].items : [],
                        },
                    });
                } else if (carouselsData[i].data_type === 'assortment') {
                    const result = resolvedPromises[i].filter((item) => !_.find(studentPackageList, ['assortment_id', item.assortment_id]));
                    caraouselList.push(generateMultiResourceCarousel({
                        caraouselData: carouselsData[i],
                        result,
                        db,
                        locale,
                        config,
                        studentID,
                        versionCode,
                        assortmentIds: assortmentIds[i],
                        studentPackageList,
                        assortmentPriceMapping,
                        assortmentFlagrResponse,
                        studentEmiPackageAssortments,
                        studentPackageAssortments,
                        category,
                    }));
                } else {
                    caraouselList.push(generateViewByResourceType({
                        caraouselData: carouselsData[i],
                        result: resolvedPromises[i],
                        db,
                        locale,
                        config,
                        flagrResponse: {},
                        setWidth: true,
                        studentID,
                        versionCode,
                        studentPackageList,
                        assortmentPriceMapping,
                        studentPackageAssortments,
                        studentEmiPackageAssortments,
                        category,
                    }));
                }
            } else if (carouselsData[i].carousel_type === 'faculty_grid2') {
                caraouselList.push(WidgetHelper.generateFacultyGridData({ carouselsData: carouselsData[i], data: resolvedPromises[i], config }));
            } else if (carouselsData[i].carousel_type === 'course_subject') {
                caraouselList.push(generateSubjectListData({
                    carouselsData: carouselsData[i], data: resolvedPromises[i], config, assortmentIds: assortmentIds[i], locale,
                }));
            } else if (carouselsData[i].carousel_type === 'promo_list' && carouselsData[i].view_type === 'emi') {
                if (emiPackageList.length) {
                    const lastEmi = emiPackageList[emiPackageList.length - 1];
                    const end = moment().add(5, 'hours').add(30, 'minutes').add(7, 'days')
                        .endOf('day');
                    if (lastEmi.end_date <= end && !lastEmi.is_last) {
                        caraouselList.push(generateEmiBannerData({ carouselsData: carouselsData[i], result: resolvedPromises[i], emiPackageList }));
                    }
                }
            } else if (carouselsData[i].carousel_type === 'promo_list' && resolvedPromises[i] && resolvedPromises[i].length) {
                caraouselList.push(CourseHelper.generateBannerData({
                    db,
                    config,
                    locale,
                    studentClass,
                    isDropper,
                    carouselsData: carouselsData[i],
                    result: resolvedPromises[i],
                    studentID,
                    xAuthToken,
                    versionCode,
                }));
            } else if (carouselsData[i].carousel_type === 'NUDGE' && resolvedPromises[i] && resolvedPromises[i].length) {
                let tgCheck = true;
                if (resolvedPromises[i][0].target_group) {
                    tgCheck = await TgHelper.targetGroupCheck({
                        db, studentId: studentID, tgID: resolvedPromises[i][0].target_group, studentClass, locale,
                    });
                }
                if (tgCheck) {
                    const nudgeList = NudgeHelper.getWidget(resolvedPromises[i], config);
                    nudgeList.data.scroll_type = 'vertical';
                    caraouselList.push(nudgeList);
                }
            } else if (carouselsData[i].data_type === 'library_video') {
                if (carouselsData[i].data_limit < 0 || !carouselsData[i].data_limit) {
                    carouselsData[i].data_limit = 10;
                }
                caraouselList.push(getLibraryVideoCarousel({
                    carouselsData: carouselsData[i],
                    result: resolvedPromises[i],
                    config,
                    db,
                    studentID,
                    studentClass,
                    locale,
                }));
            } else if (carouselsData[i].carousel_type === 'testimonial_v2' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getTopperTestimonialWidget({
                    carouselsData: carouselsData[i],
                    result: resolvedPromises[i],
                    locale,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_top_selling_subject' && resolvedPromises[i].length) {
                resolvedPromises[i] = resolvedPromises[i].filter((item) => (userCourseAssortments.indexOf(item.course_assortment) < 0) && (userCourseAssortments.indexOf(item.assortment_id) < 0));
                caraouselList.push(WidgetHelper.popularSubjectsWidget({
                    carouselsData: carouselsData[i], result: resolvedPromises[i], locale, assortmentPriceMapping, buyWithUpiFlag,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_test_series' && resolvedPromises[i].length) {
                resolvedPromises[i] = resolvedPromises[i].filter((e) => userCourseAssortments.indexOf(+e.assortment_id) < 0);
                if (resolvedPromises[i].length) {
                    caraouselList.push(WidgetHelper.getTestSeriesCoursesWidget({
                        carousel: carouselsData[i], result: resolvedPromises[i], locale, assortmentPriceMapping, config, buyWithUpiFlag,
                    }));
                }
            } else if (carouselsData[i].carousel_type === 'widget_calling_big_card') {
                caraouselList.push(WidgetHelper.callingCardExplorePage({ config, carousel: carouselsData[i], locale }));
            } else if (carouselsData[i].carousel_type === 'widget_course_v3' && resolvedPromises[i] && ((resolvedPromises[i].studentCcmAssortments && resolvedPromises[i].studentCcmAssortments.length) || resolvedPromises[i].length)) {
                const result = resolvedPromises[i].studentCcmAssortments ? resolvedPromises[i].studentCcmAssortments : resolvedPromises[i];
                caraouselList.push(CourseWidgetHelper.getPopularCourseWidgetData({
                    db,
                    result,
                    carousel: carouselsData[i],
                    config,
                    locale,
                    assortmentPriceMapping: resolvedPromises[i].assortmentPriceMapping || assortmentPriceMapping,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_course_resource_v2' && resolvedPromises[i].length) {
                resolvedPromises[i] = resolvedPromises[i].filter((item) => userCourseAssortments.indexOf(item.assortment_id) < 0);
                caraouselList.push(WidgetHelper.getPdfWidgetExplorePage({
                    result: resolvedPromises[i],
                    carousel: carouselsData[i],
                    assortmentPriceMapping,
                    locale,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_popular_course' && resolvedPromises[i].length) {
                caraouselList.push(getTrendingCourseWidget({
                    db,
                    locale,
                    config,
                    studentID,
                    versionCode,
                    result: resolvedPromises[i],
                    carousel: carouselsData[i],
                    assortmentPriceMapping,
                    buyWithUpiFlag,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_button_border') {
                caraouselList.push(WidgetHelper.borderButtonWidget({
                    text: carouselsData[i].title,
                    type: 'coupon',
                    deeplink: 'doubtnutapp://coupon_list?page=explore_view',
                    icon: `${config.cdn_url}engagement_framework/7858A952-60E9-0731-2A2B-A58037C1F65D.webp`,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_course_v4' && carouselsData[i].data_type === 'campaign_query' && resolvedPromises[i] && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getCampaignUserWidgetsExplore({
                    config,
                    locale,
                    carousel: carouselsData[i],
                    result: resolvedPromises[i],
                    videoResources: [],
                    assortmentPriceMapping,
                    priceFlow,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_course_v4' && resolvedPromises[i].length) {
                caraouselList.push(getLatestSoldCourseWidget({
                    db,
                    config,
                    locale,
                    versionCode,
                    assortmentPriceMapping,
                    courseStudentEnrolledCount,
                    carousel: carouselsData[i],
                    result: resolvedPromises[i],
                }));
            } else if (carouselsData[i].carousel_type === 'widget_course_recommendation' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getRecommendedCoursesWidget({
                    config,
                    locale,
                    scrollDirection: 'grid',
                    assortmentPriceMapping,
                    courseStudentEnrolledCount,
                    carousel: carouselsData[i],
                    result: resolvedPromises[i],
                }));
            } else if (carouselsData[i].carousel_type === 'live_class_carousel_card_2' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getContinueBuyingCoursesWidget({
                    config,
                    locale,
                    carousel: carouselsData[i],
                    result: resolvedPromises[i],
                }));
            } else if (carouselsData[i].carousel_type === 'widget_explore_promo' && resolvedPromises[i].length) {
                caraouselList.push(getBannerAndVideoCarouselData({
                    db,
                    config,
                    locale,
                    studentClass,
                    isDropper,
                    studentID,
                    xAuthToken,
                    carouselsData: carouselsData[i],
                    result: resolvedPromises[i],
                    versionCode,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_video') {
                caraouselList.push(WidgetHelper.getWhyDoubtnutWidget({
                    carousel: carouselsData[i], config, locale,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_course_wallet' && resolvedPromises[i].length) {
                resolvedPromises[i] = resolvedPromises[i].filter((e) => userCourseAssortments.indexOf(+e.assortment_id) < 0);
                caraouselList.push(getCourseWidgetWithWalletAmount({
                    db,
                    config,
                    studentID,
                    carousel: carouselsData[i],
                    result: resolvedPromises[i],
                }));
            } else if (carouselsData[i].carousel_type === 'exam_corner_default' && resolvedPromises[i].length) {
                caraouselList.push(getExamCornerWidgetForExplorePage({
                    db, result: resolvedPromises[i], carousel: carouselsData[i], studentID, locale,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_recommendation') {
                caraouselList.push(WidgetHelper.getRecommendationStripWidget({
                    carousel: carouselsData[i], locale,
                }));
            } else if (carouselsData[i].carousel_type === 'video_banner_autoplay_child' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getVideoAdsWidget({
                    carousel: carouselsData[i], result: resolvedPromises[i],
                }));
            } else if (carouselsData[i].carousel_type === 'widget_autoplay' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.homepageVideoWidgetWithAutoplay({
                    data: resolvedPromises[i], paymentCardState: { isVip: false }, db, config, title: carouselsData[i].title, studentLocale: locale, versionCode, pageValue: 'explore', isLive: carouselsData[i].view_type === 'live_classes',
                }));
            } else if (carouselsData[i].carousel_type === 'widget_explore_course_v2_circle' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getExplorePageTopIconsWidget({
                    data: resolvedPromises[i], carousel: carouselsData[i], circleWidget: true,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_latest_launches' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getLatestLaunchedCoursesWidget({
                    result: resolvedPromises[i], carousel: carouselsData[i], locale, assortmentPriceMapping, config,
                }));
            } else if (carouselsData[i].carousel_type === 'widget_explore_course_v2_square' && resolvedPromises[i].length) {
                caraouselList.push(WidgetHelper.getExplorePageTopIconsWidget({
                    data: resolvedPromises[i], carousel: carouselsData[i],
                }));
            } else if (carouselsData[i].carousel_type === 'widget_parent_tab2' && resolvedPromises[i].length) {
                caraouselList.push(getCoursesWithCategoryTabsWidget({
                    data: resolvedPromises[i], carousel: carouselsData[i], courseStudentEnrolledCount, assortmentPriceMapping, config, locale, db, studentCcmData,
                }));
            }
        }
        const result = await Promise.all(caraouselList);
        if (_.findIndex(carouselsData, (o) => o.is_cod_carousel == true) >= 0) {
            const myCoursesObjIndex = _.findIndex(result, (o) => o.type === 'widget_my_courses');
            const myCoursesObj = result[myCoursesObjIndex];
            _.remove(result, (o) => o.type === 'widget_my_courses');
            result.splice(1, 0, myCoursesObj);
        }
        const testSeriesIndex = _.findIndex(result, (o) => o.testWidget);
        const widgets = [];
        for (let i = 0; i < result.length; i++) {
            if (!(!result[i].data || (result[i].data && result[i].data.items && !result[i].data.items.length))) {
                widgets.push(result[i]);
            }
            if (result[i].type === 'widget_explore_course_v2_square') {
                for (let j = 0; j < result[i].data.items.length; j++) {
                    if (result[i].data.items[j].id === 'test') {
                        result[i].data.items[j].position = testSeriesIndex;
                    }
                }
            }
        }
        return widgets;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getProgressCarousel(db, studentProgress, otherStudentsProgress, courseDetail) {
    let total = 0;
    let resources = [];
    if (courseDetail[0].assortment_type === 'resource_video') {
        total = 1;
    }
    if (courseDetail[0].assortment_type === 'resource_pdf') {
        total = 1;
    }
    if (courseDetail[0].assortment_type === 'resource_test') {
        total = 1;
    }
    if (courseDetail[0].assortment_type === 'chapter') {
        resources = await CourseMysqlV2.getResourcesCountFromChapterAssortment(db.mysql.read, courseDetail[0].assortment_id);
    }
    if (courseDetail[0].assortment_type === 'subject') {
        resources = await CourseMysqlV2.getResourcesCountFromSubjectAssortment(db.mysql.read, courseDetail[0].assortment_id);
    }
    if (courseDetail[0].assortment_type === 'course') {
        resources = await CourseMysqlV2.getResourcesCountFromCourseAssortment(db.mysql.read, courseDetail[0].assortment_id);
    }
    for (let i = 0; i < resources.length; i++) {
        if (resources[i] && resources[i].count) {
            total += resources[i].count;
        }
    }
    let me = 0;
    let others = 0;
    if (studentProgress.length) {
        me = (studentProgress[0].total_count / total) > 1 ? 1 : studentProgress[0].total_count / total;
    }
    if (otherStudentsProgress.length) {
        others = (otherStudentsProgress[0].total_count / total) > 1 ? 1 : otherStudentsProgress[0].total_count / total;
    }

    const obj = {
        type: 'progress_bar',
        data: {
            title: LiveclassData.progressMe,
            subtitle: LiveclassData.progressOthers,
            me: me * 100,
            others: others * 100,
        },
    };
    return obj;
}

async function getCaraouselDataForCoursePage({
    db,
    config,
    locale,
    studentID,
    carousels,
    studentClass,
    resolvedPromises,
    versionCode,
}) {
    try {
        const caraouselList = [];
        for (let i = 0; i < carousels.length; i++) {
            if (carousels[i].carousel_type === 'promo_list') {
                caraouselList.push(CourseHelper.generateBannerData({
                    db,
                    config,
                    locale,
                    studentID,
                    studentClass,
                    carouselsData: carousels[i],
                    result: resolvedPromises[i] || [],
                    versionCode,
                }));
            } else if (carousels[i].carousel_type === 'course_cards') {
                caraouselList.push(WidgetHelper.getPostPuchaseCourseCardsWidget({
                    carousel: carousels[i],
                    result: resolvedPromises[i] || [],
                }));
            } else if (carousels[i].carousel_type === 'course_subject_v1') {
                caraouselList.push(WidgetHelper.getPostPuchaseCourseSubjectsWidget({
                    carousel: carousels[i],
                    result: resolvedPromises[i],
                }));
            } else if (carousels[i].carousel_type === 'widget_parent') {
                caraouselList.push(WidgetHelper.getPostPuchaseLecturesWidget({
                    carousel: carousels[i],
                    result: resolvedPromises[i] || [],
                }));
            } else if (carousels[i].carousel_type === 'validity_widget') {
                caraouselList.push(WidgetHelper.getPostPuchaseTrialWidget({
                    carousel: carousels[i],
                    result: resolvedPromises[i] || [],
                }));
            }
        }
        const result = await Promise.all(caraouselList);
        return result;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function scholarshipLanding(db, config, studentID, xAuthToken, locale, assortmentID, versionCode) {
    const resData = {};
    let deeplinkSch;
    let demoVideo;
    const typeTest = assortmentID.replace('scholarship_test_', '');
    let testData = await CourseContainer.getScholarshipExams(db);
    testData = testData.filter((e) => e.type.includes(typeTest));
    if (testData.length === 0) {
        return 'No Active Test';
    }
    const testDataArray = [];
    for (let i = 0; i < testData.length; i++) {
        testDataArray.push(testData[i].test_id);
    }
    const schDetail = [{
        demo_video_qid: locale === 'hi' ? testData[0].video.split('||')[0] : testData[0].video.split('||')[1],
        demo_video_thumbnail: locale === 'hi' ? `${testData[0].video_thumbnail.split('||')[0]}` : `${testData[0].video_thumbnail.split('||')[1]}`,
    }];
    let progressID = await CourseMysqlV2.getScholarshipTestProgress(db.mysql.read, studentID);
    progressID = progressID.filter((e) => testDataArray.includes(e.test_id));
    let subscriptionId;
    if (progressID && progressID[0]) {
        subscriptionId = await TestSeries.getTestSeriesData(db.mysql.read, studentID, progressID[0].test_id);
    }
    if (subscriptionId && subscriptionId[0]) {
        for (let j = 0; j < subscriptionId.length; j++) {
            if (subscriptionId && subscriptionId[j] && subscriptionId[j].status === 'COMPLETED') {
                subscriptionId = [subscriptionId[j]];
                break;
            }
        }
    }
    let textData;
    if (progressID && progressID[0]) {
        textData = testData.filter((item) => item.test_id === +(progressID[0].test_id));
    }
    if (!progressID || !progressID.length) {
        deeplinkSch = await scholarshipHelper.scholarshipDeeplink(versionCode, db, typeTest, xAuthToken, studentID);
        schDetail[0].deeplink = deeplinkSch;
        demoVideo = await CourseHelper.getCourseDemoVideoData(db, config, schDetail, null, locale, null, assortmentID, null, testData, null);
    } else if (progressID[0].progress_id == 2 || progressID[0].progress_id == 3 || progressID[0].progress_id == 4 || progressID[0].progress_id == 5) {
        deeplinkSch = await scholarshipHelper.scholarshipDeeplink(versionCode, db, typeTest, xAuthToken, studentID, progressID, subscriptionId);
        schDetail[0].deeplink = deeplinkSch;
        demoVideo = await CourseHelper.getCourseDemoVideoData(db, config, schDetail, null, locale, null, assortmentID, progressID, textData, subscriptionId);
    }
    if (demoVideo.qid) {
        const answerData = await CourseMysqlV2.getAnswerIdbyQuestionId(db.mysql.read, demoVideo.qid);
        if (answerData.length) {
            const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, demoVideo.qid, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
            demoVideo.video_resources = videoResources;
        }
    }
    let banner;
    let progress;
    if (!progressID || !progressID.length) {
        progress = 1;
        banner = await CourseMysqlV2.getScholarshipAppBanner(db.mysql.read, locale, progress, testData[0].test_id);
    }
    const widgetsSch = [
        {
            type: 'course_info_v1',
            data: {
                title: (testData && testData[0] && testData[0].coursepage_info) ? `${testData[0].coursepage_info}` : '',
                description: '',
                duration: (testData && testData[0] && testData[0].test_date) ? `${testData[0].test_date}` : '',
                starting_at_text: '',
                starting_at_text_hi: '',
                amount_to_pay: 'FREE',
                rating: '5.0',
                tag: locale === 'hi' ? 'हिंदी माध्यम' : 'English medium',
            },
        },
        {
            type: 'promo_list',
            data: {
                auto_scroll_time_in_sec: autoScrollTime,
                items: [
                    {
                        id: 'course_details_banners_2',
                        image_url: (banner && banner[0] && banner[0].url) ? banner[0].url : '',
                        deeplink: deeplinkSch,
                    },
                ],
                ratio: '5:1',
            },
        }];
    const faqWidget = await getFaqLanding(db, locale, testData[0].faq_bucket);
    widgetsSch.push(faqWidget);
    resData.demo_video = demoVideo;
    resData.is_vip = false;
    resData.extra_widgets = widgetsSch;
    resData.buy_button = {
        id: 1,
        type: 'default',
        title: locale === 'hi' ? 'आज ही रजिस्टर करें!' : 'Aaj hi register karein!',
        description: '',
        amount_to_pay: 'FREE',
        amount_strike_through: '',
        know_more_text: '',
        amount_saving: '',
        pay_text: locale === 'hi' ? 'रेजिस्टर करें' : 'Register karein',
        upfront_variant: 1,
        deeplink: deeplinkSch,
    };
    if (progressID && progressID[0] && progressID[0].progress_id == 2 && ((subscriptionId && subscriptionId[0] && subscriptionId[0].status !== 'COMPLETED') || (!subscriptionId || subscriptionId.length === 0))) {
        progress = 2;
        const timeText = moment(textData[0].publish_time).format('lll');
        locale = null;
        resData.buy_button.title = locale === 'hi' ? `आप ${textData[0].test_name} स्कॉलरशिप परीक्षा के लिए सफलतापूर्वक रजिस्टर है.` : `Aap ${textData[0].test_name} Scholarship Test ke liye successfully register hai`;
        resData.buy_button.pay_text = (locale === 'hi') ? `टेस्ट शुरू करें (${timeText})` : `Start Test (${timeText})`;
    } else if (progressID && progressID[0] && progressID[0].progress_id == 2 && subscriptionId && subscriptionId[0] && subscriptionId[0].status === 'COMPLETED') {
        progress = 3;
        const dayText = moment(textData[0].result_time).format('Do MMM, hh:mm A');
        locale = null;
        resData.buy_button.title = locale === 'hi' ? `आपने ${textData[0].test_name} स्कॉलरशिप परीक्षा सफलतापूर्वक पूरी कर ली है.` : `Aapne ${textData[0].test_name} Scholarship Test successfully complete kar liya hai`;
        resData.buy_button.pay_text = (locale === 'hi') ? `परिणाम देखें (${dayText})` : `View Results (${dayText})`;
        resData.extra_widgets[0].data.duration = '30th May';
    } else if (progressID && progressID[0] && progressID[0].progress_id == 4) {
        progress = 4;
        resData.buy_button.title = locale === 'hi' ? 'खत्म हुआ इंतजार आ गया है रिजल्ट !' : 'Khatam hua intezaar aa gya hai result !';
        resData.buy_button.pay_text = (locale === 'hi') ? 'परिणाम देखें।' : 'Check Results';
    } else if (progressID && progressID[0] && progressID[0].progress_id == 5) {
        progress = 5;
        resData.buy_button.title = locale === 'hi' ? 'मुबारक हो !\nआप Doubtnut सुपर 100 के दूसरे चरण के लिए चुने गए हैं' : 'Congratualtion\nAap Doubtnut Super 100 ke Round 2 ke liye select ho gaye hain';
        resData.buy_button.pay_text = (locale === 'hi') ? 'दूसरे चरण की ओर बढ़ें' : 'Proceed to round 2';
    }
    if (progress === 2 || progress === 3 || progress === 4 || progress === 5) {
        banner = await CourseMysqlV2.getScholarshipAppBanner(db.mysql.read, locale, progress, textData[0].test_id);
        resData.extra_widgets[1].data.items[0].image_url = banner[0].url;
    }
    return resData;
}

async function generateAssortmentStudentEnrolledMapping(db, courseAssortentList) {
    const promise = [];
    for (let i = 0; i < courseAssortentList.length; i++) {
        promise.push(CourseContainer.getEnrolledStudentsInCourse(db, courseAssortentList[i]));
    }
    const resolvedPromises = await Promise.all(promise);
    const enrolledStudentsCountList = [];
    for (let i = 0; i < resolvedPromises.length; i++) {
        if (resolvedPromises[i].length) {
            const obj = resolvedPromises[i][0];
            obj.assortment_id = +courseAssortentList[i];
            enrolledStudentsCountList.push(obj);
        }
    }
    return enrolledStudentsCountList;
}

function addExtraData(data, staticTabs, items, tabs, groupId, carouselData) {
    const tabBasedOnData = {}; const uniqueIds = {};
    const localisedData = _.cloneDeep(Data.freeLiveClassTab.localisedData);
    if (data && data.items && data.items.length) {
        for (let i = 0; i < data.items.length; i++) {
            data.items[i].group_id = groupId;
            if (carouselData.view_type === 'free_live_class_subject' && data.items[i].data.subject) {
                data.items[i].group_id = data.items[i].data.subject.toLowerCase();
                tabBasedOnData[data.items[i].group_id] = true;
            }

            if (data.items[i].data) {
                data.items[i].data.state = (groupId && groupId === 'upcoming') ? 0 : data.items[i].data.state;
                data.items[i].data.text_horizontal_bias = 0;
                data.items[i].data.page = 'LIVECLASS_FREE';
                data.items[i].data.card_width = '1.25';
                if (carouselData.view_type === 'free_live_class_all') {
                    data.items[i].data.text_vertical_bias = 0;
                    data.items[i].data.title1_text_size = '16';
                    data.items[i].data.title1_is_bold = true;
                    data.items[i].data.title2_text_size = '11';
                    data.items[i].data.title2_is_bold = false;
                    data.items[i].data.title1_text_color = '#ffffff';
                    data.items[i].data.title2_text_color = '#ffffff';
                    data.items[i].data.title4 = data.items[i].group_id === 'live' ? '' : data.items[i].data.top_title;
                    data.items[i].data.title4_text_size = '11';
                    data.items[i].data.title4_text_color = '#ffffff';
                    data.items[i].data.title4_is_bold = false;
                    data.items[i].data.title2 = data.items[i].data.title2 ? `${_.startCase(data.items[i].data.title2.toLowerCase())}` : '';
                } else {
                    data.items[i].data.title3 = data.items[i].data.title2 ? `${_.startCase(data.items[i].data.title2.toLowerCase())}` : '';
                    data.items[i].data.title2 = data.items[i].data.title1;
                    data.items[i].data.title1 = data.items[i].data.subject ? `${_.startCase(data.items[i].data.subject.toLowerCase())}, Class ${carouselData.class}` : `Class ${carouselData.class}`;
                    data.items[i].data.text_vertical_bias = 0.5;
                    data.items[i].data.title1_text_size = '12';
                    data.items[i].data.title1_is_bold = false;
                    data.items[i].data.title2_text_size = '20';
                    data.items[i].data.title2_is_bold = true;
                    data.items[i].data.title1_text_color = '#031269';
                    data.items[i].data.title2_text_color = '#1a29a9';
                    data.items[i].data.title3_text_size = '12';
                    data.items[i].data.title3_text_color = '#031269';
                    data.items[i].data.title3_is_bold = false;
                    data.items[i].data.image_bg_card = Data.freeLiveClassTab.subjetBgImage[data.items[i].data.subject.toLowerCase()] || Data.freeLiveClassTab.subjetBgImage.default;
                    data.items[i].data.subject = null;
                    if (carouselData.view_type === 'free_live_class_exams' && data.items[i].data.button) {
                        data.items[i].data.button2 = {
                            deep_link: data.items[i].data.button.deeplink,
                            text: carouselData.locale === 'hi' ? 'अध्याय पर जाएँ' : data.items[i].data.button.text,
                        };
                    }
                }
                delete data.items[i].data.top_title;
            }

            if (data.items[i].data.bottom_layout) {
                data.items[i].data.bottom_layout.sub_title_color = '#5b5b5b';
                if (data.items[i].data.bottom_layout.button) {
                    data.items[i].data.bottom_layout.button.text_all_caps = false;
                    data.items[i].data.bottom_layout.button.background_color = '#00000000';
                    data.items[i].data.bottom_layout.button.show_volume = false;
                    data.items[i].data.bottom_layout.button.text = '';
                    if (carouselData.view_type === 'free_live_class_all') {
                        if (data.items[i].group_id && data.items[i].group_id === 'live') {
                            data.items[i].data.bottom_layout.button.text = carouselData.locale === 'hi' ? 'अभी जुड़े' : 'Join Now';
                            data.items[i].data.bottom_layout.button.show_volume = true;
                        }
                        if (data.items[i].group_id && data.items[i].group_id === 'past') {
                            data.items[i].data.bottom_layout.button.text = carouselData.locale === 'hi' ? 'अभी देखें' : 'Watch Now';
                        }
                        data.items[i].data.bottom_layout.title = `Class ${carouselData.class}, ${data.items[i].data.bottom_layout.title}`;
                    }
                }
            }
            if (!uniqueIds[data.items[i].data.id]) {
                uniqueIds[data.items[i].data.id] = true;
                items.push(data.items[i]);
            }
        }
    }

    if (groupId && items.length) {
        if (carouselData.locale === 'hi' && localisedData[groupId]) {
            staticTabs[groupId].title = localisedData[groupId];
        }
        tabs.push(staticTabs[groupId]);
    }
    const tabOrder = Object.keys(staticTabs);
    for (let i = 0; i < tabOrder.length && !groupId; i++) {
        if (carouselData.locale === 'hi' && localisedData[tabOrder[i]]) {
            staticTabs[tabOrder[i]].title = localisedData[tabOrder[i]];
        }
        if (tabBasedOnData[tabOrder[i]] && staticTabs[tabOrder[i]]) {
            tabs.push(staticTabs[tabOrder[i]]);
        }
    }
    if (tabs.length) {
        tabs[0].is_selected = true;
    }
}

async function addViewLikeDuration(db, data) {
    const ansPromise = [];
    for (let i = 0; i < data.length; i++) {
        ansPromise.push(answerContainer.getByQuestionIdWithTextSolution(data[i].data.id, db));
    }
    const answerData = await Promise.all(ansPromise);

    for (let i = 0; i < data.length; i++) {
        if (data[i].group_id && data[i].group_id === 'upcoming') {
            if (data[i].data && data[i].data.video_resource) {
                data[i].data.video_resource.resource = null;
            }
            data[i].data.is_last_resource = true;
        }
        const subText = CourseHelper.getLikesCountAndDurationOfQid(data[i], answerData[i]);
        data[i].data.bottom_layout.sub_title = subText;
        data[i].data.bottom_layout.icon_subtitle = data[i].data.bottom_layout.sub_title && data[i].data.bottom_layout.sub_title.length ? 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/509EE326-9771-E4D0-F4C8-B9DF2A27216B.webp' : null;
    }
}

function getFilterAssortment(assortList) {
    let assortmentList = [];
    if (assortList && assortList.length) {
        assortList.forEach((x) => {
            if (x && x.assortment_id) {
                assortmentList.push(x.assortment_id);
            }
        });
        assortmentList = _.uniq(assortmentList);
    }
    return assortmentList;
}

async function makeLiveClassHistoryData(historyData, carouselData) {
    const data = [];
    for (let i = 0; i < historyData.length; i++) {
        if (historyData[i].subject && historyData[i].expert_name) {
            const obj = {
                thumbnail_image: `${historyData[i].expert_image}`,
                deeplink: `doubtnutapp://video?qid=${historyData[i].question_id}&page=LIVECLASS_FREE&playlist_id=null`,
                text_one: `${_.startCase(historyData[i].subject.toLowerCase())}`,
                text_three: `${_.startCase(historyData[i].expert_name.toLowerCase())}`,
                text_two: `${historyData[i].display}`,
                card_width: '1.5x',
                watched_time: historyData[i].watched_time,
                total_time: historyData[i].total_time,
                image_bg_card: Data.freeLiveClassTab.subjetBgImage[historyData[i].subject.toLowerCase()] || Data.freeLiveClassTab.subjetBgImage.default,
            };
            data.push({ ...obj, ...Data.freeLiveClassTab[carouselData.carousel_type].items_extra_data });
        }
    }
    return data;
}

// widget 1
async function getLiveClassYouWereWatchingData(db, studentId, carouselData) { // redis live data save as array with subject teacher class title remaining
    let historyData = await redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, studentId, 'LIVECLASS_HISTORY');
    if (!_.isNull(historyData) && historyData !== 'null') {
        historyData = JSON.parse(historyData);
        if (typeof historyData === 'string') {
            return [];
        }
        historyData = await makeLiveClassHistoryData(historyData, carouselData);
        const historyResponse = {
            widget_type: carouselData.carousel_type,
            layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
        };
        const widgetData = {
            text_one: carouselData.title,
            videos: historyData,
            id: carouselData.id.toString(),
        };
        historyResponse.widget_data = { ...widgetData, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data };
        return [historyResponse];
    }
    return [];
}

// widget 2 live, past and upcoming data
async function getLiveClassFreeData(db, studentId, stClass, locale, versionCode, config, carouselData) {
    const items = [];
    const staticTabs = { // move this to data file later
        live: { key: 'live', title: 'Live', is_selected: true },
        past: { key: 'past', title: 'Past', is_selected: false },
        upcoming: { key: 'upcoming', title: 'Upcoming', is_selected: false },
    };
    const tabs = [];
    const rawData = {
        widget_type: carouselData.carousel_type,
        widget_data: { ...{ title: carouselData.title }, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data },
        layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
    };

    const [freeAssortmentList, assortListWithoutLocale] = await Promise.all([
        CourseContainer.getFreeAssortmentList(db, stClass, null, locale),
        CourseContainer.getFreeAssortmentList(db, stClass, null, null),
    ]);

    const freeAssortList = getFilterAssortment(freeAssortmentList);
    const assortListWithoutLocaleLive = getFilterAssortment(assortListWithoutLocale);
    const data = await Promise.all([
        CourseContainer.getLiveclassTvCarouselData(db, 'live_now', assortListWithoutLocaleLive),
        CourseContainer.getLiveclassTvCarouselData(db, 'recent_boards', freeAssortList),
        CourseContainer.getLiveclassTvCarouselData(db, 'upcoming', freeAssortList),
    ]);
    const [facultyPriorityByClass, studentCcmData] = await Promise.all([
        CourseContainer.getFacultyPriorityByClassAndLocale(db, stClass, locale === 'hi' ? 'HINDI' : 'ENGLISH'),
        StudentContainer.getStudentCcmIds(db, studentId),
    ]);
    const facultyCategory = {
        BOARDS: 0,
        'IIT JEE': 0,
        NEET: 0,
        NDA: 0,
    };
    const facultyPriority = {};
    for (let i = 0; i < facultyPriorityByClass.length; i++) {
        facultyPriority[facultyPriorityByClass[i].faculty_id] = facultyPriorityByClass[i].priority;
        facultyCategory[facultyPriorityByClass[i].category] = facultyPriorityByClass[i].category_order;
    }
    if (facultyPriorityByClass.length) {
        for (let i = 0; i < data[0].length; i++) {
            data[0][i].faculty_priority = facultyPriority[data[0][i].faculty_id];
            data[0][i].category_priority = data[0][i].category && data[0][i].category.includes('Board') ? facultyCategory.BOARDS : facultyCategory[data[0][i].category] || 100;
        }
        if (studentCcmData.length > 1) {
            data[0] = _.orderBy(data[0], ['category_priority', 'faculty_priority']);
        } else {
            data[0] = _.orderBy(data[0], 'faculty_priority');
        }
    }

    const upcomingQIdsList = data[2].map((item) => item.resource_reference) || [];
    const userMarkedInsterestedData = upcomingQIdsList.length ? await CourseMysqlV2.getUserSubscribedqIds(db.mysql.read, studentId, upcomingQIdsList) : [];

    const [liveData, pastData, upcomingData] = await Promise.all([
        data[0].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[0].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Classes', locale, versionCode, pageValue: 'LIVECLASS_FREE',
        }) : [],
        data[1].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[1].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Classes', locale, versionCode, pageValue: 'LIVECLASS_FREE',
        }) : [],
        data[2].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[2].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Classes', locale, versionCode, pageValue: 'LIVECLASS_FREE',
        }) : [],
    ]);
    if (upcomingData && upcomingData.items) {
        for (let i = 0; i < upcomingData.items.length; i++) {
            const userData = _.find(userMarkedInsterestedData, ['resource_reference', parseInt(upcomingData.items[i].data.id)]);
            upcomingData.items[i].data.is_reminder_set = userData && userData.is_interested ? 1 : 0;
        }
    }

    addExtraData(liveData, staticTabs, items, tabs, 'live', carouselData);
    addExtraData(pastData, staticTabs, items, tabs, 'past', carouselData);
    addExtraData(upcomingData, staticTabs, items, tabs, 'upcoming', carouselData);

    if (items.length && tabs.length) {
        await addViewLikeDuration(db, items);
        rawData.widget_data.tabs = tabs;
        rawData.widget_data.items = items;
        return [rawData];
    }
    return [];
}

// widget 3 fetch live class data and segragate subject wise
async function getLiveClassPastData(db, stClass, locale, versionCode, config, carouselData) {
    const items = [];
    const staticTabs = _.cloneDeep(Data.freeLiveClassTab.subject.staticSubjectTabs);
    const tabs = [];
    const rawData = {
        widget_type: carouselData.carousel_type,
        widget_data: { ...{ title: carouselData.title }, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data },
        layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
    };
    rawData.widget_data.bg_color = null;

    const freeAssortmentList = await CourseContainer.getFreeAssortmentList(db, stClass, null, locale);
    const freeAssortList = getFilterAssortment(freeAssortmentList);

    const data = await CourseContainer.getLiveclassTvCarouselData(db, 'recent_boards', freeAssortList);
    const pastData = await WidgetHelper.homepageVideoWidgetWithAutoplay({
        data, paymentCardState: {}, db, config, title: 'Live classes', locale, versionCode, pageValue: 'LIVECLASS_FREE',
    });

    addExtraData(pastData, staticTabs, items, tabs, null, carouselData);
    if (items.length && tabs.length) {
        await addViewLikeDuration(db, items);
        rawData.widget_data.tabs = tabs;
        rawData.widget_data.items = items;
        return [rawData];
    }
    return [];
}

// widget 4
async function getLiveClassTopSellingSubjectData(db, stClass, locale, carouselData) {
    const subjectAssortData = await CourseMysqlV2.getFreeSubjectsForExplore(db.mysql.read, stClass, locale, carouselData.subject_filter);
    const output = await WidgetHelper.popularSubjectsWidget({
        carouselsData: carouselData, result: subjectAssortData, locale, assortmentPriceMapping: {}, buyWithUpiFlag: {},
    });
    if (_.get(output, 'data.items[0].subject', false)) {
        output.divider_config = Data.freeLiveClassTab[carouselData.carousel_type].divider_config;
        return [output];
    }
    return [];
}

// widget 5
async function getLiveClassRecommendedData(db, stClass, locale, carouselData) {
    const language = (locale && locale === 'hi') ? 'HINDI' : 'ENGLISH';
    const data = await CourseContainer.getLiveClassRecommendedVideoData(db, stClass, language);
    if (data && data.length) {
        const rawData = {
            widget_type: carouselData.carousel_type,
            widget_data: { ...{ title: carouselData.title }, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data },
            divider_config: Data.freeLiveClassTab[carouselData.carousel_type].divider_config,
        };
        await addViewLikeDuration(db, data);
        rawData.widget_data.bg_color = null;
        rawData.widget_data.items = data;
        return [rawData];
    }
    return [];
}

// widget 6
async function getLiveClassTopTeachersData(db, stClass, locale, carouselData, versionCode) {
    const language = (locale && locale === 'hi') ? 'HINDI' : 'ENGLISH';
    let facultyData = [];
    if (carouselData.facultyData) {
        facultyData = carouselData.facultyData;
    } else {
        facultyData = await CourseContainer.getLiveClassTopTeachersData(db, stClass, language) || [];
    }
    const localisedData = _.cloneDeep(Data.freeLiveClassTab.localisedData);

    const promises = [];
    for (let i = 0; i < facultyData.length; i++) {
        promises.push(facultyData[i].faculty_id ? CourseContainer.getLiveClassTeachersLatestVideo(db, facultyData[i].faculty_id) : []);
    }
    const facultyLatestVideo = await Promise.all(promises);
    const dataList = [];
    for (let i = 0; i < facultyLatestVideo.length; i++) {
        if (facultyLatestVideo[i].length && facultyLatestVideo[i][0].faculty_id === facultyData[i].faculty_id) {
            let title = _.startCase(facultyData[i].faculty_name);
            if (facultyData[i].faculty_name) {
                title = _.startCase(facultyData[i].faculty_name);
                title = title.replace('Maam', "Ma'am");
            }
            const obj = {
                bg_color: _.sample(Data.freeLiveClassTab[carouselData.carousel_type].cardBgColor),
                deeplink: +versionCode >= 973 ? `doubtnutapp://teacher_channel?teacher_id=${facultyData[i].faculty_id}&type=internal` : `doubtnutapp://video?qid=${facultyLatestVideo[i][0].resource_reference}&page=LIVECLASS_FREE&playlist_id=null&video_start_position=0`,
                image_url: facultyData[i].image_url,
                title,
                title_text_size: '12',
                title_text_color: '#000000',
                bottom_title_text_size: '12',
                bottom_title_text_color: '#273de9',
                bottom_title: facultyData[i].subject_name_localised,
            };
            if (carouselData.locale === 'hi' && obj.bottom_title) {
                obj.bottom_title = localisedData[facultyData[i].subject_name_localised.toLowerCase()] || facultyData[i].subject_name_localised;
            }
            const bottomItem = [];
            bottomItem.push({ title: carouselData.locale === 'hi' ? 'छात्रों को पढ़ाया' : 'Mentored', title_text_size: '10', title_text_color: '#504e4e' });
            bottomItem.push({ title: facultyData[i].students_mentored ? `${facultyData[i].students_mentored}+` : '---', title_text_size: '10', title_text_color: '#504e4e' });

            bottomItem.push({ title: carouselData.locale === 'hi' ? 'घंटे पढ़ाया' : 'Hours Taught', title_text_size: '10', title_text_color: '#504e4e' });
            bottomItem.push({ title: facultyData[i].experience_in_hours ? `${facultyData[i].experience_in_hours}+` : '---', title_text_size: '10', title_text_color: '#504e4e' });

            obj.items = bottomItem;
            dataList.push(obj);
        }
    }
    if (dataList.length) {
        const teacherData = {
            widget_type: carouselData.carousel_type,
            data: {
                title: carouselData.title,
                title_text_size: '16',
                title_text_color: '#000000',
                items: dataList,
            },
            layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
        };
        return [teacherData];
    }
    return [];
}

// widget 7
async function getLiveClassTopTopicsData(db, stClass, locale, carouselData) {
    const language = (locale && locale === 'hi') ? 'HINDI' : 'ENGLISH';
    const data = await CourseContainer.getLiveClassTopTopicsWidgetData(db, stClass, language);
    if (data && data.length) {
        const rawData = {
            widget_type: carouselData.carousel_type,
            widget_data: { ...{ title: carouselData.title }, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data },
            divider_config: Data.freeLiveClassTab[carouselData.carousel_type].divider_config,
            layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
        };
        rawData.widget_data.bg_color = null;
        rawData.widget_data.items = data;
        return [rawData];
    }
    return [];
}

// widget 8 jee and neet data
async function getLiveClassFreeNeetAndJeeData(db, stClass, locale, versionCode, config, carouselData) {
    const items = []; const tabs = [];
    const staticTabs = { // move this to data file later
        neet: { key: 'neet', title: 'NEET', is_selected: false },
        'iit jee': { key: 'iit jee', title: 'IIT JEE', is_selected: false },
        nda: { key: 'nda', title: 'NDA', is_selected: false },
    };
    const rawData = {
        widget_type: carouselData.carousel_type,
        widget_data: { ...{ title: carouselData.title }, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data },
        layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
    };
    rawData.widget_data.bg_color = '#FEEBE7';

    const [jeeAssortList, neetAssortList, ndaAssortList] = await Promise.all([
        CourseContainer.getFreeAssortmentList(db, stClass, 'IIT JEE', locale),
        CourseContainer.getFreeAssortmentList(db, stClass, 'NEET', locale),
        _.includes([11, 12, 13, 14], +stClass) ? CourseContainer.getFreeAssortmentList(db, stClass, 'NDA', locale) : [],
    ]);

    const jeeFreeAssortList = getFilterAssortment(jeeAssortList);
    const neetFreeAssortList = getFilterAssortment(neetAssortList);
    const ndaFreeAssortList = getFilterAssortment(ndaAssortList);

    const data = await Promise.all([
        CourseContainer.getLiveclassTvCarouselData(db, 'recent_iit_neet', jeeFreeAssortList),
        CourseContainer.getLiveclassTvCarouselData(db, 'recent_iit_neet', neetFreeAssortList),
        CourseContainer.getLiveclassTvCarouselData(db, 'recent_iit_neet', ndaFreeAssortList),
    ]);

    const [jeeData, neetData, ndaData] = await Promise.all([
        data[0].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[0].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Class', locale, versionCode, pageValue: 'camerapage',
        }) : [],
        data[1].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[1].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Class', locale, versionCode, pageValue: 'camerapage',
        }) : [],
        data[1].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[2].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Class', locale, versionCode, pageValue: 'camerapage',
        }) : [],
    ]);
    addExtraData(jeeData, staticTabs, items, tabs, 'iit jee', carouselData);
    addExtraData(neetData, staticTabs, items, tabs, 'neet', carouselData);
    addExtraData(ndaData, staticTabs, items, tabs, 'nda', carouselData);

    if (items.length && tabs.length) {
        await addViewLikeDuration(db, items);
        tabs[0].is_selected = true;
        rawData.widget_data.tabs = tabs;
        rawData.widget_data.items = items;
        return [rawData];
    }
    return [];
}

// widget 9

async function getLiveClassChapterSubjectWiseData(db, stClass, locale, carouselData, versionCode = 0, studentId = 0) {
    let subjList = Data.freeLiveClassTab.subject.subject_order_11_12;
    subjList = _.includes([6, 7, 8, 9, 10], +stClass) ? Data.freeLiveClassTab.subject.subject_order_6_10 : subjList;
    const flagrResp = await freeClassListingPageFlagrResp(versionCode, db, studentId);
    const subjectAssortData = await CourseMysqlV2.getFreeSubjectsForExplore(db.mysql.read, stClass, locale, carouselData.subject_filter) || [];
    const tabData = []; const actionsData = []; const buttonData = {};
    const subjectAssortList = [];
    for (let i = 0; i < subjectAssortData.length; i++) {
        subjectAssortList.push(subjectAssortData[i].assortment_id);
        const subjetLocalised = Data.freeLiveClassTab.localisedData[subjectAssortData[i].display_name.toLowerCase()] || subjectAssortData[i].display_name;
        buttonData[subjectAssortData[i].display_name.toLowerCase()] = {
            group_id: subjectAssortData[i].display_name.toLowerCase(),
            text_one: carouselData.locale === 'hi' ? `देखें ${subjetLocalised} के सभी टॉपिक्स >` : `View all ${subjectAssortData[i].display_name} Topics >`,
            text_one_size: '12',
            text_one_color: '#000000',
            bg_stroke_color: '#d6d6d6',
            deeplink: flagrResp ? `doubtnutapp://course_details?id=${subjectAssortData[i].assortment_id}` : `doubtnutapp://course_detail_info?assortment_id=${subjectAssortData[i].assortment_id}&tab=recent`,
        };
    }

    const data = []; const subjectTabItemsCount = {};
    if (subjectAssortList.length) {
        const videoDataChapterWise = await CourseContainer.getLiveClassVideoDataChapterWise(db, subjectAssortList) || [];
        for (let i = 0; i < videoDataChapterWise.length; i++) {
            const obj = {
                text_one: videoDataChapterWise[i].display,
                group_id: videoDataChapterWise[i].subject.toLowerCase(),
                text_two: videoDataChapterWise[i].expert_name,
                text_three: videoDataChapterWise[i].topic,
                text_four: videoDataChapterWise[i].no_of_lecture ? `${videoDataChapterWise[i].no_of_lecture} Lectures` : null,
                deeplink: flagrResp ? `doubtnutapp://course_details?id=${videoDataChapterWise[i].chapter_assortment_id}` : `doubtnutapp://course_detail_info?assortment_id=${videoDataChapterWise[i].chapter_assortment_id}&tab=recent`,
                bg_color: Data.freeLiveClassTab.subjetColorCode[videoDataChapterWise[i].subject.toLowerCase()] || Data.freeLiveClassTab.subjetColorCode.default,
            };
            const itemsData = { ...obj, ...Data.freeLiveClassTab[carouselData.carousel_type].items_extra_data };
            subjectTabItemsCount[itemsData.group_id] = subjectTabItemsCount[itemsData.group_id] ? subjectTabItemsCount[itemsData.group_id] + 1 : 1;
            if (!subjectTabItemsCount[itemsData.group_id] || subjectTabItemsCount[itemsData.group_id] <= 10) {
                data.push(itemsData);
            }
        }
    }

    for (let i = 0; i < subjList.length; i++) {
        if (subjectTabItemsCount[subjList[i]]) {
            const obj = { key: subjList[i], title: _.startCase(subjList[i].toLowerCase()), is_selected: false };
            obj.title = carouselData.locale === 'hi' && Data.subjectHindi[subjList[i].toUpperCase()] ? Data.subjectHindi[subjList[i].toUpperCase()] : obj.title;
            tabData.push(obj);
            actionsData.push(buttonData[subjList[i]]);
        }
    }

    if (tabData.length && data.length) {
        tabData[0].is_selected = true;
        const output = {
            widget_type: carouselData.carousel_type,
            data: {
                text_one: carouselData.title,
                text_one_size: '16',
                text_one_color: '#000000',
                tabs: tabData,
                items: data,
                actions: actionsData,
            },
            layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
        };
        return [output];
    }
    return [];
}

// widget 10
async function getLiveClassVideoUsingLibrary(db, stClass, studentId, locale, carouselData) {
    const language = (locale && locale === 'hi') ? 'HINDI' : 'ENGLISH';
    const carouselDesc = JSON.parse(carouselData.description) || {};
    if (!carouselData.assortment_list) {
        return [];
    }
    let libraryData = await QuestionContainer.getLibraryVideos(carouselData.data_type, null, [], null, null, null, null, stClass, studentId, carouselData.assortment_list, language, carouselDesc.data_limit || 10, 0, db);
    libraryData = libraryData.map((libraryItem) => {
        libraryItem.image_url = buildStaticCdnUrl(libraryItem.image_url);
        return libraryItem;
    });
    if (libraryData && libraryData.length > 0) {
        const items = libraryData.map((elem) => {
            const mappedObject = {
                title: elem.question,
                subtitle: '',
                show_whatsapp: true,
                show_video: true,
                image_url: elem.image_url,
                card_width: '1.5x', // percentage of screen width
                deeplink: encodeURI(`doubtnutapp://video?qid=${elem.question_id}&page=LIVECLASS_FREE&playlist_id=${carouselData.data_type}`),
                aspect_ratio: '',
                id: elem.question_id,
            };
            return mappedObject;
        });
        if (items.length) { // remove as as we can nullable items from hardcoded response
            const data = {
                widget_type: 'horizontal_list',
                widget_data: {
                    title: carouselData.title,
                    show_view_all: carouselData.show_see_more,
                    deeplink: encodeURI(`doubtnutapp://playlist?playlist_id=${carouselData.assortment_list}&playlist_title=${carouselData.title}&is_last=1`),
                    items,
                    _id: '61b9c496b7c12d341c85888d',
                    sharing_message: 'Dekhiye Doubtnut pe trending content and video solutions! Click karen abhi..',
                },
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: carouselData.carousel_order,
            };
            return [data];
        }
    }
    return [];
}

async function getLiveClassCouponTrialCard(db, studentId, versionCode, studentClass) {
    if (+versionCode <= 975 && +studentClass === 14) {
        return null;
    }

    const [userCategory, userActiveCourses, startTime] = await Promise.all([
        freeLiveClassHelper.getUserEngageCategory(studentId),
        CourseContainer.getUserActivePackages(db, studentId),
        redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, +studentId, 'LIVECLASS_VIDEO_LF_ET_TRIAL_DISCOUNT_CARD'),
    ]);

    const timeStamp = moment().add(5, 'h').add(30, 'minutes').unix();
    let trailCardStatus = true;
    if (startTime && (timeStamp - (+startTime)) > 0) {
        trailCardStatus = false;
    }
    if (trailCardStatus && (!userActiveCourses || !userActiveCourses.length)) {
        const cardData = freeLiveClassHelper.getUserTrailAndDiscountCouponCard(userCategory);
        if (cardData && !startTime) {
            const startCardTime = moment().add(7, 'days').add(5, 'h').add(30, 'minutes')
                .unix();
            redisAnswer.setUserLiveClassWatchedVideo(db.redis.read, +studentId, startCardTime, 'LIVECLASS_VIDEO_LF_ET_TRIAL_DISCOUNT_CARD');
        }
        return cardData;
    }
    return null;
}

// homepage -  live, recommended and past data
async function getLiveRecommendedPastData(db, studentId, stClass, locale, versionCode, config, carouselData, recommendedList) {
    const items = [];
    const staticTabs = { // move this to data file later
        live: { key: 'live', title: 'Live', is_selected: true },
        recommended: { key: 'recommended', title: 'Recommended', is_selected: false },
        past: { key: 'past', title: 'Past', is_selected: false },
    };
    const tabs = [];
    const rawData = {
        id: carouselData.carousel_id,
        tracking_view_id: carouselData.carousel_id,
        widget_type: carouselData.carousel_type,
        widget_data: { id: `${carouselData.carousel_id}`, ...{ title: carouselData.title }, ...Data.freeLiveClassTab[carouselData.carousel_type].widget_extra_data },
        layout_config: Data.freeLiveClassTab[carouselData.carousel_type].layout_config,
    };

    const [freeAssortmentList, assortListWithoutLocale] = await Promise.all([
        CourseContainer.getFreeAssortmentList(db, stClass, null, locale),
        CourseContainer.getFreeAssortmentList(db, stClass, null, null),
    ]);

    const freeAssortList = getFilterAssortment(freeAssortmentList);
    const assortListWithoutLocaleLive = getFilterAssortment(assortListWithoutLocale);
    const data = await Promise.all([
        CourseContainer.getLiveclassTvCarouselData(db, 'live_now', assortListWithoutLocaleLive),
        recommendedList,
        CourseContainer.getLiveclassTvCarouselData(db, 'recent_boards', freeAssortList),
    ]);
    const [facultyPriorityByClass, studentCcmData] = await Promise.all([
        CourseContainer.getFacultyPriorityByClassAndLocale(db, stClass, locale === 'hi' ? 'HINDI' : 'ENGLISH'),
        StudentContainer.getStudentCcmIds(db, studentId),
    ]);
    const facultyCategory = {
        BOARDS: 0,
        'IIT JEE': 0,
        NEET: 0,
        NDA: 0,
    };
    const facultyPriority = {};
    for (let i = 0; i < facultyPriorityByClass.length; i++) {
        facultyPriority[facultyPriorityByClass[i].faculty_id] = facultyPriorityByClass[i].priority;
        facultyCategory[facultyPriorityByClass[i].category] = facultyPriorityByClass[i].category_order;
    }
    if (facultyPriorityByClass.length) {
        for (let i = 0; i < data[0].length; i++) {
            data[0][i].faculty_priority = facultyPriority[data[0][i].faculty_id];
            data[0][i].category_priority = data[0][i].category && data[0][i].category.includes('Board') ? facultyCategory.BOARDS : facultyCategory[data[0][i].category] || 100;
        }
        if (studentCcmData.length > 1) {
            data[0] = _.orderBy(data[0], ['category_priority', 'faculty_priority']);
        } else {
            data[0] = _.orderBy(data[0], 'faculty_priority');
        }
    }

    const [liveData, recommendedData, pastData] = await Promise.all([
        data[0].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[0].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Classes', locale, versionCode,
        }) : [],
        data[1],
        data[2].length ? WidgetHelper.homepageVideoWidgetWithAutoplay({
            data: data[2].slice(0, 10), paymentCardState: {}, db, config, title: 'Live Classes', locale, versionCode,
        }) : [],
    ]);

    addExtraData(liveData, staticTabs, items, tabs, 'live', carouselData);
    addExtraData(recommendedData, staticTabs, items, tabs, 'recommended', carouselData);
    addExtraData(pastData, staticTabs, items, tabs, 'past', carouselData);

    if (items.length && tabs.length) {
        await addViewLikeDuration(db, items);
        rawData.widget_data.tabs = tabs;
        rawData.widget_data.items = items;
        return [rawData];
    }
    return [];
}
module.exports = {
    filterCourseListByDuration,
    getSubjectFilters,
    getNotesFilters,
    getCourseInfo,
    getCaraouselData,
    getProgressCarousel,
    getBannersData,
    generateViewByResourceType,
    checkEmiCounter,
    getCaraouselDataForCoursePage,
    getRecommendedCourses,
    scholarshipLanding,
    getDataByCarouselTypes,
    getCoursesListByIdsForCLP,
    getCategoryIconsForExplorePage,
    generateAssortmentStudentEnrolledMapping,
    getLiveClassFreeData,
    getLiveClassFreeNeetAndJeeData,
    getLiveClassPastData,
    getLiveClassRecommendedData,
    getLiveClassTopSellingSubjectData,
    getLiveClassYouWereWatchingData,
    getLiveClassTopTeachersData,
    getLiveClassTopTopicsData,
    getLiveClassChapterSubjectWiseData,
    getLiveClassVideoUsingLibrary,
    getLiveClassCouponTrialCard,
    addViewLikeDuration,
    getLiveRecommendedPastData,
};
