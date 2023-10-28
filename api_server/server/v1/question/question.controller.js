/* eslint-disable prefer-destructuring */
/* eslint-disable no-underscore-dangle */
/* eslint-disable radix */
/* eslint-disable camelcase */
/* eslint-disable eqeqeq */
/* eslint-disable no-shadow */
/* eslint-disable no-await-in-loop */
const fuzz = require('fuzzball');
const download = require('image-downloader');
const request = require('request');
const Jimp = require('jimp');
const image2base64 = require('image-to-base64');
const b_13 = require('base-conversion');
const bluebird = require('bluebird');
const util = require('util');
const url = require('url-exists');
const moment = require('moment');
const fs = require('fs');
const mongoose = require('mongoose');
// const vision = require('@google-cloud/vision');
const _ = require('lodash');
const uuidv4 = require('uuid/v4');
const Question = require('../../../modules/question');
const Utility = require('../../../modules/utility');
const QuestionContainer = require('../../../modules/containers/question');
// const Question_Helper = require('../../../server/helpers/question.helper');
const QuestionMysql = require('../../../modules/mysql/question');
const AppConfiguration = require('../../../modules/mysql/appConfig');
const WhatsAppMessageModel = require('../../../modules/mongo/whatsapp');
const AnswerContainer = require('../../../modules/containers/answer');
const utility_redis = require('../../../modules/redis/utility.redis');
const helper = require('../../helpers/question.helper');
const Data = require('../../../data/data');
// const urlExists = require('url-exists');
const urlExists = util.promisify(url);
const QuestionHelper = require('../../helpers/question.helper');
const LanguageContainer = require('../../../modules/containers/language');
const Student = require('../../../modules/student');
const HomepageQuestionMasterRedis = require('../../../modules/redis/homepageQuestionsMaster');
const QuestionRedis = require('../../../modules/redis/question');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const kafka = require('../../../config/kafka');
require('../../../modules/mongo/questionAsk');

// imports for SRP widegts start
const StudentContainer = require('../../../modules/containers/student');
const freeClassHelper = require('../../helpers/freeLiveClass');
const StudentRedis = require('../../../modules/redis/student');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const SrpWidgetManager = require('../../helpers/srpWidget.helper');
const P2pMySql = require('../../../modules/mysql/doubtPeCharcha');
const StudentMongo = require('../../../modules/mongo/student');
const D0UserManager = require('../../helpers/d0User.helper');
const CampaignMysql = require('../../../modules/mysql/campaign');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const altAppData = require('../../../data/alt-app');
// imports for SRP widegts end

bluebird.promisifyAll(mongoose);
// const QuestionAskModel = require('../../../modules/mongo/questionAsk');

// const QuestionAsk = QuestionAskModel.QuestionLogModel;
// bluebird.promisifyAll

bluebird.promisifyAll(urlExists);
bluebird.promisifyAll(fs);

let db;
let elasticSearchInstance;
let elasticSearchTestInstance;
// let admin;

// const blobUrl = 'https://doubtnutvideobiz.blob.core.windows.net/q-images/';

let config;
// let elasticSearchClient;
// let blobService;

async function generateDeepLink(question_id, image_url, title, request, config, parent_id, student_id, url, question_answered, question_text_answered) {
    // //console.log(post_id)
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(((resolve, reject) => {
        try {
            console.log('url ::: ', url);
            console.log('question_id :::', question_id);
            let myJSONObject;
            if (url != '' && url != null) {
                console.log('1 \n  under if condition');
                myJSONObject = {
                    branch_key: config.branch_key,
                    channel: student_id,
                    feature: 'video',
                    campaign: 'WHA_VDO',
                    data: {
                        qid: question_id,
                        sid: `WHA:${parent_id}:${student_id}`,
                        // "resource_type":"video", //checking for the resource type on app
                        page: 'DEEPLINK',
                        // "ref_student_id":"WHA:"+parent_id,
                        $og_title: title,
                        $og_description: title,
                        $og_image_url: image_url,
                        $ios_url: url,
                        $desktop_url: url,
                        $fallback_url: url,
                    },
                };
                if (question_answered == 0 && question_text_answered == 1) {
                    myJSONObject.data.resource_type = 'text';
                } else {
                    myJSONObject.data.resource_type = 'video';
                }
            } else {
                console.log('2 \n  under else condition');
                myJSONObject = {
                    branch_key: config.branch_key,
                    channel: student_id,
                    feature: 'video',
                    campaign: 'WHA_VDO',
                    data: {
                        qid: question_id,
                        sid: `WHA:${parent_id}:${student_id}`,
                        // "resource_type":"video",
                        page: 'DEEPLINK',
                        $og_description: title,
                        // "ref_student_id":"WHA:"+parent_id,
                        $og_title: title,
                        $og_image_url: image_url,
                    },
                };
                if (question_answered == 0 && question_text_answered == 1) {
                    myJSONObject.data.resource_type = 'text';
                } else {
                    myJSONObject.data.resource_type = 'video';
                }
            }
            console.log('myjsonobject', myJSONObject);
            request({
                url: 'https://api.branch.io/v1/url',
                method: 'POST',
                json: true, // <--Very important!!!
                body: myJSONObject,
            }, (error, response, body) => {
                if (error) {
                    // //console.log(error);//uncomment this
                } else {
                    // console.log(body);//comment this
                    return resolve(body);
                }
            });
        } catch (e) {
            // console.log(e)
            return reject(e);
        }
    }));
}

async function whatsAppLogs(req, res, next) {
    try {
        // console.log('uncomment this api')
        // console.log()

        // console.log(result)
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        res.status(responseData.meta.code).json(responseData);
        const wha = new WhatsAppMessageModel({ phone: req.body.phone, data: JSON.parse(req.body.data) });
        await wha.save();
    } catch (e) {
        next(e);
    }
}

async function handleJimp(jimp, question_image) {
    console.log('SSSSSSSSs-----------------', question_image);
    try {
        return await jimp.read(question_image);
    } catch (e) {
        console.log(e);
        return false;
    }
}

function changeToBase13(id) {
    const base_13 = b_13(10, 13);
    return base_13(id);
}

async function checkHindiInString(questionString) {
    const numberOfHindiCharacters = 128;
    const unicodeShift = 0x0900;
    const hindiAlphabet = [];
    for (let i = 0; i < numberOfHindiCharacters; i++) {
        hindiAlphabet.push(`\\u0${(unicodeShift + i).toString(16)}`);
    }

    const regex = new RegExp(`(?:^|\\s)[${hindiAlphabet.join('')}]+?(?:\\s|$)`,
        'g');
    let matchRes = '';
    matchRes = questionString.match(regex);

    console.log('matchRes :::', matchRes);

    if (matchRes == '' || matchRes == null || matchRes == undefined) {
        return 'No Hindi';
    }
    return 'Hindi';
}

async function getTotalLikesShare(question_id, db) {
    try {
        let durationPromise = []; const
            questionData = {};
        durationPromise.push(AnswerContainer.getByQuestionId(question_id, db));
        durationPromise.push(QuestionContainer.getTotalViewsWeb(question_id, db));
        const videoData = await Promise.all(durationPromise);
        console.log('duration:', videoData[0][0]);
        durationPromise = [];
        durationPromise.push(AnswerContainer.getLikeDislikeStats(videoData[1][0][0].total_count, question_id, db));
        durationPromise.push(AnswerContainer.getWhatsappShareStats(videoData[1][0][0].total_count, question_id, db));
        const tempData = await Promise.all(durationPromise);
        if (typeof videoData[0][0] !== 'undefined' && videoData[0][0].duration !== 'NULL' && videoData[0][0].duration) {
            questionData.duration = videoData[0][0].duration;
        } else {
            questionData.duration = 0;
        }
        questionData.total_views = videoData[1][0][0].total_count;
        questionData.share = tempData[1][0];
        questionData.like = tempData[0][0];
        return questionData;
    } catch (e) {
        return false;
    }
}

