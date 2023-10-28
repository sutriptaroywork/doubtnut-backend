// POST /surtest1/_update_by_query?refresh
// {
// "script": {
//     "source": "ctx._source['spec']='4gb'"
//  }
// }
var uuid = require('uuid');
const Limit = 100;
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: 'https://vpc-test2-wxqeq3cftrfq7zr2xq3au7a2ye.ap-south-1.es.amazonaws.com/',
    apiVersion: '5.6'
});
const { MongoClient } = require('mongodb');
const mongoDatabaseURL = "mongodb://mongo-rs1-analytics1.doubtnut.internal:27017/doubtnut?replicaSet=rs0&readPreference=secondaryPreferred&connectTimeoutMS=60000&socketTimeoutMS=60000&retryWrites=true"
const db = {};
db.mongo = {};

async function connectToMongo() {
  return new Promise((resolve,reject)=>{
      MongoClient.connect(mongoDatabaseURL, { useUnifiedTopology: true }, async function(err,client) {
          if (err) {
            console.error(err);
            process.exit(1)
          };
          console.log("connected to mongodb")
          return resolve(client.db('doubtnut'))
      });
  });
}

function countDuplicateClusters(client) {
    return client.collection('dn_ques_duplicates').count();
}

function getDuplicateClusters(client, skip, limit) {
    return client.collection('dn_ques_duplicates').find({}).skip(skip).limit(limit).toArray();
}

function updateToElasticsearch(id, uuid) {
    client.update({
        index: 'test_index2',
        id,
        type: 'repository',
        body: {
            doc: {
                uuid
            }
        },
    });
}

async function main() {
    db.mongo.client = await connectToMongo();
    const totalClusters = await countDuplicateClusters(db.mongo.client);
    let counter = 0;
    while(counter < totalClusters) {
        const clusters = await getDuplicateClusters(db.mongo.client, counter, Limit);
        for (let index = 0; index < clusters.length; index++) {
            const cluster = clusters[index];
            const duplicateTag = uuid.v4();
            // for each qid in a cluster, attach same uuid
            const body = [];
            cluster.question_ids.forEach(question_id => {
                body.push(
                    {"update" : { _id: question_id }}
                )
                body.push({
                    doc: {
                        duplicateTag
                    }
                })
            });
            client.bulk({ index: "test_index2", type: "repository", body })
        }
        counter+= Limit;
    }
}

main()
