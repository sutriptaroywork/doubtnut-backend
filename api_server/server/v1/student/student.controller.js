/* eslint-disable no-unused-expressions */
/* eslint-disable no-sequences */
/* eslint-disable prefer-const */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
/* eslint-disable camelcase */
require('../../../modules/mongo/comment');
require('../../../modules/mongo/post');

const validator = require('validator');
const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const mongoose = require('mongoose');
const queryString = require('query-string');

const md5 = require('md5');
const Utility = require('../../../modules/utility');
const Student = require('../../../modules/student');
const StudentMySQL = require('../../../modules/mysql/student');
const StudentRedis = require('../../../modules/redis/student');
const StudentContainer = require('../../../modules/containers/student');
const QuestionLog = require('../../../modules/mongo/questionAsk');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');

const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const Token = require('../../../modules/tokenAuth');
const StudentBl = require('./student.bl');
const StudentHelper = require('../../helpers/student.helper');
const TGHelper = require('../../helpers/target-group');

const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');
const Language = require('../../../modules/language');
const ClassContainer = require('../../../modules/containers/class');
const classMysql = require('../../../modules/mysql/class');
const LanguageContainer = require('../../../modules/containers/language');
const studentContainer = require('../../../modules/containers/student');
const classCourseMapping = require('../../../modules/classCourseMapping');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const RedisUtil = require('../../../modules/redis/utility.redis');
const notification = require('../../../modules/notifications');
const Constants = require('../../../modules/constants');
const QuestionMysql = require('../../../modules/mysql/question');
const QuestionRedis = require('../../../modules/redis/question');
const Flagr = require('../../../modules/Utility.flagr');
const AnswerMysql = require('../../../modules/mysql/answer');
const LiveClassMysql = require('../../../modules/mysql/liveclass');
const DoubtfeedMysql = require('../../../modules/mysql/doubtfeed');
const redisLibrairy = require('../../../modules/redis/library');
const doubtfeedHelper = require('../../helpers/doubtfeed.helper');
const studyGroup = require('../studyGroup/studyGroup.controller');
const NoticeMysql = require('../../../modules/mysql/notice');
const studentRedis = require('../../../modules/redis/student');
const CourseMysql = require('../../../modules/mysql/coursev2');
const Data = require('../../../data/data');
const libraryMysql = require('../../../modules/mysql/library');
const FreeLiveClass = require('../../helpers/freeLiveClass');
const RewardsHelper = require('../../helpers/rewards');
const ReferralData = require('../../../data/referral.data');
const StudentModuleSql = require('../../../modules/student');
const ReferAndEarnHelper = require('../../helpers/referAndEarn.helper');
const StudentMysql = require('../../../modules/mysql/student');
const CountryDetailsStaticData = require('../../../data/country_details');
const altAppData = require('../../../data/alt-app');

const {
    onBoardinglanguageHeading,
    onBoardinglanguageOldHeading,
    onBoardingClassHindiHeading,
    onBoardingClassHeading,
    onBoardingClassOldHeading,
    onBoardingBoardHindiHeading,
    onBoardingBoardHeading,
    onBoardingBoardOldHeading,
    onBoardingExamHindiHeading,
    onBoardingExamHeading,
    onBoardingExamOldHeading,
    socialLoginPassport,
    surveyTestingIds,
    doubtfeed,
    noticeBoardContents,
    doubtfeedBanner,
} = require('../../../data/data');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const QuestionHelper = require('../../helpers/question.helper');
const VideoView = require('../../../modules/videoView');

let db; let config; let client; let sqs;

