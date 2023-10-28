/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable import/no-extraneous-dependencies */

require('../../../modules/mongo/comment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const { Lambda } = require('aws-sdk');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');

const uuidv4 = require('uuid/v4');
const moment = require('moment');
const fuzz = require('fuzzball');

const VideoView = require('../../../modules/videoView');
const Utility = require('../../../modules/utility');
const Answer = require('../../../modules/answer');
const Notification = require('../../../modules/notifications');
const Answer_Container = require('./answer.container');
const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerRedis = require('../../../modules/redis/answer');
// const StudentContainer = require('../../../modules/containers/student');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const mysqlMicroconcept = require('../../../modules/mysql/microconcept');
const PlaylistContainer = require('../../../modules/containers/playlist');
const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
const MysqlQuestion = require('../../../modules/mysql/question');
const appConfigSql = require('../../../modules/mysql/appConfig');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
// const utility_redis = require('../../../modules/redis/utility.redis');
const SubjectPersonalisationRedis = require('../../../modules/redis/SubjectPersonalisation');
const QuestionsMeta = require('../../../modules/questionsMeta');
const studentPersonalisation = require('../../../modules/redis/studentPersonalisation');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const StructuredCourse = require('../../../modules/mysql/structuredCourse');
const config1 = require('../../../config/config');
const logger = require('../../../config/winston').winstonLogger;
const Data = require('../../../data/data');
const LiveclassData = require('../../../data/liveclass.data');
const QuestionHelper = require('../../helpers/question.helper');
const LiveclassHelper = require('../../helpers/liveclass.js');
const Question = require('../../../modules/question');
const Liveclass = require('../../../modules/mysql/liveclass');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const StudentRedis = require('../../../modules/redis/student');
// const HomepageQuestionsMasterRedis = require('../../../modules/redis/homepageQuestionsMaster');
const MongoQuestionAskUser = require('../../../modules/mongo/questionAskUser');
const AnswerBl = require('./answer.bl');
const QuestionBl = require('../../v9/question/question.bl');
const QuestionRedis = require('../../../modules/redis/question');
const LanguageContainer = require('../../../modules/containers/language');
const Answer_Container_v13 = require('../../v13/answer/answer.container');

const VideoSummaryImage = require('../../../modules/containers/videoSummaryImage');
const bl = require('./answer.bl');
const p2pData = require('../../../data/doubtPeCharcha.data');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const CourseContainerv2 = require('../../../modules/containers/coursev2');

const lambda = new Lambda({ accessKeyId: config1.aws_access_id, secretAccessKey: config1.aws_secret });

let db; let config; let sqs; let sns;

