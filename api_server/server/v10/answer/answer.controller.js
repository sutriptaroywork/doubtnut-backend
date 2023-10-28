/* eslint-disable camelcase */
require('../../../modules/mongo/comment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');
// const moment = require('moment');

const Comment = mongoose.model('Comment');
const uuidv4 = require('uuid/v4');
const Data = require('../../../data/data');
const Answer = require('../../../modules/answer');
const Student = require('../../../modules/student');
const VideoView = require('../../../modules/videoView');
const Utility = require('../../../modules/utility');
const Question = require('../../../modules/question');
const Playlist = require('../../../modules/playlist');
const Language = require('../../../modules/language');
const Notification = require('../../../modules/notifications');
const Answer_Container = require('./answer.container');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionLog = require('../../../modules/mongo/questionAsk');
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerRedis = require('../../../modules/redis/answer');
const StudentContainer = require('../../../modules/containers/student');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const mysqlMicroconcept = require('../../../modules/mysql/microconcept');
const PlaylistContainer = require('../../../modules/containers/playlist');
const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
const MysqlQuestion = require('../../../modules/mysql/question');
const appConfigSql = require('../../../modules/mysql/appConfig');
const LanguageContainer = require('../../../modules/containers/language');
const FeedbackContainer = require('../../../modules/containers/feedback');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const utility_redis = require('../../../modules/redis/utility.redis');
const QuestionHelper = require('../../helpers/question.helper');
const AnswerHelper = require('../../helpers/answer');
// const liveClassMySql = require('../../../modules/mysql/liveclass');
// const UtilityFlagr = require('../../../modules/Utility.flagr');
const studentRedis = require('../../../modules/redis/student');
// const LiveclassData = require('../../../data/liveclass.data');
const CourseContainer = require('../../../modules/containers/course');
const kafka = require('../../../config/kafka');
const questionRedis = require('../../../modules/redis/question');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const DNRHelper = require('../../helpers/dnr');
const StudentHelper = require('../../helpers/student.helper');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');

// const _ = require('lodash');
let db; let config; let sqs; let sns;

// eslint-disable-next-line no-shadow
function getToatalLikesShare(elasticSearchResult, student_id, unlockStatus, db) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise((async (resolve, reject) => {
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

                // Adding subject and lock unlock status
                if (videoData[i * 2][0].subject) {
                    elasticSearchResult[i].subject = videoData[i * 2][0].subject;
                } else {
                    elasticSearchResult[i].subject = 'MATHS';
                }

                if (unlockStatus !== 0) {
                    elasticSearchResult[i].is_locked = 0;
                } else if (elasticSearchResult[i].subject && elasticSearchResult[i].subject !== 'MATHS') {
                    elasticSearchResult[i].is_locked = 1;
                } else {
                    elasticSearchResult[i].is_locked = 0;
                }

                durationPromise = [];
                durationPromise.push(AnswerContainer.getLikeDislikeStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(AnswerContainer.getWhatsappShareStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, videoData[i * 2][0].answer_id, db));
                // eslint-disable-next-line no-await-in-loop
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
    }));
}

