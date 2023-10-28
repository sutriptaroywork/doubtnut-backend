const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const _ = require('lodash');

const PracticeEnglishContainer = require('../../../modules/containers/practiceEnglish');
const PracticeEnglishMySql = require('../../../modules/mysql/practiceEnglish');
const PracticeEnglishRedis = require('../../../modules/redis/practiceEnglish');
const { getSignedUrlFromAwsSdk } = require('../../helpers/question.helper');
const PracticeEnglishHelper = require('./practiceEnglish.helper');

const practiceEnglishUtils = require('./practiceEnglish.utils');
const { orderedSetQuestions } = require('./practiceEnglish.data');

const kafka = require('../../../config/kafka');

let db;

function responseTemplate(msg = 'Success', data = 'Success', status = 200) {
    const responseData = {
        meta: {
            code: status,
            success: status === 200,
            message: msg,
        },
        data,
    };
    return responseData;
}

async function getQuestionsList(req, res, next) {
    db = req.app.get('db');
    const { student_id: studentId, gcm_reg_id: gcmRegId, locale } = req.user;
    let sessionId = req.query.session_id;
    try {
        const { SESSION_START, PRODUCT_TITLE } = practiceEnglishUtils.practiceEnglishConstants;
        const { CONTEST_LIVE, CONTEST_START_DATE } = practiceEnglishUtils.dailyContestConstants;

        let unattemptedQues = [];

        if (sessionId == studentId) {
            sessionId = null;
        }
        // if first try - demo questions
        // const isAnyQuesAttempted = await PracticeEnglishMySql.getPreviousAttemptedQuesCountByDate(db.mysql.read, studentId, CONTEST_START_DATE);
        // if (isAnyQuesAttempted[0].attempted_questions < 1) {
        //     const dataToReturn = {
        //         title: PRODUCT_TITLE,
        //         session_id: `${studentId}`,
        //         questions_list: demoQues,
        //     };
        //     return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
        // }

        // first default questions
        const isAnySessionExceptDemo = await PracticeEnglishMySql.getStartedSessionsBySessionId(db.mysql.read, studentId);
        const questionsLocale = locale == 'hi' ? 'hi' : 'en';
        const defaultQuestions = orderedSetQuestions[questionsLocale][isAnySessionExceptDemo[0].attempted_sessions];

        if (defaultQuestions) {
            const dataToReturn = {
                title: PRODUCT_TITLE,
                session_id: uuidv4(),
                questions_list: defaultQuestions,
            };
            return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
        }

        if (CONTEST_LIVE) {
            const remainingAttempts = await practiceEnglishUtils.getRemainingAttempts(db, studentId);

            if (remainingAttempts < 1) {
                const dataToReturn = {
                    title: PRODUCT_TITLE,
                    questions_list: [],
                };
                return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
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
                    hardUnattemptedQues = practiceEnglishUtils.getRandomItemsByCount(hardUnattemptedQues, 5);

                    easyUnattemptedQues = hardUnattemptedQues;
                }

                // repeat questions
                if (easyUnattemptedQues.length < 5) {
                    const allQuestionIdsList = await PracticeEnglishContainer.getQuestionIdsList(db);

                    const repeatedQues = practiceEnglishUtils.getRandomItemsByCount(allQuestionIdsList, 5);
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
                return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
            }
        } else {
            // let questionIdsList = [];
            //  await PracticeEnglishContainer.getQuestionIdsList(db);
            // const assignedSetValue = await PracticeEnglishContainer.getUserAssignedSet(db, studentId, 'pe_assigned_set');
            // let totalQuestions = await db.redis.read.getAsync('PracticeEnglish:TOTAL_QUESTIONS');

            // totalQuestions = totalQuestions || 6000;

            // const todaysDate = practiceEnglishUtils.getDateString();
            // const todaysAttemptedCount = await PracticeEnglishMySql.getAttemptedQuesByTimeRange(db.mysql.read, studentId, todaysDate);

            // let attemptedQuesCount = _.get(todaysAttemptedCount, '[0].attempted_questions', 0);
            // attemptedQuesCount %= totalQuestions;

            // questionIdsList = await PracticeEnglishContainer.getNextQuestions(db, assignedSetValue, attemptedQuesCount);

            if (sessionId) {
                // if try again
                const prevSessionQues = await PracticeEnglishMySql.getPreviousAttemptedBySession(db.mysql.read, studentId, sessionId);
                // questionIdsList = await PracticeEnglishContainer.getNextQuestions(db, assignedSetValue, attemptedQuesCount);
                const prevQids = prevSessionQues.map((eq) => eq.question_id);
                // unattemptedQues = practiceEnglishUtils.filterContainment(questionIdsList, prevSessionQues, true);
                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    {
                        $match: {
                            question_id: { $in: prevQids },
                            question_type: { $not: { $in: ['translate_en', 'translate_hi'] } },
                        },
                    },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
            } else {
                const attemptedQues = await PracticeEnglishMySql.getPreviousAttemptedAll(db.mysql.read, studentId);

                const attemptedQids = attemptedQues.map((eq) => eq.question_id);

                // new questions
                // unattemptedQues = practiceEnglishUtils.filterContainment(questionIdsList, attemptedQues, false);
                // unattemptedQues = practiceEnglishUtils.filterNonTranslateQues(unattemptedQues);
                // unattemptedQues = practiceEnglishUtils.getRandomItemsByCount(unattemptedQues, 5);

                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    {
                        $match: {
                            question_id: { $not: { $in: attemptedQids } },
                            question_type: { $not: { $in: ['translate_en', 'translate_hi'] } },
                        },
                    },
                    { $sample: { size: 5 } },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
                // unattemptedQues = await PracticeEnglishContainer.getNextQuestions(db, assignedSetValue, attemptedQuesCount);
            }

            if (unattemptedQues.length < 5) {
                // unattemptedQues = await PracticeEnglishContainer.getQuestionIdsList(db);

                // unattemptedQues = practiceEnglishUtils.filterNonTranslateQues(questionIdsList);
                // const repeatedQues = practiceEnglishUtils.getRandomItemsByCount(unattemptedQues, 5);
                unattemptedQues = await db.mongo.read.collection('practice_english_questions').aggregate([
                    {
                        $match: {
                            question_type: { $not: { $in: ['translate_en', 'translate_hi'] } },
                        },
                    },
                    { $sample: { size: 5 } },
                    { $project: { _id: 0, question_id: 1, question_type: 1 } },
                ]).toArray();
            }
            if (unattemptedQues.length < 5) {
                const dataToReturn = {
                    title: PRODUCT_TITLE,
                    questions_list: [],
                };
                return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
            }
        }

        // new session
        const newSessionId = uuidv4();
        // const landingSession = await PracticeEnglishMySql.getLatestLandingSession(db.mysql.read, studentId);
        // if (landingSession.length) {
        //     newSessionId = landingSession[0].session_id;
        // await PracticeEnglishMySql.updateStudentSession(db.mysql.write, newSessionId, 0);
        // } else {
        await PracticeEnglishMySql.saveStudentSession(db.mysql.write, studentId, newSessionId, SESSION_START);
        // }

        await PracticeEnglishRedis.setReminderForStudent(db.redis.write, studentId, gcmRegId);

        const questionsList = unattemptedQues.map((question) => {
            question.display_type = practiceEnglishUtils.setDisplayType(question.question_type);
            delete question.question_type;
            return question;
        });

        const data = {
            title: PRODUCT_TITLE,
            session_id: newSessionId,
            questions_list: questionsList,
        };

        return res.status(200).json(responseTemplate('Success', data, 200));
    } catch (err) {
        next(err);
    }
}

