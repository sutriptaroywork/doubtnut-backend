require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(config.mongo.database_url, { useUnifiedTopology: true },{useNewUrlParser: true}, async function (err, client) {
if(err){
    console.log(err);
}   else{
    console.log("Connected successfully to server");
    const mongo = client.db(config.mongo.database_name);
    await removeMultipleWordEntriesAndSpaces(mongo);
}
});


async function removeMultipleWordEntriesAndSpaces(mongo) {
    try{
        // this script is used to remove the document in case it contains multiple search words and in case of single word its trims extra spaces
        await mongo.collection('dictionary').find({},{ "word.text": 1 }).forEach(function(doc) {
            doc.word.text = doc.word.text.trim();
            const resultArr = [];
            const x = doc.word.text.split(" ");
            for (const i of x) {
                if (i !== "") {
                    resultArr.push(i);
                }
            }
            if (resultArr.length === 1){
                doc.word.text = doc.word.text.trim();
                mongo.collection('dictionary').updateOne(
                    { "_id": doc._id },
                    { "$set": { "word.text": doc.word.text } }
                );
            }
            if (resultArr.length > 1){
                mongo.collection('dictionary').deleteOne(
                    { "_id": doc._id },
                );
            }
        })
    }catch(e){
        console.log(e)
    }
}

