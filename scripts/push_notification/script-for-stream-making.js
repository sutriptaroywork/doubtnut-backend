"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
const mysqlR = new database(config.read_mysql);
const mysqlW = new database(config.mysql_write);
const request = require('request');
const _ = require('lodash');
const { insertOptionSelectedForActionWidgets } = require('../../api_server/modules/studentCourseMapping');

main()
async function main (){
        try{
        const classList = [11, 12];
        const boardList = await getBoardList();
        for(let i = 0; i < boardList.length; i++) {
            const x = boardList[i];
            await updateBoardParent(x.id);
            const commerceObj = x;
            commerceObj.course = `${commerceObj.course} - Commerce`;
            commerceObj.priority = 2;
            commerceObj.parent_ccm_id = x.id;
            commerceObj.stream_name = 'Commerce';
            commerceObj.is_active = classList.includes(commerceObj.class) ? 1 : 0;
            delete commerceObj.id;
            await insertRow(commerceObj);
        };
    }catch(e){
        console.log(e);
    }finally {
          console.log("the script successfully ran at "+ new Date())
    }
}

function getBoardList(){
    const sql = "SELECT * FROM class_course_mapping where category = 'board' LIMIT 1, 5000";
    return mysqlR.query(sql);
}

function updateBoardParent(id){
    const sql = "UPDATE class_course_mapping SET parent_ccm_id = ? WHERE id = ?";
    return mysqlR.query(sql, [id, id]);
}

function insertRow(obj){
    const sql = "INSERT INTO class_course_mapping SET ?";
    return mysqlW.query(sql, obj);
}
