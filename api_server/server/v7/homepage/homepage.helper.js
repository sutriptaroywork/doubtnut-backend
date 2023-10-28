/* eslint-disable camelcase */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
// const Question = require('../../../modules/question');
const DppContainer = require('../../../modules/containers/dailyPractiseProblems');
const QuestionContainer = require('../../../modules/containers/question');
const ChapterContainer = require('../../../modules/containers/chapter');
const PlaylistContainer = require('../../../modules/containers/playlist');
const HomepageContainer = require('../../../modules/containers/homepage');
const AppBannerContainer = require('../../../modules/containers/appBanner');
// const AppConstants = require('../../../modules/appConstants')
// const Student = require('../../../modules/student')
const TestSeriesContainer = require('../../../modules/containers/testseries');
// const QuizContainer = require('../../../modules/containers/quiz')
const DailyContestContainer = require('../../../modules/containers/dailyContest');
const PdfContainer = require('../../../modules/containers/pdf');
const FeedContainer = require('../../../modules/containers/feed');
// const redisQuestionContainer = require('../../../modules/redis/question');
// const TestSeries = require('../../../modules/mysql/testseries');
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions');
// const AnswerRedis = require('../../../modules/redis/answer');
const appConfigConatiner = require('../../../modules/containers/appConfig');
const contentUnlockContainer = require('../../../modules/containers/contentunlock');
const libraryContainer = require('../../../modules/containers/library');
const utility = require('../../../modules/utility');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
// const studentPersonalisation = require('../../../modules/redis/studentPersonalisation');
const Data = require('../../../data/data');
// const StudentProperties = require('../../../modules/studentProperties');
// const StudentPropertiesContainer = require('../../../modules/containers/studentProperties');
const PersonalisedSubjectsMapping = require('../../../modules/personalisedSubjectsMapping');
const ClassCourseMapping = require('../../../modules/containers/ClassCourseMapping');
const HomepageQuestionsMaster = require('../../../modules/homepageQuestionsMaster.js');
const GamesMysql = require('../../../modules/mysql/games');
const config = require('../../../config/config');

function testSeriesArrayResponseFormatter1(testdata, subscriptiondata) {
    const groupedSubData = _.groupBy(subscriptiondata, 'test_id');
    // console.log(groupedSubData)
    for (let i = testdata.length - 1; i >= 0; i--) {
        const test = testdata[i];
        testdata[i].can_attempt = false;
        testdata[i].can_attempt_prompt_message = '';
        testdata[i].test_subscription_id = '';
        testdata[i].in_progress = false;
        testdata[i].attempt_count = 0;
        testdata[i].last_grade = '';
        testdata[i].type = 'quiz';
        testdata[i].image_url = `${config.staticCDN}images/quiz_sample.jpeg`;
        testdata[i].button_text = 'Go To';
        testdata[i].button_text_color = '#000000';
        testdata[i].button_bg_color = '#ffffff';
        testdata[i].id = testdata[i].test_id.toString();
        if (groupedSubData[test.test_id]) {
            const subData = _.groupBy(groupedSubData[test.test_id], 'status');
            testdata[i].subscriptiondata = groupedSubData[test.test_id];
            if (subData.SUBSCRIBED) {
                testdata[i].can_attempt = true;
                testdata[i].test_subscription_id = subData.SUBSCRIBED[0].id;
            }
            if (subData.INPROGRESS) {
                testdata[i].in_progress = true;
                testdata[i].test_subscription_id = subData.INPROGRESS[0].id;
            }
            if (subData.COMPLETED) {
                testdata[i].attempt_count = subData.COMPLETED.length;
                testdata[i].test_subscription_id = subData.COMPLETED[0].id;
            }
        } else {
            testdata[i].can_attempt = true;
            testdata[i].subscriptiondata = [];
        }
    }
    return testdata;
}


async function getDailyQuizData(type, studentId, studentClass, limit, db) {
    // return new Promise((async (resolve, reject) => {
    try {
        const promise = [];
        promise.push(TestSeriesContainer.getDailyQuizData(type, studentClass, limit, db));
        promise.push(StudentTestsSubsriptions.get1StudentTestsSubsriptionsByStudentId(db.mysql.read, studentId));
        const data = await Promise.all(promise);
        const temp = testSeriesArrayResponseFormatter1(data[0], data[1]);
        return temp;
    } catch (e) {
        console.log(e);
        return e;
        // reject(e);
    }
}

