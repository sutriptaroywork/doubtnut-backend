/* eslint-disable no-nested-ternary */
/* eslint-disable eqeqeq */
/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable import/no-extraneous-dependencies */

require('../../../modules/mongo/comment');
const bluebird = require('bluebird');
const mongoose = require('mongoose');

bluebird.promisifyAll(mongoose);
const _ = require('lodash');

const uuidv4 = require('uuid/v4');
const moment = require('moment');

const VideoView = require('../../../modules/videoView');
const Utility = require('../../../modules/utility');
const Notification = require('../../../modules/notifications');
const Answer_Container = require('./answer.container');
const Answer_Container_v11 = require('../../v11/answer/answer.container');
const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const AnswerRedis = require('../../../modules/redis/answer');
// const QuestionOcrRedis = require('../../../modules/redis/questionOcr');
const QuestionRedis = require('../../../modules/redis/question');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
// const mysqlMicroconcept = require('../../../modules/mysql/microconcept');
const PlaylistContainer = require('../../../modules/containers/playlist');
// const QuestionsMetaContainer = require('../../../modules/containers/questionsMeta');
const MysqlQuestion = require('../../../modules/mysql/question');
// const appConfigSql = require('../../../modules/mysql/appConfig');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const SubjectPersonalisationRedis = require('../../../modules/redis/SubjectPersonalisation');
const QuestionsMeta = require('../../../modules/questionsMeta');
const studentPersonalisation = require('../../../modules/redis/studentPersonalisation');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const StructuredCourse = require('../../../modules/mysql/structuredCourse');
const logger = require('../../../config/winston').winstonLogger;
const Data = require('../../../data/data');
const LiveclassData = require('../../../data/liveclass.data');
const QuestionHelper = require('../../helpers/question.helper');
const LiveclassHelper = require('../../helpers/liveclass');
const Question = require('../../../modules/question');
const Liveclass = require('../../../modules/mysql/liveclass');
const Package = require('../../../modules/mysql/package');
const StudentRedis = require('../../../modules/redis/student');
const HomepageContainer = require('../../../modules/containers/homepage');
const AnswerHelper = require('../../helpers/answer');
const CourseContainer = require('../../../modules/containers/coursev2');
const { generateURL } = require('../../helpers/buildStaticCdnUrl');
const StudentMongo = require('../../../modules/mongo/student');
const AdvanceSearchLogsMongo = require('../../../modules/mongo/advanceSearchLogs');
const { isStudyGroupEnabled } = require('../../v1/studyGroup/studyGroup.controller');
const bl = require('./answer.bl');
const { makeData } = require('../../v7/library/library.helper');
const LibTranslation = require('../../../modules/translation/library');
const redis = require('../../../modules/redis/library');
const libraryMysql = require('../../../modules/mysql/library');
const CourseHelper = require('../../helpers/course');
const TeacherMysql = require('../../../modules/mysql/teacher');
const TeacherContainer = require('../../../modules/containers/teacher');
const StudentHelper = require('../../helpers/student.helper');
const kafka = require('../../../config/kafka');
const D0UserManager = require('../../helpers/d0User.helper');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const altAppData = require('../../../data/alt-app');

let db; let config; let sqs; let sns;

async function isQuestionIDInTopFreeClasses(questionID) {
    const isPresent = await QuestionContainer.isQuestionIDPresentInTopFreeClasses(db, questionID);
    return +isPresent === 1;
}

function changeVideoResource(videoResource) {
    if (!_.get(videoResource, '[0].video_resource', false) || !_.get(videoResource, '[0].media_type', false)) return;

    if (!_.includes(['RTMP', 'HLS', 'YOUTUBE'], videoResource[0].media_type) && !videoResource[0].is_flv) {
        videoResource[0].resource = `${Data.cloudfront_video_url}${videoResource[0].video_resource}`; // default limelight
    }
}

