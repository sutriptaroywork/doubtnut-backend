// eslint-disable-next-line import/no-extraneous-dependencies
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */

const _ = require('lodash');
const moment = require('moment');

const defaultExpiry = 30;
const CourseMysql = require('../../../modules/mysql/coursev2');
const Liveclass = require('../../../modules/mysql/liveclass');
const CourseContainer = require('../../../modules/containers/course');
const CourseContainerV2 = require('../../../modules/containers/coursev2');
const LiveclassHelper = require('../../helpers/liveclass');
const CourseHelper = require('../../helpers/course');
const StudentContainer = require('../../../modules/containers/student');
const Data = require('../../../data/liveclass.data');
const CourseRedis = require('../../../modules/redis/course');
const CourseRedisv2 = require('../../../modules/redis/coursev2');
const ContestContainer = require('../../../modules/containers/contest');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
const Utility = require('../../../modules/utility');
const AnswerRedis = require('../../../modules/redis/answer');
const AnswerContainer = require('../../../modules/containers/answer');
const LocalAnswerContainerv13 = require('../../v13/answer/answer.container');
const studyGroupController = require('../../v1/studyGroup/studyGroup.controller');

// const SearchHelper = require('../../helpers/search');

const old = true;

async function getLeaderBoard(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        let {
            student_id: studentID,
            course_id: courseID,
            offset,
        } = req.query;
        const data = {};

        // studentID = 93002231;
        // get all liveclass courses
        offset = (typeof offset !== 'undefined' && offset !== '') ? offset : 1;
        if (offset !== 0) {
            const buff = Buffer.from(studentID, 'base64');
            studentID = buff.toString('ascii');
        }
        const userPointsLogs = [];
        const [courseList, userDetails] = await Promise.all([
            CourseContainer.getAllCourse(db),
            StudentContainer.getById(studentID, db),
        ]);
        courseID = (typeof courseID !== 'undefined' && !_.isEmpty(courseID)) ? courseID : courseList[0].course_id;
        const currentDate = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            // .subtract(1, 'days')
            .format('YYYY-MM-DD');
        let offsetDate = moment()
            .add(5, 'hours')
            .add(30, 'minutes')
            .subtract(offset, 'days')
            .format('YYYY-MM-DD');

        if (moment('HH:mm:ss').add(5, 'hours')
            .add(30, 'minutes')
            .isBetween(moment('21:00:00', 'HH:mm:ss'), moment('23:59:59', 'HH:mm:ss'))) {
            offsetDate = currentDate;
        }
        if (offset !== 0) {
            for (let i = 0; i < courseList.length; i++) {
                const [score] = await Promise.all([
                    CourseRedis.getUserScoreByDateAndCourse(db.redis.read, currentDate, courseList[i].course_id, studentID),
                ]);
                if (!_.isNull(score)) {
                    userPointsLogs.push({
                        course_id: courseList[i].course_id,
                        points: parseInt(score),
                        class: courseList[i].class,
                        course_name: `${courseList[i].display_name}`,
                    });
                }
            }
        }

        // offset = 0;
        data.tab_list = LiveclassHelper.getCourseTabsWidget(courseList, courseID);
        // let previousWinnerList = await CourseContainer.getPerviosContestWinner(db, currentDate);
        let previousWinnerList = [];
        previousWinnerList = _.groupBy(previousWinnerList, 'student_id');
        const leaderBoard = await CourseContainer.getLeaderBoard(db, courseID, currentDate, courseList, 50, previousWinnerList);
        data.leaderboard = {
            title: `TOP 100 SCORE[${currentDate}]`,
            items: leaderBoard,
        };
        let userPoints = 0;
        let userRank = 'NA';
        let userCourseID = 0;
        let userClass = 0;
        let userCourseName = 'NIL';
        if (userPointsLogs.length > 0 && typeof previousWinnerList[studentID] === 'undefined') {
            const totalPoints = _.maxBy(userPointsLogs, 'points');
            userCourseID = totalPoints.course_id;
            userPoints = totalPoints.points;
            userClass = totalPoints.class;
            userCourseName = totalPoints.course_name;
            const groupedByPoints = _.groupBy(userPointsLogs, 'points');
            // check  more than one max points instance
            if (typeof groupedByPoints[totalPoints.points] !== 'undefined' && groupedByPoints[totalPoints.points].length > 1) {
                const courseArr = groupedByPoints[totalPoints.points].map((item) => item.course_id);
                // get recent answered course id
                const recent = await CourseContainerV2.getRecentCorrect(db, studentID, courseArr, currentDate);
                userCourseID = courseArr.filter((item) => {
                    // if (recent.length > 0) {
                    if (item === recent) return true;
                    // }
                    // return false;
                });
                const groupedByCourse = _.groupBy(userPointsLogs, 'course_id');
                userClass = groupedByCourse[userCourseID].class;
                userCourseName = groupedByCourse[userCourseID].course_name;
            }
        }
        // get user rank by course id
        // if (userCourseID !== 0) {
        //     userRank = await CourseRedis.getUserRankByDateAndCourse(db.redis.read, currentDate, userCourseID, studentID);
        // }
        const leaderBoardForUserRank = await CourseContainer.getLeaderBoard(db, userCourseID, currentDate, courseList, 0, previousWinnerList);
        if (leaderBoardForUserRank.length > 0 && leaderBoardForUserRank.length > 50) {
            userRank = '150+';
        }
        for (let i = 0; i < leaderBoardForUserRank.length; i++) {
            if (leaderBoardForUserRank[i].student_id == studentID) {
                userRank = i + 1;
            }
        }
        let userStats = {};
        if (offset !== 0) {
            userStats = {
                title: 'AAPKE AAJKE SCORE',
                avatar: userDetails[0].img_url,
                username: userDetails[0].student_fname ? userDetails[0].student_fname : userDetails[0].student_username,
                mobile: LiveclassHelper.replaceWithHash(userDetails[0].mobile),
                points: userPoints,
                rank: userRank,
                course_id: userCourseID,
                class: userClass,
                course_name: userCourseName,
            };
        }

        data.user_stats = userStats;
        const promises = [];
        // promises.push(ContestContainer.getLuckyDrawDetailsByParameter(db, 'max_quiz_points', offsetDate));
        if (offset === 0) {
            promises.push(ContestContainer.getAllWinnersByParameter(db, 'max_quiz_points', offsetDate));
        } else {
            promises.push(ContestContainer.getWinnersByParameter(db, 'max_quiz_points', offsetDate, courseID));
        }
        // get lucky draw winners
        const [contestWinner] = await Promise.all(promises);
        const luckyDrawObject = {
            title: Data.getContestWinnerTitle(offset, offsetDate),
            // items: (luckyDrawWinners.length === 1 && _.isNull(luckyDrawWinners[0].mobile)) ? [] : luckyDrawWinners.map((value) => ({
            //     student_id: value.student_id,
            //     avatar: value.img_url,
            //     username: value.student_fname ? value.student_fname : value.student_username,
            //     course_id: value.course_id,
            //     class: value.class,
            //     course_name: `${value.class}th ${value.locale}`,
            //     mobile: LiveclassHelper.replaceWithHash(value.mobile),
            // })),
            items: [],
        };
        data.lucky_draw_winners = luckyDrawObject;
        data.contest_banner = Data.getContestBanner(config.staticCDN);
        // previous days winner
        const contestWinnerObject = {
            title: `Contest winners [${offsetDate}]`,
            items: (contestWinner.length === 1 && _.isNull(contestWinner[0].mobile)) ? [] : contestWinner.map((value) => ({
                student_id: value.student_id,
                avatar: value.img_url,
                username: value.student_fname ? value.student_fname : value.student_username,
                course_id: value.course_id,
                class: value.class,
                course_name: `${value.class}th ${value.locale}`,
                mobile: LiveclassHelper.replaceWithHash(value.mobile),
                rank: value.position,
                points: value.count,
            })),
        };
        data.previous = contestWinnerObject;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}
