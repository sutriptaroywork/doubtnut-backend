const _ = require('lodash');
const libraryMysql = require('../../../modules/mysql/library');
const redis = require('../../../modules/redis/library');
const AnswerContainer = require('../../../modules/containers/answer');
const QuestionContainer = require('../../../modules/containers/question');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const Utility = require('../../../modules/utility');
const LanguageContainer = require('../../../modules/containers/language');
const dnProperty = require('../../../modules/mysql/property');
const studentRedis = require('../../../modules/redis/student');
const QuestionMysql = require('../../../modules/mysql/question');
const StaticData = require('../../../data/data');
const DnShortsData = require('../../../data/dnShorts.data');
const StudentCourseMappingMysql = require('../../../modules/studentCourseMapping');
const UtilityRedis = require('../../../modules/redis/utility.redis');
const Data = require('../../../data/data');

function getToatalLikesShare(elasticSearchResult, student_id, db) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise((async (resolve, reject) => {
        try {
            const color = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
            const thumbnail_sid = [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98];
            let durationPromise = [];
            for (let i = 0; i < elasticSearchResult.length; i++) {
                if (elasticSearchResult[i].ocr_text !== 'undefined' && elasticSearchResult[i].ocr_text !== null) {
                    const str = elasticSearchResult[i].ocr_text.replace(/'/g, "\\'");
                    elasticSearchResult[i].ocr_text = str;
                }
                durationPromise.push(AnswerContainer.getByQuestionIdWithTextSolution(elasticSearchResult[i].question_id, db));
                durationPromise.push(QuestionContainer.getTotalViewsNew(elasticSearchResult[i].question_id, db));
            }
            const videoData = await Promise.all(durationPromise);
            for (let i = 0; i < elasticSearchResult.length; i++) {
                // thumbnail for thumbnail_sid show
                if (videoData[i * 2][0]) {
                    elasticSearchResult[i] = Utility.checkThumbnail(elasticSearchResult[i], thumbnail_sid, videoData[i * 2][0].student_id);
                    if (videoData[i * 2].length > 0 && videoData[i * 2][0].is_text_answered == 1 && videoData[i * 2][0].is_answered == 0) {
                        elasticSearchResult[i].resource_type = 'text';
                        elasticSearchResult[i].duration = 0;
                        videoData[i * 2][0].answer_id = videoData[i * 2][0].text_solution_id;
                        videoData[i * 2][0].answer_video = 'text';
                    } else {
                        elasticSearchResult[i].resource_type = 'video';
                        if (videoData[i * 2].length > 0 && (videoData[i * 2][0].duration !== 'NULL' || videoData[i * 2][0].duration)) {
                            elasticSearchResult[i].duration = videoData[i * 2][0].duration;
                        } else {
                            elasticSearchResult[i].duration = 0;
                        }
                    }
                    durationPromise = [];
                    durationPromise.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudentNew(student_id, videoData[i * 2][0].answer_id, videoData[i * 2][0].answer_video, db));
                    // eslint-disable-next-line no-await-in-loop
                    const tempData = await Promise.all(durationPromise);
                    if (videoData[i * 2][0].duration === 'NULL' || videoData[i * 2][0].duration === null) {
                        elasticSearchResult[i].duration = 0;
                    } else {
                        elasticSearchResult[i].duration = videoData[i * 2][0].duration;
                    }
                    elasticSearchResult[i].bg_color = _.sample(color);
                    elasticSearchResult[i].share = videoData[i * 2 + 1][0].share;
                    elasticSearchResult[i].like = videoData[i * 2 + 1][0].likes;
                    elasticSearchResult[i].views = videoData[i * 2 + 1][0].views;
                    elasticSearchResult[i].share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                    elasticSearchResult[i].isLiked = false;
                    if (tempData.length > 0 && tempData[0].rating > 3) {
                        elasticSearchResult[i].isLiked = true;
                    }
                }
            }
            return resolve(elasticSearchResult);
        } catch (e) {
            reject(e);
        }
    }));
}

