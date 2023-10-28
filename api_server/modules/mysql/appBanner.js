const _ = require('lodash')
const config = require('../../config/config')
// let Utility = require('./utility');
// let _ = require('./utility');
module.exports = class Question {
  constructor() {
  }

  static getAppBanner1xDataType(student_class,type,button,subtitle,description,limit,database){
    let sql = "select cast(id as char(50)) as id, '"+type+"' as type, image_url, left(description,50) as title," +
      " action_activity, action_data,'"+button[0]+"' as button_text, '"+button[1]+"' as button_text_color, '"+button[2]+"' as button_bg_color, '"+subtitle+"' as subtitle, '"+description+"' as description from app_banners where type ='1x' and is_active=1 and class in ('"+student_class+"','all') and page_type like '%HOME%' and min_version_code<585 and max_version_code>=585 order by banner_order limit "+limit
    //console.log(sql);
    return database.query(sql);
  }

    static getAppBanner1xDataTypeNew(student_class,type,button,subtitle,description,limit,version_code,database){
    let sql = "select cast(id as char(50)) as id, '"+type+"' as type, image_url, left(description,50) as title," +
      " action_activity, action_data,'"+button[0]+"' as button_text, '"+button[1]+"' as button_text_color, '"+button[2]+"' as button_bg_color, '"+subtitle+"' as subtitle, '"+description+"' as description from app_banners where type ='1x' and is_active=1 and class in ('"+student_class+"','all') and page_type like '%HOME%' and min_version_code<"+version_code+" and max_version_code>="+version_code+" order by banner_order limit "+limit
    //console.log(sql);
    return database.query(sql);
  }

    static getAppBanner1xDataTypeWithFlag(database, studentClass, type, button, subtitle, description, limit, versionCode, flagVariants) {
        const sql = `select cast(id as char(50)) as id, '${type}' as type, image_url, left('${description}',50) as title, action_activity, action_data,'${button[0]}' as button_text, '${button[1]}' as button_text_color, '${button[2]}' as button_bg_color, '${subtitle}' as subtitle, '${description}' as description from app_banners where type ='1x' and is_active=1 and class in ('${studentClass}','all') and page_type like '%HOME%' and min_version_code<${versionCode} and max_version_code>=${versionCode} and flag_variant in (?) order by banner_order limit ${limit}`;
        return database.query(sql, [flagVariants]);
    }
  static getAppBanner15xDataType(student_class,type,button,subtitle,description,limit,database){
    let sql = "select cast(id as char(50)) as id, '"+type+"' as type, image_url,left(description,50) as title, action_activity, action_data,'"+button[0]+"' as button_text, '"+button[1]+"' as button_text_color, '"+button[2]+"' as button_bg_color, '"+subtitle+"' as subtitle, '"+description+"' as description from app_banners where type='1.5x' and is_active=1 and class in ('"+student_class+"','all') limit "+limit
    console.log(sql);
    console.log(database);
    console.log("database - - -- - - - - - ");
    return database.query(sql);
  }

  static getAppBanner25xDataType(student_class,type,button,subtitle,description,limit,database){
    let sql = "select cast(id as char(50)) as id, '"+type+"' as type, image_url,left(description,50) as title, action_activity, action_data,'"+button[0]+"' as button_text, '"+button[1]+"' as button_text_color, '"+button[2]+"' as button_bg_color, '"+subtitle+"' as subtitle, '"+description+"' as description from app_banners where type='2.5x' and is_active=1 and class in ('"+student_class+"','all') limit "+limit
    //console.log(sql);
    return database.query(sql);
  }

  static getPromotionalData(database,student_class,page,version_code,limit){
    page = '%'+page+'%'
    let sql = "select image_url,action_activity,action_data,type as size,class,page_type,banner_order,position from app_banners where class=? and page_type like ? and is_active=1 and min_version_code < ? and max_version_code>=? order by banner_order asc limit ?"

    return database.query(sql,[student_class, page,version_code, version_code, limit]);
  }

}