async function askWhatsApp(req, res, next) {
    res.send({});
    const sns = req.app.get('sns');
    const { phone } = req.body;
    const { question_image } = req.body;
    const publicPath = req.app.get('publicPath');
    const s3 = req.app.get('s3');
    const kinesisClient = req.app.get('kinesis');
    let { student_id } = req.body;
    const { questionInitSnsUrl, userQuestionSnsUrl } = Data;

    // let transLateApiResp;
    // let latex;
    let ocr;
    // let latexToAscii;
    // let text;
    // let ocr2;
    // let st_lang_code;
    let qid; const insertedQuestion = {}; const filedToUpdate = {}; let
        promises = [];
    const host = `${req.protocol}://${req.headers.host}`;
    let dateUTC = new Date();
    dateUTC = dateUTC.getTime();
    const dateIST = new Date(dateUTC);
    // date shifting for IST timezone (+5 hours and 30 minutes)
    dateIST.setHours(dateIST.getHours() + 5);
    dateIST.setMinutes(dateIST.getMinutes() + 30);
    let today = dateIST;
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    today = `${mm}/${dd}/${yyyy}`;
    console.log('today', today);
    let sendYesorNo = 1;
    let addToDb = 0;
    const date = today;
    const urlArray = [];
    const todayEnd = new Date(dateIST);
    todayEnd.setHours(23);
    todayEnd.setMinutes(59);
    const expire = Math.floor((todayEnd - dateIST) / 1000);
    console.log(expire);
    try {
        config = req.app.get('config');
        db = req.app.get('db');
        // blobService = req.app.get('blobService');
        console.log('hi');
        let phy_count = 0;
        let chem_count = 0;
        let maths_count = 0;
        let bio_count = 0;
        let isHw = await utility_redis.checkIfExists(db.redis.read, `${phone}isHw`);
        if (isHw == null) {
            isHw = 0;
        }
        let watCount = await utility_redis.checkIfExists(db.redis.read, `${phone + date}wa`);
        // const fingerprint = await Student.getStudent(student_id, db.mysql.read);
        const fingerprint = await StudentContainer.getById(student_id, db);
        // console.log('fingerprint-------------->>>>',fingerprint[0]['fingerprints'])
        const obj_fing = {};
        obj_fing.type = fingerprint[0].fingerprints;
        obj_fing.data = question_image;
        obj_fing.student_id = student_id;
        Utility.whatsAppLogs(phone, obj_fing);
        if (await utility_redis.checkIfExists(db.redis.read, `${phone}IsOptInForFact`) == 'NotDecidedYet') {
            await utility_redis.lockWithNoExpire(db.redis.write, `${phone}IsOptInForFact`, 'none');
        }
        if (await utility_redis.checkIfExists(db.redis.read, `${phone}loopCounter`) == 'on' && watCount != null && watCount != 0) {
            const obj = {};
            obj.type = 'QuestionLoopWithQues';
            obj.data = question_image;
            Utility.whatsAppLogs(phone, obj);
            const obj1 = {};
            obj1.type = `Question${watCount}question`;
            obj1.data = question_image;
            Utility.whatsAppLogs(phone, obj1);
        }

        if (parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone}_whatsapp_lock`)) == 2) {
            // Utility.sendWhatsAppMessage(phone,"Please wait! 🙏\nHum aapke first question ka solution search kar rahe hai. 🧐\nHume ek baar me ek hi question bheje. 👆",config);
            await utility_redis.lock(db.redis.write, `${phone}_whatsapp_lock`, parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone}_whatsapp_lock`)) + 1, 15);
            // const responseData = {
            //     meta: {
            //         code: 200,
            //         success: true,
            //         message: 'SUCCESS',
            //     },
            //     quesImg: await utility_redis.checkIfExists(db.redis.read, `${phone}wat`),
            //     isMessageInQueue: 1,
            //     error: null,
            // };
            // res.status(responseData.meta.code).json(responseData);
            await Utility.sendImageOnWhatsAppWithCaption(phone, await utility_redis.checkIfExists(db.redis.read, `${phone}wat`), 'Please wait! Mai aapke iss 👆 question ka solution search karr raha hun! 🧐 \n\nMujhe *ek baar me ek hi question bheje.* Thanks 🤖 ', 'multi-message', config);
            addToDb = 1;
        } else if (parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone}_whatsapp_lock`)) > 2) {
            console.log('One at a time');
            await utility_redis.lock(db.redis.write, `${phone}_whatsapp_lock`, parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone}_whatsapp_lock`)) + 1, 15);
            // res.send({ message: 'One at a time' });
            addToDb = 1;
            console.log('added');
        } else {
            await utility_redis.lock(db.redis.write, `${phone}_whatsapp_lock`, 1, 30);
            await utility_redis.lock(db.redis.write, `${phone}_whatsapp_lock`, parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone}_whatsapp_lock`)) + 1, 15);
            // await utility_redis.lockWithNoExpire(db.redis.write , phone+'loopCounter' , 'on')//was using lock with no expire
            await utility_redis.lock(db.redis.write, `${phone}loopCounter`, 'on', 43200);
            await utility_redis.checkIfExists(db.redis.read, `${phone}_whatsapp_lock`);
            await utility_redis.lock(db.redis.write, `${phone}wat`, question_image, 6);
            const translate2 = req.app.get('translate2');
            elasticSearchInstance = req.app.get('elasticSearchInstance');
            const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
            db = req.app.get('db');
            const { question_text } = req.body;
            const ques = '';
            let ocrData = {};
            const student_class = 20;
            let matches_array;
            student_id = (student_id) ? parseInt(student_id) : 0;
            const subject = 'MATHS';
            let locale = 'en';
            insertedQuestion.student_id = student_id;
            insertedQuestion.class = student_class;
            insertedQuestion.subject = subject;
            insertedQuestion.book = subject;
            insertedQuestion.chapter = 'DEFAULT';
            insertedQuestion.question = ques;
            insertedQuestion.doubt = 'WHATSAPP';
            insertedQuestion.locale = locale;
            promises.push(Question.addQuestion(insertedQuestion, db.mysql.write));
            promises.push(AppConfigurationContainer.getConfigByKeyAndClass(db, 'apply_string_diff', student_class));
            promises.push(LanguageContainer.getList(db));
            const resolvedPromises = await Promise.all(promises);
            promises = [];
            const insertQuestionResult = resolvedPromises[0];
            // const isStringDiffActive = resolvedPromises[1][0].key_value;
            const languages_arrays = resolvedPromises[2];
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
                chapter: insertedQuestion.chapter,
                version: insertedQuestion.question,
                ques: insertedQuestion.doubt,
                locale,
                UtilityModule: Utility,
                questionInitSnsUrl,
            });
            await utility_redis.lockWithNoExpire(db.redis.write, `${phone}qid`, qid);
            console.log('qid-------------------->>>', qid);
            if (qid) {
                let variantAttachment;
                if (_.isNull(question_text)) {
                    let extension = '.png'; let
                        content_type;
                    const destination = `${publicPath}/uploads`;
                    const options = {
                        url: question_image,
                        dest: destination,
                    };
                    await Utility.sendWhatsAppMessage(req.body.phone, 'Good question 😇 🤖 \n\nSearching solution...in 10 secs.. 🔍', 'searching-for-solution', config);

                    const { filename } = await download.image(options);
                    // console.log("filename", filename)
                    if (filename.indexOf('png') !== -1) {
                        extension = '.png';
                        content_type = 'image/png';
                    } else if (filename.indexOf('jpg') !== -1 || filename.indexOf('jpeg') !== -1) {
                        extension = '.jpg';
                        content_type = 'image/jpg';
                    } else {
                        extension = '.png';
                        content_type = 'image/png';
                    }
                    const fileName = `upload_${qid}_${moment().unix()}${extension}`;
                    console.log(fileName);
                    filedToUpdate.question_image = fileName;
                    const data = await fs.readFileAsync(filename);
                    await Utility.uploadTos3(s3, config.aws_bucket, fileName, data, content_type);
                    console.log('uploaded');
                    const path = `https://d10lpgp6xz60nq.cloudfront.net/images/${fileName}`;
                    const jimpResponse = await handleJimp(Jimp, question_image);
                    console.log(`jimpResponse :${jimpResponse}`);
                    if (jimpResponse) {
                        if (jimpResponse.bitmap.width / jimpResponse.bitmap.height <= 0.5) {
                            console.log('vertical');
                            filedToUpdate.is_skipped = 5;
                            variantAttachment = await Utility.getFlagrResponse(kinesisClient, 50);
                            if (variantAttachment) {
                                ocrData = await helper.handleOcrWhatsappVertical2(fileName, s3, translate2, config, variantAttachment);
                            }
                            if (!variantAttachment || !ocrData) {
                                ocrData = await helper.handleOcrWhatsappVertical(fileName, s3, translate2, config);
                            }
                            console.log('ocr from ocr text from controller --->>>', ocrData);
                            // ocrData.ocr = Utility.replaceSpecialSymbol2(ocrData.ocr);
                            if (ocrData.handwritten == 1) {
                                // no reply to handwritten check
                                // await Utility.sendWhatsAppMessage(req.body.phone , "Oops! This is a handwritten question. 😔\n\n❌ Mujhe handwritten question nahi bheje \n\nI am still a learning robot 🤖 \n\n✅ Abhi Physics, Chemistry & Maths question ki photo book se send karei" , config)
                                filedToUpdate.ocr_done = 1;
                                filedToUpdate.ocr_text = ocr;
                                filedToUpdate.original_ocr_text = ocr;
                                filedToUpdate.locale = ocrData.locale;
                                filedToUpdate.is_skipped = 7;
                                filedToUpdate.is_trial = ocrData.ocr_type;
                                // await Question.updateQuestion(filedToUpdate, qid, db.mysql.write);
                                if (watCount == null) {
                                    watCount = '0';
                                }
                                await utility_redis.lock(db.redis.write, `${phone}isHw`, 1, 350);
                            }
                            ocr = ocrData.ocr;
                            console.log('ocr From v1 controller --->', ocr);
                        } else {
                            console.log('vertical1');
                            variantAttachment = await Utility.getFlagrResponse(kinesisClient, student_id);
                            // let isAbTestingActive;
                            let question_image_base64 = await image2base64(path);
                            question_image_base64 = question_image_base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                            ocrData = await helper.handleOcrGlobal({
                                image: question_image_base64, host, fileName, translate2, config, variantAttachment, next,
                            });
                            // ocrData = await helper.handleOcrForWhatsapp(student_id, isAbTestingActive, question_image_base64, host, locale, handwritten, fileName, translate2, config)
                            console.log('checking for handwritten------------->', ocrData);
                            if (ocrData.handwritten == 1) {
                                // no reply to handwritten check
                                // await Utility.sendWhatsAppMessage(req.body.phone , "Oops! This is a handwritten question. 😔\n\n❌ Mujhe handwritten question nahi bheje \n\nI am still a learning robot 🤖 \n\n✅ Abhi Physics, Chemistry & Maths question ki photo book se send karei" , config)
                                filedToUpdate.ocr_done = 1;
                                filedToUpdate.ocr_text = ocr;
                                filedToUpdate.original_ocr_text = ocr;
                                filedToUpdate.locale = ocrData.locale;
                                filedToUpdate.is_skipped = 6;
                                filedToUpdate.is_trial = ocrData.ocr_type;
                                // await Question.updateQuestion(filedToUpdate, qid, db.mysql.write);
                                // console.log("waCount", watCount)
                                // console.log("watCount", typeof watCount)
                                if (watCount == null) {
                                    watCount = '0';
                                }
                                await utility_redis.lock(db.redis.write, `${phone}isHw`, 1, 350);
                            }

                            // ocrData.ocr = Utility.replaceSpecialSymbol2(ocrData.ocr)
                            // console.log('ocr--------->', typeof ocr)
                            ocr = ocrData.ocr;
                            console.log('occrrr--->>>>', ocr);
                        }
                    } else {
                        console.log('vertical2');
                        variantAttachment = await Utility.getFlagrResponse(kinesisClient, student_id);
                        // ocr = await helper.handleOcrWhatsapp(fileName , s3 , translate2, 0)
                        // let isAbTestingActive;
                        let question_image_base64 = await image2base64(path);
                        question_image_base64 = question_image_base64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                        ocrData = await helper.handleOcrGlobal({
                            image: question_image_base64, host, fileName, translate2, config, variantAttachment, next,
                        });
                        // ocrData = await helper.handleOcr(student_id, isAbTestingActive, question_image_base64, host, locale, handwritten, fileName, translate2, config)
                        // ocrData = await helper.handleOcrForWhatsapp(student_id, isAbTestingActive, question_image_base64, host, locale, handwritten, fileName, translate2, config)
                        console.log('checking for handwritten------------->', ocrData.handwritten);
                        if (ocrData.handwritten == 1) {
                            // no reply to handwritten check
                            // await Utility.sendWhatsAppMessage(req.body.phone , "Oops! This is a handwritten question. 😔\n\n❌ Mujhe handwritten question nahi bheje \n\nI am still a learning robot 🤖 \n\n✅ Abhi Physics, Chemistry & Maths question ki photo book se send karei" , config)
                            filedToUpdate.ocr_done = 1;
                            filedToUpdate.ocr_text = ocr;
                            filedToUpdate.original_ocr_text = ocr;
                            filedToUpdate.locale = ocrData.locale;
                            filedToUpdate.is_skipped = 6;
                            filedToUpdate.is_trial = ocrData.ocr_type;
                            // await Question.updateQuestion(filedToUpdate, qid, db.mysql.write);
                            // console.log("waCount", watCount)
                            // console.log("watCount", typeof watCount)
                            if (watCount == null) {
                                watCount = '0';
                            }
                            await utility_redis.lock(db.redis.write, `${phone}isHw`, 1, 350);
                        }

                        // ocrData.ocr = Utility.replaceSpecialSymbol2(ocrData.ocr)
                        // console.log('ocr--------->', typeof ocr)
                        ocr = ocrData.ocr;
                        // console.log('occrrr--->>>>', ocr)
                    }

                    // ocr = Utility.replaceSpecialSymbol2(ocr)
                    // console.log("ocr", ocr)
                    filedToUpdate.ocr_done = 1;
                    filedToUpdate.ocr_text = ocr;
                    filedToUpdate.original_ocr_text = ocr;
                    filedToUpdate.locale = ocrData.locale;
                    filedToUpdate.is_trial = ocrData.ocr_type;
                    // ocr_text = ocr;
                    // console.log('------------------------------>>>' , ocrData)
                }
                const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
                console.log('yoyo', ocrData.ocr);
                const languages_obj = Utility.getLanguageObject(languages_arrays);
                const st_lang_code = ocrData.locale;
                let language = languages_obj[st_lang_code];
                if (typeof language === 'undefined') {
                    language = 'english';
                }
                console.log(language);
                const stockWordList = await QuestionContainer.getStockWordList(db);
                const result = await helper.handleElasticSearchWrapper({
                    ocr: ocrData.ocr, elasticSearchInstance, elasticSearchTestInstance, kinesisClient, elasticIndex: indexName, stockWordList, useStringDiff: true, language, fuzz, UtilityModule: Utility, studentId: student_id, ocrType: ocrData.ocr_type, variantAttachment, next,
                }, config);
                const {
                    stringDiffResp,
                    info,
                } = result;
                filedToUpdate.original_ocr_text = info.query_ocr_text;
                filedToUpdate.question = info.version;
                filedToUpdate.wrong_image = info.isIntegral;
                filedToUpdate.subject = stringDiffResp[3];
                await Question.updateQuestion(filedToUpdate, qid, db.mysql.write);
                QuestionHelper.sendSnsMessage({
                    type: 'user-questions',
                    sns,
                    uuid,
                    qid,
                    studentId: student_id,
                    studentClass: student_class,
                    subject,
                    chapter: insertedQuestion.chapter,
                    version: insertedQuestion.question,
                    ques: insertedQuestion.doubt,
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
                });
                if (stringDiffResp[0].length > 0) {
                    // let question;
                    let question_id;
                    const hindiStat = checkHindiInString(ocr);
                    console.log('hindiStat :::', hindiStat);
                    if (hindiStat == 'Hindi') {
                        locale = 'hi';
                        filedToUpdate.locale = 'hi';
                        ocrData.locale = 'hi';
                    }
                    matches_array = stringDiffResp[0];
                    console.log('matches_array----', matches_array);
                    let count = 5;
                    const sid = changeToBase13(student_id);
                    const quesId = changeToBase13(qid);
                    if (matches_array.length < count) { count = matches_array.length; }
                    for (let i = 0; i < count; i++) {
                        const question = await QuestionContainer.getByQuestionIdWithUrl(matches_array[i]._id, db);
                        if (question.length > 0 && !question[0].url_text) {
                            question[0].url_text = Utility.ocrToUrl(question[0].ocr_text);
                        }
                        // if(question[0]['subject'] != 'BIOLOGY' || (question[0]['subject'] == 'BIOLOGY' && question[0]['is_answered']==1)){
                        if (question.length > 0) {
                            if (question[0].subject == 'PHYSICS') {
                                phy_count += 1;
                            }
                            if (question[0].subject == 'CHEMISTRY') {
                                chem_count += 1;
                            }
                            if (question[0].subject == 'MATHS') {
                                maths_count += 1;
                            }
                            if (question[0].subject == 'BIOLOGY') {
                                bio_count += 1;
                            }
                            if (question[0].matched_question == null) {
                                question_id = question[0].question_id;
                            } else {
                                question_id = question[0].matched_question;
                            }
                            let { ocr_text } = question[0];
                            let web_url = '';

                            let userLocale = '';

                            if (filedToUpdate.locale == 'hi' && question[0].subject != 'BIOLOGY') {
                                userLocale = '/hindi';
                                if (question[0].hindi != null && question[0].hindi != undefined) {
                                    ocr_text = question[0].hindi;
                                }
                            }
                            console.log('userLocale', userLocale);
                            const sub = Utility.getSubjectLink(question[0].subject.toLowerCase());
                            console.log('subbbbb\n', question[0].subject.toLowerCase());
                            console.log('Ssssssssssssubject', sub);
                            if (question[0].url_text != null && question[0].student_id != '21') {
                                // if (question[0].subject.toLowerCase().includes('physics')) {
                                if (question[0].is_answered == 0 && question[0].is_text_answered == 1) {
                                    web_url = `${Data.urlPrefixAmp}/question-answer${sub}/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                } else {
                                    web_url = `${Data.urlPrefixAmp}/question-answer${sub}/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                }
                                // } else if (question[0].subject.toLowerCase().includes('chemistry')) {
                                //     if (question[0].is_answered == 0 && question[0].is_text_answered == 1) {
                                //         web_url = `https://doubtnut.com/question-answer-chemistry/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                //     } else {
                                //         web_url = `https://amp.doubtnut.com/question-answer-chemistry/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                //     }
                                // } else if (question[0].subject.toLowerCase().includes('biology')) {
                                //     web_url = `https://amp.doubtnut.com/question-answer-biology/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                // } else if (question[0].is_answered == 0 && question[0].is_text_answered == 1) {
                                //     web_url = `https://doubtnut.com/question-answer/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                // } else {
                                //     web_url = `https://amp.doubtnut.com/question-answer/${question[0].url_text}-${question[0].question_id}${userLocale}?utm_source=whatsapp_amp&utm_medium=whatsapp_bot&utm_campaign=questioncount&sid=${sid}&qid=${quesId}`;
                                // }
                            }
                            console.log('web_urlllllllll------>', web_url);
                            // }
                            // console.log("ocr_text------>", ocr_text)
                            const thumbnail = `${config.cdn_url}thumbnail_white/${question_id}.png`;
                            // let thumbnail = ""
                            // if(filedToUpdate["locale"] == "hi")
                            //   thumbnail = config.cdn_url + "thumbnail_white/hi_" + question_id + ".png"
                            // else
                            //   thumbnail = config.cdn_url + "thumbnail_white/" + question_id + ".png"
                            // console.log('thumbnail' , thumbnail)
                            if (question.length > 0) {
                                const url = await generateDeepLink(question[0].question_id, thumbnail, ocr_text, request, config, qid, student_id, web_url, question[0].is_answered, question[0].is_text_answered);
                                const ifExisits = await urlExists(thumbnail);
                                // console.log('---existsss----',i, ifExisits)

                                // urlExists(thumbnail,(err,exists)=>{console.log('--exists--i-->', i ,exists)})

                                const obj = {};
                                obj.thumbnail = thumbnail;
                                obj.url = url.url;
                                obj.isThumbnailAvail = ifExisits;
                                urlArray.push(obj);

                                // utility_redis.expire(db.redis.write,phone+"_whatsapp_lock" , 60);

                                // if(student_id%2==0){
                                console.log('||||||||||||----question istextanswered-----|||||||||||||||', question[0].url_text, '------>>', question[0].is_text_answered);
                                console.log('----question isanswered------', question[0].url_text, '--------->>>', i, question[0].is_answered);
                                if (question[0].is_answered == 0 && question[0].is_text_answered == 1) {
                                    await Utility.sendWhatsAppMessageWithOgTag(phone, `*Open* *text* *solution* 🗒 : 👉${obj.url}`, 'text-solution', config);
                                    const obj4 = {};
                                    obj4.type = 'ogTagSolution_text';
                                    obj4.data = obj.url;
                                    obj4.thumbnail = obj.thumbnail;
                                    obj4.qid = qid;
                                    Utility.whatsAppLogs(phone, obj4);
                                } else {
                                    await Utility.sendWhatsAppMessageWithOgTag(phone, `*Play* *Video* *Solution* ⏯ : 👉 ${obj.url}`, 'video-solution', config);
                                    const obj1 = {};
                                    obj1.type = 'ogTag_solution_video';
                                    obj1.data = obj.url;
                                    obj1.thumbnail = obj.thumbnail;
                                    obj1.qid = qid;
                                    Utility.whatsAppLogs(phone, obj1);
                                }
                                // }
                                // else{
                                //   if(question[0]['is_answered']==0 && question[0]['is_text_answered']==1){
                                //     await Utility.sendImageOnWhatsAppWithCaption(phone , obj.thumbnail , '*Checkout* *Text* *Solution link* ' +(i+1)+'⃣ ⏯:👉'+obj.url,config)
                                //     let obj5 = {}
                                //     obj5.type = 'UsingThumnailSolution_text'
                                //     obj5.data = obj.url
                                //     obj5.thumbnail = obj.thumbnail
                                //     Utility.whatsAppLogs(phone,obj5)
                                //   }
                                //   else{
                                //     await Utility.sendImageOnWhatsAppWithCaption(phone , obj.thumbnail , '*Play* *Video* *Solution link* ' +(i+1)+'⃣ ⏯:👉'+obj.url,config)
                                //     let obj2 = {}
                                //     obj2.type = 'UsingThumnailSolution'
                                //     obj2.data = obj.url
                                //     obj2.thumbnail = obj.thumbnail
                                //     Utility.whatsAppLogs(phone , obj2)
                                //   }
                                // // if(student_id%2==0){

                                // // }
                                // // else{
                                // //   await Utility.sendImageOnWhatsAppWithCaption(phone , obj.thumbnail , '*Play* *Video* *Solution link* ' +(i+1)+'⃣ ⏯:👉'+obj.url,config)
                                // //   let obj2 = {}
                                // //   obj2.type = 'UsingThumnailSolution'
                                // //   obj2.data = obj.url
                                // //   obj2.thumbnail = obj.thumbnail
                                // //   Utility.whatsAppLogs(phone , obj2)
                                // // }

                                // }
                            }
                        }
                        // }
                    }
                    Utility.schedulePdf('WHA', phone, parseInt(student_id), parseInt(qid), matches_array.slice(0, 50).map((x) => x._id));

                    // console.log('physics countttttttttttt -===->>>>>>>>>',phy_count)

                    // 	message.push({"title": "*Play Video* *Solution* *link* "+count+"⃣ ⏯:👉 "+result.data[i]['url'],"description": "*Video* *Solution* *link* :👉 "+result.data[i]['url'],"image": {"url": result.data[i]['thumbnail'],},"type": "image"});

                    // const responseData = {
                    //     meta: {
                    //         code: 200,
                    //         success: true,
                    //         message: 'SUCCESS',
                    //     },
                    //     data: urlArray,
                    //     // "isThird": await utility_redis.checkIfExists(db.redis.read, phone + date + 'wa'),
                    //     ocr: ocr_text,
                    //     error: null,
                    // };

                    // res.status(responseData.meta.code).json(responseData);
                } else {
                    sendYesorNo = 0;
                    // const responseData = {
                    //     meta: {
                    //         code: 200,
                    //         success: true,
                    //         message: 'SUCCESS',
                    //     },
                    //     data: [],
                    //     // "isThird": await utility_redis.checkIfExists(db.redis.read, phone + date + 'wa'),
                    //     ocr: ocr_text,
                    //     error: null,
                    // };
                    // res.status(responseData.meta.code).json(responseData);
                }
            } else {
                // const responseData = {
                //     meta: {
                //         code: 403,
                //         success: false,
                //         message: 'Error in inserting question;Please check parameters',
                //     },
                //     data: null,
                //     // "isThird": await utility_redis.checkIfExists(db.redis.read, phone + date + 'wa'),
                //     error: null,
                // };
                // res.status(responseData.meta.code).json(responseData);
            }
            // change on second and third message
            let waCount = await utility_redis.checkIfExists(db.redis.read, `${phone + date}wa`);
            console.log('waCount', waCount);
            // console.log("waCount", typeof waCount)
            if (waCount == null) {
                waCount = '0';
            }
            await utility_redis.lock(db.redis.write, `${phone + date}wa`, parseInt(waCount) + 1, expire);
            // let xyz = await utility_redis.checkIfExists(db.redis.read , phone+date+'wa')
            // console.log('Ssssssssxoxoxox' , xyz)
            waCount = parseInt(waCount) + 1;
            // console.log('urlArray' , urlArray)
            if (urlArray.length > 0 && sendYesorNo == 1) {
                setTimeout(async () => {
                    await Utility.sendWhatsAppMessage(req.body.phone, 'Kya aapko solution mila? 🤖\n*Yes* OR *No* message karein.', 'solution-feedback', config);
                }, 1000 * 20);
            }

            // if(await utility_redis.checkIfExists(db.redis.read,phone+'isHw') == 1){
            //   console.log('-----hello----')
            //   await utility_redis.lock(db.redis.write,phone+'noReplyForYesNo',1,380)
            //   setTimeout(async () => {
            //     if(await utility_redis.checkIfExists(db.redis.read,phone+'noReplyForYesNo')==1 && parseInt(await utility_redis.checkIfExists(db.redis.read, student_id + 'lastVideoWatched')) != qid){
            //       console.log('--xoxox--')
            //       let msg = "Oops! Lagta hai aapne handwritten question bheja hai. 😔\n\nI am still a learning robot 🤖 \n\n✅ Abhi Maths, Physics & Chemistry  ke questions ki photo book se send karein 😇"
            //       await Utility.sendWhatsAppMessage(phone,msg,config)
            //       await utility_redis.lock(db.redis.write,phone+'noReplyForYesNo',1,300)
            //       await utility_redis.lock(db.redis.write, student_id + 'lastVideoWatched', qid, 180)
            //     }
            //   },300*1000)
            // }

            if (waCount == 1) {
                setTimeout(async () => {
                    // console.log("yoyo", parseInt(await utility_redis.checkIfExists(db.redis.read, student_id + 'lastVideoWatched')))
                    // console.log("qid", qid)
                    if (parseInt(await utility_redis.checkIfExists(db.redis.read, `${student_id}lastVideoWatched`)) != qid) {
                        await utility_redis.lock(db.redis.write, `${student_id}lastVideoWatched`, qid, 180);
                        // Utility.sendWhatsAppMessage(req.body.phone, "Kya solution mai koi problem hai? 🤖 \n\nI am just learning like you. 📚 💻 \n\nPls phir se question pooche. 😊", config)
                        // setTimeout(function () {
                        await Utility.sendImageOnWhatsAppWithCaption(req.body.phone, 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/updatedBanner_rfpkog.png', 'Kya aapne sawaal poochne ke baad video dekhi? 🤖☝', 'skipped-solution', config);
                        const obj = {};
                        obj.type = 'VideoNotWatched';
                        obj.data = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/updatedBanner_rfpkog.png';
                        Utility.whatsAppLogs(phone, obj);
                        //   }).catch(error => {
                        //     console.log(error)
                        //   })
                        // }, 500)
                    }
                }, 300 * 1000);
            }

            // else if (waCount == 2) {
        }

        if (phy_count >= 3) {
            console.log('Physics Question');
            const sub = {};
            sub.subject = 'PHYSICS';
            Question.updateSubject(sub, qid, db.mysql.write).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        }
        if (chem_count >= 3) {
            console.log('Chemistry Question');
            const sub = {};
            sub.subject = 'CHEMISTRY';
            Question.updateSubject(sub, qid, db.mysql.write).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        }
        if (bio_count >= 3) {
            console.log('Biology questions');
            const sub = {};
            sub.subject = 'BIOLOGY';
            Question.updateSubject(sub, qid, db.mysql.write).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        }
        if (maths_count >= 3) {
            console.log('Maths Question');
            const sub = {};
            sub.subject = 'MATHS';
            Question.updateSubject(sub, qid, db.mysql.write).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            });
        }

        if (addToDb) {
            let extension = '.png'; let
                content_type;
            const destination = `${publicPath}/uploads`;
            const options = {
                url: question_image,
                // dest: "../../doubtnut_backSend/api_server/public/uploads"
                dest: destination,
            };
            const { filename } = await download.image(options);
            // console.log("filename", filename)
            if (filename.indexOf('png') !== -1) {
                extension = '.png';
                content_type = 'image/png';
            } else if (filename.indexOf('jpg') !== -1 || filename.indexOf('jpeg') !== -1) {
                extension = '.jpg';
                content_type = 'image/jpg';
            } else {
                extension = '.png';
                content_type = 'image/png';
            }
            const fileName = `upload_${student_id}_${moment().unix()}${extension}`;
            const data = await fs.readFileAsync(filename);
            await Utility.uploadTos3(s3, config.aws_bucket, fileName, data, content_type);
            insertedQuestion.student_id = student_id;
            insertedQuestion.class = 20;
            insertedQuestion.subject = 'MATHS';
            insertedQuestion.book = 'MATHS';
            insertedQuestion.chapter = 'DEFAULT';
            insertedQuestion.question = '';
            insertedQuestion.doubt = 'WHATSAPP';
            insertedQuestion.locale = 'en';
            insertedQuestion.is_skipped = 8;
            insertedQuestion.question_image = fileName;
            await Question.addQuestion(insertedQuestion, db.mysql.write);
        }
    } catch (e) {
        console.log('-->', e);
        const obj = {};
        obj.data = question_image;
        obj.type = 'QuestionCatchError';
        Utility.whatsAppLogs(req.body.phone, obj);
        // await utility_redis.lockWithNoExpire(db.redis.write , phone+'loopCounter' , 'off')//using lock with no expire
        await utility_redis.lock(db.redis.write, `${phone}loopCounter`, 'off', 43200);
        await Utility.sendWhatsAppMessage(req.body.phone, 'Oh no! 😔\n\nLagta hai system mai kuch problem hai.', 'ask-failure', config);
        setTimeout(() => {
            Utility.sendWhatsAppMessage(req.body.phone, 'I am fixing it. Pls kuch der mai try karein! 🙂', 'ask-failure', config).then(() => {

            }).catch((error) => {
                console.log(error);
            });
        }, 1000);
        // res.send({});
    }
}

