require('dotenv').config({path : __dirname + '/../../api_server/.env'});
const config = require(__dirname+'/../../api_server/config/config');
const database = require('../../api_server/config/database');
config.mysql_analytics.charset = 'utf8mb4'
const mysql_analytics = new database(config.mysql_analytics);
const mysql_write = new database(config.write_mysql);
const _ = require('lodash');
const Redis = require('ioredis');
const Promise = require('bluebird');
Promise.promisifyAll(Redis);
Promise.promisifyAll(Redis.prototype);
var write_redis = new Redis({
      host: config.write_redis.host,
      port: config.write_redis.port
 });
 var read_redis = new Redis({
    host: config.read_redis.host,
    port: config.read_redis.port
});
const request = require('request');
const NotificationConstants = require('../../api_server/modules/constants/notifications.js');



( async () => {
    try {
        
        var currentTime = new Date();
        var currentOffset = currentTime.getTimezoneOffset();
        var ISTOffset = 330;   // IST offset UTC +5:30
        var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset)*60000);
        let todayEndUTC = ISTTime.setHours(23, 59, 59, 999);
        let todayEndExpiry =  parseInt(todayEndUTC/1000) -(5.5*60*60)
        let checkRedisKey =  await read_redis.hgetallAsync(`fcm_contest`)
        console.log(checkRedisKey)
        let x = 7826769
        let studentsDailyViewCountSQL = "select t1.student_id,t1.view_count,students.gcm_reg_id,students.student_class from (SELECT student_id, count(view_id) as view_count FROM video_view_stats where created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 and source like 'android' group by student_id having view_count < 50) as t1 left join students on t1.student_id = students.student_id"
        let studentsDailyViewCount = await mysql_analytics.query(studentsDailyViewCountSQL)
        let sql = 'select * from fcm_notification_config'
        let fcm_config = await mysql_analytics.query(sql)
        let  fcm_config_grouped = _.groupBy(fcm_config,'class');
        let test_users = [4414510]
        for (const view_data of studentsDailyViewCount) {
            // console.log(fcm_config_grouped)
            // console.log(fcm_config_grouped[view_data.student_class])
            if (fcm_config_grouped[view_data.student_class]) {
                var nudge_selected
                fcm_config_grouped[view_data.student_class].forEach(nudge=>{
                  if(nudge.count<=view_data.view_count){
                    nudge_selected = nudge
                  }
                })
                if(!checkRedisKey[String(view_data.student_id)] || parseInt(checkRedisKey[String(view_data.student_id)]) !== nudge_selected.count ){

                        console.log(view_data)
                        console.log(checkRedisKey[String(view_data.student_id)])
                        let notificationInfo  = {
                            'event':nudge_selected.event,
                            'data':nudge_selected.data,
                            'message':nudge_selected.message,
                            'title':nudge_selected.title,
                            'image':nudge_selected.image,
                            'firebase_eventtag':nudge_selected.firebase_eventtag
                         }
                         if ('title' in notificationInfo && 'message' in notificationInfo && 'event' in notificationInfo && view_data.gcm_reg_id) {
                             if (!('data' in notificationInfo)) notificationInfo.data = {};
                                const user = [{ id: view_data.student_id, gcmId: view_data.gcm_reg_id }];
                                const options = {
                                    method: 'POST',
                                    url: NotificationConstants.notification.newton_url,
                                    headers:
                                { 'Content-Type': 'application/json' },
                                    body:
                                { notificationInfo, user },
                                    json: true,
                                };


                           await  wait(options)
        
                         }
                         console.log(todayEndExpiry)
                        let set_key_in_redis =  write_redis.multi()
                                                            .hset(`fcm_contest`,view_data.student_id,nudge_selected.count)
                                                            .expireat(`fcm_contest`,todayEndExpiry)
                                                            .execAsync()
    
                }

            }

        }
    
    } catch (error) {
        console.log(error)
        process.exit()

    } finally {
            mysql_analytics.close()
            mysql_write.close()
            process.exit()
    }
    function wait(options) {
        return new Promise((resolve, reject) => {
            request(options, (error, response, body) => {
                if (error) console.log(error);
                console.log(body);
                resolve(body);
            });
        })
    }

})();