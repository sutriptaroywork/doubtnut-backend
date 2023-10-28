/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-shadow */

require('../../../modules/mongo/comment');
require('../../../modules/mongo/questionAskUser');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const { Lambda } = require('aws-sdk');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');

const questionLog = mongoose.model('question_logs_user');
const Comment = mongoose.model('Comment');
const uuidv4 = require('uuid/v4');

const Answer = require('../../../modules/answer');
const Student = require('../../../modules/student');
const VideoView = require('../../../modules/videoView');
const Utility = require('../../../modules/utility');
const Question = require('../../../modules/question');
const Playlist = require('../../../modules/playlist');
const Notification = require('../../../modules/notifications');
const Answer_Container = require('./answer.container');
const QuestionContainer = require('../../../modules/containers/question');
const QuestionLog = require('../../../modules/mongo/questionAskUser');
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerRedis = require('../../../modules/redis/answer');
const StudentContainer = require('../../../modules/containers/student');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const mysqlMicroconcept = require('../../../modules/mysql/microconcept');
const PlaylistContainer = require('../../../modules/containers/playlist');
const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
const MysqlAnswer = require('../../../modules/mysql/answer');
const MysqlQuestion = require('../../../modules/mysql/question');
const appConfigSql = require('../../../modules/mysql/appConfig');
const LanguageContainer = require('../../../modules/containers/language');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const utility_redis = require('../../../modules/redis/utility.redis');
const LiveclassData = require('../../../data/liveclass.data');
// const HomepageQuestionsMaster = require('../../../modules/homepageQuestionsMaster.js');
// const telemetry = require('../../../config/telemetry');
const data = require('../../../data/data');
const bl = require('./answer.bl');
const Language = require('../../../modules/language');
const config1 = require('../../../config/config');
const Data = require('../../../data/data');
const QuestionHelper = require('../../helpers/question.helper');
// const TopicBoosterModel = require('../../../modules/mongo/topicBooster');
// const libraryHelper = require('../../helpers/library');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
// const AnswerHelper = require('../../helpers/answer');
const TeacherMysql = require('../../../modules/mysql/teacher');
const TeacherContainer = require('../../../modules/containers/teacher');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const CourseControllerV1 = require('../../v1/course/course.controller');
const CourseContainerv2 = require('../../../modules/containers/coursev2');
const SrpWidgetManager = require('../../helpers/srpWidget.helper');
const freeClassHelper = require('../../helpers/freeLiveClass');
const AnswerContainerv13 = require('../../v13/answer/answer.container');
const AnswerHelper = require('../../helpers/answer');
const LiveClassHelperV6 = require('../../v6/course/course.helper');
const teslaHelperV1 = require('../../v1/tesla/tesla.helper');
const WidgetHelper = require('../../widgets/liveclass');
const D0UserManager = require('../../helpers/d0User.helper');
const CampaignMysql = require('../../../modules/mysql/campaign');
const QuestionMysql = require('../../../modules/mysql/question');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const ClassCourseMappingContainer = require('../../../modules/containers/ClassCourseMapping');

const lambda = new Lambda({ accessKeyId: config1.aws_access_id, secretAccessKey: config1.aws_secret });
const altAppData = require('../../../data/alt-app');

let config; let sqs; let sns;

async function getSimilarByOcr(db, ocr, index, language, elasticSearchInstance, question_id, parentId, versionCode, ocrFlag) {
    let elasticSearchResult;
    if (!ocrFlag) {
        const askedQuestionData = await questionLog.find({ qid: `${parentId}` });
        if (askedQuestionData.length) {
            askedQuestionData[0].qid_matches_array = askedQuestionData[0].relevance_score.map((x) => x.qid);
        }
        if (versionCode > 649 && parentId && askedQuestionData.length && askedQuestionData[0].qid_matches_array && askedQuestionData[0].qid_matches_array.length) {
            elasticSearchResult = (await Promise.all(askedQuestionData[0].qid_matches_array.map((x) => (AnswerContainer.getByQuestionIdWithTextSolution(x, db))))).map((x) => x[0]);
        } else {
            ocr = ocr.replace('`', '');
            ocr = ocr.replace(/<[^>]*>/g, '');
            elasticSearchResult = await QuestionHelper.getSimilarQuestionsByOcr(db, elasticSearchInstance, ocr, question_id, index);
            elasticSearchResult = Utility.changeElasticSearchResult(elasticSearchResult.hits.hits);
        }
    } else {
        ocr = ocr.replace('`', '');
        ocr = ocr.replace(/<[^>]*>/g, '');
        elasticSearchResult = await QuestionHelper.getSimilarQuestionsByOcr(db, elasticSearchInstance, ocr, question_id, index);
        elasticSearchResult = Utility.changeElasticSearchResult(elasticSearchResult.hits.hits);
    }

    elasticSearchResult = elasticSearchResult.filter((x) => !_.isEmpty(x));

    const matchesQuestionArray = _.join(_.keys(_.groupBy(elasticSearchResult, 'question_id')), ',');
    const promises = [];
    if (language !== 'english') {
        for (let i = 0; i < elasticSearchResult.length; i++) {
            promises.push(QuestionContainer.getLocalisedQuestion(elasticSearchResult[i].question_id, language, db));
        }
    }
    const resolvedPromises = await Promise.all(promises);
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
        if (language == 'english' && groupedMatchedQuestionHtml && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id] && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id].length) {
            elasticSearchResult[i].html = groupedMatchedQuestionHtml[elasticSearchResult[i].question_id][0].html;
        }
    }
    return elasticSearchResult;
}

async function getSimilarByOcrForUs(db, ocr, elasticSearchInstance, question_id) {
    let elasticSearchResult;
    ocr = ocr.replace('`', '');
    ocr = ocr.replace(/<[^>]*>/g, '');
    elasticSearchResult = await elasticSearchInstance.findOcrByUsIndex(ocr);
    elasticSearchResult = Utility.changeElasticSearchResult(elasticSearchResult.hits.hits);

    elasticSearchResult = elasticSearchResult.filter((x) => !_.isEmpty(x));

    const matchesQuestionArray = _.join(_.keys(_.groupBy(elasticSearchResult, 'question_id')), ',');
    let matchedQuestionsHtml;
    if (elasticSearchResult.length > 0) {
        matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
    }
    const groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');

    for (let i = 0; i < elasticSearchResult.length; i++) {
        if (elasticSearchResult[i].question_id == question_id) {
            const left_data = elasticSearchResult.slice(0, i);
            const right_data = elasticSearchResult.slice(i + 1, elasticSearchResult.length);
            elasticSearchResult = right_data.concat(left_data);
            break;
        }
    }
    for (let i = 0; i < elasticSearchResult.length; i++) {
        if (groupedMatchedQuestionHtml && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id] && groupedMatchedQuestionHtml[elasticSearchResult[i].question_id].length) {
            elasticSearchResult[i].html = groupedMatchedQuestionHtml[elasticSearchResult[i].question_id][0].html;
        }
    }
    return elasticSearchResult;
}

