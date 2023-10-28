/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-09-26T19:07:57+05:30
*/


const _ = require('lodash')
const Utility = require('../../../modules/utility')
const TestSeries = require('../../../modules/mysql/testseries')
const TestSections = require('../../../modules/mysql/testsections')
const TestQuestions = require('../../../modules/mysql/testquestions')
const Rules = require('../../../modules/mysql/rules')
const StudentTestsSubsriptions = require('../../../modules/mysql/student_test_subscriptions')
const StudentTestResponse = require('../../../modules/mysql/studenttestresponse')
const Notification = require('../../../modules/notifications')
let db, config, client
const moment = require('moment');

async function getTestSeries(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let studentId = req.user.student_id
        //console.log(studentId);
        let filter = req.params['filter']
        let response
        let student_class = req.user.student_class
        if (filter === 'active') {
            let type = "QUIZ"
            let quizData = await TestSeries.getActiveTestsByAppModuleWithCompletedSubscriptionData(db.mysql.read, student_class, type, studentId)
            response = testSeriesArrayResponseFormatterQuiz(quizData)
        } else if (filter = 'active_mock_test') {
            let type = "TEST"
            let testSeriesData = TestSeries.getActiveByAppModule(db.mysql.read, student_class, type)
            let student_subscription_data = StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentId(db.mysql.read, studentId)
            testSeriesData = await testSeriesData
            student_subscription_data = await student_subscription_data
            response = testSeriesArrayResponseFormatter(testSeriesData, student_subscription_data, filter)
        }
        else {
            throw new Error('not valid filter');
        }

        // [testSeriesData,student_subscription_data] = await Promise.all([testSeriesData,StudentTestsSubsriptions.getStudentTestsSubsriptionsByStudentId(db.mysql.read,studentId)]);
        let responseData =
        {
            "meta":
            {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": response
        }
        res.status(responseData.meta.code).json(responseData)
    } catch (e) {
        next(e)
    }
}
async function getRulesById(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')

        let ruleId = req.params['ruleId']

        let ruleData = await Rules.getRulesById(db.mysql.read, ruleId)
        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": ruleDataResponseFormatter(ruleData)
        }
        res.status(responseData.meta.code).json(responseData)
    } catch (e) {
        next(e)
    }
}
async function subscibeUserForTest(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let studentId = req.user.student_id
        let classCode = req.user.student_class
        let testId = req.params['testId']
        let completedSubscriptionData = await TestSeries.getTestSubscriptionByStatusAndStudentIdAndTestId(db.mysql.write, testId, studentId, "COMPLETED")
        if (completedSubscriptionData.length > 0) {
            let responseData =
            {
                "meta":
                {
                    "code": 403,
                    "success": false,
                    "message": "Test  has been completed"
                },
                "data": []
            }
            res.status(responseData.meta.code).json(responseData)
        } else {
            let subscriptionData = await TestSeries.getTestSubscriptionByStatusAndStudentIdAndTestId(db.mysql.write, testId, studentId, "SUBSCRIBED")
            let subscriptionInsertData
            let data
            if (subscriptionData.length > 0) {
                data = { test_subscription_id: subscriptionData[0]['id'] }
            } else {
                let insertObj = { student_id: studentId, test_id: testId, class_code: classCode, status: "SUBSCRIBED" };
                subscriptionInsertData = await TestSeries.insertStudentSubscription(db.mysql.write, insertObj);
                data = { test_subscription_id: subscriptionInsertData['insertId'] }
            }

            let responseData =
            {
                "meta":
                {
                    "code": 200,
                    "success": true,
                    "message": "SUCCESS"
                },
                "data": data
            }
            res.status(responseData.meta.code).json(responseData)
        }

    } catch (e) {
        next(e)
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
        db = req.app.get('db')
        config = req.app.get('config')
        let testId = req.params['testId']
        let testData = await TestSeries.getTestSeriesById(db.mysql.read, testId)
        let testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, testId)

        let testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, testId)
        let questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',')
        let questionOptionData = await TestQuestions.getAllOptionsByQuestionIdsWithoutIsAnswer(db.mysql.read, questionBankKeysString)
        questionOptionDataGrouped = _.groupBy(questionOptionData, 'questionbank_id')
        let formatedData = testQuestionsWithSectionsDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped, testSections)
        let groupedformatedData = _.groupBy(formatedData, 'section_code')
        let questionsOrderBySections = []
        let sectionMeta = _.map(testSections, section => {
            //console.log(section)
            //console.log(groupedformatedData[section.section_code])
            section.startingIndex = questionsOrderBySections.length
            section.endingIndex = groupedformatedData[section.section_code].length - 1
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code])
            return section
        })
        let data = { questions: questionsOrderBySections, sections: sectionMeta }
        let responseData =
        {
            "meta":
            {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": data
        }
        res.status(responseData.meta.code).json(responseData)

    } catch (e) {
        next(e)
    }
}
async function inProgressStudentResponse(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        test_subscription_id = req.params['testsubscriptionId']
        let inProgressResponse = await StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.write, test_subscription_id)
        let test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        //console.log(test_subscriptionData)
        let groupedInprogressData = _.groupBy(inProgressResponse, 'questionbank_id')
        let test_questions = await TestQuestions.getAllTestQuestionsByTestId(db.mysql.read, test_subscriptionData[0]['test_id'])
        let testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, test_subscriptionData[0]['test_id'])
        let formatedData = _.map(test_questions, question => {
            //console.log(groupedInprogressData[question.questionbank_id])
            let questiontype = {
                'questionbank_id': question.questionbank_id,
                'section_code': question.section_code
            }
            if (groupedInprogressData[question.questionbank_id]) {
                questiontype.option_codes = groupedInprogressData[question.questionbank_id][0].option_codes
                questiontype.action_type = groupedInprogressData[question.questionbank_id][0].action_type
            } else {
                questiontype.option_codes = ""
                questiontype.action_type = "SKIP"

            }
            return questiontype
        })
        let groupedformatedData = _.groupBy(formatedData, 'section_code')
        let questionsOrderBySections = []
        let sectionMeta = _.map(testSections, section => {
            //console.log(section)
            //console.log(groupedformatedData[section.section_code])
            section.startingIndex = questionsOrderBySections.length
            section.endingIndex = groupedformatedData[section.section_code].length - 1
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code])
            return section
        })
        let data = { questions: questionsOrderBySections, sections: sectionMeta }

        let responseData =
        {
            "meta":
            {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": questionsOrderBySections
        }
        res.status(responseData.meta.code).json(responseData)
    } catch (e) {
        next(e)
    }
}
async function saveStudentResponse(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        //console.log(req.body);
        let student_id = req.user.student_id
        let test_id = req.body.test_id
        let questionbank_id = req.body.questionbank_id
        let action_type = req.body.action_type
        let review_status = req.body.review_status
        let option_codes = req.body.option_code
        let section_code = req.body.section_code
        let test_subscription_id = req.body.test_subscription_id
        let question_type = req.body.question_type
        let eligible_status = await TestSeries.getTestSeriesEligibleScoreStatus(db.mysql.write, test_id)
        let is_eligible = eligible_status[0].eligible_status
        //let is_eligible = req.body.is_eligible
        let time_taken = req.body.time_taken
        let responseId = ""
        let responseExist = await StudentTestResponse.getStudentResponse(db.mysql.write, test_subscription_id, questionbank_id)
        let insertObj = {
            student_id: student_id,
            test_subscription_id: test_subscription_id,
            test_id: test_id,
            questionbank_id: questionbank_id,
            question_type: question_type,
            action_type: action_type,
            review_status: review_status,
            option_codes: option_codes,
            section_code: section_code,
            is_eligible: is_eligible,
            time_taken: time_taken
        }
        if (responseExist.length > 0) {
            let updateobj = {
                student_id: student_id,
                test_subscription_id: test_subscription_id,
                test_id: test_id,
                questionbank_id: questionbank_id,
                question_type: question_type,
                action_type: action_type,
                review_status: review_status,
                option_codes: option_codes,
                section_code: section_code,
                is_eligible: is_eligible,
                time_taken: time_taken
            }
            let is_update = await StudentTestResponse.updateStudentResponse(db.mysql.write, updateobj)
        } else {
            let is_saved = await StudentTestResponse.saveStudentResponse(db.mysql.write, insertObj)
        }

        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": {
            }
        }
        res.status(responseData.meta.code).json(responseData)

    } catch (e) {
        next(e)
    }
}


