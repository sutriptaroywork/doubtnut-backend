/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-15 18:11:23
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-07-13T19:57:15+05:30
*/
const validator = require('validator');
const request = require('request');
const crypto = require('crypto');
const axios = require('axios');
const firebase_admin = require('firebase-admin');
const moment = require('moment');
const fs = require('fs');
const _ = require('lodash');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const Student = require('../../../modules/student');
const Chapter = require('../../../modules/chapter');
const Token = require('../../../modules/tokenAuth');
const Utility = require('../../../modules/utility');
const IPUtility = require('../../../modules/Utility.IP');
const PhoneUtility = require('../../../modules/Utility.phone');
const Notification = require('../../../modules/notifications');
const Whatsapp = require('../../../modules/whatsapp');
const Constants = require('../../../modules/constants');
const Course_History = require('../../../modules/course_history');
const data = require('../../../data/data');
const Language = require('../../../modules/language');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const classMysql = require('../../../modules/mysql/class');
const StudentRedis = require('../../../modules/redis/student');
const studentContainer = require('../../../modules/containers/student');
const LanguageContainer = require('../../../modules/containers/language');
const classCourseMapping = require('../../../modules/classCourseMapping');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');

const ClassContainer = require('../../../modules/containers/class');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const StudentsDeviceData = require('../../../modules/studentsDeviceData');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const CourseMysql = require('../../../modules/mysql/coursev2');
const StudentHelper = require('../../helpers/student.helper');

const TokenGenerator = require('../../../modules/token');
const inst = require('../../../modules/axiosInstances');
const LoginHelper = require('../../helpers/login.helper');
const kafka = require('../../../config/kafka');
const kafkaDE = require('../../../config/kafka-de');



const {
    onBoardinglanguageHeading,
    onBoardinglanguageOldHeading,
    onBoardingClassHeading,
    onBoardingClassOldHeading,
    onBoardingBoardHeading,
    onBoardingBoardOldHeading,
    onBoardingExamHeading,
    onBoardingExamOldHeading,
    askButtonText,
} = require('../../../data/data');

let db; let config; let
    client;
// const path = require("path");

// let publicKey = ursa.createPublicKey(fs.readFileSync(path.resolve(__dirname, "../../../encryptKeys/public.pem"),'utf-8'));

// const path = require('path');
require('../../../modules/mongo/comment');
require('../../../modules/mongo/post');

bluebird.promisifyAll(mongoose);

const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');
const JsonToken = require('jsontokens');

