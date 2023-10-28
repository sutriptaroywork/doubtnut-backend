"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('./database');
const mysql = new database(config.mysql_analytics);
const mysqlwr = new database(config.mysql_write);
main(mysql,mysqlwr);

// this script is for making board wise previous year papers carousel data
async function main(mysql,mysqlwr) {
    try{
        // const pdfData = await getPdfData(mysql);
        const pdfData = await getPdfData(mysql);
        let stateBoard = '';
        let studentClass = '';
        let subject = '';

        let stateBoardId = '';
        let classId = '';
        let subjectId = '';

        for(let i=0;i<pdfData.length;i++){
            if (stateBoard !== pdfData[i]['state_board']){
                stateBoard = pdfData[i]['state_board']
                stateBoardId = await insertDataIntoLibrary('state_board',stateBoard,null);
                studentClass = pdfData[i].class
                classId = await insertDataIntoLibrary('student_class',studentClass,stateBoardId.insertId);
            }
            if(studentClass !== pdfData[i].class){
                studentClass = pdfData[i].class
                classId = await insertDataIntoLibrary('student_class',studentClass,stateBoardId.insertId);
                subject=pdfData[i].subject;
                subjectId=await insertDataIntoLibrary('subject',subject,classId.insertId);
            }
            if(subject !== pdfData[i].subject ){
                subject=pdfData[i].subject;
                subjectId=await insertDataIntoLibrary('subject',subject,classId.insertId);
            }
            if(subjectId.insertId){
                await insertDataIntoLibrary('pdf',`${pdfData[i].year_chapter}-${pdfData[i]['state_board']}`,subjectId.insertId,pdfData[i].pdf_url)
            }
            console.log(stateBoard,studentClass,subject)
        }
    }catch(e){
        console.log(e)
    }
}

const subjectImgUrlPastPapers={
    "ENGLISH" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8AE6551A-6D3E-5A11-E7ED-869EE47D1446.webp",
    "MATHS" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/7FD659A7-6EB8-501B-D953-386E78D403D9.webp",
    "SCIENCE" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/745263A8-A3E4-A50E-35CD-A6917582E026.webp",
    "PHYSICS" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9E717019-614F-2E02-F840-5B84BFD2832D.webp",
    "CHEMISTRY" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/84050F70-92D6-7BB1-D9B4-539001422FF8.webp",
    "BIOLOGY" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/44E3035A-AC9D-F76F-4F5D-77BBAF85261B.webp",
    "HINDI":"https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4A6EB601-92F3-D35C-BAEF-FA2B8F337953.webp",
}
const subjectImgUrlSamplePapers={
    "ENGLISH" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/0ACF350E-4890-6E31-2DE4-016E2640563F.webp",
    "MATHS" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/60038BC0-C415-5284-2DED-AC4DDAFDE3AE.webp",
    "SCIENCE" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9B5BA5DE-88F9-D46C-BFCC-DB51A5D2BD36.webp",
    "PHYSICS" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/09DDD46D-1C84-55C1-8040-7775FC8A8923.webp",
    "CHEMISTRY" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9AA96A1F-604E-EE48-DD6E-57EF1306247B.webp",
    "BIOLOGY" : "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/F17FBD52-9576-F3B9-7BDD-875A042E01B1.webp",
    "HINDI":"https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6CC6202D-00FE-4834-690E-54653EC18EB2.webp",
    "HOME SCIENCE":'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1FB760BA-0411-B2C1-8C71-6976E869289E.webp',
}
async function insertDataIntoLibrary(type,data,parentId,pdfUrl){
    let sql = ''
    if(type==='state_board'){
         sql= `INSERT INTO new_library ( name, description, image_url, is_first, is_last, empty_text, is_admin_created, parent, resource_type, resource_description, resource_path, student_class, student_course, new_student_course, playlist_order, new_playlist_order, student_id, is_active, is_delete, empty_playlist_id, master_parent, size, subject, view_type, main_description, min_version_code, max_version_code, is_chapter_active, items_count) VALUES( '${data}', '${data}', NULL, 1, 0, NULL, 1, ${parentId}, 'pdf', 'pdf', NULL, Null, 'Download Unlimited PDF', NULL,  5, NULL, NULL, 1, 0, NULL, NULL, '1x', '', 'LISTX2', NULL, 0, 10000, '1', 0)`;
    } else if(type==='student_class'){
        const title=`Class ${data}`
        sql= `INSERT INTO new_library ( name, description, image_url, is_first, is_last, empty_text, is_admin_created, parent, resource_type, resource_description, resource_path, student_class, student_course, new_student_course,  playlist_order, new_playlist_order, student_id, is_active, is_delete, empty_playlist_id, master_parent, size, subject, view_type, main_description, min_version_code, max_version_code, is_chapter_active, items_count) VALUES( '${title}', '${title}', NULL, 0, 0, NULL, 1, ${parentId}, 'pdf', 'pdf', NULL, ${data}, 'NCERT', NULL,  1, NULL, NULL, 1, 0, NULL, NULL, '1x', '', 'LIST', NULL, 0, 10000, '1', 0)`;
    } else if(type ==='subject'){
        const imgUrl= subjectImgUrlPastPapers[data];
        sql= `INSERT INTO new_library ( name, description, image_url, is_first, is_last, empty_text, is_admin_created, parent, resource_type, resource_description, resource_path, student_class, student_course, new_student_course,  playlist_order, new_playlist_order, student_id, is_active, is_delete, empty_playlist_id, master_parent, size, subject, view_type, main_description, min_version_code, max_version_code, is_chapter_active, items_count) VALUES( '${data}', '${data}', '${imgUrl}', 0, 0, NULL, 1, ${parentId}, 'pdf', 'pdf', NULL, Null, 'NCERT', NULL,  5, NULL, NULL, 1, 0, NULL, NULL, '1x', '${data}', 'LIST', NULL, 0, 10000, '1', 0)`;
    } else if (type==='pdf'){
        sql= `INSERT INTO new_library ( name, description, image_url, is_first, is_last, empty_text, is_admin_created, parent, resource_type, resource_description, resource_path, student_class, student_course, new_student_course,  playlist_order, new_playlist_order, student_id, is_active, is_delete, empty_playlist_id, master_parent, size, subject, view_type, main_description, min_version_code, max_version_code, is_chapter_active, items_count) VALUES( '${data}', '${data}', NULL, 0, 1, NULL, 1, ${parentId}, 'pdf', 'pdf', '${pdfUrl}', Null, 'NCERT', NULL,  5, NULL, NULL, 1, 0, NULL, NULL, '1x', '', 'LIST', NULL, 0, 10000, '1', 0)`;
    }
    return mysql.query(sql);
}

async function getPdfData(mysql) {
    // const sql= "SELECT distinct state_board,year_chapter , class,pdf_url,subject FROM `boards_previous_year` WHERE state_board=\"CBSE SAMPLE PAPER\"";
    // const sql="SELECT distinct state_board,year_chapter , class,subject,pdf_url  FROM `boards_previous_year` WHERE state_board ='MP BOARD PREVIOUS YEAR PAPER'"
    const sql="SELECT distinct state_board,year_chapter , class,subject,pdf_url FROM `boards_previous_year` WHERE state_board ='BIHAR BOARD PREVIOUS YEAR PAPER'"

    return mysql.query(sql);
}
