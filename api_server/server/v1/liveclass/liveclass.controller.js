// eslint-disable-next-line import/no-extraneous-dependencies
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */

const _ = require('lodash');
const moment = require('moment');

const md5 = require('md5');

const Liveclass = require('../../../modules/mysql/liveclass');
const CourseContainer = require('../../../modules/containers/course');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const CourseMysql = require('../../../modules/mysql/course');
const LiveclassHelper = require('../../helpers/liveclass');
const SearchHelper = require('../../helpers/search');
const Utility = require('../../../modules/utility');
const Flagr = require('../../../modules/containers/Utility.flagr');
const AnswerRedis = require('../../../modules/redis/answer');
const Data = require('../../../data/liveclass.data');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const CourseHelper = require('../../v4/course/course.helper');
const CourseRedis = require('../../../modules/redis/course');
const StudentContainer = require('../../../modules/containers/student');
const ContestMysql = require('../../../modules/contest');
const CourseJsHelper = require('../../helpers/course');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const Token = require('../../../modules/token');
const QuestionContainer = require('../../../modules/containers/question');

let db;
const numberMap = {
    opt_1: '1',
    opt_2: '2',
    opt_3: '3',
    opt_4: '4',
};
const defaultExpiry = 30;
const stringMap = {
    opt_1: 'A',
    opt_2: 'B',
    opt_3: 'C',
    opt_4: 'D',
};
function modifyObj(result) {
    for (let i = 0; i < result.length; i++) {
        if (result[i].answer.trim().includes('::')) {
            result[i].type = 1;
        }
        if (/\d/g.test(result[i].answer.trim())) {
            // contain numberic
            result[i].opt_1 = { key: numberMap.opt_1, value: LiveclassHelper.handleOptions(result[i].opt_1) };
            result[i].opt_2 = { key: numberMap.opt_2, value: LiveclassHelper.handleOptions(result[i].opt_2) };
            result[i].opt_3 = { key: numberMap.opt_3, value: LiveclassHelper.handleOptions(result[i].opt_3) };
            result[i].opt_4 = { key: numberMap.opt_4, value: LiveclassHelper.handleOptions(result[i].opt_4) };
        } else {
            result[i].opt_1 = { key: stringMap.opt_1, value: LiveclassHelper.handleOptions(result[i].opt_1) };
            result[i].opt_2 = { key: stringMap.opt_2, value: LiveclassHelper.handleOptions(result[i].opt_2) };
            result[i].opt_3 = { key: stringMap.opt_3, value: LiveclassHelper.handleOptions(result[i].opt_3) };
            result[i].opt_4 = { key: stringMap.opt_4, value: LiveclassHelper.handleOptions(result[i].opt_4) };
        }
    }
    return result;
}

