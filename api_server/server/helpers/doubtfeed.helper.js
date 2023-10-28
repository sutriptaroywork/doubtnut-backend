const _ = require('lodash');

const DoubtfeedMysql = require('../../modules/mysql/doubtfeed');
const StudenBl = require('../v1/student/student.bl');
const LibraryRedis = require('../../modules/redis/library');
const HomePageQuestionMaster = require('../../modules/homepageQuestionsMaster');
const Utility = require('../../modules/utility');
const UtilityFlagr = require('../../modules/Utility.flagr');
const messages = require('./sendsms.handler');
const FreeLiveClass = require('./freeLiveClass');

async function checkLcData(resourceList, liveVideoData) {
    let prevLiveQuestionsId = 0;
    prevLiveQuestionsId = StudenBl.existingResourceList(resourceList, 'LIVE_VIDEO');

    liveVideoData = liveVideoData[0].list;

    const liveVideoDataWithoutPrev = liveVideoData.filter((x) => x._source.id != prevLiveQuestionsId);
    if (liveVideoDataWithoutPrev.length != 0) {
        liveVideoData = liveVideoDataWithoutPrev.slice(0, 1);
    } else {
        liveVideoData = liveVideoData.slice(0, 1);
    }

    return liveVideoData;
}

async function checkTopicVideoData(resourceList, topicVideoData) {
    let prevTopicVideoIds = [];
    prevTopicVideoIds = StudenBl.existingResourceList(resourceList, 'TOPIC_VIDEO');
    prevTopicVideoIds = prevTopicVideoIds.split(',');

    topicVideoData = topicVideoData[0].list;

    if (topicVideoData.length > 0) {
        const topicVideoDataWithoutPrev = topicVideoData.filter((x) => !prevTopicVideoIds.includes(x._source.id));
        if (topicVideoDataWithoutPrev.length > 2) {
            topicVideoData = topicVideoDataWithoutPrev.slice(0, 5);
        } else {
            topicVideoData = topicVideoData.slice(0, 5);
        }
        if (topicVideoData.length <= 2) {
            topicVideoData = [];
        }
    }

    return topicVideoData;
}

async function checkTopicBoosterData(db, chapter, resourceList) {
    let questionId = 0;

    let prevTbId = 0;
    prevTbId = StudenBl.existingResourceList(resourceList, 'TOPIC_MCQ');
    const chapterAliasResponse = await HomePageQuestionMaster.getChapterAliasByChapter(db.mysql.read, chapter);

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
            if (isChapterAliasAllowed && questionId != 0) {
                questionId = quesId;
            }
        }
    }
    return questionId;
}

async function checkPdfData(resourceList, pdfData) {
    let prevPdfIds = [];
    prevPdfIds = StudenBl.existingResourceList(resourceList, 'PDF');
    prevPdfIds = prevPdfIds.split(',');

    pdfData = pdfData[0].list;

    if (pdfData.length > 0) {
        const pdfDataWithoutPrev = pdfData.filter((x) => !prevPdfIds.includes(x._source.resource_path));
        if (pdfDataWithoutPrev.length > 2) {
            pdfData = pdfDataWithoutPrev.slice(0, 5);
        } else {
            pdfData = pdfData.slice(0, 5);
        }

        if (pdfData.length <= 2) {
            pdfData = [];
        }
    }

    return pdfData;
}

async function checkFsData(db, chapter, resourceList, studentClass) {
    let prevfsIds = [];
    prevfsIds = StudenBl.existingResourceList(resourceList, 'FORMULA_SHEET');
    prevfsIds = prevfsIds.split(',');

    let fsData = await DoubtfeedMysql.getFormulaSheets(db.mysql.read, chapter, studentClass);

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
            fsData = fsList;
        }
    }

    return fsData;
}

