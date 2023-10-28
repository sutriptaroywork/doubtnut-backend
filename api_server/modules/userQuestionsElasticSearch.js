module.exports = class UserQuestionsElasticSearch {
    constructor(client, config) {
        this.client = client;
        this.repoIndex = config.elastic.REPO_INDEX;
        this.repoIndexType = config.elastic.REPO_INDEX_TYPE;
    }

    addUserQuestionLogsToElastic(index_name, id, response) {
        return this.client.index({
            index: index_name,
            id,
            type: this.repoIndexType,
            body: response,
        });
    }

    // ADDING A GENERAL FUNCTION FOR NOW
    addToElasticIndex(index_name, id, obj) {
        return this.client.index({
            index: index_name,
            id,
            type: this.repoIndexType,
            body: obj,
        });
    }

    updateMatchedPositionToElastic(index_name, id, position) {
        return this.client.update({
            index: index_name,
            id,
            type: this.repoIndexType,
            body: {
                doc: {
                    match_position: position,
                    is_matched: 1,
                },
            },
        });
    }

    getChapterList(index_name, size) {
        const query = {
            aggs: {
                distinct_chapters: {
                    terms: {
                        field: 'chapter.keyword',
                        exclude: 'DEFAULT',
                        size,
                    },
                },
            },
        };
        return this.client.search({
            index: index_name,
            type: this.repoIndexType,
            size: 0,
            ignore: [400, 404],
            body: query,
        });
    }

    getUserQuestionsGroupedByStudentId(index_name, size, order = 'desc') {
        const query = {
            aggs: {
                distinct_studentids: {
                    terms: {
                        field: 'student_id',
                        order: {
                            _count: order,
                        },
                        size,
                    },
                },
            },
        };
        return this.client.search({
            index: index_name,
            type: this.repoIndexType,
            size: 0,
            ignore: [400, 404],
            body: query,
        });
    }

    getUserQuestionsByStudentId(index_name, size, filters) {
        const query = {
            query: {
                bool: {
                    must: {
                        match_all: {

                        },
                    },
                    filter: [...filters],
                },
            },
            sort: [
                {
                    timestamp: {
                        order: 'desc',
                    },
                },
            ],
        };
        return this.client.search({
            index: index_name,
            type: this.repoIndexType,
            size,
            ignore: [400, 404],
            body: query,
        });
    }

    getUserQuestionsByFilter(index_name, size, filters) {
        const query = {
            query: {
                bool: {
                    must: {
                        match_all: {

                        },
                    },
                    filter: [...filters],
                },
            },
            sort: [
                {
                    timestamp: {
                        order: 'desc',
                    },
                },
            ],
        };
        return this.client.search({
            index: index_name,
            type: this.repoIndexType,
            size,
            ignore: [400, 404],
            body: query,
        });
    }

    getById(index_name, qid) {
        return this.client.search({
            index: index_name,
            type: this.repoIndexType,
            body: {
                query: {
                    match: {
                        _id: qid,
                    },
                },
            },
        });
    }

    getByIds(elastic_index, doc_id_arr) {
        return this.client.mget({
            index: elastic_index,
            body: {
                ids: doc_id_arr,
            },
        });
    }

    getByOcr(index_name, ocr) {
        return this.client.search({
            index: index_name,
            ignore: [400, 404],
            type: this.repoIndexType,
            size: 100,
            body: {
                query: {
                    bool: {
                        must: {
                            match: {
                                ocr_text: {
                                    query: ocr,
                                    minimum_should_match: '0%',
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    addVideoViewForQid(index_name, user_question_id, video_view_obj, match_position) {
        return this.client.update({
            index: index_name,
            ignore: [400, 404],
            type: this.repoIndexType,
            id: user_question_id,
            body: {
                script: {
                    source: `ctx._source.videos_watched.add(params.video_view_obj);
                            if(ctx._source.match_position == null){ 
                                ctx._source.match_position = params.match_position;
                                ctx._source.is_matched = 1
                            } else if(ctx._source.match_position != null && ctx._source.match_position>params.match_position){ 
                                ctx._source.match_position = params.match_position;
                            }`,
                    lang: 'painless',
                    params: {
                        video_view_obj,
                        match_position,
                    },
                },
            },
        });
    }

    updateQuestionIdViewMetrics(index_name, user_question_id, video_view_question_id, video_time, engage_time) {
        const min_engage_time = "1";
        return this.client.update({
            index: index_name,
            ignore: [400, 404],
            type: this.repoIndexType,
            id: user_question_id,
            body: {
                script: {
                    source: `
                            for (int i=0;i<ctx._source.videos_watched.size();i++) {
                                    if (ctx._source.videos_watched[i].question_id == params.id) {  
                                        if (Long.parseLong(ctx._source.videos_watched[i].engage_time.toString()) <  Long.parseLong(params.min_engage_time.toString())) {
                                            ctx._source.v_ctr_et_gt_0 +=1
                                        }

                                        if (ctx._source.videos_watched[i].video_time < Long.parseLong(params.video_time.toString())) {
                                            ctx._source.videos_watched[i].video_time = Long.parseLong(params.video_time.toString())
                                        } 
                                        if (Long.parseLong(ctx._source.videos_watched[i].engage_time.toString()) < Long.parseLong(params.engage_time.toString())) {
                                            ctx._source.videos_watched[i].engage_time = Long.parseLong(params.engage_time.toString())
                                        }
                                    }
                                }
                    `,
                    lang: 'painless',
                    params: {
                        id: video_view_question_id.toString(),
                        engage_time,
                        video_time,
                        min_engage_time,
                    },
                },
            },
        });
    }

    updateLiveClassTabs(indexName, id, freeLiveClassList) {
        return this.client.update({
            index: indexName,
            id,
            type: this.repoIndexType,
            body: {
                doc: {
                    free_live_class_Tab: freeLiveClassList,
                },
            },
        });
    }
};