// const TokenGenerator = require('token-generator')({
//   salt: 'Its the doubtnut app logging you',
//   timestampMap: 'abcdefghij', // 10 chars array for obfuscation proposes
// });

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
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: null,
                };
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
    const { app_version } = req.body;
    const email = (!_.isNull(req.body.email) && !_.isEmpty(req.body.email)) ? req.body.email : null;
    let is_web;
    let student_id;
    let student_username;
    let new_user = 0;
    let course = 'NCERT';
    if (class1 == 14) {
        course = 'GOVT_EXAM';
    }

    if (validator.isUUID(udid, 4)) {
    // get student
        is_web = 1;
        Student.getStudentByUdid(udid, db.mysql.write).then((student) => {
            // //console.log(student[0]['student_id'])
            if (student.length > 0) {
                // check for gcm_red_id
                // console.log("Testsetset")
                // console.log(student)
                student_id = student[0].student_id;
                student_username = student[0].student_username;
                // if (typeof gcm_reg_id !== 'undefined' && gcm_reg_id) {
                // update it
                return Student.updateStudentByUdid(udid, class1, lang, app_version, gcm_reg_id, email, null, db.mysql.write);
                // } else {

                // return student[0]['student_id']
                // }
            }
            student_username = Utility.generateUsername(1);
            new_user = 1;
            return Student.add(udid, lang, class1, app_version, is_web, gcm_reg_id, student_username, email, null, db.mysql.write);
        }).then((values) => {
            if (typeof values.insertId !== 'undefined' && values.insertId !== 0) {
                student_id = values.insertId;
            }
            // check if entry is in course_browse_history
            Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then((row) => {
                // //console.log("row")
                // //console.log(row)
                if (class1 == 14) {
                    Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, class1, course).then((values) => {
                    }).catch((error) => {
                        // console.log("error")
                        // console.log(error)
                    });
                } else if (row.length === 0) {
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
                    student_username,
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
    const { student_id } = req.body;
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
            Student.deleteUserInRedis(st_id, db.redis.write).then((re) => {

            }).catch((e) => {

            });
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
    const { student_id } = req.body;
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

    if (!PhoneUtility.isValidPhoneNumber(mobile)) {
        const response = PhoneUtility.invalidPhoneNumberResponse();
        return res.status(response.meta.code).json(response);
    }

    // check if IP has hit rate limit
    if (await IPUtility.hasReachedLimit(db.redis, config.OTPLimitPerDay, req.headers['True-Client-IP'] || req.headers['x-forwarded-for'])) {
        const response = IPUtility.maxLimitReached();
        return res.status(response.meta.code).json(response);
    }

    const otp = Utility.generateOtp();
    // //console.log(req.body)

    // console.log('otp')
    // console.log(otp)

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

async function truecallerLogin(req, res, next) {
    try {
        const truecaller_client = require('@vyng/truecaller-node');
        db = req.app.get('db');
        config = req.app.get('config');
        const { udid } = req.body;
        const { gcm_reg_id } = req.body;
        const { language } = req.body;
        const { clevertap_id } = req.body;
        const student_class = req.body.class;
        const { is_optin } = req.body;
        const { app_version } = req.body;
        const branchId = req.body.aaid;
        const aaid = req.body.app_version;
        let flag;
        let flag_params;
        let contact;
        let status = false;
        let country_code;
        let loginDetails;
        let new_user = false;
        const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
        let newUserStudentId;
        if (req.body.status != undefined) {
            status = req.body.status;
        }

        let userConsent = 0;
        if (req.body.user_consent != undefined) {
            userConsent = parseInt(req.body.user_consent);
        }
        const loginManager = new LoginHelper(req);

        const profile = {
            payload: req.body.payload,
            signature: req.body.signature,
            signatureAlgorithm: 'SHA512withRSA',
        };
        const options = {
            url: 'https://api4.truecaller.com/v1/key',
            ttl: 1000 * 60 * 10, // Allow request time to be maximum of 10 minutes in the past. If ttl is 0, no check is done.
            publicKeys: undefined, // Explicitly specifies public keys. Useful in case truecaller changes their fetch.
        };

        let profile_details = {};

        if (req.body.name != undefined) {
            let s_name = req.body.name;
            s_name = s_name.replace(/\s\s+/g, ' ');

            const nameSplit = s_name.split(' ');
            if (nameSplit.length === 1 || nameSplit.length > 3) {
                profile_details.firstName = s_name;
            } else if (nameSplit.length === 2) {
                if (nameSplit[0] === nameSplit[1]) {
                    profile_details.firstName = nameSplit[0];
                    profile_details.lastName = '';
                } else {
                    profile_details.firstName = nameSplit[0];
                    profile_details.lastName = nameSplit[1];
                }
            } else if (nameSplit.length === 3) {
                if (nameSplit[0] === nameSplit[2]) {
                    profile_details.firstName = nameSplit[0];
                } else {
                    profile_details.firstName = nameSplit[0];
                    profile_details.lastName = nameSplit[2];
                }
            }
        } else if (req.body.name == undefined && req.body.phone != undefined) {
            const dataByMobile = await Student.checkStudentExists(req.body.phone, db.mysql.read);
            if (dataByMobile != undefined && dataByMobile.length === 1) {
                profile_details.firstName = dataByMobile[0].student_fname;
                profile_details.lastName = dataByMobile[0].student_lname;
            }
        }

        if (status) {
            const { access_token } = req.body;
            try {
                const truecallerAttemptInfo = { source: loginManager.getSourceByLoginType('TRUECALLER') };
                if (udid !== undefined && !_.isEmpty(udid)) {
                    truecallerAttemptInfo.udid = udid;
                }
                if (StudentHelper.isAltApp(req.headers.package_name)) {
                    truecallerAttemptInfo.package = req.headers.package_name.split('.').slice(2).join('_');
                }
                loginDetails = await Student.insertStudentsLoginInfo(db.mysql.write, truecallerAttemptInfo);
                const profileData = await axios({
                    method: 'GET',
                    url: `https://api4.truecaller.com/v1/otp/installation/phoneNumberDetail/${access_token}`,
                    headers: { appKey: config.appKey },
                    // RCeJm324942a8703c4bab852ff54fa5e95ade
                });
                profile_details.verifiedSignature = status;

                profile_details.phoneNumber = profileData.data.phoneNumber;
                profile_details.countryCode = profileData.data.countryCode;
                const country_code = profileData.data.countryCode;
                const number_formatter = phoneUtil.parseAndKeepRawInput(profile_details.phoneNumber.toString(), country_code);
                const formatter_mobile_number = number_formatter.getNationalNumber().toString();

                const dataByMobile = await Student.checkStudentExists(formatter_mobile_number, db.mysql.read);

                if (dataByMobile != undefined && dataByMobile.length === 1) {
                    profile_details.firstName = dataByMobile[0].student_fname;
                    profile_details.lastName = dataByMobile[0].student_lname;
                }
                // console.log();
            } catch (e) {
                console.log(e);
                profile_details.verifiedSignature = status;
                if (req.body.country_code == '91') {
                    profile_details.countryCode = 'IN';
                    profile_details.phoneNumber = `91${req.body.phone}`;
                } else {
                    profile_details.countryCode = req.body.country_code;
                    profile_details.phoneNumber = req.body.phone;
                }
                // next(profile_details);
                // next(e);
            }
        } else if (!status) {
            const truecallerAttemptInfo = { source: loginManager.getSourceByLoginType('TRUECALLER') };
            if (udid !== undefined && !_.isEmpty(udid)) {
                truecallerAttemptInfo.udid = udid;
            }
            if (StudentHelper.isAltApp(req.headers.package_name)) {
                truecallerAttemptInfo.package = req.headers.package_name.split('.').slice(2).join('_');
            }
            loginDetails = await Student.insertStudentsLoginInfo(db.mysql.write, truecallerAttemptInfo);
            profile_details = await truecaller_client.verifyProfile(profile, options);
        }

        if (profile_details.verifiedSignature) {
            // contact = (profile_details.countryCode === 'IN') ? profile_details.phoneNumber.toString().substring(3) : profile_details.phoneNumber;
            country_code = profile_details.countryCode;
            const number_formatter = phoneUtil.parseAndKeepRawInput(profile_details.phoneNumber.toString(), country_code);
            contact = number_formatter.getNationalNumber().toString();
            if (loginDetails.insertId != undefined && loginDetails.insertId != 0) {
                Student.updateTruecallerLoginSuccessInfo(db.mysql.write, loginDetails.insertId, contact);
            }

            const exists_mobile = await Student.checkStudentExists(contact, db.mysql.write);
            if (exists_mobile.length > 0) {
                const { student_id } = exists_mobile[0];
                const { student_username } = exists_mobile[0];
                // let update_student = await Student.updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, db.mysql.write);
                const update_student = await Student.updateStudentByTruecallerLogin(db.mysql.write, student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, profile_details.firstName, profile_details.lastName);
                if (exists_mobile[0].udid != udid) {
                    StudentsDeviceData.insertStudentDeviceData(db.mysql.write, student_id, contact, udid).then(() => {}).catch(() => {});
                }

                Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                // let del = await Student.deleteUserInRedis(student_id, db.redis.write);
                // RUN FLAG - LOGIC
                flag = 1;
                flag_params = [student_id, student_username];
            } else {
                let exists_udid = [];
                if (req.header('version_code') >= 912) {
                    exists_udid = await Student.getStudentByUdid(udid, db.mysql.write);
                }
                if (exists_udid.length > 0 && exists_udid[0].is_web == 8) {
                    // if(0){
                    const { student_id } = exists_udid[0];
                    const { student_username } = exists_udid[0];
                    // let updated_student = await Student.updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, db.mysql.write);
                    const update_student = await Student.updateStudentByTruecallerLogin(db.mysql.write, student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, profile_details.firstName, profile_details.lastName);
                    Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                    flag = 2;
                    flag_params = [student_id, student_username];
                } else {
                    const params = {};
                    params.mobile = contact;
                    if (udid !== undefined && !_.isEmpty(udid)) {
                        params.udid = udid;
                    }
                    if (gcm_reg_id !== undefined && !_.isEmpty(gcm_reg_id)) {
                        params.gcm_reg_id = gcm_reg_id;
                    }

                    if (language !== undefined && !_.isEmpty(language)) {
                        params.locale = language;
                    }
                    if (clevertap_id !== undefined && !_.isEmpty(clevertap_id)) {
                        params.clevertap_id = clevertap_id;
                    }
                    // else if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
                    //     params.clevertap_id = 'ALT_APP';
                    // }
                    if (student_class !== undefined && !_.isEmpty(student_class)) {
                        params.student_class = student_class;
                    }
                    if (app_version !== undefined && !_.isEmpty(app_version)) {
                        params.app_version = app_version;
                    }
                    if (profile_details.firstName !== null) {
                        params.student_fname = profile_details.firstName;
                    }
                    if (profile_details.lastName !== null) {
                        params.student_lname = profile_details.lastName;
                    }
                    if (country_code !== undefined && !_.isEmpty(country_code)) {
                        params.country_code = country_code;
                    }
                    const student_username = Utility.generateUsername(0).toLowerCase();
                    params.student_username = student_username;

                    // TODO:  alt app changes
                    const inserted = await Student.insertNewUser(db.mysql.write, params);
                    new_user = true;
                    console.log(inserted);

                    const student_id = inserted.insertId;
                    newUserStudentId = student_id;
                    Utility.getNotificationCohort(student_id);
                    StudentHelper.creditWalletUsingCampaignData(db, { student_id, branchId });
                    // RUN LOGIC - FLAG
                    flag = 3;
                    flag_params = [student_id, student_username];
                }
            }

            if (loginDetails.insertId != undefined && loginDetails.insertId != 0) {
                Student.updateLoginVerifyInfo(db.mysql.write, loginDetails.insertId);
            }

            if (is_optin) {
                const exists_wa_optin = await Whatsapp.checkWhatsappOptin(contact, db.mysql.read);
                if (!exists_wa_optin.length > 0) {
                    // const promises = [];
                    if (new_user) {
                        StudentHelper.sendOptinMsg(config, contact, language, newUserStudentId, db);
                    }
                    Whatsapp.insertNum(contact, 10, db.mysql.write);
                    // promises.push(Utility.OptIn(contact, config));
                    // const responses = await Promise.all(promises);
                    // let sendMessage = await Utility.sendWhatsAppMessageHSM(contact, data.whatsapp_login_msg_optin, config);
                }
            }

            const convert_obj = {
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                is_converted: 1,
            };
            // if (StudentHelper.isAltApp(req.headers.package_name)) {
            //     convert_obj.package = req.headers.package_name.split('.').slice(2).join('_');
            // } else {
            //     convert_obj.package = null;
            // }
            Student.convertPreOnboarding(db.mysql.write, udid, convert_obj).then((response) => {

            }).catch((err) => {
                console.log(err);
            });
            // console.log(converted_results);
            if (!_.isEmpty(udid)) {
            // StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udid);
            // NEW LOGIC
                await StudentHelper.trackStudentActiveDeviceIds(db, flag_params[0], udid);
            // let promises = [];
            // promises.push(StudentRedis.getActiveDeviceIds(db.redis.write, flag_params[0]));
            // promises.push(CourseMysql.getDistinctClassWiseCoursesPurchasedByStudent(db.mysql.read, flag_params[0]));
            // let resolvedPromises = await Promise.all(promises);
            // if(_.isNull(resolvedPromises[0])){
            //     StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udid);
            // }else{
            //     let devicesAvailableCounter = resolvedPromises[1][0]['class_count'] > 1 ? resolvedPromises[1][0]['class_count'] : 1;
            //     let currentActiveDevices = resolvedPromises[0].split('#');
            //     if(currentActiveDevices.length < devicesAvailableCounter){
            //         // let udids = currentActiveDevices.push(udid).join('#');
            //         currentActiveDevices.push(udid);
            //         let udids = currentActiveDevices.join('#');
            //         StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udids);
            //     }else{
            //       currentActiveDevices.shift();
            //       currentActiveDevices.push(udid);
            //       let udids = currentActiveDevices.join('#');
            //       StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udids);
            //     }
            // }
            }

            StudentHelper.storeUserConsent(db.mongo, flag_params[0], userConsent);
            if (flag === 1) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Existing',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                        is_new_user: false,
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            } else if (flag == 2) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Existing UUID back',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                        is_new_user: false,
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            } else if (flag == 3) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'New User Inserted',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                        is_new_user: true,
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid User',
                },
                data: null,
                error: 'INVALID',
            };
            console.log('NO ------ USER is not verified');
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function whatsappLogin(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { udid, aaid } = req.body;
    const { gcm_reg_id } = req.body;
    const { language } = req.body;
    const { clevertap_id } = req.body;
    const student_class = req.body.class;
    const accessToken = req.body.access_token;

    const { app_version } = req.body;

    const whatsappVerificationUrl = `https://graph.accountkit.com/v1.0/me/?access_token=${accessToken}`;

    const verification_response = await axios.get(whatsappVerificationUrl);
    if (verification_response.status === 200 && verification_response.statusText === 'OK') {
        const contact = verification_response.data.phone.national_number;
        const exists_mobile = await Student.checkStudentExists(contact, db.mysql.write);
        if (exists_mobile.length > 0) {
            const { student_id } = exists_mobile[0];
            const { student_username } = exists_mobile[0];
            if (exists_mobile[0].udid != udid) {
                StudentsDeviceData.insertStudentDeviceData(db.mysql.write, student_id, contact, udid).then(() => {}).catch(() => {});
            }
            const update_student = await Student.updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, db.mysql.write);
            Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);

            // let del = await Student.deleteUserInRedis(student_id, db.redis.write);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'User Verified Existing',
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
            res.status(responseData.meta.code).json(responseData);
        } else {
            // let exists_udid = await Student.getStudentByUdid(udid, db.mysql.write);
            // if (exists_udid.length > 0) {
            if (0) {
                const { student_id } = exists_udid[0];
                const { student_username } = exists_udid[0];
                const updated_student = await Student.updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, db.mysql.write);
                Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                const del = await Student.deleteUserInRedis(student_id, db.redis.write);

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Previously existed',
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
                res.status(responseData.meta.code).json(responseData);
            } else {
                const insert_obj = {
                    udid,
                    gcm_reg_id,
                    mobile: contact,
                };
                if (typeof student_class !== 'undefined' && student_class) {
                    insert_obj.student_class = student_class;
                }

                if (typeof clevertap_id !== 'undefined' && clevertap_id) {
                    insert_obj.clevertap_id = clevertap_id;
                }
                if (typeof language !== 'undefined' && language) {
                    insert_obj.locale = language;
                }

                if (typeof app_version !== 'undefined' && app_version) {
                    insert_obj.app_version = app_version;
                }

                const student_username = Utility.generateUsername(0).toLowerCase();
                insert_obj.student_username = student_username;
                const inserted = await Student.insertNewUser(db.mysql.write, insert_obj);
                const student_id = inserted.insertId;
                Utility.getNotificationCohort(student_id);
                StudentHelper.creditWalletUsingCampaignData(db, { student_id, aaid });
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'New User Verified Inserting',
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
                res.status(responseData.meta.code).json(responseData);
            }
        }
    // my piece of code here to keep dry principles
    } else {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Invalid User',
            },
            data: null,
            error: 'INVALID',
        };
        console.log('no user is not verified');
        res.status(responseData.meta.code).json(responseData);
    }
}

