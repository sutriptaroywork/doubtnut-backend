function buildDoubtSuggestQuery(suggestionObj) {
    const query = {
        bool: {
            must: [],
            filter: [
                {
                    term: {
                        is_answered: 1,
                    },
                },
            ],
            should: [],
            must_not: [
                {
                    match: {
                        message: 'morning',
                    },
                },
                {
                    match: {
                        message: 'evening',
                    },
                },
            ],
        },
    };
    query.bool.filter.push({
        terms: {
            entity_id: [...suggestionObj.questionIds],
        },
    });

    // search using prefix msg
    if (suggestionObj.doubtMsg) {
        query.bool.should.push({
            match: {
                message: suggestionObj.doubtMsg,
            },
        });
    }

    // search around offset
    // if (suggestionObj.offset) {
    //     const searchOffset = parseInt(suggestionObj.offset);
    //     query.bool.filter.push({
    //         range: {
    //             offset: {
    //                 gte: searchOffset - 50,
    //                 lte: searchOffset + 50,
    //             },
    //         },
    //     });
    // }
    const queryBody = {
        query,
    };

    return queryBody;
}

function buildDoubtSuggestChapterQuery(suggestionObj) {
    const query = {
        bool: {
            must: [],
            filter: [
                {
                    term: {
                        isVod: 1,
                    },
                },
                {
                    term: {
                        is_answered: 1,
                    },
                },
            ],
            should: [],
            must_not: [
                {
                    match: {
                        message: 'morning',
                    },
                },
                {
                    match: {
                        message: 'evening',
                    },
                },
            ],
        },
    };

    query.bool.filter.push({
        term: {
            chapter: suggestionObj.chapter,
        },
    });

    query.bool.filter.push({
        term: {
            class: suggestionObj.studentClass,
        },
    });

    // search using prefix msg
    if (suggestionObj.doubtMsg) {
        query.bool.should.push({
            match: {
                message: suggestionObj.doubtMsg,
            },
        });
    }

    const queryBody = {
        query,
    };

    return queryBody;
}

module.exports = {
    buildDoubtSuggestQuery,
    buildDoubtSuggestChapterQuery,
};
