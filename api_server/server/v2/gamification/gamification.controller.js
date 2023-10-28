/**
 * @Author: xesloohc
 * @Date:   2019-06-11T15:41:06+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-11-05T19:29:15+05:30
 */

 const _ = require('lodash')

 let db,config,client
 const moment = require('moment');
 const Gamification = require("../../../modules/mysql/gamification")
 const GamificationRedis = require("../../../modules/redis/gamification")
 const Student = require("../../../modules/student")
 const Utility = require("../../../modules/utility")
//TODO REDIS CACHE ON REQUIRED STATEMENT AND ASYNC REQUEST AFTER RELEASE 10%
 async function getBadge(req,res,next) {
   try{
     db = req.app.get('db')
     config = req.app.get('config')
     let student_id = req.params.student_id
     //get user meta
     let student_gamification_meta =  Gamification.getGamificationUserMeta(db.mysql.read,student_id)
     let badges =  Gamification.getBadges(db.mysql.read)
     student_gamification_meta = await student_gamification_meta
     badges = await badges
     if (student_gamification_meta.length < 1) {
       let student_meta_create =  Gamification.createGamificationUserMata(db.mysql.write,student_id)
       student_gamification_meta = [{badges:""}]
     }
     let badges_achieved = _.split(student_gamification_meta[0].badges,',')
     let achieved_badges = []
     let unachieved_badges = []

     _.forEach(badges,(badge)=>{
       badge.share_message = "I have earned a "+badge.name+" Badge on Doubtnut. Aap bhi Doubtnut download karein aur aaise mazedaar badges jeetein :)"
       if (badges_achieved.includes(badge.id.toString())) {
         badge.is_achieved = 1
         achieved_badges.push(badge)
       }else{
         badge.is_achieved = 0
         unachieved_badges.push(badge)
       }
     })

     let responseData = {
               "meta": {
                 "code": 200,
                 "success": true,
                 "message": "SUCCESS!"
               },
               "data": {"jeete_hue_badges":achieved_badges,"jeete_naye_badges":unachieved_badges}
             }
     res.status(responseData.meta.code).json(responseData);
   }catch(e){
     next(e)
   }

 }

 function dailyStreakJsonBuilder(student_id,streak,max_streak) {
   let streak_json= []
   for (var i = streak; i <= streak+4; i++) {
     let streak_obj = {
       "title" : "Day "+ i,
       "icon" : "",
       "is_achieved":(i<=streak)?1:0,
       "type":"NONBADGE",
       "points":i*4
     }
     if ((i%5) === 0) {
       streak_obj.icon = "Starred ICON URL"
       streak_obj.type = "BADGE"
     }

     streak_json.push(streak_obj)
   }
   return streak_json
 }

 async function getProfile(req,res,next){
  try {
     db = req.app.get('db')
     config = req.app.get('config')
     let others_stats
     let is_own = 1
     let student_id = req.params.student_id
     let student_meta = await Gamification.getStudentDataWithMeta(db.mysql.read,student_id)
     console.log(student_meta)
     if (Array.isArray(student_meta) && student_meta.length) {
       let badges =  Gamification.getBadges(db.mysql.read)
       let student_daily_point =  Gamification.getDailyPointsByUserId(db.mysql.read,student_id)
       let toptenzrange = GamificationRedis.getDailyLeaderboard(db.redis.read,0,4)
       badges = await badges
       console.log(badges)
      // student_meta = await student_meta
       student_daily_point = await student_daily_point
       student_meta = student_meta[0]
       if (student_meta.badges === null) {
         [student_meta.lvl,student_meta.points,student_meta.badges,student_meta.daily_streak,student_meta.max_daily_streak,student_meta.banner_img] = [0,0,"",1,1,`${config.staticCDN}engagement_framework/D311E77D-34D7-751A-8B7D-379FD0868BC7.webp`]

       }
       let badges_achieved = _.split(student_meta.badges,',')

       let profile_badge_view =_
          .chain(badges)
          .map((badge)=>{
             if (badges_achieved.includes(badge.id.toString())) {
               badge.is_achieved = 1
             }else{
               badge.is_achieved = 0
             }
             return badge
           })
          .sortBy('is_achieved')
          .reverse()
          .slice(0,4)


       let daily_streak =  dailyStreakJsonBuilder(student_meta.user_id,student_meta.daily_streak,student_meta.max_daily_streak)
       toptenzrange = await toptenzrange
       let topten_student_ids = []
       let topten_student_scores = []
       let topten_student_ranks = []
       let rankcounter = 1
       for (var i = 0; i < toptenzrange.length; i++) {
        if(i % 2 === 0) { // index is even
            topten_student_ids.push(toptenzrange[i])
            topten_student_ranks.push(rankcounter)
            rankcounter++
        }else{

            topten_student_scores.push(toptenzrange[i])
        }
       }

       let leaderboard_data = []
       if (topten_student_ids.length > 0) {
         let student_data_by_ids = await Gamification.getStudentByIds(db.mysql.read,topten_student_ids)
         let grouped_student_data_ids = _.groupBy(student_data_by_ids,'student_id')

         _.forEach(topten_student_ids , (topten_student_id,key)=>{
            if(!grouped_student_data_ids[topten_student_id][0].img_url){
              grouped_student_data_ids[topten_student_id][0].img_url=''
           }
           let data =    {
              "user_id":grouped_student_data_ids[topten_student_id][0].student_id,
              "user_name":grouped_student_data_ids[topten_student_id][0].student_username,
              "rank":topten_student_ranks[key],
              "profile_image":grouped_student_data_ids[topten_student_id][0].img_url,
              "points":topten_student_scores[key],
              "is_own":0
            }
            if (topten_student_id == student_id) {
              data.is_own = 1
            }
            leaderboard_data.push(data)
         })
       }
       if(!student_meta.student_username){
        student_meta.student_username=""
       }
       if (req.user.student_id == student_id) {
         is_own = 1
         others_stats = []

         if(!student_meta.school_name){
          student_meta.school_name=""
         }
       } else{
         is_own = 0
         others_stats = await Gamification.getOthersStats(db.mysql.read,student_id)
       }
       if (student_meta.student_class == 14) {
         student_meta.student_class = 'GOVT EXAMS'
       } else{
         student_meta.student_class = "Class " + student_meta.student_class
       }


       let outputformat = {
         "username": student_meta.student_username,
         "profile_image":student_meta.img_url,
         "user_level":student_meta.lvl,
         "user_recent_badges":profile_badge_view,
         "user_lifetime_points":student_meta.points,
         "user_todays_point":student_daily_point[0].daily_point?student_daily_point[0].daily_point:0,
         "daily_streak_progress":daily_streak,
         "leaderboard":leaderboard_data,
         "points_to_earned_with_login":"Login and Complete Profile To Earn a Badge",
         "coins":student_meta.coins,
         "banner_img":student_meta.banner_img,
         "is_own":is_own,
         "others_stats":others_stats,
         "class":student_meta.student_class,
         "student_email":'',
         "school_name":!is_own?"":student_meta.school_name,
       }
       let responseData = {
                 "meta": {
                   "code": 200,
                   "success": true,
                   "message": "SUCCESS!"
                 },
                 "data": outputformat
               }
       res.status(responseData.meta.code).json(responseData);
     }else{
       let responseData = {
                 "meta": {
                   "code": 403,
                   "success": false,
                   "message": "FAILED!!"
                 },
                 "data": "USER URL INVALID"
               }
       res.status(responseData.meta.code).json(responseData);
     }

   } catch (e) {
    console.log(e)
     next(e)
   }

 }

 async function getDailyStreak(req,res,next){
   try {
     db = req.app.get('db')
     config = req.app.get('config')
     let student_id = req.params.student_id
     //let student_streak = await Gamification.getStudentAttendanceStreak(db.mysql.read,student_id)
     let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read,student_id)
     if (student_gamification_meta.length < 1) {
       student_gamification_meta = [{user_id:student_id,lvl:0,points:0,badges:"",daily_streak:1,max_daily_streak:1}]
     }
     console.log(student_gamification_meta)
     let daily_streak =  dailyStreakJsonBuilder(student_gamification_meta[0].user_id,student_gamification_meta[0].daily_streak,student_gamification_meta[0].max_daily_streak)

     let data = {
       title:"Kal phir aaye aur "+(4*(student_gamification_meta[0].daily_streak+1))+" points paayein",
       title_img:"img_url",
       heading:"Aapka Current Streak",
       daily_streak:daily_streak,
       longest_streak:student_gamification_meta[0].max_daily_streak,
       longest_streak_image:"url",
     }
     let responseData = {
               "meta": {
                 "code": 200,
                 "success": true,
                 "message": "SUCCESS!"
               },
               "data": data
             }
     res.status(responseData.meta.code).json(responseData);
   } catch (e) {
    next(e)
   }

 }

 async function getPoints(req,res,next){
   try {
     db = req.app.get('db')
     config = req.app.get('config')
     let student_id = req.user.student_id
     let student_daily_point = await Gamification.getDailyPointsByUserId(db.mysql.read,student_id)

     let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read,student_id)
     let lvl_action = await Gamification.getActionConfig(db.mysql.read)
     student_gamification_meta = await  student_gamification_meta
     lvl_action = await lvl_action
     if (student_gamification_meta.length < 1) {
       student_gamification_meta = [{user_id:student_id,lvl:0,points:0,badges:"",daily_streak:1,max_daily_streak:1}]
     }
     let lvl_config = await Gamification.getLevelConfig(db.mysql.read)
     let next_lvl_points = 0
     let current_lvl_points = 0
     console.log(student_gamification_meta[0].lvl)
      let lvl_data = _.map(lvl_config,level=>{
        console.log(level)
        if (level.lvl == student_gamification_meta[0].lvl+1) {
          next_lvl_points = level.xp
        }
        if (level.lvl == student_gamification_meta[0].lvl) {
          current_lvl_points = level.xp
        }

         if (level.lvl > student_gamification_meta[0].lvl) {
           level.is_achieved = 0
         }else{
           level.is_achieved = 1

         }
         return level
       })
       if (!next_lvl_points) {
         next_lvl_points = current_lvl_points
       }

     let next_lvl = student_gamification_meta[0].lvl+1<=10?student_gamification_meta[0].lvl+1:student_gamification_meta[0].lvl;
     let data = {
       title:"My Earned Points",
       daily_point:student_daily_point[0].daily_point?student_daily_point[0].daily_point:0,
       points:student_gamification_meta[0].points,
       current_lvl: student_gamification_meta[0].lvl,
       current_lvl_img:"img_url",
       current_lvl_points:current_lvl_points,
       next_lvl:next_lvl,
       next_current_img:"img_url",
       next_lvl_points:next_lvl_points,
       next_level_percentage:_.round((current_lvl_points/next_lvl_points)*100),
       heading: next_lvl +" ?",
       history_text:"view_history",
       action_config_data:lvl_action,
       view_level_info:lvl_data,

     }

      let responseData = {
                "meta": {
                  "code": 200,
                  "success": true,
                  "message": "SUCCESS!"
                },
                "data": data
              }
      res.status(responseData.meta.code).json(responseData);
   } catch (e) {
     next(e)
   }

 }

 async function leaderboard(req,res,next){
   try {
     db = req.app.get('db')
     config = req.app.get('config')
     let student_id = req.user.student_id
     //let student_id = 503
     let toptenzrange = await GamificationRedis.getLeaderboard(db.redis.read,0,9)
     let topten_student_ids = []
     let topten_student_scores = []
     let topten_student_ranks = []
     let rankcounter = 1
     for (var i = 0; i < toptenzrange.length; i++) {
      if(i % 2 === 0) { // index is even
          topten_student_ids.push(toptenzrange[i])
          topten_student_ranks.push(rankcounter)
          rankcounter++
      }else{

          topten_student_scores.push(toptenzrange[i])
      }
     }
     if (!topten_student_ids.includes(student_id.toString())) {

       let student_rank = await GamificationRedis.getRankByUserId(db.redis.read,student_id)
       if (student_rank) {
         student_rank++
         let student_score = await GamificationRedis.getScoreByUserId(db.redis.read,student_id)
         topten_student_ids.push(student_id)
         topten_student_scores.push(student_score)
         topten_student_ranks.push(student_rank)
       }
     }
     let leaderboard_data = []
     if (topten_student_ids.length > 0) {
       console.log(topten_student_ids)
       let student_data_by_ids = await Gamification.getStudentByIds(db.mysql.read,topten_student_ids)
       let grouped_student_data_ids = _.groupBy(student_data_by_ids,'student_id')
       console.log(grouped_student_data_ids)
       _.forEach(topten_student_ids , (topten_student_id,key)=>{
         let data =    {
            "user_id":grouped_student_data_ids[topten_student_id][0].student_id,
            "user_name":grouped_student_data_ids[topten_student_id][0].student_username,
            "rank":topten_student_ranks[key],
            "profile_image":grouped_student_data_ids[topten_student_id][0].img_url,
            "points":topten_student_scores[key],
            "is_own":0
          }
          if (topten_student_id == student_id) {
            data.is_own = 1
          }
          leaderboard_data.push(data)
       })
     }

     //let student_id = 503
     let daily_toptenzrange = await GamificationRedis.getDailyLeaderboard(db.redis.read,0,9)
     let daily_topten_student_ids = []
     let daily_topten_student_scores = []
     let daily_topten_student_ranks = []
     let daily_rankcounter = 1
     for (var i = 0; i < daily_toptenzrange.length; i++) {
      if(i % 2 === 0) { // index is even
          daily_topten_student_ids.push(daily_toptenzrange[i])
          daily_topten_student_ranks.push(daily_rankcounter)
          daily_rankcounter++
      }else{

          daily_topten_student_scores.push(daily_toptenzrange[i])
      }
     }
     if (!daily_topten_student_ids.includes(student_id.toString())) {

       let student_rank = await GamificationRedis.getDailyRankByUserId(db.redis.read,student_id)
       console.log('Daily Rank' + student_rank)
       if (student_rank) {
         student_rank++
         let student_score = await GamificationRedis.getDailyScoreByUserId(db.redis.read,student_id)
         daily_topten_student_ids.push(student_id)
         daily_topten_student_scores.push(student_score)
        daily_topten_student_ranks.push(student_rank)
       }
     }
     let daily_leaderboard_data = []
     if (daily_topten_student_ids.length > 0) {
       console.log(daily_topten_student_ids)
       let student_data_by_ids = await Gamification.getStudentByIds(db.mysql.read,daily_topten_student_ids)
       let grouped_student_data_ids = _.groupBy(student_data_by_ids,'student_id')
       console.log(grouped_student_data_ids)
       _.forEach(daily_topten_student_ids , (topten_student_id,key)=>{
         let data =    {
            "user_id":grouped_student_data_ids[topten_student_id][0].student_id,
            "user_name":grouped_student_data_ids[topten_student_id][0].student_username,
            "rank":daily_topten_student_ranks[key],
            "profile_image":grouped_student_data_ids[topten_student_id][0].img_url,
            "points":daily_topten_student_scores[key],
            "is_own":0
          }
          if (topten_student_id == student_id) {
            data.is_own = 1
          }
          daily_leaderboard_data.push(data)
       })
     }

     let responseData = {
             "meta": {
               "code": 200,
               "success": true,
               "message": "SUCCESS!"
             },
             "data":{all_leaderboard_data:leaderboard_data,daily_leaderboard_data:daily_leaderboard_data}
           }
    res.status(responseData.meta.code).json(responseData);

   } catch (e) {

   }

 }

 async function updateDailyStreak(req,res,next){
  try{
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.user.student_id
    let sqs = req.app.get('sqs')
    Utility.gamificationActionEntry(sqs,config.gamification_sqs,{
      "action":"DAILY_STREAK",
      "user_id":student_id,
      "refer_id":req.user.student_id
    })
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data":{}
            }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}

 async function simulateActionSQS(req,res,next){
   config = req.app.get('config')
   sqs = req.app.get('sqs')
   let student_id = req.params.student_id
   let ask = req.query.ask
   var params = {
     MessageBody:JSON.stringify({
       "action":"INVITE",
       "user_id":student_id,
       "refer_id":503
     }),
     QueueUrl: config.gamification_sqs
   };
   sqs.sendMessage(params, function(err, data) {
     if (err) {
       console.log("Error", err);
     } else {
       let responseData = {
                 "meta": {
                   "code": 200,
                   "success": true,
                   "message": "SUCCESS!"
                 },
                 "data":data.MessageId
               }
       res.status(responseData.meta.code).json(responseData);
       console.log("Success", data.MessageId);
     }
   });
 }


 async function sendNotification(req,res,next){
   try {
     db = req.app.get('db')
     let student_id = parseInt(req.params['student_id'])
     let notification_type = req.params['notification_type']
     console.log(student_id)
     let student_data = await Student.getStudent(student_id,db.mysql.read)
     console.log(student_data)
     let fcmId = student_data[0].gcm_reg_id
     let messageTosend = {};
     if (notification_type == "1") {
       messageTosend["data"] = {
         "notification_type":"SILENT_GAMIFICATION",
         "popup_direction":"TOP_RIGHT",
         "popup_type":"popup_points_achieved",
         "message":"congrax",
         "description":"10 Point Earned",
         "img_url":""
       }
     }else if (notification_type == "2") {
       messageTosend["data"] = {
         "notification_type":"SILENT_GAMIFICATION",
         "popup_direction":"BOTTOM",
         "popup_type":"popup_badge_achieved",
         "message":"Congratulations",
         "description":"You Have Earned GOD",
         "img_url":`${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
       }
     }else if (notification_type == "3") {
       messageTosend["data"] = {
         "notification_type":"SILENT_GAMIFICATION",
         "popup_direction":"BOTTOM",
         "popup_type":"popup_badge",
         "message":"Congratulations",
         "description":"You Have Earned GOD",
         "img_url":`${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
       }
     }else if (notification_type == "4") {
       messageTosend["data"] = {
         "notification_type":"SILENT_GAMIFICATION",
         "popup_direction":"BOTTOM",
         "popup_type":"popup_levelup",
         "message":"Well Done!",
         "description": "You Reached Level 1",
         "img_url":`${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
         "duration":"5000"
       }
     }else if (notification_type == "5") {
       messageTosend["data"] = {
         "notification_type":"SILENT_GAMIFICATION",
         "popup_direction":"CENTER",
         "popup_type":"popup_unlock",
         "message":"Congratulation",
         "description": "Physics and Chemistry",
         "img_url":`${config.staticCDN}engagement_framework/C5C7759F-2FBA-A39E-6322-857B305CFA7C.webp`,
         "duration":"5000",
         "action_data":JSON.stringify({type:"playlist",id:101996,title:"CONCEPT VIDEOS",button_text:"EXPLORE"})
       }
     }else if (notification_type == "6") {
       messageTosend["data"] = {

           "notification_type":"SILENT_GAMIFICATION",
           "popup_direction":"BOTTOM_LEFT",
           "popup_type":"daily_popup_points_achieved",
           "message":5,
           "description":10,
           "img_url":"",
           "duration":"2000"

       }
     }else if (notification_type == "7") {
       messageTosend["data"] = {
         "notification_type":"SILENT_GAMIFICATION",
         "popup_direction":"CENTER",
         "popup_type":"popup_alert",
         "message":"Be Careful Yahan ashlil, abusive ya offensive language ka use nahi karein",
         "description":JSON.stringify([" Isse aap block ho sakte hai 🚫"," Aap pe sec. 499 IPC ke under legal action bhi ho sakta hai"]),
         "button_text":"Okay, I Will Be Careful",
         "img_url":""
       }
     }
     messageTosend["token"] = fcmId;
     messageTosend["android"] = {
       priority: "normal",
       ttl: 4500
     };


     Utility.sendFcm(student_id,fcmId,messageTosend)
       .then((response) => {
         let responseData = {
                   "meta": {
                     "code": 200,
                     "success": true,
                     "message": "SUCCESS!"
                   },
                   "data":{}
                 }
         res.status(responseData.meta.code).json(responseData);
                console.log('Successfully sent message:', response);
       })
       .catch((error) => {
         let responseData = {
                   "meta": {
                     "code": 500,
                     "success": false,
                     "message": "error!"
                   },
                   "data":error
                 }
         res.status(responseData.meta.code).json(responseData);
         console.log('Error sending message:', error);
       });
   } catch (e) {
     next(e)
   }

 }

 async function unlockinfo(req,res,next){
   config = req.app.get('config')
   db = req.app.get('db')

   let student_id = req.user.student_id
   let invite_progress = await Gamification.getActivityCountByType(db.mysql.read,'INVITE',student_id)
   let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read,student_id)
   if (student_gamification_meta.length < 1) {
     //let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
     student_gamification_meta = [{user_id:student_id,lvl:0,points:0,badges:"",daily_streak:1,max_daily_streak:1}]
   }
   let pc_unlock_count = await GamificationRedis.getUnlockCount(db.redis.read)
   let pc_unlock_images = await GamificationRedis.getUnlockImage(db.redis.read)
   console.log(invite_progress)
   //get redis data from keys
   // cluster.incrby("pc_unlock_count",100);
   // cluster.lpush("pc_unlock_images",user_data[0].img_url)
   // cluster.ltrim("pc_unlock_images",0,9)
   // cluster.set("unlock_"+user_data[0].student_id+"_physics_chemistry", "1")
   //
   let data = {
     "heading":"Physics and Chemistry ko karein unlock",
     "subheading":"Jaaniye Kaise?",
     "badge_required":[
       {
         "id": 19,
         "name":"Earn 75 points",
         "description":"Level 3",
         "nudge_description":"Reach Level 3 to unlock physics and chemistry",
         "requirement_type":"LEVEL",
         "requirement":3,
         "image_url":`${config.staticCDN}engagement_framework/DFCEB044-392F-53F6-C294-E874BEE57CE2.webp`,
         "current_progress": student_gamification_meta[0].lvl,
         "button_text": "Earn Points"
       },
       {
       "id": 11,
       "name":"Invite karein 1 dost",
       "description":"and they join for first time with new mobile",
       "nudge_description":"Invite 1 more Friend on Doubtnut to earn",
       "requirement_type":"INVITE",
       "requirement":1,
       "image_url":`${config.staticCDN}engagement_framework/CF379C71-B81E-6BC0-73DF-64A5B5DB9EAC.webp`,
       "current_progress": invite_progress[0].count,
       "button_text": "Invite Now"
     }
   ],
   "user_images":pc_unlock_images,
   "footer_text": pc_unlock_count+"+ Students already unlocked "
   }
   let responseData = {
             "meta": {
               "code": 200,
               "success": true,
               "message": "SUCCESS!"
             },
             "data":data
           }
   res.status(responseData.meta.code).json(responseData);
 }

async function redeemStore(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id
      let student_gamification_meta = await Gamification.getGamificationUserMeta(db.mysql.read,student_id)
      if (student_gamification_meta.length < 1) {
        //let student_meta_create = await Gamification.createGamificationUserMata(db.mysql.write,student_id)
        student_gamification_meta = [{user_id:student_id,lvl:0,points:0,badges:"",daily_streak:1,max_daily_streak:1,coins:0}]
      }
      let redeem_store_data = await Gamification.getRedeemStoreForUser(db.mysql.read,student_id)
      let redeem_store_data_grouped = _.groupBy(redeem_store_data,'display_category')
      let responseData = {
                "meta": {
                  "code": 200,
                  "success": true,
                  "message": "SUCCESS!"
                },
                "data":{coins:student_gamification_meta[0].coins,freexp:0,tabs:_.keys(redeem_store_data_grouped),tabs_data:redeem_store_data_grouped}
              }
      res.status(responseData.meta.code).json(responseData);
  } catch (e) {
      next(e)
  }
}

async function redeemItem(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id
      let inventory_id = req.params.inventory_id
      // let is_redeem_in_progress = GamificationRedis.getUserRedeemInProgress(db.redis.read,student_id)
      let is_redeem_in_progress = 0
      if
       (is_redeem_in_progress == 1) {
        throw new error()
      }else{
        // let set_redeem_in_progress = GamificationRedis.setUserRedeemInProgress(db.redis.write,student_id)
        let user_gamification_meta = Gamification.getGamificationUserMeta(db.mysql.read,student_id)
        let item_detail = Gamification.getInventoryItemById(db.mysql.read,inventory_id)
        user_gamification_meta = await user_gamification_meta
        item_detail =await item_detail
        if (user_gamification_meta[0].coins < item_detail[0].price) {
          let responseData = {
            "meta": {
              "code": 409,
              "success": false,
              "message": "ERROR_CODE_NO_MONEY"
            },
            "data":{message:"insufficent Coins"}
          }
          res.status(responseData.meta.code).json(responseData);
        }else{
          console.log(item_detail)
          let insert_redeemed_data = await Gamification.redeemItem(db.mysql.write,{item_id:item_detail[0].id,user_id:student_id,amount:item_detail[0].price,transaction_type:"DEBIT",is_redeemed:1})
          let update_gamification_meta  = await Gamification.updateCoins(db.mysql.write,item_detail[0].price,student_id)
          let update_coin_transaction = await Gamification.saveCoinTransactions(db.mysql.write,{user_id:student_id,transaction_type:'REDEEM',reference:insert_redeemed_data.insertId,amount:item_detail[0].price})
          // fanout debit in coin transaction
          let data = {
            title:"Congrax",
            sub_heading:"You have bought this book",
            item_unlocked:item_detail[0],
            footer_text:"Start Learning Today",
            button_text:"Open Now",
            message:"SUCCESS"
          }
          let responseData = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "SUCCESS!"
            },
            "data":data
          }
          res.status(responseData.meta.code).json(responseData);

        }
      }

  } catch (e) {
      next(e)
  }
}

async function convertCoins(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id
      let is_redeem_in_progress = 0
      //let is_redeem_in_progress = GamificationRedis.getUserRedeemInProgress(db.redis.read,student_id)
      if (is_redeem_in_progress == 1) {
        let responseData = {
                  "meta": {
                    "code": 200,
                    "success": false,
                    "message": "FAILED"
                  },
                  "data":{is_converted:false,message:"Previous Transaction In Progress Retry After a min"}
                }
        res.status(responseData.meta.code).json(responseData);
      }else{
        let user_gamification_meta =await Gamification.getGamificationUserMeta(db.mysql.read,student_id)
        console.log('XXXXXXXXXXXXXXXXX')
        let freexp = user_gamification_meta[0].redeemable_points
        console.log(freexp)
        let coins = _.floor(freexp/2)
        console.log(coins)
        let updateMeta = await Gamification.updateCoinsinMeta(db.mysql.write,coins,student_id)
        console.log('XXXXXXXXXXXXXXXXX')


        let update_coin_transaction = await Gamification.saveCoinTransactions(db.mysql.write,{user_id:student_id,transaction_type:'CREDIT',reference:user_gamification_meta[0].redeemable_points,amount:coins})
        console.log('XXXXXXXXXXXXXXXXX')

        let responseData = {
                  "meta":{
                    "code": 200,
                    "success": true,
                    "message": "SUCCESS!"
                  },
                  "data":{is_converted:true,message:"Successfully converted",converted_xp:coins}
                }
        res.status(responseData.meta.code).json(responseData);
      }
  } catch (e) {
      next(e)
  }
}
async function insufficentCoins(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.params.student_id
      let data ={
        title:"Not Enough DN Cash",
        sub_heading:"You Need",
        cash_image:"image_url",
        cash:"50",
        button_text:"OK",
      }

      let responseData = {
                "meta": {
                  "code": 200,
                  "success": true,
                  "message": "SUCCESS!"
                },
                "data":data
              }
      res.status(responseData.meta.code).json(responseData);
  } catch (e) {
      next(e)
  }
}

async function pointsHistory(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id
      let page = 0

      let size = 10
      let points_data = await Gamification.getUserPoints(db.mysql.read,student_id,page,size)
      console.log(points_data)
      let responseData = {
                "meta": {
                  "code": 200,
                  "success": true,
                  "message": "SUCCESS!"
                },
                "data":points_data
              }
      res.status(responseData.meta.code).json(responseData);
  } catch (e) {
    console.log(e)
      next(e)
  }
}
async function dnCashInfo(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id
      let user_gamification_meta =await Gamification.getGamificationUserMeta(db.mysql.write,student_id)

      let data = {
        title:"Unused Points",
        coins_img:"img_url",
        points:user_gamification_meta[0].redeemable_points + " Points",
        convert_button_text:"Convert Kare DN cash",
        coin_explain_title:"DN Cash Kya hai ?",
        coin_explain_img:"img_url",
        coin_explain_text:"DN Cash Doubtnut ka Virtual money hai. Isse aap Doubtnut ke premium content buy kar sakte hai !",
        coin_get_title:"DN Cash Kaise milega ?  ",
        coin_get_image:"",
        point_img:"",
        point:"10",
        coin_img:"",
        coin:"5",
        coin_get_text:"For Every 10 points aapko milenge 5 DN cash \n DN Cash ko claim karne ke liye aapke screen pe dikhne wale 📦 gift box pe click kare  "
      }

      let responseData = {
                "meta": {
                  "code": 200,
                  "success": true,
                  "message": "SUCCESS!"
                },
                "data":data
              }
      res.status(responseData.meta.code).json(responseData);
  } catch (e) {
      next(e)
  }
}

async function badgeProgress(req,res,next){
  try {
      db = req.app.get('db')
      config = req.app.get('config')
      let student_id = req.user.student_id
      let badge_id = req.params.badge_id
      let badge_data = await Gamification.getBadgeDataById(db.mysql.read,badge_id)
      let badge_progress = await Gamification.getActivityCountByType(db.mysql.read,badge_data[0].requirement_type,student_id)
      let is_achieved = 0
      let fullfilled_percent = 0
      if (badge_progress[0].count >= badge_data[0].requirement) {
        is_achieved = 1
        fullfilled_percent = 100
      }else{
        fullfilled_percent = _.round((badge_progress[0].count/badge_data[0].requirement)*100)
      }
      badge_data = badge_data[0]
      //let badge_data = await Gamification.getBadges(db.mysql.write)
      let data = {
        name:badge_data.name,
        description:badge_data.description,
        nudge_description:badge_data.nudge_description,
        image_url:badge_data.image_url,
        requirements:[{
          requirement_type:badge_data.requirement_type,
          requirement:badge_data.requirement,
          fullfilled:badge_progress[0].count,
          fullfilled_percent:fullfilled_percent
        }],
      }


      let responseData = {
                "meta": {
                  "code": 200,
                  "success": true,
                  "message": "SUCCESS!"
                },
                "data":data
              }
      res.status(responseData.meta.code).json(responseData)
  } catch (e) {
      next(e)
  }
}

async function myOrders(req,res,next){
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.user.student_id
    let myorderdata = await Gamification.getMyOrderData(db.mysql.read,student_id)
    let responseData = {
              "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS!"
              },
              "data":myorderdata
            }
    res.status(responseData.meta.code).json(responseData)
  } catch (e) {
    next(e)
  }
}

module.exports = { getBadge , getProfile,getDailyStreak,getPoints,leaderboard,updateDailyStreak,simulateActionSQS,sendNotification,unlockinfo,redeemStore,redeemItem,convertCoins,insufficentCoins,pointsHistory,dnCashInfo,badgeProgress,myOrders }
