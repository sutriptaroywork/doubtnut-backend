const config = require('../config/config');
const TeacherContainer = require('../modules/containers/teacher');
const Token = require('../modules/token');

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
    let token = auth && (auth.startsWith('Bearer') || auth.startsWith('bearer')) ? auth.slice(7) : auth;
    let refreshToken = req.headers['x-auth-refresh-token'];
    // if (config.env !== 'production' && req.headers.studentid) {
    //     token = Token.sign({ id: req.headers.studentid }, config.jwt_secret_new); // To debug for a particular student id
    // }
    console.log(auth);
    console.log(refreshToken);
    if (!(token || refreshToken)) {
        return res.status(responseData.meta.code).json(responseData);
    }
    let payload;
    let regenerate;
    try {
        payload = refreshToken ? Token.verify(refreshToken, config.jwt_secret_teacher_refresh) : Token.verify(token, config.jwt_secret_teacher);
        console.log(payload);
    } catch (e) {
        if (e.name === 'TokenExpiredError') { // refresh token/token has expired
            return res.status(responseData.meta.code).json(responseData);
        }
        if (e.name === 'JsonWebTokenError' && e.message === 'invalid signature' && !refreshToken) { // token secret mismatch and refresh token not available
            try {
                payload = Token.verify(token, config.jwt_secret_teacher);
                regenerate = true;
            } catch (e2) {
                return res.status(responseData.meta.code).json(responseData);
            }
        }
    }
    if (!payload || !payload.id) {
        return res.status(responseData.meta.code).json(responseData);
    }
    if (refreshToken || regenerate) {
        token = Token.sign({ id: payload.id }, config.jwt_secret_teacher);
        refreshToken = Token.sign({ id: payload.id }, config.jwt_secret_teacher_refresh, true);
        res.set('dn-x-auth-token', token);
        res.set('dn-x-auth-refresh-token', refreshToken);
    }
    const user = await TeacherContainer.getById(req.app.get('db'), payload.id);
    if (!user || !user.length) {
        return res.status(responseData.meta.code).json(responseData);
    }
    req.user = user[0];
    next();
}

module.exports = loginRequired;
