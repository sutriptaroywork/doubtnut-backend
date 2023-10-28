const Utility = require('./utility');
module.exports = class LtrElasticSearch {
    constructor(client, config) {
        this.client = client;
        this.repoIndexUserQuestionsWithEt80 = config.elastic.REPO_INDEX_LTR_USER_QUESTIONS;
        this.repoIndexType = config.elastic.REPO_INDEX_TYPE;
    }

    getSimilarUserQuestions(config, ocr, user_locale, question_locale) {
        const filters = [];
        if (typeof user_locale !== 'undefined') {
            filters.push({
                term: {
                    user_locale,
                },
            });
        }

        if (typeof question_locale !== 'undefined') {
            filters.push({
                term: {
                    question_locale,
                },
            });
        }

        const query = {
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                ocr_text: {
                                    query: ocr,
                                    minimum_should_match: config.minimum_should_match,
                                },
                            },
                        },
                    ],
                    filter: filters,
                },
            },
        };
        // return this.client.search({
        //     index: this.repoIndexUserQuestionsWithEt80,
        //     type: this.repoIndexType,
        //     ignore: [400, 404],
        //     body: query,
        // });
        return Utility.handleDeprecatedEmptyResponse();
    }
};
