/* eslint-disable default-case */
const _ = require('lodash');
const libraryHelper = require('./library.helper');
const studentCourseMapping = require('../../../modules/studentCourseMapping');
const libraryMysql = require('../../../modules/mysql/library');
const libraryContainer = require('../../../modules/containers/library');
const redisUtility = require('../../../modules/redis/utility.redis');
const LibTranslation = require('../../../modules/translation/library');
const UtilityTranslate = require('../../../modules/utility.translation');
const Data = require('../../../data/data');
const altAppData = require('../../../data/alt-app');
const keys  = require('../../../modules/redis/keys');

// const AppBannerContainer = require('../../../modules/containers/appBanner');

const redis = require('../../../modules/redis/library');

let db; let config;

async function getAllLibraryLandingData(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id: studentId, locale } = req.user;
        let studentClass;
        if (req.query.class && req.query.class != '13') {
            studentClass = req.query.class;
        } else {
            studentClass = req.user.student_class;
        }
        const { version_code: versionCode } = req.headers;

        const country = req.headers.country || null;
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        const ccmIdData = await studentCourseMapping.getCcmIdWithCourseFromStudentId(db.mysql.read, studentId);
        let dynamicDataRedisKey = `${keys.LIBRARY_V10_DYNAMIC_DATA_CACHE}${studentClass}_${studentId}_${versionCode}_${locale}_${isFreeApp}`;
        let staticDataRedisKey = `${keys.LIBRARY_V11_STATIC_DATA_CACHE}${studentClass}_${versionCode}_${locale}_${isFreeApp}`;
        if (!_.isEmpty(ccmIdData)) {
            dynamicDataRedisKey = `${keys.LIBRARY_V10_DYNAMIC_DATA_CACHE}${studentClass}_${studentId}_${versionCode}_${ccmIdData.map((e) => e.ccm_id).join('_')}_${locale}_${isFreeApp}`;
            if (studentClass === '12') {
                staticDataRedisKey = `${keys.LIBRARY_V11_STATIC_DATA_CACHE}${studentClass}_${versionCode}_${locale}_${ccmIdData.map((e) => e.ccm_id).join('_')}_${isFreeApp}`;
            }
        }
        const [redisDynamicCache, redisStaticCache] = await Promise.all([
            redis.getByKey(dynamicDataRedisKey, db.redis.read),
            redis.getByKey(staticDataRedisKey, db.redis.read),
        ]);

        const dynamicDataHerdingKey = `PRE_${dynamicDataRedisKey}`;
        const staticDataHerdingKey = `PRE_${staticDataRedisKey}`;
        // redisCache = null;
        let result;
        let staticDataResult;
        let dynamicDataResult;
        if (redisDynamicCache != null && redisDynamicCache.length) {
            dynamicDataResult = JSON.parse(redisDynamicCache);
        } else {
            // compute
            // eslint-disable-next-line no-lonely-if
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, dynamicDataHerdingKey)) {
                dynamicDataResult = [];
            } else {
                redisUtility.setCacheHerdingKeyNew(db.redis.write, dynamicDataHerdingKey);
                const promise = [];
                promise.push(
                    libraryHelper.createContinueWatchingWidget({
                        studentId, locale, order: -12000, id: 1, db,
                    }),
                    libraryHelper.createTrendingWithCcmIDWidget({
                        studentClass, ccmIdData, order: -9999, id: 2, db, locale, studentId, config,
                    }),
                    libraryHelper.createCcmIdBasedVideosWidget({
                        ccmIdData, order: -9998, id: 3, db, locale, studentClass,
                    }),
                );
                dynamicDataResult = await Promise.all(promise);
                redis.setByKey(dynamicDataRedisKey, dynamicDataResult, (60 * 60), db.redis.write);
                redisUtility.removeCacheHerdingKeyNew(db.redis.write, dynamicDataHerdingKey);
            }
        }

        if (redisStaticCache != null && redisStaticCache.length) {
            staticDataResult = JSON.parse(redisStaticCache);
        } else {
            // get from mysql
            // eslint-disable-next-line no-lonely-if
            if (await redisUtility.cacheHerdingKeyExistsNew(db.redis.read, staticDataHerdingKey)) {
                staticDataResult = [];
            } else {
                redisUtility.setCacheHerdingKeyNew(db.redis.write, staticDataHerdingKey);
                const staticDataPromises = [];
                let libraryLandingInfo = await libraryMysql.getLibraryLandingInfoForV9(db.mysql.read, studentClass, versionCode);
                await LibTranslation.fetchLandingData(db, libraryLandingInfo, locale);
                libraryLandingInfo = _.groupBy(libraryLandingInfo, 'new_student_course');
                // console.log(libraryLandingInfo);
                for (const key in libraryLandingInfo) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (libraryLandingInfo.hasOwnProperty(key)) {
                        switch (key) {
                            case 'Learn with DEAR Sir':
                                staticDataPromises.push(libraryHelper.createDearSirTopicsWidget({
                                    studentClass, studentId, playlistIdsData: libraryLandingInfo[key], locale, country, limit: 0, order: 3, id: 10, db, config,
                                }));
                                break;
                            case 'NCERT Book Solutions':
                                if (studentClass != 14) {
                                    staticDataPromises.push(libraryHelper.createBooksWidget({
                                        versionCode, studentClass, studentId, playlistId: libraryLandingInfo[key][0].id, packageId: '', locale, source: 'NCERT', bookFlow: true, order: libraryLandingInfo[key][0].new_playlist_order, id: 4, db,
                                    }));
                                } else {
                                    // eslint-disable-next-line no-await-in-loop
                                    const data = await libraryMysql.getPlaylistWithNameAndVersionCode(db.mysql.read, versionCode, 'NCERT Books Solutions');
                                    staticDataPromises.push(libraryHelper.createBooksWithTabsWidget({
                                        versionCode, studentClass, studentId, playlistIdsData: data, packageId: '', locale, source: 'NCERT', bookFlow: true, order: 5, id: 5, db, config,
                                    }));
                                }
                                break;
                            case 'Exams':
                                staticDataPromises.push(libraryHelper.createClassExamsWidget({
                                    versionCode, studentClass, studentId, playlistIdsData: libraryLandingInfo[key], packageId: '', locale, source: '', bookFlow: true, order: 6, id: 30, db, ccmIdData,
                                }));
                                break;
                            case 'Check Subject wise topic Videos':
                                staticDataPromises.push(libraryHelper.createSubjectTopicsWidget({
                                    versionCode, playlistIdsData: libraryLandingInfo[key], locale, order: 7, id: 6, db,
                                }));
                                if (!_.includes([6, 7, 8, 14], studentClass)) {
                                    staticDataPromises.push(libraryHelper.createBooksWithTabsWidget({
                                        versionCode, studentClass, studentId, playlistIdsData: libraryLandingInfo[key], packageId: '', locale, source: '', bookFlow: true, order: 5, id: 5, db, config,
                                    }));
                                }
                                break;
                            case 'Check topic Videos':
                                libraryLandingInfo[key][0].name = 'Maths';
                                libraryLandingInfo[key][0].original_name = 'Maths';
                                staticDataPromises.push(libraryHelper.createSubjectTopicsWidget({
                                    playlistIdsData: libraryLandingInfo[key], locale, order: 4, id: 6, db,
                                }));
                                break;
                            case 'More From Doubtnut':
                                // eslint-disable-next-line no-loop-func
                                libraryLandingInfo[key].forEach((element) => {
                                    let topIcon = false;
                                    if (element.original_name === 'Latest From Doubtnut' && (!isFreeApp)) {
                                        topIcon = true;
                                    }
                                    if (!(['Board Exam Results - 2021', 'Latest From Doubtnut', 'Toppers Talk'].includes(element.original_name) && isFreeApp)) {
                                        staticDataPromises.push(libraryHelper.createMoreFromDoubtnutVideosWidget({
                                            studentClass, studentId, playlistIdData: element, locale, topIcon, country, limit: 4, order: 12, id: 9, db, config,
                                        }));
                                    }
                                });
                                break;
                            case 'More Playlists':
                                staticDataPromises.push(libraryHelper.createHistoryWatchLaterWidget({
                                    playlistIdsData: libraryLandingInfo[key], locale, order: 13, id: 15, db,
                                }));
                                break;
                            case 'Download Unlimited PDFs':
                                staticDataPromises.push(libraryHelper.createPdfsWidget({
                                    playlistIdsData: libraryLandingInfo[key], order: 8, id: 16, db, locale,
                                }));
                                break;
                        }
                    }
                }
                staticDataResult = await Promise.all(staticDataPromises);
                redis.setAllCache(staticDataRedisKey, staticDataResult, db.redis.write);
                redisUtility.removeCacheHerdingKeyNew(db.redis.write, staticDataHerdingKey);
            }
        }
        if (staticDataResult.length && !_.isEmpty(staticDataResult)) {
            const ncertBookIndex = _.findIndex(staticDataResult, (o) => {
                try {
                    const boolResult = o.widget_data.original_title === 'NCERT Book Solutions';
                    return boolResult;
                } catch (e) {
                    // console.error(e);
                    return false;
                }
            });
            const popularBookIndex = _.findIndex(staticDataResult, (o) => {
                try {
                    const boolResult = o.widget_data.original_title === 'Popular Book Solutions';
                    return boolResult;
                } catch (e) {
                    // console.error(e);
                    return false;
                }
            });
            if (ncertBookIndex > -1) {
                staticDataResult[ncertBookIndex].order = '-11000';
            }
            if (popularBookIndex > -1) {
                staticDataResult[popularBookIndex].order = '-10999';
            }
        }
        result = [...dynamicDataResult, ...staticDataResult];
        result = _.sortBy(result, (o) => parseInt(o.order));
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                list: result,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.error(e);
        next(e);
    }
}

