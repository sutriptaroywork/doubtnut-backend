/* eslint-disable import/no-extraneous-dependencies */
/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-20T17:36:32+05:30
*/

const moment = require('moment');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const bluebird = require('bluebird');
const fuzz = require('fuzzball');
const _ = require('lodash');

const Question = require('../../../modules/question');
const Utility = require('../../../modules/utility');
const Student = require('../../../modules/student');
const Notification = require('../../../modules/notifications');
const Constant = require('../../../modules/constants');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionRedis = require('../../../modules/redis/question');
const LanguageContainer = require('../../../modules/containers/language');
const QuestionSql = require('../../../modules/mysql/question');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const AppConfigurationContainer = require('../../../modules/containers/appConfig');
const staticData = require('../../../data/data');
const responseSchema = require('../../../responseModels/question/v8/question');
const QuestionLog = require('../../../modules/mongo/questionAsk');
const Data = require('../../../data/data');

const QuestionHelper = require('../../helpers/question.helper');

bluebird.promisifyAll(fs);

let db; let elasticSearchInstance;

let config; let blobService;

async function ask(req, res, next) {
    const insertedQuestion = {};
    const sns = req.app.get('sns');
    const sqs = req.app.get('sqs');
    const { questionInitSnsUrl, userQuestionSnsUrl } = staticData;

    config = req.app.get('config');
    try {
        const translate2 = req.app.get('translate2');
        // elasticSearchClient = req.app.get('client');
        blobService = req.app.get('blobService');
        const publicPath = req.app.get('publicPath');
        db = req.app.get('db');
        const s3 = req.app.get('s3');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        let { question_text } = req.body;
        let { student_id } = req.user;
        let { locale } = req.body;
        const { subject } = req.body;
        const { chapter } = req.body;
        const ques = req.body.question;
        const student_class = req.body.class;
        const { question_image } = req.body;
        const master_iteration_mongo = {};
        const isAbEligible = Utility.isEligibleForAbTesting(student_id);

        // -------- mongo data insertion ------ //
        master_iteration_mongo.student_id = student_id;
        master_iteration_mongo.isAbEligible = (isAbEligible) ? 1 : 0;

        let matches_array; let languages_obj;
        let handwritten = 0;

        let st_lang_code; const filedToUpdate = {}; let promises = [];
        student_id = (student_id) ? parseInt(student_id) : 0;
        locale = ((locale) && (locale != '')) ? locale : 'en';
        insertedQuestion.student_id = student_id;
        insertedQuestion.class = student_class;
        insertedQuestion.subject = subject;
        insertedQuestion.book = subject;
        insertedQuestion.chapter = chapter;
        insertedQuestion.question = ques;
        insertedQuestion.doubt = ques;
        insertedQuestion.locale = locale;
        const color = staticData.colors;
        const topictab = staticData.topic_tab;

        promises.push(Question.addQuestion(insertedQuestion, db.mysql.write));
        promises.push(LanguageContainer.getList(db));
        // promises.push(AppConfigurationContainer.getConfig(db))
        promises.push(AppConfigurationContainer.getWhatsappData(db, student_class));
        // promises.push(contentUnlockContainer.getUnlockStatus(db,student_id,"PC"))
        const resolvedPromises = await Promise.all(promises);
        // const unlockStatus = 1;
        // let unlockStatus=resolvedPromises[4]
        promises = [];
        const insertQuestionResult = resolvedPromises[0];
        const feedback = staticData.match_page_feedback;

        const whatsAppData = resolvedPromises[2];
        whatsAppData[0].key_value = JSON.parse(whatsAppData[0].key_value);
        const whatsAppJson = {};
        whatsAppJson.image_url = whatsAppData[0].key_value.image_url;
        whatsAppJson.description = whatsAppData[0].key_value.description;
        whatsAppJson.button_text = whatsAppData[0].key_value.button_text;
        whatsAppJson.button_bg_color = whatsAppData[0].key_value.button_bg_color;
        whatsAppJson.action_activity = whatsAppData[0].key_value.action_activity;
        whatsAppJson.action_data = whatsAppData[0].key_value.action_data;
        whatsAppJson.resource_type = 'card';
        // delete whatsappData[0].key_value

        const languages_arrays = resolvedPromises[1];
        const isAbTestingActive = 1; let
            is_subscribed = 0;
        const qid = insertQuestionResult.insertId;

        const uuid = uuidv4();
        QuestionHelper.sendSnsMessage({
            type: 'question-init',
            sns,
            uuid,
            qid,
            studentId: student_id,
            studentClass: student_class,
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
        let ocr; let fileName = null; let ocr_data; let original_ocr;

        if (qid) {
            // -------- mongo data insertion ------ //
            master_iteration_mongo.qid = qid;
            // check for image
            if ((typeof question_text === 'undefined' || question_text.length == 0) && (typeof question_image !== 'undefined' && question_image.length > 0)) {
                fileName = await QuestionHelper.handleImage(question_image, fs, qid, config, s3, publicPath, blobService);
                // let fileName = image_obj['filename'];
                // let question_image = image_obj['question_image'];

                promises = [];
                filedToUpdate.question_image = fileName;
                insertedQuestion.question_image = fileName;
                const host = `${req.protocol}://${req.headers.host}`;
                ocr_data = await QuestionHelper.handleOcr(student_id, isAbTestingActive, question_image, host, locale, handwritten, fileName, translate2, config);
                ocr = ocr_data.ocr;
                original_ocr = ocr_data.original_ocr;
                handwritten = ocr_data.handwritten;
                locale = ocr_data.locale;
                // ocr_text = ocr;
                Utility.deleteImage(`${publicPath}/uploads/${fileName}`, fs);
            } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
                // question text
                if (locale != 'en' && locale != 'es' && locale != 'gl' && locale != 'ca' && locale != 'cy' && locale != 'it' && locale != 'gd' && locale != 'sv' && locale != 'da' && locale != 'ro' && locale != 'fil' && locale != 'mt' && locale != 'pt-PT') {
                    const transLateApiResp = await Utility.translateApi2(question_text, translate2);
                    if (transLateApiResp.length > 0 && transLateApiResp[1].data != undefined && transLateApiResp[1].data.translations != undefined && transLateApiResp[1].data.translations[0].translatedText != undefined) {
                        question_text = transLateApiResp[1].data.translations[0].translatedText;
                    }
                }
                ocr = question_text;
                original_ocr = ocr;
                ocr_data = {
                    ocr: question_text, ocr_type: 0, handwritten, locale, ocr_origin: 'question_text',
                };
            }

            master_iteration_mongo.ocr_type = ocr_data.ocr_origin;
            // ocr = Utility.replaceSpecialSymbol2(ocr)
            filedToUpdate.ocr_done = 1;
            filedToUpdate.ocr_text = ocr;
            filedToUpdate.original_ocr_text = original_ocr;
            filedToUpdate.locale = locale;
            insertedQuestion.ocr_done = 1;
            insertedQuestion.ocr_text = ocr;
            insertedQuestion.original_ocr_text = original_ocr;
            insertedQuestion.locale = locale;
            promises.push(QuestionHelper.handleElasticSearchPCM(ocr_data, elasticSearchInstance, config.elastic.REPO_INDEX1));
            // -------- mongo data insertion ------ //
            master_iteration_mongo.elastic_index = config.elastic.REPO_INDEX1;

            // promises.push(QuestionHelper.handleElasticSearchNew(ocr_data, elasticSearchInstance, student_id));
            promises.push(QuestionRedis.setPreviousHistory(student_id, [{
                question_id: qid,
                ocr_text: ocr,
            }], db.redis.write));
            promises.push(Student.isSubscribed(student_id, db.mysql.read));
            languages_obj = Utility.getLanguageObject(languages_arrays);
            const resolvedPromise2 = await Promise.all(promises);
            promises = [];
            if (!resolvedPromise2[0]) {
                return next({
                    message: 'Error in search matches!', status: 500, isPublic: true, error: true,
                });
            }
            if ((resolvedPromise2[2].length == 1) && (resolvedPromise2[2][0].student_id == student_id)) {
                is_subscribed = 1;
            }
            st_lang_code = req.user.locale;
            let language = languages_obj[st_lang_code];
            if (typeof language === 'undefined') {
                language = 'english';
            }

            const stringDiffResp = Utility.stringDiffImplementWithKey(resolvedPromise2[0].hits.hits, ocr, fuzz, 'ocr_text', language, false);
            matches_array = stringDiffResp[0];
            // -------- mongo data insertion ------ //
            master_iteration_mongo.qid_matches_array = matches_array;

            const matchesQuestionArray = stringDiffResp[1];
            const groupedQid = stringDiffResp[2];
            filedToUpdate.subject = stringDiffResp[3];
            insertedQuestion.subject = stringDiffResp[3];
            matches_array = (student_id % 2 == 0) ? matches_array.slice(0, 20) : matches_array;
            let groupedMeta = [];
            if (groupedQid.length > 0) {
                // get meta info from elasticSearch
                const meta = await elasticSearchInstance.getMeta(groupedQid);
                // console.log("meta")
                // console.log(meta)
                groupedMeta = _.groupBy(meta.docs, '_id');
            }

            // -------- mongo data insertion ------ //
            master_iteration_mongo.meta_index = Data.currentQuestionAskMetaIndex;
            master_iteration_mongo.iteration_name = Data.current_ask_question_iteration;
            master_iteration_mongo.request_version = 'v8';
            master_iteration_mongo.question_image = fileName;
            master_iteration_mongo.user_locale = st_lang_code;
            master_iteration_mongo.ocr = ocr;
            const question_ask_log = new QuestionLog.QuestionLogModel(master_iteration_mongo);
            // question_ask_log.save().then(() => {

            // }).catch(() => {

            // });

            if (language != 'english') {
                matches_array = await QuestionContainer.getLocalisedQuestionMulti(matches_array, groupedMeta, language, db);
            }
            // return res.send(matches_array)

            let matchedQuestionsHtml;
            let groupedMatchedQuestionHtml;
            if (language == 'english' && matchesQuestionArray.length > 0) {
                matchedQuestionsHtml = await QuestionSql.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
            }

            // console.log(groupedMeta)
            matches_array = await QuestionContainer.getQuestionStats(matches_array, config, color, language, st_lang_code, groupedMatchedQuestionHtml, groupedMeta, db);
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentMulti(matches_array, student_id, db));
            promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write));
            const resolvedP = await Promise.all(promises);
            matches_array = resolvedP[0];
            if (whatsAppData.length > 0 && matches_array.length > 0) {
                matches_array.splice(6, 0, whatsAppJson);
            }
            const n_data = [];
            // let d1 = moment(req.user.timestamp).format("YYYY:MM:DD")
            // let d2 = moment(new Date()).format("YYYY:MM:DD")
            const d1 = moment(req.user.timestamp);
            const d2 = moment(new Date());
            const difference = d2.diff(d1, 'days');
            QuestionHelper.sendSnsMessage({
                type: 'user-questions',
                sns,
                uuid,
                qid,
                studentId: student_id,
                studentClass: student_class,
                subject,
                chapter,
                version: insertedQuestion.question,
                ques,
                locale,
                questionImage: filedToUpdate.question_image,
                ocrText: filedToUpdate.ocr_text,
                ocrDone: filedToUpdate.ocr_done,
                originalOcrText: filedToUpdate.original_ocr_text,
                wrongImage: 0,
                isTrial: 0,
                difficulty: null,
                UtilityModule: Utility,
                userQuestionSnsUrl,
                config,
            });
            Notification.checkUserActiveNotification('ask_no_watch', db.mysql.read).then((notification) => {
                if (notification.length > 0 && difference > 4) {
                    const intro_video_id = Constant.cropToEquation();
                    const notification_data1 = {
                        event: 'camera_guide',
                        title: notification[0].title,
                        message: notification[0].message,
                        image: notification[0].image_url,
                        data: JSON.stringify({
                            qid: intro_video_id,
                            page: 'NOTIFICATION',
                            resource_type: 'video',
                        }),
                    };
                    n_data.push(notification_data1);
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
                        tab: topictab,
                        ocr_text: filedToUpdate.ocr_text,
                        question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                        matched_questions: matches_array,
                        matched_count: matches_array.length,
                        is_subscribed,
                        notification: n_data,
                        handwritten,
                        feedback,
                    },
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
                next(responseData);
            }).catch(() => {
                const responseData = {
                    data: {
                        question_id: qid,
                        tab: topictab,
                        question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                        ocr_text: filedToUpdate.ocr_text,
                        matched_questions: matches_array,
                        matched_count: matches_array.length,
                        is_subscribed,
                        notification: n_data,
                        handwritten,
                        feedback,
                    },
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
                next(responseData);
            });
            // }).catch(error => {
            //   next({message: error, error: true})
            // });
        } else {
            // const data = {
            //     action: 'ASK_FROM_APP',
            //     data: insertedQuestion,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.question_ask_sns, data);
            next({
                message: 'Error in inserting question; Please check parameters', status: 500, isPublic: true, error: true,
            });
        }
    } catch (e) {
        console.log(e);
        // const data = {
        //     action: 'ASK_FROM_APP',
        //     data: insertedQuestion,
        //     uuid: uuidv4(),
        //     timestamp: Utility.getCurrentTimeInIST(),
        // };
        // Utility.logEntry(sns, config.question_ask_sns, data);
        next(e);
    }
}

module.exports = {
    ask,
};
