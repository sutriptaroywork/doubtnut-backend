/*
* @Author: Meghna
* @Email: meghna.gupta@doubtnut.com
* @Date:   2021-01-07 14:33:30
* @Last modified by:   Meghna
* @Last modified time: 2021-01-29
*/

const _ = require('lodash');
const mysql = require('mysql');
const mysql_config = {
    host: process.env.MYSQL_HOST_WRITE,
    user: process.env.MYSQL_USER_WRITE,
    password: process.env.MYSQL_PASS_WRITE,
    database: process.env.MYSQL_DB_WRITE,
}
let clientW;

function dbconnect(clientWrite) {
    return new Promise((resolve, reject) => {
        clientWrite.connect((err) => {
            if (err) {
                console.error('err in db connect function');
                console.error(err);
                reject(err);
            }
            console.log('connected to mysql');
            resolve('connected');
        });
    });
}

async function dumpToSQL(data, writeMysql) {
    const sql = 'INSERT INTO questions_user SET ?';
    return new Promise((resolve, reject) => {
        writeMysql.query(sql, data, (error, result) => {
            if (error) {
                console.error('Error occured while inserting row in questions_user table');
                return reject(error);
            }
            console.log('Insertion successful');
            console.log(result);
            return resolve(result);
        });
    });
}

async function updateSQL(data, writeMysql) {
    const sql = `UPDATE questions_user SET ? where doubt_id = '${data.doubt_id}'`;
    return new Promise((resolve, reject) => {
        writeMysql.query(sql, data, (error, result) => {
            if (error) {
                console.error('Error occured while updating row in questions_user table');
                return reject(error);
            }
            console.log('Updation successful');
            console.log(result);
            return resolve(result);
        });
    });
}

async function updateMatchSQL(parent_id, writeMysql) {
    const sql = `UPDATE questions_user SET matched_app_questions = 1 where reference_question_id = '${parent_id}'`;
    return new Promise((resolve, reject) => {
        writeMysql.query(sql, (error, result) => {
            if (error) {
                console.error('Error occured while updating match row in questions_user table');
                return reject(error);
            }
            console.log('Match updation successful');
            console.log(result);
            return resolve(result);
        });
    });
}

module.exports.handler = async (event, context) => {
    try {
        let object = _.get(event, 'Records[0].body', null);
        if (!object) {
            console.log('unexpected event object received in lambda');
            return Promise.reject();
        }
        let body = JSON.parse(object);
        if (!(body && body.data && body.type)) {
            console.log('not able to parse object');
            return Promise.reject();
        }
        console.log('body');
        console.log(body);
        clientW = mysql.createConnection(mysql_config);
        console.log('clientW');
        console.log(clientW);
        await dbconnect(clientW);
        let { data, type } = body;
        switch (type) {
            case 'quesInsert':
                let insertedQuestion = await dumpToSQL(data, clientW);
                console.log('insertedQuestion');
                console.log(insertedQuestion);
                if (insertedQuestion.affectedRows) {
                    return Promise.resolve();
                }
                return Promise.reject();
            case 'quesUpdate':
                let updatedQuestion = await updateSQL(data, clientW);
                console.log('updatedQuestion');
                console.log(updatedQuestion);
                if (updatedQuestion.affectedRows) {
                    return Promise.resolve();
                }
                return Promise.reject();
            case 'quesMatch':
                let matchedQuestion = await updateMatchSQL(data, clientW);
                console.log('matchedQuestion');
                console.log(matchedQuestion);
                if (matchedQuestion.affectedRows) {
                    return Promise.resolve();
                }
                return Promise.reject();
            default:
                console.log('Unexpected event type occured');
                console.log('event type-');
                console.log(type)
                return Promise.reject();
        }       
    } catch (error) {
        console.error('Error occured in execution of questions_user table lambda : ', error);
        return Promise.reject();
    } finally {
        clientW.end((err) => {
            if (err) {
                console.error('write connection NOT closed');
                console.error(err);
            } else {
                console.log('write connection closed');
            }
        });
    }
}