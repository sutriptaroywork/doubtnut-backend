const bluebird = require('bluebird');
const mongoose = require('mongoose');
const _ = require('lodash');
const bl = require('./search.bl');
const Data = require('../../../data/data');
const altAppData = require('../../../data/alt-app');

bluebird.promisifyAll(mongoose);

async function getSuggestions(req, res) {
    try {
        const studentClass = req.user.student_class;
        const studentId = req.user.student_id;
        const versionCode = req.headers.version_code || 602;
        const { sessionId, source } = req.body;
        let { featureIds } = req.body;
        if (featureIds && typeof featureIds === 'string') {
            featureIds = JSON.parse(featureIds);
        }
        const flag = featureIds.is_trending_chapter_enabled ? 1 : 0;
        const flagVideo = featureIds.is_video_query_change_enabled ? 1 : 0;
        const locale = (req.user.locale && req.user.locale === 'hi') ? 'hi' : 'en';
        const db = req.app.get('db');
        const config = req.app.get('config');
        const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
        const data = [];

        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        // how it works coach marks
        let howItWorks; const analytics = {};
        const [courseData, extraMarksData, popularCourseHomeData, recentSearchData] = await Promise.all([
            bl.getCourseslist(db, studentClass, locale, versionCode, studentId),
            bl.getExtraMarkCourse({
                db, studentClass, config, versionCode, studentId, studentLocale: locale, xAuthToken: req.headers['x-auth-token'], page: 'HOMEPAGE', pznElasticSearchInstance,
            }),
            bl.getPopularCourse(db, studentClass, locale, studentId, versionCode),
            bl.getRecentSearches(studentId, locale, versionCode),
        ]);
        if (sessionId && sessionId > 0 && sessionId <= 3) {
            howItWorks = bl.howItWorksIas(req.user.locale, studentClass, sessionId);
            data.push({ howItWorks });
        }

        // search done from course page
        const [topTagsData, booksData, examsData, trendingData, recentVideo, popularOnDnData] = await Promise.all([
            bl.getTopTagsPlaylist(db, studentClass, locale),
            bl.getBookslist(db, studentClass, locale),
            bl.getExamslist(db, studentClass, locale),
            bl.getTrendingPlaylist(db, studentClass, locale, flag),
            bl.getRecentWatchedVideo(db, studentClass, locale, flagVideo),
            bl.getPopularOnDoubtnut(db, studentClass, studentId, locale, 0, isFreeApp),
        ]);
        if (source && source === 'library' && (!isFreeApp)) {
            data.push(booksData);
            data.push(examsData);
            data.push(recentSearchData);
            data.push(trendingData);
            data.push(recentVideo);
        } else if (source && (!isFreeApp) && (source === 'free_classes' || source === 'free_class_listing_page')) {
            data.push(topTagsData);
            data.push(recentSearchData);
            data.push(trendingData);
            data.push(recentVideo);
        } else if (source && (!isFreeApp) && (source === 'LibraryFragmentHome' || source === 'check_all_courses')) {
            if (!isFreeApp) {
                data.push(courseData);
                data.push(extraMarksData);
                data.push(popularCourseHomeData);
            }
            data.push(recentSearchData);
        } else {
            if (versionCode && versionCode >= 966) {
                data.push(popularOnDnData);
            }
            data.push(topTagsData);
            if (versionCode >= 848) {
                data.push(booksData);
                if (!isFreeApp) { data.push(courseData); }
                data.push(examsData);
                data.push(recentSearchData);
                data.push(trendingData);
            }
            data.push(recentVideo);
        }
        analytics.variant_info = [];

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
                analytics,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getSuggestionsWidgets(req, res) {
    try {
        const studentClass = req.user.student_class;
        const locale = (req.user.locale && req.user.locale === 'hi') ? 'hi' : 'en';
        const studentId = req.user.student_id;
        const db = req.app.get('db');
        const analytics = {};
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        const data = await Promise.all([bl.getPopularOnDoubtnut(db, studentClass, studentId, locale, 1, isFreeApp)]);
        analytics.variant_info = [];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
                analytics,
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getAutoSuggest(req, _res, next) {
    try {
        const config = req.app.get('config');
        const elasticSearchTestInstance = req.app.get('elasticSearchTestInstance'); // inAppSearchElasticInstance it was used previous
        const { text } = req.body;
        const studentClass = req.user.student_class || '12';
        let { featureIds } = req.body;
        if (featureIds && typeof featureIds === 'string') {
            featureIds = JSON.parse(featureIds);
        }
        const data = await bl.inAppSearchSuggestion(elasticSearchTestInstance, text, studentClass, config, featureIds);
        next({ data });
    } catch (err) {
        next({ err });
    }
}

async function getIasFeedback(req, res) {
    try {
        const requiredFilter = req.body.required_filter || 'class';
        const filterList = _.cloneDeep(Data.iasAdFilterDataList);
        const iasTabsData = _.cloneDeep(Data.iasTabsMapping);
        const tabType = req.body.tab_type && req.body.tab_type === 'live_class' ? 'liveClass' : req.body.tab_type;
        const resTabType = req.body.tab_type;
        const stClass = req.user.student_class;
        const filterListObj = {
            studentClass: req.body.class, language: req.body.language, board: req.body.board, exam: req.body.exam, subject: req.body.subject, chapter: req.body.chapter, expert: req.body.expert, author: req.body.author, publication: req.body.publication,
        };

        const filterData = await bl.getIasFilterData(stClass, tabType, requiredFilter, filterListObj);
        const tabFilterData = _.get(filterData, `data.${tabType}.agg`, {});
        const output = {};
        output.title = 'Filter your results';
        output.tab_type = resTabType;
        output.list = [];

        // result formating
        if (Object.keys(tabFilterData).length && iasTabsData[`${resTabType}`]) {
            for (let i = 0; i < filterList.length; i++) {
                const filterType = filterList[i].key;
                const resFilter = filterType === 'class' ? 'studentClass' : filterType;
                if (tabFilterData[resFilter] && tabFilterData[resFilter].length) {
                    if (filterType === requiredFilter) {
                        for (let j = 0; j < tabFilterData[resFilter].length; j++) {
                            let filterObj = {};
                            if (tabFilterData[resFilter][j].id && tabFilterData[resFilter][j].id === '13') {
                                filterObj = { key: tabFilterData[resFilter][j].id, value: 'Dropper' };
                            } else if (tabFilterData[resFilter][j].id && tabFilterData[resFilter][j].id === '14') {
                                filterObj = { key: tabFilterData[resFilter][j].id, value: 'Govt. Exams' };
                            } else {
                                filterObj = { key: tabFilterData[resFilter][j].id, value: tabFilterData[resFilter][j].text };
                            }
                            filterObj.is_selected = !!(requiredFilter === 'class' && stClass === filterObj.key);
                            filterList[i].list.push(filterObj);
                        }
                    }
                    if (requiredFilter === 'class' || filterType === requiredFilter) {
                        output.list.push(filterList[i]);
                    }
                }
            }
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: output,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    getSuggestions, getAutoSuggest, getIasFeedback, getSuggestionsWidgets,
};
