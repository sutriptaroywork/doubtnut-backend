"use strict"
const _ = require('lodash');
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname + '/../../api_server/config/config');
const Database = require(__dirname + '/../../api_server/config/database');
const mysql = new Database(config.write_mysql);
const mysqlr = new Database(config.read_mysql);
const mysqlAnalytics = new Database(config.mysql_analytics);

async function getIconsDetails() {
  // const sql = "SELECT * FROM `icons_latest` WHERE `is_active` = 1 AND `class` LIKE '6' AND `screen_type` = 'CAMERA_EXPLORE_ALL' ORDER BY position";
  const sql = "SELECT * FROM `icons_latest` WHERE `is_active` = 1 AND `class` LIKE '7' AND `screen_type` = 'CAMERA_EXPLORE_ALL' AND (filter_type = '' OR (filter_type = 'subscription' AND filter_value = 1)) ORDER BY position";
  // const sql = "SELECT * FROM `icons_latest` WHERE max_version_code > 986 AND is_active = 1 AND screen_type = 'HOME_ALL'";
  // const sql = "SELECT * FROM `icons_latest` WHERE max_version_code > 986 AND is_active = 1 AND screen_type = ''";
  // const sql = "UPDATE `icons_latest` SET screen_type = 'HOME_ALL' WHERE max_version_code > 986 AND is_active = 1 AND screen_type = ''";
  return mysqlAnalytics.query(sql);

}
async function insertIcons(obj) {
  const sql= 'INSERT INTO `icons_latest` SET ?';
  return mysqlAnalytics.query(sql, obj);
}
async function main(){
    try{
        const iconsList =await getIconsDetails();
        console.log('data got')

        let found = false;
        for(var i = 0; i < iconsList.length; i++){
            const x = iconsList[i];
            const obj = x;
            obj.id = null;
            obj.class = '8';
            if (found) {
              obj.position = (parseInt(obj.position) + 1).toString();
            }
            if (obj.feature_type === 'practice_english' && obj.locale === 'other') {
              found = true;
            }
            await insertIcons(obj);
        }
    }
    catch(e){
       console.log(e);
    }
}

main();
