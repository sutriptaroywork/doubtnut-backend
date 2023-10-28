/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
const Liveclass = require('../../../modules/mysql/liveclass');
const StructuredCourse = require('../../../modules/mysql/eStructuredCourse');
const Utility = require('../../../modules/utility');
const LiveclassHelper = require('../../helpers/liveclass');

function getBarColor(subject) {
    const colorMap = {
        PHYSICS: '#21ca87',
        BIOLOGY: '#6236ff',
        CHEMISTRY: '#f4ac3e',
        MATHS: '#ea532e',
        ENGLISH: '#1da0f4',
        SCIENCE: '#ff6e00',
    };
    return colorMap[subject];
}

async function getSubjectFilters(db, courseID) {
    try {
        const subList = await Liveclass.getSubjectsList(db.mysql.read, courseID);
        const subReturn = [];
        subReturn.push({
            display: 'ALL',
            value: '0',
            is_selected: true,
            selected_color: '#FFFFFF',
        });
        for (let i = 0; i < subList.length; i++) {
            if (subList[i].subject !== 'ALL') {
                subReturn.push({
                    display: subList[i].subject, value: subList[i].subject, is_selected: false, selected_color: getBarColor(subList[i].subject.toUpperCase()),
                });
            }
        }
        return {
            type: 'filter',
            list: subReturn,
        };
    } catch (e) {
        throw new Error(e);
    }
}

