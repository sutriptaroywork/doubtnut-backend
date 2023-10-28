const hashExpiry = 60 * 60 * 24; // 1 day
const todaysDate = () => {
    const dt = new Date();
    return dt.toISOString().slice(0, 10);
};

module.exports = class PracticeEnglish {
    static async getQuestionIdsList(client) {
        return client.lrangeAsync('PracticeEnglish:QUESTIONS_LIST', 0, 4);
    }

    static setQuestionIdsList(client, questionIdsList) {
        return client.multi()
            .lpush('PracticeEnglish:QUESTIONS_LIST', ...questionIdsList.map((obj) => JSON.stringify(obj)))
            .expire('PracticeEnglish:QUESTIONS_LIST', hashExpiry)
            .execAsync();
    }

    static async getQuestionIdsListByDifficulty(client, difficulty) {
        return client.lrangeAsync(`PracticeEnglish:QUESTIONS_LIST:${difficulty}`, 0, -1);
    }

    static setQuestionIdsListByDifficulty(client, questionIdsList, difficulty) {
        return client.multi()
            .lpush(`PracticeEnglish:QUESTIONS_LIST:${difficulty}`, ...questionIdsList.map((obj) => JSON.stringify(obj)))
            .expire(`PracticeEnglish:QUESTIONS_LIST:${difficulty}`, hashExpiry)
            .execAsync();
    }

    static removeQuestionIdsList(client) {
        client.delAsync('PracticeEnglish:QUESTIONS_LIST:1');
        client.delAsync('PracticeEnglish:QUESTIONS_LIST:2');
        client.delAsync('PracticeEnglish:QUESTIONS_LIST:3');
        return client.delAsync('PracticeEnglish:QUESTIONS_LIST');
    }

    static getQuestionById(client, questionId) {
        return client.hgetAsync(`PracticeEnglish:${questionId}`, 'QUESTION');
    }

    static setQuestionById(client, question) {
        return client.multi()
            .hset(`PracticeEnglish:${question[0].question_id}`, 'QUESTION', JSON.stringify(question))
            .expire(`PracticeEnglish:${question[0].question_id}`, hashExpiry * 3)
            .execAsync();
    }

    static removeQuestionById(client, questionId) {
        return client.delAsync(`PracticeEnglish:${questionId}`);
    }

    static setReminderForStudent(client, studentId, gcmRegId) {
        const key = `PracticeEnglish:REMINDERS:${todaysDate()}`;
        return client.multi()
            .sadd(key, JSON.stringify({ studentId, gcmRegId }))
            .expire(key, hashExpiry * 7)
            .execAsync();
    }

    static setUserKeyPE(client, studentId, redisKey, value) {
        // 25 min cooldown
        return client.multi()
            .hset(`USER:PROFILE:${studentId}`, redisKey, JSON.stringify(value))
            .expire(`USER:PROFILE:${studentId}`, 60 * 25)
            .execAsync();
    }

    static getUserKeyPE(client, studentId, redisKey) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, redisKey);
    }

    static setQuestionSet(client, studentId, redisKey, value) {
        return client.multi()
            .hset(`USER:PROFILE:${studentId}`, redisKey, JSON.stringify(value))
            .expire(`USER:PROFILE:${studentId}`, hashExpiry)
            .execAsync();
    }

    static getNextQuestionFromSet(client, redisKey, offset, limit) {
        return client.lrangeAsync(redisKey, offset, offset + limit);
    }
};