function generatePromises(caraouselOrder, data, db, elasticSearchInstance) {
    const promise = [];
    for (let i = 0; i < caraouselOrder.length; i++) {
        if (caraouselOrder[i].type === 'DPP') {
            const gradient = _.sample(data.color);
            promise.push(DppContainer.getDPPVideoTypeWithTextSolutions(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule[2], data.capsule[1], data.student_id, data.student_class, caraouselOrder[i].data_limit, data.duration[0], data.duration[1], db));
        } else if (caraouselOrder[i].data_type === 'topic') {
            const gradient = _.sample(data.color);
            promise.push(libraryContainer.getLocalisedPlaylistHomepage(data.student_locale, caraouselOrder[i].mapped_playlist_id, caraouselOrder[i].type, gradient, caraouselOrder[i].data_type, data.page_param, data.capsule[2], data.capsule[1], caraouselOrder[i].data_limit, data.student_class, data.duration[0], data.duration[1], db));
        } else if (caraouselOrder[i].data_type === 'topic_parent') {
            if (caraouselOrder[i].type === 'PERSONALIZATION_CHAPTER') {
                promise.push(ChapterContainer.getPersonalizedChapters(data.student_id, data.ccmList, data.student_class, data.student_locale));
            } else {
                const gradient = _.sample(data.color);
                promise.push(libraryContainer.getParentPlaylistHomepage(data.student_locale, caraouselOrder[i].mapped_playlist_id, caraouselOrder[i].type, gradient, caraouselOrder[i].data_type, data.page_param, data.capsule[2], data.capsule[1], caraouselOrder[i].data_limit, data.student_class, data.duration[0], data.duration[1], db));
            }
        } else if (caraouselOrder[i].type === 'WHATSAPP_ASK') {
            promise.push(appConfigConatiner.getWhatsappData(db, data.student_class));
        } else if (caraouselOrder[i].type === 'CRASH_COURSE') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getCrashCourseDataWithTextSolutions(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, caraouselOrder[i].data_limit, data.student_class, data.duration, db));
        } else if (caraouselOrder[i].type === 'LATEST_FROM_DOUBTNUT') {
            console.log('LATEST_FROM_DOUBTNUT');
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getLatestFromDoubtnutDataWithTextSolutions(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].data_type === 'library_video') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getLibraryVideos(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, data.student_id, caraouselOrder[i].mapped_playlist_id, data.language, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'TRICKY_QUESTION') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getTrickyQuestionsSolutions(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, data.week_no, data.subjectUrl, db));
        } else if (caraouselOrder[i].type === 'CONCEPT_BOOSTER') {
            const studentCourse = 'NCERT';
            const gradient = _.sample(data.color);
            promise.push(ChapterContainer.getConceptBoosterData(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, 'HOME_PAGE_CC', data.capsule, data.student_class, studentCourse, data.language, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'TRENDING') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getTrendingVideoDataWithTextSolutions(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'VIRAL') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getTipsAndTricksDataWithTextSolutions(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'NCERT_SOLUTIONS' && caraouselOrder[i].data_type === 'ncert') {
            const gradient = _.sample(data.color);
            promise.push(PlaylistContainer.getNCERTDataNewLibraryWithPCM(caraouselOrder[i].type, gradient, caraouselOrder[i].data_type, data.description, '', data.capsule, data.student_class, caraouselOrder[i].data_limit, data.language, caraouselOrder[i].mapped_playlist_id, db));
        } else if (caraouselOrder[i].type === 'GK') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getGeneralKnowledgeData(data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'DAILY_QUIZ') {
            promise.push(getDailyQuizData(caraouselOrder[i].type, data.student_id, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'DAILY_CONTEST') {
            promise.push(DailyContestContainer.getDailyContestData(caraouselOrder[i].type, caraouselOrder[i].data_type, data.button, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === 'APP_BANNER') {
            if (caraouselOrder[i].scroll_size === '1x') {
                promise.push(AppBannerContainer.getAppBanner1xDataTypeWithFlag(db, caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, data.version_code, data.flagVariants));
            } else if (caraouselOrder[i].scroll_size === '1.5x') {
                promise.push(AppBannerContainer.getAppBanner15xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, db));
            } else if (caraouselOrder[i].scroll_size === '2.5x') {
                promise.push(AppBannerContainer.getAppBanner25xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, db));
            }
        } else if (caraouselOrder[i].type === 'QUIZ_WINNER') {
            const page = 1;
            promise.push(FeedContainer.getQuizWinner(caraouselOrder[i].type, caraouselOrder[i].data_type, page, data.button, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === 'CONTEST_WINNER') {
            // promise.push(FeedContainer.getContestWinner(caraouselOrder[i].data_type,page,button_text,button_text_color, button_bg_color,caraouselOrder[i].data_limit,db))
            promise.push([]);
        } else if (caraouselOrder[i].type === 'SUPER_SERIES') {
            promise.push(PdfContainer.getSuperSeriesData(caraouselOrder[i].type, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'JEE MAINS 2019 - APRIL') {
            promise.push(PdfContainer.getJeeMains2019AprilData(caraouselOrder[i].type, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'NEET 2019 SOLUTIONS') {
            promise.push(PdfContainer.getNeet2019AprilData(caraouselOrder[i].type, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'MOCK TEST') {
            promise.push(PdfContainer.getMockTestData(caraouselOrder[i].type, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'JEE_MAINS_PY') {
            promise.push(PdfContainer.getJeeMainsPrevYearData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'JEE_ADV_PY') {
            promise.push(PdfContainer.getJeeAdvPrevYearData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'FORMULA_SHEET') {
            promise.push(PdfContainer.getFormulaSheetData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'CUTOFF_LIST') {
            promise.push(PdfContainer.getCutOffListData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === '12_BOARDS_PY') {
            const student_class = data.student_class === 11 ? 12 : data.student_class;
            promise.push(PdfContainer.get12PrevYearData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'SAMPLE_PAPERS') {
            if (data.student_class === '12' || data.student_class === '11') {
                promise.push(PdfContainer.get12SamplePaperData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
            } else {
                promise.push(PdfContainer.get10SamplePaperData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
            }
        } else if (caraouselOrder[i].type === 'MOST_IMPORTANT_QUESTIONS') {
            if (data.student_class === '12' || data.student_class === '11') {
                promise.push(PdfContainer.get12MostImportantQuestionData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
            } else {
                promise.push(PdfContainer.get10MostImportantQuestionData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
            }
        } else if (caraouselOrder[i].type === 'IBPS_CLERK_SPECIAL') {
            promise.push(PdfContainer.getIBPSClerkSpecialData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === 'NCERT_SOLUTIONS' && caraouselOrder[i].data_type === 'pdf') {
            promise.push(PdfContainer.getNcertSolutionsPdfData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === 'CONCEPT_BOOSTER') {
            promise.push(PdfContainer.getConceptBoosterPdfData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === '9_FOUNDATION_COURSE') {
            promise.push(PdfContainer.getClass9FoundationCourseData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === '10_BOARDS_PY') {
            promise.push(PdfContainer.get10BoardPrevYearData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === 'SFY') {
            if (data.ocr === null) {
                data.ocr = '';
            }
            promise.push(elasticSearchInstance.findByOcrUsingIndexNew(data.ocr, 'doubtnut_new_physics_chemistry_maths_v4'));
        } else if (caraouselOrder[i].type === 'GAMES') {
            promise.push(GamesMysql.getList(db.mysql.read));
        }
    }
    return promise;
}


async function getHomepage(data, config, db, elasticSearchInstance) {
    let promiseResolve;
    const masterPromise = new Promise(((resolve, reject) => {
        promiseResolve = resolve;
        // eslint-disable-next-line no-undef
        promiseReject = reject;
    }));

    try {
        // get caraousel data and its localisation
        const caraouselOrder = await HomepageContainer.getCaraousel(db, data.student_class, data.caraousel_limit, data.page, data.version_code, data.flagVariants);
        if (data.student_locale !== 'en') {
            const localisation_promises = [];
            for (let m = 0; m < caraouselOrder.length; m++) {
                if ('id' in caraouselOrder[m]) {
                    localisation_promises.push(HomepageContainer.getHomeCaraouselStringsLocalised(db, config, data.version_code, caraouselOrder[m].id, data.student_locale));
                }
            }
            const resolvedLocalisationPromises = await Promise.all(localisation_promises);
            for (let n = 0, l = 0; n < resolvedLocalisationPromises.length; n++) {
                if ('id' in caraouselOrder[n]) {
                    if (!_.isEmpty(resolvedLocalisationPromises[l])) {
                        caraouselOrder[n].title = (resolvedLocalisationPromises[l].translation !== '') ? resolvedLocalisationPromises[l].translation : caraouselOrder[n].title;
                    }
                    l++;
                }
            }
        }
        // caraousel localistaion ends here
        const promise = generatePromises(caraouselOrder, data, db, elasticSearchInstance);
        const output = await Promise.all(promise);
        const result = [];
        for (let i = 0; i < output.length; i++) {
            if ((output[i].length && output[i].length > 0) || (output[i].list && output[i].list.length > 0)) {
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type !== 'SUPER_SERIES' && caraouselOrder[i].type !== 'JEE MAINS 2019 - APRIL') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = {};
                    const temp = {};
                    if ((data.student_class === '6' || data.student_class === '7' || data.student_class === '8' || data.student_class === '9') && (caraouselOrder[i].type === 'NCERT_SOLUTIONS' || caraouselOrder[i].type === 'CUTOFF_LIST')) {
                        temp.action_activity = 'downloadpdf_level_two';
                        temp.action_data = { pdf_package: output[i][0].package, level_one: output[i][0].level1 };
                    } else {
                        temp.action_activity = 'downloadpdf_level_one';
                        temp.action_data = { pdf_package: output[i][0].package };
                    }
                    if (output[i][0].package !== null && output[i][0].level1 !== null) {
                        caraouselOrder[i].view_more_params = temp;
                    }
                    if (data.student_class === '14' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'NCERT_SOLUTIONS') {
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].title };
                        }
                    } else {
                        for (let j = 0; j < output[i].length; j++) {
                            const url = `${config.staticCDN}pdf_download/${output[i][j].location}`;
                            output[i][j].action_data = { pdf_url: url };
                        }
                    }
                }

                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'SUPER_SERIES') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf', action_data: null };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_one';
                        output[i][j].action_data = { pdf_package: output[i][j].package };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'JEE MAINS 2019 - APRIL') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf_level_one', action_data: { pdf_package: output[i][0].package } };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_two';
                        output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].level1 };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'NEET 2019 SOLUTIONS') {
                    // caraouselOrder[i].view_all = 1
                    // caraouselOrder[i].view_more_params = {"action_activity": "downloadpdf_level_one", "action_data": {"pdf_package":output[i][0].package}}

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'pdf_viewer';
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'MOCK TEST') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf_level_one', action_data: { pdf_package: output[i][0].package } };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_two';
                        output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].level1 };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'ncert') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { class: data.student_class, playlist_id: caraouselOrder[i].mapped_playlist_id, playlist_title: caraouselOrder[i].title }; // chapter will go
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'topic') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'topic_parent') {
                    if (caraouselOrder[i].type === 'PERSONALIZATION_CHAPTER') {
                        caraouselOrder[i].view_all = 0;
                        caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                        if (typeof output[i].list === 'undefined' || output[i].list.length == 0) {
                            output.splice(i, 1);
                            caraouselOrder.splice(i, 1);
                        }
                    } else {
                        caraouselOrder[i].view_all = 1;
                        caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                    }
                    // caraouselOrder[i].view_all = 1;
                    // caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'photo') {
                    caraouselOrder[i].view_all = 0;
                    const date = moment().subtract(1, 'days').format('MMMM DD').toString();
                    caraouselOrder[i].title = `${caraouselOrder[i].title} ${date}`;
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'contest') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = {};
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'quiz') {
                    caraouselOrder[i].view_all = 0;
                    caraouselOrder[i].view_more_params = {};
                    const arrUrl = utility.shuffle([`${config.staticCDN}images/daily_quiz1.png`]);
                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].image_url = arrUrl[j];
                    }
                }

                if (typeof caraouselOrder[i].data_type !== 'undefined' && (caraouselOrder[i].data_type === 'video' || caraouselOrder[i].data_type === 'library_video')) {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id };
                    if (caraouselOrder[i].data_type === 'library_video') {
                        const gradient = _.sample(data.color);
                        console.log(data);
                        caraouselOrder[i].data_type = 'video';
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].id = output[i][j].question_id;
                            output[i][j].page = 'HOME_FEED';
                            output[i][j].start_gradient = gradient[0];
                            output[i][j].mid_gradient = gradient[1];
                            output[i][j].end_gradient = gradient[2];
                            output[i][j].type = caraouselOrder[i].data_type;
                            output[i][j].description = '';
                            output[i][j].title = output[i][j].ocr_text;
                            output[i][j].capsule_text = data.capsule[0];
                            output[i][j].capsule_bg_color = data.capsule[1];
                            output[i][j].capsule_text_color = data.capsule[2];
                            output[i][j].duration_text_color = data.duration[0];
                            output[i][j].duration_bg_color = data.duration[1];
                            output[i][j].playlist_id = caraouselOrder[i].type;
                            output[i][j].views = null;
                        }
                    } else {
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].playlist_id = caraouselOrder[i].type;
                            output[i][j].views = null;
                        }
                    }

                    if (caraouselOrder[i].type === 'TRICKY_QUESTION') {
                        output[i] = await QuestionContainer.getTotalViewsMulti(db, output[i]);
                        caraouselOrder[i].view_all = 0;
                    }
                }

                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'banner') {
                    caraouselOrder[i].view_all = 0;
                    for (let j = 0; j < output[i].length; j++) {
                        if (output[i][j].action_data !== null) {
                            // //console.log(output[i][j].action_data)
                            if (typeof output[i][j].action_data !== 'undefined') {
                                output[i][j].action_data = JSON.parse(output[i][j].action_data);
                            }
                        }
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'card' && caraouselOrder[i].type === 'WHATSAPP_ASK') {
                    caraouselOrder[i].view_all = 0;
                    const mystring = JSON.parse(output[i][0].key_value);
                    console.log(mystring);
                    output[i][0].key_value = JSON.parse(output[i][0].key_value);
                    output[i][0].image_url = mystring.image_url;
                    output[i][0].description = mystring.description;
                    output[i][0].button_text = mystring.button_text;
                    output[i][0].button_bg_color = mystring.button_bg_color;
                    output[i][0].action_activity = mystring.action_activity;
                    output[i][0].action_data = mystring.action_data;
                    output[i][0].type = 'card';
                    delete output[i][0].key_value;
                }
                if (caraouselOrder[i].type === 'PERSONALIZATION_CHAPTER' && typeof output[i].list !== 'undefined' && output[i].list.length > 0) {
                    caraouselOrder[i].list = output[i].list;
                    caraouselOrder[i].title = output[i].title;
                } else {
                    caraouselOrder[i].list = output[i];
                }
                // caraouselOrder[i].list = output[i].list;
                result.push(caraouselOrder[i]);
            } else if (i === 0) {
                // eslint-disable-next-line no-constant-condition
                if (0) {
                    caraouselOrder[i].view_all = 0;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].type };
                    if (output[i].hits.hits.length > 0) {
                        const output1 = await QuestionContainer.getQuestionsData(db, output[i].hits.hits.slice(0, 6));
                        const list = [];
                        for (let k = 0; k < output1.length; k++) {
                            if (output1[k]._id !== data.question_id) {
                                const c = utility.shuffle(data.color);
                                // eslint-disable-next-line no-unused-vars
                                const unlockStatus = await contentUnlockContainer.getUnlockStatus(db, data.student_id, 'PC');
                                const isLocked = 0;
                                const iUrl = `${config.staticCDN}q-thumbnail/${output1[k]._id}.png`;
                                const o = {
                                    id: output1[k]._id,
                                    type: 'video',
                                    image_url: iUrl,
                                    subject: output1[k]._source.subject,
                                    isLocked,
                                    title: output1[k]._source.ocr_text,
                                    resource_type: output1[k]._source.resource_type,
                                    description: '',
                                    page: 'HOME_FEED',
                                    playlist_id: 'SFY',
                                    capsule_bg_color: '#ffffff',
                                    capsule_text_color: '#000000',
                                    start_gradient: c[0][0],
                                    mid_gradient: c[0][1],
                                    end_gradient: c[0][2],
                                    capsule_text: null,
                                    duration: null,
                                    duration_text_color: '#000000',
                                    duration_bg_color: '#ffffff',
                                    views: null,
                                };
                                list.push(o);
                            }
                        }
                        caraouselOrder[i].list = list;
                        console.log('pushing this content --- last time');
                        result.push(caraouselOrder[i]);
                    }
                }
            }
        }
        promiseResolve(result);
        return masterPromise;
    } catch (e) {
        console.log(e);
        promiseResolve([]);
        return masterPromise;
    }
}


async function getPersonalisedHomepage(data, config, db, elasticSearchInstance) {
    let promiseResolve;
    const masterPromise = new Promise(((resolve, reject) => {
        promiseResolve = resolve;
        // eslint-disable-next-line no-undef
        promiseReject = reject;
    }));


    try {
        // get caraosel data and its localisation
        const caraouselOrder = await HomepageContainer.getPersonalisedCaraousel(db, data.student_id, data.student_class, data.student_locale, data.cem_string, data.caraousel_limit, data.page, data.version_code, data.flagVariants);
        if (data.student_locale !== 'en') {
            const localisation_promises = [];
            for (let m = 0; m < caraouselOrder.length; m++) {
                if ('id' in caraouselOrder[m]) {
                    localisation_promises.push(HomepageContainer.getHomeCaraouselStringsLocalised(db, config, data.version_code, caraouselOrder[m].id, data.student_locale));
                }
            }
            const resolvedLocalisationPromises = await Promise.all(localisation_promises);

            for (let n = 0, l = 0; n < caraouselOrder.length; n++) {
                if ('id' in caraouselOrder[n]) {
                    if (!_.isEmpty(resolvedLocalisationPromises[l])) {
                        caraouselOrder[n].title = (resolvedLocalisationPromises[l].translation !== '') ? resolvedLocalisationPromises[l].translation : caraouselOrder[n].title;
                    }
                    l++;
                }
            }
        }
        // localistion of caraousel end here


        const promise = generatePromises(caraouselOrder, data, db, elasticSearchInstance);
        const output = await Promise.all(promise);
        const result = [];
        for (let i = 0; i < output.length; i++) {
            if ((output[i].length && output[i].length > 0) || (output[i].list && output[i].list.length > 0)) {
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type !== 'SUPER_SERIES' && caraouselOrder[i].type !== 'JEE MAINS 2019 - APRIL') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = {};
                    const temp = {};
                    if ((data.student_class === '6' || data.student_class === '7' || data.student_class === '8' || data.student_class === '9') && (caraouselOrder[i].type === 'NCERT_SOLUTIONS' || caraouselOrder[i].type === 'CUTOFF_LIST')) {
                        temp.action_activity = 'downloadpdf_level_two';
                        temp.action_data = { pdf_package: output[i][0].package, level_one: output[i][0].level1 };
                    } else {
                        temp.action_activity = 'downloadpdf_level_one';
                        temp.action_data = { pdf_package: output[i][0].package };
                    }
                    if (output[i][0].package !== null && output[i][0].level1 !== null) {
                        caraouselOrder[i].view_more_params = temp;
                    }
                    if (data.student_class === '14' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'NCERT_SOLUTIONS') {
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].title };
                        }
                    } else {
                        for (let j = 0; j < output[i].length; j++) {
                            const url = `${config.staticCDN}pdf_download/${output[i][j].location}`;
                            output[i][j].action_data = { pdf_url: url };
                        }
                    }
                }

                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'SUPER_SERIES') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf', action_data: null };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_one';
                        output[i][j].action_data = { pdf_package: output[i][j].package };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'JEE MAINS 2019 - APRIL') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf_level_one', action_data: { pdf_package: output[i][0].package } };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_two';
                        output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].level1 };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'NEET 2019 SOLUTIONS') {
                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'pdf_viewer';
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'MOCK TEST') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf_level_one', action_data: { pdf_package: output[i][0].package } };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_two';
                        output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].level1 };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'ncert') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { class: data.student_class, playlist_id: caraouselOrder[i].mapped_playlist_id, playlist_title: caraouselOrder[i].title }; // chapter will go
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'topic') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'topic_parent') {
                    if (caraouselOrder[i].type === 'PERSONALIZATION_CHAPTER') {
                        caraouselOrder[i].view_all = 0;
                        caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                        if (typeof output[i].list === 'undefined' || output[i].list.length == 0) {
                            output.splice(i, 1);
                            caraouselOrder.splice(i, 1);
                        }
                    } else {
                        caraouselOrder[i].view_all = 1;
                        caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id, is_last: 0, playlist_title: caraouselOrder[i].title };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'photo') {
                    caraouselOrder[i].view_all = 0;
                    const date = moment().subtract(1, 'days').format('MMMM DD').toString();
                    caraouselOrder[i].title = `${caraouselOrder[i].title} ${date}`;
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'contest') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = {};
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'quiz') {
                    caraouselOrder[i].view_all = 0;
                    caraouselOrder[i].view_more_params = {};
                    const arrUrl = utility.shuffle([`${config.staticCDN}images/daily_quiz1.png`]);
                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].image_url = arrUrl[j];
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'GAMES') {
                    for (let j = 0; j < output[i].length; j++) {
                        const obj = {};
                        obj.id = output[i][j].id;
                        obj.title = output[i][j].title;
                        obj.image_url = output[i][j].image_url;
                        obj.type = 'topic';
                        obj.subject = '';
                        obj.description = '';
                        obj.page = '';
                        obj.capsule_bg_color = '#ffffff';
                        obj.capsule_text_color = '#000000';
                        obj.start_gradient = '#F2DDD9';
                        obj.mid_gradient = '#F2DDD9';
                        obj.end_gradient = '#F2DDD9';
                        obj.duration_text_color = '#000000';
                        obj.duration_bg_color = '#ffffff';
                        obj.is_last = 1;
                        obj.resource_type = 'games';
                        obj.playlist_order = 23;
                        obj.master_parent = '';
                        obj.resource_path = (_.isNull(output[i][j].download_url) || output[i][j].download_url.length === 0) ? output[i][j].fallback_url : output[i][j].download_url;
                        output[i][j] = obj;
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && (caraouselOrder[i].data_type === 'video' || caraouselOrder[i].data_type === 'library_video')) {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].mapped_playlist_id };
                    if (caraouselOrder[i].data_type === 'library_video') {
                        const gradient = _.sample(data.color);
                        console.log(data);
                        caraouselOrder[i].data_type = 'video';
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].id = output[i][j].question_id;
                            output[i][j].page = 'HOME_FEED';
                            output[i][j].start_gradient = gradient[0];
                            output[i][j].mid_gradient = gradient[1];
                            output[i][j].end_gradient = gradient[2];
                            output[i][j].type = caraouselOrder[i].data_type;
                            output[i][j].description = '';
                            output[i][j].title = output[i][j].ocr_text;
                            output[i][j].capsule_text = data.capsule[0];
                            output[i][j].capsule_bg_color = data.capsule[1];
                            output[i][j].capsule_text_color = data.capsule[2];
                            output[i][j].duration_text_color = data.duration[0];
                            output[i][j].duration_bg_color = data.duration[1];
                            output[i][j].playlist_id = caraouselOrder[i].type;
                            output[i][j].views = null;
                        }
                    } else {
                        for (let j = 0; j < output[i].length; j++) {
                            output[i][j].playlist_id = caraouselOrder[i].type;
                            output[i][j].views = null;
                        }
                    }

                    if (caraouselOrder[i].type === 'TRICKY_QUESTION') {
                        // eslint-disable-next-line no-await-in-loop
                        output[i] = await QuestionContainer.getTotalViewsMulti(db, output[i]);
                        caraouselOrder[i].view_all = 0;
                    }
                }

                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'banner') {
                    caraouselOrder[i].view_all = 0;
                    for (let j = 0; j < output[i].length; j++) {
                        if (output[i][j].action_data !== null) {
                            if (typeof output[i][j].action_data !== 'undefined') {
                                output[i][j].action_data = JSON.parse(output[i][j].action_data);
                            }
                        }
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'card' && caraouselOrder[i].type === 'WHATSAPP_ASK') {
                    caraouselOrder[i].view_all = 0;
                    const mystring = JSON.parse(output[i][0].key_value);
                    console.log(mystring);
                    output[i][0].key_value = JSON.parse(output[i][0].key_value);
                    output[i][0].image_url = mystring.image_url;
                    output[i][0].description = mystring.description;
                    output[i][0].button_text = mystring.button_text;
                    output[i][0].button_bg_color = mystring.button_bg_color;
                    output[i][0].action_activity = mystring.action_activity;
                    output[i][0].action_data = mystring.action_data;
                    output[i][0].type = 'card';
                    delete output[i][0].key_value;
                }
                // caraouselOrder[i].list = output[i];
                if (caraouselOrder[i].type === 'PERSONALIZATION_CHAPTER' && typeof output[i].list !== 'undefined' && output[i].list.length > 0) {
                    caraouselOrder[i].list = output[i].list;
                    caraouselOrder[i].title = output[i].title;
                } else {
                    caraouselOrder[i].list = output[i];
                }
                result.push(caraouselOrder[i]);
            } else if (i === 0) {
                if (caraouselOrder[i].type === 'SFY') {
                    caraouselOrder[i].view_all = 0;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].type };
                    if (output[i].hits.hits.length > 0) {
                        // eslint-disable-next-line no-await-in-loop
                        const output1 = await QuestionContainer.getQuestionsData(db, output[i].hits.hits.slice(0, 6));
                        const list = [];
                        for (let k = 0; k < output1.length; k++) {
                            if (output1[k]._id !== data.question_id) {
                                const c = utility.shuffle(data.color);
                                // const unlockStatus = await contentUnlockContainer.getUnlockStatus(db, data.student_id, 'PC');
                                const isLocked = 0;
                                const iUrl = `${config.staticCDN}q-thumbnail/${output1[k]._id}.png`;
                                const o = {
                                    id: output1[k]._id,
                                    type: 'video',
                                    image_url: iUrl,
                                    subject: output1[k]._source.subject,
                                    isLocked,
                                    title: output1[k]._source.ocr_text,
                                    resource_type: output1[k]._source.resource_type,
                                    description: '',
                                    page: 'HOME_FEED',
                                    playlist_id: 'SFY',
                                    capsule_bg_color: '#ffffff',
                                    capsule_text_color: '#000000',
                                    start_gradient: c[0][0],
                                    mid_gradient: c[0][1],
                                    end_gradient: c[0][2],
                                    capsule_text: null,
                                    duration: null,
                                    duration_text_color: '#000000',
                                    duration_bg_color: '#ffffff',
                                    views: null,
                                };
                                list.push(o);
                            }
                        }
                        caraouselOrder[i].list = list;
                        result.push(caraouselOrder[i]);
                    }
                }
            }
        }
        promiseResolve(result);
        return masterPromise;
    } catch (e) {
        console.log(e);
        promiseResolve([]);
        return masterPromise;
    }
    // })
}

