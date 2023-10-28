"use strict";
const Question = require('../../../modules/question')
const DppContainer = require('../../../modules/containers/dailyPractiseProblems')
const QuestionContainer = require('../../../modules/containers/question')
const ChapterContainer = require('../../../modules/containers/chapter')
const PlaylistContainer = require('../../../modules/containers/playlist')
const HomepageContainer = require('../../../modules/containers/homepage')
const AppBannerContainer = require('../../../modules/containers/appBanner')
const AppConstants = require('../../../modules/appConstants')
const Student = require('../../../modules/student')
const TestSeriesContainer = require('../../../modules/containers/testseries')
const QuizContainer = require('../../../modules/containers/quiz')
const DailyContestContainer = require('../../../modules/containers/dailyContest')
const PdfContainer = require('../../../modules/containers/pdf')
const FeedContainer = require('../../../modules/containers/feed')
const redisQuestionContainer = require("../../../modules/redis/question")
const TestSeries = require('../../../modules/mysql/testseries')
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions')
const AnswerRedis = require('../../../modules/redis/answer')
const appConfigConatiner = require('../../../modules/containers/appConfig')
const contentUnlockContainer = require('../../../modules/containers/contentunlock')
const libraryContainer = require('../../../modules/containers/library')
const _ = require('lodash')
const utility=require('../../../modules/utility')
const moment = require('moment');
module.exports = {
  getHomepage: getHomepage
}

