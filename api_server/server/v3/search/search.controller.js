/* eslint-disable camelcase */
const _ = require('lodash');

const searchSql = require('../../../modules/mysql/search');
const courseMysql = require('../../../modules/mysql/course');
const utilityFlagr = require('../../../modules/Utility.flagr');
const bl = require('./search.bl');
const flagrUtility = require('../../../modules/Utility.flagr');
const searchhelper = require('../../helpers/search');
const GlobalSearchLog = require('../../../modules/mongo/globalSearchLogs');
const IasSuggestionLogs = require('../../../modules/mongo/iasSuggestionLogs');
const appConfiguration = require('../../../modules/mysql/appConfig');
const Notification = require('../../../modules/notifications');
const iasSuggestionImpressionLogs = require('../../../modules/mongo/iasSuggesterImpressionsLog');
const config = require('../../../config/config');
const kafkaDE = require('../../../config/kafka-de');
const AppConfigurationContainer = require('../../../modules/containers/AppConfiguration');
const { handleGuestLoginResponse } = require('../../../modules/utility');

async function search(req, res, next) {
    try {
        const db = req.app.get('db');
        const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');
        const translate2 = req.app.get('translate2');
        const { text } = req.query;
        // eslint-disable-next-line no-shadow
        const config = req.app.get('config');
        const studentId = req.user.student_id;
        let studentClass = req.query.class;
        const locale = req.user.locale ? req.user.locale : 'en';
        const xAuthToken = req.headers['x-auth-token'];
        if (!studentClass && studentClass == '13') {
            studentClass = req.user.student_class;
        }
        let versionCode = req.headers.version_code;
        if (!versionCode) {
            versionCode = 602;
        }
        const topicTabs = [{ key: 'all', description: 'All' }, { key: 'playlist', description: 'Playlist' }, { key: 'book', description: 'Books' }, { key: 'ncert', description: 'NCERT' }, { key: 'topic', description: 'Topic Videos' }, { key: 'pdf', description: 'PDFs' }, { key: 'video', description: 'Videos' }];

        let response = {
            tabs: topicTabs,
            list: [],
            isVipUser: false,
        };

        if (await flagrUtility.getBooleanFlag(xAuthToken, 'IAS_micro_service')) {
            const result = await searchhelper.getMicroIASResult(config, xAuthToken, studentClass, text);
            if (result && result.list.length) {
                response = result;
            }
        } else {
            const results = await bl.getInAppSearchResult(db, inAppSearchElasticInstance, translate2, config, text, studentId, studentClass, versionCode, locale, xAuthToken);
            const isVipUserData = await courseMysql.checkVip(db.mysql.read, studentId);
            let isVipUser = false;
            if (isVipUserData.length) {
                isVipUser = true;
            }
            response.list = results;
            response.isVipUser = isVipUser;
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: response,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getSuggestions(req, res) {
    try {
        let studentClass = req.user.student_class;
        const studentId = req.user.student_id;
        const db = req.app.get('db');
        const letters = /^[A-Za-z]+$/;
        const query = { student_id: studentId, is_clicked: true, size: { $gt: 0 } };
        if (studentClass === 14) {
            studentClass = _.shuffle([6, 7, 8, 9, 10, 11, 12]);
            studentClass = studentClass[0];
        }
        const promises = [];
        promises.push(searchSql.getTrendingPlaylist(db.mysql.read, studentClass, 5, 0));
        promises.push(GlobalSearchLog.find(query).sort({ _id: -1 }).limit(25));
        const result = await Promise.all(promises);
        const recentSearches = { header: 'Recent Searches', img_url: `${config.staticCDN}images/recent_searches_logo_1.png` };
        const trendingPlaylist = { header: 'Trending Searches', img_url: `${config.staticCDN}images/trending_searches_logo.png` };
        const playlist = [];
        const data = {};
        let k = 0;
        let j = 1;
        if (result[1] && result[1].length > 0) {
            let str = result[1][0].search_text;
            let obj = { display: result[1][0].search_text };
            playlist.push(obj);
            k++;
            for (let i = 0; i < result[1].length && k < 5; i++) {
                if (!str.includes(result[1][i].search_text)) {
                    obj = { display: result[1][i].search_text };
                    playlist.push(obj);
                    str = result[1][i].search_text;
                    k++;
                    j = 0;
                } else if (j === 6) {
                    obj = { display: result[1][i].search_text };
                    playlist.push(obj);
                    j = 0;
                    k++;
                }
                j++;
            }
        }

        if (result[0] && result[0].length > 0) {
            for (let i = 0; i < result[0].length; i++) {
                const str = result[0][i].display.split(' ');
                let str1 = '';
                if (str.length > 0) {
                    for (j = 0; j < str.length; j++) {
                        if (letters.test(str[j])) {
                            str1 = `${str1} ${_.startCase(str[j].toLowerCase())}`;
                        }
                    }
                }
                result[0][i].display = str1.slice(1);
            }
        }

        recentSearches.playlist = playlist;
        trendingPlaylist.playlist = result[0];
        data.recent_searches = recentSearches;
        data.trending_playlist = trendingPlaylist;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function insertLogs(req, res) {
    try {
        const studentId = req.user.student_id;
        let studentClass = req.user.student_class;
        if (+studentClass === 12 && req.user.isDropper) {
            studentClass = '13';
        }
        const language = req.user.locale || 'en';
        const version_code = req.headers.version_code || 602;
        const {
            search_id, search_text, searched_item, eventType, source, size, is_clicked, data, clicked_item, clicked_item_type, facet, section,
            clicked_position, clicked_item_id, class_filter, language_filter, subject_filter, chapter_filter, book_name_filter, author_filter,
            publication_filter, board_filter, exam_filter, teacher_filter, sort_by, variant_id, suggester_variant_id,
        } = req.body;
        const mongoObj = {
            student_id: studentId,
            student_class: studentClass,
            search_id,
            search_text,
            searched_item,
            language,
            eventType,
            source,
            size,
            is_clicked,
            data,
            clicked_item,
            clicked_item_type,
            facet,
            section,
            clicked_position,
            clicked_item_id,
            version_code,
            class_filter,
            language_filter,
            subject_filter,
            chapter_filter,
            book_name_filter,
            author_filter,
            publication_filter,
            board_filter,
            exam_filter,
            teacher_filter,
            sort_by,
            variant_id,
            suggester_variant_id,
        };
        if (mongoObj.eventType && mongoObj.eventType === 'suggestion_recommendation_clicked' && mongoObj.searched_item && mongoObj.searched_item.length < 100) {
            iasSuggestionImpressionLogs.update({ result_string: mongoObj.searched_item }, { $set: { updatedAt: new Date() }, $inc: { clicked_count: 1 } });
        }
        const globalSearchLog = new GlobalSearchLog(mongoObj);
        const result = await globalSearchLog.save();
        const kafkaDEObj = mongoObj;
        kafkaDEObj.event_type = eventType;
        delete kafkaDEObj.eventType;
        kafkaDEObj.created_at = new Date();
        kafkaDEObj.updated_at = new Date();
        kafkaDEObj._id = result._id;
        kafkaDE.publishIasLogs(kafkaDE.topics.globalSearchLogs, studentId, kafkaDEObj);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: result,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function addIasSuggestionLogs(req, res) {
    try {
        const studentId = req.user.student_id;
        const studentClass = req.user.student_class;
        const {
            searchText, size, data, id, position, ias_suggestion_iteration,
        } = req.body;
        const mongoObj = {
            studentId, studentClass, id, searchText, size, data, position, ias_suggestion_iteration,
        };
        const iasSuggestionLogs = new IasSuggestionLogs(mongoObj);
        const result = await iasSuggestionLogs.save();
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: result,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function insertPremiumContentBlockViewLog(req, res) {
    try {
        const db = req.app.get('db');
        const objData = req.body;
        const result = await searchSql.insertPremiumContentBlockViewLogs(db.mysql.write, objData);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data: result,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getAutoSuggest(req, res) {
    try {
        const db = req.app.get('db');
        const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');
        const translate2 = req.app.get('translate2');
        const { text } = req.query;
        // eslint-disable-next-line no-shadow
        const config = req.app.get('config');
        const studentId = req.user.student_id;
        const studentClass = req.user.student_class;

        let data = [];
        const flagr = { flagID: 9, flagKey: 'kkv9o7vyvp6h8g45r' };
        const flagrResult = await utilityFlagr.getVariantAttachment(null, {}, flagr.flagID);
        if (flagrResult.indexName === 'suggestions_index') {
            data = await bl.inAppSearchSuggestion(inAppSearchElasticInstance, text, studentClass);
        } else {
            const results = await bl.getInAppSearchResult(db, inAppSearchElasticInstance, translate2, config, text, studentId, studentClass);
            results.map((x) => {
                data.push({ display: x._source.display, class: x._source.class, id: x._id });
                return data.slice(0, 10);
            });
            data = data.slice(0, 10);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getAnimationString(req, res) {
    try {
        const db = req.app.get('db');
        const locale = req.user.locale || 'en';
        let data = await AppConfigurationContainer.getConfigByKey(db, 'ias_animations') || [];
        if (data.length && data[0].key_hindi_value && data[0].key_value) {
            data = (locale === 'hi') ? JSON.parse(data[0].key_hindi_value) : JSON.parse(data[0].key_value);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data,
        };
        if (_.get(req, 'user.is_guest_user') && _.get(req, 'user.is_action_disabled_by_route')) {
            return res.status(responseData.meta.code).json(handleGuestLoginResponse(responseData, req.user.locale));
        }
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getDialogueHints(req, res) {
    try {
        const db = req.app.get('db');
        let data = await AppConfigurationContainer.getConfigByKey(db, 'ias_hints');
        data = JSON.parse(data[0].key_value);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function getLastWatchedVideo(req, res) {
    try {
        const db = req.app.get('db');
        const studentId = req.user.student_id;
        const data = await Notification.getLastWatchedVideoForIas(db.mongo.read, studentId);
        if (data.length && data[0].page) {
            data[0].page = 'SEARCH_SRP';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    search, getSuggestions, insertLogs, getAutoSuggest, addIasSuggestionLogs, getAnimationString, getDialogueHints, getLastWatchedVideo, insertPremiumContentBlockViewLog,
};