function addPublicUserWeb(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    client = req.app.get('client');
    const { udid } = req.body;
    const { gcm_reg_id } = req.body;
    if (udid) {
        // get student
        let student_id;
        Student.getStudentByUdid(udid, db.mysql.read)
            .then((student) => {
                // //console.log(student[0]['student_id'])
                if (student.length > 0) {
                    // check for gcm_red_id
                    student_id = student[0].student_id;
                    if (typeof gcm_reg_id !== 'undefined' && gcm_reg_id) {
                        // update it
                        return Student.updateFcm(
                            student[0].student_id,
                            gcm_reg_id,
                            null,
                            db.mysql.write,
                        );
                    }
                    return student[0].student_id;
                }
                // return Student.add(udid, db.mysql.write)
                return Student.add(
                    udid,
                    'en',
                    '12',
                    null,
                    1,
                    null,
                    new Date().getTime(),
                    null,
                    null,
                    db.mysql.write,
                );
            })
            .then((result) => {
                // //console.log(typeof result)
                let sid;
                if (typeof result === 'number') {
                    sid = result;
                } else if (result.insertId) {
                    // //console.log('insert')
                    sid = result.insertId;
                } else {
                    sid = student_id;
                }
                const responseData = {
                    meta: {
                        code: 200,
                        message: 'SUCCESS',
                    },
                    data: { id: sid },
                };
                res.status(responseData.meta.code).json(responseData);
            })
            .catch((error) => {
                // console.log('error')
                // console.log(error)
                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "message": "Error while adding or updating",
                //   }
                // }
                // res.status(responseData.meta.code).json(responseData)
                next(error);
            });
    } else {
        const responseData = {
            meta: {
                code: 403,
                message: 'No UDID',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

function updateGcm(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    // client = req.app.get('client')
    const { student_id } = req.user;
    const { gcm_reg_id } = req.body;
    if (student_id && gcm_reg_id) {
        let responseData;
        if (StudentHelper.isAltApp(req.headers.package_name)) {
            const obj = {
                gcm_reg_id,
            };
            Student.updateAltAppGcm(db.mysql.write, obj, req.headers.package_name, student_id)
                .then((result) => {
                    if (result.changedRows) {
                        responseData = {
                            meta: {
                                code: 200,
                                message: 'SUCCESS',
                            },
                            data: null,
                        };
                    } else {
                        responseData = {
                            meta: {
                                code: 200,
                                message: 'Not updated',
                            },
                        };
                    }
                    res.status(responseData.meta.code).json(responseData);
                })
                .catch((error) => {
                    responseData = {
                        meta: {
                            code: 403,
                            message: 'Error while adding or updating',
                        },
                        error,
                    };
                    res.status(responseData.meta.code).json(responseData);
                    next(error);
                });
        }
        Student.updateFcm(student_id, gcm_reg_id, null, db.mysql.write)
            .then((result) => {
                // //console.log('result')
                // //console.log(result['changedRows'])
                if (result.changedRows) {
                    responseData = {
                        meta: {
                            code: 200,
                            message: 'SUCCESS',
                        },
                        data: null,
                    };
                } else {
                    responseData = {
                        meta: {
                            code: 200,
                            message: 'Not updated',
                        },
                    };
                }
                res.status(responseData.meta.code).json(responseData);
            })
            .catch((error) => {
                // responseData = {
                //   "meta": {
                //     "code": 403,
                //     "message": "Error while adding or updating",
                //   },
                //   "error": error
                // }
                // res.status(responseData.meta.code).json(responseData)
                next(error);
            });
    } else {
        const responseData = {
            meta: {
                code: 403,
                message: 'No UDID or gcm reg id',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function addGcm(req, res, next) {
    try {
        const { udid } = req.body;

        if (validator.isUUID(udid, 4)) {
            // get student
            db = req.app.get('db');
            const { gcm_reg_id } = req.body;
            const check = await Student.checkIfUdidWeb(udid, db.mysql.read);
            if (check.length > 0) {
                if (StudentHelper.isAltApp(req.headers.package_name)) {
                    const obj = {
                        gcm_reg_id,
                    };
                    await Student.updateAltAppGcmBasesOnUdid(db.mysql.write, obj, req.headers.package_name, udid);
                } else {
                    await Student.updateGcmRegWeb(
                        db.mysql.write,
                        gcm_reg_id,
                        udid,
                    );
                }
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Updated',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                // console.log("ss")
                await Student.insertGcmRegWeb(db.mysql.write, gcm_reg_id, udid);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Inserted',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'Error!',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}

async function saveEmail(req, res, next) {
    try {
        const { udid } = req.body;

        if (validator.isUUID(udid, 4)) {
            // get student
            db = req.app.get('db');
            const { email } = req.body;
            const check = await Student.checkIfUdid(udid, db.mysql.read);
            if (check.length > 0) {
                const updatedEmail = await Student.updateEmailId(
                    db.mysql.write,
                    email,
                    udid,
                );
                // console.log(updatedEmail)
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Updated',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                // console.log("ss")
                await Student.insertEmailId(db.mysql.write, email, udid);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Inserted',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'Error!',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}

// to get the profile info with a list of all options

async function setProfile(req, res, next) {
    async function checkAndTriggerProfileComplete(student_id, student_class) {
        /*
        check for  name, gender, class, exam, board, location, school
         */

        const s = await StudentMySQL.checkAndTriggerProfileComplete(
            db.mysql.write,
            student_id,
        );

        console.log('student profile', s);

        let completeness = 1;
        let exam_c = 0;
        let board_c = 0;
        for (let i = 0; i < s.length; i++) {
            if (s[i].student_fname == null) completeness = 0;
            if (s[i].gender == null) completeness = 0;
            if (s[i].student_class == null) completeness = 0;

            if (s[i].school_name == null) completeness = 0;

            if (s[i].dob == null) completeness = 0;

            if (s[i].city == null) completeness = 0;

            if (s[i].ccm_id == null) completeness = 0;

            if (s[i].ccm_id == null) completeness = 0;

            if (!_.isEmpty(s[i].category) && s[i].category === 'board') board_c = 1;

            if (!_.isEmpty(s[i].category) && s[i].category === 'exam') exam_c = 1;
        }

        if ((completeness && exam_c && board_c && student_class <= 12) || (completeness && student_class === 14)) {
            console.log('profile is complete');

            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'PROFILE_COMPLETE',
                user_id: student_id,
                refer_id: 0,
            });
        }
    }

    function validatePostData(body) {
        const errorList = [];

        const { name } = body;

        if (name == null || name.trim().length === 0) {
            errorList.push('Name cannot be empty');
        }

        return errorList;
    }

    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const publicPath = req.app.get('publicPath');
        const s3 = req.app.get('s3');
        sqs = req.app.get('sqs');

        const { student_id } = req.user;
        const image = req.body.img_url;

        // check if student exists
        if ((await studentContainer.getById(student_id, db).length) === 0) {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Student does not exist!',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        const errorList = validatePostData(req.body);

        if (errorList.length > 0) {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: errorList,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        let name = typeof req.body.name === 'undefined' ? null : req.body.name;

        name = name.split(' ');

        let student_fname = name[0];
        let student_lname;
        // student_fname = name[0];

        if (name.length >= 2) {
            student_lname = name[1];
        } else {
            student_lname = '';
        }
        const { gender } = req.body;

        const student_class = typeof req.body.class === 'undefined' ? null : req.body.class;
        let { board } = req.body;
        const { goal } = req.body;

        if (req.user.student_class != student_class) {
            await Utility.removeAllDataFromStudentCourseMapping(
                db.mysql.write,
                student_id,
            );
        }

        // method

        if (typeof board !== 'undefined' && !_.isEmpty(board)) {
            // new method
            const sqlQ = 'select ccm.id from class_course_mapping ccm where course in (select course from class_course_mapping where id in (?)) and class= ?';

            // console.log(sqlQ);
            const result = await db.mysql.write.query(sqlQ, [board, student_class]);

            if (result.length > 0) {
                board = result[0].id;
            }

            const board_array = [];
            board_array.push(board);
            await Utility.insertExamAndBoardSelections(
                db,
                board_array,
                'board',
                student_id,
            );
        }

        if (typeof goal !== 'undefined' && !_.isEmpty(goal) && goal.length > 0) {
            // new method
            const sqlQ = 'select ccm.id from class_course_mapping ccm where course in (select course from class_course_mapping where id in (?)) and class= ?';

            // console.log(sqlQ);
            const result = await db.mysql.read.query(sqlQ, [goal, student_class]);
            await Utility.removeDataForIndividualWidget(db.mysql.write, student_id, 'exam');

            const goal_array = [];
            if (result.length > 0) {
                for (let i = 0; i < result.length; i++) {
                    goal_array.push(result[i].id);
                }
                await Utility.insertExamAndBoardSelections(
                    db,
                    goal_array,
                    'exam',
                    student_id,
                );
            }
        } else {
            await Utility.removeDataForIndividualWidget(db.mysql.write, student_id, 'exam');
        }

        if (req.body.geo != null) {
            const city = typeof req.body.geo.location !== 'undefined'
                ? req.body.geo.location.trim()
                : null;
            const lat = typeof req.body.geo.lat !== 'undefined' ? req.body.geo.lat : null;
            const lon = typeof req.body.geo.lon !== 'undefined' ? req.body.geo.lon : null;
            const state = typeof req.body.geo.state !== 'undefined' ? req.body.geo.state : null;
            const country = typeof req.body.geo.country !== 'undefined' ? req.body.geo.country : null;

            const params = {};
            params.city = city;
            params.latitude = lat;
            params.longitude = lon;
            params.state = state;
            params.country = country;

            // check if entry exists

            let sql = 'select * from student_location where student_id = ?';

            const result = await db.mysql.read.query(sql, [student_id]);

            const parameters = [];

            if (result.length > 0) {
                parameters.push(params, student_id);
                sql = 'update student_location set ? where student_id = ?';
            } else {
                params.student_id = student_id;
                parameters.push(params);
                sql = 'insert into student_location set ?';
            }

            await db.mysql.write.query(sql, parameters);
        }

        const school = req.body.school != null ? req.body.school.trim() : null;
        const coaching = req.body.coaching != null
            ? req.body.coaching.trim().length > 0
                ? req.body.coaching.trim()
                : 'No'
            : null;
        const dob = req.body.date_of_birth;

        const sql = 'update students SET ? where student_id = ?';
        const params = {};

        params.student_fname = student_fname;
        params.student_lname = student_lname;
        params.gender = gender;
        params.student_class = student_class;
        params.school_name = school;
        params.coaching = coaching;
        params.ex_board = !!board;
        params.dob = moment(dob, 'DD-MM-YYYY').format('YYYY-MM-DD');
        if (image !== undefined && image != null) {
            params.img_url = await Utility.uploadImageToS3(
                image,
                student_id,
                config.cdn_url,
                publicPath,
                fs,
                s3,
                config.aws_bucket,
            );
        }

        const status = await db.mysql.write.query(sql, [params, student_id]);
        Student.deleteUserInRedis(student_id, db.redis.write)
            .then((re) => {
                // console.log(re);
            })
            .catch((e) => {
                console.log(e);
            });

        const student_list = [1081201, 1522478, 1527637, 420334, 1378353, 705281, 1378353, 1613968, 1506294, 1656502, 1682680, 1732720];
        const updateQuery = {};
        let updatedUsername = '';
        // console.log('updated username');
        // console.log('username');

        if (image !== undefined) {
            updateQuery.student_avatar = params.img_url;
        }
        if (typeof student_fname.student_fname !== 'undefined' || !_.isEmpty(params.student_fname)) {
            updatedUsername += params.student_fname;
        }
        if (typeof student_lname.student_lname !== 'undefined' && !_.isEmpty(params.student_lname)) {
            updatedUsername += params.student_lname;
        }
        if (!_.isEmpty(updatedUsername)) {
            updateQuery.student_username = updatedUsername;
        }

        // console.log(updatedUsername);
        // console.log(typeof updatedUsername);

        // console.log("student id")
        // console.log(student_id)
        if (_.includes(student_list, student_id)) {
            // console.log("test")
        } else {
            const bulk = Comment.collection.initializeOrderedBulkOp();
            const bulk2 = Post.collection.initializeOrderedBulkOp();
            bulk.find({ student_id: student_id.toString() }).update({ $set: updateQuery });
            bulk2.find({ student_id: student_id.toString() }).update({ $set: updateQuery });
            bulk.execute((error) => {
            });
            bulk2.execute((error) => {
            });
        }
        console.log(status);

        // change this to when profile is complete

        checkAndTriggerProfileComplete(student_id, student_class);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'success',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

// to get the profile info with a list of all options

async function getProfile(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.params;
        const student_info = await Student.getStudentWithLocation(student_id, db.mysql.read);
        if (_.isEmpty(student_info[0].student_fname)) {
            student_info[0].name = student_info[0].username;
        } else {
            student_info[0].name = student_info[0].student_fname;

            if (!_.isEmpty(student_info[0].student_lname)) {
                student_info[0].name = `${student_info[0].student_fname} ${student_info[0].student_lname}`;
            }
        }

        const query_options = ["'gender'", "'student_class'"];

        const student_board_options = [];
        const student_exam_options = [];
        if (_.isNull(student_info.student_class)) {
            student_info.student_class = 12;
        }
        let promises = [];
        promises.push(ClassCourseMapping.classCourse(student_info[0].student_class, db.mysql.read));
        promises.push(StudentCourseMapping.getStudentSelectedCourse(student_id, db.mysql.read));
        const resolvedPromises = await Promise.all(promises);
        const class_course = resolvedPromises[0];
        const student_selected_courses = resolvedPromises[1];
        const student_selected_exam = [];
        let student_selected_board = -1;
        for (let i = 0; i < student_selected_courses.length; i++) {
            if (student_selected_courses[i].category === 'board') {
                student_selected_board = student_selected_courses[i].id;
            } else if (student_selected_courses[i].category === 'exam') {
                student_selected_exam.push(student_selected_courses[i].id);
            }
        }

        for (let i = 0; i < class_course.length; i++) {
            console.log('class_course', class_course[i]);
            const option_list = {};

            option_list.id = class_course[i].id;
            option_list.name = class_course[i].course;
            option_list.alias = class_course[i].course;
            option_list.img_url = class_course[i].img_url;

            if (class_course[i].category === 'board') {
                console.log('student_selected_board', student_selected_board);

                option_list.selected = student_selected_board === option_list.id ? 1 : 0;
                student_board_options.push(option_list);
            }

            if (class_course[i].category === 'exam') {
                option_list.selected = student_selected_exam.indexOf(option_list.id) > -1 ? 1 : 0;
                student_exam_options.push(option_list);
            }
        }

        const student_options = await Student.getStudentOptions(query_options, db.mysql.read);

        let gender; let student_class; let board; let
            goal;
        (gender = {}), (student_class = {}), (board = {}), (goal = {});

        // get geo data

        const geo = {};
        const student_location = await Student.getStudentLocation(student_id, db.mysql.read);
        if (student_location.length > 0) {
            geo.location = student_location[0].city;
            geo.lat = student_location[0].latitude;
            geo.lon = student_location[0].longitude;
        } else {
            geo.location = null;
            geo.lat = null;
            geo.lon = null;
        }

        // geo ends

        const coaching = {};

        if (student_info[0].coaching == null) {
            coaching.active = null;
        } else if (student_info[0].coaching === 'no') {
            coaching.active = 0;
        } else {
            coaching.active = 1;
            coaching.name = student_info[0].coaching;
        }

        // eslint-disable-next-line no-unused-expressions
        (gender.options = []),
        (student_class.options = []),
        (board.options = []),
        (goal.options = []);

        for (let j = 0; j < student_options.length; ++j) {
            const option_values = {};
            option_values.id = student_options[j].id;
            option_values.name = student_options[j].option;
            option_values.alias = student_options[j].title;

            if (student_options[j].type === 'gender') {
                option_values.selected = student_info[0].gender === parseInt(option_values.name) ? 1 : 0;

                gender.options.push(option_values);
            } else if (student_options[j].type === 'student_class') {
                option_values.selected = student_info[0].student_class === option_values.name ? 1 : 0;

                student_class.options.push(option_values);
            } else if (student_options[j].type === 'board') {
                // eslint-disable-next-line no-undef
                option_values.selected = selectedBoard === student_options[j].option_id ? 1 : 0;

                option_values.img_url = student_options[j].img_url;
                board.options.push(option_values);
            } else if (student_options[j].type === 'exam') {
                // eslint-disable-next-line no-undef
                option_values.selected = selectedExam.indexOf(student_options[j].option_id) > -1 ? 1 : 0;

                option_values.img_url = student_options[j].img_url;
                goal.options.push(option_values);
            }
        }

        // check if board and goal is eligible for others
        // checkIfCustomEntryInBoard(board,student_info);
        // checkIfCustomEntryInGoal(goal,goalList);

        const finalData = {
            name: student_info[0].name,
            image: student_info[0].img_url,
            gender,
            class: student_class,
            board: { options: student_board_options },
            goal: { options: student_exam_options },
            geo,
            school: student_info[0].school_name,
            coaching,
            date_of_birth:
                student_info[0].dob != null
                    ? moment(student_info[0].dob).format('DD-MM-YYYY')
                    : null,
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!',
            },
            data: finalData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

async function getAskHistory(req, res, next) {
    try {
        const sid = req.params.student_id;
        let limit = 15;
        if (req.query.limit != undefined) {
            limit = req.query.limit;
        }
        const qAskLogBySid = await QuestionLog.findBySid(sid, limit);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: qAskLogBySid,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getStudentOnboardingResponse(req, type, code) {
    let data = { submitted_items: [] };
    const classGrp1 = ['6', '7', '8', '9'];

    let version = 3;

    // if type is selected
    if (type === 'language') {
        data.list = await Language.getListNewOnBoarding(db.mysql.read);
        data.type = 'language';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardinglanguageHeading;
        } else {
            data.title = onBoardinglanguageOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.list = data.list.map((a) => {
            if (a.code == code) {
                a.is_active = 1;
            }
            return a;
        });
        return data;
    }

    if (type === 'class') {
        const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
        let obj = {};
        obj.type = 'language';
        obj.title = language[0].language_display;
        obj.code = language[0].code;
        data.submitted_items.push(obj);

        let result = await ClassContainer.getClassListNewOnBoarding(db, language[0].language);
        let temp = result.shift();
        result.push(temp);
        temp = result.shift();
        result.splice(2, 0, temp);
        data.list = result;

        data.type = 'class';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardingClassHeading(language[0].code);
        } else {
            data.title = onBoardingClassOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.list = data.list.map((a) => {
            if (a.code == code) {
                a.is_active = 1;
            }
            return a;
        });
        return data;
    }

    if (type === 'board') {
        const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
        let obj = {};
        obj.type = 'language';
        obj.title = language[0].language_display;
        obj.code = language[0].code;
        data.submitted_items.push(obj);

        let langText = language[0].language;

        obj = {};
        let classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, req.user.student_class);
        obj.type = 'class';
        obj.title = classData[0].title;
        obj.code = classData[0].code;
        data.submitted_items.push(obj);

        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'board', langText);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'board');
        }
        // if (req.user.student_id % 2 === 0) {
        //     data.list.sort((a, b) => a.title.localeCompare(b.title));
        // }
        data.type = 'board';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardingBoardHeading(language[0].code);
        } else {
            data.title = onBoardingBoardOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.list = data.list.map((a) => {
            if (a.code == code) {
                a.is_active = 1;
            }
            return a;
        });
        return data;
    }

    // No type is selected and language is not selected
    // return the language list first
    if (!req.user.locale) {
        data.list = await Language.getListNewOnBoarding(db.mysql.read);
        data.type = 'language';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardinglanguageHeading;
        } else {
            data.title = onBoardinglanguageOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        return data;
    }

    // Language is selected
    const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
    let obj = {};
    obj.type = 'language';
    obj.title = language[0].language_display;
    obj.code = language[0].code;
    data.submitted_items.push(obj);

    let langText = language[0].language;

    // if class is not selected
    // Return the class list depending on the language
    if (!req.user.student_class) {
        let result = await ClassContainer.getClassListNewOnBoarding(db, language[0].language);
        let temp = result.shift();
        result.push(temp);
        temp = result.shift();
        result.splice(2, 0, temp);
        data.list = result;
        data.type = 'class';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardingClassHeading(language[0].code);
        } else {
            data.title = onBoardingClassOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        return data;
    }

    // class is  already selected
    // check for exam and boards depending on class
    obj = {};
    let classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, req.user.student_class);
    if (req.user.isDropper) {
        classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, 13);
    }
    obj.type = 'class';
    obj.title = classData[0].title;
    obj.code = classData[0].code;
    data.submitted_items.push(obj);

    // class 6,7,8,9 handled
    if (_.includes(classGrp1, req.user.student_class)) {
        data.list = [];
        data.type = '';
        data.title = '';
        data.ask_question = true;
        data.is_multi_select = false;
        return data;
    }

    // class 10 handled
    if (req.user.student_class == 10) {
        const boardsData = await classCourseMapping.getStudentsExamsBoardsData(db.mysql.read, req.user.student_id, 'board');
        // If board is selected, return it
        if (boardsData.length) {
            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = true;
            data.is_multi_select = false;
            return data;
        }
        // Else get boards list
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'board', langText);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'board');
        }
        // if (req.user.student_id % 2 === 0) {
        //     data.list.sort((a, b) => a.title.localeCompare(b.title));
        // }
        data.type = 'board';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardingBoardHeading(language[0].code);
        } else {
            data.title = onBoardingBoardOldHeading;
        }
        data.ask_question = true;
        data.is_multi_select = false;
        return data;
    }

    // class 13, 14 goes here
    if (req.user.isDropper || req.user.student_class == 14) {
        let stClass = 14;
        if (req.user.isDropper) {
            stClass = 13;
        }
        const examsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'exam');
        // exam is selected, just return it
        if (examsData.length) {
            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = true;
            data.is_multi_select = true;
            return data;
        }
        // else return the list of exams
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, stClass, 'exam', langText);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, stClass, 'exam');
        }
        data.type = 'exam';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardingExamHeading(language[0].code);
        } else {
            data.title = onBoardingExamOldHeading;
        }
        data.ask_question = true;
        data.is_multi_select = true;
        return data;
    }

    // class 11 and 12 goes here
    const boardsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'board');
    // If board exists, check for exams
    if (boardsData.length) {
        const examsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'exam');
        // if exam is selected, return it
        if (examsData.length) {
            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = true;
            data.is_multi_select = true;
            return data;
        }
        // if exam is not selected, return the exams list
        obj = {};
        obj.type = 'board';
        obj.title = boardsData[0].course;
        obj.code = boardsData[0].id;
        data.submitted_items.push(obj);

        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'exam', langText);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'exam');
        }
        data.type = 'exam';
        // if (req.user.student_id % 2 === 0) {
        if (version === 3) {
            data.title = onBoardingExamHeading(language[0].code);
        } else {
            data.title = onBoardingExamOldHeading;
        }
        data.ask_question = true;
        data.is_multi_select = true;
        return data;
    }
    // if boards is not selected, return the boards list.
    // if (req.user.student_id % 2 === 0) {
    if (version === 3) {
        data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'board', langText);
    } else {
        data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'board');
    }
    // if (req.user.student_id % 2 === 0) {
    //     data.list.sort((a, b) => a.title.localeCompare(b.title));
    // }
    data.type = 'board';
    // if (req.user.student_id % 2 === 0) {
    if (version === 3) {
        data.title = onBoardingBoardHeading(language[0].code);
    } else {
        data.title = onBoardingBoardOldHeading;
    }
    data.ask_question = false;
    data.is_multi_select = false;
    return data;
}

