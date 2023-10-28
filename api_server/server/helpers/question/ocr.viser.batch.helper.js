const moment = require('moment');
const _ = require('lodash');
const redisKeys = require('../../../modules/redis/keys');
const QuestionRedis = require('../../../modules/redis/question');
// const Utility = require('../../../modules/utility');

class ViserOcrBatchApi {
    static batchPoolSize = 2;

    maxRetryCount = 3;

    backOffTimer = 600;

    maxWaitTimeBeforeApiCall = 5000;

    viserOcrBatchRequestsProcessingHashPrefix = redisKeys.viserOcrBatchRequestsProcessing.keyPrefix;

    static individualBatchRequestIdentifierHashKeyPrefix = 'REQ';

    static individualBatchResponseIdentifierHashKeyPrefix = 'RES';

    viserBatchApiRequestProgressStatus = {
        500: 'REQUEST REJECTED // ERROR',
        0: 'POOLING',
        1: 'API CALL IN PROGRESS',
        200: 'API CALL RESPONSE RESOLVED',
    };

    constructor(questionId, questionImage) {
        this.questionId = questionId;
        this.questionImage = questionImage;
        this.batchHashAccessKey = this.getBatchHashAccessKey();
    }

    static setViserBatchApiCallSuccessResponsesInRedisHash(db, responses, identifier, batchHashDetails, responseTime) {
        const responseMap = {};
        const responsesByUrlsSortedByIndex = _.get(responses, 'result.url', new Array(ViserOcrBatchApi.batchPoolSize).fill(null));
        let iterator = 1;
        let responsePointer = 1;
        while (iterator <= ViserOcrBatchApi.batchPoolSize) {
            const requestAccessKey = `${ViserOcrBatchApi.individualBatchRequestIdentifierHashKeyPrefix}:${iterator}`;
            const requestInfo = batchHashDetails[requestAccessKey];
            if (requestInfo && requestInfo.split(':')[1] !== 'TEXT') {
                responseMap[`${ViserOcrBatchApi.individualBatchResponseIdentifierHashKeyPrefix}:${iterator}`] = JSON.stringify(responsesByUrlsSortedByIndex[responsePointer - 1]);
                responsePointer += 1;
            }
            iterator += 1;
        }
        const objToUpdatePoolHash = {
            ...responseMap,
            requestProgress: 200,
            viserResponseTime: responseTime,
        };
        return QuestionRedis.hsetBatchApiRequestDetails(db.redis.write, identifier, objToUpdatePoolHash);
    }

    static setViserBatchApiCallFailureResponsesInRedisHash(db, responses, identifier) {
        const objToUpdatePoolHash = {
            requestProgress: 500,
            toPoolCount: 0,
        };
        return QuestionRedis.hsetBatchApiRequestDetails(db.redis.write, identifier, objToUpdatePoolHash);
    }

    setQuestionImage(questionImage) {
        this.questionImage = questionImage;
    }

    getBatchHashAccessKey() {
        const uniqueSuffixByBatch = Math.floor(parseInt(this.questionId) / ViserOcrBatchApi.batchPoolSize);
        return `${this.viserOcrBatchRequestsProcessingHashPrefix}:${uniqueSuffixByBatch}`;
    }

    getRequestIndentifier = () => {
        let uniqueSuffixByRequest = (parseInt(this.questionId) % ViserOcrBatchApi.batchPoolSize);
        if (uniqueSuffixByRequest === 0) {
            uniqueSuffixByRequest = ViserOcrBatchApi.batchPoolSize;
        }
        return uniqueSuffixByRequest;
    }

    getIndividualBatchRequestHashKey() {
        const uniqueSuffixByRequest = this.getRequestIndentifier();
        return `${ViserOcrBatchApi.individualBatchRequestIdentifierHashKeyPrefix}:${uniqueSuffixByRequest}`;
    }

    getIndividualBatchResponseHashKey() {
        const uniqueSuffixByResponse = this.getRequestIndentifier();
        return `${ViserOcrBatchApi.individualBatchResponseIdentifierHashKeyPrefix}:${uniqueSuffixByResponse}`;
    }