async function viewAnswerByQuestionId(req, res, next) {
    sqs = req.app.get('sqs');
    sns = req.app.get('sns');
    config = req.app.get('config');
    let viewData;
    try {
        const { matchedQuestionSnsUrl } = Data;
        const db = req.app.get('db');
        const { page } = req.body;
        const { session_id } = req.body;
        const { tab_id } = req.body;
        let { source } = req.body;
        let { parent_id } = req.body;
        const { ref_student_id } = req.body;
        const { student_id } = req.user;
        let data = {}; let { student_class } = req.user; let student_course; let hls_url;
        const ip = Utility.getClientIp(req);
        let resolvedPromisesData;
        const hls_timeout = 0;
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
                } else {
                    data.isDisliked = true;
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
            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'WATCH_LIBRARY_VIDEO',
                user_id: req.user.student_id,
                refer_id: questionWithAnswer.question_id, // need to check this
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

            let wha_id = 0;
            if (_.includes(ref_student_id, 'WHA')) {
                const tempdata = Utility.whatsappDeeplinkTokenizer(ref_student_id);
                source = tempdata[0];
                parent_id = tempdata[1];
                wha_id = tempdata[2];
                const isUpdated = await MysqlQuestion.getQuestionParentId(parent_id, db.mysql.read);
                if (isUpdated.length > 0) {
                    if (isUpdated[0].parent_id == null) {
                        /* let results;
                        const bookmetaData = await Question.getBookMetaData(question_id, db.mysql.read);
                        if (bookmetaData && bookmetaData.length && bookmetaData[0].doubt) {
                            results = (await QuestionContainer.getSimilarQuestionFromBookMeta(db, bookmetaData[0].doubt)).map((x) => x.question_id);
                        }

                        lambda.invoke({
                            FunctionName: 'WHATSAPP_PDF',
                            Payload: JSON.stringify([{
                                questionId: question_id, parentId: parent_id, studentId: wha_id, topic: questionWithAnswer.chapter, results,
                            }]),
                        }, (err, data) => {
                            if (err) console.log(err, err.stack); // an error occurred
                            else console.log(data);
                        }); */

                        let today = new Date();
                        const dd = String(today.getDate()).padStart(2, '0');
                        const mm = String(today.getMonth() + 1).padStart(2, '0');
                        const yyyy = today.getFullYear();
                        today = `${mm}/${dd}/${yyyy}`;
                        const date = today;
                        const student = await StudentContainer.getById(wha_id, db);
                        const phone = student[0].mobile;
                        await MysqlQuestion.updateQuestionParentId(student_id, wha_id, parent_id, db.mysql.write);
                        const lastVideoWatched = await utility_redis.checkIfExists(db.redis.read, `${wha_id}lastVideoWatched`);
                        if ((lastVideoWatched == 'null' || lastVideoWatched != parent_id) && parseInt(await utility_redis.checkIfExists(db.redis.read, `${phone + date}wa`)) == 1) {
                            // await Utility.sendWhatsAppMessage(phone,"Hope you like my solution 🤖 \n\nI am learning like you. 📚 💻 \n\nAsk one more question! 😊", config)
                            console.log('Video Watched');
                            await utility_redis.lock(db.redis.write, `${wha_id}lastVideoWatched`, parent_id, 580);
                            // setTimeout(function (){
                            //   Utility.sendImageOnWhatsApp(phone , "https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/PC_Launched_20190813.png", config).then(result =>{

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
                    if (!commentsData.length) {
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
                        });
                    }
                });

                const parentQuestion = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, parent_id);
                if (parentQuestion && parentQuestion.length) {
                    console.log(`Search version: ${parentQuestion[0].question}`);
                }

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
            const descrip = await AnswerContainer.getAnswerTitleAndDescription2(data, db);
            // let temp = await Question.getMcIdbyQid(student_class, question_id, db.mysql.read)
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

async function liveClassShowDecider(liveClassCount, countKey, student_id, db) {
    let showLiveClass = false;
    const expKey = 'lc_exp';
    const liveClassExp = await AnswerRedis.getLiveclassExp(db.redis.read, expKey, student_id);
    let exp = 'LF';
    let firstTime = false;
    if (liveClassExp != null) {
        exp = liveClassExp;
    } else {
        firstTime = true;
    }
    const sfCountKey = 'lc_sf_count';
    let sfShowCount = await Answer_Container.getSfShowCount(db.redis, sfCountKey, student_id);
    const showKey = 'lc_show';
    const liveClassShowDetails = await AnswerRedis.getLiveClassShowDetails(db.redis.read, showKey, student_id);
    if (firstTime === true && liveClassCount < 3) {
        showLiveClass = true;
    } else if (!_.isNull(liveClassShowDetails) && !_.isEmpty(liveClassShowDetails)) {
        const detailsCount = liveClassShowDetails.split('_');
        const viewDiff = liveClassCount - detailsCount[2];
        if (detailsCount.length === 2 || (detailsCount.length === 3 && viewDiff >= 3 && exp === 'LF')) {
            AnswerRedis.delLiveClassShowDetails(db.redis.write, showKey, student_id);
            AnswerRedis.setLiveclassShowCount(db.redis.write, countKey, student_id, 0);
            AnswerRedis.setSfShowCount(db.redis.write, sfCountKey, student_id, 1);
            AnswerRedis.setLiveclassExp(db.redis.write, expKey, student_id, 'SF');
        } else if (firstTime == true) {
            AnswerRedis.delLiveClassShowDetails(db.redis.write, showKey, student_id);
            AnswerRedis.setLiveclassShowCount(db.redis.write, countKey, student_id, 0);
            AnswerRedis.setLiveclassExp(db.redis.write, expKey, student_id, 'LF');
            showLiveClass = true;
        } else if (exp === 'LF') {
            showLiveClass = true;
        }
    } else if (sfShowCount >= 3 && exp === 'SF') {
        AnswerRedis.setLiveclassShowCount(db.redis.write, countKey, student_id, 0);
        AnswerRedis.setLiveclassExp(db.redis.write, expKey, student_id, 'LF');
        showLiveClass = true;
    } else if ((liveClassCount >= 1 && exp === 'LF') || (liveClassCount >= 3 && firstTime == true)) {
        AnswerRedis.setLiveclassShowCount(db.redis.write, countKey, student_id, 0);
        AnswerRedis.setSfShowCount(db.redis.write, sfCountKey, student_id, 1);
        AnswerRedis.setLiveclassExp(db.redis.write, expKey, student_id, 'SF');
    } else if (exp === 'SF') {
        sfShowCount++;
        AnswerRedis.setSfShowCount(db.redis.write, sfCountKey, student_id, sfShowCount);
    }
    return showLiveClass;
}

async function addPipModeFlag(db, questionList) {
    let promiseArr = [];
    questionList.forEach((item) => {
        promiseArr.push(AnswerContainer.getByQuestionIdWithTextSolution(item.question_id, db));
    });
    const answerDataArr = await Promise.all(promiseArr);

    promiseArr = [];
    answerDataArr.forEach((item) => {
        if (item[0].answer_id != null) {
            promiseArr.push(AnswerContainer.getAnswerVideoResource(db, item[0].answer_id));
        } else {
            promiseArr.push([]);
        }
    });
    const videoResourcesArr = await Promise.all(promiseArr);

    questionList.forEach((item, index) => {
        if (videoResourcesArr[index].length !== 0) {
            let videoData = [];
            videoData = videoResourcesArr[index].filter((x) => x.resource_type !== 'YOUTUBE');
            if (videoData.length === 0) {
                item.isPlayableInPIP = false;
            } else {
                item.isPlayableInPIP = true;
            }
        } else {
            item.isPlayableInPIP = false;
        }
    });
    return questionList;
}

async function addLocalizedThumbnail(db, similiar_video_data, st_lang_code) {
    try {
        similiar_video_data.forEach((el) => {
            el.locale_thumbnail_image = null;
        });

        if (st_lang_code != 'en') {
            const locDataPromise = [];
            similiar_video_data.forEach((x) => {
                locDataPromise.push(Utility.addThumbnailsByLanguage(db, [{ question_id: x.question_id, matched_question: x.matched_question }], st_lang_code, config));
            });
            const localeDataRes = await Promise.all(locDataPromise);

            similiar_video_data.forEach((x, i) => {
                if (localeDataRes[i] && localeDataRes[i].length == 1) {
                    const locData = localeDataRes[i];
                    if (locData.length) {
                        x.locale_thumbnail_image = locData[0].thumbnail_image;
                    }
                }
            });
        }
        return similiar_video_data;
    } catch (e) {
        console.error(e);
        return similiar_video_data;
    }
}

function giveNoData() {
    return ['Data logic later'];
}

async function newMPVPExperiment(db, req, question_id, student_id, st_lang_code, student_class, version_code, xAuthToken, pznElasticSearchInstance, similarResources, page) {
    try {
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        const similarVideo = [];
        let D0User = false;
        if (version_code >= 1010) {
            const d0UserManager = new D0UserManager(req);
            if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                D0User = true;
            }

            if (D0User) {
                const responseDataObj = d0UserManager.getD0ActivityBannerOnVideoScreen();
                const tempObj = {
                    resource_type: 'widget',
                    widget_data: responseDataObj,
                };
                similarVideo.push(tempObj);
                D0User = true;
            }
        }
        const flagrResp = await CourseContainerv2.getFlagrResp(db, 'mpvp_design_experiment', student_id);
        let designVariant = 0;
        if (_.get(flagrResp, 'mpvp_design_experiment.payload.enabled', true)) {
            designVariant = flagrResp.mpvp_design_experiment.payload.design;
        }
        if (!D0User) {
            let userType = 'FREE';
            const [questionDetails, lastAskedQuestionData] = await Promise.all([MysqlQuestion.getByQuestionId(question_id, db.mysql.read), QuestionMysql.getByQuestionIdFromAliased(db.mysql.read, question_id)]);
            let chapterAlias = '';
            let chapter = '';
            let subject = '';
            let showSrpWidgetManagerWidgets = false;
            let useLastAskedQuestion = false;
            let usequestionDetails = false;
            if (lastAskedQuestionData.length > 0 && lastAskedQuestionData[0].chapter && lastAskedQuestionData[0].subject) {
                useLastAskedQuestion = true;
            } else if (questionDetails.length > 0 && questionDetails[0].chapter && questionDetails[0].subject) {
                usequestionDetails = true;
            }
            if (useLastAskedQuestion || usequestionDetails) {
                if (useLastAskedQuestion) {
                    chapter = lastAskedQuestionData[0].chapter.trim();
                    subject = lastAskedQuestionData[0].subject;
                } else if (usequestionDetails) {
                    chapter = questionDetails[0].chapter.trim();
                    subject = questionDetails[0].subject;
                }
                const subjectArr = ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];
                if (student_class >= 6 && student_class <= 10 && subjectArr.includes(subject.toUpperCase())) {
                    subject = 'SCIENCE';
                }
                showSrpWidgetManagerWidgets = true;
            }
            let [
                totalEngagementTime,
                userActivePackages,
                carousels,
                studentCcmData,
                // eslint-disable-next-line prefer-const
                chapterAliasResponse,
            ] = await Promise.all([
                freeClassHelper.getLast30DaysEngagement(student_id),
                CourseContainerv2.getUserActivePackages(db, student_id),
                CourseContainerv2.getVideoPageCarousels(db, student_class),
                CourseMysqlV2.getCoursesClassCourseMappingWithCategory(db.mysql.read, student_id),
                QuestionContainer.getChapterAliasData(db, chapter),
            ]);
            if (useLastAskedQuestion || usequestionDetails) {
                // fetching chapter alias of the chapter
                if (!_.isEmpty(chapterAliasResponse) && chapterAliasResponse[0] !== undefined && chapterAliasResponse[0].chapter_alias !== '' && chapterAliasResponse[0].chapter_alias != null) {
                    chapterAlias = chapterAliasResponse[0].chapter_alias.trim();
                }
            }
            const srpWidgetManager = new SrpWidgetManager(req);
            srpWidgetManager.subject = subject;
            srpWidgetManager.chapter = chapter;
            srpWidgetManager.chapterAlias = chapterAlias;
            srpWidgetManager.flagrFlow = 2;
            srpWidgetManager.flow = 'case 2';
            srpWidgetManager.lastAskedQuestionData = useLastAskedQuestion ? lastAskedQuestionData : questionDetails;
            srpWidgetManager.query.question_id = question_id;

            studentCcmData = _.orderBy(studentCcmData, ['id'], ['asc']);
            studentCcmData.forEach((x) => {
                x.category = x.course;
            });
            const ccmIdList = studentCcmData.map((x) => x.id);
            userActivePackages = userActivePackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.class === +student_class && item.amount !== -1);
            if (userActivePackages.length > 0) {
                userType = 'VIP';
            }
            totalEngagementTime = Math.round(totalEngagementTime / 60);
            // filter on page, flagr and user type
            const localeTemp = st_lang_code === 'hi' ? 'hi' : 'en';
            carousels = carousels.filter((item) => item.flagVariant === designVariant && (item.user_type === userType || item.user_type === 'ALL') && item.locale === localeTemp);
            // filter on page
            const tempPageCarousels = [];
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].page !== null) {
                    const pageCarousel = carousels[i].page.split('||');
                    if (pageCarousel.length > 0 && pageCarousel.includes(page)) {
                        tempPageCarousels.push(carousels[i]);
                    }
                }
            }
            carousels = tempPageCarousels;

            // filter on ccmid
            const tempCarousels = [];
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].ccm_ids !== null) {
                    const ccmIds = carousels[i].ccm_ids.split(',');
                    if (ccmIds.length > 0 && ccmIds.some((item) => ccmIdList.includes(item))) {
                        tempCarousels.push(carousels[i]);
                    }
                } else {
                    tempCarousels.push(carousels[i]);
                }
            }
            carousels = tempCarousels;

            // filter on et of user
            const tempCarousels2 = [];
            for (let i = 0; i < carousels.length; i++) {
                const greaterThan = carousels[i].et_greater_than;
                let lessThan = carousels[i].et_less_than;
                if (lessThan === null) {
                    lessThan = Number.MAX_SAFE_INTEGER;
                }
                if (totalEngagementTime >= greaterThan && totalEngagementTime <= lessThan) {
                    tempCarousels2.push(carousels[i]);
                }
            }
            carousels = tempCarousels2;

            // filter the srpWidgetmanager widgets
            const tempCarousels3 = [];
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].carousel_type === 'topper_fav' && showSrpWidgetManagerWidgets) {
                    tempCarousels3.push(carousels[i]);
                } else {
                    tempCarousels3.push(carousels[i]);
                }
            }
            carousels = tempCarousels3;

            // sort carousel on carousel_order
            carousels = _.orderBy(carousels, ['carousel_order'], ['asc']);

            // version code check
            carousels = carousels.filter((item) => item.min_version_code <= parseInt(version_code) && parseInt(version_code) <= item.max_version_code);

            // force carousel for campaign users
            if (req.user.campaign && (!isFreeApp)) {
                const campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Video');
                if (campaignDetails.length > 0 && !((designVariant === 0 || designVariant === 1) && totalEngagementTime > 20)) {
                    carousels.unshift({
                        carousel_type: 'widget_popular_course',
                        carousel_order: -1000,
                        scroll_type: 'horizontal',
                        title: 'Popular Courses',
                        title_hindi: 'Popular Courses',
                    });
                }
            }

            // fetch carousel data
            const promise = [];
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].carousel_type === 'widget_parent' && carousels[i].view_type === 'mpvp_trending_classes') {
                    // disable variant <20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'widget_child_autoplay') {
                    // variant 1(horizontal) and variant 3(vertical) <20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'widget_popular_course') {
                    // disable variant & variant 1 >20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'mpvp_trending_classes_v2') {
                    // variant 2 widget 1 <20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'free_live_class_all') {
                    // variant 2 widget 2 <20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'profile_page') {
                    // variant 2 widget 3 <20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'widget_top_selling_subject') {
                    // variant 2 widget 4 <20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'topper_fav') {
                    // variant 2 & variant 3 - widget 1 , >20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'subject_wise_course_card') {
                    // variant 2 & variant 3 - widget 2 , >20 min et
                    promise.push(giveNoData());
                } else if (carousels[i].carousel_type === 'subject_wise_course_card_list') {
                    // variant 2 & variant 3 - widget 3 , >20 min et
                    promise.push(giveNoData());
                }
            }
            const promises2 = [];
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].carousel_type === 'widget_parent' && carousels[i].view_type === 'mpvp_trending_classes') {
                    // disable variant <20 min et
                    if (questionDetails && questionDetails.length > 0) {
                        const chapter1 = questionDetails[0].chapter;
                        const subject1 = questionDetails[0].subject;
                        promises2.push(freeClassHelper.getFreeLiveClassDataFromElastic({
                            db,
                            locale: st_lang_code,
                            classVal: student_class,
                            chapter: chapter1,
                            subject: subject1,
                            liveClassNewFlow: false,
                            mpvpNewFlow: true,
                            versionCode: version_code,
                            student_id,
                            ccmIdList,
                        }));
                    }
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'widget_child_autoplay') {
                    // variant 1(horizontal) and variant 3(vertical) <20 min et
                    const vertical = carousels[i].scroll_type === 'vertical';
                    if (questionDetails && questionDetails.length > 0) {
                        const chapter1 = questionDetails[0].chapter;
                        const subject1 = questionDetails[0].subject;
                        promises2.push(WidgetHelper.getMostWatchedLFVideoPage({
                            db,
                            locale: st_lang_code,
                            classVal: student_class,
                            chapter: chapter1,
                            subject: subject1,
                            liveClassNewFlow: false,
                            mpvpNewFlow: true,
                            versionCode: version_code,
                            student_id,
                            ccmIdList,
                            vertical,
                            carousel: carousels[i],
                        }));
                    }
                } else if (carousels[i].carousel_type === 'widget_popular_course') {
                    // disable variant & variant 1 >20 min et
                    if (isFreeApp) {
                        promises2.push({});
                        continue;
                    }
                    const liveclassPages = ['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP', 'PAID_CONTENT_FEED', 'CHAPTER_SERIES_CAROUSAL', 'HOME_PAGE_REVISION_CLASSES', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'QA_WIDGET_LIVE', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP'];
                    const [flgrResp] = await Promise.all([
                        AnswerContainerv13.getAllFlagsNeededForThePage(xAuthToken, version_code, page, liveclassPages),
                    ]);
                    promises2.push(AnswerHelper.getPopularCoursesCarousel({
                        db,
                        studentId: student_id,
                        studentClass: student_class,
                        versionCode: version_code,
                        studentLocale: st_lang_code,
                        config,
                        xAuthToken,
                        page,
                        eventPage: page,
                        pznElasticSearchInstance,
                        hitFlagr: false,
                        prevFlagrResponse: flgrResp,
                    }));
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'mpvp_trending_classes_v2') {
                    // variant 2 widget 1 <20 min et
                    promises2.push(srpWidgetManager.getTopicIdWiseFreeLiveClassListVideoPage());
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'free_live_class_all') {
                    // variant 2 widget 2 <20 min et
                    promises2.push(LiveClassHelperV6.getLiveClassFreeData(db, student_id, student_class, st_lang_code, version_code, config, carousels[i]));
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'profile_page') {
                    // variant 2 widget 3 <20 min et
                    promises2.push(teslaHelperV1.getTopVideosBySubject(db, student_id, student_class || 12, st_lang_code || 'en', ccmIdList, version_code, 'MPVP'));
                } else if (carousels[i].carousel_type === 'widget_top_selling_subject') {
                    // variant 2 widget 4 <20 min et
                    promises2.push(LiveClassHelperV6.getLiveClassTopSellingSubjectData(db, student_class, st_lang_code, carousels[i]));
                } else if (carousels[i].carousel_type === 'topper_fav') {
                    // variant 2 & variant 3 - widget 1 , >20 min et
                    srpWidgetManager.totalSession = 6;
                    promises2.push(srpWidgetManager.getCcmIdWiseCourseList());
                } else if (carousels[i].carousel_type === 'subject_wise_course_card') {
                    // variant 2 & variant 3 - widget 2 , >20 min et
                    srpWidgetManager.totalSession = 6;
                    srpWidgetManager.flagrFlow = 1;
                    promises2.push(srpWidgetManager.getSubjectWiseCourseCard());
                } else if (carousels[i].carousel_type === 'subject_wise_course_card_list') {
                    // variant 2 & variant 3 - widget 3 , >20 min et
                    promises2.push(srpWidgetManager.getSubjetsCourseCardList());
                }
            }
            const carouselData = await Promise.all(promises2);
            // extra handling for reused widgets
            const widgets = [];
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].carousel_type === 'widget_parent' && carousels[i].view_type === 'mpvp_trending_classes' && carouselData[i].widget_type === 'widget_parent') {
                    carouselData[i].widget_data.top_icon = `${config.staticCDN}/engagement_framework/2A160B7A-232D-04B4-DE80-1023A0709CEA.webp`;
                    carouselData[i].widget_data.top_icon_width = 20;
                    carouselData[i].widget_data.top_icon_height = 20;
                    carouselData[i].widget_data.title_text_max_line = 2;
                    carouselData[i].widget_data.scroll_direction = 'hoizontal';
                    carouselData[i].layout_config.margin_right = 0;
                    carouselData[i].widget_data.title = st_lang_code === 'hi' ? carousels[i].title_hindi : carousels[i].title;
                    for (let j = 0; j < carouselData[i].widget_data.items.length; j++) {
                        if (carouselData[i].widget_data.items && carouselData[i].widget_data.items[j] && carouselData[i].widget_data.items[j].extra_params) {
                            carouselData[i].widget_data.items[j].extra_params.source = 'SimilarVideoFragment';
                        }
                    }
                    widgets.push(carouselData[i]);
                } else if (carousels[i].carousel_type === 'widget_popular_course' && carouselData[i].popularCourseWidget && carouselData[i].popularCourseWidget.widget_data && carouselData[i].popularCourseWidget.widget_data.type === 'widget_popular_course') {
                    if (isFreeApp) {
                        continue;
                    }
                    const popularCourseItems = _.get(carouselData[i], 'popularCourseWidget.widget_data.data.items', null);
                    let widgetPlacement = _.get(carouselData[i], 'widget_placement', null);
                    widgetPlacement = 'video_page';
                    if (popularCourseItems && popularCourseItems.length && widgetPlacement === 'video_page') {
                        const data1 = {
                            delay_in_sec: Data.popular_courses_carousel.delay_in_sec,
                            type: 'widget_popular_course',
                            data: carouselData[i].popularCourseWidget.widget_data.data,
                            extra_params: carouselData[i].popularCourseWidget.widget_data.extra_params,
                        };
                        data1.extra_params.widget_name = 'mpvp_classes_carousel';
                        data1.data.call_impression_api = true;
                        data1.scroll_direction = 'hoizontal';
                        widgets.push(data1);
                    }
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'mpvp_trending_classes_v2' && carouselData[i] && carouselData[i].widget_type === 'widget_autoplay' && carouselData[i].widget_data && carouselData[i].widget_data.border_width !== undefined) {
                    carouselData[i].layout_config.margin_bottom = 10;
                    carouselData[i].layout_config.margin_left = 0;
                    carouselData[i].layout_config.margin_right = 0;
                    carouselData[i].widget_data.border_width = 0;
                    carouselData[i].widget_data.top_icon_width = 20;
                    carouselData[i].widget_data.top_icon_height = 20;
                    carouselData[i].widget_data.title = st_lang_code === 'hi' ? carousels[i].title_hindi : carousels[i].title;
                    delete carouselData[i].widget_data.link_text;
                    delete carouselData[i].widget_data.is_action_button_title_bold;
                    delete carouselData[i].widget_data.deeplink;
                    carouselData[i].widget_data.top_icon = `${config.staticCDN}/engagement_framework/2A160B7A-232D-04B4-DE80-1023A0709CEA.webp`;
                    for (let j = 0; j < carouselData[i].widget_data.items.length; j++) {
                        if (carouselData[i].widget_data.items && carouselData[i].widget_data.items[j] && carouselData[i].widget_data.items[j].data) {
                            if (carouselData[i].widget_data.items[j].data.target_exam) {
                                carouselData[i].widget_data.items[j].data.target_exam = '';
                            }
                            if (carouselData[i].widget_data.items[j].data.page) {
                                carouselData[i].widget_data.items[j].data.page = 'MPVP_CLASSES_CAROUSEL';
                            }
                        }
                    }
                    widgets.push(carouselData[i]);
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'free_live_class_all' && carouselData[i] && carouselData[i][0] && carouselData[i][0].widget_type === 'widget_autoplay') {
                    carouselData[i][0].layout_config.margin_top = 0;
                    carouselData[i][0].widget_data.bg_color = '#ffffff';
                    carouselData[i][0].widget_data.top_icon = `${config.staticCDN}/engagement_framework/EBA41059-F662-E093-92B5-BFED5DEE7F41.webp`;
                    carouselData[i][0].widget_data.top_icon_width = 20;
                    carouselData[i][0].widget_data.top_icon_height = 20;
                    carouselData[i][0].widget_data.title_text_max_line = 2;
                    carouselData[i][0].widget_data.title = st_lang_code === 'hi' ? carousels[i].title_hindi : carousels[i].title;
                    const toshiftItems = [];
                    const toshiftLaterItems = [];
                    for (let j = 0; j < carouselData[i][0].widget_data.items.length; j++) {
                        if (carouselData[i][0].widget_data.items[j] && carouselData[i][0].widget_data.items[j].data && carouselData[i][0].widget_data.items[j].data.bottom_layout && carouselData[i][0].widget_data.items[j].data.bottom_layout.sub_title && st_lang_code === 'hi') {
                            carouselData[i][0].widget_data.items[j].data.bottom_layout.sub_title = carouselData[i][0].widget_data.items[j].data.bottom_layout.sub_title.replace('interested', 'की रुचि है');
                        }
                        if (carouselData[i][0].widget_data.items[j] && carouselData[i][0].widget_data.items[j].data && carouselData[i][0].widget_data.items[j].data.page) {
                            carouselData[i][0].widget_data.items[j].data.page = 'MPVP_CLASSES_CAROUSEL';
                        }
                        if (carouselData[i][0].widget_data.items[j] && carouselData[i][0].widget_data.items[j].data && carouselData[i][0].widget_data.items[j].data.subject == subject) {
                            toshiftItems.push(carouselData[i][0].widget_data.items[j]);
                        } else {
                            toshiftLaterItems.push(carouselData[i][0].widget_data.items[j]);
                        }
                    }
                    const finalListItems = toshiftItems.concat(toshiftLaterItems);
                    carouselData[i][0].widget_data.items = finalListItems;
                    widgets.push(...carouselData[i]);
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'profile_page' && carouselData[i] && carouselData[i][0] && carouselData[i][0].widget_type === 'widget_autoplay') {
                    carouselData[i][0].widget_data.actions = [];
                    carouselData[i][0].widget_data.top_icon = `${config.staticCDN}/engagement_framework/473CA878-8608-8441-093A-D9E69BC63652.webp`;
                    carouselData[i][0].widget_data.top_icon_width = 20;
                    carouselData[i][0].widget_data.top_icon_height = 20;
                    carouselData[i][0].widget_data.title_text_max_line = 2;
                    carouselData[i][0].widget_data.title = st_lang_code === 'hi' ? carousels[i].title_hindi : carousels[i].title;
                    for (let j = 0; j < carouselData[i][0].widget_data.items.length; j++) {
                        if (carouselData[i][0].widget_data.items[j] && carouselData[i][0].widget_data.items[j].data && carouselData[i][0].widget_data.items[j].data.page) {
                            carouselData[i][0].widget_data.items[j].data.page = 'MPVP_CLASSES_CAROUSEL';
                        }
                    }
                    const toshiftItems = [];
                    const toshiftLaterItems = [];
                    for (let j = 0; j < carouselData[i][0].widget_data.tabs.length; j++) {
                        if (carouselData[i][0].widget_data.tabs[j] && carouselData[i][0].widget_data.tabs[j].key == subject.toLowerCase()) {
                            toshiftItems.push(carouselData[i][0].widget_data.tabs[j]);
                        } else {
                            toshiftLaterItems.push(carouselData[i][0].widget_data.tabs[j]);
                        }
                    }
                    if (toshiftItems.length === 1) {
                        toshiftItems[0].is_selected = true;
                        for (let j = 0; j < toshiftLaterItems.length; j++) {
                            toshiftLaterItems[j].is_selected = false;
                        }
                    }
                    const finalListItems = toshiftItems.concat(toshiftLaterItems);
                    carouselData[i][0].widget_data.tabs = finalListItems;
                    widgets.push(...carouselData[i]);
                } else if (carousels[i].carousel_type === 'widget_top_selling_subject' && carouselData[i] && carouselData[i][0] && carouselData[i][0].type === 'widget_top_selling_subject') {
                    const toshiftItems = [];
                    const toshiftLaterItems = [];
                    for (let j = 0; j < carouselData[i][0].data.items.length; j++) {
                        if (carouselData[i][0].data.items && carouselData[i][0].data.items[j] && carouselData[i][0].data.items[j].subject == subject) {
                            toshiftItems.push(carouselData[i][0].data.items[j]);
                        } else {
                            toshiftLaterItems.push(carouselData[i][0].data.items[j]);
                        }
                    }
                    carouselData[i][0].data.title = st_lang_code === 'hi' ? carousels[i].title_hindi : carousels[i].title;
                    const finalListItems = toshiftItems.concat(toshiftLaterItems);
                    carouselData[i][0].data.items = finalListItems;
                    widgets.push(...carouselData[i]);
                } else if (carousels[i].carousel_type === 'topper_fav' && carouselData[i] && carouselData[i].type === 'widget_course_v3') {
                    carouselData[i].data.border_width = 0;
                    carouselData[i].layout_config.margin_left = 0;
                    carouselData[i].layout_config.margin_right = 0;
                    carouselData[i].layout_config.margin_bottom = 0;
                    widgets.push(carouselData[i]);
                } else if (carousels[i].carousel_type === 'subject_wise_course_card' && carouselData[i] && carouselData[i].widget_type === 'widget_parent') {
                    carouselData[i].widget_data.border_width = 0;
                    carouselData[i].layout_config.margin_left = 0;
                    carouselData[i].layout_config.margin_right = 0;
                    carouselData[i].layout_config.margin_bottom = 0;
                    widgets.push(carouselData[i]);
                } else if (carousels[i].carousel_type === 'subject_wise_course_card_list' && carouselData[i] && carouselData[i].widget_type === 'widget_parent') {
                    carouselData[i].widget_data.border_width = 0;
                    carouselData[i].layout_config.margin_left = 0;
                    carouselData[i].layout_config.margin_right = 0;
                    carouselData[i].layout_config.margin_bottom = 0;
                    widgets.push(carouselData[i]);
                } else if (carousels[i].carousel_type === 'widget_autoplay' && carousels[i].view_type === 'widget_child_autoplay' && carouselData[i][0].widget_type === 'widget_autoplay') {
                    carouselData[i][0].widget_data.top_icon = `${config.staticCDN}/engagement_framework/2A160B7A-232D-04B4-DE80-1023A0709CEA.webp`;
                    carouselData[i][0].widget_data.top_icon_width = 20;
                    carouselData[i][0].widget_data.top_icon_height = 20;
                    carouselData[i][0].widget_data.title_text_max_line = 2;
                    widgets.push(...carouselData[i]);
                }
            }
            for (let i = 0; i < widgets.length; i++) {
                if (widgets[i].widget_data || widgets[i].data) {
                    if (widgets[i].extra_params) {
                        widgets[i].extra_params.source = 'SimilarVideoFragment';
                    } else {
                        widgets[i].extra_params = {
                            source: 'SimilarVideoFragment',
                        };
                    }
                    if (widgets[i].widget_data && widgets[i].widget_data.title) {
                        widgets[i].extra_params.parent_title = widgets[i].widget_data.title;
                    } else if (widgets[i].data && widgets[i].data.title) {
                        widgets[i].extra_params.parent_title = widgets[i].data.title;
                    }
                }
            }
            for (let i = 0; i < widgets.length; i++) {
                const temp = {
                    resource_type: 'widget',
                    widget_data: widgets[i],
                };
                similarVideo.push(temp);
            }
        }
        if (similarResources.length) {
            similarResources = similarResources.filter((item) => item.question_id != question_id);
            if (designVariant === 2 || designVariant === 3) {
                similarResources = similarResources.splice(0, 10);
                const tempWidget = {
                    resource_type: 'widget',
                    widget_data: [],
                };
                const widgetSimilar = WidgetHelper.createSimilarWidget(similarResources, st_lang_code);
                if (widgetSimilar && widgetSimilar.widget_data && widgetSimilar.widget_data.items && widgetSimilar.widget_data.items.length > 0) {
                    tempWidget.widget_data = widgetSimilar;
                    if (!D0User) {
                        similarVideo.unshift(tempWidget);
                    } else {
                        similarVideo.push(tempWidget);
                    }
                }
            } else {
                similarVideo.push(...similarResources);
            }
        }
        return similarVideo;
    } catch (e) {
        console.log(e);
        return [];
    }
}

