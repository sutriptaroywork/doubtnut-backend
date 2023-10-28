const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/personalization');
const redis = require('../redis/personalization');
const Utility = require('../utility.js');

module.exports = class Personalization {

    static async getDistinctMcByPlaylistId(playlist_id, db) {
        //first try to get from redis
        return new Promise(async function (resolve, reject) {
          // Do async job
          try {
            let data
            if (config.caching) {
              data = await redis.getDistinctMcByPlaylistId(playlist_id, db.redis.read)
              if (!_.isNull(data)) {
                return resolve(JSON.parse(data))
              } else {
                data = await mysql.getDistinctMcByPlaylistId(playlist_id, db.mysql.read)
                if(data.length > 0){
                  //set in redis
                  await redis.setDistinctMcByPlaylistId(playlist_id, data, db.redis.write)
                }
                return resolve(data)
              }
            } else {
              data = await mysql.getDistinctMcByPlaylistId(playlist_id, db.mysql.read)
              return resolve(data)
            }
          } catch (e) {
            console.log(e)
            reject(e)
          }
        })
      }


    static async getMcVideosByPlaylistId(playlist_id, db) {
        //first try to get from redis
        return new Promise(async function (resolve, reject) {
            // Do async job
            try {
            let data
            if (config.caching) {
                data = await redis.getMcVideosByPlaylistId(playlist_id, db.redis.read)
                if (!_.isNull(data)) {
                return resolve(JSON.parse(data))
                } else {
                data = await mysql.getMcVideosByPlaylistId(playlist_id, db.mysql.read)
                if(data.length > 0){
                    //set in redis
                    await redis.setMcVideosByPlaylistId(playlist_id, data, db.redis.write)
                }
                return resolve(data)
                }
            } else {
                data = await mysql.getMcVideosByPlaylistId(playlist_id, db.mysql.read)
                return resolve(data)
            }
            } catch (e) {
            console.log(e)
            reject(e)
            }
        })
    }
}