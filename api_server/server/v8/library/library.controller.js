const _ = require('lodash');
const axios = require('axios');
const libraryMysql = require('../../../modules/mysql/library');
const Utility = require('../../../modules/utility');
const LibTranslation = require('../../../modules/translation/library');
const LanguageContainer = require('../../../modules/containers/language');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const VideoView = require('../../../modules/videoView');
const Data = require('../../../data/data');
const v13AnswerContainer = require('../../v13/answer/answer.container');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const liveClassData = require('../../../data/liveclass.data');
const redisQuestionContainer = require('../../../modules/redis/question');
const { getNextQid } = require('../../v3/tesla/tesla.utils');
const QuestionMysql = require('../../../modules/mysql/question');
const redisUtility = require('../../../modules/redis/utility.redis');
const StudentHelper = require('../../helpers/student.helper');

let db; let config;
const redis = require('../../../modules/redis/library');

// eslint-disable-next-line no-shadow
async function getTotalLikesShare(db, elasticSearchResult, studentId, country, extraDataAdd) {
    try {
        const whiteColor = '#ffffff';
        const durationPromise = [];
        for (let i = 0; i < elasticSearchResult.length; i++) {
            if (elasticSearchResult[i].ocr_text) {
                const str = elasticSearchResult[i].ocr_text.replace(/'/g, "\\'");
                elasticSearchResult[i].ocr_text = str;
            }
            durationPromise.push(AnswerContainer.getByQuestionIdWithTextSolution(elasticSearchResult[i].question_id, db));
            durationPromise.push(QuestionContainer.getTotalViewsNew(elasticSearchResult[i].question_id, db));
        }
        const videoData = await Promise.all(durationPromise);
        for (let i = 0; i < elasticSearchResult.length; i++) {
            if (!videoData[i * 2].length) {
                elasticSearchResult.splice(i, 1);
                i--;
            } else {
                if (videoData[i * 2][0].student_id) {
                    elasticSearchResult[i] = Utility.checkThumbnail(elasticSearchResult[i], Data.thumbnailSid, videoData[i * 2][0].student_id);
                }
                if (extraDataAdd) {
                    elasticSearchResult[i].ocr_text = videoData[i * 2][0].ocr_text || '';
                    elasticSearchResult[i].question = videoData[i * 2][0].question || '';
                }
                if (videoData[i * 2][0].is_text_answered == 1 && videoData[i * 2][0].is_answered == 0) {
                    elasticSearchResult[i].resource_type = 'text';
                    elasticSearchResult[i].duration = 0;
                    videoData[i * 2][0].answer_id = videoData[i * 2][0].text_solution_id;
                    videoData[i * 2][0].answer_video = 'text';
                } else {
                    elasticSearchResult[i].resource_type = 'video';
                    elasticSearchResult[i].duration = (videoData[i * 2][0].duration !== 'NULL' || videoData[i * 2][0].duration) ? 0 : videoData[i * 2][0].duration;
                }
                // eslint-disable-next-line no-await-in-loop
                const ratingData = await UserAnswerFeedbackContainer.getAnswerFeedBackByStudentNew(studentId, videoData[i * 2][0].answer_id, videoData[i * 2][0].answer_video, db);
                elasticSearchResult[i].isLiked = !!(ratingData.length > 0 && ratingData[0].rating > 3);
                elasticSearchResult[i].duration = (videoData[i * 2][0].duration === 'NULL' || videoData[i * 2][0].duration === null) ? 0 : videoData[i * 2][0].duration;
                elasticSearchResult[i].share = (videoData[i * 2 + 1].length) ? videoData[i * 2 + 1][0].share : 10;
                elasticSearchResult[i].like = (videoData[i * 2 + 1].length) ? videoData[i * 2 + 1][0].likes : 10;
                elasticSearchResult[i].views = (videoData[i * 2 + 1].length) ? videoData[i * 2 + 1][0].views : 10;
                elasticSearchResult[i].share_message = (country && country.toLowerCase() === 'us') ? 'Improve your SAT or ACT score with Math, Science and solved Practice Tests Video Solutions only on Doubtnut!!' : 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                elasticSearchResult[i].bg_color = whiteColor;
            }
        }
        return elasticSearchResult;
    } catch (e) {
        console.log(e);
        throw (e);
    }
}

async function getAll(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        let student_class;
        if (req.query.class && req.query.class != '13') {
            student_class = req.query.class;
        } else {
            student_class = req.user.student_class;
        }
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        const promise = [];
        let bannerAndListCache = [];
        const redisCache = await redis.getByKey(`LIBRARY_GET_ALL_CACHE_${student_class}_${version_code}`, db.redis.read);
        if (redisCache != null && redisCache.length) {
            bannerAndListCache = JSON.parse(redisCache);
        } else {
            promise.push(libraryMysql.getLibraryLandingInfoWithVersionCode(db.mysql.read, student_class, version_code));
            promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'LIBRARY', version_code));
            bannerAndListCache = await Promise.all(promise);
            redis.setAllCache(`LIBRARY_GET_ALL_CACHE_${student_class}_${version_code}`, bannerAndListCache, db.redis.write);
        }

        const banner_data = bannerAndListCache[1];
        const playlist_info = bannerAndListCache[0];
        const final_data = [];
        const main_title = new Set();
        const view_type = new Set();
        const final_list = [];
        if (config.service_switch.library_translation && version_code >= 628) {
            await LibTranslation.fetchLandingData(db, playlist_info, req.user.locale);
        }

        for (let i = 0; i < playlist_info.length; i++) {
            main_title.add(playlist_info[i].student_course);
            view_type.add(playlist_info[i].view_type);
            if (typeof final_list[playlist_info[i].student_course] === 'undefined') {
                final_list[playlist_info[i].student_course] = new Set();
            }
            final_list[playlist_info[i].student_course].add(playlist_info[i]);
        }
        const main_title_list = Array.from(main_title);
        const view_type_list = Array.from(view_type);
        for (let i = 0; i < main_title_list.length; i++) {
            const d = {
                title: main_title_list[i],
                view_type: view_type_list[i],
                list: Array.from(final_list[main_title_list[i]]),
            };
            final_data.push(d);
        }

        const banner = [];
        if (banner_data && banner_data.length > 0) {
            for (let i = banner_data.length - 1; i >= 0; i--) {
                banner_data[i].action_data = JSON.parse(banner_data[i].action_data);
                const temp = {};
                temp.scroll_size = '1x';
                temp.list_key = 'library';
                temp.resource_type = 'banner';
                temp.data = [banner_data[i]];
                banner.push(temp);
            }
        }
        // check if user has bought book
        const books = await libraryMysql.getUserBoughtBooks(db.mysql.read, student_id);
        if (books.length) {
            for (let i = 0; i < books.length; i++) {
                delete books[i].description;
            }
            const user_books = { title: 'My Books', view_type: 'BIGX3', list: books };
            final_data.unshift(user_books);
        }
        const banner_view = { title: '', view_type: 'banner', list: banner };
        final_data.unshift(banner_view);

        if (version_code > 870) {
            const ncertData = final_data.filter((x) => x.title === 'NCERT Book Solutions');
            if (ncertData.length > 0) {
                const ncertWatchDetails = await redisQuestionContainer.getNcertLastWatchedDetails(db.redis.read, `ncert_lv_${student_class}`, student_id);
                if (!_.isNull(ncertWatchDetails)) {
                    let nextQid = 0;
                    const ncertIdDetails = ncertWatchDetails.split('_');
                    const lastVideoAccessId = await QuestionMysql.getLastVideoAccessId(db.mysql.read, ncertIdDetails[0], ncertIdDetails[1]);
                    nextQid = await getNextQid(db, nextQid, lastVideoAccessId, ncertIdDetails, student_id);
                    if (nextQid != 0) {
                        final_data.forEach((item) => {
                            if (item.title === 'NCERT Book Solutions') {
                                item.list[0].deeplink = `doubtnutapp://video?qid=${nextQid}&page=NCERT&playlist_id=${ncertIdDetails[0]}`;
                            }
                        });
                    }
                } else if (student_class != 14) {
                    const playlistIdClassWise = await QuestionContainer.getPlaylistIdClassWise(db, student_class);
                    final_data.forEach((item) => {
                        if (item.title === 'NCERT Book Solutions') {
                            item.list[0].deeplink = `doubtnutapp://ncert?playlist_id=${playlistIdClassWise}&playlist_title=NCERT%20Books%20Solutions&is_last=0&page=NCERT`;
                        }
                    });
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: final_data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

// eslint-disable-next-line no-shadow
async function autpPlayVideo(db, config, supportedMediaList, data, student_id, altPackageName = '') {
    const answer = await AnswerContainer.getByQuestionId(data[0].question_id, db);
    if (answer && answer.length && !Data.yt_student_id.includes(answer[0].student_id)) {
        const viewData = {
            student_id,
            question_id: data[0].question_id,
            answer_id: answer[0].answer_id,
            answer_video: answer[0].answer_video,
            video_time: 0,
            engage_time: 0,
            parent_id: 0,
            is_back: 0,
            source: 'android',
            view_from: 'SEARCH_SRP',
        };

        if (altPackageName !== '') {
            viewData.source = altPackageName;
        }

        const [videoStatsInsertData, videoResource] = await Promise.all([VideoView.insertAnswerView(viewData, db.mysql.write), v13AnswerContainer.getAnswerVideoResource(db, config, answer[0].answer_id, data[0].question_id, supportedMediaList)]);
        if (videoStatsInsertData) {
            data[0].video_obj = {
                autoplay: true,
                video_url: `${Data.video_url}${answer[0].answer_video}`,
                question_id: data[0].question_id,
                show_full_screen: true,
                view_id: videoStatsInsertData.insertId || 1,
                video_resources: videoResource,
            };
        }
    }
}

async function getBooksData(database, packageId, studentId, pageNo, limit, country) {
    const data = {};
    const playListId = packageId.split('_');
    data.library_playlist_id = (playListId.length > 3) ? `BOOKS_${playListId[3]}` : 'BOOKS_1';
    data.playlist = [];

    const libData = await redis.getNcertBooksLibraryDataNew(database.redis.read, packageId);
    if (libData != null && libData.length) {
        const parsedLibData = JSON.parse(libData);
        if (parsedLibData && parsedLibData.length) {
            const pageQuesList = parsedLibData.splice((pageNo - 1) * limit, (pageNo * limit));
            if (pageQuesList.length) {
                const mappedQids = [];
                pageQuesList.forEach((x) => {
                    mappedQids.push({ question_id: x });
                });
                const dataAfterFormatting = await getTotalLikesShare(database, mappedQids, studentId, country, true);
                data.playlist = dataAfterFormatting;
                return data;
            }
            return data;
        }
        return data;
    }
    data.meta_info = [{
        icon: `${config.staticCDN}images/empty_playlist.webp`,
        title: 'NO VIDEOS',
        description: 'The videos you watch will appear here! Start Watching Now!',
        Button: 'WATCH TRENDING VIDEOS',
        id: 100780,
        playlist_name: 'TRENDING ON DOUBTNUT',
    }];
    return data;
}

async function topFreeClassesCarousel(item, locale) {
    let shareMessage = locale === 'hi' ? 'Doubtnut के इस फ्री क्लास में मज़ा आ गया! खुद देखो.. मान जाओगे' : 'Doubtnut ke is free class me maza aa gaya! Khud dekho.. maan jaaoge';
    const videoType = await QuestionContainer.getVideoType(db, item.question_id);
    if (videoType === 'LF') {
        shareMessage = locale === 'hi' ? `*${item.ocr_text.trim()}*\nDoubtnut पर ${item.subject} की इस क्लास में मज़ा आ गया! तुम भी देखो और करो अपनी परीक्षा की तैयारी 🙂` : `*${item.ocr_text.trim()}*\nDoubtnut par ${item.subject} ki is class mein maza aa gaya! Tum bhi dekho aur karo apne exam ki taiyaari 🙂`;
    }
    return {
        question_id: item.question_id,
        class: item.class,
        subject: item.subject,
        chapter: item.chapter,
        doubt: item.doubt,
        question: item.question,
        thumbnail_image: `${config.staticCDN}q-thumbnail/${item.question_id}.png`,
        image_url: `${config.staticCDN}q-thumbnail/${item.question_id}.png`,
        resource_type: 'video',
        bg_color: '#ffffff',
        share_message: shareMessage,
    };
}

async function getTopFreeClasses(subject, chapter, locale, studentClass, limit, pageNo) {
    try {
        const tableLocale = liveClassData.localeMapping[locale];
        let topFreeClassesData = await CourseV2Mysql.getTopFreeClassesByChapterSubjectClassLocale(db.mysql.read, studentClass, tableLocale, subject, chapter, limit, Utility.getOffset(pageNo, limit));
        // * No need of ocr text, need to display question thumbnail instead
        const topFreeCarouselsPromises = [];
        // eslint-disable-next-line array-callback-return
        topFreeClassesData.map((item) => { topFreeCarouselsPromises.push(topFreeClassesCarousel(item, locale)); });
        topFreeClassesData = await Promise.all(topFreeCarouselsPromises);
        return topFreeClassesData;
    } catch (e) {
        console.log(e);
    }
}

async function getTopTeachersClasses(subject, chapter, locale, studentClass, limit, pageNo, playlistId) {
    try {
        const getQuery = await CourseV2Mysql.getTopTeachersQueryByPlaylist(db.mysql.read, playlistId);
        if (getQuery.length) {
            let newQuery = getQuery[0].resource_path.replace(/\n/g, ' ');
            const searchTxt = 'limit';
            const regEscape = (v) => v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            newQuery = newQuery.split(new RegExp(regEscape(searchTxt), 'ig'))[0];
            const newOffset = Utility.getOffset(pageNo, limit);
            newQuery = `${newQuery} limit 10 offset ${newOffset}`;
            let topFreeClassesData = await CourseV2Mysql.getTopTeachersAllVideosByQuery(db.mysql.read, newQuery);
            // * No need of ocr text, need to display question thumbnail instead
            topFreeClassesData = topFreeClassesData.map((item) => ({
                question_id: item.question_id,
                class: item.class,
                subject: item.subject,
                chapter: item.chapter,
                doubt: item.doubt,
                question: item.question,
                thumbnail_image: `${config.staticCDN}q-thumbnail/${item.question_id}.png`,
                image_url: `${config.staticCDN}q-thumbnail/${item.question_id}.png`,
                resource_type: 'video',
                bg_color: '#ffffff',
                share_message: locale === 'hi' ? 'Doubtnut के इस फ्री क्लास में मज़ा आ गया! खुद देखो.. मान जाओगे' : 'Doubtnut ke is free class me maza aa gaya! Khud dekho.. maan jaaoge',
            }));
            return topFreeClassesData;
        }
        return [];
    } catch (e) {
        console.log(e);
    }
}

function prioritiseThumbnailOverOCR(playlistId, data) {
    // To prioritise thumbnail over ocr_text, need to remove ocr_text
    try {
        // 484800 - NKC Sir Playlist
        const allowedPlaylistIds = ['484800'];
        if (allowedPlaylistIds.includes(playlistId.toString())) {
            for (const video of data) {
                if (video.image_url) {
                    video.ocr_text = '';
                }
            }
        }
        return data;
    } catch (e) {
        console.error(e);
        return data;
    }
}

function ncertPlaylistVideo(item) {
    let qTag = item.doubt.split('_');
    const question = qTag[qTag.length - 1];
    let exercise = qTag[qTag.length - 2];
    exercise = exercise.slice(1, exercise.length);
    let chap = qTag[qTag.length - 3];
    qTag = `Exercise ${exercise} Question ${question}`;
    if (chap[0] == 'C') {
        chap = chap.slice(1, chap.length);
        qTag = `Ex ${chap}.${exercise} Question ${question}`;
    }
    const data = {
        id: 948175,
        class: '6',
        chapter: 'UNDERSTANDING ELEMENTARY SHAPES',
        target_course: 'BOARDS',
        package: 'Skip',
        type: 'Find the value(Non Integer Type)',
        aptitude_type: 'Yes',
        doubtnut_recommended: 'Recommended',
        is_skipped: 0,
        subject: null,
        questions_title: null,
        meta_tags: null,
        packages: 'NCERT',
        resource_type: 'video',
        share_message: 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge',
        bg_color: '#ffffff',
        question_tag: qTag,
    };
    for (const key of Object.keys(item)) {
        data[key] = item[key];
    }
    return data;
}

async function getResource(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const readMysql = db.mysql.read;
        const { student_id, student_class, locale } = req.user;
        const {
            auto_play_data, page_no, id, package_details_id: packageId, question_ids,
        } = req.query;
        const supportedMediaList = (req.query.supported_media_type) ? _.split(decodeURIComponent(req.query.supported_media_type), ',') : [];
        const country = req.headers.country || null;
        const { country: region } = req.headers;
        const version_code = req.headers.version_code || 602;
        const limit = 10;

        const splitId = id.split('_');
        if (id.includes('NCERTNOTIF')) {
            let playListRawData = await redis.getNcertPlayList(db.redis.read, `NCERT_PLAYLIST_${splitId[1]}`);
            playListRawData = JSON.parse(playListRawData);
            const playListData = [];
            for (let i = 0; i < playListRawData.length; i++) {
                playListData.push(ncertPlaylistVideo(playListRawData[i]));
            }
            const ncertNotifData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    playlist: playListData,
                    library_playlist_id: 'NCERT',
                },
            };
            return res.status(ncertNotifData.meta.code).json(ncertNotifData);
        }
        if (splitId.length > 2) {
            // * id will contain subject, chapter and playlist id for query from TOP_TEACHERS_CLASSES page
            const subject = splitId[0];
            const chapter = decodeURIComponent(splitId[1]);
            const playlistId = splitId[2];
            const freeClasses = await getTopTeachersClasses(subject, chapter, locale, student_class, limit, page_no, playlistId);
            const topTeachersFreeClassesResponseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    library_playlist_id: chapter,
                    playlist: freeClasses,
                },
            };
            return res.status(topTeachersFreeClassesResponseData.meta.code).json(topTeachersFreeClassesResponseData);
        }
        if (splitId.length > 1) {
            // * id will contain subject and chapter from TOP_FREE_CLASSES page
            const subject = splitId[0];
            const chapter = splitId[1];
            const topFreeClassesData = await getTopFreeClasses(subject, chapter, locale, student_class, limit, page_no);
            const topFreeClassesResponseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    library_playlist_id: chapter,
                    playlist: topFreeClassesData,
                },
            };
            return res.status(topFreeClassesResponseData.meta.code).json(topFreeClassesResponseData);
        }
        if (packageId && packageId.length && packageId.split('_').length > 4 && version_code >= 855 && !question_ids) {
            const libBooksData = await getBooksData(db, packageId, student_id, page_no, limit, null);
            const libraryResponseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: libBooksData,
            };
            return res.status(libraryResponseData.meta.code).json(libraryResponseData);
        }

        const lang = await LanguageContainer.getByCode(req.user.locale, db);
        const language = (lang.length) ? lang[0].language : 'english';

        let data = {};
        const data1 = await libraryMysql.getcheckPlaylist(db.mysql.read, student_class, student_id, id);
        const redisKey = `LIBRARY_RESOURCE_DATA_${id}_${version_code}_${page_no}_${language}`;
        if (data1.length && data1[0].id !== 1 && data1[0].description !== 'HISTORY' && data1[0].parent != 0 && !_.includes(Data.nonCachedLibIDs, data1[0].id) && version_code > 634 && !question_ids) {
            let libData;
            if (id === '465436') {
                libData = await redis.getVikramSirResourseData(db.redis.read, id, language, version_code, page_no);
            } else {
                libData = await redis.getResourceData(db.redis.read, id, language, version_code, page_no);
            }
            if (!_.isNull(libData)) {
                data = JSON.parse(libData);
            }
        }

        if (Object.entries(data).length === 0) {
            // check in herding key
            if (await redisUtility.cacheHerdingKeyExists(db.redis.read, redisKey) && !question_ids) {
                const emptyData = {};
                if (page_no !== '1') {
                    emptyData.library_playlist_id = 'NCERT';
                } else {
                    emptyData.meta_info = [{
                        icon: `${config.staticCDN}images/empty_playlist.webp`,
                        title: 'System is Busy',
                        description: 'Please Try After Some Time',
                    }];
                }
                emptyData.playlist = [];
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: emptyData,
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            await redisUtility.setCacheHerdingKey(db.redis.write, redisKey);

            if (country && country.toLowerCase() === 'us') {
                data.library_playlist_id = id;
            } else if (data1[0].parent !== null && data1[0].parent !== '0') {
                const masterParentData = await libraryMysql.getcheckPlaylist(db.mysql.read, student_class, student_id, data1[0].master_parent);
                data.library_playlist_id = masterParentData[0].description;
            } else if (data1[0].parent === null && data1[0].id !== 1 && data1[0].student_id !== '98') {
                data.library_playlist_id = data1[0].description;
            } else {
                data.library_playlist_id = data1[0].id;
            }

            let data3 = await libraryMysql.getResource(db.mysql.read, student_class, student_id, id);

            /*
            this is an intercept for personlisation module, if new_library has resource type as playlist_api we will hit pascal url to get data
             */
            if (data3[0].resource_type == 'playlist_api' && page_no === '1') {
                const micro_response = await axios.get(`${config.PASCAL_URL}api/chapter/top/${data3[0].id}`);
                data3 = micro_response.data;
            } else if (data3[0].resource_type == 'playlist_api' && page_no !== '1') {
                data3 = [];
            } else if (data3[0].is_last == 1 && data3[0].resource_type !== 'playlist_api') {
                let str = _.replace(data3[0].resource_path, /xxlanxx/g, language);
                str = _.replace(str, /xxclsxx/g, student_class);
                str = _.replace(str, /xxsidxx/g, student_id);
                str = _.replace(str, /xxplaylistxx/g, id);
                if (question_ids) {
                    str = _.replace(str, /xxqidsxx/g, question_ids);
                }
                console.log(str);
                // for playlist based on last watched video
                if (_.includes(Data.libNotificationIds, data1[0].id)) {
                    const [lastWatchedVideo] = await studentCourseMapping.getLatestWatchedVideo(db.mysql.read, student_id);
                    const studentCcmId = req.user.ccm_data;
                    if (lastWatchedVideo.length && lastWatchedVideo[0].answer_id && studentCcmId.length && studentCcmId[0].id) {
                        str = _.replace(str, /xxccmxx/g, studentCcmId[0].id);
                        str = _.replace(str, /xxaidxx/g, lastWatchedVideo[0].answer_id);
                    }
                }
                let sql = str;
                if (!question_ids) {
                    sql = `${str} limit ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
                }
                data3 = await readMysql.query(sql, [data3[0].id]);
            }
            if (data3.length === 0 && page_no === '1' && (data1[0].description === 'HISTORY' || data1[0].description === 'DPP' || data1[0].description !== 'TRENDING')) {
                data.meta_info = [{
                    icon: `${config.staticCDN}images/empty_playlist.webp`,
                    title: 'NO VIDEOS',
                    description: data1[0].empty_text,
                    Button: 'WATCH TRENDING VIDEOS',
                    id: '100780',
                    playlist_name: 'TRENDING ON DOUBTNUT',
                }];
            } else if (data3.length === 0 && page_no === '1' && (data1[0].description !== 'HISTORY' || data1[0].description !== 'DPP' || data1[0].description === 'TRENDING')) {
                data.meta_info = [{
                    icon: `${config.staticCDN}images/empty_playlist.webp`,
                    title: 'No Saved Videos',
                    description: Utility.isUsRegion(region) ? 'Watch your saved videos' : 'Aapki saari saved Videos milengi yahan',
                }];
            } else {
                data3 = await getTotalLikesShare(db, data3, student_id, country, false);
                data3 = Utility.addWebpThumbnail([data3], config);
                if (country && country.toLowerCase() !== 'us') {
                    const whatsappData = await appConfigConatiner.getWhatsappData(db, student_class);
                    if (whatsappData.length > 0 && page_no === '1') {
                        Utility.getWhatsappDataModified(whatsappData);
                        data3[0].splice(Data.whatsappCardPosition, 0, whatsappData[0]);
                    }
                }

                data3[0] = prioritiseThumbnailOverOCR(id, data3[0]);

                data.playlist = data3[0];
                if (question_ids && page_no != '1') {
                    data.playlist = [];
                }
            }
            if (data1.length && data1[0].id !== 1 && data1[0].description !== 'HISTORY' && data1[0].parent != 0 && !_.includes(Data.nonCachedLibIDs, data1[0].id) && version_code > 634 && !question_ids) {
                if (id === '465436') {
                    redis.setVikramSirResourseData(db.redis.write, data, id, language, version_code, page_no);
                } else {
                    redis.setResourceData(db.redis.write, data, id, language, version_code, page_no);
                }
            }
            redisUtility.removeCacheHerdingKey(db.redis.write, redisKey);
        }

        if (auto_play_data && auto_play_data === '1' && version_code > 740 && page_no === '1' && data.playlist && data.playlist.length && data.playlist[0].resource_type && data.playlist[0].resource_type === 'video') {
            let altPackageName = '';
            if (StudentHelper.isAltApp(req.headers.package_name)) {
                // we are adding alt app name, only the next part of com.doubtnut, after page name
                altPackageName = req.headers.package_name.split('.').slice(2).join('_');
            }
            await autpPlayVideo(db, config, supportedMediaList, data.playlist, student_id, altPackageName);
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
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

module.exports = { getResource, getAll, getTotalLikesShare };