    async getBatchHashDetails(db) {
        const hashAccessKey = this.batchHashAccessKey;
        return QuestionRedis.getViserBatchRequestDetails(db.redis.read, hashAccessKey);
    }

    // STALE IMPLN
    initBatchHash(db, requestDetails = {}) {
        const hashAccessKey = this.batchHashAccessKey;
        const details = {
            ...requestDetails,
            initTimestamp: moment().unix(),
            requestProgress: 0,
        };
        return QuestionRedis.hsetBatchApiRequestDetails(db.redis.write, hashAccessKey, details);
    }

    // STALE IMPL
    poolRequestsInBatchHash(db, requestDetails = {}) {
        const hashAccessKey = this.batchHashAccessKey;
        const details = {
            ...requestDetails,
        };
        return QuestionRedis.hsetBatchApiRequestDetails(db.redis.write, hashAccessKey, details);
    }

    async poolTextQuestionsInBatchHash(db, config, UtilityModule) {
        const requestDetails = this.getIndividualRequestObjectToAddInRedis();
        const hashAccessKey = this.batchHashAccessKey;
        const ocrRequestRegisterRedisResponse = await QuestionRedis.registerOcrRequestInRedis(db.redis.write, this.batchHashAccessKey, requestDetails);
        const poolCount = _.get(ocrRequestRegisterRedisResponse, '[1][1]', 0);
        const timestamp = moment().unix();
        if (parseInt(poolCount) >= ViserOcrBatchApi.batchPoolSize) {
            const hashDetails = await this.getBatchHashDetails(db);
            await UtilityModule.callViserApi(this.generateUrlPayloadForBatchRequest(hashDetails, config), this.batchHashAccessKey, null, true, hashDetails, db);
        } else if (parseInt(poolCount) === 1) {
            const initDetailsToUpdate = {
                initTimestamp: timestamp,
                requestProgress: 0,
            };
            await QuestionRedis.hsetBatchApiRequestDetails(db.redis.write, hashAccessKey, initDetailsToUpdate);
        }
    }

    isRequestStatusEligibleToExecuteRetry(retryCounter, batchHashInitiationTimestamp) {
        if (retryCounter > this.maxRetryCount) {
            return false;
        }
        return true;
    }

    isQuestionImageWithoutBaseUrlValidToCallApi(image) {
        return !(image === 'TEXT');
    }

    generateUrlPayloadForBatchRequest(hashDetails, config) {
        try {
            const urls = [];
            for (let i = 0; i < ViserOcrBatchApi.batchPoolSize; i++) {
                const key = `${ViserOcrBatchApi.individualBatchRequestIdentifierHashKeyPrefix}:${i + 1}`;
                const hashDetailsByKey = hashDetails[key];
                if (typeof hashDetailsByKey !== 'undefined') {
                    const questionImageWithoutBaseUrl = hashDetails[key].split(':')[1];
                    if (this.isQuestionImageWithoutBaseUrlValidToCallApi(questionImageWithoutBaseUrl)) {
                        urls.push(`${config.question_image_s3_prefix}images/${questionImageWithoutBaseUrl}`);
                    }
                }
            }
            return urls;
        } catch (e) {
            console.log('errors from the generate url payloads');
            console.log(hashDetails);
        }
    }

    static checkIfResponseCodeIsValid(response) {
        if (!response) return false;
        const {
            requestProgress,
        } = response;
        if (parseInt(requestProgress) === 500) {
            return false;
        }
        return true;
    }

    static checkIfResponseIsBySuccessBlock(response) {
        if (_.isEmpty(response)) {
            return false;
        }
        return true;
    }

    getViserOcrBatchApiResponseConsistentToRequestByApiCall(response) {
        const identifier = this.getRequestIndentifier();
        response = {
            ...response,
            result: {
                ...response.result,
                url: [response.result.url[identifier - 1]],
            },
        };
        return response;
    }

    getViserOcrBatchApiResponseConsistentToRequestByRedisResponse(redisResponse) {
        const identifier = this.getIndividualBatchResponseHashKey();
        const ocrResponse = redisResponse[identifier];
        return {
            message: 'SUCCESS',
            result: {
                url: [JSON.parse(ocrResponse)],
            },
            status: 200,
        };
    }

