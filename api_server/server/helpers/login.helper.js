const _ = require('lodash');
const Student = require('../../modules/student');
const Token = require('../../modules/tokenAuth');
const Constants = require('../../modules/constants');
const StudentHelper = require('./student.helper');
const StudentMySQL = require('../../modules/mysql/student');
const StudentRedis = require('../../modules/redis/student');
const Utility = require('../../modules/utility');
const CourseMysqlV2 = require('../../modules/mysql/coursev2');
const OtpFactory = require('./otpfactory/otpfactoryservices.helper');

class LoginManager {
    constructor(request) {
        this.req = request;
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.user = request.user;
        this.locale = request.user ? request.user.locale : 'en';
        this.region = this.req.headers.country || 'IN';
        this.settings = {
            backgroundColor: '#ffffff',
            borderColor: '#cbcbcb',
            cornerRadius: '2.0',
            borderWidth: 1,
            topIconHeight: 42,
            topIconWidth: 42,
            topIconSmallHeight: 30,
            topIconSmallWidth: 30,
            layoutConfigParent: {
                margin_top: 15,
                margin_bottom: 15,
                margin_left: 5,
                margin_right: 5,
            },
            layoutConfigZero: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
            },
        };
        this.flagrVariantsArr = request.headers.flagr_variation_ids;
        this.responseData = {};
    }

    async isOldActiveFreeUser(mobile) {
        try {
            const oldUserData = await Student.isOldActiveUser(this.db.mysql.read, mobile);
            const udidExist = !_.isEmpty(oldUserData) && oldUserData[0].udid === this.req.body.udid && oldUserData[0].is_verified === 1;
            const studentData = await Student.checkStudentExistsGlobal(mobile, Utility.isUsRegion(this.region), this.db.mysql.write);
            let isFreeUser = false;
            if (!_.isEmpty(studentData)) {
                // checking for paid user
                const [
                    emiPackages,
                    studentSubscriptionDetails,
                ] = await Promise.all([
                    CourseMysqlV2.getUserEmiPackages(this.db.mysql.read, studentData[0].student_id),
                    CourseMysqlV2.getUserActivePackages(this.db.mysql.read, studentData[0].student_id),
                ]);
                isFreeUser = (emiPackages.length === 0 && studentSubscriptionDetails.length === 0);
            }
            return udidExist && !_.isEmpty(studentData) && isFreeUser;
        } catch (e) {
            throw new Error(e);
        }
    }

    userVerifiedResponse(obj) {
        let isAltAppStudent = false;
        if (StudentHelper.isAltApp(this.req.headers.package_name)) {
            isAltAppStudent = true;
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'User registered',
            },
            data: {
                student_id: obj.studentId,
                token: Token.create(obj.studentId, this.config),
                onboarding_video: Constants.getBlobIntro(),
                intro: Constants.getBlobIntroObject(),
                student_username: obj.student_username,
                is_new_user: obj.new_user,
            },
        };

        if (isAltAppStudent) {
            Student.updateAltAppLoginStudent(this.db.mysql.write, obj.student_data_for_alt_app);
        }
        return responseData;
    }

    userBlockedPinLogin(obj, userData, userDataExists) {
        let errorMsg = 'Your id is blocked for DN Pin login currently. Please try via any other method.';
        if (!_.isEmpty(userData[0].locale) && userData[0].locale === 'hi') {
            errorMsg = 'आपकी आईडी वर्तमान में DN पिन लॉगिन के लिए अवरुद्ध है। कृपया किसी अन्य विधि के माध्यम से प्रयास करें।';
        }
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: errorMsg,
            },
            data: {
                message: 'Blocked User',
            },
        };
        if (userDataExists) {
            obj.status_details = 'User Blocked';
            obj.status = 'Failed';
            StudentMySQL.storePinMetrics(this.db.mysql.write, obj);
        }
        return responseData;
    }

    pinNotExists(obj, userDataExists) {
        const responseData = {
            meta: {
                code: 404,
                success: false,
                message: 'Pin Not Found',
            },
            data: {
                message: 'Pin Not Exists',
            },
        };
        if (userDataExists) {
            obj.status_details = 'Pin Not Found';
            obj.status = 'Failed';
            StudentMySQL.storePinMetrics(this.db.mysql.write, obj);
        }
        return responseData;
    }

    async pinMismatched(obj, userData, userDataExists, mobile) {
        try {
            const last24HoursData = await StudentMySQL.getLast24HoursData(this.db.mysql.read, mobile, 'Mismatched');
            const leftAttempt = 3 - (parseInt(last24HoursData.length) + 1);
            let errorMsg = `${leftAttempt} more attempts left to login via DN Pin. Users with 3 incorrect attempts would be blocked for 24 hours to login via DN Pin.`;
            if (!_.isEmpty(userData[0].locale) && userData[0].locale === 'hi') {
                errorMsg = `डीएन पिन के माध्यम से लॉगिन करने के लिए ${leftAttempt} और प्रयास शेष हैं। 3 गलत प्रयासों वाले उपयोगकर्ताओं को 24 घंटे के लिए अवरुद्ध कर दिया जाएगा।`;
            }
            if (last24HoursData.length === 2) {
                StudentRedis.setPinBlockedUserRedisData(this.db.redis.read, 60 * 60 * 24, mobile);
                errorMsg = 'Pin Mismatched. User Blocked for multiple failed attempt for next 24 hours';
            }
            const responseData = {
                meta: {
                    code: 401,
                    success: false,
                    message: errorMsg,
                },
                data: {
                    message: 'Pin Not Matched',
                },
            };
            if (userDataExists) {
                obj.status_details = 'Pin Mismatched';
                obj.status = 'Mismatched';
                StudentMySQL.storePinMetrics(this.db.mysql.write, obj);
            }
            return responseData;
        } catch (e) {
            throw new Error(e);
        }
    }

    makingUserBlockedResponse() {
        return {
            meta: {
                code: 401,
                success: false,
                message: `You have entered Wrong OTP more than ${Constants.getWrongOTPMaxLimit()} times. User Blocked.`,
            },
            data: {
                status: 'FAILURE',
                session_id: false,
            },
        };
    }

    makingWrongOtpResponse() {
        return {
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
    }

    makeErrorResponse(e, params, status, updateTime, sessionId, mobile) {
        let responseData = {};
        if (typeof e.error === 'object') {
            if (e.name === 'Error' && e.message === 'Wrong OTP') {
                if (params.sentFrom === 'backend') {
                    status = 'INVALID';
                    Student.updateOtpRecord({
                        status,
                        updated_time: updateTime,
                    }, mobile, sessionId, this.db.mysql.write);
                }
                responseData = {
                    meta: {
                        code: 401,
                        success: false,
                        message: 'Incorrect OTP ⚠ Please Try Again',
                    },
                    data: 'Incorrect OTP ⚠ Please Try Again',
                };
            } else {
                responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Unable to Verify OTP',
                    },
                    data: 'Unable to Verify OTP',
                };
            }
            return responseData;
        }
        e.error = JSON.parse(e.error);
        if (e.error.Details === 'OTP Mismatch') {
            if (params.sentFrom === 'backend') {
                status = 'INVALID';
                Student.updateOtpRecord({
                    status,
                    updated_time: updateTime,
                }, mobile, sessionId, this.db.mysql.write);
            }
            responseData = { message: 'Incorrect OTP ⚠ Please Try Again', status: 403, isPublic: true };
            return responseData;
        }
        if (params.sentFrom === 'backend') {
            status = 'API ERROR';
            Student.updateOtpRecord({
                status,
                updated_time: updateTime,
            }, mobile, sessionId, this.db.mysql.write);
        }
        responseData = { message: 'Kuch Problem Hai 🙁 Please Restart The App', status: 403, isPublic: true };
        return responseData;
    }

    async updatingVerifiedStatus(obj, params) {
        try {
            if (params.sentFrom === 'backend') {
                obj.status = 'VERIFIED';
                Student.updateOtpRecord({
                    status: obj.status,
                    updated_time: obj.updateTime,
                }, obj.mobile, obj.sessionId, this.db.mysql.write);
            }
            //  TODO : update session_id
            Student.updateVerifiedStatus(this.db.mysql.write, obj.session_id);
        } catch (e) {
            throw new Error(e);
        }
    }

    async updatingUserLanguage(userData, userDataExists) {
        try {
            if (!_.isNull(this.req.body.language) && !_.isEmpty(this.req.body.language)) {
                const languageUpdateObj = {
                    locale: this.req.body.language,
                };
                if (userDataExists) {
                    await Student.updateStudentDetails(this.db.mysql.write, languageUpdateObj, userData[0].student_id);
                    Student.deleteUserInRedis(userData[0].student_id, this.db.redis.write);
                }
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    getSourceByLoginType(loginMethod) {
        let source;
        switch (loginMethod) {
            case 'OTP':
                source = 0;
                break;
            case 'TRUECALLER':
                source = 1;
                break;
            case 'WITHOUT-OTP':
                source = 2;
                break;
            case 'GUEST':
                source = 4;
                break;
            case 'FIREBASE':
                source = 5;
                break;
            default:
                source = 0;
        }
        return source;
    }

    callVerifyServiceFromNonOtpLogin(sessionId, region, channelName) {
        const params = {
            sessionId,
            otp_entered_by_user: 0,
            sentFrom: 'service',
            region: region,
            channel: channelName,
            alreadyVerified: true,
        };
        OtpFactory.verifyOtpResponse(params);
    }
}

module.exports = LoginManager;
