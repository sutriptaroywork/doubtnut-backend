/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-09-26T19:22:35+05:30
*/

const _ = require('lodash');
const base64 = require('base-64');
const moment = require('moment');
const TestSeries = require('../../../modules/mysql/testseries');
const TestSections = require('../../../modules/mysql/testsections');
const TestQuestions = require('../../../modules/mysql/testquestions');
const Rules = require('../../../modules/mysql/rules');
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions');
const StudentTestResponse = require('../../../modules/mysql/studenttestresponse');
const Notification = require('../../../modules/notifications');
const Utility = require('../../../modules/utility');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const CourseMysql = require('../../../modules/mysql/coursev2');
const CourseRedisV2 = require('../../../modules/redis/coursev2');
const altAppData = require('../../../data/alt-app');

let db; let config; let
    client;

async function getSingleTestData(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const { student_class } = req.user;
        const { testId } = req.params;
        const type = ['TEST', 'TEST1', 'COURSE', 'CHAPTER', 'DNST'];
        let testSeriesData = [];
        const isTestStarted = await TestSeries.isTestStarted(db.mysql.read, testId);
        const publishTime = new Date(isTestStarted[0].publish_time);
        const nowDate = new Date(isTestStarted[0].now);
        const startTime = publishTime.valueOf() - nowDate.valueOf();
        testSeriesData = await TestSeries.getSingleByAppModuleWithMatrixNew(db.mysql.read, type, testId);
        console.log(testSeriesData);
        const subscriptionData = await TestSeries.getTestSubscriptionByStatusAndStudentIdAndTestId(db.mysql.write, testId, studentId);
        console.log(subscriptionData, studentId);
        let subscriptionInsertData;
        let data;
        if (subscriptionData.length > 0) {
            testSeriesData[0].test_subscription_id = subscriptionData[0].id;
            data = { test_subscription_id: subscriptionData[0].id };
        } else {
            const insertObj = {
                student_id: studentId, test_id: testId, class_code: student_class, status: 'SUBSCRIBED',
            };
            subscriptionInsertData = await TestSeries.insertStudentSubscription(db.mysql.write, insertObj);
            data = { test_subscription_id: subscriptionInsertData.insertId };
            testSeriesData[0].test_subscription_id = subscriptionInsertData.insertId;
        }
        const student_subscription_data = await StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentIdAndTestId(db.mysql.write, studentId, testId);
        response = testSeriesArrayResponseFormatterNew(testSeriesData, student_subscription_data);

        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: response[0],
        };
        responseData.data['wait_time'] = startTime > 0 ? startTime : 0;
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