async function viewAnswerByQuestionId(req, res, next) {
    sqs = req.app.get('sqs');
    sns = req.app.get('sns');
    config = req.app.get('config');
    let viewData;
    try {
        const { matchedQuestionSnsUrl } = Data;
        db = req.app.get('db');
        const { page } = req.body;
        const { session_id } = req.body;
        const { tab_id } = req.body;
        let { source } = req.body;
        let { parent_id } = req.body;
        const { ref_student_id } = req.body;
        const { student_id } = req.user;
        let data = {};
        let { student_class } = req.user;
        let student_course;
        let hls_url;
        const ip = Utility.getClientIp(req);
        let resolvedPromisesData;
        const hls_timeout = 0;
        console.log(page);
        const viral_video_student_id_arr = [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 98];
        if ((typeof ref_student_id !== 'undefined') && (ref_student_id !== '') && (ref_student_id) && !_.includes(ref_student_id, 'WHA')) {
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
            let promises = [];
            resolvedPromisesData = await AnswerContainer.getByMcId(mc_id, db);
            if (!student_class) {
                student_class = resolvedPromisesData[0].class;
            }
            if (!student_course) {
                student_course = 'NCERT';
            }
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
            const questionWithAnswer = resolvedPromisesData[0];
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
                // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer.question_id, config, admin, db);
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
            console.log('sssssssssssssssssssss');
            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'WATCH_LIBRARY_VIDEO',
                user_id: req.user.student_id,
                refer_id: questionWithAnswer.question_id,
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
            let promises = [];
            let type;
            let id;
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
            const questionWithAnswer = resolvedPromisesData[0];
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
                    .then(() => {
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
                        console.log('hello');
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
                        }).catch(() => {
                            // console.log("error2")
                            // console.log(error2)
                        });
                    }
                }).catch(() => {
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
                // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer.question_id, config, admin, db);
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
            // let temp=await Question.getMcIdbyQid(student_class,question_id,db.mysql.read)
            let playlistData;

            if (questionWithAnswer && questionWithAnswer.doubt && questionWithAnswer.student_id == 99) {
                playlistData = await mysqlMicroconcept.getPlaylistIdData(questionWithAnswer.doubt, db.mysql.read);
            }
            promises = [];
            promises.push(AnswerContainer.getLikeDislikeStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getWhatsappShareStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));

            if (playlistData && playlistData.length > 0 && playlistData[0].description == 'CONCEPT_VIDEOS' && page == 'LIBRARY') {
                promises.push(Answer_Container.getNextMicroConcept(questionWithAnswer.doubt, playlistData[0].student_class, playlistData[0].student_course, data, db));
            }
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
        let { version_code } = req.headers;
        if (!version_code || version_code < 628) {
            version_code = 627;
        }
        let promises = [];
        const { student_class } = req.user;
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
        // let unlockStatus=await contentUnlockContainer.getUnlockStatus(db,student_id,"PC")
        const unlockStatus = 1;

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
                    // console.log(similarQuestions)

                    languages_arrays = resolvedPromises[1];
                    languages_obj = Utility.getLanguageObject(languages_arrays);
                    promises = [];
                    st_lang_code = req.user.locale;
                    language = languages_obj[st_lang_code];
                    if (typeof language === 'undefined') {
                        language = 'english';
                    }
                    if (typeof language !== 'undefined') {
                        let matchedQuestionsHtml;
                        let groupedMatchedQuestionHtml;
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
                        const promise = [];
                        promise.push(getToatalLikesShare(similarQuestions, student_id, unlockStatus, db));
                        promise.push(appConfigConatiner.getWhatsappData(db, student_class));
                        promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
                        const promiseResult = await Promise.all(promise);
                        if (promiseResult[1].length > 0) {
                            const data1 = Utility.getWhatsappDataModified(promiseResult[1]);
                            promiseResult[0].splice(1, 0, data1);
                        }
                        const banner = [];
                        if (promiseResult[2] && promiseResult[2].length > 0) {
                            for (let i = promiseResult[2].length - 1; i >= 0; i--) {
                                promiseResult[2][i].action_data = JSON.parse(promiseResult[2][i].action_data);
                                const temp = {};
                                if (promiseResult[0] && promiseResult[2][i].position <= promiseResult[0].length) {
                                    temp.index = promiseResult[2][i].position;
                                } else {
                                    temp.index = 1;
                                }
                                temp.scroll_size = '1x';
                                temp.list_key = 'similar_video';
                                temp.resource_type = 'banner';
                                temp.data = [promiseResult[2][i]];
                                banner.push(temp);
                            }
                        }
                        // concept video goes from here

                        const data = { similar_video: promiseResult[0], feedback, promotional_data: banner };
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
                // eslint-disable-next-line no-shadow
                question_id = req.body;
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
                                prom.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
                                const resolvedP = await Promise.all(prom);
                                let questionList = resolvedP[0];
                                const whatsappData = resolvedP[1];
                                questionList = Utility.addThumbnailWithLanguage(questionList, 'en', config);
                                questionList = await getToatalLikesShare(questionList, student_id, unlockStatus, db);
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
                                const banner = [];
                                if (resolvedP[2] && resolvedP[2].length > 0) {
                                    for (let i = resolvedP[2].length - 1; i >= 0; i--) {
                                        resolvedP[2][i].action_data = JSON.parse(resolvedP[2][i].action_data);
                                        const temp = {};
                                        if (resolvedP[0] && resolvedP[2][i].position <= resolvedP[0].length) {
                                            temp.index = resolvedP[2][i].position;
                                        } else {
                                            temp.index = 1;
                                        }
                                        temp.scroll_size = '1x';
                                        temp.list_key = 'similar_video';
                                        temp.resource_type = 'banner';
                                        temp.data = [resolvedP[2][i]];
                                        banner.push(temp);
                                    }
                                }

                                const data = { similar_video: questionList, feedback, promotional_data: banner };
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
                                prom.push(AppBannerContainer.getPromotionalData(db, student_class, 'NOTIFICATION', version_code));
                                const resolvedP = await Promise.all(prom);
                                let questionList = resolvedP[0];
                                const whatsappData = resolvedP[1];
                                questionList = Utility.addThumbnailWithLanguage(questionList, 'en', config);
                                questionList = await getToatalLikesShare(questionList, student_id, unlockStatus, db);
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
                                const banner = [];
                                if (resolvedP[2] && resolvedP[2].length > 0) {
                                    for (let i = resolvedP[2].length - 1; i >= 0; i--) {
                                        resolvedP[2][i].action_data = JSON.parse(resolvedP[2][i].action_data);
                                        const temp = {};
                                        if (resolvedP[0] && resolvedP[2][i].position <= resolvedP[0].length) {
                                            temp.index = resolvedP[2][i].position;
                                        } else {
                                            temp.index = 1;
                                        }
                                        temp.scroll_size = '1x';
                                        temp.list_key = 'similar_video';
                                        temp.resource_type = 'banner';
                                        temp.data = [resolvedP[2][i]];
                                        banner.push(temp);
                                    }
                                }

                                const data = { similar_video: questionList, feedback, promotional_data: banner };
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
                                let elasticSearchResult = await elasticSearchInstance.findByOcrUsingIndexNew(ocr, config.elastic.REPO_INDEX1);

                                elasticSearchResult = Utility.changeElasticSearchResult(elasticSearchResult.hits.hits);
                                const promises2 = [];
                                for (let i = 0; i < elasticSearchResult.length; i++) {
                                    promises2.push(QuestionContainer.getByQuestionId(elasticSearchResult[i].question_id, db));
                                }
                                const questionWithBackTick = await Promise.all(promises2);
                                for (let k = 0; k < elasticSearchResult.length; k++) {
                                    elasticSearchResult[k].ocr_text = (questionWithBackTick[k][0].ocr_text.indexOf('<math') === -1) ? questionWithBackTick[k][0].ocr_text : questionWithBackTick[k][0].question;
                                }
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
                                    let matchedQuestionsHtml;
                                    let groupedMatchedQuestionHtml;
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
                                    const promise = [];
                                    promise.push(getToatalLikesShare(elasticSearchResult, student_id, unlockStatus, db));
                                    promise.push(appConfigConatiner.getWhatsappData(db, student_class));
                                    promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
                                    const promiseResult = await Promise.all(promise);
                                    if (promiseResult[1].length > 0) {
                                        const data1 = Utility.getWhatsappDataModified(promiseResult[1]);
                                        promiseResult[0].splice(1, 0, data1);
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
                                                if (unlockStatus !== 0) {
                                                    concept_video[j].is_locked = 0;
                                                } else if (concept_video[j].subject && concept_video[j].subject !== 'MATHS') {
                                                    concept_video[j].is_locked = 1;
                                                } else {
                                                    concept_video[j].is_locked = 0;
                                                }
                                            }
                                        }
                                    }
                                    const banner = [];
                                    if (promiseResult[2] && promiseResult[2].length > 0) {
                                        for (let i = promiseResult[2].length - 1; i >= 0; i--) {
                                            promiseResult[2][i].action_data = JSON.parse(promiseResult[2][i].action_data);
                                            const temp = {};
                                            if (promiseResult[0] && promiseResult[2][i].position <= promiseResult[0].length) {
                                                temp.index = promiseResult[2][i].position;
                                            } else {
                                                temp.index = 1;
                                            }
                                            temp.scroll_size = '1x';
                                            temp.list_key = 'similar_video';
                                            temp.resource_type = 'banner';
                                            temp.data = [promiseResult[2][i]];
                                            banner.push(temp);
                                        }
                                    }
                                    const data = {
                                        concept_video, similar_video: elasticSearchResult, feedback, promotional_data: banner,
                                    };

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
                let playlistData;
                question_id = req.body.question_id;
                const { playlist_id } = req.body;
                let resolvedPromises;
                language = 'english';
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
                    resolvedPromises = await Promise.all(promises);
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
                            promises = [];
                            st_lang_code = req.user.locale;
                            languages_arrays = resolvedPromises[1];
                            languages_obj = Utility.getLanguageObject(languages_arrays);
                            language = languages_obj[st_lang_code];
                            if (typeof language === 'undefined' || language !== 'english') {
                                language = 'english';
                            }
                            if (typeof language !== 'undefined') {
                                if (language !== 'english') {
                                    for (let i = 0; i < elasticSearchResult.length; i++) {
                                        promises.push(Language.changeLanguage(elasticSearchResult[i].question_id, language, db.mysql.read));
                                    }
                                }
                                resolvedPromises = await Promise.all(promises);
                                for (let i = 0; i < resolvedPromises.length; i++) {
                                    if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                                        elasticSearchResult[i].ocr_text = resolvedPromises[i][0][language];
                                    }
                                }
                                let matchedQuestionsHtml;
                                let groupedMatchedQuestionHtml;
                                if (language == 'english') {
                                    if (elasticSearchResult.length > 0) {
                                        matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                                    }
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
                    const packageId = playlist_id.replace('BOOKS_', '');
                    promises.push(Answer.getBooksSimilarVideos(packageId, question_id, resPromise[0].doubt, limit, db.mysql.read));
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

                    const promise = [];
                    promise.push(getToatalLikesShare(playlistData, student_id, unlockStatus, db));
                    promise.push(appConfigConatiner.getWhatsappData(db, student_class));
                    if (playlist_id == 'TRICKY_QUESTION') {
                        promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'NOTIFICATION', version_code));
                    } else {
                        promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
                    }
                    // promise.push(AppBannerContainer.getPromotionalData(db,student_class,"SIMILAR"))
                    const promiseResult = await Promise.all(promise);
                    if (promiseResult[1].length > 0) {
                        const data1 = Utility.getWhatsappDataModified(promiseResult[1]);
                        promiseResult[0].splice(1, 0, data1);
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
                                if (unlockStatus !== 0) {
                                    concept_video[j].is_locked = 0;
                                } else if (concept_video[j].subject && concept_video[j].subject !== 'MATHS') {
                                    concept_video[j].is_locked = 1;
                                } else {
                                    concept_video[j].is_locked = 0;
                                }
                            }
                        }
                    }
                    const banner = [];
                    if (promiseResult[2] && promiseResult[2].length > 0) {
                        for (let i = promiseResult[2].length - 1; i >= 0; i--) {
                            promiseResult[2][i].action_data = JSON.parse(promiseResult[2][i].action_data);
                            const temp = {};
                            if (promiseResult[0] && promiseResult[2][i].position <= promiseResult[0].length) {
                                temp.index = promiseResult[2][i].position;
                            } else {
                                temp.index = 1;
                            }
                            temp.scroll_size = '1x';
                            temp.list_key = 'similar_video';
                            temp.resource_type = 'banner';
                            temp.data = [promiseResult[2][i]];
                            banner.push(temp);
                        }
                    }

                    const data = {
                        concept_video, similar_video: playlistData, feedback, promotional_data: banner,
                    };
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

