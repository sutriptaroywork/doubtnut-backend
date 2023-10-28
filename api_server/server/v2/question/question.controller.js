/* eslint-disable no-loop-func */
/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-16 14:05:31
*/

// eslint-disable-next-line import/no-extraneous-dependencies
const uuidv4 = require('uuid/v4');
const fuzz = require('fuzzball');
const moment = require('moment');
const fs = require('fs');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const _ = require('lodash');
const mathsteps = require('mathsteps');

// const questionLog = mongoose.model('question_logs_user');

const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const Utility = require('../../../modules/utility');
const Student = require('../../../modules/student');
const Localised = require('../../../modules/language');
const Notification = require('../../../modules/notifications');
const Constant = require('../../../modules/constants');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionRedis = require('../../../modules/redis/question');
const ChapterContainer = require('../../../modules/containers/chapter');
const LanguageContainer = require('../../../modules/containers/language');
const AppConfigurationContainer = require('../../../modules/containers/appConfig');
const QuestionMetaContainer = require('../../../modules/containers/questionsMeta');
const QuestionSql = require('../../../modules/mysql/question');
// const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const responseSchema = require('../../../responseModels/question/v2/question');
const statsMysql = require('../../../modules/mysql/stats');
const staticData = require('../../../data/data');
const Data = require('../../../data/data');
const liveclassData = require('../../../data/liveclass.data');
const QuestionHelper = require('../../helpers/question.helper');
// const QuestionLog = require('../../../modules/mongo/questionAskUser');
const QuestionAskModel = require('../../../modules/mongo/questionAskUser');
const bl = require('../../v9/question/question.bl');
const answerBl = require('../../v11/answer/answer.bl');
const MongoQuestionAskUser = require('../../../modules/mongo/questionAskUser');
const telemetry = require('../../../config/telemetry');
const AnswerMysql = require('../../../modules/mysql/answer');
const Answer_Container_v13 = require('../../v13/answer/answer.container');
const StudentRedis = require('../../../modules/redis/student');
const { TydSuggestions } = require('../../v1/search/search.helper');


bluebird.promisifyAll(fs);
bluebird.promisifyAll(mongoose);

const QuestionAsk = QuestionAskModel.QuestionLogModel;

let db; let elasticSearchInstance; let elasticSearchTestInstance;
let config; let blobService;

