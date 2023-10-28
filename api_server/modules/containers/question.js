/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const config = require('../../config/config');
const moduleAnswer = require('../answer');
const moduleQuestion = require('../question');
const moduleQuestionsMeta = require('../questionsMeta');
const mysqlQuestionContainer = require('../mysql/question');
const redisQuestionContainer = require('../redis/question');
const redisAnswer = require('../redis/answer');
const redisAnswerContainer = require('./answer');
const UtilityRedis = require('../redis/utility.redis');
const Utility = require('../utility');
const mysqlAnswer = require('../mysql/answer');
const libraryMysql = require('../mysql/library');
const logger = require('../../config/winston').winstonLogger;
const APIError = require('../../server/helpers/APIError');
const staticData = require('../../data/data');
const UtilityFlagr = require('../Utility.flagr');
const Keys = require('../redis/keys');
const randomNumberGenerator = require('../randomNumberGenerator');
const redisUtility = require('../redis/utility.redis');
const QuestionModule = require('../question');
const LiveClassMySql = require('../mysql/liveclass');
const redisCourse = require('../redis/coursev2');
const mysqlCourse = require('../mysql/coursev2');

module.exports = class Question {
    static async getDistinctClassList(db) {
        try {
            let stdClass;
            if (config.caching) {
                stdClass = await redisQuestionContainer.getDistinctClass(db.redis.read);
                if (!_.isNull(stdClass)) {
                    return JSON.parse(stdClass);
                }
                stdClass = await mysqlQuestionContainer.getDistinctClass(db.mysql.read);
                if (stdClass && stdClass.length > 0) {
                    // set in redis
                    await redisQuestionContainer.setDistinctClass(db.redis.write, stdClass);
                    return stdClass;
                }
                return [];
            }
            stdClass = await mysqlQuestionContainer.getDistinctClass(db.mysql.read);
            if (stdClass && stdClass.length > 0) {
                // mysql class
                return stdClass;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctSubjectList(db, studentClass) {
        try {
            let subject;
            if (config.caching) {
                subject = await redisQuestionContainer.getDistinctSubject(db.redis.read, studentClass);
                if (!_.isNull(subject)) {
                    return JSON.parse(subject);
                }
                subject = await mysqlQuestionContainer.getDistinctSubject(db.mysql.read, studentClass);
                if (subject && subject.length > 0) {
                    // set in redis
                    await redisQuestionContainer.setDistinctSubject(db.redis.write, subject, studentClass);
                    return subject;
                }
                return [];
            }
            subject = await mysqlQuestionContainer.getDistinctSubject(db.mysql.read, studentClass);
            if (subject && subject.length > 0) {
                // mysql subject
                return subject;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctChapterList(db, studentClass, stuSubject, bookName, limit, page) {
        try {
            let chapter;
            if (config.caching) {
                chapter = await redisQuestionContainer.getDistinctChapter(db.redis.read, studentClass, stuSubject, bookName, limit, page);
                if (!_.isNull(chapter)) {
                    return JSON.parse(chapter);
                }
                chapter = await mysqlQuestionContainer.getDistinctChapter(db.mysql.read, studentClass, stuSubject, bookName, limit, page);
                if (chapter && chapter.length > 0) {
                    // set in redis
                    await redisQuestionContainer.setDistinctChapter(db.redis.write, chapter, studentClass, stuSubject, bookName, limit, page);
                    return chapter;
                }
                return [];
            }
            chapter = await mysqlQuestionContainer.getDistinctChapter(db.mysql.read, studentClass, stuSubject, bookName, limit, page);
            if (chapter && chapter.length > 0) {
                // mysql chapter
                return chapter;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctBookList(db, studentClass, stuSubject, limit, page) {
        try {
            let book;
            if (config.caching) {
                book = await redisQuestionContainer.getDistinctBook(db.redis.read, studentClass, stuSubject, limit, page);
                if (!_.isNull(book)) {
                    return JSON.parse(book);
                }
                book = await mysqlQuestionContainer.getDistinctBook(db.mysql.read, studentClass, stuSubject, limit, page);
                if (book && book.length > 0) {
                    // set in redis
                    await redisQuestionContainer.setDistinctBook(db.redis.write, book, studentClass, stuSubject, limit, page);
                    return book;
                }
                return [];
            }
            book = await mysqlQuestionContainer.getDistinctBook(db.mysql.read, studentClass, stuSubject, limit, page);
            if (book && book.length > 0) {
                // mysql book
                return book;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getStockWordList(db) {
        const stockWordList = await redisQuestionContainer.getStockWordList(db.redis.read);
        if (!_.isNull(stockWordList)) {
            return JSON.parse(stockWordList);
        }
        return [];
    }

    static async getByQuestionId(question_id, db) {
        // first try to get from redis
        // first try to get from redis
        // Do async job
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionContainer.getByQuestionId(question_id, db.redis.read);
                // console.log("redis question")
                // console.log(question)
                if (!_.isNull(question)) {
                    // console.log('exist');
                    return JSON.parse(question);
                }
                // question = await mysqlQuestionContainer.getByQuestionId(question_id, db.mysql.read);
                // if (question && question.length > 0) {
                //     // console.log('setting question in redis');
                //     // set in redis
                //     await redisQuestionContainer.setByQuestionId(question, db.redis.write);
                // }
                // return question;
            }
            // get from mysql
            question = await mysqlQuestionContainer.getByQuestionId(question_id, db.mysql.read);
            return question;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getByQuestionIdForCatalogQuestions(db, questionId) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionContainer.getByQuestionIdForCatalogQuestions(db.redis.read, questionId);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }
                question = await mysqlQuestionContainer.getByQuestionId(questionId, db.mysql.read);
                if (question && question.length > 0) {
                    redisQuestionContainer.setByQuestionIdForCatalogQuestions(db.redis.write, questionId, question);
                    return question;
                }
                return [];
            }
            question = await mysqlQuestionContainer.getByQuestionId(questionId, db.mysql.read);
            if (question && question.length > 0) {
                return question;
            }
            return [];
        } catch (e) {
            console.error(e);
            throw Error(e);
        }
    }

    static async getBookMetaData(db, questionId) {
        try {
            let doubt;
            if (config.caching) {
                doubt = await redisQuestionContainer.getBookMetaData(db.redis.read, questionId);
                if (!_.isNull(doubt)) {
                    return doubt;
                }
                doubt = await moduleQuestion.getBookMetaData(questionId, db.mysql.read);
                if (doubt && doubt.length > 0) {
                    redisQuestionContainer.setBookMetaData(db.redis.write, questionId, doubt);
                }
                return doubt;
            }
            doubt = await moduleQuestion.getBookMetaData(questionId, db.mysql.read);
            return doubt;
        } catch (e) {
            console.error(e);
            throw Error(e);
        }
    }

    static async getChapterDataByQid(db, questionId) {
        try {
            let chapterData;
            if (config.caching) {
                chapterData = await redisQuestionContainer.getChapterDataByQid(db.redis.read, questionId);
                if (!_.isNull(chapterData)) {
                    return JSON.parse(chapterData);
                }
                chapterData = await moduleAnswer.getChapterDataByQid(db.mysql.read, questionId);
                if (chapterData && chapterData.length > 0) {
                    redisQuestionContainer.setChapterDataByQid(db.redis.write, questionId, chapterData);
                }
                return chapterData;
            }
            chapterData = await moduleAnswer.getChapterDataByQid(db.mysql.read, questionId);
            return chapterData;
        } catch (e) {
            console.error(e);
            throw Error(e);
        }
    }

    static async getQuestionPersonalisationData(db, questionId) {
        try {
            let personalisationData;
            if (config.caching) {
                personalisationData = await redisQuestionContainer.getQuestionPersonalisationData(db.redis.read, questionId);
                if (!_.isNull(personalisationData)) {
                    return JSON.parse(personalisationData);
                }
                personalisationData = await moduleQuestionsMeta.getQuestionMeta(db.mysql.read, questionId);
                if (personalisationData && personalisationData.length > 0) {
                    redisQuestionContainer.setQuestionPersonalisationData(db.redis.write, questionId, personalisationData);
                }
                return personalisationData;
            }
            personalisationData = await moduleQuestionsMeta.getQuestionMeta(db.mysql.read, questionId);
            return personalisationData;
        } catch (e) {
            console.error(e);
            throw Error(e);
        }
    }

    static async getByQuestionIdWithUrl(question_id, db) {
        // first try to get from redis
        // first try to get from redis
        // Do async job
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionContainer.getByQuestionIdWithUrl(question_id, db.redis.read);
                console.log('redis question');
                console.log(question);
                if (!_.isNull(question)) {
                    console.log('exist');
                    return JSON.parse(question);
                }
                // get from mysql
                console.log('not exist');
                question = await mysqlQuestionContainer.getByQuestionIdWithUrl(question_id, db.mysql.read);
                console.log('mysql question');
                console.log(question);
                if (question && question.length > 0) {
                    console.log('setting question in redis');
                    console.log(question);
                    // set in redis
                    await redisQuestionContainer.setByQuestionIdWithUrl(question, db.redis.write);
                    return question;
                }
                return [];
            }
            question = await mysqlQuestionContainer.getByQuestionId(question_id, db.mysql.read);
            if (question && question.length > 0) {
                // set in redis
                return question;
            }
            return [];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getPreviousHistory(student_id, db) {
        // first try to get from redis
        // Do async job
        try {
            let answer;
            if (config.caching) {
                answer = await redisQuestionContainer.getPreviousHistory(student_id, db.redis.read);
                // console.log("redis answer")
                // console.log(answer)
                if (!_.isNull(answer)) {
                    console.log('exist question_id caching');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exists --');
                answer = await mysqlQuestionContainer.getPreviousHistory(student_id, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    await redisQuestionContainer.setPreviousHistory(student_id, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlQuestionContainer.getPreviousHistory(student_id, db.mysql.read);
            // console.log("mysql answer")
            // console.log(answer)
            return answer;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getFilteredQuestions(params, db) {
        // Do async job
        try {
            let questions;
            if (config.caching) {
                questions = await redisQuestionContainer.getFilteredQuestions(params, db.redis.read);
                if (!_.isNull(questions)) {
                    console.log('exist');
                    console.log(questions);
                    return JSON.parse(questions);
                }
                console.log('not1');
                // get from mysql
                questions = await mysqlQuestionContainer.getFilteredQuestions(params, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setFilteredQuestions(params, questions, db.redis.write);
                return questions;
            }
            questions = await mysqlQuestionContainer.getFilteredQuestions(params, db.mysql.read);
            return questions;
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getTotalViews(questionId, db) {
        try {
            // let v_count;
            // if (config.caching) {
            // v_count = await redisQuestionContainer.getQuestionVideoViews(question_id, db.redis.read);
            //     if (!_.isNull(v_count)) {
            //         console.log('exist');
            //         console.log(v_count);
            //         return JSON.parse(v_count);
            //     }
            //     // console.log("doesn't exist")

            //     // const newPromise = [];
            //     // newPromise.push(mysqlQuestionContainer.getQuestionVideoViews(question_id, db.mysql.read));
            //     // newPromise.push(mysqlQuestionContainer.getQuestionVideoViewsWeb(question_id, db.mysql.read));

            //     // const res = await Promise.all(newPromise);
            //     const res = [[{ total_count: 27652 }], [{ total_web_views: 607 }]];
            //     let totViews = res[0][0].total_count;
            //     totViews += res[1][0].total_web_views;

            //     // console.log('total views')
            //     // console.log(totViews)

            //     const viewData = [];
            //     viewData.push({ total_count: totViews });

            //     viewData[0].total_count = (viewData[0].total_count == 0 ? 1 * 100 + Math.ceil((Math.random() * 100) + 1) : viewData[0].total_count * 100 + Math.ceil((Math.random() * 100) + 1));
            //     await redisQuestionContainer.setQuestionVideoViews(question_id, viewData, db.redis.write);
            //     // console.log('viewData')
            //     // console.log(viewData)
            //     return viewData;
            // }
            // const newPromise = [];
            // newPromise.push(mysqlQuestionContainer.getQuestionVideoViews(question_id, db.mysql.read));
            // newPromise.push(mysqlQuestionContainer.getQuestionVideoViewsWeb(question_id, db.mysql.read));
            const viewData = [];
            viewData.push({ total_count: randomNumberGenerator.getTotalViewsNew(questionId) });

            // // const res = await Promise.all(newPromise);
            // const res = [[{ total_count: 27652 }], [{ total_web_views: 607 }]];
            // let totViews = res[0][0].total_count;
            // totViews += res[1][0].total_web_views;

            // const viewData = [];
            // viewData.push({ total_count: totViews });
            // console.log('viewData');
            // console.log(viewData);
            return viewData;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getTotalViewsWeb(questionId, db) {
        try {
            return [[{ total_count: randomNumberGenerator.getTotalViewsWebNew(questionId) }], [{ total_likes: randomNumberGenerator.getLikeDislikeStatsNew(questionId)[0] }]];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getTotalViewsNew(questionId, db) {
        try {
            const statsToSet = {};
            statsToSet.likes = randomNumberGenerator.getLikeDislikeStatsNew(questionId)[0];
            statsToSet.dislikes = randomNumberGenerator.getLikeDislikeStatsNew(questionId)[1];
            statsToSet.share = randomNumberGenerator.getWhatsappShareStatsNew(questionId);
            statsToSet.views = randomNumberGenerator.getTotalViewsWebNew(questionId);
            return [statsToSet];
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getMcText(mc_id, db) {
        try {
            let mcRes;
            if (config.caching) {
                mcRes = await redisQuestionContainer.getMcQuestions(mc_id, db.redis.read);
                if (!_.isNull(mcRes)) {
                    return JSON.parse(mcRes);
                }
                mcRes = await mysqlQuestionContainer.getMcQuestions(mc_id, db.mysql.read);
                await redisQuestionContainer.setMcQuestions(mc_id, mcRes, db.redis.write);
                return mcRes;
            }
            mcRes = await mysqlQuestionContainer.getMcQuestions(mc_id, db.mysql.read);
            return mcRes;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTotalQuestionsCount(params, db) {
        // Do async job
        try {
            let count;
            if (config.caching) {
                count = await redisQuestionContainer.getTotalQuestionsCount(params, db.redis.read);
                if (!_.isNull(count)) {
                    console.log('exist');
                    console.log(count);
                    return JSON.parse(count);
                }
                console.log('not2');
                // get from mysql
                count = await mysqlQuestionContainer.getTotalQuestionsCount(params, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTotalQuestionsCount(params, count, db.redis.write);
                return count;
            }
            count = await mysqlQuestionContainer.getTotalQuestionsCount(params, db.mysql.read);
            return count;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getPackagesByQid(qid, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getPackagesByQid(qid, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getPackagesByQid(qid, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setPackagesByQid(qid, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getPackagesByQid(qid, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getClassandChapterFromMeta(qid, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getClassandChapterFromMeta(qid, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getClassandChapterFromMeta(qid, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setClassandChapterFromMeta(qid, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getClassandChapterFromMeta(qid, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getClassByQid(qid, table_name, db) {
        try {
            let data;
            if (config.caching) {
                console.log('in container class function');
                data = await redisQuestionContainer.getClassByQid(qid, table_name, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getClassByQid(qid, table_name, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setClassByQid(qid, table_name, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getClassByQid(qid, table_name, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getMicroconceptsBySubtopics(sclass, chapter, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getMicroconceptsBySubtopics(sclass, chapter, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getMicroconceptsBySubtopics(sclass, chapter, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setMicroconceptsBySubtopics(sclass, chapter, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getMicroconceptsBySubtopics(sclass, chapter, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistChapters(course, sclass, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getDistChapters(course, sclass, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getDistChapters(course, sclass, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistChapters(course, sclass, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getDistChapters(course, sclass, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTrendingVideos(student_class, limit, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getTrendingVideos(student_class, limit, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getTrendingVideos(student_class, limit, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTrendingVideos(student_class, limit, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getTrendingVideos(student_class, limit, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTrendingVideoData(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getTrendingVideoDataType(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getTrendingVideoDataType(base_url, gradient, type, description, page, capsule, student_class, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTrendingVideoDataType(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getTrendingVideoDataType(base_url, gradient, type, description, page, capsule, student_class, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTrendingVideoDataWithTextSolutions(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getTrendingVideoDataTypeWithTextSolutions(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getTrendingVideoDataTypeWithTextSolutions(base_url, gradient, type, description, page, capsule, student_class, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTrendingVideoDataTypeWithTextSolutions(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getTrendingVideoDataTypeWithTextSolutions(base_url, gradient, type, description, page, capsule, student_class, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getLatestFromDoubtnutData(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            console.log('in container');
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getLatestFromDoubtnutDataType(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getLatestFromDoubtnutDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setLatestFromDoubtnutDataType(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getLatestFromDoubtnutDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getLatestFromDoubtnutDataWithTextSolutions(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            console.log('in container');
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getLatestFromDoubtnutDataTypeWithTextSolutions(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getLatestFromDoubtnutDataTypeWithTextSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setLatestFromDoubtnutDataTypeWithTextSolutions(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getLatestFromDoubtnutDataTypeWithTextSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getLibraryVideos(type1, base_url, gradient, type, description, page, capsule, student_class, student_id, playlist_id, language, limit, duration, db, defaultCache = true) {
        try {
            console.log('in container');
            let data;
            const redisKey = `REDIS_KEY_PRE_CHECK_HOMEPAGE_WITH_TEXT_${type1}_${student_class}_${playlist_id}`;
            if (config.caching) {
                if (defaultCache) {
                    data = await redisQuestionContainer.getLibraryVideos(type1, student_class, playlist_id, db.redis.read);
                    if (!_.isNull(data)) {
                        return JSON.parse(data);
                    }
                } else {
                    data = await redisQuestionContainer.getVikramSinghCarousel(type1, student_class, playlist_id, db.redis.read);
                    if (!_.isNull(data)) {
                        return JSON.parse(data);
                    }
                }
                // get from mysql
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, redisKey)) {
                    return [];
                }
                redisUtility.setCacheHerdingKeyNew(db.redis.write, redisKey);
                const temp = await libraryMysql.getResource(db.mysql.read, student_class, student_id, playlist_id);
                let str = _.replace(temp[0].resource_path, /xxlanxx/g, language);
                str = _.replace(str, /xxclsxx/g, student_class);
                str = _.replace(str, /xxsidxx/g, student_id);
                str = _.replace(str, /xxplaylistxx/g, playlist_id);
                const sql = `${str} limit ${limit}`;
                data = await db.mysql.read.query(sql, [temp[0].id]);
                redisUtility.removeCacheHerdingKeyNew(db.redis.write, redisKey);
                // set in redis
                if (defaultCache) {
                    await redisQuestionContainer.setLibraryVideos(type1, student_class, playlist_id, data, db.redis.write);
                } else {
                    await redisQuestionContainer.setVikramSinghCarousel(type1, student_class, playlist_id, data, db.redis.write);
                }
                return data;
            }
            const temp = await libraryMysql.getResource(db.mysql.read, student_class, student_id, playlist_id);
            let str = _.replace(temp[0].resource_path, /xxlanxx/g, language);
            str = _.replace(str, /xxclsxx/g, student_class);
            str = _.replace(str, /xxsidxx/g, student_id);
            str = _.replace(str, /xxplaylistxx/g, playlist_id);
            const sql = `${str} limit ${limit}`;
            data = await db.mysql.read.query(sql, [temp[0].id]);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTrickyQuestionsSolutions(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, weekNo, subjectUrl, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getTrickyQuestionsSolutions(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysqlQuestionContainer.getTrickyQuestionsSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, weekNo, subjectUrl, db.mysql.read);
                await redisQuestionContainer.setTrickyQuestionsSolutions(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getTrickyQuestionsSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, weekNo, subjectUrl, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getVLSVideos(student_class, limit, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getVLSVideos(student_class, limit, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getVLSVideos(student_class, limit, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setVLSVideos(student_class, limit, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getVLSVideos(student_class, limit, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getRecommendedQuestionsList(student_class, limit, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getRecommendedQuestionsList(student_class, limit, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getRecommendedQuestionsList(student_class, limit, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setRecommendedQuestionsList(student_class, limit, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getRecommendedQuestionsList(student_class, limit, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async viralVideos(limit, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.viralVideos(limit, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.viralVideos(limit, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setviralVideos(limit, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.viralVideos(limit, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getViralVideoByForFeed(limit, page, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getViralVideoByForFeed(limit, page, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getViralVideoByForFeed(limit, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setViralVideoByForFeed(limit, page, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getViralVideoByForFeed(limit, page, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTipsAndTricksData(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getTipsAndTricksDataType(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getTipsAndTricksDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTipsAndTricksDataType(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getTipsAndTricksDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTipsAndTricksDataWithTextSolutions(type1, base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getTipsAndTricksDataTypeWithTextSolutions(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getTipsAndTricksDataTypeWithTextSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTipsAndTricksDataTypeWithTextSolutions(type1, student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getTipsAndTricksDataTypeWithTextSolutions(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getGeneralKnowledgeData(base_url, gradient, type, description, page, capsule, student_class, limit, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getGeneralKnowledgeDataType(student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getGeneralKnowledgeDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setGeneralKnowledgeDataType(student_class, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getGeneralKnowledgeDataType(base_url, student_class, gradient, type, description, page, capsule, limit, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getCrashCourseData(type1, base_url, gradient, type, description, page, capsule, limit, student_class, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getCrashCourseDataType(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getCrashCourseDataType(base_url, gradient, type, description, page, capsule, limit, student_class, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setCrashCourseDataType(type1, data, student_class, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getCrashCourseDataType(base_url, gradient, type, description, page, capsule, limit, student_class, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getCrashCourseDataWithTextSolutions(type1, base_url, gradient, type, description, page, capsule, limit, student_class, duration, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getCrashCourseDataTypeWithTextSolutions(type1, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getCrashCourseDataTypeWithTextSolutions(base_url, gradient, type, description, page, capsule, limit, student_class, duration, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setCrashCourseDataTypeWithTextSolutions(type1, data, student_class, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getCrashCourseDataTypeWithTextSolutions(base_url, gradient, type, description, page, capsule, limit, student_class, duration, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctDate(db) {
        // Do async job
        try {
            let dateList;
            if (config.caching) {
                dateList = await redisQuestionContainer.getDistinctDate(db.redis.read);
                console.log(dateList);
                if (!_.isNull(dateList)) {
                    console.log('exist date list');
                    console.log(dateList);
                    return JSON.parse(dateList);
                }
                console.log('not1');
                // get from mysql
                dateList = await mysqlQuestionContainer.getDistinctDate(db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistinctDate(dateList, db.redis.write);
                return dateList;
            }
            dateList = await mysqlQuestionContainer.getDistinctDate(db.mysql.read);
            return dateList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctShift(dateVal, db) {
        // Do async job
        try {
            let shiftList;
            if (config.caching) {
                shiftList = await redisQuestionContainer.getDistinctShift(dateVal, db.redis.read);
                console.log(shiftList);
                if (!_.isNull(shiftList)) {
                    console.log('exist');
                    console.log(shiftList);
                    return JSON.parse(shiftList);
                }
                console.log('not1');
                // get from mysql
                shiftList = await mysqlQuestionContainer.getDistinctShift(dateVal, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistinctShift(dateVal, shiftList, db.redis.write);
                return shiftList;
            }
            shiftList = await mysqlQuestionContainer.getDistinctShift(dateVal, db.mysql.read);
            return shiftList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getJM2019Questions(dateVal, shiftVal, page, db) {
        // Do async job
        try {
            let questionList;
            if (config.caching) {
                questionList = await redisQuestionContainer.getQuestionsList(dateVal, shiftVal, page, db.redis.read);
                console.log(questionList);
                if (!_.isNull(questionList)) {
                    console.log('exist question list');
                    console.log(questionList);
                    return JSON.parse(questionList);
                }
                console.log('not1 qlist');
                // get from mysql
                questionList = await mysqlQuestionContainer.getQuestionsList(dateVal, shiftVal, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setQuestionsList(dateVal, shiftVal, questionList, page, db.redis.write);
                console.log('qlist set');
                return questionList;
            }
            questionList = await mysqlQuestionContainer.getQuestionsList(dateVal, shiftVal, page, db.mysql.read);
            return questionList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctDateAnswer(db) {
        // Do async job
        try {
            let dateList;
            if (config.caching) {
                dateList = await redisQuestionContainer.getDistinctDateAnswer(db.redis.read);
                console.log(dateList);
                if (!_.isNull(dateList)) {
                    console.log('exist date list');
                    console.log(dateList);
                    return JSON.parse(dateList);
                }
                console.log('not1');
                // get from mysql
                dateList = await mysqlQuestionContainer.getDistinctDateAnswer(db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistinctDateAnswer(dateList, db.redis.write);
                return dateList;
            }
            dateList = await mysqlQuestionContainer.getDistinctDateAnswer(db.mysql.read);
            return dateList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctShiftAnswer(dateVal, db) {
        // Do async job
        try {
            let shiftList;
            if (config.caching) {
                shiftList = await redisQuestionContainer.getDistinctShiftAnswer(dateVal, db.redis.read);
                console.log(shiftList);
                if (!_.isNull(shiftList)) {
                    console.log('exist');
                    console.log(shiftList);
                    return JSON.parse(shiftList);
                }
                console.log('not1');
                // get from mysql
                shiftList = await mysqlQuestionContainer.getDistinctShiftAnswer(dateVal, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistinctShiftAnswer(dateVal, shiftList, db.redis.write);
                return shiftList;
            }
            shiftList = await mysqlQuestionContainer.getDistinctShiftAnswer(dateVal, db.mysql.read);
            return shiftList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getJM2019QuestionsAnswer(dateVal, shiftVal, page, db) {
        // Do async job
        try {
            let questionList;
            if (config.caching) {
                questionList = await redisQuestionContainer.getQuestionsListAnswer(dateVal, shiftVal, page, db.redis.read);
                console.log(questionList);
                if (!_.isNull(questionList)) {
                    console.log('exist question list');
                    console.log(questionList);
                    return JSON.parse(questionList);
                }
                console.log('not1 qlist');
                // get from mysql
                questionList = await mysqlQuestionContainer.getQuestionsListAnswer(dateVal, shiftVal, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setQuestionsListAnswer(dateVal, shiftVal, questionList, page, db.redis.write);
                console.log('qlist set');
                return questionList;
            }
            questionList = await mysqlQuestionContainer.getQuestionsListAnswer(dateVal, shiftVal, page, db.mysql.read);
            return questionList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getJM2019QuestionsTotalCountAnswer(dateVal, shiftVal, db) {
        // Do async job
        try {
            let questionListCount;
            if (config.caching) {
                console.log('redis total check');
                questionListCount = await redisQuestionContainer.getTotalQuestionsCountRedisAnswer(dateVal, shiftVal, db.redis.read);
                console.log(questionListCount);
                if (!_.isNull(questionListCount)) {
                    console.log('exist total');
                    console.log(questionListCount);
                    return JSON.parse(questionListCount);
                }
                console.log('not1 total q');
                // get from mysql
                questionListCount = await mysqlQuestionContainer.getTotalQuestionsCountSqlAnswer(dateVal, shiftVal, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTotalQuestionsCountRedisAnswer(dateVal, shiftVal, questionListCount, db.redis.write);
                return questionListCount;
            }
            questionListCount = await mysqlQuestionContainer.getTotalQuestionsCountSqlAnswer(dateVal, shiftVal, db.mysql.read);
            return questionListCount;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async distMicroClasses(db) {
        // Do async job
        try {
            let distClasses;
            if (config.caching) {
                distClasses = await redisQuestionContainer.getDistMicroClasses(db.redis.read);
                if (!_.isNull(distClasses)) {
                    return JSON.parse(distClasses);
                }
                distClasses = await mysqlQuestionContainer.getDistMicroClasses(db.mysql.read);
                await redisQuestionContainer.setDistMicroClasses(distClasses, db.redis.write);
                return distClasses;
            }
            distClasses = await mysqlQuestionContainer.getDistMicroClasses(db.mysql.read);
            return distClasses;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async microQuestions(class_id, course, chapter, subtopic, page, db) {
        // Do async job
        try {
            let microQuestionsList;
            if (config.caching) {
                microQuestionsList = await redisQuestionContainer.getMicroQuestions(class_id, course, chapter, subtopic, page, db.redis.read);
                if (!_.isNull(microQuestionsList)) {
                    return JSON.parse(microQuestionsList);
                }
                microQuestionsList = await mysqlQuestionContainer.getMicroQuestionsMysql(class_id, course, chapter, subtopic, page, db.mysql.read);
                await redisQuestionContainer.setMicroQuestions(class_id, course, chapter, subtopic, page, microQuestionsList, db.redis.write);
                return microQuestionsList;
            }
            microQuestionsList = await mysqlQuestionContainer.getMicroQuestionsMysql(class_id, course, chapter, subtopic, page, db.mysql.read);
            return microQuestionsList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async microQuestionsCount(class_id, course, chapter, subtopic, db) {
        // Do async job
        try {
            let microQuestionsCount;
            if (config.caching) {
                microQuestionsCount = await redisQuestionContainer.getMicroQuestionsCount(class_id, course, chapter, subtopic, db.redis.read);
                if (!_.isNull(microQuestionsCount)) {
                    return JSON.parse(microQuestionsCount);
                }
                microQuestionsCount = await mysqlQuestionContainer.getMicroQuestionsCount(class_id, course, chapter, subtopic, db.mysql.read);
                await redisQuestionContainer.setMicroQuestionsCount(class_id, course, chapter, subtopic, microQuestionsCount, db.redis.write);
                return microQuestionsCount;
            }
            microQuestionsCount = await mysqlQuestionContainer.getMicroQuestionsCount(class_id, course, chapter, subtopic, db.mysql.read);
            return microQuestionsCount;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async distMicroCourses(class_id, db) {
        // Do async job
        try {
            let distCourses;
            if (config.caching) {
                distCourses = await redisQuestionContainer.getDistMicroCourses(class_id, db.redis.read);
                if (!_.isNull(distCourses)) {
                    return JSON.parse(distCourses);
                }
                distCourses = await mysqlQuestionContainer.getDistMicroCourses(class_id, db.mysql.read);
                await redisQuestionContainer.setDistMicroCourses(class_id, distCourses, db.redis.write);
                return distCourses;
            }
            distCourses = await mysqlQuestionContainer.getDistMicroCourses(class_id, db.mysql.read);
            return distCourses;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async distMicroChapters(class_id, course, db) {
        // Do async job
        try {
            let distChapters;
            if (config.caching) {
                distChapters = await redisQuestionContainer.getDistMicroChapters(class_id, course, db.redis.read);
                if (!_.isNull(distChapters)) {
                    return JSON.parse(distChapters);
                }
                distChapters = await mysqlQuestionContainer.getDistMicroChapters(class_id, course, db.mysql.read);
                await redisQuestionContainer.setDistMicroChapters(class_id, course, distChapters, db.redis.write);
                return distChapters;
            }
            distChapters = await mysqlQuestionContainer.getDistMicroChapters(class_id, course, db.mysql.read);
            return distChapters;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async distMicroSubtopics(class_id, course, chapter, db) {
        // Do async job
        try {
            let distSubtopics;
            if (config.caching) {
                distSubtopics = await redisQuestionContainer.getDistMicroSubtopics(class_id, course, chapter, db.redis.read);
                if (!_.isNull(distSubtopics)) {
                    return JSON.parse(distSubtopics);
                }
                distSubtopics = await mysqlQuestionContainer.getDistMicroSubtopics(class_id, course, chapter, db.mysql.read);
                await redisQuestionContainer.setDistMicroSubtopics(class_id, course, chapter, distSubtopics, db.redis.write);
                return distSubtopics;
            }
            distSubtopics = await mysqlQuestionContainer.getDistMicroSubtopics(class_id, course, chapter, db.mysql.read);
            return distSubtopics;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getViralVideoByForFeedLocalisation(version, limit, page, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getViralVideoByForFeedLocalisation(version, limit, page, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getViralVideoByForFeedLocalisation(limit, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setViralVideoByForFeedLocalisation(version, limit, page, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getViralVideoByForFeedLocalisation(limit, page, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getViralVideoByForFeedLocalisationV4(version, limit, page, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getViralVideoByForFeedLocalisationV4(version, limit, page, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getViralVideoByForFeedLocalisation(limit, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setViralVideoByForFeedLocalisationV4(version, limit, page, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getViralVideoByForFeedLocalisation(limit, page, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getViralVideoWeb(limit, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getViralVideoWeb(limit, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysqlQuestionContainer.getViralVideoWeb(limit, db.mysql.read);
                await redisQuestionContainer.setViralVideoWeb(limit, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getViralVideoWeb(limit, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getMatchedWeb(qid, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getQuestionByIdWebLocalised(qid, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                data = await mysqlQuestionContainer.getQuestionByIdWebLocalised(qid, db.mysql.read);

                await redisQuestionContainer.setQuestionByIdWebLocalised(qid, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getQuestionByIdWebLocalised(qid, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getFilteredQuestionsLocalised(locale_val, version, params, db) {
        // Do async job
        try {
            let questions;
            if (config.caching) {
                questions = await redisQuestionContainer.getFilteredQuestionsLocalised(locale_val, version, params, db.redis.read);
                if (!_.isNull(questions)) {
                    return JSON.parse(questions);
                }
                questions = await mysqlQuestionContainer.getFilteredQuestionsLocalised(locale_val, params, db.mysql.read);
                await redisQuestionContainer.setFilteredQuestionsLocalised(locale_val, version, params, questions, db.redis.write);
                return questions;
            }
            questions = await mysqlQuestionContainer.getFilteredQuestionsLocalised(locale_val, params, db.mysql.read);
            return questions;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTotalQuestionsCountLocalised(locale_val, version, params, db) {
        try {
            let count;
            if (config.caching) {
                count = await redisQuestionContainer.getTotalQuestionsCountLocalised(locale_val, version, params, db.redis.read);
                if (!_.isNull(count)) {
                    return JSON.parse(count);
                }
                count = await mysqlQuestionContainer.getTotalQuestionsCountLocalised(locale_val, params, db.mysql.read);
                await redisQuestionContainer.setTotalQuestionsCountLocalised(locale_val, version, params, count, db.redis.write);
                return count;
            }
            count = await mysqlQuestionContainer.getTotalQuestionsCountLocalised(locale_val, params, db.mysql.read);
            return count;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getByQuestionIdLocalised(locale_val, version, question_id, db) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionContainer.getByQuestionIdLocalised(locale_val, version, question_id, db.redis.read);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }
                question = await mysqlQuestionContainer.getByQuestionIdLocalised(locale_val, question_id, db.mysql.read);
                if (question && question.length > 0) {
                    await redisQuestionContainer.setByQuestionIdLocalised(locale_val, version, question, db.redis.write);
                    return question;
                }
                // reject("Invalid question id")
                return 'Invalid question id';
            }
            question = await mysqlQuestionContainer.getByQuestionIdLocalised(locale_val, question_id, db.mysql.read);
            if (question && question.length > 0) {
                return question;
            }
            // reject("Invalid question id")
            return 'Invalid question id';
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getMicroconceptsBySubtopicsLocalised(locale_val, version, sclass, chapter, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getMicroconceptsBySubtopicsLocalised(locale_val, version, sclass, chapter, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                data = await mysqlQuestionContainer.getMicroconceptsBySubtopicsLocalised(locale_val, sclass, chapter, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setMicroconceptsBySubtopicsLocalised(locale_val, version, sclass, chapter, data, db.redis.write);
                return data;
            }
            data = await mysqlQuestionContainer.getMicroconceptsBySubtopicsLocalised(locale_val, sclass, chapter, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async distMicroClassesV3(db) {
        // Do async job
        try {
            let distClasses;
            if (config.caching) {
                distClasses = await redisQuestionContainer.getDistMicroClassesV3(db.redis.read);
                if (!_.isNull(distClasses)) {
                    return JSON.parse(distClasses);
                }
                distClasses = await mysqlQuestionContainer.getDistMicroClassesV3(db.mysql.read);
                await redisQuestionContainer.setDistMicroClassesV3(distClasses, db.redis.write);
                return distClasses;
            }
            distClasses = await mysqlQuestionContainer.getDistMicroClassesV3(db.mysql.read);
            return distClasses;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async microQuestionsV3(class_id, course, chapter, subtopic, page, db) {
        // Do async job
        try {
            let microQuestionsList;
            if (config.caching) {
                microQuestionsList = await redisQuestionContainer.getMicroQuestionsV3(class_id, course, chapter, subtopic, page, db.redis.read);
                if (!_.isNull(microQuestionsList)) {
                    return JSON.parse(microQuestionsList);
                }
                microQuestionsList = await mysqlQuestionContainer.getMicroQuestionsMysqlV3(class_id, course, chapter, subtopic, page, db.mysql.read);
                await redisQuestionContainer.setMicroQuestionsV3(class_id, course, chapter, subtopic, page, microQuestionsList, db.redis.write);
                return microQuestionsList;
            }
            microQuestionsList = await mysqlQuestionContainer.getMicroQuestionsMysqlV3(class_id, course, chapter, subtopic, page, db.mysql.read);
            return microQuestionsList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async microQuestionsCountV3(class_id, course, chapter, subtopic, db) {
        // Do async job
        try {
            let microQuestionsCount;
            if (config.caching) {
                microQuestionsCount = await redisQuestionContainer.getMicroQuestionsCountV3(class_id, course, chapter, subtopic, db.redis.read);
                if (!_.isNull(microQuestionsCount)) {
                    return JSON.parse(microQuestionsCount);
                }
                microQuestionsCount = await mysqlQuestionContainer.getMicroQuestionsCountV3(class_id, course, chapter, subtopic, db.mysql.read);
                await redisQuestionContainer.setMicroQuestionsCountV3(class_id, course, chapter, subtopic, microQuestionsCount, db.redis.write);
                return microQuestionsCount;
            }
            microQuestionsCount = await mysqlQuestionContainer.getMicroQuestionsCountV3(class_id, course, chapter, subtopic, db.mysql.read);
            return microQuestionsCount;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async distMicroCoursesV3(class_id, db) {
        // Do async job
        try {
            let distCourses;
            if (config.caching) {
                distCourses = await redisQuestionContainer.getDistMicroCourses(class_id, db.redis.read);
                if (!_.isNull(distCourses)) {
                    return JSON.parse(distCourses);
                }
                distCourses = await mysqlQuestionContainer.getDistMicroCoursesV3(class_id, db.mysql.read);
                await redisQuestionContainer.setDistMicroCourses(class_id, distCourses, db.redis.write);
                return distCourses;
            }
            distCourses = await mysqlQuestionContainer.getDistMicroCoursesV3(class_id, db.mysql.read);
            return distCourses;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctDateNew(db) {
        try {
            let dateList;
            if (config.caching) {
                dateList = await redisQuestionContainer.getDistinctDateNew(db.redis.read);
                if (!_.isNull(dateList)) {
                    return JSON.parse(dateList);
                }
                dateList = await mysqlQuestionContainer.getDistinctDateNew(db.mysql.read);
                await redisQuestionContainer.setDistinctDateNew(dateList, db.redis.write);
                return dateList;
            }
            dateList = await mysqlQuestionContainer.getDistinctDateNew(db.mysql.read);
            return dateList;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctShiftNew(dateVal, db) {
        // Do async job
        try {
            // let shiftList;
            // if (config.caching) {
            //   shiftList = await redisQuestionContainer.getDistinctShiftNew(dateVal, db.redis.read)
            //   console.log(shiftList);
            //   if (!_.isNull(shiftList)) {
            //     console.log("exist")
            //     console.log(shiftList)
            //     return resolve(JSON.parse(shiftList)
            //   } else {
            //     console.log("not1")
            //     //get from mysql
            //     shiftList = await mysqlQuestionContainer.getDistinctShiftNew(dateVal, db.mysql.read)
            //       //set in redis
            //     await redisQuestionContainer.setDistinctShiftNew(dateVal, shiftList, db.redis.write)
            //     return shiftList
            //   }
            // }else{
            const shiftList = await mysqlQuestionContainer.getDistinctShiftNew(dateVal, db.mysql.read);
            return shiftList;
            // }
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    static async getJM2019QuestionsNew(dateVal, shiftVal, page, db) {
        // Do async job
        try {
            let questionList;
            if (config.caching) {
                questionList = await redisQuestionContainer.getQuestionsListNew(dateVal, shiftVal, page, db.redis.read);
                console.log(questionList);
                if (!_.isNull(questionList)) {
                    console.log('exist question list');
                    console.log(questionList);
                    return JSON.parse(questionList);
                }
                console.log('not1 qlist');
                // get from mysql
                questionList = await mysqlQuestionContainer.getQuestionsListNew(dateVal, shiftVal, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setQuestionsListNew(dateVal, shiftVal, questionList, page, db.redis.write);
                console.log('qlist set');
                return questionList;
            }
            questionList = await mysqlQuestionContainer.getQuestionsListNew(dateVal, shiftVal, page, db.mysql.read);
            return questionList;
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    static async getJM2019QuestionsTotalCountNew(dateVal, shiftVal, db) {
        // Do async job
        try {
            let questionListCount;
            if (config.caching) {
                questionListCount = await redisQuestionContainer.getTotalQuestionsCountRedisNew(dateVal, shiftVal, db.redis.read);
                if (!_.isNull(questionListCount)) {
                    return JSON.parse(questionListCount);
                }
                questionListCount = await mysqlQuestionContainer.getTotalQuestionsCountSqlNew(dateVal, shiftVal, db.mysql.read);
                await redisQuestionContainer.setTotalQuestionsCountRedisNew(dateVal, shiftVal, questionListCount, db.redis.write);
                return questionListCount;
            }
            questionListCount = await mysqlQuestionContainer.getTotalQuestionsCountSqlNew(dateVal, shiftVal, db.mysql.read);
            return questionListCount;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getDistinctDateAnswerNew(db) {
        // Do async job
        try {
            let dateList;
            if (config.caching) {
                dateList = await redisQuestionContainer.getDistinctDateAnswer(db.redis.read);
                console.log(dateList);
                if (!_.isNull(dateList)) {
                    console.log('exist date list');
                    console.log(dateList);
                    return JSON.parse(dateList);
                }
                console.log('not1');
                // get from mysql
                dateList = await mysqlQuestionContainer.getDistinctDateAnswerNew(db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistinctDateAnswer(dateList, db.redis.write);
                return dateList;
            }
            dateList = await mysqlQuestionContainer.getDistinctDateAnswerNew(db.mysql.read);
            return dateList;
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    static async getDistinctShiftAnswerNew(dateVal, db) {
        // Do async job
        try {
            let shiftList;
            if (config.caching) {
                shiftList = await redisQuestionContainer.getDistinctShiftAnswerNew(dateVal, db.redis.read);
                console.log(shiftList);
                if (!_.isNull(shiftList)) {
                    console.log('exist');
                    console.log(shiftList);
                    return JSON.parse(shiftList);
                }
                console.log('not1');
                // get from mysql
                shiftList = await mysqlQuestionContainer.getDistinctShiftAnswerNew(dateVal, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setDistinctShiftAnswerNew(dateVal, shiftList, db.redis.write);
                return shiftList;
            }
            shiftList = await mysqlQuestionContainer.getDistinctShiftAnswerNew(dateVal, db.mysql.read);
            return shiftList;
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    static async getJM2019QuestionsAnswerNew(dateVal, shiftVal, page, db) {
        // Do async job
        try {
            let questionList;
            if (config.caching) {
                questionList = await redisQuestionContainer.getQuestionsListAnswerNew(dateVal, shiftVal, page, db.redis.read);
                console.log(questionList);
                if (!_.isNull(questionList)) {
                    console.log('exist question list');
                    console.log(questionList);
                    return JSON.parse(questionList);
                }
                console.log('not1 qlist');
                // get from mysql
                questionList = await mysqlQuestionContainer.getQuestionsListAnswerNew(dateVal, shiftVal, page, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setQuestionsListAnswerNew(dateVal, shiftVal, questionList, page, db.redis.write);
                console.log('qlist set');
                return questionList;
            }
            questionList = await mysqlQuestionContainer.getQuestionsListAnswerNew(dateVal, shiftVal, page, db.mysql.read);
            return questionList;
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    static async getJM2019QuestionsTotalCountAnswerNew(dateVal, shiftVal, db) {
        // Do async job
        try {
            let questionListCount;
            if (config.caching) {
                console.log('redis total check');
                questionListCount = await redisQuestionContainer.getTotalQuestionsCountRedisAnswer(dateVal, shiftVal, db.redis.read);
                console.log(questionListCount);
                if (!_.isNull(questionListCount)) {
                    console.log('exist total');
                    console.log(questionListCount);
                    return JSON.parse(questionListCount);
                }
                console.log('not1 total q');
                // get from mysql
                questionListCount = await mysqlQuestionContainer.getTotalQuestionsCountSqlAnswerNew(dateVal, shiftVal, db.mysql.read);
                // set in redis
                await redisQuestionContainer.setTotalQuestionsCountRedisAnswer(dateVal, shiftVal, questionListCount, db.redis.write);
                return questionListCount;
            }
            questionListCount = await mysqlQuestionContainer.getTotalQuestionsCountSqlAnswerNew(dateVal, shiftVal, db.mysql.read);
            return questionListCount;
        } catch (e) {
            console.log(e);

            throw Error(e);
        }
    }

    static async getTextSolution(question_id, db) {
        // Do async job
        try {
            let textSolution;
            if (config.caching) {
                textSolution = await redisQuestionContainer.getTextSolution(question_id, db.redis.read);
                if (!_.isNull(textSolution)) {
                    return JSON.parse(textSolution);
                }
                // get from mysql
                textSolution = await mysqlQuestionContainer.getTextSolution(question_id, db.mysql.read);

                if (textSolution && textSolution.length) {
                    await redisQuestionContainer.setTextSolution(question_id, textSolution, db.redis.write);
                }
                // set in redis
                return textSolution;
            }
            textSolution = await mysqlQuestionContainer.getTextSolution(question_id, db.mysql.read);
            return textSolution;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getPageContent(locale_val, version, params, db) {
        // Do async job
        try {
            let questions;
            if (config.caching) {
                questions = await redisQuestionContainer.getPageContent(locale_val, version, params, db.redis.read);
                if (!_.isNull(questions)) {
                    return JSON.parse(questions);
                }
                questions = await mysqlQuestionContainer.getPageContent(locale_val, params, db.mysql.read);
                if (questions && questions.length) {
                    await redisQuestionContainer.setPageContent(locale_val, version, params, questions, db.redis.write);
                }
                return questions;
            }
            questions = await mysqlQuestionContainer.getPageContent(locale_val, params, db.mysql.read);
            return questions;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getLocalisedQuestion(question_id, language, db) {
        // Do async job
        try {
            let questions;
            if (config.caching) {
                console.log('inside');
                questions = await redisQuestionContainer.getLocalisedQuestion(question_id, language, db.redis.read);
                if (!_.isNull(questions)) {
                    console.log('redis');
                    return JSON.parse(questions);
                }
                console.log('mysql');
                questions = await mysqlQuestionContainer.getLocalisedQuestion(question_id, language, db.mysql.read);
                if (questions && questions.length) {
                    await redisQuestionContainer.setLocalisedQuestion(question_id, language, questions, db.redis.write);
                }
                return questions;
            }
            questions = await mysqlQuestionContainer.getLocalisedQuestion(question_id, language, db.mysql.read);
            return questions;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getChapterOrder(className, chapter, db) {
        // Do async job
        try {
            let chapOrder;
            if (config.caching) {
                chapOrder = await redisQuestionContainer.getChapterOrder(className, chapter, db.redis.read);
                if (!_.isNull(chapOrder)) {
                    return JSON.parse(chapOrder);
                }
                // get from mysql
                chapOrder = await mysqlQuestionContainer.getChapterOrder(className, chapter, db.mysql.read);

                if (chapOrder && chapOrder.length) {
                    await redisQuestionContainer.setChapterOrder(className, chapter, chapOrder, db.redis.write);
                }
                // set in redis
                return chapOrder;
            }
            chapOrder = await mysqlQuestionContainer.getChapterOrder(className, chapter, db.mysql.read);
            return chapOrder;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getMatchedQuestionsData(db) {
        // Do async job
        try {
            let chapOrder;
            if (0) {
                chapOrder = await redisQuestionContainer.getMatchedQuestionsData(db.redis.read);
                if (!_.isNull(chapOrder)) {
                    return JSON.parse(chapOrder);
                }
                // get from mysql
                chapOrder = await mysqlQuestionContainer.getMatchedQuestionsData(db.mysql.read);

                if (chapOrder && chapOrder.length) {
                    await redisQuestionContainer.setMatchedQuestionsData(db.redis.write);
                }
                // set in redis
                return chapOrder;
            }
            chapOrder = await mysqlQuestionContainer.getMatchedQuestionsData(db.mysql.read);
            return chapOrder;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getLocalisedQuestionMulti(questionsArray, groupedMeta, language, db) {
        // Do async job
        try {
            console.log(language);
            // console.log("inside")
            const questions = await redisQuestionContainer.getLocalisedQuestionMulti(questionsArray, language, db.redis.read);
            for (let i = 0; i < questionsArray.length; i++) {
                if (_.isNull(questions[i])) {
                    const localizedQuestion = await mysqlQuestionContainer.getLocalisedQuestion(questionsArray[i]._id, language, db.mysql.read);
                    if (localizedQuestion.length > 0) {
                        // console.log('localised in mysql')
                        // console.log(localizedQuestion[0][language])
                        if (typeof localizedQuestion[0][language] !== 'undefined') {
                            questionsArray[i]._source.ocr_text = localizedQuestion[0][language];
                        }
                        // set in redis
                        await redisQuestionContainer.setLocalisedQuestion(questionsArray[i]._id, language, localizedQuestion, db.redis.write);
                    } else if ((typeof groupedMeta[questionsArray[i]._id] !== 'undefined')) {
                        if (groupedMeta[questionsArray[i]._id][0].found) {
                            if (typeof groupedMeta[questionsArray[i]._id][0]._source.prettyText !== 'undefined') {
                                questionsArray[i]._source.ocr_text = groupedMeta[questionsArray[i]._id][0]._source.prettyText;
                            }
                        }
                    }
                } else if (!_.isEmpty(questions[i][1])) {
                    questions[i] = JSON.parse(questions[i][1]);
                    // console.log('localised in redis')
                    // console.log(typeof questions[i])
                    // console.log(questions[i])
                    if (typeof questions[i][0][language] !== 'undefined') {
                        questionsArray[i]._source.ocr_text = questions[i][0][language];
                        // console.log(questionsArray[i])
                    }
                } else {
                    questionsArray[i]._source.ocr_text = '';
                }
            }
            return questionsArray;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getEnglishQuestionMget(db, groupedQid, next) {
        // Do async job
        try {
            const language = 'english';
            const questions = await redisQuestionContainer.getLocalisedQuestionMget(db.redis.read, groupedQid, language);
            for (let i = 0; i < groupedQid.length; i++) {
                if (_.isNull(questions[i])) {
                    const localizedQuestion = await mysqlQuestionContainer.getEnglishQuestionMeta(groupedQid[i]._id, db.mysql.read);
                    if (localizedQuestion && localizedQuestion.length > 0 && typeof localizedQuestion[0][language] !== 'undefined' && !_.isEmpty(localizedQuestion[0][language])) {
                        groupedQid[i]._source = {};
                        groupedQid[i].found = true;
                        groupedQid[i]._source.pretty_text = localizedQuestion[0][language].replace(/'/g, "\\'").replace(/"/g, '\\"');
                        // set in redis
                        await redisQuestionContainer.setLocalisedQuestion(groupedQid[i]._id, language, localizedQuestion, db.redis.write);
                    }
                } else {
                    questions[i] = JSON.parse(questions[i]);
                    if (typeof questions[i][0][language] !== 'undefined' && !_.isEmpty(questions[i][0][language])) {
                        groupedQid[i]._source = {};
                        groupedQid[i].found = true;
                        groupedQid[i]._source.pretty_text = questions[i][0][language].replace(/'/g, "\\'").replace(/"/g, '\\"');
                    } else {
                        const localizedQuestion = await mysqlQuestionContainer.getEnglishQuestionMeta(groupedQid[i]._id, db.mysql.read);
                        if (localizedQuestion.length > 0 && typeof localizedQuestion[0][language] !== 'undefined' && !_.isEmpty(localizedQuestion[0][language])) {
                            groupedQid[i]._source = {};
                            groupedQid[i].found = true;
                            groupedQid[i]._source.pretty_text = localizedQuestion[0][language].replace(/'/g, "\\'").replace(/"/g, '\\"');
                            // set in redis
                            await redisQuestionContainer.setLocalisedQuestion(groupedQid[i]._id, language, localizedQuestion, db.redis.write);
                        }
                    }
                }
            }
            return { docs: groupedQid };
        } catch (e) {
            console.log(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getEnglishQuestionMget', error: errorLog });
            // throw Error(e);
            const apiError = new APIError(e.message, e.status, e.isPublic);
            return next(apiError);
        }
    }

    static async getLocalisedQuestionMget(db, questionsArrayWithMeta, groupedMeta, language, next, groupedQid, elasticSearchInstance) {
        // Do async job
        try {
            if (_.isEmpty(questionsArrayWithMeta)) {
                return [];
            }
            let groupedMetaFlag = !!groupedMeta;
            let hindiOcrFlag = false;
            const getByElastic = false;
            if (language === 'hindi' && getByElastic) {
                for (let i = 0; i < questionsArrayWithMeta.length; i++) {
                    const element = questionsArrayWithMeta[i];
                    if (_.get(element, '_source.ocr_text_hi', null)) {
                        hindiOcrFlag = true;
                        element._source.ocr_text = element._source.ocr_text_hi;
                        element._source.thumbnail_language = language;
                    } else {
                        break;
                    }
                }
            }
            if (hindiOcrFlag) {
                return questionsArrayWithMeta;
            }
            const questions = await redisQuestionContainer.getLocalisedQuestionMget(db.redis.read, questionsArrayWithMeta, language);
            // if (isLanguageCompatible && language !== 'hindi') {
            //     return questionsArrayWithMeta;
            // }
            for (let i = 0; i < questionsArrayWithMeta.length; i++) {
                // if (isLanguageCompatible && language === 'hindi' && questionsArrayWithMeta[i]._source && questionsArrayWithMeta[i]._source.video_language && questionsArrayWithMeta[i]._source.video_language !== 'hi') {
                //     continue;
                // }
                if (_.isNull(questions[i])) {
                    const localizedQuestion = await mysqlQuestionContainer.getLocalisedQuestion(questionsArrayWithMeta[i]._id, language, db.mysql.read);
                    if (localizedQuestion && localizedQuestion.length > 0 && typeof localizedQuestion[0][language] !== 'undefined' && !_.isEmpty(localizedQuestion[0][language])) {
                        questionsArrayWithMeta[i]._source.ocr_text = localizedQuestion[0][language].replace(/'/g, "\\'").replace(/"/g, '\\"');
                        questionsArrayWithMeta[i]._source.thumbnail_language = language;
                        // set in redis
                        redisQuestionContainer.setLocalisedQuestion(questionsArrayWithMeta[i]._id, language, localizedQuestion, db.redis.write);
                    } else {
                        if (!groupedMetaFlag) {
                            groupedMeta = await Utility.getNonEnglishGroupedMeta(groupedQid, elasticSearchInstance);
                            groupedMetaFlag = true;
                        }
                        if ((typeof groupedMeta[questionsArrayWithMeta[i]._id] !== 'undefined')) {
                            if (groupedMeta[questionsArrayWithMeta[i]._id][0].found && typeof groupedMeta[questionsArrayWithMeta[i]._id][0]._source.pretty_text !== 'undefined') {
                                questionsArrayWithMeta[i]._source.ocr_text = groupedMeta[questionsArrayWithMeta[i]._id][0]._source.pretty_text.replace(/'/g, "\\'").replace(/"/g, '\\"');
                                questionsArrayWithMeta[i]._source.thumbnail_language = 'english';
                            }
                        }
                    }
                } else {
                    questions[i] = JSON.parse(questions[i]);
                    if (typeof questions[i][0][language] !== 'undefined' && !_.isEmpty(questions[i][0][language])) {
                        questionsArrayWithMeta[i]._source.ocr_text = questions[i][0][language].replace(/'/g, "\\'").replace(/"/g, '\\"');
                        questionsArrayWithMeta[i]._source.thumbnail_language = language;
                    } else {
                        if (!groupedMetaFlag) {
                            groupedMeta = await Utility.getNonEnglishGroupedMeta(groupedQid, elasticSearchInstance);
                            groupedMetaFlag = true;
                        }
                        if ((typeof groupedMeta[questionsArrayWithMeta[i]._id] !== 'undefined')) {
                            if (groupedMeta[questionsArrayWithMeta[i]._id][0].found && typeof groupedMeta[questionsArrayWithMeta[i]._id][0]._source.pretty_text !== 'undefined') {
                                questionsArrayWithMeta[i]._source.ocr_text = groupedMeta[questionsArrayWithMeta[i]._id][0]._source.pretty_text.replace(/'/g, "\\'").replace(/"/g, '\\"');
                                questionsArrayWithMeta[i]._source.thumbnail_language = 'english';
                            }
                        }
                    }
                }
            }
            return questionsArrayWithMeta;
        } catch (e) {
            console.log(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getLocalisedQuestionMget', error: errorLog });
            // throw Error(e);
            const apiError = new APIError(e.message, e.status, e.isPublic);
            return next(apiError);
        }
    }

    static async getQuestionHtmlMget(db, matchesQuestionArray, next) {
        // Do async job
        try {
            if (_.isEmpty(matchesQuestionArray)) {
                return [];
            }
            const questionsHtml = await redisQuestionContainer.getQuestionHtmlMget(db.redis.read, matchesQuestionArray);
            for (let i = 0; i < matchesQuestionArray.length; i++) {
                if (_.isNull(questionsHtml[i])) {
                    const questionHtmlFromMysql = await mysqlQuestionContainer.getQuestionHtmlById(db.mysql.read, matchesQuestionArray[i]);
                    if (questionHtmlFromMysql.length > 0) {
                        questionsHtml[i] = questionHtmlFromMysql[0];
                        // set in redis
                        await redisQuestionContainer.setQuestionHtml(db.redis.write, matchesQuestionArray[i], questionHtmlFromMysql[0]);
                    } else {
                        questionsHtml[i] = [];
                    }
                } else {
                    questionsHtml[i] = JSON.parse(questionsHtml[i]);
                }
            }
            return questionsHtml;
        } catch (e) {
            console.log(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getQuestionHtmlMget', error: errorLog });
            // throw Error(e);
            const apiError = new APIError(e.message, e.status, e.isPublic);
            return next(apiError);
        }
    }

    static async getQuestionStats(questionIdArray, config1, color, language, language_code, groupedMatchedQuestionHtml, groupedMeta, db) {
        try {
            const promise = [];
            promise.push(redisQuestionContainer.getQuestionStatsMget(db.redis.read, questionIdArray));
            promise.push(redisAnswer.getDetailsMulti(questionIdArray, db.redis.read));
            const resolvedPromise = await Promise.all(promise);
            for (let i = 0; i < questionIdArray.length; i++) {
                const statsToSet = {};
                let redisNull = 0;
                if (_.isNull(resolvedPromise[0][i])) {
                    redisNull = 1;
                    let views = await this.getTotalViews(questionIdArray[i]._id, db);
                    if (views.length > 0) {
                        views = views[0].total_count * (Math.floor(Math.random() * 10) + 1); // random between 1-100
                        statsToSet.views = views;
                    } else {
                        views = Math.floor(Math.random() * 1000000) + 100000;
                    }
                    statsToSet.likes = Math.floor(views / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.dislikes = Math.floor(statsToSet.likes / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.share = Math.floor(statsToSet.likes / ((Math.ceil(Math.random() * 9) + 1)));
                    questionIdArray[i]._source.likes = statsToSet.likes;
                    questionIdArray[i]._source.share = statsToSet.share;
                } else if (!_.isEmpty(resolvedPromise[0][i])) {
                    resolvedPromise[0][i] = JSON.parse(resolvedPromise[0][i]);
                    statsToSet.likes = resolvedPromise[0][i].likes;
                    statsToSet.dislikes = resolvedPromise[0][i].dislikes;
                    statsToSet.share = resolvedPromise[0][i].share;
                    questionIdArray[i]._source.likes = resolvedPromise[0][i].likes;
                    questionIdArray[i]._source.share = resolvedPromise[0][i].share;
                } else {
                    statsToSet.likes = 0;
                    statsToSet.dislikes = 0;
                    statsToSet.share = 0;
                    questionIdArray[i]._source.likes = 0;
                    questionIdArray[i]._source.share = 0;
                }
                let answer_id = 0;
                if (_.isNull(resolvedPromise[1][i])) {
                    const answer = await this.getByQuestionIdForCatalogQuestions(db, questionIdArray[i]._id);
                    if (answer.length > 0) {
                        answer_id = answer[0].answer_id;
                        statsToSet.duration = answer[0].duration;
                        questionIdArray[i]._source.duration = answer[0].duration;
                    } else {
                        questionIdArray[i]._source.duration = '0';
                    }
                } else {
                    resolvedPromise[1][i] = JSON.parse(resolvedPromise[1][i][1]);
                    answer_id = resolvedPromise[1][i][0].answer_id;
                    statsToSet.duration = resolvedPromise[1][i][0].duration;
                    questionIdArray[i]._source.duration = resolvedPromise[1][i][0].duration;
                }
                questionIdArray[i].answer_id = answer_id;
                questionIdArray[i]._source.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                if (language === 'english' && groupedMatchedQuestionHtml[questionIdArray[i]._id] && groupedMatchedQuestionHtml[questionIdArray[i]._id].length > 0) {
                    questionIdArray[i].html = groupedMatchedQuestionHtml[questionIdArray[i]._id][0].html;
                    // questionIdArray[i].html = ''
                }
                if ((typeof groupedMeta[questionIdArray[i]._id] !== 'undefined') && (language_code === 'en')) {
                    if (groupedMeta[questionIdArray[i]._id][0].found) {
                        if (typeof groupedMeta[questionIdArray[i]._id][0]._source.pretty_text !== 'undefined') {
                            questionIdArray[i]._source.ocr_text = groupedMeta[questionIdArray[i]._id][0]._source.pretty_text;
                        }
                    }
                }
                if ((language_code !== 'en') && (questionIdArray[i]._source.subject === 'MATHS')) {
                    questionIdArray[i].question_thumbnail = `${config1.staticCDN}q-thumbnail/${language_code}_${questionIdArray[i]._id}.png`;
                } else {
                    questionIdArray[i].question_thumbnail = `${config1.staticCDN}q-thumbnail/${questionIdArray[i]._id}.png`;
                }
                questionIdArray[i].class = null;
                questionIdArray[i].chapter = null;
                questionIdArray[i].difficulty_level = null;
                questionIdArray[i]._source.bg_color = _.sample(color);
                if (redisNull) {
                    redisQuestionContainer.setQuestionsStats(questionIdArray[i]._id, statsToSet, db.redis.write);
                }
            }
            return questionIdArray;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getQuestionStatsNew(questionIdArray, config1, color, language, language_code, groupedMatchedQuestionHtml, groupedMeta, db, studentId, xAuthToken, versionCode) {
        try {
            const promise = [];
            promise.push(redisQuestionContainer.getQuestionStatsMget(db.redis.read, questionIdArray));
            promise.push(redisAnswer.getDetailsMultiWithTextSolution(questionIdArray, db.redis.read));
            promise.push(UtilityFlagr.getFlagrResp({ body: { capabilities: { srp_video_lang_hindi: {} }, entityId: studentId } }));
            const resolvedPromise = await Promise.all(promise);

            let hindiLangData = 'Hindi Medium';
            const flgrResp = resolvedPromise[2];
            if (flgrResp != undefined && flgrResp.srp_video_lang_hindi.enabled && flgrResp.srp_video_lang_hindi.payload.enabled) {
                hindiLangData = 'हिंदी';
            }

            for (let i = 0; i < questionIdArray.length; i++) {
                const statsToSet = {};
                let redisNull = 0;
                if (_.isNull(resolvedPromise[0][i])) {
                    redisNull = 1;
                    let views = await this.getTotalViews(questionIdArray[i]._id, db);
                    if (views.length > 0) {
                        views = views[0].total_count * (Math.floor(Math.random() * 10) + 1); // random between 1-100
                    } else {
                        views = Math.floor(Math.random() * 1000000) + 100000;
                    }
                    statsToSet.views = views;
                    statsToSet.likes = Math.floor(views / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.dislikes = Math.floor(statsToSet.likes / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.share = Math.floor(statsToSet.likes / ((Math.ceil(Math.random() * 9) + 1)));

                    questionIdArray[i]._source.views = statsToSet.views;
                    questionIdArray[i]._source.likes = statsToSet.likes;
                    questionIdArray[i]._source.share = statsToSet.share;
                } else if (!_.isEmpty(resolvedPromise[0][i])) {
                    resolvedPromise[0][i] = JSON.parse(resolvedPromise[0][i]);
                    statsToSet.likes = resolvedPromise[0][i].likes;
                    statsToSet.dislikes = resolvedPromise[0][i].dislikes;
                    statsToSet.share = resolvedPromise[0][i].share;
                    questionIdArray[i]._source.views = resolvedPromise[0][i].views;
                    questionIdArray[i]._source.likes = resolvedPromise[0][i].likes;
                    questionIdArray[i]._source.share = resolvedPromise[0][i].share;
                } else {
                    statsToSet.likes = 0;
                    statsToSet.dislikes = 0;
                    statsToSet.share = 0;
                    statsToSet.views = 0;
                    questionIdArray[i]._source.views = 0;
                    questionIdArray[i]._source.likes = 0;
                    questionIdArray[i]._source.share = 0;
                }
                const tagList = await redisAnswerContainer.getTagList(questionIdArray[i]._id, db);
                if (tagList && tagList.length && tagList[0].tags_list) {
                    const tags = tagList[0].tags_list.split(/[($#)(||)]/).filter(Boolean);
                    questionIdArray[i]._source.ref = tags.filter((x) => /\d/.test(x));
                    questionIdArray[i]._source.ref = questionIdArray[i]._source.ref[0] || tags[0];
                }
                questionIdArray[i]._source.ref = questionIdArray[i]._source.ref ? questionIdArray[i]._source.ref.replace(/\s\s+/g, ' ').trim() : null;

                if (versionCode > 700) {
                    const languageContainer = await this.getLanguageMapping(db);
                    questionIdArray[i]._source.ref = await this.getVideoSubjectTable(db.mysql.read, questionIdArray[i]._id, '', languageContainer, hindiLangData);
                }

                let answer_id = 0;
                let answer_video = '';
                if (_.isNull(resolvedPromise[1][i])) {
                    const answer = await mysqlAnswer.getByQuestionIdWithTextSolution(questionIdArray[i]._id, db.mysql.read);
                    if (answer.length) {
                        questionIdArray[i]._source.ocr_text = answer[0].ocr_text;
                        answer_id = answer[0].answer_id;
                        answer_video = answer[0].answer_video;
                        if (answer[0].is_text_answered == 1 && answer[0].is_answered == 0) {
                            questionIdArray[i].resource_type = 'text';
                            questionIdArray[i]._source.duration = '0';
                            answer_id = answer[0].text_solution_id;
                            answer_video = 'text';
                        } else {
                            questionIdArray[i].resource_type = 'video';
                            questionIdArray[i]._source.duration = answer[0].duration;
                        }
                        await redisAnswer.setByQuestionIdWithTextSolution(answer, db.redis.write);
                    } else {
                        questionIdArray[i]._source.duration = '0';
                        questionIdArray[i].resource_type = 'video';
                    }
                } else if (!_.isEmpty(resolvedPromise[1][i][1])) {
                    if (typeof resolvedPromise[1][i] !== 'object') {
                        resolvedPromise[1][i] = JSON.parse(resolvedPromise[1][i]);
                    } else {
                        resolvedPromise[1][i] = JSON.parse(resolvedPromise[1][i][1]);
                    }
                    questionIdArray[i]._source.ocr_text = resolvedPromise[1][i][0].ocr_text;
                    answer_id = resolvedPromise[1][i][0].answer_id;
                    answer_video = resolvedPromise[1][i][0].answer_video;
                    if (resolvedPromise[1][i][0].is_text_answered == 1 && resolvedPromise[1][i][0].is_answered == 0) {
                        questionIdArray[i].resource_type = 'text';
                        questionIdArray[i]._source.duration = '0';
                        answer_id = resolvedPromise[1][i][0].text_solution_id;
                        answer_video = 'text';
                    } else {
                        questionIdArray[i].resource_type = 'video';
                        questionIdArray[i]._source.duration = resolvedPromise[1][i][0].duration;
                        statsToSet.duration = resolvedPromise[1][i][0].duration;
                    }
                } else {
                    questionIdArray[i]._source.ocr_text = '';
                    questionIdArray[i].resource_type = 'video';
                    questionIdArray[i]._source.duration = 0;
                }
                questionIdArray[i].answer_id = answer_id;
                questionIdArray[i].answer_video = answer_video;
                questionIdArray[i]._source.ocr_text.replace(/'/g, "\\'");
                questionIdArray[i]._source.ocr_text.replace(/"/g, '\\"');
                questionIdArray[i]._source.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                if (language === 'english' && groupedMatchedQuestionHtml[questionIdArray[i]._id] && groupedMatchedQuestionHtml[questionIdArray[i]._id].length > 0) {
                    if (questionIdArray[i]._source.subject == 'MATHS') {
                        questionIdArray[i].html = groupedMatchedQuestionHtml[questionIdArray[i]._id][0].html;
                    }
                }
                // if (studentId && studentId % 2 === 0) {
                //     if (typeof groupedMeta[questionIdArray[i]._id] !== 'undefined') {
                //         if (groupedMeta[questionIdArray[i]._id][0].found) {
                //             if (typeof groupedMeta[questionIdArray[i]._id][0]._source.pretty_text !== 'undefined') {
                //                 questionIdArray[i]._source.ocr_text = groupedMeta[questionIdArray[i]._id][0]._source.pretty_text;
                //             }
                //         }
                //     }
                // }
                if ((language_code !== 'en') && (questionIdArray[i]._source.subject == 'MATHS')) {
                    questionIdArray[i].question_thumbnail = `${config1.staticCDN}q-thumbnail/${language_code}_${questionIdArray[i]._id}.png`;
                } else {
                    questionIdArray[i].question_thumbnail = `${config1.staticCDN}q-thumbnail/${questionIdArray[i]._id}.png`;
                }
                questionIdArray[i].class = null;
                questionIdArray[i].chapter = null;
                questionIdArray[i].difficulty_level = null;
                questionIdArray[i]._source.bg_color = _.sample(color);
                if (versionCode >= 775) {
                    // questionIdArray[i].question_thumbnail_localized = `${config1.staticCDN}q-thumbnail-localized/${questionIdArray[i]._id}/${language || 'english'}.webp`;
                    questionIdArray[i].question_thumbnail_localized = `${config1.cdn_url}question-thumbnail/${language_code || 'en'}_${questionIdArray[i]._id}.webp`;
                }
                if (redisNull) {
                    redisQuestionContainer.setQuestionsStats(questionIdArray[i]._id, statsToSet, db.redis.write);
                }
            }

            return questionIdArray;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getResourceType(db, questionIdArray) {
        try {
            if (!questionIdArray.length) {
                return questionIdArray;
            }
            const response = await redisAnswer.getDetailsTextSolutionWithMget(db.redis.read, questionIdArray);
            for (let i = 0; i < questionIdArray.length; i++) {
                let answer_id = 0;
                let answer_video = '';
                if (_.isNull(response[i])) {
                    const answer = await mysqlAnswer.getByQuestionIdWithTextSolution(questionIdArray[i]._id, db.mysql.read);
                    if (answer.length > 0) {
                        answer_id = answer[0].answer_id;
                        answer_video = answer[0].answer_video;
                        if (answer[0].is_text_answered == 1 && answer[0].is_answered == 0) {
                            questionIdArray[i].resource_type = 'text';
                            questionIdArray[i]._source.duration = '0';
                            answer_id = answer[0].text_solution_id;
                            answer_video = 'text';
                        } else {
                            questionIdArray[i].resource_type = 'video';
                            questionIdArray[i]._source.duration = answer[0].duration;
                        }
                        redisAnswer.setByQuestionIdWithTextSolution(answer, db.redis.write);
                    } else {
                        questionIdArray[i]._source.duration = '0';
                        questionIdArray[i].resource_type = 'video';
                    }
                } else {
                    response[i] = JSON.parse(response[i]);
                    answer_id = response[i][0].answer_id;
                    answer_video = response[i][0].answer_video;
                    if (response[i][0].is_text_answered == 1 && response[i][0].is_answered == 0) {
                        questionIdArray[i].resource_type = 'text';
                        questionIdArray[i]._source.duration = '0';
                        answer_id = response[i][0].text_solution_id;
                        answer_video = 'text';
                    } else {
                        questionIdArray[i].resource_type = 'video';
                        questionIdArray[i]._source.duration = response[i][0].duration;
                    }
                }
                questionIdArray[i].answer_id = answer_id;
                questionIdArray[i].answer_video = answer_video;
            }
            return questionIdArray;
        } catch (e) {
            console.log(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getResourceType', error: errorLog });
            // throw Error(e);
            const apiError = new APIError(e.message, e.status, e.isPublic);
            // eslint-disable-next-line no-undef
            return next(apiError);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getQuestionStatsWithMget(db, questionIdArray, config1, color, language, language_code, groupedMatchedQuestionHtml, groupedMeta, studentId, next, xAuthToken = null, versionCode = 700, appRegion, videoLangDisplayAttachment, srpVideoLanguageHindiAttachment) {
        try {
            if (_.isEmpty(questionIdArray)) {
                return [];
            }
            const promise = [];
            promise.push(redisQuestionContainer.getQuestionStatsMget(db.redis.read, questionIdArray));
            promise.push(redisAnswer.getDetailsTextSolutionWithMget(db.redis.read, questionIdArray));
            const resolvedPromise = await Promise.all(promise);

            let hindiLangData = 'Hindi Medium';
            if (_.get(srpVideoLanguageHindiAttachment, 'enabled', false)) {
                hindiLangData = 'हिंदी';
            }

            for (let i = 0; i < questionIdArray.length; i++) {
                const statsToSet = {};
                let redisNull = 0;
                if (_.isNull(resolvedPromise[0][i])) {
                    redisNull = 1;
                    let views = await this.getTotalViews(questionIdArray[i]._id, db);
                    if (views.length > 0) {
                        views = views[0].total_count * (Math.floor(Math.random() * 10) + 1); // random between 1-100
                    } else {
                        views = Math.floor(Math.random() * 1000000) + 100000;
                    }
                    statsToSet.views = views;
                    statsToSet.likes = Math.floor(views / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.dislikes = Math.floor(statsToSet.likes / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.share = Math.floor(statsToSet.likes / ((Math.ceil(Math.random() * 9) + 1)));

                    questionIdArray[i]._source.views = statsToSet.views;
                    questionIdArray[i]._source.likes = statsToSet.likes;
                    questionIdArray[i]._source.share = statsToSet.share;
                } else {
                    resolvedPromise[0][i] = JSON.parse(resolvedPromise[0][i]);
                    statsToSet.likes = resolvedPromise[0][i].likes;
                    statsToSet.dislikes = resolvedPromise[0][i].dislikes;
                    statsToSet.share = resolvedPromise[0][i].share;
                    questionIdArray[i]._source.views = resolvedPromise[0][i].views;
                    questionIdArray[i]._source.likes = resolvedPromise[0][i].likes;
                    questionIdArray[i]._source.share = resolvedPromise[0][i].share;
                }

                let answer_id = 0;
                let answer_video = '';
                if (_.isNull(resolvedPromise[1][i])) {
                    const answer = await mysqlAnswer.getByQuestionIdWithTextSolution(questionIdArray[i]._id, db.mysql.read);
                    if (answer.length > 0) {
                        answer_id = answer[0].answer_id;
                        answer_video = answer[0].answer_video;
                        if (answer[0].is_text_answered == 1 && answer[0].is_answered == 0) {
                            questionIdArray[i].resource_type = 'text';
                            questionIdArray[i]._source.duration = '0';
                            answer_id = answer[0].text_solution_id;
                            answer_video = 'text';
                        } else {
                            questionIdArray[i].resource_type = 'video';
                            questionIdArray[i]._source.duration = answer[0].duration;
                        }
                        redisAnswer.setByQuestionIdWithTextSolution(answer, db.redis.write);
                    } else {
                        questionIdArray[i]._source.duration = '0';
                        questionIdArray[i].resource_type = 'video';
                    }
                } else {
                    resolvedPromise[1][i] = JSON.parse(resolvedPromise[1][i]);
                    answer_id = resolvedPromise[1][i][0].answer_id;
                    answer_video = resolvedPromise[1][i][0].answer_video;
                    if (resolvedPromise[1][i][0].is_text_answered == 1 && resolvedPromise[1][i][0].is_answered == 0) {
                        questionIdArray[i].resource_type = 'text';
                        questionIdArray[i]._source.duration = '0';
                        answer_id = resolvedPromise[1][i][0].text_solution_id;
                        answer_video = 'text';
                    } else {
                        questionIdArray[i].resource_type = 'video';
                        questionIdArray[i]._source.duration = resolvedPromise[1][i][0].duration;
                        statsToSet.duration = resolvedPromise[1][i][0].duration;
                    }
                }
                questionIdArray[i].answer_id = answer_id;
                questionIdArray[i].answer_video = answer_video;
                if (appRegion && appRegion.toLowerCase() == 'us') {
                    questionIdArray[i]._source.share_message = 'Improve your SAT or ACT Score with Math, Science and solved Practice Tests Video Solutions only on Doubtnut!!';
                } else {
                    questionIdArray[i]._source.share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                }
                if (language === 'english' && groupedMatchedQuestionHtml[questionIdArray[i]._id] && groupedMatchedQuestionHtml[questionIdArray[i]._id].length > 0) {
                    if (questionIdArray[i]._source.subject == 'MATHS') {
                        // questionIdArray[i].html = groupedMatchedQuestionHtml[questionIdArray[i]._id][0].html;
                        questionIdArray[i].html = '';
                    }
                }

                if (groupedMeta && typeof groupedMeta[questionIdArray[i]._id] !== 'undefined') {
                    if (groupedMeta[questionIdArray[i]._id][0].found) {
                        const fieldName = typeof studentId !== 'undefined' && studentId % 2 !== 0 ? 'pretty_ocr_text' : 'pretty_text';
                        // if (language === 'english' || (language === 'hindi' && isLanguageCompatible && questionIdArray[i]._source.video_language && questionIdArray[i]._source.video_language != 'hi')
                        //     || (isLanguageCompatible && language != 'hindi')) {
                        if (typeof groupedMeta[questionIdArray[i]._id][0]._source[fieldName] !== 'undefined') {
                            questionIdArray[i]._source.ocr_text = groupedMeta[questionIdArray[i]._id][0]._source[fieldName].replace(/'/g, "\\'").replace(/"/g, '\\"');
                        }
                        // }
                    }
                }
                questionIdArray[i].class = null;
                questionIdArray[i].chapter = null;
                questionIdArray[i].difficulty_level = null;
                questionIdArray[i]._source.bg_color = _.sample(color);
                questionIdArray[i]._source.isLiked = false;
                if (redisNull) {
                    redisQuestionContainer.setQuestionsStats(questionIdArray[i]._id, statsToSet, db.redis.write);
                }
            }

            const languageContainer = await this.getLanguageMapping(db);
            const tagPromises = questionIdArray.map((x) => redisAnswerContainer.getTagList(x._id, db));
            const subjectPromises = versionCode > 700 ? questionIdArray.map((x) => this.getVideoSubjectTable(db.mysql.read, x._id, x._source.video_language, languageContainer, hindiLangData)) : [];
            const tagData = await Promise.all([...tagPromises, ...subjectPromises]);
            if (!Utility.isUsRegion(appRegion)) {
                questionIdArray.forEach((x, i) => {
                    if (tagData[questionIdArray.length + i]) {
                        x._source.ref = tagData[questionIdArray.length + i];
                        return;
                    }
                    const tagList = tagData[i];
                    if (!tagList || !tagList.length || !tagList[0].tags_list) {
                        x._source.ref = null;
                        return;
                    }
                    const tags = tagList[0].tags_list.split(/[($#)(||)]/).filter(Boolean);
                    x._source.ref = tags.filter((y) => /\d/.test(y));
                    x._source.ref = x._source.ref[0] || tags[0];
                    x._source.ref = x._source.ref ? x._source.ref.replace(/\s\s+/g, ' ').trim() : null;
                });
            }

            return questionIdArray;
        } catch (e) {
            console.log(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'ask', source: 'getQuestionStatsWithMget', error: errorLog });
            // throw Error(e);
            const apiError = new APIError(e.message, e.status, e.isPublic);
            return next(apiError);
        }
    }

    static async getQuestionsData(db, questionIdArray) {
        // Do async job
        try {
            const answer = await redisAnswer.getDetailsMultiWithTextSolution(questionIdArray, db.redis.read);
            for (let i = 0; i < questionIdArray.length; i++) {
                if (_.isNull(answer[i])) {
                    const answer1 = await mysqlAnswer.getByQuestionIdWithTextSolution(questionIdArray[i]._id, db.mysql.read);
                    if (answer1.length > 0) {
                        if (answer1[0].is_text_answered == 1 && answer1[0].is_answered == 0) {
                            questionIdArray[i]._source.resource_type = 'text';
                        } else {
                            questionIdArray[i]._source.resource_type = 'video';
                        }
                        await redisAnswer.setByQuestionIdWithTextSolution(answer1, db.redis.write);
                    } else {
                        questionIdArray[i]._source.duration = '0';
                        questionIdArray[i]._source.resource_type = 'video';
                    }
                } else {
                    answer[i] = JSON.parse(answer[i]);
                    if (answer[i][0].is_text_answered == 1 && answer[i][0].is_answered == 0) {
                        questionIdArray[i]._source.resource_type = 'text';
                    } else {
                        questionIdArray[i]._source.resource_type = 'video';
                    }
                }
            }
            return questionIdArray;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async rescursiveList(questionData, splitter, limit, questionList, db) {
        // Do async job
        try {
            console.log('0');

            const { doubt } = questionData;
            const student_class = questionData.class;
            const { student_id } = questionData;
            let leftQuestion; let questionList2;
            const splittedDoubt = doubt.split('_');
            if (questionList.length === 10 || splittedDoubt.length == splitter) {
                return questionList;
            }
            questionList2 = await this.getQuestionListBelow100(doubt, splittedDoubt, splitter, student_class, student_id, limit, db);
            if (questionList2.length === 0) {
                // console.log("1")
                if (splittedDoubt.length > splitter) {
                    splitter += 1;
                }
                questionList2 = await this.rescursiveList(questionData, splitter, limit, questionList2, db);
                // console.log("zero___")
                // console.log(questionList2.length)
                return questionList2;
            }
            if (questionList2.length < 10) {
                leftQuestion = questionList;
                limit = 10 - questionList.length;

                // console.log("below 10")
                // console.log(leftQuestion.length)
                if (splittedDoubt.length > splitter) {
                    splitter += 1;
                }
                questionList2 = await this.rescursiveList(questionData, splitter, limit, questionList, db);
                // concatenate both list
                // console.log(questionList2.length)
                questionList2 = [...leftQuestion, ...questionList2];
                // console.log(questionList2)
                return questionList2;
            }

            // console.log("3")
            // console.log("questionList2.length")
            // console.log(questionList2.length)
            return questionList2;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getQuestionListBelow100(doubt, splittedDoubt, splitter, student_class, student_id, limit, db) {
        // Do async job
        try {
            const identifier = Utility.idetifierGenerator(splittedDoubt, splitter);
            const questionListData = await mysqlQuestionContainer.getSimilarQuestionBelow100(identifier, doubt, student_class, student_id, limit, db.mysql.read);
            return questionListData;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async relatedConcept(question_id, limit, db) {
        // Do async job
        try {
            let answer;
            if (config.caching) {
                answer = await redisQuestionContainer.getRelatedConceptVideo(question_id, db.redis.read);
                if (!_.isNull(answer)) {
                    return JSON.parse(answer);
                }
                // get from mysql
                answer = await mysqlQuestionContainer.getRelatedConceptVideo(question_id, limit, db.mysql.read);

                if (answer && answer.length) {
                    await redisQuestionContainer.setRelatedConceptVideo(question_id, answer, db.redis.write);
                }
                // set in redis
                return answer;
            }
            answer = await mysqlQuestionContainer.getRelatedConceptVideo(question_id, limit, db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTagList(question_id, db) {
        // Do async job
        try {
            let taglist;
            if (config.caching) {
                taglist = await redisQuestionContainer.getTagList(question_id, db.redis.read);
                if (!_.isNull(taglist)) {
                    return JSON.parse(taglist);
                }
                // get from mysql
                taglist = await mysqlQuestionContainer.getTagList(question_id, db.mysql.read);

                if (taglist && taglist.length) {
                    await redisQuestionContainer.setTagList(question_id, taglist, db.redis.write);
                }
                // set in redis
                return taglist;
            }
            taglist = await mysqlQuestionContainer.getTagList(question_id, db.mysql.read);
            return taglist;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getTotalViewsMulti(db, data) {
        // Do async job
        try {
            const answer = await redisQuestionContainer.getQuestionStatsMultiForHomepage(data, db.redis.read);
            for (let i = 0; i < data.length; i++) {
                const statsToSet = {};
                let redisNull = 0;
                if (_.isNull(answer[i])) {
                    redisNull = 1;
                    let views = await this.getTotalViews(data[i].id, db);
                    if (views.length > 0) {
                        views = views[0].total_count * (Math.floor(Math.random() * 10) + 1); // random between 1-100
                    } else {
                        views = Math.floor(Math.random() * 1000000) + 100000;
                    }
                    statsToSet.views = views;
                    statsToSet.likes = Math.floor(views / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.dislikes = Math.floor(statsToSet.likes / ((Math.floor(Math.random() * 100) + 10)));
                    statsToSet.share = Math.floor(statsToSet.likes / ((Math.ceil(Math.random() * 9) + 1)));
                    data[i].views = statsToSet.views;
                    data[i].likes = statsToSet.likes;
                    data[i].share = statsToSet.share;
                } else {
                    answer[i] = JSON.parse(answer[i]);
                    statsToSet.likes = answer[i].likes;
                    statsToSet.dislikes = answer[i].dislikes;
                    statsToSet.share = answer[i].share;
                    if (answer[i].views) {
                        redisNull = 1;
                        statsToSet.views = answer[i].likes * (Math.floor(Math.random() * 100) + 10);
                    }
                    data[i].views = answer[i].views;
                    data[i].likes = answer[i].likes;
                    data[i].share = answer[i].share;
                }
                if (redisNull) {
                    redisQuestionContainer.setQuestionsStats(data[i].id, statsToSet, db.redis.write);
                }
            }
            return data;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getSimilarQuestionFromBookMeta(db, doubt) {
        try {
            let data;
            if (1) {
                return moduleQuestion.getSimilarQuestionFromBookMeta(db.mysql.read, doubt);
            }
            data = await redisQuestionContainer.getSimilarQuestionFromBookMeta(db.redis.read, doubt);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            // get from mysql
            data = await moduleQuestion.getSimilarQuestionFromBookMeta(db.mysql.read, doubt);
            if (data && data.length > 0) {
                await redisQuestionContainer.setSimilarQuestionFromBookMeta(db.redis.write, doubt, data);
            }
            // set in redis
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getQuestionAskedCount(db, studentId) {
        if (!config.caching) {
            return (await moduleQuestion.checkQuestionsAskedCount(studentId, db.mysql.read)).length;
        }
        let count = await redisQuestionContainer.getQuestionAskedCount(db.redis.read, studentId);
        if (!count && count !== 0) {
            count = (await moduleQuestion.checkQuestionsAskedCount(studentId, db.mysql.read)).length;
        }
        redisQuestionContainer.setQuestionAskedCount(db.redis.write, studentId, count);
        return count;
    }

    static async getQuestionAskedCountWatchHistoryCompatible(db, studentId) {
        return (await moduleQuestion.checkQuestionsAskedCountWatchHistoryCompatible(studentId, db.mysql.read)).length;
    }

    static async getEtoosQuestionsByMcID(db, mcID) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getEtoosQuestionsByMcID(db.redis.read, mcID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysqlQuestionContainer.getEtoosQuestionsByMcID(db.mysql.read, mcID);
            if (data.length) {
                await redisQuestionContainer.setEtoosQuestionsByMcID(db.redis.write, mcID, data);
            }
            return data;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getPersonalizedTabs(student_class, student_id, db, playlist_id) {
        let data;
        try {
            data = await libraryMysql.getPlaylistWithParentId(db.mysql.read, student_class, student_id, playlist_id);
            for (const item of data) {
                if (item.description.includes('BOOK')) {
                    item.item_view_type = 'grid_view';
                } else {
                    item.item_view_type = 'horizontal_list';
                }
            }

            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async personalizedBooksWrapper(db, studentId, student_class, ccmArray) {
        const ccmidBooksArray = await this.getCcmidBooks(db, studentId, ccmArray);
        const data = {};
        data.userId = studentId.toString();
        data.eventAction = 'video_view';
        data.sort = '-eventTime';
        data.endpoint = `${config.PASCAL_URL}api/events/video-views/info`;
        const bookArray = [];

        const responses = await Utility.getPersonalizedHomePageUsingVariantAttachment(data, data);
        console.log(responses);

        if (responses && responses.length > 0) {
            for (const response of responses) {
                const bookString = 'BOOKS_';
                if (response.questionStudentId) bookArray.push(bookString.concat(parseInt(response.questionStudentId)));
            }
        }
        console.log('books for the student history has been fetched');
        ccmidBooksArray.concat(bookArray);

        const bookListResponse = await libraryMysql.getPlaylistWithStudentId(db.mysql.read, student_class, ccmidBooksArray);
        console.log(bookListResponse.length);
        if (bookListResponse && bookListResponse.length > 0) {
            return bookListResponse;
        }
        return [];
    }

    static async getPersonalizedBooks(studentId, ccmArray, student_class, student_locale, db) {
        try {
            let finalData;
            if (config.caching) {
                finalData = await redisQuestionContainer.getPersonalizedBooks(db.redis.read, studentId);

                if (!_.isNull(finalData)) {
                    return JSON.parse(finalData);
                }

                finalData = await this.personalizedBooksWrapper(db, studentId, student_class, ccmArray);

                if (finalData && finalData.length) {
                    await redisQuestionContainer.setPersonalizedBooks(db.redis.write, studentId, finalData);
                }
                return finalData;
            }
            return await this.personalizedBooksWrapper(db, studentId, student_class, ccmArray);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async personalizedMicroWrapper(db, studentId, studentClass, studentLocale) {
        console.log('fetching the data from the API for personlized live class MC');

        const data = {};
        data.userId = studentId.toString();
        data.eventAction = 'video_view';
        data.sort = '-eventTime';
        data.endpoint = `${config.PASCAL_URL}api/events/video-views/info`;
        const microConceptsArray = [];

        const responses = await Utility.getPersonalizedHomePageUsingVariantAttachment(data, data);
        console.log(responses);

        if (responses && responses.length > 0) {
            for (const response of responses) {
                if (response.microConcept) microConceptsArray.push(response.microConcept);
            }
        }

        let questionList = [];

        if (microConceptsArray.length) {
            const MCData = await mysqlQuestionContainer.getMCQuestionId(db.mysql.read, Utility.getPreservedQuoteString(microConceptsArray));

            questionList = MCData.map((el) => el.etoos_question_id);
        }

        const liveClassArray = await mysqlQuestionContainer.getClasswiseTopLiveClass(db.mysql.read, studentClass);

        if (liveClassArray && liveClassArray.length > 0) {
            for (const response of liveClassArray) {
                questionList.push(response.question_id);
            }
        }

        if (questionList.length == 0) return [];

        const questionListInfo = await mysqlQuestionContainer.getQuestionList(db.mysql.read, questionList.join());

        return questionListInfo;
    }

    static async getPersonalizedMicroConcepts(db, studentId, studentClass, studentLocale) {
        try {
            let finalData;
            console.log('getting personlized live class MC');

            if (config.caching) {
                finalData = await redisQuestionContainer.getPersonalizedMicroconcepts(db.redis.read, studentId);

                if (!_.isNull(finalData)) {
                    return JSON.parse(finalData);
                }

                finalData = await this.personalizedMicroWrapper(db, studentId, studentClass, studentLocale);

                if (finalData && finalData.length) {
                    await redisQuestionContainer.setPersonalizedMicroconcepts(db.redis.write, studentId, finalData);
                }
                return finalData;
            }
            return await this.personalizedMicroWrapper(db, studentId, studentClass, studentLocale);
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    static async getCcmidBooks(db, studentId, ccmArray) {
        const data = [];
        try {
            const responses = await libraryMysql.getBooklistWithCcmId(db.mysql.read, ccmArray);
            console.log(responses);
            if (responses && responses.length > 0) {
                for (const response of responses) {
                    const bookString = 'BOOKS_';
                    data.push(bookString.concat(parseInt(response.book_student_id)));
                }
            }
            console.log(data);
            return data;
        } catch (e) {
            return [];
        }
    }

    static async getVideoSubject(qid, database, video_language, videoLangDisplayAttachment) {
        const mapping_key_obj = {
            english: 'englishLangNameByCode',
            regional: 'langNameByCode',
            default: 'langNameByCode',
        };
        const mappingKey = !_.isEmpty(videoLangDisplayAttachment) ? videoLangDisplayAttachment.mappingType : 'default';
        if (video_language) {
            return staticData[mapping_key_obj[mappingKey]][video_language.toLowerCase()];
        }
        let langData = '';
        const sidByQid = await mysqlQuestionContainer.getSidByQid(qid, database);
        if (Utility.checkArrayValidity(sidByQid, 'student_id')) {
            if (Utility.checkValidDNStudentId(sidByQid[0].student_id)) {
                const videoLangCode = await mysqlQuestionContainer.getVideoLangCode(qid, database);
                if (videoLangCode != undefined && videoLangCode != null) {
                    const vid_lang = videoLangCode[0].video_language;
                    langData = staticData[mapping_key_obj[mappingKey]][vid_lang.toLowerCase()];
                }
            } else {
                langData = staticData[mapping_key_obj[mappingKey]]['hi-en'];
            }
        }
        return langData;
    }

    static async getLanguageMapping(db) {
        let languageContainer;
        const data = await redisQuestionContainer.getLanguageMapping(db.redis.read);
        if (!_.isNull(data)) {
            languageContainer = JSON.parse(data);
        } else {
            languageContainer = await mysqlQuestionContainer.getAllLanguages(db.mysql.read);
            redisQuestionContainer.setLanguageMapping(db.redis.write, languageContainer);
        }
        return languageContainer;
    }

    static async getVideoSubjectTable(database, qid, videoLanguage, languageContainer, hindiLangData) {
        let langData = '';
        if (videoLanguage) {
            const index = languageContainer.findIndex((item) => item.lang_code === videoLanguage.toLowerCase());
            if (index !== -1) {
                langData = languageContainer[index].lang_name;
                if (videoLanguage.toLowerCase() === 'hi') {
                    langData = hindiLangData;
                }
            }
            return langData;
        }

        const sidByQid = await mysqlQuestionContainer.getSidByQid(qid, database);
        if (Utility.checkArrayValidity(sidByQid, 'student_id')) {
            if (Utility.checkValidDNStudentId(sidByQid[0].student_id)) {
                const videoLangCode = await mysqlQuestionContainer.getVideoLangCode(qid, database);
                if (videoLangCode !== undefined && videoLangCode !== null) {
                    const videoLang = videoLangCode[0].video_language;
                    const index = languageContainer.findIndex((item) => item.lang_code === videoLang.toLowerCase());
                    if (index !== -1) {
                        langData = languageContainer[index].lang_name;
                    }
                }
            } else {
                const index = languageContainer.findIndex((item) => item.lang_code === 'hi-en');
                if (index !== -1) {
                    langData = languageContainer[index].lang_name;
                }
            }
        } else {
            const index = languageContainer.findIndex((item) => item.lang_code === 'hi-en');
            if (index !== -1) {
                langData = languageContainer[index].lang_name;
            }
        }
        return langData;
    }

    static async getVideoSubjectUsa(qid, database) {
        let langData = 'en';
        const sidByQid = await mysqlQuestionContainer.getSidByQid(qid, database);
        if (Utility.checkArrayValidity(sidByQid, 'student_id')) {
            if (Utility.checkValidDNStudentId(sidByQid[0].student_id)) {
                const videoLangCode = await mysqlQuestionContainer.getVideoLangCode(qid, database);
                if (videoLangCode != undefined && videoLangCode != null) {
                    langData = videoLangCode[0].video_language;
                }
            }
        }
        return langData;
    }

    static getAutoPlayVariant(autoPlayVariantAttachment) {
        let autoPlayVariant = 0;
        let waitTime = 0;
        let duration = 0;
        if (_.get(autoPlayVariantAttachment, 'enabled', null)) {
            autoPlayVariant = autoPlayVariantAttachment.variantId;
            if (parseInt(autoPlayVariant) !== 0) {
                waitTime = _.get(autoPlayVariantAttachment, 'waitTime', 0);
                duration = _.get(autoPlayVariantAttachment, 'duration', 0);
            }
        }
        return {
            autoPlayVariant, waitTime, duration,
        };
    }

    static async getChapterByQid(db, qId) {
        let chapterData;
        if (config.caching) {
            chapterData = await redisQuestionContainer.getChapterDataByQid(db.redis.read, qId);
            if (!_.isNull(chapterData)) {
                return JSON.parse(chapterData);
            }
            // get from mysql
            chapterData = await mysqlQuestionContainer.getClassandChapterFromMeta(qId, db.mysql.read);
            if (chapterData && chapterData.length) {
                await redisQuestionContainer.setChapterDataByQid(db.redis.write, qId, chapterData);
            }
            // set in redis
            return chapterData;
        }
        chapterData = await mysqlQuestionContainer.getClassandChapterFromMeta(qId, db.mysql.read);
        return chapterData;
    }

    static async getLangCode(matchesArray, database) {
        if (_.isEmpty(matchesArray)) {
            return [];
        }
        if (database) {
            const videoLangPromise = [];
            for (let i = 0; i < matchesArray.length; i++) {
                videoLangPromise.push(mysqlQuestionContainer.getVideoLangCode(matchesArray[i]._id, database));
            }

            const videoLangResults = await Promise.all(videoLangPromise);

            for (let i = 0; i < matchesArray.length; i++) {
                if (!_.isEmpty(videoLangResults[i][0]) && !_.isEmpty(videoLangResults[i][0].video_language)) {
                    matchesArray[i]._source.video_language = staticData.langCodeByCode[videoLangResults[i][0].video_language];
                    matchesArray[i]._source.video_language_code = videoLangResults[i][0].video_language;
                } else {
                    matchesArray[i]._source.video_language = 'en';
                    matchesArray[i]._source.video_language_code = 'en';
                }

                if (!_.isEmpty(videoLangResults[i][0]) && !_.isEmpty(videoLangResults[i][0].package_language)) {
                    matchesArray[i]._source.package_language = videoLangResults[i][0].package_language;
                } else {
                    matchesArray[i]._source.package_language = 'en';
                }
            }
        } else {
            for (let index = 0; index < matchesArray.length; index++) {
                const element = matchesArray[index];
                if (element && element._source && element._source.video_language) {
                    element._source.video_language = staticData.langCodeByCode[element._source.video_language];
                } else {
                    element._source.video_language = 'en';
                }
            }
        }
        return matchesArray;
    }

    static getLanguageHeadingText(responseDataData, locale) {
        responseDataData.user_language_video_heading = staticData.user_language_video_heading(locale);
        responseDataData.other_language_video_heading = staticData.other_language_video_heading(locale);
        responseDataData.more_user_language_videos_text = global.t8[locale].t('show more {{language}} videos', { language: global.t8[locale].t(staticData.languageObject[locale].toUpperCase(), staticData.languageObject[locale]) });
        return responseDataData;
    }

    static async getSameTextQuestions(db, questionIdArray) {
        const sameTextQuestions = await mysqlQuestionContainer.getSameTextQuestions(db.mysql.read, questionIdArray);
        return sameTextQuestions;
    }

    static async getDailyCountQuesAsk(client, student_id) {
        const dailyCount = await UtilityRedis.getHash(client, Keys.dailyQuestionAskCount, student_id);
        if (dailyCount) {
            return JSON.parse(dailyCount);
        }
        return 0;
    }

    static incDailyCountQuesAsk(client, student_id) {
        return UtilityRedis.incHashValue(client, Keys.dailyQuestionAskCount, student_id, Utility.getExpireTime().expire);
    }

    static async getLocalisedOcrById(db, question_id, locale) {
        try {
            let question;
            if (config.caching) {
                question = await redisQuestionContainer.getLocalisedQuestion(question_id, locale, db.redis.read);
                if (!_.isNull(question)) {
                    return JSON.parse(question);
                }
                question = await mysqlQuestionContainer.getLocalisedOcr(db.mysql.read, question_id);
                if (question && question.length > 0) {
                    question = question.map((item) => item.hindi);
                    await redisQuestionContainer.setLocalisedQuestion(question_id, locale, question, db.redis.write);
                }
                return question;
            }
            question = await mysqlQuestionContainer.getLocalisedOcr(db.mysql.read, question_id);
            question = question.map((item) => item.hindi);
            return question;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async similarData(db, page, questionId, chapter, studentId, userId) {
        try {
            let playListName = '';
            let questionType = '';
            if (page === 'SRP') {
                playListName = 'SRP_PLAYLIST';
                questionType = 'SRP';
            } else if (page !== 'SRP' && page !== 'SRP_PLAYLIST') {
                playListName = 'NON_SRP_PLAYLIST';
                questionType = 'NON_SRP';
            }
            if (playListName !== '') {
                let questionList = await redisQuestionContainer.getSimilarQuestionsList(db.redis.read, questionId, playListName);
                let finalQlist = [];
                if (_.isNull(questionList)) {
                    if (playListName === 'SRP_PLAYLIST') {
                        questionList = await mysqlQuestionContainer.getSimilarData(db.mysql.read, chapter);
                    } else {
                        questionList = await mysqlQuestionContainer.getSimilarData(db.mysql.read, chapter, studentId);
                    }
                    if (questionList && questionList.length > 2) {
                        finalQlist = questionList.map((x) => x.question_id.toString());
                    }
                } else {
                    questionList = JSON.parse(questionList);
                    let getLastViews = await redisQuestionContainer.getStudentLastViewedQuestion(db.redis.read, userId, `${playListName}_last_viewed`);
                    if (!_.isNull(getLastViews)) {
                        getLastViews = JSON.parse(getLastViews);
                        if (getLastViews.length > 0) {
                            let progress = 0;
                            questionList.forEach((item) => {
                                if (getLastViews.includes(item)) {
                                    progress++;
                                }
                            });
                            if (progress == questionList.length) {
                                const lastQid = questionList[questionList.length - 1];
                                if (playListName === 'SRP_PLAYLIST') {
                                    questionList = await mysqlQuestionContainer.getSimilarDataAfterQid(db.mysql.read, chapter, lastQid);
                                } else {
                                    questionList = await mysqlQuestionContainer.getSimilarDataAfterQid(db.mysql.read, chapter, lastQid, studentId);
                                }
                                if (questionList && questionList.length > 2) {
                                    finalQlist = questionList.map((x) => x.question_id.toString());
                                }
                            }
                        }
                    }
                }
                if (finalQlist.length > 0) {
                    redisQuestionContainer.setSimilarQuestionsList(db.redis.write, questionId, playListName, finalQlist);
                }
            }
            if (questionType !== '') {
                redisQuestionContainer.setStudentLastQuestion(db.redis.write, userId, questionType, questionId);
            }
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async isQuestionIDPresentInTopFreeClasses(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getQuestionIDInTopFreeClasses(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return data;
                }
            }
            data = await mysqlQuestionContainer.getQuestionIDInTopFreeClasses(db.mysql.read, questionID);
            await redisQuestionContainer.setQuestionIDInTopFreeClasses(db.redis.write, questionID, data);
            return data && data.length > 0 ? 1 : 0;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async getPlaylistIdClassWise(db, studentClass) {
        try {
            let playlistId;
            let playlistIdResponse;
            if (config.caching) {
                playlistId = await redisQuestionContainer.getPlaylistIdClassWise(db.redis.read, studentClass);
                if (!_.isNull(playlistId)) {
                    return playlistId;
                }
                playlistIdResponse = await mysqlQuestionContainer.getPlaylistIdClassWise(db.mysql.read, studentClass);
                if (playlistIdResponse && playlistIdResponse.length > 0) {
                    playlistId = playlistIdResponse[0].id;
                    redisQuestionContainer.setPlaylistIdClassWise(db.redis.write, studentClass, playlistId);
                }
                return playlistId;
            }
            playlistIdResponse = await mysqlQuestionContainer.getPlaylistIdClassWise(db.mysql.read, studentClass);
            playlistId = playlistIdResponse[0].id;
            return playlistId;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    static async playlistView(db, page, questionId, userId) {
        try {
            let playlistView = await redisQuestionContainer.getStudentLastViewedQuestion(db.redis.write, userId, page);
            if (!_.isNull(playlistView)) {
                playlistView = JSON.parse(playlistView);
                playlistView.unshift(questionId);
            } else {
                playlistView = [];
                playlistView.push(questionId);
            }
            redisQuestionContainer.setStudentLastViewedQuestion(db.redis.write, userId, page, playlistView);
            return playlistView;
        } catch (e) {
            console.log(e);
            throw Error(e);
        }
    }

    // eslint-disable-next-line no-shadow
    static async getQuestionOptions(db, config, questionIdsArray, questionsArray) {
        try {
            let response;
            const optionsObj = {};
            if (config.caching) {
                response = await redisQuestionContainer.getQuestionArrOptions(db.redis.read, questionIdsArray);
                const fulfilledQids = [];
                let emptyResponses;
                for (let index = 0; index < response.length; index++) {
                    const element = response[index];
                    if (!_.isNull(element) && element) {
                        response[index] = JSON.parse(element);
                        fulfilledQids.push(String(response[index].question_id));
                    }
                }
                questionIdsArray = questionIdsArray.filter((val) => !fulfilledQids.includes(val));
                if (questionIdsArray.length) {
                    emptyResponses = await mysqlQuestionContainer.getQuestionArrOptions(db.mysql.read, questionIdsArray);
                    response = response.concat(emptyResponses);
                }
                await redisQuestionContainer.setQuestionArrOptions(db.redis.write, questionIdsArray, emptyResponses);
            } else {
                response = await mysqlQuestionContainer.getQuestionArrOptions(db.mysql.read, questionIdsArray);
            }
            response.forEach((element) => {
                if (element && element.question_id) {
                    optionsObj[element.question_id] = {
                        opt_1: element.opt_1,
                        opt_2: element.opt_2,
                        opt_3: element.opt_3,
                        opt_4: element.opt_4,
                    };
                }
            });

            questionsArray.forEach((question) => {
                if (optionsObj[question._id]) {
                    if (optionsObj[question._id].opt_1) {
                        question._source.ocr_text = `<div><p>${question._source.ocr_text}</p><br>(i) ${optionsObj[question._id].opt_1}`;
                        if (optionsObj[question._id].opt_2) {
                            question._source.ocr_text += `<br>(ii) ${optionsObj[question._id].opt_2}`;
                            if (optionsObj[question._id].opt_3) {
                                question._source.ocr_text += `<br>(iii) ${optionsObj[question._id].opt_3}`;
                                // eslint-disable-next-line no-unused-expressions
                                optionsObj[question._id].opt_4 ? question._source.ocr_text += `<br>(iv) ${optionsObj[question._id].opt_4}` : null;
                            }
                        }
                        question._source.ocr_text += '</div>';
                        question.question_thumbnail = 'https://dummyimage.png';
                        question.question_thumbnail_localized = 'https://dummyimage.png';
                    }
                }
            });
            return questionsArray;
        } catch (e) {
            console.error(e);
            return questionsArray;
        }
    }

    static async getFirstVideoOfPlaylist(db, playlistId) {
        try {
            let videoList = await redisQuestionContainer.getFirstVideoOfPlaylist(db.redis.read, playlistId);
            if (!_.isNull(videoList)) {
                videoList = JSON.parse(videoList);
            } else {
                videoList = await mysqlQuestionContainer.getFirstVideoOfPlaylist(db.mysql.read, playlistId);
                redisQuestionContainer.setFirstVideoOfPlaylist(db.redis.write, playlistId, videoList);
            }
            return videoList;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getNcertVideoOfPlaylist(db, playlistId) {
        try {
            let videoList = await redisQuestionContainer.getFirstVideoOfPlaylist(db.redis.read, playlistId);
            if (!_.isNull(videoList)) {
                videoList = JSON.parse(videoList);
            } else {
                videoList = await mysqlQuestionContainer.getFirstVideoOfNcertBook(db.mysql.read, playlistId);
                redisQuestionContainer.setFirstVideoOfPlaylist(db.redis.write, playlistId, videoList);
            }
            return videoList;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getVideoPageBranchDeeplinkFromAppDeeplink(db, questionID) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getVideoPageBranchDeeplinkFromAppDeeplink(db.redis.read, questionID);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'WEB_TO_APP', 'mWeb', `doubtnutapp://video?qid=${questionID}&page=LIVECLASS`);
            if (data) {
                redisQuestionContainer.setVideoPageBranchDeeplinkFromAppDeeplink(db.redis.write, questionID, data.url);
            }
            return data ? data.url : null;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getQuestionPackageInfo(db, studentId) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getQuestionPackageInfo(db.redis.read, studentId);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysqlQuestionContainer.getQuestionPackageInfo(db.mysql.read, studentId);
            if (data) {
                redisQuestionContainer.setQuestionPackageInfo(db.redis.write, studentId, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getChapterAliasData(db, chapter) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getChapterAlias(db.redis.read, chapter);
                if (!_.isNull(data)) {
                    return [{
                        chapter_alias: data,
                    }];
                }
            }
            if (!_.isNull(chapter) || !_.isEmpty(chapter)) {
                data = await mysqlQuestionContainer.getLatestChapteAlias(db.mysql.read, chapter);
                if (data.length > 0) {
                    data = data[0].chapter_alias;
                    redisQuestionContainer.setChapterAlias(db.redis.write, chapter, data);
                }
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getVideoType(db, questionId) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getVideoType(db.redis.read, questionId);
                if (!_.isNull(data)) {
                    return data;
                }
            }
            data = await mysqlQuestionContainer.checkVideoResourceExists(db.mysql.read, questionId);
            const videoType = data.length > 0 ? 'LF' : 'SF';
            redisQuestionContainer.setVideoType(db.redis.write, questionId, videoType);
            return videoType;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLiveDetailsByPlaylistId(db, playlistId) {
        let data = [];
        const redisData = await redisQuestionContainer.getLiveDataByplaylistId(db.redis.read, playlistId);
        if (!_.isNull(redisData)) {
            data = JSON.parse(redisData);
        } else {
            const playlistDetails = await QuestionModule.getDataByPlaylistId(db.mysql.read, playlistId);
            if (playlistDetails && playlistDetails.length > 0 && playlistDetails[0].is_active == 1 && playlistDetails[0].resource_path !== '' && playlistDetails[0].resource_path != null) {
                const query = playlistDetails[0].resource_path;
                const result = await db.mysql.read.query(query);
                if (result && result.length > 0) {
                    const questionIds = result.map((x) => x.question_id);
                    const liveDataRequestPromise = [];
                    questionIds.forEach((x) => {
                        liveDataRequestPromise.push(LiveClassMySql.getLiveVideoDetailsWithTeacherByResId(db.mysql.read, x));
                    });
                    const liveData = await Promise.all(liveDataRequestPromise);
                    const questionArr = liveData.map((x) => x[0]);

                    data = questionArr;
                    redisQuestionContainer.setLiveDataByplaylistId(db.redis.write, playlistId, data);
                }
            }
        }
        return data;
    }

    static async getVideoPageOverRideQueries(db, classVal, locale) {
        try {
            let data;
            const key = `videopage:qid:${classVal}:${locale}`;
            if (config.caching) {
                data = await redisCourse.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                    return [];
                }
                await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
                data = await mysqlCourse.getVideoPageOverRideQueries(db.mysql.read, classVal, locale);
                await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
                if (data.length) {
                    redisCourse.setRedisDataUsingKey(db.redis.write, key, data);
                }
                return data;
            }
            return mysqlCourse.getVideoPageOverRideQueries(db.mysql.read, classVal, locale);
        } catch (e) {
            console.log(e);
        }
    }

    static async getGuidanceVideo(db, limit) {
        try {
            let data;
            const key = `HOMEPAGE_GUIDANCE_VIDEO_${limit}`;
            if (config.caching) {
                data = await redisCourse.getRedisDataUsingKey(db.redis.read, key);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, key)) {
                    return [];
                }
                await redisUtility.setCacheHerdingKeyNew(db.redis.write, key);
                data = await mysqlQuestionContainer.getGuidanceVideo(db.mysql.read, limit);
                await redisUtility.removeCacheHerdingKeyNew(db.redis.write, key);
                if (data.length) {
                    redisCourse.setRedisDataUsingKey(db.redis.write, key, data);
                }
                return data;
            }
            return mysqlQuestionContainer.getGuidanceVideo(db.mysql.read, limit);
        } catch (e) {
            console.log(e);
        }
    }

    static async getQidThumbnailExpData(db, qid) {
        try {
            let data;
            if (config.caching) {
                data = await redisQuestionContainer.getQidThumbnailExperimentData(db.redis.read, qid);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysqlQuestionContainer.getQidThumbnailExperimentData(db.mysql.read, qid);
            redisQuestionContainer.setQidThumbnailExperimentData(db.redis.write, qid, data);
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLastAskedDetails(db, questionId) {
        let lastAskedDetails = [];
        lastAskedDetails = await redisQuestionContainer.mgetUserAskedQuestionData(db.redis.read, questionId, ['subject', 'chapter', 'ocr']);
        if (_.isNull(lastAskedDetails) || _.isNull(lastAskedDetails[0]) || _.isNull(lastAskedDetails[1]) || _.isNull(lastAskedDetails[2])) {
            lastAskedDetails = await mysqlQuestionContainer.getByQuestionIdFromAliased(db.mysql.read, questionId);
        } else {
            lastAskedDetails = [{
                subject: lastAskedDetails[0],
                chapter: lastAskedDetails[1],
                ocr_text: JSON.parse(lastAskedDetails[2]).ocr,
            }];
        }
        return lastAskedDetails;
    }
};
