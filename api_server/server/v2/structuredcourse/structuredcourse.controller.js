const _ = require('lodash');
const Utility = require('../../../modules/utility');
let StructuredCourse = require('../../../modules/mysql/structuredCourse');
const ETStructuredCourse = require('../../../modules/mysql/eStructuredCourse');
const Data = require('../../../data/data');

let db;
let config;

async function getTodaysData(req, res, next) {
    let dateUTC = new Date();
    dateUTC = dateUTC.getTime();
    const dateIST = new Date(dateUTC);
    dateIST.setHours(dateIST.getHours() + 5);
    dateIST.setMinutes(dateIST.getMinutes() + 30);
    const today = dateIST;

    const nowTime = new Date(today).getTime() / 1000;

    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id } = req.user;
        const { student_class } = req.user;
        const { version_code } = req.headers;
        let { id } = req.params;
        let { subject } = req.params;
        const returnRes = [];
        let banner_link = '';
        const promise = [];
        if (subject.toLowerCase() == 'default') {
            subject = 'PHYSICS';
        }
        console.log('Data.etoos_version')
        console.log(Data.etoos_version)
        // if(version_code > Data.etoos_version) {
        //     StructuredCourse = ETStructuredCourse;
        // }
        console.log("student_class")
        console.log(student_class)
        if (id == 0) {
            const highestId = await StructuredCourse.getStrucredCourseDetails(db.mysql.read);
            id = highestId[0].id;
            banner_link = highestId[0].banner;
        } else {
            promise.push(StructuredCourse.getStrucredCourseDetailsById(id, db.mysql.read));
        }
        promise.push(StructuredCourse.getTodaysTopic(id, subject, student_class, db.mysql.read));
        promise.push(StructuredCourse.getTodaysPdf(id, subject, student_class, db.mysql.read));
        promise.push(StructuredCourse.getCourseStructure(id, subject, student_class, db.mysql.read));

        const result = await Promise.all(promise);
        console.log(`hi${result[1]}`);
        if (banner_link == '') {
            banner_link = result[0][0].banner;
        }

        returnRes.push({ type: 'banner', image_url: banner_link });

        if (version_code >= 636) {
            const subReturn = [];
            const subList = ['Physics', 'Chemistry', 'Maths'];
            for (let subc = 0; subc < subList.length; subc++) {
                if (subject.toLowerCase() == subList[subc].toLowerCase()) {
                    subReturn.push({
                        display: subList[subc], value: subList[subc].toUpperCase(), is_selected: true,
                    });
                } else {
                    subReturn.push({
                        display: subList[subc], value: subList[subc].toUpperCase(), is_selected: false,
                    });
                }
            }

            returnRes.push({
                type: 'filter',
                list: subReturn,
            });
        } else {
            returnRes.push({
                type: 'filter',
                list: [
                    { display: 'Physics', value: 'PHYSICS' },
                    { display: 'Chemistry', value: 'CHEMISTRY' },
                    { display: 'Maths', value: 'MATHS' },
                ],
            });
        }

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
                const videoViewStats = await StructuredCourse.getVideoViewStats(result[todaysIndex][i].qid, student_id, db.mysql.read);
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
            if (version_code >= 636) {
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

        if (version_code >= 636) {
            const pdfList = [];

            for (let j = 0; j < result[pdfIndex].length; j++) {
                if (result[pdfIndex][j].resource_type == 1) {
                    pdfList.push({
                        display: 'Notes',
                        image_url: `${config.staticCDN}images/notes-pdf-icon.png`,
                        pdf_link: result[pdfIndex][j].resource_reference,
                    });
                } else if (result[pdfIndex][j].resource_type == 2) {
                    pdfList.push({
                        display: 'Practice Questions',
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
        console.log('abc')
        const qList2 = [];
        let count = 0;
        for (let k = 0; k < result[courseIndex].length; k++) {
        // for (let k = 0; k < 5; k++) {
            console.log('xyz')
            console.log(result[courseIndex][k])
            const courseStructureQuestions = await StructuredCourse.getCourseStructureDetails(id, subject, result[courseIndex][k].id, db.mysql.read);

            let statusThis = 0;
            let totalDuration = 0;
            let upcoming = 0;
            let completed = 0;
            let completedWatched = 0;
            let finishedAll = 0;
            let finishedAllWatched = 0;

            let mockStatus = 0; let mockText; let mockTotalQuestions; let mockDuration; let mockFlag = 0; let mockTestId; let mockRuleId; let
                lectureCount = 0;

            console.log('courseStructureQuestions')
            console.log(courseStructureQuestions)

            for (let j = 0; j < courseStructureQuestions.length; j++) {
                if (courseStructureQuestions[j].resource_type == 0 && courseStructureQuestions[j].q_order !== 1) {
                // if (courseStructureQuestions[j].resource_type == 0) {
                    lectureCount++;
                    totalDuration += parseInt(courseStructureQuestions[j].duration);
                    const videoViewStats = await StructuredCourse.getVideoViewStats(courseStructureQuestions[j].qid, student_id, db.mysql.read);

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
                    const mockTestDetails = await StructuredCourse.getMockTestDetails(courseStructureQuestions[j].resource_reference, student_id, db.mysql.read);
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

            console.log('lectureCount')
            console.log(lectureCount)

            if (lectureCount > 0) {
                if (version_code >= 636) {
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


module.exports = { getTodaysData };
