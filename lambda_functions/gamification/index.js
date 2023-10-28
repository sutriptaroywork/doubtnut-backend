/**
 * @Author: xesloohc
 * @Date:   2019-07-01T23:42:05+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-11-18T18:30:38+05:30
 */

const _ = require('lodash');
const mysql = require('mysql');
const admin = require('firebase-admin');
admin.initializeApp({
    credential: admin.credential.cert('./doubtnut-e000a-firebase-adminsdk-6lh8n-2d57630fa7.json'),
    databaseURL: 'https://doubtnut-e000a.firebaseio.com'
});

var Redis = require('ioredis');
var Promise = require('bluebird');
Promise.promisifyAll(Redis);

if (typeof client_read === 'undefined') {
    var client_read = mysql.createConnection({ host: process.env.MYSQL_HOST_READ, user: process.env.MYSQL_USER_READ, password: process.env.MYSQL_PASS_READ, database: process.env.MYSQL_DB });
    client_read.connect();
}
if (typeof cluster === 'undefined') {
    var cluster
    if (parseInt(process.env.USE_OLD_REDIS)) {

        cluster = new Redis({

            host: process.env.REDIS_HOST,

            port: process.env.REDIS_PORT

        })
    } else {
        let redisHosts = process.env.REDIS_HOSTS.split(',')
        console.log(redisHosts)
        // cluster = new Redis.Cluster(["redis-cluster0-0.doubtnut.internal", "redis-cluster0-2.doubtnut.internal"].map((host) => ({ host, port: 6379 })), {
        //     redisOptions: { password: process.env.REDIS_PASSWORD }
        // });
        cluster = redisHosts.length > 1 ? new Redis.Cluster(redisHosts.map((host) => ({ host, port: 6379 })), { redisOptions: { password: process.env.REDIS_PASSWORD }, }) : new Redis({ host: redisHosts, port: 6379, password: process.env.REDIS_PASSWORD });
        console.log(cluster)
    }

}


