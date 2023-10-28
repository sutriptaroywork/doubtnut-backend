require('dotenv').config({ path: '../../.env.dev' });
const ViserOcrBatchApi =  require('../../server/helpers/question/ocr.viser.batch.helper');
const QuestionRedis = require('../../modules/redis/question');
const mockRequest = require('request');
let viserOcrBatchApi;
const question_id = 1002;
const questionImage = 'question1.png';
const Utility = require('../../modules/utility');
const config = require('../../config/config');
const moment = require('moment');

const db = {
    redis: {
        read: "redis read",
        write: "redis write",
    }
};

const image_url = "https://testing.png";
const variantAttachment = {
    name: 'viser_ocr'
};


const apiCall = require('./viser_ocr');

describe('test viser api batch processing',  () => {
    beforeAll(() => {
        viserOcrBatchApi = new ViserOcrBatchApi(question_id, questionImage);
    });

    test('batch api hash generation function',  () => {
        const hashAccessKey = viserOcrBatchApi.getBatchHashAccessKey();
        expect(hashAccessKey).toBe('VISER_OCR_BATCH:250');
    });

    test('batch api individual request hash key',  () => {
        const hashKey = viserOcrBatchApi.getIndividualBatchRequestHashKey();
        expect(hashKey).toBe('REQ:2');
    });

    test('batch api individual response hash key',  () => {
        const hashKey = viserOcrBatchApi.getIndividualBatchResponseHashKey();
        expect(hashKey).toBe('RES:2');
    });

    test('init batch api function', async  () => {
        const redisSetDetailsfunction = jest.fn();
        const hashAccessKey = viserOcrBatchApi.getBatchHashAccessKey();
        QuestionRedis.hsetBatchApiRequestDetails = redisSetDetailsfunction;
        await viserOcrBatchApi.initBatchHash(db);
        expect(QuestionRedis.hsetBatchApiRequestDetails).toHaveBeenCalledTimes(1);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][1]).toBe(hashAccessKey);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][2]['toPoolCount']).toBe(3);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][2]['requestProgress']).toBe(0);
    });

    test('test individual request object in redis', () => {
       const obj =  viserOcrBatchApi.getIndividualRequestObjectToAddInRedis();
       const expectedRequestObj = {
            'REQ:2': '1002:question1.png',
       };
       expect(obj).toMatchObject(expectedRequestObj);
    });
});

