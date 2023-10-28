require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const elasticSearch = require('elasticsearch')
const client = new elasticSearch.Client({
  host: config.elastic.ELASTIC_HOST
});
// console.log(client)
const database = require('../../api_server/config/database');
console.log(config.mysql_analytics);
const mysql = new database(config.mysql_analytics);

main(mysql, client)

async function main(mysql, client) {
  let chapters = await getChapterData(mysql)
  // console.log("data")
  // console.log(chapters)
  // data = generateIndexData(data)
  // console.log(data)
  console.log(chapters.length)
  for (let i = 0; i < chapters.length; i++) {
    let index = []
    let base = {index: {_index: 'dn_topics', _type: 'chapters'}}
    index.push(base)
    chapters[i]["type"] = "chapters"
    chapters[i]["display"] = `${chapters[i]['chapter_display']} | Class ${chapters[i]['class']}`
    index.push(chapters[i])
    // console.log(index)
    await addIndex(client,index)
  }
  //get subtopic data
  let subtopics = await getSubtopicData(mysql)
  console.log(subtopics.length)
  for (let i = 0; i < subtopics.length; i++) {
    let index = []
    let base = {index: {_index: 'dn_topics', _type: 'subtopics'}}
    index.push(base)
    subtopics[i]["type"] = "subtopics"
    subtopics[i]["display"] = `${subtopics[i]['subtopic']} | ${subtopics[i]['chapter']} | Class ${subtopics[i]['class']}`
    index.push(subtopics[i])
    await addIndex(client,index)
  }

  let mcText = await getMcTextData(mysql)
  console.log(mcText.length)
  for (let i = 0; i < mcText.length; i++) {
    let index = []
    let base = {index: {_index: 'dn_topics', _type: 'microconcepts'}}
    mcText[i]["type"] = "microconcepts"
    index.push(base)

    mcText[i]["display"] = `${mcText[i]['mc_text']} | ${mcText[i]['subtopic']} | ${mcText[i]['chapter']} | Class ${mcText[i]['class']}`
    // console.log(mcText)
    index.push(mcText[i])
    await addIndex(client,index)
  }
  console.log("Script successfully ran")
}


function getChapterData(mysql) {
  let sql = "select chapter,course,class,chapter_display from class_chapter_image_mapping where chapter in (SELECT" +
      " DISTINCT(chapter) FROM `mc_course_mapping` where active_status=1 and subject = 'MATHS') and course not in ('IIT') "
  return mysql.query(sql)
}
function getSubtopicData(mysql) {
  let sql = "select DISTINCT(subtopic),chapter,class,course from mc_course_mapping where chapter in (SELECT" +
      " DISTINCT(chapter) FROM `mc_course_mapping`) and course not in ('IIT') and active_status=1 and subject = 'MATHS'"
  return mysql.query(sql)
}
function getMcTextData(mysql) {
  // let sql = "select chapter,course,class,chapter_display from class_chapter_image_mapping where chapter in (SELECT DISTINCT(chapter) FROM `mc_course_mapping`) and course not in ('IIT')"
  let sql = "select a.*,b.chapter_display,c.mc_text from (select mc_id,class,chapter,subtopic,course from" +
      " mc_course_mapping where active_status = 1 and course = 'NCERT' and subject='MATHS') as a left join (select" +
      " chapter,chapter_display,class,course from class_chapter_image_mapping) as b on a.chapter=b.chapter and a.class=b.class and a.course=b.course left join (select question_id,doubt,ocr_text as mc_text from questions where is_answered = 1 and student_id < 100) as c on a.mc_id=c.doubt"

  return mysql.query(sql)
}


function addIndex(client, data) {
  console.log(data)
  return new Promise( ( resolve, reject ) => {
    client.bulk({
      body: data
    }, function (err, resp) {
      // ...
      // console.log("err")
      // console.log(err)
      if(err){
        console.log("err")
        console.log(err)
        return reject(err)
      }
      // console.log("resp")
      // console.log(resp)
      return resolve(resp)
    });
  } );

}



