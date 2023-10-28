const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const QuizHelper = require('./quiz.helper');
const QuizMysql = require('../../../modules/mysql/quizWeb');
const CourseContainer = require('../../../modules/containers/coursev2');
const Data = require('../../../data/data');
const QuizRedis = require('../../../modules/redis/quizWA');
const twentyFourSevenQuizRedis = require('../../../modules/redis/twenty_four_seven_quiz');
const twentyFourSevenQuizData = require('../../../data/twenty_four_seven_quiz');

async function getDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        let {
            class: studentClass,
            subject,
            chapter,
        } = req.query;
        const { language, source } = req.query;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const widgets = [];
        studentClass = studentClass ? studentClass.toUpperCase() : studentClass;
        subject = subject ? subject.toUpperCase() : subject;
        chapter = chapter ? chapter.toUpperCase() : chapter;
        const generateObject = await QuizHelper.generateFiltersObject({
            db,
            studentClass,
            subject,
            chapter,
            language,
            page: 'QUIZ_HOME',
            source,
        });
        if (!_.isNull(generateObject)) {
            widgets.unshift(generateObject);
        }
        if (!_.isEmpty(widgets)) {
            widgets.push({
                type: 'widget_quiz_submit',
                data: {
                    title: 'Start Quiz',
                },
            });
            responseData.data.widgets = widgets;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return QuizHelper.sendError(res, e);
    }
}

async function start(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const {
            class: studentClass,
            language,
        } = req.query;
        const { student_id: studentId } = req.user;
        const { source } = req.query;
        const widgets = [];
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        let {
            subject,
            chapter,
        } = req.query;
        if (!subject || !chapter || !studentClass || !language) {
            throw new Error(`Invalid request, request parameters, subject: ${subject}, chapter: ${chapter}, studentClass: ${studentClass} and language:${language}`);
        }
        subject = subject ? subject.toUpperCase() : subject;
        chapter = chapter ? chapter.toUpperCase() : chapter;
        const generateObject = await QuizHelper.generateFiltersObject({
            db,
            studentClass,
            subject,
            chapter,
            language,
            source,
        });
        // await QuizMysql.closeActiveQuizesOnWhatsapp(db.mysql.write, studentId, source);
        const testDetails = await QuizHelper.getTestDetails({
            db,
            student_id: studentId,
            subject,
            chapter,
            studentClass,
            language,
            source,
        }) || {};
        if (!testDetails.quizQuestions || !testDetails.quizQuestions.length) {
            generateObject.data.items.forEach((item) => {
                item.data.selected_option = Data.quiz_web_default_values[`${item.data.key}`];
            });
        }
        widgets.unshift(generateObject);

        const questions = await QuizHelper.getQuestionsObject({
            db,
            versionCode: 900,
            config,
            questions: testDetails.quizQuestions,
            remainingQuestions: testDetails.remainingQuestions,
        });
        widgets.push(questions.questionsObject);
        responseData.data.widgets = widgets;
        responseData.data.session_id = uuidv4();
        QuizRedis.setActiveSessionId(db.redis.write, responseData.data.session_id, studentId);
        console.log('session id', responseData.data.session_id);

        QuizMysql.insertIntoQuizWebDetailsTable(db.mysql.write, responseData.data.session_id, studentId, 0, JSON.stringify(questions.questions), studentClass, subject, chapter, language, source);
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return QuizHelper.sendError(res, e);
    }
}

