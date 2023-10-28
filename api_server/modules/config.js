// const _ = require('lodash');

module.exports = class Config {
    static getOnboardCamera(database, student_class) {
  	// let sql="select * from app_configuration where class in ('all','"+student_class+"') and is_active=1"
        const sql = "select * from app_configuration where is_active=1 and key_name='camera'";
  	return database.query(sql);
    }

    static getQuestionDemoSample(database, student_class) {
  	const sql = "select * from app_configuration where class in ('all', ?) and is_active=1 and key_name='demo'";
  	return database.query(sql, [student_class]);
    }

    // static getWhatsappData(database,student_class){
    //   let sql="select * from app_configuration where class in ('all',?) and is_active=1 and key_name='whatsapp_ask'"
    //   return database.query(sql,[student_class])
    // }
};
