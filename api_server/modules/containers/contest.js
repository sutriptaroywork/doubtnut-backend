/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../contest');
const DailyViewsRedis = require('../redis/daily_views');
const redis = require('../redis/contest');
// const redis = require("../redis/icons")
module.exports = class Contest {
    static async getLuckyDrawDetailsByParameter(db, parameter, date) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getLuckyDrawDetailsByParameter(db.redis.read, parameter, date);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getLuckyDrawDetailsByParameter(db.mysql.read, parameter, date);
            if (dataToReturn.length) {
                await redis.setLuckyDrawDetailsByParameter(db.redis.write, parameter, date, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getWinnersByParameter(db, parameter, date, courseID) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getWinnersByParameter(db.redis.read, parameter, date, courseID);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getWinnersByParameter(db.mysql.read, parameter, date, courseID);
            if (dataToReturn.length) {
                await redis.setWinnersByParameter(db.redis.write, parameter, date, courseID, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getAllWinnersByParameter(db, parameter, date) {
        try {
            let dataToReturn;
            if (config.caching) {
                dataToReturn = await redis.getAllWinnersByParameter(db.redis.read, parameter, date);
                if (!_.isNull(dataToReturn)) {
                    return JSON.parse(dataToReturn);
                }
            }
            dataToReturn = await mysql.getAllWinnersByParameter(db.mysql.read, parameter, date);
            if (dataToReturn.length) {
                await redis.setAllWinnersByParameter(db.redis.write, parameter, date, dataToReturn);
            }
            return dataToReturn;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }

    static async getCurrentWinnerListFromDailyViews(db, date, winnerCount, contestID) {
        try {
            const data = [];
            const topWinnerList = await DailyViewsRedis.getDailyViewsUsers(db.redis.read, date, 0, winnerCount + 10);
            for (let i = 0; i < topWinnerList.length; i++) {
                if (data.length <= winnerCount) {
                    if (i % 2 === 0) {
                        const userDetails = await mysql.checkDebarred(db.mysql.read, topWinnerList[i], contestID);
                        if (userDetails.length > 0 && userDetails[0].debarred == 0) {
                            data.push({
                                student_username: userDetails[0].student_username,
                                student_fname: userDetails[0].student_fname,
                                student_id: userDetails[0].student_id,
                                profile_image: userDetails[0].img_url,
                                video_count: parseInt(topWinnerList[i + 1]),
                            });
                        }
                    }
                }
            }
            return data;
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }
};