async function getQuestion(req, res, next) {
    db = req.app.get('db');
    const s3 = req.app.get('s3');
    const cdnUrl = req.app.get('config').cdn_url;
    const studentLocale = req.user.locale || 'en';

    const questionId = parseInt(req.params.questionId);
    try {
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
            data.answer_audio_public_url = `${cdnUrl}${bucketKey}`;
        }

        return res.status(200).json(responseTemplate('Success', data, 200));
    } catch (err) {
        next(err);
    }
}

async function uploadAnswer(req, res, next) {
    db = req.app.get('db');
    const config = req.app.get('config');
    const s3 = req.app.get('s3');

    const questionId = parseInt(req.params.questionId);
    const data = { ...req.body };
    const studentId = req.user.student_id;
    const xAuthToken = req.headers['x-auth-token'];
    const { SESSION_START } = practiceEnglishUtils.practiceEnglishConstants;
    const { S3_BUCKET, S3_BUCKET_FOLDER, S3_SIGNED_URL_EXPIRY } = practiceEnglishUtils.practiceEnglishConstants;

    try {
        if (!data.textResponse && !data.audioResponse) {
            return res.status(400).json(responseTemplate('Failure', 'Please send either textResponse or audioResponse', 400));
        }

        const [questionData] = await PracticeEnglishContainer.getQuestionById(db, questionId);

        const question = practiceEnglishUtils.setQuestionMeta(questionData);

        let userAudioUrl = data.audioResponse || null;
        const sessionId = data.session_id || '';

        if (sessionId) {
            const sql = 'select * from practice_english_sessions where session_id = ? and student_id = ?';
            const sessionData = await db.mysql.read.query(sql, [sessionId, studentId]);
            // TODO: distinction between sessions from home or quiz screen.
            if (sessionData.length < 1) {
                const { source } = req.query;
                await PracticeEnglishMySql.saveStudentSession(db.mysql.write, studentId, sessionId, SESSION_START, source);
            }
        }

        if (userAudioUrl) {
            const locale = question.question_type === 'translate_en' ? 'hi' : 'en';

            const urlSplit = userAudioUrl.split('/');
            const s3Location = `${urlSplit[3]}/${urlSplit[4].split('?')[0]}`;

            const postData = {
                endpoint: `${config.microUrl}/api/transcript/speech-to-text-audio`,
                authToken: xAuthToken,
                audioLocation: s3Location,
                language: locale,
                correctAnswer: question.solutions,
            };
            const transcriptUserAudio = await practiceEnglishUtils.getTranscript(postData);
            // const transcriptUserAudio = await practiceEnglishUtils.getTranscriptTemp(s3, xAuthToken, s3Location, locale);

            if (transcriptUserAudio.length < 1) {
                return res.status(400).json(responseTemplate('Failure', 'Error transcribing audio.', 400));
            }
            data.textResponse = transcriptUserAudio.transcript[0] || '';
            data.audioResponse = `${config.cdn_url}${s3Location}`;
            userAudioUrl = data.audioResponse;
            // save transcript
            const transcriptObj = {
                student_id: studentId,
                audio_url: userAudioUrl,
                text: data.textResponse,
                locale,
            };
            await PracticeEnglishMySql.saveTranscription(db.mysql.write, transcriptObj);
        }
        const matchedAnswer = practiceEnglishUtils.matchAnswer(question, data);
        const {
            matchPercent, inputReceived, correctTokens, incorrectTokens,
        } = matchedAnswer;

        const [prevCount] = await PracticeEnglishMySql.getPrevSavedAnswerCount(db.mysql.read, questionId, studentId);

        const attemptNo = prevCount.previous_attempts + 1;

        const responseObj = {
            question_id: questionId,
            student_id: studentId,
            input_received: inputReceived,
            correct_tokens: correctTokens,
            incorrect_tokens: incorrectTokens,
            match_percent: matchPercent,
            session_id: sessionId,
            attempt_no: attemptNo,
        };
        await PracticeEnglishMySql.saveAnswer(db.mysql.write, responseObj);

        if (userAudioUrl) {
            const audioObj = {
                question_id: questionId,
                student_id: studentId,
                audio_url: userAudioUrl,
                attempt_no: attemptNo,
            };
            await PracticeEnglishMySql.saveAudioData(db.mysql.write, audioObj);
        }
        const correct = parseInt(matchPercent) > 50;
        const { SUCCESS_COLOR, FAILURE_COLOR } = practiceEnglishUtils.practiceEnglishConstants;

        let percentageTextColor = SUCCESS_COLOR;
        if (!correct) {
            percentageTextColor = FAILURE_COLOR;
        }

        const dataToReturn = { question, ...matchedAnswer };

        dataToReturn.correct = correct;
        dataToReturn.matchPercent = `${matchPercent} %`;
        dataToReturn.percentageTextColor = percentageTextColor;
        dataToReturn.correctText = 'Correct';
        dataToReturn.yourAnswerText = 'Your Answer';
        dataToReturn.correctAnswerText = 'Correct Answer';
        dataToReturn.next_button_text = 'Next';

        if (question.question_type === 'translate_en' || question.question_type === 'translate_hi') {
            const s3FileName = `${uuidv4()}_${moment().unix()}_useraudios.3gp`;
            const bucketKey = `${S3_BUCKET_FOLDER}/${s3FileName}`;

            const uploadUrl = await getSignedUrlFromAwsSdk(s3, S3_BUCKET, bucketKey, S3_SIGNED_URL_EXPIRY, 'video/3gpp');

            dataToReturn.try_again_upload_url = uploadUrl;
        }
        return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
    } catch (err) {
        next(err);
    }
}

