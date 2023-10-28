/* eslint-disable no-await-in-loop */
const Utility = require('../../../modules/utility');
const StructuredCourse = require('../../../modules/mysql/eStructuredCourse');
const CourseHelper = require('../../v2/course/course.helper');
const AppBannerContainer = require('../../../modules/containers/appBanner');

let db;
async function getTodaysData(req, res, next) {
    try {
        let dateUTC = new Date();
        dateUTC = dateUTC.getTime();
        const dateIST = new Date(dateUTC);
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        const today = dateIST;
        const nowTime = new Date(today).getTime() / 1000;
        db = req.app.get('db');
        const config = req.app.get('config');
        const studentID = req.user.student_id;
        const studentClass = req.user.student_class;
        const versionCode = req.headers.version_code;
        let { id } = req.params;
        let { subject } = req.params;
        const returnRes = [];
        let bannerLink = '';
        const promise = [];
        const subjectList = await StructuredCourse.getSubjectsList(db.mysql.read, id);
        const subReturn = []; const subList = [];
        for (let sub = 0; sub < subjectList.length; sub++) {
            if (subject.toLowerCase() == 'default' && sub == 0) {
                subject = subjectList[sub].subject;
            }
            subList.push(subjectList[sub].subject);
        }
        for (let subc = 0; subc < subList.length; subc++) {
            if (subject.toLowerCase() == subList[subc].toLowerCase()) {
                subReturn.push({
                    display: subList[subc], value: subList[subc].toUpperCase(), is_selected: true, selected_color: CourseHelper.getBarColor(subList[subc].toUpperCase()),
                });
            } else {
                subReturn.push({
                    display: subList[subc], value: subList[subc].toUpperCase(), is_selected: false, selected_color: CourseHelper.getBarColor(subList[subc].toUpperCase()),
                });
            }
        }

        if (id == 0) {
            const highestId = await StructuredCourse.getStrucredCourseDetails(db.mysql.read);
            id = highestId[0].id;
            bannerLink = highestId[0].banner;
        } else {
            promise.push(StructuredCourse.getStrucredCourseDetailsById(id, db.mysql.read));
        }
        promise.push(StructuredCourse.getTodaysTopic(id, subject, studentClass, db.mysql.read));
        promise.push((async () => [])());
        promise.push(StructuredCourse.getCourseStructure(id, subject, studentClass, db.mysql.read));

        const result = await Promise.all(promise);
        if (bannerLink == '') {
            bannerLink = result[0][0].banner;
        }

        returnRes.push({ type: 'banner', image_url: null });

        returnRes.push({
            type: 'filter',
            list: subReturn,
        });

        const qList = [];

        let todaysIndex; let pdfIndex; let
            courseIndex;
        if (result.length == 3) {
            todaysIndex = 0;
            pdfIndex = 1;
            courseIndex = 2;
        } else {
            todaysIndex = 1;
            pdfIndex = 2;
            courseIndex = 3;
        }

        for (let i = 0; i < result[todaysIndex].length; i++) {
            let statusThis = 0;
            if (result[todaysIndex][i].q_order == 1) {
                statusThis = 1;
            } else {
                const videoViewStats = await StructuredCourse.getVideoViewStats(result[todaysIndex][i].qid, studentID, db.mysql.read);
                if (nowTime < parseInt(new Date(result[todaysIndex][i].live_at).getTime() / 1000)) {
                    statusThis = 5;
                } else if (nowTime >= parseInt(new Date(result[todaysIndex][i].live_at).getTime() / 1000) && nowTime <= (parseInt(new Date(result[todaysIndex][i].live_at).getTime() / 1000) + parseInt(result[todaysIndex][i].duration))) {
                    if (videoViewStats.length > 0) {
                        statusThis = 2;
                    } else {
                        statusThis = 1;
                    }
                } else if (nowTime > (parseInt(new Date(result[todaysIndex][i].live_at).getTime() / 1000) + parseInt(result[todaysIndex][i].duration))) {
                    if (videoViewStats.length > 0) {
                        statusThis = 3;
                    } else {
                        statusThis = 4;
                    }
                }
            }

            const dayTimeData = Utility.getStructuredCourseDayTime(result[todaysIndex][i].live_at);

            const typeText = 'lecture';
            if (versionCode >= 636) {
                qList.push({
                    type: typeText,
                    status: statusThis,
                    qid: result[todaysIndex][i].qid,
                    structured_course_id: parseInt(id),
                    structured_course_details_id: result[todaysIndex][i].structured_course_details_id,
                    subject: result[todaysIndex][i].subject,
                    video_url: result[todaysIndex][i].video_url,
                    youtube_id: result[todaysIndex][i].youtube_id,
                    image_url: result[todaysIndex][i].image_url,
                    duration: result[todaysIndex][i].duration,
                    live_at: result[todaysIndex][i].live_at,
                    day_text: dayTimeData.day,
                    time_text: dayTimeData.time,
                    event: 'youtube_video',
                    page_data: {
                        question_id: result[todaysIndex][i].qid,
                        video_youtube_id: result[todaysIndex][i].youtube_id,
                        page: 'STRUCTURED',
                    },
                });
            } else {
                qList.push({
                    type: typeText,
                    status: statusThis,
                    qid: result[todaysIndex][i].qid,
                    structured_course_id: parseInt(id),
                    structured_course_details_id: result[todaysIndex][i].structured_course_details_id,
                    subject: result[todaysIndex][i].subject,
                    video_url: result[todaysIndex][i].video_url,
                    youtube_id: result[todaysIndex][i].youtube_id,
                    image_url: result[todaysIndex][i].image_url,
                    duration: result[todaysIndex][i].duration,
                    live_at: result[todaysIndex][i].live_at,
                    day_text: dayTimeData.day,
                    time_text: dayTimeData.time,
                });
            }
        }

        returnRes.push({
            type: 'todays_topic',
            title: "Today's Topic",
            list: qList,
        });

        if (versionCode >= 636) {
            const pdfList = [];

            for (let j = 0; j < result[pdfIndex].length; j++) {
                if (result[pdfIndex][j].resource_type == 1) {
                    pdfList.push({
                        display: result[pdfIndex][j].topic,
                        image_url: `${config.staticCDN}images/notes-pdf-icon.png`,
                        pdf_link: result[pdfIndex][j].resource_reference,
                    });
                } else if (result[pdfIndex][j].resource_type == 2) {
                    pdfList.push({
                        display: result[pdfIndex][j].topic,
                        image_url: `${config.staticCDN}images/practise-pdf-icon.png`,
                        pdf_link: result[pdfIndex][j].resource_reference,
                    });
                }
            }

            if (pdfList.length != 0) {
                returnRes.push({
                    type: 'todays_pdf',
                    list: pdfList,
                });
            }
        }
        const qList2 = [];
        let count = 0;
        let courseStructureQuestions = [];
        for (let k = 0; k < result[courseIndex].length; k++) {
            courseStructureQuestions = await StructuredCourse.getCourseStructureDetails(id, subject, result[courseIndex][k].id, db.mysql.read);

            let statusThis = 0;
            let totalDuration = 0;
            let upcoming = 0;
            let completed = 0;
            let completedWatched = 0;
            let finishedAll = 0;
            let finishedAllWatched = 0;

            let mockStatus = 0; let mockText; let mockTotalQuestions; let mockDuration; let mockFlag = 0; let mockTestId; let mockRuleId; let
                lectureCount = 0;

            for (let j = 0; j < courseStructureQuestions.length; j++) {
                if (courseStructureQuestions[j].resource_type == 0) {
                    lectureCount++;
                    totalDuration += parseInt(courseStructureQuestions[j].duration);
                    const videoViewStats = await StructuredCourse.getVideoViewStats(courseStructureQuestions[j].qid, studentID, db.mysql.read);

                    if (nowTime < parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000)) {
                        upcoming++;
                    } else if (nowTime >= parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000) && nowTime <= (parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000) + parseInt(courseStructureQuestions[j].duration))) {
                        if (videoViewStats.length > 0) {
                            completedWatched++;
                        } else {
                            completed++;
                        }
                    } else if (nowTime > (parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000) + parseInt(courseStructureQuestions[j].duration))) {
                        if (videoViewStats.length > 0) {
                            finishedAllWatched++;
                        } else {
                            finishedAll++;
                        }
                    }
                } else if (courseStructureQuestions[j].resource_type == 3) {
                    mockFlag = 1;
                    const mockTestDetails = await StructuredCourse.getMockTestDetails(courseStructureQuestions[j].resource_reference, studentID, db.mysql.read);
                    mockTotalQuestions = mockTestDetails[0].no_of_questions;
                    mockDuration = parseInt(mockTestDetails[0].duration_in_min) * 60;

                    if (nowTime < parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000)) {
                        mockStatus = 5;
                    } else if (nowTime >= parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000) && nowTime <= (parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000) + parseInt(courseStructureQuestions[j].duration))) {
                        if (mockTestDetails[0].status != undefined) {
                            if (mockTestDetails[0].status == 'SUBSCRIBED') {
                                mockStatus = 2;
                            } else if (mockTestDetails[0].status == 'COMPLETED') {
                                mockStatus = 1;
                            }
                        } else {
                            mockStatus = 2;
                        }
                    } else if (nowTime > (parseInt(new Date(courseStructureQuestions[j].live_at).getTime() / 1000) + parseInt(courseStructureQuestions[j].duration))) {
                        if (mockTestDetails[0].status != undefined) {
                            if (mockTestDetails[0].status == 'SUBSCRIBED') {
                                mockStatus = 4;
                            } else if (mockTestDetails[0].status == 'COMPLETED') {
                                mockStatus = 3;
                            }
                        } else {
                            mockStatus = 4;
                        }
                    }
                    mockText = courseStructureQuestions[j].topic;
                    mockTestId = courseStructureQuestions[j].resource_reference;
                    mockRuleId = mockTestDetails[0].rule_id;
                } else if (courseStructureQuestions[j].resource_type == 4) {
                    qList2.push({
                        type: 'liveclass',
                        course_id: result[courseIndex][k].structured_course_id,
                        course_details_id: courseStructureQuestions[j].structured_course_details_id,
                        live_at: courseStructureQuestions[j].live_at,
                        text: courseStructureQuestions[j].topic,
                        expert_name: courseStructureQuestions[j].expert_name,
                        expert_image: courseStructureQuestions[j].expert_image,
                        image_url: courseStructureQuestions[j].image_url,
                    });
                }
            }

            const dayTimeData = Utility.getStructuredCourseDayTime(result[courseIndex][k].live_at);

            if (upcoming != 0) {
                statusThis = 7;
            } else if (upcoming == 0 && (completed != 0 || completedWatched != 0)) {
                if (completed == courseStructureQuestions.length) {
                    statusThis = 1;
                } else if (completedWatched == courseStructureQuestions.length) {
                    statusThis = 3;
                } else {
                    statusThis = 2;
                }
            } else if (upcoming == 0 && completed == 0 && completedWatched == 0 && (finishedAll != 0 || finishedAllWatched != 0)) {
                if (finishedAll == courseStructureQuestions.length) {
                    statusThis = 4;
                } else if (finishedAllWatched == courseStructureQuestions.length) {
                    statusThis = 5;
                } else {
                    statusThis = 6;
                }
            }

            count++;

            if (lectureCount > 0) {
                if (versionCode >= 636) {
                    qList2.push({
                        type: 'lecture',
                        day: count,
                        course_id: result[courseIndex][k].structured_course_id,
                        course_details_id: result[courseIndex][k].id,
                        text: result[courseIndex][k].chapter,
                        status: statusThis,
                        duration: totalDuration,
                        live_at: result[courseIndex][k].live_at,
                        day_text: dayTimeData.day,
                        time_text: dayTimeData.time,
                        event: 'detail_live_classes',
                        page_data: {
                            course_id: result[courseIndex][k].structured_course_id,
                            course_detail_id: result[courseIndex][k].id,
                            subject,
                        },
                    });
                } else {
                    qList2.push({
                        type: 'lecture',
                        day: count,
                        course_id: result[courseIndex][k].structured_course_id,
                        course_details_id: result[courseIndex][k].id,
                        text: result[courseIndex][k].chapter,
                        status: statusThis,
                        duration: totalDuration,
                        live_at: result[courseIndex][k].live_at,
                        day_text: dayTimeData.day,
                        time_text: dayTimeData.time,
                    });
                }
            }

            if (mockFlag == 1) {
                qList2.push({
                    type: 'mock-test',
                    mock_test_id: mockTestId,
                    rule_id: mockRuleId,
                    text: mockText,
                    total_questions: mockTotalQuestions,
                    status: mockStatus,
                    duration: mockDuration,
                    live_at: result[courseIndex][k].live_at,
                    day_text: dayTimeData.day,
                    time_text: dayTimeData.time,
                });
            }
        }

        returnRes.push({
            type: 'course_structure',
            title: 'Course Structure',
            list: qList2,
        });

        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data: returnRes,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}