function verify(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    let contact; let email; let class1; let language; let student_id; let app_version; let student_username; let gcm_reg_id; let udid; let is_web; let course;
    let is_optin;

    const otp_entered_by_user = req.body.otp;
    const { session_id } = req.body;

    is_optin = req.body.is_optin;

    let new_user = 0;
    let check_udid = 0;

    request.get(`https://2factor.in/API/V1/${config.two_fa_key}/SMS/VERIFY/${session_id}/${otp_entered_by_user}`, (error, response, body) => {
        if (!error) {
            // console.log('1')
            const otp = JSON.parse(body);
            if (otp.Status === 'Success') {
                Token.getContact(req.body.session_id, db.redis.read).then((values) =>
                // console.log('2')

                    values).then((result) => {
                    // console.log(result)
                    result = JSON.parse(result);
                    contact = result.contact_number;
                    email = result.email;
                    class1 = result.class;
                    course = result.course;
                    language = result.language;
                    app_version = result.app_version;
                    gcm_reg_id = result.gcm_reg_id;
                    udid = result.udid;
                    udid = result.udid;
                    is_web = result.is_web;
                    student_username = Utility.generateUsername(0).toLowerCase();
                    // console.log("student_username");
                    // console.log(student_username);
                    if (class1 == '14') {
                        course = 'GOVT_EXAM';
                    }
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
                    student_username = value[0].student_username;
                    return Student.updateStudentByMobile(email, contact, class1, language, app_version, gcm_reg_id, udid, is_web, db.mysql.write);
                    // return Student.updateStudentByUdid(udid, class1, language, app_version, gcm_reg_id,email,contact, db.mysql.write)
                })
                    .then((val) => {
                    // console.log('4')
                    // console.log(val)
                        if (check_udid) {
                            if (val.length === 0) {
                                new_user = 1;
                                // TODO : add here
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
                            // Course_History.getStudentDetailsBySid(student_id, db.mysql.read).then(row => {
                            //   //console.log("row")
                            //   //console.log(row)
                            //   if (row.length === 0) {
                            // insert row

                            //   }else{
                            //     if(class1 == "14"){
                            //       //update to class 14
                            //       Course_History.updateCourseById(row[0]['id'], course,  db.mysql.write).then(function (values) {
                            //
                            //       }).catch(error => {
                            //         //console.log("error")
                            //         //console.log(error)
                            //       })
                            //     }
                            //   }
                            // })
                            //  notification start

                            // NOTIFICATION
                            if (new_user) {
                                Utility.getNotificationCohort(student_id);
                                Notification.userSignupNotification(student_id, gcm_reg_id, null, db);
                            }
                        // notification end
                        }
                        Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, class1, course).then((values) => {

                        }).catch((error) => {
                        // console.log("error")
                        // console.log(error)
                        });
                        Student.deleteUserInRedis(student_id, db.redis.write).then((res) => {

                        }).catch((er) => {

                        });

                        if (1) {
                            console.log('i am herer in the optin');
                            // check the contact exists in the whatsapp opt in table
                            Whatsapp.checkWhatsappOptin(contact, db.mysql.read).then((exists_wa_optin) => {
                                console.log('results are still far fetched');
                                console.log(exists_wa_optin);
                                if (!exists_wa_optin.length > 0) {
                                    console.log('i am in if false');
                                    const promises = [];
                                    promises.push(Whatsapp.insertNum(contact, 10, db.mysql.write));
                                    promises.push(Utility.OptIn(contact, config));
                                    Promise.all(promises).then((responses) => {
                                        Utility.sendWhatsAppMessageHSM(contact, data.whatsapp_login_msg_optin, config).then((results) => {
                                            console.log('message is sent');
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
                                        });
                                    }).catch((error) => {

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

                            });
                        }
                    })
                    .then(() => {
                        Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                    })
                    .catch((err) => {
                        next(err);
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

function getProfile(req, res, next) {
    // let winstonInstance = req.app.get('winstonInstance');
    //  winstonInstance.info("test")
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.params;
    Student.getUserProfile(student_id, db.mysql.read).then((result) => {
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
        if (fname !== undefined && !_.isEmpty(fname)) {
            params.student_fname = fname.replace(/\s+/g, ' ').trim().substr(0, 50);
        }
        if (lname !== undefined && !_.isEmpty(lname)) {
            params.student_lname = lname.replace(/\s+/g, ' ').trim().substr(0, 50);
        }
        if (email !== undefined && !_.isEmpty(email)) {
            params.student_email = email;
        } else if (req.body.email !== undefined && !_.isEmpty(req.body.email)) {
            params.student_email = req.body.email;
        }
        // if (image !== undefined) {
        //   params.img_url = image;
        // }
        if (school !== undefined && !_.isEmpty(school)) {
            params.school_name = school;
        }
        if (sclass !== undefined && !_.isEmpty(sclass)) {
            params.student_class = sclass;
        }
        if (locale !== undefined && !_.isEmpty(locale)) {
            params.locale = locale;
        }
        if (student_username !== undefined && !_.isEmpty(student_username) && !Utility.checkValidUsername(student_username)) {
            params.student_username = student_username.replace(/\s+/g, ' ').trim().substr(0, 50);
        }
        if (dob !== undefined && !_.isEmpty(dob)) {
            params.dob = dob;
        }
        if (coaching !== undefined && !_.isEmpty(coaching)) {
            params.coaching = coaching;
        }
        if (pincode !== undefined && !_.isEmpty(pincode)) {
            params.pincode = pincode;
        }
        if (image !== undefined && !_.isEmpty(image)) {
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
                await Course_History.updateCourseByIdNew(resolvedPromises[1][0].id, student_course, sclass, db.mysql.write);
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
        Student.deleteUserInRedis(student_id, db.redis.write).then((re) => {
            // Comment.find({student_id: student_id, is_deleted: false}).then(result => {

            // }).catch(err => {

            // })
            // )
        }).catch((e) => {

        });
        const student_list = [1081201, 1522478, 1527637, 420334, 1378353, 705281, 1378353, 1613968, 1506294, 1656502, 1682680, 1732720];
        const updateQuery = {};
        if (image !== undefined) {
            updateQuery.student_avatar = params.img_url;
        }
        if (student_username !== undefined) {
            updateQuery.student_username = student_username;
        }
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

async function onboard(req, res, next) {
    try {
        db = req.app.get('db');
        const {
            udid, device, network, latitude, longitude,
        } = req.body;

        const params = {}; let result; let
            check;
        if (!_.isEmpty(udid)) {
            params.udid = udid;
        }
        if (!_.isEmpty(device)) {
            params.device = device;
        }
        if (!_.isEmpty(network)) {
            params.network = network;
        }
        if (!_.isEmpty(latitude)) {
            params.latitude = latitude;
        }
        if (!_.isEmpty(longitude)) {
            params.longitude = longitude;
        }

        // check if udid exists
        const data = await Student.checkUdid(udid, db.mysql.write);
        // console.log("data")
        // console.log(data)
        if (data.length > 0) {
            // update
            check = 'update';
            result = await Student.updateOnboard(params, db.mysql.write);
        } else {
            // insert
            check = 'insert';
            result = await Student.insertOnboard(params, db.mysql.write);
        }
        if (result) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: check,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Error in inserting',
                },
                data: null,
                error: result,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in inserting"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function storeContacts(req, res, next) {
    try {
    // ANDROID CLIENT BUG; SENDING 200error code for better error analytics
    // let responseData = {
    //   "meta": {
    //     "code": 200,
    //     "success": true,
    //     "message": "SUCCESS",
    //   },
    //   "data": null
    // }
    // return res.status(responseData.meta.code).json(responseData)
        db = req.app.get('db');
        const { student_id } = req.user;
        const stringKey = 'stringKey';

        const encryptedData = req.body.contacts;
        // console.log(encryptedData)
        const encryptedAESKey = req.body.enKey;
        // console.log(encryptedAESKey)
        const { iv } = req.body;
        /// /console.log(iv);

        // we compute the sha256 of the key
        /*
    let hash = crypto.createHash("sha256");
    hash.update(stringKey, "utf8");
    let sha256key = hash.digest();
    let keyBuffer = new Buffer(sha256key);

    let cipherBuffer =  new Buffer(cipherText, 'hex');
    let aesDec = crypto.createDecipheriv("aes-256-ecb", keyBuffer , ''); // always use createDecipheriv when the key is passed as raw bytes
    let output = aesDec.update(cipherBuffer);
    let outputRes= output + aesDec.final();
    */

        // simulation of client side processing._________________________________________________________________
        // let key = "testing123456789"; //aes key SHOULD be 16 bytes long

        /*
    let data =[
      {
      "name":"khem",
      "emails": ["amit@mindorks.com", "amit.shekhar.iitbhu@gmail.com"],
      "mobileNumbers": [9971596219,9967856473],
      "birthday": "26-09-1994"
      },
      {
      "name":"amitesh",
      "emails": ["", ""],
      "mobileNumbers": [9334567655,9678785676],
      "birthday": "26-10-1998"
      }
      ]
     */

        // let dataBuffer = new Buffer.from(JSON.stringify(data));
        // create buffer from json data as .update takes either string or buffer or a collection
        /// /console.log("DATA BUFFER");
        /// /console.log(dataBuffer);
        // let iv = 'aabbccddeeffgghh'; // create cipher iv
        /// /console.log("THIS IS THE IV IN STRING FORMAT");
        /// /console.log(iv.toString('hex'));
        // let encryptedData = crypto.createCipheriv('aes-128-ctr', key,iv).update(dataBuffer,'utf8','hex');
        /// /console.log('Encrypted Data :');
        /// /console.log(encryptedData);

        // let encryptedAESKey = publicKey.encrypt(key);
        /// /console.log("THE ENCRYPTED KEY BUFFER")
        // //console.log(encryptedAESKey);

        // encryptedAESKey = encryptedAESKey.toString('hex');
        /// /console.log(encryptedAESKey);
        // here AES Key is encrypted using rsa

        //* **********************************************************************************************************
        // let outputRes = await Utility.decryptData(encryptedAESKey,encryptedData,iv);
        //
        // //console.log("**********************************************************************************")
        // //console.log(outputRes.toString('utf8'));
        // //outputRes = JSON.parse(outputRes);
        //
        // outputRes = outputRes.replace(new RegExp("'", "g"), "")
        // //console.log(outputRes)
        // let result =await Student.storeStudentData(student_id,outputRes,"contact",db.mysql.write);
        if (1) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: 'Stored',
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Error in inserting',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function storeAppData(req, res, next) {
    try {
    // let responseData = {
        //   "meta": {
        //     "code": 200,
        //     "success": true,
        //     "message": "SUCCESS",
        //   },
        //   "data": null
        // }
        // return res.status(responseData.meta.code).json(responseData)

        db = req.app.get('db');
        const { student_id } = req.user;
        let userData = {};
        try {
            userData = JSON.parse(req.body.app_list.substring(1, req.body.app_list.length - 1));
        } catch (e) {
            console.log(e);
        }
        if (!_.isEmpty(userData) && userData.installedAppList != undefined && userData.installedAppList.length) {
            const result = Student.storeStudentData(student_id, userData, db.mongo.write);
            console.log(result);
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
                    message: 'Empty app data',
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

async function addGcm(req, res, next) {
    try {
        const { udid } = req.body;

        if (validator.isUUID(udid, 4)) {
            // get student
            db = req.app.get('db');
            const { gcm_reg_id } = req.body;
            const check = await Student.checkIfUdidWeb(udid, db.mysql.read);
            if (check.length > 0) {
                const updatedGcm = await Student.updateGcmRegWeb(db.mysql.write, gcm_reg_id, udid);
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

function handleWhatsappSigninResponse(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const mobile = req.body.phone;
    let whatsapp_login_msg;

    const tokenSigner = JsonToken.TokenSigner;
    const tokenPayload = {
        mobile,
        timestamp: new Date().getTime(),
    };
    const token = new tokenSigner('ES256K', config.whatsapp_private_key).sign(tokenPayload);
    // console.log("token"  + token);
    const myJSONObject = {
        branch_key: config.branch_key,
        channel: 'student_login_whatsapp',
        feature: 'whatsapp_login',
        campaign: 'WHA_SIGN_IN',
        data: {
            access_token: token,
            page: 'WHATSAPP_DEEPLINK',
        },
    };
    request({
        url: 'https://api.branch.io/v1/url',
        method: 'POST',
        json: true, // <--Very important!!!
        body: myJSONObject,
    }, (error, response, body) => {
        if (error) {
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'Error!',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            console.log(body.url);
            Utility.sendWhatsAppMessage(req.body.phone, data.whatsapp_login_msg_one + body.url + data.whatsapp_login_msg_two, config).then((result) => {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'OK',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((error) => {
                const responseData = {
                    meta: {
                        code: 400,
                        success: false,
                        message: 'ERROR',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            });
        }
    });
}

async function handleWhatsappSiginDeeplink(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { udid, aaid } = req.body;
    const { gcm_reg_id } = req.body;
    const { language } = req.body;
    const { clevertap_id } = req.body;
    const student_class = req.body.class;
    const { access_token } = req.body;
    const decoder = JsonToken.decodeToken;
    const { TokenVerifier } = JsonToken;
    const { app_version } = req.body;
    const { is_optin } = req.body;
    let flag;
    let flag_params;
    let contact;
    const rawPublicKey = '03fdd57adec3d438ea237fe46b33ee1e016eda6b585c3e27ea66686c2ea5358479';

    let userConsent = 0;
    if (req.body.user_consent != undefined) {
        userConsent = parseInt(req.body.user_consent);
    }

    const tokenIsValid = new TokenVerifier('ES256K', rawPublicKey).verify(access_token);
    if (tokenIsValid) {
        const data = decoder(access_token);
        contact = data.payload.mobile;
        if (contact.length == 12) {
            contact = contact.substring(2);
        }
        const { timestamp } = data.payload;
        const expired = !(((new Date().getTime() - 15 * 60 * 1000) < timestamp));
        if (!expired) {
            const exists_mobile = await Student.checkStudentExists(contact, db.mysql.read);
            if (exists_mobile.length > 0) {
                const { student_id } = exists_mobile[0];
                const { student_username } = exists_mobile[0];
                const update_student = await Student.updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, db.mysql.write);
                Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                // RUN FLAG CODE ---
                flag = 1;
                flag_params = [student_id, student_username];
                if (exists_mobile[0].udid != udid) {
                    StudentsDeviceData.insertStudentDeviceData(db.mysql.write, student_id, contact, udid).then(() => {}).catch(() => {});
                }
            } else {
                // let exists_udid = await Student.getStudentByUdid(udid, db.mysql.read);
                let exists_udid = [];
                if (req.header('version_code') >= 912) {
                    exists_udid = await Student.getStudentByUdid(udid, db.mysql.read);
                }
                if (exists_udid.length > 0 && exists_udid[0].is_web == 8) {
                    const { student_id } = exists_udid[0];
                    const { student_username } = exists_udid[0];
                    const updated_student = await Student.updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, db.mysql.write);
                    Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                    // RUN FLAG CODE
                    flag = 2;
                    flag_params = [student_id, student_username];
                } else {
                    const insert_obj = {};
                    if (typeof udid !== 'undefined' && udid) {
                        insert_obj.udid = udid;
                    }

                    if (typeof gcm_reg_id !== 'undefined' && gcm_reg_id) {
                        insert_obj.gcm_reg_id = gcm_reg_id;
                    }

                    if (typeof student_class !== 'undefined' && student_class) {
                        insert_obj.student_class = student_class;
                    }

                    if (typeof clevertap_id !== 'undefined' && clevertap_id) {
                        insert_obj.clevertap_id = clevertap_id;
                    }
                    if (typeof language !== 'undefined' && language) {
                        insert_obj.locale = language;
                    }

                    if (typeof app_version !== 'undefined' && app_version) {
                        insert_obj.app_version = app_version;
                    }
                    insert_obj.mobile = contact;

                    const student_username = Utility.generateUsername(0).toLowerCase();
                    insert_obj.student_username = student_username;
                    const inserted = await Student.insertNewUser(db.mysql.write, insert_obj);
                    const student_id = inserted.insertId;
                    Utility.getNotificationCohort(student_id);
                    StudentHelper.creditWalletUsingCampaignData(db, { student_id, aaid });
                    // RUN FLAG CODE
                    flag = 3;
                    flag_params = [student_id, student_username];
                }
            }
            if (is_optin) {
                const exists_wa_optin = await Whatsapp.checkWhatsappOptin(contact, db.mysql.read);
                if (!exists_wa_optin.length > 0) {
                    const promises = [];
                    promises.push(Whatsapp.insertNum(contact, 10, db.mysql.write));
                    promises.push(Utility.OptIn(contact, config));
                    const responses = await Promise.all(promises);
                    // let sendMessage = await Utility.sendWhatsAppMessageHSM(contact, data.whatsapp_login_msg_optin, config);
                }
            }
            const convert_obj = {
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                is_converted: 1,
            };
            // if (StudentHelper.isAltApp(req.headers.package_name)) {
            //     convert_obj.package = req.headers.package_name.split('.').slice(2).join('_');
            // } else {
            //     convert_obj.package = null;
            // }
            Student.convertPreOnboarding(db.mysql.write, udid, convert_obj).then((response) => {

            }).catch((err) => {
                console.log(err);
            });

            if (!_.isEmpty(udid)) {
                StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udid);
            }

            StudentHelper.storeUserConsent(db.mongo, flag_params[0], userConsent);
            const loginManager = new LoginHelper(req);
            loginManager.callVerifyServiceFromNonOtpLogin(contact, 'IN', 'WHATSAPP');
            if (flag === 1) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Existing',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                        is_new_user: false,
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            } else if (flag == 2) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Existing UUID back',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                        is_new_user: false,
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            } else if (flag == 3) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'New User Inserted',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                        is_new_user: true,
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'Expired ',
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
                message: 'Incorrect Credentials',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function handleWhatsappSigninResponse2(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const mobile = req.body.phone;

        const tokenSigner = JsonToken.TokenSigner;
        const tokenPayload = {
            mobile,
            timestamp: new Date().getTime(),
        };
        const token = new tokenSigner('ES256K', config.whatsapp_private_key).sign(tokenPayload);
        console.log(`token${token}`);

        const myJSONObject = {
            branch_key: config.branch_key,
            channel: 'student_login_whatsapp',
            feature: 'whatsapp_login',
            campaign: 'WHA_SIGN_IN',
            data: {
                access_token: token,
                page: 'WHATSAPP_DEEPLINK',
            },
        };
        const axios_config = {
            method: 'POST',
            url: 'https://api.branch.io/v1/url',
            json: true,
            data: myJSONObject,
        };

        const response = await inst.apiBranchInst(axios_config);
        if (typeof response !== undefined) {
            console.log(response.data.url);
            const send_status = await Utility.sendWhatsAppMessage(mobile, data.whatsapp_login_msg_one + response.data.url + data.whatsapp_login_msg_two, 'whatsapp-login-msg', config);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'OK',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'ERROR',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'ERROR',
            },
            data: e,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function preLoginOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { udid } = req.body;
        const { gcm_reg_id } = req.body;
        const { app_version, gaid } = req.body;
        const udid_exists = await Student.getPreLoginOnboardingCheck(db.mysql.write, udid);
        if (udid_exists.length > 0) {
            if (typeof gcm_reg_id !== undefined && gcm_reg_id) {
                const date = new Date();
                const timestamp = date.toISOString().slice(0, 19).replace('T', ' ');
                const update_obj = {
                    updated_at: timestamp,
                };
                update_obj.gcm_reg_id = gcm_reg_id;
                if (udid_exists[0].gcm_reg_id != gcm_reg_id) {
                    // if (StudentHelper.isAltApp(req.headers.package_name)) {
                    //     update_obj.package = req.headers.package_name.split('.').slice(2).join('_');
                    // } else {
                    //     update_obj.package = null;
                    // }
                    await Student.preLoginOnboardingUpdate(db.mysql.write, udid, update_obj);
                }
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'OK',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const insert_obj = {};
            insert_obj.udid = udid;
            insert_obj.gcm_reg_id = gcm_reg_id;
            insert_obj.app_version = app_version;
            insert_obj.is_converted = 0;
            insert_obj.is_back = 10;
            // if (StudentHelper.isAltApp(req.headers.package_name)) {
            //     insert_obj.package = req.headers.package_name.split('.').slice(2).join('_');
            // }
            const insertionDetails = await Student.preLoginOnboardingInsert(db.mysql.write, insert_obj);
            const primaryKey = insertionDetails.insertId;
            kafkaDE.publish(kafkaDE.topics.preLoginOnboarding, 'udid_gcm_gaid', {
                id: primaryKey,
                udid,
                app_version,
                gcm_reg_id,
                gaid,
                is_converted: 0,
                created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
                updated_at: moment().format('YYYY-MM-DD HH:mm:ss'),
            });
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'OK',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}

// ---- firebase -- social -auth -inApp
async function socialAuthLoggedInUsers(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const id_token = req.body.firebase_token;
        const { social_auth_identifier } = req.body;
        const decodedToken = await firebase_admin.auth().verifyIdToken(id_token);
        let isTokenValid = false;
        if (typeof decodedToken.email !== 'undefined') {
            isTokenValid = true;
        }
        if (isTokenValid) {
            const updateObj = {
                student_email: decodedToken.email,
                is_email_verified: 1,
            };
            if (social_auth_identifier == 'facebook') {
                updateObj.email_verification_code = decodedToken.user_id;
            }
            await Student.updateSocialAuthEmailId(db.mysql.write, req.user.student_id, updateObj);
            Student.deleteUserInRedis(req.user.student_id, db.redis.write);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'OK',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid User',
                },
                data: null,
                error: 'INVALID',
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

// --- firebase login ----- //

async function firebaseLogin(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const id_token = req.body.firebase_token;
        const { udid, aaid } = req.body;
        const { gcm_reg_id } = req.body;
        const { language } = req.body;
        const { clevertap_id } = req.body;
        const student_class = req.body.class;
        const region = req.headers.country;
        const cloneAppAdmin = req.app.get('cloneAppAdmin');
        const cloneBiologyNeetAdmin = req.app.get('cloneBiologyNeetAdmin');
        const cloneIITJEEAdmin = req.app.get('cloneIITJEEAdmin');
        // let is_optin = req.body.is_optin;
        const is_optin = false;
        const { country_code } = req.body;
        const { app_version } = req.body;
        const { login_method } = req.body;
        let flag;
        let flag_params;
        let contact;
        let email_id;
        // student_email;
        let primaryIdentifier = 'phone_number';
        let uniqueSocialPlatformUserIdentifier;
        const loginManager = new LoginHelper(req);
        const social_logins = ['google', 'facebook'];
        if (login_method && social_logins.includes(login_method)) {
            primaryIdentifier = 'email_id';
        }

        let userConsent = 0;
        if (req.body.user_consent != undefined) {
            userConsent = parseInt(req.body.user_consent);
        }
        const loginAttemptInfo = { 
            source: loginManager.getSourceByLoginType('FIREBASE'), 
            is_web: 0,
            udid,
            is_login: 1,
        };
        const loginDetails = await Student.insertStudentsLoginInfo(db.mysql.write, loginAttemptInfo);

        const decodedToken = await StudentHelper.getFirebaseAuthDecodedToken(id_token, req.headers, {
            default: firebase_admin,
            brainly_clone: cloneAppAdmin,
            biology_neet_clone: cloneBiologyNeetAdmin,
            maths_iitjee_clone: cloneIITJEEAdmin,
        });

        let isTokenValid = false;
        if (primaryIdentifier == 'phone_number' && typeof decodedToken.phone_number !== 'undefined') {
            isTokenValid = true;
        }
        if (primaryIdentifier == 'email_id' && typeof decodedToken.email !== 'undefined') {
            isTokenValid = true;
        }

        let isStudentFromAltApp = false;
        if (StudentHelper.isAltApp(req.headers.package_name)) {
            isStudentFromAltApp = true;
        }

        if (isTokenValid) {
            let row_exists;
            if (primaryIdentifier == 'email_id') {
                email_id = decodedToken.email;
                if (login_method == 'facebook') {
                    uniqueSocialPlatformUserIdentifier = decodedToken.user_id;
                }
                row_exists = await Student.checkStudentByEmail(db.mysql.read, email_id, Utility.isUsRegion(region), 1);
            } else {
                contact = decodedToken.phone_number;
                const slice_upto = (country_code.length) + 1;
                contact = contact.slice(slice_upto);
                row_exists = await Student.checkInternationalStudentExists(contact, country_code, db.mysql.write, 1);
            }
            if (row_exists.length > 0) {
                const { student_id } = row_exists[0];
                const { student_username } = row_exists[0];
                if (isStudentFromAltApp) {
                    const obj = {
                        student_id,
                        gcm_reg_id,
                        udid,
                        gaid: aaid,
                        package_name: req.headers.package_name,
                    };
                    Student.updateAltAppLoginStudent(db.mysql.write, obj);
                } else {
                    await Student.updateStudentByFirebaseLogin(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, email_id, country_code, db.mysql.write);
                }
                if (row_exists[0].udid != udid) {
                    StudentsDeviceData.insertStudentDeviceData(db.mysql.write, student_id, contact, udid).then(() => {}).catch(() => {});
                }
                flag = 1;
                flag_params = [student_id, student_username];
                Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
            } else {
                let exists_udid = [];
                if (req.header('version_code') >= 912 && !_.isEmpty(udid)) {
                    exists_udid = await Student.getStudentByUdid(udid, db.mysql.write, 1);
                }
                if (exists_udid.length > 0 && exists_udid[0].is_web == 8) {
                    const { student_id } = exists_udid[0];
                    const { student_username } = exists_udid[0];
                    Student.updateStudentByFirebaseLogin(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, email_id, country_code, db.mysql.write);

                    Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                    flag = 2;
                    flag_params = [student_id, student_username];
                    Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                } else {
                    const params = {};
                    if (primaryIdentifier == 'email_id') {
                        params.student_email = email_id;
                    } else {
                        params.mobile = contact;
                    }
                    if (udid !== undefined && !_.isEmpty(udid)) {
                        params.udid = udid;
                    }
                    if (gcm_reg_id !== undefined && !_.isEmpty(gcm_reg_id)) {
                        params.gcm_reg_id = gcm_reg_id;
                    }
                    if (language !== undefined && !_.isEmpty(language)) {
                        params.locale = language;
                    } else if (Utility.isUsRegion(region)) {
                        params.locale = 'en';
                    }
                    if (clevertap_id !== undefined && !_.isEmpty(clevertap_id)) {
                        params.clevertap_id = clevertap_id;
                    } else if (Utility.isUsRegion(region)) {
                        params.clevertap_id = `${region}_APP`;
                    } else if (Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers)) {
                        params.clevertap_id = 'ALT_APP';
                    } else if (Utility.isDnBiologyNeetCloneAppRequestOrigin(req.headers)) {
                        params.clevertap_id = 'BIOLOGY_NEET_APP';
                    } else if (Utility.isDnIITJEECloneAppRequestOrigin(req.headers)) {
                        params.clevertap_id = 'MATHS_IITJEE_APP';
                    }
                    if (student_class !== undefined && !_.isEmpty(student_class)) {
                        params.student_class = student_class;
                    } else if (Utility.isUsRegion(region)) {
                        params.student_class = 27;
                    }
                    if (app_version !== undefined && !_.isEmpty(app_version)) {
                        params.app_version = app_version;
                    }
                    if (country_code !== undefined && !_.isEmpty(country_code)) {
                        params.country_code = country_code;
                    }

                    if (uniqueSocialPlatformUserIdentifier !== undefined && !_.isEmpty(uniqueSocialPlatformUserIdentifier)) {
                        params.email_verification_code = uniqueSocialPlatformUserIdentifier;
                    }

                    const student_username = Utility.generateUsername(0).toLowerCase();
                    params.student_username = student_username;
                    console.log(params);
                    // TODO:  alt app changes
                    const inserted = await Student.insertNewUser(db.mysql.write, params);
                    const student_id = inserted.insertId;
                    // adding student data to alt app
                    if (isStudentFromAltApp) {
                        const obj = {
                            student_id,
                            gcm_reg_id,
                            udid,
                            gaid: aaid,
                            package_name: req.headers.package_name,
                        };
                        Student.updateAltAppLoginStudent(db.mysql.write, obj);
                    }
                    Utility.getNotificationCohort(student_id);
                    StudentHelper.creditWalletUsingCampaignData(db, { student_id, aaid });
                    flag = 3;
                    flag_params = [student_id, student_username];
                }
            }

            if (is_optin && !Utility.isUsRegion(region)) {
                const exists_wa_optin = await Whatsapp.checkWhatsappOptin(contact, db.mysql.read, 1);
                if (!exists_wa_optin.length > 0) {
                    const promises = [];
                    promises.push(Whatsapp.insertNum(contact, 10, db.mysql.write));
                    promises.push(Utility.OptIn(contact, config));
                    const responses = await Promise.all(promises);
                    // let sendMessage = await Utility.sendWhatsAppMessageHSM(contact, data.whatsapp_login_msg_optin, config);
                }
            }

            const convert_obj = {
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                is_converted: 1,
            };
            // if (StudentHelper.isAltApp(req.headers.package_name)) {
            //     convert_obj.package = req.headers.package_name.split('.').slice(2).join('_');
            // } else {
            //     convert_obj.package = null;
            // }
            Student.convertPreOnboarding(db.mysql.write, udid, convert_obj).then((response) => {

            }).catch((err) => {
                console.log(err);
            });
            // console.log(converted_results);
            if (!_.isEmpty(udid)) {
                // StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udid);
                await StudentHelper.trackStudentActiveDeviceIds(db, flag_params[0], udid);
                //  let promises = [];
                //  promises.push(StudentRedis.getActiveDeviceIds(db.redis.write, flag_params[0]));
                //  promises.push(CourseMysql.getDistinctClassWiseCoursesPurchasedByStudent(db.mysql.read, flag_params[0]));
                //  let resolvedPromises = await Promise.all(promises);
                //  if(_.isNull(resolvedPromises[0])){
                //     StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udid);
                //  }else{
                //      let devicesAvailableCounter = resolvedPromises[1]['class_count'].length > 1 ? resolvedPromises[1]['class_count'] : 1;
                //      let currentActiveDevices = resolvedPromises[0].split('#');
                //      if(currentActiveDevices.length < devicesAvailableCounter){
                //         currentActiveDevices.push(udid);
                //         let udids = currentActiveDevices.join('#');
                //         StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udids);
                //      }else{
                //         currentActiveDevices.shift();
                //         currentActiveDevices.push(udid);
                //         let udids = currentActiveDevices.join('#');
                //         StudentRedis.setActiveDeviceIds(db.redis.write, flag_params[0], udids);
                //      }
                //  }
            }

            StudentHelper.storeUserConsent(db.mongo, flag_params[0], userConsent);
            if ([1, 2, 3].includes(flag)) {
                if (loginDetails.insertId) {
                    Student.updateLoginVerifyInfo(db.mysql.write, loginDetails.insertId);
                }
            }
            if (flag === 1) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Existing',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            } else if (flag == 2) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified Existing UUID back',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            } else if (flag == 3) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'New User Inserted',
                    },
                    data: {
                        student_id: flag_params[0],
                        token: Token.create(flag_params[0], config),
                        onboarding_video: Constants.getBlobIntro(),
                        intro: Constants.getBlobIntroObject(),
                        student_username: flag_params[1],
                    },
                };
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: flag_params[0] }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
            }
        /**
         * UAE Paywall
         * await StudentHelper.doubtnutPayWallSegmentation({ db, student_id: flag_params[0], req });
         */
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid User',
                },
                data: null,
                error: 'INVALID',
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        if (typeof e.code !== undefined && e.code == 'auth/argument-error') {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Please Login again via OTP',
                },
                data: null,
                error: 'TOKEN EXPIRED / INVALID TOKEN',
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            next(e);
        }
    }
}

async function getStudentOnboardingResponse(req, type, code) {
    const data = { steps: [] };
    const classGrp1 = ['6', '7', '8'];

    const version = 3;

    // if type is selected
    if (type === 'class') {
        const result = await ClassContainer.getClassListNewOnBoarding(db, 'english');
        let temp = result.shift();
        result.push(temp);
        temp = result.shift();
        result.splice(2, 0, temp);
        data.list = result;

        data.type = 'class';
        if (version === 3) {
            data.title = `${onBoardingClassHeading('en')}\n${onBoardingClassHeading('hi')}`;
        } else {
            data.title = onBoardingClassOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.progress_bar = false;
        data.ask_button_text = askButtonText('en');
        data.list = data.list.map((a) => {
            if (a.code == code) {
                a.is_active = 1;
            }
            return a;
        });
        return data;
    }

    if (type === 'language') {
        const stu_class = req.user.student_class;
        let obj = {};
        const classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, 'english', stu_class);
        obj.type = 'class';
        obj.title = classData[0].title;
        obj.code = classData[0].code;
        if (req.user.isDropper) {
            obj.title = 'Dropper/ Repeat Year';
            obj.code = 13;
        }
        obj.is_active = 1;
        data.steps.push(obj);

        obj = {};
        obj.type = 'language';
        obj.is_active = 1;
        data.steps.push(obj);
        data.progress_bar = false;

        if (stu_class == 10 || stu_class == 9) {
            obj = {};
            obj.type = 'board';
            obj.is_active = 0;
            data.steps.push(obj);
            data.progress_bar = true;
        } else if (req.user.isDropper || stu_class == 14) {
            obj = {};
            obj.type = 'exam';
            obj.is_active = 0;
            data.steps.push(obj);
            data.progress_bar = true;
        } else if (stu_class == 11 || stu_class == 12) {
            obj = {};
            obj.type = 'board';
            obj.is_active = 0;
            data.steps.push(obj);

            obj = {};
            obj.type = 'exam';
            obj.is_active = 0;
            data.steps.push(obj);
            data.progress_bar = true;
        }

        data.list = await Language.getListNewOnBoarding(db.mysql.read);
        data.type = 'language';
        if (version === 3) {
            data.title = onBoardinglanguageHeading;
        } else {
            data.title = onBoardinglanguageOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.ask_button_text = askButtonText('en');
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

        const langText = language[0].language;

        const classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, language[0].language, req.user.student_class);
        obj.type = 'class';
        obj.title = classData[0].title;
        obj.code = classData[0].code;
        obj.is_active = 1;
        data.steps.push(obj);

        obj = {};
        obj.type = 'language';
        obj.title = language[0].language_display;
        obj.code = language[0].code;
        obj.is_active = 1;
        data.steps.push(obj);

        obj = {};
        obj.type = 'board';
        obj.is_active = 1;
        data.steps.push(obj);

        obj = {};
        obj.type = 'exam';
        obj.is_active = 0;
        data.steps.push(obj);

        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'board', langText);
            data.ask_button_text = askButtonText(req.user.locale);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'board');
            data.ask_button_text = askButtonText(req.user.locale);
        }
        data.type = 'board';
        if (version === 3) {
            data.title = onBoardingBoardHeading(language[0].code);
        } else {
            data.title = onBoardingBoardOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.progress_bar = true;
        data.list = data.list.map((a) => {
            if (a.code == code) {
                a.is_active = 1;
            }
            return a;
        });
        return data;
    }

    let obj = {};
    // if class is not selected
    // Return the class list depending on the language ---> Return the class list in English
    if (!req.user.student_class) {
        const result = await ClassContainer.getClassListNewOnBoarding(db, 'english');
        let temp = result.shift();
        result.push(temp);
        temp = result.shift();
        result.splice(2, 0, temp);
        data.list = result;
        data.type = 'class';
        if (version === 3) {
            data.title = `${onBoardingClassHeading('en')}\n${onBoardingClassHeading('hi')}`;
        } else {
            data.title = onBoardingClassOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.progress_bar = false;
        data.ask_button_text = askButtonText('en');
        return data;
    }
    const classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, 'english', req.user.student_class);
    // if (!_.includes(classGrp1, req.user.student_class)) {
    obj = {};
    obj.type = 'class';
    obj.title = classData[0].title;
    obj.code = classData[0].code;
    if (req.user.isDropper) {
        obj.title = 'Dropper/ Repeat Year';
        obj.code = 13;
    }
    obj.is_active = 1;
    data.steps.push(obj);
    // }

    // No type is selected and language is not selected
    // return the language list first
    if (!req.user.locale) {
        const stu_class = req.user.student_class;
        // if (!_.includes(classGrp1, req.user.student_class)) {
        obj = {};
        obj.type = 'language';
        obj.is_active = 1;
        data.steps.push(obj);
        // }
        data.progress_bar = false;

        if (stu_class == 10 || stu_class == 11 || stu_class == 12) {
            obj = {};
            obj.type = 'board';
            obj.is_active = 0;
            data.steps.push(obj);

            obj = {};
            obj.type = 'exam';
            obj.is_active = 0;
            data.steps.push(obj);
            data.progress_bar = true;
        }

        if (stu_class == 13 || stu_class == 14 || req.user.isDropper) {
            obj = {};
            obj.type = 'exam';
            obj.is_active = 0;
            data.steps.push(obj);
            data.progress_bar = true;
        }

        data.list = await Language.getListNewOnBoarding(db.mysql.read);
        data.type = 'language';
        if (version === 3) {
            data.title = onBoardinglanguageHeading;
        } else {
            data.title = onBoardinglanguageOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.ask_button_text = askButtonText('en');
        return data;
    }

    const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
    obj = {};
    obj.type = 'language';
    obj.title = language[0].language_display;
    obj.code = language[0].code;
    obj.is_active = 1;
    data.steps.push(obj);

    const langText = language[0].language;

    // Language is selected
    if (_.includes(classGrp1, req.user.student_class)) {
        data.ask_question = false;
        data.is_multi_select = false;
        data.progress_bar = true;
        data.ask_button_text = askButtonText('en');
        return data;
    }

    // class 10 handled
    if (req.user.student_class == 10 || req.user.student_class == 9) {
        const boardsData = await ClassCourseMappingContainer.getStudentsExamsBoardsData(db, req.user.student_id, 'board');
        // If board is selected, return it
        if (boardsData.length) {
            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = false;
            data.is_multi_select = false;
            data.progress_bar = true;
            return data;
        }
        // Else get boards list
        obj = {};
        obj.type = 'board';
        obj.is_active = 1;
        data.steps.push(obj);

        if (version == 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'board', langText);
        } else {
            console.log('here 2');
            data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'board');
        }
        data.type = 'board';
        if (version == 3) {
            data.title = onBoardingBoardHeading(language[0].code);
            data.ask_button_text = askButtonText(language[0].code);
        } else {
            data.title = onBoardingBoardOldHeading;
            data.ask_button_text = askButtonText(language[0].code);
        }
        data.ask_question = false;
        data.is_multi_select = false;
        data.progress_bar = true;
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
            data.ask_question = false;
            data.is_multi_select = true;
            data.progress_bar = true;
            data.ask_button_text = askButtonText('en');
            return data;
        }
        // else return the list of exams
        obj = {};
        obj.type = 'exam';
        obj.is_active = 1;
        data.steps.push(obj);

        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, stClass, 'exam', langText);
            data.ask_button_text = askButtonText(req.user.locale);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, stClass, 'exam');
            data.ask_button_text = askButtonText(req.user.locale);
        }
        data.type = 'exam';
        if (version === 3) {
            onBoardingExamHeading(language[0].code);
        } else {
            data.title = onBoardingExamOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = true;
        data.progress_bar = true;
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
            data.ask_question = false;
            data.is_multi_select = true;
            data.progress_bar = true;
            return data;
        }
        // if exam is not selected, return the exams list
        obj = {};
        obj.type = 'board';
        obj.title = boardsData[0].course;
        obj.code = boardsData[0].id;
        obj.is_active = 1;
        data.steps.push(obj);

        obj = {};
        obj.type = 'exam';
        obj.is_active = 1;
        data.steps.push(obj);

        if (version === 3) {
            data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'exam', langText);
            data.ask_button_text = askButtonText(req.user.locale);
        } else {
            data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'exam');
            data.ask_button_text = askButtonText(req.user.locale);
        }
        data.type = 'exam';
        if (version === 3) {
            onBoardingExamHeading(language[0].code);
        } else {
            data.title = onBoardingExamOldHeading;
        }
        data.ask_question = false;
        data.is_multi_select = true;
        data.progress_bar = true;
        return data;
    }
    // if boards is not selected, return the boards list.
    obj = {};
    obj.type = 'board';
    obj.is_active = 1;
    data.steps.push(obj);

    obj = {};
    obj.type = 'exam';
    obj.is_active = 0;
    data.steps.push(obj);

    if (version === 3) {
        data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'board', langText);
        data.ask_button_text = askButtonText(req.user.locale);
    } else {
        data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'board');
        data.ask_button_text = askButtonText(req.user.locale);
    }
    data.type = 'board';
    if (version === 3) {
        data.title = onBoardingBoardHeading(language[0].code);
    } else {
        data.title = onBoardingBoardOldHeading;
    }
    data.ask_question = false;
    data.is_multi_select = false;
    data.progress_bar = true;
    return data;
}

async function getStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        const { type } = req.query;
        const { code } = req.query;
        const data = await getStudentOnboardingResponse(req, type, code);
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

async function postStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        const { type, code, title } = req.body;
        const studentId = req.user.student_id;
        const data = {};
        data.steps = [];

        const version = 3;

        if (type === 'class') {
            let obj = { student_class: code[0] };
            await Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id);
            await Student.deleteUserInRedis(req.user.student_id, db.redis.write);
            obj = {};

            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = false;
            data.is_multi_select = false;
            data.progress_bar = false;

            obj.type = type;
            obj.title = title[0];
            obj.code = code[0];
            obj.is_active = 1;
            data.steps.push(obj);

            obj = {};
            obj.type = 'language';
            obj.is_active = 1;
            data.steps.push(obj);

            if (code[0] == 10 || code[0] == 9) {
                obj = {};
                obj.type = 'board';
                obj.is_active = 0;
                data.steps.push(obj);
                data.progress_bar = true;
            } else if (code[0] == 11 || code[0] == 12) {
                obj = {};
                obj.type = 'board';
                obj.is_active = 0;
                data.steps.push(obj);

                obj = {};
                obj.type = 'exam';
                obj.is_active = 0;
                data.steps.push(obj);
                data.progress_bar = true;
            } else if (code[0] == 13 || code[0] == 14) {
                obj = {};
                obj.type = 'exam';
                obj.is_active = 0;
                data.steps.push(obj);
                data.progress_bar = true;
            }

            data.list = await Language.getListNewOnBoarding(db.mysql.read);
            data.type = 'language';
            if (version === 3) {
                data.title = onBoardinglanguageHeading;
            } else {
                data.title = onBoardinglanguageOldHeading;
            }
            data.ask_button_text = askButtonText('en');
        }

        if (type === 'language') {
            let obj = { locale: code[0] };
            await Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id);
            await Student.deleteUserInRedis(req.user.student_id, db.redis.write);

            let stu_class = req.user.student_class;

            const language = await LanguageContainer.getLanguageByCode(db, code[0]);

            const langText = language[0].language;

            const classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, 'english', req.user.student_class);

            data.list = [];
            data.type = '';
            data.title = '';
            data.ask_question = false;
            data.is_multi_select = false;
            data.progress_bar = false;

            if (req.user.isDropper || stu_class == 14) {
                obj = {};
                obj.type = 'class';
                obj.title = classData[0].title;
                obj.code = classData[0].code;
                if (req.user.isDropper) {
                    obj.title = 'Dropper/ Repeat Year';
                    obj.code = 13;
                    stu_class = 13;
                }
                obj.is_active = 1;
                data.steps.push(obj);

                obj = {};
                obj.type = type;
                obj.title = title[0];
                obj.code = code[0];
                obj.is_active = 1;
                data.steps.push(obj);

                data.type = 'exam';

                if (version === 3) {
                    data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, stu_class, 'exam', langText);
                    data.ask_button_text = askButtonText(obj.locale);
                } else {
                    data.list = await studentContainer.getExamsBoardsDetails(db, stu_class, 'exam');
                    data.ask_button_text = askButtonText(obj.locale);
                }

                if (version === 3) {
                    data.title = onBoardingExamHeading(obj.locale);
                } else {
                    data.title = onBoardingExamOldHeading;
                }

                obj = {};
                obj.type = 'exam';
                obj.is_active = 1;
                data.steps.push(obj);

                data.ask_question = false;
                data.is_multi_select = true;
                data.progress_bar = true;
            } else if (stu_class == 11 || stu_class == 12 || stu_class == 10 || stu_class == 9) {
                obj = {};
                obj.type = 'class';
                obj.title = classData[0].title;
                obj.code = classData[0].code;
                obj.is_active = 1;
                data.steps.push(obj);

                obj = {};
                obj.type = type;
                obj.title = title[0];
                obj.code = code[0];
                obj.is_active = 1;
                data.steps.push(obj);

                obj = {};
                obj.type = 'board';
                obj.is_active = 1;
                data.steps.push(obj);

                data.type = 'board';

                if (version === 3) {
                    data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, stu_class, 'board', langText);
                    data.ask_button_text = askButtonText(obj.locale);
                } else {
                    data.list = await studentContainer.getExamsBoardsDetails(db, stu_class, 'board');
                    data.ask_button_text = askButtonText(obj.locale);
                }

                if (version === 3) {
                    data.title = onBoardingBoardHeading(obj.locale);
                } else {
                    data.title = onBoardingBoardOldHeading;
                }

                if (stu_class == 11 || stu_class == 12) {
                    obj = {};
                    obj.type = 'exam';
                    obj.is_active = 0;
                    data.steps.push(obj);
                }

                data.ask_question = false;
                data.is_multi_select = false;
                data.progress_bar = true;
            }
        }

        if (type === 'board') {
            await updateStudentCourseAndExam(db, code, type, req.user.student_id);
            let obj = {};
            const language = await LanguageContainer.getLanguageByCode(db, req.user.locale);
            const langText = language[0].language;

            const classData = await classMysql.getClassDetailsByClassCode(db.mysql.read, 'english', req.user.student_class);
            obj.type = 'class';
            obj.title = classData[0].title;
            obj.code = classData[0].code;
            obj.is_active = 1;
            data.steps.push(obj);

            obj = {};
            obj.type = 'language';
            obj.title = language[0].language_display;
            obj.code = language[0].code;
            obj.is_active = 1;
            data.steps.push(obj);

            if (req.user.student_class == 11 || req.user.student_class == 12) {
                obj = {};
                obj.type = type;
                obj.title = title[0];
                obj.code = code[0];
                obj.is_active = 1;
                data.steps.push(obj);

                obj = {};
                obj.type = 'exam';
                obj.is_active = 1;
                data.steps.push(obj);

                if (version === 3) {
                    data.list = await studentContainer.getExamsBoardsDetailsLocalised(db, req.user.student_class, 'exam', langText);
                    data.ask_button_text = askButtonText(req.user.locale);
                } else {
                    data.list = await studentContainer.getExamsBoardsDetails(db, req.user.student_class, 'exam');
                    data.ask_button_text = askButtonText(req.user.locale);
                }
                data.type = 'exam';
                if (version === 3) {
                    data.title = onBoardingExamHeading(language[0].code);
                } else {
                    data.title = onBoardingExamOldHeading;
                }
                data.ask_question = false;
                data.is_multi_select = true;
                data.progress_bar = true;
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
    const sId = req.user.student_id;
    try {
        const data = {};
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
            21: true,
            22: true,
            23: true,
            24: true,
            25: true,
            26: true,
            27: true,
        };

        console.log('req.user.student_class && req.user.locale ::: ', req.user.student_class, req.user.locale);

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
            if (req.user.student_class == 10) {
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
        }

        if (!classGrp[req.user.student_class]) {
            const obj = { student_class: null, locale: null };
            await Promise.all([
                Student.updateStudentDetails(db.mysql.write, obj, req.user.student_id),
                Student.deleteUserInRedis(req.user.student_id, db.redis.write),
            ]);
        }

        if (req.headers.country && req.headers.country.toLowerCase() == 'US') {
            data.isOnboardingCompleted = true;
            if (_.isEmpty(req.user.student_class)) {
                data.student_class.name = '12';
                data.student_class.display = 'Grade 12';
                data.student_class.code = 27;
            }
            if (_.isEmpty(req.user.student_language)) {
                data.student_language.name = 'en';
                data.student_language.display = 'English';
                data.student_language.code = 'en';
            }
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

async function facebookDataDelete(req, res, next) {
    function base64decode(encodedData) {
        let temp = encodedData;
        while (temp.length % 4 !== 0) {
            temp += '=';
        }
        temp = temp.replace(/-/g, '+').replace(/_/g, '/');
        return new Buffer(temp, 'base64').toString('utf-8');
    }

    function parseSignedRequest(signedRequest, secret) {
        const [encodedSignature, payload] = signedRequest.split('.', 2);
        const decodeData = JSON.parse(base64decode(payload));
        if (!decodeData.algorithm || decodeData.algorithm.toUpperCase() != 'HMAC-SHA256') {
            throw Error(`Unknown algorithm: ${decodeData.algorithm}. Expected HMAC-SHA256`);
        }
        const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('base64').replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace('=', '');
        if (encodedSignature !== expectedSignature) {
            throw Error(`Invalid signature: ${encodedSignature}. Expected ${expectedSignature}`);
        }
        return decodeData;
    // Expected Json Structure:
    // {
    //   user_id: '100268352045872',
    //   algorithm: 'HMAC-SHA256',
    //   issued_at: 1610622931
    // }
    }

    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const secret = config.firebase.facebook_app_key;
        const parsedData = parseSignedRequest(req.body.signed_request, secret);
        const studentDetails = await Student.getStudentWithFacebookUserID(parsedData.user_id, db.mysql.read);
        let code;
        if (studentDetails.length) {
            const deleteUserObj = {
                gcm_reg_id: '',
                student_email: `${studentDetails[0].student_email}_US_DEL`,
            };
            code = Math.random().toString().slice(2, Math.floor(Math.random() * (12 - 8 + 1) + 8));
            await Student.deleteFacebookUser(studentDetails[0].student_id, deleteUserObj, db.mysql.write);
            // Store Request
            const sql = 'INSERT INTO facebook_delete_request SET ?';
            const deleteRequest = {
                student_id: studentDetails[0].student_id,
                email: studentDetails[0].student_email,
                fb_user_id: parsedData.user_id,
                confirmation_code: code,
            };
            await db.mysql.write.query(sql, deleteRequest);
        }
        const responseData = {
            url: 'https://www.doubtnut.app/delete-status',
            confirmation_code: code,
        };
        res.json(responseData);
    } catch (e) {
        next(e);
    }
}

async function facebookDataDeleteStatus(req, res, next) {
    let responseData = {};
    try {
        db = req.app.get('db');
        const { email } = req.query;
        const confirmationCode = req.query.code;
        const sql = 'SELECT * FROM facebook_delete_request where email = ? AND confirmation_code = ? order by id desc';
        const status = await db.mysql.write.query(sql, [email, confirmationCode]);
        if (status.length) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    msg: 'SUCCESS',
                },
                data: {
                    message: 'Your Data has been Successfully Deleted.',
                    datails: status[0],
                },
            };
        } else {
            responseData = {
                meta: {
                    code: 400,
                    success: false,
                    msg: 'Invalid Email or Confirmation Code',
                },
                data: {
                    message: 'Invalid Email or Confirmation Code. Please Re-check your credentials',
                },
            };
        }

        return res.status(responseData.meta.code).json(responseData);
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
    addReferredUser,
    getReferredUsers,
    truecallerLogin,
    whatsappLogin,
    onboard,
    storeContacts,
    storeAppData,
    addGcm,
    handleWhatsappSigninResponse,
    handleWhatsappSigninResponse2,
    handleWhatsappSiginDeeplink,
    preLoginOnboarding,
    firebaseLogin,
    getStudentOnboarding,
    postStudentOnboarding,
    getOnboardingStatus,
    facebookDataDelete,
    facebookDataDeleteStatus,
    socialAuthLoggedInUsers,
};
