/* eslint-disable eqeqeq */
/* eslint-disable guard-for-in */
/* eslint-disable no-await-in-loop */
/* eslint-disable default-case */
/* eslint-disable prefer-const */
const _ = require('lodash');
const url = require('url');
const moment = require('moment');
// const StudyGroupHelper = require('../../helpers/studyGroup.helper');
const uuidv4 = require('uuid/v4');
const TeacherMysql = require('../../../modules/mysql/teacher');
const TeacherRedis = require('../../../modules/redis/teacher');
const LanguageContainer = require('../../../modules/containers/language');
const ClassContainer = require('../../../modules/containers/class');
const CourseMysql = require('../../../modules/mysql/coursev2');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const Token = require('../../../modules/token');
const staticData = require('../../../data/data');
const teachertData = require('../../../data/teacher.data');
const OtpFactory = require('../../helpers/otpfactory/otpfactoryservices.helper');
const questionsHelper = require('../../helpers/question.helper');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const AnswerMysql = require('../../../modules/mysql/answer');
const IPUtility = require('../../../modules/Utility.IP');
const StudentRedis = require('../../../modules/redis/student');
const Constants = require('../../../modules/constants');
const Kafka = require('../../../config/kafka');
const TeacherContainer = require('../../../modules/containers/teacher');
const AnswerContainer = require('../../v13/answer/answer.container');
const { generateDeeplinkFromAppDeeplink } = require('../../../modules/utility');
const FeedBackMySql = require('../../../modules/feedback');
const StudentContainer = require('../../../modules/containers/student');
const Utility = require('../../../modules/utility');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const CourseHelper = require('../../helpers/course');

