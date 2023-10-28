// const fuzz = require('fuzzball');
const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const speech = require('@google-cloud/speech');

const s3Temp = require('../../../config/aws').s3();

const PracticeEnglishMySql = require('../../../modules/mysql/practiceEnglish');

// const { configMicroInst } = require('../../../modules/axiosInstances');

const uploadDir = path.join(__dirname, '__uploads');

let creds = {};
const credsFile = path.join(__dirname, '../../../vision_gcp.json');

if (fs.existsSync(credsFile)) {
    // eslint-disable-next-line import/no-dynamic-require
    creds = require(credsFile);
}

const speechClient = new speech.SpeechClient({
    credentials: creds,
});

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const dailyContestConstants = {
    CONTEST_LIVE: false,
    CONTEST_START_DATE: '2022-01-28',
    CONTEST_SUBTITLE_TEXT: 'Aapne ##attempted## attempts kar liye. Jeetne ke chances badhane ke liye or attempt karo. (##remaining## attempts left)',
    CONTEST_SUBTITLE_TEXT_ALT: 'Lucky draw me eligible hone ke liye apke paas ##remaining## attempts bache hain!',
    CONTEST_END_SCREEN_IMAGE: 'images/2022/01/28/11-21-47-574-AM_Quiz%20War%20Banner%202_3.webp',
    CONTEST_BUTTON_TEXT: 'Double your chance',
};

const practiceEnglishConstants = {
    // identifier for practice english questions in questions table;
    QUESTION_TABLE_STUDENT_ID: -501,
    PRODUCT_TITLE: 'English Practice',
    APP_DEEPLINK: 'doubtnutapp://practice_english',
    S3_BUCKET: 'doubtnut-static',
    S3_BUCKET_FOLDER: 'practiceEnglish',
    S3_SIGNED_URL_EXPIRY: 60 * 60,
    SESSION_START: 0,
    SESSION_END: 1,
    CHEERS_IMAGE_S3: 'images/cheers_image_practice_english.png',
    QUESTIONS_NOMORE_TITLE: 'Aapne saare questions attempt kr liye.',
    QUESTIONS_NOMORE_SUBTITLE: 'Congratulations, itni practice complete karne ke liye.',
    END_TEST_SUBTITLE: 'Congratulations! Keep learning..',
    QUESTION_TYPES: [
        'translate_en',
        'translate_hi',
        'translate_en_text',
        'translate_hi_text',
        'image_mcq',
        'blank_word',
        'blank_mcq',
        'blank_multi_word',
    ],
    QUESTION_TYPES_MAP: {
        translate_en: 'AUDIO_QUESTION',
        translate_hi: 'AUDIO_QUESTION',
        translate_en_text: 'TEXT_QUESTION',
        translate_hi_text: 'TEXT_QUESTION',
        image_mcq: 'IMAGE_QUESTION',
        blank_mcq: 'SINGLE_CHOICE_QUESTION',
        blank_word: 'SINGLE_BLANK_QUESTION',
        blank_multi_word: 'MULTI_BLANK_QUESTION',
    },
    QUESTION_TITLE_DISPLAY_MAP: {
        translate_en: 'इस वाक्य को हिंदी में बोलें',
        translate_hi: 'इस वाक्य को अंग्रेज़ी में बोलें',
        translate_en_text: 'इस वाक्य को हिंदी में लिखें',
        translate_hi_text: 'इस वाक्य को अंग्रेज़ी में लिखें',
        image_mcq: 'सही उत्तर चुनिए',
        blank_mcq: 'सही उत्तर चुनिए',
        blank_word: 'रिक्त स्थान पर क्लिक करें और जवाब लिखें',
        blank_multi_word: 'सही विकल्प का चयन करें',
    },
    QUESTION_TITLE_DISPLAY_MAP_WORD: {
        translate_en: 'इस शब्द को हिंदी में बोलें',
        translate_hi: 'इस शब्द को अंग्रेज़ी में बोलें',
        translate_en_text: 'इस शब्द को हिंदी में लिखें',
        translate_hi_text: 'इस शब्द को अंग्रेज़ी में लिखें',
    },
    QUESTION_LANG_MAP: {
        translate_en_text: 'hi',
        translate_hi_text: 'en',
    },
    ERROR_TOAST_TEXT: {
        hi: {
            translate_en_text: 'रिक्त स्थान पर क्लिक करके उत्तर लिखो!',
            translate_hi_text: 'रिक्त स्थान पर क्लिक करके उत्तर लिखो!',
            blank_multi_word: 'कोई तो शब्द चुनो!',
            blank_word: 'रिक्त स्थान पर क्लिक करके उत्तर लिखो!',
        },
        en: {
            translate_en_text: 'Blank par click karke answer likho!',
            translate_hi_text: 'Blank par click karke answer likho!',
            blank_multi_word: 'Koi toh word select karo!',
            blank_word: 'Blank par click karke answer likho!',
        },
    },
    SUCCESS_COLOR: '#3b8700',
    FAILURE_COLOR: '#ff0000',
    THEME_COLOR: '#eb532c',
    SAMPLE_CSV_HEADERS: [
        'question_type',
        'chapter',
        'difficulty',
        'question',
        'question_image',
        'option_1',
        'option_2',
        'option_3',
        'option_4',
        'solutions',
        'answer',
    ],
};

