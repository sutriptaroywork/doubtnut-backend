const _ = require('lodash');
const axios = require('axios');
const config = require('../../config/config');
const logger = require('../../config/winston').winstonLogger;

const bufferObj = Buffer.from(`${config.GRAYQUEST.CLIENT_ID}:${config.GRAYQUEST.SECRET}`, 'utf8');
const base64String = bufferObj.toString('base64');

module.exports = class grayQuestHelper {
    static async verifySignature(webhookSecret, webhookSignature, webhookData) {
        try {
            const payload = {
                webhook_secret: webhookSecret,
                webhook_signature: webhookSignature,
                webhook_data: webhookData,
            };
            const options = {
                method: 'POST',
                url: `${config.GRAYQUEST.BASE_URL}/v1/webhooks/verify-signature`,
                headers: {
                    Authorization: `Basic ${base64String}`,
                    'GQ-API-Key': config.GRAYQUEST.API_KEY,
                },
                body: JSON.stringify(payload),
            };
            let gqResponse;
            try {
                gqResponse = (await axios(options)).data;
            } catch (e) {
                console.error(e);
            }

            return JSON.parse(gqResponse);
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'GrayQuest', source: 'verifySignature', error: errorLog });
        }
    }
};
