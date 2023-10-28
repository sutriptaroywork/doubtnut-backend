require('dotenv').config({ path: `${__dirname}/../../api_server/.env` });
const _ = require('lodash');
const moment = require('moment');
const config = require('../../api_server/config/config');
const Pagerduty = require(`${__dirname}/../../api_server/modules/pagerduty/pagerduty`);
const Database = require('./database');
const redisKey = require('../../api_server/modules/redis/keys')
const CourseContainerv2 = require('../../api_server/modules/containers/coursev2');
const CourseMysqlv2 = require('../../api_server/modules/mysql/coursev2');

const redis = require('../../api_server/config/redis');

const cronServerServiceID = 'P9T0CZU';




function getCourseAssortmentClassCombination(mysql) {
    const query = 'select distinct assortment_id, class, is_free from course_details where assortment_type=\'course\' and start_date < now() and end_date > now()';
    return mysql.query(query);
}

function getUpcomingLecturesByAssortmentId(database, assortmentId) {
    const sql = 'select b.*,a.live_at,d.*,e.course_resource_id as chapter_assortment from (select * from course_resource_mapping where resource_type=\'resource\' and is_replay=0 and live_at > now()) as a inner join (select * from course_resources cr where resource_type in (1,4,8)) as b on a.course_resource_id=b.id inner join (select assortment_id,is_free,meta_info as assortment_locale from course_details where is_free=1 and assortment_type=\'resource_video\') as d on d.assortment_id=a.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=a.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as e on e.course_resource_id=c.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where assortment_id = ?) as f on f.course_resource_id=e.assortment_id group by b.resource_reference order by a.live_at limit 10';
    return database.query(sql, [assortmentId]);
}

function getLiveNowLecturesByAssortmentId(database, assortmentId) {
    const sql = 'select a.*,b.live_at,d.*,e.answer_id,e.duration, case when du.image_url_left_full is null then du.image_url ELSE du.image_url_left_full end as expert_image2 from (select *,case when player_type=\'youtube\' and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,4,8)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and live_at>=CURRENT_DATE() and is_replay=0 and live_at < now()) as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info,category from course_details where assortment_type=\'resource_video\') as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id = ?)) left join answers as e on e.question_id=a.question_id left join dashboard_users as du on a.faculty_id=du.id where (a.stream_status=\'ACTIVE\') OR (DATE_ADD(b.live_at,INTERVAL e.duration SECOND) > now()) group by a.question_id';
    return database.query(sql, [assortmentId]);
}

function getReplayLecturesByAssortmentId(database, assortmentId) {
    const sql = 'select a.*,b.live_at,d.*,e.answer_id,e.duration from (select *,case when player_type=\'youtube\' and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,4,8)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and live_at>=CURRENT_DATE() and live_at<now() and is_replay=2) as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info as course_language from course_details where assortment_type=\'resource_video\' and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id = ?)) left join answers as e on e.question_id=a.question_id group by a.question_id limit 3';
    return database.query(sql, [assortmentId]);
}

