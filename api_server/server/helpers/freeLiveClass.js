const axios = require('axios');
const moment = require('moment');
const _ = require('lodash');

const StaticData = require('../../data/data');
const WidgetHelper = require('../widgets/liveclass');
const QuestionContainer = require('../../modules/containers/question');
const PznContainer = require('../../modules/containers/pzn');
const config = require('../../config/config');
const axioInst = require('../../modules/axiosInstances');
const QuestionRedis = require('../../modules/redis/question');
const RedisUtils = require('../../modules/redis/utility.redis.js');
const CourseHelper = require('./course');
const SchedulerHelper = require('./scheduler');
const LiveClassHelper = require('./liveclass');

async function getLiveClass(obj) {
    try {
        const options = {
            method: 'GET',
            url: `${config.IAS_VANILLA_BASE_URL}/api/v1/suggest`,
            data: {
                text: obj.chapter,
                studentClass: obj.class,
                count: 10,
                version: 'v12.5',
                contentAccess: 0,
                filters: {
                    liveClass: { subject: [obj.subject] },
                },
                userContext: {
                    language: obj.locale,
                },
            },
            timeout: 1000,
        };
        // let dataFromInApp = await axios(options);
        let dataFromInApp = await axioInst.iasInstEsV7(options);
        dataFromInApp = dataFromInApp.data.liveClass;
        return dataFromInApp;
    } catch (e) {
        return {};
    }
}

