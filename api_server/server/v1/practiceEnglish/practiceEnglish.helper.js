const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const PracticeEnglishContainer = require('../../../modules/containers/practiceEnglish');
const PracticeEnglishMySql = require('../../../modules/mysql/practiceEnglish');
const { getSignedUrlFromAwsSdk } = require('../../helpers/question.helper');

const s3 = require('../../../config/aws').s3();

const practiceEnglishUtils = require('./practiceEnglish.utils');

async function getQuestion(db, givenQuestionId, studentLocale = 'en') {
    const questionId = parseInt(givenQuestionId);
    const { S3_BUCKET, S3_BUCKET_FOLDER, S3_SIGNED_URL_EXPIRY } = practiceEnglishUtils.practiceEnglishConstants;
    const [questionData] = await PracticeEnglishContainer.getQuestionById(db, questionId);

    let question = {};
    if (questionData) {
        question = practiceEnglishUtils.setQuestionMeta(questionData, studentLocale);
    }
    const data = {
        ...question,
        skip_button_text: 'Skip',
        submit_button_text: 'Submit',
    };

    // signed url for capturing audio response
    if (question.question_type === 'translate_en' || question.question_type === 'translate_hi') {
        const s3FileName = `${uuidv4()}_${moment().unix()}_useraudios.3gp`;
        const bucketKey = `${S3_BUCKET_FOLDER}/${s3FileName}`;

        const uploadUrl = await getSignedUrlFromAwsSdk(s3, S3_BUCKET, bucketKey, S3_SIGNED_URL_EXPIRY, 'video/3gpp');

        data.answer_audio_upload_url = uploadUrl;
    }

    return data;
}

