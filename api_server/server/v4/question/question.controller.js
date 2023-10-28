/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-11 13:36:09
*/

const fuzz = require('fuzzball');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const fs = require('fs');
const bluebird = require('bluebird');
const _ = require('lodash');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const Utility = require('../../../modules/utility');
const Student = require('../../../modules/student');
const Notification = require('../../../modules/notifications');
const Constant = require('../../../modules/constants');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionRedis = require('../../../modules/redis/question');
const ChapterContainer = require('../../../modules/containers/chapter');
const LanguageContainer = require('../../../modules/containers/language');
const QuestionSql = require('../../../modules/mysql/question');
const AppConfiguration = require('../../../modules/mysql/appConfig');
const AppConfigurationContainer = require('../../../modules/containers/appConfig');
const QuestionMetaContainer = require('../../../modules/containers/questionsMeta');
const QuestionHelper = require('../../helpers/question.helper');
const responseSchema = require('../../../responseModels/question/v4/question');
const QuestionLog = require('../../../modules/mongo/questionAsk');
const Data = require('../../../data/data');

bluebird.promisifyAll(fs);

let db; let
    elasticSearchInstance;

let config; let elasticSearchClient; let
    blobService;

async function getQuestionDetailsByTag(req, res, next) {
    db = req.app.get('db');
    const count = 100;
    const { page } = req.body;
    const tag_data = req.body.tag_data_obj;
    const tag_data_obj = eval(`(${tag_data})`);
    // let questions_data = {};
    let str = '';
    const { locale } = req.user;
    let language = 'english';
    const lang = await LanguageContainer.getByCode(locale, db);
    // console.log("language")
    // console.log(lang)
    if (lang.length > 0) {
        language = lang[0].language;
    }
    try {
        const key1 = Object.keys(tag_data_obj)[0];
        if (key1 == 'packages') {
            str += `${key1}= '${tag_data_obj[key1]}'`;
            Question.getTagPackageData(str, count, page, db.mysql.read).then((values) => {
                const responseData = {
                    meta: {
                        code: 200,
                        message: 'SUCCESS',
                    },
                    data: values,
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "message": "ERROR",
                //   },
                //   "data": null
                // }
                // res.status(responseData.meta.code).json(responseData);
            });
        } else {
            str += `${key1}= '${tag_data_obj[key1]}'`;
            Question.getTagDataWithLanguage(str, language, count, page, db.mysql.read).then((values) => {
                const responseData = {
                    meta: {
                        code: 200,
                        message: 'SUCCESS',
                    },
                    data: values,
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                // console.log(err)
                next(err);

                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "message": "ERROR",
                //   },
                //   "data": null
                // }
                // res.status(responseData.meta.code).json(responseData);
            });
        }
    } catch (e) {
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 404,
    //     "message": "Something is wrong",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function ask(req, res, next) {
    const insertedQuestion = {};
    const sns = req.app.get('sns');
    const sqs = req.app.get('sqs');
    const { questionInitSnsUrl, userQuestionSnsUrl } = Data;
    config = req.app.get('config');
    try {
        const translate2 = req.app.get('translate2');
        elasticSearchClient = req.app.get('client');
        blobService = req.app.get('blobService');
        const publicPath = req.app.get('publicPath');
        db = req.app.get('db');
        const s3 = req.app.get('s3');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        let { question_text } = req.body;
        let { student_id } = req.user;
        let { locale } = req.body;
        let { subject } = req.body;
        subject = 'MATHS';
        const { chapter } = req.body;
        const ques = req.body.question;
        const student_class = req.body.class;
        let { question_image } = req.body;

        const master_iteration_mongo = {};
        const isAbEligible = Utility.isEligibleForAbTesting(student_id);

        // -------- mongo data insertion ------ //
        master_iteration_mongo.student_id = student_id;
        master_iteration_mongo.isAbEligible = (isAbEligible) ? 1 : 0;

        let matches_array; let languages_arrays; let languages_obj; let ocr_text;
        let handwritten = 0;

        let st_lang_code; let qid; const filedToUpdate = {}; let
            promises = [];
        student_id = (student_id) ? parseInt(student_id) : 0;
        locale = ((locale) && (locale !== '')) ? locale : 'en';
        insertedQuestion.student_id = student_id;
        insertedQuestion.class = student_class;
        insertedQuestion.subject = subject;
        insertedQuestion.book = subject;
        insertedQuestion.chapter = chapter;
        insertedQuestion.question = ques;
        insertedQuestion.doubt = ques;
        insertedQuestion.locale = locale;
        promises.push(Question.addQuestion(insertedQuestion, db.mysql.write));
        promises.push(LanguageContainer.getList(db));
        promises.push(AppConfigurationContainer.getConfig(db));

        const resolvedPromises = await Promise.all(promises);
        promises = [];
        const insertQuestionResult = resolvedPromises[0];
        languages_arrays = resolvedPromises[1];
        const isStringDiffActive = resolvedPromises[2].apply_string_diff;
        const isAbTestingActive = resolvedPromises[2].ab_testing_question_ask;
        qid = insertQuestionResult.insertId;

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
            if ((typeof question_text === 'undefined' || question_text.length === 0) && (typeof question_image !== 'undefined' && question_image.length > 0)) {
                let extension = '.png';
                let content_type;
                if (question_image.indexOf('png') !== -1) {
                    extension = '.png';
                    content_type = 'image/png';
                } else if (question_image.indexOf('jpg') !== -1 || question_image.indexOf('jpeg') !== -1) {
                    extension = '.jpg';
                    content_type = 'image/jpg';
                }
                // ////console.log(question_image);
                question_image = question_image.replace(/^data:([A-Za-z-+/]+);base64,/, '');

                fileName = `upload_${qid}_${moment().unix()}${extension}`;
                const buf = new Buffer(question_image, 'base64');
                promises.push(fs.writeFileAsync(`${publicPath}/uploads/${fileName}`, question_image, 'base64'));
                promises.push(Utility.uploadImageToBlob(blobService, fileName, buf));
                promises.push(Utility.uploadTos3(s3, config.aws_bucket, fileName, buf, content_type));
                await Promise.all(promises);
                promises = [];
                // TODO: add redis pub event to upload image to blob
                filedToUpdate.question_image = fileName;
                insertedQuestion.question_image = fileName;
                const host = `${req.protocol}://${req.headers.host}`;
                ocr_data = await QuestionHelper.handleOcr(student_id, isAbTestingActive, question_image, host, locale, handwritten, fileName, translate2, config);
                ocr = ocr_data.ocr;
                original_ocr = ocr_data.original_ocr;
                // ocr_type = ocr_data['ocr_type']
                handwritten = ocr_data.handwritten;
                locale = ocr_data.locale;
                ocr_text = ocr;
                Utility.deleteImage(`${publicPath}/uploads/${fileName}`, fs);
            } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
                // question text
                if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
                    const transLateApiResp = await Utility.translateApi2(question_text, translate2);
                    if (transLateApiResp.length > 0 && transLateApiResp[1].data !== undefined && transLateApiResp[1].data.translations !== undefined && transLateApiResp[1].data.translations[0].translatedText !== undefined) {
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
            promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write));
            // let isAbEligible = Utility.isEligibleForAbTesting(student_id);
            // if (isAbEligible) {
            //   promises.push(QuestionHelper.handleElasticSearchForHomoIter(ocr_data, elasticSearchInstance, config.elastic.REPO_INDEX_ITER_HOMO,0));
            // } else {
            promises.push(QuestionHelper.handleElasticSearch(ocr_data, elasticSearchInstance));
            // }
            // -------- mongo data insertion ------ //
            promises.push(QuestionRedis.setPreviousHistory(student_id, [{ question_id: qid, ocr_text: ocr }], db.redis.write));
            // await QuestionRedis.setPreviousHistory(student_id,[{'question_id':qid,'ocr_text':ocr_text}], db.redis.write)
            master_iteration_mongo.elastic_index = Data.hetro_elastic_indexes[0];
            languages_obj = Utility.getLanguageObject(languages_arrays);
            Promise.all(promises).then((values) => {
                if (values[1]) {
                    const promises1 = [];

                    st_lang_code = req.user.locale;

                    let language = languages_obj[st_lang_code];
                    if (typeof language === 'undefined') {
                        language = 'english';
                    }
                    matches_array = values[1].hits.hits;
                    // -------- mongo data insertion ------ //
                    master_iteration_mongo.qid_matches_array = matches_array;
                    // notification start -----------------------------------------------  on check of asked first question   -----------------------  //
                    /// /console.log("isStringDiffActive")
                    /// /console.log(isStringDiffActive)
                    if (locale === 'en') {
                        /// /console.log("stringdifffffffff")
                        matches_array = Utility.stringDiffImplement(matches_array, ocr_text, fuzz);
                        if (matches_array.length > 0) {
                            ocr_data.string_diff = matches_array[0].partial_score;
                            // set info in redis
                            //   await QuestionRedis.setQuestionAskMeta(qid,ocr_data,db.redis.write)
                        }
                    }

                    // -------- mongo data insertion ------ //
                    master_iteration_mongo.meta_index = Data.currentQuestionAskMetaIndex;
                    master_iteration_mongo.iteration_name = Data.current_ask_question_iteration;
                    master_iteration_mongo.request_version = 'v4';
                    master_iteration_mongo.question_image = fileName;
                    master_iteration_mongo.user_locale = st_lang_code;
                    master_iteration_mongo.ocr = ocr;

                    const question_ask_log = new QuestionLog.QuestionLogModel(master_iteration_mongo);
                    // question_ask_log.save().then(() => {

                    // }).catch(() => {

                    // });

                    if (language !== 'english') {
                        for (let i = 0; i < matches_array.length; i++) {
                            promises1.push(QuestionContainer.getLocalisedQuestion(matches_array[i]._id, language, db));
                        }
                    }
                    Promise.all(promises1).then(async (results) => {
                        for (let i = 0; i < results.length; i++) {
                            if ((typeof results[i] !== 'undefined') && results[i].length > 0) {
                                values[1].hits.hits[i]._source.ocr_text = results[i][0][language];
                            }
                        }

                        // Notification.questionCountNotifications(student_id, req.user.gcm_reg_id, config, admin, db);

                        const promises3 = []; let
                            is_subscribed = 0;
                        for (let i = 0; i < matches_array.length; i++) {
                            promises3.push(QuestionMetaContainer.getQuestionMeta(matches_array[i]._id, db));
                        }
                        promises3.push(Student.isSubscribed(student_id, db.mysql.read));
                        const matchesQuestionArray = _.keys(_.groupBy(matches_array, '_id'));
                        let matchedQuestionsHtml;
                        let groupedMatchedQuestionHtml;
                        if (language == 'english' && matchesQuestionArray.length > 0) {
                            matchedQuestionsHtml = await QuestionSql.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                            groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                        }
                        Promise.all(promises3).then(async (values) => {
                            for (let i = 0; i < values.length; i++) {
                                if (i == (values.length - 1)) {
                                    if ((values[i].length == 1) && values[i][0].student_id == student_id) {
                                        is_subscribed = 1;
                                    }
                                } else {
                                    if (language == 'english' && groupedMatchedQuestionHtml[matches_array[i]._id] && groupedMatchedQuestionHtml[matches_array[i]._id].length > 0) {
                                        matches_array[i].html = groupedMatchedQuestionHtml[matches_array[i]._id][0].html;
                                    }
                                    if (values[i].length > 0) {
                                        matches_array[i].class = values[i][0].class;
                                        matches_array[i].chapter = values[i][0].chapter;
                                        matches_array[i].difficulty_level = values[i][0].level;
                                    } else {
                                        matches_array[i].class = null;
                                        matches_array[i].chapter = null;
                                        matches_array[i].difficulty_level = null;
                                    }
                                    if (st_lang_code !== 'en') {
                                        matches_array[i].question_thumbnail = `${config.blob_url}q-thumbnail/${st_lang_code}_${matches_array[i]._id}.png`;
                                    } else {
                                        matches_array[i].question_thumbnail = `${config.blob_url}q-thumbnail/${matches_array[i]._id}.png`;
                                    }
                                }
                            }
                            const n_data = [];
                            const d1 = moment(req.user.timestamp).format('YYYY:MM:DD');
                            const d2 = moment(new Date()).format('YYYY:MM:DD');

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
                                if (notification.length > 0 && (d1 !== d2)) {
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
                                        ocr_text: filedToUpdate.ocr_text,
                                        // "question_image": config.blob_url + "q-images/" + filedToUpdate['question_image'],
                                        question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                                        matched_questions: matches_array,
                                        matched_count: matches_array.length,
                                        is_subscribed,
                                        notification: n_data,
                                        handwritten,
                                    },
                                    error: false,
                                    schema: responseSchema,
                                };
                                if (typeof filedToUpdate.question_image === 'undefined') {
                                    responseData.data.question_image = null;
                                }
                                // res.status(responseData.meta.code).json(responseData);
                                // let data = {
                                //    "action":"ASK_FROM_APP",
                                //    "data": insertedQuestion,
                                //    "uuid": uuidv4(),
                                //    "timestamp": Utility.getCurrentTimeInIST()
                                //  }
                                // Utility.logEntry(sns,config.question_ask_sns, data)
                                next(responseData);
                            }).catch((error) => {
                                // console.log(error)
                                const responseData = {
                                    data: {
                                        question_id: qid,
                                        question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                                        ocr_text: filedToUpdate.ocr_text,
                                        matched_questions: matches_array,
                                        matched_count: matches_array.length,
                                        is_subscribed,
                                        notification: n_data,
                                        handwritten,

                                    },
                                    error: false,
                                    schema: responseSchema,
                                };
                                if (typeof filedToUpdate.question_image === 'undefined') {
                                    responseData.data.question_image = null;
                                }
                                // let data = {
                                //    "action":"ASK_FROM_APP",
                                //    "data": insertedQuestion,
                                //    "uuid": uuidv4(),
                                //    "timestamp": Utility.getCurrentTimeInIST()
                                //  }
                                // Utility.logEntry(sns,config.question_ask_sns, data)
                                next(responseData);
                            });
                        }).catch((error) => {
                            // let data = {
                            //    "action":"ASK_FROM_APP",
                            //    "data": insertedQuestion,
                            //    "uuid": uuidv4(),
                            //    "timestamp": Utility.getCurrentTimeInIST()
                            //  }
                            // Utility.logEntry(sns,config.question_ask_sns, data)
                            next({ message: error, error: true });
                        });
                    }).catch((error) => {
                        // let data = {
                        //    "action":"ASK_FROM_APP",
                        //    "data": insertedQuestion,
                        //    "uuid": uuidv4(),
                        //    "timestamp": Utility.getCurrentTimeInIST()
                        //  }
                        // Utility.logEntry(sns,config.question_ask_sns, data)
                        next({ message: error, error: true });
                    });
                } else {
                    // let data = {
                    //    "action":"ASK_FROM_APP",
                    //    "data": insertedQuestion,
                    //    "uuid": uuidv4(),
                    //    "timestamp": Utility.getCurrentTimeInIST()
                    //  }
                    // Utility.logEntry(sns,config.question_ask_sns, data)
                    next({
                        message: 'Error in search matches!', status: 500, isPublic: true, error: true,
                    });
                }
            }).catch((error) => {
                // let data = {
                //    "action":"ASK_FROM_APP",
                //    "data": insertedQuestion,
                //    "uuid": uuidv4(),
                //    "timestamp": Utility.getCurrentTimeInIST()
                //  }
                // Utility.logEntry(sns,config.question_ask_sns, data)
                next(error);
            });
        } else {
            // let data = {
            //    "action":"ASK_FROM_APP",
            //    "data": insertedQuestion,
            //    "uuid": uuidv4(),
            //    "timestamp": Utility.getCurrentTimeInIST()
            //  }
            // Utility.logEntry(sns,config.question_ask_sns, data)
            next({
                message: 'Error in inserting question; Please check parameters', status: 500, isPublic: true, error: true,
            });
        }
    } catch (e) {
        console.log(e);
        // let data = {
        //    "action":"ASK_FROM_APP",
        //    "data": insertedQuestion,
        //    "uuid": uuidv4(),
        //    "timestamp": Utility.getCurrentTimeInIST()
        //  }
        // Utility.logEntry(sns,config.question_ask_sns, data)
        next(e);
    }
}

