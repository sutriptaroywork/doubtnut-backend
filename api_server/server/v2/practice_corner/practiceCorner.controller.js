const _ = require('lodash');
const logger = require('../../../config/winston').winstonLogger;
const PracticeCornerManager = require('../../helpers/practiceCorner.helper');

async function fullLengthTestHistory(request, response, next) {
    try {
        const practiceCornerManager = new PracticeCornerManager(request);
        const data = await practiceCornerManager.fullLengthTestHistoryV2();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return response.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        let errorLog = e;
        if (!_.isObject(errorLog)) {
            errorLog = JSON.stringify(errorLog);
        }
        logger.error({ tag: 'practice_corner', source: 'fullLengthTestHistory', error: errorLog });
        next(e);
    }
}

module.exports = {
    fullLengthTestHistory,
};