async function submitTest(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let studentId = req.user.student_id
        let totalscore = 0
        let totalmarks = 0
        let correct = []
        let incorrect = []
        let skipped = []
        let eligiblescore = 0
        let test_subscription_id = req.params['testsubscriptionId'];
        let test_subscriptionData = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);

        let student_test_responses = StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.read, test_subscription_id)
        test_subscriptionData = await test_subscriptionData
        if (test_subscriptionData.length == 0) {
            test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        student_test_responses = await student_test_responses
        //console.log(test_subscriptionData);
        // [test_subscriptionData,student_test_responses] = await Promise.all([test_subscriptionData,student_test_responses])
        let test_questions = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscriptionData[0]['test_id'])
        if (test_subscriptionData[0]['status'] !== 'COMPLETED') {
            let groupedTestQuestions = _.groupBy(test_questions, 'questionbank_id')
            let groupedSTR = _.groupBy(student_test_responses, 'questionbank_id')
            let questionbankIdsStringKey = _.join(_.keys(groupedTestQuestions), ',')
            let testCorrectOptions = await TestQuestions.getAllCorrectOptionsByQuestionIds(db.mysql.read, questionbankIdsStringKey)
            testCorrectOptionsGrouped = _.groupBy(testCorrectOptions, 'questionbank_id')
            let resultInstObj = []
            for (var i = test_questions.length - 1; i >= 0; i--) {
                let resultIns = [
                    test_subscriptionData[0]['student_id'],
                    test_subscriptionData[0]['test_id'],
                    test_subscriptionData[0]['id'],
                    test_questions[i]['questionbank_id'],
                    test_questions[i]['section_code'],
                    test_questions[i]['subject_code'],
                    test_questions[i]['chapter_code'],
                    test_questions[i]['subtopic_code'],
                    test_questions[i]['mc_code'],
                    test_questions[i]['correct_reward']
                ];
                let questionCorrectOptions = testCorrectOptionsGrouped[test_questions[i]['questionbank_id']]
                let questionCorrectOptionsArray = _.keys(_.groupBy(questionCorrectOptions, 'option_code'))
                let questionCorrectOptionsString = _.join(questionCorrectOptionsArray, ',')
                resultIns.push(questionCorrectOptionsString)
                let is_correct = true;
                let is_nagative = false;
                let is_skipped = true;
                let is_eligible;
                let questionbankId = test_questions[i]['questionbank_id'];
                if (groupedSTR[questionbankId]) {
                    let studentResponse = groupedSTR[questionbankId][0];
                    resultIns.push(studentResponse['option_codes'])
                    is_eligible = studentResponse['is_eligible'];
                    let responseOptions = _.split(studentResponse.option_codes, ',');
                    if (studentResponse.option_codes !== '' && studentResponse.option_codes !== null && responseOptions.length > 0) {
                        is_skipped = false;
                        if (responseOptions.length == questionCorrectOptionsArray.length) {
                            _.forEach(responseOptions, function (userResponse) {
                                if (!_.includes(questionCorrectOptionsArray, _.trim(userResponse))) {
                                    is_correct = false;
                                    is_nagative = true;
                                }
                            })
                        } else {
                            is_correct = false;
                            is_nagative = true;
                        }
                    } else {
                        is_correct = false;
                    };
                } else {
                    resultIns.push("")
                    is_correct = false;
                }
                if (is_correct) {
                    if (is_eligible) {
                        eligiblescore += test_questions[i]['correct_reward']
                    }
                    correct.push(test_questions[i]['questionbank_id']);
                    resultIns.push(test_questions[i]['correct_reward']);
                    totalscore += test_questions[i]['correct_reward'];
                } else if (is_nagative) {
                    incorrect.push(test_questions[i]['questionbank_id']);
                    let incorrectreward = test_questions[i]['incorrect_reward'];
                    resultIns.push(test_questions[i]['incorrect_reward'])
                    totalscore += test_questions[i]['incorrect_reward'];
                    if (is_eligible) {
                        eligiblescore += test_questions[i]['incorrect_reward']
                    }
                } else {
                    skipped.push(test_questions[i]['questionbank_id']);
                    let skippedreward = 0;
                    resultIns.push(skippedreward)
                }
                resultIns.push(is_correct);
                resultIns.push(is_skipped);
                resultInstObj.push(resultIns);
                totalmarks += test_questions[i]['correct_reward']
            }
            let resultCreated = TestQuestions.insertResult(db.mysql.write, resultInstObj);
            let studentreportcardData = {
                student_id: test_subscriptionData[0]['student_id'],
                test_id: test_subscriptionData[0]['test_id'],
                test_subscription_id: test_subscriptionData[0]['id'],
                totalscore: totalscore,
                totalmarks: totalmarks,
                correct: _.join(correct, ','),
                incorrect: _.join(incorrect, ','),
                skipped: _.join(skipped, ','),
                eligiblescore: eligiblescore
            }
            let saveReportcard = TestSeries.saveReportcard(db.mysql.write, studentreportcardData)
            resultCreated = await resultCreated
            saveReportcard = await saveReportcard
            let subscriptionUpdateData = await TestSeries.updateTestSubscriptionStatus(db.mysql.write, test_subscriptionData[0]['id'], 'COMPLETED');
            Notification.sendMocktestSubmitNotification(studentId, test_subscriptionData[0]['test_id'], null, db, config.cdn_url)
            let responseData = {
                "meta": {
                    "code": 200,
                    "success": true,
                    "message": "SUCCESS"
                },
                "data": studentreportcardData
            }
            res.status(responseData.meta.code).json(responseData)

        } else {
            throw new Error('test already completed');
        }
    } catch (e) {
        next(e)
    }
}

