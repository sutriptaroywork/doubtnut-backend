const crypto = require('crypto');
const validator = require('validator');
const request = require('request');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Student = require('../../../modules/student');
const Chapter = require('../../../modules/chapter');
const Token = require('../../../modules/tokenAuth');
const Utility = require('../../../modules/utility');
const PhoneUtility = require('../../../modules/Utility.phone');
const IPUtility = require('../../../modules/Utility.IP');
const Notification = require('../../../modules/notifications');
const Constants = require('../../../modules/constants');
const Course_History = require('../../../modules/course_history');
const Whatsapp = require('../../../modules/whatsapp');
const data = require('../../../data/data');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');

const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const ClassContainer = require('../../../modules/containers/class');
const Language = require('../../../modules/language');
const StudentContainer = require('../../../modules/containers/student');
const TokenGenerator = require('../../../modules/token');

let db; let config; let client;
const LanguageContainer = require('../../../modules/containers/language');
require('../../../modules/mongo/comment');

bluebird.promisifyAll(mongoose);

const Comment = mongoose.model('Comment');

function addReferredUser(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.user;
    const { referred_id } = req.body;
    const promises = [];
    let gcm_reg_id;
    const self = res;
    if (referred_id != student_id) {
        Student.getGcmByStudentId(referred_id, db.mysql.read).then((value) => {
            // console.log(value);
            gcm_reg_id = value[0].gcm_reg_id;
            return gcm_reg_id;
        }).then((value) => Student.addReferredUser(student_id, referred_id, db.mysql.write)).then((value) => Notification.userInviteNotification(referred_id, gcm_reg_id, null, db))
            .then((value) => {
            /*
       Activity Stream Entry
       */
                db.redis.read.publish('activitystream_service', JSON.stringify({
                    actor_id: req.user.student_id,
                    actor_type: 'USER',
                    actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                    verb: 'REFERREDBY',
                    object: '',
                    object_id: referred_id,
                    object_type: 'USER',
                    target_id: '',
                    target_type: '',
                    target: '',
                }));

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: null,
                };
                self.status(responseData.meta.code).json(responseData);
            })
            .catch((e) => {
            // console.log(e);
                next(e);

            // let responseData
            //
            // if (e['code'] == 'ER_DUP_ENTRY') {
            //   responseData = {
            //     "meta": {
            //       "code": 403,
            //       "success": false,
            //       "message": "USER IS ALREADY REFERRED",
            //     },
            //     "data": null,
            //
            //   };
            //   self.status(responseData.meta.code).json(responseData)
            // }
            // else {
            //   responseData = {
            //     "meta": {
            //       "code": 403,
            //       "success": false,
            //       "message": "Error",
            //     },
            //     "data": null
            //   }
            //   self.status(responseData.meta.code).json(responseData)
            // }
            });
    } else {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Sent id and received id are same!',
            },
            data: null,
        };
        self.status(responseData.meta.code).json(responseData);
    }
}