async function getAllActiveHomePageWidgetsData(db, config, homePageWidgets, student_id, student_class) {
    const homepageWidgetsList = [];
    let subjectActivePersonalisationFlag = 0;
    let subjectPersonalisationObj;
    // let subjectPersonalisationObj = await utility.getSubjectPersonalisationObj(db.redis.read,student_id,student_class);
    console.log('here also -------- - - - - - - - -  - - - - - - ');
    console.log(subjectPersonalisationObj);
    console.log('homepage widgets length');
    console.log(homePageWidgets.length);

    for (let i = 0; i < homePageWidgets.length; i++) {
        console.log(i);
        console.log(homePageWidgets[i]);
        console.log('homepage widgets');
        const widget = homePageWidgets[i];
        widget.submit_url_endpoint = Data.widgetSelectionSubmitUrls[widget.type];
        let widgetData;
        if (!widget.default_type) {
            const show = await StudentCourseMapping.displayCheckForWidget(db.mysql.read, student_id, widget.type);
            if (!(typeof show !== 'undefined' && show.length > 0)) {
                let listData;
                widgetData = { ...widget };
                if (widget.type === 'exam' || widget.type === 'board') {
                    listData = await ClassCourseMapping.getWidgetTypeContent(db, config, widget.type, student_class, 0);
                    if (typeof listData !== 'undefined' && listData.length > 0) {
                        widgetData.list = listData;
                        const otherListData = await ClassCourseMapping.getWidgetTypeContent(db, config, widget.type, student_class, 1);
                        if (typeof otherListData.length !== 'undefined' && otherListData.length > 0) {
                            widgetData.others = otherListData;
                        }
                        homepageWidgetsList.push(widgetData);
                    }
                }
            } else {
                console.log('no need to show this widget', widget.type);
            }
        } else if (widget.default_type === 2) {
            if (subjectActivePersonalisationFlag === 0) {
                if (_.isEmpty(subjectPersonalisationObj)) {
                    subjectPersonalisationObj = await utility.getSubjectPersonalisationObj(db.redis.read, student_id, student_class);
                    console.log('subject personalisation object is here ---- >>>');
                    console.log(subjectPersonalisationObj);
                }
                // if(1){
                const show = await StudentCourseMapping.checkForActiveWidgetSubjectPersonalistion(db.mysql.read, student_id);
                if (typeof show !== 'undefined' && show.length > 0) {
                    subjectActivePersonalisationFlag = 1;
                    // if(widget['type'] == 'subject' || widget['type']== 'challenge_of_the day' || widget['type'] == 'exam_booster' || widget['type']=='topic_booster'){
                    let listData;
                    widgetData = { ...widget };
                    if (widget.type === 'SUBJECT') {
                        listData = await PersonalisedSubjectsMapping.getAvailableSubjectsToPersonalise(db.mysql.read, student_id);
                        // ------------------------ getting now type from table only  ----------------- ///
                        // let st_prefrences =  await studentPersonalisation.getStudentSubjectPrefrence(db.redis.read,student_id);
                        // let subject_redis_data = JSON.parse(st_prefrences);
                        // let subject_selected = _.isEmpty(subject_redis_data) ? 1 : subject_redis_data.subject
                        const subject_selected = await utility.getSubjectSelection(db.redis.read, student_id, student_class);
                        console.log('subject ------- is ----- selected ------- do you know which --------');
                        console.log(subject_selected);
                        console.log('above is the selected one');
                        listData = listData.map((el) => {
                            if (el.id === subject_selected) {
                                return { ...el, is_active: 1 };
                            }
                            return { ...el, is_active: 0 };
                        });

                        widgetData.list = listData;
                        homepageWidgetsList.push(widgetData);
                    } else if (widget.type === 'CHALLENGE_OF_THE_DAY' || widget.type === 'BOARD_EXAM_BOOSTER' || widget.type === 'TOPIC_BOOSTER') {
                        console.log('i am in this challenge block also');
                        listData = await HomepageQuestionsMaster.getPersonalisedQuestionData(db.mysql.read, widget.type, student_id, subjectPersonalisationObj.class, subjectPersonalisationObj.subject, subjectPersonalisationObj.chapter, widget.data_limit);
                        widgetData.list = utility.getQandAHomeWidgetsFormatter(listData);
                        homepageWidgetsList.push(widgetData);
                    } else {
                        console.log('no currently available widget data on this widget type');
                    }
                } else {
                    subjectActivePersonalisationFlag = -1;
                }
            } else if (subjectActivePersonalisationFlag === 1) {
                if (_.isEmpty(subjectPersonalisationObj)) {
                    subjectPersonalisationObj = await utility.getSubjectPersonalisationObj(db.redis.read, student_id, student_class);
                    console.log('subjet personalisation object is here ---- >>>');
                    console.log(subjectPersonalisationObj);
                }
                let list_data;
                widgetData = { ...widget };
                if (widget.type === 'SUBJECT') {
                    list_data = await PersonalisedSubjectsMapping.getAvailableSubjectsToPersonalise(db.mysql.read, student_id);
                    widgetData.list = list_data;
                    homepageWidgetsList.push(widgetData);
                } else if (widget.type === 'CHALLENGE_OF_THE_DAY' || widget.type === 'BOARD_EXAM_BOOSTER' || widget.type === 'TOPIC_BOOSTER') {
                    console.log('i am in this challenge block also');
                    list_data = await HomepageQuestionsMaster.getPersonalisedQuestionData(db.mysql.read, widget.type, student_id, subjectPersonalisationObj.class, subjectPersonalisationObj.subject, subjectPersonalisationObj.chapter, widget.data_limit);
                    widgetData.list = utility.getQandAHomeWidgetsFormatter(list_data);
                    homepageWidgetsList.push(widgetData);
                } else {
                    console.log('no currently available widget data on this widget type');
                }
            } else {
                // console.log("no widgets of this type is to be shown to the student");
                console.log('subject personalisation is off for the student');
            }
        } else {
            console.log('no i dont want to display anything');
        }
    }
    return homepageWidgetsList;
}

module.exports = {
    getHomepage,
    getPersonalisedHomepage,
    getAllActiveHomePageWidgetsData,
};