function getRecentLecturesByAssortmentId(database, assortmentId, startTime, endTime, category, studentClass) {
    let sql = '';
    if (parseInt(studentClass) === 14){
        sql = 'SELECT cr.*, a.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at, crm3.assortment_id as chapter_assortment from (SELECT DISTINCT assortment_id, display_name,is_free,meta_info as assortment_locale,category_type as course_session FROM course_details WHERE assortment_id = ? and parent = 1 and is_free=1 and category_type in (\'SSC\',\'BANKING\',\'RAILWAY\',\'CTET\',\'DEFENCE/NDA/NAVY\')) as a left join course_resource_mapping crm1 on a.assortment_id=crm1.assortment_id and crm1.resource_type like "assortment" left join course_resource_mapping crm2 on crm1.course_resource_id=crm2.assortment_id and crm2.resource_type like "assortment" left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id where crm4.live_at is not null and crm4.live_at between ? and ? and crm4.is_replay=0 and cr.resource_type in (1) group by cr.id order by assortment_locale, crm4.live_at desc limit 10';
        // console.log(sql);
        return database.query(sql, [assortmentId, startTime, endTime]);
    }

    if (category === 'iit_neet') {
        sql = 'SELECT cr.*, a.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at, crm3.assortment_id as chapter_assortment from (SELECT DISTINCT assortment_id, display_name,is_free,meta_info as assortment_locale,CONCAT(category,\' \',year_exam,\' \',meta_info) as course_session FROM course_details WHERE assortment_id = ? and parent = 1 and is_free=1) as a left join course_resource_mapping crm1 on a.assortment_id=crm1.assortment_id and crm1.resource_type like "assortment" left join course_resource_mapping crm2 on crm1.course_resource_id=crm2.assortment_id and crm2.resource_type like "assortment" left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id where crm4.live_at is not null and crm4.live_at between ? and ? and crm4.is_replay=0 and cr.resource_type in (1) group by cr.id order by assortment_locale, crm4.live_at desc limit 10';
        // console.log(sql);
        return database.query(sql, [assortmentId, startTime, endTime]);
    }
    sql = 'SELECT cr.*, a.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at, crm3.assortment_id as chapter_assortment from (SELECT DISTINCT assortment_id, display_name,is_free,meta_info as assortment_locale,CONCAT(year_exam-1,\'-\',substr(year_exam,3),\' \',meta_info) as course_session FROM course_details WHERE assortment_id = ? and parent = 1 and is_free=1 and category_type in (\'BOARDS/SCHOOL/TUITION\',\'BANKING\',\'RAILWAY\')) as a left join course_resource_mapping crm1 on a.assortment_id=crm1.assortment_id and crm1.resource_type like "assortment" left join course_resource_mapping crm2 on crm1.course_resource_id=crm2.assortment_id and crm2.resource_type like "assortment" left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id where crm4.live_at is not null and crm4.live_at between ? and ? and crm4.is_replay=0 and cr.resource_type in (1) group by cr.id order by assortment_locale, crm4.live_at desc limit 10';
    // console.log(sql);
    return database.query(sql, [assortmentId, startTime, endTime]);
}

function getDemoVideoExperiment(database, assortmentId) {
    let sql = '';
    if (+assortmentId === 15 || +assortmentId === 16) {
        // 230-270 ms
        sql = 'select a.*,b.live_at,d.*,e.answer_id,e.duration from (select *,case when player_type="youtube" and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,8)) as a inner join (select * from course_resource_mapping where resource_type="resource") as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,meta_info as course_language from course_details where assortment_type="resource_video" and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?))) left join answers as e on e.question_id=a.question_id group by d.assortment_id';
        return database.query(sql, [assortmentId]);
    }
    // 240-280 ms
    sql = 'select a.*,b.live_at,b.batch_id,d.*,e.answer_id,e.duration, \'demo\' as top_title1 from (select *,case when player_type="youtube" and meta_info is not null then meta_info ELSE resource_reference end as question_id from course_resources cr where resource_type in (1,8,9)) as a inner join (select * from course_resource_mapping where resource_type="resource") as b on b.course_resource_id=a.id inner join (select assortment_id,is_free,display_image_square, meta_info as course_language from course_details where assortment_type="resource_video" and is_free=1) as d on d.assortment_id=b.assortment_id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type="assortment") as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join answers as e on e.question_id=a.question_id group by d.assortment_id, b.batch_id order by FIELD(subject, \'GUIDANCE\',\'ANNOUNCEMENT\') desc';
    return database.query(sql, [assortmentId]);
}

async function getBatchesFromAssortment(database, assortmentId) {
    const sql = 'select * from course_assortment_batch_mapping where assortment_id = ? and is_active = 1';
    return database.query(sql, [assortmentId]);
}

async function getSubjectAssortments(database, assortmentList) {
    const sql = 'select * from course_details where assortment_id in (?) and assortment_type = \'subject\' and is_active = 1';
    return database.query(sql, [assortmentList]);
}

async function redisHandling(redis, data, type, groupedAssortments, assortmentId) {
    if (_.isEmpty(data)) {
        // may be set herding key ??
        // console.log('empty');
    } else {
    // set in redis with all class combination
        groupedAssortments[assortmentId].map(async (item) => {
            // console.log(item.class);
            // set data in redis
            await redis.setAsync(`${redisKey[type].key}${assortmentId}`, JSON.stringify(data), 'Ex', redisKey[type].expiry);
        });
    }
}

