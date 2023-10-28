/* eslint-disable no-unused-vars */
const _ = require('lodash');
const configuration = require('../../../config/config');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const Utility = require('../../../modules/utility');
const Data = require('../../../data/data');
const libraryMysql = require('../../../modules/mysql/library');
const personalizationMysql = require('../../../modules/mysql/personalization');
const personalizationContainer = require('../../../modules/containers/personalization');
const FlagrUtility = require('../../../modules/Utility.flagr');
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const QuestionContainer = require('../../../modules/containers/question');

let db; let config;

function paginate(array, page_size, page_number) {
    // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}

function countCheck(arr1, arr2) {
    let count = 0;
    for (let i = 0; i < arr1.length; i++) {
        if (arr2.includes(arr1.question_id)) {
            count += 1;
        }
    }
    return count;
}

async function getDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        let { student_class } = req.user;
        const { locale } = req.user;
        // console.log(req)
        if (_.isNull(student_class)) {
            student_class = 12;
        }
        const student_locale = req.user.locale;
        const ccmArray = [];
        const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, student_id);
        if (typeof checkForPersonalisation !== 'undefined') {
            if (checkForPersonalisation.length > 0) {
                for (let i = 0; i < checkForPersonalisation.length; i++) {
                    ccmArray.push(checkForPersonalisation[i].ccm_id);
                }
            }
        }
        let liveclass_carousel_flag = false;
        try {
            const exp = 'liveclass_carousel_topper_plan';
            const flagrResp = await FlagrUtility.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: student_id.toString(),
                    capabilities: {
                        [exp]: {
                            entityId: student_id.toString(),
                        },
                    },
                },
            }, 200);

            if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload.enabled) {
                liveclass_carousel_flag = true;
            }
        } catch (e) {
            console.log(e);
        }

        const data = {};
        data.student_id = student_id;
        data.ccm_id = ccmArray;
        data.student_class = parseInt(student_class);
        data.locale = student_locale;
        const response = await Utility.getPersonalizedHomePageUsingVariantAttachment({ endpoint: Data.userGetChaptersUrl }, data);
        console.log(response);
        const questionIdArray = [];
        let localizedChapters = [];
        // let resolvedPromises = [];
        if (response.length > 0) {
            const promises = [];
            const microconceptMetaPromise = [];
            for (let i = 0; i < response.length; i++) {
                const chapter = response[i].chapter ? response[i].chapter : response[i].title;
                promises.push(personalizationContainer.getMcVideosByPlaylistId(response[i].id, db));
                microconceptMetaPromise.push(libraryMysql.getMostViewedMicroconcept(response[i].student_class, chapter, db.mysql.read));
            }
            const resolvedPromises = await Promise.all(promises);
            for (let j = 0; j < resolvedPromises.length; j++) {
                if (resolvedPromises[j].length > 0) {
                    for (let k = 0; k < resolvedPromises[j].length; k++) {
                        if (resolvedPromises[j][k].type == 2) questionIdArray.push(resolvedPromises[j][k].question_id);
                    }
                }
            }
            if (locale == 'hi') {
                const chapters = response.map((a) => a.chapter);
                localizedChapters = await personalizationMysql.getLocalizedChapters(chapters, db.mysql.read);
            }
            const mostViewedResolvedPromise = await Promise.all(microconceptMetaPromise);

            const userViewedMc = await personalizationMysql.getVideoViewByQuestionList(questionIdArray, student_id, db.mysql.read);
            const finalResponse = [];
            for (let i = 0; i < response.length; i++) {
                if (locale == 'hi') {
                    response[i].image_url = response[i].image_url.replace('personalization_chapters', 'personalization_chapters/hindi');
                    const a = _.find(localizedChapters, ['chapter_en', response[i].chapter]);
                    if (_.isObject(a)) {
                        response[i].chapter = a.chapter_hi;
                    }
                }


                if (mostViewedResolvedPromise[i].length > 0) {
                    response[i].max_microconcept_viewed = mostViewedResolvedPromise[i][0].max_microconcept_count;
                    response[i].total_microconcepts = mostViewedResolvedPromise[i][0].microconcept_count;
                    const result = resolvedPromises[i].map((a) => a.question_id);
                    const userViewedResult = userViewedMc.map((a) => a.question_id);
                    const intersection = result.filter((element) => userViewedResult.includes(element));
                    response[i].microconcept_viewed = intersection.length;
                    finalResponse.push(response[i]);
                }
            }


            console.log('building playlist');
            const playList = [];
            for (let i = 0; i < response.length; i++) {
                playList.push(response[i].id);
            }
            const liveClassList = await personalizationMysql.getLiveclassByPlaylistId(playList, db.mysql.read, locale.toUpperCase());

            console.log(liveClassList);

            const carousel_data = [];

            const items = [];

            if (liveClassList && liveClassList.length > 0 && liveclass_carousel_flag) {
                for (let i = 0; i < liveClassList.length; i++) {
                    const mappedObject = {
                        title: liveClassList[i].ocr_text,
                        subtitle: liveClassList[i].description,
                        show_whatsapp: false,
                        show_video: true,
                        image_url: buildStaticCdnUrl(`${config.staticCDN}q-thumbnail/${liveClassList[i].question_id}.webp`),
                        aspect_ratio: '',
                        card_width: '1.5x',
                        deeplink: encodeURI(`doubtnutapp://video?qid=${liveClassList[i].question_id}`),
                        id: liveClassList[i].question_id,
                    };
                    items.push(mappedObject);
                }

                carousel_data.push({
                    widget_type: 'horizontal_list',
                    widget_data: {
                        title: 'Live Classes : Lectures',
                        items,
                    },
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    order: -10000,
                });
            }

            const resData = {
                chapters: finalResponse,
                playlist_data: carousel_data,
            };
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: resData,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const resData = {
                chapters: [],
                playlist_data: [],
            };
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: resData,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getChapterDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const { locale } = req.user;
        console.log(student_id);
        const { id } = req.body;
        const promise = [];
        promise.push(personalizationContainer.getDistinctMcByPlaylistId(id, db));
        promise.push(personalizationContainer.getMcVideosByPlaylistId(id, db));
        const resolvedPromises = await Promise.all(promise);
        let response = {};
        if (resolvedPromises[1].length > 0) {
            console.log('inside');
            const videos = resolvedPromises[1].map((a) => a.question_id);
            const newPromise = [];
            newPromise.push(personalizationMysql.getVideoViewByQuestionList(videos, student_id, db.mysql.read));
            newPromise.push(personalizationMysql.getDurationByQuestionList(videos, db.mysql.read));
            const newResolvedPromises = await Promise.all(newPromise);
            response = {
                lecture_videos: {
                    videos: [],
                    total: 0,
                    watched: 0,
                },
                microconcept_videos: {
                    videos: [],
                    total: 0,
                    watched: 0,
                },
            };
            let total_mc_videos = 0;
            let total_question_videos = 0;
            let total_mc_videos_watched = 0;
            let total_question_videos_watched = 0;
            for (let i = 0; i < resolvedPromises[1].length; i++) {
                if (locale == 'hi' && resolvedPromises[1][i].ocr_text_hindi) {
                    resolvedPromises[1][i].ocr_text = resolvedPromises[1][i].ocr_text_hindi;
                }
                delete resolvedPromises[1][i].ocr_text_hindi;
                const a = _.find(newResolvedPromises[1], ['question_id', resolvedPromises[1][i].question_id]);
                const b = _.find(newResolvedPromises[0], ['question_id', resolvedPromises[1][i].question_id]);
                const object = resolvedPromises[1][i];
                object.duration = _.isObject(a) ? a.duration : 0;
                object.answer_id = _.isObject(a) ? a.answer_id : 0;
                if (resolvedPromises[1][i].type == 1) {
                    total_question_videos += 1;
                    if (_.isObject(b)) {
                        total_question_videos_watched += 1;
                    } else {
                        response.lecture_videos.videos.push(object);
                    }
                } else if (resolvedPromises[1][i].type == 2) {
                    total_mc_videos += 1;
                    if (_.isObject(b)) {
                        total_mc_videos_watched += 1;
                    } else {
                        response.microconcept_videos.videos.push(object);
                    }
                }
            }
            response.lecture_videos.total = total_question_videos;
            response.lecture_videos.watched = total_question_videos_watched;
            response.microconcept_videos.total = total_mc_videos;
            response.microconcept_videos.watched = total_mc_videos_watched;

            const playList = [];
            playList.push(id);

            const liveClassList = await personalizationMysql.getLiveclassByPlaylistId(playList, db.mysql.read, locale.toUpperCase());

            console.log(liveClassList);
            const carousel_data = [];

            const items = [];

            if (liveClassList && liveClassList.length > 0) {
                for (let i = 0; i < liveClassList.length; i++) {
                    const mappedObject = {
                        title: liveClassList[i].ocr_text,
                        subtitle: liveClassList[i].description,
                        show_whatsapp: false,
                        show_video: true,
                        card_width: '1.5x',
                        image_url: buildStaticCdnUrl(`${config.staticCDN}q-thumbnail/${liveClassList[i].question_id}.webp`),
                        aspect_ratio: '',
                        deeplink: encodeURI(`doubtnutapp://video?qid=${liveClassList[i].question_id}`),
                        id: liveClassList[i].question_id,
                    };
                    items.push(mappedObject);
                }

                carousel_data.push({
                    widget_type: 'horizontal_list',
                    widget_data: {
                        title: 'Live Classes : Lectures',
                        items,
                    },
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    order: -10000,
                });
            }


            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: response,
                live_class_data: carousel_data,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            response = {
                lecture_videos: {
                    videos: [],
                    total: 0,
                    watched: 0,
                },
                microconcept_videos: {
                    videos: [],
                    total: 0,
                    watched: 0,
                },
            };
            const responseData = {
                meta: {
                    code: 200,
                    message: 'SUCCESS',
                },
                data: response,
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getNextChapters(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        console.log(req.user);

        const data = {};
        data.userId = student_id.toString();
        data.eventAction = 'video_view';
        data.sort = '-eventTime';
        data.endpoint = `${configuration.PASCAL_URL}api/events/video-views/info`;
        const { bookArray } = Data;

        let mappedObject;
        const liveclass_carousel_flag = false;
        /*
        try {
            const exp = 'liveclass_carousel_topper_plan';
            const flagrResp = await FlagrUtility.getFlagrResp({
                url: `${config.microUrl}/api/app-config/flagr`,
                body: {
                    entityId: student_id.toString(),
                    capabilities: {
                        [exp]: {
                            entityId: student_id.toString(),
                        },
                    },
                },
            }, 200);

            if (flagrResp && flagrResp[exp] && flagrResp[exp].enabled && flagrResp[exp].payload.enabled) {
                liveclass_carousel_flag = true;
            }
        } catch (e) {
            console.log(e);
        }
*/


        const responses = await Utility.getPersonalizedHomePageUsingVariantAttachment(data, data);
        console.log(responses);
        if (responses && responses.length > 0 && liveclass_carousel_flag) {
            for (let i = 0; i < responses.length; i++) {
                console.log(responses[i].questionStudentId);
                // eslint-disable-next-line no-await-in-loop
                // const ques_resp = await personalizationMysql.getChapterNameandBookName(db.mysql.read, responses[i].questionId);
                const ques_resp = await QuestionContainer.getByQuestionId(responses[i].questionId, db);

                if (bookArray.includes(responses[i].questionStudentId)) {
                    const title = `Complete ${ques_resp[0].chapter} from ${ques_resp[0].book}`;

                    mappedObject = {
                        chapter: responses[i].chapter,
                        question_id: responses[i].questionId,
                        book: responses[i].book,
                        title,
                    };
                    break;
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: mappedObject,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}


async function getActiveSlots(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;

        const responses = await personalizationMysql.getActiveSlots(db.mysql.read, student_id);

        const mappedObject = [];

        if (responses && responses.length > 0) {
            mappedObject[0] = {
                flag_name: 'lf_morning',
                value: responses[0].lf_1,
            };
            mappedObject[1] = {
                flag_name: 'lf_afternoon',
                value: responses[0].lf_2,
            };
            mappedObject[2] = {
                flag_name: 'lf_evening',
                value: responses[0].lf_3,
            };
            mappedObject[3] = {
                flag_name: 'sf_morning',
                value: responses[0].sf_1,
            };
            mappedObject[4] = {
                flag_name: 'sf_afternoon',
                value: responses[0].sf_2,
            };
            mappedObject[5] = {
                flag_name: 'sf_evening',
                value: responses[0].sf_3,
            };
        }

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: mappedObject,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}


async function getNextChapterDetails(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        console.log(req.body);
        console.log(req.user);
        const { question_id } = req.body;
        let playlist = [];
        console.log(question_id);

        // const responses = await personalizationMysql.getChapterNameandBookName(db.mysql.read, question_id);
        const responses = await QuestionContainer.getByQuestionId(question_id, db);
        console.log(responses);
        if (responses && responses.length > 0) {
            const bookName = responses[0].book;
            const { chapter } = responses[0];
            playlist = await personalizationMysql.getPlaylistWithBookAndChapterName(db.mysql.read, bookName, chapter);
        }

        console.log(playlist);

        const response1 = {
            lecture_videos: {
                videos: playlist,
                total: 0,
                watched: 0,
            },
        };

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: response1,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}


module.exports = {
    getDetails,
    getChapterDetails,
    getNextChapterDetails,
    getNextChapters,
    getActiveSlots,
};
