/* eslint-disable no-await-in-loop */
/* eslint-disable no-use-before-define */
/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last modified by:   xesloohc
* @Last modified time: 2019-08-06T01:45:52+05:30
*/

const _ = require('lodash');
const moment = require('moment');
const TestSeries = require('../../../modules/mysql/testseries');
const TestSections = require('../../../modules/mysql/testsections');
const TestQuestions = require('../../../modules/mysql/testquestions');
const Rules = require('../../../modules/mysql/rules');
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions');
const StudentTestResponse = require('../../../modules/mysql/studenttestresponse');
// const Notification = require('../../../modules/notifications');
const Utility = require('../../../modules/utility');
const coursev2 = require('../../../modules/mysql/coursev2');
const RankCalculator = require('../../helpers/rankcalculator');
const CourseHelper = require('../../helpers/course');
const newtonNotifications = require('../../../modules/newtonNotifications');
// const CourseContainerV2 = require('../../../modules/containers/coursev2');
const RedisCourseV2 = require('../../../modules/redis/coursev2');
const { updateCountInLeaderboard } = require('../../helpers/paidUserChamionship');
const CourseMysqlv2 = require('../../../modules/mysql/coursev2');
const staticData = require('../../../data/liveclass.data');
const CourseContainer = require('../../../modules/containers/coursev2');
const WidgetHelper = require('../../widgets/liveclass');

let db; let config;

