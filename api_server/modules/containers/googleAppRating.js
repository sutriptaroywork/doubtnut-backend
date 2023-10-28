const _ = require('lodash');
const mysql = require('../mysql/googleAppRatingUsers');
const redis = require('../redis/student');
const config = require('../../config/config');

module.exports = class GoogleAppRating {
    static async checkUserAlreadySumbittedGoogleRating(db, studentId) {
        try {
            let data;
            if (!config.caching) {
                data = await mysql.checkUserAlreadySumbittedGoogleRating(db.mysql.read, studentId);
                if(!_.isEmpty(data)){
                    return true;
                }
                return false;
            }
            data = await redis.getUserGooglePlaystoreRatingActivity(db.redis.read,'PLAYSTORE_RATED_FLAG' ,studentId);
            if (!_.isNull(data)) {
                return parseInt(data);
            }
            data = await mysql.checkUserAlreadySumbittedGoogleRating(db.mysql.read, studentId);
            if (data.length > 0) {
                redis.setUserGooglePlaystoreRatingActivity(db.redis.write,'PLAYSTORE_RATED_FLAG',studentId, 1);
                return true;
            }else if(data.length == 0){
                redis.setUserGooglePlaystoreRatingActivity(db.redis.write,'PLAYSTORE_RATED_FLAG',studentId, 0);
                return false;
            }
        } catch (e) {
            console.log(e);
            return false;
        }
    }
};
