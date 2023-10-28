module.exports = class dailyGoalElasticSearch {
    constructor(client, config) {
        this.client = client;
        this.liveClassRepoIndex = config.elastic.ELASTIC_DAILY_GOAL_INSTANCE.liveClassRepoIndex;
        this.videoRepoIndex = config.elastic.ELASTIC_DAILY_GOAL_INSTANCE.videoRepoIndex;
        this.pdfRepoIndex = config.elastic.ELASTIC_DAILY_GOAL_INSTANCE.pdfRepoIndex;
        this.repoIndexType = config.elastic.REPO_INDEX_TYPE;
        this.liveResultSize = '1';
        this.liveAskResultSize = '10';
        this.videoResultSize = '5';
        this.pdfResultSize = '5';
        this.subjectMapper = {
            MATHS: 'maths',
            REASONING: 'reasoning',
            GUIDANCE: 'guidance',
            'CHILD DEVELOPMENT AND PEDAGOGY': 'maths',
            SCIENCE: 'science',
            'GENERAL SCIENCE': 'science',
            ENGLISH: 'english',
            'ENGLISH (UP BOARD)': 'english',
            'ENGLISH(UP BOARD)': 'english',
            BOTANY: 'biology',
            BIOLOGY: 'biology',
            PHYSICS: 'physics',
            CHEMISTRY: 'chemistry',
            'ENGLISH GRAMMAR': 'english_grammar',
            'ENVIRONMENTAL STUDIES': 'environmental_studies',
            'SOCIAL SCIENCE': 'social_science',
            'GENERAL KNOWLEDGE': 'general_knowledge',
            'CHEMICAL BONDING (BASIC)': 'CHEMICAL BONDING',
        };
    }

    getResultFromElastic(obj) {
        const boolData = {
            filter: [
                { term: { subject: this.subjectMapper[obj.subject] } },
                { term: { chapter_name: obj.chapter } },
                { term: { is_free: true } },
            ],
        };
        const boostData = [
            { weight: 3.0, filter: { term: { class: obj.class } } },
            { weight: 3.0, filter: { term: { lang: obj.locale } } },
        ];
        if (obj.idArr) {
            boolData.must_not = [
                {
                    terms: {
                        src_id: obj.idArr,
                    },
                },
            ];
        }
        let resultSize = obj.askScreen ? this.liveAskResultSize : this.liveResultSize;
        let indexName = this.liveClassRepoIndex;
        if (obj.type === 'video') {
            indexName = this.videoRepoIndex;
            resultSize = this.videoResultSize;
        } else if (obj.type === 'pdf') {
            indexName = this.pdfRepoIndex;
            resultSize = this.pdfResultSize;
        }
        const bodyData = {
            sort: [
                {
                    src_id: {
                        order: 'desc',
                    },
                },
            ],
            query: {
                function_score: {
                    query: {
                        bool: boolData,
                    },
                    boost_mode: 'sum',
                    functions: boostData,
                },
            },
        };
        return this.client.search({
            index: indexName,
            size: resultSize,
            ignore: [400, 404],
            body: bodyData,
        });
    }
};
