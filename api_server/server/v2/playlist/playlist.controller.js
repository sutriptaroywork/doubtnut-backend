"use strict";
const Question = require('../../../modules/question')
const Student = require('../../../modules/student')
const Playlist = require('../../../modules/playlist')
const PlaylistContainer = require('../../../modules/containers/playlist')
const LanguageContainer = require('../../../modules/containers/language')
const Token = require('../../../modules/tokenAuth');
const PlaylistHelper = require('./playlist.helper');
const _ = require('lodash');
// const validator = require('validator')
// const request = require("request")
let db, config, client


async function view(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')
  // let tokenObj = new Token(db.redis);
  //console.log(req.user)
  let limit = 100;

  // res.send("ok")
  let student_id = req.params.student_id;
  let playlist_id = req.params.playlist_id;
  let page_no = req.params.page_no;
  let language = "english"
  let lang = await LanguageContainer.getByCode(req.user.locale, db)
  //console.log("language")
  //console.log(lang)
  if (lang.length > 0) {
    language = lang[0]['language']
  }

  let t_student_id = req.user.student_id;
  //console.log("++++++++++++++"+t_student_id+"++++++++++++++++++++++++++++++")
  // let responseData = {}
  if (student_id == t_student_id) {
    if (playlist_id === "QOTD") {
      let responseData1 = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "No qotd",
          "data": null
        },
        "error": null
      }
      res.status(responseData1.meta.code).json(responseData1);
    } else if (playlist_id === "HISTORY") {
      Playlist.getStudentHistoryPlaylistWithLanguage(student_id, language, page_no, limit, db.mysql.read).then(result => {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Student history"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else if (playlist_id === "DN_REC") {
      Playlist.getRecommendedPlaylist(req.user.student_class, page_no, limit, db.mysql.read).then(result => {
        //console.log("result");
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Doubtnut recommended playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else if (playlist_id === "SUB_ANS") {
      Playlist.subscribedStudentPlaylistWithLanguage(student_id, language, 1, page_no, limit, db.mysql.read).then(result => {
        //console.log(result)
        for (let i = 0; i < result.length; i++) {
          result[i]['question_image'] = config.blob_url + 'q-images/' + result[i]['question_image']
        }
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Subscribed user answered playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })

    } else if (playlist_id === "SUB_UNANS") {
      Playlist.subscribedStudentPlaylistWithLanguage(student_id, language, 0, page_no, limit, db.mysql.read).then(result => {
        //console.log(result)
        for (let i = 0; i < result.length; i++) {
          if (result[i]['question_image'] == null) {
            result[i]['question_image'] = null
          } else {
            result[i]['question_image'] = config.blob_url + 'q-images/' + result[i]['question_image']
          }
        }
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Subsscribed user unanswered playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else if (playlist_id === "VIRAL") {
      Playlist.getViralVideosWithLanguage(language, page_no, limit, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Viral video playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else if (playlist_id === "VLS") {
      Playlist.getVLSVideosWithLanguage(req.user.student_class, language, page_no, limit, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Vls playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else if (playlist_id === "DPP") {
      PlaylistContainer.getDppWithLanguage(student_id, language, page_no, limit, db).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Vls playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else if (playlist_id === "TRENDING") {
      if (page_no == 2) {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Trending playlist"
          },
          "data": []
        }
        res.status(responseData1.meta.code).json(responseData1);
      } else {
        PlaylistContainer.getTrendingVideosNew(req.user.student_class, 5, language, db).then(result => {
          //console.log(result)
          result.forEach((item) => {
            item.student_id = student_id;
          })
          let responseData1 = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "Trending playlist"
            },
            "data": result
          }
          res.status(responseData1.meta.code).json(responseData1);
        }).catch(error => {
          next(error)

          // "use strict";
          // let responseData1 = {
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": ""
          //   },
          //   "error": error
          // }
          // res.status(responseData1.meta.code).json(responseData1);
        })
      }
    }else if (playlist_id === "CRASH_COURSE") {
        PlaylistContainer.getCrashCoursePlaylist(req.user.student_class, 5, limit,language, db).then(result => {
          //console.log(result)
          result.forEach((item) => {
            item.student_id = student_id;
          })
          let responseData1 = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "CRASH_COURSE playlist"
            },
            "data": result
          }
          res.status(responseData1.meta.code).json(responseData1);
        }).catch(error => {
          next(error)

          // "use strict";
          // let responseData1 = {
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": ""
          //   },
          //   "error": error
          // }
          // res.status(responseData1.meta.code).json(responseData1);
        })
    }else if (playlist_id === "LATEST_FROM_DOUBTNUT") {
        PlaylistContainer.getLatestFromDoubtnutPlaylist(req.user.student_class, page_no, limit,language, db).then(result => {
          //console.log(result)
          result.forEach((item) => {
            item.student_id = student_id;
          })
          let responseData1 = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "Latest from Doubtnut playlist"
            },
            "data": result
          }
          res.status(responseData1.meta.code).json(responseData1);
        }).catch(error => {
          next(error)

          // "use strict";
          // let responseData1 = {
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": ""
          //   },
          //   "error": error
          // }
          // res.status(responseData1.meta.code).json(responseData1);
        })
    }else if (playlist_id === "GK") {
        PlaylistContainer.getGeneralKnowledgePlaylist(req.user.student_class, 5, limit,language, db).then(result => {
          //console.log(result)
          result.forEach((item) => {
            item.student_id = student_id;
          })
          let responseData1 = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "General Knowledge playlist"
            },
            "data": result
          }
          res.status(responseData1.meta.code).json(responseData1);
        }).catch(error => {
          next(error)

          // "use strict";
          // let responseData1 = {
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": ""
          //   },
          //   "error": error
          // }
          // res.status(responseData1.meta.code).json(responseData1);
        })
    }
    else if (!_.isNaN(playlist_id)) {
      Playlist.getPlaylistByPlaylistIdWithLanguage(student_id, playlist_id, language, page_no, limit, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Custom playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })

    } else {
      //error invalid playlist id
      let responseData1 = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Invalid playlist id"
        }
      }
      res.status(responseData1.meta.code).json(responseData1);
    }

  } else {
    //user viewing another playlist  }
    let responseData1 = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Work in progress!!!"
      }
    }
    res.status(responseData1.meta.code).json(responseData1);
  }
}