async function getOldViewBooksData(db, playlistId, versionCode, studentClass, studentId) {
    const data = {};
    const redisCache = await redis.getByKey(`LIBRARY_CACHE_ID_${playlistId}_${versionCode}`, db.redis.read);
    if (redisCache != null && redisCache.length) {
        return JSON.parse(redisCache);
    }
    const playlistChildData = await libraryMysql.getPlaylistWithView(db.mysql.read, studentClass, studentId, 1, 10000, playlistId, versionCode);
    const promise = [];
    for (let i = 0; i < playlistChildData.length; i++) {
        promise.push(libraryMysql.getPlaylistWithView(db.mysql.read, studentClass, studentId, 1, 10000, playlistChildData[i].id, versionCode));
    }
    const grandChildData = await Promise.all(promise);
    for (let i = 0; i < grandChildData.length; i++) {
        playlistChildData[i].flex_list = grandChildData[i];
    }
    data.list = playlistChildData;
    if (data && data.list && data.list.length && playlistId != 0) {
        redis.setByKey(`LIBRARY_CACHE_ID_${playlistId}_${versionCode}`, data, 6 * 60 * 60, db.redis.write); // setting in redis playlist data
    }
    return data;
}

async function getNewViewBooksData(db, studentClass, studentId, locale, subject, packageId, isNcertIds, isBooksIds) {
    const localeList = [locale];
    if (isNcertIds) {
        const ncertPlaylistData = await libraryMysql.getLibraryNcertDataNewFlow(db.mysql.read, studentClass, localeList);
        if (ncertPlaylistData && ncertPlaylistData.length) {
            return { list: ncertPlaylistData };
        }
        const ncertPlaylistDataEnglish = await libraryMysql.getLibraryNcertDataNewFlow(db.mysql.read, studentClass, ['en']);
        return (ncertPlaylistDataEnglish && ncertPlaylistDataEnglish.length) ? { list: ncertPlaylistDataEnglish } : { list: [] };
    }
    if (isBooksIds) {
        const booksPlaylistData = await libraryMysql.getLibraryBooksDataNewFlow(db.mysql.read, studentId, studentClass, localeList, subject);
        if (booksPlaylistData && booksPlaylistData.length) {
            return { list: booksPlaylistData };
        }
        const booksPlaylistDataOfCLass = await libraryMysql.getLibraryBookDataNewFlowByClass(db.mysql.read, studentClass, ['en'], subject);
        return (booksPlaylistDataOfCLass && booksPlaylistDataOfCLass.length) ? { list: booksPlaylistDataOfCLass } : { list: [] };
    }
    const redisCache = await redis.getNcertBooksLibraryDataNew(db.redis.read, packageId);
    if (redisCache != null && redisCache.length) {
        const data = JSON.parse(redisCache);
        return (data && data.length) ? { list: data } : { list: [] };
    }
    return { list: [] };
}

