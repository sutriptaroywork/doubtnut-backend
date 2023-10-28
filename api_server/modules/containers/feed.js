const _ = require('lodash')
const config = require('../../config/config')
// let Utility = require('./utility');
// let _ = require('./utility');
const mysqlFeed = require("../mysql/feed")
const mongoFeed = require("../mongo/feed")
const redisFeed = require("../redis/feed")
const milestoneMysql = require("../mysql/milestones")
const redisComment = require("../redis/comment")

const mongoose = require("mongoose");
const bluebird = require("bluebird");
bluebird.promisifyAll(mongoose);
require('../mongo/comment')
require('../mongo/post')

const Comment = mongoose.model("Comment");
const Post = mongoose.model("Post");
module.exports = class Feed {
    constructor() {
    }

    static async getFeedByUserId(user_id, db) {
        //first try to get from redis
        return new Promise(async function (resolve, reject) {
            // Do async job
            try {
                let feed
                if (config.caching) {
                    //getting feed from redis first
                    feed = await redisFeed.getFeedByUserId(user_id, db.redis.read)
                    if (!_.isNull(feed)) {
                        //console.log("exist")
                        return resolve(JSON.parse(feed))
                    } else {
                        //get from mysql and mongo
                        let promise = [];
                        promise.push(mysqlFeed.getLikesByUserId(user_id, db.mysql.read));
                        promise.push(mongoFeed.getCommentsByUserId(user_id, db.mongo));
                        Promise.all(promise).then(values => {
                            //to get the formatted array
                            var like = JSON.stringify(values[0]);
                            like = JSON.parse(like);
                            //groupt by entity_id making n object of like
                            like = _.groupBy(like, "entity_id");
                            var comment = JSON.stringify(values[1]);
                            comment = JSON.parse(comment);
                            comment = _.groupBy(comment, "entity_id")
                            var studentFeed = { like, comment }
                            if (values[0].length || values[1].length) {
                                redisFeed.setFeedByUserId(user_id, JSON.stringify(studentFeed), db.redis.write);
                            }
                            return resolve(studentFeed)
                        }).catch(err => {
                            //console.log(err)
                        })
                    }
                } else {
                    let promise = [];
                    promise.push(mysqlFeed.getLikesByUserId(user_id, db.mysql.read));
                    promise.push(mongoFeed.getCommentsByUserId(user_id, db.mongo));
                    Promise.all(promise).then(values => {
                        //to get the formatted array
                        var like = JSON.stringify(values[0]);
                        like = JSON.parse(like);
                        //groupt by entity_id making n object of like
                        like = _.groupBy(like, "entity_id");

                        var comment = JSON.stringify(values[1]);
                        comment = JSON.parse(comment);
                        comment = _.groupBy(comment, "entity_id")

                        var studentFeed = { like, comment }

                        if (values[0].length || values[1].length) {
                            redisFeed.setFeedByUserId(user_id, JSON.stringify(studentFeed), db.redis.write);
                        }
                        return resolve(studentFeed)
                    }).catch(err => {
                        //console.log(err)
                    })
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        })
    }

    static async getLikesByUserId(user_id, db) {
        return new Promise(async function (resolve, reject) {
            // Do async job
            try {
                let likes
                if (config.caching) {
                    //getting feed from redis first
                    likes = await redisFeed.getLikesByUserId(user_id, db.redis.read)
                    if (!_.isNull(likes)) {
                        //console.log("redis like")
                        return resolve(JSON.parse(likes));
                    } else {
                        //console.log("mysql like")
                        //get from mongo
                        let result = await mysqlFeed.getLikesByUserId(user_id, db.mysql.read);
                        //console.log("result")
                        //console.log(result)
                        let s = {}
                        if (result.length > 0) {
                            result.map(x => {
                                //console.log(x)
                                // let obj = {}
                                s[x.entity_id] = 1
                                return;
                            })
                            //console.log(s)
                            await redisFeed.setLikesByUserId(user_id, list, db.redis.write)
                            return resolve(list)
                        } else {
                            return resolve({})
                        }
                    }
                } else {
                    //get from mongo
                    let result = await mysqlFeed.getLikesByUserId(user_id, db.mysql.read);
                    if (result.length > 0) {
                        let list = result.map(x => {
                            let obj = {}
                            obj[x.entity_id] = 1
                            return obj
                        })

                        return resolve(list)
                    } else {
                        return resolve({})
                    }
                }
            } catch (err) {
                return resolve({})
            }
        })
    }

    static async getUserCommentEntities(user_id, db) {
        return new Promise(async function (resolve, reject) {
            // Do async job
            try {

                let topComment
                if (config.caching) {
                    //getting feed from redis first
                    topComment = await redisComment.getUserCommentEntities(user_id, db.redis.read)
                    if (!_.isNull(topComment)) {
                        return resolve(JSON.parse(topComment));
                    } else {
                        //get from mongo
                        let mongoComments = await Comment.find(getCommentQuery).distinct("entity_id")
                        if (mongoComments.length > 0) {
                            let list = mongoComments.map(x => {
                                //console.log(x)
                                let obj = {}
                                obj[x] = 1
                                return obj
                            })
                            await redisComment.setUserCommentEntities(user_id, list, db.redis.write)
                            return resolve(list)
                        } else {
                            return resolve({})
                        }
                    }
                } else {
                    //get from mongo
                    let mongoComments = await Comment.find(getCommentQuery).distinct("entity_id")
                    if (mongoComments.length > 0) {
                        let list = mongoComments.map(x => {
                            //console.log(x)
                            let obj = {}
                            obj[x] = 1
                            return obj
                        })
                        return resolve(list)
                    } else {
                        return resolve({})
                    }
                }
            } catch (err) {
                return resolve({})
            }
        })
    }

    static async getTopComment(entity_id, db) {
        //first try to get from redis
        return new Promise(async function (resolve, reject) {
            // Do async job
            try {

                let topComment
                if (config.caching) {
                    //getting feed from redis first
                    topComment = await redisFeed.getCommentByEntityId(entity_id, db.redis.read)
                    if (!_.isNull(topComment)) {
                        return resolve(JSON.parse(topComment));

                    } else {
                        //get from mysql and mongo
                        mongoFeed.getCommentsByEntityId(entity_id, db.mongo).then(topComment => {
                            topComment = _.groupBy(topComment, "entity_id");
                            if (topComment) {
                                redisFeed.setCommentByEntityId(entity_id, JSON.stringify(topComment), db.redis.write);
                            }
                            return resolve(topComment)
                        }).catch(err => {
                            //console.log(err)
                        });
                    }
                } else {

                }
            } catch (err) {

            }
        })
    }

    static async getMatchedQuestions(limit, page_no, student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getMatchedQuestions(limit, page_no, student_class, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log(" matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log(" matched Does not exist")
                        question = await mysqlFeed.getMatchedQuestions(limit, page_no, student_class, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setMatchedQuestions(limit, page_no, student_class, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getMatchedQuestions(limit, page_no, student_class, db.mysql.read);
                    // //console.log("2mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getEngagementQuestions(dn_logo, sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getEngagementQuestions(sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, db.redis.read);
                    // //console.log("Redis fetched:")
                    // //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log(" engagement exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getEngagementQuestions(dn_logo, sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, db.mysql.read);
                        // //console.log("3mysql fetched:");
                        // //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setEngagementQuestions(sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getEngagementQuestions(dn_logo, sclass, engagementLimit, productFeatureLimit, viralVideosLimit, page_no, db.mysql.read);
                    // //console.log("4mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                // //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            resolve([])
            // try {
            //     let question;
            //     if (config.caching) {
            //         question = await redisFeed.getCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, db.redis.read);
            //         // //console.log("Redis fetched:")
            //         // //console.log(question)

            //         if (!_.isNull(question)) {
            //             //console.log(" unanswered redis exists")
            //             return resolve(JSON.parse(question))
            //         }
            //         //else get from sql
            //         else {
            //             //console.log("unans Does not exist")
            //             question = await mysqlFeed.getCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, db.mysql.read);
            //             // //console.log("5mysql fetched:");
            //             // //console.log(question);

            //             if (question.length > 0) {
            //                 //set in redis
            //                 await redisFeed.setCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, question, db.redis.write);
            //             }

            //             return resolve(question);
            //         }
            //     }
            //     else {
            //         // //console.log(" does not exist")
            //         question = await mysqlFeed.getCommunityQuestionsForFeed(page_no, limit, question_credit, student_class, db.mysql.read);
            //         // //console.log("6mysql fetched");
            //         // //console.log(question);
            //         return resolve(question)
            //     }
            // }
            // catch (e) {
            //     // //console.log(e)
            //     reject(e)
            // }

        }); //end of promise callback
    }

    static async getAnsweredQuestion(page_no, limit, student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getAnsweredQuestion(page_no, limit, student_class, db.redis.read);
                    // //console.log("Redis fetched:")
                    // //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log(" redis ans exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("answer Does not exist")
                        question = await mysqlFeed.getAnsweredQuestion(page_no, limit, student_class, db.mysql.read);
                        // //console.log("5mysql fetched:");
                        // //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setAnsweredQuestion(page_no, limit, student_class, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getAnsweredQuestion(page_no, limit, student_class, db.mysql.read);
                    //console.log("6mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                // //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getAppBanners(student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (0) {
                    question = await redisFeed.getAppBanners(student_class, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getAppBanners(student_class, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setAppBanners(student_class, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getAppBanners(student_class, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getPreviousWinnerList(type, parameter, page_no, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            if (page_no > 1) {
                console.log("mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm")

                return resolve([])
            }
            try {
                let question;
                if (config.caching) {

                    question = await redisFeed.getPreviousWinnerList(type, parameter, page_no, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getPreviousWinnerList(type, parameter, page_no, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setPreviousWinnerList(type, parameter, page_no, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getPreviousWinnerList(type, parameter, page_no, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getMilestone(limit, page_no, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getMilestone(limit, page_no, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await milestoneMysql.getMilestone(limit, page_no, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setMilestone(limit, page_no, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await milestoneMysql.getMilestone(limit, page_no, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async getMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getMatchedQuestionsAfterViewID(question_id, student_class, matchedQuestionLimit, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async getCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            resolve([])
            // try {
            //     let question;
            //     if (config.caching) {
            //         question = await redisFeed.getCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, db.redis.read);
            //         //console.log("Redis fetched:")
            //         //console.log(question)

            //         if (!_.isNull(question)) {
            //             //console.log("exists")
            //             return resolve(JSON.parse(question))
            //         }
            //         //else get from sql
            //         else {
            //             //console.log("Does not exist")
            //             question = await mysqlFeed.getCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, db.mysql.read);
            //             //console.log("5mysql fetched:");
            //             //console.log(question);

            //             if (question.length > 0) {
            //                 //set in redis
            //                 await redisFeed.setCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, question, db.redis.write);
            //             }
            //             return resolve(question);
            //         }
            //     }
            //     else {
            //         //console.log(" does not exist")
            //         question = await mysqlFeed.getCommunityQuestionsForFeedAfterId(lastQuestionId, question_credit, limit, student_class, db.mysql.read);
            //         //console.log("6mysql fetched");
            //         //console.log(question);
            //         return resolve(question)
            //     }
            // } catch (e) {
            //     //console.log(e)
            //     reject(e)
            // }
        }); //end of promise callback
    }

    static async getAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getAnsweredQuestionAfterAnswerId(lastQuestionId, limit, student_class, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async getLikeCount(type, id, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getLikeCount(type, id, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getLikeCount(type, id, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setLikeCount(type, id, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getLikeCount(type, id, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async updateLikeCount(type, id, is_like, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getLikeCount(type, id, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {

                        // //console.log("exists")
                        // //console.log(question)
                        question = JSON.parse(question)
                        if (is_like == 1) {
                            question[0]['like_count'] = question[0]['like_count'] + 1
                        } else {
                            question[0]['like_count'] = question[0]['like_count'] - 1

                        }
                        // //console.log(question)
                        // //console.log(typeof question)
                        await redisFeed.setLikeCount(type, id, question, db.redis.write);
                        return resolve(question)
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        // question = await mysqlFeed.getLikeCount(type,id,db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);
                        question = [{ "like_count": 1 }]
                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setLikeCount(type, id, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getLikeCount(type, id, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async updateStudentLikes(type, id, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getLikeCount(type, id, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {

                        // //console.log("exists")
                        // //console.log(question)
                        question = JSON.parse(question)
                        question[0]['like_count'] = question[0]['like_count'] + 1
                        // //console.log(question)
                        // //console.log(typeof question)
                        await redisFeed.setLikeCount(type, id, question, db.redis.write);
                        return resolve(question)
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        // question = await mysqlFeed.getLikeCount(type,id,db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);
                        question = [{ "like_count": 1 }]
                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setLikeCount(type, id, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getLikeCount(type, id, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async getPreviousQuizWinnerList(page_no, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            if (page_no > 1) {
                console.log("noooooooooooooooooooooooooooooooooooooooooooooo")
                return resolve([])
            }
            try {
                let question;
                if (config.caching) {

                    question = await redisFeed.getPreviousQuizWinnerList(page_no, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)

                    if (!_.isNull(question)) {
                        //console.log("exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("Does not exist")
                        question = await mysqlFeed.getPreviousQuizWinnerList(page_no, db.mysql.read);
                        //console.log("5mysql fetched:");
                        //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setPreviousQuizWinnerList(page_no, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    //console.log(" does not exist")
                    question = await mysqlFeed.getPreviousQuizWinnerList(page_no, db.mysql.read);
                    //console.log("6mysql fetched");
                    //console.log(question);
                    return resolve(question)
                }
            } catch (e) {
                //console.log(e)
                reject(e)
            }
        }); //end of promise callback
    }

    static async getMyMatchedQuestions(student_id, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getMyMatchedQuestions(student_id, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")
                        question = await mysqlFeed.getMyMatchedQuestions(student_id, page_no, limit, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setMyMatchedQuestions(student_id, page_no, limit, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getMyMatchedQuestions(student_id, page_no, limit, db.mysql.read);
                    // //console.log("2mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getMyAnsweredQuestions(student_id, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getMyAnsweredQuestions(student_id, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")
                        question = await mysqlFeed.getMyAnsweredQuestions(student_id, page_no, limit, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setMyAnsweredQuestion(student_id, page_no, limit, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getMyAnsweredQuestions(student_id, page_no, limit, db.mysql.read);
                    // //console.log("2mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getMyCommunityQuestionsForFeed(student_id, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getMyCommunityQuestionsForFeed(student_id, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")
                        question = await mysqlFeed.getMyCommunityQuestionsForFeed(student_id, page_no, limit, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);

                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setMyCommunityQuestionsForFeed(student_id, page_no, limit, question, db.redis.write);
                        }

                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getMyCommunityQuestionsForFeed(student_id, page_no, limit, db.mysql.read);
                    // //console.log("2mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }

    static async getEngagementType(type, class1, dn_logo, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getEngagementType(type, class1, dn_logo, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")
                        question = await mysqlFeed.getEngagementType(type, class1, dn_logo, page_no, limit, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);
                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setEngagementType(type, class1, dn_logo, page_no, limit, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getEngagementType(type, class1, dn_logo, page_no, limit, db.mysql.read);
                    // //console.log("2mysql fetched");
                    // //console.log(question);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }

    static async getExtraFilterEngagement(type, class1, dn_logo, page_no, limit, db) {
        return new Promise(async function (resolve, reject) {

            try {
                let response;
                if (0) {
                    response = await redisFeed.getExtraFilter(type, class1, page_no, limit, db.redis.read);

                    if (!_.isNull(response)) {

                        return resolve(JSON.parse(response))
                    }
                    //else get from sql
                    else {

                        response = await mysqlFeed.getExtraFilter(type, class1, dn_logo, page_no, limit, db.mysql.read);
                        if (response.length > 0) {
                            //set in redis
                            await redisFeed.setExtraFilter(type, class1, page_no, limit, response, db.redis.write);
                        }
                        return resolve(response);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    response = await mysqlFeed.getExtraFilter(type, class1, dn_logo, page_no, limit, db.mysql.read);
                    return resolve(response)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }

    static async getUgcContent(class1, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            try {
                let question;
                let offset = (page_no == 1) ? 0 : parseInt(limit) * parseInt(--page_no)

                if (config.caching) {
                    question = await redisFeed.getUgcContent(class1, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        console.log("UGCCCCC")
                        // let query = {class_group:class1}
                        let query = { is_deleted: false }
                        let data = await Post.find(query).sort({ createdAt: -1 }).skip(parseInt(offset)).limit(limit);
                        console.log("data");
                        console.log(data);
                        if (data.length > 0) {
                            console.log("settting in db")
                            //set in redis
                            await redisFeed.setUgcContent(class1, page_no, limit, data, db.redis.write);
                        }
                        return resolve(data);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    let query = { class_group: class1 }
                    let data = await Post.find(query).sort({ createdAt: -1 }).skip(parseInt(offset)).limit(limit);
                    console.log("data");
                    console.log(data);          // //console.log("2mysql fetched");
                    return resolve(data)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }
    static async getUgcContentAfterId(id, class1, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            try {
                let question;
                // let offset = (page_no == 1) ? 0 : parseInt(limit) * parseInt(--page_no)

                if (config.caching) {
                    question = await redisFeed.getUgcContentAfterId(id, class1, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        // console.log("UGCCCCC")
                        // let query = {class_group:class1,'_id': {'$lt': id},is_deleted:false}
                        let query = { '_id': { '$lt': id }, is_deleted: false }
                        let data = await await Post.find(query).sort({ createdAt: -1 }).limit(limit);
                        console.log("data");
                        console.log(data);
                        if (data.length > 0) {
                            console.log("settting in db")
                            //set in redis
                            await redisFeed.setUgcContentAfterId(id, class1, page_no, limit, data, db.redis.write);
                        }
                        return resolve(data);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    let query = { '_id': { '$lt': id }, is_deleted: false }
                    let data = await Post.find(query).sort({ createdAt: -1 }).limit(limit);
                    console.log("data");
                    console.log(data);
                    return resolve(data)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }

    static async getUgcContentByStudentId(student_id, page_no, limit, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {
            try {
                let question;
                let offset = (page_no == 1) ? 0 : parseInt(limit) * parseInt(--page_no)

                if (0) {
                    question = await redisFeed.getUgcContentByStudentId(student_id, page_no, limit, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        console.log("UGCCCCC")
                        let query = { student_id: student_id, is_deleted: false }
                        let data = await await Post.find(query).sort({ createdAt: -1 }).skip(parseInt(offset)).limit(limit);
                        console.log("data");
                        console.log(data);
                        if (data.length > 0) {
                            //set in redis
                            await redisFeed.setUgcContentByStudentId(student_id, page_no, limit, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    console.log("UGCCCCCCCCCCCCCCCCCCCCCCCC")
                    let query = { student_id: student_id.toString(), is_deleted: false }
                    console.log(query)
                    console.log(offset)
                    console.log(limit)
                    let data = await Post.find(query).sort({ createdAt: -1 }).skip(parseInt(offset)).limit(limit);
                    console.log("data");
                    console.log(data);          // //console.log("2mysql fetched");
                    return resolve(data)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }
    static async getImageData(image_path, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getImageData(image_path, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")
                        question = await mysqlFeed.getImageData(image_path, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);
                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setImageData(image_path, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getImageData(image_path, db.mysql.read);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }
    static async getPinnedPost(student_class, filter, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (0) {
                    question = await redisFeed.getPinnedPost(student_class, filter, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")
                        question = await mysqlFeed.getPinnedPost(student_class, filter, db.mysql.read);
                        // //console.log("1mysql fetched:");
                        // //console.log(question);
                        if (question.length > 0) {
                            //set in redis
                            await redisFeed.setPinnedPost(student_class, filter, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    question = await mysqlFeed.getPinnedPost(student_class, filter, db.mysql.read);
                    return resolve(question)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback

    }


    static async isShowPinnedPost(student_id, filter, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let question;
                if (config.caching) {
                    question = await redisFeed.getIsShowPinnedPost(student_id, filter, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(question)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(question))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")

                        question = await mysqlFeed.getPinnedPost(student_id, filter, db.mysql.read);
                        console.log("1mysql fetched:");
                        console.log(question);
                        if (question.length > 0) {
                            //set in redis

                            await redisFeed.setIsShowPinnedPost(student_id, filter, question, db.redis.write);
                        }
                        return resolve(question);
                    }
                }
                else {
                    // //console.log(" does not exist")
                    // question = await mysqlFeed.getPinnedPost(student_id,filter,db.mysql.read);
                    return resolve([])
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

    static async getQuizWinner(type1, data_type, page, button, limit, student_class, db) {
        //first take from redis
        return new Promise(async function (resolve, reject) {

            try {
                let data;
                if (config.caching) {
                    data = await redisFeed.getQuizWinnerType(type1, student_class, db.redis.read);
                    //console.log("Redis fetched:")
                    //console.log(question)
                    if (!_.isNull(data)) {
                        //console.log("my matched redis exists")
                        return resolve(JSON.parse(data))
                    }
                    //else get from sql
                    else {
                        //console.log("my matched Does not exist")

                        data = await mysqlFeed.getQuizWinnerType(data_type, page, button, limit, student_class, db.mysql.read);
                        // console.log("1mysql fetched:");
                        // console.log(data);
                        if (data.length > 0) {
                            //set in redis

                            await redisFeed.setQuizWinnerType(type1, student_class, data, db.redis.write);
                        }
                        return resolve(data);
                    }
                }
                else {
                    console.log(" does not exist")
                    data = await mysqlFeed.getQuizWinnerType(data_type, page, button, limit, student_class, db.mysql.read);
                    return resolve(data)
                }
            }
            catch (e) {
                //console.log(e)
                reject(e)
            }

        }); //end of promise callback
    }

}
