const _ = require('lodash');

// const QuestionContainer = require('../../../modules/containers/question');
const { 
    srpBannerTxtNew,
    // srpBannerTxtNew2,
} = require('../../../data/data');

/**
 * - Fetches banner to be displayed on SRP based on no. of questions asked
 * @param {number} studentId
 * @param {number} studentClass
 * @returns {{content: string, dn_cash: number}} Banner along with dn cash
 * @author Abhishek Sinha
 */
// eslint-disable-next-line no-unused-vars
function getSRPBanner(locale, versionCode) {
    // const count = await QuestionContainer.getQuestionAskedCount(db, studentId);
    // if (studentId % 2) {
    //     const content = _.sample(srpBannerTxt[studentClass || 6]);
    //     return {
    //         content: `⚡ ${content}`,
    //     };
    // }
    // const dnCash = _.random(1, 5);
    // let countTxt = '';
    // switch (count) {
    //     case 1: countTxt = 'first'; break;
    //     case 2: countTxt = 'second'; break;
    //     case 3: countTxt = 'third'; break;
    //     default: countTxt = '';
    // }
    // return {
    //     content: countTxt ? `🌟 Well done on your ${countTxt} question. You earned` : '🌟 Well done on asking question. You earned',
    //     dn_cash: dnCash,
    // };
    // if (versionCode >= 748) {
    //     return { content: _.sample(srpBannerTxtNew2[locale || 'en'] || srpBannerTxtNew2['en']) };
    // }
    /* old one */
    // return { content: _.sample(srpBannerTxtNew[locale || 'en']) };
    return { content: srpBannerTxtNew(locale) };
}

/**
 * - Adds xp for a student via SQS
 * @param {object} sqs SQS object
 * @param {string} queueUrl SQS url
 * @param {number} studentId
 * @param {number} xp Amount of XP to add to student
 * @author Abhishek Sinha
 */
function addXP(sqs, queueUrl, studentId, xp) {
    const params = {
        MessageBody: JSON.stringify({
            action: `QUESTION_ASK_${xp}`,
            user_id: studentId,
            refer_id: studentId,
        }),
        QueueUrl: queueUrl,
    };
    return new Promise((resolve, reject) => {
        sqs.sendMessage(params, (err) => {
            if (err) {
                console.log('Error', err);
                return reject(err);
            }
            resolve();
        });
    });
}

module.exports = {
    getSRPBanner,
    addXP,
};
