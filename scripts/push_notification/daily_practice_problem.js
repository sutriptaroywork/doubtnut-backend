require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const mysql_analytics = new database(config.mysql_analytics);
const mysql_write = new database(config.write_mysql);
const _ = require('lodash');
( async () => {
    try {
        console.time('select_view_id_range')
        let select_min_view_id = "Select view_id from video_view_stats where created_at > DATE_SUB(CURRENT_DATE, INTERVAl 7 DAY) LIMIT 1";
        let select_max_view_id = "Select view_id from video_view_stats where created_at < CURRENT_DATE ORDER BY created_at DESC LIMIT 1";

        let max_view_id = mysql_analytics.query(select_max_view_id)
        let min_view_id = mysql_analytics.query(select_min_view_id);
        max_view_id = await max_view_id
        min_view_id = await min_view_id;
        console.timeEnd('select_view_id_range')

        let dpp_sql = `Select CURRENT_TIMESTAMP,t1.student_id,t1.class,t1.chapter,max(t1.view_Chapter) as view_chapter from (SELECT a.student_id, b.chapter, b.class, count(a.view_id) as view_chapter from (Select view_id,student_id,question_id from video_view_stats where source = 'android' and view_id >= ${min_view_id[0].view_id} and view_id <= ${max_view_id[0].view_id})  as a inner join (select question_id,class,chapter from questions_meta where chapter is not NULL or chapter <> '') as b on a.question_id=b.question_id group by a.student_id, b.chapter, b.class order by a.student_id desc, view_chapter DESC) as t1  group by t1.student_id having max(t1.view_chapter)>3`;

        let dpp_old_sql = `Select CURRENT_TIMESTAMP, t3.student_id, t4.class, t4.chapter, t3.view_chapter from (Select t1.student_id, max(t1.view_Chapter) as view_chapter from (SELECT a.student_id, b.chapter, b.class, count(a.view_id) as view_chapter from (Select view_id,student_id,question_id from video_view_stats where source = 'android' and view_id >= ${min_view_id[0].view_id} and view_id <= ${max_view_id[0].view_id})  as a inner join questions_meta as b on a.question_id=b.question_id where b.chapter is not NULL AND b.chapter <> '' AND b.chapter not like 'TIPS%' group by a.student_id, b.chapter, b.class order by a.student_id desc, view_chapter DESC) as t1  group by t1.student_id having max(t1.view_chapter)>3) as t3 left join (SELECT c.student_id, d.chapter, d.class, count(c.view_id) as view_chapter from (Select view_id,student_id,question_id from video_view_stats where source = 'android' and view_id >= ${min_view_id[0].view_id} and view_id <= ${max_view_id[0].view_id})  as c inner join questions_meta as d on c.question_id=d.question_id where d.chapter is not NULL OR d.chapter <> '' group by c.student_id, d.chapter, d.class) as t4 on t3.student_id = t4.student_id and t3.view_chapter = t4.view_chapter`;


        console.time('students_daily_problems')

        let dpp_data = await mysql_analytics.query(dpp_old_sql)

        //data is ready first truncate table
        let truncate_dpp = await mysql_write.query('TRUNCATE TABLE students_daily_problems')

        //insert chuked data in db sync
        let inserts = await Promise.all(_.chunk(dpp_data,50000).map(async (dpp_chunk)=>{
            console.log(dpp_data.length)
            let insertArray = dpp_chunk.map(data => Object.values(data));
            return mysql_write.query('INSERT INTO students_daily_problems (timestamp, student_id, class, chapter, view_count)  VALUES  ?',[insertArray])

        }))
        console.timeEnd('students_daily_problems')
        let truncate_dpp_qid = await mysql_write.query('TRUNCATE TABLE student_daily_problems_qid');


        console.time('populate_dpp_qid')

        let promises = []
        for (var i = 0; i < dpp_data.length; i++) {
            console.log(dpp_data.length)
            console.log(i)
            let questions_query = await mysql_analytics.query("SELECT question_id,level,target_course from questions_meta WHERE chapter = ? and class = ? and language like 'hin%' and doubtnut_recommended like 'Reco%' ORDER BY RAND() LIMIT 10",[dpp_data[i]['chapter'],dpp_data[i]['class']])
            for (var j = 0; j < questions_query.length; j++) {
                let sql = "INSERT INTO student_daily_problems_qid VALUES (NULL,CURRENT_TIMESTAMP,?,?,?,?,?,?)"
                promises.push(mysql_write.query(sql,[dpp_data[i].student_id,dpp_data[i].class,dpp_data[i].chapter,questions_query[j].question_id,questions_query[j].level,questions_query[j].target_course]))
            }
        }
        try {
            const resolvedPromises = await Promise.all(promises)
        } catch (e) {

        }

        console.timeEnd('populate_dpp_qid')
        return 1

    } catch (e) {
        console.log(e)
        return 1
    } finally {
        mysql_analytics.close()
        mysql_write.close()
        process.exit()
    }
})()
