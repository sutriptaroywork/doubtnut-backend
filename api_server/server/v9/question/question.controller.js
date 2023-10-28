/* eslint-disable import/no-extraneous-dependencies */
/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
 * @Last modified by:   Abhishek Sinha
 * @Last modified time: 2019-12-14T17:36:32+05:30
*/
const fuzz = require('fuzzball');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const mathsteps = require('mathsteps');
const bluebird = require('bluebird');
const _ = require('lodash');
const Question = require('../../../modules/question');
const Utility = require('../../../modules/utility');
const Notification = require('../../../modules/notifications');
// const Constant = require('../../../modules/constants');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionRedis = require('../../../modules/redis/question');
const AnswerRedis = require('../../../modules/redis/answer');
// const QuestionSql = require('../../../modules/mysql/question');
// const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const staticData = require('../../../data/data');
const responseSchema = require('../../../responseModels/question/v9/question');
// const QuestionLog = require('../../../modules/mongo/questionAsk');
const QuestionHelper = require('../../helpers/question.helper');
const telemetry = require('../../../config/telemetry');
const AnswerMysql = require('../../../modules/mysql/answer');
const bl = require('./question.bl');
const answerBl = require('../../v11/answer/answer.bl');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const UtilityRedis = require('../../../modules/redis/utility.redis');

bluebird.promisifyAll(fs);

let db;
let elasticSearchInstance;
let elasticSearchTestInstance;
let config;
let blobService;