async function viewAnswerByQuestionId(req, res, next) {
    sqs = req.app.get('sqs');
    sns = req.app.get('sns');
    config = req.app.get('config');
    let viewData;
    try {
        db = req.app.get('db');
        let { page } = req.body;
        const { session_id } = req.body;
        const { tab_id } = req.body;
        let { source } = req.body;
        let { parent_id } = req.body;
        const { ref_student_id } = req.body;
        const { student_id } = req.user;
        const { youtube_id } = req.body;
        let data = {}; let { student_class } = req.user; let student_course; let hls_url;
        const cdn_url = config.cdn_video_url;
        const { version_code } = req.headers;
        const { matchedQuestionSnsUrl } = Data;
        const ip = Utility.getClientIp(req);
        const isComputationQuestion = !!(req.body.isComputationQuestion);
        let resolvedPromisesData;
        const hls_timeout = 0;
        let question_id = '';
        // const { locale: user_locale } = req.user;
        const avarageViewtime = await AnswerContainer.getAvgViewData(req, db);
        const tablist = [];

        const next_video = '';

        // const yt_student_id = [94, 80, -3];
        const viral_video_student_id_arr = Data.viralVideoStudentIDS;
        if ((typeof ref_student_id !== 'undefined') && (ref_student_id !== '') && (ref_student_id) && !_.includes(ref_student_id, 'WHA')) {
            // ASYNC
            Notification.sendNotificationToStudent('referred_video', ref_student_id, null, db);
        }

        const pageTopics = ['CC', 'SC', 'BROWSE_MC', 'HOME_PAGE_CC', 'SEARCH_MC', 'SEARCH_SC'];
        const otherPage = ['STRUCTURED', 'HOME_WIDGET', 'SRP', 'LIBRARY', 'DP', 'BROWSE', 'NOTIFICATION', 'REFER', 'DEEPLINK', 'INAPP', 'COMMUNITY', 'SIMILAR', 'HOME_FEED', 'HOME', 'SS', 'SUGGESTIONS', 'APP_INDEXING', 'HOME_PAGE', 'VIDEO_HISTORY', 'SEARCH_SRP', 'E_LECTURES', 'E_COURSE', 'E_FACULTY', 'HOMEPAGE', 'MOCK_TEST', 'LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'TS_VOD', 'LIVECLASS_RESOURCE', 'PERSONALIZATION', 'WATCH-HISTORY', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'OTHER_MATCH_VIDEOS', 'LIVE_CLASS_MPVP', 'TEACHER_INTRO' , 'REFERRAL_V2'];
        const youtubePage = ['YT_ASK'];
        const wolframPage = ['WOLFRAM'];
        const liveclassPages = ['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP'];

        const variantId = 3;
        if (_.includes(wolframPage, page)) {
            const { ocr_text, html } = req.body;
            const responseData = await bl.handleWolframSolution(config, parent_id, ocr_text, html, Utility, sqs, sns, matchedQuestionSnsUrl, QuestionHelper);
            // MysqlQuestion.updateMatchedAliasTable(parent_id, db.mysql.write);
            const data1 = {
                action: 'UPDATE_PARENT_ID_FROM_APP',
                question_id: parent_id,
            };
            Utility.logEntry(sns, config.update_parent_id_sns, data1);
            return res.status(responseData.meta.code).json(responseData);
        }
        if (_.includes(youtubePage, page)) {
            const youtubeQid = req.body.id;
            const { ocr_text } = req.body;
            const responseData = await bl.handleYoutubeSearchPage(db, youtubeQid, youtube_id, parent_id, student_id, ocr_text, Question);
            return res.status(responseData.meta.code).json(responseData);
        }

        if (_.includes(pageTopics, page)) {
            const mc_id = req.body.id;
            student_class = req.body.mc_class;
            // student_class = req.user.student_class;
            student_course = req.body.mc_course;
            let promises = []; let questionWithAnswer;
            resolvedPromisesData = await AnswerContainer.getByMcIdWithTextSolution(mc_id, db);
            if (resolvedPromisesData.length && ((resolvedPromisesData[0].is_answered === 0 && resolvedPromisesData[0].is_text_answered === 0) || resolvedPromisesData[0].youtube_id === 'yt url')) {
                await AnswerRedis.deleteByMcIdWithTextSolution(mc_id, db.redis.write);
                resolvedPromisesData = await AnswerContainer.getByMcIdWithTextSolution(mc_id, db);
            }
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
            questionWithAnswer = resolvedPromisesData[0];

            let resource_type = 'video';
            let resource_data = null;
            if (resolvedPromisesData.length > 0 && questionWithAnswer.is_text_answered === 1 && questionWithAnswer.is_answered === 0) {
                resource_type = 'text';
                questionWithAnswer.answer_id = questionWithAnswer.text_solution_id;
                questionWithAnswer.expert_id = 0;
                // questionWithAnswer.answer_video = 'text';
                questionWithAnswer.answer_video = (!isComputationQuestion) ? 'text' : 'computational_text';
                questionWithAnswer.is_approved = 0;
                questionWithAnswer.answer_rating = 0;
                let webString = `<html><body><div>${questionWithAnswer.ocr_text}</div><div><ol type='a'>`;
                const options = [];
                options.push(questionWithAnswer.opt_1);
                options.push(questionWithAnswer.opt_2);
                options.push(questionWithAnswer.opt_3);
                options.push(questionWithAnswer.opt_4);
                for (let i = 0; i < options.length; i++) {
                    if (options[i] && options[i] != 'N/A') {
                        webString += `<li>${options[i]}</li>`;
                    }
                }

                webString += '</ol></div>';
                if (questionWithAnswer.text_answer) {
                    webString += `<div><span>CORRECT OPTION(S): </span>${questionWithAnswer.text_answer}</div>`;
                }
                if (questionWithAnswer.text_solutions && questionWithAnswer.text_solutions.length > 8) {
                    webString += `<div><p>SOLUTION</p><p>${questionWithAnswer.text_solutions}</p></div>`;
                }
                webString += '</body></html>';
                resource_data = _.replace(webString, /'/g, "\\'");
            }
            promises = [];
            if (!_.includes(['COURSE_DETAIL', 'COURSE_RESOURCE', 'COURSE_LANDING', 'LIVE_CLASS_MPVP'], page)) {
                page = (Data.et_student_id.includes(questionWithAnswer.student_id)) ? `ETOOS_${page}` : page;
            }
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

            if (!questionWithAnswer.answer_video) {
                logger.error({
                    tag: 'videoApi',
                    source: 'viewAnswerByQuestionId',
                    error: `answer_video is null for ${mc_id}`,
                });
            }
            const answer_video_name = questionWithAnswer.answer_video.split('.')[0];
            hls_url = `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`;

            let ocr;
            if ((questionWithAnswer.ocr_text.indexOf('<math')) == -1) {
                ocr = questionWithAnswer.ocr_text;
            } else {
                ocr = questionWithAnswer.question;
            }
            // checking youtube play or default
            questionWithAnswer = Utility.checkYoutubeVideo(Data.yt_student_id, questionWithAnswer);
            const isEtoosStudent = Data.et_student_id.includes(questionWithAnswer.student_id);
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
                answer_video: (questionWithAnswer.is_vdo_ready == 1) ? hls_url : questionWithAnswer.answer_video,
                fallback_answer_video: isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video,
                video_name: questionWithAnswer.answer_video,
                is_approved: questionWithAnswer.is_approved,
                answer_rating: questionWithAnswer.answer_rating,
                answer_feedback: (questionWithAnswer.answer_feedback) ? questionWithAnswer.answer_feedback : '',
                youtube_id: questionWithAnswer.youtube_id,
                thumbnail_image: (questionWithAnswer.matched_question == null) ? (`${config.staticCDN}q-thumbnail/${questionWithAnswer.question_id}.png`) : (`${config.staticCDN}q-thumbnail/${questionWithAnswer.matched_question}.png`),
                isLiked: false,
                isDisliked: false,
                isPlaylistAdded: false,
                playlist_name: null,
                view_id: null,
                type: 'answered',
                id: questionWithAnswer.question_id,
                total_views: 0,
                hls_timeout,
                resource_type,
                resource_data,
                is_youtube: questionWithAnswer.is_youtube,
                aspect_ratio: (questionWithAnswer.aspect_ratio) ? questionWithAnswer.aspect_ratio : '16:9',
                topic_video_text: '',
            };
            if (tablist.length > 0) {
                data.tab_list = tablist;
            }
            data.fallback_answer_video = isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video;
            data = await Answer_Container.checkEVideos(db, data, questionWithAnswer, student_id);

            const videoViewCheck = await AppConfigurationContainer.getConfigByKey(db, 'video_view_stats');;
            // eslint-disable-next-line eqeqeq
            if (videoViewCheck && videoViewCheck.length > 0 && videoViewCheck[0].key_value == '0') {
                promises.push([]);
            } else {
                promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
            }
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentNew(student_id, questionWithAnswer.answer_id, questionWithAnswer.answer_video, db));
            // promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, questionWithAnswer["answer_id"], db))
            promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
            promises.push(Answer_Container.getNextMicroConcept(mc_id, student_class, student_course, data, db));
            promises.push(QuestionContainer.getTotalViewsWeb(questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getTagList(questionWithAnswer.question_id, db));
            resolvedPromisesData = await Promise.all(promises);

            if (resolvedPromisesData[3] && resolvedPromisesData[3].length > 0 && (variantId == 1 || variantId == 3)) {
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
            data.tags_list = [];
            if (resolvedPromisesData[5] && resolvedPromisesData[5].length > 0 && resolvedPromisesData[5][0].tags_list && (variantId == 1 || variantId == 3)) {
                data.tags_list = resolvedPromisesData[5][0].tags_list.split('$#');
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

            if (next_video != '') {
                data.next_video_details = next_video;
                if (version_code >= 766) {
                    data.next_video_details.deeplink = `doubtnutapp://video?qid=${next_video.qid}&page=${page}`;
                    data.next_video_details.button_text = Data.smart_play_button_text;
                }
            }

            if (version_code > 754) {
                data.avg_view_time = avarageViewtime;
                data.min_watch_time = 0;
            }
            data.moe_event = {
                video_locale: await Answer_Container.getVideoLocale(db, data.student_id),
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
            question_id = req.body.id;

            if (page == 'WATCH-HISTORY') {
                const view_question_id = await Question.getQuestionFromVideoViewStats(db.mysql.read, student_id, question_id);

                if (!_.isEmpty(view_question_id) && view_question_id.length > 0) {
                    question_id = view_question_id[0].question_id;
                }
            }
            // resolvedPromisesData = await AnswerContainer.getByQuestionIdWithTextSolution(question_id, db);
            if (isComputationQuestion) {
                resolvedPromisesData = await AnswerContainer.getByQuestionNewIdWithTextSolution(question_id, db);
            } else {
                resolvedPromisesData = await AnswerContainer.getByQuestionIdWithTextSolution(question_id, db);
            }
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
            let videoDuration = resolvedPromisesData[0].duration;
            if (_.isEmpty(videoDuration)) {
                videoDuration = 0;
            }
            if (resolvedPromisesData.length > 0) {
                if ((resolvedPromisesData[0].is_answered == 0 && resolvedPromisesData[0].is_text_answered == 0) || resolvedPromisesData[0].youtube_id === 'yt url') {
                    await AnswerRedis.deleteByQuestionIdWithTextSolution(question_id, db.redis.write);
                    resolvedPromisesData = await AnswerContainer.getByQuestionIdWithTextSolution(question_id, db);
                }
                if (resolvedPromisesData[0].is_answered == 1 && !resolvedPromisesData[0].answer_id && resolvedPromisesData[0].matched_question) {
                    resolvedPromisesData = await AnswerContainer.getByQuestionIdWithTextSolution(resolvedPromisesData[0].matched_question, db);
                }
            }

            let questionWithAnswer = resolvedPromisesData[0];
            let wha_id = 0;
            /* if (_.includes(ref_student_id, 'WHA')) {
                const tempdata = Utility.whatsappDeeplinkTokenizer(ref_student_id);
                source = tempdata[0];
                parent_id = tempdata[1];
                wha_id = tempdata[2];
                const q = await MysqlQuestion.getByQuestionIdFromAliased(db.mysql.read, parent_id);
                if (q.length && !q[0].matched_app_questions) {
                    let results;
                    const bookmetaData = await Question.getBookMetaData(question_id, db.mysql.read);
                    if (bookmetaData && bookmetaData.length && bookmetaData[0].doubt) {
                        results = (await QuestionContainer.getSimilarQuestionFromBookMeta(db, bookmetaData[0].doubt)).map((x) => x.question_id);
                    }

                    lambda.invoke({
                        FunctionName: 'WHATSAPP_PDF',
                        Payload: JSON.stringify([{
                            questionId: question_id, parentId: parent_id, studentId: wha_id, topic: questionWithAnswer.chapter, results,
                        }]),
                    }, (err, result) => {
                        if (err) console.log(err, err.stack); // an error occurred
                        else console.log(result);
                    });
                }
            } */

            let promises = []; let type; let id;
            let resource_type = 'video';
            let resource_data = null;
            // text solution handling
            if (resolvedPromisesData.length > 0 && questionWithAnswer.is_text_answered === 1 && questionWithAnswer.is_answered === 0) {
                resource_type = 'text';
                questionWithAnswer.answer_id = questionWithAnswer.text_solution_id;
                questionWithAnswer.expert_id = 0;
                // questionWithAnswer.answer_video = 'text';
                questionWithAnswer.answer_video = (!isComputationQuestion) ? 'text' : 'computational_text';
                questionWithAnswer.is_approved = 0;
                questionWithAnswer.answer_rating = 0;
                let webString = `<html><body><div>${questionWithAnswer.ocr_text}</div><div><ol type='a'>`;
                const options = [];
                options.push(questionWithAnswer.opt_1);
                options.push(questionWithAnswer.opt_2);
                options.push(questionWithAnswer.opt_3);
                options.push(questionWithAnswer.opt_4);
                for (let i = 0; i < options.length; i++) {
                    if (options[i] && options[i] != 'N/A') {
                        webString += `<li>${options[i]}</li>`;
                    }
                }

                webString += '</ol></div>';
                if (questionWithAnswer.text_answer) {
                    webString += `<div><span>CORRECT OPTION(S): </span>${questionWithAnswer.text_answer}</div>`;
                }
                if (questionWithAnswer.text_solutions && questionWithAnswer.text_solutions.length > 8) {
                    webString += `<div><p>SOLUTION</p><p>${questionWithAnswer.text_solutions}</p></div>`;
                }
                webString += '</body></html>';
                resource_data = _.replace(webString, /'/g, "\\'");
            }
            // modify page for etoos
            if (!_.includes(['COURSE_DETAIL', 'COURSE_RESOURCE', 'COURSE_LANDING', 'LIVE_CLASS_MPVP'], page)) {
                page = (Data.et_student_id.includes(questionWithAnswer.student_id)) ? `ETOOS_${page}` : page;
            }
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
            // viral videeo and pin post vid handlng
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
            if (!questionWithAnswer.answer_video) {
                logger.error({
                    tag: 'videoApi',
                    source: 'viewAnswerByQuestionId',
                    error: `answer_video is null for ${question_id}`,
                });
            }
            const answer_video_name = questionWithAnswer.answer_video.split('.')[0];
            hls_url = `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`;
            let ocr;
            if ((questionWithAnswer.ocr_text.indexOf('<math')) == -1) {
                ocr = questionWithAnswer.ocr_text;
            } else {
                ocr = questionWithAnswer.question;
            }
            // checking youtube video play or default
            questionWithAnswer = Utility.checkYoutubeVideo(Data.yt_student_id, questionWithAnswer);
            questionWithAnswer.ocr_text = questionWithAnswer.ocr_text.replace(/'/g, "\\'");
            let topic_video_text = '';
            const chapterData = await Answer.getChapterDataByQid(db.mysql.read, question_id);
            if (chapterData.length && chapterData[0].master_chapter_aliases && chapterData[0].chapter && page === 'SRP' && (variantId == 1 || variantId == 2)) {
                topic_video_text = `Dekhen ${chapterData[0].chapter} ke most important sawal`;
            }
            const isEtoosStudent = Data.et_student_id.includes(questionWithAnswer.student_id);
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
                answer_video: (questionWithAnswer.is_vdo_ready == 1) ? hls_url : questionWithAnswer.answer_video,
                fallback_answer_video: isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video,
                video_name: questionWithAnswer.answer_video,
                is_approved: questionWithAnswer.is_approved,
                answer_rating: questionWithAnswer.answer_rating,
                answer_feedback: (questionWithAnswer.answer_feedback) ? questionWithAnswer.answer_feedback : '',
                youtube_id: questionWithAnswer.youtube_id,
                thumbnail_image: (questionWithAnswer.matched_question == null) ? (`${config.staticCDN}q-thumbnail/${questionWithAnswer.question_id}.png`) : (`${config.staticCDN}q-thumbnail/${questionWithAnswer.matched_question}.png`),
                isLiked: false,
                isDisliked: false,
                isPlaylistAdded: false,
                view_id: null,
                type,
                id,
                total_views: 0,
                hls_timeout,
                resource_type,
                resource_data,
                is_youtube: questionWithAnswer.is_youtube,
                aspect_ratio: (questionWithAnswer.aspect_ratio) ? questionWithAnswer.aspect_ratio : '16:9',
                topic_video_text,
            };
            if (tablist.length > 0) {
                data.tab_list = tablist;
            }
            data.fallback_answer_video = isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video;
            let liveclassStreamDetails = [];
            if (_.includes(['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'TS_VOD', 'LIVECLASS_RESOURCE', 'LIVECLASS_ALERT', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP'], page)) {
                if (version_code >= LiveclassData.socketAppVersion) {
                    liveclassStreamDetails = await CourseContainerv2.getLiveStreamDetailsByQuestionID(db, question_id);
                } else {
                    liveclassStreamDetails = await Liveclass.getLivestreamDetails(db.mysql.read, question_id);
                }
            }
            data = await Answer_Container.checkLiveClassVideos(db, data, questionWithAnswer, student_id, version_code, student_class);
            data = await Answer_Container.checkEVideos(db, data, questionWithAnswer, student_id);
            // MATCHES VIDEO CASE
            // parent_id = asked question id
            // question_id = solution question id
            // Matched question handling
            if (parent_id != 0) {
                const event = { data: parent_id, type: 'mongoUpdate' };
                setTimeout(Utility.sendMessage, 3000, sqs, config.elasticsearch_sqs, event);
                QuestionHelper.sendSnsMessage({
                    type: 'matched-question',
                    sns,
                    qid: parent_id,
                    UtilityModule: Utility,
                    matchedQuestionSnsUrl,
                    config,
                });
                const parentQuestion = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, parent_id);
                if (parentQuestion && parentQuestion.length) {
                    console.log(`Search version: ${parentQuestion[0].question}`);
                }
                // update matched - TO BE DONE BY VVS TABLE
                // await MysqlQuestion.updateMatchedAliasTable(parent_id, db.mysql.write);
                const student_matched_counter_results = await StudentRedis.getDailyUserMatchedQuestionsCounter(db.redis.read, student_id);
                if (_.isNull(student_matched_counter_results)) {
                    const expiry = Utility.getExpiration('tomorrow');
                    StudentRedis.setDailyUserMatchedQuestionsCounter(db.redis.write, student_id, expiry);
                } else {
                    StudentRedis.incrementMatchedQuestionCountByUser(db.redis.write, student_id);
                }

                const data1 = {
                    action: 'UPDATE_PARENT_ID_FROM_APP',
                    question_id: parent_id,
                };
                Utility.logEntry(sns, config.update_parent_id_sns, data1);
            }

            // promises = []
            if ((page !== 'SRP' && (variantId == 1 || variantId == 3)) || (page === 'SRP' && variantId == 3)) {
                const tempTags = await AnswerContainer.getTagList(questionWithAnswer.question_id, db);
                data.tags_list = [];
                if (tempTags && tempTags.length && tempTags[0].tags_list) {
                    data.tags_list = tempTags[0].tags_list.split('$#');
                }
            }
            let viewID = '1';
            const videoViewCheck = await AppConfigurationContainer.getConfigByKey(db, 'video_view_stats');
            if (videoViewCheck && videoViewCheck.length > 0 && videoViewCheck[0].key_value == '0') {
                promises.push([]);
            } else if (_.includes(liveclassPages, page)
                && liveclassStreamDetails.length > 0
                && LiveclassHelper.isFutureStream(liveclassStreamDetails[0], version_code)) {
                // if stream is inactive, dont insert in video view stats
                const inactiveViewData = {};
                viewID = uuidv4();
                inactiveViewData.view_uuid = viewID;
                inactiveViewData.question_id = question_id;
                inactiveViewData.student_id = student_id;
                inactiveViewData.view_from = page;
                promises.push(Liveclass.insertInactiveAnswerView(db.mysql.write, inactiveViewData));
            } else {
                promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
            }
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentNew(student_id, questionWithAnswer.answer_id, questionWithAnswer.answer_video, db));
            promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
            promises.push(QuestionsMetaContainer.getQuestionMetaWithMcText(questionWithAnswer.question_id, db));
            promises.push(QuestionContainer.getTotalViewsWeb(questionWithAnswer.question_id, db));
            if (page == 'STRUCTURED' && version_code >= 636 && version_code <= Data.etoos_version) {
                promises.push(AppBannerContainer.getPromotionalData(db, student_class, 'STRUCTURED_COURSE', version_code));
                promises.push(StructuredCourse.getStructuredDataByVid(questionWithAnswer.question_id, student_class, db.mysql.read));
            }
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
                data.view_id = viewID;
                viewData.view_id = viewID;
            }
            // GOOGLE BOT
            if (student_id != 588226) {
                // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer.question_id, config, admin, db);
            }

            const descrip = await AnswerContainer.getAnswerTitleAndDescription2(data, db);
            // let temp=await Question.getMcIdbyQidForMicroConcept(student_class,question_id,db.mysql.read)
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
            if (version_code >= 636 && version_code <= Data.etoos_version) {
                let structured_course_id;
                let subject;
                console.log('hi', resolvedPromisesData[6]);
                if (resolvedPromisesData[6] !== undefined && resolvedPromisesData[6].length !== 0) {
                    structured_course_id = resolvedPromisesData[6][0].structured_course_id;
                    subject = resolvedPromisesData[6][0].subject;
                    const courseId = await StructuredCourse.getCourseIdByQuestionId(req.body.id, structured_course_id, subject, student_class, db.mysql.read);
                    console.log(courseId[0].structured_course_detail_id);
                    const pdfListData = await StructuredCourse.getPdfList(courseId[0].structured_course_detail_id, db.mysql.read);
                    const pdfList = [];
                    for (let j = 0; j < pdfListData.length; j++) {
                        if (pdfListData[j].resource_type == 1) {
                            pdfList.push({
                                display: 'Notes',
                                image_url: `${config.staticCDN}images/notes-pdf-icon.png`,
                                displaypdf_link: pdfListData[j].resource_reference,
                            });
                        } else if (pdfListData[j].resource_type == 2) {
                            pdfList.push({
                                display: 'Practice Questions',
                                image_url: `${config.staticCDN}images/practise-pdf-icon.png`,
                                pdf_link: pdfListData[j].resource_reference,
                            });
                        }
                    }

                    if (pdfList.length !== 0) {
                        data.pdf_list = {
                            type: 'todays_pdf',
                            list: pdfList,
                        };
                    }
                }
                const playlist_id = (student_class == 12 ? 116507 : 116508);
                data.banner = {
                    type: 'banner',
                    resource_type: 'banner',
                    image_url: `${config.staticCDN}images/structured-3rd-screen-banner.webp`,
                    action_activity: 'playlist',
                    action_data: { playlist_id, playlist_title: 'Score 180+ in JEE Mains', is_last: 1 },
                    size: '1x',
                    class: '11',
                    page_type: 'STRUCTURED_COURSE',
                    banner_order: 1,
                    position: 0,
                };
            }

            // this is to be done --- will remove the repition
            let redis_flag = 0;
            if (page == 'LIBRARY' || page == 'SRP') {
                const personalisation_data = await QuestionsMeta.getQuestionMeta(db.mysql.read, questionWithAnswer.question_id);
                console.log('personalisation_data');
                console.log(personalisation_data);
                // // let subjectSetPer = await
                if (!_.isEmpty(personalisation_data)) {
                    if (!_.isNull(personalisation_data[0].subject) && !_.isNull(personalisation_data[0].chapter) && !_.isNull(personalisation_data[0].class)) {
                        redis_flag = 1;
                        const video_watched_data = await SubjectPersonalisationRedis.getQuestionMetaForPersonalisation(db.redis.read, student_id);
                        let video_watched_arr = JSON.parse(video_watched_data);
                        if (_.isEmpty(video_watched_arr)) {
                            video_watched_arr = [];
                        }
                        if (Array.isArray(video_watched_arr)) {
                            video_watched_arr.unshift(personalisation_data[0]);
                            if (video_watched_arr.length > 5) {
                                video_watched_arr.pop();
                            }
                        } else {
                            video_watched_arr = [];
                        }
                        SubjectPersonalisationRedis.setPersonalisationForStudent(
                            db.redis.write,
                            student_id,
                            video_watched_arr,
                        )
                            // eslint-disable-next-line no-shadow
                            .then((res) => {
                                console.log(res);
                                console.log('i have the set the meta for question watched');
                            })
                            .catch((err) => {
                                console.log(err);
                            });
                    }
                } else {
                    redis_flag = -1;
                }
                if (redis_flag > 0) {
                    // const del_results =
                    await studentPersonalisation.deleteSubjectPrefrence(db.redis.write, student_id);
                    // .then((res)=>{
                    console.log('ok');
                    // }).catch((err)=>{
                    //   console.log(err);
                    // })
                }
                // eslint-disable-next-line brace-style
            }
            else {
                const subject_mapping = {
                    PHYSICS: 1,
                    MATHS: 2,
                    BIOLOGY: 3,
                    CHEMISTRY: 4,
                };

                // personalisation part
                const personalisation_data = await QuestionsMeta.getQuestionMeta(db.mysql.read, questionWithAnswer.question_id);
                if (!_.isEmpty(personalisation_data)) {
                    if (!_.isNull(personalisation_data[0].subject) && !_.isNull(personalisation_data[0].class)) {
                        // && !_.isNull(personalisation_data[0]['chapter'])
                        const subject_prefrence = personalisation_data[0].subject;
                        const pref_obj = {
                            subject: subject_mapping[subject_prefrence],
                        };
                        // const insertedResults =
                        await studentPersonalisation.setStudentSubjectPrefrence(
                            db.redis.write,
                            student_id,
                            pref_obj,
                        );
                    }
                }
            }
            // LIVE STREAM PART
            if (_.includes(liveclassPages, page)) {
                // check  stream status
                data.is_rtmp = false;
                data.state = await LiveclassHelper.getStatus(db, liveclassStreamDetails, version_code);
                // data.state = 0;
                // pms.push(Liveclass.getLivestreamDetails(db.mysql.read, question_id));
                // pms.push(Liveclass.subscribe(db.mysql.write, { student_id, resource_reference: question_id }));
                let quizDetails = [];
                if (version_code >= LiveclassData.socketAppVersion) {
                    quizDetails = await CourseV2Mysql.getRecentQuizReference(db.mysql.read, question_id);
                } else {
                    quizDetails = await Liveclass.getRecentQuizReference(db.mysql.read, question_id);
                }
                if (version_code >= LiveclassData.socketAppVersion) {
                    if (liveclassStreamDetails.length > 0 && _.isNull(liveclassStreamDetails[0].stream_end_time) && liveclassStreamDetails[0].stream_status === 'ACTIVE' && liveclassStreamDetails[0].resource_type === 4) {
                        const subscribe = await Liveclass.checkSubscribe(db.mysql.read, student_id, question_id);
                        if (subscribe && subscribe.length) {
                            await Liveclass.updateSubscribe(db.mysql.write, student_id, question_id);
                        } else {
                            await Liveclass.subscribe(db.mysql.write, {
                                student_id,
                                resource_reference: question_id,
                                is_view: 1,
                                is_interested: 1,
                                version_code: req.headers.version_code,
                                // created_at: moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
                            });
                        }
                        // data.state = 1;
                        data.is_rtmp = true;
                        const streamName = `${questionWithAnswer.question_id}_H264xait`;
                        const streamName2 = `${questionWithAnswer.question_id}_480`;
                        const streamName3 = `${questionWithAnswer.question_id}_720`;
                        const url = Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName, config.liveclass.authKey);
                        const timeshiftUrl = Utility.getTimeshiftUrl(config.liveclass.vodDomain, config.liveclass.appName, questionWithAnswer.question_id);
                        data.answer_video = url;
                        // generate plaback url list
                        // replace last 3
                        data.faculty_name = liveclassStreamDetails[0].expert_name;
                        const playbackUrlList = [
                            {
                                display: '360',
                                url,
                            },
                            {
                                display: '480',
                                url: Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName2, config.liveclass.authKey),
                            },
                            {
                                display: '720',
                                url: Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName3, config.liveclass.authKey),
                            },
                        ];
                        data.playback_url_list = playbackUrlList;
                        data.timeshift_url = timeshiftUrl;
                        if (liveclassStreamDetails.length) data.detail_id = liveclassStreamDetails[0].id;
                    }
                } else if (liveclassStreamDetails.length > 0 && _.isNull(liveclassStreamDetails[0].end_time) && liveclassStreamDetails[0].is_active === 1 && liveclassStreamDetails[0].resource_type === 4) {
                    const subscribe = await Liveclass.checkSubscribe(db.mysql.read, student_id, question_id);
                    if (subscribe && subscribe.length) {
                        await Liveclass.updateSubscribe(db.mysql.write, student_id, question_id);
                    } else {
                        await Liveclass.subscribe(db.mysql.write, {
                            student_id,
                            resource_reference: question_id,
                            is_view: 1,
                            is_interested: 1,
                            version_code: req.headers.version_code,
                            // created_at: moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
                        });
                    }
                    data.is_rtmp = true;
                    const streamName = `${questionWithAnswer.question_id}_H264xait`;
                    const streamName2 = `${questionWithAnswer.question_id}_480`;
                    const streamName3 = `${questionWithAnswer.question_id}_720`;
                    const url = Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName, config.liveclass.authKey);
                    const timeshiftUrl = Utility.getTimeshiftUrl(config.liveclass.vodDomain, config.liveclass.appName, questionWithAnswer.question_id);
                    data.answer_video = url;
                    // generate plaback url list
                    // replace last 3
                    data.faculty_name = liveclassStreamDetails[0].faculty_name;
                    const playbackUrlList = [
                        {
                            display: '360',
                            url,
                        },
                        {
                            display: '480',
                            url: Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName2, config.liveclass.authKey),
                        },
                        {
                            display: '720',
                            url: Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName3, config.liveclass.authKey),
                        },
                    ];
                    data.playback_url_list = playbackUrlList;
                    data.timeshift_url = timeshiftUrl;
                    if (liveclassStreamDetails.length) data.detail_id = liveclassStreamDetails[0].detail_id;
                } else if (page === 'LIVECLASS_NOTIFICATION') {
                    const resources = await AnswerContainer.getAnswerVideoResource(db, questionWithAnswer.answer_id);
                    const hlsWithoutDrm = resources.filter((x) => x.resource_type === 'HLS' && !x.vdo_cipher_id);
                    if (hlsWithoutDrm.length && hlsWithoutDrm[0].resource && hlsWithoutDrm[0].resource.startsWith('http')) {
                        data.drm_license_url = '';
                        data.media_type = 'hls';
                        data.drm_scheme = '';
                        data.answer_video = hlsWithoutDrm[0].resource;
                        questionWithAnswer.is_vdo_ready = 3;
                    }
                }

                if (quizDetails.length > 0) {
                    if (version_code >= LiveclassData.socketAppVersion) {
                        data.quiz_resource_id = quizDetails[0].quiz_resource_id;
                    } else {
                        data.quiz_resource_id = quizDetails[0].resource_detail_id;
                    }
                }
                data.firebase_path = 'live_class_test';
                if (liveclassStreamDetails.length > 0) {
                    if (liveclassStreamDetails[0].resource_type === 4) {
                        if (version_code >= LiveclassData.socketAppVersion) {
                            data.start_time = moment(liveclassStreamDetails[0].stream_start_time).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
                        } else {
                            data.start_time = moment(liveclassStreamDetails[0].start_time).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
                        }
                    }
                }
            }
            // dash video check
            data = Answer_Container.dashHandling(data, questionWithAnswer, config);

            await VideoSummaryImage.videoSummaryInfo(db, config, data, student_id, questionWithAnswer.question_id);

            const smartPages = ['LIVECLASS_RESOURCE', 'ETOOS_E_LECTURES', 'ETOOS_BROWSE', 'ETOOS_STRUCTURED', 'HOME', 'ETOOS_HOME'];
            if (smartPages.includes(page) && version_code >= 767) {
                const userCount = AnswerContainer.getNextVideoWatchUserCount();
                data.next_video_details = {
                    skip_secs: videoDuration < 35 ? Data.live_class_smart_skip_secs_short_video : Data.live_class_smart_skip_secs,
                    message: AnswerContainer.getSmartContentMsg(req.user.locale, userCount, 'liveclass'),
                    images: await AnswerContainer.getAdditionalUsersImages('', 0, student_id, db.mysql.read),
                    deeplink: 'doubtnutapp://live_class_home',
                    button_text: Data.smart_page_button_text,
                };
            }

            if (next_video != '' && data.next_video_details == undefined) {
                data.next_video_details = next_video;
                if (version_code >= 766) {
                    data.next_video_details.deeplink = `doubtnutapp://video?qid=${next_video.qid}&page=${page}`;
                    data.next_video_details.button_text = Data.smart_play_button_text;
                }
            }

            if ((page != 'LIVECLASS' || page != 'HOME_FEED_LIVE') && page != 'HOME_FEED' && version_code > 754) {
                data.avg_view_time = avarageViewtime;
                data.min_watch_time = 0;
            }

            if (questionWithAnswer.student_id === -20) {
                const comments = await Answer_Container.commentWindow(db, questionWithAnswer.question_id, questionWithAnswer.duration);
                const currTime = moment().unix() * 1000;
                if (comments.start) {
                    data.comments = comments;
                    if (currTime > comments.start && currTime < comments.end) data.auto_play = false;
                }
            }
            data.moe_event = {
                video_locale: await Answer_Container.getLocale(db, data.student_id, req.user.locale),
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
        console.log(e);
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

async function advancedSearch(req, _res, next) {
    const staticParams = {
        elasticSearchInstance: req.app.get('elasticSearchInstance'),
        elasticSearchTestInstance: req.app.get('elasticSearchTestInstance'),
        db: req.app.get('db'),
        config: req.app.get('config'),
        versionCode: req.headers.version_code,
        xAuthToken: req.headers['x-auth-token'],
    };
    let question_image;
    const facetsNew = [];
    config = req.app.get('config');
    const advanceSearchSegregationVersionCode = 756;

    try {
        const facets = req.body.facets_v2;
        const { student_id, locale } = req.user;
        const versionCode = req.headers.version_code;
        let selectedFacet;
        let matchArray;
        const research_facets_types = ['chapter', 'class'];
        // const filter_facets_types = ['subject', 'video_language'];
        const filterData = [];
        // let isSingleSelect = 0;
        if (versionCode && versionCode < 710) {
            selectedFacet = facets.find((x) => x.isSelected);
            if (!selectedFacet) {
                throw new Error('No facet selected');
            }
            matchArray = await bl.advancedSearchWithFilter(staticParams, req.user.student_id, req.body.ocr_text, selectedFacet.data);
        } else {
            selectedFacet = facets.filter((x) => x.isSelected);
            // eslint-disable-next-line array-callback-return
            selectedFacet.map((x) => {
                let finalFilter;
                let keyName;
                if (x.isMultiSelect) {
                    keyName = x.facetType;
                    if (keyName == 'video_language') {
                        keyName = 'video_language_display';
                    }
                    const selectedInnerFacet = x.data.filter((a) => a.isSelected && research_facets_types.includes(a.facetType));
                    // const filterInnerFacet = x.data.filter((a) => a.isSelected && filter_facets_types.includes(a.facetType));
                    const facetItems = selectedInnerFacet.map((b) => b.data);
                    const newfacetItems = [];
                    // const filterItems = [];
                    // eslint-disable-next-line array-callback-return
                    facetItems.map((c) => c.map((d) => {
                        if (!newfacetItems.includes(d)) {
                            newfacetItems.push(d);
                        }
                    }));
                    finalFilter = newfacetItems;
                } else {
                    keyName = x.facetType;
                    if (keyName == 'video_language') {
                        keyName = 'video_language_display';
                    }
                    const selectedInnerFacet = x.data.find((a) => a.isSelected);
                    // const filterInnerFacet = x.data.filter((a) => a.isSelected && filter_facets_types.includes(a.facetType));
                    // if(selectedInnerFacet)
                    // isSingleSelect = 1;
                    finalFilter = selectedInnerFacet.data;
                }
                filterData.push(
                    {
                        terms: {
                            [keyName]: finalFilter,
                        },
                    },
                );
            });

            if (!filterData) {
                throw new Error('No facet selected');
            }
            matchArray = await bl.advancedSearchWithFilterV3(staticParams, req.user.student_id, req.body.ocr_text, filterData, locale);
        }

        let matchEmpty = false;
        if (matchArray.length === 0) {
            matchEmpty = true;
        } else {
            // filter_match_array
            matchArray = matchArray.map((obj) => {
                const partial_score = Utility.compareBystringDiff(fuzz, req.body.ocr_text, obj._source.ocr_text);
                return { ...obj, partial_score };
            });
            matchArray = _.orderBy(matchArray, ['partial_score'], ['desc']);
        }

        // const sort = {};
        // if (filterData.length == 0 && req.body.question_id && typeof req.body.question_id !== 'undefined') {
        //     const query = {};
        //     query.qid = req.body.question_id;
        //     const mongoQuestionAskedData = await MongoQuestionAskUser.getDataFromMongo(query, sort);
        //     if (!_.isEmpty(mongoQuestionAskedData) && mongoQuestionAskedData.length > 0) {
        //         const esResults = await staticParams.elasticSearchTestInstance.findDocumentsBulk(mongoQuestionAskedData[0].qid_matches_array);
        //         const matches_array = esResults.docs.filter((el) => el.found == true).map((elem) => ({
        //             ...elem, _index: 'question_bank_v1', _source: { ...elem._source, thumbnail_language: 'english' }, partial_score: 100,
        //         }));
        //     }
        // }
        matchArray = await QuestionContainer.getLangCode(matchArray, staticParams.db.mysql.read);
        let pushBountyForceFlag = 0;
        if (req.headers.version_code && req.headers.version_code < advanceSearchSegregationVersionCode) {
            if (req.headers.version_code && req.headers.version_code > 659 && req.headers.version_code < 710) {
                bl.pushFacetCard(matchArray, facets, 0);
            } else if (req.headers.version_code && req.headers.version_code >= 710) {
                bl.pushFacetCardV3(matchArray, facets, 0);
            }
        } else {
            pushBountyForceFlag = 1;
        }

        if (req.headers.version_code && req.headers.version_code === 685) {
            const quesDetails = await Question.getByQuestionId(req.body.question_id, (staticParams.db).mysql.read);
            if (quesDetails[0].question_image && matchArray.length > 0) {
                question_image = Data.questionAskUrlPrefix + quesDetails[0].question_image;
                req.body.question_image = question_image;
                bl.pushBountyCard(matchArray, '');
            }
        }
        if (req.headers.version_code && req.headers.version_code > 685) {
            if (student_id % (staticParams.config).bounty_mod_factor === 0) {
                const quesDetails = await Question.getByQuestionId(req.body.question_id, (staticParams.db).mysql.read);
                if ((quesDetails[0].question_image && matchArray.length > 0) || (quesDetails[0].question_image && pushBountyForceFlag)) {
                    question_image = Data.questionAskUrlPrefix + quesDetails[0].question_image;
                    req.body.question_image = question_image;
                    bl.pushBountyCard(matchArray, '');
                }
            }
        }

        matchArray = matchArray.map((obj) => {
            if (!_.isEmpty(obj._source) && obj._source.is_answered == 1 && !_.isEmpty(obj.answer_video)) {
                const answer_video_name = obj.answer_video.split('.')[0];
                const answer_video_data_obj = {
                    video_url: `https://d1zcq8u9izvjk5.cloudfront.net/HLS/${answer_video_name}/${answer_video_name}-master-playlist.m3u8`,
                    cdn_base_url: config.cdn_video_url,
                    fallback_url: `${config.cdn_video_url}${obj.answer_video}`,
                    hls_timeout: 0,
                };
                const new_match_obj = { ...obj, ...answer_video_data_obj };
                return new_match_obj;
            }
            return obj;
        });

        const feedback = Data.match_page_feedback;

        let nextData;
        if (!_.isEmpty(matchArray)) {
            matchArray = matchArray.slice(0, 20);
        }
        if (req.headers.version_code && req.headers.version_code >= advanceSearchSegregationVersionCode) {
            nextData = {
                ocr_text: req.body.ocr_text,
                question_id: req.body.question_id,
                question_image: req.body.question_image,
                notification: [],
                tab: [],
                platform_tabs: Data.platform_tabs,
                matched_questions: matchArray,
                matched_count: matchArray.length,
                feedback,
            };
        } else {
            nextData = {
                ...req.body,
                notification: [],
                tab: [],
                platform_tabs: Data.platform_tabs,
                matched_questions: matchArray,
                matched_count: matchArray.length,
                feedback,
                facets: facetsNew,
            };
        }

        nextData = QuestionContainer.getLanguageHeadingText(nextData, req.user.locale);

        if (matchEmpty) {
            nextData.feedback.is_show = 0;
            nextData.message = Data.advanceEmptyMsg(locale);
        } else {
            nextData.feedback.is_show = 1;
        }

        if (staticParams.versionCode >= 765) {
            const autoPlayData = await QuestionContainer.getAutoPlayVariant(staticParams.xAuthToken);

            if (!autoPlayData.autoPlayVariant) {
                nextData.auto_play = false;
            } else {
                nextData.auto_play = true;
                nextData.auto_play_initiation = autoPlayData.waitTime;
                nextData.auto_play_duration = autoPlayData.duration;
            }
        }

        next({
            data: nextData,
        });
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

async function advanceSearchNew(req, res) {
    async function getAdvanceSearchOriginalMatchesArray(db_obj, elasticSearchInstance, question_id, ocr_text, question_locale) {
        try {
            let matchedQids; let matchesArray;
            const matchesArrayRedisResponse = await QuestionRedis.getMatchesForAdvanceSearchById(db_obj.redis.read, question_id);
            if (!_.isNull(matchesArrayRedisResponse)) {
                const {
                    matchesArray: questionsAskMatchesArray,
                } = JSON.parse(matchesArrayRedisResponse);
                matchedQids = questionsAskMatchesArray.map((matched_question_obj) => matched_question_obj._id);
            } else {
                const mongoQuestionAskedData = await MongoQuestionAskUser.getDataFromMongo({ qid: question_id }, {});
                if (mongoQuestionAskedData && mongoQuestionAskedData.length > 0) {
                    matchedQids = mongoQuestionAskedData[0].relevance_score.map((x) => x.qid);
                } else {
                    // NO MONGO -  NO REDIS - ELASTICSEARCH
                    // TODO - new adv search elastic changes
                    // if (matchesType == 'askV10_viser_diagram') {
                    //     const matches = await QuestionHelper.callViserDiagramMatcher(config, question_id, 0, fileName, elasticSearchTestInstance, 200);
                    //     // const esResults = await elasticSearchInstance.getAdvanceSearchEsResults(ocr_text, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, research_es_filter_terms, Utility.getFieldNameForTranslate(question_locale));
                    //     matchesArray = matches[0].hits.hits;
                    // } else {
                    const esResults = await elasticSearchInstance.getAdvanceSearchEsResults(ocr_text, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, [], Utility.getFieldNameForTranslate(question_locale));
                    matchesArray = esResults.hits.hits;
                    // }
                }
            }
            return [matchedQids, matchesArray];
        } catch (err) {
            console.log(err);
            return [[], []];
        }
    }

    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const facets = req.body.facets_v2;
        const { student_id, locale } = req.user;
        const { question_id, ocr_text } = req.body;
        const question_locale = Utility.checkHindiCharsSubstr(ocr_text) ? 'hi' : 'en';
        const xAuthToken = req.headers['x-auth-token'];
        const versionCode = req.headers.version_code;
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance');
        const researchFacets = ['chapter', 'subject'];
        const filterFacets = ['video_language_display', 'class'];
        const feedback = Data.match_page_feedback;
        const supportedMediaList = req.body.supported_media_type || ['DASH', 'HLS', 'RTMP', 'BLOB'];
        const questionIdInfoRedisResponse = await QuestionRedis.getMatchesForAdvanceSearchById(db.redis.read, question_id);
        if (_.isNull(questionIdInfoRedisResponse)) {
            throw new Error('no details of questions present');
        }
        const questionIdInfo = JSON.parse(questionIdInfoRedisResponse);
        const {
            matchesType,
            fileName,
        } = questionIdInfo;
        const elastic_index_facet_key_mapping = {
            class: 'class',
            subject: 'subject',
            video_language: 'video_language_display',
            video_language_display: 'video_language_display',
            chapter: 'chapter',
        };

        let matchesArray = [];
        let matchedQids;
        let advanceSearchType;
        let isSelectedResearchFacets;
        let isSelectedFilterFacets;
        let rebuiltFacets;
        // STORE - FACETS SELECTIONS
        if (versionCode >= 922) {
            QuestionRedis.setActiveAdvanceSearchFilter(db.redis.write, question_id, JSON.stringify(facets));
        }
        // filter , research  , research_and_filter , deselect

        // check if any of the facets are selected or not - all in any category will not be considered as selected(will see this in the last)
        // if not facets are selected : -  get the stored matches , get facets on them as always;
        // if only filter facets are used :- get the matches stored and filter them on your end;
        // research + filter;
        const isSelected = facets.filter((facet) => facet.isSelected);
        // if (isSelected.length === 1 && isSelected[0].facetType === 'video_language_display') {
        //     const isSelectedObj = isSelected[0].data.filter((x) => x.isSelected);
        //     if (isSelectedObj.display === 'All Languages') {
        //         isSelected = [];
        //     }
        // }

        if (!(isSelected && isSelected.length)) {
            // CASE - NO FILTERS APPLIED / ALL DESELECTED
            // (getRedis) -qids | mongo | elasticsearch -> getMeta -> getFacets -> responseFormat;
            advanceSearchType = 'DE-SELECT';
            [matchedQids, matchesArray] = await getAdvanceSearchOriginalMatchesArray(db, elasticSearchInstance, question_id, ocr_text, question_locale);
        } else {
            isSelectedResearchFacets = isSelected.filter((x) => researchFacets.includes((x.facetType)));
            isSelectedFilterFacets = isSelected.filter((x) => filterFacets.includes(x.facetType));
            if (isSelectedResearchFacets && isSelectedResearchFacets.length === 0) {
                if (isSelectedFilterFacets && isSelectedFilterFacets.length > 0) {
                    advanceSearchType = 'FILTER';
                    [matchedQids, matchesArray] = await getAdvanceSearchOriginalMatchesArray(db, elasticSearchInstance, question_id, ocr_text, question_locale);
                }
            } else {
                // ELASTIC- RESEARCH IS MUST
                advanceSearchType = (isSelectedFilterFacets && isSelectedFilterFacets.length > 0) ? 'RESEARCH_AND_FILTER' : 'RESEARCH';
                const research_es_filter_terms = [];
                // TODO - new adv search elastic changes
                if (matchesType == 'image') {
                    const matches = await QuestionHelper.callViserDiagramMatcher(config, question_id, 0, fileName, elasticSearchTestInstance, 200);
                    // const esResults = await elasticSearchInstance.getAdvanceSearchEsResults(ocr_text, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, research_es_filter_terms, Utility.getFieldNameForTranslate(question_locale));
                    matchesArray = matches[0].hits.hits;
                } else {
                    for (let t = 0; t < isSelectedResearchFacets.length; t++) {
                        const keyName = elastic_index_facet_key_mapping[isSelectedResearchFacets[t].facetType];
                        const dataValues = isSelectedResearchFacets[t].data;
                        let filter_term_values = [];
                        for (let s = 0; s < dataValues.length; s++) {
                            if (dataValues[s].isSelected) {
                                filter_term_values = [...filter_term_values, ...dataValues[s].data];
                            }
                        }
                        if (Array.isArray(filter_term_values) && filter_term_values.length > 0) {
                            research_es_filter_terms.push({
                                terms: {
                                    [keyName]: filter_term_values,
                                },
                            });
                        }
                    }
                    const esResults = await elasticSearchInstance.getAdvanceSearchEsResults(ocr_text, config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, research_es_filter_terms, Utility.getFieldNameForTranslate(question_locale));
                    matchesArray = esResults.hits.hits;
                }
            }
        }

        if (!(matchesArray && Array.isArray(matchesArray) && matchesArray.length > 0)) {
            if (matchedQids && Array.isArray(matchedQids) && matchedQids.length > 0) {
                const esBulkFindDocsResults = await elasticSearchInstance.findDocumentsBulk(matchedQids, 'advance_search_v1.1');
                matchesArray = esBulkFindDocsResults.docs.filter((el) => el.found == true).map((elem) => ({
                    ...elem, _index: 'question_bank_v1', _source: { ...elem._source, thumbnail_language: 'english' }, partial_score: 100,
                }));
            }
        }

        // FETCHING -  MATCHES_ARRAY ( DONE )

        // FILTERING (MATCHES ARRAY)
        if (advanceSearchType && (['RESEARCH_AND_FILTER', 'FILTER'].includes(advanceSearchType))) {
            if (isSelectedFilterFacets && isSelectedFilterFacets.length > 0 && matchesArray && matchesArray.length > 0) {
                matchesArray = matchesArray.filter((match_elem_obj) => AnswerBl.doesMatchAdvanceSearchFilterCriterion(match_elem_obj._source, isSelectedFilterFacets));
            } else {
                matchesArray = [];
            }
        }
        // else if (matchesType == 'image' && isSelectedFilterFacets && isSelectedFilterFacets.length > 0 && matchesArray && matchesArray.length > 0) {
        //     matchesArray = matchesArray.filter((match_elem_obj) => AnswerBl.doesMatchAdvanceSearchFilterCriterion(match_elem_obj._source, isSelectedFilterFacets));
        // } else if (matchesType == 'image' && isSelectedResearchFacets && isSelectedResearchFacets.length > 0 && matchesArray && matchesArray.length > 0) {
        //     matchesArray = matchesArray.filter((match_elem_obj) => AnswerBl.doesMatchAdvanceSearchFilterCriterion(match_elem_obj._source, isSelectedResearchFacets));
        // }
        // --  FILTERED RESULTS -- (DONE)
        const selectedDisplays = [];
        for (let f = 0; f < facets.length; f++) {
            if (facets[f].isSelected) {
                for (let i = 0; i < facets[f].data.length; i++) {
                    if (facets[f].data[i].isSelected) {
                        selectedDisplays.push(facets[f].data[i].display);
                    }
                }
            }
        }

        //  -- FACETS MAKING --
        // FILTER -  no facet change (req.body.facets)
        // DE-SELECT - rebuilt facets
        // RESEARCH_AND_FILTER
        // else if (advanceSearchType == 'FILTER') {
        //     rebuiltFacets = facets;
        // }
        if (advanceSearchType == 'DE-SELECT') {
            const original_facets_redis_response = await QuestionRedis.getAdvanceSearchFacets(db.redis.read, question_id);
            rebuiltFacets = JSON.parse(original_facets_redis_response);
        } else {
            // CHECK FOR ALL SELECTS PRESENT IN FACETS
            rebuiltFacets = await QuestionBl.getFacetsByVersionCode(xAuthToken, config, versionCode, UtilityFlagr, elasticSearchInstance, matchesArray, locale);
            const rebuiltdFacetsTypes = rebuiltFacets.map((x) => x.facetType);
            // CASE -  facets present in original and selected but not exists in rebuilt
            for (let m = 0; m < facets.length; m++) {
                // only research -
                if (facets[m].isSelected && !rebuiltdFacetsTypes.includes(facets[m].facetType) && researchFacets.includes(facets[m].facetType)) {
                    rebuiltFacets.push({
                        ...facets[m], data: facets[m].data.filter((obj) => obj.isSelected),
                    });
                }
                // only filter -
                if (!rebuiltdFacetsTypes.includes(facets[m].facetType) && filterFacets.includes(facets[m].facetType)) {
                    rebuiltFacets.push(facets[m]);
                }

                if (facets[m].isSelected) {
                    for (let y = 0; y < rebuiltFacets.length; y++) {
                        if (rebuiltFacets[y].facetType == facets[m].facetType) {
                            rebuiltFacets[y].isSelected = true;
                            for (let t = 0; t < rebuiltFacets[y].data.length; t++) {
                                if (selectedDisplays.includes(rebuiltFacets[y].data[t].display)) {
                                    rebuiltFacets[y].data[t].isSelected = true;
                                }
                            }
                        }
                    }
                }
            }

            if (rebuiltFacets && rebuiltFacets.length) {
                for (let k = 0; k < rebuiltFacets.length; k++) {
                    if (filterFacets.includes(rebuiltFacets[k].facetType)) {
                        rebuiltFacets[k] = QuestionBl.formatFilterFacet(rebuiltFacets[k]);
                    }
                }
            } else {
                // NO FACETS SELECTION COMES
                rebuiltFacets = [];
                for (let m = 0; m < facets.length; m++) {
                    if (facets[m].isSelected) {
                        rebuiltFacets.push(facets[m]);
                    }
                }
            }
        }

        // ---- FORMAT FACETS ----

        for (let j = 0; j < rebuiltFacets.length; j++) {
            if (researchFacets.includes(rebuiltFacets[j].facetType)) {
                rebuiltFacets[j].data = rebuiltFacets[j].data.map((obj) => ({
                    ...obj,
                    selectable: true,
                }));
            }
        }

        // REBUILT LOGIC COMPLETE

        //  ----- FACETS ---- ( SORTING )
        for (let s = 0; s < rebuiltFacets.length; s++) {
            const facetsData = rebuiltFacets[s].data;
            facetsData.sort((elem1, elem2) => {
                const elem1_param1 = elem1.selectable ? 1 : 0;
                const elem1_param2 = elem1.isSelected ? 1 : 0;
                const elem2_param1 = elem2.selectable ? 1 : 0;
                const elem2_param2 = elem2.isSelected ? 1 : 0;
                return ((elem1_param1 + elem1_param2) - (elem2_param1 + elem2_param2));
            });

            rebuiltFacets[s].data = facetsData.reverse();
        }
        // STRING DIFF =>  ORDER MATCHES ARRAY  - LAST
        matchesArray = matchesArray.map((obj) => {
            const partial_score = Utility.compareBystringDiff(fuzz, ocr_text, obj._source.ocr_text);
            return { ...obj, partial_score };
        });
        matchesArray = _.orderBy(matchesArray, ['partial_score'], ['desc']);
        // RESPONSE CREATION
        const resData = {
            facets: rebuiltFacets,
            ocr_text: req.body.ocr_text,
            question_id: req.body.question_id,
            question_image: req.body.question_image,
            notification: [],
            tab: [],
            platform_tabs: Data.platform_tabs,
            matched_questions: matchesArray,
            matched_count: matchesArray.length,
            feedback,
            is_p2p_available: p2pData.isMatchpageP2pEnabled,
            p2p_thumbnail_images: locale === 'hi' ? p2pData.p2pAskerThumbnailsHi : p2pData.p2pHelperThumbnailsEn,
        };

        if (matchesArray && matchesArray.length == 0) {
            resData.feedback.is_show = 0;
            resData.message = Data.advanceEmptyMsg(locale);
            // const original_facets_response = await QuestionRedis.getAdvanceSearchFacets(db.redis.read, question_id);
            resData.facets = req.body.facets_v2;
        } else {
            const languagesArrays = await LanguageContainer.getList(db);
            const languagesObj = Utility.getLanguageObject(languagesArrays);
            const stLangCode = 'en';
            let language = languagesObj[stLangCode];
            if (typeof language === 'undefined') {
                language = 'english';
            }

            matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, config, [Data.color.white], language, stLangCode, {}, {}, db, student_id, xAuthToken, versionCode);
            const flag = 0;
            if (locale && locale !== 'en' && flag === 0) {
                for (let i = 0; i < matchesArray.length; i++) {
                    const lang = Data.languageObject[locale];
                    // eslint-disable-next-line no-await-in-loop
                    const localizedQuestion = await MysqlQuestion.getLocalisedQuestion(matchesArray[i]._id, lang, db.mysql.read);
                    if (localizedQuestion.length === 1 && !_.isEmpty(localizedQuestion[0][lang])) {
                        matchesArray[i]._source.ocr_text = localizedQuestion[0][lang];
                    }
                }
            }

            const redisQuestionRowPromises = [];
            for (let i = 0; i < matchesArray.length; i++) {
                redisQuestionRowPromises.push(AnswerRedis.getByQuestionIdWithTextSolution(matchesArray[i]._id, db.redis.read));
            }

            const resolvedRedisQuestionRowPromises = await Promise.all(redisQuestionRowPromises);
            for (let i = 0; i < resolvedRedisQuestionRowPromises.length; i++) {
                if (!_.isNull(resolvedRedisQuestionRowPromises[i])) {
                    matchesArray[i]._source.ocr_text = JSON.parse(resolvedRedisQuestionRowPromises[i])[0].ocr_text;
                } else {
                    matchesArray[i]._source.ocr_text = matchesArray[i]._source.ocr_text_en;
                }
            }

            if (versionCode >= 794) {
                const videoResourcePromise = [];
                for (let i = 0; i < matchesArray.length; i++) {
                    videoResourcePromise.push(Answer_Container_v13.getAnswerVideoResource(db, config, matchesArray[i].answer_id, matchesArray[i]._id, supportedMediaList));
                }
                if (videoResourcePromise.length > 0) {
                    const videoResourceResults = await Promise.all(videoResourcePromise);
                    for (let i = 0; i < matchesArray.length; i++) {
                        if (videoResourceResults[i] != undefined && videoResourceResults[i].length > 0 && videoResourceResults[i][0] != undefined) {
                            matchesArray[i].video_resource = videoResourceResults[i][0];
                        }
                    }
                }
            }

            const subjectIconList = await Question.getIconLink(db.mysql.read);

            matchesArray = matchesArray.map((obj) => {
                const subjectIcon = subjectIconList.filter((y) => y.subject_name == obj._source.subject.toLowerCase() || y.subject_name_hi == obj._source.subject.toLowerCase());
                if (subjectIcon.length > 0) {
                    obj._source.subject_title = req.user.locale === 'hi' ? subjectIcon[0].subject_name_hi : subjectIcon[0].subject_name;
                    obj._source.subject_icon_link = subjectIcon[0].icon_link;
                }
                return obj;
            });

            resData.matched_questions = matchesArray;
            resData.feedback.is_show = 1;
        }

        if (versionCode >= 765) {
            const autoPlayData = await QuestionContainer.getAutoPlayVariant(xAuthToken);

            if (!autoPlayData.autoPlayVariant) {
                resData.auto_play = false;
            } else {
                resData.auto_play = true;
                resData.auto_play_initiation = autoPlayData.waitTime;
                resData.auto_play_duration = autoPlayData.duration;
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: resData,
        };
        responseData.data = await QuestionHelper.getLiveAndVipTabDetails(db, responseData.data, req.user, req.headers);
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'FAILURE',
            },
            data: e,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    viewAnswerByQuestionId,
    advancedSearch,
    advanceSearchNew,
};
