const uuid = require('uuid');
const _ = require('lodash');
const fuzz = require('fuzzball');
const image2base64 = require('image-to-base64');
const mathsteps = require('mathsteps');
const moment = require('moment');
const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');
const axios = require('axios');
const { file } = require('googleapis/build/src/apis/file');
const { findLastIndex } = require('lodash');
const { Lambda } = require('aws-sdk');
const searchContainer = require('../../../modules/containers/search');
const Utility = require('../../../modules/utility');
const helper = require('../../helpers/question.helper');
const LanguageContainer = require('../../../modules/containers/language');
const StudentContainer = require('../../../modules/containers/student');
const QuestionContainer = require('../../../modules/containers/question');
const Questions = require('../../../modules/question.js');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const QuestionHelper = require('../../helpers/question.helper');
const Search = require('../../../modules/mysql/search');
const Data = require('../../../data/data');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const TydSuggestionsLogsMongo = require('../../../modules/mongo/tydSuggestionsLogs');
const UserQuestionOcrClusterMapping = require('../../../modules/userQuestionOcrClusterMapping');
const { TydSuggestions, getWebScrapingHandlersByType } = require('./search.helper');
const QuestionMysql = require('../../../modules/mysql/question');
const QuestionRedis = require('../../../modules/redis/question');

function generateData(page, tab, data) {
    if (page === 'topicPage') {
        // check tabs
        if (tab === 'all') {
            const chapterArray = [...data[0].suggest.chapters[0].options, ...data[0].hits.hits];
            const subtopicArray = [...data[1].suggest.subtopics[0].options, ...data[1].hits.hits];
            const conceptrray = [...data[2].suggest.microconcepts[0].options, ...data[2].hits.hits];
            let list = [...chapterArray, ...subtopicArray, ...conceptrray];
            list = _(list).uniqBy('_id');
            return list;
        }
    }
}

async function search(req, res, next) {
    try {
        const { text } = req.params;
        const db = req.app.get('db');
        const { tab } = req.params;
        const config = req.app.get('config');
        const { page } = req.params;
        let resolvedPromises;
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const topicTabs = [{ key: 'all', description: 'All' }, { key: 'chapters', description: 'Chapters' }, { key: 'subtopics', description: 'Subtopics' }, { key: 'microconcepts', description: 'Concepts' }];
        const promises = [];
        const data = {
            topicPage: {
                topicPage: ['chapters', 'subtopics', 'microconcepts'],
                chapters: {
                    tab: 'chapters',
                    field: 'chapter_display.completion',
                    ngramField: 'chapter_display.edgengram',
                },
                subtopics: { tab: 'subtopics', field: 'subtopic.completion', ngramField: 'subtopic.edgengram' },
                microconcepts: { tab: 'microconcepts', field: 'mc_text.completion', ngramField: 'mc_text.edgengram' },
            },
            home_page: {},
        };
        const isNgram = 1;
        const isSuggest = 1;
        if ((page === 'topicPage' && tab === 'all')) {
            for (let i = 0; i < data[page][tab].length; i++) {
                promises.push(elasticSearchInstance.findTopics(text, data[page][data[page][tab][i]], isSuggest, isNgram));
            }
            resolvedPromises = await Promise.all(promises);
        } else {
            // invalid page
        }

        const results = generateData(page, tab, resolvedPromises);
        const response = {
            tabs: topicTabs,
            list: results,
            cdn_path: `${config.cdn_url}images/`,
        };
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: response,
        };
        res.status(responseData.meta.code).json(responseData);
        await db.redis.write.zaddAsync('keywords_logs', Math.floor(Date.now() / 1000), text);
    } catch (e) {
        next(e);
    }
}

async function getSuggestions(req, res, next) {
    try {
        let { studentClass } = req.user;
        const db = req.app.get('db');
        const topicTabs = [{ key: 'all', description: 'All' }];
        if (studentClass == 14) {
            studentClass = _.shuffle([6, 7, 8, 9, 10, 11, 12]);
            studentClass = studentClass[0];
        }
        let data = await searchContainer.getSugg(studentClass, 15, 'english', db);
        data = data.filter((item) => ((item.chapter !== 'TIPS AND TRICKS') || (item.display !== null)));
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: {
                tabs: topicTabs,
                text: 'Trending Searches',
                list: data,
            },
        };
        return res.status(200).json(responseData);
    } catch (e) {
        // console.log(e)
        next(e);
    }
}

