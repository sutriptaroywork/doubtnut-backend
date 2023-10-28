
const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class Timetable {
  constructor() {

 }
   
   static insertPostToCalender(database,insertObj) {
   	// console.log(insertObj)

    let sql = "INSERT INTO `time_table` SET ?";
    return database.query(sql, [insertObj]);
  }
  static getCalenderDetails(studentId, database){
  	let sql ="Select * from time_table where student_id =? and is_active =1" ;
  	return database.query(sql, [studentId]);

 }
  static removeDetails(id,database){
  	let sql ="Update time_table SET is_active = 0 where id =?";
  	return database.query(sql, [id]);
  }
  static updateDetails(database, insertObj,id){
  	let sql ="Update time_table SET ? where id=?";
  	return database.query(sql, [insertObj, id]);
  }

}  