async function ask(req, res, next) {
    const start = new Date();
    try {
        let clientFileName = null;
        const insertedQuestion = {};
        const sns = req.app.get('sns');
        const kinesisClient = req.app.get('kinesis');
        const sqs = req.app.get('sqs');
        const { questionInitSnsUrl, userQuestionSnsUrl } = staticData;
        config = req.app.get('config');
        const translate2 = req.app.get('translate2');
        blobService = req.app.get('blobService');
        const publicPath = req.app.get('publicPath');
        db = req.app.get('db');
        const s3 = req.app.get('s3');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        let questionText = req.body.question_text;
        let studentId = req.user.student_id;
        const xAuthToken = req.headers['x-auth-token'];
        let { locale } = req.body;
        const { subject, chapter, colorVersion } = req.body;
        const ques = req.body.question || 'about to only mathematics';
        const studentClass = req.body.class;
        const questionImage = req.body.question_image;
        const versionCode = req.headers.version_code;
        clientFileName = req.body.file_name;
        let matchesArray;
        let languagesObj;
        let handwritten = 0;
        let isb64ConversionRequired = 0;
        const masterIterationMongo = {};
        const { cropped_image_url } = req.body;
        // -------- mongo data insertion ------ //
        masterIterationMongo.student_id = studentId;
        masterIterationMongo.isAbEligible = 0;
        masterIterationMongo.studentClass = studentClass;

        let stLangCode;
        let useComposerApi = false;
        const filedToUpdate = {}; let promises = []; let searchFieldName = 'ocr_text';
        // eslint-disable-next-line radix
        studentId = (studentId) ? parseInt(studentId) : 0;
        locale = ((locale) && (locale !== '')) ? locale : 'en';
        insertedQuestion.student_id = studentId;
        insertedQuestion.class = studentClass;
        insertedQuestion.subject = subject;
        insertedQuestion.book = subject;
        insertedQuestion.chapter = chapter;
        insertedQuestion.question = 'askV9';
        insertedQuestion.doubt = ques;
        insertedQuestion.locale = locale;
        const color = versionCode > 645 && colorVersion === 2 ? [staticData.color.white] : staticData.colors;
        const platformTabs = staticData.platform_tabs;
        const insertQuestionResult = await Question.addQuestionAliasedTable(insertedQuestion, db.mysql.write);

        const feedback = staticData.match_page_feedback;
        const whatsAppData = staticData.askWhatsappData;
        const whatsAppJson = {};
        whatsAppJson.image_url = whatsAppData.key_value.image_url;
        whatsAppJson.description = whatsAppData.key_value.description;
        whatsAppJson.button_text = whatsAppData.key_value.button_text;
        whatsAppJson.button_bg_color = whatsAppData.key_value.button_bg_color;
        whatsAppJson.action_activity = whatsAppData.key_value.action_activity;
        whatsAppJson.action_data = whatsAppData.key_value.action_data;
        whatsAppJson.resource_type = 'card';
        // delete whatsappData[0].key_value

        // const languagesArrays = resolvedPromises[1];
        const isSubscribed = 0;
        const qid = insertQuestionResult.insertId;

        const uuid = uuidv4();
        QuestionHelper.sendSnsMessage({
            type: 'question-init',
            sns,
            uuid,
            qid,
            studentId,
            studentClass,
            subject,
            chapter,
            version: insertedQuestion.question,
            ques,
            locale,
            UtilityModule: Utility,
            questionInitSnsUrl,
            config,
        });

        insertedQuestion.question_id = qid;
        let ocr; let fileName = null;
        let ocrData;
        let originalOcr;
        let ocrType = 1;
        let variantAttachment = null;
        let preprocessMatchesArray;
        let isBlur = null;
        if (qid) {
            // -- mongo data insertion --- //
            masterIterationMongo.qid = qid;
            if ((typeof questionText === 'undefined' || questionText.length === 0) && (typeof questionImage !== 'undefined' && questionImage.length > 0)) {
                const host = `${req.protocol}://${req.headers.host}`;
                promises = [];
                variantAttachment = await Utility.getFlagrResponseForAskV9(kinesisClient, studentId, telemetry, start);
                // null - FLAGR FAIL - set to default
                if (_.isNull(variantAttachment)) {
                    variantAttachment = staticData.SEARCH_SERVICE_DEFAULT_VERSION;
                }
                // EMPTY {} => v0 (proxy to null / flagr fail)
                if (!Object.keys(variantAttachment).length) {
                    variantAttachment = null;
                }
                // if (!variantAttachment) {
                //     variantAttachment = staticData.SEARCH_SERVICE_DEFAULT_VERSION;
                // }
                if (variantAttachment) {
                    variantAttachment.userLanguages = ['hi-en'];
                    // eslint-disable-next-line no-unused-expressions
                    locale === 'en' ? null : variantAttachment.userLanguages.push(locale);
                }
                if (_.isEmpty(cropped_image_url)) {
                    fileName = await QuestionHelper.handleImage(questionImage, fs, qid, config, s3, publicPath, blobService, variantAttachment, clientFileName);
                } else {
                    fileName = cropped_image_url.replace(`${config.cdn_url}images/`, '');
                    isb64ConversionRequired = 1;
                }
                filedToUpdate.question_image = fileName;
                insertedQuestion.question_image = fileName;

                ocrData = await QuestionHelper.handleOcrGlobal({
                    image: questionImage, host, fileName, translate2, variantAttachment, config, next, studentId, isb64ConversionRequired, db,
                });
                ocr = ocrData.ocr;
                originalOcr = ocrData.original_ocr;
                handwritten = ocrData.handwritten;
                locale = ocrData.locale;
                ocrType = ocrData.ocr_type;
                filedToUpdate.difficulty = ocrData.isModified ? ocrData.isModified : 0;
                preprocessMatchesArray = ocrData.preprocessMatchesArray;
                if (variantAttachment && ocrData.locale) {
                    variantAttachment.questionLocale = ocrData.locale;
                }
                // masterIterationMongo.isAbEligible = (ocrData.mathpixConfidence) ? ocrData.mathpixConfidence : 10;
                // if (ocrData.original_image_ocr) {
                //     masterIterationMongo.meta_index = ocrData.original_image_ocr;
                // }
                // let ocrText = ocr;
                Utility.deleteImage(`${publicPath}/uploads/${fileName}`, fs);
            } else if (typeof questionText !== 'undefined' && questionText.length > 0) {
                // question text
                if (locale !== 'en'
                    && locale !== 'es'
                    && locale !== 'gl'
                    && locale !== 'ca'
                    && locale !== 'cy'
                    && locale !== 'it'
                    && locale !== 'gd'
                    && locale !== 'sv'
                    && locale !== 'da'
                    && locale !== 'ro'
                    && locale !== 'fil'
                    && locale !== 'mt'
                    && locale !== 'pt-PT') {
                    const transLateApiResp = await Utility.translateApi2(questionText, translate2);
                    if (transLateApiResp.length > 0 && transLateApiResp[1].data !== undefined && transLateApiResp[1].data.translations !== undefined && transLateApiResp[1].data.translations[0].translatedText !== undefined) {
                        questionText = transLateApiResp[1].data.translations[0].translatedText;
                    }
                }
                ocr = questionText;
                originalOcr = ocr;
                ocrData = {
                    ocr: questionText, ocr_type: 1, handwritten, locale, ocr_origin: 'question_text',
                };
            }

            // -------- mongo data insertion ------ //
            masterIterationMongo.ocr_type = ocrData.ocr_origin;
            filedToUpdate.ocr_done = 1;
            filedToUpdate.ocr_text = ocrData.ocr;
            filedToUpdate.locale = locale;
            insertedQuestion.ocr_done = 1;
            insertedQuestion.ocr_text = ocr;
            insertedQuestion.original_ocr_text = originalOcr;
            insertedQuestion.locale = locale;
            const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
            languagesObj = staticData.languageObject;
            stLangCode = ocrData.locale;
            let language = languagesObj[req.body.locale];
            if (typeof language === 'undefined') {
                language = 'english';
            }

            let preprocessMatchedObject;
            if (!_.isEmpty(preprocessMatchesArray)) {
                const question_id_obj = await QuestionHelper.getResponseForQuestionId(preprocessMatchesArray, db);
                preprocessMatchedObject = {
                    id: question_id_obj[0].question_id,
                    subject: question_id_obj[0].subject,
                    ocr_text: question_id_obj[0].ocr_text,
                    chapter: 0,
                    is_answered: question_id_obj[0].is_answered,
                    is_text_answered: question_id_obj[0].is_text_answered,
                };
            }
            const ocrLength = ocr.length;
            if (variantAttachment && variantAttachment.useComposerApi) {
                useComposerApi = true;
                searchFieldName = Utility.getFieldNameForTranslate(locale);
            }
            promises.push(QuestionHelper.handleElasticSearchWrapper({
                db,
                ocr,
                elasticSearchInstance,
                elasticSearchTestInstance,
                kinesisClient,
                elasticIndex: indexName,
                stockWordList: null,
                useStringDiff: true,
                language,
                fuzz,
                UtilityModule: Utility,
                studentId,
                ocrType,
                locale,
                variantAttachment,
                config,
                sqs,
                studentClass,
                next,
                useComposerApi,
                searchFieldName,
                questionId: qid
            }, config));
            if (ocrLength < 10) {
                promises.push(QuestionHelper.checkBlurImage(fileName, config, ocr));
            }
            const resolvedPromises = await Promise.all(promises);
            const result = resolvedPromises[0];
            if (ocrLength < 10) {
                isBlur = resolvedPromises[1];
            }

            if (!result || !result.stringDiffResp || !result.info) {
                return next({
                    message: 'Error in search question', status: 500, isPublic: true, error: true,
                });
            }

            const {
                stringDiffResp,
                info,
                isOnlyEquation,
                cymathString,
                cleanedOcr,
            } = result;

            masterIterationMongo.isAbEligible = new Date() - start;
            masterIterationMongo.elastic_index = info.query_ocr_text;
            masterIterationMongo.meta_index = String(isBlur);
            promises = [];
            matchesArray = stringDiffResp[0];
            let matchEmpty = false;
            if (matchesArray.length === 0) {
                matchEmpty = true;
            }
            if (!_.isEmpty(preprocessMatchedObject)) {
                const wrappedPreprocessMatchedObject = { ...matchesArray[0], _id: preprocessMatchedObject.id, _source: preprocessMatchedObject };
                matchesArray.unshift(wrappedPreprocessMatchedObject);
            }

            matchesArray = _.uniq(matchesArray, '_id');

            const topicTabs = staticData.topic_tab;
            let facets = [];
            QuestionRedis.setMatchesForAdvanceSearchById(db.redis.write, qid, matchesArray);
            const advancedV3Flag = true;
            if (versionCode && versionCode < 756) {
                facets = await bl.getFacetsByVersionCode(xAuthToken, config, versionCode, UtilityFlagr, elasticSearchInstance, matchesArray, req.user.locale);
                if (facets) {
                    for (let m = 0; m < facets.length; m++) {
                        facets[m].data = _.uniqBy(facets[m].data, 'display');
                    }
                }
            }

            if (ocr && !matchesArray.length) {
                telemetry.addTelemetry(telemetry.eventNames.askFailure, new Date() - start, { msg: 'no_matches' });
            }

            filedToUpdate.original_ocr_text = ocrData.ocr;

            if (info.version === 'vt_0' || info.version === 'vt_0_1') {
                filedToUpdate.question = info.version;
            } else {
                filedToUpdate.question = (variantAttachment && variantAttachment.version) ? variantAttachment.version : info.version;
            }

            filedToUpdate.wrong_image = info.isIntegral;
            if (ocrData.ocr_origin === 'tesseract') {
                ocrType = 3;
            }
            filedToUpdate.is_trial = ocrType;
            masterIterationMongo.ocrType = ocrType;
            masterIterationMongo.qid_matches_array = matchesArray;
            const matchesQuestionArray = stringDiffResp[1];

            const groupedQid = stringDiffResp[2];
            filedToUpdate.subject = stringDiffResp[3];
            insertedQuestion.subject = stringDiffResp[3];
            // matchesArray = (studentId % 2 === 0) ? matchesArray.slice(0, 20) : matchesArray;
            const wolframAttachment = await UtilityFlagr.callFlagr(xAuthToken, 'question_ask_wolfram', 'question_ask_wolfram.payload.enabled');
            const checkWolfram = wolframAttachment && ((!matchesArray) || (matchesArray[0] && matchesArray[0]._score < 95));
            const checkMathsteps = variantAttachment && !variantAttachment.dontgetComputeQues && ((!matchesArray) || (matchesArray[0] && matchesArray[0]._score < 95));
            let computational = [];
            let computationalDetails = [];
            if (checkMathsteps && !checkWolfram) {
                computationalDetails = await QuestionHelper.handleComputationalQuestions({
                    mathsteps,
                    AnswerMysql,
                    cleanedOcr,
                    UtilityModule: Utility,
                    qid,
                    db,
                });
                computational = computationalDetails[0];
            }
            if (!_.isEmpty(computational) && computational.length) {
                filedToUpdate.is_text_answered = 1;
                filedToUpdate.ocr_text = `\`${ocrData.ocr}\``;
                filedToUpdate.subject = 'MATHS';
            }

            let groupedMeta = [];
            if (groupedQid.length > 0) {
                groupedMeta = await Utility.getEnglishGroupedMeta(db, matchesArray, groupedQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next);
            }
            // -------- mongo data insertion ------ //
            if (variantAttachment && variantAttachment.version) {
                masterIterationMongo.iteration_name = variantAttachment.version;
            } else if (info && info.version) {
                masterIterationMongo.iteration_name = info.version;
            } else {
                masterIterationMongo.iteration_name = staticData.current_ask_question_iteration;
            }

            // if (config.mongo.connect) {
            //     filedToUpdate.question = `v_mongo${filedToUpdate.question}`;
            //     masterIterationMongo.iteration_name = `v_mongo${masterIterationMongo.iteration_name}`;
            // }
            // masterIterationMongo.meta_index = staticData.currentQuestionAskMetaIndex;
            // masterIterationMongo.meta_index = info.elasticSSHost;
            masterIterationMongo.request_version = 'v9';
            masterIterationMongo.question_image = fileName;
            masterIterationMongo.user_locale = stLangCode;
            masterIterationMongo.ocr = ocr;
            masterIterationMongo.subject = stringDiffResp[3];
            const relevanceScoreArr = [];
            for (let i = 0; i < matchesArray.length; i++) {
                console.log(matchesArray[i]._id);
                console.log(matchesArray[i]._source);
                const relevanceObject = { qid: matchesArray[i]._id, _score: matchesArray[i]._score, string_diff_score: matchesArray[i].partial_score };
                relevanceScoreArr.push(relevanceObject);
            }
            masterIterationMongo.relevance_score = relevanceScoreArr;
            // const questionAskLog = new QuestionLog.QuestionLogModel(masterIterationMongo);
            const promises3 = [];
            promises3.push(QuestionRedis.setPreviousHistory(studentId, [{
                question_id: qid,
                ocr_text: ocr,
            }], db.redis.write));
            // promises3.push(questionAskLog.save());
            Promise.all(promises3).then(() => { }).catch(() => { }); // async
            masterIterationMongo.locale = locale;
            const event = { data: masterIterationMongo, type: 'mongoWrite' };
            // Utility.sendMessage(sqs, config.elasticsearch_sqs, event);
            if (language !== 'english' && matchesArray.length > 0) {
                matchesArray = await QuestionContainer.getLocalisedQuestionMget(db, matchesArray, groupedMeta, language, next, groupedQid, elasticSearchInstance);
            }
            // Notification.questionCountNotifications(studentId, req.user.gcm_reg_id, config, admin, db);

            let matchedQuestionsHtml;
            let groupedMatchedQuestionHtml;
            if (language === 'english' && matchesQuestionArray.length > 0) {
                matchedQuestionsHtml = await QuestionContainer.getQuestionHtmlMget(db, matchesQuestionArray, next);
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
            }
            // removing user feedback since its not being used in client side (keeping its default value)
            // TODO: remove like share comment also

            // matchesArray = await QuestionContainer.getQuestionStatsWithMget(matchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, groupedMeta, db, studentId);
            // promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentMulti(matchesArray, studentId, db));
            const resolvedPIndex = {
                youtubeResult: null,
                wolframResult: null,
            };
            let resolvedPCounter = 2;
            promises.push(QuestionContainer.getQuestionStatsWithMget(db, matchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, groupedMeta, studentId, next, req.headers['x-auth-token'], versionCode));
            promises.push(Question.updateQuestionAliasedTable(filedToUpdate, qid, db.mysql.write));
            const youtubeAttachment = await UtilityFlagr.callFlagr(xAuthToken, 'question_ask_youtube', 'question_ask_youtube.payload.enabled');
            if (youtubeAttachment) {
                promises.push(UtilityRedis.getValue(db.redis.read, 'youtube_flag'));
                resolvedPIndex.youtubeResult = resolvedPCounter;
                resolvedPCounter++;
            }
            if (checkWolfram) {
                promises.push(QuestionHelper.handleWolframAlpha(ocr, config));
                resolvedPIndex.wolframResult = resolvedPCounter;
            }
            const resolvedP = await Promise.all(promises);
            const youtubeFlag = youtubeAttachment ? resolvedP[resolvedPIndex.youtubeResult] : '0';
            const computeResponse = checkWolfram ? resolvedP[resolvedPIndex.wolframResult] : '';
            matchesArray = resolvedP[0];
            if (whatsAppData.length > 0 && matchesArray.length > 0) {
                matchesArray.splice(6, 0, whatsAppJson);
            }
            if (computational.length > 0) {
                matchesArray = [...computational, ...matchesArray];
            }
            if (computeResponse) {
                const computeResponseArr = [];
                computeResponseArr.push(Utility.generateDynamicResponse(computeResponse, qid, ocr));
                computeResponseArr[0].html.replace(/\r\n|\n|\r/g, '');
                matchesArray = [...computeResponseArr, ...matchesArray];
            }
            const nData = [];
            const d1 = moment(req.user.timestamp);
            const d2 = moment(new Date());
            const difference = d2.diff(d1, 'days');

            QuestionHelper.sendSnsMessage({
                type: 'user-questions',
                sns,
                uuid,
                qid,
                studentId,
                studentClass,
                subject,
                chapter,
                version: filedToUpdate.question,
                ques,
                locale,
                questionImage: filedToUpdate.question_image,
                ocrText: filedToUpdate.ocr_text,
                ocrDone: filedToUpdate.ocr_done,
                originalOcrText: filedToUpdate.original_ocr_text,
                wrongImage: filedToUpdate.wrong_image,
                isTrial: filedToUpdate.is_trial,
                difficulty: filedToUpdate.difficulty,
                UtilityModule: Utility,
                userQuestionSnsUrl,
                config,
            });

            if (versionCode && facets && facets.length > 0 && !_.isEmpty(matchesArray) && versionCode < 756) {
                if (versionCode > 723 && advancedV3Flag) {
                    answerBl.pushFacetCardV3(matchesArray, facets, 0);
                } else if (versionCode > 659) {
                    answerBl.pushFacetCard(matchesArray, facets, 0);
                }
            }

            if (versionCode && versionCode === 685 && !_.isEmpty(matchesArray)) {
                if ((typeof questionText === 'undefined' || questionText.length === 0) && matchesArray.length > 0) {
                    answerBl.pushBountyCard(matchesArray, req.body.source);
                }
                /*
                  Activity Stream Entry
                 */
                db.redis.read.publish('activitystream_service', JSON.stringify({
                    actor_id: req.user.student_id,
                    actor_type: 'USER',
                    actor: { student_username: req.user.student_username, user_avatar: req.user.student_avatar },
                    verb: 'ASKED',
                    object: '',
                    object_id: qid,
                    object_type: 'QUESTION',
                    target_id: '',
                    target_type: '',
                    target: '',
                }));
                const responseData = {
                    data: {
                        question_id: qid,
                        tab: topicTabs,
                        platform_tabs: platformTabs,
                        ocr_text: cleanedOcr,
                        question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                        matched_questions: matchesArray,
                        matched_count: matchesArray.length,
                        is_subscribed: isSubscribed,
                        notification: nData,
                        handwritten,
                        feedback,
                        is_only_equation: isOnlyEquation,
                    },
                    error: false,
                    schema: responseSchema,
                };
                if (typeof filedToUpdate.question_image === 'undefined') {
                    responseData.data.question_image = null;
                }
            }

            if (versionCode && versionCode > 685 && !_.isEmpty(matchesArray)) {
                if (studentId % config.bounty_mod_factor === 0) {
                    if ((typeof questionText === 'undefined' || questionText.length === 0) && matchesArray.length > 0) {
                        answerBl.pushBountyCard(matchesArray, req.body.source);
                    }
                }
            }

            if (difference > 4) {
                // const introVideoId = Constant.cropToEquation();
                const notificationData1 = staticData.cameraGuideNotificationData;
                nData.push(notificationData1);
            }
            const matchesAnswerArray = [];
            for (let index = 0; index < matchesArray.length; index++) {
                matchesAnswerArray.push(matchesArray[index].answer_id);
            }

            matchesArray = matchesArray.map((obj) => {
                if (!_.isEmpty(obj._source) && obj._source.is_answered == 1 && !_.isEmpty(obj.answer_video)) {
                    const answer_video_name = obj.answer_video.split('.')[0];
                    const answer_video_data_obj = {
                        video_url: `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`,
                        cdn_base_url: config.cdn_video_url,
                        fallback_url: `${config.cdn_video_url}${obj.answer_video}`,
                        hls_timeout: 0,
                    };
                    const new_match_obj = { ...obj, ...answer_video_data_obj };
                    return new_match_obj;
                }
                return obj;
            });

            matchesArray = matchesArray.map((obj) => {
                if (!_.isEmpty(obj._source)) {
                    obj._source.ocr_text = Utility.getEscapedBackslashesString(obj._source);
                    return obj;
                }
                return obj;
            });

            const responseDataData = {
                question_id: qid,
                tab: topicTabs,
                platform_tabs: platformTabs,
                ocr_text: cymathString,
                question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                matched_questions: matchesArray,
                matched_count: matchesArray.length,
                is_subscribed: isSubscribed,
                notification: nData,
                handwritten,
                feedback,
                is_only_equation: isOnlyEquation,
            };

            if (versionCode >= 765) {
                const autoPlayData = await QuestionContainer.getAutoPlayVariant(xAuthToken);

                if (!autoPlayData.autoPlayVariant) {
                    responseDataData.auto_play = false;
                } else {
                    responseDataData.auto_play = true;
                    responseDataData.auto_play_initiation = autoPlayData.waitTime;
                    responseDataData.auto_play_duration = autoPlayData.duration;
                }
            }

            if (versionCode && versionCode > 659) {
                if (versionCode && versionCode > 723 && advancedV3Flag) {
                    if (facets && facets.length) {
                        responseDataData.facets_v2 = facets;
                    }
                    responseDataData.tab = [];
                    if (matchEmpty) {
                        responseDataData.feedback.is_show = 0;
                    } else {
                        responseDataData.feedback.is_show = 1;
                    }
                } else if (facets && facets.length) {
                    responseDataData.facets = facets;
                }
            }

            const responseData = {
                data: responseDataData,
                error: false,
                schema: responseSchema,
            };
            if (typeof filedToUpdate.question_image === 'undefined') {
                responseData.data.question_image = null;
            }
            // const data = {
            //     action: 'ASK_FROM_APP',
            //     data: insertedQuestion,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.question_ask_sns, data);
            responseData.data.cdn_video_base_url = config.cdn_video_url;
            responseData.data.is_blur = isBlur;
            responseData.data.youtube_flag = youtubeFlag;
            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: responseData.data,
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
            if (ocr && matchesArray.length) {
                telemetry.addTelemetry(telemetry.eventNames.askSuccess, new Date() - start, { version: info.version });
            }
        } else {
            // const data = {
            //     action: 'ASK_FROM_APP',
            //     data: insertedQuestion,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.question_ask_sns, data);
            telemetry.addTelemetry(telemetry.eventNames.askFailure, new Date() - start, { msg: 'question_insert_failed' });
            next({
                message: 'Error in inserting question; Please check parameters', status: 500, isPublic: true, error: true,
            });
        }
    } catch (e) {
        // logger.error({"tag":'ask','source':'v9/ask','error':e})
        // const data = {
        //     action: 'ASK_FROM_APP',
        //     data: insertedQuestion,
        //     uuid: uuidv4(),
        //     timestamp: Utility.getCurrentTimeInIST(),
        // };
        telemetry.addTelemetry(telemetry.eventNames.askFailure, new Date() - start, { msg: 'api_failed' });
        // Utility.logEntry(sns, config.question_ask_sns, data);
        console.log(e);
        next(e);
    }
}