function removePunctuation([...stringList]) {
    const result = [];
    stringList.forEach((str) => {
        const punctuationLess = str.replace(/[.,/#!$%^&*;:{}=\-_`~()?|।]/g, '');
        const punctuationLessFinal = punctuationLess.replace(/\s{2,}/g, ' ').trim().normalize('NFKC');
        result.push(punctuationLessFinal);
    });
    return result;
}

function matchStrings(input, source) {
    // return fuzz.ratio(input, source);
    // const [inputPunctuationLess, sourcePunctuationLess] = removePunctuation([input, source]);
    return Math.floor(stringSimilarity.compareTwoStrings(input.toLowerCase(), source.toLowerCase()) * 100);
}

function formatString(input, source) {
    const str1arr = input.toLowerCase().split(' ');

    const [sourcePunctuationLess] = removePunctuation([source]);

    let matchStringArray = sourcePunctuationLess.trim().toLowerCase().split(' ');
    const { SUCCESS_COLOR, FAILURE_COLOR } = practiceEnglishConstants;

    let coloredString = '';
    for (const word of str1arr) {
        if (matchStringArray.includes(word)) {
            coloredString += `<span style='color: ${SUCCESS_COLOR}'>${word}</span> `;
            const oo = matchStringArray.indexOf(word);
            matchStringArray = matchStringArray.slice(0, oo).concat(matchStringArray.slice(oo + 1, matchStringArray.length));
        } else {
            coloredString += `<span style='color: ${FAILURE_COLOR}'>${word}</span> `;
        }
    }
    return [coloredString, source];
}

function formatBlankString(question, input, source) {
    const { SUCCESS_COLOR, FAILURE_COLOR } = practiceEnglishConstants;

    let coloredString = '';

    const [inputPunctuationLess, sourcePunctuationLess] = removePunctuation([input, source]);

    for (const word of question) {
        if (word === '_____') {
            if (inputPunctuationLess.toLowerCase().trim() === sourcePunctuationLess.toLowerCase().trim()) {
                coloredString += `<span style='color: ${SUCCESS_COLOR}'>${input} </span> `;
            } else {
                coloredString += `<span style='color: ${FAILURE_COLOR}'>${input} </span> `;
            }
        } else {
            coloredString += `<span style='color: ${SUCCESS_COLOR}'>${word}</span> `;
        }
    }
    return coloredString;
}

function formatMultiBlankString(question, [...input], [...source]) {
    const { SUCCESS_COLOR, FAILURE_COLOR } = practiceEnglishConstants;

    let coloredString = '';
    for (const word of question) {
        if (word === '_____') {
            const inWord = input.shift();
            const correctWord = source.shift();

            if (inWord.toLowerCase() === correctWord.toLowerCase()) {
                coloredString += `<span style='color: ${SUCCESS_COLOR}'>${inWord} </span> `;
            } else {
                coloredString += `<span style='color: ${FAILURE_COLOR}'>${inWord} </span> `;
            }
        } else {
            coloredString += `<span style='color: ${SUCCESS_COLOR}'>${word}</span> `;
        }
    }
    return coloredString;
}

function tokenizeString(givenString) {
    return givenString.toLowerCase().split(' ')
        .map((item) => item.trim())
        .filter((item) => item);
}

function filterTokens(source, target) {
    const sourceTokens = tokenizeString(source);
    const targetTokens = tokenizeString(target);

    const correctTokens = [];
    const incorrectTokens = [];
    sourceTokens.forEach((word) => {
        if (targetTokens.includes(word)) {
            correctTokens.push(word);
        } else {
            incorrectTokens.push(word);
        }
    });
    return [correctTokens, incorrectTokens];
}

function countCorrectTokensAndAnswer([...givenTokens], [...answerTokens]) {
    const correctTokens = [];
    const incorrectTokens = [];
    let correctTokenCount = 0;

    givenTokens.forEach((word, i) => {
        // console.log(word, answerTokens[i]);
        if (word.toLowerCase() === answerTokens[i].toLowerCase()) {
            correctTokenCount++;
            correctTokens.push(word);
        } else {
            incorrectTokens.push(word);
        }
    });
    return [correctTokenCount, correctTokens, incorrectTokens];
}

function setDisplayType(questionType) {
    const { QUESTION_TYPES_MAP } = practiceEnglishConstants;
    return QUESTION_TYPES_MAP[questionType];
}

function setQuestionAnswer(question) {
    const questionType = question.question_type;

    const tempQuestion = {};
    if (questionType === 'blank_word') {
        const questionList = question.question.replace(/_{5,}/g, '_____').split(' ');

        const questArray = [];
        for (let i = 0; i < questionList.length - 1; i++) {
            if (questionList[i] !== '_____') {
                questArray.push(`${questionList[i]} `);
            } else {
                questArray.push(questionList[i]);
            }
        }
        questArray.push(questionList[questionList.length - 1]);

        tempQuestion.question = questArray.filter((eachQues) => eachQues);
    }
    if (questionType === 'blank_multi_word') {
        const questionList = question.question.replace(/_{5,}/g, '_____').split(' ');

        const solutionsArray = question.solutions.split('::;::');
        const otherOptions = question.opt_1.split('::;::').sort(() => Math.random() - Math.random());

        const questArray = [];
        for (let i = 0; i < questionList.length - 1; i++) {
            if (questionList[i] !== '_____') {
                questArray.push(`${questionList[i]} `);
            } else {
                questArray.push(questionList[i]);
            }
        }
        questArray.push(questionList[questionList.length - 1]);

        tempQuestion.question = questArray.filter((eachQues) => eachQues);

        tempQuestion.solutions = solutionsArray;
        tempQuestion.otherOptions = otherOptions;
        tempQuestion.otherOptionText = 'Sahi answer select karo';
        tempQuestion.refresh_button_text = 'Refresh';
    }
    if (questionType === 'blank_mcq' || questionType === 'image_mcq') {
        tempQuestion.options = [question.opt_1, question.opt_2, question.opt_3, question.opt_4];
        tempQuestion.otherOptionText = 'Sahi answer select karo';
    }
    return tempQuestion;
}

function setQuestionMeta(question, locale = 'en') {
    const studentLocale = (locale == 'hi') ? 'hi' : 'en';
    const questionType = question.question_type;
    const { ERROR_TOAST_TEXT } = practiceEnglishConstants;

    const tempQuestion = { ...question };
    const questionAnswerType = setQuestionAnswer(question);

    tempQuestion.question_display = setDisplayType(questionType);
    tempQuestion.title = practiceEnglishConstants.QUESTION_TITLE_DISPLAY_MAP[questionType];

    if (questionType.startsWith('translate')) {
        if (tempQuestion.question.split(' ').length < 2) {
            tempQuestion.title = practiceEnglishConstants.QUESTION_TITLE_DISPLAY_MAP_WORD[questionType];
        }
    }
    if (questionType.startsWith('translate') || questionType === 'blank_word' || questionType === 'blank_multi_word') {
        delete tempQuestion.question_image;
        delete tempQuestion.opt_1;
        delete tempQuestion.opt_2;
        delete tempQuestion.opt_3;
        delete tempQuestion.opt_4;
    }

    if (questionType === 'translate_en_text' || questionType === 'translate_hi_text') {
        tempQuestion.error_toast_text = ERROR_TOAST_TEXT[studentLocale][questionType];
        tempQuestion.write_ans_hint = 'Please Type here...';
        tempQuestion.show_mic = true;
        tempQuestion.language = practiceEnglishConstants.QUESTION_LANG_MAP[questionType];
    }
    if (questionType === 'image_word' || questionType === 'image_mcq') {
        delete tempQuestion.text_answer;
        delete tempQuestion.question_audio;
        delete tempQuestion.answer_audio;
        delete tempQuestion.opt_1;
        delete tempQuestion.opt_2;
        delete tempQuestion.opt_3;
        delete tempQuestion.opt_4;
    }
    if (questionType === 'blank_mcq') {
        tempQuestion.question_audio = tempQuestion.answer_audio;

        delete tempQuestion.question_image;
        delete tempQuestion.answer_audio;
        delete tempQuestion.opt_1;
        delete tempQuestion.opt_2;
        delete tempQuestion.opt_3;
        delete tempQuestion.opt_4;
    }
    if (questionType === 'blank_word' || questionType === 'blank_multi_word') {
        tempQuestion.error_toast_text = ERROR_TOAST_TEXT[studentLocale][questionType];
        tempQuestion.answer_text = 'Listen complete sentence';
        delete tempQuestion.question_audio;
    }

    return {
        ...tempQuestion,
        ...questionAnswerType,
    };
}

function checkAllStrings([...availStrings]) {
    const inValidStrings = availStrings.filter((eachString) => eachString.length < 1);
    if (inValidStrings.length > 0) {
        return false;
    }
    return true;
}

function checkValidMultiBlankQues(multiBlankQuestion, multiBlankSolution, multiBlankOptions) {
    const blanksCount = (multiBlankQuestion.match(/_____/g) || []).length;
    const solutionsCount = multiBlankSolution.split('::;::').length;
    const optionsCount = multiBlankOptions.split('::;::').length;

    const blankMatch = (blanksCount === solutionsCount);
    const optionsMatch = (optionsCount > solutionsCount);

    return (blankMatch && optionsMatch);
}

function validateQuestion(question) {
    const tempQuestion = [...question];
    const { QUESTION_TYPES: questionTypes } = practiceEnglishConstants;

    if (!Array.isArray(tempQuestion) || !questionTypes.includes(tempQuestion[0])) {
        return false;
    }

    const validQuesSol = checkAllStrings([tempQuestion[3], tempQuestion[9]]);
    let validMcqType = true;
    let validImageType = true;
    let validMultiBlankType = true;

    if (tempQuestion[0].endsWith('mcq')) {
        validMcqType = checkAllStrings([tempQuestion[5], tempQuestion[6], tempQuestion[7], tempQuestion[8]]);
    }
    if (tempQuestion[0].startsWith('image')) {
        validImageType = checkAllStrings([tempQuestion[4]]);
    }
    if (tempQuestion[0] === 'blank_multi_word') {
        validMultiBlankType = checkValidMultiBlankQues(tempQuestion[3], tempQuestion[9], tempQuestion[5]);
    }

    const isValidQuestion = validQuesSol && validMcqType && validImageType && validMultiBlankType;
    if (!isValidQuestion) {
        return false;
    }

    return true;
}

function filterValidQuestions(questionsList) {
    const invalidQuestions = [];

    const validQuestions = questionsList.filter((question) => {
        if (!validateQuestion(question)) {
            invalidQuestions.push({
                question_type: question[0],
                question: question[3],
            });
            return false;
        }
        return true;
    });

    return [validQuestions, invalidQuestions];
}

function checkCSVHeaders([...csvHeaders]) {
    const { SAMPLE_CSV_HEADERS: sampleFields } = practiceEnglishConstants;

    const csvFields = csvHeaders.map((eachRow) => eachRow.trim());

    const isValidCSV = csvFields.length === sampleFields.length
        && csvFields.every((elem, i) => elem === sampleFields[i]);

    return isValidCSV;
}

function getRandomItemsByCount([...allItems], count = 10) {
    return allItems.sort(() => Math.random() - Math.random())
        .slice(0, count);
}

function filterTranslateQues(allQuesList) {
    return allQuesList.filter((eachQues) => eachQues.question_type.startsWith('translate'));
}

function filterNonMcqQues(allQuesList) {
    return allQuesList.filter((eachQues) => !eachQues.question_type.endsWith('mcq'));
}

function filterNonTranslateQues(allQuesList) {
    return allQuesList.filter((eachQues) => !eachQues.question_type.startsWith('translate'));
}

function filterContainment(allQuesList, checkQuesList, contains = false) {
    const checkListIds = checkQuesList.map((ques) => ques.question_id);

    if (contains) {
        return allQuesList.filter((eachQues) => checkListIds.includes(eachQues.question_id));
    }
    return allQuesList.filter((eachQues) => !checkListIds.includes(eachQues.question_id));
}

// for internal use only: don't expose
async function uploadToS3(aws, fileBuf, contentType) {
    const s3 = new aws.S3();

    const { S3_BUCKET, S3_BUCKET_FOLDER } = practiceEnglishConstants;
    const outputFormat = contentType.split('/')[1];

    const fileName = `${uuidv4()}_${moment().unix()}_questionaudios.${outputFormat}`;
    const bucketKey = `${S3_BUCKET_FOLDER}/${fileName}`;

    const params = {
        Bucket: S3_BUCKET,
        Key: bucketKey,
        Body: fileBuf,
        ContentType: contentType,
    };

    const s3Location = `${bucketKey}`;

    return new Promise((resolve, reject) => {
        s3.putObject(params, (err) => {
            if (err) {
                reject(err);
            }
            resolve(s3Location);
        });
    });
}

// for internal use only: don't expose
async function textToSpeech(aws, text) {
    const Polly = new aws.Polly();

    const outputFormat = 'mp3';
    const params = {
        Text: text,
        OutputFormat: outputFormat,
        VoiceId: 'Aditi',
    };
    return new Promise((resolve, reject) => {
        Polly.synthesizeSpeech(params, async (err, data) => {
            if (err) {
                reject(err);
            }

            const publicKey = await uploadToS3(aws, data.AudioStream, `audio/${outputFormat}`);
            resolve(publicKey);
        });
    });
}

async function generateSpeech(aws, cdnUrl, { ...textObj }) {
    const textFields = Object.keys(textObj);

    const audioUrls = await Promise.all(textFields.map(async (eachKey) => {
        const textString = textObj[eachKey];
        if (textString) {
            const publicKey = await textToSpeech(aws, textString);
            return `${cdnUrl}${publicKey}`;
        }
        return '';
    }));

    return audioUrls;
}

async function downloadFile(key, filePath) {
    const { S3_BUCKET } = practiceEnglishConstants;

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const s = s3Temp.getObject({
            Bucket: S3_BUCKET,
            Key: key,
        }).createReadStream().on('error', (err) => {
            reject(err);
            fs.unlinkSync(filePath);
        }).pipe(file);
        s.on('close', () => {
            resolve('');
        });
    });
}