async function getFreeLiveClassDataFromElastic(obj) {
    let returnData = {};
    let { chapter: mainChapter } = obj;
    const { chapter } = obj;
    const chapterAliasResponse = await QuestionContainer.getChapterAliasData(obj.db, obj.chapter);
    if (chapterAliasResponse.length > 0 && chapterAliasResponse[0] != undefined && chapterAliasResponse[0].chapter_alias !== '' && chapterAliasResponse[0].chapter_alias != null) {
        mainChapter = chapterAliasResponse[0].chapter_alias.trim();
    }
    const elascticCallObj = {
        type: 'live',
        askScreen: true,
        subject: obj.subject,
        chapter: mainChapter,
        class: obj.classVal,
        locale: obj.locale,
        student_id: obj.student_id,
    };
    let elasticLiveData = await getLiveClass(elascticCallObj);
    if (elasticLiveData && Object.keys(elasticLiveData).length === 0) {
        elascticCallObj.chapter = chapter;
        elasticLiveData = await getLiveClass(elascticCallObj);
        if (elasticLiveData && Object.keys(elasticLiveData).length === 0) {
            return returnData;
        }
    }
    elasticLiveData = elasticLiveData.sugg;
    if (elasticLiveData.length === 0) {
        elascticCallObj.chapter = chapter;
        elasticLiveData = await getLiveClass(elascticCallObj);
        if (elasticLiveData && Object.keys(elasticLiveData).length === 0) {
            return returnData;
        }
        elasticLiveData = elasticLiveData.sugg;
    }
    let overWrittenWidget = [];
    let liveQids = [];
    if (obj.mpvpNewFlow) {
        let overWriteQids = [];
        let getQueries = await QuestionContainer.getVideoPageOverRideQueries(obj.db, obj.classVal, obj.locale);
        if (getQueries.length > 0) {
            const showToWholeClass = getQueries.filter((item) => item.subject === null);
            const getQueriesTemp = getQueries.filter((item) => obj.subject == item.subject);
            getQueries = getQueries.filter((item) => !showToWholeClass.includes(item) && !getQueriesTemp.includes(item));
            if (getQueriesTemp > 0) {
                getQueries = getQueriesTemp;
                const showToWholeSubject = getQueries.filter((item) => item.ccm_ids === null || item.ccm_ids === '');
                const getQueriesTemp2 = [];
                for (let i = 0; i < getQueries.length; i++) {
                    const ccmIds = getQueries[i].ccm_ids.split(',');
                    if (ccmIds.length > 0 && ccmIds.some((item) => obj.ccmIdList.includes(item))) {
                        getQueriesTemp2.push(getQueries[i]);
                    }
                }
                getQueries = getQueries.filter((item) => !showToWholeSubject.includes(item) && !getQueriesTemp2.includes(item));
                if (getQueriesTemp2 > 0) {
                    getQueries = getQueriesTemp2;
                } else if (showToWholeSubject > 0) {
                    getQueries = showToWholeSubject;
                }
            } else if (showToWholeClass.length > 0) {
                getQueries = showToWholeClass;
            }
        }
        if (getQueries.length > 0) {
            let qetQid = await QuestionRedis.getVideoPageQidsByTableId(obj.db.redis.read, getQueries[0].id);
            if (!_.isNull(qetQid)) {
                qetQid = JSON.parse(qetQid);
                overWriteQids = qetQid.map((x) => x.resource_reference.toString());
            }
        }
        // live and simulated live logic
        if (!(overWriteQids.length + elasticLiveData.length > 10)) {
            const ccmCourses = await CourseHelper.getCoursesFromCcmArray(obj.db, obj.ccmIdList, obj.classVal, obj.locale);
            const courses = ccmCourses;
            const liveData = await CourseHelper.getVideosDataByScheduleType(obj.db, courses, obj.classVal, obj.locale, 'live', null);
            if (liveData.length) {
                liveQids = liveData.map((item) => item.resource_reference);
            }
            if (!(overWriteQids.length + elasticLiveData.length + liveQids.length > 10)) {
                const playlistIdList = await SchedulerHelper.getPlaylists(obj.db, obj.ccmIdList, obj.classVal, obj.locale);
                if (playlistIdList.length > 0) {
                    const qidListScheduledLive = [];
                    // get qid list from redis
                    for (let i = 0; i < playlistIdList.length; i++) {
                        const slotKey = SchedulerHelper.getSlotkey(playlistIdList[i]);
                        // eslint-disable-next-line no-await-in-loop
                        const qidList = await RedisUtils.getSetMembers(obj.db.redis.read, slotKey);
                        if (qidList.length > 0) {
                            qidListScheduledLive.push(...qidList);
                        }
                    }
                    liveQids.push(...qidListScheduledLive);
                }
            }
            overWriteQids.push(...liveQids);
        }
        if (overWriteQids.length) {
            const finalData = await LiveClassHelper.getLiveclassData(obj.db, overWriteQids, parseInt(obj.classVal));
            const widgetObj1 = {
                data: finalData,
                paymentCardState: { isVip: false },
                title: obj.locale === 'hi' ? 'लाइव क्लास' : 'Live Class',
                studentLocale: obj.locale,
                versionCode: obj.versionCode,
                type: 'match_mpvp',
            };
            overWrittenWidget = await WidgetHelper.homepageVideoWidgetWithoutTabsVideoPageOverwrite(widgetObj1);
        }
    }
    if (elasticLiveData.length > 0) {
        const qids = elasticLiveData.map((x) => x.srcId.toString());
        const liveClassData = await LiveClassHelper.getLiveclassData(obj.db, qids, parseInt(obj.classVal));
        const finalData = [];
        elasticLiveData.forEach((x) => {
            const liveDetails = liveClassData.filter((y) => y.resource_reference == x.srcId);
            if (liveDetails.length > 0) {
                x.duration = x._extras.duration;
                x.resource_reference = x.srcId;
                x.assortment_id = liveDetails[0].assortment_id;
                x.live_at = x._extras.live_at;
                x.display = x._extras.display;
                x.expert_name = liveDetails[0].expert_name;
                x.expert_image = liveDetails[0].expert_image;
                x.class = x._extras.class;
                x.subject = x._extras.subject;
                x.is_free = x._extras.is_free;
                x.stream_status = liveDetails[0].stream_status;
                x.player_type = liveDetails[0].player_type;
                x.meta_info = liveDetails[0].meta_info;
                x.chapter = x._extras.chapter;

                finalData.push(x);
            }
        });

        const widgetObj = {
            data: finalData,
            paymentCardState: { isVip: false },
            title: obj.locale === 'hi' ? 'लाइव क्लास' : 'Live Class',
            studentLocale: obj.locale,
            versionCode: obj.versionCode,
        };
        if (obj.liveClassNewFlow || obj.mpvpNewFlow) {
            widgetObj.type = 'match_mpvp';
        }

        const widget = await WidgetHelper.homepageVideoWidgetWithoutTabs(widgetObj);
        const latestLiveClassFirst = _.orderBy(widget.items, ['data.live_at'], ['desc']);
        widget.items = latestLiveClassFirst;
        if (overWrittenWidget.items && overWrittenWidget.items.length > 0) {
            const queryOverWrite = overWrittenWidget.items.filter((x) => !liveQids.includes(x.data.id.toString()));
            const liveOverWrite = overWrittenWidget.items.filter((x) => liveQids.includes(x.data.id.toString()));
            if (!widget.items.length) {
                widget.items = [];
            }
            widget.items.unshift(...queryOverWrite);
            widget.items.push(...liveOverWrite);
        }
        widget.items = widget.items.splice(0, 10);
        if (obj.liveClassNewFlow) {
            widget.title = StaticData.match_live_tab(obj.locale).title;
            widget.string_title_to_replace_with = StaticData.match_live_tab(obj.locale).color_title;
            widget.title_char_to_replace = '$$';
            widget.string_title_to_replace_with_color = '#eb532c';
        } else if (obj.mpvpNewFlow) {
            widget.title = StaticData.mpvp_top_widget.title(obj.locale);
        }
        widget.items.forEach((x, i) => {
            x.data.card_width = '0.95';
            x.data.button = null;
            if (!obj.mpvpNewFlow) {
                x.data.page = 'MATCH_PAGE_RELATED_CLASSES';
            }

            if (obj.liveClassNewFlow || obj.mpvpNewFlow) {
                const cdnPrefix = 'https://d10lpgp6xz60nq.cloudfront.net/';
                const duration = x.data.duration ? Math.round(x.data.duration / 60) : 0;
                const watchingStudents = Math.floor(Math.random() * 50000) + 10000;
                const { title1: classTopic, top_title: tagTwoText } = x.data;

                let liveTimeStamp = x.data.live_at;
                let joinNowButtonShow = false;
                if (x.data.live_at.toString().length === 13) {
                    liveTimeStamp /= 1000;
                }
                const upperLim = liveTimeStamp + 2400;
                const lowerLim = liveTimeStamp - 2400;
                const currentTime = Math.round(new Date().getTime() / 1000);
                let durationText = duration !== 0 ? `${watchingStudents} attended | ${duration} Min` : `${watchingStudents} attended`;
                if (lowerLim <= currentTime && upperLim >= currentTime) {
                    durationText = duration !== 0 ? `${watchingStudents} watching | ${duration} Min` : `${watchingStudents} watching`;
                    if (obj.liveClassNewFlow) {
                        joinNowButtonShow = true;
                    }
                } else if (currentTime < lowerLim) {
                    durationText = duration !== 0 ? `${duration} Min` : `${watchingStudents} waiting`;
                }

                const classTopicArr = classTopic.split('|');
                x.data.title1 = classTopicArr[1].trim();
                x.data.class_topic = classTopicArr[2].trim();
                x.data.class_topic_size = '10';
                x.data.video_duration_text = durationText;
                x.data.video_duration_text_size = '9';
                x.data.button_state = 'join_now';
                if (_.isNull(x.data.image_url) || _.isEmpty(x.data.image_url)) {
                    const liveDetails = liveClassData.filter((y) => y.resource_reference == x.data.id);
                    if (!_.isNull(liveDetails) && !_.isNull(liveDetails[0].image_bg_liveclass)) {
                        x.data.image_url = liveDetails[0].image_bg_liveclass;
                    }
                }

                if (obj.liveClassNewFlow) {
                    x.data.page = 'MATCH_PAGE_RELATED_CLASSES';
                    x.data.tag_two_text = tagTwoText;
                    x.data.tag_two_bg_color = '#ffc5b2';
                    x.data.tag_two_text_color = '#17181f';
                    if (joinNowButtonShow) {
                        const bgKey = x.data.subject.split(' ').join('_').toLowerCase();
                        x.data.image_bg_card = `${cdnPrefix}${StaticData.live_now_bg_for_live_tab[bgKey]}`;
                        if (_.isNull(x.data.image_bg_card)) {
                            x.data.image_bg_card = `${cdnPrefix}${StaticData.live_now_bg_for_live_tab.biology}`;
                        }
                        x.data.join_now_cta = 'Join Now';
                        x.data.join_now_deeplink = 'doubtnutapp://course_details?id=undefined';
                    }
                    delete x.data.top_title;
                } else if (obj.mpvpNewFlow) {
                    const { title1: chapterName, title2: teacherName } = x.data;
                    let backgroundUrl = `${cdnPrefix}${StaticData.mpvp_recommended_backgrounds.one}`;
                    let topBgClr = StaticData.mpvp_recommended_background_colors.one;
                    if (i % 3 === 1) {
                        backgroundUrl = `${cdnPrefix}${StaticData.mpvp_recommended_backgrounds.two}`;
                        topBgClr = StaticData.mpvp_recommended_background_colors.two;
                    } else if (i % 3 === 2) {
                        backgroundUrl = `${cdnPrefix}${StaticData.mpvp_recommended_backgrounds.three}`;
                        topBgClr = StaticData.mpvp_recommended_background_colors.three;
                    }
                    x.data.image_bg_card = backgroundUrl;
                    x.data.page = 'MPVP_CLASSES_CAROUSEL';
                    x.data.top_heading_text = `${x.data.subject} Class ${x.data.class}`;
                    x.data.top_heading_text_color = '#fda589';
                    x.data.top_background_text_color = topBgClr;
                    x.data.text_color_title = '#17181f';
                    x.data.text_color_primary = '#17181f';
                    x.data.card_ratio = '16:10';
                    x.data.card_width = '2.1';
                    x.data.title1_size = '16';
                    x.data.guideline_constraint_begin = '6';
                    x.data.recommended_class = {
                        chapter_name: chapterName,
                        teacher_name: teacherName,
                    };
                    x.extra_params = {
                        widget_name: 'mpvp_classes_carousel',
                    };
                    delete x.data.top_title;
                    delete x.data.subject;
                    delete x.data.title1;
                    delete x.data.title2;
                }
            }
        });
        if (!obj.mpvpNewFlow) {
            widget.scroll_direction = 'vertical';
        }
        if (obj.mpvpNewFlow) {
            widget.link_text = StaticData.mpvp_top_widget.view_all.cta_text(obj.locale);
            widget.deeplink = StaticData.mpvp_top_widget.view_all.deeplink;
        }
        const finalObj = {
            widget_data: widget,
            widget_type: 'widget_parent',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
        };
        returnData = finalObj;
    }
    return returnData;
}

