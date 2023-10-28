const moment = require('moment');
const uuid = require('uuid/v4');

const bl = require('./whatsapp.bl');
const utility = require('../../../modules/utility');
const Question = require('../../../modules/question');
const whatsappData = require('../../../data/whatsapp.data');
const staticData = require('../../../data/data');
const whatsappBl = require('./whatsapp.bl');
const whatsappRedis = require('../../../modules/redis/whatsapp');
const QuestionHelper = require('../../helpers/question.helper');

async function getQuestionId(db, sns, studentId) {
    const insertedQuestion = {
        student_id: studentId,
        class: 20,
        subject: 'MATHS',
        book: 'MATHS',
        chapter: 'DEFAULT',
        question: '',
        doubt: 'WHATSAPP_NT',
        locale: 'en',
    };
    const quesInfo = await Question.addQuestion(insertedQuestion, db.mysql.write);
    QuestionHelper.sendSnsMessage({
        type: 'question-init',
        sns,
        uuid: uuid(),
        qid: quesInfo.insertId,
        studentId,
        studentClass: insertedQuestion.class,
        subject: insertedQuestion.subject,
        chapter: insertedQuestion.chapter,
        version: insertedQuestion.question,
        ques: insertedQuestion.doubt,
        locale: insertedQuestion.locale,
        UtilityModule: utility,
        questionInitSnsUrl: staticData.questionInitSnsUrl,
    });
    return quesInfo.insertId;
}

async function addQuestion(staticParams, params) {
    let extension;
    let contentType;
    const image = await utility.getNetcoreMedia(staticParams.config, params.mediaId);
    if (!image) {
        throw new Error('Unable to fetch image from netcore');
    }
    const qid = await getQuestionId(staticParams.db, staticParams.sns, params.studentId);
    if (params.mimeType === 'image/jpeg' || params.mimeType === 'image/jpg') {
        extension = 'jpg';
        contentType = 'image/jpg';
    } else if (params.mimeType === 'image/png') {
        extension = 'png';
        contentType = 'image/png';
    }
    const fileName = `upload_${qid}_${moment().unix()}.${extension}`;
    await utility.uploadTos3(staticParams.s3, staticParams.config.aws_bucket, fileName, image, contentType);
    const path = `https://d10lpgp6xz60nq.cloudfront.net/images/${fileName}`;

    return {
        path,
        qid,
        fileName,
    };
}

async function addAndGetUser(staticParams, phone) {
    if (phone.length > 10) {
        phone = phone.substr(-10);
    }
    const getinfo = await bl.addPublicUserWhatsapp(staticParams.db, phone, 'WA_NT'); // TODO fetch fingerprints from db later
    return getinfo;
}

// #region logging
function logEvent(phone, studentId, event, reply, context, prevContext) {
    return utility.whatsappNetcoreLogs(phone.substr(-10), studentId, event, reply, context, prevContext);
}

function schedulePdf(phone, studentId, questionId, results) {
    return utility.schedulePdf('WHA_NT', phone, studentId, questionId, results);
}
// #endregion

function buildMsg(msg, params) {
    return typeof msg === 'function' ? msg(params) : msg;
}

/**
 * Send netcore msg and log optionally
 * @param {object} config Config
 * @param {string} phone Phone
 * @param {object} params Msg params
 * @param {{studentId: number, event, reply, context, prevContext}} logParams Logging params
 */
async function sendMsg(config, phone, params, logParams) {
    if (logParams) {
        logEvent(phone, logParams.studentId, logParams.event, logParams.reply || params.event, logParams.context, logParams.prevContext);
    }
    await utility.delayMs(params.delay);
    if (typeof params.msg === 'string' || typeof params.msg === 'function') {
        const msg = await buildMsg(params.msg, params);
        if (!msg) {
            return;
        }
        if (typeof msg === 'object') {
            utility.sendNetcoreMediaMessage(config, phone, msg.mediaId, msg.caption, params.event);
            return;
        }
        utility.sendNetcoreTextMessage(config, phone, msg, params.event, params.preview || false);
        return;
    }
    for (let i = 0; i < params.msg.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        await utility.delayMs(1000);
        // eslint-disable-next-line no-await-in-loop
        const msg = await buildMsg(params.msg[i], params);
        if (!msg) {
            return;
        }
        if (typeof msg === 'object') {
            utility.sendNetcoreMediaMessage(config, phone, msg.mediaId, msg.caption, params.event);
            return;
        }
        utility.sendNetcoreTextMessage(config, phone, msg, params.event, params.preview || false);
    }
}

// #region conversation wrapper
function stopConversation(staticParams, phone) {
    return whatsappRedis.setConversationContextNetcore(staticParams.db.redis.write, phone);
}

