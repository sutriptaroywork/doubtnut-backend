const _ = require('lodash');

const TokenGenerator = require('../../../modules/token');
const Student = require('../../../modules/student');
const StaticData = require('../../../data/data');
const LiveClassMysql = require('../../../modules/mysql/liveclass');
const DoubtfeedMysql = require('../../../modules/mysql/doubtfeed');
const QuestionRedis = require('../../../modules/redis/question');
// const QuestionHelper = require('../../helpers/question.helper');
const WidgetHelper = require('../../widgets/liveclass');
const HomePageQuestionMaster = require('../../../modules/homepageQuestionsMaster');
const LibraryRedis = require('../../../modules/redis/library');

function generateRandomPracticingNumber() {
    let randomNum = _.random(1, 10, true);
    randomNum = randomNum.toFixed(1);
    return randomNum;
}
async function updateRowByAuthorised(db, config, userDetails, params) {
    try {
        let isLoginViaWeb;
        let updateObj;
        const authClient = userDetails.auth_client;
        isLoginViaWeb = !!params.is_web;
        if (isLoginViaWeb) {
            updateObj = {
                is_web: params.is_web,
                clevertap_id: `WEB_${params.country}`,
            };
        } else {
            updateObj = {
                is_web: 0,
                clevertap_id: `APP_${params.country}`,
            };
        }
        updateObj.fingerprints = authClient;
        updateObj.is_email_verified = 1;

        const studentId = userDetails.student_id;
        Student.updateStudentViaSocialLogin(db.mysql.write, studentId, updateObj);
        userDetails['x-auth-token'] = TokenGenerator.sign({ id: studentId }, config.jwt_secret_new);
        userDetails['x-auth-refresh-token'] = TokenGenerator.sign({ id: studentId }, config.jwt_secret_refresh, true);
        return userDetails;
    } catch (e) {
        return null;
    }
}

async function makeAllCompleted(db, studentId, topicList, currentTopicProgress, currentTopicDetails, topicId, locale) {
    let completedTopics = await QuestionRedis.getCompletedTopicList(db.redis.read, studentId, 'completed_topics');
    let isCompleted = false;
    if (!_.isNull(completedTopics)) {
        completedTopics = JSON.parse(completedTopics);
        if (!completedTopics.includes(topicId)) {
            completedTopics.push(topicId);
            isCompleted = true;
        }
    } else {
        completedTopics = [topicId];
        isCompleted = true;
    }
    QuestionRedis.setCompletedTopicList(db.redis.read, studentId, 'completed_topics', completedTopics);
    const progressText = global.t8[locale].t('Topic {{length}} of {{length}} Finished', { length: topicList.length });
    const obj = {
        type: 'todays_top_completed',
        heading_text: StaticData.doubtfeed(locale).todayGoal.completedTitle,
        description: StaticData.doubtfeed(locale).todayGoal.completedSubTitle,
        total_tasks: currentTopicDetails.length,
        completed_tasks_count: currentTopicProgress,
        progress_text: topicList.length == 1 ? '' : progressText,
        button_text: StaticData.doubtfeed(locale).progressButton,
        button_bg_color: '#ea532c',
        button_deeplink: 'doubtnutapp://camera',
        is_completed: isCompleted,
    };
    return obj;
}

async function makeCurrentProgress(db, config, topicList, currentTopicDetails, currentTopicProgress, locale, studentId, topicId) {
    const topicIndex = topicList.findIndex((x) => x.id == topicId);
    const topicPosition = topicIndex + 1;

    const allCompletedTypes = currentTopicDetails.filter((x) => x.is_viewed === 1);

    let progressText = global.t8[locale].t('Topic no {{topicPosition}} of {{length}} in progress', { topicPosition, length: topicList.length });
    if (currentTopicDetails.length == currentTopicProgress) {
        progressText = global.t8[locale].t('Topic no {{topicPosition}} of {{length}} is completed', { topicPosition, length: topicList.length });
    }

    const studentData = await Student.getStudentWithLocation(studentId, db.mysql.read);
    let userImg = '';
    if (studentData[0].img_url == undefined || studentData[0].img_url == null) {
        userImg = `${config.staticCDN}${StaticData.userDefaultPic}`;
    } else {
        userImg = studentData[0].img_url;
    }

    const obj = {
        type: 'todays_top_progress',
        heading_text: StaticData.doubtfeed(locale).todayGoal.title,
        description: StaticData.doubtfeed(locale).todayGoal.subTitle,
        student_image: userImg,
        total_tasks: currentTopicDetails.length,
        completed_tasks_count: currentTopicProgress,
        completed_tasks: allCompletedTypes,
        progress_text: topicList.length == 1 ? '' : progressText,
    };
    return obj;
}

