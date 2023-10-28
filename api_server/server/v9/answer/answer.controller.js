/**
 * @Author: xesloohc
 * @Date:   2019-07-08T15:15:59+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-06T01:45:26+05:30
 */

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
const QuestionContainer = require('../../../modules/containers/question');
const QuestionLog = require('../../../modules/mongo/questionAsk');
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerRedis = require('../../../modules/redis/answer');
const StudentContainer = require('../../../modules/containers/student');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const PlaylistContainer = require('../../../modules/containers/playlist');
const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
const MysqlAnswer = require('../../../modules/mysql/answer');
const MysqlQuestion = require('../../../modules/mysql/question');
const appConfigSql = require('../../../modules/mysql/appConfig');
const redisQuestionContainer = require('../../../modules/redis/question');
const elasticContainer = require('../../../modules/containers/elasticSearch');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const LanguageContainer = require('../../../modules/containers/language');
const FeedbackContainer = require('../../../modules/containers/feedback');
const utility_redis = require('../../../modules/redis/utility.redis');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const helper = require('../../helpers/question.helper');
require('../../../modules/mongo/comment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');

const Comment = mongoose.model('Comment');
const uuidv4 = require('uuid/v4');
const Data = require('../../../data/data');
const QuestionHelper = require('../../helpers/question.helper');
// const _ = require('lodash');
let db; let config; let client; let sqs; let
    sns;