async function getExamHeadersAndFilters(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { exam_id: examId } = req.query;
        // console.log(examId);
        const { locale } = req.user;

        let tabData;
        let examDetails = {};
        [tabData, examDetails] = await Promise.all([
            libraryMysql.getExamTabData(db.mysql.read, examId, req.headers.version_code, req.user.student_class),
            libraryMysql.getResource(db.mysql.read, req.user.student_class, req.user.student_id, examId),

        ]);
        let data = {};
        await LibTranslation.fetchLandingData(db, examDetails, locale);
        if (_.isEmpty(tabData)) {
            data = {
                page_title: examDetails[0].name,
                exam_id: examId,
                tab_data: [
                    {
                        tab_text: 'Dummy',
                        tab_id: '',
                        is_selected: true,
                        filter_data: [
                            {
                                filter_text: 'Dummy',
                                filter_data_type: 'by_chapter',
                                filter_id: '',
                                is_selected: true,
                            },
                        ],
                    },
                ],
            };
        } else {
            tabData = _.groupBy(tabData, 'header_name');
            // console.log(tabData);
            if (_.find(tabData, (element) => element[0].header_name.toLowerCase() === 'by year') || _.find(tabData, (element) => element[0].header_name.toLowerCase() === 'by chapter')) {
                // console.log(true);
                data = {
                    page_title: examDetails[0].name,
                    exam_id: examId,
                    tab_data: [
                        {
                            tab_text: 'Dummy',
                            tab_id: '',
                            is_selected: true,
                            filter_data: [],
                        },
                    ],
                };
                for (const key in tabData) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (tabData.hasOwnProperty(key)) {
                        data.tab_data[0].filter_data.push({
                            filter_text: UtilityTranslate.translate((tabData[key][0].header_name.toLowerCase() === 'by year') ? 'By Year' : 'By Chapter', locale, Data),
                            filter_data_type: (tabData[key][0].header_name.toLowerCase() === 'by year') ? 'by_year' : 'by_chapter',
                            filter_id: tabData[key][0].header_id,
                            is_selected: false,
                        });
                    }
                }
                data.tab_data[0].filter_data = _.sortBy(data.tab_data[0].filter_data, (o) => o.filter_data_type.length);
                data.tab_data[0].filter_data[0].is_selected = true;
            } else {
                // console.log(false);
                data = {
                    page_title: examDetails[0].name,
                    exam_id: examId,
                    tab_data: [],
                };
                for (const key in tabData) {
                    // eslint-disable-next-line no-prototype-builtins
                    if (tabData.hasOwnProperty(key)) {
                        const tabHeader = {
                            tab_text: _.isEmpty(Data.library_v957_subjects[tabData[key][0].header_name.toLowerCase()]) ? Data.library_v957_subjects[tabData[key][0].header_name.toLowerCase()].text[locale] : tabData[key][0].header_name,
                            tab_id: tabData[key][0].header_id,
                            is_selected: false,
                            filter_data: [],
                        };
                        tabData[key].forEach((element) => {
                            // console.log(element);
                            if (element.filter_id !== null) {
                                tabHeader.filter_data.push({
                                    filter_text: UtilityTranslate.translate((element.filter_name.toLowerCase() === 'by year') ? 'By Year' : 'By Chapter', locale, Data),
                                    filter_data_type: (element.filter_name.toLowerCase() === 'by year') ? 'by_year' : 'by_chapter',
                                    filter_id: element.filter_id,
                                    is_selected: false,
                                });
                            }
                        });
                        if (!tabHeader.filter_data.length) {
                            tabHeader.filter_data.push({
                                filter_text: 'Dummy',
                                filter_data_type: 'by_chapter',
                                filter_id: '',
                                is_selected: false,
                            });
                        }
                        tabHeader.filter_data = _.sortBy(tabHeader.filter_data, (o) => o.filter_data_type.length);
                        tabHeader.filter_data[0].is_selected = true;
                        data.tab_data.push(tabHeader);
                    }
                }
                data.tab_data[0].is_selected = true;
            }
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
        console.log(e);
        next(e);
    }
}