async function cacheLiveSectionFromAssortmentHome(db, assortmentId) {
    const assortmentDetails = {
        assortment_id: assortmentId,
    };
    let allAssortments = await CourseContainerv2.getAllAssortments(db, [assortmentDetails.assortment_id]);
    let subject = null;
    const { assortmentList } = allAssortments;
    allAssortments = allAssortments.totalAssortments;
    if (assortmentList.indexOf(assortmentDetails.assortment_id) < 0) {
        assortmentList.push(parseInt(assortmentDetails.assortment_id));
    }
    if (allAssortments.indexOf(assortmentDetails.assortment_id) < 0) {
        allAssortments.push(parseInt(assortmentDetails.assortment_id));
    }
    const batchIds = await getBatchesFromAssortment(db.mysql.read, assortmentDetails.assortment_id);
    if (batchIds.length === 0) batchIds.push({ batch_id: 1 });
    for (let batchId of batchIds) {
        console.log(`Caching parent assortment ${assortmentDetails.assortment_id}`);
        let liveSectionData = await CourseMysqlv2.getLiveSectionFromAssortmentHome(db.mysql.read, assortmentList, '', subject, batchId.batch_id);
        liveSectionData = liveSectionData.map((item) => {
            item.students = Math.floor(10000 + Math.random() * 20000);
            item.interested = Math.floor(20000 + Math.random() * 30000);
            return item;
        });
        await redis.setAsync(`${redisKey['course_live_section_home'].key}:${assortmentDetails.assortment_id}_${subject}_${batchId.batch_id}`, JSON.stringify(liveSectionData), 'Ex', redisKey['course_live_section_home'].expiry);
    }
    let subjectAssortments = await getSubjectAssortments(db.mysql.read, allAssortments);
    for (const subjectDetails of subjectAssortments) {
        let allSubjectAssortments = await CourseContainerv2.getAllAssortments(db, [subjectDetails.assortment_id]);
        const { assortmentList: subjectAssortmentList } = allSubjectAssortments;
        allSubjectAssortments = allSubjectAssortments.totalAssortments;
        if (subjectAssortmentList.indexOf(subjectDetails.assortment_id) < 0) {
            subjectAssortmentList.push(parseInt(subjectDetails.assortment_id));
        }
        subject = subjectDetails.display_name;
        console.log(`Caching subject assortment ${subjectDetails.assortment_id}`);
        const subjectBatchIds = await getBatchesFromAssortment(db.mysql.read, subjectDetails.assortment_id);
        if (subjectBatchIds.length === 0) subjectBatchIds.push({ batch_id: 1 });
        for (let batchId of subjectBatchIds) {
            let liveSectionData = await CourseMysqlv2.getLiveSectionFromAssortmentHome(db.mysql.read, subjectAssortmentList, '', subject, batchId.batch_id);
            liveSectionData = liveSectionData.map((item) => {
                item.students = Math.floor(10000 + Math.random() * 20000);
                item.interested = Math.floor(20000 + Math.random() * 30000);
                return item;
            });
            await redis.setAsync(`${redisKey['course_live_section_home'].key}:${subjectDetails.assortment_id}_${subject}_${batchId.batch_id}`, JSON.stringify(liveSectionData), 'Ex', redisKey['course_live_section_home'].expiry);
        }
    }
}

async function cacheLiveSectionFromAssortment(db, assortmentId) {
    const batchIds = await getBatchesFromAssortment(db.mysql.read, assortmentId);
    if (batchIds.length === 0) batchIds.push({ batch_id: 1 });
    for (let batchId of batchIds) {
        const data = await CourseMysqlv2.getLiveClassesByAssortmentID(db.mysql.read, assortmentId, batchId.batch_id);
        await redis.setAsync(`${redisKey['course_live_section'].key}:${assortmentId}:${batchId.batch_id}`, JSON.stringify(data), 'Ex', redisKey['course_live_section'].expiry);
    }
}

async function getRevisionClasses(database, assortmentId) {
    const sql=`SELECT cr.*, a.*, crm4.course_resource_id,crm4.name,crm4.resource_type,crm4.live_at,crm3.assortment_id as chapter_assortment from (SELECT DISTINCT assortment_id, display_name,is_free,meta_info as assortment_locale,category_type as course_session FROM course_details WHERE assortment_id = ? and parent = 1 and is_free=1) as a left join course_resource_mapping crm1 on a.assortment_id=crm1.assortment_id and crm1.resource_type like "assortment" left join course_resource_mapping crm2 on crm1.course_resource_id=crm2.assortment_id and crm2.resource_type like "assortment" left join course_resource_mapping crm3 on crm2.course_resource_id=crm3.assortment_id and crm3.resource_type like "assortment" left join course_resource_mapping crm4 on crm3.course_resource_id=crm4.assortment_id and crm4.resource_type like "resource" left join course_resources cr on crm4.course_resource_id=cr.id left join liveclass_course_details lcd on lcd.id = crm4.is_trial where crm4.live_at is not null and crm4.is_replay=0 and cr.resource_type in (1) and lcd.lecture_type in  ('Revision-One ShotClasses','term_two_classes') group by cr.id order by assortment_locale, crm4.live_at desc`;
    return  database.query(sql, [assortmentId]);
}

