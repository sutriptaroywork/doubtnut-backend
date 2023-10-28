/* eslint-disable no-shadow */
const _ = require('lodash');
const moment = require('moment');
// const fs = require('fs');
const CourseContainer = require('../../../modules/containers/course');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CourseMysql = require('../../../modules/mysql/course');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const CourseV2Redis = require('../../../modules/redis/coursev2');
const RedisUtils = require('../../../modules/redis/utility.redis');
const CouponMySQL = require('../../../modules/mysql/coupon');
const helper = require('./course.helper');
const SchedulerHelper = require('../../helpers/scheduler');
const CourseHelper = require('../../helpers/course');
const LiveclassHelper = require('../../helpers/liveclass');
const Data = require('../../../data/data');
const LiveClassData = require('../../../data/liveclass.data');
const Utility = require('../../../modules/utility');
const StudentContainer = require('../../../modules/containers/student');
const CouponContainer = require('../../../modules/containers/coupon');
const WidgetHelper = require('../../widgets/liveclass');
// const QuestionContainer = require('../../../modules/containers/question');
const Properties = require('../../../modules/mysql/property');
const AnswerContainerV13 = require('../../v13/answer/answer.container');
// const { updateCountInLeaderboard } = require('../../helpers/paidUserChamionship');
const PaidUserChampionshipMysql = require('../../../modules/mysql/paidUserChampionship');
const PaymentHelper = require('../../helpers/payment');
const redisAnswer = require('../../../modules/redis/answer');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const PznContainer = require('../../../modules/containers/pzn');
const freeLiveClassHelper = require('../../helpers/freeLiveClass');
const bl = require('../../v2/camera/camera.bl');
const CameraHelper = require('../../helpers/camera');
const SortingManager = require('../../helpers/sorting.helper');
const iconsContainer = require('../../../modules/containers/icons');
const config = require('../../../config/config');
const IconsHelper = require('../../helpers/icons');
const StudentRedis = require('../../../modules/redis/student');
const D0UserManager = require('../../helpers/d0User.helper');
const CampaignMysql = require('../../../modules/mysql/campaign');
const microservice = require('../../../modules/microservice');

