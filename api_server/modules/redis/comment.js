// let Utility = require('./utility');
const expiry = 60 * 60; //  60 sec
const COMMENT_EXPIRY = 60 * 60 * 24 * 7;
// const COMMENT_COUNT_EXPIRY = 60*60*24*7;
const GCM_ID_EXPIRY = 60 * 60;
const todayEnd = new Date().setHours(23, 59, 59, 999);
const { ObjectId } = require('mongodb'); // or ObjectID

module.exports = class Comment {
    static getByEntityType(question_id, client) {
        return client.hgetAsync('comment', question_id);
    }

    static commentCountLeaderBoard(client, entity_id) {
        if (ObjectId.isValid(entity_id)) {
            return client.multi()
                .zadd('comment_count_leaderboard', 'INCR', 1, entity_id)
                .expireat('comment_count_leaderboard', parseInt(todayEnd / 1000))
                .execAsync();
        }
        return 1;
    }

    static setByEntityType(answer, client) {
        console.log('set question in redis');
        return client.hsetAsync('answers', answer[0].question_id, JSON.stringify(answer));
    }

    static getByMcId(mc_id, client) {
        return client.hgetAsync('answers_mc', mc_id);
    }

    static setByMcId(answer, client) {
        console.log('set question in redis');
        return client.hsetAsync('answers_mc', answer[0].doubt, JSON.stringify(answer));
    }

    static getUserCommentEntities(user_id, client) {
        return client.hgetAsync('user_comments', user_id);
    }

    static setUserCommentEntities(user_id, data, client) {
        return client.hgetAsync('user_comments', user_id, JSON.stringify(data));
    }

    static getCommentCount(type, id, client) {
        return client.getAsync(`comment_count_${type}_${id}`);
    }

    static deleteCommentCount(type, id, client) {
        return client.delAsync(`comment_count_${type}_${id}`);
    }

    static setCommentCount(type, id, data, client) {
        return client.multi()
            .set(`comment_count_${type}_${id}`, data.toString())
            .expireat(`comment_count_${type}_${id}`, parseInt((+new Date()) / 1000) + expiry)
            .execAsync();
    }

    static getTopComment(type, id, client) {
        return client.getAsync(`top_comment_${type}_${id}`);
    }

    static deleteTopComment(type, id, client) {
        return client.delAsync(`top_comment_${type}_${id}`);
    }

    static setTopComment(type, id, data, client) {
        return client.multi()
            .set(`top_comment_${type}_${id}`, JSON.stringify(data))
            .expireat(`top_comment_${type}_${id}`, parseInt((+new Date()) / 1000) + expiry)
            .execAsync();
    }

    static updateTopComment(type, id, comment, client) {
        return client.multi()
            .set(`top_comment_${type}_${id}`, JSON.stringify([comment]))
            .expireat(`top_comment_${type}_${id}`, parseInt((+new Date()) / 1000) + expiry)
            .execAsync();
    }

    static updateCommentCount(type, id, data, client) {
        return client.multi()
            .set(`comment_count_${type}_${id}`, JSON.stringify([data]))
            .expireat(`comment_count_${type}_${id}`, parseInt((+new Date()) / 1000) + expiry)
            .execAsync();
    }

    static getCommentCountByCommentor(type, id, studentID, client) {
        return client.getAsync(`comment_count_by_user${type}_${id}_${studentID}`);
    }

    static setCommentCountByCommentor(type, id, studentID, data, client) {
        const key = `comment_count_by_user${type}_${id}_${studentID}`;
        console.log(key, data);
        return client.multi()
            .set(key, data)
            .expireat(key, parseInt((+new Date()) / 1000) + COMMENT_EXPIRY)
            .execAsync();
    }

    static getCommentors(type, id, client) {
        return client.smembers(`commentors_${type}_${id}`);
    }

    static setCommentors(type, id, data, client) {
        const key = `commentors_${type}_${id}`;
        console.log('SETCOMMENTOR', key, ...data);
        return client.multi()
            .sadd(key, ...data)
            .expireat(key, parseInt((+new Date()) / 1000) + COMMENT_EXPIRY)
            .execAsync();
    }

    static removeCommentor(type, id, data, client) {
        const key = `commentors_${type}_${id}`;
        console.log('SREM', key, ...data);
        return client.multi()
            .srem(key, ...data)
            .expireat(key, parseInt((+new Date()) / 1000) + COMMENT_EXPIRY)
            .execAsync();
    }

    static getFeedGCMID(studentID, client) {
        return client.getAsync(`feed_gcm_id_${studentID}`);
    }

    static setFeedGCMID(studentID, data, client) {
        const key = `feed_gcm_id_${studentID}`;
        return client.multi()
            .set(key, data)
            .expireat(key, parseInt((+new Date()) / 1000) + GCM_ID_EXPIRY)
            .execAsync();
    }

    static getCommentTotalCount(type, id, client) {
        return client.getAsync(`comment_totalcount_${type}_${id}`);
    }

    static setCommentTotalCount(type, id, data, client) {
        const key = `comment_totalcount_${type}_${id}`;
        console.log(key, data);
        return client.multi()
            .set(key, data)
            .expireat(key, parseInt((+new Date()) / 1000) + COMMENT_EXPIRY)
            .execAsync();
    }

    static getAllDoubtsCount(client, key) {
        return client.getAsync(`ALLDOUBTS:${key}`);
    }

    static setAllDoubtsCount(client, key, data) {
        return client.multi()
            .set(`ALLDOUBTS:${key}`, JSON.stringify(data))
            .expire(`ALLDOUBTS:${key}`, 60 * 15)
            .execAsync();
    }
};