async function getConversationContext(staticParams, phone) {
    const context = await whatsappRedis.getConversationContextNetcore(staticParams.db.redis.read, phone);
    if (!context) {
        return;
    }
    if (context.expiry && moment(context.expiry) - moment() < 0) {
        // expired context -> reset
        await stopConversation(staticParams, phone);
        return;
    }
    return context;
}

async function updateConversationContext(staticParams, phone, context, params) {
    context = { ...context, ...params, updatedAt: moment().add('5:30').toDate() };
    return whatsappRedis.setConversationContextNetcore(staticParams.db.redis.write, phone, context);
}

async function startConversation(staticParams, phone, contextType, params = {}) {
    const context = {
        createdAt: moment().add('5:30').toDate(), contextType, active: true, ...params, contextId: uuid(),
    };
    await whatsappRedis.setConversationContextNetcore(staticParams.db.redis.write, phone, context);
    return getConversationContext(staticParams, phone);
}
// #endregion

// #region daily count wrapper
async function getDailyCount(staticParams, phone) {
    const countData = await whatsappRedis.getDailyCountNetcore(staticParams.db.redis.read, phone);
    if (!countData) {
        return {};
    }
    return countData;
}

async function setDailyCount(staticParams, phone, countData, key) {
    return whatsappRedis.incDailyCountNetcore(staticParams.db.redis.write, phone, countData, key);
}
// #endregion

async function handlePostSolnSend(staticParams, obj) {
    sendMsg(staticParams.config, obj.phone, whatsappData.solnFeedback);
    // sendMsg(staticParams.config, obj.phone, {
    //     ...whatsappData.solnNotView,
    //     ...staticParams,
    //     ...obj,
    //     condition: whatsappRedis.getLastVideoWatched,
    // });
}

async function debounceMessages(staticParams, obj) {
    if (!obj.debounce.length) {
        return;
    }
    for (let i = 0; i < obj.debounce.length; i++) {
        const debounce = obj.debounce[i];
        if (debounce.messageType === 'IMAGE') {
            addQuestion(staticParams, debounce);
        }
        logEvent(debounce.phone, debounce.studentId, {
            messageId: debounce.messageId,
            mediaId: debounce.mediaId,
            mimeType: debounce.mimeType,
        }, debounce.context);
    }
    if (obj.reply && obj.debounce[0].context && obj.debounce[0].mediaId) {
        sendMsg(staticParams.config, obj.debounce[0].phone, { ...whatsappData.multiMessage, mediaId: obj.debounce[0].mediaId });
    }
}

async function handleNetcoreImage(staticParams, obj) {
    const [questionInfo] = await Promise.all([
        addQuestion(staticParams, obj),
        sendMsg(staticParams.config, obj.phone, whatsappData.searchingForSoln, {
            studentId: obj.studentId,
            event: {
                messageId: obj.messageId,
                mediaId: obj.mediaId,
                mimeType: obj.mimeType,
            },
            context: obj.context,
        }),
    ]);
    const context = await startConversation(staticParams, obj.phone, whatsappData.ContextType.ASK, { questionId: questionInfo.qid });
    try {
        const askResp = await whatsappBl.askWhatsapp(staticParams, obj, questionInfo);
        if (!askResp.urlArray.length) {
            sendMsg(staticParams.config, obj.phone, whatsappData.askFailure, {
                studentId: obj.studentId,
                event: {
                    messageId: obj.messageId,
                    questionImage: questionInfo.path,
                },
                context,
                prevContext: obj.context,
            });
            setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.ASK);
            return askResp;
        }
        for (let i = 0; i < askResp.urlArray.length; i++) {
            const soln = askResp.urlArray[i];
            // eslint-disable-next-line no-await-in-loop
            await sendMsg(staticParams.config, obj.phone, { ...soln, ...whatsappData.solution });
        }
        schedulePdf(obj.phone, obj.studentId, questionInfo.qid, askResp.questionIds);
        logEvent(obj.phone, obj.studentId, {
            messageId: obj.messageId,
            questionImage: questionInfo.path,
        }, askResp.urlArray, context, obj.context);
        updateConversationContext(staticParams, obj.phone, context, { active: false });
        handlePostSolnSend(staticParams, { ...obj, context });
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.ASK);
        return askResp;
    } catch (err) {
        sendMsg(staticParams.config, obj.phone, whatsappData.askFailure, {
            studentId: obj.studentId,
            event: {
                messageId: obj.messageId,
                questionImage: questionInfo.path,
            },
            prevContext: context,
        });
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.ASK);
        throw err;
    }
}