async function getLast30DaysEngagement(sid) {
    const endData = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const options = {
        method: 'GET',
        // url: `${StaticData.userEngagementURL}api/v1/summation-by-student-id`,
        url: `${StaticData.userEngagementURL}api/v1/summation-by-student-id/engage-time`,
        data: {
            student_id: sid,
            start_date: startDate,
            end_date: endData,
        },
        timeout: 1000,
    };

    let totalEngagementTime;
    try {
        totalEngagementTime = (await axios(options)).data.total_engage_time;
    } catch (e) {
        totalEngagementTime = 0;
    }

    return totalEngagementTime;
}

async function getDataForDailyGoal(obj) {
    try {
        const options = {
            method: 'GET',
            url: `${config.IAS_VANILLA_BASE_URL}/api/v1/suggest`,
            data: {
                text: obj.chapter,
                studentClass: obj.class,
                count: 10,
                version: 'v12.5',
                contentAccess: 0,
                filters: {
                    liveClass: { subject: [obj.subject] },
                },
                userContext: {
                    language: obj.locale,
                },
            },
            timeout: 1000,
        };
        if (obj.type === 'video') {
            options.data.filters = {
                video: { subject: [obj.subject] },
            };
            // options.data.count = 10;
        }
        if (obj.type === 'pdf') {
            options.data.filters = {
                pdf: { subject: [obj.subject] },
            };
            // options.data.count = 10;
        }
        // let dataFromInApp = await axios(options);
        let dataFromInApp = await axioInst.iasInstEsV7(options);
        dataFromInApp = dataFromInApp.data;
        return dataFromInApp;
    } catch (e) {
        return {};
    }
}

