"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('./database');
const mysql = new database(config.mysql_analytics);
const mysqlwr = new database(config.mysql_write);
main(mysql,mysqlwr);

// this script is for making exam wise previous year papers carousel data
async function main(mysql) {
    try{
        const pdfData = await getPdfData(mysql);
        let stateBoard = '';
        let studentClass = '';
        let subject = '';

        let stateBoardId = '';

        for(let i=0;i<pdfData.length;i++){
            if (stateBoard !== pdfData[i]['state_board']){
                stateBoard = pdfData[i]['state_board']
                stateBoardId = await insertDataIntoLibrary('state_board',stateBoard,null);
            }
            if(stateBoardId.insertId){
                await insertDataIntoLibrary('pdf',`${pdfData[i].year_chapter}-${pdfData[i].subject}-${pdfData[i]['state_board']}`,stateBoardId.insertId,pdfData[i].pdf_url)
            }
            console.log(stateBoard,studentClass,subject)
        }
    }catch(e){
        console.log(e)
    }
}

async function insertDataIntoLibrary(type,data,parentId,pdfUrl){
    let sql = ''
    if(type==='state_board'){
        sql= `INSERT INTO new_library ( name, description, image_url, is_first, is_last, empty_text, is_admin_created, parent, resource_type, resource_description, resource_path, student_class, student_course, new_student_course, playlist_order, new_playlist_order, student_id, is_active, is_delete, empty_playlist_id, master_parent, size, subject, view_type, main_description, min_version_code, max_version_code, is_chapter_active, items_count) VALUES( '${data}', '${data}', 'https://d10lpgp6xz60nq.cloudfront.net/images/Paper%20Thumbnails-79.png', 1, 0, NULL, 1, ${parentId}, 'pdf', 'pdf', NULL, Null, 'Download Unlimited PDF', NULL,  5, NULL, NULL, 1, 0, NULL, NULL, '1x', '', 'LISTX2', NULL, 0, 10000, '1', 0)`;
    } else if (type==='pdf'){
        sql= `INSERT INTO new_library ( name, description, image_url, is_first, is_last, empty_text, is_admin_created, parent, resource_type, resource_description, resource_path, student_class, student_course, new_student_course,  playlist_order, new_playlist_order, student_id, is_active, is_delete, empty_playlist_id, master_parent, size, subject, view_type, main_description, min_version_code, max_version_code, is_chapter_active, items_count) VALUES( '${data}', '${data}', NULL, 0, 1, NULL, 1, ${parentId}, 'pdf', 'pdf', '${pdfUrl}', Null, 'NCERT', NULL,  5, NULL, NULL, 1, 0, NULL, NULL, '1x', '', 'LIST', NULL, 0, 10000, '1', 0)`;
    }
    return mysql.query(sql);
}

async function getPdfData(mysql) {
    // const sql= "SELECT distinct state_board,year_chapter,pdf_url FROM `boards_previous_year` WHERE (state_board =\"GUCET PREVIOUS YEAR PAPERS\" or state_board=\"KCET PREVIOUS YEAR PAPER\")";
    // const sql= "SELECT distinct state_board,year_chapter , class,pdf_url FROM `boards_previous_year` WHERE state_board="KVPY PREVIOUS YEAR PAPER"";
    // const sql= "SELECT distinct state_board,year_chapter , class,pdf_url FROM `boards_previous_year` WHERE (state_board ="CTET PREVIOUS YEAR PAPERS"  or state_board ="HTET PREVIOUS YEAR PAPERS" or state_board="UPTET PREVIOUS YEAR PAPER")";
    // const sql= "SELECT distinct state_board,year_chapter , class,pdf_url FROM `boards_previous_year` WHERE  state_board="WB JEE PREVIOUS YEAR PAPER"";
    // const sql= "SELECT distinct state_board,year_chapter , class,pdf_url FROM `boards_previous_year` WHERE state_board ="CDS PREVIOUS YEAR PAPER"";
    // const sql= "SELECT distinct state_board,year_chapter , class,pdf_url FROM `boards_previous_year` WHERE  state_board="SSC CGL PREVIOUS YEAR PAPER"";
    //const sql=   'SELECT distinct state_board,year_chapter,pdf_url FROM `boards_previous_year` WHERE state_board ="PUCET PREVIOUS YEAR PAPER"';
//const sql='SELECT distinct state_board,year_chapter,pdf_url FROM `boards_previous_year` WHERE state_board ="REET PREVIOUS YEAR PAPER"'
//     const sql='SELECT distinct state_board,year_chapter ,pdf_url FROM `boards_previous_year` WHERE state_board="SBI CLERK PREVIOUS YEAR PAPER"'
//const sql ='SELECT distinct state_board,year_chapter,pdf_url FROM `boards_previous_year` WHERE ( state_board ="SSC GD CONSTABLE PREVIOUS YEAR PAPER")'
//const sql='SELECT distinct state_board,year_chapter,pdf_url FROM `boards_previous_year` WHERE ( state_board="SSC CHSL PREVIOUS YEAR PAPERS")'
//const sql='SELECT distinct state_board,year_chapter,pdf_url FROM `boards_previous_year` WHERE state_board ="JEE MAINS PREVIOUS YEAR PAPER (HINDI)"'
//const sql='SELECT distinct state_board,year_chapter , class,pdf_url FROM `boards_previous_year` WHERE (state_board="SSC MTS PREVIOUS YEAR PAPER")'
    const sql='SELECT distinct state_board,year_chapter, subject,pdf_url FROM `boards_previous_year` WHERE (state_board="NEET PREVIOUS YEAR PAPER (HINDI)")';
    return mysql.query(sql);
}
