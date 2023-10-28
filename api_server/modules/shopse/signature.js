const queryString = require('query-string');
const crypto = require('crypto');
const config = require('../../config/config');

const { RESPONSE_KEY } = config.SHOPSE;

function generateSignature(query_string) {
    const parsed = queryString.parse(query_string);
    const signature_data = encodeURIComponent(`currentTime=${parsed.currentTime}&orderId=${parsed.orderId}&shopSeTxnId=${parsed.shopSeTxnId}&status=${parsed.status}&statusCode=${parsed.statusCode}&statusMessage=`) + encodeURIComponent(parsed.statusMessage).replace('%20', '+');

    const signature = crypto.createHmac('sha256', RESPONSE_KEY).update(signature_data).digest('base64');
    return (parsed.signature == signature);
}

function generateWebhookSignature(parsed) {
    const signature_data = encodeURIComponent(`currentTime=${parsed.currentTime}&orderId=${parsed.orderId}&shopSeTxnId=${parsed.shopSeTxnId}&status=${parsed.status}&statusCode=${parsed.statusCode}&statusMessage=`) + encodeURIComponent(parsed.statusMessage).replace('%20', '+');

    const signature = crypto.createHmac('sha256', RESPONSE_KEY).update(signature_data).digest('base64');
    return (decodeURIComponent(parsed.signature) == signature);
}

module.exports.generateSignature = generateSignature;
module.exports.generateWebhookSignature = generateWebhookSignature;
