/* eslint-disable no-unused-vars */
// eslint-disable-next-line import/no-extraneous-dependencies
/* eslint-disable no-await-in-loop */
/* eslint-disable array-callback-return */

// const Liveclass = require('../../../modules/mysql/liveclass');
const _ = require('lodash');
const moment = require('moment');
const fs = require('fs');
const csv = require('fast-csv');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const CourseMysql = require('../../../modules/mysql/course');
const LiveclassMysql = require('../../../modules/mysql/liveclass');
const LiveclassRedis = require('../../../modules/redis/liveclass');
const AnswerMysql = require('../../../modules/mysql/answer');
const TestAddAssortment = require('./test-add-assortment');
const AssortmentPackageGeneration = require('./assortment_package_generation');
const AnswerRedis = require('../../../modules/redis/answer');
const CourseMysql2 = require('../../../modules/mysql/coursev2');
const PanelHelper = require('../../helpers/panel.helper');
const VodSql = require('../../../modules/mysql/vod');
const CourseContainer = require('../../../modules/containers/course');
const kafka = require('../../../config/kafka');
const AnswerContainer = require('../../../modules/containers/answer');
const Answer_Container = require('../../v13/answer/answer.container');
const TeacherContainer = require('../../../modules/containers/teacher');

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

async function getScheduledClasses(req, res) {
    db = req.app.get('db');
    const facultyId = req.params.faculty_id;
    const classData = await CourseMysql.getScheduledClassesByFacultyId(db.mysql.read, facultyId);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: classData,
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function addQuiz(req, res) {
    db = req.app.get('db');
    // eslint-disable-next-line camelcase
    const { course_resource_id } = req.params;
    // eslint-disable-next-line camelcase
    const { question_ids, meta_info } = req.body;
    const validatedData = await PanelHelper.checkQuestionsValidity(db.mysql.read, question_ids, meta_info);
    const checkSql = 'select count(*) as cnt  from course_resources where resource_reference = ? and resource_type = 7';
    const checkResourceReferencesExist = await db.mysql.write.query(checkSql, [validatedData.questionIds.join('|')]);
    if (checkResourceReferencesExist[0].cnt) {
        return res.status(401).json(responseTemplate('Error resource_reference Already exist ', '', 401));
    }
    console.log(validatedData);
    let responseData;
    if (validatedData.valid) {
        // eslint-disable-next-line camelcase
        const course_data = await CourseMysql.getCourseResourceById(db.mysql.read, course_resource_id);
        const oldCourseData = await CourseMysql.getOldCourseResourceById(db.mysql.read, course_data[0].old_resource_id);
        const oldCourseDataCopy = oldCourseData[0];
        delete oldCourseDataCopy.id;
        oldCourseDataCopy.resource_type = 7;
        oldCourseDataCopy.resource_reference = validatedData.questionIds.join('|');
        oldCourseDataCopy.meta_info = validatedData.metaInfo.join('|');
        const insertOldResource = await CourseMysql.insertOldCourseResource(db.mysql.write, oldCourseDataCopy);
        // eslint-disable-next-line camelcase
        const course_data_copy = course_data[0];
        delete course_data_copy.id;
        course_data_copy.resource_type = 7;
        course_data_copy.resource_reference = validatedData.questionIds.join('|');
        course_data_copy.meta_info = validatedData.metaInfo.join('|');
        course_data_copy.old_resource_id = insertOldResource.insertId;
        course_data_copy.old_detail_id = oldCourseData[0].liveclass_course_detail_id;
        course_data_copy.created_by = 'Teacher Panel';
        // eslint-disable-next-line camelcase
        const course_resource_mapping = await CourseMysql.getCourseResourceMappingByCourseResourceId(db.mysql.read, course_resource_id);
        // eslint-disable-next-line camelcase
        const insert_course_resource = await CourseMysql.insertCourseResource(db.mysql.write, course_data_copy);
        const newCourseResourceMappingData = [];
        for (let i = 0; i < course_resource_mapping.length; i++) {
            // eslint-disable-next-line camelcase
            const resource_mapping = course_resource_mapping[i];
            delete resource_mapping.id;
            resource_mapping.course_resource_id = insert_course_resource.insertId;
            resource_mapping.old_resource_id = insertOldResource.insertId;
            resource_mapping.is_trial = oldCourseData[0].liveclass_course_detail_id;
            newCourseResourceMappingData.push(resource_mapping);
        }
        await CourseMysql.insertCourseResourceMapping(db.mysql.write, newCourseResourceMappingData);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: 'Quiz Added',
        };
    } else {
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: validatedData.validInfo,
            },
        };
    }
    return res.status(responseData.meta.code).json(responseData);
    // console.log(course_data_copy);
}
async function updateQuestion(req, res) {
    db = req.app.get('db');
    // eslint-disable-next-line camelcase
    const { course_resource_id } = req.params;
    // eslint-disable-next-line camelcase
    const { question_ids, meta_info } = req.body;
    const validatedData = await PanelHelper.checkQuestionsValidity(db.mysql.read, question_ids, meta_info);
    const checkSql = 'select count(*) as cnt  from course_resources where resource_reference = ? and resource_type = 7';
    const checkResourceReferencesExist = await db.mysql.write.query(checkSql, [validatedData.questionIds.join('|')]);
    if (checkResourceReferencesExist[0].cnt) {
        return res.status(401).json(responseTemplate('Error resource_reference Already exist ', '', 401));
    }
    let responseData;
    if (validatedData.valid) {
        // eslint-disable-next-line camelcase
        const course_data = await CourseMysql.getCourseResourceById(db.mysql.read, course_resource_id);
        await CourseMysql.updateQuizResourceReference(db.mysql.write, course_resource_id, validatedData.questionIds.join('|'), validatedData.metaInfo.join('|'));
        await CourseMysql.updateOldQuizResourceReference(db.mysql.write, course_data[0].old_resource_id, validatedData.questionIds.join('|'), validatedData.metaInfo.join('|'));
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: 'Quiz Updated',
        };
    } else {
        responseData = {
            meta: {
                code: 200,
                success: false,
                message: validatedData.validInfo,
            },
            data: 'Quiz Updated',
        };
    }

    return res.status(responseData.meta.code).json(responseData);
}
async function updateMeta(req, res) {
    db = req.app.get('db');
    // eslint-disable-next-line camelcase
    const { course_resource_id } = req.params;
    const { name, display, description } = req.body;
    await CourseMysql.updateLiveClassCourseResourceMeta(db.mysql.write, course_resource_id, name, description, display);
    await CourseMysql.updateOldClassCourseResourceMeta(db.mysql.write, course_resource_id, name);
    await CourseMysql.updateOcrTextByResourceID(db.mysql.write, course_resource_id, name);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Class Meta Updated',
    };
    return res.status(responseData.meta.code).json(responseData);
}
async function testAddAssortment(req, res) {
    db = req.app.get('db');
    await TestAddAssortment.main(db);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Script successfully completed',
    };
    return res.status(responseData.meta.code).json(responseData);
}
async function assortmentPackageGeneration(req, res) {
    db = req.app.get('db');
    await AssortmentPackageGeneration.main(db);
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Script successfully completed',
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function reschedule(req, res) {
    db = req.app.get('db');
    const { detail_id, reschedule_time } = req.body;

    // Validate TimeStamp

    // Change TIme in live class course detail
    const sql1 = 'update liveclass_course_details set live_at = ?  where id = ? ';
    await db.mysql.write.query(sql1, [reschedule_time, detail_id]);
    const sql2 = 'update course_resource_mapping set live_at = ?  where course_resource_id = (select id  from course_resources where resource_reference = (select resource_reference  from liveclass_course_resources where liveclass_course_detail_id = ? and resource_type = 4 ) and resource_type = 4) and resource_type ="resource"';
    await db.mysql.write.query(sql2, [reschedule_time, detail_id]);

    const sql3 = 'select * from  liveclass_course_resources where liveclass_course_detail_id = ? and resource_type=4';
    const liveclassData = await db.mysql.read.query(sql3, [detail_id]);
    // const questionDataSql = 'select * from questions where question_id = ?';
    // const questionData = await db.mysql.read.query(questionDataSql, [liveclassData[0].resource_reference]);
    //
    // let doubt = _.split(questionData[0].doubt, '_');
    // const datePart = moment(reschedule_time).format('YYYYMMDD');
    // const hrPart = moment(reschedule_time).format('HH');
    // doubt[doubt.length - 1] = hrPart;
    // doubt[doubt.length - 2] = datePart;
    // doubt = _.join(doubt, '_');
    // console.log(doubt);
    // const updateQuestionSql = 'update questions set doubt = ? where question_id = ?';
    // const updateQuestionData = await db.mysql.write.query(updateQuestionSql, [doubt, liveclassData[0].resource_reference]);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Time Updated ',
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function chapterChange(req, res) {
    db = req.app.get('db');
    const { detail_id, chapter_name } = req.body;

    const sql1 = 'select * from liveclass_course_resources where liveclass_course_detail_id = ? and resource_type IN (1,8)';
    const checkIfClassIsOver = await db.mysql.read.query(sql1, [detail_id]);
    if (checkIfClassIsOver.length) {
        return res.status(401).json(responseTemplate('ERROR', 'Class is Over  ', 401));
    }

    const sql2 = 'select distinct(assortment_id) from course_resource_mapping where course_resource_id IN (select id from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1 )) and resource_type = "resource"';
    let assignmentIds = await db.mysql.read.query(sql2, [detail_id]);
    console.log(assignmentIds);

    if (assignmentIds.length) {
        assignmentIds = assignmentIds.map((assignmentId) => assignmentId.assortment_id);
        const sql13 = 'insert into course_details_bk1 select * from course_details where assortment_id IN (?)';
        const bck1 = await db.mysql.write.query(sql13, [assignmentIds]);
        const sql3 = 'delete from course_details where assortment_id IN (?)';
        const deleteCourseDetail = await db.mysql.write.query(sql3, [assignmentIds]);

        const sql14 = 'insert into package_bk select * from package where assortment_id IN (?)';
        const bck2 = await db.mysql.write.query(sql14, [assignmentIds]);
        const sql4 = 'delete from package where assortment_id IN (?)';
        const deletePackage = await db.mysql.write.query(sql4, [assignmentIds]);

        const sql15 = 'insert into course_resource_mapping_bk1  select * from course_resource_mapping where course_resource_id in (?) and resource_type = "assortment"';
        const bck3 = await db.mysql.write.query(sql15, [assignmentIds]);
        const sql5 = 'delete from course_resource_mapping where course_resource_id in (?) and resource_type = "assortment"';
        const deleteAssortments = await db.mysql.write.query(sql5, [assignmentIds]);
    }

    const sql16 = 'insert into course_resource_mapping_bk1  select *  from course_resource_mapping where course_resource_id IN (select id from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1 )) and resource_type = "resource"';
    const bck4 = await db.mysql.write.query(sql16, [detail_id]);
    const sql6 = 'delete from course_resource_mapping where course_resource_id IN (select id from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1 )) and resource_type = "resource"';
    const deleteAssortmentResources = await db.mysql.write.query(sql6, [detail_id]);

    const sql17 = 'insert into course_resources_bk1 select *  from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1 and is_resource_created = 1)';
    const bck5 = await db.mysql.write.query(sql17, [detail_id]);

    const sql7 = 'delete from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1  and is_resource_created = 1)';
    const resourceDelete = await db.mysql.write.query(sql7, [detail_id]);

    const sql8 = 'update liveclass_course_resources set is_processed = 0 where liveclass_course_detail_id = ?';
    const updateIsProessed = await db.mysql.write.query(sql8, [detail_id]);

    const sql9 = 'select * from liveclass_course_details where id = ?';
    const liveclassDetails = await db.mysql.read.query(sql9, [detail_id]);

    const sql10 = 'update  liveclass_course_details set  master_chapter = ? where id = ?';
    const updateChapter = await db.mysql.write.query(sql10, [chapter_name, detail_id]);

    const sql11 = 'select * from liveclass_course_details where subject = ? and liveclass_course_id = ?  and master_chapter = ? limit 1';
    const getNewDetailToBindWithType2 = await db.mysql.write.query(sql11, [liveclassDetails[0].subject, liveclassDetails[0].liveclass_course_id, liveclassDetails[0].master_chapter]);
    if (getNewDetailToBindWithType2.length) {
        const sql12 = 'update liveclass_course_resources set liveclass_course_detail_id = ? where liveclass_course_detail_id = ? and resource_type = 2';
        const updateResourceType2 = await db.mysql.write.query(sql12, [getNewDetailToBindWithType2[0].id, detail_id]);
        console.log('sql12');
        // return res.status(401).json(responseTemplate('ERROR', 'Resource type 2 Orphan Cant find  detailid to link with  ', 401));
    }
    console.log('sql12');

    await TestAddAssortment.main(db);
    await AssortmentPackageGeneration.main(db);

    // update liveclass_course_detail master chapter
    // mark  is_processed  = 0 in liveclass_course_resource
    // delete  course_resources where old_detail_id = detail_id
    // delete all assortment_id deleted by above delete  also  as course_detail_id
    // run resource_add script
    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Chapter  Updated ',
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function deleteDetailId(req, res, next) {
    db = req.app.get('db');
    const { detail_id } = req.body;

    const sqlbk1 = 'insert into liveclass_course_details_bk select *  from  liveclass_course_details where id = ? ';
    const bk1 = await db.mysql.write.query(sqlbk1, [detail_id]);

    const sql1 = 'delete from  liveclass_course_details where id = ? ';
    const deleteLiveClassDetails = await db.mysql.write.query(sql1, [detail_id]);

    const sql2 = 'select distinct(assortment_id) from course_resource_mapping where course_resource_id IN (select id from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1 )) and resource_type = "resource" and is_trial = ?';
    let assignmentIds = await db.mysql.read.query(sql2, [detail_id, detail_id]);
    console.log(assignmentIds);

    if (assignmentIds.length) {
        assignmentIds = assignmentIds.map((assignmentId) => assignmentId.assortment_id);
        const sql13 = 'insert into course_details_bk1 select * from course_details where assortment_id IN (?)';
        const bck1 = await db.mysql.write.query(sql13, [assignmentIds]);
        const sql3 = 'delete from course_details where assortment_id IN (?)';
        const deleteCourseDetail = await db.mysql.write.query(sql3, [assignmentIds]);

        const sql14 = 'insert into package_bk select * from package where assortment_id IN (?)';
        const bck2 = await db.mysql.write.query(sql14, [assignmentIds]);
        const sql4 = 'delete from package where assortment_id IN (?)';
        const deletePackage = await db.mysql.write.query(sql4, [assignmentIds]);

        const sql15 = 'insert into course_resource_mapping_bk1  select * from course_resource_mapping where course_resource_id in (?) and resource_type = "assortment"';
        const bck3 = await db.mysql.write.query(sql15, [assignmentIds]);
        const sql5 = 'delete from course_resource_mapping where course_resource_id in (?) and resource_type = "assortment"';
        const deleteAssortments = await db.mysql.write.query(sql5, [assignmentIds]);
    }

    const sql16 = 'insert into course_resource_mapping_bk1  select *  from course_resource_mapping where course_resource_id IN (select id from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1 )) and resource_type = "resource" and is_trial = ?';
    const bck4 = await db.mysql.write.query(sql16, [detail_id, detail_id]);
    const sql6 = 'delete from course_resource_mapping where course_resource_id IN (select id from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1  )) and resource_type = "resource" and is_trial = ?';
    const deleteAssortmentResources = await db.mysql.write.query(sql6, [detail_id, detail_id]);

    // const sql17 = 'insert into course_resources_bk1 select *  from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1  and is_resource_created = 1)';
    // const bck5 = await db.mysql.write.query(sql17, [detail_id]);

    // const sql7 = 'delete from course_resources where resource_reference IN (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed = 1  and is_resource_created = 1)';
    // const resourceDelete = await db.mysql.write.query(sql7, [detail_id]);

    const sql18 = 'insert into liveclass_course_resources_bk  select *  from  liveclass_course_resources where liveclass_course_detail_id = ?';
    const bck6 = await db.mysql.write.query(sql18, [detail_id]);

    const sql5 = 'delete from  liveclass_course_resources where liveclass_course_detail_id = ?';
    const deleteLiveClassResources = await db.mysql.write.query(sql5, [detail_id]);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Deleted  ',
    };
    return res.status(responseData.meta.code).json(responseData);
    // package  ???
    // delete form live class detail
    // delete from course resource mapping
    // package delete
}

async function updateYoutube(req, res, next) {
    db = req.app.get('db');
    const { detail_id, youtube_id } = req.body;
    // await AnswerRedis.deleteAnswerVideoResource(db.redis.write, detail_id);
    // process.exit();

    const liveClassResourceSql = 'select * from liveclass_course_resources where liveclass_course_detail_id =? and resource_type IN (1,8)';
    const liveClassResource = await db.mysql.write.query(liveClassResourceSql, [detail_id]);

    if (!(liveClassResource.length === 1)) {
        return res.status(200).json(responseTemplate('Success', 'dint find resource or multiple resources as 1 , 8'), 200);
    }
    const { resource_type, player_type } = liveClassResource[0];
    let sql = '';
    if (player_type === 'youtube') {
        sql = 'select answer_id from answers where question_id = (select meta_info from liveclass_course_resources where liveclass_course_detail_id = ? and  resource_type=?) ';
    } else {
        sql = 'select answer_id from answers where question_id = (select resource_reference from liveclass_course_resources where liveclass_course_detail_id = ? and  resource_type=?) ';
    }

    const answerId = await db.mysql.write.query(sql, [detail_id, resource_type]);
    if (!answerId.length) {
        return res.status(200).json(responseTemplate('Success', 'No Answer Id Found .Already You Tube Id updated if manually updated in old tables endpoint wont work'), 200);
    }
    console.log(answerId);
    const answerResourceData = {
        answer_id: answerId[0].answer_id,
        resource: youtube_id,
        resource_type: 'YOUTUBE',
        resource_order: 1,
        vdo_cipher_id: null,
        is_active: 1,
    };
    const sql1 = 'update answer_video_resources set resource_order = resource_order+1 where answer_id = ? order by resource_order desc';
    const incrRowInActive = await db.mysql.write.query(sql1, [answerId[0].answer_id]);

    const sql2 = 'update answers set youtube_id = ? where answer_id = ?';
    const MarkinAnswer = await db.mysql.write.query(sql2, [youtube_id, answerId[0].answer_id]);

    const sql3 = 'update answer_video_resources set is_active = 0 where answer_id = ? and  resource_type = "YOUTUBE"';
    const markRowInActive = await db.mysql.write.query(sql3, [answerId[0].answer_id]);
    const sql4 = ' insert into answer_video_resources set ?';
    const insertNewRow = await db.mysql.write.query(sql4, [answerResourceData]);
    // Order Of Queries Matters
    let sql6 = '';
    if (player_type === 'youtube') {
        sql6 = 'update course_resources set resource_type = 1 ,player_type = "youtube",resource_reference = ? where resource_reference = (select resource_reference  from liveclass_course_resources where liveclass_course_detail_id = ? and resource_type=?)  and resource_type=?';
    } else {
        sql6 = 'update course_resources set meta_info = resource_reference, resource_type = 1 ,player_type = "youtube",resource_reference = ? where resource_reference = (select resource_reference  from liveclass_course_resources where liveclass_course_detail_id = ? and resource_type=?)  and resource_type=?';
    }

    const updateClassResourceTable = await db.mysql.write.query(sql6, [youtube_id, detail_id, resource_type, resource_type]);
    let sql5 = '';
    if (player_type === 'youtube') {
        sql5 = 'update liveclass_course_resources set resource_type = 1 ,player_type = "youtube",resource_reference = ? where liveclass_course_detail_id = ? and resource_type=?';
    } else {
        sql5 = 'update liveclass_course_resources set meta_info = resource_reference, resource_type = 1 ,player_type = "youtube",resource_reference = ? where liveclass_course_detail_id = ? and resource_type=?';
    }

    const updateLiveClassResourceTable = await db.mysql.write.query(sql5, [youtube_id, detail_id, resource_type]);
    await AnswerRedis.deleteAnswerVideoResource(db.redis.write, answerId[0].answer_id);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'Youtube Id  Updated ',
    };
    return res.status(responseData.meta.code).json(responseData);
}

async function updateFacultyId(req, res) {
    db = req.app.get('db');
    const { detail_id, faculty_id } = req.body;
    let responseData = {};
    const sql1 = 'select * from  dashboard_users where id = ?';
    const facultyData = await db.mysql.write.query(sql1, [faculty_id]);
    if (facultyData.length) {
        const sql2 = 'update liveclass_course_details set faculty_id = ? where id = ?';
        const updateLiveClassDetails = await db.mysql.write.query(sql2, [faculty_id, detail_id]);
        const sql3 = 'update liveclass_course_resources set expert_name = ? , expert_image = ? where liveclass_course_detail_id = ?';
        const updateLiveClassResourceTable = await db.mysql.write.query(sql3, [facultyData[0].name, facultyData[0].image_bg_liveclass, detail_id]);
        const sql4 = 'update course_resources set expert_name = ? , expert_image = ?,faculty_id=? where resource_reference  IN (select resource_reference  from liveclass_course_resources where liveclass_course_detail_id = ? )';
        const updateClassResourceTable = await db.mysql.write.query(sql4, [facultyData[0].name, facultyData[0].image_bg_liveclass, faculty_id, detail_id]);
        const sql5 = 'update liveclass_detail_faculty_mapping set faculty_id = ? where detail_id = ?';
        const updateFacultyMapping = await db.mysql.write.query(sql5, [faculty_id, detail_id]);
        const sql6 = 'update liveclass_stream set faculty_id = ? where detail_id = ?';
        const updateStream = await db.mysql.write.query(sql6, [faculty_id, detail_id]);
        const sql7 = 'select * from  liveclass_course_resources where liveclass_course_detail_id = ? and resource_type=4';
        const liveclassData = await db.mysql.read.query(sql7, [detail_id]);
        // const questionDataSql = 'select * from questions where question_id = ?';
        // const questionData = await db.mysql.read.query(questionDataSql, [liveclassData[0].resource_reference]);
        // let doubt = _.split(questionData[0].doubt, '_');
        // doubt[doubt.length - 3] = faculty_id;
        // doubt = _.join(doubt, '_');
        // const updateQuestionSql = 'update questions set doubt = ? where question_id = ?';
        // const updateQuestionData = await db.mysql.write.query(updateQuestionSql, [doubt, liveclassData[0].resource_reference]);

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: 'faculty Id  Updated ',
        };
    } else {
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: 'faculty Id  Not Found ',
        };
    }

    return res.status(responseData.meta.code).json(responseData);
}
async function getUpcomingClasses(req, res) {
    let responseData = {};
    try {
        db = req.app.get('db');
        const facultyId = req.params.faculty_id;
        const classData = await CourseMysql.getUpcomingScheduleByFacultyID(db.mysql.read, facultyId);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: classData,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getMasterChaptersByCourseAndSubject(req, res) {
    let responseData = {};
    try {
        db = req.app.get('db');
        const { courseID } = req.params;
        const { subject } = req.query;
        const pageNumber = req.query.page ? parseInt(req.query.page) - 1 : 0;
        // console.log(courseID,subject,pageNumber)
        const chapters = await CourseMysql.getMasterChaptersByCourseAndSubject(db.mysql.read, courseID, subject, pageNumber);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: chapters,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function updateCourseId(req, res, next) {
    db = req.app.get('db');
    const { detail_id, course_id } = req.body;

    const sql1 = 'update liveclass_course_details set liveclass_course_id = ? where id = ? ';
    const updateLiveClassDetails = await db.mysql.write.query(sql1, [course_id, detail_id]);

    const sql2 = ' delete from  course_resources where old_detail_id = ?';
    const deleteCourseResourse = await db.mysql.write.query(sql2, [detail_id]);

    const sql8 = 'select assortment_id from course_resource_mapping where is_trial = ?';
    let assignmentIds = await db.mysql.read.query(sql8, [detail_id]);

    if (assignmentIds.length) {
        assignmentIds = assignmentIds.map((assignmentId) => assignmentId.assortment_id);

        const sql6 = 'delete from course_details where assortment_id IN (?)';
        const deleteCourseDetail = await db.mysql.write.query(sql6, [assignmentIds]);

        const sql7 = 'delete from package where assortment_id IN (?)';
        const deletePackage = await db.mysql.write.query(sql7, [assignmentIds]);

        const sql3 = 'delete from course_resource_mapping where course_resource_id in (?)';
        const deleteAssortments = await db.mysql.write.query(sql3, [assignmentIds]);
    }

    const sql4 = 'delete from course_resource_mapping where is_trial = ?';
    const deleteAssortmentResources = await db.mysql.write.query(sql4, [detail_id]);

    const sql5 = 'update liveclass_course_resources set is_processed = 0,liveclass_course_id = ? where liveclass_course_detail_id = ?';
    const updateIsProessed = await db.mysql.write.query(sql5, [course_id, detail_id]);

    await TestAddAssortment.main(db);
    await AssortmentPackageGeneration.main(db);

    const responseData = {
        meta: {
            code: 200,
            success: true,
            message: 'Success',
        },
        data: 'course  Updated ',
    };
    return res.status(responseData.meta.code).json(responseData);
}
// delete a resource

// youtube_id

async function updateUpcomingMeta(req, res) {
    /*
    META IMPLIES
    1. Description
    2. Master Chapter
    3. Lecture ID
    */
    let responseData = {};
    try {
        db = req.app.get('db');
        const { id } = req.params;
        const {
            description, masterChapter, lectureID, batchID, lecture_type: lectureType,
        } = req.body;

        const delimetedDescription = description.replace(/#!#/g, '|');
        await CourseMysql.updateUpcomingMeta(db.mysql.write, id, delimetedDescription, masterChapter, lectureID, lectureType);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Updated Successfully',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function generateResource(req, res, next) {
    db = req.app.get('db');
    const { courseScheduleId } = req.params;

    // create detail id
    // create resources
    // create stream
    // create faculty mapping
}

async function generateNotes(req, res, next) {
    // create detail id
    // create resources
}

async function processUpcomingClass(req, res, next) {
    /*
    ! STEPS:
    * GET faculty ID and Course ID
    * GET DATA FROM course_schedule with liveclass_course_id === courseID and faculty_id === facultyID
    * CHECK If a class with same master Chapter and course_id exists. IF yes, increment lecture number by 1 else set to 1
    * Insert the upcoming class into liveclass_course_details to schedule it
    * USE the id field of liveclass_course_details table as DETAIL ID
    * INSERT into faculty mapping
    * INSERT into stream mapping
    * GET FACULTY DETAILS
    * INS
    * INSERT DATA INTO liveclass_course_resources
    * UPDATE course_schedule to set PROCESSING COLUMN
    */
    let responseData = {};
    db = req.app.get('db');
    try {
        const detailsIds = [];

        const { courseScheduleId } = req.params;
        console.log(courseScheduleId);
        // Get Course Schedule Data
        const status = await LiveclassRedis.getStatusByScheduleIdLC(db.redis.read, courseScheduleId);
        const isProcessing = JSON.parse(status);
        if (isProcessing == 2) {
            return res.status(410).json(responseTemplate('Already Processed', '', 410));
        }

        if (isProcessing == 1) {
            return res.status(410).json(responseTemplate('Processing, Please Wait', '', 410));
        }

        const courseScheduleData = await CourseMysql.getUpcomingClassDetails(db.mysql.write, courseScheduleId);
        console.log(courseScheduleData);
        if (!courseScheduleData[0].master_chapter || !courseScheduleData[0].lecture_id) {
            return res.status(410).json(responseTemplate('master chapter is empty ', '', 410));
        }
        const courseData = await CourseMysql.getLiveClassCourseDataById(db.mysql.read, courseScheduleData[0].liveclass_course_id);
        if (!courseData.length && !courseScheduleData.length) {
            return res.status(410).json(responseTemplate('did nt find resources ', '', 410));
        }
        if (!(/L\d+$/.test(courseScheduleData[0].lecture_id))) {
            return res.status(410).json(responseTemplate('Lecture In Not in LNumber Format example L12', '', 410));
        }
        if (!courseScheduleData[0].lecture_type) {
            return res.status(410).json(responseTemplate('Lecture Type Missing', '', 410));
        }

        // set status - processing
        await LiveclassRedis.setStatusByScheduleIdLC(db.redis.write, courseScheduleId, 1);
        const subjectIdData = await VodSql.getSubjectIdFromClassAndSubject(db.mysql.read, courseScheduleData[0].class, courseScheduleData[0].subject);
        const chapterData = await VodSql.getChapterDataForSchedleClass(db.mysql.read, courseScheduleData[0].liveclass_course_id, courseScheduleData[0].subject, courseScheduleData[0].master_chapter);

        console.log(chapterData);
        const doubt = `LC_${courseScheduleData[0].liveclass_course_id}_${courseData[0].locale.substr(0, 3)}_${(`00${subjectIdData[0].subject_order}`).slice(-3)}_${subjectIdData[0].id}_${(`0000${chapterData[0].chapter_order}`).slice(-4)}_${chapterData[0].id}_${(`00${courseScheduleData[0].lecture_id.replace('L', '')}`).slice(-3)}`;

        const insertQuestionSql = `insert into questions values ( NULL, -55, '${courseData[0].class}', '${courseScheduleData[0].subject}', 'LIVE CLASS', ?, '${courseScheduleData[0].description}',' ${doubt}', 'NONE', 0, 0, NULL, 0, 0, 1, '${courseScheduleData[0].description}','${courseScheduleData[0].description}', NULL, 0, CURRENT_TIMESTAMP, 0, 0, NULL, NULL, NULL, 'en', NULL, 0, NULL, 0,CURRENT_TIMESTAMP)`;

        const insertQuestion = await db.mysql.write.query(insertQuestionSql, [courseScheduleData[0].master_chapter]);
        const questionId = insertQuestion.insertId;

        const insertAnswerSql = `insert into answers values (NULL, -55, ${questionId}, concat('${doubt}', '.mp4'), 1, 1, '', CURRENT_TIMESTAMP, '${doubt}', NULL, NULL, NULL, 1, 1, NULL, 1, '16:9', CURRENT_TIMESTAMP,NULL,0, CURRENT_TIMESTAMP)`;
        await db.mysql.write.query(insertAnswerSql);
        const courseIdsArray = [courseScheduleData[0].liveclass_course_id];
        if (courseScheduleData[0].is_multi && courseScheduleData[0].shared_course_ids) {
            courseScheduleData[0].shared_course_ids.split(',').map((course_id) => {
                if (course_id != courseScheduleData[0].liveclass_course_id) {
                    courseIdsArray.push(parseInt(course_id));
                }
            });
        }
        const lectureID = courseScheduleData[0].lecture_id;
        console.log('LECTUREID', lectureID);
        courseScheduleData[0].description = courseScheduleData[0].description.replace(/#!#/g, '|');

        for (let i = 0; i < courseIdsArray.length; i++) {
            const courseId = courseIdsArray[i];
            courseScheduleData[0].liveclass_course_id = courseId;
            const courseDetailEntry = await CourseMysql.insertUpcomingClassIntoCourseDetails(db.mysql.write, courseScheduleData[0], lectureID);
            const detailID = courseDetailEntry.insertId;
            console.log(detailID);
            detailsIds.push(detailID);
            CourseMysql.insertFacultyMapping(db.mysql.write, detailID, parseInt(courseScheduleData[0].faculty_id));
            CourseMysql.insertStreamMapping(db.mysql.write, detailID, parseInt(courseScheduleData[0].faculty_id));
            const faculty = await TeacherContainer.checkTeacherIsInternal(db, parseInt(courseScheduleData[0].faculty_id));
            await CourseMysql.insertUpcomingClassIntoCourseResources(db.mysql.write, detailID, courseScheduleData[0], faculty[0], questionId);
            await TestAddAssortment.main(db, true, detailID);
        }
        await CourseMysql.updateUpcomingWithScheduled(db.mysql.write, courseScheduleId, detailsIds[0]);

        // set status - processed
        await LiveclassRedis.setStatusByScheduleIdLC(db.redis.write, courseScheduleId, 2);
        // Create Question
        // Create Answer
        const detailIdsString = detailsIds.join(',');
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Updated Successfully',
            },
            data: { detailIdsString },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getAllMasterChapters(req, res) {
    let responseData = {};
    try {
        db = req.app.get('db');
        const pageNumber = req.query.page ? parseInt(req.query.page) - 1 : 0;
        // console.log(pageNumber)
        const chapters = await CourseMysql.getAllMasterChaptersMapping(db.mysql.read, pageNumber);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: chapters,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function addNotesMeta(req, res) {
    let responseData = {};
    try {
        db = req.app.get('db');
        const { chapterID } = req.params;
        const { notes } = req.body;
        await CourseMysql.updateNotesMeta(db.mysql.write, chapterID, notes);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Updated Successfully',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function processNotes(req, res, next) {
    db = req.app.get('db');
    const { masterChapterMappingId } = req.params;
    console.log(masterChapterMappingId);
    const sql1 = 'select * from master_chapter_mapping where id = ?';
    const masterChapterData = await db.mysql.write.query(sql1, [masterChapterMappingId]);
    console.log(masterChapterData);
    const noteMeta = masterChapterData[0].notes_meta.split('#!#');
    console.log(noteMeta);
    if (noteMeta.length % 2) {
        return res.status(401).json(responseTemplate('Error', 'Meta Info has Incomplete Pair ', 401));
    }
    const NotesNameArray = [];
    const NotesLocationArray = [];
    for (let i = 0; i < noteMeta.length; i++) {
        if (!noteMeta[i]) {
            return res.status(401).json(responseTemplate('Error', 'Empty Set  ', 401));
        }
        if (i % 2) {
            NotesLocationArray.push(noteMeta[i]);
        } else {
            NotesNameArray.push(noteMeta[i]);
        }
    }
    let NotesResourceIds = [];
    if (masterChapterData[0].notes_resource_ids) {
        NotesResourceIds = masterChapterData[0].notes_resource_ids.split('#!#');
    }
    console.log(NotesResourceIds);
    if (NotesNameArray.length === NotesResourceIds.length) {
        return res.status(200).json(responseTemplate('Success', 'No New Pair Added ', 200));
    }
    const sql2 = 'select * from liveclass_course_details where  liveclass_course_id = ? and subject = ? and master_chapter = ?';
    const courseDetailData = await db.mysql.read.query(sql2, [masterChapterData[0].course_id, masterChapterData[0].subject, masterChapterData[0].chapter]);
    if (!courseDetailData.length) {
        return res.status(200).json(responseTemplate('Error', 'No Class Is Found To Attach notes', 410));
    }
    const sql3 = 'select * from liveclass_course_resources where liveclass_course_detail_id = ?';
    const courseResourceData = await db.mysql.read.query(sql3, courseDetailData[0].id);
    const NotesResourcesArray = [];
    for (let i = NotesResourceIds.length; i < NotesNameArray.length; i++) {
        console.log(i);
        const NotesName = NotesNameArray[i];
        const NotesLocation = NotesLocationArray[i];
        const resourceData = { ...courseResourceData[0] };
        delete resourceData.id;
        delete resourceData.title;
        resourceData.resource_reference = NotesLocation;
        resourceData.topic = `${NotesName} - ${masterChapterData[0].chapter}`;
        resourceData.resource_type = 2;
        resourceData.player_type = 'video';
        resourceData.meta_info = NotesName;
        resourceData.is_processed = 0;
        resourceData.is_resource_created = 0;
        const sql4 = 'INSERT INTO liveclass_course_resources SET ?';
        const resourceInserts = await db.mysql.write.query(sql4, resourceData);
        NotesResourcesArray.push(resourceInserts.insertId);
    }

    console.log(NotesResourcesArray);
    const NotesResourcesString = NotesResourcesArray.join('#!#');
    console.log(NotesResourcesString);
    const sql5 = 'update master_chapter_mapping set notes_resource_ids = ? where id = ? ';
    await db.mysql.write.query(sql5, [NotesResourcesString, masterChapterMappingId]);
    await TestAddAssortment.main(db, true, courseDetailData[0].id);
    return res.status(200).json(responseTemplate('Success', 'New Pair Added ', 200));
}

async function checkUploads(s3, day, srcBucket, destPrefix, dt = false) {
    const datePrefix = day.toISOString().split('T')[0].replace(/-/g, '/');
    const srcObjects = await s3.listObjectsV2({
        Bucket: srcBucket,
        Prefix: datePrefix,
        MaxKeys: 5000,
    }).promise();
    const srcFiles = srcObjects.Contents.map((x) => x.Key.split('/').slice(-1)[0]).filter(Boolean);

    const destObjects = await s3.listObjectsV2({
        Bucket: 'doubtnutteststreamin-hosting-mobilehub-1961518253',
        Prefix: dt ? `${destPrefix}/LC/${datePrefix}` : `${destPrefix}/LC`,
        MaxKeys: 5000,
    }).promise();
    const destFiles = destObjects.Contents.filter((x) => x.Key.endsWith('audio.mp4')).map((x) => `${x.Key.split('/').slice(-2)[0]}.mp4`).filter(Boolean);

    const missingFiles = srcFiles.filter((x) => !destFiles.includes(x));
    return { uploaded: srcFiles.length, corrupt: missingFiles.length };
}

function getResourcesAvailability(resources, missingArr) {
    let primary;
    const availability = {
        YOUTUBE: { available: false, count: 0, ids: [] },
        TN_VOD: { available: false, count: 0, ids: [] },
        TN_TRANSCODED: { available: false, count: 0, ids: [] },
        STUDIO_TRANSCODED: { available: false, count: 0, ids: [] },
        YT_TRANSCODED: { available: false, count: 0, ids: [] },
        BLOB: { available: false, count: 0, ids: [] },
    };
    for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        if (!resource.resource) {
            missingArr.push(resource.question_id || resource.answer_id);
            continue;
        }
        if (resource.resource.startsWith('http')) {
            availability.TN_VOD.available = true;
            availability.TN_VOD.count++;
            availability.TN_VOD.ids.push(resource.answer_resource_id || resource.id);
            if (!primary && resource.is_active) {
                primary = 'TN_VOD';
            }
        } else if (resource.resource.startsWith('DN')) {
            availability.STUDIO_TRANSCODED.available = true;
            availability.STUDIO_TRANSCODED.count += 0.5;
            availability.STUDIO_TRANSCODED.ids.push(resource.answer_resource_id || resource.id);
            if (!primary && resource.is_active) {
                primary = 'STUDIO_TRANSCODED';
            }
        } else if (resource.resource.startsWith('TN')) {
            availability.TN_TRANSCODED.available = true;
            availability.TN_TRANSCODED.count += 0.5;
            availability.TN_TRANSCODED.ids.push(resource.answer_resource_id || resource.id);
            if (!primary && resource.is_active) {
                primary = 'TN_TRANSCODED';
            }
        } else if (resource.resource.startsWith('YN')) {
            availability.YT_TRANSCODED.available = true;
            availability.YT_TRANSCODED.count += 0.5;
            availability.YT_TRANSCODED.ids.push(resource.answer_resource_id || resource.id);
            if (!primary && resource.is_active) {
                primary = 'YT_TRANSCODED';
            }
        } else if (resource.resource.length === 11) {
            availability.YOUTUBE.available = true;
            availability.YOUTUBE.count++;
            availability.YOUTUBE.ids.push(resource.answer_resource_id || resource.id);
            if (!primary && resource.is_active) {
                primary = 'YOUTUBE';
            }
        } else if (resource.resource.endsWith('mp4')) {
            availability.BLOB.available = true;
            availability.BLOB.count++;
            availability.BLOB.ids.push(resource.answer_resource_id || resource.id);
            if (!primary && resource.is_active) {
                primary = 'BLOB';
            }
        }
    }
    return { primary, availability };
}

async function auditReport(req, res) {
    const dayToCheck = new Date();
    dayToCheck.setDate(dayToCheck.getDate() - req.query.backDay || 1);

    let lcs = await LiveclassMysql.getAllLiveClassesForDay(req.app.get('db').mysql.read);
    lcs = lcs.filter((x) => x.resource_type !== 'RTMP');
    const groupedLCS = _.groupBy(lcs, 'question_id');

    const auditData = {};
    const auditArr = [];
    const missingQids = [];

    // eslint-disable-next-line guard-for-in
    for (const qid in groupedLCS) {
        const resources = _.sortBy(groupedLCS[qid], 'resource_order');
        auditData[qid] = getResourcesAvailability(resources, missingQids);
        auditArr.push({ qid, ...auditData[qid], resourceId: groupedLCS[qid][0].resource_id });
    }
    const totalClasses = Object.keys(groupedLCS).length;
    const studioUploadedFiles = await checkUploads(req.app.get('s3'), dayToCheck, 'dn-original-studio-videos', 'DN', true);
    const tnUploadedFiles = await checkUploads(req.app.get('s3'), dayToCheck, 'dn-tencent', 'TN', true);
    const ytUploadedFiles = await checkUploads(req.app.get('s3'), dayToCheck, 'dn-yt', 'YT', true);

    const primaryInfo = {
        totalClasses,
        TN_TRANSCODED: auditArr.filter((x) => x.primary === 'TN_TRANSCODED').length,
        STUDIO_TRANSCODED: auditArr.filter((x) => x.primary === 'STUDIO_TRANSCODED').length,
        YT_TRANSCODED: auditArr.filter((x) => x.primary === 'YT_TRANSCODED').length,
        TN_VOD: auditArr.filter((x) => x.primary === 'TN_VOD').length,
        YOUTUBE: auditArr.filter((x) => x.primary === 'YOUTUBE').length,
        BLOB: auditArr.filter((x) => x.primary === 'BLOB').length,
        MISSING: missingQids.length,
    };
    const availabilityInfo = {
        STUDIO_TRANSCODED: {
            uploaded: studioUploadedFiles.uploaded,
            available: auditArr.filter((x) => x.availability.STUDIO_TRANSCODED.available).length,
            corrupt: studioUploadedFiles.corrupt,
            missing: totalClasses - studioUploadedFiles.uploaded,
        },
        TN_TRANSCODED: {
            uploaded: tnUploadedFiles.uploaded,
            available: auditArr.filter((x) => x.availability.TN_TRANSCODED.available).length,
            corrupt: tnUploadedFiles.corrupt,
            missing: totalClasses - tnUploadedFiles.uploaded,
        },
        YT_TRANSCODED: {
            uploaded: ytUploadedFiles.uploaded,
            available: auditArr.filter((x) => x.availability.YT_TRANSCODED.available).length,
            corrupt: ytUploadedFiles.corrupt,
            missing: totalClasses - ytUploadedFiles.uploaded,
        },
    };
    const toUpload = auditArr.filter((x) => x.primary === 'TN_VOD' || x.primary === 'YOUTUBE').map((x) => x.resourceId);
    const actionSteps = [];
    if (auditArr.filter((x) => x.availability.STUDIO_TRANSCODED.available).length > studioUploadedFiles.uploaded || totalClasses - studioUploadedFiles.uploaded) {
        actionSteps.push('Files are being uploaded on wrong date!!');
    }
    if (toUpload.length) {
        actionSteps.push({ 'Upload the following resource IDs:': toUpload });
    }
    if (missingQids.length) {
        actionSteps.push({ 'Answer Video resource missing of following Question IDs:': missingQids });
    }
    res.status(200).json({ primaryInfo, availabilityInfo, actionSteps });
}

async function getAnswerVideoResources(req, res) {
    if (!req.query.answerId) {
        return res.status(200).send('answerId missing');
    }
    const avrRows = await AnswerMysql.getAllAnswerVideoResource(req.app.get('db').mysql.read, req.query.answerId);
    if (!avrRows.length) {
        return res.status(200).send('invalid answerId or resource missing');
    }
    const data = getResourcesAvailability(avrRows, []);
    return res.status(200).json(data);
}

async function updateAnswerVideoResourcesPriority(req, res) {
    const mapping = {
        DASH: 2,
        HLS: 3,
    };
    if (!req.query.answerId || !req.query.questionId) {
        return res.status(200).send('questionId/answerId missing');
    }
    const avrRows = await AnswerMysql.getAllAnswerVideoResource(req.app.get('db').mysql.read, req.query.answerId);
    if (!avrRows.length) {
        return res.status(200).send('invalid answerId or resource missing');
    }
    const matchedRow = avrRows.find((x) => x.id == req.query.resourceId);
    if (!matchedRow) {
        return res.status(200).send('resourceId mismatch');
    }
    const primaryResourceIds = matchedRow.vdo_cipher_id ? avrRows.filter((x) => x.vdo_cipher_id === matchedRow.vdo_cipher_id).map((x) => x.id) : [matchedRow.id];
    let c = 0;
    for (let i = 0; i < avrRows.length; i++) {
        const row = avrRows[i];
        if (primaryResourceIds.includes(row.id)) {
            row.is_active = 1;
            row.resource_order = 1;
            if (primaryResourceIds.length === 2) {
                row.resource_order = row.resource_type === 'DASH' ? 1 : 2;
            }
        } else {
            row.is_active = 0;
            c++;
            row.resource_order = c + primaryResourceIds.length;
        }
        await AnswerMysql.updateAnswerVideoResource(req.app.get('db').mysql.write, row.id, row.is_active, row.resource_order);
        if (row.resource_order === 1) {
            const is_vdo_ready = mapping[row.resource_type] || 0;
            await AnswerMysql.updateAnswers(req.app.get('db').mysql.write, row.answer_id, row.resource, is_vdo_ready, row.vdo_cipher_id);
        }
    }
    AnswerRedis.deleteAnswerVideoResource(req.app.get('db').redis.write, avrRows[0].answer_id);
    AnswerRedis.deleteByQuestionIdWithTextSolution(req.query.questionId, req.app.get('db').redis.write);
    avrRows.sort((a, b) => a.resource_order - b.resource_order);
    return res.status(200).send(avrRows);
}

async function getHomeWorkByResourceReference(req, res) {
    db = req.app.get('db');
    const { resourceReference } = req.params;
    const homeWorkResponseSql = 'SELECT * FROM `liveclass_homework_response` WHERE `resource_reference` = ?';
    const homeworkData = await db.mysql.read.query(homeWorkResponseSql, [resourceReference]);
    console.log(homeworkData);
    const data = {};
    data.no_of_student_submitted_answers = _.keys(_.groupBy(homeworkData, 'student_id')).length;
    const questionIdArray = _.keys(_.groupBy(homeworkData, 'quiz_question_id'));
    console.log(questionIdArray);
    let question_data = await db.mysql.read.query('select question_id,ocr_text from questions where question_id IN (?)', [questionIdArray]);
    question_data = _.groupBy(question_data, 'question_id');
    console.log(question_data);
    data.question_wise_data = _.map(_.groupBy(homeworkData, 'quiz_question_id'), (question) => {
        let correct = 0;
        let incorrect = 0;
        const question_id = question[0].quiz_question_id;
        _.map(question, (response) => {
            if (response.is_correct) {
                correct++;
            } else {
                incorrect++;
            }
        });
        return {
            question_id, question: question_data[question_id][0].ocr_text, correct, incorrect,
        };
    });
    console.log(data);
    return res.status(200).send(data);
}

async function getPreviousClasses(req, res, next) {
    try {
        db = req.app.get('db');
        // const config = req.app.get('config');
        const { facultyID } = req.params;
        // const studentID = -22;
        const PAGE_SIZE = 25;
        const pageNo = req.query.page ? parseInt(req.query.page) - 1 : 0;
        const data = await CourseMysql2.getPreviousClassses(db.mysql.read, facultyID, pageNo, PAGE_SIZE);
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

async function readCSV(path) {
    return new Promise((resolve, reject) => {
        const fileRows = [];
        csv.parseFile(path)
            .on('data', (data) => {
                fileRows.push(data);
            })
            .on('end', () => {
                fs.unlinkSync(path);
                resolve(fileRows);
            });
    });
}
async function uploadPromoImages(req, res) {
    try {
        db = req.app.get('db');

        console.log(req.file);
        if (!req.file || req.file.mimetype != 'text/csv') {
            const data = {};
            const responseData = {
                meta: {
                    code: 400,
                    success: false,
                    message: 'Please add CSV file',
                },
                data,
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        let fileRows = await readCSV(req.file.path);
        const fields = ['assortment_id', 'assortment_type', 'subject', 'image_url', 'poll_id', 'startdate', 'enddate', 'order', 'is_active'];

        const csvFields = fileRows[0];

        const matchFields = fields.length === csvFields.length
            && fields.every((elem, i) => elem === csvFields[i]);

        if (matchFields) {
            fileRows = fileRows.slice(1);
            const sql = 'insert into course_promo_images (assortment_id, assortment_type, subject, image_url, poll_id, startdate, enddate, `order`, is_active) VALUES ? ';

            const result = await db.mysql.write.query(sql, [fileRows]);

            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        return res.status(406).json(responseTemplate('Failure', 'Please Check CSV', 500));
    } catch (e) {
        return res.status(500).json(responseTemplate('Failure', 'Something Went Wrong', 500));
    }
}

async function getPromoImages(req, res) {
    try {
        db = req.app.get('db');
        const { assortmentID } = req.query;

        const sql = 'select * from course_promo_images where assortment_id = ? and is_active=1 and startdate < NOW() and enddate > NOW() order by `order`';
        const data = await db.mysql.read.query(sql, [assortmentID]);

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
        return res.status(500).json(responseTemplate('Failure', 'Something Went Wrong', 500));
    }
}

async function getPromoImagesbyQid(req, res, next) {
    try {
        db = req.app.get('db');
        const { qid } = req.params;
        const { subject } = req.query;

        const liveclassCourses = await LiveclassMysql.getCourseIdByresourceReference(db.mysql.read, qid);
        const liveclassCourseIds = [...new Set(liveclassCourses.map((liveclass) => liveclass.liveclass_course_id))];

        if (liveclassCourseIds.length > 0) {
            const assortments = await LiveclassMysql.getAssortmentByLiveclass(db.mysql.read, liveclassCourseIds);
            const assortmentIds = [...new Set(assortments.map((assortment) => assortment.assortment_id))];

            if (assortmentIds.length > 0) {
                const sql = 'select * from course_promo_images where assortment_id in (?) and subject = ?  and assortment_type=\'assortment\' and is_active=1 and startdate < NOW() and enddate > NOW() UNION select * from course_promo_images where assortment_id in (?) and subject = ?  and assortment_type=\'resource\' and is_active=1 and startdate < NOW() and enddate > NOW() order by `order`';
                const images = await db.mysql.read.query(sql, [assortmentIds, subject, qid, subject]);

                return res.status(200).json(responseTemplate('Success', images, 200));
            }
            return res.status(200).json(responseTemplate('Success', [], 200));
        }
        return res.status(200).json(responseTemplate('Success', [], 200));
    } catch (e) {
        return res.status(500).json(responseTemplate('Failure', 'Something Went Wrong', 500));
    }
}

async function getCourseFilters(req, res, next) {
    let responseData = {};
    db = req.app.get('db');

    try {
        const categoryTypes = await CourseContainer.getCourseCategoryTypes(db);
        let mediums = await CourseContainer.getCourseMetaTypes(db);
        let examYears = await CourseContainer.getCourseYears(db);
        const filters = await CourseMysql.getCourseFilters(db.mysql.read);

        const allCategoryTypes = {};
        await Promise.all(categoryTypes.map(async (eachCategoryType) => {
            let categories = await CourseContainer.getCourseCategories(db, eachCategoryType.category_type);
            categories = categories.map((category) => category.category);
            eachCategoryType[eachCategoryType.category_type] = categories;
            allCategoryTypes[eachCategoryType.category_type] = categories;
        }));

        mediums = mediums.map((medium) => medium.meta_info);
        examYears = examYears.map((year) => year.year_exam);

        const data = {
            allCategoryTypes,
            mediums,
            examYears,
            filters,
        };
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function getListAll(req, res, next) {
    let responseData = {};
    db = req.app.get('db');

    try {
        const {
            page, is_free, is_active, category_type, category, selectedClass, meta_info, year_exam, search,
        } = req.query;
        const filterObj = {
            category_type, category, selectedClass, meta_info, year_exam, search,
        };
        if (is_active === '1') {
            filterObj.is_active = '1';
        }
        if (is_free === '0') {
            filterObj.is_free = '0';
        }
        let subquery = '';
        subquery = Object.keys(filterObj)
            .filter((key) => {
                if (filterObj[key] && filterObj[key] !== 'null' && filterObj.key !== '' && filterObj[key] !== 'All') {
                    return key;
                }
            }).map((key) => {
                if (key === 'search') {
                    return `a.display_name LIKE "%${filterObj[key]}%"`;
                }
                return `a.${key === 'selectedClass' ? 'class' : key}='${filterObj[key]}'`;
            }).join(' and ');

        const skip = (page - 1) * 10;
        const sql = `SELECT a.*, sum(a.is_active) as active, GROUP_CONCAT(a.class) as classes, count(distinct b.id) as active_batch FROM course_details as a left join (select * from course_assortment_batch_mapping as bm where  bm.is_active=1) as b on a.assortment_id = b.assortment_id where  a.assortment_type='course'  ${subquery && (`and ${subquery}`)} group by a.assortment_id ORDER BY DATE(a.created_at) DESC limit ${skip} , 10`;
        const data = await db.mysql.read.query(sql, []);

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function getCourseDetailsAll(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id } = req.params;
        let batches = await CourseMysql.getCourseBatches(db.mysql.read, assortment_id);
        const packages = await CourseMysql.getCoursePackage(db.mysql.read, assortment_id);
        const timetable = await CourseMysql.getCourseTimetable(db.mysql.read, assortment_id);
        const faqs = await CourseMysql.getCourseFaq(db.mysql.read, `course_details_${assortment_id}`);
        const books_mapping = await CourseMysql.getCourseAssortmenPackageMapping(db.mysql.read, assortment_id);
        const pre_purchase = await CourseMysql.getCoursePrePurchase(db.mysql.read, assortment_id);
        const course_experts = await CourseMysql.getCourseExperts(db.mysql.read, assortment_id);

        const courseDetails = await CourseMysql.getCourseDetails(db.mysql.read, assortment_id);
        const childAssortments = await CourseMysql.getCourseClassesByAssortment(db.mysql.read, assortment_id);

        const subjectsByBatch = await CourseMysql.getCourseChaptersByBatch(db.mysql.read, assortment_id);
        const courseDetailsThumbnail = await CourseMysql.getCourseDetailsThumbnails(db.mysql.read, assortment_id);
        const courseDetailsBanners = await CourseMysql.getCourseDetailsBanners(db.mysql.read, assortment_id);
        // let courseStudyGroups = await CourseMysql.getCourseStudyGroups(db.mysql.read, assortment_id);
        const demoVideos = await CourseMysql.getAllDemoVideos(db.mysql.read, assortment_id);
        const packagesVariants = await Promise.all(packages.map(async (eachPackage) => {
            const variants = await CourseMysql.getVariantsByPackage(db.mysql.read, eachPackage.id);
            eachPackage.variants = variants;
            return eachPackage;
        }));

        if (batches.length < 1) {
            const batchInsert = {
                assortment_id,
                batch_id: 1,
                is_active: 1,
                batch_start_date: courseDetails[0].start_date,
                batch_end_date: courseDetails[0].end_date,
            };
            const sql = 'insert into course_assortment_batch_mapping set ?';
            await db.mysql.write.query(sql, [batchInsert]);
            batches = await CourseMysql.getCourseBatches(db.mysql.read, assortment_id);
        }

        const packagesByBatch = _.groupBy(packagesVariants, 'batch_id');
        const courseBannersByBatch = _.groupBy(courseDetailsBanners, 'batch_id');
        // let courseStudyGroupsByBatch = _.groupBy(courseStudyGroups, 'batch_id');
        // create study groups
        // await Promise.all(batches.map(async (batch) => {
        //     if (!courseStudyGroupsByBatch[batch.batch_id]) {
        //         await CourseMysql.insertCourseStudyGroup(db.mysql.write, courseDetails[0].assortment_id, batch.batch_id, courseDetails[0].display_name, courseDetails[0].demo_video_thumbnail);
        //     }
        // }));

        // courseStudyGroups = await CourseMysql.getCourseStudyGroups(db.mysql.read, assortment_id);
        // courseStudyGroupsByBatch = _.groupBy(courseStudyGroups, 'batch_id');
        const batchData = batches.map((batch) => {
            batch.courseBanner = courseBannersByBatch[batch.batch_id];
            batch.packages = packagesByBatch[batch.batch_id];
            // batch.studyGroups = courseStudyGroupsByBatch[batch.batch_id];
            return batch;
        });
        const batchSubjects = {};
        subjectsByBatch.map((batch) => {
            if (batch.batch_id in batchSubjects) {
                batchSubjects[batch.batch_id] = [...batchSubjects[batch.batch_id], batch];
            } else {
                batchSubjects[batch.batch_id] = [batch];
            }
        });
        const data = {
            courseDetails: courseDetails[0],
            batch: batchData,
            timetable,
            faqs,
            books_mapping,
            pre_purchase,
            course_experts,
            childAssortments,
            batchSubjects,
            courseDetailsThumbnail: courseDetailsThumbnail[0],
            packagesVariants,
            demoVideos,
        };
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function courseMetaTimetable(req, res, next) {
    let responseData = {};
    db = req.app.get('db');

    try {
        const { assortment_id } = req.params;
        let itemList = req.body;

        const ids = itemList[0];
        itemList = itemList.slice(1);
        const sampleIds = ['id', 'is_active', 'week_of', 'week_number', 'topic_covered', 'subject'];
        const match_ids = ids.length === sampleIds.length
            && sampleIds.every((elem, i) => elem === ids[i]);
        if (match_ids) {
            const updatedItems = itemList
                .filter((item) => item[0])
                .map((item) => {
                    const curr = {};
                    for (let i = 0; i < item.length; i++) {
                        curr[ids[i]] = item[i];
                    }
                    return curr;
                });

            const newItems = itemList
                .filter((item) => !item[0])
                .map((item) => {
                    item.push(assortment_id); // assortment_id
                    return item.slice(1);
                });

            if (newItems.length > 0) {
                await CourseMysql.insertCourseTimetable(db.mysql.write, newItems);
            }
            await Promise.all(updatedItems.map(async (item) => {
                const timeTableId = item.id;
                delete item.id;
                await CourseMysql.updateCourseTimetable(db.mysql.write, item, timeTableId);
            }));

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
                code: 406,
                success: false,
                message: 'Failure',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function courseMetaFaq(req, res, next) {
    let responseData = {};
    db = req.app.get('db');

    try {
        const { assortment_id } = req.params;
        let itemList = req.body;

        const ids = itemList[0];
        itemList = itemList.slice(1);

        const sampleIds = ['id', 'locale', 'question', 'answer', 'type', 'priority', 'is_active', 'batch_id', 'offset_time'];
        const match_ids = ids.length === sampleIds.length
            && sampleIds.every((elem, i) => elem === ids[i]);
        if (match_ids) {
            const updatedItems = itemList
                .filter((item) => item[0])
                .map((item) => {
                    const curr = {};
                    for (let i = 0; i < item.length; i++) {
                        curr[ids[i]] = item[i];
                    }
                    return curr;
                });

            const newItems = itemList.filter((item) => !item[0])
                .map((item) => {
                    item.push(`course_details_${assortment_id}`); // bucket
                    item.push(1); // bucket_priority
                    item.push(750); // min_version_code
                    item.push(10000); // max_version_code
                    return item.slice(1);
                });

            if (newItems.length > 0) {
                await CourseMysql.insertCourseFaq(db.mysql.write, newItems);
            }
            await Promise.all(updatedItems.map(async (item) => {
                const faqId = item.id;
                delete item.id;
                await CourseMysql.updateCourseFaq(db.mysql.write, item, faqId);
            }));

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
                code: 406,
                success: false,
                message: 'Failure',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function courseMetaPrePurchase(req, res, next) {
    let responseData = {};
    db = req.app.get('db');

    try {
        const { assortment_id } = req.params;
        let itemList = req.body;

        const ids = itemList[0];
        itemList = itemList.slice(1);

        const sampleIds = ['id', 'priority', 'locale', 'title', 'subtitle', 'is_active'];
        const match_ids = ids.length === sampleIds.length
            && sampleIds.every((elem, i) => elem === ids[i]);
        if (match_ids) {
            const updatedItems = itemList
                .filter((item) => item[0])
                .map((item) => {
                    const curr = {};
                    for (let i = 0; i < item.length; i++) {
                        curr[ids[i]] = item[i];
                    }
                    return curr;
                });

            const newItems = itemList
                .filter((item) => !item[0])
                .map((item) => {
                    item.push(assortment_id); // assortmentId
                    return item.slice(1);
                });
            if (newItems.length > 0) {
                await CourseMysql.insertCoursePrePurchase(db.mysql.write, newItems);
            }
            await Promise.all(updatedItems.map(async (item) => {
                const prePurchaseId = item.id;
                delete item.id;
                await CourseMysql.updateCoursePrePurchase(db.mysql.write, item, prePurchaseId);
            }));

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
                code: 406,
                success: false,
                message: 'Failure',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function courseMetaStudentPackage(req, res, next) {
    let responseData = {};
    db = req.app.get('db');

    try {
        const { assortment_id } = req.params;
        let itemList = req.body;

        const ids = itemList[0];
        itemList = itemList.slice(1);
        const sampleIds = ['id', 'student_id', 'class', 'subject', 'thumbnail_url', 'display_name', 'book_type', 'is_active', 'app_deeplink'];
        const match_ids = ids.length === sampleIds.length
            && sampleIds.every((elem, i) => elem === ids[i]);
        if (match_ids) {
            const updatedItems = itemList
                .filter((item) => item[0])
                .map((item) => {
                    const curr = {};
                    for (let i = 0; i < item.length; i++) {
                        curr[ids[i]] = item[i];
                    }
                    return curr;
                });
            const newItems = itemList
                .filter((item) => !item[0])
                .map((item) => {
                    item.push(assortment_id); // assortmentId
                    return item.slice(1);
                });
            if (newItems.length > 0) {
                await CourseMysql.insertCourseStudentPackage(db.mysql.write, newItems);
            }
            await Promise.all(updatedItems.map(async (item) => {
                const studentPackageId = item.id;
                delete item.id;
                await CourseMysql.updateCourseStudentPackage(db.mysql.write, item, studentPackageId);
            }));

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
                code: 406,
                success: false,
                message: 'Failure',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function updateCourseInfo(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const courseObj = { ...req.body };

        const { assortment_id } = courseObj;

        const updateObj = {
            display_name: courseObj.display_name,
            display_description: courseObj.display_description,
            subtitle: courseObj.subtitle,
            meta_info: courseObj.meta_info,
            assortment_type: courseObj.assortment_type,
            category_type: courseObj.category_type,
            category: courseObj.category,
            year_exam: courseObj.year_exam,
            is_free: courseObj.is_free,
        };
        updateObj.updated_by = req.user.student_username;

        const sql = 'update course_details set ? where assortment_id = ?';
        await db.mysql.write.query(sql, [updateObj, assortment_id]);

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markCourseActiveAll(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id } = req.params;
        const { active } = req.query;

        let sql = '';
        if (active == '1') {
            let courseDetails = await CourseMysql.getCourseDetails(db.mysql.read, assortment_id);
            const timetable = await CourseMysql.getCourseTimetable(db.mysql.read, assortment_id);
            const faqs = await CourseMysql.getCourseFaq(db.mysql.read, `course_details_${assortment_id}`);
            const books_mapping = await CourseMysql.getCourseAssortmenPackageMapping(db.mysql.read, assortment_id);
            const pre_purchase = await CourseMysql.getCoursePrePurchase(db.mysql.read, assortment_id);
            const courseDetailsThumbnail = await CourseMysql.getCourseDetailsThumbnails(db.mysql.read, assortment_id);
            const packages = await CourseMysql.getCoursePackage(db.mysql.read, assortment_id);
            const demoVideos = await CourseMysql.getAllDemoVideos(db.mysql.read, assortment_id);

            const packagesVariants = await Promise.all(packages.map(async (eachPackage) => {
                const variants = await CourseMysql.getVariantsByPackage(db.mysql.read, eachPackage.id);
                eachPackage.variants = variants;
                return eachPackage;
            }));

            courseDetails = courseDetails[0];
            const basicInfo = courseDetails.display_name && courseDetails.meta_info && courseDetails.category_type && courseDetails.category && courseDetails.year_exam
                && courseDetails.start_date && courseDetails.end_date && courseDetails.expiry_date && courseDetails.display_image_square
                && courseDetails.demo_video_thumbnail && (courseDetails.is_free ? true : demoVideos.length > 0);

            const coursePrice = packagesVariants.filter((eachPackage) => {
                if ((eachPackage.variants.length > 0) && eachPackage.is_active) {
                    const activeVariant = eachPackage.variants.filter((variant) => {
                        if (variant.is_active && variant.is_default) return true;
                    });
                    if (activeVariant.length > 0) {
                        return true;
                    }
                }
            });

            if (!basicInfo || timetable.length < 1 || faqs.length < 1 || books_mapping.length < 1
                || pre_purchase.length < 1 || courseDetailsThumbnail.length < 1 || coursePrice.length < 1) {
                responseData = {
                    meta: {
                        code: 406,
                        success: false,
                        message: 'Check Checklist',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            sql = 'update course_details set is_active = ? where assortment_id=?';
            await db.mysql.write.query(sql, [active, assortment_id]);
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }

        sql = 'update course_details set is_active = ? where assortment_id=?';
        await db.mysql.write.query(sql, [active, assortment_id]);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };

        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markCourseActiveSingle(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id } = req.params;
        const { classValue, active } = req.query;

        let sql = '';
        if (active == '1') {
            let courseDetails = await CourseMysql.getCourseDetailsByClass(db.mysql.read, assortment_id, classValue);
            const timetable = await CourseMysql.getCourseTimetable(db.mysql.read, assortment_id);
            const faqs = await CourseMysql.getCourseFaq(db.mysql.read, `course_details_${assortment_id}`);
            const books_mapping = await CourseMysql.getCourseAssortmenPackageMapping(db.mysql.read, assortment_id);
            const pre_purchase = await CourseMysql.getCoursePrePurchase(db.mysql.read, assortment_id);
            const courseDetailsThumbnail = await CourseMysql.getCourseDetailsThumbnails(db.mysql.read, assortment_id);
            const packages = await CourseMysql.getCoursePackage(db.mysql.read, assortment_id);
            const demoVideos = await CourseMysql.getAllDemoVideos(db.mysql.read, assortment_id);

            const packagesVariants = await Promise.all(packages.map(async (eachPackage) => {
                const variants = await CourseMysql.getVariantsByPackage(db.mysql.read, eachPackage.id);
                eachPackage.variants = variants;
                return eachPackage;
            }));

            courseDetails = courseDetails[0];
            const basicInfo = courseDetails.display_name && courseDetails.meta_info && courseDetails.category_type && courseDetails.category && courseDetails.year_exam
                && courseDetails.start_date && courseDetails.end_date && courseDetails.expiry_date && courseDetails.display_image_square
                && courseDetails.demo_video_thumbnail && (courseDetails.is_free ? true : demoVideos.length > 0);

            const coursePrice = packagesVariants.filter((eachPackage) => {
                if ((eachPackage.variants.length > 0) && eachPackage.is_active) {
                    const activeVariant = eachPackage.variants.filter((variant) => {
                        if (variant.is_active && variant.is_default) return true;
                    });
                    if (activeVariant.length > 0) {
                        return true;
                    }
                }
            });

            if (!basicInfo || timetable.length < 1 || faqs.length < 1 || books_mapping.length < 1
                || pre_purchase.length < 1 || courseDetailsThumbnail.length < 1 || coursePrice.length < 1) {
                responseData = {
                    meta: {
                        code: 406,
                        success: false,
                        message: 'Check Checklist',
                    },
                };
                return res.status(responseData.meta.code).json(responseData);
            }
            sql = 'update course_details set is_active = ? where assortment_id=? and class=?';
            await db.mysql.write.query(sql, [active, assortment_id, classValue]);
            responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'Success',
                },
            };
            return res.status(responseData.meta.code).json(responseData);
        }
        sql = 'update course_details set is_active = ? where assortment_id=? and class=?';
        await db.mysql.write.query(sql, [active, assortment_id, classValue]);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markVideoDemo(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id } = req.params;
        const { demo } = req.query;

        const sql = 'update course_details set is_free = ? where assortment_id = ?';
        await db.mysql.write.query(sql, [demo, assortment_id]);
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function createBatch(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id } = req.params;

        const {
            batch_id, batch_start_date, batch_end_date, demo_video_qid, batch_banner,
        } = req.body;
        const batchObject = {
            batch_id, batch_start_date, batch_end_date, demo_video_qid, is_active: 0,
        };
        batchObject.assortment_id = assortment_id;

        const sql = 'insert into course_assortment_batch_mapping set ?';
        const result = await db.mysql.write.query(sql, [batchObject]);

        responseData = {
            meta: {
                code: 200,
                success: false,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function createPackage(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id, batch_id } = req.params;
        const {
            packageName, description, duration, referenceType, newPackage, package_id,
        } = req.body;

        if (newPackage) {
            await CourseMysql.insertCoursePackage(db.mysql.write, assortment_id, batch_id, packageName, description, duration, referenceType);
        } else {
            await CourseMysql.updateCoursePackage(db.mysql.write, packageName, description, duration, referenceType, package_id);
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

// async function convertToWebp(buffer) {
//     return new Promise((resolve, reject) => {
//         sharp(buffer)
//             .webp()
//             .toBuffer()
//             .then((newBuffer) => {
//                 resolve(newBuffer);
//             })
//             .catch((e) => {
//                 reject(new Error('Failed'));
//             });
//     });
// }
// async function uploadToS3(s3, file) {
//     const fileName = file.originalname.split('.')[0];

//     const timestamp = moment().unix();
//     const keyName = `${fileName}_${timestamp}.webp`;

//     const params = {
//         Bucket: 'doubtnut-static/engagement_framework',
//         Key: keyName, // File name you want to save as in S3
//         Body: file.buffer,
//         ContentType: 'image/webp',
//         ACL: 'public-read',
//     };
//     return new Promise((resolve, reject) => {
//         s3.upload(params, (err, data) => {
//             if (err) {
//                 reject(new Error('could not upload'));
//             } else {
//                 resolve(data);
//             }
//         });
//     });
// }

async function uploadImages(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    const s3 = req.app.get('s3');

    try {
        // const webPBuffer = await convertToWebp(req.file.buffer);
        // req.file.buffer = webPBuffer;
        // const s3File = await uploadToS3(s3, req.file);
        // const uploadUrl = `${req.app.get('config').cdn_url}${s3File.key}`;

        const { assortment_id } = req.params;
        const { field, selectedClass, image_url } = req.body;

        let sql = '';
        if (field === 'course_details_thumbnails') {
            const tempSql = 'select * from course_details_thumbnails where assortment_id=?';
            const thumbnails = await db.mysql.write.query(tempSql, [assortment_id]);
            const assortmentClasses = selectedClass.split(',');

            if (thumbnails.length > 0) {
                sql = 'update course_details_thumbnails set image_url = ? where assortment_id=?';
                await db.mysql.write.query(sql, [image_url, assortment_id]);
            } else {
                await Promise.all(assortmentClasses.map(async (eachClass) => {
                    sql = 'insert into course_details_thumbnails set image_url = ?, assortment_id=?, class=?, type=\'widget_popular_course\', min_version_code=872, max_version_code=10000';
                    await db.mysql.write.query(sql, [image_url, assortment_id, eachClass]);
                }));
            }
        } else {
            sql = `update course_details set ${field} = ? where assortment_id=?`;
            await db.mysql.write.query(sql, [image_url, assortment_id]);
        }

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: {
                url: image_url,
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
        // responseData = {
        //     meta: {
        //         code: 500,
        //         success: false,
        //         message: 'Something Went Wrong',
        //     },
        //     error: e,
        // };
        // return res.status(responseData.meta.code).json(responseData);
    }
}

async function markBatchActive(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id, batch_id } = req.params;
        const { active } = req.query;
        const sql = 'update course_assortment_batch_mapping set is_active = ? where assortment_id=? and batch_id=?';
        const result = await db.mysql.write.query(sql, [active, assortment_id, batch_id]);

        const data = {};
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markPackageActive(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id, package_id } = req.params;
        const { active } = req.query;
        const sql = 'update package set is_active = ? where id=?';
        const result = await db.mysql.write.query(sql, [active, package_id]);

        const data = {};
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markPackageDefault(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id, package_id } = req.params;
        const { batch_id, is_default } = req.query;

        const sql = 'update package set is_default = ? where id=?';
        await db.mysql.write.query(sql, [is_default, package_id]);

        // console.log(result);
        const data = {};
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function createPackageVariant(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { package_id } = req.params;
        const { basePrice, displayPrice } = req.body;

        const sql = 'INSERT INTO variants (package_id, base_price, display_price, is_active) VALUES (?, ?, ?, 0)';
        const result = await db.mysql.write.query(sql, [package_id, basePrice, displayPrice]);

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markVariantActive(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { package_id, variant_id } = req.params;
        const { active } = req.query;
        const sql = 'update variants set is_active = ? where id=?';
        await db.mysql.write.query(sql, [active, variant_id]);

        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function markVariantDefault(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { package_id, variant_id } = req.params;

        const sql = 'update variants set is_default=0 WHERE package_id=?';
        await db.mysql.write.query(sql, [package_id]);

        const sql2 = 'update variants set is_default = 1 where id=?';
        await db.mysql.write.query(sql2, [variant_id]);

        // console.log(result);
        const data = {};
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}
async function getVideos(req, res, next) {
    let responseData = {};
    db = req.app.get('db');
    try {
        const { assortment_id } = req.params;
        const { batch, subject, is_demo } = req.query;
        const subquery = is_demo == 'true' ? 'and cd.is_free = 1' : '';
        const sql = `select cr.*,cd.is_free from (select * from ( select * from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id in ( select course_resource_id from course_resource_mapping where assortment_id = ? and resource_type = 'assortment' ${subject && `and name='${subject}'`}) and resource_type = 'assortment') and resource_type = 'assortment') and resource_type = 'resource' ${batch && `and batch_id=${batch}`}) as a inner join ( select id as course_resour_id, name as video_name, resource_reference, resource_type as video_type, subject from course_resources where (resource_type IN (1,4,8))) as b on b.course_resour_id = a.course_resource_id) as cr inner join course_details as cd on cr.assortment_id = cd.assortment_id ${subquery} group by cd.assortment_id`;
        const demoVideos = await db.mysql.read.query(sql, [assortment_id]);

        // console.log(result);
        const data = { demoVideos };
        responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        responseData = {
            meta: {
                code: 500,
                success: false,
                message: 'Something Went Wrong',
            },
            error: e,
        };
        return res.status(responseData.meta.code).json(responseData);
    }
}

async function getUploadSignedUrl(req, res, next) {
    db = req.app.get('db');
    const s3 = req.app.get('s3');
    const cdnUrl = req.app.get('config').cdn_url;
    try {
        const { content_type: contentType = 'image/webp' } = req.query;

        const signedUrlExpireSeconds = 60 * 60;

        const s3Bucket = 'doubtnut-static';
        const s3BucketFolder = 'images';
        const fileName = `${uuidv4()}.${contentType.split('/')[1]}`;

        const bucketKey = `${s3BucketFolder}/${fileName}`;

        const params = {
            Bucket: s3Bucket,
            Key: bucketKey,
            Expires: signedUrlExpireSeconds,
            ContentType: contentType,
            ContentEncoding: 'base64',
            ACL: 'public-read',
        };

        const s3Location = `${s3Bucket}/${bucketKey}`;

        const uploadUrl = await s3.getSignedUrl('putObject', params);
        // return new Promise((resolve, reject) => {
        //     s3.getSignedUrl('putObject', params, (err, url) => {
        //         if (err) reject(err);
        //         else resolve([url, s3Location]);
        //     });
        // });
        const publicUrl = `${cdnUrl}${bucketKey}`;

        const data = { uploadUrl, publicUrl };
        return res.status(200).json(responseTemplate('Success', data, 200));
    } catch (e) {
        res.status(500).json(responseTemplate('Failure', e, 500));
    }
}

async function uploadCourseBatchBanner(req, res, next) {
    db = req.app.get('db');
    try {
        const { assortmentId } = req.params;
        const { batch_id: batchId, image_url: imageUrl } = req.body;

        const courseBatches = await CourseMysql.getCourseBatches(db.mysql.read, assortmentId);
        const prevCourseBanners = await CourseMysql.getCourseDetailsBanners(db.mysql.read, assortmentId);

        const courseBatchesGrouped = _.groupBy(courseBatches, 'batch_id');
        const prevCourseBannersGrouped = _.groupBy(prevCourseBanners, 'batch_id');

        const allPromises = [];
        let prevBannerIds = [];
        if (batchId === 'all') {
            if (prevCourseBanners.length > 0) {
                prevBannerIds = prevCourseBanners.map((banner) => banner.id);
            }
            courseBatches.map((eachBatch) => {
                allPromises.push(CourseMysql.insertCourseDetailsBanners(db.mysql.write, assortmentId, eachBatch.batch_id, 'en', imageUrl, eachBatch.batch_end_date));
                allPromises.push(CourseMysql.insertCourseDetailsBanners(db.mysql.write, assortmentId, eachBatch.batch_id, 'hi', imageUrl, eachBatch.batch_end_date));
            });
        } else {
            const courseBatch = courseBatchesGrouped[batchId];
            const prevCourseBannerBatch = prevCourseBannersGrouped[batchId];

            if (courseBatch) {
                if (prevCourseBannerBatch) {
                    prevBannerIds = prevCourseBannerBatch.map((banner) => banner.id);
                }
                allPromises.push(CourseMysql.insertCourseDetailsBanners(db.mysql.write, assortmentId, batchId, 'en', imageUrl, courseBatch[0].batch_end_date));
                allPromises.push(CourseMysql.insertCourseDetailsBanners(db.mysql.write, assortmentId, batchId, 'hi', imageUrl, courseBatch[0].batch_end_date));
            }
        }
        await allPromises;
        if (prevBannerIds.length > 0) {
            await CourseMysql.disablePreviousBanners(db.mysql.write, prevBannerIds);
        }
        return res.status(200).json(responseTemplate('Succes', 'Success', 200));
    } catch (e) {
        next(e);
    }
}

// async function updateStudyGroup(req, res, next) {
//     db = req.app.get('db');
//     try {
//         const { assortmentId, batchId } = req.params;
//         const { name: studyGroupName } = req.body;

//         await CourseMysql.updateCourseStudyGroup(db.mysql.write, assortmentId, batchId, studyGroupName);

//         return res.status(200).json(responseTemplate('Succes', 'Success', 200));
//     } catch (e) {
//         next(e);
//     }
// }

async function getYoutubeEvents(req, res, next) {
    db = req.app.get('db');
    try {
        let { page } = req.query;
        const LIMIT = 50;
        if (page) {
            page = parseInt(page) - 1;
        } else {
            page = 0;
        }
        const ytEvents = await LiveclassMysql.getYoutubeEvents(db.mysql.read, page, LIMIT);

        return res.status(200).json(responseTemplate('Succes', ytEvents, 200));
    } catch (e) {
        next(e);
    }
}

async function updateYoutubeEventsMeta(req, res, next) {
    db = req.app.get('db');
    try {
        const { eventId } = req.params;
        const { title, description } = req.body;

        await LiveclassMysql.updateYoutubeEventsMeta(db.mysql.read, eventId, title, description);

        return res.status(200).json(responseTemplate('Success', 'Success', 200));
    } catch (e) {
        next(e);
    }
}
async function processYoutubeEvent(req, res, next) {
    db = req.app.get('db');
    const config = req.app.get('config');
    try {
        const { eventId } = req.params;
        const { selectedChannels } = req.body;

        const ytEvent = await LiveclassMysql.getYoutubeEventById(db.mysql.read, eventId);
        if (!ytEvent.length) {
            return res.status(400).json(responseTemplate('Failure', 'No Such Event', 400));
        }

        const resourceType = ytEvent[0].resource_type;
        const resource = await LiveclassMysql.getResourceByAssortmentId(db.mysql.read, ytEvent[0].assortment_id);

        if (!resource.length) {
            return res.status(400).json(responseTemplate('Failure', 'No Such Resource', 400));
        }
        const qid = _.get(resource, '[0].resource_reference', null);
        if (!qid) {
            return res.status(400).json(responseTemplate('Failure', 'No Such Qid', 400));
        }
        const question = await AnswerContainer.getByQuestionId(qid, db);

        let videoResource = [];
        if (resourceType == 1 && _.get(question, '[0]', false)) {
            const supportedMediaList = ['DASH'];
            videoResource = await Answer_Container.getAnswerVideoResource(db, config, question[0].answer_id, question[0].question_id, supportedMediaList, 900);
            videoResource = videoResource.filter((er) => (er && supportedMediaList.includes(er.media_type)));

            if (!videoResource.length) {
                return res.status(400).json(responseTemplate('Failure', 'No Such Video Resource', 400));
            }
        }

        const oldResourceId = await LiveclassMysql.getOldResourceId(db.mysql.read, ytEvent[0].assortment_id);

        await LiveclassMysql.updateEventState(db.mysql.write, eventId, 2);

        const kafkaPayload = {
            eventId,
            channels: selectedChannels,
            resourceType,
            title: ytEvent[0].title,
            description: ytEvent[0].description,
            liveAt: ytEvent[0].live_at,
            resource: videoResource[0].resource,
            oldResourceId: oldResourceId[0],
        };

        kafka.publish(kafka.topics.youtubeVideoUpload, 0, kafkaPayload);

        return res.status(200).json(responseTemplate('Success', 'Success', 200));
    } catch (e) {
        next(e);
    }
}

async function getYoutubeVideos(req, res, next) {
    db = req.app.get('db');
    try {
        const { eventId } = req.params;

        const ytEventsVideos = await LiveclassMysql.getYoutubeVideoByEvent(db.mysql.read, eventId);

        return res.status(200).json(responseTemplate('Succes', ytEventsVideos, 200));
    } catch (e) {
        next(e);
    }
}

async function getYoutubeChannels(req, res, next) {
    db = req.app.get('db');
    try {
        const ytChannels = await LiveclassMysql.getYoutubeChannels(db.mysql.read);

        return res.status(200).json(responseTemplate('Succes', ytChannels, 200));
    } catch (e) {
        next(e);
    }
}

module.exports = {
    getScheduledClasses,
    addQuiz,
    updateQuestion,
    updateMeta,
    testAddAssortment,
    assortmentPackageGeneration,
    reschedule,
    chapterChange,
    deleteDetailId,
    updateYoutube,
    updateFacultyId,
    updateCourseId,
    getUpcomingClasses,
    getMasterChaptersByCourseAndSubject,
    updateUpcomingMeta,
    generateResource,
    generateNotes,
    processUpcomingClass,
    processNotes,
    addNotesMeta,
    getAllMasterChapters,
    auditReport,
    getAnswerVideoResources,
    updateAnswerVideoResourcesPriority,
    getHomeWorkByResourceReference,
    getPreviousClasses,
    uploadPromoImages,
    getPromoImages,
    getPromoImagesbyQid,
    getCourseFilters,
    getListAll,
    getCourseDetailsAll,
    courseMetaTimetable,
    courseMetaFaq,
    courseMetaPrePurchase,
    courseMetaStudentPackage,
    updateCourseInfo,
    markCourseActiveAll,
    markCourseActiveSingle,
    markVideoDemo,
    createBatch,
    createPackage,
    markBatchActive,
    markPackageActive,
    markPackageDefault,
    createPackageVariant,
    markVariantActive,
    markVariantDefault,
    getVideos,
    getUploadSignedUrl,
    uploadImages,
    uploadCourseBatchBanner,
    // updateStudyGroup,
    getYoutubeEvents,
    updateYoutubeEventsMeta,
    processYoutubeEvent,
    getYoutubeVideos,
    getYoutubeChannels,
};
