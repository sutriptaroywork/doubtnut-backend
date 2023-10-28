/* eslint-disable no-shadow */

/*
 * @Author: XesLoohc
 * @Email: god@xesloohc.com
 * @Date: 2019-01-11 13:33:31
 * @Last modified by: Abhishek Sinha
 * @Last modified date: 2019-12-11
 */

const formidable = require('formidable');
const request = require('request');
const rp = require('request-promise');
const raw_request = require('request').defaults({ encoding: null });
const hyphenize = require('hyphenize');
const base64 = require('base-64');
const Enum = require('enum');
const Jimp = require('jimp');
const http = require('https');
const cheerio = require('cheerio');
const Chance = require('chance');
const axios = require('axios');
const inst = require('./axiosInstances');
const md5 = require('md5');
const utf8 = require('utf8');
const geoip = require('geoip-lite');
const validator = require('validator');

const form = new formidable.IncomingForm();
form.encoding = 'utf-8';
form.uploadDir = '/uploads';
form.maxFieldsSize = 20 * 1024 * 1024;
form.multiples = false;
form.type = true;
form.keepExtensions = true;
const vision = require('@google-cloud/vision');
const translate = require('google-translate-api');
const _ = require('lodash');
const moment = require('moment');
// const ursa = require("ursa"); // for rsa encryption and decryption
const fs = require('fs'); // for file scan
const path = require('path');
const fuzz = require('fuzzball');
// const Notification = require('./notifications');
const randomstring = require('randomstring');
const mysqlStudent = require('./mysql/student');
const StudentCourseMapping = require('./studentCourseMapping');
const telemetry = require('../config/telemetry');
const ClassCourseMapping = require('./classCourseMapping');
const NotificationConstants = require('./constants/notifications');
const UtilityFlagr = require('./Utility.flagr');
const kafka = require('../config/kafka');
const StudentRedis = require('./redis/student');
const GuestLoginPopupData = require('../data/data.guestLogin').pop_up_data;

// const FeedContainer = require('../modules/containers/feed')
// const CommentContainer = require('../modules/containers/comment')
// const MysqlFeed = require('../modules/mysql/feed')

const Data = require('../data/data');
const languageTranslations = require('./languageTranslations.js');
// require('../modules/mongo/comment')
// const bluebird = require("bluebird");
// const mongoose = require("mongoose");
// bluebird.promisifyAll(mongoose);
// const Comment = mongoose.model("Comment");
// Instantiate Chance so it can be used
const chance = new Chance();
const publicPath = path.join(__dirname, '..', '..', '..', 'public');
const WhatsAppMessageModel = require('./mongo/whatsapp');
const WhatsappNetcoreModel = require('./mongo/whatspp.netcore');
const ScheduledPdf = require('./mongo/scheduledPdf');
const logger = require('../config/winston').winstonLogger;
const config = require('../config/config');
const SubjectPersonalisation = require('./redis/SubjectPersonalisation');
const StudentPersonalisation = require('./redis/studentPersonalisation');
// const QuestionHelper = require('../server/helpers/question.helper');
// const QuestionMysql = require('./mysql/question');
const QuestionContainerV2 = require('./containers/questionv2');
const QuestionRedis = require('./redis/question');
const ViserOcrBatchApi = require('../server/helpers/question/ocr.viser.batch.helper');

const EngagementType = new Enum([
    'news',
    'pdf',
    'polling',
    'product_features',
    'tips',
    'url',
    'viral_videos',
    'youtube',
]);

// const QuestionType = new Enum(['answered', 'matched', 'unanswered']);

const searchLink = 'https://www.youtube.com/results?search_query=';