async function getHomepage(data,config, db,elasticSearchInstance) {
  let promiseResolve, promiseReject;
  let masterPromise = new Promise(function (resolve, reject) {
    promiseResolve = resolve;
    promiseReject = reject;
  });
  //first try to get from redis
  // return new Promise(async function (resolve, reject) {
    // Do async job
    try {
        let caraouselOrder = await HomepageContainer.getCaraousel(data['student_class'], data['caraousel_limit'], data['page'], data['version_code'], db)

        let promise = generatePromises(caraouselOrder,data,db,elasticSearchInstance)
        let output = await Promise.all(promise)
    

        let result = []
        for (let i = 0; i < output.length; i++) {
          if (output[i].length > 0) {

            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type !== 'SUPER_SERIES' && caraouselOrder[i].type !== 'JEE MAINS 2019 - APRIL' ) {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {}
              let temp={}
              if((data['student_class']=='6' || data['student_class']=='7' || data['student_class']=='8' || data['student_class']=='9') && caraouselOrder[i].type==="NCERT_SOLUTIONS" || caraouselOrder[i].type==="CUTOFF_LIST")
              {
                temp.action_activity="downloadpdf_level_two"
                temp.action_data = {"pdf_package": output[i][0].package,"level_one":output[i][0].level1}
              }
              else{
                temp.action_activity="downloadpdf_level_one"
              temp.action_data = {"pdf_package": output[i][0].package}
              }
              if (output[i][0].package !== null && output[i][0].level1 !== null) {
                caraouselOrder[i].view_more_params = temp
              }
              if(data['student_class']=='14' && typeof caraouselOrder[i].data_type !== 'undefined' &&  caraouselOrder[i].type==="NCERT_SOLUTIONS"){
                for (let j = 0; j < output[i].length; j++) {
                  output[i][j].action_data={'pdf_package':output[i][j].package,"level_one":output[i][j].title}
              }
              }
              else{
                for (let j = 0; j < output[i].length; j++) {
                let url = config.staticCDN + "pdf_download/" + output[i][j].location
                output[i][j].action_data = {"pdf_url": url}
              }
              }
            }

            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' &&  caraouselOrder[i].type === 'SUPER_SERIES') {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {"action_activity": "downloadpdf", "action_data": null}

              for (let j = 0; j < output[i].length; j++) {
                output[i][j].action_activity = "downloadpdf_level_one"
                output[i][j].action_data = {"pdf_package": output[i][j].package}
              }
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' &&  caraouselOrder[i].type === 'JEE MAINS 2019 - APRIL') {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {"action_activity": "downloadpdf_level_one", "action_data": {"pdf_package":output[i][0].package}}

              for (let j = 0; j < output[i].length; j++) {
                output[i][j].action_activity = "downloadpdf_level_two"
                output[i][j].action_data = {"pdf_package": output[i][j].package,"level_one":output[i][j].level1}
              }
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' &&  caraouselOrder[i].type === 'NEET 2019 SOLUTIONS') {
              //caraouselOrder[i].view_all = 1
              //caraouselOrder[i].view_more_params = {"action_activity": "downloadpdf_level_one", "action_data": {"pdf_package":output[i][0].package}}

              for (let j = 0; j < output[i].length; j++) {
                output[i][j].action_activity = "pdf_viewer"
                //output[i][j].action_data = {"pdf_package": output[i][j].location}
              }
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' &&  caraouselOrder[i].type === 'MOCK TEST') {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {"action_activity": "downloadpdf_level_one", "action_data": {"pdf_package":output[i][0].package}}

              for (let j = 0; j < output[i].length; j++) {
                output[i][j].action_activity = "downloadpdf_level_two"
                output[i][j].action_data = {"pdf_package": output[i][j].package,"level_one":output[i][j].level1}
              }
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'ncert') {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {"class": data['student_class'], "playlist_id":caraouselOrder[i].mapped_playlist_id,"playlist_title":caraouselOrder[i].title} //chapter will go
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'topic') {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {"playlist_id": caraouselOrder[i].mapped_playlist_id,"is_last":0,"playlist_title":caraouselOrder[i].title}
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'photo') {
              caraouselOrder[i].view_all = 0
              let date = moment().subtract(1, 'days').format('MMMM DD').toString()
              caraouselOrder[i].title = caraouselOrder[i].title + " " + date
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'contest') {
              caraouselOrder[i].view_all = 1
              caraouselOrder[i].view_more_params = {}
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'quiz') {
              caraouselOrder[i].view_all = 0
              caraouselOrder[i].view_more_params = {}
              let arrUrl=utility.shuffle([config.staticCDN+'images/daily_quiz1.png'])
              for (let j = 0; j < output[i].length; j++) {
                output[i][j].image_url=arrUrl[j]
              }
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'video' || caraouselOrder[i].data_type === 'library_video') {
                    caraouselOrder[i].view_all = 1
                    caraouselOrder[i].view_more_params = { "playlist_id": caraouselOrder[i].mapped_playlist_id }
                    if(caraouselOrder[i].data_type === 'library_video'){
                        let gradient = _.sample(data['color'])
                        caraouselOrder[i].data_type='video'
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].id=output[i][j].question_id
                            output[i][j].page="HOME_FEED"
                            output[i][j].start_gradient=gradient[0]
                            output[i][j].mid_gradient=gradient[1]
                            output[i][j].end_gradient=gradient[2]
                            output[i][j].type=caraouselOrder[i].data_type
                            output[i][j].description=''
                            output[i][j].title=output[i][j].ocr_text
                            output[i][j].capsule_text=data['capsule'][0]
                            output[i][j].capsule_bg_color=data['capsule'][1]
                            output[i][j].capsule_text_color=data['capsule'][2]
                            output[i][j].duration_text_color=data['duration'][0]
                            output[i][j].duration_bg_color=data['duration'][1]
                            output[i][j].playlist_id = caraouselOrder[i].type
                            output[i][j].views = null
                        }
                    }else{
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].playlist_id = caraouselOrder[i].type
                            output[i][j].views = null
                        }
                    }
                    if(caraouselOrder[i].type=='TRICKY_QUESTION'){
                        output[i] = await QuestionContainer.getTotalViewsMulti(db, output[i])
                        caraouselOrder[i].view_all = 0
                      }
                    output[i] = _.shuffle(output[i])
                }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'banner') {
              caraouselOrder[i].view_all = 0
              for (let j = 0; j < output[i].length; j++) {
                if (output[i][j].action_data !== null) {
                  // //console.log(output[i][j].action_data)
                  if(typeof output[i][j].action_data !== 'undefined'){
                    output[i][j].action_data = JSON.parse(output[i][j].action_data)
                  }
                }
              }
            }
            if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'card' && caraouselOrder[i].type === 'WHATSAPP_ASK') {
              caraouselOrder[i].view_all = 0
              let mystring=JSON.parse(output[i][0].key_value)
              console.log(mystring)
              output[i][0].key_value=JSON.parse(output[i][0].key_value)
              output[i][0].image_url=mystring.image_url
              output[i][0].description=mystring.description
              output[i][0].button_text=mystring.button_text
              output[i][0].button_bg_color=mystring.button_bg_color
              output[i][0].action_activity=mystring.action_activity
              output[i][0].action_data=mystring.action_data
              output[i][0].type='card'
              delete output[i][0].key_value
            }
            caraouselOrder[i].list = output[i]
            result.push(caraouselOrder[i])
          }else if(i=== 0){

            if(caraouselOrder[i].type == 'SFY'){
              caraouselOrder[i].view_all = 0
              caraouselOrder[i].view_more_params = {"playlist_id":caraouselOrder[i].type}
              if(output[i]['hits']['hits'].length > 0){
                let output1=await QuestionContainer.getQuestionsData(db,output[i]['hits']['hits'].slice(0,6))
                let list = []
                for(let k=0;k<output1.length;k++){
                  if(output1[k]['_id'] !== data['question_id']) {
                    let c = utility.shuffle(data.color)
                    let unlockStatus=await contentUnlockContainer.getUnlockStatus(db,data['student_id'],"PC")
                    let is_locked=0
                    // if(unlockStatus!==0){
                    //   is_locked=0
                    // }else{
                    //   if(output[i]['hits']['hits'][k]['_source']['subject'] && output[i]['hits']['hits'][k]['_source']['subject']!='MATHS')
                    //   {
                    //     is_locked=1
                    //   }else{
                    //     is_locked=0
                    //   }
                    // }
                    let i_url = `${config.staticCDN}q-thumbnail/` + output1[k]['_id'] + ".png"
                    let o = {
                      "id": output1[k]['_id'],
                      "type": "video",
                      "image_url": i_url,
                      "subject":output1[k]['_source']['subject'],
                      "is_locked":is_locked,
                      "title": output1[k]['_source']['ocr_text'],
                      "resource_type":output1[k]['_source']['resource_type'],
                      "description": "",
                      "page": "HOME_FEED",
                      "playlist_id":"SFY",
                      "capsule_bg_color": "#ffffff",
                      "capsule_text_color": "#000000",
                      "start_gradient": c[0][0],
                      "mid_gradient": c[0][1],
                      "end_gradient": c[0][2],
                      "capsule_text": null,
                      "duration": null,
                      "duration_text_color": "#000000",
                      "duration_bg_color": "#ffffff",
                      "views": null
                    }
                    list.push(o)
                  }
                }
                caraouselOrder[i].list = list
                result.push(caraouselOrder[i])
              }
            }
          }
        }
      promiseResolve(result)
      return masterPromise
    } catch (e) {
      console.log(e)
      promiseResolve([])
      return masterPromise
    }
  // })
}

