/**
 * This is a helper file of practice corner module,
 * built with class based architecture, used mysql as primary database
 * PRD: https://docs.google.com/document/d/1aKxRqRBErlAC94Or2dwEi6bHmWLAZBv-L9HaqJGzSO8/edit
 */

const _ = require('lodash');
const moment = require('moment');
const { ObjectId } = require('mongodb');
const logger = require('../../config/winston').winstonLogger;
const practiceCornerData = require('../../data/practiceCorner.data');
const practiceCornerMySql = require('../../modules/mysql/practiceCorner');
const redisClient = require('../../config/redis');
const redisLibrary = require('../../modules/redis/library');
const dexterController = require('../v1/dexter/dexter.controller');
const practiceCornerRedis = require('../../modules/redis/practiceCorner');
const questionContainer = require('../../modules/containers/question');
const teslaHelper = require('../v1/tesla/tesla.helper');
const teslaCtrl = require('../v1/tesla/tesla.controller');
const CourseHelper = require('./course');
const courseHelper = require('../v2/course/course.controller');
const CourseContainerv2 = require('../../modules/containers/coursev2');
const CourseManager = require('./course');
const courseHelpers = require('../v6/course/course.helper');
const altAppData = require('../../data/alt-app');


const QUIZ_HISTORY_PAGINATED_LIMIT = 10;

class PracticeCornerManager {
    /**
     * Revision corner is a new Idea within the app where students can revise for their subjects/exams with help of
     * short/long tests, daily practice problems, exam based tests, can also improvise on their IOs through aptitude
     * tests and also revise formulas for all their subjects in a single place
     * @constructor
     */
    constructor(request) {
        console.log(request.user.student_id, ' Student id');
        this.config = request.app.get('config');
        this.db = request.app.get('db');
        this.locale = request.user.locale;
        this.mongoClient = this.db.mongo;
        this.req = request;
        this.student_id = request.user.student_id;
        this.student_class = (_.isNull(request.user.student_class) ? 12 : parseInt(request.user.student_class));
        this.availableChapterCollection = 'available_chapter_alias_quiz';
        this.practiceCornerResult = 'practice_corner_results';
        this.message = 'successful';
        this.capitalize = (s) => {
            if (typeof s !== 'string') {
                return '';
            }
            return s.charAt(0).toUpperCase() + s.slice(1);
        };
        this.isQuestionExist = (questionid, correctQuesArray) => {
            let result = false;
            // checking whether user has marked correct/incorrect
            _.forEach(correctQuesArray, (x) => {
                if (x === questionid) {
                    result = true;
                }
            });
            return result;
        };
        // making correct,incorrect and skipped questions array for submit api
        this.getResultSummaryData = (correctAns, incorrectAns, skipped) => [
            {
                text: this.locale === 'hi' ? practiceCornerData.result.hi.correct : practiceCornerData.result.en.correct,
                count: correctAns,
                color: practiceCornerData.colorCodes.correctAnswerColor,
            },
            {
                text: this.locale === 'hi' ? practiceCornerData.result.hi.incorrect : practiceCornerData.result.en.incorrect,
                count: incorrectAns,
                color: practiceCornerData.colorCodes.incorrectAnswerColor,
            },
            {
                text: this.locale === 'hi' ? practiceCornerData.result.hi.skipped : practiceCornerData.result.en.skipped,
                count: skipped,
                color: practiceCornerData.colorCodes.skippedAnswerColor,
            },
        ];
        this.getOptionsArray = (question) => [{
            key: 'A',
            value: question.opt_1,
        },
        {
            key: 'B',
            value: question.opt_2,
        }, {
            key: 'C',
            value: question.opt_3,
        }, {
            key: 'D',
            value: question.opt_4,
        }];
        this.ordinalSuffixOf = (i) => {
            const j = i % 10;
            const k = i % 100;
            if (j === 1 && k !== 11) {
                return `${i}st`;
            }
            if (j === 2 && k !== 12) {
                return `${i}nd`;
            }
            if (j === 3 && k !== 13) {
                return `${i}rd`;
            }
            return `${i}th`;
        };
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();

        this.getSecondsLeftInDayEnd = () => {
            const now = moment(new Date()).add(5, 'hours').add(30, 'minutes').toDate();
            const end = now.setHours(23, 59, 59);
            return Math.floor((end - Date.now()) / 1000);
        };

        this.getSubmittedOption = (qid, optionsSubmitted) => {
            let res = null;
            _.forEach(optionsSubmitted, (option) => {
                if (parseInt(option.question_id) === qid) {
                    res = option.selected_option;
                }
            });
            return res;
        };
    }

