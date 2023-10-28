const _ = require('lodash');
const searchSql = require('../../../modules/mysql/search');
const GlobalSearchLog = require('../../../modules/mongo/globalSearchLogs');
const iasSuggestionImpressionLogs = require('../../../modules/mongo/iasSuggesterImpressionsLog');
const searchContainer = require('../../../modules/containers/search');
const CourseContainer = require('../../../modules/containers/coursev2');
const CourseHelper = require('../../helpers/course');
const Data = require('../../../data/data');
const config = require('../../../config/config');
const axioInst = require('../../../modules/axiosInstances');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const { localeBoardMapping } = require('../../../data/data');

async function getTrendingPlaylist(db, studentClass, locale, flag) {
    const letters = /^[A-Za-z]+$/;
    const trendingPlaylist = {
        header: Data.iasSuggestionTitleLocalisation(locale).trending, data_type: 'trending', type: 'trending_topics_clicked', img_url: '', view_type: 'horizontal',
    };
    let trendingData = await searchContainer.getTrendingPlaylist(db, studentClass, 8, flag);
    trendingData = _.shuffle(trendingData);
    if (trendingData.length) {
        for (let i = 0; i < trendingData.length; i++) {
            if (locale === 'hi') {
                trendingData[i].display = trendingData[i].hindi_subtopic || trendingData[i].display;
                trendingData[i].search_key = trendingData[i].hindi_search_key || trendingData[i].search_key;
            } else {
                const str = trendingData[i].display.split(' ');
                let str1 = '';
                if (str.length) {
                    for (let j = 0; j < str.length; j++) {
                        if (letters.test(str[j])) {
                            str1 = `${str1} ${_.startCase(str[j].toLowerCase())}`;
                        }
                    }
                }
                trendingData[i].display = str1.slice(1);
            }
            trendingData[i].image_url = `${config.staticCDN}images/ias_trending.png`;
        }
    }
    trendingPlaylist.playlist = studentClass !== '14' ? trendingData : [];
    return trendingPlaylist;
}

async function getTopTagsPlaylist(db, studentClass, locale) {
    const subjectPlaylist = {
        header: Data.iasSuggestionTitleLocalisation(locale).subject, data_type: 'subject', type: 'top_tags_clicked', img_url: '', view_type: 'horizontal', playlist: [],
    };
    try {
        const iasTopDataFromMysql = await searchContainer.getIasTopTags(db, studentClass);
        const iasTopData = (iasTopDataFromMysql && iasTopDataFromMysql.length && iasTopDataFromMysql[0].data) ? JSON.parse(iasTopDataFromMysql[0].data) : [];
        if (iasTopData && iasTopData.length) {
            if (locale === 'hi') {
                iasTopData.forEach((x) => {
                    x.display = x.hindi_display || x.display;
                });
            }
            subjectPlaylist.playlist = iasTopData;
            if (!_.includes(['6', '7', '8'], studentClass)) {
                subjectPlaylist.header = Data.iasSuggestionTitleLocalisation(locale).subject_live;
            }
        }
        return subjectPlaylist;
    } catch (err) {
        console.log(err);
        return subjectPlaylist;
    }
}

async function getBookslist(db, studentClass, locale) {
    const booksPlaylist = {
        header: Data.iasSuggestionTitleLocalisation(locale).book, data_type: 'book', type: 'ias_trending_book_clicked', img_url: '', view_type: 'horizontal', playlist: [],
    };
    const iasTopBooksDataFromMysql = await searchContainer.getIasTopBooks(db, studentClass);
    const iasTopBooksData = (iasTopBooksDataFromMysql && iasTopBooksDataFromMysql.length && iasTopBooksDataFromMysql[0].data) ? JSON.parse(iasTopBooksDataFromMysql[0].data) : [];
    booksPlaylist.playlist = (iasTopBooksData && iasTopBooksData.length) ? iasTopBooksData : [];
    if (locale === 'hi') {
        booksPlaylist.playlist.forEach((x) => {
            x.display = x.hindi_display || x.display;
        });
    }
    return booksPlaylist;
}