function testSeriesArrayResponseFormatterNew(testdata, subscriptiondata) {
    const groupedSubData = _.groupBy(subscriptiondata, 'test_id');
    for (let i = testdata.length - 1; i >= 0; i--) {
        const test = testdata[i];
        testdata[i].can_attempt = false;
        testdata[i].can_attempt_prompt_message = '';
        testdata[i].test_subscription_id = '';
        testdata[i].in_progress = false;
        testdata[i].attempt_count = 0;
        testdata[i].last_grade = '';
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
    return testdata;
}

async function getTestSeries(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        // console.log(studentId);
        let { filter } = req.params;
        let response;
        const { student_class } = req.user;
        let testSeriesData = [];
        if (filter === 'all') {
            testSeriesData = TestSeries.getAll(db.mysql.read, student_class);
        } else if (filter === 'upcoming') {
            testSeriesData = TestSeries.getUpcoming(db.mysql.read, student_class);
        } else if (filter === 'active') {
            const type = 'QUIZ';
            const quizData = await TestSeries.getActiveTestsByAppModuleWithCompletedSubscriptionData(db.mysql.read, student_class, type, studentId);
            response = testSeriesArrayResponseFormatterQuiz(quizData);
        } else if (filter = 'active_mock_test') {
            const type = ['TEST', 'TEST1'];
            testSeriesData = TestSeries.getActiveByAppModuleWithMatrix(db.mysql.read, student_class, type);
            let student_subscription_data = StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentId(db.mysql.read, studentId);
            testSeriesData = await testSeriesData;
            student_subscription_data = await student_subscription_data;
            response = testSeriesArrayResponseFormatter(testSeriesData, student_subscription_data, filter);
        } else {
            throw new Error('not valid filter');
        }

        // [testSeriesData,student_subscription_data] = await Promise.all([testSeriesData,StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentId(db.mysql.read,studentId)]);
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: response,
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
        const completedSubscriptionData = await TestSeries.getTestSubscriptionByStatusAndStudentIdAndTestId(db.mysql.write, testId, studentId, 'COMPLETED');
        if (completedSubscriptionData.length > 0) {
            const responseData = {
                meta:
                {
                    code: 403,
                    success: false,
                    message: 'Test  has been completed',
                },
                data: [],
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
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
        }
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
        if (Array.isArray(isTestStarted) && isTestStarted.length && isTestStarted[0].eligible_status) {
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
                    code: 422,
                    success: false,
                    message: 'Invalid/Ineligible TestId',
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
        const testData = await TestSeries.getTestSeriesById(db.mysql.read, testId);
        const testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, testId);

        const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, testId);
        const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
        const questionOptionData = await TestQuestions.getAllOptionsByQuestionIdsWithoutIsAnswer(db.mysql.read, questionBankKeysString);
        console.log(questionOptionData);
        questionOptionDataGrouped = _.groupBy(questionOptionData, 'questionbank_id');
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
        const { version_code: versionCode } = req.headers;
        test_subscription_id = req.params.testsubscriptionId;
        const inProgressResponse = await StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.write, test_subscription_id);
        const test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        // console.log(test_subscriptionData)
        const groupedInprogressData = _.groupBy(inProgressResponse, 'questionbank_id');
        const test_questions = await TestQuestions.getAllTestQuestionsByTestId(db.mysql.read, test_subscriptionData[0].test_id);
        const testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, test_subscriptionData[0].test_id);
        let markedForReview = 0;
        const formatedData = _.map(test_questions, (question) => {
            // console.log(groupedInprogressData[question.questionbank_id])
            const questiontype = {
                questionbank_id: question.questionbank_id,
                section_code: question.section_code,
            };
            if (groupedInprogressData[question.questionbank_id]) {
                questiontype.option_codes = groupedInprogressData[question.questionbank_id][0].option_codes;
                questiontype.action_type = groupedInprogressData[question.questionbank_id][0].action_type;
                markedForReview = groupedInprogressData[question.questionbank_id][0].review_status ? markedForReview + 1 : markedForReview;
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

        const data = { questions: questionsOrderBySections, sections: sectionMeta };
        data.config_data = {
            skipped_color: '#fffff',
            attempted_color: '#329c37',
            review_color: '#751bad',
        };
        data.review_data = {
            button_one_text: 'Review all One by One ',
            button_two_text: 'Submit Without Review',
            title: `You Marked ${markedForReview} Questions to Review`,
            count: markedForReview,
        };
        const responseData = {
            meta:
            {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: versionCode >= 943 ? data : questionsOrderBySections,
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
        const { version_code: versionCode } = req.headers;

        const { student_id } = req.user;
        const { test_id } = req.body;
        const { questionbank_id } = req.body;
        let { action_type } = req.body;
        const { review_status } = req.body;
        const option_codes = req.body.option_code;
        const { section_code } = req.body;
        const { test_subscription_id } = req.body;
        const { question_type } = req.body;
        let { is_eligible } = req.body;
        const { time_taken } = req.body;
        const responseId = '';
        const scholarshipTestActive = await CourseContainerV2.getScholarshipExams(db);
        const scholarshipTestActiveList = scholarshipTestActive.map((item) => item.test_id);
        let eligible_status = [];
        if (scholarshipTestActiveList.includes(test_id)) {
            const getRegistrationTime = await TestSeries.getTimeForTestRegistration(db.mysql.read, test_id, student_id, test_subscription_id);
            if (getRegistrationTime.length > 0) {
                const regTime = moment(getRegistrationTime[0].publish_time).isAfter(moment(getRegistrationTime[0].registered_at)) ? moment(getRegistrationTime[0].publish_time).format() : moment(getRegistrationTime[0].registered_at).format();
                eligible_status = await TestSeries.getTestSeriesEligibleScoreStatusScholarship(db.mysql.write, test_id, regTime);
            }
        } else {
            eligible_status = await TestSeries.getTestSeriesEligibleScoreStatus(db.mysql.write, test_id);
        }
        if (eligible_status.length > 0) {
            is_eligible = eligible_status[0].eligible_status;
        }
        const responseExist = await StudentTestResponse.getStudentResponse(db.mysql.write, test_subscription_id, questionbank_id);

        const emptyOptions = ['', ','];
        if ((versionCode <= 988) && emptyOptions.includes(option_codes)) {
            action_type = 'SKIP';
        }

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
        if (responseExist.length > 0 && responseExist[0].option_codes !== option_codes) {
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
            const is_update = await StudentTestResponse.updateStudentResponse(db.mysql.write, updateobj);
        } else {
            const is_saved = await StudentTestResponse.saveStudentResponse(db.mysql.write, insertObj);
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
        const studentId = req.user.student_id;
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
            const groupedTestQuestions = _.groupBy(test_questions, 'questionbank_id');
            const groupedSTR = _.groupBy(student_test_responses, 'questionbank_id');
            const questionbankIdsStringKey = _.join(_.keys(groupedTestQuestions), ',');
            const testCorrectOptions = await TestQuestions.getAllCorrectOptionsByQuestionIds(db.mysql.read, questionbankIdsStringKey);
            testCorrectOptionsGrouped = _.groupBy(testCorrectOptions, 'questionbank_id');
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
                    const incorrectreward = test_questions[i].incorrect_reward;

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
            let saveReportcard = TestSeries.saveReportcard(db.mysql.write, studentreportcardData);
            resultCreated = await resultCreated;
            saveReportcard = await saveReportcard;
            const subscriptionUpdateData = await TestSeries.updateTestSubscriptionStatus(db.mysql.write, test_subscriptionData[0].id, 'COMPLETED');
            Notification.sendMocktestSubmitNotification(studentId, test_subscriptionData[0].test_id, null, db, config.staticCDN);
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
            throw new Error('test already completed');
        }
    } catch (e) {
        next(e);
    }
}

async function getResult(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        test_subscription_id = req.params.testsubscriptionId;
        let test_subscription_data = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let result = TestSeries.getResultByTestSubscriptionId(db.mysql.write, test_subscription_id);
        let reportCard = TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, test_subscription_id);
        result = await result;
        reportCard = await reportCard;
        resultGrouped = _.groupBy(result, 'questionbank_id');
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
        questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id');
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
            // question['marks_scored'] = questionResult['marks_scored']

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

async function getTestLeaderboardButton(testData, testSubscriptionData, studentId, locale) {
    let bottomWidget;
    if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isAfter(testData[0].unpublish_time)) {
        // after the test is over
        const myRank = await CourseRedisV2.getTestLeaderboardAllRank(db.redis.read, testSubscriptionData[0].test_id, studentId);
        if (!_.isNull(myRank)) {
            bottomWidget = {
                button_text: locale === 'hi' ? 'लीडरबोर्ड' : 'Leaderboard',
                button_deeplink: `doubtnutapp://leaderboard?source=test&test_id=${testSubscriptionData[0].test_id}`,
            };
        }
    } else if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
        // before test is over
        const unpublishTime = moment(testData[0].unpublish_time).format('Do MMM, h:mm A');
        let deeplink;
        if (testData[0].course_id !== null) {
            // paid course tests
            deeplink = `doubtnutapp://course_detail_info?tab=tests&assortment_id=${testData[0].course_id}`;
        } else {
            // free tests
            const packages = await CourseContainerV2.getUserActivePackages(db, studentId);
            const isVip = packages.filter((e) => e.assortment_type == 'course' || e.assortment_type == 'subject');
            if (isVip && isVip.length > 0) {
                // vip user
                deeplink = 'doubtnutapp://library_tab?library_screen_selected_Tab=5&tag=mock_test';
            } else {
                // free user
                deeplink = 'doubtnutapp://library_tab?library_screen_selected_Tab=4&tag=mock_test';
            }
        }
        bottomWidget = {
            button_text: locale === 'hi' ? `लीडरबोर्ड\n${unpublishTime}` : `Leaderboard\n${unpublishTime}`,
            button_deeplink: deeplink,
        };
    }
    return bottomWidget;
}
function getCountsOfQuestionFromReportCard(report) {
    const correct = report.correct.split(',')
    const incorrect = report.incorrect.split(',')
    const skipped = report.skipped.split(',')
    return [correct.length, incorrect.length, skipped.length]
}

async function getMockResult(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const xAuthToken = req.headers['x-auth-token'];
        const { version_code: versionCode } = req.headers;
        let { locale } = req.user;
        const studentId = req.user.student_id;
        locale = (locale !== 'hi') ? 'en' : 'hi';
        const test_subscription_id = req.params.testsubscriptionId;
        let test_subscription_data = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let result = TestSeries.getResultByTestSubscriptionId(db.mysql.write, test_subscription_id);
        let reportCard = TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, test_subscription_id);
        result = await result;
        reportCard = await reportCard;

        const [correctCount, inCorrectCount, skippedCount] = getCountsOfQuestionFromReportCard(reportCard[0])

        const resultGrouped = _.groupBy(result, 'questionbank_id');
        const questionBankIds = _.keys(resultGrouped);
        const getQuestionMeta = await TestSeries.getQuestionIdsFromTestBank(db.mysql.read, questionBankIds);
        console.log(getQuestionMeta);
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        const showButtonFlag = ((getQuestionMeta.length > 0) && (!isFreeApp));
        test_subscription_data = await test_subscription_data;
        if (test_subscription_data.length == 0) {
            test_subscription_data = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        const testData = await TestSeries.getTestSeriesDataById(db.mysql.read, test_subscription_data[0].test_id);
        const testDuration = parseInt(testData[0].duration_in_min) * 60;
        const testId = test_subscription_data[0].test_id;
        const testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, test_subscription_data[0].test_id);
        const groupedTestSections = _.groupBy(testSections, 'section_code');
        const testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscription_data[0].test_id);

        const questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',');
        const questionsOptionData = await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read, questionBankKeysString);
        questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id');
        const questionWiseResult = [];
        const dataTest = await CourseMysql.getScholarshipMatch(db.mysql.read, test_subscription_data[0].test_id);

        _.forEach(testQuestionsData, (question) => {
            const questionOptions = questionsOptionDataGrouped[question.questionbank_id];
            const questionResult = resultGrouped[question.questionbank_id][0];
            const questionResultOptions = _.split(questionResult.response_options, ',');
            for (let i = questionOptions.length - 1; i >= 0; i--) {
                if (testData[0] && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time) && dataTest && dataTest.length) {
                    questionOptions[i].is_answer = 0;
                }
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
            question.marks_scored = questionResult.marks_scored;
            if (testData[0] && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time) && dataTest && dataTest.length) {
                question.is_correct = 0;
                question.marks_scored = 0;
            }
            question.options = questionOptions;
            question.is_skipped = questionResult.is_skipped;
            question.section_title = groupedTestSections[question.section_code][0].title;

            if (question.qid_type == 'TEXT') {
                question.bottom_widget = {
                    button_text: 'view solution',
                    button_deeplink: `doubtnutapp://video?qid=${question.doubtnut_questionid}&page=MOCK_TEST&resource_type=text`,
                };
            } else if (question.qid_type == 'VIDEO') {
                question.bottom_widget = {
                    button_text: 'View Solution',
                    button_deeplink: `doubtnutapp://video?qid=${question.doubtnut_questionid}&page=MOCK_TEST`,
                };
            } else if (question.text_solution == null) {
                question.bottom_widget = {
                    button_text: 'View Solution',
                    text_solution: question.text_solution,
                };
            }
            questionWiseResult.push(question);
        });
        if (testData[0] && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time) && dataTest && dataTest.length) {
            reportCard[0].correct = reportCard[0].correct + ',' + reportCard[0].incorrect;
            reportCard[0].incorrect = '';
            reportCard[0].totalscore = 0;
        }
        const groupedformatedData = _.groupBy(questionWiseResult, 'section_code');
        let questionsOrderBySections = [];
        const sectionMeta = _.map(testSections, (section) => {
            section.marks_scored = _.sumBy(groupedformatedData[section.section_code], 'marks_scored');
            section.correct = _.sumBy(groupedformatedData[section.section_code], 'is_correct');
            section.skipped = _.sumBy(groupedformatedData[section.section_code], 'is_skipped');
            section.incorrect = groupedformatedData[section.section_code].length - section.correct - section.skipped;
            section.startingIndex = questionsOrderBySections.length;
            section.endingIndex = groupedformatedData[section.section_code].length - 1;
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code]);
            return section;
        });
        if (testData[0] && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time) && dataTest && dataTest.length) {
            for (let i = 0; i < sectionMeta.length; i++) {
                sectionMeta[i].correct = '--';
                sectionMeta[i].skipped = '--';
                sectionMeta[i].incorrect = '--';
                sectionMeta[i].marks_scored = '--';
            }
        }
        const data = { questionwise_result: questionsOrderBySections, sections: sectionMeta, report_card: reportCard[0] };
        if (testData[0] && testData[0].solution_pdf) {
            data.bottom_widget = {
                button_text: 'View Solutions PDF',
                button_deeplink: encodeURI(`doubtnutapp://pdf_viewer?pdf_url=${config.staticCDN}${testData[0].solution_pdf}`),
            };
        }
        // scholarship redirection button
        if (dataTest && dataTest.length) {
            const timeText = moment(dataTest[0].result_time).format('Do MMMM, h:mm A');
            let deepLink;
            const auth = base64.encode(xAuthToken);
            if (versionCode > 945) {
                deepLink = `doubtnutapp://course_details?id=scholarship_test_${dataTest[0].type}`;
            } else if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(dataTest[0].result_time)) {
                if (dataTest[0].type.includes('TALENT')) {
                    deepLink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/3/${dataTest[0].type}/${dataTest[0].test_id}`;
                } else {
                    deepLink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/3/${dataTest[0].type}/${dataTest[0].test_id}`;
                }
            } else if (dataTest[0].type.includes('TALENT')) {
                deepLink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST4/registered?token=${auth}/4/${dataTest[0].type}/${dataTest[0].test_id}`;
            } else {
                deepLink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/4/${dataTest[0].type}/${dataTest[0].test_id}`;
            }
            data.bottom_widget = {
                button_text: locale === 'hi' ? `परिणाम देखें\n(${timeText})` : `Check Result\n(${timeText})`,
                button_deeplink: encodeURI(deepLink),
            };
        }
        // test leaderboard button
        if ((!dataTest || !dataTest.length) && versionCode > 914) {
            const button = await getTestLeaderboardButton(testData, test_subscription_data, studentId, locale);
            data.bottom_widget = button;
        }

        if (versionCode >= 943) {
            const hideResultFlag = (dataTest && dataTest.length && testData[0] && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time))

            // widget arrays
            const accuracy = questionWiseResult.length ? Math.floor((correctCount * 100) / questionWiseResult.length) : 0;
            let totalTime = 0;
            if (test_subscription_data[0].completed_at) {
                const startTime = new Date(test_subscription_data[0].registered_at);
                const endTime = new Date(test_subscription_data[0].completed_at);
                totalTime = Math.floor((endTime.valueOf() - startTime.valueOf()) / 1000);
            }
            const totalAttempted = correctCount + inCorrectCount;
            const averageSpeed = totalAttempted && totalTime > 0 ? Math.floor(totalTime / totalAttempted) : '--';
            const idealSpeed = Math.floor(testDuration / questionWiseResult.length);
    
            data.widgets = [
                {
                    type: 'widget_mock_test_result',
                    data: {
                        description: !hideResultFlag ? 'you need to improve accuracy to cross the approx cut off marks of the exam' : 'Accuracy will be availble after result is declared',
                        accuracy_text: !hideResultFlag ? `${accuracy}%` : '--',
                        "accuracy": !hideResultFlag ? accuracy : 0,
                        accuracy_title: 'Accuracy',
                        accuracy_graph_color: '#4cb2ff',
                        // TODO: get speed text
                        speed_text: averageSpeed ? `${averageSpeed} \n sec/ques` : 'NA',
                        speed_title: 'Average Speed',
                        speed_graph_color: '#eb552b',
                        // TODO: change speed_description
                        speed_description: `Ideal Speed ${idealSpeed} sec/ques`,
                        btn_text: showButtonFlag ? 'Start Learning Now' : '',
                        deeplink: showButtonFlag ? `doubtnutapp://mock_test_analysis?testId=${testId}` : '',
                    },
                },
            ];
            // config
            if (!hideResultFlag) {
                data.config_data = {
                    skipped_color: '#ffffff',
                    incorrect_color: '#f54c4c',
                    correct_color: '#54be5a',
                };

            } else {
                data.config_data = {
                    skipped_color: '#f54c4c',
                    correct_color: '#54be5a',
                };
            }
            data.index_data = [
                {
                    color: '#54be5a',
                    text: 'correct'
                },
                {
                    color: '#f54c4c',
                    text: 'incorrect'
                },
                {
                    color: '#ffffff',
                    text: 'skipped'
                }
            ];

            if (hideResultFlag) {
                data.index_data = [{
                    color: '#54be5a',
                    text: 'Attempted'
                },
                {
                    color: '#f54c4c',
                    text: 'Unattempted'
                },]
                data.attempted = correctCount + inCorrectCount;
                data.unattempted = skippedCount;
            }
            data.show_result = !hideResultFlag
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
        const responseData = {
            meta: {
                code: 500,
            },
            data: {
                message: e,
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function getleaderboard(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const test_id = req.params.testId;
        const getleaderboard = await TestSeries.getleaderboardByTestId(db.mysql.read, test_id);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: getleaderboard,
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
        const deleteResult = await db.mysql.write.query(deleteResultSQL);
        const deleteReport = await db.mysql.write.query(deleteReportCardSQL);

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
                testCorrectOptionsGrouped = _.groupBy(testCorrectOptions, 'questionbank_id');
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
                        const incorrectreward = test_questions[i].incorrect_reward;

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
                const resultCreated = await TestQuestions.insertResult(db.mysql.write, resultInstObj);
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

                const saveReportcard = await TestSeries.saveReportcard(db.mysql.write, studentreportcardData);
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

function testSeriesArrayResponseFormatterQuiz(testdata) {
    // console.log(groupedSubData)
    for (let i = testdata.length - 1; i >= 0; i--) {
        const test = testdata[i];
        testdata[i].can_attempt = false;
        testdata[i].can_attempt_prompt_message = '';
        testdata[i].test_subscription_id = '';
        testdata[i].in_progress = false;
        testdata[i].attempt_count = 0;
        testdata[i].last_grade = '';

        if (testdata[i].status == 'COMPLETED') {
            testdata[i].subscriptiondata = [{
                id: testdata[i].id,
                test_id: testdata[i].test_id,
                student_id: testdata[i].student_id,
                status: testdata[i].status,
                class_code: testdata[i].class_code,
            }];
            testdata[i].can_attempt = false;
            testdata[i].attempt_count = 1;
            testdata[i].test_subscription_id = testdata[i].id;
        } else {
            testdata[i].subscriptiondata = [];
            testdata[i].can_attempt = true;
        }
    }
    return testdata;
}

function testSeriesArrayResponseFormatter(testdata, subscriptiondata, filter) {
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

async function getMockTests(req, res) {
}

function testSectionArrayResponseFormatter(data) {
    return data;
}

function testQuestionsArrayResponseFormatter(data) {
    return data;
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

module.exports = {
    getMockTests, getTestSeries, getRulesById, getQuestionsByTestWithData, subscibeUserForTest, saveStudentResponse, submitTest, getResult, inProgressStudentResponse, getleaderboard, getQuestionsByTestSectionsWithData, getMockResult, repopulateResult, getSingleTestData,
};
