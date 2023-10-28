const keys = require('./keys');

module.exports = class QuestionsAskedRetryCounter {
    static getCount(client, questionId) {
        return client.getAsync(`${keys.questionsAskedRetryCounter.prefix}:${questionId}`);
    }

    static setCount(client, questionId) {
        if (typeof questionId !== 'undefined') {
            return client.setAsync(`${keys.questionsAskedRetryCounter.prefix}:${questionId}`, questionId, 'EX', keys.questionsAskedRetryCounter.expiry);
        }
    }
};
