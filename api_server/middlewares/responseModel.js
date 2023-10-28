const _ = require('lodash');
const logger = require('../config/winston').winstonLogger;
// const questionResponseModel = require("../responseModels/question/question")

function handleResponse(err, req, res, next) {
    // let splitted = req.originalUrl.split('/')
    // console.log(splitted)

    try {
        if (typeof err.error === 'undefined' || err.error) {
            next(err);
        } else {
            // no error

            const validateResponse = err.schema.ask.validate(err.data);
            if (typeof err.retry === 'undefined') {
                if (_.isNull(validateResponse.error)) {
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: err.data,
                    };
                    return res.status(responseData.meta.code).json(responseData);
                }
                logger.error({ tag: 'ask', source: 'handleResponse', error: validateResponse.error });

                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Response schema error',
                    },
                    data: validateResponse.error,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            if (_.isNull(validateResponse.error)) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: { value: err.data, retry: err.retry },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            logger.error({ tag: 'ask', source: 'handleResponse', error: validateResponse.error });

            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Response schema error',
                },
                data: validateResponse.error,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        logger.error({ tag: 'ask', source: 'handleResponse', error: e });
        next(e);
    }
}
module.exports = {
    handleResponse,
};
