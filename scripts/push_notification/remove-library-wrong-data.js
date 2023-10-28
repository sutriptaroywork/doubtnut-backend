// const config = require(__dirname + '/../../api_server/config/config');
// const config = require('../../api_server/config/config');
const database = require('./database');
const _ = require('lodash');

const MYSQL_HOST_WRITE = 'dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_HOST_READ = 'analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_HOST_TEST = 'test-db-latest-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_USER_WRITE = 'sutripta';
const MYSQL_DB_WRITE = 'classzoo1';
const MYSQL_PASS_TEST = '';
const MYSQL_PASS_WRITE = '';

const mysqlConf = {
    host     : MYSQL_HOST_WRITE,
    user     : MYSQL_USER_WRITE,
    password : MYSQL_PASS_WRITE,
    database : MYSQL_DB_WRITE,
};

const mysqlTestConf = {
    host     : MYSQL_HOST_TEST,
    user     : MYSQL_USER_WRITE,
    password : MYSQL_PASS_TEST,
    database : MYSQL_DB_WRITE,
}
// console.log('config : ', config)
// config.mysql_analytics.charset = 'utf8mb4';

main();

//This script will run every minute
async function main() {
    try{
        const wrongIds = await getWrongIds();

        for (let i = 0; i < wrongIds.length; i++) {
            console.log(wrongIds[i].id, wrongIds[i].question_id);
            const chkData = await chkIsNotAnswered(wrongIds[i].question_id);
            if (chkData.length == 0) {
                await deleteWrongData(wrongIds[i].id);
            }
        }

        console.log("success at: "+new Date())
    }catch(e){
        console.log(e)
    }
}

function getWrongIds() {
    const mysql = new database(mysqlTestConf);
    const sql= "SELECT * FROM book_questions_details WHERE question_id IN (SELECT a.question_id FROM `book_questions_details` a LEFT JOIN questions b ON a.question_id = b.question_id WHERE a.student_class IN (12) AND b.is_answered = 0)";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function chkIsNotAnswered(question_id) {
    const mysql = new database(mysqlConf);
    let sql = "SELECT * FROM `questions` WHERE `question_id` = '"+question_id+"' AND is_answered = 1";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function deleteWrongData(id) {
    const mysql = new database(mysqlTestConf);
    const sql= "DELETE FROM `book_questions_details` WHERE `id` = "+id;
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}
