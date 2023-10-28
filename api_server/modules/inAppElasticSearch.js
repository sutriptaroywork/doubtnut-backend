const Utility = require('./utility');
module.exports = class InAppElasticSearch {
    constructor(client, config) {
        this.client = client;
        this.repoIndexNew = config.elastic.REPO_INDEX_NEW;
        this.repoIndexInAppSearch = config.elastic.REPO_INDEX_INAPP_SEARCH;
        this.repoIndexInAppSearchMicro = config.elastic.REPO_INDEX_MICRO_INAPP_SEARCH;
        this.repoIndexInAppSearchSuggest = config.elastic.REPO_INDEX_INAPP_SEARCH_SUGGESTER;
        this.repoIndexTypeInAppSearch = config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH;
        this.repoIndexType = config.elastic.REPO_INDEX_TYPE;
        this.elasticResultSize = config.elastic.ELASTIC_RESULT_SIZE;
        this.maximum_ocr_text_allowed_length = 70; // 70 words
    }

    simpleSearchTopicswithNgram(ocr, data, isSuggest, isNgram, versionCode, studentClass, subject) {
        const { field } = data;
        const body = {};
        if (isSuggest) {
            body.suggest = {};
            body.suggest[this.repoIndexTypeInAppSearch] = {
                prefix: ocr,
                completion: {
                    field,
                },
            };
        }

        if (isNgram) {
            body.query = {};
            const must = [];
            let obj = {};
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
            if (versionCode > 681) {
                body.query = { bool: { must } };
            } else {
                body.query = { bool: { must, filter: { term: { isVip: false } } } };
            }
        }
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: this.repoIndexInAppSearch,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 30,
        //     body,
        // });
    }

    simpleSearchTopicswithNgramSuggest(ocr, data, isSuggest, isNgram, studentClass) {
        const { field } = data;
        const body = {};
        if (isSuggest) {
            body.suggest = {};
            body.suggest.in_app_search_suggester = {
                prefix: ocr,
                completion: {
                    field,
                },
            };
        }

        if (isNgram) {
            body.query = {};
            const must = [];
            let obj = {};
            if (ocr.search(/class 6|class 7|class 8|class 9/i) >= 0) {
                obj.match = { search_key: { query: ocr } };
            } else {
                obj.match = { 'search_key.edgengram': { query: ocr, fuzziness: 'AUTO' } };
            }
            must.push(obj);
            if (studentClass) {
                obj = {};
                obj.match = { class: studentClass };
                must.push(obj);
            }
            body.query = { bool: { must } };
        }
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: this.repoIndexInAppSearchSuggest,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 30,
        //     body,
        // });
    }

    getAutoSuggest(ocr, index) {
        const body = {};
        body.query = {};
        const must = [];
        const obj = {};
        if (ocr.search(/class 6|class 7|class 8|class 9/i) >= 0 || index === 'ias_shingle_suggester') {
            obj.match = { search_key: { query: ocr } };
        } else {
            obj.match = { 'search_key.edgengram': { query: ocr, fuzziness: 'AUTO' } };
        }
        must.push(obj);
        body.query = { bool: { must } };
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 30,
        //     body,
        // });
    }

    getIasNewAutoSuggest(ocr, index, size) {
        const body = {};
        body.query = {};
        const must = [];
        const obj = {};
        if (ocr.search(/class 6|class 7|class 8|class 9/i) >= 0 || index === 'ias_shingle_suggester') {
            obj.match = { search_key: { query: ocr } };
        } else {
            obj.match = { 'search_key.edgengram': { query: ocr, fuzziness: 'AUTO' } };
        }
        must.push(obj);
        body.query = { bool: { must } };
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size,
        //     body,
        // });
    }

    getIasAutoSuggest(ocr, index) {
        const body = { suggest: { ias_suggest: { prefix: ocr, completion: { field: 'text', size: 6 } } } };
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index,
        //     type: 'suggestions',
        //     ignore: [400, 404],
        //     body,
        // });
    }

    simpleSearchTopicswithNgramFacets(ocr) {
        const body = {};
        body.query = {};
        const must = [];
        let obj = {};
        obj.match = { search_key: { query: ocr, fuzziness: 1 } };
        must.push(obj);
        body.query = { bool: { must } };
        obj = {};
        obj.inAppSearchFacetsClass = { terms: { field: 'class' } };
        obj.inAppSearchFacetsSubject = { terms: { field: 'subject' } };
        obj.inAppSearchFacetsTabType = { terms: { field: 'tab_type' } };
        body.aggs = obj;
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: this.repoIndexInAppSearch,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 0,
        //     body,
        // });
    }

    findByOcrUsingIndexNew1(ocr, index) {
        const ocrArray = ocr.split(' ');
        return Utility.handleDeprecatedEmptyResponse();
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

    simpleSearchTopicswithNgramMultimatch(text, versionCode, studentClass, subject) {
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
        if (versionCode > 681) {
            return this.client.search({
                index: this.repoIndexInAppSearch,
                type: this.repoIndexTypeInAppSearch,
                ignore: [400, 404],
                size: 30,
                body: {
                    query: {
                        bool: {
                            must,
                        },
                    },
                },
            });
        }
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: this.repoIndexInAppSearch,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 30,
        //     body: {
        //         query: {
        //             bool: {
        //                 must,
        //                 filter: { term: { isVip: false } },
        //             },
        //         },
        //     },
        // });
    }

    simpleSearchTopics(text, versionCode, studentClass, subject) {
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
        if (versionCode > 681) {
            return this.client.search({
                index: this.repoIndexInAppSearch,
                type: this.repoIndexTypeInAppSearch,
                ignore: [400, 404],
                size: 30,
                body: {
                    query: {
                        bool: {
                            must,
                        },
                    },
                },
            });
        }
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: this.repoIndexInAppSearch,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 30,
        //     body: {
        //         query: {
        //             bool: {
        //                 must,
        //                 filter: { term: { isVip: false } },
        //             },
        //         },
        //     },
        // });
    }

    getIasDataById(id) {
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: this.repoIndexInAppSearchMicro,
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 1,
        //     body: {
        //         query: {
        //             match: {
        //                 id,
        //             },
        //         },
        //     },
        // });
    }

    async updateIasIndexById(id, data) {
        const base = { index: { _index: this.repoIndexInAppSearchMicro, _type: this.repoIndexTypeInAppSearch, _id: id } };
        const esObj = [];
        esObj.push(base);
        esObj.push(data);
        // await this.client.bulk({ body: esObj });
    }

    liveclassSearch(text, studentClass) {
        const must = [];
        const filter = [];
        must.push({ match: { 'search_key.edgengram': { query: text, fuzziness: 2 } } });
        if (studentClass) {
            filter.push({ term: { class: studentClass } });
        }
        const body = { query: { bool: { must, filter } } };
        return Utility.handleDeprecatedEmptyResponse();
        // return this.client.search({
        //     index: 'liveclass_v2',
        //     type: this.repoIndexTypeInAppSearch,
        //     ignore: [400, 404],
        //     size: 80,
        //     body,
        // });
    }
};
