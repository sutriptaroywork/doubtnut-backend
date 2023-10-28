const jwt = require('jsonwebtoken');

function sign(payload, secret, isRefreshToken = false) {
    return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: isRefreshToken ? '90d' : '7d' });
}

function verify(token, secret, ignoreExpiration = false) {
    return jwt.verify(token, secret, { algorithms: ['HS256'], ignoreExpiration });
}

function guestSign(payload, secret, isRefreshToken = false, expiry) {
    const authTokenExpiry = '6h';
    const refreshTokenExpiry = '1h';

    let expiresIn;
    if (typeof expiry === 'undefined') {
        expiresIn = isRefreshToken ? refreshTokenExpiry : authTokenExpiry;
    } else {
        expiresIn = expiry;
    }
    return jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn });
}

module.exports = {
    sign,
    verify,
    guestSign,
};