async function getResult(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        test_subscription_id = req.params['testsubscriptionId']
        let test_subscription_data = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let result = TestSeries.getResultByTestSubscriptionId(db.mysql.write, test_subscription_id)
        let reportCard = TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, test_subscription_id)
        test_subscription_data = await test_subscription_data
        if (test_subscription_data.length == 0) {
            test_subscription_data = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        result = await result
        reportCard = await reportCard
        resultGrouped = _.groupBy(result, 'questionbank_id')

        //console.log(test_subscription_data)
        let testData = await TestSeries.getTestSeriesDataById(db.mysql.read, test_subscription_data[0]['test_id'])
        if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
            reportCard[0]['eligiblescore'] = 0
            reportCard[0]['totalscore'] = 0

        }
        let testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscription_data[0]['test_id'])
        let questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',')
        let questionsOptionData = await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read, questionBankKeysString)
        questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id')
        let questionWiseResult = []
        _.forEach(testQuestionsData, function (question) {
            let questionOptions = questionsOptionDataGrouped[question['questionbank_id']]
            let questionResult = resultGrouped[question['questionbank_id']][0]
            let questionResultOptions = _.split(questionResult['response_options'], ',')
            for (var i = questionOptions.length - 1; i >= 0; i--) {
                if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
                    questionOptions[i]['is_answer'] = 0
                }
                if (_.includes(questionResultOptions, questionOptions[i]['option_code'])) {
                    //Is Selected
                    //
                    questionOptions[i]['is_selected'] = 1
                } else {
                    questionOptions[i]['is_selected'] = 0
                }
            }
            if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
                question['is_correct'] = 0
            } else {
                question['is_correct'] = questionResult['is_correct']
            }
            if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
                question['marks_scored'] = 0
            } else {
                question['marks_scored'] = questionResult['marks_scored']
            }
            question['options'] = questionOptions
            question['is_skipped'] = questionResult['is_skipped']
            //question['marks_scored'] = questionResult['marks_scored']

            questionWiseResult.push(question)
        })
        if (moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(testData[0].unpublish_time)) {
            reportCard[0]['skipped'] = _.trim(reportCard[0]['correct'] + "," + reportCard[0]['skipped'], ',')
            reportCard[0]['skipped'] = _.trim(reportCard[0]['incorrect'] + "," + reportCard[0]['skipped'], ',')
            reportCard[0]['incorrect'] = ""
            reportCard[0]['correct'] = ""
        }
        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": { "questionwise_result": questionWiseResult, "report_card": reportCard[0] }
        }
        res.status(responseData.meta.code).json(responseData)
    } catch (e) {
        next(e)
    }
}

