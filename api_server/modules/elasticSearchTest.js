const moment = require('moment');

module.exports = class ElasticSearchTest {
    constructor(client, config) {
        this.client = client;
        this.repoIndex = config.elastic.REPO_INDEX;
        this.repoIndex1 = config.elastic.REPO_INDEX1;
        this.repoIndexWithOneShard = config.elastic.REPO_INDEX_WITH_SINGLE_SHARD;
        this.repoIndexPhysics = config.elastic.REPO_INDEX_PHYSICS;
        this.repoIndexChemistry = config.elastic.REPO_INDEX_CHEMISTRY;
        this.repoIndexBiology = config.elastic.REPO_INDEX_BIOLOGY;
        this.repoIndexNew = config.elastic.REPO_INDEX_NEW;
        this.repoIndexInAppSearch = config.elastic.REPO_INDEX_INAPP_SEARCH;
        this.repoIndexTypeInAppSearch = config.elastic.REPO_INDEX_TYPE_INAPP_SEARCH;
        this.repoIndexType = config.elastic.REPO_INDEX_TYPE;
        this.elasticResultSize = config.elastic.ELASTIC_RESULT_SIZE;
        this.elasticResultSizeNew = config.elastic.ELASTIC_RESULT_SIZE_NEW;
        this.bookFuzzyIndex = config.elastic.BOOK_FUZZY_INDEX;
        this.elasticGlobalFieldsIndex = config.elastic.REPO_INDEX_GLOBAL_FIELDS;
        this.elasticIndexUS = config.elastic.REPO_INDEX_USA;
        this.elastic_index_array = ['doubtnut_new', 'mathpix_v2_ocr', 'google_vision_ocr', 'mathpix_v1_ocr'];
    }

    // eslint-disable-next-line no-unused-vars
    findByOcrUsingIndex(ocr, index) {
        return this.client.search({
            index: this.repoIndexWithOneShard,
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
                                    minimum_should_match: '30%',
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    getAggAvailableChapters(sClass, subject) {
        const filters = [];
        if (sClass) {
            filters.push({
                term: {
                    'class.keyword': sClass,
                },
            });
        }
        if (subject) {
            filters.push({
                term: {
                    'subject.keyword': subject,
                },
            });
        }
        return this.client.search({
            index: this.elasticIndexUS,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        filter: filters,
                    },
                },
                aggs: {
                    distinct_chapters: {
                        terms: {
                            field: 'chapter_alias.keyword',
                            size: this.elasticResultSizeNew,
                        },
                    },
                },
            },
        });
    }

    getAggAvailableSubjects(sClass) {
        return this.client.search({
            index: this.elasticIndexUS,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    match: {
                        'class.keyword': sClass,
                    },
                },
                aggs: {
                    distinct_subjects: {
                        terms: {
                            field: 'subject.keyword',
                            size: this.elasticResultSizeNew,
                        },
                    },
                },
            },
        });
    }

    getAggStudentIdsContent(student_class, subject) {
        return this.client.search({
            index: this.elasticIndexUS,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        filter: [
                            {
                                term: {
                                    'class.keyword': student_class,
                                },
                            },
                            {
                                term: {
                                    'subject.keyword': subject,
                                },
                            },
                        ],
                    },
                },
                aggs: {
                    distinct_book_ids: {
                        terms: {
                            field: 'student_id',
                            size: this.elasticResultSizeNew,
                        },
                    },
                },
            },
        });
    }

    getAggAvailableExams(student_class) {
        const filters = [];
        if (student_class) {
            filters.push({
                term: {
                    'class.keyword': student_class,
                },
            });
        }
        return this.client.search({
            index: this.elasticIndexUS,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        filter: filters,
                    },
                },
                aggs: {
                    distinct_exams: {
                        terms: {
                            field: 'target_group',
                            size: this.elasticResultSizeNew,
                        },
                    },
                },
            },
        });
    }

    getByBookId(book_id, ocr) {
        if (ocr.length) {
            return this.client.search({
                index: this.elasticIndexUS,
                type: this.repoIndexType,
                size: 60,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    ocr_text: ocr,
                                },
                            },
                            filter: {
                                term: {
                                    student_id: book_id,
                                },
                            },
                        },
                    },
                },
            });
        }
        return this.client.search({
            index: this.elasticIndexUS,
            type: this.repoIndexType,
            size: 60,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match_all: {

                            },
                        },
                        filter: {
                            term: {
                                student_id: book_id,
                            },
                        },
                    },
                },
            },
        });
    }

    getByGlobalFilter(sClass, subject, chapter, exam, ocr) {
        const filters = [];
        let elastic_query;
        if (subject) {
            filters.push({
                term: {
                    'subject.keyword': subject,
                },
            });
        }

        if (sClass) {
            filters.push({
                term: {
                    'class.keyword': sClass,
                },
            });
        }

        if (chapter) {
            filters.push({
                term: {
                    'chapter_alias.keyword': chapter,
                },
            });
        }
        if (exam) {
            filters.push({
                term: {
                    target_group: exam,
                },
            });
        }
        if (ocr.length) {
            elastic_query = {
                index: this.elasticIndexUS,
                type: this.repoIndexType,
                size: 60,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match: {
                                    ocr_text: ocr,
                                },
                            },
                            filter: filters,
                        },
                    },
                },
            };
        } else {
            elastic_query = {
                index: this.elasticIndexUS,
                type: this.repoIndexType,
                size: 60,
                ignore: [400, 404],
                body: {
                    query: {
                        bool: {
                            must: {
                                match_all: {

                                },
                            },
                            filter: filters,
                        },
                    },
                },
            };
        }
        return this.client.search(elastic_query);
    }

    findByOcrUsingIndexTruncateTokens(index, ocr) {
        return this.client.search({
            index: this.repoIndexWithOneShard,
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
                                    minimum_should_match: '30%',
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    // eslint-disable-next-line no-unused-vars
    findByOcrUsingIndexNew(ocr, index) {
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');

            return this.client.search({
                index: this.repoIndexWithOneShard,
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
                                        minimum_should_match: '30%',
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        return this.client.search({
            index: this.repoIndexWithOneShard,
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
                                    minimum_should_match: '30%',
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

    async getElasticMatchesForSimilarByOcr(ocr, elastic_index, search_field_name) {
        const esIndex = elastic_index || this.repoIndexWithOneShard;
        const elasticQuery = {
            query: {
                bool: {
                    must: {
                        match: {
                            [search_field_name]: {
                                query: ocr,
                                minimum_should_match: '30%',
                            },
                        },
                    },
                },
            },
        };
        const elasticRequest = {
            index: esIndex,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: elasticQuery,
        };
        const elasticResults = await this.client.search(elasticRequest);
        elasticResults.elasticRequest = elasticQuery;
        return elasticResults;
    }

    async getElasticMatchesByOcr(ocr, elastic_index, search_field_name) {
        let elasticQuery; let elasticResults; let
            elasticRequest;
        const esIndex = elastic_index || this.repoIndexWithOneShard;
        const ocrArray = ocr.split(' ');
        if (ocrArray.length > this.maximum_ocr_text_allowed_length) {
            ocr = ocrArray.splice(0, this.maximum_ocr_text_allowed_length).join(' ');
            elasticQuery = {
                query: {
                    bool: {
                        must: {
                            match: {
                                [search_field_name]: {
                                    query: ocr,
                                    minimum_should_match: '30%',
                                },
                            },
                        },
                    },
                },
            };
            elasticRequest = {
                index: esIndex,
                type: this.repoIndexType,
                size: this.elasticResultSize,
                ignore: [400, 404],
                body: elasticQuery,
            };
            elasticResults = await this.client.search(elasticRequest);
            elasticResults.elasticRequest = elasticQuery;
            return elasticResults;
        }
        elasticQuery = {
            query: {
                bool: {
                    must: {
                        match: {
                            [search_field_name]: {
                                query: ocr,
                                minimum_should_match: '30%',
                            },
                        },
                    },
                    should: {
                        match_phrase: {
                            [search_field_name]: {
                                query: ocr,
                                slop: 3,
                            },
                        },
                    },
                },
            },
        };
        elasticRequest = {
            index: esIndex,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: elasticQuery,
        };
        elasticResults = await this.client.search(elasticRequest);
        elasticResults.elasticRequest = elasticQuery;
        return elasticResults;
    }

    getBooksSuggession(str, stu_class) {
        return this.client.search({
            index: this.bookFuzzyIndex,
            type: this.repoIndexType,
            size: this.elasticResultSize,
            ignore: [400, 404],
            body: {
                query: {
                    bool: {
                        must: {
                            match: {
                                book_name: str,
                            },
                        },
                        filter: {
                            term: {
                                class: stu_class,
                            },
                        },
                    },
                },
            },
        });
    }

    findOcrByUsIndex(ocr) {
        return this.client.search({
            index: this.elasticIndexUS,
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
                                    minimum_should_match: '30%',
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

    findDocumentsBulk(doc_id_arr, elastic_index) {
        const index_to_fetch = (typeof elastic_index !== 'undefined') ? elastic_index : this.elasticGlobalFieldsIndex;
        return this.client.mget({
            index: index_to_fetch,
            body: {
                ids: doc_id_arr,
            },
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

    liveclassSearch(text, studentClass) {
        const must = [];
        const filter = [];
        must.push({ match: { 'search_key.edgengram': { query: text, fuzziness: 2 } } });
        if (studentClass) {
            filter.push({ term: { class: studentClass } });
        }
        const body = { query: { bool: { must, filter } } };
        return this.client.search({
            index: 'liveclass_v2',
            type: this.repoIndexTypeInAppSearch,
            ignore: [400, 404],
            size: 80,
            body,
        });
    }

    addToElasticIndex(indexName, id, obj) {
        return this.client.index({
            index: indexName,
            id,
            type: this.repoIndexType,
            body: obj,
        });
    }

    findDnDocumentsByPackageLanguage(indexName, packageLanguage, assignedQids) {
        const query = {
            query: {
                function_score: {
                    query: {
                        bool: {
                            filter: [
                                {
                                    term: {
                                        package_language: packageLanguage,
                                    },
                                },
                                {
                                    exists: {
                                        field: 'duplicateTag',
                                    },
                                },
                            ],
                            must_not: [
                                {
                                    exists: {
                                        field: 'duplicateQuestionsTag',
                                    },
                                },
                                {
                                    terms: {
                                        key: assignedQids,
                                    },
                                },
                            ],
                        },
                    },
                    random_score: {},
                    boost_mode: 'replace',
                },
            },
        };
        return this.client.search({
            index: indexName,
            type: this.repoIndexType,
            size: 1,
            ignore: [400, 404],
            body: query,
        });
    }

    updateDuplicateQuestionsInElastic(indexName, body) {
        return this.client.bulk({
            index: indexName,
            type: 'repository',
            body,
        });
    }

    getDuplicateQidDetailsByUuid(indexName, uuid) {
        const query = {
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                'duplicateQuestionsTag.keyword': uuid,
                            },
                        },
                    ],
                },
            },
        };
        return this.client.search({
            index: indexName,
            type: this.repoIndexType,
            size: 20,
            ignore: [400, 404],
            body: query,
        });
    }

    removeDuplicateTagForDiscardedQids(indexName, uuid) {
        const query = {
            script: {
                source: "ctx._source.remove('duplicateQuestionsTag');",
            },
            query: {
                bool: {
                    must: [
                        {
                            match: {
                                'duplicateQuestionsTag.keyword': uuid,
                            },
                        },
                    ],
                },
            },
        };
        return this.client.updateByQuery({
            index: indexName,
            type: this.repoIndexType,
            ignore: [400, 404],
            body: query,
        });
    }
};