function addPublicUserWeb(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { udid } = req.body;
    const { gcm_reg_id } = req.body;
    const class1 = req.body.class;
    const lang = req.body.language;
    const { clevertap_id } = req.body;
    const { app_version } = req.body;
    const email = (!_.isNull(req.body.email) && !_.isEmpty(req.body.email)) ? req.body.email : null;
    let is_web;
    let student_id;
    let student_username;
    let new_user = 0;
    const course = 'NCERT';

    if (validator.isUUID(udid, 4)) {
        // get student
        is_web = 1;
        Student.getStudentByUdid(udid, db.mysql.write).then((student) => {
            // //console.log(student[0]['student_id'])
            if (student.length > 0) {
                // check for gcm_red_id
                student_id = student[0].student_id;
                // if (typeof gcm_reg_id !== 'undefined' && gcm_reg_id) {
                // update it
                return Student.updateStudentByUdid(udid, class1, lang, app_version, gcm_reg_id, email, null, db.mysql.write);
                // } else {

                // return student[0]['student_id']
                // }
            }
            student_username = Utility.generateUsername(1);
            new_user = 1;
            return Student.addUser({
                udid, language: lang, class1, app_version, is_web, gcm_reg_id, student_username, student_email: email, mobile: null, clevertap_id,
            }, db.mysql.write);
        }).then((values) => {
            if (typeof values.insertId !== 'undefined' && values.insertId !== 0) {
                student_id = values.insertId;
            }
            // check if entry is in course_browse_history
            Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then((row) => {
                // console.log("row")
                // console.log(row)
                if (row.length === 0) {
                    // insert row
                    Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, class1, course).then((values) => {

                    }).catch((error) => {
                        // console.log("error")
                        // console.log(error)
                    });
                }
            });
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },

                data: {
                    student_id,
                    token: Token.create(student_id, config),
                    onboarding_video: Constants.getBlobIntro(),
                    intro: Constants.getBlobIntroObject(),
                },
            };
            res.set('dn-x-auth-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_new));
            res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_refresh, true));
            res.status(responseData.meta.code).json(responseData);
            // NOTIFICATION
            if (new_user) {
                Notification.userSignupNotification(student_id, gcm_reg_id, null, db);
            }
        }).catch((error) => {
            // console.log(error)
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "Error while adding or updating"
            //   },
            //   "data": null,
            //   "error": error
            // }
            // res.status(responseData.meta.code).json(responseData)
        });
    } else {
        is_web = 0;
        const responseData = {
            meta: {
                code: 401,
                success: false,
                message: 'Error while adding or updating',
            },
            data: null,
            error: 'error',
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

function updateGcm(req, res, next) {
    // 6.2.9

    db = req.app.get('db');
    config = req.app.get('config');
    // client = req.app.get('client')
    const { student_id } = req.user;
    const { gcm_reg_id } = req.body;
    const { app_version } = req.body;
    // let responseData;

    if (student_id && gcm_reg_id) {
        // get student
        Student.updateFcm(student_id, gcm_reg_id, app_version, db.mysql.write).then((result) => {
            // //console.log('result')
            // //console.log(result['changedRows'])
            if (result.changedRows) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                const responseData = {
                    meta: {
                        code: 200,
                        success: false,
                        message: 'Not updated',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
            Student.deleteUserInRedis(student_id, db.redis.write).then((res) => {

            }).catch((er) => {

            });
        }).catch((error) => {
            // console.log('error')
            // console.log(error)
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "Error while adding or updating",
            //   },
            //   "error": error
            // }
            // res.status(responseData.meta.code).json(responseData)
        });
    } else {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'No UDID or gcm reg id',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

function setLanguage(req, res, next) {
    db = req.app.get('db');
    const lang = req.body.language_code;
    const st_id = req.user.student_id;
    if (lang && st_id) {
        Student.setLang(lang, st_id, db.mysql.write).then((values) => {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESSFUL',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }).catch((error) => {
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "UNSUCCESSFUL",
            //   },
            //   "data": null,
            //   "error": error
            // }
            // res.status(responseData.meta.code).json(responseData);
        });
    } else {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong with params',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

function setClass(req, res, next) {
    db = req.app.get('db');
    let { student_class } = req.body;
    const { student_id } = req.user;
    let is_dropped = 0;
    if (student_class && student_id) {
        if (student_class == '13') {
            is_dropped = 1;
            student_class = '12';
        }
        Student.setClass(student_class, is_dropped, student_id, db.mysql.write).then((values) => {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESSFUL',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }).catch((error) => {
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "UNSUCCESSFUL",
            //   },
            //   "data": null,
            //   "error": error
            // }
            // res.status(responseData.meta.code).json(responseData);
        });
    } else {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Something is wrong with params',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function login(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');

    const mobile = req.body.phone_number;
    const { email } = req.body;
    const class1 = req.body.class;
    const { language } = req.body;
    const { app_version } = req.body;
    const { gcm_reg_id } = req.body;
    let { course } = req.body;
    if (typeof course === 'undefined') {
        if (class1 == '14') {
            course = 'GOVT_EXAM';
        } else {
            course = 'NCERT';
        }
    }
    const { udid } = req.body;
    let is_web = 0;
    if (validator.isUUID(udid, 4)) {
        // get student
        is_web = 1;
    } else if (udid.length === 16) {
        is_web = 0;
    }
    const otp = Utility.generateOtp();
    // //console.log(req.body)

    // console.log('otp')
    // console.log(otp)

    if (!PhoneUtility.isValidPhoneNumber(mobile)) {
        const response = PhoneUtility.invalidPhoneNumberResponse();
        return res.status(response.meta.code).json(response);
    }

    // check if IP has hit rate limit
    if (await IPUtility.hasReachedLimit(db.redis, config.OTPLimitPerDay, req.headers['True-Client-IP'] || req.headers['x-forwarded-for'])) {
        const response = IPUtility.maxLimitReached();
        return res.status(response.meta.code).json(response);
    }

    const options = {
        method: 'GET',
        uri: `https://2factor.in/API/V1/${config.two_fa_key}/SMS/${mobile}/${otp}/doubtnut_latest`,
    };
    // //console.log(options)
    request(options, (error, response, body) => {
        // //console.log(error)
        // //console.log(body)
        if (!error) {
            const otp = JSON.parse(body);
            const response = { status: otp.Status, session_id: otp.Details };

            // console.log("redis");
            Token.otpCreate(otp.Details, mobile, email, class1, course, language, app_version, gcm_reg_id, udid, is_web, db.redis.write).then((otpCreateResult) => {
                const responseData1 = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Otp is sent ,Please verify',
                    },
                    data: response,
                };
                res.status(responseData1.meta.code).json(responseData1);
            }, (error) => {
                // console.log(error);
                const responseData1 = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Error in saving otp',
                    },
                    data: null,
                    error,
                };
                res.status(responseData1.meta.code).json(responseData1);
            });
        } else {
            next(error);

            // let responseData1 = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "Error in 2fa"
            //   },
            //   "data": error
            // }
            // res.status(responseData1.meta.code).json(responseData1);
        }
    });
}

function verify(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    let contact; let email; let class1; let language; let student_id; let app_version; let student_username; let gcm_reg_id; let udid; let is_web;
    const course = 'NCERT';
    const otp_entered_by_user = req.body.otp;
    const { session_id } = req.body;

    let new_user = 0;
    let check_udid = 0;

    request.get(`https://2factor.in/API/V1/${config.two_fa_key}/SMS/VERIFY/${session_id}/${otp_entered_by_user}`, (error, response, body) => {
        if (!error) {
            // console.log('1')
            const otp = JSON.parse(body);
            if (otp.Status === 'Success') {
                Token.getContact(req.body.session_id, db.redis.read).then((values) => values).then((result) => {
                    result = JSON.parse(result);
                    contact = result.contact_number;
                    email = result.email;
                    class1 = result.class;
                    language = result.language;
                    app_version = result.app_version;
                    gcm_reg_id = result.gcm_reg_id;
                    udid = result.udid;
                    udid = result.udid;
                    is_web = result.is_web;
                    student_username = Utility.generateUsername(0).toLowerCase();
                    // console.log("student_username");
                    // console.log(student_username);

                    return Student.checkStudentExists(contact, db.mysql.write);
                    // return Student.getStudentByUdid(udid, db.mysql.read)
                }).then((value) => {
                    if (value.length == 0) {
                        check_udid = 1;
                        return Student.getStudentByUdid(udid, db.mysql.write);
                        //   .then(std => {
                        //   if(std.length == 0){
                        //     //console.log('6')
                        //     //insert
                        //     return Student.addByMobile(contact, email, class1, language, app_version, gcm_reg_id, student_username, udid, is_web, db.mysql.write)
                        //   }else{
                        //     //console.log('7')
                        //     return Student.updateStudentByUdid(udid, class1, language, app_version, gcm_reg_id,email,contact, db.mysql.write)
                        //   }
                        // }).catch(err => {
                        //   //console.log(err)
                        //   let responseData = {
                        //     "meta": {
                        //       "code": 403,
                        //       "success": false,
                        //       "message": "Error in getting student",
                        //     },
                        //     "data": null,
                        //     "error": error
                        //   }
                        //   res.status(responseData.meta.code).json(responseData);
                        // })
                        // insert
                        // return Student.addByMobile(contact, email, class1, language, app_version, gcm_reg_id, student_username, udid, is_web, db.mysql.write)
                        // return Student.add(udid, language, class1, app_version, is_web, gcm_reg_id, student_username,email,contact, db.mysql.write)
                    }
                    // console.log('8')
                    student_id = value[0].student_id;
                    return Student.updateStudentByMobile(email, contact, class1, language, app_version, gcm_reg_id, udid, is_web, db.mysql.write);
                    // return Student.updateStudentByUdid(udid, class1, language, app_version, gcm_reg_id,email,contact, db.mysql.write)
                })
                    .then((val) => {
                    // console.log('4')
                    // console.log(val)
                        if (check_udid) {
                            if (val.length === 0) {
                                new_user = 1;
                                return Student.addByMobile(contact, email, class1, language, app_version, gcm_reg_id, student_username, udid, is_web, db.mysql.write);
                            }
                            student_id = val[0].student_id;
                            return Student.updateStudentByUdid(udid, class1, language, app_version, gcm_reg_id, email, contact, db.mysql.write);
                        }
                        return val;
                    })
                    .then((values) => {
                        if (typeof values.insertId !== 'undefined' && values.insertId !== 0) {
                            student_id = values.insertId;

                            // check if entry is in course_browse_history
                            Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then((row) => {
                                if (row.length === 0) {
                                // insert row
                                    Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, class1, course).then((values) => {

                                    }).catch((error) => {
                                    // console.log(error)
                                    });
                                }
                            });
                            //  notification start

                            // NOTIFICATION
                            if (new_user) {
                                Utility.getNotificationCohort(student_id);
                                Notification.userSignupNotification(student_id, gcm_reg_id, null, db);
                            }
                        // notification end
                        }
                        Student.deleteUserInRedis(student_id, db.redis.write).then((res) => {

                        }).catch((er) => {

                        });
                        if (1) {
                            Whatsapp.checkWhatsappOptin(contact, db.mysql.read).then(async (exists_wa_optin) => {
                                if (!exists_wa_optin.length > 0) {
                                    const promises = [];
                                    promises.push(Whatsapp.insertNum(contact, 10, db.mysql.write));
                                    promises.push(Utility.OptIn(contact, config));
                                    Promise.all(promises).then((responses) => {
                                        Utility.sendWhatsAppMessageHSM(contact, data.whatsapp_login_msg_optin, config).then((results) => {
                                            const responseData1 = {
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
                                                },
                                            };
                                            res.set('dn-x-auth-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_new));
                                            res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_refresh, true));
                                            res.status(responseData1.meta.code).json(responseData1);
                                        }).catch((error) => {
                                            // //console.log("error");
                                            next(error);
                                            //
                                        });
                                    }).catch((error) => {
                                        next(error);
                                    });
                                } else {
                                    const responseData1 = {
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
                                        },
                                    };
                                    res.set('dn-x-auth-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_new));
                                    res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_refresh, true));
                                    res.status(responseData1.meta.code).json(responseData1);
                                }
                            }).catch((er) => {
                                next(er);
                            });
                        }
                    })
                    .then(async () => Student.updateRetargetStudentChurn(db.mysql.write, student_id, false))
                    .catch((error) => {
                    // //console.log("error");
                    // console.log(error);
                        next(error);

                    // let responseData = {
                    //   "meta": {
                    //     "code": 403,
                    //     "success": false,
                    //     "message": "Error while adding or updating",
                    //   },
                    //   "data": null,
                    //   "error": error
                    // }
                    // res.status(responseData.meta.code).json(responseData);
                    });
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Invalid otp',
                    },
                    data: null,
                    error: otp,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "Error in 2FA",
            //   },
            //   "error": error
            // }
            // res.status(responseData.meta.code).json(responseData);
        }
    });
}

