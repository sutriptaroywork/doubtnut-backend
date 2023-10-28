const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/classCourseMapping');
const redis = require('../redis/ClassCourseMapping');
const studentRedis = require('../redis/student');
const studentMysql = require('../mysql/student');

module.exports = class classCourseMapping {
    constructor() {}

    static getWidgetTypeContent(db, config, widget_type, student_class, other) {
        return new Promise(async (resolve, reject) => {
            try {
                let data;
                if (config.caching) {
                    // if (1) {
                    data = await redis.getHomePageWidgetContentByType(
                        db.redis.read,
                        widget_type,
                        student_class,
                        other,
                    );
                    if (!_.isNull(data)) {
                        resolve(JSON.parse(data));
                    } else {
                        data = await mysql.getHomePageWidgetContentByType(
                            db.mysql.read,
                            widget_type,
                            student_class,
                            other,
                        );
                        if (data.length > 0) {
                            await redis.setHomePageWidgetContentByType(
                                db.redis.write,
                                data,
                                widget_type,
                                student_class,
                                other,
                            );
                        }
                        resolve(data);
                    }
                } else {
                    data = await mysql.getHomePageWidgetContentByType(
                        db.mysql.read,
                        widget_type,
                        student_class,
                        other,
                    );
                    resolve(data);
                }
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    }

    static async getCCMDetails(db, ccmId) {
        let data;
        if (config.caching) {
            data = await redis.getCCMDetails(db.redis.read, ccmId);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await mysql.getCCMDetails(db.mysql.read, ccmId);
        if (data.length) {
            redis.setCCMDetails(db.redis.write, ccmId, data);
        }
        return data;
    }

    static async getStreamDetails(db, boardId, locale) {
        try {
            if (!config.caching) {
                return mysql.getStreamDetails(db.mysql.read, boardId, locale);
            }
            let data = await redis.getStreamDetails(db.redis.read, boardId, locale);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }

            data = await mysql.getStreamDetails(db.mysql.read, boardId, locale);
            if (data.length) {
                redis.setStreamDetails(db.redis.write, boardId, locale, JSON.stringify(data));
            }
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getCcmIdFromCourseClass(db, studentClass, course) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getCcmIdFromCourseClass(db.redis.read, studentClass, course);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getCcmIdFromCourseClass(db.mysql.read, studentClass, course);
            if (data.length) {
                await redis.setCcmIdFromCourseClass(db.redis.write, studentClass, data[0]);
                return data;
            }
            return null;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getStudentsExamsBoardsData(db, sId, type = 'none') {
        const ccmIds = await this.getStudentCcmIds(db, sId);
        const promises = [];
        ccmIds.forEach(async (ccmId) => {
            promises.push(this.getCCMDetails(db, ccmId));
        });
        let ccmData = await Promise.all(promises);

        ccmData = _.flatten(ccmData);
        ccmData = _.filter(ccmData, (data) => (type === 'none' || data.category === type));
        return ccmData;
    }

    static async getCoursesClassCourseMappingExtraMarks(db, studentId) {
        const courses = await this.getStudentsExamsBoardsData(db, studentId);
        const data = [];
        for (let i = 0; i < courses.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            let ecmData = await redis.getECMData(db.redis.read, courses[i].course);
            ecmData = JSON.parse(ecmData);
            for (let j = 0; j < ecmData.length; j++) {
                data.push({ id: courses[i].id, exam: courses[i].course, category: ecmData[j] });
            }
        }
        return data;
    }

    static async getStudentCcmIds(db, studentId) {
        let studentCcmIds = await studentRedis.getStudentCcmIds(db.redis.read, studentId);
        studentCcmIds = JSON.parse(studentCcmIds);
        if (_.isNull(studentCcmIds)) {
        // if not available  in redis getting from mysql and caching in redis
            studentCcmIds = await studentMysql.getCcmIdbyStudentId(db.mysql.read, studentId);
            studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
            // adding the data to student redis cache
            if (studentCcmIds.length > 0) {
                await studentRedis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
            }
        }
        return studentCcmIds;
    }
};