async function getPushUrl(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const facultyID = req.query.faculty_id;
        // const liveclassID = req.query.liveclass_id;
        const result = await Liveclass.getPushUrlByFaculty(db.mysql.read, facultyID);
        let url = result[0].push_url;
        const detailID = result[0].detail_id;
        const liveclassID = result[0].resource_reference;
        if (_.isNull(url)) {
            url = Utility.getStreamUrl(config.liveclass.pushDomainName, config.liveclass.appName, liveclassID, config.liveclass.authKey);
            // update in mysql
            await Liveclass.updateLiveClassInfoPushUrl(db.mysql.read, facultyID, url);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { url, detail_id: detailID, resource_id: liveclassID },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function pushQuizQuestion(req, res, next) {
    try {
        db = req.app.get('db');
        const admin = req.app.get('admin');
        const firebaseDb = admin.database();
        const ref = firebaseDb.ref('live_class_test');
        const resourceID = req.query.resource_id;
        // const quizQuestionID = req.query.quiz_question_id;
        const { resource_detail_id: resourceDetailID } = req.query;

        const resourceDetails = await Liveclass.getResourceDetailsByID(db.mysql.read, resourceDetailID);
        let detailID = '';
        const dataArr = [];
        const masterObj = {};
        masterObj[resourceID] = {};
        masterObj[resourceID].resource_detail_id = parseInt(resourceDetailID);
        masterObj[resourceID].list = [];
        if (resourceDetails.length > 0) {
            // split by ,
            detailID = resourceDetails[0].liveclass_course_detail_id;
            masterObj[resourceID].detail_id = detailID;
            masterObj[resourceID].ended = false;
            const quizQuestionIDArr = resourceDetails[0].resource_reference.split('|');
            const expiryTimeArr = resourceDetails[0].meta_info.split('|');
            for (let i = 0; i < quizQuestionIDArr.length; i++) {
                let result = await Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionIDArr[i]);

                result = modifyObj(result);
                const obj = {};
                obj.question = LiveclassHelper.quotesEscape(result[0].ocr_text);
                obj.quiz_question_id = quizQuestionIDArr[i];
                obj.expiry = (expiryTimeArr[i] === undefined) ? defaultExpiry : expiryTimeArr[i];
                obj.response_expiry = '10';
                obj.type = result[0].type;
                obj.options = [];
                obj.options.push(result[0].opt_1);
                obj.options.push(result[0].opt_2);
                obj.options.push(result[0].opt_3);
                obj.options.push(result[0].opt_4);
                console.log(obj);
                dataArr.push(obj);
                masterObj[resourceID].list = dataArr;
            }
            ref.update(masterObj, async (error) => {
                let responseData = {
                    meta: {
                        code: 403,
                        success: false,
                        message: 'Error',
                    },
                };
                if (error) {
                    responseData = {
                        meta: {
                            code: 403,
                            success: false,
                            message: JSON.stringify(error),
                        },
                    };
                } else {
                    // insert log
                    const log = {
                        detail_id: detailID,
                        resource_id: resourceID,
                        resource_detail_id: resourceDetailID,
                    };
                    const logg = await Liveclass.addQuizLog(db.mysql.write, log);
                    let message = 'Not pushed';
                    if (logg.affectedRows === 1) {
                        message = 'Pushed';
                    }
                    responseData = {
                        meta: {
                            code: 200,
                            success: true,
                            message,
                        },
                    };
                }
                return res.status(responseData.meta.code).json(responseData);
            });
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function quizSubmit(req, res, next) {
    try {
        db = req.app.get('db');
        const liveClassID = req.body.liveclass_id;
        const quizQuestionID = req.body.quiz_question_id;
        const detailID = req.body.detail_id;
        const resourceDetailID = req.body.resource_detail_id;
        const selectedOptions = req.body.selected_options;
        const studentID = req.user.student_id;
        const data = {};
        let isCorrect = 0;
        let [
            result,
            streamDetails, // eslint-disable-line
            quizDetails, // eslint-disable-line
        ] = await Promise.all([
            Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionID),
            Liveclass.getStreamDetails(db.mysql.read, detailID),
            Liveclass.getResourceDetailsByID(db.mysql.read, resourceDetailID),
        ]);
        console.log('quizDetails');
        console.log(quizDetails);
        // check if user has submitted answer or not
        let answerSelected = false;
        if (selectedOptions.length) {
            answerSelected = true;
        }
        const quizQuestionList = quizDetails[0].resource_reference.split('|');
        const courseID = quizDetails[0].liveclass_course_id;
        let lastQuizQuestion = false;
        if (quizQuestionList[quizQuestionList.length - 1] === quizQuestionID) {
            lastQuizQuestion = true;
        }
        const isLive = (streamDetails[0].is_active == 1);
        result = modifyObj(result);
        let points = 0;
        const isFastest = false;
        if (result == 1) {
            // multiple
            const splitted = selectedOptions.split('::');
            for (let i = 0; i < splitted.length; i++) {
                if (!result[0].answer.trim().includes(splitted[i])) {
                    break;
                }
                isCorrect = 1;
            }
        } else if (selectedOptions == result[0].answer.trim()) {
            isCorrect = 1;
        }
        // if (isCorrect && isLive) {
        //     isFastest = await LiveclassHelper.checkFastest(db, quizQuestionID, detailID);
        // }
        points = LiveclassHelper.getLiveQuizPoints(isCorrect, isFastest);
        data.resource_reference = liveClassID;
        data.quiz_question_id = quizQuestionID;
        data.resource_detail_id = resourceDetailID;
        data.detail_id = detailID;
        data.option_id = selectedOptions;
        data.student_id = studentID;
        data.is_correct = isCorrect;
        data.points = points;
        data.is_live = streamDetails[0].is_active;
        if (answerSelected) {
            const submitResult = await Liveclass.addQuizResponse(db.mysql.write, data);
            if (submitResult.affectedRows && points > 0 && isLive) { // inserted
                const currentDate = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD');
                // get score classwise
                // const userPointsLogs = await Liveclass.getUserScoreClasswise(db.mysql.read, studentID);
                // const overallPoints = LiveclassHelper.getPoints(userPointsLogs, points, questionClass);
                await CourseRedis.setDailyLeaderboardByDateAndCourse(db.redis.write, currentDate, points, courseID, studentID);
                await CourseContainerV2.setRecentCorrectAnswer(db, courseID, studentID, currentDate);
                if (lastQuizQuestion) {
                    // get collective points of complete quiz
                    const totalQuizPoints = await Liveclass.getUserPointsByResourceID(db.mysql.read, resourceDetailID, studentID);
                    if (totalQuizPoints.length > 0 && totalQuizPoints[0].total_points > 0) {
                        setTimeout(() => LiveclassHelper.sendGamificationTrigger(totalQuizPoints[0].total_points, studentID, req.user.gcm_reg_id), 7000);
                    }
                }
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { is_correct: isCorrect, answer: result[0].answer.trim() },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function getQuizQuestions(req, res, next) {
    try {
        db = req.app.get('db');
        const detailID = req.query.detail_id;
        const result = await Liveclass.getQuizResourceByDetailID(db.mysql.read, detailID);
        const arr = [];
        for (let i = 0; i < result.length; i++) {
            const masterObj = {};
            const dataArr = [];
            const { topic } = result[i];
            masterObj.resource_detail_id = result[i].id;
            masterObj.detail_id = parseInt(detailID);
            const quizQuestionIDArr = result[i].resource_reference.split('|');
            const expiryTimeArr = result[i].meta_info.split('|');
            for (let j = 0; j < quizQuestionIDArr.length; j++) {
                let quizDetail = await Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionIDArr[j]);
                quizDetail = modifyObj(quizDetail);
                const obj = {};
                obj.question = LiveclassHelper.quotesEscape(quizDetail[0].ocr_text);
                obj.question_id = quizDetail[0].question_id;
                obj.quiz_question_id = quizQuestionIDArr[j];
                obj.topic = topic;
                obj.expiry = (expiryTimeArr[j] === undefined) ? defaultExpiry : expiryTimeArr[j];
                obj.type = result[0].type;
                obj.options = [];
                obj.options.push(quizDetail[0].opt_1);
                obj.options.push(quizDetail[0].opt_2);
                obj.options.push(quizDetail[0].opt_3);
                obj.options.push(quizDetail[0].opt_4);
                obj.answer = quizDetail[0].answer.trim();
                dataArr.push(obj);
                masterObj.quiz_list = dataArr;
            }
            arr.push(masterObj);
        }
        // result = modifyObj(result);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: arr,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function end(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const sqs = req.app.get('sqs');
        const admin = req.app.get('admin');
        const firebaseDb = admin.database();
        const fireBaseInstance = firebaseDb.ref('live_class_test');
        const detailID = req.query.detail_id;
        const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');

        // promise.push(Liveclass.updateLiveClassInfoEndTime(db.mysql.write, detailID));

        // get resource from detail id
        // promise.push(Liveclass.getResourceDetails(db.mysql.read, detailID));
        const resolvedPromise = await Liveclass.getResourceDetails(db.mysql.read, detailID);
        let responseData = {};
        let resourceID = '';
        let courseID = false;
        let createRow = true;
        let subject = '';
        let topic = '';
        let resourceClass = '';
        let expertName = '';
        let expertImage = '';
        for (let i = 0; i < resolvedPromise.length; i++) {
            courseID = resolvedPromise[0].liveclass_course_id;
            subject = resolvedPromise[0].subject;
            resourceClass = resolvedPromise[0].class;
            if (resolvedPromise[i].resource_type == 8) createRow = false;
            if (resolvedPromise[i].resource_type == 4) {
                resourceID = resolvedPromise[i].resource_reference;
                topic = resolvedPromise[i].topic;
                expertName = resolvedPromise[i].expert_name;
                expertImage = resolvedPromise[i].expert_image;
            }
        }
        if (resourceID.length === 0) {
            return next({
                message: 'Invalid resource', status: 500, isPublic: true, error: true,
            });
        }
        // get vod url
        LiveclassHelper.getVodUrl(resourceID, config, async (vodUrl) => {
            // only runs when you get response from tencent
            // console.log("vodUrl");
            // console.log(vodUrl);
            // console.log(courseID)
            // console.log(createRow)
            if (vodUrl.m3u8.length > 0 && vodUrl.mp4.length > 0 && createRow) {
                // console.log('create')
                const data = {};
                data.liveclass_course_id = courseID;
                data.liveclass_course_detail_id = detailID;
                data.resource_reference = resourceID;
                data.topic = topic;
                data.expert_name = expertName;
                data.expert_image = expertImage;
                data.resource_type = 8;
                data.subject = subject;
                data.class = resourceClass;
                data.player_type = 'liveclass';
                const liveResource = await Liveclass.getLiveResourceDetails(db.mysql.read, detailID);
                await Promise.all([Liveclass.addResource(db.mysql.write, data),
                    Liveclass.updateVodUrl(db.mysql.write, resourceID, vodUrl.m3u8),
                    AnswerRedis.deleteByQuestionIdWithTextSolution(resourceID, db.redis.write),
                    Liveclass.updateLiveClassInfoEndTime(db.mysql.write, detailID),
                    Liveclass.updateQuestionAnswered(db.mysql.write, liveResource[0].resource_reference),
                ]);
                LiveclassHelper.updateFirebase(resourceID, fireBaseInstance);
                SearchHelper.updateIasSearchIndex(data, inAppSearchElasticInstance);
                sqs.sendMessage({
                    QueueUrl: Data.fermiTencent,
                    MessageBody: JSON.stringify({
                        url: vodUrl.mp4,
                        questionId: resourceID,
                    }),
                }).promise().then((err, result) => {
                    console.log(err, result);
                });
                responseData = {
                    meta: {
                        code: 200,
                        success: true,
                        message: 'Success',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            responseData = {
                meta: {
                    code: 403,
                    success: false,
                    message: 'Please try again.',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        });
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function startByFaculty(req, res, next) {
    try {
        db = req.app.get('db');
        const detailID = req.query.detail_id;
        await Liveclass.updateLiveClassInfoStartTime(db.mysql.write, detailID);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getList(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const facultyID = req.query.faculty_id;
        const studentID = -22;
        const data = await Liveclass.getList(db.mysql.read, facultyID);
        // for which push url is null
        const promises = [];
        for (let i = 0; i < data.length; i++) {
            console.log(data[i]);
            if (data[i].resource_reference === 'TEST') {
                // create resource
                const question = {};
                question.student_id = studentID;
                question.class = data[i].class;
                question.subject = data[i].subject;
                question.question = `${data[i].resource_reference} stream`;
                question.ocr_text = `${data[i].resource_reference} stream`;
                const result = await Question.addQuestion(question, db.mysql.write);
                // console.log(result);
                const questionID = result.insertId;
                // console.log(questionID);
                const answer = {};
                answer.question_id = questionID;
                answer.is_vdo_ready = 1;
                await Answer.addSearchedAnswer(answer, db.mysql.write);
                await Liveclass.updateResource(db.mysql.write, data[i].id, questionID);
                data[i].resource_reference = questionID;
            }
            const now = moment().add(5, 'hours').add(30, 'minutes');
            // const now = moment();
            const live_at = moment(data[i].live_at);
            const remainingMinutes = live_at.diff(now, 'minutes');
            if ((_.isNull(data[i].push_url) || data[i].push_url.length === 0) && remainingMinutes < 30) {
                const url = Utility.getStreamUrl(config.liveclass.pushDomainName, config.liveclass.appName, data[i].resource_reference, config.liveclass.authKey);
                // update in mysql
                promises.push(Liveclass.updateLiveClassInfoPushUrl(db.mysql.write, facultyID, url, data[i].liveclass_course_detail_id));
                data[i].push_url = url;
            }
        }
        await Promise.all(promises);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function home(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const studentClass = req.user.student_class;
        const studentID = req.user.student_id;
        // const studentClass = 12;
        let courseID = req.query.course_id;
        const versionCode = req.headers.version_code;
        // const versionCode = 701;
        let widgetData = [];
        const promises = [];
        promises.push(CourseMysql.getUserSubscription(db.mysql.read, studentID));
        promises.push(Liveclass.getBoardList(db.mysql.read, studentClass));
        const resolvedPromise = await Promise.all(promises);
        const studentPackageList = resolvedPromise[0];
        const courseFilterList = resolvedPromise[1];
        if (typeof courseID === 'undefined' || _.isEmpty(courseID)) {
            courseID = courseFilterList[0].id;
        }
        const courseDetails = await Liveclass.getCourseDetails(db.mysql.read, courseID);
        const categoryID = courseDetails[0].category_id;
        const courseType = courseDetails[0].course_type;
        const paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType,
            categoryID,
        });

        let resp = {};
        let filterWidgetData = LiveclassHelper.generateCourseListFilter({ data: courseFilterList, caraousel: 'course_list_filter' });
        filterWidgetData = [filterWidgetData];
        let entities = ['static_filters', 'freeclass_grid', 'video_caraousel', 'banner', 'vertical_course_list'];
        if (versionCode > 745) {
            entities = ['static_filters', 'freeclass_grid', 'home_banner', 'video_caraousel', 'banner', 'vertical_course_list'];
        }
        const homeData = await LiveclassHelper.getHomeData({
            db,
            entities,
            versionCode,
            courseID,
            paymentCardState,
            config,
            categoryID,
            courseType,
            studentID,
            studentClass,
        });
        widgetData = [...filterWidgetData, ...homeData];
        resp = { widgets: widgetData };
        if (courseDetails[0].is_free === 0) {
            resp.bottom_button = {
                text: paymentCardState.isVip ? 'Check your plan' : 'BUY NOW',
                action: {
                    action_data: {
                        id: `${courseID}`,
                    },
                },
            };
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: resp,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function courseDetail(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        let { id } = req.query;
        let { master_chapter: masterChapter } = req.query;
        const studentID = req.user.student_id;
        let result; let courseID;
        if (masterChapter !== undefined) {
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(parseInt(masterChapter))) {
                id = parseInt(masterChapter);
            }
        }

        // get details
        if (id !== undefined) {
            result = await Liveclass.getDetailsByID(db.mysql.read, id);
            masterChapter = LiveclassHelper.quotesEscape(result[0].master_chapter);
            courseID = result[0].liveclass_course_id;
            result = await Liveclass.getResourcesWithCourseID(db.mysql.read, masterChapter, courseID);
        } else {
            result = await Liveclass.getResources(db.mysql.read, masterChapter);
            courseID = result[0].liveclass_course_id;
        }
        const courseDetails = await Liveclass.getCourseDetails(db.mysql.read, courseID);
        const categoryID = courseDetails[0].category_id;
        const courseType = courseDetails[0].course_type;
        // check if user is subscribed or not
        const studentPackageList = await CourseMysql.getUserSubscription(db.mysql.read, studentID);
        const paymentCardState = CourseHelper.getPaymentCardStateV2({
            data: studentPackageList,
            courseType,
            categoryID,
        });
        // get live class details
        const streamList = [];
        const button = LiveclassHelper.generateButton(Data.paymentButtonText, 'payment_page', { id: courseID });
        const courseDetailsObj = {};
        const resourceWithoutStream = [];
        courseDetailsObj.collapse_title = Data.collapseTitle;
        const filteredReuslt = _.chain(result)
            .filter((item) => {
                if (item.resource_type == 2) {
                    return item;
                }
            })
            .uniqBy('resource_reference')
            .map((value) => LiveclassHelper.generateResourceObject(value, paymentCardState))
            .value();
        const offeringList = [];
        const facultySubs = await CourseContainer.getRandomSubsViews({
            db,
            type: 'liveclass_faculty',
            id: result[0].faculty_id,
        });
        const isPremium = (courseDetails[0].is_free == 0);
        for (let i = 0; i < result.length; i++) {
            // if (result[i].is_free == 0) {
            //     isPremium = true;
            // }
            courseDetailsObj.faculty_name = result[i].mapped_faculty_name ? result[i].mapped_faculty_name.toUpperCase() : '';
            courseDetailsObj.image_url = result[i].mapped_faculty_image_url;
            courseDetailsObj.description = result[i].description;
            courseDetailsObj.students = `${facultySubs.subs} registered`;
            courseDetailsObj.subject_course = `${result[i].subject} ${result[i].course}`;
            courseDetailsObj.subject = result[i].subject;
            courseDetailsObj.experience = `${result[i].experience} Years+ Exp`;
            courseDetailsObj.board = result[i].board_name;
            courseDetailsObj.degree_college = `${result[i].degree}, ${result[i].college}`;
            courseDetailsObj.is_premium = (courseDetails[0].is_free == 0);
            courseDetailsObj.is_vip = (courseDetails[0].is_free == 0) ? paymentCardState.isVip : true;
            // if (result[i].resource_type == 4) {
            if (result[i].resource_type == 4) {
                if (_.isNull(result[i].is_active)) {
                    streamList.push(await LiveclassHelper.generateStreamObject(result[i], db, config, paymentCardState.isVip));
                } else if (!((moment(result[i].live_at) < moment().add(5, 'hours').add(30, 'minutes')) && result[i].is_active == 0)) {
                    streamList.push(await LiveclassHelper.generateStreamObject(result[i], db, config, paymentCardState.isVip));
                }
            } else {
                resourceWithoutStream.push(result[i]);
                if (result[i].resource_type == 1) {
                    offeringList.push(result[i].topic);
                }
            }
        }
        courseDetailsObj.offering = offeringList;
        courseDetailsObj.resourses = filteredReuslt;
        const reminderCard = LiveclassHelper.generateReminderCard(`https://www.google.com/calendar/render?action=TEMPLATE&text=${masterChapter}+Stream&dates=20140127T224000Z/20140320T221500Z&details=For+details,+link+here:+http://www.example.com&location=Waldorf+Astoria,+301+Park+Ave+,+New+York,+NY+10022&sf=true&output=xml`);
        const groupByChapter = _.groupBy(resourceWithoutStream, 'details_id');
        // console.log('groupByChapter')
        // console.log(groupByChapter)

        const resourceDetails = _.map(groupByChapter, (value, key) => LiveclassHelper.generateResourceDetails(key, value, paymentCardState));

        const resp = LiveclassHelper.generateResponse(courseDetailsObj, paymentCardState.isVip, button, streamList, reminderCard, resourceDetails, masterChapter, courseID, isPremium);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: resp,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function packageInfo(req, res, next) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const studentID = req.user.student_id;
        const courseID = req.query.course_id;
        const xAuthToken = req.headers['x-auth-token'];
        const flagrResponse = await Flagr.evaluateServiceWrapper({
            db,
            xAuthToken,
            entityContext: { studentId: studentID.toString() },
            flagID: 49,
            timeout: 3000,
        });
        const now = moment().add(5, 'hours').add(30, 'minutes');
        const courseDetails = await Liveclass.getBoardDetails(db.mysql.read, courseID);
        // check if user on subscription
        const studentPackageList = await Liveclass.checkSubscription(db.mysql.write, studentID, courseID);
        let userOnSubscription = false;
        if (studentPackageList.length > 0) userOnSubscription = true;
        let response = {};
        if (userOnSubscription) {
            // student is on subscription
            response = await LiveclassHelper.fetchInfoForUserOnSubscription(studentPackageList[0], now, flagrResponse, config, courseID);
        } else {
            // student is NOT on a subscription
            response = await LiveclassHelper.fetchSubscriptionDetails(studentID, flagrResponse, config, courseID);
        }
        let subDesc = 'English & Hindi';
        if (courseDetails[0].locale === 'english') {
            subDesc = 'English';
        } else if (courseDetails[0].locale === 'hindi') {
            subDesc = 'Hindi';
        }
        response.main.package_description = {};
        response.main.package_description.title = courseDetails[0].title;
        response.main.package_description.includes = Data.packageDetailsInvludes;
        response.main.package_description.subjects = [Data.packageeSubjects, subDesc];
        const responseData = {};
        responseData.meta = {};
        responseData.meta.code = 200;
        responseData.meta.success = true;
        responseData.meta.message = 'SUCCESS';

        responseData.data = response;

        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function postQuizDetails(req, res, next) {
    try {
        db = req.app.get('db');
        const studentID = req.user.student_id;
        const resourceID = req.query.resource_id;
        const result = await Liveclass.getPostQuizDetails(db.mysql.read, resourceID, studentID);
        // promise.push(Liveclass.getLivesteamDetails(db.mysql.read, resourceID));
        // get start stream timing
        const finalList = [];
        // const streamDetails = resolvedPromise[1];
        for (let i = 0; i < result.length; i++) {
            const resourceDetailID = result[i].id;
            const detailID = result[i].detail_id;
            const quizQuestionIDArr = result[i].resource_reference.split('|');
            const expiryTimeArr = result[i].meta_info.split('|');
            const masterObj = {};
            masterObj.detail_id = detailID;
            masterObj.resource_detail_id = resourceDetailID;
            masterObj.live_at = moment(result[0].created_at).diff(moment(result[0].start_time), 'seconds');
            const dataArr = [];
            for (let j = 0; j < quizQuestionIDArr.length; j++) {
                const promises = [];
                promises.push(Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionIDArr[j]));
                promises.push(Liveclass.getQuizResponse(db.mysql.read, quizQuestionIDArr[j], resourceDetailID, detailID, studentID));
                const resolvedPromises = await Promise.all(promises);
                let quizDetail = resolvedPromises[0];
                const userResponse = resolvedPromises[1];
                quizDetail = modifyObj(quizDetail);
                const obj = {};
                obj.question = LiveclassHelper.quotesEscape(quizDetail[0].ocr_text);
                obj.quiz_question_id = quizQuestionIDArr[j];
                obj.expiry = (expiryTimeArr[j] === undefined) ? defaultExpiry : expiryTimeArr[j];
                obj.type = result[0].type;
                obj.options = [];
                obj.options.push(quizDetail[0].opt_1);
                obj.options.push(quizDetail[0].opt_2);
                obj.options.push(quizDetail[0].opt_3);
                obj.options.push(quizDetail[0].opt_4);
                obj.answer = quizDetail[0].answer.trim();
                obj.option_id = (userResponse.length > 0) ? userResponse[0].option_id : null;
                dataArr.push(obj);
                masterObj.list = dataArr;
            }
            finalList.push(masterObj);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: { list: finalList },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function markInterestedStudents(req, res, next) {
    try {
        db = req.app.get('db');
        const studentID = req.user.student_id;
        const resourceID = req.query.resource_id;
        const obj = {
            resource_reference: resourceID,
            student_id: studentID,
            engage_time: null,
            detail_id: null,
            is_view: 0,
            is_interested: 1,
            version_code: req.headers.version_code,
        };

        if (req.query.live_at) {
            obj.live_at = moment(new Date(parseInt(req.query.live_at))).format('YYYY-MM-DD HH:mm:ss');
            if (req.query.is_reminder && req.query.reminder_set == 0) {
                obj.is_interested = 0;
            }

            const dataByResIdStuId = await Liveclass.getDataByResIdStuId(db.mysql.read, resourceID, studentID, obj.live_at);
            if (dataByResIdStuId.length > 0) {
                await Liveclass.updateSubscribersData(db.mysql.write, resourceID, studentID, obj.live_at, { is_interested: obj.is_interested });
            } else {
                await Liveclass.subscribe(db.mysql.write, obj);
            }
        } else {
            await Liveclass.subscribe(db.mysql.write, obj);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getInterestedStudents(req, res, next) {
    try {
        db = req.app.get('db');
        // const studentID = req.user.student_id;
        const resourceID = req.query.resource_id;
        const result = await CourseContainer.getSubscribers(db, resourceID);
        const views = await CourseContainer.getViewSubscribers(db, resourceID);
        const course = await Liveclass.getCourseDetailByresourceReference(db.mysql.read, resourceID);
        // console.log(views)
        const viewBase = course[0].is_free ? 1000 : 250;
        const data = {
            interested: `INTERESTED ${result[0].length + 20000} STUDENTS`,
            views: `${views[0].length + viewBase} WATCHING`,
        };
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function facultyLogin(req, res, next) {
    try {
        const { email } = req.query;
        const { password } = req.query;
        db = req.app.get('db');
        const config = req.app.get('config');
        // md5 password
        let responseData = {};
        const result = await Liveclass.getFacultyByEmailAndPassword(db.mysql.read, email, password);
        const token = Token.sign({ id: result[0].student_id }, config.jwt_secret, true);
        result[0].token = token;
        if (result.length > 0) {
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: result[0],
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        responseData = {
            meta: {
                code: 403,
                success: false,
                message: 'Fail',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getLeaderBoard(req, res, next) {
    try {
        let { offset } = req.query;
        db = req.app.get('db');
        const config = req.app.get('config');
        if (typeof offset === 'undefined') {
            offset = 1;
        }
        const { is_new } = req.query;
        const data = {};
        // get date
        const date = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .subtract(offset, 'days')
            .format('DD/MM/YYYY');
        const leaderBoardList = await CourseRedis.getLeaderboardByDate(db.redis.read, date, 0, 99);
        const leaderBoardTitle = Data.getLeaderBoardTitle(offset, date);
        // get contest winner details
        const contestWinners = await ContestMysql.getContestWinnerDetailsByParameter(db.mysql.read, 'max_quiz_points', offset);
        const contestWinnerObject = {
            title: Data.getContestWinnerTitle(offset, date),
            items: (contestWinners.length === 1 && _.isNull(contestWinners[0].mobile)) ? [] : contestWinners.map((value) => ({
                student_id: value.student_id,
                avatar: value.img_url,
                username: value.student_fname ? value.student_fname : value.student_username,
                mobile: LiveclassHelper.replaceWithHash(value.mobile),
            })),
        };
        const contestBanner = contestWinners[0].logo;
        data.contest_banner = is_new ? Data.getContestBanner(config.staticCDN) : contestBanner;
        data.contest_winners = contestWinnerObject;
        // generate leaderboard
        data.leaderBoard = {
            title: leaderBoardTitle,
            items: await LiveclassHelper.generateLeaderBoard(db, leaderBoardList),
        };
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function currentLeaderBoardStats(req, res, next) {
    try {
        let { student_id: studentID } = req.query;
        const buff = Buffer.from(studentID, 'base64');
        studentID = buff.toString('ascii');
        db = req.app.get('db');
        const date = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .format('DD/MM/YYYY');
        const data = {};
        const [
            userDetails,
            rank,
            points,
            leaderBoardList,
            contestDetails,
        ] = await Promise.all([
            StudentContainer.getById(studentID, db),
            CourseRedis.getUserRankByDate(db.redis.read, date, studentID),
            CourseRedis.getUserScoreByDate(db.redis.read, date, studentID),
            CourseRedis.getLeaderboardByDate(db.redis.read, date, 0, 99),
            ContestMysql.getContestWinnerDetailsByParameter(db.mysql.read, 'max_quiz_points', 0),
        ]);
        const userStats = {
            title: 'AAPKE AAJ KE SCORES',
            student_id: userDetails[0].student_id,
            avatar: userDetails[0].img_url,
            username: userDetails[0].student_username,
            mobile: LiveclassHelper.replaceWithHash(userDetails[0].mobile),
            rank: (!_.isNull(rank)) ? rank + 1 : -1,
            points: (!_.isNull(points)) ? parseInt(points) : 0,
        };
        data.banner = contestDetails[0].logo;
        data.user_stats = userStats;

        data.leaderBoard = {
            title: Data.getLeaderBoardTitle(0, date),
            items: await LiveclassHelper.generateLeaderBoard(db, leaderBoardList),
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
async function status(req, res, next) {
    try {
        const { id: resourceReference } = req.query; // resource reference
        db = req.app.get('db');
        const config = req.app.get('config');
        const { version: versionCode } = req.headers;
        const liveclassDetails = await Liveclass.getLivestreamDetails(db.mysql.read, resourceReference);
        const data = {};
        let timeRemaining = -1;
        let text = 'default';
        if (liveclassDetails.length > 0) {
            const now = moment().add(5, 'hours').add(30, 'minutes');
            timeRemaining = moment(liveclassDetails[0].live_at).diff(now, 'seconds');
            text = LiveclassHelper.getLiveclassStatus(liveclassDetails[0].live_at);
        }
        data.state = await LiveclassHelper.getStatus(db, liveclassDetails, versionCode); // 0 - not started , 1 - started , 2 - class over
        data.time_remaining = timeRemaining;
        data.text = text;
        data.thumbnail = `${config.staticCDN}engagement_framework/74CE8DE6-88E6-BDAA-6B73-BEB7F85EC08E.webp`;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

function getAvailableStatus(liveClassList, timeDetails) {
    let liveStatus = false;
    let upcomingStatus = false;
    let pastStatus = false;

    const { currentTimeStamp, hourMiliSeconds } = timeDetails;

    for (let i = 0; i < liveClassList.length; i++) {
        if ((liveClassList[i].resource_type == 4 && liveClassList[i].stream_status === 'ACTIVE') || (liveClassList[i].resource_type == 1 && liveClassList[i].live_at_timestamp < currentTimeStamp && (liveClassList[i].live_at_timestamp + hourMiliSeconds) > currentTimeStamp)) {
            liveStatus = true;
        }
        if ((liveClassList[i].resource_type == 4 && liveClassList[i].stream_status == null) || (liveClassList[i].resource_type == 1 && liveClassList[i].live_at_timestamp > currentTimeStamp)) {
            upcomingStatus = true;
        }
        if (liveClassList[i].resource_type == 8) {
            pastStatus = true;
        }
    }
    return [liveStatus, upcomingStatus, pastStatus];
}

function extractDistinctData(liveClassList, keyName) {
    const distinctIds = [];
    const newList = [];
    for (let i = 0; i < liveClassList.length; i++) {
        if (!distinctIds.includes(liveClassList[i][keyName])) {
            distinctIds.push(liveClassList[i][keyName]);
            newList.push(liveClassList[i]);
        }
    }
    return newList;
}

function makeStatusGetQuestion(statusDetails, liveClassList, timeDetails) {
    const {
        liveStatus, upcomingStatus, pastStatus, userStatus,
    } = statusDetails;
    const statusTagList = [];
    let questionStatus;

    if (userStatus === 'default') {
        if (liveStatus) {
            statusTagList.push({
                display: 'Live',
                key: 'live',
                isSelected: 1,
            });
            questionStatus = 'live';
        }
        if (upcomingStatus) {
            if (!liveStatus) {
                statusTagList.push({
                    display: 'Upcoming',
                    key: 'upcoming',
                    isSelected: 1,
                });
                questionStatus = 'upcoming';
            } else {
                statusTagList.push({
                    display: 'Upcoming',
                    key: 'upcoming',
                    isSelected: 0,
                });
            }
        }
        if (pastStatus) {
            if (liveStatus || upcomingStatus) {
                statusTagList.push({
                    display: 'Past',
                    key: 'past',
                    isSelected: 0,
                });
            } else {
                statusTagList.push({
                    display: 'Past',
                    key: 'past',
                    isSelected: 1,
                });
                questionStatus = 'past';
            }
        }
    } else if (userStatus === 'live') {
        statusTagList.push({
            display: 'Live',
            key: 'live',
            isSelected: 1,
        });
        if (upcomingStatus) {
            statusTagList.push({
                display: 'Upcoming',
                key: 'upcoming',
                isSelected: 0,
            });
        }
        if (pastStatus) {
            statusTagList.push({
                display: 'Past',
                key: 'past',
                isSelected: 0,
            });
        }
        questionStatus = 'live';
    } else if (userStatus === 'upcoming') {
        if (liveStatus) {
            statusTagList.push({
                display: 'Live',
                key: 'live',
                isSelected: 0,
            });
        }
        statusTagList.push({
            display: 'Upcoming',
            key: 'upcoming',
            isSelected: 1,
        });
        if (pastStatus) {
            statusTagList.push({
                display: 'Past',
                key: 'past',
                isSelected: 0,
            });
        }
        questionStatus = 'upcoming';
    } else if (userStatus === 'past') {
        if (liveStatus) {
            statusTagList.push({
                display: 'Live',
                key: 'live',
                isSelected: 0,
            });
        }
        if (upcomingStatus) {
            statusTagList.push({
                display: 'Upcoming',
                key: 'upcoming',
                isSelected: 0,
            });
        }
        statusTagList.push({
            display: 'Past',
            key: 'past',
            isSelected: 1,
        });
        questionStatus = 'past';
    }
    const questionList = makeDataList(liveClassList, questionStatus, timeDetails);

    return [statusTagList, questionList];
}

function makeDataList(liveClassList, questionStatus, timeDetails) {
    let liveQuestions = [];
    const { currentTimeStamp, hourMiliSeconds } = timeDetails;

    for (let i = 0; i < liveClassList.length; i++) {
        if (questionStatus === 'live' && ((liveClassList[i].resource_type == 4 && liveClassList[i].stream_status === 'ACTIVE') || (liveClassList[i].resource_type == 1 && liveClassList[i].live_at_timestamp < currentTimeStamp && (liveClassList[i].live_at_timestamp + hourMiliSeconds) > currentTimeStamp))) {
            liveQuestions.push(liveClassList[i]);
        } else if (questionStatus === 'upcoming' && ((liveClassList[i].resource_type == 4 && liveClassList[i].stream_status == null) || (liveClassList[i].resource_type == 1 && liveClassList[i].live_at_timestamp > currentTimeStamp))) {
            liveQuestions.push(liveClassList[i]);
        } else if (questionStatus === 'past' && liveClassList[i].resource_type == 8) {
            liveQuestions.push(liveClassList[i]);
        }
    }
    liveQuestions = extractDistinctData(liveQuestions, 'resource_reference');
    return liveQuestions;
}

async function getAllAssortments(db, assortmentList, studentClass) {
    try {
        const totalAssortments = [];
        const totalMapppings = await CourseJsHelper.getAllAssortmentsRecursively(db, assortmentList, totalAssortments, studentClass);
        return totalMapppings;
    } catch (e) {
        throw new Error(e);
    }
}

async function getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass) {
    let studentPackageAssortments = [];
    for (let i = 0; i < studentPackageList.length; i++) {
        if (studentPackageAssortments.indexOf(studentPackageList[i].assortment_id) < 0) {
            studentPackageAssortments.push(studentPackageList[i].assortment_id);
        }
    }
    if (studentPackageAssortments.length) {
        let result = await getAllAssortments(db, studentPackageAssortments, studentClass);
        result = result.totalAssortments;
        studentPackageAssortments = [...studentPackageAssortments, ...result];
    }
    return studentPackageAssortments;
}

async function formatQuestionsData(reqData, versionCode) {
    const {
        studentId, questionList, db, config, studentClass,
    } = reqData;

    const assortmentList = questionList.map((x) => x.assortment_id);
    const assortmentPriceMapping = await CourseJsHelper.generateAssortmentVariantMapping(db, assortmentList, studentId);

    const studentPackageList = await CourseMysqlV2.getUserActivePackages(db.mysql.read, studentId);
    const studentPackageAssortments = await getChildAssortmentsOfUserPackages(db, studentPackageList, studentClass);

    const newQuestionsList = [];
    for (let i = 0; i < questionList.length; i++) {
        const vipState = studentPackageAssortments.indexOf(questionList[i].assortment_id) >= 0;
        const questionData = LiveclassHelper.generateStreamObjectResourcePage(questionList[i], db, config, vipState, 'LIVE_CLASS_MPVP');
        let items = {};
        if (versionCode > 866) {
            questionData.button = {
                text: Data.freeClassButtonText,
                deeplink: `doubtnutapp://course_details?id=${parseInt(questionList[i].assortment_id)}`,
            };
        } else {
            questionData.button = {
                text: Data.freeClassButtonText,
                action: {
                    action_data: {
                        id: parseInt(questionList[i].assortment_id),
                    },
                },
            };
        }

        questionData.title1 = questionList[i].display;
        questionData.lock_state = questionData.is_premium ? (vipState ? 2 : 1) : 0;
        questionData.assortment_id = questionList[i].assortment_id;
        questionData.payment_deeplink = `doubtnutapp://vip?assortment_id=${questionList[i].assortment_id}`;
        questionData.deeplink = `doubtnutapp://vip?assortment_id=${questionList[i].assortment_id}`;
        questionData.is_free = questionList[i].is_free;
        if (!questionList[i].live_at) {
            const hours = Math.round(questionList[i].duration / 3600);
            const minutes = Math.round((questionList[i].duration % 3600) / 60);
            questionData.top_title = `${hours > 0 ? `${hours} hr ` : ''}${minutes > 0 ? `${minutes} mins ` : ''}`;
            if (!hours && !minutes) {
                questionData.top_title = 'Recorded';
            }
        }
        if (!questionList[i].is_free && !vipState) {
            const basePrice = assortmentPriceMapping && assortmentPriceMapping[parseInt(questionList[i].assortment_id)] ? assortmentPriceMapping[parseInt(questionList[i].assortment_id)].base_price : 0;
            const displayPrice = assortmentPriceMapping && assortmentPriceMapping[parseInt(questionList[i].assortment_id)] ? assortmentPriceMapping[parseInt(questionList[i].assortment_id)].display_price : 0;
            questionData.amount_to_pay = displayPrice > 0 ? `₹${displayPrice}` : '';
            questionData.amount_strike_through = basePrice > 0 && (basePrice !== displayPrice) ? `₹${basePrice}` : '';
            questionData.buy_text = 'BUY';
            questionData.discount = basePrice - displayPrice > 0 ? `(${Math.round(((basePrice - displayPrice) / basePrice) * 100)}% OFF)` : '';
        }
        if (moment().add(5, 'hours').add(30, 'minutes').isAfter(questionList[i].live_at) || !questionList[i].live_at) {
            questionData.show_reminder = false;
            questionData.button_state = (!questionList[i].is_free && !vipState) ? 'payment' : 'multiple';
            if (!(questionList[i].resource_type === 4 && !questionList[i].is_active && moment().add(5, 'hours').add(30, 'minutes').isAfter(questionList[i].live_at))) {
                items = questionData;
            }
        } else {
            questionData.show_reminder = true;
            questionData.button_state = (!questionList[i].is_free && !vipState) ? 'payment' : 'multiple';
            items = questionData;
        }

        items.image_url = questionList[i].expert_image;

        let typeOfCarousel = 'live_class_vertical_card';
        if (versionCode >= 807) {
            typeOfCarousel = 'live_class_carousel_card';
        }

        if (!_.isEmpty(items)) {
            const dataToReturn = {
                type: typeOfCarousel,
                data: items,
            };
            newQuestionsList.push(dataToReturn);
        }
    }
    return newQuestionsList;
}

async function videoPageData(req, res) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const { question_id: questionId, status: userStatus } = req.params;
        const { student_id: studentId, student_class: studentClass } = req.user;
        const { version_code: versionCode } = req.headers;

        const d = new Date();
        const currentTimeStamp = d.getTime();
        const hourMiliSeconds = 3600000; // 1 hour = 3600000ms

        const timeDetails = {
            currentTimeStamp,
            hourMiliSeconds,
        };

        const questionData = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, questionId);
        if (!_.isEmpty(questionData)) {
            const { chapter } = questionData[0];
            let liveClassList = await Liveclass.getLiveClassByChapter(db.mysql.read, chapter, studentClass);
            liveClassList = extractDistinctData(liveClassList, 'resource_id');

            const [liveStatus, upcomingStatus, pastStatus] = getAvailableStatus(liveClassList, timeDetails);
            const statusDetails = {
                liveStatus,
                upcomingStatus,
                pastStatus,
                userStatus,
            };
            const [statusTagList, questionList] = makeStatusGetQuestion(statusDetails, liveClassList, timeDetails);

            const reqData = {
                studentId,
                questionList,
                db,
                config,
                studentClass,
            };
            const newQuestionList = await formatQuestionsData(reqData, versionCode);
            newQuestionList.push({
                type: 'button',
                data: {
                    button_text: 'View all courses',
                    bg_color: '#EA532C',
                },
                action: {
                    deeplink: 'doubtnutapp://live_class_home',
                },
            });

            const response = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: {
                    statusTags: statusTagList,
                    viewAllLink: 'doubtnutapp://live_class_home',
                    title_text: `Live Classes ${chapter}`,
                    questions: newQuestionList,
                },
            };
            return res.status(response.meta.code).json(response);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'No Data',
            },
            data: 'Nothing found',
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 404,
                success: false,
                message: 'Failed',
            },
            data: 'Error',
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

function removeUnusedData(finalData, removeKeysArr) {
    for (let i = 0; i < removeKeysArr.length; i++) {
        const keyName = removeKeysArr[i];
        delete finalData[keyName];
    }
    return finalData;
}

async function videoPageLiveBanner(req, res) {
    try {
        db = req.app.get('db');
        const config = req.app.get('config');
        const { question_id: questionId } = req.params;
        const { student_id: studentId, student_class: studentClass } = req.user;
        const { version_code: versionCode } = req.headers;

        const d = new Date();
        const currentTimeStamp = d.getTime();
        const hourMiliSeconds = 3600000; // 1 hour = 3600000ms

        const timeDetails = {
            currentTimeStamp,
            hourMiliSeconds,
        };

        const questionData = await QuestionContainer.getByQuestionIdForCatalogQuestions(db, questionId);
        if (!_.isEmpty(questionData)) {
            const { chapter } = questionData[0];
            let liveClassList = await Liveclass.getLiveClassByChapter(db.mysql.read, chapter, studentClass);
            liveClassList = extractDistinctData(liveClassList, 'resource_id');

            const [liveStatus, upcomingStatus, pastStatus] = getAvailableStatus(liveClassList, timeDetails);

            let userStatus = 'past';
            if (!pastStatus) {
                if (liveStatus) {
                    userStatus = 'live';
                } else {
                    userStatus = 'upcoming';
                }
            }
            const questionList = makeDataList(liveClassList, userStatus, timeDetails);

            const reqData = {
                studentId,
                questionList,
                db,
                config,
                studentClass,
            };
            const newQuestionList = await formatQuestionsData(reqData, versionCode);
            let finalData = newQuestionList[0].data;
            finalData.title_text = 'We Found Similar Live Video';
            finalData.live_text = 'Live Now';
            const removeKeysArr = ['top_title', 'subject', 'students', 'color', 'show_reminder', 'start_gd', 'mid_gd', 'end_gd', 'image_bg_card', 'board', 'interested', 'bottom_title', 'duration', 'remaining', 'reminder_message', 'lock_state'];
            finalData = removeUnusedData(finalData, removeKeysArr);

            const response = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
                data: finalData,
            };
            return res.status(response.meta.code).json(response);
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'No Data',
            },
            data: 'Nothing found',
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 404,
                success: false,
                message: 'Failed',
            },
            data: 'Error',
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

module.exports = {
    getPushUrl,
    pushQuizQuestion,
    quizSubmit,
    getQuizQuestions,
    end,
    getList,
    startByFaculty,
    home,
    courseDetail,
    packageInfo,
    postQuizDetails,
    markInterestedStudents,
    getInterestedStudents,
    facultyLogin,
    getLeaderBoard,
    currentLeaderBoardStats,
    status,
    videoPageData,
    videoPageLiveBanner,
};
