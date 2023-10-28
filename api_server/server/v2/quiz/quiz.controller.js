/* eslint-disable array-callback-return */
/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const Quiz = require('../../../modules/quiz');
const Utility = require('../../../modules/utility');
const QuizContainer = require('../../../modules/containers/quiz');

let db;

async function getQuizDetails(req, res, next) {
    db = req.app.get('db');
    const { student_id } = req.user;

    let promises = [];
    try {
        const quiz = await QuizContainer.getQuizDetails(req.user.student_class, db);
        if (quiz.length > 0) {
            for (let i = 0; i < quiz.length; i++) {
                promises = [];
                promises.push(QuizContainer.getQuizQuestionsById(quiz[i].quiz_id, db));
                promises.push(QuizContainer.getQuizQuestionsOption(quiz[i].quiz_id, db));
                promises.push(Quiz.isQuizAttempted(quiz[i].quiz_id, student_id, db.mysql.read));
                promises.push(QuizContainer.getQuizRulesById(quiz[i].quiz_id, db));

                const resolvedPromiseData = await Promise.all(promises);
                // console.log(resolvedPromiseData)
                const groupedOptions = _.groupBy(resolvedPromiseData[1], 'question_id');
                // console.log(quiz)
                quiz[i].is_attempt = 0;
                if (resolvedPromiseData[2][0].sum) {
                    quiz[i].is_attempt = 1;
                }
                for (let j = 0; j < resolvedPromiseData[0].length; j++) {
                    if (typeof (groupedOptions[resolvedPromiseData[0][j].question_id]) !== 'undefined') {
                        resolvedPromiseData[0][j].option_value = groupedOptions[resolvedPromiseData[0][j].question_id];
                    }
                }
                quiz[i].questions = resolvedPromiseData[0];
                quiz[i].rules = resolvedPromiseData[3];
            }

            // get questions
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success!',
                },
                data: quiz,
            };
            res.status(responseData1.meta.code).json(responseData1);
        } else {
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'No active quiz',
                },
                data: [],
            };
            res.status(responseData1.meta.code).json(responseData1);
        }
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData1 = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error",
    //     "error": e
    //   },
    //   "data": null
    // }
    // res.status(responseData1.meta.code).json(responseData1)
    }
}

// Saayon added______________________________________________________________________________
async function getQuizDetailsById(req, res, next) {
    db = req.app.get('db');

    // quiz id from params
    const quizId = req.params.id;
    const { student_id } = req.user;
    let promises = [];
    // console.log("This is the value of id :");
    // console.log(quizId);
    try {
        const quiz = await QuizContainer.getQuizDetailsById(quizId, db);
        // console.log("quiz")
        // console.log(quiz)
        if (quiz.length > 0) {
            for (let i = 0; i < quiz.length; i++) {
                promises = [];
                promises.push(QuizContainer.getQuizQuestionsById(quizId, db));
                promises.push(QuizContainer.getQuizQuestionsOption(quizId, db));
                promises.push(Quiz.isQuizAttempted(quizId, student_id, db.mysql.read));
                promises.push(QuizContainer.getQuizRulesById(quizId, db));

                const resolvedPromiseData = await Promise.all(promises);
                // console.log(resolvedPromiseData)
                const groupedOptions = _.groupBy(resolvedPromiseData[1], 'question_id');
                // console.log(quiz)
                quiz[i].is_attempt = 0;
                if (resolvedPromiseData[2][0].sum) {
                    quiz[i].is_attempt = 1;
                }
                for (let j = 0; j < resolvedPromiseData[0].length; j++) {
                    if (typeof (groupedOptions[resolvedPromiseData[0][j].question_id]) !== 'undefined') {
                        resolvedPromiseData[0][j].option_value = groupedOptions[resolvedPromiseData[0][j].question_id];
                    }
                }
                quiz[i].questions = resolvedPromiseData[0];
                quiz[i].rules = resolvedPromiseData[3];
            }

            // get questions
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success!',
                },
                data: quiz[0],
            };
            res.status(responseData1.meta.code).json(responseData1);
        } else {
            const responseData1 = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'No active quiz',
                },
                data: [],
            };
            res.status(responseData1.meta.code).json(responseData1);
        }
    } catch (e) {
    // console.log(e)
        next(e);

        // let responseData1 = {
        //   "meta": {
        //     "code": 403,
        //     "success": false,
        //     "message": "Error",
        //     "error": e
        //   },
        //   "data": null
        // }
        // res.status(responseData1.meta.code).json(responseData1)
    }
}

