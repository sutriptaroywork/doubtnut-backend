const _ = require('lodash');
const moment = require('moment');
const axios = require('axios');
const staticData = require('../../../data/data');
const LanguageContainer = require('../../../modules/containers/language');
const Utility = require('../../../modules/utility');
const QuestionContainer = require('../../../modules/containers/question');
const mysqlQuestionContainer = require('../../../modules/mysql/question');
const Liveclass = require('../../../modules/mysql/liveclass');
const DoubtfeedMysql = require('../../../modules/mysql/doubtfeed');
const DoubtFeedHelper = require('../../helpers/doubtfeed.helper');
const { isStudyGroupEnabled } = require('../../v1/studyGroup/studyGroup.controller');
const studyGroupMySql = require('../../../modules/mysql/studyGroup');
const studyGroupRedis = require('../../../modules/redis/studygroup');

const CDN_URL = 'https://d10lpgp6xz60nq.cloudfront.net/';
const TOTAL_MEMBERS_TO_SEND_LIVE_CLASS = 2;

function getResponseStructure(ocr_text) {
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {
            answer_id: '',
            expert_id: '',
            question_id: '',
            question: '',
            doubt: '',
            video_name: '',
            answer_video: '',
            fallback_answer_video: '',
            hls_timeout: 0,
            answer_rating: '',
            answer_feedback: '',
            thumbnail_image: '',
            isLiked: true,
            isDisliked: false,
            isPlaylistAdded: false,
            isBookmarked: false,
            view_id: '',
            title: '',
            weburl: '',
            description: '',
            type: '',
            id: '',
            likes_count: 0,
            dislikes_count: 0,
            share_count: 0,
            resource_type: '',
            is_shareable: false,
            ocr_text,
        },
    };
    return responseData;
}

async function advancedSearchWithFilter(staticParams, studentId, ocr, filter) {
    const chapters = filter.map((x) => x.chapter);
    const [elasticResult, languagesArrays] = await Promise.all([
        staticParams.elasticSearchInstance.findByOcrUsingIndexWithFilter(staticParams.config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, ocr, { chapters }),
        LanguageContainer.getList(staticParams.db),
    ]);
    const languagesObj = Utility.getLanguageObject(languagesArrays);
    const stLangCode = 'en';
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }

    let matchesArray = elasticResult.hits ? elasticResult.hits.hits : [];
    matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, staticParams.config, [staticData.color.white], language, stLangCode, {}, {}, staticParams.db, studentId, staticParams.xAuthToken, staticParams.versionCode);
    return matchesArray;
}

async function advancedSearchWithFilterV3(staticParams, studentId, ocr, filter, locale) {
    // let advanceSearchFilterVariant =await FlaggrUitlity.getVariantAttachment(null,{},87);
    const [elasticResult, languagesArrays] = await Promise.all([
        staticParams.elasticSearchInstance.findByOcrUsingIndexWithFilterV3(staticParams.config.elastic.REPO_INDEX_WITH_CHAPTER_ALIAS, ocr, filter),
        LanguageContainer.getList(staticParams.db),
    ]);
    const languagesObj = Utility.getLanguageObject(languagesArrays);
    const stLangCode = 'en';
    let language = languagesObj[stLangCode];
    if (typeof language === 'undefined') {
        language = 'english';
    }
    let matchesArray = elasticResult.hits ? elasticResult.hits.hits : [];
    if (matchesArray && matchesArray.length > 0) {
        matchesArray = await QuestionContainer.getQuestionStatsNew(matchesArray, staticParams.config, [staticData.color.white], language, stLangCode, {}, {}, staticParams.db, studentId, staticParams.xAuthToken, staticParams.versionCode);
    }
    let flag = 0;
    filter.forEach((x) => {
        if (x.terms.video_language_display) {
            flag++;
        }
    });
    if (locale && locale != 'en' && flag === 0) {
        for (let i = 0; i < matchesArray.length; i++) {
            const lang = staticData.languageObject[locale];
            // eslint-disable-next-line no-await-in-loop
            const localizedQuestion = await mysqlQuestionContainer.getLocalisedQuestion(matchesArray[i]._id, lang, staticParams.db.mysql.read);
            if (localizedQuestion.length === 1 && !_.isEmpty(localizedQuestion[0][lang])) {
                matchesArray[i]._source.ocr_text = localizedQuestion[0][lang];
            }
        }
    }
    return matchesArray;
}

