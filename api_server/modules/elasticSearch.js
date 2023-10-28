function callForData(match, should, filter, client, index, repoIndexType, elasticResultSize) {
    const body = {
        query: {
            bool: {
                must: {
                    match,
                },
            },
        },
    };

    if (should) {
        body.query.bool.should = should;
    }
    if (filter) {
        body.query.bool.filter = filter;
    }
    return client.search({
        index,
        type: repoIndexType,
        size: elasticResultSize,
        ignore: [400, 404],
        body,
    });
}
module.exports = class ElasticSearch {
    constructor(client, config) {
        this.client = client;
        this.repoIndex = config.elastic.REPO_INDEX;
        this.repoIndex1 = config.elastic.REPO_INDEX1;
        this.repoIndexPhysics = config.elastic.REPO_INDEX_PHYSICS;
        this.repoIndexChemistry = config.elastic.REPO_INDEX_CHEMISTRY;
        this.repoIndexBiology = config.elastic.REPO_INDEX_BIOLOGY;
        this.repoIndexNew = config.elastic.REPO_INDEX_NEW;
        this.repoIndexInAppSearch = config.elastic.REPO_INDEX_INAPP_SEARCH;
        this.repoIndexTypeInAppSearch = config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH;
        this.repoIndexType = config.elastic.REPO_INDEX_TYPE;
        this.elasticResultSize = config.elastic.ELASTIC_RESULT_SIZE;
        this.elasticResultSizeNew = config.elastic.ELASTIC_RESULT_SIZE_NEW;
        this.elastic_index_array = ['doubtnut_new', 'mathpix_v2_ocr', 'google_vision_ocr', 'mathpix_v1_ocr'];
        this.maximum_ocr_text_allowed_length = 70; // 70 words
        this.elasticKatexOcrsIndex = config.elastic.REPO_INDEX_KATEX_OCRS;
        this.elasticAdvanceSearchIndex = config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS;
        this.elasticMathpixResponseLogging = config.elastic.LOG_MATHPIX_RESPONSE;
    }

    findByOcr(ocr, wihtout_match_phrase_flag) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            return this.client.search({
                index: this.repoIndex,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    elastic_ocr: {
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
        if (typeof wihtout_match_phrase_flag !== 'undefined' || wihtout_match_phrase_flag) {
            return this.client.search({
                index: this.repoIndex,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    elastic_ocr: {
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
        return this.client.search({
            index: this.repoIndex,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match: {
                                elastic_ocr: {
                                    query: ocr,
                                    minimum_should_match: '0%',
                                },
                            },
                        },
                        should: {
                            match_phrase: {
                                elastic_ocr: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    checkForUserTaggedMatches(ocr) {
        return this.client.search({
            index: 'ltr_index',
            type: this.repoIndexType,
            size: 10,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match: {
                                user_ocr_text: {
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

    findByOcrUsingIndexNewWithoutPhrase(ocr, index) {
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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

    findByOcrUsingIndexNew2WithoutPhrase(ocr, index) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
        }
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSizeNew,
            ignore: [400, 404],
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

    getMeta(docs) {
        return this.client.mget({
            body: {
                docs,
            },
        });
    }

    findByOcrUsingIndex(ocr, index) {
        const ocrArray = ocr.split(' ');
        if (index === 'doubtnut_new') {
            if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
                ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
                return this.client.search({
                    index: this.repoIndex,
                    type: this.repoIndexType,
                    size: this.elasticResultSize,
                    ignore: [400, 404],
                    body: {
                        query: {
                            bool: {
                                must: {
                                    match: {
                                        elastic_ocr: {
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
            return this.client.search({
                index: this.repoIndex,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    elastic_ocr: {
                                        query: ocr,
                                        minimum_should_match: '0%',
                                    },
                                },
                            },
                            should: {
                                match_phrase: {
                                    elastic_ocr: {
                                        query: ocr,
                                        slop: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            return this.client.search({
                index,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
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
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        should: {
                            match_phrase: {
                                ocr_text: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexWithFilter2(ocr, index) {
        const ocrArray = ocr.split(' ');
        let match = {};
        let should = {};
        let filter = {};
        if (index === 'doubtnut_new') {
            if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
                ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');

                match = {
                    elastic_ocr: {
                        query: ocr,
                        minimum_should_match: '0%',
                    },
                };
                return callForData(match, should, filter, this.client, this.repoIndexNew, this.repoIndexType, this.elasticResultSize);
            }
            match = {
                elastic_ocr: {
                    query: ocr,
                    minimum_should_match: '0%',
                },
            };
            should = {
                match_phrase: {
                    elastic_ocr: {
                        query: ocr,
                        slop: 3,
                    },
                },
            };
            return callForData(match, should, filter, this.client, this.repoIndex, this.repoIndexType, this.elasticResultSize);
        }
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            match = {
                ocr_text: {
                    query: ocr,
                    minimum_should_match: '0%',
                },
            };
            filter = {
                term: {
                    is_answered: 1,
                },
            };
            return callForData(match, should, filter, this.client, index, this.repoIndexType, this.elasticResultSize);
        }
        match = {
            ocr_text: {
                query: ocr,
                minimum_should_match: '0%',
            },
        };
        should = {
            match_phrase: {
                ocr_text: {
                    query: ocr,
                    slop: 3,
                },
            },
        };
        filter = {
            term: {
                is_answered: 1,
            },
        };
        return callForData(match, should, filter, this.client, index, this.repoIndexType, this.elasticResultSize);
    }

    findByOcrUsingIndexNew(ocr, index) {
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        should: {
                            match_phrase: {
                                ocr_text: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexNew1(ocr, index) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');

            return this.client.search({
                index: this.repoIndexNew,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
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
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        should: {
                            match_phrase: {
                                ocr_text: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                        filter: {
                            term: {
                                is_answered: 1,
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexWithFilter(index, ocr, filter) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
        }
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        filter: {
                            terms: {
                                chapter: filter.chapters,
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexWithFilterV3(index, ocr, filter) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
        }

        const query_body = {
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        filter,
                    },
                },
            },
        };
        return this.client.search(query_body);
    }

    // iter with txt with filter - - - - - - - !!!!
    findByOcrUsingIndex2(ocr, index, flag) {
        const matchObj = {};
        matchObj[this.elastic_index_array[flag]] = {
            query: ocr,
        };
        if (flag === 0) {
            return this.client.search({
                index,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    ocr_text: {
                                        query: ocr,
                                    },
                                },
                            },
                            filter: {
                                term: {
                                    is_answered: 1,
                                },
                            },
                        },
                    },
                },
            });
        }
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match: matchObj,
                        },
                        filter: {
                            term: {
                                is_answered: 1,
                            },
                        },
                    },
                },
            },
        });
    }

    // iter with txt without filter  - - - - - - - - - -  !!!!
    findByOcrUsingIndex3(ocr, index, flag) {
        const matchObj = {};
        matchObj[this.elastic_index_array[flag]] = {
            query: ocr,
        };
        if (flag === 0) {
            return this.client.search({
                index,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    ocr_text: {
                                        query: ocr,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match: matchObj,
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexNew2(ocr, index) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            return this.client.search({
                index,
                type: this.repoIndexType,
                size: this.elasticResultSizeNew,
                ignore: [400, 404],
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
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSizeNew,
            ignore: [400, 404],
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
                        should: {
                            match_phrase: {
                                ocr_text: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexNField(ocr, index) {
        if (index === 'doubtnut_new') {
            return this.client.search({
                index: this.repoIndex,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    elastic_ocr: {
                                        query: ocr,
                                        minimum_should_match: '0%',
                                    },
                                },
                            },
                            should: {
                                match_phrase: {
                                    elastic_ocr: {
                                        query: ocr,
                                        slop: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        should: {
                            match_phrase: {
                                ocr_text: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrBySubject(ocr, subj) {
        let repo = '';
        if (subj === 'phy') {
            repo = this.repoIndexPhysics;
            return this.client.search({
                index: repo,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    search_ocr: {
                                        query: ocr,
                                        minimum_should_match: '0%',
                                    },
                                },
                            },
                            should: {
                                match_phrase: {
                                    search_ocr: {
                                        query: ocr,
                                        slop: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        if (subj === 'chem') {
            repo = this.repoIndexChemistry;
            return this.client.search({
                index: repo,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    search_ocr: {
                                        query: ocr,
                                        minimum_should_match: '0%',
                                    },
                                },
                            },
                            should: {
                                match_phrase: {
                                    search_ocr: {
                                        query: ocr,
                                        slop: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        if (subj === 'math') {
            repo = this.repoIndex;
            return this.client.search({
                index: repo,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    elastic_ocr: {
                                        query: ocr,
                                        minimum_should_match: '0%',
                                    },
                                },
                            },
                            should: {
                                match_phrase: {
                                    elastic_ocr: {
                                        query: ocr,
                                        slop: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        if (subj === 'bio') {
            repo = this.repoIndexBiology;
            return this.client.search({
                index: repo,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    search_ocr: {
                                        query: ocr,
                                        minimum_should_match: '0%',
                                    },
                                },
                            },
                            should: {
                                match_phrase: {
                                    search_ocr: {
                                        query: ocr,
                                        slop: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
    }

    findByOcrNew(ocr) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            return this.client.search({
                index: this.repoIndexNew,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
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
        return this.client.search({
            index: this.repoIndexNew,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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
                        should: {
                            match_phrase: {
                                ocr_text: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findByOcrUsingIndexTruncateTokens(index, ocr) {
        return this.client.search({
            index,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
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

    findByOcrUsingIndexTruncateTokensWithFilter(index, ocr) {
        let match = {};
        const should = {};
        let filter = {};
        match = {
            ocr_text: {
                query: ocr,
                minimum_should_match: '0%',
            },
        };
        filter = {
            term: {
                is_answered: 1,
            },
        };
        return callForData(match, should, filter, this.client, index, this.repoIndexType, this.elasticResultSize);
    }

    findByOcrService(ocr) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            return this.client.search({
                index: this.repoIndexNew,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
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
        return this.client.search({
            index: this.repoIndex,
            type: this.repoIndexType,
            size: 5,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match: {
                                elastic_ocr: {
                                    query: ocr,
                                    minimum_should_match: '0%',
                                },
                            },
                        },
                        should: {
                            match_phrase: {
                                elastic_ocr: {
                                    query: ocr,
                                    slop: 3,
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    findTopics(ocr, data, isSuggest, isNgram) {
        const { tab, field, ngramField } = data;
        const body = {};
        console.log(isSuggest);
        console.log(isNgram);
        if (isSuggest) {
            body.suggest = {};
            body.suggest[tab] = {
                prefix: ocr,
                completion: {
                    field,
                    fuzzy: {
                        fuzziness: 1,
                    },
                },
            };
        }
        if (isNgram) {
            body.query = {};
            body.query.match = {};
            body.query.match[ngramField] = ocr;
        }
        console.log(body);
        console.log(tab);
        return this.client.search({
            index: 'dn_topics',
            type: tab,
            ignore: [400, 404],
            body,
        });
    }

    findByMultiQuery(text) {
        // text = "*"+text+"*"
        const d = {
            query: {
                multi_match: {
                    query: text,
                    type: 'phrase',
                    fields: ['chapter^3', 'subtopic^2', 'mc_text'],
                    // "minimum_should_match": "0%",
                    // "fuzziness": 6
                },
            },
            highlight: {
                fields: {
                    chapter: {},
                    subtopic: {},
                    mc_text: {},
                },
            },
        };
        // const e = {
        //     query: {
        //         query_string: {
        //             query: text,
        //             // "type":"best_fields",
        //             fields: ['chapter^3', 'subtopic^2', 'mc_text'],
        //             minimum_should_match: '0%',
        //             fuzziness: 6,
        //             // }
        //         },
        //     },
        //     highlight: {
        //         fields: {
        //             chapter: {},
        //             subtopic: {},
        //             mc_text: {},

        //         },
        //     },
        // };
        const body = d;
        return this.client.search({
            index: 'topic_page',
            type: 'mc_course_mapping',
            size: 20,
            ignore: [400, 404],
            body,
        });
    }

    getMetaForQuestionIds(qidArr, elastic_index) {
        return this.client.mget({
            index: elastic_index,
            type: 'repository',
            ignore: [400, 404],
            body: {
                ids: qidArr,
            },
        });
    }

    simpleSearchTopicswithNgram(ocr, data, isSuggest, isNgram, studentClass, subject) {
        const { field } = data;
        const body = {};
        if (isSuggest) {
            body.suggest = {};
            body.suggest[this.repoIndexTypeInAppSearch] = {
                prefix: ocr,
                completion: {
                    field,
                    fuzzy: {
                        fuzziness: 2,
                    },
                },
            };
        }
        // const body = {};
        if (isNgram) {
            body.query = {};
            const must = [];
            let obj = {};
            // obj['match']={"search_key.edgengram":ocr}
            obj.match = { 'search_key.edgengram': { query: ocr, fuzziness: 'AUTO' } };
            must.push(obj);
            obj = {};
            obj.match = { class: studentClass };
            must.push(obj);
            if (subject) {
                obj = {};
                obj.match = { subject };
                must.push(obj);
            }
            body.query = { bool: { must } };
        }
        // console.log(body.query.bool.must);
        return this.client.search({
            index: this.repoIndexInAppSearch,
            type: this.repoIndexTypeInAppSearch,
            ignore: [400, 404],
            body,
        });
    }

    simpleSearchTopicswithNgramMultimatch(text, studentClass, subject) {
        const must = [{
            multi_match: {
                query: text,
                type: 'phrase_prefix',
                fields: ['search_key.edgengram^3', 'breadcrumbs^2', 'display'],
            },
        }];
        if (studentClass) {
            must.push({
                multi_match: {
                    query: studentClass,
                    type: 'best_fields',
                    fields: ['class'],
                },
            });
        }
        if (subject) {
            must.push({
                multi_match: {
                    query: subject,
                    type: 'best_fields',
                    fields: ['subject'],
                },
            });
        }

        return this.client.search({
            index: this.repoIndexInAppSearch,
            type: this.repoIndexTypeInAppSearch,
            ignore: [400, 404],
            size: 20,
            body: {
                query: {
                    bool: {
                        must,
                    },
                },
            },
        });
    }

    simpleSearchTopics(text, studentClass, subject) {
        const must = [{
            multi_match: {
                query: text,
                type: 'best_fields',
                fields: ['search_key^3', 'breadcrumbs^2', 'display'],
            },
        }];
        if (studentClass) {
            must.push({
                multi_match: {
                    query: studentClass,
                    type: 'best_fields',
                    fields: ['class'],
                },
            });
        }
        if (subject) {
            must.push({
                multi_match: {
                    query: subject,
                    type: 'best_fields',
                    fields: ['subject'],
                },
            });
        }
        return this.client.search({
            index: this.repoIndexInAppSearch,
            type: this.repoIndexTypeInAppSearch,
            ignore: [400, 404],
            size: 20,
            body: {
                query: {
                    bool: {
                        must,
                    },
                },
            },
        });
    }

    // ask question result without text solution
    findByOcrUsingIndexNew3(ocr, index) {
        const ocrArray = ocr.split(' ');
        let match = {};
        let should = {};
        let filter = {};
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');

            match = {
                ocr_text: {
                    query: ocr,
                    minimum_should_match: '0%',
                },
            };
            return callForData(match, should, filter, this.client, this.repoIndexNew, this.repoIndexType, this.elasticResultSize);
        }
        match = {
            ocr_text: {
                query: ocr,
                minimum_should_match: '0%',
            },
        };
        should = {
            match_phrase: {
                ocr_text: {
                    query: ocr,
                    slop: 3,
                },
            },
        };
        filter = {
            term: {
                is_answered: 1,
            },
        };
        return callForData(match, should, filter, this.client, index, this.repoIndexType, this.elasticResultSize);
    }

    getElasticDataByIndexAndId(index, type, id) {
        try {
            return this.client.search({
                index,
                type,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    _id: id,
                                },
                            },
                        },
                    },
                },
            });
        } catch (err) {
            return [];
        }
    }

    getkatexOcrsBulk(doc_id_arr) {
        return this.client.mget({
            index: this.elasticKatexOcrsIndex,
            body: {
                ids: doc_id_arr,
            },
        });
    }

    findDocumentsBulk(doc_id_arr, elastic_index_name) {
        return this.client.mget({
            index: elastic_index_name,
            body: {
                ids: doc_id_arr,
            },
        });
    }

    getAdvanceSearchEsResults(ocr_text, elasticIndexName = this.elasticAdvanceSearchIndex, filters = [], searchFieldName = 'ocr_text') {
        const query_body = {
            query: {
                bool: {
                    must: {
                        match: {
                            [searchFieldName]: {
                                query: ocr_text,
                                minimum_should_match: '0%',
                            },
                        },
                    },
                    filter: [...filters],
                },
            },
        };
        console.log(JSON.stringify(query_body));
        return this.client.search({
            index: elasticIndexName,
            type: this.repoIndexType,
            ignore: [400, 404],
            size: 20,
            body: query_body,
        });
    }

    addMathpixLogsToElastic(id, response) {
        return this.client.index({
            index: this.elasticMathpixResponseLogging,
            id,
            type: this.repoIndexType,
            body: response,
        });
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

    getUserQuestionsByStudentId(index_name, filters) {
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
                    source: 'ctx._source.videos_watched.add(params.video_view_obj);if(ctx._source.match_position == null){ ctx._source.match_position = params.match_position;ctx._source.is_matched = 1}',
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

};