// __________________________________________________________________________________________
async function submitAnswer(req, res, next) {
    const { student_id } = req.user;
    const { quiz_id, question_id } = req.body;
    let { option_id, is_skipped } = req.body;
    option_id = JSON.parse(option_id);
    let score; let is_correct; let
        QuizScore;
    let eligible = null;
    db = req.app.get('db');
    try {
    // //console.log('0')
        const promises = [];
        // get question details
        promises.push(QuizContainer.getQuiznQuestion(quiz_id, question_id, db));
        promises.push(QuizContainer.getQuizQuestionsOptionWithCorrect(quiz_id, question_id, db));
        // //console.log('1')
        const resolvedPromises = await Promise.all(promises);
        // //console.log("resolvedPromises")
        // //console.log(resolvedPromises)
        if (resolvedPromises[0].length > 0) {
            // check if it is skipped
            if (is_skipped == 1) {
                score = 0;
                if (Utility.checkcAnswer(resolvedPromises[0])) {
                    eligible = 1;
                } else {
                    eligible = 0;
                }
                is_correct = 2;
                await Quiz.submitStudentAnswer(quiz_id, student_id, question_id, JSON.stringify(option_id), score, is_correct, eligible, is_skipped, db.mysql.write);

                QuizScore = await Quiz.getStudentQuizScore(quiz_id, student_id, db.mysql.read);
                // console.log(QuizScore)
                const responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'SUCCESS',
                    },
                    data: {
                        is_correct,
                        total_score: ((QuizScore.length > 0) && (typeof QuizScore[0].total_score !== 'undefined')) ? QuizScore[0].total_score : 0,
                        is_eligible: eligible,
                    },
                };
                res.status(responseData.meta.code).json(responseData);
            } else {
                is_skipped = 0;
                // check question type
                if (resolvedPromises[0][0].q_type == 0) {
                    is_correct = 0;
                    // //console.log(option_id)
                    for (let i = 0; i < resolvedPromises[1].length; i++) {
                        if (option_id[0] == resolvedPromises[1][i].id) {
                            is_correct = 1;
                        }
                    }
                    if (is_correct) {
                        // //console.log('correct answer')
                        score = resolvedPromises[0][0].q_pos_mark;
                    } else {
                        // //console.log("incorrect")
                        score = resolvedPromises[0][0].q_neg_mark;
                    }
                    if (Utility.checkcAnswer(resolvedPromises[0])) {
                        eligible = 1;
                    } else {
                        eligible = 0;
                    }
                    await Quiz.submitStudentAnswer(quiz_id, student_id, question_id, JSON.stringify(option_id), score, is_correct, eligible, is_skipped, db.mysql.write);

                    QuizScore = await Quiz.getStudentQuizScore(quiz_id, student_id, db.mysql.read);
                    // //console.log(QuizScore)
                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: {
                            is_correct,
                            total_score: ((QuizScore.length > 0) && (typeof QuizScore[0].total_score !== 'undefined')) ? QuizScore[0].total_score : 0,
                            is_eligible: eligible,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                } else if (resolvedPromises[0][0].q_type == 1) {
                    is_correct = 1;
                    // //console.log(resolvedPromises[1])
                    const groupedCorrectOptions = _.groupBy(resolvedPromises[1], 'id');
                    // //console.log(groupedCorrectOptions)
                    // //console.log("option_id")
                    // //console.log(option_id)
                    option_id.map((id) => {
                        // console.log(id)
                        if (typeof groupedCorrectOptions[id] === 'undefined') {
                            // //console.log('incorrect')
                            is_correct = 0;
                        } else {
                            // //console.log('correct')
                        }
                    });
                    if (Utility.checkcAnswer(resolvedPromises[0])) {
                        eligible = 1;
                    } else {
                        eligible = 0;
                    }
                    if (is_correct) {
                        score = resolvedPromises[0][0].q_pos_mark;
                    } else {
                        score = resolvedPromises[0][0].q_neg_mark;
                    }

                    await Quiz.submitStudentAnswer(quiz_id, student_id, question_id, JSON.stringify(option_id), score, is_correct, eligible, is_skipped, db.mysql.write);
                    QuizScore = await Quiz.getStudentQuizScore(quiz_id, student_id, db.mysql.read);

                    const responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message: 'SUCCESS',
                        },
                        data: {
                            is_correct,
                            total_score: ((QuizScore.length > 0) && (typeof QuizScore[0].total_score !== 'undefined')) ? QuizScore[0].total_score : 0,
                            is_eligible: eligible,
                        },
                    };
                    res.status(responseData.meta.code).json(responseData);
                }
            }
        } else {
            // invalid quiz id or question id
            const responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Invalid quiz id',
                },
                data: null,
                // "error": e
            };
            res.status(responseData.meta.code).json(responseData);
        }
    } catch (e) {
    // console.log(e)
        if (e.code === 'ER_DUP_ENTRY') {
            QuizScore = await Quiz.getStudentQuizScore(quiz_id, student_id, db.mysql.read);

            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Cover up due to android client bug.',
                },
                data: {
                    is_correct,
                    total_score: ((QuizScore.length > 0) && (typeof QuizScore[0].total_score !== 'undefined')) ? QuizScore[0].total_score : 0,
                    is_eligible: eligible,
                },
            };
            res.status(responseData.meta.code).json(responseData);
        } else {
            next(e);
        }
    }
}

