// const _ = require('lodash');
// let Utility = require('./utility');
// const hash_expiry = 60 * 60 * 24;
module.exports = class Feedback {
    static getFeedback(student_id, resource_id, client) {
        return client.getAsync(`feedback_similar_matched_${student_id}_${resource_id}`);
    }

    static setFeedback(student_id, resource_id, answer, client) {
        console.log('set question in redis');
        return client.set(`feedback_similar_matched_${student_id}_${resource_id}`, JSON.stringify(answer));
    }
};
