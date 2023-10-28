const _ = require('lodash');
const bluebird = require('bluebird');
const axios = require('axios');
const mongoose = require('mongoose');
const searchSql = require('../../../modules/mysql/search');
const Utility = require('../../../modules/utility');
const flagrUtility = require('../../../modules/Utility.flagr');
const questionContainer = require('../../../modules/containers/question');
const Data = require('../../../data/data');
const config = require('../../../config/config');

bluebird.promisifyAll(mongoose);
const GlobalSearchLog = mongoose.model('GlobalSearchLog');

async function getTrendingPlaylist(db, studentClass) {
    const letters = /^[A-Za-z]+$/;
    const trendingPlaylist = {
        header: 'Trending Searches', data_type: 'trending', img_url: `${config.staticCDN}images/trending_searches_logo.png`, view_type: 'list',
    };
    let trendingData = await searchSql.getTrendingPlaylist(db.mysql.read, studentClass, 5, 0);
    trendingData = _.shuffle(trendingData);
    if (trendingData.length > 0) {
        for (let i = 0; i < trendingData.length; i++) {
            const str = trendingData[i].display.split(' ');
            let str1 = '';
            if (str.length > 0) {
                for (let j = 0; j < str.length; j++) {
                    if (letters.test(str[j])) {
                        str1 = `${str1} ${_.startCase(str[j].toLowerCase())}`;
                    }
                }
            }
            trendingData[i].display = str1.slice(1);
        }
    }
    trendingPlaylist.playlist = trendingData;
    return trendingPlaylist;
}

async function getRecentWatchedVideo(db, studentClass) {
    const recentWatched = {
        header: 'Recent Doubt Solved', data_type: 'video', img_url: '', view_type: 'horizontal',
    };
    const recentWatchedData = await searchSql.getRecentWatchedVideo(db.mysql.read, studentClass, 0, 'en');
    recentWatched.playlist = recentWatchedData;
    return recentWatched;
}

async function getMostWatchedVideo(db, studentClass) {
    const mostWatched = {
        header: 'Most Watched Videos', data_type: 'video', img_url: '', view_type: 'horizontal',
    };
    const mostWatchedData = await searchSql.getMostWatchedVideo(db.mysql.read, studentClass);
    mostWatched.playlist = mostWatchedData;
    return mostWatched;
}

async function getBooksInappPage(db, studentClass) {
    const books = {
        header: 'Books', data_type: 'libraryPlaylist', content_type: 'libraryBook', img_url: '', view_type: 'horizontal',
    };
    const booksData = await searchSql.getBooksInappPage(db.mysql.read, studentClass);
    books.playlist = booksData;
    return books;
}

async function getTopicPdf(db, studentClass) {
    const topicPDF = {
        header: 'PDFs', data_type: 'libraryPlaylist', content_type: 'libraryPdf', img_url: '', view_type: 'list',
    };
    const topicPDFData = await searchSql.getTopicPdf(db.mysql.read, studentClass);
    topicPDF.playlist = topicPDFData;
    return topicPDF;
}

async function getTopicExamPdf(db, studentClass) {
    const topicExam = {
        header: 'Exam Paper', data_type: 'libraryPlaylist', content_type: 'libraryExam', img_url: '', view_type: 'list',
    };
    const topicExamData = await searchSql.getTopicExamPdf(db.mysql.read, studentClass);
    topicExam.playlist = topicExamData;
    return topicExam;
}

async function getRecentSearches(studentId) {
    const recentSearches = {
        header: 'Recent Searches', data_type: 'recent', img_url: `${config.staticCDN}images/recent_searches_logo_1.png`, view_type: 'list',
    };
    const query = { student_id: studentId, is_clicked: true, size: { $gt: 0 } };
    const recentSearch = await GlobalSearchLog.find(query).sort({ _id: -1 }).limit(10);
    const playlist = [];
    if (recentSearch.length) {
        if (recentSearch[0].search_text) {
            playlist.push({ display: recentSearch[0].search_text });
        }
        for (let i = 1; i < recentSearch.length && playlist.length < 3; i++) {
            if (recentSearch[i].search_text && !recentSearch[i].search_text.includes(playlist[playlist.length - 1].display)) {
                const obj = { display: recentSearch[i].search_text };
                playlist.push(obj);
            }
        }
    }
    recentSearches.playlist = playlist;
    return recentSearches;
}

