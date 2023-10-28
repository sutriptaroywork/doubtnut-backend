const moment = require('moment')
// let Utility = require('./utility');
const hash_expiry = 60 * 60 ; // 1 hour
const promotional_hash_expiry = 60 * 60 * 24 ; // 1 hour
const set_expiry = 60 * 60 // 1 hour key expire

module.exports = class Playlist {
  constructor() {
  }

  static getAppBanner1xDataType(type1,scroll_size,student_class,client){
    return client.getAsync("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class);
  }

  static setAppBanner1xDataType(type1,scroll_size,student_class,data,client){
    // return client.set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data), 'EX', 6*60*60);
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry/2)
      .execAsync()
  }

  static getAppBanner1xDataTypeNew(type1,scroll_size,student_class,version_code,client){
    return client.getAsync("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class+"_"+version_code);
  }

  static setAppBanner1xDataTypeNew(type1,scroll_size,student_class,version_code,data,client){
    // return client.set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data), 'EX', 6*60*60);
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class+"_"+version_code, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class+"_"+version_code, parseInt((+new Date) / 1000) + hash_expiry/2)
      .execAsync()
  }

    static getAppBanner1xDataTypeWithFlag(client, type1, scrollSize, studentClass, versionCode, flagVariants) {
        return client.getAsync(`HOMEPAGE_FLAG_${type1}_${scrollSize}_${studentClass}_${versionCode}_${flagVariants}`);
    }

    static setAppBanner1xDataTypeWithFlag(client, type1, scrollSize, studentClass, versionCode, flagVariants, data) {
        return client.multi()
            .set(`HOMEPAGE_FLAG_${type1}_${scrollSize}_${studentClass}_${versionCode}_${flagVariants}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_FLAG_${type1}_${scrollSize}_${studentClass}_${versionCode}_${flagVariants}`, parseInt((+new Date()) / 1000) + hash_expiry / 2)
            .execAsync();
    }

  static getAppBanner15xDataType(type1,scroll_size,student_class,client){
    return client.getAsync("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class);
  }

  static setAppBanner15xDataType(type1,scroll_size,student_class,data,client){
    // return client.set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data), 'EX', 6*60*60);
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getAppBanner25xDataType(type1,scroll_size,student_class,client){
    return client.getAsync("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class);
  }

  static setAppBanner25xDataType(type1,scroll_size,student_class,data,client){
    // return client.set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data), 'EX', 6*60*60);
    return client.multi()
      .set("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, JSON.stringify(data))
      .expireat("HOMEPAGE_"+type1+"_"+scroll_size+"_"+student_class, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }
  static getPromotionalData(client,student_class,page,version_code,limit){
    return client.getAsync("PROMOTIONAL_DATA_"+student_class+"_"+page+"_"+limit+"_"+version_code);
  }

  static setPromotionalData(client,data,student_class,page,version_code,limit){
    return client.multi()
      .set("PROMOTIONAL_DATA_"+student_class+"_"+page+"_"+limit+"_"+version_code, JSON.stringify(data))
      .expireat("PROMOTIONAL_DATA_"+student_class+"_"+page+"_"+limit+"_"+version_code, parseInt((+new Date) / 1000) + promotional_hash_expiry)
      .execAsync()
  }
}
