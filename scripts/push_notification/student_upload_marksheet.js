"use strict"
const crypto = require('crypto');
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
// const database = require('../../api_server/config/database');
const database = require('./database');
const mysql = new database(config.mysql_analytics);
const mysqlwr = new database(config.mysql_write);
main(mysql,mysqlwr);



async function getStudentIds(mysql){
    const sql = `SELECT * FROM students_iit`;
    return mysql.query(sql);
}

async function insertIntoStudentUploadMarksheet(mysqlwr, obj){
    const sql = 'INSERT IGNORE INTO students_upload_marksheet SET ?';
    return mysqlwr.query(sql, obj);
}

async function getHashData(student_id, salt) {
    const hash = crypto.createHmac('sha512', salt);
    hash.update(student_id);
    const value = hash.digest('hex');
    return value;
}

function createObj(hashData, student_id) {
    const obj = {
        student_id,
        is_marksheet_uploaded: 0,
        is_delete: 0,
        hash: hashData,
    };
    return obj;
}


async function main(mysql, mysqlwr){
    try{
        const student_ids = await getStudentIds(mysql);
        for(let i = 0; i<student_ids.length; i++){
            console.log(i);
            let student_id = student_ids[i].student_id;
            const hashData = await getHashData(student_id.toString(), config.hash_key);
            const obj = createObj(hashData, student_id);
            console.log(obj)
            await insertIntoStudentUploadMarksheet(mysqlwr, obj);
        }
        console.log('done')
    } catch(e){
        console.log(e);
    }
}