async function makeTodaysTopWidget(db, config, topicList, studentId, locale, topicId) {
    let obj = {};
    const topicPromise = [];
    topicList.forEach((x) => {
        topicPromise.push(DoubtfeedMysql.getTopicProgress(db.mysql.read, x.id));
    });
    const topicResults = await Promise.all(topicPromise);

    let completedTopics = 0;
    let currentTopicProgress = 0;
    let currentTopicDetails = [];

    topicResults.forEach((item, index) => {
        const mainId = topicList[index].id;

        let totalViewed = 0;
        item.forEach((x) => {
            if (x.is_viewed == 1) {
                totalViewed++;
            }
        });

        if (totalViewed == item.length) {
            completedTopics++;
        }

        if (mainId == topicId) {
            currentTopicDetails = item;
            currentTopicProgress = totalViewed;
        }
    });

    if (topicList.length == completedTopics) {
        // all completed
        // check if topicList.length == 1 then no bottom text
        obj = await makeAllCompleted(db, studentId, topicList, currentTopicProgress, currentTopicDetails, topicId, locale);
    } else {
        obj = await makeCurrentProgress(db, config, topicList, currentTopicDetails, currentTopicProgress, locale, studentId, topicId);
    }
    return obj;
}

function existingResourceList(resourceList, resourceType) {
    let resourceIds = '';
    if (resourceList.length > 0) {
        const prevLiveVideoQuestions = resourceList.filter((x) => x.type === resourceType);
        if (prevLiveVideoQuestions.length > 0) {
            resourceIds = prevLiveVideoQuestions[0].resource_id;
        }
    }
    return resourceIds;
}

async function formatLcData(db, config, allLiveItems, rowId, totalItem, locale, versionCode) {
    let obj = {};
    const checkDone = await DoubtfeedMysql.getTaskById(db.mysql.read, rowId);
    let doneTask = false;
    if (checkDone.length > 0 && checkDone[0].is_viewed == 1) {
        doneTask = true;
    }

    const data = allLiveItems;
    const widget = await WidgetHelper.homepageVideoWidgetWithAutoplay({
        data, paymentCardState: { isVip: false }, db, config, title: 'Live Classes', locale, versionCode,
    });

    if (widget.items[0].data.video_resource && !_.isEmpty(widget.items[0].data.video_resource) && !_.isNull(widget.items[0].data.video_resource)) {
        const { id } = widget.items[0].data;
        widget.items[0].data.page = 'DAILY_DOUBT';

        delete widget.is_live;
        delete widget.live_text;
        delete widget.title;

        widget.items[0].data.card_width = '1.2';
        widget.play_strategy = '0.5';

        let { subTitle } = StaticData.doubtfeed(locale).liveClass;
        if (doneTask) {
            subTitle = `${StaticData.doubtfeed(locale).allCompletedTaskButtonText}`;
        }
        const practicingNum = generateRandomPracticingNumber();
        obj = {
            widget_type: 'widget_doubt_feed_daily_goal',
            widget_data: {
                goal_id: rowId,
                title: `${StaticData.doubtfeed(locale).liveClass.title}`,
                subtitle: subTitle,
                practicing_text: `${practicingNum}K Practicing`,
                goal_number: totalItem + 1,
                deeplink: `doubtnutapp://live_class?id=${id}&page=DAILY_DOUBT`,
                items: [{
                    widget_data: widget,
                    widget_type: 'widget_autoplay',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                }],
            },
        };
    }

    return obj;
}

