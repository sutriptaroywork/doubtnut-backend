const _ = require('lodash');
const QuizRedis = require('../../../modules/redis/quizWeb');
const QuizMysql = require('../../../modules/mysql/quizWeb');
const CourseContainer = require('../../../modules/containers/coursev2');
const Utility = require('../../../modules/utility');
const AnswerContainer = require('../../v13/answer/answer.container');

const Data = require('../../../data/data');

function getOptionsArray(questionDetails) {
    const options = [
        {
            key: 'A',
            value: questionDetails.opt_1,
        },
        {
            key: 'B',
            value: questionDetails.opt_2,
        },
        {
            key: 'C',
            value: questionDetails.opt_3,
        },
        {
            key: 'D',
            value: questionDetails.opt_4,
        },
    ];
    return options;
}

function getFilterText(title, item) {
    if (title === 'CLASS') return +item === 14 ? 'Govt. Exam' : `Class ${item}`;
    if (title === 'MEDIUM') return Data.quiz_web.languages[item] || item;
    return item;
}

function getQuizItems({
    key,
    valuesArray,
    title,
}) {
    const items = valuesArray.map((item) => ({
        key,
        value: title === 'CHAPTER' ? item.chapter_alias_url : item,
        text: title === 'CHAPTER' ? item.chapter : getFilterText(title, item),
    }));
    return items;
}

function getQuizItemObject({
    key,
    valuesArray,
    type,
    title,
    selected_option,
}) {
    const items = getQuizItems({
        key,
        valuesArray,
        title,
    });
    const object = {
        type,
        data: {
            title,
            selected_option,
            items,
            key,
        },
    };
    return object;
}

function generateQuizItemObjects(quizDetailsArray) {
    const items = [];
    quizDetailsArray.forEach((item) => {
        const object = getQuizItemObject(item);
        if (!_.isNull(object)) {
            items.push(object);
        }
    });
    return items;
}

function getCacheLevel({
    studentClass,
    subject,
    language,
}) {
    if (!studentClass && !subject && !language) {
        return 'DEFAULT'; // * Show all available items
    }
    if (studentClass) {
        return 'CLASS'; // * Show all available items from class cache
    }
    if (subject) {
        return 'SUBJECT'; // * Show all available items from subject cache
    }
    if (language) {
        return 'LANGUAGE'; // * Show all available items from language cache
    }
}

async function getAvailableDetails({
    db,
    studentClass,
    subject,
    chapter,
    language,
}) {
    const cacheLevel = getCacheLevel({
        studentClass,
        subject,
        chapter,
        language,
    });
    let availableLanguages;
    let availableSubjects;
    let availableClasses;
    let availableChapters;
    const promises = [];
    if (cacheLevel === 'CLASS') {
        promises.push(QuizRedis.getAvailableClasses(db.redis.read));
        if (studentClass && subject) {
            promises.push(QuizRedis.getAvailableLanguagesFromSubjectClass(db.redis.read, studentClass, subject));
        } else {
            promises.push(QuizRedis.getAvailableLanguages(db.redis.read));
        }

        if (studentClass) {
            promises.push(QuizRedis.getAvailableSubjectsFromClass(db.redis.read, studentClass));
        } else {
            promises.push(QuizRedis.getAvailableSubjects(db.redis.read));
        }
        if (studentClass && subject && language) {
            promises.push(QuizRedis.getAvailableChaptersFromSubjectClassLanguage(db.redis.read, studentClass, subject, language));
        }
    } else if (cacheLevel === 'SUBJECT') {
        promises.push(QuizRedis.getAvailableClassesFromSubject(db.redis.read, subject));
        promises.push(QuizRedis.getAvailableLanguagesFromSubject(db.redis.read, subject));
        promises.push(QuizRedis.getAvailableSubjects(db.redis.read));
    } else if (cacheLevel === 'LANGUAGE') {
        promises.push(QuizRedis.getAvailableClassesFromLanguage(db.redis.read, language));
        promises.push(QuizRedis.getAvailableLanguages(db.redis.read));
        promises.push(QuizRedis.getAvailableSubjectsFromLanguage(db.redis.read, language));
    } else {
        promises.push(QuizRedis.getAvailableClasses(db.redis.read));
        promises.push(QuizRedis.getAvailableLanguages(db.redis.read));
        promises.push(QuizRedis.getAvailableSubjects(db.redis.read));
    }

    [availableClasses, availableLanguages, availableSubjects, availableChapters] = await Promise.all(promises);

    availableClasses = availableClasses ? JSON.parse(availableClasses) : [];
    availableSubjects = availableSubjects ? JSON.parse(availableSubjects) : [];
    availableLanguages = availableLanguages ? JSON.parse(availableLanguages) : [];
    availableChapters = availableChapters ? JSON.parse(availableChapters) : [];

    return {
        availableClasses,
        availableSubjects,
        availableLanguages,
        availableChapters,
    };
}

