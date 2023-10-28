"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('./database');
const mysql = new database(config.mysql_analytics);
const mysqlwr = new database(config.mysql_write);
const redis = require('../../api_server/config/redis');
const _ = require("lodash");

main(mysql,mysqlwr);



async function getBooksData() {
    const sql='SELECT id,package_language,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',class, \'_\', subject) as package_details_id FROM studentid_package_details WHERE class=11 and package_type="ncert" and is_active > 0 order by book_order desc'
    return mysql.query(sql);
}

async function storingBooksData(obj){
    const sql = `INSERT INTO books_details SET ?`;
    return mysqlwr.query(sql,[obj]);

}

async function redisHandling(db, redisKey) {
    return db.redis.read.getAsync(redisKey);
}


async function handlingExerciseQuestionsArray(bookData,chapterData,exerciseData,exerciseQuestionsArray){
    for(let i=0; i< exerciseQuestionsArray.length;i++){
        const dataToBeStored ={
            book_name:bookData.name,
            book_img_url:bookData.image_url,
            student_class:bookData.student_class,
            locale:bookData.package_language,
            subject:bookData.subject,
            chapter_name:chapterData.name,
            book_playlist_id:bookData.id,
            chapter_playlist_id:chapterData.id,
            exercise_playlist_id:exerciseData.id,
            exercise_name:exerciseData.name,
            question_id:exerciseQuestionsArray[i],
            exercise_questions_array_id:exerciseData.package_details_id,
        }
        await storingBooksData(dataToBeStored);
    }


}

async function handlingExerciseData(db,bookData,chapterData,exerciseData){
    for(let i=0 ; i < exerciseData.length; i++){
        const exerciseQuestionsArray = await redisHandling(db,exerciseData[i].package_details_id);
        await handlingExerciseQuestionsArray(bookData,chapterData,exerciseData[i],JSON.parse(exerciseQuestionsArray));
    }
}

function orderingExerciseData(exerciseData){
    for(let i=0 ; i < exerciseData.length; i++){
        const exerciseNumber = exerciseData[i]['name'].split(" ")[1];
        if(exerciseNumber){
            exerciseData[i].exercise_number = parseInt(exerciseNumber.split(".")[1]);
        }
    }
    return _.orderBy(exerciseData,'exercise_number');
}

async function handlingChapterData(db,bookData,chapterData){
    for(let i=0 ; i<chapterData.length;i++){
        let exerciseData = chapterData[i].flex_list;
        exerciseData= orderingExerciseData(exerciseData)
        await handlingExerciseData(db,bookData,chapterData[i],exerciseData);
    }

}

// this script is for making exam wise previous year papers carousel data
async function main() {
    redis.on('connect', () => {
        console.log('redis connect');
    });

    redis.on('ready', async () => {
        console.log('redis ready');
    });

    redis.on('error', () => {
        console.log('redis error');
    });

    redis.on('close', () => {
        console.log('redis close');
    });

    redis.on('reconnecting', () => {
        console.log('redis reconnecting');
    });

    redis.on('end', () => {
        console.log('redis end');
    });


    try{
        const db = {};
        db.redis = {
            read: redis,
            write: redis,
        };

        const booksData = await getBooksData();
        console.log("booksData",booksData);
        for(let i=0;i<booksData.length ;i++){
            const playlistRedisKey =  booksData[i].package_details_id;
            const chapterData = await redisHandling(db,playlistRedisKey);
            if(!_.isNull(chapterData)){
                await handlingChapterData(db,booksData[i],JSON.parse(chapterData));
            }
        }
        console.log("Completed!!");
    } catch(e){
        console.log(e)
    }
}

