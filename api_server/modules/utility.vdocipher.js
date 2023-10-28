const crypto = require('crypto');
// const config = require('../config/config');

/**
 * @param {string|buffer} key secret in utf8
 * @param {string} input utf8 input
 * @return {string} Buffer
 */
const hmac = (key, input) => {
    const hm = crypto.createHmac('sha256', key);
    hm.update(input);
    return hm.digest();
};

/**
 * base64 a buffer into the url safe version
 * @param {buffer} input
 * @return {string}
 */
const urlSafeB64 = (input) => input.toString('base64').replace(/\//g, '_').replace(/\+/g, '-');

function getLicenseUrl(contentId, config, expiry = 300) {
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const contentAuthObj = {
        contentId,
        expires: timestamp + expiry,
    };
    const signingDate = (new Date()).toISOString().replace(/[-.:]/g, '');
    const contentAuthStr = urlSafeB64(Buffer.from(JSON.stringify(contentAuthObj)));
    const signedDate = hmac(config.vdocipherApikey, signingDate);
    const hash = urlSafeB64(hmac(signedDate, contentAuthStr));
    const keyId = config.vdocipherApikey.substr(0, 16);
    const signature = `${keyId}:${signingDate}:${hash}`;
    const LICENSE_URL = `https://license.vdocipher.com/auth/wv/${
        urlSafeB64(Buffer.from(JSON.stringify({
            contentAuth: `${contentAuthStr}`,
            signature: `${signature}`,
        })))}`;
    return LICENSE_URL;
}

module.exports = {
    getLicenseUrl,
};
