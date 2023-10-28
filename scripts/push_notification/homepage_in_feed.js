require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require('../../api_server/config/database');
const mysql_analytics = new database(config.mysql_analytics);
// const mysql_write = new database(config.write_mysql);
const moment = require('moment')
const _ = require('lodash');
const MongoClient = require("mongodb").MongoClient;
const { ObjectId } = require('mongodb'); // or ObjectID 
const bluebird = require("bluebird");
const Redis = require('ioredis');
const Promise = require('bluebird');
const etoosCoursehelper = require('../../api_server/server/v1/course/course.helper');
const Data = require('../../api_server/data/data');
Promise.promisifyAll(Redis);
Promise.promisifyAll(Redis.prototype);
// var write_redis = new Redis({
//     host: config.write_redis.host,
//     port: config.write_redis.port
// });
// var read_redis = new Redis({
//     host: config.read_redis.host,
//     port: config.read_redis.port
// })
async function connectToMongo() {
    return new Promise((resolve, reject) => {
        MongoClient.connect(config.mongo.database_url, { useUnifiedTopology: true }, { useNewUrlParser: true }, async function (err, client) {
            console.log(err)
            if (err) process.exit()
            console.log("connected")
            return resolve(client.db('doubtnut'))
        });
    });
}

(async () => {
    //let mongo = await connectToMongo();

    let limit = 5
    let page = 1
    // let structured_sql = "SELECT * FROM `structured_course` ORDER BY id DESC LIMIT 1";
    // let structuredData = await mysql_analytics.query(structured_sql)
    // const structuredCourseId = structuredData[0].id;
    // const structuredCourseTitle = structuredData[0].title;
    // const structuredCourseDescription = structuredData[0].description;
    // const structuredCourseButtonText = structuredData[0].button_text;
    // const structuredCourseLogo = structuredData[0].logo;
    // let structuredCourseClasses = [11, 12]
    // for (const student_class of structuredCourseClasses) {
    //     console.log(student_class)
    //     console.log(student_class)
    //     let sql = "SELECT h.subject, h.resource_reference AS id, h.structured_course_id, h.structured_course_detail_id, CONCAT('https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/',h.resource_reference,'.webp') AS thumbnail_url,h.youtube_id, j.ocr_text AS text, h.answer_video AS video_url, h.answer_id FROM (SELECT f.*,g.youtube_id, CONCAT('https://d3cvwyf9ksu0h5.cloudfront.net/',g.answer_video) AS answer_video FROM (SELECT d.*, MAX(e.answer_id) AS answer_id FROM (SELECT a.*, b.id AS structured_course_resource_id, c.structured_course_id, c.live_at, c.chapter, b.resource_type, b.resource_reference, b.q_order, b.structured_course_detail_id FROM (SELECT subject, MAX(id) AS id FROM `structured_course_details` WHERE live_at >= CONCAT(date(NOW()),' 00:00:00') AND live_at <= CONCAT(date(NOW()),' 23:59:59') AND structured_course_id = " + structuredCourseId + " AND class = " + student_class + " GROUP BY subject) AS a LEFT JOIN (SELECT * FROM structured_course_resources WHERE resource_type = 0) AS b ON a.subject=b.subject AND a.id = b.structured_course_detail_id LEFT JOIN structured_course_details AS c ON a.subject=c.subject AND a.id = c.id WHERE b.q_order = 1 AND b.class = " + student_class + ") AS d LEFT JOIN answers AS e ON d.resource_reference = e.question_id GROUP BY e.question_id) AS f LEFT JOIN answers AS g ON g.question_id = f.resource_reference AND g.answer_id = f.answer_id) AS h LEFT JOIN questions AS j ON h.resource_reference = j.question_id  ORDER BY rand()"
    //     console.log(sql)
    //     let list = await mysql_analytics.query(sql)
    //     console.log(list)
    // }




    let home_caraousels_sql = "select * from home_caraousels where is_active =1 and id = 339  order by caraousel_order";
    let home_caraousels_data = await mysql_analytics.query(home_caraousels_sql)
    let class_array = ['6', '7', '8', '9', '10', '11', '12', '14']
    let final_data = []
    const language = 'english';
    const weekNo = moment().format('ww');
    const base_url = `${config.cdn_url}q-thumbnail/`;
    const cdn_url = `${config.cdn_url}images/`;
    const subjectUrl = [`${cdn_url}physics_tricky.png`, `${cdn_url}chemistry_tricky.png`, `${cdn_url}maths_tricky.png`, `${cdn_url}biology_tricky.png`, `${cdn_url}default_tricky.png`];
    const action_activity = 'pdf_viewer';
    const button_text = '';
    const button_text_color = '#000000';
    const button_bg_color = '#f4e70c';
    const button = [button_text, button_text_color, button_bg_color];
    const subtitle = ''

    for (let caraousel of home_caraousels_data) {
        if (!caraousel.id) {
            process.exit()
        }
        caraousel = Object.assign({}, caraousel)
        console.log(caraousel.id)
        caraousel.caraousel_id = caraousel.id
        delete caraousel.id
        let type = caraousel.type
        const description = ''
        caraousel.description = ""
        if (caraousel.data_limit) {
            limit = caraousel.data_limit
        }

        let student_class = caraousel.class

        if (!student_class) {
            for (const class_string of class_array) {
                let caraouselWidgetData = await getData(mysql_analytics, caraousel, class_string, limit, description, button, action_activity, subjectUrl, cdn_url, base_url, weekNo, language, type)
                //  console.log(caraouselWidgetData)

                if (caraouselWidgetData.caraousel_type == 'real_time') {
                    final_data.push(Object.assign({}, caraouselWidgetData))
                } else if (caraouselWidgetData.items.length > 0) {
                    final_data.push(Object.assign({}, caraouselWidgetData))
                }
                console.log(final_data)
            }

        } else {
            let caraouselWidgetData = await getData(mysql_analytics, caraousel, student_class, limit, description, button, action_activity, subjectUrl, cdn_url, base_url, weekNo, language)
            console.log(caraouselWidgetData)

            if (caraouselWidgetData.caraousel_type == 'real_time') {
                final_data.push(caraouselWidgetData)
            } else if (caraouselWidgetData.items.length > 0) {
                final_data.push(caraouselWidgetData)
            }
            console.log(caraouselWidgetData)

        }

    }
    //  console.log('fina', final_data)
    // for (const data of caraouselData) {
    //     let mongoInserts = await mongo.collection('homepage_feed_test').save(data)
    // }
    // for (const data of final_data) {
    //     data.layout_config = {
    //         "margin_top": 8,
    //         "bg_color": "#ffffff"
    //     };
    //     let mongoInserts = await mongo.collection('homepage_feed_test').save(data)
    // }

    //  let mongoInserts = await mongo.collection('homepage_feed_test').insertMany(final_data)

    // get Home CaraouselList
    process.exit()
    //get PersonalisedList
})()

