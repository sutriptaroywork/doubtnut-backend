const _ = require('lodash');
const libraryMysql = require('../../../modules/mysql/library');
const Playlist = require('../../../modules/playlist');
const Utility = require('../../../modules/utility');
const LanguageContainer = require('../../../modules/containers/language');
const LibTranslation = require('../../../modules/translation/library');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const QuestionContainer = require('../../../modules/containers/question');
const AnswerContainer = require('../../../modules/containers/answer');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const contentUnlockContainer = require('../../../modules/containers/contentunlock');
const {
    makeData, getToatalLikesShare, makeHistoryData, getBookDeeplink, getLibraryBookDeeplink, attachDeeplinkForCustomDnShorts, makeNewFlowNcertBooksData, getNewFlowNcertFirstQuestions, makeNewFlowNcertBooksWidget,
} = require('./library.helper');
const flagrUtility = require('../../../modules/Utility.flagr');
const StaticData = require('../../../data/data');

let db; let config;
const redis = require('../../../modules/redis/library');
const CourseV2Mysql = require('../../../modules/mysql/coursev2');
const UtilityTranslate = require('../../../modules/utility.translation');
const Data = require('../../../data/data');

// eslint-disable-next-line no-shadow

// eslint-disable-next-line no-shadow
async function hasUserVisitedAnnouncement(studentId, announcementId, valid_from, valid_till) {
    console.log('studentId', studentId);
    const query = {
        user_id: studentId,
        announcement_id: announcementId,
        seen: { $gte: valid_from, $lte: valid_till },
    };
    console.log(query);
    const result = await db.mongo.read.collection('announcement_activity').find(query).toArray();
    console.log('announcement_activity', result.length);
    if (result.length >= 3) return true;
    console.log('returning false');
    return false;
}

