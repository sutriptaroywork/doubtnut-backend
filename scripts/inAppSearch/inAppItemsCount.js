const elasticSearch = require('elasticsearch')
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const _ = require('lodash');

// connection to mysql
const mysql = new database(config.mysql_analytics);
const writeMysql = new database(config.write_mysql);

function getIsLast() {
  let sql = "SELECT * FROM `inapp_search_data` WHERE is_last=1 and resource_type='playlist' and is_active=0 and is_delete=0 and id >125604";
  return mysql.query(sql)
}

async function main() {
  // library data populate
  let libraryData = await getIsLast();
  console.log("------------------------is last data adding inapp_search_data Table------------------");
  console.log(libraryData.length)
  for(let i=0;i<libraryData.length;i++){
    if(libraryData[i].resource_type==='playlist' && libraryData[i].resource_path){
      console.log(libraryData[i]['id'])
      let str = _.replace(libraryData[i].resource_path, /xxlanxx/g, 'english');
      str = _.replace(str, /xxclsxx/g, libraryData[i].class);
      str = _.replace(str, /xxplaylistxx/g, libraryData[i]['id']);
      // console.log(str);
      let data = await mysql.query(str, [libraryData[i]['id']]);
      if(data.length){
          console.log("items count ", i)
          const sql = `UPDATE inapp_search_data SET items_count=${data.length}, is_active=1 where id=${libraryData[i]['id']}`;
          await writeMysql.query(sql);
      }
    }
  }
  console.log("Script successfully ran")
}

main();



