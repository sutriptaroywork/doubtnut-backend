/* eslint-disable camelcase */
// const _ = require('lodash')
const hash_expiry = 2;

module.exports = class studentWidgetLock {
    static checkIfStudentSubmitIsLock(client, student_id) {
        return client.hgetAsync('homepage-submit-locks', student_id);
    }

    static setLockForStudentSubmission(client, student_id) {
        const redisKey = student_id;
        return client.multi()
            .hset('homepage-submit-locks', redisKey, JSON.stringify(1))
            .expireat(redisKey, parseInt((+new Date()) / 1000) + hash_expiry)
            .execAsync();
    }

    static deleteStudentSubmitLock(client, student_id) {
        return client.hdelAsync('homepage-submit-locks', student_id);
    }
};
