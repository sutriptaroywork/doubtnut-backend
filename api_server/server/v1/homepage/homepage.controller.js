const _ = require('lodash');
const querystring = require('querystring');

const AnswerContainer = require('../../../modules/containers/answer');
const HomepageContainer = require('../../../modules/containers/homepage');
const QuestionContainer = require('../../../modules/containers/question');
const Utility = require('../../../modules/utility');
const StudentContainer = require('../../../modules/containers/student');
const HomepageHelper = require('./homepage.helper');
const GoogleAppRatingUserContainer = require('../../../modules/containers/googleAppRating');
const StudentRedis = require('../../../modules/redis/student');
const StaticData = require('../../../data/data');
const UtilityFlagr = require('../../../modules/Utility.flagr');
const { getGamesDataForNudge, getLiveDataForNudge } = require('./homeScreen.nudge.helper');
const LibraryHelper = require('../../v7/library/library.helper');
const QuestionMysql = require('../../../modules/mysql/question');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const FreeLiveClass = require('../../helpers/freeLiveClass');
const Data = require('../../../data/data');
const CourseContainerv2 = require('../../../modules/Utility.flagr');
const Coursev2Container = require('../../../modules/containers/coursev2');
const StudentHelper = require('../../helpers/student.helper');

let db;
let config;
// let client;

async function get(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const { student_class, student_id } = req.user;
        // let student_class = 14
        const { page } = req.params;
        const baseColors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
        // let color = [['#fd8263', '#c53364', '#74276c'], ['#e963fd', '#8233c5', '#274b74'], ['#43b7b8', '#436aac', '#8929ad'], ['#a11adc', '#e84b76', '#f8ae4d'], ['#01325e', '#01992a', '#00c288'], ['#fccf3a', '#de791e', '#ea5a6f']]
        const color = Utility.generateColorArr(baseColors);
        const caraouselLimit = 8;
        const baseUrl = `${config.staticCDN}q-thumbnail/`;
        const data = {
            student_id,
            student_class,
            page,
            home_page: 'HOME_PAGE',
            baseUrl,
            type: '',
            caraouselLimit,
            description: '',
            subtitle: '',
            action_activity: 'pdf_viewer',
            capsule: ['', '#000000', '#ffffff'],
            duration: ['#000000', '#ffffff'],
            button: ['', '#000000', '#f4e70c'],
            color,
            page_param: 'HOME_FEED',
            language: 'english',
        };

        const promise = [];
        promise.push(AnswerContainer.getPreviousHistory(student_id, db));
        promise.push(QuestionContainer.getPreviousHistory(student_id, db));
        const result1 = await Promise.all(promise);

        let ocr = '';
        let questionId = '0';
        if (result1[0].length > 0 && result1[1].length > 0) {
            if (typeof result1[0][0].parent_id !== 'undefined' && result1[0][0].parent_id == result1[1][0].question_id) {
                questionId = result1[0][0].question_id;
                const d = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, questionId);
                if (d.length > 0) {
                    ocr = d[0].ocr_text;
                }
            } else if (result1[0][0].question_id !== result1[1][0].question_id && result1[1].length > 0) {
                questionId = result1[1][0].question_id;
                ocr = result1[1][0].ocr_text;
            }
        }
        data.ocr = ocr;
        data.question_id = questionId;
        const result = await HomepageContainer.getCacheHomepage(data, config, HomepageHelper, db, elasticSearchInstance);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: result,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        // console.log(e)
        next(e);
    }
}