async function viewAnswerByQuestionId(req, res, next) {
    sqs = req.app.get('sqs');
    sns = req.app.get('sns');
    config = req.app.get('config');
    let viewData;
    try {
        const { matchedQuestionSnsUrl } = Data;
        db = req.app.get('db');
        console.log('sssssssssssssssssssssssssssssssssssss');
        const { page } = req.body;
        const { session_id } = req.body;
        const { tab_id } = req.body;
        let { source } = req.body;
        let { parent_id } = req.body;
        const { ref_student_id } = req.body;
        const { student_id } = req.user;
        let data = {}; let { student_class } = req.user; let student_course; let
            hls_url;
        const ip = Utility.getClientIp(req);
        let resolvedPromisesData;
        const hls_timeout = 0;
        console.log(page);
        const viral_video_student_id_arr = [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 98];
        if ((typeof ref_student_id !== 'undefined') && (ref_student_id !== '') && (ref_student_id) && !_.includes(ref_student_id, 'WHA')) {
            // ASYNC
            Notification.sendNotificationToStudent('referred_video', ref_student_id, null, db);
        }

        if (typeof page === 'undefined' && typeof req.body.id === 'undefined') {
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'No page or id',
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (typeof req.body.id === 'undefined') {
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Please check question id',
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const pageTopics = ['CC', 'SC', 'BROWSE_MC', 'HOME_PAGE_CC', 'SEARCH_MC', 'SEARCH_SC'];
        const otherPage = ['SRP', 'LIBRARY', 'DP', 'BROWSE', 'NOTIFICATION', 'REFER', 'DEEPLINK', 'INAPP', 'COMMUNITY', 'SIMILAR', 'HOME_FEED', 'HOME', 'SS', 'SUGGESTIONS', 'APP_INDEXING', 'HOME_PAGE', 'VIDEO_HISTORY', 'SEARCH_SRP'];

        if (_.includes(pageTopics, page)) {
            const mc_id = req.body.id;
            student_class = req.body.mc_class;
            // student_class = req.user.student_class;
            student_course = req.body.mc_course;
            let promises = []; let
                questionWithAnswer;
            resolvedPromisesData = await AnswerContainer.getByMcId(mc_id, db);
            if (resolvedPromisesData.length < 1) {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Please check mc id',
                    },
                    data: null,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            questionWithAnswer = resolvedPromisesData[0];
            // console.log("resolvedPromisesData")
            // console.log(resolvedPromisesData[0])
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
            const answer_video_name = resolvedPromisesData[0].answer_video.split('.')[0];
            hls_url = `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`;

            let ocr;
            if ((questionWithAnswer.ocr_text.indexOf('<math')) == -1) {
                ocr = questionWithAnswer.ocr_text;
            } else {
                ocr = questionWithAnswer.question;
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
                answer_video: hls_url,
                fallback_answer_video: config.cdn_video_url + questionWithAnswer.answer_video,
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
                type: 'answered',
                id: questionWithAnswer.question_id,
                total_views: 0,
                hls_timeout,
            };

            const videoViewCheck = await AppConfigurationContainer.getConfigByKey(db, 'video_view_stats');
            if (videoViewCheck && videoViewCheck.length > 0 && videoViewCheck[0].key_value == '0') {
                promises.push([]);
            } else {
                promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
            }
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, questionWithAnswer.answer_id, db));
            promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
            promises.push(Answer_Container.getNextMicroConcept(mc_id, student_class, student_course, data, db));
            promises.push(QuestionContainer.getTotalViewsWeb(questionWithAnswer.question_id, db));
            resolvedPromisesData = await Promise.all(promises);

            if (resolvedPromisesData[3] && resolvedPromisesData[3].length > 0) {
                data = resolvedPromisesData[3][0];
            }
            if (resolvedPromisesData[1] && resolvedPromisesData[1].length > 0) {
                if (parseInt(resolvedPromisesData[1][0].rating) > 3) {
                    data.isLiked = true;
                    // //console.log("like");
                } else {
                    data.isDisliked = true;
                    // //console.log("dislike");
                }
            }
            if (resolvedPromisesData[2] && resolvedPromisesData[2].length > 0) {
                data.isPlaylistAdded = true;
                data.playlist_name = resolvedPromisesData[2].name;
                data.playlist_id = resolvedPromisesData[2].id;
            }

            if (resolvedPromisesData[0] && resolvedPromisesData[0].insertId) {
                data.view_id = resolvedPromisesData[0].insertId;
                viewData.view_id = resolvedPromisesData[0].insertId;
            } else {
                data.view_id = '1';
                viewData.view_id = '1';
            }
            // notification inserting function   ------------    start     //
            if (student_id != 588226) {
                // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer["question_id"], config, admin, db);
            }

            const descrip = await AnswerContainer.getAnswerTitleAndDescription2(data, db);
            promises = [];
            promises.push(AnswerContainer.getLikeDislikeStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getWhatsappShareStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            const tempPromiseData = await Promise.all(promises);
            data.likes_count = tempPromiseData[0][0];
            data.dislikes_count = tempPromiseData[0][1];
            data.share_count = tempPromiseData[1][0];

            if (descrip.length > 0) {
                data.title = ocr;
                data.description = ocr;
                data.weburl = descrip;
            } else {
                data.title = ocr;
                data.description = ocr;
                data.weburl = '';
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
            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'WATCH_LIBRARY_VIDEO',
                user_id: req.user.student_id,
                refer_id: question_id,
            });
            const data1 = {
                action: 'VIDEO_VIEW_FROM_APP',
                data: viewData,
                uuid: uuidv4(),
                timestamp: Utility.getCurrentTimeInIST(),
            };
            Utility.logEntry(sns, config.video_view_sns, data1);
        } else if (_.includes(otherPage, page)) {
            const question_id = req.body.id;
            let wha_id = 0;
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
            let promises = []; let questionWithAnswer; let type; let
                id;

            resolvedPromisesData = await AnswerContainer.getByQuestionId(question_id, db);
            if (resolvedPromisesData.length < 1) {
                const responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Invalid question id',
                    },
                    data: 'null',
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            questionWithAnswer = resolvedPromisesData[0];
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
            if (_.includes(viral_video_student_id_arr, questionWithAnswer.student_id)) {
                type = 'viral_videos';
                // get engagement id from question incase of viral videos
                const d = await AnswerContainer.getEngagementId(student_class, questionWithAnswer.question_id, db);
                if (d.length > 0) {
                    id = d[0].id;
                } else {
                    // check pinned post
                    type = 'answered';
                    id = questionWithAnswer.question_id;
                }
            } else {
                // check if its pinned post
                const is_pinned = await AnswerContainer.getPinnedPostId(student_class, questionWithAnswer.question_id, db);
                if (is_pinned.length > 0) {
                    type = is_pinned[0].post_type;
                    id = `${is_pinned[0].post_type}_pinned`;
                } else {
                    type = 'answered';
                    id = questionWithAnswer.question_id;
                }
            }

            const answer_video_name = resolvedPromisesData[0].answer_video.split('.')[0];
            hls_url = `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`;
            let ocr;
            if ((questionWithAnswer.ocr_text.indexOf('<math')) == -1) {
                ocr = questionWithAnswer.ocr_text;
            } else {
                ocr = questionWithAnswer.question;
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
                answer_video: hls_url,
                fallback_answer_video: config.cdn_video_url + questionWithAnswer.answer_video,
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
                type,
                id,
                total_views: 0,
                hls_timeout,
            };
            // add comment
            // parent_id = asked question id
            // question_id = solution question id

            if (parent_id != 0) {
                QuestionLog.isMatchUpdateMongo(parent_id)
                    .then((response) => {
                        //  console.log(response);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
                QuestionHelper.sendSnsMessage({
                    type: 'matched-question',
                    sns,
                    qid: parent_id,
                    UtilityModule: Utility,
                    matchedQuestionSnsUrl,
                    config,
                });

                /*
Activity Stream Entry
*/
                db.redis.read.publish('activitystream_service', JSON.stringify({
                    actor_id: req.user.student_id,
                    actor_type: 'USER',
                    actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                    verb: 'MATCHED',
                    object: '',
                    object_id: questionWithAnswer.question_id,
                    object_type: 'QUESTION',
                    target_id: parent_id,
                    target_type: 'QUESTION',
                    target: '',
                }));
                const findQuery = {
                    entity_id: parent_id,
                    entity_type: 'matched',
                    question_id: questionWithAnswer.question_id,
                    is_deleted: false,
                };

                Comment.find(findQuery).then((commentsData) => {
                    // console.log("commentsData")
                    // console.log(commentsData)
                    if (commentsData.length > 0) {
                    } else {
                        const commentData = {
                            message: 'Click below to view its solution',
                            question_id: questionWithAnswer.question_id,
                            entity_type: 'matched',
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

                            /*
Activity Stream Entry
*/
                            db.redis.read.publish('activitystream_service', JSON.stringify({
                                actor_id: req.user.student_id,
                                actor_type: 'USER',
                                actor: { student_username: req.user.student_username, user_avatar: req.user.img_url },
                                verb: 'POST',
                                object: result2,
                                object_id: result2._id,
                                object_type: 'COMMENT',
                                target_id: result2.entity_id,
                                target_type: result2.entity_type,
                                target: '',
                            }));
                        }).catch((error2) => {
                            // console.log("error2")
                            // console.log(error2)
                        });
                    }
                }).catch((er) => {
                    // console.log("er")
                    // console.log(er)
                });
                // update matched
                await MysqlQuestion.updateMatched(parent_id, db.mysql.write);
                const data1 = {
                    action: 'UPDATE_PARENT_ID_FROM_APP',
                    question_id: parent_id,
                };
                Utility.logEntry(sns, config.update_parent_id_sns, data1);
                await AnswerRedis.setPreviousHistory(student_id, [{
                    question_id,
                    parent_id,
                }], db.redis.write);
            }

            // promises = []
            const videoViewCheck = await AppConfigurationContainer.getConfigByKey(db, 'video_view_stats');
            if (videoViewCheck && videoViewCheck.length > 0 && videoViewCheck[0].key_value == '0') {
                promises.push([]);
            } else {
                promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
            }
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, questionWithAnswer.answer_id, db));
            promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
            promises.push(QuestionsMetaContainer.getQuestionMetaWithMcText(questionWithAnswer.question_id, db));
            promises.push(QuestionContainer.getTotalViewsWeb(questionWithAnswer.question_id, db));
            resolvedPromisesData = await Promise.all(promises);
            if (resolvedPromisesData[1] && resolvedPromisesData[1].length > 0) {
                if (resolvedPromisesData[1][0].rating > 3) {
                    data.isLiked = true;
                } else {
                    data.isDisliked = true;
                }
            }
            if (resolvedPromisesData[2] && resolvedPromisesData[2].length > 0) {
                data.isPlaylistAdded = true;
                data.playlist_name = resolvedPromisesData[2].name;
                data.playlist_id = resolvedPromisesData[2].id;
            }
            if (resolvedPromisesData[3]) {
                data.question_meta = resolvedPromisesData[3][0];
            }
            if (resolvedPromisesData[0] && resolvedPromisesData[0].insertId) {
                data.view_id = resolvedPromisesData[0].insertId;
                viewData.view_id = resolvedPromisesData[0].insertId;
            } else {
                data.view_id = '1';
                viewData.view_id = '1';
            }
            if (student_id != 588226) {
                Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer.question_id, config, null, db);
            }
            if (page == 'SRP') {
                console.log('SQS');
                Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                    action: 'WATCH_MATCHED_VIDEO',
                    user_id: req.user.student_id,
                    refer_id: parent_id,
                });
            } else {
                Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                    action: 'WATCH_LIBRARY_VIDEO',
                    user_id: req.user.student_id,
                    refer_id: question_id,
                });
            }

            const descrip = await AnswerContainer.getAnswerTitleAndDescription2(data, db);
            promises = [];
            promises.push(AnswerContainer.getLikeDislikeStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getWhatsappShareStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            const tempPromiseData = await Promise.all(promises);

            data.likes_count = tempPromiseData[0][0];
            data.dislikes_count = tempPromiseData[0][1];
            data.share_count = tempPromiseData[1][0];
            if (descrip.length > 0) {
                data.title = ocr;
                data.description = ocr;
                data.weburl = descrip;
            } else {
                data.title = ocr;
                data.description = ocr;
                data.weburl = '';
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
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid page',
                },
                data: null,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
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
        const color = ['#eff6fe', '#eff6fe', '#eff6fe', '#eff6fe', '#eff6fe', '#eff6fe'];
        const feedback = {};
        feedback.feedback_text = 'Happy with the Solutions';
        feedback.bg_color = _.sample(color);
        const feedbackQid = req.body.parent_id;
        if (feedbackQid !== null && feedbackQid !== undefined && feedbackQid.length > 0 && feedbackQid !== '0') {
            const feedback_show = await FeedbackContainer.getFeedback(db, student_id, 'question_ask', feedbackQid);

            if (feedback_show.length > 0) {
                if (feedback_show[0].is_like !== 0 && feedback_show[0].is_like !== 1) {
                    feedback.is_show = 1;
                } else {
                    feedback.is_show = 0;
                }
            } else {
                feedback.is_show = 1;
            }
        } else {
            feedback.is_show = 0;
        }

        let question_id;
        if (typeof page !== 'undefined') {
            if (page === 'SC' || page === 'CC' || page === 'BROWSE_MC' || page === 'SEARCH_MC' || page === 'SEARCH_SC') {
                const mc_id = req.body.question_id;
                const { playlist_id } = req.body;
                if (typeof mc_id !== 'undefined') {
                    if (playlist_id !== undefined && !_.isNull(playlist_id) && playlist_id !== '' && playlist_id === 'SSC') {
                        promises.push(Question.getSimilarQuestionsByMcIdForSSC(mc_id, 5, db.mysql.read));
                    } else {
                        promises.push(Question.getSimilarQuestionsByMcId(mc_id, limit, db.mysql.read));
                    }
                    promises.push(Language.getList(db.mysql.read));
                    let resolvedPromises = await Promise.all(promises);
                    let similarQuestions = resolvedPromises[0];
                    const matchesQuestionArray = _.join(_.keys(_.groupBy(similarQuestions, 'question_id')), ',');
                    // console.log(matchesQuestionArray)
                    /// /console.log(similarQuestions)
                    languages_arrays = resolvedPromises[1];
                    languages_obj = Utility.getLanguageObject(languages_arrays);
                    promises = [];
                    st_lang_code = req.user.locale;
                    language = languages_obj[st_lang_code];
                    if (typeof language === 'undefined') {
                        language = 'english';
                    }
                    if (typeof language !== 'undefined') {
                        let matchedQuestionsHtml; let groupedMatchedQuestionHtml;
                        if (language == 'english') {
                            if (similarQuestions.length > 0) {
                                matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                            }
                            groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                        }
                        for (let i = 0; i < similarQuestions.length; i++) {
                            if (language !== 'english') {
                                promises.push(Language.changeLanguage(similarQuestions[i].question_id, language, db.mysql.read));
                            } else if (language == 'english' && groupedMatchedQuestionHtml[similarQuestions[i].question_id] && groupedMatchedQuestionHtml[similarQuestions[i].question_id].length > 0) {
                                similarQuestions[i].html = groupedMatchedQuestionHtml[similarQuestions[i].question_id][0].html;
                            }
                        }

                        resolvedPromises = await Promise.all(promises);
                        for (let i = 0; i < resolvedPromises.length; i++) {
                            if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                                similarQuestions[i].ocr_text = resolvedPromises[i][0][language];
                            }
                        }
                        similarQuestions = Utility.addThumbnailWithLanguage(similarQuestions, st_lang_code, config);
                        similarQuestions = await getToatalLikesShare(similarQuestions, student_id, db);
                        const whatsappData = await appConfigConatiner.getWhatsappData(db, student_class);
                        if (whatsappData.length > 0) {
                            const data1 = Utility.getWhatsappDataModified(whatsappData);
                            similarQuestions.splice(1, 0, data1);
                        }
                        // concept video goes from here

                        const data = { similar_video: similarQuestions, feedback };
                        const responseData = {
                            meta: {
                                code: 200,
                                success: true,
                                message: 'SUCCESS',
                            },
                            data, // similarQuestions
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
            } else if (page === 'SRP' || page === 'BROWSE' || page === 'NOTIFICATION' || page === 'REFER' || page === 'DEEPLINK' || page === 'INAPP' || page === 'COMMUNITY' || page === 'SIMILAR' || page === 'HOME' || page === 'SS' || page === 'SUGGESTIONS' || page === 'APP_INDEXING' || page === 'VIDEO_HISTORY' || page === 'SEARCH_SRP') {
                const { question_id } = req.body;

                if (typeof question_id !== 'undefined') {
                    const elasticSearchInstance = req.app.get('elasticSearchInstance');
                    const specialPlaylistStudentId = [100];
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

                            // technothlon if
                            if (resolvedPromises[0][0].student_id === 21) {
                                const split_doubt = resolvedPromises[0][0].doubt.split('_');
                                const class_type = split_doubt[1];
                                const year = split_doubt[2];
                                const prom = [];
                                prom.push(MysqlQuestion.getTechnothlonQuestionList(question_id, resolvedPromises[0][0].student_id, `${class_type}_${year}`, db.mysql.read));
                                prom.push(appConfigConatiner.getWhatsappData(db, student_class));
                                const resolvedP = await Promise.all(prom);
                                let questionList = resolvedP[0];
                                const whatsappData = resolvedP[1];
                                questionList = Utility.addThumbnailWithLanguage(questionList, 'en', config);
                                questionList = await getToatalLikesShare(questionList, student_id, db);
                                for (let i = 0; i < questionList.length; i++) {
                                    if (questionList[i].question_id == question_id) {
                                        const left_data = questionList.slice(0, i);
                                        const right_data = questionList.slice(i + 1, questionList.length);
                                        questionList = right_data.concat(left_data);
                                        break;
                                    }
                                }
                                if (whatsappData.length > 0) {
                                    const data1 = Utility.getWhatsappDataModified(whatsappData);
                                    questionList.splice(1, 0, data1);
                                }
                                const data = { similar_video: questionList, feedback };
                                // res.send(data)
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: 'SUCCESS',
                                    },
                                    data, // elasticSearchResult
                                };
                                res.status(responseData.meta.code).json(responseData);
                            } else if (_.includes(specialPlaylistStudentId, resolvedPromises[0][0].student_id)) {
                                const split_doubt = resolvedPromises[0][0].doubt.split('_');
                                const doubt = `${split_doubt[0]}_${split_doubt[1]}_${split_doubt[2]}_${split_doubt[3]}`;
                                const prom = [];
                                prom.push(MysqlQuestion.getSpecialQuestionList(question_id, resolvedPromises[0][0].student_id, resolvedPromises[0][0].class, doubt, db.mysql.read));
                                prom.push(appConfigConatiner.getWhatsappData(db, student_class));
                                const resolvedP = await Promise.all(prom);
                                let questionList = resolvedP[0];
                                const whatsappData = resolvedP[1];
                                questionList = Utility.addThumbnailWithLanguage(questionList, 'en', config);
                                questionList = await getToatalLikesShare(questionList, student_id, db);
                                for (let i = 0; i < questionList.length; i++) {
                                    if (questionList[i].question_id == question_id) {
                                        const left_data = questionList.slice(0, i);
                                        const right_data = questionList.slice(i + 1, questionList.length);
                                        questionList = right_data.concat(left_data);
                                        break;
                                    }
                                }
                                if (whatsappData.length > 0) {
                                    const data1 = Utility.getWhatsappDataModified(whatsappData);
                                    questionList.splice(1, 0, data1);
                                }

                                const data = { similar_video: questionList, feedback };
                                // res.send(data)
                                const responseData = {
                                    meta: {
                                        code: 200,
                                        success: true,
                                        message: 'SUCCESS',
                                    },
                                    data, // elasticSearchResult
                                };
                                res.status(responseData.meta.code).json(responseData);
                            } else {
                                let elasticSearchResult = await elasticSearchInstance.findByOcr(ocr);
                                elasticSearchResult = Utility.changeElasticSearchResult(elasticSearchResult.hits.hits);
                                const matchesQuestionArray = _.join(_.keys(_.groupBy(elasticSearchResult, 'question_id')), ',');
                                // console.log("ss")
                                // console.log(matchesQuestionArray)
                                promises = [];
                                st_lang_code = req.user.locale;
                                // console.log(st_lang_code);
                                // console.log('lang');
                                languages_arrays = resolvedPromises[1];
                                languages_obj = Utility.getLanguageObject(languages_arrays);
                                language = languages_obj[st_lang_code];
                                if (typeof language === 'undefined') {
                                    language = 'english';
                                }
                                if (typeof language !== 'undefined') {
                                    if (language !== 'english') {
                                        for (let i = 0; i < elasticSearchResult.length; i++) {
                                            promises.push(QuestionContainer.getLocalisedQuestion(elasticSearchResult[i].question_id, language, db));
                                        }
                                    }
                                    resolvedPromises = await Promise.all(promises);
                                    for (let i = 0; i < resolvedPromises.length; i++) {
                                        if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                                            elasticSearchResult[i].ocr_text = resolvedPromises[i][0][language];
                                        }
                                    }
                                    let matchedQuestionsHtml; let groupedMatchedQuestionHtml;
                                    if (language == 'english') {
                                        if (elasticSearchResult.length > 0) {
                                            matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                                        }
                                        groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                                    }

                                    for (let i = 0; i < elasticSearchResult.length; i++) {
                                        if (elasticSearchResult[i].question_id == question_id) {
                                            const left_data = elasticSearchResult.slice(0, i);
                                            const right_data = elasticSearchResult.slice(i + 1, elasticSearchResult.length);
                                            elasticSearchResult = right_data.concat(left_data);
                                            break;
                                        }
                                    }
                                    for (let i = 0; i < elasticSearchResult.length; i++) {
                                        if (language == 'english' && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id] && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id].length > 0) {
                                            elasticSearchResult[i].html = groupedMatchedQuestionHtml[elasticSearchResult[i].question_id][0].html;
                                        }
                                    }

                                    elasticSearchResult = Utility.addThumbnailWithLanguage(elasticSearchResult, st_lang_code, config);
                                    elasticSearchResult = await getToatalLikesShare(elasticSearchResult, student_id, db);
                                    const whatsappData = await appConfigConatiner.getWhatsappData(db, student_class);
                                    if (whatsappData.length > 0) {
                                        const data1 = Utility.getWhatsappDataModified(whatsappData);
                                        elasticSearchResult.splice(1, 0, data1);
                                    }
                                    let concept_video = [];
                                    if (question_id) {
                                        const temp = await Question.getMcIdbyQid(student_class, question_id, db.mysql.read);
                                        if (temp && temp.length > 0 && temp[0].microconcept) {
                                            const temp1 = await Question.getSimilarQuestionsByMcId(temp[0].microconcept, 2, db.mysql.read);
                                            if (temp1 && temp1.length > 0) {
                                                concept_video = Utility.addThumbnailWithLanguage(temp1, st_lang_code, config);
                                            }
                                            for (let j = 0; j < concept_video.length; j++) {
                                                concept_video[j].bg_color = _.sample(color);
                                                concept_video[j].resource_type = 'video';
                                            }
                                        }
                                    }
                                    const data = { concept_video, similar_video: elasticSearchResult, feedback };

                                    const responseData = {
                                        meta: {
                                            code: 200,
                                            success: true,
                                            message: 'SUCCESS',
                                        },
                                        data, // elasticSearchResult
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
            } else if ((page === 'LIBRARY' || page === 'HOME_FEED' || page === 'HOME_PAGE') && typeof req.body.playlist_id !== 'undefined' && req.body.playlist_id !== '' && typeof req.body.question_id !== 'undefined' && req.body.question_id !== '') {
                /// /console.log("hello -------------------");
                let playlistData; let
                    languages_obj;
                question_id = req.body.question_id;
                const { playlist_id } = req.body;
                let resolvedPromises; let
                    doubt;
                let language = 'english';
                const lang = await LanguageContainer.getByCode(req.user.locale, db);
                if (lang.length > 0) {
                    language = lang[0].language;
                }

                if (playlist_id === 'TRENDING') {
                    promises.push(Question.getTrendingVideos(student_class, limit, language, db.mysql.read));
                } else if (playlist_id === 'CONCEPT_VIDEOS') {
                    const temp = await Question.getMcIdbyQid(student_class, question_id, db.mysql.read);
                    promises.push(Question.getSimilarQuestionsByMcId(temp[0].microconcept, limit, db.mysql.read));
                } else if (playlist_id === 'SFY') {
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
                            const matchesQuestionArray = _.join(_.keys(_.groupBy(elasticSearchResult, 'question_id')), ',');
                            // console.log("ss")
                            // console.log(matchesQuestionArray)
                            promises = [];
                            st_lang_code = req.user.locale;
                            // console.log(st_lang_code);
                            // console.log('lang');
                            languages_arrays = resolvedPromises[1];
                            languages_obj = Utility.getLanguageObject(languages_arrays);
                            language = languages_obj[st_lang_code];
                            if (typeof language === 'undefined' || language !== 'english') {
                                language = 'english';
                            }
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
                                let matchedQuestionsHtml; let groupedMatchedQuestionHtml;
                                if (language == 'english') {
                                    if (elasticSearchResult.length > 0) {
                                        matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                                    }
                                    // console.log(matchedQuestionsHtml)
                                    groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                                }

                                for (let i = 0; i < elasticSearchResult.length; i++) {
                                    if (elasticSearchResult[i].question_id == question_id) {
                                        elasticSearchResult.splice(i, 1);
                                        break;
                                    }
                                }
                                for (let i = 0; i < elasticSearchResult.length; i++) {
                                    if (language == 'english' && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id] && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id].length > 0) {
                                        elasticSearchResult[i].html = groupedMatchedQuestionHtml[elasticSearchResult[i].question_id][0].html;
                                    }
                                }
                                // elasticSearchResult = Utility.addThumbnail(elasticSearchResult, config)
                                elasticSearchResult = Utility.addThumbnailWithLanguage(elasticSearchResult, st_lang_code, config);
                                promises.push(elasticSearchResult);
                            }
                        }
                    }
                } else if (playlist_id === 'VLS') {
                    promises.push(Question.getVLSVideos(student_class, limit, db.mysql.read));
                } else if (playlist_id === 'DPP') {
                    promises.push(PlaylistContainer.getDppSimilar(student_id, limit, db));
                } else if (playlist_id === 'CRASH_COURSE') {
                    promises.push(PlaylistContainer.getCrashCourseSimilar(student_class, limit, db));
                } else if (playlist_id === 'HISTORY') {
                    promises.push(Student.getStudentQuestionHistoryList(student_id, limit, db.mysql.read));
                } else if (playlist_id === 'DN_REC') {
                    promises.push(Question.getRecommendedQuestionsList(limit, student_class, db.mysql.read));
                } else if (playlist_id === 'SUB_ANS') {
                    promises.push(Student.subscribedStudentHistory(student_id, 1, limit, db.mysql.read));
                } else if (playlist_id === 'SUB_UNANS') {
                    promises.push(Student.subscribedStudentHistory(student_id, 0, limit, db.mysql.read));
                } else if (playlist_id === 'VIRAL' || playlist_id === 'LATEST_FROM_DOUBTNUT') {
                    promises.push(Question.viralVideos(limit, student_class, db.mysql.read));
                } else if (playlist_id === 'JEE_ADVANCE') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    promises.push(Answer.getJeeAdvanceSimilarVideos(resPromise[0].doubt, limit, db.mysql.read));
                } else if (playlist_id === 'JEE_MAIN') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    promises.push(Answer.getJeeMainsSimilarVideos(resPromise[0].doubt, limit, db.mysql.read));
                } else if (playlist_id === 'BOARDS_10') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    promises.push(Answer.getXSimilarVideos(resPromise[0].doubt, limit, db.mysql.read));
                } else if (playlist_id === 'BOARDS_12') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    promises.push(Answer.getXIISimilarVideos(resPromise[0].doubt, limit, db.mysql.read));
                } else if (playlist_id === 'NCERT') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    promises.push(Answer.getNcertSimilarVideosUpdated(question_id, resPromise[0].doubt, limit, db.mysql.read));
                } else if (playlist_id === 'TECHNOTHLON') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    const split_doubt = resPromise[0].doubt.split('_');
                    const class_type = split_doubt[1];
                    const year = split_doubt[2];
                    promises.push(MysqlQuestion.getTechnothlonQuestionList(question_id, resPromise[0].student_id, `${class_type}_${year}`, db.mysql.read));
                } else if (playlist_id.includes('BOOKS_')) {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    const student_id = playlist_id.replace('BOOKS_', '');
                    promises.push(Answer.getBooksSimilarVideos(student_id, question_id, resPromise[0].doubt, limit, db.mysql.read));
                } else if (playlist_id == 'TRICKY_QUESTION') {
                    const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    const split_doubt = resPromise[0].doubt.split('_');
                    const doubt = `${split_doubt[0]}_${split_doubt[1]}_${split_doubt[2]}_${split_doubt[3]}`;
                    promises.push(MysqlQuestion.getSpecialQuestionList(question_id, resPromise[0].student_id, resPromise[0].class, doubt, db.mysql.read));
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

                promises = [];
                playlistData = resolvedPromises[0];
                languages_arrays = resolvedPromises[1];
                languages_obj = Utility.getLanguageObject(languages_arrays);
                for (let i = 0; i < playlistData.length; i++) {
                    if (playlistData[i].question_id == question_id) {
                        // playlistData = playlistData.splice(-1*(playlistData.length),playlistData.length-i); //remove element before i index
                        const left_data = playlistData.slice(0, i);
                        const right_data = playlistData.slice(i + 1, playlistData.length);
                        playlistData = right_data.concat(left_data);
                        break;
                    }
                }
                for (let i = 0; i < playlistData.length; i++) {
                    if (typeof playlistData[i].ocr_text !== 'undefined' && playlistData[i].ocr_text !== null) {
                        playlistData[i].ocr_text = playlistData[i].ocr_text.replace(/'/g, "\\'");
                    }
                }
                const matchesQuestionArray = _.join(_.keys(_.groupBy(playlistData, 'question_id')), ',');
                // console.log(matchesQuestionArray)
                let matchedQuestionsHtml;
                let groupedMatchedQuestionHtml;
                if (language == 'english' && playlistData.length > 0) {
                    matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                    groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                }
                st_lang_code = req.user.locale;
                language = languages_obj[st_lang_code];
                if (typeof language === 'undefined') {
                    language = 'english';
                }
                if (typeof language !== 'undefined') {
                    for (let i = 0; i < playlistData.length; i++) {
                        if (language !== 'english') {
                            // //console.log(playlistData)
                            promises.push(Language.changeLanguage(playlistData[i].question_id, language, db.mysql.read));
                        } else if (language == 'english' && groupedMatchedQuestionHtml[playlistData[i].question_id] && groupedMatchedQuestionHtml[playlistData[i].question_id].length > 0) {
                            playlistData[i].html = groupedMatchedQuestionHtml[playlistData[i].question_id][0].html;
                        }
                    }
                    resolvedPromises = await Promise.all(promises);
                    for (let i = 0; i < resolvedPromises.length; i++) {
                        if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                            playlistData[i].ocr_text = resolvedPromises[i][0][language];
                        }
                    }
                    if (playlist_id === 'VIRAL' || playlist_id === 'LATEST_FROM_DOUBTNUT' || playlist_id === 'CRASH_COURSE') {
                        st_lang_code = 'en';
                        playlistData = Utility.addThumbnailWithLanguage(playlistData, st_lang_code, config);
                    } else {
                        playlistData = Utility.addThumbnailWithLanguage(playlistData, st_lang_code, config);
                    }
                    playlistData = await getToatalLikesShare(playlistData, student_id, db);
                    const whatsappData = await appConfigConatiner.getWhatsappData(db, student_class);
                    if (whatsappData.length > 0) {
                        const data1 = Utility.getWhatsappDataModified(whatsappData);
                        playlistData.splice(1, 0, data1);
                    }

                    // concept videos caraousel goes here
                    let concept_video = [];
                    if (playlist_id != 'CONCEPT_VIDEOS' && question_id) {
                        const temp = await Question.getMcIdbyQid(student_class, question_id, db.mysql.read);
                        if (temp && temp.length > 0 && temp[0].microconcept) {
                            const temp1 = await Question.getSimilarQuestionsByMcId(temp[0].microconcept, 2, db.mysql.read);
                            if (temp1 && temp1.length > 0) {
                                concept_video = Utility.addThumbnailWithLanguage(temp1, st_lang_code, config);
                            }
                            for (let j = 0; j < concept_video.length; j++) {
                                concept_video[j].bg_color = _.sample(color);
                                concept_video[j].resource_type = 'video';
                            }
                        }
                    }
                    const data = { concept_video, similar_video: playlistData, feedback };
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
        next(e);
    }
}