function getCurrentTimestamp() {
    return moment().add(5, 'hours').add(30, 'minutes').valueOf();
}
async function endTest(req, res, next) {
    db = req.app.get('db');
    const cdnUrl = req.app.get('config').cdn_url;
    const studentId = req.user.student_id;
    const { session_id: sessionId, source } = req.query;

    try {
        const {
            SESSION_END, THEME_COLOR, APP_DEEPLINK, CHEERS_IMAGE_S3, END_TEST_SUBTITLE, QUESTIONS_NOMORE_TITLE, QUESTIONS_NOMORE_SUBTITLE,

        } = practiceEnglishUtils.practiceEnglishConstants;

        const {
            CONTEST_LIVE, CONTEST_END_SCREEN_IMAGE, CONTEST_BUTTON_TEXT, CONTEST_SUBTITLE_TEXT, CONTEST_SUBTITLE_TEXT_ALT,
        } = practiceEnglishUtils.dailyContestConstants;

        const sql = 'select value as end_screen_image from dn_property where bucket = "quiztfs" and name = "end_banner"';
        const banner = await db.mysql.read.query(sql);

        const dataToReturn = {
            image_url: `${cdnUrl}${CHEERS_IMAGE_S3}`,
        };
        if (!sessionId) {
            dataToReturn.display_title_text = QUESTIONS_NOMORE_TITLE;
            dataToReturn.display_subtitle_text = QUESTIONS_NOMORE_SUBTITLE;
            if (CONTEST_LIVE) {
                dataToReturn.image_url = `${cdnUrl}${CONTEST_END_SCREEN_IMAGE}`;
                if (_.get(banner[0], 'end_screen_image', null)) {
                    const staticS3 = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/';
                    dataToReturn.image_url = banner[0].end_screen_image.replace(staticS3, cdnUrl);
                }
                dataToReturn.display_subtitle_text = CONTEST_SUBTITLE_TEXT
                    .replace('##attempted##', 100)
                    .replace('##remaining##', 0);
            }
        } else {
            const attemptedQuestions = await PracticeEnglishMySql.getAttemptedQuestionsBySession(db.mysql.read, sessionId);

            const correctQuestions = attemptedQuestions.filter((eachQuestion) => parseInt(eachQuestion.match_percent) > 50).length;

            let isSuccess = 0;
            // if (CONTEST_LIVE) {
            isSuccess = +(correctQuestions > 2);
            // } else {
            //     isSuccess = +(correctQuestions > 2);
            // }
            await PracticeEnglishMySql.endStudentSession(db.mysql.write, studentId, sessionId, SESSION_END, isSuccess);

            if (isSuccess) {
                const lastPostTimeStamp = await PracticeEnglishRedis.getUserKeyPE(db.redis.read, studentId, 'last_pe_post_time');
                const currentTimeStamp = getCurrentTimestamp();
                if (
                    _.isNull(lastPostTimeStamp)
                    || ((currentTimeStamp - JSON.parse(lastPostTimeStamp)) > (30 * 60 * 1000))
                ) {
                    kafka.publish(kafka.topics.practiceEnglishFeedPost, 0, {
                        student_name: `${req.user.student_fname} ${req.user.student_lname}`,
                        student_img_url: req.user.img_url,
                        student_id: req.user.student_id,
                        student_class: req.user.student_class || 12,
                    });
                    await PracticeEnglishRedis.setUserKeyPE(db.redis.read, studentId, 'last_pe_post_time', currentTimeStamp);
                }
            }
            let displayText = `You got <span style='color: ${THEME_COLOR}'>${correctQuestions} correct</span> answers!`;
            let displaySubtitleText = END_TEST_SUBTITLE;
            let deeplink = APP_DEEPLINK;
            let practiceMore = 'Practice More';
            let tryAgain = '';
            if (CONTEST_LIVE) {
                const todaysDate = practiceEnglishUtils.getDateString();

                const prevSuccessList = await PracticeEnglishMySql.getPreviousSuccessSession(db.mysql.read, studentId, todaysDate);
                const prevSuccessSessions = prevSuccessList.length;

                let remainingAttempts = await practiceEnglishUtils.getRemainingAttempts(db, studentId);

                if (remainingAttempts == 100) {
                    remainingAttempts = 99;
                }
                dataToReturn.image_url = `${cdnUrl}${CONTEST_END_SCREEN_IMAGE}`;

                if (_.get(banner[0], 'end_screen_image', null)) {
                    const staticS3 = 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/';
                    dataToReturn.image_url = banner[0].end_screen_image.replace(staticS3, cdnUrl);
                }

                displayText = `You got <span style='color: ${THEME_COLOR}'>${correctQuestions * 20}% correct</span> answers!`;
                displaySubtitleText = CONTEST_SUBTITLE_TEXT
                    .replace('##attempted##', 100 - remainingAttempts)
                    .replace('##remaining##', remainingAttempts);

                practiceMore = CONTEST_BUTTON_TEXT;
                if (correctQuestions < 3) {
                    displayText = `You got only <span style='color: ${THEME_COLOR}'>${correctQuestions * 20}% correct</span> answers!`;

                    if (prevSuccessSessions < 1) {
                        displaySubtitleText = CONTEST_SUBTITLE_TEXT_ALT.replace('##remaining##', remainingAttempts);
                        deeplink = `${APP_DEEPLINK}?session_id=${sessionId}`;
                        practiceMore = '';
                        tryAgain = 'Try Again';
                    }
                }
            } else if (correctQuestions < 3) {
                displayText = `You got only <span style='color: ${THEME_COLOR}'>${correctQuestions} correct</span> answers!`;
                practiceMore = '';
                tryAgain = 'Try Again';
                deeplink = `${APP_DEEPLINK}?session_id=${sessionId}`;
            }

            dataToReturn.display_title_text = displayText;
            dataToReturn.display_subtitle_text = displaySubtitleText;
            dataToReturn.practice_more_button_text = practiceMore;
            dataToReturn.try_again_button_text = tryAgain;
            dataToReturn.deeplink = deeplink;
            dataToReturn.reminder_text = 'Remind me Tomorrow';
        }

        if (source == 'home') {
            let prevSessId = null;
            if (dataToReturn.try_again_button_text === 'Try Again') {
                prevSessId = sessionId;
            }
            const versionCode = req.headers.version_code || 974;
            const widgetData = await PracticeEnglishHelper.getQuestionsListWidget(db, studentId, req.user.locale, versionCode, prevSessId);
            dataToReturn.session_id = uuidv4();
            dataToReturn.questions = widgetData.questions;
            if (versionCode >= 976) {
                dataToReturn.display_type = widgetData.display_type;
            }
        }

        return res.status(200).json(responseTemplate('Success', dataToReturn, 200));
    } catch (e) {
        next(e);
    }
}