// eslint-disable-next-line no-shadow
// async function upsertDailyViews(db, studentID, viewID) {
//     // check if this is new view id or not
//     const dailyViewRow = await Contest.getView(db.mysql.read, studentID, viewID);
//     if (dailyViewRow.length === 0) {
//         // fresh view
//         const updateResult = await Contest.updateDailyViewAndCount(db.mysql.write, studentID, viewID);
//         console.log(updateResult.affectedRows);
//         if (updateResult.affectedRows === 0) {
//             // get view count of student
//             const previousViews = await Contest.getPreviousViews(db.mysql.read, studentID);
//             let previousViewCount = 1;
//             if (previousViews.length > 0) {
//                 previousViewCount = previousViews[0].video_count;
//             }
//             await Contest.insertView(db.mysql.write, studentID, viewID, previousViewCount);
//         } else {
//             console.log('nothing to do');
//         }
//     } else {
//         console.log('nothing to do');
//     }
// }

async function claimDNRReward(database, xAuthToken, studentId, questionId, engageTime, viewId, packageName = 'default') {
    try {
        const isDNREnabled = StudentHelper.showDnrExp(studentId, packageName);
        if (isDNREnabled) {
            const dnrObj = new DNRHelper(database, xAuthToken, studentId, parseInt(viewId));
            const response = await dnrObj.processReward({
                questionId: parseInt(questionId),
                engageTime: parseInt(engageTime),
            });
            console.log('response ', response);
        }
    } catch (e) {
        console.error(e);
    }
}