async function filter(req, res, next) {
    db = req.app.get('db');
    const database = db.mysql.read;
    const parameters = eval(`(${req.body.params})`);
    const { course } = parameters;
    const sclass = parameters.class;
    const { chapter } = parameters;
    const { subtopic } = parameters;
    const { exercise } = parameters;
    const { exam } = parameters;
    const { study } = parameters;
    const { year } = parameters;
    const page_length = req.body.count;
    const page_no = req.body.page;
    const datas = []; let
        questions_list = [];

    let locale_val = req.body.locale;
    if (locale_val == undefined) {
        locale_val = '';
    }

    const version = 'v4';

    if (course == 'IIT') {
        if ((_.isNull(chapter) || chapter == '' || chapter == undefined) && (_.isNull(subtopic) || subtopic == '' || subtopic == undefined)) {
            /* Sending chapters as the filters */
            const promises = [];
            const params = {
                classes: [],
                chapters: [],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };
            promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, null, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const chapters = result[0];
                    const data1 = [];
                    chapters.forEach((values) => {
                        data1.push(values.chapter);
                    });
                    datas.push({
                        title: 'Chapters',
                        name: 'chapter',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const questions = result[1];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                    content = result[3][0].content;
                    heading = result[3][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { course },
                        total_records: result[2][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else if ((!_.isNull(chapter && chapter != '')) && (_.isNull(subtopic) || subtopic == '' || subtopic == undefined)) {
            /* Sending subtopics as the filters */

            const promises = [];
            const params = {
                classes: [],
                chapters: [chapter],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };

            let chapter2 = chapter;
            if (chapter2 != null && chapter2 != '') {
                chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, '');
                chapter2 = chapter2.replace(/\s+/g, ' ');
            }
            console.log('chapter 2 ::: ', chapter2);

            const params2 = {
                classes: [],
                chapters: [chapter2],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };
            promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, null, db));
            promises.push(ChapterContainer.getDistSubtopicsLocalised(locale_val, version, course, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const chapters = result[0];
                    const data1 = [];
                    chapters.forEach((values) => {
                        data1.push(values.chapter);
                    });
                    datas.push({
                        title: 'Chapters',
                        name: 'chapter',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const subtopics = result[1];
                    const data1 = [];
                    subtopics.forEach((values) => {
                        data1.push(values.subtopic);
                    });
                    datas.push({
                        title: 'Subtopics',
                        name: 'subtopic',
                        list: data1,
                    });
                }
                if (!_.isNull(result[2]) && result[2] !== undefined) {
                    const questions = result[2];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
                    content = result[4][0].content;
                    heading = result[4][0].heading;
                }

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { course, chapter },
                        total_records: result[3][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else if ((!_.isNull(chapter) && (chapter != '')) && (!_.isNull(subtopic) && (subtopic != ''))) {
            /* Sending  all the filters */

            const promises = [];
            const params = {
                classes: [],
                chapters: [chapter],
                subtopics: [subtopic],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };

            let chapter2 = chapter;
            if (chapter2 != null && chapter2 != '') {
                chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, '');
                chapter2 = chapter2.replace(/\s+/g, ' ');
            }
            console.log('chapter 2 ::: ', chapter2);

            let subtopic2 = subtopic;
            if (subtopic2 != null && subtopic2 != '') {
                subtopic2 = subtopic2.replace(new RegExp('[/]', 'g'), '_');
                subtopic2 = subtopic2.replace(/[^a-zA-Z0-9 ]/g, '');
                subtopic2 = subtopic2.replace(/\s+/g, ' ');
            }
            console.log('subtopic 2 ::: ', subtopic2);

            const params2 = {
                classes: [],
                chapters: [chapter2],
                subtopics: [subtopic2],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };
            promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, null, db));
            promises.push(ChapterContainer.getDistSubtopicsLocalised(locale_val, version, course, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const chapters = result[0];
                    const data1 = [];
                    chapters.forEach((values) => {
                        data1.push(values.chapter);
                    });
                    datas.push({
                        title: 'Chapters',
                        name: 'chapter',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const subtopics = result[1];
                    const data1 = [];
                    subtopics.forEach((values) => {
                        data1.push(values.subtopic);
                    });
                    datas.push({
                        title: 'Subtopics',
                        name: 'subtopic',
                        list: data1,
                    });
                }

                if (!_.isNull(result[2]) && result[2] !== undefined) {
                    const questions = result[2];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
                    content = result[4][0].content;
                    heading = result[4][0].heading;
                }

                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { course, chapter, subtopic },
                        total_records: result[3][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        }
    } else if (course == 'NCERT') {
        if ((_.isNull(sclass) || sclass == '' || sclass == undefined) && (_.isNull(chapter) || chapter == '' || chapter == undefined) && (_.isNull(exercise) || exercise == '' || exercise == undefined)) {
            /* Sending class as the filters  */
            // console.log('ncert only');
            const promises = [];
            const params = {
                classes: [],
                chapters: [],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };
            promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const classes = result[0];
                    const data1 = [];
                    classes.forEach((values) => {
                        data1.push(values.class);
                    });
                    datas.push({
                        title: 'Classes',
                        name: 'class',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const questions = result[1];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                    content = result[3][0].content;
                    heading = result[3][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { course },
                        total_records: result[2][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else if ((!_.isNull(sclass) && sclass != '') && (_.isNull(chapter) || chapter == '' || chapter == undefined) && (_.isNull(exercise) || exercise == '' || exercise == undefined)) {
            /* Sending chapter as the filters  */
            const promises = [];
            const params = {
                classes: [sclass],
                chapters: [],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };
            promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
            promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, sclass, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));
            promises.push(ChapterContainer.getDistChaptersOfContent('', version, 'NCERT', sclass, db));

            Promise.all(promises).then(async (result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const classes = result[0];
                    const data1 = [];
                    classes.forEach((values) => {
                        data1.push(values.class);
                    });
                    datas.push({
                        title: 'Classes',
                        name: 'class',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const chapters = result[1];
                    const data1 = [];
                    const data2 = [];

                    // chapters.forEach( async values => {
                    //   let orderData = await QuestionContainer.getChapterOrder(sclass, values.chapter, db)
                    //   console.log(orderData)
                    //   // console.log(orderData[0].chapter_order)
                    //   // data1.push(values.chapter);
                    //   // data1.push(values.chapter);
                    //   // data1.push({ "order": orderData[0].chapter_order, "chapter": values.chapter })
                    // });

                    for (let i = 0; i < chapters.length; i++) {
                        const orderData = await QuestionContainer.getChapterOrder(sclass, chapters[i].chapter, db);
                        data1.push({ order: orderData[0].chapter_order, chapter: chapters[i].chapter });
                        data2.push(chapters[i].chapter.toUpperCase());
                    }

                    if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
                        for (let i = 0; i < result[5].length; i++) {
                            if (data2.indexOf(result[5][i].chapter.toUpperCase()) == -1) {
                                data1.push({ order: result[5][i].order, chapter: result[5][i].chapter.toUpperCase() });
                            }
                        }
                    }
                    // console.log(result[5])
                    // return res.send("hello")
                    datas.push({
                        title: 'Chapters',
                        name: 'chapter',
                        list: data1,
                    });
                }

                if (!_.isNull(result[2]) && result[2] !== undefined) {
                    const questions = result[2];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
                    content = result[4][0].content;
                    heading = result[4][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { course, class: sclass },
                        total_records: result[3][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else if ((!_.isNull(sclass) && sclass != '') && (!_.isNull(chapter) && chapter != '') && (_.isNull(exercise) || exercise == '' || exercise == undefined)) {
            /* Sending exercises as the filter */
            const promises = [];
            const params = {
                classes: [sclass],
                chapters: [chapter],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };

            let chapter2 = chapter;
            if (chapter2 != null && chapter2 != '') {
                chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, '');
                chapter2 = chapter2.replace(/\s+/g, ' ');
            }
            console.log('chapter 2 ::: ', chapter2);

            const params2 = {
                classes: [sclass],
                chapters: [chapter2],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
            };
            promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
            promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, sclass, db));
            promises.push(ChapterContainer.getDistExercisesLocalised(locale_val, version, course, sclass, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));
            promises.push(ChapterContainer.getDistChaptersOfContent('', version, 'NCERT', sclass, db));

            Promise.all(promises).then(async (result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const classes = result[0];
                    const data1 = [];
                    classes.forEach((values) => {
                        data1.push(values.class);
                    });
                    datas.push({
                        title: 'Classes',
                        name: 'class',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const chapters = result[1];
                    const data1 = [];
                    const data2 = [];
                    // chapters.forEach(function (values) {
                    //   data1.push(values.chapter);
                    // });

                    // if(sclass==7 || sclass==9){
                    //   data1=result[6]
                    // }else{
                    //     for(let i=0; i<chapters.length; i++)
                    //   {
                    //     let orderData = await QuestionContainer.getChapterOrder(sclass, chapters[i].chapter, db)
                    //     data1.push({ "order": orderData[0].chapter_order, "chapter": chapters[i].chapter })
                    //   }

                    //   if (!_.isNull(result[6]) && result[6] !== undefined && result[6].length != 0) {
                    //     for(let i=0; i<result[6].length; i++)
                    //     {
                    //       if(data1.indexOf(result[6][i].chapter.toUpperCase()) == -1)
                    //       {
                    //         let orderData = await QuestionContainer.getChapterOrder(sclass, result[6][i].chapter, db)
                    //         // data1.push(result[6][i].chapter.toUpperCase());
                    //         data1.push({ "order": orderData[0].chapter_order, "chapter": result[6][i].chapter })
                    //       }
                    //     }
                    //   }
                    // }

                    for (let i = 0; i < chapters.length; i++) {
                        const orderData = await QuestionContainer.getChapterOrder(sclass, chapters[i].chapter, db);
                        data1.push({ order: orderData[0].chapter_order, chapter: chapters[i].chapter });
                        data2.push(chapters[i].chapter.toUpperCase());
                    }

                    if (!_.isNull(result[6]) && result[6] !== undefined && result[6].length != 0) {
                        for (let i = 0; i < result[6].length; i++) {
                            if (data2.indexOf(result[6][i].chapter.toUpperCase()) == -1) {
                                data1.push({ order: result[6][i].order, chapter: result[6][i].chapter.toUpperCase() });
                            }
                        }
                    }

                    datas.push({
                        title: 'Chapters',
                        name: 'chapter',
                        list: data1,
                    });
                }

                if (!_.isNull(result[2]) && result[2] !== undefined) {
                    const exercises = result[2];
                    const data1 = [];
                    exercises.forEach((values) => {
                        data1.push(values.exercise);
                    });
                    datas.push({
                        title: 'Exercises',
                        name: 'exercise',
                        list: data1,
                    });
                }

                if (!_.isNull(result[3]) && result[3] !== undefined) {
                    const questions = result[3];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
                    content = result[5][0].content;
                    heading = result[5][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { course, class: sclass, chapters: chapter },
                        total_records: result[4][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else if ((!_.isNull(sclass) && sclass != '') && (!_.isNull(chapter) && chapter != '') && (!_.isNull(exercise) && exercise != '')) {
            /* Sending  as the filter */
            const promises = [];
            const params = {
                classes: [sclass],
                chapters: [chapter],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
                exercise,
            };

            let chapter2 = chapter;
            if (chapter2 != null && chapter2 != '') {
                chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, '');
                chapter2 = chapter2.replace(/\s+/g, ' ');
            }
            console.log('chapter 2 ::: ', chapter2);

            const params2 = {
                classes: [sclass],
                chapters: [chapter2],
                subtopics: [],
                books: [],
                courses: [course],
                exams: [],
                study: [],
                levels: [],
                page_no,
                page_length,
                exercise,
            };

            promises.push(ChapterContainer.getDistClassesLocalised(locale_val, version, course, db));
            promises.push(ChapterContainer.getDistinctChapterLocalised(locale_val, version, course, sclass, db));
            promises.push(ChapterContainer.getDistExercisesLocalised(locale_val, version, course, sclass, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));
            promises.push(ChapterContainer.getDistChaptersOfContent('', version, 'NCERT', sclass, db));

            Promise.all(promises).then(async (result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const classes = result[0];
                    const data1 = [];
                    classes.forEach((values) => {
                        data1.push(values.class);
                    });
                    datas.push({
                        title: 'Classes',
                        name: 'class',
                        list: data1,
                    });
                }

                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const chapters = result[1];
                    const data1 = [];
                    const data2 = [];
                    // chapters.forEach(function (values) {
                    //   data1.push(values.chapter);
                    // });

                    // if (!_.isNull(result[6]) && result[6] !== undefined && result[6].length != 0) {
                    //   for(let i=0; i<result[6].length; i++)
                    //   {
                    //     if(data1.indexOf(result[6][i].chapter.toUpperCase()) == -1)
                    //     {
                    //       data1.push(result[6][i].chapter.toUpperCase());
                    //     }
                    //   }
                    // }

                    for (let i = 0; i < chapters.length; i++) {
                        const orderData = await QuestionContainer.getChapterOrder(sclass, chapters[i].chapter, db);
                        data1.push({ order: orderData[0].chapter_order, chapter: chapters[i].chapter });
                        data2.push(chapters[i].chapter.toUpperCase());
                    }

                    if (!_.isNull(result[6]) && result[6] !== undefined && result[6].length != 0) {
                        for (let i = 0; i < result[6].length; i++) {
                            if (data2.indexOf(result[6][i].chapter.toUpperCase()) == -1) {
                                data1.push({ order: result[6][i].order, chapter: result[6][i].chapter.toUpperCase() });
                            }
                        }
                    }

                    datas.push({
                        title: 'Chapters',
                        name: 'chapter',
                        list: data1,
                    });
                }

                if (!_.isNull(result[2]) && result[2] !== undefined) {
                    const exercises = result[2];
                    const data1 = [];
                    exercises.forEach((values) => {
                        data1.push(values.exercise);
                    });
                    datas.push({
                        title: 'Exercises',
                        name: 'exercise',
                        list: data1,
                    });
                }

                if (!_.isNull(result[3]) && result[3] !== undefined) {
                    const questions = result[3];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
                    content = result[5][0].content;
                    heading = result[5][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: {
                            course, class: sclass, chapters: chapter, exercise,
                        },
                        total_records: result[4][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        }
    }

    if (exam != undefined && !_.isNull(exam) && exam != '') {
        if (_.isNull(year) || year == '' || year == undefined) {
            const promises = [];
            const params = {
                classes: [],
                chapters: [],
                subtopics: [],
                books: [],
                courses: [],
                exams: [exam],
                study: [],
                levels: [],
                page_no,
                page_length,
            };

            promises.push(ChapterContainer.getDistYearsLocalised(version, exam, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const years = result[0];
                    const data1 = [];
                    years.forEach((values) => {
                        data1.push(values.year);
                    });
                    datas.push({
                        title: 'Years',
                        name: 'year',
                        list: data1,
                    });
                }
                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const questions = result[1];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                    content = result[3][0].content;
                    heading = result[3][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { exam },
                        total_records: result[2][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else if (!_.isNull(year) && year != '') {
            const promises = [];
            const params = {
                classes: [],
                chapters: [],
                subtopics: [],
                books: [],
                courses: [],
                exams: [exam],
                study: [],
                levels: [],
                page_no,
                page_length,
                year,
            };

            promises.push(ChapterContainer.getDistYearsLocalised(version, exam, db));
            promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
            promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const years = result[0];
                    const data1 = [];
                    years.forEach((values) => {
                        data1.push(values.year);
                    });
                    datas.push({
                        title: 'Years',
                        name: 'year',
                        list: data1,
                    });
                }
                if (!_.isNull(result[1]) && result[1] !== undefined) {
                    const questions = result[1];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
                }

                let content = '';
                let heading = '';

                if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                    content = result[3][0].content;
                    heading = result[3][0].heading;
                }

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
                        heading,
                        content,
                        active_filters: { exam, year },
                        total_records: result[2][0].total_records,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }).catch((err) => {
                next(err);

                // let responseData = {
                //
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": err
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        }
    }

    if (study != undefined && !_.isNull(study) && study != '') {
        if (study == 'RD SHARMA') {
            if ((_.isNull(sclass) && _.isNull(chapter)) || (sclass == '' && chapter == '') || (sclass == undefined) && (chapter == undefined)) {
                // console.log('RD normal');
                const promises = [];
                const params = {
                    classes: [],
                    chapters: [],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                promises.push(ChapterContainer.getDistClassesForStudyMaterialLocalised(version, study, db));
                promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
                promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
                promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const sclass = result[0];
                        const data1 = [];
                        sclass.forEach((values) => {
                            data1.push(values.class);
                        });
                        datas.push({
                            title: 'Classes',
                            name: 'sclass',
                            list: data1,
                        });
                    }

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const questions = result[1];
                        const data1 = [];
                        for (let i = 0; i < questions.length; i++) {
                            data1.push(questions[i]);
                        }
                        questions_list = data1;
                    }

                    let content = '';
                    let heading = '';

                    if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                        content = result[3][0].content;
                        heading = result[3][0].heading;
                    }

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
                            heading,
                            content,
                            active_filters: { study },
                            total_records: result[2][0].total_records,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                }).catch((err) => {
                    next(err);

                    // let responseData = {
                    //
                    //   "meta": {
                    //     "code": 403,
                    //     "success": false,
                    //     "message": "Error"
                    //   },
                    //   "data": null,
                    //   "error": err
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                });
            } else if ((!_.isNull(sclass) && _.isNull(chapter)) || (sclass != '' && chapter == '') || (sclass != undefined) && (chapter == undefined)) {
                const promises = [];
                const params = {
                    classes: [sclass],
                    chapters: [],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                promises.push(ChapterContainer.getDistClassesForStudyMaterialLocalised(version, study, db));
                promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, db));
                promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
                promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
                promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));
                promises.push(ChapterContainer.getDistChaptersOfContent('', version, 'RDS', sclass, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const sclass = result[0];
                        const data1 = [];
                        sclass.forEach((values) => {
                            data1.push(values.class);
                        });
                        datas.push({
                            title: 'Classes',
                            name: 'sclass',
                            list: data1,
                        });
                    }

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const chapter = result[1];
                        const data2 = [];
                        chapter.forEach((values) => {
                            data2.push(values.chapter);
                        });

                        if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
                            for (let i = 0; i < result[5].length; i++) {
                                if (data2.indexOf(result[5][i].chapter.toUpperCase()) == -1) {
                                    data2.push(result[5][i].chapter.toUpperCase());
                                }
                            }
                        }

                        datas.push({
                            title: 'Chapters',
                            name: 'chapter',
                            list: data2,
                        });
                    }

                    if (!_.isNull(result[2]) && result[2] !== undefined) {
                        const questions = result[2];
                        const data1 = [];
                        for (let i = 0; i < questions.length; i++) {
                            data1.push(questions[i]);
                        }
                        questions_list = data1;
                    }

                    let content = '';
                    let heading = '';

                    if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
                        content = result[4][0].content;
                        heading = result[4][0].heading;
                    }

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
                            heading,
                            content,
                            active_filters: { study, class: sclass },
                            total_records: result[3][0].total_records,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                }).catch((err) => {
                    next(err);

                    // let responseData = {
                    //
                    //   "meta": {
                    //     "code": 403,
                    //     "success": false,
                    //     "message": "Error"
                    //   },
                    //   "data": null,
                    //   "error": err
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                });
            } else if ((!_.isNull(sclass) && !_.isNull(chapter)) || (sclass != '' && chapter != '') || (sclass != undefined) && (chapter != undefined)) {
                const promises = [];
                const params = {
                    classes: [sclass],
                    chapters: [chapter],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                let chapter2 = chapter;
                if (chapter2 != null && chapter2 != '') {
                    chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, '');
                    chapter2 = chapter2.replace(/\s+/g, ' ');
                }
                console.log('chapter 2 ::: ', chapter2);

                const params2 = {
                    classes: [sclass],
                    chapters: [chapter2],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                promises.push(ChapterContainer.getDistClassesForStudyMaterialLocalised(version, study, db));
                promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, sclass, db));
                promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
                promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
                promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));
                promises.push(ChapterContainer.getDistChaptersOfContent('', version, 'RDS', sclass, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const sclass = result[0];
                        const data1 = [];
                        sclass.forEach((values) => {
                            data1.push(values.class);
                        });
                        datas.push({
                            title: 'Classes',
                            name: 'sclass',
                            list: data1,
                        });
                    }

                    const data2 = [];

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const chapter = result[1];
                        chapter.forEach((values) => {
                            data2.push(values.chapter);
                        });

                        if (!_.isNull(result[5]) && result[5] !== undefined && result[5].length != 0) {
                            for (let i = 0; i < result[5].length; i++) {
                                if (data2.indexOf(result[5][i].chapter.toUpperCase()) == -1) {
                                    data2.push(result[5][i].chapter.toUpperCase());
                                }
                            }
                        }

                        datas.push({
                            title: 'Chapters',
                            name: 'chapter',
                            list: data2,
                        });
                    }

                    if (!_.isNull(result[2]) && result[2] !== undefined) {
                        const questions = result[2];
                        const data1 = [];
                        for (let i = 0; i < questions.length; i++) {
                            data1.push(questions[i]);
                        }
                        questions_list = data1;
                    }
                    // else if(data2.indexOf(params.chapters[0]) != -1)
                    // {
                    //   questions_list = "coming soon";
                    // }

                    let content = '';
                    let heading = '';

                    if (!_.isNull(result[4]) && result[4] !== undefined && result[4].length != 0) {
                        content = result[4][0].content;
                        heading = result[4][0].heading;
                    }

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
                            heading,
                            content,
                            active_filters: { study, class: sclass, chapter },
                            total_records: result[3][0].total_records,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                }).catch((err) => {
                    next(err);

                    // let responseData = {
                    //
                    //   "meta": {
                    //     "code": 403,
                    //     "success": false,
                    //     "message": "Error"
                    //   },
                    //   "data": null,
                    //   "error": err
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                });
            }
        } else {
            // Other study than RD Sharma
            if (_.isNull(chapter) || chapter == '' || chapter == undefined) {
                const promises = [];
                const params = {
                    classes: [],
                    chapters: [],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, null, db));
                promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db));
                promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db));
                promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const chapter = result[0];
                        const data2 = [];
                        chapter.forEach((values) => {
                            data2.push(values.chapter);
                        });
                        datas.push({
                            title: 'Chapters',
                            name: 'chapter',
                            list: data2,
                        });
                    }

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const questions = result[1];
                        const data1 = [];
                        for (let i = 0; i < questions.length; i++) {
                            data1.push(questions[i]);
                        }
                        questions_list = data1;
                    }

                    let content = '';
                    let heading = '';

                    if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                        content = result[3][0].content;
                        heading = result[3][0].heading;
                    }

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
                            heading,
                            content,
                            active_filters: { study },
                            total_records: result[2][0].total_records,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                }).catch((err) => {
                    next(err);

                    // let responseData = {
                    //
                    //   "meta": {
                    //     "code": 403,
                    //     "success": false,
                    //     "message": "Error"
                    //   },
                    //   "data": null,
                    //   "error": err
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                });
            } else if (!_.isNull(chapter) || chapter != '' || chapter != undefined) {
                const promises = [];
                const params = {
                    classes: [],
                    chapters: [chapter],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                let chapter2 = chapter;
                if (chapter2 != null && chapter2 != '') {
                    chapter2 = chapter2.replace(/[^a-zA-Z0-9 ]/g, '');
                    chapter2 = chapter2.replace(/\s+/g, ' ');
                }
                console.log('chapter 2 ::: ', chapter2);

                const params2 = {
                    classes: [],
                    chapters: [chapter2],
                    subtopics: [],
                    books: [],
                    courses: [],
                    exams: [],
                    study: [study],
                    levels: [],
                    page_no,
                    page_length,
                };

                promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised(locale_val, version, study, null, db));
                promises.push(QuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params2, db));
                promises.push(QuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params2, db));
                promises.push(QuestionContainer.getPageContent(locale_val, version, params, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const chapter = result[0];
                        const data2 = [];
                        chapter.forEach((values) => {
                            data2.push(values.chapter);
                        });
                        datas.push({
                            title: 'Chapters',
                            name: 'chapter',
                            list: data2,
                        });
                    }

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const questions = result[1];
                        const data1 = [];
                        for (let i = 0; i < questions.length; i++) {
                            data1.push(questions[i]);
                        }
                        questions_list = data1;
                    }

                    let content = '';
                    let heading = '';

                    if (!_.isNull(result[3]) && result[3] !== undefined && result[3].length != 0) {
                        content = result[3][0].content;
                        heading = result[3][0].heading;
                    }

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
                            heading,
                            content,
                            active_filters: { study, chapter },
                            total_records: result[2][0].total_records,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                }).catch((err) => {
                    next(err);

                    // let responseData = {
                    //
                    //   "meta": {
                    //     "code": 403,
                    //     "success": false,
                    //     "message": "Error"
                    //   },
                    //   "data": null,
                    //   "error": err
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                });
            }
        }
    }
}

