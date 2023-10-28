"use strict";
const _ = require('lodash');
const StatsContainer = require('../../../modules/containers/stats')
const ChapterContainer = require('../../../modules/containers/chapter')
const QuestionContainer = require('../../../modules/containers/question')
let db, config, client;

async function getMostWatchedVideos(req, res, next) {
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let params = eval("(" + req.body.params + ")");
    let datas, old_day_count = 2, promises;

    let locale_val = req.body.locale;
    if(locale_val == undefined)
    {
      locale_val = ""
    }

    let version = "v3"

    //Case to check package is NCERT

    if (params.package === "NCERT" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      promises = []
      // promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 9, 1, old_day_count, db))
      // promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 10, 1, old_day_count, db))
      // promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 11, 1, old_day_count, db))
      // promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 12, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 9, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 10, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 11, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 12, 1, old_day_count, db))
      let classes_array = ['6', '7', '8', '9', '10', '11', '12']
      classes_array.forEach((item) => {
        // promises.push(StatsContainer.getTopChapters(params.package, item, db));
        promises.push(StatsContainer.getTopChaptersNew(params.package, item, db));
      });
      promises.push(StatsContainer.getFirstLevelNew(params.package, old_day_count, db))

      let result = await Promise.all(promises)
      datas = {
        "package": "NCERT",
        "filterType": {"name": "level1", "list": []},
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "question_list": [],
        "active_filter": {"package": "NCERT"}
      }

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.level1) : (current_index <= 3 ? datas.question_list.push(item[0]) : item.forEach((element) => {
          if (element.class === 6)
            datas.top5.list.class_6.push(element.chapter);
          else if (element.class === 7)
            datas.top5.list.class_7.push(element.chapter);
          else if (element.class === 8)
            datas.top5.list.class_8.push(element.chapter);
          else if (element.class === 9)
            datas.top5.list.class_9.push(element.chapter);
          else if (element.class === 10)
            datas.top5.list.class_10.push(element.chapter);
          else if (element.class === 11)
            datas.top5.list.class_11.push(element.chapter);
          else if (element.class === 12)
            datas.top5.list.class_12.push(element.chapter);
        }))
      });

    }
    else if (params.package === "NCERT" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db))
      //promises.push(StatsContainer.getSecondLevel(params.package,params.level1,old_day_count,db))
      // promises.push(ChapterContainer.getDistinctChapter(params.package, params.level1, db));
      promises.push(ChapterContainer.getDistinctChapterLocalised('', 'v3', params.package, params.level1, db));

      datas = {
        "package": "NCERT",
        "filterType": {"name": "level2", "list": []},
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "question_list": [],
        "active_filter": {"package": "NCERT", "level1": params.level1}
      }
      let result = await Promise.all(promises)

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.chapter) : datas.question_list = item
      });
    }

    else if (params.package === "NCERT" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1)) && (params.level2 !== "" && params.level2 !== undefined && !_.isNull(params.level2))) {
      promises = []
      let paramsNew = {
        "classes": [params.level1], "chapters": [params.level2], "subtopics": [], "books": [],
        "courses": [params.package], "exams": [], "study": [], "levels": [], "page_no": 1, "page_length": 6
      };

      promises.push(ChapterContainer.getDistExercisesLocalised('', 'v3', params.package, params.level1, params.level2, db));
      //promises.push(QuestionContainer.getFilteredQuestions(paramsNew, db));
      // promises.push(StatsContainer.getMostWatchedVideosForSecondLevel(params.package, params.level1, params.level2, 6, old_day_count, db));
      promises.push(StatsContainer.getMostWatchedVideosForSecondLevelNew(params.package, params.level1, params.level2, 6, old_day_count, db));
      // promises.push(ChapterContainer.getDistSubtopicsForMostWatched(params.package, params.level1, params.level2, db));
      promises.push(ChapterContainer.getDistSubtopicsForMostWatchedNew(params.package, params.level1, params.level2, db));
      let result = await Promise.all(promises);
      datas = {
        "package": "NCERT",
        "filterType": {"topic": [], "exercise": []},
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "question_list": [],
        "active_filter": {"package": "NCERT", "level1": params.level1, "level2": params.level2}
      }
      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.topic = item.map((element) => element.subtopic) : (current_index === 0) ? datas.filterType.exercise = item.map((element) => element) : datas.question_list = item
      });

      // result.forEach((item)=>{
      //   datas.question_list.push(item)
      // });
    }

    else if (params.package === "RD SHARMA" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 9, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 10, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 11, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, 12, 1, old_day_count, db))

      let classes_array = ['6', '7', '8', '9', '10', '11', '12']
      classes_array.forEach((item) => {
        promises.push(StatsContainer.getTopChaptersNew(params.package, item, db));
      });
      promises.push(StatsContainer.getFirstLevelNew(params.package, old_day_count, db))
      datas = {
        "package": "RD SHARMA",
        "filterType": {"name": "level1", "list": []},
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "question_list": [],
        "active_filter": {"package": "RD SHARMA"}
      }
      let result = await Promise.all(promises)

      // result.forEach((item,current_index)=>{
      //   current_index===result.length-1?datas.filterType.list=item.map((element)=>element.level1):datas.question_list.push(item[0])
      // });

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.level1) : (current_index <= 3 ? datas.question_list.push(item[0]) : item.forEach((element) => {
          if (element.class == 6)
            datas.top5.list.class_6.push(element.chapter);
          else if (element.class == 7)
            datas.top5.list.class_7.push(element.chapter);
          else if (element.class == 8)
            datas.top5.list.class_8.push(element.chapter);
          else if (element.class == 9)
            datas.top5.list.class_9.push(element.chapter);
          else if (element.class == 10)
            datas.top5.list.class_10.push(element.chapter);
          else if (element.class == 11)
            datas.top5.list.class_11.push(element.chapter);
          else if (element.class == 12)
            datas.top5.list.class_12.push(element.chapter);
        }))
      });
    }
    else if (params.package === "RD SHARMA" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db))
      //promises.push(StatsContainer.getSecondLevel(params.package,params.level1,old_day_count,db))
      // promises.push(ChapterContainer.getDistChaptersForStudyMaterial(params.package, params.level1, db));
      promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised('', 'v3', params.package, params.level1, db));

      datas = {
        "package": "RD SHARMA",
        "filterType": {"name": "level2", "list": []},
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "question_list": [],
        "active_filter": {"package": "RD SHARMA", "level1": params.level1}
      }

      let result = await Promise.all(promises)
      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.chapter) : datas.question_list = item
      });
    }

    else if (params.package === "RD SHARMA" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1)) && (params.level2 !== "" && params.level2 !== undefined && !_.isNull(params.level2))) {
      promises = [];
      let paramsNew = {
        "classes": [params.level1], "chapters": [params.level2], "subtopics": [], "books": [],
        "courses": [], "exams": [], "study": [params.package], "levels": [], "page_no": 1, "page_length": 6
      };
      //promises.push(StatsContainer.getMostWatchedVideosForSecondLevel(params.package,params.level1,params.level2,6,old_day_count,db));
      // promises.push(QuestionContainer.getFilteredQuestions(paramsNew, db));
      promises.push(QuestionContainer.getFilteredQuestionsLocalised('', 'v3', paramsNew, db));
      promises.push(ChapterContainer.getDistSubtopicsForMostWatchedNew(params.package, params.level1, params.level2, db))
      let result = await Promise.all(promises);
      datas = {
        "package": "RD SHARMA",
        "filterType": {"name": "level3", "list": []},
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "question_list": [],
        "active_filter": {"package": "RD SHARMA", "level1": params.level1, "level2": params.level2}
      }

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.subtopic) : datas.question_list = item
      });
      // result.forEach((item)=>{
      //   datas.question_list.push(item)
      // });
    }

    else if (params.package === "CENGAGE" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosByPackageNew(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      promises.push(StatsContainer.getTopChaptersNew(params.package, null, db));
      // promises.push(ChapterContainer.getDistChaptersForStudyMaterial(params.package, null, db));
      promises.push(ChapterContainer.getDistChaptersForStudyMaterialLocalised('', 'v3', params.package, null, db));

      datas = {
        "package": "CENGAGE",
        "filterType": {"name": "level1", "list": []},
        "top5": {"type": "chapter", "list": []},
        "question_list": [],
        "active_filter": {"package": "CENGAGE"}
      }
      let result = await Promise.all(promises)

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.chapter) : ((current_index === 0) ? datas.question_list = item : item.forEach((element) => {
          datas.top5.list.push(element.chapter)
        }))
      });
    }
    else if (params.package === "CENGAGE" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1))) {
      let result = await StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db);
      datas = {
        "package": "CENGAGE",
        "top5": {"type": "chapter", "list": []},
        "question_list": [],
        "active_filter": {"package": "CENGAGE", "level1": params.level1}
      }
      result.forEach((item) => {
        datas.question_list.push(item)
      });
    }

    else if (params.package === "X BOARDS" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosByPackageNew(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      // promises.push(ChapterContainer.getDistYears("X Boards", db));
      promises.push(ChapterContainer.getDistYearsLocalised('v3', "X Boards", db));

      datas = {
        "package": "X BOARDS",
        "filterType": {"name": "level1", "list": []},
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "X BOARDS"}
      }
      let result = await Promise.all(promises)

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => "20" + element.year) : datas.question_list = item
      });
    }
    else if (params.package === "X BOARDS" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1))) {
      let result = await StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db);
      datas = {
        "package": "X BOARDS",
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "X BOARDS", "level1": params.level1}
      }
      result.forEach((item) => {
        datas.question_list.push(item)
      });
    }

    else if (params.package === "XII BOARDS" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosByPackageNew(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))

      // promises.push(ChapterContainer.getDistYears("XII Boards", db));
      promises.push(ChapterContainer.getDistYearsLocalised('v3', "XII Boards", db));

      datas = {
        "package": "XII BOARDS",
        "filterType": {"name": "level1", "list": []},
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "XII BOARDS"}
      }
      let result = await Promise.all(promises)

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => "20" + element.year) : datas.question_list = item
      });
    }
    else if (params.package === "XII BOARDS" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1))) {

      let result = await StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db);
      datas = {
        "package": "XII BOARDS",
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "XII BOARDS", "level1": params.level1}
      }
      result.forEach((item) => {
        datas.question_list.push(item)
      });
    }

    else if (params.package === "JEE MAINS" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosByPackageNew(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      // promises.push(ChapterContainer.getDistYears("Jee Mains", db));
      promises.push(ChapterContainer.getDistYearsLocalised('v3', "Jee Mains", db));
      datas = {
        "package": "JEE MAINS",
        "filterType": {"name": "level1", "list": []},
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "JEE MAINS"}
      }
      let result = await Promise.all(promises)

      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => "20" + element.year) : datas.question_list = item
      });
    }
    else if (params.package === "JEE MAINS" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1))) {
      let result = await StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db);
      datas = {
        "package": "JEE MAINS",
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "JEE MAINS", "level1": params.level1}
      }
      result.forEach((item) => {
        datas.question_list.push(item)
      });
    }

    else if (params.package === "JEE ADVANCED" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosByPackageNew(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      // promises.push(ChapterContainer.getDistYears("Jee Advanced", db));
      promises.push(ChapterContainer.getDistYearsLocalised('v3', "Jee Advanced", db));

      datas = {
        "package": "JEE ADVANCED",
        "filterType": {"name": "level1", "list": []},
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "JEE ADVANCED"}
      }
      let result = await Promise.all(promises)
      //console.log(result)
      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => "20" + element.year) : datas.question_list = item
      });
    }
    else if (params.package === "JEE ADVANCED" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1))) {
      let result = await StatsContainer.getMostWatchedVideosForFirstLevelNew(params.package, params.level1, 4, old_day_count, db);
      datas = {
        "package": "JEE ADVANCED",
        "top5": {
          "type": "year",
          "list": {"year_2018": [], "year_2017": [], "year_2016": [], "year_2015": [], "year_2014": []}
        },
        "question_list": [],
        "active_filter": {"package": "JEE ADVANCED", "level1": params.level1}
      }
      result.forEach((item) => {
        datas.question_list.push(item)
      });
    }

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": datas
    }
    res.status(responseData.meta.code).json(responseData);

  }
  catch (e) {
    //console.log("error");
    //console.log(e)
    next(e)

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch block"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
  }

}

module.exports = {getMostWatchedVideos}