async function generateFiltersObject({
    db,
    studentClass,
    subject,
    chapter,
    language,
    page,
}) {
    const {
        availableClasses,
        availableSubjects,
        availableLanguages,
        availableChapters,
    } = await getAvailableDetails({
        db,
        studentClass,
        subject,
        chapter,
        language,
    });

    const topLevelWidget = page === 'QUIZ_HOME' ? 'widget_quiz' : 'widget_quiz_filters';
    const innerWidget = page === 'QUIZ_HOME' ? 'widget_quiz_drop_down' : 'widget_quiz_filter';

    const quizDetailsArray = [];

    quizDetailsArray.push({
        key: 'class',
        valuesArray: availableClasses,
        type: innerWidget,
        title: 'CLASS',
        selected_option: studentClass ? `Class ${studentClass}` : Data.quiz_web_default_values.class,
    });

    quizDetailsArray.push({
        key: 'subject',
        valuesArray: availableSubjects,
        type: innerWidget,
        title: 'SUBJECT',
        selected_option: subject || Data.quiz_web_default_values.subject,
    });

    quizDetailsArray.push({
        key: 'chapter',
        valuesArray: availableChapters,
        type: innerWidget,
        title: 'CHAPTER',
        selected_option: chapter || Data.quiz_web_default_values.chapter,
    });

    quizDetailsArray.push({
        key: 'language',
        valuesArray: availableLanguages,
        type: innerWidget,
        title: 'MEDIUM',
        selected_option: language || Data.quiz_web_default_values.language,
    });
    const items = generateQuizItemObjects(quizDetailsArray);
    const quizReponseObject = {
        type: topLevelWidget,
        data: {
            items,
        },
    };

    return quizReponseObject;
}

function getAnswerArray(answer) {
    answer = answer.trim();
    if (answer.includes('::')) {
        answer = answer.split('::');
    } else if (answer.includes('(') || answer.includes(')')) {
        answer = answer.replace(/[{()}]/g, '');
        if (answer.includes(',')) {
            answer = answer.split(',');
        } else if (answer.includes(' ')) {
            answer = answer.split(' ');
        } else {
            answer = answer.split('');
        }
        answer = answer.filter((item) => item).map((item) => item.trim());
        answer = answer.reduce((acc, item) => {
            if (item.length > 1) {
                acc = [...acc, ...item.split('')];
            } else {
                acc.push(item);
            }
            return acc;
        }, []);
    } else {
        answer = answer.split('');
    }
    answer = answer.filter((item) => !_.isEmpty(item.trim())).map((item) => {
        item = item.trim();
        if (_.isNumber(+item) && !isNaN(+item)) {
            return Data.quiz_web.answer_mapping[+item];
        }
        return item.toUpperCase();
    });
    return answer;
}

