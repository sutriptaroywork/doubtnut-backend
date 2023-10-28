const _ = require('lodash')
const hash_expiry= 1*60*60*24; //For 24 hours
module.exports = class Answer {
  constructor() {
  }


  static getMostWatchedVideosByPackage(package_name,count,client) {
    let redisKey = package_name.split(' ').join('_')+"_basic_"+count;
    return client.hgetAsync("most-watched-videos-by-packages", redisKey)
  }
  static setMostWatchedVideosByPackage(package_name,count,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_basic_"+count;
    return client.multi()
      .hset("most-watched-videos-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMostWatchedVideosForFirstLevel(package_name,level1,count,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+count;
    return client.hgetAsync("most-watched-videos-by-packages", redisKey)
  }
  static setMostWatchedVideosForFirstLevel(package_name,level1,count,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+count;
    return client.multi()
      .hset("most-watched-videos-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMostWatchedVideosForSecondLevel(package_name,level1,level2,count,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+level2.split(' ').join('_')+"_"+count;
    return client.hgetAsync("most-watched-videos-by-packages", redisKey)
  }
  static setMostWatchedVideosForSecondLevel(package_name,level1,level2,count,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+level2.split(' ').join('_')+"_"+count;
    return client.multi()
      .hset("most-watched-videos-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }


  static getFirstLevel(package_name,client) {
    let redisKey = package_name.split(' ').join('_')+"_first_level";
    return client.hgetAsync("most-watched-videos-by-packages", redisKey)
  }
  static setFirstLevel(package_name,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_first_level";
    return client.multi()
      .hset("most-watched-videos-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getSecondLevel(package_name,level1,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_second_level";
    return client.hgetAsync("most-watched-videos-by-packages", redisKey)
  }
  static setSecondLevel(package_name,level1,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_second_level";
    return client.multi()
      .hset("most-watched-videos-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

static getTopChapters(package_name,level1,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_top_chapters";
    return client.hgetAsync("most-watched-chapters-by-packages", redisKey)
  }
  static setTopChapters(package_name,level1,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_top_chapters";
    return client.multi()
      .hset("most-watched-chapters-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+level2.split(' ').join('_')+"_"+count+"_v3";
    return client.hgetAsync("most-watched-videos-by-packages", redisKey)
  }
  static setMostWatchedVideosForSecondLevelNew(package_name,level1,level2,count,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+level2.split(' ').join('_')+"_"+count+"_v3";
    return client.multi()
      .hset("most-watched-videos-by-packages", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMostWatchedVideosForFirstLevelNew(package_name,level1,count,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+count;
    return client.hgetAsync("most-watched-videos-by-packages-v4", redisKey)
  }
  static setMostWatchedVideosForFirstLevelNew(package_name,level1,count,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_"+count;
    return client.multi()
      .hset("most-watched-videos-by-packages-v4", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getTopChaptersNew(package_name,level1,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_top_chapters";
    return client.hgetAsync("most-watched-chapters-by-packages-v4", redisKey)
  }
  static setTopChaptersNew(package_name,level1,data,client) {
    let redisKey = package_name.split(' ').join('_')+"_"+level1+"_top_chapters";
    return client.multi()
      .hset("most-watched-chapters-by-packages-v4", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getFirstLevelNew(package_name,client) {
    let redisKey = package_name.split(' ').join('_')+"_first_level";
    return client.hgetAsync("most-watched-videos-by-packages-v4", redisKey)
  }
  static setFirstLevelNew(package_name,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_first_level";
    return client.multi()
      .hset("most-watched-videos-by-packages-v4", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

  static getMostWatchedVideosByPackageNew(package_name,count,client) {
    let redisKey = package_name.split(' ').join('_')+"_basic_"+count;
    return client.hgetAsync("most-watched-videos-by-packages-v4", redisKey)
  }
  static setMostWatchedVideosByPackageNew(package_name,count,data,client) {
    console.log('set question in redis')
    let redisKey = package_name.split(' ').join('_')+"_basic_"+count;
    return client.multi()
      .hset("most-watched-videos-by-packages-v4", redisKey, JSON.stringify(data))
      .expireat(redisKey, parseInt((+new Date) / 1000) + hash_expiry)
      .execAsync()
  }

}