async function checkDoubtFeedAvailable(db, xAuthToken, chapter, studentId, studentClass, subject, locale) {
    let topicExist = false;

    const currDate = new Date();
    const offset = new Date().getTimezoneOffset();
    if (offset == 0) {
        currDate.setHours(currDate.getHours() + 5);
        currDate.setMinutes(currDate.getMinutes() + 30);
    }
    const dateToBePassed = Utility.getDateFromMysqlDate(currDate);
    let previousTopic = await DoubtfeedMysql.getPreviousTopicByDate(db.mysql.read, studentId, chapter, dateToBePassed);
    const oldTopicExist = previousTopic.length > 0;

    let previousResources = [];
    if (oldTopicExist) {
        previousTopic = previousTopic[0];
        previousResources = await DoubtfeedMysql.getQuestionList(db.mysql.read, previousTopic.id);
    }

    const dailyGoalObj = {
        type: 'live',
        subject,
        chapter,
        class: studentClass,
        student_id: studentId,
        locale,
    };
    let doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
    doubtfeedData = doubtfeedData.liveClass;
    if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
        doubtfeedData.sugg.forEach((x) => {
            x._source = {
                id: x.srcId,
            };
        });
        const elasticData = [{ list: doubtfeedData.sugg }];
        const liveVideoData = await checkLcData(previousResources, elasticData);
        if (liveVideoData.length > 0) {
            topicExist = true;
        }
    }

    if (!topicExist) {
        dailyGoalObj.type = 'video';
        doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
        doubtfeedData = doubtfeedData.video;
        if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
            doubtfeedData.sugg.forEach((x) => {
                x._source = {
                    id: x.srcId,
                };
            });
            const elasticData = [{ list: doubtfeedData.sugg }];
            const topicVideoData = await checkTopicVideoData(previousResources, elasticData);
            if (topicVideoData.length > 0) {
                topicExist = true;
            }
        }
    }

    if (!topicExist) {
        const topicBoosterData = await checkTopicBoosterData(db, chapter, previousResources);
        if (topicBoosterData != 0) {
            topicExist = true;
        }
    }

    if (!topicExist) {
        dailyGoalObj.type = 'pdf';
        doubtfeedData = await FreeLiveClass.getDataForDailyGoal(dailyGoalObj);
        doubtfeedData = doubtfeedData.pdf;
        if (doubtfeedData && Object.keys(doubtfeedData).length !== 0 && doubtfeedData.sugg && doubtfeedData.sugg.length !== 0) {
            doubtfeedData.sugg.forEach((x) => {
                x._source = {
                    resource_path: x._extras.resource_path,
                };
            });
            const elasticData = [{ list: doubtfeedData.sugg }];
            const pdfData = await checkPdfData(previousResources, elasticData);
            if (pdfData.length > 0) {
                topicExist = true;
            }
        }
    }

    if (!topicExist) {
        const fsData = await checkFsData(db, chapter, previousResources, studentClass);
        if (fsData.length > 0) {
            topicExist = true;
        }
    }

    return topicExist;
}

async function DoubtFeedSms(xAuthToken, mobile, locale, questionTopic) {
    const flagData = { xAuthToken, body: { capabilities: { 'sms-doubt-feed': {} } } };
    const flagrResp = await UtilityFlagr.getFlagrResp(flagData);

    if (flagrResp && flagrResp['sms-doubt-feed'] && flagrResp['sms-doubt-feed'].enabled && flagrResp['sms-doubt-feed'].payload.enabled && questionTopic) {
        messages.sendSms({
            mobile,
            msg: locale === 'hi' ? `प्रिये छात्र\n${questionTopic} का डेली गोल है तैयार!\nपढ़ना शुरू करें और आज का लक्ष्य/गोल पूरा करें!\nhttps://doubtnut.app.link/16wFGSlRKgb\nTeam Doubtnut`
                : `Dear Student,\n${questionTopic} ka Daily Goal hai ready!\nPadhna karo shuru aur aaj ka goal karo complete!\nhttps://doubtnut.app.link/16wFGSlRKgb\nRegards,\nTeam Doubtnut`,
            msg_type: 'Unicode_Text',
        });
    }
}

async function doubtfeedGenerateNotif(locale, questionTopic, studentId, gcmId, versionCode) {
    const notificationData = {
        event: 'doubt_feed',
        title: locale === 'hi' ? `${questionTopic} का डाउट फीड है तैयार!` : `${questionTopic} ka Doubt feed hai ready!`,
        message: locale === 'hi' ? 'पढ़ना शुरू करें और आज का लक्ष्य/गोल पूरा करें!' : 'Padhna karo shuru aur aaj ka goal karo complete!',
        image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/FF973C29-A318-DF8D-95BA-B09F6013B4AE.webp',
        firebase_eventtag: 'generated_df_notification',
        data: {},
    };
    if (versionCode >= 921) {
        notificationData.event = 'doubt_feed_2';
        notificationData.title = locale === 'hi' ? `${questionTopic} का डेली गोल है तैयार!` : `${questionTopic} ka Daily Goal hai ready!`;
        notificationData.message = locale === 'hi' ? 'पढ़ना शुरू करें और आज का लक्ष्य/गोल पूरा करें!' : 'Padhna karo shuru aur aaj ka goal karo complete!';
        notificationData.image = 'https://d10lpgp6xz60nq.cloudfront.net/daily_feed_resources/daily-goal-generated.webp';
    }
    Utility.sendFcm(studentId, gcmId, notificationData, null, null);
}

module.exports = {
    checkDoubtFeedAvailable,
    DoubtFeedSms,
    checkLcData,
    checkTopicVideoData,
    checkTopicBoosterData,
    checkPdfData,
    checkFsData,
    doubtfeedGenerateNotif,
};
