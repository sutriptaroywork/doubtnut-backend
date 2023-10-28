/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-16 14:05:31
*/
"use strict";

const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const Utility = require('../../../modules/utility');
const ElasticSearch = require('../../../modules/elasticSearch');
const Student = require('../../../modules/student');
const Language = require('../../../modules/language')
const Home = require('../../../modules/home')
const Localised = require('../../../modules/language')
const Class = require('../../../modules/class')
const Notification = require('../../../modules/notifications')
const VideoView = require('../../../modules/videoView')
const Constant = require('../../../modules/constants')
const QuestionContainer = require('../../../modules/containers/question')
const QuestionRedis= require('../../../modules/redis/question')
const ChapterContainer = require('../../../modules/containers/chapter')
const LanguageContainer = require('../../../modules/containers/language')
const AppConfiguration = require('../../../modules/mysql/appConfig')
const fuzz = require("fuzzball")
const download = require('image-downloader')
const request = require("request");
const WhatsAppMessageModel = require('../../../modules/mongo/whatsapp')
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration')



const moment = require('moment')

const fs = require('fs')
const bluebird = require('bluebird')
bluebird.promisifyAll(fs);


let db, elasticSearchInstance;

let blobUrl = "https://doubtnutvideobiz.blob.core.windows.net/q-images/"

const _ = require('lodash');
let config, elasticSearchClient, blobService
const vision = require('@google-cloud/vision');
async function generateDeepLink(question_id, image_url, title, request, config , parent_id, student_id, url) {
  //console.log(post_id)
  return new Promise(async function (resolve, reject) {
    try {
      if(url != '' && url != null){
        var myJSONObject = {
          "branch_key": config.branch_key,
          "channel": student_id,
          "feature": "video",
          "campaign": "WHA_VDO",
          "data": {
            "qid": question_id,
            "sid": "WHA:"+parent_id+":"+student_id,
            "page": "DEEPLINK",
            // "ref_student_id":"WHA:"+parent_id,
            // "$og_title": title,
            "$og_image_url": image_url,
            "$ios_url": url,
            '$desktop_url': url,
            '$fallback_url' : url
          }
        };
      }else{
        var myJSONObject = {
            "branch_key": config.branch_key,
            "channel": student_id,
            "feature": "video",
            "campaign": "WHA_VDO",
            "data": {
              "qid": question_id,
              "sid": "WHA:"+parent_id+":"+student_id,
              "page": "DEEPLINK",
              // "ref_student_id":"WHA:"+parent_id,
              // "$og_title": title,
              "$og_image_url": image_url
            }
          };
      }

      console.log(myJSONObject)
      request({
        url: "https://api.branch.io/v1/url",
        method: "POST",
        json: true,   // <--Very important!!!
        body: myJSONObject
      }, function (error, response, body) {
        if (error) {
          // console.log(error);//uncomment this
        } else {
          console.log(body);//comment this
          return resolve(body)
        }
      });
    } catch (e) {
      console.log(e)
      return reject(e)
    }
  })
}

async function whatsAppLogs(req,res,next){
  try{

    let wha = new WhatsAppMessageModel({phone: req.body.phone,data: JSON.parse(req.body.data)});
      let result = await wha.save()
      console.log()

      console.log(result)
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        }
      }
      res.status(responseData.meta.code).json(responseData);
  }catch(e){
    next(e)
  }
}
async function optInOne(req,res,next){
  try{
    let msisdn = req.body.msisdn
    let extension = 9540888881
    let causeId = ''
    let hasUserHungUp = false
    let timestamp = moment().unix()
    let carrier = ''
    let location = ''
    await Utility.OptIn(msisdn,extension,causeId,hasUserHungUp,timestamp,carrier,location).then(res=>{
      console.log(res)
    }).catch(err=>{
      console.log(err);
    })


    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      }
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e)
  {
    next(e)
  }


}
async function optInTwo(req,res,next){
  try{
    let msisdn = req.body.msisdn
    let extension = 9540888882
    let causeId = req.body.causeId
    let hasUserHungUp = false
    let timestamp = moment().unix()
    let carrier = req.body.carrier
    let location = req.body.location
    await Utility.OptIn(msisdn,extension,causeId,hasUserHungUp,timestamp,carrier,location).then(res=>{
      console.log(res)
    }).catch(err=>{
      console.log(err);
    })


    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      }
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e)
  {
    next(e)
  }

}
async function optInThree(req,res,next){
  try{
    let msisdn = req.body.msisdn
    let extension = 9540888883
    let causeId = ''
    let hasUserHungUp = false
    let timestamp = moment().unix()
    let carrier = ''
    let location = ''
    await Utility.OptIn(msisdn,extension,causeId,hasUserHungUp,timestamp,carrier,location).then(res=>{
      console.log(res)
    }).catch(err=>{
      console.log(err);
    })


    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS"
      }
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e)
  {
    next(e)
  }

}