async function makeLcData(db, config, topicDetail, totalItem, locale, versionCode, liveVideoData) {
    let obj = {};

    if (liveVideoData.length > 0) {
        const liveVideoId = liveVideoData[0]._source.id;
        const liveVideoResourseData = await LiveClassMysql.getLiveVideoByResId(db.mysql.read, liveVideoId);
        if (liveVideoResourseData.length > 0 && liveVideoResourseData[0].resource_id != 0) {
            const sqlObj = {
                type: 'LIVE_VIDEO',
                data_list: liveVideoResourseData[0].resource_id,
                is_viewed: 0,
                topic_reference: topicDetail.id,
            };

            const insertLc = await DoubtfeedMysql.setDoubtFeedResourceData(db.mysql.write, sqlObj);
            obj = await formatLcData(db, config, liveVideoResourseData, insertLc.insertId, totalItem, locale, versionCode);
        }
    }
    return obj;
}

async function formatPdfData(db, pdfList, rowId, topicDetail, totalItem, locale) {
    const checkDone = await DoubtfeedMysql.getTaskById(db.mysql.read, rowId);
    let doneTask = false;
    if (checkDone.length > 0 && checkDone[0].is_viewed == 1) {
        doneTask = true;
    }

    const pdfFinalList = [];
    pdfList.forEach((x) => {
        const obj = {
            widget_type: 'widget_pdf_notes',
            widget_data: {
                id: x._source.id,
                title: `${x._source.subject} | ${topicDetail.topic}`,
                card_width: '1.3',
                deeplink: `doubtnutapp://pdf_viewer?pdf_url=${x._source.resource_path}`,
            },
        };
        pdfFinalList.push(obj);
    });

    let subTitle = `${StaticData.doubtfeed(locale).pdf.subTitle}`;
    if (doneTask) {
        subTitle = `${StaticData.doubtfeed(locale).allCompletedTaskButtonText}`;
    }

    let obj = {};
    const practicingNum = generateRandomPracticingNumber();
    if (pdfFinalList.length > 0) {
        obj = {
            widget_type: 'widget_doubt_feed_daily_goal',
            widget_data: {
                goal_id: rowId,
                title: `${StaticData.doubtfeed(locale).pdf.title} ${topicDetail.topic}`,
                subtitle: subTitle,
                practicing_text: `${practicingNum}K Practicing`,
                goal_number: totalItem + 1,
                // deeplink: pdfFinalList[0].widget_data.deeplink,
                items: pdfFinalList,
            },
        };
    }

    return obj;
}

async function makePdfData(db, topicDetail, totalItem, locale, pdfData) {
    let obj = {};

    const sqlObj = {
        type: 'PDF',
        data_list: pdfData.map((x) => x._source.resource_path).join(),
        is_viewed: 0,
        topic_reference: topicDetail.id,
    };
    const insertPdf = await DoubtfeedMysql.setDoubtFeedResourceData(db.mysql.write, sqlObj);
    obj = await formatPdfData(db, pdfData, insertPdf.insertId, topicDetail, totalItem, locale);

    return obj;
}

