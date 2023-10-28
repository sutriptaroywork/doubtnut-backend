const _ = require('lodash');
const moment = require('moment');
const DppContainer = require('../../../modules/containers/dailyPractiseProblems');
const QuestionContainer = require('../../../modules/containers/question');
const PlaylistContainer = require('../../../modules/containers/playlist');
const HomepageContainer = require('../../../modules/containers/homepage');
const AppBannerContainer = require('../../../modules/containers/appBanner');
const TestSeriesContainer = require('../../../modules/containers/testseries');
const DailyContestContainer = require('../../../modules/containers/dailyContest');
const PdfContainer = require('../../../modules/containers/pdf');
const FeedContainer = require('../../../modules/containers/feed');
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions');
const utility = require('../../../modules/utility');
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
function getDailyQuizData(type, student_id, student_class, limit, db) {
    // eslint-disable-next-line no-async-promise-executor
    return new Promise(async (resolve, reject) => {
        try {
            const promise = [];
            promise.push(TestSeriesContainer.getDailyQuizData(type, student_class, limit, db));
            promise.push(StudentTestsSubsriptions.get1StudentTestsSubsriptionsByStudentId(db.mysql.read, student_id));
            const data = await Promise.all(promise);
            const temp = testSeriesArrayResponseFormatter1(data[0], data[1]);
            return resolve(temp);
        } catch (e) {
            // console.log(e)
            reject(e);
        }
    });
}
function generatePromises(caraouselOrder, data, db, elasticSearchInstance) {
    const promise = [];
    for (let i = 0; i < caraouselOrder.length; i++) {
    // console.log(caraouselOrder[i].type);
        if (caraouselOrder[i].type === 'DPP') {
            const gradient = _.sample(data.color);
            promise.push(DppContainer.getDPPVideoType(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule[2], data.capsule[1], data.student_id, data.student_class, caraouselOrder[i].data_limit, data.duration[0], data.duration[1], db));
        } else if (caraouselOrder[i].type === 'CRASH_COURSE') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getCrashCourseData(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, caraouselOrder[i].data_limit, data.student_class, data.duration, db));
        } else if (caraouselOrder[i].type === 'LATEST_FROM_DOUBTNUT') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getLatestFromDoubtnutData(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'TRENDING') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getTrendingVideoData(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'VIRAL') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getTipsAndTricksData(caraouselOrder[i].type, data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'NCERT_SOLUTIONS' && caraouselOrder[i].data_type === 'ncert') {
            const gradient = _.sample(data.color);
            promise.push(PlaylistContainer.getNCERTData(caraouselOrder[i].type, gradient, caraouselOrder[i].data_type, data.description, '', data.capsule, data.student_class, caraouselOrder[i].data_limit, data.language, db));
        } else if (caraouselOrder[i].type === 'GK') {
            const gradient = _.sample(data.color);
            promise.push(QuestionContainer.getGeneralKnowledgeData(data.base_url, gradient, caraouselOrder[i].data_type, data.description, data.page_param, data.capsule, data.student_class, caraouselOrder[i].data_limit, data.duration, db));
        } else if (caraouselOrder[i].type === 'DAILY_QUIZ') {
            promise.push(getDailyQuizData(caraouselOrder[i].type, data.student_id, data.student_class, caraouselOrder[i].data_limit, db));
        } else if (caraouselOrder[i].type === 'DAILY_CONTEST') {
            promise.push(DailyContestContainer.getDailyContestData(caraouselOrder[i].type, caraouselOrder[i].data_type, data.button, caraouselOrder[i].data_limit, data.student_class, db));
        } else if (caraouselOrder[i].type === 'APP_BANNER') {
            if (caraouselOrder[i].scroll_size === '1x') {
                promise.push(AppBannerContainer.getAppBanner1xData(caraouselOrder[i].type, caraouselOrder[i].scroll_size, caraouselOrder[i].data_type, data.button, data.subtitle, data.description, caraouselOrder[i].data_limit, data.student_class, db));
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
            promise.push(PdfContainer.get12PrevYearData(caraouselOrder[i].type, data.action_activity, data.description, caraouselOrder[i].data_type, data.student_class, caraouselOrder[i].data_limit, db));
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
            // get previous watched video
            // console.log('dataaaaaaaaaaaaaaa')
            if (data.ocr === null) {
                data.ocr = '';
            }
            promise.push(elasticSearchInstance.findByOcr(data.ocr));
        }
    }
    return promise;
}
// eslint-disable-next-line no-shadow
async function getHomepage(data, config, db, elasticSearchInstance) {
    let promiseResolve; let
        promiseReject;
    const masterPromise = new Promise((resolve, reject) => {
        promiseResolve = resolve;
        // eslint-disable-next-line no-unused-vars
        promiseReject = reject;
    });
    // first try to get from redis
    // return new Promise(async function (resolve, reject) {
    // Do async job
    try {
        const caraouselOrder = await HomepageContainer.getCaraousel(data.student_class, data.caraousel_limit, data.page, db);
        // console.log("caraouselOrder")
        for (let i = 0; i < caraouselOrder.length; i++) {
            if (caraouselOrder[i].type == 'WHATSAPP_ASK' || caraouselOrder[i].type === 'CHEMISTRY' || caraouselOrder[i].type === 'PHYSICS' || caraouselOrder[i].type === 'MATHS') {
                caraouselOrder.splice(i, 1);
                i--;
            }
        }
        // console.log(caraouselOrder)
        const promise = generatePromises(caraouselOrder, data, db, elasticSearchInstance);
        const output = await Promise.all(promise);
        // console.log("output")
        // console.log(output)
        // r(output)
        const result = [];
        for (let i = 0; i < output.length; i++) {
            if (output[i].length > 0) {
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type !== 'SUPER_SERIES' && caraouselOrder[i].type !== 'JEE MAINS 2019 - APRIL') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = {};
                    const temp = {};
                    // eslint-disable-next-line no-mixed-operators
                    if ((data.student_class == '6' || data.student_class == '7' || data.student_class == '8' || data.student_class == '9') && caraouselOrder[i].type === 'NCERT_SOLUTIONS' || caraouselOrder[i].type === 'CUTOFF_LIST') {
                        temp.action_activity = 'downloadpdf_level_two';
                        temp.action_data = { pdf_package: output[i][0].package, level_one: output[i][0].level1 };
                    } else {
                        temp.action_activity = 'downloadpdf_level_one';
                        temp.action_data = { pdf_package: output[i][0].package };
                    }
                    if (output[i][0].package !== null && output[i][0].level1 !== null) {
                        caraouselOrder[i].view_more_params = temp;
                    }
                    if (data.student_class == '14' && typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].type === 'NCERT_SOLUTIONS') {
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

                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type === 'SUPER_SERIES') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf', action_data: null };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_one';
                        output[i][j].action_data = { pdf_package: output[i][j].package };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type === 'JEE MAINS 2019 - APRIL') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf_level_one', action_data: { pdf_package: output[i][0].package } };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_two';
                        output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].level1 };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type === 'NEET 2019 SOLUTIONS') {
                    // caraouselOrder[i].view_all = 1
                    // caraouselOrder[i].view_more_params = {"action_activity": "downloadpdf_level_one", "action_data": {"pdf_package":output[i][0].package}}

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'pdf_viewer';
                        // output[i][j].action_data = {"pdf_package": output[i][j].location}
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'pdf' && caraouselOrder[i].type === 'MOCK TEST') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { action_activity: 'downloadpdf_level_one', action_data: { pdf_package: output[i][0].package } };

                    for (let j = 0; j < output[i].length; j++) {
                        output[i][j].action_activity = 'downloadpdf_level_two';
                        output[i][j].action_data = { pdf_package: output[i][j].package, level_one: output[i][j].level1 };
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'ncert') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { class: data.student_class }; // chapter will go
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'topic') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { class: data.student_class, course: output[i][0].course };
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
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'video') {
                    caraouselOrder[i].view_all = 1;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].type };
                    for (let j = 0; j < output[i].length; j++) {
                        // let views_count = await QuestionContainer.getTotalViews(output[i][j].id, db)
                        // output[i][j].views = views_count[0]['total_count']
                        output[i][j].views = null;
                    }
                }
                if (typeof caraouselOrder[i].data_type !== 'undefined' && caraouselOrder[i].data_type === 'banner') {
                    caraouselOrder[i].view_all = 1;
                    for (let j = 0; j < output[i].length; j++) {
                        if (output[i][j].action_data !== null) {
                            // //console.log(output[i][j].action_data)
                            if (typeof output[i][j].action_data !== 'undefined') {
                                output[i][j].action_data = JSON.parse(output[i][j].action_data);
                            }
                        }
                    }
                }
                caraouselOrder[i].list = output[i];
                result.push(caraouselOrder[i]);
            } else if (i === 0) {
                if (caraouselOrder[i].type == 'SFY') {
                    caraouselOrder[i].view_all = 0;
                    caraouselOrder[i].view_more_params = { playlist_id: caraouselOrder[i].type };
                    if (output[i].hits.hits.length > 0) {
                        const list = [];

                        for (let k = 0; k < output[i].hits.hits.length && k < 6; k++) {
                            if (output[i].hits.hits[k]._source.question_id !== data.question_id) {
                                const c = utility.shuffle(data.color);
                                const i_url = `${config.staticCDN}q-thumbnail/${output[i].hits.hits[k]._source.question_id}.png`;
                                const o = {
                                    id: output[i].hits.hits[k]._source.question_id,
                                    type: 'video',
                                    image_url: i_url,
                                    title: output[i].hits.hits[k]._source.ocr_text,
                                    description: '',
                                    page: 'HOME_FEED',
                                    capsule_bg_color: '#ffffff',
                                    capsule_text_color: '#000000',
                                    start_gradient: c[0][0],
                                    mid_gradient: c[0][1],
                                    end_gradient: c[0][2],
                                    chapter: output[i].hits.hits[k]._source.meta_chapter,
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
        // console.log(e)
        promiseResolve([]);
        return masterPromise;
    }
    // })
}

module.exports = {
    getHomepage,
};