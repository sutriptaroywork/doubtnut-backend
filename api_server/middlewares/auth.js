const config = require('../config/config');
const StudentContainer = require('../modules/containers/student');
const QuestionContainer = require('../modules/containers/question');
const Token = require('../modules/token');
const GuestLoginConfig = require('../data/data.guestLogin').config;
const Utility = require('../modules/utility');

const responseData = {
    meta: {
        code: 401,
        success: false,
        message: 'Unauthorized',
    },
    data: 'Unauthorized',
};

async function loginRequired(req, res, next) {
    const auth = req.headers['x-auth-token'] || req.headers.authorization;
    const versionCode = req.headers.version_code;
    let token = auth && (auth.startsWith('Bearer') || auth.startsWith('bearer')) ? auth.slice(7) : auth;
    let refreshToken = req.headers['x-auth-refresh-token'];
    let attachActionBlockRequestConfig = false;
    const db = req.app.get('db');
    if (config.env !== 'production' && req.headers.studentid) {
        token = Token.sign({ id: req.headers.studentid }, config.jwt_secret_new); // To debug for a particular student id
    }
    if (!(token || refreshToken)) {
        // db.mongo.write.collection('unauth-token-requests-logs').insertOne({
        //     token,
        //     refreshToken,
        //     versionCode,
        //     origin: req.originalUrl,
        //     source: 'NO_TOKEN_IN_REQUEST',
        // });
        return res.status(responseData.meta.code).json(responseData);
    }
    let payload;
    let regenerate;
    try {
        payload = refreshToken ? Token.verify(refreshToken, config.jwt_secret_refresh) : Token.verify(token, config.jwt_secret_new);
    } catch (e) {
        if (e.name === 'TokenExpiredError') { // refresh token/token has expired
            // db.mongo.write.collection('unauth-token-requests-logs').insertOne({
            //     token,
            //     refreshToken,
            //     versionCode,
            //     origin: req.originalUrl,
            //     source: 'TOKEN_EXPIRATION',
            // });
            return res.status(responseData.meta.code).json(responseData);
        }
        if (e.name === 'JsonWebTokenError' && e.message === 'invalid signature' && !refreshToken) { // token secret mismatch and refresh token not available
            try {
                payload = Token.verify(token, config.jwt_secret);
                regenerate = true;
            } catch (e2) {
                // db.mongo.write.collection('unauth-token-requests-logs').insertOne({
                //     token,
                //     refreshToken,
                //     versionCode,
                //     origin: req.originalUrl,
                //     source: 'INVALID_SIGNATURE',
                // });
                return res.status(responseData.meta.code).json(responseData);
            }
        }
    }
    if (!payload || !payload.id) {
        // db.mongo.write.collection('unauth-token-requests-logs').insertOne({
        //     token,
        //     refreshToken,
        //     versionCode,
        //     origin: req.originalUrl,
        //     source: 'EMPTY_PAYLOAD',
        // });
        return res.status(responseData.meta.code).json(responseData);
    }
    if (refreshToken || regenerate) {
        token = Token.sign({ id: payload.id }, config.jwt_secret_new);
        refreshToken = Token.sign({ id: payload.id }, config.jwt_secret_refresh, true);
        res.set('dn-x-auth-token', token);
        res.set('dn-x-auth-refresh-token', refreshToken);
    }

    const user = await StudentContainer.getById(payload.id, req.app.get('db'));

    if (!user || !user.length) {
        // db.mongo.write.collection('unauth-token-requests-logs').insertOne({
        //     token,
        //     refreshToken,
        //     versionCode,
        //     origin: req.originalUrl,
        //     source: 'NO_USER',
        // });
        return res.status(responseData.meta.code).json(responseData);
    }

    if (user && user.length && user[0].mobile === null && versionCode > 975) {
        const userQuestionCount = await QuestionContainer.getQuestionAskedCount(req.app.get('db'), payload.id);
        if (userQuestionCount >= 2 && Utility.getMappedRoutes(GuestLoginConfig.restrictred_routes, user[0].student_id).includes(req.originalUrl.split('?').shift())) {
            // db.mongo.write.collection('unauth-token-requests-logs').insertOne({
            //     token,
            //     refreshToken,
            //     versionCode,
            //     origin: req.originalUrl,
            //     source: 'GUEST_LOGIN_2_QA',
            // });
            return res.status(responseData.meta.code).json(Utility.handleGuestLoginResponse(responseData, user[0].locale));
        }
        if (Utility.getMappedRoutes(GuestLoginConfig.only_action_disabled_routes, user[0].student_id).includes(req.originalUrl.split('?').shift())) {
            attachActionBlockRequestConfig = true;
        }
    }

    user[0].isDropper = false;
    if (user[0].student_class === '13') {
        user[0].student_class = '12';
        user[0].isDropper = true;
    }

    if (req.headers.country && req.headers.country == 'US') {
        if (user[0].student_class.length == 0) {
            user[0].student_class = '27';
        }
        if (user[0].locale.length == 0) {
            user[0].locale = 'en';
        }
    }
    req.user = user[0];
    if (attachActionBlockRequestConfig) {
        req.user.is_guest_user = true;
        req.user.is_action_disabled_by_route = true;
    }
    next();
}

module.exports = loginRequired;
