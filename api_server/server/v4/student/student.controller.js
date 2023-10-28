const validator = require('validator');
const moment = require('moment');
const fs = require('fs');
const _ = require('lodash');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const truecaller_client = require('@vyng/truecaller-node');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const GooglePhoneUtility = require('google-libphonenumber');
const Student = require('../../../modules/student');
const Chapter = require('../../../modules/chapter');
const Token = require('../../../modules/tokenAuth');
const Utility = require('../../../modules/utility');
const PhoneUtility = require('../../../modules/Utility.phone');
const IPUtility = require('../../../modules/Utility.IP');
const Notification = require('../../../modules/notifications');
const Constants = require('../../../modules/constants');
const Course_History = require('../../../modules/course_history');
const AppConfigContainer = require('../../../modules/containers/appConfig');
const Whatsapp = require('../../../modules/whatsapp');
const logger = require('../../../config/winston').winstonLogger;
const OtpFactory = require('../../helpers/otpfactory/otpfactoryservices.helper');
const StudentsDeviceData = require('../../../modules/studentsDeviceData');
const data = require('../../../data/data');
const ClassContainer = require('../../../modules/containers/class');
const Language = require('../../../modules/language');
const studentContainer = require('../../../modules/containers/student');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const ClassCourseMapping = require('../../../modules/classCourseMapping');
const VideoView = require('../../../modules/containers/videoView');
const StudentMySQL = require('../../../modules/mysql/student');
const StudentRedis = require('../../../modules/redis/student');
const TokenGenerator = require('../../../modules/token');
const WalletUtil = require('../../../modules/wallet/Utility.wallet');
const StudentMongo = require('../../../modules/mongo/student');
const StudentHelper = require('../../helpers/student.helper');
const GuestUserLoginTrackSchema = require('../../../modules/mongo/guestUserLoginTrack');
const GuestLoginData = require('../../../data/data.guestLogin');
const LoginHelper = require('../../helpers/login.helper');
const LoginData = require('../../../data/data.login');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');

let db; let config; let sqs;
const LanguageContainer = require('../../../modules/containers/language');
require('../../../modules/mongo/comment');

bluebird.promisifyAll(mongoose);

const Comment = mongoose.model('Comment');
const Post = mongoose.model('Post');

// async function isFirstReferral(student_id) {
//     return (await Student.countUserReferrals(db.mysql.read, student_id))[0].count == 1;
// }

function addReferredUser(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    sqs = req.app.get('sqs');

    const { student_id } = req.user;
    const { referred_id } = req.body;

    let { version_code } = req.headers;
    if (!version_code) {
        version_code = 602;
    }

    let gcm_reg_id;
    let versionCode;
    let locale;
    let mobile;
    const self = res;
    if (referred_id != student_id) {
        Student.getGcmByStudentId(referred_id, db.mysql.read).then((value) => {
            // console.log(value);
            gcm_reg_id = value[0].gcm_reg_id;
            versionCode = value[0].is_online;
            locale = value[0].locale;
            mobile = value[0].mobile;
            return gcm_reg_id;
        }).then(() => Student.addReferredUser(student_id, referred_id, db.mysql.write)).then(async () => {
            // check if user is VIP
            if (versionCode >= 812) {
                // add to wallet and send notification
                const walletCreditStatus = await WalletUtil.makeWalletTransaction({
                    student_id: referred_id,
                    reward_amount: 100,
                    type: 'CREDIT',
                    payment_info_id: 'dedsorupiyadega',
                    reason: 'add_wallet_credit_referral_install',
                    expiry: null,
                });
                if (walletCreditStatus && walletCreditStatus.meta.message == 'SUCCESS') {
                    const notification_data = {
                        event: 'wallet',
                        title: global.t8[locale].t('Mubarak ho ₹100 jeetne ke liye 💯 '),
                        message: global.t8[locale].t('Aapke dost Doubtnut se jud chuke hain 😃'),
                        image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/refer_a_friend.webp',
                        data: JSON.stringify({ random: '1' }),
                        s_n_id: 'add_wallet_credit_referral_install',
                        firebase_eventtag: 'add_wallet_credit_referral_install',
                    };
                    Utility.sendFcm(referred_id, gcm_reg_id, notification_data, '', null, db);
                    Utility.sendWhatsAppHSMToReferral(config, { mobile, message: 'Dear Student, Congrats for winning INR 100 in your DN wallet!\nYour friends have joined Doubtnut through the whatsapp link shared by you 😃!  https://doubtnut.app.link/remUks4nPeb' });
                    // Utility.sendSMSToReferral(config, { mobile, message: locale == 'hi' ? 'प्रिय छात्र,\n मुबारक हो! अपने Doubtnut वॉलेट में ₹100 जीतने के लिए 💯 \n आपके दोस्त आपके भेजे हुए WhatsApp लिंक से Doubtnut के साथ जुड़ चुके हैं 😃  https://doubtnut.app.link/remUks4nPeb' : 'Dear Student,\n Congrats for winning INR 100 in your DN wallet! \n Your friends have joined Doubtnut through the whatsapp link shared by you 😃! https://doubtnut.app.link/T8SXFozpPeb' });
                    // Utility.sendSMSToReferral(config, { mobile, message: locale == 'hi' ? 'प्रिय छात्र,\n मुबारक हो! अपने Doubtnut वॉलेट में ₹100 जीतने के लिए 💯 \n आपके दोस्त आपके भेजे हुए WhatsApp लिंक से Doubtnut के साथ जुड़ चुके हैं 😃  https://doubtnut.app.link/remUks4nPeb' : 'Dear Student,\n Congrats for winning INR 100 in your DN wallet! \n Your friends have joined Doubtnut through the whatsapp link shared by you 😃! https://doubtnut.app.link/T8SXFozpPeb' });
                }
            }

            /*
              if (version_code >= 638) {
                  const promiseAsync = [];
                  promiseAsync.push(Package.getStudentHasHadPackage(db.mysql.read, student_id));
                  promiseAsync.push(Package.getStudentHasHadPackage(db.mysql.read, referred_id));
                  const usersOnSubscription = await Promise.all(promiseAsync);
                  // for the student who referred
                  // if no entry is present then he was not on VIP
                  if (_.isEmpty(usersOnSubscription[1])) {
                      PackageContainer.createSubscriptionEntryForStudentId(db.mysql.write, referred_id, true);
                  }
                  // if entry is present check if its his first referral, if yes, make it VIP for 30 days
                  else if (await isFirstReferral(referred_id)) {
                      PackageContainer.extendSubscriptionEntryForStudentId(db.mysql.write, usersOnSubscription[1][0], true, true);
                  }
                  // if entry is present check if its his first referral, if yes, make it VIP for X days (data from backend)
                  else {
                      PackageContainer.extendSubscriptionEntryForStudentId(db.mysql.write, usersOnSubscription[1][0], true, false);
                  }
                  // for the student who joined via referral
                  PackageContainer.createSubscriptionEntryForStudentIdJoinedViaReferral(db.mysql.write, student_id);
              }
            */
        })
            // .then(() => Notification.userInviteNotification(referred_id, gcm_reg_id, null, db))
            .then(() => {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: null,
                };
                Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                    action: 'INVITE',
                    user_id: referred_id,
                    refer_id: req.user.student_id,
                });

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

function returnResponse(studentId) {
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },

        data: {
            student_id: studentId,
            token: Token.create(studentId, config),
        },
    };
    return responseData;
}

function getStudentObj(studentUserName, phone, source) {
    const obj = {
        mobile: phone,
        is_web: 2,
        student_username: studentUserName,
        source,
        class1: '20',
    };
    if (source == 'LOGIN') {
        obj.is_web = 0;
    }

    return obj;
}