async function setUserFreeLiveclassET({ videoViewStatRow, sid, engage_time }) {
    const pageValueArr = ['HOME_FEED_LIVE', 'HOME_PAGE_REVISION_CLASSES'];
    if (videoViewStatRow[0] && pageValueArr.includes(videoViewStatRow[0].view_from)) {
        const homepageVisitCount = await studentRedis.getUserHomepageVisitCount(db.redis.read, sid);
        if (!_.isNull(homepageVisitCount) && +homepageVisitCount >= 3) {
            const liveclassEt = await studentRedis.getUserFreeLiveclassETNew(db.redis.read, sid);
            if (!_.isNull(liveclassEt)) {
                let etValue = parseInt(JSON.parse(liveclassEt));
                etValue += parseInt(engage_time);
                if (etValue >= 1200) {
                    // studentRedis.deleteUserFreeLiveclassET(db.redis.write, sid);
                    studentRedis.deleteUserFreeLiveclassETNew(db.redis.write, sid);
                    studentRedis.setUserHomepageVisitCount(db.redis.write, sid, -1);
                } else {
                    // studentRedis.setUserFreeLiveclassET(db.redis.write, sid, etValue);
                    studentRedis.setUserFreeLiveclassETNew(db.redis.write, sid, etValue);
                }
            } else {
                // studentRedis.setUserFreeLiveclassET(db.redis.write, sid, engage_time);
                studentRedis.setUserFreeLiveclassETNew(db.redis.write, sid, engage_time);
            }
        }
    }
}