async function onboardData(req, res, next) {
    try {
        // const db = req.app.get('db');
        const config = req.app.get('config');
        const db = req.app.get('db');
        let { locale: teacherLocale = 'en' } = req.query;
        if (teacherLocale === 'english') {
            teacherLocale = 'en';
        }
        const data = teachertData.onboarding(config.cdn_url)[teacherLocale];
        const teacherLoginImage = await AppConfigurationContainer.getConfigByKey(db, 'teacher_login_image');
        if (!_.isEmpty(teacherLoginImage)) {
            data.image_url = teacherLoginImage[0].key_value;
        }
        data.locale_list = [{
            key: 'en',
            value: 'English',
            is_active: 1,
        },
        {
            key: 'hi',
            value: 'Hindi',
            is_active: 0,
        }];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function login(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { teacher_locale: teacherLocale = 'en', mobile } = req.body;
        // const { student_id: studentId } = req.user;
        const sendFrom = 'service';
        const loginMethod = 'mobile';

        const loginParams = {
            phone: mobile,
            sendFrom,
            retryDelay: 15,
            region: 'IN',
        };
        // check if IP has hit rate limit
        if (await IPUtility.hasReachedLimit(db.redis, config.OTPLimitPerDay, req.headers['True-Client-IP'] || req.headers['x-forwarded-for'])) {
            const response = IPUtility.maxLimitReached();
            return res.status(response.meta.code).json(response);
        }

        if (await IPUtility.hasReachedLimit(db.redis, config.OTPLimitMobileNo, mobile)) {
            const response = IPUtility.maxLimitReached();
            return res.status(response.meta.code).json(response);
        }
        const response = await OtpFactory.otpServices(loginParams);
        console.log(response);
        const loginDetails = await TeacherMysql.create(db.mysql.write, { mobile, locale: teacherLocale });
        let newUser = false;
        if (loginDetails.affectedRows == 1) {
            newUser = true;
        }
        await TeacherRedis.setNewUser(db.redis.write, mobile, newUser);
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Otp is sent, Please verify',
            },
            data: {
                status: 'Success',
                session_id: response.sessionId,
                expires_in: config.OTPRetryDelay[loginMethod],
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}
async function increaseWrongOTPCount(database, sessionId) {
    await StudentRedis.updateWrongOTPCount(database.redis.write, 60 * 5, sessionId); // 5 minutes
    return true;
}
async function verify(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { session_id: sessionId, otp } = req.body;
        // const { student_id: studentId } = req.user;
        // const sendFrom = 'service';
        // const login_method = 'mobile';
        if (sessionId.includes(':')) {
            const contact = sessionId.split(':')[0];

            const userDetails = await TeacherMysql.getByMobile(db.mysql.read, contact);
            // get details by contact
            const user = userDetails[0];
            const params = {
                sessionId,
                otp_entered_by_user: parseInt(otp),
                sentFrom: 'service',
                region: 'IN',
            };
            let rpResp = {};

            try {
                const wrongOTPCount = await StudentRedis.getWrongOTPCount(db.redis.read, sessionId);
                if (wrongOTPCount >= Constants.getWrongOTPMaxLimitForTeacher()) {
                    const response = {
                        meta: {
                            code: 401,
                            success: false,
                            message: `You have entered Wrong OTP more than ${Constants.getWrongOTPMaxLimitForTeacher()} times. User Blocked.`,
                        },
                        data: {
                            status: 'FAILURE',
                            session_id: false,
                        },
                    };
                    return res.status(response.meta.code).json(response);
                }
                rpResp = await OtpFactory.verifyOtpResponse(params);
            } catch (e) {
                if (e.error.message === 'Wrong OTP') {
                    increaseWrongOTPCount(db, sessionId);
                }
                const response = {
                    meta: {
                        code: 401,
                        success: false,
                        message: e.error.message || 'EXPIRED',
                    },
                    data: {
                        status: 'FAILURE',
                        session_id: false,
                    },
                };
                return res.status(response.meta.code).json(response);
            }
            if (rpResp.Status && rpResp.Details && rpResp.Status === 'Failed' && rpResp.Details === 'OTP Not Matched') {
                increaseWrongOTPCount(db, sessionId);

                const response = {
                    meta: {
                        code: 401,
                        success: false,
                        message: 'Wrong OTP. Please provide Correct OTP',
                    },
                    data: {
                        status: 'FAILURE',
                        session_id: false,
                    },
                };
                return res.status(response.meta.code).json(response);
            }
            if (!rpResp || rpResp.code === 500) {
                if (params.sentFrom === 'backend') {
                    // status = 'INVALID';
                }
                return next({ message: 'Unable to verify OTP', status: 403, isPublic: true });
            }

            if (params.sentFrom === 'service') {
                StudentRedis.delWrongOTPCount(db.redis.write, sessionId);
                const teacherDetails = await TeacherMysql.getByMobile(db.mysql.read, contact);
                const teacherId = teacherDetails[0].teacher_id;
                const [metaDetails, localeDetails, classDetails, subjectDetails, paymentDetails] = await Promise.all([TeacherMysql.getMeta(db.mysql.read, teacherId), TeacherMysql.getActiveLocale(db.mysql.read, teacherId), TeacherMysql.getActiveClass(db.mysql.read, teacherId), TeacherMysql.getActiveSubject(db.mysql.read, teacherId), TeacherMysql.getPaymentDetails(db.mysql.read, teacherId)]);
                let profileComplete = true;
                if (_.isEmpty(metaDetails[0].fname) || _.isEmpty(metaDetails[0].lname) || _.isEmpty(metaDetails[0].email) || _.isEmpty(metaDetails[0].img_url) || _.isEmpty(metaDetails[0].college) || _.isEmpty(metaDetails[0].location) || localeDetails.length === 0 || classDetails.length === 0 || subjectDetails.length === 0 || paymentDetails.length === 0) { profileComplete = false; }
                const responseData1 = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User registered',
                    },
                    data: {
                        teacher_id: user.teacher_id,
                        token: Token.sign({ id: user.teacher_id }, config.jwt_secret_teacher),
                        student_username: 'test',
                        new_user: !profileComplete,
                        is_verified: metaDetails[0].is_verified,
                    },
                };
                res.set('dn-x-auth-token', Token.sign({ id: user.teacher_id }, config.jwt_secret_teacher));
                res.set('dn-x-auth-refresh-token', Token.sign({ id: user.teacher_id }, config.jwt_secret_teacher_refresh, true));
                return res.status(responseData1.meta.code).json(responseData1);
            }
        }
        // const responseData1 = {
        //     meta: {
        //         code: 200,
        //         success: true,
        //         message: 'Otp is sent, Please verify',
        //     },
        //     data: {
        //         status: 'Success',
        //         session_id: response.sessionId,
        //         expires_in: config.OTPRetryDelay[login_method],
        //     },
        // };
        // return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}
async function update(req, res, next) {
    try {
        const db = req.app.get('db');
        const { teacher_id: teacherId } = req.user;
        const {
            fname, lname, gender, email, college, degree, location, about_me: aboutMe, year_of_exp: yof, locale, class: classMeta, board, exam, subject, payment_details: paymentDetails,
        } = req.body;
        if (/\d/.test(subject)) {
            return next({
                message: 'Invalid subject',
                status: 400,
                isPublic: true,
            });
        }
        await TeacherRedis.delById(db.redis.write, teacherId);
        const params = {};
        let page = 1;
        if (!_.isEmpty(fname)) {
            params.fname = fname;
        }
        if (!_.isEmpty(lname)) {
            params.lname = lname;
        }
        if (!_.isEmpty(gender)) {
            params.gender = gender;
        }
        if (!_.isEmpty(email)) {
            params.email = email;
        }
        if (!_.isEmpty(college)) {
            params.college = college;
        }
        if (!_.isEmpty(degree)) {
            params.degree = degree;
        }
        if (!_.isEmpty(location)) {
            params.location = location;
        }
        if (!_.isEmpty(aboutMe)) {
            params.about_me = aboutMe;
        }
        if (!_.isEmpty(yof)) {
            params.year_of_exp = yof;
        }
        if (!_.isEmpty(subject)) {
            // save locale
            //  deactive all first
            page = 2;
            await TeacherMysql.deactiveSubject(db.mysql.write, teacherId);
            const subjectData = subject.split(',').map((value) => [teacherId, value, 1]);
            await TeacherMysql.upsertSubject(db.mysql.write, subjectData);
        }
        if (!_.isEmpty(locale)) {
            // save locale
            //  deactive all first
            page = 2;
            await TeacherMysql.deactiveLocale(db.mysql.write, teacherId);
            const localeData = locale.split(',').map((value) => [teacherId, value, 1]);
            await TeacherMysql.upsertLocale(db.mysql.write, localeData);
        }
        if (!_.isEmpty(classMeta)) {
            // save locale
            //  deactive all first
            page = 2;
            await TeacherMysql.deactiveClass(db.mysql.write, teacherId);
            const classData = classMeta.split(',').map((value) => [teacherId, value, 1]);
            await TeacherMysql.upsertClass(db.mysql.write, classData);
        }

        if (!_.isEmpty(board)) {
            // save locale
            //  deactive all first
            page = 2;
            await TeacherMysql.deactiveBoard(db.mysql.write, teacherId);
            const boardsData = board.split(',').map((value) => [teacherId, value, 1]);
            await TeacherMysql.upsertBoard(db.mysql.write, boardsData);
        }
        if (!_.isEmpty(exam)) {
            // save locale
            //  deactive all first
            page = 2;
            await TeacherMysql.deactiveExam(db.mysql.write, teacherId);
            const examsData = exam.split(',').map((value) => [teacherId, value, 1]);
            await TeacherMysql.upsertExam(db.mysql.write, examsData);
        }
        if (!_.isEmpty(paymentDetails)) {
            page = 3;
            if (!_.isEmpty(paymentDetails.account_number) && paymentDetails.account_number.length > 8) {
                let isnum = /^\d+$/.test(paymentDetails.account_number);
                if (isnum) {
                    const paymentParams = {
                        bank_name: paymentDetails.bank_name,
                        bank_code: paymentDetails.bank_code,
                        account_number: paymentDetails.account_number,
                        ifsc_code: paymentDetails.ifsc_code,
                        teacher_id: teacherId,
                        is_active: 1,
                    };
                    await TeacherMysql.addPayment(db.mysql.write, paymentParams);
                } else {
                    return next({
                        message: 'Invalid account number',
                        status: 400,
                        isPublic: true,
                    });
                }
            } else {
                return next({
                    message: 'Account number should be minimum 9',
                    status: 400,
                    isPublic: true,
                });
            }
        }
        let message = '';
        if (page === 1) {
            // check if any of the field is empty
            if (_.isEmpty(params.fname) || _.isEmpty(params.lname) || _.isEmpty(params.email) || _.isEmpty(params.college) || _.isEmpty(params.location)) {
                let namdatortyFileds = [];
                if (_.isEmpty(params.fname)) {
                    namdatortyFileds.push('First Name');
                }
                if (_.isEmpty(params.lname)) {
                    namdatortyFileds.push('Last Name');
                }
                if (_.isEmpty(params.email)) {
                    namdatortyFileds.push('Email');
                }
                if (_.isEmpty(params.college)) {
                    namdatortyFileds.push('College');
                }
                if (_.isEmpty(params.location)) {
                    namdatortyFileds.push('Location');
                }
                message = `${namdatortyFileds.join(', ')} is required`;
            } else {
                await TeacherMysql.update(db.mysql.write, teacherId, params);
            }
        }
        if (page === 2) {
            if (_.isEmpty(subject) || _.isEmpty(locale) || _.isEmpty(classMeta)) {
                let namdatortyFileds = [];
                if (_.isEmpty(subject)) {
                    namdatortyFileds.push('Subject');
                }
                if (_.isEmpty(locale)) {
                    namdatortyFileds.push('Language');
                }
                if (_.isEmpty(classMeta)) {
                    namdatortyFileds.push('Class');
                }
                message = `${namdatortyFileds.join(', ')} is required`;
            }
        }
        if (page === 3) {
            if (_.isEmpty(paymentDetails.account_number) || paymentDetails.account_number.length <= 8) {
                message = 'Bank Account Details not Filled Correctly';
            }
        }
        if (!_.isEmpty(message)) {
            return next({
                message,
                status: 400,
                isPublic: true,
            });
        }
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}
async function getMeta(req, res, next) {
    try {
        const db = req.app.get('db');
        // const config = req.app.get('config');
        const {
            locale = 'ENGLISH', class: classMeta, payment_meta: paymentMeta, subject, type = 'onboarding', category,
        } = req.query;
        const language = _.isEmpty(staticData.breadcrumbs_web.languageMapping[locale]) ? 'ENGLISH' : staticData.breadcrumbs_web.languageMapping[locale];

        const { teacher_id: teacherId } = req.user;
        // locale, class, board, exam, subject
        // get locale list
        const data = {};
        if (_.isEmpty(classMeta)) {
            data.locale = {};
            const [localeData, activeLocale] = await Promise.all([LanguageContainer.getList(db), TeacherMysql.getActiveLocale(db.mysql.read, teacherId)]);
            const groupedLocale = _.groupBy(activeLocale, 'locale');
            data.locale.list = localeData.map((value) => {
                let isActive = 0;
                if (!_.isEmpty(groupedLocale[value.code])) {
                    isActive = 1;
                }
                return {
                    key: value.code,
                    image_url: '',
                    value: value.language_display,
                    is_active: isActive,
                };
            });
            // get class list
            data.class = {};
            const [classData, activeClass] = await Promise.all([ClassContainer.getClassListNewOnBoardingForHome(db, 'english', 'IN'), TeacherMysql.getActiveClass(db.mysql.read, teacherId)]);
            const groupedClass = _.groupBy(activeClass, 'class');
            data.class.list = classData.map((value) => {
                let isActive = 0;
                if (!_.isEmpty(groupedClass[value.class])) {
                    isActive = 1;
                }
                return {
                    key: value.class,
                    value: value.class_display,
                    is_active: isActive,
                };
            });
        } else if (_.isEmpty(subject)) {
            if (type === 'onboarding') {
            // eslint-disable-next-line prefer-const
                let [boardExamData, activeBoard, activeExam] = await Promise.all([ClassCourseMapping.getBoardExamByClass(db.mysql.read, classMeta), TeacherMysql.getActiveBoard(db.mysql.read, teacherId), TeacherMysql.getActiveExam(db.mysql.read, teacherId)]);
                boardExamData = _.groupBy(boardExamData, 'category');
                const groupedBoard = _.groupBy(activeBoard, 'board');
                const groupedExam = _.groupBy(activeExam, 'exam');
                data.boards = {};
                data.exams = {};
                // const boardList = [];
                // const examList = [];
                // grouped for common naming
                // const groupedCourseByBoard = _.groupBy(boardExamData.board, 'course');
                // const groupedCourseByExam = _.groupBy(boardExamData.exam, 'course');
                // eslint-disable-next-line guard-for-in
                // for (const i in groupedCourseByBoard) {
                //     const obj = {};
                //     if (groupedCourseByBoard[i].length > 1) {
                //         let classKey = '';
                //         let idKey = '';
                //         for (let k = 0; k < groupedCourseByBoard[i].length; k++) {
                //             if (classKey.length === 0) {
                //                 classKey = groupedCourseByBoard[i][k].class;
                //             } else {
                //                 classKey = `${classKey}:${groupedCourseByBoard[i][k].class}`;
                //             }
                //             if (idKey.length === 0) {
                //                 idKey = groupedCourseByBoard[i][k].id;
                //             } else {
                //                 idKey = `${idKey}:${groupedCourseByBoard[i][k].id}`;
                //             }
                //         }
                //         obj.key = `${classKey}_${idKey}`;
                //     } else {
                //         obj.key = `${groupedCourseByBoard[i][0].class}_${groupedCourseByBoard[i][0].id}`;
                //     }
                //     // obj.key = `${obj.key}_${groupedCourseByBoard[i][0].course}`;
                //     obj.value = `${groupedCourseByBoard[i][0].course}`;
                //     obj.image_url = `${groupedCourseByBoard[i][0].img_url}`;
                //     obj.is_active = 0;
                //     boardList.push(obj);
                // }
                // eslint-disable-next-line guard-for-in
                // for (const i in groupedCourseByExam) {
                //     const obj = {};
                //     // console.log(ggg[i]);
                //     // console.log(ggg[i]);
                //     if (groupedCourseByExam[i].length > 1) {
                //         let classKey = '';
                //         let idKey = '';
                //         for (let k = 0; k < groupedCourseByExam[i].length; k++) {
                //             if (classKey.length === 0) {
                //                 classKey = groupedCourseByExam[i][k].class;
                //             } else {
                //                 classKey = `${classKey}:${groupedCourseByExam[i][k].class}`;
                //             }
                //             if (idKey.length === 0) {
                //                 idKey = groupedCourseByExam[i][k].id;
                //             } else {
                //                 idKey = `${idKey}:${groupedCourseByExam[i][k].id}`;
                //             }
                //         }
                //         obj.key = `${classKey}_${idKey}`;
                //     } else {
                //         obj.key = `${groupedCourseByExam[i][0].class}_${groupedCourseByExam[i][0].id}`;
                //     }
                //     // obj.key = `${obj.key}_${groupedCourseByExam[i][0].course}`;
                //     obj.value = `${groupedCourseByExam[i][0].course}`;
                //     obj.image_url = `${groupedCourseByExam[i][0].img_url}`;
                //     obj.is_active = 0;
                //     examList.push(obj);
                // }
                // data.boards.list = boardList;
                // data.exams.list = examList;
                // eslint-disable-next-line guard-for-in
                for (const k in boardExamData) {
                    if (k === 'board') {
                        data.boards.list = boardExamData[k].map((value) => {
                            let isActive = 0;
                            if (!_.isEmpty(groupedBoard[value.id])) {
                                isActive = 1;
                            }
                            return {
                                key: value.id,
                                value: `${value.course} - Class ${value.class}`,
                                image_url: value.img_url,
                                is_active: isActive,
                            };
                        });
                    }
                    if (k === 'exam') {
                        data.exams.list = boardExamData[k].map((value) => {
                            let isActive = 0;
                            if (!_.isEmpty(groupedExam[value.id])) {
                                isActive = 1;
                            }
                            return {
                                key: value.id,
                                value: `${value.course} - Class ${value.class}`,
                                image_url: value.img_url,
                                is_active: isActive,
                            };
                        });
                    }
                }
                let classTemp = classMeta;
                if (classMeta == 13) {
                    classTemp = '12';
                }
                const [subjectDetails, activeSubject] = await Promise.all([TeacherMysql.getSubjectByClass(db.mysql.read, classTemp), TeacherMysql.getActiveSubject(db.mysql.read, teacherId)]);
                data.subjects = {};
                const groupedSubject = _.groupBy(activeSubject, 'subject');
                data.subjects.list = subjectDetails.map((value) => {
                    let isActive = 0;
                    if (!_.isEmpty(groupedSubject[value.subject])) {
                        isActive = 1;
                    }
                    return {
                        key: value.subject,
                        value: value.subject,
                        is_active: isActive,
                    };
                });
            } if (!_.isEmpty(locale) && !_.isEmpty(classMeta) && _.isEmpty(category)) {
                // get category from locale, class
                const categoryDetails = await TeacherMysql.getCategory(db.mysql.read, classMeta, language);
                data.category = {};
                data.category.list = categoryDetails.map((value) => ({
                    key: value.category,
                    value: value.category,
                }));
            } else if (!_.isEmpty(locale) && !_.isEmpty(classMeta) && !_.isEmpty(category)) {
                // get subjects
                const subjectDetails = await TeacherMysql.getSubjects(db.mysql.read, classMeta, language, category);
                data.subjects = {};
                data.subjects.list = subjectDetails.map((value) => ({
                    key: value.subject,
                    value: value.subject,
                }));
            }
        }
        if (!_.isEmpty(locale) && !_.isEmpty(classMeta) && !_.isEmpty(category) && !_.isEmpty(subject)) {
            data.chapters = {};
            // get chapters
            const chapterDetails = await TeacherMysql.getChapters(db.mysql.read, language, classMeta, subject);
            data.chapters.list = chapterDetails.map((value) => ({
                key: value.chapter,
                value: value.chapter,
            }));
        }
        if (!_.isEmpty(paymentMeta) && paymentMeta == 1) {
            data.payment_meta_details = teachertData.checkout_en.payment_info[0];
        }
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function getPaymentDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        // const config = req.app.get('config');
        const { teacher_id: teacherId } = req.user;

        // locale, class, board, exam, subject
        // get locale list
        const paymentDetails = await TeacherMysql.getPaymentDetails(db.mysql.read, teacherId);
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: paymentDetails,
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}
async function setDefaultPayment(req, res, next) {
    try {
        const db = req.app.get('db');
        // const config = req.app.get('config');
        const { teacher_id: teacherId } = req.user;
        const { bank_code: bankCode } = req.body;
        await TeacherMysql.removePreviousDefault(db.mysql.read, teacherId);
        await TeacherMysql.setDefaultPayment(db.mysql.read, teacherId, bankCode);
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function videoResource(db, config, questionId) {
    const answerData = await CourseMysql.getAnswerIdbyQuestionId(db.mysql.read, questionId);
    let videoResources;
    if (answerData.length) {
        videoResources = await AnswerContainer.getAnswerVideoResource(db, config, answerData[0].answer_id, questionId, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
    }
    return videoResources;
}

async function getProfile(req, res, next) {
    /**
    Functionality - Panel data for teacher profile of external teachers
    Additional functionality - Profile info for app for both internal and external teachers
    param1 (teacher_id) - Id of teacher
    returns - profile data, teaching data, payment data
    author - Saurabh Raj
    */
    try {
        const db = req.app.get('db');
        let { teacher_id: teacherId } = req.user;
        let isApp = false;
        if (!teacherId) {
            isApp = true;
            teacherId = req.query.teacher_id;
        }
        const checkTeacherIsInternal = await TeacherContainer.checkTeacherIsInternal(db, teacherId);
        let data = {};
        // profile details for internal teachers, note :- censor the mobile number and email
        if (!_.isEmpty(checkTeacherIsInternal)) {
            const subscriber = await TeacherContainer.getSubsTotalInternal(db, teacherId);
            const getallDetails = await TeacherContainer.getDistinctTeachingDetails(db, teacherId);
            const exams = [];
            const boards = [];
            const classFinal = [];
            if (!_.isEmpty(getallDetails)) {
                const infoarray = getallDetails[0].category.split(',');
                for (let i = 0; i < infoarray.length; i++) {
                    if (infoarray[i].toLowerCase().includes('board')) {
                        boards.push(infoarray[i]);
                    } else {
                        exams.push(infoarray[i]);
                    }
                }
                const classMeta = getallDetails[0].class_taught.split(',');
                for (let i = 0; i < classMeta.length; i++) {
                    if (classMeta[i] == 14) {
                        classFinal.push('Government Exams (SSC, Railways, State Police, Defence, Teaching, Civil Services, IT)');
                    } else if (classMeta[i] == 13) {
                        classFinal.push('Dropper/ Repeat Year');
                    } else {
                        classFinal.push(`Class ${classMeta[i]}`);
                    }
                }
            }
            data = {
                teacher_meta: {
                    fname: checkTeacherIsInternal[0].name,
                    lname: '',
                    gender: checkTeacherIsInternal[0].gender,
                    email: '',
                    img_url: checkTeacherIsInternal[0].image_url,
                    college: checkTeacherIsInternal[0].college,
                    degree: checkTeacherIsInternal[0].degree,
                    mobile: '',
                    country_code: '+91',
                    pincode: null,
                    location: '',
                    about_me: '',
                    year_of_experience: checkTeacherIsInternal[0].experience,
                    username: null,
                    dob: null,
                    is_verified: 1,
                    subscribers: `${subscriber} subscriber`,
                },
                subscriber: `${subscriber} subscriber`,
                is_profile_completed: true,
                teaching_details: {
                    locale: !_.isEmpty(getallDetails) ? getallDetails[0].locale : 'ENGLISH',
                    class: !_.isEmpty(classFinal) ? classFinal.join(', ') : '',
                    board: !_.isEmpty(boards) ? boards.join(', ') : '',
                    exam: !_.isEmpty(exams) ? exams.join(', ') : '',
                    subject: !_.isEmpty(getallDetails) ? getallDetails[0].subjects : '',
                },
            };
        } else {
            const [metaDetails, localeDetails, classDetails, boardDetails, subjectDetails, paymentDetails, examDetails] = await Promise.all([TeacherMysql.getMeta(db.mysql.read, teacherId), TeacherMysql.getActiveLocale(db.mysql.read, teacherId), TeacherMysql.getActiveClass(db.mysql.read, teacherId), TeacherMysql.getActiveBoard(db.mysql.read, teacherId), TeacherMysql.getActiveSubject(db.mysql.read, teacherId), TeacherMysql.getPaymentDetails(db.mysql.read, teacherId), TeacherMysql.getActiveExam(db.mysql.read, teacherId)]);
            data.teacher_meta = metaDetails[0];
            const subsTotal = await TeacherMysql.getSubscriberData(db.mysql.read, teacherId);
            data.subscriber = !_.isEmpty(subsTotal) ? `${subsTotal[0].subscribers} Subscriber` : '0 Subscriber';
            let profileComplete = true;
            if (_.isEmpty(metaDetails[0].fname) || _.isEmpty(metaDetails[0].lname) || _.isEmpty(metaDetails[0].email) || _.isEmpty(metaDetails[0].img_url) || _.isEmpty(metaDetails[0].college) || _.isEmpty(metaDetails[0].location) || localeDetails.length === 0 || classDetails.length === 0 || subjectDetails.length === 0 || paymentDetails.length === 0) { profileComplete = false; }
            data.is_profile_completed = profileComplete;
            if (req.query.teacher_id) {
                data.teacher_meta.subscribers = !_.isEmpty(subsTotal) ? `${subsTotal[0].subscribers} subscriber` : '0 subscribers';
                if (data.teacher_meta.img_url === null) {
                    data.teacher_meta.img_url = staticData.teacherDefaultImage;
                }
            }
            data.teaching_details = {};
            data.teaching_details.locale = '';
            data.teaching_details.class = '';
            data.teaching_details.board = '';
            data.teaching_details.exam = '';
            data.teaching_details.subject = '';
            if (!_.isEmpty(localeDetails)) {
                const lst = [];
                for (let i = 0; i < localeDetails.length; i++) {
                    const localeConverted = _.isEmpty(staticData.breadcrumbs_web.languageMapping[localeDetails[i].locale]) ? 'ENGLISH' : staticData.breadcrumbs_web.languageMapping[localeDetails[i].locale];
                    lst.push(localeConverted);
                }
                data.teaching_details.locale = lst.join(', ');
            }
            if (!_.isEmpty(classDetails)) {
                const lst = [];
                classDetails.forEach((value) => {
                    lst.push(value.class);
                });
                const classList = await ClassContainer.getClassListNewOnBoardingForHome(db, 'english', 'IN');
                const classListNew = [];
                for (let i = 0; i < classList.length; i++) {
                    if (lst.indexOf(classList[i].class.toString()) != -1) {
                        classListNew.push(classList[i].class_display);
                    }
                }
                data.teaching_details.class = classListNew.join(', ');
            }
            if (!_.isEmpty(boardDetails)) {
                const cmmList = [];
                boardDetails.forEach((value) => {
                    cmmList.push(value.board);
                });
                const category = ['board', 'other-board'];
                const boardList = await TeacherMysql.getBoardName(db.mysql.read, cmmList, category);
                let boardListNew = [];
                for (let i = 0; i < boardList.length; i++) {
                    if (cmmList.indexOf(boardList[i].id.toString()) != -1) {
                        boardListNew.push(boardList[i].course);
                    }
                }
                boardListNew = _.uniq(boardListNew);
                data.teaching_details.board = boardListNew.join(', ');
            }
            if (!_.isEmpty(examDetails)) {
                const lst = [];
                examDetails.forEach((value) => {
                    lst.push(value.exam);
                });
                const category = ['exam', 'other-exam'];
                const examList = await TeacherMysql.getBoardName(db.mysql.read, lst, category);
                let examListNew = [];
                for (let i = 0; i < examList.length; i++) {
                    if (lst.indexOf(examList[i].id.toString()) != -1) {
                        examListNew.push(examList[i].course);
                    }
                }
                examListNew = _.uniq(examListNew);
                data.teaching_details.exam = examListNew.join(', ');
            }
            if (!_.isEmpty(subjectDetails)) {
                const lst = [];
                subjectDetails.forEach((value) => {
                    lst.push(value.subject);
                });
                data.teaching_details.subject = lst.join(', ');
            }
            if (!_.isEmpty(paymentDetails)) {
                const lst = [];
                paymentDetails.forEach((value) => {
                    lst.push({
                        bank_name: value.bank_name,
                        account_number: value.account_number,
                        ifsc_code: value.ifsc_code,
                    });
                });
                data.payment_details = lst;
            }
            if (isApp) {
                data.teacher_meta.email = '';
                const sli = data.teacher_meta.mobile.slice(0, 6);
                const phone = data.teacher_meta.mobile.replace(sli, 'xxxxxx');
                data.teacher_meta.mobile = phone;
            }
        }
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function upload(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        const db = req.app.get('db');
        const config = req.app.get('config');
        if (req.body.resource_type === 'profile_image') {
            // update profile image field
            const imageUrl = `${config.cdn_url}${req.files.resource[0].key}`;
            await TeacherMysql.update(db.mysql.write, teacherId, { img_url: imageUrl });
        }
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function getProfileSignedUrl(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        const s3 = req.app.get('s3');

        const db = req.app.get('db');
        const config = req.app.get('config');
        const { mime_type: mimeType = 'image/png' } = req.query;
        if (!_.includes(['image/png', 'image/jpeg'], mimeType)) {
            return next({
                message: 'Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        // update profile image field
        const fileName = `${uuidv4()}.png`;
        const prefix = `teachers/profile_image/${moment().unix().toString()}/${fileName}`;
        const key = `${config.cdn_url}${prefix}`;
        await TeacherMysql.update(db.mysql.write, teacherId, { img_url: key });
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { signed_url: await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnut-static', prefix, 12000, mimeType, 'public-read') },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function resourceDetails(req, res, next) {
    try {
        // const { teacher_id: teacherId } = req.user;
        // const db = req.app.get('db');
        // const config = req.app.get('config');
        // console.log(req.body);
        // console.log(req.files);
        // if (req.body.resource_type === 'profile_image') {
        //     // update profile image field
        //     const imageUrl = `${config.cdn_url}${req.files.resource[0].key}`;
        //     await TeacherMysql.update(db.mysql.write, teacherId, { img_url: imageUrl });
        // }
        const data = [{
            resource_type: 'video',
            category_type: [{
                type: 'youtube',
                title: 'Youtube link of the video',
                placeholder: 'Paste youtube link of your video here, you can also type in here',
            },
            // {
            //     type: 'gdrive',
            //     title: 'Google drive link of the video',
            //     placeholder: 'Paste google drive link of your video here, you can also type in here',
            // },
            {
                type: 'blob',
                title: 'Upload video from your device',
                placeholder: 'Upload your recorded videofrom your device, you can upload videos of upto 100 mb only',
            }],
            icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73774E0F-20DA-6EEB-A2E2-A798B0E347F8.webp',
            title: 'Add recorded lectures',
            // description: 'You can add videos youtube link, google drive link or even directly upload your video',
            description: 'You can add videos youtube link or directly upload your video',
        },
        {
            resource_type: 'pdf',
            category: [{
                type: 'pdf',
                title: '',
                placeholder: '',
            }],
            icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4C95A850-5600-BAE1-FB56-DFF870A97477.webp',
            title: 'Add PDFs',
            description: 'You can upload PDFs in form of notes or anything which will be helpful for students',
        },
        {
            resource_type: 'pdf',
            category: [{
                type: 'mocktest_assignment',
                title: '',
                placeholder: '',
            }],
            icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/C86BA2A1-5EE2-001D-E412-49D7F01BB027.webp',
            title: 'Mock test, Announcements',
            description: 'You can upload PDFs in form of tests or MCQs and then can evaluate them',
        },
        {
            resource_type: 'pdf',
            category: [{
                type: 'announcement',
                title: '',
                placeholder: '',
            }],
            icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DD3E0810-0DDB-FCC7-7C7F-96E7BE361C89.webp',
            title: 'Announcements',
            description: 'You can upload PDFs in form of new updates or anything you want to announce',
        }];
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

function getYouTubeVideoIdByUrl(resourceLink) {
    const reg = /^(https?:)?(\/\/)?((www\.|m\.)?youtube(-nocookie)?\.com\/((watch)?\?(feature=\w*&)?vi?=|embed\/|vi?\/|e\/)|youtu.be\/)([\w-]{10,20})/i;
    const match = resourceLink.match(reg);
    if (match) {
        return match[9];
    }
    if (resourceLink.match(/oembed/i)) {
        const resourceLink1 = url.parse(resourceLink, true).query.url;
        const resourceLink2 = url.parse(resourceLink1, true).query.v;
        return resourceLink2;
    }
    if (resourceLink.match(/attribution_link/i)) {
        const resourceLink1 = url.parse(resourceLink, true).query.u;
        const resourceLink2 = url.parse(resourceLink1, true).query.v;
        return resourceLink2;
    }
    if (resourceLink.match(/ytscreeningroom/i)) {
        const resourceLink1 = url.parse(resourceLink, true).query.v;
        return resourceLink1;
    }
    if (resourceLink.match(/user/i)) {
        const resourceLink1 = url.parse(resourceLink, true).hash;
        const resourceLink2 = resourceLink1.split('/');
        if (resourceLink2[resourceLink2.length - 1].includes('?')) {
            return resourceLink2[resourceLink2.length - 1].split('?')[0];
        }
        return resourceLink2[resourceLink2.length - 1];
    }
    return null;
}

async function addResource(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        let {
            resource_type: resourceType, category_type: categoryType, title, locale = 'en', class: classMeta, subject, chapter, category, description = '', resource_link: resourceLink,
            thumbnail_mime: thumbnailMime, resource_mime: resourceMime, video_size: videoSize,
        } = req.body;
        if (thumbnailMime === '' || thumbnailMime === undefined) thumbnailMime = 'image/png';
        if (resourceMime === '' || resourceMime === undefined) resourceMime = 'video/mp4';
        if (!_.includes(['image/png', 'image/jpeg'], thumbnailMime)) {
            return next({
                message: 'Thumbnail Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        if (!_.includes(['video/mp4', 'application/pdf'], resourceMime)) {
            return next({
                message: 'Resource Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        if ((resourceType === 'video' && categoryType === 'blob' && resourceMime !== 'video/mp4') || (resourceType === 'pdf' && resourceMime !== 'application/pdf')) {
            return next({
                message: 'Wrong mime type',
                status: 400,
                isPublic: true,
            });
        }
        const db = req.app.get('db');
        let isTestDb = false;
        if (db.mysql.read.pool.config.connectionConfig.host.includes('test')) isTestDb = true;
        const config = req.app.get('config');
        let resourceReference = null;
        let courseResouceType = null;
        let resource = '';
        let thumbnailUrl = '';
        const courseResource = {};
        let courseResourceResult = {};
        courseResourceResult.insertId = 0;
        let answerId = 0;
        let questionId = 0;
        let videoType = 'BLOB';
        if (resourceType === 'video') {
            // generate questions, answers, answer_video_resource, course resources row
            const question = {};
            const sid = teachertData.localeSidTeacherModuleMapping[locale];
            question.student_id = sid;
            question.class = classMeta;
            question.subject = subject;
            question.question = description;
            question.ocr_text = title;
            question.original_ocr_text = title;
            question.book = 'TEACHERS_MODULE';
            question.chapter = chapter;
            question.is_answered = 0;
            question.doubt = teacherId;
            const questionResult = await Question.addQuestion(question, db.mysql.write);
            questionId = questionResult.insertId;
            resourceReference = questionId;
            thumbnailUrl = isTestDb ? `${config.cdn_url}q-thumbnail-test/${questionId}.png` : `${config.cdn_url}q-thumbnail/${questionId}.png`;
            courseResouceType = 1;
            // generate answer
            const answer = {};
            answer.expert_id = sid;
            answer.question_id = questionId.toString();
            answer.answer_video = `${question.doubt}.mp4`;
            answer.youtube_id = '';
            // generate answer
            const answerResult = await Answer.addSearchedAnswer(answer, db.mysql.write);
            answerId = answerResult.insertId;
            videoType = 'BLOB';
            if (categoryType === 'blob') {
                // make blob answer video
            }
            if (categoryType === 'youtube') {
                videoType = 'YOUTUBE';
                resourceLink = getYouTubeVideoIdByUrl(resourceLink);
                if (_.isEmpty(resourceLink)) {
                    return next({
                        message: 'Invalid youtube url',
                        status: 403,
                        isPublic: true,
                    });
                }
                resource = resourceLink;
            }
            if (categoryType === 'gdrive') {
                courseResource.meta_info = categoryType;
                resource = resourceLink;
                videoType = 'BLOB';
            }
        }
        if (resourceType === 'pdf') {
            resource = `${teacherId}-${moment().unix()}`;
            courseResource.meta_info = categoryType;
            resourceReference = `${config.cdn_url}teachers/pdf/${resource}.pdf`;
            courseResouceType = 2;
            thumbnailUrl = `${config.cdn_url}pdf-thumbnail/${resource}.png`;
        }
        if (!_.isNull(resourceReference) && !_.isNull(courseResouceType)) {
            // check category type

            courseResource.resource_reference = resourceReference;
            courseResource.resource_type = courseResouceType;
            courseResource.subject = subject;
            courseResource.name = title;
            courseResource.display = title;
            courseResource.expert_name = `${req.user.fname} ${req.user.lname}`;
            courseResource.expert_image = `${req.user.img_url}`;
            courseResource.class = classMeta;
            courseResource.name = title;
            courseResource.display = title;
            courseResource.board = category;
            courseResource.description = description;
            courseResource.chapter = chapter;
            courseResource.locale = locale;
            courseResource.faculty_id = teacherId;
            courseResource.vendor_id = 3;
            courseResource.image_url = thumbnailUrl;
            courseResource.created_by = 'teacher-upload-api';
            // add course resource
            courseResourceResult = await CourseMysql.addResource(db.mysql.write, courseResource);
            const teacherResourceUploadParams = {};
            teacherResourceUploadParams.teacher_id = teacherId;
            teacherResourceUploadParams.course_resource_id = courseResourceResult.insertId;
            await TeacherMysql.addTeacherResourceUpload(db.mysql.write, teacherResourceUploadParams);
            if (resourceType === 'video') {
                const year = moment().add(5, 'hours').add(30, 'minutes').format('YYYY');
                const month = moment().add(5, 'hours').add(30, 'minutes').format('MM');
                const date = moment().add(5, 'hours').add(30, 'minutes').format('DD');
                const pathInsert = `${year}/${month}/${date}`;
                const path = (isTestDb || parseInt(videoSize) < 20971520) ? 'teachers/video' : `TEACHERS/${pathInsert}/video`;
                if (categoryType === 'blob') resource = `${path}/${courseResourceResult.insertId}.mp4`;
                const answerVideoResource = {
                    answer_id: answerId,
                    resource,
                    resource_type: videoType,
                    resource_order: 1,
                    is_active: 1,
                };
                if ((parseInt(videoSize) < 20971520 && categoryType == 'blob') || categoryType != 'blob') {
                    await AnswerMysql.addAnswerVideoResource(db.mysql.write, answerVideoResource);
                }
                resource = questionId;
            }
        }
        let payload = {};
        if (resourceType === 'video') {
            if (categoryType !== 'gdrive') {
                payload = {
                    event: 'video',
                    image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/7CB07955-9D09-DBE0-82B1-B62FE88F75CD.webp',
                    data: JSON.stringify({
                        qid: resourceReference,
                        page: 'HOME_PAGE',
                        resource_type: 'video',
                        playlist_id: 'TEACHER_CHANNEL',
                    }),
                };
            }
        } else if (resourceType === 'pdf') {
            payload = {
                event: 'pdf_viewer',
                image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D9B71CDC-0BEF-2C26-C7AE-AF3743788FB7.webp',
                data: JSON.stringify({
                    pdf_url: resourceReference,
                }),
            };
        }
        let sendNotification = false;
        const studentListHi = [];
        const studentGcmHi = [];
        const studentListEn = [];
        const studentGcmEn = [];
        if (!_.isEmpty(payload) && ((parseInt(videoSize) < 20971520 && categoryType == 'blob') || categoryType != 'blob')) {
            const subscribedStudents = await TeacherMysql.getSubscribedStudentsList(db.mysql.read, teacherId);
            subscribedStudents.forEach((student) => {
                if (student.locale === 'hi') {
                    studentListHi.push(student.student_id);
                    studentGcmHi.push(student.gcm_reg_id);
                } else {
                    studentListEn.push(student.student_id);
                    studentGcmEn.push(student.gcm_reg_id);
                }
            });
            sendNotification = true;
        }
        if (!_.isEmpty(studentListHi) && sendNotification) {
            const payload1 = payload;
            payload1.title = resourceType === 'video' ? 'नया वीडियो अपलोडेड' : 'नया स्टडी मटेरियल अपलोडेड';
            payload1.message = resourceType === 'video' ? `आपके सब्सक्राइब्ड चैनल "${req.user.fname} ${req.user.lname}" में नया वीडियो अपलोड हुआ है, अभी देखें!` : `आपके सब्सक्राइब्ड चैनल "${req.user.fname} ${req.user.lname}" में नया स्टडी मटेरियल अपलोड हुआ है, अभी देखें!`;
            const kafkaMsgData1 = {
                data: payload1,
                to: studentGcmHi,
                studentId: studentListHi,
            };
            Kafka.newtonNotification(kafkaMsgData1);
        }
        if (!_.isEmpty(studentListEn) && sendNotification) {
            const payload2 = payload;
            payload2.title = resourceType === 'video' ? 'New Video Uploaded' : 'New Study Material Uploaded';
            payload2.message = resourceType === 'video' ? `Aapke subscribed channel "${req.user.fname} ${req.user.lname}" mein naya video upload hua hai, Abhi dekhein!` : `Aapke subscribed channel "${req.user.fname} ${req.user.lname}" mein naya study material upload hua hai, Abhi dekhein!`;
            const kafkaMsgData2 = {
                data: payload2,
                to: studentGcmEn,
                studentId: studentListEn,
            };
            Kafka.newtonNotification(kafkaMsgData2);
        }
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                resource: `${resource}:${courseResourceResult.insertId}`,
                course_resource_id: courseResourceResult.insertId,
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function getResourceUploadSignedUrl(req, res, next) {
    try {
        const s3 = req.app.get('s3');

        const {
            resource_type: resourceType, category_type: categoryType, resource,
            thumbnail_mime: thumbnailMime = 'image/png', resource_mime: resourceMime = 'video/mp4', video_size: videoSize,
        } = req.query;
        const db = req.app.get('db');
        let isTestDb = false;
        if (db.mysql.read.pool.config.connectionConfig.host.includes('test')) isTestDb = true;
        // console.log(thumbnailMime);
        // console.log(resourceMime);
        if (!_.includes(['image/png', 'image/jpeg'], thumbnailMime)) {
            return next({
                message: 'Thumbnail Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        if (!_.includes(['video/mp4', 'application/pdf'], resourceMime)) {
            return next({
                message: 'Resource Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        // const video
        const data = {};
        let thumbnailUrl = '';
        data.resource_url = '';
        const resourceID = resource.split(':')[0];
        const courseResourceId = resource.split(':')[1];
        if (resourceType === 'video') {
            if (categoryType === 'blob' && resourceMime === 'video/mp4') {
                const year = moment().add(5, 'hours').add(30, 'minutes').format('YYYY');
                const month = moment().add(5, 'hours').add(30, 'minutes').format('MM');
                const date = moment().add(5, 'hours').add(30, 'minutes').format('DD');
                const insert = `${year}/${month}/${date}`;
                let path = isTestDb ? 'teachers/video' : `TEACHERS/${insert}/video`;
                let bucket = isTestDb ? 'doubtnutteststreamin-hosting-mobilehub-1961518253' : 'dn-original-studio-videos';
                if (videoSize < 20971520) {
                    path = 'teachers/video';
                    bucket = 'doubtnutteststreamin-hosting-mobilehub-1961518253';
                }
                data.resource_url = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, bucket, `${path}/${courseResourceId}.mp4`, 1200, resourceMime, 'private');
            } else if (!_.includes(['gdrive', 'youtube'], categoryType)) {
                return next({
                    message: 'Only mp4 is supported in blob',
                    status: 400,
                    isPublic: true,
                });
            }
            thumbnailUrl = isTestDb ? `q-thumbnail-test/${resourceID}.png` : `q-thumbnail/${resourceID}.png`;
        }
        if (resourceType === 'pdf' && resourceMime === 'application/pdf') {
            data.resource_url = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnut-static', `teachers/pdf/${resourceID}.pdf`, 1200, resourceMime, 'public-read');
            thumbnailUrl = `pdf-thumbnail/${resourceID}.png`;
        }
        data.thumbnail_signed_url = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnut-static', thumbnailUrl, 12000, thumbnailMime, 'public-read');
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function resourceUploaded(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        const db = req.app.get('db');
        const {
            course_resource_id: courseResourceId,
        } = req.query;

        await TeacherMysql.markTeacherResourceUpload(db.mysql.write, teacherId, courseResourceId, 1);
        // check if it is video resource
        const courseResourceDetails = await CourseMysql.getResourceByID(db.mysql.read, courseResourceId);
        if (courseResourceDetails.length > 0 && courseResourceDetails[0].resource_type == 1) await Question.updateQuestion({ is_answered: 1 }, courseResourceDetails[0].resource_reference, db.mysql.write);
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function home(req, res, next) {
    try {
        let { teacher_id: teacherId } = req.user;
        const db = req.app.get('db');
        let noContent = true;
        let {
            class: classMeta = 0,
            tab_filter: tabFilter = 'subject',
            sub_filter: subfilter,
        } = req.query;
        const widgets = [];

        // announcement form product side
        widgets.push({
            type: 'product_announcemet',
            items: [{
                image: teachertData.announcement1,
                link: 'https://forms.gle/EHdP1YL2ZeuJLt2J6',
            }],
        });
        // get active classes
        const contentFilters = {
            type: 'scroll_filter',
            items: [
                {
                    key: 'video',
                    display: 'Videos',
                },
                {
                    key: 'pdf',
                    display: 'PDFs',
                },
                {
                    key: 'mocktest_assignment',
                    display: 'Assignments',
                },
                {
                    key: 'announcement',
                    display: 'Announcements',
                }],
        };
        const tabFilterData = {
            type: 'tab_filter',
            items: [
                {
                    key: 'subject',
                    display: 'Subject',
                    is_active: (tabFilter === 'subject') ? 1 : 0,
                },
                {
                    key: 'category',
                    display: 'Exam/board',
                    is_active: (tabFilter === 'category') ? 1 : 0,
                },
            ],
        };
        let tabSubfilterDataDetails = [];
        const tabSubfilter = {
            type: 'sub_filters',
            items: [],
        };
        if (tabFilter === 'subject') {
            tabSubfilterDataDetails = await TeacherMysql.getDinstinctSubject(db.mysql.read, teacherId);
            if (_.isEmpty(subfilter) && tabSubfilterDataDetails.length > 0) subfilter = [];
            tabSubfilter.items = tabSubfilterDataDetails.map((item) => {
                if (_.isArray(subfilter)) subfilter.push(item.subject);
                return {
                    key: item.subject,
                    value: item.subject,
                    is_active: (item.subject === subfilter) ? 1 : 0,
                };
            });
        } else {
            tabSubfilterDataDetails = await TeacherMysql.getDinstinctCategories(db.mysql.read, teacherId);
            if (_.isEmpty(subfilter) && tabSubfilterDataDetails.length > 0) subfilter = [];
            tabSubfilter.items = tabSubfilterDataDetails.map((item) => {
                if (_.isArray(subfilter)) subfilter.push(item.board);
                return {
                    key: item.board,
                    value: item.board,
                    is_active: (item.board === subfilter) ? 1 : 0,
                };
            });
        }
        // if (_.isEmpty(subfilter)) tabSubfilter[0].is_active = 1;

        const resourceCount = await TeacherMysql.getResourceCount(db.mysql.read, teacherId);
        if (resourceCount.length > 0) {
            noContent = false;
            if (classMeta == 0) {
                classMeta = resourceCount[0].class;
            }
        }
        // get filtered resources
        const [resourceData] = await Promise.all([TeacherMysql.getFilteredResources(db.mysql.read, teacherId, classMeta, tabFilter, subfilter)]);
        // let mostResourceActiveClass = 0;

        const activeClass = await TeacherMysql.getActiveClass(db.mysql.read, teacherId);
        if (activeClass.length > 0) {
            const classFilters = {
                type: 'class_filter',
                items: [],
            };
            classFilters.items = activeClass.map((item) => ({
                key: item.class,
                value: item.class,
                is_active: (item.class == classMeta) ? 1 : 0,
            }));
            // if (classMeta == 0) classFilters.items[0].is_active = 1;
            widgets.push(classFilters);
        }
        widgets.push(contentFilters);
        widgets.push(tabFilterData);
        widgets.push(tabSubfilter);

        // group by resource type
        const groupedResources = _.groupBy(resourceData, 'resource_type');
        // eslint-disable-next-line guard-for-in
        for (const k in groupedResources) {
            if (k == 1) {
                // video resources

                const obj = {
                    type: 'video',
                    title: 'Videos',
                    show_view_all: 1,
                    items: [],
                };
                obj.items = [];
                for (let i = 0; i < groupedResources[k].length; i++) {
                    // let date;
                    // if (groupedResources[k][i].view_date) {
                    //     date = moment(groupedResources[k][i].view_date).subtract(1, 'day').format('DD-MM-YYYY');
                    // }
                    obj.items.push({
                        course_resource_id: groupedResources[k][i].id,
                        question_id: groupedResources[k][i].resource_reference,
                        subject: groupedResources[k][i].subject,
                        category: groupedResources[k][i].board,
                        image_url: groupedResources[k][i].image_url,
                        chapter: groupedResources[k][i].chapter,
                        title: groupedResources[k][i].name,
                        description: groupedResources[k][i].description,
                        views: groupedResources[k][i].views ? `${groupedResources[k][i].views} views` : '0 views',
                    });
                }
                widgets.push(obj);
            }
            if (k == 2) {
                // pdf resources
                const groupedPdf = _.groupBy(groupedResources[k], 'meta_info');
                // eslint-disable-next-line guard-for-in
                for (const j in groupedPdf) {
                    const obj2 = {
                        type: 'pdf',
                        title: 'PDFs',
                        show_view_all: 0,
                        items: [],
                    };
                    obj2.type = j;
                    if (j === 'pdf') {
                        obj2.title = 'PDFs';
                    }
                    if (j === 'mocktest_assignment') {
                        obj2.title = 'Mocktest assignments';
                    }
                    if (j === 'announcement') {
                        obj2.title = 'Announcements';
                    }
                    obj2.show_view_all = 0;
                    obj2.items = [];
                    for (let i = 0; i < groupedPdf[j].length; i++) {
                        obj2.items.push({
                            course_resource_id: groupedPdf[j][i].id,
                            resource_reference: groupedPdf[j][i].resource_reference,
                            subject: groupedPdf[j][i].subject,
                            category: groupedPdf[j][i].board,
                            image_url: groupedPdf[j][i].image_url,
                            chapter: groupedPdf[j][i].chapter,
                            title: groupedPdf[j][i].name,
                            description: groupedPdf[j][i].description,
                        });
                    }
                    widgets.push(obj2);
                }
            }
        }

        // const subFilters = [];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { no_content: noContent, widgets },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function subscribe(req, res, next) {
    /**
    Functionality - Adding subscription for teachers
    param1 (is_subscribe) - 0/1 for unsubscribe/subscribe
    param2 (teacher_id) - Id of teacher
    author - Saurabh Raj
    */
    try {
        const { student_id: studentId } = req.user;
        const db = req.app.get('db');

        const {
            is_subscribe: isSubscribed,
            teacher_id: teacherId,
        } = req.body;
        const params = {
            teacher_id: teacherId,
            student_id: studentId,
        };
        const checkTeacherIsInternal = await TeacherContainer.checkTeacherIsInternal(db, teacherId);
        // check added for deleting the old subscription from student hash
        if (!_.isEmpty(checkTeacherIsInternal)) {
            await StudentRedis.delSubscribedInternalTeachers(db.redis.write, studentId);
        } else {
            await StudentRedis.delSubscribedTeachers(db.redis.write, studentId);
        }
        if (isSubscribed == 1) {
            params.is_active = 1;
            const getOldSubscription = await TeacherMysql.checkOldSubscription(db.mysql.read, studentId, teacherId);
            if (getOldSubscription.length > 0) {
                await TeacherMysql.updateSubscription(db.mysql.write, params);
            } else {
                await TeacherMysql.subscribe(db.mysql.write, params);
            }
            if (!_.isEmpty(checkTeacherIsInternal)) {
                await TeacherRedis.incrSubsTotalInternal(db.redis.write, teacherId);
            } else {
                await TeacherRedis.incrSubsTotal(db.redis.write, teacherId);
            }
        }
        if (isSubscribed == 0) {
            params.is_active = 0;
            await TeacherMysql.updateSubscription(db.mysql.write, params);
            if (!_.isEmpty(checkTeacherIsInternal)) {
                await TeacherRedis.decrSubsTotalInternal(db.redis.write, teacherId);
            } else {
                await TeacherRedis.decrSubsTotal(db.redis.write, teacherId);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function channelPage(req, res, next) {
    /**
    Functionality - Channel page data for both internal and external teachers
    Critical assumptions - Internal teachers are visible from versionCode 973 onwards
    param1 (page) - page number used for data pagination
    param2 (teacher_id) - Id of the teacher
    param3 (tab_filter) - subject / category
    param4 (sub_filter) - respective subject or board/exam wrt to the tab_filter
    param5 (content_filter) - videos / pdf / mocktest_assignment / announcement; only videos / pdf for internal teachers
    param6 (type) - internal / external
    returns - "page = 1" returns header data, announcements, filters and 10 of the selected resource, from next page onwards only resources are returned
    author - Saurabh Raj
    */
    try {
        let {
            student_id: studentId, student_class: studentClass, isDropper,
        } = req.user;
        const { version_code: versionCode } = req.headers;
        const db = req.app.get('db');
        const config = req.app.get('config');
        let {
            page,
            teacher_id: teacherId,
            tab_filter: tabFilter,
            sub_filter: subfilter,
            content_filter: contentfilter,
            type,
        } = req.query;
        let isDefaultTab = false;
        if (_.isEmpty(tabFilter)) {
            tabFilter = 'subject';
            isDefaultTab = true;
        }
        let isDefaultContent = false;
        if (_.isEmpty(contentfilter)) {
            contentfilter = 'videos';
            isDefaultContent = true;
        }
        if (_.isEmpty(page)) page = 1;
        const subs = await TeacherMysql.checkSubscription(db.mysql.read, studentId, teacherId);
        let isSubscribed = false;
        if (subs.length > 0) {
            isSubscribed = true;
        }
        let widgets = [];
        const limit = 10;
        const offset = (page - 1) * limit;
        let resourceType = 1;
        // contingenty for older version
        if (versionCode < 973) {
            type = 'external';
        }
        let check = [];
        let checkqueryHit = false;
        if (type !== 'external' && type != 'internal') {
            check = await TeacherContainer.checkTeacherIsInternal(db, teacherId);
            checkqueryHit = true;
            if (!_.isEmpty(check)) {
                type = 'internal';
            } else {
                type = 'external';
            }
        }
        // Internal teacher widgets
        if (type === 'internal') {
            let teacherDetails = check;
            if (_.isEmpty(teacherDetails) && !checkqueryHit) {
                teacherDetails = await TeacherContainer.checkTeacherIsInternal(db, teacherId);
            }
            if (page == 1) {
                const subsTotal = await TeacherContainer.getSubsTotalInternal(db, teacherId);
                // header widget
                if (teacherDetails.length > 0) {
                    widgets.push({
                        type: 'teacher_header',
                        data: {
                            title: `${teacherDetails[0].name}`,
                            title2: 'Placeholder Board',
                            description: subsTotal ? `${subsTotal} subscriber` : '0 subscribers',
                            profile_id: teacherDetails[0].id,
                            image_url: teacherDetails[0].image_url ? teacherDetails[0].image_url : staticData.teacherDefaultImage,
                            button_text: isSubscribed ? 'Subscribed' : 'Subscribe',
                            button_toggle_text: isSubscribed ? 'Subscribe' : 'Subscribed',
                            profile_deeplink: `doubtnutapp://teacher_profile?teacher_id=${teacherId}`,
                            profile_header_title: `${teacherDetails[0].name}`,
                            is_subscribed: isSubscribed,
                            type: 'internal',
                        },
                    });
                }
                let announcementDetails = await TeacherContainer.getTeacherVideosInternal(db, teacherId, studentClass, 10);
                // announcement widget :- Latest videos in case of internal teachers
                if (announcementDetails.length > 0) {
                    const temp = {
                        type: 'announcement_widget',
                        data: {
                            title: 'Latest Videos',
                        },
                    };
                    announcementDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    const backgroundImgArr = staticData.teacherChannelAnnouncementArr;
                    temp.data.items = announcementDetails.map((item, index) => ({
                        id: item.id,
                        title: item.name,
                        small_text: `Class ${item.class}`,
                        url: null,
                        thumbnail_url: `${config.staticCDN}q-thumbnail/${item.resource_reference}.webp`,
                        background_url: backgroundImgArr[index % 4],
                        deeplink: `doubtnutapp://video?qid=${item.resource_reference}&page=HOME_PAGE`,
                    }));
                    widgets.push(temp);
                }
                // filters widget :- subject / category
                widgets.push({
                    type: 'channel_filter_tabs',
                    data: {
                        items: [
                            {
                                key: 'subject',
                                value: 'Subject',
                                is_active: (tabFilter === 'subject') ? 1 : 0,
                            },
                            {
                                key: 'category',
                                value: 'Board/Exam name',
                                is_active: (tabFilter === 'category') ? 1 : 0,
                            },
                        ],
                    },
                });
                let tabSubfilterDataDetails = [];
                const tabSubfilter = {
                    type: 'filter_sub_tab',
                    data: {
                        items: [],
                    },
                };
                // sub filter widget :- respective subject or board/exam wrt to the tab_filter
                if (tabFilter === 'subject') {
                    tabSubfilterDataDetails = await TeacherContainer.getDinstinctSubjectAppInternal(db, teacherId, studentClass);
                    tabSubfilterDataDetails = tabSubfilterDataDetails.filter((item) => item.subject !== null);
                    if (_.isEmpty(subfilter) && tabSubfilterDataDetails.length > 0) subfilter = tabSubfilterDataDetails[0].subject;
                    tabSubfilter.data.items = tabSubfilterDataDetails.map((item) => ({
                        key: item.subject,
                        value: item.subject,
                        is_active: (item.subject === subfilter) ? 1 : 0,
                    }));
                }
                if (tabFilter !== 'subject' || (tabFilter === 'subject' && tabSubfilterDataDetails.length === 0 && isDefaultTab)) {
                    tabSubfilterDataDetails = await TeacherContainer.getDinstinctCategoriesAppInternal(db, teacherId, studentClass);
                    tabSubfilterDataDetails = tabSubfilterDataDetails.filter((item) => item.board !== null);
                    if (_.isEmpty(subfilter) && tabSubfilterDataDetails.length > 0) subfilter = tabSubfilterDataDetails[0].category;
                    tabSubfilter.data.items = tabSubfilterDataDetails.map((item) => ({
                        key: item.category,
                        value: item.category,
                        is_active: (item.category === subfilter) ? 1 : 0,
                    }));
                    if (_.isEmpty(subfilter) && tabSubfilter.data.items.length > 0) tabSubfilter[0].is_active = 1;
                }
                if (tabSubfilter.data.items.length === 0) {
                    widgets = widgets.filter((item) => item.type !== 'channel_filter_tabs');
                }
                if (tabSubfilter.data.items.length > 0) {
                    widgets.push(tabSubfilter);
                }
                const filterData = await TeacherMysql.getDistinctFiltersInternal(db.mysql.read, teacherId, studentClass, tabFilter, subfilter);
                const groupedFilters = _.groupBy(filterData, 'resource_type');
                let contentWidget = {
                    type: 'filter_content',
                    data: {
                        items: [
                        ],
                    },
                };
                // resource filter widget :- videos / pdf
                for (const k in groupedFilters) {
                    if (k == 1 || k == 4 || k == 8) {
                        // video filter
                        contentWidget.data.items.push({
                            key: 'videos',
                            icon_url: staticData.teacherChannelVideoIcon,
                            value: 'Videos',
                            is_active: (contentfilter === 'videos') ? 1 : 0,
                        });
                    }
                    if (k == 2) {
                        // pdf filters
                        contentWidget.data.items.push({
                            key: 'pdf',
                            icon_url: staticData.teacherChannelPdf1Icon,
                            value: 'PDF',
                            is_active: (contentfilter === 'pdf') ? 1 : 0,
                        });
                    }
                }
                contentWidget.data.items = contentWidget.data.items.filter((thing, index, self) => index === self.findIndex((t) => (
                    t.key === thing.key
                )));
                if (isDefaultContent && contentWidget.data.items.length > 0) {
                    if (contentWidget.data.items.filter((item) => item.key === 'videos').length === 0) {
                        contentfilter = contentWidget.data.items[0].key;
                        contentWidget.data.items[0].is_active = 1;
                    }
                }
                if (contentWidget.data.items.length > 0) {
                    widgets.push(contentWidget);
                }
            }
            if (contentfilter === 'videos') {
                resourceType = [1, 4, 8];
            } else {
                resourceType = [2];
            }
            // resource data widget
            let resourceData = await TeacherMysql.getFilteredResourcesChannelInternal(db.mysql.read, teacherId, studentClass, tabFilter, subfilter, contentfilter, resourceType, limit, offset);
            if (contentfilter === 'videos') {
                const videoWidget = {
                    widget_type: 'channel_video_content',
                    widget_data: {
                        items: [],
                        list_orientation: 3,
                    },
                };
                const backgroundArr = staticData.teacherChannelVideoBackgroundArr;
                for (let i = 0; i < resourceData.length; i++) {
                    const tag = [];
                    if (resourceData[i].exam !== null) {
                        tag.push(`${resourceData[i].exam}`);
                    }
                    if (resourceData[i].board !== null) {
                        tag.push(`${resourceData[i].board}`);
                    }
                    if (resourceData[i].category !== null) {
                        tag.push(`${resourceData[i].category}`);
                    }
                    videoWidget.widget_data.items.push({
                        deeplink: `doubtnutapp://video?qid=${resourceData[i].resource_reference}&page=HOME_PAGE`,
                        image_url: `${config.staticCDN}q-thumbnail/${resourceData[i].resource_reference}.webp`,
                        course_resource_id: resourceData[i].id,
                        question_id: resourceData[i].resource_reference,
                        background_color: backgroundArr[i % 4],
                        image_text: ((resourceData[i].image_url !== null && resourceData[i].image_url === '') || versionCode > 964) ? resourceData[i].name : '',
                        title1: resourceData[i].name,
                        title2: `${teacherDetails[0].name} | ${resourceData[i].chapter}`,
                        description: resourceData[i].description,
                        teacher_image: teacherDetails[0].image_url ? teacherDetails[0].image_url : staticData.teacherDefaultImage,
                        tag_text: `Class ${studentClass} | ${resourceData[i].subject}`,
                        card_width: '1.1',
                        card_ratio: '16:9',
                        tag: !_.isEmpty(tag) ? tag.join(',') : '',
                        // views_count: resourceData[i].views !== null ? `${resourceData[i].views} Views` : '0 Views',
                        views_count: '',
                        friend_names: [],
                        friend_image: [],
                        type: 'internal',
                    });
                }
                if (videoWidget.widget_data.items.length > 0) {
                    widgets.push(videoWidget);
                }
            } else {
                const pdfWidget = {
                    widget_type: 'channel_pdf_content',
                    widget_data: {
                        items: [],
                        list_orientation: 1,
                    },
                };
                for (let i = 0; i < resourceData.length; i++) {
                    pdfWidget.widget_data.items.push({
                        course_resource_id: resourceData[i].id,
                        pdf_url: resourceData[i].resource_reference,
                        deeplink: `doubtnutapp://pdf_viewer?pdf_url=${resourceData[i].resource_reference}`,
                        subject: resourceData[i].subject,
                        category: resourceData[i].board,
                        image_url: resourceData[i].image_url,
                        icon_url: staticData.teacherChannelPdf2Icon,
                        chapter: resourceData[i].chapter,
                        title1: resourceData[i].name,
                        title2: `${resourceData[i].expert_name} | ${resourceData[i].board}`,
                        description: resourceData[i].description,
                        button_text: 'View/Download',
                        card_width: '1.25',
                        card_ratio: '5:3',
                    });
                }
                if (pdfWidget.widget_data.items.length > 0) {
                    if (pdfWidget.widget_data.items.length === 1) {
                        pdfWidget.widget_data.list_orientation = 2;
                    }
                    widgets.push(pdfWidget);
                }
            }
        } else if (type === 'external') {
            if (studentClass === '12' && isDropper) {
                studentClass = '13';
            }
            const teacherDetails = await TeacherMysql.getById(db.mysql.read, teacherId);
            if (page == 1) {
                // get teacher details
            // const last = parseInt(teacherId.toString().slice(-3));
                const subsTotal = await TeacherContainer.getSubsTotal(db, teacherId);
                if (teacherDetails.length > 0) {
                    widgets.push({
                        type: 'teacher_header',
                        data: {
                            title: `${teacherDetails[0].fname} ${teacherDetails[0].lname}`,
                            description: subsTotal ? `${subsTotal} subscriber` : '0 subscribers',
                            profile_id: teacherDetails[0].teacher_id,
                            // image_url: teacherDetails[0].img_url ? Utility.convertoWebP(teacherDetails[0].img_url) : staticData.teacherDefaultImage,
                            image_url: teacherDetails[0].img_url ? teacherDetails[0].img_url : staticData.teacherDefaultImage,
                            button_text: isSubscribed ? 'Subscribed' : 'Subscribe',
                            button_toggle_text: isSubscribed ? 'Subscribe' : 'Subscribed',
                            // button_deeplink: 'test.deeplink',
                            profile_deeplink: `doubtnutapp://teacher_profile?teacher_id=${teacherId}`,
                            profile_header_title: `${teacherDetails[0].fname} ${teacherDetails[0].lname}`,
                            is_subscribed: isSubscribed,
                            type: 'external',
                        },
                    });
                }
                let announcementDetails = await TeacherMysql.getPdfResouceByCategory(db.mysql.read, teacherId, studentClass, 'announcement', 10);
                if (announcementDetails.length > 0) {
                    const temp = {
                        type: 'announcement_widget',
                        data: {
                            title: 'Today\'s Announcement',
                        },
                    };
                    announcementDetails.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    const backgroundImgArr = staticData.teacherChannelAnnouncementArr;
                    temp.data.items = announcementDetails.map((item, index) => ({
                        id: item.id,
                        title: item.name,
                        small_text: `Class ${item.class}`,
                        url: item.resource_reference,
                        thumbnail_url: item.image_url,
                        background_url: backgroundImgArr[index % 4],
                        deeplink: `doubtnutapp://pdf_viewer?pdf_url=${item.resource_reference}`,
                    }));
                    widgets.push(temp);
                }
                widgets.push({
                    type: 'channel_filter_tabs',
                    data: {
                        items: [
                            {
                                key: 'subject',
                                value: 'Subject',
                                is_active: (tabFilter === 'subject') ? 1 : 0,
                            },
                            {
                                key: 'category',
                                value: 'Board/Exam name',
                                is_active: (tabFilter === 'category') ? 1 : 0,
                            },
                        ],
                    },
                });
                // generate subfilters
                let tabSubfilterDataDetails = [];
                const tabSubfilter = {
                    type: 'filter_sub_tab',
                    data: {
                        items: [],
                    },
                };
                if (tabFilter === 'subject') {
                    tabSubfilterDataDetails = await TeacherMysql.getDinstinctSubjectApp(db.mysql.read, teacherId, studentClass);
                    tabSubfilterDataDetails = tabSubfilterDataDetails.filter((item) => item.subject !== null);
                    if (_.isEmpty(subfilter) && tabSubfilterDataDetails.length > 0) subfilter = tabSubfilterDataDetails[0].subject;
                    tabSubfilter.data.items = tabSubfilterDataDetails.map((item) => ({
                        key: item.subject,
                        value: item.subject,
                        is_active: (item.subject === subfilter) ? 1 : 0,
                    }));
                }
                if (tabFilter !== 'subject' || (tabFilter === 'subject' && tabSubfilterDataDetails.length === 0 && isDefaultTab)) {
                    tabSubfilterDataDetails = await TeacherMysql.getDinstinctCategoriesApp(db.mysql.read, teacherId, studentClass);
                    tabSubfilterDataDetails = tabSubfilterDataDetails.filter((item) => item.board !== null);
                    if (_.isEmpty(subfilter) && tabSubfilterDataDetails.length > 0) subfilter = tabSubfilterDataDetails[0].board;
                    tabSubfilter.data.items = tabSubfilterDataDetails.map((item) => ({
                        key: item.board,
                        value: item.board,
                        is_active: (item.board === subfilter) ? 1 : 0,
                    }));
                    if (_.isEmpty(subfilter) && tabSubfilter.data.items.length > 0) tabSubfilter[0].is_active = 1;
                }
                if (tabSubfilter.data.items.length === 0) {
                    widgets = widgets.filter((item) => item.type !== 'channel_filter_tabs');
                }
                if (tabSubfilter.data.items.length > 0) {
                    widgets.push(tabSubfilter);
                }
                // make content filter
                const filterData = await TeacherMysql.getDistinctFilters(db.mysql.read, teacherId, studentClass, tabFilter, subfilter);
                const contentWidget = {
                    type: 'filter_content',
                    data: {
                        items: [
                        ],
                    },
                };
                const groupedFilters = _.groupBy(filterData, 'resource_type');
                // eslint-disable-next-line guard-for-in
                for (const k in groupedFilters) {
                    if (k == 1) {
                    // video filter
                        contentWidget.data.items.push({
                            key: 'videos',
                            icon_url: staticData.teacherChannelVideoIcon,
                            value: 'Videos',
                            is_active: (contentfilter === 'videos') ? 1 : 0,
                        });
                    }
                    if (k == 2) {
                    // pdf filters
                        const groupedPdf = _.groupBy(groupedFilters[k], 'meta_info');
                        // eslint-disable-next-line guard-for-in
                        for (const j in groupedPdf) {
                            if (j === 'pdf') {
                                contentWidget.data.items.push({
                                    key: 'pdf',
                                    icon_url: staticData.teacherChannelPdf1Icon,
                                    value: 'PDF',
                                    is_active: (contentfilter === 'pdf') ? 1 : 0,
                                });
                            }
                            if (j === 'mocktest_assignment') {
                                contentWidget.data.items.push({
                                    key: 'mocktest_assignment',
                                    icon_url: staticData.teacherChannelMockIcon,
                                    value: 'Mock test and assignemnt',
                                    is_active: (contentfilter === 'mocktest_assignment') ? 1 : 0,
                                });
                            }
                            if (j === 'announcement') {
                                contentWidget.data.items.push({
                                    key: 'announcement',
                                    icon_url: staticData.teacherChannelAnnouncementIcon,
                                    value: 'Announcement',
                                    is_active: (contentfilter === 'announcement') ? 1 : 0,
                                });
                            }
                        }
                    }
                }
                if (isDefaultContent && contentWidget.data.items.length > 0) {
                    if (contentWidget.data.items.filter((item) => item.key === 'videos').length === 0) {
                        contentfilter = contentWidget.data.items[0].key;
                        contentWidget.data.items[0].is_active = 1;
                    }
                }
                if (contentWidget.data.items.length > 0) {
                    widgets.push(contentWidget);
                }
            }
            if (contentfilter === 'videos') {
                resourceType = 1;
            } else {
                resourceType = 2;
            }
            let resourceData = await TeacherMysql.getFilteredResourcesChannel(db.mysql.read, teacherId, studentClass, tabFilter, subfilter, contentfilter, resourceType, limit, offset, versionCode);
            if (contentfilter === 'videos') {
                const videoWidget = {
                    widget_type: 'channel_video_content',
                    widget_data: {
                        items: [],
                        list_orientation: 3,
                    },
                };
                const backgroundArr = staticData.teacherChannelVideoBackgroundArr;
                for (let i = 0; i < resourceData.length; i++) {
                    const tag = [];
                    if (resourceData[i].exam !== null) {
                        tag.push(`${resourceData[i].exam}`);
                    }
                    if (resourceData[i].board !== null) {
                        tag.push(`${resourceData[i].board}`);
                    }
                    videoWidget.widget_data.items.push({
                        deeplink: `doubtnutapp://video?qid=${resourceData[i].resource_reference}&page=HOME_PAGE&playlist_id=TEACHER_CHANNEL`,
                        // image_url: Utility.convertoWebP(resourceData[i].image_url),
                        image_url: resourceData[i].image_url,
                        course_resource_id: resourceData[i].id,
                        question_id: resourceData[i].resource_reference,
                        background_color: backgroundArr[i % 4],
                        image_text: ((resourceData[i].image_url !== null && resourceData[i].image_url === '') || versionCode > 964) ? resourceData[i].name : '',
                        title1: resourceData[i].name,
                        title2: `${teacherDetails[0].fname} ${teacherDetails[0].lname} | ${resourceData[i].board}`,
                        description: resourceData[i].description,
                        // teacher_image: teacherDetails[0].img_url ? Utility.convertoWebP(teacherDetails[0].img_url) : staticData.teacherDefaultImage,
                        teacher_image: teacherDetails[0].img_url ? teacherDetails[0].img_url : staticData.teacherDefaultImage,
                        tag_text: `Class ${studentClass} | ${resourceData[i].subject}`,
                        card_width: '1.1',
                        card_ratio: '16:9',
                        tag: !_.isEmpty(tag) ? tag.join(',') : '',
                        views_count: resourceData[i].views !== null ? `${resourceData[i].views} Views` : '0 Views',
                        friend_names: [],
                        friend_image: [],
                        type: 'external',
                    });
                }
                if (videoWidget.widget_data.items.length > 0) {
                    widgets.push(videoWidget);
                }
            } else {
            // other type
                const pdfWidget = {
                    widget_type: 'channel_pdf_content',
                    widget_data: {
                        items: [],
                        list_orientation: 1,
                    },
                };
                for (let i = 0; i < resourceData.length; i++) {
                    pdfWidget.widget_data.items.push({
                        course_resource_id: resourceData[i].id,
                        pdf_url: resourceData[i].resource_reference,
                        deeplink: `doubtnutapp://pdf_viewer?pdf_url=${resourceData[i].resource_reference}`,
                        subject: resourceData[i].subject,
                        category: resourceData[i].board,
                        // image_url: Utility.convertoWebP(resourceData[i].image_url),
                        image_url: resourceData[i].image_url,
                        icon_url: staticData.teacherChannelPdf2Icon,
                        chapter: resourceData[i].chapter,
                        title1: resourceData[i].name,
                        title2: `${resourceData[i].expert_name} | ${resourceData[i].board}`,
                        description: resourceData[i].description,
                        button_text: 'View/Download',
                        card_width: '1.25',
                        card_ratio: '5:3',
                    });
                }
                if (pdfWidget.widget_data.items.length > 0) {
                    if (pdfWidget.widget_data.items.length === 1) {
                        pdfWidget.widget_data.list_orientation = 2;
                    }
                    widgets.push(pdfWidget);
                }
            }
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
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function viewAll(req, res, next) {
    try {
        let { teacher_id: teacherId } = req.user;
        // teacherId = 136072373;
        const db = req.app.get('db');
        // const config = req.app.get('config');
        let {
            class: resourceClass,
            tab_filter: tabFilter,
            sub_filter: subFilter,
            content_filter: resourceType,
            limit,
            page,
            month_filter: monthFilter,
            source,
        } = req.query;
        if (_.isEmpty(page)) page = 1;
        if (_.isEmpty(limit)) limit = 10;
        if (_.isEmpty(resourceType)) resourceType = 'video';
        let type = 1;
        if (resourceType != 'video') type = 2;
        const offset = (page - 1) * limit;
        const widgets = [];
        let resourceList;
        if (source === 'viewall') {
            let allClasses = [];
            const distinctClass = await TeacherMysql.getDistinctClassViewAll(db.mysql.read, teacherId);
            distinctClass.forEach((item) => {
                allClasses.push(item.class);
            });
            allClasses.sort((a, b) => b - a);
            if (_.isEmpty(resourceClass)) {
                resourceClass = distinctClass[0].class;
            }
            if (_.isEmpty(tabFilter)) tabFilter = 'subject';
            let filters;
            if (tabFilter === 'subject') {
                const tabSubfilterDataDetails = await TeacherMysql.getDinstinctSubjectViewAll(db.mysql.read, teacherId, resourceClass);
                let subFilterTemp = [];
                tabSubfilterDataDetails.forEach((item) => {
                    subFilterTemp.push(item.subject);
                });
                if (_.isEmpty(subFilter)) {
                    const temp = [...new Set(subFilterTemp)];
                    if (!_.isEmpty(temp)) {
                        subFilter = [temp[0]];
                    }
                }
                filters = [...new Set(subFilterTemp)];
            } else {
                const tabSubfilterDataDetails = await TeacherMysql.getDinstinctCategoriesViewAll(db.mysql.read, teacherId, resourceClass);
                let subFilterTemp = [];
                tabSubfilterDataDetails.forEach((item) => {
                    subFilterTemp.push(item.board);
                });
                if (_.isEmpty(subFilter)) {
                    const temp = [...new Set(subFilterTemp)];
                    if (!_.isEmpty(temp)) {
                        subFilter = [temp[0]];
                    }
                }
                filters = [...new Set(subFilterTemp)];
            }
            if (!_.isArray(subFilter)) subFilter = [`${subFilter}`];
            resourceList = await TeacherMysql.getFilteredResourcesViewAll(db.mysql.read, teacherId, resourceClass, tabFilter, subFilter, resourceType, type, parseInt(limit), offset, 9801);
            const classFilters = {
                type: 'class_filter',
                items: [],
            };
            for (let i = 0; i < allClasses.length; i++) {
                let isActiveClass = 0;
                if (allClasses[i] == resourceClass) isActiveClass = 1;
                classFilters.items.push({
                    key: allClasses[i].toString(),
                    value: allClasses[i].toString(),
                    is_active: isActiveClass,
                });
            }
            widgets.push(classFilters);
            const tabFilters = {
                type: 'tab_filter',
                items: [{
                    key: tabFilter,
                    value: tabFilter,
                    is_active: 1,
                }],
            };
            widgets.push(tabFilters);
            const subFilters = {
                type: 'sub_filter',
                items: [],
            };
            for (let i = 0; i < filters.length; i++) {
                subFilters.items.push({
                    key: filters[i],
                    value: filters[i],
                    is_active: (filters[i] == subFilter[0]) ? 1 : 0,
                });
            }
            widgets.push(subFilters);
        }
        if (source === 'hamburger') {
            if (_.isEmpty(monthFilter)) {
                monthFilter = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM');
            }
            const allMonthsFilters = await TeacherMysql.getAllMonthsFilters(db.mysql.read, teacherId, type);
            const allMonthsFiltersList = [];
            for (let i = 0; i < allMonthsFilters.length; i++) {
                allMonthsFiltersList.push(allMonthsFilters[i].filters);
            }
            if (_.isEmpty(allMonthsFiltersList)) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        widgets,
                        is_last_page: true,
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            allMonthsFiltersList.sort((a, b) => moment(b, 'YYYY-MM').diff(moment(a, 'YYYY-MM')));
            if (!allMonthsFiltersList.includes(monthFilter)) {
                monthFilter = allMonthsFiltersList[0];
            }
            const resourceCount = await TeacherMysql.getResourceCountViewAll(db.mysql.read, teacherId, type, null, null);
            const resourceCountMonth = await TeacherMysql.getResourceCountViewAll(db.mysql.read, teacherId, type, monthFilter.split('-')[0], monthFilter.split('-')[1]);
            resourceList = await TeacherMysql.getFilteredResourcesMonthly(db.mysql.read, teacherId, resourceType, type, parseInt(limit), offset, 981, parseInt(monthFilter.split('-')[0]), parseInt(monthFilter.split('-')[1]));
            const topHeading = {
                type: 'top_heading',
                title: `My Videos - ${resourceCount[0].total}`,
            };
            widgets.push(topHeading);
            const neededVideos = 20 - parseInt(resourceCountMonth[0].total);
            const headingMonth = {
                type: 'month_heading',
                title: `${resourceCountMonth[0].total} Videos`,
                title2: neededVideos > 0 ? `Upload ${neededVideos} more videos for this month` : '',
            };
            widgets.push(headingMonth);
            const subFilters = {
                type: 'month_filter',
                items: [],
            };
            for (let i = 0; i < allMonthsFiltersList.length; i++) {
                subFilters.items.push({
                    key: allMonthsFiltersList[i],
                    value: allMonthsFiltersList[i],
                    is_active: (allMonthsFiltersList[i] == monthFilter) ? 1 : 0,
                });
            }
            widgets.push(subFilters);
        }
        let widgetType;
        let widgetTitle;
        const item = [];
        const farmFilename = [];
        let loadmore = false;
        if (resourceList.length < limit) loadmore = true;
        for (let i = 0; i < resourceList.length; i++) {
            const date = moment(resourceList[i].date_farm).format('YYYY/MM/DD');
            const name = `dn-original-studio-videos/TEACHERS/${date}/video/${resourceList[i].id}.mp4`;
            farmFilename.push(name);
        }
        let processState;
        if (!_.isEmpty(farmFilename)) {
            processState = await TeacherMysql.getvideoFarmStateByName(db.mysql.read, farmFilename);
            _.forEach(processState, (value) => {
                value.id = value.input_path.split('/')[6].split('.')[0];
            });
        }
        for (let i = 0; i < resourceList.length; i++) {
            const index = _.findIndex(processState, { id: resourceList[i].id.toString() });
            if (index !== -1 && processState[index].status !== 'COMPLETE') {
                resourceList[i].is_processed = 0;
            } else {
                resourceList[i].is_processed = 1;
            }
        }
        if (resourceType == 'video') {
            widgetType = 'video';
            widgetTitle = 'Videos';
            for (let i = 0; i < resourceList.length; i++) {
                const date = moment(resourceList[i].created_at).format('DD MMM');
                item.push({
                    course_resource_id: resourceList[i].id,
                    question_id: resourceList[i].resource_reference,
                    subject: resourceList[i].subject,
                    category: resourceList[i].board,
                    image_url: resourceList[i].image_url,
                    chapter: resourceList[i].chapter,
                    title: resourceList[i].name,
                    description: resourceList[i].description,
                    views: resourceList[i].views ? `${resourceList[i].views} views` : '0 views',
                    date,
                    is_uploaded: resourceList[i].is_uploaded,
                    is_processed: resourceList[i].is_processed,
                    is_process_message: resourceList[i].is_processed === 0 ? 'Video is being processed' : '',
                });
            }
        } else {
            for (let i = 0; i < resourceList.length; i++) {
                item.push({
                    course_resource_id: resourceList[i].id,
                    resource_reference: resourceList[i].resource_reference,
                    subject: resourceList[i].subject,
                    category: resourceList[i].board,
                    image_url: resourceList[i].image_url,
                    chapter: resourceList[i].chapter,
                    title: resourceList[i].name,
                    description: resourceList[i].description,
                    is_uploaded: resourceList[i].is_uploaded,
                });
            }
            widgetType = 'pdf';
            if (resourceType == 'pdf') {
                widgetTitle = 'PDFs';
            } else if (resourceType == 'mocktest_assignment') {
                widgetTitle = 'Mocktest assignments';
            } else if (resourceType == 'announcement') {
                widgetTitle = 'Announcements';
            }
        }
        const widgetsVideo = {
            type: widgetType,
            title: widgetTitle,
            items: item,
        };
        widgets.push(widgetsVideo);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                widgets,
                is_last_page: loadmore,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function hamburger(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        const db = req.app.get('db');
        const [subscriberData, paymentDetails] = await Promise.all([TeacherMysql.getSubscriberData(db.mysql.read, teacherId), TeacherMysql.getPaymentDetails(db.mysql.read, teacherId)]);
        const widgets = [];
        widgets.push({
            type: 'profile_details',
            items: [{
                name: `${req.user.fname} ${req.user.lname}`,
                image: req.user.img_url,
                subscribers: !_.isEmpty(subscriberData) ? `${subscriberData[0].subscribers} Subscribers` : '0 Subscribers',
            }],
        });
        widgets.push({
            type: 'icons',
            items: [],
        });
        // my profile
        widgets[1].items.push({
            type: 'my_profile',
            items: [{
                title: 'My Profile',
                icon: teachertData.myProfileIcon,
            }],
        });
        // my videos
        widgets[1].items.push({
            type: 'my_videos',
            items: [{
                title: 'My Videos',
                icon: teachertData.myVideosIcon,
            }],
        });
        // payment details
        widgets.push({
            type: 'payment_details',
            items: [{
                heading: 'Your Primary Account Details',
                bank_name: !_.isEmpty(paymentDetails) ? paymentDetails[0].bank_name : '',
                account_number: !_.isEmpty(paymentDetails) ? paymentDetails[0].account_number : '',
                ifsc_code: !_.isEmpty(paymentDetails) ? paymentDetails[0].ifsc_code : '',
            }],
        });
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
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getResourceByID(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        const { resource_id: resourceId, resource_type: resourceType } = req.query;
        // const { category_type: categoryType } = req.query;
        const db = req.app.get('db');
        const config = req.app.get('config');
        const resourceDetail = await TeacherMysql.getResourceDetails(db.mysql.read, teacherId, resourceId, resourceType);
        if (resourceDetail.length) {
            let language = _.isEmpty(staticData.breadcrumbs_web.languageMapping[resourceDetail[0].locale]) ? 'ENGLISH' : staticData.breadcrumbs_web.languageMapping[resourceDetail[0].locale];
            language = 'ENGLISH';
            const data = {};
            data.title = resourceDetail[0].name;
            data.description = resourceDetail[0].description;
            // locale
            data.locale = {};
            const localeData = await LanguageContainer.getList(db);
            data.locale.list = localeData.map((value) => {
                let isActive = 0;
                if (value.code == resourceDetail[0].locale) {
                    isActive = 1;
                }
                return {
                    key: value.code,
                    image_url: '',
                    value: value.language_display,
                    is_active: isActive,
                };
            });
            // get class list
            data.class = {};
            const classData = await ClassContainer.getClassListNewOnBoardingForHome(db, 'english', 'IN');
            data.class.list = classData.map((value) => {
                let isActive = 0;
                if (value.class == resourceDetail[0].class) {
                    isActive = 1;
                }
                return {
                    key: value.class,
                    value: value.class_display,
                    is_active: isActive,
                };
            });
            // get category from locale, class
            const categoryDetails = await TeacherMysql.getCategory(db.mysql.read, resourceDetail[0].class, language);
            data.category = {};
            data.category.list = categoryDetails.map((value) => {
                let isActive = 0;
                if ((value.category == resourceDetail[0].board)) {
                    isActive = 1;
                }
                return {
                    key: value.category,
                    value: value.category,
                    is_active: isActive,
                };
            });
            // get subjects
            const subjectDetails = await TeacherMysql.getSubjects(db.mysql.read, resourceDetail[0].class, language, resourceDetail[0].board);
            data.subjects = {};
            data.subjects.list = subjectDetails.map((value) => {
                let isActive = 0;
                if ((value.subject == resourceDetail[0].subject)) {
                    isActive = 1;
                }
                return {
                    key: value.subject,
                    value: value.subject,
                    is_active: isActive,
                };
            });
            // get chapters
            data.chapters = {};
            const chapterDetails = await TeacherMysql.getChapters(db.mysql.read, language, resourceDetail[0].class, resourceDetail[0].subject);
            data.chapters.list = chapterDetails.map((value) => {
                let isActive = 0;
                if ((value.chapter == resourceDetail[0].chapter)) {
                    isActive = 1;
                }
                return {
                    key: value.chapter,
                    value: value.chapter,
                    is_active: isActive,
                };
            });
            data.image = resourceDetail[0].image_url;
            data.resource_type = resourceType;
            data.resource_id = resourceDetail[0].id;
            if (resourceDetail[0].resource_type == 1) {
                data.video_resources = await videoResource(db, config, resourceDetail[0].resource_reference);
                const viewsTemp = await TeacherMysql.getViewsByQuestionId(db.mysql.read, resourceDetail[0].resource_reference);
                data.views = !_.isEmpty(viewsTemp) ? `${viewsTemp[0].views} views` : '0 views';
                const shareDeeplink = `doubtnutapp://video?qid=${resourceDetail[0].resource_reference}&page=HOME_PAGE&playlist_id=TEACHER_CHANNEL`;
                const branchLink = await generateDeeplinkFromAppDeeplink(config.branch_key, `TEACHER_VIDEO_${teacherId}`, 'TEACHER_PANEL_SHARELINK', shareDeeplink);
                data.share_link = branchLink.url;
                data.date = moment(resourceDetail[0].created_at).format('DD MMM, YYYY');
            } else {
                data.pdf_resources = resourceDetail[0].resource_reference;
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
        }
    } catch (e) {
        next(e);
    }
}

async function leaderboardHome(req, res, next) { // 50-60 ms
    try {
        const { teacher_id: teacherId } = req.user;
        const db = req.app.get('db');
        const type = 'weekly';
        // my details
        const [myRank, myViews, myDetails] = await Promise.all([TeacherRedis.getTeacherLeaderboardRank(db.redis.read, type, teacherId), TeacherRedis.getTeacherLeaderboardViews(db.redis.read, type, teacherId), TeacherMysql.getTeacherProfileLeaderBoardDetails(db.mysql.read, [teacherId])]);
        const widgets = [];
        widgets.push({
            type: 'my_leaderboard_details',
            data: {
                image_url: !_.isEmpty(myDetails) ? myDetails[0].img_url : '',
                name: !_.isEmpty(myDetails) ? `${myDetails[0].fname} ${myDetails[0].lname}` : '',
                rank_text: !_.isNull(myRank) ? `Your Rank: ${parseInt(myRank + 1)}` : 'No Rank',
                views: !_.isNull(myRank) ? `Score: ${(+myViews).toFixed(2)}` : 'Score: 0',
                button_text: 'View Leaderboard',
            },
        });
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
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function leaderboard(req, res, next) { // 70-80 ms
    try {
        const { teacher_id: teacherId } = req.user;
        const db = req.app.get('db');
        let {
            tab_filter: tabFilter,
            page,
        } = req.query;
        let type = 'weekly';
        if (!tabFilter) {
            tabFilter = 'weekly';
        }
        if (tabFilter == 'today') {
            type = 'daily';
        } else if (tabFilter == 'monthly') {
            type = 'monthly';
        }
        let min = (page - 1) * 20;
        let max = min + 19;
        const [allRanks, myRank, myViews] = await Promise.all([TeacherRedis.getTeacherLeaderboardAll(db.redis.read, type, min, max), TeacherRedis.getTeacherLeaderboardRank(db.redis.read, type, teacherId), TeacherRedis.getTeacherLeaderboardViews(db.redis.read, type, teacherId)]);
        const teachersArr = [];
        const viewsArr = [];
        if (!_.isEmpty(allRanks)) {
            for (let j = 0; j < allRanks.length; j++) {
                if (j % 2 === 0) {
                    teachersArr.push(allRanks[j]);
                } else {
                    viewsArr.push(allRanks[j]);
                }
            }
        }
        const tempTeachersArr = [...teachersArr];
        if (page == 1 && !tempTeachersArr.includes(teacherId.toString())) {
            tempTeachersArr.push(teacherId.toString());
        }
        let details;
        if (!_.isEmpty(tempTeachersArr)) {
            details = await TeacherMysql.getTeacherProfileLeaderBoardDetails(db.mysql.read, tempTeachersArr);
        }
        const widgets = [];
        if (page == 1) {
            widgets.push({
                type: 'leaderboard_tabs',
                items: [{
                    title: "Today's",
                    active: tabFilter == 'today',
                    tab_filter: 'today',
                }, {
                    title: 'Weekly',
                    active: tabFilter == 'weekly',
                    tab_filter: 'weekly',
                }, {
                    title: 'Monthly',
                    active: tabFilter == 'monthly',
                    tab_filter: 'monthly',
                }],
            });
            widgets.push({
                type: 'faq_banner',
                data: {
                    title: 'How to Earn?',
                    image_url: teachertData.leaderboardFaqBanner,
                },
            });
            const myDetails = details.filter((item) => item.teacher_id == teacherId);
            widgets.push({
                type: 'my_leaderboard_details',
                data: {
                    image_url: !_.isEmpty(myDetails) ? myDetails[0].img_url : '',
                    name: !_.isEmpty(myDetails) ? `${myDetails[0].fname} ${myDetails[0].lname}` : '',
                    rank_text: !_.isNull(myRank) ? `Your Rank: ${parseInt(myRank + 1)}` : 'No Rank',
                    views: !_.isNull(myRank) ? `Score: ${(+myViews).toFixed(2)}` : 'Score: 0',
                },
            });
        }
        const tempWidget = {
            type: 'leaderboard_list',
            items: [],
        };
        for (let i = 0; i < teachersArr.length; i++) {
            const tempDetails = details.filter((item) => item.teacher_id == teachersArr[i]);
            tempWidget.items.push({
                image_url: !_.isEmpty(tempDetails) ? tempDetails[0].img_url : '',
                rank: min + i + 1,
                name: !_.isEmpty(tempDetails) ? `${tempDetails[0].fname} ${tempDetails[0].lname}` : '',
                views: !_.isNull(viewsArr[i]) ? `Score: ${(+viewsArr[i]).toFixed(2)}` : 'Score: 0',
            });
        }
        if (tempWidget.items.length > 0) {
            widgets.push(tempWidget);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                title: 'Leaderboard',
                widgets,
                is_last_page: tempWidget.items.length < 20,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function editResource(req, res, next) {
    try {
        const { teacher_id: teacherId } = req.user;
        const s3 = req.app.get('s3');
        const db = req.app.get('db');
        const config = req.app.get('config');
        let isTestDb = false;
        if (db.mysql.read.pool.config.connectionConfig.host.includes('test')) isTestDb = true;
        let {
            resource_type: resourceType, thumbnail_mime: thumbnailMime, resource_id: resourceId,
            title, locale = 'en', class: classMeta, subject, chapter, category, description = '', is_delete: deleteResource,
        } = req.body;
        // let { category_type: categoryType, resource_mime: resourceMime, resource_link: resourceLink } = req.body;
        if (deleteResource == 1) {
            await TeacherMysql.deleteResourceCourseResources(db.mysql.write, teacherId, resourceId);
            await TeacherMysql.deleteResourceTeacherUpload(db.mysql.write, teacherId, resourceId);
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    message: 'Resource deleted successfully',
                },
            };
            return res.status(responseData1.meta.code).json(responseData1);
        }
        let noThumbnail = false;
        if (thumbnailMime === '' || thumbnailMime === undefined) {
            thumbnailMime = 'image/png';
            noThumbnail = true;
        }
        if (!_.includes(['image/png', 'image/jpeg'], thumbnailMime)) {
            return next({
                message: 'Thumbnail Mime type not supported',
                status: 400,
                isPublic: true,
            });
        }
        let resource = '';
        const courseResource = {};
        let answerId = 0;
        const resourceDetail = await TeacherMysql.getResourceDetails(db.mysql.read, teacherId, resourceId, resourceType);
        if (resourceType === 'video') {
            // let videoType;
            const question = {};
            const sid = teachertData.localeSidTeacherModuleMapping[locale];
            question.student_id = sid;
            question.class = classMeta;
            question.subject = subject;
            question.question = description;
            question.ocr_text = title;
            question.original_ocr_text = title;
            question.chapter = chapter;
            question.is_answered = 0;
            // update questions table
            await Question.updateSubject(question, resourceDetail[0].resource_reference, db.mysql.write);

            // get answerId
            const answerIdByQuery = await Answer.getAnswerByQuestionId(resourceDetail[0].resource_reference, db.mysql.read);
            answerId = answerIdByQuery[0].answer_id;
            const answer = {
                expert_id: sid,
            };
            await FeedBackMySql._updateAnswerTable(answer, answerId, db.mysql.write);
            resource = resourceDetail[0].resource_reference;
        }
        if (resourceType === 'pdf') {
            resource = resourceDetail[0].resource_reference.split('/')[resourceDetail[0].resource_reference.split('/').length - 1].replace('.pdf', '');
        }
        // getting signed URLs if resources are changed
        let thumbnailUrl = '';
        let data = {};

        if (resourceType === 'video' && !noThumbnail) {
            thumbnailUrl = isTestDb ? `q-thumbnail-test/${resource}.png` : `q-thumbnail/${resource}.png`;
        }
        if (resourceType === 'pdf' && !noThumbnail) {
            thumbnailUrl = `pdf-thumbnail/${resource}.png`;
        }
        if (!_.isEmpty(thumbnailUrl) && !noThumbnail) {
            data.thumbnail_signed_url = await questionsHelper.getSignedUrlFromAwsSdkWithAcl(s3, 'doubtnut-static', thumbnailUrl, 12000, thumbnailMime, 'public-read');
            courseResource.image_url = `${config.cdn_url}${thumbnailUrl}`;
        }
        // called for every edit
        courseResource.subject = subject;
        courseResource.class = classMeta;
        courseResource.name = title;
        courseResource.display = title;
        courseResource.board = category;
        courseResource.description = description;
        courseResource.chapter = chapter;
        courseResource.locale = locale;
        await CourseMysql.updateCourseResources(db.mysql.write, courseResource, resourceId);
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

async function getTeachersTab(req, res, next) {
    try {
        const {
            student_id: studentID, locale: studentLocale, isDropper,
        } = req.user;
        let { student_class: studentClass } = req.user;
        const { version_code: versionCode } = req.headers;
        const { page } = req.query;
        const db = req.app.get('db');
        let studentCcmData = await CourseMysql.getCoursesClassCourseMappingWithCategory(db.mysql.read, studentID);
        const widgets = [];
        if (versionCode > 950 && page == 1) {
            let subscribedTeachersIds = await StudentContainer.getSubscribedTeachersData(db, studentID);
            subscribedTeachersIds = subscribedTeachersIds.filter((thing, index, self) => index === self.findIndex((t) => (
                t.teacher_id === thing.teacher_id
            )));
            const promises = [];
            for (let i = 0; i < subscribedTeachersIds.length; i++) {
                promises.push(StudentContainer.getTeacherData(db, subscribedTeachersIds[i].teacher_id));
            }
            const setteledPromise = await Promise.allSettled(promises);
            let subscribedTeachersDataTemp = setteledPromise.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
            subscribedTeachersDataTemp = subscribedTeachersDataTemp.filter((value) => !_.isEmpty(value) && !_.isNull(value));
            subscribedTeachersDataTemp = _.flatten(subscribedTeachersDataTemp);
            let internalTeachersSubscribedData = await StudentContainer.getSubscribedInternalTeachersData(db, studentID);
            if (!_.isEmpty(subscribedTeachersDataTemp) || !_.isEmpty(internalTeachersSubscribedData)) {
                let item = [];
                let item2 = [];
                if (!_.isEmpty(internalTeachersSubscribedData)) { // Subscribed Internal Teachers
                    for (let i = 0; i < internalTeachersSubscribedData.length; i++) {
                        let userName = internalTeachersSubscribedData[i].name;
                        let [viewsTotal, newVidCount] = await Promise.all([TeacherRedis.getTotalViews(db.redis.read, internalTeachersSubscribedData[i].faculty_id), TeacherRedis.getNewVidCount(db.redis.read, internalTeachersSubscribedData[i].faculty_id)]);
                        if (!_.isNull(viewsTotal)) {
                            viewsTotal = JSON.parse(viewsTotal);
                        }
                        if (!_.isNull(newVidCount)) {
                            newVidCount = JSON.parse(newVidCount);
                        }
                        const bgArr = staticData.teacherChannelVideoBackgroundArr;
                        const bgArrCircle = staticData.teacherChannelVideoBackgroundArrCircle;
                        const last = parseInt(internalTeachersSubscribedData[i].faculty_id.toString().slice(-3));
                        // const hours = parseInt(42 + last / 10);
                        const years = parseInt(5 + last / 100);
                        item2.push({
                            id: internalTeachersSubscribedData[i].faculty_id,
                            name: userName,
                            image_url: internalTeachersSubscribedData[i].image_url ? internalTeachersSubscribedData[i].image_url : staticData.teacherDefaultImage,
                            deeplink: `doubtnutapp://teacher_channel?teacher_id=${internalTeachersSubscribedData[i].faculty_id}&type=internal`,
                            background_color: bgArr[i % 5],
                            tag: internalTeachersSubscribedData[i].category ? `${internalTeachersSubscribedData[i].category.replace(',', ', ')}` : '',
                            subjects: internalTeachersSubscribedData[i].subjects ? internalTeachersSubscribedData[i].subjects : '',
                            experience: internalTeachersSubscribedData[i].experience ? `${internalTeachersSubscribedData[i].experience} year Experience` : `${years} year Experience`,
                            // views_count: viewsTotal ? `${viewsTotal} Views` : '0 Views',
                            circle_background_color: bgArrCircle[i % 4],
                            button_text: 'View Now',
                            button_deeplink: `doubtnutapp://teacher_channel?teacher_id=${internalTeachersSubscribedData[i].faculty_id}&type=internal`,
                            new_videos: newVidCount ? `${newVidCount} New Video Added` : '',
                            // TODO :- add logic for this later
                            friend_names: [],
                            friend_image: [],
                            card_width: '2.2',
                            card_ratio: '5:4',
                            channel_image: null,
                        });
                    }
                }

                if (!_.isEmpty(subscribedTeachersDataTemp)) { // Subscribed External Teachers
                    subscribedTeachersDataTemp = subscribedTeachersDataTemp.filter((thing, index, self) => index === self.findIndex((t) => (
                        t.teacher_id === thing.teacher_id
                    )));
                    const groupByTeacherId = _.groupBy(subscribedTeachersDataTemp, 'teacher_id');
                    const locale = studentLocale === 'hi' ? 'Hindi Medium' : 'English Medium';
                    const subscribedTeachersData = [];
                    for (const key in groupByTeacherId) {
                        if ({}.hasOwnProperty.call(groupByTeacherId, key)) {
                            let exam = [];
                            let subject = [];
                            for (let i = 0; i < groupByTeacherId[key].length; i++) {
                                if (groupByTeacherId[key][i].exam !== null && !_.includes(['6', '7', '8', '14'], studentClass)) {
                                    const temp1 = groupByTeacherId[key][i].exam.split(',');
                                    exam.push(temp1);
                                }
                                if (groupByTeacherId[key][i].board !== null && !_.includes(['6', '7', '8', '14'], studentClass)) {
                                    const temp2 = groupByTeacherId[key][i].board.split(',');
                                    exam.push(temp2);
                                }
                                if (groupByTeacherId[key][i].subjects !== null) {
                                    const temp3 = groupByTeacherId[key][i].subjects.split(',');
                                    subject.push(temp3);
                                }
                            }
                            subject = subject.flat();
                            subject = [...new Set(subject)];
                            subject = subject.splice(0, 3);
                            subject = subject.join(',');
                            groupByTeacherId[key][0].subject = subject;
                            if (_.includes(['6', '7', '8', '14'], studentClass)) {
                                groupByTeacherId[key][0].exam = locale;
                            } else {
                                exam = exam.flat();
                                exam = [...new Set(exam)];
                                let examNew = [];
                                for (let i = 0; i < exam.length; i++) {
                                    // eslint-disable-next-line no-shadow
                                    const index = studentCcmData.findIndex((item) => item.id == exam[i]);
                                    if (index !== -1) {
                                        examNew.push(studentCcmData[index].course);
                                    }
                                }
                                examNew = examNew.splice(0, 3);
                                if (!_.isEmpty(examNew)) {
                                    groupByTeacherId[key][0].exam = examNew.join(',');
                                } else {
                                    groupByTeacherId[key][0].exam = locale;
                                }
                            }
                            subscribedTeachersData.push(groupByTeacherId[key][0]);
                        }
                    }
                    for (let i = 0; i < subscribedTeachersData.length; i++) {
                        let userName;
                        if (subscribedTeachersData[i].fname !== null && subscribedTeachersData[i].lname !== null) {
                            userName = `${subscribedTeachersData[i].fname} ${subscribedTeachersData[i].lname}`;
                        } else {
                            userName = `${subscribedTeachersData[i].fname}`;
                        }
                        let [viewsTotal, newVidCount] = await Promise.all([TeacherRedis.getTotalViews(db.redis.read, subscribedTeachersData[i].teacher_id), TeacherRedis.getNewVidCount(db.redis.read, subscribedTeachersData[i].teacher_id)]);
                        if (!_.isNull(viewsTotal)) {
                            viewsTotal = JSON.parse(viewsTotal);
                        }
                        if (!_.isNull(newVidCount)) {
                            newVidCount = JSON.parse(newVidCount);
                        }
                        const bgArr = staticData.teacherChannelVideoBackgroundArr;
                        const bgArrCircle = staticData.teacherChannelVideoBackgroundArrCircle;
                        const last = parseInt(subscribedTeachersData[i].teacher_id.toString().slice(-3));
                        // const hours = parseInt(42 + last / 10);
                        const years = parseInt(5 + last / 100);
                        item.push({
                            id: subscribedTeachersData[i].teacher_id,
                            name: userName,
                            image_url: subscribedTeachersData[i].img_url ? subscribedTeachersData[i].img_url : staticData.teacherDefaultImage,
                            deeplink: `doubtnutapp://teacher_channel?teacher_id=${subscribedTeachersData[i].teacher_id}&type=external`,
                            background_color: bgArr[i % 5],
                            tag: subscribedTeachersData[i].exam ? subscribedTeachersData[i].exam : '',
                            subjects: subscribedTeachersData[i].subjects ? subscribedTeachersData[i].subjects : '',
                            experience: subscribedTeachersData[i].year_of_experience ? `${subscribedTeachersData[i].year_of_experience} year Experience` : `${years} year Experience`,
                            views_count: viewsTotal ? `${viewsTotal} Views` : '0 Views',
                            circle_background_color: bgArrCircle[i % 4],
                            button_text: 'View Now',
                            button_deeplink: `doubtnutapp://teacher_channel?teacher_id=${subscribedTeachersData[i].teacher_id}&type=external`,
                            new_videos: newVidCount ? `${newVidCount} New Video Added` : '',
                            // TODO :- add logic for this later
                            friend_names: [],
                            friend_image: [],
                            card_width: '2.2',
                            card_ratio: '5:4',
                            channel_image: null,
                        });
                    }
                }

                const data = {
                    title: studentLocale === 'hi' ? 'आपके सब्स्क्राइब्ड टीचर चैनल' : 'Aapke Subscribed Teacher Channels',
                    items: item,
                };
                const data2 = {
                    title: studentLocale === 'hi' ? 'आपके सब्स्क्राइब्ड Doubtnut टीचर चैनल' : 'Aapke Subscribed Doubtnut Teacher Channels',
                    items: item2,
                };
                if (data2.items.length !== 0) {
                    widgets.push({
                        widget_type: 'subscribed_teacher_channels',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                        widget_data: data2,
                    });
                }
                if (data.items.length !== 0) {
                    widgets.push({
                        widget_type: 'subscribed_teacher_channels',
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                        widget_data: data,
                    });
                }
            }

            // ccm teachers
            let teacherByCCM = [];
            let subscribedTeachersData = subscribedTeachersDataTemp;
            const subscribedTeachers = [];
            if (studentClass == '12' && isDropper) {
                studentClass = '13';
            }
            subscribedTeachersData.forEach((item) => subscribedTeachers.push(item.teacher_id));
            const locale = studentLocale === 'hi' ? 'Hindi Medium' : 'English Medium';
            if (_.includes(['6', '7', '8', '14'], studentClass)) {
                const teacherByLocale = await TeacherContainer.getTeacherByClassLocale(db, studentClass, studentLocale);
                const groupTeacherByLocale = _.groupBy(teacherByLocale, 'teacher_id');
                for (const key in groupTeacherByLocale) {
                    if ({}.hasOwnProperty.call(groupTeacherByLocale, key)) {
                        let subject = [];
                        for (let i = 0; i < groupTeacherByLocale[key].length; i++) {
                            if (groupTeacherByLocale[key][i].subjects !== null) {
                                const temp = groupTeacherByLocale[key][i].subjects.split(',');
                                subject.push(temp);
                            }
                        }
                        subject = subject.flat();
                        subject = [...new Set(subject)];
                        subject = subject.splice(0, 3);
                        subject = subject.join(',');
                        groupTeacherByLocale[key][0].subject = subject;
                        groupTeacherByLocale[key][0].exam = locale;
                        teacherByCCM.push(groupTeacherByLocale[key][0]);
                    }
                }
            } else {
                const ccmIdArrayExam = [];
                const ccmIdArrayBoard = [];
                let studentCcmDataExam = studentCcmData.filter((item) => item.ccm_category === 'exam' || item.ccm_category === 'other-exam');
                let studentCcmDataBoard = studentCcmData.filter((item) => item.ccm_category === 'board' || item.ccm_category === 'other-board');
                if (studentCcmDataExam.length === 0 && studentCcmDataBoard.length === 0) {
                    if (studentClass !== '13') {
                        studentCcmDataBoard = teachertData.defaultCcmIds[studentClass];
                    } else {
                        studentCcmDataExam = teachertData.defaultCcmIds[studentClass];
                    }
                    studentCcmData = teachertData.defaultCcmIds[studentClass];
                }
                studentCcmDataExam.forEach((item) => ccmIdArrayExam.push(item.id));
                studentCcmDataBoard.forEach((item) => ccmIdArrayBoard.push(item.id));
                const workerTeacherByCCMExam = [];
                const workerTeacherByCCMBoard = [];
                for (let i = 0; i < ccmIdArrayExam.length; i++) {
                    workerTeacherByCCMExam.push(TeacherContainer.getTeacherByCCMExam(db, ccmIdArrayExam[i], studentClass));
                }
                for (let i = 0; i < ccmIdArrayBoard.length; i++) {
                    workerTeacherByCCMBoard.push(TeacherContainer.getTeacherByCCMBoard(db, ccmIdArrayBoard[i], studentClass));
                }
                let teacherByCCMBoard = await Promise.all(workerTeacherByCCMBoard);
                let teacherByCCMExam = await Promise.all(workerTeacherByCCMExam);
                teacherByCCMBoard = teacherByCCMBoard.flat(1);
                teacherByCCMExam = teacherByCCMExam.flat(1);
                teacherByCCMBoard = teacherByCCMBoard.filter((item) => item !== null || item !== undefined);
                teacherByCCMExam = teacherByCCMExam.filter((item) => item !== null || item !== undefined);
                teacherByCCMBoard = teacherByCCMBoard.concat(teacherByCCMExam);
                const groupTeacherByCCMBoard = _.groupBy(teacherByCCMBoard, 'teacher_id');
                const finalTeacherByCCMBoard = [];
                for (const key in groupTeacherByCCMBoard) {
                    if ({}.hasOwnProperty.call(groupTeacherByCCMBoard, key)) {
                        let exam = [];
                        let subject = [];
                        for (let i = 0; i < groupTeacherByCCMBoard[key].length; i++) {
                            if (groupTeacherByCCMBoard[key][i].board && groupTeacherByCCMBoard[key][i].board !== null) {
                                const temp1 = groupTeacherByCCMBoard[key][i].board.split(',');
                                exam.push(temp1);
                            }
                            if (groupTeacherByCCMBoard[key][i].exam && groupTeacherByCCMBoard[key][i].exam !== null) {
                                const temp2 = groupTeacherByCCMBoard[key][i].exam.split(',');
                                exam.push(temp2);
                            }
                            if (groupTeacherByCCMBoard[key][i].subjects !== null) {
                                const temp3 = groupTeacherByCCMBoard[key][i].subjects.split(',');
                                subject.push(temp3);
                            }
                        }
                        exam = exam.flat();
                        exam = [...new Set(exam)];
                        subject = subject.flat();
                        subject = [...new Set(subject)];
                        subject = subject.splice(0, 3);
                        subject = subject.join(',');
                        groupTeacherByCCMBoard[key][0].subject = subject;
                        let examNew = [];
                        for (let i = 0; i < exam.length; i++) {
                            const index = studentCcmData.findIndex((item) => item.id == exam[i]);
                            if (index !== -1) {
                                examNew.push(studentCcmData[index].course);
                            }
                        }
                        examNew = examNew.splice(0, 3);
                        if (!_.isEmpty(examNew)) {
                            groupTeacherByCCMBoard[key][0].exam = examNew.join(', ');
                        } else {
                            groupTeacherByCCMBoard[key][0].exam = locale;
                        }
                        finalTeacherByCCMBoard.push(groupTeacherByCCMBoard[key][0]);
                    }
                }
                teacherByCCM = finalTeacherByCCMBoard;
            }
            teacherByCCM = teacherByCCM.filter((item) => !subscribedTeachers.includes(item.teacher_id));
            teacherByCCM = teacherByCCM.filter((thing, index, self) => index === self.findIndex((t) => (
                t.teacher_id === thing.teacher_id
            )));

            // Getting order for ranking of teachers, internal teachers for studentClass and ordering them
            let internalTeachersRanking = [];
            const internalTeachersRankingRedis = await TeacherRedis.getAllInternalTeacherRatingList(db.redis.read, 0, -1);
            for (let i = 0; i < internalTeachersRankingRedis.length; i += 2) {
                internalTeachersRanking.push(internalTeachersRankingRedis[i]);
            }

            let internalTeacherDetails = await TeacherMysql.getInternalTeachersByClass(db.mysql.read, studentClass);
            const filterByReference = (arr1, arr2) => {
                // eslint-disable-next-line no-shadow
                let res = [];
                res = arr1.filter((el) => !arr2.find((element) => element.faculty_id === el.faculty_id));
                return res;
            };
            internalTeacherDetails = filterByReference(internalTeacherDetails, internalTeachersSubscribedData);
            for (let i = 0; i < internalTeacherDetails.length; i++) {
                internalTeacherDetails[i].faculty_id = parseInt(internalTeacherDetails[i].faculty_id).toString();
            }

            const sortArray = (arr1, arr2) => {
                arr2.sort((a, b) => {
                    const aKey = a.faculty_id;
                    const bKey = b.faculty_id;
                    return arr1.indexOf(aKey) - arr1.indexOf(bKey);
                });
            };
            sortArray(internalTeachersRanking, internalTeacherDetails);

            // Creating Widget for Internal Teachers ordered by star rating
            let itemInternal = [];
            const subsTotalInternal0 = await CourseHelper.getTeacherSubscription({ db, teacherList: internalTeacherDetails, isInternal: true });
            for (let i = 0; i < (internalTeacherDetails.length) / 2; i++) { // displaying top internalTeacherDetails.length/2 teachers
                const last = parseInt(internalTeacherDetails[i].faculty_id.toString().slice(-3));
                const hours = parseInt(42 + last / 10);
                const years = parseInt(5 + last / 100);
                const bgArr = staticData.teacherChannelVideoBackgroundArr;

                const tempI = {
                    id: parseInt(internalTeacherDetails[i].faculty_id),
                    name: internalTeacherDetails[i].name,
                    image_url: internalTeacherDetails[i].image_url ? internalTeacherDetails[i].image_url : staticData.teacherDefaultImage,
                    subscriber: !_.isNull(subsTotalInternal0) && !_.isEmpty(subsTotalInternal0) && subsTotalInternal0 ? `${subsTotalInternal0[i]}` : '0',
                    hours_taught: `${hours} Hr`,
                    experience: internalTeacherDetails[i].experience ? `${internalTeacherDetails[i].experience} Years` : `${years} Years`,
                    button_text: 'Subscribe',
                    deeplink: `doubtnutapp://teacher_channel?teacher_id=${internalTeacherDetails[i].faculty_id}&type=internal`,
                    background_color: bgArr[i % 5],
                    tag: internalTeacherDetails[i].category ? `${internalTeacherDetails[i].category.replace('FREE', '').replace(',', ', ')}` : '',
                    // tag: `${parseFloat(internalTeacherDetails[i].avg_star_rating).toFixed(1)} Stars`,
                    type: 'internal',
                    subjects: internalTeacherDetails[i].subjects ? internalTeacherDetails[i].subjects : '',
                    card_width: '2.0',
                    card_ratio: '16:19',
                };
                itemInternal.push(tempI);
            }

            // Adding internal teachers to subject-wise widget, before adding external teachers
            let item2 = [];
            const subsTotalInternal = await CourseHelper.getTeacherSubscription({ db, teacherList: internalTeacherDetails, isInternal: true });
            for (let i = 0; i < (internalTeacherDetails.length) / 2; i++) { // internalTeacherDetails.length /2 to prevent pagination limit crossing
                const last = parseInt(internalTeacherDetails[i].faculty_id.toString().slice(-3));
                const internalDistinctSubjects = await TeacherContainer.getInternalDistinctSubjectsByTeacherAndClass(db, internalTeacherDetails[i].faculty_id, studentClass);
                const hours = parseInt(42 + last / 10);
                const years = parseInt(5 + last / 100);
                const bgArr = staticData.teacherChannelVideoBackgroundArr;
                const temp = {
                    id: internalTeacherDetails[i].faculty_id,
                    name: internalTeacherDetails[i].name,
                    image_url: internalTeacherDetails[i].image_url ? internalTeacherDetails[i].image_url : staticData.teacherDefaultImage,
                    subscriber: !_.isNull(subsTotalInternal) && !_.isEmpty(subsTotalInternal) && subsTotalInternal ? `${subsTotalInternal[i]}` : '0',
                    hours_taught: `${hours}Hr`,
                    experience: internalTeacherDetails[i].experience ? `${internalTeacherDetails[i].experience} Years` : `${years} Years`,
                    button_text: 'Subscribe',
                    deeplink: `doubtnutapp://teacher_channel?teacher_id=${internalTeacherDetails[i].faculty_id}&type=internal`,
                    background_color: bgArr[i % 5],
                    tag: internalTeacherDetails[i].category ? `${internalTeacherDetails[i].category.replace('FREE', '').replace(',', ', ')}` : '',
                    subjects: internalTeacherDetails[i].subjects ? internalTeacherDetails[i].subjects : '',
                    card_width: '2.0',
                    card_ratio: '16:19',
                };
                for (let j = 0; j < internalDistinctSubjects.length; j++) {
                    const ident = `${internalDistinctSubjects[j].subjects}`;
                    if (item2.some((it) => it.title == ident)) {
                        const index = item2.findIndex((it) => it.title == ident);
                        item2[index].items.push({
                            type: 'widget_teacher_channel_2',
                            data: temp,
                        });
                    } else {
                        item2.push({
                            title: ident,
                            scroll_direction: 'horizontal',
                            items: [{
                                type: 'widget_teacher_channel_2',
                                data: temp,
                            }],
                        });
                    }
                }
            }

            // Creating External Teachers widget and Subject-wise Teachers widget(external teachers)
            let item = [];
            const subsTotal = await CourseHelper.getTeacherSubscription({ db, teacherList: teacherByCCM, isInternal: false });
            for (let i = 0; i < teacherByCCM.length; i++) {
                let userName;
                if (teacherByCCM[i].fname !== null && teacherByCCM[i].lname !== null) {
                    userName = `${teacherByCCM[i].fname} ${teacherByCCM[i].lname}`;
                } else {
                    userName = `${teacherByCCM[i].fname}`;
                }
                const last = parseInt(teacherByCCM[i].teacher_id.toString().slice(-3));
                const distinctSubjects = await TeacherContainer.getDistinctSubjectsByTeacherAndClass(db, teacherByCCM[i].teacher_id, studentClass);
                const hours = parseInt(42 + last / 10);
                const years = parseInt(5 + last / 100);
                const bgArr = staticData.teacherChannelVideoBackgroundArr;
                const temp = {
                    id: teacherByCCM[i].teacher_id,
                    name: userName,
                    // image_url: teacherByCCM[i].img_url ? Utility.convertoWebP(teacherByCCM[i].img_url) : staticData.teacherDefaultImage,
                    image_url: teacherByCCM[i].img_url ? teacherByCCM[i].img_url : staticData.teacherDefaultImage,
                    subscriber: !_.isNull(subsTotal) && !_.isEmpty(subsTotal) && subsTotal ? `${subsTotal[i]}` : '0',
                    hours_taught: `${hours}Hr`,
                    experience: teacherByCCM[i].year_of_experience ? `${teacherByCCM[i].year_of_experience} Years` : `${years} Years`,
                    button_text: 'Subscribe',
                    deeplink: `doubtnutapp://teacher_channel?teacher_id=${teacherByCCM[i].teacher_id}&type=external`,
                    background_color: bgArr[i % 5],
                    tag: teacherByCCM[i].exam ? teacherByCCM[i].exam : '',
                    subjects: teacherByCCM[i].subject ? teacherByCCM[i].subject : '',
                    card_width: '2.0',
                    card_ratio: '16:19',
                };
                for (let j = 0; j < distinctSubjects.length; j++) {
                    const ident = `${distinctSubjects[j].subject}`;
                    if (item2.some((it) => it.title == ident)) {
                        const index = item2.findIndex((it) => it.title == ident);
                        item2[index].items.push({
                            type: 'widget_teacher_channel_2',
                            data: temp,
                        });
                    } else {
                        item2.push({
                            title: ident,
                            scroll_direction: 'horizontal',
                            items: [{
                                type: 'widget_teacher_channel_2',
                                data: temp,
                            }],
                        });
                    }
                }
                item.push(temp);
            }

            const dataInternal = {
                title: studentLocale === 'hi' ? 'डाउटनट टीचर्स के साथ सीखें' : 'Learn with Doubtnut Teachers',
                items: itemInternal,
            };
            if (dataInternal.items.length !== 0) {
                widgets.push({
                    widget_type: 'teacher_channel_list',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    widget_data: dataInternal,
                });
            }

            item = Utility.shuffleArray(item);
            const data = {
                title: studentLocale === 'hi' ? 'स्थानीय शिक्षक अब डाउटनट पर' : 'Local Teachers now on Doubtnut',
                items: item,
            };
            if (data.items.length !== 0) {
                widgets.push({
                    widget_type: 'teacher_channel_list',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    widget_data: data,
                });
            }

            const data2 = {
                title: studentLocale === 'hi' ? 'विभिन्न विषयों के शिक्षक' : 'Subject wise Teachers Channel',
                title_text_size: 16,
                items: item2,
            };
            if (data2.items.length !== 0 && data2.items[0].items.length !== 0) {
                widgets.push({
                    type: 'widget_parent_tab2',
                    data: data2,
                });
            }
        }
        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                widgets,
            },
        };
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    onboardData,
    login,
    verify,
    update,
    getMeta,
    getPaymentDetails,
    setDefaultPayment,
    getProfile,
    upload,
    resourceDetails,
    addResource,
    getResourceUploadSignedUrl,
    resourceUploaded,
    home,
    subscribe,
    channelPage,
    getProfileSignedUrl,
    viewAll,
    hamburger,
    leaderboardHome,
    leaderboard,
    getResourceByID,
    editResource,
    getTeachersTab,
};