async function viewAnswerByQuestionId(req, res, next) {
    sqs = req.app.get('sqs');
    sns = req.app.get('sns');
    config = req.app.get('config');
    let viewData;
    const packageValue = req.headers.package_name;
    const isFreeApp = packageValue === altAppData.freeAppPackageName;

    try {
        db = req.app.get('db');
        let { page } = req.body;
        if (!page) {
            page = 'DEFAULT';
        }
        const { session_id } = req.body;
        const { tab_id } = req.body;
        let { source } = req.body;
        let { parent_id } = req.body;
        const { ref_student_id } = req.body;
        const { student_id } = req.user;
        const { youtube_id, supported_media_type: supportedMediaList } = req.body;
        let data = {}; let { student_class } = req.user; let student_course; let hls_url;
        const { isDropper } = req.user;
        const { is_connection_slow } = req.body;
        const { version_code } = req.headers;
        const { matchedQuestionSnsUrl } = Data;
        const ip = Utility.getClientIp(req);
        let resolvedPromisesData;
        const hls_timeout = 0;
        let question_id = '';
        const { locale: user_locale } = req.user;
        // const avarageViewtime = await AnswerContainer.getAvgViewData(req, db);
        let tablist = [];
        let videoPagePattern = 1;
        let responseData = {};
        const log_data = {};
        const next_video = '';
        const xAuthToken = req.headers['x-auth-token'];
        const isComputationQuestion = !!(req.body.isComputationQuestion);
        const isBrowser = req.headers.is_browser;
        const elasticSearchUserQuestionsInstance = req.app.get('elasticSearchUserQuestionsInstance');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const meta = {};

        // let flgrData;
        let appCountry = 'IN';
        const { timestamp, locale: student_locale } = req.user;
        if (!_.isEmpty(req.headers.country)) {
            appCountry = req.headers.country;
        }

        let isFilter = false;
        if (req.body.is_filter) {
            isFilter = req.body.is_filter;
        }
        // const yt_student_id = [94, 80, -3];
        const viral_video_student_id_arr = Data.viralVideoStudentIDS;
        if ((typeof ref_student_id !== 'undefined') && (ref_student_id !== '') && (ref_student_id) && !_.includes(ref_student_id, 'WHA') && appCountry === 'IN') {
            // ASYNC
            Notification.sendNotificationToStudent('referred_video', ref_student_id, null, db);
        }
        const pageTopics = ['CC', 'SC', 'BROWSE_MC', 'HOME_PAGE_CC', 'SEARCH_MC', 'SEARCH_SC'];
        const otherPage = ['STRUCTURED', 'HOME_WIDGET', 'SRP', 'LIBRARY', 'TOPIC_BOOSTER_GAME', 'MPVP', 'DP', 'BROWSE', 'QUIZ_NOTIFICATION', 'P2P', 'STUDYDOST', 'STUDYGROUP',
            'NOTIFICATION', 'REFER', 'DEEPLINK', 'DEEPLINK_WEB', 'INAPP', 'COMMUNITY', 'SIMILAR', 'HOME_FEED', 'HOME', 'SS', 'SUGGESTIONS', 'APP_INDEXING', 'HOME_PAGE', 'VIDEO_HISTORY', 'SEARCH_SRP', 'E_LECTURES', 'E_COURSE', 'E_FACULTY', 'HOMEPAGE', 'MOCK_TEST', 'LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'TS_VOD', 'LIVECLASS_RESOURCE', 'PERSONALIZATION', 'WATCH-HISTORY', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'OTHER_MATCH_VIDEOS', 'LIVE_CLASS_MPVP', 'HOMEWORK_SOLUTION', 'SRP_PLAYLIST', 'NON_SRP_PLAYLIST', 'RECOMENDED_PLAYLIST', 'HOME_FEED_CHANNELS', 'TOP_FREE_CLASSES', 'POST_PURCHASE_COURSE_DETAILS', 'WHATS_NEW_HOME', 'NCERT', 'MPVP_BOTTOM_SHEET', 'NO_SOLUTION', 'REWARDS', 'CHAPTER_SERIES_CAROUSAL', 'DAILY_DOUBT', 'PAID_CONTENT_FEED', 'DEFAULT', 'EXAM_CORNER', 'TEACHER_INTRO', 'PRACTICE_CORNER', 'QUIZTFS_PAST', 'MOCKTEST_ANALYSIS', 'BOOK_LIST', 'LIBRARY_BOOK_LIST', 'HOME_PAGE_REVISION_CLASSES', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'TOP_TEACHERS_CLASSES', 'TOP_TEACHERS_CLASSES_ALL', 'LIVECLASS_FREE', 'QA_WIDGET_LIVE', 'QA_WIDGET_TOPIC', 'QA_WIDGET_BOOK', 'QA_WIDGET_NCERT', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP', 'STUDENT_PROFILE', 'REFERRAL_V2', 'POST_QA_NOTIFICATION', 'FREE_CLASS_LIST', 'SCHOLARSHIP_TEST', 'SCHOLARSHIP_TEST_COD', 'REVISION_CORNER', 'SHORTTEST_RESULT', 'SCHOLARSHIP_TEST_LF_NOTIF', 'NCERT_NEW_FLOW', 'SRP_NO_FILTER'];
        const youtubePage = ['YT_ASK'];
        const wolframPage = ['WOLFRAM'];
        const liveclassPages = ['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'LIVECLASS_ALERT', 'LIVECLASS_HOME', 'COURSE_DETAIL',
            'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP', 'PAID_CONTENT_FEED', 'CHAPTER_SERIES_CAROUSAL', 'HOME_PAGE_REVISION_CLASSES', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'QA_WIDGET_LIVE', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP', 'FREE_CLASS_LIST'];
        const playlistPages = ['SRP_PLAYLIST', 'NON_SRP_PLAYLIST', 'RECOMENDED_PLAYLIST'];

        if (page === 'LIVECLASS_NOTIFICATION') {
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            AnswerRedis.setLiveclassExp(db.redis.write, 'last_video_watch_from_liveclass_notification', student_id, currentTimeInSeconds); // using existing function to avoid duplicacy
        }

        if (!_.includes(wolframPage, page) && !_.includes(youtubePage, page) && !_.includes(playlistPages, page) && !_.includes(liveclassPages, page) && page !== 'DAILY_DOUBT') {
            bl.storeSimilarDataIntoRedis(db, page, req.body.id, student_id);
        } else if (_.includes(playlistPages, page)) {
            QuestionContainer.playlistView(db, `${page}_last_viewed`, req.body.id, student_id);
        } else if (page === 'DAILY_DOUBT') {
            QuestionRedis.setTopicVideoQuestion(db.redis.write, student_id, page, req.body.id);
        }
        // flagr common handling
        // const flgrData = { xAuthToken, body: { capabilities: {} } };
        // if (_.includes(otherPage, page)) {
        //     if (version_code > 808 && appCountry === 'IN') {
        //         flgrData.body.capabilities = { video_screen_tabs_v2: {} };
        //         if (version_code > 815) {
        //             flgrData = { xAuthToken, body: { capabilities: { video_screen_tabs_v2_new: {} } } };
        //         }
        //     }
        // }
        const flgrResp = await Answer_Container.getAllFlagsNeededForThePage(db, version_code, page, liveclassPages, student_id);
        let videoQualityOptionShow = false;
        if (version_code > 1003 && flgrResp && flgrResp.video_quality_options_experiment && flgrResp.video_quality_options_experiment.enabled && flgrResp.video_quality_options_experiment.payload.enabled) {
            videoQualityOptionShow = true;
        }

        if (_.includes(wolframPage, page)) {
            const { ocr_text, html } = req.body;
            responseData = await bl.handleWolframSolution(config, parent_id, ocr_text, html, Utility, sqs, sns, matchedQuestionSnsUrl, QuestionHelper);
            // MysqlQuestion.updateMatchedAliasTable(parent_id, db.mysql.write);
            // const data1 = {
            //     action: 'UPDATE_PARENT_ID_FROM_APP',
            //     question_id: parent_id,
            // };
            // Utility.logEntry(sns, config.update_parent_id_sns, data1);
            if (responseData.meta.code === 200) {
                return next({ data: responseData.data });
            }
            return next({
                err: {
                    status: responseData.meta.code,
                    message: responseData.meta.message,
                },
            });
        }
        if (_.includes(youtubePage, page)) {
            const youtubeQid = req.body.id;
            const { ocr_text } = req.body;
            responseData = await bl.handleYoutubeSearchPage(db, youtubeQid, youtube_id, parent_id, student_id, ocr_text, Question);
            if (responseData.meta.code === 200) {
                return next({ data: responseData.data });
            }
            return next({
                err: {
                    status: responseData.meta.code,
                    message: responseData.meta.message,
                },
            });
        }

        if (_.includes(pageTopics, page)) {
            const mc_id = req.body.id;
            student_class = req.body.mc_class;
            // student_class = req.user.student_class;
            student_course = req.body.mc_course;
            let promises = [];
            const settledPromises = await Promise.allSettled([AnswerContainer.getByMcIdWithTextSolution(mc_id, db), AppConfigurationContainer.getConfigByKey(db, 'video_view_stats')]);
            // eslint-disable-next-line prefer-const
            let [questionWithAnswer, videoViewCheck] = settledPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
            if (questionWithAnswer.length && ((questionWithAnswer[0].is_answered === 0 && questionWithAnswer[0].is_text_answered === 0) || questionWithAnswer[0].youtube_id === 'yt url')) {
                await AnswerRedis.deleteByMcIdWithTextSolution(mc_id, db.redis.write);
                questionWithAnswer = await AnswerContainer.getByMcIdWithTextSolution(mc_id, db);
            }
            if (!student_class) {
                student_class = questionWithAnswer[0].class;
            }
            if (!student_course) {
                student_course = 'NCERT';
            }
            if (questionWithAnswer.length < 1) {
                responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Please check mc id',
                    },
                    data: null,
                };
                return next({
                    err: {
                        status: 403,
                        message: 'Please check mc id',
                    },
                });
            }

            let resource_type = 'video';
            let resource_data = null;
            if (questionWithAnswer.length > 0 && questionWithAnswer.is_text_answered === 1 && questionWithAnswer.is_answered === 0) {
                resource_type = 'text';
                questionWithAnswer.answer_id = questionWithAnswer.text_solution_id;
                questionWithAnswer.expert_id = 0;
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
            if (!_.includes(['COURSE_DETAIL', 'COURSE_RESOURCE', 'COURSE_LANDING', 'LIVE_CLASS_MPVP', 'CHAPTER_SERIES_CAROUSAL'], page)) {
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
                view_from: req.headers.is_video_blocked ? `${page}_BLOCKED` : page,
            };

            if (!questionWithAnswer.answer_video) {
                logger.error({
                    tag: 'videoApi',
                    source: 'viewAnswerByQuestionId',
                    error: `answer_video is null for ${mc_id}`,
                });
            }
            // const answer_video_name = questionWithAnswer.answer_video.split('.')[0];
            hls_url = '';

            let ocr;
            if ((questionWithAnswer.ocr_text.indexOf('<math')) == -1) {
                ocr = questionWithAnswer.ocr_text;
            } else {
                ocr = questionWithAnswer.question;
            }
            // checking youtube play or default
            questionWithAnswer = Utility.checkYoutubeVideo(Data.yt_student_id, questionWithAnswer);
            const isEtoosStudent = Data.et_student_id.includes(questionWithAnswer.student_id);
            // * Get CDN from redis for the current answer id
            const cdnurl = await AnswerRedis.getCdnForAnswerId(db.redis.read, questionWithAnswer.answer_id);
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
                // fallback_answer_video: isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video,
                fallback_answer_video: isEtoosStudent ? generateURL(Data.etoos_video_prefix, questionWithAnswer.answer_video) : generateURL(cdnurl, questionWithAnswer.answer_video),
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
            if (appCountry === 'IN' && Data.ncertStudentIds.includes(+(questionWithAnswer.student_id))) {
                HomepageContainer.storeActivityDetails(db.redis, student_id, 'ncert_video_watch');
                data.is_ncert = true;
            }
            if (appCountry === 'US') {
                // data.thumbnail_image = `${config.staticCDN}q-thumbnail-localized/${questionWithAnswer.question_id}/english.png`;
                data.thumbnail_image = `${config.cdn_url}question-thumbnail/en_${questionWithAnswer.question_id}.png`;
                data.exam = await Answer_Container.getUsExamData(db, questionWithAnswer.question_id);
            }
            if (tablist.length > 0) {
                data.tab_list = tablist;
            }
            data.video_page_iteration = videoPagePattern;
            // data.fallback_answer_video = isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video;
            data.fallback_answer_video = isEtoosStudent ? generateURL(Data.etoos_video_prefix, questionWithAnswer.answer_video) : generateURL(cdnurl, questionWithAnswer.answer_video);
            data = await Answer_Container.checkEVideos(db, data, questionWithAnswer, student_id, appCountry);

            // eslint-disable-next-line eqeqeq
            if (videoViewCheck && videoViewCheck.length > 0 && videoViewCheck[0].key_value == '0') {
                promises.push([]);
            } else {
                if (StudentHelper.isAltApp(req.headers.package_name)) {
                    // we are adding alt app name, only the next part of com.doubtnut, after page name
                    viewData.source = req.headers.package_name.split('.').slice(2).join('_');
                }
                promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
            }
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentNew(student_id, questionWithAnswer.answer_id, questionWithAnswer.answer_video, db));
            promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
            promises.push(QuestionContainer.getTotalViewsWeb(questionWithAnswer.question_id, db));
            resolvedPromisesData = await Promise.allSettled(promises);
            const [
                insertData,
                feedbackData,
                playlistData,
                totalViews,
            ] = resolvedPromisesData.map((value) => (value.status === 'fulfilled' ? value.value : undefined));

            if (feedbackData && feedbackData.length > 0) {
                if (+(feedbackData[0].rating) > 3) {
                    data.isLiked = true;
                    // //console.log("like");
                } else {
                    data.isDisliked = true;
                    // //console.log("dislike");
                }
            }
            if (playlistData && playlistData.length > 0) {
                data.isPlaylistAdded = true;
                data.playlist_name = playlistData.name;
                data.playlist_id = playlistData.id;
            }

            if (insertData && insertData.insertId) {
                viewData.uuid = insertData.insertId;
                viewData.created_at = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                viewData.action = Data.ask_vvs.insert_view;
                // kafka.publish(kafka.topics.askVvs, student_id, viewData);
                data.view_id = insertData.insertId;
                viewData.view_id = insertData.insertId;
            } else {
                data.view_id = '1';
                viewData.view_id = '1';
            }

            // notification inserting function   ------------    start     //
            if (student_id != 588226) {
                // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer.question_id, config, admin, db);
            }

            promises = [];
            promises.push(AnswerContainer.getAnswerTitleAndDescription2(data, db));
            promises.push(AnswerContainer.getLikeDislikeStats(totalViews[0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getWhatsappShareStats(totalViews[0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getVideoLocale(db, data.student_id));
            const tempPromiseData = await Promise.allSettled(promises);
            const [
                descrip,
                likeDislikeStats,
                whatsappShareStats,
                moevideoLocale,
            ] = tempPromiseData.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
            data.likes_count = likeDislikeStats[0];
            data.dislikes_count = likeDislikeStats[1];
            data.share_count = whatsappShareStats[0];

            if (descrip.length > 0) {
                data.weburl = descrip;
            } else {
                data.weburl = '';
            }
            data.title = ocr;
            data.description = ocr;
            // notification  inserting function         ----------------     end  //

            if (next_video != '' && appCountry === 'IN') {
                data.next_video_details = next_video;
                if (version_code >= 766) {
                    data.next_video_details.deeplink = `doubtnutapp://video?qid=${next_video.qid}&page=${page}`;
                    data.next_video_details.button_text = Data.smart_play_button_text;
                }
            }

            if ((version_code > 754 && appCountry === 'IN') || (appCountry === 'US')) {
                // data.avg_view_time = avarageViewtime;
                data.min_watch_time = 0;
            }
            data.moe_event = {
                video_locale: moevideoLocale,
            };
            if (resource_type == 'text') {
                const feedbackInMongo = await StudentMongo.getTextSolutionFeedback(req.user.student_id, req.body.id, db.mongo.write);
                if (feedbackInMongo.length == 0) {
                    data.banner_data = {
                        image: `${config.staticCDN}${Data.textSolutionBanner(user_locale).imageLink}`,
                        text: Data.textSolutionBanner(user_locale).mainText,
                        cta_text: Data.textSolutionBanner(user_locale).buttonText,
                        cta_clicked_image: `${config.staticCDN}${Data.textSolutionBanner(user_locale).successImageLink}`,
                        cta_clicked_text: Data.textSolutionBanner(user_locale).successText,
                    };
                }
            }

            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data,
            };

            if (videoQualityOptionShow && responseData.data.video_resources && responseData.data.video_resources.length > 0) {
                responseData.data.video_resources = Answer_Container.addVideoQualityOptionsList(config.staticCDN, responseData.data.video_resources, liveclassPages, page);
            }

            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'WATCH_LIBRARY_VIDEO',
                user_id: req.user.student_id,
                refer_id: questionWithAnswer.question_id,
            });
            if (responseData.meta.code === 200) {
                return next({ data: responseData.data });
            }
            return next({
                err: {
                    status: responseData.meta.code,
                    message: responseData.meta.message,
                },
            }); // const data1 = {
            //     action: 'VIDEO_VIEW_FROM_APP',
            //     data: viewData,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.video_view_sns, data1);
        }
        let pdfBannerData = '';
        if (_.includes(otherPage, page)) {
            if (page === 'SRP') {
                if (!_.isNull(req.headers.flagr_variation_ids) && !_.isEmpty(req.headers.flagr_variation_ids)) {
                    const flagVariantsArr = req.headers.flagr_variation_ids.split(',');
                    if ((req.headers.version_code < 902 && flagVariantsArr.includes('1105')) || (req.headers.version_code >= 902 && flagVariantsArr.includes('1169'))) {
                        // bl.storeDoubtFeedTopic(db, req.headers['x-auth-token'], req.headers.version_code, student_id, req.user.locale, req.user.mobile, req.user.gcm_reg_id, req.body.id, req.body.parent_id);
                        if (req.body.parent_id !== '0') {
                            kafka.publish(kafka.topics.dailyGoal, req.user.student_id, {
                                sid: +(req.user.student_id),
                                versionCode: +(req.headers.version_code),
                                locale: req.user.locale,
                                gcmId: req.user.gcm_reg_id,
                                questionId: +(req.body.id),
                                parentId: +(req.body.parent_id),
                            }, {});
                        }
                    }
                }

                const { parent_page } = req.body;
                if (!_.isEmpty(parent_page) && parent_page == 'ADV_SEARCH') {
                    // STORE FILTERS PLUS VIDEO ID WATCHED
                    const filters = await QuestionRedis.getActiveAdvanceSearchFilter(db.redis.read, parent_id);
                    const advSearchLogs = new AdvanceSearchLogsMongo({
                        studentId: student_id,
                        questionId: parent_id,
                        viewId: req.body.id,
                        filters: JSON.parse(filters),
                        page,
                        source,
                    });
                    advSearchLogs.save();
                }

                const SrpPromises = [];
                if (isComputationQuestion) {
                    SrpPromises.push(Question.getByNewQuestionId(req.body.id, db.mysql.read));
                } else {
                    SrpPromises.push(QuestionContainer.getByQuestionIdForCatalogQuestions(db, req.body.id));
                }
                SrpPromises.push(QuestionRedis.getUserAskedQuestionData(db.redis.read, parent_id, 'm_qids'));
                const SrpResolvedPromises = await Promise.allSettled(SrpPromises);
                const [questionDetails, redisMatchedQids] = SrpResolvedPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
                let questionDetailsAnswered;
                if (questionDetails.length && questionDetails[0].is_answered != 'undefined') {
                    questionDetailsAnswered = questionDetails[0].is_answered;
                }
                // const redisMatchedQids = SrpResolvedPromises[1];
                if (!_.isNull(redisMatchedQids)) {
                    const matchedQuestionIds = JSON.parse(redisMatchedQids);
                    const matchedQuestionIndex = matchedQuestionIds.indexOf(req.body.id.toString()) + 1;
                    elasticSearchUserQuestionsInstance.addVideoViewForQid('user-questions', req.body.parent_id, {
                        question_id: req.body.id,
                        video_time: 0,
                        engage_time: 0,
                        video_type: questionDetailsAnswered == 0 && questionDetails[0].is_text_answered == 1 ? 'text' : 'video',
                        timestamp: moment().add(5, 'h').add(30, 'minutes').unix(),
                    }, matchedQuestionIndex);
                }
                let chapter;
                if (!_.isEmpty(questionDetails) && !_.isEmpty(questionDetails[0].chapter)) {
                    chapter = questionDetails[0].chapter;
                }
                // if (Utility.isStudentIdEligibleForRepeatQuestionsPersonalisation(student_id)) {
                // if (questionDetails && questionDetails.length > 0) {
                //     const promises = [];
                //     promises.push(AnswerContainer.getVideoLocale(db, questionDetails[0].student_id));
                //     const [videoLocale] = await Promise.all(promises);
                //     const thisQuestionPersonalisationData = {
                //         question_id: parent_id,
                //         video_id: req.body.id,
                //         class: parseInt(req.user.student_class),
                //         subject: questionDetails[0].subject,
                //         chapter,
                //         video_language: videoLocale,
                //         video_time: 0,
                //         engage_time: 0,
                //     };
                //     QuestionRedis.populateVideosWatchedPersonalisationData(db.redis.write, student_id, thisQuestionPersonalisationData, 20);
                // }
                // }

                if (version_code > 808 && appCountry === 'IN') {
                    let pdfDownloadPaneFlag;
                    if (flgrResp) {
                        pdfDownloadPaneFlag = { srp_pdf_download: flgrResp.srp_pdf_download };
                    }
                    if (version_code > 811 && flgrResp && flgrResp.video_screen_tabs_v2_new && flgrResp.video_screen_tabs_v2_new.enabled) {
                        tablist = [
                            {
                                key: 'similar',
                                value: Data.similarTabHeading(user_locale),
                            },
                        ];

                        if (flgrResp.video_screen_tabs_v2_new.payload && flgrResp.video_screen_tabs_v2_new.payload.enabled && typeof chapter !== 'undefined') {
                            const versionCode = flgrResp.video_screen_tabs_v2_new.payload.version;
                            const liveClassList = await Liveclass.getLiveClassByChapter(db.mysql.read, chapter, req.user.student_class);
                            if (liveClassList.length > 0) {
                                tablist.push(
                                    {
                                        key: 'live',
                                        value: (versionCode == 3 ? Data.similarLiveClassHeading(user_locale) : Data.liveClassHeading(user_locale)),
                                    },
                                );
                                videoPagePattern = versionCode == 5 ? 2 : versionCode;
                                if (student_class === '14') videoPagePattern = 1;
                            }
                        }
                    } else if (flgrResp && flgrResp.video_screen_tabs_v2 && flgrResp.video_screen_tabs_v2.enabled) {
                        tablist = [
                            {
                                key: 'similar',
                                value: Data.similarTabHeading(user_locale),
                            },
                        ];

                        if (flgrResp.video_screen_tabs_v2.payload && flgrResp.video_screen_tabs_v2.payload.enabled && typeof chapter !== 'undefined') {
                            const versionCode = flgrResp.video_screen_tabs_v2.payload.version;
                            const liveClassList = await Liveclass.getLiveClassByChapter(db.mysql.read, chapter, req.user.student_class);
                            if (liveClassList.length > 0) {
                                tablist.push(
                                    {
                                        key: 'live',
                                        value: (versionCode == 3 ? Data.similarLiveClassHeading(user_locale) : Data.liveClassHeading(user_locale)),
                                    },
                                );
                                videoPagePattern = versionCode;
                                if (student_class === '14') videoPagePattern = 1;
                            }
                        }
                    }

                    if (pdfDownloadPaneFlag && pdfDownloadPaneFlag.srp_pdf_download && pdfDownloadPaneFlag.srp_pdf_download.payload && pdfDownloadPaneFlag.srp_pdf_download.payload.enabled) {
                        const versionCode = pdfDownloadPaneFlag.srp_pdf_download.payload.version;
                        const { bannerShowTime } = pdfDownloadPaneFlag.srp_pdf_download.payload;
                        const quesId = req.body.id;
                        const limit = 20;
                        let question_locale = 'en';
                        if (!_.isEmpty(req.user.locale)) {
                            question_locale = req.user.locale;
                        }
                        const descriptionText = global.t8[question_locale].t('{{chapter}} Ke Questions Karen Practice!', { chapter });
                        const titleText = global.t8[question_locale].t('Practice Questions for You');
                        pdfBannerData = {
                            pdfDescription: descriptionText,
                            qid: quesId,
                            limit,
                            title: titleText,
                            fileName: `${quesId}_${question_locale}_${limit}`,
                            persist: true,
                            bannerShowTime,
                            version: versionCode,
                        };
                    }
                }

                CourseContainer.userWatchedTopicsFromSRP(db, student_id, chapter);
            }

            question_id = req.body.id;

            if ((page === 'SIMILAR' || page === 'DEFAULT') && appCountry === 'IN') {
                const countKey = 'lc_count';
                const showKey = 'lc_show';
                const [liveClassCount, checkResult] = await Promise.all([
                    Answer_Container_v11.getLiveclassShowCount(db.redis, countKey, student_id),
                    Liveclass.checkLiveClassVideo(db.mysql.read, question_id),
                ]);

                if (checkResult.length != 0) {
                    AnswerRedis.setLiveClassShowDetails(db.redis.write, showKey, student_id, `y_${question_id}_${liveClassCount}`);
                }
            }

            if (page == 'WATCH-HISTORY') {
                const view_question_id = await Question.getQuestionFromVideoViewStats(db.mysql.read, student_id, question_id);

                if (!_.isEmpty(view_question_id) && view_question_id.length > 0) {
                    question_id = view_question_id[0].question_id;
                }
            }

            if (isComputationQuestion) {
                resolvedPromisesData = await AnswerContainer.getByQuestionNewIdWithTextSolution(question_id, db);
            } else {
                resolvedPromisesData = await AnswerContainer.getByQuestionIdWithTextSolution(question_id, db);
            }

            if (resolvedPromisesData.length < 1) {
                return next({
                    err: {
                        status: 403,
                        message: 'Invalid question id',
                    },
                });
            }
            let videoDuration = resolvedPromisesData[0].duration;
            log_data.subject = resolvedPromisesData[0].subject;
            log_data.chapter = resolvedPromisesData[0].chapter;

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
            if (_.includes(ref_student_id, 'TL')) {
                const tempdata = Utility.whatsappDeeplinkTokenizer(ref_student_id);
                source = tempdata[0];
                parent_id = tempdata[1];
                wha_id = tempdata[2];
            }
            /* if (_.includes(ref_student_id, 'WHA')) {
                const tempdata = Utility.whatsappDeeplinkTokenizer(ref_student_id);
                source = tempdata[0];
                parent_id = tempdata[1];
                wha_id = tempdata[2];
                const q = await MysqlQuestion.getByQuestionIdFromAliased(db.mysql.read, parent_id);
                if (q.length && !q[0].matched_app_questions) {
                    let results;
                    const bookmetaData = await QuestionContainer.getBookMetaData(db, question_id);
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
            if (!_.includes(['COURSE_DETAIL', 'COURSE_RESOURCE', 'COURSE_LANDING', 'LIVE_CLASS_MPVP', 'CHAPTER_SERIES_CAROUSAL'], page)) {
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
                view_from: req.headers.is_video_blocked ? `${page}_BLOCKED` : page,
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
                type = 'answered';
                id = questionWithAnswer.question_id;
            }

            if (!questionWithAnswer.answer_video) {
                logger.error({
                    tag: 'videoApi',
                    source: 'viewAnswerByQuestionId',
                    error: `answer_video is null for ${question_id}`,
                });
            }

            // const answer_video_name = questionWithAnswer.answer_video.split('.')[0];
            hls_url = '';
            let ocr;
            if ((questionWithAnswer.ocr_text.indexOf('<math')) == -1) {
                ocr = questionWithAnswer.ocr_text;
            } else {
                ocr = questionWithAnswer.question;
            }
            // checking youtube video play or default
            questionWithAnswer = Utility.checkYoutubeVideo(Data.yt_student_id, questionWithAnswer);
            questionWithAnswer.ocr_text = questionWithAnswer.ocr_text.replace(/'/g, "\\'");

            // * Get CDN from redis for the current answer id
            const promisetoSettled = await Promise.allSettled([AnswerRedis.getCdnForAnswerId(db.redis.read, questionWithAnswer.answer_id), AnswerContainer.getCommentCountByEntityTypeAndId(db, type, req.body.id), Answer_Container.checkLiveClassVideoByQuestionId(db, { question_id }, version_code, student_id)]);
            const [cdnurl, commentCount, isLiveClassVideo] = promisetoSettled.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
            const isEtoosStudent = Data.et_student_id.includes(questionWithAnswer.student_id);
            data = {
                answer_id: questionWithAnswer.answer_id,
                expert_id: questionWithAnswer.expert_id,
                question_id: questionWithAnswer.question_id,
                student_id: questionWithAnswer.student_id,
                class: questionWithAnswer.class,
                chapter: questionWithAnswer.chapter,
                subject: questionWithAnswer.subject,
                question: questionWithAnswer.question,
                doubt: questionWithAnswer.doubt,
                ocr_text: questionWithAnswer.ocr_text,
                answer_video: (questionWithAnswer.is_vdo_ready == 1) ? hls_url : questionWithAnswer.answer_video,
                // fallback_answer_video: isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video,
                fallback_answer_video: isEtoosStudent ? generateURL(Data.etoos_video_prefix, questionWithAnswer.answer_video) : generateURL(cdnurl, questionWithAnswer.answer_video),
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
                topic_video_text: '',
            };
            if (page === 'NCERT' || page === 'QA_WIDGET_NCERT') {
                const mainPlaylistId = await MysqlQuestion.getPlaylistVideoDetails(db.mysql.read, req.body.id, student_class);
                if (mainPlaylistId.length > 0) {
                    const redisData = `${mainPlaylistId[0].main_playlist_id}_${req.body.id}`;
                    QuestionRedis.setNcertLastWatchedDetails(db.redis.read, `ncert_lv_${student_class}`, student_id, redisData);
                    data.ncert_video_details = {
                        ncert_video_experiment: true,
                        ncert_video_title: `${mainPlaylistId[0].book_name} ${mainPlaylistId[0].chapter_name} ${mainPlaylistId[0].exercise_name}`,
                        ncert_playlist_id: mainPlaylistId[0].main_playlist_id,
                        ncert_playlist_type: 'main',
                    };
                }
            }

            if (page === 'NCERT_NEW_FLOW') {
                const mainPlaylistId = await MysqlQuestion.getNcertNewFlowPlaylistVideoDetails(db.mysql.read, req.body.id, student_class);
                if (mainPlaylistId.length > 0) {
                    const redisData = `${mainPlaylistId[0].book_playlist_id}_${req.body.id}`;
                    QuestionRedis.setNcertLastWatchedDetails(db.redis.read, `ncert_new_flow_lv_${student_class}`, student_id, redisData);
                    data.ncert_video_details = {
                        ncert_video_experiment: true,
                        ncert_video_title: `${mainPlaylistId[0].book_name} ${mainPlaylistId[0].chapter_name} ${mainPlaylistId[0].exercise_name}`,
                        ncert_playlist_id: mainPlaylistId[0].book_playlist_id,
                        ncert_playlist_type: 'main',
                    };
                }
            }

            if (version_code >= 1010) {
                const d0PageList = ['SRP', 'MPVP', 'SIMILAR', 'SUGGESTIONS'];
                if (d0PageList.includes(page)) {
                    const d0UserManager = new D0UserManager(req);
                    if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                        data.hide_bottom_nav = true;
                        if (page !== 'SUGGESTIONS') {
                            data.back_press_bottom_sheet_deeplink = 'doubtnutapp://bottom_sheet_widget?widget_type=video_screen_bottom_sheet&show_close_btn=true';
                        }
                    }
                }
            }

            if (page === 'BOOK_LIST') {
                const { playlist_id: playlistId } = req.body;
                const playlistIdArr = playlistId.split('_');
                const exerciseId = playlistIdArr[playlistIdArr.length - 1];
                const bookListId = playlistIdArr[0];
                const packageId = playlistIdArr.slice(1, -1).join('_');
                const redisData = `${exerciseId}_${req.body.id}_${bookListId}`;
                StudentRedis.setBookFlowData(db.redis.read, `lv_${packageId}`, student_id, redisData);

                const setteledData = await Promise.allSettled([makeData(db, version_code, student_class, student_id, bookListId, '', student_locale, 'SEARCH_SRP'), redis.getNcertBooksLibraryDataNew(db.redis.read, packageId)]);
                const [bookData, chapterCache] = setteledData.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
                if (config.service_switch.library_translation && version_code >= 628) {
                    await LibTranslation.translatePlaylist(db, bookData, student_locale);
                }
                const activeBookData = bookData.list.filter((x) => x.package_details_id === packageId);

                let activeChapName = '';
                let activeExName = '';
                // const chapterCache = await redis.getNcertBooksLibraryDataNew(db.redis.read, packageId);
                if (!_.isNull(chapterCache)) {
                    const chapterCacheData = JSON.parse(chapterCache);
                    if (chapterCacheData.length > 0) {
                        for (let j = 0; j < chapterCacheData.length; j++) {
                            const x = chapterCacheData[j];
                            if (x.flex_list.length > 0) {
                                const activeExItem = x.flex_list.filter((y) => y.id == exerciseId);
                                if (activeExItem.length > 0) {
                                    activeExName = activeExItem[0].name;
                                }
                            }
                            if (activeExName !== '') {
                                activeChapName = x.name;
                                break;
                            }
                        }
                    }
                }

                data.ncert_video_details = {
                    ncert_video_experiment: true,
                    ncert_video_title: `${activeBookData[0].name} ${activeChapName} ${activeExName}`,
                    ncert_playlist_id: `${packageId}_${exerciseId}`,
                    ncert_playlist_type: 'main',
                };
            }

            if (page === 'LIBRARY_BOOK_LIST') {
                let { playlist_id: playlistId } = req.body;
                const playlistIdArr = playlistId.split('__BOOK');
                playlistId = playlistIdArr[0];
                const currentVideoResponse = await libraryMysql.getLibraryBookDetailsByQid(db.mysql.read, req.body.id);
                if (currentVideoResponse.length > 0) {
                    const bookPlaylistId = playlistId;
                    const chapterPlaylistId = currentVideoResponse[0].chapter_playlist_id;
                    const exercisePlaylistId = currentVideoResponse[0].exercise_playlist_id;

                    let playlistDetailsByIds = [];
                    const idArr = [bookPlaylistId, chapterPlaylistId, exercisePlaylistId];
                    if (user_locale == 'hi') {
                        playlistDetailsByIds = await libraryMysql.getPlaylistTranslationDetailsByids(db.mysql.read, idArr);
                    } else {
                        playlistDetailsByIds = await libraryMysql.getPlaylistDetailsByids(db.mysql.read, idArr);
                    }

                    let titleText = '';
                    if (playlistDetailsByIds.length > 0) {
                        const bookNameDetails = playlistDetailsByIds.filter((x) => x.id == bookPlaylistId);
                        const chapterNameDetails = playlistDetailsByIds.filter((x) => x.id == chapterPlaylistId);
                        const exerciseNameDetails = playlistDetailsByIds.filter((x) => x.id == exercisePlaylistId);

                        let bookName = '';
                        let chapterName = '';
                        let exerciseName = '';
                        if (bookNameDetails.length > 0) {
                            bookName = bookNameDetails[0].name;
                        }
                        if (chapterNameDetails.length > 0) {
                            chapterName = chapterNameDetails[0].name;
                        }
                        if (exerciseNameDetails.length > 0) {
                            exerciseName = exerciseNameDetails[0].name;
                        }

                        titleText = `${bookName} ${chapterName} ${exerciseName}`;
                    }
                    const redisData = req.body.id;
                    QuestionRedis.setNcertLastWatchedDetails(db.redis.read, `library_book_lv_${playlistId}`, student_id, redisData);

                    data.ncert_video_details = {
                        ncert_video_experiment: true,
                        ncert_video_title: titleText,
                        ncert_playlist_id: `${playlistId}__BOOK`,
                        ncert_playlist_type: 'main',
                    };
                }
            }

            data.comment_count = commentCount;
            if (appCountry === 'IN' && Data.ncertStudentIds.includes(+(questionWithAnswer.student_id))) {
                HomepageContainer.storeActivityDetails(db.redis, student_id, 'ncert_video_watch');
                data.is_ncert = true;
            }

            if ((page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') && version_code > 873) {
                let isShow = false;
                if (version_code >= 877 && isFilter) {
                    isShow = true;
                }
                if (isShow && !Data.blacklisted_displayNames.includes(data.chapter)) {
                    data.is_filter = true;
                    // data.new_tag_list = await bl.newTagListMaker(db, data, req.user.student_class);
                    // const doubtArr = data.doubt.split('_');
                    // let qno = doubtArr[doubtArr.length - 1];
                    // if (qno.includes('0', 0)) {
                    //     qno = qno.substring(1);
                    // }
                    if (!_.isEmpty(data.doubt) && !_.isNull(data.doubt)) {
                        const label = AnswerHelper.labelMaker(data.doubt);
                        if (label != '') {
                            data.question_tag = label;
                        }
                    }
                }
            }

            if (appCountry === 'US') {
                // data.thumbnail_image = `${config.staticCDN}q-thumbnail-localized/${questionWithAnswer.question_id}/english.png`;
                data.thumbnail_image = `${config.cdn_url}question-thumbnail/en_${questionWithAnswer.question_id}.png`;
                data.exam = await Answer_Container.getUsExamData(db, questionWithAnswer.question_id);
            }
            if (tablist.length > 0) {
                data.tab_list = tablist;
            }
            data.video_page_iteration = videoPagePattern;
            if (appCountry === 'IN') {
                data = await Answer_Container.checkEVideos(db, data, questionWithAnswer, student_id);
            }
            if (_.includes(['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'TS_VOD', 'LIVECLASS_RESOURCE', 'LIVECLASS_ALERT', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP', 'PAID_CONTENT_FEED', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP'], page)) {
                StudentRedis.setLiveclassWatchCounter(db.redis.write, student_id);
            }

            data.fallback_answer_video = isEtoosStudent ? generateURL(Data.etoos_video_prefix, questionWithAnswer.answer_video) : generateURL(cdnurl, questionWithAnswer.answer_video);

            if (appCountry === 'IN') {
                data = await Answer_Container.checkLiveClassVideos(db, data, { question_id }, student_id, version_code, student_class, isLiveClassVideo, page, flgrResp, isBrowser);
            }
            let liveclassStreamDetails = [];
            let isLFContent = false;
            const batchId = data.batch_id;
            if (version_code >= LiveclassData.socketAppVersion) {
                liveclassStreamDetails = await CourseContainer.getLiveStreamDetailsByQuestionID(db, question_id);
                isLFContent = !!(liveclassStreamDetails.length && liveclassStreamDetails[0].course_resource_id);
                liveclassStreamDetails = liveclassStreamDetails.filter((item) => item.batch_id == batchId);
                if (liveclassStreamDetails.length > 1) {
                    const obj = await CourseHelper.getliveClassForUserCourse(db, liveclassStreamDetails, data.userPackages, student_class);
                    if (!_.isEmpty(obj)) {
                        liveclassStreamDetails = [obj];
                    }
                    if (data.userPackages) {
                        delete data.userPackages;
                    }
                }
            } else {
                liveclassStreamDetails = await Liveclass.getLivestreamDetails(db.mysql.read, question_id);
            }
            if (liveclassStreamDetails.length) data.detail_id = liveclassStreamDetails[0].detail_id;
            if (appCountry === 'US') {
                const video_count = (await VideoView.getVideoCountByStudent(db.mysql.read, student_id))[0].view_count;
                if (version_code < 840 || !!(await Package.getStudentActivePackageDoubtLimit(db.mysql.read, student_id, moment.add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD'))).length) {
                    data.is_vip = true;
                } else if (video_count > 5 && video_count % 5 == 0) {
                    data.is_vip = false;
                } else {
                    data.is_vip = true;
                }
                data.is_premium = true;

                data.payment_deeplink = 'doubtnutapp://billing_info';
            }
            // MATCHES VIDEO CASE
            // parent_id = asked question id
            // question_id = solution question id
            // Matched question handling
            if (page === 'SUGGESTIONS') {
                const lastAskedQuestion = await MysqlQuestion.getUserRecentAskedQuestionsForSuggestions(db.mysql.read, req.user.student_id, 1);
                if (!_.isEmpty(lastAskedQuestion) && lastAskedQuestion[0] != undefined && lastAskedQuestion[0].question_id != undefined && lastAskedQuestion[0].question_id != null) {
                    // MysqlQuestion.updateMatchedAliasTable(lastAskedQuestion[0].question_id, db.mysql.write);
                }
            }
            if (parent_id != 0) {
                // setTimeout(Utility.sendMessage, 3000, sqs, config.elasticsearch_sqs, event);
                // QuestionHelper.sendSnsMessage({
                //     type: 'matched-question',
                //     sns,
                //     qid: parent_id,
                //     UtilityModule: Utility,
                //     matchedQuestionSnsUrl,
                //     config,
                // });
                const parentQuestion = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, parent_id);
                if (parentQuestion && parentQuestion.length) {
                    console.log(`Search version: ${parentQuestion[0].question}`);
                }
                // update matched
                // await MysqlQuestion.updateMatchedAliasTable(parent_id, db.mysql.write);
                const student_matched_counter_results = await StudentRedis.getDailyUserMatchedQuestionsCounter(db.redis.read, student_id);
                if (_.isNull(student_matched_counter_results)) {
                    const expiry = Utility.getExpiration('tomorrow');
                    StudentRedis.setDailyUserMatchedQuestionsCounter(db.redis.write, student_id, expiry);
                } else {
                    StudentRedis.incrementMatchedQuestionCountByUser(db.redis.write, student_id);
                }
            }

            let viewID = '1';
            // dash video check
            data = Answer_Container.dashHandling(data, questionWithAnswer, config);
            // TODO: call flagr collectively
            let offsetEnabled = false;
            if (typeof flgrResp !== 'undefined' && typeof flgrResp.video_offset !== 'undefined' && typeof flgrResp.video_offset.payload !== 'undefined') {
                offsetEnabled = flgrResp.video_offset.payload.enabled;
            }
            const morePromiseToSettle = await Promise.allSettled([AppConfigurationContainer.getConfigByKey(db, 'video_view_stats'), Answer_Container.getAnswerVideoResource(db, config, questionWithAnswer.answer_id, questionWithAnswer.question_id, supportedMediaList, version_code, offsetEnabled)]);
            // eslint-disable-next-line prefer-const
            let [videoViewCheck, videoResource = []] = morePromiseToSettle.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
            data.download_url = null;
            // if (!_.isNull(videoResource) && videoResource.length > 0 && videoResource[0].resource_type === 'BLOB') {
            //     data.download_url = videoResource[0].resource;
            // }
            // if (typeof data.is_downloadable !== 'undefined') {
            //     data.download_url = isEtoosStudent ? Data.etoos_video_prefix + questionWithAnswer.answer_video : cdn_url + questionWithAnswer.answer_video;
            // }
            videoResource = (!_.isNull(videoResource) && videoResource.length > 0) ? videoResource.filter((x) => !_.isEmpty(x)) : Answer_Container.getDefaultVideoResource(config, questionWithAnswer, version_code);
            if (videoResource.length > 0 && appCountry === 'US') {
                const videoList = await Answer_Container.getOneMinVideoLink(db, questionWithAnswer, videoResource);
                if (videoList.length > 0) {
                    videoResource = videoList;
                }
            }

            data.video_resources = videoResource || [];
            changeVideoResource(data.video_resources); // change cdn url based on conviva precision api

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
                inactiveViewData.view_from = req.headers.is_video_blocked ? `${page}_BLOCKED` : page;
                promises.push(Liveclass.insertInactiveAnswerView(db.mysql.write, inactiveViewData));
            } else {
                if (StudentHelper.isAltApp(req.headers.package_name)) {
                    // we are adding alt app name, only the next part of com.doubtnut, after page name
                    viewData.source = req.headers.package_name.split('.').slice(2).join('_');
                }
                if (data.video_resources && data.video_resources.length > 0) {
                    viewData.answer_video = data.video_resources[0].resource;
                }
                if (!viewData.answer_id) {
                    viewData.answer_id = 0;
                }
                promises.push(VideoView.insertAnswerView(viewData, db.mysql.write));
            }
            promises.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentNew(student_id, questionWithAnswer.answer_id, questionWithAnswer.answer_video, db));
            promises.push(PlaylistContainer.getPlaylistCheck(questionWithAnswer.question_id, student_id, db));
            // promises.push(QuestionsMetaContainer.getQuestionMetaWithMcText(questionWithAnswer.question_id, db));
            promises.push([]);
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
            if (resolvedPromisesData[3] && resolvedPromisesData[3].length) {
                data.question_meta = resolvedPromisesData[3][0];
            }
            if (resolvedPromisesData[0] && resolvedPromisesData[0].insertId) {
                viewData.uuid = resolvedPromisesData[0].insertId;
                viewData.created_at = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
                viewData.action = Data.ask_vvs.insert_view;
                // kafka.publish(kafka.topics.askVvs, student_id, viewData);
                data.view_id = resolvedPromisesData[0].insertId;
                viewData.view_id = resolvedPromisesData[0].insertId;
            } else {
                data.view_id = viewID;
                viewData.view_id = viewID;
            }
            if (page === 'SRP' && data.view_id) {
                StudentRedis.setLastSrpQidAnsId(db.redis.write, req.user.student_id, data.view_id);
            }
            // GOOGLE BOT
            if (student_id != 588226) {
                // Notification.videoCountNotifications(student_id, req.user.gcm_reg_id, questionWithAnswer.question_id, config, admin, db);
            }

            // let temp=await Question.getMcIdbyQidForMicroConcept(student_class,question_id,db.mysql.read)
            // let playlistData;
            // if (questionWithAnswer && questionWithAnswer.doubt && questionWithAnswer.student_id == 99) {
            //     playlistData = await mysqlMicroconcept.getPlaylistIdData(questionWithAnswer.doubt, db.mysql.read);
            // }
            promises = [];
            promises.push(AnswerContainer.getLikeDislikeStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getWhatsappShareStats(resolvedPromisesData[4][0][0].total_count, questionWithAnswer.question_id, db));
            promises.push(AnswerContainer.getAnswerTitleAndDescription2(data, db));
            promises.push(TeacherMysql.checkRecourceIsTeacherVideo(db.mysql.read, questionWithAnswer.question_id.toString()));
            promises.push(QuestionContainer.getVideoType(db, req.body.id));
            promises.push(StudentRedis.getVideoViewByStudentId(db.redis.read, student_id));
            // promises.push(CourseContainer.getvideoViewExperiment(db));
            promises.push(StudentRedis.getVideoViewEngagetimeByStudentId(db.redis.read, student_id));
            promises.push(isQuestionIDInTopFreeClasses(questionWithAnswer.question_id));
            promises.push(isStudyGroupEnabled(req));
            promises.push(StudentHelper.getGoogleAdsInfo({
                db, studentId: req.user.student_id, page: 'VIDEO', stClass: student_class, ocrText: questionWithAnswer.ocr_text, questionId: questionWithAnswer.question_id, ccmData: req.user.ccm_data,
            }));

            // if (playlistData && playlistData.length > 0 && playlistData[0].description == 'CONCEPT_VIDEOS' && page == 'LIBRARY' && page === 'HOME_FEED_CHANNELS' && page === 'NCERT' && page === 'QA_WIDGET_NCERT') {
            //     promises.push(Answer_Container.getNextMicroConcept(questionWithAnswer.doubt, playlistData[0].student_class, playlistData[0].student_course, data, db));
            // }
            const [likedislikeCount, shareCount, descrip, checkTeacherVideo, videoType, userVideoWatchCount, videoViewEngagementCounterTemp, isQuestionIDPresentInTopFreeClasses, { isGroupExist }, googleAdsData] = await Promise.all(promises);
            data.adTagResource = googleAdsData;
            if (!_.isEmpty(checkTeacherVideo)) {
                const [likes, dislikes, shareCountTeacher] = await Promise.all([TeacherContainer.getTeacherVideoLikeStats(db, questionWithAnswer.question_id), TeacherContainer.getTeacherVideoDislikeStats(db, questionWithAnswer.question_id), TeacherContainer.getTeacherVideoShareStats(db, questionWithAnswer.question_id)]);
                data.likes_count = likes;
                data.dislikes_count = dislikes;
                data.share_count = shareCountTeacher;
            } else {
                data.likes_count = likedislikeCount[0];
                data.dislikes_count = likedislikeCount[1];
                data.share_count = shareCount[0];
            }

            if (descrip.length > 0) {
                data.weburl = descrip;
            } else {
                data.weburl = '';
            }
            data.title = ocr;
            data.description = ocr;
            if (version_code >= 636 && version_code <= Data.etoos_version) {
                let structured_course_id;
                let subject;
                if (resolvedPromisesData[6] !== undefined && resolvedPromisesData[6].length !== 0) {
                    structured_course_id = resolvedPromisesData[6][0].structured_course_id;
                    subject = resolvedPromisesData[6][0].subject;
                    const courseId = await StructuredCourse.getCourseIdByQuestionId(req.body.id, structured_course_id, subject, student_class, db.mysql.read);
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
            if (page == 'LIBRARY' || page == 'SRP' || page == 'HOME_FEED_CHANNELS' || page === 'NCERT' || page === 'BOOK_LIST' || page === 'LIBRARY_BOOK_LIST' || page === 'QA_WIDGET_NCERT') {
                const personalisation_data = await QuestionContainer.getQuestionPersonalisationData(db, questionWithAnswer.question_id);
                // const matchedQidArray = await QuestionMatches.get();
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
                            .then((res2) => {
                                console.log(res2);
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
                        studentPersonalisation.setStudentSubjectPrefrence(
                            db.redis.write,
                            student_id,
                            pref_obj,
                        );
                    }
                }
            }
            let isLive = false;
            const timeshiftUrl = Utility.getTimeshiftUrl(config.liveclass.vodDomain, config.liveclass.appName, questionWithAnswer.question_id);
            // LIVE STREAM PART
            if (_.includes(liveclassPages, page)) {
                // check  stream status
                data.is_rtmp = false;
                let state = 2;
                if (!_.isEmpty(liveclassStreamDetails)) {
                    state = await LiveclassHelper.getStatus(db, liveclassStreamDetails, version_code);
                    liveclassStreamDetails[0].state = state;
                }
                data.state = state;
                let quizDetails = [];
                if (version_code >= LiveclassData.socketAppVersion) {
                    quizDetails = await CourseV2Mysql.getRecentQuizReference(db.mysql.read, question_id);
                } else {
                    quizDetails = await Liveclass.getRecentQuizReference(db.mysql.read, question_id);
                }

                if (version_code >= LiveclassData.socketAppVersion) {
                    if (liveclassStreamDetails.length > 0 && _.isNull(liveclassStreamDetails[0].stream_end_time) && liveclassStreamDetails[0].stream_status === 'ACTIVE' && liveclassStreamDetails[0].resource_type === 4) {
                        // data.state = 1;
                        data.is_rtmp = true;
                        isLive = true;
                        const streamName = `${questionWithAnswer.question_id}_H264xait`;
                        const streamName2 = `${questionWithAnswer.question_id}_480`;
                        const streamName3 = `${questionWithAnswer.question_id}_720`;
                        const url = `http://live.doubtnut.com/live/${streamName}.flv`;
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
                                url: `http://live.doubtnut.com/live/${streamName2}.flv`,
                            },
                            {
                                display: '720',
                                url: `http://live.doubtnut.com/live/${streamName3}.flv`,
                            },
                        ];
                        data.playback_url_list = playbackUrlList;
                        data.timeshift_url = timeshiftUrl;
                    }
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
                            is_live: isLive,
                            // created_at: moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
                        });
                        // Condition - check if live class is free and the user has not landed to live class page from study group
                        if (!_.isEmpty(isLiveClassVideo) && isLiveClassVideo[0].is_free && liveclassStreamDetails.length && page !== 'STUDYGROUP') {
                            // this function call is sending messages and notification of live class in study group of the user.
                            const streamObj = _.orderBy(liveclassStreamDetails, ['live_at'], ['desc']);
                            bl.liveClassStudyGroupMessage(db, req, streamObj[0], questionWithAnswer.duration);
                        }
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
                }

                if (quizDetails.length > 0) {
                    if (version_code >= LiveclassData.socketAppVersion) {
                        data.quiz_resource_id = quizDetails[0].quiz_resource_id;
                    } else {
                        data.quiz_resource_id = quizDetails[0].resource_detail_id;
                    }
                }
                data.firebase_path = 'live_class_test';
                if (liveclassStreamDetails.length > 0 && liveclassStreamDetails[0].resource_type === 4) {
                    if (version_code >= LiveclassData.socketAppVersion) {
                        data.start_time = moment(liveclassStreamDetails[0].stream_start_time).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
                    } else {
                        data.start_time = moment(liveclassStreamDetails[0].start_time).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
                    }
                }
            }

            data.bottom_view = ([0, 1].includes(data.state) && (!isFreeApp)) ? 'LIVE_CLASS' : 'SIMILAR';
            if (version_code >= 837) {
                data.bottom_view = (((_.includes(['LIVECLASS', 'LIVECLASS_NOTIFICATION', 'HOME_FEED_LIVE', 'TS_VOD', 'LIVECLASS_RESOURCE', 'LIVECLASS_ALERT', 'COURSE_DETAIL', 'COURSE_LANDING', 'COURSE_RESOURCE', 'LIVE_CLASS_MPVP', 'CHAPTER_SERIES_CAROUSAL', 'PAID_CONTENT_FEED', 'MPVP_CLASSES_CAROUSEL', 'MATCH_PAGE_RELATED_CLASSES', 'SRP_WIDGET_LIVE', 'LIVE_CLASS_ALL_HP', 'LIVE_CLASS_HP'], page)) || (questionWithAnswer.student_id == -142)) && (!isFreeApp)) ? 'LIVE_CLASS' : 'SIMILAR';
            }
            data.connect_socket = isLive;
            data.connect_firebase = isLive;
            data.show_replay_quiz = !isLive;
            data.block_screenshot = false;
            if (_.includes(liveclassPages, page) || (videoType === 'LF' && !Data.ncertPages.includes(page)) || req.headers.is_video_blocked) {
                data.bottom_view = 'LIVE_CLASS';
                data.show_replay_quiz = true;
                data.block_screenshot = true;
            }
            const { playlist_id: teacherPlaylist } = req.body;
            if (teacherPlaylist === 'TEACHER_CHANNEL') {
                data.bottom_view = 'SIMILAR';
            }
            data.bottom_view = ((!isLFContent && data.bottom_view === 'LIVE_CLASS') || isFreeApp) ? 'SIMILAR' : data.bottom_view;
            // block forwarding handling
            data.block_forwarding = AnswerHelper.blockForwardingHandler(liveclassStreamDetails, questionWithAnswer);
            // handle offset
            data = AnswerHelper.offsetHandler({ data, liveclassStreamDetails, questionWithAnswer });
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

            if (((page != 'LIVECLASS' || page != 'HOME_FEED_LIVE' || page != 'MPVP_CLASSES_CAROUSEL' || page != 'MATCH_PAGE_RELATED_CLASSES' || page != 'SRP_WIDGET_LIVE') && page != 'HOME_FEED' && version_code > 754) || (appCountry === 'US')) {
                // data.avg_view_time = avarageViewtime;
                data.min_watch_time = 0;
            }

            if (questionWithAnswer.student_id === -20) {
                const comments = await Answer_Container.commentWindow(db, questionWithAnswer.question_id, questionWithAnswer.duration);
                const currTime = moment().add(5, 'h').add(30, 'minutes').unix() * 1000;
                if (comments.start) {
                    data.comments = comments;
                    if (currTime > comments.start && currTime < comments.end) data.auto_play = false;
                }
            }
            data.moe_event = {
                video_locale: await Answer_Container.getLocale(db, data.student_id, req.user.locale),
            };

            log_data.video_locale = data.moe_event.video_locale;
            log_data.video_language = Data.langNameByCode[data.moe_event.video_locale.toLowerCase()];

            log_data.type_of_content = videoType;
            data.log_data = log_data;
            // const [userVideoWatchCount, videoExperiment] = await Promise.all([StudentRedis.getVideoViewByStudentId(db.redis.read, student_id), CourseContainer.getvideoViewExperiment(db)]);
            // const videoExperiment = tempPromiseData[6];

            let watchCount;
            if (userVideoWatchCount === null) {
                watchCount = 0;
            } else {
                watchCount = +(userVideoWatchCount);
            }
            let arr = [1, 0];
            let playAdNonSrp = false;
            const playAdSrp = true;
            let variant = 1;
            let qidExperiment = 0;
            if (typeof flgrResp !== 'undefined' && typeof flgrResp.ads_combined_experiment !== 'undefined' && flgrResp.ads_combined_experiment.payload) {
                if (flgrResp.ads_combined_experiment.payload.non_srp_enabled) {
                    playAdNonSrp = true;
                }
                if (_.isArray(flgrResp.ads_combined_experiment.payload.array)) {
                    arr = flgrResp.ads_combined_experiment.payload.array;
                }
                if (flgrResp.ads_combined_experiment.payload.rotation_variant) {
                    variant = flgrResp.ads_combined_experiment.payload.rotation_variant;
                }
                if (flgrResp.ads_combined_experiment.payload.qid_experiment) {
                    qidExperiment = flgrResp.ads_combined_experiment.payload.qid_experiment;
                }
            }
            let matchCount = watchCount % arr.length;
            const videoViewExperiment = 1;
            let useVideoView = true;
            const videoViewEngagementCounter = +(videoViewEngagementCounterTemp);
            let repeatedVideoArray = false;
            if (matchCount === 0 && arr[arr.length - 1] === 0 && videoViewEngagementCounter < 3) {
                matchCount = arr.length - 1;
                repeatedVideoArray = true;
            } else if (arr[matchCount - 1] === 0 && videoViewEngagementCounter < 3) {
                matchCount -= 1;
                repeatedVideoArray = true;
            }
            // let lastAdWatched = await CourseV2Mysql.getStudentLastAdWatchedToday(db.mysql.read, student_id);
            let adId;
            const repeatAd = false;
            if (variant === 1) {
                adId = await StudentRedis.getAdIdForStudentDaily(db.redis.read, student_id);
            } else if (variant === 2) {
                adId = await StudentRedis.getAdIdForStudentThree(db.redis.read, student_id);
            } else if (variant === 3) {
                adId = await StudentRedis.getAdIdForStudentWeekly(db.redis.read, student_id);
            }
            // if (lastAdWatched && lastAdWatched.length) {
            //     lastAdWatched = lastAdWatched.filter(Boolean);
            // }
            // if (adId && lastAdWatched && lastAdWatched.length && lastAdWatched[0] && +adId !== lastAdWatched[0].ad_id && page !== 'SIMILAR') {
            //     if (matchCount === 0 && arr[arr.length - 1] === 1) {
            //         matchCount = arr.length - 1;
            //         repeatAd = true;
            //     } else if (arr[matchCount - 1] === 1) {
            //         matchCount -= 1;
            //         repeatAd = true;
            //     }
            // }
            StudentRedis.deleteVideoViewEngagetimeByStudentId(db.redis.write, student_id);
            if (videoViewExperiment === 1 && arr[matchCount] === 0) {
                useVideoView = false;
            }
            let slow_ad = false;
            if (typeof is_connection_slow !== 'undefined' && is_connection_slow === true) {
                slow_ad = true;
            }
            let is_youtube = false;
            if (typeof data.video_resources[0] !== 'undefined' && !_.isNull(data.video_resources[0])) {
                is_youtube = data.video_resources[0].media_type === 'YOUTUBE';
            }
            if (version_code > 835 && version_code <= 1031 && !(questionWithAnswer.is_answered === 0 && questionWithAnswer.is_text_answered === 1) && data.bottom_view != 'LIVE_CLASS' && useVideoView && ((page === 'SRP' && playAdSrp) || (page !== 'SRP' && playAdNonSrp)) && !(slow_ad) && !(is_youtube) && !isFreeApp) {
                const [dailyLimit, studentAdsWatched] = await Promise.all([CourseContainer.getDailyAdsLimit(db), CourseV2Mysql.getStudentAdsWatchedToday(db.mysql.read, student_id)]);
                if (+(dailyLimit[0].key_value) > studentAdsWatched[0].watch_count) {
                    let adData;
                    if (qidExperiment) {
                        adData = await AnswerHelper.getAdsToShowQid({
                            db,
                            questionWithAnswer,
                            studentId: student_id,
                            studentClass: student_class,
                            locale: user_locale,
                            config,
                            time: timestamp,
                            versionCode: version_code,
                            isDropper,
                        });
                    } else {
                        adData = await AnswerHelper.getAdsToShow({
                            db,
                            questionWithAnswer,
                            studentId: student_id,
                            studentClass: student_class,
                            locale: user_locale,
                            config,
                            xAuthToken,
                            time: timestamp,
                            versionCode: version_code,
                            isDropper,
                            variant,
                            adId,
                            // lastAdWatched,
                            page,
                            videoPageFlagrResponse: flgrResp,
                            qidExperiment,
                            pznElasticSearchInstance,
                        });
                    }
                    data.ad_data = adData;
                    if (typeof data.ad_data !== 'undefined' && !_.isNull(data.ad_data) && version_code > 853) {
                        const isLF = 0;
                        CourseV2Mysql.addCourseAdsViewStats(db.mysql.write, adData.uuid, adData.ad_id, student_id, isLF);
                    }
                }
            } else if (version_code > 903 && version_code <= 1031 && !(questionWithAnswer.is_answered === 0 && questionWithAnswer.is_text_answered === 1) && data.bottom_view == 'LIVE_CLASS' && !(slow_ad) && !(is_youtube) && (!isFreeApp)) {
                const [dailyLimit, studentAdsWatched] = await Promise.all([CourseContainer.getDailyAdsLimit(db), CourseV2Mysql.getStudentAdsWatchedTodayLF(db.mysql.read, student_id)]);
                if (+(dailyLimit[0].key_value) > studentAdsWatched[0].watch_count) {
                    const adData = await AnswerHelper.getAdsToShowLF({
                        db,
                        questionWithAnswer,
                        studentId: student_id,
                        studentClass: student_class,
                        locale: user_locale,
                        config,
                        xAuthToken,
                        versionCode: version_code,
                        isDropper,
                    });
                    data.ad_data = adData;
                    if (typeof data.ad_data !== 'undefined' && !_.isNull(data.ad_data) && version_code > 853) {
                        CourseV2Mysql.addCourseAdsViewStatsLF(db.mysql.write, adData.uuid, adData.ad_id, student_id);
                    }
                }
            }
            if (pdfBannerData != '') {
                data.pdfBannerData = pdfBannerData;
            }
            if (isQuestionIDPresentInTopFreeClasses && (page === 'TOP_FREE_CLASSES' || page === 'SIMILAR')) {
                data.is_premium = false;
                data.premium_video_offfset = null;
            }
            let shareMessage = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge : ';
            if (videoType === 'LF') {
                shareMessage = global.t8[user_locale].t('*{{ocr_text}}*\nDoubtnut par {{subject}} ki is class mein maza aa gaya! Tum bhi dekho aur karo apne exam ki taiyaari 🙂', { ocr_text: data.ocr_text.trim(), subject: data.subject });
            }
            if (appCountry === 'US') {
                shareMessage = 'Improve your SAT or ACT Score with Math, Science and solved Practice Tests Video Solutions only on Doubtnut!!';
            }
            data.share_message = shareMessage;
            data.use_fallback_webview = !!((data.video_resources.length > 0 && data.video_resources[0].media_type !== 'RTMP' && videoType === 'LF'));
            // if (data.bottom_view === 'LIVE_CLASS') {
            //     data.premium_video_offfset = null;
            // }
            if (resource_type == 'text') {
                const feedbackInMongo = await StudentMongo.getTextSolutionFeedback(req.user.student_id, req.body.id, db.mongo.write);
                if (feedbackInMongo.length == 0) {
                    data.banner_data = {
                        image: `${config.staticCDN}${Data.textSolutionBanner(user_locale).imageLink}`,
                        text: Data.textSolutionBanner(user_locale).mainText,
                        cta_text: Data.textSolutionBanner(user_locale).buttonText,
                        cta_clicked_image: `${config.staticCDN}${Data.textSolutionBanner(user_locale).successImageLink}`,
                        cta_clicked_text: Data.textSolutionBanner(user_locale).successText,
                    };
                }
            }
            const analytics = {
                variant_info: [],
            };
            // * If page is SRP or MPVP_BOTTOM_SHEET get the popular course carousel
            if ((page === 'SRP' || page === 'MPVP_BOTTOM_SHEET') && _.get(flgrResp, 'suggested_courses_for_you.payload.placement', null) === 'video_page') {
                let showCurrentFlow = true;
                if (version_code >= 959) {
                    showCurrentFlow = false;
                }
                if (showCurrentFlow) {
                    let userActivePackages = await CourseContainer.getUserActivePackages(db, student_id);
                    userActivePackages = userActivePackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.class === +student_class && item.amount !== -1);
                    if (!userActivePackages.length && version_code >= 927) {
                        const popularCourseCarousel = await AnswerHelper.getPopularCoursesCarousel({
                            db,
                            studentId: student_id,
                            studentClass: student_class,
                            versionCode: version_code,
                            studentLocale: student_locale,
                            config,
                            xAuthToken,
                            page,
                            eventPage: page,
                            pznElasticSearchInstance,
                            hitFlagr: false,
                            prevFlagrResponse: flgrResp,
                        });
                        const popularCourseItems = _.get(popularCourseCarousel, 'popularCourseWidget.widget_data.data.items', null);
                        const widgetPlacement = _.get(popularCourseCarousel, 'widget_placement', null);
                        if (popularCourseItems && popularCourseItems.length && widgetPlacement === 'video_page') {
                            data.widget_popular_course = {
                                delay_in_sec: Data.popular_courses_carousel.delay_in_sec,
                                data: popularCourseCarousel.popularCourseWidget.widget_data.data,
                                extra_params: popularCourseCarousel.popularCourseWidget.widget_data.extra_params,
                            };
                            analytics.variant_info.push(...popularCourseCarousel.variantInfo);
                        }
                    }
                } else if (!showCurrentFlow) {
                    StudentRedis.updateMpvpKeyCount(db.redis.read, 'mpvp_visit_count', student_id, 1);
                }
            }

            // refer and earn widget
            /* if (page === 'SRP' && req.headers.version_code >= 1000) {
                if (req.headers.version_code <= 1009) {
                    if (!_.isNull(req.headers.flagr_variation_ids) && !_.isEmpty(req.headers.flagr_variation_ids)) {
                        const flagVariantsArray = req.headers.flagr_variation_ids.split(',');
                        if (flagVariantsArray.includes('1716')) {
                            const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(student_id);
                            if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                                data.show_refer_and_earn_button = true;
                            }
                        }
                    }
                } else  {
                    if (req.headers.d0_qa_count >= 5) {
                        data.show_refer_and_earn_button = true;
                    } else {
                        const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(student_id);
                        if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                            data.show_refer_and_earn_button = true;
                        }
                    }
                }
            } */

            if (typeof data.ad_data !== 'undefined' && !_.isNull(data.ad_data)) {
                if (data.ad_data.cta_flag) {
                    analytics.variant_info.push({
                        flag_name: data.ad_data.cta_flag,
                        variant_id: data.ad_data.variant_id_cta,
                    });
                    delete data.ad_data.cta_flag;
                    delete data.ad_data.variant_id_cta;
                }
            }
            if (typeof data.ad_data !== 'undefined' && !_.isNull(data.ad_data) && typeof data.ad_data.targetPageRenewalFlagr !== 'undefined') {
                const { flagrName: flagName, flagrVariantId } = data.ad_data.targetPageRenewalFlagr;
                analytics.variant_info.push({
                    flag_name: flagName,
                    variant_id: flagrVariantId,
                });
                delete data.ad_data.targetPageRenewalFlagr;
            }
            if (typeof flgrResp !== 'undefined' && typeof flgrResp.ads_combined_experiment !== 'undefined' && typeof flgrResp.ads_combined_experiment.variantId !== 'undefined') {
                analytics.variant_info.push({
                    flag_name: 'ads_combined_experiment',
                    variant_id: flgrResp.ads_combined_experiment.variantId,
                });
            }
            if (analytics.variant_info.length > 0) {
                meta.analytics = analytics;
            }
            if (_.get(videoResource, '[0].resource', '').includes('vod2.myqcloud')) {
                _.set(meta, 'analytics.events', [{
                    params: {
                        student_id,
                        question_id: req.body.id,
                        page: req.body.page,
                    },
                    platforms: ['apxor'],
                    name: 'tencent_vod_play',
                }]);
            }
            if (page === 'NCERT' || page === 'BOOK_LIST' || page === 'LIBRARY_BOOK_LIST' || page === 'QA_WIDGET_NCERT') {
                if (!(_.get(flgrResp, 'ads_combined_experiment.payload.ncert'))) {
                    delete data.ad_data;
                }
                delete data.tags_list;
            }
            if (((page === 'SRP' && playAdSrp) || (page !== 'SRP' && playAdNonSrp)) && !(questionWithAnswer.is_answered === 0 && questionWithAnswer.is_text_answered === 1) && version_code > 835 && data.bottom_view != 'LIVE_CLASS' && !(is_youtube) && !(slow_ad) && !(repeatedVideoArray) && !(repeatAd)) {
                if (userVideoWatchCount === null) {
                    StudentRedis.setVideoViewByStudentId(db.redis.write, student_id);
                } else {
                    StudentRedis.incrVideoViewByStudentId(db.redis.write, student_id);
                }
            }
            data.is_study_group_member = isGroupExist;
            QuestionHelper.storeInUserRecentlyWatched(db, student_id, questionWithAnswer);
            data.event_video_type = videoType === 'SF' ? 'video_watched_SF' : `${data.is_premium ? 'video_watched_paid_LF' : 'video_watched_free_LF'}`;

            const { is_premium, is_vip } = data;
            if (is_premium && is_vip) {
                delete data.premium_video_offfset;
            }

            if (videoQualityOptionShow && !_.includes(Data.ncertPages, page) && data.video_resources && data.video_resources.length > 0) {
                data.video_resources = Answer_Container.addVideoQualityOptionsList(config.staticCDN, data.video_resources, liveclassPages, page);
            }

            return next({ meta, data });
            // const data1 = {
            //     action: 'VIDEO_VIEW_FROM_APP',
            //     data: viewData,
            //     uuid: uuidv4(),
            //     timestamp: Utility.getCurrentTimeInIST(),
            // };
            // Utility.logEntry(sns, config.video_view_sns, data1);
        }
        return next({
            err: {
                status: 404,
                message: 'Invalid page',
            },
        });
    } catch (err) {
        // const data1 = {
        //     action: 'VIDEO_VIEW_FROM_APP',
        //     data: viewData,
        //     uuid: uuidv4(),
        //     timestamp: Utility.getCurrentTimeInIST(),
        // };
        // Utility.logEntry(sns, config.video_view_sns, data1);
        next({ err });
    }
}

module.exports = {
    viewAnswerByQuestionId,
};
