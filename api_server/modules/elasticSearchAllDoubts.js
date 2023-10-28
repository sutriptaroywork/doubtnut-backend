module.exports = class ElasticSearchAllDoubts {
    constructor(client) {
        this.client = client;
        this.allDoubtsIndex = 'alldoubts';
        this.repoIndexType = 'doubts';
        this.doubtsSuggestionIndex = 'doubtsuggestions';
        this.elasticResultSize = 100;
        this.elasticResultSizeSuggestions = 100;
    }

    insertDoubt(doubtsData) {
        return this.client.index({
            index: this.allDoubtsIndex,
            type: this.repoIndexType,
            body: doubtsData,
        });
    }

    getByOriginalCommentId(originalCommentId) {
        return this.client.search({
            index: this.allDoubtsIndex,
            type: this.repoIndexType,
            body: {
                query: {
                    match: {
                        original_comment_id: originalCommentId,
                    },
                },
            },
        });
    }

    updateDoubt(objectId, updateData) {
        return this.client.update({
            index: this.allDoubtsIndex,
            id: objectId,
            type: this.repoIndexType,
            body: {
                doc: {
                    ...updateData,
                },
            },
        });
    }

    getDoubtsCount(queryBody) {
        return this.client.count({
            index: this.allDoubtsIndex,
            type: this.repoIndexType,
            body: queryBody,
        });
    }

    getDoubts(queryBody) {
        return this.client.search({
            index: this.allDoubtsIndex,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            body: queryBody,
        });
    }

    // suggester part
    insertDoubtSuggestion(suggestionData) {
        return this.client.index({
            index: this.doubtsSuggestionIndex,
            type: this.repoIndexType,
            body: suggestionData,
        });
    }

    getSuggestionByOriginalCommentId(originalCommentId) {
        return this.client.search({
            index: this.doubtsSuggestionIndex,
            type: this.repoIndexType,
            body: {
                query: {
                    match: {
                        original_comment_id: originalCommentId,
                    },
                },
            },
        });
    }

    getDoubtSuggestions(queryBody) {
        return this.client.search({
            index: this.doubtsSuggestionIndex,
            type: this.repoIndexType,
            size: this.elasticResultSizeSuggestions,
            body: queryBody,
        });
    }
};