async function getExamslist(db, studentClass, locale) {
    const examsPlaylist = {
        header: Data.iasSuggestionTitleLocalisation(locale).exams, data_type: 'book', type: 'ias_previous_year_paper_clicked', img_url: '', view_type: 'horizontal', playlist: [],
    };
    if (_.includes(['10', '11', '12', '14'], studentClass.toString())) {
        const iasTopExamsDataFromMysql = await searchContainer.getIasTopExams(db, studentClass);
        const iasTopExamsData = (iasTopExamsDataFromMysql && iasTopExamsDataFromMysql.length && iasTopExamsDataFromMysql[0].data) ? JSON.parse(iasTopExamsDataFromMysql[0].data) : [];
        examsPlaylist.playlist = (iasTopExamsData && iasTopExamsData.length) ? iasTopExamsData : [];
    }
    if (locale === 'hi') {
        examsPlaylist.playlist.forEach((x) => {
            x.display = x.hindi_display || x.display;
        });
    }
    // examsPlaylist.playlist.unshift(quizDetails);
    return examsPlaylist;
}

async function getCourseslist(db, studentClass, locale, versionCode, studentId) {
    const coursePlaylist = {
        header: Data.iasSuggestionTitleLocalisation(locale).course, img_url: '', type: 'ias_trending_courses_clicked', view_type: 'horizontal',
    };

    coursePlaylist.data_type = (versionCode >= 853) ? 'live_class_course' : 'book';
    const [iasTopCourseDefault, iasTopCourseByCCMIds] = await Promise.all([
        searchContainer.getIasTopCourse(db, studentClass),
        searchSql.getIasTopCourseByCCMids(db.mysql.read, studentId),
    ]);

    const iasTopCourseData = (iasTopCourseDefault && iasTopCourseDefault.length && iasTopCourseDefault[0].data) ? JSON.parse(iasTopCourseDefault[0].data) : [];
    const userCourse = {};
    for (let i = 0; i < iasTopCourseByCCMIds.length; i++) {
        userCourse[iasTopCourseByCCMIds[i].display] = {
            display: iasTopCourseByCCMIds[i].display,
            image_url: (Data.boardExamsImage[iasTopCourseByCCMIds[i].display]) ? `${config.staticCDN}${Data.boardExamsImage[iasTopCourseByCCMIds[i].display]}` : `${config.staticCDN}images/ias_slp_boards.webp`,
            deeplink_url: `doubtnutapp://course_category?category_id=${iasTopCourseByCCMIds[i].display}&title=${iasTopCourseByCCMIds[i].display}`,
        };
    }
    const userCourseModified = [];
    for (let i = 0; i < iasTopCourseData.length; i++) {
        if (userCourse[iasTopCourseData[i].display]) {
            userCourseModified.push(iasTopCourseData[i]);
            delete userCourse[iasTopCourseData[i].display];
            iasTopCourseData.splice(i, 1);
            i--;
        }
    }
    coursePlaylist.playlist = [...userCourseModified, ...iasTopCourseData, ...Object.values(userCourse)];

    coursePlaylist.playlist.forEach((x) => {
        x.deeplink_url = locale == 'hi' ? x.deeplink_url_hindi : x.deeplink_url;
        x.display = global.t8[locale].t(x.display.toLowerCase()) || x.display;
    });
    return coursePlaylist;
}

