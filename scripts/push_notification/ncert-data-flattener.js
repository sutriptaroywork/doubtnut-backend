// const config = require(__dirname + '/../../api_server/config/config');
// const config = require('../../api_server/config/config');
const database = require('./database');

const MYSQL_HOST_WRITE = 'dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_HOST_READ = 'analytics-reader.cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_HOST_TEST = 'test-db-latest-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com';
const MYSQL_USER_WRITE = 'sutripta';
const MYSQL_DB_WRITE = 'classzoo1';
const MYSQL_PASS_TEST = 'SUtr(Uta^e^B7l536';
const MYSQL_PASS_WRITE = 'UTBL3YCGXfTMskQif5E=';

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
        const questionList = await getNcertList();
        for (let i = 0; i < questionList.length; i++) {
            const mainPlaylistId = parseInt(questionList[i].id);
            const studentClass = parseInt(questionList[i].student_class);
            console.log('main playlist id and class :::::::::::::::::::::: ', mainPlaylistId, studentClass);
            const bookList = await getPlaylistDetails(mainPlaylistId, studentClass);
            
            for (let j = 0; j < bookList.length; j++) {
                const bookPlaylistId = parseInt(bookList[j].id);
                let bookName = bookList[j].name;
                bookName = bookName.replace(/'/g, "\\'");
                console.log('book playlist id and book name <<<<<<<<<<<<<<<<<<<<<< ', bookPlaylistId, bookName);
                const chapterList = await getPlaylistDetails(bookPlaylistId);

                for (let k = 0; k < chapterList.length; k++) {
                    const chapterPlaylistId = parseInt(chapterList[k].id);
                    let chapterName = chapterList[k].name;
                    chapterName = chapterName.replace(/'/g, "\\'");
                    // console.log('chapter playlist id and chapter name !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! : ', chapterPlaylistId, chapterName);
                    const exerciseList = await getPlaylistDetails(chapterPlaylistId);
                    // console.log('exerciseList length &&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&& ', exerciseList.length)

                    for (let l = 0; l < exerciseList.length; l++) {
                        const exercisePlaylistId = parseInt(exerciseList[l].id);
                        let exerciseName = exerciseList[l].name;
                        exerciseName = exerciseName.replace(/'/g, "\\'");
                        // console.log('exercise playlist id and exercise name >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> : ', exercisePlaylistId, exerciseName);

                        const questionList = await getQuestionList(exercisePlaylistId);
                        // console.log('questions length $$$$$$$$$$$$$$$$$$$$$$$$$ ', questionList.length)

                        for (let m = 0; m < questionList.length; m++) {
                            const dataObj = {
                                main_playlist_id: mainPlaylistId,
                                student_class: studentClass,
                                book_playlist_id: bookPlaylistId,
                                book_name: bookName,
                                chapter_playlist_id: chapterPlaylistId,
                                chapter_number: k + 1,
                                chapter_name: chapterName,
                                exercise_playlist_id: exercisePlaylistId,
                                exercise_name: exerciseName,
                                exercise_number: l + 1,
                                question_id: parseInt(questionList[m].question_id),
                            }
                            const insertedDetails = await insertData(dataObj);
                        }
                    }
                }
            }
        }
        console.log("success at: "+new Date())
    }catch(e){
        console.log(e)
    }
}

function getNcertList() {
    const mysql = new database(mysqlConf);
    // const sql= "SELECT * FROM `new_library` WHERE `name` = 'NCERT Books Solutions' ORDER BY student_class";
    const sql= "SELECT * FROM `new_library` WHERE `name` = 'NCERT Books Solutions' AND student_class IN (6, 7, 8) ORDER BY student_class";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function getPlaylistDetails(playlistId, studentClass = 0) {
    const mysql = new database(mysqlConf);
    const classLIst = [6,7,8];
    // let sql = "SELECT * FROM `new_library` WHERE `parent` = '"+playlistId+"' AND is_active = 1";
    let sql = "SELECT * FROM `new_library` WHERE `parent` = '"+playlistId+"'";
    if (classLIst.includes(studentClass)) {
        // sql += " AND description = 'BOOKS_1'";
        sql += " AND description != 'BOOKS_1'";
    }
    sql += ' ORDER BY playlist_order';
    // console.log('sql %%%%%%%%%% ', sql)
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function getQuestionList(playlistId) {
    const mysql = new database(mysqlConf);
    const sql= "SELECT * FROM `new_library_playlist_question_mapping` WHERE `playlist_id` = "+playlistId+" AND is_last = 1";
    const data = mysql.query(sql);
    mysql.connection.end();
    return data;
}

function insertData(dataObj) {
    const mysql_w = new database(mysqlTestConf);
    const sql= "INSERT INTO ncert_questions_details SET ?";
    const data = mysql_w.query(sql, dataObj);
    mysql_w.connection.end();
    return data;
}
