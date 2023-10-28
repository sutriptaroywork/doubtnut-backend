// connection to elastic client
const elasticSearch = require('elasticsearch')
const mysql = require('mysql')
const bluebird = require('bluebird')
const _ = require('lodash')
const redis = require('redis')
bluebird.promisifyAll(redis);
const redisClient = redis.createClient();

// let csvFilePath = __dirname+'/asciiToText.csv';
// let asciiSpaceCsvFilePath = __dirname+'/asciiBoundaries.csv';
const client = new elasticSearch.Client({
    // hosts: ['https://search-testes-il5xtod6iztuszqoifatqu5qam.ap-south-1.es.amazonaws.com']
    hosts: ['https://vpc-in-app-search-npbx5j4pmddu6pbegbamkj4r6i.ap-south-1.es.amazonaws.com']
})
const con = {
    host: "XXX",
    user: "XXX",
    password: "XXX",
    database: "XXX"
}
const index_name = "book_fuzzy_index_with_class"
const type_name = "repository"
main(mysql, con)

async function main(mysql, con) {
        let query1 = "Select a.*, b.student_id,b.class from(SELECT * FROM `studentid_package_mapping`) as a left join (select class, student_id from questions where student_id <100 and (is_answered=1 or is_text_answered=1) group by class,student_id) as b on a.student_id=b.student_id where b.student_id is not null";
        let mysqlClient = await createConnection(mysql, con)
        let metaResults = await getDataFromSql(query1, mysqlClient)
        // await redisClient.setAsync(index_name, JSON.stringify(metaResults));
        mysqlClient.end();
    // }
    console.log(metaResults)
    let bulkData = recursiveBulkInsert(metaResults);
    // let bookname = "cc kerma"
    // let results = await query2(client,bookname,0,1)
    // console.log(results.hits.hits)
    return;
}



function query(client, text){
    return client.search({
        index: "book_fuzzy_index_with_class",
        type: "repository",
        size: 5,
        ignore: [400, 404],
        body: {
            query: {
              "match": {
                "book_name": {
                  "query": text,
                  "fuzziness": 1
                }
            },
            filter: {
                term: {
                    class: 12,
                },
            },
            }
        },
    });
}
function query2(client, text, suggest, edgeN){
    if(suggest){
        return client.search({
            index: "book_fuzzy_index2",
            type: "repository",
            size: 5,
            ignore: [400, 404],
            body: {
                suggest: {
                  "book_name": {
                    "prefix": text,
                    "completion" : {
                      "field": "book_name.completion",
                      "fuzzy" : {
                          "fuzziness": 1
                      }
                    }
                  }
                }
            },
        });
    }
    if(edgeN){
        return client.search({
            index: "book_fuzzy_index2",
            type: "repository",
            size: 5,
            ignore: [400, 404],
            body: {
                query: {
                  "match": {
                    "book_name.edgengram": {
                      "query": text,
                      "fuzziness": 4
                    }
                  }
                }
            },
        });
    }
    return client.search({
        index: "book_fuzzy_index2",
        type: "repository",
        size: 5,
        ignore: [400, 404],
        body: {
            query: {
              "match": {
                "book_name": {
                  "query": text,
                  "fuzziness": 1
                }
              }
            }
        },
    });
}


function createConnection(mysql, con) {
    return new Promise(function (resolve, reject) {
        var connection = mysql.createConnection(con)
        connection.connect(function (err) {
            if (err) {
                console.error('error connecting: ' + err.stack)
                reject(err)
            }
            console.log('connected as id ' + connection.threadId)
            resolve(connection)
        });
    })
}

//get question meta data
// Array.prototype.flatMap = function(f) {
//   return flatMap(f,this)
// }
function getDataFromSql(query, mysqlClient) {
    return new Promise(function (resolve, reject) {
        mysqlClient.query(query, function (error, results, fields) {
            if (error) reject(error);
            // connected!
            resolve(results)
        });
    })
}

async function index_meta(dataset){
    return new Promise( async( resolve, reject ) => {
        try{
            let d = []
            console.log('dataset length = ' + dataset.length)
            for (let i = 0; i < dataset.length; i++) {

                 let bookName = dataset[i].package
                 let student_class = dataset[i].class
                 if(!_.isEmpty(bookName)){
                     ;
                    let json = {"book_name": bookName, "class": student_class }
                    console.log(json)
                    d.push(json)
                 }
            }
            if(d.length > 0){
                // const body = d.flatMap(doc => [{ index: {_index: index_name, _type: type_name, _id:doc['question_id']} }, doc])
                const body = d.flatMap(doc => [{ index: {_index: index_name, _type: type_name} }, doc])
                await addIndex(client,body)
            }

            return resolve(true)
        }catch(e){
            console.log("error")
            console.log(e)
            return reject(false)
        }
    })
}

async function recursiveBulkInsert(data) {
    try{
        console.log("data.length")
        console.log(data.length)
        if(data.length === 0){
            return console.log('Done!!')
        }else{
            let dataset = data.splice(0, 500)
            let resp = await index_meta(dataset)
            if(resp){
                console.log('add index true')
                return recursiveBulkInsert(data)
            }else{
                console.log("Error in recursive")
            }
        }
    }catch(e){
        console.log('recursive catch')
        console.log(e)
    }
}
function checkIndices() {
    client.indices.exists({index: index_name}, (err, res, status) => {
        if (res) {
            console.log('index already exists');
        } else {
            client.indices.create({index: index_name}, (err, res, status) => {
                putMapping();
                console.log('indices has been created now');
            })
        }
    })
}



function addIndex(client, data) {
    return new Promise( ( resolve, reject ) => {
        client.bulk({
            body: data
        }, function (err, resp) {
            console.log("err")
            console.log(err)
            if(err){
                console.log("err")
                console.log(err)
                return reject(err)
            }
            console.log("resp")
            console.log(resp)
            return resolve(resp)
        });
    });
}
// {
//   "settings": {
//     "index": {
//       "analysis": {
//         "filter": {},
//         "analyzer": {
//           "keyword_analyzer": {
//             "filter": [
//               "lowercase",
//               "asciifolding",
//               "trim"
//             ],
//             "char_filter": [],
//             "type": "custom",
//             "tokenizer": "keyword"
//           },
//           "edge_ngram_analyzer": {
//             "filter": [
//               "lowercase"
//             ],
//             "tokenizer": "edge_ngram_tokenizer"
//           },
//           "edge_ngram_search_analyzer": {
//             "tokenizer": "lowercase"
//           }
//         },
//         "tokenizer": {
//           "edge_ngram_tokenizer": {
//             "type": "edge_ngram",
//             "min_gram": 2,
//             "max_gram": 5,
//             "token_chars": [
//               "letter"
//             ]
//           }
//         }
//       }
//     }
//   },
//   "mappings": {
//     "repository": {
//       "properties": {
//         "book_name": {
//           "type": "text",
//           "fields": {
//             "keywordstring": {
//               "type": "text",
//               "analyzer": "keyword_analyzer"
//             },
//             "edgengram": {
//               "type": "text",
//               "analyzer": "edge_ngram_analyzer",
//               "search_analyzer": "edge_ngram_search_analyzer"
//             },
//             "completion": {
//               "type": "completion"
//             }
//           },
//           "analyzer": "standard"
//         }
//       }
//     }
//   }
// }