async function addPublicUserWhatsapp(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { phone, source } = req.body;
        // const { source } = req.body;
        let studentId; let
            newUser = 0;
        const student = await Student.checkStudentExists(phone, db.mysql.read);
        if (student.length) {
            console.log('student----->>>', student);
            studentId = student[0].student_id;
            console.log('----student id \n----->', studentId);
            console.log('--fingerprintsssss------->', student[0].fingerprints);
            const whaStudent = await Student.getWhaStudentInfo(db.mysql.read, studentId);
            console.log('whatsapp_students\n');
            console.log('whatsapp_students', whaStudent[0]);
            if (whaStudent.length) {
                console.log('Student exists in whatsapp_students table');
                // if (channel === 'netcore') {
                //     if (whaStudent[0].channel !== 'netcore') {
                //         const params = {
                //             channel,
                //         };
                //         console.log('Update the whatsapp_students');
                //         await Student.updateWhaStudent(db.mysql.write, params, studentId);
                //     }
                // }
            } else {
                console.log('adding new student');
                const params = {};
                params.mobile = phone;
                params.student_id = studentId;
                params.fingerprints = source;
                await Student.addWhaStudent(db.mysql.write, params);
            }

            if (student[0].fingerprints == null) {
                console.log('sourceeee', source);
                await Student.updateSource(studentId, source, db.mysql.write);
                console.log('Sss', student);
                const responseData = returnResponse(studentId);
                return res.status(responseData.meta.code).json(responseData);
            }
            const responseData = returnResponse(studentId);
            return res.status(responseData.meta.code).json(responseData);
        }
        console.log('not present in whatsapp_students or students');
        newUser = 1;
        const studentUserName = Utility.generateUsername(1);
        const student_details = getStudentObj(studentUserName, phone, source);
        console.log('student_detailssss', student_details);
        const studentAdded = await Student.addUser(student_details, db.mysql.write);
        // const studentAdded = await Student.addUser({
        //     mobile: phone,
        //     is_web: 2,
        //     student_username: studentUserName,
        //     source,
        //     class1: '20',
        // }, db.mysql.write);
        if (newUser === 1) {
            if (typeof studentAdded !== 'undefined' && studentAdded !== 0) {
                studentId = studentAdded.insertId;
            }
        } else {
            studentId = studentAdded[0].student_id;
        }
        const params = {};
        params.mobile = phone;
        params.student_id = studentId;
        params.fingerprints = source;
        await Student.addWhaStudent(db.mysql.write, params);
        const responseData = returnResponse(studentId);
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
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
                udid,
                language: lang,
                class1,
                app_version,
                is_web,
                gcm_reg_id,
                student_username,
                student_email: email,
                mobile: null,
                clevertap_id,
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
                    Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, class1, course).then(() => {

                    }).catch(() => {
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
            Student.deleteUserInRedis(student_id, db.redis.write).then(() => {

            }).catch(() => {

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
        Student.setLang(lang, st_id, db.mysql.write).then(() => {
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
        Student.setClass(student_class, is_dropped, student_id, db.mysql.write).then(() => {
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
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let { phone_number: mobile } = req.body;
        const { email } = req.body;
        const loginMethod = req.body.login_method || 'mobile';
        const class1 = req.body.class;
        const { language } = req.body;
        const { app_version: appVersion } = req.body;
        const { gcm_reg_id: gcmRegId } = req.body;
        let { course } = req.body;
        const { clevertap_id: clevertapId } = req.body;
        let { is_web: isWeb } = req.body;
        const region = req.headers.country || 'IN';
        const { version_code: versionCode } = req.headers;
        let otp = '';

        const loginManager = new LoginHelper(req);

        if (typeof course === 'undefined') {
            course = class1 === '14' ? 'GOVT_EXAM' : 'NCERT';
        }

        const { udid } = req.body;
        if (typeof isWeb === 'undefined') {
            if (validator.isUUID(udid, 4)) {
                isWeb = 1;
            } else if (udid.length === 16) {
                isWeb = 0;
            } else {
                isWeb = 0;
            }
        }

        const sendFrom = 'service';
        const { testingNumbers } = LoginData;

        if (Utility.isUsRegion(region)) {
            if (loginMethod === 'mobile') {
                const phoneUtil = GooglePhoneUtility.PhoneNumberUtil.getInstance();
                const numberFormatter = phoneUtil.parseAndKeepRawInput(mobile.toString(), region);
                mobile = numberFormatter.getNationalNumber().toString();
            }
        } else {
            mobile = mobile.slice(-10);
        }

        if (!testingNumbers.includes(mobile)) {
            if (loginMethod === 'mobile') {
                if (!PhoneUtility.isValidNumberByCountry(mobile, region)) {
                    return res.status(LoginData.responses.invalidPhoneNumber.meta.code).json(LoginData.responses.invalidPhoneNumber);
                }
            }
            // check if IP has hit rate limit
            if (await IPUtility.hasReachedLimit(db.redis, config.OTPLimitPerDay, req.headers['True-Client-IP'] || req.headers['x-forwarded-for'])) {
                return res.status(LoginData.responses.maxLimitReached.meta.code).json(LoginData.responses.maxLimitReached);
            }

            if (await IPUtility.hasReachedLimit(db.redis, config.OTPLimitMobileNo, mobile)) {
                return res.status(LoginData.responses.maxLimitReached.meta.code).json(LoginData.responses.maxLimitReached);
            }
        } else if (mobile === '4567887653') {
            otp = '1234';
        } else {
            otp = '1257';
        }

        // checking if user data exists in students_login
        let isOldActiveUser = false;
        if (versionCode >= 993) {
            isOldActiveUser = await loginManager.isOldActiveFreeUser(mobile, region);
            if (isOldActiveUser) {
                const loginWithoutOtpCount = await StudentRedis.getLoginWithoutOtpCount(db.redis.read, mobile, udid);
                if (!loginWithoutOtpCount || loginWithoutOtpCount % 4 === 0) {
                    isOldActiveUser = false;
                }
            }
        }

        const source = isOldActiveUser ? loginManager.getSourceByLoginType('WITHOUT-OTP') : loginManager.getSourceByLoginType('OTP');
        // insert phone number in students_login
        const studentLoginDetails = {
            mobile,
            udid,
            source,
            is_web: isWeb,
        };
        if (StudentHelper.isAltApp(req.headers.package_name)) {
            studentLoginDetails.package = req.headers.package_name.split('.').slice(2).join('_');
        }
        const loginDetails = await Student.insertStudentsLoginInfo(db.mysql.write, studentLoginDetails);

        const sessionId = uuidv4();
        const params = {
            phone: mobile,
            email,
            class: class1,
            course,
            language,
            app_version: appVersion,
            gcm_reg_id: gcmRegId,
            udid,
            is_web: isWeb,
            clevertap_id: clevertapId,
            retryDelay: 20,
            sendFrom,
            region,
        };

        if (loginMethod === 'email_id') {
            params.sendByMail = true;
            params.retryDelay = 600;
        }

        if (Utility.isUsRegion(region) && loginMethod === 'mobile') {
            params.retryDelay = 120;
        }

        let sessionID = sessionId;
        let response = {};
        if (!testingNumbers.includes(mobile) && !isOldActiveUser) {
            let otpResendCount = 0;
            do {
                response = await OtpFactory.otpServices(params);
                otpResendCount++;
                params.serviceStartIndex += 1;
            }
            while (!response && otpResendCount <= 3);

            // const errorRate = await Student.getErrorRate(db.mysql.read);
            // if (errorRate.length > 10 || !response) {
            //     const serviceList = await Student.getOtpServiceOrder(db.mysql.read);
            //     const serviceNames = serviceList.map((x) => x.name);
            //     const tempService = serviceNames[0];
            //     serviceNames.shift();
            //     serviceNames.push(tempService);

            //     const promiseOtp = [];
            //     for (let i = 0; i < 3; i++) {
            //         promiseOtp.push(Student.updateOtpServiceOrder(db.mysql.write, { priority: i + 1 }, serviceNames[i]));
            //     }
            //     Promise.all(promiseOtp);
            // }

            if (!response) {
                if (loginMethod === 'email_id') {
                    return res.status(LoginData.responses.maxLimitReached.meta.code).json(LoginData.responses.maxLimitReached);
                }
                // throw new Error('Unable to generate OTP');
                const error = 'error from service';
                Student.addOtpRecord({
                    mobile,
                    otp,
                    session_id: sessionId,
                    service_type: error,
                    status: 'ERROR',
                    err_msg: 'Unable to generate OTP',
                    is_web: isWeb,
                }, db.mysql.write);
                return next({ message: 'Unable to generate OTP', status: 500, isPublic: true });
            }

            if (!_.isEmpty(response.sessionId)) {
                sessionID = response.sessionId;
            }
        } else {
            response.Status = 'Success';
            response.service_type = '2FA';
        }

        const promise = [];
        if (testingNumbers.includes(mobile)) {
            const redisStoreData = {
                session_id: sessionID,
                otp,
                email,
                class: class1,
                course,
                language,
                app_version: appVersion,
                gcm_reg_id: gcmRegId,
                udid,
                is_web: isWeb,
                clevertap_id: clevertapId,
                service_type: response.service,
            };
            promise.push(Token.setOtpByContact(mobile, redisStoreData, db.redis.write));
            promise.push(Token.setContactBySessionId(redisStoreData.session_id, mobile, db.redis.write));
        }
        if (isOldActiveUser) {
            sessionID = `${mobile}:`.concat(sessionID);
        }

        if (loginDetails.insertId) {
            promise.push(Student.updateLoginStatus(db.mysql.write, loginDetails.insertId, sessionID));
        }

        await Promise.all(promise);

        let pinExists = false;
        const getUserPin = await StudentMySQL.getPin(db.mysql.read, mobile);
        if (getUserPin.length > 0) {
            pinExists = true;
        }

        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Otp is sent, Please verify',
            },
            data: {
                status: 'Success',
                session_id: sessionID,
                pin_exists: pinExists,
                otp_over_call: true,
                expires_in: config.OTPRetryDelay[loginMethod],
            },
        };
        // db.mongo.write.collection('otp-login-verify-logs').insertOne({
        //     session_id: sessionID,
        //     mobile,
        //     version_code: versionCode,
        //     timestamp: moment().add(5, 'h').add(30, 'm').toISOString(),
        //     verify_attempts: [],
        // });
        if (isOldActiveUser) {
            responseData1.data.call_without_otp = true;
        }
        return res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
        console.log(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'login', source: 'login', error: errorLog });
        console.log(e);
        next(e);
    }
}

function getISTTime() {
    const currentTime = new Date();
    const currentOffset = currentTime.getTimezoneOffset();
    const ISTOffset = 330; // IST offset UTC +5:30
    return new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000).toJSON().slice(0, 19).replace('T', ' ');
}

async function increaseWrongOTPCount(database, sessionId) {
    await StudentRedis.updateWrongOTPCount(database.redis.write, 60 * 5, sessionId); // 5 minutes
    return true;
}

async function verify(req, res, next) {
    db = req.app.get('db');
    let status = 'PENDING';
    let mobile;
    let sessionId;
    let params = {};
    const updateTime = getISTTime();
    const loginManager = new LoginHelper(req);
    try {
        config = req.app.get('config');
        sessionId = req.body.session_id;
        const { otp: otpEnteredByUser, aaid } = req.body;
        const { region, version_code: versionCode } = req.headers;
        let email; let class1; let language; let studentId; let appVersion; let studentUsername; let gcmRegId; let udid; let isWeb; let clevertapId;
        let newUser = false;
        let checkUdid = 0;
        const { isOption } = req.body;
        const webLogin = typeof req.body.web_login !== 'undefined' ? req.body.web_login : false;
        const testingNumbers = ['4567887654'];
        const { call_without_otp: callWithoutOtp } = req.body;
        let userConsent = 0;
        if (req.body.user_consent !== undefined) {
            userConsent = parseInt(req.body.user_consent);
        }

        let contact;
        if (sessionId.includes(':')) {
            contact = sessionId.split(':')[0];
            params = {
                sessionId,
                otp_entered_by_user: parseInt(otpEnteredByUser),
                sentFrom: 'service',
                region,
                channel: 'OTP',
                alreadyVerified: false,
            };
        } else {
            contact = await Token.getContactBySessionId(sessionId, db.redis.read);
            params = {
                db: db.mysql.read,
                db_redis: db.redis.read,
                two_fa_key: config.two_fa_key,
                msg_91_key: config.MSG91_AUTH_KEY,
                session_id: sessionId,
                otp_entered_by_user: otpEnteredByUser,
                sentFrom: 'backend',
                region,
            };
        }
        mobile = contact;

        // const otp_source_truth = await Utility.getOtpDetails(mobile);
        // db.mongo.write.collection('otp-login-verify-logs').updateOne({
        //     session_id: sessionId,
        // }, {
        //     $push: {
        //         verify_attempts: {
        //             $each: [
        //                 {
        //                     otp_entered: otpEnteredByUser,
        //                     actual_otp_details: otp_source_truth,
        //                     call_without_otp: callWithoutOtp,
        //                     timestamp: moment().add(5, 'h').add(30, 'm').toISOString(),
        //                     issue: otp_source_truth === '' ? 'expired' : (!_.isEmpty(otp_source_truth) && typeof otp_source_truth.otp !== 'undefined' && otp_source_truth.otp != otpEnteredByUser ? 'WRONG OTP' : 'SUCCESS'),
        //                 },
        //             ],
        //         },
        //     },
        // });

        const { pin_inserted: pinInserted } = req.body;

        // if user is old user then we will login directly
        if (!pinInserted) {
            const loginWithoutOtpCount = await StudentRedis.getLoginWithoutOtpCount(db.redis.read, mobile, req.body.udid);
            if (!loginWithoutOtpCount) {
                StudentRedis.setLoginWithoutOtpCount(db.redis.write, mobile, req.body.udid, 1);
            } else if (loginWithoutOtpCount % 4 === 0) {
                StudentRedis.setLoginWithoutOtpCount(db.redis.write, mobile, req.body.udid, 1);
            } else {
                StudentRedis.incrementLoginWithoutOtpCount(db.redis.write, mobile, req.body.udid);
            }

            if (callWithoutOtp) {
                const studentData = await Student.checkStudentExistsGlobal(contact, Utility.isUsRegion(region), db.mysql.write, 1);
                if (!_.isEmpty(studentData)) {
                    const obj = {
                        studentId: studentData[0].student_id,
                        new_user: !(studentData.length > 0),
                        student_data_for_alt_app: {},
                        student_username: studentData[0].student_username,
                    };
                    Student.updateVerifiedStatus(db.mysql.write, sessionId);
                    loginManager.updatingUserLanguage(studentData, true);

                    const responseData = loginManager.userVerifiedResponse(obj);
                    res.set('dn-x-auth-token', TokenGenerator.sign({ id: obj.studentId }, config.jwt_secret_new));
                    res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: obj.studentId }, config.jwt_secret_refresh, true));
                    return res.status(responseData.meta.code).json(responseData);
                }
            }
        }

        if (pinInserted !== undefined && pinInserted) {
            const { pin } = req.body;
            udid = req.body.udid;
            let userData;
            let obj = {};
            if (Utility.isInputEmailId(mobile)) {
                userData = await StudentMySQL.getAllStudentsByEmailId(mobile, db.mysql.read, Utility.isUsRegion(region), 1);
            } else {
                userData = await StudentMySQL.getAllStudentsByPhoneGlobally(mobile, Utility.isUsRegion(region), db.mysql.read, 1);
            }
            let userDataExists = false;
            if (userData && userData.length > 0) {
                userDataExists = true;
                obj = {
                    student_id: userData[0].student_id,
                    mobile: userData[0].mobile,
                    gaid: userData[0].gaid,
                    gcm_id: userData[0].gcm_reg_id,
                    pin,
                    udid: userData[0].udid,
                };
            }
            const redisData = await StudentRedis.getPinBlockedUserRedisData(db.redis.read, mobile);
            if (redisData) {
                const responseData = loginManager.userBlockedPinLogin(obj, userData, userDataExists);
                return res.status(responseData.meta.code).json(responseData);
            }

            const checkUserPin = await StudentMySQL.checkPin(db.mysql.read, mobile, Utility.isUsRegion(region));
            if (checkUserPin.length !== 1) {
                const responseData = loginManager.pinNotExists(obj, userDataExists);
                return res.status(responseData.meta.code).json(responseData);
            }

            if (checkUserPin.length === 1 && checkUserPin[0].pin != pin) {
                const responseData = await loginManager.pinMismatched(obj, userData, userDataExists, mobile);
                return res.status(responseData.meta.code).json(responseData);
            }
            if (userDataExists) {
                obj.status_details = 'Logged In';
                obj.status = 'Success';
                StudentMySQL.storePinMetrics(db.mysql.write, obj);
            }

            // update student choosen language on starting
            loginManager.updatingUserLanguage(userData, userDataExists);
            loginManager.callVerifyServiceFromNonOtpLogin(sessionId, region, 'PIN');
        } else {
            let rpResp = {};
            // verify session id and otp
            const wrongOTPCount = await StudentRedis.getWrongOTPCount(db.redis.read, sessionId);
            if (wrongOTPCount >= Constants.getWrongOTPMaxLimit()) {
                const response = loginManager.makingUserBlockedResponse();
                return res.status(response.meta.code).json(response);
            }
            if (!testingNumbers.includes(mobile)) {
                try {
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

                    const response = loginManager.makingWrongOtpResponse();
                    return res.status(response.meta.code).json(response);
                }
                if (!rpResp || rpResp.code === 500) {
                    if (params.sentFrom === 'backend') {
                        status = 'INVALID';
                        Student.updateOtpRecord({
                            status,
                            updated_time: updateTime,
                        }, mobile, sessionId, db.mysql.write);
                    }
                    return next({ message: 'Unable to verify OTP', status: 403, isPublic: true });
                }
            } else {
                rpResp.Status = 'Success';
                StudentRedis.delWrongOTPCount(db.redis.write, sessionId);
            }

            if (params.sentFrom === 'service') {
                class1 = rpResp.class1;
                language = rpResp.language;
                appVersion = rpResp.app_version;
                gcmRegId = rpResp.gcm_reg_id;
                udid = rpResp.udid;
                isWeb = rpResp.is_web;
                clevertapId = rpResp.clevertap_id;
                studentUsername = Utility.generateUsername(0).toLowerCase();
            } else if (rpResp.Status === 'Success') {
                if (_.isNull(contact)) {
                    // session id expired
                    status = 'EXPIRED';
                    Student.updateOtpRecord({
                        status,
                        updated_time: updateTime,
                    }, mobile, sessionId, db.mysql.write);
                    return next({ message: 'Session id expired', status: 403, isPublic: true });
                }
                // get details by mobile
                let tokenResp = await Token.getOtpByContact(contact, db.redis.read);
                if (_.isNull(tokenResp)) {
                    // otp expired
                    status = 'EXPIRED';
                    Student.updateOtpRecord({
                        status,
                        updated_time: updateTime,
                    }, mobile, sessionId, db.mysql.write);
                    return next({ message: 'OTP expired', status: 403, isPublic: true });
                }
                tokenResp = JSON.parse(tokenResp);
                email = tokenResp.email;
                class1 = tokenResp.class;
                language = tokenResp.language;
                appVersion = tokenResp.app_version;
                gcmRegId = tokenResp.gcm_reg_id;
                udid = tokenResp.udid;
                isWeb = tokenResp.is_web;
                clevertapId = tokenResp.clevertap_id;
                studentUsername = Utility.generateUsername(0).toLowerCase();
                udid = tokenResp.udid;

                if (!webLogin && !testingNumbers.includes(mobile)) {
                    if (!udid.length || !((await Student.checkUdid(udid, db.mysql.read, 1)).length)) {
                        status = 'UDID NOT FOUND';
                        Student.updateOtpRecord({
                            status,
                            updated_time: updateTime,
                        }, mobile, sessionId, db.mysql.write);
                        return next({ message: 'OTP verification failed.', status: 403, isPublic: true });
                    }
                }
            } else {
                if (params.sentFrom === 'backend') {
                    status = 'API ERROR';
                    Student.updateOtpRecord({
                        status,
                        updated_time: updateTime,
                    }, mobile, sessionId, db.mysql.write);
                }
                return next({ message: 'Kuch Problem Hai 🙁 Please Try Again', status: 403, isPublic: true });
            }
        }
        Student.checkStudentExistsGlobal(contact, Utility.isUsRegion(region), db.mysql.write, 1).then((value) => {
            if (value.length === 0) {
                checkUdid = 1;
                if ((webLogin && req.body.udid) || versionCode >= 912) {
                    return Student.getStudentByUdid(req.body.udid, db.mysql.write, 1);
                }
                // return Student.getStudentByUdid(udid, db.mysql.write);
                return [];
            }
            studentId = value[0].student_id;
            studentUsername = value[0].student_username;
            if (webLogin && mobile) {
                const webUdid = req.body.udid;
                VideoView.getStudentId(webUdid, db).then((webStudentArray) => {
                    if (webStudentArray.length === 1) {
                        const webStudentId = webStudentArray[0].student_id;
                        Student.insertWebStudentMapping(db.mysql.write, {
                            mobile, web_student_id: webStudentId, app_student_id: studentId,
                        }).then(() => { }).catch(() => { });
                    }
                }).catch(() => { });
            }
            if (value[0].udid != udid) {
                StudentsDeviceData.insertStudentDeviceData(db.mysql.write, studentId, contact, udid).then(() => { }).catch(() => { });
            }
            return Student.updateStudentByMobileLatest({
                email,
                contact,
                class1,
                language,
                app_version: appVersion,
                gcm_reg_id: gcmRegId,
                // udid,
                is_web: isWeb,
                clevertap_id: clevertapId,
                region,
            }, db.mysql.write);
        }).then((val) => {
            if (checkUdid) {
                if (val.length === 0 || (val.length > 0 && val[0].is_web !== 8)) {
                    newUser = true;
                    // TODO : add here
                    return Student.addByMobileUpdated({
                        phone_number: contact,
                        email,
                        class1,
                        language,
                        app_version: appVersion,
                        gcm_reg_id: gcmRegId,
                        student_username: studentUsername,
                        udid,
                        is_web: isWeb,
                        clevertap_id: clevertapId,
                        region,
                        updated_at: moment().add(5, 'h').add(30, 'minute').toISOString(),
                        // is_alt_app: Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers),
                    }, db.mysql.write);
                }
                if (val.length > 0 && val[0].fingerprints === GuestLoginData.config.students_table_fingerprint_val) {
                    db.mongo.write.collection(GuestLoginData.guest_login_timestamp_tracking_collection).updateOne({
                        student_id: val[0].student_id,
                    },
                        {
                            $set: {
                                login_completion_timestamp: new Date(moment().add(5, 'h').add(30, 'm').toISOString()),
                            },
                        });
                }
                studentId = val[0].student_id;
                return Student.updateStudentByUdid(req.body.udid, class1, language, appVersion, gcmRegId, email, contact, db.mysql.write);
            }
            return val;
        }).then(async (val2) => {
            const studentDataForAltAppTable = {
                student_id: studentId,
                gcm_reg_id: gcmRegId,
                udid,
                gaid: aaid,
                package_name: req.headers.package_name,
            };

            if (typeof val2.insertId !== 'undefined' && val2.insertId !== 0) {
                studentId = val2.insertId;
                // NOTIFICATION
                if (newUser) {
                    Utility.getNotificationCohort(studentId);
                    StudentHelper.creditWalletUsingCampaignData(db, { studentId, aaid });
                    Notification.userSignupNotification(studentId, gcmRegId, null, db);
                }
                // notification end
            }
            Student.deleteUserInRedis(studentId, db.redis.write).then(() => {

            }).catch((er) => {
                console.log('deleteUserInRedis');
                console.log(er);
            });
            const convertObj = {
                updated_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
                is_converted: 1,
            };
            // if (StudentHelper.isAltApp(req.headers.package_name)) {
            //     convertObj.package = req.headers.package_name.split('.').slice(2).join('_');
            // } else {
            //     convertObj.package = null;
            // }
            Student.convertPreOnboarding(db.mysql.write, udid, convertObj).then(() => {

            }).catch((err) => {
                console.log('convertPreOnboarding');
                console.log(err);
            });
            if (!_.isEmpty(udid)) {
                await StudentHelper.trackStudentActiveDeviceIds(db, studentId, udid);
                // let promises = [];
                // promises.push(StudentRedis.getActiveDeviceIds(db.redis.write, student_id));
                // promises.push(CourseMysql.getDistinctClassWiseCoursesPurchasedByStudent(db.mysql.read, student_id));
                // let resolvedPromises = await Promise.all(promises);
                // if(_.isNull(resolvedPromises[0])){
                //     StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udid);
                // }else{
                //     let devicesAvailableCounter = resolvedPromises[1][0]['class_count'] > 1 ? resolvedPromises[1][0]['class_count'] : 1;
                //     let currentActiveDevices = resolvedPromises[0].split('#');
                //     if(currentActiveDevices.length < devicesAvailableCounter){
                //         currentActiveDevices.push(udid);
                //         let udids = currentActiveDevices.join('#');
                //         StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
                //     }else{
                //         currentActiveDevices.shift();
                //         currentActiveDevices.push(udid);
                //         let udids = currentActiveDevices.join('#');
                //         StudentRedis.setActiveDeviceIds(db.redis.write, student_id, udids);
                //     }
                // }
            }
            if (isOption && !Utility.isUsRegion(region)) {
                Whatsapp.checkWhatsappOptin(contact, db.mysql.read, 1).then(async (existsWaOptin) => {
                    if (params.sentFrom === 'backend') {
                        status = 'VERIFIED';
                        Student.updateOtpRecord({
                            status,
                            updated_time: updateTime,
                        }, mobile, sessionId, db.mysql.write);
                        //  TODO : update session_id
                        Student.updateVerifiedStatus(db.mysql.write, sessionId).then(() => {
                            console.log(res);
                        }).catch((err) => {
                            console.log(err);
                        });
                    }

                    if (params.sentFrom === 'service') {
                        Student.updateVerifiedStatus(db.mysql.write, sessionId).then(() => {
                            console.log(res);
                        }).catch((err) => {
                            console.log(err);
                        });
                    }
                    StudentHelper.storeUserConsent(db.mongo, studentId, userConsent);
                    if (!existsWaOptin.length > 0) {
                        const promises = [];
                        if (newUser) {
                            Whatsapp.insertNum(contact, 10, db.mysql.write);
                            StudentHelper.sendOptinMsg(config, contact, language, studentId, db);
                        }
                        Promise.all(promises).then(async () => {
                            const obj = {
                                studentId,
                                new_user: newUser,
                                student_data_for_alt_app: studentDataForAltAppTable,
                                student_username: studentUsername,
                            };
                            /**
                             * UAE Paywall
                             * await StudentHelper.doubtnutPayWallSegmentation({ db, student_id: flag_params[0], req });
                             */
                            // add here
                            const responseData = loginManager.userVerifiedResponse(obj);
                            await StudentHelper.setStudentVerifyPersistedResponse(db, versionCode, sessionId, otpEnteredByUser, responseData);
                            res.set('dn-x-auth-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_new));
                            res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_refresh, true));
                            res.status(responseData.meta.code).json(responseData);
                        }).catch((error) => {
                            console.log('promise all');
                            console.log(error);
                            next(error);
                        });
                    } else {
                        const obj = {
                            studentId,
                            new_user: newUser,
                            student_data_for_alt_app: studentDataForAltAppTable,
                            student_username: studentUsername,
                        };
                        /**
                         * UAE Paywall
                         * await StudentHelper.doubtnutPayWallSegmentation({ db, student_id: flag_params[0], req });
                         */
                        // add here
                        const responseData = loginManager.userVerifiedResponse(obj);
                        await StudentHelper.setStudentVerifyPersistedResponse(db, versionCode, sessionId, otpEnteredByUser, responseData);
                        res.set('dn-x-auth-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_new));
                        res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_refresh, true));
                        res.status(responseData.meta.code).json(responseData);
                    }
                }).catch((er) => {
                    console.log('optin');
                    console.log(er);
                });
            } else {
                if (params.sentFrom === 'backend') {
                    status = 'VERIFIED';
                    Student.updateOtpRecord({
                        status,
                        updated_time: updateTime,
                    }, mobile, sessionId, db.mysql.write);
                }
                //  TODO : update session_id
                Student.updateVerifiedStatus(db.mysql.write, sessionId).then(() => { }).catch((err) => {
                    console.log(err);
                });
                StudentHelper.storeUserConsent(db.mongo, studentId, userConsent);

                const obj = {
                    studentId,
                    new_user: newUser,
                    student_data_for_alt_app: studentDataForAltAppTable,
                    student_username: studentUsername,
                };
                //  add here
                const responseData = loginManager.userVerifiedResponse(obj);
                StudentHelper.setStudentVerifyPersistedResponse(db, versionCode, sessionId, otpEnteredByUser, responseData);
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_refresh, true));
                res.status(responseData.meta.code).json(responseData);
                /**
                 * UAE Paywall
                 * await StudentHelper.doubtnutPayWallSegmentation({ db, student_id: flag_params[0], req });
                 */
            }
        })
            .then(() => { Student.updateRetargetStudentChurn(db.mysql.write, studentId, false); })
            .catch((error) => {
                console.log('errr');
                console.log(error);
                next(error);
            });
    } catch (e) {
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'verify', source: 'verify', error: errorLog });
        if (typeof e.error !== 'undefined') {
            const errorResponse = loginManager.makeErrorResponse(e, params, status, updateTime, sessionId, mobile);
            next(errorResponse);
        }
        next(e);
    }
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
    Promise.all(promise).then(() => {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
        Student.deleteUserInRedis(student_id, db.redis.write).then(() => {

        }).catch(() => {

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
        config = req.app.get('config');
        const publicPath = req.app.get('publicPath');
        const s3 = req.app.get('s3');
        sqs = req.app.get('sqs');

        const { student_id } = req.user;
        const fname = req.body.student_fname;
        const lname = req.body.student_lname;
        const email = req.body.student_email;
        const student_username = req.body.username;

        const { version_code } = req.headers;
        const { student_course } = req.body;
        const image = req.body.img_url;
        const school = req.body.school_name;
        const sclass = req.body.student_class;
        const { locale } = req.body;
        const { udid } = req.body;
        let { dob } = req.body;
        const { gaid } = req.body;

        const { coaching } = req.body;
        const { pincode } = req.body;

        // const { udid } = req.body;
        const { gcm_reg_id } = req.body;
        const { app_version } = req.body;
        const { clevertap_id } = req.body;

        const params = {};
        let flag = 0;
        if (fname !== undefined && !_.isEmpty(fname) && !Utility.checkValidUsername(fname)) {
            params.student_fname = fname.replace(/\s+/g, ' ').trim().substr(0, 50);
        }
        if (lname !== undefined && !_.isEmpty(lname) && !Utility.checkValidUsername(lname)) {
            params.student_lname = lname.replace(/\s+/g, ' ').trim().substr(0, 50);
        }
        if (email !== undefined && !_.isEmpty(email)) {
            params.student_email = email;
        }
        if (school !== undefined && !_.isEmpty(school)) {
            params.school_name = school;
        }
        if (sclass !== undefined && !_.isEmpty(sclass)) {
            params.student_class = sclass;
            if (req.user.isDropper) {
                req.user.student_class = 13;
            }
            if (req.user.student_class != sclass) {
                // need to trigger a SQS and pass "sclass" as new class value in "data" part.
                const queueUrl = config.class_change_sqs;
                const messageData = {
                    type: 'new_student_class',
                    student_class: sclass,
                    student_id: req.user.student_id,
                };
                StudentMongo.insertIntoClassChangeHistory(req.user.student_id, sclass, db.mongo.write, 'hamburger');
                Utility.sendMessageFIFO(sqs, queueUrl, messageData);
                flag = 1;
            }
        }
        if (locale !== undefined && !_.isEmpty(locale)) {
            params.locale = locale;
        }
        if (gaid !== undefined && !_.isEmpty(gaid) && gaid !== '00000000-0000-0000-0000-000000000000') {
            params.gaid = gaid;
        }
        if (student_username !== undefined && !_.isEmpty(student_username) && !Utility.checkValidUsername(student_username)) {
            params.student_username = student_username.replace(/\s+/g, ' ').trim().substr(0, 50);
        }
        if (dob) {
            dob = moment(dob).format('YYYY-MM-DD');
            params.dob = dob;
        }
        // if (dob !== undefined && !_.isEmpty(dob)) {
        //   dob = moment(dob).format('YYYY-MM-DD')
        //   params.dob = dob;
        // }
        if (coaching !== undefined && !_.isEmpty(coaching)) {
            params.coaching = coaching;
        }
        if (pincode !== undefined && !_.isEmpty(pincode)) {
            params.pincode = pincode;
        }
        if (image !== undefined && !_.isEmpty(image)) {
            params.img_url = await Utility.uploadImageToS3(image, student_id, config.cdn_url, publicPath, fs, s3, config.aws_bucket);
        }
        // if (udid !== undefined && !_.isEmpty(udid)) {
        //     params.udid = udid;
        // }
        if (gcm_reg_id !== undefined && !_.isEmpty(gcm_reg_id)) {
            params.gcm_reg_id = gcm_reg_id;
        }
        if (app_version !== undefined && !_.isEmpty(app_version)) {
            params.app_version = app_version;
        }
        if (clevertap_id !== undefined && !_.isEmpty(clevertap_id)) {
            params.clevertap_id = clevertap_id;
        }
        if (version_code !== undefined && !_.isEmpty(version_code)) {
            params.is_online = version_code;
        }
        // console.log('params')
        // console.log(params)
        const promise = [];

        promise.push(Student.updateUserProfile(student_id, params, db.mysql.write));

        promise.push(Course_History.getStudentDetailsBySid(student_id, db.mysql.read));
        /**
         * UAE Paywall
         * promise.push(StudentHelper.doubtnutPayWallSegmentation({ db, student_id, req }));
         */
        if (StudentHelper.isAltApp(req.headers.package_name)) {
            const obj = {
                gcm_reg_id,
                gaid,
                udid,
                package_name: req.headers.package_name,
                student_id,
            };
            promise.push(Student.updateAltAppUserProfile(db.mysql.write, obj));
        }

        if (flag) {
            // await Utility.removeAllDataFromStudentCourseMapping(
            //     db.mysql.write,
            //     student_id,
            // );
            await Utility.setNewBoardExamAndDeleteOld(db, student_id, sclass);
        }

        const settledPromises = await Promise.allSettled(promise);
        const [
            userProfile,
            studentDetails,
            // doubtnutPayWallSegmentation,
            altAppUserProfile,
        ] = settledPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        if (studentDetails.length > 0) {
            if (typeof student_course !== 'undefined') {
                Course_History.updateCourseByIdNew(studentDetails[0].id, student_course, sclass, db.mysql.write);
            }
        } else if (typeof student_course !== 'undefined') {
            Chapter.insertCourseBrowseHistory(db.mysql.write, student_id, sclass, student_course);
        }
        if (student_username && pincode && dob && email) {
            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'PROFILE_COMPLETE',
                user_id: req.user.student_id,
                refer_id: 0,
            });
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
        Student.deleteUserInRedis(student_id, db.redis.write).then(() => {
        }).catch((e) => {
            console.log(e);
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
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
}

async function truecallerLogin(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
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
    let flag_params;

    const profile_details = await truecaller_client.verifyProfile(profile, options);
    if (profile_details.verifiedSignature) {
        const contact = (profile_details.countryCode === 'IN') ? profile_details.phoneNumber.slice(3) : profile_details.phoneNumber;
        const response = await Student.checkStudentExists(contact, db.mysql.write, 1);
        const loginManager = new LoginHelper(req);
        loginManager.callVerifyServiceFromNonOtpLogin(profile_details.phoneNumber, profile_details.countryCode, 'TRUECALLER');
        if (response.length > 0) {
            const { student_id } = response[0];
            const { student_username } = response[0];
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
            Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
            res.status(responseData.meta.code).json(responseData);
            flag_params = [student_id, student_username];
        } else {
            const insert_obj = {
                udid: req.body.udid,
                gcm_reg_id: req.body.gcm_reg_id,
                mobile: contact,
            };

            const student_username = Utility.generateUsername(0).toLowerCase();
            insert_obj.student_username = student_username;

            if (profile_details.firstName !== null) {
                insert_obj.student_fname = profile_details.firstName;
            }
            if (profile_details.lastName !== null) {
                insert_obj.student_lname = profile_details.lastName;
            }

            // logger.info({
            //     tag: 'doubleEntry',
            //     source: 'truecallerLogin',
            //     method: 'insertNewUser',
            //     data: insert_obj,
            //     timestamp: Date.now(),
            // });
            const inserted = await Student.insertNewUser(db.mysql.write, insert_obj);
            console.log(inserted);

            const student_id = inserted.insertId;
            flag_params = [student_id, student_username];
            Utility.getNotificationCohort(student_id);
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'User Verified',
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
        console.log('no user is not verified');
        res.status(responseData.meta.code).json(responseData);
    }
}

async function whatsappLogin(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');

    const accessToken = req.body.access_token;
    const whatsappVerificationUrl = `https://graph.accountkit.com/v1.0/me/?access_token=${accessToken}`;

    try {
        const verification_response = await axios.get(whatsappVerificationUrl);
        if (verification_response.status === 200 && verification_response.statusText === 'OK') {
            const contact = parseInt(verification_response.data.phone.national_number);
            const response = await Student.checkStudentExists(contact, db.mysql.write, 1);
            if (response.length > 0) {
                console.log('>>>>>>>>>>>>>>>>>>>>>>>>', response);
                const { student_id } = response[0];
                const { student_username } = response[0];
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
                Student.updateRetargetStudentChurn(db.mysql.write, student_id, false);
                res.status(responseData.meta.code).json(responseData);
            } else {
                console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>', 'response');
                const insert_obj = {
                    udid: req.body.udid,
                    gcm_reg_id: req.body.gcm_reg_id,
                    mobile: contact,
                };

                const student_username = Utility.generateUsername(0).toLowerCase();
                insert_obj.student_username = student_username;
                // logger.info({
                //     tag: 'doubleEntry',
                //     source: 'whatsappLogin',
                //     method: 'insertNewUser',
                //     data: insert_obj,
                //     timestamp: Date.now(),
                // });
                const inserted = await Student.insertNewUser(db.mysql.write, insert_obj);
                console.log(inserted);

                const student_id = inserted.insertId;
                Utility.getNotificationCohort(student_id);
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'User Verified',
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
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'server error',
            },
            data: null,
            error: e,
        };
        console.log('error from server');
        res.status(responseData.meta.code).json(responseData);
    }
}

function logout(req, res, next) {
    db = req.app.get('db');
    const recievedToken = req.header('x-auth-token');
    Student.logout(db.redis.write, recievedToken).then(() => {
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

function tokenRecreate(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');
    const { student_id } = req.user;
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

async function newInvite(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const sclass = req.user.student_class;

        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }

        let details;

        if (version_code >= 638) {
            details = await AppConfigContainer.getInviteVIP(sclass, db);
        } else {
            details = await AppConfigContainer.getInvite(sclass, db);
        }

        // console.log(typeof details[0].key_value)
        const joined_student = await Student.getStudentsJoined(student_id, db.mysql.read);
        const data = JSON.parse(details[0].key_value);
        data.joined_student = joined_student[0].count;
        data.friends_joined = 'Friends Joined Today';

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

async function howItWorks(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const sclass = req.user.student_class;
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }

        let details;
        if (version_code >= 638) {
            details = await AppConfigurationContainer.getConfigByKey(db, 'How it works?');
        } else {
            details = await AppConfigurationContainer.getConfigByKeyAndClass(db, 'subscription_referral', sclass);
        }

        const joined_student = await Student.getStudentsJoined(student_id, db.mysql.read);
        const data = JSON.parse(details[0].key_value);
        data.joined_student = joined_student[0].count;
        data.friends_joined = 'Friends Joined Today';
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
    configData.imageShow = imageShow;
    return configData;
}

function getCollapseDetails(count, activePosition, configData) {
    const collapsingDetails = {
        collapsing_index: data.collapseCount,
        collapsing_item: {
            id: 123,
            code: 'other',
            title: configData.langText === 'hindi' ? 'अन्य' : 'Other',
            sub_title: '',
            type: '',
            is_active: false,
        },
    };
    if (activePosition > data.collapseCount) {
        collapsingDetails.collapsing_item.is_active = true;
    }
    return collapsingDetails;
}
async function getClassListData(db, configData, locale) {
    let classLang = 'english';
    if (configData.langText != undefined && configData.langText === 'hindi') {
        classLang = configData.langText;
    }
    const result = await ClassContainer.getClassListNewOnBoarding(db, classLang);
    let temp = result.shift();
    result.push(temp);
    temp = result.shift();
    result.splice(2, 0, temp);
    const returnData = {};

    returnData.type = 'class';
    if (configData.langText != undefined) {
        returnData.title = data.onBoardingClassHeading(locale);
        returnData.error_message = data.classErrorMsg(locale);
    } else {
        returnData.title = `${data.onBoardingClassHeading('en')}\n${data.onBoardingClassHeading('hi')}`;
        returnData.error_message = data.classErrorMsg('en');
    }
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
    let count = 0;
    let activePosition = 0;
    returnData.step_items = returnData.step_items.map((a) => {
        count++;
        if (configData.selectedLang !== undefined && a.code == configData.selectedLang) {
            activePosition = count;
            a.is_active = true;
        } else {
            a.is_active = false;
        }
        a.sub_title = null;
        return a;
    });

    if (count > data.collapseCount) {
        returnData.collapsing_details = getCollapseDetails(count, activePosition, configData);
    }
    returnData.progress_details = {
        image: imageLink,
        message: messageLink,
    };
    if (configData.imageShow != undefined && !configData.imageShow) {
        returnData.progress_details = null;
    }

    returnData.error_message = data.langErrorMsg(configData.selectedLang);

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
        returnData.error_message = data.boardErrorMsg(locale);
    } else {
        returnData.title = data.onBoardingExamHeading(locale);
        returnData.error_message = data.examErrorMsg(locale);
    }
    returnData.step_items = await studentContainer.getExamsBoardsDetailsLocalised(db, configData.stu_class, configData.type, configData.langText);
    let count = 0;
    let activePosition = 0;
    returnData.step_items = returnData.step_items.map((a) => {
        count++;
        if (configData.selectedBoard !== undefined && a.code == configData.selectedBoard) {
            activePosition = count;
            a.is_active = true;
        } else {
            a.is_active = false;
        }
        return a;
    });

    if (configData.type === 'board' && count > data.collapseCount) {
        returnData.collapsing_details = getCollapseDetails(count, activePosition, configData);
    }

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

function askButtonData(returnData, locale) {
    returnData.ask_button_text = data.askButtonText(locale);
    returnData.ask_button_active_message = data.askButtonActiveMessage(locale);
    returnData.ask_button_inactive_message = data.askButtonInactiveMessage(locale);
    return returnData;
}

async function postStudentOnboarding(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { type } = req.body;
        const { code } = req.body;
        const { version_code: versionCode } = req.headers;
        const studentId = req.user.student_id;
        let returnData = {};
        let stepsData = {};

        const studentData = await Student.getStudentWithLocation(req.user.student_id, db.mysql.read);
        let userName = ''; let userImg = '';
        if (!_.isEmpty(studentData)) {
            userName = await getUserName(studentData);
            if (studentData[0].img_url == undefined || studentData[0].img_url == null) {
                userImg = `${config.staticCDN}${data.userDefaultPic}`;
            } else {
                userImg = studentData[0].img_url;
            }
        }

        const imageShow = false;
        // let imageShow = true;
        // if (studentId % 2 === 0) {
        //     imageShow = false;
        // }

        // returnData.user_details = topbarData;
        returnData.is_final_submit = false;
        returnData.ask_question = false;

        const topbarData = {
            type: 'user_details',
            image: userImg,
            title: `Hey ${userName}`,
            message: data.topMsg('en'),
        };

        topbarData.message = data.topMsg(req.user.locale);
        returnData = await askButtonData(returnData, req.user.locale);

        if (type === 'language') {
            topbarData.message = data.topMsg(code[0]);
            returnData = await askButtonData(returnData, code[0]);
        }

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
            returnData.steps.push(await getClassListData(db, configData, req.user.locale));

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
                returnData = await askButtonData(returnData, 'en');
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
                returnData.steps.push(await getClassListData(db, configData, obj.locale));

                configData = {};
                configData = {
                    selectedLang: code[0], is_active: false, is_multi_select: false, is_submitted: true, selectedClass: req.user.student_class,
                };
                if (versionCode >= 727) {
                    addImageShow(configData, imageShow);
                }
                returnData.steps.push(await getLangListData(db, configData));

                const language = await LanguageContainer.getLanguageByCode(db, code[0]);
                let langText = 'english';
                if (!_.isEmpty(language)) {
                    langText = language[0].language;
                }

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
                    returnData = await askButtonData(returnData, obj.locale);
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
                        returnData = await askButtonData(returnData, obj.locale);
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
                if (!_.isEmpty(language)) {
                    langText = language[0].language;
                }
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
                returnData.steps.push(await getClassListData(db, configData, locale));

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
                returnData = await askButtonData(returnData, locale);
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

    let returnData = {};
    let stepsData = {};

    const studentData = await Student.getStudentWithLocation(req.user.student_id, db.mysql.read);
    let userName = ''; let userImg = '';
    if (!_.isEmpty(studentData)) {
        userName = await getUserName(studentData);
        if (studentData[0].img_url == undefined || studentData[0].img_url == null) {
            userImg = `${config.staticCDN}${data.userDefaultPic}`;
        } else {
            userImg = studentData[0].img_url;
        }
    }

    const imageShow = false;
    // let imageShow = true;
    // if (studentId % 2 === 0) {
    //     imageShow = false;
    // }

    // returnData.user_details = topbarData;
    returnData.is_final_submit = false;
    returnData.ask_question = false;

    const topbarData = {
        type: 'user_details',
        image: userImg,
        title: `Hey ${userName}`,
        message: data.topMsg('en'),
    };

    topbarData.message = data.topMsg(req.user.locale);

    if (type === 'language') {
        topbarData.message = data.topMsg(code[0]);
    }

    returnData = await askButtonData(returnData, 'en');
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
        returnData.steps.push(await getClassListData(db, configData, req.user.locale));
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
        returnData.steps.push(await getClassListData(db, configData, req.user.locale));

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
            returnData = await askButtonData(returnData, 'en');
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
        returnData.steps.push(await getClassListData(db, configData, req.user.locale));

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
            if (!_.isEmpty(language)) {
                langText = language[0].language;
            }
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
            returnData = await askButtonData(returnData, locale);
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
        const { locale } = req.user;
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
        returnData.steps.push(await getClassListData(db, configData, locale));
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
        returnData.steps.push(await getClassListData(db, configData, req.user.locale));

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
            returnData = await askButtonData(returnData, 'en');
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
        returnData = await askButtonData(returnData, 'en');
        return returnData;
    }

    const { locale } = req.user;
    let langText = 'english';
    if (locale && locale != '' && locale != null) {
        const language = await LanguageContainer.getLanguageByCode(db, locale);
        if (!_.isEmpty(language)) {
            langText = language[0].language;
        }
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
            returnData = await askButtonData(returnData, 'en');
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
                stepsData.title = data.onBoardingExamHeading(locale);
                returnData.steps.push(stepsData);
            } else if (req.user.student_class == 9 || req.user.student_class == 10) {
                returnData.ask_question = true;
                returnData = await askButtonData(returnData, locale);
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
            returnData = await askButtonData(returnData, 'en');
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
        returnData.steps.push(await getClassListData(db, configData, locale));

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
        returnData = await askButtonData(returnData, locale);
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

async function addPublicUserApp(req, res) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            udid,
            gcm_reg_id,
            class: student_class,
            locale,
            app_version,
        } = req.body;
        let student_id;
        let student_username;
        let new_user_flag = true;
        let guest_user = true;
        const source = req.body.source || 'PRINT_ADS';
        const is_web = 8;
        const sessionValidity = 6 * 3600; // 6 hours
        let joiningTimestamp;
        if (_.isEmpty(udid)) {
            throw (new Error('udid cannot be empty'));
        }
        const loginManager = new LoginHelper(req);

        const guestLoginAttemptInfo = {
            source: loginManager.getSourceByLoginType('GUEST'),
            udid,
            is_login: 1,
            mobile: 'GUEST',
        };
        if (StudentHelper.isAltApp(req.headers.package_name)) {
            guestLoginAttemptInfo.package = req.headers.package_name.split('.').slice(2).join('_');
        }
        const promises = [];
        promises.push(Student.insertStudentsLoginInfo(db.mysql.write, guestLoginAttemptInfo));
        promises.push(Student.getStudentByUdid(udid, db.mysql.read));
        const [loginDetails, checkUserDeviceExists] = await Promise.all(promises);
        if (!_.isEmpty(checkUserDeviceExists)) {
            student_id = checkUserDeviceExists[0].student_id;
            joiningTimestamp = checkUserDeviceExists[0].timestamp;
            new_user_flag = false;
            if (checkUserDeviceExists[0].mobile !== null) {
                guest_user = false;
            }
            await Student.updateStudentByUdid(udid, student_class, locale, app_version, gcm_reg_id, null, null, db.mysql.write); // generate a new token and return him the same token ( with 6hr expiry)
        } else {
            student_username = Utility.generateUsername(0);
            const insertedResp = await Student.addUser({
                udid,
                language: locale,
                class1: student_class,
                app_version,
                gcm_reg_id,
                student_username,
                mobile: null,
                source,
                is_web,
            }, db.mysql.write);

            if (typeof insertedResp.insertId !== 'undefined' && insertedResp.insertId !== 0) {
                student_id = insertedResp.insertId;
            }

            const guestUserLoginLog = new GuestUserLoginTrackSchema({
                student_id,
                guest_login_timestamp: moment().add(5, 'h').add(30, 'm'),
            });
            guestUserLoginLog.save();
        }

        const updateObj = {
            is_verified: 1,
        };
        if (!guest_user) {
            updateObj.mobile = checkUserDeviceExists[0].mobile;
        }
        if (loginDetails.insertId !== 'undefined' && loginDetails.insertId !== 0) {
            Student.updateGuestLoginVerification(db.mysql.write, updateObj, loginDetails.insertId);
        }

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
                guest_user,
            },
        };
        if (source.toLowerCase() === 'login') {
            res.set('dn-x-auth-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_new));
            res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: student_id }, config.jwt_secret_refresh, true));
            res.status(responseData.meta.code).json(responseData);
        } else if (new_user_flag) {
            res.set('dn-x-auth-token', TokenGenerator.guestSign({ id: student_id }, config.jwt_secret_new));
            res.set('dn-x-auth-refresh-token', TokenGenerator.guestSign({ id: student_id }, config.jwt_secret_refresh, true));
            res.status(responseData.meta.code).json(responseData);
        } else {
            const currentTime = moment().toDate().getTime();
            const joiningTime = moment(joiningTimestamp).toDate().getTime();
            const timeDiff = moment.duration(currentTime - joiningTime);
            const timeElapsed = timeDiff.asSeconds();
            const tokenExpiry = sessionValidity - timeElapsed > 0 ? parseInt(sessionValidity - timeElapsed) : 60;
            res.set('dn-x-auth-token', TokenGenerator.guestSign({ id: student_id }, config.jwt_secret_new, false, tokenExpiry));
            res.set('dn-x-auth-refresh-token', TokenGenerator.guestSign({ id: student_id }, config.jwt_secret_refresh, true, tokenExpiry - 30));
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },

            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    addPublicUserWeb,
    addPublicUserApp,
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
    addPublicUserWhatsapp,
    newInvite,
    howItWorks,
    postStudentOnboarding,
    getStudentOnboarding,
};
