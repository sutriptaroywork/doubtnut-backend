const _ = require('lodash');
const webBookContainer = require('../../../modules/containers/webLibrary');
const AnswerContainer = require('../../../modules/containers/answer');
const Utility = require('../../../modules/utility');
const redisAnswer = require('../../../modules/redis/answer');
const libraryredis = require('../../../modules/redis/library');
const randomNumberGenerator = require('../../../modules/randomNumberGenerator');
// const staticData = require('../../../data/data');

function webLibraryClassFilterFormat(stClass) {
    const list = [];
    const classList = [12, 11, 10, 9, 8, 7, 6];
    if (classList.length) {
        for (let i = 0; i < classList.length; i++) {
            list.push({ key: classList[i], value: classList[i], is_selected: !!(stClass && +stClass === classList[i]) });
        }
    }
    return list;
}

function webLibraryMedimFilterFormat(filterData, medium) {
    const list = [];
    if (filterData && filterData.length) {
        for (let i = 0; i < filterData.length; i++) {
            const value = filterData[i].video_language_full ? _.startCase(filterData[i].video_language_full) : filterData[i].video_language;
            list.push({ key: filterData[i].medium, value, is_selected: !!(medium && medium === filterData[i].medium) });
        }
    }
    return list;
}

function webLibrarySubjectFilterFormat(filterData, subject) {
    const list = [];
    if (filterData && filterData.length) {
        for (let i = 0; i < filterData.length; i++) {
            list.push({ key: filterData[i].subject, value: filterData[i].subject, is_selected: !!(subject && subject === filterData[i].subject) });
        }
    }
    return list;
}

async function getWebFilterData(db, stClass, medium, subject) {
    // 1; stclass, 2: medium, 3; subject order is paramount(very important)
    const data = [
        { key: 'class', display: 'Select class', list: [] },
        { key: 'medium', display: 'Select Medium', list: [] },
        { key: 'subject', display: 'Select Subject', list: [] },
    ];

    if (!stClass) {
        data[0].list = webLibraryClassFilterFormat(stClass);
        return data;
    }

    if (stClass && !medium) {
        const mediumFilter = await webBookContainer.getWebLibraryFilters(db, stClass, null, null);
        data[0].list = webLibraryClassFilterFormat(stClass);
        data[1].list = webLibraryMedimFilterFormat(mediumFilter, medium);
        return data;
    }

    if (stClass && medium) {
        const [mediumFilter, subjectFilter] = await Promise.all([
            webBookContainer.getWebLibraryFilters(db, stClass, null, null),
            webBookContainer.getWebLibraryFilters(db, stClass, medium, null),
        ]);
        data[0].list = webLibraryClassFilterFormat(stClass);
        data[1].list = webLibraryMedimFilterFormat(mediumFilter, medium);
        data[2].list = webLibrarySubjectFilterFormat(subjectFilter, subject);
        return data;
    }
    return data;
}

async function getQuestionsList(db, packageDetailsId, pageNo = 1) {
    const data = {};
    const limit = 100;
    const qidList = await libraryredis.getNcertBooksLibraryDataNew(db.redis.read, packageDetailsId);
    if (qidList != null && qidList.length) {
        const parsedQidData = JSON.parse(qidList);
        const list = [];
        data.total_items = parsedQidData.length;
        if (parsedQidData && parsedQidData.length) {
            const pageQuesList = parsedQidData.splice((pageNo - 1) * limit, (pageNo * limit));
            const promise = [];
            for (let k = 0; k < pageQuesList.length; k++) {
                promise.push(AnswerContainer.getByQuestionIdWithTextSolution(pageQuesList[k], db));
            }
            const qidData = await Promise.all(promise);
            for (let i = 0; i < qidData.length; i++) {
                if (qidData[i].length) {
                    const qidObj = {};
                    qidObj.question_id = qidData[i][0].question_id;
                    qidObj.answer_id = qidData[i][0].answer_id;
                    qidObj.student_id = qidData[i][0].student_id;
                    qidObj.class = qidData[i][0].class;
                    qidObj.book = qidData[i][0].book;
                    qidObj.chapter = qidData[i][0].chapter;
                    qidObj.doubt = qidData[i][0].doubt;
                    qidObj.ocr_text = qidData[i][0].ocr_text;
                    qidObj.text_solution_id = qidData[i][0].text_solution_id;
                    qidObj.opt_1 = qidData[i][0].opt_1;
                    qidObj.opt_2 = qidData[i][0].opt_2;
                    qidObj.opt_3 = qidData[i][0].opt_3;
                    qidObj.opt_4 = qidData[i][0].opt_4;
                    qidObj.text_answer = qidData[i][0].text_answer;
                    qidObj.text_solutions = qidData[i][0].text_solutions;
                    qidObj.is_text_answered = qidData[i][0].is_text_answered;
                    qidObj.is_answered = qidData[i][0].is_answered;
                    qidObj.duration = qidData[i][0].duration;
                    qidObj.views = 5000 + Math.floor(randomNumberGenerator.getLikeDislikeStatsNew(qidData[i][0].question_id)[0] / 100);
                    qidObj.share = 'Waah! क्या बढ़िया तरीके से इस question ko Doubtnut App ने समझाया hai :D Khud dekho...maan jaaoge';
                    qidObj.web_url = qidData[i][0].web_url;
                    if (!qidObj.web_url) {
                        qidData[i][0].web_url = `${Utility.ocrToUrl(qidData[i][0].ocr_text || '')}-${qidData[i][0].question_id}`;
                        qidObj.web_url = qidData[i][0].web_url;
                        redisAnswer.setByQuestionIdWithTextSolution(qidData[i], db.redis.write);
                    }
                    list.push(qidObj);
                }
            }
            data.list = list;
        }
    }
    return data;
}

module.exports = {
    getWebFilterData,
    getQuestionsList,
};
