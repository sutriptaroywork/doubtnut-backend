const Answer = require('../../../modules/answer');
const Student = require('../../../modules/student');
// const ElasticSearch = require('../../../modules/elasticSearch')
// const VdoCipher = require('../../../modules/vdoCipher')
// const Feedback = require('../../../modules/feedback')
// const BookMarkedQuestions = require('../../../modules/bookmarkedQuestions')
// const OldVideoView = require('../../../modules/oldVideoView')
const VideoView = require('../../../modules/videoView');
const Utility = require('../../../modules/utility');
const Question = require('../../../modules/question');
// const CourseHistory = require('../../../modules/course_history')
const Playlist = require('../../../modules/playlist');
const Language = require('../../../modules/language');
// const Home = require('../../../modules/home')
const Notification = require('../../../modules/notifications');
// const Course_History = require('../../../modules/course_history')
const Answer_Container = require('./answer.container');
// const QuestionContainer = require('../../../modules/containers/question')
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerRedis = require('../../../modules/redis/answer');
const StudentContainer = require('../../../modules/containers/student');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const MysqlQuestion = require('../../../modules/mysql/question');
const PlaylistContainer = require('../../../modules/containers/playlist');
const utility_redis = require('../../../modules/redis/utility.redis');
const helper = require('../../helpers/question.helper');
const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
require('../../../modules/mongo/comment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const QuestionLog = require('../../../modules/mongo/questionAsk');
const uuidv4 = require('uuid/v4');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');

const Comment = mongoose.model('Comment');
const Data = require('../../../data/data');
const QuestionHelper = require('../../helpers/question.helper');
const QuestionContainer = require('../../../modules/containers/question');
const QueryString = require('querystring');

let db; let config; let client; let sqs; let sns;

async function viewAnswerByQuestionId(req, res, next) {
    let viewData;
    config = req.app.get('config');
    sqs = req.app.get('sqs');
    sns = req.app.get('sns');
    try {
        const { matchedQuestionSnsUrl } = Data;
        db = req.app.get('db');
        const { page } = req.body;
        const { session_id } = req.body;
        const { tab_id } = req.body;
        let { source } = req.body;
        let { parent_id } = req.body;
        // let parent_id = 21001643;
        const { ref_student_id } = req.body;
        const { student_id } = req.user;
        let data = {}; let student_class; let
            student_course;
        const ip = Utility.getClientIp(req);
        let resolvedPromisesData;

        if ((typeof ref_student_id !== 'undefined') && (ref_student_id !== '') && (ref_student_id) && !_.includes(ref_student_id, 'WHA')) {
            // ASYNC
            // console.log("hello")
            Notification.sendNotificationToStudent('referred_video', ref_student_id, null, db);
        }

        if (typeof page !== 'undefined' && typeof req.body.id !== 'undefined') {
            if (page === 'CC' || page === 'SC' || page === 'BROWSE_MC' || page === 'SEARCH_MC' || page === 'SEARCH_SC') { // CC = course chapter ; SC = subtopic chapter; BROWSE_MC - when user clicks on mc tag
                const mc_id = req.body.id;
                student_class = req.body.mc_class;
                // student_class = req.user.student_class;
                student_course = req.body.mc_course;
                let promises = []; let
                    questionWithAnswer;
                resolvedPromisesData = await AnswerContainer.getByMcId(mc_id, db);
                // console.log('resolvedPromisesData')
                // console.log(resolvedPromisesData)
                if (resolvedPromisesData.length > 0) {
                    questionWithAnswer = resolvedPromisesData[0];

                    promises = [];
                    viewData = {
                        student_id,
                        question_id: questionWithAnswer.question_id,
                        answer_id: questionWithAnswer.answer_id,
                        answer_video: questionWithAnswer.answer_video,
                        video_time: 0,
                        engage_time: 0,
                        parent_id: 0,
                        is_back: 0,
                        session_id,
                        tab_id,
                        ip_address: ip,
                        source,
                        view_from: page,
                    };
                    data = {
                        answer_id: questionWithAnswer.answer_id,
                        expert_id: questionWithAnswer.expert_id,
                        question_id: questionWithAnswer.question_id,
                        student_id: questionWithAnswer.student_id,
                        class: questionWithAnswer.class,
                        chapter: questionWithAnswer.chapter,
                        question: questionWithAnswer.question,
                        doubt: questionWithAnswer.doubt,
                        ocr_text: questionWithAnswer.ocr_text,
                        answer_video: `https://doubtnut.in/doubtnut/public/admin/answers-video/buffer?video=${questionWithAnswer.answer_video}`,
                        video_name: questionWithAnswer.answer_video,
                        is_approved: questionWithAnswer.is_approved,
                        answer_rating: questionWithAnswer.answer_rating,
                        answer_feedback: (questionWithAnswer.answer_feedback) ? questionWithAnswer.answer_feedback : '',
                        youtube_id: questionWithAnswer.youtube_id,
                        thumbnail_image: (questionWithAnswer.matched_question == null) ? (`${config.blob_url}q-thumbnail/${questionWithAnswer.question_id}.png`) : (`${config.blob_url}q-thumbnail/${questionWithAnswer.matched_question}.png`),
                        isLiked: false,
                        isDisliked: false,
                        isPlaylistAdded: false,
                        playlist_name: null,
                        view_id: null,
                    };

                    promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, questionWithAnswer.answer_id, db));
                    promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
                    promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
                    promises.push(Answer_Container.getNextMicroConcept(mc_id, student_class, student_course, data, db));
                    resolvedPromisesData = await Promise.all(promises);
                    // console.log("resolvedPromisesData")
                    // console.log(resolvedPromisesData)
                    if (resolvedPromisesData[3] && resolvedPromisesData[3].length > 0) {
                        data = resolvedPromisesData[3][0];
                    }
                    if (resolvedPromisesData[0] && resolvedPromisesData[0].length > 0) {
                        if (parseInt(resolvedPromisesData[0][0].rating) > 3) {
                            data.isLiked = true;
                            // //console.log("like");
                        } else {
                            data.isDisliked = true;
                            // //console.log("dislike");
                        }
                    }
                    if (resolvedPromisesData[1] && resolvedPromisesData[1].length > 0) {
                        data.isPlaylistAdded = true;
                        data.playlist_name = resolvedPromisesData[1].name;
                        data.playlist_id = resolvedPromisesData[1].id;
                    }
                    if (resolvedPromisesData[2]) {
                        data.view_id = resolvedPromisesData[2].insertId;
                        viewData.view_id = resolvedPromisesData[2].insertId;
                    }
                    // notification inserting function   ------------    start     //
                    if (student_id != 588226) {
                        // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer["question_id"], config, admin, db);
                    }

                    // notification  inserting function         ----------------     end  //
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data,
                    };
                    res.status(responseData.meta.code).json(responseData);
                    const data1 = {
                        action: 'VIDEO_VIEW_FROM_APP',
                        data: viewData,
                        uuid: uuidv4(),
                        timestamp: Utility.getCurrentTimeInIST(),
                    };
                    Utility.logEntry(sns, config.video_view_sns, data1);
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Please check mc id',
                        },
                        data: null,
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
            } else if (page === 'SRP' || page === 'LIBRARY' || page === 'DP' || page === 'BROWSE' || page === 'NOTIFICATION' || page === 'REFER' || page === 'DEEPLINK' || page === 'INAPP' || page === 'COMMUNITY' || page === 'SIMILAR' || page === 'HOME_FEED' || page === 'HOME' || page === 'SS' || page === 'SUGGESTIONS') {
                // if(page )
                const question_id = req.body.id;
                const promises = []; let
                    questionWithAnswer;
                let wha_id = 0;
                if (typeof question_id !== 'undefined') {
                    if (_.includes(ref_student_id, 'WHA')) {
                        const tempdata = Utility.whatsappDeeplinkTokenizer(ref_student_id);
                        source = tempdata[0];
                        parent_id = tempdata[1];
                        wha_id = tempdata[2];
                        const isUpdated = await MysqlQuestion.getQuestionParentId(parent_id, db.mysql.read);
                        console.log('---isUpdated----', isUpdated);
                        if (isUpdated.length > 0) {
                            if (isUpdated[0].parent_id == null) {
                                // if(1){
                                let today = new Date();
                                const dd = String(today.getDate()).padStart(2, '0');
                                const mm = String(today.getMonth() + 1).padStart(2, '0');
                                const yyyy = today.getFullYear();
                                today = `${mm}/${dd}/${yyyy}`;
                                const date = today;
                                const student = await StudentContainer.getById(wha_id, db);
                                const phone = student[0].mobile;
                                await MysqlQuestion.updateQuestionParentId(student_id, wha_id, parent_id, db.mysql.write);
                                console.log('date', date);
                                console.log('student8888', phone);
                                // same thingssss
                                const lastVideoWatched = await utility_redis.checkIfExists(db.redis.read, `${wha_id}lastVideoWatched`);
                                if ((lastVideoWatched == 'null' || lastVideoWatched != parent_id) && parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone + date}wa`)) == 1) {
                                    // await Utility.sendWhatsAppMessage(phone,"Hope you like my solution 🤖 \n\nI am learning like you. 📚 💻 \n\nAsk one more question! 😊", config)
                                    console.log('Video Watched');
                                    await utility_redis.lock(db.redis.write, `${wha_id}lastVideoWatched`, parent_id, 580);
                                    // setTimeout(function (){
                                    //   Utility.sendImageOnWhatsApp(phone , "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/PC_Launched_20190813.png" , config).then(result =>{

                                    //         }).catch(error =>{
                                    //             console.log(error)
                                    //         })
                                    //     },500)
                                }
                            }
                        }
                    }

                    resolvedPromisesData = await AnswerContainer.getByQuestionId(question_id, db);
                    // promises.push(QuestionContainer.getByQuestionId(question_id,db))
                    // promises.push(AnswerContainer.getByQuestionId(question_id,db))
                    // let questionWithAnswer = await Promise.all(promises)
                    // console.log("resolvedPromisesData")
                    // console.log(resolvedPromisesData)
                    // //console.log(questionWithAnswer[0].length)
                    // //console.log(questionWithAnswer[1].length)
                    if (resolvedPromisesData.length > 0) {
                        // //console.log(resolvedPromisesData)
                        questionWithAnswer = resolvedPromisesData[0];
                        // let question = questionWithAnswer[0][0]
                        // let answer = questionWithAnswer[1][0]

                        viewData = {
                            student_id,
                            question_id: questionWithAnswer.question_id,
                            answer_id: questionWithAnswer.answer_id,
                            answer_video: questionWithAnswer.answer_video,
                            video_time: 0,
                            engage_time: 0,
                            parent_id,
                            is_back: 0,
                            session_id,
                            tab_id,
                            ip_address: ip,
                            source,
                            view_from: page,
                            referred_st_id: wha_id,
                        };
                        // add comment
                        // parent_id = asked question id
                        // question_id = solution question id
                        // let commentData = {
                        //   message: "Click to view its solution",
                        //   question_id: questionWithAnswer["question_id"],
                        //   entity_type: 'unanswered',
                        //   entity_id: parent_id,
                        //   parent_id: null,
                        //   image: (questionWithAnswer["matched_question"] == null) ? (config.blob_url + "q-thumbnail/" + questionWithAnswer["question_id"] + ".png") : (config.blob_url + "q-thumbnail/" + questionWithAnswer["matched_question"] + ".png"),
                        //   student_id: 99,
                        //   student_username: "doubtnut",
                        //   student_avatar: config.logo_path
                        // }
                        // let comment = new Comment(commentData);
                        // comment.save().then(result2 => {
                        //   //console.log("result2")
                        //   //console.log(result2)
                        // }).catch(error2 => {
                        //   //console.log("error2")
                        //   //console.log(error2)
                        // })
                        if (parent_id != 0) {
                            QuestionLog.isMatchUpdateMongo(parent_id)
                                .then((response) => {
                                    // console.log(response);
                                })
                                .catch((err) => {
                                    console.log(err);
                                });
                            const findQuery = {
                                entity_id: parent_id,
                                entity_type: 'unanswered',
                                question_id: questionWithAnswer.question_id,
                                is_deleted: false,
                            };

                            QuestionHelper.sendSnsMessage({
                                type: 'matched-question',
                                sns,
                                qid: parent_id,
                                UtilityModule: Utility,
                                matchedQuestionSnsUrl,
                                config,
                            });

                            Comment.find(findQuery).then((commentsData) => {
                                // console.log("commentsData")
                                // console.log(commentsData)
                                if (commentsData.length > 0) {

                                } else {
                                    const commentData = {
                                        message: 'Click below to view its solution',
                                        question_id: questionWithAnswer.question_id,
                                        entity_type: 'unanswered',
                                        entity_id: parent_id,
                                        parent_id: null,
                                        image: (questionWithAnswer.matched_question == null) ? (`${config.blob_url}q-thumbnail/${questionWithAnswer.question_id}.png`) : (`${config.blob_url}q-thumbnail/${questionWithAnswer.matched_question}.png`),
                                        student_id: 99,
                                        student_username: 'doubtnut',
                                        student_avatar: config.logo_path,
                                    };
                                    const comment = new Comment(commentData);
                                    comment.save().then((result2) => {
                                        // console.log("result2")

                                        // console.log(result2)
                                    }).catch((error2) => {
                                        // console.log("error2")
                                        // console.log(error2)
                                    });
                                }
                            }).catch((er) => {
                                // console.log("er")
                                // console.log(er)
                            });
                            await AnswerRedis.setPreviousHistory(student_id, [{ question_id, parent_id }], db.redis.write);
                        }
                        data = {
                            answer_id: questionWithAnswer.answer_id,
                            expert_id: questionWithAnswer.expert_id,
                            question_id: questionWithAnswer.question_id,
                            student_id: questionWithAnswer.student_id,
                            class: questionWithAnswer.class,
                            chapter: questionWithAnswer.chapter,
                            question: questionWithAnswer.question,
                            doubt: questionWithAnswer.doubt,
                            ocr_text: questionWithAnswer.ocr_text,
                            answer_video: `${config.blob_url}q-video/${questionWithAnswer.answer_video}`,
                            video_name: questionWithAnswer.answer_video,
                            is_approved: questionWithAnswer.is_approved,
                            answer_rating: questionWithAnswer.answer_rating,
                            answer_feedback: (questionWithAnswer.answer_feedback) ? questionWithAnswer.answer_feedback : '',
                            youtube_id: questionWithAnswer.youtube_id,
                            thumbnail_image: (questionWithAnswer.matched_question == null) ? (`${config.blob_url}q-thumbnail/${questionWithAnswer.question_id}.png`) : (`${config.blob_url}q-thumbnail/${questionWithAnswer.matched_question}.png`),
                            isLiked: false,
                            isDisliked: false,
                            isPlaylistAdded: false,
                            view_id: null,
                        };
                        // promises = []
                        promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, questionWithAnswer.answer_id, db));
                        promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
                        promises.push(QuestionsMetaContainer.getQuestionMetaWithMcText(questionWithAnswer.question_id, db));
                        promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
                        resolvedPromisesData = await Promise.all(promises);
                        // //console.log(resolvedPromisesData[2])
                        if (resolvedPromisesData[0] && resolvedPromisesData[0].length > 0) {
                            // //console.log("hello hello");
                            // //console.log(student_id);

                            // //console.log(resolvedPromisesData[0]);
                            if (resolvedPromisesData[0][0].rating > 3) {
                                data.isLiked = true;
                            } else {
                                data.isDisliked = true;
                            }
                        }
                        if (resolvedPromisesData[1] && resolvedPromisesData[1].length > 0) {
                            data.isPlaylistAdded = true;
                            data.playlist_name = resolvedPromisesData[1].name;
                            data.playlist_id = resolvedPromisesData[1].id;
                        }
                        if (resolvedPromisesData[2]) {
                            data.question_meta = resolvedPromisesData[2][0];
                        }
                        if (resolvedPromisesData[3]) {
                            data.view_id = resolvedPromisesData[3].insertId;
                            viewData.view_id = resolvedPromisesData[3].insertId;
                        }
                        if (student_id != 588226) {
                            // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer["question_id"], config, admin, db);
                        }
                        const responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: 'SUCCESS',
                            },
                            data,
                        };
                        res.status(responseData.meta.code).json(responseData);
                        const data1 = {
                            action: 'VIDEO_VIEW_FROM_APP',
                            data: viewData,
                            uuid: uuidv4(),
                            timestamp: Utility.getCurrentTimeInIST(),
                        };
                        Utility.logEntry(sns, config.video_view_sns, data1);
                    } else {
                        // invalid question id
                        const responseData = {
                            meta: {
                                code: 403,
                                success: false,
                                message: 'Invalid question id',
                            },
                            data: 'null',
                        };
                        res.status(responseData.meta.code).json(responseData);
                    }
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Please check question id',
                        },
                        data: null,
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Invalid page',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'No page or id',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log("error");
    // console.log(e)
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
        const data1 = {
            action: 'VIDEO_VIEW_FROM_APP',
            data: viewData,
            uuid: uuidv4(),
            timestamp: Utility.getCurrentTimeInIST(),
        };
        Utility.logEntry(sns, config.video_view_sns, data1);
        next(e);
    }
}

function updateAnswerView(req, res, next) {
    db = req.app.get('db');
    sns = req.app.get('sns');
    config = req.app.get('config');
    const { view_id } = req.body;
    let { video_time } = req.body;
    const { is_back } = req.body;
    let { engage_time } = req.body;
    let sid; let qid; let
        answer_id;
    VideoView.getVideoViewStatById(view_id, db.mysql.write).then((videoViewStatRow) => {
    // console.log("videoViewStatRow")
    // console.log(videoViewStatRow)
        sid = videoViewStatRow[0].student_id;
        qid = videoViewStatRow[0].question_id;
        answer_id = videoViewStatRow[0].answer_id;

        if (videoViewStatRow.length > 0) {
            if (is_back === '1') {
                // check if view exist with is_back
                VideoView.getVideoViewStatByReferId(view_id, db.mysql.write).then((vStatsRow) => {
                    if (vStatsRow.length > 0) {
                        // if (false) {
                        // update
                        // console.log("vstatsRow")
                        // console.log(vStatsRow)
                        VideoView.updateVideoStat(video_time, engage_time, vStatsRow[0].view_id, db.mysql.write).then((row) => {
                            const view_data = {};
                            view_data.view_id = vStatsRow[0].view_id;
                            view_data.video_time = video_time;
                            view_data.engage_time = engage_time;
                            const data1 = {
                                action: 'UPDATE_VIDEO_VIEW_FROM_APP',
                                data: view_data,
                            };
                        }).catch((err) => {
                        });
                    } else {
                        // insert
                        const viewData = {
                            student_id: videoViewStatRow[0].student_id,
                            question_id: videoViewStatRow[0].question_id,
                            answer_id: videoViewStatRow[0].answer_id,
                            answer_video: videoViewStatRow[0].answer_video,
                            engage_time,
                            video_time,
                            parent_id: videoViewStatRow[0].parent_id,
                            is_back: 1,
                            session_id: videoViewStatRow[0].session_id,
                            tab_id: videoViewStatRow[0].tab_id,
                            ip_address: videoViewStatRow[0].ip_address,
                            source: videoViewStatRow[0].source,
                            refer_id: view_id,
                        };
                        VideoView.insertAnswerView(viewData, db.mysql.write).then((result) => {
                            viewData.view_id = result.insertId;
                            console.log(viewData);
                            const data1 = {
                                action: 'VIDEO_VIEW_FROM_APP',
                                data: viewData,
                                uuid: uuidv4(),
                                timestamp: Utility.getCurrentTimeInIST(),
                            };
                            Utility.logEntry(sns, config.video_view_sns, data1);

                            // let responseData = {
                            //   "meta": {
                            //     "code": 200,
                            //     "message": "SUCCESS",
                            //   },
                            //   "data": null
                            // }
                            // res.status(responseData.meta.code).json(responseData)
                        }).catch((error) => {
                            // let responseData = {
                            //   "meta": {
                            //     "code": 403,
                            //     "message": "Error in inserting",
                            //   },
                            //   "data": null
                            // }
                            // res.status(responseData.meta.code).json(responseData)
                        });
                    }
                });
            }
            if (videoViewStatRow[0].engage_time > engage_time) {
                engage_time = videoViewStatRow[0].engage_time;
            }
            if (videoViewStatRow[0].video_time > video_time) {
                video_time = videoViewStatRow[0].video_time;
            }
            VideoView.updateVideoStat(video_time, engage_time, view_id, db.mysql.write).then((row) => {
                const view_data = {};
                view_data.view_id = view_id;
                view_data.video_time = video_time;
                view_data.engage_time = engage_time;
                const data1 = {
                    action: 'UPDATE_VIDEO_VIEW_FROM_APP',
                    data: view_data,
                };
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);

                // Getting duration of the video by answer_id

                Notification.resumeVideoNotification(sid, qid, answer_id, video_time, view_id, db);
                Notification.firstQuestionEver(sid, qid, req.user.gcm_reg_id, null, db);
            }).catch((err) => {
                // let responseData = {
                //   "meta": {
                //     "code": 403,
                //     "success": false,
                //     "message": "Error in updating",
                //   },
                //   "data": null,
                //   error: err
                // }
                // res.status(responseData.meta.code).json(responseData)
                next(err);
            });
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid view id',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    }).catch((err) => {
    // console.log(err)
        next(err);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error in getting view stat",
    //   },
    //   "data": null
    // }
    // res.status(responseData.meta.code).json(responseData)
    });
}

async function viewSimilarQuestions(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        let promises = [];
        const { student_class } = req.user;
        let student_course;
        let st_lang_code;
        let languages_arrays;
        let languages_obj;
        let language;
        const limit = 10;
        const { page } = req.body;
        let question_id;
        if (typeof page !== 'undefined') {
            if (page === 'SC' || page === 'CC' || page === 'BROWSE_MC' || page === 'SEARCH_MC' || page === 'SEARCH_SC') {
                const mc_id = req.body.question_id;
                if (typeof mc_id !== 'undefined') {
                    promises.push(Question.getSimilarQuestionsByMcId(mc_id, limit, db.mysql.read));
                    promises.push(Language.getList(db.mysql.read));
                    let resolvedPromises = await Promise.all(promises);
                    let similarQuestions = resolvedPromises[0];
                    languages_arrays = resolvedPromises[1];
                    languages_obj = Utility.getLanguageObject(languages_arrays);
                    promises = [];
                    st_lang_code = req.user.locale;
                    language = languages_obj[st_lang_code];
                    if (typeof language !== 'undefined') {
                        if (language !== 'english') {
                            for (let i = 0; i < similarQuestions.length; i++) {
                                // console.log(similarQuestions)
                                promises.push(Language.changeLanguage(similarQuestions[i].question_id, language, db.mysql.read));
                            }
                        }
                        resolvedPromises = await Promise.all(promises);
                        for (let i = 0; i < resolvedPromises.length; i++) {
                            if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                                similarQuestions[i].ocr_text = resolvedPromises[i][0][language];
                            }
                        }
                        similarQuestions = Utility.addThumbnail(similarQuestions, config);
                        const responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: 'SUCCESS',
                            },
                            data: similarQuestions,
                        };
                        res.status(responseData.meta.code).json(responseData);
                    } else {
                        const responseData = {
                            meta: {
                                code: 403,
                                success: false,
                                message: 'Invalid language',
                            },
                            data: 'null',
                        };
                        res.status(responseData.meta.code).json(responseData);
                    }
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'No mc id',
                        },
                        data: 'null',
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
            } else if (page === 'SRP' || page === 'BROWSE' || page === 'NOTIFICATION' || page === 'REFER' || page === 'DEEPLINK' || page === 'INAPP' || page === 'COMMUNITY' || page === 'SIMILAR' || page === 'HOME' || page === 'SS' || page === 'SUGGESTIONS') {
                const { question_id } = req.body;
                if (typeof question_id !== 'undefined') {
                    const elasticSearchInstance = req.app.get('elasticSearchInstance');
                    let ocr;
                    promises = [];
                    promises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id));
                    promises.push(Language.getList(db.mysql.read));
                    let resolvedPromises = await Promise.all(promises);
                    promises = [];
                    if (resolvedPromises[0].length > 0) {
                        if (typeof resolvedPromises[0][0].ocr_text !== 'undefined' && resolvedPromises[0][0].ocr_text !== null) {
                            if ((resolvedPromises[0][0].ocr_text.indexOf('<math')) == -1) {
                                ocr = resolvedPromises[0][0].ocr_text;
                            } else {
                                ocr = resolvedPromises[0][0].question;
                            }
                            let elasticSearchResult = await elasticSearchInstance.findByOcr(ocr);
                            elasticSearchResult = Utility.changeElasticSearchResult(elasticSearchResult.hits.hits);
                            promises = [];
                            st_lang_code = req.user.locale;
                            // console.log(st_lang_code);
                            // console.log('lang');
                            languages_arrays = resolvedPromises[1];
                            languages_obj = Utility.getLanguageObject(languages_arrays);
                            language = languages_obj[st_lang_code];
                            if (typeof language !== 'undefined') {
                                if (language !== 'english') {
                                    for (let i = 0; i < elasticSearchResult.length; i++) {
                                        // console.log(elasticSearchResult)
                                        promises.push(Language.changeLanguage(elasticSearchResult[i].question_id, language, db.mysql.read));
                                    }
                                }
                                resolvedPromises = await Promise.all(promises);
                                for (let i = 0; i < resolvedPromises.length; i++) {
                                    if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                                        elasticSearchResult[i].ocr_text = resolvedPromises[i][0][language];
                                    }
                                }
                                for (let i = 0; i < elasticSearchResult.length; i++) {
                                    if (elasticSearchResult[i].question_id == question_id) {
                                        elasticSearchResult = elasticSearchResult.splice(i + 1, elasticSearchResult.length);
                                        break;
                                    }
                                }
                                elasticSearchResult = Utility.addThumbnail(elasticSearchResult, config);
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: 'SUCCESS',
                                    },
                                    data: elasticSearchResult,
                                };
                                res.status(responseData.meta.code).json(responseData);
                            } else {
                                const responseData = {
                                    meta: {
                                        code: 403,
                                        success: false,
                                        message: 'Invalid language',
                                    },
                                    data: null,
                                };
                                res.status(responseData.meta.code).json(responseData);
                            }
                        } else {
                            const responseData = {
                                meta: {
                                    code: 403,
                                    success: false,
                                    message: 'Invalid ocr of question id',
                                },
                                data: null,
                            };
                            res.status(responseData.meta.code).json(responseData);
                        }
                    } else {
                        const responseData = {
                            meta: {
                                code: 403,
                                success: false,
                                message: 'No question id',
                            },
                            data: null,
                        };
                        res.status(responseData.meta.code).json(responseData);
                    }
                }
            } else if ((page === 'LIBRARY' || page === 'HOME_FEED') && typeof req.body.playlist_id !== 'undefined' && req.body.playlist_id !== '' && typeof req.body.question_id !== 'undefined' && req.body.question_id !== '') {
                let playlistData; let
                    languages_obj;
                question_id = req.body.question_id;
                const { playlist_id } = req.body;
                let resolvedPromises; let
                    doubt;
                // promises = []
                // promises.push(CourseHistory.getStudentDetailsBySid(student_id, db.mysql.read))
                // promises.push(Question.getByQuestionId(question_id, db.mysql.read))
                // let resolvedPromises = await Promise.all(promises)
                // promises = []
                // if (resolvedPromises[0].length > 0) {
                //   student_class = resolvedPromises[0][0].class;
                //   student_course = resolvedPromises[0][0].course;
                //   let doubt = resolvedPromises[1][0]['doubt']
                if (playlist_id === 'TRENDING') {
                    promises.push(Question.getTrendingVideos1(student_class, limit, db.mysql.read));
                } else if (playlist_id === 'VLS') {
                    promises.push(Question.getVLSVideos(student_class, limit, db.mysql.read));
                } else if (playlist_id === 'DPP') {
                    promises.push(PlaylistContainer.getDppSimilar(student_id, limit, db));
                } else if (playlist_id === 'HISTORY') {
                    promises.push(Student.getStudentQuestionHistoryList(student_id, limit, db.mysql.read));
                } else if (playlist_id === 'DN_REC') {
                    promises.push(Question.getRecommendedQuestionsList(limit, student_class, db.mysql.read));
                } else if (playlist_id === 'SUB_ANS') {
                    promises.push(Student.subscribedStudentHistory(student_id, 1, limit, db.mysql.read));
                } else if (playlist_id === 'SUB_UNANS') {
                    promises.push(Student.subscribedStudentHistory(student_id, 0, limit, db.mysql.read));
                } else if (playlist_id === 'VIRAL') {
                    promises.push(Question.viralVideos(limit, db.mysql.read));
                } else if (playlist_id === 'JEE_ADVANCE') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db,question_id);
                    doubt = resPromise[0].doubt;
                    promises.push(Answer.getJeeAdvanceSimilarVideos(doubt, limit, db.mysql.read));
                } else if (playlist_id === 'JEE_MAIN') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    doubt = resPromise[0].doubt;
                    promises.push(Answer.getJeeMainsSimilarVideos(doubt, limit, db.mysql.read));
                } else if (playlist_id === 'BOARDS_10') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    doubt = resPromise[0].doubt;
                    promises.push(Answer.getXSimilarVideos(doubt, limit, db.mysql.read));
                } else if (playlist_id === 'BOARDS_12') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    doubt = resPromise[0].doubt;
                    promises.push(Answer.getXIISimilarVideos(doubt, limit, db.mysql.read));
                } else if (playlist_id === 'NCERT') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    doubt = resPromise[0].doubt;
                    promises.push(Answer.getNcertSimilarVideosUpdated(question_id, doubt, limit, db.mysql.read));
                } else if (playlist_id.match(/^-{0,1}\d+$/)) {
                    promises.push(Playlist.getPlaylistByPlaylistIdList(student_id, playlist_id, db.mysql.read));
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Invalid playlist id',
                        },
                        data: null,
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
                promises.push(Language.getList(db.mysql.read));
                resolvedPromises = await Promise.all(promises);
                // console.log("resolvedPromises")
                // console.log(resolvedPromises)
                promises = [];
                playlistData = resolvedPromises[0];
                languages_arrays = resolvedPromises[1];
                languages_obj = Utility.getLanguageObject(languages_arrays);
                for (let i = 0; i < playlistData.length; i++) {
                    if (playlistData[i].question_id == question_id) {
                        playlistData = playlistData.splice(i + 1, playlistData.length);
                        break;
                    }
                }
                st_lang_code = req.user.locale;
                // console.log(st_lang_code)
                // console.log(languages_obj)
                language = languages_obj[st_lang_code];
                // console.log(language)
                if (typeof language !== 'undefined') {
                    if (language !== 'english') {
                        for (let i = 0; i < playlistData.length; i++) {
                            // console.log(playlistData)
                            promises.push(Language.changeLanguage(playlistData[i].question_id, language, db.mysql.read));
                        }
                    }
                    resolvedPromises = await Promise.all(promises);
                    for (let i = 0; i < resolvedPromises.length; i++) {
                        if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                            playlistData[i].ocr_text = resolvedPromises[i][0][language];
                        }
                    }
                    playlistData = Utility.addThumbnail(playlistData, config);
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: playlistData,
                    };
                    res.status(responseData.meta.code).json(responseData);
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Invalid language',
                        },
                        data: null,
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
                // } else {
                //   let responseData = {
                //     "meta": {
                //       "code": 403,
                //       "success": false,
                //       "message": "No course history"
                //     },
                //     "data": "null"
                //
                //   }
                //   res.status(responseData.meta.code).json(responseData);
                // }
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Invalid page',
                    },
                    data: 'null',

                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'No page',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log("error");
    // console.log(e)
        next(e);

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

async function onBoarding(req, res, next) {
    try {
        db = req.app.get('db');
        sns = req.app.get('sns');
        config = req.app.get('config');
        const { page } = req.body;
        const { video_time } = req.body;
        const { engage_time } = req.body;
        const { source } = req.body;
        const { student_id } = req.user;
        const ip = Utility.getClientIp(req);
        const is_back = (req.body.is_back) ? req.body.is_back : 0;
        let viewData; let
            data;
        if (typeof page !== 'undefined' && typeof req.body.question_id !== 'undefined') {
            if (page === 'ONBOARDING' || page === 'STRUCTURED_ONBOARDING' || page === 'STRUCTURED') { // CC = course chapter ; SC = subtopic chapter; BROWSE_MC - when user clicks on mc tag
                // if(page )
                const { question_id } = req.body;
                if (typeof question_id !== 'undefined') {
                    let questionWithAnswer = await Answer.viewAnswerByQid(question_id, db.mysql.read);
                    // //console.log("questionWithAnswer")
                    // //console.log(questionWithAnswer)
                    if (questionWithAnswer.length > 0) {
                        questionWithAnswer = questionWithAnswer[0];
                        viewData = {
                            student_id,
                            question_id: questionWithAnswer.question_id,
                            answer_id: questionWithAnswer.answer_id,
                            answer_video: questionWithAnswer.answer_video,
                            video_time,
                            engage_time,
                            parent_id: 0,
                            is_back,
                            session_id: 0,
                            tab_id: 0,
                            ip_address: ip,
                            source,
                            view_from: page,
                        };
                        data = {
                            answer_id: questionWithAnswer.answer_id,
                            question_id: questionWithAnswer.question_id,
                            view_id: null,
                        };

                        const resolvedPromisesData = await VideoView.insertAnswerView(viewData, db.mysql.write);

                        if (resolvedPromisesData) {
                            data.view_id = resolvedPromisesData.insertId;
                            viewData.view_id = resolvedPromisesData.insertId;
                        }
                        const data1 = {
                            action: 'VIDEO_VIEW_FROM_APP',
                            data: viewData,
                            uuid: uuidv4(),
                            timestamp: Utility.getCurrentTimeInIST(),
                        };
                        console.log(data1);
                        Utility.logEntry(sns, config.video_view_sns, data1);
                        const responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: 'SUCCESS',
                            },
                            data,
                        };
                        res.status(responseData.meta.code).json(responseData);
                    } else {
                        // invalid question id
                        const responseData = {
                            meta: {
                                code: 403,
                                success: false,
                                message: 'Invalid question id',
                            },
                            data: 'null',
                        };
                        res.status(responseData.meta.code).json(responseData);
                    }
                } else {
                    const responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: 'Please check question id',
                        },
                        data: null,
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
            } else {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Invalid page',
                    },
                    data: null,
                };
                res.status(responseData.meta.code).json(responseData);
            }
        } else {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'No page or id',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error from catch"
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    viewAnswerByQuestionId, updateAnswerView, viewSimilarQuestions, onBoarding,
};