async function getLiveSectionData(data) {
    try {
        const {
            db,
            config,
            courseID,
            courseType,
            subject,
            type,
            isVip,
            paymentCardState,
            studentClass,
        } = data;
        const result = await Liveclass.getLiveSection(db.mysql.read, courseID, courseType, subject, studentClass);
        const dataToReturn = await LiveclassHelper.generateFreeclassGrid({
            data: result,
            caraousel: type,
            db,
            config,
            bottomInfo: 0,
            isVip,
            paymentCardState,
        });
        return dataToReturn;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}
// legacy function will refactor in v2
async function generateMockTest(db, detailData, studentID, dayTimeData) {
    try {
        let dateUTC = new Date();
        dateUTC = dateUTC.getTime();
        const dateIST = new Date(dateUTC);
        dateIST.setHours(dateIST.getHours() + 5);
        dateIST.setMinutes(dateIST.getMinutes() + 30);
        const today = dateIST;
        const nowTime = new Date(today).getTime() / 1000;
        let mockStatus = 0;
        const mockTestDetails = await StructuredCourse.getMockTestDetails(detailData.resource_reference, studentID, db.mysql.read);
        if (nowTime < parseInt(new Date(detailData.live_at).getTime() / 1000)) {
            mockStatus = 5;
        } else if (nowTime >= parseInt(new Date(detailData.live_at).getTime() / 1000) && nowTime <= (parseInt(new Date(detailData.live_at).getTime() / 1000) + parseInt(detailData.duration))) {
            if (mockTestDetails[0].status != undefined) {
                if (mockTestDetails[0].status == 'SUBSCRIBED') {
                    mockStatus = 2;
                } else if (mockTestDetails[0].status == 'COMPLETED') {
                    mockStatus = 1;
                }
            } else {
                mockStatus = 2;
            }
        } else if (nowTime > (parseInt(new Date(detailData.live_at).getTime() / 1000) + parseInt(detailData.duration))) {
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
        const obj = {
            type: 'mock-test',
            mock_test_id: detailData.resource_reference,
            rule_id: mockTestDetails[0].rule_id,
            text: detailData.topic,
            total_questions: mockTestDetails[0].no_of_questions,
            status: mockStatus,
            duration: parseInt(mockTestDetails[0].duration_in_min) * 60,
            live_at: detailData.live_at,
            day_text: dayTimeData.day,
            time_text: dayTimeData.time,
        };
        return obj;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function getDayList(data) {
    const groups = _.groupBy(data, (item) => moment(item.live_at).startOf('day'));
    let i = 1;
    const result = _.map(groups, (value, key) => ({ live_at: new Date(key), day: i++ }));
    return result;
}

async function getStructuredCourse(data) {
    try {
        const {
            db,
            courseID,
            courseType,
            subject,
            studentID,
        } = data;
        const result = await Liveclass.getDetailList(db.mysql.read, courseID, courseType, subject);
        const dayList = getDayList(result);
        const list = []; const past = []; const upcoming = [];
        for (let i = 0; i < result.length; i++) {
            const dayTimeData = Utility.getStructuredCourseDayTime(result[i].live_at);
            let obj = {};
            const l = result[i].live_at;
            if (result[i].resource_type === 9) {
                obj = await generateMockTest(db, result[i], studentID, dayTimeData);
            } else {
                obj.type = 'lecture';
                obj.day = dayList.filter((e) => new Date(e.live_at).getTime() === new Date(l.getFullYear(), l.getMonth(), l.getDate(), 0, 0, 0).getTime())[0].day;
                obj.course_id = result[i].liveclass_course_id;
                obj.course_details_id = result[i].liveclass_course_detail_id;
                obj.text = result[i].chapter;
                obj.status = 4;
                obj.duration = result[i].duration;
                obj.day_text = dayTimeData.day;
                obj.time_text = dayTimeData.time;
                obj.event = 'detail_live_classes';
                obj.page_data = {};
                obj.page_data.course_id = result[i].liveclass_course_id;
                obj.page_data.course_detail_id = result[i].liveclass_course_detail_id;
                obj.page_data.subject = result[i].subject;
            }
            if (result[i].live_at < moment().add(5, 'hours').add(30, 'minutes'))past.push(obj);
            else upcoming.push(obj);
        }
        list.push(past);
        list.push(upcoming);
        return list;
    } catch (e) {
        throw new Error(e);
    }
}
function generateDetailPageResponse(subjectFilters, liveSection, course) {
    const list = [];
    // banner object
    list.push({
        type: 'banner',
        image_url: null,
    });
    liveSection.title = 'LIVE SECTION';
    list.push(subjectFilters);
    list.push({
        type: 'todays_topic',
        title: 'Today\'s Topic',
        list: [],
    });
    list.push({
        type: 'course_structure',
        title: 'Course Structure',
        title2: 'Upcoming',
        title1: 'Previous',
        list: course[0].reverse(),
        list2: course[1],
    });
    return { live_widgets: { widgets: [liveSection] }, list };
}

function generateResourcePageResponse(resourceList, config, paymentCardState, versionCode) {
    const resourceWidget = {};
    resourceWidget.type = 'resource_list';
    resourceWidget.data = {};
    resourceWidget.data.items = [];

    const lectureWidget = {};
    lectureWidget.type = 'lecture_list';
    lectureWidget.data = {};
    lectureWidget.data.items = [];
    const bannerWidget = {
        type: 'banner_image',
        data: {
            image_url: null,
        },
    };
    let videoResourceCount = 0;
    for (let i = 0; i < resourceList.length; i++) {
        const obj = {};
        if (_.includes([1, 4, 8], resourceList[i].resource_type)) {
            if (!((resourceList[i].resource_type == 4 && (moment(resourceList[i].live_at) < moment().add(5, 'hours').add(30, 'minutes'))) && !(!_.isNull(resourceList[i].is_active) && (resourceList[i].is_active == 1)))) {
                const dayTimeData = Utility.getStructuredCourseDayTime(resourceList[i].live_at);
                obj.resource_type = resourceList[i].resource_type;
                obj.player_type = resourceList[i].player_type;
                obj.title = resourceList[i].topic;
                obj.status = 4;
                obj.resource_reference = resourceList[i].resource_reference;
                obj.subject = resourceList[i].subject;
                obj.is_live = false;
                if (!_.isNull(resourceList[i].is_active) && (resourceList[i].is_active == 1)) {
                    obj.is_live = true;
                }
                if (resourceList[i].resource_type == 1 && resourceList[i].player_type == 'livevideo') {
                    obj.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(resourceList[i].live_at);
                }
                obj.image_url = `${config.staticCDN}q-thumbnail/${resourceList[i].resource_reference}.png`;
                if (resourceList[i].resource_type === 1 && resourceList[i].player_type === 'youtube') {
                    obj.image_url = `${config.staticCDN}q-thumbnail/${resourceList[i].meta_info}.png`;
                    if (!_.isNull(resourceList[i].meta_info)) {
                        obj.resource_reference = resourceList[i].meta_info;
                        obj.player_type = 'video';
                    }
                }
                obj.duration = resourceList[i].duration;
                obj.live_at = resourceList[i].live_at;
                obj.daytime_text = `${dayTimeData.day} | ${dayTimeData.time}`;
                obj.faculty = `By ${resourceList[i].faculty_name}`;
                obj.topic_list = resourceList[i].topic.split('|');
                obj.is_premium = (resourceList[i].is_free === 0 && versionCode > 752);
                obj.is_vip = paymentCardState.isVip;
                obj.id = resourceList[i].resource_reference;
                obj.page = 'STRUCTURED';
                if (resourceList[i].resource_type == 4) {
                    obj.page = 'LIVECLASS';
                }
                videoResourceCount += 1;
                lectureWidget.data.items.push(obj);
            }
        } else if (_.includes([2, 3], resourceList[i].resource_type)) {
            obj.resource_type = resourceList[i].resource_type;
            obj.title = resourceList[i].topic;
            obj.id = resourceList[i].resource_reference;
            obj.image_url = `${config.staticCDN}images/practise-pdf-icon.png`;
            obj.is_premium = (resourceList[i].is_free === 0 && versionCode > 752);
            obj.is_vip = paymentCardState.isVip;
            resourceWidget.data.items.push(obj);
        }
    }
    lectureWidget.data.title = `${resourceList[0].chapter} (${videoResourceCount} videos)`;
    const widgets = {};
    widgets.widgets = [];
    widgets.widgets.push(resourceWidget);
    widgets.widgets.push(lectureWidget);
    widgets.widgets.push(bannerWidget);
    return widgets;
}

module.exports = {
    getSubjectFilters,
    getLiveSectionData,
    getStructuredCourse,
    generateDetailPageResponse,
    generateResourcePageResponse,
};
