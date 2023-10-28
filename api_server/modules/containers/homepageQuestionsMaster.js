const _ = require('lodash');
const mysql = require('../mysql/homepageQuestionsMaster');
const redis = require('../redis/homepageQuestionsMaster');

module.exports = class HomepageQuestionsMaster {
    static async getCachedTopicBoosterCategoryWiseData(db, config, widgetType, sclass, chapter) {
        try {
            if (!config.caching) {
                return mysql.getTopicBoosterCategoryWiseData(db.mysql.read, widgetType, sclass, chapter);
            }
            let data = await redis.getTopicBoosterCategoryWiseData(db.redis.read, widgetType, sclass, chapter);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
            data = await mysql.getTopicBoosterCategoryWiseData(db.mysql.read, widgetType, sclass, chapter);
            if (data.length) {
                redis.setTopicBoosterCategoryWiseData(db.redis.write, widgetType, sclass, chapter, JSON.stringify(data));
            }
            return data;
        } catch (e) {
            console.log(e);
            // throw (e);
        }
    }
};
