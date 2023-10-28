const _ = require('lodash');
const Liveclass = require('../../../modules/mysql/liveclass');
const CourseMysql = require('../../../modules/mysql/course');
const LiveclassHelperLocal = require('./course.helper');
const LiveclassHelper = require('../../helpers/liveclass');
const CourseHelper = require('../../v4/course/course.helper');

async function resourcePage(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        let { detail_id: detailID, recorded, studentClass } = req.query;
        const { version_code: versionCode } = req.headers;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        if (!detailID) detailID = 2883;
        let studentPackageList;
        let resourceList;
        let notes = [];
        let etoosNotes = [];
        recorded = parseInt(recorded);
        if (recorded) {
            [
                studentPackageList,
                resourceList,
                etoosNotes,
            ] = await Promise.all([
                CourseMysql.getUserSubscription(db.mysql.read, studentID),
                CourseMysql.getFacultyDetailsUsingChapterIdV3(db.mysql.read, detailID, studentClass),
                CourseMysql.getEResourcesFromChapterIdV1(db.mysql.read, detailID),
            ]);
        } else {
            [
                studentPackageList,
                resourceList,
            ] = await Promise.all([
                CourseMysql.getUserSubscription(db.mysql.read, studentID),
                Liveclass.getResourceDetailsForStructuredCourse(db.mysql.read, detailID, studentClass),
            ]);
        }

        let paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType: recorded ? 'vod' : resourceList[0].course_type,
            categoryID: recorded ? 1 : resourceList[0].category_id,
        });

        if (recorded && !paymentCardState.isVip) {
            paymentCardState = CourseHelper.getPaymentCardStateV2({
                data: studentPackageList,
                courseType: 'vod',
                categoryID: 6,
            });
        }

        let widgets = [];
        let lectures = [];
        if (recorded) {
            widgets = await LiveclassHelperLocal.getResourcePageResponseForRecorded({
                resourceList, db, config, paymentCardState, versionCode,
            });
            notes = LiveclassHelperLocal.getNotesData(etoosNotes, paymentCardState, recorded);
            const data = await CourseMysql.getRelatedLectures(db.mysql.read, detailID, resourceList[0].master_chapter, resourceList[0].liveclass_course_id);
            lectures = await LiveclassHelperLocal.getRelatedLectures(data, config, paymentCardState, db, studentID, true, recorded);
        } else {
            const resourceListVideo = resourceList.filter((e) => (_.includes([1, 4, 8], e.resource_type)));
            const resourceListNotes = resourceList.filter((e) => (_.includes([2, 3], e.resource_type)));
            widgets = await LiveclassHelperLocal.getResourcePageResponse({
                resourceListVideo, resourceList, db, config, paymentCardState, versionCode,
            });
            notes = LiveclassHelperLocal.getNotesData(resourceListNotes, paymentCardState, recorded);
            const data = await Liveclass.getRelatedLectures(db.mysql.read, detailID, LiveclassHelper.quotesEscape(resourceList[0].master_chapter), resourceList[0].liveclass_course_id, studentClass);
            lectures = await LiveclassHelperLocal.getRelatedLectures(data, config, paymentCardState, db, studentID, true, recorded);
        }
        if (notes.length) {
            widgets.push({ type: 'resource_notes', data: { title: 'Notes', items: notes, recorded } });
        }
        widgets.push({ type: 'related_lecture', data: { title: 'ALL CLASSES', bg_color: '#66e0eaff', items: lectures } });

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getCourseDetail(_req, res, next) {
    try {
        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: {},
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function courseTabDetail(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        let {
            course_id: courseId, studentClass, tab, subject,
        } = req.query;
        const { page } = req.query;
        if (!courseId) courseId = 2;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        if (!subject) subject = 'ALL';
        if (!tab) tab = 'recent';
        const limit = 40;
        const offset = (page - 1) * 40;
        console.log(tab);
        const [
            studentPackageList,
            course,
        ] = await Promise.all([
            CourseMysql.getUserSubscription(db.mysql.read, studentID),
            Liveclass.getCourseDetailsV1(db.mysql.read, courseId, studentClass),
        ]);
        const paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType: course[0].course_type,
            categoryID: course[0].category_id,
        });
        let widgets = [];
        if (tab === 'recent') {
            const data = await Liveclass.getResourceDetailsFromCourseId(db.mysql.read, courseId, limit, offset, subject);
            const result = await LiveclassHelperLocal.getRelatedLectures(data, config, paymentCardState, db, studentID, false);
            widgets.push({ type: 'related_lecture', data: { bg_color: '#66e0eaff', items: result } });
        } else if (tab === 'upcoming') {
            const data = await Liveclass.getUpcomingResourceDetailsFromCourseId(db.mysql.read, courseId, limit, offset, subject);
            const result = await LiveclassHelperLocal.getRelatedLectures(data, config, paymentCardState, db, studentID, false);
            widgets.push({ type: 'related_lecture', data: { bg_color: '#66e0eaff', items: result } });
        } else if (tab === 'notes') {
            const data = await Liveclass.getNotesFromCourseId(db.mysql.read, courseId, limit, offset, subject);
            let result = LiveclassHelperLocal.getNotesData(data, paymentCardState);
            result = _.groupBy(result, 'master_chapter');
            for (const key in result) {
                if ({}.hasOwnProperty.call(result, key)) {
                    widgets.push({ type: 'resource_notes', data: { title: `${key} - ${result[key][0].subject}`, items: result[key], showsearch: false } });
                }
            }
        } else if (tab === 'topics') {
            const data = await Liveclass.getDetailListV1(db.mysql.read, courseId, limit, offset, subject);
            const result = LiveclassHelperLocal.getTopicsData(data);
            widgets.push({ type: 'course_topics', data: { items: result, showsearch: false } });
        }

        if ((widgets.length && widgets[0].data.items.length === 0) || widgets.length === 0) {
            widgets = [
                {
                    type: 'simple_text',
                    data: {
                        title: 'No Data Available.',
                    },
                },
            ];
        }

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function home(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID, locale, student_class: userStudentClass } = req.user ? req.user : {};
        const { version_code: versionCode, 'x-auth-token': xAuthToken, is_browser: isBrowser } = req.headers;
        const limit = 10;
        const { page, page_type: pageType } = req.query;
        let {
            course_type: courseFilter, studentClass, ecm_id: ecmId, subject, course_class: courseClass,
        } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? userStudentClass : studentClass;
        if (!studentClass) studentClass = 12;
        ecmId = parseInt(ecmId);
        let boardList = [];
        let free = 1;
        const is_old = pageType === 'boards' ? 1 : 0;

        if (pageType === 'boards') {
            boardList = await Liveclass.getBoardListV1(db.mysql.read, studentClass);
            ecmId = boardList[0].id;
            free = boardList[0].is_free;
        } else {
            boardList = await Liveclass.getBoardListV2(db.mysql.read, studentClass, ecmId);
            free = boardList[0].is_free;
        }

        if (!courseFilter) courseFilter = 'course';
        if (!subject) subject = 'ALL';
        courseClass = (typeof courseClass === 'undefined') ? studentClass : courseClass;
        const [
            studentPackageList,
            filterData,
            subFilterData,
            caraouselList,
            ecmClasses,
        ] = await Promise.all([
            studentID ? CourseMysql.getUserSubscription(db.mysql.read, studentID) : [],
            CourseMysql.getEcmListDataV4(db.mysql.read, studentClass),
            CourseMysql.getDistinctCourseTypes(db.mysql.read, ecmId),
            CourseMysql.getCaraouselsWithAppVersionCodeFixed(db.mysql.read, ecmId, locale, page, limit, studentClass, versionCode),
            CourseMysql.getClassByEcmId(db.mysql.read, ecmId),
        ]);
        const showSubFilter = (ecmId === 13 || ecmId === 14);
        const categoryID = showSubFilter ? 1 : boardList[0].category_id;
        const paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType: courseFilter,
            categoryID,
        });
        let paymentCategoryId = categoryID;
        let paymentCardStateV2 = paymentCardState;
        if (boardList.length > 1) {
            // if (free) {
            //     free = boardList[1].is_free;
            //     paymentCategoryId = boardList[1].category_id;
            //     if (free && boardList.length > 2) {
            //         free = boardList[2].is_free;
            //         paymentCategoryId = boardList[2].category_id;
            //     }
            // }
            paymentCardStateV2 = CourseHelper.getPaymentCardStateV2({
                data: studentPackageList,
                courseType: courseFilter,
                categoryID: boardList[1].category_id,
            });
            for (let k = 0; k < boardList.length; k++) {
                if (free) {
                    free = boardList[k].is_free;
                    paymentCategoryId = boardList[k].category_id;
                }
                if (!paymentCardStateV2.isVip) {
                    paymentCardStateV2 = CourseHelper.getPaymentCardStateV2({
                        data: studentPackageList,
                        courseType: courseFilter,
                        categoryID: boardList[k].category_id,
                    });
                }
            }
        }
        let widgets = [];
        if (page == 1) widgets = LiveclassHelperLocal.getHomePageFilter(subFilterData, filterData, showSubFilter);
        const carousels = await LiveclassHelperLocal.getCaraouselData({
            caraouselList,
            db,
            config,
            ecmId,
            subject,
            studentClass,
            paymentCardState,
            paymentCardStateV2,
            courseFilter,
            ecmClasses,
            categoryID,
            boardList,
            courseClass,
            studentPackageList,
            studentID,
            versionCode,
        });
        let courseCarousels = [];
        if (isBrowser) {
            courseCarousels = await LiveclassHelperLocal.getCourseCarouselsWeb({
                db,
                studentID,
                studentClass,
                locale,
                xAuthToken,
                versionCode,
                config,
            });
        }
        widgets = [...widgets, ...carousels, ...courseCarousels];

        const data = {
            widgets: page == 1 ? widgets : [],
        };

        if (categoryID === 1 || !free) {
            data.trial_button = LiveclassHelperLocal.getTrialButton(paymentCardState, paymentCardStateV2, paymentCategoryId, courseFilter, 'home', pageType);
        }

        const responseData = {
            meta: {
                code: 200,
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

async function timetable(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let {
            course_id: courseId, studentClass,
        } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        const timetable = await CourseMysql.getTimetableImageByCourse(db.mysql.read, courseId);
        const items = [];
        if (timetable[0]) {
            items.push({
                image_url: timetable[0].timetable,
                button: {
                    text: 'Save To Gallery',
                },
            });
            items.push({
                image_url: `${config.staticCDN}liveclass/Timetable_English_Grammar.png`,
                button: {
                    text: 'Save To Gallery',
                },
            });
        }
        const widgets = [
            {
                type: 'timetable_list',
                data: {
                    items,
                },
            },
        ];

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: {
                title: 'My Timetable',
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    resourcePage,
    getCourseDetail,
    courseTabDetail,
    home,
    timetable,
};
