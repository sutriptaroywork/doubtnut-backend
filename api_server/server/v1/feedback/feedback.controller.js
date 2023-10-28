const _ = require('lodash');
const moment = require('moment');
const Feedback = require('../../../modules/mysql/feedback');
const StudentContainer = require('../../../modules/containers/student');
const bl = require('./feedback.bl');
const GoogleAppRatingUserMysql = require('../../../modules/mysql/googleAppRatingUsers');
const Data = require('../../../data/data');
const DataUS = require('../../../data/data.us');
const Properties = require('../../../modules/mysql/property');
const Package = require('../../../modules/mysql/package');
const PaypalSubscription = require('../../../modules/mysql/paypal');
const QuestionContainer = require('../../../modules/mysql/question');
const QuestionRedis = require('../../../modules/redis/question');
const studentRedis = require('../../../modules/redis/student');
const { getFeedbackSelectionsId } = require('../../../modules/mysql/feedback');

let db;
let config;

async function submitFeedback(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id } = req.user;
        const { resource_id } = req.body;
        const { resource_type } = req.body;
        const { feed } = req.body;
        const data = await Feedback.submitFeedbackonHomepage(db.mysql.write, student_id, resource_type, resource_id, feed);
        if (data.insertId > 0) {
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const responseData = {
            meta: {
                code: 403,
                message: 'Not success',
            },
            data: null,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function studentRating(req, res) {
    try {
        db = req.app.get('db');
        const { student_id } = req.user;
        const { rating, is_google_in_app_review } = req.body;
        const feedback = (req.body.feedback == undefined ? '' : req.body.feedback);

        const feedData = (feedback !== '' ? feedback.join('#!') : '');

        let data = {};

        if (typeof is_google_in_app_review !== 'undefined' && is_google_in_app_review == 1) {
            data = await GoogleAppRatingUserMysql.addGoogleRatingByUser(db.mysql.write, student_id, 1);
        } else {
            data = await Feedback.submitStudentRating(db.mysql.write, student_id, rating, feedData);
        }

        if (data.insertId != undefined && data.insertId > 0) {
            await StudentContainer.setRatingDone(student_id, db.redis.write);
            const responseData = {
                meta: {
                    code: 200,
                    message: 'success',
                },
                data: 'success',
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        const responseData = {
            meta: {
                code: 403,
                message: 'Not success',
            },
            data: 'error',
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        const responseData = {
            meta: {
                code: 403,
                message: 'Not success',
            },
            data: 'error',
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function studentRatingCross(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id } = req.user;

        await StudentContainer.setCrossPress(student_id, db.redis.write);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: 'success',
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getUserLastQuestionLocale(client, studentId) {
    try {
        const questionId = await QuestionRedis.getUserLastAskedQId(client, studentId);
        if (_.isNull(questionId)) {
            throw new Error('last qid of student id not present');
        }
        const questionIdDetails = await QuestionRedis.getUserAskedQuestionData(client, questionId, 'ocr');
        if (_.isNull(questionIdDetails)) {
            throw new Error('no details in redis');
        }
        const parsedQuestionDetails = JSON.parse(questionIdDetails);
        if (_.isEmpty(parsedQuestionDetails.locale)) {
            throw new Error('locale not stored in question details');
        }
        return parsedQuestionDetails.locale;
    } catch (e) {
        console.log(e);
        return null;
    }
}

async function getMatchFailureFeedbackOptions(_req, _res, next) {
    try {
        db = _req.app.get('db');
        const { locale: appLocale } = _req.user;
        const locale = await getUserLastQuestionLocale(db.redis.read, _req.user.student_id);
        const localeToFetchFeedbackOptions = !_.isNull(locale) ? locale : appLocale;
        const region = _req.headers.country || 'IN';
        return next({ data: bl.getNoSolutionFeedbackOption(region, localeToFetchFeedbackOptions) });
    } catch (err) {
        next({ err });
    }
}

async function putMatchFailureFeedback(req, _res, next) {
    try {
        const data = {
            questionId: req.body.question_id,
            feedback: req.body.feedback,
            answersDisplayed: req.body.answers_displayed,
            event: req.body.source,
            isPositive: req.body.is_positive,
        };
        // async
        bl.insertMatchFailureFeedback(req.user.student_id, data, 'ask');
        next({});
    } catch (err) {
        next({ err });
    }
}

function getVideoDislikeFeedbackOptions(req, _res, next) {
    try {
        let data;
        const valid_sources = ['text', 'video'];
        const country = req.headers.country || 'IN';
        if (valid_sources.includes(req.query.source)) {
            data = Data.answerFeedback[country.toLowerCase()][req.query.source];
        } else {
            throw new Error('Bad source');
        }
        next({ data });
    } catch (err) {
        next({ err });
    }
}

async function formatOptions(option, finalData, studentId, type) {
    try {
        let key = option.name;
        const data = option.value.split('#!!#');
        const page = data[0];
        let value = data[1];
        if (!finalData[page]) {
            finalData[page] = {};
        }
        let options;
        switch (key) {
            case 'options_image':
                options = value.split('#!#');
                value = [];
                key = 'options';
                for (let j = 0; j < options.length; j += 2) {
                    value.push({
                        image: options[j],
                        text: options[j + 1],
                    });
                }
                break;
            case 'options':
                value = value.split('#!#');
                break;
            case 'subtitle':
                if (type === 'cancelMembership' && value.includes('{{data}}')) {
                    const activePackageData = await Package.getStudentActivePackageDoubtLimit(db.mysql.read, studentId, moment().format('YYYY-MM-DD'));
                    console.log('activePackageData', activePackageData);
                    const endDate = new Date(activePackageData[0].end_date);
                    console.log('endDate', endDate);
                    value = value.replace('{{data}}', endDate.toDateString());
                }
                break;
            default:
                break;
        }
        finalData[page][key] = value;
        return finalData;
    } catch (e) {
        console.log('ERROR IN FORMAT OPTIONS', e);
    }
}

async function getUSFeedbackScreen(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');

    const studentId = req.user.student_id;
    let { country } = req.headers;
    if (!country) {
        country = 'IN';
    }

    let responseData;
    try {
        const type = req.query.type || 'cancelMembership';
        if (Object.keys(DataUS.feedbackMap).includes(type)) {
            const options = await Properties.getNameAndValueByBucket(db.mysql.read, DataUS.feedbackMap[type]);
            let finalData = {};
            for (let j = 0; j < options.length; j++) {
                // eslint-disable-next-line no-await-in-loop
                finalData = await formatOptions(options[j], finalData, studentId, type);
            }

            const paypalSubscriptions = await PaypalSubscription.getAllSubscriptionByStudentId(db.mysql.read, studentId);

            console.log(paypalSubscriptions);
            console.log(finalData);

            if (paypalSubscriptions.length == 1) {
                finalData.page2.prompt = 'extend';
            } else {
                finalData.page2.prompt = 'cancel';
            }
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: finalData,
            };
        } else {
            responseData = {
                meta: {
                    code: 218,
                    success: false,
                    message: 'Incorrect Type Paramater',
                },
                data: { message: `Type Must Be in ${Object.keys(DataUS.feedbackMap).join(', ')}` },
            };
        }

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log('something went wrong', e);
        next(e);
    }
}

function isUserFeedbackShowEligible(studentId, isTriggerValuePresent, isCancelCountPresent) {
    try {
        let showPopup = false;
        isTriggerValuePresent = parseInt(isTriggerValuePresent);
        isCancelCountPresent = parseInt(isCancelCountPresent);

        if (!isTriggerValuePresent && isTriggerValuePresent !== 0 && !isCancelCountPresent) {
            isTriggerValuePresent = Data.userFeedbackPopupData.retry_counter;
            studentRedis.setUserFeedbackTriggerParams(db.redis.write, studentId, 'USER_FEEDBACK_TRIGGER_VALUE', isTriggerValuePresent);
            showPopup = true;
        } else if (!_.isNull(isTriggerValuePresent) && !isCancelCountPresent) {
            if (isTriggerValuePresent === 0) {
                isTriggerValuePresent = Data.userFeedbackPopupData.retry_counter;
                showPopup = true;
            } else {
                isTriggerValuePresent += 1;
            }
            studentRedis.setUserFeedbackTriggerParams(db.redis.write, studentId, 'USER_FEEDBACK_TRIGGER_VALUE', isTriggerValuePresent);
        } else if (!_.isNull(isTriggerValuePresent) && isCancelCountPresent) {
            if (isTriggerValuePresent === 0) {
                isTriggerValuePresent = Data.userFeedbackPopupData.cancel_retry_counter;
                showPopup = true;
            } else {
                isTriggerValuePresent += 1;
            }
            studentRedis.setUserFeedbackTriggerParams(db.redis.write, studentId, 'USER_FEEDBACK_TRIGGER_VALUE', isTriggerValuePresent);
        }
        return showPopup;
    } catch (e) {
        console.error(e);
        return false;
    }
}

async function getPopupData(req, res) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const userLocale = (req.user.locale === 'hi') ? 'hi' : 'en';
        const {
            feedback,
            page,
        } = req.body;
        const category = Data.userFeedbackPopupData.feedback.positive.includes(feedback) ? 'positive' : 'negative';
        const responseDataToSend = {
            title: (userLocale === 'hi') ? 'अपने उत्तर क्यों नहीं देखा ?' : 'Aapne solution kyun nahi dekha ?',
            description: '',
            img_url: '',
            text_color: '',
            bg_color: '',
            options: [],
            UI_type: 'ROW',
            button_text: userLocale === 'hi' ? Data.userFeedbackPopupData.submit_button_text.hi : Data.userFeedbackPopupData.submit_button_text.en,
        };
        const studentTriggerValue = await studentRedis.getUserFeedbackTriggerParams(db.redis.read, studentId, 'USER_FEEDBACK_TRIGGER_VALUE');
        const studentCancelCount = await studentRedis.getUserFeedbackTriggerParams(db.redis.read, studentId, 'USER_FEEDBACK_CANCEL_COUNT');
        if (isUserFeedbackShowEligible(studentId, studentTriggerValue, studentCancelCount)) {
            responseDataToSend.options = await Feedback.getUserFeedbackPopupData(db.mysql.read, category, userLocale, page);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: responseDataToSend,
        };

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Fail',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function submitPopupSelections(req, res) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const studentId = req.user.student_id;
        const userLocale = req.user.locale;
        const {
            feedbackOptionsSelected,
            page,
        } = req.body;
        const isCancelClicked = req.body.is_cancel_clicked;
        const entityId = req.body.entity_id;
        const feedbackCaptureMoreDataEnabledIds = Data.userFeedbackPopupData.prefrencesToBeCapturedAgainstFeedback;
        let shouldCaptureMorePrefrences = false;
        let selections = [];
        let captureMorePrefrenceSelectionId;
        const redisCounterPromises = [];
        redisCounterPromises.push(studentRedis.getUserFeedbackTriggerParams(db.redis.read, studentId, 'USER_FEEDBACK_TRIGGER_VALUE'));
        redisCounterPromises.push(studentRedis.getUserFeedbackTriggerParams(db.redis.read, studentId, 'USER_FEEDBACK_CANCEL_COUNT'));
        const [studentTriggerValue, studentCancelCount] = await Promise.all(redisCounterPromises);
        let isTriggerValuePresent = !_.isNull(studentTriggerValue) ? parseInt(studentTriggerValue) : null;
        let isCancelCountPresent = !_.isNull(studentCancelCount) ? parseInt(studentCancelCount) : null;
        const responseDataToSend = {
            title: '',
            description: '',
            img_url: '',
            text_color: '',
            bg_color: '',
            options: [],
            UI_type: 'GRID',
            button_text: userLocale === 'hi' ? Data.userFeedbackPopupData.submit_button_text.hi : Data.userFeedbackPopupData.submit_button_text.en,
        };
        if (isCancelClicked) {
            if (isCancelCountPresent) {
                studentRedis.deleteUserFeedbackTriggerKey(db.redis.write, studentId, 'USER_FEEDBACK_TRIGGER_VALUE');
            } else {
                isTriggerValuePresent = Data.userFeedbackPopupData.cancel_retry_counter;
                isCancelCountPresent = 1;
                studentRedis.setUserFeedbackTriggerParams(db.redis.write, studentId, 'USER_FEEDBACK_CANCEL_COUNT', isCancelCountPresent);
                studentRedis.setUserFeedbackTriggerParams(db.redis.write, studentId, 'USER_FEEDBACK_TRIGGER_VALUE', isTriggerValuePresent);
            }
        } else {
            let promises = [];
            for (let i = 0; i < feedbackOptionsSelected.length; i++) {
                promises.push(Feedback.getSelectionsId(db.mysql.read, feedbackOptionsSelected[i]));
            }
            selections = await Promise.all(promises);
            promises = [];
            for (let i = 0; i < selections.length; i++) {
                promises.push(Feedback.updateFeedbackSelections(db.mysql.write, selections[i][0].id, page, studentId, entityId));
                if (!shouldCaptureMorePrefrences) {
                    if (feedbackCaptureMoreDataEnabledIds.includes(selections[i][0].id)) {
                        shouldCaptureMorePrefrences = true;
                        captureMorePrefrenceSelectionId = selections[i][0].id;
                    }
                }
            }
            Promise.all(promises);
            if (shouldCaptureMorePrefrences) {
                const prefrences = await Feedback.getPrefrencesData(db.mysql.read, captureMorePrefrenceSelectionId, userLocale, page);
                responseDataToSend.title = prefrences[0].title;
                responseDataToSend.description = prefrences[0].description;
                responseDataToSend.showPopUp = true;
                for (let i = 0; i < prefrences.length; i++) {
                    responseDataToSend.options.push({
                        id: null,
                        type: prefrences[i].name,
                        display: prefrences[i].display,
                    });
                }
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: shouldCaptureMorePrefrences ? responseDataToSend : { showPopUp: false, options: [] },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Fail',
            },
            data: null,
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

async function submitFeedbackPrefrences(req, res) {
    try {
        db = req.app.get('db');
        const studentId = req.user.student_id;
        const {
            feedbackType,
            prefrencesFromUser,
            page,
        } = req.body;
        const entityId = req.body.entity_id;
        let promises = [];
        const feedbackId = await Feedback.getSelectionsId(db.mysql.read, feedbackType);
        for (let i = 0; i < prefrencesFromUser.length; i++) {
            promises.push(Feedback.getUserSelectedPrefrenceId(db.mysql.read, prefrencesFromUser[i]));
        }
        const userSelectedPreferenceId = await Promise.all(promises);
        const parent_id = await Feedback.getFeedbackSelectionsId(db.mysql.read, studentId, entityId, page, feedbackId[0].id);
        console.log(parent_id);
        promises = [];
        for (let i = 0; i < prefrencesFromUser.length; i++) {
            promises.push(Feedback.submitUserFeedbackPrefrences(db.mysql.write, studentId, parent_id[0].id, userSelectedPreferenceId[i][0].id));
        }
        Promise.all(promises);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                msg: 'Thanks for giving feedback',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Fail',
            },
            data: {
                msg: 'oops we couldnot process',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    }
}

// { id: 798,
//   chapter_order: 1,
//   sub_topic_order: 1,
//   micro_concept_order: 3,
//   final_order: 798,
//   mc_id: 'CV_1985',
//   class: 12,
//   course: 'NCERT',
//   chapter: 'RELATIONS',
//   subtopic: 'RELATION',
//   mc_text: 'Cartesian Product of Sets',
//   active_status: 1 }

module.exports = {
    submitFeedback,
    studentRating,
    studentRatingCross,
    getMatchFailureFeedbackOptions,
    putMatchFailureFeedback,
    getVideoDislikeFeedbackOptions,
    getUSFeedbackScreen,
    getPopupData,
    submitPopupSelections,
    submitFeedbackPrefrences,
};
