const crypto = require('crypto');
const config = require('../config/config');
const StudentContainer = require('../modules/containers/student');
const Token = require('../modules/token');

const webAuthKey = config.WEBAUTH.WEB_AUTH_KEY;
const webAuthIv = config.WEBAUTH.WEB_AUTH_IV;

const responseData = {
    meta: {
        code: 401,
        success: false,
        message: 'Unauthorized',
    },
    data: 'Unauthorized',
};

async function decryptId(req, res, next) {
    const studentId = req.headers['x-sid'];
    if (!studentId) {
        return res.status(responseData.meta.code).json(responseData);
    }
    const decipher = crypto.createDecipheriv('aes-256-cbc', webAuthKey, webAuthIv);
    let decryptedId;
    try {
        decryptedId = decipher.update(studentId, 'hex', 'utf8');
        decryptedId += decipher.final('utf8');
    } catch (err) {
        return res.status(responseData.meta.code).json(responseData);
    }
    const user = await StudentContainer.getById(decryptedId, req.app.get('db'));
    if (!user || !user.length) {
        return res.status(responseData.meta.code).json(responseData);
    }
    const token = Token.sign({ id: decryptedId }, config.jwt_secret_new);
    req.headers['x-auth-token'] = token;
    req.user = user[0];
    next();
}

module.exports = decryptId;
