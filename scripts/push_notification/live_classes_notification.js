"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database')
const mysqlR = new database(config.read_mysql)
const mysqlW = new database(config.mysql_write)

main()	


async function main (){
	try{
        let students = await getAllStudents()
        let studentPromise = []
        for(let i=0; i< students.length;i++){
          console.log(students[i].student_id)
          const student_id = students[i].student_id
          studentPromise.push(childProcesses(student_id))
          if(i%400 == 0 || i == students.length-1){
            await Promise.all(studentPromise);
            studentPromise=[]
          }
        }
        // console.log(students.length)
        mysqlR.connection.end();
        mysqlW.connection.end();
        console.log("the script successfully ran at "+ new Date())

    }catch(e){
      console.log(e)
      mysqlR.connection.end();
      mysqlW.connection.end();
    }	
}

async function childProcesses(student_id){
  try{
    let promises = []
    promises.push(getStudentDetails(student_id)); 
    promises.push(getStudentExam(student_id));
    promises.push(getStudentAffinity(student_id));
    const resolvedPromises = await Promise.all(promises);
    if(resolvedPromises[0][0].student_class == '9' 
        || resolvedPromises[0][0].student_class == '10'
        || resolvedPromises[0][0].student_class == '11'
        || resolvedPromises[0][0].student_class == '12'
        || resolvedPromises[0][0].student_class == '13'){
      let locale = getMappedLocale(resolvedPromises[0][0].locale)
      if(resolvedPromises[2].length > 0){
        let subject = getMappedSubject(resolvedPromises[2],resolvedPromises[0][0].student_class)
        if(subject){
          let exam = ''
          if(resolvedPromises[0][0].student_class == '11' || resolvedPromises[0][0].student_class == '12' || resolvedPromises[0][0].student_class == '13'){
            exam = getMappedExam(resolvedPromises[1])
          }
          let user_code = await getUserCode(subject,locale, resolvedPromises[0][0].student_class, exam);
          if(user_code && user_code[0] && user_code[0].id){
            await updateUserCode(user_code[0].id, student_id, resolvedPromises[2][0])
            console.log("updated successfully:" + student_id)
          }
        }
      }
    }
  }catch(e){
    console.log(e)
  }
}


function getMappedExam(resolvedPromise){
  if(resolvedPromise.length == 1){
    if(resolvedPromise[0].course == "IIT JEE" || resolvedPromise[0].course == "NEET"){
      return resolvedPromise[0].course
    }
  }
  return 'OTHERS'
}

function getMappedSubject(resolvedPromise, student_class){
  if(resolvedPromise.length > 0){
    let subject = resolvedPromise[0].subject
    if(student_class == '9' || student_class == '10'){
      if(subject == 'MATHS'){
        return subject;
      }else if(subject == 'PHYSICS' || subject == 'CHEMISTRY' || subject == 'BIOLOGY'){
        return 'SCIENCE'
      }
    }else if(student_class == '11' || student_class == '12' || student_class == '13'){
      if(subject == 'PHYSICS' || subject == 'CHEMISTRY' || subject == 'BIOLOGY' || subject == 'MATHS'){
        return subject
      }
    }
  }
  return 0;
}

function getMappedLocale(locale){
  if(locale != 'hi'){
    return "OTHERS"
  }
  return locale
}





function updateUserCode(user_code, student_id, chapterObject){
  let sql = "INSERT INTO `live_classes_user_code_student_mapping` (`student_id`, `user_code`, `chapter`,  `chapter_class`, `microconcept`) VALUES ('"+student_id+"', '"+user_code+"',?,'"+chapterObject.class+"',?) ON DUPLICATE KEY UPDATE `user_code`='"+user_code+"', `chapter`=?,  `chapter_class`='"+chapterObject.class+"', `microconcept`=?"
  return mysqlW.query(sql,[chapterObject.chapter, chapterObject.microconcept,chapterObject.chapter, chapterObject.microconcept])
}

function getUserCode(subject,locale, student_class, exam){
  let sql = "SELECT * FROM `live_classes_user_code` WHERE class='"+student_class+"' and locale='"+locale+"' and subject='"+subject+"' and exam='"+exam+"'";
  return mysqlR.query(sql)
}

function getAllStudents(){
	let sql="SELECT student_id  FROM `video_view_stats` where created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 1 DAY) and source= 'android' GROUP by student_id having count(view_id)<500"
	return mysqlR.query(sql)
}

function getStudentDetails(student_id){
  let sql = "select student_class, locale from students where student_id='"+student_id+"'"
  return mysqlR.query(sql)
}

function getStudentExam(student_id){
  let sql = "SELECT a.student_id,b.class,b.course FROM (select * from `student_course_mapping` where student_id='"+student_id+"') as a left join class_course_mapping as b on a.ccm_id=b.id"
  return mysqlR.query(sql)
}

function getAllUserCodes(){
  let sql = "SELECT * FROM `live_classes_user_code`"
  return mysqlR.query(sql)
}

function getStudentAffinity(student_id){
  let sql = "select d.class, d.chapter, e.subject, d.microconcept from (select b.class, b.chapter, b.microconcept, count(b.microconcept) from (SELECT question_id FROM `video_view_stats` where created_at >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 3 DAY) and source= 'android' and student_id='"+student_id+"') a left join (select question_id, class, chapter, microconcept from questions_meta where class is not null and chapter is not null and microconcept is not null and (microconcept like 'CV_%' or microconcept like 'MC_%' )) as b on a.question_id=b.question_id WHERE b.question_id is not null group by b.microconcept order by count(b.microconcept) DESC limit 1) as d left JOIN questions as e on e.doubt=d.microconcept where student_id=99"
  return mysqlR.query(sql)
}