// 362234816
async function getList(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const facultyID = req.query.faculty_id;
        const studentID = -22;
        const data = await CourseMysql.getList(db.mysql.read, facultyID);
        // for which push url is null
        const promises = [];
        for (let i = 0; i < data.length; i++) {
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
                await CourseMysql.updateResource(db.mysql.write, data[i].resource_id, questionID);
                data[i].resource_reference = questionID;
            }
            const now = moment().add(5, 'hours').add(30, 'minutes');
            // const now = moment();
            const live_at = moment(data[i].live_at);
            const remainingMinutes = live_at.diff(now, 'minutes');
            if ((_.isNull(data[i].stream_push_url) || data[i].stream_push_url.length === 0) && remainingMinutes < 30) {
                const url = Utility.getStreamUrl(config.liveclass.pushDomainName, config.liveclass.appName, data[i].resource_reference, config.liveclass.authKey);
                // update in mysql
                promises.push(CourseMysql.updateStreamPushurl(db.mysql.write, data[i].resource_id, url));
                if (old) {
                    promises.push(Liveclass.updateLiveClassInfoPushUrl(db.mysql.write, facultyID, url, data[i].old_detail_id));
                }
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

async function startByFaculty(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const resourceID = req.query.resource_id;
        let resourceReference = 0;
        let updateTime = true;
        const result = await CourseMysql.getResourceByID(db.mysql.read, resourceID);
        resourceReference = result[0].resource_reference;
        CourseRedisv2.delLiveStreamDetailsByQuestionID(db.redis.write, resourceReference);
        let responseData = {};
        LiveclassHelper.getStreamState(resourceReference.toString(), config, async (resp) => {
            if (resp.StreamState !== 'active') {
                responseData = {
                    meta: {
                        code: 403,
                        success: true,
                        message: 'Stream not started',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            if (old) {
                if (result.length > 0) {
                    const detailID = result[0].old_detail_id;
                    let sDetail = await Liveclass.getStreamDetails(db.mysql.read, detailID);
                    if (sDetail.length > 0 && _.isNull(sDetail[0].start_time)) {
                        await Liveclass.updateLiveClassInfoStartTime(db.mysql.write, detailID);
                    }
                    // get stream detail
                    // all detail id of this resource reference and type
                    const detailIDList = await CourseMysql.getAllDetailID(db.mysql.read, resourceReference);
                    const promise = [];
                    for (let i = 0; i < detailIDList.length; i++) {
                        sDetail = await Liveclass.getStreamDetails(db.mysql.read, detailID);
                        if (sDetail.length > 0 && _.isNull(sDetail[0].start_time)) {
                            promise.push(Liveclass.updateLiveClassInfoStartTime(db.mysql.write, detailIDList[i].liveclass_course_detail_id));
                        }
                    }
                    await Promise.all(promise);
                    if (!_.isNull(result[0].stream_start_time)) {
                        updateTime = false;
                    }
                }
            }
            // create answer video resource
            const streamName = `${resourceReference}_H264xait`;
            const url = Utility.getStreamUrl(config.liveclass.playbackDomainName, config.liveclass.appName, streamName, config.liveclass.authKey);
            // get answer id
            const questionWithAnswer = await AnswerContainer.getByQuestionId(resourceReference, db);
            // update order
            // add top resource
            const insertedData = {
                answer_id: questionWithAnswer[0].answer_id,
                resource: url,
                resource_type: 'RTMP',
                resource_order: 1,
                is_active: 1,
            };
            await Promise.all([
                (updateTime) ? CourseMysql.updateStreamStartTime(db.mysql.write, resourceID) : '',
                LiveclassHelper.handleAnswerVideoResource(db, questionWithAnswer[0].answer_id, insertedData, false),
            ]);
            await AnswerRedis.deleteByQuestionIdWithTextSolution(resourceReference, db.redis.write);
            const liveStreamDetails = await CourseContainerV2.getLivestreamDetails(db, resourceReference, true);
            if (updateTime) {
                LiveclassHelper.startFermiTranscode(config, resourceReference, url);
            }
            studyGroupController.postLiveClassStartMessageByTeacher(liveStreamDetails, req, db, resourceReference, config, resourceID, result);
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        });
    } catch (e) {
        next(e);
    }
}

async function getQuizQuestions(req, res, next) {
    try {
        const db = req.app.get('db');
        const resourceID = req.query.resource_id;
        // get assortment ids of resource
        const [assortments, resourceDetails] = await Promise.all([
            CourseMysql.getAssortmentIDs(db.mysql.read, resourceID),
            CourseMysql.getResourceByID(db.mysql.read, resourceID),
        ]);
        // get resouce detail id for old version
        const oldDetailID = resourceDetails[0].old_detail_id;
        if (assortments.length > 0) {
            const assortmentID = assortments[0].assortment_id;
            const result = await CourseMysql.getQuizResourceByResourceID(db.mysql.read, assortmentID);
            const arr = [];
            for (let i = 0; i < result.length; i++) {
                const oldQuizResource = await Liveclass.getQuizResource(db.mysql.read, oldDetailID, result[i].resource_reference);
                const masterObj = {};
                const dataArr = [];
                const { topic } = result[i];
                masterObj.quiz_resource_id = result[i].resource_id;
                masterObj.liveclass_id = resourceID;
                masterObj.liveclass_resource_id = resourceID;
                masterObj.resource_reference = resourceDetails[0].resource_reference;
                masterObj.detail_id = resourceDetails[0].old_detail_id;
                masterObj.resource_detail_id = (oldQuizResource.length > 0) ? oldQuizResource[0].id : '';
                const quizQuestionIDArr = result[i].resource_reference.split('|');
                const expiryTimeArr = result[i].meta_info.split('|');
                for (let j = 0; j < quizQuestionIDArr.length; j++) {
                    let quizDetail = await Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionIDArr[j]);
                    quizDetail = CourseHelper.modifyObj(quizDetail);
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
        }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function end(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const sqs = req.app.get('sqs');
        const admin = req.app.get('admin');
        const firebaseDb = admin.database();
        const fireBaseInstance = firebaseDb.ref('live_class_test');
        const resourceID = req.query.resource_id;

        // // const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');
        // // TODO: MAP newly created resource  resource type 8 to assortment ids
        let updateTime = true;
        const assortmentData = await CourseMysql.getParentAssortmentByResourceList(db.mysql.read, [resourceID]);
        const resolvedPromise = await CourseMysql.getResourceByID(db.mysql.read, resourceID);
        if (resolvedPromise.length > 0 && !_.isNull(resolvedPromise[0].stream_end_time)) {
            updateTime = false;
        }
        let responseData = {};
        const cloned = _.clone(resolvedPromise[0]);
        cloned.id = '';
        cloned.resource_type = 8;
        cloned.player_type = 'liveclass';
        cloned.stream_status = 'INACTIVE';
        cloned.stream_start_time = null;
        cloned.stream_end_time = null;
        if (resourceID.length === 0) {
            return next({
                message: 'Invalid resource', status: 500, isPublic: true, error: true,
            });
        }
        CourseRedisv2.delLiveStreamDetailsByQuestionID(db.redis.write, cloned.resource_reference);
        // get vod url
        LiveclassHelper.getVodUrl(cloned.resource_reference, config, async (vodUrl) => {
            // only runs when you get response from tencent
            // console.log('vodUrl');
            // console.log(vodUrl);
            // console.log(courseID);
            // console.log(createRow);
            if (vodUrl.m3u8.length > 0 && vodUrl.mp4.length > 0) {
                cloned.stream_vod_url = JSON.stringify(vodUrl);
                // get answer id
                const questionWithAnswer = await AnswerContainer.getByQuestionId(cloned.resource_reference, db);
                // update order
                // add top resource
                const insertedData = {
                    answer_id: questionWithAnswer[0].answer_id,
                    resource: vodUrl.m3u8,
                    resource_type: 'HLS',
                    resource_order: 1,
                    is_active: 1,
                };
                await Promise.all([
                    CourseMysql.updateAnswerVideo(db.mysql.write, cloned.resource_reference, vodUrl.m3u8),
                    (updateTime) ? CourseMysql.updateStreamEndTime(db.mysql.write, resourceID) : '',
                    CourseMysql.updateQuestionAnswered(db.mysql.write, cloned.resource_reference),
                    CourseMysql.updateVodUrl(db.mysql.write, resourceID, JSON.stringify(vodUrl)),
                    LiveclassHelper.handleAnswerVideoResource(db, questionWithAnswer[0].answer_id, insertedData, true),
                ]);
                await AnswerRedis.deleteByQuestionIdWithTextSolution(resolvedPromise[0].resource_reference, db.redis.write);
                await CourseRedisv2.delLiveStreamDetailsByQuestionID(db.redis.write, cloned.resource_reference);
                // check if resource type 8 of same resource reference is created or not
                const recorded = await CourseMysql.getRecordedResource(db.mysql.read, cloned.resource_reference);
                if (recorded.length === 0) {
                    const inserted = await CourseMysql.addResource(db.mysql.write, cloned);
                    const newResourceID = inserted.insertId;
                    const bulkData = [];
                    for (let i = 0; i < assortmentData.length; i++) {
                        bulkData.push([
                            assortmentData[i].assortment_id,
                            newResourceID,
                            assortmentData[i].resource_type,
                            assortmentData[i].name,
                            assortmentData[i].schedule_type,
                            assortmentData[i].live_at,
                            assortmentData[i].is_trial,
                            0,
                            0,
                            assortmentData[i].resource_name,
                            assortmentData[i].batch_id,
                        ]);
                    }
                    // add resource mappin
                    await CourseMysql.addResourceMapping(db.mysql.write, bulkData);
                    if (req.hostname === 'api.doubtnut.com') {
                        sqs.sendMessage({
                            QueueUrl: Data.fermiTencent,
                            MessageBody: JSON.stringify({
                                url: vodUrl.mp4,
                                questionId: cloned.resource_reference,
                            }),
                        }).promise().then((err, result) => {
                            console.log(err, result);
                        });
                        // Utility.sendMessage(sqs, Data.videoLeaveQueueUrl, {
                        //     actionType: 'liveclass_end',
                        //     question_id: cloned.resource_reference,
                        // });
                    }
                }
                LiveclassHelper.updateFirebase(cloned.resource_reference, fireBaseInstance);
                if (old) {
                    // resource type 8 for old structure
                    await CourseHelper.postTasks(db, cloned.resource_reference);
                    LiveclassHelper.updateFirebase(resourceID, fireBaseInstance);
                }
                // SearchHelper.updateIasSearchIndex(cloned, inAppSearchElasticInstance); // TODO: sudhir to handle this.
                await CourseContainerV2.getLivestreamDetails(db, cloned.resource_reference, true);

                if (updateTime) {
                    LiveclassHelper.stopFermiTranscode(config, cloned.resource_reference);
                }
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

async function pushQuizQuestion(req, res, next) {
    try {
        const db = req.app.get('db');
        const resourceID = req.query.resource_id;
        const quizResourceID = req.query.quiz_resource_id;
        const detailID = req.query.detail_id;
        const resourceDetailID = req.query.resource_detail_id;
        const resourceReference = req.query.resource_reference;
        const log = {
            liveclass_resource_id: resourceID,
            quiz_resource_id: quizResourceID,
        };
        if (typeof detailID !== 'undefined') log.detail_id = detailID;
        if (typeof resourceReference !== 'undefined') log.resource_id = resourceReference;
        if (typeof resourceDetailID !== 'undefined') log.resource_detail_id = resourceDetailID;
        const logg = await Liveclass.addQuizLog(db.mysql.write, log);
        let message = 'Not pushed';
        if (logg.affectedRows === 1) {
            message = 'Pushed';
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
        // }
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function quizSubmit(req, res, next) {
    try {
        const db = req.app.get('db');
        const liveclassResourceID = req.body.liveclass_resource_id; // resource reference
        const quizQuestionID = req.body.quiz_question_id;
        const quizResourceID = req.body.quiz_resource_id;
        const selectedOptions = req.body.selected_options;
        const studentID = req.user.student_id;
        const { version_code: versionCode } = req.headers;
        const data = {};
        // const { student_class: studentClass } = req.user;
        let isCorrect = 0;
        const [
            quizDetails,
            resourceDetails, // eslint-disable-line
            // quizDetails, // eslint-disable-line
        ] = await Promise.all([
            Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionID),
            CourseMysql.getResourceByID(db.mysql.read, liveclassResourceID),
            //     Liveclass.getResourceDetailsByID(db.mysql.read, resourceDetailID),
        ]);
        // check if user has submitted answer or not
        let answerSelected = false;
        if (selectedOptions.length) {
            answerSelected = true;
        }
        // const quizQuestionList = quizDetails[0].resource_reference.split('|');
        // const courseID = quizDetails[0].liveclass_course_id;
        // let lastQuizQuestion = false;
        // if (quizQuestionList[quizQuestionList.length - 1] === quizQuestionID) {
        //     lastQuizQuestion = true;
        // }
        const isLive = (resourceDetails[0].stream_status == 'ACTIVE');
        const result = CourseHelper.modifyObj(quizDetails);
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
        if (isCorrect && isLive) {
            // isFastest = await LiveclassHelper.checkFastest(db, quizQuestionID, detailID);
        }
        points = LiveclassHelper.getLiveQuizPoints(isCorrect, isFastest);
        data.resource_reference = resourceDetails[0].resource_reference;
        data.quiz_question_id = quizQuestionID;
        data.resource_detail_id = quizResourceID;
        data.detail_id = liveclassResourceID;
        data.option_id = selectedOptions;
        data.student_id = studentID;
        data.is_correct = isCorrect;
        data.points = points;
        data.is_live = (resourceDetails[0].stream_status === 'ACTIVE');
        data.version_code = versionCode;
        let duplicateResponse = false;
        if (answerSelected) {
            const quizLog = await CourseMysql.getQuizResponseByResourceReference(db.mysql.read, resourceDetails[0].resource_reference, studentID, quizQuestionID);
            if (!_.isEmpty(quizLog)) {
                duplicateResponse = true;
            }
            const submitResult = await Liveclass.addQuizResponse(db.mysql.write, data);
            if (submitResult.affectedRows && points > 0 && !duplicateResponse && moment().add(5, 'hours').add(30, 'minutes').format('HH') < 20) { // inserted
                // check if this question_id/resource_reference already answered or not
                // get all attached courses
                const courseIDList = await CourseMysql.getAssortmentMapping(db.mysql.read, resourceDetails[0].resource_reference);
                const currentDate = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD');

                for (let i = 0; i < courseIDList.length; i++) {
                    await CourseRedis.setDailyLeaderboardByDateAndCourse(db.redis.write, currentDate, points, courseIDList[i].assortment_id, studentID);
                    await CourseContainerV2.setRecentCorrectAnswer(db, courseIDList[i].assortment_id, studentID, currentDate);
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

async function postQuizDetails(req, res, next) {
    try {
        const db = req.app.get('db');
        const { version_code: versionCode } = req.headers;
        const resourceReference = req.query.resource_id;// this is question id
        let quizFromVod = true;
        let pollFromVod = true;
        let resourceID = 0;
        // eslint-disable-next-line prefer-const
        let [quizLogs, liveclassResourceDetails, resourceDetails] = await Promise.all([CourseMysql.getQuizLogsFromVod(db.mysql.read, resourceReference), CourseMysql.getLiveclassResourceByResourceReference(db.mysql.read, resourceReference), CourseMysql.getQuizResource(db.mysql.read, resourceReference)]);
        if (liveclassResourceDetails.length > 0) resourceID = liveclassResourceDetails[0].id;
        for (let i = 0; i < quizLogs.length; i++) {
            quizLogs[i].meta_info = quizLogs[i].widget_meta;
            quizLogs[i].resource_reference = quizLogs[i].widget_data;
            quizLogs[i].resource_id = quizLogs[i].question_id;
            if (resourceDetails.length > 0) {
                quizLogs[i].liveclass_resource_id = resourceDetails[0].liveclass_resource_id;
                quizLogs[i].quiz_resource_id = resourceDetails[0].quiz_resource_id;
                quizLogs[i].old_detail_id = resourceDetails[0].old_detail_id;
            }
        }

        if (quizLogs.length === 0) {
            quizFromVod = false;
            quizLogs = await CourseContainerV2.getPostQuizDetails(db, resourceReference);
        }
        let finalList = [];
        for (let i = 0; i < quizLogs.length; i++) {
            if ((((typeof quizLogs[i].stream_start_time !== 'undefined') && !_.isNull(quizLogs[i].stream_start_time)) || ((typeof quizLogs[i].vod_live_at !== 'undefined') && !_.isNull(quizLogs[i].vod_live_at))) && !_.isNull(quizLogs[i].resource_reference)) {
                // const resourceDetailID = quizLogs[i].resource_detail_id;
                const detailID = quizLogs[i].old_detail_id;
                const quizQuestionIDArr = quizLogs[i].resource_reference.split('|');
                const expiryTimeArr = quizLogs[i].meta_info.split('|');
                const masterObj = {};
                if (versionCode > 826) {
                    masterObj.type = 'quiz';
                }
                masterObj.detail_id = detailID;
                masterObj.resource_detail_id = null;
                masterObj.liveclass_resource_id = resourceID;
                masterObj.quiz_resource_id = quizLogs[i].quiz_resource_id;
                masterObj.live_at = moment(quizLogs[i].publish_time).diff(moment(quizLogs[i].stream_start_time), 'seconds');
                if (quizFromVod) {
                    masterObj.live_at = quizLogs[i].visibility_timestamp;
                }
                masterObj.created_at = quizLogs[i].created_at;
                const dataArr = [];
                for (let j = 0; j < quizQuestionIDArr.length; j++) {
                    let quizDetail = await Liveclass.getQuizQuestionDetails(db.mysql.read, quizQuestionIDArr[j]);
                    quizDetail = CourseHelper.modifyObj(quizDetail);
                    const obj = {};
                    obj.question = LiveclassHelper.quotesEscape(quizDetail[0].ocr_text);
                    obj.quiz_question_id = quizQuestionIDArr[j];
                    obj.expiry = (expiryTimeArr[j] === undefined) ? 30 : expiryTimeArr[j];
                    obj.response_expiry = 5;
                    obj.type = 0;
                    obj.options = [];
                    obj.options.push(quizDetail[0].opt_1);
                    obj.options.push(quizDetail[0].opt_2);
                    obj.options.push(quizDetail[0].opt_3);
                    obj.options.push(quizDetail[0].opt_4);
                    obj.answer = quizDetail[0].answer.trim();
                    obj.option_id = null;
                    dataArr.push(obj);
                    masterObj.list = dataArr;
                }
                finalList.push(masterObj);
            }
        }
        let pollLogs = [];
        if (versionCode > 826) {
            // check in vod poll logs first
            pollLogs = await CourseMysql.getPollLogsFromVod(db.mysql.read, resourceReference, resourceID);
            if (pollLogs.length === 0) {
                pollFromVod = false;
                pollLogs = await CourseMysql.getPostPollDetails(db.mysql.read, resourceID);
            }
            const optMap = ['A', 'B', 'C', 'D', 'E', 'F'];
            for (let i = 0; i < pollLogs.length; i++) {
                if (((typeof pollLogs[i].stream_start_time !== 'undefined') && !_.isNull(pollLogs[i].stream_start_time)) || ((typeof pollLogs[i].vod_live_at !== 'undefined') && !_.isNull(pollLogs[i].vod_live_at))) {
                    if (pollLogs[i].type === 'POLL' || pollLogs[i].widget_type === 'POLL') {
                        const obj = {
                            publish_id: pollLogs[i].id,
                            detail_id: pollLogs[i].liveclass_resource_id,
                            created_at: pollLogs[i].created_at,
                            live_at: moment(pollLogs[i].publish_time).diff(moment(pollLogs[i].stream_start_time), 'seconds'),
                            type: 'live_class_polls',
                            data: {
                                publish_id: pollLogs[i].id,
                                question: pollLogs[i].title,
                                quiz_question_id: pollLogs[i].info,
                                show_close_btn: false,
                                question_text_color: '#FFFFFF',
                                expiry_text_color: '#FFFFFF',
                                question_text_size: 14,
                                expiry_text_size: 14,
                                bg_color: '#54138a',
                                expiry: 15,
                                response_expiry: 5,
                                items: _.map(_.split(pollLogs[i].options, '#!#'), (option, index) => ({
                                    key: optMap[index],
                                    value: option,
                                })),
                            },
                        };
                        if (pollFromVod) {
                            obj.live_at = pollLogs[i].visibility_timestamp;
                        }
                        if (!_.isNull(obj.publish_id)) {
                            finalList.push(obj);
                        }
                    }
                }
            }
        }
        finalList = _.orderBy(finalList, ['live_at'], ['asc']);
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
        console.log(e);
        next(e);
    }
}

async function status(req, res, next) {
    try {
        const { id: resourceReference } = req.query; // resource reference
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { version_code: versionCode } = req.headers;
        const { student_id: studentID, student_class: studentClass } = req.user;
        let batchId = 1;
        let userPackages = [];
        // get all assortments from resource_reference/question id
        const result = await LocalAnswerContainerv13.checkLiveClassVideoByQuestionId(db, { question_id: resourceReference }, versionCode, studentID);
        if (result.length && !result[0].is_free) {
            const isVipAndAssortmentListData = await CourseHelper.checkVipByQuestionIdForVideoPage(db, result, studentID, resourceReference);
            batchId = isVipAndAssortmentListData.batchId;
            userPackages = isVipAndAssortmentListData.userPackages;
        }
        let liveclassDetails = await CourseContainerV2.getLivestreamDetails(db, resourceReference);
        liveclassDetails = liveclassDetails.filter((item) => item.batch_id == batchId);
        if (liveclassDetails.length > 1) {
            const obj = await CourseHelper.getliveClassForUserCourse(db, liveclassDetails, userPackages, studentClass);
            if (!_.isEmpty(obj)) {
                liveclassDetails = [obj];
            }
        }
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

async function endAppx(req, res, next) {
    try {
        const db = req.app.get('db');
        const sqs = req.app.get('sqs');
        const admin = req.app.get('admin');
        const firebaseDb = admin.database();
        const fireBaseInstance = firebaseDb.ref('live_class_test');
        const resourceID = req.query.resource_id;
        const vodUrl = req.body.video_url;
        // const inAppSearchElasticInstance = req.app.get('inAppSearchElasticInstance');
        // TODO: MAP newly created resource  resource type 8 to assortment ids
        let updateTime = true;
        const assortmentData = await CourseMysql.getParentAssortmentByResourceList(db.mysql.read, [resourceID]);
        const resolvedPromise = await CourseMysql.getResourceByID(db.mysql.read, resourceID);
        if (resolvedPromise.length > 0 && !_.isNull(resolvedPromise[0].stream_end_time)) {
            updateTime = false;
        }
        let responseData = {};
        const cloned = _.clone(resolvedPromise[0]);
        cloned.id = '';
        cloned.resource_type = 8;
        cloned.player_type = 'liveclass';
        cloned.stream_status = 'INACTIVE';
        cloned.stream_start_time = null;
        cloned.stream_end_time = null;
        if (resourceID.length === 0) {
            return next({
                message: 'Invalid resource', status: 500, isPublic: true, error: true,
            });
        }
        if (vodUrl) {
            cloned.stream_vod_url = vodUrl;
            // get answer id
            const questionWithAnswer = await AnswerContainer.getByQuestionId(cloned.resource_reference, db);
            // update order
            // add top resource
            const insertedData = {
                answer_id: questionWithAnswer[0].answer_id,
                resource: vodUrl,
                resource_type: 'BLOB',
                resource_order: 1,
                is_active: 1,
            };
            await Promise.all([
                CourseMysql.updateAnswerVideo(db.mysql.write, cloned.resource_reference, vodUrl.m3u8),
                (updateTime) ? CourseMysql.updateStreamEndTime(db.mysql.write, resourceID) : '',
                CourseMysql.updateQuestionAnswered(db.mysql.write, cloned.resource_reference),
                CourseMysql.updateVodUrl(db.mysql.write, resourceID, JSON.stringify(vodUrl)),
                LiveclassHelper.handleAnswerVideoResource(db, questionWithAnswer[0].answer_id, insertedData, true),
            ]);
            await AnswerRedis.deleteByQuestionIdWithTextSolution(resolvedPromise[0].resource_reference, db.redis.write);
            // check if resource type 8 of same resource reference is created or not
            const recorded = await CourseMysql.getRecordedResource(db.mysql.read, cloned.resource_reference);
            if (recorded.length === 0) {
                const inserted = await CourseMysql.addResource(db.mysql.write, cloned);
                const newResourceID = inserted.insertId;
                const bulkData = [];
                for (let i = 0; i < assortmentData.length; i++) {
                    bulkData.push([
                        assortmentData[i].assortment_id,
                        newResourceID,
                        assortmentData[i].resource_type,
                        assortmentData[i].name,
                        assortmentData[i].schedule_type,
                        assortmentData[i].live_at,
                        assortmentData[i].is_trial,
                        0,
                        0,
                        assortmentData[i].resource_name,
                    ]);
                }
                // add resource mappin
                await CourseMysql.addResourceMapping(db.mysql.write, bulkData);
                if (req.hostname === 'api.doubtnut.com') {
                    sqs.sendMessage({
                        QueueUrl: Data.fermiTencent,
                        MessageBody: JSON.stringify({
                            url: vodUrl.mp4,
                            questionId: cloned.resource_reference,
                        }),
                    }).promise().then((err, result) => {
                        console.log(err, result);
                    });
                    // Utility.sendMessage(sqs, Data.videoLeaveQueueUrl, {
                    //     actionType: 'liveclass_end',
                    //     question_id: cloned.resource_reference,
                    // });
                }
            }
            LiveclassHelper.updateFirebase(cloned.resource_reference, fireBaseInstance);
            if (old) {
                // resource type 8 for old structure
                await CourseHelper.postTasks(db, cloned.resource_reference);
                LiveclassHelper.updateFirebase(resourceID, fireBaseInstance);
            }
            await CourseContainerV2.getLivestreamDetails(db, cloned.resource_reference, true);

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
        // get vod url
    } catch (e) {
        console.log(e);
        next(e);
    }
}
async function deleteCache(req, res, next) {
    try {
        const db = req.app.get('db');
        const resourceID = req.query.resource_id;
        let resourceReference = 0;
        if (old) {
            const result = await CourseMysql.getResourceByID(db.mysql.read, resourceID);
            if (result.length > 0) {
                resourceReference = result[0].resource_reference;
            }
        }
        await AnswerRedis.deleteByQuestionIdWithTextSolution(resourceReference, db.redis.write);
        await CourseContainerV2.getLivestreamDetails(db, resourceReference, true);

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

module.exports = {
    getLeaderBoard,
    getList,
    startByFaculty,
    end,
    getQuizQuestions,
    pushQuizQuestion,
    quizSubmit,
    postQuizDetails,
    status,
    endAppx,
    deleteCache,
};