async function popUpData(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const region = req.headers.country;
        const { student_id } = req.user;
        let flag = 0;
        let google_rating_popup = false;
        let inapp_rating_popup = false;
        const studentData = {
            type: 'rating',
        };

        if (Utility.isUsRegion(region)) {
            throw new Error('US APP');
        }
        const hasUserAlreadyRatedOnPlaystore = await GoogleAppRatingUserContainer.checkUserAlreadySumbittedGoogleRating(db, student_id);
        if (!hasUserAlreadyRatedOnPlaystore) {
            const promises = [];
            promises.push(await StudentContainer.getRatingDone(student_id, db.redis.read));
            promises.push(await StudentContainer.getCrossPress(student_id, db.redis.read));
            const result = await Promise.all(promises);
            const ratingDone = result[0];
            const crossPressed = result[1];
            if (ratingDone == null) {
                const blockRatingFlag = await StudentContainer.isStudentEligibleForPopup(db.redis.read, student_id);
                if (blockRatingFlag) {
                    const counter_promises = [];
                    counter_promises.push(StudentContainer.getSrpViewCount(student_id, db.redis.read));
                    counter_promises.push(StudentRedis.getDailyUserMatchedQuestionsCounter(db.redis.read, student_id, 1));
                    const resolved_counter_promises = await Promise.all(counter_promises);
                    const viewSrpCount = resolved_counter_promises[0];
                    const viewSrpDailyCount = resolved_counter_promises[1];
                    if (viewSrpDailyCount && parseInt(viewSrpDailyCount) >= 3) {
                        flag = 1;
                        google_rating_popup = true;
                    } else if ((viewSrpCount >= 2 && crossPressed == null) || ((viewSrpCount - crossPressed) >= 2 && crossPressed != null)) {
                        flag = 1;
                        inapp_rating_popup = true;
                    }
                }
            }
        }

        if (flag === 0) {
            studentData.should_show = false;
            studentData.show_google_review = false;
        } else if (flag === 1) {
            let type = 'google';
            const flgrData = { body: { capabilities: { rating_with_flagr: {} }, entityId: student_id } };
            const flgrResp = await UtilityFlagr.getFlagrResp(flgrData);

            if (flgrResp != undefined && flgrResp.rating_with_flagr.enabled && flgrResp.rating_with_flagr.payload.enabled) {
                type = flgrResp.rating_with_flagr.payload.type;
            }

            let shouldShow = false;
            if (type === 'in-app' && inapp_rating_popup) {
                shouldShow = inapp_rating_popup;
            } else if (type === 'google' && google_rating_popup) {
                shouldShow = google_rating_popup;
            }

            studentData.should_show = shouldShow;
            studentData.rating_data = {
                header: 'Doubtnut accha laga? Toh Rate karo na!',
                subheader: 'Apko kya accha nahi laga?',
                option: ['Solutions nahi mile', 'Solutions samajh nahi aaye'],
            };
            if (google_rating_popup && type === 'google') {
                studentData.rating_data.show_google_review = true;
            }
            StudentContainer.makeStudentUnEligibleForPopup(db.redis.write, student_id);
        }

        const popUpDatas = [];
        popUpDatas.push(studentData);
        const finalData = {
            pop_up_list: popUpDatas,
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: finalData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        if (e.message === 'US APP') {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: [
                    {
                        type: 'rating',
                        should_show: false,
                        should_google_review: false,
                        is_us_country: true,
                    },
                ],
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        next(e);
    }
}

async function getNudgePopDetails(req, res) {
    // variable(s) declaration
    db = req.app.get('db');
    config = req.app.get('config');

    // editable
    const { version_code: versionCode } = req.headers;
    let { show_popup: showPopup, experiment, list_count: listCount } = req.query;
    let responseData = {};
    let activityToBePassed = [];
    let activityPerformed = [];
    let askDataRequire = false;
    let ncertDataRequire = false;
    let liveclassDataRequire = false;
    let gamesDataRequire = false;
    let feedDataRequire = false;
    let backpressShow = false;

    showPopup = parseInt(showPopup);
    experiment = parseInt(experiment);
    listCount = parseInt(listCount);

    // non-editable
    const { student_id: studentId, student_class: studentClass, locale: studentLocale } = req.user;
    const activityList = parseInt(studentClass) === 14 ? StaticData.allNudgeActivity.govt : StaticData.allNudgeActivity.all;
    const widgetArr = [];

    try {
        // ======================= start of data processing =====================

        // getting redis data of open count and already performed activity
        const appOpenCount = await StudentRedis.inc7DayCount(db.redis.read, studentId, 0);

        let storedActivity = await StudentRedis.get7Day(db.redis.read, 'nudge_pop_up', studentId);
        if (_.isNull(storedActivity)) {
            if (appOpenCount <= 6 && appOpenCount % 2 == 1) {
                if (showPopup === 1) {
                    activityToBePassed = activityList;
                } else {
                    backpressShow = true;
                }
            }
        } else {
            storedActivity = JSON.parse(storedActivity);
            activityPerformed = storedActivity;
            if (appOpenCount <= 6 && appOpenCount % 2 == 1) {
                if (showPopup === 1) {
                    activityToBePassed = activityList.filter((x) => storedActivity.indexOf(x) === -1);
                } else if (storedActivity.length < 5) {
                    backpressShow = true;
                }
            }
        }

        // making decision of final required data set
        if (activityToBePassed.length > 0) {
            if (listCount === -1) {
                listCount = activityList.length;
            }
            if (listCount !== 0) {
                activityToBePassed.forEach((item) => {
                    if (item === 'question_ask') {
                        askDataRequire = true;
                    }
                    if (item === 'ncert_video_watch') {
                        ncertDataRequire = true;
                    }
                    if (item === 'live_class_video_watch') {
                        liveclassDataRequire = true;
                    }
                    if (item === 'game_open') {
                        gamesDataRequire = true;
                    }
                    if (item === 'feed_seen') {
                        feedDataRequire = true;
                    }
                });
            }
        }

        // making of the final widget array
        if (askDataRequire && listCount > widgetArr.length) {
            widgetArr.push(
                {
                    type: 'ask_doubt_card',
                    data: {
                        heading: StaticData.askHeadText(studentLocale),
                        title: StaticData.askTitleText(studentLocale),
                        subtitle: 'Turant milega video solution!',
                        deeplink: 'doubtnutapp://camera',
                    },
                    extra_params: {
                        widget_name: 'ask_doubt',
                        experiment,
                    },
                },
            );
        }

        if (ncertDataRequire && listCount > widgetArr.length) {
            const ncertPlaylistId = '116732';
            const [nextVideo, ncertBookList] = await LibraryHelper.makeData(db, versionCode, studentClass, studentId, ncertPlaylistId);
            if (ncertBookList.list.length > 0) {
                const finalItem = [];
                ncertBookList.list.forEach((item) => {
                    const title = querystring.escape(item.name);
                    const obj = {
                        type: 'image_card',
                        data: {
                            id: item.id,
                            image_url: item.image_url,
                            deeplink: `doubtnutapp://playlist?playlist_id=${item.id}&playlist_title=${title}&is_last=0`,
                            card_width: '3',
                            card_ratio: '1:1',
                        },
                    };
                    finalItem.push(obj);
                });

                widgetArr.push(
                    {
                        type: 'widget_parent',
                        data: {
                            title: StaticData.ncertHeadText(studentLocale),
                            items: finalItem,
                            title_text_size: 14,
                            is_title_bold: true,
                        },
                        extra_params: {
                            widget_name: 'ncert',
                            experiment,
                        },
                    },
                );
            }
        }

        if (liveclassDataRequire && listCount > widgetArr.length) {
            const liveClassData = await getLiveDataForNudge(db, config, studentId, studentClass, studentLocale, experiment);
            if (Object.keys(liveClassData).length !== 0) {
                widgetArr.push(liveClassData);
            }
        }

        if (gamesDataRequire && listCount > widgetArr.length) {
            const gamesData = await getGamesDataForNudge(db, experiment, studentLocale);
            if (Object.keys(gamesData).length !== 0) {
                widgetArr.push(gamesData);
            }
        }

        if (feedDataRequire && listCount > widgetArr.length) {
            widgetArr.push(
                {
                    type: 'feed_banner',
                    data: {
                        title: StaticData.feedHeadText(studentLocale),
                        banner_text: StaticData.feedBannerText(studentLocale),
                        button_text: StaticData.feedButtonText(studentLocale),
                        deeplink: 'doubtnutapp://feeds',
                    },
                    extra_params: {
                        widget_name: 'feed_banner',
                        experiment,
                    },
                },
            );
        }

        const returnData = {
            message: 'Nudge Pop up Data',
            open_count: appOpenCount,
            core_actions_done: activityPerformed,
        };

        if (showPopup === 0) {
            returnData.show_on_backpress = backpressShow;
            returnData.experiment = experiment;
            returnData.list_count = listCount;
        }

        if (widgetArr.length > 0) {
            returnData.title = StaticData.nudgePopUpTitle(studentLocale);
            returnData.widgets = widgetArr;
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: returnData,
        };
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Unexpected Error',
            },
            data: {
                message: 'Error',
            },
        };
    }
    res.status(responseData.meta.code).json(responseData);
}