async function get(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let ecmId = req.query.ecm_id;
        const { page } = req.query;
        req.user.locale = 'hi';
        const { locale } = req.user;
        const { student_class } = req.query;
        const studentClass = (typeof student_class === 'undefined') ? req.user.student_class : student_class;
        const studentId = req.user.student_id;
        const limit = 10;
        let isVip = false;
        let ecmListData = [];
        ecmListData = await CourseMysql.getEcmListData(db.mysql.read, studentClass);
        // get class list for etoos course
        if ((page == 1 && _.isEmpty(ecmId)) || _.isEmpty(ecmId)) {
            ecmId = ecmListData[0].filter_id;
        }
        const promise = [];
        promise.push(CourseContainer.getCaraousels(db, ecmId, locale, page, limit, studentClass));
        promise.push(CourseMysql.checkVipWithExpiry(db.mysql.read, studentId));
        const result = await Promise.all(promise);
        const [caraouselList, userSubscriptionData] = result;
        const topHeaderMessage = helper.getTopHeaderMessages(moment, userSubscriptionData);
        isVip = topHeaderMessage.isVip;
        const caraouselData = await helper.getCaraouselData({
            db,
            caraouselList,
            ecmId,
            config,
            whatsappShareMessage: Data.whatsappShareMessage,
            next,
            isVip,
            studentClass,
        });
        const topMessageWidget = {
            type: 'header_message',
            data: {
                text: topHeaderMessage.message.text,
                button_text: topHeaderMessage.message.button_text,
            },
        };
        const courseButtonTabs = {
            type: 'filter_tabs',
            data: {
                tabs: ecmListData,
            },
        };
        const data = {};
        const meta = [];
        if (page == 1) {
            meta.push(topMessageWidget);
            meta.push(courseButtonTabs);
        }
        data.widgets = [...meta, ...caraouselData];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

async function getAssortmentCarousel(activePackages, studentID, db, config, batchID) {
    const items = [];
    const progress = [];
    const promise = [];
    for (let i = 0; i < activePackages.length; i++) {
        progress.push(CourseV2Mysql.getStudentAssortmentProgress(db.mysql.read, studentID, activePackages[i].assortment_id));
        if (activePackages[i].assortment_type === 'resource_video') {
            promise.push([{ count: 1, assortment_type: 'resource_video' }]);
        }
        if (activePackages[i].assortment_type === 'resource_pdf') {
            promise.push([{ count: 1, assortment_type: 'resource_pdf' }]);
        }
        if (activePackages[i].assortment_type === 'resource_test') {
            promise.push([{ count: 1, assortment_type: 'resource_test' }]);
        }
        if (activePackages[i].assortment_type === 'chapter') {
            promise.push(CourseContainerv2.getResourcesCountFromChapterAssortment(db, activePackages[i].assortment_id, batchID));
        }
        if (activePackages[i].assortment_type === 'subject') {
            promise.push(CourseContainerv2.getResourcesCountFromSubjectAssortment(db, activePackages[i].assortment_id, batchID));
        }
        if (activePackages[i].assortment_type === 'course') {
            promise.push(CourseContainerv2.getResourcesCountFromCourseAssortment(db, activePackages[i].assortment_id, batchID));
        }
        if (activePackages[i].assortment_type === 'class') {
            promise.push(CourseContainerv2.getResourcesCountFromCourseAssortment(db, activePackages[i].assortment_id, batchID));
        }
    }
    const resourceCount = await Promise.all(promise);
    const progressDetails = await Promise.all(progress);
    let totalVideos = 0;
    let totalPdf = 0;
    let totalTest = 0;
    let userResources = 0;
    for (let i = 0; i < activePackages.length; i++) {
        let assortmentResources = 0;
        const detail = {};
        let videoCount = resourceCount[i].filter((e) => e.assortment_type === 'resource_video');
        const pdfCount = resourceCount[i].filter((e) => e.assortment_type === 'resource_pdf');
        const testCount = resourceCount[i].filter((e) => e.assortment_type === 'resource_test');
        if (!testCount.length && !pdfCount.length && !videoCount.length && resourceCount[i].length) {
            videoCount = resourceCount[i];
        }
        detail.top_title = `Purchased On ${moment(activePackages[i].purchase_date).format('Do MMM')}`;
        detail.title = activePackages[i].name;
        detail.deeplink = `doubtnutapp://course_details?id=${activePackages[i].assortment_id}`;
        if (activePackages[i].assortment_id === 138829) {
            detail.deeplink = 'doubtnutapp://course_category?category_id=Kota%20Classes';
        }
        detail.resources = [];
        if (videoCount[0]) {
            totalVideos += videoCount[0].count;
            assortmentResources += videoCount[0].count;
            detail.resources.push({
                count: videoCount[0].count,
                icon_url: LiveClassData.videoIconUrl(1, config),
                text: 'Videos',
                text_color: '#a8b3ba',
            });
        }
        if (pdfCount[0]) {
            totalPdf += pdfCount[0].count;
            assortmentResources += pdfCount[0].count;
            detail.resources.push({
                count: pdfCount[0].count,
                icon_url: LiveClassData.pdfIconUrl(1, config),
                text: 'PDF',
                text_color: '#a8b3ba',
            });
        }
        if (testCount[0]) {
            totalTest += testCount[0].count;
            assortmentResources += testCount[0].count;
            detail.resources.push({
                count: testCount[0].count,
                icon_url: LiveClassData.testIconUrl(1, config),
                text: 'Test',
                text_color: '#a8b3ba',
            });
        }
        detail.text_color = '#000000';
        detail.background_image_url = LiveClassData.purchasePlansBg(0, config);
        detail.total = 0;
        if (progressDetails[i] && progressDetails[i][0] && assortmentResources) {
            detail.total = Math.round((progressDetails[i][0].total_count / assortmentResources) * 100);
            userResources += progressDetails[i][0].total_count;
        }
        items.push(detail);
    }

    const allPurchases = {
        top_title: `Updated On ${moment(activePackages[activePackages.length - 1].purchase_date).format('Do MMM')}`,
        title: 'MY PURCHASED CLASSES',
        text_color: '#ffffff',
        deeplink: '',
        resources: [],
        background_image_url: LiveClassData.purchasePlansBg(1, config),
        total: Math.round((userResources / (totalVideos + totalPdf + totalTest)) * 100),
    };

    if (totalVideos > 0) {
        allPurchases.resources.push({
            count: totalVideos,
            icon_url: LiveClassData.videoIconUrl(0, config),
            text: 'Videos',
            text_color: '#ffffff',
        });
    }

    if (totalPdf > 0) {
        allPurchases.resources.push({
            count: totalPdf,
            icon_url: LiveClassData.pdfIconUrl(0, config),
            text: 'PDF',
            text_color: '#ffffff',
        });
    }

    if (totalTest > 0) {
        allPurchases.resources.push({
            count: totalTest,
            icon_url: LiveClassData.testIconUrl(0, config),
            text: 'Test',
            text_color: '#ffffff',
        });
    }

    items.unshift(allPurchases);

    const obj = {
        type: 'vip-content',
        data: {
            items,
        },
    };
    return obj;
}

async function timeTable(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        const { student_class } = req.query;
        const studentClass = (typeof student_class === 'undefined') ? req.user.student_class : student_class;
        const { monthArr } = LiveClassData;
        const { week } = LiveClassData;
        let next = (typeof req.query.next !== 'undefined') ? parseInt(req.query.next) : 0;
        let prev = (typeof req.query.previous !== 'undefined') ? parseInt(req.query.previous) : 0;
        const currentDate = moment().add(5, 'hours').add(30, 'minutes').add(next, 'month')
            .subtract(prev, 'month');
        const monthStart = moment(currentDate).startOf('month');
        const endDate = moment(monthStart).add(2, 'month').subtract(1, 'day').endOf('day')
            .format('YYYY-MM-DD HH:mm:ss');
        const startDate = monthStart.startOf('day').format('YYYY-MM-DD HH:mm:ss');
        // get user's active packages
        const activePackages = await CourseV2Mysql.getUserActivePackagesWithAssortment(db.mysql.read, studentID, studentClass);
        let widgets = [];
        const batchID = activePackages.length ? activePackages[0].batch_id : 1;
        if (activePackages.length) {
            const assortmentList = activePackages.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
            const assortmentCarousel = await getAssortmentCarousel(activePackages, studentID, db, config, batchID);
            widgets.push(assortmentCarousel);
            const assortmentListMicro = [];
            activePackages.forEach((obj) => {
                assortmentListMicro.push({
                    assortment_id: obj.assortment_id,
                    batch_id: obj.batch_id,
                });
            });
            let resourceList = [];
            // if (studentID % 10 >= 5) {
            // resourceList = await CourseHelper.getResourcesByAssortmentList(db, assortmentList, startDate, endDate, 0, batchID);

            // fs.writeFileSync('./resourceList.json', JSON.stringify(resourceList));
            // } else {
            resourceList = (await microservice.requestMicroServerWithoutAuthToken('/liveclass-course/get-resources-by-assortment-list', {
                assortment_list: assortmentListMicro,
                start_date: moment(startDate).unix(),
                end_date: moment(endDate).unix(),
            }, null, 2500)).data;
            // fs.writeFileSync('./resourceListnew.json', JSON.stringify(resourceList));
            // }

            const resourcesWidgets = CourseHelper.getTimetableData(db, config, resourceList);
            widgets = [...widgets, ...resourcesWidgets];

            let prevData; let nextData;

            // if (studentID % 10 >= 5) {
            //     [prevData, nextData] = await Promise.all([
            //         CourseV2Mysql.getPastData(db.mysql.read, assortmentList, startDate),
            //         CourseV2Mysql.getFutureData(db.mysql.read, assortmentList, endDate),
            //     ]);
            // } else {
            // fs.writeFileSync('./prevData.json', JSON.stringify(prevData));
            // fs.writeFileSync('./nextData.json', JSON.stringify(nextData));
            [prevData, nextData] = await Promise.all([
                microservice.requestMicroServerWithoutAuthToken('/liveclass-course/get-past-data', {
                    assortment_list: assortmentList,
                    start_date: moment(startDate).unix(),
                }, null, 2500),
                microservice.requestMicroServerWithoutAuthToken('/liveclass-course/get-future-data', {
                    assortment_list: assortmentList,
                    end_date: moment(endDate).unix(),
                }, null, 2500),
            ]);
            prevData = prevData.data;
            nextData = nextData.data;
            // fs.writeFileSync('./prevDataNew.json', JSON.stringify(prevData));
            // fs.writeFileSync('./nextDataNew.json', JSON.stringify(nextData));
            // }

            prev = prev === 0 ? '2' : `${prev + 2}`;
            next = next === 0 ? '2' : `${next + 2}`;
            if (!prevData.length) {
                prev = null;
            }
            if (!nextData.length) {
                next = null;
            }
        } else {
            prev = null;
            next = null;
        }

        const cursor = {
            prev,
            next,
        };
        const today = {
            tag: `${monthArr[new Date().getMonth()]}`,
            day: `${week[new Date().getDay()]}`,
            date: `${new Date().getDate()}`,
        };
        let no_time_table;
        if (widgets.length === 0) {
            no_time_table = {
                image_url: `${config.staticCDN}engagement_framework/A14BDEF4-CA80-6316-2087-89A7B69B3475.webp`,
                title: 'No Timetable Found',
                sub_title: 'Lagta hai aapne abhi koi VIP course nahi liya. Doubtnut ki VIP duniya me shaamil ho',
                button_text: 'Explore Courses',
                deeplink: 'doubtnutapp://course_category?category_id=xxxx&title=Apke liye Courses',
            };
            if (activePackages.length) {
                no_time_table = {
                    image_url: `${config.staticCDN}engagement_framework/A14BDEF4-CA80-6316-2087-89A7B69B3475.webp`,
                    title: 'No Timetable Found',
                    sub_title: 'Aapke Timetable me koi classes nahi hai. Apni recorded VIP classes My Plans section me dekhiye.',
                    button_text: 'Check Your Plan',
                    deeplink: 'doubtnutapp://my_plan',
                };
            }
            widgets.push({
                type: 'schedule_no_data',
                data: {
                    id: '2',
                    title: `No classes from ${moment(startDate).format('Do MMM')} - ${moment(endDate).format('DD MMM')}`,
                    tag: `${monthArr[new Date(currentDate).getMonth()]}`,
                },
            });
        } else {
            no_time_table = null;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                no_time_table,
                widgets,
                cursor,
                today,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        next({ err });
    }
}

async function pdfDownload(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID } = req.user;
        const { resource_id: resourceId } = req.query;
        const { student_class } = req.query;
        const studentClass = (typeof student_class === 'undefined') ? req.user.student_class : student_class;
        let [
            resourceDetails,
            // eslint-disable-next-line prefer-const
            activePackages,
        ] = await Promise.all([
            CourseV2Mysql.getParentAssortmentByResourceList(db.mysql.read, [resourceId]),
            CourseV2Mysql.getUserActivePackages(db.mysql.read, studentID),
        ]);
        const subscribedPackages = [];
        let isTeacherPdf = false;
        if (!_.isEmpty(resourceDetails) && resourceDetails[0].assortment_id) {
            const parentAssortments = await CourseHelper.getParentAssortmentListV1(db, [resourceDetails[0].assortment_id], studentClass);
            for (let i = 0; i < activePackages.length; i++) {
                const assortment = parentAssortments.filter((e) => e.assortment_id == activePackages[i].assortment_id);
                if (assortment && assortment.length) {
                    subscribedPackages.push(activePackages[i].assortment_id);
                }
            }
            StudentRedis.setUserFreePdfAccessedCount(db.redis.write, studentID);
        }
        if (_.isEmpty(resourceDetails)) {
            resourceDetails = await CourseV2Mysql.getPdfDetailById(db.mysql.read, resourceId);
            isTeacherPdf = true;
        }
        const pdfStats = await CourseV2Mysql.getPdfDownloadStats(db.mysql.read, studentID, resourceId);
        if (!pdfStats.length) {
            const insertObj = {
                student_id: studentID,
                resource_id: resourceId,
                resource_reference: resourceDetails[0].resource_reference,
                is_view: 1,
                is_download: 1,
            };

            await CourseV2Mysql.addPdfDownloadStats(db.mysql.write, insertObj);
            if (subscribedPackages.length) {
                for (let i = 0; i < subscribedPackages.length; i++) {
                    // eslint-disable-next-line no-await-in-loop
                    const progressDetails = await CourseV2Mysql.getUserProgress(db.mysql.write, studentID, subscribedPackages[i]);
                    if (progressDetails.length) {
                        CourseV2Mysql.updatePdfCount(db.mysql.write, studentID, subscribedPackages[i]);
                    } else {
                        const obj = {
                            student_id: studentID,
                            package_id: activePackages.filter((e) => e.assortment_id == subscribedPackages[i])[0].new_package_id,
                            assortment_id: subscribedPackages[i],
                            pdf_count: 1,
                            videos_count: 0,
                            test_count: 0,
                            total_count: 1,
                        };
                        CourseV2Mysql.setPdfCount(db.mysql.write, obj);
                    }
                    // eslint-disable-next-line no-await-in-loop
                    let liveAtTime = await PaidUserChampionshipMysql.getLiveAtFromResourceId(db.mysql.read, resourceId);
                    liveAtTime = liveAtTime[0].live_at;
                    // updateCountInLeaderboard(db, 'pdf_downloaded', 1, studentID, subscribedPackages[i], liveAtTime);
                }
            }
        } else if (isTeacherPdf && !_.isEmpty(pdfStats)) {
            const count = parseInt(pdfStats[0].count) + 1;
            await CourseV2Mysql.updatePdfDownloadStats(db.mysql.write, studentID, resourceId, count);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
const numberMap = {
    opt_1: '1',
    opt_2: '2',
    opt_3: '3',
    opt_4: '4',
};

const stringMap = {
    opt_1: 'A',
    opt_2: 'B',
    opt_3: 'C',
    opt_4: 'D',
};

const lowercaseStringMap = {
    opt_1: 'a',
    opt_2: 'b',
    opt_3: 'c',
    opt_4: 'd',
};

async function homeworkGet(req, res, next) {
    try {
        const db = req.app.get('db');
        // const config = req.app.get('config');
        const { locale } = req.user;
        const { question_id: questionID } = req.query;
        const data = {};
        // get homework details
        // const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionID(db, questionID);
        const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionIDNew(db, questionID);
        if (homeworkDetails.length > 0 && !_.isNull(homeworkDetails[0].question_list)) {
            data.header = {};
            data.header.title1 = homeworkDetails[0].display;
            data.header.title2 = `By ${homeworkDetails[0].expert_name}`;
            // homework questions detail
            const questionDetails = await CourseContainerv2.getHomeworkQuestionDetails(db, homeworkDetails[0].question_list);
            data.header.question_count_text = (locale === 'hi') ? `${questionDetails.length} प्रश्न` : `${questionDetails.length} Questions`;
            data.list = [];
            for (let i = 0; i < questionDetails.length; i++) {
                const obj = {};
                obj.question = LiveclassHelper.quotesEscape(questionDetails[i].ocr_text);
                obj.question_no_text = (locale === 'hi') ? `प्रश्न ${i + 1}` : `Question ${i + 1}`;
                obj.solution_text = (locale === 'hi') ? 'हल देखें' : 'View Solution';
                obj.quiz_question_id = questionDetails[i].question_id;
                obj.solution_deeplink = (questionDetails[i].is_answered == 0 && questionDetails[i].is_text_answered == 1) ? `doubtnutapp://video?qid=${questionDetails[i].question_id}&page=HOMEWORK_SOLUTION&resource_type=text` : `doubtnutapp://video?qid=${questionDetails[i].question_id}&page=HOMEWORK_SOLUTION`;
                let opt1Key = LiveclassHelper.handleOptions(stringMap.opt_1);
                let opt2Key = LiveclassHelper.handleOptions(stringMap.opt_2);
                let opt3Key = LiveclassHelper.handleOptions(stringMap.opt_3);
                let opt4Key = LiveclassHelper.handleOptions(stringMap.opt_4);
                obj.type = (!_.isNull(questionDetails[i].answer) && !_.isEmpty(questionDetails[i].answer) && questionDetails[i].answer.includes(':') && !_.isEmpty(questionDetails[i].opt_1) && !_.isEmpty(questionDetails[i].opt_2) && !_.isEmpty(questionDetails[i].opt_3) && !_.isEmpty(questionDetails[i].opt_4)) ? 1 : 0;
                obj.options = [];
                // check if question subjective type or not
                if (_.isEmpty(questionDetails[i].opt_1) || (_.isEmpty(questionDetails[i].answer) && questionDetails[i].is_answered === 1)) {
                    obj.options.push({ key: opt1Key, value: 'Attempted/ Ho Gaya' });
                    obj.options.push({ key: opt2Key, value: 'Not Attempted/ Nahin Hua' });
                } else {
                    if (!_.isNull(questionDetails[i].answer) && !_.isEmpty(questionDetails[i].answer)) {
                        // check for numeric
                        if (/\d/g.test(questionDetails[i].answer.trim())) {
                            opt1Key = LiveclassHelper.handleOptions(numberMap.opt_1);
                            opt2Key = LiveclassHelper.handleOptions(numberMap.opt_2);
                            opt3Key = LiveclassHelper.handleOptions(numberMap.opt_3);
                            opt4Key = LiveclassHelper.handleOptions(numberMap.opt_4);
                        }
                        // check for lower case
                        if (!/[A-Z]|[\u0080-\u024F]/.test(questionDetails[i].answer.trim())) {
                            opt1Key = LiveclassHelper.handleOptions(lowercaseStringMap.opt_1);
                            opt2Key = LiveclassHelper.handleOptions(lowercaseStringMap.opt_2);
                            opt3Key = LiveclassHelper.handleOptions(lowercaseStringMap.opt_3);
                            opt4Key = LiveclassHelper.handleOptions(lowercaseStringMap.opt_4);
                        }
                    }

                    obj.options.push({ key: opt1Key, value: LiveclassHelper.handleOptions(questionDetails[i].opt_1) });
                    obj.options.push({ key: opt2Key, value: LiveclassHelper.handleOptions(questionDetails[i].opt_2) });
                    obj.options.push({ key: opt3Key, value: LiveclassHelper.handleOptions(questionDetails[i].opt_3) });
                    obj.options.push({ key: opt4Key, value: LiveclassHelper.handleOptions(questionDetails[i].opt_4) });
                }
                data.list.push(obj);
            }
            data.button = {
                title: (locale === 'hi') ? 'होमवर्क जमा करें' : 'Submit Homework',
            };
            // data.pdf_download_url = homeworkDetails[0].pdf_url;
            data.pdf_download_url = `${config.staticCDN}pdf_open/${homeworkDetails[0].pdf_url}`;
            data.share_message = (locale === 'hi') ? 'हेलो दोस्त ! डाउटनट का यह होमवर्क मेरे लिए काफ़ी उपयोगी रहा | आप भी ऐसे ही डेली होमवर्क पाने के लिए डाउटनट पर कोर्स खरीदें !' : 'Hello friend! Sharing this homework from Doubtnut app which has been very helpful for me! Become a VIP member on Doubtnut to access Homeworks daily!';
            data.subject = homeworkDetails[0].subject ? homeworkDetails[0].subject : '';
            if (locale === 'hi' && data.subject !== '') {
                data.subject = Data.subjectHindi[data.subject.toUpperCase()] || data.subject;
            }
            data.chapter = homeworkDetails[0].chapter ? homeworkDetails[0].chapter : '';
            data.completion_status = LiveClassData.pendingText(locale);
            data.completion_status_url = '';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function homeworkReview(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;
        const { question_id: questionID } = req.query;
        const data = {};
        // const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionID(db, questionID);
        const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionIDNew(db, questionID);
        if (homeworkDetails.length > 0 && !_.isNull(homeworkDetails[0].question_list)) {
            const questionDetails = await CourseContainerv2.getHomeworkQuestionDetails(db, homeworkDetails[0].question_list);
            data.header = {};
            data.header.title1 = homeworkDetails[0].display;
            data.header.title2 = `By ${homeworkDetails[0].expert_name}`;
            // homework response
            const response = await CourseV2Mysql.getHomeworkResponse(db.mysql.read, questionID, studentID);
            let groupedByQuizQuestionID = {};
            data.summary = [{
                text: 'Correct',
                count: 0,
                color: '#228B22',
            }, {
                text: 'Incorrect',
                count: 0,
                color: '#FF6347',
            }, {
                text: 'Skipped',
                count: questionDetails.length,
                color: '#696969',
            }];
            if (response.length > 0) {
                groupedByQuizQuestionID = _.groupBy(response, 'quiz_question_id');
                const groupedByIsCorrect = _.groupBy(response, 'is_correct');
                data.summary = [{
                    text: 'Correct',
                    count: (typeof groupedByIsCorrect['1'] !== 'undefined') ? groupedByIsCorrect['1'].length : 0,
                    color: '#228B22',
                }, {
                    text: 'Incorrect',
                    count: (typeof groupedByIsCorrect['0'] !== 'undefined') ? groupedByIsCorrect['0'].length : 0,
                    color: '#FF6347',
                }, {
                    text: 'Skipped',
                    count: questionDetails.length - response.length,
                    color: '#696969',
                }];
            }
            data.solutions = [];
            data.questions = [];
            data.detailed_summary = questionDetails.map((item, index) => {
                const obj = {};
                obj.question_no = index + 1;
                obj.correct = false;
                obj.incorrect = false;
                obj.skipped = true;
                obj.color = '#696969';
                const options = [];
                if (item.opt_1 !== '') {
                    options.push({
                        key: 'A',
                        value: item.opt_1,
                        color: '#696969',
                    });
                    if (item.opt_2 !== '') {
                        options.push({
                            key: 'B',
                            value: item.opt_2,
                            color: '#696969',
                        });
                    }
                    if (item.opt_3 !== '') {
                        options.push({
                            key: 'C',
                            value: item.opt_3,
                            color: '#696969',
                        });
                    }
                    if (item.opt_4 !== '') {
                        options.push({
                            key: 'D',
                            value: item.opt_4,
                            color: '#696969',
                        });
                    }
                    if (item.answer && options[item.answer.charCodeAt(0) - 65]) {
                        options[item.answer.charCodeAt(0) - 65].color = '#228B22';
                    }
                } else {
                    options.push({
                        key: 'A',
                        value: 'Attempt Ho Gaya',
                        color: !obj.option_id ? '#228B22' : '#696969',
                    });
                    options.push({
                        key: 'B',
                        value: 'Attempt Nahi Hua',
                        color: '#696969',
                    });
                }
                if (typeof groupedByQuizQuestionID[item.question_id] !== 'undefined') {
                    obj.skipped = false;
                    obj.option_id = groupedByQuizQuestionID[item.question_id][0].option_id;
                    if (groupedByQuizQuestionID[item.question_id][0].is_correct === 1) {
                        obj.correct = true;
                        obj.color = '#228B22';
                    }
                    if (groupedByQuizQuestionID[item.question_id][0].is_correct === 0) {
                        obj.incorrect = true;
                        obj.color = '#FF6347';
                        const submittedAnswer = groupedByQuizQuestionID[item.question_id][0].option_id;
                        if (submittedAnswer && submittedAnswer !== '0' && options[submittedAnswer.charCodeAt(0) - 65]) {
                            options[submittedAnswer.charCodeAt(0) - 65].color = '#FF6347';
                        }
                    }
                }
                // push solution incase of skipped and incorrect
                if (item.is_answered || item.is_text_answered) {
                    data.solutions.push({
                        title: (locale === 'hi') ? `प्रश्न ${index + 1}` : `Question ${index + 1}`,
                        question_id: item.question_id,
                        image_url: (locale === 'hi' && !_.isNull(item.hindi)) ? `${config.cdn_url}q-thumbnail/hi_${item.question_id}.webp` : `${config.cdn_url}q-thumbnail/${item.question_id}.webp`,
                        ocr_text: item.ocr_text,
                        deeplink: (item.is_answered == 0 && item.is_text_answered == 1) ? `doubtnutapp://video?qid=${item.question_id}&page=HOMEWORK_SOLUTION&resource_type=text` : `doubtnutapp://video?qid=${item.question_id}&page=HOMEWORK_SOLUTION`,
                        type: (item.is_answered == 0 && item.is_text_answered == 1) ? 'text' : 'video',
                        duration: _.isNull(item.duration) ? 0 : item.duration,
                        locale: (locale === 'hi' && !_.isNull(item.hindi)) ? 'Hindi' : 'English',
                        asked: '216+ asked',
                    });
                }
                data.questions.push({
                    question: item.ocr_text,
                    question_no_text: (locale === 'hi') ? `प्रश्न ${index + 1}` : `Question ${index + 1}`,
                    quiz_question_id: item.question_id,
                    solution_question_id: item.question_id,
                    type: '0',
                    solution_deeplink: (item.is_answered == 0 && item.is_text_answered == 1) ? `doubtnutapp://video?qid=${item.question_id}&page=HOMEWORK_SOLUTION&resource_type=text` : `doubtnutapp://video?qid=${item.question_id}&page=HOMEWORK_SOLUTION`,
                    solution_text: null,
                    answer: item.answer,
                    submitted_option: item.answer,
                    is_result: true,
                    video_text: 'View Solution',
                    video_deeplink: (item.is_answered == 0 && item.is_text_answered == 1) ? `doubtnutapp://video?qid=${item.question_id}&page=HOMEWORK_SOLUTION&resource_type=text` : `doubtnutapp://video?qid=${item.question_id}&page=HOMEWORK_SOLUTION`,
                    options,
                    message: 'successful',
                });
                return obj;
            });
            data.pdf_download_url = homeworkDetails[0].pdf_url;
            data.share_message = (locale === 'hi') ? 'हेलो दोस्त ! डाउटनट का यह होमवर्क मेरे लिए काफ़ी उपयोगी रहा | आप भी ऐसे ही डेली होमवर्क पाने के लिए डाउटनट पर कोर्स खरीदें !' : 'Hello friend! Sharing this homework from Doubtnut app which has been very helpful for me! Become a VIP member on Doubtnut to access Homeworks daily!';
            data.subject = homeworkDetails[0].subject ? homeworkDetails[0].subject : '';
            if (locale === 'hi' && data.subject !== '') {
                data.subject = Data.subjectHindi[data.subject.toUpperCase()] || data.subject;
            }
            data.chapter = homeworkDetails[0].chapter ? homeworkDetails[0].chapter : '';
            data.completion_status = LiveClassData.completedText(locale);
            data.completion_status_url = '';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getClassesOfChapterByQuestionID(db, config, locale, versionCode, questionID, subscriptionDetails, studentID) {
    const widgets = [];
    let isOnlyOneVideoPresent = false;
    // * Get related classes of current chapter
    const {
        result, topic, subjectAssortmentID, batchID,
    } = await CourseHelper.getLectureSeriesByQuestionID(db, questionID, subscriptionDetails, studentID);
    if (result.length) {
        const nextQuestionID = await CourseHelper.getNextChapterQuestionID(db, subjectAssortmentID, topic);
        if (result.length <= 1 && !nextQuestionID) {
            isOnlyOneVideoPresent = true;
        }
        const carousel = {
            carousel_type: 'widget_parent',
            title: locale === 'hi' ? 'इस अध्याय के अन्य क्लासेस' : 'More classes in this chapter',
        };
        const widget = await WidgetHelper.generateRelatedClassesCarousel({
            db,
            locale,
            config,
            carousel,
            result,
            questionID: nextQuestionID,
        });
        if (widget && widget.data && widget.data.items) {
            widget.data.items = widget.data.items.map((item, index) => {
                if (item.data && +item.data.id === +questionID) {
                    item.data.top_title = locale === 'hi' ? 'आप देख रहे हैं' : 'Currently watching';
                } else if (item.data) {
                    item.data.top_title = `Lecture #${index + 1}`;
                }
                return item;
            });
            widgets.unshift(widget);
        }
        const titleWidget = versionCode >= 881 ? {
            type: 'text_widget',
            data: {
                title: `${result[0].subject} - ${result[0].topic}`,
                isBold: true,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
            },
        } : {
            type: 'widget_parent',
            data: {
                title: `${result[0].subject} - ${result[0].topic}`,
                is_title_bold: true,
                items: [],
            },
        };
        widgets.unshift(titleWidget);
    }

    return {
        widgets,
        batchID,
        isOnlyOneVideoPresent,
    };
}

async function homeworkWidgets(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const { student_id: studentID = 0, locale = 'en', student_class: userStudentClass = 12 } = req.user || {};
        const { question_id: questionID, page } = req.query;
        const { version_code: versionCode, 'x-auth-token': xAuthToken, is_browser: isBrowser } = req.headers;
        let { student_class: studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? userStudentClass : studentClass;
        const widgets = [];
        let variantInfo = [];
        let batchID = 1;
        if (page === 'liveclass_video' || page === 'homepage') {
            const coursePage = page === 'liveclass_video' ? 'VIDEO_PAGE' : 'HOMEPAGE_V1';
            let paidCoursesData; let title;
            // * New widget type will be always true on homepage
            const newWidgetType = true;
            // * Fetch user active packages by class
            const studentSubscriptionDetails = await CourseContainerv2.getUserActivePackages(db, studentID);
            // * Filter out course or class assortment from (studentSubscriptionDetails) object array for my_courses carousel on home page
            const studentCourseOrClassSubcriptionDetails = studentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.amount !== -1);
            if (studentCourseOrClassSubcriptionDetails.length) {
                paidCoursesData = await CourseHelper.getUserCoursesCarousel({
                    db,
                    studentId: studentID,
                    studentClass,
                    studentLocale: locale,
                    studentCourseOrClassSubcriptionDetails,
                    xAuthToken,
                    versionCode,
                    config,
                    setWidth: true,
                    coursePage,
                });
                title = locale === 'hi' ? 'मेरे कोर्स' : 'My Courses';
            } else {
                paidCoursesData = await CourseHelper.getPaidAssortmentsData({
                    db,
                    studentClass,
                    config,
                    versionCode,
                    studentId: studentID,
                    studentLocale: locale,
                    xAuthToken: req.headers['x-auth-token'],
                    page: coursePage,
                    eventPage: '',
                    questionID,
                    pznElasticSearchInstance,
                });
                if (paidCoursesData) {
                    variantInfo = [...variantInfo, ...paidCoursesData.variantInfo];
                    title = locale === 'hi' ? 'पूरा कोर्स देखें' : 'Pura Course Dekhe';
                    if (paidCoursesData.carouselTitle) {
                        title = paidCoursesData.carouselTitle;
                    }
                    paidCoursesData = paidCoursesData.items;
                }
            }
            if (versionCode >= 884 && page === 'liveclass_video' && !isBrowser) {
                const myClassesWidgetObj = await getClassesOfChapterByQuestionID(db, config, locale, versionCode, questionID, studentCourseOrClassSubcriptionDetails, studentID);
                batchID = myClassesWidgetObj.batchID || batchID;
                if (!myClassesWidgetObj.isOnlyOneVideoPresent) {
                    widgets.unshift(...myClassesWidgetObj.widgets);
                } else {
                    widgets.unshift(myClassesWidgetObj.widgets[0]);
                }
            }
            if (paidCoursesData && paidCoursesData.length) {
                const courseWidget = {
                    type: 'widget_parent',
                    data: {
                        title,
                        items: paidCoursesData,
                    },
                };
                if (page === 'homepage' && versionCode > 872 && newWidgetType && +studentClass !== 14) {
                    courseWidget.extra_params = {
                        be_source: 'HOMEPAGE',
                        widget_type: 'widget_popular_course',
                    };
                    courseWidget.data.background_color = '#ffdbdb';
                    courseWidget.type = 'widget_popular_course';
                    widgets.push(courseWidget);
                } else if (page !== 'homepage' && !studentCourseOrClassSubcriptionDetails.length) {
                    widgets.push(courseWidget);
                }
            }
            if (page === 'homepage') {
                widgets.push({
                    type: 'widget_ask_doubt',
                    data: {},
                    layout_config: {
                        margin_top: 0,
                        margin_left: 0,
                        margin_right: 0,
                        margin_bottom: 0,
                    },
                });
            }
        }
        if (page === 'liveclass_video') {
            let isSubmitted = 0;

            // const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionID(db, questionID);
            const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionIDNew(db, questionID);
            // homeworkDetails = homeworkDetails.filter((item) => item.batch_id === batchID);
            // check if homework exists or not
            const results = await CourseV2Mysql.getHomeworkResponse(db.mysql.read, questionID, studentID);
            if (results.length > 0) {
                isSubmitted = 1;
            }
            if (homeworkDetails.length > 0) {
                widgets.push(await CourseHelper.generateHomeworkTriggerWidget(db, isSubmitted, homeworkDetails[0].display, homeworkDetails[0].pdf_url, questionID, locale, config, isBrowser));
            }

            // generate notes widget
            // get chapter name of resource
            const notesWidget = await CourseHelper.getNotesWidget(db, questionID, isBrowser, batchID);
            if (!_.isEmpty(notesWidget)) {
                if (versionCode >= 884) {
                    notesWidget.data.title = locale === 'hi' ? 'नोट्स' : 'Notes';
                }
                widgets.push(notesWidget);
            }
        }
        if (isBrowser) {
            const isLiveClassVideo = await CourseContainerv2.getAssortmentsByResourceReferenceV1(db, questionID);
            const data = await AnswerContainerV13.checkLiveClassVideos(db, { doubt: locale.toUpperCase() }, { question_id: questionID }, studentID, 900, studentClass, isLiveClassVideo, page, {}, isBrowser);
            if (data.premium_video_block_meta_data && studentID === 0) {
                data.premium_video_block_meta_data.bottom_text = 'Already purchased this course? Login to view';
            } else if (studentID === 0) {
                data.premium_video_block_meta_data = {
                    button: {
                        title: 'Login',
                    },
                    description: 'Please Login to watch this video solution instantly',
                };
            }
            widgets.unshift({
                type: 'blocker_page',
                data,
            });
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                widgets,
            },
        };
        if (variantInfo && variantInfo.length) {
            responseData.meta.analytics = {
                variant_info: variantInfo,
            };
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function homeworkSubmit(req, res, next) {
    try {
        const db = req.app.get('db');
        // const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        const { question_id: questionID, response } = req.body;
        // const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionID(db, questionID);
        const homeworkDetails = await CourseContainerv2.getHomeworkByQuestionIDNew(db, questionID);
        // const resourceDetails = await CourseV2Mysql.getParentAssortmentByResourceList(db.mysql.read, [homeworkDetails[0].homework_resource_id]);

        const bulkInsert = [];
        if (homeworkDetails.length > 0) {
            const questionDetails = await CourseContainerv2.getHomeworkQuestionDetails(db, homeworkDetails[0].question_list);

            const grouped = _.groupBy(questionDetails, 'question_id');

            for (let i = 0; i < response.length; i++) {
                const insertItem = [];
                insertItem.push(studentID);
                insertItem.push(homeworkDetails[0].homework_resource_id);
                insertItem.push(questionID);
                insertItem.push(response[i].quiz_question_id);
                insertItem.push(response[i].option_id);
                let isCorrect = 0;

                if (typeof grouped[response[i].quiz_question_id] !== 'undefined') {
                    // check if it is subjective or not
                    if (_.isEmpty(grouped[response[i].quiz_question_id][0].opt_1) || (_.isEmpty(grouped[response[i].quiz_question_id][0].answer) && grouped[response[i].quiz_question_id][0].is_answered === 1)) {
                        isCorrect = 1;
                    } else if (grouped[response[i].quiz_question_id][0].answer.trim().includes('::')) {
                        const splitted = response[i].option_id.split('::');
                        for (let j = 0; i < splitted.length; i++) {
                            if (!grouped[response[i].quiz_question_id][0].answer.trim().includes(splitted[j])) {
                                break;
                            }
                            isCorrect = 1;
                        }
                    } else if (response[i].option_id == grouped[response[i].quiz_question_id][0].answer.trim()) {
                        isCorrect = 1;
                    }
                } else if (response[i].option_id === 'A') isCorrect = 1;
                insertItem.push(isCorrect);

                if (insertItem.length > 0) {
                    bulkInsert.push(insertItem);
                }
            }
            // const studentClass = req.user.student_class;
            // const activePackages = await CourseV2Mysql.getUserActivePackages(db.mysql.read, studentID);
            // const assortmentList = [];
            // // eslint-disable-next-line guard-for-in
            // for (let i = 0; i < resourceDetails.length; i++) {
            //     assortmentList.push(resourceDetails[i].assortment_id);
            // }
            // const parentAssortments = await CourseHelper.getParentAssortmentListV1(db, assortmentList, studentClass);
            // let liveAtTime = await PaidUserChampionshipMysql.getLiveAtFromQuestionId(db.mysql.read, questionID);
            // liveAtTime = liveAtTime[0].live_at;
            // for (let i = 0; i < activePackages.length; i++) {
            //     const assortment = parentAssortments.filter((e) => e.assortment_id === activePackages[i].assortment_id);
            //     if (assortment && assortment.length) {
            //         updateCountInLeaderboard(db, 'homework_attempted', 1, studentID, activePackages[i].assortment_id, liveAtTime);
            //     }
            // }
        }
        CourseV2Redis.deleteFullHomeworkResponse(db.redis.write, studentID);
        // let inserted = false;
        if (bulkInsert.length > 0) {
            await CourseV2Mysql.insertHomeworkResponse(db.mysql.write, bulkInsert);
            // inserted = true;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {},
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function homeworkList(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;
        const { page, size = 20 } = req.query;
        const userDetails = await CourseContainerv2.getUserActivePackages(db, studentID);
        // console.log('userDetails')
        // console.log(userDetails)
        const promises = [];
        userDetails.map((item) => promises.push(CourseContainerv2.getHomeworkByAssortmentID(db, item.assortment_id, size, Utility.getOffset(page, size), null, item.batch_id || 1)));
        // get homework response of user
        promises.push(CourseV2Mysql.getFullHomeworkResponse(db.mysql.read, studentID));
        const resolvedPromises = await Promise.all(promises);
        // console.log('resolvedPromises');
        // console.log(resolvedPromises);
        const userResponse = resolvedPromises.splice(-1, 1);
        const groupedUserResponse = _.groupBy(userResponse[0], 'resource_reference');
        let pending = 0;
        const items = [].concat(...resolvedPromises)
            .map((item) => {
                const obj = {};
                if (!_.isNull(item.question_id)) {
                    obj.id = item.question_id;
                    if (typeof groupedUserResponse[item.question_id] !== 'undefined') {
                        obj.done = true;
                    } else {
                        pending += 1;
                        obj.done = false;
                    }
                    obj.status_message = (obj.done) ? 'Completed' : 'Pending';
                    obj.status = obj.done;
                    obj.color = (obj.done) ? '#228B22' : '#FF6347';
                    obj.status_image = (obj.done) ? `${config.staticCDN}engagement_framework/8ED7B8A3-375A-8FC1-6456-1E52882E9AAC.webp` : `${config.staticCDN}engagement_framework/7F718914-181A-431C-E121-7C674EC6F12B.webp`;
                    obj.title = item.name;
                    obj.question_count_text = (locale === 'hi') ? `${item.question_list.split('|').length} प्रश्न` : `${item.question_list.split('|').length} Questions`;
                    obj.due_data = moment(item.live_at).add(1, 'days').format('DD-MM-YYYY');
                    obj.liveAt = !_.isNull(item.live_at) ? moment().add(5, 'hours').add(30, 'minutes').isAfter(item.live_at) : true;
                }
                return obj;
            }).filter((item) => !_.isEmpty(item) && item.liveAt);
        const widgets = [];
        const listWidget = {};
        listWidget.type = 'homework_list';
        listWidget.data = {};
        listWidget.data.title = `${pending} Pending Homework`;
        listWidget.data.items = items;
        widgets.push(listWidget);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                title: (locale === 'hi') ? 'मेरा होमवर्क ' : 'My Homework',
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function referralInfo(req, res, next) {
    try {
        let branchLink = '';
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;

        const { type, assortment_type, assortment_id } = req.query;

        const referralCodeInfo = await CouponMySQL.getInfoByStudentId(db.mysql.read, studentID);

        let referralCode = '';

        if (referralCodeInfo.length) {
            referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
        }
        const referralMessage = await CourseHelper.getReferralMessage({
            db,
            studentData: req.user,
            type,
        });
        let share_message = referralMessage.message;
        // let share_message = Data.referralInfo.invite_message;

        share_message = share_message.replace(/<amount>/g, Data.referralInfo.couponData.value);
        share_message = share_message.replace(/<referral_code>/g, referralCode);

        // const referralAmount = Data.referralInfo.couponData.value;
        let info;
        if (type == 'payment') {
            branchLink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'PAYMENT', referralMessage.campaign_id, referralMessage.iteration == 'referral_doubt' ? `doubtnutapp://invite_friend?referrer_student_id=${studentID}&invitorId=${studentID}` : `doubtnutapp://course_details?id=xxxx||||${referralCode}&referrer_student_id=${studentID}`);
            share_message = share_message.replace(/<link_to_explore>/g, branchLink.url);
            if (assortment_type == 'course') {
                info = {
                    type: 'payment',
                    title: 'Payment Successful!',
                    sub_title: 'Aapka package update ho gaya hai',
                    img_url: `${Data.cdnUrl}${Data.referralDetails[referralMessage.iteration].image}`,
                    header: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].header,
                    description: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].description,
                    referral_code: referralCode,
                    referral_code_text: 'Share this code',
                    share_text: 'Share to Doubtnut feed',
                    invite_message: share_message,
                    feed_message: share_message,
                    button_text: 'INVITE',
                };
            } else if (assortment_type == 'resource_pdf' || assortment_type == 'resource_video') {
                info = {
                    type: 'payment',
                    img_url: `${Data.cdnUrl}/images/green_tick_payment_complete.webp`,
                    header: 'Payment Complete',
                    description: 'Aapka package update hogaya he',
                    referral_code: referralCode,
                    referral_code_text: 'Share this code',
                    share_text: 'Share to Doubtnut feed',
                    invite_message: share_message,
                    button_text: assortment_type == 'resource_pdf' ? 'Open PDF' : 'Open Video',
                    button_deeplink: `doubtnutapp://course_details?id=${assortment_id}`,
                    explore_text: 'Explore More Courses',
                    explore_text_deeplink: Data.referralInfo.deeplink_to_explore,

                };
            }
        } else if (type == 'profile') {
            branchLink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'PROFILE', referralMessage.campaign_id, referralMessage.iteration === 'referral_doubt' ? `doubtnutapp://invite_friend?referrer_student_id=${studentID}&invitorId=${studentID}` : `doubtnutapp://course_details?id=xxxx||||${referralCode}&referrer_student_id=${studentID}`);
            share_message = share_message.replace(/<link_to_explore>/g, branchLink.url);
            if ((await CouponMySQL.getInfoByStudentId(db.mysql.read, studentID)).length) {
                info = {
                    type: 'profile',
                    title: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].title,
                    img_url: `${Data.cdnUrl}${Data.referralDetails[referralMessage.iteration].image}`,
                    referral_code: referralCode,
                    referral_code_text: 'Share this code',
                    invite_message: share_message,
                    feed_message: share_message,
                    button_text: 'INVITE',
                    share_button_event_action: referralMessage.campaign_id,
                    page_open_event_action: referralMessage.iteration,
                    code_copy_event_action: referralMessage.iteration,
                    share_text: 'Share to Doubtnut feed',
                    header: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].header,
                    description: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].description,
                    video_url: `${Data.cdnUrlLimeLight}/${Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].video_url}`,
                    share_button_event_category: `ReferralPageShareButtonClick_${referralMessage.iteration}`,
                };
                // CourseV2Mysql.addReferralPageViews(db.mysql.write, { student_id: studentID, source: info.type, iteration: referralMessage.iteration });
            } else info = null;
        } else if (type == 'navigation') {
            branchLink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'NAVIGATION', referralMessage.campaign_id, referralMessage.iteration === 'referral_doubt' ? `doubtnutapp://invite_friend?referrer_student_id=${studentID}&invitorId=${studentID}` : `doubtnutapp://course_details?id=xxxx||||${referralCode}&referrer_student_id=${studentID}`);
            share_message = share_message.replace(/<link_to_explore>/g, branchLink.url);
            info = {
                type: 'navigation',
                title: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].title,
                img_url: `${Data.cdnUrl}${Data.referralDetails[referralMessage.iteration].image}`,
                referral_code: referralCode,
                referral_code_text: 'Share this code',
                invite_message: share_message,
                feed_message: share_message,
                button_text: 'INVITE',
                share_button_event_action: referralMessage.campaign_id,
                page_open_event_action: referralMessage.iteration,
                code_copy_event_action: referralMessage.iteration,
                share_text: 'Share to Doubtnut feed',
                header: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].header,
                description: Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].description,
                video_url: `${Data.cdnUrlLimeLight}/${Data.referralDetails[referralMessage.iteration][locale == 'hi' ? 'hi' : 'en'].video_url}`,
                share_button_event_category: `ReferralPageShareButtonClick_${referralMessage.iteration}`,
                payment_help: {
                    title: 'FAQs',
                    list: await Properties.getNameAndValueByBucket(
                        db.mysql.read,
                        referralMessage.iteration,
                    ),
                },
            };
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: info,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function referralInfoWeb(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { sid: studentID } = req.params;
        await CouponContainer.createReferralCoupon(db, studentID);
        const promise = [];
        promise.push(StudentContainer.getById(studentID, db));
        promise.push(CouponMySQL.getInfoByStudentId(db.mysql.read, studentID));
        const result = await Promise.all(promise);
        const [studentData, referralCodeInfo] = result;
        const type = 'top_icon';
        let share_message;
        let referralCode = '';
        if (referralCodeInfo && referralCodeInfo.length) {
            referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
        }
        const referralMessage = await CourseHelper.getReferralMessage({
            db,
            studentData: studentData[0],
            type,
        });
        share_message = referralMessage.message ? referralMessage.message : Data.referralInfo.invite_message;
        const branchLink = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'TOP_ICON', referralMessage.campaign_id, referralMessage.iteration == 'referral_doubt' ? `doubtnutapp://invite_friend?referrer_student_id=${studentID}&invitorId=${studentID}` : `doubtnutapp://course_details?id=xxxx||||${referralCode}&referrer_student_id=${studentID}`);
        share_message = share_message.replace(/<link_to_explore>/g, branchLink.url);
        share_message = share_message.replace(/<amount>/g, (referralMessage.iteration === 'referral_paytm') ? '150' : Data.referralInfo.couponData.value);
        share_message = share_message.replace(/<referral_code>/g, referralCode);
        const info = {
            type,
            title: Data.referralDetails[referralMessage.iteration][studentData[0].locale == 'hi' ? 'hi' : 'en'].title,
            img_url: `${Data.cdnUrl}${Data.referralDetails[referralMessage.iteration].image}`,
            referral_code: referralCode,
            referral_code_text: 'Share this code',
            invite_message: share_message,
            feed_message: share_message,
            button_text: 'INVITE',
            share_button_event_action: referralMessage.campaign_id,
            page_open_event_action: referralMessage.iteration,
            code_copy_event_action: referralMessage.iteration,
            share_text: 'Share to Doubtnut feed',
            header: Data.referralDetails[referralMessage.iteration][studentData[0].locale == 'hi' ? 'hi' : 'en'].header,
            description: Data.referralDetails[referralMessage.iteration][studentData[0].locale == 'hi' ? 'hi' : 'en'].description,
            video_url: `${Data.cdnUrlLimeLight}/${Data.referralDetails[referralMessage.iteration][studentData[0].locale == 'hi' ? 'hi' : 'en'].video_url}`,
            share_button_event_category: `ReferralPageShareButtonClick_${referralMessage.iteration}`,
            page_open_event_category: `ReferralPageOpen_${referralMessage.iteration}`,
            code_copy_event_category: `ReferralPageCodeCopy_${referralMessage.iteration}`,
        };
        // if (referralMessage.iteration == 'referral_ceo') {
        //     info.pdf = Data.referralDetails[referralMessage.iteration].pdf;
        // }
        // CourseV2Mysql.addReferralPageViews(db.mysql.write, { student_id: studentID, source: type, iteration: referralMessage.iteration });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: info,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function bestSeller(req, res) {
    const db = req.app.get('db');
    const config = req.app.get('config');
    const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
    try {
        const { student_id, locale, student_class } = req.user;
        const { version_code } = req.headers;
        let paidCourses = await CourseHelper.getPaidAssortmentsData({
            db,
            studentClass: student_class,
            config,
            versionCode: version_code,
            studentId: student_id,
            studentLocale: locale,
            xAuthToken: req.headers['x-auth-token'],
            page: 'CHECKOUT_PAGE',
            pznElasticSearchInstance,
        });
        paidCourses = paidCourses.items;
        let paidOnly;
        let finalData = {};
        for (let i = 0; i < paidCourses.length; i++) {
            if (paidCourses[i].data.lock_state == 1 || paidCourses[i].data.lock_state == 0) {
                paidOnly = paidCourses[i];

                finalData = {
                    id: paidOnly.data.id,
                    header: 'Best Seller',
                    title: paidOnly.data.title,
                    buy_deeplink: paidOnly.data.buy_deeplink,
                    image_bg: paidOnly.data.image_bg,
                    deeplink: paidOnly.data.deeplink,
                    icon_url: paidOnly.data.demo_video_thumbnail ? paidOnly.data.demo_video_thumbnail : paidOnly.data.icon_url,
                    amount_to_pay: paidOnly.data.amount_to_pay,
                    buy_text: paidOnly.data.buy_text,
                };
                break;
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: _.isEmpty(finalData) ? {} : finalData,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return res.status(500).json({
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {},
        });
    }
}

async function courseListing(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let filters = req.query.filters || [];
        const { is_browser: isBrowser } = req.headers;
        const { student_id: studentId } = req.user || {};
        let widgets = [];
        if (typeof filters === 'string') {
            filters = filters.split(',');
        }
        let vipCourses = [];
        if (!_.isNull(studentId)) {
            const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            vipCourses = await CourseContainerv2.getUserActivePackages(db, studentId);
            vipCourses = vipCourses.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject');
            let expiredPackages = await CourseContainerv2.getUserExpiredPackages(db, studentId);
            expiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30);
            expiredPackages = expiredPackages.filter((item) => !_.find(vipCourses, ['assortment_id', item.assortment_id]));
            vipCourses = [...vipCourses, ...expiredPackages];
            if (isBrowser) {
                vipCourses = vipCourses.filter((item) => item.assortment_id !== 138829);
            }
        }
        widgets = await CourseHelper.getResponseForCategoryListingPage({
            db, studentClass: 12, filters, category: '', assortmentFlagrResponse: {}, locale: 'en', config, studentID: studentId || 0, versionCode: 1000, isBrowser, vipCourses,
        });
        // console.log(widgets);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                title: '',
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        next({ err });
    }
}

async function purchasedCourseListing(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID, locale } = req.user;
        const { page } = req.query;
        const widgets = [];
        const userActivePackages = await CourseContainerv2.getUserActivePackages(db, studentID);
        const promise1 = [];
        const promise2 = [];
        let requiredActivePackages = userActivePackages.filter((item) => _.includes(['course', 'class', 'subject'], item.assortment_type));
        if (page && page.includes('renewal_widget')) {
            requiredActivePackages = requiredActivePackages.filter((e) => moment(e.end_date) < moment('2021-11-01'));
        }
        if (page === 'request_course_change') {
            for (let i = 0; i < requiredActivePackages.length; i++) {
                promise1.push(CourseV2Mysql.getPaymentSummaryBySubscription(db.mysql.read, requiredActivePackages[i].subscription_id));
                promise2.push(CourseV2Mysql.getCallBackLogsDetails(db.mysql.read, studentID, requiredActivePackages[i].subscription_id));
            }
        }
        const paymentSummaryDetails = await Promise.all(promise1);
        const callBackLogs = await Promise.all(promise2);
        for (let i = 0; i < requiredActivePackages.length; i++) {
            const startYear = `${requiredActivePackages[i].year_exam}`;
            const examYear = `${parseInt(startYear) - 1}`;
            const obj = {
                duration: requiredActivePackages[i].assortment_type === 'subject' ? requiredActivePackages[i].display_description : requiredActivePackages[i].display_name,
                subtitle: `${examYear}-${startYear.substring(startYear.length - 2, startYear.length)} Batch`,
                amount_to_pay: '',
                amount_to_pay_color: '#000000',
                amount_strike_through: '',
                amount_strike_through_color: '#808080',
            };
            if (page === 'live_class_bottom_icon') {
                obj.assortment_id = requiredActivePackages[i].assortment_id;
                if (requiredActivePackages[i].assortment_id === 138829) {
                    obj.category_id = 'Kota Classes';
                }
            } else if (page === 'request_course_change') {
                obj.deeplink = `doubtnutapp://course_change?assortment_id=${requiredActivePackages[i].assortment_id}`;
            } else if (page && page.includes('renewal_widget')) {
                obj.deeplink = `doubtnutapp://bundle_dialog?id=${requiredActivePackages[i].assortment_id}&source=POST_PURCHASE_RENEWAL||${page.split('||')[1]}`;
            } else {
                obj.deeplink = requiredActivePackages[i].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${requiredActivePackages[i].assortment_id}`;
            }
            if (page === 'request_course_change' && requiredActivePackages[i].amount > -1) {
                if (paymentSummaryDetails[i].length && paymentSummaryDetails[i][0].payment_type !== 'switch-nonemi' && !callBackLogs[i].length) {
                    widgets.push({
                        type: 'purchased_course_list',
                        data: {
                            items: [obj],
                        },
                    });
                }
            } else if (page !== 'request_course_change') {
                widgets.push({
                    type: 'purchased_course_list',
                    data: {
                        items: [obj],
                    },
                });
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                title: locale === 'hi' ? 'कोर्स चुनें' : 'Select Course',
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function courseFiltersSelection(req, res, next) {
    try {
        const db = req.app.get('db');
        const { locale } = req.user;
        const { assortment_id: assortmentID } = req.query;
        const data = await CourseV2Mysql.getDistinctSelectionsFromCourseDetails(db.mysql.read);
        const classWiseData = _.groupBy(data, 'class');
        const classItems = [];
        for (const key in classWiseData) {
            if (classWiseData[key]) {
                const categoryWiseData = _.groupBy(classWiseData[key], 'category');
                const exams = [];
                for (const key1 in categoryWiseData) {
                    if (categoryWiseData[key1]) {
                        const yearsData = [];
                        for (let i = 0; i < categoryWiseData[key1].length; i++) {
                            yearsData.push({
                                filter_id: categoryWiseData[key1][i].year_exam,
                                text: `${categoryWiseData[key1][i].year_exam}`,
                            });
                        }
                        exams.push({
                            text: key1,
                            filter_id: key1,
                            year_exam: yearsData,
                        });
                    }
                }
                classItems.push({
                    filter_id: key,
                    text: +key === 13 ? `${locale === 'hi' ? 'ड्रॉपर' : 'Dropper'}` : `${locale === 'hi' ? 'कक्षा' : 'Class'} ${key}`,
                    is_selected: false,
                    exam_list: exams,
                });
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                assortment_id: assortmentID,
                title: locale === 'hi' ? 'कोर्स चुनें' : 'Request Course Change',
                subtitle: locale === 'hi' ? 'कोर्स के डिटेल चुनें' : 'Select Course Details',
                description: locale === 'hi' ? 'आप जिस कोर्स में स्विच करना चाहते है, उसके डिटेल बताये' : 'Aap jis course me switch karna chahte hai, uske details bataye',
                class_list: classItems,
                button_text: locale === 'hi' ? 'कोर्स ढूंढें' : 'Course Dhoondo',
                class_text: locale === 'hi' ? 'कक्षा' : 'Class',
                exam_text: locale === 'hi' ? 'परीक्षा' : 'Exam',
                exam_year_text: locale === 'hi' ? 'परीक्षा कौनसे साल में है' : 'Exam year',
                medium_text: locale === 'hi' ? 'माध्यम' : 'MEDIUM',
                hindi_medium_text: Data.getCourseMediumByLocale(locale).HINDI,
                eng_medium_text: Data.getCourseMediumByLocale(locale).ENGLISH,
                medium_text_unselected: locale === 'hi' ? 'आपकी किताब किस भाषा में है ?' : 'Aapki kitaab kis language mein hai ?',
                medium_text_hindi: locale === 'hi' ? 'किताब की भाषा और टीचर की पढ़ाई दोनों हिंदी में' : 'Kitaab ki language and teacher ki padhai dono Hindi mein',
                medium_text_english: locale === 'hi' ? 'किताब की भाषा अंग्रेज़ी में पर टीचर की पढाई हिंदी/हिंगलिश में' : 'Kitaab ki language English mein par teacher ki padhai Hindi/Hinglish mein',
                select_class_text: locale === 'hi' ? 'कक्षा चुनें' : 'Select Class',
                select_exam_text: locale === 'hi' ? 'परीक्षा चुनें' : 'Apna Exam Chuniye',
                select_exam_year_text: locale === 'hi' ? 'परीक्षा का साल चुनें' : 'Select Exam Year',
                select_medium_text: locale === 'hi' ? 'माध्यम चुनें' : 'Select Medium',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function popupDetailsForHelpFlow(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;
        const { type, assortment_id: assortmentID, selected_assortment: selectedVariant } = req.query;
        let data;
        const courseDetails = selectedVariant ? await CourseV2Mysql.getCourseDetailsFromVariantId(db.mysql.read, selectedVariant) : [];
        const activePackageDetails = assortmentID ? await CourseV2Mysql.getUserPaymentSummaryDetailsByAssortment(db.mysql.read, assortmentID, studentID) : [];
        if (type === 'callback') {
            data = {
                title: locale === 'hi' ? `पक्का करे : आप ${courseDetails[0].display_name} कोर्स चाहते है` : `Confirm Course Change to ${courseDetails[0].display_name}`,
                subtitle: locale === 'hi' ? 'क्या आप पक्का अपने कोर्स को बदलना चाहते ह? हमारी टीम इस कोर्स को देख कर आपको कॉल करेगी' : 'Are you sure aap apna course change karna chahte hai? Humari team aapke is course ko review karegi',
                image_url: `${config.cdn_url}engagement_framework/8ED8D25E-9A51-E373-6C97-1E151DEF285D.webp`,
                note_title: locale === 'hi' ? 'नोट:' : 'Note:',
                subscription_id: activePackageDetails[0].subscription_id,
                note: locale === 'hi' ? 'आप इस कोर्स को एक ही बार बदल सकते है' : 'Aap is course ko bas ek hi baari change kar sakte hai',
                yes_button_text: locale === 'hi' ? 'Doubtnut से कॉल मांगे' : 'Request Call Back',
                cancel_button_text: locale === 'hi' ? 'रद्द करें' : 'Cancel',
                yes_deeplink: `doubtnutapp://course_details?id=${assortmentID}`,
                button_state: 'call',
                yes_event_params: {
                    type: 'same_price_popup_call_back',
                },
                no_event_params: {
                    type: 'same_price_popup_cancel',
                },
                event_params: {
                    page: 'same_price_popup',
                },
            };
            if (courseDetails[0].display_price === activePackageDetails[0].package_amount) {
                data.subtitle = `${data.subtitle}${locale === 'hi' ? '| इस कोर्स की कीमत आपके अभी के कोर्स जितनी ही है' : '. Iss course aur aapke abhi ke course ka price same hi hai'}`;
            }
        } else if (type === 'confirm') {
            data = {
                title: locale === 'hi' ? `पक्का करे : आप ${courseDetails[0].display_name} कोर्स चाहते है` : `Confirm Course Change to ${courseDetails[0].display_name}`,
                subtitle: locale === 'hi' ? `यह कोर्स आपके अभी के कोर्स से ₹${courseDetails[0].display_price - activePackageDetails[0].package_amount} महंगा है। कोर्स बदलने के लिए पेमेंट पूरा करें।` : `Ye course aapke abhi ke course se ₹${courseDetails[0].display_price - activePackageDetails[0].package_amount} mehenga hai. Course change karne ke liye payment poora karein`,
                image_url: `${config.cdn_url}engagement_framework/8ED8D25E-9A51-E373-6C97-1E151DEF285D.webp`,
                note_title: locale === 'hi' ? 'नोट:' : 'Note:',
                note: locale === 'hi' ? 'आप इस कोर्स को एक ही बार बदल सकते है' : 'Aap is course ko bas ek hi baari change kar sakte hai',
                yes_button_text: locale === 'hi' ? `₹${courseDetails[0].display_price - activePackageDetails[0].package_amount} की पेमेंट कम्पलीट करें` : `Continue to Pay ₹${courseDetails[0].display_price - activePackageDetails[0].package_amount}`,
                cancel_button_text: '',
                yes_deeplink: `doubtnutapp://vip?variant_id=${selectedVariant}&switch_assortment=${assortmentID}`,
                button_state: '',
                yes_event_params: {
                    type: 'higher_price_popup_continue_to_pay',
                    subscription_id: activePackageDetails[0].subscription_id,
                    variant_id: selectedVariant,
                },
                no_event_params: {
                    type: 'same_price_popup_cancel',
                },
                event_params: {
                    page: 'higher_price_popup',
                },
            };
        } else {
            data = {
                title: locale === 'hi' ? 'क्या आप पक्का कोर्स बदलना चाहते हैं ?' : 'Kya aap pakka course change karna chahte hai?',
                subtitle: locale === 'hi' ? 'ध्यान रखें: कोर्स बदलने के बाद आप अपने अभी के कोर्स से नहीं पढ़ पाएंगे' : 'Course change hone ke baad aap apne current course se nahi padh payenge',
                image_url: '',
                note_title: 'Note:',
                note: locale === 'hi' ? 'आप इस कोर्स को एक ही बार बदल सकते है' : 'Aap is course ko bas ek hi baari change kar sakte hai',
                yes_button_text: locale === 'hi' ? 'हाँ, नया कोर्स चुनना है' : 'Yes, Naya course select karo',
                cancel_button_text: locale === 'hi' ? 'नहीं, कोर्स नहीं बदलना' : 'No, Change nahi karna',
                yes_deeplink: `doubtnutapp://course_change_option?assortment_id=${assortmentID}`,
                button_state: '',
                yes_event_params: {
                    type: 'request_course_change_select_course',
                },
                no_event_params: {
                    type: 'request_course_change_cancel',
                },
                event_params: {
                    page: 'request_course_change_popup',
                },
            };
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function courseListingForSwitch(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;
        const { version_code: versionCode } = req.headers;
        const {
            filter_class: classFilter, filter_exam: examFilter, filter_medium: mediumFilter, filter_year: yearFilter, assortment_id: assortmentID,
        } = req.query;
        let { filters } = req.query;
        if (typeof filters === 'string') {
            filters = filters.split(',');
        }
        const widgets = [];
        let responseData = {};
        let courseList = await CourseV2Mysql.getCoursesList(db.mysql.read, [examFilter || 'CBSE Boards'], classFilter || 12);
        const vipCourses = await CourseContainerv2.getUserActivePackages(db, studentID);
        if (vipCourses.length) {
            courseList = courseList.filter((item) => !_.find(vipCourses, ['assortment_id', item.assortment_id]));
        }
        let hinglishCourses = [];
        if (mediumFilter === 'HINDI' || mediumFilter === 'ENGLISH') {
            hinglishCourses = courseList.filter((item) => item.meta_info === 'HINGLISH' && !item.is_free && item.year_exam === +yearFilter);
        }
        courseList = courseList.filter((e) => e.meta_info === (mediumFilter || 'ENGLISH') && !e.is_free && e.year_exam === +yearFilter);
        courseList = courseList.concat(hinglishCourses);
        if (!(examFilter === 'IIT JEE' || examFilter === 'NEET')) {
            courseList = courseList.filter((item) => item.assortment_id !== 138829);
        }
        const assortmentList = [];
        courseList.map((item) => assortmentList.push(item.assortment_id));
        const assortmentPriceMapping = assortmentList.length ? await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentID, true) : {};
        const promises = [];
        for (let i = 0; i < courseList.length; i++) {
            promises.push(CourseHelper.generateAssortmentObject({
                data: courseList[i],
                config,
                paymentCardState: { isVip: false },
                assortmentPriceMapping,
                db,
                setWidth: null,
                versionCode,
                assortmentFlagrResponse: {},
                locale,
                category: null,
                page: `COURSE_CHANGE_LISTING||${assortmentID}`,
                studentId: studentID,
            }));
        }
        const courseWidget = await Promise.all(promises);
        for (let i = 0; i < courseWidget.length; i++) {
            courseWidget[i].data.deeplink = `doubtnutapp://bundle_dialog?id=${courseWidget[i].data.assortment_id}&source=COURSE_CHANGE_LISTING||${assortmentID}`;
            courseWidget[i].data.buy_deeplink = `doubtnutapp://bundle_dialog?id=${courseWidget[i].data.assortment_id}&source=COURSE_CHANGE_LISTING||${assortmentID}`;
        }
        if (courseWidget.length) {
            const obj = {
                type: 'widget_parent',
                data: {
                    title: locale === 'hi' ? 'आपके लिए कोर्स के सुझाव' : 'Recommended courses for you',
                    subtitle: locale === 'hi' ? 'आप्के लिए यह कोर्स उपलब्ध हैं - एक ही चुनें' : 'Apke selection ke hisaab se, ye courses available hain - ek hi course choose kare',
                    items: courseWidget,
                },
            };
            obj.data.scroll_direction = 'vertical';
            widgets.push(obj);
        } else {
            const obj = {
                type: 'widget_parent',
                data: {
                    title: locale === 'hi' ? 'आपके लिए कोर्स के सुझाव' : 'Recommended courses for you',
                    subtitle: locale === 'hi' ? 'लगता है आपकी लिए कोई कोर्सेज नहीं मिल रहे। दोबारा कोशिश करे या हमे vip@doubtnut.com पे ईमेल करके अपनी परेशानी बताये' : 'Oops! Lagta hai aapke selection ke basis koi new courses available nahi hai. Phir se try karein ya apni pareshani  email kariye at vip@doubtnut.com',
                    message: locale === 'hi' ? 'No courses' : 'No courses',
                    items: [],
                },
            };
            obj.data.scroll_direction = 'vertical';
            widgets.push(obj);
        }
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                title: locale === 'hi' ? 'कोर्स चुनें' : 'Select Course',
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function addCallbackData(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID, locale } = req.user;
        const { subscription_id: requestFrom, selected_assortment: requestFor } = req.query;
        const packageDetails = await CourseV2Mysql.getCourseDetailsFromVariantId(db.mysql.read, requestFor);
        let obj = {
            student_id: studentID,
            active_subscription_id: requestFrom,
            requested_package_id: packageDetails[0].package_id,
            request_type: 'switch',
            assortment_id: packageDetails[0].assortment_id,
            callback_request_date: moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD'),
        };
        await CourseV2Mysql.setRequestCallbackData(db.mysql.write, obj);

        let mobile = await CourseV2Mysql.getMobileBySId(db.mysql.read, studentID);
        if (mobile.length) {
            mobile = mobile[0].mobile;
        } else {
            mobile = null;
        }
        obj = {
            mobile,
            student_id: studentID,
            package_id: packageDetails[0].package_id,
            category_id: 3,
            subcategory_id: 13,
            status: 'PENDING',
        };
        const ticketID = await CourseV2Mysql.setRequestTicketData(db.mysql.write, obj);

        obj = {
            ticket_id: ticketID.insertId,
            email_id: 'info@doubtnut.com',
            comments: `Switch the user to package id - ${packageDetails[0].package_id}`,
            entity_type: 'BDA',
            action: 'CREATE',
        };
        await CourseV2Mysql.setRequestActivityData(db.mysql.write, obj);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                message: locale === 'hi' ? 'हम आपको जल्द ही कॉल करेंगे..' : 'We will call you soon..',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function dismissCallingCard(req, res, next) {
    try {
        const { student_id: studentId } = req.user;
        let { assortment_id: assortmentId } = req.body;
        const db = req.app.get('db');
        if (!assortmentId) {
            assortmentId = 0;
        }
        CourseV2Redis.setCallingCardDismissData(db.redis.write, studentId, assortmentId);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function requestCallback(req, res, next) {
    try {
        const { student_id: studentId } = req.user;
        const { assortment_id: assortmentId } = req.body;
        const db = req.app.get('db');
        const data = {
            student_id: studentId,
            callback_request_date: moment().format('YYYY-MM-DD'),
            request_type: 'calling_card',
        };
        if (typeof assortmentId !== 'undefined') {
            data.assortment_id = assortmentId;
        }
        // console.log(data);
        await CourseV2Mysql.setRequestCallbackData(db.mysql.write, data);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Thank you for showing interest. We will call you soon',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
function getBottomSheetIconListTitleWidget(db, studentLocale) {
    try {
        let localeToBeUsed = studentLocale;
        if (studentLocale !== 'hi' && studentLocale !== 'en') {
            localeToBeUsed = 'other';
        }

        return { // bottom sheet title and img widget
            widget_type: 'widget_dnr_redeem_voucher',
            widget_data: {
                title: Data.cameraPageBottomSheet.title[localeToBeUsed],
                title_text_size: 18,
                title_color: '#202020',
                subtitle: '',
                subtitle_text_size: 12,
                subtitle_color: '',
                cta: '',
                cta_color: '',
                cta_background_color: '',
                dnr_image: '',
                deeplink: '',
                background_color: '#ffffff',
                voucher_image: `${config.staticCDN}${Data.cameraPageBottomSheet.img_url}`,
                voucher_background_color: '#ffffff',
                is_title_multiline: true,
                is_subtitle_multiline: true,
                image_card_elevation: 0,
                visibility_layout_redirect: false,
                image_height: 80,
                image_background_color: '#ffffff',
                parent_card_corner_radius: 12,
            },
            layout_config: Data.cameraPageBottomSheet.iconsListWidgetLayout.layout_config,
        };
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
async function getCourseBottomSheet(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, student_class: studentClass, locale } = req.user;
        const { widget_type: widgetType, assortment_id: assortmentID, user_category: userCategory } = req.query;
        const { version_code: versionCode } = req.headers;
        let { flagr_variation_ids: flagVariantsArr } = req.headers;
        const xAuthToken = req.headers['x-auth-token'];
        if (flagVariantsArr) {
            flagVariantsArr = flagVariantsArr.split(',');
            flagVariantsArr.unshift(1);
        }
        const widgets = [];
        let title = '';
        const courseDetails = await CourseV2Mysql.getAssortmentDetailsFromId(db.mysql.read, assortmentID);
        let respData;
        if (widgetType === 'faq') {
            const batchID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID);
            const qId = courseDetails[0].demo_video_qid;
            if (courseDetails[0].assortment_type === 'course') {
                const answerData = await CourseV2Mysql.getAnswerIdbyQuestionId(db.mysql.read, qId);
                title = '';
                if (answerData.length) {
                    const videoResources = await AnswerContainerV13.getAnswerVideoResource(db, config, answerData[0].answer_id, qId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
                    let faqData = await CourseV2Mysql.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', batchID);
                    if (faqData.length === 0) {
                        // By default picking out faq by batchId = 1
                        faqData = await CourseV2Mysql.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', 1);
                    }
                    const widgetData = CourseHelper.getPrePurchaseCourseFAQs(faqData, locale, videoResources, true, false, versionCode, qId);
                    widgets.push(widgetData);
                } else {
                    let faqData = await CourseV2Mysql.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', batchID);
                    if (faqData.length === 0) {
                        // By default picking out faq by batchId = 1
                        faqData = await CourseV2Mysql.getFAQsByAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en', 1);
                    }
                    const widgetData = CourseHelper.getPrePurchaseCourseFAQs(faqData, locale, [], true, false, versionCode, qId);
                    widgets.push(widgetData);
                }
            } else {
                const videoResources = [];
                const faqData = await CourseV2Mysql.getFAQsBySubjectAssortment(db.mysql.read, assortmentID, locale === 'hi' ? locale : 'en');
                const widgetData = CourseHelper.getPrePurchaseCourseFAQs(faqData, locale, videoResources, true, false, versionCode, qId);
                widgets.push(widgetData);
            }
            respData = {
                title,
                title_text_size: '16',
                title_text_color: '#000000',
                show_close_btn: true,
                widgets,
            };
        } else if (widgetType === 'select_medium') {
            const otherCourse = await CourseContainerv2.getOtherLanguageCourse(db, assortmentID, courseDetails[0].meta_info);
            title = 'Selected Medium';

            const othercourseID = otherCourse.length ? (otherCourse[0].english_assortment_id || otherCourse[0].hindi_assortment_id) : assortmentID;
            const { englishMediumTeachingDetails, hindiMediumTeachingDetails } = LiveClassData;
            const englishMediumItems = [];
            const hindiMediumItems = [];
            englishMediumTeachingDetails.forEach((item) => englishMediumItems.push({ title: item, title_text_size: '14', title_text_color: '#494A4D' }));
            hindiMediumTeachingDetails.forEach((item) => hindiMediumItems.push({ title: item, title_text_size: '14', title_text_color: '#494A4D' }));
            const data = {
                items: [
                    {
                        medium: 'English',
                        assortment_id: courseDetails[0].meta_info === 'ENGLISH' ? assortmentID : `${othercourseID}`,
                        medium_text: 'English',
                        items: englishMediumItems,
                    },
                ],
            };
            const hindiMediumObj = {
                medium: 'Hindi',
                assortment_id: courseDetails[0].meta_info === 'HINDI' ? assortmentID : `${othercourseID}`,
                medium_text: 'Hindi',
                items: hindiMediumItems,
            };
            if (courseDetails[0].meta_info === 'HINDI') {
                data.items.unshift(hindiMediumObj);
            } else {
                data.items.push(hindiMediumObj);
            }
            widgets.push({
                type: 'widget_select_medium',
                data,
            });
            respData = {
                title,
                title_text_size: '16',
                title_text_color: '#000000',
                show_close_btn: true,
                widgets,
            };
        } else if (widgetType === 'practice_english_promo_bottomsheet') {
            const data = await CourseContainerv2.getPracticeEnglishBottomSheetData(db);
            const result = {};
            data.forEach((item) => {
                if (_.get(result, `${item.name.split('_')[0]}.${item.name.split('_')[2]}`)) {
                    if (typeof _.get(result, `${item.name.split('_')[0]}.${item.name.split('_')[2]}`) === 'string') {
                        _.set(result, `${item.name.split('_')[0]}.${item.name.split('_')[2]}`, [_.get(result, `${item.name.split('_')[0]}.${item.name.split('_')[2]}`), item.value]);
                    } else {
                        _.get(result, `${item.name.split('_')[0]}.${item.name.split('_')[2]}`).push(item.value);
                    }
                } else {
                    _.set(result, `${item.name.split('_')[0]}.${item.name.split('_')[2]}`, item.value);
                }
            });
            const localeTemp = locale === 'hi' ? 'hi' : 'en';
            respData = CourseHelper.practiceEnglishBottomsheetNudge(result[localeTemp], config);
        } else if (widgetType === 'paid_user_championship') {
            respData = CourseHelper.paidUserChampionshipBottomNudge(locale, config);
        } else if (widgetType === 'widget_vpa') {
            // used to open bottom sheet with account details for bank_transfer method in checkout, do not remove this
            const vbaAccountDetails = await PaymentHelper.getVpaDetails({ db, student_id: studentID, locale });
            if (_.isEmpty(vbaAccountDetails)) {
                vbaAccountDetails.description = 'Something Went Wrong';
                vbaAccountDetails.details = [];
                vbaAccountDetails.btn_show = false;
            }
            respData = {
                title,
                title_text_size: '16',
                title_text_color: '#000000',
                show_close_btn: true,
                widgets: [
                    {
                        data: {
                            title: locale === 'hi' ? 'NEFT, RTGS और IMPS अब उपलब्ध' : 'NEFT, RTGS aur IMPS now available',
                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/vba_icon.webp',
                            hyper_text: '',
                            image_ratio: '1:1',
                            is_collapsed: false,
                            account: vbaAccountDetails,
                        },
                        type: 'widget_vpa',
                    },
                ],
            };
        } else if (widgetType === 'widget_123_pay') {
            // used to open bottom sheet with account details for 123_pay method in checkout, do not remove this
            const vbaAccountDetails = await PaymentHelper.getVpaDetails({
                db, student_id: studentID, locale, is_upi_offline: 1,
            });
            if (_.isEmpty(vbaAccountDetails)) {
                vbaAccountDetails.description = 'Something Went Wrong';
                vbaAccountDetails.details = [];
                vbaAccountDetails.btn_show = false;
            }
            respData = {
                title,
                title_text_size: '16',
                title_text_color: '#000000',
                show_close_btn: true,
                widgets: [
                    {
                        data: {
                            title: locale === 'hi' ? 'फ़ोन कॉल से पेमेंट अब उपलब्ध!' : 'Phone Call se payment now available!',
                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/vba_icon.webp',
                            hyper_text: 'NEW',
                            image_ratio: '1:1',
                            is_collapsed: false,
                            account: vbaAccountDetails,
                        },
                        type: 'widget_vpa',
                    },
                ],
            };
        } else if (widgetType === 'homepage_continue_watching') {
            respData = {};
            if (+userCategory === 1) {
                redisAnswer.deleteUserLiveClassWatchedVideo(db.redis.write, studentID, 'LIVECLASS_VIDEO_LF_ET_TIME');
            } else if (+userCategory === 2) {
                redisAnswer.deleteUserLiveClassWatchedVideo(db.redis.write, studentID, 'LIVECLASS_VIDEO_LF_ET_BUFFER_TIME');
            }

            let last5MinVideo = await redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, studentID, 'LIVECLASS_HISTORY');
            if (!_.isNull(last5MinVideo) && last5MinVideo !== 'null') {
                last5MinVideo = JSON.parse(last5MinVideo);
                if (typeof last5MinVideo === 'object' && last5MinVideo.length) {
                    if (+last5MinVideo[0].watched_time > 300) { // 5 min video check
                        respData = await helper.getContinueWatching(last5MinVideo[0]);
                    } else if (+last5MinVideo[0].watched_time < 300 && studentID % 2 === 0) {
                        respData = await helper.getLFSuggestionVideo(db, last5MinVideo[0].question_id);
                    } else {
                        respData = await helper.getMostWatchedLFVideo(db, studentClass);
                    }
                }
            } else {
                respData = await helper.getMostWatchedLFVideo(db, studentClass);
            }
        } else if (widgetType === 'camera_page_bottom_sheet') {
            let showDefault = true;
            if (versionCode >= 1010) {
                const d0UserManager = new D0UserManager(req);
                if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                    respData = await d0UserManager.getCameraBackpressResponse();
                    showDefault = false;
                }
            }

            if (showDefault) {
                if (!flagVariantsArr) {
                    flagVariantsArr = [1];
                }
                const { openCount, questionAskCount } = req.query;

                const twoExampleClassList = [6, 7, 8, 14];
                const mappedLocale = (locale === 'hi') ? 'HINDI' : 'ENGLISH';

                if (!req.query.openCount) {
                    throw new Error('Open count is null');
                }

                let openCountModified = openCount;
                if (twoExampleClassList.includes(studentClass) && openCount > 2) {
                    openCountModified = 2;
                } else if (openCount > 3) {
                    openCountModified = 3;
                }
                const bottomOverlayData = {
                    info: bl.getCameraBottomOverlayInfo(studentClass),
                    subjectList: await bl.getCameraBottomOverlaySubjectListNew(db, config, studentClass, locale, openCountModified, studentID),
                };

                let campaignDetails = [];
                let campaignUser = false;
                if (req.user.campaign) {
                    campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Camera');
                    if (!_.isEmpty(campaignDetails)) {
                        campaignUser = true;
                    }
                }

                let allIcons = [];
                if (campaignUser) {
                    const courseWidget = await CameraHelper.getCameraBackWidgets({
                        db,
                        config,
                        studentId: studentID,
                        studentClass,
                        studentLocale: locale,
                        openCount: 3,
                        questionAskCount,
                        bottomOverlayData,
                        mappedLocale,
                        versionCode,
                        xAuthToken,
                    });
                    return next({ data: { widgets: courseWidget } });
                }

                const cameraBackWidgets = await CameraHelper.getCameraBackWidgets({
                    db,
                    config,
                    studentId: studentID,
                    studentClass,
                    studentLocale: locale,
                    openCount,
                    questionAskCount,
                    bottomOverlayData,
                    mappedLocale,
                    versionCode,
                    xAuthToken,
                });
                if (!_.isEmpty(cameraBackWidgets)) {
                    return next({ data: { widgets: cameraBackWidgets } });
                }

                allIcons = await iconsContainer.getIconsByCategory(db, studentClass, locale, 'CAMERA_PAGE_BOTTOM_SHEET', versionCode, flagVariantsArr);

                if (allIcons.length > 0) {
                    const SortingHelper = new SortingManager(req);
                    allIcons = await SortingHelper.getSortedItems(allIcons);
                }

                if (!_.isEmpty(allIcons)) {
                    const items = IconsHelper.getPopularFeaturesListWidget(db, allIcons);
                    items.unshift(getBottomSheetIconListTitleWidget(db, locale));
                    widgets.push({
                        widget_type: 'widget_parent',
                        widget_data: {
                            scroll_direction: 'vertical',
                            items,
                        },
                    });
                }
                respData = {
                    widgets,
                    cta: {
                        title: Data.cameraPageBottomSheet.cta_button.title[locale],
                        text_color: Data.cameraPageBottomSheet.cta_button.color,
                        deeplink: 'doubtnutapp://top_icons?screen=HOME_ALL',
                        bg_color: '#ffffff',
                    },
                };
            }
        } else if (widgetType === 'video_screen_bottom_sheet') {
            const d0UserManager = new D0UserManager(req);
            const d0UserActivityDetails = await d0UserManager.getD0ActivityBannerOnVideoScreen('backpress');
            respData = d0UserActivityDetails;
        }
        return next({ data: respData });
    } catch (err) {
        return next({ err });
    }
}

async function bookmarkCourseResources(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId } = req.user;
        const {
            resource_id: resourceId, type, assortment_id: assortmentId,
        } = req.query;

        const { message, bookmark } = await helper.bookmarkResource(db, studentId, resourceId, assortmentId, type);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                message,
                icon_url: bookmark ? `${config.staticCDN}engagement_framework/icon_small_bookmark_filled.webp` : `${config.staticCDN}engagement_framework/icon_small_bookmark_line.webp`,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getCoursePagePopups(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale } = req.user;
        const { id, source, page } = req.query;
        let data = {};
        if (+page === 1) {
            const userPackages = source === 'video_page' ? [] : await CourseV2Mysql.getUserPackagesByAssortment(db.mysql.read, studentID, id);
            data = {
                bg_color: '#000000',
                title_color: '#ffffff',
                icon_url: `${config.cdn_url}images/2022/01/06/05-54-23-054-AM_icon_small_flash.webp`,
                next_interval: 0,
            };
            if (userPackages.length === 1 && userPackages[0].amount === -1 && userPackages[0].is_active === 1) {
                const dateValue = moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss');
                const coursePurchases = await CourseV2Mysql.getpurchaseCountByAssortment(db.mysql.read, id, dateValue);
                data.title = `${coursePurchases.length ? coursePurchases[0].count : 22} ${locale === 'hi' ? 'लोगों ने अभी अभी यह कोर्स खरीदा!' : 'people just purchased this course!'}`;
            } else if (source === 'video_page') {
                data.title = locale === 'hi' ? 'अभी अभी एक डाउट का जवाब दिया गया है' : 'A doubt was just answered';
                data.action_title = locale === 'hi' ? 'डाउट देखें' : 'See Doubt';
                data.action_deeplink = 'doubtnutapp://doubts';
                data.action_color = '#eb532c';
                data.icon_url = '';
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

function paginationHandler(size, page, list) {
    const endIndex = page * size;
    const startIndex = (page === 1) ? 1 : endIndex - size;
    return list.filter((item, index) => (index >= startIndex && index < endIndex));
}
async function schedulerListing(req, res, next) {
    try {
        const { subjects = '', page = 1 } = req.query;
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_class: studentClass, locale: studentLocale, student_id: studentId } = req.user;
        const { version_code: versionCode } = req.headers;

        const dataSize = 5;
        const subjectList = subjects.split(',');
        let ccmArray = [];
        const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
        if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
            ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
        }
        const playlistIdList = await SchedulerHelper.getPlaylists(db, ccmArray, studentClass, studentLocale);
        // console.log('playlistIdList');
        // console.log(playlistIdList);
        const qidObject = {};
        if (playlistIdList.length > 0) {
            // get qid list from redis
            for (let i = 0; i < playlistIdList.length; i++) {
                const slotKey = SchedulerHelper.getSlotkey(playlistIdList[i]);
                // get data from redis
                // eslint-disable-next-line no-await-in-loop
                const qidList = await RedisUtils.getSetMembers(db.redis.read, slotKey);
                // console.log('qidList');
                // console.log(qidList);
                if (qidList.length > 0) {
                    qidObject[slotKey] = qidList;
                }
            }
        }
        const filterWidgets = {
            type: 'widget_multi_select_filter',
            data: {
                items: [
                ],
            },
        };
        const ccmCourses = await CourseHelper.getCoursesFromCcmArray(db, ccmArray, studentClass, studentLocale);
        const studentCcmData = await CourseV2Mysql.getCoursesClassCourseMappingWithCategory(db.mysql.read, studentId);
        const iitNeetCourses = [];
        CourseHelper.getCategoryByStudentCCM(studentCcmData);
        if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
            const freeIitCourses = await CourseContainerv2.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
            freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
        }
        if (_.find(studentCcmData, ['category', 'NEET'])) {
            const freeNeetCourses = await CourseContainerv2.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
            freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
        }
        if (!iitNeetCourses.length && _.includes([11, 12, 13], +studentClass)) {
            const freeIitCourses = await CourseContainerv2.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
            freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
            const freeNeetCourses = await CourseContainerv2.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
            freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
        }
        let courses = iitNeetCourses.length ? [...ccmCourses, ...iitNeetCourses] : ccmCourses;
        if (['10', '11', '12', '13'].includes(studentClass.toString()) && studentLocale === 'en') {
            courses = [...[{ assortment_id: 1000358 }, { assortment_id: 1000363 }], ...courses];
        }
        const [liveData, replayData] = await Promise.all([CourseHelper.getVideosDataByScheduleType(db, courses, studentClass, studentLocale, 'live', {}), CourseHelper.getVideosDataByScheduleType(db, ccmCourses, studentClass, studentLocale, 'replay', {})]);
        const widgetData = await SchedulerHelper.getSchedulerWidget(db, config, qidObject, 'verticalFull', 'all', liveData, versionCode, 'listing_page', studentId, replayData);
        // generate filter
        const widgetItems = [];
        for (let i = 0; i < widgetData.tabs.length; i++) {
            widgetItems.push({
                filter_id: widgetData.tabs[i].key,
                filter_text: widgetData.tabs[i].key,
                stroke_color: LiveclassHelper.getBarColorHomepage(widgetData.tabs[i].key),
                selected_color: '#fff4f1',
                filter_text_color: LiveclassHelper.getBarColorHomepage(widgetData.tabs[i].key),
                is_selected: (_.includes(subjectList, widgetData.tabs[i].key)),
            });
        }
        filterWidgets.data.items = widgetItems;
        const data = {};
        data.title = 'Free live class';
        data.filter_widgets = [filterWidgets];
        widgetData.tabs = [];
        if (subjectList.length > 0 && subjectList[0] !== '') {
            // filter widget items
            widgetData.items = widgetData.items.filter((item) => _.includes(subjectList, item.data.top_title));
        }

        data.widgets = paginationHandler(dataSize, page, widgetData.items);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getRecommendedCoursesByUserCategoty(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const trailCategory = ['U3V1', 'U3V2', 'U4V1', 'U4V2'];
        const { student_id: studentID, student_class: stClass, locale } = req.user;
        const language = locale && locale === 'hi' ? 'HINDI' : 'ENGLISH';
        const [targetGroup, userCategory, ccmIdData] = await Promise.all([
            PznContainer.getStudentTopTargetGroup(studentID),
            freeLiveClassHelper.getUserEngageCategory(studentID),
            StudentCourseMapping.getCcmIdWithCourseFromStudentId(db.mysql.read, studentID),
        ]);

        let cardItems = []; const data = {};
        if (_.includes(trailCategory, userCategory)) {
            cardItems = [{
                title: 'BADHAI HO, FREE TRIAL UNLOCKED',
                title_one_text_size: '12',
                title_one_text_color: '#004476',
                title_two: 'Koi bhi ek course select karein aur 3 din muft mei padhein.',
                title_two_text_size: '14',
                title_two_text_color: '#000000',
                left_strip_color: '#004476',
                bg_color1: '#c2e59c',
                bg_color2: '#96d0ff',
                deeplink: '',
                title_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73C68BF2-34E5-C7A8-4C69-9D37EB70DDE7.webp',
            }];
        } else {
            cardItems = [{
                title: 'LIMITED PERIOD OFFER',
                title_one_text_size: '12',
                title_one_text_color: '#00983c',
                title_two: 'Koi bhi ek course select karein aur paayein special discount ',
                title_two_text_size: '14',
                title_two_text_color: '#504949',
                left_strip_color: '#00983c',
                bg_color1: '#a1ffce',
                bg_color2: '#faffd1',
                deeplink: '',
                title_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/C71B2090-692C-0E64-7825-50B8762A7E9F.webp',
            }];
        }

        const categoryList = targetGroup && targetGroup.length ? targetGroup : [];
        if (!categoryList.length && (ccmIdData && ccmIdData.length)) {
            for (let i = 0; i < ccmIdData.length; i++) {
                categoryList.push(ccmIdData[i].course);
            }
        }
        for (let i = 0; i < categoryList.length; i++) {
            categoryList[i] = categoryList[i].toUpperCase() === 'CBSE' ? 'CBSE BOARDS' : categoryList[i];
        }

        const courseData = await CourseV2Mysql.getCourseDataByClassCategoryAndLocale(db.mysql.read, +stClass, language, categoryList);
        if (courseData && courseData.length) {
            const assortments = [];
            for (let i = 0; i < courseData.length; i++) {
                assortments.push(courseData[i].assortment_id);
            }
            const priceData = await CourseHelper.generateAssortmentVariantMapping(db, assortments, studentID, null, null);
            const items = [];
            for (let i = 0; i < courseData.length; i++) {
                if (priceData && priceData[courseData[i].assortment_id] && priceData[courseData[i].assortment_id].monthly_price) {
                    const cardColorData = _.sample(Data.trailCouponCard.trailCouponCardTagsColorImage);
                    const yearExam = courseData[i].year_exam ? `${+courseData[i].year_exam}-${+courseData[i].year_exam + 1}` : courseData[i].year_exam;
                    const widgetData = {
                        id: courseData[i].assortment_id,
                        assortment_id: courseData[i].assortment_id,
                        heading1: {
                            title: _.sample(['Best seller', 'Seats filling fast']),
                            title_color: '#000000',
                            background_color: cardColorData.text_color,
                            corner_radius: 4.0,
                        },
                        heading2: {
                            title: yearExam,
                            title_color: '#000000',
                            background_color: cardColorData.text_color,
                            corner_radius: 4.0,
                        },
                        description: courseData[i].display_description,
                        price: `₹${priceData[courseData[i].assortment_id].monthly_price}/Month`,
                        bottom_text: `${Math.floor(Math.random() * (2000 - 1000 + 1) + 1000)}+ students are taking this tuition`,
                        bottom_image: `${config.staticCDN}engagement_framework/DD95E370-3692-E233-E5A1-B70AC16796E9.webp`,
                        deeplink: `doubtnutapp://course_details?id=${courseData[i].assortment_id}`,
                        is_trial_card: _.includes(trailCategory, userCategory),
                        card_width: '1.0',
                        card_ratio: '19:10',
                        right_half: {
                            title: '',
                            subtitle: `${courseData[i].meta_info} Medium`,
                            bottom_text: `Course ID #${courseData[i].liveclass_course_id}`,
                            background: cardColorData.image_url,
                        },
                        cta: {
                            title: _.includes(trailCategory, userCategory) ? 'Get free for 3 days' : 'View details',
                            title_color: '#ffffff',
                            background_color: '#ea532c',
                            corner_radius: 12.0,
                        },
                    };
                    items.push(widgetData);
                }
            }

            if (items.length) {
                const courseWidgetData = { widget_type: 'widget_trial_course', widget_data: { scroll_direction: 'vertical', title: '', items } };
                courseWidgetData.layout_config = {
                    margin_top: 16,
                    margin_right: 0,
                    bg_color: '#ffffff',
                };
                const cardData = {
                    type: 'widget_gradient_card',
                    widget_data: {
                        scroll_direction: 'horizontal',
                        title: '',
                        items: cardItems,
                    },
                    layout_config: {
                        margin_top: 10,
                        margin_bottom: 0,
                        margin_left: 0,
                        margin_right: 0,
                    },
                };
                data.widgets = [cardData, courseWidgetData];
                data.title = 'Select a course';

                if (_.includes(trailCategory, userCategory)) {
                    data.pre_purchase_pop_up = Data.trailCouponCard.prePurchasePopUp;
                    data.post_purchase_pop_up = Data.trailCouponCard.postPurchasePopUp;
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    get,
    timeTable,
    pdfDownload,
    homeworkGet,
    homeworkReview,
    homeworkWidgets,
    homeworkSubmit,
    homeworkList,
    referralInfo,
    referralInfoWeb,
    addCallbackData,
    bestSeller,
    courseListing,
    purchasedCourseListing,
    courseFiltersSelection,
    popupDetailsForHelpFlow,
    courseListingForSwitch,
    getClassesOfChapterByQuestionID,
    dismissCallingCard,
    requestCallback,
    getCourseBottomSheet,
    getCoursePagePopups,
    bookmarkCourseResources,
    schedulerListing,
    getRecommendedCoursesByUserCategoty,
};