async function viewSimilarQuestions(req, res, next) {
    try {
        const db = req.app.get('db');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const elasticSearchInstance = req.app.get('elasticSearchTestInstance');
        config = req.app.get('config');

        const version_code = req.headers.version_code || 628;
        const xAuthToken = req.headers['x-auth-token'];

        const { student_id, isDropper } = req.user;
        let { student_class, locale: st_lang_code } = req.user;

        const { playlist_id, parent_id: feedbackQid, question_id } = req.body;
        let { page, ocr } = req.body;
        page = !page ? 'DEFAULT' : page;
        page = page === 'WATCH-HISTORY' ? 'SRP' : page;

        const limit = 25;
        const color = ['#eff6fe', '#eff6fe', '#eff6fe', '#eff6fe', '#eff6fe', '#eff6fe'];
        const feedback = { feedback_text: 'Happy with the Solutions', bg_color: _.sample(color), is_show: 0 };
        const latestFromDoubtnutSid = [80, 82, 83, 85, 86, 87, 98];
        const unlockStatus = 1;
        const appCountry = !_.isEmpty(req.headers.country) ? req.headers.country : 'IN';
        const ocrFlag = !!ocr;

        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        let elasticSearchResult;
        const pznSimilarFlagr = { xAuthToken, body: { capabilities: { pzn_similar_logic_ab: {} } } };
        const pznSimilarFlagrResponse = await UtilityFlagr.getFlagrResp(pznSimilarFlagr);
        res.pznSimilarFlagrResponse = pznSimilarFlagrResponse;
        let promises = [];
        promises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id));
        promises.push(LanguageContainer.getByCode(req.user.locale, db));

        const resolvedPromises = await Promise.all(promises);
        const language = resolvedPromises[1].length && resolvedPromises[1].language ? resolvedPromises[1].language : 'english';
        if (resolvedPromises[0].length) {
            ocr = (resolvedPromises[0][0].ocr_text.indexOf('<math')) === -1 ? resolvedPromises[0][0].ocr_text : resolvedPromises[0][0].question;
        }

        const variantId = 3;
        const [etoosVideos, nudgeResource] = await Promise.all([
            bl.getEtoosVideo(db, config, version_code, pznSimilarFlagrResponse, resolvedPromises, pznElasticSearchInstance, student_id, student_class, st_lang_code),
            isFreeApp ? [] : bl.getNudgeData(db, config, student_id, student_class, version_code),
        ]);

        const otherPages = ['SRP', 'BROWSE', 'QUIZ_NOTIFICATION', 'TOPIC_BOOSTER_GAME', 'NOTIFICATION', 'MPVP', 'REFER', 'P2P', 'STUDYDOST', 'STUDYGROUP', 'DEEPLINK', 'DEEPLINK_WEB', 'INAPP', 'COMMUNITY', 'SIMILAR', 'HOME', 'SS', 'SUGGESTIONS', 'APP_INDEXING', 'VIDEO_HISTORY', 'SEARCH_SRP', 'HOME_WIDGET', 'E_LECTURES', 'E_FACULTY', 'MOCK_TEST', 'STRUCTURED', 'LIVECLASS_RESOURCE', 'PERSONALIZATION', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'LIVECLASS_ALERT', 'PRACTICE_CORNER', 'OTHER_MATCH_VIDEOS', 'LIVE_CLASS_MPVP', 'HOMEWORK_SOLUTION', 'REWARDS', 'MPVP_BOTTOM_SHEET', 'PAID_CONTENT_FEED', 'DEFAULT', 'EXAM_CORNER', 'HOME_PAGE_REVISION_CLASSES', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'LIVECLASS_FREE', 'QA_WIDGET_LIVE', 'QA_WIDGET_TOPIC', 'QA_WIDGET_BOOK', 'SRP_WIDGET_LIVE', 'STUDENT_PROFILE', 'SC', 'CC', 'BROWSE_MC', 'SEARCH_MC', 'SEARCH_SC', 'REFERRAL_V2', 'SCHOLARSHIP_TEST', 'SCHOLARSHIP_TEST_COD'];
        const homepagePlaylistPages = ['SRP_PLAYLIST', 'NON_SRP_PLAYLIST', 'RECOMENDED_PLAYLIST'];

        if (appCountry === 'US') {
            if (page === 'LIBRARY') {
                const { playlist_id: playlistId } = req.body;
                const playlistNewLibraryData = await Question.getDataByPlaylistId(db.mysql.read, playlistId);
                if (playlistNewLibraryData.length > 0 && !_.isEmpty(playlistNewLibraryData[0].resource_path)) {
                    const sql = playlistNewLibraryData[0].resource_path;
                    const sCcmData = await ClassCourseMappingContainer.getStudentCcmIds(db, student_id);

                    let str = _.replace(sql, /xxlanxx/g, language);
                    str = _.replace(str, /xxclsxx/g, student_class);
                    str = _.replace(str, /xxsidxx/g, student_id);
                    if (sCcmData.length && sCcmData[0]) {
                        str = _.replace(str, /xxccmxx/g, sCcmData[0]);
                    }
                    str = str.replace('?', playlistId);

                    const queryForVideoList = await Question.getSimilarQuestionsDataByQuery(db.mysql.read, str);
                    const promiseArr = [];
                    queryForVideoList.forEach((item) => {
                        promiseArr.push(Question.getQuestionDataByQuestionId(db.mysql.read, item.question_id));
                    });
                    const qDetailsArr = await Promise.all(promiseArr);

                    let finalQuestionsArr = [];
                    queryForVideoList.forEach((item, index) => {
                        const obj = {
                            question_id: qDetailsArr[index][0].question_id,
                            ocr_text: qDetailsArr[index][0].ocr_text,
                            doubt: qDetailsArr[index][0].doubt,
                            matched_question: qDetailsArr[index][0].matched_question,
                            subject: qDetailsArr[index][0].subject,
                            target_course: qDetailsArr[index][0].target_course,
                            book_meta: qDetailsArr[index][0].book_meta,
                            duration: qDetailsArr[index][0].duration,
                        };
                        finalQuestionsArr.push(obj);
                    });
                    finalQuestionsArr = await Utility.addThumbnailsByLanguage(db, finalQuestionsArr, 'en', config);
                    finalQuestionsArr = await Answer_Container.getTotalLikesShare(db, finalQuestionsArr, student_id, unlockStatus, version_code, variantId, page, 'US');

                    let flag = 0;
                    const preArr = [];
                    const postArr = [];
                    finalQuestionsArr.forEach((item) => {
                        if (item.question_id == question_id) {
                            flag = 1;
                        } else if (flag === 1) {
                            postArr.push(item);
                        } else {
                            preArr.push(item);
                        }
                    });
                    const sortedArr = [...postArr, ...preArr];

                    const data = {
                        message: 'data found',
                        similar_video: sortedArr,
                    };
                    res.data = data;
                    return next();
                }
                const data = {
                    message: 'No data found',
                };
                res.data = data;
                return next();
            }
            elasticSearchResult = await getSimilarByOcrForUs(db, ocr, elasticSearchInstance, question_id);
            elasticSearchResult = await Utility.addThumbnailsByLanguage(db, elasticSearchResult, 'en', config);
            promises = [];
            promises.push(Answer_Container.getTotalLikesShare(db, elasticSearchResult, student_id, unlockStatus, version_code, variantId, page, appCountry));
            const promiseResult = await Promise.all(promises);

            const data = {
                similar_video: promiseResult[0],
            };
            res.data = data;
            return next();
        }

        if ((page === 'SRP' || page === 'DEEPLINK_WEB') && version_code > 649) {
            elasticSearchResult = await getSimilarByOcr(db, ocr, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, language, elasticSearchInstance, question_id, feedbackQid, version_code, ocrFlag);
            elasticSearchResult = await Utility.addThumbnailsByLanguage(db, elasticSearchResult, st_lang_code, config);
            promises = [];
            const countKey = 'lc_count';
            promises.push(Answer_Container.getTotalLikesShare(db, elasticSearchResult, student_id, unlockStatus, version_code, variantId, page));
            promises.push(Answer_Container.getLiveclassShowCount(db.redis, countKey, student_id));
            const promiseResult = await Promise.all(promises);
            let qList = await addPipModeFlag(db, promiseResult[0]);

            const versionCode = 2;
            let showLiveClass = false;
            let liveClassCount = promiseResult[1];
            showLiveClass = await liveClassShowDecider(liveClassCount, countKey, student_id, db);
            if (etoosVideos.length && versionCode != 5 && showLiveClass && page !== 'SRP') {
                qList = [...etoosVideos, ...qList];
                liveClassCount++;
                AnswerRedis.setLiveclassShowCount(db.redis.write, countKey, student_id, liveClassCount);
            }

            if (nudgeResource.length > 0) {
                qList.splice(2, 0, nudgeResource[0]);
            }
            const similarResources = await addLocalizedThumbnail(db, qList, st_lang_code);
            const similarVideoTemp = await newMPVPExperiment(db, req, question_id, student_id, st_lang_code, student_class, version_code, xAuthToken, pznElasticSearchInstance, similarResources, page);
            let similarVideo = similarResources;
            if (similarVideoTemp.length > 0) {
                similarVideo = similarVideoTemp;
            }
            if (page === 'DEEPLINK_WEB') {
                similarVideo = similarVideo.filter((video) => video.resource_type !== 'text');
                similarVideo = similarVideo.map((video) => {
                    if (video.question_id) {
                        video.thumbnail_image = `${config.staticCDN}q-thumbnail/${video.question_id}.webp`;
                    }
                    return video;
                });
            }
            const data = {
                concept_video: [],
                similar_video: similarVideo,
                feedback,
                promotional_data: [],
            };
            res.data = data;
            return next();
        }

        const bookmetaData = await Question.getBookMetaData(question_id, db.mysql.read);
        if (bookmetaData && bookmetaData.length > 0 && bookmetaData[0].doubt && !homepagePlaylistPages.includes(page) && page !== 'DAILY_DOUBT') {
            const prom = [];
            prom.push(QuestionContainer.getSimilarQuestionFromBookMeta(db, bookmetaData[0].doubt));
            prom.push(appConfigConatiner.getWhatsappData(db, student_class));
            prom.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
            const resolvedP = await Promise.all(prom);
            let questionList = resolvedP[0];
            const whatsappData = resolvedP[1];
            questionList = await Utility.addThumbnailsByLanguage(db, questionList, 'en', config);
            questionList = await Answer_Container.getTotalLikesShare(db, questionList, student_id, unlockStatus, version_code, variantId, page);
            for (let i = 0; i < questionList.length; i++) {
                if (questionList[i].question_id == question_id) {
                    const left_data = questionList.slice(0, i);
                    const right_data = questionList.slice(i + 1, questionList.length);
                    questionList = right_data.concat(left_data);
                    break;
                }
            }
            if (whatsappData.length > 0 && page !== 'SRP' && variantId == 2) {
                const data1 = Utility.getWhatsappDataModified(whatsappData);
                if (questionList && questionList.length > 5) {
                    questionList.splice(Data.whatsappCardPosition, 0, data1);
                }
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

            let concept_video = [];
            if (question_id && ((variantId == 3 && page !== 'SRP') || ((variantId == 1 || variantId == 2) && page === 'SRP'))) {
                const temp = await QuestionContainer.relatedConcept(question_id, 2, db);
                if (temp && temp.length > 0) {
                    concept_video = await Utility.addThumbnailsByLanguage(db, temp, st_lang_code, config);
                    for (let j = 0; j < concept_video.length; j++) {
                        concept_video[j].is_locked = 0;
                        concept_video[j].bg_color = _.sample(color);
                    }
                }
            }

            questionList = await addPipModeFlag(db, questionList);
            if (etoosVideos.length > 0 && page !== 'MPVP') {
                questionList = [...etoosVideos, ...questionList];
            }
            if (nudgeResource.length > 0) {
                questionList.splice(2, 0, nudgeResource[0]);
            }

            const similarResources = await addLocalizedThumbnail(db, questionList, st_lang_code);
            let similarVideo = similarResources;
            if (page === 'MPVP') {
                const similarVideoTemp = await newMPVPExperiment(db, req, question_id, student_id, st_lang_code, student_class, version_code, xAuthToken, pznElasticSearchInstance, similarResources, page);
                if (similarVideoTemp.length > 0) {
                    similarVideo = similarVideoTemp;
                }
            }
            const data = {
                concept_video,
                similar_video: similarVideo,
                feedback,
                promotional_data: banner,
            };
            res.data = data;
            return next();
        }

        if (_.includes(otherPages, page) && playlist_id !== 'TEACHER_CHANNEL' && question_id && ocr !== null) {
            const specialPlaylistStudentId = [100];
            if (_.includes(specialPlaylistStudentId, resolvedPromises[0][0].student_id)) {
                const split_doubt = resolvedPromises[0][0].doubt.split('_');
                const doubt = `${split_doubt[0]}_${split_doubt[1]}_${split_doubt[2]}_${split_doubt[3]}`;
                const prom = [];
                prom.push(MysqlQuestion.getSpecialQuestionList(question_id, resolvedPromises[0][0].student_id, resolvedPromises[0][0].class, doubt, db.mysql.read));
                prom.push(appConfigConatiner.getWhatsappData(db, student_class));
                prom.push(AppBannerContainer.getPromotionalData(db, student_class, 'NOTIFICATION', version_code));
                const resolvedP = await Promise.all(prom);
                let questionList = resolvedP[0];
                const whatsappData = resolvedP[1];
                // questionList = Utility.addThumbnailWithLanguage(questionList, 'en', config);
                questionList = await Utility.addThumbnailsByLanguage(db, questionList, 'en', config);
                questionList = await Answer_Container.getTotalLikesShare(db, questionList, student_id, unlockStatus, version_code, variantId, page);
                for (let i = 0; i < questionList.length; i++) {
                    if (questionList[i].question_id == question_id) {
                        const left_data = questionList.slice(0, i);
                        const right_data = questionList.slice(i + 1, questionList.length);
                        questionList = right_data.concat(left_data);
                        break;
                    }
                }
                if (whatsappData.length > 0 && page !== 'SRP' && variantId == 2) {
                    const data1 = Utility.getWhatsappDataModified(whatsappData);
                    questionList.splice(Data.whatsappCardPosition, 0, data1);
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

                if (etoosVideos.length > 0 && page !== 'MPVP') {
                    questionList = [...etoosVideos, ...questionList];
                }

                if (nudgeResource.length > 0) {
                    questionList.splice(2, 0, nudgeResource[0]);
                }

                const similarResources = await addLocalizedThumbnail(db, questionList, st_lang_code);
                let similarVideo = similarResources;
                if (page === 'MPVP') {
                    const similarVideoTemp = await newMPVPExperiment(db, req, question_id, student_id, st_lang_code, student_class, version_code, xAuthToken, pznElasticSearchInstance, similarResources, page);
                    if (similarVideoTemp.length > 0) {
                        similarVideo = similarVideoTemp;
                    }
                }
                const data = { similar_video: similarVideo, feedback, promotional_data: banner };
                res.data = data;
                return next();
            }

            if (resolvedPromises[0][0].student_id < 100 && !_.includes(Data.et_student_id, resolvedPromises[0][0].student_id)) {
                // split doubt field
                promises = [];
                if (_.includes(latestFromDoubtnutSid, resolvedPromises[0][0].student_id)) {
                    promises.push(Question.viralVideos(limit, student_class, db.mysql.read));
                } else {
                    promises.push(QuestionContainer.rescursiveList(resolvedPromises[0][0], 1, 10, [], db));
                }
                promises.push(appConfigConatiner.getWhatsappData(db, student_class));
                promises.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
                const resolvedP = await Promise.all(promises);
                let questionList = resolvedP[0];
                const whatsappData = resolvedP[1];
                questionList = await Utility.addThumbnailsByLanguage(db, questionList, 'en', config);
                if (questionList.length === 0) {
                    questionList = await getSimilarByOcr(db, ocr, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, language, elasticSearchInstance, question_id, feedbackQid, version_code);
                    if (!questionList.length) {
                        questionList = await QuestionContainer.getGuidanceVideo(db, limit);
                    }
                    questionList = await Utility.addThumbnailsByLanguage(db, questionList, req.user.locale, config);
                }
                questionList = await Answer_Container.getTotalLikesShare(db, questionList, student_id, unlockStatus, version_code, variantId, page);
                if (whatsappData.length > 0 && page !== 'SRP' && +variantId === 2) {
                    const data1 = Utility.getWhatsappDataModified(whatsappData);
                    questionList.splice(Data.whatsappCardPosition, 0, data1);
                }
                let concept_video = [];
                if (question_id && ((variantId == 3 && page !== 'SRP') || ((variantId == 1 || variantId == 2) && page === 'SRP'))) {
                    const temp = await QuestionContainer.relatedConcept(question_id, 2, db);
                    if (temp && temp.length > 0) {
                        concept_video = await Utility.addThumbnailsByLanguage(db, temp, st_lang_code, config);
                        for (let j = 0; j < concept_video.length; j++) {
                            concept_video[j].is_locked = 0;
                            concept_video[j].bg_color = _.sample(color);
                        }
                    }
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

                if (page === 'SIMILAR' || page === 'MPVP_BOTTOM_SHEET' || page === 'DEFAULT') {
                    questionList = await addPipModeFlag(db, questionList);
                }

                if (etoosVideos.length > 0 && page !== 'MPVP') {
                    questionList = [...etoosVideos, ...questionList];
                }

                if (nudgeResource.length > 0) {
                    questionList.splice(2, 0, nudgeResource[0]);
                }
                const similarResources = await addLocalizedThumbnail(db, questionList, st_lang_code);
                let similarVideo = similarResources;
                if (page === 'MPVP') {
                    const similarVideoTemp = await newMPVPExperiment(db, req, question_id, student_id, st_lang_code, student_class, version_code, xAuthToken, pznElasticSearchInstance, similarResources, page);
                    if (similarVideoTemp.length > 0) {
                        similarVideo = similarVideoTemp;
                    }
                }

                const data = {
                    concept_video,
                    similar_video: similarVideo,
                    feedback,
                    promotional_data: banner,
                };
                res.data = data;
                return next();
            }

            let elasticSearchResult = await getSimilarByOcr(db, ocr, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, language, elasticSearchInstance, question_id, feedbackQid, version_code);
            elasticSearchResult = await Utility.addThumbnailsByLanguage(db, elasticSearchResult, st_lang_code, config);
            const promise = [];
            promise.push(Answer_Container.getTotalLikesShare(db, elasticSearchResult, student_id, unlockStatus, version_code, variantId, page));
            promise.push(appConfigConatiner.getWhatsappData(db, student_class));
            promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
            const promiseResult = await Promise.all(promise);
            if (promiseResult[1].length > 0 && page !== 'SRP' && variantId == 2) {
                const data1 = Utility.getWhatsappDataModified(promiseResult[1]);
                promiseResult[0].splice(Data.whatsappCardPosition, 0, data1);
            }
            let concept_video = [];
            if (question_id && ((variantId == 3 && page !== 'SRP') || ((variantId == 1 || variantId == 2) && page === 'SRP'))) {
                const temp = await QuestionContainer.relatedConcept(question_id, 2, db);
                if (temp && temp.length > 0) {
                    concept_video = await Utility.addThumbnailsByLanguage(db, temp, st_lang_code, config);
                    for (let j = 0; j < concept_video.length; j++) {
                        concept_video[j].is_locked = 0;
                        concept_video[j].bg_color = _.sample(color);
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

            if (page === 'SIMILAR' || page === 'MPVP_BOTTOM_SHEET' || page === 'DEFAULT') {
                elasticSearchResult = await addPipModeFlag(db, elasticSearchResult);
            }

            if (etoosVideos.length > 0 && page !== 'MPVP') {
                elasticSearchResult = [...etoosVideos, ...elasticSearchResult];
            }

            if (nudgeResource.length > 0) {
                elasticSearchResult.splice(2, 0, nudgeResource[0]);
            }
            const similarResources = await addLocalizedThumbnail(db, elasticSearchResult, st_lang_code);
            let similarVideo = similarResources;
            if (page === 'MPVP') {
                const similarVideoTemp = await newMPVPExperiment(db, req, question_id, student_id, st_lang_code, student_class, version_code, xAuthToken, pznElasticSearchInstance, similarResources, page);
                if (similarVideoTemp.length > 0) {
                    similarVideo = similarVideoTemp;
                }
            }

            const data = {
                concept_video,
                similar_video: similarVideo,
                feedback,
                promotional_data: banner,
            };
            res.data = data;
            return next();
        } if ((page === 'LIBRARY' || page === 'HOME_FEED' || (page === 'HOME_PAGE' && playlist_id !== 'TEACHER_CHANNEL') || page === 'SRP_PLAYLIST' || page === 'NON_SRP_PLAYLIST' || page === 'RECOMENDED_PLAYLIST' || page === 'HOME_FEED_CHANNELS' || page === 'DAILY_DOUBT' || page === 'TEACHER_INTRO' || page === 'QA_WIDGET_TOPIC') && typeof req.body.playlist_id !== 'undefined' && req.body.playlist_id !== '' && typeof req.body.question_id !== 'undefined' && req.body.question_id !== '') {
            let playlistData;
            promises = [];
            let resolvedPromises;

            if (playlist_id === 'TRENDING') {
                promises.push(Question.getTrendingVideos(student_class, limit, language, db.mysql.read));
            } else if (playlist_id === 'CONCEPT_VIDEOS') {
                const temp = await Question.getMcIdbyQid(student_class, question_id, db.mysql.read);
                promises.push(Question.getSimilarQuestionsByMcId(temp[0].microconcept, limit, db.mysql.read));
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
            } else if (playlist_id === 'VIRAL') {
                promises.push(Question.viralVideos(limit, student_class, db.mysql.read));
            } else if (playlist_id === 'LATEST_FROM_DOUBTNUT') {
                promises.push(Question.latestFromDoubtnutSimilar(limit, student_class, db.mysql.read));
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
            } else if (playlist_id === 'NCERT' && !homepagePlaylistPages.includes(page)) {
                const resPromise = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                promises.push(Answer.getNcertSimilarVideosUpdated(question_id, resPromise[0].doubt, limit, db.mysql.read));
            } else if (homepagePlaylistPages.includes(page)) {
                promises.push(bl.getSimilarDataFromPlaylistRedis(db, question_id, student_class, student_id, page));
            } else if (page === 'DAILY_DOUBT') {
                promises.push(bl.getSimilarDataFromDailyDoubtRedis(db, question_id, student_id));
            } else if (page === 'QA_WIDGET_TOPIC') {
                promises.push(bl.getQaWidgetDataFromRedis(db, question_id, student_id));
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
            }

            promises.push(LanguageContainer.getList(db));
            resolvedPromises = await Promise.all(promises);

            promises = [];
            playlistData = resolvedPromises[0];

            if (playlistData.length) {
                for (let i = 0; i < playlistData.length; i++) {
                    if (playlistData[i].question_id == question_id) {
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
                let matchedQuestionsHtml;
                let groupedMatchedQuestionHtml;
                if (language === 'english' && playlistData.length > 0) {
                    matchedQuestionsHtml = await MysqlQuestion.getMathJaxHtmlByIds(matchesQuestionArray, db.mysql.read);
                    groupedMatchedQuestionHtml = _.groupBy(matchedQuestionsHtml, 'question_id');
                }

                for (let i = 0; i < playlistData.length; i++) {
                    if (language !== 'english') {
                        promises.push(Language.changeLanguage(playlistData[i].question_id, language, db.mysql.read));
                    } else if (language === 'english' && groupedMatchedQuestionHtml[playlistData[i].question_id] && groupedMatchedQuestionHtml[playlistData[i].question_id].length > 0) {
                        playlistData[i].html = groupedMatchedQuestionHtml[playlistData[i].question_id][0].html;
                    }
                }
                resolvedPromises = await Promise.all(promises);
                for (let i = 0; i < resolvedPromises.length; i++) {
                    if ((typeof resolvedPromises[i] !== 'undefined') && resolvedPromises[i].length > 0) {
                        playlistData[i].ocr_text = resolvedPromises[i][0][language];
                    }
                }
                const specialThumbnailIds = ['BOOKS_-53', 'BOOKS_-55', 'BOOKS_80', 'BOOKS_93', 'BOOKS_94', 'BOOKS_-194'];
                if (playlist_id === 'VIRAL' || playlist_id === 'LATEST_FROM_DOUBTNUT' || playlist_id === 'CRASH_COURSE' || (playlist_id.includes('BOOKS_') && specialThumbnailIds.includes(playlist_id))) {
                    st_lang_code = 'en';
                    playlistData = Utility.addThumbnailWithLanguage(playlistData, st_lang_code, config);
                } else {
                    playlistData = await Utility.addThumbnailsByLanguage(db, playlistData, st_lang_code, config);
                }

                const promise = [];
                promise.push(Answer_Container.getTotalLikesShare(db, playlistData, student_id, unlockStatus, version_code, variantId, page));
                promise.push(appConfigConatiner.getWhatsappData(db, student_class));
                if (playlist_id == 'TRICKY_QUESTION') {
                    promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'NOTIFICATION', version_code));
                } else {
                    promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'SIMILAR', version_code));
                }
                const promiseResult = await Promise.all(promise);
                if (promiseResult[1].length > 0 && variantId == 2) {
                    const data1 = Utility.getWhatsappDataModified(promiseResult[1]);
                    playlistData.splice(Data.whatsappCardPosition, 0, data1);
                }

                // concept videos caraousel goes here
                let concept_video = [];
                if (playlist_id !== 'CONCEPT_VIDEOS' && question_id && variantId === 3) {
                    const temp = await QuestionContainer.relatedConcept(question_id, 2, db);
                    if (temp && temp.length > 0) {
                        concept_video = await Utility.addThumbnailsByLanguage(db, temp, st_lang_code, config);
                        for (let j = 0; j < concept_video.length; j++) {
                            concept_video[j].is_locked = 0;
                            concept_video[j].bg_color = _.sample(color);
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

                if (etoosVideos.length > 0) {
                    playlistData = [...etoosVideos, ...playlistData];
                }

                if (nudgeResource.length > 0) {
                    playlistData.splice(2, 0, nudgeResource[0]);
                }

                const data = {
                    concept_video,
                    similar_video: await addLocalizedThumbnail(db, playlistData, st_lang_code),
                    feedback,
                    promotional_data: banner,
                };
                res.data = data;
                return next();
            }
            const quesDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, req.body.question_id);
            if (quesDetails.length) {
                elasticSearchResult = await getSimilarByOcr(db, quesDetails[0].ocr_text, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, language, elasticSearchInstance, req.body.question_id, feedbackQid, version_code, ocrFlag);
                promises = [];
                promises.push(Utility.addThumbnailsByLanguage(db, elasticSearchResult, st_lang_code, config));
                promises.push(Answer_Container.getTotalLikesShare(db, elasticSearchResult, student_id, unlockStatus, version_code, variantId, page));
                const promiseResult = await Promise.all(promises);

                const data = {
                    similar_video: await addLocalizedThumbnail(db, promiseResult[1], st_lang_code),
                    feedback,
                };
                res.data = data;
                return next();
            }
            const responseData = {
                meta: {
                    code: 404,
                    success: false,
                    message: 'No Question Found',
                },
                data: null,
            };
            res.status(responseData.meta.code).json(responseData);
        } else if (page === 'STRUCTURED') {
            let elasticSearchResult = await getSimilarByOcr(db, ocr, config.elastic.REPO_INDEX_WITH_TEXT_SOLUTION, language, elasticSearchInstance, req.body.question_id, feedbackQid, version_code);
            elasticSearchResult = await Utility.addThumbnailsByLanguage(db, elasticSearchResult, st_lang_code, config);
            const data = { similar_video: elasticSearchResult, promotional_data: [], feedback };
            res.data = data;
            return next();
        } else if (page === 'TOP_FREE_CLASSES') {
            const { question_id: questionID } = req.body;
            const locale = LiveclassData.localeMapping[st_lang_code];
            let questionList = await MysqlQuestion.getTopFreeClassQuestions(db.mysql.read, questionID, student_class, locale);
            questionList = await Answer_Container.getTotalLikesShare(db, questionList, student_id, unlockStatus, version_code, variantId, page);
            questionList = questionList.map((item) => ({
                ...item,
                thumbnail_image: `${config.staticCDN}q-thumbnail/${item.question_id}.png`,
            }));

            const data = {
                similar_video: await addLocalizedThumbnail(db, questionList, st_lang_code),
                feedback,
            };
            res.data = data;
            return next();
        } else if ((page === 'HOME_PAGE' || page === 'DEEPLINK') && playlist_id === 'TEACHER_CHANNEL') {
            const { question_id: questionID } = req.body;
            let videos;
            const teacher = await TeacherMysql.getTeacherIdByQuestionId(db.mysql.read, questionID.toString());
            let state = 1;
            if (!_.isEmpty(teacher) && teacher[0].faculty_id != null) {
                videos = await TeacherContainer.getTeacherVideos(db, teacher[0].faculty_id, version_code, limit);
                videos = videos.filter((item) => item.resource_reference != questionID);
                state = 2;
            }
            if (_.isEmpty(videos)) {
                let teacherByCCM;
                const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMappingWithCategory(db.mysql.read, student_id);
                if (student_class == '12' && isDropper) {
                    student_class = '13';
                }
                if (_.includes(['6', '7', '8', '14'], student_class)) {
                    teacherByCCM = await TeacherContainer.getTeacherByClassLocale(db, student_class, st_lang_code);
                } else {
                    const ccmIdArrayExam = [];
                    const ccmIdArrayBoard = [];
                    const studentCcmDataExam = studentCcmData.filter((item) => item.ccm_category === 'exam' || item.ccm_category === 'other-exam');
                    const studentCcmDataBoard = studentCcmData.filter((item) => item.ccm_category === 'board' || item.ccm_category === 'other-board');
                    studentCcmDataExam.forEach((item) => ccmIdArrayExam.push(item.id));
                    studentCcmDataBoard.forEach((item) => ccmIdArrayBoard.push(item.id));
                    const workerTeacherByCCMExam = [];
                    const workerTeacherByCCMBoard = [];
                    for (let i = 0; i < ccmIdArrayExam.length; i++) {
                        workerTeacherByCCMExam.push(TeacherContainer.getTeacherByCCMExam(db, ccmIdArrayExam[i], student_class));
                    }
                    for (let i = 0; i < ccmIdArrayBoard.length; i++) {
                        workerTeacherByCCMBoard.push(TeacherContainer.getTeacherByCCMBoard(db, ccmIdArrayBoard[i], student_class));
                    }
                    let teacherByCCMBoard = await Promise.all(workerTeacherByCCMBoard);
                    let teacherByCCMExam = await Promise.all(workerTeacherByCCMExam);
                    teacherByCCMBoard = teacherByCCMBoard.flat(1);
                    teacherByCCMExam = teacherByCCMExam.flat(1);
                    teacherByCCMBoard = teacherByCCMBoard.filter((item) => item !== null || item !== undefined);
                    teacherByCCMExam = teacherByCCMExam.filter((item) => item !== null || item !== undefined);
                    teacherByCCM = teacherByCCMBoard.concat(teacherByCCMExam);
                }
                // teacherByCCM = teacherByCCM.filter((item) => !subscribedTeachers.includes(item.teacher_id));
                teacherByCCM = teacherByCCM.filter((thing, index, self) => index === self.findIndex((t) => (
                    t.teacher_id === thing.teacher_id
                )));
                const teacherByCCMIdList = [];
                teacherByCCM.forEach((item) => teacherByCCMIdList.push(item.teacher_id));
                const worker = [];
                for (let i = 0; i < teacherByCCMIdList.length; i++) {
                    worker.push(TeacherContainer.getTeacherVideos(db, teacherByCCMIdList[i], version_code, limit));
                }
                videos = await Promise.all(worker);
                videos = videos.flat(1);
                videos = videos.filter((item) => item.resource_reference != questionID);
                state = 3;
            }
            if (!_.isEmpty(videos)) {
                videos = videos.filter((item) => item !== null || item !== undefined);
                videos = videos.filter((item) => item.is_uploaded == 1);
                videos.sort((a, b) => b.created_at - a.created_at);
                videos = videos.slice(0, limit);
                const item = [];
                for (let i = 0; i < videos.length; i++) {
                    const bgArr = Data.teacherChannelVideoBackgroundArr;
                    item.push({
                        deeplink: `doubtnutapp://video?qid=${videos[i].resource_reference}&page=HOME_PAGE&playlist_id=TEACHER_CHANNEL`,
                        // image_url: Utility.convertoWebP(videos[i].image_url),
                        image_url: videos[i].image_url,
                        course_resource_id: videos[i].id,
                        question_id: videos[i].resource_reference,
                        background_color: bgArr[i % 4],
                        image_text: (_.isEmpty(videos[i].image_url)) ? videos[i].name : '',
                        title1: videos[i].name,
                        title2: `${videos[i].fname} ${videos[i].lname} | ${videos[i].board}`,
                        description: videos[i].description,
                        // teacher_image: videos[i].img_url ? Utility.convertoWebP(videos[i].img_url) : Data.teacherDefaultImage,
                        teacher_image: videos[i].img_url ? videos[i].img_url : Data.teacherDefaultImage,
                        tag_text: `Class ${videos[i].class} | ${videos[i].subject}`,
                        card_width: '1.1',
                        card_ratio: '16:9',
                    });
                }
                let title = st_lang_code === 'hi' ? 'टीचर के चैनल के लेटेस्ट वीडियो' : "Teacher's Channels ke Latest Videos";
                if (state === 2) {
                    title = st_lang_code === 'hi' ? `${videos[0].fname} ${videos[0].lname} के अन्य वीडियो` : `${videos[0].fname} ${videos[0].lname} ke Similar Videos`;
                }
                const data = {
                    similar_video: [{
                        resource_type: 'widget',
                        widget_data: {
                            widget_type: 'channel_video_content',
                            widget_data: {
                                title,
                                items: item,
                                list_orientation: 3,
                            },
                        },
                    }],
                    feedback,
                };
                res.data = data;
                return next();
            }
        } else if (page === 'TOP_TEACHERS_CLASSES' || page === 'TOP_TEACHERS_CLASSES_ALL') {
            // top teachers classes
            const { question_id: questionID } = req.body;
            if (version_code >= 884) {
                const studentSubscriptionDetails = await CourseContainerv2.getUserActivePackages(db, student_id);
                // * Filter out course or class assortment from (studentSubscriptionDetails) object array for my_courses carousel on home page
                const studentCourseOrClassSubcriptionDetails = studentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.amount !== -1);
                const myClassesWidgetObj = await CourseControllerV1.getClassesOfChapterByQuestionID(db, config, st_lang_code, version_code, questionID, studentCourseOrClassSubcriptionDetails, student_id);
                const widgets = [];
                if (!myClassesWidgetObj.isOnlyOneVideoPresent) {
                    widgets.unshift(...myClassesWidgetObj.widgets);
                }
                const similarVideo = [];
                for (let i = 0; i < widgets.length; i++) {
                    const temp = {
                        resource_type: 'widget',
                        widget_data: widgets[i],
                    };
                    similarVideo.push(temp);
                }
                const data = {
                    similar_video: similarVideo,
                    feedback,
                };
                res.data = data;
                return next();
            }
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getPlaylistByTag(req, res, next) {
    try {
        const db = req.app.get('db');
        config = req.app.get('config');
        const questionId = req.query.question_id;
        const playlistId = req.query.playlist_id;
        const pageNo = req.query.page_no;
        const unlockStatus = 1;
        const limit = 10;
        const studentId = req.user.student_id;
        const { tag } = req.query;
        const temp = await MysqlAnswer.getPlaylistByQuestionId(questionId, tag, db.mysql.read);
        let playlist = await MysqlAnswer.getPlaylistByBookmeta(temp[0].book_meta, pageNo, limit, db.mysql.read);
        // playlist = Utility.addThumbnailWithLanguage(playlist, 'en', config);
        playlist = await Utility.addThumbnailsByLanguage(db, playlist, 'en', config);
        playlist = await Answer_Container.getTotalLikesShare(db, playlist, studentId, unlockStatus);
        const data = {};
        data.library_playlist_id = playlistId;
        data.playlist = playlist;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function advancedSearch(req, _res, next) {
    const staticParams = {
        elasticSearchInstance: req.app.get('elasticSearchInstance'),
        db: req.app.get('db'),
        config: req.app.get('config'),
        versionCode: req.headers.version_code,
        xAuthToken: req.headers['x-auth-token'],
    };
    let question_image;
    try {
        const { facets } = req.body;
        const { student_id } = req.user;
        const selectedFacet = facets.find((x) => x.isSelected);
        if (!selectedFacet) {
            throw new Error('No facet selected');
        }
        const matchArray = await bl.advancedSearchWithFilter(staticParams, req.user.student_id, req.body.ocr_text, selectedFacet.data);
        if (req.headers.version_code && req.headers.version_code > 659) {
            bl.pushFacetCard(matchArray, facets, req.body.topicsPosition);
        }

        if (req.headers.version_code && req.headers.version_code === 685) {
            const quesDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(staticParams.db, req.body.question_id);
            if (quesDetails[0].question_image && matchArray.length > 0) {
                question_image = Data.questionAskUrlPrefix + quesDetails[0].question_image;
                req.body.question_image = question_image;
                bl.pushBountyCard(matchArray, '');
            }
        }

        if (req.headers.version_code && req.headers.version_code > 685) {
            if (student_id % (staticParams.config).bounty_mod_factor === 0) {
                const quesDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(staticParams.db, req.body.question_id);
                if (quesDetails[0].question_image && matchArray.length > 0) {
                    question_image = Data.questionAskUrlPrefix + quesDetails[0].question_image;
                    req.body.question_image = question_image;
                    bl.pushBountyCard(matchArray, '');
                }
            }
        }

        next({
            data: {
                // reqDetails,
                ...req.body,
                notification: [],
                tab: data.topic_tab,
                platform_tabs: data.platform_tabs,
                matched_questions: matchArray,
                matched_count: matchArray.length,
                feedback: data.match_page_feedback,
            },
        });
    } catch (err) {
        next({ err });
    }
}

module.exports = {
    viewAnswerByQuestionId,
    viewSimilarQuestions,
    getPlaylistByTag,
    advancedSearch,
};
