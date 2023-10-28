const Question = require('../../../modules/question')
const Student = require('../../../modules/student')
const Playlist = require('../../../modules/playlist')
const Home = require('../../../modules/home')
const Token = require('../../../modules/tokenAuth')
const DppContainer = require('../../../modules/containers/dailyPractiseProblems')
const LanguageContainer = require('../../../modules/containers/language')
const _ = require('lodash');
// const validator = require('validator')
// const request = require("request")
let db, config, client

async function get(req, res, next) {
  try
  {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_class = req.params.student_class;
    let student_course = req.params.student_course;
    let student_id = req.user.student_id;
    let admin_id = 98;
    // let language = "english"
    // let lang = await LanguageContainer.getByCode(req.user.locale,db)
    // //console.log("language")
    // //console.log(lang)
    // if(lang.length > 0) {  
    //   language = lang[0]['language']
    // }
      let data=[],promises=[];
      let is_subscribed = await Student.isSubscribed(student_id, db.mysql.read);
      //console.log(is_subscribed);
      if(is_subscribed.length > 0){
        is_subscribed = 1
      }else{
        is_subscribed = 0
      }
      
      promises.push(Question.checkTrendingVideos(student_class,db.mysql.read));
      promises.push(Question.checkDPP(student_id, db.mysql.read));
      promises.push(Question.checkVLS(student_class,db.mysql.read));
      promises.push(Student.checkHistory(student_id,db.mysql.read));

      let promise_result=await Promise.all(promises);
      
      //console.log("promise_result");
      //console.log(promise_result);

      if(promise_result[0].length>0){
        data.push({"title":"Trending Videos","playlist_id":"TRENDING","image_url":config.staticCDN + 'images/LIB_TRENDING.png'})
      }
      
      if(promise_result[1].length>0){
        data.push({"title":"Daily Practice Problems","playlist_id":"DPP","image_url":config.staticCDN + 'images/LIB_DPP.png'})
      }
      
      if(promise_result[2].length>0){
        data.push({"title":"Daily Lessons","playlist_id":"VLS","image_url":config.staticCDN + 'images/LIB_DAILY_LESSON.png'})
      }
      if(promise_result[3][0]['show_history'] > 0 ){
        data.push({"title":"History","playlist_id":"HISTORY","image_url":config.staticCDN + 'images/LIB_HISTORY.png'})
      }

      if(_.includes(['6', '7', '8', '9','14'], student_class.toString())){
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})        
        if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }
        
      }

      else if (student_class == '10') {
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        data.push({"title":"10 Boards","playlist_id":"BOARDS_10","image_url":config.staticCDN + 'images/LIB_10_BOARDS.png'})
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})
       if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }
      }
      
      else if (student_class == '11' && student_course == 'IIT') {
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        data.push({"title":"JEE Mains","playlist_id":"JEE_MAIN","image_url":config.staticCDN + 'images/LIB_JEE_MAINS.png'})
        data.push({"title":"JEE Advanced","playlist_id":"JEE_ADVANCE","image_url":config.staticCDN + 'images/LIB_JEE_ADVANCED.png'}) 
        data.push({"title":"12 Boards","playlist_id":"BOARDS_12","image_url":config.staticCDN + 'images/CBSE.png'})
        if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})
      }

      else if (student_class == '11' && student_course == 'NCERT') {
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        data.push({"title":"JEE Mains","playlist_id":"JEE_MAIN","image_url":config.staticCDN + 'images/LIB_JEE_MAINS.png'})
        data.push({"title":"JEE Advanced","playlist_id":"JEE_ADVANCE","image_url":config.staticCDN + 'images/LIB_JEE_ADVANCED.png'})
        data.push({"title":"12 Boards","playlist_id":"BOARDS_12","image_url":config.staticCDN + 'images/CBSE.png'})
        if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})
      }

      else if (student_class == '12' && student_course == 'NCERT') {
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        data.push({"title":"JEE Mains","playlist_id":"JEE_MAIN","image_url":config.staticCDN + 'images/LIB_JEE_MAINS.png'})
        data.push({"title":"JEE Advanced","playlist_id":"JEE_ADVANCE","image_url":config.staticCDN + 'images/LIB_JEE_ADVANCED.png'})
        data.push({"title":"12 Boards","playlist_id":"BOARDS_12","image_url":config.staticCDN + 'images/CBSE.png'})
        if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})
      }

      else if (student_class == '12' && student_course == 'IIT') {
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        data.push({"title":"JEE Mains","playlist_id":"JEE_MAIN","image_url":config.staticCDN + 'images/LIB_JEE_MAINS.png'})
        data.push({"title":"JEE Advanced","playlist_id":"JEE_ADVANCE","image_url":config.staticCDN + 'images/LIB_JEE_ADVANCED.png'})
        data.push({"title":"12 Boards","playlist_id":"BOARDS_12","image_url":config.staticCDN + 'images/CBSE.png'})
        if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})
      }

      else{
        
        data.push({"title":"Tips & Tricks","playlist_id":"VIRAL","image_url":config.staticCDN + 'images/LIB_TIPS_AND_TRICKS.png'})
        data.push({"title":"NCERT","playlist_id":"NCERT","image_url":config.staticCDN + 'images/LIB_NCERT.png'})
        if(is_subscribed){
          data.push({"title":"Your Answered","playlist_id":"SUB_ANS","image_url":config.staticCDN + 'images/LIB_YOUR_ANSWERED.png'})
          data.push({"title":"Your Unanswered","playlist_id":"SUB_UNANS","image_url":config.staticCDN + 'images/LIB_YOUR_UNANSWERED.png'})
        }

        if (student_class == 11 || student_class == 12) {
          data.push({"title":"12 Boards","playlist_id":"BOARDS_12","image_url":config.staticCDN + 'images/CBSE.png'})
          data.push({"title":"JEE Mains","playlist_id":"JEE_MAIN","image_url":config.staticCDN + 'images/LIB_JEE_MAINS.png'})
          data.push({"title":"JEE Advanced","playlist_id":"JEE_ADVANCE","image_url":config.staticCDN + 'images/LIB_JEE_ADVANCED.png'})
        }
        
        if (student_class == 10) {
          data.push({"title":"10 Boards","playlist_id":"BOARDS_10","image_url":config.staticCDN + 'images/LIB_10_BOARDS.png'})
        }
      }

      let result=await Playlist.getPlaylistByStudentIdNew(student_id,db.mysql.read);
      let result2=await Playlist.getAdminPlaylists(admin_id,student_class,student_course,db.mysql.read);
//console.log("result2222222222222")
//console.log(result2)
      if(result.length>0){
        let grouped = _.groupBy(result, 'name')
        for (let i in grouped) {
          let r = {}
          r['title'] = i
          r['playlist_id'] = grouped[i][0]['id'].toString()
          r['image_url'] = config.staticCDN + 'images/LIB_CUSTOM_PLAYLIST.png'
          grouped[i].forEach(function (v) {
            delete v.id
            delete v.name
          });
          data.push(r)
        }
      }
      if(result2.length>0){
        let grouped = _.groupBy(result2, 'name')
        for (let i in grouped) {
          let r = {}
          r['title'] = i
          r['playlist_id'] = grouped[i][0]['id'].toString()
          r['image_url'] = config.staticCDN + 'images/LIB_CUSTOM_PLAYLIST.png'
          grouped[i].forEach(function (v) {
            delete v.id
            delete v.name
          });
          // data.push(r)
          data.unshift(r)

        }
      }
      //console.log("data")
      //console.log(data)
      let responseData = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS",
          },
          "data": data
        }
        res.status(responseData.meta.code).json(responseData)
      
  }
  catch(e){
    //console.log(e);
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong(catch)",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }


}


module.exports = {get}
