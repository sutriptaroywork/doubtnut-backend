/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 18:11:23
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-07-13T19:57:15+05:30
*/

require('../../../modules/mongo/comment');
require('../../../modules/mongo/post');

const moment = require('moment');
const _ = require('lodash');
const fs = require('fs');
const mongoose = require('mongoose');
const profanity = require('profanity-hindi');
const Utility = require('../../../modules/utility');
const Student = require('../../../modules/student');
const Language = require('../../../modules/language');
const StudentMySQL = require('../../../modules/mysql/student');
const StudentMongo = require('../../../modules/mongo/student');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const ClassCourseMappingMysql = require('../../../modules/mysql/classCourseMapping');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const Token = require('../../../modules/tokenAuth');
const TokenGenerator = require('../../../modules/token');
const StudentRedis = require('../../../modules/redis/student');
const badWordsData = require('../../helpers/profanity-hindi/data/bad-words');
const { isWordProfane, isImageProfane } = require('../../helpers/profanity');
const kafka = require('../../../config/kafka');
const StudentContainer = require('../../../modules/containers/student');

profanity.addWords(badWordsData.customBadWords);

const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');
const DEFAULT_COUNTRY = 'IN';
let db; let config; let sqs;
// const path = require("path");

// let publicKey = ursa.createPublicKey(fs.readFileSync(path.resolve(__dirname, "../../../encryptKeys/public.pem"),'utf-8'));

// const path = require('path');

// const TokenGenerator = require('token-generator')({
//   salt: 'Its the doubtnut app logging you',
//   timestampMap: 'abcdefghij', // 10 chars array for obfuscation proposes
// });