async function getMatchesFromSearchService(req, res, next) {
    try {
        const {
            ocrText, locale, ocrType, fileName, question,
        } = req.body;
        const studentClass = req.body.class;
        const db = req.app.get('db');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesis');
        const translate2 = req.app.get('translate2');
        const config = req.app.get('config');
        const studentId = 10;
        let versionUsed;
        if (question) {
            versionUsed = question;
            versionUsed = versionUsed.replace('v_mongo', '');
            versionUsed = versionUsed.replace('.', '_');
        }
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const promises = [];
        const preProcessPromises = [];
        const hybridPromisesSearchService = [];
        console.log('iterations');
        const iterations = await Utility.getIterations();
        console.log('iterations');
        let iter = JSON.parse(iterations);
        iter = _.reverse(iter);
        const stockWordList = [];
        const languagesArrays = await LanguageContainer.getList(db);
        const languagesObj = Utility.getLanguageObject(languagesArrays);
        const stLangCode = locale;
        let language = languagesObj[stLangCode];
        if (typeof language === 'undefined') {
            language = 'english';
        }
        const keyArray = [];
        const keyArrayPreProcess = [];
        const hybridOcrFlowKeys = [];
        const hybridOcrFlowPromises = [];
        const getExactEquationMatchesKeyArray = [];
        const getExactEquationSearchImplVersion = 'v30';
        const exactEquationMatchPromises = [];
        const organicFlags = [];
        const translateFreeFlowKeys = [];
        const translateFreeFlowPromises = [];
        const resolvedPromisesIndices = [];
        let organicMatches = {};
        const host = `${req.protocol}://${req.headers.host}`;
        const question_image_base64 = await image2base64(`${config.cdn_url}images/${fileName}`);
        for (let i = 0; i < iter.length; i++) {
            if (!iter[i].attachment.hideFromPanel) {
                if ((iter[i].key.slice(0, 2) === 'vi' || iter[i].key.slice(0, 2) === 'vo') && !_.isEmpty(fileName)) {
                    if (versionUsed && iter[i].key.includes(versionUsed)) {
                        keyArrayPreProcess.push(`(used)${iter[i].key}`);
                    } else {
                        keyArrayPreProcess.push(iter[i].key);
                    }
                    preProcessPromises.push(helper.handleOcrGlobal({
                        config,
                        variantAttachment: iter[i].attachment,
                        fileName,
                        host,
                        translate2,
                        image: question_image_base64,
                        next,
                    }));
                } else if ((iter[i].key.slice(0, 8) === 'v_hybrid') && !_.isEmpty(fileName)) {
                    console.log('hybrid hu main');
                    hybridOcrFlowKeys.push(iter[i].key);
                    hybridOcrFlowPromises.push(helper.handleHybridOcrGlobal({
                        config,
                        variantAttachment: iter[i].attachment,
                        fileName,
                        host,
                        translate2,
                        image: question_image_base64,
                        next,
                        studentId,
                    }));
                } else if (!_.isEmpty(fileName)) {
                    translateFreeFlowKeys.push(iter[i].key);
                    translateFreeFlowPromises.push(helper.handleOcrGlobal({
                        config,
                        variantAttachment: iter[i].attachment,
                        fileName,
                        host,
                        translate2,
                        image: question_image_base64,
                        next,
                        studentId,
                    }));
                } else {
                    if (iter[i].attachment.hasOwnProperty('match_exact_equations')) {
                        getExactEquationMatchesKeyArray.push(iter[i].key);
                        const modified_attachment = { ...iter[i].attachment, searchImplVersion: getExactEquationSearchImplVersion };
                        exactEquationMatchPromises.push(helper.handleElasticSearchWrapper({
                            ocr: ocrText,
                            elasticSearchInstance,
                            elasticSearchTestInstance,
                            kinesisClient,
                            elasticIndex: indexName,
                            stockWordList,
                            useStringDiff: true,
                            language,
                            fuzz,
                            UtilityModule: Utility,
                            studentId: '0',
                            studentClass,
                            ocrType,
                            variantAttachment: modified_attachment,
                            isStaging: true,
                            next,
                        }, config));
                    }
                    if (versionUsed && iter[i].key.includes(versionUsed)) {
                        keyArray.push(`(used)${iter[i].key}`);
                    } else {
                        keyArray.push(iter[i].key);
                    }
                    iter[i].attachment.ocrText = ocrText;
                    promises.push(helper.handleElasticSearchWrapper({
                        ocr: ocrText,
                        elasticSearchInstance,
                        elasticSearchTestInstance,
                        kinesisClient,
                        elasticIndex: indexName,
                        stockWordList,
                        useStringDiff: true,
                        language,
                        fuzz,
                        UtilityModule: Utility,
                        studentId: '0',
                        studentClass,
                        ocrType,
                        variantAttachment: iter[i].attachment,
                        isStaging: true,
                        next,
                    }, config));
                    resolvedPromisesIndices.push(i);
                }
            }
        }
        const resolvedPromises = await Promise.all(promises);
        const data = [];
        for (let i = 0; i < resolvedPromises.length; i++) {
            const obj = {};
            const values = {};
            values.matches = resolvedPromises[i].stringDiffResp[0];
            if (iter[resolvedPromisesIndices[i]].attachment.numberBoostStrategy) {
                const reorderType = iter[resolvedPromisesIndices[i]].attachment.numberBoostStrategy.type;
                values.matches = QuestionHelper.getMatchesArrayReorderedByBoostingNumbers(resolvedPromises[i].info.query_ocr_text, resolvedPromises[i].stringDiffResp[0], reorderType);
            }
            values.query_ocr_text = resolvedPromises[i].info.query_ocr_text;
            obj[keyArray[i]] = values;
            data.push(obj);
        }
        const resolvedPromisesPreProcess = await Promise.all(preProcessPromises);
        const resolvedHybridOcrFlowPromises = await Promise.all(hybridOcrFlowPromises);

        const resolvedTranslateFreeFlowPromises = await Promise.all(translateFreeFlowPromises);
        const resolvedTranslateFreeElasticResultsPromises = [];

        for (let l = 0; l < resolvedTranslateFreeFlowPromises.length; l++) {
            const attachment = resolvedTranslateFreeFlowPromises[l].variantAttachment;
            attachment.questionLocale = resolvedTranslateFreeFlowPromises[l].locale;
            resolvedTranslateFreeElasticResultsPromises.push(helper.handleElasticSearchWrapper({
                ocr: resolvedTranslateFreeFlowPromises[l].ocr,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                stockWordList,
                useStringDiff: true,
                language,
                fuzz,
                UtilityModule: Utility,
                studentId: '0',
                studentClass,
                ocrType: resolvedTranslateFreeFlowPromises[l].ocr_type,
                variantAttachment: attachment,
                isStaging: true,
                next,
            }, config));
        }

        const resolvedTranslateFreeElasticResultsPromisesResponse = await Promise.all(resolvedTranslateFreeElasticResultsPromises);

        for (let i = 0; i < resolvedTranslateFreeElasticResultsPromisesResponse.length; i++) {
            const obj = {};
            const values = {};
            values.matches = resolvedTranslateFreeElasticResultsPromisesResponse[i].stringDiffResp[0];
            values.query_ocr_text = resolvedTranslateFreeElasticResultsPromisesResponse[i].info.query_ocr_text;
            obj[translateFreeFlowKeys[i]] = values;
            data.push(obj);
        }
        const promisesSearchService = [];
        for (let i = 0; i < resolvedPromisesPreProcess.length; i++) {
            const attachment = resolvedPromisesPreProcess[i].variantAttachment;
            if (resolvedPromisesPreProcess[i].isModified) {
                attachment.ocrText = resolvedPromisesPreProcess[i].ocr;
            } else {
                attachment.ocrText = ocrText;
            }
            if (!_.isEmpty(resolvedPromisesPreProcess[i].topic)) {
                attachment.questionTopics = resolvedPromisesPreProcess[i].topic;
            }
            if (!_.isEmpty(resolvedPromisesPreProcess[i].preprocessMatchesArray)) {
                const organic_question_image_name = resolvedPromisesPreProcess[i].preprocessMatchesArray[0];
                const organic_question_id = organic_question_image_name.split('.')[0];
                organicFlags.push(i);
                const match_obj = {
                    [i]: organic_question_id,
                };
                // organicMatches.push(match_obj);
                organicMatches = { ...organicMatches, [i]: organic_question_id };
            }

            promisesSearchService.push(helper.handleElasticSearchWrapper({
                ocr: attachment.ocrText,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                elasticIndex: indexName,
                stockWordList,
                useStringDiff: true,
                language,
                fuzz,
                UtilityModule: Utility,
                studentId: '0',
                studentClass,
                ocrType,
                variantAttachment: attachment,
                isStaging: true,
                next,
            }, config));
        }
        const resolvedPromisesSearchService = await Promise.all(promisesSearchService);

        for (let i = 0; i < resolvedPromisesSearchService.length; i++) {
            let matches_obj = {};
            const obj = {};
            // let matches;
            let question_data;
            const matches = resolvedPromisesSearchService[i].stringDiffResp[0];
            // if(organicFlags.includes[i]){
            if (organicFlags.indexOf(i) > -1) {
                question_data = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, organicMatches[i]);
                console.log(question_data);
                question_data = {
                    ...matches[0],
                    _id: question_data[0].question_id,
                    _source: {
                        chapter: 0,
                        is_answered: question_data[0].is_answered,
                        is_text_answered: question_data[0].is_text_answered,
                        subject: question_data[0].subject,
                        ocr_text: question_data[0].ocr_text,
                    },
                };
                matches.unshift(question_data);
            } else {
                console.log('it doesnot includes this');
            }
            const { query_ocr_text } = resolvedPromisesSearchService[i].info;
            matches_obj = {
                matches,
                query_ocr_text,
            };
            obj[keyArrayPreProcess[i]] = matches_obj;
            data.push(obj);
        }

        for (let m = 0; m < resolvedHybridOcrFlowPromises.length; m++) {
            const attachment = resolvedHybridOcrFlowPromises[m].variantAttachment;
            attachment.ocrText = resolvedHybridOcrFlowPromises[m].ocr;
            hybridPromisesSearchService.push(helper.handleElasticSearchHybridOcrWrapper({
                ocr: attachment.ocrText,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                elasticIndex: indexName,
                stockWordList,
                useStringDiff: true,
                language,
                fuzz,
                UtilityModule: Utility,
                studentId: '0',
                studentClass,
                ocrType,
                variantAttachment: attachment,
                isStaging: true,
                next,
            }, config));
        }

        const resolvedHybridPromisesSearchService = await Promise.all(hybridPromisesSearchService);
        for (let i = 0; i < resolvedHybridPromisesSearchService.length; i++) {
            let matches_obj = {};
            const obj = {};
            let matches;
            let question_data;
            const { query_ocr_text } = resolvedHybridPromisesSearchService[i].info;
            if (resolvedHybridPromisesSearchService[i].hybridOcrFlag) {
                matches = resolvedHybridPromisesSearchService[i].stringDiffResp;
                matches_obj = {
                    matches,
                    query_ocr_text: query_ocr_text['english-ocr'],
                };
            } else {
                matches = resolvedHybridPromisesSearchService[i].stringDiffResp[0];
                matches_obj = {
                    matches,
                    query_ocr_text,
                };
            }
            // matches_obj = {
            //     'matches':matches,
            //     'query_ocr_text' :query_ocr_text
            // }
            obj[hybridOcrFlowKeys[i]] = matches_obj;
            data.push(obj);
        }

        const resolvedExactEquationMatchPromises = await Promise.all(exactEquationMatchPromises);

        for (let i = 0; i < resolvedExactEquationMatchPromises.length; i++) {
            console.log(resolvedExactEquationMatchPromises[i]);
            let matches = resolvedExactEquationMatchPromises[i].stringDiffResp[0];
            if (Array.isArray(matches)) {
                if (matches.length > 3) {
                    matches = matches.slice(0, 3);
                }
                // let without_exact_equation_match_results = data[getExactEquationMatchesKeyArray[i]];
                const iter_key = getExactEquationMatchesKeyArray[i];
                let index;
                for (let m = 0; m < data.length; m++) {
                    if (data[m].hasOwnProperty(iter_key)) {
                        index = m;
                    }
                }
                const without_exact_equation_match_results = data[index][iter_key];
                const combined_results = { ...without_exact_equation_match_results, matches: [...matches, ...without_exact_equation_match_results.matches] };

                data[getExactEquationMatchesKeyArray[i]] = combined_results;
            }
        }

        // sample json = {
        // matches : [],
        // query_ocr_text : ''
        // }

        // sample matches =
        // "_index": "question_bank_v1",
        // "_type": "repository",
        // "_id": "10842",
        // "_score": 10,
        // "_source": {
        //     "chapter": 0,
        //     "is_answered": 1,
        //     "ocr_text": " integrate ",
        //     "is_text_answered": 0,
        //     "subject": "MATHS"
        // }

        // call for meta data to preprocess

        const all_versions_order_arr = [];
        const meta_data_promises = [];
        for (let k = 0; k < data.length; k++) {
            const data_obj = data[k];
            const keys = Object.keys(data_obj);
            all_versions_order_arr.push(keys[0]);
            // console.log('data thing',data_obj[keys[0]]);
            // meta_data_promises.push(helper.callPreProcessServiceForMetaData(data_obj[keys[0]]['query_ocr_text']));
        }
        const meta_data_results = await Promise.all(meta_data_promises);
        const fake_meta_matches = [];
        for (let j = 0; j < meta_data_results.length; j++) {
            const topic_detected = meta_data_results[j].data.topic;
            const topic_text = topic_detected.join(',');
            const fake_meta_match = {
                _index: 'question_bank_meta_data',
                _type: 'repository',
                _id: all_versions_order_arr[j],
                _score: 100,
                _source: {
                    chapter: 0,
                    is_answered: 1,
                    ocr_text: topic_text,
                    is_text_answered: 0,
                    subject: 'META',
                },
            };
            fake_meta_matches.push(fake_meta_match);
        }

        if (fake_meta_matches.length < 20) {
            const rest_fake_length = fake_meta_matches.length;
            for (let m = 0; m < 20 - rest_fake_length; m++) {
                fake_meta_matches.push(fake_meta_matches[0]);
            }
        }

        const meta_data = {
            v_meta_data: {
                matches: fake_meta_matches,
                query_ocr_text: 'topics are detected as follows:-',
            },
        };
        data.push(meta_data);

        // ------ topic finish code ///

        // checking whether solved through computational
        const computationDetails = await QuestionHelper.handleComputationalQuestions({
            mathsteps,
            UtilityModule: Utility,
            qid: 0,
            cleanedOcr: ocrText,
            locale,
            isTyd: false,
        });
        if (computationDetails && Array.isArray(computationDetails) && Array.isArray(computationDetails[0]) && computationDetails[0][0]) {
            data.push({
                computational: {
                    matches: [true],
                    query_ocr_text: ocrText,
                },
            });
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getLanguageMatchesFromSearchService(req, res, next) {
    try {
        const {
            fileName,
        } = req.body;
        let {
            ocrText, ocrType, isEdited, language,
        } = req.body;
        if (_.isEmpty(fileName) && typeof ocrText !== 'undefined') {
            isEdited = 'true';
        }
        if (_.isEmpty(language)) {
            language = 'english';
        }
        const studentClass = req.body.class;
        const db = req.app.get('db');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesis');
        const translate2 = req.app.get('translate2');
        const config = req.app.get('config');
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const promises = [];
        const preProcessPromises = [];
        const iterations = await Utility.getIterations();
        let iter = JSON.parse(iterations);
        iter = _.reverse(iter);
        const stockWordList = [];
        const keyArray = [];
        const keyArrayPreProcess = [];
        const organicFlags = [];
        let organicMatches = {};
        const host = `${req.protocol}://${req.headers.host}`;
        const question_image_base64 = await image2base64(`${config.cdn_url}images/${fileName}`);
        const ocrObject = {};
        let locale = null;
        if (Utility.isEnglishMathSymbolString(ocrText)) {
            locale = 'en';
        }
        for (let i = 0; i < iter.length; i++) {
            if (iter[i].attachment.includeOnHindiPanel) {
                const ocrData = await QuestionHelper.handleOcrForPanel(ocrObject, {
                    image: null, host, fileName, translate2, variantAttachment: iter[i].attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                }, {
                    isEdited, ocrText, ocrType, locale,
                });
                if ((iter[i].key.slice(0, 2) === 'vi' || iter[i].key.slice(0, 2) === 'vo') && !_.isEmpty(fileName)) {
                    keyArrayPreProcess.push(iter[i].key);
                    preProcessPromises.push(helper.handleOcrGlobal({
                        config,
                        variantAttachment: iter[i].attachment,
                        fileName,
                        host,
                        translate2,
                        image: question_image_base64,
                        next,
                    }));
                } else {
                    ocrText = ocrData.ocr;
                    ocrType = ocrData.ocr_type;
                    locale = ocrData.locale;
                    keyArray.push(iter[i].key);
                    iter[i].attachment.ocrText = ocrText;
                    iter[i].attachment.ocrType = ocrType;
                    let searchFieldName;
                    if (iter[i].attachment.queryConfig && iter[i].attachment.queryConfig.searchFieldName) {
                        searchFieldName = iter[i].attachment.queryConfig.searchFieldName;
                    }
                    iter[i].attachment.questionLocale = locale;
                    promises.push(helper.handleElasticSearchWrapper({
                        ocr: ocrText,
                        elasticSearchInstance,
                        elasticSearchTestInstance,
                        kinesisClient,
                        elasticIndex: indexName,
                        stockWordList,
                        useStringDiff: true,
                        language,
                        locale,
                        fuzz,
                        UtilityModule: Utility,
                        studentId: '0',
                        studentClass,
                        ocrType,
                        db,
                        QuestionContainer,
                        translate2,
                        variantAttachment: iter[i].attachment,
                        isStaging: true,
                        useComposerApi: iter[i].attachment.useComposerApi,
                        searchFieldName,
                        next,
                    }, config));
                }
            }
        }
        const resolvedPromises = await Promise.all(promises);
        const data = [];
        for (let i = 0; i < resolvedPromises.length; i++) {
            const obj = {};
            const matchesArray = resolvedPromises[i].stringDiffResp[0];
            const groupedQid = resolvedPromises[i].stringDiffResp[2];
            const values = {};
            if (matchesArray) {
                values.matches = await QuestionContainer.getLocalisedQuestionMget(db, matchesArray, null, language, next, groupedQid, elasticSearchInstance);
            } else {
                values.matches = [];
            }
            values.query_ocr_text = resolvedPromises[i].info.query_ocr_text;
            if (values.matches) {
                values.matches.forEach((element) => {
                    element.language = element._source.video_language;
                });
            }
            obj[keyArray[i]] = values;
            data.push(obj);
        }
        const resolvedPromisesPreProcess = await Promise.all(preProcessPromises);
        const promisesSearchService = [];
        for (let i = 0; i < resolvedPromisesPreProcess.length; i++) {
            const attachment = resolvedPromisesPreProcess[i].variantAttachment;
            if (resolvedPromisesPreProcess[i].isModified) {
                attachment.ocrText = resolvedPromisesPreProcess[i].ocr;
                attachment.ocrType = ocrType;
            } else {
                const ocrData = await QuestionHelper.handleOcrForPanel(ocrObject, {
                    image: null, host, fileName, translate2, variantAttachment: attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                });
                attachment.ocrText = ocrData.ocr;
                attachment.ocrType = ocrData.ocr_type;
            }
            let searchFieldName;
            if (attachment.queryConfig && attachment.queryConfig.searchFieldName) {
                searchFieldName = attachment.queryConfig.searchFieldName;
            }
            if (!_.isEmpty(resolvedPromisesPreProcess[i].topic)) {
                attachment.questionTopics = resolvedPromisesPreProcess[i].topic;
            }
            if (!_.isEmpty(resolvedPromisesPreProcess[i].preprocessMatchesArray)) {
                const organic_question_image_name = resolvedPromisesPreProcess[i].preprocessMatchesArray[0];
                const organic_question_id = organic_question_image_name.split('.')[0];
                organicFlags.push(i);
                // let match_obj = {
                //     [i] : organic_question_id
                // };
                // organicMatches.push(match_obj);
                organicMatches = { ...organicMatches, [i]: organic_question_id };
            }

            promisesSearchService.push(helper.handleElasticSearchWrapper({
                ocr: attachment.ocrText,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                elasticIndex: indexName,
                stockWordList,
                useStringDiff: true,
                language,
                locale,
                fuzz,
                db,
                QuestionContainer,
                translate2,
                UtilityModule: Utility,
                studentId: '0',
                studentClass,
                ocrType,
                variantAttachment: attachment,
                isStaging: true,
                useComposerApi: attachment.useComposerApi,
                searchFieldName,
                next,
            }, config));
        }
        const resolvedPromisesSearchService = await Promise.all(promisesSearchService);

        for (let i = 0; i < resolvedPromisesSearchService.length; i++) {
            let matches_obj = {};
            const obj = {};
            // let matches;
            let question_data; let
                matches;
            const matchesArray = resolvedPromisesSearchService[i].stringDiffResp[0];
            const groupedQid = resolvedPromisesSearchService[i].stringDiffResp[2];
            if (matchesArray) {
                matches = await QuestionContainer.getLocalisedQuestionMget(db, matchesArray, null, language, next, groupedQid, elasticSearchInstance);
            }
            if (matches) {
                matches.forEach((element) => {
                    element.language = element._source.video_language;
                });
            }
            // if(organicFlags.includes[i]){
            if (organicFlags.indexOf(i) > -1) {
                question_data = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, organicMatches[i]);
                console.log(question_data);
                question_data = {
                    ...matches[0],
                    _id: question_data[0].question_id,
                    _source: {
                        chapter: 0,
                        is_answered: question_data[0].is_answered,
                        is_text_answered: question_data[0].is_text_answered,
                        subject: question_data[0].subject,
                        ocr_text: question_data[0].ocr_text,
                    },
                };
                matches.unshift(question_data);
            } else {
                console.log('it doesnot includes this');
            }
            const { query_ocr_text } = resolvedPromisesSearchService[i].info;
            matches_obj = {
                matches,
                query_ocr_text,
            };
            obj[keyArrayPreProcess[i]] = matches_obj;
            data.push(obj);
        }
        const computationDetails = await QuestionHelper.handleComputationalQuestions({
            mathsteps,
            UtilityModule: Utility,
            qid: 0,
            cleanedOcr: req.body.ocrText,
            locale,
            isTyd: false,
        });
        if (computationDetails && Array.isArray(computationDetails) && Array.isArray(computationDetails[0]) && computationDetails[0][0]) {
            data.push({
                computational: {
                    matches: [true],
                    query_ocr_text: ocrText,
                },
            });
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getGlobalMatchesFromSearchService(req, res, next) {
    try {
        const {
            fileName, appLocale, languagePersonificationAttachment, schoolBoard, questionLocale, userQid, isTyd, displayType, videoLanguageFilters, viserVersusVisionOcr,
        } = req.body;
        const clientSource = 'app';
        let {
            ocrText, ocrType, isEdited, language,
        } = req.body;
        if (_.isEmpty(fileName) && typeof ocrText !== 'undefined') {
            isEdited = 'true';
        }
        if (_.isEmpty(language)) {
            language = 'english';
        }
        const studentClass = req.body.class;
        const db = req.app.get('db');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesis');
        const translate2 = req.app.get('translate2');
        const config = req.app.get('config');
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const flagId = isTyd ? Data.search_service_tyd_flag_id : 3;
        const host = `${req.protocol}://${req.headers.host}`;

        const ocrObject = {};
        let locale = null;
        const stockWordList = [];
        const keyArray = [];
        const keyArrayPreProcess = [];
        const organicFlags = [];
        let organicMatches = {};

        let promises = [];
        const preProcessPromises = [];
        let ocrDataPromises = [];
        const indexOfIterationsToDisplay = [];

        promises.push(Utility.getIterations(flagId));
        promises.push(Questions.getIterationByUserQuestionId(userQid, db.mysql.read));
        promises.push(image2base64(`${config.cdn_url}images/${fileName}`));

        let resolvedPromises = await Promise.all(promises);
        const iterations = resolvedPromises[0];
        let iter = JSON.parse(iterations);
        iter = _.reverse(iter);
        const userQuestionAskedIteration = resolvedPromises[1];
        let userQuestionAskedIterationName;
        if (userQuestionAskedIteration && userQuestionAskedIteration.length) {
            userQuestionAskedIterationName = userQuestionAskedIteration[0].question;
        }
        const question_image_base64 = resolvedPromises[2];
        promises = [];

        if (Utility.isEnglishMathSymbolString(ocrText)) {
            locale = 'en';
        }
        if (_.isNull(locale) && isEdited === 'true') {
            const detectedLanguages = Utility.checkQuestionOcrLanguages(ocrText);
            locale = detectedLanguages.detectedLanguage;
        }
        for (let i = 0; i < iter.length; i++) {
            if (displayType === 'uninstall_analysis' && (iter[i].attachment.isVIP || userQuestionAskedIterationName === iter[i].key)) {
                ocrDataPromises.push(QuestionHelper.handleOcrForPanel(ocrObject, {
                    image: null, host, fileName, translate2, variantAttachment: iter[i].attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                }, {
                    isEdited, ocrText, ocrType, locale,
                }));
                indexOfIterationsToDisplay.push(i);
            } else if (viserVersusVisionOcr) {
                if (iter[i].key === 'v_weighted_string_diff') {
                    iter[i].attachment = {
                        ...iter[i].attachment,
                        viser_confidence_threshold: 0,
                        version: 'viser',
                    };
                    iter[i].key = 'viser';
                    ocrDataPromises.push(QuestionHelper.handleOcrForPanel(ocrObject, {
                        image: null, host, fileName, translate2, variantAttachment: iter[i].attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                    }, {
                        isEdited, ocrText, ocrType, locale,
                    }));
                    indexOfIterationsToDisplay.push(i);
                    indexOfIterationsToDisplay.push(iter.length);
                    iter.push({
                        id: iter[i].id,
                        attachment: {
                            ...iter[i].attachment,
                            useViserMathsOcr: false,
                            useMathpixText: false,
                            useVisionOcr: true,
                            version: 'google_vision',
                        },
                        key: 'google_vision',
                    });
                    ocrDataPromises.push(QuestionHelper.handleOcrForPanel(ocrObject, {
                        image: null, host, fileName, translate2, variantAttachment: iter[iter.length-1].attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                    }, {
                        isEdited, ocrText, ocrType, locale,
                    }));
                } else {
                    continue;
                }
            } else if (displayType !== 'uninstall_analysis' && iter[i].attachment.includeOnHindiPanel) {
                if ((iter[i].key.slice(0, 2) === 'vi' || iter[i].key.slice(0, 2) === 'vo') && !_.isEmpty(fileName)) {
                    keyArrayPreProcess.push(iter[i].key);
                    preProcessPromises.push(helper.handleOcrGlobal({
                        config,
                        variantAttachment: iter[i].attachment,
                        fileName,
                        host,
                        translate2,
                        image: question_image_base64,
                        next,
                    }));
                } else {
                    ocrDataPromises.push(QuestionHelper.handleOcrForPanel(ocrObject, {
                        image: null, host, fileName, translate2, variantAttachment: iter[i].attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                    }, {
                        isEdited, ocrText, ocrType, locale,
                    }));
                    indexOfIterationsToDisplay.push(i);
                }
            }
        }
        const resolvedPromisesPreProcess = await Promise.all(preProcessPromises);
        let ocrDataResponse = await Promise.all(ocrDataPromises);
        for (let i = 0; i < ocrDataResponse.length; i++) {
            ocrText = ocrDataResponse[i].ocr;
            ocrType = ocrDataResponse[i].ocr_type;
            locale = ocrDataResponse[i].locale;
            keyArray.push(iter[indexOfIterationsToDisplay[i]].key);
            iter[indexOfIterationsToDisplay[i]].attachment.ocrText = ocrText;
            iter[indexOfIterationsToDisplay[i]].attachment.ocrType = ocrType;
            Utility.addLanguageFiltersToAttachment(iter[indexOfIterationsToDisplay[i]].attachment, videoLanguageFilters);
            let searchFieldName;
            if (iter[indexOfIterationsToDisplay[i]].attachment.queryConfig && iter[indexOfIterationsToDisplay[i]].attachment.queryConfig.searchFieldName) {
                searchFieldName = iter[indexOfIterationsToDisplay[i]].attachment.queryConfig.searchFieldName;
            }
            iter[indexOfIterationsToDisplay[i]].attachment.questionLocale = locale;
            promises.push(helper.handleElasticSearchWrapper({
                ocr: ocrText,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                elasticIndex: indexName,
                fileName,
                stockWordList,
                useStringDiff: true,
                language,
                locale,
                fuzz,
                UtilityModule: Utility,
                studentId: '0',
                studentClass,
                ocrType,
                db,
                QuestionContainer,
                translate2,
                variantAttachment: iter[indexOfIterationsToDisplay[i]].attachment,
                isStaging: false,
                useComposerApi: iter[indexOfIterationsToDisplay[i]].attachment.useComposerApi,
                searchFieldName,
                questionLocale: locale,
                languagePersonificationAttachment,
                userProfile: {
                    appLocale,
                    schoolBoard,
                    questionLocale,
                },
                req,
                next,
            }, config));
        }

        resolvedPromises = await Promise.all(promises);
        const data = [];
        promises = [];
        for (let i = 0; i < resolvedPromises.length; i++) {
            const {
                cleanedOcr,
                equationOcrText,
                info,
            } = resolvedPromises[i];
            const matchesArray = resolvedPromises[i].stringDiffResp[0];

            promises.push(QuestionHelper.handleComputationalQuestionsWrapper({
                variantAttachment: iter[indexOfIterationsToDisplay[i]].attachment,
                cleanedOcr,
                equationOcrText,
                info,
                matchesArray,
                subject: resolvedPromises[i].stringDiffResp[3],
                mathsteps,
                qid: 0,
                appLocale,
                isTyd,
                UtilityModule: Utility,
            }));
        }

        const computationDetailsResolvedResponse = await Promise.all(promises);

        const localisedQuestionMgetPromises = [];
        for (let i = 0; i < resolvedPromises.length; i++) {
            const {
                cleanedOcr,
                info,
                languagePriorityQidSwaps,
            } = resolvedPromises[i];
            let matchesArray = resolvedPromises[i].stringDiffResp[0];
            if (!_.isEmpty(languagePriorityQidSwaps)) {
                for (let m = 0; m < languagePriorityQidSwaps.length; m++) {
                    const i1 = matchesArray.findIndex((me) => me._id == languagePriorityQidSwaps[m][0]);
                    const i2 = matchesArray.findIndex((me) => me._id == languagePriorityQidSwaps[m][1]);
                    if (i1 !== -1) {
                        matchesArray[i1].is_bumped_up = true;
                    }
                    if (i2 !== -1) {
                        matchesArray[i2].is_bumped_down = true;
                    }
                }
            }

            const isTopMatchExactMatch = QuestionHelper.checkTopMatchExactness({
                checkExactMatch: true,
                matchesArray,
                clientSource,
                locale: appLocale,
                info,
                fuzz,
                variantAttachment: { isHindiExactMatchCheck: true },
            });
            if (isTopMatchExactMatch) {
                matchesArray[0].is_exact_match = true;
            }

            const computational = computationDetailsResolvedResponse[i][0];

            if (!_.isEmpty(computational) && computational.length) {
                const comp_ques_obj = {
                    _index: 'question_bank_v1',
                    _type: 'repository',
                    _id: '0',
                    _score: 10,
                    _source:
                    {
                        chapter: undefined,
                        chapter_alias: undefined,
                        is_answered: 0,
                        ocr_text: cleanedOcr,
                        ocr_text_hi: undefined,
                        is_text_answered: 1,
                        subject: 'MATHS',
                        video_language: undefined,
                        thumbnail_language: 'english',
                        package_language: undefined,
                        pretty_text: undefined,
                        option_1: undefined,
                        option_2: undefined,
                        option_3: undefined,
                        option_4: undefined,
                    },
                    partial_score: 100,
                    is_computational: true,
                    solution: computationDetailsResolvedResponse[i][1].solutions,
                };
                if (typeof matchesArray !== 'undefined') {
                    matchesArray.unshift(comp_ques_obj);
                } else {
                    matchesArray = [comp_ques_obj];
                }
            }
            const groupedQid = resolvedPromises[i].stringDiffResp[2];

            if (matchesArray) {
                localisedQuestionMgetPromises.push(QuestionContainer.getLocalisedQuestionMget(db, matchesArray, null, language, next, groupedQid, elasticSearchInstance));
            } else {
                localisedQuestionMgetPromises.push([]);
            }
        }

        const localisedQuestionMgetResolvedResponse = await Promise.all(localisedQuestionMgetPromises);
        for (let i = 0; i < resolvedPromises.length; i++) {
            const values = {};
            const obj = {};
            values.matches = localisedQuestionMgetResolvedResponse[i];
            values.query_ocr_text = resolvedPromises[i].info.query_ocr_text;
            if (values.matches) {
                values.matches.forEach((element) => {
                    element.language = element._source.video_language;
                });
            }
            obj[keyArray[i]] = values;

            data.push(obj);
        }

        const promisesSearchService = [];
        ocrDataPromises = [];
        for (let i = 0; i < resolvedPromisesPreProcess.length; i++) {
            const attachment = resolvedPromisesPreProcess[i].variantAttachment;
            if (resolvedPromisesPreProcess[i].isModified) {
                ocrDataPromises.push([]);
            } else {
                ocrDataPromises.push(QuestionHelper.handleOcrForPanel(ocrObject, {
                    image: null, host, fileName, translate2, variantAttachment: attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                }));
            }
        }
        ocrDataResponse = await Promise.all(ocrDataPromises);

        for (let i = 0; i < resolvedPromisesPreProcess.length; i++) {
            const attachment = resolvedPromisesPreProcess[i].variantAttachment;
            if (resolvedPromisesPreProcess[i].isModified) {
                attachment.ocrText = resolvedPromisesPreProcess[i].ocr;
                attachment.ocrType = ocrType;
            } else {
                const ocrData = ocrDataResponse[i];
                attachment.ocrText = ocrData.ocr;
                attachment.ocrType = ocrData.ocr_type;
            }
            let searchFieldName;
            if (attachment.queryConfig && attachment.queryConfig.searchFieldName) {
                searchFieldName = attachment.queryConfig.searchFieldName;
            }
            if (!_.isEmpty(resolvedPromisesPreProcess[i].topic)) {
                attachment.questionTopics = resolvedPromisesPreProcess[i].topic;
            }
            if (!_.isEmpty(resolvedPromisesPreProcess[i].preprocessMatchesArray)) {
                const organic_question_image_name = resolvedPromisesPreProcess[i].preprocessMatchesArray[0];
                const organic_question_id = organic_question_image_name.split('.')[0];
                organicFlags.push(i);
                // let match_obj = {
                //     [i] : organic_question_id
                // };
                // organicMatches.push(match_obj);
                organicMatches = { ...organicMatches, [i]: organic_question_id };
            }

            promisesSearchService.push(helper.handleElasticSearchWrapper({
                ocr: attachment.ocrText,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                elasticIndex: indexName,
                stockWordList,
                useStringDiff: true,
                language,
                locale,
                fuzz,
                db,
                QuestionContainer,
                translate2,
                UtilityModule: Utility,
                studentId: '0',
                studentClass,
                ocrType,
                variantAttachment: attachment,
                isStaging: false,
                useComposerApi: attachment.useComposerApi,
                searchFieldName,
                next,
            }, config));
        }
        const resolvedPromisesSearchService = await Promise.all(promisesSearchService);
        const localisedQuestionMgetmatchesPromises = [];
        const questionIdForCatalogQuestionsPromises = [];

        for (let i = 0; i < resolvedPromisesSearchService.length; i++) {
            const matchesArray = resolvedPromisesSearchService[i].stringDiffResp[0];
            const groupedQid = resolvedPromisesSearchService[i].stringDiffResp[2];
            if (matchesArray) {
                localisedQuestionMgetmatchesPromises.push(QuestionContainer.getLocalisedQuestionMget(db, matchesArray, null, language, next, groupedQid, elasticSearchInstance));
            } else {
                localisedQuestionMgetmatchesPromises.push([]);
            }

            if (organicFlags.indexOf(i) > -1) {
                questionIdForCatalogQuestionsPromises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, organicMatches[i]));
            } else {
                questionIdForCatalogQuestionsPromises.push([]);
            }
        }

        const localisedQuestionMgetResolvedPromise = await Promise.all(localisedQuestionMgetmatchesPromises);
        const questionIdForCatalogQuestionsResponse = await Promise.all(questionIdForCatalogQuestionsPromises);

        for (let i = 0; i < resolvedPromisesSearchService.length; i++) {
            let matches_obj = {};
            const obj = {};
            let question_data;
            let matches;
            const matchesArray = resolvedPromisesSearchService[i].stringDiffResp[0];
            if (matchesArray) {
                matches = localisedQuestionMgetResolvedPromise[i];
            }
            if (matches) {
                matches.forEach((element) => {
                    element.language = element._source.video_language;
                });
            }
            // if(organicFlags.includes[i]){
            if (organicFlags.indexOf(i) > -1) {
                question_data = questionIdForCatalogQuestionsResponse[i];
                console.log(question_data);
                question_data = {
                    ...matches[0],
                    _id: question_data[0].question_id,
                    _source: {
                        chapter: 0,
                        is_answered: question_data[0].is_answered,
                        is_text_answered: question_data[0].is_text_answered,
                        subject: question_data[0].subject,
                        ocr_text: question_data[0].ocr_text,
                    },
                };
                matches.unshift(question_data);
            } else {
                console.log('it doesnot includes this');
            }
            const { query_ocr_text } = resolvedPromisesSearchService[i].info;
            matches_obj = {
                matches,
                query_ocr_text,
            };
            obj[keyArrayPreProcess[i]] = matches_obj;
            data.push(obj);
        }
        // const computationDetails = await QuestionHelper.handleComputationalQuestions({
        //     mathsteps,
        //     UtilityModule: Utility,
        //     qid: 0,
        //     cleanedOcr: req.body.ocrText,
        //     locale,
        //     isTyd: false,
        // });
        // if (computationDetails && Array.isArray(computationDetails) && Array.isArray(computationDetails[0]) && computationDetails[0][0]) {
        //     data.push({
        //         computational: {
        //             matches: [true],
        //             query_ocr_text: ocrText,
        //         },
        //     });
        // }

        if (typeof userQid !== 'undefined') {
            const query = {
                qid: userQid,
            };
            let user_app_matches = [];
            let is_user_data_from_mongo = false;
            const mongo_user_questions_data = await db.mongo.read.collection('question_logs_user').findOne(query);
            if (!_.isEmpty(mongo_user_questions_data)) {
                is_user_data_from_mongo = true;
                const user_app_match_qids = mongo_user_questions_data.relevance_score.map((x) => x.qid);
                user_app_matches = user_app_match_qids.slice(0, 20);
            } else {
                var elastic_user_questions_data = await elasticSearchUserQuestionsInstance.getById('user-questions', parseInt(userQid));
                user_app_matches = elastic_user_questions_data.hits.hits && elastic_user_questions_data.hits.hits.length > 0 ? elastic_user_questions_data.hits.hits[0]._source.matched_questions_arr : [];
            }

            if (!_.isEmpty(user_app_matches)) {
                const getMetaData = await elasticSearchTestInstance.getByIds('question_bank', user_app_matches);
                data.push({
                    user_app_matches: {
                        query_ocr_text: is_user_data_from_mongo ? mongo_user_questions_data.elastic_index : elastic_user_questions_data.hits.hits[0]._source.query_ocr_text,
                        matches: [...getMetaData.docs],
                    },
                });
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getTydSuggestions(req, res, next) {
    try {
        const db = req.app.get('db');
        const translate2 = req.app.get('translate2');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesisClient');
        const config = req.app.get('config');
        let {
            ocrText,
            locale,
            source,
            is_voice_search: isVoiceSearch,
        } = req.body;

        const {
            'x-auth-token': xAuthToken,
            country: region,
            version_code: versionCode,
        } = req.headers;

        const {
            student_id: studentId,
            locale: userLocale,
            student_class: studentClass,
        } = req.user;
        let attachment = await TydSuggestions.getIterationAttachment(xAuthToken, source, region, versionCode, isVoiceSearch);
        if (attachment && attachment.version) {
            TydSuggestions.maintainUserAttachmentInRedis(db, studentId, attachment.version);
        }
        locale = TydSuggestions.getQueryOcrLocale(attachment, ocrText, locale, source);
        ocrText = await TydSuggestions.getSearchQueryOcr(attachment, ocrText, locale, translate2);
        attachment = TydSuggestions.maintainAttachmentForPanelRequest(attachment, source, locale);
        const searchFieldName = TydSuggestions.getSearchFieldName(locale);
        const language = await TydSuggestions.getLanguage(db, userLocale);
        const elasticIndex = TydSuggestions.geIndexToUse(attachment, config, region);
        const useComposerApi = !!(attachment && attachment.useComposerApi);
        const result = await helper.handleElasticSearchWrapper({
            ocr: ocrText,
            elasticSearchInstance,
            elasticSearchTestInstance,
            kinesisClient,
            elasticIndex,
            stockWordList: [],
            language,
            fuzz,
            UtilityModule: Utility,
            studentId: '0',
            ocrType: 0,
            variantAttachment: attachment,
            isStaging: false,
            next,
            region,
            useComposerApi,
            locale,
            searchFieldName,
        }, config);
        const {
            stringDiffResp,
            info,
        } = result;

        // FORMAT SUGGESTIONS
        const matches = await TydSuggestions.formatSuggestions(attachment, stringDiffResp[0], db, config, {
            userLocale,
            source,
            versionCode,
            region,
            ocrText,
        });
        // LOG SUGGESTIONS
        TydSuggestions.logSuggestions(matches, {
            studentId, studentClass, locale, ocrText, isVoiceSearch, queryOcrText: info.query_ocr_text,
        });

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                matches,
                query_ocr_text: info.query_ocr_text,
            },
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                matches: [],
                query_ocr_text: '',
            },
        };
        return res.status(200).json(responseData);
    }
}

async function getMatches(req, res, next) {
    try {
        const {
            ocrText,
            locale,
            ocrType,
            source,
            is_voice_search,
        } = req.body;
        let qid = 0;
        if (!_.isEmpty(req.body.question_id)) {
            qid = req.body.question_id;
        }

        const db = req.app.get('db');
        const region = req.headers.country;
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesis');
        const config = req.app.get('config');
        const versionCode = req.headers.version_code;
        let indexName = Utility.isUsRegion(region) ? config.elastic.REPO_INDEX_USA : config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const xAuthToken = req.headers['x-auth-token'];
        let baseVariantAttachment = {};
        const voiceOcrStore = true;
        const studentId = req.user.student_id;
        const studentClass = req.user.student_class;
        if (is_voice_search !== undefined && is_voice_search === 1 && voiceOcrStore && !Utility.isUsRegion(region)) {
            Questions.storeVoiceSearchOcr(db.mysql.write, { student_id: req.user.student_id, ocr_text: ocrText });
            baseVariantAttachment = await UtilityFlagr.callFlagr(xAuthToken, 'search_service_voice_versions', 'search_service_voice_versions.payload');
        } else if (!Utility.isUsRegion(region)) {
            if (!source) {
                baseVariantAttachment = await UtilityFlagr.callFlagr(xAuthToken, 'search_service_tyd_suggestions', 'search_service_tyd_suggestions.payload');
            } else {
                const iterations = await Utility.getIterations();
                const iter = JSON.parse(iterations);
                for (let i = 0; i < iter.length; i++) {
                    if (iter[i].key === 'default') {
                        baseVariantAttachment = iter[i].attachment;
                        break;
                    }
                }
            }
        }

        if (versionCode <= 809) {
            baseVariantAttachment.isTextAnswered = false;
            if (source && source == 'panel') {
                delete baseVariantAttachment.isTextAnswered;
            }
        }
        if (Utility.isUsRegion(region)) {
            baseVariantAttachment = null;
        }
        const stockWordList = [];
        const languagesArrays = await LanguageContainer.getList(db);
        const languagesObj = Utility.getLanguageObject(languagesArrays);
        const stLangCode = locale;
        let language = languagesObj[stLangCode];
        if (typeof language === 'undefined') {
            language = 'english';
        }
        let useComposerApi = false;
        let searchFieldName = 'ocr_text';
        if (baseVariantAttachment && baseVariantAttachment.useComposerApi) {
            useComposerApi = true;
        }
        if (baseVariantAttachment && baseVariantAttachment.elasticIndexName) {
            indexName = baseVariantAttachment.elasticIndexName;
        }
        if (baseVariantAttachment && baseVariantAttachment.queryConfig && baseVariantAttachment.queryConfig.searchFieldName) {
            searchFieldName = baseVariantAttachment.queryConfig.searchFieldName;
        }

        const result = await helper.handleElasticSearchWrapper({
            ocr: ocrText,
            elasticSearchInstance,
            elasticSearchTestInstance,
            kinesisClient,
            elasticIndex: indexName,
            stockWordList,
            useStringDiff: true,
            language,
            fuzz,
            UtilityModule: Utility,
            studentId: '0',
            ocrType,
            variantAttachment: baseVariantAttachment,
            isStaging: false,
            next,
            region,
            useComposerApi,
            locale,
            searchFieldName,
        }, config);
        const { stringDiffResp, info } = result;
        if ((versionCode > 809 && !(source && source == 'panel')) || (source && source == 'web')) {
            stringDiffResp[0] = await QuestionContainer.getResourceType(db, stringDiffResp[0]);
        }
        const values = {};
        values.matches = stringDiffResp[0];

        if (req.user.locale === 'hi' || qid != 0) {
            let qlang = 'hi';
            if (qid != 0) {
                const quesData = await Questions.getByNewQuestionId(qid, db.mysql.read);
                qlang = !_.isEmpty(quesData) && quesData.length > 0 ? quesData[0].locale : 'en';
            }
            if (qlang === 'hi') {
                const qData = stringDiffResp[0];
                const promise = [];
                for (let i = 0; i < qData.length; i++) {
                    promise.push(QuestionContainer.getLocalisedOcrById(db, qData[i]._id, 'hindi'));
                }
                const localisedResults = await Promise.all(promise);
                for (let i = 0; i < qData.length; i++) {
                    if (localisedResults[i].length > 0 && localisedResults[i][0].hindi != '' && localisedResults[i][0].hindi != null) {
                        qData[i]._source.ocr_text = localisedResults[i][0].hindi;
                    }
                }
                values.matches = qData;
            }
        }

        if (Utility.isUsRegion(req.headers.country)) {
            let matchesArray = values.matches;
            matchesArray = matchesArray.map((elem) => ({
                ...elem,
                // question_thumbnail : `${config.staticCDN}q-thumbnail-localized/${elem._id}/english.webp`,
                // image_url : `${config.staticCDN}q-thumbnail-localized/${elem._id}/english.webp`
                question_thumbnail: `${config.cdn_url}question-thumbnail/en_${elem._id}.webp`,
                image_url: `${config.cdn_url}question-thumbnail/en_${elem._id}.webp`,
            }));
            values.matches = matchesArray;
        }

        const matchesQidArray = values.matches.length ? values.matches.map((x) => x._id) : [];

        if (studentId !== Data.tyd_suggestions_logs.stdid_for_not_logging) {
            const tydSuggestionsLogs = new TydSuggestionsLogsMongo({
                studentId,
                class: studentClass,
                locale,
                ocrText,
                matches: matchesQidArray,
                queryOcrText: info.query_ocr_text,
                isVoiceSearch: is_voice_search,
            });
            tydSuggestionsLogs.save();
        }

        values.query_ocr_text = info.query_ocr_text;
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: values,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getCustomMatches(req, res, next) {
    try {
        const {
            ocrText, locale, ocrType, elasticHostName, elasticIndexName, searchFieldName, filters,
        } = req.body;
        const db = req.app.get('db');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const config = req.app.get('config');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const kinesisClient = req.app.get('kinesis');
        const iterations = await Utility.getIterations();
        const iter = JSON.parse(iterations);
        let baseVariantAttachment = {};
        for (let i = 0; i < iter.length; i++) {
            if (iter[i].key === 'default') {
                baseVariantAttachment = iter[i].attachment;
                break;
            }
        }
        const stockWordList = [];
        const filter_keys_mapping = {
            video_language: 'video_language_code',
        };
        const languagesArrays = await LanguageContainer.getList(db);
        const languagesObj = Utility.getLanguageObject(languagesArrays);
        const stLangCode = locale;
        let language = languagesObj[stLangCode];
        if (typeof language === 'undefined') {
            language = 'english';
        }

        const result = await helper.handleElasticSearchWrapper({
            ocr: ocrText,
            elasticSearchInstance,
            elasticSearchTestInstance,
            kinesisClient,
            elasticIndex: elasticIndexName,
            elasticHostName,
            searchFieldName,
            stockWordList,
            useStringDiff: true,
            language,
            fuzz,
            UtilityModule: Utility,
            studentId: '0',
            ocrType,
            variantAttachment: baseVariantAttachment,
            isStaging: true,
            useComposerApi: true,
            next,
        }, config);
        const { stringDiffResp, info } = result;
        const values = {};
        values.matches = stringDiffResp[0];
        if (Array.isArray(values.matches)) {
            values.matches = await QuestionContainer.getLangCode(values.matches, db.mysql.read);
        }
        if (!_.isEmpty(filters)) {
            for (let i = 0; i < filters.length; i++) {
                const key = filter_keys_mapping[Object.keys(filters[i])[0]] || Object.keys(filters[i])[0];
                const value = Object.values(filters[i])[0];
                values.matches = values.matches.filter((e) => e._source[key] === value);
            }
        }
        values.query_ocr_text = info.query_ocr_text;
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: values,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getQuestionData(req, res) {
    const db = req.app.get('db');
    const question_data = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, req.params.question_id);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Search',
        },
        data: question_data,
    };
    return res.status(200).json(responseData);
}

async function getChapterListForDropdown(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const index_name = 'user-questions';
        const esResponse = await elasticSearchUserQuestionsInstance.getChapterList(index_name, 20);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: esResponse.aggregations.distinct_chapters.buckets,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getQuestionAskStatsByStudentId(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const index_name = 'user-questions';
        const { order, results_size } = req.body;
        const esResponse = await elasticSearchUserQuestionsInstance.getUserQuestionsGroupedByStudentId(index_name, results_size, order);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: esResponse.aggregations.distinct_studentids.buckets,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getQuestionsByStudentId(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const db = req.app.get('db');
        const index_name = 'user-questions';
        const esFilters = [];
        const studentId = req.params.student_id;
        const timestampFilter = {
            range: {
                timestamp: {
                    lt: moment().subtract(30, 'minutes').unix(),
                },
            },
        };

        const f = {
            term: {
                student_id: studentId,
            },
        };
        esFilters.push(f);
        esFilters.push(timestampFilter);
        const esResponse = await elasticSearchUserQuestionsInstance.getUserQuestionsByStudentId(index_name, 40, esFilters);
        if (!_.isEmpty(esResponse.hits.hits)) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: esResponse.hits.hits,
            };
            return res.status(200).json(responseData);
        }
        let promises = [];
        promises.push(StudentCourseMapping.getStudentCourse(db.mysql.read, studentId));
        promises.push(StudentContainer.getById(studentId, db));
        promises.push(Questions.getQuestionsAskedByStudentId(studentId, db.mysql.read));
        let resolvedPromises = await Promise.all(promises);
        const board = resolvedPromises[0];
        const { locale } = resolvedPromises[1][0];
        const studentAskedQuestionDetails = resolvedPromises[2];
        promises = [];
        for (let i = 0; i < studentAskedQuestionDetails.length; i++) {
            promises.push(Questions.getVideosWatched(studentAskedQuestionDetails[i].question_id, studentId, db.mysql.read));
        }
        resolvedPromises = await Promise.all(promises);
        let videoWatched;
        let ocr_service;
        const data = [];
        for (let i = 0; i < studentAskedQuestionDetails.length; i++) {
            videoWatched = _.uniq(resolvedPromises[i]);
            switch (studentAskedQuestionDetails[i].is_trial) {
                case 0:
                    ocr_service = 'img_mathpix';
                    break;
                case 1:
                    ocr_service = 'img_google_vision';
                    break;
                case 7:
                    ocr_service = 'viser_ocr';
                    break;
                default:
                    ocr_service = '';
            }
            data.push({
                _index: 'mysql',
                _type: 'repository',
                _id: studentAskedQuestionDetails[i].question_id,
                _score: 1,
                _source: {
                    chapter: studentAskedQuestionDetails[i].chapter,
                    class: studentAskedQuestionDetails[i].class,
                    contains_equation: 'mysql_data',
                    is_matched: videoWatched.length ? 1 : 0,
                    is_null_popup_show: 'mysql_data',
                    iteration_version: studentAskedQuestionDetails[i].question,
                    ocr_service,
                    ocr_text: studentAskedQuestionDetails[i].ocr_text,
                    question_id: studentAskedQuestionDetails[i].question_id,
                    question_image: studentAskedQuestionDetails[i].question_image,
                    question_locale: studentAskedQuestionDetails[i].locale,
                    school_board: (board.length !== 0) ? board[0].course : '',
                    student_id: studentAskedQuestionDetails[i].student_id,
                    subject: studentAskedQuestionDetails[i].subject,
                    user_locale: locale,
                    video_watched: [...videoWatched],
                },
            });
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SEARCH',
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getRecentUserQuestionsByFilters(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const {
            student_class,
            subject,
            locale,
            ocr_service,
            contains_diagram,
            is_handwritten,
            contains_table,
            contains_equation,
            only_unmatched,
            chapter,
            student_id,
            school_board,
            hour_timestamp,
        } = req.body;

        let { results_size } = req.body;
        const esFilters = [];
        const index_name = 'user-questions';
        // TODO : remove before merging
        // const index_name = 'user-questions-2021-08-30';
        const unmatched_filter = {
            term: {
                is_matched: 0,
            },
        };

        const timestampFilter = {
            range: {
                timestamp: {
                    lt: moment().subtract(1, 'hours').unix(),
                },
            },
        };

        if (typeof student_class !== 'undefined') {
            const f = {
                term: {
                    class: student_class,
                },
            };
            esFilters.push(f);
        }

        if (typeof chapter !== 'undefined') {
            const f = {
                term: {
                    'chapter.keyword': chapter,
                },
            };
            esFilters.push(f);
        }

        if (typeof student_id !== 'undefined') {
            const f = {
                term: {
                    student_id,
                },
            };
            esFilters.push(f);
        }

        if (typeof subject !== 'undefined') {
            const f = {
                term: {
                    subject,
                },
            };
            esFilters.push(f);
        }

        if (typeof locale !== 'undefined') {
            const f = {
                term: {
                    question_locale: locale,
                },
            };
            results_size = 50;
            esFilters.push(f);
        }

        if (typeof contains_equation !== 'undefined') {
            const f = {
                term: {
                    contains_equation,
                },
            };
            esFilters.push(f);
        }

        if (typeof contains_diagram !== 'undefined') {
            const f = {
                term: {
                    contains_diagram,
                },
            };
            esFilters.push(f);
        }

        if (typeof contains_table !== 'undefined') {
            const f = {
                term: {
                    contains_table,
                },
            };
            esFilters.push(f);
        }

        if (typeof school_board !== 'undefined') {
            const f = {
                term: {
                    'school_board.keyword': school_board,
                },
            };
            esFilters.push(f);
        }

        if (typeof ocr_service !== 'undefined') {
            const f = {
                term: {
                    ocr_service,
                },
            };
            esFilters.push(f);
        }

        if (typeof is_handwritten !== 'undefined') {
            let f;
            if (is_handwritten) {
                f = {
                    range: {
                        is_printed: {
                            lt: 0.8,
                        },
                    },
                };
            } else {
                f = {
                    range: {
                        is_printed: {
                            gt: 0.8,
                        },
                    },
                };
            }
            esFilters.push(f);
        }

        if (typeof only_unmatched !== 'undefined' && only_unmatched) {
            esFilters.push(unmatched_filter);
        }
        if (typeof hour_timestamp !== 'undefined') {
            const hour = parseInt(moment().add(5, 'hours').add(30, 'minutes').format('HH'));
            const diffrence_timestamp = Math.abs(hour - parseInt(hour_timestamp));
            esFilters.push({
                range: {
                    timestamp: {
                        lt: moment().subtract((diffrence_timestamp), 'hours')
                            .unix(),
                        gt: moment().subtract(diffrence_timestamp + 1, 'hours')
                            .unix(),
                    },
                },
            });
        } else {
            esFilters.push(timestampFilter);
        }
        const esResponse = await elasticSearchUserQuestionsInstance.getUserQuestionsByFilter(index_name, results_size, esFilters);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: esResponse.hits.hits,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getUserQuestionsDataByQid(req, res, next) {
    function isElasticResponseValid(elasticResponse) {
        return !_.isEmpty(elasticResponse)
            && _.get(elasticResponse[0], '_source.question_image', 0) && elasticResponse[0]._source.question_image.length
            && _.get(elasticResponse[0], '_source.iteration_version', 0) && elasticResponse[0]._source.iteration_version !== 'v_viser_search_retry';
    }
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const db = req.app.get('db');
        const { question_id } = req.params;
        const index_name = 'user-questions';

        const [response, videosWatched] = await Promise.all([
            elasticSearchUserQuestionsInstance.getById(index_name, question_id),
            Questions.getVideosWatchedByParentId(db.mysql.read, question_id),
        ]);
        if (isElasticResponseValid(response.hits.hits)) {
            // if (!(response.hits.hits[0]._source.videos_watched && response.hits.hits[0]._source.videos_watched.length > 0)) {
            if (videosWatched.length) {
                response.hits.hits[0]._source.videos_watched = [...videosWatched];
            }
            // }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SEARCH',
                },
                data: response.hits.hits[0],
            };
            return res.status(200).json(responseData);
        }
        const promises = [];
        const questionDetails = await Questions.getByNewQuestionId(question_id, db.mysql.read);
        promises.push(Questions.getVideosWatched(question_id, questionDetails[0].student_id, db.mysql.read));
        promises.push(StudentCourseMapping.getStudentCourse(db.mysql.read, questionDetails[0].student_id));
        promises.push(StudentContainer.getById(questionDetails[0].student_id, db));
        const resolvedPromises = await Promise.all(promises);
        const videoWatched = _.uniq(resolvedPromises[0]);
        const board = resolvedPromises[1];
        const { locale } = resolvedPromises[2][0];
        let ocr_service;
        switch (questionDetails[0].is_trial) {
            case 0:
                ocr_service = 'img_mathpix';
                break;
            case 1:
                ocr_service = 'img_google_vision';
                break;
            case 7:
                ocr_service = 'viser_ocr';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SEARCH',
            },
            data: {
                _index: 'mysql',
                _type: 'repository',
                _id: question_id,
                _score: 1,
                _source: {
                    chapter: questionDetails[0].chapter,
                    class: questionDetails[0].class,
                    contains_equation: 'mysql_data',
                    is_matched: videoWatched.length ? 1 : 0,
                    is_null_popup_show: 'mysql_data',
                    iteration_version: questionDetails[0].question,
                    ocr_service,
                    ocr_text: questionDetails[0].ocr_text,
                    question_id: questionDetails[0].question_id,
                    question_image: questionDetails[0].question_image,
                    question_locale: questionDetails[0].locale,
                    school_board: (board.length !== 0) ? board[0].course : '',
                    student_id: questionDetails[0].student_id,
                    subject: questionDetails[0].subject,
                    user_locale: locale,
                    videos_watched: [...videoWatched],
                },
            },
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getSimilarUserQuestionsClusters(req, res) {
    try {
        const db = req.app.get('db');
        const collection = 'user_question_text_cluster_analytics';
        const query = {};
        const pageNumber = req.params.page || 1;
        const nPerPage = 5;
        const projection = {
            _id: 1,
            text: {
                $slice: 3,
            },
            subject: 1,
            freq: 1,
            match_per: 1,
            umatch_per: 1,
        };
        const qList = await db.mongo.read.collection(collection)
            .find(query, { projection })
            .sort({
                createtime: -1,
            })
            .skip(pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0)
            .limit(nPerPage)
            .toArray();
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: qList,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getSimilarUserQuestionsClusterDetails(req, res) {
    try {
        const db = req.app.get('db');
        const collection = 'user_question_text_cluster_analytics';
        const query = {
            _id: ObjectId(req.params.id),
        };
        const details = await db.mongo.read.collection(collection).findOne(query);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: details,
        };
        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getByUserQuestionOcr(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const { ocr } = req.query;
        const index_name = 'user-questions';

        const response = await elasticSearchUserQuestionsInstance.getByOcr(index_name, ocr);
        console.log(response);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: response.hits.hits,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getLanguageBumpQids(req, res, next) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const index_name = 'user-questions';
        const { swap_type, results_size, experiment_type } = req.body;
        const esFilters = [];
        if (!_.isEmpty(experiment_type)) {
            esFilters.push(
                {
                    wildcard: {
                        languagePrioritySwapType: `*_swaps_${experiment_type}`,
                    },
                },
            );
        } else {
            esFilters.push(
                {
                    term: {
                        languagePrioritySwapType: `${swap_type}_swaps`,
                    },
                },
            );
        }

        const esResponse = await elasticSearchUserQuestionsInstance.getUserQuestionsByFilter(index_name, results_size, esFilters);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: esResponse.hits.hits,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getLangBumpQidDetails(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const index_name = 'user-questions';
        const { qid } = req.body;
        const data = {};
        const qidResp = await elasticSearchUserQuestionsInstance.getById(index_name, qid);
        const matched_qid_array = qidResp.hits.hits[0]._source.matched_questions_arr;
        const esMatchedQidsResults = await elasticSearchTestInstance.getByIds('question_bank_v1.1', matched_qid_array);
        const qidData = [];
        for (let i = 0; i < esMatchedQidsResults.docs.length; i++) {
            if (esMatchedQidsResults.docs[i].found) {
                const obj = {
                    question_id: esMatchedQidsResults.docs[i]._id,
                    ocr_text: esMatchedQidsResults.docs[i]._source.ocr_text,
                    video_language: esMatchedQidsResults.docs[i]._source.video_language,
                    package_language: esMatchedQidsResults.docs[i]._source.package_language,
                };
                qidData.push(obj);
            }
        }

        data.question_id = qid;
        data.question_image = qidResp.hits.hits[0]._source.question_image;
        data.ocr_text = qidResp.hits.hits[0]._source.ocr_text;
        data.question_locale = qidResp.hits.hits[0]._source.question_locale;
        data.matched_position = qidResp.hits.hits[0]._source.match_position || -1;
        data.matches = qidData;
        data.swaps = qidResp.hits.hits[0]._source.languagePriorityQidSwaps;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (err) {
        console.log(err);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: err.message,
            },
            data: null,
        };
        return res.status(403).json(responseData);
    }
}

async function getDuplicateSolutions(req, res) {
    let responseData = {
        meta: {
            code: 500,
            success: false,
        },
        data: [],
    };
    try {
        const appDb = req.app.get('db');
        const config = req.app.get('config');
        MongoClient.connect(url = config.mongo.database_url, { useNewUrlParser: true, useUnifiedTopology: true }, async (err, client) => {
            if (err) {
                responseData.meta.message = err.message;
                return res.status(500).json(responseData);
            }
            // logic here
            const db = client.db(config.mongo.database_name);
            db.collection('daily_duplicate_solutions').find({}, { projection: { _id: 0 } }).toArray(async (err, result) => {
                if (err) {
                    responseData.meta.message = err.message;
                    return res.status(500).json(responseData);
                }
                const finalArray = [];
                const qidArray = [];
                const infoDict = {};
                const finalObj = [];
                let qids;
                result.forEach((row) => {
                    qidRow = row.qid_array.replace('[', '');
                    qidRow = qidRow.replace(']', '');
                    qids = qidRow.split(',');
                    qids.forEach((qid) => {
                        qidArray.push(qid);
                    });
                    finalArray.push(qids);
                });
                const rresp = await Search.getQuestionCreationInfo(appDb.mysql.read, qidArray);
                rresp.forEach((element) => {
                    infoDict[element.question_id] = {
                        answer_id: element.answer_id,
                        answer_video: element.answer_video,
                        expert_id: element.expert_id,
                        ocr_text: element.ocr_text,
                        class: element.class,
                        subject: element.subject,
                        target_group: element.target_group,
                        video_language: element.video_language,
                    };
                });
                let tempObj;
                finalArray.forEach((miniArray) => {
                    tempObj = {};
                    miniArray.forEach((element) => {
                        tempObj[element.trim()] = infoDict[element.trim()];
                    });
                    finalObj.push(tempObj);
                });
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                    },
                    data: finalObj,
                };

                return res.status(200).json(responseData);
            });
        });
    } catch (err) {
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getAdvanceSearchLogs(req, res, next) {
    try {
        const db = req.app.get('db');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const index_name = 'user-questions';
        const pageNumber = req.params.page || 1;
        const nPerPage = 30;
        const docs = await db.mongo.read
            .collection('advance_search_logs')
            .find({})
            .sort({
                createdAt: -1,
            })
            .skip(pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0)
            .limit(30)
            .toArray();

        const qids_arr = [];
        for (let i = 0; i < docs.length; i++) {
            qids_arr.push(docs[i].questionId);
        }
        const questionDetails = await elasticSearchInstance.getByIds(index_name, qids_arr);
        for (let i = 0; i < questionDetails.docs.length; i++) {
            if (questionDetails.docs[i].found) {
                docs[i].questionLocale = questionDetails.docs[i]._source.question_locale;
                docs[i].userLocale = questionDetails.docs[i]._source.user_locale;
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: docs,
        };
        return res.status(200).json(responseData);
    } catch (err) {
        console.log(err);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: err.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getAdvanceSearchLogViewIdDetails(req, res) {
    try {
        const db = req.app.get('db');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const { question_id, view_id, filters } = req.body;
        const user_questions_index_name = 'user-questions';
        const match_results = await db.mongo.read
            .collection('question_logs_user')
            .find({ qid: question_id })
            .limit(1).toArray();
        const mongoAdvLogs = await db.mongo.read
            .collection('advance_search_logs')
            .find({ questionId: question_id, viewId: view_id })
            .limit(1).toArray();
        const data = [];
        const promises = [];
        promises.push(elasticSearchTestInstance.getByIds('question_bank_v1.1', match_results[0].qid_matches_array));
        promises.push(elasticSearchTestInstance.getById('question_bank_v1.1', view_id));
        promises.push(elasticSearchInstance.getById(user_questions_index_name, question_id));
        const [esMatchedQidsResults, response, userQuestionResponse] = await Promise.all(promises);

        for (let i = 0; i < esMatchedQidsResults.docs.length; i++) {
            if (esMatchedQidsResults.docs[i].found) {
                const obj = {
                    question_id: esMatchedQidsResults.docs[i]._id,
                    ocr_text: esMatchedQidsResults.docs[i]._source.ocr_text,
                    video_language: esMatchedQidsResults.docs[i]._source.video_language,
                    package_language: esMatchedQidsResults.docs[i]._source.package_language,
                };
                data.push(obj);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                original_matches: data,
                view_qid_details: response.hits.hits[0],
                user_qid_details: userQuestionResponse.hits.hits[0],
                filters: mongoAdvLogs[0].filters,
            },
        };
        return res.status(200).json(responseData);
    } catch (err) {
        console.log(err);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: err.message,
            },
            data: null,
        };
    }
}

async function getUserQuestionsByPosition(req, res) {
    try {
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const { match_position } = req.params;
        const results_size = 20;
        const index_name = 'user-questions';
        const esFilters = [
            {
                term: {
                    is_matched: 1,
                },
            },
        ];
        esFilters.push({
            term: {
                match_position,
            },
        });
        const esResponse = await elasticSearchUserQuestionsInstance.getUserQuestionsByFilter(index_name, results_size, esFilters);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: esResponse.hits.hits,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getDnQuestionsDuplicates(req, res) {
    try {
        const db = req.app.get('db');
        const orderBy = req.body.frequency_order;
        const clusterLocale = req.body.cluster_locale;
        const clusterNamesByLocale = {
            en: 'dn_questions_ocr_en',
            hi: 'dn_questions_ocr_hi',
        };
        const collection = clusterNamesByLocale[clusterLocale];
        const { frequency } = req.body;
        const query = {
            frequency,
        };
        const pageNumber = req.body.page || 1;
        const nPerPage = 5;
        const projection = {
            _id: 1,
            text: {
                $slice: 3,
            },
            question_id: {
                $slice: 3,
            },
            freq: 1,
            vlang_map: {
                $slice: 3,
            },
        };
        const qList = await db.mongo.read.collection(collection)
            .find(query, { projection })
            .sort({
                freq: orderBy === 'asc' ? 1 : -1,
            })
            .skip(pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0)
            .limit(nPerPage)
            .toArray();
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: qList,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getDnQuestionsDuplicatesDetails(req, res) {
    try {
        const db = req.app.get('db');
        const clusterNamesByLocale = {
            en: 'dn_questions_ocr_en',
            hi: 'dn_questions_ocr_hi',
        };
        const collection = clusterNamesByLocale[req.params.locale];
        const query = {
            _id: ObjectId(req.params.id),
        };
        const details = await db.mongo.read.collection(collection).findOne(query);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: details,
        };
        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getTypedQuestions(req, res) {
    try {
        const db = req.app.get('db');
        const { page } = req.params;
        const limit = 10;
        const offset = (page - 1) * limit;
        const sql = `select * from questions_new where ocr_text is not null and question_image is null order by question_id desc limit ${limit} offset ${offset}`;
        const results = await db.mysql.read.query(sql);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: results,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getUserRecentQuestions(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id, question_id } = req.params;
        if (typeof student_id === 'undefined') {
            throw new Error('empty student id');
        }
        const sql = `select a.question_id, count(b.question_id) as total_video_count,sum(b.engage_time) as vt,sum(b.engage_time) as et,subject, chapter, question_image, ocr_text, question from ((SELECT * FROM questions_new where student_id = ${student_id} and question_id < ${question_id}) as a left join (select * from video_view_stats) as b on a.question_id = b.parent_id) group by a.question_id order by timestamp desc limit 10`;
        const results = await db.mysql.read.query(sql);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: results,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getAllVariantsByFlagId(req, res) {
    try {
        const { flag_id } = req.params;
        const response = await axios.get(`${Data.FLAGR_HOST}/api/v1/flags/${flag_id}/variants`);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: response.data,
        };
        return res.status(200).json(responseData);
    } catch (E) {
        console.log(E);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = E.message;
        return res.status(500).json(responseData);
    }
}

async function getClusterQuestionByClusterId(req, res) {
    try {
        const db = req.app.get('db');
        const {
            cluster_id,
            video_language,
        } = req.params;
        const collection = 'unmatched_user_questions_weekly_clusters';
        const results = await db.mongo.read.collection(collection)
            .find({
                cluster_id: cluster_id.toString(),
                video_locale: video_language,
                is_matched: null,
            }).toArray();
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: {
                is_matching_completed: !!(results && results.length && results[0].is_matching_completed),
                data: results,
            },
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function updateUnmatchedClusterByExpert(req, res) {
    try {
        const db = req.app.get('db');
        const {
            cluster_id,
            is_completed,
            assigned_to,
            unassign,
            is_matching_completed,
            subject,
        } = req.body;

        const collection = 'unmatched_user_questions_weekly_clusters';
        const findDocQuery = {
            cluster_id: cluster_id.toString(),
        };

        const updateDocQuery = {};

        if (typeof assigned_to !== 'undefined') {
            updateDocQuery.assigned_to = parseInt(assigned_to);
            updateDocQuery.allocation_time = moment().format('YYYY-MM-DD hh:mm:ss');
        }

        if (typeof is_completed !== 'undefined') {
            updateDocQuery.is_completed = 1;
        }

        if (typeof is_matching_completed !== 'undefined') {
            updateDocQuery.is_matching_completed = 1;
        }

        if (typeof unassign !== 'undefined') {
            updateDocQuery.assigned_to = null;
        }

        if (typeof subject !== 'undefined') {
            updateDocQuery.subject = subject;
        }

        if (!_.isEmpty(updateDocQuery)) {
            await db.mongo.write.collection(collection).updateMany(findDocQuery, {
                $set: updateDocQuery,
            });
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: null,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getClusterQuestionByQuestionId(req, res) {
    try {
        const db = req.app.get('db');
        const collection = 'unmatched_user_questions_weekly_clusters';
        const {
            question_id,
            video_language,
        } = req.params;
        const findDocQuery = {
            question_id: parseInt(question_id),
            video_locale: video_language || 'en',
        };
        const results = await db.mongo.read.collection(collection).findOne(findDocQuery);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: results,
        };

        return res.status(200).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getUserUnmatchedQuestionsDetails(req, res) {
    try {
        const db = req.app.get('db');
        const {
            video_language,
            page_number,
            assigned_to,
            subject,
            cluster_type,
        } = req.body;
        let myAssignedClustersGetterFlag = false;
        const count_per_page = 20;
        const offset = page_number > 0 ? (page_number - 1) * count_per_page : 0;
        const collection = 'unmatched_user_questions_weekly_clusters';
        const matchQuery = {
            $and: [
                {
                    $or: [
                        {
                            is_answered: {
                                $exists: false,
                            },
                        },
                        {
                            is_answered: 0,
                        },
                    ],
                },
                {
                    $or: [
                        {
                            is_discarded: {
                                $exists: false,
                            },
                        },
                        {
                            is_discarded: 0,
                        },
                    ],
                },
            ],
            is_matched: {
                $exists: false,
            },
            question_id: {
                $gt: 1455711032,
            },
            assigned_to: null,
            is_complete: null,
        };

        if (typeof video_language !== 'undefined') {
            matchQuery.video_locale = video_language || 'en';
        }
        if (typeof assigned_to !== 'undefined') {
            matchQuery.assigned_to = parseInt(assigned_to);
            myAssignedClustersGetterFlag = true;
        }

        if (typeof subject !== 'undefined') {
            matchQuery.subject = subject;
        }

        if (typeof cluster_type !== 'undefined') {
            // matchQuery.cluster_type = cluster_type;
        }
        console.log(db.mongo.read);
        const results = await db.mongo.read.collection(collection)
            .aggregate([
                {
                    $match: matchQuery,
                },
                {
                    $project: { _id: 0 },
                },
                {
                    $group: {
                        _id: '$cluster_id',
                        csum: {
                            $avg: '$freq',
                        },
                        question_image: {
                            $first: '$question_image',
                        },
                        ocr_text: {
                            $first: '$text',
                        },
                        question_locale: {
                            $first: '$question_locale',
                        },
                        is_matching_completed: {
                            $first: '$is_matching_completed',
                        },
                        video_locale: {
                            $first: '$video_locale',
                        },
                        cluster_type: {
                            $first: '$cluster_type',
                        },
                    },
                },
                {
                    $sort: {
                        csum: -1,
                    },
                },
                {
                    $skip: offset,
                },
                {
                    $limit: count_per_page,
                },
            ]).toArray();

        if (myAssignedClustersGetterFlag) {
            const matchingStatusPromises = [];
            for (let j = 0; j < results.length; j++) {
                const cluster_id = results[j]._id;
                matchingStatusPromises.push(db.mongo.read.collection(collection).find({
                    cluster_id: cluster_id.toString(),
                    is_matched: 1,
                }).count());
            }

            const resolvedMatchCounts = await Promise.all(matchingStatusPromises);
            console.log(resolvedMatchCounts);
            for (let k = 0; k < resolvedMatchCounts.length; k++) {
                results[k].can_unassign = !(resolvedMatchCounts[k] > 0);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: results,
        };

        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getSubjectsByUserUnmatchedClusters(req, res) {
    try {
        const db = req.app.get('db');
        const collection = 'unmatched_user_questions_weekly_clusters';
        const { video_language } = req.query;

        const matchQuery = {
            $and: [
                {
                    $or: [
                        {
                            is_answered: {
                                $exists: false,
                            },
                        },
                        {
                            is_answered: 0,
                        },
                    ],
                },
                {
                    $or: [
                        {
                            is_discarded: {
                                $exists: false,
                            },
                        },
                        {
                            is_discarded: 0,
                        },
                    ],
                },
            ],
            is_matched: {
                $exists: false,
            },
            assigned_to: null,
            is_complete: null,
            subject: {
                $ne: '',
            },
            question_id: {
                $gt: 1455711032,
            },
        };
        if (typeof video_language !== 'undefined') {
            matchQuery.video_locale = video_language || 'en';
        }
        console.log(matchQuery);
        const results = await db.mongo.read.collection(collection).distinct('subject', matchQuery);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: results,
        };

        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function updateMatchedQuestionsForTextClusters(req, res) {
    try {
        // TODO: GET cluster_id as well ( by client)
        const db = req.app.get('db');
        const {
            question_id,
            video_language,
            matched_question_id,
        } = req.body;
        const collection = 'unmatched_user_questions_weekly_clusters';
        await db.mongo.write.collection(collection).updateMany({
            question_id: parseInt(question_id),
            video_locale: video_language,
        }, {
            $set: {
                is_matched: 1,
                matched_question_id,
            },
        });
        const findDocQuery = {
            question_id: parseInt(question_id),
            video_locale: video_language,
        };
        const cluster_id = await db.mongo.read.collection(collection).findOne(findDocQuery, { cluster_id: 1 }).then((x) => x.cluster_id);
        const countDocPromises = [];
        countDocPromises.push(db.mongo.read.collection(collection).find({
            cluster_id: cluster_id.toString(),
            is_answered: '1',
        }).count());

        countDocPromises.push(db.mongo.read.collection(collection).find({
            cluster_id: cluster_id.toString(),
            is_matched: 1,
        }).count());

        countDocPromises.push(db.mongo.read.collection(collection).find({
            cluster_id: cluster_id.toString(),
        }).count());
        const [answered_questions, matched_questions, total_questions] = await Promise.all(countDocPromises);
        if (matched_questions + answered_questions >= total_questions) {
            // MARK THE CLUSTER AS COMPLETE
            await db.mongo.write.collection(collection).updateMany({
                cluster_id: cluster_id.toString(),
            }, {
                $set: {
                    is_complete: 1,
                },
            });
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: null,
        };

        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function updateUnmatchedQuestionRowByExpert(req, res) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const translate2 = req.app.get('translate2');
        const {
            question_id,
            video_language,
            is_answered,
            ocr_text,
            assigned_to,
            subject,
            new_question_id,
            is_discarded,
        } = req.body;
        const collection = 'unmatched_user_questions_weekly_clusters';
        const findDocQuery = {
            question_id: parseInt(question_id),
            video_locale: video_language,
        };
        const updateDocQuery = {};
        if (!_.isEmpty(ocr_text)) {
            updateDocQuery.text = ocr_text;
        }
        if (typeof is_answered !== 'undefined') {
            updateDocQuery.is_answered = is_answered;
        }
        if (typeof assigned_to !== 'undefined') {
            updateDocQuery.assigned_to = parseInt(assigned_to);
            updateDocQuery.allocation_time = moment().format('YYYY-MM-DD hh:mm:ss');
        }

        if (typeof new_question_id !== 'undefined') {
            updateDocQuery.new_question_id = parseInt(new_question_id);
        }

        if (typeof is_discarded !== 'undefined') {
            updateDocQuery.is_discarded = parseInt(is_discarded);
        }

        console.log(updateDocQuery);
        if (!_.isEmpty(subject)) {
            updateDocQuery.subject = subject;
        }

        if (!_.isEmpty(updateDocQuery)) {
            await db.mongo.write.collection(collection).updateOne(findDocQuery, {
                $set: updateDocQuery,
            });
        }

        //  get the cluster_id ->
        const cluster_id = await db.mongo.read.collection(collection).findOne(findDocQuery, { cluster_id: 1 }).then((x) => x.cluster_id);
        const countDocPromises = [];
        countDocPromises.push(db.mongo.read.collection(collection).find({
            cluster_id: cluster_id.toString(),
            is_answered: '1',
        }).count());

        countDocPromises.push(db.mongo.read.collection(collection).find({
            cluster_id: cluster_id.toString(),
            is_matched: 1,
        }).count());

        countDocPromises.push(db.mongo.read.collection(collection).find({
            cluster_id: cluster_id.toString(),
        }).count());

        const [answered_questions, matched_questions, total_questions] = await Promise.all(countDocPromises);
        if (matched_questions + answered_questions >= total_questions) {
            // MARK THE CLUSTER AS COMPLETE
            db.mongo.write.collection(collection).update({
                cluster_id: cluster_id.toString(),
            }, {
                $set: {
                    is_complete: 1,
                },
            });
        }

        if (typeof is_answered !== 'undefined' && parseInt(is_answered) === 1 && typeof new_question_id !== 'undefined') {
            // PART 1 ------------ [ INSERT IN INDEX ]
            // const lambda = new Lambda({ accessKeyId: config.aws_access_id, secretAccessKey: config.aws_secret });
            // lambda.invoke({
            //     FunctionName: 'new_question',
            //     Payload: JSON.stringify({
            //         question_id: new_question_id,
            //     }),
            // }, (err, data) => {
            //     if (err) console.log(err, err.stack); // an error occurred
            //     else console.log(data);
            // });

            await QuestionHelper.addQuestionToElasticIndex(db, elasticSearchTestInstance, translate2, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, cluster_id, collection, question_id, new_question_id, video_language);

            // PART 2 -------- [ SEND NOTIF TO STUDENTS ]
            const questions_by_matched_id = await db.mongo.read.collection(collection).find({
                matched_question_id: question_id.toString(),
                video_locale: video_language,
            }, {
                question_id: 1,
                student_id: 1,
            }).toArray();
            const questions_by_similar_matched_id = await db.mongo.read.collection(collection).find({
                matched_question_id: {
                    $in: [...questions_by_matched_id.map((x) => x.question_id.toString())],
                },
                video_locale: video_language,
            }, {
                question_id: 1,
                student_id: 1,
            }).toArray();
            const student_ids = _.uniq([...questions_by_matched_id.map((x) => x.student_id), ...questions_by_similar_matched_id.map((y) => y.student_id)]);
            const student_data_promises = [];
            for (let i = 0; i < student_ids.length; i++) {
                student_data_promises.push(StudentContainer.getById(student_ids[i], db));
            }
            const student_data = await Promise.all(student_data_promises);
            let users = [];
            for (let j = 0; j < student_data.length; j++) {
                users.push({
                    id: student_data[j][0].student_id,
                    gcmId: student_data[j][0].gcm_reg_id,
                    locale: student_data[j][0].locale,
                });
            }
            users = users.filter((x) => !_.isNull(x.gcm_reg_id));
            users = _.mapValues(_.groupBy(users, 'locale'), (clist) => clist.map((x) => _.omit(x, 'locale')));
            for (const locale in users) {
                if (users.hasOwnProperty(locale)) {
                    const nd = Data.unmatched_questions_post_solution_notifications_config[locale === 'hi' ? 'hi' : 'en'];
                    const notificationData = {
                        event: 'video',
                        title: nd.title,
                        message: nd.message,
                        image: null,
                        firebase_eventtag: nd.tag,
                        s_n_id: nd.tag,
                        path: 'wait',
                        data: {
                            deeplink: `doubtnutapp://video?qid=${new_question_id}&page=NOTIFICATION`,
                        },
                    };
                    Utility.sendFcmByTargetUsers(users[locale], notificationData);
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: null,
        };

        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getAnswerPanelDropwdownConfig(req, res) {
    try {
        const db = req.app.get('db');
        const promises = [];
        const sql1 = 'SELECT DISTINCT(video_language) FROM `studentid_package_mapping_new`';
        const sql2 = 'SELECT DISTINCT(subject) FROM `questions` where timestamp >= CURRENT_DATE-1';
        promises.push(db.mysql.read.query(sql1));
        promises.push(db.mysql.read.query(sql2));
        const resolvedPromises = await Promise.all(promises);
        const [video_languages, subjects] = resolvedPromises;
        const data = {
            video_languages: [...video_languages.map((x) => x.video_language)],
            subjects: [...subjects.map((x) => x.subject)],
        };
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: null,
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getNewUserQuestions(req, res) {
    try {
        const question_count_limit = 10;
        const { student_class, question_locale, app_locale } = req.body;
        const db = req.app.get('db');
        let student_query_filters = '';
        let student_filter_query_template = `SELECT student_id FROM students WHERE timestamp >= CURRENT_DATE ${student_query_filters}`;
        if (typeof student_class !== 'undefined') {
            student_query_filters += ` AND class=${student_class}`;
        }
        if (!_.isEmpty(app_locale)) {
            student_query_filters += ` AND locale='${app_locale}'`;
        }

        if (student_query_filters.length > 0) {
            student_filter_query_template += student_query_filters;
        }

        let question_property_filter_template = '';
        if (!_.isEmpty(question_locale)) {
            question_property_filter_template += `AND locale='${question_locale}'`;
        }
        const sql = `SELECT * FROM questions_new WHERE student_id IN (${student_filter_query_template}) AND question NOT LIKE 'askV10' AND doubt not IN ( 'WEB','WHATSAPP','WHATSAPP_NT','DESKTOP_VOICE','MWEB_VOICE','desktop','mweb','desktop-us','mweb-us','APP_US') AND question_image IS NOT NULL ${question_property_filter_template} ORDER BY timestamp DESC LIMIT ${question_count_limit}`;
        const data = await db.mysql.read.query(sql);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: null,
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getBackPressMatchesForPanel(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            ocr_text,
            question_locale,
            user_locale,
            student_class: studentClass,
            ocr_type: ocrType,
        } = req.body;
        const elasticSearchLtrInstance = req.app.get('elasticSearchLtrInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const config = req.app.get('config');
        const kinesisClient = req.app.get('kinesis');
        const translate2 = req.app.get('translate2');
        const indexName = 'question_bank';
        const stockWordList = [];
        const data = [];
        const attachmentPromises = [];
        attachmentPromises.push(Utility.getIterations(3));
        attachmentPromises.push(Utility.getIterations(427));

        let [searchServiceIterations, backpressMatchesIterations] = await Promise.all(attachmentPromises);

        searchServiceIterations = JSON.parse(searchServiceIterations).filter((x) => (x.key === 'default'));
        backpressMatchesIterations = JSON.parse(backpressMatchesIterations).filter((x) => x.attachment.is_active === 1);

        const backpressMatchesPromises = [];
        for (let i = 0; i < backpressMatchesIterations.length; i++) {
            backpressMatchesPromises.push(QuestionHelper.handleBackPressMatches({
                db,
                elasticSearchLtrInstance,
                elasticSearchTestInstance,
                ocr: ocr_text,
                user_locale,
                ques_locale: question_locale,
                config,
                backpressUserMatchesStrategyAttachment: backpressMatchesIterations[i].attachment,
                fuzz,
            }));
        }
        const backpressMatchesData = await Promise.all(backpressMatchesPromises);
        for (let i = 0; i < backpressMatchesIterations.length; i++) {
            const obj = {
                [backpressMatchesIterations[i].key]: {
                    matches: backpressMatchesData[i].backPressMatchArray,
                    query_ocr_text: ocr_text,
                },
            };
            data.push(obj);
        }

        searchServiceIterations[0].attachment.questionLocale = question_locale;
        const search_service_default_matches = await QuestionHelper.handleElasticSearchWrapper({
            ocr: ocr_text,
            elasticSearchInstance,
            elasticSearchTestInstance,
            kinesisClient,
            elasticIndex: indexName,
            stockWordList,
            useStringDiff: true,
            language: question_locale,
            locale: user_locale,
            fuzz,
            UtilityModule: Utility,
            studentId: '0',
            studentClass,
            ocrType,
            db,
            QuestionContainer,
            translate2,
            variantAttachment: searchServiceIterations[0].attachment,
            isStaging: true,
            useComposerApi: searchServiceIterations[0].attachment.useComposerApi,
            questionLocale: question_locale,
            req,
            next,
        }, config);

        data.push({
            ss_default: {
                matches: search_service_default_matches.stringDiffResp[0],
                query_ocr_text: ocr_text,
            },
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.error(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: null,
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getTydSuggestionsLogs(req, res) {
    try {
        const db = req.app.get('db');
        const collection = Data.tyd_suggestions_logs.collection_name;
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const query = req.body.filters;
        const pageNumber = req.body.pageNumber || 1;
        const resultsPerPage = Data.tyd_suggestions_logs.results_per_page;
        const { projection } = Data.tyd_suggestions_logs;
        const suggestions = await db.mongo.read.collection(collection)
            .find(query, { projection })
            .sort({
                createdAt: -1,
            })
            .skip(pageNumber > 0 ? ((pageNumber - 1) * resultsPerPage) : 0)
            .limit(resultsPerPage)
            .toArray();
        const promises = [];
        for (let i = 0; i < suggestions.length; i++) {
            if (suggestions[i].matches.length) {
                promises.push(elasticSearchTestInstance.findDocumentsBulk(suggestions[i].matches));
            } else {
                promises.push(Promise.resolve());
            }
            // suggestions[i].matches = suggestions[i].matches.length ? await elasticSearchTestInstance.findDocumentsBulk(suggestions[i].matches) : [];
            // if (suggestions[i].matches.docs) {
            //     suggestions[i].matches = suggestions[i].matches.docs;
            // }
        }
        const resp = await Promise.all(promises);
        for (let i = 0; i < suggestions.length; i++) {
            if (resp[i] !== undefined && resp[i].docs) {
                suggestions[i].matches = resp[i].docs;
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: suggestions,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getTydSuggestionsSession(req, res) {
    async function getQidsMeta(esClient, qids) {
        if (qids && qids.length) {
            const response = await esClient.findDocumentsBulk(qids);
            if (response !== undefined && response.docs) {
                return response.docs;
            }
        }
        return [];
    }

    async function getMatchedQidDetails(esClient, matches) {
        const promises = [];
        for (let i = 0; i < matches.length; i++) {
            promises.push(getQidsMeta(esClient, matches[i]));
        }
        const resolvedPromises = await Promise.all(promises);
        return resolvedPromises;
    }

    try {
        const db = req.app.get('db');
        const collection = Data.tyd_suggestions_logs.collection_name;
        const query = req.body.filters;
        const pageNumber = req.body.pageNumber || 1;
        const resultsPerPage = 200;
        const { projection } = Data.tyd_suggestions_logs;
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        let suggestions = await db.mongo.read.collection(collection)
            .find(query, { projection })
            .sort({ createdAt: -1 })
            .skip(pageNumber > 0 ? ((pageNumber - 1) * resultsPerPage) : 0)
            .limit(resultsPerPage)
            .toArray();
        suggestions = suggestions.sort((a, b) => b.studentId - a.studentId);
        let ocrInSession = [suggestions[0].ocrText];
        let createtime = [suggestions[0].createdAt];
        let matches = [suggestions[0].matches];
        const resp = [];
        let countOfSessions = 0;
        for (let index = 1; index < suggestions.length; index++) {
            if (Utility.compareBystringDiff(fuzz, suggestions[index - 1].ocrText, suggestions[index].ocrText) >= 50 && suggestions[index - 1].studentId === suggestions[index].studentId) {
                ocrInSession.push(suggestions[index].ocrText);
                createtime.push(suggestions[index].createdAt);
                matches.push(suggestions[index].matches);
            } else {
                const data = {
                    studentId: suggestions[index - 1].studentId,
                    class: suggestions[index - 1].class,
                    locale: suggestions[index - 1].locale,
                    ocr_array: ocrInSession,
                    matches,
                    session_time_in_sec: (createtime[0] - createtime.slice(-1)[0]) / 1000,
                    number_of_times_api_is_called: ocrInSession.length,
                };
                countOfSessions += 1;
                ocrInSession = [suggestions[index].ocrText];
                createtime = [suggestions[index].createdAt];
                matches = [suggestions[index].matches];
                resp.push(data);
                if (countOfSessions === Data.tyd_suggestions_logs.results_per_page) {
                    break;
                }
            }
        }

        const promises = [];
        for (let m = 0; m < resp.length; m++) {
            promises.push(getMatchedQidDetails(elasticSearchTestInstance, resp[m].matches));
        }
        const resolvedPromises = await Promise.all(promises);
        for (let m = 0; m < resolvedPromises.length; m++) {
            resp[m].matches = resolvedPromises[m];
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: resp,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        console.log(err);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getUserQuestionClusterTypes(req, res) {
    function getLocaleByVideoLocale(video_language) {
        if (video_language == 'hi') {
            return 'hi';
        } return 'en';
    }
    try {
        const db = req.app.get('db');
        const collection = 'unmatched_user_questions_weekly_clusters';
        const { video_language, subject } = req.query;
        const locale_filter = typeof video_language !== 'undefined' ? getLocaleByVideoLocale(video_language) : 'en';
        const findQuery = {
            question_id: {
                $gt: 1455711032,
            },
        };
        if (typeof video_language !== 'undefined' && video_language) {
            findQuery.video_locale = video_language;
        }

        if (typeof subject !== 'undefined' && subject) {
            findQuery.subject = subject;
        }
        const promises = [];
        promises.push(UserQuestionOcrClusterMapping.getActiveClusterTypes(db.mysql.read, locale_filter));
        promises.push(db.mongo.read.collection(collection).distinct('cluster_type', findQuery));
        const [all_cluster_types, available_cluster_types] = await Promise.all(promises);
        const clusterTypePriorityMap = {};

        for (const clusterDetails of all_cluster_types) {
            clusterTypePriorityMap[clusterDetails.cluster_type] = clusterDetails.priority;
        }

        const data = available_cluster_types.filter((a) => (a in clusterTypePriorityMap)).sort((a, b) => clusterTypePriorityMap[a] - clusterTypePriorityMap[b]);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };

        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getPanelMasterIterationData(req, res, next) {
    try {
        const {
            fileName, userQid, isTyd, takeMasterIterationCachedData,
        } = req.body;
        let {
            ocrText, ocrType, isEdited, language,
        } = req.body;
        if (_.isEmpty(fileName) && typeof ocrText !== 'undefined') {
            isEdited = 'true';
        }
        if (_.isEmpty(language)) {
            language = 'english';
        }
        const db = req.app.get('db');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const translate2 = req.app.get('translate2');
        const config = req.app.get('config');
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const flagId = isTyd ? Data.search_service_tyd_flag_id : 3;
        const host = `${req.protocol}://${req.headers.host}`;
        const masterIterationCacheMongoCollection = 'test_dataset_api_responses';
        const masterIterationDataCollection = 'match_rate_test_dataset';

        const ocrObject = {};
        let locale = null;
        const keyArray = [];
        const keyArrayPreProcess = [];

        let promises = [];
        const preProcessPromises = [];
        const ocrDataPromises = [];
        const indexOfIterationsToDisplay = [];

        promises.push(Utility.getIterations(flagId));
        promises.push(Questions.getIterationByUserQuestionId(userQid, db.mysql.read));
        promises.push(image2base64(`${config.cdn_url}images/${fileName}`));

        const resolvedPromises = await Promise.all(promises);
        const iterations = resolvedPromises[0];
        let iter = JSON.parse(iterations);
        iter = _.reverse(iter);
        const question_image_base64 = resolvedPromises[2];
        promises = [];

        if (Utility.isEnglishMathSymbolString(ocrText)) {
            locale = 'en';
        }
        for (let i = 0; i < iter.length; i++) {
            if (iter[i].attachment.includeOnHindiPanel) {
                if ((iter[i].key.slice(0, 2) === 'vi' || iter[i].key.slice(0, 2) === 'vo') && !_.isEmpty(fileName)) {
                    keyArrayPreProcess.push(iter[i].key);
                    preProcessPromises.push(helper.handleOcrGlobal({
                        config,
                        variantAttachment: iter[i].attachment,
                        fileName,
                        host,
                        translate2,
                        image: question_image_base64,
                        next,
                    }));
                } else {
                    ocrDataPromises.push(QuestionHelper.handleOcrForPanel(ocrObject, {
                        image: null, host, fileName, translate2, variantAttachment: iter[i].attachment, config, next, studentId: 0, isb64ConversionRequired: true,
                    }, {
                        isEdited, ocrText, ocrType, locale,
                    }));
                    indexOfIterationsToDisplay.push(i);
                }
            }
        }
        const ocrDataResponse = await Promise.all(ocrDataPromises);

        let masterIterationCacheQidArray;
        let is_question_viewed = false;
        if (takeMasterIterationCachedData) {
            const mongoCacheDataResponse = await QuestionHelper.handleCacheMasterIterationData(db, fuzz, elasticSearchInstance, ocrText, userQid, indexOfIterationsToDisplay, iter, masterIterationCacheMongoCollection, indexName);
            masterIterationCacheQidArray = mongoCacheDataResponse.master_obj;
            is_question_viewed = mongoCacheDataResponse.is_question_viewed;
            for (let i = 0; i < ocrDataResponse.length; i++) {
                keyArray.push(iter[indexOfIterationsToDisplay[i]].key);
                ocrText = ocrDataResponse[i].ocr;
                iter[indexOfIterationsToDisplay[i]].attachment.ocrText = ocrText;
            }
        } else {
            const videoLanguageFilters = ['en', 'hi', 'bn', 'gu', 'te', 'ta', 'mr', 'ml', 'kn', 'od'];
            masterIterationCacheQidArray = await QuestionHelper.handleUncachedMasterIterationData(req, videoLanguageFilters, ocrDataResponse, keyArray, iter, indexOfIterationsToDisplay);
        }
        const localisedQuestionMgetResolvedResponse = await QuestionHelper.getLocalisedQuestionMgetForPanel(db, elasticSearchInstance, language, next, masterIterationCacheQidArray);
        promises = [];
        promises.push(QuestionHelper.generateMasterIterationResponse(db, userQid, masterIterationCacheQidArray, localisedQuestionMgetResolvedResponse, keyArray, iter, indexOfIterationsToDisplay, is_question_viewed, masterIterationDataCollection, false));
        promises.push(QuestionHelper.generateMasterIterationResponse(db, userQid, masterIterationCacheQidArray, localisedQuestionMgetResolvedResponse, keyArray, iter, indexOfIterationsToDisplay, is_question_viewed, masterIterationDataCollection, true));

        const resolvedP = await Promise.all(promises);
        const data = [...resolvedP[0], ...resolvedP[1]];
        if (!_.isEmpty(data) && !is_question_viewed) {
            await db.mongo.write.collection(masterIterationCacheMongoCollection).update({
                question_id: parseInt(userQid),
            }, {
                $set: {
                    is_question_viewed: 1,
                },
            });
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: e.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function updateAskMatchRateTestDatasetInMongo(req, res) {
    try {
        const {
            questionId,
            exactMatchQuestionIds,
            questionLocale,
            subject,
            ocr,
        } = req.body;
        const db = req.app.get('db');
        const collection = 'match_rate_test_dataset';
        const mongoResponse = await db.mongo.read.collection(collection).find({ question_id: questionId.toString() }).toArray();
        let insertObj = {};
        if (mongoResponse.length === 0) {
            insertObj = {
                question_id: questionId.toString(),
                locale: questionLocale,
                subject,
                ocr_text: ocr,
                exact_match: exactMatchQuestionIds,
            };
            await db.mongo.write.collection(collection).insertOne(insertObj);
        } else {
            const exactMatchObj = mongoResponse[0].exact_match;
            for (let i = 0; i < Object.keys(exactMatchQuestionIds).length; i++) {
                exactMatchObj[Object.keys(exactMatchQuestionIds)[i]] = exactMatchQuestionIds[Object.keys(exactMatchQuestionIds)[i]];
            }
            await db.mongo.write.collection(collection).update({
                question_id: questionId.toString(),
            }, {
                $set: {
                    exact_match: exactMatchObj,
                },
            });
            mongoResponse[0].exact_match = exactMatchObj;
            insertObj = mongoResponse[0];
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: insertObj,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: {},
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getUserQuestionsForTestDataset(req, res) {
    try {
        const db = req.app.get('db');
        const pageNumber = req.body.page || 1;
        const { category } = req.body;
        const nPerPage = 30;
        const offset = pageNumber > 0 ? (pageNumber - 1) * nPerPage : 0;
        const matchQuery = {
            $or: [
                {
                    is_question_viewed: {
                        $exists: false,
                    },
                },
                {
                    is_question_viewed: 0,
                },
            ],
        };
        if (!_.isEmpty(category)) {
            matchQuery.category = category;
        }
        const docs = await db.mongo.read
            .collection('test_dataset_api_responses')
            .aggregate([
                {
                    $match: matchQuery,
                },
                {
                    $project: { _id: 0 },
                },
                {
                    $sort: {
                        createdAt: -1,
                    },
                },
                {
                    $skip: offset,
                },
                {
                    $limit: nPerPage,
                },
            ]).toArray();

        const qids_arr = [];
        for (let i = 0; i < docs.length; i++) {
            qids_arr.push(docs[i].question_id);
        }
        const myobj = [];
        for (let i = 0; i < docs.length; i++) {
            const insert_obj = {
                locale: docs[i].question_locale,
                class: docs[i].class,
                ocrText: docs[i].ocr_text,
                subject: docs[i].subject,
                question_id: docs[i].question_id,
                student_id: docs[i].student_id,
            };
            myobj.push(insert_obj);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: myobj,
        };
        return res.status(200).json(responseData);
    } catch (err) {
        console.log(err);
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: err.message,
            },
            data: [],
        };
        return res.status(403).json(responseData);
    }
}

async function getStepwiseComputationSolution(req, res) {
    try {
        const ocrText = req.body.ocr_text;
        const html = QuestionHelper.getSimplifiedExpressionFromMathsteps(mathsteps, ocrText);
        const htmlFormatResponse = `<!DOCTYPE html> 
                                    <html>
                                    <body> ${html} </body>
                                    </html>`;
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: htmlFormatResponse,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.error(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: '',
        };
        responseData.meta.message = e.message;
        return res.status(500).json(responseData);
    }
}

async function getQuestionsByPackageLanguage(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const indexName = 'question_bank_package_language';
        const { package_language } = req.query;
        const assignedQids = await QuestionRedis.getAssignedDuplicateQidsPublicPanel(db.redis.read);
        const questions = await elasticSearchTestInstance.findDnDocumentsByPackageLanguage(indexName, package_language, assignedQids);
        let data = questions.hits.hits;

        const qids = data.map((item) => (item._id));
        await QuestionRedis.setAssignedDuplicateQidsPublicPanel(db.redis.write, qids[0]);
        data = await QuestionHelper.replaceValidOcrTextsInMatches(db, data);
        QuestionHelper.attachRequestBodyForDuplicateQuestions(req, config, data, package_language, qids[0]);
        next();
    } catch (e) {
        next(e);
    }
}

async function updateDuplicateQuestionInElastic(req, res) {
    try {
        const {
            questionId,
            duplicateQuestionIds,
            isSkipped,
        } = req.body;
        const db = req.app.get('db');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const mongoCollectionName = 'duplicate_tagging_panel_allocation';
        const indexName = 'question_bank_package_language';
        const duplicateQuestionsTag = uuid.v4();
        await Promise.all([QuestionRedis.deleteAssignedDuplicateQidsPublicPanel(db.redis.write, questionId),
            QuestionHelper.updateActionForDuplicateQuestionTagging(db, mongoCollectionName, isSkipped, duplicateQuestionIds, questionId)]);
        if (isSkipped) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: [],
            };

            return res.status(200).json(responseData);
        }
        duplicateQuestionIds.push(questionId);
        const body = [];
        duplicateQuestionIds.forEach((id) => {
            body.push(
                { update: { _id: id } },
            ),
            body.push({
                doc: {
                    duplicateQuestionsTag,
                },
            });
        });
        // const videoLanguageObj = await QuestionHelper.getVideoLanguageMapping(db, duplicateQuestionIds);
        const promises = [];
        if (duplicateQuestionIds.length >= 2) {
            for (let i = 0; i < duplicateQuestionIds.length; i++) {
                const obj = {
                    qid: duplicateQuestionIds[i],
                    uuid: duplicateQuestionsTag,
                };
                promises.push(QuestionMysql.insertDuplicateQids(db.mysql.write, obj));
            }
        }
        promises.push(QuestionHelper.updateTextSolutionForDuplicates(db, duplicateQuestionIds));
        promises.push(elasticSearchTestInstance.updateDuplicateQuestionsInElastic(indexName, body));
        await Promise.all(promises);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: [],
        };

        return res.status(200).json(responseData);
    } catch (err) {
        console.log(err);
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function getQuestionsByPackageLanguageForQc(req, res) {
    try {
        const db = req.app.get('db');
        const collection = 'duplicate_tagging_panel_allocation';
        const matchQuery = {
            is_question_viewed_for_qc: {
                $exists: false,
            },
        };
        const pageNumber = req.params.page || 1;
        const nPerPage = 20;
        const qList = await db.mongo.read.collection(collection)
            .find(matchQuery)
            .sort({
                created_at: -1,
            })
            .skip(pageNumber > 0 ? ((pageNumber - 1) * nPerPage) : 0)
            .limit(nPerPage)
            .toArray();

        const questionIdList = qList.map((x) => x.question_id.toString());
        const questionDetails = await QuestionMysql.getSimilarQuestionsByIds(db.mysql.read, questionIdList);
        const qidListMysql = questionDetails.map((x) => x.question_id.toString());
        qList.forEach((x) => {
            const qidIndex = qidListMysql.indexOf(x.question_id);
            x.subject = questionDetails[qidIndex].subject;
            x.ocr_text = questionDetails[qidIndex].ocr_text;
            x.locale = questionDetails[qidIndex].locale;
            x.class = questionDetails[qidIndex].class;
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: qList,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function viewQuestionByPackageLanguageForQc(req, res) {
    try {
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const { questionId } = req.params;
        const indexName = 'question_bank_package_language';
        const questionDetails = await elasticSearchTestInstance.getById(indexName, questionId);
        const data = {
            question_id: '',
            display_ocr_text: '',
            query_ocr_text: '',
            matches: [],
        };
        if (_.get(questionDetails, 'hits.hits[0]._source.duplicateQuestionsTag', false)) {
            const duplicateUuid = questionDetails.hits.hits[0]._source.duplicateQuestionsTag;
            const duplicateQidDetails = await elasticSearchTestInstance.getDuplicateQidDetailsByUuid(indexName, duplicateUuid);
            data.matches = duplicateQidDetails.hits.hits;
            data.display_ocr_text = questionDetails.hits.hits[0]._source.ocr_text;
            data.question_id = questionDetails.hits.hits[0]._id;
            data.query_ocr_text = questionDetails.hits.hits[0]._source.ocr_text;
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data,
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function submitQcFeedbackDuplicateTagging(req, res) {
    try {
        const db = req.app.get('db');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const { questionId, feedback } = req.body;
        const indexName = 'question_bank_package_language';
        const mongoCollectionName = 'duplicate_tagging_panel_allocation';
        let updateQuery = {};
        if (feedback === 'verify') {
            updateQuery = {
                $set: {
                    is_verified: 1,
                    is_question_viewed_for_qc: 1,
                },
            };
        } else if (feedback === 'discard') {
            updateQuery = {
                $set: {
                    is_discarded: 1,
                    is_question_viewed_for_qc: 1,
                },
            };
            const questionDetails = await elasticSearchTestInstance.getById(indexName, questionId);
            if (_.get(questionDetails, 'hits.hits[0]._source.duplicateQuestionsTag', false)) {
                const duplicateUuid = questionDetails.hits.hits[0]._source.duplicateQuestionsTag;
                await elasticSearchTestInstance.removeDuplicateTagForDiscardedQids(indexName, duplicateUuid);
            }
        }
        await QuestionHelper.updateQueryMongo(db, mongoCollectionName, { question_id: questionId.toString() }, updateQuery);
        const responseData = {
            meta: {
                code: 200,
                success: true,
            },
            data: [],
        };

        return res.status(200).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 500,
                success: false,
            },
            data: [],
        };
        responseData.meta.message = err.message;
        return res.status(500).json(responseData);
    }
}

async function addToWebScrapePipeline(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            type,
        } = req.body;
    
        const handlerByTypeMapping = getWebScrapingHandlersByType();
        if (!type || !(type in handlerByTypeMapping)) {
            throw new Error ("no handler defined");
        }

        await handlerByTypeMapping[type](db, req.body);
        next({
            data: [],
        });
    } catch (e) {
        console.log(e);
        next({
            err: e, 
        });
    }
}

module.exports = {
    search,
    getSuggestions,
    getMatchesFromSearchService,
    getLanguageMatchesFromSearchService,
    getMatches,
    getQuestionData,
    getCustomMatches,
    getChapterListForDropdown,
    getQuestionAskStatsByStudentId,
    getQuestionsByStudentId,
    getSimilarUserQuestionsClusters,
    getSimilarUserQuestionsClusterDetails,
    getRecentUserQuestionsByFilters,
    getUserQuestionsDataByQid,
    getByUserQuestionOcr,
    getDuplicateSolutions,
    getLanguageBumpQids,
    getLangBumpQidDetails,
    getAdvanceSearchLogs,
    getAdvanceSearchLogViewIdDetails,
    getUserQuestionsByPosition,
    getDnQuestionsDuplicates,
    getDnQuestionsDuplicatesDetails,
    getTypedQuestions,
    getGlobalMatchesFromSearchService,
    getUserRecentQuestions,
    getAllVariantsByFlagId,
    getUserUnmatchedQuestionsDetails,
    updateUnmatchedQuestionRowByExpert,
    updateUnmatchedClusterByExpert,
    updateMatchedQuestionsForTextClusters,
    getClusterQuestionByClusterId,
    getClusterQuestionByQuestionId,
    getAnswerPanelDropwdownConfig,
    getNewUserQuestions,
    getSubjectsByUserUnmatchedClusters,
    getBackPressMatchesForPanel,
    getTydSuggestionsLogs,
    getTydSuggestionsSession,
    getUserQuestionClusterTypes,
    getTydSuggestions,
    getPanelMasterIterationData,
    updateAskMatchRateTestDatasetInMongo,
    getUserQuestionsForTestDataset,
    getStepwiseComputationSolution,
    getQuestionsByPackageLanguage,
    updateDuplicateQuestionInElastic,
    getQuestionsByPackageLanguageForQc,
    viewQuestionByPackageLanguageForQc,
    submitQcFeedbackDuplicateTagging,
    addToWebScrapePipeline,
};
