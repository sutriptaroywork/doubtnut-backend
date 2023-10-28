const _ = require('lodash');
const config = require('../../config/config');

const mysqlQuestionsMetaContainer = require('../mysql/questionsMeta');
const redisQuestionsMetaContainer = require('../redis/questionsMeta');
const redisUtility = require('../redis/utility.redis');

module.exports = class Question {
    static async getQuestionMetaWithMcText(question_id, db) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.redis.read);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }

                const heardingKey = `REDIS_KEY_PRE_CHECK_QUESTION:${question_id}_'META`; // create herading key as prefis_{hash}_{key}
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, heardingKey)) { // check for hearding key
                    return [];
                }

                await redisUtility.setCacheHerdingKeyNew(db.redis.write, heardingKey); // set hearding key
                question = await mysqlQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.mysql.read);
                if (question && question.length) {
                    redisQuestionsMetaContainer.setQuestionMetaWithMcText(question, db.redis.write);
                }
                redisUtility.removeCacheHerdingKeyNew(db.redis.write, heardingKey); // remove hearding key
                return question;
            }
            return mysqlQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.mysql.read);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getQuestionMetaWithMcTextWithLanguage(question_id, language, db) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionsMetaContainer.getQuestionMetaWithMcTextWithLanguage(question_id, language, db.redis.read);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }

                question = await mysqlQuestionsMetaContainer.getQuestionMetaWithMcTextWithLanguage(question_id, language, db.mysql.read);
                if (question && question.length) {
                    redisQuestionsMetaContainer.setQuestionMetaWithMcTextWithLanguage(question, language, db.redis.write);
                }
                return question;
            }
            return mysqlQuestionsMetaContainer.getQuestionMetaWithMcTextWithLanguage(question_id, language, db.mysql.read);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getQuestionWithMeta(question_id, db) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.redis.read);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }

                question = await mysqlQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.mysql.read);
                if (question && question.length) {
                    redisQuestionsMetaContainer.setQuestionMetaWithMcText(question, db.redis.write);
                }
                return question;
            }
            return mysqlQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.mysql.read);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getQuestionMeta(question_id, db) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.redis.read);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }

                question = await mysqlQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.mysql.read);
                if (question && question.length) {
                    redisQuestionsMetaContainer.setQuestionMetaWithMcText(question, db.redis.write);
                }
                return question;
            }
            return mysqlQuestionsMetaContainer.getQuestionMetaWithMcText(question_id, db.mysql.read);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
};