async function checkIfAnnouncementPresent(data2, student_id) {
    if (typeof data2 !== 'undefined') {
        const announcementCache = await redis.getByKey('announcement_cache', db.redis.read);
        let announcementData;
        if (announcementCache != null && announcementCache.length) {
            announcementData = JSON.parse(announcementCache);
        } else {
            announcementData = await libraryMysql.getAllAnnouncements(db.mysql.read);
            redis.setByKey('announcement_cache', announcementData, announcementData.length * 60 * 60 * 2, db.redis.write);
        }
        console.log('announcementData', announcementData);
        console.log('data2', data2);
        for (let i = 0; i < data2.length; i++) {
            for (let j = 0; j < announcementData.length; j++) {
                if (announcementData[j].row_id == data2[i].id) {
                    console.log('announcementData found', announcementData[j]);
                    // eslint-disable-next-line no-await-in-loop
                    if (!(await hasUserVisitedAnnouncement(student_id, announcementData[j].id, announcementData[j].valid_from, announcementData[j].valid_till))) {
                        // eslint-disable-next-line no-new-object
                        const announcement = new Object();
                        announcement.type = announcementData[j].type;
                        announcement.state = true;
                        data2[i].announcement = announcement;
                    }
                }
            }
        }
        return data2;
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
        let playlist_info = bannerAndListCache[0];
        playlist_info = await checkIfAnnouncementPresent(playlist_info, student_id);
        const final_data = [];
        const main_title = new Set();
        const view_type = new Set();
        const final_list = [];
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
        const banner_view = { title: '', view_type: 'banner', list: banner };
        final_data.unshift(banner_view);
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

async function getTopHeaders(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const playlist_id = req.query.id;
        const promise = [];
        promise.push(libraryMysql.getTopNavigation(db.mysql.read, playlist_id));
        promise.push(libraryMysql.getPlaylistWithId(db.mysql.read, playlist_id));
        const result = await Promise.all(promise);
        const data = {};
        data.page_title = result[1][0].name;
        data.headers = result[0];
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
        next(e);
    }
}

async function markSeenIfEligible(student_id, playlist_id) {
    const announcementInfo = await libraryMysql.getInfoFromAnnouncementByTableNameAndLibraryId(db.mysql.read, 'new_library', playlist_id);
    console.log('announcementInfo', announcementInfo);
    if (announcementInfo.length != 0 && !(await hasUserVisitedAnnouncement(student_id, announcementInfo[0].id, announcementInfo[0].valid_from, announcementInfo[0].valid_till))) {
        console.log('markSeenIfEligible');
        const doc = { user_id: student_id, announcement_id: announcementInfo[0].id, seen: new Date() };
        console.log(doc);
        db.mongo.write.collection('announcement_activity').insertOne(doc, (e, r) => {
            console.log('written', e, r);
        });
    }
}

async function getPlaylist(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id: studentId, mobile } = req.user;
        const studentClass = req.query.student_class || req.user.student_class;
        const pageNo = req.query.page_no;
        const playlistId = req.query.id;
        const versionCode = req.headers.version_code || 646;
        const locale = req.user.locale || 'en';
        const packageId = req.query.package_details_id;
        const { source } = req.query;
        // const xAuthToken = req.headers['x-auth-token'];

        let responseData;
        if (parseInt(pageNo) > 1) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { list: [] },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        if (source === 'QA_WIDGET_BOOK') {
            const packadeDetailsArray = packageId.split('_');
            const subject = packadeDetailsArray[0];
            const chapter = packadeDetailsArray[1];
            const promise = [];
            //  fetching books data based on class
            promise.push(CourseV2Mysql.getBooksData(db.mysql.read, chapter, studentClass, subject));
            //  fetching books data without class filter
            promise.push(CourseV2Mysql.getBooksData(db.mysql.read, chapter, null, subject));
            let booksExists = await Promise.all(promise);
            if (!_.isEmpty(booksExists[0])) {
                booksExists = booksExists[0];
            } else if (!_.isEmpty(booksExists[1])) {
                booksExists = booksExists[1];
            } else {
                booksExists = [];
            }

            if (!_.isEmpty(booksExists)) {
                const items = [];
                _.map(booksExists, (book) => {
                    const obj = {
                        id: book.id,
                        name: book.original_book_name,
                        description: null,
                        is_last: 0,
                        is_first: 0,
                        resource_type: 'playlist',
                        student_class: 12,
                        subject: book.subject,
                        view_type: 'BOOK_INDEX',
                        empty_text: null,
                        image_url: book.thumbnail_url,
                        package_details_id: `LIBRARY_NEW_BOOK_${book.student_id}_${book.class}_${book.subject}`,
                    };
                    items.push(obj);
                });
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: { list: items },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
        }
        let bookFlow = false;
        const { subjectBookFlowIds } = StaticData;
        if (versionCode >= 946 && packageId === '' && subjectBookFlowIds.includes(playlistId)) {
            // bookFlow = await flagrUtility.getBooleanFlag(xAuthToken, 'new_book_flow');
            bookFlow = true;
        }
        let data = await makeData(db, versionCode, studentClass, studentId, playlistId, packageId, locale, source, bookFlow);
        if (config.service_switch.library_translation && versionCode >= 628) {
            await LibTranslation.translatePlaylist(db, data, locale);
        }
        if (source === 'NCERT_NEW_FLOW') {
            data = {
                page_title: '',
                filters: [],
                list: [],
            };
            data.list = await makeNewFlowNcertBooksData(db, studentId, studentClass, locale);
            if (!_.isEmpty(data.list)) {
                const groupedData = _.groupBy(data.list, 'subject');
                const subjectList = Object.keys(groupedData);

                let selectedSubject = '';
                for (let i = 0; i < subjectList.length; i++) {
                    data.filters.push({
                        id: i,
                        name: subjectList[i],
                        is_last: (i === subjectList.length - 1) ? '1' : '0',
                    });
                    if (parseInt(playlistId) === i) {
                        selectedSubject = subjectList[i];
                    }
                }
                if (!selectedSubject) {
                    selectedSubject = subjectList[0];
                }
                data.list = groupedData[selectedSubject];
                data.list = makeNewFlowNcertBooksWidget(data.list);
                data.list = await getNewFlowNcertFirstQuestions(db, data.list);
            }
        } else if (versionCode >= 946 && packageId === '' && bookFlow) {
            const typeOfBookView = ['BOOK', 'BOOK_INDEX'];
            const { dcPandeyBooks } = StaticData;
            const allowedClass = [9, 10, 11, 12];
            if (source === 'SEARCH_SRP') {
                data.list = await getBookDeeplink(db, studentId, playlistId, data.list);
            } else if (versionCode >= 955 && source === '' && allowedClass.includes(parseInt(studentClass))) {
                if (typeOfBookView.includes(data.list[0].view_type) || (data.list[0].view_type === 'LIST' && dcPandeyBooks.includes(data.list[0].id))) {
                    data.list = await getLibraryBookDeeplink(db, config, studentId, data.list);
                }
            }
        }

        if (versionCode >= 993) {
            attachDeeplinkForCustomDnShorts(data);
        }
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('error', e);
        next(e);
    }
}

