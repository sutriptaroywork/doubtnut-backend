/* eslint-disable no-await-in-loop */
const StructuredCourseHelper = require('./structuredcourse.helper');
const Liveclass = require('../../../modules/mysql/liveclass');
const CourseMysql = require('../../../modules/mysql/course');
const CourseHelper = require('../course/course.helper');

async function getDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        const { id: ecmID } = req.query;
        let { studentClass } = req.query;
        studentClass = (typeof req.query.studentClass === 'undefined') ? req.user.student_class : studentClass;
        let { subject } = req.query;
        if (subject === 'DEFAULT') {
            subject = '0';
        }
        const courseType = 'course';
        const promises = [];
        const courseDetails = await Liveclass.getCourseDetails(db.mysql.read, ecmID);
        const categoryID = courseDetails[0].category_id;
        const studentPackageList = await CourseMysql.getUserSubscription(db.mysql.read, studentID);
        const paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType,
            categoryID,
        });
        promises.push(StructuredCourseHelper.getSubjectFilters(db, ecmID));
        promises.push(StructuredCourseHelper.getLiveSectionData({
            db,
            config,
            courseType,
            type: 'freeclass_grid',
            courseID: ecmID,
            subject,
            isVip: paymentCardState.isVip,
            paymentCardState,
            studentClass,
        }));
        promises.push(StructuredCourseHelper.getStructuredCourse({
            db,
            config,
            courseType,
            courseID: ecmID,
            subject,
            studentID,
        }));
        const resolvedPromise = await Promise.all(promises);
        const data = StructuredCourseHelper.generateDetailPageResponse(resolvedPromise[0], resolvedPromise[1], resolvedPromise[2]);
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

async function getResource(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentID } = req.user;
        const { detail_id: detailID } = req.query;
        let { studentClass } = req.query;
        studentClass = (typeof studentClass === 'undefined') ? req.user.student_class : studentClass;
        const versionCode = req.headers.version_code;
        const studentPackageList = await CourseMysql.getUserSubscription(db.mysql.read, studentID);
        const resourceList = await Liveclass.getResourceDetailsForStructuredCourse(db.mysql.read, detailID, studentClass);

        const paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType: resourceList[0].course_type,
            categoryID: resourceList[0].category_id,
        });
        const data = StructuredCourseHelper.generateResourcePageResponse(resourceList, config, paymentCardState, versionCode);
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

module.exports = { getDetails, getResource };