async function getTestSeries(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        // console.log("line 35", student_id);
        const { page } = req.query;
        const { version_code: versionCode } = req.headers;
        const limit = 10;
        const { filter } = req.params;
        const { student_class } = req.user;
        let testSeriesData = [];
        if (filter === 'all') {
            testSeriesData = TestSeries.getAll(db.mysql.read, student_class);
        } else if (filter === 'upcoming') {
            testSeriesData = TestSeries.getUpcoming(db.mysql.read, student_class);
        } else if (filter === 'active') {
            const type = 'QUIZ';
            testSeriesData = TestSeries.getActiveByAppModuleNew(db.mysql.read, student_class, type, limit, page);
        } else {
            const type = ['TEST', 'TEST1','DNST'];

            if(versionCode < 943){
                testSeriesData = TestSeries.getActiveByAppModuleWithMatrixPaid(db.mysql.read, student_class, type, studentId);
            }else{
                testSeriesData = TestSeries.getActiveByAppModuleWithMatrixPaidByCourse(db.mysql.read, student_class, type, studentId);

            }
        }

        let student_subscription_data = StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentId(db.mysql.read, studentId);
        const choke_var = await db.redis.read.getAsync(`live_test1_choke_${req.user.student_id}`);
        testSeriesData = await testSeriesData;
        student_subscription_data = await student_subscription_data;
        // [testSeriesData,student_subscription_data] = await Promise.all([testSeriesData,StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentId(db.mysql.read,studentId)]);
        const data = filter === 'active_mock_test' && versionCode >= 943 ? activeMockTestFormatter(testSeriesData) : testSeriesArrayResponseFormatter(testSeriesData, student_subscription_data, filter, choke_var, config.staticCDN);
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            // eslint-disable-next-line no-use-before-define
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
async function getTestsForCourse(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { course } = req.params;
        const studentId = req.user.student_id;
        const studentClass = req.user.student_class;

        const subscribedTestSeriesData = await TestSeries.getSubscribedTestsForCourse(db.mysql.read, course, studentId);
        const groupedSubscribedTestData = _.groupBy(subscribedTestSeriesData, 'test_id');

        const unsubscribedAvailableTestSeriesData = await TestSeries.getUnsubscribedAvailableTestsForCourse(db.mysql.read, course, studentClass);
        const unsubscribedAvailableTestSeriesDataGrouped = _.groupBy(unsubscribedAvailableTestSeriesData, 'test_id');
        const unsubscribedTestIds = _.keys(unsubscribedAvailableTestSeriesDataGrouped);
        const unsubscribedPaidAvailableTestSeriesData = unsubscribedTestIds.length ? await TestSeries.getUnsubscribedPaidAvailableTestsIfSubForCourse(db.mysql.read, course, unsubscribedTestIds, studentId, studentClass)
            : await TestSeries.getUnsubscribedPaidAvailableTestsForCourse(db.mysql.read, course, studentId, studentClass);
        const testSeriesData = _.concat(unsubscribedAvailableTestSeriesData, unsubscribedPaidAvailableTestSeriesData);
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            // eslint-disable-next-line no-use-before-define
            data: activeMockTestListFormatter(testSeriesData, course, groupedSubscribedTestData),
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getRulesById(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const { ruleId } = req.params;

        const ruleData = await Rules.getRulesById(db.mysql.read, ruleId);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            // eslint-disable-next-line no-use-before-define
            data: ruleDataResponseFormatter(ruleData),
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
async function subscibeUserForTest(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const classCode = req.user.student_class;
        const { testId } = req.params;
        const subscriptionData = await TestSeries.getTestSubscriptionByStatusAndStudentIdAndTestId(db.mysql.write, testId, studentId, 'SUBSCRIBED');
        let subscriptionInsertData;
        let data;
        if (subscriptionData.length > 0) {
            data = { test_subscription_id: subscriptionData[0].id };
        } else {
            const insertObj = {
                student_id: studentId, test_id: testId, class_code: classCode, status: 'SUBSCRIBED',
            };
            subscriptionInsertData = await TestSeries.insertStudentSubscription(db.mysql.write, insertObj);
            data = { test_subscription_id: subscriptionInsertData.insertId };
        }

        const responseData = {
            meta:
            {
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
async function getQuestionsByTestWithData(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { testId } = req.params;
        const isTestStarted = await TestSeries.isTestStarted(db.mysql.read, testId);
        if (isTestStarted) {
            const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, testId);
            const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
            const questionOptionData = await TestQuestions.getAllOptionsByQuestionIdsWithoutIsAnswer(db.mysql.read, questionBankKeysString);
            const questionOptionDataGrouped = _.groupBy(questionOptionData, 'questionbank_id');
            const responseData = {
                meta:
                {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: testQuestionsWithDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped),
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta:
                {
                    code: 400,
                    success: false,
                    message: 'Test Not Started Yet',
                },
                data: [],
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}
async function getQuestionsByTestSectionsWithData(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { testId } = req.params;
        const testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, testId);

        const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, testId);
        const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
        const questionOptionData = await TestQuestions.getAllOptionsByQuestionIdsWithoutIsAnswer(db.mysql.read, questionBankKeysString);
        const questionOptionDataGrouped = _.groupBy(questionOptionData, 'questionbank_id');
        const formatedData = testQuestionsWithSectionsDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped, testSections);
        const groupedformatedData = _.groupBy(formatedData, 'section_code');
        let questionsOrderBySections = [];
        const sectionMeta = _.map(testSections, (section) => {
            // console.log(section)
            // console.log(groupedformatedData[section.section_code])
            section.startingIndex = questionsOrderBySections.length;
            section.endingIndex = groupedformatedData[section.section_code].length - 1;
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code]);
            return section;
        });
        const data = { questions: questionsOrderBySections, sections: sectionMeta };
        const responseData = {
            meta:
            {
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
async function inProgressStudentResponse(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const test_subscription_id = req.params.testsubscriptionId;
        const inProgressResponse = await StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.write, test_subscription_id);
        const test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        // console.log(test_subscriptionData)
        const groupedInprogressData = _.groupBy(inProgressResponse, 'questionbank_id');
        const test_questions = await TestQuestions.getAllTestQuestionsByTestId(db.mysql.read, test_subscriptionData[0].test_id);
        const testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, test_subscriptionData[0].test_id);
        const formatedData = _.map(test_questions, (question) => {
            // console.log(groupedInprogressData[question.questionbank_id])
            const questiontype = {
                questionbank_id: question.questionbank_id,
                section_code: question.section_code,
            };
            if (groupedInprogressData[question.questionbank_id]) {
                questiontype.option_codes = groupedInprogressData[question.questionbank_id][0].option_codes;
                questiontype.action_type = groupedInprogressData[question.questionbank_id][0].action_type;
            } else {
                questiontype.option_codes = '';
                questiontype.action_type = 'SKIP';
            }
            return questiontype;
        });
        const groupedformatedData = _.groupBy(formatedData, 'section_code');
        let questionsOrderBySections = [];
        const sectionMeta = _.map(testSections, (section) => {
            // console.log(section)
            // console.log(groupedformatedData[section.section_code])
            section.startingIndex = questionsOrderBySections.length;
            section.endingIndex = groupedformatedData[section.section_code].length - 1;
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code]);
            return section;
        });
        const testData = { questions: questionsOrderBySections, sections: sectionMeta };

        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: testData,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
async function saveStudentResponse(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        // console.log(req.body);
        const { student_id } = req.user;
        const { test_id } = req.body;
        const { questionbank_id } = req.body;
        const { action_type } = req.body;
        const { review_status } = req.body;
        const option_codes = req.body.option_code;
        const { section_code } = req.body;
        const { test_subscription_id } = req.body;
        const { question_type } = req.body;
        const { is_eligible } = req.body;
        const { time_taken } = req.body;
        const responseExist = await StudentTestResponse.getStudentResponse(db.mysql.write, test_subscription_id, questionbank_id);
        const insertObj = {
            student_id,
            test_subscription_id,
            test_id,
            questionbank_id,
            question_type,
            action_type,
            review_status,
            option_codes,
            section_code,
            is_eligible,
            time_taken,
        };
        if (responseExist.length > 0) {
            const updateobj = {
                student_id,
                test_subscription_id,
                test_id,
                questionbank_id,
                question_type,
                action_type,
                review_status,
                option_codes,
                section_code,
                is_eligible,
                time_taken,
            };
            await StudentTestResponse.updateStudentResponse(db.mysql.write, updateobj);
        } else {
            await StudentTestResponse.saveStudentResponse(db.mysql.write, insertObj);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function submitTest(req, res, next) {
    try {
        // THIS GOT COMPLICATED WITH TIME AND ITERATION PING ME @ god@xesloohc.com or 9535037239 if needed KT
        db = req.app.get('db');
        config = req.app.get('config');
        const sqs = req.app.get('sqs');
        const studentId = req.user.student_id;
        let { locale } = req.user;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        let totalscore = 0;
        let totalmarks = 0;
        const correct = [];
        const incorrect = [];
        const skipped = [];
        let eligiblescore = 0;
        const test_subscription_id = req.params.testsubscriptionId;
        let test_subscriptionData = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let student_test_responses = StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.read, test_subscription_id);
        test_subscriptionData = await test_subscriptionData;
        if (test_subscriptionData.length == 0) {
            test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        student_test_responses = await student_test_responses;
        // [test_subscriptionData,student_test_responses] = await Promise.all([test_subscriptionData,student_test_responses])
        const test_questions = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscriptionData[0].test_id);
        if (test_subscriptionData[0].status !== 'COMPLETED') {
            StudentTestsSubsriptions.updateCompleteTime(db.mysql.write, test_subscription_id, studentId);
            const groupedTestQuestions = _.groupBy(test_questions, 'questionbank_id');
            const groupedSTR = _.groupBy(student_test_responses, 'questionbank_id');
            const questionbankIdsStringKey = _.join(_.keys(groupedTestQuestions), ',');
            const testCorrectOptions = await TestQuestions.getAllCorrectOptionsByQuestionIds(db.mysql.read, questionbankIdsStringKey);
            const testCorrectOptionsGrouped = _.groupBy(testCorrectOptions, 'questionbank_id');
            const resultInstObj = [];
            const { student_class } = req.query;
            const studentClass = (typeof student_class === 'undefined') ? req.user.student_class : student_class;
            for (let i = test_questions.length - 1; i >= 0; i--) {
                const resultIns = [
                    test_subscriptionData[0].student_id,
                    test_subscriptionData[0].test_id,
                    test_subscriptionData[0].id,
                    test_questions[i].questionbank_id,
                    test_questions[i].section_code,
                    test_questions[i].subject_code,
                    test_questions[i].chapter_code,
                    test_questions[i].subtopic_code,
                    test_questions[i].mc_code,
                    test_questions[i].correct_reward,
                ];
                const questionCorrectOptions = testCorrectOptionsGrouped[test_questions[i].questionbank_id];
                const questionCorrectOptionsArray = _.keys(_.groupBy(questionCorrectOptions, 'option_code'));
                const questionCorrectOptionsString = _.join(questionCorrectOptionsArray, ',');
                resultIns.push(questionCorrectOptionsString);
                let is_correct = true;
                let is_nagative = false;
                let is_skipped = true;
                let is_eligible;
                let correctrows = 0;
                let incorrectrows = 0;
                const rows = [];
                const rowOptions = [];
                const responserows = [];
                const resposerowOptions = [];
                const questionbankId = test_questions[i].questionbank_id;
                if (test_questions[i].type == 'MATRIX') {
                    _.map(questionCorrectOptions, (value) => {
                        const row = _.split(value.title, '_')[0];
                        if (!_.includes(rows, row)) {
                            rows.push(row);
                            rowOptions[row] = [value.option_code];
                        } else {
                            rowOptions[row].push(value.option_code);
                        }
                    });
                    resultIns[9] = test_questions[i].correct_reward * rows.length;
                }

                if (groupedSTR[questionbankId]) {
                    const studentResponse = groupedSTR[questionbankId][0];
                    resultIns.push(studentResponse.option_codes);
                    is_eligible = studentResponse.is_eligible;
                    const responseOptions = _.split(studentResponse.option_codes, ',');
                    if (studentResponse.option_codes !== '' && studentResponse.option_codes !== null && responseOptions.length > 0) {
                        is_skipped = false;
                        if (studentResponse.question_type == 'SINGLE' || studentResponse.question_type == 'MULTI') {
                            if (responseOptions.length == questionCorrectOptionsArray.length) {
                                _.forEach(responseOptions, (userResponse) => {
                                    if (!_.includes(questionCorrectOptionsArray, _.trim(userResponse))) {
                                        is_correct = false;
                                        is_nagative = true;
                                    }
                                });
                            } else {
                                is_correct = false;
                                is_nagative = true;
                            }
                        } else if (studentResponse.question_type == 'TEXT') {
                            // TREATING OPTION CODE AS TEXT ANSWER
                            if (responseOptions.length > 0) {
                                if (responseOptions[0] !== questionCorrectOptions[0].answer) {
                                    is_correct = false;
                                    is_nagative = true;
                                    is_skipped = false;
                                } else {
                                    is_correct = true;
                                    is_skipped = false;
                                    is_nagative = false;
                                }
                            } else {
                                is_correct = false;
                                is_nagative = false;
                                is_skipped = true;
                            }
                        } else if (studentResponse.question_type == 'MATRIX') {
                            _.map(responseOptions, (value) => {
                                const row = _.split(value, '_')[0];
                                if (!_.includes(responserows, row)) {
                                    responserows.push(row);
                                    resposerowOptions[row] = [value];
                                } else {
                                    resposerowOptions[row].push(value);
                                }
                            });
                            _.forEach(rows, (row1) => {
                                if (resposerowOptions[row1]) {
                                    if (_.isEqual(resposerowOptions[row1].sort(), rowOptions[row1].sort())) {
                                        correctrows++;
                                    } else {
                                        incorrectrows++;
                                    }
                                }
                            });
                            if (correctrows) {
                                is_correct = true;
                                is_nagative = false;
                            }
                            if (!correctrows && incorrectrows) {
                                is_nagative = true;
                                is_correct = false;
                            }
                            if (!correctrows && !incorrectrows) {
                                is_skipped = true;
                                is_nagative = false;
                                is_correct = false;
                            }

                            // console.log("GOD")
                            // console.log(correctrows)
                            // console.log(incorrectrows)
                        }
                    } else {
                        is_correct = false;
                    }
                } else {
                    resultIns.push('');
                    is_correct = false;
                }

                if (is_correct) {
                    correct.push(test_questions[i].questionbank_id);
                    if (groupedSTR[questionbankId][0].question_type == 'MATRIX') {
                        const matrixscore = test_questions[i].correct_reward * correctrows;
                        const matrixscore1 = test_questions[i].incorrect_reward * incorrectrows;
                        const matrixtotalscore = matrixscore + matrixscore1;
                        // console.log(matrixtotalscore)
                        if (is_eligible) {
                            eligiblescore += matrixtotalscore;
                        }
                        resultIns.push(matrixtotalscore);
                        totalscore += matrixtotalscore;
                    } else {
                        if (is_eligible) {
                            eligiblescore += test_questions[i].correct_reward;
                        }
                        resultIns.push(test_questions[i].correct_reward);
                        totalscore += test_questions[i].correct_reward;
                    }
                } else if (is_nagative) {
                    incorrect.push(test_questions[i].questionbank_id);

                    if (groupedSTR[questionbankId][0].question_type == 'MATRIX') {
                        // console.log(test_questions[i]['incorrect_reward'])
                        const matrixscore1 = test_questions[i].incorrect_reward * incorrectrows;

                        resultIns.push(matrixscore1);
                        totalscore += matrixscore1;
                        if (is_eligible) {
                            eligiblescore += matrixscore1;
                        }
                        // console.log(matrixscore1)
                    } else {
                        resultIns.push(test_questions[i].incorrect_reward);
                        totalscore += test_questions[i].incorrect_reward;
                        if (is_eligible) {
                            eligiblescore += test_questions[i].incorrect_reward;
                        }
                    }
                } else {
                    skipped.push(test_questions[i].questionbank_id);
                    const skippedreward = 0;
                    resultIns.push(skippedreward);
                }
                // console.log(is_correct)
                resultIns.push(is_correct);
                resultIns.push(is_skipped);
                resultInstObj.push(resultIns);
                totalmarks += resultIns[9];
            }
            // eslint-disable-next-line no-unused-vars
            let resultCreated = TestQuestions.insertResult(db.mysql.write, resultInstObj);
            const studentreportcardData = {
                student_id: test_subscriptionData[0].student_id,
                test_id: test_subscriptionData[0].test_id,
                test_subscription_id: test_subscriptionData[0].id,
                totalscore,
                totalmarks,
                correct: _.join(correct, ','),
                incorrect: _.join(incorrect, ','),
                skipped: _.join(skipped, ','),
                eligiblescore,
            };
            // eslint-disable-next-line no-unused-vars
            let saveReportcard = TestSeries.saveReportcard(db.mysql.write, studentreportcardData);
            resultCreated = await resultCreated;
            saveReportcard = await saveReportcard;
            await TestSeries.updateTestSubscriptionStatus(db.mysql.write, test_subscriptionData[0].id, 'COMPLETED');
            const rankMessage = RankCalculator.rank(test_subscriptionData[0].test_id, totalscore, totalmarks);
            if (rankMessage) {
                Utility.sendFcm(studentId, req.user.gcm_reg_id, rankMessage, 'Silent', null, db);
            }
            const dataTest = await coursev2.getScholarshipMatch(db.mysql.read, test_subscriptionData[0].test_id);
            if (dataTest && dataTest.length) {
                const timeText = moment(dataTest[0].result_time).format("h:mm A, Do MMM'YY");
                let msg = (locale === 'hi') ? `परिणाम का समय - ${timeText}` : `Result time - ${timeText}`;
                let head;
                if (dataTest[0].type.includes('TALENT')) {
                    head = (locale === 'hi') ? `आपने ${dataTest[0].test_name} Doubtnut Super 100 परीक्षा सफलतापूर्वक पूरी कर ली है` : `Aapne ${dataTest[0].test_name} Doubtnut Super 100 test successfully complete kar liya hai.`;
                } else if (dataTest[0].type.includes('NKC')) {
                    head = `You have Successfully completed the ${dataTest[0].test_name} Scholarship Test.`;
                    msg = `Result time - ${timeText}`;
                } else {
                    head = (locale === 'hi') ? `आपने ${dataTest[0].test_name} स्कॉलरशिप परीक्षा सफलतापूर्वक पूरी कर ली है` : `Aapne ${dataTest[0].test_name} Scholarship test successfully complete kar liya hai.`;
                }
                const notificationPayload = {
                    event: 'course_details',
                    title: head,
                    message: msg,
                    firebase_eventtag: 'dnst_scholarship',
                    data: JSON.stringify({
                        id: `scholarship_test_${dataTest[0].type}`,
                    }),
                };
                newtonNotifications.sendNotification(studentId, notificationPayload, db.mysql.read);
            }
            // Notification.sendMocktestSubmitNotification(studentId, test_subscriptionData[0].test_id, null, db, config.staticCDN);
            Utility.gamificationActionEntry(sqs, config.gamification_sqs, {
                action: 'SUBMIT_QUIZ',
                user_id: req.user.student_id,
                refer_id: test_subscription_id,
            });
            const eligible_status = await TestSeries.getTestSeriesEligibleScoreStatus(db.mysql.read, test_subscriptionData[0].test_id);
            const is_eligible_choke = eligible_status[0].eligible_status;
            if (is_eligible_choke) {
                await db.redis.write.setAsync(`live_test1_choke_${req.user.student_id}`, test_subscriptionData[0].test_id, 'EX', 1800);
            }
            // check if test is live or not
            // if live set key in redis
            const [
                resourceDetails,
                activePackages,
            ] = await Promise.all([
                coursev2.getAssortmentsByQuestionId(db.mysql.read, test_subscriptionData[0].test_id),
                coursev2.getUserActivePackages(db.mysql.read, studentId),
            ]);

            if (resourceDetails.length) {
                const parentAssortments = await CourseHelper.getParentAssortmentListV1(db, [resourceDetails[0].assortment_id], studentClass);
                const subscribedPackages = [];
                for (let i = 0; i < activePackages.length; i++) {
                    const assortment = parentAssortments.filter((e) => e.assortment_id == activePackages[i].assortment_id);
                    if (assortment && assortment.length) {
                        subscribedPackages.push(activePackages[i].assortment_id);
                    }
                }
                if (subscribedPackages.length) {
                    for (let i = 0; i < subscribedPackages.length; i++) {
                        const progressDetails = await coursev2.getUserProgress(db.mysql.write, studentId, subscribedPackages[i]);
                        if (progressDetails.length) {
                            coursev2.updateTestCount(db.mysql.write, studentId, subscribedPackages[i]);
                        } else {
                            const obj = {
                                student_id: studentId,
                                package_id: activePackages.filter((e) => e.assortment_id == subscribedPackages[i])[0].new_package_id,
                                assortment_id: subscribedPackages[i],
                                pdf_count: 0,
                                videos_count: 0,
                                test_count: 1,
                                total_count: 1,
                            };
                            coursev2.setTestCount(db.mysql.write, obj);
                        }
                        // updateCountInLeaderboard(db, 'quiz_attempted', 1, studentId, subscribedPackages[i], resourceDetails[0].live_at);
                    }
                }
            }
            // Testseries leaderboards
            if (!dataTest || !dataTest.length) {
                RedisCourseV2.setTestLeaderboard(db.redis.write, test_subscriptionData[0].test_id, totalscore, studentId);
                const testId = await TestSeries.getTestSeriesById(db.mysql.read, test_subscriptionData[0].test_id);
                if (testId && testId[0] && testId[0].course_id) {
                    const batchID = await CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentId, testId[0].course_id);
                    let newId;
                    if (batchID) {
                        newId = `${testId[0].course_id}_${batchID}`;
                    }
                    const allScore = await RedisCourseV2.getUserCourseLeaderboardAllScore(db.redis.read, newId, studentId);
                    const weeklyScore = await RedisCourseV2.getUserCourseLeaderboardWeeklyScore(db.redis.read, newId, studentId);
                    const monthlyScore = await RedisCourseV2.getUserCourseLeaderboardMonthlyScore(db.redis.read, newId, studentId);
                    let totalscoreAll = parseInt(totalscore);
                    let totalscoreWeekly = parseInt(totalscore);
                    let totalscoreMonthly = parseInt(totalscore);
                    if (allScore) {
                        totalscoreAll += parseInt(allScore);
                    }
                    if (weeklyScore) {
                        totalscoreWeekly += parseInt(weeklyScore);
                    }
                    if (monthlyScore) {
                        totalscoreMonthly += parseInt(monthlyScore);
                    }
                    await RedisCourseV2.setCourseLeaderboardAll(db.redis.write, newId, totalscoreAll, studentId);
                    await RedisCourseV2.setCourseLeaderboardWeekly(db.redis.write, newId, totalscoreWeekly, studentId);
                    await RedisCourseV2.setCourseLeaderboardMonthly(db.redis.write, newId, totalscoreMonthly, studentId);
                }
            }
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: studentreportcardData,
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: { msg: 'test already completed' },
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
        next(e);
    }
}

async function getResult(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const test_subscription_id = req.params.testsubscriptionId;
        let test_subscription_data = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let result = TestSeries.getResultByTestSubscriptionId(db.mysql.write, test_subscription_id);
        let reportCard = TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, test_subscription_id);
        result = await result;
        reportCard = await reportCard;
        const resultGrouped = _.groupBy(result, 'questionbank_id');
        test_subscription_data = await test_subscription_data;
        if (test_subscription_data.length == 0) {
            test_subscription_data = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        // console.log(test_subscription_data)
        const testData = await TestSeries.getTestSeriesDataById(db.mysql.read, test_subscription_data[0].test_id);
        if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
            reportCard[0].eligiblescore = 0;
            reportCard[0].totalscore = 0;
        }
        const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscription_data[0].test_id);
        const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
        const questionsOptionData = await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read, questionBankKeysString);
        const questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id');
        const questionWiseResult = [];
        _.forEach(testQuestionsData, (question) => {
            const questionOptions = questionsOptionDataGrouped[question.questionbank_id];
            const questionResult = resultGrouped[question.questionbank_id][0];
            const questionResultOptions = _.split(questionResult.response_options, ',');
            for (let i = questionOptions.length - 1; i >= 0; i--) {
                if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
                    questionOptions[i].is_answer = 0;
                }
                if (_.includes(questionResultOptions, questionOptions[i].option_code)) {
                    // Is Selected
                    //
                    questionOptions[i].is_selected = 1;
                } else {
                    questionOptions[i].is_selected = 0;
                }
            }
            if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
                question.is_correct = 0;
            } else {
                question.is_correct = questionResult.is_correct;
            }
            if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
                question.marks_scored = 0;
            } else {
                question.marks_scored = questionResult.marks_scored;
            }
            question.options = questionOptions;
            question.is_skipped = questionResult.is_skipped;
            question.marks_scored = questionResult.marks_scored;

            questionWiseResult.push(question);
        });
        if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
            reportCard[0].skipped = _.trim(`${reportCard[0].correct},${reportCard[0].skipped}`, ',');
            reportCard[0].skipped = _.trim(`${reportCard[0].incorrect},${reportCard[0].skipped}`, ',');
            reportCard[0].incorrect = '';
            reportCard[0].correct = '';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: { questionwise_result: questionWiseResult, report_card: reportCard[0] },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getMockResult(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const test_subscription_id = req.params.testsubscriptionId;
        let test_subscription_data = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let result = TestSeries.getResultByTestSubscriptionId(db.mysql.write, test_subscription_id);
        let reportCard = TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, test_subscription_id);
        result = await result;
        reportCard = await reportCard;
        const resultGrouped = _.groupBy(result, 'questionbank_id');
        test_subscription_data = await test_subscription_data;
        if (test_subscription_data.length == 0) {
            test_subscription_data = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        const testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, test_subscription_data[0].test_id);
        const groupedTestSections = _.groupBy(testSections, 'section_code');
        const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscription_data[0].test_id);
        const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
        const questionsOptionData = await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read, questionBankKeysString);
        const questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id');
        const questionWiseResult = [];
        _.forEach(testQuestionsData, (question) => {
            const questionOptions = questionsOptionDataGrouped[question.questionbank_id];
            const questionResult = resultGrouped[question.questionbank_id][0];
            const questionResultOptions = _.split(questionResult.response_options, ',');
            for (let i = questionOptions.length - 1; i >= 0; i--) {
                // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
                //	questionOptions[i]['is_answer'] = 0
                // }
                if (question.type == 'TEXT') {
                    questionOptions[i].title = questionResultOptions[0];
                    questionOptions[i].is_selected = 1;
                } else if (_.includes(questionResultOptions, questionOptions[i].option_code)) {
                    // Is Selected
                    //
                    questionOptions[i].is_selected = 1;
                } else {
                    questionOptions[i].is_selected = 0;
                }
            }
            question.is_correct = questionResult.is_correct;
            // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
            // 	question['is_correct'] = 0
            // }else{
            // }
            // question['marks_scored'] = questionResult['marks_scored']
            // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
            // 	question['marks_scored'] = 0
            // }else{
            // }
            question.options = questionOptions;
            question.is_skipped = questionResult.is_skipped;
            question.marks_scored = questionResult.marks_scored;
            question.section_title = groupedTestSections[question.section_code][0].title;

            questionWiseResult.push(question);
        });
        // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
        // 	reportCard[0]['skipped'] = _.trim(reportCard[0]['correct'] +","+reportCard[0]['skipped'],',')
        // 	reportCard[0]['skipped'] = _.trim(reportCard[0]['incorrect'] +","+reportCard[0]['skipped'],',')
        // 	reportCard[0]['incorrect'] = ""
        // 	reportCard[0]['correct'] = ""
        // }
        const groupedformatedData = _.groupBy(questionWiseResult, 'section_code');
        let questionsOrderBySections = [];
        const sectionMeta = _.map(testSections, (section) => {
            section.marks_scored = _.sumBy(groupedformatedData[section.section_code], 'marks_scored');
            section.correct = _.sumBy(groupedformatedData[section.section_code], 'is_correct');
            section.skipped = _.sumBy(groupedformatedData[section.section_code], 'is_skipped');
            section.incorrect = groupedformatedData[section.section_code].length - section.correct - section.skipped;
            // console.log(groupedformatedData[section.section_code])
            section.startingIndex = questionsOrderBySections.length;
            section.endingIndex = groupedformatedData[section.section_code].length - 1;
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code]);
            return section;
        });
        const data = { questionwise_result: questionsOrderBySections, sections: sectionMeta, report_card: reportCard[0] };
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
async function getleaderboard(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const test_id = req.params.testId;
        const leaderboard = await TestSeries.getleaderboardByTestId(db.mysql.read, test_id);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: leaderboard,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
async function repopulateResult(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const test_id = req.params.testId;
        const completedSubmit = await StudentTestsSubsriptions.getCompletedTestSubIds(db.mysql.write, test_id);
        // console.log(completedSubmit)
        const completedIds = _.keys(_.groupBy(completedSubmit, 'id'));
        const completedsubIds = _.join(completedIds, ',');
        // console.log(completedsubIds)
        const deleteResultSQL = `DELETE FROM \`testseries_student_results\` WHERE test_subscription_id IN (${completedsubIds})`;
        const deleteReportCardSQL = `DELETE FROM \`testseries_student_reportcards\` WHERE test_subscription_id IN (${completedsubIds})`;
        await db.mysql.write.query(deleteResultSQL);
        await db.mysql.write.query(deleteReportCardSQL);

        for (let j = completedIds.length - 1; j >= 0; j--) {
            let totalscore = 0;
            let totalmarks = 0;
            const correct = [];
            const incorrect = [];
            const skipped = [];
            let eligiblescore = 0;
            const test_subscription_id = completedIds[j];
            // console.log(test_subscription_id)
            const test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
            const student_test_responses = await StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.read, test_subscription_id);

            // console.log(test_subscriptionData);
            // [test_subscriptionData,student_test_responses] = await Promise.all([test_subscriptionData,student_test_responses])
            const test_questions = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscriptionData[0].test_id);
            if (test_subscriptionData[0].status == 'COMPLETED') {
                const groupedTestQuestions = _.groupBy(test_questions, 'questionbank_id');
                const groupedSTR = _.groupBy(student_test_responses, 'questionbank_id');
                const questionbankIdsStringKey = _.join(_.keys(groupedTestQuestions), ',');
                const testCorrectOptions = await TestQuestions.getAllCorrectOptionsByQuestionIds(db.mysql.read, questionbankIdsStringKey);
                const testCorrectOptionsGrouped = _.groupBy(testCorrectOptions, 'questionbank_id');
                const resultInstObj = [];
                for (let i = test_questions.length - 1; i >= 0; i--) {
                    const resultIns = [
                        test_subscriptionData[0].student_id,
                        test_subscriptionData[0].test_id,
                        test_subscriptionData[0].id,
                        test_questions[i].questionbank_id,
                        test_questions[i].section_code,
                        test_questions[i].subject_code,
                        test_questions[i].chapter_code,
                        test_questions[i].subtopic_code,
                        test_questions[i].mc_code,
                        test_questions[i].correct_reward,
                    ];
                    const questionCorrectOptions = testCorrectOptionsGrouped[test_questions[i].questionbank_id];
                    const questionCorrectOptionsArray = _.keys(_.groupBy(questionCorrectOptions, 'option_code'));
                    const questionCorrectOptionsString = _.join(questionCorrectOptionsArray, ',');
                    resultIns.push(questionCorrectOptionsString);
                    let is_correct = true;
                    let is_nagative = false;
                    let is_skipped = true;
                    let is_eligible;
                    let correctrows = 0;
                    let incorrectrows = 0;
                    const rows = [];
                    const rowOptions = [];
                    const responserows = [];
                    const resposerowOptions = [];
                    const questionbankId = test_questions[i].questionbank_id;
                    if (test_questions[i].type == 'MATRIX') {
                        _.map(questionCorrectOptions, (value) => {
                            const row = _.split(value.title, '_')[0];
                            if (!_.includes(rows, row)) {
                                rows.push(row);
                                rowOptions[row] = [value.option_code];
                            } else {
                                rowOptions[row].push(value.option_code);
                            }
                        });
                        resultIns[9] = test_questions[i].correct_reward * rows.length;
                    }

                    if (groupedSTR[questionbankId]) {
                        const studentResponse = groupedSTR[questionbankId][0];
                        resultIns.push(studentResponse.option_codes);
                        is_eligible = studentResponse.is_eligible;
                        const responseOptions = _.split(studentResponse.option_codes, ',');
                        if (studentResponse.option_codes !== '' && studentResponse.option_codes !== null && responseOptions.length > 0) {
                            is_skipped = false;
                            if (studentResponse.question_type == 'SINGLE' || studentResponse.question_type == 'MULTI') {
                                if (responseOptions.length == questionCorrectOptionsArray.length) {
                                    _.forEach(responseOptions, (userResponse) => {
                                        if (!_.includes(questionCorrectOptionsArray, _.trim(userResponse))) {
                                            is_correct = false;
                                            is_nagative = true;
                                        }
                                    });
                                } else {
                                    is_correct = false;
                                    is_nagative = true;
                                }
                            } else if (studentResponse.question_type == 'TEXT') {
                                // TREATING OPTION CODE AS TEXT ANSWER
                                if (studentResponse.option_codes.length > 0) {
                                    if (studentResponse.option_codes !== questionCorrectOptions[0].answer) {
                                        is_correct = false;
                                        is_nagative = true;
                                        is_skipped = false;
                                    } else {
                                        is_correct = true;
                                        is_skipped = false;
                                        is_nagative = false;
                                    }
                                } else {
                                    is_correct = false;
                                    is_nagative = false;
                                    is_skipped = true;
                                }
                            } else if (studentResponse.question_type == 'MATRIX') {
                                _.map(responseOptions, (value) => {
                                    const row = _.split(value, '_')[0];
                                    if (!_.includes(responserows, row)) {
                                        responserows.push(row);
                                        resposerowOptions[row] = [value];
                                    } else {
                                        resposerowOptions[row].push(value);
                                    }
                                });
                                _.forEach(rows, (row1) => {
                                    if (resposerowOptions[row1]) {
                                        if (_.isEqual(resposerowOptions[row1].sort(), rowOptions[row1].sort())) {
                                            correctrows++;
                                        } else {
                                            incorrectrows++;
                                        }
                                    }
                                });
                                if (correctrows) {
                                    is_correct = true;
                                    is_nagative = false;
                                }
                                if (!correctrows && incorrectrows) {
                                    is_nagative = true;
                                    is_correct = false;
                                }
                                if (!correctrows && !incorrectrows) {
                                    is_skipped = true;
                                    is_nagative = false;
                                    is_correct = false;
                                }

                                // console.log("GOD")
                                // console.log(correctrows)
                                // console.log(incorrectrows)
                            }
                        } else {
                            is_correct = false;
                        }
                    } else {
                        resultIns.push('');
                        is_correct = false;
                    }

                    if (is_correct) {
                        correct.push(test_questions[i].questionbank_id);
                        if (groupedSTR[questionbankId][0].question_type == 'MATRIX') {
                            const matrixscore = test_questions[i].correct_reward * correctrows;
                            const matrixscore1 = test_questions[i].incorrect_reward * incorrectrows;
                            const matrixtotalscore = matrixscore + matrixscore1;
                            // console.log(matrixtotalscore)
                            if (is_eligible) {
                                eligiblescore += matrixtotalscore;
                            }
                            resultIns.push(matrixtotalscore);
                            totalscore += matrixtotalscore;
                        } else {
                            if (is_eligible) {
                                eligiblescore += test_questions[i].correct_reward;
                            }
                            resultIns.push(test_questions[i].correct_reward);
                            totalscore += test_questions[i].correct_reward;
                        }
                    } else if (is_nagative) {
                        incorrect.push(test_questions[i].questionbank_id);

                        if (groupedSTR[questionbankId][0].question_type == 'MATRIX') {
                            // console.log(test_questions[i]['incorrect_reward'])
                            const matrixscore1 = test_questions[i].incorrect_reward * incorrectrows;

                            resultIns.push(matrixscore1);
                            totalscore += matrixscore1;
                            if (is_eligible) {
                                eligiblescore += matrixscore1;
                            }
                            // console.log(matrixscore1)
                        } else {
                            resultIns.push(test_questions[i].incorrect_reward);
                            totalscore += test_questions[i].incorrect_reward;
                            if (is_eligible) {
                                eligiblescore += test_questions[i].incorrect_reward;
                            }
                        }
                    } else {
                        skipped.push(test_questions[i].questionbank_id);
                        const skippedreward = 0;
                        resultIns.push(skippedreward);
                    }
                    // console.log(is_correct)
                    resultIns.push(is_correct);
                    resultIns.push(is_skipped);
                    resultInstObj.push(resultIns);
                    totalmarks += resultIns[9];
                }
                // console.log(resultInstObj)
                await TestQuestions.insertResult(db.mysql.write, resultInstObj);
                const studentreportcardData = {
                    student_id: test_subscriptionData[0].student_id,
                    test_id: test_subscriptionData[0].test_id,
                    test_subscription_id: test_subscriptionData[0].id,
                    totalscore,
                    totalmarks,
                    correct: _.join(correct, ','),
                    incorrect: _.join(incorrect, ','),
                    skipped: _.join(skipped, ','),
                    eligiblescore,
                };
                // console.log(studentreportcardData)
                await TestSeries.saveReportcard(db.mysql.write, studentreportcardData);
            }
            if (j == 0) {
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: 'DONE Repopulating',
                };
                res.status(responseData.meta.code).json(responseData);
            }
        }
    } catch (e) {
        next(e);
    }
}
async function getSuggestions(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        // const { locale } = req.user ;
        const { testId } = req.query;
        const { subject } = req.query;
        const locale = req.user.locale || 'en';

        const { 'x-auth-token': xAuthToken } = req.headers;
        // static data
        const subjectColorMapping = {
            BIOLOGY: '#a19a30',
            CHEMISTRY: '#00a167',
            ENGLISH: '#e34c4c',
            MATHS: '#4ca4e3',
            SCIENCE: '#00a167',
            PHYSICS: '#854ce3',
            'SOCIAL SCIENCE': '#4852db',
            BOTANY: '#71ba66',
            'CHILD DEVELOPMENT PEDAGOGY': '#d35882',
            'GENERAL KNOWLEDGE': '#8235d6',
            'GENERAL SCIENCE': '#cf7d4a',
            GUIDANCE: '#3f8aaa',
            REASONING: '#3f8aaa',
            'ENVIRONMENTAL STUDIES': '#cea644',
        };
        const subjectFilterColorMapping = {
            MATHS: '#2376B2',
            PHYSICS: '#622ABD',
            BIOLOGY: '#139C6B',
            CHEMISTRY: '#C07A27',
            ENGLISH: '#B02727',
            GUIDANCE: '#3F8AAA',
        };

        const studentReportCard = await TestSeries.getReportCardByTestIdandStudentId(db.mysql.read, studentId, testId);
        // get Question bank ids from report card for strength, weakness, opportunity
        // test values =  ['32308','32307','32305','32303','32300','32299'], ['32306','32304','32302','32301']
        const strengths = studentReportCard.length ? studentReportCard[0].correct.split(',') : [];
        const weakness = studentReportCard.length ? studentReportCard[0].incorrect.split(',') : [];
        const opportunities = studentReportCard.length ? studentReportCard[0].skipped.split(',') : [];
        const strengthsMap = new Set(strengths);
        const weaknessMap = new Set(weakness);
        const testData = await TestSeries.getTestSeriesDataById(db.mysql.read, testId);

        const allTestQuetionIds = _.concat(strengths, weakness, opportunities);

        const questionIds = await TestSeries.getQuestionIdsFromTestBank(db.mysql.read, allTestQuetionIds);

        const groupedQuestionIdsByTestId = _.groupBy(questionIds, 'testId');
        const testIdsList = _.keys(groupedQuestionIdsByTestId);
        const groupedQuestionIdsByQid = _.groupBy(questionIds, 'qid');
        const qidList = _.keys(groupedQuestionIdsByQid);
        const microconceptIdData = await TestSeries.getMicroConceptFromQuestionId(db.mysql.read, qidList);
        const groupedMicroConceptIdByQid = _.groupBy(microconceptIdData, 'questionId');
        const groupedMicroConceptIdByMcId = _.groupBy(microconceptIdData, 'mcId');
        const groupedMicroConceptByTarget = _.groupBy(microconceptIdData, 'target');

        const mcIdKeys = _.keys(groupedMicroConceptIdByMcId);
        const targetKeys = _.keys(groupedMicroConceptByTarget);

        const deeplinkIds = await TestSeries.getQidFromMcId(db.mysql.read, mcIdKeys, targetKeys);
        const deeplinkIdsGroupedByMcId = _.groupBy(deeplinkIds, 'mcId');

        //  deeplinkIdsGroupedByMcId[groupedMicroConceptIdByQid[item[0].qid][0].mcId][0].question_id

        const mappingData = await TestSeries.getMcCourseMappingFromMcId(db.mysql.read, mcIdKeys);
        const mappingDataGrouped = _.groupBy(mappingData, 'mc_id');

        const Strengths = [];
        const Weakness = [];
        const Opp = [];

        const availableSubjects = new Set();
        testIdsList.forEach((testID) => {
            const item = groupedQuestionIdsByTestId[testID];
            if (item[0].qid && groupedMicroConceptIdByQid[item[0].qid] && groupedMicroConceptIdByQid[item[0].qid][0].mcId) {
                const key = groupedMicroConceptIdByQid[item[0].qid][0].mcId;
                if (mappingDataGrouped[key]) {
                    const subjectCheck = subject ? subject === mappingDataGrouped[key][0].subject : true;
                    availableSubjects.add(mappingDataGrouped[key][0].subject);
                    if (subjectCheck) {
                        const obj = {
                            title: mappingDataGrouped[key][0].chapter,
                            subtitle: mappingDataGrouped[key][0].subtopic,
                            subject: mappingDataGrouped[key][0].subject,
                            subject_color: subjectColorMapping[mappingDataGrouped[key][0].subject],
                        };
                        if (strengthsMap.has(testID)) {
                            Strengths.push(obj);
                        } else {
                            obj.icon_url = deeplinkIdsGroupedByMcId[key] ? 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/6BAB6A0F-75B6-7FE4-5387-D1DA5AA9CC63.webp' : '';
                            obj.deeplink = deeplinkIdsGroupedByMcId[key] ? `doubtnutapp://video?qid=${deeplinkIdsGroupedByMcId[key][0].question_id}&page=LIVECLASS` : '';
                            if (weaknessMap.has(testID)) Weakness.push(obj);
                            else Opp.push(obj);
                        }
                    }
                }
            }
        });
        // Only add filters for available subjects
        const subjectFilters = [];
        for (const Subject of availableSubjects) {
            subjectFilters.push({
                text: Subject,
                filter_id: Subject,
                key: Subject,
                color: subjectFilterColorMapping[Subject],
                is_selected: Subject === subject,
            });
        }
        const widgets = [];
        if (subjectFilters.length > 0) {
            widgets.push({
                type: 'subject_filters',
                data: {
                    items: subjectFilters,
                },
            });
            if (Weakness.length > 0) {
                widgets.push({
                    type: 'widget_test_analysis',
                    data: {
                        title: 'Weakness',
                        subtitle: 'Ye Videos deakh kar apni Galtiyan theek karein',
                        is_collapsed: 'true',
                        items: Weakness,
                    },
                });
            }
            const widgetData = await getRecommendedWidgets(db, config, testData, studentId, +testData[0].class_code, locale, xAuthToken);
            widgets.push(widgetData);
            if (Strengths.length > 0) {
                widgets.push({
                    type: 'widget_test_analysis',
                    data: {
                        title: 'Strengths',
                        subtitle: ' Aapko ye topics achhe se aate hain',
                        is_collapsed: 'true',
                        items: Strengths,
                    },
                });
            }
            if (Opp.length > 0) {
                widgets.push({
                    type: 'widget_test_analysis',
                    data: {
                        title: 'Opportunities',
                        subtitle: 'Ye videos dekho, samjho aur agli baar zaroor attempt karo!',
                        is_collapsed: 'true',
                        items: Opp,
                    },
                });
            }
        }
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data:
            {
                title: 'Test Analysis',
                widgets,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
function testSeriesArrayResponseFormatter(testdata, subscriptiondata, filter, choke_var, cdn_url) {
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
        if (testdata[i].image_url) {
            testdata[i].image_url = `${cdn_url}images/${testdata[i].image_url}`;
        }
        if (testdata[i].solution_pdf) {
            testdata[i].solution_pdf = `${cdn_url}${testdata[i].solution_pdf}`;
        }
        if (choke_var) {
            testdata[i].publish_time = new Date(testdata[i].publish_time.getTime() + 30 * 60000).toISOString();
            testdata[i].unpublish_time = new Date(testdata[i].unpublish_time.getTime() + 30 * 60000).toISOString();
        }
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
                //
                testdata[i].can_attempt = false;
                //
                testdata[i].attempt_count = subData.COMPLETED.length;
                testdata[i].test_subscription_id = subData.COMPLETED[0].id;
            }
        } else {
            testdata[i].can_attempt = true;
            testdata[i].subscriptiondata = [];
        }
    }
    if (filter == 'active_mock_test') {
        const groupedtestdata = _.groupBy(testdata, 'course');
        const courses = _.keys(groupedtestdata);
        const mappedData = _.map(courses, (course) => ({ course, tests: groupedtestdata[course] }));
        testdata = mappedData;
    }

    return testdata;
}