async function readFile(filePath) {
    const data = fs.readFileSync(filePath);
    fs.unlinkSync(filePath);
    return data;
}

async function getTranscript({ correctAnswer, audioLocation, language }) {
    const inFilePath = path.join(uploadDir, `${uuidv4()}`);

    // const { data } = await configMicroInst({
    //     method: 'POST',
    //     url: postData.endpoint,
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'x-auth-token': postData.authToken,
    //     },
    //     data: {
    //         audioLocation: audioLocation,
    //         language: language,
    //     },
    // });
    // if (!data) {
    //     return [];
    // }

    // return data;
    try {
        await downloadFile(audioLocation, inFilePath);

        let langCode = 'en-IN';
        // let alternateLangCode = 'hi-IN';
        if (language === 'hi') {
            langCode = 'hi-IN';
            // alternateLangCode = 'en-IN';
        }
        const audioBufferin = await readFile(inFilePath);

        const audio = {
            content: audioBufferin.toString('base64'),
        };
        const config = {
            encoding: 'AMR',
            languageCode: langCode,
            sampleRateHertz: 8000,
            speechContexts: [{
                phrases: [correctAnswer],
            }],
            // alternativeLanguageCodes: [alternateLangCode],

        };
        const request = {
            audio,
            config,
        };
        const [response] = await speechClient.recognize(request);

        const transcript = response.results
            .map((result) => result.alternatives[0].transcript);

        return { transcript: [transcript[0] || ''] };
    } catch (err) {
        console.log(err);
        return { transcript: [''] };
    }
}