function handleTextAfterAskContext(staticParams, obj, context) {
    if (Object.keys(whatsappData.solnFeedbackYesNo).includes(obj.textLower)) {
        const msgDataIndex = obj.dailyCountData[obj.textLower] || 0;
        const replies = whatsappData.solnFeedbackYesNo[obj.textLower];
        const reply = replies[msgDataIndex] || replies[replies.length - 1];
        sendMsg(staticParams.config, obj.phone, {
            ...reply,
            studentId: obj.studentId,
            questionId: context.questionId,
            event: `${reply.event}-${msgDataIndex}`,
        }, {
            messageId: obj.messageId,
            studentId: obj.studentId,
            event: { text: obj.text },
            context,
        });
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, obj.textLower);
        return;
    }
    if (!context.retryCount || context.retryCount < whatsappData.solnFeedback.retries.length) {
        const retryCount = context.retryCount || 0;
        updateConversationContext(staticParams, obj.phone, context, { retryCount: retryCount + 1 });
        sendMsg(staticParams.config, obj.phone, whatsappData.solnFeedback.retries[retryCount], {
            messageId: obj.messageId,
            studentId: obj.studentId,
            event: { text: obj.text },
            context: { ...context, retryCount: retryCount + 1 },
        });
        return true;
    }
    sendMsg(staticParams.config, obj.phone, whatsappData.unhandledMessageType, {
        messageId: obj.messageId,
        studentId: obj.studentId,
        event: { text: obj.text },
        context,
    });
}

async function handlePredefinedText(staticParams, obj, contextType) {
    const msgDataIndex = obj.dailyCountData[contextType] || 0;
    let reply;
    let params = {};

    switch (contextType) {
        case whatsappData.ContextType.SALUTATION:
            if (whatsappData.salutation[obj.textLower]) {
                reply = whatsappData.salutation[obj.textLower][msgDataIndex];
            }
            break;
        case whatsappData.ContextType.CAMPAIGN:
            if (whatsappData.salutation.hi) {
                reply = whatsappData.salutation.hi[msgDataIndex];
            }
            break;
        case whatsappData.ContextType.FACTS:
            reply = whatsappData.facts[msgDataIndex];
            params = {
                condition: utility.getFacts,
                studentId: obj.studentId,
                config: staticParams.config,
            };
            break;
        default:
            reply = null;
    }
    if (!reply) {
        logEvent(obj.phone, obj.studentId, null, null, obj.context);
        return;
    }
    sendMsg(staticParams.config, obj.phone, { ...reply, ...params }, {
        messageId: obj.messageId,
        studentId: obj.studentId,
        event: { text: obj.text },
        context: obj.context,
    });
}

async function handleRandomText(staticParams, obj) {
    const msgDataIndex = obj.dailyCountData[whatsappData.ContextType.RANDOM] || 0;
    const reply = whatsappData.randomMessageReply[msgDataIndex];
    if (!reply) {
        return;
    }
    sendMsg(staticParams.config, obj.phone, reply, {
        messageId: obj.messageId,
        studentId: obj.studentId,
        event: { text: obj.text },
        context: obj.context,
    });
}

async function handleAskText(staticParams, obj, context) {
    try {
        sendMsg(staticParams.config, obj.phone, whatsappData.searchingForSoln, {
            studentId: obj.studentId,
            event: {
                messageId: obj.messageId,
                mediaId: obj.mediaId,
                mimeType: obj.mimeType,
            },
            context: obj.context,
        });
        updateConversationContext(staticParams, obj.phone, context, { active: true });
        const askResp = await whatsappBl.askWhatsappText(staticParams, obj, context.text);
        if (!askResp.urlArray.length) {
            sendMsg(staticParams.config, obj.phone, whatsappData.askFailure, {
                studentId: obj.studentId,
                event: {
                    messageId: obj.messageId,
                    text: obj.text,
                },
                context,
            });
            setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.ASK_TEXT);
            return askResp;
        }
        for (let i = 0; i < askResp.urlArray.length; i++) {
            const soln = askResp.urlArray[i];
            // eslint-disable-next-line no-await-in-loop
            await sendMsg(staticParams.config, obj.phone, { ...soln, ...whatsappData.solution });
        }
        schedulePdf(obj.phone, obj.studentId, askResp.questionId, askResp.questionIds);
        logEvent(obj.phone, obj.studentId, {
            messageId: obj.messageId,
            text: obj.text,
        }, askResp.urlArray, context);
        updateConversationContext(staticParams, obj.phone, context, { active: false, questionId: askResp.questionId });
        handlePostSolnSend(staticParams, { ...obj, context });
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.ASK_TEXT);
        return askResp;
    } catch (err) {
        sendMsg(staticParams.config, obj.phone, whatsappData.askFailure, {
            studentId: obj.studentId,
            event: {
                messageId: obj.messageId,
                text: obj.text,
            },
        });
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.ASK_TEXT);
        throw err;
    }
}

