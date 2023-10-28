/* eslint-disable no-await-in-loop */
const moment = require('moment');
const axios = require('axios');
const _ = require('lodash');
const LibraryMysql = require('../../modules/mysql/library');
const CourseContainerV2 = require('../../modules/containers/coursev2');
const AnswerContainer = require('../../modules/containers/answer');
const Data = require('../../data/data');
const LiveclassData = require('../../data/liveclass.data');
const AnswerContainerv13 = require('../v13/answer/answer.container');
const { buildStaticCdnUrl } = require('./buildStaticCdnUrl');
const randomNumberGenerator = require('../../modules/randomNumberGenerator');
const SchedulerRedis = require('../../modules/redis/scheduler');
const SchedulerMysql = require('../../modules/mysql/scheduler');
const redisUtility = require('../../modules/redis/utility.redis');

function getSlotkey(playlistId) {
    const currentDate = moment().add(5, 'h').add(30, 'minutes').format('DD-MM-YYYY');
    const currentDay = moment().add(5, 'h').add(30, 'minutes').format('ddd');
    const hour = moment().add(5, 'h').add(30, 'minutes').hour();
    // const hour = 15;
    return `LIVECLASS_SCHEDULER::${currentDate}:${hour}:${currentDay}:${playlistId}`;
}

