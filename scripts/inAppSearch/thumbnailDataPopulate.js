"use strict"
require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname + '/../../api_server/config/config');
const database = require(__dirname + '/../../api_server/config/database');
const mysql = new database(config.mysql_analytics);
const mysqlWrite = new database(config.write_mysql);

async function firsrtLibData(){
    const sql = `SELECT *  FROM new_library WHERE is_first = 1 and is_last = 0 AND is_active = 1 and is_admin_created = 1  and id>0 and is_admin_created = 1 ORDER BY id  ASC`;
    return mysql.query(sql);
}

async function getChildData(id){
  const sql = 'SELECT * from new_library where is_active =1 and parent=? ORDER BY id DESC'
  return mysql.query(sql,[id])
}

async function playlistData(id, name, sClass, subject, parent_id, resource_type) {
    const childData = await getChildData(id);
    for(let i=0;i<childData.length;i++){
        let id1=childData[i]['id'];
		let name1=childData[i]['name'];
		let is_last1=childData[i]['is_last'];

		if(is_last1==0){
			name1=name+"#!#"+name1;
			await playlistData(id1, name1, sClass, subject, parent_id, resource_type);
		}

		if(is_last1==1){
            name1=name+"#!#"+name1;
            const data = {first_id: parent_id, last_id: id1, name_tree: name1, class: sClass, subject, resource_type}
            console.log("inserting parent: "+parent_id+" and id :"+id1);
			let insert_query = 'INSERT INTO  library_tree_20200702 set ?';
			await mysqlWrite.query(insert_query, data);
		}
    }

}

async function main(){
    const firstData = await firsrtLibData();
    for(let i=0;i<firstData.length;i++){
        let id=firstData[i].id;
		let parent_id=firstData[i]['id'];
		let resource_type=firstData[i]['resource_type'];
		let course = firstData[i]['student_course'];
		let sClass=firstData[i]['student_class'];
		let subject=firstData[i]['subject'];
		let name=sClass+'#!#'+course+"#!#"+firstData[i]['name'];
		await playlistData(id, name, sClass, subject, parent_id, resource_type);
    }
    console.log('done')
    mysql.connection.end();   
    process.exit();
}

main(mysql);