async function customView(req, res, next) {
  db = req.app.get('db')
  let student_id = req.params.student_id;
  let playlist_id = req.params.playlist_id;
  let year = req.body.year;
  let chapter = req.body.chapter;
  let exercise = req.body.exercise;
  let class1 = req.body.class;
  let t_student_id = req.user.student_id;
  let language = "english"
  let lang = await LanguageContainer.getByCode(req.user.locale, db)
  //console.log("language")
  //console.log(lang)
  if (lang.length > 0) {
    language = lang[0]['language']
  }
  if (student_id == t_student_id) {
    if (playlist_id === "NCERT") {
      //chapter,grade,exercise
      Playlist.getNcertPlaylistWithLanguage(class1, chapter, language, exercise, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "NCERT playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // //console.log(error);
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": "error"
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })

    }
    else if (playlist_id === "JEE_ADVANCE") {

      //year
      Playlist.getJeeAdvancePlaylistWithLanguage(year, language, db.mysql.read).then(result => {
        // //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Jee Advance playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    }
    else if (playlist_id === "JEE_MAIN") {

      //year
      Playlist.getJeeMainPlaylistWithLanguage(year, language, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "Jee Mains playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    }
    else if (playlist_id === "BOARDS_12") {

      //year
      Playlist.getXIIBoardsPlaylistWithLanguage('12', year, language, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "BOARDS XII playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    }
    else if (playlist_id === "BOARDS_10") {

      //year
      Playlist.getXBoardsPlaylistWithLanguage(year, language, db.mysql.read).then(result => {
        //console.log(result)
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "BOARDS X playlist"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1);
      }).catch(error => {
        next(error)

        // "use strict";
        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": ""
        //   },
        //   "error": error
        // }
        // res.status(responseData1.meta.code).json(responseData1);
      })
    } else {
      //error invalid playlist id
      let responseData1 = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Invalid custom playlist id"
        }
      }
      res.status(responseData1.meta.code).json(responseData1);
    }

  } else {
    //user viewing another playlist  }
    let responseData1 = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "Work in progress!!!"
      }
    }
    res.status(responseData1.meta.code).json(responseData1);
  }
}

function create(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')
  let playlist_name = req.body.playlist_name
  let question_id = req.body.question_id
  let student_id = req.user.student_id
  let student_class=req.user.student_class
  //console.log(student_id)
  Student.getStudentClassAndCourse(student_id, db.mysql.read).then(classAndCourse => {
    let param = {}
    //console.log(classAndCourse)
    if(classAndCourse.length>0 && classAndCourse[0]['student_class']){
      student_class=classAndCourse[0]['student_class']
    }
    // param['name'] = playlist_name
    // param['is_first']=0
    // param['is_last']=1
    // param['is_admin_created']=0
    // param['parent']=0
    // param['resource_path']="select b.*,a.question_id,case when f.xxlanxx is null then a.ocr_text else f.xxlanxx end as ocr_text,a.doubt,a.question, case when b.chapter is null then a.chapter else b.chapter end as chapter,case when x.xxlanxx is null then b.chapter else x.xxlanxx end as chapter,case when y.xxlanxx is null then b.subtopic else y.xxlanxx end as subtopic, case when b.class is null then a.class else b.class end as class,e.packages from (Select question_id from playlist_questions_mapping where playlist_id=? and is_active=1) as t1 left join  (SELECT question_id,ocr_text,doubt,question,chapter,class from questions) as a on t1.question_id = a.question_id left join (select * from questions_meta where is_skipped = 0) as b on a.question_id = b.question_id left join (select GROUP_CONCAT(packages) as packages,question_id from question_package_mapping group by question_id) as e on a.question_id = e.question_id left join (select question_id,xxlanxx from questions_localized) as f on a.question_id=f.question_id left join (select chapter,min(xxlanxx) as xxlanxx from localized_ncert_chapter group by chapter) as x on a.chapter=x.chapter left join (select subtopic,min(xxlanxx) as xxlanxx from localized_subtopic group by subtopic) as y on b.subtopic=y.subtopic order by a.doubt ASC"
    // param['resource_type']='playlist'
    // param['resource_description']='playlist'
    // param['student_class'] = student_class
    // param['student_course'] = 'NCERT'
    // param['playlist_order']=0
    // param['student_id'] = student_id
    // param['is_active'] = 1
    param = PlaylistHelper.getPlaylistCreationParams({
      playlist_name,
      student_class,
      student_course: 'NCERT',
      student_id,
    })
    Playlist.createPlaylistNewLibrary(param, db.mysql.write).then(result => {
      //console.log(result)
      if (typeof question_id !== 'undefined' && question_id !== null) {
        Playlist.addQuestionInPlaylist(result["insertId"], question_id, student_id, db.mysql.write).then(result1 => {
          let responseData1 = {
            "meta": {
              "code": 200,
              "success": true,
              "message": "SUCCESS!!"
            },
            "data": result["insertId"]
          }
          res.status(responseData1.meta.code).json(responseData1);
        }).catch(error => {
          next(error)

          // let responseData1 = {
          //   "meta": {
          //     "code": 403,
          //     "success": false,
          //     "message": "Something is wrong."
          //   },
          //   "error": error
          // }
          // if (typeof error.sqlState !== 'undefined') {
          //   delete error.sqlState
          // }
          // if (typeof error.index !== 'undefined') {
          //   delete error.index
          // }
          // if (typeof error.sql !== 'undefined') {
          //   delete error.sql
          // }
          // if (error.code == "ER_DUP_ENTRY") {
          //   responseData1['meta']['message'] = "Duplicate entry"
          // }
          // res.status(responseData1.meta.code).json(responseData1);
        })
      } else {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS!!"
          },
          "data": result["insertId"]
        }
        res.status(responseData1.meta.code).json(responseData1);
      }
    }).catch(error => {
      //console.log(error)
      next(error)

      // let responseData1 = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Something is wrong."
      //   },
      //   "data": null,
      //   // "error": error
      // }
      // res.status(responseData1.meta.code).json(responseData1);
    })
  }).catch(error => {
    //console.log(error)
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Invalid student id or course"
    //   },
    //   "data": null,
    //   // "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1);
  })

}

