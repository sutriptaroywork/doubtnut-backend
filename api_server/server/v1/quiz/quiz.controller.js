const _ = require('lodash');
const { v4: uuidv4 } = require('uuid');
const QuizHelper = require('./quiz.helper');
const QuizMysql = require('../../../modules/mysql/quizWeb');
const CourseContainer = require('../../../modules/containers/coursev2');
const Data = require('../../../data/data');

async function getDetails(req, res) {
    try {
        const db = req.app.get('db');
        let {
            class: studentClass,
            subject,
            chapter,
        } = req.query;
        const { language } = req.query;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const source = 'WEB';
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
        console.log(e);
    }
}

async function start(req, res) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const {
            class: studentClass,
            language,
            student_id: webStudentId,
        } = req.query;
        let {
            subject,
            chapter,
        } = req.query;
        const source = 'WEB';
        subject = subject ? subject.toUpperCase() : subject;
        chapter = chapter ? chapter.toUpperCase() : chapter;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const widgets = [];
        const generateObject = await QuizHelper.generateFiltersObject({
            db,
            studentClass,
            subject,
            chapter,
            language,
            source,
        });
        const { student_id: studentId } = req.user || {};
        const testDetails = await QuizHelper.getTestDetails({
            db,
            student_id: studentId || webStudentId,
            dnStudentId: studentId,
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
        if (studentId || webStudentId) {
            responseData.data.session_id = uuidv4();
            QuizMysql.insertIntoQuizWebDetailsTable(db.mysql.write, responseData.data.session_id, studentId || webStudentId, 0, JSON.stringify(questions.questions), studentClass, subject, chapter, language);
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function end(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user || {};
        const {
            session_id: sessionId,
            student_id: webStudentId,
            class: studentClass,
            subject,
            chapter,
            language,
        } = req.body;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        const source = 'WEB';
        QuizMysql.updateQuizWebDetailsTable(db.mysql.read, sessionId, studentId || webStudentId);
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
        console.log(e);
    }
}

async function submit(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user || {};
        const {
            student_id: webStudentId,
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
        if (sessionId !== '' && sessionId !== null) {
            QuizMysql.insertIntoQuizWebLogsDetailsTable(db.mysql.write, sessionId, studentId || webStudentId, questionId, optionSelected, isCorrect, answer);
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

async function fetchSubmitted(req, res) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user || {};
        const {
            student_id: webStudentId,
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
        let selectedOption = [];
        if (sessionId !== '' && sessionId !== null) {
            selectedOption = await QuizMysql.getSelectedAnswerFromSession(db.mysql.read, sessionId, studentId || webStudentId, questionId);
        }
        if (selectedOption.length && selectedOption[0].selected_option) {
            responseData.data.selected_option = selectedOption[0].selected_option;
        }
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
    }
}

module.exports = {
    getDetails,
    start,
    end,
    submit,
    fetchSubmitted,
};