function getToatalLikesShare(elasticSearchResult, student_id, db) {
    return new Promise(async (resolve, reject) => {
        try {
            const color = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
            let durationPromise = [];
            for (let i = 0; i < elasticSearchResult.length; i++) {
                durationPromise.push(AnswerContainer.getByQuestionId(elasticSearchResult[i].question_id, db));
                durationPromise.push(QuestionContainer.getTotalViewsWeb(elasticSearchResult[i].question_id, db));
                elasticSearchResult[i].resource_type = 'video';
            }
            const videoData = await Promise.all(durationPromise);
            for (let i = 0; i < elasticSearchResult.length; i++) {
                if (videoData[i * 2].length <= 0) {
                    elasticSearchResult.splice(i, 1);
                    videoData.splice(i * 2, 1);
                    videoData.splice(i * 2 + 1, 1);
                }
            }
            for (let i = 0; i < elasticSearchResult.length; i++) {
                if (videoData[i * 2].length && videoData[i * 2][0].duration) {
                    if (videoData[i * 2][0].duration === 'NULL') {
                        elasticSearchResult[i].duration = 0;
                    } else {
                        elasticSearchResult[i].duration = videoData[i * 2][0].duration;
                    }
                } else {
                    elasticSearchResult[i].duration = 0;
                }
                durationPromise = [];
                durationPromise.push(AnswerContainer.getLikeDislikeStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(AnswerContainer.getWhatsappShareStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, videoData[i * 2][0].answer_id, db));
                const tempData = await Promise.all(durationPromise);
                elasticSearchResult[i].bg_color = _.sample(color);
                // elasticSearchResult[i]['duration']=videoData[i*2][0]['duration']
                elasticSearchResult[i].share = tempData[1][0];
                elasticSearchResult[i].like = tempData[0][0];
                elasticSearchResult[i].share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                elasticSearchResult[i].isLiked = false;
                if (tempData[2].length > 0 && tempData[2][0].rating > 3) {
                    elasticSearchResult[i].isLiked = true;
                }
            }
            return resolve(elasticSearchResult);
        } catch (e) {
            reject(e);
        }
    });
}

module.exports = {
    viewAnswerByQuestionId, viewSimilarQuestions,
};