function matchAnswer(question, data) {
    let matchPercent = 0;
    let inputReceived = data.textResponse;
    let userTextDisplay = '';
    let correctTextDisplay = '';
    let correctTokens = [];
    let incorrectTokens = [];

    const correctSolution = question.solutions;
    const correctTextAnswer = question.text_answer || question.solutions;

    const userTextAnswer = data.textResponse;

    const questionDisplayType = question.question_display;

    const dataToReturn = {};
    if (questionDisplayType === 'AUDIO_QUESTION' || questionDisplayType === 'TEXT_QUESTION') {
        const [inputPunctuationLess, sourcePunctuationLess] = removePunctuation([userTextAnswer, correctSolution]);

        matchPercent = matchStrings(inputPunctuationLess, sourcePunctuationLess);

        [userTextDisplay, correctTextDisplay] = formatString(userTextAnswer, correctSolution);
        [correctTokens, incorrectTokens] = filterTokens(userTextAnswer, correctSolution);
    } else if (questionDisplayType === 'SINGLE_BLANK_QUESTION') {
        const [inputPunctuationLess, sourcePunctuationLess] = removePunctuation([userTextAnswer, correctSolution]);

        if (inputPunctuationLess.toLowerCase() === sourcePunctuationLess.toLowerCase()) {
            matchPercent = 100;
            correctTokens = [userTextAnswer];
        } else {
            incorrectTokens = [userTextAnswer];
        }

        userTextDisplay = formatBlankString(question.question, userTextAnswer, correctSolution);
        correctTextDisplay = correctTextAnswer;
    } else if (questionDisplayType === 'MULTI_BLANK_QUESTION') {
        let correctWords = 0;

        [correctWords, correctTokens, incorrectTokens] = countCorrectTokensAndAnswer(userTextAnswer, correctSolution);

        matchPercent = Math.round((correctWords * 100) / correctSolution.length);

        userTextDisplay = formatMultiBlankString(question.question, userTextAnswer, correctSolution);
        correctTextDisplay = correctTextAnswer;

        inputReceived = userTextAnswer.join('::;::');
        dataToReturn.correctWords = correctWords;
        dataToReturn.totalWords = correctSolution.length;
    } else if (questionDisplayType === 'SINGLE_CHOICE_QUESTION' || questionDisplayType === 'IMAGE_QUESTION') {
        if (userTextAnswer === correctSolution) {
            matchPercent = 100;
            correctTokens = [userTextAnswer];
        } else {
            incorrectTokens = [userTextAnswer];
        }
        const options = question.options.map((eachOption) => ({
            option: eachOption,
            isChosen: eachOption === userTextAnswer,
            isCorrect: eachOption === correctSolution,
        }));
        dataToReturn.options = options;
    }

    dataToReturn.inputReceived = inputReceived;
    dataToReturn.matchPercent = matchPercent;
    dataToReturn.userTextAnswer = userTextAnswer;
    if (question.question_type === 'blank_multi_word') {
        dataToReturn.userTextAnswer = userTextAnswer.join(' ');
    }
    if (questionDisplayType === 'AUDIO_QUESTION') {
        dataToReturn.try_again_button_text = 'TRY AGAIN';
    }
    dataToReturn.userTextDisplay = userTextDisplay;
    dataToReturn.userAudioUrl = data.audioResponse;
    dataToReturn.correctTextAnswer = correctTextAnswer;
    dataToReturn.correctTextDisplay = correctTextDisplay;
    dataToReturn.answerAudioUrl = question.answer_audio;
    dataToReturn.correctTokens = correctTokens.join('::;::');
    dataToReturn.incorrectTokens = incorrectTokens.join('::;::');

    return dataToReturn;
}

function getDateString(days = 0) {
    const now = moment().add(days, 'days').add(5, 'hours').add(30, 'minutes');
    const todayDate = now.startOf('day').format('YYYY-MM-DD');

    return todayDate;
}

async function getRemainingAttempts(db, studentId) {
    const todaysDate = getDateString();
    const tomorrowsDate = getDateString(1);
    const todaysSessions = await PracticeEnglishMySql.getSessionsByTimeRange(db.mysql.read, studentId, todaysDate, tomorrowsDate);

    const attemptedSessions = todaysSessions[0].attempted_sessions;

    let remainingSessions = 0;
    if (attemptedSessions < 100) {
        remainingSessions = 100 - attemptedSessions;
    }

    return remainingSessions;
}
module.exports = {
    dailyContestConstants,
    practiceEnglishConstants,
    setDisplayType,
    setQuestionMeta,
    filterValidQuestions,
    checkCSVHeaders,
    getRandomItemsByCount,
    filterContainment,
    filterTranslateQues,
    filterNonMcqQues,
    filterNonTranslateQues,
    generateSpeech,
    getTranscript,
    matchAnswer,
    getRemainingAttempts,
    getDateString,
};