async function end(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const {
            session_id: sessionId,
            class: studentClass,
            subject,
            chapter,
            language,
            source,
        } = req.body;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const activeSessionId = await QuizRedis.getActiveSessionId(db.redis.read, studentId);
        console.log('session id', activeSessionId, sessionId);

        if (activeSessionId && activeSessionId !== sessionId) {
            throw new Error('Inactive Session Id');
        }
        QuizMysql.updateQuizWebDetailsTable(db.mysql.write, sessionId, studentId);
        const subTitle = await CourseContainer.getAppConfigurationContent(db, 'quiz_web_banner_subtitle');
        const widgets = [];
        widgets.push({
            type: 'widget_quiz_banner',
            data: {
                title: 'Awesome!',
                sub_title: subTitle && subTitle.length ? subTitle[0].key_value : '',
            },
        });
        const generateObject = await QuizHelper.generateFiltersObject({
            db,
            studentClass,
            subject,
            chapter,
            language,
            page: 'QUIZ_HOME',
            source,
        });
        if (!_.isNull(generateObject)) {
            widgets.push(generateObject);
        }
        if (!_.isEmpty(widgets)) {
            widgets.push({
                type: 'widget_quiz_submit',
                data: {
                    title: 'Start Another Quiz',
                },
            });
            responseData.data.widgets = widgets;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return QuizHelper.sendError(res, e);
    }
}

async function submit(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const {
            session_id: sessionId,
            question_id: questionId,
            option_selected: optionSelected,
        } = req.body;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const activeSessionId = await QuizRedis.getActiveSessionId(db.redis.read, studentId);
        console.log('session id', activeSessionId, sessionId);
        if (activeSessionId && activeSessionId !== sessionId) {
            throw new Error('Inactive Session Id');
        }
        const selectedOption = optionSelected.toUpperCase();
        const correctOption = await QuizMysql.getAnswerFromTextSolutionsTable(db.mysql.read, questionId);
        let answer = correctOption && correctOption.length ? correctOption[0].answer : null;
        answer = answer ? answer.replace(/`/g, '') : null;
        let answers;
        if (answer.includes('::')) {
            answers = answer.split('::');
            answers = answers.map((item) => item.toUpperCase());
        } else if (answer.includes(',')) {
            answers = answer.split(',');
            answers = answers.map((item) => item.toUpperCase());
        } else {
            answers = answer;
        }
        const isOptionIncludesInAnswer = answers.includes(selectedOption);
        const isCorrect = isOptionIncludesInAnswer ? 1 : 0;
        if (isCorrect) {
            const details = await QuizMysql.getQuizDetailsFromSessionId(db.mysql.read, sessionId);
            const now = moment().add(5, 'hours').add(30, 'minutes');
            if ((details[0].source === 'WHA') && (moment().isAfter(moment(twentyFourSevenQuizData.contestStartDate)) && moment().isBefore(moment(twentyFourSevenQuizData.contestEndDate)))) {
                const dayStr = now.format('YYYY-MM-DD');
                const weekNum = now.isoWeek();
                const score = await twentyFourSevenQuizRedis.getDailyScore(db.redis.read, studentId, details[0].class, dayStr);
                twentyFourSevenQuizRedis.setDailyLeaderboard(db.redis.write, dayStr, details[0].class, studentId, Number(score) + 1);
                const weeklyScore = await twentyFourSevenQuizRedis.getWeeklyScore(db.redis.read, weekNum, details[0].class, studentId);
                twentyFourSevenQuizRedis.setWeeklyLeaderboard(db.redis.write, weekNum, details[0].class, studentId, Number(weeklyScore) + 1);
            }
        }
        QuizMysql.insertIntoQuizWebLogsDetailsTable(db.mysql.write, sessionId, studentId, questionId, optionSelected, isCorrect, answer);
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return QuizHelper.sendError(res, e);
    }
}

async function fetchSubmitted(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const {
            session_id: sessionId,
            question_id: questionId,
        } = req.body;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                selected_option: '',
            },
        };
        const selectedOption = await QuizMysql.getSelectedAnswerFromSession(db.mysql.read, sessionId, studentId, questionId);
        if (selectedOption.length && selectedOption[0].selected_option) {
            responseData.data.selected_option = selectedOption[0].selected_option;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        return QuizHelper.sendError(res, e);
    }
}

module.exports = {
    getDetails,
    start,
    end,
    submit,
    fetchSubmitted,
};
