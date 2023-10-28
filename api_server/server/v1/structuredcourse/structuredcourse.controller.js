"use strict";
const Utility = require('../../../modules/utility')
let StructuredCourse = require('../../../modules/mysql/structuredCourse')
const ETStructuredCourse = require('../../../modules/mysql/eStructuredCourse')
const AppBannerContainer = require('../../../modules/containers/appBanner')
const Data = require('../../../data/data');
const _ = require('lodash')
const fs = require('fs')
let db, config;

async function getTodaysData(req, res, next) {
  var dateUTC = new Date();
  var dateUTC = dateUTC.getTime()
  var dateIST = new Date(dateUTC);
  //date shifting for IST timezone (+5 hours and 30 minutes)
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  let today = dateIST

  console.log(today)
  let nowTime = new Date(today).getTime()/1000
  console.log(nowTime)

  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.user.student_id
    let student_class = req.user.student_class

    console.log(student_class)

    let id = req.params.id
    let subject = req.params.subject
    let returnRes = []
    let banner_link = ""
    let promise = []
    const { version_code } = req.headers;
    if(version_code > Data.etoos_version) {
        StructuredCourse = ETStructuredCourse;
    }
    if(id == 0)
    {
      let highestId = await StructuredCourse.getStrucredCourseDetails(db.mysql.read)
      id = highestId[0].id
      banner_link = highestId[0].banner
    }
    else
    {
      promise.push(StructuredCourse.getStrucredCourseDetailsById(id, db.mysql.read))
    }
    promise.push(StructuredCourse.getTodaysTopic(id, subject, student_class, db.mysql.read))
    promise.push(StructuredCourse.getCourseStructure(id, subject, student_class, db.mysql.read))

    let result = await Promise.all(promise)

    if(banner_link == "")
    {
      banner_link = result[0][0].banner
    }

    returnRes.push({"type" : "banner", "image_url" : banner_link})
    returnRes.push({
      "type": "filter",
      "list":[
        {"display":"Maths","value": "MATHS"},
        {"display":"Physics","value": "PHYSICS"},
        {"display":"Chemistry","value": "CHEMISTRY"}
      ]
    })

    let qList = []

    let todaysIndex, courseIndex
    if(result.length == 2)
    {
      todaysIndex = 0, courseIndex = 1
    }
    else
    {
      todaysIndex = 1, courseIndex = 2
    }

    for(let i=0; i< result[todaysIndex].length; i++)
    {
      console.log(new Date(result[todaysIndex][i].live_at).getTime()/1000)
      let statusThis = 0
      if(result[todaysIndex][i].q_order == 1)
      {
        statusThis = 1
      }
      else
      {
        let videoViewStats = await StructuredCourse.getVideoViewStats(result[todaysIndex][i].qid, student_id, db.mysql.read)
        if(nowTime < parseInt(new Date(result[todaysIndex][i].live_at).getTime()/1000)) // upcoming
        {
          statusThis = 5
        }
        else if(nowTime >= parseInt(new Date(result[todaysIndex][i].live_at).getTime()/1000) && nowTime <= (parseInt(new Date(result[todaysIndex][i].live_at).getTime()/1000) + parseInt(result[todaysIndex][i].duration))) // live now
        {
          if(videoViewStats.length > 0)
          {
            statusThis = 2
          }
          else
          {
            statusThis = 1
          }
        }
        else if(nowTime > (parseInt(new Date(result[todaysIndex][i].live_at).getTime()/1000) + parseInt(result[todaysIndex][i].duration))) // finished live video
        {
          if(videoViewStats.length > 0)
          {
            statusThis = 3
          }
          else
          {
            statusThis = 4
          }
        }
      }

      let dayTimeData = Utility.getStructuredCourseDayTime(result[todaysIndex][i].live_at)

      let typeText = "lecture"
      if(result[todaysIndex][i].q_order == 1)
      {
        typeText = "intro"
        statusThis = 1
      }
      qList.push({
        "type" : typeText,
        "status": statusThis,
        "qid": result[todaysIndex][i].qid,
        "structured_course_id" : parseInt(id),
        "structured_course_details_id" : result[todaysIndex][i].structured_course_details_id,
        "subject" : result[todaysIndex][i].subject,
        "video_url": result[todaysIndex][i].video_url,
        "youtube_id" : result[todaysIndex][i].youtube_id,
        "image_url": result[todaysIndex][i].image_url,
        "duration": result[todaysIndex][i].duration,
        "live_at": result[todaysIndex][i].live_at,
        "day_text" : dayTimeData.day,
        "time_text" : dayTimeData.time
      })
    }

    returnRes.push({
      "type": "todays_topic",
      "title": "Today's Topic",
      "list": qList
    })

    let qList2 = []
    let count = 0
    for(let k=0; k<result[courseIndex].length; k++)
    {
        let courseStructureQuestions = await StructuredCourse.getCourseStructureDetails(id, subject, result[courseIndex][k].id, db.mysql.read)

        let statusThis = 0
        let totalDuration = 0
        let upcoming = 0
        let completed = 0
        let completedWatched = 0
        let finishedAll = 0
        let finishedAllWatched = 0

        let mockStatus = 0, mockText, mockTotalQuestions, mockDuration, mockFlag = 0, mockTestId, mockRuleId, lectureCount = 0

        for(let j=0; j<courseStructureQuestions.length; j++)
        {
          if(courseStructureQuestions[j].resource_type == 0 && courseStructureQuestions[j].q_order != 1)
          {
            lectureCount++
            totalDuration += parseInt(courseStructureQuestions[j].duration)
            let videoViewStats = await StructuredCourse.getVideoViewStats(courseStructureQuestions[j].qid, student_id, db.mysql.read)

            if(nowTime < parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000)) // upcoming
            {
              upcoming++;
            }
            else if(nowTime >= parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000) && nowTime <= (parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000) + parseInt(courseStructureQuestions[j].duration))) // live now
            {
              if(videoViewStats.length > 0)
              {
                completedWatched++
              }
              else
              {
                completed++
              }
            }
            else if(nowTime > (parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000) + parseInt(courseStructureQuestions[j].duration))) // finished live video
            {
              if(videoViewStats.length > 0)
              {
                finishedAllWatched++
              }
              else
              {
                finishedAll++
              }
            }
          }
          else if(courseStructureQuestions[j].resource_type == 3)
          {
            mockFlag = 1
            let mockTestDetails = await StructuredCourse.getMockTestDetails(courseStructureQuestions[j].resource_reference, student_id, db.mysql.read)
            mockTotalQuestions = mockTestDetails[0].no_of_questions
            mockDuration = parseInt(mockTestDetails[0].duration_in_min)*60

            if(nowTime < parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000)) // upcoming
            {
              mockStatus = 5;
            }
            else if(nowTime >= parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000) && nowTime <= (parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000) + parseInt(courseStructureQuestions[j].duration))) // live now
            {
              if(mockTestDetails[0].status != undefined)
              {
                if(mockTestDetails[0].status == "SUBSCRIBED")
                {
                  mockStatus = 2
                }
                else if(mockTestDetails[0].status == "COMPLETED")
                {
                  mockStatus = 1
                }
              }
              else
              {
                mockStatus = 2
              }
            }
            else if(nowTime > (parseInt(new Date(courseStructureQuestions[j].live_at).getTime()/1000) + parseInt(courseStructureQuestions[j].duration))) // finished live video
            {
              if(mockTestDetails[0].status != undefined)
              {
                if(mockTestDetails[0].status == "SUBSCRIBED")
                {
                  mockStatus = 4
                }
                else if(mockTestDetails[0].status == "COMPLETED")
                {
                  mockStatus = 3
                }
              }
              else
              {
                mockStatus = 4
              }
            }
            mockText = courseStructureQuestions[j].topic
            mockTestId = courseStructureQuestions[j].resource_reference
            mockRuleId = mockTestDetails[0].rule_id
          }
        }

        let dayTimeData = Utility.getStructuredCourseDayTime(result[courseIndex][k].live_at)

        if(upcoming != 0)
        {
          statusThis = 7
        }
        else if(upcoming == 0 && (completed != 0 || completedWatched != 0))
        {
          if(completed == courseStructureQuestions.length)
          {
            statusThis = 1
          }
          else if(completedWatched == courseStructureQuestions.length)
          {
            statusThis = 3
          }
          else
          {
            statusThis = 2
          }
        }
        else if(upcoming == 0 && completed == 0 && completedWatched == 0 && (finishedAll != 0 || finishedAllWatched != 0))
        {
          if(finishedAll == courseStructureQuestions.length)
          {
            statusThis = 4
          }
          else if(finishedAllWatched == courseStructureQuestions.length)
          {
            statusThis = 5
          }
          else
          {
            statusThis = 6
          }
        }

        count++

        if(lectureCount > 0)
        {
          qList2.push({
            "type" : "lecture",
            "day" : count,
            "course_id" : result[courseIndex][k].structured_course_id,
            "course_details_id" : result[courseIndex][k].id,
            "text" : result[courseIndex][k].chapter,
            "status" : statusThis,
            "duration": totalDuration,
            "live_at": result[courseIndex][k].live_at,
            "day_text" : dayTimeData.day,
            "time_text" : dayTimeData.time
          })
        }
        if(mockFlag == 1)
        {
          qList2.push({
            "type" : "mock-test",
            "mock_test_id" : mockTestId,
            "rule_id" : mockRuleId,
            "text" : mockText,
            "total_questions" : mockTotalQuestions,
            "status" : mockStatus,
            "duration": mockDuration,
            "live_at": result[courseIndex][k].live_at,
            "day_text" : dayTimeData.day,
            "time_text" : dayTimeData.time
          })
        }
    }

    returnRes.push({
      "type": "course_structure",
      "title": "Course Structure",
      "list": qList2
    })

    let responseData = {
      "meta": {
        "code": 200,
        "message": "success"
      },
      "data": returnRes
    }
    return res.status(responseData.meta.code).json(responseData);
  }catch (e) {
    next(e)
  }
}