async function makeData(db, versionCode, studentClass, studentId, playlistId, packageId, locale, source, flagData = false) {
    const playlistData = await libraryMysql.getcheckPlaylistWithActive(db.mysql.read, studentClass, studentId, playlistId);
    const subject = (playlistData && playlistData.length && playlistData[0].subject) ? playlistData[0].subject : '';

    const isPackage = !!(packageId && packageId.length && packageId.split('_').length > 4);
    let isNcertIds = false; let isReferenceBooksIds = false;
    const booksIds = await dnProperty.getNameAndValueByBucket(db.mysql.read, 'library_books') || [];
    booksIds.forEach((x) => {
        if (x.name === 'ncert_book' && x.value) {
            isNcertIds = _.includes(JSON.parse(x.value), parseInt(playlistId));
        }
        if (x.name === 'reference_book' && x.value) {
            isReferenceBooksIds = _.includes(JSON.parse(x.value), parseInt(playlistId));
        }
    });

    if (((source && source === 'SEARCH_SRP' && (isNcertIds || isReferenceBooksIds)) || isPackage) && parseInt(versionCode) >= 863) {
        studentClass = (parseInt(studentClass) === 13) ? 12 : studentClass;
        return getNewViewBooksData(db, studentClass, studentId, locale, subject, packageId, isNcertIds, isReferenceBooksIds);
    }

    if (playlistData && playlistData.length && playlistData[0].view_type === 'BOOK_INDEX' && versionCode > 646) {
        return getOldViewBooksData(db, playlistId, versionCode, studentClass, studentId);
    }
    const redisCache = await redis.getByKey(`LIBRARY_CACHE_ID_${playlistId}_${versionCode}`, db.redis.read);
    if (redisCache != null && redisCache.length) {
        return JSON.parse(redisCache);
    }
    const data = {};
    let playlistInfo;
    if (playlistId == 0) {
        playlistInfo = await libraryMysql.getcustomPlaylist(db.mysql.read, studentClass, studentId, 1, 10000, playlistId);
    } else {
        playlistInfo = await libraryMysql.getPlaylistWithView(db.mysql.read, studentClass, studentId, 1, 10000, playlistId, versionCode, flagData);
    }
    const headers = [];
    let filters = [];
    for (let i = 0; i < playlistInfo.length; i++) {
        if (playlistInfo[i].view_type != null) {
            if (playlistInfo[i].view_type === 'HEADER') {
                headers.push(playlistInfo[i]);
                playlistInfo.splice(i, 1);
                i--;
                continue;
            } else if (playlistInfo[i].view_type === 'FILTER') {
                filters.push(playlistInfo[i]);
                playlistInfo.splice(i, 1);
                i--;
                continue;
            }
        }
    }
    data.list = playlistInfo;
    if (headers.length) {
        data.headers = headers;
        const childPlaylistInfo = await libraryMysql.getPlaylistWithView(db.mysql.read, studentClass, studentId, 1, 10000, headers[0].id, versionCode, flagData);
        let isFilter = false;
        for (const childData of childPlaylistInfo) {
            if (childData.view_type != null && childData.view_type === 'FILTER') {
                isFilter = true;
                break;
            }
        }
        if (isFilter) {
            filters = childPlaylistInfo;
        } else {
            data.list = childPlaylistInfo;
        }
    }
    if (filters.length) {
        data.filters = filters;
        const childPlaylistInfoFilter = await libraryMysql.getPlaylistWithView(db.mysql.read, studentClass, studentId, 1, 10000, filters[0].id, versionCode, flagData);
        data.list = childPlaylistInfoFilter;
    }
    if (data && data.list && data.list.length && playlistId != 0) {
        redis.setByKey(`LIBRARY_CACHE_ID_${playlistId}_${versionCode}`, data, 6 * 60 * 60, db.redis.write); // setting in redis playlist data
    }
    return data;
}

async function makeHistoryData(db, userData, config) {
    // const data = {};
    // data.meta_info = [{
    //     icon: `${config.staticCDN}images/empty_playlist.webp`,
    //     title: 'NO VIDEOS',
    //     description: 'The videos you watch will appear here! Start Watching Now!',
    //     Button: 'WATCH TRENDING VIDEOS',
    //     id: 100780,
    //     playlist_name: 'TRENDING ON DOUBTNUT',
    // }];
    const {
        student_id,
        student_class,
        page_no,
        playlist,
        locale,
    } = userData;
    const limit = 10;
    let language = 'english';
    const data = {};
    const lang = await LanguageContainer.getByCode(locale, db);
    if (!_.isEmpty(lang) && lang.length > 0) {
        language = lang[0].language;
    }
    if (playlist === 'HISTORY') {
        const result = await libraryMysql.getcheckPlaylistWithActive(db.mysql.read, student_id, student_class, 100779);
        let str = _.replace(result[0].resource_path, /xxlanxx/g, language);
        str = _.replace(str, /xxclsxx/g, student_class);
        str = _.replace(str, /xxsidxx/g, student_id);
        const sql = `${str} limit ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
        // console.log(sql)
        let data3 = await db.mysql.read.query(sql, [result[0].id]);
        data3 = await getToatalLikesShare(data3, student_id, db);
        if (data3.length == 0 && page_no === '1') {
            data.meta_info = [{
                icon: `${config.staticCDN}images/empty_playlist.webp`,
                title: 'NO VIDEOS',
                description: result[0].empty_text,
                Button: 'WATCH TRENDING VIDEOS',
                id: result[0].empty_playlist_id,
                playlist_name: 'TRENDING ON DOUBTNUT',
            }];
        } else {
            data3 = Utility.addWebpThumbnail([data3], config);
            data.playlist = data3[0];
        }
    }
    return data;
}

async function getNcertFirstQuestions(db, ncertDataList) {
    const firstQuestionPromise = [];
    if (ncertDataList) {
        ncertDataList.forEach((item) => {
            firstQuestionPromise.push(QuestionContainer.getFirstVideoOfPlaylist(db, item.id));
        });
        const firstQuestionData = await Promise.all(firstQuestionPromise);
        ncertDataList.forEach((item, index) => {
            item.deeplink = `doubtnutapp://video?qid=${firstQuestionData[index][0].question_id}&page=NCERT`;
        });
    }
    return ncertDataList;
}