async function generateData(db, data, studentClass, lang, text, versionCode) {
    const videoArr = [];
    let questionLocalised;
    let language = 'english';
    if (lang === 'hi') {
        language = 'hindi';
    }

    if (typeof data[data.length - 1].hits !== 'undefined' && data[data.length - 1].hits.hits.length > 0) {
        const videoDataQAsk = data[data.length - 1].hits.hits;
        for (let i = 0; i < videoDataQAsk.length; i++) {
            const obj = {};
            obj._index = videoDataQAsk[i]._index;
            obj._type = videoDataQAsk[i]._type;
            obj._id = videoDataQAsk[i]._id;
            obj._score = videoDataQAsk[i]._score;
            obj._source = {};
            obj._source.display = videoDataQAsk[i]._source.ocr_text;
            if (lang === 'hi') {
                // eslint-disable-next-line no-await-in-loop
                questionLocalised = await questionContainer.getLocalisedQuestion(videoDataQAsk[i]._id, language, db);
                if (questionLocalised.length && questionLocalised[0].hindi) {
                    obj._source.display = questionLocalised[0].hindi;
                }
            }
            obj._source.id = videoDataQAsk[i]._id;
            obj._source.class = studentClass;
            obj._source.type = 'video';
            obj._source.isVip = false;
            obj._source.page = 'SEARCH_SRP';
            obj._source.tab_type = 'video';
            obj._source.is_last = '';
            obj._source.tags = '';
            obj._source.breadcrumbs = 'Video';
            obj._source.search_key = videoDataQAsk[i]._source.ocr_text;
            obj._source.image_url = null;
            obj._source.bg_color = _.sample(Data.colorCodeInApp);
            videoArr.push(obj);
        }
    }

    let ncertVideoArr = []; let isLast1WithImage = []; let isLast1WithoutImage = []; let isLast0 = [];
    const arr = [];
    if (data[0] && data[0].hits.hits.length) {
        arr.push(data[0].hits.hits);
    }

    if (data[1] && data[1].hits.hits.length) {
        arr.push(data[1].hits.hits);
    }

    if (data[2] && data[2].hits.hits.length) {
        arr.push(data[2].hits.hits);
    }

    for (let j = 0; j < arr.length; j++) {
        for (let i = 0; i < arr[j].length; i++) {
            if (arr[j][i]._source.tab_type === 'video') {
                if (lang === 'hi') {
                    if (arr[j][i]._source.hindi_image_url) {
                        arr[j][i]._source.image_url = arr[j][i]._source.hindi_image_url;
                    }
                    if (arr[j][i]._source.hindi_display) {
                        arr[j][i]._source.display = arr[j][i]._source.hindi_display;
                    }
                    // eslint-disable-next-line no-await-in-loop
                    questionLocalised = await questionContainer.getLocalisedQuestion(arr[j][i]._source.id, language, db);
                    if (questionLocalised.length && questionLocalised[0].hindi) {
                        arr[j][i]._source.display = questionLocalised[0].hindi;
                    }
                }
                arr[j][i]._source.bg_color = _.sample(Data.colorCodeInApp);
                ncertVideoArr.push(arr[j][i]);
            } else if (arr[j][i]._source.is_last === 1 && arr[j][i]._source.tab_type !== 'video') {
                if (lang === 'hi') {
                    if (arr[j][i]._source.hindi_image_url) {
                        arr[j][i]._source.image_url = arr[j][i]._source.hindi_image_url;
                    }
                    if (arr[j][i]._source.hindi_breadcrumbs) {
                        arr[j][i]._source.breadcrumbs = arr[j][i]._source.hindi_breadcrumbs;
                    }
                    if (arr[j][i]._source.hindi_display) {
                        arr[j][i]._source.display = arr[j][i]._source.hindi_display;
                    }
                }
                if (arr[j][i]._source.image_url) {
                    isLast1WithImage.push(arr[j][i]);
                } else {
                    isLast1WithoutImage.push(arr[j][i]);
                }
            } else if (arr[j][i]._source.is_last === 0 && arr[j][i]._source.tab_type !== 'video') {
                if (versionCode < 717 && (arr[j][i]._source.tab_type === 'etoos_faculty_chapter' || arr[j][i]._source.tab_type === 'etoos_course')) {
                    arr[j].splice(i, 0);
                } else {
                    if (lang === 'hi') {
                        if (arr[j][i]._source.hindi_image_url) {
                            arr[j][i]._source.image_url = arr[j][i]._source.hindi_image_url;
                        }
                        if (arr[j][i]._source.hindi_display) {
                            arr[j][i]._source.display = arr[j][i]._source.hindi_display;
                        }
                        if (arr[j][i]._source.hindi_breadcrumbs) {
                            arr[j][i]._source.breadcrumbs = arr[j][i]._source.hindi_breadcrumbs;
                        }
                    }
                    isLast0.push(arr[j][i]);
                }
            }
        }
    }

    isLast1WithImage = _(isLast1WithImage).uniqBy('_id');
    ncertVideoArr = _(ncertVideoArr).uniqBy('_id');
    isLast1WithoutImage = _(isLast1WithoutImage).uniqBy('_id');
    isLast0 = _(isLast0).uniqBy('_id');

    let videoPlaylistData = [];
    if (text.length > 50) {
        videoPlaylistData = [...videoArr.slice(0, 8), ...ncertVideoArr.slice(0, 5), ...isLast1WithImage.slice(0, 10), ...isLast1WithoutImage.slice(0, 10), ...isLast0];
        return videoPlaylistData;
    }
    videoPlaylistData = [...isLast1WithImage.slice(0, 10), ...ncertVideoArr.slice(0, 5), ...isLast1WithoutImage.slice(0, 10), ...isLast0, ...videoArr.slice(0, 5)];
    Utility.inappSearchStringDiffImplement(videoPlaylistData, text);
    return videoPlaylistData;
}