function browse(req, res, next) {
    db = req.app.get('db');
    const { student_id } = req.user;
    const { student_class } = req.body;
    const { student_course } = req.body;
    const promise = [];
    const params = {};
    params.student_class = student_class;
    promise.push(Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, student_class, student_course));
    promise.push(Student.updateUserProfile(student_id, params, db.mysql.write));
    Promise.all(promise).then((values) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
        Student.deleteUserInRedis(student_id, db.redis.write).then((re) => {

        }).catch((e) => {

        });
    }).catch((error) => {
        next(error);

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Something is wrong",
        //   },
        //   "data": null,
        //   "error": error
        // }
        // res.status(responseData.meta.code).json(responseData)
    });
}

async function getProfile(req, res, next) {
    // let winstonInstance = req.app.get('winstonInstance');
    //  winstonInstance.info("test")
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.params;
    const language = await LanguageContainer.getByCode(req.user.locale, db);

    if (language.length > 0) {
        Student.getUserProfileNew(student_id, language[0].language, db.mysql.read).then((result) => {
            // console.log('result');
            // console.log(result);
            if (result.length > 0) {
                if (result[0].dob === null) {
                    result[0].dob = '';
                } else {
                    result[0].dob = moment(result[0].dob).format('YYYY-MM-DD');
                }
                if (result[0].total_questions_asked === null) {
                    result[0].total_questions_asked = 0;
                }
                if (result[0].old_video_table_count === null) {
                    result[0].old_video_table_count = 0;
                }
                if (result[0].new_video_table_count === null) {
                    result[0].new_video_table_count = 0;
                }
                result[0].total_video_count = result[0].old_video_table_count + result[0].new_video_table_count;
                if (result[0].old_video_table_views === null) {
                    result[0].old_video_table_views = 0;
                }
                if (result[0].new_video_table_views === null) {
                    result[0].new_video_table_views = 0;
                }
                result[0].total_video_view_duration = result[0].old_video_table_views + result[0].new_video_table_views;
                delete result[0].old_video_table_views;
                delete result[0].new_video_table_views;
                delete result[0].old_video_table_count;
                delete result[0].new_video_table_count;
                Utility.addBadgesDetails(result[0], db.mysql.read, config).then((values) => {
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
                    // console.log(error)
                    next(error);

                    // let responseData = {
                    //   "meta": {
                    //     "code": 200,
                    //     "success": true,
                    //     "message": "No badges",
                    //   },
                    //   "data": result[0],
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                });
            }
        }).catch((error) => {
            // console.log(error)
            next(error);

            // let responseData = {
            //   "meta": {
            //     "code": 403,
            //     "success": false,
            //     "message": "FAILURE",
            //   },
            //   "data": null,
            // };
            // res.status(responseData.meta.code).json(responseData);
        });
    } else {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'No Language Found',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function updateProfile(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const publicPath = req.app.get('publicPath');
        const s3 = req.app.get('s3');

        const { student_id } = req.user;
        // let student_id = 118;
        const fname = req.body.student_fname;
        const lname = req.body.student_lname;
        const email = req.body.student_email;
        const student_username = req.body.username;
        const { student_course } = req.body;
        const image = req.body.img_url;
        const school = req.body.school_name;
        const sclass = req.body.student_class;
        const { locale } = req.body;
        const { dob } = req.body;
        const { coaching } = req.body;
        const { pincode } = req.body;
        const blobService = req.app.get('blobService');
        const params = {};
        // if (student_course !== undefined) {
        //   params.course = student_course;
        // }
        if (fname !== undefined) {
            params.student_fname = fname;
        }
        if (lname !== undefined) {
            params.student_lname = lname;
        }
        if (email !== undefined) {
            params.student_email = email;
        }
        // if (image !== undefined) {
        //   params.img_url = image;
        // }
        if (school !== undefined) {
            params.school_name = school;
        }
        if (sclass !== undefined) {
            params.student_class = sclass;
        }
        if (locale !== undefined) {
            params.locale = locale;
        }
        if (student_username !== undefined) {
            params.student_username = student_username;
        }
        if (dob !== undefined) {
            params.dob = dob;
        }
        if (coaching !== undefined) {
            params.coaching = coaching;
        }
        if (pincode !== undefined) {
            params.pincode = pincode;
        }
        if (image !== undefined) {
            // let extension = ".png"
            // if (image.indexOf("png") !== -1) extension = ".png"
            // else if (image.indexOf("jpg") !== -1 || image.indexOf("jpeg") !== -1)
            //   extension = ".jpg"
            // image = image.replace(/^data:([A-Za-z-+/]+);base64,/, "");
            // const fileName = "upload_" + moment().unix() + extension;
            // let buf = new Buffer(image, 'base64');
            // let check = await Utility.uploadImageToBlob(blobService, fileName, buf) // upload file
            // params['img_url'] = "http://doubtnutvideobiz.blob.core.windows.net/q-images/" + fileName;
            params.img_url = await Utility.uploadImageToS3(image, student_id, config.cdn_url, publicPath, fs, s3, config.aws_bucket);
        }
        // console.log("params")
        // console.log(params)
        const promise = [];
        promise.push(Student.updateUserProfile(student_id, params, db.mysql.write));
        promise.push(Course_History.getStudentDetailsBySid(student_id, db.mysql.read));
        const resolvedPromises = await Promise.all(promise);
        // console.log("resolvedPromises")
        // console.log(resolvedPromises)
        if (resolvedPromises[1].length > 0) {
            // //console.log("resolvedPromises[1]['id']")
            // //console.log(resolvedPromises[1][0]['id'])
            if (typeof student_course !== 'undefined') {
                await Course_History.updateCourseById(resolvedPromises[1][0].id, student_course, db.mysql.write);
            }
        } else if (typeof student_course !== 'undefined') {
            await Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, sclass, student_course);
        }
        // await Student.updateUserProfile(student_id, params, db.mysql.write).then((result) => {
        //   //console.log("result");
        //   //console.log(result);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
        Student.deleteUserInRedis(student_id, db.redis.write).then((res) => {
            // Comment.find({student_id: student_id, is_deleted: false}).then(result => {
            const updateQuery = {};
            if (image !== undefined) {
                updateQuery.student_avatar = params.img_url;
            }
            if (student_username !== undefined) {
                updateQuery.student_username = params.student_username;
            }
            const bulk = Comment.collection.initializeOrderedBulkOp();
            bulk.find({ student_id: student_id.toString(), is_deleted: false }).update({ $set: updateQuery });
            bulk.execute((error) => {
            });
            // }).catch(err => {

            // })
            // )
        }).catch((e) => {});
    } catch (err) {
        // console.log(err)
        next(err);

        // let responseData
        // if (err['code'] == 'ER_DUP_ENTRY') {
        //   responseData = {
        //     "meta": {
        //       "code": 403,
        //       "success": false,
        //       "message": "USER NAME IS ALREADY CHOSEN",
        //     },
        //     "data": null,
        //     "error": err
        //   };
        // } else {
        //   responseData = {
        //     "meta": {
        //       "code": 403,
        //       "success": false,
        //       "message": "FAILURE",
        //     },
        //     "data": null,
        //     "error": err
        //   };
        // }
        // res.status(responseData.meta.code).json(responseData);
    }
}