module.exports.handler = async (event, context) => {
    try {
        var client_write = mysql.createConnection({ host: process.env.MYSQL_HOST_WRITE, user: process.env.MYSQL_USER_WRITE, password: process.env.MYSQL_PASS_WRITE, database: process.env.MYSQL_DB });

        var currentTime = new Date();
        var currentOffset = currentTime.getTimezoneOffset();
        var ISTOffset = 330;   // IST offset UTC +5:30
        var ISTTime = new Date(currentTime.getTime() + (ISTOffset + currentOffset) * 60000);
        let todayEndUTC = ISTTime.setHours(23, 59, 59, 999);
        let todayEndExpiry = parseInt(todayEndUTC / 1000) - (5.5 * 60 * 60)
        let tommorowEndExpiry = todayEndExpiry + (1 * 24 * 60 * 60)
        context.callbackWaitsForEmptyEventLoop = false;
        console.log(event)
        for (message of event.Records) {
            data = JSON.parse(message.body)

            console.log(data)
            let prefix = ""

            let Dbconnect = await dbconnect(client_write)
            function dbconnect(client_write) {
                return new Promise((resolve, reject) => {
                    client_write.connect(function (err) {
                        if (err) {
                            return new Promise(function (resolve, reject) {
                                reject(err);
                            });
                        } else {
                            resolve("connected")
                        }
                    });
                })
            }


            console.log(context.getRemainingTimeInMillis())
            let user_data = getUserData(client_read, data.user_id)
            let action_config = getGamificationActionConfigByAction(client_read, data.action)
            let user_action_activity_count = getUserActivityCountByAction(client_read, data.action, data.user_id)
            let user_meta_data = getUserMetaData(client_write, data.user_id)

            action_config = await action_config
            user_action_activity_count = await user_action_activity_count
            user_meta_data = await user_meta_data
            let new_user = 0
            let streak_status = 1
            let insertMilestoneData = []

            if (user_meta_data.length < 1) {
                user_meta_data = { user_id: data.user_id, lvl: 0, points: action_config.xp, badges: "", daily_streak: 1, banner_img: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D311E77D-34D7-751A-8B7D-379FD0868BC7.webp' }
                new_user = 1
            } else {
                user_meta_data = user_meta_data[0]
                user_meta_data.points = user_meta_data.points + action_config.xp
                streak_status = user_meta_data.streak
                delete user_meta_data.streak
            }
            console.log('streak_status')
            console.log(streak_status)
            user_action_activity_count = user_action_activity_count + 1
            console.log(user_action_activity_count)
            let notifications = []
            if (user_action_activity_count > 1 && data.action == 'PROFILE_COMPLETE') {
                return new Promise(function (resolve, reject) {
                    resolve("No Point For Multiple Profile Complete");
                });
            } else if (data.action == 'DAILY_STREAK' && !streak_status) {
                return new Promise(function (resolve, reject) {
                    resolve("Already Given For the Day");
                });

            } else {
                if (data.action == 'DAILY_STREAK') {
                    console.log('DAILY_STREAK+Action')
                    action_config.xp = streak_status * action_config.xp
                    notifications.push({
                        priority: 9, data: {
                            "notification_type": "SILENT_GAMIFICATION",
                            "popup_direction": "BOTTOM_LEFT",
                            "popup_type": "daily_popup_points_achieved",
                            "message": action_config.xp,
                            "description": action_config.xp + 4,
                            "img_url": "",
                            "duration": "2000"
                        }
                    })
                } else {
                    notifications.push({
                        priority: 9, data: {
                            "notification_type": "SILENT_GAMIFICATION",
                            "popup_direction": "TOP_RIGHT",
                            "popup_type": "popup_points_achieved",
                            "message": "Congratulations",
                            "description": action_config.xp + " points Earned",
                            "img_url": "",
                            "duration": "2000"
                        }
                    })
                }

                let badge_data = getBadges(client_read)
                badge_data = await badge_data
                let badged_grouped_by_action = _.groupBy(badge_data, 'requirement_type')
                let directActionsBadge = 0
                user_data = await user_data
                if (badged_grouped_by_action[data.action]) {
                    _.forEach(badged_grouped_by_action[data.action], (action_badge) => {
                        console.log(action_badge)
                        if (action_badge.requirement == user_action_activity_count) {
                            insertMilestoneData.push([data.user_id, 'BADGE', action_badge.badge_id])
                            //  notifications.push({priority:6,data:{
                            //    "notification_type":"SILENT_GAMIFICATION",
                            //    "popup_direction":"BOTTOM",
                            //    "popup_type":"popup_badge_achieved",
                            //    "message":"Congratulations",
                            //    "description":"You Have Earned "+action_badge.name + " Badge",
                            //    "img_url":action_badge.image_url,
                            //    "duration":"5000"
                            //  }})
                            directActionsBadge = action_badge.badge_id;
                        }
                        //  else if (action_badge.requirement == user_action_activity_count+1) {
                        //    notifications.push({priority:8,data:{
                        //      "notification_type":"SILENT_GAMIFICATION",
                        //      "popup_direction":"BOTTOM",
                        //      "popup_type":"popup_badge",
                        //      "message":action_badge.nudge_description,
                        //      "description":action_badge.name + ' Badge',
                        //      "img_url":action_badge.image_url,
                        //      "duration":"5000"
                        //    }})
                        //  }
                    })

                }

                user_meta_data.badges = _.split(user_meta_data.badges, ',')
                if (directActionsBadge) {
                    user_meta_data.badges.push(directActionsBadge)
                }
                let totalPoints = user_meta_data.points
                let lvlBytotalPoint = await getLevelByPoints(client_read, totalPoints)
                if (user_meta_data.lvl < lvlBytotalPoint.lvl) {
                    insertMilestoneData.push([data.user_id, 'LVL', lvlBytotalPoint.lvl])
                    notifications.push({
                        priority: 8, data: {
                            "notification_type": "SILENT_GAMIFICATION",
                            "popup_direction": "BOTTOM",
                            "popup_type": "popup_levelup",
                            "message": "Well Done!",
                            "description": "You Reached Level " + lvlBytotalPoint.lvl,
                            "img_url": "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp",
                            "duration": "5000"
                        }
                    })
                    let is_lvl_badge_achieved = false
                    let level_badges = badged_grouped_by_action['LEVEL']
                    _.forEach(level_badges, (action_badge) => {
                        console.log(action_badge)
                        if (action_badge.requirement == lvlBytotalPoint.lvl) {
                            console.log(action_badge)
                            is_lvl_badge_achieved = true
                            user_meta_data.banner_img = action_badge.banner_img
                            insertMilestoneData.push([data.user_id, 'BADGE', action_badge.badge_id])
                            //  notifications.push({priority:7,data:{
                            //    "notification_type":"SILENT_GAMIFICATION",
                            //    "popup_direction":"BOTTOM",
                            //    "popup_type":"popup_badge_achieved",
                            //    "message":"Congratulations",
                            //    "description":"You Have Earned "+action_badge.name,
                            //    "img_url":action_badge.image_url,
                            //    "duration":"5000"
                            //  }})
                            user_meta_data.badges.push(action_badge.badge_id)
                        }
                    })
                    user_meta_data.lvl = lvlBytotalPoint.lvl
                }

                user_meta_data.badges = _.trim(_.join(user_meta_data.badges, ','), ',')

                let sortednotification = _.sortBy(notifications, 'priority')
                let is_error = 0
                let is_complete = 0

                let write_transaction = write_transaction_function()
                function write_transaction_function() {
                    return new Promise(function (resolve, reject) {
                        client_write.beginTransaction(async function (err) {
                            if (err) {
                                throw err;
                                reject(err)
                            }
                            let mysql_transactions_data = []
                            mysql_transactions_data.push({
                                sql: 'INSERT INTO `gamification_activity` SET ?',
                                data: [{ 'activity': data.action, 'user_id': data.user_id, 'refer_id': data.refer_id, 'xp': action_config.xp, v: 3 }]
                            }
                            )
                            if (data.action !== 'DAILY_STREAK' && streak_status) {
                                console.log("DAILY_STREAK UPDATED")
                                mysql_transactions_data.push({
                                    sql: 'INSERT INTO `gamification_activity` SET ?',
                                    data: [{ 'activity': 'DAILY_STREAK', 'user_id': data.user_id, 'refer_id': data.refer_id, 'xp': 4 * streak_status, v: 3 }]
                                }
                                )
                                action_config.xp = action_config.xp + (4 * streak_status)
                                user_meta_data.points = user_meta_data.points + (4 * streak_status)
                            }
                            if (typeof user_meta_data.id !== 'undefined') {
                                mysql_transactions_data.push({
                                    sql: 'UPDATE `gamification_user_meta` SET `lvl`= ?,`points`=points+?,`coins_earned` = coins_earned + ?,`coins` = coins + ?,`badges`= ?,`daily_streak` = (CASE WHEN DATEDIFF(NOW(), updated_at) = 1 THEN daily_streak+1 WHEN DATEDIFF(NOW(), updated_at) = 0 THEN daily_streak ELSE 1 END),`max_daily_streak` = (CASE WHEN `daily_streak` > `max_daily_streak` THEN `daily_streak` ELSE `max_daily_streak` END),`banner_img`=? WHERE id = ?',
                                    data: [user_meta_data.lvl, action_config.xp, _.floor(action_config.xp / 2), _.floor(action_config.xp / 2), _.trim(user_meta_data.badges, ','), user_meta_data.banner_img, user_meta_data.id]
                                })
                            } else {
                                user_meta_data.coins_earned = user_meta_data.points
                                user_meta_data.coins = _.floor(user_meta_data.points / 2)

                                mysql_transactions_data.push({
                                    sql: "INSERT INTO gamification_user_meta SET ?",
                                    data: [user_meta_data]
                                })
                            }
                            if (insertMilestoneData.length > 0) {
                                mysql_transactions_data.push({
                                    sql: 'INSERT INTO `gamification_milestones` (`user_id`, `milestone_type`, `milestone`) VALUES ?',
                                    data: [insertMilestoneData]
                                })
                            }

                            for (var i = 0; i < mysql_transactions_data.length; i++) {
                                let sql = mysql_transactions_data[i].sql
                                console.log(sql)
                                let data = mysql_transactions_data[i].data
                                console.log(data)
                                query_promise = new Promise(function (resolve, reject) {
                                    client_write.query(sql, data, function (err, result) {
                                        if (err) {
                                            is_error = 1
                                            client_write.rollback(function () {
                                                throw err;
                                            });
                                            reject(err)
                                        } else {
                                            console.log(result)
                                            if (i == mysql_transactions_data.length - 1) {
                                                client_write.commit(function (err) {
                                                    if (err) {
                                                        is_error = 1
                                                        client_write.rollback(function () {
                                                            throw err;
                                                        });
                                                        reject(err)

                                                    } else {
                                                        is_complete = 1
                                                        console.log('Transaction Complete.');
                                                        resolve(result)
                                                    }
                                                    //resolve("success")
                                                });
                                            } else {
                                                resolve(result)
                                            }
                                        }
                                    })
                                })
                                query_promise = await query_promise
                                if (is_error) {
                                    reject("err")
                                    break
                                }

                            }
                            if (is_complete) {

                                let setLeaderboard = cluster.zadd(prefix + 'leaderboard', 'INCR', action_config.xp, data.user_id)
                                let setDailyLeaderboard = cluster.multi()
                                    .zadd(prefix + 'dailyleaderboard', 'INCR', action_config.xp, data.user_id)
                                    .expireat(prefix + 'dailyleaderboard', todayEndExpiry)
                                    .execAsync()

                                let messageTosend = {};
                                messageTosend["android"] = {
                                    priority: "normal",
                                    ttl: 4500
                                };

                                messageTosend["token"] = user_data[0].gcm_reg_id;
                                messageTosend['data'] = sortednotification[0].data
                                try {
                                    await sendNotification(messageTosend)
                                } catch (e) {

                                }
                                resolve("success")
                            }
                        });

                    });
                }
                write_transaction = await write_transaction

                //let dbConnectionClose = await closeDbConnection(client_write)

                if (is_error) {
                    return new Promise(function (resolve, reject) {
                        reject("Some Error In Query");
                    });
                }
                if (is_complete) {
                    if (data.action == 'WATCH_MATCHED_VIDEO' || data.action == 'WATCH_LIBRARY_VIDEO') {
                        let video_view_count = await cluster.getAsync(prefix + 'video_view_count_' + data.user_id)
                        console.log(video_view_count)
                        await cluster.multi()
                            .incr(prefix + 'video_view_count_' + data.user_id)
                            .expireat(prefix + 'video_view_count_' + data.user_id, todayEndExpiry)
                            .execAsync()
                        console.log('1')

                        if (!_.isNull(video_view_count) && video_view_count == 4) {
                            await cluster.multi()
                                .incr(prefix + 'video_view_streak_' + data.user_id)
                                .expireat(prefix + 'video_view_streak_' + data.user_id, tommorowEndExpiry)
                                .execAsync()
                        }
                        console.log('2')


                    }
                    return new Promise(function (resolve, reject) {
                        resolve("All Set");
                    });
                }

            }

        }
    } catch (e) {
        return new Promise(function (resolve, reject) {
            reject(e);
        });

    } finally {
        console.log(client_read)
        console.log(client_write)
        client_write.end(function (err) {
            if (err) {
                console.log("write connection no closed")
                console.log(err)
            } else {
                console.log("write DB ended")
            }
        })

    }
    function redisGetkeyData(redis, key) {
        return new Promise((resolve, reject) => {
            redis.get(key).then(function (result) {
                console.log(result)
                resolve(result)
            });
        })
    }
    function closeDbConnection(db) {
        return new Promise((resolve, reject) => {
            db.end(function (err) {
                if (err) {
                    reject(err)
                    console.log("write connection no closed")
                    console.log(err)
                } else {
                    resolve("DB ENDED")
                    console.log("write DB ended")
                }
            })
        })
    }

    function sendNotification(message) {
        return new Promise((resolve, reject) => {
            console.log(message)
            if (!_.isNull(message["token"])) {
                admin.messaging().send(message)
                    .then((response) => {
                        resolve(response)
                        console.log('Successfully sent message:', response);
                    })
                    .catch((error) => {
                        resolve(error)
                        console.log('Error sending message:', error);
                    });
            } else {
                resolve("")
            }

        })

    }
    function getBadges(mysql) {
        return new Promise((resolve, reject) => {
            let sql = "SELECT badge_id,requirement_type,requirement,subject,is_optional,name,description,nudge_description,image_url,banner_img FROM `gamification_badge_requirements` LEFT JOIN gamification_badge_meta ON badge_id = gamification_badge_meta.`id` WHERE gamification_badge_meta.is_active = 1"
            mysql.query(sql, function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result)
                }
            })
        })
    }

    function createGamificationUserMata(mysql, student_id) {
        return new Promise((resolve, reject) => {
            let sql = "INSERT INTO gamification_user_meta SET ?"
            mysql.query(sql, [{ user_id: student_id }], function (err, result) {
                resolve(result)
            })
        })
    }

    function getGamificationLvlConfig(mysql) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM `gamification_lvl_config`'
            mysql.query(sql, function (err, result) {
                resolve(result)
            })
        })
    }

    function getLevelByPoints(mysql, points) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM `gamification_lvl_config` WHERE xp <= ? ORDER BY lvl DESC LIMIT 1'
            mysql.query(sql, [points], function (err, result) {
                if (result.length < 1) {
                    resolve({ lvl: 0, xp: 0 })
                } else {
                    resolve(result[0])
                }
            })
        })
    }

    function getGamificationActionConfigByAction(mysql, action) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM `gamification_action_config` WHERE action = ?'
            mysql.query(sql, [action], function (err, result) {
                if (err) {
                    reject(err)
                } else {
                    resolve(result[0])
                }
            })
        })
    }

    function getUserActivityCountByAction(mysql, action, user_id) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT count(*) as count FROM `gamification_activity` WHERE activity = ? AND user_id = ?'
            mysql.query(sql, [action, user_id], function (err, result) {
                console.log(result)
                resolve(result[0].count)
            })
        })
    }

    function getUserMetaData(mysql, user_id) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT *,CASE WHEN DATEDIFF(NOW(), updated_at) = 1 THEN daily_streak+1 WHEN DATEDIFF(NOW(), updated_at) = 0 THEN 0 ELSE 1 END as streak FROM `gamification_user_meta` WHERE user_id = ? ORDER BY user_id DESC LIMIT 1'
            mysql.query(sql, [user_id], function (err, result) {
                resolve(result)
            })
        })
    }

    function getUserData(mysql, user_id) {
        user_id = parseInt(user_id)
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM `students` WHERE student_id = ?'
            mysql.query(sql, [user_id], function (err, result) {
                resolve(result)
            })
        })
    }

    function getUserMilestones(mysql, user_id) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM `gamification_milestones` WHERE user_id = ?'
            mysql.query(sql, [user_id], function (err, result) {
                console.log("result")
                console.log(result)
                resolve(result)
            })
        })
    }

    function getUserActivity(mysql, user_id) {
        return new Promise((resolve, reject) => {
            let sql = 'SELECT * FROM `gamification_activity` WHERE user_id = ?'
            mysql.query(sql, [user_id], function (err, result) {
                resolve(result)
            })
        })
    }

    function insertUserActivity(mysql, activity_data) {
        return new Promise((resolve, reject) => {
            let sql = 'INSERT INTO `gamification_activity` SET ?'
            mysql.query(sql, [activity_data], function (err, result) {
                console.log(err)
                resolve(result)
            })
        })
    }

    function insertUserMilestones(mysql, milestone_data) {
        return new Promise((resolve, reject) => {
            let sql = 'INSERT INTO `gamification_milestones` SET ?'
            mysql.query(sql, milestone_data, function (err, result) {
                resolve(result)
            })
        })
    }

    function updateUserMeta(mysql, meta_data_update, user_meta_id) {
        return new Promise((resolve, reject) => {
            let sql = 'UPDATE `gamification_user_meta` SET ? WHERE id = ?'
            mysql.query(sql, [meta_data_update, user_meta_id], function (err, result) {
                resolve(result)
            })
        })
    }

    function updateUserMetaBadges(mysql, user_badge_update, user_meta_id) {
        return new Promise((resolve, reject) => {
            let sql = 'UPDATE `gamification_user_meta` SET badges = ? WHERE id = ?'
            mysql.query(sql, [user_badge_update, user_meta_id], function (err, result) {
                resolve(result)
            })
        })
    }
}