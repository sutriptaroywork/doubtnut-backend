const _ = require('lodash');
const libraryMysql = require('../../../modules/mysql/library');
const Utility = require('../../../modules/utility');
const LanguageContainer = require('../../../modules/containers/language');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const QuestionContainer = require('../../../modules/containers/question');
const LibraryContainer = require('../../../modules/containers/library');
const AnswerContainer = require('../../../modules/containers/answer');
const UserAnswerFeedbackContainer = require('../../../modules/containers/userAnswerFeedback');
const AppBannerContainer = require('../../../modules/containers/appBanner');

let db; let
    config;

async function getAll(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        let student_class;
        const limit = 10;
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 602;
        }
        if (req.query.class && req.query.class != '13') {
            student_class = req.query.class;
        } else {
            student_class = req.user.student_class;
        }
        const { page_no } = req.query;
        const promise = [];

        promise.push(LibraryContainer.getPlaylistTab(student_class, db));
        promise.push(LibraryContainer.getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, student_id, page_no, limit, db, version_code));
        promise.push(AppBannerContainer.getPromotionalData(db, student_class, 'LIBRARY', version_code));
        const result = await Promise.all(promise);
        const data = {};
        data.tab = result[0];
        data.playlist = await checkIfAnnouncementPresent(result[1], student_id);
        const banner = [];
        if (result[2] && result[2].length > 0) {
            for (let i = result[2].length - 1; i >= 0; i--) {
                result[2][i].action_data = JSON.parse(result[2][i].action_data);
                const temp = {};
                if (result[1] && result[1].length >= result[2][i].position) {
                    temp.index = result[2][i].position;
                } else {
                    temp.index = 1;
                }
                temp.scroll_size = '1x';
                temp.list_key = 'library';
                temp.resource_type = 'banner';
                temp.data = [result[2][i]];
                banner.push(temp);
            }
        }
        if (page_no == 1) {
            data.promotional_data = banner;
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

async function getPlaylist(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { page_no } = req.query;
        let playlist_id = req.query.id;
        const { pdf_package } = req.query;
        const { level_one } = req.query;
        const { course } = req.query;
        let deeplink_class = req.query.class;
        if (deeplink_class == '13') {
            deeplink_class = '12';
        }
        const { chapter } = req.query;
        const unlockStatus = 1;
        const conceptVideosIds = ['101991', '101992', '101993', '101994', '101995', '101996', '101997', '101998'];
        const ncertSubjectIds = ['106220', '106221', '106223', '106222'];
        const bookSolutionsAutherIds = ['106225', '106227', '106229', '106231', '106233', '106234', '106236', '106238', '106224', '106226', '106228', '106230', '106232', '106235', '106237'];
        // if (_.includes(bookSolutionsAutherIds,playlist_id)) {
        //     unlockStatus = await contentUnlockContainer.getUnlockStatus(db, student_id, "PC")
        // }
        // Deep Link Handling
        if (playlist_id === 'NCERT') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, student_class, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'JEE_MAIN') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 12, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'JEE_ADVANCE') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 12, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'BOARDS_12') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 12, playlist_id);
            playlist_id = temp[0].id;
        } else if (playlist_id === 'BOARDS_10') {
            const temp = await libraryMysql.getPlaylistId(db.mysql.read, 10, playlist_id);
            playlist_id = temp[0].id;
        } else if (typeof pdf_package !== 'undefined' && pdf_package.length !== 0 && typeof level_one !== 'undefined' && level_one.length > 0) {
            const temp = await libraryMysql.getPDFPlaylistId(db.mysql.read, student_class, pdf_package);
            const temp1 = await libraryMysql.getPDFParentPlaylistId(db.mysql.read, student_class, temp[0].id, level_one);
            playlist_id = temp1[0].id;
        } else if (typeof pdf_package !== 'undefined' && pdf_package.length !== 0) {
            const temp = await libraryMysql.getPDFPlaylistId(db.mysql.read, student_class, pdf_package);
            playlist_id = temp[0].id;
        } else if (typeof pdf_package !== 'undefined' && pdf_package === '') {
            const temp = await libraryMysql.getPDFPlaylistId(db.mysql.read, student_class, 'PDFs');
            playlist_id = temp[0].id;
        } else if (typeof deeplink_class !== 'undefined' && deeplink_class.length > 0 && typeof chapter !== 'undefined' && chapter.length > 0 && typeof course !== 'undefined' && (course === 'NCERT' || course === 'IIT')) {
            const temp = await libraryMysql.getPlaylistIdNew(db.mysql.read, deeplink_class, 'CONCEPT_VIDEOS');
            const temp1 = await libraryMysql.getParentPlaylistId(db.mysql.read, deeplink_class, temp[0].id, 'MATHS');
            const temp2 = await libraryMysql.getParentPlaylistId(db.mysql.read, deeplink_class, temp1[0].id, chapter);
            playlist_id = temp2[0].id;
        } else if (typeof course !== 'undefined' && course.length > 0 && (course === 'NCERT' || course === 'IIT')) {
            const temp = await libraryMysql.getPlaylistIdNew(db.mysql.read, student_class, 'CONCEPT_VIDEOS');
            const temp1 = await libraryMysql.getParentPlaylistId(db.mysql.read, student_class, temp[0].id, 'MATHS');
            playlist_id = temp1[0].id;
        }
        // Deeplink Handling ends Here

        markSeenIfEligible(student_id, playlist_id);
        const data = {};
        const data1 = await libraryMysql.getcheckPlaylistWithActive(db.mysql.read, student_class, student_id, playlist_id);
        if (data1.length !== 0) {
            const data2 = await libraryMysql.getParentDataNewWithPCM(db.mysql.read, student_class, data1[0].parent, 10, page_no);
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
                data.header = await checkIfAnnouncementPresent(data2, student_id);
            }
            let data3;
            if (data1[0].id == 0) {
                data3 = await libraryMysql.getcustomPlaylist(db.mysql.read, student_class, student_id, page_no, 10, playlist_id);
            } else {
                data3 = await LibraryContainer.getPlaylistWithPCM(db, student_class, student_id, page_no, 10, playlist_id);
            }
            if (data3.length === 0 && page_no === '1') {
                data.meta_info = [{
                    icon: `${config.staticCDN}images/empty_playlist.webp`,
                    title: 'NO VIDEOS',
                    description: data1[0].empty_text,
                    Button: 'WATCH TRENDING VIDEOS',
                    id: '100780',
                    playlist_name: 'TRENDING ON DOUBTNUT',
                }];
            } else {
                for (let i = 0; i < data3.length; i++) {
                    if (_.includes(conceptVideosIds, data3[i].parent)) {
                        if (unlockStatus !== 0) {
                            data3[i].is_locked = 0;
                        } else if (data3[i].subject && data3[i].subject !== 'MATHS') {
                            data3[i].is_locked = 1;
                        } else {
                            data3[i].is_locked = 0;
                        }
                    }

                    if (_.includes(ncertSubjectIds, data3[i].parent) || _.includes(bookSolutionsAutherIds, data3[i].parent)) {
                        if (unlockStatus !== 0) {
                            data3[i].is_locked = 0;
                        } else if (data3[i].subject && data3[i].subject !== 'MATHS') {
                            data3[i].is_locked = 1;
                            if (page_no === '1' && i < 1) {
                                data3[i].is_locked = 0;
                            }
                        } else {
                            data3[i].is_locked = 0;
                        }
                    }
                }
                data.playlist = await checkIfAnnouncementPresent(data3, student_id);
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
        const unlockStatus = 1;

        const conceptVideosIds = ['101991', '101992', '101993', '101994', '101995', '101996', '101997', '101998'];
        const ncertSubjectIds = ['106220', '106221', '106223', '106222'];
        const bookSolutionsAutherIds = ['106225', '106227', '106229', '106231', '106233', '106234', '106236', '106238', '106224', '106226', '106228', '106230', '106232', '106235', '106237'];

        // if (_.includes(bookSolutionsAutherIds,id)) {
        //     unlockStatus = await contentUnlockContainer.getUnlockStatus(db, student_id, "PC")
        // }

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
                const question_id_playlist = result[1];
                // console.log(result[1])
                // console.log(result[2])
                let ocr = ''; let
                    question_id = '';
                if (result[1][0].parent_id == result[2][0].question_id && result[1].length > 0 && result[2].length > 0) {
                    question_id = result[1][0].question_id;
                    const d = await QuestionContainer.getByQuestionIdLocalised(db, question_id);
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
                    list = Utility.addThumbnail([list], config);
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
                    data3 = Utility.addThumbnail([data3], config);
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
        console.log('error', e);
        next(e);
    }
}