async function storeActivityData(req, res) {
    // variable(s) declaration
    db = req.app.get('db');
    config = req.app.get('config');

    // editable
    let responseData = {};
    let resultMsg = '';

    // non-editable
    const { student_id: studentId } = req.user;
    const { type } = req.body;

    try {
        // ======================= start of data processing =====================

        // checking type and executing operations according that
        if (type === 'activity') {
            const { activity_name: activityName } = req.body;
            resultMsg = await HomepageContainer.storeActivityDetails(db.redis, studentId, activityName);
        } else if (type === 'app_open') {
            resultMsg = await HomepageContainer.storeAppOpen(db.redis, studentId);
        } else if (type === 'reset') {
            const { value } = req.body;
            if (value === 'activity') {
                StudentRedis.resetActivityDetails(db.redis.read, studentId);
                resultMsg = 'Activity Redis Removed';
            } else if (value === 'app_open') {
                StudentRedis.resetAppOpen(db.redis.read, studentId);
                resultMsg = 'App Open Count Redis Removed';
            }
        }
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                message: resultMsg,
            },
        };
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Unexpected Error',
            },
            data: {
                message: 'Error',
            },
        };
    }
    res.status(responseData.meta.code).json(responseData);
}
async function showQaWidget(studentId) {
    let flagrDataFromRedis = await StudentRedis.getQaWidgetFlagrData(db.redis.read, studentId, 'FLAG:show_qa_widget');
    if (!_.isNull(flagrDataFromRedis)) {
        flagrDataFromRedis = JSON.parse(flagrDataFromRedis);
        return flagrDataFromRedis;
    }
    const flgrData = { body: { capabilities: { show_qa_widget: {} }, entityId: studentId } };
    const flgrResp = await UtilityFlagr.getFlagrResp(flgrData, 400);

    if (flgrResp !== undefined && flgrResp.show_qa_widget.enabled && flgrResp.show_qa_widget.payload.enabled) {
        await StudentRedis.setQaWidgetFlagrData(db.redis.write, studentId, 'FLAG:show_qa_widget', flgrResp.show_qa_widget.payload.enabled);
        return flgrResp.show_qa_widget.payload.enabled;
    }
    return false;
}

