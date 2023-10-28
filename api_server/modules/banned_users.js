const _ = require('lodash')
// let Utility = require('./utility');
module.exports = class Answer {
  constructor() {
  }

  static getBanned(database,student_id){
  	let bandata={
				'student_id':student_id,
				'app_module':'ALL',
				'ban_type':'Perma',
				'is_active':'1'
			}
	let sql="INSERT INTO banned_users SET ?"
	return database.query(sql,bandata)
  }
}