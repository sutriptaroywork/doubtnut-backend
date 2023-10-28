const _ = require('lodash');
const moment = require('moment');
const Course = require('../../../modules/course');
const CourseContainer = require('../../../modules/containers/course');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const CourseMysql = require('../../../modules/mysql/course');
const Flagr = require('../../../modules/containers/Utility.flagr');
const CourseHelper = require('./course.helper');
const CourseHelperV4 = require('../../v4/course/course.helper');
const Data = require('../../../data/data');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const CourseManager = require('../../helpers/course');
const liveclassHelper = require('../../helpers/liveclass');
const LiveClassData = require('../../../data/liveclass.data');
const WidgetHelper = require('../../widgets/liveclass');
const CouponMySQL = require('../../../modules/mysql/coupon');
const Properties = require('../../../modules/mysql/property');
const freeLiveclassHelper = require('../../helpers/freeLiveClass');
const referralContainer = require('../../../modules/containers/referral');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');
const altAppData = require('../../../data/alt-app');
const BranchMysql = require('../../../modules/mysql/branch');

function courseList(req, res, next) {
    const db = req.app.get('db');
    const { student_class } = req.params;
    // //console.log(student_class);
    Course.getList(db.mysql.read, student_class).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: values,
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((error) => {
        next(error);
    });
}

