// Created to resolve conflicts of container/question with ../utility only
// for caching questions.

const _ = require('lodash');
const config = require('../../config/config');

const mysqlQuestionContainer = require('../mysql/question');
const redisQuestionContainer = require('../redis/question');

module.exports = class {
    static async getByQuestionId(question_id, db) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionContainer.getByQuestionId(question_id, db.redis.read);
                if (!_.isNull(question)) {
                    // console.log('exist');
                    return JSON.parse(question);
                }
            }
            question = await mysqlQuestionContainer.getByQuestionId(question_id, db.mysql.read);
            return question;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }
};
