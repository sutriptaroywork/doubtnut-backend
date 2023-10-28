"use strict"
const database = require('../../api_server/config/database')
const config = require('../../api_server/config/config')
const Utility = require('../../api_server/modules/utility')
const _ = require("lodash")
const request = require("request")
const con = {
  host: "dn-prod-db-cluster.cluster-ro-cpymfjcydr4n.ap-south-1.rds.amazonaws.com",
  //host:"35.200.228.199",
  user: "dn-prod",
 // user:"root",
  password: "D0ubtnut@2143",
  //password:"Iamking@123",
  database: "classzoo1",
  timezone: "UTC+0"
}
const mysql = new database(con)
main(mysql)

async function main (mysql){
  try{
      let channel = 'amp_google_play',
      feature = 'video',
      campaign= 'web_viral',
      student_id ='588226',
      type = null,
      page = null
      let question_id = await getQuestionIds(mysql)
      for(let i=0;i<question_id.length;i++){
         let deep_link = await  Utility.generateDeepLink(config,channel,feature,campaign,question_id[i]['question_id'],type,page,student_id)
         let deep_link_dump = await insertDeepLinkTable(question_id[i]['question_id'],deep_link.url,mysql)
       
      }
      mysql.close()
    }catch(e){
    console.log(e)
  }
}


function getQuestionIds(mysql){
  let sql ="SELECT a.question_id from (SELECT question_id FROM questions_web) as a left join (SELECT question_id from question_web_deeplinks WHERE deep_links IS NULL) as b on a.question_id = b.question_id"
  return mysql.query(sql)
}

function insertDeepLinkTable(question_id,deep_link_url,mysql){
  let sql ="insert into question_web_deeplinks(question_id,deep_links) values ('"+question_id+"','"+deep_link_url+"')"
  return mysql.query(sql)
}

