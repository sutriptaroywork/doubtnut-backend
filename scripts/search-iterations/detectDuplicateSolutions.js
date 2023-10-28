/* 

SCRIPT LOGIC

1. get all questions WHERE: 
    student id IN
    studentid_package_mapping_new table AND
    content_format = QNA VIDEOS AND
    to_index = 1

2. For each question, get matches using Elasticsearch.

3. Compare the question with each match based on:
    a) SD score
    b) length of 2 ques is similar
    c) diagram / non-diagram questions
    d) equation / non-equation questions
    Based on criteria, add these conditions:
    ---> Non-diagram + non-equation question
    (No extra condition needed)
    ---> Non-diagram + equation question
    e) Check if number of equations are same or not.
    f) If number of equations are same, then whether equations are same or not.
    ---> Diagram + non-equation question
    e) We can check whether two images are same? (Need to check how, can skip this step if it's complicated)
    ---> Diagram + equation question
    e) We can check whether two images are same? (Need to check how, can skip this step if it's complicated)
    f) Check if number of equations are same or not.
    g) If number of equations are same, then whether equations are same or not.

*/

"use strict";
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const Database = require(__dirname+'/../../api_server/config/database');
console.log(config.mysql_analytics);
const mysql = new Database(config.mysql_analytics);
const Utility = require(__dirname+'/../../api_server/modules/utility');
const QuestionHelper = require(__dirname+'/../../api_server/server/helpers/question.helper');
// const Data = require(__dirname+'/../../api_server/data/data');
const ElasticSearchTest = require(__dirname+'/../../api_server/modules/elasticSearchTest');
const QuestionContainer = require(__dirname+'/../../api_server/modules/containers/question');
const redis = require(__dirname+'/../../api_server/config/redis');

const fuzz = require('fuzzball');
const _ = require('lodash');
global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    host: config.elastic.ELASTIC_HOST
});
const elasticSearchTestInstance = new ElasticSearchTest(client, config);
// const mongoDatabaseURL ="mongodb://127.0.0.1:27017/doubtnut";
const mongoDatabaseURL = config.mongo.database_url.replace('{username}', config.mongo.database_user).replace('{password}', config.mongo.database_pass).replace('{database}', config.mongo.database_name);
const MongoClient = require("mongodb").MongoClient;

let mongo;
const db = {};
db.mysql = {};
db.mongo = {};
db.events_mongo = {};
db.redis = {
    read: redis,
    write: redis,
};
db.mysql.read = mysql;
MongoClient.connect(mongoDatabaseURL, { useUnifiedTopology: true }, async function(err,client) {
    if (err) {
        console.error(err);
        process.exit(1)
    };
    console.log("connected to mongodb")
    mongo = client.db('doubtnut');
    main();
    // return resolve(client.db('doubtnut'))
});

function getStudentIds() {
    const sql = `SELECT student_id FROM studentid_package_mapping_new WHERE content_format = 'QNA VIDEOS' and to_index = 1 and student_id = -224 order by student_id ASC`;
    console.log(sql);
    return mysql.query(sql);
}

async function getStudentIdArr() {
    const studentIds = await getStudentIds();
    return studentIds;
}


function getDiagramAndEquationFromOcr(ocr) {
    let is_diagram = false;
    let is_equation = false;
    if (ocr) {
        if (ocr.includes("`")) {
            is_equation = true;
        }
        if (ocr.includes('<img src="')) {
            is_diagram = true;
        }
    }
    return [is_diagram, is_equation]
}

function getQuestionsList(studentId) {
    const sql = 'select * from questions where student_id=? and (is_answered=1 or is_text_answered=1) order by question_id ASC';
    return mysql.query(sql, [studentId]);
}

async function getQuestionDataFromElastic(qid) {
    const elasticResult  = await elasticSearchTestInstance.getById(config.elastic.REPO_INDEX_WITH_SINGLE_SHARD, qid);
    return elasticResult;
}

async function getMatches(ocr, locale) {
    const elasticResult  = await elasticSearchTestInstance.findByOcrUsingIndexNew(ocr, 1);
    return elasticResult;
}

async function checkDuplicateQuestions(ques1, ques2) {
    let isDuplicate = false;
    const diagramEquality = ques1.is_diagram === ques2.is_diagram;
    const equationEquality = ques1.is_equation === ques2.is_equation;
    if (diagramEquality && equationEquality) {
        const isLengthCheck = QuestionHelper.ifSolutionLengthCheck(ques1.ocr_text, ques2.ocr_text);
        if (isLengthCheck) {
            // console.log(ques1.ocr_text);
            // console.log(ques2.ocr_text);
            const sdScore = await Utility.compareBystringDiff(fuzz, ques1.ocr_text, ques2.ocr_text);
            if (sdScore >= 98) {
                isDuplicate = true;
            }
        }
    }
    return isDuplicate;
}

