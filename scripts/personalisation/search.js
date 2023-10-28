const elasticSearch = require('elasticsearch')

const client = new elasticSearch.Client({
    hosts: ['http://localhost:9200/siren']
})

const elasticResult = client.search({
    index: 'question_meta',
    // indices:['question_meta','video_view_stats'],
    type: 'meta_data',
    body: {
        query: {
            join: {
                indices: ["video_view_stats"],
                on: ["question_id", "question_id"],
                request: {
                    query: {
                        term: {
                            student_id: 1000
                        }
                    }
                }
            }
        },
        aggs:{
            'most_studied_subject':{    
                terms:{
                    field:'subject.keyword'
                },
                "aggs": {
                    "most studied_subject_chapter": {
                        "terms": {
                            "field": "chapter.keyword"
                        }
                    }
                }
            }
        }
    }
}, function (err, resp, status) {
    if (!err) {
        // console.log(resp);
        console.log("Most Studied Subject");
        console.log(resp['aggregations']['most_studied_subject']['buckets'][0]['key']);
    }
    else {
        console.log(err);
    }
})