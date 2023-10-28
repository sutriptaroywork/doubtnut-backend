/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');
const VodSql = require('../../../modules/mysql/vod');
const PanelHelper = require('../../helpers/panel.helper');
const CourseHelper = require('../../helpers/course');
const CourseMysql = require('../../../modules/mysql/course');
const TestAddAssortment = require('../liveclass_panel/test-add-assortment');
const Question = require('../../../modules/question');
const Answer = require('../../../modules/answer');
// const AnswerMysql = require('../../../modules/mysql/answer');
const LiveclassRedis = require('../../../modules/redis/liveclass');
const VodScheduleHelper = require('./vod_schedule.helper');
const TeacherContainer = require('../../../modules/containers/teacher');
const StudentContainer = require('../../../modules/containers/student');

function responseTemplate(data = 'Success', msg = 'Success', status = 200) {
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

async function list(req, res) {
    const db = req.app.get('db');
    const { facultyId } = req.params;
    const { processed } = req.query;

    const vodScheduleData = await VodSql.getVodScheduleListByFacultyId(db.mysql.read, parseInt(facultyId), parseInt(processed));
    return res.status(200).json(responseTemplate(vodScheduleData));
}

async function listWithQuestionId(req, res) {
    const db = req.app.get('db');
    const { facultyId } = req.params;
    const { processed } = req.query;
    const { questionId } = req.params;

    const vodScheduleData = await VodSql.getVodScheduleListByFacultyIdAndQuestionId(db.mysql.read, parseInt(facultyId), parseInt(processed), parseInt(questionId));
    return res.status(200).json(responseTemplate(vodScheduleData));
}

async function getSubjects(req, res) {
    const db = req.app.get('db');
    const subjectsData = await VodSql.getDistinctSubjectFromVodChapterMapping(db.mysql.read);
    const subjects = _.map(subjectsData, ((subject) => subject.subjects));
    return res.status(200).json(responseTemplate(subjects));
}

async function getClasses(req, res) {
    const db = req.app.get('db');
    const { subject } = req.params;
    const classesData = await VodSql.getDistinctClassesBySubjectFromVodChapterMapping(db.mysql.read, subject);
    const classes = _.map(classesData, ((classData) => classData.classes));
    return res.status(200).json(responseTemplate(classes));
}
async function getStates(req, res) {
    const db = req.app.get('db');
    const { subject, classCode } = req.params;

    const statesData = await VodSql.getDistinctStateBySubjectClassFromVodChapterMapping(db.mysql.read, subject, classCode);
    const states = _.map(statesData, ((state) => state.states));
    return res.status(200).json(responseTemplate(states));
}
async function getLanguages(req, res) {
    const db = req.app.get('db');
    const { subject, classCode, state } = req.params;
    const langaugeData = await VodSql.getDistinctLanguageBySubjectClassStateFromVodChapterMapping(db.mysql.read, subject, classCode, state);
    const languages = _.map(langaugeData, ((language) => language.languages));
    return res.status(200).json(responseTemplate(languages));
}
async function getChapters(req, res) {
    const db = req.app.get('db');
    const {
        subject, classCode, state, language,
    } = req.params;
    const chaptersData = await VodSql.getDistinctChapterBySubjectClassStateLanguageFromVodChapterMapping(db.mysql.read, subject, classCode, state, language);
    const chapters = _.map(chaptersData, ((chapter) => chapter.chapters));
    return res.status(200).json(responseTemplate(chapters));
}

async function updateVodScheduleMeta(req, res) {
    const db = req.app.get('db');
    const {
        subject, class: classCode, state, language, chapter, schedule_id: scheduleId, lecture_no, lecture_type: lectureType,
    } = req.body;
    if (!subject) {
        return res.status(410).json(responseTemplate({}, 'Error Subject Not Found', 410));
    }
    if (!classCode) {
        return res.status(410).json(responseTemplate({}, 'Error classCode Not Found', 410));
    }
    if (!state) {
        return res.status(410).json(responseTemplate({}, 'Error state Not Found', 410));
    }
    if (!language) {
        return res.status(410).json(responseTemplate({}, 'Error language Not Found', 410));
    }
    if (!chapter) {
        return res.status(410).json(responseTemplate({}, 'Error chapter Not Found', 410));
    }
    if (!scheduleId) {
        return res.status(410).json(responseTemplate({}, 'Error scheduleId Not Found', 410));
    }
    if (!lectureType) {
        return res.status(410).json(responseTemplate({}, 'Error lecture type Not Found', 410));
    }
    console.log(lecture_no);
    const updateObject = {
        subject, class: classCode, state, language, master_chapter: chapter, lecture_no, lecture_type: lectureType,
    };
    console.log(updateObject);
    try {
        await VodSql.updateMeta(db.mysql.write, scheduleId, updateObject);
        return res.status(200).json(responseTemplate());
    } catch (error) {
        return res.status(500).json(responseTemplate(error, 'Error Updating .Plz Send ScreenShot to tech team', 500));
    }
}

// async function updateLiveAt(req, res) {
//     const db = req.app.get('db');
//     const { schedule_id: scheduleId, live_at: liveAt };

// }

async function updateMultiStateMeta(req, res) {
    const db = req.app.get('db');
    const {
        state, language, schedule_id,
    } = req.body;

    if (!state) {
        return res.status(410).json(responseTemplate({}, 'Error state Not Found', 410));
    }
    if (!language) {
        return res.status(410).json(responseTemplate({}, 'Error language Not Found', 410));
    }
    if (!schedule_id) {
        return res.status(410).json(responseTemplate({}, 'Error scheduleId Not Found', 410));
    }
    const updateObject = {
        state, language, schedule_id,
    };
    try {
        await VodSql.updateMultiMeta(db.mysql.write, updateObject);
        return res.status(200).json(responseTemplate());
    } catch (error) {
        return res.status(500).json(responseTemplate(error, 'Error Updating .Plz Send ScreenShot to tech team', 500));
    }
}

async function addTopic(req, res) {
    const db = req.app.get('db');
    const {
        topic, visibility_timestamp: visibilityTime, duration, vod_schedule_id: scheduleId,
    } = req.body;
    if (!scheduleId) {
        return res.status(410).json(responseTemplate({}, 'Error scheduleId Not Found', 410));
    }
    if (!topic) {
        return res.status(410).json(responseTemplate({}, 'enter topic', 410));
    }
    if (!visibilityTime) {
        return res.status(410).json(responseTemplate({}, 'Enter Quiz Pop up Time in Video', 410));
    }
    const insertObject = {
        topic, visibility_timestamp: visibilityTime, duration: duration || null, vod_schedule_id: scheduleId,
    };
    try {
        const insertedTopic = await VodSql.insertTopic(db.mysql.write, insertObject);
        return res.status(200).json(responseTemplate(insertedTopic.insertId));
    } catch (error) {
        return res.status(500).json(responseTemplate(error, 'Error Inserting .Plz Send ScreenShot to tech team', 500));
    }
}

async function deleteTopic(req, res) {
    const db = req.app.get('db');
    const { topicMapId } = req.params;
    try {
        await VodSql.deleteTopicById(db.mysql.write, topicMapId);
        return res.status(200).json(responseTemplate());
    } catch (error) {
        return res.status(500).json(responseTemplate(error, 'Error in Deleting .Plz Send ScreenShot to tech team', 500));
    }
}

async function getTopicsByScheduleId(req, res) {
    const db = req.app.get('db');
    const { scheduleId } = req.params;
    const topicData = await VodSql.getTopicsByScheduleId(db.mysql.read, scheduleId);
    return res.status(200).json(responseTemplate(topicData));
}

async function getWidgetsByScheduleId(req, res) {
    const db = req.app.get('db');
    const { scheduleId } = req.params;
    const widgetData = await VodSql.getWidgetsByScheduleId(db.mysql.read, scheduleId);
    return res.status(200).json(responseTemplate(widgetData));
}

async function addWidget(req, res) {
    const db = req.app.get('db');
    const {
        widget_type: widgetType, widget_data: widgetData, widget_meta: widgetMeta, visibility_timestamp: visibilityTime, vod_schedule_id: scheduleId,
    } = req.body;
    if (!scheduleId) {
        return res.status(410).json(responseTemplate({}, 'Error scheduleId Not Found', 410));
    }
    if (!visibilityTime) {
        return res.status(410).json(responseTemplate({}, 'Error visibilityTime Not Found', 410));
    }
    const insertObject = {
        widget_type: widgetType, widget_data: widgetData, widget_meta: widgetMeta, visibility_timestamp: visibilityTime, vod_schedule_id: scheduleId,
    };
    if (widgetType == 'QUIZ') {
        const validatedData = await PanelHelper.checkQuestionsValidity(db.mysql.read, widgetData, widgetMeta);
        console.log(validatedData);
        if (!validatedData.valid) {
            return res.status(410).json(responseTemplate(validatedData.validInfo, validatedData.validInfo, 410));
        }
        const checkSql = 'select count(*) as cnt  from course_resources where resource_reference = ? and resource_type = 7';
        const checkResourceReferencesExist = await db.mysql.write.query(checkSql, [validatedData.questionIds.join('|')]);
        if (checkResourceReferencesExist[0].cnt) {
            return res.status(410).json(responseTemplate('Error resource_reference Already exist ', '', 410));
        }
        const insertedQuiz = await VodSql.addWidget(db.mysql.write, insertObject);
        return res.status(200).json(responseTemplate(insertedQuiz.insertId));
    }
    if (widgetType == 'POLL') {
        // TODO check id Poll Exist
        const insertedPoll = await VodSql.addWidget(db.mysql.write, insertObject);
        console.log(insertedPoll);
        return res.status(200).json(responseTemplate(insertedPoll.insertId));
    }
    if (widgetType == 'BROADCAST') {
        const insertedBroadcast = await VodSql.addWidget(db.mysql.write, insertObject);
        return res.status(200).json(responseTemplate(insertedBroadcast.insertId));
    }
}

async function deleteWidget(req, res) {
    const db = req.app.get('db');
    const { widgetMapId } = req.params;
    try {
        await VodSql.deleteWidget(db.mysql.write, widgetMapId);
        return res.status(200).json(responseTemplate());
    } catch (error) {
        return res.status(500).json(responseTemplate(error, 'Error in Deleting .Plz Send ScreenShot to tech team', 500));
    }
}

async function processClass(req, res, next) {
    try {
        const db = req.app.get('db');
        const { scheduleId } = req.params;

        const status = await LiveclassRedis.getStatusByScheduleIdVOD(db.redis.read, scheduleId);
        const isProcessing = JSON.parse(status);

        if (isProcessing == 2) {
            return res.status(410).json(responseTemplate('Already Processed', '', 410));
        }

        if (isProcessing == 1) {
            return res.status(410).json(responseTemplate('Processing, Please Wait', '', 410));
        }

        const vodScheduleData = await VodSql.getVodDataById(db.mysql.read, scheduleId);
        if (!vodScheduleData.length) {
            return res.status(410).json(responseTemplate('Error Finding un processed class', 'error', 410));
        }

        // if (!vodScheduleData[0].question_id) {
        //     return res.status(410).json(responseTemplate('Error question_id not created ', 'error', 410));
        // }
        if (!moment(vodScheduleData[0].live_at).isValid()) {
            return res.status(410).json(responseTemplate('Error live_at is not valid ', 'error', 410));
        }
        // if (!vodScheduleData[0].is_video_processed) {
        //     return res.status(410).json(responseTemplate('Error video is  not processed ', 'error', 410));
        // }
        if (!vodScheduleData[0].subject || !vodScheduleData[0].class || !vodScheduleData[0].state || !vodScheduleData[0].language || !vodScheduleData[0].master_chapter) {
            return res.status(410).json(responseTemplate('Error Details Not Updated', 'error', 410));
        }

        const stateArray = [vodScheduleData[0].state];
        const languagesArray = [vodScheduleData[0].language];

        const multipleStateLanguageData = await VodSql.getMultipleStateLanguageDataByScheduleId(db.mysql.read, scheduleId);
        console.log(multipleStateLanguageData);
        _.map(multipleStateLanguageData, (stateLanguageData) => {
            stateArray.push(stateLanguageData.state);
            languagesArray.push(stateLanguageData.language);
        });
        // check year_exam
        if (!vodScheduleData[0].year_exam) {
            return res.status(400).json(responseTemplate('Error year_exam does not exist ', 'error', 410));
        }

        const courseIdsData = await VodSql.getCourseIdsByClassMeta(db.mysql.read, vodScheduleData[0].class, vodScheduleData[0].subject, stateArray, languagesArray, vodScheduleData[0].year_exam);

        if (!courseIdsData.length) {
            return res.status(410).json(responseTemplate('Error Cant Find Mapped CourseIds', 'error', 410));
        }
        if (!vodScheduleData[0].question_id) {
            if (!vodScheduleData[0].parent_qid) {
                return res.status(410).json(responseTemplate('Error question_id not created ', 'error', 410));
            }
            const {
                success, generatedQid, msg,
            } = await VodScheduleHelper.generateQidandWidgets(db, vodScheduleData[0], vodScheduleData[0].parent_qid);

            if (!success) {
                return res.status(410).json(responseTemplate(msg, 'error', 410));
            }
            vodScheduleData[0].question_id = generatedQid;
        }

        if (vodScheduleData[0].is_reused) {
            const sql = 'select id from vod_schedule where question_id = ? and is_processed =1 limit 1';
            const data = await db.mysql.read.query(sql, [vodScheduleData[0].question_id]);
            vodScheduleData[0].reused_scheduled_id = data[0].id;
        }

        const courseTopicData = await VodSql.getTopicByScheduleId(db.mysql.read, vodScheduleData[0].is_reused ? vodScheduleData[0].reused_scheduled_id : scheduleId);

        if (!courseTopicData.length) {
            return res.status(410).json(responseTemplate('Error Cant Topic Data ', 'error', 410));
        }
        const topicArray = [];
        const topicMetaArray = [];
        _.map(courseTopicData, (courseTopic) => {
            topicArray.push(courseTopic.topic);
            topicMetaArray.push(courseTopic.visibility_timestamp);
        });

        vodScheduleData[0].description = _.join(topicArray, '|');
        vodScheduleData[0].meta_info = _.join(topicMetaArray, '|');

        const widgetData = await VodSql.getWidgetDataByScheduleId(db.mysql.write, scheduleId);
        const widgetDataGrouped = _.groupBy(widgetData, 'widget_type');
        console.log(widgetDataGrouped);
        const detailsIds = [];

        // const vodScheduleNotesAndHW = await VodSql.getVodNotesByScheduleId(db.mysql.read, scheduleId);
        // const notesAndHWDataGrouped = _.groupBy(vodScheduleNotesAndHW, 'meta_info');

        // set status - processing
        await LiveclassRedis.setStatusByScheduleIdVOD(db.redis.write, scheduleId, 1);
        await VodSql.updateIsProessedByScheduleId(db.mysql.write, scheduleId, 2);

        let parentLCRes = [];
        let parentLCResHW = [];

        if (vodScheduleData[0].parent_qid) {
            parentLCRes = await VodSql.getLiveclassResRef(db.mysql.read, vodScheduleData[0].parent_qid);
            parentLCResHW = await VodSql.getLiveclassResRefHW(db.mysql.read, vodScheduleData[0].parent_qid);
        }

        const avoidHWCopy = [1373, 1374];
        for (let i = 0; i < courseIdsData.length; i++) {
            const courseId = courseIdsData[i].course_id;
            vodScheduleData[0].liveclass_course_id = courseId;
            let lectureID = 'L1';

            if (vodScheduleData[0].lecture_no == null || vodScheduleData[0].lecture_no > 500) {
                const alreadyScheduled = await CourseMysql.getPreviousClassesOfUpcomingClass(db.mysql.read, vodScheduleData[0]);
                lectureID = `L${alreadyScheduled ? alreadyScheduled.length + 1 : 1}`;
            } else {
                lectureID = `L${vodScheduleData[0].lecture_no}`;
            }
            // set lecture type
            // vodScheduleData[0].lecture_type = lectureType || null;
            // inserted lecture type here
            const courseDetailEntry = await CourseMysql.insertUpcomingClassIntoCourseDetails(db.mysql.write, vodScheduleData[0], lectureID);
            const detailID = courseDetailEntry.insertId;
            console.log(detailID);
            detailsIds.push(detailID);
            const faculty = await TeacherContainer.checkTeacherIsInternal(db, parseInt(vodScheduleData[0].faculty_id));

            // inserted lecture type here
            await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, vodScheduleData[0], faculty[0], vodScheduleData[0].question_id, 1, vodScheduleData[0].meta_info);
            if (widgetDataGrouped.QUIZ) {
                const QuizData = widgetDataGrouped.QUIZ;
                for (let j = 0; j < QuizData.length; j++) {
                    const quiz = QuizData[j];
                    await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, vodScheduleData[0], faculty[0], quiz.widget_data, 7, quiz.widget_meta);
                }
            }
            // insert remaining resource if parent_qid
            if (parentLCRes.length) {
                const tempVodData = { ...vodScheduleData[0] };
                // eslint-disable-next-line no-await-in-loop
                await Promise.all(parentLCRes.map(async (eachRes) => {
                    tempVodData.description = eachRes.topic;
                    await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, tempVodData, faculty[0], eachRes.resource_reference, eachRes.resource_type, eachRes.meta_info);
                }));
            }
            if (!avoidHWCopy.includes(courseId) && parentLCResHW.length) {
                const tempVodData = { ...vodScheduleData[0] };
                // eslint-disable-next-line no-await-in-loop
                await Promise.all(parentLCResHW.map(async (eachRes) => {
                    tempVodData.description = eachRes.topic;
                    await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, tempVodData, faculty[0], eachRes.resource_reference, eachRes.resource_type, eachRes.meta_info);
                    const liveclassHWRes = {
                        liveclass_detail_id: detailID,
                        hw_type: eachRes.hw_type,
                        question_list: eachRes.question_list,
                        location: eachRes.location,
                        hw_status: 31,
                        new_location: eachRes.new_location,
                        metainfo: eachRes.hw_metainfo,
                        question_id: vodScheduleData[0].question_id,
                        batch_id: vodScheduleData[0].batch_id,
                    };
                    await VodSql.insertLiveclassResRefHW(db.mysql.write, liveclassHWRes);
                }));
            }
            // this is for notes and HW - WIP
            // if (vodScheduleNotesAndHW.length > 0) {
            //     if (notesAndHWDataGrouped.NOTES) {
            //         const notesData = notesAndHWDataGrouped.NOTES;
            //         for (let j = 0; j < notesData.length; j++) {
            //             const eachNotes = notesData[j];
            //             // console.log(eachNotes);
            //             // await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, vodScheduleData[0], faculty[0], eachNotes.pdf_url, 7, eachNotes.meta_info);
            //         }
            //     }
            //     if (notesAndHWDataGrouped.HOMEWORK) {
            //         const homeworkData = notesAndHWDataGrouped.HOMEWORK;
            //         for (let j = 0; j < homeworkData.length; j++) {
            //             const eachHW = homeworkData[j];
            //             // console.log(eachHW);
            //             // await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, vodScheduleData[0], faculty[0], eachHW.pdf_url, 7, eachHW.meta_info);
            //         }
            //     }
            // }
            await TestAddAssortment.main(db, true, detailID);
        }
        const newTableData = await VodSql.getCourseResourceByOldDetailId(db.mysql.read, detailsIds);
        const publishInsertData = [];
        const groupedNewData = _.groupBy(newTableData, 'resource_type');
        _.map(groupedNewData[1], (classCourseData) => {
            if (widgetDataGrouped.POLL) {
                widgetDataGrouped.POLL.forEach((poll) => {
                    const pollInsertData = [classCourseData.id, 'POLL', poll.widget_data, moment(vodScheduleData[0].live_at).add(poll.visibility_timestamp, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
                    ];

                    publishInsertData.push(pollInsertData);
                });
            }
            if (widgetDataGrouped.BROADCAST) {
                widgetDataGrouped.BROADCAST.forEach((poll) => {
                    const pollInsertData = [classCourseData.id, 'BROADCAST', poll.widget_data, moment(vodScheduleData[0].live_at).add(poll.visibility_timestamp, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
                    ];
                    publishInsertData.push(pollInsertData);
                });
            }
        });
        if (publishInsertData.length) {
            const sql = 'insert into liveclass_publish (detail_id, type, info, created_at) values ?';
            await db.mysql.write.query(sql, [publishInsertData]);
        }

        const quizInsertsData = [];
        const quizDataGrouped = _.groupBy(widgetDataGrouped.QUIZ, 'widget_data');
        _.map(groupedNewData[7], (classQuizData) => {
            const quizInsertData = [vodScheduleData[0].question_id, classQuizData.id, moment(vodScheduleData[0].live_at).add(quizDataGrouped[classQuizData.resource_reference][0].visibility_timestamp, 'seconds').format('YYYY-MM-DD HH:mm:ss')];
            quizInsertsData.push(quizInsertData);
        });
        if (quizInsertsData.length) {
            const sql1 = 'insert into liveclass_quiz_logs (resource_id, quiz_resource_id, created_at) values ?';
            await db.mysql.write.query(sql1, [quizInsertsData]);
        }
        await VodSql.updateIsProessedByScheduleId(db.mysql.write, scheduleId, vodScheduleData[0].is_reused ? 4 : 1);

        // set status - processed
        await LiveclassRedis.setStatusByScheduleIdVOD(db.redis.write, scheduleId, 2);
        return res.status(200).json(responseTemplate());

        // Create Widgets
    } catch (error) {
        console.log(error);
        next(error);
    }

    // get ScheduleData
    // check  validity
    // get multiple_state data
    // get course_ids
    // get question_id
    // populate it in liveclass
    // run script
}