function handleTextBeforeAskContext(staticParams, obj, context) {
    if (Object.keys(whatsappData.longTextFalse).includes(obj.textLower)) {
        const reply = whatsappData.longTextFalse[obj.textLower];
        sendMsg(staticParams.config, obj.phone, reply, {
            messageId: obj.messageId,
            studentId: obj.studentId,
            event: { text: obj.text },
            context,
        });
        // setDailyCount(staticParams, obj.phone, obj.dailyCountData, obj.textLower);
        return;
    }
    if (Object.keys(whatsappData.longTextTrue).includes(obj.textLower)) {
        handleAskText(staticParams, obj, context);
        return true;
    }
    if (!context.retryCount || context.retryCount < whatsappData.longText.retries.length) {
        const retryCount = context.retryCount || 0;
        updateConversationContext(staticParams, obj.phone, context, { retryCount: retryCount + 1 });
        sendMsg(staticParams.config, obj.phone, whatsappData.longText.retries[retryCount], {
            messageId: obj.messageId,
            studentId: obj.studentId,
            event: { text: obj.text },
            context: { ...context, retryCount: retryCount + 1 },
        });
        return true;
    }
    sendMsg(staticParams.config, obj.phone, whatsappData.unhandledMessageType, {
        messageId: obj.messageId,
        studentId: obj.studentId,
        event: { text: obj.text },
        context,
    });
}

async function handleTextWithoutContext(staticParams, obj) {
    const txtSplits = obj.textLower.split('\n');
    const txtToFind = txtSplits[txtSplits.length - 1].trim();
    if (staticData.salutations.includes(obj.textLower)) {
        const context = await startConversation(staticParams, obj.phone, whatsappData.ContextType.SALUTATION);
        handlePredefinedText(staticParams, { ...obj, context }, whatsappData.ContextType.SALUTATION);
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.SALUTATION);
        return;
    }
    if (staticData.messageForOptIn.includes(txtToFind)) {
        const context = await startConversation(staticParams, obj.phone, whatsappData.ContextType.CAMPAIGN);
        handlePredefinedText(staticParams, { ...obj, context }, whatsappData.ContextType.CAMPAIGN);
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.SALUTATION); // Purposely ContextType.SALUTATION
        return;
    }
    if (staticData.facts.includes(obj.textLower)) {
        const context = await startConversation(staticParams, obj.phone, whatsappData.ContextType.FACTS);
        handlePredefinedText(staticParams, { ...obj, context }, whatsappData.ContextType.FACTS);
        setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.FACTS);
        return;
    }
    if (obj.text.length > whatsappData.TEXT_QUESTION_MIN_LENGTH) {
        const context = await startConversation(staticParams, obj.phone, whatsappData.ContextType.ASK_TEXT, { active: false, text: obj.text });
        sendMsg(staticParams.config, obj.phone, whatsappData.longText, {
            messageId: obj.messageId,
            studentId: obj.studentId,
            event: { text: obj.text },
            context,
        });
        return true;
    }
    const context = await startConversation(staticParams, obj.phone, whatsappData.ContextType.RANDOM);
    handleRandomText(staticParams, { ...obj, context });
    setDailyCount(staticParams, obj.phone, obj.dailyCountData, whatsappData.ContextType.RANDOM);
}

// TODO refactor this function
async function handleNetcoreText(staticParams, obj) {
    if (!obj.context) {
        const status = await handleTextWithoutContext(staticParams, obj);
        if (!status) {
            stopConversation(staticParams, obj.phone);
        }
        return;
    }
    if (obj.context.contextType === whatsappData.ContextType.ASK) {
        const status = handleTextAfterAskContext(staticParams, obj, obj.context);
        if (!status) {
            stopConversation(staticParams, obj.phone);
        }
        return;
    }
    if (obj.context.contextType === whatsappData.ContextType.ASK_TEXT) {
        const status = obj.context.questionId ? handleTextAfterAskContext(staticParams, obj, obj.context) : handleTextBeforeAskContext(staticParams, obj, obj.context);
        if (!status) {
            stopConversation(staticParams, obj.phone);
        }
        return;
    }
    const status = await handleTextWithoutContext(staticParams, obj);
    if (!status) {
        stopConversation(staticParams, obj.phone);
    }
}

module.exports = {
    addQuestion,
    addAndGetUser,
    sendMsg,
    handlePostSolnSend,
    handleNetcoreImage,
    handleNetcoreText,
    getConversationContext,
    startConversation,
    getDailyCount,
    setDailyCount,
    debounceMessages,
};