function getChapters(req, res, next) {
    db = req.app.get('db');
    const database = db.mysql.read;
    Question.getDistChapters('IIT', null, database).then((result) => {
        const chapters = [];
        result.forEach((value) => {
            chapters.push(value.chapter);
        });
        const responseData = {

            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: chapters,
        };
        res.status(responseData.meta.code).json(responseData);
    }).catch((err) => {
        next(err);

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": err
    // };
    // res.status(responseData.meta.code).json(responseData);
    });
}

function askExpert(req, res, next) {
    db = req.app.get('db');
    const { question_id } = req.body;
    const { student_id } = req.user;

    Student.isSubscribed(student_id, db.mysql.read).then((response) => {
        if (response.length > 0) {
            Question.updateQuestionCredit(question_id, db.mysql.write).then((result) => {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: 'Updated',
                };
                res.status(responseData.meta.code).json(responseData);
                Notification.askExpert(student_id, req.user.gcm_reg_id, question_id, null, db);
            }).catch((error) => {
                next(error);

                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error"
                //   },
                //   "data": null,
                //   "error": error
                // };
                // res.status(responseData.meta.code).json(responseData);
            });
        } else {
            const responseData = {

                meta: {
                    code: 403,
                    success: false,
                    message: 'Failure',
                },
                data: 'You are not Subscribed.',
            };
            res.status(responseData.meta.code).json(responseData);
        }
    }).catch((err) => {
        next(err);

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": err
    // };
    // res.status(responseData.meta.code).json(responseData);
    });
}