async function getQuestionDetailsByTag(req, res, next) {
    db = req.app.get('db');
    const count = 100;
    const { page } = req.body;
    const tag_data = req.body.tag_data_obj;
    // eslint-disable-next-line no-eval
    const tag_data_obj = eval(`(${tag_data})`);
    // let questions_data = {};
    let str = '';
    const { locale } = req.user;
    let language = 'english';
    const lang = await LanguageContainer.getByCode(locale, db);
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
    // const sqs = req.app.get('sqs');
    const { questionInitSnsUrl, userQuestionSnsUrl } = Data;
    config = req.app.get('config');
    try {
        const translate2 = req.app.get('translate2');
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

        let matches_array;
        let languages_obj;
        let ocr_text;
        let handwritten = 0;
        const index = ['doubtnut_new', 'doubtnut_new', 'doubtnut_new', 'doubtnut_new'];

        let st_lang_code;
        const filedToUpdate = {};
        let promises = [];
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
        const languages_arrays = resolvedPromises[1];
        const isStringDiffActive = resolvedPromises[2].apply_string_diff;
        const isAbTestingActive = resolvedPromises[2].ab_testing_question_ask;
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
        let ocr;
        let ocr_type;
        let ocr_data;

        if (qid) {
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
                // //console.log(question_image);
                question_image = question_image.replace(/^data:([A-Za-z-+/]+);base64,/, '');

                const fileName = `upload_${qid}_${moment().unix()}${extension}`;
                const buf = Buffer.from(question_image, 'base64');

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
                // console.log(ocr_data)
                // return res.send(ocr_data)
                ocr = ocr_data.ocr;
                ocr_type = ocr_data.ocr_type;
                handwritten = ocr_data.handwritten;
                locale = ocr_data.locale;
                // ocr = Utility.replaceSpecialSymbol2(ocr)
                filedToUpdate.ocr_done = 1;
                filedToUpdate.ocr_text = ocr;
                filedToUpdate.original_ocr_text = ocr;
                filedToUpdate.locale = locale;
                insertedQuestion.ocr_done = 1;
                insertedQuestion.ocr_text = ocr;
                insertedQuestion.original_ocr_text = ocr;
                insertedQuestion.locale = locale;

                promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write));
                promises.push(elasticSearchInstance.findByOcrUsingIndex(ocr, index[ocr_type]));
                ocr_text = ocr;
                Utility.deleteImage(`${publicPath}/uploads/${fileName}`, fs);
            } else if (typeof question_text !== 'undefined' && question_text.length > 0) {
                // question text
                if (locale !== 'en' && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
                    const transLateApiResp = await Utility.translateApi(question_text);
                    if (transLateApiResp.length > 0) {
                        question_text = transLateApiResp.text;
                    }
                }

                // question_text = Utility.replaceSpecialSymbol(question_text)
                filedToUpdate.ocr_done = 1;
                filedToUpdate.ocr_text = question_text;
                filedToUpdate.original_ocr_text = question_text;
                filedToUpdate.locale = locale;
                insertedQuestion.ocr_done = 1;
                insertedQuestion.ocr_text = question_text;
                insertedQuestion.original_ocr_text = question_text;
                insertedQuestion.locale = locale;
                promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write));
                promises.push(elasticSearchInstance.findByOcr(question_text));
                ocr_text = question_text;
                ocr_data = {
                    ocr: question_text, ocr_type: -1, handwritten, locale,
                };
            }
            // languages_arrays = await Localised.getList(db.mysql.read);
            await QuestionRedis.setPreviousHistory(student_id, [{ question_id: qid, ocr_text }], db.redis.write);
            languages_obj = Utility.getLanguageObject(languages_arrays);
            Promise.all(promises).then((values) => {
                // if (strpos($responseArray['latex'], 'begin{array}') === false) {
                //   $body = str_replace(" ", "", $body);
                // }
                if (values[1]) {
                    const promises1 = [];
                    // Student.getStudentLocale(student_id, db.mysql.read).then((studentResponse) => {
                    // //console.log("studentResponse")
                    // //console.log(studentResponse)
                    st_lang_code = req.user.locale;
                    // //console.log('st_lang_code');

                    // //console.log(st_lang_code);
                    let language = languages_obj[st_lang_code];
                    // //console.log("language");
                    // //console.log(language)
                    if (typeof language === 'undefined') {
                        language = 'english';
                    }
                    matches_array = values[1].hits.hits;

                    // notification start -----------------------------------------------  on check of asked first question   -----------------------  //
                    if (isStringDiffActive == 1 && locale === 'en') {
                        matches_array = Utility.stringDiffImplement(matches_array, ocr_text, fuzz);
                        if (matches_array.length > 0) {
                            ocr_data.string_diff = matches_array[0].partial_score;
                            // set info in redis
                            // await QuestionRedis.setQuestionAskMeta(qid,ocr_data,db.redis.write)
                        }
                    }
                    if (language !== 'english') {
                        for (let i = 0; i < values[1].hits.hits.length; i++) {
                            // //console.log(values[1]['hits']['hits'][i]['_id'])
                            promises1.push(Localised.changeLanguage(values[1].hits.hits[i]._id, language, db.mysql.read));
                        }
                    }
                    Promise.all(promises1).then(async (results) => {
                        for (let i = 0; i < results.length; i++) {
                            if ((typeof results[i] !== 'undefined') && results[i].length > 0) {
                                values[1].hits.hits[i]._source.ocr_text = results[i][0][language];
                            }
                        }

                        // db.redis.read.publish("notification_service",JSON.stringify({type:"question_ask",student_id:student_id,gcm_id:req.user.gcm_reg_id}))

                        const promises3 = [];
                        let is_subscribed = 0;
                        for (let i = 0; i < matches_array.length; i++) {
                            promises3.push(QuestionMetaContainer.getQuestionMeta(matches_array[i]._id, db));
                        }
                        promises3.push(Student.isSubscribed(student_id, db.mysql.read));
                        Promise.all(promises3).then((values1) => {
                            // //console.log(values);
                            for (let i = 0; i < values1.length; i++) {
                                // //console.log('check me')
                                // //console.log(matches_array[1]['_id'])
                                // //console.log(values[1][0]['class'])
                                if (i == (values1.length - 1)) {
                                    if ((values1[i].length == 1) && values1[i][0].student_id == student_id) {
                                        is_subscribed = 1;
                                    }
                                } else {
                                    if (values1[i].length > 0) {
                                        matches_array[i].class = values1[i][0].class;
                                        matches_array[i].chapter = values1[i][0].chapter;
                                        matches_array[i].difficulty_level = values1[i][0].level;
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
                                        event: 'video',
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
                                    actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                                    verb: 'ASKED',
                                    object: '',
                                    object_id: qid,
                                    object_type: 'QUESTION',
                                    target_id: '',
                                    target_type: '',
                                    target: '',
                                }));
                                db.redis.read.publish('clevertap_profile_service', JSON.stringify({
                                    type: 'latest_question',
                                    question_id: qid,
                                    student_id: req.user.student_id,
                                }));
                                // //console.log(error)
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: 'SUCCESS!',
                                    },
                                    data: {
                                        question_id: qid,
                                        ocr_text: filedToUpdate.ocr_text,
                                        question_image: `${config.blob_url}q-images/${filedToUpdate.question_image}`,
                                        // "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
                                        matched_questions: matches_array,
                                        matched_count: matches_array.length,
                                        is_subscribed,
                                        notification: n_data,
                                    },
                                };
                                if (typeof filedToUpdate.question_image === 'undefined') {
                                    responseData.data.question_image = null;
                                }
                                res.status(responseData.meta.code).json(responseData);
                                // const data = {
                                //     action: 'ASK_FROM_APP',
                                //     data: insertedQuestion,
                                //     uuid: uuidv4(),
                                //     timestamp: Utility.getCurrentTimeInIST(),
                                // };
                                // Utility.logEntry(sns, config.question_ask_sns, data);
                            }).catch((error) => {
                                console.log(error);
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: 'SUCCESS!',
                                    },
                                    data: {
                                        question_id: qid,
                                        question_image: `${config.blob_url}q-images/${filedToUpdate.question_image}`,
                                        // "question_image": config.cdn_url + "images/" + filedToUpdate['question_image'],
                                        matched_questions: matches_array,
                                        matched_count: matches_array.length,
                                        is_subscribed,
                                        notification: n_data,

                                    },
                                };
                                if (typeof filedToUpdate.question_image === 'undefined') {
                                    responseData.data.question_image = null;
                                }
                                res.status(responseData.meta.code).json(responseData);
                                // const data = {
                                //     action: 'ASK_FROM_APP',
                                //     data: insertedQuestion,
                                //     uuid: uuidv4(),
                                //     timestamp: Utility.getCurrentTimeInIST(),
                                // };
                                // Utility.logEntry(sns, config.question_ask_sns, data);
                            });
                        }).catch((error) => {
                            // console.log(error);
                            // const data = {
                            //     action: 'ASK_FROM_APP',
                            //     data: insertedQuestion,
                            //     uuid: uuidv4(),
                            //     timestamp: Utility.getCurrentTimeInIST(),
                            // };
                            // Utility.logEntry(sns, config.question_ask_sns, data);
                            next(error);
                        });
                    }).catch((error) => {
                        // console.log(error)
                        // const data = {
                        //     action: 'ASK_FROM_APP',
                        //     data: insertedQuestion,
                        //     uuid: uuidv4(),
                        //     timestamp: Utility.getCurrentTimeInIST(),
                        // };
                        // Utility.logEntry(sns, config.question_ask_sns, data);
                        next(error);

                        // let responseData = {
                        //   "meta": {
                        //     "code": 403,
                        //     "success": false,
                        //     "message": "Error in search localisation"
                        //   },
                        //   "error": error
                        // }
                        // res.status(responseData.meta.code).json(responseData);
                    });
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Error in search matches!',
                        },
                        data: null,
                        error: null,
                    };
                    res.status(responseData.meta.code).json(responseData);
                    // const data = {
                    //     action: 'ASK_FROM_APP',
                    //     data: insertedQuestion,
                    //     uuid: uuidv4(),
                    //     timestamp: Utility.getCurrentTimeInIST(),
                    // };
                    // Utility.logEntry(sns, config.question_ask_sns, data);
                }
            }).catch((error) => {
                // console.log(error);
                // const data = {
                //     action: 'ASK_FROM_APP',
                //     data: insertedQuestion,
                //     uuid: uuidv4(),
                //     timestamp: Utility.getCurrentTimeInIST(),
                // };
                // Utility.logEntry(sns, config.question_ask_sns, data);
                next(error);

                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error in updating or searching matches"
                //   },
                //   "data": null,
                //   "error": error
                // }
                // res.status(responseData.meta.code).json(responseData);
            });
        } else {
            // no qid ,problem in insertion
            // throw error
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Error in inserting question;Please check parameters',
                },
                data: null,
                error: null,
            };
            res.status(responseData.meta.code).json(responseData);
            // const data = {
            //     action: 'ASK_FROM_APP',
            //     data: insertedQuestion,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.question_ask_sns, data);
        }
    } catch (e) {
        // const data = {
        //     action: 'ASK_FROM_APP',
        //     data: insertedQuestion,
        //     uuid: uuidv4(),
        // };
        // Utility.logEntry(sns, config.question_ask_sns, data);
        next(e);

        // //console.log("error");
        // //console.log(e)
        // let responseData = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error from catch block"
        //   },
        //   "data": null,
        //   "error": e
        // }
        // res.status(responseData.meta.code).json(responseData);
    }
}