// TODO : test for string cases of codes or undefined in some cases as well
describe('test get ocr function', () => {
    let viserSuccessResponseBody;
    let ocrResponseBody;
    beforeEach(() => {
        viserOcrBatchApi = new ViserOcrBatchApi(question_id, questionImage);
        viserOcrBatchApi.getIndividualRequestObjectToAddInRedis = jest.fn().mockReturnValue({
            'REQ:2':  '1002:question1.png',
        });
        viserSuccessResponseBody = {
            message: 'SUCCESS',
            result: {
                url: [],
            }
        };
        ocrResponseBody =  {
            "Blurscore": 0.0,
            "Diagram": 0,
            "Diagramscore": 0.0,
            "Language": [
                "en"
            ],
            "Mathscore": 0.31,
            "OCR": "OCR TEXT",
            "Orientation": "0",
            "Orientationscore": 1.0,
            "Printed": 1,
            "Printedscore": 1.0,
            "Score": 1.0,
            "ZMSG": "SuccEss IMG INFO: W:1350 | H:332 | R:4.07 | C:-2 | S:0 | DT: 0.09 GT: 0.36"
        };
        Utility.callViserApi = jest.fn().mockImplementation((url , qid,  variantAttachment,  isBatchRequest) => {
            return new Promise((resolve)=>{
                let response;
                if (isBatchRequest) {
                    ocrResponseBody.OCR = 'HELLO WORLD';
                    viserSuccessResponseBody.result.url =  [...new Array(4)].map((elem, index) => {
                        return {
                            ...ocrResponseBody,
                            OCR: `HELLO WORLD:${index + 1}`,
                        };
                    });
                    response =  { ...viserSuccessResponseBody };
                } else {
                    ocrResponseBody.OCR = 'HELLO WORLD'
                    viserSuccessResponseBody.result.url = [ocrResponseBody];
                    response =  { ...viserSuccessResponseBody };
                }
                resolve(response);
            });
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    })
    test('test when no pooling is going to happen with first retry',  async () => {
        let hashDetails = null;
        viserOcrBatchApi.handleZerothOcrExtractionAttempt = jest.fn().mockImplementation(async () => {
            const requestDetails = viserOcrBatchApi.getIndividualRequestObjectToAddInRedis();
            await viserOcrBatchApi.initBatchHash(db, requestDetails);
            return null;
        });

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        jest.spyOn(QuestionRedis, "hsetBatchApiRequestDetails").mockImplementation((db, hashKey, details) => {
            return new Promise((resolve) => {
                hashDetails = {
                    ...details,
                };
                resolve();
            });
        })
        const ocrDetails = await viserOcrBatchApi.getOcr(db, config, Utility, 0);
        expect(viserOcrBatchApi.handleZerothOcrExtractionAttempt).toHaveBeenCalledTimes(1);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(1);
        expect(ocrDetails.message).toBe("SUCCESS");
        expect(ocrDetails.result.url).toBeInstanceOf(Object);
        expect(ocrDetails.result.url[0]['OCR']).toBe('HELLO WORLD');
    });

    test(' when only ocr is left to pool', async() => {
        let hashDetails = {
            'REQ:1': '1:question1.png',
            // 'RES:2': '2:question2.png',
            'REQ:3': '3:question3.png',
            'REQ:4': '4:question4.png',
            requestProgress: 0,
            initTimestamp: moment().unix(),
            toPoolCount: '1',
        };

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        viserOcrBatchApi.initBatchHash = jest.fn();

        const ocrDetails = await viserOcrBatchApi.getOcr(db, config, Utility, 0);
        expect(viserOcrBatchApi.initBatchHash).toHaveBeenCalledTimes(0);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(1);
        expect(ocrDetails.message).toBe("SUCCESS");
        expect(ocrDetails.result.url).toBeInstanceOf(Object);
        expect(Utility.callViserApi.mock.calls[0][3]).toBe(true);
        expect(Utility.callViserApi.mock.calls[0][1]).toBe('VISER_OCR_BATCH:250');
        expect(ocrDetails.result.url[0]['OCR']).toBe(`HELLO WORLD:${viserOcrBatchApi.getRequestIndentifier()}`);
    });

    test('when max timeout is already passed and retry counter is greater than 0', async () => {
        let hashDetails = {
            'REQ:1': '1:question1.png',
            requestProgress: '0',
            initTimestamp: moment().unix(),
            toPoolCount: 3,
        };
        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        await new Promise((resolve) => setTimeout(resolve, 2000));
        const ocrDetails = await viserOcrBatchApi.getOcr(db, config, Utility, 1);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(1);
        expect(ocrDetails.result.url[0]['OCR']).toBe(`HELLO WORLD`);
        expect(Utility.callViserApi.mock.calls[0][3]).toBe(false);
    });

    test('api response is already in redis,  200 progress', async () => {
        let hashDetails = {
            'REQ:1': '1:question1.png',
            'REQ:2': '2:question2.png',
            'REQ:3': '3:question3.png',
            'REQ:4': '4:question4.png',
            requestProgress: '200',
            initTimestamp: moment().unix(),
            toPoolCount: 1,
            'RES:1': JSON.stringify({
                ...ocrResponseBody,
                OCR: 'HELLO WORLD 1',
            }),
            'RES:2': JSON.stringify({
                ...ocrResponseBody,
                OCR: 'HELLO WORLD 2',
            }),
            'RES:3': JSON.stringify({
                ...ocrResponseBody,
                OCR: 'HELLO WORLD 3',
            }),
            'RES:4': JSON.stringify({
                ...ocrResponseBody,
                OCR: 'HELLO WORLD 4',
            }),
        };
        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        const ocrDetails = await viserOcrBatchApi.getOcr(db, config, Utility, 1);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(0);
        expect(ocrDetails.message).toBe("SUCCESS");
        expect(ocrDetails.result.url).toBeInstanceOf(Object);
        expect(ocrDetails.result.url[0]['OCR']).toBe('HELLO WORLD 2');
    });


    test('api response is already in redis,  500 error case', async () => {
        let hashDetails = {
            'REQ:1': '1:question1.png',
            'REQ:2': '2:question2.png',
            'REQ:3': '3:question3.png',
            'REQ:4': '4:question4.png',
            requestProgress: '500',
            initTimestamp: moment().unix(),
            toPoolCount: 1,
        };
        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        await new Promise((resolve) => setTimeout(resolve, 300));
        const ocrDetails = await viserOcrBatchApi.getOcr(db, config, Utility, 1);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(1);
        expect(Utility.callViserApi.mock.calls[0][3]).toBe(false);
        expect(ocrDetails.message).toBe("SUCCESS");
        expect(ocrDetails.result.url).toBeInstanceOf(Object);
        expect(ocrDetails.result.url[0]['OCR']).toBe('HELLO WORLD');
    });


    test('test pooling of requests in hash', async () => {
        let hashDetails = {
            'REQ:1': '1:question1.png',
            'REQ:3': '1:question1.png',
            requestProgress: 0,
            initTimestamp: moment().unix(),
            toPoolCount: 2,
        };
        await new Promise((resolve) => setTimeout(resolve, 300));
        jest.spyOn(QuestionRedis, "hsetBatchApiRequestDetails").mockImplementation((db, hash,  details) => {
            return new Promise((resolve) => resolve());
        });

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        const ocrDetails = await viserOcrBatchApi.getOcr(db, config, Utility, 0);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][2]).toBeInstanceOf(Object);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][2]['toPoolCount']).toBe(1);
    });
});