// eslint-disable-next-line no-unused-vars
async function setPopularityOnChapter(data) {
    const popularList = 'select * from new_library_popular';
    const popular = await db.mysql.read.query(popularList);
    for (let i = 0; i < data.length; i++) {
        for (let j = 0; j < popular.length; j++) {
            if (data[i].id == popular[j].library_id) {
                data[i].image_url = 'https://via.placeholder.com/20';
                data[i].description = 'Trending';
            }
        }
    }
}

async function watchLater(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    // client = req.app.get('client');
    const { question_id } = req.body;
    const { student_id } = req.user;
    const student_class = req.query.student_class || req.user.student_class;
    const { type } = req.body;
    const playlist_info = await libraryMysql.getPlaylistByNameAndStudentClass(db.mysql.read, 'WATCH LATER', student_class);
    console.log('playlist_info', playlist_info);
    const playlist_id = playlist_info[0].id;
    console.log('playlist_id', playlist_id);
    if (type == 'add') {
        // eslint-disable-next-line no-unused-vars
        Playlist.addQuestionInPlaylist(playlist_id, question_id, student_id, db.mysql.write).then((result) => {
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!!',
                },
                data: 1,
            };
            res.status(responseData1.meta.code).json(responseData1);
        }).catch((error) => {
            console.log('error', error);
            next(error);
        });
    } else if (type == 'remove') {
        // eslint-disable-next-line no-unused-vars
        Playlist.removeQuestionFromPlaylist(playlist_id, question_id, student_id, db.mysql.write).then((result) => {
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS!!',
                },
                data: 0,
            };
            res.status(responseData1.meta.code).json(responseData1);
        }).catch((error) => {
            console.log('error', error);
            next(error);
        });
    }
}

