const base64 = require('base-64');

async function baseDecoder(req, res, next) {
    try {
        const auth = req.headers['x-auth-token'] || req.headers.authorization;
        const decodedAuth = base64.decode(auth);
        req.headers['x-auth-token'] = decodedAuth;
        req.headers.authorization = decodedAuth;
        next();
    } catch (e) {
        next(e);
    }
}

module.exports = baseDecoder;