describe('batch processing with text requests',  () => {
    let viserSuccessResponseBody;
    let ocrResponseBody;
    beforeEach(() => {
        viserSuccessResponseBody = {
            message: 'SUCCESS',
            result: {
                url: [],
            }
        };
        ocrResponseBody =  {
            "Blurscore": 0.0,
            "Diagram": 0,
            "Diagramscore": 0.0,
            "Language": [
                "en"
            ],
            "Mathscore": 0.31,
            "OCR": "OCR TEXT",
            "Orientation": "0",
            "Orientationscore": 1.0,
            "Printed": 1,
            "Printedscore": 1.0,
            "Score": 1.0,
            "ZMSG": "SuccEss IMG INFO: W:1350 | H:332 | R:4.07 | C:-2 | S:0 | DT: 0.09 GT: 0.36"
        };

        Utility.callViserApi = jest.fn().mockImplementation((url , qid,  variantAttachment,  isBatchRequest, hashDetails) => {
            return new Promise(async (resolve)=>{
                let response;
                if (isBatchRequest) {
                    ocrResponseBody.OCR = 'HELLO WORLD';
                    viserSuccessResponseBody.result.url =  [...new Array(4)].map((elem, index) => {
                        return {
                            ...ocrResponseBody,
                            OCR: `HELLO WORLD:${index + 1}`,
                        };
                    });
                    response =  { ...viserSuccessResponseBody };
                    await ViserOcrBatchApi.setViserBatchApiCallSuccessResponsesInRedisHash(db, response, qid,  hashDetails);
                } else {
                    ocrResponseBody.OCR = 'HELLO WORLD'
                    viserSuccessResponseBody.result.url = [ocrResponseBody];
                    response =  { ...viserSuccessResponseBody };
                }
                resolve(response);
            });
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    test('when text question request is the last one to complete pool', async  () => {
        viserOcrBatchApi = new ViserOcrBatchApi(question_id, 'TEXT');
        let hashDetails = {
            'REQ:1': '1:question1.png',
            'REQ:3': '3:question3.png',
            'REQ:4': '4:question4.png',
            requestProgress: 0,
            initTimestamp: moment().unix(),
            toPoolCount: '1',
        };

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        await viserOcrBatchApi.poolTextQuestionsInBatchHash(db, config);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(1);
        expect(Utility.callViserApi.mock.calls[0][3]).toBe(true);
        expect(Utility.callViserApi.mock.calls[0][4]).toBeInstanceOf(Object);
    });

    test('when text question request is one in the pool', async  () => {
        viserOcrBatchApi = new ViserOcrBatchApi(question_id, 'question2.png');
        let hashDetails = {
            'REQ:1': '1:question1.png',
            'REQ:3': '3:TEXT',
            'REQ:4': '4:question4.png',
            requestProgress: 0,
            initTimestamp: moment().unix(),
            toPoolCount: '1',
        };

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        jest.spyOn(QuestionRedis, 'hsetBatchApiRequestDetails').mockImplementation((redisClient, hashKey, hashObject) => {
            return new Promise((resolve) => {
                hashDetails = {
                    ...hashDetails,
                    ...hashObject,
                }
                resolve();
            })
        });

        await viserOcrBatchApi.poolTextQuestionsInBatchHash(db, config);
        expect(Utility.callViserApi).toHaveBeenCalledTimes(1);
        expect(Utility.callViserApi.mock.calls[0][3]).toBe(true);
        expect(Utility.callViserApi.mock.calls[0][4]).toBeInstanceOf(Object);
        expect(QuestionRedis.hsetBatchApiRequestDetails).toHaveBeenCalledTimes(1);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][2]['RES:4']).toBe(JSON.stringify({
            ...ocrResponseBody,
            OCR: 'HELLO WORLD:3'
        }));
    });

    test('when text question is first request in the pool', async  () => {
        viserOcrBatchApi = new ViserOcrBatchApi(question_id, 'question2.png');
        let hashDetails = null;

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        viserOcrBatchApi.initBatchHash = jest.fn();

        await viserOcrBatchApi.poolTextQuestionsInBatchHash(db, config);
        expect( viserOcrBatchApi.initBatchHash).toHaveBeenCalledTimes(1);
    });

    test('when first three are text questions , last being image one', async  () => {
        viserOcrBatchApi = new ViserOcrBatchApi(question_id, 'question2.png');
        let hashDetails = {
            'REQ:1': '1:TEXT',
            'REQ:3': '3:TEXT',
            'REQ:4': '4:TEXT',
            requestProgress: 0,
            initTimestamp: moment().unix(),
            toPoolCount: '1',
        };

        jest.spyOn(QuestionRedis, "getViserBatchRequestDetails").mockImplementation((db, details) => {
            return new Promise((resolve) => resolve(hashDetails));
        });

        jest.spyOn(QuestionRedis, 'hsetBatchApiRequestDetails').mockImplementation((redisClient, hashKey, hashObject) => {
            return new Promise((resolve) => {
                hashDetails = {
                    ...hashDetails,
                    ...hashObject,
                }
                resolve();
            })
        });

        viserOcrBatchApi.initBatchHash = jest.fn();

        await viserOcrBatchApi.poolTextQuestionsInBatchHash(db, config);
        expect( viserOcrBatchApi.initBatchHash).toHaveBeenCalledTimes(0);
        expect(QuestionRedis.hsetBatchApiRequestDetails.mock.calls[0][2]['RES:2']).toBe(JSON.stringify({
            ...ocrResponseBody,
            OCR: 'HELLO WORLD:1',
        }));
    });

})



