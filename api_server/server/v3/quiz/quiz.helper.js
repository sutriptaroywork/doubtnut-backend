const _ = require('lodash');
const QuizWARedis = require('../../../modules/redis/quizWA');
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
        promises.push(QuizWARedis.getAvailableClasses(db.redis.read));

        if (studentClass && subject) {
            promises.push(QuizWARedis.getAvailableLanguagesFromSubjectClass(db.redis.read, studentClass, subject));
        } else {
            promises.push(QuizWARedis.getAvailableLanguagesForClass(db.redis.read, studentClass));
        }

        if (studentClass) {
            if (language) {
                promises.push(QuizWARedis.getAvailableSubjectsFromLanguageAndClass(db.redis.read, language, studentClass));
                console.log('here', language, studentClass);
            } else {
                promises.push(QuizWARedis.getAvailableSubjectsFromClass(db.redis.read, studentClass));
            }
        } else {
            promises.push(QuizWARedis.getAvailableSubjects(db.redis.read));
        }
        if (studentClass && subject && language) {
            promises.push(QuizWARedis.getAvailableChaptersFromSubjectClassLanguage(db.redis.read, studentClass, subject, language));
        }
    } else if (cacheLevel === 'SUBJECT') {
        promises.push(QuizWARedis.getAvailableClassesFromSubject(db.redis.read, subject));
        promises.push(QuizWARedis.getAvailableLanguagesFromSubject(db.redis.read, subject));
        promises.push(QuizWARedis.getAvailableSubjects(db.redis.read));
    } else if (cacheLevel === 'LANGUAGE') {
        promises.push(QuizWARedis.getAvailableClassesFromLanguage(db.redis.read, language));
        promises.push(QuizWARedis.getAvailableLanguages(db.redis.read));
        promises.push(QuizWARedis.getAvailableSubjectsFromLanguage(db.redis.read, language));
    } else {
        promises.push(QuizWARedis.getAvailableClasses(db.redis.read));
        promises.push(QuizWARedis.getAvailableLanguages(db.redis.read));
        promises.push(QuizWARedis.getAvailableSubjects(db.redis.read));
    }

    [availableClasses, availableLanguages, availableSubjects, availableChapters] = await Promise.all(promises);
    // console.log(availableClasses, availableLanguages, availableSubjects, availableChapters);

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
    source,
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
        source,
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
    const limit = await CourseContainer.getAppConfigurationContent(db, 'quiz_web_limit');
    const questionsResult = await QuizMysql.getQuestionDetailsFromTextSolutions(db.mysql.read, questions, limit && limit.length ? +limit[0].key_value : null);
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
            questions: remainingQuestions.length >= 10 ? remainingQuestions : quizQuestions,
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
    studentClass,
    subject,
    chapter,
    language,
}) {
    const quizQuestions = await QuizWARedis.getQuestionsForQuizWeb(db.redis.read, studentClass, subject, chapter, language);

    const quizQuestionsArr = quizQuestions ? JSON.parse(quizQuestions) : [];
    if (quizQuestionsArr.length === 0) {
        return {};
    }
    const attemptedQuestions = await QuizMysql.getAttemptedQuestions(db.mysql.read, studentId, quizQuestionsArr);
    const attemptedQuestionsArr = attemptedQuestions.map((item) => item.question_id);
    const remainingQuestionsArr = quizQuestionsArr.filter((item) => !attemptedQuestionsArr.includes(+item));
    // const lastTestDetails = await QuizMysql.getLastTestDetails(db.mysql.read, studentId, studentClass, subject, chapter, language);
    // if (lastTestDetails.length) {
    //     const lastTestSessions = lastTestDetails.map((item) => item.session_id);
    //     const attemptedQuestions = await QuizMysql.getAttemptedQuestions(db.mysql.read, lastTestSessions, lastTestDetails[0].student_id);
    //     const attemptedQuestionIds = attemptedQuestions.map((item) => item.question_id);
    //     const notAttemptedQuestions = quizQuestionsArr.filter((item) => !attemptedQuestionIds.includes(item));
    //     if (notAttemptedQuestions.length) {
    //         return {
    //             quizQuestions: quizQuestionsArr,
    //             remainingQuestions: notAttemptedQuestions,
    //             session_id: lastTestDetails[0].session_id,
    //             is_completed: lastTestDetails[0].is_completed,
    //         };
    //     }
    // }
    return {
        quizQuestions: quizQuestionsArr,
        remainingQuestions: remainingQuestionsArr,
    };
}

async function sendError(res, e) {
    const responseData = {
        meta: {
            code: 500,
            success: false,
        },
        data: [],
    };
    responseData.meta.message = e.message;
    return res.status(500).json(responseData);
}
module.exports = {
    generateFiltersObject,
    getQuestionsObject,
    getTestDetails,
    getQuestions,
    sendError,
};