async function getQuestions({
    db,
    questions,
    versionCode,
    config,
}) {
    const items = [];
    const quizQuestions = [];
    const questionsList = questions.map(Number);
    const limit = await CourseContainer.getAppConfigurationContent(db, 'quiz_web_limit');
    const questionsResult = await QuizMysql.getQuestionDetailsFromTextSolutions(db.mysql.read, questionsList, limit && limit.length ? +limit[0].key_value : null);
    questionsResult.sort((a, b) => questionsList.map(Number).indexOf(a.question_id) - questionsList.map(Number).indexOf(b.question_id));

    for (let i = 0; i < questionsResult.length; i++) {
        const item = questionsResult[i];
        const obj = {
            title: item.question,
            answer: getAnswerArray(item.answer),
            options: getOptionsArray(item),
            question_id: item.question_id,
        };
        // * To add button object, to view solution of question
        if (item.is_answered) {
            obj.button = {
                is_video_available: true,
                is_text_available: false,
                text: 'Click here to view video solution',
                canonical_url: item.canonical_url ? item.canonical_url : `${Utility.ocrToUrl(item.ocr_text)}-${item.question_id}`,
                question_id: item.question_id,
                subject: item.subject,
            };
            if (item.answer_id) {
                // eslint-disable-next-line no-await-in-loop
                const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, item.answer_id, item.question_id, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, true);
                obj.button.video_resources = videoResources;
            }
        } else if (item.is_text_answered && item.solutions && item.solutions !== 'N/A') {
            obj.button = {
                is_video_available: false,
                is_text_available: true,
                text: 'Click here to view solution',
                solution_text: item.solutions,
                question_id: item.question_id,
                subject: item.subject,
            };
        }
        items.push(obj);
        quizQuestions.push(item.question_id);
    }
    return {
        items,
        quizQuestions,
    };
}

async function getQuestionsObject({
    db,
    versionCode,
    config,
    questions: quizQuestions = [],
    remainingQuestions = [],
}) {
    const object = {
        type: 'widget_quiz_questions',
        data: {
            items: [],
        },
    };
    const questions = [];
    let questionDetails = {
        items: [],
        quizQuestions: [],
    };
    if (remainingQuestions.length || quizQuestions.length) {
        questionDetails = await getQuestions({
            db,
            questions: remainingQuestions.length ? remainingQuestions : quizQuestions,
            versionCode,
            config,
        });
    }
    object.data.items = [...questionDetails.items];
    questionDetails.quizQuestions.forEach((item) => questions.push(item));
    return {
        questionsObject: object,
        questions,
    };
}

async function getTestDetails({
    db,
    student_id: studentId,
    dnStudentId,
    studentClass,
    subject,
    chapter,
    language,
}) {
    // if student not logged in, show static page

    if (!dnStudentId) {
        let quizStaticQuestions = JSON.parse(await QuizRedis.getQuizQuestionsStaticForNotLoginedStudentsInWeb(db.redis.read, studentClass, subject, chapter, language));
        if (_.isNull(quizStaticQuestions)) {
            const quizQuestions = await QuizRedis.getQuestionsForQuizWeb(db.redis.read, studentClass, subject, chapter, language);
            const quizQuestionsArr = quizQuestions ? JSON.parse(quizQuestions) : [];
            quizStaticQuestions = quizQuestionsArr.slice(0, 10);
            await QuizRedis.setQuizQuestionsStaticForNotLoginedStudentsInWeb(db.redis.read, studentClass, subject, chapter, language, quizStaticQuestions);
        }
        return {
            quizQuestions: quizStaticQuestions,
            remainingQuestions: quizStaticQuestions,
        };
    }

    const quizQuestions = await QuizRedis.getQuestionsForQuizWeb(db.redis.read, studentClass, subject, chapter, language);
    const quizQuestionsArr = quizQuestions ? JSON.parse(quizQuestions) : [];
    if (quizQuestionsArr.length === 0) {
        return {};
    }
    let attemptedQuestionsArr;

    if (studentId) {
        const attemptedQuestions = await QuizMysql.getAttemptedQuestions(db.mysql.read, studentId, quizQuestionsArr);
        attemptedQuestionsArr = attemptedQuestions.map((item) => item.question_id);
    } else {
        attemptedQuestionsArr = [];
    }
    const remainingQuestionsArr = quizQuestionsArr.filter((item) => !attemptedQuestionsArr.includes(+item));
    return {
        quizQuestions: quizQuestionsArr,
        remainingQuestions: remainingQuestionsArr,
    };
}

module.exports = {
    generateFiltersObject,
    getQuestionsObject,
    getTestDetails,
    getQuestions,
};
