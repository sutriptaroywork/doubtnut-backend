const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/liveclass');
const redis = require('../redis/liveclass');
const Utility = require('../utility');

module.exports = class Liveclass {
    static async getJeeMainsAndAdvCarshCourse(db, id) {
        try {
            let crashCourse;
            if (config.caching) {
                crashCourse = await redis.getJeeMainsAndAdvCarshCourse(db.redis.read);
                if (!_.isNull(crashCourse)) {
                    return JSON.parse(crashCourse);
                }
                // get from mysql
                crashCourse = await mysql.getJeeMainsAndAdvCarshCourse(db.mysql.read, id);
                if (crashCourse.length > 0) {
                    // set in redis
                    await redis.setJeeMainsAndAdvCarshCourse(db.redis.write, crashCourse);
                }
                return crashCourse;
            }
            crashCourse = await mysql.getJeeMainsAndAdvCarshCourse(db.mysql.read, id);
            return crashCourse;
        } catch (e) {
            console.log(e);
        }
    }

    static async getCategoriesByExam(db, examList) {
        try {
            let examWiseCategories;
            if (config.caching) {
                examWiseCategories = await redis.mgetCategoryByExams(db.redis.read, examList);
                if (!_.isNull(examWiseCategories) && examWiseCategories.filter((x) => !_.isNull(x)).length >= examList.length) {
                    return examWiseCategories.reduce((acc, _data) => [
                        ...acc,
                        ...(JSON.parse(_data)),
                    ],
                    []);
                }
                examWiseCategories = await mysql.getCategoryList(db.mysql.read, examList);
                const examWiseCategoryObj = Utility.transformDetailsByExamToCacheDataObj(examWiseCategories);
                redis.msetCategoryByExams(db.redis.write, examWiseCategoryObj);
                return examWiseCategories;
            }
            examWiseCategories = await mysql.getCategoryList(db.mysql.read, examList);
            return examWiseCategories;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async getTeachersBySubjectName(db, subjectName) {
        try {
            let teacherImages;
            if (config.caching) {
                teacherImages = await redis.getTeacherBySubject(db.redis.read, subjectName);
                if (_.isNull(teacherImages) || _.isEmpty(teacherImages)) {
                    // teacherImages = await mysql.getSubjectWiseTeacher(db.mysql.read, subjectName);
                    // if (teacherImages && teacherImages.length > 0) {
                    //     redis.setTeacherBySubject(db.redis.write, subjectName, teacherImages);
                    //     redis.setExpiryForSubjectWiseTeacherImages(db.redis.write, subjectName);
                    //     return teacherImages[0].image_url;
                    // }
                    // teachers' images for the following subjects - ENGLISH GRAMMAR, are not available in "dashboard_users" table and also data not exists on image links from "dashboard_users" table.
                    teacherImages = await mysql.getSubjectWiseTeacherFromCourseTeacherMapping(db.mysql.read, subjectName);
                    if (teacherImages && teacherImages.length > 0) {
                        redis.setTeacherBySubject(db.redis.write, subjectName, teacherImages);
                        redis.setExpiryForSubjectWiseTeacherImages(db.redis.write, subjectName);
                        return teacherImages[0].image_url;
                    }
                    return '';
                }
                return teacherImages;
            }
            teacherImages = await mysql.getSubjectWiseTeacherFromCourseTeacherMapping(db.mysql.read, subjectName);
            if (teacherImages && teacherImages.length > 0) {
                return teacherImages[0].image_url;
            }
            return '';
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async getFacultyImgById(db, facultyId) {
        try {
            let facultyImg;
            if (config.caching) {
                facultyImg = await redis.getFacultyImgById(db.redis.read, facultyId);
                if (!_.isNull(facultyImg)) {
                    return JSON.parse(facultyImg);
                }
                facultyImg = await mysql.getFacultyImgById(db.mysql.read, facultyId);
                if (facultyImg && facultyImg.length > 0) {
                    redis.setFacultyImgById(db.redis.write, facultyId, facultyImg);
                }
                return facultyImg;
            }
            facultyImg = await mysql.getFacultyImgById(db.mysql.read, facultyId);
            return facultyImg;
        } catch (e) {
            console.log(e);
            return [];
        }
    }
};