async function advanceSearchFacets(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const versionCode = req.headers.version_code;
        const appRegion = req.headers.country;
        const { question_id } = req.body;
        const advanceSearchEnabledVersionCode = 100000;
        const limit = req.body.limit || staticData.question_logging.limit;
        const xAuthToken = req.headers['x-auth-token'];
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        const researchFacets = ['chapter', 'subject'];
        const filterFacets = ['video_language', 'video_language_display', 'class'];
        if (Utility.isUsRegion(appRegion)) {
            throw "US APP";
        }

        const matchesArrayRedisResponse = await QuestionRedis.getMatchesForAdvanceSearchById(db.redis.read, question_id);
        let {
            matchesArray,
            matchesType,
        } = (!_.isNull(matchesArrayRedisResponse) ? JSON.parse(matchesArrayRedisResponse) : {});
        if (!_.isEmpty(matchesArray) && versionCode && (versionCode > advanceSearchEnabledVersionCode || (matchesType === 'image' && versionCode > 983))) {
            matchesArray = matchesArray.slice(0, limit);
            let facets = [];
            facets = await bl.getFacetsByVersionCode(xAuthToken, config, versionCode, UtilityFlagr, elasticSearchInstance, matchesArray, req.user.locale);
            console.log(facets);
            for (let q = facets.length - 1; q >= 0; q--) {
                facets[q].data = _.uniqBy(facets[q].data, 'display');
                if (filterFacets.includes(facets[q].facetType)) {
                    facets[q] = bl.formatFilterFacet(facets[q]);
                }
                if (researchFacets.includes(facets[q].facetType)) {
                    if (facets[q].data.length <= 1) {
                        facets.splice(q, 1);
                    } else {
                        facets[q] = bl.formatResearchFacets(facets[q]);
                    }
                }
            }

            QuestionRedis.setAdvanceSearchFacets(db.redis.write, question_id, JSON.stringify(facets));
            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    facets,
                    displayFilter: true,
                },
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
        } else {
            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    facets: [],
                    displayFilter: false,
                },
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
        }
    } catch (e) {
        const responseDataToSend = {
            meta: {
                code: 500,
                success: false,
                message: 'Failure',
            },
            data: {
                facets: [],
                displayFilter: false,
            },
        };
        res.status(responseDataToSend.meta.code).json(responseDataToSend);
    }
}

module.exports = {
    ask,
    advanceSearchFacets,
};