async function getQuestionsListWidget(db, studentId, studentLocale = 'en', versionCode, sessionId = null) {
    const { PRODUCT_TITLE } = practiceEnglishUtils.practiceEnglishConstants;
    const { CONTEST_LIVE, CONTEST_START_DATE } = practiceEnglishUtils.dailyContestConstants;

    let unattemptedQues = [];

    if (CONTEST_LIVE) {
        const remainingAttempts = await practiceEnglishUtils.getRemainingAttempts(db, studentId);

        if (remainingAttempts < 1) {
            const dataToReturn = {
                title: PRODUCT_TITLE,
                questions_list: [],
            };
            return dataToReturn;
        }

        const easyQuestionIdsList = await PracticeEnglishContainer.getQuestionIdsListByDifficulty(db, 1);
        const mediumQuestionIdsList = await PracticeEnglishContainer.getQuestionIdsListByDifficulty(db, 2);

        if (sessionId) {
            // if try again
            const prevSessionQues = await PracticeEnglishMySql.getPreviousAttemptedBySession(db.mysql.read, studentId, sessionId);

            const allQids = [...easyQuestionIdsList, ...mediumQuestionIdsList];
            unattemptedQues = practiceEnglishUtils.filterContainment(allQids, prevSessionQues, true);
        } else {
            const attemptedQues = await PracticeEnglishMySql.getPreviousAttemptedByDate(db.mysql.read, studentId, CONTEST_START_DATE);

            let easyUnattemptedQues = practiceEnglishUtils.filterContainment(easyQuestionIdsList, attemptedQues, false);
            let mediumUnattemptedQues = practiceEnglishUtils.filterContainment(mediumQuestionIdsList, attemptedQues, false);

            if (versionCode < 976) {
                easyUnattemptedQues = practiceEnglishUtils.filterTranslateQues(easyQuestionIdsList);
                mediumUnattemptedQues = practiceEnglishUtils.filterTranslateQues(mediumQuestionIdsList);
            } else {
                easyUnattemptedQues = practiceEnglishUtils.filterNonMcqQues(easyQuestionIdsList);
                mediumUnattemptedQues = practiceEnglishUtils.filterNonMcqQues(mediumQuestionIdsList);
            }
            easyUnattemptedQues = practiceEnglishUtils.getRandomItemsByCount(easyUnattemptedQues, 5);
            mediumUnattemptedQues = practiceEnglishUtils.getRandomItemsByCount(mediumUnattemptedQues, 5);

            // pick medium
            if (easyUnattemptedQues.length < 5) {
                easyUnattemptedQues = mediumUnattemptedQues;
                mediumUnattemptedQues = [];
            }

            // pick hard
            if (easyUnattemptedQues.length < 5) {
                const hardQuestionIdsList = await PracticeEnglishContainer.getQuestionIdsListByDifficulty(db, 3);
                let hardUnattemptedQues = practiceEnglishUtils.filterContainment(hardQuestionIdsList, attemptedQues, false);

                if (versionCode < 976) {
                    hardUnattemptedQues = practiceEnglishUtils.filterTranslateQues(hardUnattemptedQues);
                } else {
                    hardUnattemptedQues = practiceEnglishUtils.filterNonMcqQues(hardUnattemptedQues);
                }
                hardUnattemptedQues = practiceEnglishUtils.getRandomItemsByCount(hardUnattemptedQues, 5);
                easyUnattemptedQues = hardUnattemptedQues;
            }

            // repeat questions
            if (easyUnattemptedQues.length < 5) {
                const allQuestionIdsList = await PracticeEnglishContainer.getQuestionIdsList(db);
                let quesList = allQuestionIdsList;
                if (versionCode < 976) {
                    quesList = practiceEnglishUtils.filterTranslateQues(quesList);
                } else {
                    quesList = practiceEnglishUtils.filterNonMcqQues(quesList);
                }
                const repeatedQues = practiceEnglishUtils.getRandomItemsByCount(quesList, 5);
                easyUnattemptedQues = repeatedQues;
            }
            // console.log(easyUnattemptedQues.length);
            unattemptedQues = [...easyUnattemptedQues];
            if (mediumUnattemptedQues.length > 0) {
                unattemptedQues[2] = mediumUnattemptedQues[0];
            }
        }
        if (unattemptedQues.length < 5) {
            const dataToReturn = {
                title: PRODUCT_TITLE,
                questions_list: [],
            };
            return dataToReturn;
        }
    } else {
        // const questionIdsList = await PracticeEnglishContainer.getQuestionIdsList(db);

        if (sessionId) {
            // if try again
            const prevSessionQues = await PracticeEnglishMySql.getPreviousAttemptedBySession(db.mysql.read, studentId, sessionId);

            // unattemptedQues = practiceEnglishUtils.filterContainment(questionIdsList, prevSessionQues, true);

            const prevQids = prevSessionQues.map((eq) => eq.question_id);
            unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                { $match: { question_id: { $in: prevQids } } },
                { $project: { _id: 0, question_id: 1, question_type: 1 } },
            ]).toArray();
        } else {
            const attemptedQues = await PracticeEnglishMySql.getPreviousAttemptedAll(db.mysql.read, studentId);

            const attemptedQids = attemptedQues.map((eq) => eq.question_id);
            // new questions
            if (versionCode < 976) {
                // unattemptedQues = practiceEnglishUtils.filterTranslateQues(questionIdsList);
                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    {
                        $match: {
                            question_id: { $not: { $in: attemptedQids } },
                            question_type: { $in: ['translate_en', 'translate_hi'] },
                        },
                    },
                    { $sample: { size: 5 } },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
            } else {
                // unattemptedQues = practiceEnglishUtils.filterNonTranslateQues(questionIdsList);
                // unattemptedQues = practiceEnglishUtils.filterNonMcqQues(unattemptedQues);
                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    {
                        $match: {
                            question_id: { $not: { $in: attemptedQids } },
                            question_type: { $not: { $in: ['translate_en', 'translate_hi', 'image_mcq', 'blank_mcq'] } },
                        },
                    },
                    { $sample: { size: 5 } },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
            }

            // unattemptedQues = practiceEnglishUtils.filterContainment(unattemptedQues, attemptedQues, false);
            // unattemptedQues = practiceEnglishUtils.getRandomItemsByCount(unattemptedQues, 5);
        }

        if (unattemptedQues.length < 5) {
            if (versionCode < 976) {
                // unattemptedQues = practiceEnglishUtils.filterTranslateQues(questionIdsList);
                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    { $match: { question_type: { $in: ['translate_en', 'translate_hi'] } } },
                    { $sample: { size: 5 } },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
            } else {
                // unattemptedQues = practiceEnglishUtils.filterNonTranslateQues(questionIdsList);
                // unattemptedQues = practiceEnglishUtils.filterNonMcqQues(unattemptedQues);
                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    { $match: { question_type: { $not: { $in: ['translate_en', 'translate_hi', 'image_mcq', 'blank_mcq'] } } } },
                    { $sample: { size: 5 } },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
            }
            // const repeatedQues = practiceEnglishUtils.getRandomItemsByCount(unattemptedQues, 5);
            // unattemptedQues = repeatedQues;
        }

        if (unattemptedQues.length < 5) {
            const dataToReturn = {
                title: PRODUCT_TITLE,
                questions_list: [],
            };
            return dataToReturn;
        }
    }

    const questionsList = unattemptedQues.map((question) => {
        question.display_type = practiceEnglishUtils.setDisplayType(question.question_type);
        delete question.question_type;
        return question;
    });

    const completeQuestions = await Promise.all(questionsList.map(async (question) => {
        const completeQues = await getQuestion(db, question.question_id, studentLocale);
        return { ...question, ...completeQues };
    }));
    // const wpMsg = 'Doubtnut par chal raha hai India ka sabse bada English Seekho Contest! 😍 \nJahan daily Bumper inaam mein ek Phone diyaa raha hai!! 🤳🏻 \nYahi nahi, iske alaava 10 Lucky winners ko milega ₹10,000 tak ka Paytm cash prize! 🤑 \n\nMazze ki baat hai ye aap ek nahi, 2 nahi poore 100 baar quiz attempt kar sakte hain \nYaani jitna jaada aapka score unte hi jaada mauka aapke jeetne ka. 💰💸 \n\nAao jung shuru kari jaaye! ⚔️ - https://doubtnut.app.link/fyFxC9ro6jb';
    const wpMsg = 'Doubtnut par chal raha hai English Bolna Seekho game! 😍  \nJahan bas 5 minute me 5 sawaal practice karke ek chota sa concept seekh sakte ho!! 🤳🏻 \nAur kisi se sharmaane ki bhi zaroorat nahi!!! 😇 \n\nAb English bolna bhi hua asaan! Aajao!! - https://doubtnut.app.link/fyFxC9ro6jb';
    const data = {
        title: PRODUCT_TITLE,
        questions: completeQuestions,
        bg_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/34781DC0-38EA-7F94-9A1F-65C09611829F.webp',
        practice_english_banner_text: ' Kya aapko apni English strong karni hai?',
        practice_english_cta: 'Practice Now',
        deeplink: 'doubtnut://practice_english',
        share_text: 'Share',
        share_img_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/2022/02/07/14-22-06-883-PM_resized-share%20%281%29.webp',
        share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI(wpMsg)}`,
        hint_text: studentLocale === 'hi' ? 'रिकॉर्ड करने के लिए बटन को दबा कर रखें' : 'Press and Hold for Recording',
        record_pressed_text: studentLocale === 'hi' ? 'रिकॉर्ड हो रहा है' : 'Recording...',
        record_toast_text: studentLocale === 'hi' ? 'रिकॉर्ड करने के लिए बटन को दबा कर रखें' : 'Press and Hold for Recording',
    };
    if (versionCode >= 976) {
        data.questions = completeQuestions.map((eachQuestion) => {
            // console.log(eachQuestion);
            if (eachQuestion.display_type.endsWith('BLANK_QUESTION')) {
                eachQuestion.blank_question = eachQuestion.question;
                eachQuestion.question = eachQuestion.blank_question.join('');
            }
            return eachQuestion;
        });

        const displayTypes = completeQuestions.map((eachQuestion) => {
            const tempQuestion = {
                question_id: eachQuestion.question_id,
                display_type: eachQuestion.display_type,
            };
            return tempQuestion;
        });
        data.display_type = displayTypes;
    }
    // console.log(data);
    return data;
}

module.exports = {
    getQuestionsListWidget,
};