async function getMockResult(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        test_subscription_id = req.params['testsubscriptionId']
        let test_subscription_data = TestSeries.getTestSubscriptionById(db.mysql.read, test_subscription_id);
        let result = TestSeries.getResultByTestSubscriptionId(db.mysql.write, test_subscription_id)
        let reportCard = TestSeries.getRepostCardByTestSubscriptionId(db.mysql.write, test_subscription_id)
        result = await result
        reportCard = await reportCard
        resultGrouped = _.groupBy(result, 'questionbank_id')
        test_subscription_data = await test_subscription_data
        if (test_subscription_data.length == 0) {
            test_subscription_data = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
        }
        let testData = await TestSeries.getTestSeriesDataById(db.mysql.read, test_subscription_data[0]['test_id'])
        let testSections = await TestSections.getActiveTestSectionByTestSeriesId(db.mysql.read, test_subscription_data[0]['test_id'])
        let groupedTestSections = _.groupBy(testSections, 'section_code')
        let testQuestionsData = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscription_data[0]['test_id'])
        let questionBankKeysString = _.join(_.keys(_.groupBy(testQuestionsData, 'questionbank_id')), ',')
        let questionsOptionData = await TestQuestions.getAllOptionsByQuestionIds(db.mysql.read, questionBankKeysString)
        questionsOptionDataGrouped = _.groupBy(questionsOptionData, 'questionbank_id')
        let questionWiseResult = []
        _.forEach(testQuestionsData, function (question) {
            let questionOptions = questionsOptionDataGrouped[question['questionbank_id']]
            let questionResult = resultGrouped[question['questionbank_id']][0]
            let questionResultOptions = _.split(questionResult['response_options'], ',')
            for (var i = questionOptions.length - 1; i >= 0; i--) {
                // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
                //	questionOptions[i]['is_answer'] = 0
                // }
                if (_.includes(questionResultOptions, questionOptions[i]['option_code'])) {
                    //Is Selected
                    //
                    questionOptions[i]['is_selected'] = 1
                } else {
                    questionOptions[i]['is_selected'] = 0
                }
            }
            question['is_correct'] = questionResult['is_correct']
            // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
            // 	question['is_correct'] = 0
            // }else{
            // }
            // question['marks_scored'] = questionResult['marks_scored']
            // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
            // 	question['marks_scored'] = 0
            // }else{
            // }
            question['options'] = questionOptions
            question['is_skipped'] = questionResult['is_skipped']
            question['marks_scored'] = questionResult['marks_scored']
            question['section_title'] = groupedTestSections[question['section_code']][0].title

            questionWiseResult.push(question)
        })
        // if ( moment(moment().add(5, 'h').add(30,'m').toISOString()).isBefore(testData[0].unpublish_time)) {
        // 	reportCard[0]['skipped'] = _.trim(reportCard[0]['correct'] +","+reportCard[0]['skipped'],',')
        // 	reportCard[0]['skipped'] = _.trim(reportCard[0]['incorrect'] +","+reportCard[0]['skipped'],',')
        // 	reportCard[0]['incorrect'] = ""
        // 	reportCard[0]['correct'] = ""
        // }
        let groupedformatedData = _.groupBy(questionWiseResult, 'section_code')
        let questionsOrderBySections = []
        let sectionMeta = _.map(testSections, section => {
            section['marks_scored'] = _.sumBy(groupedformatedData[section.section_code], 'marks_scored')
            section['correct'] = _.sumBy(groupedformatedData[section.section_code], 'is_correct')
            section['skipped'] = _.sumBy(groupedformatedData[section.section_code], 'is_skipped')
            section['incorrect'] = groupedformatedData[section.section_code].length - section['correct'] - section['skipped']
            //console.log(groupedformatedData[section.section_code])
            section.startingIndex = questionsOrderBySections.length
            section.endingIndex = groupedformatedData[section.section_code].length - 1
            questionsOrderBySections = _.concat(questionsOrderBySections, groupedformatedData[section.section_code])
            return section
        })
        let data = { questionwise_result: questionsOrderBySections, sections: sectionMeta, "report_card": reportCard[0] }

        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": data
        }
        res.status(responseData.meta.code).json(responseData)
    } catch (e) {
        next(e)
    }
}
async function getleaderboard(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let test_id = req.params['testId']
        let getleaderboard = await TestSeries.getleaderboardByTestId(db.mysql.read, test_id)
        let responseData = {
            "meta": {
                "code": 200,
                "success": true,
                "message": "SUCCESS"
            },
            "data": getleaderboard
        }
        res.status(responseData.meta.code).json(responseData)

    } catch (e) {
        next(e)
    }
}
async function repopulateResult(req, res, next) {
    try {
        db = req.app.get('db')
        config = req.app.get('config')
        let test_id = req.params['testId']
        let completedSubmit = await StudentTestsSubsriptions.getCompletedTestSubIds(db.mysql.write, test_id)
        let completedIds = _.keys(_.groupBy(completedSubmit, 'id'))
        let completedsubIds = _.join(completedIds, ',')

        let deleteResultSQL = "DELETE FROM `testseries_student_results` WHERE test_subscription_id IN (" + completedsubIds + ")"
        let deleteReportCardSQL = "DELETE FROM `testseries_student_reportcards` WHERE test_subscription_id IN (" + completedsubIds + ")"
        let deleteResult = await db.mysql.write.query(deleteResultSQL)
        let deleteReport = await db.mysql.write.query(deleteReportCardSQL)



        for (var j = completedIds.length - 1; j >= 0; j--) {
            let totalscore = 0
            let totalmarks = 0
            let correct = []
            let incorrect = []
            let skipped = []
            let eligiblescore = 0
            let test_subscription_id = completedIds[j]
            //console.log(test_subscription_id)
            let test_subscriptionData = await TestSeries.getTestSubscriptionById(db.mysql.write, test_subscription_id);
            let student_test_responses = await StudentTestResponse.getStudentResponseByTestSubscribeId(db.mysql.read, test_subscription_id)

            //console.log(test_subscriptionData);
            // [test_subscriptionData,student_test_responses] = await Promise.all([test_subscriptionData,student_test_responses])
            let test_questions = await TestQuestions.getAllTestQuestionsByTestIdWithData(db.mysql.read, test_subscriptionData[0]['test_id'])
            if (test_subscriptionData[0]['status'] == 'COMPLETED') {
                let groupedTestQuestions = _.groupBy(test_questions, 'questionbank_id')
                let groupedSTR = _.groupBy(student_test_responses, 'questionbank_id')
                let questionbankIdsStringKey = _.join(_.keys(groupedTestQuestions), ',')
                let testCorrectOptions = await TestQuestions.getAllCorrectOptionsByQuestionIds(db.mysql.read, questionbankIdsStringKey)
                testCorrectOptionsGrouped = _.groupBy(testCorrectOptions, 'questionbank_id')
                let resultInstObj = []
                for (var i = test_questions.length - 1; i >= 0; i--) {
                    let resultIns = [
                        test_subscriptionData[0]['student_id'],
                        test_subscriptionData[0]['test_id'],
                        test_subscriptionData[0]['id'],
                        test_questions[i]['questionbank_id'],
                        test_questions[i]['section_code'],
                        test_questions[i]['subject_code'],
                        test_questions[i]['chapter_code'],
                        test_questions[i]['subtopic_code'],
                        test_questions[i]['mc_code'],
                        test_questions[i]['correct_reward']
                    ];
                    let questionCorrectOptions = testCorrectOptionsGrouped[test_questions[i]['questionbank_id']]
                    let questionCorrectOptionsArray = _.keys(_.groupBy(questionCorrectOptions, 'option_code'))
                    let questionCorrectOptionsString = _.join(questionCorrectOptionsArray, ',')
                    resultIns.push(questionCorrectOptionsString)
                    let is_correct = true;
                    let is_nagative = false;
                    let is_skipped = true;
                    let is_eligible;
                    let questionbankId = test_questions[i]['questionbank_id'];
                    if (groupedSTR[questionbankId]) {
                        let studentResponse = groupedSTR[questionbankId][0];
                        resultIns.push(studentResponse['option_codes'])
                        is_eligible = studentResponse['is_eligible'];
                        let responseOptions = _.split(studentResponse.option_codes, ',');
                        if (studentResponse.option_codes !== '' && studentResponse.option_codes !== null && responseOptions.length > 0) {
                            is_skipped = false;
                            if (responseOptions.length == questionCorrectOptionsArray.length) {
                                _.forEach(responseOptions, function (userResponse) {
                                    if (!_.includes(questionCorrectOptionsArray, _.trim(userResponse))) {
                                        is_correct = false;
                                        is_nagative = true;
                                    }
                                })
                            } else {
                                is_correct = false;
                                is_nagative = true;
                            }
                        } else {
                            is_correct = false;
                        };
                    } else {
                        resultIns.push("")
                        is_correct = false;
                    }
                    if (is_correct) {
                        if (is_eligible) {
                            eligiblescore += test_questions[i]['correct_reward']
                        }
                        correct.push(test_questions[i]['questionbank_id']);
                        resultIns.push(test_questions[i]['correct_reward']);
                        totalscore += test_questions[i]['correct_reward'];
                    } else if (is_nagative) {
                        incorrect.push(test_questions[i]['questionbank_id']);
                        let incorrectreward = test_questions[i]['incorrect_reward'];
                        resultIns.push(test_questions[i]['incorrect_reward'])
                        totalscore += test_questions[i]['incorrect_reward'];
                        if (is_eligible) {
                            eligiblescore += test_questions[i]['incorrect_reward']
                        }
                    } else {
                        skipped.push(test_questions[i]['questionbank_id']);
                        let skippedreward = 0;
                        resultIns.push(skippedreward)
                    }
                    resultIns.push(is_correct);
                    resultIns.push(is_skipped);
                    resultInstObj.push(resultIns);
                    totalmarks += test_questions[i]['correct_reward']
                }
                //console.log(resultInstObj)
                let resultCreated = await TestQuestions.insertResult(db.mysql.write, resultInstObj);
                let studentreportcardData = {
                    student_id: test_subscriptionData[0]['student_id'],
                    test_id: test_subscriptionData[0]['test_id'],
                    test_subscription_id: test_subscriptionData[0]['id'],
                    totalscore: totalscore,
                    totalmarks: totalmarks,
                    correct: _.join(correct, ','),
                    incorrect: _.join(incorrect, ','),
                    skipped: _.join(skipped, ','),
                    eligiblescore: eligiblescore
                }
                //console.log(studentreportcardData)

                let saveReportcard = await TestSeries.saveReportcard(db.mysql.write, studentreportcardData)

            }
            if (j == 0) {
                let responseData = {
                    "meta": {
                        "code": 200,
                        "success": true,
                        "message": "SUCCESS"
                    },
                    "data": "DONE Repopulating"
                }
                res.status(responseData.meta.code).json(responseData)

            }
        }



    } catch (e) {
        next(e)
    }
}

