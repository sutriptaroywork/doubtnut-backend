require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require(__dirname + '/../../api_server/config/database');
const mysqlWrite = new database(config.write_mysql);


const Redshift = require('node-redshift');
let RSclient = {
    user: config.redshift.user,
    database: config.redshift.database,
    password: config.redshift.password,
    port: config.redshift.port,
    host: config.redshift.host,
};
const redshiftClient = new Redshift(RSclient);

function getRecentLiveClassVideos(sClass, language) {
  const sql = `select count(b.resource_reference) as count, c.assortment_id, d.class,d.meta_info,b.resource_reference, b.subject,b.display,b.expert_name,b.expert_image,b.topic from (select question_id from classzoo1.video_view_stats where source='android' and engage_time<>0 and created_at + interval '330 minutes'>= (CURRENT_DATE - INTERVAL '4 HOUR')) as a inner join classzoo1. course_resources as b on a.question_id=b.resource_reference INNER join classzoo1. course_resource_mapping as c on b.id=c.course_resource_id INNER join classzoo1.course_details as d on c.assortment_id=d.assortment_id WHERE b.resource_type in (1,4,8) and c.resource_type='resource' and d.is_free=1 and d.class=${sClass} and d.meta_info='${language}' and b.subject not in ('ENGLISH GRAMMAR', 'GUIDANCE', 'ANNOUNCEMENT') GROUP by b.resource_reference, c.assortment_id, d.class, d.meta_info, b.subject,b.display,b.expert_name,b.expert_image,b.topic ORDER by count(b.resource_reference) desc limit 10`;
  console.log(sql);
  return redshiftClient.query(sql);
}

function insertIntoInappRecent(obj) {
  const sql = 'INSERT INTO `inapp_search_suggestion_video` set ?'
  return mysqlWrite.query(sql, obj)
}

async function main() {
  const sClass = [12, 11, 10, 9, 8, 7, 6, 14];
  const language = ["ENGLISH", "HINDI"];
  const promises = [];
  for (let i = 0; i < sClass.length; i++) {
    console.log(sClass[i]);
    for(let j =0; j<language.length; j++){
        console.log(language[j]);
        const data = await getRecentLiveClassVideos(sClass[i], language[j]);
        for(let k =0; k <data.rows.length; k++){
          if (data.rows[k].resource_reference && data.rows[k].class) {
            let obj = {
              question_id: data.rows[k].resource_reference,
              class: data.rows[k].class,
              subject: data.rows[k].subject,
              chapter: data.rows[k].topic,
              ocr_text: data.rows[k].display,
              question: data.rows[k].display,
              doubt: null,
              type: 'recent_watched',
              locale: language[j] === 'HINDI' ? 'hi' : 'en',
            }
            promises.push(insertIntoInappRecent(obj));
          }
        }
    }
  }
  await Promise.all(promises);
  process.exit();
}

main();