async function getTopScorers(req, res, next) {
    db = req.app.get('db');
    const { quiz_id } = req.params;
    const { student_id } = req.user;
    try {
        const data = {}; const
            promises = [];
        promises.push(Quiz.getStudentQuizScore(quiz_id, student_id, db.mysql.read));
        promises.push(Quiz._gettopScores(quiz_id, db.mysql.read));
        // get current stats
        // //console.log(score)
        const resolvedPromises = await Promise.all(promises);
        // console.log(resolvedPromises)
        data.stats = resolvedPromises[0][0];
        data.winner_list = resolvedPromises[1];
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
    // console.log(e)
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData)
    }
}

async function getReport(req, res, next) {
    db = req.app.get('db');
    const { quiz_id } = req.params;
    const { student_id } = req.user;
    try {
        const promises = []; const
            data = {};
        data.questions = [];
        promises.push(QuizContainer.getQuizQuestionsById(quiz_id, db));
        promises.push(QuizContainer.getQuizQuestionsOptionWithResult(quiz_id, db));
        promises.push(Quiz.getQuizResult(quiz_id, student_id, db.mysql.read));
        promises.push(Quiz.getStudentQuizScoreWithoutEligibility(quiz_id, student_id, db.mysql.read));
        const resolvedPromiseData = await Promise.all(promises);
        // console.log("resolvedPromiseData")
        // console.log(resolvedPromiseData)
        const groupedOptions = _.groupBy(resolvedPromiseData[1], 'question_id');
        const groupedResult = _.groupBy(resolvedPromiseData[2], 'question_id');
        data.score = ((resolvedPromiseData[3].length > 0) && (typeof resolvedPromiseData[3][0].total_score !== 'undefined')) ? resolvedPromiseData[3][0].total_score : 0;
        for (let i = 0; i < resolvedPromiseData[0].length; i++) {
            if (typeof groupedResult[resolvedPromiseData[0][i].question_id] !== 'undefined') {
                resolvedPromiseData[0][i].is_attempt = 1;
                resolvedPromiseData[0][i].is_correct = groupedResult[resolvedPromiseData[0][i].question_id][0].is_correct;
                resolvedPromiseData[0][i].is_eligible = groupedResult[resolvedPromiseData[0][i].question_id][0].eligible;
            } else {
                resolvedPromiseData[0][i].is_attempt = 0;
            }
            for (let j = 0; j < groupedOptions[resolvedPromiseData[0][i].question_id].length; j++) {
                if (typeof groupedResult[resolvedPromiseData[0][i].question_id] !== 'undefined') {
                    if (typeof groupedResult[resolvedPromiseData[0][i].question_id][0].opt_selected === 'string') {
                        groupedResult[resolvedPromiseData[0][i].question_id][0].opt_selected = JSON.parse(groupedResult[resolvedPromiseData[0][i].question_id][0].opt_selected);
                    }
                    if (groupedResult[resolvedPromiseData[0][i].question_id][0].opt_selected.includes(groupedOptions[resolvedPromiseData[0][i].question_id][j].option_id.toString())) {
                        groupedOptions[resolvedPromiseData[0][i].question_id][j].is_user_selected = 1;
                    } else {
                        groupedOptions[resolvedPromiseData[0][i].question_id][j].is_user_selected = 0;
                    }
                } else {
                    groupedOptions[resolvedPromiseData[0][i].question_id][j].is_user_selected = 0;
                }
            }
            if (typeof (groupedOptions[resolvedPromiseData[0][i].question_id]) !== 'undefined') {
                resolvedPromiseData[0][i].option_value = groupedOptions[resolvedPromiseData[0][i].question_id];
            }
            data.questions.push(resolvedPromiseData[0][i]);
        }


        const responseData1 = {
            meta: {
                code: 200,
                success: true,
                message: 'Success!',
            },
            data,
        };
        res.status(responseData1.meta.code).json(responseData1);
    } catch (e) {
    // console.log(e)
        next(e);

    // let responseData = {
    //   "meta": {
    //     "code": 403,
    //     "success": false,
    //     "message": "Error",
    //   },
    //   "data": null,
    //   "error": e
    // }
    // res.status(responseData.meta.code).json(responseData)
    }
}


module.exports = {
    getQuizDetails, getQuizDetailsById, submitAnswer, getTopScorers, getReport,
};