async function getExamByYearFilterHeadings(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            tab_id, filter_id, filter_data_type, exam_id, filter_text,
        } = req.query;
        const { locale } = req.user;
        // console.log(tab_id, filter_id, filter_data_type, exam_id);
        const selectedFilterData = [];
        if (filter_data_type !== 'by_chapter') {
            const filterData = await libraryContainer.getPlaylistWithView(db, req.user.student_class, req.user.student_id, 1, 10000, filter_id, req.headers.version_code, false);
            await LibTranslation.fetchLandingData(db, filterData, locale);
            // console.log(filterData);
            filterData.forEach((element) => {
                selectedFilterData.push({
                    text: element.name,
                    id: element.id,
                    is_selected: false,
                });
            });
            if (selectedFilterData.length) {
                selectedFilterData[0].is_selected = true;
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                exam_id,
                tab_id,
                filter_id,
                filter_text,
                filter_data_type,
                selected_filter_data: selectedFilterData,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getExamData(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const {
            id: selectedPaperId, filter_id: filterId, filter_text: filterText, filter_data_type: filterDataType, tab_id: tabId, exam_id: examId,
        } = req.query;
        // console.log(selectedPaperId, filterId, filterDataType, tabId, examId);
        let data = {};
        let playlistId;
        const { locale } = req.user;

        if (!_.isEmpty(selectedPaperId) && filterDataType === 'by_year') {
            playlistId = selectedPaperId;
        } else if (!_.isEmpty(filterId)) {
            playlistId = filterId;
        } else if (!_.isEmpty(tabId)) {
            playlistId = tabId;
        } else {
            playlistId = examId;
        }
        // console.log(playlistId);
        const selectionData = await libraryContainer.getPlaylistWithView(db, req.user.student_class, req.user.student_id, 1, 10000, playlistId, req.headers.version_code, false);
        await LibTranslation.fetchLandingData(db, selectionData, locale);
        data = {
            exam_id: examId,
            tab_id: tabId,
            filter_id: filterId,
            filter_text: filterText,
            filter_data_type: filterDataType,
            exam_widget_data: [],

        };
        selectionData.forEach((element) => {
            let widgetDeeplink = '';
            if (element.resource_path === null) {
                if (element.is_last === 1) {
                    widgetDeeplink = libraryHelper.getLibraryV9Deeplink('playlist', element.id, element.name);
                } else {
                    widgetDeeplink = libraryHelper.getLibraryV9Deeplink('topic', element.id, element.name);
                }
            }
            const widgetItem = {
                widget_type: 'widget_pdf_view',
                widget_data: {
                    title: element.name,
                    link: element.resource_path !== null ? element.resource_path : '',
                    deeplink: widgetDeeplink,
                },
            };
            if (filterDataType === 'by_year') {
                widgetItem.widget_data.hide_icon = true;
                widgetItem.widget_data.show_forward_arrow = true;
            }
            data.exam_widget_data.push(widgetItem);
        });
        if (_.isEmpty(selectionData) || data.exam_widget_data.length) {
            data.deeplink = libraryHelper.getLibraryV9Deeplink('playlist', playlistId, '');
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
        console.log(e);
        next(e);
    }
}

async function getAllExams(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { widget_id: widgetId } = req.query;
        const tabIds = req.query.tab_ids || '';
        let studentClass;
        if (req.query.class && req.query.class != '13') {
            studentClass = req.query.class;
        } else {
            studentClass = req.user.student_class;
        }
        const selectExamIds = tabIds.split(',') || [];
        // console.log(selectExamIds);
        const { locale } = req.user;
        // console.log(studentClass);
        const data = await libraryMysql.getPlaylistIdByClassAndNewStudentCourse(db.mysql.read, studentClass, 'Exams');
        await LibTranslation.fetchLandingData(db, data, locale);
        const respData = {
            title: UtilityTranslate.translate('Explore other Exams', locale, Data),
            title_text_size: '16',
            title_text_color: '#000000',
            cta_text: UtilityTranslate.translate('Submit', locale, Data),
            cta_text_size: '16',
            cta_text_color: '#000000',
            show_close_btn: true,
            exam_widget_id: widgetId,
            widgets: [],
        };
        data.forEach((element) => {
            respData.widgets.push({
                widget_data: {
                    id: element.id,
                    title: element.name,
                    image_url: element.image_url,
                    is_checked: !!_.includes(selectExamIds, element.id.toString()),
                },
                widget_type: 'widget_library_exam',
            });
        });
        if (_.isEmpty(selectExamIds) || _.isEmpty(selectExamIds[0])) {
            respData.widgets[0].widget_data.is_checked = true;
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: respData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function changeExam(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { id: examIds } = req.body;
        let studentClass;
        if (req.query.class && req.query.class != '13') {
            studentClass = req.query.class;
        } else {
            studentClass = req.user.student_class;
        }
        const { student_id: studentId, locale } = req.user;
        const { version_code: versionCode } = req.headers;
        const promises = [];
        examIds.forEach((element) => {
            promises.push(libraryMysql.getResource(db.mysql.read, req.user.student_class, req.user.student_id, element));
        });
        const data = await Promise.all(promises);
        const playlistIdsData = [];
        data.forEach((element) => {
            playlistIdsData.push(element[0]);
        });
        await LibTranslation.fetchLandingData(db, playlistIdsData, locale);
        const examWidget = await libraryHelper.createClassExamsWidget({
            versionCode, studentClass, studentId, playlistIdsData, packageId: '', locale, source: '', bookFlow: true, order: 6, id: 30, db, widgetSource: 'change_exam',
        });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: examWidget,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
module.exports = {
    getAllLibraryLandingData,
    getExamHeadersAndFilters,
    getExamByYearFilterHeadings,
    getExamData,
    getAllExams,
    changeExam,
};
