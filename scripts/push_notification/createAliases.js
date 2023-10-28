require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const _ = require('lodash');


// connection to mysql
const mysql = new database(config.write_mysql);
// const mysql1 = new database(config.mysql_analytics);

main()

// async function main() {
// 	let sql = "SELECT a.*,b.chapter_aliases, case WHEN a.student_id in ('1') then 'NCERT' when a.student_id in ('9','2') then 'CBSE' when a.student_id in ('3','7','8','12','42','64') then 'JEE' when a.student_id in ('43') then 'NEET' when a.student_id in ('33') then 'Foundation' when a.student_id in ('73') then 'UP Boards' else null end as package_id from  (select d.question_id,d.student_id,d.class,d.subject, case when f.chapter is null then d.chapter else f.chapter end as chapter,d.matched_question,d.question,d.ocr_text from questions as d left join questions_meta as f on d.question_id=f.question_id where d.subject in ('PHYSICS','CHEMISTRY', 'MATHS', 'BIOLOGY') and (d.is_answered =1 or d.is_text_answered =1) and d.matched_question is null and d.is_skipped =0 and d.student_id in ('1','2','3','7','8','9','12','33','42','43','64','73')) as a left JOIN chapter_aliases as b  on a.chapter=b.chapter and a.class=b.class and a.subject=b.subject";
//   let data = await mysql1.query(sql);
//   let data1 = []
//   for (let i=0;i<data.length;i++){
//   	let obj = {}; 
//   	if(data[i].question_id && data[i].student_id && data[i].chapter && data[i].chapter_aliases && data[i].package_id)
//   	{
//   		obj.question_id=data[i].question_id;
// 		obj.student_id=data[i].student_id;
// 		obj.class=data[i].class;
// 		obj.subject=data[i].subject;
// 		obj.chapter=data[i].chapter;
// 		obj.question=data[i].question;
// 		obj.ocr_text=data[i].ocr_text;
// 		obj.matched_question=data[i].matched_question;
// 		obj.chapter_alias=data[i].chapter_aliases;
// 		obj.package_id=data[i].package_id;
// 		sql ="insert into question_chapter_alias  SET ? ";
// 		console.log(obj);
// 		data1.push(mysql.query(sql,obj))
//   	}
//   }
//   await Promise.all(data1);
//   console.log("completed successfully");
// }

// // read csv file and write to db

// fs.readFile('/Users/doubtnut/Downloads/It.csv', async (err, data) => {
//   if (err) {
//     console.error(err)
//     return
//   }
//   let temp = await neatCsv(data);
//  	let sql=''; let data1=[];
//   for(let i=0;i<10;i++){
//   	// if(temp[i].CLASS && temp[i].SUBJECT && temp[i].CHAPTER && temp[i]['Map 1']){
//   	// 	let obj = {}; 
//   	// 	obj.class=temp[i].CLASS;
// 	  //  	obj.subject=temp[i].SUBJECT;
// 	  // 	obj.chapter=temp[i].CHAPTER;
// 	  // 	obj.chapter_aliases=temp[i]['Map 1'];
// 	  // 	if(temp[i]['Map 2']){
// 	  // 		obj.chapter_aliases=obj.chapter_aliases+'#@#'+temp[i]['Map 2']
// 	  // 		console.log("###############")
// 	  // 		console.log(obj)
// 	  // 		console.log("###############")
// 	  // 	}
// 	  // 	sql ="insert into chapter_aliases  SET ? ";
// 	  // 	data1.push(mysql.query(sql,obj))
//   	// }
//   	console.log(temp[i]);
//   }
//   //await Promise.all(data1);
//   console.log("completed successfully");
// })


async function main() {
  let sql = "SELECT * from question_chapter_alias WHERE master_chapter_alias is null";
  let data = await mysql.query(sql);
  let promise=[];
  for (let i=0;i<data.length;i++){

      sql = `select * from question_chapter_alias where question_id = '${data[i].question_id}'`;
      let temp= await mysql.query(sql);
      console.log(temp);
      if(!temp[0].master_chapter_alias)
      {
        sql =`SELECT DISTINCT a.question_id, a.chapter, a.class, case when b.master_chapter_aliases is not null then b.master_chapter_aliases when c.master_chapter_aliases is not null then c.master_chapter_aliases when d.master_chapter_aliases is not null then d.master_chapter_aliases else e.master_chapter_aliases end as master_chapter_alias FROM question_chapter_alias as a left join chapter_aliases_new as b on a.chapter = b.chapter and a.class = b.class left join chapter_aliases_new as c on a.chapter = c.chapter_aliases and a.class = c.class left join chapter_aliases_new as d on a.chapter_alias = d.chapter_aliases and a.class = d.class left join chapter_aliases_new as e on a.chapter_alias = e.chapter and a.class = e.class where a.question_id = '${data[i].question_id}'`;
       let data1= await mysql.query(sql);
       if(data1.length && data1[0].master_chapter_alias){
        data1[0].master_chapter_alias = data1[0].master_chapter_alias.replace(/'/g,"''");
        data1[0].chapter = data1[0].chapter.replace(/'/g,"''");
        sql = `UPDATE question_chapter_alias SET master_chapter_alias = '${data1[0].master_chapter_alias}' WHERE class='${data1[0].class}' and chapter='${data1[0].chapter}'`
        console.log(sql);
        console.log(await mysql.query(sql));
       }

      }
   }
  console.log("completed successfully");
}