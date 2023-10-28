const thirtyDays = 30 * 24 * 60 * 60;

module.exports = class QuestionsMeta {
    static async getQuestionMetaWithMcText(question_id, client) {
        return client.hgetAsync(`QUESTION:${question_id}`, 'META');
    }

    static setQuestionMetaWithMcText(question, client) {
        return client.multi()
            .hset(`QUESTION:${question[0].question_id}`, 'META', JSON.stringify(question))
            .expire(`QUESTION:${question[0].question_id}`, thirtyDays)
            .execAsync();
    }

    static async getQuestionMetaWithMcTextWithLanguage(question_id, language, client) {
        return client.getAsync(`QUESTION:${question_id}`, `META:${language}`);
    }

    static setQuestionMetaWithMcTextWithLanguage(question, language, client) {
        return client.multi()
            .hset(`QUESTION:${question[0].question_id}`, `META:${language}`, JSON.stringify(question))
            .expire(`QUESTION:${question[0].question_id}`, thirtyDays)
            .execAsync();
    }

    static getQuestionWithMeta(question_id, client) {
        return client.hgetAsync('question_with_meta', question_id);
    }

    static setQuestionWithMeta(question, client) {
        return client.hsetAsync('question_with_meta', question[0].question_id, JSON.stringify(question));
    }

    static getQuestionMeta(question_id, client) {
        return client.hgetAsync('question_meta_info', question_id);
    }

    static setQuestionMeta(question, client) {
        return client.hsetAsync('question_meta_info', question[0].question_id, JSON.stringify(question));
    }
};