async function checkQuestionProcessed(questionId) {
    const a = await mongo.collection('dn_ques_duplicates').find({"question_ids": questionId.toString()}).toArray();
    return a;
}

async function upsertToMongo(mongo, data) {
  const a = await mongo.collection('dn_ques_duplicates_latest').updateOne(
    {"$or": [{"question_ids":data.ques1}, {"question_ids": data.ques2}]},
    {
      "$addToSet": { "question_ids": {"$each" : [data.ques1, data.ques2]} },
      "$set": {"ocr": data.ocr1}
    },
    {"upsert": true}
  )
  console.log(a);
  return a;
}

async function processQuestion(question, student) {
    console.log('*****************************');
    console.log(question.question_id);
    console.log(student.student_id);
    console.log('*****************************');
    const res = await checkQuestionProcessed(question.question_id);
    if (res.length == 0) {
        const resp = getDiagramAndEquationFromOcr(question.ocr_text);
        question.is_diagram = resp[0];
        question.is_equation = resp[1];
        const questionDataFromElastic = await getQuestionDataFromElastic(question.question_id);
        const elasticQuestion = _.get(questionDataFromElastic, 'hits.hits[0]', {});
        if (!_.isEmpty(elasticQuestion) && elasticQuestion._source.ocr_text) {
            question.elastic_ocr = elasticQuestion._source.ocr_text;
            const response = await getMatches(question.ocr_text, student.package_language);
            const matches = _.get(response, 'hits.hits', []);
            const promises = [];
            const matchIndices = [];
            for (let k = 0; k < matches.length; k++) {
                const match = matches[k];
                if (question.question_id != match._id) {
                    const mysqlQuestion = await QuestionContainer.getByQuestionId(match._id, db);
                    match.sql_ocr_text = mysqlQuestion[0].ocr_text;
                    const resp = getDiagramAndEquationFromOcr(match.sql_ocr_text);
                    match.ocr_text = match._source.ocr_text;
                    match.is_diagram = resp[0];
                    match.is_equation = resp[1];
                    promises.push(checkDuplicateQuestions(question, match));
                    matchIndices.push(k);
                }
            }
            const resolvedPromises = await Promise.all(promises);
            for (let l = 0; l < resolvedPromises.length; l++) {
                const resolvedPromise = resolvedPromises[l];
                if (resolvedPromise) {
                    let data = {};
                    const mI = matchIndices[l];
                    data.ques1 = question.question_id;
                    data.ques2 = matches[mI]._id;
                    data.ocr1 = question.ocr_text;
                    data.ocr2 = matches[mI]._source.ocr_text;
                    data.video_language1 = student.video_language;
                    data.video_language2 = matches[mI]._source.video_language;
                    data.package_language1 = student.package_language;
                    data.package_language2 = matches[mI]._source.package_language;
                    await upsertToMongo(mongo, data);
                }
            }
        } else {
            console.log('skipped');
        }

    }
}

async function processStudent(student) {
    const questionsData = await getQuestionsList(student.student_id);
    const questionLength = questionsData.length;
    const questionPromise = [];
    for (let i=0; i< questionLength; i++) {
        const question = questionsData[i];
        questionPromise.push(processQuestion(question, student));
        if (questionPromise.length  > 0 || i == questionLength-1) {
            await Promise.all(questionPromise);
        }
    }
}

async function main() {
    try {
        const studentIdArr = await getStudentIdArr();
        console.log(studentIdArr);
        const studentPromise = [];
        for (let index = 0; index < studentIdArr.length; index++) {
                const student = studentIdArr[index];
                studentPromise.push(processStudent(student))
                if (studentPromise.length > 0) {
                    await Promise.all(studentPromise);
                }
        }
    } catch (error) {
        console.error(error);
    } finally {
        mysql.close();
    }
}
// let mongo = await connectToMongo();
// main()

// async function test() {
//   const sdScore = await Utility.compareBystringDiff(fuzz, 'A solution of (+) -2-chloro-2-phenyl ethane in toluene racemises slowly in the presence of small amount of SbCl_(5) , due to the formation of:', 'A solution of (-)-1-chloro-1-phenylethane in toluene racemises slowly in the presence of a small amount of SbCl_5 , due to the formation of');
//   console.log(sdScore);
//   // sd score is 59
// }

// test()