    async getDailyPracticeWidget(priority) {
        try {
            const secondsInDayEnd = this.getSecondsLeftInDayEnd();

            const rediskey = `PRACTICE_CORNER_${this.student_class}`;
            let dailyPracticeDataFromRedis = await redisLibrary.getByKey(rediskey, this.db.redis.read);

            const dppKey = `DAILY_PRACTICE_${this.student_id}_${this.student_class}`;
            const dppExists = await redisLibrary.getByKey(dppKey, this.db.redis.read);

            if (!_.isNull(dailyPracticeDataFromRedis)) {
                dailyPracticeDataFromRedis = JSON.parse(dailyPracticeDataFromRedis);
                if (!_.isNull(dppExists)) {
                    // if this exists means user has completed todays daily practice test
                    dailyPracticeDataFromRedis.widget_data.completed_text = this.locale === 'hi' ? practiceCornerData.dailyPracticeCompleted.hi : practiceCornerData.dailyPracticeCompleted.en;
                    dailyPracticeDataFromRedis.widget_data.deeplink = `doubtnutapp://revision_corner/short_test_solution?result_id=${JSON.parse(dppExists)}&widget_id=1`;
                    return dailyPracticeDataFromRedis;
                }
                return dailyPracticeDataFromRedis;
            }

            // mentioned default topic
            let topic = 'INTEGERS';
            let subject = 'MATHS';
            const randomTopic = await this.mongoClient.read.collection(this.availableChapterCollection).aggregate([
                { $match: { class: this.student_class } }, { $sample: { size: 1 } },
            ]).toArray();
            if (!_.isEmpty(randomTopic)) {
                topic = randomTopic[0].chapter;
                subject = randomTopic[0].subject;
            }
            const obj = {
                widget_type: 'widget_revision_corner_banner',
                widget_data: {
                    heading: `${this.locale === 'hi' ? practiceCornerData.dailyPracticeTitle.hi : practiceCornerData.dailyPracticeTitle.en}`,
                    title: topic,
                    title_text_size: 18,
                    title_text_color: '#845786',
                    subtitle: this.locale === 'hi' ? practiceCornerData.dailyPracticeSubTitle.hi : practiceCornerData.dailyPracticeSubTitle.en,
                    subtitle_text_size: 14,
                    subtitle_text_color: '#845786',
                    deeplink: `doubtnutapp://revision_corner/rules?widget_id=1&chapter_alias=${encodeURIComponent(topic)}&subject=${encodeURIComponent(subject)}`, // daily practice test rules deeplink
                    background_image: practiceCornerData.dailyPractice.background_image_url,
                    icon_image: practiceCornerData.dailyPractice.icon_url,
                    completed_text: null,
                    info_text: this.locale === 'hi' ? practiceCornerData.refreshTest.hi : practiceCornerData.refreshTest.en,
                    card_ratio: '2.4:1',
                    event_name: 'dpp',
                },
                priority,
            };
            redisLibrary.setByKey(rediskey, obj, secondsInDayEnd, this.db.redis.write);
            return obj;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getAptitudeTestWidget(priority) {
        try {
            return {
                widget_type: 'widget_revision_corner_banner',
                widget_data: {
                    title: this.locale === 'hi' ? practiceCornerData.aptitudeTestTitle.hi : practiceCornerData.aptitudeTestTitle.en,
                    title_text_size: 20,
                    title_text_color: '#ffffff',
                    card_ratio: '2.523:1',
                    subtitle: this.locale === 'hi' ? practiceCornerData.aptitudeTestSubTitle.hi : practiceCornerData.aptitudeTestSubTitle.en,
                    subtitle_text_size: 14,
                    subtitle_text_color: '#ffffff',
                    deeplink: 'doubtnutapp://revision_corner/rules?widget_id=4&chapter_alias=AptitudeTest&subject=AptitudeTest',
                    background_image: practiceCornerData.aptitudeTest.background_image_url,
                    icon_image: practiceCornerData.aptitudeTest.icon_url,
                    event_name: 'aptitude_test',
                },
                priority,
            };
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    getShortTestWidget(priority) {
        try {
            const data = {
                widget_type: 'widget_parent',
                widget_data: {
                    title: this.locale === 'hi' ? practiceCornerData.shortTestTitle.hi.title : practiceCornerData.shortTestTitle.en.title,
                    secondary_title: this.locale === 'hi' ? practiceCornerData.shortTestTitle.hi.secondary_title : practiceCornerData.shortTestTitle.en.secondary_title,
                    title_text_size: '18',
                    top_icon_2: practiceCornerData.infoIcon,
                },
                extra_params: { widget_id: '2', event_name: 'short_test' },
                priority,

            };
            const items = [];
            const subjects = this.locale === 'hi' ? practiceCornerData.subjects.hi : practiceCornerData.subjects.en;
            for (let i = 0; i < subjects.length; i++) {
                const obj = {
                    widget_type: 'widget_icon_cta',
                    widget_data: {
                        title: subjects[i].title,
                        icon: subjects[i].icon,
                        deepLink: `doubtnutapp://revision_corner/chapter?subject=${subjects[i].subject_alias}`,
                        card_width: '4',
                    },
                };
                items.push(obj);
            }
            data.widget_data.items = items;
            return data;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    getFullLengthTestWidget(priority) {
        try {
            const data = {
                widget_type: 'widget_parent',
                widget_data: {
                    title: this.locale === 'hi' ? practiceCornerData.fullLengthTest.hi : practiceCornerData.fullLengthTest.en,
                    title_text_size: '18',
                },
                priority,
            };
            const { exams } = practiceCornerData;
            const items = [];
            let studentClass = this.student_class;
            _.map(exams, (exam) => {
                let examAlias = exam.alias;
                if (['jeeMains', 'jeeAdvance', 'neet'].includes(examAlias)) {
                    if (this.student_class >= 13) {
                        studentClass = 12;
                    }
                    examAlias = `${examAlias}${studentClass}`;
                }
                const obj = {
                    widget_type: 'widget_icon_cta',
                    widget_data: {
                        title: exam.exam_title,
                        icon: exam.icon,
                        deepLink: `doubtnutapp://revision_corner/full_length?exam_type=${examAlias}`,
                        card_width: '4',
                    },
                };

                items.push(obj);
            });

            data.widget_data.items = items;
            return data;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getAptitudeTestSolutions(allQuestions, submittedOptions, widgetId) {
        try {
            // for making submitted options array in same sequence as all questions array
            let questionData;
            let questions = [];
            let solutionsData = [];
            if (widgetId === 2) {
                questions = await practiceCornerMySql.getQuestionsByQids(this.db.mysql.read, allQuestions);
                solutionsData = await practiceCornerMySql.getVideoTextSolutions(this.db.mysql.read, allQuestions);
            } else if (widgetId === 4) {
                questionData = await practiceCornerMySql.aptitudeQuestionsDataBasesOnQid(this.db.mysql.read, allQuestions);
                for (let i = 0; i < questionData.length; i += 4) {
                    questions.push(this.makeQuestionFormat(questionData, questionData[i].questionbank_id));
                }
            }
            const list = [];
            _.forEach(questions, (ques, index) => {
                let videoDeeplink = null;
                let videoText = null;
                if (widgetId === 2 && solutionsData[index]) {
                    if (solutionsData[index].is_answered === 1) {
                        videoDeeplink = `doubtnutapp://video?qid=${ques.question_id}&page=PRACTICE_CORNER`;
                        videoText = 'View Solution';
                    } else if (solutionsData[index].is_text_answered === 1) {
                        videoDeeplink = `doubtnutapp://video?qid=${ques.question_id}&page=PRACTICE_CORNER&resource_type=text`;
                        videoText = 'View Solution';
                    }
                }
                const submittedOption = this.getSubmittedOption(ques.question_id, submittedOptions);
                const obj = {
                    question: ques.question_text,
                    question_no_text: this.locale === 'hi' ? `प्रश्न ${index + 1}` : `Questions ${index + 1}`,
                    quiz_question_id: ques.question_id,
                    subject: ques.subject,
                    chapter: ques.chapter,
                    options: this.getOptionsArray(ques),
                    answer: ques.answer.toUpperCase(),
                    solutions_playlist_id: 453978,
                    message: this.message,
                    type: '0',
                    submitted_option: submittedOption,
                    solution_text: submittedOption === null ? 'Skipped' : null,
                    solution_deeplink: ' ',
                    // hard coded is_result true specifically for practice corner due to common screen
                    is_result: true,
                    video_text: videoText,
                    video_deeplink: videoDeeplink,
                };
                list.push(obj);
            });
            return list;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async createResultEntry(data, isRedis) {
        let lastInsertId = null;
        await this.mongoClient.write.collection(this.practiceCornerResult).insertOne(data, (err, result) => {
            console.log(`Record added as ${result.insertedId}`);
            lastInsertId = result.insertedId;
            if (isRedis) {
                const secondsInDayEnd = this.getSecondsLeftInDayEnd();
                const rediskey = `DAILY_PRACTICE_${this.student_id}_${this.student_class}`;
                redisLibrary.setByKey(rediskey, lastInsertId, secondsInDayEnd, this.db.redis.write);
            }
        });
        return lastInsertId;
    }

    async submit() {
        try {
            let {
                all_questions: allQuestions, correct_questions: correctQuestions, incorrect_questions: incorrectQuestions,
                widget_id: widgetId, subject,
            } = this.req.body;
            const { submitted_options: submittedOptions, chapter_alias: chapterAlias } = this.req.body;
            subject = subject.toUpperCase();

            // performing parseInt on each elements of all, correct and incorrect questions array
            allQuestions = _.map(allQuestions, (ques) => parseInt(ques));
            correctQuestions = _.map(correctQuestions, (ques) => parseInt(ques));
            incorrectQuestions = _.map(incorrectQuestions, (ques) => parseInt(ques));
            widgetId = parseInt(widgetId);

            const finalData = {};
            let heading = '';

            const totalQuestions = allQuestions.length;
            const correctAns = correctQuestions.length;
            const incorrectAns = incorrectQuestions.length;
            const skipped = totalQuestions - (correctAns + incorrectAns);
            let totalMarks = totalQuestions;
            let userScore = correctAns;

            if (widgetId === 1) {
                // Daily Practice
                heading = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;
            } else if (widgetId === 2) {
                // ShortTest
                if (this.req.headers.version_code >= 940) {
                    finalData.questions = await this.getAptitudeTestSolutions(allQuestions, submittedOptions, widgetId);
                    finalData.is_submitted = true;
                } else {
                    finalData.solutions_playlist_id = practiceCornerData.result.solutionsPlaylistId;
                }
                totalMarks = 4 * totalQuestions;
                userScore = 4 * correctAns;
                heading = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;
            } else if (widgetId === 4) {
                // aptitude test
                heading = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;
                finalData.questions = await this.getAptitudeTestSolutions(allQuestions, submittedOptions, widgetId);
                finalData.is_submitted = true;
            }

            finalData.header = {
                title1: heading,
                title2: chapterAlias,
            };

            finalData.summary = this.getResultSummaryData(correctAns, incorrectAns, skipped);

            const detailedSummary = [];
            _.map(allQuestions, (question, index) => {
                // checking whether question is correct, incorrect or skipped
                const obj = {
                    question_no: index + 1,
                };
                if (this.isQuestionExist(question, correctQuestions)) {
                    obj.color = practiceCornerData.colorCodes.correctAnswerColor;
                } else if (this.isQuestionExist(question, incorrectQuestions)) {
                    obj.color = practiceCornerData.colorCodes.incorrectAnswerColor;
                } else {
                    obj.color = practiceCornerData.colorCodes.skippedAnswerColor;
                }
                detailedSummary.push(obj);
            });
            let isDppRedis = false;
            if (widgetId === 1) {
                isDppRedis = true;
            }
            await this.createResultEntry({
                // inserting test data into mongo
                type: widgetId,
                student_id: this.student_id,
                total_ques: allQuestions,
                incorrect_ques: incorrectQuestions,
                correct_ques: correctQuestions,
                total_correct: correctAns,
                total_incorrect: incorrectAns,
                total_skipped: skipped,
                subject,
                chapter: chapterAlias,
                total_marks: totalMarks,
                score: userScore,
                created_at: this.currentDate,
                submitted_options: submittedOptions || null,
            }, isDppRedis);
            const lang = this.locale == 'hi' ? 'HINDI' : 'ENGLISH';
            const data = await practiceCornerMySql.getQidByChapter(this.db.mysql.read, chapterAlias, this.student_class, lang);
            if (data.length && this.req.headers.version_code >= 1007) {
                const deeplink = `doubtnutapp://course_details?id=${data[0].course_resource_id}`;
                const userPackages = await CourseContainerv2.getUserActivePackages(this.db, this.student_id);
                const studentSubscriptionDetails = userPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.amount !== -1);
                const { result } = await CourseManager.getLectureSeriesByQuestionID(this.db, parseInt(data[0].resource_reference), studentSubscriptionDetails, this.student_id);
                const qidList = result.map((x) => x.resource_reference);
                const promise = [];
                for (let i = 0; i < qidList.length; i++) {
                    promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(this.db, qidList[i]));
                }
                let freeClassData = await Promise.all(promise);
                freeClassData = CourseHelper.bottomSheetDataFormat(qidList, freeClassData, 0);
                const items = [];
                for (let i = 0; i < freeClassData.widget_data.items.length; i++) {
                    const item = {};
                    item.type = freeClassData.widget_data.items[i].type;
                    item.data = freeClassData.widget_data.items[i].data;
                    item.page = 'SHORTTEST_RESULT';
                    items.push(item);
                }
                freeClassData.widget_data.items = items;
                await courseHelpers.addViewLikeDuration(this.db, freeClassData);
                if (finalData.questions) {
                    if (correctQuestions.length > 5) {
                        finalData.questions.splice(2, 0, {
                            type: 'widget',
                            widget: {
                                type: 'widget_autoplay',
                                data: {
                                    items: freeClassData.widget_data.items, extra_params: { source: 'SHORTTEST_RESULT' },
                                },
                            },
                        });
                        finalData.questions.splice(2, 0, {
                            type: 'widget',
                            widget: await this.getStatusBanner(true, deeplink),
                        });
                    } else {
                        finalData.questions.unshift({
                            type: 'widget',
                            widget: {
                                type: 'widget_autoplay',
                                data: {
                                    items: freeClassData.widget_data.items, extra_params: { source: 'SHORTTEST_RESULT' },
                                },
                            },
                        });
                        finalData.questions.unshift({
                            type: 'widget',
                            widget: await this.getStatusBanner(false, deeplink),
                        });
                    }
                }
            }
            finalData.detailed_summary = detailedSummary;
            finalData.question_ids = allQuestions;
            finalData.progress_report_icon = practiceCornerData.progresReportIcon;

            if (widgetId === 1) {
                finalData.solutions_playlist_id = practiceCornerData.result.solutionsPlaylistId;
            }
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'home', error: errorLog });
            throw (e);
        }
    }

    async previousResult() {
        try {
            const { result_id: resultId } = this.req.body;
            let { widget_id: widgetId } = this.req.body;
            widgetId = parseInt(widgetId);

            let allQuestions = [];
            let correctQuestions = [];
            let incorrectQuestions = [];
            let chapterAlias = null;
            let qids = [];
            let totalQuestions = 0;
            let correctAns = 0;
            let incorrectAns = 0;
            let skipped = 0;
            let submittedOptions = 0;

            // for fetching All practiceCorner Results
            const practiceCornerResults = await this.mongoClient.read.collection(this.practiceCornerResult).find({ _id: ObjectId(resultId) }).toArray();
            if (!_.isEmpty(practiceCornerResults)) {
                allQuestions = practiceCornerResults[0].total_ques;
                correctQuestions = practiceCornerResults[0].correct_ques;
                incorrectQuestions = practiceCornerResults[0].incorrect_ques;
                submittedOptions = practiceCornerResults[0].submitted_options;
                chapterAlias = practiceCornerResults[0].chapter;
                qids = practiceCornerResults[0].total_ques;
                totalQuestions = allQuestions.length;
                correctAns = correctQuestions.length;
                incorrectAns = incorrectQuestions.length;
                skipped = totalQuestions - (correctAns + incorrectAns);
            }

            const finalData = {};
            let heading = '';

            if (widgetId === 1) {
                // Daily Practice
                heading = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;
            } else if (widgetId === 2) {
                // ShortTest
                heading = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;
                if (this.req.headers.version_code >= 940) {
                    finalData.questions = await this.getAptitudeTestSolutions(allQuestions, submittedOptions, widgetId);
                    finalData.is_submitted = true;
                } else {
                    finalData.solutions_playlist_id = practiceCornerData.result.solutionsPlaylistId;
                }
            } else if (widgetId === 4) {
                // aptitude test
                heading = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;
                finalData.questions = await this.getAptitudeTestSolutions(allQuestions, submittedOptions, widgetId);
                finalData.is_submitted = true;
            }

            finalData.header = {
                title1: heading,
                title2: chapterAlias,
            };

            finalData.summary = this.getResultSummaryData(correctAns, incorrectAns, skipped);

            const detailedSummary = [];
            _.map(allQuestions, (question, index) => {
                const obj = {
                    question_no: index + 1,
                };
                if (this.isQuestionExist(question, correctQuestions)) {
                    obj.color = practiceCornerData.colorCodes.correctAnswerColor;
                } else if (this.isQuestionExist(question, incorrectQuestions)) {
                    obj.color = practiceCornerData.colorCodes.incorrectAnswerColor;
                } else {
                    obj.color = practiceCornerData.colorCodes.skippedAnswerColor;
                }
                detailedSummary.push(obj);
            });

            finalData.detailed_summary = detailedSummary;
            finalData.question_ids = qids;
            finalData.progress_report_icon = practiceCornerData.progresReportIcon;
            if (widgetId === 1) {
                finalData.solutions_playlist_id = practiceCornerData.result.solutionsPlaylistId;
            }
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'home', error: errorLog });
            throw (e);
        }
    }

    sheetsWidget(widgetId, data) {
        let title = null;
        if (widgetId === 1 || widgetId === 4) {
            title = this.locale === 'hi' ? practiceCornerData.performanceReportDailyPractice.hi.sheetSolved : practiceCornerData.performanceReportDailyPractice.en.sheetSolved;
        } else if (widgetId === 2) {
            title = this.locale === 'hi' ? practiceCornerData.performanceReportShortTest.hi.avgScore : practiceCornerData.performanceReportShortTest.en.avgScore;
        } else if (widgetId === 3) {
            title = this.locale === 'hi' ? practiceCornerData.performanceReportFullLength.hi.totalTests : practiceCornerData.performanceReportFullLength.en.totalTests;
        }
        return {
            score_text: `${data}`,
            background_color: '#a051ff',
            title,
        };
    }

    accuracyWidget(widgetId, data, totalMarks) {
        let obj;
        if (widgetId === 2) {
            obj = {
                title: this.locale === 'hi' ? practiceCornerData.performanceReportShortTest.hi.highestScore : practiceCornerData.performanceReportShortTest.en.highestScore,
                score_text: `${data}`,
                background_color: '#017aff',
            };
        } else {
            obj = {
                title: this.locale === 'hi' ? practiceCornerData.performanceReportDailyPractice.hi.accuracy : practiceCornerData.performanceReportDailyPractice.en.accuracy,
                score_text: `${data}/${totalMarks}`,
                background_color: '#017aff',
            };
        }
        return obj;
    }

    getSubjectProgressArray(practiceCornerResults) {
        // returns subject wise data
        const items = [];
        let obj = {};
        const groupedSubjects = _.groupBy(practiceCornerResults, 'subject');
        const subjects = ['BIOLOGY', 'CHEMISTRY', 'PHYSICS', 'MATHS'];

        _.map(subjects, (sub) => {
            if (sub === 'BIOLOGY' && groupedSubjects[sub]) {
                obj = {
                    subject: this.locale === 'hi' ? practiceCornerData.subjects.hi[3].title : practiceCornerData.subjects.en[3].title, // get data from devansh sir
                    icon: practiceCornerData.subjects.en[3].icon,
                    track_color: '#b1f8e5',
                    indicator_color: '#097209',
                    progress_text: this.locale === 'hi' ? `${groupedSubjects[sub].length} टेस्ट लिए गए` : `${groupedSubjects[sub].length} Tests Taken`,
                    max_progress: 100,
                    progress: 100,
                };
                items.push(obj);
            } else if (sub === 'CHEMISTRY' && groupedSubjects[sub]) {
                obj = {
                    subject: this.locale === 'hi' ? practiceCornerData.subjects.hi[1].title : practiceCornerData.subjects.en[1].title, // get data from devansh sir
                    icon: practiceCornerData.subjects.en[1].icon,
                    track_color: '#cfacfc',
                    indicator_color: '#a051ff',
                    progress_text: this.locale === 'hi' ? `${groupedSubjects[sub].length} टेस्ट लिए गए` : `${groupedSubjects[sub].length} Tests Taken`,
                    max_progress: 100,
                    progress: 100,
                };
                items.push(obj);
            } else if (sub === 'PHYSICS' && groupedSubjects[sub]) {
                obj = {
                    subject: this.locale === 'hi' ? practiceCornerData.subjects.hi[2].title : practiceCornerData.subjects.en[2].title, // get data from devansh sir
                    icon: practiceCornerData.subjects.en[2].icon,
                    track_color: '#dee7fa',
                    indicator_color: '#225cdd',
                    progress_text: this.locale === 'hi' ? `${groupedSubjects[sub].length} टेस्ट लिए गए` : `${groupedSubjects[sub].length} Tests Taken`,
                    max_progress: 100,
                    progress: 100,
                };
                items.push(obj);
            } else if (sub === 'MATHS' && groupedSubjects[sub]) {
                obj = {
                    subject: this.locale === 'hi' ? practiceCornerData.subjects.hi[0].title : practiceCornerData.subjects.en[0].title, // get data from devansh sir
                    icon: practiceCornerData.subjects.en[0].icon,
                    track_color: '#fcd9d9',
                    indicator_color: '#f95959',
                    progress_text: this.locale === 'hi' ? `${groupedSubjects[sub].length} टेस्ट लिए गए` : `${groupedSubjects[sub].length} Tests Taken`,
                    max_progress: 100,
                    progress: 100,
                };
                items.push(obj);
            }
        });

        return items;
    }

    getExamWidget(fullLengthTestsData, exam) {
        // return avg marks data for full length tests
        const tests = _.filter(fullLengthTestsData, (test) => test.exam_type === exam);

        const totalTests = tests.length;
        let totalMarks = 0;
        _.filter(tests, (test) => {
            totalMarks += test.score;
        });
        let avgScore = totalMarks / totalTests;
        avgScore = avgScore.toFixed();
        return {
            title: this.locale === 'hi' ? practiceCornerData.fullLengthExamNameMapping.hi[exam].avgScore : practiceCornerData.fullLengthExamNameMapping.en[exam].avgScore,
            score_text: `${avgScore}/${tests[0].total_marks}`,
            background_color: '#00e099',
        };
    }

    // return all tests performance report data
    async stats() {
        try {
            const finalData = {};
            const practiceCornerResults = await this.mongoClient.read.collection(this.practiceCornerResult).find({ student_id: this.student_id }).toArray(); // for fetching All practiceCorner Results
            finalData.title = this.locale === 'hi' ? practiceCornerData.performanceReportTitle.hi : practiceCornerData.performanceReportTitle.en;
            finalData.icon = practiceCornerData.performanceReportIcon;
            if (!_.isEmpty(practiceCornerResults)) {
                const dailyPracticeresults = _.filter(practiceCornerResults, (test) => test.type === 1);

                const stats = [];
                let scores = [];

                if (!_.isEmpty(dailyPracticeresults)) {
                    const totalSheetsSolved = dailyPracticeresults.length;
                    let totalCorrectAns = 0;

                    _.map(dailyPracticeresults, (result) => {
                        totalCorrectAns += result.correct_ques.length;
                    });

                    let avgDailyTestScore = totalCorrectAns / totalSheetsSolved;
                    avgDailyTestScore = avgDailyTestScore.toFixed();
                    const totalSheetWidget = this.sheetsWidget(dailyPracticeresults[0].type, totalSheetsSolved);
                    const avgAccuracyWidget = this.accuracyWidget(dailyPracticeresults[0].type, avgDailyTestScore, dailyPracticeresults[0].total_marks);

                    scores.push(totalSheetWidget, avgAccuracyWidget);

                    const dailyPracticeWidget = {
                        title: this.locale === 'hi' ? practiceCornerData.dailyPracticeTitle.hi : practiceCornerData.dailyPracticeTitle.en,
                        scores,
                        subject_progress_items: [],
                        cta_text: this.locale === 'hi' ? practiceCornerData.viewAllPracticeSolutions.hi : practiceCornerData.viewAllPracticeSolutions.en,
                        cta_deeplink: 'doubtnutapp://revision_corner/result_history?widget_id=1', //
                    };
                    stats.push(dailyPracticeWidget);
                }
                const shortTestResults = _.filter(practiceCornerResults, (test) => test.type === 2);

                if (!_.isEmpty(shortTestResults)) {
                    let totalMarks = 0;
                    let maxScore = 0;
                    const totalShortTestTaken = shortTestResults.length;

                    _.map(shortTestResults, (result) => {
                        if (maxScore < result.score) {
                            maxScore = result.score;
                        }
                        totalMarks += result.score;
                    });

                    let avgShortTestScore = totalMarks / totalShortTestTaken;
                    avgShortTestScore = avgShortTestScore.toFixed();

                    scores = [];
                    const avgMarksWidget = this.sheetsWidget(shortTestResults[0].type, avgShortTestScore);
                    const maxMarksWidget = this.accuracyWidget(shortTestResults[0].type, maxScore);
                    scores.push(avgMarksWidget, maxMarksWidget);

                    const subjectProgressItems = this.getSubjectProgressArray(shortTestResults);

                    const shortTestWidget = {
                        title: this.locale === 'hi' ? practiceCornerData.performanceReportShortTest.hi.title : practiceCornerData.performanceReportShortTest.en.title,
                        scores,
                        subject_progress_items: subjectProgressItems,
                        cta_text: this.locale === 'hi' ? practiceCornerData.viewShortTestSolutions.hi : practiceCornerData.viewShortTestSolutions.en,
                        cta_deeplink: 'doubtnutapp://revision_corner/result_history?widget_id=2&active_tab_id=1',
                    };
                    stats.push(shortTestWidget);
                }
                const fullLengthTestResults = _.filter(practiceCornerResults, (test) => test.type === 3);

                if (!_.isEmpty(fullLengthTestResults)) {
                    scores = [];
                    const totalTests = fullLengthTestResults.length;

                    scores.push(this.sheetsWidget(fullLengthTestResults[0].type, totalTests));

                    let examsTaken = [];

                    _.filter(fullLengthTestResults, (test) => {
                        // for making exam array which user have attempted
                        examsTaken.push(test.exam_type);
                    });

                    // checking that exam array does not contain duplicate entries
                    examsTaken = _.uniq(examsTaken);

                    _.map(examsTaken, (exam) => {
                        scores.push(this.getExamWidget(fullLengthTestResults, exam));
                    });

                    const fullTestWidget = {
                        title: this.locale === 'hi' ? practiceCornerData.performanceReportFullLength.hi.title : practiceCornerData.performanceReportFullLength.en.title,
                        scores,
                        subject_progress_items: [],
                        cta_text: this.locale === 'hi' ? practiceCornerData.viewShortTestSolutions.hi : practiceCornerData.viewShortTestSolutions.en,
                        cta_deeplink: 'doubtnutapp://revision_corner/result_history?widget_id=3',
                    };
                    stats.push(fullTestWidget);
                }
                const aptitudeTestResults = _.filter(practiceCornerResults, (test) => test.type === 4);

                if (!_.isEmpty(aptitudeTestResults)) {
                    scores = [];
                    const totalSheetsSolved = aptitudeTestResults.length;
                    let totalCorrectAns = 0;

                    _.map(aptitudeTestResults, (result) => {
                        totalCorrectAns += result.correct_ques.length;
                    });

                    let avgAptiTestScore = totalCorrectAns / totalSheetsSolved;
                    avgAptiTestScore = avgAptiTestScore.toFixed();
                    const totalSheetWidget = this.sheetsWidget(aptitudeTestResults[0].type, totalSheetsSolved);
                    const avgAccuracyWidget = this.accuracyWidget(aptitudeTestResults[0].type, avgAptiTestScore, aptitudeTestResults[0].total_marks);

                    scores.push(totalSheetWidget, avgAccuracyWidget);

                    const aptitudeTestWidget = {
                        title: this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[4].hi : practiceCornerData.widgetIdTopicMapping[4].en,
                        scores,
                        subject_progress_items: [],
                        cta_text: this.locale === 'hi' ? practiceCornerData.viewAllPracticeSolutions.hi : practiceCornerData.viewAllPracticeSolutions.en,
                        cta_deeplink: 'doubtnutapp://revision_corner/result_history?widget_id=4',
                    };
                    stats.push(aptitudeTestWidget);
                }

                finalData.stats = stats;
                finalData.no_stats = null;
            } else {
                // no stats found
                finalData.stats = null;
                finalData.no_stats = this.locale === 'hi' ? practiceCornerData.noStats.hi : practiceCornerData.noStats.en;

                if (this.student_class >= 9) {
                    const dailyPracticeData = await this.getDailyPracticeWidget();
                    if (dailyPracticeData) {
                        finalData.no_stats.deeplink = dailyPracticeData.widget_data.deeplink;
                    }
                } else if (this.student_class >= 6 && this.student_class <= 8) {
                    finalData.no_stats.deeplink = 'doubtnutapp://revision_corner/rules?widget_id=4&chapter_alias=AptitudeTest&subject=AptitudeTest';
                }
            }
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'home', error: errorLog });
            throw (e);
        }
    }

    async getTopQuestions(priority) {
        try {
            const questionsData = await redisLibrary.getByKey(`trending_videos_${this.student_class}`, redisClient);
            let qid = [];
            let allQids = [];
            const filteredQids = [];
            let questions;
            if (questionsData) {
                questionsData = JSON.parse(questionsData);
                allQids = _.map(questionsData, (question) => question.question_id);
                for (let i = 0; i < allQids.length; i++) {
                    const videoType = await questionContainer.getVideoType(this.db, allQids[i]);
                    if (videoType === 'SF') {
                        filteredQids.push(allQids[i]);
                    }
                }
                qid = filteredQids.slice(0, 10);
                allQids = filteredQids;
                console.log(filteredQids);
                questions = await practiceCornerMySql.getQuestionData(qid, this.db.mysql.read);
            }
            const title = this.locale === 'hi' ? practiceCornerData.topQuestionsTitle.hi : practiceCornerData.topQuestionsTitle.en;
            const ids = allQids.join();
            const encodedIds = encodeURIComponent(ids);
            let ctaDeeplink = `doubtnutapp://playlist?playlist_id=${practiceCornerData.result.solutionsPlaylistId}&playlist_title=${title}&page=PRACTICE_CORNER&question_ids=`;
            ctaDeeplink = ctaDeeplink.concat(encodedIds);

            let data = null;
            if (questions) {
                data = {
                    widget_type: 'widget_parent',
                    widget_data: {
                        title: this.locale === 'hi' ? practiceCornerData.topQuestionsTitle.hi : practiceCornerData.topQuestionsTitle.en,
                        title_text_size: '18',
                        link_text: this.locale === 'hi' ? practiceCornerData.viewall.hi : practiceCornerData.viewall.en,
                        deeplink: ctaDeeplink,
                    },
                    priority,
                };
                const items = [];
                for (let i = 0; i < questions.length; i++) {
                    const [{ views }] = await questionContainer.getTotalViewsNew(questions[i].question_id, this.db);
                    const obj = {
                        widget_type: 'widget_ncert_similar',
                        widget_data: {
                            id: questions[i].question_id,
                            type: '',
                            title: '',
                            ocr_text: questions[i].original_ocr_text ? questions[i].original_ocr_text : '',
                            question_id: questions[i].question_id,
                            question_thumbnail: `https://d10lpgp6xz60nq.cloudfront.net/q-thumbnail/${questions[i].question_id}.png`,
                            video_resources: [],
                            card_width: '1.2',
                            asked_count: views,
                            deeplink: `doubtnutapp://video?qid=${questions[i].question_id}&page=PRACTICE_CORNER`,
                            card_ratio: '16:10',
                        },
                        layout_config: {
                            margin_top: 4,
                            margin_bottom: 4,
                            margin_left: 0,
                            margin_right: 16,
                        },
                    };
                    items.push(obj);
                }
                data.widget_data.items = items;
            }
            return data;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getformulaDeck(priority) {
        try {
            let data = false;// 11-13
            let formulaData;
            let { student_class: studentClass } = this;
            if (this.student_class === 13) {
                studentClass = 12;
            }
            const arr = [11, 12];
            if (arr.includes(this.student_class)) {
                formulaData = await practiceCornerMySql.getFormulaDeckData(this.db.mysql.read, studentClass);
            }
            if (formulaData) {
                data = {
                    widget_type: 'widget_parent',
                    widget_data: {
                        title: this.locale === 'hi' ? practiceCornerData.fomulaDeck.hi.title : practiceCornerData.fomulaDeck.en.title,
                        title_text_size: '18',
                    },
                    priority,
                };
                const items = [];
                formulaData.forEach((x) => {
                    const obj = {
                        widget_type: 'widget_formula_sheet',
                        widget_data: {
                            id: x.id,
                            title: `${this.locale === 'hi' ? practiceCornerData.fomulaDeck.hi.subtitle : practiceCornerData.fomulaDeck.en.subtitle} | ${x.level2}`,
                            card_width: '1.3',
                            deeplink: `doubtnutapp://pdf_viewer?pdf_url=${this.config.staticCDN}pdf_download/${x.location}`,
                            image_url: `${this.config.staticCDN}images/icons/formula-deck.webp`,
                        },
                    };
                    items.push(obj);
                });
                data.widget_data.items = items;
            }
            return data;
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    async getTestsData(start, limit, widgetId, subject) {
        let data;
        if (widgetId === 2) {
            data = await this.mongoClient.read.collection(this.practiceCornerResult)
                .find({ student_id: this.student_id, type: widgetId, subject })
                .sort({ created_at: -1 }).skip(start)
                .limit(limit)
                .toArray();
        } else {
            data = await this.mongoClient.read.collection(this.practiceCornerResult)
                .find({ student_id: this.student_id, type: widgetId })
                .sort({ created_at: -1 }).skip(start)
                .limit(limit)
                .toArray();
        }
        return data;
    }

    getTopicWidget(priority) {
        return {
            widget_type: 'text_widget',
            widget_data: {
                title: this.locale === 'hi' ? practiceCornerData.revisionCornerTitle.hi : practiceCornerData.revisionCornerTitle.en,
                text_color: '#2f2f2f',
                text_size: 20,
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 8,
                margin_left: 16,
                margin_right: 0,
            },
            priority,
        };
    }

    getAptitudeTitle(priority) {
        return {
            widget_type: 'text_widget',
            widget_data: {
                title: this.locale === 'hi' ? practiceCornerData.aptitudeTestHeading.hi : practiceCornerData.aptitudeTestHeading.en,
                text_color: '#2f2f2f',
                text_size: 18,
            },
            layout_config: {
                margin_top: 0,
                margin_bottom: 8,
                margin_left: 16,
                margin_right: 0,
            },
            priority,
        };
    }

    async home() {
        try {
            /* Class 11-13th will have
            Daily Practice problem
            Short test subject topic based
            Long test exam based
            Top 100 questions of the day
            Aptitude test
            Formula sheet

            Class 9-10th will have
            Daily practice problem
            Short test subject topic based
            Top 100 questions of the day
            Aptitude test
            Formula sheet

            Class 6-8th will have
            Short test subject topic based
            Top 100 questions of the day
            Aptitude test */
            const packageValue = this.req.headers.package_name;
            const isFreeApp = packageValue === altAppData.freeAppPackageName;

            const finalData = {};
            const carousels = await practiceCornerMySql.getHomeCarousels(this.db.mysql.read);
            let carouselData = [];
            const carouselPromises = [];
            const practiceCornerResults = await this.mongoClient.read.collection(this.practiceCornerResult).find({ student_id: this.student_id }).toArray();
            for (let i = 0; i < carousels.length; i++) {
                if (carousels[i].carousel_type == 'topic' && this.student_class >= 9) {
                    carouselData.push(this.getTopicWidget(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'daily_practice' && this.student_class >= 9) {
                    carouselPromises.push(this.getDailyPracticeWidget(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'short_test' && this.student_class <= 13) {
                    carouselData.push(this.getShortTestWidget(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'full_test' && this.student_class >= 11 && this.student_class <= 13) {
                    carouselData.push(this.getFullLengthTestWidget(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'top_questions') {
                    let priority = 11;
                    if (practiceCornerResults.length >= 3) {
                        priority = 6;
                    }
                    carouselPromises.push(this.getTopQuestions(priority));
                }
                if (carousels[i].carousel_type == 'aptitude_test') {
                    carouselPromises.push(this.getAptitudeTestWidget(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'aptitude_title') {
                    carouselData.push(this.getAptitudeTitle(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'formula_deck' && this.student_class >= 9) {
                    carouselPromises.push(this.getformulaDeck(carousels[i].priority));
                }
                if (carousels[i].carousel_type == 'free_class' && !isFreeApp) {
                    let priority = 10;
                    if (practiceCornerResults.length >= 3) {
                        priority = 5;
                    }
                    carouselPromises.push(this.getFreeClassCarousel(priority));
                }
            }

            const carouselPromisesData = await Promise.all(carouselPromises);
            carouselData = [...carouselData, ...carouselPromisesData];
            carouselData = carouselData.filter(Boolean);

            carouselData.sort((a, b) => a.priority - b.priority);

            finalData.carousels = carouselData;
            finalData.rules = { 2: this.locale === 'hi' ? practiceCornerData.shortTestRules.hi : practiceCornerData.shortTestRules.en };
            finalData.rules[2].rule_title = this.locale === 'hi' ? practiceCornerData.shortTestRules.hi.subtitle : practiceCornerData.shortTestRules.en.subtitle;
            finalData.progress_report_icon = practiceCornerData.performanceReportIcon;

            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'home', error: errorLog });
            throw (e);
        }
    }

    async rules() {
        try {
            const { subject } = this.req.body;
            let { topic } = this.req.body;
            if (!topic) {
                topic = null;
            }
            const { widget_id: widgetId } = this.req.body; // 1 for dailyPracticeProblems , 2 for shortTest ,3 for fullTest , 4 for aptitudeTest
            const rulesData = {
                cta_text: this.locale === 'hi' ? practiceCornerData.startTest.hi : practiceCornerData.startTest.en,
                topic,
            };
            let ctaDeeplink = `doubtnutapp://revision_corner/short_test?widget_id=${widgetId}`;
            if (widgetId === 1) {
                rulesData.title = this.locale === 'hi' ? practiceCornerData.dailyPracticeRules.hi.title : practiceCornerData.dailyPracticeRules.en.title;
                rulesData.rule_title = this.locale === 'hi' ? practiceCornerData.dailyPracticeRules.hi.subtitle : practiceCornerData.dailyPracticeRules.en.subtitle;
                rulesData.rules = this.locale === 'hi' ? practiceCornerData.dailyPracticeRules.hi.rules : practiceCornerData.dailyPracticeRules.en.rules;
            } else if (widgetId === 2) {
                rulesData.title = this.locale === 'hi' ? practiceCornerData.shortTestRules.hi.title : practiceCornerData.shortTestRules.en.title;
                rulesData.rule_title = this.locale === 'hi' ? practiceCornerData.shortTestRules.hi.subtitle : practiceCornerData.shortTestRules.en.subtitle;
                rulesData.rules = this.locale === 'hi' ? practiceCornerData.shortTestRules.hi.rules : practiceCornerData.shortTestRules.en.rules;
            } else if (widgetId === 4) {
                rulesData.title = this.locale === 'hi' ? practiceCornerData.aptitudeTestRules.hi.title : practiceCornerData.aptitudeTestRules.en.title;
                rulesData.rule_title = this.locale === 'hi' ? practiceCornerData.aptitudeTestRules.hi.subtitle : practiceCornerData.aptitudeTestRules.en.subtitle;
                rulesData.rules = this.locale === 'hi' ? practiceCornerData.aptitudeTestRules.hi.rules : practiceCornerData.aptitudeTestRules.en.rules;
            } else {
                rulesData.title = 'Invalid rule id mentioned';
                rulesData.rule_title = null;
                rulesData.rules = null;
            }
            if (topic) {
                topic = encodeURIComponent(topic);
                ctaDeeplink = ctaDeeplink.concat(`&chapter_alias=${topic}`);
            }
            if (subject) {
                ctaDeeplink = ctaDeeplink.concat(`&subject=${subject}`);
            }
            rulesData.cta_deeplink = ctaDeeplink;
            return rulesData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'questions', error: errorLog });
            throw (e);
        }
    }

    makeQuestionFormat(questionData, id) {
        // for making format of aptitude questions data
        const obj = {
            question_id: id,
        };
        let answerOption;
        let answer = 0;
        const options = [];
        _.map(questionData, (data) => {
            if (data.questionbank_id === id) {
                options.push(data.title);
                obj.subject = data.subject_code;
                obj.question_text = data.text;
                if (data.is_answer === '1') {
                    answerOption = data.title;
                }
            }
        });
        _.map(options, (opt, i) => {
            if (i === 0) {
                obj.opt_1 = opt;
                if (answerOption === opt) {
                    answer = 1;
                }
            } else if (i === 1) {
                obj.opt_2 = opt;
                if (answerOption === opt) {
                    answer = 2;
                }
            } else if (i === 2) {
                obj.opt_3 = opt;
                if (answerOption === opt) {
                    answer = 3;
                }
            } else if (i === 3) {
                obj.opt_4 = opt;
                if (answerOption === opt) {
                    answer = 4;
                }
            }
        });
        obj.answer = practiceCornerData.idOptionsMapping[answer];
        obj.chapter = 'AptitudeTest';
        return obj;
    }

    async questions() {
        try {
            // widget_id
            let { widget_id: widgetId } = this.req.body; // 1 for dailyPracticeProblems , 2 for shortTest ,3 for fullTest , 4 for aptitudeTest
            let { chapter_alias: chapterAlias } = this.req.body;
            widgetId = parseInt(widgetId);

            const data = {};
            let heading = null;
            const totalQuestionsForQuiz = 10;
            let aptitudeTestId;
            let questionData = [];

            // eslint-disable-next-line default-case
            if (widgetId === 1) { // Daily Practice
                heading = this.locale === 'hi' ? practiceCornerData.dailyPracticeRules.hi.title : practiceCornerData.dailyPracticeRules.en.title;
            } else if (widgetId === 2) { // ShortTest
                // totalQuestionsForQuiz = 10;
                heading = this.locale === 'hi' ? practiceCornerData.shortTestRules.hi.title : practiceCornerData.shortTestRules.en.title;
            } else if (widgetId === 4) { // AptitudeTest
                chapterAlias = 'AptitudeTest';
                heading = this.locale === 'hi' ? practiceCornerData.aptitudeTestRules.hi.title : practiceCornerData.aptitudeTestRules.en.title;
            }

            data.header = {
                title1: heading,
                title2: chapterAlias,
                question_count_text: this.locale === 'hi' ? `${totalQuestionsForQuiz} प्रश्न` : `${totalQuestionsForQuiz} Questions`,
            };

            if (widgetId === 4) {
                // only for aptitude test
                aptitudeTestId = await practiceCornerMySql.getAptitudeTestId(this.db.mysql.read);
                if (!_.isEmpty(aptitudeTestId)) {
                    const allQuestionData = await practiceCornerMySql.getAptitudeQuestions(this.db.mysql.read, aptitudeTestId[0].test_id);
                    for (let i = 0; i < allQuestionData.length; i += 4) {
                        questionData.push(this.makeQuestionFormat(allQuestionData, allQuestionData[i].questionbank_id));
                    }
                }
            } else {
                // only for short test , full  test and daily practice problems
                // checking for quiz questions from redis first
                const redisKeyChapterAlias = `PC_TOPIC_${this.student_class}_${chapterAlias}`;
                questionData = await redisLibrary.getByKey(redisKeyChapterAlias, this.db.redis.read);
                if (questionData) {
                    // redis key available, parsing json
                    questionData = JSON.parse(questionData);
                } else {
                    // not found questions from redis, querying from db
                    questionData = await practiceCornerMySql.getQuestionsByChapter(this.db.mysql.read, this.student_class, chapterAlias);
                    if (!questionData.length && questionData.length < totalQuestionsForQuiz) {
                        // No Master chapter alias found error
                        return { message: 'No Chapter Alias Found' };
                    }
                    const uniqueQuestionData = _.uniqBy(questionData, 'question_text');
                    if (uniqueQuestionData.length >= totalQuestionsForQuiz) {
                        questionData = uniqueQuestionData;
                    }
                    // creating cache as questions data found from SQL
                    await redisLibrary.setByKey(redisKeyChapterAlias, questionData, 60 * 86400, this.db.redis.write);
                }
            }
            const responseFormat = _.map(dexterController.getRandomQuestions(questionData, totalQuestionsForQuiz), (question, index) => ({
                question: question.question_text,
                question_no_text: this.locale === 'hi' ? `प्रश्न ${index + 1}` : `Questions ${index + 1}`,
                quiz_question_id: question.question_id,
                solution_deeplink: `doubtnutapp://video?qid=${question.question_id}&page=HOMEWORK_SOLUTION`,
                subject: question.subject,
                chapter: question.chapter,
                options: this.getOptionsArray(question),
                answer: question.answer.toUpperCase(),
                solutions_playlist_id: 453978,
                message: this.message,
                type: '0',
            }));
            data.subject = questionData[0].subject;
            data.chapter = questionData[0].chapter;
            data.rules_info = this.locale === 'hi' ? practiceCornerData.widgetIdRulesMapping[widgetId].hi : practiceCornerData.widgetIdRulesMapping[widgetId].en;

            if (widgetId === 2) {
                practiceCornerRedis.setRecentTopics(this.db.redis.write, this.student_class, this.student_id, chapterAlias);
            }

            data.button = {
                title: this.locale === 'hi' ? practiceCornerData.submitTestTitle.hi : practiceCornerData.submitTestTitle.en,
                deeplink: null,
                next_text: 'Next Question',
                previous_text: 'Previous',
            };
            data.questions = responseFormat;
            return data;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }

            logger.error({ tag: 'PracticeCornerHelper', source: 'questions', error: errorLog });
            throw (e);
        }
    }

    async subjectTabs() {
        try {
            let { widget_id: widgetId } = this.req.body;
            widgetId = parseInt(widgetId);

            let tabsArray = practiceCornerData.defaultTab; // default tab used when test is other than short test
            let hasTabs = false;
            const title = this.locale === 'hi' ? practiceCornerData.widgetIdTopicMapping[widgetId].hi : practiceCornerData.widgetIdTopicMapping[widgetId].en;

            if (widgetId === 2) {
                // short test
                hasTabs = true;
                const distinctSubjects = await this.mongoClient.read.collection(this.practiceCornerResult).distinct('subject', {
                    student_id: this.student_id,
                    type: widgetId,
                });
                tabsArray = _.map(distinctSubjects, (res) => (this.locale === 'hi' ? practiceCornerData.tabTitleMapping.hi[res] : practiceCornerData.tabTitleMapping.en[res]));
            }
            const activeTabId = tabsArray[0].id;
            return {
                title,
                has_tabs: hasTabs,
                tabs: tabsArray,
                active_tab: activeTabId,
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'TestHistoryTab', error: errorLog });
            throw (e);
        }
    }

    async history() {
        try {
            let { tab_id: tabId, widget_id: widgetId, page } = this.req.body;
            const start = page * QUIZ_HISTORY_PAGINATED_LIMIT;

            tabId = parseInt(tabId);
            widgetId = parseInt(widgetId);
            page = parseInt(page);

            const finalData = {};
            let practiceCornerResults;

            // id = 1 (Biology) | id = 2 (Chemistry)| id = 3 (Physics)| id = 4 (Maths)
            if (widgetId === 2) {
                const subject = practiceCornerData.tabSubjectMapping[tabId];
                practiceCornerResults = await this.getTestsData(start, QUIZ_HISTORY_PAGINATED_LIMIT, widgetId, subject);
            } else {
                practiceCornerResults = await this.getTestsData(start, QUIZ_HISTORY_PAGINATED_LIMIT, widgetId);
            }

            let obj = {};
            const activeResult = [];
            let solutionButtonText = this.locale === 'hi' ? practiceCornerData.solutionButton.hi.title : practiceCornerData.solutionButton.en.watchTitle;

            if (widgetId === 3 || widgetId === 4) {
                solutionButtonText = this.locale === 'hi' ? practiceCornerData.solutionButton.hi.title : practiceCornerData.solutionButton.en.viewTitle;
            }

            _.map(practiceCornerResults, (test, i) => {
                let marksPrefix;
                const createdAt = moment(test.created_at).format('DD-MM-YYYY');
                const suffix = this.ordinalSuffixOf(i + 1);
                // for getting suffix of numbers i.e 0th,1st,2nd
                if (widgetId === 1 || widgetId === 4) {
                    // for daily practice and aptitude test we will show accuracy
                    marksPrefix = this.locale === 'hi' ? practiceCornerData.accuracy.hi : practiceCornerData.accuracy.en;
                } else if (widgetId === 2 || widgetId === 3) {
                    // for short and full tests we will show marks
                    marksPrefix = this.locale === 'hi' ? practiceCornerData.marks.hi : practiceCornerData.marks.en;
                }
                obj = {
                    time: `${suffix} Attempt - ${createdAt}`,
                    marks: `${marksPrefix}: ${test.score}/${test.total_marks}`,
                    result_id: test._id,
                    topic: widgetId === 3 ? test.exam_title : test.chapter,
                    cta_text: solutionButtonText,
                    deeplink: widgetId === 3 ? `doubtnutapp://mock_test_subscribe?id=${test.test_id}&rule_id=131&source=revision_corner` : `doubtnutapp://revision_corner/short_test_solution?result_id=${test._id}&widget_id=${widgetId}`,
                };
                activeResult.push(obj);
            });
            finalData.results = activeResult;
            if (practiceCornerResults.length < QUIZ_HISTORY_PAGINATED_LIMIT || practiceCornerResults.length === 0) {
                page = null;
            } else {
                page++;
            }
            finalData.next_page = page + 1;
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'history', error: errorLog });
            throw (e);
        }
    }

    async getRecentTopics(count) {
        const recentTopics = await practiceCornerRedis.getRecentTopics(this.db.redis.read, this.student_class, this.student_id);
        return _.uniq(recentTopics).slice(0, count);
    }

    async topics() {
        try {
            const { subject } = this.req.body;
            const topics = [];
            const data = await this.mongoClient.read.collection(this.availableChapterCollection).find({ subject: subject.toUpperCase().trim(), class: this.student_class, total: { $gte: 10 } }).toArray();
            for (let i = 0; i < data.length; i++) {
                if (!_.isEmpty(data[i].chapter)) {
                    topics.push(data[i].chapter);
                }
            }
            let isRecentAvailable = true;
            // fetched unique topics from redis of length count
            const recentTopics = _.map(await this.getRecentTopics(5), (item) => ({
                title: item,
                chapter_alias: item,
            }));
            if (_.isEmpty(recentTopics)) {
                isRecentAvailable = false;
            }
            const recentTitle = this.locale === 'hi' ? practiceCornerData.recentTopicTitle.hi : practiceCornerData.recentTopicTitle.en;
            const recentContainer = { recent_title: recentTitle, recent_topics: recentTopics };
            const heading = this.locale === 'hi' ? practiceCornerData.subjectSelection.heading.hi : practiceCornerData.subjectSelection.heading.en;
            const randomOpponent = this.locale === 'hi' ? practiceCornerData.randomChapter.hi : practiceCornerData.randomChapter.en;
            const selectChapters = this.locale === 'hi' ? practiceCornerData.subjectSelection.selectChapters.hi : practiceCornerData.subjectSelection.selectChapters.en;
            const description = this.locale === 'hi' ? practiceCornerData.subjectSelection.description.hi : practiceCornerData.subjectSelection.description.en;
            const searchPlaceholder = this.locale === 'hi' ? practiceCornerData.subjectSelection.searchPlaceholder.hi : practiceCornerData.subjectSelection.searchPlaceholder.en;
            const chooseSubject = this.locale === 'hi' ? practiceCornerData.subjectSelection.chooseSubject.hi : practiceCornerData.subjectSelection.chooseSubject.hien;
            const selectChapterForGame = this.locale === 'hi' ? practiceCornerData.selectChapterForGame.hi : practiceCornerData.selectChapterForGame.en;
            const previousCta = this.locale === 'hi' ? practiceCornerData.prev.hi : practiceCornerData.prev.en;
            const nextCta = this.locale === 'hi' ? practiceCornerData.next.hi : practiceCornerData.next.en;
            const { nextCtaDeeplink } = practiceCornerData;
            return {
                topics,
                random_topic: _.sample(topics),
                is_recent_available: isRecentAvailable,
                recent_container: recentContainer,
                subjects: this.locale === 'hi' ? practiceCornerData.subjects.hi : practiceCornerData.subjects.en,
                content: {
                    heading,
                    description,
                    random_opponent: randomOpponent,
                    select_chapters: selectChapters,
                    choose_subject: chooseSubject,
                    select_chapter_for_game: selectChapterForGame,
                    search_placeholder: searchPlaceholder,
                    previous_cta: previousCta,
                    next_cta: nextCta,
                    next_cta_deeplink: nextCtaDeeplink,
                    widget_id: 2,
                },
            };
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'topics', error: errorLog });
            throw (e);
        }
    }

    async submitStats() {
        // for storing full length Tests data separately
        try {
            const {
                test_id: testId, total_score: totalscore, total_marks: totalmarks, exam_type: examType,
            } = this.req.body;
            const testTitleData = _.filter(practiceCornerData.testId[examType], { test_id: testId });
            if (testTitleData.length) {
                this.mongoClient.write.collection(this.practiceCornerResult).insertOne({
                    type: 3,
                    test_id: parseInt(testId),
                    student_id: this.student_id,
                    total_marks: parseInt(totalmarks),
                    score: parseInt(totalscore),
                    exam_type: examType,
                    exam_title: testTitleData[0].title,
                    created_at: this.currentDate,
                });
            } else {
                this.message = 'Invalid test id mapping';
            }
            return {
                message: this.message,
            };
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    removeIdFromArray(idArray, testId) {
        const res = _.filter(idArray, (item) => item.test_id !== testId);
        return res;
    }

    async fullLengthTestHistory() {
        try {
            const { exam_type: examType } = this.req.body;
            let { page } = this.req.body;

            // for pagination setting start limit and end limit of data to be shown
            const start = page * QUIZ_HISTORY_PAGINATED_LIMIT;
            const limit = 10;
            const finalData = {};

            finalData.test_meta_data = {
                title: this.locale === 'hi' ? practiceCornerData.fullLengthExamNameMapping.hi[examType].subtitle : practiceCornerData.fullLengthExamNameMapping.en[examType].subtitle,
            };
            // fetching only the required number of ids
            let examName = examType.replace(/[^a-zA-Z]/g, '');
            examName = practiceCornerData.category[examName];
            let examIds = await practiceCornerMySql.getTestsbyExam(this.db.mysql.read, examName, this.student_class, start, limit);
            const onlyExamIds = [];
            for (let i = 0; i < examIds.length; i++) {
                onlyExamIds.push(examIds[i].test_id);
            }

            // fetching exam results on basis of testId and student id
            let examResults = await this.mongoClient.read.collection(this.practiceCornerResult).find({ student_id: this.student_id, test_id: { $in: onlyExamIds } }).toArray();
            examResults = _.uniq(examResults);
            const test = [];
            let obj = {};

            _.map(examResults, (exam) => {
                // making response for attempted full length tests
                obj = {
                    heading: exam.exam_title,
                    subheading: 'Attempted',
                    subheading_color: '#097209',
                    deeplink: `doubtnutapp://mock_test_subscribe?id=${exam.test_id}&rule_id=131&source=revision_corner&exam_type=${examType}`,
                };
                test.push(obj);
                examIds = this.removeIdFromArray(examIds, exam.test_id);
            });

            if (examIds.length > 0) {
                for (let i = 0; i < examIds.length; i++) {
                    // making response for Unattempted full length tests
                    obj = {
                        heading: examIds[i].title,
                        subheading: 'Unattempted',
                        subheading_color: '#2f2f2f',
                        deeplink: `doubtnutapp://mock_test_subscribe?id=${examIds[i].test_id}&rule_id=131&source=revision_corner&exam_type=${examType}`,
                    };
                    test.push(obj);
                }
            }

            finalData.tests = test;
            if (examIds.length < QUIZ_HISTORY_PAGINATED_LIMIT || examIds.length === 0) {
                page = null;
            } else {
                page++;
            }

            finalData.page = page;
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'topics', error: errorLog });
            throw (e);
        }
    }

    async fullLengthTestHistoryV2() {
        try {
            const { exam_type: examType, tabId } = this.req.body;
            let { page } = this.req.body;

            // for pagination setting start limit and end limit of data to be shown
            const start = page * QUIZ_HISTORY_PAGINATED_LIMIT;
            const limit = 10;
            const finalData = {};

            finalData.test_meta_data = {
                title: this.locale === 'hi' ? practiceCornerData.fullLengthExamNameMapping.hi[examType].subtitle : practiceCornerData.fullLengthExamNameMapping.en[examType].subtitle,
            };
            finalData.widgets = [];
            if (page == 0) {
                finalData.widgets.push({
                    type: 'widgets_two_texts_vertical_tabs',
                    is_sticky: true,
                    data: { items: [{ title_one: this.locale === 'hi' ? 'पिछले साल के पेपर' : 'Previous Year Papers', id: 'pdf', is_selected: (tabId == 'pdf') }, { title_one: this.locale === 'hi' ? 'टेस्ट पेपर्स' : 'Test Papers', id: 'test', is_selected: (tabId == 'test' || _.isUndefined(tabId) || (tabId == '')) }] },
                });
            }
            const testTest = [];
            const testPrevious = [];
            let examName;
            examName = examType.replace(/[^a-zA-Z]/g, '');
            examName = practiceCornerData.category[examName];
            let examIds = await practiceCornerMySql.getTestsbyExam(this.db.mysql.read, examName, this.student_class, start, limit);
            if (tabId == 'test' || _.isUndefined(tabId) || (tabId == '')) {
                // fetching only the required number of ids
                const onlyExamIds = [];
                for (let i = 0; i < examIds.length; i++) {
                    onlyExamIds.push(examIds[i].test_id);
                }

                // fetching exam results on basis of testId and student id
                let examResults = await this.mongoClient.read.collection(this.practiceCornerResult).find({ student_id: this.student_id, test_id: { $in: onlyExamIds } }).toArray();
                examResults = _.uniq(examResults);
                let obj = {};

                _.map(examResults, (exam) => {
                    // making response for attempted full length tests
                    obj = {
                        heading: exam.exam_title,
                        subheading: 'Attempted',
                        subheading_color: '#097209',
                        deeplink: `doubtnutapp://mock_test_subscribe?id=${exam.test_id}&rule_id=131&source=revision_corner&exam_type=${examType}`,
                    };
                    testTest.push(obj);
                    examIds = this.removeIdFromArray(examIds, exam.test_id);
                });

                if (examIds.length > 0) {
                    for (let i = 0; i < examIds.length; i++) {
                        // making response for Unattempted full length tests
                        obj = {
                            type: 'widget_rc_test_paper',
                            data: {
                                heading: examIds[i].title,
                                subheading: 'Unattempted',
                                subheading_color: '#2f2f2f',
                                deeplink: `doubtnutapp://mock_test_subscribe?id=${examIds[i].test_id}&rule_id=131&source=revision_corner&exam_type=${examType}`,
                            },
                        };
                        testTest.push(obj);
                    }
                }
                finalData.widgets.push({ type: 'widget_vertical_parent', data: { items: testTest } });
            }
            if (tabId == 'pdf') {
                examName = examType.replace(/[^a-zA-Z]/g, '');
                examName = practiceCornerData.stateBoard[examName];
                const previousPapers = await practiceCornerMySql.getPreviousPapers(this.db.mysql.read, examName, start, limit);
                let obj;
                for (let i = 0; i < previousPapers.length; i++) {
                    obj = {
                        type: 'widget_rc_previous_year_paper',
                        data: {
                            deeplink: `doubtnutapp://pdf_viewer?pdf_url=${previousPapers[i].pdf_url}`,
                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8996FC65-ABB9-69C8-C681-46CE64A1C5DE.webp',
                            description: `Previous Year Papers | ${previousPapers[i].state_board} ${previousPapers[i].year_chapter}`,
                            title: `${previousPapers[i].subject} | ${previousPapers[i].state_board} | Previous Year Papers | ${previousPapers[i].state_board} ${previousPapers[i].year_chapter}`,
                        },
                    };
                    testPrevious.push(obj);
                }
                finalData.widgets.push({ type: 'widget_vertical_parent', data: { items: testPrevious } });
            }

            if ((examIds.length < QUIZ_HISTORY_PAGINATED_LIMIT || examIds.length === 0) || (testPrevious.length > 0 && testPrevious < QUIZ_HISTORY_PAGINATED_LIMIT)) {
                page = null;
            } else {
                page++;
            }

            finalData.page = page;
            return finalData;
        } catch (e) {
            console.error(e);
            let errorLog = e;
            if (!_.isObject(errorLog)) {
                errorLog = JSON.stringify(errorLog);
            }
            logger.error({ tag: 'PracticeCornerHelper', source: 'topics', error: errorLog });
            throw (e);
        }
    }

    async getFreeClassCarousel(priority = null) {
        if (this.req.headers.version_code >= 922) {
            // const studentCourse = await practiceCornerMySql.getStudentCourse(this.db.mysql.read, this.student_id);
            // const ccmIdList = [];
            // studentCourse.forEach((element) => {
            //    ccmIdList.push(element.id);
            // });
            const popularCourses = await teslaHelper.getTopVideosBySubject(this.db, this.student_id, this.student_class || 12, this.locale || 'en', [], this.req.headers.version_code, 'REVISION_CORNER');
            if (!_.isNull(popularCourses)) {
                for (let i = 0; i < popularCourses[0].widget_data.actions.length; i++) {
                    popularCourses[0].widget_data.actions[i].text_one = 'View all free classes >';
                }
            }
            if (!popularCourses) {
                let popularCourseItems = await CourseHelper.getPaidAssortmentsData({
                    db: this.db,
                    studentClass: this.student_class,
                    config: this.config,
                    versionCode: this.req.headers.version_code,
                    studentId: parseInt(this.student_id),
                    studentLocale: this.locale,
                    xAuthToken: this.req.headers['x-auth-token'],
                    page: 'SHORTTEST_RESULT',
                    eventPage: 'SHORTTEST_RESULT',
                    pznElasticSearchInstance: this.req.app.get('pznElasticSearchInstance'),
                });
                popularCourseItems = popularCourseItems && popularCourseItems.items ? popularCourseItems.items : [];
                if (popularCourseItems.length) {
                    return {
                        widget_type: 'widget_parent',
                        priority,
                        widget_data: {
                            title: this.req.user.locale === 'hi' ? 'लोकप्रिय कोर्सेस' : 'Popular Courses',
                            link_text: '',
                            deeplink: '',
                            items: popularCourseItems,
                        },
                        layout_config: {
                            margin_top: 16,
                            bg_color: '#ffffff',
                        },
                        extra_params: { source: 'SHORTTEST_RESULT' },
                    };
                }
                return false;
            }
            popularCourses[0].priority = priority;
            popularCourses[0].extra_params = { source: 'SHORTTEST_RESULT' };
            return popularCourses[0];
        }
        return false;
    }

    async getStatusBanner(score, deeplink) {
        let imageUrl = `${this.config.staticCDN}engagement_framework/E89C8A48-12F2-9028-5C39-BA948310401A.webp`;
        let backgroundColor = '#FFD5C0';
        let title = this.locale == 'hi' ? '<b>अरे नहीं! आपको अभ्यास की जरूरत है</b><br>फ्री क्लासेस देखें और इस विषय को परीक्षा के लिए तैयार करें' : '<b>Oops! you need to practice</b><br>Watch <font color=\'#FF0000\'>Free Classes</font> & prepare this topic for exams';
        if (score) {
            imageUrl = `${this.config.staticCDN}engagement_framework/76F05DF4-1658-3D1B-B604-0DE678A32B99.webp`;
            backgroundColor = '#E3F1DC';
            title = this.locale == 'hi' ? '<b>अरे वाह! आपने अच्छा किया</b><br>फ्री क्लासेस देखें और अपनी तैयारी को मजबूत करें' : '<b>Hurray! you did a great job</b><br>Watch <font color=\'#008000\'>Free Classes</font> & strengthen your preparation';
        }

        const cardData = {
            widget_type: 'widget_dnr_home',
            widget_data: {
                title_line_1: title,
                title_color: '#000000',
                // eslint-disable-next-line no-undef
                cta: this.locale === 'hi' ? 'सभी देखें' : 'View all',
                cta_color: '#eb532c',
                coin_image_url: imageUrl,
                deeplink,
                background_color: backgroundColor,
            },
            layout_config: {
                margin_top: 12,
                margin_bottom: 0,
                margin_left: 12,
                margin_right: 12,
            },
        };
        return cardData;
    }
}

module.exports = PracticeCornerManager;
