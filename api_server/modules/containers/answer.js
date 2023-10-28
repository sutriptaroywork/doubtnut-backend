const _ = require('lodash');
const moment = require('moment');
const config = require('../../config/config');
const Utility = require('../utility');
// let _ = require('./utility');
const mysqlAnswer = require('../mysql/answer');
const redisAnswer = require('../redis/answer');
const randomNumberGenerator = require('../randomNumberGenerator');
// const redisAnswer = require("../redis/answer")

module.exports = class Answer {
    static async getByQuestionId(question_id, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByQuestionId(question_id, db.redis.read);
                if (!_.isNull(answer)) {
                    return JSON.parse(answer);
                }
                answer = await mysqlAnswer.getByQuestionId(question_id, db.mysql.read);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setByQuestionId(answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getByQuestionId(question_id, db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByQuestionNewId(question_id, db) {
        try {
            const answer = await mysqlAnswer.getByQuestionNewId(question_id, db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByQuestionIdWithTextSolution(question_id, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByQuestionIdWithTextSolution(question_id, db.redis.read);
                if (!_.isNull(answer)) {
                    return JSON.parse(answer);
                }
                answer = await mysqlAnswer.getByQuestionIdWithTextSolution(question_id, db.mysql.read);
                if (answer.length > 0) {
                    redisAnswer.setByQuestionIdWithTextSolution(answer, db.redis.write);
                }
                return answer;
            }
            answer = await mysqlAnswer.getByQuestionIdWithTextSolution(question_id, db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByQuestionNewIdWithTextSolution(question_id, db) {
        try {
            const answer = await mysqlAnswer.getByQuestionIdNewWithTextSolution(question_id, db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getPreviousHistory() {
        return [];
    }

    static async getByMcId(mc_id, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByMcId(mc_id, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getByMcId(mc_id, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setByMcId(answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getByMcId(mc_id, db.mysql.read);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByMcIdWithTextSolution(mc_id, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByMcIdWithTextSolution(mc_id, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getByMcIdWithTextSolution(mc_id, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setByMcIdWithTextSolution(answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getByMcIdWithTextSolution(mc_id, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByQuestionIdWithLanguage(question_id, language, db) {
        // first try to get from redis
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByQuestionIdWithLanguage(question_id, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getByQuestionIdWithLanguage(question_id, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setByQuestionIdWithLanguage(answer, language, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getByQuestionIdWithLanguage(question_id, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByMcIdWithLanguage(mc_id, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByMcIdWithLanguage(mc_id, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getByMcIdWithLanguage(mc_id, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setByMcIdWithLanguage(answer, language, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getByMcIdWithLanguage(mc_id, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getSimilarQuestionsByMcId(mc_id, limit, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getSimilarQuestionsByMcId(mc_id, limit, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getSimilarQuestionsByMcId(mc_id, limit, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setSimilarQuestionsByMcId(mc_id, limit, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getSimilarQuestionsByMcId(mc_id, limit, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getList(db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getList(db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getList(db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setList(answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getList(db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async changeLanguage(qid, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.changeLanguage(qid, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.changeLanguage(qid, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setchangeLanguage(qid, language, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.changeLanguage(qid, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getJeeAdvanceSimilarVideos(doubt, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getJeeAdvanceSimilarVideos(doubt, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getJeeAdvanceSimilarVideos(doubt, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setJeeAdvanceSimilarVideos(doubt, language, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getJeeAdvanceSimilarVideos(doubt, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getJeeMainsSimilarVideos(doubt, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getJeeMainsSimilarVideos(doubt, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getJeeMainsSimilarVideos(doubt, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setJeeMainsSimilarVideos(doubt, language, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getJeeMainsSimilarVideos(doubt, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getXSimilarVideos(doubt, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getXSimilarVideos(doubt, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getXSimilarVideos(doubt, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setXSimilarVideos(doubt, language, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getXSimilarVideos(doubt, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getXIISimilarVideos(doubt, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getXIISimilarVideos(doubt, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getXIISimilarVideos(doubt, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setXIISimilarVideos(doubt, language, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getXIISimilarVideos(doubt, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getNcertSimilarVideos(doubt, language, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getNcertSimilarVideos(doubt, language, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getNcertSimilarVideos(doubt, language, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setNcertSimilarVideos(doubt, language, answer, db.redis.write);
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getNcertSimilarVideos(doubt, language, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getPackagesDetail(is_web, student_class, db) {
        try {
            let data;
            if (0) {
                data = await redisAnswer.getPackagesDetail(is_web, student_class, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // check in mysql
                data = await mysqlAnswer.getPackagesDetail(is_web, student_class, db.mysql.read);
                if (data.length > 0) {
                    redisAnswer.setPackagesDetail(is_web, student_class, data, db.redis.write);
                }
                return data;
            }
            data = await mysqlAnswer.getPackagesDetail(is_web, student_class, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getLevelOneWithLocation(is_web, class1, package_type, db) {
        try {
            let data;
            if (0) {
                data = await redisAnswer.getLevelOneWithLocation(is_web, class1, package_type, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // check in mysql
                data = await mysqlAnswer.getLevelOneWithLocation(is_web, class1, package_type, db.mysql.read);
                if (data.length > 0) {
                    redisAnswer.setLevelOneWithLocation(is_web, class1, package_type, data, db.redis.write);
                }
                return data;
            }
            data = await mysqlAnswer.getLevelOneWithLocation(is_web, class1, package_type, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getLevelOne(is_web, class1, package_type, db) {
        try {
            let data;
            if (0) {
                data = await redisAnswer.getLevelOne(is_web, class1, package_type, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // check in mysql
                data = await mysqlAnswer.getLevelOne(is_web, class1, package_type, db.mysql.read);
                if (data.length > 0) {
                    redisAnswer.setLevelOne(is_web, class1, package_type, data, db.redis.write);
                }
                return data;
            }
            data = await mysqlAnswer.getLevelOne(is_web, class1, package_type, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getLevelTwo(is_web, class1, package_type, level1, db) {
        try {
            let data;
            if (0) {
                data = await redisAnswer.getLevelTwo(is_web, class1, package_type, level1, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // check in mysql
                data = await mysqlAnswer.getLevelTwo(is_web, class1, package_type, level1, db.mysql.read);
                if (data.length > 0) {
                    redisAnswer.setLevelTwo(is_web, class1, package_type, level1, data, db.redis.write);
                }
                return data;
            }
            data = await mysqlAnswer.getLevelTwo(is_web, class1, package_type, level1, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getAllPackages(db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getAllPackages(db.redis.read);
                console.log('redis answer');
                console.log(data);
                if (!_.isNull(data)) {
                    console.log('exist');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysqlAnswer.getAllPackages(db.mysql.read);
                console.log('mysql data');
                console.log(data);
                if (data.length > 0) {
                    // set in redis
                    redisAnswer.setAllPackages(data, db.redis.write);
                }
                return data;
            }
            console.log(' not exist');
            data = await mysqlAnswer.getAllPackages(db.mysql.read);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getFirstLevel(package_name, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getFirstLevel(package_name, db.redis.read);
                console.log('redis answer');
                console.log(data);
                if (!_.isNull(data)) {
                    console.log('exist');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysqlAnswer.getFirstLevel(package_name, db.mysql.read);
                console.log('mysql data');
                console.log(data);
                if (data.length > 0) {
                    // set in redis
                    redisAnswer.setFirstLevel(package_name, data, db.redis.write);
                }
                return data;
            }
            console.log(' not exist');
            data = await mysqlAnswer.getFirstLevel(package_name, db.mysql.read);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getSecondLevel(package_name, level1, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getSecondLevel(package_name, level1, db.redis.read);
                console.log('redis answer');
                console.log(data);
                if (!_.isNull(data)) {
                    console.log('exist');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysqlAnswer.getSecondLevel(package_name, level1, db.mysql.read);
                console.log('mysql data');
                console.log(data);
                if (data.length > 0) {
                    // set in redis
                    redisAnswer.setSecondLevel(package_name, level1, data, db.redis.write);
                }
                return data;
            }
            console.log(' not exist');
            data = await mysqlAnswer.getSecondLevel(package_name, level1, db.mysql.read);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getDownloadLinks(package_name, level1, level2, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getDownloadLinks(package_name, level1, level2, db.redis.read);
                console.log('redis answer');
                console.log(data);
                if (!_.isNull(data)) {
                    console.log('exist');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysqlAnswer.getDownloadLinks(package_name, level1, level2, db.mysql.read);
                console.log('mysql data');
                console.log(data);
                if (data.length > 0) {
                    // set in redis
                    redisAnswer.setDownloadLinks(package_name, level1, level2, data, db.redis.write);
                }
                return data;
            }
            console.log(' not exist');
            data = await mysqlAnswer.getDownloadLinks(package_name, level1, level2, db.mysql.read);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getFirstLevelWeb(package_name, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getFirstLevelWeb(package_name, db.redis.read);
                console.log('redis answer');
                console.log(data);
                if (!_.isNull(data)) {
                    console.log('exist');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysqlAnswer.getFirstLevelWeb(package_name, db.mysql.read);
                console.log('mysql data');
                console.log(data);
                if (data.length > 0) {
                    // set in redis
                    redisAnswer.setFirstLevelWeb(package_name, data, db.redis.write);
                }
                return data;
            }
            console.log(' not exist');
            data = await mysqlAnswer.getFirstLevelWeb(package_name, db.mysql.read);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getSecondLevelWeb(package_name, level1, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getSecondLevelWeb(package_name, level1, db.redis.read);
                console.log('redis answer');
                console.log(data);
                if (!_.isNull(data)) {
                    console.log('exist');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log(' not exist');
                data = await mysqlAnswer.getSecondLevelWeb(package_name, level1, db.mysql.read);
                console.log('mysql data');
                console.log(data);
                if (data.length > 0) {
                    // set in redis
                    redisAnswer.setSecondLevelWeb(package_name, level1, data, db.redis.write);
                }
                return data;
            }
            console.log(' not exist');
            data = await mysqlAnswer.getSecondLevelWeb(package_name, level1, db.mysql.read);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    // GET PRE ADS
    static async getPreAds(db) {
        try {
            let data;

            if (0) {
                // check in redis
                data = await redisAnswer.getPreAds(db.redis.read);
                console.log('redis answer : ');
                console.log(data);

                if (!_.isNull(data)) {
                    console.log('data exists in redis');
                    return JSON.parse(data);
                }

                // get from mysql
                console.log('data does not exxist in redis!');
                data = await mysqlAnswer.getPreAds(db.mysql.read);

                console.log('mysql data : ');
                console.log(data);

                if (data.length > 0) {
                    // if data is valid set key in redis
                    await redisAnswer.setPreAds(data, db.redis.write);
                }

                return data;
            }

            console.log('caching not enabled');
            data = mysqlAnswer.getPreAds(db.mysql.read);

            console.log('mysql data');
            console.log(data);

            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    // GET POST ADS
    static async getPostAds(db) {
        try {
            let data;

            if (0) {
                // check in redis
                data = await redisAnswer.getPostAds(db.redis.read);
                console.log('redis answer : ');
                console.log(data);

                if (!_.isNull(data)) {
                    console.log('data exists in redis');
                    return JSON.parse(data);
                }

                // get from mysql
                console.log('data does not exxist in redis!');
                data = await mysqlAnswer.getPostAds(db.mysql.read);

                console.log('mysql data : ');
                console.log(data);

                if (data.length > 0) {
                    // if data is valid set key in redis
                    redisAnswer.setPostAds(data, db.redis.write);
                }

                return data;
            }

            console.log('caching not enabled');
            data = mysqlAnswer.getPostAds(db.mysql.read);

            console.log('mysql data');
            console.log(data);

            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    // GET TOT LIKES
    static async getTotLikes(question_id, db) {
        try {
            let data;
            if (config.caching) {
                // check in redis
                data = await redisAnswer.getTotLikes(question_id, db.redis.read);
                console.log('redis answer : ');
                console.log(data);

                if (!_.isNull(data)) {
                    console.log('data exists in redis');
                    return JSON.parse(data);
                }
                // get from mysql
                console.log('data does not exist in redis!');
                const newPromise = [];
                newPromise.push(mysqlAnswer.getTotLikes(question_id, db.mysql.read));
                newPromise.push(mysqlAnswer.getTotLikesWeb(question_id, db.mysql.read));

                const res = await Promise.all(newPromise);
                let totLikes = res[0][0].total_likes;
                totLikes += res[1][0].total_web_likes;

                const likeData = [];
                likeData.push({ total_likes: totLikes });

                likeData[0].total_likes = (likeData[0].total_likes == 0 ? 1 * 50 + Math.ceil((Math.random() * 10) + 1) : likeData[0].total_likes * 50 + Math.ceil((Math.random() * 10) + 1));
                await redisAnswer.setTotLikes(question_id, likeData, db.redis.write);

                return likeData;
            }
            const newPromise = [];
            newPromise.push(mysqlAnswer.getTotLikes(question_id, db.mysql.read));
            newPromise.push(mysqlAnswer.getTotLikesWeb(question_id, db.mysql.read));

            const res = await Promise.all(newPromise);
            let totLikes = res[0][0].total_likes;
            totLikes += res[1][0].total_web_likes;

            const likeData = [];
            likeData.push({ total_likes: totLikes });
            return likeData;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    // GET TOT LIKES
    static async getEngagementId(class1, question_id, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getEngagementId(class1, question_id, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                console.log('data does not exist in redis!');
                data = await mysqlAnswer.getEngagementId(class1, question_id, db.mysql.read);
                if (data.length > 0) {
                    // if data is valid set key in redis
                    redisAnswer.setEngagementId(class1, question_id, data, db.redis.write);
                }
                return data;
            }
            data = mysqlAnswer.getEngagementId(class1, question_id, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getPinnedPostId(class1, question_id, db) {
        try {
            let data;
            if (config.caching) {
                data = await redisAnswer.getPinnedPostId(class1, question_id, db.redis.read);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
                // get from mysql
                console.log('data does not exist in redis!');
                data = await mysqlAnswer.getPinnedPostId(class1, question_id, db.mysql.read);
                if (data.length > 0) {
                    // if data is valid set key in redis
                    redisAnswer.setPinnedPostId(class1, question_id, data, db.redis.write);
                }
                return data;
            }
            data = mysqlAnswer.getPinnedPostId(class1, question_id, db.mysql.read);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getAnswerTitleAndDescription(answerData, db) {
        try {
            let data;
            if (config.caching) {
                // check in redis
                data = await redisAnswer.getAnswerTitleAndDescription(answerData, db.redis.read);
                console.log('redis answer : ');
                console.log(data);

                if (!_.isNull(data)) {
                    console.log('data exists in redis');
                    return JSON.parse(data);
                }

                // get from mysql
                data = await Utility.metaDataFunction(answerData);
                if (data.length > 0) {
                    // if data is valid set key in redis
                    redisAnswer.setAnswerTitleAndDescription(answerData, data, db.redis.write);
                }
                return data;
            }

            data = await Utility.metaDataFunction(answerData);
            console.log('mysql data');
            console.log(data);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static generateWebUrl(questionId, urlText) {
        return `https://doubtnut.com/question-answer/${urlText}-${questionId}`;
    }

    static async getAnswerTitleAndDescription2(answerData, db) {
        try {
            let data;
            if (config.caching) {
                // check in redis
                data = await redisAnswer.getAnswerTitleAndDescription(answerData, db.redis.read);
                // console.log('redis answer : ');
                // console.log(data);

                if (!_.isNull(data)) {
                    // console.log('data exists in redis');
                    // return JSON.parse(data);
                    return this.generateWebUrl(answerData.question_id, data);
                }

                // get from mysql
                // data = await Utility.metaDataFunction(answerData);
                data = await mysqlAnswer.getWebUrl(answerData.question_id, db.mysql.read);
                if (data.length > 0) {
                    // const web_url = `https://doubtnut.com/question-answer/${data[0].url_text}-${answerData.question_id}`;
                    // if data is valid set key in redis
                    redisAnswer.setAnswerTitleAndDescription(answerData, data[0].url_text, db.redis.write);
                    // return web_url;
                    return this.generateWebUrl(answerData.question_id, data[0].url_text);
                }
                return '';
            }

            data = await mysqlAnswer.getWebUrl(answerData.question_id, db.mysql.read);
            // console.log('mysql data');
            if (data.length > 0) {
                // const web_url = `https://doubtnut.com/question-answer/${data[0].url_text}-${answerData.question_id}`;
                // return web_url;
                return this.generateWebUrl(answerData.question_id, data[0].url_text);
            }
            return '';
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getByQuestionIdLocalised(locale_val, version, question_id, db) {
        try {
            let answer;
            if (config.caching) {
                answer = await redisAnswer.getByQuestionIdLocalised(locale_val, version, question_id, db.redis.read);
                console.log('redis answer');
                console.log(answer);
                if (!_.isNull(answer)) {
                    console.log('exist');
                    return JSON.parse(answer);
                }
                // get from mysql
                console.log(' not exist');
                answer = await mysqlAnswer.getByQuestionIdLocalised(locale_val, question_id, db.mysql.read);
                console.log('mysql answer');
                console.log(answer);
                if (answer.length > 0) {
                    // set in redis
                    redisAnswer.setByQuestionIdLocalised(locale_val, version, answer, db.redis.write);
                    // return resolve(answer)
                }
                return answer;
            }
            console.log(' not exist');
            answer = await mysqlAnswer.getByQuestionIdLocalised(locale_val, question_id, db.mysql.read);
            console.log('mysql answer');
            console.log(answer);
            return answer;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getLikeDislikeStats(views, questionId, db) {
        try {
            // let answer;
            // if (config.caching) {
            //     // console.log("cahcingggggggggggggggg")
            //     answer = await redisAnswer.getLikeDislikeStats(question_id, db.redis.read);
            //     if (!_.isNull(answer)) {
            //         // console.log("exist")
            //         // console.log(answer)
            //         return JSON.parse(answer);
            //     }
            //     // console.log('222222222222222')
            //     // get from mysql
            //     const stats = [Math.floor(views * ((Math.floor(Math.random() * 5) + 1) / 20)), Math.floor(views * ((Math.floor(Math.random() * 5) + 1) / 500))];
            //     // set in redis
            //     redisAnswer.setLikeDislikeStats(stats, question_id, db.redis.write);
            //     return stats;
            // }
            return randomNumberGenerator.getLikeDislikeStatsNew(questionId);
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    // eslint-disable-next-line no-unused-vars
    static async getWhatsappShareStats(views, questionId, db) {
        try {
            return [randomNumberGenerator.getWhatsappShareStatsNew(questionId)];
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }

    static async getTagList(questionId, db) {
        try {
            if (!config.caching) {
                return await mysqlAnswer.getTagList(questionId, db.mysql.read);
            }
            let answer = await redisAnswer.getTagList(questionId, db.redis.read);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await mysqlAnswer.getTagList(questionId, db.mysql.read);
            if (answer) {
                redisAnswer.setTagList(questionId, answer, db.redis.write);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getVideoSummaryImage(db, questionId) {
        try {
            if (!config.caching) {
                return await mysqlAnswer.getImageSummary(db.mysql.read, questionId);
            }
            let image = await redisAnswer.getImageSummary(db.redis.read, questionId);
            if (!_.isNull(image)) {
                return JSON.parse(image);
            }
            image = await mysqlAnswer.getImageSummary(db.mysql.read, questionId);

            if (image) {
                redisAnswer.setImageSummary(db.redis.write, questionId, image);
            }
            return image;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getOcrtextByQid(db, qid) {
        try {
            if (!config.caching) {
                return mysqlAnswer.getQidSimilar(db.mysql.read, qid);
            }
            let answer = await redisAnswer.getQidSimilar(db.redis.read, qid);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await mysqlAnswer.getQidSimilar(db.mysql.read, qid);
            if (answer) {
                redisAnswer.setQidSimilar(db.redis.write, qid, answer);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getDataByChapterAlias(db, masterChapterAlias, sClass, packageList) {
        try {
            if (!config.caching) {
                return mysqlAnswer.getDataByChapterAlias(db.mysql.read, masterChapterAlias, sClass, packageList);
            }
            let answer = await redisAnswer.getDataByChapterAlias(db.redis.read, masterChapterAlias, sClass);
            if (!_.isNull(answer)) {
                return JSON.parse(answer);
            }
            answer = await mysqlAnswer.getDataByChapterAlias(db.mysql.read, masterChapterAlias, sClass, packageList);
            if (answer) {
                redisAnswer.setDataByChapterAlias(db.redis.write, answer, masterChapterAlias, sClass);
            }
            return answer;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static getSmartContentMsg(lang, userCount, type) {
        // let msg = `Check what ${userCount}+ students watched after this video`;
        if (type == 'normal') {
            let msg = `Kya dekha aapki class ke ${userCount}+ bachchon ne?`;
            if (lang === 'hi') {
                msg = `देखें कि इस वीडियो के बाद ${userCount}+ छात्रों ने क्या देखा`;
            }
            return msg;
        }
        if (type == 'liveclass') {
            let msg = `${userCount}+ students have already won more than 10 lakh by playing live class quiz!`;
            if (lang === 'hi') {
                msg = `${userCount} से अधिक छात्र पहले ही लाइव क्लास क्विज़ खेलकर 10 लाख से अधिक जीत चुके हैं!`;
            }
            return msg;
        }
    }

    static getNextVideoWatchUserCount() {
        let userCount = Math.ceil(Math.random() * 1000000);
        if (userCount < 100000) {
            userCount += (100000 - userCount);
        }
        return userCount;
    }

    static async getAdditionalUsersImages(users, length, student_id, database) {
        const userPics = await mysqlAnswer.getAdditionalPics(users, length, student_id, database);
        const userPicsArr = [];
        for (let i = 0; i < userPics.length; i++) {
            userPicsArr.push(userPics[i].img_url);
        }
        return userPicsArr;
    }

    static async getSmartContentData(req, student_id, db) {
        try {
            const { id: qid } = req.body;
            const smartData = await mysqlAnswer.getSmartData(qid, student_id, db.mysql.read);
            if (!_.isEmpty(smartData)) {
                const { next_question_id: next_qid } = smartData[0];
                // const { ccm_id, next_question_id: next_qid } = smartData[0];
                // let userPics = await mysqlAnswer.getUserPics(ccm_id, next_qid, db.mysql.read);
                // if (userPics.length < 3) {
                //     let userArr = '';
                //     if (userPics.length > 0) {
                //         userArr += userPics.map((x) => x.student_id.toString());
                //     }
                //     const userPics2 = await mysqlAnswer.getAdditionalPics(userArr, userPics.length, student_id, db.mysql.read);
                //     userPics = userPics.concat(userPics2);
                // }
                const userPicsArr = await this.getAdditionalUsersImages('', 0, student_id, db.mysql.read);
                const userCount = this.getNextVideoWatchUserCount();
                const msg = this.getSmartContentMsg(req.user.locale, userCount, 'normal');

                const returnValue = {
                    qid: next_qid,
                    thumbnail_url: `${config.staticCDN}q-thumbnail/${next_qid}.png`,
                    skip_secs: smartData[0].skip_second,
                    message: msg,
                    images: userPicsArr,
                };
                return returnValue;
            }
            return '';
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    static getAvgData(viewData) {
        let totTime = 0;
        let avgTime = 0;
        if (viewData && viewData.length > 0) {
            for (let i = 0; i < viewData.length; i++) {
                totTime += viewData[i].video_time;
            }
            avgTime = Math.ceil(totTime / (viewData.length));
        }
        return avgTime;
    }

    static async getAvgViewData(req, db) {
        try {
            const { id: qid } = req.body;
            let viewData;
            let avgTime = 0;
            if (!config.caching) {
                viewData = await mysqlAnswer.getViewData(db.mysql.read, qid);
                avgTime = this.getAvgData(viewData);
            } else {
                avgTime = await redisAnswer.getViewData(db.redis.read, qid);
                if (!_.isNull(avgTime)) {
                    return parseInt(avgTime);
                }
                viewData = await mysqlAnswer.getViewData(db.mysql.read, qid);
                avgTime = this.getAvgData(viewData);
                if (avgTime != 0) {
                    redisAnswer.setViewData(db.redis.write, qid, avgTime);
                }
            }
            return avgTime;
        } catch (err) {
            console.error(err);
            return 0;
        }
    }

    static async getVideoLocale(db, studentID) {
        try {
            if (!config.caching) {
                return mysqlAnswer.getVideoLocale(db.mysql.read, studentID);
            }
            let data = await redisAnswer.getVideoLocale(db.redis.read, studentID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysqlAnswer.getVideoLocale(db.mysql.read, studentID);
            if (data && config.caching) {
                redisAnswer.setVideoLocale(db.redis.write, studentID, data);
            }
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getAnswerVideoResource(db, answerID) {
        try {
            if (!config.caching) {
                return mysqlAnswer.getAnswerVideoResource(db.mysql.read, answerID);
            }
            let data = await redisAnswer.getAnswerVideoResource(db.redis.read, answerID);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysqlAnswer.getAnswerVideoResource(db.mysql.read, answerID);
            if (data && data.length) {
                redisAnswer.setAnswerVideoResource(db.redis.write, answerID, data);
            }
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getUsExam(db, questionId) {
        try {
            if (!config.caching) {
                return mysqlAnswer.getUsExam(db.mysql.read, questionId);
            }
            const redisKey = `us_exam_${questionId}`;
            let data = await redisAnswer.getUsExam(db.redis.read, redisKey);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysqlAnswer.getUsExam(db.mysql.read, questionId);
            if (data && data.length) {
                redisAnswer.setUsExam(db.redis.write, redisKey, data);
            }
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async getCommentCountByEntityTypeAndId(db, entity_type, entity_id) {
        try {
            const query = { entity_type, entity_id, is_deleted: false };
            if (!config.caching) {
                return db.mongo.read.collection('comments').count(query);
            }
            const redisKey = `COMMENTS_${entity_type}_${entity_id}`;
            let data = await redisAnswer.getAnswerComments(db.redis.read, redisKey);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await db.mongo.read.collection('comments').count(query);
            if (data && data.length) {
                redisAnswer.setAnswerComments(db.redis.write, redisKey, data);
            }
            return data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static async storeInHistory(db, qid, answerId, sid, video_time) {
        try {
            let qidList = await redisAnswer.getHistoryData(db.redis.read, sid);
            let flag = 0;

            if (!_.isNull(qidList)) {
                qidList = JSON.parse(qidList);
                qidList.forEach((item, index) => {
                    if (item.question_id == qid) {
                        flag = 1;
                        item.watched_time = video_time;
                        if (index != 0) {
                            const questionObj = item;
                            qidList.splice(index, 1);
                            qidList.unshift(questionObj);
                        }
                    }
                });
            }

            if (flag === 0) {
                const answerData = await mysqlAnswer.getDurationByAnswerId(db.mysql.read, answerId);
                const duration = _.get(answerData, '[0].duration', 0);

                const questionObj = {
                    question_id: qid,
                    watched_time: video_time,
                    total_time: parseInt(duration),
                };

                if (_.isNull(qidList)) {
                    qidList = [questionObj];
                } else {
                    qidList.unshift(questionObj);
                    if (qidList.length > 5) {
                        qidList = qidList.slice(0, 5);
                    }
                }
            }
            redisAnswer.setHistoryData(db.redis.write, sid, qidList);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    static setRedisLfEtTime(database, sid) {
        const viewTime = moment().add(6, 'h').add(30, 'minutes').unix();
        const bufferDay = moment().add(2, 'days').add(5, 'h').add(30, 'minutes')
            .unix();
        redisAnswer.setUserLiveClassWatchedVideo(database, sid, viewTime, 'LIVECLASS_VIDEO_LF_ET_TIME');
        redisAnswer.setUserLiveClassWatchedVideo(database, sid, bufferDay, 'LIVECLASS_VIDEO_LF_ET_BUFFER_TIME');
    }

    static async storeUserLiveClassWatchedVideo(db, qid, sid, videoTime, data) {
        try {
            let flag = 1;
            const [answerData, redisQidList] = await Promise.all([
                redisAnswer.getByQuestionIdWithTextSolution(qid, db.redis.read),
                redisAnswer.getUserLiveClassWatchedVideo(db.redis.read, sid, 'LIVECLASS_HISTORY'),
            ]);
            let qidList = [];
            if (!_.isNull(redisQidList) && redisQidList !== 'null') {
                qidList = JSON.parse(redisQidList);
                if (typeof qidList === 'string') {
                    qidList = [];
                }
            }

            if (qidList.length) { // if qid already exist shift to top
                qidList.forEach((item, index) => {
                    if (item.question_id == qid) {
                        this.setRedisLfEtTime(db.redis.write, sid); // add user timestamp based on usercategory
                        flag = 0;
                        item.watched_time = videoTime;
                        if (index != 0) {
                            const questionObj = item;
                            qidList.splice(index, 1);
                            qidList.unshift(questionObj);
                        }
                    }
                });
            }

            let duration = 0;
            if (!_.isNull(answerData)) {
                const ansData = JSON.parse(answerData);
                if (ansData[0].duration != null && ansData[0].duration != '' && ansData[0].duration != 0) {
                    duration = ansData[0].duration;
                }
            }

            if (flag && duration && data && data.length && data[0].class && data[0].display && data[0].is_free && data[0].subject && data[0].expert_image && data[0].expert_name) {
                this.setRedisLfEtTime(db.redis.write, sid); // add user timestamp based on usercategory
                const questionObj = {
                    question_id: qid,
                    watched_time: videoTime,
                    subject: data[0].subject,
                    class: data[0].class,
                    display: data[0].display,
                    expert_image: data[0].expert_image,
                    expert_name: data[0].expert_name,
                    total_time: parseInt(duration),
                };

                qidList.unshift(questionObj);
                qidList = qidList.slice(0, 5);
            }

            if (qidList.length && typeof qidList === 'object') {
                redisAnswer.setUserLiveClassWatchedVideo(db.redis.write, sid, qidList, 'LIVECLASS_HISTORY');
            }
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
};
