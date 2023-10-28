const CourseMysql = require('../../modules/mysql/course');

const possibleAnswers = ['A', 'B', 'C', 'D'];

async function checkQuestionsValidity(database, questionIds, metaInfo) {
    if (!questionIds || !metaInfo) {
        return {
            questionIds, metaInfo, valid: 0, validInfo: 'Resource Reference or MetaInfo is empty',
        };
    }
    questionIds = questionIds.replace(/ /g, '');
    metaInfo = metaInfo.replace(/ /g, '');
    questionIds = questionIds.split('|');
    metaInfo = metaInfo.split('|');
    for (let i = 0; i < metaInfo.length; i++) {
        const meta = metaInfo[i];
        if (parseInt(meta) > 60) {
            return {
                questionIds, metaInfo, valid: 0, validInfo: 'expiry time cant be greater than 60',
            };
        }
    }
    if (questionIds.includes('') || metaInfo.includes('')) {
        return {
            questionIds, metaInfo, valid: 0, validInfo: 'Resource Reference or MetaInfo has no data after |',
        };
    }
    const solutionData = await CourseMysql.getTextSolutionsByQuestionId(database, questionIds);
    // eslint-disable-next-line eqeqeq
    if (solutionData.length != questionIds.length) {
        return {
            questionIds, metaInfo, valid: 0, validInfo: 'didnt find  some questionId in text solution',
        };
    }
    for (let i = 0; i < solutionData.length; i++) {
        const solution = solutionData[i];
        if (!solution.opt_1 || !solution.opt_2 || !solution.opt_3 || !solution.opt_4) {
            return {
                questionIds, metaInfo, valid: 0, validInfo: `${solution.question_id} has missing option Data`,
            };
        }
        if (!possibleAnswers.includes(solution.answer)) {
            return {
                questionIds, metaInfo, valid: 0, validInfo: `${solution.question_id} has incorrect answer Data`,
            };
        }
    }
    return {
        questionIds, metaInfo, valid: 1, validInfo: 'Valid data',
    };
}

module.exports = { checkQuestionsValidity };