async function getPrefixSearch(req, res, next) {
    try {
        const { ocr_text } = req.body;
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        const results = await elasticSearchInstance.findByOcr(ocr_text);
        // console.log(results)
        const responseData = {

            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: results,

        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": e
    // };
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function updatePrefixSearch(req, res, next) {
    try {
        db = req.app.get('db');
        const { ocr_text } = req.body;
        const { qid } = req.body;
        let promises = [];
        // Update questions table
        promises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, qid));
        promises.push(Answer.getByAnswerId(qid, db.mysql.read));
        promises.push(Question.getFromQuestionsMetaByQuestionId(qid, db.mysql.read));

        let result = await Promise.all(promises);

        const question = result[0];
        const answer = result[1];
        const question_meta = result[2];

        const ques_obj = {
            student_id: req.user.student_id,
            class: question[0].class,
            subject: question[0].subject,
            book: question[0].book,
            chapter: question[0].chapter,
            question: question[0].question,
            doubt: question[0].doubt,
            is_allocated: question[0].is_allocated,
            allocated_to: 10000,
            allocation_time: question[0].allocation_time,
            is_answered: question[0].is_answered,
            is_text_answered: 1,
            ocr_done: question[0].ocr_done,
            ocr_text: question[0].ocr_text,
            original_ocr_text: ocr_text,
            matched_question: qid,
            question_credit: 1,
            is_trial: question[0].is_trial,
            is_skipped: question[0].is_skipped,
            parent_id: question[0].parent_id,
            incorrect_ocr: question[0].incorrect_ocr,
            skip_question: question[0].skip_question,
            locale: question[0].locale,
            difficulty: question[0].difficulty,
            is_community: 0,
        };

        const ans_obj = {
            expert_id: 10000,
            answer_video: answer[0].answer_video,
            is_approved: answer[0].is_approved,
            answer_rating: answer[0].answer_rating,
            answer_feedback: answer[0].answer_feedback,
            youtube_id: answer[0].youtube_id,
            duration: answer[0].duration,
            isDuplicate: answer[0].isDuplicate,
            review_expert_id: answer[0].review_expert_id,
            is_reviewed: answer[0].is_reviewed,
            is_positive_review: answer[0].is_positive_review,
            vdo_cipher_id: answer[0].vdo_cipher_id,
            is_vdo_ready: answer[0].is_vdo_ready,
        };

        const quesmeta_obj = {

            intern_id: 10004,
            assigned_to: '10004',
            class: question_meta[0].class,
            chapter: question_meta[0].chapter,
            subtopic: question_meta[0].subtopic,
            microconcept: question_meta[0].microconcept,
            level: question_meta[0].level,
            target_course: question_meta[0].target_course,
            package: question_meta[0].package,
            type: question_meta[0].type,
            q_options: question_meta[0].q_options,
            q_answer: question_meta[0].q_answer,
            diagram_type: question_meta[0].diagram_type,
            concept_type: question_meta[0].concept_type,
            chapter_type: question_meta[0].chapter_type,
            we_type: question_meta[0].we_type,
            ei_type: question_meta[0].ei_type,
            aptitude_type: question_meta[0].aptitude_type,
            pfs_type: question_meta[0].pfs_type,
            symbol_type: question_meta[0].symbol_type,
            doubtnut_recommended: question_meta[0].doubtnut_recommended,
            secondary_class: question_meta[0].secondary_class,
            secondary_chapter: question_meta[0].secondary_chapter,
            secondary_subtopic: question_meta[0].secondary_subtopic,
            secondary_microconcept: question_meta[0].secondary_microconcept,
            video_quality: question_meta[0].video_quality,
            audio_quality: question_meta[0].audio_quality,
            language: question_meta[0].language,
            ocr_quality: question_meta[0].ocr_quality,
            is_skipped: question_meta[0].is_skipped,
        };

        // console.log(question_meta);

        const quesResult = await Question.addQuestion(ques_obj, db.mysql.write);

        if (quesResult != undefined || quesResult != '') {
            ans_obj.question_id = quesResult.insertId;
            quesmeta_obj.question_id = quesResult.insertId;

            promises = [];
            result = [];
            promises.push(Answer.addSearchedAnswer(ans_obj, db.mysql.write));
            promises.push(Question.addSearchQuestionMeta(quesmeta_obj, db.mysql.write));

            result = await Promise.all(promises);
            const ansResult = result[0];
            const quesmetaResult = result[1];
            // console.log(quesmetaResult)

            if (ansResult && quesmetaResult) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: { question: question[0], answer: answer[0] },

                };
                res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
        next(e);

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error"
    //   },
    //   "data": null,
    //   "error": e
    // };
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function getChaptersByQid(req, res, next) {
    try {
        db = req.app.get('db');
        const { qid } = req.body;
        let promises = []; const datas = []; let
            container = [];
        let student_id;
        // Getting student id by question id

        promises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, qid));
        promises.push(QuestionContainer.getPackagesByQid(qid, db));
        promises.push(QuestionContainer.getClassandChapterFromMeta(qid, db));

        const quesres = await Promise.all(promises);

        const question = quesres[0];
        let ssclass; let sclass; let
            classFlag = false;
        if (question.length === 0) {
            ssclass = await QuestionContainer.getClassByQid(qid, 'questions_meta', db);
        } else if (question.length > 0) {
            student_id = question[0].student_id;
            if (student_id == 1 || student_id == 4 || student_id == 5 || student_id == 6 || student_id == 10 || student_id == 11 || student_id == 13 || student_id == 14 || student_id == 15 || student_id == 99) {
                // Get class from questions
                ssclass = question[0].class;
            } else {
                // Get class from Questions meta
                ssclass = await QuestionContainer.getClassByQid(qid, 'questions_meta', db);
                classFlag = true;
            }
        }

        if (ssclass.length === 0) {
            const responseData = {

                meta: {
                    code: 200,
                    success: true,
                    message: 'Class not found',
                },
                data: null,

            };
            res.status(responseData.meta.code).json(responseData);
        } else if (ssclass.length > 0) {
            if (classFlag) {
                ssclass = ssclass[0].class;
            }

            const packages = quesres[1];

            let questions;
            promises = [];
            // console.log("classandchapter=");
            // console.log(quesres[2]);
            if (quesres[2].length > 0) {
                if (quesres[2][0].class != null && quesres[2][0].class != '' && quesres[2][0].class != 'Skip') {
                    if (quesres[2][0].chapter != null && quesres[2][0].chapter != '' && quesres[2][0].chapter != 'Skip') {
                        questions = await QuestionContainer.getMicroconceptsBySubtopics(quesres[2][0].class, quesres[2][0].chapter, db);
                    } else {
                        questions = await QuestionContainer.getMicroconceptsBySubtopics(quesres[2][0].class, question[0].chapter, db);
                    }
                } else if (quesres[2][0].chapter != null && quesres[2][0].chapter != '' && quesres[2][0].chapter != 'Skip') {
                    questions = await QuestionContainer.getMicroconceptsBySubtopics(ssclass, quesres[2][0].chapter, db);
                } else {
                    questions = await QuestionContainer.getMicroconceptsBySubtopics(ssclass, question[0].chapter, db);
                }
            } else {
                questions = await QuestionContainer.getMicroconceptsBySubtopics(ssclass, question[0].chapter, db);
            }

            // console.log("PREVIOUS resolving quesvalue==");
            // console.log(questions)
            // console.log("promises array==");
            // console.log(promises)

            /// /console.log("just after resolving quesvalue==");//console.log(questions)
            promises = [];
            // Pushing all promises
            for (let i = 0; i < packages.length; i++) {
                if (packages[i].packages == 'NCERT') {
                    promises.push(QuestionContainer.getDistChapters('NCERT', ssclass, db));
                } else if (packages[i].packages == 'IIT JEE PREVIOUS YEAR') {
                    promises.push(QuestionContainer.getDistChapters('IIT', null, db));// here parameter corrected
                } else if (packages[i].packages == 'BANSAL') {
                    promises.push(ChapterContainer.getDistChaptersForStudyMaterial('BANSAL', null, db));
                } else if (packages[i].packages == 'XII BOARDS PREVIOUS YEAR') {
                    promises.push(ChapterContainer.getDistYears('XII Boards', db));
                } else if (packages[i].packages == 'X BOARDS') {
                    promises.push(ChapterContainer.getDistYears('X Boards', db));
                } else if (packages[i].packages == 'JEE ADVANCED PREVIOUS YEAR') {
                    promises.push(ChapterContainer.getDistYears('Jee Advanced', db));
                } else if (packages[i].packages == 'JEE MAINS PREVIOUS YEAR') {
                    promises.push(ChapterContainer.getDistYears('Jee Mains', db));
                } else if (packages[i].packages == 'RD SHARMA') {
                    promises.push(ChapterContainer.getDistChaptersForStudyMaterial('RD SHARMA', ssclass, db));
                } else if (packages[i].packages == 'CENGAGE') {
                    promises.push(ChapterContainer.getDistChaptersForStudyMaterial('CENGAGE', null, db));
                } else {
                    promises.push(QuestionContainer.getDistChapters('NCERT', ssclass, db));
                }
            }

            const result = await Promise.all(promises);
            // Making response
            for (let i = 0; i < packages.length; i++) {
                if (packages[i].packages == 'NCERT') {
                    result[i].forEach((item) => {
                        container.push(item.chapter);
                    });
                    datas.push({ package: 'NCERT', type: 'chapter', data: container });
                } else if (packages[i].packages == 'IIT JEE PREVIOUS YEAR') {
                    result[i].forEach((item) => {
                        container.push(item.chapter);
                    });
                    datas.push({ package: 'IIT JEE PREVIOUS YEAR', type: 'chapter', data: container });
                } else if (packages[i].packages == 'BANSAL') {
                    result[i].forEach((item) => {
                        container.push(item.chapter);
                    });
                    datas.push({ package: 'BANSAL', type: 'chapter', data: container });
                } else if (packages[i].packages == 'XII BOARDS PREVIOUS YEAR') {
                    result[i].forEach((item) => {
                        container.push(item.year);
                    });
                    datas.push({ package: 'XII BOARDS PREVIOUS YEAR', type: 'year', data: container });
                } else if (packages[i].packages == 'X BOARDS') {
                    result[i].forEach((item) => {
                        container.push(item.year);
                    });
                    datas.push({ package: 'X BOARDS', type: 'year', data: container });
                } else if (packages[i].packages == 'JEE ADVANCED PREVIOUS YEAR') {
                    result[i].forEach((item) => {
                        container.push(item.year);
                    });
                    datas.push({ package: 'JEE ADVANCED PREVIOUS YEAR', type: 'year', data: container });
                } else if (packages[i].packages == 'JEE MAINS PREVIOUS YEAR') {
                    result[i].forEach((item) => {
                        container.push(item.year);
                    });
                    datas.push({ package: 'JEE MAINS PREVIOUS YEAR', type: 'year', data: container });
                } else if (packages[i].packages == 'RD SHARMA') {
                    result[i].forEach((item) => {
                        container.push(item.chapter);
                    });
                    datas.push({ package: 'RD SHARMA', type: 'chapter', data: container });
                } else if (packages[i].packages == 'CENGAGE') {
                    result[i].forEach((item) => {
                        container.push(item.chapter);
                    });
                    datas.push({ package: 'CENGAGE', type: 'chapter', data: container });
                } else {
                    result[i].forEach((item) => {
                        container.push(item.chapter);
                    });
                    datas.push({ package: packages[i].packages, type: 'chapter', data: container });
                }
                container = [];
            }

            // console.log("packages==");
            // console.log(packages);

            // console.log("questions==");
            // console.log(questions);

            // console.log("datas==");
            // console.log(datas);

            datas.push({ type: 'microconcept', data: [] });

            for (let i = 0; i < questions.length; i++) {
                let available_flag = false;
                datas[packages.length].data.forEach((item) => {
                    if (item.subtopic == questions[i].subtopic) {
                        item.data.push(questions[i]);
                        available_flag = true;
                    }
                });
                if (!available_flag) {
                    datas[packages.length].data.push({ subtopic: questions[i].subtopic, data: [questions[i]] });
                }
            }

            const responseData = {

                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: datas,

            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error",
    //     "error": e
    //   },
    //   "data": null,
    //
    // };
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function getMostWatchedUsers(req, res, next) {
    try {
        db = req.app.get('db');
        const promises = []; const
            datas = [];
        const { student_id } = req.user;

        promises.push(Question.getMostWatchedVideoCountBySid(student_id, db.mysql.read));
        promises.push(Question.getTodayMostWatchedStudents(db.mysql.read));
        promises.push(Question.getLastdayWinners(db.mysql.read));
        promises.push(Question.getContestDetails(db.mysql.read));

        const result = await Promise.all(promises);
        const user = {};

        if (req.user.student_fname === '' || req.user.student_fname == 'undefined') user.student_fname = null;
        else user.student_fname = req.user.student_fname;

        user.student_username = req.user.student_username;

        if (req.user.img_url === '' || req.user.img_url == 'undefined') user.profile_image = null;
        else user.profile_image = req.user.img_url;

        user.student_id = student_id;

        if (result[0].length == 0) {
            user.video_count = 0;
            user.total_engagement_time = 0;
        } else {
            user.video_count = result[0][0].video_count;
            user.total_engagement_time = result[0][0].total_engagement_time;
        }

        const contest = result[3];
        const contest_details = {};
        contest_details.winners = '';
        contest_details.prize_money = '';
        contest_details.rules = [];
        // console.log(contest)
        for (let i = 0; i < contest.length; i++) {
            if (contest[i].entity_type == 'winners') {
                contest_details.winners = contest[i].description;
            } else if (contest[i].entity_type == 'prize_money') {
                contest_details.prize_money = contest[i].description;
            } else if (contest[i].entity_type == 'rules') {
                contest_details.rules.push(contest[i].description);
            }
        }

        const responseData = {

            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                user_details: user,
                today_users: result[1],
                last_day_users: result[2],
                contest_details,
            },

        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData = {
    //
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //
    // };
    // res.status(responseData.meta.code).json(responseData);
    }
}

async function jeeMains2019Answers(req, res, next) {
    db = req.app.get('db');
    const database = db;
    const promises = []; let
        datas = '';

    try {
        const date_val = req.body.date;
        const { shift } = req.body;
        const { page } = req.body;
        let flag = 0;

        promises.push(ChapterContainer.getDistYears(req.body.exam, database));
        promises.push(QuestionContainer.getDistinctDateAnswer(database));

        if (date_val != undefined && !_.isNull(date_val) && date_val != '') {
            promises.push(QuestionContainer.getDistinctShiftAnswer(date_val, database));
            flag = 2;
            if (shift != undefined && !_.isNull(shift) && shift != '') {
                promises.push(QuestionContainer.getJM2019QuestionsAnswer(date_val, shift, page, database));
                promises.push(QuestionContainer.getJM2019QuestionsTotalCountAnswer(date_val, shift, database));
            } else {
                promises.push(QuestionContainer.getJM2019QuestionsAnswer(date_val, '', page, database));
                promises.push(QuestionContainer.getJM2019QuestionsTotalCountAnswer(date_val, '', database));
            }
        } else {
            promises.push(QuestionContainer.getJM2019QuestionsAnswer('', '', page, database));
            promises.push(QuestionContainer.getJM2019QuestionsTotalCountAnswer('', '', database));
            flag = 1;
        }

        const result = await Promise.all(promises);

        if (flag == 1) {
            datas = {
                year_list: result[0],
                date_list: result[1],
                question_list: result[2],
                total_count: result[3][0].total_records,
            };
        } else if (flag == 2) {
            datas = {
                year_list: result[0],
                date_list: result[1],
                shift_list: result[2],
                question_list: result[3],
                total_count: result[4][0].total_records,
            };
        }

        const responseData = {

            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: datas,

        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
    // console.log(e)
        const responseData = {

            meta: {
                code: 403,
                success: false,
                message: 'Error from catch block',
            },
            data: null,

        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function microConcept(req, res, next) {
    try {
        db = req.app.get('db');
        const promises = []; let
            datas = {};

        const { class_id } = req.body;
        const { course } = req.body;
        const { chapter } = req.body;
        const { subtopic } = req.body;
        const { page } = req.body;

        promises.push(QuestionContainer.distMicroClasses(db));
        promises.push(QuestionContainer.microQuestions(class_id, course, chapter, subtopic, page, db));
        promises.push(QuestionContainer.microQuestionsCount(class_id, course, chapter, subtopic, db));

        let flag = 0;
        if (class_id != undefined && !_.isNull(class_id) && class_id != '') {
            flag++;
            promises.push(QuestionContainer.distMicroCourses(class_id, db));
            if (course != undefined && !_.isNull(course) && course != '') {
                flag++;
                promises.push(QuestionContainer.distMicroChapters(class_id, course, db));
                if (chapter != undefined && !_.isNull(chapter) && chapter != '') {
                    flag++;
                    promises.push(QuestionContainer.distMicroSubtopics(class_id, course, chapter, db));
                }
            }
        }

        const result = await Promise.all(promises);

        if (flag == 0) {
            datas = { class_list: result[0], question_list: result[1], total_count: result[2][0].total_records };
        }
        if (flag == 1) {
            datas = {
                class_list: result[0],
                course_list: result[3],
                question_list: result[1],
                total_count: result[2][0].total_records,
            };
        } else if (flag == 2) {
            datas = {
                class_list: result[0],
                course_list: result[3],
                chapter_list: result[4],
                question_list: result[1],
                total_count: result[2][0].total_records,
            };
        } else if (flag == 3) {
            datas = {
                class_list: result[0],
                course_list: result[3],
                chapter_list: result[4],
                subtopic_list: result[5],
                question_list: result[1],
                total_count: result[2][0].total_records,
            };
        }

        const responseData = {

            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: datas,

        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
    // console.log(e)
        const responseData = {

            meta: {
                code: 403,
                success: false,
                message: 'Error from catch block',
            },
            data: null,

        };
        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    ask,
    getQuestionDetailsByTag,
    filter,
    getChapters,
    askExpert,
    getPrefixSearch,
    updatePrefixSearch,
    getChaptersByQid,
    getMostWatchedUsers,
    jeeMains2019Answers,
    microConcept,
};
