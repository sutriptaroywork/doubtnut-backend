const _ = require('lodash');
// const config = require('../../config/config');
const mysqlFeedback = require('../mysql/feedback');
const redisFeedback = require('../redis/feedback');

module.exports = class Feedback {
    static async getFeedback(db, student_id, resource_type, resource_id) {
        try {
            let data;
            if (0) {
                data = await redisFeedback.getFeedback(student_id, resource_id, db.redis.read);
                if (!_.isNull(data)) {
                    // console.log("exist")
                    return JSON.parse(data);
                }
                data = await mysqlFeedback.getFeedback(db.mysql.read, student_id, resource_type, resource_id);
                if (data.length) {
                    await redisFeedback.setFeedback(student_id, resource_id, data, db.redis.write);
                }
                return data;
            }
            data = await mysqlFeedback.getFeedback(db.mysql.read, student_id, resource_type, resource_id);
            return data;
        } catch (e) {
            console.log(e);
            throw (e);
        }
    }
};