async function setReminderForTomorrow(req, res, next) {
    db = req.app.get('db');

    try {
        const { student_id: studentId, gcm_reg_id: gcmRegId } = req.user;
        if (studentId && gcmRegId) {
            await PracticeEnglishRedis.setReminderForStudent(db.redis.write, studentId, gcmRegId);
        }
        return res.status(200).json(responseTemplate('Success', 'Reminder Set', 200));
    } catch (err) {
        next(err);
    }
}

async function addQuestions(req, res, next) {
    db = req.app.get('db');
    const aws = req.app.get('aws');
    const cdnUrl = req.app.get('config').cdn_url;

    try {
        // csvData: 2D array of questions with first element as headers array.
        const fileRows = req.body.csvData;

        if (!fileRows || !Array.isArray(fileRows) || !Array.isArray(fileRows[0])) {
            return res.status(400).json(responseTemplate('Please check Data format.', 'Please check data format. {"csvData": [["question_type", "chapter", "question", "question_image", "option_1", "option_2", "option_3", "option_4", "solutions", "answer"]]}', 400));
        }

        const fileHeader = fileRows[0];
        const isValidCSVHeader = practiceEnglishUtils.checkCSVHeaders(fileHeader);

        const questionsList = fileRows.slice(1);

        if (!isValidCSVHeader) {
            return res.status(400).json(responseTemplate('Please check CSV format.', 'Please check CSV format.', 400));
        }

        const { QUESTION_TABLE_STUDENT_ID } = practiceEnglishUtils.practiceEnglishConstants;

        const mongoQuesList = [];
        const savedQuestions = [];
        const [validQuestions, invalidQuestions] = practiceEnglishUtils.filterValidQuestions(questionsList);

        await Promise.all(validQuestions.map(async (eachQuestion) => {
            const question = eachQuestion.map((elem) => {
                if (typeof elem === 'string' || elem instanceof String) {
                    return elem.trim();
                }
                return elem;
            });
            // question format is
            // question[0] : question_type
            // question[1] : chapter
            // question[2] : difficulty
            // question[3] : question
            // question[4] : question_image
            // question[5] : option_1
            // question[6] : option_2
            // question[7] : option_3
            // question[8] : option_4
            // question[9] : solutions
            // question[10] : answer

            const difficultyLevel = question[2] || 1;
            let questionAudioUrl = '';
            let answerAudioUrl = '';
            let answerText = '';

            if (question[0].startsWith('translate')) {
                [questionAudioUrl, answerAudioUrl] = await practiceEnglishUtils.generateSpeech(aws, cdnUrl, { question: question[3], answer: question[9] });
            }
            if (question[10]) {
                answerText = question[10];
                [answerAudioUrl] = await practiceEnglishUtils.generateSpeech(aws, cdnUrl, { answer: answerText });
            }

            const savedQuestion = await PracticeEnglishMySql.addQuestion(db.mysql.write, QUESTION_TABLE_STUDENT_ID, question[1], difficultyLevel, question[3], question[4]);
            const savedQuestionId = savedQuestion.insertId;

            await PracticeEnglishMySql.addTextSolution(db.mysql.write, savedQuestionId, question[0], question[5], question[6], question[7], question[8], answerText, questionAudioUrl, answerAudioUrl, question[9]);

            mongoQuesList.push({
                question_id: savedQuestionId,
                question_type: question[0],
            });

            savedQuestions.push({
                questionId: savedQuestionId,
                question: question[3],
            });
        }));
        await db.mongo.write.collection('practice_english_questions').insertMany(mongoQuesList, { ordered: false });

        await PracticeEnglishRedis.removeQuestionIdsList(db.redis.write);

        return res.status(200).json(responseTemplate('Success', { savedQuestions, invalidQuestions }, 200));
    } catch (e) {
        next(e);
    }
}