async function getStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        const { type } = req.query;
        const { code } = req.query;
        let data = await getStudentOnboardingResponse(req, type, code);
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
        next(e);
    }
}

// eslint-disable-next-line no-shadow
async function updateStudentCourseAndExam(db, code, type, sId) {
    const promises = [];
    for (let i = 0; i < code.length; i++) {
        const obj = {
            student_id: sId,
            ccm_id: code[i],
        };
        promises.push(StudentCourseMapping.insertWidgetSelectionForStudent(db.mysql.write, obj));
    }
    await Promise.all(promises);
}

async function postStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        const { type } = req.body;
        const { code } = req.body;
        const { title } = req.body;
        const studentId = req.user.student_id;
        let data = {};
        data.submitted_items = [];

        let version = 3;

        if (type === 'language') {
            let obj = { locale: code[0] };
            await Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id);
            await Student.deleteUserInRedis(req.user.student_id, db.redis.write);
            obj = {};
            obj.type = type;
            obj.title = title[0];
            obj.code = code[0];
            data.submitted_items.push(obj);

            const language = await LanguageContainer.getLanguageByCode(db, code[0]);
            let result = await ClassContainer.getClassListNewOnBoarding(db, language[0].language);
            let temp = result.shift();
            result.push(temp);
            temp = result.shift();
            result.splice(2, 0, temp);
            data.list = result;

            data.type = 'class';
            // if (req.user.student_id % 2 === 0) {
            if (version === 3) {
                data.title = onBoardingClassHeading(code[0]);
            } else {
                data.title = onBoardingClassOldHeading;
            }
            data.ask_question = false;
            data.is_multi_select = false;
        }
        if (type === 'class') {
            let obj = { student_class: code[0] };
            await Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id);
            await Student.deleteUserInRedis(req.user.student_id, db.redis.write);
            obj = {};
            const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
            obj.type = 'language';
            obj.title = language[0].language_display;
            obj.code = language[0].code;
            data.submitted_items.push(obj);

            let langText = language[0].language;

            obj = {};
            obj.type = type;
            obj.title = title[0];
            obj.code = code[0];
            data.submitted_items.push(obj);

            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = true;
            data.is_multi_select = false;

            if (code[0] == 11 || code[0] == 12 || code[0] == 10) {
                // if (req.user.student_id % 2 === 0) {
                if (version === 3) {
                    data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, code[0], 'board', langText);
                } else {
                    data.list = await studentContainer.getExamsBoardsDetails(db, code[0], 'board');
                }
                // if (req.user.student_id % 2 === 0) {
                //     data.list.sort((a, b) => a.title.localeCompare(b.title));
                // }
                data.type = 'board';
                // if (req.user.student_id % 2 === 0) {
                if (version === 3) {
                    data.title = onBoardingBoardHeading(language[0].code);
                } else {
                    data.title = onBoardingBoardOldHeading;
                }
                data.ask_question = false;
                if (code[0] == 10) {
                    data.ask_question = true;
                }
                data.is_multi_select = false;
            }

            if (code[0] == 13 || code[0] == 14) {
                // if (req.user.student_id % 2 === 0) {
                if (version === 3) {
                    data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, code[0], 'exam', langText);
                } else {
                    data.list = await studentContainer.getExamsBoardsDetails(db, code[0], 'exam');
                }
                data.type = 'exam';
                // if (req.user.student_id % 2 === 0) {
                if (version === 3) {
                    data.title = onBoardingExamHeading(language[0].code);
                } else {
                    data.title = onBoardingExamOldHeading;
                }
                data.ask_question = true;
                data.is_multi_select = true;
            }
        }

        if (type === 'board') {
            await updateStudentCourseAndExam(db, code, type, req.user.student_id);
            let obj = {};
            const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
            obj.type = 'language';
            obj.title = language[0].language_display;
            obj.code = language[0].code;
            data.submitted_items.push(obj);

            let langText = language[0].language;

            const classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, req.user.student_class);
            obj = {};
            obj.type = 'class';
            obj.title = classData[0].title;
            obj.code = classData[0].code;
            data.submitted_items.push(obj);

            if (req.user.student_class == 11 || req.user.student_class == 12) {
                obj = {};
                obj.type = type;
                obj.title = title[0];
                obj.code = code[0];
                data.submitted_items.push(obj);

                // if (req.user.student_id % 2 === 0) {
                if (version === 3) {
                    data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'exam', langText);
                } else {
                    data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'exam');
                }
                data.type = 'exam';
                // if (req.user.student_id % 2 === 0) {
                if (version === 3) {
                    data.title = onBoardingExamHeading(language[0].code);
                } else {
                    data.title = onBoardingExamOldHeading;
                }
                data.ask_question = true;
                data.is_multi_select = true;
            }
        }

        if (type === 'exam') {
            await updateStudentCourseAndExam(db, code, type, req.user.student_id);
        }
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
        next(e);
    }
}

