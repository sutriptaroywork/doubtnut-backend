const Redshift = require('node-redshift');

require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require(__dirname + '/../../api_server/config/database');

const mysql = new database(config.mysql_analytics);
const mysqlWrite = new database(config.write_mysql);

// const { v2 } = require('@google-cloud/translate');
// const translator = new v2.Translate({ projectId: process.env.GOOGLE_PROJECT_ID, key: process.env.GOOGLE_API_KEY });

let RSclient = {
    user: config.redshift.user,
    database: config.redshift.database,
    password: config.redshift.password,
    port: config.redshift.port,
    host: config.redshift.host,
};
const redshiftClient = new Redshift(RSclient);

function getTopChapter(setClass, setSubject) {
    const sql = `SELECT c.class, d.subject, c.chapter, c.date_v, count(c.view_id) as count_v from (Select date(a.created_at) as date_v,a.view_id, b.class, b.chapter, b.subtopic from (SELECT * FROM classzoo1.video_view_stats where created_at + interval '330 minutes'>=current_date - 1 and created_at + interval '330 minutes' < current_date and source like 'android' and view_from like 'SRP') as a left join  classzoo1.questions_meta as b on a.question_id=b.question_id  where b.chapter is not NULL and b.class = '${setClass}') as c  left join (Select DISTINCT class, subject, chapter from classzoo1.mc_course_mapping) as d on c.class = d.class and c.chapter=d.chapter where upper(d.subject) like '${setSubject}' group by c.date_v, c.class, d.subject, c.chapter order by count_v desc limit 5`;
    // console.log(sql);
    return redshiftClient.query(sql);
}

function getSubTopic(setClass, chapter) {
    const sql = `SELECT c.class, c.subtopic, c.chapter, c.date_v, count(c.view_id) as count_st from (Select date(a.created_at) as date_v,a.view_id, b.class, b.chapter, b.subtopic from (SELECT * FROM classzoo1.video_view_stats where created_at + interval '330 minutes'>=current_date - 1 and created_at + interval '330 minutes' < current_date  and source like 'android' and view_from like 'SRP') as a left join  classzoo1.questions_meta as b on a.question_id=b.question_id  where b.chapter like '${chapter}' and b.class = '${setClass}') as c group by c.date_v, c.class, c.subtopic, c.chapter order by count_st desc limit 5`;
    // console.log(sql);
    return redshiftClient.query(sql);
}

function getLocalisedSubtopic(stClass, subject, engSubtopic) {
    const sql = `select subtopic_hindi from localized_mc_course_mapping where class=${stClass} and subject='${subject}' and subtopic='${engSubtopic}' limit 1`;
    // console.log(sql);
    return mysql.query(sql);
}

function addSlashes(str) {
    str = str.replace(/\\/g, "\\\\").replace(/"/g, "\\'").replace(/'/g, "\\'");
    return str;
}

async function main() {
    const sClass = [6, 7, 8, 9, 10, 11, 12, 14];
    // const sClass = [12];
    const subject = ["PHYSICS", "CHEMISTRY", "MATHS", "BIOLOGY"];
    // const subject = ["PHYSICS"];
    for (let j = 0; j < sClass.length; j++) {
        const setClass = sClass[j];
        for (let k = 0; k < subject.length; k++) {
            const setSubject = subject[k];
            const getTopChapterData = await getTopChapter(setClass, setSubject);
            const chapterDataRows = getTopChapterData.rows;
            for (let l = 0; l < chapterDataRows.length; l++) {
                const dataClass = chapterDataRows[l]['class'];
                const chapter = chapterDataRows[l]['chapter'] ? addSlashes(chapterDataRows[l]['chapter']) : null;
                console.log(chapterDataRows[l]['date_v'] + " class " + dataClass);
                if (chapter) {
                    const subtopicData = await getSubTopic(dataClass, chapter);
                    const subtopicDataRows = subtopicData.rows;
                    const promise = [];
                    for (let m = 0; m < subtopicDataRows.length; m++) {
                        const obj = {};
                        obj.date_v = chapterDataRows[l]['date_v'];
                        obj.class = dataClass;
                        obj.subject = chapterDataRows[l]['subject'];
                        obj.chapter = chapter;
                        obj.subtopic = subtopicDataRows[m]['subtopic'] ? addSlashes(subtopicDataRows[m]['subtopic']) : null;
                        obj.count_chapter = chapterDataRows[l]['count_v'];
                        obj.count_subtopic = subtopicDataRows[m]['count_st'];
                        if (obj.subtopic) {
                            const hindiSubtopicSqlData = await getLocalisedSubtopic(obj.class, obj.subject, obj.subtopic);
                            console.log(hindiSubtopicSqlData)
                            obj.hindi_subtopic = (hindiSubtopicSqlData && hindiSubtopicSqlData.length && hindiSubtopicSqlData[0].subtopic_hindi) ? hindiSubtopicSqlData[0].subtopic_hindi : null;
                            // if (!obj.hindi_subtopic) {
                            //     const hindiSubtopic = await translator.translate(obj.subtopic, 'hi');
                            //     obj.hindi_subtopic = (hindiSubtopic.length) ? hindiSubtopic[0] : null;
                            // }
                            // console.log(obj);
                            promise.push(mysqlWrite.query(`INSERT INTO content_trend set ?`, [obj]));
                        }
                    }
                    await Promise.all(promise);
                }
            }
        }
    }
    process.exit();
}

main();