function generatePromises(caraouselOrder,data,db,elasticSearchInstance){
  let promise = []
  for (let i = 0; i < caraouselOrder.length; i++) {
    //console.log(caraouselOrder[i].type);
    if (caraouselOrder[i].type === 'DPP') {
      let gradient = _.sample(data['color'])
      promise.push(DppContainer.getDPPVideoTypeWithTextSolutions(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'][2], data['capsule'][1], data['student_id'], data['student_class'], caraouselOrder[i].data_limit, data['duration'][0], data['duration'][1], db))
    }
    else if(caraouselOrder[i].data_type === 'topic'){
      let gradient = _.sample(data['color'])
      promise.push(libraryContainer.getPlaylistHomepage(caraouselOrder[i].mapped_playlist_id,caraouselOrder[i].type,gradient,caraouselOrder[i].data_type,data['page_param'],data['capsule'][2], data['capsule'][1],caraouselOrder[i].data_limit, data['student_class'],data['duration'][0], data['duration'][1],db))
    }
    else if (caraouselOrder[i].data_type === 'topic_parent'){
      promise.push([]);
    }
    else if(caraouselOrder[i].type ==="WHATSAPP_ASK"){
      promise.push(appConfigConatiner.getWhatsappData(db,data['student_class']))
    }
    else if (caraouselOrder[i].type === 'CRASH_COURSE') {
      let gradient = _.sample(data['color'])
      promise.push(QuestionContainer.getCrashCourseDataWithTextSolutions(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], caraouselOrder[i].data_limit, data['student_class'], data['duration'], db))
    }
    else if (caraouselOrder[i].type === 'LATEST_FROM_DOUBTNUT') {
      let gradient = _.sample(data['color'])
      promise.push(QuestionContainer.getLatestFromDoubtnutDataWithTextSolutions(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], data['student_class'], caraouselOrder[i].data_limit, data['duration'], db))
    }
    else if (caraouselOrder[i].type === 'TRICKY_QUESTION') {
      let gradient = _.sample(data['color'])
      promise.push(QuestionContainer.getTrickyQuestionsSolutions(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], data['student_class'], caraouselOrder[i].data_limit, data['duration'],data['week_no'],data['subjectUrl'], db))
    }
    else if (caraouselOrder[i].data_type === 'library_video') {
        let gradient = _.sample(data['color'])
        promise.push(QuestionContainer.getLibraryVideos(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], data['student_class'], data['student_id'], caraouselOrder[i].mapped_playlist_id, data['language'], caraouselOrder[i].data_limit, data['duration'], db))
    }
    else if (caraouselOrder[i].type === 'TRENDING') {
      let gradient = _.sample(data['color'])
      promise.push(QuestionContainer.getTrendingVideoDataWithTextSolutions(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], data['student_class'], caraouselOrder[i].data_limit, data['duration'], db))
    }
    else if (caraouselOrder[i].type === 'VIRAL') {
      let gradient = _.sample(data['color'])
      promise.push(QuestionContainer.getTipsAndTricksDataWithTextSolutions(caraouselOrder[i].type, data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], data['student_class'], caraouselOrder[i].data_limit, data['duration'], db))
    }
    else if (caraouselOrder[i].type === 'NCERT_SOLUTIONS' && caraouselOrder[i].data_type === 'ncert') {
      let gradient = _.sample(data['color'])
      promise.push(PlaylistContainer.getNCERTDataNewLibraryWithPCM(caraouselOrder[i].type, gradient, caraouselOrder[i].data_type, data['description'], "", data['capsule'], data['student_class'], caraouselOrder[i].data_limit, data['language'],caraouselOrder[i].mapped_playlist_id, db))
    }
    else if (caraouselOrder[i].type === 'GK') {
      let gradient = _.sample(data['color'])
      promise.push(QuestionContainer.getGeneralKnowledgeData(data['base_url'], gradient, caraouselOrder[i].data_type, data['description'], data['page_param'], data['capsule'], data['student_class'], caraouselOrder[i].data_limit, data['duration'], db))
    }
    else if (caraouselOrder[i].type === 'DAILY_QUIZ') {
      promise.push(getDailyQuizData(caraouselOrder[i].type,data['student_id'], data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'DAILY_CONTEST') {
      promise.push(DailyContestContainer.getDailyContestData(caraouselOrder[i].type, caraouselOrder[i].data_type, data['button'], caraouselOrder[i].data_limit, data['student_class'], db))
    }
    else if (caraouselOrder[i].type === 'APP_BANNER') {
      if (caraouselOrder[i].scroll_size === '1x') {
        promise.push(AppBannerContainer.getAppBanner1xDataNew(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data['button'], data['subtitle'], data['description'], caraouselOrder[i].data_limit, data['student_class'],data['version_code'], db))
      }
      else if (caraouselOrder[i].scroll_size === '1.5x') {
        promise.push(AppBannerContainer.getAppBanner15xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data['button'], data['subtitle'], data['description'], caraouselOrder[i].data_limit, data['student_class'], db))
      }
      else if (caraouselOrder[i].scroll_size === '2.5x') {
        promise.push(AppBannerContainer.getAppBanner25xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data['button'], data['subtitle'], data['description'], caraouselOrder[i].data_limit, data['student_class'], db))
      }
    }
    else if (caraouselOrder[i].type === 'QUIZ_WINNER') {
      let page = 1
      promise.push(FeedContainer.getQuizWinner(caraouselOrder[i].type, caraouselOrder[i].data_type, page, data['button'], caraouselOrder[i].data_limit, data['student_class'], db))
    }
    else if (caraouselOrder[i].type === 'CONTEST_WINNER') {
      // promise.push(FeedContainer.getContestWinner(caraouselOrder[i].data_type,page,button_text,button_text_color, button_bg_color,caraouselOrder[i].data_limit,db))
      promise.push([])
    }
    else if (caraouselOrder[i].type === 'SUPER_SERIES') {
      promise.push(PdfContainer.getSuperSeriesData(caraouselOrder[i].type, data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'JEE MAINS 2019 - APRIL') {
      promise.push(PdfContainer.getJeeMains2019AprilData(caraouselOrder[i].type, data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'NEET 2019 SOLUTIONS') {
      promise.push(PdfContainer.getNeet2019AprilData(caraouselOrder[i].type, data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'MOCK TEST') {
      promise.push(PdfContainer.getMockTestData(caraouselOrder[i].type, data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'JEE_MAINS_PY') {
      promise.push(PdfContainer.getJeeMainsPrevYearData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'JEE_ADV_PY') {
      promise.push(PdfContainer.getJeeAdvPrevYearData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'FORMULA_SHEET') {
      promise.push(PdfContainer.getFormulaSheetData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'CUTOFF_LIST') {
      promise.push(PdfContainer.getCutOffListData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === '12_BOARDS_PY') {
      promise.push(PdfContainer.get12PrevYearData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
    }
    else if (caraouselOrder[i].type === 'SAMPLE_PAPERS') {
      if (data['student_class'] === '12' || data['student_class'] === '11') {
        promise.push(PdfContainer.get12SamplePaperData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
      }
      else {
        promise.push(PdfContainer.get10SamplePaperData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
      }
    }
    else if (caraouselOrder[i].type === 'MOST_IMPORTANT_QUESTIONS') {
      if (data['student_class'] === '12' || data['student_class'] === '11') {
        promise.push(PdfContainer.get12MostImportantQuestionData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, data['student_class'], caraouselOrder[i].data_limit, db))
      }
      else {
        promise.push(PdfContainer.get10MostImportantQuestionData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
      }
    }
    else if (caraouselOrder[i].type === 'IBPS_CLERK_SPECIAL') {
      promise.push(PdfContainer.getIBPSClerkSpecialData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
    }
    else if (caraouselOrder[i].type === 'NCERT_SOLUTIONS' && caraouselOrder[i].data_type === 'pdf') {
      promise.push(PdfContainer.getNcertSolutionsPdfData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
    }
    else if (caraouselOrder[i].type === 'CONCEPT_BOOSTER') {
      promise.push(PdfContainer.getConceptBoosterPdfData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
    }
    else if (caraouselOrder[i].type === '9_FOUNDATION_COURSE') {
      promise.push(PdfContainer.getClass9FoundationCourseData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
    }
    else if (caraouselOrder[i].type === '10_BOARDS_PY') {
      promise.push(PdfContainer.get10BoardPrevYearData(caraouselOrder[i].type, data['action_activity'], data['description'], caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data['student_class'], db))
    }else if (caraouselOrder[i].type === 'SFY') {
      if(data['ocr']===null)
      {
        data['ocr']=""
      }
      promise.push(elasticSearchInstance.findByOcrUsingIndexNew(data['ocr'],"doubtnut_new_physics_chemistry_maths_v4"))
    }
  }
  return promise
}
function getDailyQuizData(type,student_id,student_class,limit, db) {
  return new Promise(async function (resolve, reject) {
    try {
      let promise=[]
      promise.push(TestSeriesContainer.getDailyQuizData(type,student_class,limit,db))
      promise.push(StudentTestsSubsriptions.get1StudentTestsSubsriptionsByStudentId(db.mysql.read,student_id))
      let data=await Promise.all(promise)
      let temp=testSeriesArrayResponseFormatter1(data[0],data[1])
      return resolve(temp)
    }catch (e) {
      //console.log(e)
      reject(e)
    }
  })
}
function testSeriesArrayResponseFormatter1(testdata, subscriptiondata) {
  let groupedSubData = _.groupBy(subscriptiondata, 'test_id')
  //console.log(groupedSubData)
  for (var i = testdata.length - 1; i >= 0; i--) {
    let test = testdata[i];
    testdata[i]['can_attempt'] = false;
    testdata[i]['can_attempt_prompt_message'] = "";
    testdata[i]['test_subscription_id'] = "";
    testdata[i]['in_progress'] = false;
    testdata[i]['attempt_count'] = 0;
    testdata[i]['last_grade'] = ""
    testdata[i].type = 'quiz'
    testdata[i].image_url = `${config.staticCDN}images/quiz_sample.jpeg`
    testdata[i].button_text = "Go To"
    testdata[i].button_text_color = "#000000"
    testdata[i].button_bg_color = "#ffffff"
    testdata[i].id = testdata[i].test_id.toString()
    if (groupedSubData[test['test_id']]) {
      let subData = _.groupBy(groupedSubData[test['test_id']], 'status');
      testdata[i]['subscriptiondata'] = groupedSubData[test['test_id']];
      if (subData['SUBSCRIBED']) {
        testdata[i]['can_attempt'] = true;
        testdata[i]['test_subscription_id'] = subData['SUBSCRIBED'][0]['id'];
      }
      if (subData['INPROGRESS']) {
        testdata[i]['in_progress'] = true;
        testdata[i]['test_subscription_id'] = subData['INPROGRESS'][0]['id'];
      }
      if (subData['COMPLETED']) {
        testdata[i]['attempt_count'] = subData['COMPLETED'].length
        testdata[i]['test_subscription_id'] = subData['COMPLETED'][0]['id'];
      }
    } else {
      testdata[i]['can_attempt'] = true;
      testdata[i]['subscriptiondata'] = []
    }
  }
  return testdata
}