async function getOnboardingStatus(req, res, next) {
    db = req.app.get('db');
    const { student_id: sId, timestamp } = req.user;
    const { version_code: versionCode } = req.headers;
    try {
        let data = {};
        data.isOnboardingCompleted = false;
        data.student_language = null;
        data.student_class = null;
        data.isVideoWatched = false;
        data.selectedExamBoardsList = [];
        const classGrp = {
            6: true,
            7: true,
            8: true,
            9: true,
            10: true,
            11: true,
            12: true,
            14: true,
            21: true,
            22: true,
            23: true,
            24: true,
            25: true,
            26: true,
            27: true,
        };

        if (req.user.student_class && req.user.locale && classGrp[req.user.student_class]) {
            data.student_language = {};
            data.student_class = {};
            const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
            data.student_language.name = language[0].language_display;
            data.student_language.display = language[0].language_display;
            data.student_language.code = language[0].code;

            let classData;
            if (req.user.isDropper) {
                classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, 13);
            } else {
                classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, req.user.student_class);
            }

            data.student_class.name = classData[0].title;
            data.student_class.display = classData[0].title;
            data.student_class.code = classData[0].code;

            data.isOnboardingCompleted = true;
            if (req.user.student_class == 10 || req.user.student_class == 9) {
                const boardsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'board');
                if (!boardsData.length) {
                    data.isOnboardingCompleted = false;
                }
            }
            if (req.user.student_class == 11 || req.user.student_class == 12 || req.user.isDropper || req.user.student_class == 14) {
                const examsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'exam');
                if (!examsData.length) {
                    data.isOnboardingCompleted = false;
                }
            }
            data.selectedExamBoardsList = await StudentCourseMapping.getSelectExamBoard(db.mysql.read, sId);
        }
        // const videoWatched = await StudentCourseMapping.getLatestWatchedVideo(db.mysql.read, sId);  /* this query is not working for those users who have not seen videos from SRP or have seen videos from SRP long ago and at least last 500 vv is not from SRP */
        const videoWatched = await StudentRedis.getLastSrpQidAnsId(db.redis.read, req.user.student_id);
        if (!_.isNull(videoWatched)) {
            data.isVideoWatched = true;
        }

        if (!classGrp[req.user.student_class]) {
            const obj = { student_class: null, locale: null };
            await Promise.all([
                Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id),
                Student.deleteUserInRedis(req.user.student_id, db.redis.write),
            ]);
        }

        if (req.headers.country && req.headers.country.toLowerCase() == 'us') {
            if (_.isNull(data.student_language)) {
                data.student_language = {};
            }
            if (_.isNull(data.student_class)) {
                data.student_class = {};
            }
            data.isOnboardingCompleted = true;
            if (typeof req.user.student_class === 'undefined') {
                data.student_class.name = '12';
                data.student_class.display = 'Grade 12';
                data.student_class.code = 27;
            }
            if (typeof req.user.locale === 'undefined') {
                data.student_language.name = 'en';
                data.student_language.display = 'English';
                data.student_language.code = 'en';
            }
        }

        if (_.isNull(req.user.mobile) && req.user.is_web == 8) {
            data.isOnboardingCompleted = true;
        }

        if (versionCode > 963) {
            data.default_onboarding_deeplink = await StudentHelper.getLandingDeeplink(db, sId, timestamp);
        }
        const obj = {
            xAuthToken: req.headers['x-auth-token'],
            versionCode: req.headers.version_code,
            studentId: req.user.student_id,
            locale: req.user.locale,
            gcmRegId: req.user.gcm_reg_id,
            studentClass: req.user.student_class,
        };
        const isDNREnabled = StudentHelper.showDnrExp(req.user.student_id, req.headers.package_name);
        if (isDNREnabled) {
            studentContainer.studentReloginReward(db, req.headers['x-auth-token'], req.headers.version_code, req.user.student_id);
        }
        RewardsHelper.dnrRewardForReinstallStudent(db, obj);
        RewardsHelper.freeCourseRewardForReinstallStudent(db, obj);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getLoginTimer(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const { package_name: packageName } = req.headers;

        const variantId = 2;
        let newVariant = 3;
        const leave = Math.floor(Math.random() * 10);

        // const studentImages = await StudentMySQL.getStudentImages(leave, 3, db.mysql.read);
        // let imgList = '';
        // imgList += studentImages.map((x) => buildStaticCdnUrl(x.img_url));
        const imgList = `${config.staticCDN}images/user-default-doubtnut.png`;

        let idForFlagr;
        if (_.isEmpty(req.query.udid)) {
            idForFlagr = new Date().getTime();
        } else {
            idForFlagr = req.query.udid;
        }

        let enable_language_change = false;
        if (req.headers.version_code > 804) {
            const flgrData = { body: { capabilities: { 'on-boarding-language-button': {} }, entityId: idForFlagr } };
            const flgrResp = await UtilityFlagr.getFlagrResp(flgrData);

            if (flgrResp != undefined && flgrResp['on-boarding-language-button'].enabled && flgrResp['on-boarding-language-button'].payload.enabled) {
                enable_language_change = flgrResp['on-boarding-language-button'].payload.enabled;
            }
        }

        let countryCode = '+91';
        if (req.headers['x-client-region'] && req.headers['x-client-region'] !== 'IN') {
            const allCountryDetails = CountryDetailsStaticData.countries;
            const detectedCountry = allCountryDetails.filter((x) => x.name_code === req.headers['x-client-region'].toLowerCase());
            if (detectedCountry.length > 0) {
                countryCode = `+${detectedCountry[0].phone_code}`;
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                time: 15,
                onboarding_variant: variantId,
                login_variant: newVariant,
                student_images: imgList,
                enable_truecaller: true,
                enable_missed_call_verification: true,
                enable_language_change,
                cache_invalidate_time: 10,
                enable_guest_login: true,
                enable_deeplink_guest_login: false,
                lottie_urls: {
                    login_screen: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_login_screen_animation.zip',
                    phone_back_press: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_fragment_phone_back_press.zip',
                    otp_back_press: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_fragment_otp_back_press.zip',
                    incoming_call: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_incoming_call.zip',
                    no_internet: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_no_internet_animation.zip',
                    message: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_message.zip',
                    missed_call: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_missed_call.zip',
                    invalid_image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_invalid_image_animation.zip',
                    match_gesture_data: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_match_gesture_data.zip',
                    match_page_loader_1: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_match_page_loader_1.zip',
                    match_page_loader_2: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_match_page_loader_2.zip',
                    call: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_call.zip',
                    missed_call_success: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_checkbox.zip',
                    otp_screen: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/lottie_otp_screen.zip',
                    video_screen_refer_and_earn: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/coin%20jump.zip',
                },
                country_code: countryCode,
            },
        };

        if (req.headers.version_code > 1002) {
            responseData.data.gmail_verification_screen_text = 'Please provide your email id to continue using social features like friends and study group.::$$::फ्रेंड्स और स्टडी ग्रुप जैसे फीचर्स उपयोग करते रहने के लिए अपना ईमेल ID वेरीफाई करना जरूरी है, अभी वेरीफाई करें!::$$::Doubtnut collects email ID to enable quality control. This ensures that only verified and like-minded students benefit from the platform.::$$::Doubtnut App पर आने वाले सभी बच्चो की सुरक्षा के लिए ईमेल ID लिया जाता है । ईमेल ID के द्वारा Doubtnut सुनिश्चित कर पाता है की App पर आने वाले सभी छात्र सत्यापित है और मंच पे सभी चर्चा निरापद है।';
        }

        if (StudentHelper.isAltApp(packageName)) {
            responseData.data.enable_truecaller = false;
            responseData.data.enable_missed_call_verification = false;
            responseData.data.enable_guest_login = false;
            responseData.data.enable_deeplink_guest_login = false;
        }

        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getClassLanguage(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        const xAuthToken = req.headers['x-auth-token'];
        let data = {};
        const region = req.headers.country;
        data.isOnboardingCompleted = false;
        data.student_language = null;
        data.student_class = null;
        const classGrp = {
            6: true,
            7: true,
            8: true,
            9: true,
            10: true,
            11: true,
            12: true,
            14: true,
        };

        if (req.user.student_class && req.user.locale && classGrp[req.user.student_class]) {
            data.student_language = {};
            data.student_class = {};
            const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
            data.student_language.name = language[0].language_display;
            data.student_language.display = language[0].language_display;
            data.student_language.code = language[0].code;

            let classData;
            if (req.user.isDropper) {
                classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, 13);
            } else {
                classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, req.user.student_class);
            }

            data.student_class.name = classData[0].title;
            data.student_class.display = classData[0].title;
            data.student_class.code = classData[0].code;

            data.isOnboardingCompleted = true;
        }

        data.pin_exist = false;
        if (!_.isEmpty(req.user.mobile) || !_.isEmpty(req.user.student_email)) {
            const identifier = req.user.mobile || req.user.student_email;
            const getUserPin = await StudentMySQL.getPin(db.mysql.read, identifier, Utility.isUsRegion(region));
            if (getUserPin.length > 0) {
                data.pin_exist = true;
                data.pin = getUserPin[0].pin;
            }
        }
        if (req.headers.version_code) {
            if (req.headers.version_code >= 898) {
                try {
                    if (req.headers.version_code >= 956) {
                        data.dnr = {
                            title: Data.dnr(req.user.locale).title,
                            title1: Data.dnr(req.user.locale).title1,
                            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/37FFAB68-7DA0-6041-5EBC-84C69EC7BC71.webp',
                            description: Data.dnr(req.user.locale).description,
                            cta_text: Data.dnr(req.user.locale).cta_text,
                            deeplink: 'doubtnutapp://dnr/home',
                            lf_engagement_time: 300000,
                            sf_engagement_time: 60000,
                            srp_sf_engagement_time: 30000,
                        };
                        const isDNREnabled = StudentHelper.showDnrExp(req.user.student_id, req.headers.package_name);
                        if (!isDNREnabled) {
                            data.dnr.title = '';
                            data.dnr.title1 = '';
                            data.dnr.image = '';
                            data.dnr.deeplink = '';
                            data.dnr.description = '';
                            data.dnr.cta_text = '';
                        }
                    }
                    if (req.headers.version_code >= 906 && !Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
                        data.doubt_p2p = {
                            title: (global.t8[req.user.locale].t('Doubt Pe Charcha')),
                            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/C707EBE4-0585-ECBE-24D2-BBAB6B369AC5.webp',
                            deeplink: 'doubtnutapp://doubt_p2p_collection',
                        };
                    }
                    if (req.headers.version_code >= 946) {
                        const isStudyGroupMute = await studyGroup.isNotificationEnabledV2(req.user.student_id, db);
                        data.study_group = {
                            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp',
                            title: global.t8[req.user.locale].t('Study Group'),
                            deeplink: 'doubtnutapp://study_group/list?tab_position=0',
                            is_mute: isStudyGroupMute,
                        };
                    } else {
                        const isStudyGroup = await studyGroup.isStudyGroupEnabled(req);
                        const isStudyGroupMute = await studyGroup.isNotificationEnabled(req.user.student_id, db);
                        data.study_group = {
                            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/93E85408-4200-C418-26CE-99A8DEB83BB8.webp',
                            title: global.t8[req.user.locale].t('Study Group'),
                            is_group_exist: isStudyGroup.isGroupExist,
                            is_mute: isStudyGroupMute,
                        };
                    }
                    if (req.headers.version_code >= 916) {
                        data.khelo_jeeto_v2 = {
                            title: global.t8[req.user.locale].t('Khelo Aur Jeeto'),
                            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9341C6A5-7065-CF72-7B91-69B5CBBF9E30.webp',
                            deeplink: 'doubtnutapp://khelo_jeeto/home',
                        };
                    } else {
                        try {
                            const lastPlayedData = await studentRedis.getLastAvailableTopic(req.user.student_id, db.redis.read);
                            if (lastPlayedData) {
                                let lastTopicData = JSON.parse(lastPlayedData);
                                if (typeof lastTopicData === 'string') {
                                    lastTopicData = JSON.parse(lastTopicData);
                                }
                                if (lastTopicData.question_id && lastTopicData.chapter_alias) {
                                    studentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', req.user.student_id, 1);
                                    data.khelo_jeeto_v2 = {
                                        title: global.t8[req.user.locale].t('Khelo Aur Jeeto'),
                                        image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9341C6A5-7065-CF72-7B91-69B5CBBF9E30.webp',
                                        deeplink: `doubtnutapp://topic_booster_game?qid=${lastTopicData.question_id}`,
                                    };
                                }
                            }
                        } catch (e) {
                            console.log(e);
                        }
                    }
                    if (req.headers.version_code >= 937 && req.user.student_class < 14) {
                        data.revision_corner = {
                            title: (global.t8[req.user.locale].t('Revision Corner')),
                            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D4F531CA-5FEF-85C2-DCCA-595FAEE39328.webp',
                            deeplink: 'doubtnutapp://revision_corner',
                        };
                    }
                    if (req.headers.version_code >= 921) {
                        const flagVariants = req.headers.flagr_variation_ids.split(',');
                        if (flagVariants.includes('1169')) {
                            data.doubt_feed_2 = {
                                title: (global.t8[req.user.locale].t('Daily Goal')),
                                image: `${config.cdn_url}daily_feed_resources/daily-goal-top-icon.webp`,
                                deeplink: 'doubtnutapp://doubt_feed_2',
                            };
                        }
                    }
                } catch (e) {
                    console.log(e);
                }
            }
            if (req.headers.version_code > 939 && _.get(req, 'headers.flagr_variation_ids', null)) {
                const flagVariantsArr = req.headers.flagr_variation_ids.split(',');
                if (flagVariantsArr.includes('1365')) {
                    data.dictionary_data = {
                        dictionary_text: global.t8[req.user.locale].t('Dictionary'),
                        dictionary_icon_url: `${config.staticCDN}dictionary/dictionary-icon.webp`,
                        dictionary_deeplink: 'doubtnutapp://dictionary',
                    };
                }
            }
        }
        data.gmail_verified = false;
        if (req.user.is_email_verified) {
            data.gmail_verified = true;
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function addUserToGupShup(req, res, next) {
    db = req.app.get('db');
    try {
        let mobileList = req.params.phone.split(',');
        let studentInfo = await Student.getStudentListByMobile(db.mysql.read, mobileList);

        let studentIdList = [];

        for (let i = 0; i < studentInfo.length; i++) {
            studentIdList.push(studentInfo[i].student_id);
        }

        await RedisUtil.sadd(db.redis.write, 'gupshup_show', studentIdList);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            studentInfo,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function liveClassNotification(req, res, next) {
    // getting db
    db = req.app.get('db');

    // storing all body data into variables
    const { sid } = req.body;
    const { title } = req.body;
    const { msg: message } = req.body;
    const { qid } = req.body;
    const { img: image } = req.body;
    const { btn_txt: btnTxt } = req.body;
    const { trigger } = req.body;
    const { action } = req.body;
    // const { s_class: sClass } = req.body;
    // const { lang } = req.body;
    const { type } = req.body;

    // getting time and date right now
    const today = new Date();
    // getting time and date of EOD
    const endOfDayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    // getting difference of EOD and right now
    const diff = parseInt(endOfDayDate / 1000) - parseInt(today / 1000);
    // const diff = 20

    // checking for action type
    if (action === 'insert') {
        const sidArr = sid.split(',');
        const typeArr = type.split('_');
        const redisType = `${typeArr[0]}_${typeArr[1]}_${typeArr[2]}_${typeArr[4]}`;
        // iterate student array to call flagr for each student
        for (let i = 0; i < sidArr.length - 1; i++) {
            const flgrData = { body: { capabilities: { 'live-class-in-app-notification': {} }, entityId: sidArr[i] } };
            // eslint-disable-next-line no-await-in-loop
            const flgrResp = await UtilityFlagr.getFlagrResp(flgrData);

            // if flagr enables then the next work
            if (_.get(flgrResp, 'live-class-in-app-notification.payload.enabled', null)) {
                // eslint-disable-next-line no-await-in-loop
                let redisSet = await studentContainer.redisSetForLiveClass(db, redisType, sidArr[i], diff);
                if (redisSet) {
                    const notificationLogData = {
                        student_id: parseInt(sidArr[i]),
                        time: today,
                        type,
                        message: {
                            trigger, event: 'video', title, message, image, button_text: btnTxt, data: `{"qid":${qid}, "page": "INAPP"}`,
                        },
                        status: 'pending',
                    };
                    const mysqlData = {
                        student_id: sidArr[i],
                        question_id: qid,
                        type,
                    };
                    notification.liveClassNotification(db, notificationLogData, mysqlData);
                }
            }
        }
    } else if (action === 'remove') {
        let flag = 0;
        let count = 0;
        while (flag == 0 && count < 3) {
            count++;
            // eslint-disable-next-line no-await-in-loop
            const res2 = await notification.removeLiveClassNotification(db, type);
            if (res2) {
                flag = 1;
            }
        }
    }

    const responseData = {
        meta: {
            code: 200,
            success: true,
        },
        data: 'Operation Completed',
    };
    return res.status(200).json(responseData);
}

async function autoPlayData(req, res, next) {
    /*
    * This API is being used to keep track of video view for DNR homepage video
    */
    db = req.app.get('db');
    const mongoClient = db.mongo;

    const {
        answer_video, video_time, view_from: viewFrom,
    } = req.body;

    const { student_id } = req.user;

    const responseData = {
        meta: {
            code: 200,
            success: true,
        },
        data: 'Views Inserted',
    };

    try {
        if (viewFrom === 'dnr') {
            const ip = Utility.getClientIp(req);
            const viewData = {
                student_id,
                question_id: '649246228',
                answer_id: '16779970',
                answer_video,
                video_time,
                ip_address: ip,
                source: 'android',
                view_from: viewFrom,
                created_at: moment().add(5, 'hours').add(30, 'minutes').toISOString(),
            };

            mongoClient.write.collection('dnr_vv').insertOne(viewData);
            // VideoView.autoPlayViewsInsertion(db.mysql.write, viewData);
            return res.status(200).json(responseData);
        }

        responseData.data = 'Views Not Inserted';
        return res.status(200).json(responseData);
    } catch (err) {
        responseData.meta.code = 403;
        responseData.data = `Error from catch block : ${err}`;
        return res.status(200).json(responseData);
    }
}

async function storeOnBoardLanguage(req, res, next) {
    db = req.app.get('db');
    try {
        const { gcm_id: gcmId, locale } = req.body;
        const { version_code: versionCode } = req.headers;

        const obj = {
            gcm_id: gcmId,
            locale,
        };
        if (versionCode >= 788) {
            const { udid } = req.body;
            obj.udid = udid;
        }

        const insertRecord = StudentMySQL.storeOnBoardLanguageData(db.mysql.write, obj);

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: 'Language Inserted',
        };
        return res.status(200).json(responseData);
    } catch (err) {
        next(err);
    }
}

async function storePin(req, res) {
    db = req.app.get('db');
    let responseData;
    const region = req.headers.country;
    const numbers = /^[0-9]+$/;
    if (!req.body.pin.match(numbers) || !req.body.pin.length === 4) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'PIN is not in right format',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
    try {
        if (!_.isEmpty(req.user.mobile) || !_.isEmpty(req.user.student_email)) {
            responseData = await StudentContainer.generatePinBL(db, req.body.pin, req.user, true, Utility.isUsRegion(region));
        } else {
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                },
                data: {
                    message: 'Mobile No not found for this user',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }

    return res.status(responseData.meta.code).json(responseData);
}

async function loginWithPin(req, res, next) {
    let responseData;
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let {
            identifier, identifier_type, pin, udid,
        } = req.body;
        const region = req.headers.country;
        let verifyPinResponse = await StudentMySQL.verifyStudentByPin(db.mysql.read, identifier, pin, Utility.isUsRegion(region));
        if (!_.isEmpty(verifyPinResponse)) {
            let studentRow;
            if (Utility.isInputEmailId(identifier)) {
                studentRow = await StudentMySQL.getAllStudentsByEmailId(identifier, db.mysql.read, Utility.isUsRegion(region));
            } else {
                studentRow = await StudentMySQL.getAllStudentsByPhoneGlobally(identifier, Utility.isUsRegion(region), db.mysql.read);
            }
            if (!_.isEmpty(studentRow) && studentRow.length) {
                let { student_id } = studentRow[0];
                let { student_username } = studentRow[0];
                if (!_.isEmpty(udid)) {
                    // StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udid);
                    // NEW LOGIC
                    let promises = [];
                    promises.push(StudentRedis.getActiveDeviceIds(db.redis.write, student_id));
                    promises.push(CourseMysql.getDistinctClassWiseCoursesPurchasedByStudent(db.mysql.read, student_id));
                    let resolvedPromises = await Promise.all(promises);
                    if (_.isNull(resolvedPromises[0])) {
                        StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udid);
                    } else {
                        let devicesAvailableCounter = resolvedPromises[1][0].class_count > 1 ? resolvedPromises[1][0].class_count : 1;
                        let currentActiveDevices = resolvedPromises[0].split('#');
                        if (currentActiveDevices.length < devicesAvailableCounter) {
                            // let udids = currentActiveDevices.push(udid).join('#');
                            currentActiveDevices.push(udid);
                            let udids = currentActiveDevices.join('#');
                            StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
                        } else {
                            currentActiveDevices.shift();
                            currentActiveDevices.push(udid);
                            let udids = currentActiveDevices.join('#');
                            StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
                        }
                    }
                }
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User registered',
                    },
                    data: {
                        student_id,
                        token: Token.create(student_id, config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username,
                        is_new_user: false,
                    },
                };
            } else {
                responseData = {
                    meta: {
                        code: 200,
                        success: false,
                    },
                    data: {
                        message: 'SIGN - UP, user doesnot exists',
                    },
                };
            }
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.log(error);
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getOtpDeliveryDetails(req, res) {
    db = req.app.get('db');
    let responseData;
    try {
        const { mobile_no: mobile } = req.params;
        const delReport = await StudentMySQL.getOtpDeliveryReport(db.mysql.read, mobile);

        if (delReport.length > 0) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Delivery Report',
                },
                data: {
                    message: 'Delivery Report Details',
                    report_details: delReport[0],
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'No delivery report found',
                },
                data: {
                    message: 'No delivery report found on this mobile number',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 404,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function storeOtpDeliveryDetails(req, res) {
    db = req.app.get('db');
    let responseData;
    try {
        const {
            To: mobile, SessionId: sessionId, Status: status, Error: errorCode, Retry: retry,
        } = req.query;
        const obj = {
            number: mobile,
            session_id: sessionId,
            status,
            error_code: errorCode,
            retry,
        };
        const storeDelReport = await StudentMySQL.storeOtpDeliveryReport(db.mysql.write, obj);

        if (storeDelReport.affectedRows === 1) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Delivery Report Inserted',
                },
                data: {
                    message: 'Delivery Report Stored Successfully. Thanks !!!',
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 404,
                    success: false,
                    message: 'Failed',
                },
                data: {
                    message: 'Uh oh!!! Delivery Report Insertion Failed',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 404,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function verifySocialOAuth(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let userDetails = req.user;
        const params = JSON.parse(req.query.state);
        const redirectionEnv = params.is_staging ? 'staging' : 'prod';
        userDetails = await StudentBl.updateRowByAuthorised(db, config, userDetails, params);
        if (_.isEmpty(userDetails)) {
            throw 'UNAUTHORIZED';
        } else {
            const redirect_params = queryString.stringify(userDetails);
            res.redirect(`${socialLoginPassport.web.callBackRedirectionBaseUrl[params.country.toLowerCase()][redirectionEnv]}account?${redirect_params}`);
        }
    } catch (e) {
        res.redirect(`${socialLoginPassport.web.callBackRedirectionBaseUrl[JSON.parse(req.query.state).country.toLowerCase()]}`);
    }
}

async function checkSurveyByUser(req, res) {
    db = req.app.get('db');
    let responseData;
    try {
        const { student_id: studentId, locale, student_class: studentClass } = req.user;
        const { version_code: versionCode } = req.headers;
        const NPS_ID = 6;
        const testingSids = surveyTestingIds;
        const { page } = req.query;
        if (+versionCode > 1010 && page === 'HOME_PAGE') {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Survey Details',
                },
                data: {
                    message: 'No survey found',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        if (versionCode >= 851) {
            let surveyNo = 0;

            const promiseArr = [
                StudentMySQL.getAllSurveyByUser(db.mysql.read, studentId),
                StudentMySQL.getSurveyFeedbackDataForUser(db.mysql.read, studentId),
                StudentMySQL.getLastFeedbackBySurveyId(db.mysql.read, NPS_ID, studentId),
            ];
            const allRes = await Promise.all(promiseArr);

            let allSurveyByUser = allRes[0];
            const studentFeedbackDetails = allRes[1];
            const lastFeedbackOfRepeatingSurvey = allRes[2];

            allSurveyByUser = allSurveyByUser.filter((x) => x.locale === 'all' || x.locale === locale);
            if (!allSurveyByUser.find((x) => x.id === 6)) {
                allSurveyByUser.push({ id: 6, locale: 'all' });
                allSurveyByUser = _.orderBy(allSurveyByUser, 'id', 'desc');
            }
            const requiredResult = [];
            for (let i = 0; i < allSurveyByUser.length; i++) {
                let tgCheck = true;
                if (allSurveyByUser[i].target_group) {
                    // eslint-disable-next-line no-await-in-loop
                    tgCheck = await TGHelper.targetGroupCheck({
                        db, studentId, tgID: allSurveyByUser[i].target_group, studentClass, locale,
                    });
                }
                if (tgCheck) {
                    requiredResult.push(allSurveyByUser[i]);
                }
            }
            allSurveyByUser = requiredResult;

            let isStudentCached = 0;
            let isPackageAvailable = 0;
            if (lastFeedbackOfRepeatingSurvey.length === 0) {
                isStudentCached = await StudentRedis.getSurveyStudentId(studentId, db.redis.read);
            } else {
                isPackageAvailable = await StudentMySQL.getStudentActivePackages(studentId, db.mysql.read);
            }
            const surveyDoneArr = studentFeedbackDetails.map((x) => x.survey_id);
            if (allSurveyByUser.length > 0) {
                for (const item of allSurveyByUser) {
                    if (surveyNo === 0) {
                        let flag = 0;
                        if (item.id === NPS_ID) {
                            if (isStudentCached) {
                                flag = 1;
                            } else if (isPackageAvailable && isPackageAvailable.length > 0 && isPackageAvailable[0].EXIST === 1) {
                                const now = new Date().getTime();
                                const lastFeedbackTime = new Date(lastFeedbackOfRepeatingSurvey[0].time).getTime();
                                const diff = now - lastFeedbackTime;
                                const diffHours = Math.floor(((diff / 1000) / 60) / 60); // hours
                                const lastFeedbackType = lastFeedbackOfRepeatingSurvey[0].type;
                                if (lastFeedbackType === 'feedback') {
                                    let { feedback } = lastFeedbackOfRepeatingSurvey[0];
                                    feedback = feedback.replace(/\n/g, '');
                                    if (feedback === 'Haan, Zaroor Batunga' && diffHours >= 24 * 14) {
                                        flag = 1;
                                    } else if ((feedback === 'Nahi, Utna Accha Nahi Laga' || feedback === 'Abhi Socha Nahi Hai') && diffHours >= 24 * 7) {
                                        flag = 1;
                                    }
                                } else if (lastFeedbackType === 'started' && diffHours >= 24 * 10) {
                                    flag = 1;
                                }
                            }
                        } else if (!surveyDoneArr.includes(item.id) || testingSids.includes(parseInt(studentId))) {
                            flag = 1;
                        }
                        if (flag === 1) {
                            surveyNo = item.id;
                        }
                    }
                }

                if (surveyNo === 0) {
                    responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'Survey Details',
                        },
                        data: {
                            message: 'No survey found',
                        },
                    };
                } else {
                    responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'Survey Details',
                        },
                        data: {
                            message: 'Survey found',
                            survey_id: surveyNo,
                        },
                    };
                }
            } else {
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Survey Details',
                    },
                    data: {
                        message: 'No survey found',
                    },
                };
            }
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Survey Details',
                },
                data: {
                    message: 'No survey found',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getSurveyDetails(req, res) {
    db = req.app.get('db');
    let responseData;
    try {
        const { surveyId } = req.params;

        const locale = req.user.locale || 'en';
        const sureveyPromiseArr = [
            StudentMySQL.getSurveyDetails(db.mysql.read, surveyId),
            StudentMySQL.getSurveyQuestions(db.mysql.read, surveyId),
        ];
        const surveyData = await Promise.all(sureveyPromiseArr);

        if (surveyData[0].length > 0) {
            let surveyDetails = surveyData[0][0];
            // if (surveyData[0].length > 1) {
            //     surveyDetails = surveyData[0].filter((x) => x.locale === locale);
            // }

            const surveyQuestions = surveyData[1];
            const surveyQids = surveyQuestions.map((x) => x.id).join();
            const optionsList = await StudentMySQL.getSurveyOptions(db.mysql.read, surveyQids);

            const finalData = {
                survey_starting_data: {
                    starting_img: surveyDetails.starting_img_url,
                    starting_heading: surveyDetails.headline_text,
                    starting_sub_heading: surveyDetails.sub_headline_text,
                    starting_button_text: surveyDetails.button_text,
                },
                survey_ending_data: {
                    ending_img: surveyDetails.ending_img_url,
                    ending_heading: surveyDetails.ending_heading_text,
                    ending_sub_heading: surveyDetails.ending_sub_heading_text,
                    ending_button_text: surveyDetails.ending_button_text,
                },
            };

            const questionsArr = [];
            surveyQuestions.forEach((item) => {
                const obj = {
                    question_id: item.id,
                    question_text: locale === 'hi' && item.hi_question_text !== '' ? item.hi_question_text : item.question_text,
                };
                const optionDetails = optionsList.filter((x) => x.question_id === item.id);
                const optionText = locale === 'hi' && optionDetails[0].hi_options_text !== '' ? optionDetails[0].hi_options_text : optionDetails[0].options_text;
                if (optionText === '') {
                    obj.options = [];
                } else if (optionText.indexOf('::,::') === -1) {
                    obj.options = [optionText];
                } else if (optionText.indexOf('::,::') > -1) {
                    obj.options = optionText.split('::,::');
                }
                obj.alert_text = optionDetails[0].alert_text;
                obj.type = optionDetails[0].option_type;
                obj.question_img = item.question_img;
                obj.skippable = !!item.skippable;
                obj.next_text = item.next_text;
                obj.skip_text = item.skip_text;
                questionsArr.push(obj);
            });

            finalData.question_data = questionsArr;

            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Survey Details',
                },
                data: finalData,
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'Failed',
                },
                data: {
                    message: 'Uh oh!!! No Survey Found',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function storeSurveyFeedback(req, res) {
    db = req.app.get('db');
    let responseData;
    try {
        const { survey_id: surveyId } = req.body;
        let feedback = '';
        const questionId = req.body.question_id || 0;
        if (!_.isEmpty(req.body.feedback)) {
            feedback = req.body.feedback;
        }
        const { student_id: studentId } = req.user;
        const { version_code: versionCode } = req.headers;

        let obj = {};
        let updateData = '';
        if (questionId === 0) {
            obj = {
                survey_id: surveyId,
                student_id: studentId,
                type: 'started',
            };
            updateData = await StudentMySQL.insertSurveyFeedback(db.mysql.write, obj);
        } else {
            const surveyRecords = await StudentMySQL.getSurveyFeedback(db.mysql.read, surveyId, studentId, questionId);
            if (surveyRecords.length > 0 && feedback) {
                obj = {
                    feedback,
                };
                updateData = await StudentMySQL.updateSurveyFeedback(db.mysql.write, obj, surveyId, studentId, questionId);
            } else {
                obj = {
                    survey_id: surveyId,
                    student_id: studentId,
                    question_id: questionId,
                    feedback,
                    type: 'feedback',
                };
                updateData = await StudentMySQL.insertSurveyFeedback(db.mysql.write, obj);
            }
            if (versionCode > 886) {
                const classBoardUpdateSurveyIds = [9, 10];
                if (classBoardUpdateSurveyIds.includes(parseInt(surveyId))) {
                    studentContainer.updateClassBoardExam(db, surveyId, studentId, questionId, feedback);
                }
            }
        }
        if (updateData.affectedRows === 1) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Survey Details Stored',
                },
                data: {
                    message: 'Survey Details Stored Successfully',
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Failed',
                },
                data: {
                    message: 'Uh oh!!! Survey Details can not be stored',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function ncertLastWatchedDetails(req, res) {
    db = req.app.get('db');
    let responseData = {};
    try {
        const { question_id: questionId } = req.body;
        const { student_class: studentClass, student_id: studentId } = req.user;
        let message = 'NCERT watched details Stored Successfully';
        let exerciseId = '';
        if (req.headers.version_code >= 946 && req.body.exercise_id != undefined) {
            if (req.body.exercise_id.includes('__BOOK')) {
                const currentVideoResponse = await libraryMysql.getLibraryBookDetailsByQid(db.mysql.read, questionId);
                if (currentVideoResponse.length > 0) {
                    const redisData = questionId;
                    QuestionRedis.setNcertLastWatchedDetails(db.redis.read, `library_book_lv_${currentVideoResponse[0].book_playlist_id}`, studentId, redisData);
                }
            } else if (req.body.exercise_id.includes('_')) {
                exerciseId = req.body.exercise_id;
                const exerciseArr = exerciseId.split('_');
                const exerciseMainId = exerciseArr.length === 7 ? exerciseArr[exerciseArr.length - 1] : exerciseArr[exerciseArr.length - 2];
                const packageId = exerciseArr.length === 7 ? exerciseArr.slice(0, -1).join('_') : exerciseArr.slice(0, -2).join('_');

                let watchDetailsRedis = await StudentRedis.getBookFlowData(db.redis.read, `lv_${packageId}`, studentId);
                if (!_.isNull(watchDetailsRedis)) {
                    const watchDetailsArr = watchDetailsRedis.split('_');

                    const redisData = `${exerciseMainId}_${questionId}_${watchDetailsArr[2]}`;
                    StudentRedis.setBookFlowData(db.redis.read, `lv_${packageId}`, studentId, redisData);
                }
            }
            message = 'BOOK watched details Stored Successfully';
        } else {
            const questionDetails = await QuestionMysql.getPlaylistVideoDetails(db.mysql.read, questionId, studentClass);
            if (questionDetails.length > 0) {
                const redisData = `${questionDetails[0].main_playlist_id}_${questionId}`;
                QuestionRedis.setNcertLastWatchedDetails(db.redis.read, `ncert_lv_${studentClass}`, studentId, redisData);
            }
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                message,
            },
        };
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getDoubtFeedDetails(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');

    try {
        const { student_id: studentId, student_class: studentClass, locale } = req.user;
        const { version_code: versionCode } = req.headers;
        const xAuthToken = req.headers['x-auth-token'];
        const thumbnailCdn = config.staticCDN;

        let topicId = '';
        if (req.body.topic_id != undefined) {
            topicId = req.body.topic_id;
        }

        const widget = [];
        let imageList = [];
        const topicList = await DoubtfeedMysql.getTopicByDate(db.mysql.read, studentId); // getting latest topic list
        let topicDetail;
        let topicName;
        let topicSubject;
        let finalData = {};

        if (topicList.length > 0) {
            let isPrevious = false;

            const topicDate = Utility.getDateFromMysqlDate(topicList[0].date);
            let currDate = new Date();
            const offset = new Date().getTimezoneOffset();
            if (offset == 0) {
                currDate.setHours(currDate.getHours() + 5);
                currDate.setMinutes(currDate.getMinutes() + 30);
            }
            currDate = Utility.getDateFromMysqlDate(currDate);

            let day = 'today';
            let heading = doubtfeed(locale).mainheading;
            if (topicDate != currDate) {
                day = 'old';
                isPrevious = true;
                heading = doubtfeed(locale).mainheadingOld;
            }

            // finalData.heading = heading;

            finalData.is_previous = isPrevious;

            if (topicId === '') {
                topicDetail = topicList[0];

                finalData.topics = topicList.map((x) => ({
                    title: `${x.topic}`,
                    key: `${x.id}`,
                    is_selected: Boolean(x.id === topicDetail.id),
                    subject: `${x.subject}`,
                }));
            } else {
                topicDetail = topicList.filter((x) => x.id == topicId);
                topicDetail = topicDetail[0];
            }
            topicName = topicDetail.topic;
            topicSubject = topicDetail.subject;

            imageList = await QuestionMysql.getAskedQuestionsByIds(db.mysql.read, topicDetail.qid_list); // getting image list of the selected topic
            if (imageList.length > 0) {
                const finalImgList = [];
                imageList.forEach((x, i) => {
                    const obj = {
                        widget_type: 'widget_asked_question',
                        widget_data: {
                            id: `${x.question_id}`,
                            card_width: '1.1',
                            card_ratio: '5.6',
                        },
                    };
                    if (x.question_image == null || !x.question_image.includes('uploads_')) {
                        obj.widget_data.question_text = x.ocr_text;
                    } else {
                        obj.widget_data.question_image = `${thumbnailCdn}images/${x.question_image}`;
                    }
                    finalImgList.push(obj);
                });

                const obj = {
                    widget_type: 'widget_parent',
                    widget_data: {
                        items: finalImgList,
                    },
                };
                widget.push(obj);
            }

            // making student images list pane starts

            const leave = Math.floor(Math.random() * 10);
            // const studentImages = await StudentMySQL.getStudentImages(leave, 3, db.mysql.read);
            // let imgList = '';
            // imgList += studentImages.map((x) => buildStaticCdnUrl(x.img_url));
            // imgList = imgList.split(',');
            const imgList = [`${config.staticCDN}images/user-default-doubtnut.png`];

            let noOfStudingStudents = Math.floor(Math.random() * 5000);
            if (noOfStudingStudents < 1000) {
                const diff = 1000 - noOfStudingStudents;
                noOfStudingStudents += diff;
            }

            const profilePics = {
                widget_type: 'widget_doubt_feed_start_practice',
                widget_data: {
                    title: doubtfeed(locale).studentSection.heading,
                    subtitle: `${noOfStudingStudents} ${doubtfeed(locale).studentSection.subHeading}`,
                    user_images: imgList,
                },
            };

            widget.push(profilePics);

            // making student images list pane ends

            const activeTopicData = await DoubtfeedMysql.getActiveTopicData(db.mysql.read, topicDetail.id);
            if (activeTopicData.length > 0) {
                const promise = [];
                let topicVideoPromise = [];
                let resourceList = [];
                let resourseId = [];

                const allCompleted = activeTopicData.filter((x) => x.is_viewed == 1);
                if (allCompleted.length == activeTopicData.length) {
                    heading = doubtfeed(locale).mainCompletedheading;
                }

                for (let i = 0; i < activeTopicData.length; i++) {
                    if (activeTopicData[i].type === 'LIVE_VIDEO') {
                        promise.push(LiveClassMysql.getLiveVideoByQid(db.mysql.read, activeTopicData[i].data_list));
                        resourceList.push('LIVE_VIDEO');
                    } else if (activeTopicData[i].type === 'TOPIC_VIDEO') {
                        promise.push(DoubtfeedMysql.getSimilarQuestionsByIds(db.mysql.read, activeTopicData[i].data_list));
                        topicVideoPromise.push(QuestionRedis.getTopicVideoQuestion(db.redis.write, studentId, 'DAILY_DOUBT'));
                        resourceList.push('TOPIC_VIDEO');
                    } else if (activeTopicData[i].type === 'TOPIC_MCQ') {
                        promise.push(DoubtfeedMysql.getTopicBoosterGameId(db.mysql.read, activeTopicData[i].id));
                        resourceList.push('TOPIC_MCQ');
                    } else if (activeTopicData[i].type === 'PDF') {
                        const dailyGoalObj = {
                            type: 'pdf',
                            subject: topicSubject,
                            chapter: topicName,
                            class: studentClass.toString(),
                            student_id: studentId,
                            locale,
                        };
                        promise.push(FreeLiveClass.getDataForDailyGoal(dailyGoalObj));
                        resourceList.push('PDF');
                    } else if (activeTopicData[i].type === 'FORMULA_SHEET') {
                        promise.push(DoubtfeedMysql.getFormulaById(db.mysql.read, activeTopicData[i].data_list));
                        resourceList.push('FORMULA_SHEET');
                    }
                    resourseId.push(activeTopicData[i].id);
                }

                const promiseDetails = await Promise.all(promise);
                const topicVideo = await Promise.all(topicVideoPromise);
                let itemObj;
                let totalItem = 0;
                let response;
                for (let i = 0; i < promiseDetails.length; i++) {
                    if (resourceList[i] === 'LIVE_VIDEO') {
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatLcData(db, config, promiseDetails[i], resourseId[i], totalItem, locale, versionCode);
                    } else if (resourceList[i] === 'TOPIC_VIDEO') {
                        let currentVideo = promiseDetails[i][0];
                        if (!_.isNull(topicVideo[0])) {
                            let flag = 0;
                            const storedVideoId = topicVideo[0];
                            promiseDetails[i].forEach((x) => {
                                if (flag == 1) {
                                    currentVideo = x;
                                }
                                if (x.question_id == storedVideoId) {
                                    flag = 1;
                                }
                            });
                        }
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatTopicVideoData(db, promiseDetails[i], resourseId[i], totalItem, locale, currentVideo, config.cdn_url);
                    } else if (resourceList[i] === 'TOPIC_MCQ') {
                        promiseDetails[i][0];
                        StudentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', studentId, 1);
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatTbData(db, promiseDetails[i][0].data_list, topicName, resourseId[i], totalItem, locale, thumbnailCdn);
                    } else if (resourceList[i] === 'PDF') {
                        if (promiseDetails[i] && Object.keys(promiseDetails[i]).length !== 0 && promiseDetails[i].pdf && promiseDetails[i].pdf.sugg && promiseDetails[i].pdf.sugg.length !== 0) {
                            if (promiseDetails[i].pdf.sugg.length > 2) {
                                promiseDetails[i].pdf.sugg.forEach((x) => {
                                    x._source = {
                                        id: x.srcId,
                                        subject: x._extras.subject,
                                        resource_path: x._extras.resource_path,
                                    };
                                });
                                // eslint-disable-next-line no-await-in-loop
                                response = await StudentBl.formatPdfData(db, promiseDetails[i].pdf.sugg, resourseId[i], topicDetail, totalItem, locale);
                            } else {
                                response = {};
                            }
                        }
                    } else if (resourceList[i] === 'FORMULA_SHEET') {
                        // eslint-disable-next-line no-await-in-loop
                        response = await StudentBl.formatFsData(db, promiseDetails[i], thumbnailCdn, resourseId[i], topicDetail, totalItem, locale);
                    }

                    if (response && Object.keys(response).length != 0) {
                        itemObj = response;
                        totalItem++;
                        const isViewedRes = activeTopicData.filter((x) => x.type === resourceList[i]);
                        if (isViewedRes.length > 0 && isViewedRes[0].is_viewed == 1) {
                            itemObj.widget_data.is_done = true;
                        }

                        widget.push(itemObj);
                    }
                }
            } else {
                const dateToBePassed = Utility.getDateFromMysqlDate(topicDetail.date);
                let previousTopic = await DoubtfeedMysql.getPreviousTopicByDate(db.mysql.read, studentId, topicName, dateToBePassed);
                const topicExist = previousTopic.length > 0;

                let previousResources = [];
                if (topicExist) {
                    previousTopic = previousTopic[0];
                    previousResources = await DoubtfeedMysql.getQuestionList(db.mysql.read, previousTopic.id);
                }

                let totalItem = 0;

                const dailyGoalObj = {
                    type: 'live',
                    subject: topicSubject,
                    chapter: topicName,
                    class: studentClass,
                    student_id: studentId,
                    locale,
                };
                let doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.liveClass;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let liveVideoData = await doubtfeedHelper.checkLcData(previousResources, elasticData);
                    if (liveVideoData.length > 0) {
                        liveVideoData = await StudentBl.makeLcData(db, config, topicDetail, totalItem, locale, versionCode, liveVideoData);
                        if (liveVideoData && Object.keys(liveVideoData).length != 0) {
                            totalItem++;
                            widget.push(liveVideoData);
                        }
                    }
                }

                dailyGoalObj.type = 'video';
                doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.video;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let topicVideoData = await doubtfeedHelper.checkTopicVideoData(previousResources, elasticData);
                    if (topicVideoData.length > 0) {
                        topicVideoData = await StudentBl.makeTopicVideoData(db, topicDetail, studentId, config.cdn_url, totalItem, locale, topicVideoData);
                        if (topicVideoData && Object.keys(topicVideoData).length != 0) {
                            totalItem++;
                            widget.push(topicVideoData);
                        }
                    }
                }

                const topicBoosterData = await StudentBl.makeTopicBoosterData(db, config, topicDetail, previousResources, studentId, studentClass, thumbnailCdn, totalItem, locale);
                if (topicBoosterData && Object.keys(topicBoosterData).length !== 0) {
                    StudentRedis.set7Day(db.redis.write, 'TOPIC_BOOSTER_VISIBILITY', studentId, 1);
                    totalItem++;
                    widget.push(topicBoosterData);
                }

                dailyGoalObj.type = 'pdf';
                doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
                doubtfeedData = doubtfeedData.pdf;
                if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                    doubtfeedData.sugg.forEach((x) => {
                        x._source = {
                            id: x.srcId,
                            subject: x._extras.subject,
                            resource_path: x._extras.resource_path,
                        };
                    });
                    const elasticData = [{ list: doubtfeedData.sugg }];
                    let pdfData = await doubtfeedHelper.checkPdfData(previousResources, elasticData);
                    if (pdfData.length > 0) {
                        pdfData = await StudentBl.makePdfData(db, topicDetail, totalItem, locale, pdfData);
                        if (pdfData && Object.keys(pdfData).length != 0) {
                            totalItem++;
                            widget.push(pdfData);
                        }
                    }
                }

                const fsData = await StudentBl.makeFsData(db, topicDetail, previousResources, studentClass, thumbnailCdn, totalItem, locale);
                if (fsData && Object.keys(fsData).length != 0) {
                    totalItem++;
                    widget.push(fsData);
                }
            }

            widget[widget.length - 1].widget_data.is_last = true;

            finalData.heading = heading;
            finalData.carousels = widget;

            finalData.back_press_popup_data = {
                image_url: `${thumbnailCdn}daily_feed_resources/sad-face.webp`,
                description: global.t8[locale].t('Not interested in {{topicName}} ?\nGet a new feed by asking question from the topic you want to study', { topicName }),
                main_cta: doubtfeed(locale).progressButton,
                main_deeplink: 'doubtnutapp://camera',
                secondary_cta: doubtfeed(locale).backpressBottomLine,
            };

            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: finalData,
            };
        } else {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                },
                data: {
                    is_previous: false,
                    heading: '',
                    topics: [
                        {
                            title: doubtfeed(locale).defaultTopicTitle,
                            key: '010',
                            is_selected: true,
                        },
                    ],
                    carousels: [],
                    back_press_popup_data: {
                        image_url: `${thumbnailCdn}daily_feed_resources/sad-face.webp`,
                        description: doubtfeed(locale).noDoubtBackpressHeding,
                        main_cta: doubtfeed(locale).progressButton,
                        main_deeplink: 'doubtnutapp://camera',
                        secondary_cta: doubtfeed(locale).backpressBottomLine,
                    },
                },
            };
        }
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getDoubtFeedProgress(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');

    try {
        const { student_id: studentId, locale } = req.user;
        const { topic_id: topicId } = req.body;

        let obj = {};

        const topicList = await DoubtfeedMysql.getTopicByDate(db.mysql.read, studentId);

        if (topicList.length > 0) {
            const topicDate = Utility.getDateFromMysqlDate(topicList[0].date);
            let currDate = new Date();
            const offset = new Date().getTimezoneOffset();
            if (offset == 0) {
                currDate.setHours(currDate.getHours() + 5);
                currDate.setMinutes(currDate.getMinutes() + 30);
            }
            currDate = Utility.getDateFromMysqlDate(currDate);

            if (topicDate === currDate) {
                obj = await StudentBl.makeTodaysTopWidget(db, config, topicList, studentId, locale, topicId);
            } else {
                obj = {
                    type: 'yesterdays_top',
                    heading_image: `${config.staticCDN}daily_feed_resources/no-daily-feed-heading.webp`,
                    heading_text: doubtfeed(locale).yesterdayGoal.title,
                    description: doubtfeed(locale).yesterdayGoal.subTitle,
                    button_text: doubtfeed(locale).progressButton,
                    button_bg_color: '#ea532c',
                    button_deeplink: 'doubtnutapp://camera',
                    total_tasks: -1,
                    completed_tasks_count: -1,
                };
            }

            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: obj,
            };
        } else if (topicId == '010') {
            obj = {
                type: 'yesterdays_top',
                heading_image: `${config.staticCDN}daily_feed_resources/no-daily-feed-heading.webp`,
                heading_text: doubtfeed(locale).yesterdayGoal.title,
                description: doubtfeed(locale).yesterdayGoal.subTitle,
                button_text: doubtfeed(locale).progressButton,
                button_bg_color: '#ea532c',
                button_deeplink: 'doubtnutapp://camera',
                total_tasks: -1,
                completed_tasks_count: -1,
            };

            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: obj,
            };
        } else {
            responseData = {
                meta: {
                    code: 404,
                    success: false,
                    message: 'FAILED',
                },
                data: {
                    message: 'Type not found',
                },
            };
        }
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'FAILED',
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function submitDoubtCompletion(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');

    const { student_id: studentId, locale } = req.user;
    const { type_id: typeId } = req.body;

    try {
        const promise = [
            AnswerMysql.markAsCompleted(db.mysql.write, typeId),
            AnswerMysql.getTypeDetails(db.mysql.read, typeId),
            StudentContainer.getById(studentId, db),
        ];
        const promiseDetails = await Promise.all(promise);

        const typeDetails = promiseDetails[1];
        const studentDetails = promiseDetails[2];
        let studentName = '';
        if (studentDetails.length > 0) {
            studentName = studentDetails[0].student_fname;
        }
        if (typeDetails.length > 0) {
            const typeMainId = typeDetails[0].topic_reference;
            const allTypes = await AnswerMysql.getAllTypesByDate(db.mysql.read, typeMainId);
            if (allTypes.length > 0) {
                const allCompletedTypes = allTypes.filter((x) => x.is_viewed == 1 || x.id == typeId);
                /* here we are checking for the type_id, bcz after making is_viewed = 1 through db write call, we are fetching that data through db read.
                So for db read and db write sync up latency, we are not getting the immidiate reflected data on read call. */
                const numberOfAllTasks = allTypes.length;
                const numberOfCompletedTasks = allCompletedTypes.length;

                let completedTaskText = doubtfeed(locale).completedTaskButtonText;
                if (numberOfAllTasks == numberOfCompletedTasks) {
                    completedTaskText = doubtfeed(locale).allCompletedTaskButtonText;
                }

                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: {
                        next_pop_up_img_url: `${config.staticCDN}daily_feed_resources/success-task-screen-${numberOfCompletedTasks}.webp`,
                        next_pop_up_heading_text: global.t8[locale].t('Congratulations {{studentName}}!', { studentName }),
                        next_pop_up_sub_heading_text: global.t8[locale].t('you just completed {{numberOfCompletedTasks}} task out of {{numberOfAllTasks}}', { numberOfAllTasks, numberOfCompletedTasks }),
                        next_pop_up_button_text: completedTaskText,
                        is_topic_done: numberOfAllTasks == numberOfCompletedTasks,
                        new_heading: doubtfeed(locale).mainCompletedheading,
                    },
                };
            } else {
                responseData = {
                    meta: {
                        code: 404,
                        success: false,
                        message: 'FAILED',
                    },
                    data: {
                        message: 'Type not found',
                    },
                };
            }
        } else {
            responseData = {
                meta: {
                    code: 404,
                    success: false,
                    message: 'FAILED',
                },
                data: {
                    message: 'Type not found',
                },
            };
        }
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getDoubtFeedStatus(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        const { student_id: studentId } = req.user;

        let is_doubt_feed_available = false;
        const doubtFeedData = await DoubtfeedMysql.getDoubtFeedInfo(db.mysql.read, studentId);
        if (doubtFeedData.length > 0) {
            is_doubt_feed_available = true;
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                is_doubt_feed_available,
            },
        };
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

function filterNoticeBoardData(data, value, field) { // Filter Out Data On Basis Of ccm_id and language.
    let finalData;
    finalData = data.filter((x) => {
        if (x[field] === 'all') {
            return true;
        }
        if (x[field].includes(',')) {
            const arrVal = x[field].split(',');
            let addNotice = false;
            value.forEach((y) => {
                if (arrVal.includes(y.toString())) {
                    addNotice = true;
                    return false;
                }
            });
            if (addNotice) {
                return true;
            }
            // return arrVal.includes(value.toString());
        }
        // return x[field] == value;
        if (field === 'ccm_id') {
            return value.includes(parseInt(x[field]));
        }
        if (field === 'locale') {
            return value.includes(x[field]);
        }
    });
    return finalData;
}

function makeResponseData(noticeList, type, locale) {
    // making responses from data as per type of notice and type of view

    const todaysData = Utility.getTodaysDateString();

    const finalList = [];
    noticeList.forEach((x) => {
        let { name } = x;
        let { cta_text: ctaText } = x;
        const noticeDate = Utility.getDateFromMysqlDate(x.end_date);
        if (locale === 'hi') {
            if (name === 'What’s New') {
                name = noticeBoardContents.name.whatsNew;
            } else if (name === 'Today’s Special') {
                name = noticeBoardContents.name.todays;
            }

            if (ctaText === 'Download Now') {
                ctaText = noticeBoardContents.cta.downloadNow;
            } else if (ctaText === 'View Now') {
                ctaText = noticeBoardContents.cta.viewNow;
            } else if (ctaText === 'Join Now') {
                ctaText = noticeBoardContents.cta.joinNow;
            }
        }
        const obj = {
            type: x.notice_type,
            id: x.id,
            cta_text: ctaText,
            deeplink: x.cta_link,
            is_today: noticeDate === todaysData,
        };
        if (x.notice_type === 'image_title') {
            obj.title = x.heading;
            obj.image_link = x.img_url;

            if (type === 'all') {
                obj.name = name;
                obj.share_text = x.sharing_text;
            }
        } else if (x.notice_type === 'video_thumbnail_title') {
            obj.image_link = x.img_url;
            if (type === 'all') {
                obj.name = name;
                obj.title = x.heading;
                obj.caption = x.caption;
                obj.share_text = x.sharing_text;
            }
        } else if (x.notice_type === 'external_title') {
            obj.title = x.heading;
            obj.subtitle = x.content;
            obj.image_link = x.img_url;
            if (type === 'all') {
                obj.name = name;
                obj.share_text = x.sharing_text;
            }
        }
        finalList.push(obj);
    });
    return finalList;
}

async function getAllNotice(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');

    try {
        const { student_id: studentId, locale, student_class: studentClass } = req.user;
        let flagVariantsArr = [-1];
        let type = 'all';
        if (req.params.type != undefined && req.params.type === 'todays_special') {
            type = req.params.type;
        }
        if (!_.isNull(req.headers.flagr_variation_ids) && !_.isEmpty(req.headers.flagr_variation_ids)) {
            flagVariantsArr = req.headers.flagr_variation_ids.split(',');
            flagVariantsArr.push(-1);
        }
        let { version_code } = req.headers;
        let ccmId = [];
        const registeredDate = new Date(req.user.timestamp);
        const userDays = StudentHelper.getUserDaysOnApp(registeredDate);
        const { todayStartDateTime, todayEndDateTime } = Utility.todayEndAndStarting();

        const promise = [];
        let noticeData = [];
        promise.push(StudentContainer.getStudentCcmIds(db, studentId));
        const promiseResult = await Promise.all(promise);
        const studentMapData = promiseResult[0];
        if (studentMapData.length > 0) {
            ccmId = _.uniq(studentMapData);
        }
        const { campaign = null } = req.user;

        const packageValue = req.headers.package_name ? altAppData.packageMapping[req.headers.package_name] : 'default';
        // const isFreeApp = packageValue === altAppData.freeAppPackageName;

        const cacheKey = md5(JSON.stringify({
            studentClass, locale, ccmId, campaign, packageValue,
        }));
        const data = await studentRedis.getNoticeData(db.redis.write, studentId, cacheKey);
        if (!_.isNull(data) && JSON.parse(data).length !== 0) {
            noticeData = JSON.parse(data);
        } else {
            noticeData = await NoticeMysql.getAllNoticesDetails(db.mysql.read, type, version_code, flagVariantsArr, todayStartDateTime, todayEndDateTime, campaign, packageValue);
            if (noticeData) {
                noticeData = noticeData.filter((x) => x.student_class == 0 || x.student_class == studentClass);
                noticeData = filterNoticeBoardData(noticeData, ccmId, 'ccm_id');
                noticeData = filterNoticeBoardData(noticeData, [locale], 'locale');
                if (noticeData.length > 0) {
                    StudentRedis.setNoticeData(db.redis.write, studentId, cacheKey, noticeData);
                }
            }
        }
        if (!_.isEmpty(noticeData)) {
            noticeData = StudentHelper.getDataBasisOfUserDays(noticeData, userDays);
        }
        let noticeList = [];
        let emptyFlag = 0;
        if (noticeData.length > 0) {
            noticeData = makeResponseData(noticeData, type, locale);
            noticeList = noticeData;
        } else {
            noticeList = [
                {
                    type: 'no_info',
                    name: locale === 'hi' ? noticeBoardContents.name.whatsNew : 'What’s New',
                    title: noticeBoardContents.empty(locale),
                    image_link: '',
                    cta_text: '',
                    share_text: '',
                    deeplink: '',
                },
            ];
            emptyFlag = 1;
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                list: noticeList,
            },
        };

        responseData.data.empty_message = noticeBoardContents.empty(locale);
        if (emptyFlag === 1 && type === 'todays_special') {
            responseData.data.list = [];
        }
    } catch (e) {
        console.log(e);
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function doubtfeedVideoBanner(req, res) {
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');

    try {
        const { student_id: studentId, locale } = req.user;
        const { chapter } = req.body;
        const { version_code: versionCode } = req.headers;
        let bannerData = {
            is_show: false,
        };
        let flag = 0;

        const latestTopicByStudent = await DoubtfeedMysql.getTodaysLatestDoubt(db.mysql.read, studentId);
        if (latestTopicByStudent.length == 1 && latestTopicByStudent[0].topic == chapter) {
            const taskDetails = await DoubtfeedMysql.getLatestTopicTasks(db.mysql.read, latestTopicByStudent[0].id);
            if (taskDetails.length > 0) {
                const completedTaskLength = taskDetails.filter((x) => x.is_viewed).length;
                if (completedTaskLength === 0) {
                    flag = 1;
                }
            } else {
                flag = 1;
            }
        }

        if (flag === 1) {
            bannerData = {
                is_show: true,
                title: global.t8[locale].t('{{random}} students have completed there Daily Goal on {{chapter}}', { random: Math.floor(Math.random() * (15000 - 5000 + 1) + 5000), chapter }),
                subtitle: doubtfeedBanner.subTitle(locale),
                cta_text: doubtfeedBanner.cta_text(locale),
                deeplink: versionCode >= 921 ? 'doubtnutapp://doubt_feed_2' : 'doubtnutapp://doubt_feed',
                topic: chapter,
            };
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: bannerData,
        };
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}
async function getBoardResultTestimonials(req, res) { // basically this generate boards testimonial data for website
    let responseData;
    db = req.app.get('db');
    config = req.app.get('config');
    const mongoClient = db.mongo;

    try {
        const testimonialData = {};
        testimonialData.hashTitle = Data.testimonialData.hashTitle;
        testimonialData.title = Data.testimonialData.title;
        testimonialData.subtitle = Data.testimonialData.subtitle;
        testimonialData.button_text = Data.testimonialData.button_text;

        const jeeToppers = await mongoClient.read.collection('board_testimonials_users').find({ type: '1', is_active: 1 }).sort({ position: 1 }).toArray();
        const boardToppers = await mongoClient.read.collection('board_testimonials_users').find({ type: '2', is_active: 1 }).sort({ position: 1 }).toArray();

        const videoTestimonials = await mongoClient.read.collection('board_testimonials').find({ type: '1', is_active: '1' }).sort({ position: 1 }).toArray();
        const textTestimonials = await mongoClient.read.collection('board_testimonials').find({ type: '2', is_active: '1' }).sort({ position: 1 }).toArray();

        let data = {};
        const jeeToppersArray = [];
        const boardToppersArray = [];
        if (!_.isEmpty(jeeToppers)) {
            _.forEach(jeeToppers, (x) => {
                data = {};
                data.img_url = x.img_url;
                data.marks = x.marks;
                data.name = x.name;
                data.exam = x.exam;
                jeeToppersArray.push(data);
            });
            testimonialData.jeeToppers = jeeToppersArray;
        }

        if (!_.isEmpty(boardToppers)) {
            _.forEach(boardToppers, (x) => {
                data = {};
                data.img_url = x.img_url;
                data.marks = x.marks;
                data.name = x.name;
                data.board = x.board;
                data.class = x.class;
                data.rank = x.rank;
                boardToppersArray.push(data);
            });
            testimonialData.toppers = boardToppersArray;
        }

        testimonialData.banner_data = Data.testimonialData.banner_data;
        testimonialData.testimonials_title = Data.testimonialData.testimonials_title;

        const videoArray = [];
        const textArray = [];
        if (!_.isEmpty(videoTestimonials)) {
            _.forEach(videoTestimonials, (x) => {
                data = {};
                data.thumbnail_url = `${config.staticCDN}q-thumbnail/${x.question_id}.png`;
                data.deeplink = `doubtnutapp://video?qid=${x.question_id}&page=LIBRARY&playlist_id=BOOKS_81`;
                data.name = x.student_name;
                data.board = x.board;
                videoArray.push(data);
            });
            testimonialData.testimonials_video = videoArray;
        }
        if (!_.isEmpty(textTestimonials)) {
            _.forEach(textTestimonials, (x) => {
                data = {};
                data.text_content = x.feedback_text;
                data.name = x.student_name;
                data.board = x.board;
                textArray.push(data);
            });
            testimonialData.testimonials_text = textArray;
        }
        testimonialData.bottom_button = Data.testimonialData.bottom_button;
        responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: testimonialData,
        };
    } catch (e) {
        responseData = {
            meta: {
                code: 403,
                success: false,
            },
            data: {
                message: 'Unexpected Error',
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
}

async function getReferralFaq(req, res) {
    const { locale } = req.user;

    try {
        const widgets = [];
        const { student_id: studentId } = req.user;
        const referralsByUser = await StudentMysql.getStudentsReferredByUser(db.mysql.read, studentId);
        widgets.push(ReferAndEarnHelper.referAndEarnWidget(locale, referralsByUser, 'faq'));
        widgets.push(ReferAndEarnHelper.makeFaqListWidget(locale));

        const branchDeeplink = await ReferAndEarnHelper.generateBranchDeeplinkForReferAndEarn(db, studentId);

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                widgets,
                cta: {
                    title: locale !== 'en' && locale !== 'hi' ? ReferralData.referralWidget.referFriend.title.other : ReferralData.referralWidget.referFriend.title[locale],
                    message_whatsapp: locale !== 'en' && locale !== 'hi' ? ReferralData.referralWidget.referFriend.whatsapp_message.other.concat(`\n${branchDeeplink}`) : ReferralData.referralWidget.referFriend.whatsapp_message[locale].concat(`\n${branchDeeplink}`),
                    image_share: ReferralData.referralWidget.referFriend.whatsapp_share_image,
                },
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        throw new Error(e);
    }
}

async function referAndEarn(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        const { student_id: studentId, locale } = req.user;

        const widgets = [];
        const referralsByUser = await StudentMysql.getStudentsReferredByUser(db.mysql.read, studentId);

        widgets.push(ReferAndEarnHelper.referAndEarnWidget(locale, referralsByUser, ''));
        widgets.push(ReferAndEarnHelper.referAndEarnStepsWidget(locale));
        widgets.push(await ReferAndEarnHelper.referralCodeWidget(db, locale, studentId));

        if (_.isEmpty(referralsByUser)) {
            widgets.push(ReferAndEarnHelper.emptyReferredFriendsWidget(locale));
        } else {
            widgets.push(await ReferAndEarnHelper.referredFriendsListWidget(db, referralsByUser, locale, studentId));
        }

        const branchDeeplink = await ReferAndEarnHelper.generateBranchDeeplinkForReferAndEarn(db, studentId);

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                widgets,
                cta: {
                    title: locale !== 'en' && locale !== 'hi' ? ReferralData.referralWidget.referFriend.title.other : ReferralData.referralWidget.referFriend.title[locale],
                    message_whatsapp: locale !== 'en' && locale !== 'hi' ? ReferralData.referralWidget.referFriend.whatsapp_message.other.concat(`\n${branchDeeplink}`) : ReferralData.referralWidget.referFriend.whatsapp_message[locale].concat(`\n${branchDeeplink}`),
                    image_share: ReferralData.referralWidget.referFriend.whatsapp_share_image,
                },
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        throw new Error(e);
    }
}

async function storingReferrerId(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        const { referrer_id: inviterId } = req.body;
        const { student_id: studentId } = req.user;

        const obj = {
            inviter_id: inviterId,
            invitee_id: studentId,
        };

        let msg = 'Already A Referred User';
        const isAlreadyInvited = await StudentMysql.getReferredUserData(db.mysql.read, studentId);
        if (_.isEmpty(isAlreadyInvited)) {
            StudentMySQL.storingReferrerId(db.mysql.write, obj);
            msg = 'Referral Data Stored Successfully';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                message: msg,
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        throw new Error(e);
    }
}

module.exports = {
    addPublicUserWeb,
    updateGcm,
    addGcm,
    saveEmail,
    getProfile,
    setProfile,
    getAskHistory,
    getStudentOnboarding,
    postStudentOnboarding,
    getOnboardingStatus,
    getLoginTimer,
    getClassLanguage,
    addUserToGupShup,
    liveClassNotification,
    autoPlayData,
    storeOnBoardLanguage,
    storePin,
    getOtpDeliveryDetails,
    storeOtpDeliveryDetails,
    verifySocialOAuth,
    loginWithPin,
    checkSurveyByUser,
    getSurveyDetails,
    storeSurveyFeedback,
    ncertLastWatchedDetails,
    getDoubtFeedDetails,
    getDoubtFeedProgress,
    submitDoubtCompletion,
    getDoubtFeedStatus,
    getAllNotice,
    doubtfeedVideoBanner,
    getBoardResultTestimonials,
    getReferralFaq,
    referAndEarn,
    storingReferrerId,
};