function getClassFromSearchText(text, flag) {
    const regex1 = /(Class) ?(\d{1,2})(?:th)?/gmi;
    const regex2 = /(\d{1,2})(?:th)? ?(Class)/gmi;
    let m;
    if (flag) {
        m = regex1.exec(text);
        return m;
    }
    m = regex2.exec(text);
    return m;
}

function getExerciseFromSearchText(text) {
    const regex = /(?:Ex(?:e)?(?:rcise)?) ?(\d{1,2}\.?\d?)/gmi;
    const m = regex.exec(text);
    return m;
}

async function getLangAndText(text, translate2, lang, numberReplaceSet) {
    let text1;
    text = text.replace(/ncert/gi, '###');
    let translateApiResp = await Utility.translateApi2(text, translate2);
    if (translateApiResp && translateApiResp.length > 1 && translateApiResp[1].data && translateApiResp[1].data.translations && translateApiResp[1].data.translations.length && translateApiResp[1].data.translations[0].detectedSourceLanguage) {
        lang = translateApiResp[1].data.translations[0].detectedSourceLanguage;
        text = translateApiResp[0].replace(/###/g, 'ncert');
        if (lang === 'hi') {
            const temp = await axios({
                method: 'GET',
                url: `https://inputtools.google.com/request?text=${text}&itc=hi-t-i0-und`,
            });
            if (temp && temp.status === 200 && temp.data && temp.data.length > 1 && temp.data[1].length && temp.data[1][0].length > 1 && temp.data[1][0][1].length) {
                text1 = temp.data[1][0][1][0];
                text1 = text1.replace(/१|२|३|४|५|६|७|८|९/gi, (query) => numberReplaceSet[query]);
                translateApiResp = await Utility.translateApi2(text1, translate2);
                if (translateApiResp && translateApiResp.length) {
                    text = translateApiResp[0];
                }
            }
        }
    }
    if (lang !== 'hi') {
        if (text.search(/hindi/gi) >= 0) {
            lang = 'hi';
        } else {
            lang = 'en';
        }
    }
    return { text, lang };
}

// eslint-disable-next-line no-shadow
async function getInAppSearchResult(db, inAppSearchElasticInstance, translate2, config, text, studentId, studentClass, versionCode, locale, xAuthToken) {
    const originalText = text;
    const promises = [];
    const langFlag = await flagrUtility.getBooleanFlag(xAuthToken, 'ias_flat_english_search');
    const data = { field: 'search_key.completion', ngramField: 'search_key.edgengram' };
    const isNgram = 1; const isSuggest = 1;
    let lang = locale;
    const numberReplaceSet = {
        '१': '1', '२': '2', '३': '3', '४': '4', '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
    };

    if (!langFlag) {
        ({ text, lang } = await getLangAndText(text, translate2, lang, numberReplaceSet));
    } else if (langFlag && lang === 'hi') {
        ({ text, lang } = await getLangAndText(text, translate2, lang, numberReplaceSet));
    }

    // synonyms replaced
    text = text.replace(/^[,;.@\\%*#~!\s]*|[,;.@\\%*#~!\s]*$/g, '').toLowerCase();
    const text2 = text.replace(/[0-9]/g, '');
    const synonyms = await searchSql.getSynonyms(db.mysql.read, text2);
    if (synonyms && synonyms.length) {
        for (let j = 0; j < synonyms.length; j++) {
            if (text.includes(synonyms[j].find_str.toLowerCase())) {
                text = text.replace(new RegExp(synonyms[j].find_str, 'gi'), synonyms[j].replace_word);
            }
        }
    }
    // retieving subject
    let subject;
    if (text.search(/math|mathematics|ganit/i) >= 0) {
        subject = 'MATHS';
    } else if (text.search(/physics|phy|bhautiki/i) >= 0) {
        subject = 'PHYSICS';
    } else if (text.search(/chemistry|chem|rasayan/i) >= 0) {
        subject = 'CHEMISTRY';
    } else if (text.search(/biology|bio|jeev vigyan/i) >= 0) {
        subject = 'BIOLOGY';
    }

    let studentClass1 = getClassFromSearchText(text, 1);
    const classArray = ['6', '7', '8', '9', '10', '11', '12', '14'];
    if (studentClass1 && studentClass1.length > 0 && _.includes(classArray, studentClass1[2])) {
        studentClass = studentClass1[2];
    } else {
        studentClass1 = getClassFromSearchText(text, 0);
        if (studentClass1 && studentClass1.length > 0 && _.includes(classArray, studentClass1[1])) {
            studentClass = studentClass1[1];
        }
    }
    // exercise string match and replace
    const exercise = getExerciseFromSearchText(text);
    if (exercise && exercise.length > 0) {
        text = text.replace(exercise[0], `exercise ${exercise[1]} `);
    }

    promises.push(inAppSearchElasticInstance.simpleSearchTopics(text, versionCode, studentClass, subject));
    promises.push(inAppSearchElasticInstance.simpleSearchTopicswithNgramMultimatch(text, versionCode, studentClass, subject));
    promises.push(inAppSearchElasticInstance.simpleSearchTopicswithNgram(text, data, isSuggest, isNgram, versionCode, studentClass, subject));
    promises.push(inAppSearchElasticInstance.findByOcrUsingIndexNew1(text, config.elastic.REPO_INDEX_WITH_SYNONYMS));
    const resolvedPromises = await Promise.all(promises);

    if (!resolvedPromises[0].hits.hits.length) {
        resolvedPromises[0] = await inAppSearchElasticInstance.simpleSearchTopics(text, versionCode);
    }
    if (!resolvedPromises[1].hits.hits.length) {
        resolvedPromises[1] = await inAppSearchElasticInstance.simpleSearchTopicswithNgramMultimatch(text, versionCode);
    }
    const results = await generateData(db, resolvedPromises, studentClass, lang, text, versionCode);
    const mongoObj = {
        student_id: studentId, student_class: studentClass, search_text: originalText, translated_text: text, language: lang, size: results.length,
    };
    const globalSearchLog = new GlobalSearchLog(mongoObj);
    globalSearchLog.save();
    return results;
}

// eslint-disable-next-line no-shadow
async function inAppSearchSuggestion(inAppSearchElasticInstance, text, config, featureIds) {
    let index = config.elastic.REPO_INDEX_INAPP_SEARCH_SUGGESTER;
    if (featureIds && !_.isEmpty(featureIds) && featureIds.ias_suggester && featureIds.ias_suggester.enabled && featureIds.ias_suggester.index) {
        index = featureIds.ias_suggester.index;
    }
    const data = [];
    if (text.length < 50) {
        const result = await inAppSearchElasticInstance.getAutoSuggest(text, index);
        if (result.hits.hits) {
            const list = result.hits.hits.slice(0, 6);
            Utility.inappSearchStringDiffImplement(list, text);
            list.map((x) => {
                data.push({ display: x._source.search_key, class: x._source.class, id: x._id });
                return data;
            });
        }
    } else {
        const result = await inAppSearchElasticInstance.findByOcrUsingIndexNew1(text, config.elastic.REPO_INDEX_WITH_SYNONYMS);
        if (result && result.hits.hits && result.hits.hits.length) {
            const list = result.hits.hits.slice(0, 6);
            list.map((x) => {
                data.push({ display: x._source.ocr_text, class: '', id: x._id });
                return data;
            });
        }
    }

    return data;
}

function howItWorksIas(locale, studentClass, sessionId) {
    const data = {};
    if (!locale || locale !== 'hi') {
        locale = 'en';
    }
    data.title = Data.iasHowItWorksTitle(locale);
    let k = 1;
    for (let i = sessionId - 1; i < sessionId + 2 && k < 4; i++) {
        data[`text${k}`] = `${Data.iasHowItWorksOptions(locale)[k]} " ${Data.iasHowItWorksOptionsData[studentClass][i]}" `;
        k++;
    }
    data.bg_image = `${Data.iasCoachMarkImage}`;
    return data;
}

module.exports = {
    getRecentSearches,
    getTrendingPlaylist,
    getRecentWatchedVideo,
    getMostWatchedVideo,
    getBooksInappPage,
    getTopicPdf,
    getTopicExamPdf,
    getInAppSearchResult,
    inAppSearchSuggestion,
    howItWorksIas,
};