async function askWhatsApp(req,res,next){
  try{
    config = req.app.get('config')
    console.log('-config---', config)
    await Utility.sendWhatsAppMessage(req.body.phone,"Count to 3...2..1",config).then(result => {
      console.log(result)
    }).catch(error => {
      console.log(error)
    })
    let translate2 = req.app.get('translate2')
    elasticSearchClient = req.app.get('client')
    elasticSearchInstance = req.app.get('elasticSearchInstance');
    blobService = req.app.get('blobService')
    let publicPath = req.app.get('publicPath')
    db = req.app.get('db')
    let s3 = req.app.get('s3')
    let question_text = req.body.question_text
    let student_id = req.body.student_id
    let ques = ""
    let student_class = 20
    let question_image = req.body.question_image
    let st_lang_code, qid, insertedQuestion = {},filedToUpdate = {},promises = []
    let matches_array, languages_arrays, languages_obj,ocr_text
    var handwritten = 0;
    student_id = (student_id) ? parseInt(student_id) : 0;
    let subject = "Mathematics";
    let locale = 'en';
    insertedQuestion["student_id"] = student_id
    insertedQuestion["class"] = student_class
    insertedQuestion["subject"] = subject
    insertedQuestion["book"] = subject
    insertedQuestion["chapter"] = "DEFAULT"
    insertedQuestion["question"] = ques
    insertedQuestion["doubt"] = "WHATSAPP"
    insertedQuestion["locale"] = locale
    promises.push(Question.addQuestion(insertedQuestion, db.mysql.write))
    promises.push(AppConfigurationContainer.getConfigByKeyAndClass(db,'apply_string_diff' , student_class))

    let resolvedPromises = await Promise.all(promises)
    //

    promises = []
    let insertQuestionResult = resolvedPromises[0]
    let isStringDiffActive = resolvedPromises[1][0]['key_value']
    qid = insertQuestionResult['insertId']
    if (qid) {
      //check for image
      console.log(question_text)
      if (_.isNull(question_text)) {

        let extension = ".png",content_type

        // let destination = "/home/gaurang/doubtnut_backend/api_server/public/uploads";
        let destination = publicPath + "/uploads";
        const options = {
          url: question_image,
          // dest: "../../doubtnut_backSend/api_server/public/uploads"
          dest: destination
        }

        const { filename, image } = await download.image(options)
        console.log("filename", filename)
        if (filename.indexOf("png") !== -1){
          extension = ".png"
          content_type = "image/png"
        }
        else if (filename.indexOf("jpg") !== -1 || filename.indexOf("jpeg") !== -1) {
          extension = ".jpg"
          content_type = "image/jpg"
        }else{
          extension = ".png"
          content_type = "image/png"
        }
        const fileName = "upload_"+qid+"_"+ moment().unix() + extension;
        filedToUpdate['question_image'] = fileName
        let data = await fs.readFileAsync(filename)
        await Utility.uploadTos3(s3, config.aws_bucket, fileName, data, content_type)
        console.log('saved')
        let transLateApiResp, latex, ocr, latexToAscii, text, ocr2;
        let host = req.protocol + "://" + req.headers.host
        latex = await Utility.mathpixOcr2(host, fileName, config);
        console.log("latex", latex)
        if((typeof latex["detection_map"] !== 'undefined') && (typeof latex["detection_map"]["is_printed"] !== 'undefined') && (latex["detection_map"]["is_printed"] < 0.8) ){
          handwritten = 1
        }
        if((typeof latex.asciimath !== 'undefined') && (latex.asciimath.length > 0)){
          ocr = latex.asciimath
        }else{
          console.log("vision")
          let path = "https://d10lpgp6xz60nq.cloudfront.net/images/" + fileName;
          let visionApiResp = await Utility.visionApi(path)
          if (visionApiResp[0]['fullTextAnnotation'] !== null) {
            ocr = visionApiResp[0]['textAnnotations'][0]['description']
            console.log('ocr -<>>>---', ocr)
            locale = visionApiResp[0]['textAnnotations'][0]['locale']
          } else {
            ocr = ""
          }
          if (locale !== "en" && locale !== 'es' && locale !== 'gl' && locale !== 'ca' && locale !== 'cy' && locale !== 'it' && locale !== 'gd' && locale !== 'sv' && locale !== 'da' && locale !== 'ro' && locale !== 'fil' && locale !== 'mt' && locale !== 'pt-PT') {
            if (ocr !== "") {
              transLateApiResp = await Utility.translateApi2(ocr,translate2)
              if(transLateApiResp.length > 0 && transLateApiResp[1]['data'] !== undefined  && transLateApiResp[1]['data']['translations'] !== undefined &&  transLateApiResp[1]['data']['translations'][0]['translatedText'] !== undefined ){
                ocr = transLateApiResp[1]['data']['translations'][0]['translatedText']
                // console.log('ocr -<>-------',ocr)
              }
            }
          }

        }
        // ocr = Utility.replaceSpecialSymbol2(ocr)
        console.log("ocr", ocr)
        filedToUpdate["ocr_done"] = 1
        filedToUpdate["ocr_text"] = ocr
        filedToUpdate["original_ocr_text"] = ocr
        filedToUpdate["locale"] = locale
        promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
        promises.push(elasticSearchInstance.findByOcr(ocr));
        ocr_text = ocr
      }else if(!_.isNull(question_text) && question_text.length > 0){
          question_text = Utility.replaceSpecialSymbol(question_text)
          filedToUpdate["ocr_done"] = 1
          filedToUpdate["ocr_text"] = question_text
          filedToUpdate["original_ocr_text"] = question_text
          filedToUpdate["locale"] = locale
          promises.push(Question.updateQuestion(filedToUpdate, qid, db.mysql.write))
          promises.push(elasticSearchInstance.findByOcr(question_text));
          ocr_text = question_text
          console.log("ocr_text------>", ocr_text)
      }
    console.log("ocr_text------>", ocr_text)
    let resolvedPromises = await Promise.all(promises)
    // console.log('resolved promisessssssss----',resolvedPromises[1]['hits']['hits'])
    if (resolvedPromises[1]['hits']['hits'].length > 0) {
      let question, question_id, urlArray=[]
      matches_array = resolvedPromises[1]['hits']['hits'];
      // console.log('matches_array----',matches_array)
      if(isStringDiffActive == 1){
        matches_array = Utility.stringDiffImplement(matches_array,ocr_text,fuzz)
      }
      await Utility.sendWhatsAppMessage(req.body.phone,"Ye raha aapka video solution ", config).then(result => {
        console.log(result)
      }).catch(error => {
        console.log(error)
      })
      for(let i=0;i<5;i++) {

        let question = await QuestionContainer.getByQuestionIdWithUrl(matches_array[i]['_id'], db)
        console.log('====>',question)
        if (question.length > 0) {
          if (question[0]['matched_question'] == null) {
            question_id = question[0]['question_id']
          } else {
            question_id = question[0]['matched_question']
          }
          let ocr_text = question[0]['ocr_text']
          let web_url = ''
          if(question[0]['url_text'] != null){
            if(question[0]['subject'].toLowerCase().includes('physics')){
              web_url = 'http://localhost:4000/question-answer-physics/'+question[0]['url_text']+"-"+question[0]['question_id']
            }else if(question[0]['subject'].toLowerCase().includes('chemistry')){
              web_url = 'http://localhost:4000/question-answer-chemistry/'+question[0]['url_text']+"-"+question[0]['question_id']
            }else {
              web_url = 'http://localhost:4000/question-answer/'+question[0]['url_text']+"-"+question[0]['question_id']
            }
          }
          console.log("ocr_text------>", ocr_text)
          let thumbnail = config.staticCDN + "thumbnail_white/" + question_id + ".png"
          if (question.length > 0) {
            let url = await generateDeepLink(question[0]['question_id'], thumbnail, ocr_text, request, config, qid, student_id, web_url)
            // console.log('urllll',url.url)
            let obj = {}
            obj.thumbnail = thumbnail
            obj.url = url.url

            urlArray.push(obj)
          }
        }
      }


      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": urlArray,
        "error": null
      }
      res.status(responseData.meta.code).json(responseData);
    }else{
      let responseData = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": [],
        "error": null
      }
      res.status(responseData.meta.code).json(responseData);
    }
  }else{
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error in inserting question;Please check parameters"
      },
      "data": null,
      "error": null
    }
    res.status(responseData.meta.code).json(responseData);

  }
} catch (e) {
  console.log('-->',e)
  await Utility.sendWhatsAppMessage(req.body.phone,"oh no! :(Lagta hai server ki lagg gyi hai Aap gussa mat hona, hum ise turant thik kar denge.")
  next(e)

}

}











module.exports = {askWhatsApp, whatsAppLogs,optInOne,optInTwo,optInThree,};