async function getFacultyDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const facultyId = req.params.faculty_id;
        const ecmId = req.params.ecm_id;
        const studentId = req.user.student_id;
        const studentClass = req.user.student_class;
        const xAuthToken = req.headers['x-auth-token'];

        // const studentClass = 12;
        const promise = [];
        let categoryID = 1;
        const courseType = 'vod';
        const courseDetails = await CourseMysql.getByEcmID(db.mysql.read, ecmId);
        if (courseDetails.length > 0) {
            categoryID = courseDetails[0].category_id;
        }
        // subscribed students, coursename, experience
        promise.push(CourseContainer.getFacultyDetails(db, facultyId));
        promise.push(CourseContainer.getChapterDetailsV2(db, facultyId, ecmId));
        promise.push(CourseContainer.getEcmByIdAndClass(db, ecmId, studentClass));
        promise.push(CourseContainer.getRandomSubsViews({
            db,
            type: 'etoos_faculty',
            id: facultyId,
        }));
        promise.push(CourseMysql.getUserSubscription(db.mysql.read, studentId));
        promise.push(Flagr.evaluateServiceWrapper({
            db,
            xAuthToken,
            entityContext: { studentId: studentId.toString() },
            flagID: Data.categoryIDFlagrMap[categoryID],
            timeout: 3000,
        }));

        const resolvedPromises = await Promise.all(promise);
        const flagrResponse = resolvedPromises[5];
        const userSubscriptionData = resolvedPromises[4];
        const paymentCardState = CourseHelperV4.getPaymentCardStateV2({
            data: userSubscriptionData,
            courseType,
            categoryID,
            flagrResponse,
        });
        let data = {
            faculty_details: resolvedPromises[0][0],
            chapter_details: {
                title: `Chapters by ${resolvedPromises[0][0].name}`,
                chapters: resolvedPromises[1],
            },
        };
        data.faculty_details.video_title = 'Demo Video';
        data.faculty_details.page = 'E_FACULTY';
        data.share_message = Data.etoosSharingMessage;
        data.share_image_url = config.logo_path;
        data = await CourseHelper.mapData({
            db,
            originalData: data,
            ecmData: resolvedPromises[2],
            subscriberCount: resolvedPromises[3],
            paymentCardState,
            config,
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getLectures(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const chapterId = req.params.chapter_id;
        const promise = [];
        const studentClass = req.user.student_class;
        const { version_code: versionCode } = req.headers;
        const studentId = req.user.student_id;
        const premiumPdfVersionCode = 748;
        const xAuthToken = req.headers['x-auth-token'];
        const courseDetails = await CourseMysql.getByChapterID(db.mysql.read, chapterId);
        const categoryID = courseDetails[0].category_id;
        const courseType = 'vod';
        // studentClass = 12;

        promise.push(CourseContainer.getFacultyDetailsUsingChapterIdV2(db, chapterId, studentClass));
        promise.push(CourseContainer.getLectures(db, chapterId));
        promise.push(CourseMysql.getUserSubscription(db.mysql.read, studentId));
        promise.push(CourseContainer.getChapterDetailsUsingChapterId(db, chapterId));
        if (versionCode >= premiumPdfVersionCode) {
            promise.push(CourseContainer.getEResourcesFromChapterId(db, chapterId));
        } else {
            // old handling
            promise.push((async () => [])()); // mock empty promise
        }
        promise.push(CourseContainer.getRandomSubsViews({
            db,
            type: 'etoos_chapter',
            id: chapterId,
        }));
        // promise.push(Flagr.evaluate(db, studentId.toString(), {}, config.package_subscription_flagr_id, 500));
        const flagrResponse = await Flagr.evaluateServiceWrapper({
            db,
            xAuthToken,
            entityContext: { studentId: studentId.toString() },
            flagID: Data.categoryIDFlagrMap[categoryID],
            timeout: 3000,
        });
        const resolvedPromises = await Promise.all(promise);
        const userSubscriptionData = resolvedPromises[2];
        // const flagrResponse = resolvedPromises[6];
        const paymentCardState = CourseHelperV4.getPaymentCardStateV2({
            data: userSubscriptionData,
            courseType,
            categoryID,
            flagrResponse,
        });
        // sub count
        resolvedPromises[0][0].views = `${resolvedPromises[5].views}k`;
        resolvedPromises[0][0].lecture_count = `${resolvedPromises[1].length} videos`;
        const data = {
            faculty_details: resolvedPromises[0][0],
            isVip: paymentCardState.isVip ? 1 : 0,
            resource_details: resolvedPromises[4],
            lecture_details: {
                title: `Lectures by ${resolvedPromises[0][0].name} (${resolvedPromises[1].length} Videos)`,
                page: 'E_LECTURES',
                lectures: resolvedPromises[1],
            },
        };
        data.faculty_details.video_title = 'Demo Video';
        data.faculty_details.gradient_image_url = data.faculty_details.image_url;
        data.faculty_details.play_button_title = 'Watch demo video';
        data.faculty_details.gradient = Data.etoosGradient;
        if (resolvedPromises[3].length) {
            data.faculty_details.title = resolvedPromises[3][0].name;
        }
        data.bottom_button = {};
        data.bottom_button.button_text = (paymentCardState.isVip) ? 'Check your plan' : 'BUY NOW';
        data.bottom_button.action = {};
        data.bottom_button.type = 'button';
        data.bottom_button.action.action_activity = 'payment_page';
        data.bottom_button.data = {};
        data.bottom_button.data.variant_id = paymentCardState.variant_id;
        data.bottom_button.data.event_name = (paymentCardState.isTrial) ? 'trial' : 'vip';
        data.bottom_button.action.action_data = {
            chapter_id: chapterId,
        };
        data.share_message = Data.etoosSharingMessage;
        data.share_image_url = config.logo_path;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function get(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let ecmId = req.query.ecm_id;
        const { page } = req.query;
        const versionCode = req.headers.version_code;
        // versionCode = 695;
        // req.user.locale = 'hi';
        const { locale } = req.user;
        const { student_class } = req.query;
        const studentClass = (typeof student_class === 'undefined') ? req.user.student_class : student_class;
        const studentId = req.user.student_id;
        const limit = 10;
        let ecmListData = [];
        ecmListData = await CourseMysql.getEcmListData(db.mysql.read, studentClass);
        // get class list for etoos course
        if (((page == 1 && _.isEmpty(ecmId)) || _.isEmpty(ecmId)) && ecmListData.length > 0) {
            ecmId = ecmListData[0].filter_id;
        }
        const data = {};
        data.widgets = [];
        if (ecmId !== undefined) {
            const promise = [];
            promise.push(CourseContainer.getCaraouselsWithAppVersionCode(db, ecmId, locale, page, limit, studentClass, versionCode));
            promise.push(CourseMysql.checkVipWithExpiry(db.mysql.read, studentId));
            promise.push(Flagr.evaluate(db, studentId.toString(), {}, config.package_subscription_flagr_id, 500));
            const result = await Promise.all(promise);
            const [caraouselList, userSubscriptionData, flagrResponse] = result;
            const paymentCardState = await CourseHelper.getPaymentCardState({
                moment,
                data: userSubscriptionData,
                flagrResponse,
            });
            const caraouselData = await CourseHelper.getCaraouselData({
                db,
                caraouselList,
                ecmId,
                config,
                whatsappShareMessage: Data.whatsappShareMessage,
                next,
                studentClass,
                paymentCardState,
            });
            const courseButtonTabs = {
                type: 'filter_tabs',
                data: {
                    tabs: ecmListData,
                },
            };
            const meta = [];
            if (page == 1) {
                meta.push(courseButtonTabs);
                if (versionCode < Data.motionVersionCode) {
                    meta.push({
                        type: 'banner_image',
                        data: {
                            image_url: `${config.staticCDN}update_motion82.png`,
                        },
                        action: {
                            action_activity: 'external_url',
                            action_data: { url: 'https://play.google.com/store/apps/details?id=com.doubtnutapp' },
                        },
                    });
                }
            }
            data.widgets = [...meta, ...caraouselData];
            if (versionCode >= Data.motionVersionCode) {
                data.trial_button = {
                    type: 'button',
                    action: {
                        action_activity: 'payment_page',
                        action_data: {
                            ecm_id: ecmId,
                        },
                    },
                    button_text: (paymentCardState.isVip) ? 'Check your plan' : 'BUY NOW',
                    variant_id: paymentCardState.variantId,
                    event_name: (paymentCardState.isTrial) ? 'trial' : 'vip',
                };
            }
        }
        if (versionCode < Data.motionVersionCode) {
            data.widgets = data.widgets.filter((value) => ((value.type) === 'banner_image'));
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
    } catch (err) {
        console.log(err);
        next(err);
    }
}

async function list(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_class } = req.query;
        const ecmId = req.query.ecm_id;
        const { subject } = req.query;
        let { page } = req.query;
        page = (typeof page === 'undefined') ? 1 : page;
        const isVip = false;
        const studentClass = (typeof student_class === 'undefined') ? req.user.student_class : student_class;
        let ecmListData = [];
        ecmListData = await CourseMysql.getEcmListDataV2(db.mysql.read, studentClass);
        const courseData = await CourseContainer.getCourseList({
            db, studentClass, ecmId, subject, page,
        });
        let distinctSubject = [];
        if (!_.isNil(ecmId) && (ecmId !== '0')) {
            // get subject list
            distinctSubject = await CourseContainer.getDistinctSubject({
                db, studentClass, ecmId,
            });
        }
        const data = await CourseHelper.generateCoursesData({
            db,
            caraouselObject: { title: 'All courses', type: 'vertical_list' },
            caraouselData: courseData,
            isVip,
            config,
            page,
            distinctSubject,
        });
        ecmListData.push({ key: 0, value: 'All courses' });
        if (page == 1) {
            data.data.course_filter = ecmListData;
        }
        const resp = {};
        data.type = 'all_course';
        if (data !== false) {
            resp.widgets = [data];
        } else {
            resp.widgets = [];
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: resp,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        next({ error });
    }
}

async function timeTable(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { locale, student_id: studentID } = req.user;
        let { assortment_id: assortmentID, studentClass } = req.query;
        const { is_browser: isBrowser } = req.headers;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        const { page } = req.query;
        const { monthArr, monthArrHi } = LiveClassData;
        const { week } = LiveClassData;
        const requiredMonthArr = locale === 'hi' ? monthArrHi : monthArr;
        let currentDate = moment().add(5, 'hours').add(30, 'minutes').subtract(page - 1, 'month');
        if (page > 1) {
            currentDate = currentDate.endOf('month');
        }
        // const endDate = currentDate.format('YYYY-MM-DD HH:mm:ss');
        const startDate = moment().add(5, 'hours').add(30, 'minutes').subtract(page - 1, 'month')
            .startOf('month')
            .format('YYYY-MM-DD HH:mm:ss');
        assortmentID = assortmentID.split('||')[0];
        if (assortmentID.includes('xxxx')) {
            const studentCcmData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db.mysql.read, studentID);
            assortmentID = await CourseManager.getAssortmentByCategory(db, studentCcmData, studentClass, (assortmentID.split('_')[1]) ? assortmentID.split('_')[1] : locale);
        }
        const studentPackageList = await CourseContainerv2.getUserActivePackages(db, studentID);
        if (assortmentID === 'paid') {
            assortmentID = studentPackageList.length ? studentPackageList[0].assortment_id : 165057;
        }
        const courseDetail = await CourseV2Mysql.getAssortmentDetailsFromId(db.mysql.read, assortmentID);
        const limit = 5;
        const offset = (page - 1) * limit;
        let widgets = [];
        const monthWidget = [];
        let today = {
            tag: '',
            day: '',
            date: '',
        };
        const batchID = _.find(studentPackageList, ['assortment_id', +assortmentID]) ? _.find(studentPackageList, ['assortment_id', +assortmentID]).batch_id : 1;
        if (courseDetail[0].schedule_type === 'recorded') {
            const chapterList = await CourseV2Mysql.getChapterListOfAssortment(db.mysql.read, null, assortmentID, courseDetail[0].assortment_type, limit, offset);
            const chapterAssortmentList = [];
            chapterList.map((item) => chapterAssortmentList.push(item.course_resource_id));
            if (courseDetail[0].assortment_type === 'chapter' && !offset) {
                chapterAssortmentList.push(assortmentID);
            }
            const result = await CourseManager.getCourseDataByCardId({
                db,
                cardID: 'recent',
                offset,
                batchID,
                subject: null,
                studentID,
                courseDetail,
                chapterAssortmentList,
            });
            const chapterGroupedData = _.groupBy(result, 'chapter');
            for (const key in chapterGroupedData) {
                if (chapterGroupedData[key]) {
                    widgets.push(WidgetHelper.getAllClassesWidget({ result: chapterGroupedData[key], chapterName: key, locale }));
                }
            }
            if (widgets.length === 1) {
                widgets[0].data.is_expanded = true;
            }
            monthWidget.push({
                type: 'schedule_month_filter',
                data: {
                    title: locale === 'hi' ? 'चैप्टर के हिसाब से पढ़ें' : 'Chapter ke hisaab se padhein',
                    sub_title: '',
                    items: [],
                },
            });
        } else {
            let resourceList = [];
            // get resources of course based on offset values
            resourceList = await CourseManager.getResourcesForTimeline(db, assortmentID, studentID, batchID, page, courseDetail[0].assortment_type);
            const currentYear = resourceList.length ? moment(resourceList[0].live_at).format('YYYY') : currentDate.format('YYYY');
            // while ((!resourceList.length && i < 7) || prevMonth === startDate) {
            //     currentYear = currentDate.format('YYYY');
            //     resourceList = await CourseManager.getResourcesByAssortmentList(db, assortmentList, startDate, endDate, studentID, batchID);
            //     if (isBrowser && resourceList && resourceList.length) {
            //         resourceList = resourceList.filter((item) => item.is_active !== 'ACTIVE');
            //     }
            //     currentDate = currentDate.subtract(1, 'month').endOf('month');
            //     endDate = currentDate.format('YYYY-MM-DD HH:mm:ss');
            //     startDate = moment(startDate).subtract(1, 'month').format('YYYY-MM-DD HH:mm:ss');
            //     i++;
            // }
            let branchDeeplink;
            if (isBrowser) {
                branchDeeplink = await CourseContainerv2.getCourseDetailsBranchDeeplinkFromAppDeeplink(db, assortmentID);
            }
            widgets = CourseManager.getTimetableData(db, config, resourceList, true, locale, currentYear, branchDeeplink);
            today = {
                tag: `${requiredMonthArr[new Date().getMonth()]}`,
                day: `${week[new Date().getDay()]}`,
                date: `${new Date().getDate()}`,
            };
            const items = [];
            if (widgets.length) {
                const monthTag = locale === 'hi' ? `${monthArrHi[monthArr.indexOf(widgets[0].data.tag)]} ${currentDate.format('YYYY')}` : `${widgets[0].data.tag} ${currentDate.format('YYYY')}`;
                let title = locale === 'hi' ? 'पुराने रिकॉर्डेड क्लासेस' : 'Purane Recorded Lectures';
                if (courseDetail[0].sub_assortment_type === 'mock_test') {
                    title = locale === 'hi' ? 'पुराने टेस्ट' : 'Purane Tests';
                }
                monthWidget.push({
                    type: 'schedule_month_filter',
                    data: {
                        title,
                        sub_title: monthTag || '',
                        items,
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
                title: '',
                widgets,
                today,
                prev_month: startDate, // moment(startDate).add(1, 'month').format('YYYY-MM-DD HH:mm:ss'),
                filter_widgets: monthWidget,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getConsecutiveChaptersLectureSeries({
    db, studentID, questionID, locale,
}) {
    try {
        const userPackages = await CourseContainerv2.getUserActivePackages(db, studentID);
        // * Filter out course or class assortment from (studentSubscriptionDetails) object array for my_courses carousel on home page
        const studentSubscriptionDetails = userPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.amount !== -1);
        const {
            result, subjectAssortmentID, batchID, courseAssortment,
        } = await CourseManager.getLectureSeriesByQuestionID(db, questionID, studentSubscriptionDetails, studentID);
        let lectureList = result;
        let scrollPosition = 0;
        let widgets = [];
        if (lectureList.length) {
            const qIdList = [];
            lectureList.map((item) => qIdList.push(item.resource_reference));
            const [
                nextChapter,
                prevChapter,
                downloadableVideos,
            ] = await Promise.all([
                CourseV2Mysql.getNextChapterOfSubject(db.mysql.read, subjectAssortmentID, result[0].chapter_assortment_id),
                CourseV2Mysql.getPrevChapterOfSubject(db.mysql.read, subjectAssortmentID, result[0].chapter_assortment_id),
                CourseV2Mysql.getDownloadableQids(db.mysql.read, qIdList),
            ]);
            for (let i = 0; i < lectureList.length; i++) {
                const obj = _.find(downloadableVideos, ['question_id', +lectureList[i].resource_reference]);
                if (obj) {
                    lectureList[i].vdo_cipher_id = obj.vdo_cipher_id;
                    lectureList[i].is_vdo_ready = obj.is_vdo_ready;
                }
                if (lectureList[i].resource_reference === questionID) {
                    scrollPosition = i;
                }
            }
            const chapterList = [];
            if (prevChapter.length) {
                chapterList.push(prevChapter[0].course_resource_id);
            }
            if (nextChapter.length) {
                chapterList.push(nextChapter[0].course_resource_id);
            }
            const prevLectureSeries = [];
            const nextLectureSeries = [];
            if (chapterList.length) {
                const consecutiveChapterSeries = await CourseV2Mysql.getPastVideoResourcesOfChapter(db.mysql.read, chapterList, batchID);
                for (let i = 0; i < consecutiveChapterSeries.length; i++) {
                    if (prevChapter.length && consecutiveChapterSeries[i].chapter === prevChapter[0].name) {
                        prevLectureSeries.push(consecutiveChapterSeries[i]);
                    }
                    if (nextChapter.length && consecutiveChapterSeries[i].chapter === nextChapter[0].name) {
                        nextLectureSeries.push(consecutiveChapterSeries[i]);
                    }
                }
                lectureList = [...prevLectureSeries, ...lectureList, ...nextLectureSeries];
            }
            const resourceList = [];
            lectureList.forEach((item) => resourceList.push(item.id));
            const bookmarkedNotes = await CourseV2Mysql.getBookMarkedResourcesByResourceId(db.mysql.read, studentID, resourceList);
            lectureList.forEach((item) => {
                item.course_assortment_id = courseAssortment;
                if (_.find(bookmarkedNotes, ['course_resource_id', item.id])) {
                    item.is_bookmarked = 1;
                } else {
                    item.is_bookmarked = 0;
                }
            });
            lectureList = _.uniqBy(lectureList, 'resource_reference');
            widgets = WidgetHelper.getWidgetCourseClasses({
                lectureList, locale, questionID, type: 'paid_video_page',
            });
            scrollPosition += prevLectureSeries.length;
            scrollPosition = scrollPosition > 2 ? scrollPosition - 2 : scrollPosition;
        }
        return { widgets, scrollPosition };
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getVideopageWidgets(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { locale, student_id: studentID, student_class: studentClass } = req.user;
        const { 'x-auth-token': xAuthToken, version_code: versionCode } = req.headers;
        const { question_id: questionID } = req.query;
        const { tab_id: tabID } = req.query;
        let data = {};
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        if (isFreeApp) {
            return next({ data: {} });
        }
        let nextLecture = [];
        const qIdAssortmentDetails = await CourseContainerv2.getAssortmentsByResourceReferenceV1(db, questionID); // TODO: Keep assortment in redis question has assortment_{class}
        if (_.isEmpty(qIdAssortmentDetails)) {
            // resource does not exist
            return next({
                message: 'Invalid resource',
                status: 400,
                isPublic: true,
            });
        }
        const vipDetailsByQid = await CourseManager.checkVipByResourceReference(db, qIdAssortmentDetails, studentID, questionID);
        const { userPackages: filteredUserSubscription } = vipDetailsByQid;
        const batchID = filteredUserSubscription.length ? filteredUserSubscription[0].batch_id : 1;
        const videoDetails = await CourseContainerv2.getLiveStreamDetailsByQuestionID(db, questionID);
        let newVideoPage = false;
        let design = 1;
        let studentLiveclassET = 0;
        if (!filteredUserSubscription.length) {
            // const flagrResp = await CourseManager.getFlagrResponseByFlagKey(xAuthToken, ['free_video_page_v2']);
            const flagrResp = await CourseContainerv2.getFlagrResp(db, 'free_video_page_v2', studentID);
            if (_.get(flagrResp, 'free_video_page_v2.payload.enabled')) {
                newVideoPage = true;
                design = _.get(flagrResp, 'free_video_page_v2.payload.design');
            }
            studentLiveclassET = await freeLiveclassHelper.getLast30DaysEngagement(studentID);
        }
        if (filteredUserSubscription.length) {
            // paid user video page
            const filteredUserSubscriptionArray = filteredUserSubscription.map((item) => item.assortment_id);
            nextLecture = await CourseV2Mysql.getNextLectureOfSameSubjectVideoPage(db.mysql.read, [questionID], batchID, filteredUserSubscriptionArray);
            let [
                quizList,
                homeworkData,
                notesData,
            ] = await Promise.all([
                CourseV2Mysql.getQuizLogsFromVod(db.mysql.read, questionID),
                CourseContainerv2.getHomeworkByQuestionIDWithBatchCheck(db, questionID, studentID),
                CourseContainerv2.getNotesByQuestionID(db, questionID),
            ]);
            const liveStreamDetails = videoDetails.filter((e) => e.batch_id === batchID);
            quizList = quizList.filter((e) => e.batch_id === batchID && e.visibility_timestamp !== null);
            homeworkData = homeworkData.filter((e) => e.batch_id === batchID);
            notesData = notesData.filter((e) => e.batch_id === batchID);
            const topicTimestamps = [];
            let videoBookmarkData = [];
            if (liveStreamDetails.length) {
                videoBookmarkData = await CourseV2Mysql.getBookMarkedResourcesByResourceId(db.mysql.read, studentID, [videoDetails[0].detail_id]);
                // const offsetTopics = liveStreamDetails[0].name.split('|');
                const { startTimeTitle, offsetsArr, offsetTopics } = WidgetHelper.createTitleWithtimestamps(liveStreamDetails[0], locale);
                const startTimeArr = startTimeTitle.split('|');
                for (let i = 0; i < startTimeArr.length - 1; i++) {
                    topicTimestamps.push({
                        title: offsetTopics[i],
                        offset_title: startTimeArr[i],
                        offset: offsetsArr[i] * 1000,
                    });
                }
            }
            let k = 0;
            const topics = topicTimestamps;
            for (let i = 0; i < topicTimestamps.length && k < quizList.length; i++) {
                const quizTime = quizList[k].visibility_timestamp * 1000;
                if (topicTimestamps[i].offset > quizTime) {
                    topics.splice(i, 0, {
                        title: `Quiz ${k + 1}`,
                        offset_title: quizList[k].visibility_timestamp > 3600 ? `${moment().startOf('day').add(quizList[k].visibility_timestamp * 1000).format('HH:mm:ss')}` : `${moment().startOf('day').add(quizList[k].visibility_timestamp * 1000).format('mm:ss')}`,
                        offset: quizTime,
                    });
                    k++;
                }
            }
            if (k < quizList.length) {
                for (let i = k; i < quizList.length; i++) {
                    topics.push({
                        title: `Quiz ${k + 1}`,
                        offset_title: quizList[i].visibility_timestamp > 3600 ? `${moment().startOf('day').add(quizList[i].visibility_timestamp * 1000).format('HH:mm:ss')}` : `${moment().startOf('day').add(quizList[i].visibility_timestamp * 1000).format('mm:ss')}`,
                        offset: quizList[i].visibility_timestamp * 1000,
                    });
                }
            }
            let widgets = [];
            // get tab values if respective data is present for qid
            const filters = CourseHelper.getVideoPageTabsList(tabID, topics, homeworkData, notesData, locale);
            if (!filters.data.items.length) {
                // if no homework, pdf present for respective chapter, then show the lecture series for that chapter
                const { widgets: widgetData } = await getConsecutiveChaptersLectureSeries({
                    db, studentID, questionID, locale,
                });
                widgets = widgetData;
            }

            data = {
                title: videoDetails[0].display,
                subject: videoDetails[0].subject,
                subject_color: liveclassHelper.getBarColorForLiveclassHomepage(videoDetails[0].subject.toUpperCase()),
                next_video_title: null,
                course_resource_id: videoDetails[0].detail_id,
                next_btn_millis: videoDetails[0].duration,
                assortment_id: filteredUserSubscription[0].assortment_id,
                buttons: CourseHelper.getVideoPageIconsList(config, videoBookmarkData, false),
                widgets,
                topic_list: topics,
                tab_list: filters.data.items, // list of tab values to be displayed
            };
        } else if (versionCode < 989 || !newVideoPage) {
            const {
                result, subjectAssortmentID, topic,
            } = await CourseManager.getLectureSeriesByQuestionID(db, questionID, filteredUserSubscription, studentID);
            let widgets = [];
            if (result.length) {
                widgets = await CourseHelper.getWidgetsForChapterCarousel({
                    db, locale, config, result, subjectAssortmentID, topic,
                });
            }
            const paidCoursesData = await CourseManager.getPaidAssortmentsData({
                db,
                studentClass,
                config,
                versionCode,
                studentId: studentID,
                studentLocale: locale,
                xAuthToken,
                page: 'VIDEO_PAGE',
                eventPage: '',
                questionID,
            });
            if (paidCoursesData && paidCoursesData.items && paidCoursesData.items.length) {
                widgets.push({
                    type: 'widget_parent',
                    data: {
                        title: paidCoursesData.carouselTitle || '',
                        items: paidCoursesData.items,
                    },
                });
            }
            if (videoDetails[0].tags === 'NKC_SIR') {
                const bucketName = 'NKC_SIR';
                const getBanner = await CourseV2Mysql.getDNPropertyBanner(db.mysql.read, bucketName);
                const bannerWidget = {
                    type: 'banner_image',
                    data: {
                        _id: 7001,
                        image_url: !_.isEmpty(getBanner) ? getBanner[0].value : `${config.staticCDN}engagement_framework/9C2A6D73-83F8-D161-3508-A31645ED20A6.webp`,
                        deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/nkc',
                        card_ratio: '12:3',
                        card_width: '1.0',
                    },
                };
                widgets.unshift(bannerWidget);
            }
            const videoBookmarkData = [];
            data = {
                title: videoDetails[0].display,
                subject: videoDetails[0].subject,
                subject_color: liveclassHelper.getBarColorForLiveclassHomepage(videoDetails[0].subject.toUpperCase()),
                widgets,
                buttons: CourseHelper.getVideoPageIconsList(config, videoBookmarkData, true),
            };
        } else if (+design === 1 && studentLiveclassET < 1200) {
            const newSimilar = 1;
            const widgets = await CourseHelper.getFreeClassesContentByQId({
                db, questionID, filteredUserSubscription, studentID, locale, config, studentClass, source: 'free_video_page', newSimilar,
            });
            data = {
                widgets,
                fab_deeplink: `doubtnutapp://course_bottom_sheet_v2?type=course_list&qid=${questionID}`,
            };
        } else if (+design === 1) {
            let widgets; const newSimilar = 1;
            widgets = await CourseHelper.getCoursesWidgetsByQid({
                db, studentClass, config, versionCode, studentID, studentLocale: locale, xAuthToken, questionID, videoDetails, source: 'free_video_page',
            });
            if (widgets.length === 0) {
                widgets = await CourseHelper.getFreeClassesContentByQId({
                    db, questionID, filteredUserSubscription, studentID, locale, config, studentClass, source: 'free_video_page', newSimilar,
                });
            }
            data = {
                widgets,
            };
        } else {
            const freeClassesFilter = {
                id: 'free_classes',
                key: 'free_classes',
                display: locale === 'hi' ? 'फ्री क्लासेस' : 'Free Classes',
                text: locale === 'hi' ? 'फ्री क्लासेस' : 'Free Classes',
                is_selected: tabID === 'free_classes' || !tabID,
            };
            const tutionsFilter = {
                id: 'tutions',
                key: 'tutions',
                display: locale === 'hi' ? 'ट्यूशन' : 'Tuitions',
                text: locale === 'hi' ? 'ट्यूशन' : 'Tuitions',
                is_selected: tabID === 'tutions',
            };
            const filters = [
                {
                    id: 'free_notes',
                    key: 'free_notes',
                    display: 'PDF',
                    text: 'PDF',
                    is_selected: tabID === 'pdf',
                },
            ];
            if (studentLiveclassET < 1200) {
                filters.unshift(freeClassesFilter);
                filters.push(tutionsFilter);
            } else {
                filters.unshift(freeClassesFilter);
                filters.unshift(tutionsFilter);
            }
            data.tab_list = filters;
            data.widgets = [];
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        if (nextLecture.length) {
            const durationDetails = await CourseV2Mysql.getAnswerIdbyQuestionId(db.mysql.read, questionID);
            // to show banner on bottom of page
            responseData.data.next_video_title = nextLecture[0].display;
            // this is used to show next lecture link on video, 5 mins before video ends
            if (videoDetails && nextLecture[0].chapter !== videoDetails[0].chapter) {
                responseData.data.next_video = locale === 'hi' ? 'अगली अध्याय' : 'Next Chapter';
            } else {
                responseData.data.next_video = locale === 'hi' ? 'अगली क्लास' : 'Next lecture';
            }
            responseData.data.next_video_qid = nextLecture[0].resource_reference;
            responseData.data.next_btn_millis = durationDetails.length && durationDetails[0].duration > 300 ? (durationDetails[0].duration - 300) * 1000 : 5000;
            responseData.data.next_chapter_deeplink = `doubtnutapp://video?qid=${nextLecture[0].resource_reference}&page=LIVECLASS`;
        }
        responseData.data.title = videoDetails[0].display;
        responseData.data.subject = videoDetails[0].subject;
        responseData.data.faculty_name = videoDetails[0].expert_name;
        responseData.data.subject_color = liveclassHelper.getBarColorForLiveclassHomepage(videoDetails[0].subject.toUpperCase());
        if (!filteredUserSubscription.length) {
            responseData.data.title = `${videoDetails[0].display}\nBy ${videoDetails[0].expert_name || ''}`;
            // TODO : check for upcoming classes
            if (!(moment().add(5, 'hours').add(30, 'minutes').isBefore(videoDetails[0].live_at))) {
                responseData.data.video_action_layout = '2';
            } else {
                responseData.data.buttons = [
                    {
                        id: '',
                        deeplink: '',
                        image_url: '',
                    },
                    {
                        id: '',
                        deeplink: '',
                        image_url: '',
                    },
                    {
                        id: 'comment',
                        deeplink: '',
                        image_url: `${config.staticCDN}engagement_framework/icon_small_comment.webp`,
                    },
                    {
                        id: 'share',
                        deeplink: '',
                        image_url: `${config.staticCDN}images/2021/12/23/11-16-23-699-AM_Share.webp`,
                    },
                ];
            }
            responseData.data.views_label = await CourseHelper.generateLikesDurationText(db, videoDetails, locale);
            // responseData.data.subject_color = liveclassHelper.getColorForFreeClassVideoPage(videoDetails[0].subject.toUpperCase());
            responseData.data.subject_color = liveclassHelper.getSubjectColorForSubjectCards(videoDetails[0].subject.toUpperCase());
        }
        res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        next({ err });
    }
}

async function getVideoPageTabsData(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale, student_class: studentClass } = req.user;
        const { version_code: versionCode, x_auth_token: xAuthToken } = req.headers;
        const { question_id: questionID, tab_id: tabID } = req.query;
        const qIdAssortmentDetails = await CourseContainerv2.getAssortmentsByResourceReferenceV1(db, questionID);
        // eslint-disable-next-line prefer-const
        let [vipDetailsByQid, liveStreamDetails] = await Promise.all([CourseManager.checkVipByResourceReference(db, qIdAssortmentDetails, studentID, questionID), CourseContainerv2.getLiveStreamDetailsByQuestionID(db, questionID)]);
        const { userPackages: filteredUserSubscription } = vipDetailsByQid;
        const batchID = filteredUserSubscription.length ? filteredUserSubscription[0].batch_id : 1;
        liveStreamDetails = liveStreamDetails.filter((e) => e.batch_id === batchID);
        // get data from db based on tab id
        const result = await CourseHelper.getTabDataByTabId({
            db, tabID, batchID, questionID, studentID, filteredUserSubscription, liveStreamDetails, locale, studentClass, config, xAuthToken, versionCode,
        });
        // generate widget json based on tab id
        const widgets = await CourseHelper.getTabWidgetsByTabId({
            db, tabID, result, config, locale, studentID, videoDetails: liveStreamDetails, studentClass, tabs: true, source: 'free_video_page',
        });

        if (widgets.length === 0) {
            const title = locale === 'hi' ? 'बहुत अच्छे!👍\nआपने सारे उपलब्ध कोर्सेस खरीद लिए है।\nपढाई जारी रखें!' : 'GREAT!👍\nYou have purchased all available courses\nKeep studying!';
            widgets.push({
                type: 'text_widget',
                data: {
                    title,
                    alignment: 'center',
                    force_hide_right_icon: true,
                    deeplink: '',
                },
                layout_config: {
                    margin_top: 80,
                    margin_bottom: 0,
                    margin_left: 16,
                    margin_right: 16,
                },
            });
        }
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
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getNextLectureSeries(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale, student_class: studentClass } = req.user;
        const { question_id: questionID, type } = req.query;
        const { version_code: versionCode, x_auth_token: xAuthToken } = req.headers;
        let data = {};
        if (type === 'course_list') {
            const videoDetails = await CourseContainerv2.getLiveStreamDetailsByQuestionID(db, questionID);
            const widgets = await CourseHelper.getCoursesWidgetsByQid({
                db, studentClass, config, versionCode, studentID, studentLocale: locale, xAuthToken, questionID, bottomSheet: true, videoDetails, source: 'free_video_page_bottom_sheet',
            });
            data = {
                title: '',
                widgets,
            };
        } else if (type === 'free_classes') {
            const newSimilar = 1;
            const widgets = await CourseHelper.getFreeClassesContentByQId({
                db, questionID, filteredUserSubscription: [], studentID, locale, config, studentClass, source: 'free_video_page_bottom_sheet', newSimilar,
            });
            data = {
                title: '',
                widgets,
            };
        } else {
            const {
                widgets, scrollPosition,
            } = await getConsecutiveChaptersLectureSeries({
                db, studentID, questionID, locale,
            });
            data = {
                title: '',
                widgets,
                scroll_position: scrollPosition,
            };
        }

        if (data.widgets.length === 0) {
            const title = locale === 'hi' ? 'बहुत अच्छे!👍\nआपने सारे उपलब्ध कोर्सेस खरीद लिए है।\nपढाई जारी रखें!' : 'GREAT!👍\nYou have purchased all available courses\nKeep studying!';
            data.widgets.push({
                type: 'text_widget',
                data: {
                    title,
                    alignment: 'center',
                    force_hide_right_icon: true,
                    deeplink: '',
                },
                layout_config: {
                    margin_top: 80,
                    margin_bottom: 0,
                    margin_left: 16,
                    margin_right: 16,
                },
            });
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

async function shareInfo(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID } = req.user;
        const { referee_name: refereeName, referee_phone: refereePhone } = req.body;
        if (refereePhone) {
            await CourseV2Mysql.addReferralShareInfo(db.mysql.write, { referee_name: refereeName, referee_phone: refereePhone, student_id: studentID });
            const refreeSid = await CourseV2Mysql.getRefreeSId(db.mysql.read, refereePhone);
            if (refreeSid.length) {
                const refreeStudentID = refreeSid[0].referee_student_id;
                await BranchMysql.addCampaignSidMapping(db.mysql.write, { student_id: refreeStudentID, campaign: `CEO_REFERRAL_DUMMY;;;${studentID}`, is_active: 1 });
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Empty phone number',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function referralInfo(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentID, locale } = req.user;
        const { page, from_whatsapp: fromWhatsapp } = req.query;
        let studentLocale = 'en';
        if (locale == 'hi') {
            studentLocale = 'hi';
        } else {
            studentLocale = 'en';
        }

        const iteration = 'referral_ceo_v3';
        const [referralCount, referralCodeInfo, referralCountDnProperty, referralMessage, branchData] = await Promise.all([CourseV2Mysql.getPaymentReferralEntries(db.mysql.read, studentID), CouponMySQL.getInfoByStudentId(db.mysql.read, studentID), Properties.getNameAndValueByBucket(db.mysql.read, 'mlm_referral_invitor_claim_amount_mapping'), CourseV2Mysql.getAllReferralMessagesUsingLocale(db.mysql.read, [studentLocale], iteration), fromWhatsapp ? referralContainer.getReferralBranchLinkWA(db, studentID) : referralContainer.getReferralBranchLink(db, studentID)]);
        const branchLink = branchData.url;
        if (page == 0) {
            let data;
            switch (referralCount.length) {
                case 0: {
                    const widgetOrder = ['referral_video_widget', 'referral_steps_widget', 'referral_calling_widget', 'referral_goodie_widget', 'referral_level_widget', 'referral_testimonial_widget', 'referral_text_widget', 'referral_faq_widget'];
                    const promise = [];
                    for (let i = 0; i < widgetOrder.length; i++) {
                        promise.push(CourseHelper.getReferralV2Widgets(widgetOrder[i], referralCount, referralCountDnProperty, studentLocale, db));
                    }
                    data = await Promise.all(promise);
                    break;
                }
                case referralCountDnProperty.length: {
                    const widgetOrder = ['referral_winner_congratulation_widget', 'referral_winner_earn_more_widget', 'referral_testimonial_widget', 'referral_text_widget', 'referral_faq_widget'];
                    const promise = [];
                    for (let i = 0; i < widgetOrder.length; i++) {
                        promise.push(CourseHelper.getReferralV2Widgets(widgetOrder[i], referralCount, referralCountDnProperty, studentLocale, db));
                    }
                    data = await Promise.all(promise);
                    break;
                }
                default: {
                    const widgetOrder = ['referral_video_widget', 'referral_level_widget', 'referral_earn_more_widget', 'referral_steps_widget', 'referral_goodie_widget', 'referral_calling_widget', 'referral_testimonial_widget', 'referral_text_widget', 'referral_faq_widget'];
                    if (referralCount.length >= 3) {
                        const goodieData = await CourseV2Mysql.getReferralRewardWinnerData(db.mysql.read, referralCount[referralCount.length - 1].id);
                        const lastReferral = _.get(referralCountDnProperty, `[${referralCount.length - 1}]`, {});
                        if (!_.isEmpty(lastReferral) && lastReferral.value.includes('://') && (goodieData.length == 0 || (goodieData.length > 0 && !goodieData[0].is_verified))) {
                            widgetOrder.splice(1, 0, 'referral_claim_widget');
                        }
                    }
                    const promise = [];
                    for (let i = 0; i < widgetOrder.length; i++) {
                        promise.push(CourseHelper.getReferralV2Widgets(widgetOrder[i], referralCount, referralCountDnProperty, studentLocale, db));
                    }
                    data = await Promise.all(promise);
                    break;
                }
            }

            const response = {
                data,
                mobile: '01247158250',
                title: 'CEO Refer & Earn',
                button: {
                    text: `Share Referral Code ‘${referralCodeInfo[0].coupon_code.toUpperCase()}’`,
                    icon: Data.referral_v2.share_button_icon,
                    bg_color: '#54b726',
                    share_message: referralMessage[0].message.replace(/<referral_code>/g, referralCodeInfo[0].coupon_code.toUpperCase()).replace(/<branch_link>/g, branchLink),
                    share_contact_batch_size: Data.referral_v2.share_contact.batch_size,
                },
                branch_link: branchLink,
                coupon_code: referralCodeInfo[0].coupon_code.toUpperCase(),
            };
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: response,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const response = {
                data: [],
                mobile: '01247158250',
                title: 'CEO Refer & Earn',
                button: {
                    text: `Share Referral Code ‘${referralCodeInfo[0].coupon_code.toUpperCase()}’`,
                    icon: Data.referral_v2.share_button_icon,
                    bg_color: '#54b726',
                    share_message: referralMessage[0].message.replace(/<referral_code>/g, referralCodeInfo[0].coupon_code.toUpperCase()).replace(/<branch_link>/g, branchLink),
                    share_contact_batch_size: Data.referral_v2.share_contact.batch_size,
                },
                branch_link: branchLink,
                coupon_code: referralCodeInfo[0].coupon_code.toUpperCase(),
            };
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: response,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    get, getFacultyDetail, getLectures, courseList, list, timeTable, getVideopageWidgets, getNextLectureSeries, getVideoPageTabsData, referralInfo, shareInfo, getConsecutiveChaptersLectureSeries,
};