async function addUsersToFreeTrialFlow({
    videoViewStatRow, sid, engage_time, versionCode,
}) {
    if (videoViewStatRow[0].view_from && (videoViewStatRow[0].view_from.includes('LIVE') || videoViewStatRow[0].view_from.includes('COURSE') || videoViewStatRow[0].view_from === 'CHAPTER_SERIES_CAROUSAL' || videoViewStatRow[0].view_from === 'HOME_PAGE_REVISION_CLASSES' || videoViewStatRow[0].view_from === 'HOME_FEED')) {
        const freeClassET = await studentRedis.getUserETForFreeTrialNew(db.redis.read, sid);
        if (!_.isNull(freeClassET)) {
            let etValue = parseInt(JSON.parse(freeClassET));
            if (etValue < 600 && etValue + parseInt(engage_time) >= 600 && (+versionCode >= 955)) {
                // free trialpack
                await CourseContainer.giveTrial(db, sid);
            }
            etValue += parseInt(engage_time);
            // studentRedis.setUserETForFreeTrial(db.redis.write, sid, etValue);
            studentRedis.setUserETForFreeTrialNew(db.redis.write, sid, etValue);
        } else {
            // studentRedis.setUserETForFreeTrial(db.redis.write, sid, engage_time);
            studentRedis.setUserETForFreeTrialNew(db.redis.write, sid, engage_time);
        }
    }
}

