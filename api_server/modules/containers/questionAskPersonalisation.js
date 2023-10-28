const _ = require('lodash');
const mysql = require('../mysql/question');
const redis = require('../redis/question');

const questionsLimit = 20;
const Data = require('../../data/data');

module.exports = class {
    static async getUserRecentlyAskedQuestionsData(db, config, student_id) {
        try {
            let questions;
            if (config.caching) {
                questions = await redis.getUserRecentAskedQuestions(db.redis.read, student_id);
                if (!_.isNull(questions) && questions.length > 0) {
                    return questions;
                }
                questions = [];
                // TODO : NEED SOME ADVANCE MECH - TO DO REAL TIME TOPIC DETECTION
                questions = await mysql.getUserRecentAskedQuestions(db.mysql.read, student_id, questionsLimit);
                if (questions && questions.length > 0) {
                    await redis.setUserRecentAskedQuestions(db.redis.read, student_id, _.pick(questions, Data.questionAskPersonalisation.propertiesToStore));
                    return questions;
                }
                return [];
            }
            questions = await mysql.getUserRecentAskedQuestions(db.mysql.read, student_id, questionsLimit);
            if (questions && questions.length > 0) {
                return questions;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getUserRecentlyVideosWatchedData(db, config, student_id) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getUserRecentVideosWatched(db.redis.read, student_id);
                if (!_.isNull(data) && data.length > 0) {
                    return data.map((x) => JSON.parse(x));
                }
                data = [];
                data = await mysql.getUserRecentWatchedVideos(db.mysql.read, student_id, questionsLimit);
                if (data && data.length > 0) {
                    await redis.setUserRecentVideosWatched(db.redis.read, student_id, data);
                    return data;
                }
                return [];
            }
            data = await mysql.getUserRecentWatchedVideos(db.mysql.read, student_id, questionsLimit);
            if (data && data.length > 0) {
                return data;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }
};