function testSeriesArrayResponseFormatterQuiz(testdata) {
    //console.log(groupedSubData)
    for (var i = testdata.length - 1; i >= 0; i--) {
        let test = testdata[i];
        testdata[i]['can_attempt'] = false;
        testdata[i]['can_attempt_prompt_message'] = "";
        testdata[i]['test_subscription_id'] = "";
        testdata[i]['in_progress'] = false;
        testdata[i]['attempt_count'] = 0;
        testdata[i]['last_grade'] = "";

        if (testdata[i].status == 'COMPLETED') {
            testdata[i]['subscriptiondata'] = [{
                id: testdata[i]['id'],
                test_id: testdata[i]['test_id'],
                student_id: testdata[i]['student_id'],
                status: testdata[i]['status'],
                class_code: testdata[i]['class_code'],
            }]
            testdata[i]['can_attempt'] = false;
            testdata[i]['attempt_count'] = 1
            testdata[i]['test_subscription_id'] = testdata[i]['id'];
        } else {
            testdata[i]['can_attempt'] = true;
            testdata[i]['subscriptiondata'] = []
        }
    }
    return testdata
}
function testSeriesArrayResponseFormatter(testdata, subscriptiondata, filter) {
    let groupedSubData = _.groupBy(subscriptiondata, 'test_id')
    //console.log(groupedSubData)
    for (var i = testdata.length - 1; i >= 0; i--) {
        let test = testdata[i];
        testdata[i]['can_attempt'] = false;
        testdata[i]['can_attempt_prompt_message'] = "";
        testdata[i]['test_subscription_id'] = "";
        testdata[i]['in_progress'] = false;
        testdata[i]['attempt_count'] = 0;
        testdata[i]['last_grade'] = "";
        if (groupedSubData[test['test_id']]) {
            let subData = _.groupBy(groupedSubData[test['test_id']], 'status');
            testdata[i]['subscriptiondata'] = groupedSubData[test['test_id']];
            if (subData['SUBSCRIBED']) {
                testdata[i]['can_attempt'] = true;
                testdata[i]['test_subscription_id'] = subData['SUBSCRIBED'][0]['id'];
            }
            if (subData['INPROGRESS']) {
                testdata[i]['in_progress'] = true;
                testdata[i]['test_subscription_id'] = subData['INPROGRESS'][0]['id'];
            }
            if (subData['COMPLETED']) {
                //
                testdata[i]['can_attempt'] = false;
                //
                testdata[i]['attempt_count'] = subData['COMPLETED'].length
                testdata[i]['test_subscription_id'] = subData['COMPLETED'][0]['id'];
            }
        } else {
            testdata[i]['can_attempt'] = true;
            testdata[i]['subscriptiondata'] = []
        }
    }
    if (filter == 'active_mock_test') {
        let groupedtestdata = _.groupBy(testdata, 'course')
        let courses = _.keys(groupedtestdata)
        let mappedData = _.map(courses, course => {
            return { course: course, tests: groupedtestdata[course] }
        })
        testdata = mappedData
    }
    return testdata
}
async function getMockTests(req, res) {
}
function testSectionArrayResponseFormatter(data) {
    return data
}
function testQuestionsArrayResponseFormatter(data) {
    return data
}
function ruleDataResponseFormatter(data) {
    data[0]['rules'] = _.split(data[0]['rule_text'], '#!#')
    return data[0]
}

function testQuestionsWithSectionsDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped, testsections) {
    let groupedTestSections = _.groupBy(testsections, 'section_code')
    let data = []
    _.forEach(testQuestionsData, function (question) {
        question['options'] = questionOptionDataGrouped[question['questionbank_id']]
        question['section_title'] = groupedTestSections[question['section_code']][0].title
        data.push(question)
    })
    return data
}
function testQuestionsWithDataArrayResponseFormatter(testQuestionsData, questionOptionDataGrouped) {
    let data = []
    _.forEach(testQuestionsData, function (question) {
        question['options'] = questionOptionDataGrouped[question['questionbank_id']]
        data.push(question)
    })
    return data
}




module.exports = { getMockTests, getTestSeries, getRulesById, getQuestionsByTestWithData, subscibeUserForTest, saveStudentResponse, submitTest, getResult, inProgressStudentResponse, getleaderboard, getQuestionsByTestSectionsWithData, getMockResult, repopulateResult }