async function getCustomPlaylist(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { page_no } = req.query;
        const playlist = req.query.playlist_name;
        const limit = 10;
        let language = 'english';
        const lang = await LanguageContainer.getByCode(req.user.locale, db);

        let data = [];
        if (lang.length > 0) {
            language = lang[0].language;
        }
        if (playlist === 'HISTORY') {
            const result = await libraryMysql.getHistoryPlaylist(db.mysql.read, playlist);

            let str = _.replace(result[0].resource_path, /xxlanxx/g, language);
            str = _.replace(str, /xxclsxx/g, student_class);
            str = _.replace(str, /xxsidxx/g, student_id);
            const sql = `${str} limit ${limit} OFFSET ${Utility.getOffset(page_no, limit)}`;
            // console.log(sql)
            let data3 = await db.mysql.read.query(sql, [result[0].id]);
            data3 = await getToatalLikesShare(data3, student_id, db);

            if (data3.length == 0 && page_no === '1') {
                data = [{
                    icon: `${config.staticCDN}images/empty_playlist.webp`,
                    title: 'NO VIDEOS',
                    description: result[0].empty_text,
                    Button: 'WATCH TRENDING VIDEOS',
                    id: result[0].empty_playlist_id,
                    playlist_name: 'TRENDING ON DOUBTNUT',
                }];
            } else {
                data = data3;
            }
            data = Utility.addThumbnail([data], config);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: data[0],
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

function getToatalLikesShare(elasticSearchResult, student_id, db) {
    return new Promise(async (resolve, reject) => {
        try {
            const color = ['#DBF2D9', '#D9EEF2', '#F2DDD9', '#F2EED9', '#D9DFF2', '#EBD9F2'];
            let durationPromise = [];
            for (let i = 0; i < elasticSearchResult.length; i++) {
                if (elasticSearchResult[i].ocr_text !== 'undefined' && elasticSearchResult[i].ocr_text !== null) {
                    const str = elasticSearchResult[i].ocr_text.replace(/'/g, "\\'");
                    elasticSearchResult[i].ocr_text = str;
                }
                elasticSearchResult[i].resource_type = 'video';
                durationPromise.push(AnswerContainer.getByQuestionId(elasticSearchResult[i].question_id, db));
                durationPromise.push(QuestionContainer.getTotalViewsWeb(elasticSearchResult[i].question_id, db));
            }
            const videoData = await Promise.all(durationPromise);
            for (let i = 0; i < elasticSearchResult.length; i++) {
                // console.log(videoData[i*2+1][0][0]['total_count'])
                durationPromise = [];
                durationPromise.push(AnswerContainer.getLikeDislikeStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(AnswerContainer.getWhatsappShareStats(videoData[i * 2 + 1][0][0].total_count, elasticSearchResult[i].question_id, db));
                durationPromise.push(UserAnswerFeedbackContainer.getAnswerFeedBackByStudent(student_id, videoData[i * 2][0].answer_id, db));
                const tempData = await Promise.all(durationPromise);
                if (videoData[i * 2][0].duration === 'NULL' || videoData[i * 2][0].duration === null) {
                    elasticSearchResult[i].duration = 0;
                } else {
                    elasticSearchResult[i].duration = videoData[i * 2][0].duration;
                }
                elasticSearchResult[i].bg_color = _.sample(color);
                elasticSearchResult[i].share = tempData[1][0];
                elasticSearchResult[i].like = tempData[0][0];
                elasticSearchResult[i].share_message = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                elasticSearchResult[i].isLiked = false;
                if (tempData[2].length > 0 && tempData[2][0].rating > 3) {
                    elasticSearchResult[i].isLiked = true;
                }
            }
            return resolve(elasticSearchResult);
        } catch (e) {
            reject(e);
        }
    });
}

/*

For all playlist find if any notification is to be shown
  get all children for a playlist, for each playlist
  check if a notification is present
    if present, check if seen by user
       If seen, skip else push announcement object to data

 */
async function checkIfAnnouncementPresent(data2, student_id) {
    for (let i = 0; i < data2.length; i++) {
    // let announcementData = await libraryMysql.isAnnouncementPresent(db.mysql.read, data2[i].id);
        const announcementData = await LibraryContainer.isAnnouncementPresent(db, data2[i].id);

        console.log('announcementData', announcementData);

        if (announcementData.length != 0 && !(await hasUserVisitedAnnouncement(student_id, announcementData[0].id, announcementData[0].valid_from, announcementData[0].valid_till))) {
            const announcement = new Object();
            announcement.type = announcementData[0].type;
            announcement.state = true;
            data2[i].announcement = announcement;
        }
    }

    return data2;
}
/*
method to check if the user has visited the announcement via announcementId in mongodb
 */
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

/*
method to mark an announcement as viewed based on hasUserVisitedAnnouncement condition
 */
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

/*
API to build direct parent child relationship in library_parent_child_mapping table after truncating
 */
async function buildParentChildMapping(req, res, next) {
    // rebuild all announcements

    const bulkQ = new Array();

    async function truncateTable(tableName) {
        const insertQ = `truncate table ${tableName}`;
        console.log(insertQ);
        db.mysql.write.query(insertQ);
    }

    async function rebuildLibraryMap(announcementInfo) {
        const mapping = new Array();

        let id = announcementInfo.row_id;
        mapping.push(id);

        while (true) {
            const sql = `select id,parent from new_library where id = ${id}`;
            console.log(sql);

            const libData = await db.mysql.read.query(sql);

            if (libData.length == 0 || libData[0].parent == null) {
                break;
            }

            console.log(libData);
            if (libData.length != 0) {
                mapping.push(libData[0].parent);
                id = libData[0].parent;
            }
        }

        bulkQ.push(mapping.reverse());
    }

    async function buildLibraryMapping(bulkQ) {
        console.log('bulkQ *********************************', bulkQ);

        for (let i = 0; i < bulkQ.length; i++) {
            for (let j = 0; j < bulkQ[i].length; j++) {
                for (let k = j; k < bulkQ[i].length; k++) {
                    const insertQ = `insert into library_parent_child_mapping set child_id = ${bulkQ[i][k]}, parent_id=${bulkQ[i][j]}`;
                    console.log(insertQ);
                    db.mysql.write.query(insertQ);
                }
            }
        }
    }

    try {
        db = req.app.get('db');
        const sql = 'select * from new_content_announcement order by id desc';
        console.log(sql);

        const announcementInfo = await db.mysql.read.query(sql);

        await truncateTable('library_parent_child_mapping');

        for (let i = 0; i < announcementInfo.length; i++) {
            switch (announcementInfo[i].from_table) {
                case 'new_library':
                    await rebuildLibraryMap(announcementInfo[i]);

                    break;

                default:
            }
        }

        await buildLibraryMapping(bulkQ);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            message: 'Done!!!',
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = {
    getAll, getPlaylist, getResource, getCustomPlaylist, buildParentChildMapping,
};
