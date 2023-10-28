require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');const database = require('./database');
const _ = require('lodash');
const redis = require('../../api_server/config/redis');
const mysql = new database(config.mysql_analytics);
main(mysql);

//This script will run every minute
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
        const carouselsArray= await getCarouselData();
        for(let i=0;i<carouselsArray.length;i++){
            await storeCarouselDataInRedis(db,carouselsArray[i],carouselsArray[i].type);
        }
    }catch(e){
        console.log(e)
    }
}

async function getCarouselData() {
    const sql= "select * from home_caraousels where is_active = 1 and type in ('SAMPLE_PAPERS_PDF','PREVIOUS_YEARS_PDF','PREVIOUS_YEARS_PDF_EXAM_WISE') order by caraousel_order";
    return mysql.query(sql);
}

async function getAllClassBoard(type){
    let sql=''
    if(type==='board'){
        sql= "SELECT * FROM `class_course_mapping` where category ='board' and is_active=1";
    }else if(type==='exam'){
        sql= "SELECT * FROM `class_course_mapping` where category ='exam' and is_active=1";
    }
    return mysql.query(sql);
}

async function getSubjectsArray(parentId,studentClass){
    const sql= `SELECT * from (SELECT id as parent_id,name,description FROM new_library where parent=${parentId} and student_class= ${studentClass}) as a inner join new_library nl on a.parent_id = nl.parent where is_active=1`;
    return mysql.query(sql);
}
async function redisHandling(db, data, redisKey) {
    if (_.isEmpty(data)) {
        // console.log('empty');
    } else {
        await db.redis.write.setAsync(redisKey, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 30);
    }
}

async function getExamsDataFromParentId(parentIdArray){
    const sql=`SELECT id,name,description,image_url,name,description FROM new_library where id in (${parentIdArray}) and is_active=1 order by field (id,${parentIdArray}) desc`;
    return mysql.query(sql);
}

const pastPapersCourseIdMapping ={
    "Bihar Board" : 486351,
    "CBSE" : 505180,
    "Chhattisgarh Board" : 505394,
    "Jharkhand Board":505051,
    "ICSE":479700,
    "Maharashtra Board" : 473488,
    "Madhya Pradesh Board" : 505461,
    "Rajasthan Board" : 507945,
    "UP Board" : 473676,
}
const samplePapersCourseIdMapping ={
    "Bihar Board" :481436 ,
    "CBSE" : 483319,
    "Jharkhand Board":481754,
    "ICSE":481525,
    "Rajasthan Board" : 481490,
    "UP Board" : 481505,
    "Punjab Board":481474,
    "Madhya Pradesh Board" : 481605,
}
const pastPaperExamWiseMapping={
    "IIT JEE":[510130,482990,482965,484233,484316,485966,485736,517666],
    "KVPY":[483048],
    "WBJEE":[483159],
    "TEACHING":[483097,483123,483138,485753],
    "DEFENCE":[483198],
    "SSC":[485804,485843,486060,486173],
    "State Police":[483224],
    "BANKING AND INSURANCE":[510591,510534],
    "NEET":[510480,484519],
}

async function storeCarouselDataInRedis(db,carousel,type){
    try{
        if(type==='PREVIOUS_YEARS_PDF' || type==='SAMPLE_PAPERS_PDF'){
            const ccmIdArray= await getAllClassBoard("board");
            for(let i=0 ;i<ccmIdArray.length;i++){
                let parentId=0;
                if(type==='PREVIOUS_YEARS_PDF'){
                    parentId=pastPapersCourseIdMapping[ccmIdArray[i].course];
                }else if(type==='SAMPLE_PAPERS_PDF'){
                    parentId=samplePapersCourseIdMapping[ccmIdArray[i].course];
                }
                let data=[]
                if(parentId){
                    data=await getSubjectsArray(parentId,ccmIdArray[i].class);
                    if(!_.isEmpty(data)){
                        data = data.map((elem) => {
                            return {
                                "title": elem.name,
                                "subtitle": elem.description,
                                "show_whatsapp": false,
                                "show_video": false,
                                "image_url": elem.image_url,
                                "card_width": carousel.scroll_size, // percentage of screen width
                                "aspect_ratio": "",
                                "deeplink":`doubtnutapp://topic?playlist_id=${elem.id}&playlist_title=${elem.name}&page=LIBRARY`,
                                "id": elem.id,
                            }
                        })
                        carousel.items = data
                        carousel.show_view_all = 0
                        carousel.carousel_type = 'carousel'

                        let redisKey=''
                        if(type==='PREVIOUS_YEARS_PDF'){
                            redisKey=`PREVIOUS_YEARS_PDF_${ccmIdArray[i].id}`;
                        }else if(type==='SAMPLE_PAPERS_PDF'){
                            redisKey=`SAMPLE_PAPERS_PDF_${ccmIdArray[i].id}`;
                        }
                        console.log("redisKey",redisKey)
                        await redisHandling(db,carousel,redisKey);
                    }
                }
            }
            return true;
        }else if (type === 'PREVIOUS_YEARS_PDF_EXAM_WISE'){
            const examCcmId= await getAllClassBoard("exam");
            for(let i=0 ;i<examCcmId.length;i++) {
                let parentId=[];
                parentId=pastPaperExamWiseMapping[examCcmId[i].course];
                if(!_.isEmpty(parentId)){
                    let data=await getExamsDataFromParentId(parentId);
                    if(!_.isEmpty(data)){
                        data = data.map((elem) => {
                            return {
                                "title": elem.name,
                                "subtitle": elem.description,
                                "show_whatsapp": false,
                                "show_video": false,
                                "image_url":elem.image_url,
                                "card_width": carousel.scroll_size, // percentage of screen width
                                "aspect_ratio": "",
                                "deeplink":`doubtnutapp://topic?playlist_id=${elem.id}&playlist_title=${elem.name}&page=LIBRARY`,
                                "id": elem.id,
                            }
                        })

                        carousel.items = data
                        carousel.show_view_all = 0
                        carousel.carousel_type = 'carousel'

                        let redisKey=`PREVIOUS_YEARS_PDF_EXAM_WISE_${examCcmId[i].id}`;
                        console.log("redisKey",redisKey)
                        await redisHandling(db,carousel,redisKey);
                    }
                }
            }
            return true;
        }
    }catch (e) {
        console.log(e)
    }

}