function pushFacetCard(matchArray, facets, position) {
    if ((!position && position !== 0) || position < 0 || !facets) {
        return;
    }
    const card = {
        _index: null,
        _type: null,
        _id: null,
        _score: 1,
        _source: {
            ocr_text: null,
            bg_color: staticData.color.white,
            isLiked: false,
            duration: 0,
            views: null,
            share_message: null,
        },
        resource_type: 'facet',
        is_locked: 0,
        question_thumbnail: null,
        facets,
    };
    facets.sort((a, b) => a.isSelected || b.isSelected);
    matchArray.splice(position, 0, card);
}

function pushFacetCardV3(matchArray, facets, position) {
    if ((!position && position !== 0) || position < 0 || !facets) {
        return;
    }
    const card = {
        _index: null,
        _type: null,
        _id: null,
        _score: 1,
        _source: {
            ocr_text: null,
            bg_color: staticData.color.white,
            isLiked: false,
            duration: 0,
            views: null,
            share_message: null,
        },
        resource_type: 'facets_v2',
        is_locked: 0,
        question_thumbnail: null,
        facets_v2: facets,
    };
    facets.sort((a, b) => a.isSelected || b.isSelected);
    matchArray.splice(position, 0, card);
}

function pushBountyCard(matchesArray, isBounty) {
    const obj = {
        resource_type: 'bounty',
        title: 'Padhao Aur Kamao Kya Hai ?',
        text: 'Padhao Aur Kamao',
        button_text: 'Post Your Doubts',
    };
    if (isBounty == 'bounty') {
        matchesArray.splice(4, 0, obj);
    } else {
        matchesArray.push(obj);
    }
    return matchesArray;
}

async function handleYoutubeSearchPage(db, youtubeQid, youtube_id, parent_id, student_id, ocr_text, Question) {
    const youtubeData = {
        youtube_id,
        is_show: 1,
        is_click: 1,
    };
    const isFirstVideoWatched = await Question.getYoutubeStats(db.mysql.read, youtubeQid);
    if (isFirstVideoWatched && isFirstVideoWatched[0] && isFirstVideoWatched[0].is_click) {
        youtubeData.question_id = parent_id;
        youtubeData.student_id = student_id;
        await Question.insertYoutubeStats(db.mysql.write, youtubeData);
    } else {
        await Question.updateYoutubeStats(db.mysql.write, youtubeData, youtubeQid);
    }
    const responseData = getResponseStructure(ocr_text);
    responseData.data.is_youtube = true;
    responseData.data.youtube_id = youtube_id;
    return responseData;
}

async function handleWolframSolution(config, parent_id, ocr_text, html, _Utility, sqs, sns, matchedQuestionSnsUrl, QuestionHelper) {
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
    const responseData = getResponseStructure(ocr_text);
    responseData.data.resource_type = 'dynamic_text';
    responseData.data.resource_data = html;
    return responseData;
}

function doesMatchAdvanceSearchFilterCriterion(unfiltered_arr_obj, filter_criterion) {
    let flag = 0;
    for (let j = 0; j < filter_criterion.length; j++) {
        for (let m = 0; m < filter_criterion[j].data.length; m++) {
            if (filter_criterion[j].isSelected && filter_criterion[j].data[m].isSelected && filter_criterion[j].data[m].data.indexOf(unfiltered_arr_obj[filter_criterion[j].facetType]) > -1) {
                flag += 1;
            }
        }
    }
    if (flag >= filter_criterion.length) {
        return true;
    }
    return false;
}

// function getDataSelectionRestored(prev_selected_facet_arr, next_selected_facet_arr) {
//     const prev_selected_facet_obj = prev_selected_facet_arr.filter((x) => x.isSelected);
//     for (let i = 0; i < next_selected_facet_arr.length; i++) {
//         if (prev_selected_facet_obj && (prev_selected_facet_obj[0].display == next_selected_facet_arr[i].display)) {
//             next_selected_facet_arr[i].isSelected = 1;
//         }
//     }
//     return next_selected_facet_arr;
// }