async function getRecentSearches(studentId, locale, versionCode) {
    const recentSearches = {
        header: Data.iasSuggestionTitleLocalisation(locale).recent, data_type: 'recent', type: 'recent_search_clicked', img_url: '', view_type: 'list',
    };
    if (versionCode >= 832) {
        recentSearches.playlist = [];
        recentSearches.item_image_url = `${config.staticCDN}images/ias_recent.png`;
        return recentSearches;
    }
    const query = { student_id: studentId, is_clicked: true, size: { $gt: 0 } };
    const recentSearch = await GlobalSearchLog.find(query).sort({ _id: -1 }).limit(10);
    const playlist = [];
    if (recentSearch.length) {
        if (recentSearch[0].search_text) {
            playlist.push({ display: recentSearch[0].search_text, image_url: `${config.staticCDN}images/ias_recent.png` });
        }
        for (let i = 1; i < recentSearch.length && playlist.length < 3; i++) {
            if (recentSearch[i].search_text && !recentSearch[i].search_text.includes(playlist[playlist.length - 1].display)) {
                const obj = { display: recentSearch[i].search_text, image_url: `${config.staticCDN}images/ias_recent.png` };
                playlist.push(obj);
            }
        }
    }
    recentSearches.playlist = playlist;
    return recentSearches;
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

async function getRecentWatchedVideo(db, studentClass, locale, flagVideo) {
    locale = locale === 'hi' ? 'hi' : 'en';
    const recentWatched = {
        header: Data.iasSuggestionTitleLocalisation(locale).recent_video, data_type: 'video', type: 'ias_most_recent_doubt_clicked', img_url: '', view_type: 'horizontal',
    };
    const recentWatchedData = await searchContainer.getRecentWatchedVideo(db, studentClass, flagVideo, locale);
    recentWatchedData.map((x) => {
        x.bg_color = Data.iasLandinBgColor[Math.floor(Math.random() * Data.iasLandinBgColor.length)];
        return x;
    });
    recentWatched.header = Data.iasSuggestionTitleLocalisation(locale).recent_live_video;
    recentWatched.playlist = recentWatchedData || [];
    return recentWatched;
}

async function getExtraMarkCourse({
    db, studentClass, versionCode, studentId, studentLocale, xAuthToken, page, pznElasticSearchInstance,
}) {
    const extraMarksData = {
        header: Data.iasSuggestionTitleLocalisation(studentLocale).extra_marks, data_type: 'video', type: 'extra_marks_clicked', img_url: '', view_type: 'horizontal', playlist: [],
    };
    if (versionCode <= 939) {
        return extraMarksData;
    }

    const extraMarksCourse = await CourseHelper.getPaidAssortmentsData({
        db, studentClass, config, versionCode, studentId, studentLocale, xAuthToken, page, pznElasticSearchInstance,
    });
    if (extraMarksCourse && extraMarksCourse.items && extraMarksCourse.items.length) {
        for (let i = 0; i < extraMarksCourse.items.length; i++) {
            const courseData = extraMarksCourse.items[i].data;
            if (courseData && courseData.title && courseData.image_bg && courseData.deeplink && courseData.monthly_price) {
                extraMarksData.playlist.push({
                    image_url: courseData.image_bg, deeplink_url: courseData.deeplink, chapter: courseData.title, subject: `₹${courseData.monthly_price}/Mo`,
                });
            }
        }
    }
    return extraMarksData;
}

async function getPopularCourse(db, studentClass, locale, studentId, versionCode) {
    const popularCourseHomeData = {
        header: Data.iasSuggestionTitleLocalisation(locale).course_for_you, data_type: 'video', type: 'popular_course_for_you_clicked', img_url: '', view_type: 'horizontal', playlist: [],
    };
    if (versionCode <= 939) {
        return popularCourseHomeData;
    }

    const popularCourseData = await CourseContainer.getLatestLauncedCourses(db, studentClass, locale, studentId);
    const assortmentList = []; let popularCourseFinalData;
    popularCourseData.map((item) => assortmentList.push(item.assortment_id));
    if (popularCourseData.length) {
        const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId);
        const promise = [];
        for (let i = 0; i < popularCourseData.length; i++) {
            promise.push(CourseHelper.generateAssortmentObject({
                data: popularCourseData[i], config, paymentCardState: { isVip: false }, assortmentPriceMapping, db, setWidth: true, versionCode, assortmentFlagrResponse: {}, locale, category: null, page: 'HOMEPAGE', studentId,
            }));
        }
        popularCourseFinalData = await Promise.all(promise);
    }
    if (popularCourseFinalData && popularCourseFinalData.length) {
        for (let i = 0; i < popularCourseFinalData.length; i++) {
            const courseData = popularCourseFinalData[i].data;
            if (courseData && courseData.title && courseData.image_bg && courseData.deeplink && courseData.monthly_price) {
                popularCourseHomeData.playlist.push({
                    image_url: courseData.image_bg, deeplink_url: courseData.deeplink, chapter: courseData.title, subject: `₹${courseData.monthly_price}/Mo`,
                });
            }
        }
    }
    return popularCourseHomeData;
}

// eslint-disable-next-line no-shadow
async function inAppSearchSuggestion(inAppSearchElasticInstance, text, studentClass, config, featureIds) {
    const count = 10;
    const data = {};
    let result = [];
    // fetch result using anmol code
    if (featureIds && !_.isEmpty(featureIds) && featureIds.ias_suggester && featureIds.ias_suggester.enabled) {
        const obj = { text, studentClass, count };
        obj.version = featureIds.ias_suggester.index_identifier ? featureIds.ias_suggester.index_identifier : 'v2.5';
        const iasSuggList = await axioInst.iasInstEsV7({
            method: 'get',
            headers: { 'Content-Type': 'application/json' },
            url: `${config.IAS_VANILLA_BASE_URL}/api/v1/auto-suggest`,
            timeout: 2500,
            data: obj,
        });
        if (iasSuggList && iasSuggList.status === 200 && iasSuggList.data && iasSuggList.data.suggestions && iasSuggList.data.suggestions.length) {
            const bulk = iasSuggestionImpressionLogs.collection.initializeUnorderedBulkOp();
            iasSuggList.data.suggestions.forEach((x) => {
                result.push({ display: x, class: studentClass, variant_id: featureIds.ias_suggester.variant_id });
                bulk.find({ result_string: x }).upsert().update({ $set: { updatedAt: new Date() }, $setOnInsert: { result_string: x, clicked_count: 0, createdAt: new Date() }, $inc: { view_count: 1 } });
            });
            bulk.execute((err, results) => {
                if (err) console.error(err);
                else console.log(results);
            });
        }
    }

    if (result.length < count) {
        const qasKSuggestion = await inAppSearchElasticInstance.findByOcrUsingIndexNew1(text, config.elastic.REPO_INDEX_WITH_SYNONYMS);
        if (qasKSuggestion && qasKSuggestion.hits.hits && qasKSuggestion.hits.hits.length) {
            const list = qasKSuggestion.hits.hits.slice(0, 6);
            result = [...result, ...list.map((x) => ({
                display: x._source.ocr_text, class: '', id: x._id, variant_id: 0,
            }))];
        }
    }
    data.suggestions = result.splice(0, count);
    data.ias_suggestion_iteration = 'v6';
    return data;
}