async function getUserEngageCategory(studentId) {
    const startDate = moment().subtract(30, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD');
    const endDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD');
    const [engageData, viewData] = await Promise.all([
        PznContainer.getUserTotalEngageTimeBuketForRange(studentId, startDate, endDate),
        PznContainer.getUserVideoViewBucket(studentId),
    ]);
    if (!engageData || !viewData || !Object.keys(engageData).length || !Object.keys(viewData).length) {
        return '';
    }

    const keysSorted = Object.keys(viewData).sort((a, b) => viewData[a] - viewData[b]);
    const viewCategory = keysSorted[keysSorted.length - 1];
    let userViewCcategory = ''; let userEngageCategory = '';

    if (viewCategory === '0_4') {
        userViewCcategory = 'V1';
    } else if (viewCategory === '5_60') {
        userViewCcategory = 'V2';
    } else if (viewCategory === '61_300') {
        userViewCcategory = 'V3';
    } else if (viewCategory === '301_') {
        userViewCcategory = 'V4';
    }

    if (engageData.total_engage_time < 60) {
        userEngageCategory = 'U1';
    } else if (engageData.total_engage_time >= 60 && engageData.total_engage_time < 300) {
        userEngageCategory = 'U2';
    } else if (engageData.total_engage_time >= 300 && engageData.total_engage_time < 600) {
        userEngageCategory = 'U3';
    } else if (engageData.total_engage_time >= 600) {
        userEngageCategory = 'U4';
    }
    return `${userEngageCategory}${userViewCcategory}`;
}

function getUserTrailAndDiscountCouponCard(userCategory) {
    const trailCategory = ['U3V1', 'U3V2', 'U4V1', 'U4V2'];
    const discountCategory = ['U3V3', 'U3V4', 'U4V3', 'U4V4'];
    let data = null;
    if (_.includes(trailCategory, userCategory)) {
        data = [{
            title: 'Sirf aapke liye..',
            title_one_text_size: '16',
            title_one_text_color: '#472900',
            title_two: 'Ab koi bhi course 3 din k liye muft mein padhein.',
            title_two_text_size: '14',
            title_two_text_color: '#472900',
            bg_color1: '#f0ad54',
            bg_color2: '#ffe4bf',
            left_strip_color: '#965704',
            title_image_url: `${StaticData.cdnHostLimelightStaticWithPrefix}engagement_framework/6F248E79-9484-D476-4D0F-90681B7D51DE.webp`,
            is_course_trial_card: true,
            deeplink: 'doubtnutapp://free_trial_course',
            cta: {
                text: 'Abhi Activate Karein',
                text_size: '14',
                text_color: '#ea532c',
                bg_color: '#ffffff',
                cta_deeplink: 'doubtnutapp://free_trial_course',
            },
        }];
    }
    if (_.includes(discountCategory, userCategory)) {
        data = [{
            title: 'Hi! We know you like to study',
            title_one_text_size: '14',
            title_one_text_color: '#0a3f00',
            title_two: 'Isi liye sirf aapke liye dher saare <font color="#273de9">special discounts</font>.',
            title_two_text_size: '16',
            title_two_text_color: '#0a3f00',
            bg_color1: '#a1ffce',
            bg_color2: '#faffd1',
            left_strip_color: '#0a3f00',
            title_image_url: `${StaticData.cdnHostLimelightStaticWithPrefix}engagement_framework/19940D6F-55E8-0CF3-CA41-467E0F36286E.webp`,
            cta: {
                text: 'Abhi Dekhein',
                text_size: '14',
                text_color: '#ea532c',
                bg_color: '#ffffff',
                cta_deeplink: 'doubtnutapp://free_trial_course',
            },
        }];
    }
    if (data && data.length) {
        const widgetData = { // move to data.js
            type: 'widget_gradient_card',
            widget_data: {
                scroll_direction: 'horizontal',
                title: '',
                items: data,
            },
            layout_config: {
                margin_top: 10,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
            },
        };
        return widgetData;
    }
    return null;
}

async function getLast30DaysQaCount(sid) {
    const endData = moment().format('YYYY-MM-DD');
    const startDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
    const options = {
        method: 'GET',
        // url: `${StaticData.userEngagementURL}api/v1/summation-by-student-id`,
        url: `${StaticData.userEngagementURL}api/v1/summation-by-student-id/engage-time`,
        data: {
            student_id: sid,
            start_date: startDate,
            end_date: endData,
        },
        timeout: 1000,
    };

    let data = {};
    try {
        data = (await axios(options)).data;
    } catch (e) {
        data = {};
    }

    return data;
}
module.exports = {
    getFreeLiveClassDataFromElastic,
    getLast30DaysEngagement,
    getDataForDailyGoal,
    getUserEngageCategory,
    getUserTrailAndDiscountCouponCard,
    getLast30DaysQaCount,
    getLiveClass,
};
