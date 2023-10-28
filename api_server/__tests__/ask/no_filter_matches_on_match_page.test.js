require('dotenv').config({ path: '../../.env.dev' });
const moment = require('moment');
const fuzz = require('fuzzball');
const mockRequest = require('request');
const Data = require('../../data/data');
const QuestionHelper = require('../../server/helpers/question.helper');
const config = require('../../config/config');
const MatchedQuestionArrayItem = require('../schemas/matchedQuestionsArrayItem');
const Utility = require('../../modules/utility');
const { addNoFilterMatchesArrWidget } = require('../../middlewares/generateAskResponse');

const db = {
    redis: {
        read: 'redis read',
        write: 'redis write',
    },
};

describe('no filter matches on match page', () => {
    let attachment;
    let noFilterMatchesOnMatchPageAttachment;
    beforeEach(() => {
        attachment = Data.SEARCH_SERVICE_DEFAULT_VERSION;
        noFilterMatchesOnMatchPageAttachment = {
            enabled: true,
            onlyVideoMatches: true,
            positionOfMatches: 3,
            suggestionCount: 2,
            title: {
                en: 'More videos from doubtnut',
                hi: 'अन्य भाषा के वीडियो ',
            },
        };
        QuestionHelper.callSearchServiceForv3 = jest.fn().mockImplementation(async (config, attachment, isStaging) => new Promise((resolve) => {
            const matchesArray = {
                hits: {
                    hits: [
                        new MatchedQuestionArrayItem('1', 'MATHS', 'en', 'a1b1', 100, 'video'),
                        new MatchedQuestionArrayItem('2', 'MATHS', 'en', 'a1b1', 200, 'video'),
                        new MatchedQuestionArrayItem('3', 'MATHS', 'gu', 'a1b1', 300, 'video'),
                        new MatchedQuestionArrayItem('4', 'MATHS', 'en', 'a2b2', 400, 'video'),
                    ],
                },
            };
            if (attachment.userLanguages) {
                matchesArray.hits.hits = matchesArray.hits.hits.filter((x) => attachment.userLanguages.includes(x._source.video_language));
            }
            resolve([matchesArray, 10, null]);
        }));
    });

    test('default flow', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        const ssResponse = await QuestionHelper.handleElasticSearchWrapper({
            db,
            ocr: 'Hello world',
            elasticIndex: 'question_bank',
            stockWordList: null,
            useStringDiff: true,
            language: 'en',
            locale: 'en',
            fuzz,
            UtilityModule: Utility,
            studentId: '1',
            ocrType: '7',
            isDiagramPresent: false,
            variantAttachment: attachment,
            config,
            studentClass: 11,
            searchFieldName: 'ocr_text',
            questionLocale: 'en',
            userProfile: {
                appLocale: 'en',
                schoolBoard: 'CBSE',
                questionLocale: 'en',
            },
            questionId: 100,
        }, config);

        expect(ssResponse.stringDiffResp.length).toBe(5);
        expect(ssResponse.stringDiffRespNoFilter.length).toBe(3);
        expect(ssResponse.stringDiffRespNoFilter[0].length).toBe(0);
        expect(ssResponse.stringDiffRespNoFilter[1].length).toBe(0);
        expect(ssResponse.stringDiffRespNoFilter[2].length).toBe(0);
    });

    test('no filter matches not present', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        const ssResponse = await QuestionHelper.handleElasticSearchWrapper({
            db,
            ocr: 'Hello world',
            elasticIndex: 'question_bank',
            stockWordList: null,
            useStringDiff: true,
            language: 'en',
            locale: 'en',
            fuzz,
            UtilityModule: Utility,
            studentId: '1',
            ocrType: '7',
            isDiagramPresent: false,
            variantAttachment: attachment,
            config,
            studentClass: 11,
            searchFieldName: 'ocr_text',
            questionLocale: 'en',
            userProfile: {
                appLocale: 'en',
                schoolBoard: 'CBSE',
                questionLocale: 'en',
            },
            questionId: 100,
            noFilterMatchesOnMatchPageAttachment,
        }, config);

        expect(ssResponse.stringDiffResp.length).toBe(5);
        expect(ssResponse.stringDiffRespNoFilter.length).toBe(3);
        expect(ssResponse.stringDiffRespNoFilter[0].length).toBe(1);
        expect(ssResponse.stringDiffRespNoFilter[1].length).toBe(1);
        expect(ssResponse.stringDiffRespNoFilter[2].length).toBe(1);
    });

    test('check whether widget is getting added', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        const matchesArray = [
            new MatchedQuestionArrayItem('1', 'MATHS', 'en', 'a1b1', 100, 'video', 'Helio wierd'),
            new MatchedQuestionArrayItem('2', 'MATHS', 'en', 'a1b1', 200, 'video'),
            new MatchedQuestionArrayItem('3', 'MATHS', 'hi-en', 'a1b1', 300, 'video'),
            new MatchedQuestionArrayItem('4', 'MATHS', 'en', 'a2b2', 400, 'video'),
        ];

        const noFilterMatchesArray = [
            new MatchedQuestionArrayItem('5', 'MATHS', 'ta-en', 'a1b1', 100, 'video', 'Hello world'),
            new MatchedQuestionArrayItem('6', 'MATHS', 'gu', 'a1b1', 200, 'video'),
        ];

        addNoFilterMatchesArrWidget({ userQuestionsAnalysisLogging: {}, user: { locale: 'en' } }, noFilterMatchesArray, matchesArray, 'en', 'en', 1234, { variantAttachment: attachment, noFilterMatchesOnMatchPageAttachment }, 'Hello world');

        expect(matchesArray.length).toBe(5);
        expect(matchesArray[noFilterMatchesOnMatchPageAttachment.positionOfMatches]).toHaveProperty('widget_data');
    });

    test('partial ratio check', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        const matchesArray = [
            new MatchedQuestionArrayItem('1', 'MATHS', 'en', 'a1b1', 100, 'video', 'What the value of `x-2`?'),
            new MatchedQuestionArrayItem('2', 'MATHS', 'en', 'a1b1', 200, 'video'),
        ];

        const noFilterMatchesArray = [
            new MatchedQuestionArrayItem('5', 'MATHS', 'ta-en', 'a1b1', 100, 'video', 'Define Pythagoras theorem'),
            new MatchedQuestionArrayItem('6', 'MATHS', 'gu', 'a1b1', 200, 'video'),
        ];

        addNoFilterMatchesArrWidget({ userQuestionsAnalysisLogging: {}, user: { locale: 'en' } }, noFilterMatchesArray, matchesArray, 'en', 'en', 1234, { variantAttachment: attachment, noFilterMatchesOnMatchPageAttachment }, 'Find value of `x-2`?');

        expect(matchesArray.length).toBe(2);
    });

    test('equation match check', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        const matchesArray = [
            new MatchedQuestionArrayItem('1', 'MATHS', 'en', 'a1b1', 100, 'video', 'Helio wierd', ['equation_match']),
            new MatchedQuestionArrayItem('2', 'MATHS', 'en', 'a1b1', 200, 'video'),
        ];

        const noFilterMatchesArray = [
            new MatchedQuestionArrayItem('5', 'MATHS', 'ta-en', 'a1b1', 100, 'video', 'Hello world', ['text_match']),
            new MatchedQuestionArrayItem('6', 'MATHS', 'gu', 'a1b1', 200, 'video'),
        ];

        addNoFilterMatchesArrWidget({ userQuestionsAnalysisLogging: {}, user: { locale: 'en' } }, noFilterMatchesArray, matchesArray, 'en', 'en', 1234, { variantAttachment: attachment, noFilterMatchesOnMatchPageAttachment }, 'Hello World');

        expect(matchesArray.length).toBe(2);
    });

    test('search error', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        QuestionHelper.callSearchServiceForv3 = jest.fn().mockImplementation(async (config, attachment, isStaging) => new Promise((resolve) => {
            resolve([{ hits: { hits: [] }, searchError: 'error' }, 10, 'error']);
        }));

        QuestionHelper.callViserSearch = jest.fn().mockImplementation(async (config, attachment, questionId) => new Promise((resolve) => {
            const matchesArray = {
                hits: {
                    hits: [
                        new MatchedQuestionArrayItem(1, 'MATHS', 'en', 'a1b1', 100, 'video'),
                        new MatchedQuestionArrayItem(2, 'MATHS', 'en', 'a1b1', 200, 'video'),
                        new MatchedQuestionArrayItem(3, 'MATHS', 'gu', 'a1b1', 300, 'video'),
                        new MatchedQuestionArrayItem(4, 'MATHS', 'en', 'a2b2', 400, 'video'),
                    ],
                },
            };
            resolve([matchesArray, 10, null]);
        }));

        const ssResponse = await QuestionHelper.handleElasticSearchWrapper({
            db,
            ocr: 'Hello world',
            elasticIndex: 'question_bank',
            stockWordList: null,
            useStringDiff: true,
            language: 'en',
            locale: 'en',
            fuzz,
            UtilityModule: Utility,
            studentId: '1',
            ocrType: '7',
            isDiagramPresent: false,
            isStaging: false,
            variantAttachment: attachment,
            config,
            studentClass: 11,
            searchFieldName: 'ocr_text',
            questionLocale: 'en',
            userProfile: {
                appLocale: 'en',
                schoolBoard: 'CBSE',
                questionLocale: 'en',
            },
            questionId: 100,
            noFilterMatchesOnMatchPageAttachment,
        }, config);

        expect(ssResponse.stringDiffResp.length).toBe(5);
        expect(ssResponse.stringDiffRespNoFilter.length).toBe(3);
        expect(ssResponse.stringDiffRespNoFilter[0].length).toBe(0);
        expect(ssResponse.stringDiffRespNoFilter[1].length).toBe(0);
        expect(ssResponse.stringDiffRespNoFilter[2].length).toBe(0);
    });

    test('viser diagram case', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: true,
        };

        QuestionHelper.callViserDiagramMatcher = jest.fn().mockImplementation(async (config, attachment, questionId) => new Promise((resolve) => {
            const matchesArray = {
                hits: {
                    hits: [
                        new MatchedQuestionArrayItem('10', 'MATHS', 'te-en', 'a1b1', 100, 'video'),
                    ],
                },
            };
            resolve([matchesArray, 10, null]);
        }));

        const ssResponse = await QuestionHelper.handleElasticSearchWrapper({
            db,
            ocr: 'Hello world',
            elasticIndex: 'question_bank',
            stockWordList: null,
            useStringDiff: true,
            language: 'en',
            locale: 'en',
            fuzz,
            UtilityModule: Utility,
            studentId: '1',
            ocrType: '7',
            isDiagramPresent: true,
            isStaging: false,
            variantAttachment: attachment,
            config,
            studentClass: 11,
            searchFieldName: 'ocr_text',
            questionLocale: 'en',
            userProfile: {
                appLocale: 'en',
                schoolBoard: 'CBSE',
                questionLocale: 'en',
            },
            questionId: 100,
            noFilterMatchesOnMatchPageAttachment,
        }, config);

        expect(ssResponse.stringDiffResp.length).toBe(5);
        expect(ssResponse.stringDiffResp[0].length).toBe(4);
        expect(ssResponse.stringDiffRespNoFilter.length).toBe(3);
        expect(ssResponse.stringDiffRespNoFilter[0].length).toBe(1);
        expect(ssResponse.stringDiffRespNoFilter[0][0]._id).not.toBe('10');
    });
    test('synonyms replace function check', () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        const ocrText1 = 'Calculate the value of "94372times36+64times94372"';
        const ocrText2 = 'Find how many Number of times one need to toss the coin given: "94372times36+64times94372"';
        const ocrText3 = 'Calculate The value OF csc "ln(100)times36+csc(pi)" and length is "945"m.';
        const ocrText4 = 'find "ln(100)times36+csc(pi)ihat hat"';

        const handleSynonymsResponse1 = QuestionHelper.preprocessOcrForNoFilterMatches(ocrText1);
        const handleSynonymsResponse2 = QuestionHelper.preprocessOcrForNoFilterMatches(ocrText2);
        const handleSynonymsResponse3 = QuestionHelper.preprocessOcrForNoFilterMatches(ocrText3);
        const handleSynonymsResponse4 = QuestionHelper.preprocessOcrForNoFilterMatches(ocrText4);

        expect(handleSynonymsResponse1).toBe('calculate the value of \'94372xx36+64xx94372\'');
        expect(handleSynonymsResponse2).toBe('find how many number of times one need to toss the coin given: \'94372xx36+64xx94372\'');
        expect(handleSynonymsResponse3).toBe('calculate the value of csc \'log(100)xx36+cosec(pi)\' and length is \'945\'m.');
        expect(handleSynonymsResponse4).toBe('find \'log(100)xx36+cosec(pi)itilde tilde\'');
    });

    test('suggestion count value greater than matches array length', async () => {
        attachment = {
            ...attachment,
            useViserSearch: false,
            useViserDiagramMatcher: false,
        };

        noFilterMatchesOnMatchPageAttachment.suggestionCount = 100;

        const matchesArray = [
            new MatchedQuestionArrayItem('1', 'MATHS', 'en', 'a1b1', 100, 'video', 'Helio wierd'),
            new MatchedQuestionArrayItem('2', 'MATHS', 'en', 'a1b1', 200, 'video'),
            new MatchedQuestionArrayItem('3', 'MATHS', 'hi-en', 'a1b1', 300, 'video'),
            new MatchedQuestionArrayItem('4', 'MATHS', 'en', 'a2b2', 400, 'video'),
        ];

        const noFilterMatchesArray = [
            new MatchedQuestionArrayItem('5', 'MATHS', 'ta-en', 'a1b1', 100, 'video', 'Hello world'),
            new MatchedQuestionArrayItem('6', 'MATHS', 'gu', 'a1b1', 200, 'video'),
        ];

        addNoFilterMatchesArrWidget({ userQuestionsAnalysisLogging: {}, user: { locale: 'en' } }, noFilterMatchesArray, matchesArray, 'en', 'en', 1234, { variantAttachment: attachment, noFilterMatchesOnMatchPageAttachment }, 'Hello World');

        expect(matchesArray.length).toBe(5);
        expect(matchesArray[noFilterMatchesOnMatchPageAttachment.positionOfMatches]).toHaveProperty('widget_data');
    });
});