function listByStudentId(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')

  let student_id = req.user.student_id

  Playlist.getByStudentIdFromNewLibrary(student_id, db.mysql.read).then(result => {
    //console.log(result)
    let responseData1 = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!!"
      },
      "data": result
    }
    res.status(responseData1.meta.code).json(responseData1);
  }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong."
    //   },
    //   "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1);
  })
}

function addQuestion(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')

  let playlist_id = req.body.playlist_id
  let question_id = req.body.question_id
  let student_id = req.user.student_id

  Playlist.addQuestionInPlaylist(playlist_id, question_id, student_id, db.mysql.write).then(result => {
    let responseData1 = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!!"
      },
      "data": null
    }
    res.status(responseData1.meta.code).json(responseData1);
  }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong."
    //   },
    //   "data": null,
    //   "error": error
    // }
    // if (typeof error.sqlState !== 'undefined') {
    //   delete error.sqlState
    // }
    // if (typeof error.index !== 'undefined') {
    //   delete error.index
    // }
    // if (typeof error.sql !== 'undefined') {
    //   delete error.sql
    // }
    // if (error.code == "ER_DUP_ENTRY") {
    //   responseData1 = {
    //     "meta": {
    //       "code": 200,
    //       "success": true,
    //       "message": "Something is wrong."
    //     },
    //     "data": null
    //   }
    //   responseData1['meta']['message'] = "Duplicate entry"
    // }
    // res.status(responseData1.meta.code).json(responseData1);
  })
}