async function whatsappRating(req, res) {
    const { student_id } = req.body;
    const { question_id } = req.body;
    const { rating1 } = req.body;
    const { rating2 } = req.body;
    const { feedback } = req.body;
    const { report } = req.body;

    const db = req.app.get('db');

    const insertRating = {};

    insertRating.question_id = question_id;
    insertRating.student_id = student_id;
    insertRating.rating1 = rating1;
    insertRating.rating2 = rating2;
    insertRating.feedback = feedback;
    insertRating.report = report;

    try {
        const ratingCheck = await Question.getRating(question_id, student_id, db.mysql.read);
        let ratingInsert = '';

        if (ratingCheck.length == 1) {
            const a = new Date(); // Current date now.
            const b = new Date(ratingCheck[0].created_at);
            const d = (a - b); // Difference in milliseconds.
            if (d >= 300000) {
                ratingInsert = await Question.insertRating(insertRating, db.mysql.write);
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
            ratingInsert = await Question.insertRating(insertRating, db.mysql.write);
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

// async function getByQid(req, res, next) {
//     try {
//     // let db = req.app.get('db')
//         const { qid } = req.query;
//         // get questions
//         const query = (typeof req.query.qid !== 'undefined') ? { qid: req.query.qid } : {};
//         const data = await QuestionAsk.find(query);
//         const responseData = {
//             meta: {
//                 code: 200,
//                 success: true,
//                 message: 'data',
//             },
//             data,
//         };
//         return res.status(responseData.meta.code).json(responseData);
//     } catch (e) {
//         next(e);
//     }
// }

async function getTechnothon(req, res, next) {
    const { year } = req.body;
    const { page } = req.body;
    const db = req.app.get('db');
    const promises = []; const
        response = [];
    try {
        promises.push(Question.getTechnothonQuestions(year, page, 10, db.mysql.read));
        promises.push(Question.getTechnothonQuestionsCount(year, db.mysql.read));
        const resolvedPromises = await Promise.all(promises);
        for (let i = 0; i < resolvedPromises[0].length; i++) {
            const data = await getTotalLikesShare(resolvedPromises[0][i].question_id, db);
            console.log('data:', data);

            data.question_id = resolvedPromises[0][i].question_id;
            data.ocr_text = resolvedPromises[0][i].ocr_text;
            data.chapter = resolvedPromises[0][i].chapter;
            data.url_text = `${resolvedPromises[0][i].url_text}-${resolvedPromises[0][i].question_id}`;
            data.question_no = resolvedPromises[0][i].question_no;
            response.push(data);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: response,
            count: resolvedPromises[1][0].count,
            year: req.body.year,
            error: null,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getMatches(req, res, next) {
    try {
        const question_id = req.query.qid;
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        db = req.app.get('db');
        config = req.app.get('config');

        // get question details
        const questionDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
        if (questionDetails.length > 0) {
            const { ocr_text } = questionDetails[0];
            // const { student_id } = questionDetails[0];
            const { locale } = questionDetails[0];
            const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
            const matches = await QuestionHelper.handleElasticSearchGlobal({ ocr: ocr_text, elasticSearchInstance, elasticIndex: indexName });
            // let matches = await Question_Helper.handleElasticSearchNew({ocr:ocr_text,ocr_type:0},elasticSearchInstance,student_id)
            let matches_array = matches.hits.hits;
            const languages_arrays = await LanguageContainer.getList(db);
            const languages_obj = Utility.getLanguageObject(languages_arrays);
            let language = languages_obj[locale];
            if (typeof language === 'undefined') {
                language = 'english';
            }
            const stringDiffResp = Utility.stringDiffImplementWithKey(matches_array, ocr_text, fuzz, 'ocr_text', language, false);
            matches_array = stringDiffResp[0];
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Matches',
                },
                data: matches_array,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'No data for this question id',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getByOcr(req, res, next) {
    try {
        const ocrText = req.body.ocr_text;
        const { locale } = req.body;
        config = req.app.get('config');
        elasticSearchInstance = req.app.get('elasticSearchInstance');
        db = req.app.get('db');
        const indexName = config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION;
        const matches = await QuestionHelper.handleElasticSearchGlobal({ ocr: ocrText, elasticSearchInstance, elasticIndex: indexName });
        let matches_array = matches.hits.hits;
        const languages_arrays = await LanguageContainer.getList(db);
        const languages_obj = Utility.getLanguageObject(languages_arrays);
        let language = languages_obj[locale];
        if (typeof language === 'undefined') {
            language = 'english';
        }
        const stringDiffResp = Utility.stringDiffImplementWithKey(matches_array, ocrText, fuzz, 'ocr_text', language, false);
        matches_array = stringDiffResp[0];

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Matches',
            },
            data: matches_array,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getYoutubeSearch(req, res, next) {
    const ocr = req.body.ocr;
    const config = req.app.get('config');
    const db = req.app.get('db');
    const youtubeData = {
        question_id: req.body.question_id,
        student_id: req.body.student_id,
        is_show: 0,
        is_click: 0,
    };
    const promises = [];
    promises.push(Question.insertYoutubeStats(db.mysql.write, youtubeData));
    promises.push(QuestionHelper.callYoutubeApi(ocr, utility_redis, config, db));
    let responseData = {
        meta: {
            code: 400,
            success: false,
            message: 'No more results found',
        },
        data: null,
    };
    const resolvedPromises = await Promise.all(promises);
    const youtubeQId = resolvedPromises[0].insertId;
    const youtubeMatches = resolvedPromises[1];

    if (youtubeMatches && Array.isArray(youtubeMatches) && youtubeMatches.length) {
        const updatedYoutubeData = {
            is_show: 1,
        };
        Question.updateYoutubeStats(db.mysql.write, updatedYoutubeData, youtubeQId);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'success',
            },
            data: { youtubeQid: youtubeQId, youtubeMatches },
        };
    }
    res.status(responseData.meta.code).json(responseData);
}

async function getQuestionWatchHistory(req, res, next) {
    try {
        config = req.app.get('config');
        db = req.app.get('db');

        const student_id = req.user.student_id;
        const page = isNaN(parseInt(req.query.page)) ? 1 : parseInt(req.query.page);
        const show_more_page = req.query.show_more_page || 0;

        const limit = 10;
        const offset = (page - 1) * 10;
        const URI = req.baseUrl + req.path;
        const paramList = [];

        if (show_more_page) {
            // handle special code
            //
            //
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { list: [], next_url: '' },
            };

            return res.status(responseData.meta.code).json(responseData);
        }

        let questionHistory = await Question.getQuestionAsked(db.mysql.read, student_id, limit, offset);
        if (questionHistory.length < limit) {
            const archiveLimit = limit - questionHistory.length;
            let archiveOffset;
            if (questionHistory.length == 0) {
                const userQuestionsArchiveCount = await QuestionContainer.getQuestionAskedCountWatchHistoryCompatible(db, student_id);
                archiveOffset = offset - userQuestionsArchiveCount;
            } else {
                archiveOffset = 0;
            }
            const questionAchiveHistory = await Question.getQuestionAskedFromArchive(db.mysql.read, student_id, archiveLimit, archiveOffset);
            questionHistory = [...questionHistory, ...questionAchiveHistory];
        }

        if (questionHistory.length < limit) {
            paramList.push('show_more_page=1');
        } else {
            paramList.push(`page=${page + 1}`);
        }

        let next_url = `${URI}?${paramList.join('&')}`;

        if (questionHistory.length == 0 && page == 1) next_url = '';

        const questionList = questionHistory.map(({ question_id }) => question_id);
        let videoViewStats = [];

        if (questionList.length) {
            // get info from video view stats
            videoViewStats = await Question.getQuestionInfoFromVideoViewStats(db.mysql.read, student_id, questionList);

            const grouped = _.groupBy(videoViewStats, 'parent_id');

            for (let i = 0; i < questionHistory.length; i++) {
                const groupedQuestionId = grouped[questionHistory[i].question_id];
                if ((questionHistory[i].question_image == null && questionHistory[i].ocr_text == null) || (questionHistory[i].ocr_done == 0)) {
                    questionHistory.splice(i, 1);
                    i--;
                    continue;
                }

                if (groupedQuestionId != undefined) {
                    questionHistory[i].is_solution_present = true;
                    questionHistory[i].view_id = groupedQuestionId[0].view_id;
                    // video or text solution was watched
                    if (groupedQuestionId[0].answer_video == 'text') {
                        questionHistory[i].resource_type = 'text';
                    } else questionHistory[i].resource_type = 'video';
                } else {
                    questionHistory[i].is_solution_present = false;
                    questionHistory[i].view_id = null;
                }

                if (questionHistory[i].question_image != null) questionHistory[i].question_image = Data.questionAskUrlPrefix + questionHistory[i].question_image;
                else delete questionHistory[i].question_image;

                questionHistory[i].timestamp_formatted = moment(questionHistory[i].timestamp).format('DD/MM/YY hh:mm A');
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { list: questionHistory, next_url },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

// async function isTechnothlonQuestion(response, ocr_text, db) {
//     // const diffScore = [];
//     for (let j = 0; j < response.length; j++) {
//         let ocr = response[j].ocr_text;
//         ocr = ocr.replace(/<img[^>]*>/g, '');
//         ocr = ocr.replace(/<br\s*\/?>/gi, ' ');
//         console.log(ocr);
//         if (fuzz.partial_ratio(ocr_text, ocr) > 80) {
//             return 1;
//         }
//     }
//     return 0;
// }

async function generateSignedUrlForQuestionAskImage(req, res, next) {
    try {
        db = req.app.get('db');
        const sqs = req.app.get('sqs');
        config = req.app.get('config');
        const timestamp = moment().unix();
        const s3 = req.app.get('s3');
        const signedUrlExpireSeconds = 60 * 60;
        const {
            content_type, file_ext, file_name: client_file_name, udid,
        } = req.body;
        const file_name = `${moment(new Date()).format('YYYY/MM/DD')}/${client_file_name}`;
        // add a question row and get question id;
        let studentId; let
            doubt_id;
        if (udid) {
            studentId = await QuestionHelper.getStudentIdFromUdid(db, udid);
        } else {
            studentId = req.user.student_id;
            studentId = (studentId) ? parseInt(studentId) : 0;
        }
        const studentClass = req.body.class;
        const { subject, chapter } = req.body;
        const { locale } = req.body;

        const ques = req.body.question || 'about to only mathematics';

        const insertedQuestion = {};
        insertedQuestion.student_id = studentId;
        insertedQuestion.class = studentClass;
        insertedQuestion.subject = subject;
        insertedQuestion.book = subject;
        // insertedQuestion.chapter = chapter;
        insertedQuestion.question = Data.question_logging.question_v10;

        insertedQuestion.doubt = ques;
        insertedQuestion.locale = locale;

        const insertQuestionResult = await Question.addQuestionAliasedTable(insertedQuestion, db.mysql.write);
        const question_id = insertQuestionResult.insertId;
        insertedQuestion.uuid = question_id;
        // fire kafka event for insertion
        insertedQuestion.timestamp = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
        insertedQuestion.action = Data.ask_vvs.insert_question;
        // kafka.publish(kafka.topics.askVvs, studentId, { ...insertedQuestion });
        let fileName; let
            fileNameNew;
        if (!_.isEmpty(client_file_name)) {
            const fileNameArray = client_file_name.split('_').join(',').split('.').join(',')
                .split(',');
            const timestampToUse = fileNameArray[2];
            const fileExtToUse = fileNameArray[3];
            doubt_id = timestampToUse ? `${studentId}_${timestampToUse}` : `${studentId}_${timestamp}`;
            fileName = file_name;
            fileNameNew = fileExtToUse ? `${moment(new Date()).format('YYYY/MM/DD')}/uploads_${doubt_id}.${fileExtToUse}`
                : `${moment(new Date()).format('YYYY/MM/DD')}/uploads_${doubt_id}.${file_ext}`;
        } else {
            doubt_id = `${studentId}_${timestamp}`;
            fileName = `upload_${question_id}_${timestamp}${file_ext}`;
            fileNameNew = `${moment(new Date()).format('YYYY/MM/DD')}/uploads_${doubt_id}.${file_ext}`;
        }
        const source = req.body.source || 'NA';
        delete insertedQuestion.question;
        delete insertedQuestion.doubt;
        insertedQuestion.doubt_id = doubt_id;
        insertedQuestion.question_image = fileNameNew;
        insertedQuestion.iteration = Data.question_logging.question_v10;
        insertedQuestion.source = source;
        insertedQuestion.reference_question_id = question_id;
        const event = { data: insertedQuestion, type: 'quesInsert' };

        const myBucket = 'doubtnut-static/images';
        const url = await QuestionHelper.getSignedUrlFromAwsSdk(s3, myBucket, fileName, signedUrlExpireSeconds, content_type);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'signed url is ready',
            },
            data: {
                url,
                file_name: fileName,
                file_name_new: fileNameNew,
                question_id,
                doubt_id,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (error) {
        console.error(error);
        const responseData = {
            meta: {
                code: 500,
                success: false,
                message: error.message,
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getTopicData(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');

        const { student_id, student_class } = req.user;
        const { question_id } = req.params;
        const { version_code } = req.headers;
        const { locale } = req.user;

        let finalRes = [];

        const topicBoosterRedisResponse = await HomepageQuestionMasterRedis.getTopicBoosterByQuestionAndStudentId(db.redis.read, student_id, question_id);
        let topicBoosterData;
        if (!_.isNull(topicBoosterRedisResponse)) {
            topicBoosterData = JSON.parse(topicBoosterRedisResponse);
        } else {
            const questionData = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
            topicBoosterData = await QuestionHelper.getTopicBooster(db, student_id, student_class, question_id, questionData, config, version_code, locale, 3);
        }
        if (topicBoosterData.length) {
            finalRes = topicBoosterData;
        }

        for (let i = 0; i < finalRes.length; i++) {
            const qno = i + 1;
            finalRes[i].heading = (`${Data.topicQuestionHeading(locale)} ${qno}`);
            finalRes[i].background_color = '#ffffff';
            finalRes[i].question_image = finalRes[i].title;
            finalRes[i].image_url = null;
            finalRes[i].solution_text_color = '#000000';
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: finalRes,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next(err);
    }
}

async function getAvailableFiltersByFilterType(req, res, next) {
    try {
        db = req.app.get('db');
        const { filter_type } = req.params;
        const { student_class, subject } = req.query;
        elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const sClass = student_class;
        let data = [];
        let esResponse;

        switch (filter_type) {
            case 'CHAPTERS':
                esResponse = await elasticSearchTestInstance.getAggAvailableChapters(sClass, subject);
                data = esResponse.aggregations.distinct_chapters.buckets;
                data = data.map((elem) => ({ chapter_alias: elem.key, display: elem.key.toUpperCase() }));
                break;
            case 'SUBJECTS':
                esResponse = await elasticSearchTestInstance.getAggAvailableSubjects(sClass);
                data = esResponse.aggregations.distinct_subjects.buckets;
                break;
            case 'EXAMS':
                esResponse = await elasticSearchTestInstance.getAggAvailableExams(sClass);
                data = esResponse.aggregations.distinct_subjects.buckets;
                break;
            case 'BOOKS':
                esResponse = await elasticSearchTestInstance.getAggStudentIdsContent(sClass, subject);
                data = esResponse.aggregations.distinct_book_ids.buckets;
                const student_ids = [];
                for (let i = 0; i < data.length; i++) {
                    student_ids.push(data[i].key);
                }
                const no_sql = `select student_id,package from studentid_package_mapping_new where student_id in (${student_ids.join()})`;
                data = await db.mysql.read.query(no_sql);
                break;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
    }
}

async function getFilteredResults(req, res, next) {
    try {
        db = req.app.get('db');
        let data;
        elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        let { filter_type, ocr_text } = req.body;
        if (_.isEmpty(ocr_text)) {
            ocr_text = '';
        }
        const {
            student_class, subject, chapter, exam,
        } = req.body;

        if (filter_type == 'BOOKS') {
            const book_id = req.body.book_id;
            const results = await elasticSearchTestInstance.getByBookId(book_id, ocr_text);
            data = results.hits.hits;
        } else if (filter_type === 'CHAPTERS') {
            if (!chapter) {
                throw 'CHAPTER FILTER - CHAPTER PARAMETER IS REQUIRED';
            }
            const results = await elasticSearchTestInstance.getByGlobalFilter(student_class, subject, chapter, exam, ocr_text);
            data = results.hits.hits;
        } else if (filter_type === 'SUBJECTS') {
            if (!subject) {
                throw 'SUBJECT FILTER - SUBJECT PARAMETER IS REQUIRED';
            }
            const results = await elasticSearchTestInstance.getByGlobalFilter(student_class, subject, chapter, exam, ocr_text);
            data = results.hits.hits;
        } else if (filter_type === 'CLASSES') {
            if (!student_class) {
                throw 'CLASS FILTER - CLASS PARAMETER IS REQUIRED';
            }
            const results = await elasticSearchTestInstance.getByGlobalFilter(student_class, subject, chapter, exam, ocr_text);
            data = results.hits.hits;
        } else if (filter_type === 'EXAMS') {
            if (!exam) {
                throw 'EXAM FILTER - EXAM PARAMETER IS REQUIRED';
            }
            const results = await elasticSearchTestInstance.getByGlobalFilter(student_class, subject, chapter, exam, ocr_text);
            data = results.hits.hits;
        } else {
            throw 'NOT A VALID FILTER TYPE';
        }

        data = data.map((elem) => ({ ...elem, _source: { ...elem._source, web_ocr_url: Utility.ocrToUrl(elem._source.ocr_text) } }));
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'FAILURE',
            },
            data: err,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getTopQuestionsWeb(req, res) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const topQuestions = await QuestionMysql.getTopQuestionsWeb(db.mysql.read, 10);
        const data = topQuestions.map((item) => ({
            question_id: item.question_id,
            ocr_text: item.ocr_text,
            web_url: item.canonical_url,
            subject: item.subject,
            thumbnail_image: `${config.staticCDN}q-thumbnail/${item.question_id}.png`,
        }));
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
    }
}

function getBreadcrumbsPage({
    studentClass,
    subject,
    chapter,
}) {
    if (chapter) {
        return 'CHAPTER';
    }
    if (subject) {
        return 'SUBJECT';
    }
    if (studentClass) {
        return 'CLASS';
    }
    return 'LANGUAGE';
}

function getBreadcrumbText(text, page, key) {
    if (page === 'LANGUAGE') {
        if (key) {
            return Data.breadcrumbs_web.languageMapping[text];
        }
        return `CLASS ${text}`;
    }
    if (page === 'CLASS') {
        if (key) {
            return `CLASS ${text}`;
        }
    }
    return text;
}

function findIfSelected(text, page, pageValues) {
    const { language, studentClass, subject } = pageValues;
    if (page === 'LANGUAGE') {
        return text === language;
    }
    if (page === 'CLASS') {
        return +text === +studentClass;
    }
    if (page === 'SUBJECT') {
        return text === subject;
    }
    return false;
}

function getBreadcrumbs({
    language,
    studentClass,
    subject,
    chapter,
    chapterTrans,
    tab,
    page,
}) {
    const pages = [{ filter: language, page: 'LANGUAGE' }, { filter: studentClass, page: 'CLASS' }, { filter: subject, page: 'SUBJECT' }, { filter: chapter, page: 'CHAPTER' }];
    console.log(pages);
    const items = [];
    for (let i = 0; i < pages.length; i++) {
        const item = {};
        if (!pages[i].filter) break;
        item.filter_id = pages[i].filter;
        if (pages[i].page === 'LANGUAGE') {
            item.filter_key = 'language';
            item.text = Data.breadcrumbs_web.languageMapping[pages[i].filter];
        } else if (pages[i].page === 'CLASS') {
            item.filter_key = 'class';
            item.text = `Class ${pages[i].filter}`;
        } else if (pages[i].page === 'SUBJECT' || pages[i].page === 'CHAPTER') {
            item.text = pages[i].filter.toUpperCase();
            if (pages[i].page === 'SUBJECT') {
                item.filter_key = 'subject';
            } else {
                item.filter_key = 'chapter';
            }
            if (pages[i].page === 'CHAPTER') {
                item.filter_id = chapterTrans || item.filter_id;
            }
        }
        items.push(item);
    }
    if (page === 'CHAPTER') {
        items.push({
            text: tab === 'all' ? 'Latest Video Solutions' : 'Videos',
        });
    }
    return items;
}

async function getUptoSubjectLevelBreadcrumbs({
    db,
    page,
    language,
    studentClass,
    subject,
    filterKey,
    filterValue,
}) {
    let filterKeyArray = [];
    let filterValueArray = [];
    const defaultSubject = {};

    if (page === 'LANGUAGE') {
        filterKeyArray = await QuestionRedis.getLanguageBreadcrumbs(db.redis.read);
        filterValueArray = await QuestionRedis.getClassesBreadcrumbsUsingLanguage(db.redis.read, language);
        const classes = JSON.parse(filterValueArray);
        for (let i = 0; i < classes.length; i++) {
            const defaultSubjects = await QuestionRedis.getSubjectBreadcrumbsFromLanguageClass(db.redis.read, language, classes[i]);
            const defaultSubjectsArr = JSON.parse(defaultSubjects);
            if (defaultSubjectsArr.includes('MATHS')) {
                defaultSubject[classes[i]] = 'MATHS';
            } else {
                defaultSubject[classes[i]] = defaultSubjectsArr[0];
            }
        }
    } else if (page === 'CLASS') {
        filterKeyArray = await QuestionRedis.getClassesBreadcrumbsUsingLanguage(db.redis.read, language);
        filterValueArray = await QuestionRedis.getSubjectBreadcrumbsFromLanguageClass(db.redis.read, language, studentClass);
    } else if (page === 'SUBJECT') {
        filterKeyArray = await QuestionRedis.getSubjectBreadcrumbsFromLanguageClass(db.redis.read, language, studentClass);
        filterValueArray = await QuestionRedis.getChapterBreadcrumbsFromLanguageClassSubject(db.redis.read, language, studentClass, subject);
    }
    if (filterKeyArray) {
        filterKeyArray = JSON.parse(filterKeyArray);
    }
    if (filterValueArray) {
        filterValueArray = JSON.parse(filterValueArray);
    }
    if (page === 'SUBJECT') {
        filterValueArray = _.uniqBy(filterValueArray, 'chapter');
    }
    filterValueArray = filterValueArray.filter((item) => item.chapter !== '');
    if (_.isNull(filterKeyArray) || _.isNull(filterValueArray)) {
        throw new Error('No page found');
    }
    const filterKeys = [];

    filterKeyArray.forEach((item) => {
        const text = getBreadcrumbText(item, page, true);
        const is_selected = findIfSelected(item, page, { language, studentClass, subject });
        let image;
        if (page === 'SUBJECT') {
            image = buildStaticCdnUrl(Data.breadcrumbs_web.subjectIconMapping[text.toUpperCase()]);
        }

        filterKeys.push({
            filter_key: filterKey,
            filter_id: item.toUpperCase(),
            text: text.toUpperCase(),
            is_selected,
            image,
        });
    });
    const filterValues = [];
    filterValueArray.forEach((item) => {
        const text = getBreadcrumbText(page === 'SUBJECT' ? item.chapter : item, page, false);
        let image;
        if (page === 'CLASS') {
            image = buildStaticCdnUrl(Data.breadcrumbs_web.subjectIconMapping[text.toUpperCase()]);
        }
        filterValues.push({
            filter_key: filterValue,
            filter_id: page === 'SUBJECT' ? item.chapter_trans.toUpperCase() : item.toUpperCase(),
            ...(page === 'LANGUAGE' && { default_subject: defaultSubject[item] }),
            text: text.toUpperCase(),
            image,
        });
    });
    if (page === 'CLASS') {
        filterKeys.sort((item1, item2) => +item2.filter_id - +item1.filter_id);
    }
    if (page === 'LANGUAGE') {
        filterValues.sort((item1, item2) => +item2.filter_id - +item1.filter_id);
    }
    const breadcrumbs = getBreadcrumbs({
        page,
        language,
        studentClass,
        subject,
    });
    const items = [{
        type: 'breadcrumbs',
        data: breadcrumbs,
    }, {
        type: 'breadcrumb_filters',
        data: filterKeys,
    }, {
        type: 'breadcrumb_values',
        data: filterValues,
    }];
    return items;
}

async function getChapterLevelDetails({
    db,
    language,
    studentClass,
    subject,
    chapter,
    offset,
    limit,
    tab,
    config,
    page,
    pageNo = 1, // * page number for pagination
}) {
    let questions = await QuestionRedis.getQuestionIDsFromLanguageClassSubjectChapterTrans(db.redis.read, language, studentClass, subject, chapter);
    let chapterTrans;
    if (questions) {
        questions = JSON.parse(questions);
        chapterTrans = chapter;
    } else {
        questions = await QuestionRedis.getQuestionIDsFromLanguageClassSubjectChapter(db.redis.read, language, studentClass, subject, chapter);
        questions = questions ? JSON.parse(questions) : null;
        if (questions) {
            const chapterTransResult = await QuestionMysql.getChapterTransNameFromChapterName(db.mysql.read, chapter);
            if (chapterTransResult && chapterTransResult.length) {
                chapterTrans = chapterTransResult[0].chapter_trans;
            }
        }
    }
    if (_.isNull(questions)) {
        throw new Error('No page found');
    }
    const chapterAliasName = await QuestionMysql.getChapterNameFromChapterTrans(db.mysql.read, chapter);
    if (chapterAliasName && chapterAliasName.length) {
        chapter = chapterAliasName[0].chapter;
    }
    const videos = await QuestionMysql.getQuestionDetailsForWeb(db.mysql.read, questions.questionIds);
    const totalPages = Math.ceil(questions.size / limit);
    const offsetVideos = [];
    for (let i = offset; i < (offset + limit) && i < videos.length; i++) {
        const views = await QuestionContainer.getTotalViews(videos[i].question_id, db);
        videos[i].total_views = views[0].total_count;
        videos[i].locale = Data.breadcrumbs_web.languageMapping[videos[i].locale];
        videos[i].asked_count_text = `${Math.floor(Math.random() * (300) + (200))}+ asked`;
        videos[i].thumbnail_image = `${config.staticCDN}q-thumbnail/${videos[i].question_id}.png`;
        if (!videos[i].canonical_url) {
            videos[i].canonical_url = `${Utility.ocrToUrl(videos[i].ocr_text)}-${videos[i].question_id}`;
        }
        offsetVideos.push(videos[i]);
    }
    const latestVideos = videos.splice(0, 5);
    const items = [];
    const breadcrumbs = getBreadcrumbs({
        language,
        studentClass,
        subject,
        chapter,
        chapterTrans,
        tab,
        page,
    });
    items.push({
        type: 'breadcrumbs',
        items: breadcrumbs,
    });
    if (offset === 0 && tab !== 'all') {
        items.push({
            type: 'latest_videos',
            title: `Latest Video Solutions of ${chapter}`,
            data: latestVideos,
            button: {
                text: 'See All',
                filter_key: 'tab',
                filter_id: 'all',
            },
        });
    }
    items.push({
        type: 'chapter_videos',
        title: `${chapter} Solutions`,
        data: offsetVideos,
        current_page: +pageNo,
        total_pages: totalPages,
    });
    return items;
}

async function getBreadcrumbsWeb(req, res) {
    try {
        const db = req.app.get('db');
        config = req.app.get('config');
        let {
            language,
            class: studentClass,
            subject,
            chapter,
        } = req.query;
        const {
            page: pageNo,
            tab,
        } = req.query;
        const limit = 10;
        const offset = ((pageNo || 1) - 1) * limit;
        const page = getBreadcrumbsPage({
            language,
            studentClass,
            subject,
            chapter,
        });
        if (!language) {
            language = 'en';
        }
        language = language.toLowerCase();
        if (subject) subject = subject.toLowerCase();
        if (chapter) chapter = chapter.toLowerCase();
        if (+studentClass === 12 && !subject) {
            let foundData = false;
            // * For default case or fallbacks, if class 12 does not have maths chapters, then check the chapters in physics
            // * If chapters are not present in physics, then check in class 11 -> maths, if not class 11 -> physics
            const doesClassHaveSubjects = await QuestionRedis.getSubjectBreadcrumbsFromLanguageClass(db.redis.read, language, studentClass);
            if (doesClassHaveSubjects) {
                subject = subject || 'MATHS';
                let doesSubjectHaveChapters = await QuestionRedis.getChapterBreadcrumbsFromLanguageClassSubject(db.redis.read, language, studentClass, subject);
                if (!doesSubjectHaveChapters) {
                    subject = 'PHYSICS';
                    doesSubjectHaveChapters = await QuestionRedis.getChapterBreadcrumbsFromLanguageClassSubject(db.redis.read, language, studentClass, subject);
                    foundData = !!doesSubjectHaveChapters;
                } else {
                    foundData = true;
                }
            }
            if (!foundData) {
                studentClass = 11;
                subject = 'MATHS';
                const doesSubjectHaveChapters = await QuestionRedis.getChapterBreadcrumbsFromLanguageClassSubject(db.redis.read, language, studentClass, subject);
                if (!doesSubjectHaveChapters) {
                    subject = 'PHYSICS';
                }
            }
        }
        if (!subject) {
            subject = 'MATHS';
        }
        const response = {
            meta: {
                code: 200,
                message: 'success',
            },
        };
        switch (page) {
            case 'LANGUAGE':
                response.data = await getUptoSubjectLevelBreadcrumbs({
                    db,
                    page,
                    language,
                    filterKey: 'language',
                    filterValue: 'class',
                });
                break;
            case 'CLASS':
                response.data = await getUptoSubjectLevelBreadcrumbs({
                    db,
                    page,
                    language,
                    studentClass,
                    filterKey: 'class',
                    filterValue: 'subject',
                });
                break;
            case 'SUBJECT':
                response.data = await getUptoSubjectLevelBreadcrumbs({
                    db,
                    page,
                    language,
                    studentClass,
                    subject,
                    filterKey: 'subject',
                    filterValue: 'chapter',
                });
                break;
            case 'CHAPTER':
                response.data = await getChapterLevelDetails({
                    db,
                    language,
                    studentClass,
                    page,
                    subject,
                    chapter,
                    offset,
                    limit,
                    tab,
                    config,
                    pageNo,
                });
                break;
            default:
                console.log('No page found');
                break;
        }
        return res.status(response.meta.code).json(response);
    } catch (e) {
        console.log(e);
        return res.status(404).json({
            meta: {
                code: 404,
                message: e.message,
            },
        });
    }
}

async function getSrpWidgets(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    let returnResponse = {};

    const packageValue = req.headers.package_name;

    const isFreeApp = packageValue === altAppData.freeAppPackageName;
    if (isFreeApp) {
        return next({ data: returnResponse });
    }

    try {
        const { student_id: studentId, student_class: studentClass, locale } = req.user;
        const { question_id: questionId } = req.query;
        const versionCode = req.headers.version_code;
        let flagrFlow = 0;
        const widgetObj = {};
        let showData = false;
        const classArr = [11, 12, 13];
        const allowedCcmIds = [10912, 11012, 11308, 11480, 11481, 10910, 11010, 11101, 11201, 11301, 10903, 11003, 11103, 11203, 11303, 11111, 11211, 11307, 11478, 11479];
        let v2Exp = false;

        if (versionCode >= 1010) {
            const d0UserManager = new D0UserManager(req);
            if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                return next({ data: {} });
            }
        }

        let flagVariantsArr = ['1'];
        // if getting show more variant send empty results
        if (!_.isNull(req.headers.flagr_variation_ids) && !_.isEmpty(req.headers.flagr_variation_ids)) {
            flagVariantsArr = req.headers.flagr_variation_ids.split(',');
            if ((flagVariantsArr.includes('1360'))) {
                next({ data: {} });
            } else {
                showData = true;
            }
        } else {
            showData = true;
        }

        if (showData) {
            // for getting flagr data.
            const flagrName = 'srp_widget_v2';
            // if (versionCode >= 992) {
            //     flagrName = 'srp_widget_v2';
            // }

            const flgrData = { body: { capabilities: { [flagrName]: {} }, entityId: studentId } };
            const flagrResponse = await UtilityFlagr.getFlagrResp(flgrData);

            if (flagrResponse != undefined && flagrResponse[flagrName].enabled && flagrResponse[flagrName].payload.enabled) {
                flagrFlow = flagrResponse[flagrName].payload.variant;
            }

            if (flagrFlow !== 0) {
                /*

                1) get asked questions number from questions_new
                2) get last 30 days of engagement time from gunj's api
                3) get old flow from redis. if not found assign empty string
                4) get session from redis. If not found assign session 1
                5) get flagr call response for the flow
                6) get last asked question details
                promise call for these 6 options

                Non-Qualifing measuremnts --- QA less than 3 AND ET less than 10 mins or 600 seconds.

                case 1 : QA is 3 or greater than and ET is 600 or greater than
                case 2 : QA is less than 3 and ET is less than 600
                case 3 : QA is less than 3 and ET is 600 or greater than
                case 4 : QA is 3 or greater than and ET is less than 600

                if old flow not found or not matched with current flow, store into redis
                store session into redis

                */

                const preStartingPromiseArr = [];

                // for the data of last 10 asked questions.
                preStartingPromiseArr.push(StudentContainer.getAskedQuestions(db, studentId));

                // for the data of engagement time for last 30 days.
                preStartingPromiseArr.push(freeClassHelper.getLast30DaysEngagement(studentId));

                // for getting current flow.
                preStartingPromiseArr.push(StudentRedis.getSrpFlow(db.redis.read, studentId));

                // for getting total number of sessions.
                preStartingPromiseArr.push(StudentRedis.getSrpSession(db.redis.read, studentId));

                // for last asked question details
                preStartingPromiseArr.push(QuestionContainer.getLastAskedDetails(db, questionId));

                const preStartingData = await Promise.all(preStartingPromiseArr);

                const askedQuestionData = preStartingData[0];
                const last30DaysEngagementData = preStartingData[1];
                const oldFlowData = preStartingData[2];
                const totalSessionData = preStartingData[3];
                const lastAskedQuestionData = preStartingData[4];

                const last30DaysEngagementInMins = Math.floor(last30DaysEngagementData / 60);

                const srpWidgetManager = new SrpWidgetManager(req);

                let oldFlow = '';
                if (!_.isNull(oldFlowData)) {
                    oldFlow = oldFlowData;
                }

                let totalSession = 1;
                if (!_.isNull(totalSessionData)) {
                    totalSession = totalSessionData;
                }

                let currentFlow = oldFlow;

                if (lastAskedQuestionData.length > 0 && lastAskedQuestionData[0].chapter && lastAskedQuestionData[0].subject) {
                    let { subject, chapter } = lastAskedQuestionData[0];
                    chapter = chapter.trim();
                    const subjectArr = ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];

                    if (studentClass >= 6 && studentClass <= 10 && subjectArr.includes(subject.toUpperCase())) {
                        subject = 'SCIENCE';
                    }

                    let chapterAlias = '';
                    // fetching chapter alias of the chapter
                    const chapterAliasResponse = await QuestionContainer.getChapterAliasData(db, chapter);
                    if (!_.isEmpty(chapterAliasResponse) && chapterAliasResponse[0] !== undefined && chapterAliasResponse[0].chapter_alias !== '' && chapterAliasResponse[0].chapter_alias != null) {
                        chapterAlias = chapterAliasResponse[0].chapter_alias.trim();
                    }

                    const widgetDataPromiseArr = [];
                    const uninstallWidgetPromiseArr = [];

                    // assigning data
                    srpWidgetManager.subject = subject;
                    srpWidgetManager.flagrFlow = flagrFlow;
                    srpWidgetManager.currentFlow = currentFlow;
                    srpWidgetManager.totalSession = totalSession;
                    srpWidgetManager.chapter = chapter;
                    srpWidgetManager.chapterAlias = chapterAlias;
                    srpWidgetManager.allowedCcmIds = allowedCcmIds;
                    srpWidgetManager.widgetDataPromiseArr = widgetDataPromiseArr;
                    srpWidgetManager.uninstallWidgetPromiseArr = uninstallWidgetPromiseArr;
                    srpWidgetManager.lastAskedQuestionData = lastAskedQuestionData;

                    const indexPositionMapping = {
                        0: 4,
                        1: 9,
                        2: 14,
                        3: 19,
                    };
                    const uninstallWidgetPositioning = {
                        0: 20,
                        1: 21,
                        2: 22,
                    };

                    if (versionCode >= 1007 && req.user.campaign) {
                        const campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'SRP');
                        if (campaignDetails.length > 0) {
                            widgetDataPromiseArr.push(srpWidgetManager.popularCoursesWidget());
                        }
                    }

                    if (flagrFlow == 1) {
                        if (askedQuestionData >= 3 && last30DaysEngagementInMins >= 10) {
                            // case 1
                            currentFlow = 'case 1';
                            console.log('currentFlow ::: ', currentFlow);

                            srpWidgetManager.flow = currentFlow;
                            srpWidgetManager.addingCaseOneTypes();
                        } else if (askedQuestionData < 3 && last30DaysEngagementInMins < 10) {
                            // case 2
                            currentFlow = 'case 2';
                            console.log('currentFlow ::: ', currentFlow);

                            srpWidgetManager.flow = currentFlow;
                            srpWidgetManager.addingCaseTwoTypes();
                        } else if (askedQuestionData >= 3 && last30DaysEngagementInMins < 10) {
                            // case 3
                            currentFlow = 'case 3';
                            console.log('currentFlow ::: ', currentFlow);

                            srpWidgetManager.flow = currentFlow;
                            srpWidgetManager.addingCaseOneTypes();
                        } else if (askedQuestionData < 3 && last30DaysEngagementInMins >= 10) {
                            // case 4
                            currentFlow = 'case 4';
                            console.log('currentFlow ::: ', currentFlow);

                            srpWidgetManager.flow = currentFlow;
                            srpWidgetManager.addingCaseTwoTypes();
                        }
                    } else if (flagrFlow == 2) {
                        v2Exp = true;
                    } else if (flagrFlow == 3 && askedQuestionData >= 8) {
                        v2Exp = true;
                    }

                    if (v2Exp) {
                        if (last30DaysEngagementInMins >= 20) {
                            // case 1
                            currentFlow = 'case 1';
                            console.log('currentFlow ::: ', currentFlow);

                            srpWidgetManager.flow = currentFlow;
                            srpWidgetManager.addingV2CaseOneTypes();
                        } else {
                            // case 2
                            currentFlow = 'case 2';
                            console.log('currentFlow ::: ', currentFlow);

                            srpWidgetManager.flow = currentFlow;
                            srpWidgetManager.addingV2CaseTwoTypes();
                        }
                    }

                    if (versionCode >= 989) {
                        const p2pGroupExists = await P2pMySql.p2pGroupExistsForQuestionId(db.mysql.read, studentId, questionId);
                        if (!p2pGroupExists[0].EXIST) {
                            uninstallWidgetPromiseArr.push(srpWidgetManager.makeP2pWidget());
                        }
                        const feedbackExists = await StudentMongo.studentFeedbackForQuestionId(db.mongo.read, studentId, questionId);
                        if (_.isEmpty(feedbackExists)) {
                            uninstallWidgetPromiseArr.push(srpWidgetManager.makeFeedbackWidget());
                        }
                        // uninstallWidgetPromiseArr.push(await srpWidgetManager.makeIconListWidgetForMatchPage());
                    }

                    let widgetDataPromise = [];
                    if (srpWidgetManager.widgetDataPromiseArr.length > 0) {
                        widgetDataPromise = await Promise.all(srpWidgetManager.widgetDataPromiseArr);
                    }
                    let uninstallWidgetData = await Promise.all(srpWidgetManager.uninstallWidgetPromiseArr);
                    if (widgetDataPromise.length > 0 || uninstallWidgetData.length > 0) {
                        widgetDataPromise = widgetDataPromise.filter((x) => x && Object.keys(x).length !== 0);
                        widgetDataPromise.forEach((x, i) => {
                            widgetObj[indexPositionMapping[i]] = x;
                        });
                        uninstallWidgetData = uninstallWidgetData.filter((x) => x && Object.keys(x).length !== 0);
                        uninstallWidgetData.forEach((x, i) => {
                            widgetObj[uninstallWidgetPositioning[i]] = x;
                        });

                        if (currentFlow != oldFlow && flagrFlow != 0) {
                            console.log('changing flow');
                            // call flow store redis
                            StudentRedis.setSrpFlow(db.redis.write, studentId, currentFlow);
                            // increase session
                            StudentRedis.setSrpSession(db.redis.write, studentId, 1);
                        } else if (Object.keys(widgetObj).length !== 0) {
                            console.log('increasing session');
                            // increase session
                            StudentRedis.setSrpSession(db.redis.write, studentId, ++totalSession);
                        }

                        returnResponse = {
                            nudges: widgetObj,
                        };
                        next({ data: returnResponse });
                    } else {
                        next({ data: {} });
                    }
                } else {
                    next({ data: {} });
                }
            } else {
                next({ data: {} });
            }
        }
    } catch (e) {
        console.log(e);
        next({ err: e });
    }
}

async function assignSkipForTagging(req, res, next) {
    try {
        const db = req.app.get('db');
        const { questionId, expertId, status } = req.body;
        const mcTagObj = {
            question_id: questionId,
            expert_id: expertId,
            status,
        };
        let returnResponse = {};
        const promise = [];
        if (status === '0') {
            promise.push(Question.insertIntoMcTaggingQuestion(
                db.mysql.write,
                mcTagObj,
            ));
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    message: `Question ${questionId} assigned successfully`,
                },
            };
        } else if (status === '2') {
            promise.push(Question.updateMcTaggingStatus(
                db.mysql.write,
                expertId,
                status,
                questionId,
            ));
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    message: `Question ${questionId} skiped successfully`,
                },
            };
        }
        await Promise.all(promise);
        res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        next(e);
    }
}
async function getMcTags(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            studentId,
            locale,
            questionClass,
            questionSubject,
            chapter,
            subtopic,
            type,
        } = req.body;
        let returnResponse = {};
        if (type === 'get_languages') {
            const languages = await Question.getDistinctLanguageForStudentId(
                db.mysql.read,
                studentId,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: languages,
            };
        }
        if (type === 'get_subjects') {
            const subjects = await Question.getDistinctSubjectsForLanguage(
                db.mysql.read,
                studentId,
                locale,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: subjects,
            };
        }
        if (type === 'get_classes') {
            const classes = await Question.getDistinctClassesForSubject(
                db.mysql.read,
                questionSubject,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: classes,
            };
        }
        if (type === 'get_chapters') {
            const chapters = await Question.getDistinctChaptersForClass(
                db.mysql.read,
                questionClass,
                questionSubject,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: chapters,
            };
        }
        if (type === 'get_subtopics') {
            const subtopics = await Question.getDistinctSubtopicsForChapter(
                db.mysql.read,
                questionClass,
                questionSubject,
                chapter,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: subtopics,
            };
        }
        if (type === 'get_microconcepts') {
            const microconcepts = await Question.getDistinctMicroConceptForSubtopics(
                db.mysql.read,
                questionClass,
                questionSubject,
                chapter,
                subtopic,
            );
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: microconcepts,
            };
        }
        res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        next(e);
    }
}
async function addMcTagging(req, res, next) {
    try {
        const db = req.app.get('db');
        const {
            questionId, expertId, status, questionClass, chapter, subtopic, microconcept,
        } = req.body;
        const questionObj = {
            question_id: questionId,
            intern_id: expertId,
            assigned_to: expertId,
            class: questionClass,
            chapter,
            subtopic,
            microconcept,
        };
        const promise = [];
        const isQuestion = await Question.getQuestionMeta(
            questionId,
            db.mysql.read,
        );
        let returnResponse = {};
        if (!_.isEmpty(isQuestion)) {
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'FAILED',
                },
                data: `Question id ${questionId} have already tagged in`,
            };
        } else {
            promise.push(Question.updateMcTaggingStatus(
                db.mysql.write,
                expertId,
                status,
                questionId,
            ));
            promise.push(Question.insertQuestionToQuestionsMata(
                db.mysql.write,
                questionObj,
            ));
            await Promise.all(promise);
            returnResponse = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: `Question Id ${questionId} tagged successfully`,
            };
        }
        res.status(returnResponse.meta.code).json(returnResponse);
    } catch (e) {
        next(e);
    }
}

module.exports = {
    askWhatsApp,
    generateSignedUrlForQuestionAskImage,
    whatsAppLogs,
    whatsappRating,
    getTechnothon,
    getMatches,
    getByOcr,
    getQuestionWatchHistory,
    getYoutubeSearch,
    getTopicData,
    getAvailableFiltersByFilterType,
    getFilteredResults,
    getTopQuestionsWeb,
    getBreadcrumbsWeb,
    getSrpWidgets,
    assignSkipForTagging,
    getMcTags,
    addMcTagging,
};