function getSelectedFacetRestored(prevFacets, nextFacets = []) {
    const facets = [];
    if (nextFacets.length === 0) {
        for (let m = 0; m < prevFacets.length; m++) {
            if (prevFacets[m].isSelected) {
                facets.push(prevFacets[m]);
            }
        }
        return facets;
    }
    const research_facets_types = ['chapter', 'class'];
    const filter_facets_types = ['video_language_display', 'video_language', 'subject'];
    const nextFacetTypesList = nextFacets.map((x) => x.facetType);
    for (let i = 0; i < prevFacets.length; i++) {
        if (prevFacets[i].isSelected && research_facets_types.includes(prevFacets[i].facetType) && !nextFacetTypesList.includes(prevFacets[i].facetType)) {
            nextFacets.push(prevFacets[i]);
        } else if (prevFacets[i].isSelected && filter_facets_types.includes(prevFacets[i].facetType) && !nextFacetTypesList.includes(prevFacets[i].facetType)) {
            nextFacets.push({ ...prevFacets[i], data: prevFacets[i].data.filter((x) => x.isSelected) });
        } else if (prevFacets[i].isSelected && nextFacetTypesList.includes(prevFacets[i].facetType)) {
            console.log('nothing to do');
            for (let k = 0; k < nextFacets.length; k++) {
                if (nextFacets[k].facetType == prevFacets[i].facetType) {
                    nextFacets[k] = { ...nextFacets[k], isSelected: true, data: prevFacets[i].data.filter((x) => x.isSelected) };
                }
            }
        }
    }
    return nextFacets;
}

async function storeSimilarDataIntoRedis(db, page, questionId, userId) {
    const qDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, questionId);
    if (qDetails.length != 0 && !_.isEmpty(qDetails[0].chapter) && qDetails[0].student_id < 99 && qDetails[0].student_id != -55) {
        QuestionContainer.similarData(db, page, questionId, qDetails[0].chapter, qDetails[0].student_id, userId);
    }
}

async function newTagListMaker(db, questionData, student_class) {
    const bookName = await mysqlQuestionContainer.getVideoLangCode(questionData.question_id, db.mysql.read);
    const exerciseArr = questionData.doubt.split('_');
    const exerciseCode = exerciseArr[exerciseArr.length - 2];
    let exercise = '';
    if (exerciseCode === 'SLV') {
        exercise = 'Solved Ex';
    } else if (exerciseCode === 'MEX') {
        exercise = 'Misc Ex';
    } else if (exerciseCode.includes('E', 0)) {
        const exerciseNumber = exerciseCode.slice(-2);
        if (exerciseNumber.includes('0', 0)) {
            exercise = `Ex ${exerciseNumber.slice(-1)}`;
        } else {
            exercise = `Ex ${exerciseNumber}`;
        }
    }

    const likedVideos = await mysqlQuestionContainer.getLikedVideos(db.mysql.read, questionData.student_id);
    const liveVideos = await Liveclass.getLiveClassByChapter(db.mysql.read, questionData.chapter, student_class);

    // making tags list
    const tagList = [
        {
            type: 'all',
            key: 'all',
            title: 'All',
            is_api_call: false,
        },
        {
            type: 'book',
            key: `${bookName[0].student_id}`,
            title: `${bookName[0].package}`,
            is_api_call: false,
        },
        {
            type: 'chapter',
            key: `${questionData.chapter}`,
            title: `${questionData.chapter}`,
            is_api_call: false,
        },
        {
            type: 'exercise',
            key: `${exercise}`,
            title: `${exercise}`,
            is_api_call: false,
        },
    ];

    if (likedVideos.legnth > 0) {
        tagList.push({
            type: 'liked',
            key: 'Liked Videos',
            title: 'Liked Videos',
            is_api_call: true,
        });
    }
    if (liveVideos.length > 0) {
        tagList.push({
            type: 'live',
            key: 'Live Videos',
            title: 'Live Videos',
            is_api_call: true,
        });
    }
    return tagList;
}