    getIndividualRequestObjectToAddInRedis() {
        return {
            [this.getIndividualBatchRequestHashKey()]: `${this.questionId}:${this.questionImage}`,
        };
    }

    async handleZerothOcrExtractionAttempt(db, config, hashDetails, UtilityModule, esLogger) {
        const requestDetails = this.getIndividualRequestObjectToAddInRedis();
        const timestamp = moment().unix();
        const ocrRequestRegisterRedisResponse = await QuestionRedis.registerOcrRequestInRedis(db.redis.write, this.batchHashAccessKey, requestDetails);
        const poolCount = _.get(ocrRequestRegisterRedisResponse, '[1][1]', 0);

        if (parseInt(poolCount) === 1) {
            const initDetailsToUpdate = {
                initTimestamp: timestamp,
                requestProgress: 0,
            };
            await QuestionRedis.hsetBatchApiRequestDetails(db.redis.write, this.batchHashAccessKey, initDetailsToUpdate);
        }

        if (poolCount >= ViserOcrBatchApi.batchPoolSize) {
            hashDetails = await this.getBatchHashDetails(db);
            if (typeof esLogger !== 'undefined') {
                esLogger.batchOcrFetchDetails = {
                    retries: 0,
                    source: 'CALLER_OF_REDIS_RESPONSE',
                };
            }
            return UtilityModule.callViserApi(this.generateUrlPayloadForBatchRequest(hashDetails, config), this.batchHashAccessKey, null, true, hashDetails, db);
        }
        return null;
    }

    async getOcr(db, config, UtilityModule, esLogger, retryCounter = 0) {
        try {
            let response;
            const hashDetails = await this.getBatchHashDetails(db);
            if (retryCounter === 0) {
                response = await this.handleZerothOcrExtractionAttempt(db, config, hashDetails, UtilityModule, esLogger);
                if (!_.isNull(response)) {
                    if (ViserOcrBatchApi.checkIfResponseIsBySuccessBlock(response)) {
                        return this.getViserOcrBatchApiResponseConsistentToRequestByApiCall(response);
                    }
                    throw new Error('ERROR IN VISER RESPONSE CALL');
                }
            }
            if (!_.isNull(hashDetails) && !_.isEmpty(hashDetails)) {
                const {
                    initTimestamp,
                } = hashDetails;
                const requestProgress = hashDetails.requestProgress ? parseInt(hashDetails.requestProgress) : 0;
                if (requestProgress === 0) {
                    if (this.isRequestStatusEligibleToExecuteRetry(retryCounter, initTimestamp)) {
                        await new Promise((resolve) => setTimeout(resolve, this.backOffTimer));
                        return this.getOcr(db, config, UtilityModule, esLogger, retryCounter + 1);
                    }
                    throw new Error('API RETRY EXHAUSTED');
                } else if (requestProgress === 200) {
                    if (typeof esLogger !== 'undefined') {
                        esLogger.batchOcrFetchDetails = {
                            retries: retryCounter,
                            source: 'REDIS_RESPONSE',
                        };
                    }
                    return this.getViserOcrBatchApiResponseConsistentToRequestByRedisResponse(hashDetails);
                } else if (requestProgress === 500) {
                    throw new Error('ERROR IN VISER RESPONSE');
                }
            } else {
                if (retryCounter === 0) {
                    await new Promise((resolve) => setTimeout(resolve, this.backOffTimer));
                    return this.getOcr(db, config, UtilityModule, esLogger, retryCounter + 1);
                }
                throw new Error('HASH IS STILL EMPTY');
            }
        } catch (e) {
            console.log(e);
            if (typeof esLogger !== 'undefined') {
                esLogger.batchOcrFetchDetails = {
                    retries: retryCounter,
                    source: 'CATCH BLOCK',
                    error: e.message,
                };
            }
            return UtilityModule.callViserApi(`${config.question_image_s3_prefix}images/${this.questionImage}`, this.batchHashAccessKey, null, false, null, db);
        }
    }
}

module.exports = ViserOcrBatchApi;