async function getData(mysql_analytics, caraousel, student_class, limit, description, button, action_activity, subjectUrl, cdn_url, base_url, weekNo, language, type) {
    caraousel.class = student_class

    if (caraousel.type === 'DPP') {
        caraousel.caraousel_type = 'real_time'
        return caraousel
    } else if (caraousel.data_type === 'topic') {
        let sql = `select id,'${caraousel.data_type}' as type, subject, image_url, name as title, '' as description, is_last, resource_type, playlist_order, master_parent from new_library where parent = '${caraousel.mapped_playlist_id} ' and is_active = 1 and is_delete = 0 order by rand() LIMIT 5`
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {

            let mappedObject = {
                "title": elem.title,
                "subtitle": null,
                "show_whatsapp": true,
                "show_video": false,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://playlist?playlist_id=${elem.id}&playlist_title=${elem.title}&is_last=${elem.is_last}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data

        caraousel.caraousel_type = 'caraousel'
        //playlist

        return caraousel
    } else if (caraousel.data_type === 'topic_parent') {
        if (caraousel.type === 'PERSONALIZATION_CHAPTER') {
            caraousel.caraousel_type = 'real_time'
            return caraousel
        } else {
            let sql = `select id, subject, image_url, name as title, '' as description, is_last, resource_type, playlist_order, master_parent, case when resource_type = 'web_view' then resource_path else '' end as resource_path from new_library where parent in ('${caraousel.mapped_playlist_id}') and is_active = 1 and is_delete = 0 order by rand() LIMIT ${limit}`
            let data = await mysql_analytics.query(sql);

            data = data.map((elem) => {
                let mappedObject = {
                    "title": elem.title,
                    "subtitle": elem.description,
                    "show_whatsapp": true,
                    "show_video": false,
                    "image_url": elem.image_url,
                    "card_width": caraousel.scroll_size, // percentage of screen width
                    "aspect_ratio": "",
                    "deeplink": `doubtnutapp://playlist?playlist_id=${elem.id}&playlist_title=${elem.title}&is_last=${elem.is_last}`,
                    "id": elem.id,
                };
                return mappedObject
            })
            //#### deeplink 
            caraousel.items = data
            caraousel.caraousel_type = 'caraousel'

            //playlist
            return caraousel
        }
    } else if (caraousel.type === 'WHATSAPP_ASK') {
        const sql = "select * from app_configuration where class in ('all',?) and is_active=1 and key_name='whatsapp_ask'";
        let data = await mysql_analytics.query(sql, [caraousel.class]);

        data = data.map((elem) => {
            let key_value = JSON.parse(elem.key_value)

            let mappedObject = {
                "title": key_value.description,
                "subtitle": null,
                "show_whatsapp": true,
                "show_video": false,
                "image_url": key_value.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://external_url?url=${key_value.action_data.url}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.scroll_type = 'whatsapp'
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'CRASH_COURSE') {

        // const sql = `SELECT cast(c.question_id as char(50)) AS id, '${type}' as type, c.subject, case when c.matched_question is null then concat('${base_url}', c.question_id, '.png') else concat('${base_url}', c.matched_question, '.png') end as image_url, left(c.ocr_text, 100) AS title, left('${description}', 100) as description, c.resource_type FROM(select id from student_playlists where name like '%CRASH COURSE%' and student_id = '98') as a inner join(select question_id, playlist_id from playlist_questions_mapping) as b on a.id = b.playlist_id inner join(select question_id, matched_question, ocr_text, subject,case when is_text_answered = 1 and is_answered = 0 then 'text' else 'video' end as resource_type from questions WHERE is_answered = 1 or is_text_answered = 1) as c on c.question_id = b.question_id left join(select chapter, question_id from questions_meta) as d on b.question_id = d.question_id left join(select GROUP_CONCAT(packages) as packages, question_id from question_package_mapping group by question_id) as e on e.question_id = b.question_id left join(select duration, question_id from answers order by answer_id DESC limit 1) as f on f.question_id = c.question_id order by rand() limit ${limit}`;
        // let data = await mysql_analytics.query(sql);

        // data = data.map((elem) => {
        //     elem.deeplink = `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`
        //     return elem
        // })
        caraousel.items = []

        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'LATEST_FROM_DOUBTNUT') {
        const sql = `SELECT cast(a.question_id as char(50)) AS id, case when b.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',b.matched_question,'.png') end as image_url, left(b.ocr_text,100) AS title,left('${caraousel.description}',100) as description,b.resource_type FROM (select question_id,id from engagement where type='viral_videos' and class in ('${caraousel.class}','all') and start_date <= CURRENT_TIMESTAMP  and end_date >= CURRENT_TIMESTAMP) as a inner join (select question_id,question,matched_question,ocr_text,chapter,student_id,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions where student_id in ('80','82','83','85','86','87','88','89','90','98') and (is_answered=1 or is_text_answered=1) and is_skipped=0) as b on a.question_id=b.question_id left join (select duration,question_id from answers order by answer_id DESC limit 1) as d on d.question_id=a.question_id left join (select * from studentid_package_mapping) as z on z.student_id=b.student_id order by a.id desc LIMIT ${limit}`;
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": true,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`,
                "id": elem.id,
            };
            return mappedObject
        })
        //deeplink library ####
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'

        return caraousel
    } else if (caraousel.data_type === 'library_video') {
        caraousel.caraousel_type = 'real_time'
        return caraousel
    } else if (caraousel.type === 'TRICKY_QUESTION') {
        const sql = `select cast(a.question_id as char(50)) AS id,'${caraousel.type}' as type,'video_wrapper' as layout_type,case when a.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',a.matched_question,'.png') end as image_url,left(a.ocr_text,100) AS title,left('${caraousel.description}',100) as description,'video' as resource_type,a.subject,case when a.subject='MATHS' then '${subjectUrl[2]}' when a.subject='PHYSICS' then '${subjectUrl[0]}' when a.subject='CHEMISTRY' then '${subjectUrl[1]}' when a.subject='BIOLOGY' then '${subjectUrl[3]}' else '${subjectUrl[4]}' end as subject_image,CASE when SUBSTRING_INDEX(f.book_meta,'||',2)='Physics || Books' then SUBSTR(f.book_meta,21) when SUBSTRING_INDEX(f.book_meta,'||',2)='Chemistry || Books' then SUBSTR(f.book_meta,23) when SUBSTRING_INDEX(f.book_meta,'||',2)='Maths || Books' then SUBSTR(f.book_meta,18) when SUBSTRING_INDEX(f.book_meta,'||',2)='Biology || Books' then SUBSTR(f.book_meta,21) when SUBSTRING_INDEX(f.book_meta,'||',1)='Biology' then SUBSTR(f.book_meta,12) when SUBSTRING_INDEX(f.book_meta,'||',1)='Maths' then SUBSTR(f.book_meta,10) when SUBSTRING_INDEX(f.book_meta,'||',1)='Physics' then SUBSTR(f.book_meta,12) when SUBSTRING_INDEX(f.book_meta,'||',1)='Chemistry' then SUBSTR(f.book_meta,14) else f.book_meta end as book_meta FROM (SELECT question_id,matched_question,ocr_text,subject from questions WHERE student_id= 100 and class='${caraousel.class}' and RIGHT(LEFT(doubt,9),2)='${weekNo}' and is_answered=1) as a left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as d on d.question_id=a.question_id left join answers as e on d.answer_id = e.answer_id inner join book_meta as f on a.matched_question=f.question_id ORDER by rand() LIMIT ${limit}`;
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": true,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'CONCEPT_BOOSTER') {
        let student_course = 'HOME_PAGE_CC'
        // const sql = `select concat(a.class,a.course,a.chapter_order) as id,CONVERT(a.class,CHAR(50)) as class, a.course as course,'${type}' as type,c.path_image as image_url,a.chapter as title,'' as description, a.chapter, 'CONCEPT BOOSTER' as capsule_text from (select DISTINCT chapter,chapter_order, class,course from mc_course_mapping where class = ${student_class} AND course = '${student_course}' AND active_status > 0 order by class ASC, chapter_order ASC) as a left join (select * from class_chapter_image_mapping where class = ${student_class} AND course = '${student_course}') as c on a.chapter = c.chapter and a.class=c.class and a.course=c.course order by rand() limit ${limit}`;
        // let data = await mysql_analytics.query(sql);
        // data = data.map((elem) => {
        //     elem.deeplink = `doubtnutapp://playlist?playlist_id=${elem.id}&playlist_title=${elem.title}&is_last=${elem.is_last}`
        //     return elem
        // })
        caraousel.items = []
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'TRENDING') {
        const sql = `SELECT cast(a.question_id as char(50)) AS id,'${caraousel.type}' as type, case when b.matched_question is null then concat('${base_url}',a.question_id,'.png') else concat('${base_url}',b.matched_question,'.png') end as image_url, left(b.ocr_text,100) AS title,left('${caraousel.description}',100) as description,b.resource_type FROM (select question_id,created_at from trending_videos where date(created_at) >= DATE_SUB(CURDATE(), INTERVAL 2 DAY) AND class = '${student_class}' LIMIT 5) as a left join (select question_id,ocr_text,question,matched_question,case when is_text_answered=1 and is_answered=0 then 'text' else 'video' end as resource_type from questions) as b on a.question_id = b.question_id left join (select c.chapter,d.packages, c.question_id from questions_meta as c left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as d on c.question_id=d.question_id ) as e on a.question_id=e.question_id left join(select duration,question_id from answers order by answer_id DESC limit 1 ) as f on f.question_id=a.question_id order by a.created_at desc LIMIT ${limit}`;
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": true,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'VIRAL') {
        const sql = `SELECT cast(a.question_id as char(50)) AS id, case when a.matched_question is null then concat('${base_url}', a.question_id, '.png') else concat('${base_url}', a.matched_question, '.png') end as image_url, left(a.ocr_text, 100) AS title, left('${caraousel.description}', 100) as description, a.resource_type FROM(select matched_question, question_id, student_id, ocr_text,case when is_text_answered = 1 and is_answered = 0 then 'text' else 'video' end as resource_type from questions WHERE student_id = 81) as a left join(select chapter, question_id from questions_meta) as b on a.question_id = b.question_id left join(select duration, question_id from answers order by answer_id DESC limit 1) as d on d.question_id = b.question_id left join(select * from studentid_package_mapping) as z on z.student_id = a.student_id order by rand() LIMIT ${limit} `;
        // console.log(sql);
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": true,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'NCERT_SOLUTIONS' && caraousel.data_type === 'ncert') {
        let sql = "select a.id as playlist_id,a.name as id,'" + caraousel.type + "' as type,a.image_url as image_url, case when b." + language + " is null then a.name else b." + language + " end as title,'" + caraousel.class + "' as class,left('" + caraousel.description + "',40) as description, 'NCERT' as capsule_text from (select * from new_library where parent='" + caraousel.mapped_playlist_id + "' and is_active=1 and is_delete=0 order by id asc ) as a left join (select DISTINCT chapter," + language + " from localized_ncert_chapter where class='" + caraousel.class + "') as b on a.name=b.chapter order by rand() LIMIT " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": true,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'GK') {
        const sql = `SELECT cast(a.question_id as char(50)) AS id, '${type}' as type, case when a.matched_question is null then concat('${base_url}', a.question_id, '.png') else concat('${base_url}', a.matched_question, '.png') end as image_url, left(a.ocr_text, 50) AS title, left('${caraousel.description}', 40) as description, b.chapter, c.packages as capsule_text, d.duration, '${duration[0]}' as duration_text_color, '${duration[1]}' as duration_bg_color FROM(select question_id, matched_question, ocr_text, student_id from questions WHERE student_id = 82) as a left join(select chapter, question_id from questions_meta) as b on a.question_id = b.question_id left join(select GROUP_CONCAT(packages) as packages, question_id from question_package_mapping group by question_id) as c on a.question_id = c.question_id left join(select duration, question_id from answers order by answer_id DESC) as d on d.question_id = c.question_id LIMIT ${limit} `;
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": true,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://video?qid=${elem.id}&page=HOME_FEED&playlist_id=${caraousel.mapped_playlist_id}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'DAILY_QUIZ') {
        caraousel.caraousel_type = 'real_time'
        return caraousel
    } else if (caraousel.type === 'DAILY_CONTEST') {
        let sql = "select cast(id as char(50)) as id,contest_name as title, logo as image_url, headline as description, '" + button[0] + "' as button_text,'" + button[2] + "' as button_bg_color,'" + button[1] + "' as button_text_color from contest_details LIMIT " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.image_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://daily_contest`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'APP_BANNER') {
        // let subtitle = ''
        // caraousel.scroll_type = 'APP_BANNER'
        // if (caraousel.scroll_size === '1x') {
        //     let sql = "select cast(id as char(50)) as id, image_url, left(description,50) as title," +
        //         " action_activity, action_data,'" + button[0] + "' as button_text, '" + button[1] + "' as button_text_color, '" + button[2] + "' as button_bg_color, '" + subtitle + "' as subtitle, '" + description + "' as description from app_banners where type ='1x' and is_active=1 and class in ('" + student_class + "','all') and page_type like '%HOME%' and min_version_code<585 and max_version_code>=585 order by banner_order limit " + limit;
        //     let data = await mysql_analytics.query(sql)
        //     data = data.map((elem) => {
        //         let mappedObject = {
        //             "title": elem.title,
        //             "subtitle": elem.description,
        //             "show_whatsapp": false,
        //             "show_video": false,
        //             "image_url": elem.image_url,
        //             "card_width": caraousel.scroll_size, // percentage of screen width
        //             "aspect_ratio": "",
        //             "id": elem.id,
        //         };
        //         elem.action_data = JSON.parse(elem.action_data)
        //         if (elem.action_activity == 'playlist') {
        //             mappedObject.deeplink = `doubtnutapp://playlist?playlist_id=${elem.action_data.playlist_id}&playlist_title=${encodeURI(elem.action_data.playlist_title)}&is_last=${elem.action_data.is_last}`
        //         }

        //         if (elem.action_activity == 'camera') {
        //             mappedObject.deeplink = `doubtnutapp://camera`
        //         }
        //         if (elem.action_activity == 'daily_contest') {
        //             mappedObject.deeplink = `doubtnutapp://daily_contest`
        //         }
        //         if (elem.action_activity == 'external') {
        //             mappedObject.deeplink = `doubtnutapp://external_url?url=${elem.action_data.url}`
        //         }
        //         return mappedObject
        //     })
        //     caraousel.items = data
        //     caraousel.caraousel_type = 'caraousel'
        //     return caraousel
        //     // promise.push(AppBannerContainer.getAppBanner1xDataNew(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, data.version_code, db));
        // } else if (caraousel.scroll_size === '1.5x') {
        //     let sql = "select cast(id as char(50)) as id, '" + type + "' as type, image_url,left(description,50) as title, action_activity, action_data,'" + button[0] + "' as button_text, '" + button[1] + "' as button_text_color, '" + button[2] + "' as button_bg_color, '" + subtitle + "' as subtitle, '" + description + "' as description from app_banners where type='1.5x' and is_active=1 and class in ('" + student_class + "','all') limit " + limit
        //     let data = await mysql_analytics.query(sql)
        //     data = data.map((elem) => {
        //         let mappedObject = {
        //             "title": elem.title,
        //             "subtitle": elem.description,
        //             "show_whatsapp": false,
        //             "show_video": false,
        //             "image_url": elem.image_url,
        //             "card_width": caraousel.scroll_size, // percentage of screen width
        //             "aspect_ratio": "",
        //             "id": elem.id,
        //         };
        //         elem.action_data = JSON.parse(elem.action_data)
        //         if (elem.action_activity == 'playlist') {
        //             mappedObject.deeplink = `doubtnutapp://playlist?playlist_id=${elem.action_data.playlist_id}&playlist_title=${encodeURI(elem.action_data.playlist_title)}&is_last=${elem.action_data.is_last}`
        //         }

        //         if (elem.action_activity == 'camera') {
        //             mappedObject.deeplink = `doubtnutapp://camera`
        //         }
        //         if (elem.action_activity == 'daily_contest') {
        //             mappedObject.deeplink = `doubtnutapp://daily_contest`
        //         }
        //         if (elem.action_activity == 'external') {
        //             mappedObject.deeplink = `doubtnutapp://external_url?url=${elem.action_data.url}`
        //         }
        //         return mappedObject
        //     })
        //     caraousel.items = data
        //     caraousel.caraousel_type = 'caraousel'
        //     return caraousel
        // promise.push(AppBannerContainer.getAppBanner15xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, db));
        // } else if (caraousel.scroll_size === '2.5x') {
        //     let sql = "select cast(id as char(50)) as id, '" + type + "' as type, image_url,left(description,50) as title, action_activity, action_data,'" + button[0] + "' as button_text, '" + button[1] + "' as button_text_color, '" + button[2] + "' as button_bg_color, '" + subtitle + "' as subtitle, '" + description + "' as description from app_banners where type='2.5x' and is_active=1 and class in ('" + student_class + "','all') limit " + limit
        //     let data = await mysql_analytics.query(sql)
        //     data = data.map((elem) => {
        //         let mappedObject = {
        //             "title": elem.title,
        //             "subtitle": elem.description,
        //             "show_whatsapp": false,
        //             "show_video": false,
        //             "image_url": elem.image_url,
        //             "card_width": caraousel.scroll_size, // percentage of screen width
        //             "aspect_ratio": "",
        //             "id": elem.id,
        //         };
        //         elem.action_data = JSON.parse(elem.action_data)
        //         if (elem.action_activity == 'playlist') {
        //             mappedObject.deeplink = `doubtnutapp://playlist?playlist_id=${elem.action_data.playlist_id}&playlist_title=${encodeURI(elem.action_data.playlist_title)}&is_last=${elem.action_data.is_last}`
        //         }

        //         if (elem.action_activity == 'camera') {
        //             mappedObject.deeplink = `doubtnutapp://camera`
        //         }
        //         if (elem.action_activity == 'daily_contest') {
        //             mappedObject.deeplink = `doubtnutapp://daily_contest`
        //         }
        //         if (elem.action_activity == 'external') {
        //             mappedObject.deeplink = `doubtnutapp://external_url?url=${elem.action_data.url}`
        //         }
        //         return mappedObject
        //     })
        //     caraousel.items = data
        //     caraousel.caraousel_type = 'caraousel'
        //     return caraousel
        //     //     promise.push(AppBannerContainer.getAppBanner25xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, db));
        // }
        caraousel.caraousel_type = 'real_time'
        return caraousel
    } else if (caraousel.type === 'QUIZ_WINNER') {
        // let sql = "Select cast(student_id as char(50)) as id,'" + caraousel.data_type + "' as type,left(student_username,50) as title,case when img_url='' or img_url is null then 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/feed_profile.png' else img_url end as image_url from quiz_winners where date_q=date_sub(CURRENT_DATE, INTERVAL " + 1 + " DAY)";
        // let data = await mysql_analytics.query(sql);
        caraousel.items = []
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'SUPER_SERIES') {
        let sql = "SELECT DISTINCT cast(package_id as char(50)) as id, package_id,package,NULL as level1,NULL as level2,NULL as location,class,NULL as status,package_order,'" + caraousel.type + "' as type, package as title,img_url,'" + description + "' as description from pdf_download where package_id in (2,4,20) and class ='" + student_class + "' and status=1 order by rand()"
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": true,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://downloadpdf_level_one?pdf_package=${elem.package}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.deeplink = `doubtnutapp://download_pdf`
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'JEE MAINS 2019 - APRIL') {
        let sql = "SELECT DISTINCT cast(concat(package_id,level1) as char(50)) as id, package_id,package,level1,NULL as level2,NULL as location,class,NULL as status,package_order,'" + caraousel.type + "' as type, level1 as title,img_url,'" + description + "' as description from pdf_download where package_id in (28) and class ='" + student_class + "' and status=1 order by rand()"
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://downloadpdf_level_two?pdf_package=${elem.package}&level_one=${elem.level1}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.deeplink = `doubtnutapp://downloadpdf_level_one?pdf_package=${caraousel.type}`;
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'NEET 2019 SOLUTIONS') {
        let sql = "SELECT DISTINCT cast(concat(package_id,level1) as char(50)) as id, package_id,package,level1,NULL as level2,location,class,NULL as status,package_order,'" + caraousel.type + "' as type, level1 as title,img_url,'" + description + "' as description from pdf_download where package_id in (29) and class ='" + student_class + "' and status=1 order by rand()"
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://downloadpdf_level_two?pdf_package=${elem.package}&level_one=${elem.level1}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.deeplink = `doubtnutapp://downloadpdf_level_one?pdf_package=${caraousel.type}`;
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'MOCK TEST') {
        let sql = "SELECT cast(concat(package_id,level1) as char(50)) as id, package_id,package,level1,NULL as level2,NULL as location,class,NULL as status,package_order,'" + caraousel.type + "' as type, level1 as title,img_url,'" + description + "' as description from pdf_download where package_id in (27) and class ='" + student_class + "' and status=1 group by package_id, package,level1,class,package_order order by rand() limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://downloadpdf_level_two?pdf_package=${elem.package}&level_one=${elem.level1}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.deeplink = `doubtnutapp://downloadpdf_level_one?pdf_package=${caraousel.type}`;
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'JEE_MAINS_PY') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type, case when level1 is null then package else level1 end as title,img_url, '" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (10) and class ='" + student_class + "' and status=1 order by id desc limit " + limit

        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'JEE_ADV_PY') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type, case when level1 is null then package else level1 end as title,img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (9) and class ='" + student_class + "' and status=1 order by id desc limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'FORMULA_SHEET') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level2 is null then package else level2 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (17) and class ='" + student_class + "' and status=1 order by rand() limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'CUTOFF_LIST') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level2 is null then package else level2 end as title,img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (18) and class ='" + student_class + "' and status=1 and level1='2018' order by rand() limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === '12_BOARDS_PY') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (11) and class ='" + student_class + "' and status=1 order by id desc limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'SAMPLE_PAPERS') {
        if (student_class === '12' || student_class === '11') {
            let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (15) and class ='" + student_class + "' and status=1 order by rand() limit " + limit
        } else {
            let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (16) and class ='" + student_class + "'and status=1 order by id desc limit " + limit
        }
        let data = await mysql_analytics.query(sql);

        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'MOST_IMPORTANT_QUESTIONS') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title,img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (5) and class ='" + student_class + "' and status=1 order by rand() limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'IBPS_CLERK_SPECIAL') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (3) and class ='" + student_class + "'and status=1 order by rand() limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'NCERT_SOLUTIONS') {
        if (student_class == '14') {
            sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'downloadpdf_level_two' as action_activity,'" + description + "' as description from pdf_download where package_id in (13) and class ='" + student_class + "' and status=1 group by level1 order by rand() limit " + limit
        }
        else {
            sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level2 is null then package else level2 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (13) and class ='" + student_class + "' and status=1 order by rand() limit " + limit
        }
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === '9_FOUNDATION_COURSE') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (1) and class ='" + student_class + "'and status=1 order by rand() limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === '10_BOARDS_PY') {
        let sql = "SELECT cast(id as char(50)) as id,package_id,package,level1,level2,location,class,status,package_order,'" + caraousel.type + "' as type,case when level1 is null then package else level1 end as title, img_url,'" + action_activity + "' as action_activity,'" + description + "' as description from pdf_download where package_id in (14) and class ='" + student_class + "' and status=1 order by id desc limit " + limit
        let data = await mysql_analytics.query(sql);
        data = data.map((elem) => {
            let mappedObject = {
                "title": elem.title,
                "subtitle": elem.description,
                "show_whatsapp": false,
                "show_video": false,
                "image_url": elem.img_url,
                "card_width": caraousel.scroll_size, // percentage of screen width
                "aspect_ratio": "",
                "deeplink": `doubtnutapp://pdf_viewer?pdf_url=https://d10lpgp6xz60nq.cloudfront.net/pdf_download/${elem.location}`,
                "id": elem.id,
            };
            return mappedObject
        })
        caraousel.items = data
        caraousel.caraousel_type = 'caraousel'
        return caraousel
    } else if (caraousel.type === 'SFY') {
        caraousel.caraousel_type = 'real_time'
        return caraousel
    }
}