async function formatFsData(db, fsList, thumbnailCdn, rowId, topicDetail, totalItem, locale) {
    const checkDone = await DoubtfeedMysql.getTaskById(db.mysql.read, rowId);
    let doneTask = false;
    if (checkDone.length > 0 && checkDone[0].is_viewed == 1) {
        doneTask = true;
    }

    const fsFinalList = [];
    fsList.forEach((x) => {
        const obj = {
            widget_type: 'widget_formula_sheet',
            widget_data: {
                id: x.id,
                title: `Formula Deck for ${x.level2}`,
                card_width: '1.3',
                deeplink: `doubtnutapp://pdf_viewer?pdf_url=${thumbnailCdn}pdf_download/${x.location}`,
                image_url: `${thumbnailCdn}images/icons/formula-deck.webp`,
            },
        };
        fsFinalList.push(obj);
    });

    let subTitle = `${StaticData.doubtfeed(locale).formulaSheet.subTitle}`;
    if (doneTask) {
        subTitle = `${StaticData.doubtfeed(locale).allCompletedTaskButtonText}`;
    }

    let obj = {};
    const practicingNum = generateRandomPracticingNumber();

    if (fsFinalList.length > 0) {
        obj = {
            widget_type: 'widget_doubt_feed_daily_goal',
            widget_data: {
                goal_id: rowId,
                title: `${StaticData.doubtfeed(locale).formulaSheet.title} ${topicDetail.topic}`,
                subtitle: subTitle,
                practicing_text: `${practicingNum}K Practicing`,
                goal_number: totalItem + 1,
                deeplink: fsFinalList[0].widget_data.deeplink,
                items: fsFinalList,
            },
        };
    }

    return obj;
}

async function makeFsData(db, topicDetail, resourceList, studentClass, thumbnailCdn, totalItem, locale) {
    let obj = {};
    let prevfsIds = '';
    prevfsIds = existingResourceList(resourceList, 'FORMULA_SHEET');
    prevfsIds = prevfsIds.split(',');
    const fsData = await DoubtfeedMysql.getFormulaSheets(db.mysql.read, topicDetail.topic, studentClass);
    if (fsData.length > 0) {
        let fsList = [];
        const fsDataWithoutPrev = fsData.filter((x) => !prevfsIds.includes(x.id));
        if (fsDataWithoutPrev.length > 2) {
            fsList = fsDataWithoutPrev;
        } else {
            fsList = fsData;
        }

        fsList = fsList.filter((x) => x.location && !_.isEmpty(x.location) && !_.isNull(x.location));
        fsList = fsList.slice(0, 5);
        if (fsList.length != 0) {
            const sqlObj = {
                type: 'FORMULA_SHEET',
                data_list: fsList.map(({ id }) => id).join(),
                is_viewed: 0,
                topic_reference: topicDetail.id,
            };

            const insertFs = await DoubtfeedMysql.setDoubtFeedResourceData(db.mysql.write, sqlObj);
            obj = await formatFsData(db, fsList, thumbnailCdn, insertFs.insertId, topicDetail, totalItem, locale);
        }
    }

    return obj;
}

async function formatTbData(db, qid, topicName, rowId, totalItem, locale, thumbnailCdn) {
    const checkDone = await DoubtfeedMysql.getTaskById(db.mysql.read, rowId);
    let doneTask = false;
    if (checkDone.length > 0 && checkDone[0].is_viewed == 1) {
        doneTask = true;
    }

    let { subTitle } = StaticData.doubtfeed(locale).topicBooster;

    if (doneTask) {
        subTitle = `${StaticData.doubtfeed(locale).allCompletedTaskButtonText}`;
    }
    const practicingNum = generateRandomPracticingNumber();
    const obj = {
        widget_type: 'widget_doubt_feed_daily_goal',
        widget_data: {
            goal_id: rowId,
            title: StaticData.doubtfeed(locale).topicBooster.title,
            subtitle: subTitle,
            practicing_text: `${practicingNum}K Practicing`,
            goal_number: totalItem + 1,
            deeplink: `doubtnutapp://topic_booster_game?qid=${qid}`,
            items: [
                {
                    widget_type: 'widget_topic_booster_game_banner',
                    widget_data: {
                        text_description_color: '#047b79',
                        background_color: '#acebf4',
                        description: global.t8[locale].t('Take a quiz on {{topicName}} aur bano champion', { topicName }),
                        image_url: `${thumbnailCdn}daily_feed_resources/topic-booster-game.webp`,
                        card_width: '1.1',
                        deeplink: `doubtnutapp://topic_booster_game?qid=${qid}`,
                        id: qid,
                        cta_text: global.t8[locale].t('Play Now'),
                    },
                },
            ],
        },
    };

    return obj;
}

