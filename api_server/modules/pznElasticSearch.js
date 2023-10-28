module.exports = class PznElasticSearch {
    constructor(client, config) {
        this.client = client;
        this.elasticResultSize = config.elastic.ELASTIC_RESULT_SIZE_NEW;
        this.QuestionViewedIndex = 'student_question_daily';
    }

    searchPznQuestionIDs(studentId, page, pageSize) {
        return this.client.search({
            from: page * pageSize,
            size: pageSize,
            body: {
                query: {
                    bool: {
                        filter: {
                            bool: {
                                should: [
                                    {
                                        prefix: {
                                            doubt: { value: 'VOD' },
                                        },
                                    },
                                    {
                                        prefix: {
                                            doubt: { value: 'LC' },
                                        },
                                    },
                                ],
                                minimum_should_match: 1,
                            },
                        },
                        must: {
                            match: {
                                student_id: studentId,
                            },
                        },
                    },

                },
                sort: { created_date: 'desc' },
            },

        });
    }

    // Dummy Function
    searchTgCount(studentID) {
        // const { field } = data;
        const body = {
            query: {
                bool: {
                    must: [
                        { match: { student_id: studentID } },
                    ],
                },
            },
            aggs: {
                similar_videos: {
                    terms: {
                        field: 'target_group',
                        order: { _count: 'desc' },
                    },
                    aggs: {
                        total_watched: {
                            sum: {
                                field: 'watched',
                            },
                        },
                    },
                },
            },
        };
        console.log(body);
        return this.client.search({
            index: this.QuestionViewedIndex,
            size: 0,
            body,
        });
    }

    getMostWatchedLocales(studentID) {
        const body = {
            query: {
                bool: {
                    must: [
                        { match: { student_id: studentID } },
                    ],
                },
            },
            aggs: {
                most_watched: {
                    terms: {
                        field: 'language',
                        order: { _count: 'desc' },
                    },
                    aggs: {
                        total_watched: {
                            sum: {
                                field: 'watched',
                            },
                        },
                    },
                },
            },
        };
        return this.client.search({
            size: 0,
            body,
        });
    }

    getLatestWatchedVideoDetails(studentID) {
        const body = {
            query: {
                bool: {
                    must: [
                        { match: { student_id: studentID } },
                    ],
                },
            },
            sort: [
                {
                    created_date: {
                        order: 'desc',
                    },
                },
            ],
        };
        return this.client.search({
            size: 1,
            from: 0,
            body,
        });
    }

    getLatestWatchedVideoByPackageAndInterval(studentID, date, packages) {
        const body = {
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                student_id: studentID,
                            },
                        },
                        {
                            terms: {
                                package: packages,
                            },
                        },
                        {
                            range: {
                                created_date: {
                                    gte: date,
                                },
                            },
                        },
                    ],
                },
            },
            aggs: {
                group_by_package: {
                    terms: {
                        field: 'package',
                    },
                    aggs: {
                        top: {
                            top_hits: {
                                size: 1,
                                _source: ['student_id', 'question_id', 'package'],
                            },
                        },
                    },
                },
            },
        };
        return this.client.search({
            size: 0,
            body,
        });
    }

    getRecentlyWatchedVideosDetails(studentID) {
        const body = {
            query: {
                bool: {
                    must: [
                        { match: { student_id: studentID } },
                        { match: { book: 'LIVE CLASS' } },
                    ],
                },
            },
            sort: [
                {
                    created_date: {
                        order: 'desc',
                    },
                },
            ],
        };
        return this.client.search({
            size: 10,
            from: 0,
            body,
        });
    }
};