async function getProfile(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.params;
        const region = req.headers.country || DEFAULT_COUNTRY;
        const student_info = await Student.getStudentWithLocation(student_id, db.mysql.read);
        const xAuthToken = req.headers['x-auth-token'] || req.headers.authorization;
        if (_.isEmpty(student_info[0].student_fname)) {
            student_info[0].name = student_info[0].username;
        } else {
            student_info[0].name = student_info[0].student_fname;

            if (!_.isEmpty(student_info[0].student_lname)) {
                student_info[0].name = `${student_info[0].student_fname} ${student_info[0].student_lname}`;
            }
        }

        const query_options = ["'gender'", "'student_class'"];
        const { version_code } = req.headers;
        const student_board_options = [];
        const student_exam_options = [];
        if (_.isNull(student_info.student_class)) {
            student_info.student_class = 12;
            if (region === 'US') {
                student_info.student_class = 21;
            }
        }

        const promises = [];
        let student_languages;
        const { locale } = req.user;
        promises.push(ClassCourseMapping.allClassCourseByRegion(db.mysql.read, region));
        promises.push(Student.getStudentOptionsByRegion(db.mysql.read, query_options, region));
        promises.push(StudentCourseMapping.getStudentSelectedCourse(student_id, db.mysql.read));
        /* SHould be merged with getStudentWithLocation Call? */
        promises.push(Student.getStudentLocation(student_id, db.mysql.read));
        if (version_code >= 911) {
            promises.push(Language.getList(db.mysql.read));
        }
        const resolvedPromises = await Promise.all(promises);
        const student_options = resolvedPromises[1];
        const student_location = resolvedPromises[3];
        if (version_code >= 911) {
            student_languages = resolvedPromises[4];
        }
        const class_course = resolvedPromises[0];
        const student_selected_courses = resolvedPromises[2];
        const student_selected_exam = [];
        let student_selected_board = -1;

        for (let i = 0; i < student_selected_courses.length; i++) {
            if (student_selected_courses[i].category === 'board' && (student_selected_courses[i].type === 'board' || student_selected_courses[i].type === null)) {
                student_selected_board = student_selected_courses[i].id;
            } else if (student_selected_courses[i].category === 'board' && student_selected_courses[i].type === 'stream') {
                student_selected_board = student_selected_courses[i].parent_ccm_id;
            } else if (student_selected_courses[i].category === 'exam') {
                student_selected_exam.push(student_selected_courses[i].id);
            }
        }

        for (let i = 0; i < class_course.length; i++) {
            const option_list = {};

            option_list.id = class_course[i].id;
            option_list.name = class_course[i].course;
            option_list.alias = class_course[i].course;
            option_list.img_url = class_course[i].img_url;
            option_list.class = class_course[i].class;

            if (class_course[i].category === 'board') {
                option_list.selected = student_selected_board === option_list.id ? 1 : 0;
                student_board_options.push(option_list);
            }

            if (class_course[i].category === 'exam') {
                option_list.selected = student_selected_exam.indexOf(option_list.id) > -1 ? 1 : 0;
                student_exam_options.push(option_list);
            }
        }

        const student_exam_options_norm = _.groupBy(student_exam_options, 'class');
        const student_board_options_norm = _.groupBy(student_board_options, 'class');
        const gender = {};

        const examKeys = Object.keys(student_exam_options_norm);
        examKeys.forEach((x) => {
            let flag = 0;
            student_exam_options_norm[x].forEach((y) => {
                if (y.name === 'OTHER EXAM') {
                    y.name = 'BOARD EXAMS';
                    y.alias = 'BOARD EXAMS';
                    flag = 1;
                }
                if (y.name === 'अन्य परीक्षा') {
                    y.name = 'स्टेट बोर्ड परीक्षा';
                    y.alias = 'स्टेट बोर्ड परीक्षा';
                    flag = 1;
                }
            });
            if (flag === 1) {
                const boardObjectArr = student_exam_options_norm[x].filter((y) => y.name === 'BOARD EXAMS' || y.name === 'स्टेट बोर्ड परीक्षा');
                const allExamListExceptBoard = student_exam_options_norm[x].filter((y) => y.name !== 'BOARD EXAMS' && y.name !== 'स्टेट बोर्ड परीक्षा');
                allExamListExceptBoard.splice(2, 0, boardObjectArr[0]);
                student_exam_options_norm[x] = allExamListExceptBoard;
            }
        });

        const student_class = {};
        const board = {};
        const goal = {};

        // get geo data

        const geo = {};
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
        // language data
        const languages = [];
        if (student_languages) {
            for (let i = 0; i < student_languages.length; i++) {
                const option_values = {};
                option_values.id = student_languages[i].id;
                option_values.code = student_languages[i].code;
                option_values.title = student_languages[i].language_display;
                option_values.is_selected = 0;
                if (locale === student_languages[i].code) {
                    option_values.is_selected = 1;
                }
                languages.push(option_values);
            }
        }
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
        gender.options = [];
        student_class.options = [];
        board.options = [];
        goal.options = [];
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

        if (version_code > 1028) {
            let studentStreamId = 0;
            const streamDetails = student_selected_courses.filter((x) => x.type === 'stream');
            if (streamDetails.length > 0) {
                studentStreamId = streamDetails[0].id;
            }
            const classList = Object.keys(student_board_options_norm);
            /* eslint-disable no-await-in-loop */
            for (let i = 0; i < classList.length; i++) {
                // getting all boards of a perticular class
                if (classList[i] === '11' || classList[i] === '12') {
                    let boardList = student_board_options_norm[classList[i]];

                    // making active board top of the list
                    const activeBoard = boardList.filter((x) => x.selected === 1);
                    const nonActiveBoards = boardList.filter((x) => x.selected === 0);
                    boardList = [...activeBoard, ...nonActiveBoards];

                    // process for adding stream list
                    const boardIds = boardList.map((x) => x.id);
                    const streamList = await ClassCourseMappingMysql.getAllStreamsByIds(db.mysql.read, boardIds);

                    boardList.forEach((x) => {
                        const streamsForBoard = streamList.filter((y) => y.parent_ccm_id == x.id);
                        const streamListForBoard = [];
                        streamsForBoard.forEach((y) => {
                            const obj = {
                                id: y.id,
                                name: y.stream_name,
                                selected: studentStreamId === y.id ? 1 : 0,
                            };
                            streamListForBoard.push(obj);
                        });
                        x.stream_list = streamListForBoard;
                    });
                    student_board_options_norm[classList[i]] = boardList;
                }
            }
        }

        // check if board and goal is eligible for others
        // checkIfCustomEntryInBoard(board,student_info);
        // checkIfCustomEntryInGoal(goal,goalList);

        const finalData = {
            name: student_info[0].name,
            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5359795C-30F7-7F07-8B72-134AF38E02D5.webp',
            gender,
            class: student_class,
            board: { options: student_board_options_norm },
            exam: { options: student_exam_options_norm },
            geo,
            school: student_info[0].school_name,
            coaching,
            date_of_birth:
                student_info[0].dob != null
                    ? moment(student_info[0].dob).format('DD-MM-YYYY')
                    : null,
        };
        if (version_code >= 911) {
            finalData.language = languages;
        }
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

        if ((completeness && exam_c && board_c && student_class <= 12) || (completeness && exam_c && student_class === 14) || (completeness && exam_c && student_class === 13)) {
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

        const region = req.headers.country || DEFAULT_COUNTRY;
        const { student_id: studentId } = req.user;
        const image = req.body.img_url;
        const { version_code: versionCode } = req.headers;

        let language;
        if (versionCode >= 911) {
            language = req.body.language;
        }
        // check if student exists
        if ((await StudentContainer.getById(studentId, db).length) === 0) {
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
                    message: 'failed to update, please try again.',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        if (profanity.isMessageDirty(req.body.name) || await isWordProfane(req.body.name) || req.body.name.match(/[~`!@#$%^&"₹£¢©®×–'*÷€()_={}[\]:;,.<>+/?-]/)) {
            const responseData = {
                meta: {
                    code: 200,
                    success: false,
                    message: 'Please write appropriate name',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        let name = typeof req.body.name === 'undefined' ? null : req.body.name.replace(/\s+/g, ' ').trim().substr(0, 50);

        name = name.split(' ');

        const studentFirstName = name[0];
        let studentLastName;
        // student_fname = name[0];

        if (name.length >= 2) {
            studentLastName = name[1];
        } else {
            studentLastName = '';
        }
        const { gender, exam } = req.body;

        const studentClass = typeof req.body.class === 'undefined' ? null : req.body.class;
        let { board } = req.body;
        const { stream } = req.body;
        const ccmArr = [];
        let streamExist = false;
        let userDetails = [];
        let userStream = [];

        if (versionCode > 1028 && typeof stream === 'number' && stream !== 0) {
            ccmArr.push(stream);
            board = stream;
        } else if (parseInt(req.body.class) === 11 || parseInt(req.body.class) === 12) {
            userDetails = await StudentCourseMapping.getCcmIdWithCourseFromStudentId(db.mysql.read, studentId);
            if (userDetails && userDetails.length > 0) {
                userStream = userDetails.filter((x) => x.type === 'stream');
                if (userStream && userStream.length > 0) {
                    streamExist = true;
                }
            }
        }

        // updating ccm ids in student hash
        if (typeof exam !== 'undefined' && !_.isEmpty(exam) && exam.length > 0) {
            ccmArr.push(...exam);
        }
        if (typeof board === 'number') {
            if (streamExist) {
                const streamName = userStream[0].stream_name;
                if (streamName !== 'Science') {
                    const currentStreamDetails = await ClassCourseMappingMysql.getCourseDetailsByParentCcmStream(db.mysql.read, board, streamName);
                    if (currentStreamDetails && currentStreamDetails.length > 0) {
                        board = currentStreamDetails[0].id;
                    }
                }
            }
            ccmArr.push(board);
        }
        if (ccmArr.length !== 0) {
            StudentRedis.setStudentCcmIds(db.redis.write, studentId, ccmArr);
        } else {
            StudentRedis.delStudentCcmIds(db.redis.write, studentId, ccmArr);
        }
        StudentRedis.delStudentCcmIdsWithType(db.redis.write, studentId);

        // method
        if (req.user.student_class !== studentClass) {
            // SQS for class change
            const queueUrl = config.class_change_sqs;
            const messageData = {
                type: 'new_student_class',
                student_class: studentClass,
                student_id: req.user.student_id,
            };
            StudentMongo.insertIntoClassChangeHistory(req.user.student_id, studentClass, db.mongo.write, 'profile');
            // Utility.sendMessageFIFO(sqs, queueUrl, messageData);
            // console.log(await kafka.publish(kafka.topics.dialerDbLeadUpdate, 1, messageData));
            kafka.publish(kafka.topics.dialerDbLeadUpdate, 1, messageData);

            await Utility.removeAllDataFromStudentCourseMapping(
                db.mysql.write,
                studentId,
            );
            StudentRedis.delStudentCcmIds(db.redis.write, studentId);
            StudentRedis.delStudentCcmIdsWithType(db.redis.write, studentId);

            // await Utility.removeAllDataWithoutStreamFromStudentCourseMapping(
            //     db,
            //     studentId,
            //     studentClass,
            // );
            // await Utility.setNewBoardExamAndDeleteOld(db, studentId, studentClass);
        }
        /*  Does the concept of Boards Exist here */
        if (typeof board === 'number') {
            const boardArray = [];
            boardArray.push(board);

            // storing board change data in mongo
            const boardFromCcmId = await ClassCourseMapping.getBoardFromCcmId(db.mysql.read, board);
            if (!_.isEmpty(boardFromCcmId)) {
                await StudentMongo.insertIntoBoardChangeHistory(req.user.student_id, boardFromCcmId[0].course, db.mongo.write, 'profile');
            }
            const filteredBoardArr = await Utility.getCcmIdArrFilteredByClass(db.mysql.read, boardArray, 'board', studentClass);

            let ccmCategory = 'board';
            if (streamExist || (versionCode > 1028 && typeof stream === 'number')) {
                ccmCategory = 'stream';
            }
            await Utility.insertExamAndBoardSelections(
                db,
                filteredBoardArr,
                ccmCategory,
                studentId,
            );
            StudentRedis.delStudentCcmIds(db.redis.write, studentId);
            StudentRedis.delStudentCcmIdsWithType(db.redis.write, studentId);
        }

        if (typeof exam !== 'undefined' && !_.isEmpty(exam) && exam.length > 0) {
            await Utility.removeDataForIndividualWidget(db.mysql.write, studentId, 'exam');
            const filteredExamArr = await Utility.getCcmIdArrFilteredByClass(db.mysql.read, exam, 'exam', studentClass);
            await Utility.insertExamAndBoardSelections(
                db,
                filteredExamArr,
                'exam',
                studentId,
            );
            StudentRedis.delStudentCcmIds(db.redis.write, studentId);
            StudentRedis.delStudentCcmIdsWithType(db.redis.write, studentId);
        } else {
            await Utility.removeDataForIndividualWidget(db.mysql.write, studentId, 'exam');
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

            const result = await db.mysql.read.query(sql, [studentId]);

            const parameters = [];
            if (result.length > 0) {
                parameters.push(params, studentId);
                sql = 'update student_location set ? where student_id = ?';
            } else {
                params.student_id = studentId;
                parameters.push(params);
                sql = 'insert into student_location set ?';
            }

            await db.mysql.write.query(sql, parameters);
        }

        const school = req.body.school != null ? req.body.school.trim() : null;
        // eslint-disable-next-line no-nested-ternary
        const coaching = req.body.coaching != null
            ? req.body.coaching.trim().length > 0
                ? req.body.coaching.trim()
                : 'No'
            : null;
        const dob = req.body.date_of_birth;

        const sql = 'update students SET ? where student_id = ?';
        const params = {};

        params.student_fname = studentFirstName;
        params.student_lname = studentLastName;
        params.gender = gender;
        params.student_class = studentClass;
        params.school_name = school;
        params.coaching = coaching;
        params.ex_board = !!board;
        params.dob = moment(dob, 'DD-MM-YYYY').format('YYYY-MM-DD');
        if (language) {
            params.locale = language;
        }
        if (image !== undefined && image != null) {
            // temporarily disabled image profane check
            // if (await isImageProfane(image)) {
            //     const responseData = {
            //         meta: {
            //             code: 200,
            //             success: false,
            //             message: 'Please upload appropriate image',
            //         },
            //     };
            //     return res.status(responseData.meta.code).json(responseData);
            // }
            params.img_url = await Utility.uploadImageToS3(
                image,
                studentId,
                config.cdn_url,
                publicPath,
                fs,
                s3,
                config.aws_bucket,
            );
        }

        const status = await db.mysql.write.query(sql, [params, studentId]);
        Student.deleteUserInRedis(studentId, db.redis.write)
            .then(() => {
                // console.log(re);
            })
            .catch((e) => {
                console.log(e);
            });

        const studentList = [1081201, 1522478, 1527637, 420334, 1378353, 705281, 1378353, 1613968, 1506294, 1656502, 1682680, 1732720];
        const updateQuery = {};
        let updatedUsername = '';
        console.log('updated username');
        console.log('username');

        if (image !== undefined) {
            updateQuery.student_avatar = params.img_url;
        }
        if (typeof studentFirstName.student_fname !== 'undefined' || !_.isEmpty(params.student_fname)) {
            updatedUsername += params.student_fname;
        }
        if (typeof studentLastName.student_lname !== 'undefined' && !_.isEmpty(params.student_lname)) {
            updatedUsername += params.student_lname;
        }
        if (!_.isEmpty(updatedUsername)) {
            updateQuery.student_username = updatedUsername;
        }

        // console.log(updatedUsername);
        // console.log(typeof updatedUsername);

        // console.log("student id")
        // console.log(student_id)
        if ((!_.includes(studentList, studentId)) && (region === 'IN')) {
            const bulk = Comment.collection.initializeOrderedBulkOp();
            const bulk2 = Post.collection.initializeOrderedBulkOp();
            bulk.find({ student_id: studentId.toString() }).update({ $set: updateQuery });
            bulk2.find({ student_id: studentId.toString() }).update({ $set: updateQuery });
            bulk.execute();
            bulk2.execute();
        }
        console.log(status);

        // change this to when profile is complete
        if (region === 'IN') {
            // Dont need gamification trigger for US
            checkAndTriggerProfileComplete(studentId, studentClass);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: '',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

function tokenRecreate(req, res, next) {
    const token = req.headers['x-auth-token'] || (req.headers.authorization ? req.headers.authorization.split(' ')[1] : null);
    if (!token) {
        next({ err: new Error('No Token') });
    }
    try {
        const expiredTokenPayload = Token.verify(req.app.get('config'), token, true);
        const data = Token.create(expiredTokenPayload.id, config);
        res.set('dn-x-auth-token', TokenGenerator.sign({ id: expiredTokenPayload.id }, config.jwt_secret_new));
        res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: expiredTokenPayload.id }, config.jwt_secret_refresh, true));
        next({ data });
    } catch (err) {
        next({ err });
    }
}

module.exports = {
    getProfile,
    setProfile,
    tokenRecreate,
};
