// connection to elastic client
const elasticSearch = require('elasticsearch')
const mysql = require('mysql')

const client = new elasticSearch.Client({
    hosts: ['https://search-test-es-public-f4m2nyzdybfbu7axez7o72q5we.ap-south-1.es.amazonaws.com']
})
const con = {
    host: "dn-prod-db-cluster.cluster-ro-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
    user: "dn-prod",
    password: "D0ubtnut@2143",
    database: "classzoo1"
}
const index_name = "questions"
const type_name = "meta"
main(mysql, con)

async function main(mysql, con) {
    let mysqlClient = await createConnection(mysql, con)
    let metaResults = await getMeta(mysqlClient)
    mysqlClient.close()
    checkIndices();
    let bulkData = recursiveBulkInsert(metaResults)
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

function getMeta(mysqlClient) {
    return new Promise(function (resolve, reject) {
        let sql = "select distinct a.question_id,b.chapter,b.subject,b.class from (SELECT" +
            " chapter,microconcept,class,question_id FROM `questions_meta`) as a left join (select * from" +
            " mc_course_mapping where active_status=1) as b on a.microconcept=b.mc_id order by a.question_id asc"
        mysqlClient.query(sql, function (error, results, fields) {
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
                let json = {"question_id":dataset[i]['question_id'], "subject": dataset[i].subject, "chapter": dataset[i].chapter, "class": dataset[i].class }
                d.push(json)
            }
            const body = d.flatMap(doc => [{ index: {_index: index_name, _type: type_name, _id:doc['question_id']} }, doc])
            await addIndex(client,body)
            return resolve(true)
        }catch(e){
            console.log("error")
            console.log(e)
            return reject(false)
        }
    })
}

async function recursiveBulkInsert(questions_meta) {
    try{
        console.log("questions_meta.length")
        console.log(questions_meta.length)
        if(questions_meta.length === 0){
            return console.log('Done!!')
        }else{
            let dataset = questions_meta.splice(0, 500)
            let resp = await index_meta(dataset)
            if(resp){
                console.log('add index true')
                return recursiveBulkInsert(questions_meta)
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


async function putMapping() {
    console.log("Creating Mapping index");
    client.indices.putMapping({
        index: index_name,
        type: type_name,
        body: {
            properties: {
                question_id: {type: 'integer'},
                subject: {
                    type: 'text'
                },
                chapter: {
                    type: 'text'
                },
                class: {
                    type: 'integer'
                }
            }
        }
    }, (err, resp, status) => {
        if (err) {
            console.error(err, status)
        } else {
            console.log('Successfully Created Index', status, resp)
        }
    })
}
function addIndex(client, data) {
    return new Promise( ( resolve, reject ) => {
        client.bulk({
            body: data
        }, function (err, resp) {
            if(err){
                console.log("err")
                console.log(err)
                return reject(err)
            }
            console.log("resp")
            console.log(resp)
            return resolve(resp)
        });
    } );
}