
"use strict";

const puppeteer = require('puppeteer')
const fs = require('fs')
const database = require('./database')
const { promisify } = require('util')
const readFileAsync = promisify(fs.readFile)
const { exec } = require('child_process');
const path = require('path')
const AWS = require('aws-sdk')

const con = {
  host:"dn-prod-db-cluster.cluster-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  user: "dn-prod",
  password: "D0ubtnut@2143",
  database: "classzoo1",
  charset : 'utf8',
  timezone: "UTC+0"
}

const s3 = new AWS.S3({
  accessKeyId: "AKIAIVUFSD5BLE3YE5BQ",
  secretAccessKey: "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"
});

const mysql = new database(con)
let db

function getAllTopics(mysql){
  let sql = "select * from (SELECT student_id,amount, DATE_FORMAT(date, '%M %d, %Y') AS date_value, position,contest_id,type,parameter,count as c_count FROM contest_winners WHERE contest_id='2' and date = date_sub(CURRENT_DATE,INTERVAL 1 DAY) order by position asc) as a left join (select student_id,gcm_reg_id, student_fname,student_lname, gender, student_email,img_url, school_name, ex_board, mobile, country_code,pincode,student_class,student_username,coaching,dob from students) as b on a.student_id=b.student_id"
	return mysql.query(sql)
}

main(mysql)

async function main(mysql){
    try{
        let monthList = [
          "Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"
        ]

        let allTopics = await getAllTopics(mysql)
        const browser = await puppeteer.launch()
        const page = await browser.newPage()

        await page.setViewport({
          width: 1350,
          height: 2400,
          deviceScaleFactor: 1,
        })

        let template= await readFileAsync('./src/thumbnail-design.html','utf8')

        for(let i=0; i<allTopics.length; i++)
        {
          console.log('student_username ::: '+allTopics[i].student_username)
          let uname = allTopics[i].student_username
          if(allTopics[i].student_username == 'undefined' || allTopics[i].student_username == 'null')
          {
            uname = allTopics[i].student_fname+" "+allTopics[i].student_lname
          }
          let amount = allTopics[i].amount
          let dateVal = allTopics[i].date_value
          let student_id = allTopics[i].student_id

          const dateUTC = new Date(dateVal).getTime();
          const dateIST = new Date(dateUTC);
          const date = dateIST;

          let filename = date.getFullYear()+"-"+((date.getMonth()+1).toString().length == 1 ? '0'+(date.getMonth()+1): (date.getMonth()+1))+"-"+(date.getDate().toString().length == 1 ? '0'+date.getDate() : date.getDate())+"_"+student_id

          let res = await makeThumbnail(template, page, uname, amount, dateVal, filename)
        }
        mysql.connection.end();
		    process.exit();
    }catch(e){
        console.log(e)
    }
}

async function makeThumbnail(template, page, uname, amount, dateVal, filename)
{
  template =  template.replace('##',uname)
  template =  template.replace('#!',uname)
  template =  template.replace('$$',amount)
  template =  template.replace('!!',dateVal)
  
  await page.setContent(template)

  let image_name = filename+'.png';
  return new Promise(async (resolve, reject) => {
      try {      
        await page.screenshot({path:  './src/contest_winners/'+ image_name ,type:"png"})
        resolve()
        // const fileContent = await fs.readFileSync('./src/'+image_name);
      
        // const params = {
        //     Bucket: 'doubtnut-static',
        //     Key: 'quiz-thumbnail/'+image_name, // File name you want to save as in S3
        //     Body: fileContent
        // };
      
        // // Uploading files to the bucket
        // let a = await s3.upload(params, function(err, data) {
        //     console.log(data)
        //     if (err) {
        //         throw err;
        //     }
        //     console.log(`File uploaded successfully. ${data.Location}`);
        // });
      } catch (err) {
          // fn(err);
          console.log(err);
          reject(err);
      }
  })
}