async function getCourseDetails(req, res, next) {

  var dateUTC = new Date();
  var dateUTC = dateUTC.getTime()
  var dateIST = new Date(dateUTC);
  //date shifting for IST timezone (+5 hours and 30 minutes)
  dateIST.setHours(dateIST.getHours() + 5);
  dateIST.setMinutes(dateIST.getMinutes() + 30);
  let today = dateIST
  let nowTime = new Date(today).getTime()/1000
  let version_code = req.headers.version_code

  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.user.student_id
    let student_class = req.user.student_class

    let course_id = req.params.course_id
    let details_id = req.params.details_id

    let promise = []
    const { version_code } = req.headers;
    if(version_code > Data.etoos_version) {
        StructuredCourse = ETStructuredCourse;
    }
    promise.push(StructuredCourse.getCoursePdfByIds(course_id, details_id, student_class, db.mysql.read))
    promise.push(StructuredCourse.getCourseDetailsByIds(course_id, details_id, db.mysql.read))
    promise.push(StructuredCourse.getCourseDetailsByDetailId(details_id, db.mysql.read))
    promise.push(StructuredCourse.getStrucredCourseDetailsById(course_id, db.mysql.read))
    promise.push(AppBannerContainer.getPromotionalData(db, student_class, "STRUCTURED_COURSE", version_code))

    let result = await Promise.all(promise)

    let thirdScreenBannerLink = result[3][0].third_screen_banner
    let thirdScreenBannerPosition = result[3][0].third_screen_banner_position

    let pdfList = []

    for(let j=0; j<result[0].length; j++)
    {
      if(result[0][j].resource_type == 1)
      {
        pdfList.push({
          "name" : "Notes",
          "image" : `${config.staticCDN}images/notes-pdf-icon.png`,
          "pdf_link" : result[0][j].resource_reference
        })
      }
      else if(result[0][j].resource_type == 2)
      {
        pdfList.push({
          "name" : "Practice Questions",
          "image" : `${config.staticCDN}images/practise-pdf-icon.png`,
          "pdf_link" : result[0][j].resource_reference
        })
      }
    }

    let qList = []
    let liveFlag = 0;
    let timer = 0

    for(let i=0; i< result[1].length; i++)
    {
      let statusThis = 0
      let videoViewStats = await StructuredCourse.getVideoViewStats(result[1][i].qid, student_id, db.mysql.read)
      let dayTimeData = Utility.getStructuredCourseDayTime(result[1][i].live_at)
      if(nowTime < parseInt(new Date(result[1][i].live_at).getTime()/1000)) // upcoming
      {
        if(dayTimeData.day == "Today")
        {
          liveFlag = 1
          timer = Math.ceil(parseInt(new Date(result[1][i].live_at).getTime()/1000) - nowTime)
        }
        statusThis = 5
      }
      else if(nowTime >= parseInt(new Date(result[1][i].live_at).getTime()/1000) && nowTime <= (parseInt(new Date(result[1][i].live_at).getTime()/1000) + parseInt(result[1][i].duration))) // live now
      {
        if(videoViewStats.length > 0)
        {
          statusThis = 2
        }
        else
        {
          statusThis = 1
        }
      }
      else if(nowTime > (parseInt(new Date(result[1][i].live_at).getTime()/1000) + parseInt(result[1][i].duration))) // finished live video
      {
        if(videoViewStats.length > 0)
        {
          statusThis = 3
        }
        else
        {
          statusThis = 4
        }
      }

      let topicList = result[1][i].topic.split("|")

      // if(i==(thirdScreenBannerPosition-1) && version_code >= 636 && result[4] != undefined && result[4].length != 0)
      // {
        // result[4][0]['type'] = "banner"
        // qList.push(result[4][0])
        // qList.push({
        //   "type":"banner",
        //   "link": thirdScreenBannerLink,
        //   "resource_type" : "banner"
        // })
      let playlist_id = (student_class == 12 ? 116507 : 116508)
      if(i==1 && version_code >= 636)
      {
        qList.push({
            type: "banner",
            image_url: `${config.staticCDN}images/structured-3rd-screen-banner.webp`,
            action_activity: 'playlist',
            action_data: {"playlist_id": playlist_id,"playlist_title" :"Score 180+ in JEE Mains","is_last":1},
            // action_activity: 'playlist',
            // action_data: {"playlist_id": 3,"playlist_title" :"Biology","is_last":0},
            size: '1x',
            class: '11',
            page_type: 'STRUCTURED_COURSE',
            banner_order: 1,
            position: 0
        })
      }
      if(version_code >= 636)
      {
        qList.push({
          "type":"lecture",
          "title": result[1][i].chapter,
          "status": statusThis,
          "qid": result[1][i].qid,
          "image_url": result[1][i].image_url,
          "duration": result[1][i].duration,
          "youtube_id": result[1][i].youtube_id,
          "live_at": result[1][i].live_at,
          "day_text" : dayTimeData.day,
          "time_text" : dayTimeData.time,
          "topic_list" : topicList,
          "resource_type" : "video",
          "event": "youtube_video",
          "page_data": {
            "question_id": result[1][i].qid,
            "video_youtube_id": result[1][i].youtube_id,
            "page": "STRUCTURED"
          // "event": "demo_video",
          // "page_data": {
          //   "video_id": 68099584,
          //   "course_id": 3,
          //   "video_url": "https://d3cvwyf9ksu0h5.cloudfront.net/answer-1576059313_68099584.mp4",
          //   "subject": "Physics",
          //   "course_detail_id": 571
          }
        })
      }
      else
      {
        qList.push({
          "type":"lecture",
          "title": result[1][i].chapter,
          "status": statusThis,
          "qid": result[1][i].qid,
          "image_url": result[1][i].image_url,
          "duration": result[1][i].duration,
          "youtube_id": result[1][i].youtube_id,
          "live_at": result[1][i].live_at,
          "day_text" : dayTimeData.day,
          "time_text" : dayTimeData.time,
          "topic_list" : topicList,
          "resource_type" : "video"
        })
      }
    }

    let playlist_id_no = (student_class == 12 ? 116507 : 116508)
    if(result[1].length == 1 && version_code >= 636)
    {
      qList.push({
          type: "banner",
          image_url: `${config.staticCDN}images/structured-3rd-screen-banner.webp`,
          action_activity: 'playlist',
          action_data: {"playlist_id": playlist_id_no,"playlist_title" :"Score 180+ in JEE Mains","is_last":1},
          size: '1x',
          class: '11',
          page_type: 'STRUCTURED_COURSE',
          banner_order: 1,
          position: 0
      })
    }

    let returnRes = {
      "chapter_name" : result[2][0].chapter,
      "video_count" : qList.length,
      "live_status" : liveFlag
    }

    if(liveFlag == 1)
    {
      returnRes['timer'] = timer*1000
    }

    returnRes['pdf_list'] = pdfList
    returnRes['questions'] = qList

    let responseData = {
      "meta": {
        "code": 200,
        "message": "success"
      },
      "data": returnRes
    }
    return res.status(responseData.meta.code).json(responseData);
  }catch (e) {
    next(e)
  }
}

async function getTagQlist(req, res, next)
{
  try{
    db = req.app.get('db')
    config = req.app.get('config')
    let student_id = req.user.student_id
    let student_class = req.user.student_class
    let tagVal = req.params.tag
    const { version_code } = req.headers;
    if(version_code > Data.etoos_version) {
        StructuredCourse = ETStructuredCourse;
    }
    let qList = await StructuredCourse.getVideoList(tagVal, db.mysql.read)

    let responseData = {
      "meta": {
        "code": 200,
        "message": "success"
      },
      "data": qList
    }
    return res.status(responseData.meta.code).json(responseData);

  }catch (e) {
    next(e)
  }
}

module.exports = {getTodaysData, getCourseDetails, getTagQlist}
