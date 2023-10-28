const _ = require('lodash');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
// const courseMysql = require('../../../modules/mysql/course');
const Data = require('../../../data/data');
const bl = require('./search.bl');
// const flagrUtility = require('../../../modules/Utility.flagr');
// const searchhelper = require('../../helpers/search');
// const config = require('../../../config/config');

bluebird.promisifyAll(mongoose);

async function getSuggestions(req, res) {
    try {
        const studentClass = req.user.student_class;
        const studentId = req.user.student_id;
        const { sessionId } = req.query;
        const db = req.app.get('db');
        const data = [];
        const [trendingPlaylist, recentSearches, recentWatched, mostWatched, books, topicPdf, topicExamPdf] = await Promise.all([
            bl.getTrendingPlaylist(db, studentClass),
            bl.getRecentSearches(studentId),
            bl.getRecentWatchedVideo(db, studentClass),
            bl.getMostWatchedVideo(db, studentClass),
            bl.getBooksInappPage(db, studentClass),
            bl.getTopicPdf(db, studentClass),
            bl.getTopicExamPdf(db, studentClass),
        ]);
        data.push(recentSearches);
        data.push(trendingPlaylist);
        data.push(recentWatched);
        data.push(mostWatched);
        data.push(books);
        data.push(topicPdf);
        data.push(topicExamPdf);

        let howItWorks;
        if (sessionId && sessionId > 0 && sessionId <= 3) {
            howItWorks = bl.howItWorksIas(req.user.locale, studentClass, sessionId);
            data.push({ howItWorks });
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

// function etoosFaceting(results, featureIds) {
//     let output = []; let tabs = [{ key: 'all', description: 'All' }];
//     const etoos_output = []; const etoos_tab = [];
//     let tabObj = {}; let outputObj = {};
//     for (let i = 0; i < Data.inAppTopicsTabs.length; i++) {
//         const tab = Data.inAppTopicsTabs[i];
//         if (results[tab.key] && results[tab.key].length) {
//             let seeAll = true;
//             if (results[tab.key].length < tab.size) {
//                 seeAll = false;
//             }
//             outputObj = {
//                 title: tab.description, tab_type: tab.key, size: tab.size, seeAll, list: results[tab.key],
//             };
//             tabObj = { key: tab.key, description: tab.description };

//             if (featureIds.etoos_enabled && featureIds.etoos_position < 0) {
//                 output.push(outputObj);
//                 tabs.push(tabObj);
//             } else if (tab.key === 'etoos_faculty_chapter' || tab.key === 'etoos_course') {
//                 etoos_output.push(outputObj);
//                 etoos_tab.push(tabObj);
//             } else {
//                 output.push(outputObj);
//                 tabs.push(tabObj);
//             }
//         }
//     }
//     if (featureIds.etoos_enabled && featureIds.etoos_position > 0) {
//         output = [...output, ...etoos_output];
//         tabs = [...tabs, ...etoos_tab];
//     }
//     return { tabs, output };
// }

// function getFinalResult(results, featureIds) {
//     if (featureIds && !_.isEmpty(featureIds) && featureIds.IAS_facetor) { // using facetor from flags IAS_facetor
//         results = results.reduce((r, a) => {
//             r[a._source.tab_type] = [...r[a._source.tab_type] || [], a];
//             return r;
//         }, {});
//         if (results.pdf && results.pdf.length) {
//             results.pdf.map((x) => {
//                 x._source.image_url = `${config.staticCDN}images/inapp_pdf.png`;
//                 return x;
//             });
//         }
//         if (results.book && results.book.length) {
//             results.book.map((x) => {
//                 x._source.image_url = `${config.staticCDN}images/inapp_book.png`;
//                 return x;
//             });
//         }
//         const { tabs, output } = etoosFaceting(results, featureIds);
//         return { tabs, results: output };
//     }
//     return { tabs: Data.inAppTopicsTabs, results };
// }

async function search(req, res, next) {
    try {
        // const db = req.app.get('db');
        // const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');
        // const translate2 = req.app.get('translate2');
        // const { text } = req.body;
        // const { featureIds } = req.body;
        // eslint-disable-next-line no-shadow
        // const config = req.app.get('config');
        // const studentId = req.user.student_id;
        let studentClass = req.body.class;
        // const locale = req.user.locale ? req.user.locale : 'en';
        // const xAuthToken = req.headers['x-auth-token'];
        if (!studentClass && studentClass == '13') {
            studentClass = req.user.student_class;
        }
        let versionCode = req.headers.version_code;
        if (!versionCode) {
            versionCode = 602;
        }

        const response = {
            tabs: Data.inAppTopicsTabs,
            list: [],
            isVipUser: false,
        };

        // if (await flagrUtility.getBooleanFlag(xAuthToken, 'IAS_micro_service')) {
        //     const result = await searchhelper.getMicroIASResult(config, xAuthToken, studentClass, text, featureIds);
        //     if (result && result.list.length) {
        //         response = result;
        //     }
        // } else {
        //     const geneRatedData = await bl.getInAppSearchResult(db, inAppSearchElasticInstance, translate2, config, text, studentId, studentClass, versionCode, locale, xAuthToken);
        //     const { tabs, results } = getFinalResult(geneRatedData, featureIds);
        //     const isVipUserData = await courseMysql.checkVip(db.mysql.read, studentId);
        //     let isVipUser = false;
        //     if (isVipUserData.length) {
        //         isVipUser = true;
        //     }
        //     response = {
        //         tabs,
        //         list: results,
        //         isVipUser,
        //     };
        // }

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

async function getAutoSuggest(req, res) {
    try {
        // const config = req.app.get('config');
        // const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');
        // const { text } = req.body;
        let { featureIds } = req.body;
        if (featureIds && typeof featureIds === 'string') {
            featureIds = JSON.parse(featureIds);
        }
        let ias_suggestion_itearartion = 'v1';
        if (featureIds && !_.isEmpty(featureIds) && featureIds.ias_suggester && featureIds.ias_suggester.enabled && featureIds.ias_suggester.version) {
            ias_suggestion_itearartion = featureIds.ias_suggester.version;
        }
        const data = []; // await bl.inAppSearchSuggestion(inAppSearchElasticInstance, text, config, featureIds);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Search',
            },
            data,
            ias_suggestion_itearartion,
        };
        return res.status(200).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = { getSuggestions, search, getAutoSuggest };