async function getNewFlowNcertFirstQuestions(db, ncertDataList) {
    const firstQuestionPromise = [];
    ncertDataList.forEach((item) => {
        firstQuestionPromise.push(QuestionMysql.getFirstVideoOfNcertBook(db.mysql.read, item.id));
    });
    const firstQuestionData = await Promise.all(firstQuestionPromise);
    ncertDataList.forEach((item, index) => {
        item.deeplink = `doubtnutapp://video?qid=${firstQuestionData[index][0].question_id}&page=NCERT_NEW_FLOW`;
    });
    return ncertDataList;
}

async function getFirstQuestionOfChapter(db, packageId) {
    let activeQid = 0;
    const questionCache = await redis.getNcertBooksLibraryDataNew(db.redis.read, packageId);
    if (questionCache != null && questionCache.length) {
        const questionData = JSON.parse(questionCache);
        if (questionData.length > 0) {
            activeQid = questionData[0];
        }
    }
    return activeQid;
}

async function getBookDeeplink(db, studentId, playlistId, dataList) {
    for (let i = 0; i < dataList.length; i++) {
        const item = dataList[i];
        let activeChapter = 0;
        let activeQid = 0;
        // eslint-disable-next-line no-await-in-loop
        const chapterCache = await redis.getNcertBooksLibraryDataNew(db.redis.read, item.package_details_id);
        if (chapterCache != null && chapterCache.length) {
            const chapterData = JSON.parse(chapterCache);
            if (chapterData.length > 0) {
                let firstOn = 0;
                // eslint-disable-next-line no-await-in-loop
                const redisData = await studentRedis.getBookFlowData(db.redis.read, `lv_${item.package_details_id}`, studentId);
                if (!_.isNull(redisData)) {
                    const redisDataDetails = redisData.split('_');
                    for (let j = 0; j < chapterData.length; j++) {
                        const x = chapterData[j];
                        let gotChapter = 0;
                        for (let k = 0; k < x.flex_list.length; k++) {
                            const y = x.flex_list[k];
                            let nextId = 0;
                            let newId = 0;
                            if (gotChapter === 1) {
                                activeChapter = y.id;
                                // eslint-disable-next-line no-await-in-loop
                                activeQid = await getFirstQuestionOfChapter(db, y.package_details_id);
                                if (activeChapter !== 0 && activeQid !== 0) {
                                    break;
                                } else {
                                    activeChapter = 0;
                                }
                            }
                            if (y.id == redisDataDetails[0]) {
                                activeChapter = y.id;
                                gotChapter = 1;
                                // eslint-disable-next-line no-await-in-loop
                                const questionCache = await redis.getNcertBooksLibraryDataNew(db.redis.read, y.package_details_id);
                                if (questionCache != null && questionCache.length) {
                                    const questionData = JSON.parse(questionCache);
                                    if (questionData.length > 0) {
                                        for (let l = 0; l < questionData.length; l++) {
                                            if (nextId === 1) {
                                                activeQid = questionData[l];
                                                newId = 1;
                                                break;
                                            }
                                            if (questionData[l] == redisDataDetails[1]) {
                                                activeQid = questionData[l];
                                                // eslint-disable-next-line no-await-in-loop
                                                const lastVideoDetails = await QuestionMysql.getLastWatchedVideoDetails(db.mysql.read, questionData[l], studentId);
                                                if (lastVideoDetails[0] && lastVideoDetails[0].duration != null && lastVideoDetails[0].duration != '' && lastVideoDetails[0].duration == lastVideoDetails[0].video_time) {
                                                    nextId = 1;
                                                } else {
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (activeQid !== 0 && ((nextId === 1 && newId === 1) || nextId === 0)) {
                                    break;
                                }
                            }
                        }
                        if (activeChapter !== 0 && activeQid !== 0) {
                            break;
                        }
                    }
                    if (activeChapter === 0 || activeQid === 0) {
                        firstOn = 1;
                    }
                } else {
                    firstOn = 1;
                }
                if (firstOn === 1 && chapterData[0].flex_list != undefined) {
                    activeChapter = chapterData[0].flex_list[0].id;
                    // eslint-disable-next-line no-await-in-loop
                    activeQid = await getFirstQuestionOfChapter(db, chapterData[0].flex_list[0].package_details_id);
                }
            }
        }
        if (activeChapter !== 0 && activeQid !== 0) {
            item.deeplink = `doubtnutapp://video?qid=${activeQid}&page=BOOK_LIST&playlist_id=${playlistId}_${item.package_details_id}_${activeChapter}`;
        }
    }
    return dataList;
}

async function getLibraryBookDeeplink(db, config, studentId, dataList) {
    const { dcPandeyMainId, dcPandeyBooks, notActiveBooks } = StaticData;
    dataList = dataList.filter((x) => !notActiveBooks.includes(x.id));
    for (let i = 0; i < dataList.length; i++) {
        const item = dataList[i];
        console.log('item > ', item);
        let activeQid = 0;
        const bookPlaylistId = item.id;
        if (!dcPandeyMainId.includes(item.id)) {
            // eslint-disable-next-line no-await-in-loop
            const ncertWatchDetails = await redis.libraryBookLastView(db.redis.read, `library_book_lv_${item.id}`, studentId);
            if (!_.isNull(ncertWatchDetails)) {
                let currentQuestionAsActive = 0;
                // eslint-disable-next-line no-await-in-loop
                const lastVideoDetails = await QuestionMysql.getLastWatchedVideoDetails(db.mysql.read, ncertWatchDetails, studentId);
                if (lastVideoDetails[0] && lastVideoDetails[0].duration != null && lastVideoDetails[0].duration != '' && lastVideoDetails[0].duration == lastVideoDetails[0].video_time) {
                    // take current video details, get the id, get the very next id, check both book_playlist_id. if both same proceed with the next id else take first video of this book
                    // eslint-disable-next-line no-await-in-loop
                    const currentVideoResponse = await libraryMysql.getLibraryBookDetailsByQid(db.mysql.read, ncertWatchDetails);
                    if (currentVideoResponse.length > 0) {
                        const currentVideoId = currentVideoResponse[0].id;

                        // eslint-disable-next-line no-await-in-loop
                        const nextVideoDetails = await libraryMysql.getBookDetailsById(db.mysql.read, currentVideoId);
                        if (nextVideoDetails.length > 0) {
                            const nextBookId = nextVideoDetails[0].book_playlist_id;
                            if (nextBookId == item.id) {
                                activeQid = nextVideoDetails[0].question_id;
                            } else {
                                currentQuestionAsActive = 1;
                            }
                        } else {
                            // send this question id
                            currentQuestionAsActive = 1;
                        }
                    } else {
                        currentQuestionAsActive = 1;
                    }
                } else {
                    // send this question id
                    currentQuestionAsActive = 1;
                }
                if (currentQuestionAsActive) {
                    activeQid = ncertWatchDetails;
                }
            } else {
                // send first video of the book
                // eslint-disable-next-line no-await-in-loop
                const firstVideoResponse = await libraryMysql.geLibraryBookFirstVideoDetails(db.mysql.read, item.id);
                if (firstVideoResponse.length > 0) {
                    activeQid = firstVideoResponse[0].question_id;
                } else {
                    activeQid = ncertWatchDetails;
                }
            }
            if (activeQid != 0) {
                item.deeplink = `doubtnutapp://video?qid=${activeQid}&page=LIBRARY_BOOK_LIST&playlist_id=${bookPlaylistId}__BOOK`;
            }
            if (dcPandeyBooks.includes(item.id)) {
                item.view_type = 'BOOK';
                item.image_url = `${config.staticCDN}${StaticData.dcPandeyBooksImagesMapping[item.id]}`;
            }
        }
    }
    return dataList;
}

function attachDeeplinkForCustomDnShorts(data) {
    const playlist = _.get(data, 'list', []);
    for (let i = 0; i < playlist.length; i++) {
        if (playlist[i].name === DnShortsData.custom_playlist_name) {
            playlist[i].deeplink = `doubtnutapp://shorts?qid=123&type=${DnShortsData.playlist_deeplink_type}`;
        }
    }
}

function makeLocaleOrder(locale, boardCcmId) {
    let isSouthIndianBoard = false;
    let localeToBeIncluded = '';
    if (!_.isEmpty(boardCcmId)) {
        if (Data.southIndianBoards.includes(boardCcmId[0].course)) {
            isSouthIndianBoard = true;
        }
        localeToBeIncluded = Data.localeBoardMapping[boardCcmId[0].course];
        if (!localeToBeIncluded) {
            localeToBeIncluded = '';
        }
    }

    let localeArr = [];
    switch (locale) {
        case 'en':
            localeArr = ['en', localeToBeIncluded, 'hi'];
            break;
        case 'hi':
            localeArr = ['hi', localeToBeIncluded];
            break;
        default:
            localeArr = isSouthIndianBoard ? [locale, localeToBeIncluded, 'en'] : [locale, localeToBeIncluded, 'en', 'hi'];
            localeArr = _.uniq(localeArr);
            break;
    }
    return localeArr;
}

async function makeNewFlowNcertBooksData(db, studentId, studentClass, locale) {
    let studentClassArr = [parseInt(studentClass)];
    if (parseInt(studentClass) === 13) {
        // showing same data to class 13 as we show to class 12
        studentClassArr = [11, 12];
    }
    const noBoardClass = [6, 7, 8];
    let boardCcmId = await StudentCourseMappingMysql.getSelectExamBoard(db.mysql.read, studentId);
    let isCommerceExamSelected = false;
    _.map(boardCcmId, (item) => {
        if (item.course === 'COMMERCE') {
            isCommerceExamSelected = true;
        }
    });

    let booksList = [];

    if (isCommerceExamSelected) {
        booksList = await libraryMysql.getNewFlowNcertBooks(db.mysql.read, studentClass);// fetching books based on class only
    } else {
        let redisKey = `${locale}_${studentClass}`;
        boardCcmId = _.filter(boardCcmId, (item) => item.category === 'board');
        if (!noBoardClass.includes(parseInt(studentClass)) && !_.isEmpty(boardCcmId)) {
            redisKey = `${redisKey}_${boardCcmId[0].ccm_id}`;
        }
        const booksListFromRedis = await UtilityRedis.getHash(db.redis.write, redisKey, 'NCERT_BOOKS_LIST');
        if (!_.isNull(booksListFromRedis)) {
            booksList = JSON.parse(booksListFromRedis);
        } else {
            const localeArr = makeLocaleOrder(locale, boardCcmId);
            booksList = await libraryMysql.getNewFlowNcertBooks(db.mysql.read, studentClassArr, localeArr);
            UtilityRedis.setHash(db.redis.write, redisKey, 'NCERT_BOOKS_LIST', booksList, 60 * 60 * 24);
        }
    }

    return booksList;
}

function makeNewFlowNcertBooksWidget(booksList) {
    return _.map(booksList, (book) => ({
        id: book.id,
        name: book.book_name,
        view_type: 'BOOK_INDEX',
        description: null,
        image_url: book.image_url,
        is_first: 0,
        is_last: 0,
        empty_text: null,
        resource_type: 'playlist',
        resource_path: null,
    }));
}

module.exports = {
    makeData,
    getToatalLikesShare,
    makeHistoryData,
    getNcertFirstQuestions,
    getBookDeeplink,
    getLibraryBookDeeplink,
    attachDeeplinkForCustomDnShorts,
    makeNewFlowNcertBooksData,
    getNewFlowNcertFirstQuestions,
    makeNewFlowNcertBooksWidget,
};