module.exports = class Utility {
    static whatsappDeeplinkTokenizer(qid) {
        const temp = qid.split(':');
        return [temp[0], temp[1], temp[2]];
    }

    static getFieldNameForTranslate(locale) {
        const supported_languages = ['hi'];
        if (supported_languages.includes(locale)) {
            return `ocr_text_${locale}`;
        }
        return 'ocr_text';
    }

    static isEligibleForAbTesting(student_id) {
        if (student_id % 2 == 0) {
            return true;
        }
        return false;
    }

    static getOcrTextWithoutHtmlTags(text) {
        try {
            const txt = text.replace(/\+/g, '%20');
            const decodeTxtString = decodeURIComponent(txt);
            const txtWithoutHtml = Utility.stripHtmlTagsByOcrText(decodeTxtString);
            return txtWithoutHtml;
        } catch (e) {
            console.log(e);
            return Utility.stripHtmlTagsByOcrText(text);
        }
    }

    static async getEnglishGroupedMeta(db, questionsArrayWithMeta, groupedQid, language, variantAttachment, elasticSearchInstance, QuestionContainer, next) {
        let groupedMeta = null;
        if (language === 'english') {
            if (!_.isEmpty(groupedQid)) {
                let meta;
                if (variantAttachment && variantAttachment.getDBMetadata) {
                    meta = await QuestionContainer.getEnglishQuestionMget(db, groupedQid, next);
                } else {
                    meta = await elasticSearchInstance.getMeta(groupedQid);
                }
                groupedMeta = _.groupBy(meta.docs, '_id');
            }
        }
        return groupedMeta;
    }

    static async getNonEnglishGroupedMeta(groupedQid, elasticSearchInstance) {
        let groupedMeta = [];
        if (groupedQid && groupedQid.length > 0 && elasticSearchInstance) {
            const meta = await elasticSearchInstance.getMeta(groupedQid);
            groupedMeta = _.groupBy(meta.docs, '_id');
        }
        return groupedMeta;
    }

    // eslint-disable-next-line camelcase
    static sendMessage(sqs, sqs_queue_url, data) {
        const params = {
            MessageBody: JSON.stringify(data),
            QueueUrl: sqs_queue_url,
        };
        sqs.sendMessage(params, (err, data) => {
            if (err) {
                console.log('Error', err);
            } else {
                console.log(data);
            }
        });
    }

    static sendMessageFIFO(sqs, sqs_queue_url, data) {
        const params = {
            MessageBody: JSON.stringify(data),
            QueueUrl: sqs_queue_url,
            MessageGroupId: '1',
        };
        sqs.sendMessage(params, (err, response) => {
            if (err) {
                console.log('Error', err);
            } else {
                console.log(response);
            }
        });
    }

    static isSearchServiceEligible(student_id, config) {
        const userArray = config.search_service_user_list;
        if (userArray && Array.isArray(userArray) && userArray.length > 0) {
            return userArray.includes(student_id);
        } if (config.search_service_user_percent && config.search_service_user_percent > 0 && config.search_service_user_percent <= 100) {
            const percent = config.search_service_user_percent;
            const n = Math.floor(100 / percent);
            const result = student_id % n;
            return result == 0;
        }
        return false;
    }

    /**
     * Fetches search type flag from flagr
     * @param {object} kinesisClient Kinesis client
     * @param {number} studentId Student Id
     * @returns object
     * @author Abhishek Sinha
     * @LastModifiedDate 2019-12-11
     */
    static async getFlagrResponse(kinesisClient, studentId) {
        if (!config.flagr.enabled) {
            return null;
        }
        try {
            const { data } = await inst.configFlagrInst({
                method: 'POST',
                url: config.flagr.evaluation,
                data: {
                    entityContext: {
                        studentId,
                    },
                    flagID: 3,
                },
                timeout: 1000,
            });
            if (!data.variantAttachment) {
                return null;
            }
            kinesisClient.putRecord({
                StreamName: 'flagr-prod',
                Data: Buffer.from(JSON.stringify({ studentId, variantAttachment: data.variantAttachment })),
                PartitionKey: process.pid.toString(),
            }, (err, data) => {
                console.log('================================');
                console.log(err, data);
                console.log('================================');
            });
            return data.variantAttachment;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
                return null;
            }
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getFlagrResponse', error: errorLog });
            console.error(e);
            return null;
            // throw Error(e);
        }
    }

    /**
     * Fetches search type flag from flagr
     * @param {object} kinesisClient Kinesis client
     * @param {number} studentId Student Id
     * @returns object
     * @author Meghna Gupta
     * @LastModifiedDate 2020-05-22
     */
    static async getFlagrResponseForAskV9(kinesisClient, studentId, telemetry, start) {
        const timeout = 150;
        if (!config.flagr.enabled) {
            return null;
        }
        try {
            const { data } = await inst.configFlagrInst({
                method: 'POST',
                url: config.flagr.evaluation,
                data: {
                    entityContext: {
                        studentId,
                    },
                    flagID: 3,
                },
                timeout,
            });
            if (!data.variantAttachment) {
                return null;
            }
            kinesisClient.putRecord({
                StreamName: 'flagr-prod',
                Data: Buffer.from(JSON.stringify({ studentId, variantAttachment: data.variantAttachment })),
                PartitionKey: process.pid.toString(),
            }, (err, data) => {
                console.log('================================');
                console.log(err, data);
                console.log('================================');
            });
            return data.variantAttachment;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            }
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getFlagrResponseForAskV9', error: errorLog });
            console.error(e);
            return null;
            // throw Error(e);
        }
    }

    // ADVANCE - SEARCH - FILTER - INDEX

    static async getFlagrResponseForAdvanceSearchIndex(kinesisClient, studentId, telemetry, start) {
        const timeout = 100;
        if (!config.flagr.enabled) {
            return null;
        }
        try {
            const { data } = await inst.configFlagrInst({
                method: 'POST',
                url: config.flagr.evaluation,
                data: {
                    entityContext: {
                        studentId,
                    },
                    flagID: 87,
                },
                timeout,
            });
            if (!data.variantAttachment) {
                return null;
            }
            kinesisClient.putRecord({
                StreamName: 'flagr-prod',
                Data: Buffer.from(JSON.stringify({ studentId, variantAttachment: data.variantAttachment })),
                PartitionKey: process.pid.toString(),
            }, (err, data) => {
                console.log(err, data);
            });
            return data.variantAttachment;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
                return null;
            }
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getFlagrResponseForAdvanceSearchIndex', error: errorLog });
            console.error(e);
            return null;
            // throw Error(e);
        }
    }

    /**
     * Fetches disabled homepage widgets array from flagr
     * @param {number} studentId Student Id
     * @param {number} studentClass Student class
     * @param {string} lang Locale
     * @param {string} scm Student course mapping
     * @returns {string[]} Array of disabled widgets
     * @author Abhishek Sinha
     * @LastModifiedDate 2019-12-11
     */
    static async getDisabledHomapageWidgetsFlag(studentId, studentClass, lang, scm) {
        const timeout = 500;
        if (!config.flagr.enabled) {
            return [];
        }
        try {
            const { data } = await inst.configFlagrInst({
                method: 'POST',
                url: config.flagr.evaluation,
                data: {
                    entityID: studentId,
                    entityContext: {
                        studentId,
                        studentClass,
                        lang,
                        scm,
                    },
                    flagID: 2,
                },
                timeout,
            });
            if (!data.variantAttachment) {
                return [];
            }
            return data.variantAttachment.removableWidgets;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
            return [];
        }
    }

    /**
     * Fetches personalization algorithm from flagr on homepage
     * @param {number} studentId Student Id
     * @returns {object} API configuration for algorithm
     * @author Uday Khatry
     * @LastModifiedDate 2020-05-01
     */
    static async getPersonalizedHomePageFlag(studentId) {
        const timeout = 500;
        if (!config.flagr.enabled) {
            return {};
        }
        try {
            const { data } = await inst.configFlagrInst({
                method: 'POST',
                url: config.flagr.evaluation,
                data: {
                    entityID: studentId.toString(),
                    entityContext: {
                        entityID: studentId,
                    },
                    flagID: 35,
                },
                timeout,
            });
            if (!data.variantAttachment) {
                return [];
            }
            return data.variantAttachment;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
            return [];
        }
    }

    /**
     * Fetches  results from athe api mentioned in the variant attachment on homepage for personalized corousals
     * @param {object} variantAttachment
     * @returns {list} returns list of chapters/questions: can be anything
     * @author Uday Khatry
     * @LastModifiedDate 2020-05-01
     */
    static async getPersonalizedHomePageUsingVariantAttachment(variantAttachment, postData) {
        const timeout = 1000;
        if (!variantAttachment.endpoint) {
            return [];
        }
        try {
            const { data } = await axios({
                method: 'POST',
                url: variantAttachment.endpoint,
                timeout,
                data: postData,
            });
            if (!data) {
                return [];
            }

            return data;
        } catch (e) {
            if (e.code === 'ECONNABORTED') {
                console.log(`Flagr timeout after ${timeout}ms`);
            } else {
                console.error(e);
            }
            return [];
        }
    }

    static async postAxios(postData) {
        if (!postData.endpoint) {
            return [];
        }
        try {
            const { data } = await inst.configMicroInst({
                method: 'POST',
                url: postData.endpoint,
                timeout: 1000,
                data: postData,
            });
            if (!data) {
                return [];
            }

            return data;
        } catch (e) {
            console.error(e);
            return [];
        }
    }

    /**
     * Calculates new width and height of image
     * @param {object} metadata data related to image
     * @returns {object} New suggested width and height of image
     * @author Meghna Gupta
     * @LastModifiedDate 2020-04-02
     */
    static getDestWidthAndHeight(metadata) {
        const originalHeight = parseInt(metadata.height);
        const originalWidth = parseInt(metadata.width);
        const originalArea = originalWidth * originalHeight;
        if (originalArea <= 3e5) { return null; }
        const destArea = 3e5;
        const alpha = Math.sqrt(destArea / originalArea);
        const destWidth = Math.floor(originalWidth * alpha);
        const destHeight = Math.floor(originalHeight * alpha);
        return { destWidth, destHeight };
    }

    static gamificationActionEntry(sqs, sqs_queue_url, data) {
    
      
    }

    static sqsTrigger(sqs, sqs_queue_url, data) {
        const params = {
            MessageBody: JSON.stringify(data),
            QueueUrl: sqs_queue_url,
        };
        sqs.sendMessage(params, (err, data) => {
            if (err) {
                console.error('sqstrigger :', err);
            } else {
                console.log(data);
            }
        });
    }

    static logEntry(sns, sns_topic, data) {
        // console.log(data)
        // console.log(sns)
        // console.log(sns_topic)
        const params = {
            Message: JSON.stringify(data),
            TopicArn: sns_topic,
        };
        sns.publish(params, (err, data) => {
            if (err) {
                console.log('Error', err);
            } else {
                console.log(data);
            }
        });
    }

    static getFilteredDataForUserPersonalisation(all_questions_arr, answered_questions_arr) {
        return all_questions_arr.filter((elem1) => !answered_questions_arr.find((elem2) => elem1.qid == elem2.question_id));
    }

    static hasSameQuestionAskedRecently(recent_user_questions_asked_arr, ocr_text) {
        for (let i = 0; i < recent_user_questions_asked_arr.length; i++) {
            if (fuzz.partial_ratio(recent_user_questions_asked_arr[i].ocr_text, ocr_text) >= 90) {
                return i;
            }
        }
        return -1;
    }

    static getCurrentTimeInIST() {
        // let dateUTC = new Date();
        const dateUTC = new Date().getTime();
        const dateIST = new Date(dateUTC);
        // date shifting for IST timezone (+5 hours and 30 minutes)
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        return dateIST;
    }

    static getExpiration(flag) {
        const currentTime = new Date();
        const currentOffset = currentTime.getTimezoneOffset();
        const ISTOffset = 330;
        const ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
        const todayEndUTC = ISTTime.setHours(23, 59, 59, 999);
        const todayEndExpiry = parseInt(todayEndUTC / 1000) - (5.5 * 60 * 60);
        const tommorowEndExpiry = todayEndExpiry + (1 * 24 * 60 * 60);
        let expiry;
        switch (flag) {
            case 'today':
                expiry = todayEndExpiry;
                break;
            case 'tomorrow':
                expiry = tommorowEndExpiry;
                break;
            default:
                expiry = todayEndExpiry;
        }
        return expiry;
    }

    static queryMakerLocalised(locale_val, params) {
        const { classes } = params;
        const { chapters } = params;
        const { subtopics } = params;
        const { courses } = params;
        // const { books } = params;
        const { exams } = params;
        const { study } = params;
        // const { levels } = params;
        const { exercise } = params;
        const page_no = parseInt(params.page_no);
        const page_length = parseInt(params.page_length);
        let offset;
        const { year } = params;
        if (page_no > 1) offset = (page_no - 1) * page_length;
        else if (page_no == 1) offset = 0;

        let sql = '';
        let countQuery = '';
        let contentSql = 'SELECT heading, content FROM listing_page_content WHERE';

        sql += 'select questions_web.question_id, questions_web.student_id, questions_web.doubt, questions_web.class,';

        if (study.length > 0) {
            if (study[0] == 'CENGAGE') {
                if (chapters.length > 0) {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_hi='${chapters[0]}'`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_clean='${chapters[0]}'`;
                    }
                    contentSql += ` topic = 'CEN' AND chapter = '${chapters[0]}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += ' questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    } else {
                        sql += ' questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    }
                    contentSql += " topic = 'CEN' AND chapter IS NULL";
                }
            } else if (study[0] == 'RD SHARMA') {
                if (classes.length > 0) {
                    if (chapters.length > 0) {
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_hi='${chapters[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_clean='${chapters[0]}'`;
                        }
                        contentSql += ` topic = 'RDS' AND class = ${classes[0]} AND chapter = '${chapters[0]}'`;
                    } else {
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%' AND questions_web.class='${classes[0]}'`;
                        }
                        contentSql += ` topic = 'RDS' AND class = ${classes[0]} AND chapter IS NULL`;
                    }
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%'";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=4 and doubt like '%RD%'";
                    }
                    contentSql += " topic = 'RDS' AND class IS NULL AND chapter IS NULL";
                }
            }
            sql += " AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        } else if (exams.length > 0) {
            if (exams[0] == 'Jee Mains') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'JM' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        // sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_18%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=3 AND doubt LIKE 'JM_%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'JM' AND year IS NULL";
                }
            } else if (exams[0] == 'Jee Advanced') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'JA' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=8 AND doubt LIKE 'JA%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'JA' AND year IS NULL";
                }
            } else if (exams[0] == 'X Boards') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND doubt LIKE 'X_BD${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND doubt LIKE 'X_BD${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'xboards' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=9 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'xboards' AND year IS NULL";
                }
            } else if (exams[0] == 'XII Boards') {
                if (year != undefined && !_.isNull(year) && year != '') {
                    if (locale_val == 'hindi') {
                        sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND doubt LIKE 'XII${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    } else {
                        sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND doubt LIKE 'XII${year}%' AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt`;
                    }
                    contentSql += ` topic = 'xiiboards' AND year = '20${year}'`;
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=2 AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> '' ORDER BY questions_web.doubt";
                    }
                    contentSql += " topic = 'xiiboards' AND year IS NULL";
                }
            }
        } else if (courses.length > 0) {
            if (courses[0] == 'NCERT') {
                if (classes.length > 0) {
                    if (chapters.length > 0) {
                        if (exercise != undefined && !_.isNull(exercise) && exercise != '') {
                            if (locale_val == 'hindi') {
                                sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_hi='${chapters[0]}' AND questions_web.doubt LIKE '%${exercise}%'`;
                            } else {
                                sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_clean='${chapters[0]}' AND questions_web.doubt LIKE '%${exercise}%'`;
                            }
                            contentSql += ` topic = 'ncert' AND class = '${classes[0]}' AND chapter='${chapters[0]}' AND exercise = '${exercise}'`;
                        } else {
                            if (locale_val == 'hindi') {
                                sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_hi='${chapters[0]}'`;
                            } else {
                                sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}' AND questions_web.chapter_clean='${chapters[0]}'`;
                            }
                            contentSql += ` topic = 'ncert' AND class = '${classes[0]}' AND chapter='${chapters[0]}' AND exercise IS NULL`;
                        }
                    } else {
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%' AND questions_web.class='${classes[0]}'`;
                        }
                        contentSql += ` topic = 'ncert' AND class = '${classes[0]}' AND chapter IS NULL AND exercise IS NULL`;
                    }
                } else {
                    if (locale_val == 'hindi') {
                        sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%'";
                    } else {
                        sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=1 AND questions_web.subject LIKE 'math%'";
                    }
                    contentSql += " topic = 'ncert' AND class IS NULL AND chapter IS NULL AND exercise IS NULL";
                }
            } else if (courses[0] == 'IIT') {
                if (chapters.length > 0) {
                    if (subtopics.length > 0) {
                        // if(locale_val == 'hindi') {
                        //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter_hi='"+chapters[0]+"' AND questions_web.subtopic='"+subtopics[0]+"'"
                        // } else {
                        //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter='"+chapters[0]+"' AND questions_web.subtopic='"+subtopics[0]+"'"
                        // }
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_hi='${chapters[0]}' AND questions_web.subtopic='${subtopics[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_clean='${chapters[0]}' AND questions_web.subtopic_clean='${subtopics[0]}'`;
                        }
                        contentSql += ` topic = 'iit' AND chapter = '${chapters[0]}' AND subtopic = '${subtopics[0]}'`;
                    } else {
                        // if(locale_val == 'hindi') {
                        //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter_hi='"+chapters[0]+"'"
                        // } else {
                        //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>'' AND questions_web.chapter='"+chapters[0]+"'"
                        // }
                        if (locale_val == 'hindi') {
                            sql += ` questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_hi='${chapters[0]}'`;
                        } else {
                            sql += ` questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5 AND questions_web.chapter_clean='${chapters[0]}'`;
                        }
                        contentSql += ` topic = 'iit' AND chapter = '${chapters[0]}' AND subtopic IS NULL`;
                    }
                } else {
                    // if(locale_val == 'hindi') {
                    //   sql += " questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>''"
                    // } else {
                    //   sql += " questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.class in ('11','12') AND questions_web.target_course <>'BOARDS' AND questions_web.chapter <> 'Skip' AND questions_web.chapter<>''"
                    // }
                    if (locale_val == 'hindi') {
                        sql += ' questions_web.chapter_hi as chapter, questions_web.subtopic_hi as subtopic, questions_web.ocr_text_hi as ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    } else {
                        sql += ' questions_web.chapter, questions_web.subtopic, questions_web.ocr_text, questions_web.package, questions_web.target_course, questions_web.matched_question, questions_web.packages, web_question_url.url_text FROM questions_web INNER JOIN web_question_url ON questions_web.question_id = web_question_url.question_id WHERE questions_web.student_id=5';
                    }
                    contentSql += " topic = 'iit' AND chapter IS NULL AND subtopic IS NULL";
                }
            }
            sql += " AND web_question_url.url_text IS NOT NULL AND web_question_url.url_text <> ''";
        }

        countQuery += `SELECT count(d.question_id) as total_records FROM ( ${sql} ) as d`;

        if (
            !_.isNull(page_no)
            && page_no != ''
            && !_.isNull(page_length)
            && page_length != ''
        ) {
            sql += ` LIMIT ${offset},${page_length}`;
        }

        return { sql, countQuery, contentSql };
    }

    static async getCrawlData(query) {
        return new Promise(((resolve, reject) => {
            try {
                http.get(searchLink + query, async (res) => {
                    let _data = '';
                    const found = [];

                    res.on('data', async (data) => {
                        _data += data;
                    });

                    res.on('end', async () => {
                        const $ = cheerio.load(_data);
                        const videos = $('.yt-lockup-video');
                        let i;
                        for (i = 0; i < videos.length; i++) {
                            const link = $(videos[i]).find('.yt-uix-sessionlink').attr('href');
                            if (!link.startsWith('/watch')) {
                                continue;
                            }
                            found.push({
                                title: $(videos[i]).find('.yt-lockup-title a').text(),
                                link: `https://youtube.com${link}`,
                            });
                        }
                        resolve(found);
                        // fn(null, found);
                    });
                });
            } catch (err) {
                // fn(err);
                console.log(err);
                reject(err);
            }
        }));
    }

    static getClientIp(req) {
        let ipAddress;
        const forwardedIpsStr = req.header('x-forwarded-for');
        if (forwardedIpsStr) {
            const forwardedIps = forwardedIpsStr.split(',');
            // eslint-disable-next-line prefer-destructuring
            ipAddress = forwardedIps[0];
        }
        if (!ipAddress) {
            ipAddress = req.connection.remoteAddress;
        }
        console.log('ipAddress');
        console.log(ipAddress);
        console.log('1212121');

        console.log(
            req.headers['x-forwarded-for']
            || req.connection.remoteAddress
            || req.socket.remoteAddress
            || (req.connection.socket ? req.connection.socket.remoteAddress : null),
        );
        return 0;
    }

    static fakePromise() {
        return new Promise((resolve, reject) => {
            resolve(true);
        });
    }

    static fakeFlaggr() {
        return new Promise((resolve, reject) => {
            resolve(null);
        });
    }

    static getFileNameFromUrlStringForQuestionImage(baseUrl, urlString) {
        const fileName = urlString.replace(baseUrl, '');
        return fileName;
    }

    static getStructuredCourseDayTime(liveAt) {
        const monthList = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
        ];

        // var dateUTC = new Date();
        const dateUTC = new Date().getTime();
        const dateIST = new Date(dateUTC);
        // date shifting for IST timezone (+5 hours and 30 minutes)
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        const today = dateIST;

        const liveDate = new Date(liveAt).getDate();
        const todaysDate = today.getDate();

        const liveMonth = new Date(liveAt).getMonth() + 1;
        const currentMonth = today.getMonth() + 1;

        const liveYear = new Date(liveAt).getFullYear();
        const currentYear = today.getFullYear();

        let dayText;

        let liveHour = new Date(liveAt).getHours();
        let liveMinutes = new Date(liveAt).getMinutes();
        if (liveMinutes < 10) { liveMinutes = `0${liveMinutes}`; }
        let meridiemStatus = '';

        if (liveHour >= 12) {
            meridiemStatus = 'PM';
            if (liveHour != 12) { liveHour -= 12; }
        } else {
            meridiemStatus = 'AM';
        }
        const timeText = `${liveHour}:${liveMinutes} ${meridiemStatus}`;

        if (todaysDate > liveDate) {
            const dayDiff = todaysDate - liveDate;
            if (dayDiff > 1) {
                dayText = `${liveDate} ${monthList[liveMonth - 1]}`;
            } else if (currentMonth != liveMonth || currentYear != liveYear) {
                dayText = `${liveDate} ${monthList[liveMonth - 1]}`;
            } else {
                dayText = 'Yesterday';
            }
        } else if (todaysDate < liveDate) {
            const dayDiff = liveDate - todaysDate;
            if (dayDiff > 1) {
                dayText = `${liveDate} ${monthList[liveMonth - 1]}`;
            } else if (currentMonth != liveMonth || currentYear != liveYear) {
                dayText = `${liveDate} ${monthList[liveMonth - 1]}`;
            } else {
                dayText = 'Tomorrow';
            }
        } else if (todaysDate == liveDate) {
            if (currentMonth != liveMonth || currentYear != liveYear) {
                dayText = `${liveDate} ${monthList[liveMonth - 1]}`;
            } else {
                dayText = 'Today';
            }
        }
        return { day: dayText, time: timeText };
    }

    static generateOtp() {
        return Math.floor(1000 + Math.random() * 9000);
    }

    static async handleOcr(url) {
        try {
            let transLateApiResp; let latex; let
                ocr;
            const visionApiResp = await Utility.visionApi(url);
            console.log('3');
            if (visionApiResp[0].fullTextAnnotation) {
                let text = visionApiResp[0].textAnnotations[0].description;
                const { locale } = visionApiResp[0].textAnnotations[0];
                // let data = [locale, text]
                if (locale != 'en') {
                    if (text != '') {
                        console.log('3.5');
                        transLateApiResp = await Utility.translateApi(text);
                        console.log('3.7');
                        console.log('pretext');
                        if (transLateApiResp.length > 0) {
                            text = transLateApiResp.text;
                        }
                    }
                }
                console.log('text');
                if (text.length <= 85) {
                    latex = await Utility.mathpixOcr(url);
                    if (text.length < 2 * latex.length) {
                        ocr = latex;
                    } else {
                        ocr = `${latex} ${text}`;
                    }
                } else {
                    ocr = text;
                }
                return new Promise(((resolve) => {
                    // Do async job
                    resolve([locale, ocr]);
                }));
                // return new Promise(function (resolve, reject) {
                //   // Do async job
                //   resolve([locale, ocr])
                // })
            }
            return new Promise(((resolve) => {
                // Do async job
                resolve([]);
            }));
        } catch (e) {
            return new Promise(((resolve) => {
                // Do async job
                resolve([]);
            }));
        }
    }

    static visionApi(url) {
        console.log(url);
        const client = new vision.ImageAnnotatorClient();
        return client.documentTextDetection(url);
    }

    static httpVisionApi(image, config) {
        // console.log(image)
        const url = `https://vision.googleapis.com/v1/images:annotate?key=${config.GOOGLE_VISION_KEY}`;
        const options = {
            method: 'POST',
            uri: url,
            body: {
                requests: [
                    {
                        image: {
                            content: image,
                        },
                        features: [
                            {
                                type: 'DOCUMENT_TEXT_DETECTION',
                            },
                            // {
                            //   "type": "WEB_DETECTION"
                            // }
                        ],
                    },
                ],
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
            },
            time: true,
            // timeout: 3000,
        };
        // let client = new vision.ImageAnnotatorClient();
        // return client.webDetection(url);
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (e, resp, body) => {
                if (e) {
                    let errorLog = e;
                    if (!_.isObject(errorLog)) {
                        errorLog = JSON.stringify(errorLog);
                    }
                    logger.error({ tag: 'ask', source: 'httpVisionApi', error: errorLog });
                    reject(errorLog);
                } else {
                    body.response_time = resp.elapsedTime;
                    resolve(body);
                }
            });
        }));
    }

    static tesseractOcr(imageUrl) {
        console.log('imageUrl');
        console.log(imageUrl);
        const url = `${Data.preProcessService}/api/v2/image-ocr-service`;
        const options = {
            method: 'POST',
            uri: url,
            body: {
                imageUrl,
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        // let client = new vision.ImageAnnotatorClient();
        // return client.webDetection(url);
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (e, resp, body) => {
                if (e) {
                    let errorLog = e;
                    if (!_.isObject(errorLog)) {
                        errorLog = JSON.stringify(errorLog);
                    }
                    logger.error({ tag: 'ask', source: 'tessaractOcr', error: errorLog });
                    reject(errorLog);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static getIterations(flagId = 3) {
        const options = {
            method: 'GET',
            uri: `${Data.FLAGR_HOST}/api/v1/flags/${flagId}/variants`,
        };
        return new Promise(((resolve, reject) => {
            request(options, (err, resp, body) => {
                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static getLanguageByUserLocale(languagesObj, localeKey) {
        const language = typeof languagesObj[localeKey] !== 'undefined' ? languagesObj[localeKey] : 'english';
        return language;
    }

    static translateApi(text) {
        return translate(text, { to: 'en' });
    }

    static translateApi2(text, translate) {
        return new Promise(async (resolve, reject) => {
            try {
                const resp = await translate.translate(text, 'en');
                resolve(resp);
            } catch (e) {
                console.error(e);
                const mock_response = [text, {
                    data: {
                        translations: [{ translatedText: text, detectedSourceLanguage: 'hi' }],
                    },
                }];
                resolve(mock_response);
            }
        });
    }

    static async getTranslatedText(translate, text, target_language) {
        try {
            const ocrTextParts = text.split('`');
            const textParts = ocrTextParts.filter((e, i) => i % 2 === 0);
            const equationParts = ocrTextParts.filter((e, i) => i % 2 === 1);
            const result = await translate.translate(textParts, target_language);
            let counter = 0;
            let textCounter = 0;
            let eqnCounter = 0;
            const combinedText = [];
            while (counter < ocrTextParts.length) {
                if (counter % 2 === 0) {
                    combinedText.push(result[0][textCounter]);
                    textCounter++;
                } else {
                    combinedText.push(equationParts[eqnCounter]);
                    eqnCounter++;
                }
                counter++;
            }
            return combinedText.join(' ');
        } catch (e) {
            console.error(e);
            return text;
        }
    }

    static uploadImageToBlob(blobService, filename, path) {
        console.log(filename);
        return new Promise((resolve, reject) => {
            blobService.createBlockBlobFromText('q-images', filename, path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(true);
                }
            });
        });
    }

    static async rotateImage(url, degree, s3) {
        const jimpResponse = await Utility.handleJimp(Jimp, url);
        if (jimpResponse) {
            const content_type = 'image/png';
            const ext = '.png';
            jimpResponse.rotate(parseInt(degree));
            const file = `upload_${degree}_${moment().unix()}${ext}`;
            await jimpResponse.writeAsync(`${publicPath}/uploads/${file}`);
            const img = fs.readFileSync(`${publicPath}/uploads/${file}`);
            await Utility.uploadTos3(s3, 'doubtnut-static/images', file, img, content_type);
            // const path_90 = `https://d10lpgp6xz60nq.cloudfront.net/images/${file}`;
            return file;
        }
    }

    static async handleJimp(Jimp, question_image) {
        try {
            const response = await Jimp.read(question_image);
            return response;
        } catch (e) {
            return false;
        }
    }

    static mathpixOcr(host, fileName) {
        // let url = host + "/static/uploads/" + fileName
        const url = `https://d10lpgp6xz60nq.cloudfront.net/images/${fileName}`;
        const options = {
            method: 'POST',
            uri: Data.mathpix.latexOcrEndpoint,
            body: {
                url,
                format: {
                    mathml: true,
                },
            },
            json: true,
            headers: {
                app_id: config.mathpix_app_id,
                app_key: config.mathpix_app_key,
                'Content-Type': 'application/json',
            },
        };
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static mathpixOcrAscii(host, fileName, config) {
        // let url = host + "/static/uploads/" + fileName
        const url = `https://d10lpgp6xz60nq.cloudfront.net/images/${fileName}`;
        console.log('check file address');
        console.log(host);
        console.log(url);
        const options = {
            method: 'POST',
            uri: Data.mathpix.latexOcrEndpoint,
            body: {
                url,
                formats: ['asciimath'],
            },
            json: true,
            headers: {
                app_id: config.mathpix_app_id,
                app_key: config.mathpix_app_key,
                'Content-Type': 'application/json',
            },
        };
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (err, resp, body) => {
                if (err) {
                    logger.error({ tag: 'ask', source: 'httpVisionApi', error: err });
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static mathpixOcr2(host, fileName, config) {
        // let url = host + "/static/uploads/" + fileName
        const url = `https://d10lpgp6xz60nq.cloudfront.net/images/${fileName}`;
        const options = {
            method: 'POST',
            uri: Data.mathpix.latexOcrEndpoint,
            body: {
                url,
                formats: ['asciimath', 'text'],
                ocr: ['math', 'text'],
            },
            json: true,
            headers: {
                app_id: config.mathpix_app_id,
                app_key: config.mathpix_app_key,
                'Content-Type': 'application/json',
            },
        };
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (err, resp, body) => {
                if (err) {
                    logger.error({ tag: 'ask', source: 'mathpixOcr2', error: err });
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static mathpixOcrForService(url, config) {
        // let url = host + "/static/uploads/" + fileName
        // let url = "https://doubtnutvideobiz.blob.core.windows.net/q-images/" + fileName
        // console.log("check file address");
        // console.log(host);
        // console.log(url)
        const options = {
            method: 'POST',
            uri: Data.mathpix.latexOcrEndpoint,
            body: {
                url,
                format: {
                    mathml: true,
                },
            },
            json: true,
            headers: {
                app_id: config.mathpix_app_id,
                app_key: config.mathpix_app_key,
                'Content-Type': 'application/json',
            },
        };
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static updatePercolateIndex(couponList, xAuthToken) {
        const options = {
            method: 'POST',
            url: `${Data.cpn_url}api/v1/update-coupon-details`,
            headers:
                    {
                        'content-type': 'application/json',
                        'x-auth-token': xAuthToken,
                    },
            body: { coupon_codes: couponList },
            json: true,
        };
        return new Promise(((resolve, reject) => {
            request(options, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static latexToAscii(latex) {
        // const options = {
        //     method: 'POST',
        //     uri: 'http://35.200.190.26:5000/convert',
        //     body: {
        //         latex,
        //     },
        //     json: true,
        // };
        return new Promise(((resolve, reject) => {
            // Do async job
            // request(options, function (err, resp, body) {
            //   if (err) {
            //     reject(err)
            //   } else {
            //     resolve(body)
            //   }
            // })
            request.post(
                {
                    url: 'http://35.200.190.26:5000/convert',
                    form: { latex },
                },
                (err, httpResponse, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(body);
                    }
                },
            );
        }));
    }

    static makeObjQuery(object) {
        let str = '';

        const keys_array = Object.keys(object);
        for (let i = 0; i < keys_array.length; i++) {
            if (i == keys_array.length - 1) {
                str = `${str + keys_array[i]} ='${object[Object.keys(object)[i]]}'`;
            } else {
                str = `${str + keys_array[i]} = '${object[Object.keys(object)[i]]}' and `;
            }
        }

        return str;
    }

    static changeElasticSearchResult(hitsData) {
        const data = [];
        for (let i = 0; i < hitsData.length; i++) {
            data.push({
                question_id: hitsData[i]._id,
                ocr_text: hitsData[i]._source.ocr_text,
            });
        }
        return data;
    }

    static async changeElasticSearchResultNew(hitsData) {
        const data = [];
        for (let i = 0; i < hitsData.length; i++) {
            data.push({
                question_id: hitsData[i]._id,
                ocr_text: hitsData[i]._source.ocr_text,
                url: hitsData[i].url_text,
                matched_question: hitsData[i].matched_question,
            });
        }
        return data;
    }

    static httpVision(imageData) {
        const api_key = 'AIzaSyD4Os4iXuGWAfJySVk4IW_2KLoe5DtVI2k';
        const url2 = `https://vision.googleapis.com/v1/images:annotate?key=${api_key}`;
        const requestObject = {
            requests: [
                {
                    image: {
                        content: imageData,
                    },
                    features: [
                        {
                            type: 'DOCUMENT_TEXT_DETECTION',
                        },
                    ],
                },
            ],
        };

        const options = {
            method: 'POST',
            uri: url2,
            body: {
                requestObject,
            },
            json: true,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': imageData.length,
            },
        };
        return new Promise(((resolve, reject) => {
            // Do async job
            request(options, (err, resp, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    static getRedisKey(params) {
        // console.log(params)
        // let redisKey = (typeof params.classes != 'undefined' && params.classes.length > 0) ? params.classes+"_" :  "";
        // redisKey = redisKey + (typeof params.chapters != 'undefined' && params.chapters.length > 0) ? params.chapters+"_" :  "";
        // redisKey = redisKey + (typeof params.subtopics != 'undefined' && params.subtopics.length > 0) ? params.subtopics+"_" :  "";
        // redisKey = redisKey + (typeof params.courses != 'undefined' && params.courses.length > 0) ? params.courses[0]+"_" :  "";
        // redisKey = redisKey + (typeof params.books != 'undefined' && params.books.length > 0) ? params.books+"_" :  "";
        // redisKey = redisKey + (typeof params.exams != 'undefined' && params.exams.length > 0) ? params.exams+"_" :  "";
        // redisKey = redisKey + (typeof params.study != 'undefined' && params.study.length > 0) ? params.study+"_" :  "";
        // redisKey = redisKey + (typeof params.levels != 'undefined' && params.levels.length > 0) ? params.levels+"_" :  "";
        // // redisKey = redisKey + (typeof params.exercise != 'undefined' && params.exercise.length > 0) ? params.exercise+"_" :  "";
        // redisKey = redisKey + (typeof params.page_no != 'undefined' && params.page_no != '') ? params.page_no+"_" :  "";
        // // redisKey = redisKey + (typeof params.year != 'undefined' && params.year.length > 0) ? params.year+"_" :  "";
        //         console.log("key")
        //         console.log(redisKey)
        // redisKey = redisKey.slice(0, -1);
        let redisKey = JSON.stringify(params);
        redisKey = redisKey.split(' ').join('_');
        console.log(`params :::::: ${params}`);
        console.log(`redisKey :::::: ${redisKey}`);
        return redisKey;
    }

    static queryMaker(params) {
        const { classes } = params;
        const { chapters } = params;
        const { subtopics } = params;
        const { courses } = params;
        const { books } = params;
        const { exams } = params;
        const { study } = params;
        const { levels } = params;
        const { exercise } = params;
        const page_no = parseInt(params.page_no);
        const page_length = parseInt(params.page_length);
        let offset;
        const { year } = params;
        if (page_no > 1) offset = (page_no - 1) * page_length;
        else if (page_no == 1) offset = 0;

        let sql = '';
        let countQuery = '';
        if (study.length > 0 && study[0] == 'CENGAGE') {
            if (chapters.length > 0) {
                sql
                    += `Select subtopic_cen.chapter, questions.question_id,questions.class as q_class, questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped from (Select * from questions where student_id = 5 and is_answered = 1) as questions left join questions_meta on questions.question_id = questions_meta.question_id left join subtopic_cen on questions.doubt=subtopic_cen.code where subtopic_cen.chapter = '${chapters[0]}'`;
            } else {
                sql
                    += 'Select subtopic_cen.chapter, questions.question_id,questions.class as q_class, questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped from (Select * from questions where student_id = 5 and is_answered = 1) as questions left join questions_meta on questions.question_id = questions_meta.question_id left join subtopic_cen on questions.doubt=subtopic_cen.code';
            }
            countQuery
                += `SELECT count(d.question_id) as total_records FROM ( ${sql} ) as d`;
        } else {
            sql
                += `SELECT * FROM (SELECT questions.question_id,questions.class as q_class,${(courses.length > 0 && courses[0] == 'IIT')
                    || (exams.length > 0 && exams[0] == 'Jee Mains')
                    || (exams.length > 0 && exams[0] == 'Jee Advanced')
                    || (study.length > 0 && study[0] == 'CENGAGE')
                    ? ' questions_meta.chapter, '
                    : ' questions.chapter, '} questions.doubt,questions.ocr_text,questions.question,questions.matched_question,questions_meta.class,questions_meta.subtopic,questions_meta.microconcept,questions_meta.level,questions_meta.target_course,questions_meta.package,questions_meta.type,questions_meta.q_options,questions_meta.q_answer,questions_meta.diagram_type,questions_meta.concept_type,questions_meta.chapter_type,questions_meta.we_type,questions_meta.ei_type,questions_meta.aptitude_type,questions_meta.pfs_type,questions_meta.symbol_type,questions_meta.doubtnut_recommended,questions_meta.secondary_class,questions_meta.secondary_chapter,questions_meta.secondary_subtopic,questions_meta.secondary_microconcept,questions_meta.video_quality,questions_meta.audio_quality,questions_meta.language,questions_meta.ocr_quality,questions_meta.timestamp,questions_meta.is_skipped  FROM questions left join questions_meta on questions_meta.question_id=questions.question_id `;
            if (classes.length > 0) {
                sql += ' WHERE ';
                for (let i = 0; i < classes.length; i++) {
                    if (i != classes.length - 1) { sql += `questions.class=${classes[i]} || `; } else if (i == classes.length - 1) { sql += `questions.class=${classes[i]}`; }
                }
                if (
                    chapters.length > 0
                    || subtopics.length > 0
                    || courses.length > 0
                    || books.length > 0
                    || exams.length > 0
                    || levels.length > 0
                ) {
                    sql += ' && ';
                }
            }

            if (chapters.length > 0) {
                if (classes.length == 0) sql += ' WHERE ';
                for (let i = 0; i < chapters.length; i++) {
                    if (i != chapters.length - 1) {
                        if (
                            (courses.length > 0 && courses[0] == 'IIT')
                            || (study.length > 0 && study[0] == 'CENGAGE')
                        ) { sql += `questions_meta.chapter='${chapters[i]}' || `; } else if (study.length > 0 && study[0] == 'RD SHARMA') { sql += `questions.doubt LIKE'${chapters[i]}%'`; } else sql += `questions.chapter='${chapters[i]}' || `;
                    } else if (i == chapters.length - 1) {
                        if (
                            (courses.length > 0 && courses[0] == 'IIT')
                            || (study.length > 0 && study[0] == 'CENGAGE')
                        ) { sql += `questions_meta.chapter='${chapters[i]}'`; } else if (study.length > 0 && study[0] == 'RD SHARMA') {
                            // sql += "questions.doubt LIKE '" + chapters[i] + "%'";
                            sql += `questions.chapter LIKE '${chapters[i]}%'`;
                        } else sql += `questions.chapter='${chapters[i]}'`;
                    }
                }
                if (
                    subtopics.length > 0
                    || courses.length > 0
                    || books.length > 0
                    || exams.length > 0
                    || levels.length > 0
                ) {
                    sql += ' && ';
                }
            }

            if (subtopics.length > 0) {
                if (classes.length == 0 && chapters.length == 0) sql += ' WHERE ';
                for (let i = 0; i < subtopics.length; i++) {
                    if (i != subtopics.length - 1) { sql += `questions_meta.subtopic='${subtopics[i]}' || `; } else if (i == subtopics.length - 1) { sql += `questions_meta.subtopic='${subtopics[i]}'`; }
                }
                if (
                    courses.length > 0
                    || books.length > 0
                    || exams.length > 0
                    || levels.length > 0
                ) {
                    sql += ' && ';
                }
            }

            if (courses.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                ) { sql += ' WHERE '; }
                for (let i = 0; i < courses.length; i++) {
                    const value = courses[i];
                    if (value == 'IIT') {
                        sql
                            += " questions_meta.class in ('11','12') && target_course <> 'BOARDS' && is_answered=1 ";
                    } else if (value == 'NCERT') {
                        sql += ' questions.student_id=1 && is_answered=1 ';
                    }
                }
                if (books.length > 0 || exams.length > 0 || levels.length > 0) {
                    sql += ' && ';
                }
            }

            if (books.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                ) { sql += ' WHERE '; }
                for (let i = 0; i < books.length; i++) {
                    if (i != books.length - 1) { sql += `questions_meta.package='${books[i]}' || `; } else if (i == books.length - 1) { sql += `questions_meta.package='${books[i]}'`; }
                }
            }

            // if (exams.length > 0) {
            //   if (classes.length == 0 && chapters.length == 0 && subtopics.length == 0 && courses.length == 0 && books.length == 0)
            //     sql += " WHERE ";
            //   for (let i = 0; i < exams.length; i++) {

            //     if (i != exams.length - 1)
            //       sql += "questions_meta.package='" + exams[i] + "' || ";
            //     else if (i == exams.length - 1)
            //       sql += "questions_meta.package='" + exams[i]+"'";

            //   }
            //   if (levels.length > 0) {
            //     sql += " && ";
            //   }
            // }

            if (levels.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                    && books.length == 0
                    && exams.length == 0
                ) { sql += ' WHERE '; }
                for (let i = 0; i < levels.length; i++) {
                    if (i != levels.length - 1) { sql += `questions_meta.level='${levels[i]}' || `; } else if (i == levels.length - 1) { sql += `questions_meta.level='${levels[i]}'`; }
                }
            }

            if (exams.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                    && books.length == 0
                    && levels.length == 0
                ) { sql += ' WHERE '; }

                if (exams == 'Jee Mains') { sql += "  questions.student_id='3' && is_answered='1' "; }
                if (exams == 'Jee Advanced') { sql += "  questions.student_id='8' && is_answered='1' "; }
                if (exams == 'X Boards') { sql += "  questions.student_id='9' && is_answered='1' "; }
                if (exams == 'XII Boards') { sql += "  questions.student_id='2' && is_answered='1' "; }
            }

            if (study.length > 0) {
                if (
                    classes.length == 0
                    && chapters.length == 0
                    && subtopics.length == 0
                    && courses.length == 0
                    && books.length == 0
                    && levels.length == 0
                    && exams.length == 0
                ) { sql += ' WHERE '; }
                if (classes.length == 0 && chapters.length == 0) {
                    if (study == 'RD SHARMA') { sql += " questions.student_id='4' && is_answered='1' "; }
                    if (study == 'CENGAGE') { sql += " questions.student_id='5' && is_answered='1' "; }
                    if (study == 'NARAYNA') { sql += " questions.student_id='11' && is_answered='1' "; }
                    if (study == 'BANSAL') { sql += " questions.student_id='14' && is_answered='1' "; }
                    if (study == 'RESONANCE') { sql += " questions.student_id='15' && is_answered='1' "; }
                } else if (classes.length != 0 || chapters.length != 0) {
                    if (study == 'RD SHARMA') { sql += " && questions.student_id='4' && is_answered='1' "; }
                    if (study == 'CENGAGE') { sql += " && questions.student_id='5' && is_answered='1' "; }
                    if (study == 'NARAYNA') { sql += " && questions.student_id='11' && is_answered='1' "; }
                    if (study == 'BANSAL') { sql += " && questions.student_id='14' && is_answered='1' "; }
                    if (study == 'RESONANCE') { sql += " && questions.student_id='15' && is_answered='1' "; }
                }
            }

            if (exercise != undefined && !_.isNull(exercise) && exercise != '') {
                sql += ` && questions.doubt LIKE '%${exercise}%'`;
            }

            if (year != undefined && !_.isNull(year) && year != '') {
                if (exams == 'Jee Advanced') { sql += ` && questions.doubt LIKE 'JA${year}%'`; }
                if (exams == 'Jee Mains') { sql += ` && questions.doubt LIKE 'JM_${year}%'`; }
                if (exams == 'X Boards') { sql += ` && questions.doubt LIKE 'X_BD${year}%'`; }
                if (exams == 'XII Boards') { sql += ` && questions.doubt LIKE 'XII${year}%'`; }
            }

            //  REMOVED by ADITYA SIR (10/jan/19)
            // if (!(study.length != 0 && study[0] == "RD SHARMA"))
            //   sql += " && questions_meta.is_skipped=0 ";

            // sql+=" order by questions.doubt DESC ";
            sql
                += ') as a left join (select GROUP_CONCAT(packages) as packages,question_id as qid_from_question_package_mapping from question_package_mapping group by question_id) as e on a.question_id = e.qid_from_question_package_mapping ';
            sql += ' order by a.doubt ASC ';
            countQuery
                += `SELECT count(b.question_id) as total_records FROM ( ${sql} ) as b`;
        }

        if (
            !_.isNull(page_no)
            && page_no != ''
            && !_.isNull(page_length)
            && page_length != ''
        ) {
            sql += ` LIMIT ${offset},${page_length}`;
        }

        console.log(sql);

        return { sql, countQuery };
    }

    static isDnBrainlyPackageCloneAppRequestOrigin(headers) {
        if (!_.isEmpty(headers.package_name) && headers.package_name === Data.dnCloneBrainlyAppPackageName) {
            return true;
        }
        return false;
    }

    static isDnBiologyNeetCloneAppRequestOrigin(headers) {
        if (!_.isEmpty(headers.package_name) && headers.package_name === Data.dnCloneBiologyNeetPackageName) {
            return true;
        }
        return false;
    }

    static isDnIITJEECloneAppRequestOrigin(headers) {
        if (!_.isEmpty(headers.package_name) && headers.package_name === Data.dnCloneIITJEEPackageName) {
            return true;
        }
        return false;
    }

    static disableFeedForAltApp(headers) {
        if (
            this.isDnBrainlyPackageCloneAppRequestOrigin(headers)
            || this.isDnBiologyNeetCloneAppRequestOrigin(headers)
            || this.isDnIITJEECloneAppRequestOrigin(headers)
        ) {
            return true;
        } return false;
    }

    static async sendFcm(student_id, fcmId, message, type = null, admin = null) {
        try {
            // See documentation on defining a message payload.
            if (!_.isNull(fcmId)) {
                if (!('firebase_eventtag' in message) || message.firebase_eventtag == '') message.firebase_eventtag = 'user_journey';

                const data = {
                    studentId: [student_id],
                    to: [fcmId],
                    data: message,
                };

                kafka.newtonNotification(data);
            }
        } catch (error) {
            console.log(error);
        }
    }

    static async sendFcmByTargetUsers(users, message, type = null, admin = null) {
        try {
            // See documentation on defining a message payload.
            if (!('firebase_eventtag' in message) || message.firebase_eventtag == '') message.firebase_eventtag = 'user_journey';

            const studentId = [];
            const gcmId = [];
            for (let i = 0; i < users.length; i++) {
                studentId.push(users[i].id);
                gcmId.push(users[i].gcmId);
            }
            const data = {
                studentId,
                to: gcmId,
                data: message,
            };

            kafka.newtonNotification(data);
        } catch (error) {
            console.log(error);
        }
    }

    static sendEntityNotification(topic, fcm_id, message, admin) {
        const registrationTokens = [fcm_id];
        console.log(fcm_id);
        return admin
            .messaging()
            .unsubscribeFromTopic(registrationTokens, topic)
            .then((response) => {
                console.log('Successfully unsubscribed from topic:', response);
                // send notification to all to this topic
                const messageTosend = {};
                messageTosend.data = message;
                messageTosend.topic = topic;
                messageTosend.android = {
                    priority: 'high',
                    ttl: 4500,
                };
                return admin.messaging().send(messageTosend);
            })
            .then((response2) => {
                console.log('response2');
                console.log(response2);
                return admin.messaging().subscribeToTopic(registrationTokens, topic);
            })
            .catch((error) => {
                console.log('Error', error);
            });
    }

    static sendNoNotification(
        topic,
        fcm_id,
        message,
        entity_id,
        entity_type,
        student_id,
        admin,
        db,
    ) {
        const registrationTokens = [fcm_id];
        console.log(fcm_id);
        return admin
            .messaging()
            .unsubscribeFromTopic(registrationTokens, topic)
            .then((response) => {
                console.log('Successfully unsubscribed from topic:', response);
                // send notification to all to this topic
                const messageTosend = {};
                messageTosend.data = message;
                messageTosend.topic = topic;
                messageTosend.android = {
                    priority: 'high',
                    ttl: 4500,
                };
                return admin.messaging().send(messageTosend);
            })
            .then((response2) => {
                console.log('response2');
                console.log(response2);
                return mysqlStudent.getStudentId(
                    entity_id,
                    entity_type,
                    student_id,
                    db.mysql.read,
                );
            })
            .then((check) => {
                console.log('check');
                console.log(check);
                if (check.length > 0) {
                    console.log('unsubscribe from topic');
                    return new Promise(((resolve) => {
                        resolve([]);
                    }));
                }
                console.log('<<<<<<<<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>>>>>');
                console.log('Subscribed to topic');
                return admin.messaging().subscribeToTopic(registrationTokens, topic);
            })
            .catch((error) => {
                console.log('Error', error);
            });
    }

    static unsubscribeNotification(entity_type, entity_id, gcm_reg_id, admin) {
        const topic = `${entity_type}_${entity_id}`;
        const unsubscribeToken = [gcm_reg_id];
        console.log(gcm_reg_id);
        return admin.messaging().unsubscribeFromTopic(unsubscribeToken, topic);
    }

    static getBadges(type, name, db) {
        const sql = 'select lower_count as ? ,url from user_badges where is_active =1 and type=?';
        return db.query(sql, [name, type]);
    }

    static async addBadgesDetails(data, db) {
        const badgeDetails = {};

        // let cdn = config.cdn_url + "images/"
        badgeDetails.question = await this.getBadges(
            'question',
            'question_count',
            db,
        );
        badgeDetails.videos_viewed = await this.getBadges(
            'videos_viewed',
            'videos_viewed',
            db,
        );
        console.log('badghedetils');
        console.log(badgeDetails);
        // let cdn = config.cdn_url + "images/"
        const res = [];

        // eslint-disable-next-line no-restricted-syntax
        for (const key in badgeDetails) { // eslint-disable-line guard-for-in
            let obj;
            if (key == 'question') {
                if (data.total_questions_asked > 0) {
                    for (let i = 0; i < badgeDetails[key].length; i++) {
                        if (i == 0) {
                            console.log('0');
                            console.log(data.total_questions_asked);
                            if (
                                data.total_questions_asked > i
                                && data.total_questions_asked
                                < badgeDetails[key][i].question_count
                            ) {
                                console.log('test 4');
                                // badgeDetails[key][i]['limit'] = i + '-' + badgeDetails[key][i]['question_count']
                                // badgeDetails[key][i]['next_badge'] = badgeDetails[key][i]['question_count'] - data['total_questions_asked']
                                // delete badgeDetails[key][i]['question_count']
                                // temp = data['total_questions_asked']
                                // data['total_questions_asked'] = {}
                                // data['total_questions_asked']['count'] = temp
                                // data['total_questions_asked']['badge'] = badgeDetails[key][i]
                                obj = {};
                                obj.title = 'Questions Asked';
                                obj.count = data.total_questions_asked;
                                obj.url = badgeDetails[key][i].url;
                                obj.limit = `${i}-${badgeDetails[key][i].question_count}`;
                                obj.next_badge = badgeDetails[key][i].question_count
                                    - data.total_questions_asked;
                                res.push(obj);
                            }
                        } else if (
                            data.total_questions_asked
                            > badgeDetails[key][i - 1].question_count
                            && data.total_questions_asked
                            < badgeDetails[key][i].question_count
                        ) {
                            console.log('test1');
                            // badgeDetails[key][i]['limit'] = badgeDetails[key][i - 1]['question_count'] + '-' + badgeDetails[key][i]['question_count']
                            // badgeDetails[key][i]['next_badge'] = badgeDetails[key][i]['question_count'] - data['total_questions_asked']
                            // delete badgeDetails[key][i]['question_count']
                            // temp = data['total_questions_asked']
                            // data['total_questions_asked'] = {}
                            // data['total_questions_asked']['count'] = temp
                            // data['total_questions_asked']['badge'] = badgeDetails[key][i]
                            obj = {};
                            obj.title = 'Questions Asked';
                            obj.count = data.total_questions_asked;
                            obj.url = badgeDetails[key][i].url;
                            obj.limit = `${badgeDetails[key][i - 1].question_count}-${badgeDetails[key][i].question_count}`;
                            obj.next_badge = badgeDetails[key][i].question_count
                                - data.total_questions_asked;
                            res.push(obj);
                        }
                    }
                } else {
                    // temp = data['total_questions_asked']
                    // badgeDetails[key][0]['next_badge'] = badgeDetails[key][1]['question_count']
                    // delete badgeDetails[key][0]['question_count']
                    // data['total_questions_asked'] = {}
                    // data['total_questions_asked']['count'] = temp
                    // data['total_questions_asked']['badge'] = badgeDetails[key][0]
                    obj = {};
                    obj.title = 'Questions Asked';
                    obj.count = data.total_questions_asked;
                    obj.url = badgeDetails[key][0].url;
                    obj.limit = `${badgeDetails[key][0].question_count}-${badgeDetails[key][1].question_count}`;
                    obj.next_badge = badgeDetails[key][1].question_count;
                    res.push(obj);
                }
            } else if (key == 'videos_viewed') {
                if (data.total_video_count > 0) {
                    for (let i = 0; i < badgeDetails[key].length; i++) {
                        if (i == 0) {
                            if (
                                data.total_video_count > i
                                && data.total_video_count
                                < badgeDetails[key][i].videos_viewed
                            ) {
                                // badgeDetails[key][i]['limit'] = i + '-' + badgeDetails[key][i]['videos_viewed']
                                // badgeDetails[key][i]['next_badge'] = badgeDetails[key][i]['videos_viewed'] - data['total_video_count']
                                // delete badgeDetails[key][i]['videos_viewed']
                                // temp = data['total_video_count']
                                // data['total_video_count'] = {}
                                // data['total_video_count']['count'] = temp
                                // data['total_video_count']['badge'] = badgeDetails[key][i]
                                obj = {};
                                obj.title = 'Videos Viewed';
                                obj.count = data.total_video_count;
                                obj.url = badgeDetails[key][i].url;
                                obj.limit = `${i}-${badgeDetails[key][i].videos_viewed}`;
                                obj.next_badge = badgeDetails[key][i].videos_viewed
                                    - data.total_video_count;
                                res.push(obj);
                            }
                        } else if (
                            data.total_video_count
                            > badgeDetails[key][i - 1].videos_viewed
                            && data.total_video_count
                            < badgeDetails[key][i].videos_viewed
                        ) {
                            // badgeDetails[key][i]['limit'] = badgeDetails[key][i - 1]['videos_viewed'] + '-' + badgeDetails[key][i]['videos_viewed']
                            // badgeDetails[key][i]['next_badge'] = badgeDetails[key][i]['videos_viewed'] - data['total_video_count']
                            // delete badgeDetails[key][i]['videos_viewed']
                            // temp = data['total_video_count']
                            // data['total_video_count'] = {}
                            // data['total_video_count']['count'] = temp
                            // data['total_video_count']['badge'] = badgeDetails[key][i]
                            obj = {};
                            obj.title = 'Videos Viewed';
                            obj.count = data.total_video_count;
                            obj.url = badgeDetails[key][i].url;
                            obj.limit = `${badgeDetails[key][i - 1].videos_viewed}-${badgeDetails[key][i].videos_viewed}`;
                            obj.next_badge = badgeDetails[key][i].videos_viewed
                                - data.total_video_count;
                            res.push(obj);
                        }
                    }
                } else {
                    // temp = data['total_video_count']
                    // badgeDetails[key][0]['next_badge'] = badgeDetails[key][1]['videos_viewed']
                    // delete badgeDetails[key][0]['videos_viewed']
                    // data['total_video_count'] = {}
                    // data['total_video_count']['count'] = temp
                    // data['total_video_count']['badge'] = badgeDetails[key][0]
                    obj = {};
                    obj.title = 'Videos Viewed';
                    obj.count = data.total_video_count;
                    obj.url = badgeDetails[key][0].url;
                    obj.limit = `${badgeDetails[key][0].videos_viewed}-${badgeDetails[key][1].videos_viewed}`;
                    obj.next_badge = badgeDetails[key][1].videos_viewed;
                    res.push(obj);
                }
            }
        }
        console.log('data');
        console.log(data);
        delete data.total_questions_asked;
        delete data.total_video_count;
        data.badges = res;
        return data;
    }

    static generateUsername(is_web) {
        let fname;
        if (is_web) {
            fname = 'Guest ';
        } else {
            fname = chance.name();
        }
        const random1 = randomstring.generate({
            length: 3,
            charset: 'alphabetic',
        });
        const random2 = Math.floor(Math.random() * 1000) + 1000;
        fname = fname.substr(0, 3);
        const lname = random2 + random1;
        return fname + lname;
    }

    static getLanguageObject(languages_obj) {
        const lang_obj = {};
        for (let i = 0; i < languages_obj.length; i++) {
            lang_obj[languages_obj[i].code] = languages_obj[i].language;
        }
        return lang_obj;
    }

    static compare(dateTimeA, dateTimeB) {
        const momentA = moment(dateTimeA).startOf('day');
        const momentB = moment(dateTimeB).startOf('day');
        // console.log(momentA +"_"+momentB)
        if (momentA > momentB) return 1;
        if (momentA < momentB) return -1;
        return 0;
    }

    static getOffset(page_no, page_length) {
        let offset;
        if (page_no > 1) {
            offset = (page_no - 1) * page_length;
        } else if (page_no == 1) {
            offset = 0;
        }
        return offset;
    }

    static getWhatsappDataModified(whatsappData) {
        whatsappData[0].key_value = JSON.parse(whatsappData[0].key_value);
        whatsappData[0].image_url = whatsappData[0].key_value.image_url;
        whatsappData[0].description = whatsappData[0].key_value.description;
        whatsappData[0].button_text = whatsappData[0].key_value.button_text;
        whatsappData[0].button_bg_color = whatsappData[0].key_value.button_bg_color;
        whatsappData[0].action_activity = whatsappData[0].key_value.action_activity;
        whatsappData[0].action_data = whatsappData[0].key_value.action_data;
        whatsappData[0].resource_type = 'card';
        delete whatsappData[0].key_value;
        return whatsappData[0];
    }

    static addThumbnailWithLanguage(question_array, locale, config) {
        for (let i = 0; i < question_array.length; i++) {
            if (locale != 'en') {
                if (question_array[i].matched_question == null) {
                    question_array[i].thumbnail_image = `${config.staticCDN}q-thumbnail/${locale}_${question_array[i].question_id}.webp`;
                } else {
                    question_array[i].thumbnail_image = `${config.staticCDN}q-thumbnail/${locale}_${question_array[i].matched_question}.webp`;
                }
            } else if (question_array[i].matched_question == null) {
                question_array[i].thumbnail_image = `${config.staticCDN}q-thumbnail/${question_array[i].question_id}.webp`;
            } else {
                question_array[i].thumbnail_image = `${config.staticCDN}q-thumbnail/${question_array[i].matched_question}.webp`;
            }
        }
        return question_array;
    }

    static addThumbnailWithLanguageNew(question_array, locale, config) {
        const languages = ['english', 'hindi', 'bengali', 'gujarati', 'malayalam', 'marathi', 'nepali', 'punjabi', 'tamil', 'urdu'];
        const localeArr = ['en', 'hi', 'bn', 'gu', 'ml', 'mr', 'ne', 'pa', 'ta', 'ur'];
        const indexNumber = localeArr.indexOf(locale);
        const lang = languages[indexNumber];
        for (let i = 0; i < question_array.length; i++) {
            if (question_array[i].matched_question == null) {
                question_array[i].thumbnail_image = `${config.staticCDN}q-thumbnail-localized/${question_array[i].question_id}/${lang}.webp`;
            } else {
                question_array[i].thumbnail_image = `${config.staticCDN}q-thumbnail-localized/${question_array[i].matched_question}/${lang}.webp`;
            }
        }
        return question_array;
    }

    static async addThumbnailsByLanguage(db, questionArray, locale, config) {
        const { specialThumbnailIds } = Data;

        const sidQueryPromise = [];
        questionArray.forEach((x) => {
            // sidQueryPromise.push(QuestionMysql.getByQuestionId(x.question_id, db.mysql.read));
            sidQueryPromise.push(QuestionContainerV2.getByQuestionId(x.question_id, db));
        });
        const studentIdRes = await Promise.all(sidQueryPromise);

        for (let i = 0; i < questionArray.length; i++) {
            const getData = studentIdRes.filter((x) => x[0] && x[0].question_id == questionArray[i].question_id);
            let sid = 0;
            if (getData[0] && getData[0].length == 1) {
                sid = getData[0][0].student_id;
            }
            if (questionArray[i].matched_question == null) {
                questionArray[i].thumbnail_image = specialThumbnailIds.includes(parseInt(sid)) ? `${config.staticCDN}q-thumbnail/${questionArray[i].question_id}.webp` : `${config.cdn_url}question-thumbnail/${locale}_${questionArray[i].question_id}.webp`;
            } else {
                questionArray[i].thumbnail_image = specialThumbnailIds.includes(parseInt(sid)) ? `${config.staticCDN}q-thumbnail/${questionArray[i].matched_question}.webp` : `${config.cdn_url}question-thumbnail/${locale}_${questionArray[i].matched_question}.webp`;
            }
        }
        return questionArray;
    }

    static replaceSpecialSymbol(text) {
        text = text.replace(new RegExp('\\*', 'g'), 'xx');
        text = text.replace(new RegExp('√', 'g'), 'sqrt');
        text = text.replace(new RegExp('π', 'g'), 'pi');
        text = text.replace(new RegExp('÷', 'g'), ':-');
        text = text.replace(new RegExp('×', 'g'), 'xx');
        text = text.replace(new RegExp('∆', 'g'), 'Delta');
        text = text.replace(new RegExp('°', 'g'), '^@');
        text = text.replace(new RegExp('<', 'g'), 'lt');
        text = text.replace(new RegExp('>', 'g'), 'gt');
        text = text.replace(new RegExp('<=', 'g'), 'le');
        text = text.replace(new RegExp('>=', 'g'), 'ge');

        text = text.replace(new RegExp('& dd; ', 'g'), 'd');
        text = text.replace(new RegExp('& compfn;', 'g'), '@');
        text = text.replace(new RegExp('&dd;', 'g'), 'd');
        text = text.replace(new RegExp('&compfn;', 'g'), '@');
        text = text.replace(new RegExp('\n', 'g'), '');
        text = text.replace(new RegExp('\r', 'g'), '');
        text = text.replace(new RegExp('"', 'g'), '');
        text = text.replace(new RegExp('α', 'g'), 'alpha');
        text = text.replace(new RegExp('β', 'g'), 'beta');
        text = text.replace(new RegExp('ß', 'g'), 'beta');
        text = text.replace(new RegExp('θ', 'g'), 'theta');
        text = text.replace(new RegExp('°', 'g'), '^@');
        text = text.replace(new RegExp('γ', 'g'), 'gamma');
        text = text.replace(new RegExp('δ', 'g'), 'delta');
        text = text.replace(new RegExp('Δ', 'g'), 'Delta');
        text = text.replace(new RegExp('φ', 'g'), 'phi');
        text = text.replace(new RegExp('ω', 'g'), 'omega');
        text = text.replace(new RegExp('Ω', 'g'), 'Omega');
        text = text.replace(new RegExp('λ', 'g'), 'lambda');
        text = text.replace(new RegExp('μ', 'g'), 'mu');
        text = text.replace(new RegExp('Σ', 'g'), 'sum');
        text = text.replace(new RegExp('Π', 'g'), 'prod');
        text = text.replace(new RegExp('→', 'g'), 'vec');
        text = text.replace(new RegExp('∞', 'g'), 'oo');
        text = text.replace(new RegExp('√', 'g'), 'sqrt');
        text = text.replace(new RegExp('& sol;', 'g'), '/');
        text = text.replace(new RegExp('& ell; ', 'g'), 'l');
        text = text.replace(new RegExp('& dd x', 'g'), 'dx');
        text = text.replace(new RegExp('& dd y', 'g'), 'dy');
        return text;
    }

    static replaceSpecialSymbol2(text) {
        text = text.replace(new RegExp('\\*', 'g'), 'xx');
        text = text.replace(new RegExp('√', 'g'), 'sqrt');
        text = text.replace(new RegExp('π', 'g'), 'pi');
        text = text.replace(new RegExp('÷', 'g'), ':-');
        text = text.replace(new RegExp('×', 'g'), 'xx');
        text = text.replace(new RegExp('∆', 'g'), 'Delta');
        text = text.replace(new RegExp('°', 'g'), '^@');
        text = text.replace(new RegExp('<', 'g'), 'lt');
        text = text.replace(new RegExp('>', 'g'), 'gt');
        text = text.replace(new RegExp('<=', 'g'), 'le');
        text = text.replace(new RegExp('>=', 'g'), 'ge');

        text = text.replace(new RegExp('& dd; ', 'g'), 'd');
        text = text.replace(new RegExp('& compfn;', 'g'), '@');
        text = text.replace(new RegExp('&dd;', 'g'), 'd');
        text = text.replace(new RegExp('&compfn;', 'g'), '@');
        text = text.replace(new RegExp('\n', 'g'), '');
        text = text.replace(new RegExp('\r', 'g'), '');
        text = text.replace(new RegExp('"', 'g'), '');
        text = text.replace(new RegExp('α', 'g'), 'alpha');
        text = text.replace(new RegExp('β', 'g'), 'beta');
        text = text.replace(new RegExp('ß', 'g'), 'beta');
        text = text.replace(new RegExp('θ', 'g'), 'theta');
        text = text.replace(new RegExp('°', 'g'), '^@');
        text = text.replace(new RegExp('γ', 'g'), 'gamma');
        text = text.replace(new RegExp('δ', 'g'), 'delta');
        text = text.replace(new RegExp('Δ', 'g'), 'Delta');
        text = text.replace(new RegExp('φ', 'g'), 'phi');
        text = text.replace(new RegExp('ω', 'g'), 'omega');
        text = text.replace(new RegExp('Ω', 'g'), 'Omega');
        text = text.replace(new RegExp('λ', 'g'), 'lambda');
        text = text.replace(new RegExp('μ', 'g'), 'mu');
        text = text.replace(new RegExp('Σ', 'g'), 'sum');
        text = text.replace(new RegExp('Π', 'g'), 'prod');
        text = text.replace(new RegExp('→', 'g'), 'vec');
        text = text.replace(new RegExp('∞', 'g'), 'oo');
        text = text.replace(new RegExp('√', 'g'), 'sqrt');
        text = text.replace(new RegExp('& sol;', 'g'), '/');
        text = text.replace(new RegExp('& ell; ', 'g'), 'l');
        text = text.replace(new RegExp('& dd x', 'g'), 'dx');
        text = text.replace(new RegExp('& dd y', 'g'), 'dy');

        text = text.replace(new RegExp('{:\\[', 'g'), '');
        text = text.replace(new RegExp('],\\[', 'g'), '');
        text = text.replace(new RegExp(']:}', 'g'), '');
        text = text.replace(new RegExp('"', 'g'), '');

        return text;
    }

    static addThumbnail(question_array, config) {
        for (let i = 0; i < question_array[0].length; i++) {
            if (question_array[0][i].matched_question == null) {
                question_array[0][i].thumbnail_image = `${config.staticCDN}q-thumbnail/${question_array[0][i].question_id}.png`;
            } else {
                question_array[0][i].thumbnail_image = `${config.staticCDN}q-thumbnail/${question_array[0][i].matched_question}.png`;
            }
        }
        return question_array;
    }

    static addWebpThumbnail(question_array, config) {
        for (let i = 0; i < question_array[0].length; i++) {
            if (question_array[0][i].matched_question == null) {
                question_array[0][i].thumbnail_image = `${config.staticCDN}q-thumbnail/${question_array[0][i].question_id}.webp`;
            } else {
                question_array[0][i].thumbnail_image = `${config.staticCDN}q-thumbnail/${question_array[0][i].matched_question}.webp`;
            }
        }
        return question_array;
    }

    static sliceDoubt(doubt) {
        const d = doubt.split('_');
        return `${d.slice(0, d.length - 1).join('_')}_`;
    }

    static getViews(views) {
        const base = 10000;
        const multiplier = 10;
        if (views != null) {
            return base + views * multiplier;
        }
        return base + Math.floor(Math.random() * 50) * multiplier;
    }

    static calculatePollResults(pollResults, options) {
        const data = [];
        let totalSum = 0;
        const groupedPollResults = _.groupBy(pollResults, 'option_id');
        const groupedPollResultsKeyCount = Object.keys(groupedPollResults).length;
        let counter = 0;
        for (let i = 0; i < options.length; i++) {
            if (groupedPollResults[i]) {
                counter += 1;
                let percentage = Math.floor(
                    (groupedPollResults[i].length / pollResults.length) * 100,
                );
                if (counter == groupedPollResultsKeyCount) {
                    percentage = 100 - totalSum;
                } else {
                    totalSum += percentage;
                }
                data.push({ option: options[i], value: percentage });
            } else {
                data.push({ option: options[i], value: 0 });
            }
        }
        return data;
    }

    static async uploadImage(image, blob_url, publicPath, fs, blobService) {
        let extension = '.png';
        const promises = [];
        if (image.indexOf('png') != -1) extension = '.png';
        else if (image.indexOf('jpg') != -1 || image.indexOf('jpeg') != -1) { extension = '.jpg'; }
        image = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
        const fileName = `upload_${moment().unix()}${extension}`;
        const buf = Buffer.from(image, 'base64');
        promises.push(
            fs.writeFileAsync(`${publicPath}/uploads/${fileName}`, image, 'base64'),
        );
        promises.push(this.uploadImageToBlob(blobService, fileName, buf));
        await Promise.all(promises);
        return `${blob_url}q-images/${fileName}`;
    }

    static uploadTos3(s3, bucket_name, file, body, content_type) {
        const params = {
            Bucket: bucket_name,
            Key: file,
            Body: body,
            CacheControl: 'max-age=25920001, public',
            ContentType: content_type,
        };
        console.log(params);
        return s3.putObject(params).promise();
    }

    static deleteImage(path, fileObj) {
        fileObj.unlink(path, (err) => {
            if (err) {
                logger.error({ tag: 'ask', source: 'deleteImage', error: err });

                // console.error(err)
            }
        });
    }

    static getUrl2Base64String(base_url, filename) {
        return new Promise((resolve, reject) => {
            raw_request.get(`${base_url}images/${filename}`, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const data = `data:${response.headers['content-type']};base64,${Buffer.from(body).toString('base64')}`;
                    resolve(data);
                    // console.log(data);
                }
            });
        });
    }

    static isNotSupportedByKatex(ocr_text) {
        return /\b(matrix)\b/.test(ocr_text);
    }

    static async uploadImageToS3(
        image,
        student_id,
        cdn_url,
        publicPath,
        fs,
        s3,
        bucket_name,
    ) {
        try {
            let extension = '.png';
            const promises = [];
            let content_type;
            if (image.indexOf('png') != -1) {
                extension = '.png';
                content_type = 'image/png';
            } else if (image.indexOf('jpg') != -1 || image.indexOf('jpeg') != -1) {
                extension = '.jpg';
                content_type = 'image/jpg';
            }
            image = image.replace(/^data:([A-Za-z-+/]+);base64,/, '');
            const fileName = `upload_${student_id}_${moment().unix()}${extension}`;
            const buf = Buffer.from(image, 'base64');
            promises.push(
                fs.writeFileAsync(`${publicPath}/uploads/${fileName}`, image, 'base64'),
            );
            promises.push(
                this.uploadTos3(s3, bucket_name, fileName, buf, content_type),
            );
            await Promise.all(promises);
            return `${cdn_url}images/${fileName}`;
        } catch (e) {
            console.log(e);
            return '';
        }
    }

    // decryption______________________________________________________________________________

    // static decryptData(encryptedAesKey, encryptedData, iv) {
    //   //let keyBuffer= new Buffer(encryptedAesKey);
    //   // path to private key pem file
    //   //change string iv to byte array
    //
    //   console.log("Encrypted data : " + encryptedData);
    //   let dataarray = new Uint8Array(encryptedData.length);
    //   for (let i = 0; i < encryptedData.length; i++) {
    //     dataarray[i] = encryptedData.charCodeAt(i);
    //   }
    //
    //   console.log(dataarray); //This is the byte array for data
    //   //encryptedAesKey = new Buffer(encryptedAesKey,'base64');
    //
    //   let privateKey = ursa.createPrivateKey(
    //     fs.readFileSync(path.resolve(__dirname, "../encryptKeys/private.pem"))
    //   );
    //   let ivarray = new Uint8Array(iv.length);
    //   for (let i = 0; i < iv.length; i++) {
    //     ivarray[i] = iv.charCodeAt(i);
    //   }
    //
    //   console.log("IVarray : " + ivarray);
    //   //The decrypted key using the private key
    //
    //   let decryptedAESkey = privateKey.decrypt(
    //     encryptedAesKey,
    //     "hex",
    //     "utf8",
    //     ursa.RSA_NO_PADDING
    //   ); // This returns a buffer
    //   let keyArray = new Uint8Array(decryptedAESkey.length);
    //   for (let i = 0; i < decryptedAESkey.length; i++) {
    //     keyArray[i] = decryptedAESkey.charCodeAt(i);
    //   }
    //   let decryptedAesKey = [];
    //
    //   for (let i = 0; i < keyArray.length; i++) {
    //     if (keyArray[i] != 0) {
    //       decryptedAesKey.push(keyArray[i]);
    //     }
    //   }
    //   //decryptedAESkey = new Buffer.from(decryptedAESkey);
    //   console.log(
    //     "________________________________________________________________________"
    //   );
    //   //console.log(decryptedAESkey);
    //   decryptedAesKey = new Buffer.from(decryptedAesKey);
    //   ivarray = new Buffer.from(ivarray);
    //   console.log(decryptedAesKey);
    //   // decryptedAESkey = decryptedAESkey.toString('base64'); // Key in string format.
    //   //decryptedAESkey = new Buffer.from(decryptedAESkey);
    //   console.log("decryptedAESkey : " + keyArray); // See the decrypted AES key.
    //
    //   //Now using this decrypted AES key decrypt the encrypted data.
    //
    //   let decryptedData = crypto
    //     .createDecipheriv("aes-128-ctr", decryptedAesKey, ivarray)
    //     .update(encryptedData, "hex", "utf8");
    //
    //   console.log("This is the decrypted data :");
    //
    //   console.log(decryptedData.toString("utf8")); //decrypted data
    //
    //   return decryptedData;
    // }

    static findPatternInCommentMessage(message) {
        // var rx = /(\###.*?\###)/;
        const pattern = '##';
        const split = message.split(' ');
        console.log(split);
        // check if starts and end with pattern
        for (let i = 0; i < split.length; i++) {
            if (split[i].length > 3) {
                const start = split[i].substr(0, 2);
                console.log(start);
                if (start == pattern) {
                    // check end of string
                    const end = split[i].substr(split[i].length - 2);
                    if (end == pattern) {
                        console.log('true');
                        // check if it is a string number
                        const st = split[i].split(pattern)[1];
                        // eslint-disable-next-line no-restricted-globals
                        if (!isNaN(st)) {
                            console.log(st);
                            return st;
                        }
                    }
                }
            }
        }

        return false;
    }

    static commentLengthCheck(message, maxMessageLength) {
        if (message.length) {
            let duplicate_message = _.join(_.split(message, '\n', 10), '\n');
            if (duplicate_message.length > maxMessageLength) {
                duplicate_message = duplicate_message.substring(0, maxMessageLength).concat('...........');
            }
            // eslint-disable-next-line no-useless-escape
            const url_finder_regex = /((?:(http|https|Http|Https|rtsp|Rtsp):\/\/(?:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,64}(?:\:(?:[a-zA-Z0-9\$\-\_\.\+\!\*\'\(\)\,\;\?\&\=]|(?:\%[a-fA-F0-9]{2})){1,25})?\@)?)?((?:(?:[a-zA-Z0-9][a-zA-Z0-9\-]{0,64}\.)+(?:(?:aero|arpa|asia|a[cdefgilmnoqrstuwxz])|(?:biz|b[abdefghijmnorstvwyz])|(?:cat|com|coop|c[acdfghiklmnoruvxyz])|d[ejkmoz]|(?:edu|e[cegrstu])|f[ijkmor]|(?:gov|g[abdefghilmnpqrstuwy])|h[kmnrtu]|(?:info|int|i[delmnoqrst])|(?:jobs|j[emop])|k[eghimnrwyz]|l[abcikrstuvy]|(?:mil|mobi|museum|m[acdghklmnopqrstuvwxyz])|(?:name|net|n[acefgilopruz])|(?:org|om)|(?:pro|p[aefghklmnrstwy])|qa|r[eouw]|s[abcdeghijklmnortuvyz]|(?:tel|travel|t[cdfghjklmnoprtvwz])|u[agkmsyz]|v[aceginu]|w[fs]|y[etu]|z[amw]))|(?:(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9])\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[1-9]|0)\.(?:25[0-5]|2[0-4][0-9]|[0-1][0-9]{2}|[1-9][0-9]|[0-9])))(?:\:\d{1,5})?)(\/(?:(?:[a-zA-Z0-9\;\/\?\:\@\&\=\#\~\-\.\+\!\*\'\(\)\,\_])|(?:\%[a-fA-F0-9]{2}))*)?(?:\b|$)/g;
            let url_checker;
            do {
                url_checker = url_finder_regex.exec(duplicate_message);
                if (url_checker) {
                    if (!url_checker[0].includes('doubtnut')) {
                        duplicate_message = duplicate_message.replace(url_checker[0], ' ');
                    }
                }
            } while (url_checker);

            return duplicate_message;
        }
        return message;
    }

    static checkcAnswer(answer) {
        const a = moment(answer[0].date).format('YYYY-MM-DD');
        const b = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .format('YYYY-MM-DD');

        // let startTime = moment(answer[0]['time_start']).format("HH:mm:SS")
        const startTime = answer[0].time_start;
        const now = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .format('HH:mm:SS');
        // let endTime = moment(answer[0]['time_end']).format("HH:mm:SS")
        const endTime = answer[0].time_end;
        if (a == b && startTime < now && endTime > now) {
            return 1;
        }
        return 0;
    }

    static shuffle(array) {
        let currentIndex = array.length;
        let temporaryValue;
        let randomIndex;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }

        return array;
    }

    static generateColorArr(colors) {
        const colorarr = [];

        for (let i = 0; i < 5; i++) {
            const o = colors;
            this.shuffle(o);
            // console.log(o)
            colorarr[i] = [o[0], o[0], o[0], o[0], o[0]];
        }
        return colorarr;
    }

    // static getLocationDetails(lat, long) {
    //     let currentIndex = array.length;
    //     let temporaryValue;
    //     let randomIndex;

    //     // While there remain elements to shuffle...
    //     while (currentIndex != 0) {
    //         // Pick a remaining element...
    //         randomIndex = Math.floor(Math.random() * currentIndex);
    //         currentIndex -= 1;

    //         // And swap it with the current element.
    //         temporaryValue = array[currentIndex];
    //         array[currentIndex] = array[randomIndex];
    //         array[randomIndex] = temporaryValue;
    //     }

    //     return array;
    // }

    static createMilestoneText(type, count) {
        let image_url;
        if (type == 'video_view') {
            if (count == 5) {
                image_url = `${config.staticCDN}engagement_framework/video_5.png`;
            } else if (count == 10) {
                image_url = `${config.staticCDN}engagement_framework/video_10.png`;
            } else if (count == 50) {
                image_url = `${config.staticCDN}engagement_framework/video_50.png`;
            }

            return [`${count} videos watched today !!`, image_url];
        } if (type == 'question_asked') {
            if (count == 5) {
                image_url = `${config.staticCDN}engagement_framework/question_5.png`;
            } else if (count == 10) {
                image_url = `${config.staticCDN}engagement_framework/question_10.png`;
            } else if (count == 50) {
                image_url = `${config.staticCDN}engagement_framework/question_50.png`;
            }
            return [`${count} questions asked today !!`, image_url];
        }
    }

    static async generateMatchedData(
        blob_url,
        value,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            delete value.view_id;
            if (
                typeof value.question_image === 'undefined'
                || value.question_image == null
            ) {
                value.image_url = null;
            } else {
                value.image_url = `${blob_url}images/${value.question_image}`;
            }
            delete value.question_image;
            delete value.matched_question;
            value = await self.generateCommentLikeData(
                value,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // value = await self.getImage(value,FeedContainer,db)
            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateAnsweredData(
        blob_url,
        value,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            value.question_id = value.id;
            if (value.matched_question == null) {
                value.image_url = `${blob_url}q-thumbnail/${value.question_id}.png`;
            } else {
                value.image_url = `${blob_url}q-thumbnail/${value.matched_question}.png`;
            }
            delete value.matched_question;
            value = await self.generateCommentLikeData(
                value,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // value = await self.getImage(value,FeedContainer,db)

            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateUnansweredData(
        blob_url,
        value,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            if (
                typeof value.question_image === 'undefined'
                || value.question_image == null
            ) {
                value.image_url = null;
            } else {
                value.image_url = `${blob_url}images/${value.question_image}`;
            }
            delete value.question_image;
            value = await self.generateCommentLikeData(
                value,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // value = await self.getImage(value,FeedContainer,db)

            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateEngagementData(
        blob_url,
        value,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        Feed,
        db,
    ) {
        const self = this;
        try {
            if (value.type == 'polling') {
                delete value.data;
                delete value.action;
                delete value.action_data;
                let isPolled = 0;
                const pollResults = await Feed.getPollResults(value.id, db.mysql.read);
                const index = pollResults.filter((obj) => {
                    if (obj.student_id == student_id) {
                        return obj;
                    }
                    return false;
                });
                value.user_response = null;

                if (index.length > 0) {
                    isPolled = 1;
                    value.user_response = index[0].option_id;
                }
                value.is_polled = isPolled;
                if (value.options != '' || value.options != null) {
                    const options_value = value.options.split(':');
                    if (options_value.length > 0) {
                        value.options = options_value;
                    } else if (options_value.length == 0) {
                        value.options = [];
                    }
                } else {
                    value.options = [];
                }
                value.total_polled_count = pollResults.length;
                value.result = self.calculatePollResults(
                    pollResults,
                    value.options,
                );
            } else if (value.type == 'youtube') {
                value.youtube_id = value.action_data;
                delete value.data;
                // delete values[i]['text']
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
                delete value.action;
                delete value.action_data;
            } else if (value.type == 'url') {
                value.url = value.action_data;
                delete value.data;
                // delete values[i]['text']
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
                delete value.action;
                delete value.action_data;
            } else if (value.type == 'pdf') {
                value.url = value.action_data;
                delete value.data;
                // delete values[i]['text']
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
                delete value.image_url;
                delete value.action;
                delete value.action_data;
            } else if (value.type == 'product_features') {
                value.action_data = JSON.parse(value.action_data);
                const random = Math.floor(Math.random() * 10);
                value.created_at = moment().subtract(random, 'hours').format();
                value.button_text = value.text;
                delete value.data;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
            } else if (value.type == 'viral_videos') {
                delete value.data;
                delete value.text;
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.correct_option;
                delete value.action;
                delete value.action_data;
                delete value.poll_category;
            }
            value = await self.generateCommentLikeData(
                value,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // value = await self.getImage(value,FeedContainer,db)
            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateEngagementDataWithoutComment(
        blob_url,
        value,
        student_id,
        FeedContainer,
        MysqlFeed,
        Feed,
        db,
    ) {
        const self = this;
        try {
            if (value.type == 'polling') {
                delete value.data;
                delete value.action;
                delete value.action_data;
                let isPolled = 0;
                const pollResults = await Feed.getPollResults(
                    value.id,
                    db.mysql.read,
                );
                const index = pollResults.filter((obj) => {
                    if (obj.student_id == student_id) {
                        return obj;
                    }
                    return false;
                });
                value.user_response = null;

                if (index.length > 0) {
                    isPolled = 1;
                    value.user_response = index[0].option_id;
                }
                value.is_polled = isPolled;

                if (value.options != '' || value.options != null) {
                    const options_value = value.options.split(':');
                    if (options_value.length > 0) {
                        value.options = options_value;
                    } else if (options_value.length == 0) {
                        value.options = [];
                    }
                } else {
                    value.options = [];
                }
                value.total_polled_count = pollResults.length;
                value.result = self.calculatePollResults(
                    pollResults,
                    value.options,
                );
            } else if (value.type == 'youtube') {
                value.youtube_id = value.action_data;
                delete value.data;
                // delete values[i]['text']
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
                delete value.action;
                delete value.action_data;
            } else if (value.type == 'url') {
                value.url = value.action_data;
                delete value.data;
                // delete values[i]['text']
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
                delete value.action;
                delete value.action_data;
            } else if (value.type == 'pdf') {
                value.url = value.action_data;
                delete value.data;
                // delete values[i]['text']
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
                delete value.image_url;
                delete value.action;
                delete value.action_data;
            } else if (value.type == 'product_features') {
                value.action_data = JSON.parse(value.action_data);
                const random = Math.floor(Math.random() * 10);
                value.created_at = moment()
                    .subtract(random, 'hours')
                    .format();
                value.button_text = value.text;
                delete value.data;
                delete value.options;
                delete value.blog_url;
                delete value.question_id;
                delete value.correct_option;
            } else if (value.type == 'viral_videos') {
                delete value.data;
                delete value.text;
                delete value.title;
                delete value.options;
                delete value.blog_url;
                delete value.correct_option;
                delete value.action;
                delete value.action_data;
                delete value.poll_category;
            }

            // value = await self.generateCommentLikeData(value, student_id, comment, CommentContainer, FeedContainer, MysqlFeed, db)
            // value = await self.getImage(value,FeedContainer,db)
            delete value.student;
            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateContestTypes(
        data,
        blob_url,
        values,
        page_no,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            const groupedContestWinners = _.groupBy(values, 'contest_id');
            console.log(groupedContestWinners);
            // eslint-disable-next-line no-restricted-syntax
            for (const key in groupedContestWinners) { // eslint-disable-line guard-for-in
                let sample = {};
                sample.type = 'contest_winners';
                sample.id = key;
                sample.id2 = `${key}_${moment().subtract(page_no, 'days').format('YYYY-MM-DD')}`;
                sample.student_username = 'contest';
                sample.text = `Congratulations to the winner of ${groupedContestWinners[key][0].contest_name} for ${moment().subtract(page_no, 'days').format('MMMM Do YYYY')} Cheers :D !!`;
                sample.profile_image = `${config.staticCDN}engagement_framework/contest.jpeg`;
                sample.created_at = moment()
                    .subtract(page_no, 'days')
                    .format();
                sample.student_list = groupedContestWinners[key];
                sample.action = 'daily_contest';
                sample.action_data = null;
                // eslint-disable-next-line no-await-in-loop
                sample = await self.generateCommentLikeData(
                    sample,
                    student_id,
                    comment,
                    CommentContainer,
                    FeedContainer,
                    MysqlFeed,
                    db,
                );
                // sample = await self.getImage(sample,FeedContainer,db)
                data.push(sample);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateQuizWinners(
        blob_url,
        values,
        page_no,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            let sample = {};
            sample.type = 'quiz_winners';
            sample.id = student_id;
            sample.id2 = moment().subtract(page_no, 'days').format('YYYY-MM-DD');
            sample.student_username = 'contest';
            sample.text = `Congratulation to Quiz winners for ${moment().subtract(page_no, 'days').format('MMMM Do YYYY')}`;
            sample.profile_image = `${config.staticCDN}engagement_framework/contest.jpeg`;
            sample.created_at = values[0].date_q;
            sample.student_list = values;
            sample.action = 'quiz';
            sample.action_data = null;
            sample = await self.generateCommentLikeData(
                sample,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // sample = await self.getImage(sample,FeedContainer,db)
            return sample;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateQuizData(
        blob_url,
        values,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            values.student_username = 'doubtnut';
            values.profile_image = `${config.staticCDN}images/logo.png`;
            values.image_url = `${config.staticCDN}engagement_framework/take_quiz.png`;
            values = await self.generateCommentLikeData(
                values,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // values = await self.getImage(values,FeedContainer,db)

            return values;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateMilestone(
        blob_url,
        values,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            const d = self.createMilestoneText(values.view_type, values.count);
            values.text = d[0];
            values.image_url = d[1];
            values = await self.generateCommentLikeData(
                values,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            return values;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateInvite(
        blob_url,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            let sample = {};
            sample.type = 'invite';
            sample.id = '1';
            sample.action = 'invite';
            sample.action_data = null;
            sample.text = 'Invite to earn';
            sample.image_url = `${config.staticCDN}engagement_framework/Invite_Us.png`;
            sample = await self.generateCommentLikeData(
                sample,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // sample = await self.getImage(sample,FeedContainer,db)

            sample.student_username = 'doubtnut';
            sample.profile_image = `${config.staticCDN}images/logo.png`;
            return sample;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generateUgcData(
        value,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            let sample = {};
            sample.type = 'ugc';
            sample.id = value._id;
            sample.post_type = value.type;
            sample.student_id = value.student_id;
            sample.text = value.text;
            sample.url = value.url;
            sample.image_url = value.image;
            sample.audio = value.audio;
            sample.video = value.video;
            sample.student_username = value.student_username;
            sample.profile_image = value.student_avatar;
            sample.created_at = value.createdAt;
            sample.og_title = value.og_title;
            sample.og_des = value.og_des;
            sample.og_url = value.og_url;
            sample.og_image = value.og_image;
            sample = await self.generateCommentLikeData(
                sample,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // sample = await self.getImage(sample,FeedContainer,db)
            return sample;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static generateUgcDataWithoutLikeComment(value) {
        // let self = this
        // return new Promise(async function (resolve, reject) {
        //   Do async job
        // try {
        const sample = {};
        sample.type = 'ugc';
        sample.id = value._id;
        sample.post_type = value.type;
        sample.student_id = value.student_id;
        sample.text = value.text;
        sample.url = value.url;
        sample.image_url = value.image;
        sample.audio = value.audio;
        sample.video = value.video;
        sample.student_username = value.student_username;
        sample.profile_image = value.student_avatar;
        sample.created_at = value.createdAt;
        sample.og_title = value.og_title;
        sample.og_des = value.og_des;
        sample.og_url = value.og_url;
        sample.og_image = value.og_image;
        // sample = await self.generateCommentLikeData(sample, student_id, comment, CommentContainer, FeedContainer, MysqlFeed, db)
        return sample;
        // } catch (e) {
        //   console.log(e)
        //   reject(e)
        // }
        // })
    }

    static OptIn(phone_num, config, language) {
        const options = {
            method: 'PUT',
            url: `${config.microUrl}/api/whatsapp/gupshup/optin`,
            headers:
            { 'Content-Type': 'application/json' },
            data: {
                phone: `91${phone_num}`,
                locale: language,
            },
            json: true,
        };
        return inst.configMicroInst(options);
    }

    // static OptIn1(phone_num, config) {
    //     return axios({
    //         method: 'GET',
    //         url: 'http://media.smsgupshup.com/GatewayAPI/rest',
    //         qs:
    //         {
    //             method: 'OPT_IN',
    //             format: 'json',
    //             userid: config.optIn.login,
    //             password: config.optIn.password,
    //             phone_number: phone_num,
    //             v: '1.1',
    //             auth_scheme: 'plain',
    //             channel: 'WHATSAPP',
    //         },

    //     }).then((response) => {
    //         resolve(reponse);
    //     }).catch((error) => {
    //         reject(error);
    //         console.log(error);
    //     });

    //     // let self = this;
    //     // return new Promise(async function (resolve, reject) {
    //     //   var options = {
    //     //     method: 'GET',
    //     //     url: 'http://media.smsgupshup.com/GatewayAPI/rest',
    //     //     qs:
    //     //     {
    //     //       method: "OPT_IN",
    //     //       format: "json",
    //     //       userid: config.optIn.login,
    //     //       password: config.optIn.password,
    //     //       phone_number: phone_num,
    //     //       v: '1.1',
    //     //       auth_scheme: 'plain',
    //     //       channel: 'WHATSAPP'
    //     //     }
    //     //   };

    //     //   request(options, function (error, response, body) {
    //     //     if (error) reject(error);
    //     //     console.log(body);
    //     //     resolve(response)
    //     //   });
    //     // });
    // }

    static sendImageOnWhatsApp(phone_number, urlImage, event, config) {
        console.log('inside', config.whatsapp.login);
        console.log('-----urlImage----', urlImage);
        // const self = this;
        return new Promise(((resolve, reject) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                {
                    method: 'SendMediaMessage',
                    send_to: phone_number,
                    msg_type: 'image',
                    userid: config.whatsapp.login,
                    auth_scheme: 'plain',
                    data_encoding: 'Unicode_text',
                    password: config.whatsapp.password,
                    v: '1.1',
                    format: 'text',
                    media_url: urlImage,
                },
            };

            request(options, (error, response, body) => {
                if (error) reject(error);
                console.log(body);
                telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'fact-sent', { event });
                resolve(response);
            });
        }));
    }

    static sendImageOnWhatsAppWithCaption(phone_number, urlImage, caption, event, config) {
        console.log('inside', config.whatsapp.login);
        console.log('-----urlImage----', urlImage);
        // const self = this;
        return new Promise(((resolve, reject) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                {
                    method: 'SendMediaMessage',
                    send_to: phone_number,
                    msg_type: 'image',
                    userid: config.whatsapp.login,
                    auth_scheme: 'plain',
                    data_encoding: 'Unicode_text',
                    password: config.whatsapp.password,
                    caption,
                    v: '1.1',
                    format: 'text',
                    media_url: urlImage,
                },
            };

            request(options, (error, response, body) => {
                if (error) reject(error);
                console.log(body);
                telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'banner-sent', { event });
                resolve(response);
            });
        }));
    }

    static getFacts(type, number, s_id, config) {
        // const self = this;
        return new Promise(((resolve, reject) => {
            const options = {
                method: 'POST',
                url: config.whatsapp_fact.host,
                body:
                {
                    type,
                    number,
                    student_id: s_id,
                },
                json: true,
            };

            request(options, (error, response) => {
                if (error) reject(error);
                resolve(response);
            });
        }));
    }

    static sendWhatsAppMessageHSM(phone_number, text, config) {
        console.log('inside', config.whatsapp.login);
        // const self = this;
        const obj = {};
        obj.type = 'reply_optin';
        obj.data = text;
        return new Promise(((resolve) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                {
                    method: 'SendMessage',
                    send_to: phone_number,
                    msg: text,
                    msg_type: 'TEXT',
                    userid: config.optIn.login,
                    auth_scheme: 'plain',
                    data_encoding: 'Unicode_text',
                    password: config.optIn.password,
                    v: '1.1',
                    format: 'text',
                },
            };

            request(options, (error, response) => {
                // if (error) reject(error);
                // console.log(response)
                // console.log(body);
                // resolve(response)
                obj.response = response.body;
                if (response.body.includes('success')) {
                    obj.success = 1;
                    // console.log('object with success' , obj)
                    Utility.whatsAppLogs(phone_number, obj);
                } else {
                    obj.success = 0;
                    // console.log('object with no success ', obj)
                    Utility.whatsAppLogs(phone_number, obj);
                }
                resolve(response);
            });
        }));
    }

    static async whatsAppLogs(phone_num, data) {
        // console.log('uncomment this')
        const wha = new WhatsAppMessageModel({ phone: phone_num, data });
        await wha.save();
    }

    static async whatsappNetcoreLogs(phone, studentId, event, reply, context, prevContext) {
        return (new WhatsappNetcoreModel({
            phone, studentId, event, reply, context, prevContext,
        }).save());
    }

    static schedulePdf(source, phone, studentId, questionId, results) {
        return (new ScheduledPdf({
            source, phone, studentId, questionId, results,
        }).save());
    }

    static sendWhatsAppMessageWithOgTag(phone_number, text, event, config) {
        // console.log("inside", config.whatsapp.login)
        // const self = this;
        const obj = {};
        obj.type = 'reply';
        obj.data = text;
        return new Promise(((resolve) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                {
                    method: 'SendMessage',
                    send_to: phone_number,
                    msg: text,
                    msg_type: 'DATA_TEXT',
                    userid: config.whatsapp.login,
                    auth_scheme: 'plain',
                    data_encoding: 'Unicode_text',
                    preview_url: true,
                    password: config.whatsapp.password,
                    v: '1.1',
                    format: 'text',
                },
            };

            request(options, (error, response) => {
                obj.response = response.body;
                if (response.body.includes('success')) {
                    obj.success = 1;
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'success', { event });
                    // console.log('object with success' , obj)
                    Utility.whatsAppLogs(phone_number, obj);
                } else {
                    obj.success = 0;
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'failure', { event: 'message-sending-failure' });
                    // console.log('object with no success ', obj)
                    Utility.whatsAppLogs(phone_number, obj);
                }
                resolve(response);
            });
        }));
    }

    static getSubjectLink(sub) {
        console.log('sub||||||||||||||||||||||', sub);
        let subLink = '';
        if (typeof sub !== 'undefined') {
            const subject = sub.toLowerCase();
            if (subject.includes('phy')) {
                subLink = '-physics';
            } else if (subject.includes('chem')) {
                subLink = '-chemistry';
            } else if (subject.includes('bio')) {
                subLink = '-biology';
            } else if (subject.includes('general knowledge')) {
                subLink = '-general-knowledge';
            } else if (subject.includes('geogra')) {
                subLink = '-geography';
            } else if (subject.includes('engl')) {
                subLink = '-english';
            } else if (subject.includes('business studies')) {
                subLink = '-business-studies';
            } else if (subject.includes('hist')) {
                subLink = '-history';
            } else if (subject.includes('accoun')) {
                subLink = '-accounts';
            } else if (subject.includes('econo')) {
                subLink = '-economics';
            } else if (subject.includes('reas')) {
                subLink = '-reasoning';
            } else if (subject.includes('toppers talk')) {
                subLink = '-toppers-talk';
            } else if (subject.includes('motivational videos')) {
                subLink = '-motivational-videos';
            } else if (subject.includes('social science')) {
                subLink = '-social-science';
            } else if (subject.includes('political science')) {
                subLink = '-political-science';
            } else if (subject.includes('science')) {
                subLink = '-science';
            } else if (subject.includes('maths')) {
                subLink = '';
            } else {
                subLink = hyphenize(sub);
            }
        }
        return subLink;
    }

    static cleanString(string) {
        const utf8 = [
            { find: '[áàâãªä]', repl: 'a' },
            { find: '[ÁÀÂÃÄ]', repl: 'A' },
            { find: '[ÍÌÎÏ]', repl: 'I' },
            { find: '[íìîï]', repl: 'i' },
            { find: '[éèêë]', repl: 'e' },
            { find: '[ÉÈÊË]', repl: 'E' },
            { find: '[óòôõºö]', repl: 'o' },
            { find: '[ÓÒÔÕÖ]', repl: 'O' },
            { find: '[úùûü]', repl: 'u' },
            { find: '[ÚÙÛÜ]', repl: 'U' },
            { find: 'ç', repl: 'c' },
            { find: 'Ç', repl: 'C' },
            { find: 'ñ', repl: 'n' },
            { find: 'Ñ', repl: 'N' },
            { find: '–', repl: '-' },
            { find: '[’‘‹›‚]', repl: ' ' },
            { find: '[“”«»„]', repl: ' ' },
            { find: ' ', repl: ' ' },
            { find: '[–°“”‘’×—©ºð@Â€˜™¬]', repl: '' },
        ];

        utf8.forEach((s) => {
            string = string.replace(new RegExp(s.find, 'ug'), s.repl);
        });
        return string;
    }

    static hyphenize(string) {
        const dict = [
            { find: "I'm", repl: 'I am' },
            { find: 'thier', repl: 'their' },
        ];
        const array = [
            { find: '[\\s-]+', repl: '-' },
            { find: '[^A-Za-z0-9-]+', repl: '' },
        ];
        dict.forEach((s) => {
            string = string.replace(new RegExp(s.find, 'g'), s.repl);
        });
        string = this.cleanString(string);
        array.forEach((s) => {
            string = string.replace(new RegExp(s.find, 'g'), s.repl);
        });
        string = decodeURI(string);
        return string;
    }

    static escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static replaceAll(str, term, replacement) {
        return str.replace(new RegExp(this.escapeRegExp(term), 'g'), replacement);
    }

    static ocrToUrl(ocrText) {
        ocrText = this.replaceAll(ocrText, '`', '');
        ocrText = ocrText.replace(/<img[^>]+>/i, '');
        ocrText = this.replaceAll(ocrText, '<br>', '');
        ocrText = this.replaceAll(ocrText, '"', '');
        ocrText = this.replaceAll(ocrText, '&', ' and ');
        ocrText = this.replaceAll(ocrText, '<=', ' le ');
        ocrText = this.replaceAll(ocrText, '>=', ' ge ');
        ocrText = this.replaceAll(ocrText, '->', ' rarr ');
        ocrText = this.replaceAll(ocrText, '>', ' gt ');
        ocrText = this.replaceAll(ocrText, '<', ' lt ');
        ocrText = this.replaceAll(ocrText, ' dot ', ' ');
        ocrText = this.replaceAll(ocrText, '+', '-');
        ocrText = ocrText.replace(/[\n\r]/g, ' ');
        ocrText = ocrText.replace(/\s+/g, ' ');
        ocrText = ocrText.trim();
        ocrText = ocrText.replace(/[ ]{2,}|[\t]/g, ' ');
        ocrText = ocrText.replace(/!\s+!/g, ' ');
        ocrText = this.replaceAll(ocrText, '\xc2\xa0', ' ');
        ocrText = ocrText.replace(/\xc2\xa0/g, ' ');
        ocrText = ocrText.replace(/[[:^print:]]/g, '');
        ocrText = this.cleanString(ocrText);

        let urlText = ocrText.toLowerCase();

        urlText = this.replaceAll(urlText, ' ', '-');
        urlText = this.replaceAll(urlText, '/', '-');
        urlText = this.replaceAll(urlText, '&', 'and');
        urlText = this.replaceAll(urlText, '.', '');

        urlText = this.hyphenize(urlText);

        urlText = this.replaceAll(urlText, '--', '-');

        urlText = urlText.substring(0, 100);
        console.log('urltext', urlText);
        return urlText;
    }

    static sendWhatsAppMessage(phone_number, text, event, config) {
        // console.log("inside", config.whatsapp.login)
        // const self = this;
        const obj = {};
        obj.type = 'reply';
        obj.data = text;
        return new Promise(((resolve) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                {
                    method: 'SendMessage',
                    send_to: phone_number,
                    msg: text,
                    msg_type: 'DATA_TEXT',
                    userid: config.whatsapp.login,
                    auth_scheme: 'plain',
                    data_encoding: 'Unicode_text',
                    password: config.whatsapp.password,
                    v: '1.1',
                    format: 'text',
                },
            };

            request(options, (error, response) => {
                obj.response = response.body;
                if (response.body.includes('success')) {
                    obj.success = 1;
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'success', { event });
                    // console.log('object with success' , obj)
                    Utility.whatsAppLogs(phone_number, obj);
                } else {
                    obj.success = 0;
                    // console.log('object with no success ', obj)
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'failure', { event: 'message-sending-failure' });
                    Utility.whatsAppLogs(phone_number, obj);
                }
                resolve(response);
            });
        }));
    }

    static sendWhatsAppMessageComputational(phone_number, text, event, config) {
        // console.log("inside", config.whatsapp.login)
        // const self = this;
        const obj = {};
        obj.type = 'reply';
        obj.data = text;
        return new Promise(((resolve) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                {
                    method: 'SendMessage',
                    send_to: phone_number,
                    msg: text,
                    msg_type: 'DATA_TEXT',
                    userid: config.whatsapp.login,
                    auth_scheme: 'plain',
                    data_encoding: 'Unicode_text',
                    password: config.whatsapp.password,
                    v: '1.1',
                    format: 'text',
                },
            };

            request(options, (error, response) => {
                obj.response = response.body;
                if (response.body.includes('success')) {
                    obj.success = 1;
                    obj.isComputational = 1;
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'success', { event });
                    // console.log('object with success' , obj)
                    Utility.whatsAppLogs(phone_number, obj);
                } else {
                    obj.success = 0;
                    obj.isComputational = 1;
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'failure', { event: 'message-sending-failure' });
                    // console.log('object with no success ', obj)
                    Utility.whatsAppLogs(phone_number, obj);
                }
                resolve(response);
            });
        }));
    }

    /**
     * Sends students id to notification engine for cohort distribution. This is fire and forget
     * @param {string} studentId Student ID
     * @returns {string} success message
     */
    static async getNotificationCohort(studentId) {
        try {
            const { data } = await inst.newtonInst({
                method: 'GET',
                url: NotificationConstants.notification.newton_url_notification_cohort.replace('{studentId}', studentId),
                json: true,
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    }

    /**
     * Fetches netcore media using media Id
     * @param {object} config Config
     * @param {string} mediaId Netcore media Id
     * @returns {Promise<ArrayBuffer>} ArrayBuffer of image
     */
    static async getNetcoreMedia(config, mediaId) {
        try {
            const { data } = await axios({
                method: 'GET',
                url: config.whatsapp.netcore.api.getMedia.replace('{mediaId}', mediaId),
                headers: {
                    Authorization: config.whatsapp.netcore.auth,
                },
                responseType: 'arraybuffer',
            });
            return data;
        } catch (e) {
            console.error(e);
        }
    }

    static async createNetcoreMedia(config, buffer) {
        return new Promise((resolve) => {
            const options = {
                method: 'POST',
                url: config.whatsapp.netcore.api.addMedia,
                headers: {
                    Authorization: config.whatsapp.netcore.auth,
                    'Content-Type': 'multipart/form-data',
                },
                formData: {
                    file: {
                        value: buffer,
                        options: {
                            filename: 'fact.jpg',
                        },
                    },
                },
                json: true,
            };
            request(options, (error, _res, body) => {
                if (error) {
                    return resolve();
                }
                resolve(body);
            });
        });
    }

    static sendNetcoreTextMessage(config, phone, text, event, preview = false) {
        if (!text) {
            telemetry.addTelemetry(telemetry.eventNames.whatsappMessageNetcore, 'failure', { event: 'blank-txt-msg' });
        }
        return new Promise((resolve) => {
            const options = {
                method: 'POST',
                url: config.whatsapp.netcore.api.sendMsg,
                headers: {
                    Authorization: config.whatsapp.netcore.auth,
                    'Content-Type': 'application/json',
                },
                body: {
                    message: [{
                        recipient_whatsapp: phone,
                        message_type: 'text',
                        recipient_type: 'individual',
                        source: config.whatsapp.netcore.source,
                        type_text: [{ preview_url: preview.toString() || 'true', content: text }],
                    }],
                },
                json: true,
            };
            request(options, (error, response, body) => {
                if (error) {
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessageNetcore, 'failure', { event: 'message-sending-failure' });
                    throw new Error(error);
                }
                console.log(body);
                console.log('response \n', response.body);
                telemetry.addTelemetry(telemetry.eventNames.whatsappMessageNetcore, 'success', { event });
                resolve(body);
            });
        });
    }

    static async sendNetcoreMediaMessage(config, phone, mediaId, caption, event) {
        if (mediaId.startsWith('http')) {
            const resp = await axios({ method: 'GET', url: mediaId, responseType: 'arraybuffer' });
            const mediaResp = await this.createNetcoreMedia(config, resp.data);
            if (!mediaResp || !mediaResp.data) {
                throw new Error('Unable to create netcore media');
            }
            mediaId = mediaResp.data.mediaId;
        }
        return new Promise((resolve) => {
            const options = {
                method: 'POST',
                url: config.whatsapp.netcore.api.sendMsg,
                headers: {
                    Authorization: config.whatsapp.netcore.auth,
                    'Content-Type': 'application/json',
                },
                body: {
                    message: [{
                        recipient_whatsapp: phone,
                        message_type: 'media',
                        recipient_type: 'individual',
                        source: config.whatsapp.netcore.source,
                        type_media: [{
                            attachments: [{
                                attachment_id: mediaId,
                                caption,
                            }],
                        }],
                    }],
                },
                json: true,
            };
            request(options, (error, response, body) => {
                if (error) {
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessageNetcore, 'failure', { event: 'message-sending-failure' });
                    throw new Error(error);
                }
                console.log(body);
                console.log('response \n', response.body);
                telemetry.addTelemetry(telemetry.eventNames.whatsappMessageNetcore, 'success', { event });
                resolve(body);
            });
        });
    }

    static sendNetcoreTemplateMessage(config, phone, template, event) {
        console.log('---=-=-=-=-=-=-=phone\n');
        return new Promise((resolve) => {
            const options = {
                method: 'POST',
                url: config.whatsapp.netcore.api.sendMsg,
                headers: {
                    Authorization: config.whatsapp.netcore.auth,
                    'Content-Type': 'application/json',
                },
                body: {
                    message:
                        [{
                            recipient_whatsapp: phone,
                            message_type: 'template',
                            recipient_type: 'individual',
                            source: config.whatsapp.netcore.source,
                            type_template: [{
                                name: template,
                                attributes: [],
                                language: {
                                    locale: 'en',
                                    policy: 'deterministic',
                                },
                            }],
                        }],
                },
                json: true,
            };
            request(options, (error, response, body) => {
                if (error) {
                    telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'failure', { event: 'message-sending-failure' });
                    throw new Error(error);
                }
                console.log(body);
                console.log('response \n', response.body);
                telemetry.addTelemetry(telemetry.eventNames.whatsappMessage, 'success', { event });
                resolve(body);
            });
        });
    }

    static async optInNetcore(config, phone, source) {
        const options = {
            method: 'POST',
            url: config.whatsapp.netcore.api.sendTemplate,
            headers: {
                Authorization: config.whatsapp.netcore.auth,
                'Content-Type': 'application/json',
            },
            data: {
                type: 'optin',
                recipients: [{
                    recipient: phone,
                    source,
                }],
            },
        };
        try {
            const { data } = await axios(options);
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static getExpireTime() {
        const dateIST = moment().add(moment.duration('05:30'));
        let today = dateIST;
        today = today.format('MM/DD/YYYY');
        const todayEnd = moment().endOf('d');
        const expire = Math.floor((todayEnd - dateIST) / 1000);
        return {
            expire,
            today,
        };
    }

    static async generateRateUs(
        blob_url,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        try {
            let sample = {};
            sample.type = 'rate_us';
            sample.id = '1';
            sample.text = 'Please rate us on Play Store';
            sample.url = 'https://play.google.com/store/apps/details?id=com.doubtnutapp';
            sample.image_url = `${config.staticCDN}images/23_feb_rating_2.png`;
            sample = await self.generateCommentLikeData(
                sample,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            // sample = await self.getImage(sample,FeedContainer,db)
            sample.student_username = 'doubtnut';
            sample.profile_image = `${config.staticCDN}images/logo.png`;
            return sample;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async generatePinnedPostData(
        value,
        student_id,
        filter,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        const self = this;
        console.log('value');
        console.log(value);
        try {
            let sample = {};
            sample.type = value.type;
            sample.id = `${value.id}_pp`;
            sample.text = value.title;
            // sample.url = 'https://play.google.com/store/apps/details?id=com.doubtnutapp'
            sample.image_url = value.image_url;
            sample.student_id = value.student_id;
            sample.student_username = value.student_username;
            sample.profile_image = value.profile_image;
            sample.created_at = value.created_at;
            sample = await self.generateCommentLikeData(
                sample,
                student_id,
                comment,
                CommentContainer,
                FeedContainer,
                MysqlFeed,
                db,
            );
            return sample;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static generateFilters(req) {
        if (req.headers.host == 'staging.doubtnut.com') {
            return [
                // { key: 'unanswered', description: 'ANSWER IT!' },
                { key: 'ugc', description: 'UGC POSTS' },
                { key: 'answered', description: 'RECENT VIDEOS' },
                { key: 'pdf', description: 'PDF' },
                { key: 'youtube', description: 'YOUTUBE' },
                { key: 'news', description: 'NEWS' },
                { key: 'my', description: 'MY ACTIVITY' },
                { key: 'education', description: 'EDUCATION VIDEOS' },
                { key: 'funny', description: 'FUNNY VIDEOS' },
                { key: 'popular', description: 'POPULAR VIDEOS' },
                { key: 'entertainment', description: 'ENTERTAINMENT VIDEOS' },
            ];
        }
        return [
            // { key: 'unanswered', description: 'ANSWER IT!' },
            // { key: 'pdf', description: 'PDF' },
            { key: 'answered', description: 'RECENT VIDEOS' },
            { key: 'youtube', description: 'YOUTUBE' },
            { key: 'news', description: 'NEWS' },
            { key: 'my', description: 'MY ACTIVITY' },
            { key: 'education', description: 'EDUCATION VIDEOS' },
            { key: 'funny', description: 'FUNNY VIDEOS' },
            { key: 'popular', description: 'POPULAR VIDEOS' },
            { key: 'entertainment', description: 'ENTERTAINMENT VIDEOS' },
        ];
    }

    static generateFiltersUsingLocale(req, locale) {
        if (req.headers.host == 'staging.doubtnut.com') {
            return [
                { key: 'unanswered', description: 'ANSWER IT!' },
                { key: 'ugc', description: 'UGC POSTS' },
                { key: 'answered', description: 'RECENT VIDEOS' },
                { key: 'pdf', description: 'PDF' },
                { key: 'youtube', description: 'YOUTUBE' },
                { key: 'news', description: 'NEWS' },
                { key: 'my', description: 'MY ACTIVITY' },
                { key: 'education', description: 'EDUCATION VIDEOS' },
                { key: 'funny', description: 'FUNNY VIDEOS' },
                { key: 'popular', description: 'POPULAR VIDEOS' },
                { key: 'entertainment', description: 'ENTERTAINMENT VIDEOS' },
            ];
        }
        if (locale === 'hi') {
            return [
                { key: 'unanswered', description: 'इसका उत्तर दीजिये' },
                // { key: 'pdf', description: 'PDF' },
                { key: 'answered', description: 'रीसेंट वीडियो' },
                { key: 'youtube', description: 'यूट्यूब' },
                { key: 'news', description: 'समाचार' },
                { key: 'my', description: 'मेरी गतिविधि' },
                { key: 'education', description: 'एजुकेशन वीडियो' },
                { key: 'funny', description: 'मजेदार वीडियो' },
                { key: 'popular', description: 'लोकप्रिय वीडियो' },
                { key: 'entertainment', description: 'मनोरंजक वीडियो' },
            ];
        }
    }

    static generateFilters2(req) {
        if (req.headers.host == 'staging.doubtnut.com') {
            return [
                { key: 'unanswered', description: 'ANSWER IT!' },
                { key: 'ugc', description: 'UGC POSTS' },
                { key: 'answered', description: 'RECENT VIDEOS' },
                // { key: 'pdf', description: 'PDF' },
                { key: 'youtube', description: 'YOUTUBE' },
                { key: 'news', description: 'NEWS' },
                { key: 'my', description: 'MY ACTIVITY' },
                { key: 'education', description: 'EDUCATION VIDEOS' },
                { key: 'funny', description: 'FUNNY VIDEOS' },
                { key: 'popular', description: 'POPULAR VIDEOS' },
                { key: 'entertainment', description: 'ENTERTAINMENT VIDEOS' },
            ];
        }
        return [
            { key: 'unanswered', description: 'ANSWER IT!' },
            { key: 'pdf', description: 'PDF' },
            // {key: "answered", description: "RECENT VIDEOS"},
            // {key: "youtube", description: "YOUTUBE"},
            { key: 'news', description: 'NEWS' },
            { key: 'my', description: 'MY ACTIVITY' },
            { key: 'education', description: 'EDUCATION VIDEOS' },
            { key: 'funny', description: 'FUNNY VIDEOS' },
            { key: 'popular', description: 'POPULAR VIDEOS' },
            { key: 'entertainment', description: 'ENTERTAINMENT VIDEOS' },
        ];
    }

    static async generateCommentLikeData(
        value,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        db,
    ) {
        try {
            const promises = [];
            let { id } = value;
            if (
                value.type == 'contest_winners'
                || value.type == 'quiz_winners'
            ) {
                id = value.id2;
            }
            if (value.type == 'quiz') {
                id = '1';
            }
            promises.push(
                CommentContainer.getCommentCount(value.type, id, comment, db),
            );
            promises.push(FeedContainer.getLikeCount(value.type, id, db));
            promises.push(
                MysqlFeed.isUserLikeEntity(
                    value.type,
                    id,
                    student_id,
                    db.mysql.read,
                ),
            );
            promises.push(
                CommentContainer.getTopComment(value.type, id, comment, db),
            );
            promises.push(FeedContainer.getImageData(value.image_url, db));
            const resolvedPromises = await Promise.all(promises);
            value.comments_count = resolvedPromises[0];
            value.like_count = resolvedPromises[1];
            value.like_count = value.like_count[0].like_count;
            value.is_like = resolvedPromises[2].length > 0 ? 1 : 0;
            // let resolvePromises = await CommentContainer.getTopComment(value['type'], value['id'], comment, db)
            if (resolvedPromises[3].length != 0) {
                value.top_comment = resolvedPromises[3][0];
            } else {
                value.top_comment = {};
            }
            if (resolvedPromises[4].length > 0) {
                value.image_meta = resolvedPromises[4][0];
            } else {
                value.image_meta = null;
            }
            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static async getImage(value, FeedContainer, db) {
        try {
            if (!_.isNull(value.image_url) && !_.isEmpty(value.image_url)) {
                const image_data = await FeedContainer.getImageData(
                    value.image_url,
                    db,
                );
                console.log('image_data');
                console.log(image_data);
                if (image_data.length > 0) {
                    value.image_meta = image_data[0];
                } else {
                    value.image_meta = null;
                }
                return value;
            }
            return value;
        } catch (e) {
            console.log(e);
            throw e;
        }
    }

    static changeUsernameNAvatar(class1, value) {
        if (value.type == 'polling') {
            value.student_username = 'बताओ यारो';
            value.profile_image = `${config.staticCDN}engagement_framework/batao_yaaro.jpeg`;
        } else if (value.type == 'youtube' || value.type == 'url') {
            value.student_username = 'रोमांचक';
            value.profile_image = `${config.staticCDN}engagement_framework/romanchak.jpeg`;
        } else if (value.type == 'pdf') {
            value.student_username = 'PDF';
            value.profile_image = `${config.staticCDN}engagement_framework/pdf.jpeg`;
        } else if (
            value.type == 'viral_videos'
            && (class1 == 11 || class1 == 12)
        ) {
            value.student_username = 'पढाई';
            value.profile_image = `${config.staticCDN}engagement_framework/padhai.jpeg`;
        } else if (
            value.type == 'viral_videos'
            && (class1 == 6 || class1 == 7 || class1 == 8 || class1 == 9 || class1 == 10)
        ) {
            value.student_username = 'मेरी कक्षा';
            value.profile_image = `${config.staticCDN}engagement_framework/meri_kaksha.jpeg`;
        } else if (
            value.type == 'rate_us'
            || value.type == 'invite'
            || value.type == 'news'
            || value.type == 'milestone'
            || value.type == 'product_features'
            || value.type == 'quiz'
        ) {
            value.student_username = 'Doubtnut';
        } else if (
            value.type == 'contest_winners'
            || value.type == 'quiz_winners'
        ) {
            value.student_username = 'contest';
            value.profile_image = `${config.staticCDN}engagement_framework/contest.jpeg`;
        } else if (!value.student_username) {
            value.student_username = 'Doubtnut';
        }
        return value;
        // return new Promise(async function (resolve, reject) {
        // Do async job
        //   try {
        //     // if (!_.isNull(value['image_url']) && !_.isEmpty(value['image_url'])) {
        //       let image_data = await FeedContainer.getImageData(value['image_url'], db)
        //         console.log("image_data")
        //         console.log(image_data)
        //       if(image_data.length > 0){
        //         value['image_meta'] = image_data[0]
        //       }else{
        //         value['image_meta'] = null
        //       }
        //       return resolve(value)
        //     } else {
        //       return resolve(value)
        //     }
        //   } catch (e) {
        //     console.log(e)
        //     reject(e)
        //   }
        // })
    }

    // meta builder

    static metaDescBuilder(chapter, class_id, ocr) {
        ocr = ocr.replace(new RegExp('\n', 'g'), '');
        ocr = ocr.replace(new RegExp('\r', 'g'), '');
        const ocr_array = ocr.split('`');
        let desc = `${chapter} / ${class_id} / `;
        for (let i = 0; i < ocr_array.length; i++) {
            if (i % 2 != 0) {
                ocr_array[i] = ocr_array[i].replace(new RegExp('sqrt', 'g'), '√');
                ocr_array[i] = ocr_array[i].replace(new RegExp('pi', 'g'), 'π');
                ocr_array[i] = ocr_array[i].replace(new RegExp(':-', 'g'), '÷');
                ocr_array[i] = ocr_array[i].replace(new RegExp('×', 'g'), 'xx');
                ocr_array[i] = ocr_array[i].replace(new RegExp('Delta', 'g'), '∆');
                ocr_array[i] = ocr_array[i].replace(new RegExp('^@', 'g'), '°');
                ocr_array[i] = ocr_array[i].replace(new RegExp('lt', 'g'), '<');
                ocr_array[i] = ocr_array[i].replace(new RegExp('gt', 'g'), '>');
                ocr_array[i] = ocr_array[i].replace(new RegExp('le', 'g'), '<=');
                ocr_array[i] = ocr_array[i].replace(new RegExp('ge', 'g'), '>=');
                ocr_array[i] = ocr_array[i].replace(new RegExp('&compfn;', 'g'), '@');
                ocr_array[i] = ocr_array[i].replace(new RegExp('/\n', 'g'), '');
                ocr_array[i] = ocr_array[i].replace(new RegExp('/\r', 'g'), '');
                ocr_array[i] = ocr_array[i].replace(new RegExp('"', 'g'), '');
            }
            desc += ocr_array[i];
        }
        return desc;
    }

    static metaDataFunction(data) {
        let title = '';
        let description = '';
        let m_class; let m_chapter; let
            url_temp = '';
        if (data != undefined && typeof data !== 'undefined') {
            const { student_id } = data;
            let class_id = '';
            let chapter = '';
            let course = '';
            if (
                student_id == 1
                || student_id == 4
                || student_id == 5
                || student_id == 6
                || student_id == 10
                || student_id == 11
                || student_id == 13
                || student_id == 14
                || student_id == 15
                || student_id == 99
            ) {
                class_id = data.class;
                chapter = data.chapter;
            } else if (data.question_meta != undefined && data.question_meta.class != null && data.question_meta.chapter != null) {
                class_id = data.question_meta.class;
                chapter = data.question_meta.chapter;
            } else {
                class_id = data.class;
                chapter = data.chapter;
            }
            // } else if (
            //   student_id == 2 ||
            //   student_id == 3 ||
            //   student_id == 7 ||
            //   student_id == 8 ||
            //   student_id == 9 ||
            //   student_id == 12 ||
            //   student_id == 98
            // ) {
            //   if (data["question_meta"] != undefined) {
            //     class_id = data["question_meta"]["class"];
            //     chapter = data["question_meta"]["chapter"];
            //   } else {
            //     class_id = data["class"];
            //     chapter = data["chapter"];
            //   }
            // } else {
            //   class_id = data["class"];
            //   chapter = data["chapter"];
            // }
            if (data.question_meta != undefined) {
                if (data.question_meta.packages == null) {
                    if (data.question_meta.target_course == null) {
                        course = '';
                    } else {
                        course = data.question_meta.target_course;
                    }
                } else if (data.question_meta.packages.includes(',')) {
                    const packages = data.question_meta.packages.split(',');
                    for (let i = 0; i < packages.size; i++) {
                        course = `${packages[i]},`;
                    }
                    course = course.slice(0, -1);
                } else {
                    course = data.question_meta.packages;
                }
            }
            if (course == '') {
                title = `${chapter} || class ${class_id} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else if (course == 'RD SHARMA') {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else if (course.includes('JEE MAINS')) {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else if (course.includes('JEE ADVANCED')) {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else if (course.includes('IIT')) {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else if (course.includes('X BOARDS')) {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else if (course.includes('XII BOARDS')) {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            } else {
                title = `${chapter} || class ${class_id} || ${course} || doubtnut`;
                if (data.ocr_text.includes('<math')) {
                    description = `${chapter} / ${class_id} / ${data.question}`;
                } else {
                    description = this.metaDescBuilder(
                        chapter,
                        class_id,
                        data.ocr_text,
                    );
                }
            }

            let { question_id } = data;
            if (
                student_id == 1
                || student_id == 4
                || student_id == 5
                || student_id == 6
                || student_id == 10
                || student_id == 11
                || student_id == 13
                || student_id == 14
                || student_id == 15
            ) {
                m_class = data.class;
                m_chapter = data.chapter;
            } else if (data.question_meta != undefined) {
                m_class = data.question_meta.class;
                m_chapter = data.question_meta.class;
            }
            if (
                _.isNull(m_class)
                || m_class == ''
                || typeof m_class === 'undefined'
            ) {
                m_class = 'default';
            } else {
                m_class = `class-${m_class}`;
            }

            if (
                _.isNull(m_chapter)
                || m_chapter == ''
                || typeof m_chapter === 'undefined'
            ) {
                m_chapter = 'default';
            }
            m_chapter = m_chapter.toLowerCase();
            m_chapter = m_chapter.replace(new RegExp(' ', 'g'), '-');
            m_chapter = m_chapter.replace(new RegExp('/', 'g'), '-');
            m_chapter = m_chapter.replace(new RegExp('&', 'g'), 'and');
            question_id = base64.encode(question_id);
            m_chapter = hyphenize(m_chapter);
            url_temp = `https://doubtnut.com/video/${m_class}/${m_chapter}/${question_id}`;
            return [title, description, url_temp];
        } return [];
    }

    static webUrlFunction(data) {
        let m_class; let m_chapter; let
            url_temp = '';
        if (data != undefined && typeof data !== 'undefined') {
            const { student_id } = data;
            let { question_id } = data;
            if (
                student_id == 1
                || student_id == 4
                || student_id == 5
                || student_id == 6
                || student_id == 10
                || student_id == 11
                || student_id == 13
                || student_id == 14
                || student_id == 15
            ) {
                m_class = data.class;
                m_chapter = data.chapter;
            } else if (data.question_meta != undefined) {
                m_class = data.question_meta.class;
                m_chapter = data.question_meta.class;
            }
            if (
                _.isNull(m_class)
                || m_class == ''
                || typeof m_class === 'undefined'
            ) {
                m_class = 'default';
            } else {
                m_class = `class-${m_class}`;
            }

            if (
                _.isNull(m_chapter)
                || m_chapter == ''
                || typeof m_chapter === 'undefined'
            ) {
                m_chapter = 'default';
            }
            m_chapter = m_chapter.toLowerCase();
            m_chapter = m_chapter.replace(new RegExp(' ', 'g'), '-');
            m_chapter = m_chapter.replace(new RegExp('/', 'g'), '-');
            m_chapter = m_chapter.replace(new RegExp('&', 'g'), 'and');
            question_id = base64.encode(question_id);
            m_chapter = hyphenize(m_chapter);
            url_temp = `https://doubtnut.com/video/${m_class}/${m_chapter}/${question_id}`;
        }
        return url_temp;
    }

    static checkValidUsername(str) {
        const patt = /d[^a-zA-Z\d]*?o*?o[^a-zA-Z\d]*?u*?u[^a-zA-Z\d]*?b*?b[^a-zA-Z\d]*?t*?t[^a-zA-Z\d]*?n*?n[^a-zA-Z\d]*?u*?u[^a-zA-Z\d]*?t*?t/i;
        const result = str.match(patt);
        if (result) {
            return true;
        }
        return false;
    }

    static checkUniqueClassNChapter(arr, json) {
        for (let i = 0; i < arr.length; i++) {
            if (
                arr[i].class == json.class
                && arr[i].chapter == json.chapter
            ) {
                return false;
            }
        }
        return true;
    }

    static checkUniqueClassNChapterNSubtopic(arr, json) {
        for (let i = 0; i < arr.length; i++) {
            if (
                arr[i].class == json.class
                && arr[i].chapter == json.chapter
                && arr[i].subtopic == json.subtopic
            ) {
                return false;
            }
        }
        return true;
    }

    // static test() {
    //     return new Promise(((resolve, reject) => resolve(true)));
    // }

    static async nfeedData(
        response,
        cdn_url,
        student_id,
        comment,
        CommentContainer,
        FeedContainer,
        MysqlFeed,
        Feed,
        db,
    ) {
        const self = this;
        let data = {};
        const promises = [];

        if (
            response.entity_type == 'matched'
            || response.entity_type == 'unanswered'
            || response.entity_type == 'answered'
        ) {
            data.type = response.entity_type;
            data.id = response.entity_id;
            data.student_id = response.entity_data.student_id;
            data.student_username = response.entity_data.student.student_username;
            data.ocr_text = response.entity_data.ocr_text;
            data.question = response.entity_data.question;
            if (response.entity_type == 'answered') {
                data.question_id = response.entity_data.question_id;
            }
            data.created_at = response.entity_data.timestamp;
            data.profile_image = response.entity_data.student.img_url;
            data.image_url = `${cdn_url}images/${response.entity_data.question_image}`;
            data.comments_count = response.commentcount;
            data.like_count = response.likecount;
            data.top_comment = response.topcomment;
            promises.push(
                MysqlFeed.isUserLikeEntity(
                    response.entity_type,
                    response.entity_id,
                    student_id,
                    db.mysql.read,
                ),
            );
            // promises.push(self.test())
            promises.push(FeedContainer.getImageData(data.image_url, db));
            promises.push(
                CommentContainer.getCommentCount(response.entity_type, response.entity_id, comment, db),
            );
            // let isLike = await MysqlFeed.isUserLikeEntity(value['type'], id, student_id, db.mysql.read)
            const resolvedPromises = await Promise.all(promises);
            data.comments_count = resolvedPromises[2];
            data.is_like = resolvedPromises[0].length > 0 ? 1 : 0;
            if (resolvedPromises[1].length > 0) {
                data.image_meta = resolvedPromises[1][0];
            } else {
                data.image_meta = null;
            }

            return data;
        } if (EngagementType.isDefined(response.entity_type)) {
            response.entity_data.correct_option = response.entity_data.en_correct_option;
            response.entity_data.title = response.entity_data.en_title;
            response.entity_data.text = response.entity_data.en_text;
            if (response.entity_data.en_image == '') {
                response.entity_data.image_url = null;
            } else {
                response.entity_data.image_url = response.entity_data.en_image;
            }
            response.entity_data.options = response.entity_data.en_options;
            response.entity_data.action_data = response.entity_data.data;
            response.entity_data.created_at = response.entity_data.start_date;
            data = await self.generateEngagementDataWithoutComment(
                cdn_url,
                response.entity_data,
                student_id,
                FeedContainer,
                MysqlFeed,
                Feed,
                db,
            );
            // data = self.changeUsernameNAvatar(11,data)
            data.student_username = 'doubtnut';
            data.profile_image = `${config.staticCDN}images/logo.png`;
            //         data.student_id = response.entity_data.student_id
            // console.log(response)
            // data.student_username = response.entity_data.student.student_username

            // data.profile_image = response.entity_data.student.img_url

            data.comments_count = response.commentcount;
            data.like_count = response.likecount;
            data.top_comment = response.topcomment;
            promises.push(
                MysqlFeed.isUserLikeEntity(
                    response.entity_type,
                    response.entity_id,
                    student_id,
                    db.mysql.read,
                ),
            );
            promises.push(FeedContainer.getImageData(data.image_url, db));
            promises.push(
                CommentContainer.getCommentCount(response.entity_type, response.entity_id, comment, db),
            );

            // data.image_meta = await FeedContainer.getImageData(data['image_url'], db)
            const resolvedPromises = await Promise.all(promises);
            data.comments_count = resolvedPromises[2];
            data.is_like = resolvedPromises[0].length > 0 ? 1 : 0;
            if (resolvedPromises[1].length > 0) {
                data.image_meta = resolvedPromises[1][0];
            } else {
                data.image_meta = null;
            }
            return data;
        } if (response.entity_type == 'ugc') {
            data = self.generateUgcDataWithoutLikeComment(response.entity_data);
            delete data.student;
            data.student_id = response.entity_data.student_id;
            data.id = response.entity_id;
            data.image_url = response.entity_data.image_url;
            data.student_username = response.entity_data.student.student_username;
            data.created_at = response.entity_data.created_at;
            data.profile_image = response.entity_data.student.img_url;

            data.like_count = response.likecount;
            data.top_comment = response.topcomment;
            promises.push(
                MysqlFeed.isUserLikeEntity(
                    response.entity_type,
                    response.entity_id,
                    student_id,
                    db.mysql.read,
                ),
            );
            promises.push(FeedContainer.getImageData(data.image_url, db));
            promises.push(
                CommentContainer.getCommentCount(response.entity_type, response.entity_id, comment, db),
            );

            const resolvedPromises = await Promise.all(promises);

            data.is_like = resolvedPromises[0].length > 0 ? 1 : 0;
            if (resolvedPromises[1].length > 0) {
                data.image_meta = resolvedPromises[1][0];
            } else {
                data.image_meta = null;
            }
            data.comments_count = resolvedPromises[2];
            return data;
        }
    }

    static exchangeArrayIndices(arrayOfArrays, pos1, pos2) {
        arrayOfArrays.forEach((array) => {
            const temp = array[pos1];
            array[pos1] = array[pos2];
            array[pos2] = temp;
        });
        return arrayOfArrays;
    }

    static compareBystringDiff(fuzz, ocrText, newText) {
        const partialRatio = fuzz.partial_ratio(ocrText, newText);
        return partialRatio;
    }

    static stringDiffImplement(elasticSearchData, ocr_text, fuzz) {
        // console.log("elasticSearchData")
        // console.log(elasticSearchData.length)
        if (elasticSearchData.length > 0) {
            for (let j = 0; j < elasticSearchData.length; j++) {
                elasticSearchData[j].partial_score = fuzz.partial_ratio(ocr_text, elasticSearchData[j]._source.elastic_ocr);
            }
            elasticSearchData = _.orderBy(elasticSearchData, ['partial_score'], ['desc']);
        }
        // console.log("elasticSearchData")
        // console.log(elasticSearchData)
        return elasticSearchData;
    }

    static stringDiffImplementWithKeyAndScores(elasticSearchData, ocr, fuzz, field_key, language, checkOrder) {
        for (let i = 0; i < elasticSearchData.length; i++) {
            elasticSearchData[i].partial_score = fuzz.partial_ratio(ocr, elasticSearchData[i]._source[field_key]);
        }
        return elasticSearchData;
    }

    static inappSearchStringDiffImplement(elasticSearchData, ocr_text) {
        if (elasticSearchData.length > 0) {
            for (let j = 0; j < elasticSearchData.length; j++) {
                elasticSearchData[j].partial_score = fuzz.partial_ratio(ocr_text, elasticSearchData[j]._source.search_key);
            }
            elasticSearchData.sort((x, y) => y.partial_score - x.partial_score);
        }
    }

    static generateDeepLink(config, channel, feature, campaign, question_id, type, page, student_id) {
        // console.log(post_id)
        return new Promise(((resolve, reject) => {
            try {
                const myJSONObject = {
                    branch_key: config.branch_key,
                    channel,
                    feature,
                    campaign,
                };
                const data = {};
                if (!_.isNull(page)) {
                    data.page = page;
                }
                if (!_.isNull(question_id)) {
                    data.qid = question_id;
                    data.resource_type = 'video';
                }
                if (!_.isNull(type)) {
                    data.type = type;
                }
                if (!_.isNull(student_id)) {
                    data.sid = student_id;
                }
                myJSONObject.data = data;
                console.log(myJSONObject);
                request(
                    {
                        url: 'https://api.branch.io/v1/url',
                        method: 'POST',
                        json: true, // <--Very important!!!
                        body: myJSONObject,
                    },
                    (error, response, body) => {
                        if (error) {
                            console.log(error);
                        } else {
                            // console.log(body);
                            return resolve(body);
                        }
                    },
                );
            } catch (e) {
                console.log(e);
                return reject(e);
            }
        }));
    }

    static stringDiffImplementForNoFilterMatches(noFilterMatchesArray, ocr_text, field_key, studentId, fuzz) {
        try {
            const pretty_text_index_name = typeof studentId !== 'undefined' && studentId % 2 !== 0 ? 'question_bank_pretty_text' : 'question_bank_meta';
            const noFilterMatchQid = [];
            const noFilterGroupQid = [];
            noFilterMatchesArray = _(noFilterMatchesArray)
                .map((n, index) => {
                    noFilterMatchQid.push(n._id);
                    noFilterGroupQid.push({
                        _index: pretty_text_index_name,
                        _type: 'repository',
                        _id: n._id,
                    });
                    if (typeof n.partial_score === 'undefined') {
                        n.partial_score = fuzz.partial_ratio(ocr_text, n._source[field_key]);
                    }
                    return n;
                })
                .value();
            return [noFilterMatchesArray, noFilterMatchQid, noFilterGroupQid];
        }
        catch(error) {
            console.log(error);
            return [];
        }
    }

    static stringDiffImplementWithKey(elasticSearchData, ocr_text, fuzz, field_key, language, checkOrder, studentId) {
        const groupedIdArray = [];
        const groupedIdArray2 = [];
        let compare = 0;
        const compareChapterCount = 0;
        const counts = {};
        const subjectWiseChapterCounterMap = {};
        let mostFrequentSubject;
        let mostFrequentChapterAlias;
        const KNN_COUNT = elasticSearchData.length >= 20 ? 20 : elasticSearchData.length;

        const pretty_text_index_name = typeof studentId !== 'undefined' && studentId % 2 !== 0 ? 'question_bank_pretty_text' : 'question_bank_meta';
        // let maths = {value: 0, key: "MATHS"}, chem = {value: 0, key: "CHEMISTRY"}, phy = {value: 0, key: "PHYSICS"}
        if (language != 'english') {
            // console.log('non english')
            elasticSearchData = _(elasticSearchData)
                .map((n, index) => {
                    groupedIdArray.push(n._id);
                    groupedIdArray2.push({
                        _index: pretty_text_index_name,
                        _type: 'repository',
                        _id: n._id,
                    });
                    if (typeof n.partial_score === 'undefined') {
                        n.partial_score = fuzz.partial_ratio(ocr_text, n._source[field_key]);
                    }
                    const { subject, chapter_alias } = n._source;
                    if (index < KNN_COUNT) {
                        if (counts[subject] == undefined) {
                            counts[subject] = 1;
                        } else {
                            counts[subject] += 1;
                        }
                        if (counts[subject] > compare) {
                            compare = counts[subject];
                            mostFrequentSubject = subject;
                        }

                        if (typeof subjectWiseChapterCounterMap[subject] !== 'undefined') {
                            if (typeof subjectWiseChapterCounterMap[subject][chapter_alias] !== 'undefined') {
                                subjectWiseChapterCounterMap[subject][chapter_alias] += 1;
                            } else {
                                subjectWiseChapterCounterMap[subject][chapter_alias] = 1;
                            }
                        } else {
                            subjectWiseChapterCounterMap[subject] = {};
                            subjectWiseChapterCounterMap[subject][chapter_alias] = 1;
                        }
                    }

                    if (index == KNN_COUNT - 1) {
                        const mostOccuredSubjectChapters = subjectWiseChapterCounterMap[mostFrequentSubject];
                        mostFrequentChapterAlias = _.max(Object.keys(mostOccuredSubjectChapters), (o) => mostOccuredSubjectChapters[o]);
                    }
                    return n;
                })
                .value();
        } else if (checkOrder) {
            elasticSearchData = _(elasticSearchData)
                .map((n, index) => {
                    groupedIdArray.push(n._id);
                    groupedIdArray2.push({
                        _index: pretty_text_index_name,
                        _type: 'repository',
                        _id: n._id,
                    });
                    if (typeof n.partial_score === 'undefined') {
                        n.partial_score = fuzz.partial_ratio(ocr_text, n._source[field_key]);
                    }

                    const { subject, chapter_alias } = n._source;
                    if (index < KNN_COUNT) {
                        if (counts[subject] == undefined) {
                            counts[subject] = 1;
                        } else {
                            counts[subject] += 1;
                        }
                        if (counts[subject] > compare) {
                            compare = counts[subject];
                            mostFrequentSubject = subject;
                        }

                        if (typeof subjectWiseChapterCounterMap[subject] !== 'undefined') {
                            if (typeof subjectWiseChapterCounterMap[subject][chapter_alias] !== 'undefined') {
                                subjectWiseChapterCounterMap[subject][chapter_alias] += 1;
                            } else {
                                subjectWiseChapterCounterMap[subject][chapter_alias] = 1;
                            }
                        } else {
                            subjectWiseChapterCounterMap[subject] = {};
                            subjectWiseChapterCounterMap[subject][chapter_alias] = 1;
                        }
                    }

                    if (index == KNN_COUNT - 1) {
                        const mostOccuredSubjectChapters = subjectWiseChapterCounterMap[mostFrequentSubject];
                        mostFrequentChapterAlias = _.max(Object.keys(mostOccuredSubjectChapters), (o) => mostOccuredSubjectChapters[o]);
                    }
                    return n;
                })
                .value();
        } else {
            elasticSearchData = _(elasticSearchData)
                .map((n, index) => {
                    groupedIdArray.push(n._id);
                    groupedIdArray2.push({
                        _index: pretty_text_index_name,
                        _type: 'repository',
                        _id: n._id,
                    });
                    n.partial_score = fuzz.partial_ratio(ocr_text, n._source[field_key]);

                    const { subject, chapter_alias } = n._source;
                    if (index < KNN_COUNT) {
                        if (counts[subject] == undefined) {
                            counts[subject] = 1;
                        } else {
                            counts[subject] += 1;
                        }
                        if (counts[subject] > compare) {
                            compare = counts[subject];
                            mostFrequentSubject = subject;
                        }

                        if (typeof subjectWiseChapterCounterMap[subject] !== 'undefined') {
                            if (typeof subjectWiseChapterCounterMap[subject][chapter_alias] !== 'undefined') {
                                subjectWiseChapterCounterMap[subject][chapter_alias] += 1;
                            } else {
                                subjectWiseChapterCounterMap[subject][chapter_alias] = 1;
                            }
                        } else {
                            subjectWiseChapterCounterMap[subject] = {};
                            subjectWiseChapterCounterMap[subject][chapter_alias] = 1;
                        }
                    }

                    if (index == KNN_COUNT - 1) {
                        const mostOccuredSubjectChapters = subjectWiseChapterCounterMap[mostFrequentSubject];
                        mostFrequentChapterAlias = _.max(Object.keys(mostOccuredSubjectChapters), (o) => mostOccuredSubjectChapters[o]);
                    }
                    return n;
                })
                .orderBy(['partial_score'], ['desc'])
                .value();
        }

        // let max = Math.max(maths.value, chem.value, num3);
        // if(maths)
        // console.log("[elasticSearchData,groupedIdArray,groupedIdArray2]")
        // console.log([elasticSearchData,groupedIdArray,groupedIdArray2]
        return [elasticSearchData, groupedIdArray, groupedIdArray2, mostFrequentSubject, mostFrequentChapterAlias];
    }

    static stringDiffImplementWithKeyForBookFuzzy(elasticSearchData, ocr_text, fuzz, field_key, index) {
        const groupedIdArray = [];
        const groupedIdArray2 = [];
        elasticSearchData = _(elasticSearchData)
            .map((n) => {
                groupedIdArray.push(n._id);
                groupedIdArray2.push({
                    _index: index,
                    _type: 'repository',
                    _id: n._id,
                });
                n.partial_score = fuzz.partial_ratio(ocr_text, n._source[field_key]);
                n._source.author = '';
                return n;
            })
            .orderBy(['partial_score'], ['desc'])
            .value();

        return elasticSearchData;
    }

    static getIndexOfRegex(str, match_results) {
        return str.indexOf(match_results[0]);
    }

    static isUsRegion(region) {
        if (region && region.toLowerCase() == 'us') {
            return true;
        }
        return false;
    }

    static isInputEmailId(identifier) {
        const isEmailRegex = new RegExp('[^\\.\\s@:](?:[^\\s@:]*[^\\s@:\\.])?@[^\\.\\s@]+(?:\\.[^\\.\\s@]+)*');
        return isEmailRegex.test(identifier);
    }

    static getIndexOfRegex1(str, match_str) {
        return str.indexOf(match_str);
    }

    static getExtraThingsRemoved(str) {
        const str1 = str.trim().replace(/\[\["$/, '');
        const str2 = str1.trim();
        const str3 = str2.replace(/,$/, '');
        return str3;
    }

    static getExtraThingsRemoved1(str) {
        const str1 = str.trim();
        return str1;
    }

    static optionRemovalFromMathPixOcr(ocr_text) {
        const { ocr_text_min_length } = Data;
        const ocr_text_lower_case = ocr_text.toLowerCase();

        const regex_match_option_type1 = ocr_text_lower_case.match(/\(?[1234]\.\)\s".*/g);
        const regex_match_option_type2 = ocr_text_lower_case.match(/\(?[1234]\)\s".*/g);
        const regex_match_option_type3 = ocr_text_lower_case.match(/\(?[abcd]\.\)\s".*/g);
        const regex_match_option_type4 = ocr_text_lower_case.match(/\(?[abcd]\)\s".*/g);

        if (regex_match_option_type1 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type1) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type1));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type2 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type2) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type2));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type3 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type3) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type3));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type4 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type4) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type4));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        // return this.getExtraThingsRemoved1(ocr_text_lower_case);
        return ocr_text;
    }

    static optionRemovalFromGoogleOcr(ocr_text) {
        const { ocr_text_min_length } = Data;
        const ocr_text_lower_case = ocr_text.toLowerCase();
        // return ocr_text_lower_case;

        const regex_match_option_type1 = ocr_text_lower_case.match(/\(?[1234]\.\).*/g);
        const regex_match_option_type2 = ocr_text_lower_case.match(/\(?[1234]\).*/g);
        const regex_match_option_type3 = ocr_text_lower_case.match(/[1234]\..*/g);
        const regex_match_option_type4 = ocr_text_lower_case.match(/\?[abcd]\.\.*/g);
        const regex_match_option_type5 = ocr_text_lower_case.match(/\(?[abcd]\).*/g);

        const regex_match_option_type6 = ocr_text_lower_case.match(/[abcd]\..*/g);

        const regex_matches = [];

        if (regex_match_option_type1 != null) {
            console.log('i am in regex1');
            const regex_object = {};
            regex_object.matched_regex_array = regex_match_option_type1;
            regex_object.starting_point = this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type1);
            regex_matches.push(regex_object);
        }

        if (regex_match_option_type2 != null) {
            console.log('i am in regex2');

            const regex_object = {};
            regex_object.matched_regex_array = regex_match_option_type2;
            regex_object.starting_point = this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type2);
            regex_matches.push(regex_object);
        }

        if (regex_match_option_type3 != null) {
            console.log('i am in regex3');

            const regex_object = {};
            regex_object.matched_regex_array = regex_match_option_type3;
            regex_object.starting_point = this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type3);
            regex_matches.push(regex_object);
        }

        if (regex_match_option_type4 != null) {
            console.log('i am in regex4');

            const regex_object = {};
            regex_object.matched_regex_array = regex_match_option_type4;
            regex_object.starting_point = this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type4);
            regex_matches.push(regex_object);
        }

        if (regex_match_option_type5 != null) {
            console.log('i am in regex5');

            const regex_object = {};
            regex_object.matched_regex_array = regex_match_option_type5;
            regex_object.starting_point = this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type5);
            regex_matches.push(regex_object);
        }

        if (regex_match_option_type6 != null) {
            console.log('i am in regex6');
            const regex_object = {};
            regex_object.matched_regex_array = regex_match_option_type6;
            regex_object.starting_point = this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type6);
            regex_matches.push(regex_object);
        }

        // ------- Now Main Logic  -------

        let trimming_start_point = 0;
        let regex_to_be_used = 0;
        if (regex_matches.length == 0) {
            // return ocr_text_lower_case;
            return ocr_text;
        }

        for (let i = 0; i < regex_matches.length; i++) {
            if (regex_matches[i].starting_point > trimming_start_point) {
                trimming_start_point = regex_matches[i].starting_point;
                regex_to_be_used = i;
            }
        }

        if (regex_matches[regex_to_be_used].matched_regex_array.length > 1) {
            console.log('length is only one');
            const ocr_text = '';
            // let ending_length;
            let matched_index;
            const split_length_array = [];
            for (let j = 0; j < regex_matches[regex_to_be_used].matched_regex_array.length; j++) {
                const split_obj = {};
                matched_index = this.getIndexOfRegex1(ocr_text_lower_case, regex_matches[regex_to_be_used].matched_regex_array[j]);
                split_obj.start_index = matched_index;
                split_obj.end_index = matched_index + regex_matches[regex_to_be_used].matched_regex_array[j].length;
                split_length_array.push(split_obj);
            }
            let start_index = 0;
            // let end_index;
            let new_ocr_text = '';
            for (let m = 0; m < split_length_array.length; m++) {
                // end_index = split_length_array[m].start_index;
                new_ocr_text += ocr_text_lower_case.substring(start_index, split_length_array[m].start_index);
                start_index = split_length_array[m].end_index;
            }
            if (new_ocr_text.length > ocr_text_min_length) {
                return this.getExtraThingsRemoved1(new_ocr_text);
            }
            // return ocr_text_lower_case;
            return ocr_text;
        }

        const spliced_string = ocr_text_lower_case.slice(0, trimming_start_point);

        if (spliced_string.length > ocr_text_min_length) {
            return this.getExtraThingsRemoved1(spliced_string);
        }
        // return ocr_text_lower_case;
        return ocr_text;
    }

    static optionRemovalFromGoogleOcr2(ocr_text) {
        const { ocr_text_min_length } = Data;
        console.log(ocr_text_min_length);
        const ocr_text_lower_case = ocr_text.toLowerCase();
        console.log(ocr_text_lower_case);

        const regex_match_option_type1 = ocr_text_lower_case.match(/\(?[1234]\.\).*/g);
        const regex_match_option_type2 = ocr_text_lower_case.match(/(\(?[1234]\).*){3,5}/g);
        const regex_match_option_type3 = ocr_text_lower_case.match(/([1234]\..*){3,5}/g);
        const regex_match_option_type4 = ocr_text_lower_case.match(/\(?[abcd]\.\).*/g);
        const regex_match_option_type5 = ocr_text_lower_case.match(/\(?[abcd]\).*/g);
        const regex_match_option_type6 = ocr_text_lower_case.match(/([abcd]\..*){3,5}/g);

        if (regex_match_option_type1 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type1) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type1));
            this.getExtraThingsRemoved(spliced_string);
            return;
        }
        if (regex_match_option_type2 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type2) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type2));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type3 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type3) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type3));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type4 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type4) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type4));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type5 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type5) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type5));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        if (regex_match_option_type6 && this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type6) > ocr_text_min_length) {
            const spliced_string = ocr_text_lower_case.slice(0, this.getIndexOfRegex(ocr_text_lower_case, regex_match_option_type6));
            const trimmed_string = this.getExtraThingsRemoved(spliced_string);
            return trimmed_string;
        }
        return ocr_text_lower_case;
    }

    static idetifierGenerator(splittedDoubt, splitter) {
        let identifier = '';
        for (let i = 0; i < splittedDoubt.length; i++) {
            if (i < (splittedDoubt.length - splitter)) {
                identifier = `${identifier + splittedDoubt[i]}_`;
            }
        }
        if (identifier == '') {
            return false;
        }
        return identifier;
    }

    static isImageUploadedForQuestionAsk(uploadedQuestionImageName, uploadedImageQuestionId) {
        if (typeof uploadedQuestionImageName !== 'undefined' && typeof uploadedImageQuestionId !== 'undefined') {
            return true;
        }
        return false;
    }

    static isFixNeededForQuestionAskHistory(cropped_image_url, retry_counter) {
        if (typeof cropped_image_url !== 'undefined' && typeof retry_counter !== 'undefined') {
            return true;
        }
        return false;
    }

    static mathpixOcr3(host, fileName, config, timeout = 5000, image_url) {
        if (!image_url) {
            image_url = `${config.cdn_url}images/${fileName}`;
        }
        const options = {
            method: 'POST',
            uri: Data.mathpix.latexOcrEndpoint,
            body: {
                url: image_url,
                formats: ['asciimath', 'text'],
                ocr: ['math', 'text'],
                confidence_threshold: 1e-9,
                include_detected_alphabets: 1,
            },
            json: true,
            headers: {
                app_id: config.mathpix_app_id,
                app_key: config.mathpix_app_key,
                'Content-Type': 'application/json',
            },
            time: true,
            timeout,
        };
        const mathpixPromise = new Promise(((resolve, reject) => {
            // Do async job
            request(options, (e, resp, body) => {
                if (e) {
                    console.log(e);
                    if (e.code == 'ETIMEDOUT' || e.code == 'ESOCKETTIMEDOUT' || e.code === 'ENOTFOUND') {
                        resolve({});
                    } else {
                        let errorLog = e;
                        if (!_.isObject(errorLog)) {
                            errorLog = JSON.stringify(errorLog);
                        }
                        logger.error({ tag: 'ask', source: 'mathpixOcr3', error: errorLog });
                        reject(e);
                    }
                } else {
                    body.response_time = resp.elapsedTime;
                    resolve(body);
                }
            });
        }));
        return mathpixPromise;
    }

    static mathpixOcr3Text(host, fileName, config, variantAttachment, image_url) {
        // let url = host + "/static/uploads/" + fileName
        if (!image_url) {
            image_url = `${config.cdn_url}images/${fileName}`;
        }
        const payload = {
            url: image_url,
            formats: ['asciimath_legacy', 'text'],
            ocr: ['math', 'text'],
            include_line_data: 1,
            include_detected_alphabets: 1,
            confidence_threshold: variantAttachment.mathpix_confidence_threshold || 1e-7,
        };
        if (variantAttachment && variantAttachment.includeSmilesInOcr) {
            payload.include_smiles = true;
        }
        const options = {
            method: 'POST',
            uri: Data.mathpix.textOcrEndpoint,
            body: payload,
            json: true,
            headers: {
                app_id: config.mathpix_app_id,
                app_key: config.mathpix_app_key,
                'Content-Type': 'application/json',
            },
            timeout: 5000,
        };
        const mathpixPromise = new Promise(((resolve, reject) => {
            // Do async job
            request(options, (e, resp, body) => {
                if (e) {
                    console.log(e);
                    if (e.code == 'ETIMEDOUT' || e.code == 'ESOCKETTIMEDOUT' || e.code === 'ENOTFOUND') {
                        resolve({});
                    } else {
                        let errorLog = e;
                        if (!_.isObject(errorLog)) {
                            errorLog = JSON.stringify(errorLog);
                        }
                        logger.error({ tag: 'ask', source: 'mathpixOcr3', error: errorLog });
                        reject(e);
                    }
                } else {
                    resolve(body);
                }
            });
        }));
        return mathpixPromise;
    }

    static callViserApi(url, qid, variantAttachment, isBatchRequest=false, batchRequestDetailsObject=null, db) {
        const timeout = isBatchRequest ? 5000 : 3000;
        const options = {
            method: 'POST',
            uri: variantAttachment && variantAttachment.viserOcrEndpoint ? variantAttachment.viserOcrEndpoint : Data.viser.ocrEndpoint,
            body: {
                url,
                question_id: qid,
            },
            json: true,
            headers: {
                Authorization: Data.viser.authKey,
                'Content-Type': 'application/json',
            },
            time: true,
            timeout,
        };
        if (typeof db !== 'undefined') {
            QuestionRedis.incrementViserApiCallCount(db.redis.write, moment().format("YYYYMMDD"));
        }
        const promise = new Promise(((resolve, reject) => {
            request(options, async (e, resp, body) => {
                if (e) {
                    console.log(e);
                    if (e.code == 'ETIMEDOUT' || e.code == 'ESOCKETTIMEDOUT') {
                        if (isBatchRequest) {
                            await ViserOcrBatchApi.setViserBatchApiCallFailureResponsesInRedisHash(db, body, qid);
                        }
                        resolve({});
                    } else {
                        let errorLog = e;
                        if (!_.isObject(errorLog)) {
                            errorLog = JSON.stringify(errorLog);
                        }
                        logger.error({ tag: 'ask', source: 'viserOcrApi', error: errorLog });
                        resolve({});
                    }
                } else {
                    body.response_time = resp.elapsedTime;
                    if (isBatchRequest) {
                        await ViserOcrBatchApi.setViserBatchApiCallSuccessResponsesInRedisHash(db, body, qid, batchRequestDetailsObject, resp.elapsedTime);
                    }
                    resolve(body);
                }
            });
        }));
        return promise;
    }

    static async checkChemistryDiagramInImage(image_url) {
        const options = {
            method: 'POST',
            uri: `${Data.SEARCH_UTILS_API_EKS}${Data.ORGANIC_CLASSIFICATION_ENDPOINT}`,
            body: {
                image_url,
            },
            json: true,
            timeout: 2000,
        };
        const promise = new Promise(((resolve, reject) => {
            request(options, (e, resp, body) => {
                if (e) {
                    console.log(e);
                    resolve(false);
                } else {
                    if (body && body.meta.success && body.data && body.data.is_organic_diagram_present) {
                        resolve(true);
                    }
                    resolve(false);
                }
            });
        }));
        return promise;
    }

    static async insertExamAndBoardSelections(db, options_array, widget_name, student_id) {
        const fetchIdsToDelete = await StudentCourseMapping.selectDataFromStudentCourseMappingForWidget(db.mysql.write, student_id, widget_name);

        // if (!_.isEmpty(fetchIdsToDelete) && fetchIdsToDelete[0].length) {
        if (!_.isEmpty(fetchIdsToDelete)) {
            await StudentCourseMapping.removeDataFromStudentCourseMappingForWidget2(db.mysql.write, fetchIdsToDelete[0].list);
        }

        const promises = [];
        for (let i = 0; i < options_array.length; i++) {
            const obj = {
                student_id,
                ccm_id: options_array[i],
                type: widget_name,
            };
            promises.push(StudentCourseMapping.insertWidgetSelectionForStudent(db.mysql.write, obj));
        }
        await Promise.all(promises);
        return 1;
    }

    static checkAb(student_id) {
        if (student_id) {
            student_id = student_id.toString();
            const dataset = ['0'];
            if (_.includes(dataset, student_id[student_id.length - 1])) {
                return true;
            }
        }
        return true;
    }

    static async translateMyLibraryData(db, table_name, arr, locale) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].title) {
                arr[i].title = global.t8[locale].t(arr[i].title);
            }
            if (arr[i].image_url) {
                arr[i].image_url = global.t8[locale].t(arr[i].image_url);
            }
        }
        return arr;
    }

    static checkThumbnail(elasticSearchResult, thumbnailList, student_id) {
        if ((_.includes(thumbnailList, student_id)) || (elasticSearchResult.doubt && elasticSearchResult.doubt.includes('ERS'))) {
            elasticSearchResult.ocr_text = '';
        }
        return elasticSearchResult;
    }

    static checkYoutubeVideo(ytStudentlList, questionWithAnswer) {
        if (_.includes(ytStudentlList, questionWithAnswer.student_id)) {
            questionWithAnswer.is_youtube = true;
        } else {
            questionWithAnswer.is_youtube = false;
        }
        return questionWithAnswer;
    }

    static getQueryForSubjectPersonalisation(ccm_ids) {
        let sql = '';
        for (let i = 0; i < ccm_ids.length; i++) {
            if (i == ccm_ids.length - 1) {
                const e_sql = `select id,image_url,subject,display,type from homepage_subjects where ccm_meta like '%${ccm_ids[i].ccm_id}%' `;
                sql += e_sql;
            } else {
                const n_sql = `select id,image_url,subject,display,type from homepage_subjects where ccm_meta like '%${ccm_ids[i].ccm_id}%' union `;
                sql += n_sql;
            }
        }
        console.log('this is the union sql to be returned for subjets');
        console.log(sql);
        return sql;
    }

    static getQandAHomeWidgetsFormatter(list_data) {
        const questions_arr = [];
        for (let j = 0; j < list_data.length; j++) {
            const list_obj = {};
            list_obj.id = list_data[j].id;
            list_obj.question_id = list_data[j].qid;
            list_obj.type = `${list_data[j].widget_name}_QUESTION`;
            // list_obj.data_type = list_data[j]['widget_name'];
            // list_obj.title =list_data[j]['title'];
            // lets check the response;
            list_obj.title = `${config.staticCDN}quiz-thumbnail/${list_data[j].qid}.webp`;
            // list_obj.is_submitted = _.isNull(list_data[j].submission) ? 0 : 1;
            list_obj.is_submitted = 0;
            list_obj.submitted_option = list_data[j].submission;
            if (
                list_data[j].is_answered == 0
                && list_data[j].is_text_answered == 1
            ) {
                list_obj.resource_type = 'text';
            } else {
                list_obj.resource_type = 'video';
            }
            list_obj.options = Utility.getOptionsFormatted(list_data[j]);
            questions_arr.push(list_obj);
        }
        return questions_arr;
    }

    static getOptionsFormatted(row_obj) {
        const options_mapping = {
            // "opt_1" : 1,
            // "opt_2" : 2,
            // "opt_3" : 3,
            // "opt_4" : 4
            opt_1: 'A',
            opt_2: 'B',
            opt_3: 'C',
            opt_4: 'D',
        };

        const options_arr = [];
        for (let i = 1; i < 5; i++) {
            const key = `opt_${i}`;
            const isAnswer = row_obj.answer == options_mapping[key]
                || row_obj.answer == options_mapping[key].toLowerCase()
                || row_obj.answer == `(${options_mapping[key].toLowerCase()})`
                || row_obj.answer == `(${options_mapping[key]})`
                || row_obj.answer == `${options_mapping[key].toLowerCase()}.`
                || row_obj.answer == `(${options_mapping[key].toLowerCase()} )`
                ? 1
                : 0;
            const options_obj = {
                option_code: options_mapping[key],
                option_title:
                    `${config.staticCDN}quiz-thumbnail/${row_obj.qid}_${key}.webp`,
                // "option_title":row_obj[key],
                is_answer: isAnswer,
                type: `${row_obj.widget_name}_OPTION`,
            };
            options_arr.push(options_obj);
        }
        return options_arr;
    }

    static async getSubjectPersonalisationObj(database, student_id, student_class) {
        // check in the redis for the recent video watch  --- if empty
        // go for the subject selection -- if empty
        // go for the the default value;
        try {
            let recent_videos_history;
            let most_gen_question_data;
            let most_asked_question_data;
            const sub_sel = await StudentPersonalisation.getStudentSubjectPrefrence(database, student_id);
            console.log('subject_selected ------- >>>> upper');
            console.log(sub_sel);
            if (_.isNull(sub_sel)) {
                console.log('sub_selected null');
                recent_videos_history = await SubjectPersonalisation.getQuestionMetaForPersonalisation(database, student_id);
                if (_.isEmpty(recent_videos_history)) {
                    const most_gen_question_data_str = await SubjectPersonalisation.getMostGeneralQuestionMetaForPersonalisation(database);
                    most_gen_question_data = JSON.parse(most_gen_question_data_str);
                    console.log('most_gen question_data');
                    console.log(most_gen_question_data);
                    return most_gen_question_data[student_class];
                }
                const recent_video_history_arr = JSON.parse(recent_videos_history);
                console.log('recent_video_history ------------------ >>>>>>>>>>');
                console.log(recent_video_history_arr);
                return recent_video_history_arr[0];
            }
            const subject_json = JSON.parse(sub_sel);
            const { subject } = subject_json;
            const subject_inverse_mapping = {
                1: 'PHYSICS',
                3: 'BIOLOGY',
                2: 'MATHS',
                4: 'CHEMISTRY',
            };
            recent_videos_history = await SubjectPersonalisation.getQuestionMetaForPersonalisation(database, student_id);
            if (_.isEmpty(recent_videos_history)) {
                console.log('recent_video_history null ------------------ >>>>>>>>>>');
                console.log(recent_videos_history);
                most_asked_question_data = await SubjectPersonalisation.getGeneralQuestionMetaForPersonalisation(database, student_class);
                const most_asked_question_data_json = JSON.parse(most_asked_question_data);
                console.log('most_asked question_data');
                console.log(most_asked_question_data_json);
                console.log('class wise once');
                console.log(student_class);
                console.log(most_asked_question_data_json[student_class]);
                console.log('subject wise once');
                console.log(subject);
                console.log(most_asked_question_data_json[student_class][subject]);
                return most_asked_question_data_json[student_class][subject];
            }
            const recent_video_history_arr = JSON.parse(recent_videos_history);
            console.log('recent_video_history ------------------ >>>>>>>>>>');
            console.log(recent_video_history_arr);
            let ext_flag = 1;
            // let subject_selected_meta;
            for (let i = 0; i < recent_video_history_arr.length; i++) {
                if (recent_video_history_arr[i].subject == subject_inverse_mapping[subject]) {
                    console.log(i);
                    console.log('loop');
                    console.log(recent_video_history_arr[i]);
                    ext_flag = 0;
                    return recent_video_history_arr[i];
                }
            }
            if (ext_flag) {
                most_asked_question_data = await SubjectPersonalisation.getGeneralQuestionMetaForPersonalisation(database, student_class);
                const most_asked_question_data_json = JSON.parse(most_asked_question_data);
                return most_asked_question_data_json[student_class][subject];
            }
        } catch (e) {
            console.log('error');
            console.log(e);
            console.log('error');
        }
        // check in the subject wala redis
        // then go for recent one
    }

    static async getSubjectSelection(database, student_id, student_class) {
        const subject_mapping = {
            PHYSICS: 1,
            BIOLOGY: 3,
            MATHS: 2,
            CHEMISTRY: 4,
        };

        // dn-personalisation
        // recent - watched - video -meta -subject
        // most likely to be one on general feedback

        const st_prefrences = await StudentPersonalisation.getStudentSubjectPrefrence(
            database,
            student_id,
        );
        console.log('student_  prefrences ------  >>>>>  >>>>>>> >>>>>');
        console.log(st_prefrences);
        // await StudentPersonalisation.getStudentSubjectPrefrence(database, student_id);
        const subject_redis_data = JSON.parse(st_prefrences);
        console.log('studnet ----- redis --- data ------');
        console.log(subject_redis_data);
        if (!_.isEmpty(subject_redis_data)) {
            console.log('i am in 1');
            return subject_redis_data.subject;
        }
        const subjectByVideoWatched = await SubjectPersonalisation.getQuestionMetaForPersonalisation(
            database,
            student_id,
        );
        // console.log("subject by video ------- watch ------");
        console.log(subjectByVideoWatched);
        if (!_.isEmpty(subjectByVideoWatched)) {
            console.log(' i am in 2');
            const sub_select_arr = JSON.parse(subjectByVideoWatched);
            // console.log("subject_selected_obj in 2 --------");
            console.log(sub_select_arr);
            const sub_select = subject_mapping[sub_select_arr[0].subject];
            console.log('subject_select', sub_select);
            return sub_select;
        }
        const genSubjectSelected = await SubjectPersonalisation.getMostGeneralQuestionMetaForPersonalisation(
            database,
            student_class,
        );
        // console.log("general subject selection  ");
        console.log(genSubjectSelected);
        if (!_.isEmpty(genSubjectSelected)) {
            console.log('i am in 3');
            const gen_subject_obj = JSON.parse(genSubjectSelected);
            console.log('gen_subject_selected -----');
            console.log(gen_subject_obj);
            console.log(gen_subject_obj[student_class]);
            const gen_select = subject_mapping[gen_subject_obj[student_class].subject];
            console.log('gen_subject_select', gen_select);
            return gen_select;
        }
        console.log('i am in no');
        return 1;
        // let subject_selected = _.isEmpty(subject_redis_data)
        // ? 1 : subject_redis_data.subject
    }

    static async removeAllDataFromStudentCourseMapping(database, student_id) {
        try {
            await StudentCourseMapping.deleteAllFromStudentCourseMapping(database, student_id);
            return (1);
        } catch (error) {
            console.log(error);
        }
    }

    static async removeAllDataWithoutStreamFromStudentCourseMapping(db, student_id, sclass) {
        try {
            const boardExamDetails = await StudentCourseMapping.getSelectExamBoardAll(db.mysql.read, student_id);
            const steamDetails = boardExamDetails.filter((x) => x.type === 'stream');
            if (steamDetails && steamDetails.length > 0) {
                const newStreamData = await StudentCourseMapping.getCcmIdByCourse(db.mysql.read, sclass, steamDetails[0].course);
                if (newStreamData.length > 0) {
                    const insert_obj = {
                        student_id,
                        ccm_id: newStreamData[0].id,
                        type: 'stream',
                    };
                    StudentCourseMapping.insertWidgetSelectionForStudent(db.mysql.write, insert_obj);
                    StudentCourseMapping.removeDataByCcmId(db.mysql.write, [steamDetails[0].ccm_id], true);
                }
                StudentCourseMapping.removeDataByCcmId(db.mysql.write, [newStreamData[0].id]);
            } else {
                await StudentCourseMapping.deleteAllFromStudentCourseMapping(db.mysql.write, student_id);
            }
            return (1);
        } catch (error) {
            console.log(error);
        }
    }

    static async setNewBoardExamAndDeleteOld(db, student_id, sclass) {
        try {
            const boardExamDetails = await StudentCourseMapping.getSelectExamBoardAll(db.mysql.read, student_id);
            if (boardExamDetails.length > 0) {
                const ccmArr = [];
                const ccmArrRedis = [];
                const obj = [
                    {
                        sql: 'DELETE FROM student_course_mapping WHERE student_id = ?',
                        args: student_id,
                    },
                ];
                const existingBoardData = boardExamDetails.filter((x) => x.category === 'board' && x.type === 'board');
                if (existingBoardData.length > 0) {
                    const newBoardData = await StudentCourseMapping.getCcmIdByCourse(db.mysql.read, sclass, existingBoardData[0].course);
                    if (newBoardData.length > 0) {
                        // add ccm_id into ccmArr
                        ccmArr.push({
                            id: newBoardData[0].id,
                            type: 'board',
                        });
                        ccmArrRedis.push(newBoardData[0].id);
                    }
                }
                const existingStreamData = boardExamDetails.filter((x) => x.category === 'board' && x.type === 'stream');
                if (existingStreamData.length > 0) {
                    const newStreamData = await StudentCourseMapping.getCcmIdByCourse(db.mysql.read, sclass, existingStreamData[0].course);
                    if (newStreamData.length > 0) {
                        // add ccm_id into ccmArr
                        ccmArr.push({
                            id: newStreamData[0].id,
                            type: 'stream',
                        });
                        ccmArrRedis.push(newStreamData[0].id);
                    }
                }
                const existingExamData = boardExamDetails.filter((x) => x.category === 'exam');
                if (existingExamData.length > 0) {
                    const examArr = existingExamData.map((x) => x.course);
                    for (let i = 0; i < examArr.length; i++) {
                        // eslint-disable-next-line no-await-in-loop
                        const newExamData = await StudentCourseMapping.getCcmIdByCourse(db.mysql.read, sclass, examArr[i]);
                        if (newExamData.length > 0) {
                            // add ccm_id into ccmArr
                            ccmArr.push({
                                id : newExamData[0].id,
                                type: 'exam',
                            });
                            ccmArrRedis.push(newExamData[0].id);
                        }
                    }
                }

                // updating ccmids in student hash
                if (ccmArrRedis.length != 0) {
                    StudentRedis.setStudentCcmIds(db.redis.write, student_id, ccmArrRedis);
                    StudentRedis.setStudentCcmIdsWithType(db.redis.write, student_id, ccmArr);


                } else {
                    StudentRedis.delStudentCcmIds(db.redis.write, student_id, ccmArr);
                    StudentRedis.delStudentCcmIdsWithType(db.redis.write, student_id, ccmArr);

                }

                if (ccmArr.length != 0) {
                    ccmArr.forEach((x) => {
                        obj.push({
                            sql: 'INSERT INTO student_course_mapping SET ?',
                            args: {
                                student_id,
                                ccm_id: x.id,
                                type: x.type,
                            },
                        });
                    });
                }
                db.mysql.write.transaction(obj);
            }
            return (1);
        } catch (error) {
            console.log(error);
        }
    }

    static generateResponseForComputationalQuestion(html, questionId, ocr, locale) {
        return {
            // question_id: questionId,
            // tab: [
            //     {
            //         subject: 'all',
            //         display: 'All',
            //     },
            //     {
            //         subject: 'MATHS',
            //         display: 'Mathematics',
            //     },
            //     {
            //         subject: 'CHEMISTRY',
            //         display: 'Chemistry',
            //     },
            //     {
            //         subject: 'PHYSICS',
            //         display: 'Physics',
            //     },
            //     {
            //         subject: 'BIOLOGY',
            //         display: 'Biology',
            //     }
            // ],
            // platform_tabs: [
            //     {
            //         "key": "doubtnut",
            //         "display": "Doubtnut"
            //     },
            //     {
            //         "key": "google",
            //         "display": "Google"
            //     },
            //     {
            //         "key": "cymath",
            //         "display": "CyMath"
            //     },
            //     {
            //         "key": "quora",
            //         "display": "Quora"
            //     },
            //     {
            //         "key": "yahoo",
            //         "display": "Yahoo"
            //     },
            //     {
            //         "key": "youtube",
            //         "display": "Youtube"
            //     }
            // ],
            // "ocr_text": ocr,
            // "question_image": null,
            // matched_questions: [
            // {
            _index: 'question_bank_v1',
            _type: 'repository',
            _id: questionId,
            _score: 1,
            _source: {
                chapter: 0,
                is_answered: 0,
                ocr_text: `\`${ocr}\``,
                is_text_answered: 1,
                subject: 'MATHS',
                views: 0,
                likes: 0,
                share: 0,
                duration: '0',
                share_message: 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge',
                bg_color: Data.color.white,
                isLiked: false,
            },
            partial_score: 30,
            resource_type: 'text',
            answer_id: 406162,
            answer_video: 'text',
            //computational question thumbnail
            question_thumbnail: '',
            class: null,
            chapter: null,
            difficulty_level: null,
            string_diff_text: locale === 'hi' ? `${95} - ${100}% समान` : `${95} - ${100}% Match`,
            string_diff_text_bg_color: 100 === 100 ? '#56BD5B' : '#DAB244',
            // html: ocr,
        };
    //     ],
    //     "matched_count": 1,
    //     "is_subscribed": 0,
    //     "notification": [
    //         {
    //             "event": "camera_guide",
    //             "title": "अब मिलेगा सभी सवालो का जवाब",
    //             "message": "Doubtnut पर सवाल ढूंढने की Master Trick",
    //             "image": "https://www.dropbox.com/s/bxnvx6omnxsax5k/CropToEquation.png?dl=1",
    //             "data": "{\"qid\":2169870,\"page\":\"NOTIFICATION\",\"resource_type\":\"video\"}"
    //         }
    //     ],
    //     "handwritten": 0,
    //     "feedback": {
    //         "feedback_text": "Happy with the Solutions",
    //         "is_show": 1,
    //         "bg_color": "#D9EEF2"
    //     },
    //     "is_only_equation": true
    // }
    }

    static generateDynamicResponse(html, questionId, ocr) {
        const response = {
            _index: 'question_bank_v1',
            _type: 'repository',
            _id: String(questionId),
            _score: 1,
            _source: {
                chapter: 0,
                is_answered: 0,
                ocr_text: `\`${ocr}\``,
                is_text_answered: 1,
                subject: 'MATHS',
                views: 0,
                likes: 0,
                share: 0,
                duration: '0',
                share_message: 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge',
                bg_color: Data.color.white,
                isLiked: false,
            },
            partial_score: 30,
            resource_type: 'dynamic_text',
            answer_id: 406162,
            answer_video: 'text',
            //computational question thumbnail
            question_thumbnail: `${config.staticCDN}images/test.png`,
            class: null,
            chapter: null,
            difficulty_level: null,
            html: `<html><body><div>${html}</div></body></html>`,
        };
        return response;
    }

    static async removeDataForIndividualWidget(database, student_id, widget_name) {
        try {
            const fetchIdsToDelete = await StudentCourseMapping.selectDataFromStudentCourseMappingForWidget(database, student_id, widget_name);
            if (!_.isEmpty(fetchIdsToDelete)) {
                // && fetchIdsToDelete[0].list.length
                await StudentCourseMapping.removeDataFromStudentCourseMappingForWidget2(database, fetchIdsToDelete[0].list);
                return (1);
            }
        } catch (error) {
            console.log(error);
        }
    }

    static checkExistsReturnIndex(arr, match_elem) {
        return arr.findIndex((el) => el.subject === match_elem);
    }

    static getPreservedQuoteString(arr) {
        return arr.map((i) => `"${i}"`).join(',');
    }

    static delayMs(ms = 0) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }

    static getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static async getCcmIdArrFilteredByClass(database, arr, filter, st_class) {
        const results = await ClassCourseMapping.getFilteredCcmIdsByClass(database, arr, filter, st_class);
        const filtered_arr = [];
        for (let i = 0; i < results.length; i++) {
            filtered_arr.push(results[i].id);
        }
        return filtered_arr;
    }

    static getEscapedBackslahes(obj) {
        if (!_.isEmpty(obj._source)) {
            const str = JSON.stringify(obj._source);
            return str.replace(/\\+\"/g, '\"');
        }
        return JSON.stringify(obj._source);
    }

    static getEscapedBackslashesString(obj) {
        if (!_.isEmpty(obj.ocr_text)) {
            return obj.ocr_text.replace(/\\+\"/g, '\"');
        }
        return obj.ocr_text;
    }

    static isHindiString(questionString) {
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

        if (matchRes == '' || matchRes == null || matchRes == undefined) {
            return 0;
        }
        return 1;
    }

    static checkHindiCharsSubstr(ocr_string) {
        const ocr_string_arr = ocr_string.split(' ');
        for (let i = 0; i < ocr_string_arr.length; i++) {
            if (Utility.isHindiString(ocr_string_arr[i])) {
                return 1;
            }
        }
        return 0;
    }

    static checkQuestionOcrLanguages(ocr_string) {
        const langRegexObj = Data.languageDetectionRegex;
        let detectedLanguage = 'en';
        const langDetectionObj = {
            en: 0,
            hi: 0,
            te: 0,
            ta: 0,
            bn: 0,
            gu: 0,
            ml: 0,
            kn: 0,
            pa: 0,
        };
        const ocr_string_arr = ocr_string.split(' ');
        const ocr_string_count = ocr_string_arr.length;
        for (let i = 0; i < ocr_string_arr.length; i++) {
            const word = ocr_string_arr[i];
            if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.hi}+?(?:\\s|$)`))) {
                langDetectionObj.hi += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.te}+?(?:\\s|$)`))) {
                langDetectionObj.te += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.ta}+?(?:\\s|$)`))) {
                langDetectionObj.ta += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.bn}+?(?:\\s|$)`))) {
                langDetectionObj.bn += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.gu}+?(?:\\s|$)`))) {
                langDetectionObj.gu += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.ml}+?(?:\\s|$)`))) {
                langDetectionObj.ml += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.kn}+?(?:\\s|$)`))) {
                langDetectionObj.kn += 1;
            } else if (word.match(new RegExp(`(?:^|\\s)${langRegexObj.pa}+?(?:\\s|$)`))) {
                langDetectionObj.pa += 1;
            } else {
                langDetectionObj.en += 1;
            }
        }

        const languagesPresentInOcr = _.chain(langDetectionObj)
            .map((val, key) => ({ name: key, count: val }))
            .sortBy('count')
            .reverse()
            .keyBy('name')
            .mapValues('count')
            .value();

        for (const language in languagesPresentInOcr) {
            if (language != 'en' && (languagesPresentInOcr[language] / ocr_string_count) > 0.1) {
                detectedLanguage = language;
                break;
            }
        }
        return {
            detectedLanguage,
            languagesPresentInOcr,
        };
    }

    static async viserMathsOcrTranslationHandler(ocr_text, translate2) {
        const ocr_text_parts = ocr_text.split('"');
        const ocr_textual_portions = [];
        const ocr_translated_textual_portions = [];
        const ocr_equation_portions = [];
        for (let index = 0; index < ocr_text_parts.length; index++) {
            if (index % 2 == 0) {
                ocr_textual_portions.push(ocr_text_parts[index]);
            } else {
                ocr_equation_portions.push(ocr_text_parts[index]);
            }
        }
        const translatedTexts = await Utility.translateApi2(ocr_textual_portions, translate2);
        if (translatedTexts && typeof translatedTexts[1].data !== 'undefined' && typeof translatedTexts[1].data.translations !== 'undefined') {
            for (const translation of translatedTexts[1].data.translations) {
                ocr_translated_textual_portions.push(translation.translatedText);
            }
        }
        let translated_ocr_text = '';
        for (let i = 0; i < ocr_text_parts.length; i++) {
            if (i % 2 == 0) {
                translated_ocr_text += ocr_translated_textual_portions[Math.floor(i / 2)];
            } else {
                translated_ocr_text += ` "${ocr_equation_portions[Math.floor(i / 2)]}" `;
            }
        }
        return translated_ocr_text;
    }

    static isEnglishMathSymbolString(str) {
        if (!str) return false;
        const x = utf8.encode(str);
        if (x === str) {
            return true;
        }
        return false;
    }

    static async mathpixHindiTranslateParser(ocr_text, translate2, translationFlag) {
        if (translationFlag) {
            let is_hindi_flag = 0;
            const mathpix_ocr_chars = ocr_text.split(' ');
            const total_length_ocr_chars = mathpix_ocr_chars.length;

            const hindi_ocrs_chars_arr = [];
            const hindi_ocr_chars_indexes = [];

            let final_chars_array = [];
            let locale;
            let final_mathpix_ocr;

            for (let k = 0; k < mathpix_ocr_chars.length; k++) {
                if (Utility.isHindiString(mathpix_ocr_chars[k])) {
                    is_hindi_flag = 1;
                    hindi_ocr_chars_indexes.push(k);
                    hindi_ocrs_chars_arr.push(mathpix_ocr_chars[k]);
                }
            }

            let cursor = 0;
            const promise_cursors = [];
            const promise_start_index = [];

            if (is_hindi_flag) {
                let start_index = hindi_ocr_chars_indexes[0];
                let end_index = hindi_ocr_chars_indexes[0] + 1;

                const translation_promises = [];

                promise_cursors.push(cursor);
                promise_start_index.push(start_index);

                for (let m = 0; m < hindi_ocr_chars_indexes.length - 1; m++) {
                    if (hindi_ocr_chars_indexes[m + 1] == hindi_ocr_chars_indexes[m] + 1) {
                        end_index += 1;
                    } else {
                        const combined_strings = mathpix_ocr_chars.slice(start_index, end_index);
                        translation_promises.push(Utility.translateApi2(combined_strings.join(' '), translate2));
                        cursor = end_index;
                        start_index = hindi_ocr_chars_indexes[m + 1];
                        end_index = hindi_ocr_chars_indexes[m + 1] + 1;
                        promise_cursors.push(cursor);
                        promise_start_index.push(start_index);
                    }
                }

                const translationAllPromises = await Promise.all(translation_promises);
                for (let l = 0; l < translationAllPromises.length; l++) {
                    if (translationAllPromises[l].length > 0 && translationAllPromises[l][1].data !== undefined && translationAllPromises[l][1].data.translations !== undefined && translationAllPromises[l][1].data.translations[0].translatedText !== undefined) {
                        const questionText = translationAllPromises[l][1].data.translations[0].translatedText;
                        final_chars_array = [...final_chars_array, ...mathpix_ocr_chars.slice(promise_cursors[l], promise_start_index[l])];
                        final_chars_array.push(questionText);
                    }
                }

                final_chars_array = [...final_chars_array, ...mathpix_ocr_chars.slice(cursor, start_index)];
                const last_hindi_chars_arr = mathpix_ocr_chars.slice(start_index, end_index);
                const translated_last_hindi_chars = await Utility.translateApi2(last_hindi_chars_arr.join(' '), translate2);
                if (translated_last_hindi_chars.length > 0 && translated_last_hindi_chars[1].data !== undefined && translated_last_hindi_chars[1].data.translations !== undefined && translated_last_hindi_chars[1].data.translations[0].translatedText !== undefined) {
                    final_chars_array.push(translated_last_hindi_chars[1].data.translations[0].translatedText);
                }
                final_chars_array = [...final_chars_array, ...mathpix_ocr_chars.slice(end_index, total_length_ocr_chars)];

                final_mathpix_ocr = final_chars_array.join(' ');
                final_mathpix_ocr = final_mathpix_ocr.replace(/\s\s+/g, ' ');

                locale = 'hi';
            } else {
                final_mathpix_ocr = ocr_text;
                locale = 'en';
            }
            return {
                ocr_text: final_mathpix_ocr,
                locale,
            };
        }
        return {
            ocr_text,
            locale: Utility.isHindiString(ocr_text) ? 'hi' : 'en',
        };
    }

    static async mathpixRegionalTranslateParser(ocr_text, translate2) {
        try {
            const ocr_text_parts = ocr_text.split('"');
            const ocr_text_parts_length = ocr_text_parts.length;
            const text_parts = [];
            const equation_parts = [];
            const promises = [];
            if (ocr_text_parts_length == 1) {
                const regex_array = ocr_text_parts[0].match(/(\b(x|ln|log|=|hat|tilde|det|lim|pi|rarr|\+|-|sqrt|phi|delta|sum_)\b.*)| (([^a-zA-Z]+|^)(\^|f\(x\)|g\(x\)|\+|=|times|cos|sin|tan|sec|cot|cosec|csc)[^a-zA-Z]+.*)|(a-zA-Z{0})'/);
                if (regex_array && Array.isArray(regex_array) && regex_array.length) {
                    return ocr_text_parts[0];
                }
                const translatedText = await Utility.translateApi2(ocr_text_parts[0], translate2);
                return translatedText;
            }
            for (let index = 0; index < ocr_text_parts.length; index++) {
                const ocr_text_part = ocr_text_parts[index];
                if (index % 2) {
                    text_parts.push(ocr_text_part);
                    promises.push(Utility.translateApi2(ocr_text_part, translate2));
                } else {
                    equation_parts.push(ocr_text_part);
                }
            }
            const result = await Promise.all(promises);
            let counter = 0; let text_index = 0; let equation_index = 0;
            const combined_arr = [];
            while (counter < ocr_text_parts_length) {
                if (counter % 2) {
                    combined_arr.push((result[text_index])[0]);
                    text_index++;
                } else {
                    combined_arr.push(equation_parts[equation_index]);
                    equation_index++;
                }
                counter++;
            }
            return combined_arr.join(' ');
        } catch (error) {
            return ocr_text;
        }
    }

    static async mathpixHindiTranslateParserNew(ocr_text, translate2, translationFlag, split) {
        if (translationFlag) {
            let is_hindi_flag = 0;
            const mathpix_ocr_chars = split(ocr_text);
            const total_length_ocr_chars = mathpix_ocr_chars.length;

            const hindi_ocrs_chars_arr = [];
            const hindi_ocr_chars_indexes = [];

            let final_chars_array = [];
            let locale;
            let final_mathpix_ocr;

            for (let k = 0; k < mathpix_ocr_chars.length; k++) {
                if (Utility.isHindiString(mathpix_ocr_chars[k])) {
                    is_hindi_flag = 1;
                    hindi_ocr_chars_indexes.push(k);
                    hindi_ocrs_chars_arr.push(mathpix_ocr_chars[k]);
                }
            }

            let cursor = 0;
            const promise_cursors = [];
            const promise_start_index = [];

            if (is_hindi_flag) {
                let start_index = hindi_ocr_chars_indexes[0];
                let end_index = hindi_ocr_chars_indexes[0] + 1;

                const translation_promises = [];

                promise_cursors.push(cursor);
                promise_start_index.push(start_index);

                for (let m = 0; m < hindi_ocr_chars_indexes.length - 1; m++) {
                    if (hindi_ocr_chars_indexes[m + 1] == hindi_ocr_chars_indexes[m] + 1) {
                        end_index += 1;
                    } else {
                        const combined_strings = mathpix_ocr_chars.slice(start_index, end_index);
                        translation_promises.push(Utility.translateApi2(combined_strings.join(' '), translate2));
                        cursor = end_index;
                        start_index = hindi_ocr_chars_indexes[m + 1];
                        end_index = hindi_ocr_chars_indexes[m + 1] + 1;
                        promise_cursors.push(cursor);
                        promise_start_index.push(start_index);
                    }
                }

                const translationAllPromises = await Promise.all(translation_promises);
                for (let l = 0; l < translationAllPromises.length; l++) {
                    if (translationAllPromises[l].length > 0 && translationAllPromises[l][1].data !== undefined && translationAllPromises[l][1].data.translations !== undefined && translationAllPromises[l][1].data.translations[0].translatedText !== undefined) {
                        const questionText = translationAllPromises[l][1].data.translations[0].translatedText;
                        final_chars_array = [...final_chars_array, ...mathpix_ocr_chars.slice(promise_cursors[l], promise_start_index[l])];
                        final_chars_array.push(questionText);
                    }
                }

                final_chars_array = [...final_chars_array, ...mathpix_ocr_chars.slice(cursor, start_index)];
                const last_hindi_chars_arr = mathpix_ocr_chars.slice(start_index, end_index);
                const translated_last_hindi_chars = await Utility.translateApi2(last_hindi_chars_arr.join(' '), translate2);
                if (translated_last_hindi_chars.length > 0 && translated_last_hindi_chars[1].data !== undefined && translated_last_hindi_chars[1].data.translations !== undefined && translated_last_hindi_chars[1].data.translations[0].translatedText !== undefined) {
                    final_chars_array.push(translated_last_hindi_chars[1].data.translations[0].translatedText);
                }
                final_chars_array = [final_chars_array.join(' '), ...mathpix_ocr_chars.slice(end_index, total_length_ocr_chars)];

                final_mathpix_ocr = final_chars_array.join('');
                final_mathpix_ocr = final_mathpix_ocr.replace(/\s\s+/g, ' ');

                locale = 'hi';
            } else {
                final_mathpix_ocr = ocr_text;
                locale = 'en';
            }
            return {
                ocr_text: final_mathpix_ocr,
                locale,
            };
        }
        return {
            ocr_text,
            locale: Utility.isHindiString(ocr_text) ? 'hi' : 'en',
        };
    }

    static getStreamUrl(domain, appName, streamName, authKey) {
        const now = moment().unix();
        const hexTime = Buffer.from(now.toString(), 'utf8').toString('hex');
        const txnSecret = md5(authKey + streamName + hexTime);
        return `rtmp://${domain}/${appName}/${streamName}?txSecret=${txnSecret}&txTime=${hexTime}`;
    }

    static getStreamUrlPost(domain, appName, streamName, authKey) {
        const now = moment().unix() + (24 * 60 * 60);
        const hexTime = now.toString(16);
        const txnSecret = md5(authKey + streamName + hexTime);
        return `rtmp://${domain}/${appName}/${streamName}?txSecret=${txnSecret}&txTime=${hexTime}`;
    }

    static getTimeshiftUrl(domain, appName, streamName) {
        return `http://${domain}/timeshift/${appName}/${streamName}/timeshift.m3u8`;
    }

    static isStudentIdEligibleForRepeatQuestionsPersonalisation(studentId) {
        return false;
        // return !!(studentId && studentId % 50 === 0);
    }

    static getPushUrl(domain, appName, streamName, secret) {
        const now = moment().unix();
        const hexTime = Buffer.from(now.toString(), 'utf8').toString('hex');
        return `rtmp://${domain}/${appName}/${streamName}?txSecret=${secret}&txTime=${hexTime}`;
    }

    static isRequestFromApp(request_user_agent) {
        const app_agent_regex_matches = request_user_agent.match(/okhttp/gi);
        return !_.isEmpty(app_agent_regex_matches) ? 1 : 0;
    }

    static handleSelfie(faceImg, s3, publicPathNew, student_id) {
        return new Promise((async (resolve, reject) => {
            // Do async job
            try {
                let extension = '.png'; let
                    content_type;
                if (faceImg.indexOf('png') !== -1) {
                    extension = '.png';
                    content_type = 'image/png';
                } else if (faceImg.indexOf('jpg') !== -1
                    || faceImg.indexOf('jpeg') !== -1) {
                    extension = '.jpg';
                    content_type = 'image/jpg';
                }
                faceImg = faceImg.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                const promises = [];
                const fileName = `upload_${student_id}_${moment().unix()}${extension}`;
                const buf = new Buffer(faceImg, 'base64');
                promises.push(
                    fs.writeFileAsync(`${publicPathNew}/uploads/${fileName}`, faceImg,
                        'base64'),
                );
                promises.push(
                    this.uploadTos3(s3, config.aws_bucket, fileName, buf, content_type),
                );
                await Promise.all(promises);
                return resolve(fileName);
            } catch (e) {
                let errorLog = e;
                if (!_.isObject(errorLog)) {
                    errorLog = JSON.stringify(errorLog);
                }
                logger.error({ tag: 'selfi', source: 'handleImage', error: errorLog });
                return reject(e);
                // return reject(false);
            }
        }));
    }

    static generateDeeplinkFromAppDeeplink(branchKey, channel, campaign, deeplink) {
        try {
            // deeplink = 'doubtnutapp://pdf_viewer?pdf_url=${config.staticCDN}pdf_download/JM_2019_ALL.pdf&foo=bar';
            const splitted = deeplink.split('?');
            const featureSplitted = splitted[0].split('//');
            let dataSplitted = [];
            if (splitted.length > 1) {
                dataSplitted = splitted[1].split('&');
            }
            const feature = featureSplitted[1];
            const data = {};
            for (let i = 0; i < dataSplitted.length; i++) {
                const s = dataSplitted[i].split('=');
                data[s[0]] = s[1];
            }
            const myJSONObject = {
                branch_key: branchKey,
                channel,
                feature,
                campaign,
            };
            if (!_.isEmpty(data)) {
                myJSONObject.data = data;
            }
            const options = {
                url: 'https://api.branch.io/v1/url',
                method: 'POST',
                json: true,
                body: myJSONObject,
                timeout: 5000,
            };
            return rp(options);
        } catch (e) {
            return {};
        }
    }

    static async generateDeeplinkFromAppDeeplinkWithNewSession(branchKey, channel, campaign, deeplink) {
        try {
            // deeplink = 'doubtnutapp://pdf_viewer?pdf_url=${config.staticCDN}pdf_download/JM_2019_ALL.pdf&foo=bar';
            const splitted = deeplink.split('?');
            const featureSplitted = splitted[0].split('//');
            const dataSplitted = splitted[1].split('&');
            const featureFull = featureSplitted[1];
            const feature = featureFull.split('/')[0];
            const path = featureFull.split('/')[1];
            const data = {};
            for (let i = 0; i < dataSplitted.length; i++) {
                const s = dataSplitted[i].split('=');
                data[s[0]] = s[1];
            }
            data.path = path;
            const myJSONObject = {
                branch_key: branchKey,
                channel,
                feature,
                campaign,
                branch_force_new_session: true,
            };
            if (!_.isEmpty(data)) {
                myJSONObject.data = data;
            }
            const options = {
                method: 'POST',
                url: 'https://api.branch.io/v1/url',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: myJSONObject,
                timeout: 500,
            };
            const result = await inst.configMicroInst(options);
            return result.data;
        } catch (e) {
            console.log(e);
            return false;
        }
    }

    static checkArrayValidity(arr, key) {
        return arr !== undefined && arr.length === 1 && arr[0] !== undefined && arr[0][key] !== undefined;
    }

    static checkValidDNStudentId(student_id) {
        if (student_id <= 100) {
            return true;
        }
        return false;
    }

    static async createTinyURL(url, tag) {
        try {
            const tinyUrl = await inst.configMicroInst({
                method: 'POST',
                url: `${config.microUrl}/api/deeplink/tinyurl`,
                data: {
                    url,
                    tag,
                },
            });
            console.log('response micro', tinyUrl.data);
            return tinyUrl.data;
        } catch (e) {
            console.error('error', e);
            return e;
        }
    }

    static generateDeepLinkForPayments(config, channel, feature, campaign, variant_id, coupon_code) {
        // console.log(post_id)
        return new Promise(((resolve, reject) => {
            try {
                const myJSONObject = {
                    branch_key: config.branch_key,
                    channel,
                    feature,
                    campaign,
                };
                const data = {};
                if (!_.isNull(variant_id)) {
                    data.variant_id = variant_id;
                }
                if (!_.isNull(coupon_code) && !_.isEmpty(coupon_code)) {
                    data.coupon_code = coupon_code;
                }
                data.referrer_student_id = '115';
                myJSONObject.data = data;
                console.log(myJSONObject);
                request(
                    {
                        url: 'https://api.branch.io/v1/url',
                        method: 'POST',
                        json: true, // <--Very important!!!
                        body: myJSONObject,
                    },
                    (error, response, body) => {
                        if (error) {
                            console.log(error);
                            return reject(error);
                        } else {
                            // console.log(body);
                            return resolve(body);
                        }
                    },
                );
            } catch (e) {
                console.log(e);
                return reject(e);
            }
        }));
    }

    static getLatestLongForm(config, studentID) {
        return new Promise(((resolve, reject) => {
            const options = {
                method: 'GET',
                url: `${config.pznUrl}api/v1/video-view-summary`,
                qs:
                    {
                        student_id: studentID,
                    },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            };
            console.log(options);
            request(options, (error, response) => {
                if (error) throw new Error(error);
                console.log(response.body);
                if (error) reject(error);
                resolve(JSON.parse(response.body));
            });
        }));
    }

    static getLeadSourceData(key, phone) {
        return new Promise(((resolve, reject) => {
            try {
                const myJSONObject = {
                    key,
                    mobile_number: phone,
                };
                request(
                    {
                        url: 'https://crm-api.doubtnut.com/dialer/public/index.php/suitecrm/dncrm_lead_assortment_info',
                        method: 'POST',
                        json: true, // <--Very important!!!
                        body: myJSONObject,
                    },
                    (error, response, body) => {
                        if (error) {
                            console.log(error);
                        } else {
                            // console.log(body);
                            return resolve(body);
                        }
                    },
                );
            } catch (e) {
                console.log(e);
                return reject(e);
            }
        }));
    }

    static getLeadNumber(key, leadID) {
        return new Promise(((resolve, reject) => {
            try {
                const myJSONObject = {
                    key,
                    lead_id: leadID,
                };
                console.log(myJSONObject);
                request(
                    {
                        url: 'https://crm-api.doubtnut.com/dialer/public/index.php/suitecrm/dncrm_get_lead_number',
                        method: 'POST',
                        json: true, // <--Very important!!!
                        body: myJSONObject,
                    },
                    (error, response, body) => {
                        if (error) {
                            console.log(error);
                        } else {
                            // console.log(body);
                            return resolve(body);
                        }
                    },
                );
            } catch (e) {
                console.log(e);
                return reject(e);
            }
        }));
    }

    static mapRecommendedScores(arr, locale, isComputational, variantAttachment) {
        try {
            let clone_array = [...arr];
            if (clone_array[0].partial_score && clone_array[arr.length - 1].partial_score) {
                clone_array = _.orderBy(clone_array, ['partial_score'], ['desc']);
                const maxScore = clone_array[0].partial_score;
                const upperLimit = 95;
                const lowerLimit = 60;
                const minScore = clone_array[clone_array.length - 1].partial_score;
                if (minScore >= maxScore) {
                    for (let i = 0; i < arr.length; i++) {
                        if (clone_array[i].partial_score) {
                            let recommended_score;
                            if (maxScore > upperLimit) {
                                recommended_score = upperLimit;
                            } else if (maxScore < lowerLimit) {
                                recommended_score = lowerLimit;
                            } else {
                                recommended_score = maxScore;
                            }
                            const lowNumber = recommended_score % 5;
                            const topNumber = 5 - lowNumber;
                            const lowRange = recommended_score - lowNumber;
                            const topRange = recommended_score + topNumber;
                            arr[i].string_diff_text = locale === 'hi' ? `${lowRange} - ${topRange}% समान` : `${lowRange} - ${topRange}% Match`;
                            arr[i].string_diff_text_bg_color = topRange === 100 ? '#56BD5B' : '#DAB244';
                        }
                    }
                } else {
                    const offset = lowerLimit - ((upperLimit - lowerLimit) / (maxScore - minScore)) * minScore;
                    for (let i = 0; i < clone_array.length; i++) {
                        if (clone_array[i].partial_score) {
                            const recommended_score = Math.floor(offset + ((upperLimit - lowerLimit) / (maxScore - minScore)) * clone_array[i].partial_score);
                            const lowNumber = recommended_score % 5;
                            const topNumber = 5 - lowNumber;
                            const lowRange = recommended_score - lowNumber;
                            const topRange = recommended_score + topNumber;
                            arr[i].string_diff_text = locale === 'hi' ? `${lowRange} - ${topRange}% समान` : `${lowRange} - ${topRange}% Match`;
                            arr[i].string_diff_text_bg_color = topRange === 100 ? '#56BD5B' : '#DAB244';
                        }
                    }
                }
                if (isComputational && variantAttachment && variantAttachment.getComputeExactTag) {
                    arr[0].string_diff_text = locale === 'hi' ? '100% समान' : '100% Match';
                }
            }
            return arr;
        } catch (e) {
            console.log(e);
            return arr;
        }
    }

    static sendWhatsAppHSMToReferral(config, data) {
        return new Promise(((resolve, reject) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                    {
                        method: 'SendMessage',
                        send_to: `91${data.mobile}`,
                        msg: data.message,
                        msg_type: 'HSM',
                        userid: config.optIn.login,
                        auth_scheme: 'plain',
                        data_encoding: 'Unicode_text',
                        password: config.optIn.password,
                        v: '1.1',
                        format: 'JSON',
                        isHSM: 'true',
                    },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            };
            console.log(options);
            request(options, (error, response) => {
                if (error) throw new Error(error);
                console.log(response.body);
                if (error) reject(error);
                resolve(response.body);
            });
        }));
    }

    static sendWhatsAppHSMMedia(config, data) {
        return new Promise(((resolve, reject) => {
            const options = {
                method: 'GET',
                url: 'https://doubtnut.smsgupshup.com/GatewayAPI/rest',
                qs:
                    {
                        method: 'SendMediaMessage',
                        send_to: `91${data.mobile}`,
                        media_url: data.url,
                        msg_type: data.msg_type,
                        userid: config.optIn.login,
                        auth_scheme: 'plain',
                        data_encoding: 'Unicode_text',
                        password: config.optIn.password,
                        caption: data.caption,
                        v: '1.1',
                        format: 'JSON',
                        isHSM: 'true',
                        filename: data.filename,
                    },
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            };
            console.log(options);
            request(options, (error, response) => {
                if (error) throw new Error(error);
                console.log(response.body);
                if (error) reject(error);
                resolve(response.body);
            });
        }));
    }

    static sendSMSToReferral(config, data, disableMasking) {
        return new Promise(((resolve, reject) => {
            console.log(data);
            console.log(config.gupshup);
            const options = {
                method: 'GET',
                url: 'https://enterprise.smsgupshup.com/GatewayAPI/rest',
                qs:
                    {
                        method: 'SendMessage',
                        send_to: data.mobile,
                        msg: data.message,
                        msg_type: (data.locale && data.locale == 'hi') ? 'Unicode_Text' : 'TEXT',
                        userid: config.gupshup.userid,
                        auth_scheme: 'plain',
                        data_encoding: 'Unicode_text',
                        password: config.gupshup.password,
                        v: '1.1',
                        format: (data.locale && data.locale == 'hi') ? 'Text' : 'JSON',
                        ...(disableMasking && { linkTrakingEnabled: false }),
                    },
            };
            console.log(options);
            request(options, (error, response) => {
                if (error) throw new Error(error);
                console.log(response.body);
                if (error) reject(error);
                resolve(response.body);
            });
        }));
    }

    static async getQuestionTopic(ocrText) {
        const options = {
            method: 'POST',
            url: `${Data.PREPROCESS_SERVICE_API_META_DATA}`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: {
                ocrText,
            },
            timeout: 800,
        };
        try {
            const { data } = await inst.preprocessDoubtnutInst(options);
            if (data.data.topic) {
                return data.data.topic[0];
            }
        } catch (e) {
            return 'NONE';
        }
    }

    static async getTimeDiff() {
        const currentTime = new Date().getTime();
        const endTime = new Date().setHours(23, 59, 59, 0);
        return (endTime - currentTime) / 1000;
    }

    static getDateFromMysqlDate(datepassed) {
        const dateValue = new Date(datepassed);
        let dateToBeReturned = `${dateValue.getFullYear()}`;
        dateToBeReturned += dateValue.getMonth().toString().length == 1 ? `-0${dateValue.getMonth() + 1}` : `-${dateValue.getMonth() + 1}`;
        dateToBeReturned += dateValue.getDate().toString().length == 1 ? `-0${dateValue.getDate()}` : `-${dateValue.getDate()}`;
        return dateToBeReturned;
    }

    static async getInAppSearchData(subject, chapter, classVal, xAuthToken, isOnlyLive) {
        const options = {
            method: 'POST',
            url: `${config.microUrl}/api/search/matches`,
            headers: {
                'Content-Type': 'application/json',
                version_code: '880',
                'x-auth-token': xAuthToken,
            },
            data: {
                class: classVal,
                text: chapter,
            },
            timeout: 800,
        };
        if (subject) {
            if (isOnlyLive) {
                options.data.tabs_filter = { live_class: { subject: [{ is_selected: true, value: subject }] } };
            } else {
                options.data.tabs_filter = { all: { subject: [{ is_selected: true, value: subject }] } };
            }
        }
        try {
            const { data } = await inst.configMicroInst(options);
            return data.data;
        } catch (e) {
            return 'NONE';
        }
    }

    static todayEndAndStarting() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const todayStartDateTime = now.startOf('day').format('YYYY-MM-DD HH:mm:ss');
        const todayEndDateTime = now.endOf('day').format('YYYY-MM-DD HH:mm:ss');

        return { todayStartDateTime, todayEndDateTime };
    }

    static getTodaysDateString() {
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const todayDate = now.startOf('day').format('YYYY-MM-DD');

        return todayDate;
    }

    static inWords(num) {
        num = num.toString();
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ',
            'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        if (num.length > 9) return '';
        const n = (`000000000${num}`).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return;
        let res = '';
        res += (parseInt(n[1]) !== 0) ? `${a[Number(n[1])] || `${b[n[1][0]]} ${a[n[1][1]]}`}crore ` : '';
        res += (parseInt(n[2]) !== 0) ? `${a[Number(n[2])] || `${b[n[2][0]]} ${a[n[2][1]]}`}lakh ` : '';
        res += (parseInt(n[3]) !== 0) ? `${a[Number(n[3])] || `${b[n[3][0]]} ${a[n[3][1]]}`}thousand ` : '';
        res += (parseInt(n[4]) !== 0) ? `${a[Number(n[4])] || `${b[n[4][0]]} ${a[n[4][1]]}`}hundred ` : '';
        res += (parseInt(n[5]) !== 0) ? `${((res !== '') ? 'and ' : '') + (a[Number(n[5])] || `${b[n[5][0]]} ${a[n[5][1]]}`)}` : '';
        return res;
    }

    static async getRewardExpiry(xAuthToken) {
        let expiry = null;
        const flagrData = { xAuthToken, body: { capabilities: { 'awards-expiry': {} } } };
        const flagrResponse = await UtilityFlagr.getFlagrResp(flagrData);

        if (flagrResponse && flagrResponse['awards-expiry'] && flagrResponse['awards-expiry'].payload && flagrResponse['awards-expiry'].payload.enabled) {
            const { days } = flagrResponse['awards-expiry'].payload;
            const today = moment().add(5, 'hours').add(30, 'minutes').toDate();
            expiry = moment(today).add(days, 'd').endOf('day').format('YYYY-MM-DD HH:mm:ss');
        }
        return expiry;
    }

    static async buyWithUpiStatus(xAuthToken, hasUPI) {
        let upi_flag = false;
        if (!hasUPI) {
            return false;
        }
        const flagrData = { xAuthToken, body: { capabilities: { buy_with_upi: {} } } };
        const flagrResponse = await UtilityFlagr.getFlagrResp(flagrData);

        if (hasUPI && flagrResponse && flagrResponse.buy_with_upi && flagrResponse.buy_with_upi.payload && flagrResponse.buy_with_upi.payload.enabled) {
            upi_flag = true;
        }
        return upi_flag;
    }

    static getStudentStateCode(req) {
        let ip = null;
        if (req) {
            if (req.headers && req.headers['x-forwarded-for']) {
                ip = req.headers['x-forwarded-for'].split(',').shift();
            } else if (req.socket) {
                ip = req.socket.remoteAddress;
            }
        }
        const geo = geoip.lookup(ip);
        const location = geo ? geo.region : null;
        return [location, ip];
    }

    static async translateSmilesRegionalLangOcrParser(ocr_text, translate2) {
        const translatedTexts = await Utility.translateApi2(ocr_text, translate2);
        if (translatedTexts && typeof translatedTexts[1].data !== 'undefined' && typeof translatedTexts[1].data.translations !== 'undefined') {
            return translatedTexts[1].data.translations[0].translatedText;
        }
    }

    static getTranslatedTextFromRes(transLateApiResp) {
        let ocr = '';
        if (transLateApiResp.length > 0 && transLateApiResp[1].data !== undefined
            && transLateApiResp[1].data.translations !== undefined
            && transLateApiResp[1].data.translations[0].translatedText !== undefined) {
            ocr = transLateApiResp[1].data.translations[0].translatedText;
        }
        return ocr;
    }

    static calculateStringLengthWithoutSymbols(s) {
        let length = 0;
        for (let index = 0; index < s.length; index++) {
            const element = s[index];
            if (element != '"' && element != '\'' && element != '`') {
                length++;
            }
        }
        return length;
    }

    static validateUuidForAskQuestion(uuid) {
        return validator.isUUID(`${uuid}`, 4);
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    static addDeterministicSuffixToSsIteration(variantAttachment, isSearchServiceFlagrDeterministic) {
        if (isSearchServiceFlagrDeterministic) {
            variantAttachment.versionSuffix = 'det';
        } else {
            variantAttachment.versionSuffix = 'non_det';
        }
    }

    static isFlagrAttachmentDeterministic(studentId) {
        return false;
    }

    static getGuestUserForceLoginPopupDetails(userLocale) {
        const obj = {};
        obj.title = userLocale === 'hi' ? GuestLoginPopupData.title.hi : GuestLoginPopupData.title.en;
        obj.subTitle = userLocale === 'hi' ? GuestLoginPopupData.subtitle.hi : GuestLoginPopupData.subtitle.en;
        obj.ctaText = userLocale === 'hi' ? GuestLoginPopupData.button.hi : GuestLoginPopupData.button.en;
        obj.imageUrl = userLocale === 'hi' ? GuestLoginPopupData.image_url.hi : GuestLoginPopupData.image_url.en;
        return obj;
    }

    static handleGuestLoginResponse(responseData, locale) {
        try {
            return {
                ...responseData,
                meta: {
                    ...responseData.meta,
                    extras: {
                        guestLoginAppUseLimitExceed: true,
                        popupDetails: Utility.getGuestUserForceLoginPopupDetails(locale),
                    },
                },
            };
        } catch (e) {
            return responseData;
        }
    }

    static getMappedRoutes(routes, student_id) {
        try {
            return routes.map((route) => {
                if (route.includes(':student_id')) {
                    return route.replace(':student_id', student_id);
                }
                return route;
            });
        } catch (e) {
            return routes;
        }
    }

    static handleDeprecatedEmptyResponse() {
        return {
            took: 1,
            timed_out: false,
            _shards: {
                total: 1, successful: 1, skipped: 0, failed: 0,
            },
            hits: { total: { value: 0, relation: 'eq' }, max_score: null, hits: [] },
        };
    }

    static arrayUnion(masterQidArray, arr1, arr2) {
        for (let i = 0; i < arr2.length; i++) {
            if (!_.get(masterQidArray, arr2[i]._id, 0)) {
                masterQidArray[arr2[i]._id] = 1;
                arr1.push(arr2[i]);
            }
        }
        return arr1;
    }

    static shouldAddDataToMasterIterationArray(nameOfIteration) {
        return nameOfIteration !== 'v_viser_diagram_panel' && nameOfIteration !== 'v_viser_diagram' && nameOfIteration !== 'v1_test' && nameOfIteration !== 'v_viser_search';
    }

    static generateMasterIterationData(nameOfIteration, masterIterationData, iterationDataArray, masterIterationQidArray, iterationQueryOcrText) {
        let { query_ocr_text } = masterIterationData;
        let masterIterationDataArray = masterIterationData.matches;
        if (Utility.shouldAddDataToMasterIterationArray(nameOfIteration)) {
            masterIterationDataArray = Utility.arrayUnion(masterIterationQidArray, masterIterationData.matches, iterationDataArray);
            query_ocr_text = Utility.getMasterIterationQueryOcrText(nameOfIteration, iterationQueryOcrText, masterIterationData);
        }
        masterIterationData.matches = masterIterationDataArray;
        masterIterationData.query_ocr_text = query_ocr_text;
    }

    static getMasterIterationQueryOcrText(nameOfIteration, queryOcrText, masterIterationData) {
        if (nameOfIteration === 'default') {
            return queryOcrText;
        }
        return masterIterationData.query_ocr_text;
    }

    static addLanguageFiltersToAttachment(attachment, videoLanguageFilters) {
        if (typeof videoLanguageFilters !== 'undefined') {
            attachment.languageFilters = videoLanguageFilters === 'en' ? [videoLanguageFilters] : [videoLanguageFilters, `${videoLanguageFilters}-en`];
        }
    }

    static isCacheDataPresentForMasterIteration(takeMasterIterationCachedData, masterIterationCacheQidArray) {
        return takeMasterIterationCachedData && masterIterationCacheQidArray.length > 0;
    }

    static isQuestionSourceWhatsapp(req) {
        return req.body.question === 'WHATSAPP';
    }

    static isDailyLimitExceeded(req, dailyCount) {
        return dailyCount && dailyCount >= 400 && !Utility.isQuestionSourceWhatsapp(req);
    }

    static convertoWebP(image) {
        if (image !== undefined && image !== null) {
            return image.replace(/\.(png|PNG|jpg|JPG|jpeg|JPEG)$/, '.webp');
        }
        return image;
    }

    static getTimeDiffInHours = (timestamp) => {
        const _time = moment(timestamp);
        const _now = moment(new Date());
        const diff_hours = moment.duration(_now.diff(_time)).asHours();
        return diff_hours;
    }

    static stripHtmlTagsByOcrText(ocr_text) {
        return ocr_text.replace(/<[^>]*>?/gm, '');
    }

    static getOtpDetails(phone) {
        const options = {
            method: 'GET',
            uri: `https://micro.internal.doubtnut.com/api/otp?phone=${phone}`,
        };
        return new Promise(((resolve, reject) => {
            request(options, (err, resp, body) => {
                if (err) {
                    console.log(err);
                    // reject(err);
                    resolve(null);
                } else {
                    resolve(body);
                }
            });
        }));
    }

    /**
     * @description { returns if the parameters to land on video page for exact match experiment controlled via backend}
     * @param {string} versionCode
     * @returns {Boolean}
     */
    static isExactMatchFlowHandledViaBackend(versionCode) {
        const minVersionCode = Data.exact_match_qa_flow_experiment_config.minVersionCodeExactMatchFlowByBackend;
        if (minVersionCode && versionCode >= minVersionCode) {
            return true;
        }
        return false;
    }

    static transformDetailsByExamToCacheDataObj(examWiseCategories) {
        const examWiseCategoryObj = examWiseCategories.reduce((acc, examCategoryDetails) => {
            const { exam } = examCategoryDetails;
            const data = _.pick(examCategoryDetails, ['category']);
            return {
                ...acc,
                [exam]: JSON.stringify([...((!_.isEmpty(acc[exam]) && JSON.parse(acc[exam]))|| []), data]),
            };
        }, {});
        return examWiseCategoryObj;
    }
};