async function getPlaylists(db, ccmArray, studentClass, studentLocale) {
    try {
        let allPlaylistIdList = [];
        const fullLocale = (studentLocale === 'hi') ? Data.breadcrumbs_web.languageMapping[studentLocale] : 'ENGLISH';
        // check in redis cache
        allPlaylistIdList = await SchedulerRedis.getPlaylists(db.redis.read, studentClass, fullLocale);
        if (!_.isNull(allPlaylistIdList)) {
            // console.log('from cache');
            // return JSON.parse(targetPid);
            allPlaylistIdList = JSON.parse(allPlaylistIdList);
        } else {
            allPlaylistIdList = await LibraryMysql.getPlaylistIdByClassAndLocale(db.mysql.read, studentClass, fullLocale);
            if (allPlaylistIdList.length > 0) {
                SchedulerRedis.setPlaylists(db.redis.write, studentClass, fullLocale, allPlaylistIdList);
            }
        }
        let targetPid = [];
        if (ccmArray.length > 0) {
            targetPid = _.uniq(allPlaylistIdList.filter((item) => _.includes(ccmArray, item.ccm_id)).map((item) => item.playlist_id));
        }
        if (targetPid.length === 0) {
            targetPid = _.uniq(allPlaylistIdList.filter((item) => _.isNull(item.ccm_id)).map((item) => item.playlist_id));
        }
        return targetPid;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function customGroupBy(array, key) {
    const obj = {};
    for (let i = 0; i < array.length; i++) {
        if (typeof obj[array[i].data[key]] === 'undefined') {
            obj[array[i].data[key]] = [];
        }
        obj[array[i].data[key]].push(array[i]);
    }
    return obj;
}

function getVideoStartPosition(videoDuration) {
    const currentMinute = moment().add(5, 'h').add(30, 'minutes');
    const timeAtVideoStart = moment(moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:00:00'));
    let seekTime = currentMinute.diff(timeAtVideoStart, 'seconds');
    if (currentMinute.diff(timeAtVideoStart, 'seconds') > +videoDuration) {
        // seek 15 min back
        seekTime = +videoDuration - 15 * 60;
    }
    return seekTime;
}
function getItemObject({
    id, assortmentId, subject, name, expertImage, design, topic, expertName, videoResources, config, facultyId, exam, viewFrom, videoDuration,
}) {
    const videoPlayDeeplink = (_.isNull(videoDuration)) ? `doubtnutapp://video?qid=${id}&page=${viewFrom}` : `doubtnutapp://video?qid=${id}&page=${viewFrom}&video_start_position=${getVideoStartPosition(videoDuration)}`;
    const item = {
        type: 'widget_child_autoplay',
        data: {
            id,
            assortment_id: assortmentId,
            page: viewFrom,
            // top_title: `TODAY ${moment().hour()}:00 AM`,
            top_title: subject,
            title2: '',
            faculty_image: buildStaticCdnUrl(expertImage),
            is_live: true,
            // subject: resourceDetails[0].subject,
            subject_text_size: '14',
            color: LiveclassData.widgetAutoplayColors(subject.toLowerCase()).tag,
            player_type: 'liveclass',
            live_at: moment().unix(),
            image_bg_card: null,
            lock_state: 0,
            bottom_title: '',
            topic: '',
            students: 13822,
            interested: 13822,
            is_premium: true,
            state: 2,
            show_reminder: false,
            reminder_message: 'Reminder has been set',
            payment_deeplink: videoPlayDeeplink,
            card_width: (_.includes(['vertical', 'verticalFull'], design)) ? '1.01' : '1.25',
            card_ratio: '11:10',
            text_color_primary: '#ffffff',
            text_color_secondary: '#ffffff',
            text_color_title: '#ffffff',
            set_width: true,
            button_state: 'multiple',
            image_vertical_bias: 1,
            bg_exam_tag: LiveclassData.widgetAutoplayColors(subject.toLowerCase()).tag,
            text_color_exam_tag: '#ffffff',
            target_exam: exam,
            views: `${randomNumberGenerator.userWatchingCount(1700, 2000)} students watching`,
            deeplink: `doubtnutapp://course_details?id=${assortmentId}`,
            bottom_layout: {
                title: `${topic}`,
                title_color: '#504949',
                button: {
                    text: 'JOIN NOW',
                    text_color: '#ea532c',
                    background_color: '#00000000',
                    border_color: '#ea532c',
                    deeplink: `doubtnutapp://course_details?id=${assortmentId}`,
                    text_all_caps: false,
                    show_volume: true,
                },
                icon_subtitle: `${config.staticCDN}engagement_framework/509EE326-9771-E4D0-F4C8-B9DF2A27216B.webp`,
            },
            text_horizontal_bias: 0,
            title3: `By ${expertName}`,
            title1: name,
            text_vertical_bias: 0.5,
            title1_text_size: '24',
            title1_is_bold: false,
            title2_text_size: '20',
            title2_is_bold: true,
            title1_text_color: '#1a29a9',
            title2_text_color: '#1a29a9',
            title3_text_size: '12',
            title3_text_color: '#031269',
            title3_is_bold: false,
            start_gd: LiveclassData.widgetAutoplayColors(subject.toLowerCase()).bg,
            mid_gd: LiveclassData.widgetAutoplayColors(subject.toLowerCase()).bg,
            end_gd: LiveclassData.widgetAutoplayColors(subject.toLowerCase()).bg,
            faculty_id: facultyId,
        },
        group_id: subject,
    };
    if (videoResources && videoResources.length) {
        item.data.video_resource = {
            resource: videoResources[0].resource,
            drm_scheme: videoResources[0].drm_scheme,
            cdn_base_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/',
            media_type: videoResources[0].media_type,
            drm_license_url: videoResources[0].drm_license_url,
            fallback_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/text',
            hls_timeout: 0,
            auto_play_duration: 15000,
        };
    }
    return item;
}
async function getSubjectByRecency(db, config, studentId, endDate, startDate) {
    try {
        if (config.caching) {
            const data = await redisUtility.getValue(db.redis.read, `PZN_SUBJECT:${studentId}`);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        const body = {
            student_id: `${studentId}`,
            start_date: startDate,
            end_date: endDate,
        };

        const response = await axios({
            method: 'GET',
            url: `${config.pznUrl}api/v1/get-top-videos/subject-by-sum-engage-time`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: body,
            timeout: 300,
        });
        redisUtility.setValue(db.redis.read, `PZN_SUBJECT:${studentId}`, JSON.stringify(response.data), 60 * 60 * 24);
        return response.data;
    } catch (e) {
        console.log(e);
        return [];
    }
}
function mapOrder(array, order, key) {
    array.sort((a, b) => {
        const A = a[key];
        const B = b[key];

        if (order.indexOf(A) > order.indexOf(B)) {
            return 1;
        }
        return -1;
    });

    return array;
}
async function getSchedulerWidget(db, config, qidObject, design, subjectFilter, liveData, versionCode, source, studentId, replayData) {
    let widgetData = {};
    // design = 'horizontal';
    let layout = 'horizontal';
    if (design === 'horizontal') {
        layout = 'horizontal';
    }
    if (design === 'vertical' || design === 'verticalFull') {
        layout = 'vertical';
    }
    widgetData = {
        actions: [],
        title: 'Live Classes',
        is_live: true,
        live_text: 'LIVE',
        auto_play: true,
        auto_play_initiation: 500,
        auto_play_duration: 15000,
        scroll_direction: layout,
        default_mute: true,
        play_strategy: 0.7,
        title_text_size: '16',
        title_text_color: '#000000',
        bg_color: '#ffffff',
        tabs: [],
        items: [],
    };

    for (let i = 0; i < liveData.length; i++) {
        const videoResources = await AnswerContainerv13.getAnswerVideoResource(db, config, liveData[i].answer_id, liveData[i].resource_reference, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, false);
        const grouped1 = customGroupBy(widgetData.items, 'faculty_id');
        if (typeof grouped1[liveData[i].faculty_id] === 'undefined') {
            widgetData.items.push(getItemObject({
                id: liveData[i].resource_reference, assortmentId: liveData[i].assortment_id, subject: liveData[i].subject, name: liveData[i].name, expertImage: liveData[i].expert_image, design, topic: liveData[i].topic, expertName: (typeof liveData[i].expert_name2 !== 'undefined') ? liveData[i].expert_name2 : liveData[i].expert_name, videoResources, config, facultyId: liveData[i].faculty_id, exam: liveData[i].category, viewFrom: 'HOME_FEED_LIVE', videoDuration: null,
            }));
        }
    }
    for (let i = 0; i < replayData.length; i++) {
        const videoResources = await AnswerContainerv13.getAnswerVideoResource(db, config, replayData[i].answer_id, replayData[i].resource_reference, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, false);
        const grouped1 = customGroupBy(widgetData.items, 'faculty_id');
        if (typeof grouped1[replayData[i].faculty_id] === 'undefined') {
            widgetData.items.push(getItemObject({
                id: replayData[i].resource_reference, assortmentId: replayData[i].assortment_id, subject: replayData[i].subject, name: replayData[i].name, expertImage: replayData[i].expert_image, design, topic: replayData[i].topic, expertName: (typeof replayData[i].expert_name2 !== 'undefined') ? replayData[i].expert_name2 : replayData[i].expert_name, videoResources, config, facultyId: replayData[i].faculty_id, exam: replayData[i].category, viewFrom: 'HOME_FEED_LIVE', videoDuration: null,
            }));
        }
    }
    // eslint-disable-next-line guard-for-in
    for (const slotKey in qidObject) {
        for (let i = 0; i < qidObject[slotKey].length; i++) {
        // eslint-disable-next-line prefer-const
            let [resourceDetails, questionDetails] = await Promise.all([
                CourseContainerV2.getCourseDetailsFromQuestionId(db, qidObject[slotKey][i]),
                AnswerContainer.getByQuestionIdWithTextSolution(qidObject[slotKey][i], db),
            ]);
            resourceDetails = resourceDetails.filter((item) => !_.isNull(item.subject));
            if (resourceDetails.length > 0) {
                if (subjectFilter === 'all' || _.includes(subjectFilter, resourceDetails[0].subject)) {
                    const answerId = questionDetails[0].answer_id;
                    const videoResources = await AnswerContainerv13.getAnswerVideoResource(db, config, answerId, qidObject[slotKey][i], ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, false);
                    const grouped2 = customGroupBy(widgetData.items, 'faculty_id');
                    if (typeof grouped2[resourceDetails[0].faculty_id] === 'undefined') {
                        widgetData.items.push(getItemObject({
                            id: qidObject[slotKey][i], assortmentId: resourceDetails[0].assortment_id, subject: resourceDetails[0].subject, name: resourceDetails[0].name, expertImage: (typeof resourceDetails[0].expert_image2 !== 'undefined') ? resourceDetails[0].expert_image2 : resourceDetails[0].expert_image, design, topic: resourceDetails[0].topic, expertName: resourceDetails[0].expert_name, videoResources, config, facultyId: resourceDetails[0].faculty_id, exam: resourceDetails[0].category, viewFrom: (source === 'home') ? 'LIVE_CLASS_HP' : 'LIVE_CLASS_ALL_HP', videoDuration: questionDetails[0].duration,
                        }));
                    // grouped2 = _.groupBy(widgetData.items, 'faculty_id');
                    } else {
                        // make is active = 0 in table and remove from redis playlist
                        SchedulerMysql.markInActive(db.mysql.write, +qidObject[slotKey][i]);
                        redisUtility.removeMemberFromSet(db.redis.write, slotKey, +qidObject[slotKey][i]);
                    }
                }
            }
        }
    }

    // generate actions and tabs
    const distinctSubject = [...new Set(widgetData.items.map((item) => item.data.top_title))];
    const tabs = [];
    const actions = [];
    const groupedBySubject = _.groupBy(widgetData.items, 'group_id');
    let itemsToPush = [];
    for (let i = 0; i < distinctSubject.length; i++) {
        const tab = {
            key: distinctSubject[i],
            title: `${distinctSubject[i]} (${groupedBySubject[distinctSubject[i]].length})`,
            is_selected: false,
        };

        tabs.push(tab);
        if (design === 'vertical') {
            if (groupedBySubject[distinctSubject[i]].length > 2) {
                const action = {
                    group_id: distinctSubject[i],
                    text_one: `Explore all ${distinctSubject[i]} live class`,
                    text_one_size: '12',
                    text_one_color: '#000000',
                    bg_stroke_color: '#d6d6d6',
                    deeplink: `doubtnutapp://scheduler_listing?subjects=${distinctSubject[i]}&slot=`,
                };
                actions.push(action);
                itemsToPush = [...itemsToPush, ...groupedBySubject[distinctSubject[i]].splice(0, 2)];
            } else {
                itemsToPush = [...itemsToPush, ...groupedBySubject[distinctSubject[i]]];
            }
        } else {
            if (groupedBySubject[distinctSubject[i]].length === 1) {
                groupedBySubject[distinctSubject[i]][0].data.card_width = '1.01';
                groupedBySubject[distinctSubject[i]][0].data.card_ratio = '13:10';
            }
            itemsToPush = [...itemsToPush, ...groupedBySubject[distinctSubject[i]]];
        }
    }

    widgetData.actions = actions;
    widgetData.tabs = tabs;
    widgetData.items = itemsToPush;
    const subjectList = await getSubjectByRecency(db, config, studentId, moment().format('YYYY-MM-DD 00:00:00'), moment().add(5, 'h').add(30, 'minutes').subtract(20, 'days')
        .format('YYYY-MM-DD 00:00:00'));
    const arrayTosort = [];
    const unSorted = [];
    for (let i = 0; i < widgetData.tabs.length; i++) {
        if (subjectList && subjectList.indexOf(widgetData.tabs[i].key) > -1) {
            arrayTosort.push(widgetData.tabs[i]);
        } else {
            unSorted.push(widgetData.tabs[i]);
        }
    }
    widgetData.tabs = [...mapOrder(arrayTosort, subjectList, 'key'), ...unSorted];
    if (widgetData.tabs.length > 0) {
        widgetData.tabs[0].is_selected = true;
    }

    return widgetData;
}

function objectIdFromDate(date) {
    return `${Math.floor(date.getTime() / 1000).toString(16)}0000000000000000`;
}

function dateFromObjectId(objectId) {
    return new Date(parseInt(objectId.substring(0, 8), 16) * 1000);
}

module.exports = {
    getSlotkey,
    getPlaylists,
    getSchedulerWidget,
    objectIdFromDate,
    dateFromObjectId,
};