async function filter(req, res, next) {
    db = req.app.get('db');
    // eslint-disable-next-line no-eval
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
    const datas = [];
    let questions_list = [];

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
            promises.push(ChapterContainer.getDistinctChapter(course, null, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            promises.push(ChapterContainer.getDistinctChapter(course, null, db));
            promises.push(ChapterContainer.getDistSubtopics(course, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
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
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            promises.push(ChapterContainer.getDistinctChapter(course, null, db));
            promises.push(ChapterContainer.getDistSubtopics(course, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
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
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            promises.push(ChapterContainer.getDistClasses(course, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            promises.push(ChapterContainer.getDistClasses(course, db));
            promises.push(ChapterContainer.getDistinctChapter(course, sclass, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
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
                    const chapters = result[1];
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

                if (!_.isNull(result[2]) && result[2] !== undefined) {
                    const questions = result[2];
                    const data1 = [];
                    for (let i = 0; i < questions.length; i++) {
                        data1.push(questions[i]);
                    }
                    questions_list = data1;
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
            // console.log("course, class, chapter");
            promises.push(ChapterContainer.getDistClasses(course, db));
            promises.push(ChapterContainer.getDistinctChapter(course, sclass, db));
            promises.push(ChapterContainer.getDistExercises(course, sclass, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
            Promise.all(promises).then((result) => {
                // console.log("resulttttttttttttttttttttttttttt")
                // console.log(result)
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
                    chapters.forEach((values) => {
                        data1.push(values.chapter);
                    });
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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            promises.push(ChapterContainer.getDistClasses(course, db));
            promises.push(ChapterContainer.getDistinctChapter(course, sclass, db));
            promises.push(ChapterContainer.getDistExercises(course, sclass, chapter, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));
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
                    const chapters = result[1];
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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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

            promises.push(ChapterContainer.getDistYears(exam, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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

            promises.push(ChapterContainer.getDistYears(exam, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            if ((_.isNull(sclass) && _.isNull(chapter)) || (sclass == '' && chapter == '') || (sclass == undefined && chapter == undefined)) {
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

                promises.push(ChapterContainer.getDistClassesForStudyMaterial(study, db));
                promises.push(QuestionContainer.getFilteredQuestions(params, db));
                promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const sclass1 = result[0];
                        const data1 = [];
                        sclass1.forEach((values) => {
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

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
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
            } else if ((!_.isNull(sclass) && _.isNull(chapter)) || (sclass != '' && chapter == '') || (sclass != undefined && chapter == undefined)) {
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

                promises.push(ChapterContainer.getDistClassesForStudyMaterial(study, db));
                promises.push(ChapterContainer.getDistChaptersForStudyMaterial(study, sclass, db));
                promises.push(QuestionContainer.getFilteredQuestions(params, db));
                promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const sclass1 = result[0];
                        const data1 = [];
                        sclass1.forEach((values) => {
                            data1.push(values.class);
                        });
                        datas.push({
                            title: 'Classes',
                            name: 'sclass',
                            list: data1,
                        });
                    }

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const chapter1 = result[1];
                        const data2 = [];
                        chapter1.forEach((values) => {
                            data2.push(values.chapter);
                        });
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

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
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
            } else if ((!_.isNull(sclass) && !_.isNull(chapter)) || (sclass != '' && chapter != '') || (sclass != undefined && chapter != undefined)) {
                // console.log(chapter);
                const promises = [];
                // let code=await ChapterContainer.getCodeByChapter(chapter,db);
                // let fix = (code.length > 0) ? code[0]['code'] : []
                // //console.log(fix);
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

                promises.push(ChapterContainer.getDistClassesForStudyMaterial(study, db));
                promises.push(ChapterContainer.getDistChaptersForStudyMaterial(study, sclass, db));
                promises.push(QuestionContainer.getFilteredQuestions(params, db));
                promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

                Promise.all(promises).then((result) => {
                    if (!_.isNull(result[0]) && result[0] !== undefined) {
                        const sclass1 = result[0];
                        const data1 = [];
                        sclass1.forEach((values) => {
                            data1.push(values.class);
                        });
                        datas.push({
                            title: 'Classes',
                            name: 'sclass',
                            list: data1,
                        });
                    }

                    if (!_.isNull(result[1]) && result[1] !== undefined) {
                        const chapter1 = result[1];
                        const data2 = [];
                        chapter1.forEach((values) => {
                            data2.push(values.chapter);
                        });
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

                    const responseData = {

                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: {
                            filters: datas,
                            questions_list,
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
        } else if (_.isNull(chapter) || chapter == '' || chapter == undefined) {
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

            promises.push(ChapterContainer.getDistChaptersForStudyMaterial(study, null, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const chapter1 = result[0];
                    const data2 = [];
                    chapter1.forEach((values) => {
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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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

            promises.push(ChapterContainer.getDistChaptersForStudyMaterial(study, null, db));
            promises.push(QuestionContainer.getFilteredQuestions(params, db));
            promises.push(QuestionContainer.getTotalQuestionsCount(params, db));

            Promise.all(promises).then((result) => {
                if (!_.isNull(result[0]) && result[0] !== undefined) {
                    const chapter1 = result[0];
                    const data2 = [];
                    chapter1.forEach((values) => {
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

                const responseData = {

                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: {
                        filters: datas,
                        questions_list,
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
            Question.updateQuestionCredit(question_id, db.mysql.write).then(() => {
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
        const results = await elasticSearchInstance.findByOcr(ocr_text, 1);
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
    let ques_obj;
    const sns = req.app.get('sns');
    // const sqs = req.app.get('sqs');
    const { questionInitSnsUrl, userQuestionSnsUrl } = Data;
    const uuid = uuidv4();
    config = req.app.get('config');
    try {
        db = req.app.get('db');
        const { ocr_text } = req.body;
        const { qid } = req.body;

        let voiceSearch = 0;
        let ans_obj; let
            ansResult;
        if (req.body.is_voice_search != undefined && req.body.is_voice_search == 1) {
            voiceSearch = 1;
        }
        const web_udid = req.body.udid;
        let { student_id } = req.user;
        let doubt = req.body.question;

        const promises = [];
        promises.push(Question.getByQuestionId(qid, db.mysql.read));
        promises.push(Answer.getByAnswerId(qid, db.mysql.read));
        promises.push(StudentRedis.getUserTydSuggestionsVersion(db.redis.read, student_id, Data.tyd_version_redis_key));

        const result = await Promise.all(promises);

        const question = result[0];
        const answer = result[1];
        const iterationVersion = result[2];
        let isVideoSolution;
        if (question.length && question[0].is_answered) {
            isVideoSolution = !!(question[0].is_answered);
        }
        if (web_udid && doubt) {
            student_id = await QuestionHelper.getStudentIdFromUdid(db, web_udid);
            doubt = req.body.question;
        } else {
            doubt = question[0].doubt;
        }
        ques_obj = {
            student_id,
            class: question[0].class,
            subject: question[0].subject,
            book: question[0].book,
            chapter: question[0].chapter,
            question: iterationVersion || question[0].question,
            doubt,
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
            locale: TydSuggestions.getQueryOcrLocale({ checkQuestionLocale: true }, ocr_text, question[0].locale) || question[0].locale,
            difficulty: question[0].difficulty,
            is_community: 0,
        };

        if (isVideoSolution) {
            ans_obj = {
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
        } else {
            ans_obj = {};
        }
        const quesResult = await Question.addQuestionAliasedTable(ques_obj, db.mysql.write);
        if (quesResult != undefined || quesResult != '') {
            if (voiceSearch) {
                Question.addVoiceSearchQuestion(db.mysql.write, { question_id: quesResult.insertId });
            }
            QuestionHelper.sendSnsMessage({
                type: 'question-init',
                sns,
                uuid,
                qid: quesResult.insertId,
                studentId: student_id,
                studentClass: req.user.student_class,
                subject: question[0].subject,
                chapter: question[0].chapter,
                version: question[0].question,
                ques: question[0].doubt,
                locale: TydSuggestions.getQueryOcrLocale({ checkQuestionLocale: true }, ocr_text, question[0].locale) || question[0].locale,
                UtilityModule: Utility,
                questionInitSnsUrl,
                config,
            });
            ans_obj.question_id = quesResult.insertId;
            ques_obj.question_id = quesResult.insertId;

            if (isVideoSolution) {
                ansResult = await Answer.addSearchedAnswer(ans_obj, db.mysql.write);
            } else {
                ansResult = true;
            }
            const answerResponse = typeof answer[0] !== undefined ? answer[0] : {};

            if (ansResult) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: { question: question[0], answer: answerResponse },

                };
                res.status(responseData.meta.code).json(responseData);
                QuestionHelper.sendSnsMessage({
                    type: 'user-questions',
                    sns,
                    uuid,
                    qid: quesResult.insertId,
                    studentId: student_id,
                    studentClass: req.user.student_class,
                    subject: question[0].subject,
                    chapter: question[0].chapter,
                    version: question[0].question,
                    ques: question[0].doubt,
                    locale: question[0].locale,
                    questionImage: null,
                    ocrText: question[0].ocr_text,
                    ocrDone: question[0].ocr_done,
                    originalOcrText: ocr_text,
                    matchedQuestion: qid,
                    wrongImage: 0,
                    isTrial: 0,
                    difficulty: null,
                    UtilityModule: Utility,
                    userQuestionSnsUrl,
                    config,
                });
                // console.log(ques_obj);
                // const data = {
                //     action: 'ASK_FROM_APP',
                //     data: ques_obj,
                //     uuid: uuidv4(),
                //     timestamp: Utility.getCurrentTimeInIST(),
                // };
                // Utility.logEntry(sns, config.question_ask_sns, data);
            }
        }
    } catch (e) {
        // console.log(ques_obj)
        // let data = {
        //    "action":"ASK_FROM_APP",
        //    "data": ques_obj,
        //    "uuid": uuidv4(),
        //    "timestamp": Utility.getCurrentTimeInIST()
        //  }
        // Utility.logEntry(sns,config.question_ask_sns, data)
        console.log(e);
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
        let promises = [];
        const datas = [];
        let container = [];
        let student_id;
        // Getting student id by question id

        promises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, qid));
        promises.push(QuestionContainer.getPackagesByQid(qid, db));
        promises.push(QuestionContainer.getClassandChapterFromMeta(qid, db));

        const quesres = await Promise.all(promises);

        const question = quesres[0];
        let ssclass;
        let classFlag = false;
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
            promises = []; // console.log("classandchapter=");//console.log(quesres[2]);
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

            // console.log("PREVIOUS resolving quesvalue==");//console.log(questions)
            // console.log("promises array==");//console.log(promises)

            // //console.log("just after resolving quesvalue==");//console.log(questions)
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

            // console.log("packages==");//console.log(packages);

            // console.log("questions==");//console.log(questions);

            // console.log("datas==");//console.log(datas);

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
        const promises = [];
        const { student_id } = req.user;

        promises.push(Question.getMostWatchedVideoCountBySid(student_id, db.mysql.read));
        promises.push(Question.getTodayMostWatchedStudents(db.mysql.read));
        promises.push(Question.getLastdayWinners(db.mysql.read));
        promises.push(Question.getContestDetails(db.mysql.read));

        const result = await Promise.all(promises);
        const user = {};

        if (req.user.student_fname === '' || req.user.student_fname == 'undefined') {
            user.student_fname = null;
        } else {
            user.student_fname = req.user.student_fname;
        }

        user.student_username = req.user.student_username;

        if (req.user.img_url === '' || req.user.img_url == 'undefined') {
            user.profile_image = null;
        } else {
            user.profile_image = req.user.img_url;
        }

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

async function jeeMains2019(req, res) {
    db = req.app.get('db');
    const database = db;
    const promises = [];
    let datas = '';

    try {
        const date_val = req.body.date;
        const { shift } = req.body;
        const { page } = req.body;
        let flag = 0;

        promises.push(ChapterContainer.getDistYears(req.body.exam, database));
        promises.push(QuestionContainer.getDistinctDate(database));

        if (date_val != undefined && !_.isNull(date_val) && date_val != '') {
            promises.push(QuestionContainer.getDistinctShift(date_val, database));
            flag = 2;
            if (shift != undefined && !_.isNull(shift) && shift != '') {
                promises.push(QuestionContainer.getJM2019Questions(date_val, shift, page, database));
                promises.push(QuestionContainer.getJM2019QuestionsTotalCount(date_val, shift, database));
            } else {
                promises.push(QuestionContainer.getJM2019Questions(date_val, '', page, database));
                promises.push(QuestionContainer.getJM2019QuestionsTotalCount(date_val, '', database));
            }
        } else {
            promises.push(QuestionContainer.getJM2019Questions('', '', page, database));
            promises.push(QuestionContainer.getJM2019QuestionsTotalCount('', '', database));
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

async function jeeMains2019Answers(req, res) {
    db = req.app.get('db');
    const database = db;
    const promises = [];
    let datas = '';

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

async function microConcept(req, res) {
    try {
        db = req.app.get('db');
        const promises = [];
        let datas = {};

        const {
            class_id, course, chapter, subtopic, page,
        } = req.body;

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

async function whatsappRating(req, res) {
    const { student_id } = req.body;
    const {
        question_id, yes_no, rating, feedback, report,
    } = req.body;

    const db1 = req.app.get('db');

    const insertRating = {};

    insertRating.question_id = question_id;
    insertRating.student_id = student_id;
    insertRating.yes_no = yes_no;
    insertRating.rating = rating;
    insertRating.feedback = feedback;
    insertRating.report = report;

    try {
        const ratingCheck = await Question.getRating(question_id, student_id, db1.mysql.read);
        let ratingInsert = '';

        if (ratingCheck.length == 1) {
            const a = new Date(); // Current date now.
            const b = new Date(ratingCheck[0].created_at);
            const d = (a - b); // Difference in milliseconds.
            if (d >= 300000) {
                ratingInsert = await Question.insertRatingNew(insertRating, db1.mysql.write);
            } else {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "Can't insert again before 5mins",
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else if (ratingCheck.length == 0) {
            ratingInsert = await Question.insertRatingNew(insertRating, db1.mysql.write);
        }

        if (ratingInsert != '') {
            if (ratingInsert.insertId != undefined && ratingInsert.insertId != null) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                const responseData = {
                    meta: {
                        code: 404,
                        success: false,
                        message: 'Error rating insertion',
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
        const responseData = {
            meta: {
                code: 404,
                success: false,
                message: e,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function whatsappRatingMultipart(req, res) {
    // return res.json(req.body)
    console.log(req.body.question_id);
    const { student_id } = req.body;
    const {
        question_id, yes_no, rating, feedback, report,
    } = req.body;

    const db1 = req.app.get('db');

    const insertRating = {};

    insertRating.question_id = question_id;
    insertRating.student_id = student_id;
    insertRating.yes_no = yes_no;
    insertRating.rating = rating;
    insertRating.feedback = feedback;
    insertRating.report = report;

    try {
        const ratingCheck = await Question.getRating(question_id, student_id, db1.mysql.read);
        let ratingInsert = '';

        if (ratingCheck.length == 1) {
            const a = new Date(); // Current date now.
            const b = new Date(ratingCheck[0].created_at);
            const d = (a - b); // Difference in milliseconds.
            if (d >= 300000) {
                ratingInsert = await Question.insertRatingNew(insertRating, db1.mysql.write);
            } else {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: "Can't insert again before 5mins",
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else if (ratingCheck.length == 0) {
            ratingInsert = await Question.insertRatingNew(insertRating, db1.mysql.write);
        }

        if (ratingInsert != '') {
            if (ratingInsert.insertId != undefined && ratingInsert.insertId != null) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                const responseData = {
                    meta: {
                        code: 404,
                        success: false,
                        message: 'Error rating insertion',
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
        const responseData = {
            meta: {
                code: 404,
                success: false,
                message: e,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function matches(req, res, next) {
    try {
        db = req.app.get('db');
        const sns = req.app.get('sns');
        const kinesisClient = req.app.get('kinesis');
        const sqs = req.app.get('sqs');
        const { userQuestionSnsUrl } = staticData;
        config = req.app.get('config');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const user_locale = req.query.locale;
        const { colorVersion } = req.body;
        const { student_class } = req.user;
        let { student_id } = req.user;
        const versionCode = req.headers.version_code;
        student_id = (student_id) ? parseInt(student_id) : 0;
        const platformTabs = staticData.platform_tabs;

        const masterIterationMongo = {};
        masterIterationMongo.student_id = student_id;
        masterIterationMongo.isAbEligible = 0;
        masterIterationMongo.studentClass = student_class;
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const whatsAppData = staticData.askWhatsappData;
        const whatsAppJson = {};
        whatsAppJson.image_url = whatsAppData.key_value.image_url;
        whatsAppJson.description = whatsAppData.key_value.description;
        whatsAppJson.button_text = whatsAppData.key_value.button_text;
        whatsAppJson.button_bg_color = whatsAppData.key_value.button_bg_color;
        whatsAppJson.action_activity = whatsAppData.key_value.action_activity;
        whatsAppJson.action_data = whatsAppData.key_value.action_data;
        whatsAppJson.resource_type = 'card';
        const feedback = staticData.match_page_feedback;
        const is_subscribed = 0;
        const topicTabs = staticData.topic_tab;

        const { file_name } = req.query;
        const { question_id } = req.query;
        const elasticSearchInstance1 = req.app.get('elasticSearchInstance');
        const color = versionCode > 645 ? [Data.color.white] : Data.colors;
        // -------- mongo data insertion ------ //
        const languagesObj = staticData.languageObject;
        const st_lang_code = (typeof user_locale !== 'undefined') ? user_locale : req.user.locale;
        let language = languagesObj[st_lang_code];
        if (typeof language === 'undefined') {
            language = 'english';
        }
        masterIterationMongo.qid = question_id;

        // check if it exists in redis or not
        let image_ocr_data = await QuestionRedis.getStudentQuestion(student_id, file_name, db.redis.read);
        console.log('image_ocr_data');
        console.log(image_ocr_data);
        // image_ocr_data = `{"ocr":"this is a test","ocr_type":1,"handwritten":1,"locale":"en","ocr_done":0,"translate_done":0,"ocr_origin":"img_google_vision","original_ocr":"this is a test","is_processed":0}`;
        if (_.isNull(image_ocr_data)) {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    value: null,
                    retry: 1,
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        // we get ocr text from value
        // get question id
        // send ocr_text to Elastic Search
        image_ocr_data = JSON.parse(image_ocr_data);
        image_ocr_data.ocr = (_.isNull(image_ocr_data.ocr)) ? '' : image_ocr_data.ocr;
        const {
            ocr,
            locale,
            handwritten,
            ocr_type,
        } = image_ocr_data;
        masterIterationMongo.ocr_type = image_ocr_data.ocr_origin;

        let promises = [];
        image_ocr_data.ocr_type = 0;
        const variantAttachment = {
            apiUrl: '/api/vexp/search',
            elasticIndexName: 'question_bank_synonyms',
            hideFromPanel: false,
            isReorderSuggestions: true,
            searchImplVersion: 'v15',
            suggestionCount: 40,
            synonymDelimiters: [
                'log,ln',
                'cosec,csc',
                'rarr0,raar 0',
                'times,xx',
                'sin, si n',
            ],
            version: 'v15',
            ocrText: ocr,
            ocrType: ocr_type,
            studentClass: student_class,
        };
        // promises.push(QuestionHelper.handleElasticSearcWithTextSolutions(image_ocr_data, elasticSearchInstance1, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION));

        promises.push(QuestionHelper.handleElasticSearchWrapper({
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
            studentId: student_id,
            ocrType: image_ocr_data.ocr_type,
            variantAttachment,
            config,
            sqs,
            studentClass: student_class,
            next,
        }, config));
        promises.push(QuestionRedis.setPreviousHistory(student_id, [{
            question_id,
            ocr_text: ocr,
        }], db.redis.write));

        const resolvedPromises = await Promise.all(promises);
        promises = [];
        if (!resolvedPromises[0]) {
            return next({
                message: 'Error in search matches!', status: 500, isPublic: true, error: true,
            });
        }
        let matches_array = [];
        const filedToUpdate = {};
        filedToUpdate.ocr_done = 1;
        const {
            stringDiffResp,
            info,
            isOnlyEquation,
            cymathString,
        } = resolvedPromises[0];
        masterIterationMongo.elastic_index = info.query_ocr_text;

        // const stringDiffResp = Utility.stringDiffImplementWithKey(resolvedPromises[0].hits.hits, ocr, fuzz, 'ocr_text', language, false);
        matches_array = stringDiffResp[0];
        const facets = await bl.buildFacets(elasticSearchInstance, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, matches_array.map((x) => x._id), req.user.locale);
        masterIterationMongo.ocrType = image_ocr_data.ocr_type;

        masterIterationMongo.qid_matches_array = matches_array;
        const matchesQuestionArray = stringDiffResp[1];
        const groupedQid = stringDiffResp[2];
        filedToUpdate.question_image = file_name;
        filedToUpdate.subject = stringDiffResp[3];
        filedToUpdate.ocr_text = ocr;
        filedToUpdate.locale = locale;
        filedToUpdate.original_ocr_text = ocr;

        if (info.version === 'vt_0' || info.version === 'vt_0_1') {
            filedToUpdate.question = info.version;
        } else {
            filedToUpdate.question = (variantAttachment && variantAttachment.version) ? variantAttachment.version : info.version;
        }
        filedToUpdate.wrong_image = info.isIntegral;
        filedToUpdate.is_trial = image_ocr_data.ocr_type;

        let groupedMeta = [];
        if (groupedQid.length > 0) {
            // get meta info from elasticSearch
            const meta = await elasticSearchInstance1.getMeta(groupedQid);
            groupedMeta = _.groupBy(meta.docs, '_id');
        }
        if (variantAttachment && variantAttachment.version) {
            masterIterationMongo.iteration_name = variantAttachment.version;
        } else if (info && info.version) {
            masterIterationMongo.iteration_name = info.version;
        } else {
            masterIterationMongo.iteration_name = staticData.current_ask_question_iteration;
        }

        if (config.mongo.connect) {
            filedToUpdate.question = `v_mongo${filedToUpdate.question}`;
            masterIterationMongo.iteration_name = `v_mongo${masterIterationMongo.iteration_name}`;
        }
        masterIterationMongo.meta_index = Data.currentQuestionAskMetaIndex;
        masterIterationMongo.request_version = 'v2/matches';
        masterIterationMongo.question_image = file_name;
        masterIterationMongo.user_locale = st_lang_code;
        masterIterationMongo.ocr = ocr;
        masterIterationMongo.subject = stringDiffResp[3];

        const relevanceScoreArr = [];

        for (let i = 0; i < matches_array.length; i++) {
            const relevanceObject = { qid: matches_array[i]._id, _score: matches_array[i]._score, string_diff_score: matches_array[i].partial_score };
            relevanceScoreArr.push(relevanceObject);
        }
        masterIterationMongo.relevance_score = relevanceScoreArr;
        if (language !== 'english' && matches_array.length > 0) {
            matches_array = await QuestionContainer.getLocalisedQuestionMget(db, matches_array, groupedMeta, language, next);
        }
        const event = { data: masterIterationMongo, type: 'mongoWrite' };
        Utility.sendMessage(sqs, config.elasticsearch_sqs, event);
        Notification.questionCountNotifications(student_id, req.user.gcm_reg_id, config, null, db);

        // let matchedQuestionsHtml;
        const groupedMatchedQuestionHtml = [];
        // if (language === 'english' && matchesQuestionArray.length > 0) {
        //     matchedQuestionsHtml = await QuestionContainer.getQuestionHtmlMget(db, matchesQuestionArray, next);
        //     groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
        // }

        promises.push(QuestionContainer.getQuestionStatsWithMget(db, matches_array, config, color, language, st_lang_code, groupedMatchedQuestionHtml, groupedMeta, student_id, next));
        promises.push(Question.updateQuestion(filedToUpdate, question_id, db.mysql.write));
        const resolvedP = await Promise.all(promises);
        matches_array = resolvedP[0];
        if (whatsAppData.length > 0 && matches_array.length > 0) {
            matches_array.splice(6, 0, whatsAppJson);
        }

        const nData = [];
        const d1 = moment(req.user.timestamp);
        const d2 = moment(new Date());
        const difference = d2.diff(d1, 'days');
        const uuid = uuidv4();

        QuestionHelper.sendSnsMessage({
            type: 'user-questions',
            sns,
            uuid,
            qid: question_id,
            studentId: student_id,
            studentClass: student_class,
            subject: 'MATHS',
            chapter: 'DEFAULT',
            version: filedToUpdate.question,
            ques: filedToUpdate.question,
            locale,
            questionImage: filedToUpdate.question_image,
            ocrText: filedToUpdate.ocr_text,
            ocrDone: filedToUpdate.ocr_done,
            originalOcrText: filedToUpdate.original_ocr_text,
            wrongImage: filedToUpdate.wrong_image,
            isTrial: filedToUpdate.is_trial,
            difficulty: null,
            UtilityModule: Utility,
            userQuestionSnsUrl,
            config,
        });

        if (versionCode && versionCode > 659) {
            answerBl.pushFacetCard(matches_array, facets, req.body.topicsPosition);
        }

        if (difference > 4) {
            // const introVideoId = Constant.cropToEquation();
            const notificationData1 = staticData.cameraGuideNotificationData;
            nData.push(notificationData1);
        }
        // matches_array = matches_array.slice(0, 20);
        const responseData = {
            data: {
                question_id: parseInt(question_id),
                tab: topicTabs,
                platform_tabs: platformTabs,
                ocr_text: cymathString,
                question_image: `${config.cdn_url}images/${filedToUpdate.question_image}`,
                matched_questions: matches_array,
                matched_count: matches_array.length,
                is_subscribed,
                notification: nData,
                handwritten,
                feedback,
                is_only_equation: isOnlyEquation,
                facets,
            },
            error: false,
            schema: responseSchema,
        };
        if (typeof filedToUpdate.question_image === 'undefined') {
            responseData.data.question_image = null;
        }

        const responseDataToSend = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { value: responseData.data, retry: 0 },
        };
        res.status(responseDataToSend.meta.code).json(responseDataToSend);
        image_ocr_data.is_processed = 1;
        // await QuestionRedis.deleteStudentQuestion(student_id, file_name, db.redis.read)
        await QuestionRedis.setStudentQuestion(file_name, image_ocr_data, student_id, db.redis.write);
        if (ocr && matches_array.length) {
            // telemetry.addTelemetry(telemetry.eventNames.askSuccess, new Date() - start, { version: info.version });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function updatedMatches(req, res, next) {
    try {
        // let db = req.app.get('db')
        const size = (typeof req.query.size !== 'undefined') ? parseInt(req.query.size) : 500;
        // get questions
        const query = (typeof req.query.question_id !== 'undefined') ? { qid: req.query.question_id } : {};
        const data = await QuestionAsk.find(query).sort({ createdAt: -1 }).limit(size);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'data',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function addStats(req, res, next) {
    try {
        const db1 = req.app.get('db');
        const { question_id, reason } = req.body;
        const params = { question_id, reason };
        console.log(params);
        await statsMysql.insertQuestionStats(params, db1.mysql.write);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS!!!',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getMatchesByFileName(req, res, next) {
    try {
        // const { fileName } = req.query;
        db = req.app.get('db');
        config = req.app.get('config');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        const kinesisClient = req.app.get('kinesis');
        const fileName = req.query.file_name;
        const studentId = req.user.student_id;
        // const studentId = 4176043;
        let variantAttachment = null;

        const languagesObj = staticData.languageObject;
        let language = languagesObj[req.user.locale];
        if (typeof language === 'undefined') {
            language = 'english';
        }
        const versionCode = req.headers.version_code;

        const color = versionCode > 645 ? [staticData.color.white] : staticData.colors;
        const platformTabs = staticData.platform_tabs;
        const whatsAppData = staticData.askWhatsappData;
        const whatsAppJson = {};
        whatsAppJson.image_url = whatsAppData.key_value.image_url;
        whatsAppJson.description = whatsAppData.key_value.description;
        whatsAppJson.button_text = whatsAppData.key_value.button_text;
        whatsAppJson.button_bg_color = whatsAppData.key_value.button_bg_color;
        whatsAppJson.action_activity = whatsAppData.key_value.action_activity;
        whatsAppJson.action_data = whatsAppData.key_value.action_data;
        whatsAppJson.resource_type = 'card';
        const feedback = staticData.match_page_feedback;
        const handwritten = 0;
        // check this filename in mongo
        const query = { question_image: fileName, student_id: studentId.toString() };
        const sort = {};
        const result = await MongoQuestionAskUser.getDataFromMongo(query, sort);
        if (!_.isEmpty(result)) {
            // use mongo
            const stLangCode = result[0].user_locale;
            const ocrText = result[0].ocr;

            variantAttachment = await Utility.getFlagrResponse(kinesisClient, studentId);

            const matchesArray = result[0].qid_matches_array;
            const elasticPromise = [];
            for (let i = 0; i < matchesArray.length; i++) {
                elasticPromise.push(elasticSearchInstance.getElasticDataByIndexAndId(config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, 'repository', matchesArray[i]));
            }
            const elasticPromiseData = await Promise.all(elasticPromise);
            let matchesArrayNew = [];
            for (let i = 0; i < matchesArray.length; i++) {
                if (elasticPromiseData[i].hits.hits.length === 1) {
                    const obj = {};
                    obj._index = elasticPromiseData[i].hits.hits[0]._index;
                    obj._type = 'repository';
                    obj._id = matchesArray[i];
                    obj._score = result[0].relevance_score[i]._score;
                    obj._source = {};
                    obj._source.subject = elasticPromiseData[i].hits.hits[0]._source.subject;
                    obj._source.chapter = elasticPromiseData[i].hits.hits[0]._source.chapter;
                    obj._source.is_answered = elasticPromiseData[i].hits.hits[0]._source.is_answered;
                    obj._source.is_text_answered = elasticPromiseData[i].hits.hits[0]._source.is_text_answered;
                    obj.partial_score = result[0].relevance_score[i].string_diff_score;
                    matchesArrayNew.push(obj);
                }
            }
            matchesArrayNew = _.uniq(matchesArrayNew, '_id');
            const groupedQid = [];
            let groupedMeta = [];
            for (let i = 0; i < matchesArrayNew.length; i++) {
                const obj = {};
                obj._index = 'question_bank_meta';
                obj._type = 'repository';
                obj._id = matchesArrayNew[i]._id;
                groupedQid.push(obj);
            }
            if (groupedQid.length > 0) {
                // const meta = await elasticSearchInstance.getMeta(groupedQid);
                groupedMeta = await Utility.getEnglishGroupedMeta(db, matchesArrayNew, groupedQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next);
                // groupedMeta = _.groupBy(meta.docs, '_id');
            }
            const topicTabs = staticData.topic_tab;
            // const facets = await bl.buildFacets(elasticSearchInstance, matchesArray.map((x) => x._id));

            if (language !== 'english' && matchesArray.length > 0) {
                // if (1) {
                matchesArrayNew = await QuestionContainer.getLocalisedQuestionMget(db, matchesArrayNew, groupedMeta, language, next, groupedQid, elasticSearchInstance);
            }
            matchesArrayNew = await QuestionContainer.getQuestionStatsWithMget(db, matchesArrayNew, config, color, language, stLangCode, [], groupedMeta, studentId, next);
            if (whatsAppData.length > 0 && matchesArrayNew.length > 0) {
                matchesArrayNew.splice(6, 0, whatsAppJson);
            }
            const isSubscribed = 0;
            const { qid } = result[0];

            let delay_notification = staticData.delayNotification(req.user.locale);

            // const responseData = {
            //     data: {
            //         question_id: qid,
            //         tab: topicTabs,
            //         platform_tabs: platformTabs,
            //         ocr_text: QuestionHelper.getCymathString(ocrText),
            //         question_image: `${config.cdn_url}images/${fileName}`,
            //         matched_questions: matchesArray,
            //         matched_count: matchesArray.length,
            //         is_subscribed: isSubscribed,
            //         notification: [],
            //         handwritten,
            //         feedback,
            //         is_only_equation: 0,
            //         facets
            //     },
            //     error: false,
            //     schema: responseSchema,
            // };
            const responseData = {
                data: {
                    question_id: qid,
                    tab: topicTabs,
                    platform_tabs: platformTabs,
                    ocr_text: QuestionHelper.getCymathString(ocrText),
                    question_image: `${config.cdn_url}images/${fileName}`,
                    matched_questions: matchesArrayNew,
                    matched_count: matchesArrayNew.length,
                    is_subscribed: isSubscribed,
                    notification: [],
                    handwritten,
                    feedback,
                    is_only_equation: 0,
                    delay_notification,
                },
                error: false,
                schema: responseSchema,
            };
            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: responseData.data,
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
        } else {
            // get the image and follow same ask process
            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: [],
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function postMatchesByFileName(req, res, next) {
    const start = new Date();
    try {
        let clientFileName = null;
        const sns = req.app.get('sns');
        const kinesisClient = req.app.get('kinesis');
        const sqs = req.app.get('sqs');
        const { questionInitSnsUrl, userQuestionSnsUrl } = staticData;
        config = req.app.get('config');
        const translate2 = req.app.get('translate2');
        blobService = req.app.get('blobService');
        db = req.app.get('db');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const questionText = req.body.question_text;
        let studentId = req.user.student_id;
        let { locale } = req.body;
        const { subject, chapter, colorVersion } = req.body;
        const ques = req.body.question;
        const studentClass = req.body.class;
        const questionImage = req.body.question_image;
        const versionCode = req.headers.version_code;
        clientFileName = req.body.file_name;
        const xAuthToken = req.headers['x-auth-token'];
        const { supported_media_type: supportedMediaList } = req.body;

        // const studentId = 4176043;
        let variantAttachment = null;

        let languagesObj = staticData.languageObject;
        let language = languagesObj[req.user.locale];
        if (typeof language === 'undefined') {
            language = 'english';
        }

        let color = versionCode > 645 ? [staticData.color.white] : staticData.colors;
        let platformTabs = staticData.platform_tabs;
        let whatsAppData = staticData.askWhatsappData;
        let whatsAppJson = {};
        whatsAppJson.image_url = whatsAppData.key_value.image_url;
        whatsAppJson.description = whatsAppData.key_value.description;
        whatsAppJson.button_text = whatsAppData.key_value.button_text;
        whatsAppJson.button_bg_color = whatsAppData.key_value.button_bg_color;
        whatsAppJson.action_activity = whatsAppData.key_value.action_activity;
        whatsAppJson.action_data = whatsAppData.key_value.action_data;
        whatsAppJson.resource_type = 'card';
        let feedback = staticData.match_page_feedback;
        let handwritten = 0;
        // check this filename in mongo
        const query = { question_image: clientFileName, student_id: studentId.toString() };
        const sort = {};
        let result = await MongoQuestionAskUser.getDataFromMongo(query, sort);

        let autoPlayVariant = 0;
        let auto_play_initiation = 0;
        let auto_play_duration = 0;
        if (versionCode >= 765) {
            const autoPlayData = await QuestionContainer.getAutoPlayVariant(xAuthToken);
            autoPlayVariant = autoPlayData.autoPlayVariant;
            auto_play_initiation = autoPlayData.waitTime;
            auto_play_duration = autoPlayData.duration;
        }

        if (!_.isEmpty(result)) {
            // use mongo
            const stLangCode = result[0].user_locale;
            const ocrText = result[0].ocr;

            variantAttachment = await Utility.getFlagrResponse(kinesisClient, studentId);

            const matchesArray = result[0].qid_matches_array;
            const elasticPromise = [];
            for (let i = 0; i < matchesArray.length; i++) {
                elasticPromise.push(elasticSearchInstance.getElasticDataByIndexAndId(config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, 'repository', matchesArray[i]));
            }
            const elasticPromiseData = await Promise.all(elasticPromise);
            let matchesArrayNew = [];
            for (let i = 0; i < matchesArray.length; i++) {
                if (elasticPromiseData[i].hits.hits.length === 1) {
                    const obj = {};
                    obj._index = elasticPromiseData[i].hits.hits[0]._index;
                    obj._type = 'repository';
                    obj._id = matchesArray[i];
                    obj._score = result[0].relevance_score[i]._score;
                    obj._source = {};
                    obj._source.subject = elasticPromiseData[i].hits.hits[0]._source.subject;
                    obj._source.chapter = elasticPromiseData[i].hits.hits[0]._source.chapter;
                    obj._source.is_answered = elasticPromiseData[i].hits.hits[0]._source.is_answered;
                    obj._source.is_text_answered = elasticPromiseData[i].hits.hits[0]._source.is_text_answered;
                    obj.partial_score = result[0].relevance_score[i].string_diff_score;
                    matchesArrayNew.push(obj);
                }
            }
            matchesArrayNew = _.uniq(matchesArrayNew, '_id');
            const groupedQid = [];
            let groupedMeta = [];
            for (let i = 0; i < matchesArrayNew.length; i++) {
                const obj = {};
                obj._index = 'question_bank_meta';
                obj._type = 'repository';
                obj._id = matchesArrayNew[i]._id;
                groupedQid.push(obj);
            }
            if (groupedQid.length > 0) {
                // const meta = await elasticSearchInstance.getMeta(groupedQid);
                groupedMeta = await Utility.getEnglishGroupedMeta(db, matchesArrayNew, groupedQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next);
                // groupedMeta = _.groupBy(meta.docs, '_id');
            }
            const topicTabs = staticData.topic_tab;

            if (language !== 'english' && matchesArray.length > 0) {
                matchesArrayNew = await QuestionContainer.getLocalisedQuestionMget(db, matchesArrayNew, groupedMeta, language, next, groupedQid, elasticSearchInstance);
            }
            matchesArrayNew = await QuestionContainer.getQuestionStatsWithMget(db, matchesArrayNew, config, color, language, stLangCode, [], groupedMeta, studentId, next);
            if (whatsAppData.length > 0 && matchesArrayNew.length > 0) {
                matchesArrayNew.splice(6, 0, whatsAppJson);
            }

            matchesArrayNew = matchesArrayNew.map((obj) => {
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

            const isSubscribed = 0;
            const { qid } = result[0];

            let delay_notification = staticData.delayNotification(req.user.locale);

            const responseData = {
                data: {
                    question_id: qid,
                    tab: topicTabs,
                    platform_tabs: platformTabs,
                    ocr_text: QuestionHelper.getCymathString(ocrText),
                    question_image: `${config.cdn_url}images/${clientFileName}`,
                    matched_questions: matchesArrayNew,
                    matched_count: matchesArrayNew.length,
                    is_subscribed: isSubscribed,
                    notification: [],
                    handwritten,
                    feedback,
                    is_only_equation: 0,
                    delay_notification,
                },
                error: false,
                schema: responseSchema,
            };

            if (versionCode >= 765) {
                if (!autoPlayVariant) {
                    responseData.data.auto_play = false;
                } else {
                    responseData.data.auto_play = true;
                    responseData.data.auto_play_initiation = auto_play_initiation;
                    responseData.data.auto_play_duration = auto_play_duration;
                }
            }

            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: responseData.data,
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
        } else if (typeof questionImage !== 'undefined' && questionImage != null && questionImage.length > 0 && clientFileName != '' && clientFileName != undefined) {
            const existingData = await QuestionSql.getQdataBySidImg(studentId, clientFileName, db.mysql.read);

            if (existingData != undefined && existingData != null && existingData.length === 1 && existingData[0].ocr_text != null && existingData[0].ocr_text != undefined) {
                const ocr = existingData[0].ocr_text;
                let matchesArray;

                let stLangCode; const filedToUpdate = {}; let promises = [];
                // eslint-disable-next-line radix
                studentId = (studentId) ? parseInt(studentId) : 0;
                locale = ((locale) && (locale !== '')) ? locale : 'en';

                color = versionCode > 645 && colorVersion === 2 ? [staticData.color.white] : staticData.colors;
                platformTabs = staticData.platform_tabs;

                feedback = staticData.match_page_feedback;
                whatsAppData = staticData.askWhatsappData;
                whatsAppJson = {};
                whatsAppJson.image_url = whatsAppData.key_value.image_url;
                whatsAppJson.description = whatsAppData.key_value.description;
                whatsAppJson.button_text = whatsAppData.key_value.button_text;
                whatsAppJson.button_bg_color = whatsAppData.key_value.button_bg_color;
                whatsAppJson.action_activity = whatsAppData.key_value.action_activity;
                whatsAppJson.action_data = whatsAppData.key_value.action_data;
                whatsAppJson.resource_type = 'card';
                const isSubscribed = 0;
                const qid = existingData[0].question_id;

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
                    version: existingData[0].question,
                    ques,
                    locale,
                    UtilityModule: Utility,
                    questionInitSnsUrl,
                    config,
                });

                let fileName = null;
                let ocrData;
                let originalOcr;
                let ocrType = 1;
                variantAttachment = null;
                let preprocessMatchesArray;
                if (qid) {
                    const host = `${req.protocol}://${req.headers.host}`;
                    promises = [];
                    variantAttachment = await Utility.getFlagrResponseForAskV9(kinesisClient, studentId, telemetry, start);
                    // fileName = await QuestionHelper.handleImage(questionImage, fs, qid, config, s3, publicPath, blobService, variantAttachment, clientFileName);
                    filedToUpdate.question_image = clientFileName;
                    fileName = clientFileName;
                    ocrData = await QuestionHelper.handleOcrGlobal({
                        image: questionImage, host, fileName, translate2, variantAttachment, config, next, studentId,
                    });
                    originalOcr = existingData[0].original_ocr;
                    handwritten = ocrData.handwritten;
                    locale = existingData[0].locale;
                    ocrType = ocrData.ocr_type;
                    filedToUpdate.difficulty = ocrData.isModified ? ocrData.isModified : 0;
                    preprocessMatchesArray = ocrData.preprocessMatchesArray;

                    filedToUpdate.ocr_done = 1;
                    filedToUpdate.ocr_text = existingData[0].ocr;
                    filedToUpdate.locale = locale;
                    const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
                    languagesObj = staticData.languageObject;
                    stLangCode = existingData[0].locale;
                    language = languagesObj[req.body.locale];
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
                    if (!_.isNull(variantAttachment)) {
                        variantAttachment.isTextAnswered = false;
                    }

                    result = await QuestionHelper.handleElasticSearchWrapper({
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
                        variantAttachment,
                        config,
                        sqs,
                        studentClass,
                        db,
                        QuestionContainer,
                        translate2,
                        next,
                    }, config);

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

                    promises = [];
                    matchesArray = stringDiffResp[0];
                    // let matchEmpty = false;
                    // if (matchesArray.length === 0) {
                    //     matchEmpty = true;
                    // }
                    if (!_.isEmpty(preprocessMatchedObject)) {
                        const wrappedPreprocessMatchedObject = { ...matchesArray[0], _id: preprocessMatchedObject.id, _source: preprocessMatchedObject };
                        matchesArray.unshift(wrappedPreprocessMatchedObject);
                    }

                    matchesArray = _.uniq(matchesArray, '_id');

                    const topicTabs = staticData.topic_tab;

                    if (ocr && !matchesArray.length) {
                        telemetry.addTelemetry(telemetry.eventNames.askFailure, new Date() - start, { msg: 'no_matches' });
                    }

                    filedToUpdate.original_ocr_text = originalOcr;

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
                    const matchesQuestionArray = stringDiffResp[1];

                    const groupedQid = stringDiffResp[2];
                    filedToUpdate.subject = stringDiffResp[3];
                    let computational = [];
                    if (variantAttachment && !variantAttachment.dontgetComputeQues && ((!matchesArray) || (matchesArray[0] && matchesArray[0]._score < 95))) {
                        computational = await QuestionHelper.handleComputationalQuestions({
                            mathsteps,
                            AnswerMysql,
                            cleanedOcr,
                            UtilityModule: Utility,
                            qid,
                            db,
                        });
                    }
                    if (computational.length) {
                        filedToUpdate.is_text_answered = 1;
                        filedToUpdate.ocr_text = `\`${ocrData.ocr}\``;
                    }

                    let groupedMeta = [];
                    if (groupedQid.length > 0) {
                        groupedMeta = await Utility.getEnglishGroupedMeta(db, matchesArray, groupedQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next);
                    }

                    const relevanceScoreArr = [];
                    for (let i = 0; i < matchesArray.length; i++) {
                        console.log(matchesArray[i]._id);
                        console.log(matchesArray[i]._source);
                        const relevanceObject = { qid: matchesArray[i]._id, _score: matchesArray[i]._score, string_diff_score: matchesArray[i].partial_score };
                        relevanceScoreArr.push(relevanceObject);
                    }
                    const promises3 = [];
                    promises3.push(QuestionRedis.setPreviousHistory(studentId, [{
                        question_id: qid,
                        ocr_text: ocr,
                    }], db.redis.write));
                    // promises3.push(questionAskLog.save());
                    Promise.all(promises3).then(() => { }).catch(() => { }); // async
                    if (language !== 'english' && matchesArray.length > 0) {
                        matchesArray = await QuestionContainer.getLocalisedQuestionMget(db, matchesArray, groupedMeta, language, next, groupedQid, elasticSearchInstance);
                    }
                    Notification.questionCountNotifications(studentId, req.user.gcm_reg_id, config, null, db);

                    let matchedQuestionsHtml;
                    let groupedMatchedQuestionHtml;
                    if (language === 'english' && matchesQuestionArray.length > 0) {
                        matchedQuestionsHtml = await QuestionContainer.getQuestionHtmlMget(db, matchesQuestionArray, next);
                        groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                    }
                    promises.push(QuestionContainer.getQuestionStatsWithMget(db, matchesArray, config, color, language, stLangCode, groupedMatchedQuestionHtml, groupedMeta, studentId, next, req.headers['x-auth-token'], versionCode));
                    promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write));
                    const resolvedP = await Promise.all(promises);
                    matchesArray = resolvedP[0];
                    if (whatsAppData.length > 0 && matchesArray.length > 0) {
                        matchesArray.splice(6, 0, whatsAppJson);
                    }
                    if (computational.length > 0) {
                        matchesArray = [...computational, ...matchesArray];
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

                    if (versionCode && versionCode === 685) {
                        if ((typeof questionText === 'undefined' || questionText.length === 0) && matchesArray.length > 0) {
                            answerBl.pushBountyCard(matchesArray, req.body.source);
                        }
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

                    if (versionCode && versionCode > 685) {
                        if (studentId % config.bounty_mod_factor === 0) {
                            if ((typeof questionText === 'undefined' || (!_.isEmpty(questionText) && questionText.length === 0)) && matchesArray.length > 0) {
                                answerBl.pushBountyCard(matchesArray, req.body.source);
                            }
                        }
                    }

                    if (difference > 4) {
                        const notificationData1 = staticData.cameraGuideNotificationData;
                        nData.push(notificationData1);
                    }

                    const allTypeResourceVersion = liveclassData.videoAlltypeHandlingVersionCode;
                    const videoResourcePromise = [];
                    matchesArray = matchesArray.map((obj) => {
                        if (versionCode >= allTypeResourceVersion) {
                            videoResourcePromise.push(Answer_Container_v13.getAnswerVideoResource(db, config, obj.answer_id, obj._id, supportedMediaList));
                        }
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
                    if (videoResourcePromise.length > 0) {
                        const videoResourceResults = await Promise.all(videoResourcePromise);
                        for (let i = 0; i < matchesArray.length; i++) {
                            if (videoResourceResults[i] != undefined) {
                                matchesArray[i].video_resource = null;
                                if (videoResourceResults[i] != undefined && videoResourceResults[i].length > 0 && videoResourceResults[i][0] != undefined) {
                                    matchesArray[i].video_resource = videoResourceResults[i][0];
                                }
                            }
                        }
                    }

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
                        if (!autoPlayVariant) {
                            responseDataData.auto_play = false;
                        } else {
                            responseDataData.auto_play = true;
                            responseDataData.auto_play_initiation = auto_play_initiation;
                            responseDataData.auto_play_duration = auto_play_duration;
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
                    responseData.data.cdn_video_base_url = config.cdn_video_url;
                    const responseDataToSend = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: responseData.data,
                    };
                    res.status(responseDataToSend.meta.code).json(responseDataToSend);
                } else {
                    const responseDataToSend = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'Success',
                        },
                        data: [],
                    };
                    res.status(responseDataToSend.meta.code).json(responseDataToSend);
                }
            } else {
                const responseDataToSend = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                    data: [],
                };
                res.status(responseDataToSend.meta.code).json(responseDataToSend);
            }
        } else {
            const responseDataToSend = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: [],
            };
            res.status(responseDataToSend.meta.code).json(responseDataToSend);
        }
    } catch (e) {
        console.log(e);
        next(e);
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
    jeeMains2019,
    jeeMains2019Answers,
    microConcept,
    whatsappRating,
    whatsappRatingMultipart,
    matches,
    updatedMatches,
    addStats,
    getMatchesByFileName,
    postMatchesByFileName,
};
// unique id of s3 upload
// acknowledge from client