async function getAllQuestions(req, res, next) {
    db = req.app.get('db');

    try {
        const pageNumber = parseInt(req.query.page) - 1 || 0;
        const pageSize = 10;
        let questionId = parseInt(req.query.question_id);
        const { question, question_type: questionType } = req.query;

        if (Number.isNaN(questionId)) {
            questionId = null;
        }
        const questionsList = await PracticeEnglishMySql.getAllQuestions(db.mysql.read, questionId, question, questionType, pageSize, pageNumber);
        return res.status(200).json(responseTemplate('Success', questionsList, 200));
    } catch (err) {
        next(err);
    }
}

async function skipQuestion(req, res, next) {
    db = req.app.get('db');

    try {
        const { questionId } = req.params;
        const skipValue = parseInt(req.query.skip_value);

        await PracticeEnglishMySql.skipQuestion(db.mysql.write, questionId, skipValue);
        await PracticeEnglishRedis.removeQuestionById(db.redis.write, questionId);
        await PracticeEnglishRedis.removeQuestionIdsList(db.redis.write);

        return res.status(200).json(responseTemplate('Success', 'questionsList', 200));
    } catch (err) {
        next(err);
    }
}

async function getQuestionAdmin(req, res, next) {
    db = req.app.get('db');
    const questionId = parseInt(req.params.questionId);

    try {
        const [questionsData] = await PracticeEnglishMySql.getQuestionById(db.mysql.read, questionId);
        return res.status(200).json(responseTemplate('Success', questionsData, 200));
    } catch (err) {
        next(err);
    }
}

