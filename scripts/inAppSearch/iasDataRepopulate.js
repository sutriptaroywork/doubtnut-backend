require('dotenv').config({ path: __dirname + '/../../api_server/.env' });
const config = require(__dirname + '/../../api_server/config/config');
const database = require('../../api_server/config/database');
const _ = require('lodash');
const neatCsv = require('neat-csv');
const fs = require('fs');

// connection to mysql
const mysql = new database(config.read_mysql);
const writeMysql = new database(config.write_mysql);

const promise = [];


function getLibraryLatestAddedData(mysql) {
  let sql = "SELECT * FROM `new_library` WHERE date(updated_at) >= DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY ) and is_admin_created=1 and is_active=1"
  return mysql.query(sql)
}

function getParentData(id) {
  let sql = `SELECT * from inapp_search_data where id=${id}`;
  return mysql.query(sql)
}


async function getParentTags(id, pid, str1, str2){
  let checkParent =await getParentData(id);
  if(checkParent.length){
    if(str1){
      str1 = `${str1},${checkParent[0].name}`;
    }else {
      str1 = checkParent[0].name;
    }
    if(str2){
      str2 = `${str2},${checkParent[0].name_language_1}`;
    }else {
      str2 = checkParent[0].name_language_1;
    }
    if(checkParent[0].parent){
      await getParentTags(checkParent[0].parent, pid, str1, str2)
    } else {
        // str1 = str1.replace("'","''");
        console.log(str1, str2);
        if(str1 && str2){
          const sql = `update inapp_search_data set parent_tags='${str1}', parent_tags_language_1='${str2}' where id='${pid}'`;
          promise.push(writeMysql.query(sql));
        } else if(str1){
          const sql = `update inapp_search_data set parent_tags='${str1}' where id='${pid}'`;
          promise.push(writeMysql.query(sql));
        } else if(str2){
          const sql = `update inapp_search_data set parent_tags_language_1='${str2}' where id='${pid}'`;
          promise.push(writeMysql.query(sql));
        }
    }
  } else {
        // str1 = str1.replace("'","''");
        console.log(str1, str2);
        if(str1 && str2){
          const sql = `update inapp_search_data set parent_tags='${str1}', parent_tags_language_1='${str2}' where id='${pid}'`;
          promise.push(writeMysql.query(sql));
        } else if(str1){
          const sql = `update inapp_search_data set parent_tags='${str1}' where id='${pid}'`;
          promise.push(writeMysql.query(sql));
        } else if(str2){
          const sql = `update inapp_search_data set parent_tags_language_1='${str2}' where id='${pid}'`;
          promise.push(writeMysql.query(sql));
        }
  }
  return {str1, str2};
}

async function main() {
  let data = await getLibraryLatestAddedData();
  for (let i = 0; i < data.length; i++) {
    console.log(data[i].id)
    if(temp[i].parent!=='NULL'){  
      await  getParentTags(data[i].parent, data[i].id, null, null);
    }
  }
  await Promise.all(promise);
  console.log("completed successfully 1");
}

main();