async function getResource(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const elasticSearchInstance = req.app.get('elasticSearchInstance');
        const readMysql = db.mysql.read;
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { page_no } = req.query;
        let { id } = req.query;
        let unlockStatus = 1;
        const conceptVideosIds = ['101991', '101992', '101993', '101994', '101995', '101996', '101997', '101998'];
        const ncertSubjectIds = ['106220', '106221', '106223', '106222'];
        const bookSolutionsAutherIds = ['106225', '106227', '106229', '106231', '106233', '106234', '106236', '106238', '106224', '106226', '106228', '106230', '106232', '106235', '106237'];
        if (_.includes(bookSolutionsAutherIds, id)) {
            unlockStatus = await contentUnlockContainer.getUnlockStatus(db, student_id, 'PC');
        }
        markSeenIfEligible(student_id, id);
        if (id === 'NCERT') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'DPP') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'TRENDING') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'LATEST_FROM_DOUBTNUT') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'HISTORY') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'VIRAL') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, student_class, id);
            id = temp2[0].id;
        } else if (id === 'CRASH_COURSE') {
            const temp2 = await libraryMysql.getPlaylistId(db.mysql.read, 12, id);
            id = temp2[0].id;
        }
        const limit = 10;
        let language = 'english';
        const lang = await LanguageContainer.getByCode(req.user.locale, db);
        if (lang.length > 0) {
            language = lang[0].language;
        }
        const data = {};
        if (id === 'SFY') {
            data.library_playlist_id = id;
            if (page_no === '1') {
                const promise = [];
                promise.push(libraryMysql.getParentDataNew(db.mysql.read, student_class, null, 10, page_no));
                promise.push(AnswerContainer.getPreviousHistory(student_id, db));
                promise.push(QuestionContainer.getPreviousHistory(student_id, db));
                const result = await Promise.all(promise);
                data.header = result[0];
                // eslint-disable-next-line no-unused-vars
                const question_id_playlist = result[1];
                // console.log(result[1])
                // console.log(result[2])
                let ocr = ''; let question_id = '';
                if (result[1][0].parent_id == result[2][0].question_id && result[1].length > 0 && result[2].length > 0) {
                    question_id = result[1][0].question_id;
                    const d = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, question_id);
                    if (d.length > 0) {
                        ocr = d[0].ocr_text;
                    }
                    // ocr=result[2][0]['ocr_text']
                } else if (result[1][0].question_id !== result[2][0].question_id && result[2].length > 0) {
                    question_id = result[2][0].question_id;
                    ocr = result[2][0].ocr_text;
                }

                const output = await elasticSearchInstance.findByOcr(ocr);
                let colors = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
                colors = Utility.generateColorArr(colors);
                // data.playlist=output['hits']['hits']
                if (output.hits.hits.length > 0) {
                    let list = [];
                    for (let k = 0; k < output.hits.hits.length && k < 6; k++) {
                        if (output.hits.hits[k]._source.question_id !== question_id) {
                            const c = Utility.shuffle(colors);
                            const i_url = `${config.staticCDN}q-thumbnail/${output.hits.hits[k]._source.question_id}.png`;
                            const o = {
                                id: output.hits.hits[k]._source.question_id,
                                question_id: output.hits.hits[k]._source.question_id,
                                type: 'video',
                                ocr_text: output.hits.hits[k]._source.ocr_text,
                                question: output.hits.hits[k]._source.question,
                                image_url: i_url,
                                title: output.hits.hits[k]._source.ocr_text,
                                description: '',
                                page: 'HOME_FEED',
                                capsule_bg_color: '#ffffff',
                                capsule_text_color: '#000000',
                                start_gradient: c[0][0],
                                mid_gradient: c[0][1],
                                end_gradient: c[0][2],
                                chapter: output.hits.hits[k]._source.meta_chapter,
                                capsule_text: null,
                                duration: null,
                                duration_text_color: '#000000',
                                duration_bg_color: '#ffffff',
                                views: null,
                            };
                            list.push(o);
                        }
                    }
                    list = await getToatalLikesShare(list, student_id, db);
                    list = Utility.addWebpThumbnail([list], config);
                    data.playlist = list[0];
                }
            } else {
                data.playlist = [];
            }
        } else {
            const data1 = await libraryMysql.getcheckPlaylist(db.mysql.read, student_class, student_id, id);
            if (data1[0].parent !== null && data1[0].parent !== '0') {
                const masterParentData = await libraryMysql.getcheckPlaylist(db.mysql.read, student_class, student_id, data1[0].master_parent);
                console.log(masterParentData);
                data.library_playlist_id = masterParentData[0].description;
            } else if (data1[0].parent === null && data1[0].student_id !== '98') {
                data.library_playlist_id = data1[0].description;
            } else {
                data.library_playlist_id = data1[0].id;
            }
            if (data1.length !== 0) {
                let data2;
                if (data1[0].parent === '0') {
                    data2 = await libraryMysql.getcustomPlaylist(db.mysql.read, student_class, student_id, page_no, 10, id);
                } else {
                    data2 = await libraryMysql.getParentDataNewWithPCM(db.mysql.read, student_class, data1[0].parent, 10, page_no);
                }
                if (page_no === '1') {
                    for (let i = 0; i < data2.length; i++) {
                        if (_.includes(conceptVideosIds, data2[i].parent)) {
                            if (unlockStatus !== 0) {
                                data2[i].is_locked = 0;
                            } else if (data2[i].subject && data2[i].subject !== 'MATHS') {
                                data2[i].is_locked = 1;
                            } else {
                                data2[i].is_locked = 0;
                            }
                        }
                        if (_.includes(ncertSubjectIds, data2[i].parent) || _.includes(bookSolutionsAutherIds, data2[i].parent)) {
                            if (unlockStatus !== 0) {
                                data2[i].is_locked = 0;
                            } else if (i > 0 && data2[i].subject && data2[i].subject !== 'MATHS') {
                                data2[i].is_locked = 1;
                            } else {
                                data2[i].is_locked = 0;
                            }
                        }
                    }
                    data.header = data2;
                }
                let data3 = await libraryMysql.getResource(db.mysql.read, student_class, student_id, id);
                if (data3[0].is_last == 1) {
                    let str = _.replace(data3[0].resource_path, /xxlanxx/g, language);
                    str = _.replace(str, /xxclsxx/g, student_class);
                    str = _.replace(str, /xxsidxx/g, student_id);
                    const sql = `${str} limit ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
                    console.log(sql);
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
                        description: 'Aapki saari saved Videos milengi yahan',
                    }];
                } else {
                    data3 = await getToatalLikesShare(data3, student_id, db);
                    data3 = Utility.addWebpThumbnail([data3], config);
                    const whatsappData = await appConfigConatiner.getWhatsappData(db, student_class);
                    if (whatsappData.length > 0 && page_no === '1') {
                        whatsappData[0].key_value = JSON.parse(whatsappData[0].key_value);
                        whatsappData[0].image_url = whatsappData[0].key_value.image_url;
                        whatsappData[0].description = whatsappData[0].key_value.description;
                        whatsappData[0].button_text = whatsappData[0].key_value.button_text;
                        whatsappData[0].button_bg_color = whatsappData[0].key_value.button_bg_color;
                        whatsappData[0].action_activity = whatsappData[0].key_value.action_activity;
                        whatsappData[0].action_data = whatsappData[0].key_value.action_data;
                        whatsappData[0].resource_type = 'card';
                        delete whatsappData[0].key_value;
                        data3[0].splice(1, 0, whatsappData[0]);
                    }

                    data.playlist = data3[0];
                }
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
        next(e);
    }
}

async function getCustomPlaylist(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const { student_id, student_class, locale } = req.user;
        const { page_no } = req.query;
        const playlist = req.query.playlist_name;

        const userData = {
            student_id,
            student_class,
            page_no,
            playlist,
            locale,
        };

        const data = await makeHistoryData(db, userData, config);
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
        next(e);
    }
}

// eslint-disable-next-line no-unused-vars
async function buildPopular(req, res, next) {
    const trendingName = 'TRENDING ON DOUBTNUT';
    const trendingVideos = `select id,resource_path,student_class from new_library where name = "${trendingName}" and is_first = 1 and is_admin_created = 1 and is_active = 1`;
    const language = 'english';
    // eslint-disable-next-line no-shadow
    const db = req.app.get('db');
    const trendingList = await db.mysql.read.query(trendingVideos);
    const class_list = [6, 7, 8, 9, 10, 11, 12, 14];
    await db.mysql.write.query('truncate table new_library_popular');
    for (let i = 0; i < class_list.length; i++) {
        console.log('trendingList[i].resource_path', trendingList[0].resource_path);
        let str = _.replace(trendingList[0].resource_path, /xxlanxx/g, language);
        str = _.replace(str, /xxclsxx/g, class_list[i]);
        // str = _.replace(str, /xxsidxx/g, student_id)
        str = _.replace(str, /xxplaylistxx/g, trendingList[0].id);
        console.log('str', str);
        // eslint-disable-next-line no-await-in-loop
        const trendingByClass = await db.mysql.read.query(str);
        for (let j = 0; j < trendingByClass.length; j++) {
            console.log(trendingByClass);
            const chapter_name = trendingByClass[j].chapter;
            const student_class = trendingByClass[j].class;
            const libraryQ = `select id from new_library where name = "${chapter_name}" and student_class = "${student_class}" and is_active = 1 and is_last = 0`;
            // eslint-disable-next-line no-await-in-loop
            const libraryQQ = await db.mysql.read.query(libraryQ);
            if (libraryQQ.length) {
                for (let k = 0; k < libraryQQ.length; k++) {
                    const insertQ = `insert into new_library_popular set library_id = ${libraryQQ[k].id}, is_trending = 1`;
                    db.mysql.write.query(insertQ);
                }
            }
        }
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        message: 'Done!!!',
    };
    res.status(responseData.meta.code).json(responseData);
}

module.exports = {
    getResource, getCustomPlaylist, getAll, getTopHeaders, getPlaylist, watchLater, buildPopular,
};
