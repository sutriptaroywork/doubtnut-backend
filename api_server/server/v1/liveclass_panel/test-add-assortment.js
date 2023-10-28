/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
/* eslint-disable eqeqeq */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-undef */
const _ = require('lodash');

function insertLiveclassCourseBackp(database, data) {
    const sql = 'insert into liveclass_course_bk set ?';
    return database.query(sql, [data]);
}

function getDistinctClass(database, assortment_id) {
    const sql = `select distinct class from course_details where assortment_id=${assortment_id}`;
    return database.query(sql);
}

function getImages(database, subject) {
    const sql = `SELECT display_name, display_image_rectangle, display_image_square, display_icon_image FROM course_details WHERE display_name = '${subject}' and assortment_type LIKE 'subject' and display_image_square is not null and display_icon_image is not null group by display_name, display_image_rectangle, display_image_square, display_icon_image`;
    return database.query(sql);
}

function getStreamDetails(database, old_detail_id) {
    const sql = `select * from liveclass_stream where detail_id= ${old_detail_id}`;
    return database.query(sql);
}

function getAllCourseResources(database, assortment_id) {
    const sql = `SELECT a.assortment_id as resource_assortment_id, a.resource_type, b.id as resource_id,b.resource_reference,b.resource_type, case when b.resource_type = 1 and b.player_type ='youtube' then b.meta_info else b.resource_reference end as final_reference from (SELECT * from course_resource_mapping where assortment_id in (SELECT course_resource_id  FROM course_resource_mapping WHERE assortment_id = ${assortment_id})) as a left join course_resources as b on a.course_resource_id = b.id`;
    return database.query(sql);
}

function getCourseDetailNew(database, assortment_id) {
    const sql = `select * from course_details where assortment_id=${assortment_id} group by assortment_id`;
    console.log(sql);
    return database.query(sql);
}

