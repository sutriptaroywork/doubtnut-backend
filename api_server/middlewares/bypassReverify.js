const _ = require('lodash');
const StudentRedis = require('../modules/redis/student');
const TokenGenerator = require('../modules/token');

async function bypass(req, res, next) {
    try {
        const { otp: otpEnteredByUser, session_id: sessionId } = req.body;
        const db = req.app.get('db');
        const config = req.app.get('config');

        const { version_code: versionCode } = req.headers;
        if (versionCode >= 995 && versionCode <= 1017) {
            const studentVerificationResponse = await StudentRedis.getStudentVerifiedResponse(db.redis.read, sessionId, otpEnteredByUser);
            if (!_.isNull(studentVerificationResponse)) {
                const studentVerificationParsedResponse = JSON.parse(studentVerificationResponse);
                const {
                    student_id: studentId,
                } = studentVerificationParsedResponse.data;
                res.set('dn-x-auth-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_new));
                res.set('dn-x-auth-refresh-token', TokenGenerator.sign({ id: studentId }, config.jwt_secret_refresh, true));
                return res.status(studentVerificationParsedResponse.meta.code).json(studentVerificationParsedResponse);
            }
        }
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = bypass;