async function updateQuestionById(req, res, next) {
    db = req.app.get('db');
    const aws = req.app.get('aws');
    const cdnUrl = req.app.get('config').cdn_url;

    const questionId = parseInt(req.params.questionId);
    const bodyData = { ...req.body };
    try {
        const [questionData] = await PracticeEnglishContainer.getQuestionById(db, questionId);
        let questionAudio = questionData.question_audio;
        let answerAudio = questionData.answer_audio;

        if (questionData.question_type.startsWith('translate')) {
            if (bodyData.question !== questionData.question) {
                const [questionAudioUrl] = await practiceEnglishUtils.generateSpeech(aws, cdnUrl, { question: bodyData.question });
                questionAudio = questionAudioUrl;
                await PracticeEnglishMySql.updateQuestionById(db.mysql.write, questionId, bodyData.question);
            }
            if (bodyData.solutions !== questionData.solutions) {
                const [answerAudioUrl] = await practiceEnglishUtils.generateSpeech(aws, cdnUrl, { answer: bodyData.solutions });
                answerAudio = answerAudioUrl;
            }
        } else if (bodyData.question !== questionData.question) {
            await PracticeEnglishMySql.updateQuestionById(db.mysql.write, questionId, bodyData.question);
        }

        if (bodyData.textAnswer !== questionData.text_answer) {
            const [answerAudioUrl] = await practiceEnglishUtils.generateSpeech(aws, cdnUrl, { answer: bodyData.textAnswer });
            answerAudio = answerAudioUrl;
        }
        await PracticeEnglishMySql.updateTextSolutionsById(db.mysql.write, questionId, bodyData.option1, bodyData.option2, bodyData.option3, bodyData.option4, bodyData.textAnswer, questionAudio, answerAudio, bodyData.solutions);

        await PracticeEnglishRedis.removeQuestionById(db.redis.write, questionId);

        return res.status(200).json(responseTemplate('Success', { questionId, bodyData }, 200));
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getQuestionsList,
    getQuestion,
    uploadAnswer,
    endTest,
    setReminderForTomorrow,
    addQuestions,
    getAllQuestions,
    skipQuestion,
    getQuestionAdmin,
    updateQuestionById,
};