function removeQuestion(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')
  let student_id=req.user.student_id
  let playlist_id = req.body.playlist_id
  let question_id = req.body.question_id

  Playlist.removeQuestionFromPlaylist(playlist_id, question_id,student_id, db.mysql.write).then(result => {
    let responseData1 = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!!"
      },
      "data": null
    }
    res.status(responseData1.meta.code).json(responseData1)
  }).catch(error => {
    next(error)
    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong."
    //   },
    //   "error": error
    // }
    
    // res.status(responseData1.meta.code).json(responseData1)
  })
}

function remove(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')

  let playlist_id = req.body.playlist_id
  let student_id = req.user.student_id

  if (student_id === '0') {
    student_id = req.user.student_id
  }

  Playlist.removeFromNewLibrary(playlist_id, student_id, db.mysql.write).then(result => {
    let responseData1 = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!!"
      },
      "data": null
    }
    res.status(responseData1.meta.code).json(responseData1)
  }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Something is wrong."
    //   },
    //   "error": error
    // }
    //
    // res.status(responseData1.meta.code).json(responseData1)
  })
}

function getNcertClassList(req, res, next) {
  db = req.app.get('db')
  Playlist.getNcertClassList(db.mysql.read)
    .then(result => {
      let responseData1 = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": result
      }
      res.status(responseData1.meta.code).json(responseData1)
    }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in fetching ncert classes"
    //   },
    //   "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1)
  })
}

async function getNcertChapterList(req, res, next) {
  db = req.app.get('db')
  let class1 = req.params.class
  let language = "english"
  // let lang = await LanguageContainer.getByCode(req.user.locale,db)
  // //console.log("language")
  // //console.log(lang)
  // if(lang.length > 0) {
  //   language = lang[0]['language']
  // }
  if(class1 == "14"){
    class1 = "10"
  }
  Playlist.getNcertChapterList(class1, db.mysql.read)
    .then(result => {
      let responseData1 = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"
        },
        "data": result
      }
      res.status(responseData1.meta.code).json(responseData1)
    }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in fetching ncert classes"
    //   },
    //   "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1)
  })
}

function getNcertExerciseList(req, res, next) {
  db = req.app.get('db')
  let class1 = req.params.class
  let chapter = req.params.chapter
  Playlist.getNcertExerciseList(class1, chapter, db.mysql.read)
    .then(result => {
      let responseData1 = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS"

        },
        "data": result
      }
      res.status(responseData1.meta.code).json(responseData1)

    }).catch(error => {
    next(error)

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in fetching ncert classes"
    //   },
    //   "error": error
    // }
    // res.status(responseData1.meta.code).json(responseData1)
  })
}