async function makeTopicBoosterData(db, config, topicDetail, resourceList, studentId, studentClass, thumbnailCdn, totalItem, locale) {
    let obj = {};

    let prevTbId = 0;
    prevTbId = existingResourceList(resourceList, 'TOPIC_MCQ');
    const chapterAliasResponse = await HomePageQuestionMaster.getChapterAliasByChapter(db.mysql.read, topicDetail.topic);
    if (chapterAliasResponse.length > 0) {
        let chapterAlias = '';
        let quesId = 0;
        chapterAliasResponse.forEach((x) => {
            if (x.question_id != prevTbId) {
                chapterAlias = x.chapter_alias;
                quesId = x.question_id;
            }
        });

        if (chapterAlias !== '') {
            const key = `TOPIC_${chapterAlias}_5`;
            const isChapterAliasAllowed = await LibraryRedis.getByKey(key, db.redis.read);
            if (isChapterAliasAllowed) {
                const sqlObj = {
                    type: 'TOPIC_MCQ',
                    data_list: quesId,
                    is_viewed: 0,
                    topic_reference: topicDetail.id,
                };

                const insertTb = await DoubtfeedMysql.setDoubtFeedResourceData(db.mysql.write, sqlObj);
                obj = await formatTbData(db, quesId, topicDetail.topic, insertTb.insertId, totalItem, locale, thumbnailCdn);
            }
        }
    }
    return obj;
}

async function formatKJData(db, qid, chapterAlias, studentId, topicName, rowId, totalItem, locale, thumbnailCdn) {
    const checkDone = await DoubtfeedMysql.getTaskById(db.mysql.read, rowId);
    let doneTask = false;
    if (checkDone.length > 0 && checkDone[0].is_viewed == 1) {
        doneTask = true;
    }

    let { subTitle } = StaticData.doubtfeed(locale).topicBooster;
    if (doneTask) {
        subTitle = `${StaticData.doubtfeed(locale).allCompletedTaskButtonText}`;
    }
    const practicingNum = generateRandomPracticingNumber();
    const obj = {
        widget_type: 'widget_doubt_feed_daily_goal',
        widget_data: {
            goal_id: rowId,
            title: StaticData.doubtfeed(locale).topicBooster.title,
            subtitle: subTitle,
            practicing_text: `${practicingNum}K Practicing`,
            goal_number: totalItem + 1,
            deeplink: `doubtnutapp://khelo_jeeto/wait?chapter_alias=${chapterAlias}&is_opponent_bot=true&inviter=${studentId}&is_inviter=true`,
            items: [
                {
                    widget_type: 'widget_topic_booster_game_banner',
                    widget_data: {
                        text_description_color: '#047b79',
                        background_color: '#acebf4',
                        description: global.t8[locale].t('Take a quiz on {{topicName}} aur bano champion', { topicName }),
                        image_url: `${thumbnailCdn}daily_feed_resources/topic-booster-game.webp`,
                        card_width: '1.1',
                        deeplink: `doubtnutapp://khelo_jeeto/wait?chapter_alias=${chapterAlias}&is_opponent_bot=true&inviter=${studentId}&is_inviter=true`,
                        id: qid,
                        cta_text: global.t8[locale].t('Play Now'),
                    },
                },
            ],
        },
    };

    return obj;
}

async function makeKheloJeetoData(db, config, topicDetail, resourceList, studentId, studentClass, thumbnailCdn, totalItem, locale) {
    let obj = {};

    let prevTbId = 0;
    prevTbId = existingResourceList(resourceList, 'TOPIC_MCQ');
    const chapterAliasResponse = await HomePageQuestionMaster.getChapterAliasByChapter(db.mysql.read, topicDetail.topic);
    if (chapterAliasResponse.length > 0) {
        let chapterAlias = '';
        let quesId = 0;
        chapterAliasResponse.forEach((x) => {
            if (x.question_id != prevTbId) {
                chapterAlias = x.chapter_alias;
                quesId = x.question_id;
            }
        });

        if (chapterAlias !== '') {
            const key = `TOPIC_${chapterAlias}_5`;
            const isChapterAliasAllowed = await LibraryRedis.getByKey(key, db.redis.read);
            if (isChapterAliasAllowed) {
                const sqlObj = {
                    type: 'TOPIC_MCQ',
                    data_list: quesId,
                    is_viewed: 0,
                    topic_reference: topicDetail.id,
                };

                const insertTb = await DoubtfeedMysql.setDoubtFeedResourceData(db.mysql.write, sqlObj);
                obj = await formatKJData(db, quesId, chapterAlias, studentId, topicDetail.topic, insertTb.insertId, totalItem, locale, thumbnailCdn);
            }
        }
    }
    return obj;
}

