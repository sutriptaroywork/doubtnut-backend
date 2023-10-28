"use strict";
const _ = require('lodash');
const StatsContainer = require('../../../modules/containers/stats')
const ChapterContainer = require('../../../modules/containers/chapter')
const QuestionContainer = require('../../../modules/containers/question')
const Rank = require('../../../modules/rank')
let db, config, client;

async function getMostWatchedVideos(req, res, next) {
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let params = eval("(" + req.body.params + ")");
    let datas, old_day_count = 2, promises;
    //console.log(params);

    //Case to check package is NCERT

    if (params.package === "NCERT" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 9, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 10, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 11, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 12, 1, old_day_count, db))
      let classes_array = ['6', '7', '8', '9', '10', '11', '12']
      classes_array.forEach((item) => {
        promises.push(StatsContainer.getTopChapters(params.package, item, db));
      });
      promises.push(StatsContainer.getFirstLevel(params.package, old_day_count, db))

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
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db))
      //promises.push(StatsContainer.getSecondLevel(params.package,params.level1,old_day_count,db))
      promises.push(ChapterContainer.getDistinctChapter(params.package, params.level1, db));

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

      promises.push(ChapterContainer.getDistExercises(params.package, params.level1, params.level2, db));
      //promises.push(QuestionContainer.getFilteredQuestions(paramsNew, db));
      promises.push(StatsContainer.getMostWatchedVideosForSecondLevel(params.package, params.level1, params.level2, 6, old_day_count, db));
      promises.push(ChapterContainer.getDistSubtopicsForMostWatched(params.package, params.level1, params.level2, db));
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
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 9, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 10, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 11, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 12, 1, old_day_count, db))

      let classes_array = ['6', '7', '8', '9', '10', '11', '12']
      classes_array.forEach((item) => {
        promises.push(StatsContainer.getTopChapters(params.package, item, db));
      });
      promises.push(StatsContainer.getFirstLevel(params.package, old_day_count, db))
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
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db))
      //promises.push(StatsContainer.getSecondLevel(params.package,params.level1,old_day_count,db))
      promises.push(ChapterContainer.getDistChaptersForStudyMaterial(params.package, params.level1, db));

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
      promises.push(QuestionContainer.getFilteredQuestions(paramsNew, db));
      promises.push(ChapterContainer.getDistSubtopicsForMostWatched(params.package, params.level1, params.level2, db))
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
      promises.push(StatsContainer.getMostWatchedVideosByPackage(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      promises.push(StatsContainer.getTopChapters(params.package, null, db));
      promises.push(ChapterContainer.getDistChaptersForStudyMaterial(params.package, null, db));

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
      let result = await StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db);
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
      promises.push(StatsContainer.getMostWatchedVideosByPackage(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      promises.push(ChapterContainer.getDistYears("X Boards", db));

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
      let result = await StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db);
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
      promises.push(StatsContainer.getMostWatchedVideosByPackage(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))

      promises.push(ChapterContainer.getDistYears("XII Boards", db));

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

      let result = await StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db);
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
      promises.push(StatsContainer.getMostWatchedVideosByPackage(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      promises.push(ChapterContainer.getDistYears("Jee Mains", db));
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
      let result = await StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db);
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
      promises.push(StatsContainer.getMostWatchedVideosByPackage(params.package, 4, old_day_count, db))
      //promises.push(StatsContainer.getFirstLevel(params.package,old_day_count,db))
      promises.push(ChapterContainer.getDistYears("Jee Advanced", db));

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
      let result = await StatsContainer.getMostWatchedVideosForFirstLevel(params.package, params.level1, 4, old_day_count, db);
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

async function getMostWatchedChapters(req, res, next) {
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let params = eval("(" + req.body.params + ")");
    let promises = [], datas, old_day_count = 2;
    //console.log(params);

    if (params.package === "NCERT" && (params.level1 === "" || params.level1 === undefined || _.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      promises = []
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 9, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 10, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 11, 1, old_day_count, db))
      promises.push(StatsContainer.getMostWatchedVideosForFirstLevel(params.package, 12, 1, old_day_count, db))
      promises.push(StatsContainer.getFirstLevel(params.package, old_day_count, db))

      let result = await Promise.all(promises);
      datas = {
        "package": "NCERT",
        "filterType": {"name": "level1", "list": []},
        "question_list": [],
        "active_filter": {"package": "NCERT"}
      }
      result.forEach((item, current_index) => {
        current_index === result.length - 1 ? datas.filterType.list = item.map((element) => element.level1) : datas.question_list.push(item[0])
      });
    }

    else if (params.package === "NCERT" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1)) && (params.level2 === "" || params.level2 === undefined || _.isNull(params.level2))) {
      params.level1.forEach((item) => {
        promises.push(StatsContainer.getTopChapters(params.package, item, db));
      });

      //promises.push(StatsContainer.getSecondLevel(params.package,params.level1,2,db))
      let result = await Promise.all(promises);
      datas = {
        "package": "NCERT",
        "filterType": {
          "name": "level2",
          "chapter_list": {
            "class_6": [],
            "class_7": [],
            "class_8": [],
            "class_9": [],
            "class_10": [],
            "class_11": [],
            "class_12": []
          }
        },
        "active_filter": {"package": "NCERT", "level1": params.level1}
      }

      result.forEach((item, current_index) => {
        item.forEach((i) => {
          if (i.class === 6)
            datas.filterType.chapter_list.class_6.push(i.chapter);
          else if (i.class === 7)
            datas.filterType.chapter_list.class_7.push(i.chapter);
          else if (i.class === 8)
            datas.filterType.chapter_list.class_8.push(i.chapter);
          else if (i.class === 9)
            datas.filterType.chapter_list.class_9.push(i.chapter);
          else if (i.class === 10)
            datas.filterType.chapter_list.class_10.push(i.chapter);
          else if (i.class === 11)
            datas.filterType.chapter_list.class_11.push(i.chapter);
          else if (i.class === 12)
            datas.filterType.chapter_list.class_12.push(i.chapter);
        });
      });
    }

    else if (params.package === "NCERT" && (params.level1 !== "" && params.level1 !== undefined && !_.isNull(params.level1)) && (params.level2 !== "" && params.level2 !== undefined && !_.isNull(params.level2))) {
      params.level1.forEach((item) => {
        promises.push(StatsContainer.getMostWatchedVideosForSecondLevel(params.package, item, params.level2, 4, 2, db));
      });
      let result = await Promise.all(promises);
      datas = {
        "package": "NCERT",
        "question_list": [],
        "active_filter": {"package": "NCERT", "level1": params.level1, "level2": params.level2}
      }

      result.forEach((item) => {
        if (item.length > 0) {
          item.forEach((i) => {
            datas.question_list.push(i)
          });
        }
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


function test(req, res, next) {
  try {
    let result = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": {
        "package": "NCERT",
        "filterType": {
          "name": "level1",
          "list": [
            "6",
            "7",
            "8",
            "9",
            "10",
            "11",
            "12"
          ]
        },
        "top5": {
          "type": "chapter",
          "list": {
            "class_6": [
              "KNOWING OUR NUMBERS",
              "PLAYING WITH NUMBERS",
              "RATIO AND PROPORTION",
              "FRACTIONS",
              "MENSURATION"
            ],
            "class_7": [
              "COMPARING QUANTITIES",
              "PERIMETER AND AREA",
              "FRACTIONS AND DECIMALS",
              "RATIONAL NUMBERS",
              "ALGEBRAIC EXPRESSIONS"
            ],
            "class_8": [
              "COMPARING QUANTITIES",
              "ALGEBRAIC EXPRESSIONS AND IDENTITIES",
              "RATIONAL NUMBERS",
              "LINEAR EQUATION IN ONE VARIABLE",
              "MENSURATION"
            ],
            "class_9": [
              "NUMBER SYSTEM",
              "SURFACE AREA AND VOLUME",
              "QUADRILATERALS",
              "POLYNOMIALS",
              "TRIANGLES"
            ],
            "class_10": [
              "QUADRATIC EQUATIONS",
              "PAIR OF LINEAR EQUATION IN TWO VARIABLES",
              "SOME APPLICATIONS OF TRIGONOMETRY",
              "TRIGONOMETRIC IDENTITIES",
              "TRIGONOMETRIC RATIOS"
            ],
            "class_11": [
              "CIRCLES",
              "PERMUTATIONS AND COMBINATIONS",
              "SEQUENCES AND SERIES",
              "STRAIGHT LINES",
              "BINOMIAL THEOREM"
            ],
            "class_12": [
              "INDEFINITE INTEGRALS",
              "DEFINITE INTEGRAL",
              "VECTOR ALGEBRA",
              "DIFFERENTIAL EQUATIONS",
              "APPLICATION OF DERIVATIVES"
            ]
          }
        },
        "question_list": [
          {
            "class": 9,
            "question_id": 2977,
            "answer_video": "answer-1530273884.mp4",
            "chapter": "TRIANGLES",
            "subtopic": "EXTERIOR ANGLE OF A TRIANGLE",
            "ocr_text": " In Fig. 6.44, the side QR of \r\n  PQR is produced to a point S. If the bisectors of `/_P Q R\" \"a n d/_P R S`\r\nmeet at point T, then prove that `/_Q T R=1/2/_Q P R`\r\n.",
            "question": "In Fig. 6.44, the side QR of \r\n  PQR is produced to a point S. If the bisectors of `/_P Q R\"\\ \"a n d/_P R S`\nmeet at point T, then prove that `/_Q T R=1/2/_Q P R`\n."
          },
          {
            "class": 10,
            "question_id": 3003,
            "answer_video": "X_01_E01_01.mp4",
            "chapter": "REAL NUMBERS",
            "subtopic": "EUCLIDS DIVISION ALGORITHM",
            "ocr_text": "Use Euclid's\r\n  division algorithm to find the HCF of\n(i) 135 and\r\n  225            (ii) 196 and 38220       (iii) 867 and 255",
            "question": "Use Euclid's\r\n  division algorithm to find the HCF of\n(i) 135 and\r\n  225 (ii) 196 and 38220 (iii) 867 and 255"
          },
          {
            "class": 11,
            "question_id": 1,
            "answer_video": "answer-1506227401.mp4",
            "chapter": "SETS",
            "subtopic": "OPERATIONS ON SETS",
            "ocr_text": "   In a survey of 60 people, it was found that 25 people read newspaper H. 26 read newspaper T, 26 read newspaper 1, 9 read both H and I. 11 read both H and T, 8 read both T and I, 3 read all three newspapers. Find: (i) the number of people who read at least one of the newspapers. (ii) the number of people who read exactly one newspaper",
            "question": "In a survey of 60 people, it\n  was found that 2 5 people read newspaper H. 26 read newspaper T, 26 read\n  newspaper 1, 9 read both H and I.11 read both H and T, 8 read both T and I, 3\n  read all three newspapers. Find:\n(i) the number of people who read"
          },
          {
            "class": 12,
            "question_id": 2356,
            "answer_video": "XII_09_SLV_14.mp4",
            "chapter": "DIFFERENTIAL EQUATIONS",
            "subtopic": "APPLICATIONS OF DIFFERENTIAL EQUATIONS",
            "ocr_text": "In a bank, principal\r\n  increases continuously at the rate of 5% per year. In how many years Rs 1000\r\n  double itself?",
            "question": "In a bank, principal\r\n  increases continuously at the rate of 5% per year. In how many years Rs 1000\r\n  double itself?"
          }
        ],
        "active_filter": {
          "package": "NCERT"
        }
      }
    }

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": result
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

async function getRoundWiseRank(req, res, next) {
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let clg = req.body.clg.replace(/%2F/g, "/")
    let dept = req.body.dept.replace(/%2F/g, "/")
    let quota = req.body.quota
    let category = req.body.category

    let roundWiseRank = await Rank.getRoundWiseRank(clg, dept, quota, category, db.mysql.read)

    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": roundWiseRank
    }
    res.status(responseData.meta.code).json(responseData);
  }
  catch (e) {
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getClgDeptRank(req, res, next){
  try {
    db = req.app.get('db')
    config = req.app.get('config')
    let state = req.body.state
    let category = req.body.category
    let rank = req.body.rank

    let clgDeptRank = await Rank.getClgDeptRank(state, category, rank, db.mysql.read)

    let clg_name = ""
    let datas = []
    let data1 = [];
    let count = 0;
    for(let i=0; i<clgDeptRank.length; i++)
    {
      if(clg_name!=clgDeptRank[i].college_name)
      {
        count++;
        clg_name = clgDeptRank[i].college_name
        data1 = []
        data1['department'] = clgDeptRank[i].department
        data1['round'] = clgDeptRank[i].round_num
        data1['open_rank'] = clgDeptRank[i].opening_rank
        data1['close_rank'] = clgDeptRank[i].closing_rank
        datas.push({
          'clg_name': clgDeptRank[i].college_name,
          'departments': [{"department": clgDeptRank[i].department, "round": clgDeptRank[i].round_num, "open_rank": clgDeptRank[i].opening_rank, "close_rank": clgDeptRank[i].closing_rank}]
        })
      }
      else
      {
        datas[count-1]['departments'].push({"department": clgDeptRank[i].department, "round": clgDeptRank[i].round_num, "open_rank": clgDeptRank[i].opening_rank, "close_rank": clgDeptRank[i].closing_rank})
      }
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
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getDistClg(req, res, next){
  db = req.app.get('db')
  config = req.app.get('config')
  try{
    let clgList = await Rank.getAllClg(db.mysql.read)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": clgList
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getDistState(req, res, next){
  db = req.app.get('db')
  config = req.app.get('config')
  try{
    let stateList = await Rank.getAllState(db.mysql.read)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": stateList
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getDistDept(req, res, next){
  db = req.app.get('db')
  config = req.app.get('config')
  let clg_name = req.params.clg.replace(/%2F/g, "/");
  try{
    let deptList = await Rank.getDistDeptData(clg_name, db.mysql.read)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": deptList
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getDistQuota(req, res, next){
  db = req.app.get('db')
  config = req.app.get('config')
  let clg_name = req.params.clg.replace(/%2F/g, "/");
  let department = req.params.dept.replace(/%2F/g, "/");
  try{
    let quotaList = await Rank.getDistQuota(clg_name, department, db.mysql.read)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": quotaList
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getDistCategory(req, res, next){
  db = req.app.get('db')
  config = req.app.get('config')
  let clg_name = req.params.clg.replace(/%2F/g, "/");
  let department = req.params.dept.replace(/%2F/g, "/");
  let quota = req.params.quota;
  try{
    let catList = await Rank.getDistCategory(clg_name, department, quota, db.mysql.read)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": catList
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

async function getStateWiseCategory(req, res, next){
  db = req.app.get('db')
  config = req.app.get('config')
  let state = req.params.state;
  try{
    let catStatewiseList = await Rank.getStatewiseCategory(state, db.mysql.read)
    let responseData = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "Success"
      },
      "data": catStatewiseList
    }
    res.status(responseData.meta.code).json(responseData);
  }catch(e){
    let responseData = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Error from catch block"
      },
      "data": null,
      "error": e
    }
    res.status(responseData.meta.code).json(responseData);
  }
}

module.exports = {
  getMostWatchedVideos, 
  getMostWatchedChapters, 
  test, 
  getRoundWiseRank, 
  getClgDeptRank, 
  getDistClg,
  getDistState,
  getDistDept, 
  getDistQuota,
  getDistCategory,
  getStateWiseCategory
}