function getPlaylistYearList(req, res, next) {
  db = req.app.get('db')
  let playlist_id = req.params.playlist_id
  if (playlist_id === "JEE_MAIN") {
    Playlist.getJeeMainYears(db.mysql.read)
      .then(result => {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1)
      }).catch(error => {
      next(error)

      // let responseData1 = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Error in fetching ncert classes"
      //   },
      //   "error": error
      // }
      // res.status(responseData1.meta.code).json(responseData1)
    })
  } else if (playlist_id === "JEE_ADVANCE") {
    Playlist.getJeeAdvanceYears(db.mysql.read)
      .then(result => {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1)
      }).catch(error => {
      next(error)

      // let responseData1 = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Error in fetching ncert classes"
      //   },
      //   "error": error
      // }
      // res.status(responseData1.meta.code).json(responseData1)
    })
  } else if (playlist_id === "BOARDS_12") {
    Playlist.getClassXIIYears(db.mysql.read)
      .then(result => {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS"
          },
          "data": result

        }
        res.status(responseData1.meta.code).json(responseData1)
      }).catch(error => {
      next(error)

      // let responseData1 = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Error in fetching ncert classes"
      //   },
      //   "error": error
      // }
      // res.status(responseData1.meta.code).json(responseData1)
    })
  } else if (playlist_id === "BOARDS_10") {
    Playlist.getClassXYears(db.mysql.read)
      .then(result => {
        let responseData1 = {
          "meta": {
            "code": 200,
            "success": true,
            "message": "SUCCESS"
          },
          "data": result
        }
        res.status(responseData1.meta.code).json(responseData1)
      }).catch(error => {
      next(error)

      // let responseData1 = {
      //   "meta": {
      //     "code": 403,
      //     "success": false,
      //     "message": "Error in fetching ncert classes"
      //   },
      //   "error": error
      // }
      // res.status(responseData1.meta.code).json(responseData1)
    })
  } else {
    let responseData1 = {
      "meta": {
        "code": 403,
        "success": false,
        "message": "This playlist id not supported"
      },
    }
    res.status(responseData1.meta.code).json(responseData1)
  }
}

async function save(req, res, next) {
  db = req.app.get('db')

  let playlist_id = req.body.playlist_id
  let student_id = req.user.student_id
  let student_class = req.user.student_class
  try {
    let playlistData = await Playlist.getPlaylist(playlist_id, db.mysql.read)
    if (playlistData.length > 0) {
      let data = {
        "class": student_class,
        "name": playlistData[0]['name'],
        "student_id": student_id,
        "refer_id": playlist_id
      }
      //console.log("bulk")
      // res.send(bulk)
      let promises = []
      //console.log("test")
      //console.log(data)
      let added = await Playlist.createPlaylist(data, db.mysql.write)
      //console.log(added)
      let bulk = playlistData.map(value => {
        if (value.playlist_id && value.question_id) {
          return [added.insertId, value.question_id, student_id]
        }
      })
      let addedQ = await Playlist.addQuestionBatch([bulk], db.mysql.write)
      //console.log("tes2t")
      //console.log(addedQ)
      let responseData1 = {
        "meta": {
          "code": 200,
          "success": true,
          "message": "SUCCESS!"
        },
      }
      res.status(responseData1.meta.code).json(responseData1)
    } else {
      let responseData1 = {
        "meta": {
          "code": 403,
          "success": false,
          "message": "Invalid playlist id"
        },
      }
      res.status(responseData1.meta.code).json(responseData1)
    }
  } catch (e) {
    //console.log(e)
    next(e)

    // if (e.code === "ER_DUP_ENTRY") {
    //   let responseData1 = {
    //     "meta": {
    //       "code": 403,
    //       "success": false,
    //       "message": "Already added"
    //     },
    //     data: null,
    //     error: e
    //   }
    //   res.status(responseData1.meta.code).json(responseData1)
    // } else {
    //   let responseData1 = {
    //     "meta": {
    //       "code": 403,
    //       "success": false,
    //       "message": "Error"
    //     },
    //     data: null,
    //     error: e
    //   }
    //   res.status(responseData1.meta.code).json(responseData1)
    // }

  }
}

async function addPlaylistWrapper(req, res, next) {
  db = req.app.get('db')
  config = req.app.get('config')
  client = req.app.get('client')
  let playlist_id= req.body.playlist_id
  let question_id = req.body.question_id
  let student_id = req.user.student_id
  let promises=[]
  try{
    if(playlist_id.length>0){
      for(let i=0;i<playlist_id.length;i++){
        promises.push(Playlist.addQuestionInPlaylist(playlist_id[i], question_id, student_id, db.mysql.write))
      }
      let data=await Promise.all(promises)
      let responseData1 = {
      "meta": {
        "code": 200,
        "success": true,
        "message": "SUCCESS!!"
      },
      "data": data
    }
    res.status(responseData1.meta.code).json(responseData1);
    }else{
      let responseData1 = {
      "meta": {
        "code": 400,
        "success": true,
        "message": "Something Wrong"
      },
      "data": "Invalid Playlist Id"
    }
    res.status(responseData1.meta.code).json(responseData1);
    }
  }catch (e){
    next(e)
  }

}

module.exports = {
  view,
  customView,
  create,
  listByStudentId,
  addQuestion,
  removeQuestion,
  remove,
  getNcertClassList,
  getNcertChapterList,
  getNcertExerciseList,
  getPlaylistYearList,
  save,
  addPlaylistWrapper
}