async function getCourseDetails(req, res, next) {
    try {
        let dateUTC = new Date();
        dateUTC = dateUTC.getTime();
        const dateIST = new Date(dateUTC);
        // date shifting for IST timezone (+5 hours and 30 minutes)
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        const today = dateIST;
        const nowTime = new Date(today).getTime() / 1000;
        const versionCode = req.headers.version_code;
        db = req.app.get('db');
        const config = req.app.get('config');
        const studentID = req.user.student_id;
        const studentClass = req.user.student_class;
        const courseID = req.params.course_id;
        const detailsID = req.params.details_id;

        const promise = [];
        promise.push(StructuredCourse.getCoursePdfByIds(courseID, detailsID, studentClass, db.mysql.read));
        promise.push(StructuredCourse.getCourseDetailsByIds(courseID, detailsID, db.mysql.read));
        promise.push(StructuredCourse.getCourseDetailsByDetailId(detailsID, db.mysql.read));
        promise.push(StructuredCourse.getStrucredCourseDetailsById(courseID, db.mysql.read));
        promise.push(AppBannerContainer.getPromotionalData(db, studentClass, 'STRUCTURED_COURSE', versionCode));
        const result = await Promise.all(promise);

        const pdfList = [];

        for (let j = 0; j < result[0].length; j++) {
            if (result[0][j].resource_type == 1) {
                pdfList.push({
                    name: result[0][j].topic,
                    image: `${config.staticCDN}images/notes-pdf-icon.png`,
                    pdf_link: result[0][j].resource_reference,
                });
            } else if (result[0][j].resource_type == 2) {
                pdfList.push({
                    name: result[0][j].topic,
                    image: `${config.staticCDN}images/practise-pdf-icon.png`,
                    pdf_link: result[0][j].resource_reference,
                });
            }
        }

        const qList = [];

        let liveFlag = 0;
        let timer = 0;

        for (let i = 0; i < result[1].length; i++) {
            let statusThis = 0;
            const videoViewStats = await StructuredCourse.getVideoViewStats(result[1][i].qid, studentID, db.mysql.read);
            const dayTimeData = Utility.getStructuredCourseDayTime(result[1][i].live_at);
            if (nowTime < parseInt(new Date(result[1][i].live_at).getTime() / 1000)) { // upcoming
                if (dayTimeData.day == 'Today') {
                    liveFlag = 1;
                    timer = Math.ceil(parseInt(new Date(result[1][i].live_at).getTime() / 1000) - nowTime);
                }
                statusThis = 5;
            } else if (nowTime >= parseInt(new Date(result[1][i].live_at).getTime() / 1000) && nowTime <= (parseInt(new Date(result[1][i].live_at).getTime() / 1000) + parseInt(result[1][i].duration))) { // live video
                if (videoViewStats.length > 0) {
                    statusThis = 2;
                } else {
                    statusThis = 1;
                }
            } else if (nowTime > (parseInt(new Date(result[1][i].live_at).getTime() / 1000) + parseInt(result[1][i].duration))) { // finished live video
                if (videoViewStats.length > 0) {
                    statusThis = 3;
                } else {
                    statusThis = 4;
                }
            }

            const topicList = result[1][i].topic.split('|');
            if (courseID == 3 || courseID == 4) {
                const playlistID = (studentClass == 12 ? 116507 : 116508);
                if (i == 1 && versionCode >= 636) {
                    qList.push({
                        type: 'banner',
                        image_url: `${config.staticCDN}images/structured-3rd-screen-banner.webp`,
                        action_activity: 'playlist',
                        action_data: { playlist_id: playlistID, playlist_title: 'Score 180+ in JEE Mains', is_last: 1 },
                        size: '1x',
                        class: '11',
                        page_type: 'STRUCTURED_COURSE',
                        banner_order: 1,
                        position: 0,
                    });
                }
            }
            if (versionCode >= 636) {
                qList.push({
                    type: 'lecture',
                    title: result[1][i].chapter,
                    status: statusThis,
                    qid: result[1][i].qid,
                    image_url: result[1][i].image_url,
                    duration: result[1][i].duration,
                    youtube_id: result[1][i].youtube_id,
                    live_at: result[1][i].live_at,
                    day_text: dayTimeData.day,
                    time_text: dayTimeData.time,
                    topic_list: topicList,
                    resource_type: 'video',
                    event: result[1][i].player_type,
                    page_data: {
                        question_id: result[1][i].qid,
                        video_youtube_id: result[1][i].youtube_id,
                        page: 'STRUCTURED',
                    },
                });
            } else {
                qList.push({
                    type: 'lecture',
                    title: result[1][i].chapter,
                    status: statusThis,
                    qid: result[1][i].qid,
                    image_url: result[1][i].image_url,
                    duration: result[1][i].duration,
                    youtube_id: result[1][i].youtube_id,
                    live_at: result[1][i].live_at,
                    day_text: dayTimeData.day,
                    time_text: dayTimeData.time,
                    topic_list: topicList,
                    resource_type: 'video',
                });
            }
        }

        if (courseID == 3 || courseID == 4) {
            const playlistID2 = (studentClass == 12 ? 116507 : 116508);
            if (result[1].length == 1 && versionCode >= 636) {
                qList.push({
                    type: 'banner',
                    image_url: `${config.staticCDN}images/structured-3rd-screen-banner.webp`,
                    action_activity: 'playlist',
                    action_data: { playlist_id: playlistID2, playlist_title: 'Score 180+ in JEE Mains', is_last: 1 },
                    size: '1x',
                    class: '11',
                    page_type: 'LIVECLASS',
                    banner_order: 1,
                    position: 0,
                });
            }
        }
        let returnRes = {};
        if (courseID == 3 || courseID == 4) {
            returnRes = {
                chapter_name: result[2][0].chapter,
                video_count: qList.length - 1,
                live_status: liveFlag,
            };
        } else {
            returnRes = {
                chapter_name: result[2][0].chapter,
                video_count: qList.length,
                live_status: liveFlag,
            };
        }
        if (liveFlag == 1) {
            returnRes.timer = timer * 1000;
        }
        returnRes.pdf_list = pdfList;
        returnRes.questions = qList;

        const responseData = {
            meta: {
                code: 200,
                message: 'SUCCESS',
            },
            data: returnRes,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        next(e);
    }
}

module.exports = { getTodaysData, getCourseDetails };