function logout(req, res, next) {
    db = req.app.get('db');
    const { student_id } = req.user;
    const recievedToken = req.header('x-auth-token');
    Student.logout(db.redis.write, recievedToken).then((result) => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((err) => {
        next(err);

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "FAILURE",
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
    });
}

function checkUsername(req, res, next) {
    db = req.app.get('db');
    const { username } = req.body;
    const { student_id } = req.user;
    // console.log('username');

    // console.log(username);
    Student.checkUsername(username, student_id, db.mysql.read).then((values) => {
        // console.log(values);
        if (values.length > 0) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    available: false,
                },
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Username is available',
                },
                data: {
                    available: true,
                },
            };
            res.status(responseData.meta.code).json(responseData);
        }
    }).catch((err) => {
        next(err);

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "ERROR",
        //   },
        //   "data": null,
        //   "error": err
        // };
        // res.status(responseData.meta.code).json(responseData);
    });
}

function tokenRecreate(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.params;
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },

        data: Token.create(student_id, config),
    };
    res.status(responseData.meta.code).json(responseData);
}

async function getReferredUsers(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const result = await Student.getReferredUsers(student_id, db.mysql.read);
        for (let i = 0; i < result.length; i++) {
            if (typeof result[i].student_username === 'undefined' || result[i].student_username == null) {
                result[i].student_username = 'Doubtnut User';
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },

            data: result,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);

        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error"
        //   },
        //
        //   "data": null
        // }
        // res.status(responseData.meta.code).json(responseData);
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

        if ((completeness && exam_c && board_c && student_class <= 12) || (completeness && student_class === 14) || (completeness && student_class === 13)) {
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
        if ((await StudentContainer.getById(student_id, db).length) === 0) {
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

        const student_fname = name[0];
        let student_lname;
        // student_fname = name[0];

        if (name.length >= 2) {
            student_lname = name[1];
        } else {
            student_lname = '';
        }
        const { gender } = req.body;

        const student_class = typeof req.body.class === 'undefined' ? null : req.body.class;
        const { board } = req.body;
        const { exam } = req.body;

        // method

        if (typeof board === 'number') {
            const board_array = [];
            board_array.push(board);
            await Utility.insertExamAndBoardSelections(
                db,
                board_array,
                'board',
                student_id,
            );
        }

        if (typeof exam !== 'undefined' && !_.isEmpty(exam) && exam.length > 0) {
            await Utility.removeDataForIndividualWidget(db.mysql.write, student_id, 'exam');

            await Utility.insertExamAndBoardSelections(
                db,
                exam,
                'exam',
                student_id,
            );
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

            let sql = `select * from student_location where student_id = '${student_id}'`;

            const result = await db.mysql.read.query(sql);

            if (result.length > 0) {
                sql = `update student_location set ? where student_id = '${student_id}'`;
            } else {
                params.student_id = student_id;
                sql = 'insert into student_location set ?';
            }

            await db.mysql.write.query(sql, [params]);
        }

        const school = req.body.school != null ? req.body.school.trim() : null;
        const coaching = req.body.coaching != null
            ? req.body.coaching.trim().length > 0
                ? req.body.coaching.trim()
                : 'No'
            : null;
        const dob = req.body.date_of_birth;

        const sql = `update students SET ? where student_id = ${student_id}`;
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

        const status = await db.mysql.write.query(sql, [params]);
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
        console.log('updated username');
        console.log('username');

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

async function getProfileNew(req, res, next) {
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
        const promises = [];
        promises.push(ClassCourseMapping.allClassCourse(student_info[0].student_class, db.mysql.read));
        promises.push(StudentCourseMapping.getStudentSelectedCourse(student_id, db.mysql.read));
        promises.push(Student.getStudentOptions(query_options, db.mysql.read));
        promises.push(Student.getStudentLocation(student_id, db.mysql.read));

        const resolvedPromises = await Promise.all(promises);
        const student_options = resolvedPromises[2];
        const student_location = resolvedPromises[3];

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
            option_list.class = class_course[i].class;

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

        const student_exam_options_norm = _.groupBy(student_exam_options, 'class');
        const student_board_options_norm = _.groupBy(student_board_options, 'class');

        let gender; let student_class; let board; let
            goal;
        (gender = {}), (student_class = {}), (board = {}), (goal = {});

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

async function updateStudentCourseAndExam(db, code, type, sId) {
    const promises = [];
    for (let i = 0; i < code.length; i++) {
        const obj = {
            student_id: sId,
            ccm_id: code[i],
        };
        if (type === 'board') {
            const dataExistRes = await ClassCourseMapping.getStudentsExamsBoardsData(db.mysql.read, sId, type);
            if (!_.isEmpty(dataExistRes)) {
                dataExistRes.forEach((element) => {
                    promises.push(StudentCourseMapping.deleteWidgetSelectionForStudent(db.mysql.write, element.table_id));
                });
            }
        }
        promises.push(StudentCourseMapping.insertWidgetSelectionForStudent(db.mysql.write, obj));
    }
    await Promise.all(promises);
}

function addImageShow(configData, imageShow) {
    return configData.imageShow = imageShow;
}

async function getClassListData(db, configData) {
    const result = await ClassContainer.getClassListNewOnBoarding(db, 'english');
    let temp = result.shift();
    result.push(temp);
    temp = result.shift();
    result.splice(2, 0, temp);
    const returnData = {};

    returnData.type = 'class';
    returnData.title = `${data.onBoardingClassHeading('en')}\n${data.onBoardingClassHeading('hi')}`;
    returnData.is_active = configData.is_active;
    returnData.is_multi_select = configData.is_multi_select;
    returnData.is_submitted = configData.is_submitted;
    returnData.image = '';
    returnData.message = '';
    returnData.step_items = result;
    returnData.step_items = returnData.step_items.map((a) => {
        if (configData.selectedClass !== undefined && !configData.dropper && a.code == configData.selectedClass) {
            a.is_active = true;
        } else if (configData.dropper && a.code === 13) {
            a.is_active = true;
        } else {
            a.is_active = false;
        }
        a.sub_title = null;
        return a;
    });
    const imageLink = `${config.staticCDN}${data.classNextImage}`;
    const messageLink = `${data.classNextMessage}\n${data.classNextHindiMessage}`;
    returnData.progress_details = {
        image: imageLink,
        message: messageLink,
    };
    if (configData.imageShow != undefined && !configData.imageShow) {
        returnData.progress_details = null;
    }
    return returnData;
}

async function getLangListData(db, configData) {
    const returnData = {};

    returnData.type = 'language';
    returnData.title = data.onBoardinglanguageHeading;
    returnData.is_active = configData.is_active;
    returnData.is_multi_select = configData.is_multi_select;
    returnData.is_submitted = configData.is_submitted;
    returnData.image = '';
    returnData.message = '';

    let progImg = data.langNextImage;
    let progMsg = `${data.langNextMessage}\n${data.langNextHindiMessage}`;
    // let progMsg = data.langNextMessage;
    if (configData.selectedClass == 6 || configData.selectedClass == 7 || configData.selectedClass == 8) {
        // progMsg = `${data.langNextMathsMessage}\n${data.langNextMathsHindiMessage}`;
        progMsg = data.langNextMathsMessage;
        progImg = data.langNextMathsImage;
    }

    const imageLink = `${config.staticCDN}${progImg}`;
    const messageLink = progMsg;

    returnData.step_items = await Language.getListNewOnBoarding(db.mysql.read);
    returnData.step_items = returnData.step_items.map((a) => {
        if (configData.selectedLang !== undefined && a.code == configData.selectedLang) {
            a.is_active = true;
        } else {
            a.is_active = false;
        }
        a.sub_title = null;
        return a;
    });
    returnData.progress_details = {
        image: imageLink,
        message: messageLink,
    };
    if (configData.imageShow != undefined && !configData.imageShow) {
        returnData.progress_details = null;
    }

    return returnData;
}

async function getBoardExamListData(db, configData, locale) {
    const returnData = {};

    returnData.type = configData.type;
    returnData.is_active = configData.is_active;
    returnData.is_multi_select = configData.is_multi_select;
    returnData.is_submitted = configData.is_submitted;
    returnData.image = '';
    returnData.message = '';

    const progMsg = data.boardNextMessage(locale);
    if (configData.type === 'board') {
        returnData.title = data.onBoardingBoardHeading(locale);
    } else {
        returnData.title = data.onBoardingExamHeading(locale);
    }
    returnData.step_items = await StudentContainer.getExamsBoardsDetailsLocalised(db, configData.stu_class, configData.type, configData.langText);
    returnData.step_items = returnData.step_items.map((a) => {
        if (configData.selectedBoard !== undefined && a.code == configData.selectedBoard) {
            a.is_active = true;
        } else {
            a.is_active = false;
        }
        return a;
    });

    const imageLink = `${config.staticCDN}${data.boardNextImage}`;
    const messageLink = progMsg;
    returnData.progress_details = {
        image: imageLink,
        message: messageLink,
    };
    if (configData.imageShow != undefined && !configData.imageShow) {
        returnData.progress_details = null;
    }

    return returnData;
}

async function getUserName(studentData) {
    let userName = '';
    if (studentData[0].student_fname != undefined && studentData[0].student_fname != null && studentData[0].student_fname != '' && studentData[0].student_fname != 'undefined' && studentData[0].student_fname != 'null') {
        userName = studentData[0].student_fname;
        if (studentData[0].student_lname != undefined && studentData[0].student_lname != null && studentData[0].student_lname != '' && studentData[0].student_lname != 'undefined' && studentData[0].student_lname != 'null') {
            userName += ` ${studentData[0].student_lname}`;
        }
    } else if (studentData[0].student_lname != undefined && studentData[0].student_lname != null && studentData[0].student_lname != '' && studentData[0].student_lname != 'undefined' && studentData[0].student_lname != 'null') {
        userName = studentData[0].student_lname;
    }

    if (userName.includes(null)) {
        userName = '';
    }

    return userName;
}

async function postStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { type, code } = req.body;
        const { version_code: versionCode } = req.headers;
        const studentId = req.user.student_id;
        const returnData = {};
        let stepsData = {};

        const studentData = await Student.getStudentWithLocation(req.user.student_id, db.mysql.read);
        const userName = await getUserName(studentData);
        let userImg = '';
        if (studentData[0].img_url == undefined || studentData[0].img_url == null) {
            userImg = `${config.staticCDN}${data.userDefaultPic}`;
        } else {
            userImg = studentData[0].img_url;
        }

        const imageShow = false;
        // let imageShow = true;
        // if (studentId % 2 === 0) {
        //     imageShow = false;
        // }

        const topbarData = {
            type: 'user_details',
            image: userImg,
            title: `Hey ${userName}`,
            message: data.topMsg('en'),
        };
        // returnData.user_details = topbarData;
        returnData.is_final_submit = false;
        returnData.ask_question = false;
        returnData.ask_button_text = data.askButtonText('en');
        returnData.steps = [];
        returnData.steps.push(topbarData);

        if (type === 'class') {
            const obj = { student_class: code[0] };
            await Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id);
            await Student.deleteUserInRedis(req.user.student_id, db.redis.write);
            await Student.deleteBoardAndExam(req.user.student_id, db.mysql.write);

            // returnData.steps = [];
            let configData = {
                selectedClass: code[0], is_active: false, is_multi_select: false, is_submitted: true,
            };
            if (versionCode >= 727) {
                addImageShow(configData, imageShow);
            }
            returnData.steps.push(await getClassListData(db, configData));

            configData = {};
            configData = {
                is_active: true, is_multi_select: false, is_submitted: false, selectedClass: code[0],
            };
            if (versionCode >= 727) {
                addImageShow(configData, imageShow);
            }
            returnData.steps.push(await getLangListData(db, configData));

            if (code[0] == 6 || code[0] == 7 || code[0] == 8) {
                returnData.ask_question = true;
                returnData.ask_button_text = data.askButtonText('en');
            }

            if (code[0] == 9 || code[0] == 10 || code[0] == 11 || code[0] == 12) {
                stepsData = {};
                stepsData.type = 'board';
                stepsData.title = data.onBoardingBoardHeading('en');
                returnData.steps.push(stepsData);
            }
            if (code[0] == 11 || code[0] == 12 || code[0] == 13 || code[0] == 14) {
                stepsData = {};
                stepsData.type = 'exam';
                stepsData.title = data.onBoardingExamHeading('en');
                returnData.steps.push(stepsData);
            }
        } else if (type === 'language') {
            const obj = { locale: code[0] };
            await Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id);
            await Student.deleteUserInRedis(req.user.student_id, db.redis.write);

            const stu_class = req.user.student_class;
            if (stu_class == 6 || stu_class == 7 || stu_class == 8) {
                returnData.is_final_submit = true;
            } else {
                // returnData.steps = [];
                let configData = {
                    selectedClass: req.user.student_class, is_active: false, is_multi_select: false, is_submitted: true,
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                if (req.user.isDropper) {
                    configData.dropper = 1;
                } else {
                    configData.dropper = 0;
                }
                returnData.steps.push(await getClassListData(db, configData));

                configData = {};
                configData = {
                    selectedLang: code[0], is_active: false, is_multi_select: false, is_submitted: true, selectedClass: req.user.student_class,
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                returnData.steps.push(await getLangListData(db, configData));

                const language = await LanguageContainer.getLanguageByCode(db, code[0]);
                const langText = language[0].language;

                if (req.user.isDropper || stu_class == 14) {
                    configData = {};
                    configData = {
                        langText, is_active: true, is_multi_select: true, is_submitted: false, stu_class, type: 'exam',
                    };
                    if (versionCode >= 727) {
                        addImageShow(configData, imageShow);
                    }
                    if (req.user.isDropper) {
                        configData.stu_class = 13;
                    }
                    returnData.steps.push(await getBoardExamListData(db, configData, obj.locale));
                    returnData.ask_question = true;
                    returnData.ask_button_text = data.askButtonText(obj.locale);
                } else if (stu_class == 9 || stu_class == 10 || stu_class == 11 || stu_class == 12) {
                    configData = {};
                    configData = {
                        langText, is_active: true, is_multi_select: false, is_submitted: false, stu_class, type: 'board',
                    };
                    if (versionCode >= 727) {
                        addImageShow(configData, imageShow);
                    }
                    returnData.steps.push(await getBoardExamListData(db, configData, obj.locale));

                    if (stu_class == 11 || stu_class == 12) {
                        stepsData = {};
                        stepsData.type = 'exam';
                        stepsData.title = data.onBoardingExamHeading(obj.locale);
                        returnData.steps.push(stepsData);
                    } else {
                        returnData.ask_question = true;
                        returnData.ask_button_text = data.askButtonText(obj.locale);
                    }
                }
            }
        } else if (type === 'board') {
            await updateStudentCourseAndExam(db, code, type, req.user.student_id);
            const stu_class = req.user.student_class;
            const { locale } = req.user;
            let langText = 'english';
            if (locale && locale != '' && locale != null) {
                const language = await LanguageContainer.getLanguageByCode(db, locale);
                langText = language[0].language;
            }

            if (stu_class == 9 || stu_class == 10) {
                returnData.is_final_submit = true;
            } else {
                // returnData.steps = [];
                let configData = {
                    selectedClass: req.user.student_class, is_active: false, is_multi_select: false, is_submitted: true,
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                if (req.user.isDropper) {
                    configData.dropper = 1;
                } else {
                    configData.dropper = 0;
                }
                returnData.steps.push(await getClassListData(db, configData));

                configData = {};
                configData = {
                    selectedLang: req.user.locale, is_active: false, is_multi_select: false, is_submitted: true, selectedClass: req.user.student_class,
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                returnData.steps.push(await getLangListData(db, configData));

                configData = {};
                configData = {
                    langText, is_active: false, is_multi_select: false, is_submitted: true, stu_class, type: 'board', selectedBoard: code[0],
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                returnData.steps.push(await getBoardExamListData(db, configData, locale));

                configData = {};
                configData = {
                    langText, is_active: true, is_multi_select: true, is_submitted: false, stu_class, type: 'exam',
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                if (req.user.isDropper) {
                    configData.stu_class = 13;
                }
                returnData.steps.push(await getBoardExamListData(db, configData, locale));
                returnData.ask_question = true;
                returnData.ask_button_text = data.askButtonText(locale);
            }
        } else if (type === 'exam') {
            await updateStudentCourseAndExam(db, code, type, req.user.student_id);
            returnData.is_final_submit = true;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: returnData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getStudentOnboardingResponse(req, type, code, config, studentId, versionCode) {
    const classGrp1 = ['6', '7', '8'];

    const returnData = {};
    let stepsData = {};

    const studentData = await Student.getStudentWithLocation(req.user.student_id, db.mysql.read);
    const userName = await getUserName(studentData);
    let userImg = '';
    if (studentData[0].img_url == undefined || studentData[0].img_url == null) {
        userImg = `${config.staticCDN}${data.userDefaultPic}`;
    } else {
        userImg = studentData[0].img_url;
    }

    const imageShow = false;
    // let imageShow = true;
    // if (studentId % 2 === 0) {
    //     imageShow = false;
    // }

    const topbarData = {
        type: 'user_details',
        image: userImg,
        title: `Hey ${userName}`,
        message: data.topMsg('en'),
    };
    // returnData.user_details = topbarData;
    returnData.is_final_submit = false;
    returnData.ask_question = false;
    returnData.ask_button_text = data.askButtonText('en');
    returnData.steps = [];
    returnData.steps.push(topbarData);

    // if type is selected
    if (type === 'class') {
        // returnData.steps = [];
        const configData = {
            selectedClass: code, is_active: true, is_multi_select: false, is_submitted: false,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getClassListData(db, configData));
        return returnData;
    }

    if (type === 'language') {
        const stu_class = req.user.student_class;
        // returnData.steps = [];
        let configData = {
            selectedClass: stu_class, is_active: false, is_multi_select: false, is_submitted: true,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        if (req.user.isDropper) {
            configData.dropper = 1;
        } else {
            configData.dropper = 0;
        }
        returnData.steps.push(await getClassListData(db, configData));

        configData = {};
        configData = {
            selectedLang: code, is_active: true, is_multi_select: false, is_submitted: false, selectedClass: stu_class,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getLangListData(db, configData));

        if (_.includes(classGrp1, req.user.student_class)) {
            returnData.ask_question = true;
            returnData.ask_button_text = data.askButtonText('en');
        }

        if (!req.user.isDropper && (stu_class == 9 || stu_class == 10 || stu_class == 11 || stu_class == 12)) {
            stepsData = {};
            stepsData.type = 'board';
            stepsData.title = data.onBoardingBoardHeading('en');
            returnData.steps.push(stepsData);
        }
        if (stu_class == 11 || stu_class == 12 || req.user.isDropper || stu_class == 14) {
            stepsData = {};
            stepsData.type = 'exam';
            stepsData.title = data.onBoardingExamHeading('en');
            returnData.steps.push(stepsData);
        }
        return returnData;
    }

    if (type === 'board') {
        const stu_class = req.user.student_class;
        // returnData.steps = [];
        let configData = {
            selectedClass: stu_class, is_active: false, is_multi_select: false, is_submitted: true,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        if (req.user.isDropper) {
            configData.dropper = 1;
        } else {
            configData.dropper = 0;
        }
        returnData.steps.push(await getClassListData(db, configData));

        configData = {};
        configData = {
            selectedLang: req.user.locale, is_active: false, is_multi_select: false, is_submitted: true, selectedClass: stu_class,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getLangListData(db, configData));

        const { locale } = req.user;
        let langText = 'english';
        if (locale && locale != '' && locale != null) {
            const language = await LanguageContainer.getLanguageByCode(db, locale);
            langText = language[0].language;
        }

        configData = {};
        configData = {
            langText, is_active: true, is_multi_select: false, is_submitted: false, stu_class, type: 'board', selectedBoard: code,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getBoardExamListData(db, configData, locale));

        if (stu_class == 9 || stu_class == 10) {
            returnData.ask_question = true;
            returnData.ask_button_text = data.askButtonText(locale);
        }

        if (stu_class == 11 || stu_class == 12) {
            stepsData = {};
            stepsData.type = 'exam';
            stepsData.title = data.onBoardingExamHeading('en');
            returnData.steps.push(stepsData);
        }
        return returnData;
    }

    // if class is not selected
    // Return the class list depending on the language ---> Return the class list in English
    if (!req.user.student_class) {
        // returnData.steps = [];
        const configData = {
            is_active: true, is_multi_select: false, is_submitted: false,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        if (req.user.isDropper) {
            configData.dropper = 1;
        } else {
            configData.dropper = 0;
        }
        returnData.steps.push(await getClassListData(db, configData));
        return returnData;
    }

    // No type is selected and language is not selected
    // return the language list first
    if (!req.user.locale) {
        const stu_class = req.user.student_class;
        // returnData.steps = [];
        let configData = {
            selectedClass: stu_class, is_active: false, is_multi_select: false, is_submitted: true,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        if (req.user.isDropper) {
            configData.dropper = 1;
        } else {
            configData.dropper = 0;
        }
        returnData.steps.push(await getClassListData(db, configData));

        configData = {};
        configData = {
            is_active: true, is_multi_select: false, is_submitted: false, selectedClass: stu_class,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getLangListData(db, configData));

        if (_.includes(classGrp1, req.user.student_class)) {
            returnData.ask_question = true;
            returnData.ask_button_text = data.askButtonText('en');
        }

        if (!req.user.isDropper && (stu_class == 9 || stu_class == 10 || stu_class == 11 || stu_class == 12)) {
            stepsData = {};
            stepsData.type = 'board';
            stepsData.title = data.onBoardingBoardHeading('en');
            returnData.steps.push(stepsData);
        }
        if (stu_class == 11 || stu_class == 12 || req.user.isDropper || stu_class == 14) {
            stepsData = {};
            stepsData.type = 'exam';
            stepsData.title = data.onBoardingExamHeading('en');
            returnData.steps.push(stepsData);
        }
        return returnData;
    }

    // Language is selected
    if (_.includes(classGrp1, req.user.student_class)) {
        returnData.is_final_submit = true;
        returnData.ask_question = false;
        returnData.ask_button_text = data.askButtonText('en');
        return returnData;
    }

    const { locale } = req.user;
    let langText = 'english';
    if (locale && locale != '' && locale != null) {
        const language = await LanguageContainer.getLanguageByCode(db, locale);
        langText = language[0].language;
    }
    let boardFlag = 0;

    if (!req.user.isDropper && (req.user.student_class == 9 || req.user.student_class == 10 || req.user.student_class == 11 || req.user.student_class == 12)) {
        const boardsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'board');
        // If board is selected, return it
        if (boardsData.length > 0 && (req.user.student_class == 11 || req.user.student_class == 12)) {
            boardFlag = 1;
        } else if (boardsData.length > 0 && (req.user.student_class == 9 || req.user.student_class == 10)) {
            returnData.is_final_submit = true;
            returnData.ask_question = false;
            returnData.ask_button_text = data.askButtonText('en');
            return returnData;
        } else {
            const stu_class = req.user.student_class;
            // returnData.steps = [];
            let configData = {
                selectedClass: stu_class, is_active: false, is_multi_select: false, is_submitted: true,
            };
            if (versionCode >= 727) {
                addImageShow(configData, imageShow);
            }
            if (req.user.isDropper) {
                configData.dropper = 1;
            } else {
                configData.dropper = 0;
            }
            returnData.steps.push(await getClassListData(db, configData, locale));

            configData = {};
            configData = {
                selectedLang: req.user.locale, is_active: false, is_multi_select: false, is_submitted: true, selectedClass: stu_class,
            };
            if (versionCode >= 727) {
                addImageShow(configData, imageShow);
            }
            returnData.steps.push(await getLangListData(db, configData));

            configData = {};
            configData = {
                langText, is_active: true, is_multi_select: false, is_submitted: false, stu_class, type: 'board',
            };
            if (versionCode >= 727) {
                addImageShow(configData, imageShow);
            }
            returnData.steps.push(await getBoardExamListData(db, configData, locale));
            if (req.user.student_class == 11 || req.user.student_class == 12) {
                stepsData = {};
                stepsData.type = 'exam';
                stepsData.title = data.onBoardingExamHeading('en');
                returnData.steps.push(stepsData);
            } else if (req.user.student_class == 9 || req.user.student_class == 10) {
                returnData.ask_question = true;
                returnData.ask_button_text = data.askButtonText(locale);
            }
            return returnData;
        }
    }

    if (req.user.isDropper || req.user.student_class == 14 || boardFlag) {
        const examsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'exam');
        // exam is selected, just return it
        if (examsData.length > 0) {
            returnData.is_final_submit = true;
            returnData.ask_question = false;
            returnData.ask_button_text = data.askButtonText('en');
            return returnData;
        }
        // else return the list of exams
        let stu_class = req.user.student_class;
        if (req.user.isDropper) {
            stu_class = 13;
        }
        // returnData.steps = [];
        let configData = {
            selectedClass: stu_class, is_active: false, is_multi_select: false, is_submitted: true,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        if (req.user.isDropper) {
            configData.dropper = 1;
        } else {
            configData.dropper = 0;
        }
        returnData.steps.push(await getClassListData(db, configData, req.user.locale));

        configData = {};
        configData = {
            selectedLang: req.user.locale, is_active: false, is_multi_select: false, is_submitted: true, selectedClass: stu_class,
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getLangListData(db, configData));

        if (boardFlag) {
            const boardsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'board');

            configData = {};
            configData = {
                langText, is_active: false, is_multi_select: false, is_submitted: true, stu_class, type: 'board', selectedBoard: boardsData[0].id,
            };
            if (versionCode >= 727) {
                addImageShow(configData, imageShow);
            }
            returnData.steps.push(await getBoardExamListData(db, configData, locale));
        }
        configData = {};
        configData = {
            langText, is_active: true, is_multi_select: true, is_submitted: false, stu_class, type: 'exam',
        };
        if (versionCode >= 727) {
            addImageShow(configData, imageShow);
        }
        returnData.steps.push(await getBoardExamListData(db, configData, locale));
        returnData.ask_question = true;
        returnData.ask_button_text = data.askButtonText(locale);
        return returnData;
    }
}

async function getStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { type } = req.query;
        const { code } = req.query;
        const studentId = req.user.student_id;
        const { version_code: versionCode } = req.headers;
        const reutrnData = await getStudentOnboardingResponse(req, type, code, config, studentId, versionCode);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: reutrnData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    addPublicUserWeb,
    updateGcm,
    setLanguage,
    setClass,
    login,
    verify,
    browse,
    getProfile,
    updateProfile,
    logout,
    checkUsername,
    tokenRecreate,
    setProfile,
    getProfileNew,
    addReferredUser,
    getReferredUsers,
    postStudentOnboarding,
    getStudentOnboarding,
};
