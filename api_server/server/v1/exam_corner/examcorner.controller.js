/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const ExamCornerMysql = require('../../../modules/mysql/examCorner');
const StudentRedis = require('../../../modules/redis/student');
const StudentMysql = require('../../../modules/mysql/student');
const examCornerHelper = require('../../helpers/examcorner');
const {
    createExamCornerDefaultWidget,
    createExamCornerAutoplayWidget,
    createExamCornerPopularWidgetResponse,
} = require('../../widgets/liveclass');

let db;

async function getFeedForHome(dbTemp, studentLocale, studentId, studentClass, versionCode) {
    db = dbTemp;
    const widgets = [];
    let studentCcmIds = await StudentRedis.getStudentCcmIds(db.redis.read, studentId);
    studentCcmIds = JSON.parse(studentCcmIds);
    if (_.isNull(studentCcmIds)) {
        // if not available  in redis getting from mysql and caching in redis
        studentCcmIds = await StudentMysql.getCcmIdbyStudentId(db.mysql.read, studentId);
        studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
        // adding the data to student redis cache
        StudentRedis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
    }
    if (versionCode >= 946) {
    // filters the feed with widgets other than exam_corner_popular
        const otherWidgets = await ExamCornerMysql.getFeedForHome(db.mysql.read, studentCcmIds, studentLocale, studentClass, ['news', 'careers'], 10);
        for (let index = 0; index < otherWidgets.length; index++) {
            if (otherWidgets[index].carousel_type === 'autoplay') {
                widgets.push(createExamCornerAutoplayWidget({ widget: otherWidgets[index], isBookmarked: await examCornerHelper.isBookmarkedFunc(db, studentId, otherWidgets[index].exam_corner_id), studentLocale }));
            } else {
                widgets.push(createExamCornerDefaultWidget({ widget: otherWidgets[index], isBookmarked: await examCornerHelper.isBookmarkedFunc(db, studentId, otherWidgets[index].exam_corner_id), studentLocale }));
            }
        }
    } else {
        const otherWidgets = await Promise.all([ExamCornerMysql.getFeedForHome(db.mysql.read, studentCcmIds, studentLocale, studentClass, ['news'], 1), ExamCornerMysql.getFeedForHome(db.mysql.read, studentCcmIds, studentLocale, studentClass, ['careers'], 1)]);
        for (let index = 0; index < otherWidgets.length; index++) {
            if (otherWidgets[index].carousel_type === 'autoplay' && otherWidgets[index].length !== 0) {
                widgets.push(createExamCornerAutoplayWidget({ widget: otherWidgets[index][0], isBookmarked: await examCornerHelper.isBookmarkedFunc(db, studentId, otherWidgets[index][0].exam_corner_id), studentLocale }));
            } else if (otherWidgets[index].length !== 0) {
                widgets.push(createExamCornerDefaultWidget({ widget: otherWidgets[index][0], isBookmarked: await examCornerHelper.isBookmarkedFunc(db, studentId, otherWidgets[index][0].exam_corner_id), studentLocale }));
            }
        }
    }
    if (widgets && widgets.length) {
        return {
            widget_type: 'widget_parent',
            widget_data: {
                title: studentLocale === 'hi' ? 'परीक्षा कॉर्नर' : 'Exam Corner',
                items: widgets,
                scroll_direction: versionCode >= 946 ? 'horizontal' : 'vertical',
                show_indicator: versionCode >= 946,
                link_text: studentLocale === 'hi' ? 'सभी देखें' : 'See All',
                deeplink: 'doubtnutapp://exam_corner',
            },
        };
    }
    return null;
}