async function getPopularOnDoubtnut(db, studentClass, studentId, locale, flag, isFreeApp = false) {
    let PopularPlaylist; let PopularOnDNData; let PopularData; let i;
    if (flag === 0) {
        const studentPackageList = await CourseMysqlV2.getUserActivePackages(db.mysql.read, studentId);
        PopularPlaylist = {
            header: isFreeApp ? Data.iasSuggestionTitleLocalisation(locale).popular_on_mission_buniyad : Data.iasSuggestionTitleLocalisation(locale).popular_on_doubtnut, data_type: 'popular_on_doubtnut', type: 'ias_popular_on_doubtnut_clicked', img_url: '', view_type: 'horizontal',
        };
        PopularOnDNData = await searchContainer.getPopularPlaylist(db, studentClass, locale, 0, isFreeApp);
        PopularData = (PopularOnDNData && PopularOnDNData.length && PopularOnDNData[0].data) ? JSON.parse(PopularOnDNData[0].data) : [];
        const PD = [];
        if (studentPackageList && studentPackageList.length) {
            for (i = 0; i < PopularData.length; i++) {
                if (PopularData[i].display !== 'Free classes') {
                    PD.push(PopularData[i]);
                }
            }
            PopularPlaylist.playlist = (PD && PD.length) ? PD : [];
        } else {
            PopularPlaylist.playlist = (PopularData && PopularData.length) ? PopularData : [];
        }
        if (locale === 'hi') {
            PopularPlaylist.playlist.forEach((x) => {
                x.display = x.hindi_display || x.display;
            });
        }
    } else {
        PopularOnDNData = await searchContainer.getPopularPlaylist(db, studentClass, locale, 1, isFreeApp);
        const item = (PopularOnDNData && PopularOnDNData.length && PopularOnDNData[0].data) ? JSON.parse(PopularOnDNData[0].data) : [];
        PopularPlaylist = {
            widget_data: {
                title: global.t8[locale].t(isFreeApp ? 'Popular On Mission Buniyaad' : 'Popular On Doubtnut'),
                scroll_direction: 'grid',
                is_title_bold: true,
                title_text_size: 16,
                items: item,
                id: 6,
            },
            widget_type: 'widget_parent',
            order: 7,
        };
    }
    return PopularPlaylist;
}

async function getIasFilterData(stClass, tabType, requiredFilter, filterListObj) {
    const obj = {
        text: '', studentClass: stClass, count: 1, version: 'v12.1', contentAccess: 0, filters: {},
    };
    requiredFilter = requiredFilter === 'class' ? 'studentClass' : requiredFilter;
    obj.filters[`${tabType}`] = {};

    const filterList = Object.keys(filterListObj);
    for (let i = 0; i < filterList.length; i++) {
        if (filterListObj[filterList[i]] && requiredFilter !== filterListObj[filterList[i]]) {
            obj.filters[tabType][filterList[i]] = [filterListObj[filterList[i]]];
        }
    }

    return axioInst.iasInstEsV7({
        method: 'get',
        headers: { 'Content-Type': 'application/json' },
        url: `${config.IAS_VANILLA_BASE_URL}/api/v1/suggest`,
        timeout: 2500,
        data: obj,
    });
}

module.exports = {
    getRecentSearches,
    getTrendingPlaylist,
    howItWorksIas,
    getTopTagsPlaylist,
    getRecentWatchedVideo,
    inAppSearchSuggestion,
    getBookslist,
    getCourseslist,
    getExamslist,
    getExtraMarkCourse,
    getPopularCourse,
    getIasFilterData,
    getPopularOnDoubtnut,
};