async function updateAnswerView(req, res) {
    db = req.app.get('db');
    sns = req.app.get('sns');
    sqs = req.app.get('sqs');
    config = req.app.get('config');
    const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
    const { view_id } = req.body;
    let { video_time } = req.body;
    const { is_back } = req.body;
    let { engage_time } = req.body;
    let { video_lock_unlock_logs_data } = req.body;
    if (video_lock_unlock_logs_data && typeof video_lock_unlock_logs_data === 'string') {
        video_lock_unlock_logs_data = JSON.parse(video_lock_unlock_logs_data);
    }
    // const xAuthToken = req.headers['x-auth-token'];

    if (parseInt(video_time) === 0 && parseInt(engage_time) === 0) {
        const responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'SUCCESS',
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
    kafka.publish(kafka.topics.vvsUpdate, view_id, {
        viewId: view_id,
        videoTime: video_time,
        engageTime: engage_time,
        isback: is_back,
    }, {
        studentId: req.user.student_id,
    });
    kafka.publish(kafka.topics.vvsNotification, req.body.view_id, {
        body: req.body,
        headers: req.headers,
        hostname: req.hostname,
        user: req.user,
    });
    // kafka.publish(kafka.topics.askVvs, req.user.student_id, {
    //     viewId: view_id,
    //     videoTime: video_time,
    //     engageTime: engage_time,
    //     isback: is_back,
    //     ts: moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
    //     studentId: req.user.student_id,
    //     action: Data.ask_vvs.update_view,
    //     hostname: req.hostname,
    //     xAuthToken,
    //     videoLockUnlockLogsData: video_lock_unlock_logs_data,
    // });

    const settledPromises = await Promise.allSettled([
        VideoView.getVideoViewStatById(view_id, db.mysql.write),
        questionRedis.getUserRecentAskedQuestions(db.redis.read, req.user.student_id),
    ]);

    const [
        videoViewStatRow,
        redisPersonalisationData,
    ] = settledPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));

    const sid = videoViewStatRow[0].student_id;
    const qid = videoViewStatRow[0].question_id;
    elasticSearchUserQuestionsInstance.updateQuestionIdViewMetrics('user-questions', videoViewStatRow[0].parent_id, qid, video_time, engage_time);
    // const isComputationQuestionView = !!(videoViewStatRow[0].answer_video && videoViewStatRow[0].answer_video.includes('computational'));
    const { answer_id } = videoViewStatRow[0];
    // claim DNR For Watching a video from WHATSAPP
    claimDNRReward(db, req.headers['x-auth-token'], req.user.student_id, videoViewStatRow[0].parent_id, engage_time, view_id, req.headers.package_name);
    for (let i = 0; i < redisPersonalisationData.length; i++) {
        const data = JSON.parse(redisPersonalisationData[i]);
        if (data.video_id == qid) {
            const vt = data.video_time > video_time ? data.video_time : video_time;
            const et = data.engage_time > engage_time ? data.engage_time : engage_time;
            redisPersonalisationData[i] = { ...data, video_time: vt, engage_time: et };
            break;
        }
    }

    const [isLiveClassData, sidRedisData] = await Promise.all([
        CourseContainerV2.getAssortmentsByResourceReferenceV1(db, qid),
        video_lock_unlock_logs_data && video_lock_unlock_logs_data.lock_time_sec && parseInt(engage_time) ? StudentContainer.getById(sid, db) : null]);
    if (isLiveClassData && isLiveClassData.length && isLiveClassData[0].is_free) {
        AnswerContainer.storeUserLiveClassWatchedVideo(db, qid, sid, video_time, isLiveClassData);
    }

    if (!_.isEmpty(redisPersonalisationData.length)) {
        questionRedis.setUserRecentAskedQuestions(db.redis.write, req.user.student_id, redisPersonalisationData.reverse());
    }
    const pageArray = ['COURSE_FAQ', 'POST_PURCHASE_COURSE_DETAILS', 'WHATS_NEW_HOME'];
    if (!pageArray.includes(videoViewStatRow[0].view_from)) {
        AnswerContainer.storeInHistory(db, qid, answer_id, sid, video_time);
    }
    // if (req.hostname === 'api.doubtnut.com') {
    //     Utility.sendMessage(sqs, LiveclassData.videoLeaveQueueUrl, {
    //         actionType: 'liveclass_leave',
    //         student_id: sid,
    //         question_id: qid,
    //         mobile: req.user.mobile,
    //         gcm_reg_id: req.user.gcm_reg_id,
    //         locale: req.user.locale,
    //         app_version: req.user.app_version,
    //     });
    // }

    // lock unlock feature
    if (video_lock_unlock_logs_data && video_lock_unlock_logs_data.lock_time_sec && parseInt(engage_time)) {
        video_lock_unlock_logs_data.lock_time_sec = (video_lock_unlock_logs_data.lock_time_sec - parseInt(engage_time) > 0) ? video_lock_unlock_logs_data.lock_time_sec - parseInt(engage_time) : 0;
        sidRedisData[0].video_lock_unlock_logs_data = video_lock_unlock_logs_data;
        studentRedis.setById(sid, sidRedisData, db.redis.write);
    }

    if (videoViewStatRow[0].view_from == 'SRP' && parseInt(engage_time) > 30) {
        Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
            action: 'WATCH_MATCHED_VIDEO',
            user_id: sid,
            refer_id: qid,
        });
    } else if (parseInt(engage_time) > 30) {
        Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
            action: 'WATCH_LIBRARY_VIDEO',
            user_id: sid,
            refer_id: qid,
        });
    }
    if (!videoViewStatRow.length) {
        const responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Invalid view id',
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
    if (is_back == '0' && videoViewStatRow[0].parent_id != 0 && engage_time >= 20) {
        // call redis and store the count
        StudentContainer.srpViewCount(sid, videoViewStatRow[0].parent_id, db.redis.write);
    }
    studentRedis.setVideoViewEngagetimeByStudentId(db.redis.write, sid, +engage_time);
    if (videoViewStatRow[0].engage_time > engage_time) {
        engage_time = videoViewStatRow[0].engage_time;
    }
    if (videoViewStatRow[0].video_time > video_time) {
        video_time = videoViewStatRow[0].video_time;
    }
    // check if engage time is greater than 30 for contest 1
    if ((engage_time >= 30) && (videoViewStatRow[0].source == 'android')) {
        AnswerHelper.dailyViewsHandler(db, view_id, sid);
    }

    setUserFreeLiveclassET({ videoViewStatRow, sid, engage_time });
    const { version_code: versionCode } = req.headers;
    addUsersToFreeTrialFlow({
        videoViewStatRow, sid, engage_time, versionCode,
    });

    /* TODO Review: Removed all Notification Logic
    if (isComputationQuestionView) {
        AnswerContainer.getByQuestionNewId(qid, db).then((row) => {
            if (!Data.et_student_id.includes(row[0].student_id) && !pageArray.includes(videoViewStatRow[0].view_from)) {
                Notification.resumeVideoNotification(sid, qid, answer_id, video_time, view_id, db);
            }
        });
    } else {
        AnswerContainer.getByQuestionId(qid, db).then((row) => {
            if (!Data.et_student_id.includes(row[0].student_id) && !pageArray.includes(videoViewStatRow[0].view_from)) {
                Notification.resumeVideoNotification(sid, qid, answer_id, video_time, view_id, db);
            }
        });
    }

    Notification.firstQuestionEver(sid, qid, req.user.gcm_reg_id, null, db);
    if (video_time >= 1) {
        const data = await CourseContainerV2.getAssortmentsByResourceReferenceV1(db, qid);
        if (data.length && !data[0].is_chapter_free) {
            CourseHelper.updateUserLastWatchedVideoInAssortmentProgress(db, data, sid, qid, data[0].subject, engage_time);
        }
    }
    if (parseInt(engage_time) > 15 && parseInt(engage_time) <= 1800) {
        Notification.incompleteVideoView(qid.toString(), req.user, null, db, config);
    } else if (parseInt(engage_time) > 1800) {
        Notification.completeVideoView(qid.toString(), req.user, null, db, config);
    }
    */
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: null,
    };
    res.status(responseData.meta.code).json(responseData);
}

module.exports = {
    viewAnswerByQuestionId, viewSimilarQuestions, updateAnswerView,
};