function getCourseDetail(database, assortment_id, subject) {
    subject = subject.replace(/'/g, "\\'");
    const sql = `select * from course_details where assortment_id=${assortment_id} and display_name='${subject}'`;
    console.log(sql);
    return database.query(sql);
}

function getAllCourseResourceMappingRows(database, assortment_id) {
    const sql = `select * from course_resource_mapping where assortment_id=${assortment_id}`;
    console.log(sql);
    return database.query(sql);
}

function insertCourseResources(database, obj) {
    console.log('insert object');
    console.log(obj);
    const sql = 'insert into course_resources set ?';
    return database.query(sql, [obj]);
}

function insertCourseDetails(database, obj) {
    const sql = 'insert into course_details set ?';
    return database.query(sql, [obj]);
}

function insertCourseResourceMapping(database, obj) {
    const sql = 'insert into course_resource_mapping set ?';
    return database.query(sql, [obj]);
}

function getCourseResource(database, resourceType, resourceReference) {
    const sql = `select * from course_resources where resource_type = ${resourceType} and resource_reference = '${resourceReference}' order by id desc`;
    console.log(sql);
    return database.query(sql);
}

function updateLiveclassCourseResource(database, data, oldResourceID) {
    const sql = 'update liveclass_course_resources set ? where id = ?';
    return database.query(sql, [data, oldResourceID]);
}

function getResurceReferenceFromOldResource(database, courseID, detailID) {
    const sql = `select *, b.id as resource_id from (select resource_reference from liveclass_course_resources where liveclass_course_id= ${courseID} and liveclass_course_detail_id= ${detailID} and resource_type IN (4,1)) as a left join (select * from course_resources where resource_type IN (4,1)) as b on a.resource_reference=b.resource_reference left join (select * from course_resource_mapping where resource_type='resource') as c on b.id=c.course_resource_id`;
    console.log(sql);
    return database.query(sql, [courseID, detailID]);
}
function getAllOldAppAssortments(database, prevDetailId) {
    const sql = 'SELECT a.id as old_resource_id, a.topic, a.expert_name,a.expert_image,a.expert_image, replace(replace(right(c.chapter,3),\'L\',\'\'),\' \',\'\') as q_order,a.class,a.player_type,a.meta_info,a.tags,a.title, e.assortment_id, c.liveclass_course_id,a.liveclass_course_detail_id as old_detail_id, c.subject, c.master_chapter, a.resource_reference, a.resource_type, c.live_at,c.faculty_id,c.is_replay,a.lecture_type,a.batch_id  from ( SELECT * from liveclass_course_resources where liveclass_course_detail_id > ? and is_processed=0 and resource_reference is not NULL and length(resource_reference)>0 and resource_reference not like \'LC_%\') as a left join liveclass_course_details as c on a.liveclass_course_detail_id = c.id  left join course_details_liveclass_course_mapping as e on c.liveclass_course_id=e.liveclass_course_id where c.is_replay IN (0,2) and a.resource_type <>8 order by a.id asc';
    console.log(sql, [prevDetailId]);
    return database.query(sql, [prevDetailId]);
}
function getAllOldAppAssortmentsById(database, detailID) {
    const sql = 'SELECT a.id as old_resource_id, a.topic, a.expert_name,a.expert_image,a.expert_image, replace(replace(right(c.chapter,3),\'L\',\'\'),\' \',\'\') as q_order ,a.class,a.player_type,a.meta_info,a.tags,a.title, e.assortment_id, c.liveclass_course_id,a.liveclass_course_detail_id as old_detail_id, c.subject, c.master_chapter, a.resource_reference, a.resource_type, c.live_at,c.faculty_id,c.is_replay,a.lecture_type,a.batch_id  from ( SELECT * from liveclass_course_resources where liveclass_course_detail_id = ? and is_processed=0 and resource_reference is not NULL and length(resource_reference)>0 and resource_reference not like \'LC_%\') as a left join liveclass_course_details as c on a.liveclass_course_detail_id = c.id  left join course_details_liveclass_course_mapping as e on c.liveclass_course_id=e.liveclass_course_id where c.is_replay IN (0,2) and a.resource_type <>8 order by a.id asc';
    console.log(sql);
    return database.query(sql, [detailID], 5 * 60 * 1000);
}

function getCourseDetailsEntry(database, assortmentId) {
    const sql = 'SELECT  * from course_details where assortment_id  = ?';
    return database.query(sql, [assortmentId]);
}

function clearCacheFromQuestionId(redisClient, questionId) {
    return redisClient.delAsync(`all_course_assortments_by_qId:${questionId}`);
}
async function cacheClearWrapper(db, oldAssortment) {
    if (_.includes([1, 4, 8], oldAssortment.resource_type)) {
        // clear cache
        await clearCacheFromQuestionId(db.redis.write, oldAssortment.resource_reference);
    }
}
async function main(db, is_single = false, detailID = 0) {
    try {
        console.log(detailID);
        let oldAppSsortments = [];
        if (is_single) {
            oldAppSsortments = await getAllOldAppAssortmentsById(db.mysql.write, detailID);
        } else {
            const prevProcessedTill = 526985;
            oldAppSsortments = await getAllOldAppAssortments(db.mysql.write, prevProcessedTill);
        }
        // reorder
        console.log(oldAppSsortments);
        const grouped = _.groupBy(oldAppSsortments, 'old_detail_id');
        let final = [];
        for (const key in grouped) {
            if (Object.prototype.hasOwnProperty.call(grouped, key)) {
                let item = grouped[key];
                item = _.orderBy(item, ['resource_type'], ['asc']);
                final = [...final, ...item];
            }
        }
        oldAppSsortments = final;
        console.log(oldAppSsortments.length);
        for (let i = 0; i < oldAppSsortments.length; i++) {
            const masterChapter = oldAppSsortments[i].master_chapter;
            if (masterChapter) {
                oldAppSsortments[i].master_chapter = masterChapter.trim();
            }

            let isResourceFound = false;
            const distinctClasses = await getDistinctClass(db.mysql.write, oldAppSsortments[i].assortment_id);
            // const oldAppSsortments =  await getAllOldAppAssortments();
            const streamDetails = await getStreamDetails(db.mysql.write, oldAppSsortments[i].old_detail_id);

            // get vendor_id from course_details table parent column
            let vendorId = 1;
            if (oldAppSsortments[i].assortment_id) {
                const courseDetailsEntry = await getCourseDetailsEntry(db.mysql.read, oldAppSsortments[i].assortment_id);
                vendorId = courseDetailsEntry[0].parent || 1;
            }

            const insertCourseResourcesObj = {
                resource_reference: oldAppSsortments[i].resource_reference,
                resource_type: oldAppSsortments[i].resource_type,
                subject: oldAppSsortments[i].subject,
                topic: oldAppSsortments[i].master_chapter,
                expert_name: oldAppSsortments[i].expert_name,
                expert_image: oldAppSsortments[i].expert_image,
                q_order: oldAppSsortments[i].q_order,
                class: oldAppSsortments[i].class,
                player_type: oldAppSsortments[i].player_type,
                meta_info: oldAppSsortments[i].meta_info,
                tags: oldAppSsortments[i].tags,
                name: oldAppSsortments[i].topic,
                display: oldAppSsortments[i].topic,
                description: oldAppSsortments[i].topic,
                chapter: oldAppSsortments[i].master_chapter,
                chapter_order: '1',
                created_by: 'AS_Umang_Url',
                rating: '1',
                old_resource_id: oldAppSsortments[i].old_resource_id,
                old_detail_id: oldAppSsortments[i].old_detail_id,
                faculty_id: oldAppSsortments[i].faculty_id,
                lecture_type: oldAppSsortments[i].lecture_type,
                vendor_id: vendorId,
            };
            if (streamDetails && streamDetails.length > 0) {
                insertCourseResourcesObj.stream_start_time = streamDetails[0].start_time;
                insertCourseResourcesObj.stream_push_url = streamDetails[0].push_url;
                insertCourseResourcesObj.stream_end_time = streamDetails[0].end_time;
                insertCourseResourcesObj.faculty_id = streamDetails[0].faculty_id;
                // insertCourseResourcesObj.stream_status= (streamDetails[0].is_active == 1) ? 'ACTIVE': 'INACTIVE';
                insertCourseResourcesObj.stream_status = null;
            } else {
                insertCourseResourcesObj.stream_start_time = oldAppSsortments[i].live_at;
            }

            // check for duplicates
            const resourceType = oldAppSsortments[i].resource_type;
            const resourceReference = oldAppSsortments[i].resource_reference;
            const newResource = await getCourseResource(db.mysql.write, resourceType, resourceReference);
            let courseResourceID = 0;
            let isResourceCreated = 0;
            if (newResource.length > 0) {
                isResourceFound = 1;
                courseResourceID = newResource[0].id;
            } else {
                const courseResourceInsert = await insertCourseResources(db.mysql.write, insertCourseResourcesObj);
                courseResourceID = courseResourceInsert.insertId;
                isResourceCreated = 1;
            }
            console.log('iiiiii', i, oldAppSsortments[i].resource_type);
            // dont create assortments of quiz resource
            if (oldAppSsortments[i].resource_type == 7) {
                // get resource reference of resource type 4 for this resource type 7
                const oldResource = await getResurceReferenceFromOldResource(db.mysql.write, oldAppSsortments[i].liveclass_course_id, oldAppSsortments[i].old_detail_id);
                if (oldResource.length > 0) {
                    if (!_.isNull(oldResource[0].resource_id)) {
                        for (let j = 0; j < oldResource.length; j++) {
                            console.log(oldResource[j]);
                            // add quiz resource
                            const quizResourceData = {
                                assortment_id: oldResource[j].assortment_id,
                                course_resource_id: courseResourceID,
                                resource_type: 'resource',
                                name: oldAppSsortments[i].topic,
                                schedule_type: 'scheduled',
                                is_trial: 0,
                                is_replay: 0,
                                old_resource_id: 0,
                                resource_name: null,
                                batch_id: oldAppSsortments[i].batch_id,
                            };
                            await insertCourseResourceMapping(db.mysql.write, quizResourceData);
                        }
                    } else {
                        console.log(`Resource type 4 not found in new course table for course_id = ${oldAppSsortments[i].liveclass_course_id} and detail_id =${oldAppSsortments[i].old_detail_id}`);
                    }
                }
            } else {
                const allCourseResourceMappingRows = await getAllCourseResourceMappingRows(db.mysql.write, oldAppSsortments[i].assortment_id);
                let courseDetailObj = {};
                let found = false;
                let courseDetailObjChapter = {};
                if (allCourseResourceMappingRows && allCourseResourceMappingRows.length > 0) {
                    for (let k = 0; k < allCourseResourceMappingRows.length; k++) {
                        console.log(allCourseResourceMappingRows[k]);
                        const courseDetail = await getCourseDetail(db.mysql.write, allCourseResourceMappingRows[k].course_resource_id, oldAppSsortments[i].subject);
                        if (courseDetail && courseDetail.length > 0) {
                            found = true;
                            courseDetailObj = courseDetail[0];
                        } else {
                            found = false;
                        }
                        if (found) {
                            break;
                        }
                    }
                }
                if (!found) {
                    const courseDetail = await getCourseDetailNew(db.mysql.write, oldAppSsortments[i].assortment_id);
                    console.log('courseDetail');
                    console.log(courseDetail);
                    const images = await getImages(db.mysql.write, oldAppSsortments[i].subject);
                    // insert course detail and course resource mapping
                    let courseDetailInsert = {};
                    const courseDetailObjSubject = {
                        created_by: 'AS_Umang_URL',
                        display_name: oldAppSsortments[i].subject,
                        display_description: oldAppSsortments[i].subject,
                        category: courseDetail[0].category,
                        max_retail_price: courseDetail[0].max_retail_price,
                        final_price: courseDetail[0].final_price,
                        meta_info: courseDetail[0].meta_info,
                        max_limit: courseDetail[0].max_limit,
                        is_active: courseDetail[0].is_active,
                        check_okay: 1,
                        start_date: courseDetail[0].start_date,
                        end_date: courseDetail[0].end_date,
                        expiry_date: courseDetail[0].expiry_date,
                        updated_by: 'AS_Umang_URL',
                        priority: courseDetail[0].priority,
                        dn_spotlight: courseDetail[0].dn_spotlight,
                        promo_applicable: courseDetail[0].promo_applicable,
                        minimum_selling_price: courseDetail[0].minimum_selling_price,
                        parent: courseDetail[0].parent,
                        is_free: courseDetail[0].is_free,
                        assortment_type: 'subject',
                        display_icon_image: courseDetail[0].display_icon_image,
                        year_exam: courseDetail[0].year_exam,
                        category_type: courseDetail[0].category_type,
                    };
                    if (images && images.length > 0) {
                        courseDetailObjSubject.display_image_rectangle = images[0].display_image_rectangle;
                        courseDetailObjSubject.display_image_square = images[0].display_image_square;
                    }
                    for (let n = 0; n < distinctClasses.length; n++) {
                        courseDetailObjSubject.class = distinctClasses[n].class;
                        if (n == 0) {
                            courseDetailInsert = await insertCourseDetails(db.mysql.write, courseDetailObjSubject);
                        } else {
                            courseDetailObjSubject.assortment_id = courseDetailInsert.insertId;
                            await insertCourseDetails(db.mysql.write, courseDetailObjSubject);
                        }
                    }
                    const courseResourceMappingObj = {
                        assortment_id: oldAppSsortments[i].assortment_id,
                        course_resource_id: courseDetailInsert.insertId,
                        resource_type: 'assortment',
                        name: oldAppSsortments[i].subject,
                        schedule_type: 'scheduled',
                        is_trial: 0,
                        is_replay: 0,
                        old_resource_id: 0,
                        resource_name: null,
                        batch_id: oldAppSsortments[i].batch_id,
                    };
                    await insertCourseResourceMapping(db.mysql.write, courseResourceMappingObj);

                    // enter chapters also
                    let courseDetailsChapterInsert = {};
                    courseDetailObjSubject.assortment_type = 'chapter';
                    courseDetailObjSubject.is_active = 1;
                    courseDetailObjSubject.display_name = oldAppSsortments[i].master_chapter;
                    courseDetailObjSubject.display_description = oldAppSsortments[i].master_chapter;
                    console.log(courseDetailObjSubject);
                    delete courseDetailObjSubject.assortment_id;
                    for (let n = 0; n < distinctClasses.length; n++) {
                        courseDetailObjSubject.class = distinctClasses[n].class;
                        if (n == 0) {
                            courseDetailsChapterInsert = await insertCourseDetails(db.mysql.write, courseDetailObjSubject);
                        } else {
                            courseDetailObjSubject.assortment_id = courseDetailsChapterInsert.insertId;
                            await insertCourseDetails(db.mysql.write, courseDetailObjSubject);
                        }
                    }
                    // const courseDetailsChapterInsert =  await insertCourseDetails(courseDetailObjSubject);
                    console.log(courseDetailsChapterInsert);
                    const courseResourceMappingChapterObj = {
                        assortment_id: courseDetailInsert.insertId,
                        course_resource_id: courseDetailsChapterInsert.insertId,
                        resource_type: 'assortment',
                        name: oldAppSsortments[i].master_chapter,
                        schedule_type: 'scheduled',
                        is_trial: 0,
                        is_replay: 0,
                        old_resource_id: 0,
                        resource_name: null,
                        batch_id: oldAppSsortments[i].batch_id,
                    };
                    await insertCourseResourceMapping(db.mysql.write, courseResourceMappingChapterObj);
                    // enter resource details and mapping if resource alreday found otherwise enter resource as well
                    if (oldAppSsortments[i].resource_type == 4 || oldAppSsortments[i].resource_type == 8 || oldAppSsortments[i].resource_type == 1) {
                        courseDetailObjSubject.display_name = `VIDEO | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                        courseDetailObjSubject.display_description = courseDetailObjSubject.display_name;
                        courseDetailObjSubject.assortment_type = 'resource_video';
                    } else if (oldAppSsortments[i].resource_type == 2) {
                        courseDetailObjSubject.display_name = `PDF | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                        courseDetailObjSubject.display_description = courseDetailObjSubject.display_name;
                        courseDetailObjSubject.assortment_type = 'resource_pdf';
                    } else if (oldAppSsortments[i].resource_type == 9) {
                        courseDetailObjSubject.display_name = `TEST | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                        courseDetailObjSubject.display_description = courseDetailObjSubject.display_name;
                        courseDetailObjSubject.assortment_type = 'resource_test';
                    }
                    let courseDetailsResourceInsert = {};
                    delete courseDetailObjSubject.assortment_id;
                    // const courseDetailsResourceInsert = await insertCourseDetails(courseDetailObjSubject);
                    for (let n = 0; n < distinctClasses.length; n++) {
                        courseDetailObjSubject.class = distinctClasses[n].class;
                        if (n == 0) {
                            courseDetailsResourceInsert = await insertCourseDetails(db.mysql.write, courseDetailObjSubject);
                        } else {
                            courseDetailObjSubject.assortment_id = courseDetailsResourceInsert.insertId;
                            await insertCourseDetails(db.mysql.write, courseDetailObjSubject);
                        }
                    }
                    const courseResourceMappingResourceObj = {
                        assortment_id: courseDetailsChapterInsert.insertId,
                        course_resource_id: courseDetailsResourceInsert.insertId,
                        resource_type: 'assortment',
                        name: courseDetailObjSubject.display_name,
                        schedule_type: 'scheduled',
                        is_trial: 0,
                        is_replay: oldAppSsortments[i].is_replay,
                        old_resource_id: 0,
                        resource_name: null,
                        batch_id: oldAppSsortments[i].batch_id,
                    };
                    await insertCourseResourceMapping(db.mysql.write, courseResourceMappingResourceObj);
                    const courseResourceMappingResourceLastObj = {
                        assortment_id: courseDetailsResourceInsert.insertId,
                        course_resource_id: courseResourceID,
                        resource_type: 'resource',
                        name: oldAppSsortments[i].topic,
                        schedule_type: 'scheduled',
                        is_trial: oldAppSsortments[i].old_detail_id,
                        is_replay: oldAppSsortments[i].is_replay,
                        old_resource_id: oldAppSsortments[i].old_resource_id,
                        live_at: oldAppSsortments[i].live_at,
                        resource_name: null,
                        batch_id: oldAppSsortments[i].batch_id,
                    };
                    await insertCourseResourceMapping(db.mysql.write, courseResourceMappingResourceLastObj);
                } else {
                    console.log('**********SUBJECT FOUND*****************');
                    const allCourseResourceMappingRowsChapter = await getAllCourseResourceMappingRows(db.mysql.write, courseDetailObj.assortment_id);
                    let chapterFound = false;
                    for (let k = 0; k < allCourseResourceMappingRowsChapter.length; k++) {
                        console.log(allCourseResourceMappingRowsChapter[k]);
                        const courseDetail = await getCourseDetail(db.mysql.write, allCourseResourceMappingRowsChapter[k].course_resource_id, oldAppSsortments[i].master_chapter);
                        if (courseDetail && courseDetail.length > 0) {
                            chapterFound = true;
                            courseDetailObjChapter = courseDetail[0];
                        } else {
                            chapterFound = false;
                        }
                        if (chapterFound) {
                            break;
                        }
                    }
                    if (!chapterFound) {
                        console.log('**********CHAPTER NOT FOUND*****************');
                        // const courseDetail =  await getCourseDetailNew(oldAppSsortments[i].assortment_id);
                        // enter chapters also
                        let courseDetailsChapterInsert = {};
                        const courseDetailObjChapter = {
                            created_by: 'AS_Umang_Url',
                            display_name: oldAppSsortments[i].master_chapter,
                            display_description: oldAppSsortments[i].master_chapter,
                            category: courseDetailObj.category,
                            max_retail_price: courseDetailObj.max_retail_price,
                            final_price: courseDetailObj.final_price,
                            meta_info: courseDetailObj.meta_info,
                            max_limit: courseDetailObj.max_limit,
                            is_active: 1,
                            check_okay: 1,
                            start_date: courseDetailObj.start_date,
                            end_date: courseDetailObj.end_date,
                            expiry_date: courseDetailObj.expiry_date,
                            updated_by: 'AS_Umang_Url',
                            priority: courseDetailObj.priority,
                            dn_spotlight: courseDetailObj.dn_spotlight,
                            promo_applicable: courseDetailObj.promo_applicable,
                            minimum_selling_price: courseDetailObj.minimum_selling_price,
                            parent: courseDetailObj.parent,
                            is_free: courseDetailObj.is_free,
                            assortment_type: 'chapter',
                            display_icon_image: courseDetailObj.display_icon_image,
                            year_exam: courseDetailObj.year_exam,
                            category_type: courseDetailObj.category_type,
                        };
                        for (let n = 0; n < distinctClasses.length; n++) {
                            courseDetailObjChapter.class = distinctClasses[n].class;
                            if (n == 0) {
                                courseDetailsChapterInsert = await insertCourseDetails(db.mysql.write, courseDetailObjChapter);
                            } else {
                                courseDetailObjChapter.assortment_id = courseDetailsChapterInsert.insertId;
                                await insertCourseDetails(db.mysql.write, courseDetailObjChapter);
                            }
                        }
                        const courseResourceMappingChapterObj = {
                            assortment_id: courseDetailObj.assortment_id,
                            course_resource_id: courseDetailsChapterInsert.insertId,
                            resource_type: 'assortment',
                            name: oldAppSsortments[i].master_chapter,
                            schedule_type: 'scheduled',
                            is_trial: 0,
                            is_replay: 0,
                            old_resource_id: 0,
                            resource_name: null,
                            batch_id: oldAppSsortments[i].batch_id,
                        };
                        await insertCourseResourceMapping(db.mysql.write, courseResourceMappingChapterObj);
                        let courseDetailsResourceInsert = {};
                        // enter resource details and mapping if resource alreday found otherwise enter resource as well
                        if (oldAppSsortments[i].resource_type == 4 || oldAppSsortments[i].resource_type == 8 || oldAppSsortments[i].resource_type == 1) {
                            courseDetailObjChapter.display_name = `VIDEO | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                            courseDetailObjChapter.display_description = courseDetailObjChapter.display_name;
                            courseDetailObjChapter.assortment_type = 'resource_video';
                        } else if (oldAppSsortments[i].resource_type == 2) {
                            courseDetailObjChapter.display_name = `PDF | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                            courseDetailObjChapter.display_description = courseDetailObjChapter.display_name;
                            courseDetailObjChapter.assortment_type = 'resource_pdf';
                        } else if (oldAppSsortments[i].resource_type == 9) {
                            courseDetailObjChapter.display_name = `TEST | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                            courseDetailObjChapter.display_description = courseDetailObjChapter.display_name;
                            courseDetailObjChapter.assortment_type = 'resource_test';
                        }
                        // const courseDetailsResourceInsert = await insertCourseDetails(courseDetailObjChapter);
                        delete courseDetailObjChapter.assortment_id;
                        for (let n = 0; n < distinctClasses.length; n++) {
                            courseDetailObjChapter.class = distinctClasses[n].class;
                            if (n == 0) {
                                courseDetailsResourceInsert = await insertCourseDetails(db.mysql.write, courseDetailObjChapter);
                            } else {
                                courseDetailObjChapter.assortment_id = courseDetailsResourceInsert.insertId;
                                await insertCourseDetails(db.mysql.write, courseDetailObjChapter);
                            }
                        }
                        const courseResourceMappingResourceObj = {
                            assortment_id: courseDetailsChapterInsert.insertId,
                            course_resource_id: courseDetailsResourceInsert.insertId,
                            resource_type: 'assortment',
                            name: courseDetailObjChapter.display_name,
                            schedule_type: 'scheduled',
                            is_trial: 0,
                            is_replay: oldAppSsortments[i].is_replay,
                            old_resource_id: 0,
                            resource_name: null,
                            batch_id: oldAppSsortments[i].batch_id,
                        };
                        await insertCourseResourceMapping(db.mysql.write, courseResourceMappingResourceObj);
                        const courseResourceMappingResourceLastObj = {
                            assortment_id: courseDetailsResourceInsert.insertId,
                            course_resource_id: courseResourceID,
                            resource_type: 'resource',
                            name: oldAppSsortments[i].topic,
                            schedule_type: 'scheduled',
                            is_trial: oldAppSsortments[i].old_detail_id,
                            is_replay: oldAppSsortments[i].is_replay,
                            old_resource_id: oldAppSsortments[i].old_resource_id,
                            live_at: oldAppSsortments[i].live_at,
                            resource_name: null,
                            batch_id: oldAppSsortments[i].batch_id,
                        };
                        await insertCourseResourceMapping(db.mysql.write, courseResourceMappingResourceLastObj);
                    } else {
                        const allResources = await getAllCourseResources(db.mysql.write, courseDetailObjChapter.assortment_id);
                        let resRef = '';
                        if (oldAppSsortments[i].resource_type == 1 && oldAppSsortments[i].player_type == 'youtube') {
                            resRef = oldAppSsortments[i].meta_info;
                        } else if (oldAppSsortments[i].resource_type == 4 || oldAppSsortments[i].resource_type == 8 || oldAppSsortments[i].resource_type == 1) {
                            resRef = oldAppSsortments[i].resource_reference;
                        } else if (oldAppSsortments[i].resource_type == 2) {
                            resRef = oldAppSsortments[i].resource_reference;
                        } else if (oldAppSsortments[i].resource_type == 7) {
                            resRef = oldAppSsortments[i].resource_reference;
                        } else if (oldAppSsortments[i].resource_type == 9) {
                            resRef = oldAppSsortments[i].resource_reference;
                        }
                        let resFound = false;
                        let foundReference = {};
                        for (let i = 0; i < allResources.length; i++) {
                            if (resRef == allResources[i].final_reference) {
                                resFound = true;
                                foundReference = allResources[i];
                                break;
                            }
                        }
                        if (resFound) {
                            const resObj = {
                                assortment_id: foundReference.resource_assortment_id,
                                course_resource_id: courseResourceID,
                                resource_type: 'resource',
                                name: oldAppSsortments[i].topic,
                                schedule_type: 'scheduled',
                                is_trial: oldAppSsortments[i].old_detail_id,
                                is_replay: oldAppSsortments[i].is_replay,
                                old_resource_id: oldAppSsortments[i].old_resource_id,
                                live_at: oldAppSsortments[i].live_at,
                                resource_name: null,
                                batch_id: oldAppSsortments[i].batch_id,
                            };
                            await insertCourseResourceMapping(db.mysql.write, resObj);
                        } else {
                            console.log('*****************RES NOT FOUND *************************');
                            let courseDetailsResourceInsert = {};
                            const courseDetailObjRes = {
                                created_by: 'AS_Umang_Url',
                                display_name: oldAppSsortments[i].master_chapter,
                                display_description: oldAppSsortments[i].master_chapter,
                                category: courseDetailObjChapter.category,
                                max_retail_price: courseDetailObjChapter.max_retail_price,
                                final_price: courseDetailObjChapter.final_price,
                                meta_info: courseDetailObjChapter.meta_info,
                                max_limit: courseDetailObjChapter.max_limit,
                                is_active: 1,
                                check_okay: 1,
                                start_date: courseDetailObjChapter.start_date,
                                end_date: courseDetailObjChapter.end_date,
                                expiry_date: courseDetailObjChapter.expiry_date,
                                updated_by: 'AS_Umang_Url',
                                priority: courseDetailObjChapter.priority,
                                dn_spotlight: courseDetailObjChapter.dn_spotlight,
                                promo_applicable: courseDetailObjChapter.promo_applicable,
                                minimum_selling_price: courseDetailObjChapter.minimum_selling_price,
                                parent: courseDetailObjChapter.parent,
                                is_free: courseDetailObjChapter.is_free,
                                assortment_type: 'chapter',
                                display_icon_image: courseDetailObjChapter.display_icon_image,
                                year_exam: courseDetailObjChapter.year_exam,
                                category_type: courseDetailObjChapter.category_type,
                            };
                            if (oldAppSsortments[i].resource_type == 4 || oldAppSsortments[i].resource_type == 8 || oldAppSsortments[i].resource_type == 1) {
                                courseDetailObjRes.display_name = `VIDEO | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                                courseDetailObjRes.assortment_type = 'resource_video';
                            } else if (oldAppSsortments[i].resource_type == 2) {
                                courseDetailObjRes.display_name = `PDF | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                                courseDetailObjRes.assortment_type = 'resource_pdf';
                            } else if (oldAppSsortments[i].resource_type == 9) {
                                courseDetailObjRes.display_name = `TEST | ${oldAppSsortments[i].subject} | ${oldAppSsortments[i].master_chapter} | ${oldAppSsortments[i].topic}`;
                                courseDetailObjRes.assortment_type = 'resource_test';
                            }
                            for (let n = 0; n < distinctClasses.length; n++) {
                                courseDetailObjRes.class = distinctClasses[n].class;
                                if (n == 0) {
                                    courseDetailsResourceInsert = await insertCourseDetails(db.mysql.write, courseDetailObjRes);
                                } else {
                                    courseDetailObjRes.assortment_id = courseDetailsResourceInsert.insertId;
                                    await insertCourseDetails(db.mysql.write, courseDetailObjRes);
                                }
                            }
                            // const courseDetailsResourceInsert = await insertCourseDetails(courseDetailObjRes);
                            const courseResourceMappingResourceObj = {
                                assortment_id: courseDetailObjChapter.assortment_id,
                                course_resource_id: courseDetailsResourceInsert.insertId,
                                resource_type: 'assortment',
                                name: courseDetailObjChapter.display_name,
                                schedule_type: 'scheduled',
                                is_trial: 0,
                                is_replay: oldAppSsortments[i].is_replay,
                                old_resource_id: 0,
                                resource_name: null,
                                batch_id: oldAppSsortments[i].batch_id,
                            };
                            await insertCourseResourceMapping(db.mysql.write, courseResourceMappingResourceObj);
                            const courseResourceMappingResourceLastObj = {
                                assortment_id: courseDetailsResourceInsert.insertId,
                                course_resource_id: courseResourceID,
                                resource_type: 'resource',
                                name: oldAppSsortments[i].topic,
                                schedule_type: 'scheduled',
                                is_trial: oldAppSsortments[i].old_detail_id,
                                is_replay: oldAppSsortments[i].is_replay,
                                old_resource_id: oldAppSsortments[i].old_resource_id,
                                live_at: oldAppSsortments[i].live_at,
                                resource_name: null,
                                batch_id: oldAppSsortments[i].batch_id,
                            };
                            await insertCourseResourceMapping(db.mysql.write, courseResourceMappingResourceLastObj);
                        }
                    }
                }
            }
            // update is_processed and is_resource created field
            // insert in liveclass_course_backup
            await updateLiveclassCourseResource(db.mysql.write, { is_processed: 1, is_resource_created: isResourceCreated }, oldAppSsortments[i].old_resource_id);
            // cache clear part
            cacheClearWrapper(db, oldAppSsortments[i]);
        }
        console.log('ssss');
        return 1;
    } catch (e) {
        return e;
    }
}

module.exports = {
    main,
};