async function addChapterData(db, xAuthToken, versionCode, studentId, locale, mobile, gcmId, questionId, parentId) {
    const questionDetails = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, questionId);
    if (questionDetails.length > 0) {
        let { subject } = questionDetails[0];
        const wrongChapterArray = [' ', 'NULL', 'Default', 'DEFAULT', 'default'];
        if (wrongChapterArray.includes(subject)) {
            subject = '';
        }
        const topic = questionDetails[0].chapter;
        const classVal = questionDetails[0].class;
        if (topic != '' && topic != 'DEFAULT') {
            const topicDetails = await DoubtfeedMysql.getTopicDetails(db.mysql.read, studentId, topic);
            if (topicDetails.length > 0) {
                let qList = topicDetails[0].qid_list;
                if (qList.includes(',')) {
                    qList = qList.split(',');
                } else {
                    qList = [qList];
                }
                if (!qList.includes(parentId)) {
                    qList.unshift(parentId);
                    qList = qList.join();
                    // DoubtfeedMysql.updateQuestionId(db.mysql.write, topicDetails[0].id, qList);
                }
            } else {
                const checkTopicDataAvalability = await DoubtFeedHelper.checkDoubtFeedAvailable(db, xAuthToken, topic, studentId, classVal, subject, locale);
                if (checkTopicDataAvalability) {
                    const obj = {
                        sid: studentId,
                        qid_list: parentId,
                        topic,
                        subject,
                    };
                    DoubtfeedMysql.setTopicDetails(db.mysql.write, obj);
                    DoubtFeedHelper.DoubtFeedSms(xAuthToken, mobile, locale, topic);
                    DoubtFeedHelper.doubtfeedGenerateNotif(locale, topic, studentId, gcmId, versionCode);
                }
            }
        }
    }
}

async function storeDoubtFeedTopic(db, xAuthToken, versionCode, studentId, locale, mobile, gcmId, questionId, parentId) {
    const todaysTopics = await DoubtfeedMysql.getTodaysTopics(db.mysql.read, studentId);
    let mainFlag = 0;
    if (todaysTopics.length > 0) {
        let flag = 0;
        todaysTopics.forEach((x) => {
            let qList = x.qid_list;
            if (qList.includes(',')) {
                qList = qList.split(',');
            } else {
                qList = [qList];
            }
            if (qList.includes(parentId)) {
                flag = 1;
            }
        });

        if (flag === 0) {
            mainFlag = 1;
        }
    } else {
        mainFlag = 1;
    }

    if (mainFlag === 1) {
        addChapterData(db, xAuthToken, versionCode, studentId, locale, mobile, gcmId, questionId, parentId);
    }
}

async function postMessage(data, isPublicMessage, request) {
    try {
        const microService = {
            method: 'post',
            url: isPublicMessage ? 'https://micro.doubtnut.com/api/study-group/post' : 'https://micro.doubtnut.com/api/chatroom/post',
            headers: {
                'x-auth-token': request.headers['x-auth-token'],
                'Content-Type': 'application/json',
                Cookie: '__cfduid=d117dc0091ddb32cee1131365a76a7c931617628174',
            },
            data,
        };

        axios(microService)
            .then((response) => {
                console.log(JSON.stringify(response.data));
            })
            .catch((error) => {
                console.log(error);
            });
        return true;
    } catch (e) {
        return false;
    }
}