// creates response for exam_corner
async function getFeed(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const { filter_type: filterType } = req.query;
        let { page } = req.query;
        const studentLocale = req.user.locale;
        let studentClass = req.user.student_class;
        if (typeof studentClass === 'undefined') {
            studentClass = 12;
        }

        page = parseInt(page);
        if (!page) {
            page = 1;
        }
        const pageSize = 10;
        // filters the feed with widgets the exam_corner_popular
        const widgets = [];
        // filters the feed with widgets other than exam_corner_popular
        let studentCcmIds = await StudentRedis.getStudentCcmIds(db.redis.read, studentId);
        studentCcmIds = JSON.parse(studentCcmIds);
        if (_.isNull(studentCcmIds)) {
            // if not available  in redis getting from mysql and caching in redis
            studentCcmIds = await StudentMysql.getCcmIdbyStudentId(db.mysql.read, studentId);
            studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
            // adding the data to student redis cache
            StudentRedis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
        }
        const otherWidgets = await ExamCornerMysql.getFeed(db.mysql.read, studentCcmIds, studentClass, studentLocale, filterType, pageSize, (page - 1) * pageSize);
        for (let index = 0; index < otherWidgets.length; index++) {
            if (otherWidgets[index].carousel_type === 'autoplay') {
                widgets.push(createExamCornerAutoplayWidget({ widget: otherWidgets[index], isBookmarked: await examCornerHelper.isBookmarkedFunc(db, studentId, otherWidgets[index].exam_corner_id), studentLocale }));
            } else {
                widgets.push(createExamCornerDefaultWidget({ widget: otherWidgets[index], isBookmarked: await examCornerHelper.isBookmarkedFunc(db, studentId, otherWidgets[index].exam_corner_id), studentLocale }));
            }
        }
        if (page === 1) {
            const popularWidgets = await ExamCornerMysql.getFeedPopular(db.mysql.read, studentCcmIds, studentClass, studentLocale, filterType);
            const popularWidgetResponse = createExamCornerPopularWidgetResponse({ popularWidgets, locale: studentLocale });
            if (popularWidgets.length > 0) {
                widgets.unshift(popularWidgetResponse);
            } 
        }

        if (widgets.length === 0 && page === 1) {
            widgets.unshift({
                type: 'text_widget',
                data: {
                    title: studentLocale === 'hi' ? 'दिखाने के लिए कोई पोस्ट नहीं' : 'No Posts to Show',
                    isBold: false,
                },
                layout_config: {
                    margin_top: 12,
                    margin_left: 16,
                },
            });
        }

        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

// creates response with bookmarked exam_corner articles
async function getBookmarks(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const studentLocale = req.user.locale;
        let { page } = req.query;
        page = parseInt(page);
        if (!page) {
            page = 1;
        }
        const pageSize = 10;
        const feed = await ExamCornerMysql.getBookmarks(db.mysql.read, studentId, pageSize, (page - 1) * pageSize);
        const widgets = [];
        for (let index = 0; index < feed.length; index++) {
            if (feed[index].carousel_type === 'autoplay') {
                widgets.push(await createExamCornerAutoplayWidget({ widget: feed[index], isBookmarked: true, studentLocale }));
            } else {
                widgets.push(await createExamCornerDefaultWidget({ widget: feed[index], isBookmarked: true, studentLocale }));
            }
        }
        if (widgets.length === 0 && page === 1) {
            widgets.unshift({
                type: 'text_widget',
                data: {
                    title: studentLocale === 'hi' ? 'दिखाने के लिए कोई बुकमार्क नहीं' : 'No Bookmarks to Show',
                    isBold: false,
                },
                layout_config: {
                    margin_top: 12,
                    margin_left: 16,
                },
            });
        }
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: {
                widgets,
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
        // console.log(e);
    }
}

// adds or removes a bookmark
async function setBookmarks(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const { exam_corner_id: examCornerId, type } = req.body;
        let result;
        if (type === 'add') {
            result = await StudentRedis.getExamCornerBookmarks(db.redis.read, studentId);
            if (_.isNull(result)) {
                StudentRedis.setExamCornerBookmarks(db.redis.write, studentId, [examCornerId]);
            } else {
                result = JSON.parse(result);
                if (!result.includes(examCornerId)) {
                    result.push(examCornerId);
                    StudentRedis.setExamCornerBookmarks(db.redis.write, studentId, result);
                }
            }
            result = await ExamCornerMysql.addBookmark(db.mysql.write, studentId, examCornerId);
        } else if (type === 'remove') {
            result = await ExamCornerMysql.removeBookmark(db.mysql.write, studentId, examCornerId);
            let result2 = await StudentRedis.getExamCornerBookmarks(db.redis.read, studentId);
            if (!_.isNull(result2)) {
                result2 = JSON.parse(result2);
                if (result2.includes(examCornerId.toString())) {
                    StudentRedis.setExamCornerBookmarks(db.redis.write, studentId, result2.filter((item) => item !== examCornerId.toString()));
                }
            }
        }
        if (!_.isEmpty(result)) {
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: 'success',
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}
module.exports = {
    getFeedForHome,
    getFeed,
    getBookmarks,
    setBookmarks,
};
