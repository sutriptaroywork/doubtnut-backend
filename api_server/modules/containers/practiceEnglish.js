const _ = require('lodash');
const config = require('../../config/config');

const PracticeEnglishMySql = require('../mysql/practiceEnglish');
const PracticeEnglishRedis = require('../redis/practiceEnglish');

module.exports = class PracticeEnglish {
    static async getQuestionIdsList(db) {
        try {
            let questionsList;
            if (config.caching) {
                questionsList = await PracticeEnglishRedis.getQuestionIdsList(db.redis.read);
                if (!_.isEmpty(questionsList)) {
                    return questionsList.map((eachQid) => JSON.parse(eachQid));
                }
                questionsList = await PracticeEnglishMySql.getQuestionIdsList(db.mysql.read);
                if (questionsList.length > 10) {
                    PracticeEnglishRedis.setQuestionIdsList(db.redis.write, questionsList);
                }
                return questionsList;
            }
            questionsList = await PracticeEnglishMySql.getQuestionIdsList(questionsList, db.mysql.read);
            return questionsList;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getQuestionIdsListByDifficulty(db, difficulty) {
        try {
            let questionsList;
            if (config.caching) {
                questionsList = await PracticeEnglishRedis.getQuestionIdsListByDifficulty(db.redis.read, difficulty);
                if (!_.isEmpty(questionsList)) {
                    return questionsList.map((eachQid) => JSON.parse(eachQid));
                }
                questionsList = await PracticeEnglishMySql.getQuestionIdsListByDifficulty(db.mysql.read, difficulty);
                if (questionsList.length > 5) {
                    PracticeEnglishRedis.setQuestionIdsListByDifficulty(db.redis.write, questionsList, difficulty);
                }
                return questionsList;
            }
            questionsList = await PracticeEnglishMySql.getQuestionIdsListByDifficulty(db.mysql.read, difficulty);
            return questionsList;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getQuestionById(db, questionId) {
        try {
            let question;
            if (config.caching) {
                question = await PracticeEnglishRedis.getQuestionById(db.redis.read, questionId);
                if (!_.isEmpty(question)) {
                    return JSON.parse(question);
                }
                question = await PracticeEnglishMySql.getQuestionById(db.mysql.read, questionId);
                if (question.length > 0) {
                    PracticeEnglishRedis.setQuestionById(db.redis.write, question);
                }
                return question;
            }
            question = await PracticeEnglishMySql.getQuestionById(db.mysql.read, questionId);
            return question;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getUserAssignedSet(db, studentId, redisKey = 'pe_assigned_set') {
        try {
            let assignedSetValue = await PracticeEnglishRedis.getUserKeyPE(db.redis.read, studentId, redisKey);
            if (!_.isEmpty(assignedSetValue)) {
                return JSON.parse(assignedSetValue);
            }
            const rand = Math.ceil(Math.random() * 50);
            assignedSetValue = rand;
            await PracticeEnglishRedis.setQuestionSet(db.redis.read, studentId, redisKey, assignedSetValue);
            return assignedSetValue;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getNextQuestions(db, assignedSetValue, offset) {
        try {
            const redisKey = `PracticeEnglish:QUESTIONS_SET:${assignedSetValue}`;

            let questionsList;
            if (config.caching) {
                questionsList = await PracticeEnglishRedis.getNextQuestionFromSet(db.redis.read, redisKey, offset, 4);
                if (!_.isEmpty(questionsList)) {
                    return questionsList.map((eachQid) => JSON.parse(eachQid));
                }
            }
            return [];
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
