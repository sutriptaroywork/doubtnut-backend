module.exports = class Brainly {
    static setQuestionData(qid, qData, client) {
        return client.hsetAsync('brainly_data', qid, JSON.stringify(qData));
    }

    static getQuestionData(qid, client) {
        return client.hgetAsync('brainly_data', qid);
    }

    static setQuestionDataWithUrl(url, qData, client) {
        return client.hsetAsync('brainly_data', url, JSON.stringify(qData));
    }

    static getQuestionDataWithUrl(url, client) {
        console.log('url', url);
        return client.hgetAsync('brainly_data', url);
    }

    static setSolData(qid, qData, client) {
        return client.hsetAsync('brainly_text_sol', qid, JSON.stringify(qData));
    }

    static getSolData(qid, client) {
        return client.hgetAsync('brainly_text_sol', qid);
    }
};