function ruleDataResponseFormatter(data) {
    data[0].rules = _.split(data[0].rule_text, '#!#');
    return data[0];
}

function testQuestionsWithSectionsDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped, testsections) {
    const groupedTestSections = _.groupBy(testsections, 'section_code');
    const data = [];
    _.forEach(testQuestionsData, (question) => {
        question.options = questionOptionDataGrouped[question.questionbank_id];
        question.section_title = groupedTestSections[question.section_code][0].title;
        data.push(question);
    });
    return data;
}
function testQuestionsWithDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped) {
    const data = [];
    _.forEach(testQuestionsData, (question) => {
        question.options = questionOptionDataGrouped[question.questionbank_id];
        data.push(question);
    });
    return data;
}

function activeMockTestFormatter(testdata) {
    if (testdata.length === 0) {
        const output = {
            widgets: [],
        };
        return output;
    }
    const groupedTestData = _.groupBy(testdata, 'course');
    const courses = _.keys(groupedTestData);
    const output = {
        widgets: [
            {
                type: 'widget_parent',
                link_text: '',
                deeplink: '',
                data: {
                    title_text_size: '16',
                    background_color: '#eaf3f9',
                    scroll_direction: 'vertical',
                },
            },
        ],
    };
    const items = [];
    const courseItems = [];
    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const item = {
            course,
            total_tests: groupedTestData[course].length,
            image_url: null,
            category: null,
            course_id: groupedTestData[course][0].course_id,
        };
        for (let j = 0; j < groupedTestData[course].length; j++) {
            const test = groupedTestData[course][j];
            item.image_url = item.image_url ? item.image_url : test.image_url;
            item.category = item.category ? item.category : test.category;
            item.course_id = item.course_id ? item.course_id : test.course_id;
        }
        courseItems.push(item);
    }

    courseItems.forEach((item) => {
        const widgetItem = {
            type: 'widget_recommended_test',
            data: {
                title: item.course,
                image_url: item.image_url ? item.image_url : 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/508F6038-9B62-BD55-E52D-0380CFCBEA84.webp',
                sub_title: item.total_tests == 1 ? `${item.total_tests} paper` : `${item.total_tests} papers`,
                sub_title_icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1573B73B-49C9-9868-3F7C-9E99146853A6.webp',
                price: null,
                category: item.category,
                course: item.course,
                is_background_image: !item.image_url,
                btn_text: 'View papers',
                deeplink: `doubtnutapp://mock_test_list?course=${item.course}`,
                btn_deeplink: `doubtnutapp://mock_test_list?course=${item.course}`,
            },
            extra_params: {
                assortment_id: item.course_id,
            },
        };
        items.push(widgetItem);
    });
    output.widgets[0].data.items = items;
    return output;
}
function dateFormatterForMockTestList(timeval) {
    const date = new Date(timeval);
    date.setTime(date.getTime() + 19800);
    const dateValues = date.toString().split(' ');
    const month = dateValues[1];
    const day = dateValues[2];
    const year = dateValues[3].substring(2, 4);
    const [hour, min, sec] = dateValues[4].split(':');
    return `${day} ${month}'${year} ${hour > 12 ? hour - 12 : hour}:${min} ${hour > 12 ? 'pm' : 'am'}`;
}
function activeMockTestListFormatter(testdata, course, groupedSubscribedTestData) {
    const widgets = [];
    testdata = _.sortBy(testdata, 'publish_time');
    for (const item of testdata) {
        const status = groupedSubscribedTestData[item.test_id] ? groupedSubscribedTestData[item.test_id][0].status : 'PENDING';
        const widgetItem = {
            type: 'widget_course_test',
            data: {
                test_id: item.test_id,
                id: item.test_id,
                title: item.title,
                questions_count: `${item.no_of_questions} Questions`,
                duration: item.duration_in_min,
                action_text: status === 'COMPLETED' ? 'See Result' : 'Start Test',
                status: status === 'COMPLETED' ? 'Completed' : 'Pending',
                submit_date: dateFormatterForMockTestList(item.publish_time),
                bottom_text: '',
                is_completed: null,
                margin: true,
                image_url: status === 'COMPLETED' ? 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73C1D5D0-8910-E78C-DDFF-3FBCF8243483.webp' : 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E2C14B68-931B-9FB1-AD14-0CA2ECB1DEF9.webp',
            },
            extra_params: {
                source: 'mock_test',
            },
        };
        widgets.push(widgetItem);
    }
    widgets.sort((a, b) => b.data.test_id - a.data.test_id);
    return { widgets, title: course, total: widgets.length };
}
async function startTest(req, res) {
    db = req.app.get('db');
    config = req.app.get('config');

    const { student_id: studentId } = req.user;
    const { testSubscriptionId } = req.params;

    StudentTestsSubsriptions.updateStartTime(db.mysql.write, testSubscriptionId, studentId);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: 'DONE',
    };
    res.status(responseData.meta.code).json(responseData);
    // update start time in test subscription table
}