async function getFormulaSheetData(chapter, studentClass, chapterALias) {
    let formulaSheetData = CourseV2Mysql.getFormulaSheet(db.mysql.read, chapter, studentClass);
    if (_.isEmpty(formulaSheetData)) {
        // fetching formula sheet based on chapter only
        formulaSheetData = CourseV2Mysql.getFormulaSheet(db.mysql.read, chapter, null);
    }
    if (_.isEmpty(formulaSheetData)) {
        // fetching formula sheet based on chapter alias
        formulaSheetData = CourseV2Mysql.getFormulaSheet(db.mysql.read, chapterALias, null);
    }
    return formulaSheetData;
}

async function getNcertVideosData(chapter, studentClass, chapterALias) {
    let ncertVideosData = QuestionMysql.getNcertVideosFromChapterName(db.mysql.read, chapter, studentClass);
    if (_.isEmpty(ncertVideosData)) {
        // fetching ncert videos based on chapter only
        ncertVideosData = QuestionMysql.getNcertVideosFromChapterName(db.mysql.read, chapter, null);
    }
    if (_.isEmpty(ncertVideosData)) {
        // fetching ncert videos based on chapter alias
        ncertVideosData = QuestionMysql.getNcertVideosFromChapterName(db.mysql.read, chapterALias, null);
    }
    return ncertVideosData;
}
async function getLastWatchedQuestionWidget(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');

    let responseData = {};
    const { student_id: studentId, student_class: studentClass, locale: studentLocale } = req.user;
    try {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                position: 1,
                items: [],
            },
        };

        if (StudentHelper.isAltApp(req.headers.package_name)) {
            // disabled qa widget for alt app
            return res.status(responseData.meta.code).json(responseData);
        }

        const shouldShowQAWidget = await showQaWidget(studentId);
        if (!shouldShowQAWidget) { // checking flagr response
            return res.status(responseData.meta.code).json(responseData);
        }
        const qaWidgetFromRedis = await StudentRedis.getQaWidgetData(db.redis.read, studentId, 'QA_WIDGET_DATA');
        if (!_.isNull(qaWidgetFromRedis)) {
            responseData = JSON.parse(qaWidgetFromRedis);
            const qaWidgetPosition = await StudentRedis.getQuestionAskedWidgetPosition(db.redis.read, studentId);
            responseData.data.position = qaWidgetPosition + 4 || 4;
            return res.status(responseData.meta.code).json(responseData);
        }

        // fetching last question asked by user
        const lastQuestionWatched = await QuestionMysql.getLastWatchedQuestion(db.mysql.read, studentId);
        if (!_.isEmpty(lastQuestionWatched)) {
            const finalData = [];
            const questionImage = lastQuestionWatched[0].question_image ? `${Data.cdnHostLimelightStaticWithPrefix}images/${lastQuestionWatched[0].question_image}` : null;
            const questionText = lastQuestionWatched[0].ocr_text;
            const chapter = lastQuestionWatched[0].chapter.trim();
            let chapterAlias = '';

            // fetching chapter alias of the chapter
            const chapterAliasResponse = await QuestionContainer.getChapterAliasData(db, chapter);
            if (!_.isEmpty(chapterAliasResponse) && chapterAliasResponse[0] !== undefined && chapterAliasResponse[0].chapter_alias !== '' && chapterAliasResponse[0].chapter_alias != null) {
                chapterAlias = chapterAliasResponse[0].chapter_alias.trim();
            }

            const items = [];
            // Live Class
            const dailyGoalObj = {
                type: 'live',
                subject: lastQuestionWatched[0].subject,
                chapter: chapterAlias || chapter,
                class: (studentClass).toString(),
                student_id: studentId,
                locale: studentLocale,
            };
            let doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj); // fetching live class data from elastic search
            doubtfeedData = doubtfeedData.liveClass;
            if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                doubtfeedData = doubtfeedData.sugg;
                doubtfeedData = doubtfeedData.slice(0, 1);
                items.push({
                    title: Data.liveClass.title(studentLocale),
                    image_url: Data.liveClass.img_url,
                    deeplink: `doubtnutapp://live_class?id=${doubtfeedData[0].srcId}&page=QA_WIDGET_LIVE`,
                });
            }

            // Topic Video (from daily goal)
            dailyGoalObj.type = 'video';
            doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj); // fetching topic video data from elastic search
            doubtfeedData = doubtfeedData.video;
            if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
                doubtfeedData = doubtfeedData.sugg;
                doubtfeedData = doubtfeedData.slice(0, 5);
                StudentRedis.setQaWidgetList(db.redis.write, studentId, 'QA_WIDGET_TOPIC_VIDEOS_LIST', doubtfeedData);
                items.push({
                    title: Data.topicVideo.title(studentLocale),
                    image_url: Data.topicVideo.img_url,
                    deeplink: `doubtnutapp://video?qid=${doubtfeedData[0].srcId}&page=QA_WIDGET_TOPIC`,
                });
            }

            // Ncert Videos
            const ncertVideosData = await getNcertVideosData(chapter, lastQuestionWatched[0].class, chapterAlias);
            if (!_.isEmpty(ncertVideosData)) {
                items.push({
                    title: Data.ncertVideos.title(studentLocale),
                    image_url: Data.ncertVideos.img_url,
                    deeplink: `doubtnutapp://video?qid=${ncertVideosData[0].question_id}&page=QA_WIDGET_NCERT&playlist_id=${ncertVideosData[0].main_playlist_id}`,
                });
            }

            // Formula Sheet
            const formulaSheetData = await getFormulaSheetData(chapter, lastQuestionWatched[0].class, chapterAlias);
            if (!_.isEmpty(formulaSheetData)) {
                items.push({
                    title: Data.formulaSheet.title(studentLocale),
                    image_url: Data.formulaSheet.img_url,
                    deeplink: `doubtnutapp://pdf_viewer?pdf_url=${formulaSheetData[0].resource_path}`,
                });
            }
            // Books
            // fetching all the books based on chapter
            let booksExists = await CourseV2Mysql.getBooksData(db.mysql.read, chapter, lastQuestionWatched[0].class, lastQuestionWatched[0].subject);
            if (_.isEmpty(booksExists)) {
                booksExists = await CourseV2Mysql.getBooksData(db.mysql.read, chapter, null, lastQuestionWatched[0].subject);
            }
            if (_.isEmpty(booksExists)) {
                booksExists = await CourseV2Mysql.getBooksData(db.mysql.read, chapterAlias, null, lastQuestionWatched[0].subject);
            }
            if (!_.isEmpty(booksExists)) {
                items.push({
                    title: Data.books.title(studentLocale),
                    image_url: Data.books.img_url,
                    deeplink: encodeURI(`doubtnutapp://playlist?playlist_id=108860&playlist_title=Book List&is_last=0&page=QA_WIDGET_BOOK&package_details_id=${booksExists[0].subject}_${chapter}&student_class=${lastQuestionWatched[0].class}`),
                });
            }

            const qaWidgetPosition = await StudentRedis.getQuestionAskedWidgetPosition(db.redis.read, studentId);
            if (_.isEmpty(items)) {
                responseData.data.items = [];
                return res.status(responseData.meta.code).json(responseData);
            }
            const finalObj = {
                widget_type: 'widget_explore_more',
                widget_data: {
                    title: Data.qaWidgetTitle(studentLocale),
                    question_image_url: questionImage,
                    question_text: questionText,
                    background_color: '#E6F2FE',
                    items,
                },
                order: -9600,
            };
            finalData.push(finalObj);
            responseData.data.position = qaWidgetPosition + 4 || 4;
            responseData.data.items = finalData;
            res.status(responseData.meta.code).json(responseData);
        } else {
            return res.status(responseData.meta.code).json(responseData);
        }
        StudentRedis.setQaWidgetData(db.redis.write, studentId, 'QA_WIDGET_DATA', responseData);
    } catch (err) {
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Unexpected Error',
            },
            data: {
                message: 'Error',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
module.exports = {
    get,
    popUpData,
    getNudgePopDetails,
    storeActivityData,
    getLastWatchedQuestionWidget,
};