async function sendNotification(db, studentId, studentName, roomIdList, topic) {
    try {
        const studentIds = new Set();
        const studentList = [];
        for (const roomId of roomIdList) {
            let studyGroupData = await studyGroupRedis.getStudyGroupDetail(roomId, 'GROUP_INFO', db.redis.read);
            if (!_.isNull(studyGroupData)) {
                studyGroupData = JSON.parse(studyGroupData);
                for (const student of studyGroupData.members) {
                    studentIds.add(student.student_id);
                    studentList.push({
                        student_id: student.student_id,
                        group_name: studyGroupData.groupName,
                        group_id: roomId,
                    });
                }
            }
        }
        if (studentList.length) {
            const gcmData = {};
            const gcmList = await studyGroupMySql.getStudentGcmId([...studentIds], db.mysql.read);
            for (let i = 0; i < gcmList.length; i++) {
                gcmData[gcmList[i].student_id] = gcmList[i].gcm_reg_id;
            }

            for (const student of studentList) {
                if (student.student_id !== studentId && gcmData[student.student_id]) {
                    const notificationData = {
                        event: 'study_group_chat',
                        title: `${studentName} ne dekhna start kar diya hai ${topic} pe live class`,
                        message: `Join karen ${unescape(student.group_name)} and padhen saath mein`,
                        image: null,
                        firebase_eventtag: 'studygroup',
                        data: { group_id: student.group_id, is_faq: false },
                    };
                    Utility.sendFcm(student.student_id, gcmData[student.student_id], notificationData, null, null);
                }
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

async function postStudyGroupMessage(db, req, topic, ocrText) {
    try {
        const currMilliSecond = moment().valueOf();
        const roomIds = await studyGroupMySql.getGroupIdBySId(req.user.student_id, TOTAL_MEMBERS_TO_SEND_LIVE_CLASS, db.mysql.read);
        if (roomIds.length) {
            const studentName = req.user.student_fname || 'Doubtnut User';

            for (let i = 0; i < roomIds.length; i++) {
                const childWidget = {
                    widget_data: {
                        deeplink: `doubtnutapp://video?qid=${req.body.id}&page=STUDYGROUP`,
                        question_text: ocrText,
                        id: 'question',
                    },
                    widget_type: 'widget_asked_question',
                };
                const message = {
                    widget_data: {
                        child_widget: childWidget,
                        created_at: currMilliSecond,
                        student_img_url: `${CDN_URL}images/upload_45917205_1619087619.png`,
                        title: `${studentName} started watching a live class`,
                        sender_detail: 'Sent by Doubtnut',
                        visibility_message: '',
                        widget_display_name: 'Image',
                        cta_text: `Join ${studentName}`,
                        deeplink: `doubtnutapp://video?qid=${req.body.id}&page=STUDYGROUP`,
                        cta_color: '#ea532c',
                    },
                    widget_type: 'widget_study_group_parent',
                };

                const data = JSON.stringify({
                    message,
                    room_id: roomIds[i],
                    room_type: 'study_group',
                    student_id: req.user.student_id,
                    attachment: '',
                    attachment_mime_type: '',
                    student_displayname: 'Doubtnut',
                    student_img_url: `${CDN_URL}images/upload_45917205_1619087619.png`,
                });
                postMessage(data, roomIds[i].startsWith('pg-'), req);
                await new Promise((resolve) => setTimeout(resolve, 300));
            }
            // await sendNotification(db, req.user.student_id, studentName, roomIds, topic);
        }
        return true;
    } catch (e) {
        return false;
    }
}

function isLiveClassOngoing(liveClassStreamDetails, classDuration) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    return now.isBetween(moment(liveClassStreamDetails.live_at), moment(liveClassStreamDetails.live_at).add(parseInt(classDuration), 'seconds'));
}

async function liveClassStudyGroupMessage(db, req, streamObject, classDuration) {
    try {
        const isStudyGroup = await isStudyGroupEnabled(req);
        if (isStudyGroup.isGroupExist) {
            let sendMsg = false;
            // Both conditions are to check if the live class is currently streaming or not
            // If resource_type = 4, it should have stream_status to be ACTIVE, to know it is streaming right now
            if (streamObject.resource_type === 4 && streamObject.stream_status === 'ACTIVE') {
                sendMsg = true;
            } else if ((streamObject.resource_type === 1 || streamObject.resource_type === 8) && isLiveClassOngoing(streamObject, classDuration)) {
                // If resource_type = 1 or 8, we have check currentTime with submission of live_at and duration
                sendMsg = true;
            }

            if (sendMsg) {
                await postStudyGroupMessage(db, req, streamObject.topic, streamObject.display);
            }
        }
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    advancedSearchWithFilter,
    pushFacetCard,
    pushBountyCard,
    advancedSearchWithFilterV3,
    pushFacetCardV3,
    handleYoutubeSearchPage,
    handleWolframSolution,
    doesMatchAdvanceSearchFilterCriterion,
    getSelectedFacetRestored,
    storeSimilarDataIntoRedis,
    newTagListMaker,
    storeDoubtFeedTopic,
    liveClassStudyGroupMessage,
    postStudyGroupMessage,
    postMessage,
};
