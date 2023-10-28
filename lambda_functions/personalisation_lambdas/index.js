const elasticSearch = require('elasticsearch')
const index_name = 'analytics'
const type_name = 'video_history'
const elasticClient = new elasticSearch.Client({
    hosts: ['https://search-test-es-public-f4m2nyzdybfbu7axez7o72q5we.ap-south-1.es.amazonaws.com']
})
exports.handler = async (event, context) => {
    // console.log(event)
    // console.log("hihihihhi")
    // console.log(context)
    console.log("hihihihhi")
    try {
        let batched_views = event.Records
        console.log(batched_views)
        if (typeof batched_views !== "undefined" && batched_views.length > 0) {
            await bulkInsertToElastic(batched_views, elasticClient)
        }
        console.log("this is the end")
        return new Promise(function (resolve, reject) {
            resolve("Completed");
        });
    } catch (e) {
        console.log(e)
        return new Promise(function (resolve, reject) {
            reject("Galat Scene")
        })
    }
}

async function bulkInsertToElastic(batched_views, client) {
    let data = []
    for (var i in batched_views) {
        let object = JSON.parse(batched_views[i].body)
        object = JSON.parse(object.Message)
        let json = {
            "student_id": object.data["student_id"].toString(),
            "question_id": object.data["question_id"].toString(),
            "answer_id": object.data["answer_id"].toString(),
            "created_at": object.timestamp
        }
        data.push({index: {_index: index_name, _type: type_name, _id: object.data["view_id"]}},{
            "student_id": object.data["student_id"].toString(),
            "question_id": object.data["question_id"].toString(),
            "answer_id": object.data["answer_id"].toString(),
            "created_at": object.timestamp
        })
    }
    console.log(data)
    // const body = data.map(doc => [{index: {_index: index_name, _type: type_name, _id: doc['view_id']}}, doc])
    await addIndex(client, data)
}

function addIndex(client, data) {
    return new Promise((resolve, reject) => {
        client.bulk({
            body: data
        }, function (err, resp) {
            if (err) {
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