async function getRecommendedWidgets(db, config, testData, studentId, studentClass, studentLocale, xAuthToken) {
    const category = staticData.testExamCategoryMapping[testData[0].category] ? staticData.testExamCategoryMapping[testData[0].category] : testData[0].category;
    const categories = [];
    if (category == 'BOARDS') {
        const studentCcmData = await CourseMysqlv2.getCoursesClassCourseMapping(db.mysql.read, studentId);
        studentCcmData.forEach((item) => { categories.push(staticData.testExamCategoryMapping[item.course]); });
    } else {
        categories.push(category);
    }
    const courseData = await CourseMysqlv2.getCoursesList(db.mysql.read, categories, studentClass);

    const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
    // * User assortment mapping to payment state
    const userCourseAssortments = [];
    userActivePackages.map((item) => userCourseAssortments.push(item.assortment_id));
    userCourseAssortments.push(138829);

    //  const studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, userActivePackages, studentClass);

    const assortmentIds = [];
    let recommededCourses = [];
    courseData.filter((item) => {
        if (!userCourseAssortments.includes(item.assortment_id)) {
            assortmentIds.push(item.assortment_id);
            recommededCourses.push(item);
            return true;
        }
        return false;
    });
    // remove student active packages

    const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentIds, studentId, false, xAuthToken);

    // let buyDeeplink = `doubtnutapp://bundle_dialog?id=${assortmentId}&source=${page}`
    // const subjectAssortments = await CourseMysqlV2.getSubjectAssortmentByCategory(db.mysql.read, id, studentClass, subject);
    // const subjectAssortmentIds = subjectAssortments.reduce((acc, obj) => acc.concat(obj.assortment_id), []);
    // const assortmentIds = await CourseMysqlV2.getChildAssortmentsFromSubjectAssortment(db.mysql.read, subjectAssortmentIds);

    // console.log(courseData)
    // remove courese without mapping
    const carouselData = {
        title: 'Recommended Courses',
        carousel_type: 'widget_course_v3',
        view_type: 'recommended',
        assortment_list: assortmentIds.join(','),
    };
    recommededCourses = recommededCourses.filter((item) => assortmentPriceMapping[item.assortment_id]);
    const widgetData = await getPopularCourseWidgetData({
        db, result: recommededCourses, carousel: carouselData, config, locale: studentLocale, assortmentPriceMapping,
    });

    return widgetData;
}
async function getRecommended(req, res) {
    const db = req.app.get('db');
    const config = req.app.get('config');
    const testData = [{ category: 'BITSAT' }];
    const { student_id: studentId } = req.user;
    const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;

    const widgetData = await getRecommendedWidgets(db, config, testData, studentId, 12, 'hi', xAuthToken);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: widgetData,
    };
    res.status(responseData.meta.code).json(responseData);
}
async function getPopularCourseWidgetData({
    db, result, carousel, config, locale, assortmentPriceMapping,
}) {
    const defaultCoursePrePurchaseDetails = await CourseContainer.getPrePurchaseCourseHighlights(db, 0, locale, 4);
    const promise = [];
    const courseFeatures = [];
    for (let i = 0; i < result.length; i++) {
        promise.push(CourseContainer.getPrePurchaseCourseHighlights(db, result[i].assortment_id, locale, 4));
    }
    const featuresData = await Promise.all(promise);
    for (let i = 0; i < featuresData.length; i++) {
        if (featuresData[i].length) {
            for (let j = 0; j < featuresData[i].length; j++) {
                featuresData[i][j].image_url = featuresData[i][j].image_url || `${config.cdn_url}engagement_framework/552884D3-56A5-2133-DA3A-708AB9F74DDE.webp`;
            }
            courseFeatures.push(featuresData[i]);
        } else {
            courseFeatures.push(defaultCoursePrePurchaseDetails);
        }
    }
    return WidgetHelper.getPopularCourseWidget({
        db, result, carousel, config, locale, assortmentPriceMapping, courseFeatures,
    });
}

module.exports = {
    getTestSeries, getTestsForCourse, getRulesById, getQuestionsByTestWithData, subscibeUserForTest, saveStudentResponse, submitTest, getResult, inProgressStudentResponse, getleaderboard, getQuestionsByTestSectionsWithData, getMockResult, repopulateResult, getSuggestions, startTest, getRecommended,
};