async function processAllVodsClass(req, res, next) {
    try {
        const db = req.app.get('db');

        const vodBulkProcess = await VodSql.getAllVods(db.mysql.read);
        for (let index = 0; index < vodBulkProcess.length; index++) {
            const vodScheduleData = [vodBulkProcess[index]];
            const scheduleId = vodScheduleData[0].id;
            if (!vodScheduleData.length) {
                return res.status(410).json(responseTemplate('Error Finding un processed class', 'error', 410));
            }

            // if (!vodScheduleData[0].question_id) {
            //     return res.status(410).json(responseTemplate('Error question_id not created ', 'error', 410));
            // }
            if (!moment(vodScheduleData[0].live_at).isValid()) {
                return res.status(410).json(responseTemplate('Error live_at is not valid ', 'error', 410));
            }
            // if (!vodScheduleData[0].is_video_processed) {
            //     return res.status(410).json(responseTemplate('Error video is  not processed ', 'error', 410));
            // }
            if (!vodScheduleData[0].subject || !vodScheduleData[0].class || !vodScheduleData[0].state || !vodScheduleData[0].language || !vodScheduleData[0].master_chapter) {
                return res.status(410).json(responseTemplate('Error Details Not Updated', 'error', 410));
            }

            const stateArray = [vodScheduleData[0].state];
            const languagesArray = [vodScheduleData[0].language];

            const multipleStateLanguageData = await VodSql.getMultipleStateLanguageDataByScheduleId(db.mysql.read, scheduleId);
            console.log(multipleStateLanguageData);
            _.map(multipleStateLanguageData, (stateLanguageData) => {
                stateArray.push(stateLanguageData.state);
                languagesArray.push(stateLanguageData.language);
            });

            const courseIdsData = await VodSql.getCourseIdsByClassMeta(db.mysql.read, vodScheduleData[0].class, vodScheduleData[0].subject, stateArray, languagesArray, vodScheduleData[0].year_exam);

            if (!courseIdsData.length) {
                return res.status(410).json(responseTemplate('Error Cant Find Mapped CourseIds', 'error', 410));
            }

            if (!vodScheduleData[0].question_id) {
                if (!vodScheduleData[0].parent_qid) {
                    return res.status(410).json(responseTemplate('Error question_id not created ', 'error', 410));
                }
                const {
                    success, generatedQid, msg,
                } = await VodScheduleHelper.generateQidandWidgets(db, vodScheduleData[0], vodScheduleData[0].parent_qid);
                if (!success) {
                    return res.status(410).json(responseTemplate(msg, 'error', 410));
                }
                vodScheduleData[0].question_id = generatedQid;
            }

            if (vodScheduleData[0].is_reused) {
                const sql = 'select id from vod_schedule where question_id = ? and is_processed =1 limit 1';
                const data = await db.mysql.read.query(sql, [vodScheduleData[0].question_id]);
                vodScheduleData[0].reused_scheduled_id = data[0].id;
            }

            const courseTopicData = await VodSql.getTopicByScheduleId(db.mysql.read, vodScheduleData[0].is_reused ? vodScheduleData[0].reused_scheduled_id : scheduleId);

            if (!courseTopicData.length) {
                return res.status(410).json(responseTemplate('Error Cant Topic Data ', 'error', 410));
            }
            const topicArray = [];
            const topicMetaArray = [];
            _.map(courseTopicData, (courseTopic) => {
                topicArray.push(courseTopic.topic);
                topicMetaArray.push(courseTopic.visibility_timestamp);
            });

            vodScheduleData[0].description = _.join(topicArray, '|');
            vodScheduleData[0].meta_info = _.join(topicMetaArray, '|');

            const widgetData = await VodSql.getWidgetDataByScheduleId(db.mysql.write, scheduleId);
            const widgetDataGrouped = _.groupBy(widgetData, 'widget_type');
            console.log(widgetDataGrouped);
            const detailsIds = [];

            await VodSql.updateIsProessedByScheduleId(db.mysql.write, scheduleId, 2);
            for (let i = 0; i < courseIdsData.length; i++) {
                const courseId = courseIdsData[i].course_id;
                vodScheduleData[0].liveclass_course_id = courseId;
                let lectureID = 'L1';

                if (vodScheduleData[0].lecture_no == null || vodScheduleData[0].lecture_no > 500) {
                    const alreadyScheduled = await CourseMysql.getPreviousClassesOfUpcomingClass(db.mysql.read, vodScheduleData[0]);
                    lectureID = `L${alreadyScheduled ? alreadyScheduled.length + 1 : 1}`;
                } else {
                    lectureID = `L${vodScheduleData[0].lecture_no}`;
                }
                const courseDetailEntry = await CourseMysql.insertUpcomingClassIntoCourseDetails(db.mysql.write, vodScheduleData[0], lectureID);
                const detailID = courseDetailEntry.insertId;
                console.log(detailID);
                detailsIds.push(detailID);
                const faculty = await TeacherContainer.checkTeacherIsInternal(db, parseInt(vodScheduleData[0].faculty_id));
                await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, vodScheduleData[0], faculty[0], vodScheduleData[0].question_id, 1, vodScheduleData[0].meta_info);
                if (widgetDataGrouped.QUIZ) {
                    const QuizData = widgetDataGrouped.QUIZ;
                    for (let j = 0; j < QuizData.length; j++) {
                        const quiz = QuizData[j];
                        await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, vodScheduleData[0], faculty[0], quiz.widget_data, 7, quiz.widget_meta);
                    }
                }

                await TestAddAssortment.main(db, true, detailID);
            }
            const newTableData = await VodSql.getCourseResourceByOldDetailId(db.mysql.read, detailsIds);
            const publishInsertData = [];
            const groupedNewData = _.groupBy(newTableData, 'resource_type');
            _.map(groupedNewData[1], (classCourseData) => {
                if (widgetDataGrouped.POLL) {
                    widgetDataGrouped.POLL.forEach((poll) => {
                        const pollInsertData = [classCourseData.id, 'POLL', poll.widget_data, moment(vodScheduleData[0].live_at).add(poll.visibility_timestamp, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
                        ];

                        publishInsertData.push(pollInsertData);
                    });
                }
                if (widgetDataGrouped.BROADCAST) {
                    widgetDataGrouped.BROADCAST.forEach((poll) => {
                        const pollInsertData = [classCourseData.id, 'BROADCAST', poll.widget_data, moment(vodScheduleData[0].live_at).add(poll.visibility_timestamp, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
                        ];
                        publishInsertData.push(pollInsertData);
                    });
                }
            });
            if (publishInsertData.length) {
                const sql = 'insert into liveclass_publish (detail_id, type, info, created_at) values ?';
                await db.mysql.write.query(sql, [publishInsertData]);
            }

            const quizInsertsData = [];
            const quizDataGrouped = _.groupBy(widgetDataGrouped.QUIZ, 'widget_data');
            _.map(groupedNewData[7], (classQuizData) => {
                const quizInsertData = [vodScheduleData[0].question_id, classQuizData.id, moment(vodScheduleData[0].live_at).add(quizDataGrouped[classQuizData.resource_reference][0].visibility_timestamp, 'seconds').format('YYYY-MM-DD HH:mm:ss')];
                quizInsertsData.push(quizInsertData);
            });
            if (quizInsertsData.length) {
                const sql1 = 'insert into liveclass_quiz_logs (resource_id, quiz_resource_id, created_at) values ?';
                await db.mysql.write.query(sql1, [quizInsertsData]);
            }
            await VodSql.updateIsProessedByScheduleId(db.mysql.write, scheduleId, vodScheduleData[0].is_reused ? 4 : 1);
        }

        return res.status(200).json(responseTemplate());

        // Create Widgets
    } catch (error) {
        console.log(error);
        next(error);
    }
}
async function generateQid(req, res, next) {
    try {
        const { vod_id: vodID } = req.params;
        const db = req.app.get('db');
        const vodScheduleDetails = await VodSql.getVodSchedule(db.mysql.read, vodID);
        // console.log(vodScheduleDetails)
        if (_.isNull(vodScheduleDetails[0].question_id) || (vodScheduleDetails[0].question_id !== 0) || vodScheduleDetails[0].question_id === '' || !vodScheduleDetails[0].year_exam) {
            const responseData = {
                meta: {
                    code: 500,
                    success: true,
                    message: 'Question id already created',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        const chapterData = await VodSql.getChapterIdandOrderByMasterChapter(db.mysql.read, vodScheduleDetails[0].class, vodScheduleDetails[0].subject, vodScheduleDetails[0].state, vodScheduleDetails[0].language, vodScheduleDetails[0].master_chapter);
        const stateArray = [vodScheduleDetails[0].state];
        const languagesArray = [vodScheduleDetails[0].language];
        const courseIdsData = await VodSql.getCourseIdsByClassMeta(db.mysql.read, vodScheduleDetails[0].class, vodScheduleDetails[0].subject, stateArray, languagesArray, vodScheduleDetails[0].year_exam);
        vodScheduleDetails[0].liveclass_course_id = courseIdsData[0].course_id;
        const alreadyScheduled = await CourseMysql.getPreviousClassesOfUpcomingClass(db.mysql.read, vodScheduleDetails[0]);
        const lectureID = `${alreadyScheduled ? alreadyScheduled.length + 1 : 1}`;
        const subjectIdData = await VodSql.getSubjectIdFromClassAndSubject(db.mysql.read, vodScheduleDetails[0].class, vodScheduleDetails[0].subject);
        if (!subjectIdData.length || !courseIdsData.length || !chapterData.length) {
            return res.status(410).json(responseTemplate({}, 'Error All  Details Not Filled ', 410));
        }
        const courseTopicData = await VodSql.getTopicByScheduleId(db.mysql.read, vodID);
        if (!courseTopicData.length) {
            return res.status(410).json(responseTemplate('Error Cant Find Topic Data ', 'error', 410));
        }
        const topicArray = [];
        _.map(courseTopicData, (courseTopic) => {
            topicArray.push(courseTopic.topic);
        });

        vodScheduleDetails[0].description = _.join(topicArray, '|');

        const doubt = `VOD_${vodScheduleDetails[0].class}_${vodScheduleDetails[0].language.substr(0, 3)}_${vodScheduleDetails[0].state}_${(`00${subjectIdData[0].subject_order}`).slice(-3)}_${subjectIdData[0].id}_${(`0000${chapterData[0].chapter_order}`).slice(-4)}_${chapterData[0].id}_${(`00${lectureID}`).slice(-3)}`;

        // create question, answer, answer_video_resource
        const question = {};
        const vodSid = -142;
        question.student_id = vodSid;
        question.class = vodScheduleDetails[0].class;
        question.subject = vodScheduleDetails[0].subject;
        question.question = vodScheduleDetails[0].description;
        question.ocr_text = vodScheduleDetails[0].description;
        question.original_ocr_text = vodScheduleDetails[0].description;
        question.book = 'DN_VOD';
        question.chapter = vodScheduleDetails[0].master_chapter;
        question.is_answered = 0;
        question.doubt = doubt;
        const questionResult = await Question.addQuestion(question, db.mysql.write);
        const questionID = questionResult.insertId;
        // create answer
        const answer = {};
        answer.expert_id = vodSid;
        answer.question_id = questionID;
        answer.answer_video = `${doubt}.mp4`;
        answer.youtube_id = doubt;
        // generate answer
        const answerResult = await Answer.addSearchedAnswer(answer, db.mysql.write);
        const answerID = answerResult.insertId;
        // const answerVideoResource = {
        //     answer_id: answerID,
        //     resource: `vod-${vodID}.mp4`,
        //     resource_type: 'BLOB',
        //     resource_order: 1,
        //     is_active: 1,
        // };
        // const answerVideoResourceResult = await AnswerMysql.addAnswerVideoResource(db.mysql.write, answerVideoResource);
        // update question id vod schedule
        await VodSql.updateMeta(db.mysql.write, vodID, { question_id: questionID });
        // return res.status(200).json({
        //     question_id: questionID,
        //     answer_id: answerID,
        // });
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {
                question_id: questionID,
                answer_id: answerID,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

async function liveClassMeta(req, res) {
    const db = req.app.get('db');
    const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
    let studentLocale = req.user.locale;
    if (studentLocale !== 'hi') {
        studentLocale = 'en';
    }
    if (versionCode < 915) {
        studentLocale = 'en';
    }
    let enableSmiley = false;
    const flagrResp = await CourseHelper.getFlagrResponseByFlagKey(xAuthToken, ['enable_smiley']);
    if (_.get(flagrResp, 'enable_smiley.payload.enabled') || flagrResp === null) {
        enableSmiley = true;
    }

    let feedbackData = await VodSql.getFeedback(db.mysql.read, studentLocale, versionCode);
    const pinnedPost = await VodSql.getFromDNProperty(db.mysql.read, 'live_class', 'pinned_post');
    let commentInfo; let
        doubtInfo;
    if (studentLocale == 'hi') {
        commentInfo = await VodSql.getFromDNProperty(db.mysql.read, 'live_class', 'pre_vod_comment_list_hi');
        doubtInfo = await VodSql.getFromDNProperty(db.mysql.read, 'live_class', 'pre_vod_doubt_list_hi');
    } else {
        commentInfo = await VodSql.getFromDNProperty(db.mysql.read, 'live_class', 'pre_vod_comment_list');
        doubtInfo = await VodSql.getFromDNProperty(db.mysql.read, 'live_class', 'pre_vod_doubt_list');
    }

    feedbackData.forEach((feedback) => {
        feedback.options = _.split(feedback.options, '#!#');
        feedback.options_show_textbox = _.split(feedback.options_show_textbox, '#!#');
        feedback.optionsMeta = _.map(feedback.options, (option, index) => ({ option, show_textbox: feedback.options_show_textbox[index] }));
        if (feedback.text_cue) {
            const textCues = _.split(feedback.text_cue, '#!#');
            const textCue = studentLocale === 'hi' ? textCues[1] || textCues[0] : textCues[0];
            feedback.text_cue = textCue;
        }
        return feedback;
    });

    if (versionCode >= 915) {
        const feedbackDataGrouped = _.groupBy(feedbackData, 'groupby_key');
        const feedbackET = [];
        for (const key in feedbackDataGrouped) {
            if (feedbackDataGrouped[key]) {
                feedbackET.push({
                    rating: feedbackDataGrouped[key],
                    min: key.split('-')[0],
                    max: key.split('-')[1],
                });
            }
        }
        feedbackET.sort((item1, item2) => item1.min - item2.min);
        feedbackData = feedbackET;
    }

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {
            pinned_post: pinnedPost[0].value, pre_comments: commentInfo[0].value.split('###'), pre_doubts: doubtInfo[0].value.split('###'), rating_data: feedbackData, enable_smiley: enableSmiley,
        },
    };
    return res.status(responseData.meta.code).json(responseData);
}

const getSignedUrlS3 = async (req, bucket_name, key) => {
    const s3 = req.app.get('s3');

    const signedUrlExpireSeconds = 60 * 60;

    const params = {
        Bucket: bucket_name,
        Key: key,
        Expires: signedUrlExpireSeconds,
    };

    return new Promise((resolve, reject) => {
        s3.getSignedUrl('getObject', params, (err, url) => {
            if (err) {
                reject(err);
            }
            resolve(url);
        });
    });
};
async function getSignedUrl(req, res, next) {
    try {
        const s3 = req.app.get('s3');
        const signedUrlExpireSeconds = 60 * 60;
        const { content_type, file_name } = req.query;
        const { student_id } = req.user;
        const { role } = req.query;

        const file_ext = content_type.split('/')[1];

        const timestamp = moment().unix();
        let tfile_name = '';
        if (!file_name) {
            tfile_name = '';
        } else {
            tfile_name = file_name.replace(`.${file_ext}`, '');
        }
        tfile_name = tfile_name.replace(/\s/g, '');

        const fileName = `${tfile_name}_${student_id}_${timestamp}.${file_ext}`;

        let myBucket = '';
        if (role == 'FACULTY') {
            myBucket = 'dn-vod-faculty';
        } else if (role == 'EDITOR') {
            myBucket = 'dn-vod-editor';
        }

        const s3Location = `s3://${myBucket}/${fileName}`;

        s3.getSignedUrl('putObject', {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: 'public-read',
            ContentType: content_type,
        }, (err, url) => {
            if (err) {
                next(err);
            } else {
                const data = {
                    url,
                    file_name: fileName,
                    s3Location,
                    // ask this
                    // full_image_url: `${req.app.get('config').cdn_url}images/${fileName}`,
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
            }
        });
    } catch (error) {
        next(error);
    }
}

async function getVodVideo(req, res) {
    const db = req.app.get('db');

    const { scheduleId } = req.params;
    const vodVideo = await VodSql.getVodVideoByScheduleId(db.mysql.read, scheduleId);

    const data = vodVideo[0];
    if (data) {
        if (data.faculty_url) {
            const facultyKey = data.faculty_url.split('/')[3];
            const signedFacultyUrl = await getSignedUrlS3(req, 'dn-vod-faculty', facultyKey);
            data.faculty_url = signedFacultyUrl;
        }
        if (data.editor_url) {
            const editorKey = data.editor_url.split('/')[3];
            const signedEditorUrl = await getSignedUrlS3(req, 'dn-vod-editor', editorKey);
            data.editor_url = signedEditorUrl;
        }
    }
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data,
    };
    return res.status(responseData.meta.code).json(responseData);
}
async function updateVodUrl(req, res) {
    const db = req.app.get('db');

    const { scheduleId } = req.params;
    const {
        url, role, student_id, studio_no,
    } = req.body;

    const insertObject = { vod_schedule_id: scheduleId };

    const vodVideo = await VodSql.getVodVideoByScheduleId(db.mysql.read, scheduleId);

    console.log('g', studio_no);
    if (role === 'FACULTY') {
        insertObject.faculty_url = url;
    } else if (role === 'EDITOR') {
        insertObject.editor_url = url;
        insertObject.edited_by = student_id;
        insertObject.studio_no = studio_no;
    }

    if (vodVideo.length > 0) {
        try {
            const updatedVodVideo = await VodSql.updateVodVideo(db.mysql.write, scheduleId, insertObject);
            // console.log("update", updatedVodVideo)
            return res.status(200).json(responseTemplate(updatedVodVideo.insertId));
        } catch (error) {
            return res.status(500).json(responseTemplate(error, 'Error Inserting .Plz Send ScreenShot to tech team', 500));
        }
    } else {
        try {
            const insertedVodVideo = await VodSql.insertVodVideo(db.mysql.write, insertObject);
            // console.log("insert", insertedVodVideo)
            return res.status(200).json(responseTemplate(insertedVodVideo.insertId));
        } catch (error) {
            return res.status(500).json(responseTemplate(error, 'Error Inserting .Plz Send ScreenShot to tech team', 500));
        }
    }
}
async function qualifyVodVideo(req, res) {
    const db = req.app.get('db');
    const s3 = req.app.get('s3');

    const { scheduleId } = req.params;
    const { qid, role, student_id } = req.body;

    console.log(student_id);
    if (role === 'QA') {
        const insertObject = { vod_schedule_id: scheduleId };

        const vodVideo = await VodSql.getVodVideoByScheduleId(db.mysql.read, scheduleId);

        insertObject.is_qualified = 1;

        const file = vodVideo[0].editor_url.split('/')[3];
        const key = `${qid}.mp4`;
        if (vodVideo.length > 0) {
            try {
                const params = {
                    Bucket: 'dn-vod-qa', /* Another bucket working fine */
                    CopySource: `dn-vod-editor/${file}`, /* required */
                    Key: key, /* required */
                    ACL: 'public-read',
                };
                s3.copyObject(params, async (err, data) => {
                    if (err) {
                        console.log(err, err); // an error occurred
                        return res.status(500).json(responseTemplate(err, 'Error Inserting .Plz Send ScreenShot to tech team', 500));
                    }

                    console.log(data); // successful response
                    const updatedVodVideo = await VodSql.updateVodVideo(db.mysql.write, scheduleId, insertObject);
                    return res.status(200).json(responseTemplate(updatedVodVideo.insertId));
                });
            } catch (error) {
                return res.status(500).json(responseTemplate(error, 'Error Inserting .Plz Send ScreenShot to tech team', 500));
            }
        } else {
            return res.status(500).json(responseTemplate('No Video Yet.', 'Error Inserting .Plz Send ScreenShot to tech team', 500));
        }
    } else {
        return res.status(500).json(responseTemplate('Sign in as QA.', 'Error Inserting .Plz Send ScreenShot to tech team', 500));
    }
}
async function markAsQa(req, res) {
    try {
        const db = req.app.get('db');
        const comment = req.body;
        const { student_id } = req.body;

        if (student_id) {
            // const sql = 'select * from students where student_id = ?';
            // const student = await db.mysql.read.query(sql, [student_id]);
            const student = await StudentContainer.getById(student_id, db);

            if (student.length > 0) {
                comment.class = student[0].student_class;
            }
        }

        await db.mongo.write.collection('QA_leads').insertOne(comment);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: true,
                message: 'Already marked as QA lead',
            },
        };
        return res.status(responseData.meta.code);
    }
}

async function markAsStudentFeedback(req, res) {
    try {
        const db = req.app.get('db');
        const feedback = req.body;
        const { student_id } = req.body;

        if (student_id) {
            // const sql = 'select * from students where student_id = ?';
            // const student = await db.mysql.read.query(sql, [student_id]);
            const student = await StudentContainer.getById(student_id, db);

            if (student.length > 0) {
                feedback.class = student[0].student_class;
            }
        }

        feedback.commentId = feedback._id;
        delete feedback._id;
        await db.mongo.write.collection('StudentFeedback').insertOne(feedback);

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: {},
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        const responseData = {
            meta: {
                code: 500,
                success: true,
                message: 'Already marked as Feedback',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function getNotesByScheduleId(req, res) {
    const db = req.app.get('db');
    const { scheduleId } = req.params;

    const data = await VodSql.getVodNotesByScheduleId(db.mysql.read, scheduleId);

    return res.status(200).json(responseTemplate(data));
}

async function getPdfUploadSignedUrl(req, res) {
    try {
        const s3 = req.app.get('s3');
        const signedUrlExpireSeconds = 60 * 60;
        const { content_type, file_name } = req.query;

        const file_ext = content_type.split('/')[1];

        const timestamp = moment().unix();
        const tfile_name = file_name.replace(`.${file_ext}`, '');

        const fileName = `${tfile_name}_${timestamp}.${file_ext}`;

        const myBucket = 'doubtnut-static/pdf_open';

        s3.getSignedUrl('putObject', {
            Bucket: myBucket,
            Key: fileName,
            Expires: signedUrlExpireSeconds,
            ACL: 'public-read',
            ContentType: content_type,
        }, (err, url) => {
            if (err) {
                return res.status(500).json(responseTemplate('Something Went Wrong', 'Failure', 500));
            }
            const data = {
                url,
                file_name: fileName,
                full_pdf_url: `${req.app.get('config').cdn_url}pdf_open/${fileName}`,
            };
            return res.status(200).json(responseTemplate(data));
        });
    } catch (error) {
        return res.status(500).json(responseTemplate('Something Went Wrong', 'Failure', 500));
    }
}

async function addNotesByQid(req, res) {
    try {
        // const db = req.app.get('db');

        // const { scheduleId } = req.params;
        // const { qids, meta } = req.body;

        // Todo: convert qids to pdf,

        // const insertObject = {
        //     vod_schedule_id: scheduleId,
        //     question_list: qids,
        //     // pdf_url: pdf_url,
        //     meta_info: meta
        // };

        // await VodSql.insertVodNotes(db.mysql.write, insertObject);
        return res.status(200).json(responseTemplate());
    } catch (e) {
        return res.status(500).json(responseTemplate('Something Went Wrong', 'Failure', 500));
    }
}

async function addNotesByPdf(req, res) {
    try {
        const db = req.app.get('db');
        const { scheduleId } = req.params;
        const { pdf_url, meta } = req.body;
        const insertObject = {
            vod_schedule_id: scheduleId,
            pdf_url,
            meta_info: meta,
        };

        await VodSql.insertVodNotes(db.mysql.write, insertObject);
        return res.status(200).json(responseTemplate());
    } catch (e) {
        return res.status(500).json(responseTemplate('Something Went Wrong', 'Failure', 500));
    }
}

async function getLectureTypes(req, res) {
    const db = req.app.get('db');

    try {
        const bucketName = 'vod_panel';
        const propertyName = 'lecture_type';

        const [distinctLectureTypesDNProp] = await VodSql.getFromDNProperty(db.mysql.read, bucketName, propertyName);
        const distinctLectureTypes = distinctLectureTypesDNProp.value.split('###');

        return res.status(200).json(responseTemplate(distinctLectureTypes));
    } catch (e) {
        console.log(e);
        return res.status(500).json(responseTemplate('Something Went Wrong', 'Failure', 500));
    }
}
module.exports = {
    list, getSubjects, getClasses, getStates, getLanguages, getChapters, updateVodScheduleMeta, addTopic, deleteTopic, getTopicsByScheduleId, addWidget, deleteWidget, generateQid, updateMultiStateMeta, getWidgetsByScheduleId, processClass, liveClassMeta, listWithQuestionId, processAllVodsClass, markAsQa, markAsStudentFeedback, getVodVideo, getSignedUrl, updateVodUrl, qualifyVodVideo, getNotesByScheduleId, getPdfUploadSignedUrl, addNotesByQid, addNotesByPdf, getLectureTypes,
};