async function main() {
let mysqlClient;
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
    try {

        const db = {};
        db.mysql = {};
        db.redis = {
            read: redis,
            write: redis,
        };
         mysqlClient = new Database(config.mysql_analytics);
        db.mysql.read = mysqlClient;
        db.mysql.write = mysqlClient;
        // get all the combinations of class and assortments
        const assortmentClass = await getCourseAssortmentClassCombination(mysqlClient);
        const groupedAssortments = _.groupBy(assortmentClass, 'assortment_id');
        const revisionClassAssortmentIds=[159772,159773,159774,159775,165055,165056,165057,165058]
        // assortment wise data will be same but we will set data in redis based on assortment + class combination
        let totalAssortmentProcessed = 0;
        for (const assortmentId in groupedAssortments) {
            // eslint-disable-next-line no-prototype-builtins
            if (groupedAssortments.hasOwnProperty(assortmentId)) {
                let studentClass = groupedAssortments[assortmentId][0].class
                for(let i=0;i< groupedAssortments[assortmentId].length;i++ ){
                    if(parseInt(groupedAssortments[assortmentId][i].class)===14){
                        studentClass = 14;
                    }
                }
                // check if it is free or not
                // if (groupedAssortments[assortmentId][0].is_free === 0) {
                // paid assortments cache logic will go here
                // } else {
                // free assortments cache logic will go here
                let startTimeBoard = moment().add(5, 'hours').add(30, 'minutes').subtract(3, 'days')
                .startOf('hour')
                .format('YYYY-MM-DD HH:mm:ss');
                let endTimeBoard = moment().add(5, 'hours').add(30, 'minutes').startOf('hour')
                .format('YYYY-MM-DD HH:mm:ss');
                const startTimeNeet = moment().add(5, 'hours').add(30, 'minutes').subtract(3, 'days')
                .startOf('hour')
                .format('YYYY-MM-DD HH:mm:ss');
                const endTimeNeet = moment().add(5, 'hours').add(30, 'minutes').startOf('hour')
                .format('YYYY-MM-DD HH:mm:ss');
                const upcomingLectures = await getUpcomingLecturesByAssortmentId(mysqlClient, assortmentId);
                const liveNowLectures = await getLiveNowLecturesByAssortmentId(mysqlClient, assortmentId);
                const replayLectures = await getReplayLecturesByAssortmentId(mysqlClient, assortmentId);
                const boardsLectures = await getRecentLecturesByAssortmentId(mysqlClient, assortmentId, startTimeBoard, endTimeBoard, 'boards', studentClass);
                const iitNeetLectures = await getRecentLecturesByAssortmentId(mysqlClient, assortmentId, startTimeNeet, endTimeNeet, 'iit_neet', studentClass);

                if(revisionClassAssortmentIds.includes(parseInt(assortmentId))){
                    const revisionLectures = await getRevisionClasses(mysqlClient, assortmentId);
                    await redisHandling(db.redis.write, revisionLectures, 'revision_classes', groupedAssortments, assortmentId);
                }
                // const demoVideosData = await getDemoVideoExperiment(mysqlClient, assortmentId);
                await redisHandling(db.redis.write, upcomingLectures, 'upcoming', groupedAssortments, assortmentId);
                await redisHandling(db.redis.write, liveNowLectures, 'live_now', groupedAssortments, assortmentId);
                await redisHandling(db.redis.write, replayLectures, 'replay', groupedAssortments, assortmentId);
                await redisHandling(db.redis.write, boardsLectures, 'recent_boards', groupedAssortments, assortmentId);
                await redisHandling(db.redis.write, iitNeetLectures, 'recent_iit_neet', groupedAssortments, assortmentId);
                await cacheLiveSectionFromAssortmentHome(db, assortmentId);
                await cacheLiveSectionFromAssortment(db, assortmentId);
                // console.log(assortmentId)
                // console.log(demoVideosData)
                // await redisHandling(demoVideosData, 'course_demo_video', groupedAssortments, assortmentId);
                // }
                totalAssortmentProcessed++;
            }
        }
        console.log('totalAssortmentProcessed');
        console.log(totalAssortmentProcessed);
        console.log('script done');
    } catch (e) {
        console.log(e);
        const title = 'Issue in Redis cache script';
        const from = 'vivek@doubtnut.com';
        // await Pagerduty.createIncident(config.pagerduty_api_key, cronServerServiceID, title, from);
    } finally {
        mysqlClient.connection.end();
        redis.disconnect();
    }
}
main()