async function formatTopicVideoData(db, topicVideoList, rowId, totalItem, locale, currentVideo, thumbnailCdn) {
    const checkDone = await DoubtfeedMysql.getTaskById(db.mysql.read, rowId);
    let doneTask = false;
    if (checkDone.length > 0 && checkDone[0].is_viewed == 1) {
        doneTask = true;
    }

    currentVideo.thumbnail = `${thumbnailCdn}question-thumbnail/${currentVideo.question_id}.webp`;
    currentVideo.deeplink = `doubtnutapp://video?qid=${currentVideo.question_id}&page=DAILY_DOUBT`;

    let subTitle = (`${StaticData.doubtfeed(locale).topicVideos.subTitle}`).replace('{{topic_name}}', currentVideo.chapter);
    if (doneTask) {
        subTitle = `${StaticData.doubtfeed(locale).allCompletedTaskButtonText}`;
    }
    const practicingNum = generateRandomPracticingNumber();

    const obj = {
        widget_type: 'widget_doubt_feed_daily_goal',
        widget_data: {
            goal_id: rowId,
            title: `${StaticData.doubtfeed(locale).topicVideos.title}`,
            subtitle: subTitle,
            practicing_text: `${practicingNum}K Practicing`,
            goal_number: totalItem + 1,
            deeplink: currentVideo.deeplink,
            items: [
                {
                    widget_type: 'widget_topic_video',
                    widget_data: {
                        id: currentVideo.question_id,
                        title: `${currentVideo.subject} | ${currentVideo.chapter}`,
                        subtitle: `${currentVideo.chapter}`,
                        ocr_text: currentVideo.ocr_text,
                        card_width: '1.1',
                        deeplink: currentVideo.deeplink,
                    },
                },
            ],
        },
    };

    return obj;
}

async function makeTopicVideoData(db, topicDetail, studentId, thumbnailCdn, totalItem, locale, topicVideoData) {
    let obj = {};

    let topicVideoIdList = topicVideoData.map((x) => x._source.id);
    topicVideoData = await DoubtfeedMysql.getSimilarQuestionsByIds(db.mysql.read, topicVideoIdList);
    topicVideoIdList = topicVideoData.map((x) => x.question_id);

    const sqlObj = {
        type: 'TOPIC_VIDEO',
        data_list: topicVideoIdList.join(),
        is_viewed: 0,
        topic_reference: topicDetail.id,
    };
    const insertTopicVideo = await DoubtfeedMysql.setDoubtFeedResourceData(db.mysql.write, sqlObj);
    QuestionRedis.setTopicVideoList(db.redis.write, studentId, 'DAILY_DOUBT_LIST', topicVideoIdList);

    const currentVideo = topicVideoData[0];
    obj = await formatTopicVideoData(db, topicVideoData, insertTopicVideo.insertId, totalItem, locale, currentVideo, thumbnailCdn);

    return obj;
}

module.exports = {
    updateRowByAuthorised,
    makeTodaysTopWidget,
    makeLcData,
    makePdfData,
    makeFsData,
    makeTopicBoosterData,
    makeTopicVideoData,
    formatPdfData,
    formatFsData,
    formatTopicVideoData,
    formatLcData,
    formatTbData,
    existingResourceList,
    makeKheloJeetoData,
    formatKJData,
};
