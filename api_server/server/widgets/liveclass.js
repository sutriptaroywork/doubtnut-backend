/* eslint-disable no-shadow */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const moment = require('moment');

const Data = require('../../data/liveclass.data');
const DataHelper = require('../../data/data');
const liveclassHelper = require('../helpers/liveclass');
const CourseHelper = require('../helpers/course');
const AnswerContainer = require('../v13/answer/answer.container');
const CourseV2Container = require('../../modules/containers/coursev2');
const CourseV2Mysql = require('../../modules/mysql/coursev2');
const CourseRedisV2 = require('../../modules/redis/coursev2');
const studyGroupMysql = require('../../modules/mysql/studyGroup');
const { buildStaticCdnUrl } = require('../helpers/buildStaticCdnUrl');
const gamificationHelper = require('../helpers/gamification-leaderboard');
const DataPayment = require('../../data/data.payment');
const QuestionRedis = require('../../modules/redis/question');
const QuestionContainer = require('../../modules/containers/question');
const config = require('../../config/config');
const axioInst = require('../../modules/axiosInstances');
const RedisUtils = require('../../modules/redis/utility.redis');
const SchedulerHelper = require('../helpers/scheduler');

function textModifier(text) {
    const words = text.split(' ');
    let modifiedText = '';
    for (let i = 0; i < words.length; i++) {
        modifiedText = `${modifiedText}${words[i][0].toUpperCase()}${words[i].substring(1).toLowerCase()} `;
    }
    return modifiedText;
}

function getTextColor(subject) {
    const obj = {
        physics: {
            text_color_primary: '#420146',
            text_color_secondary: '#ffffff',
            text_color_title: '#6f0477',
        },
        maths: {
            text_color_primary: '#004f4d',
            text_color_secondary: '#ffffff',
            text_color_title: '#047b79',
        },
        biology: {
            text_color_primary: '#034a01',
            text_color_secondary: '#ffffff',
            text_color_title: '#097704',
        },
        chemistry: {
            text_color_primary: '#a54503',
            text_color_secondary: '#ffffff',
            text_color_title: '#c85201',
        },
    };
    if (!obj[subject]) {
        return {
            text_color_primary: '#460600',
            text_color_secondary: '#ffffff',
            text_color_title: '#750406',
        };
    }
    return obj[subject];
}

function createVideoDataObject(data, paymentCardState, studentLocale, live, versionCode, pageValue = null) {
    const obj = {};
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const hours = Math.round(data.duration / 3600);
    const minutes = Math.round((data.duration % 3600) / 60);
    obj.id = data.resource_reference;
    obj.assortment_id = data.assortment_id;
    if (pageValue === 'explore') {
        obj.page = 'COURSE_LANDING';
    } else if (pageValue === 'revision_class') {
        obj.page = 'HOME_PAGE_REVISION_CLASSES';
    } else {
        obj.page = 'HOME_FEED_LIVE';
    }
    obj.top_title = data.live_at ? liveclassHelper.getLiveclassStatusRecorded(data.live_at) : `${hours > 0 ? `${hours} hr ` : ''}${minutes > 0 ? `${minutes} mins ` : ''}`;
    obj.title1 = data.display;
    obj.title2 = `By ${data.expert_name ? data.expert_name.toUpperCase() : Data.liveclassDefaultFaculty}`;
    obj.image_url = buildStaticCdnUrl(data.expert_image) || buildStaticCdnUrl(data.image_bg_liveclass) || '';
    obj.is_live = true;
    obj.subject = data.subject;
    obj.color = live ? liveclassHelper.getBarColorForLiveclassHomepage(data.subject) : liveclassHelper.getBarColorForRecentclassHomepage(data.subject);
    obj.player_type = 'liveclass';
    obj.live_at = data.live_at ? moment(data.live_at).unix() * 1000 : moment(now).unix() * 1000;
    obj.image_bg_card = live ? buildStaticCdnUrl(Data.getBgImageForLiveCarousel(data.subject.toLowerCase())) : buildStaticCdnUrl(Data.getBgImage(data.subject.toLowerCase()));
    obj.lock_state = 0;
    obj.bottom_title = data.day_text ? `Classes on ${data.day_text}` : '';
    obj.topic = '';
    obj.students = 13822;
    obj.interested = 13822;
    obj.is_premium = !(data.is_free == 1);
    obj.is_vip = paymentCardState.isVip;
    obj.state = data.live_at > now ? 0 : 2;
    if (data.stream_status === 'ACTIVE') {
        obj.state = 1;
    }
    obj.show_reminder = liveclassHelper.showReminder(data.live_at);
    obj.reminder_message = 'Reminder has been set';
    obj.payment_deeplink = `doubtnutapp://vip?assortment_id=${data.assortment_id}`;
    obj.card_width = '1.1';
    obj.card_ratio = '16:8';
    const textColors = getTextColor(data.subject.toLowerCase());
    obj.text_color_primary = live ? '#ffffff' : textColors.text_color_primary;
    obj.text_color_secondary = live ? '#ffffff' : textColors.text_color_secondary;
    obj.text_color_title = live ? '#ffffff' : textColors.text_color_title;
    obj.set_width = true;
    obj.button_state = 'multiple';
    obj.image_vertical_bias = 1;
    obj.bg_exam_tag = obj.color;
    obj.text_color_exam_tag = '#ffffff';
    if (data.player_type === 'youtube' && !_.isNull(data.meta_info)) {
        obj.id = data.meta_info;
    }
    obj.target_exam = data.category || '';
    if (versionCode > 866) {
        obj.button = {
            text: studentLocale === 'hi' ? 'अध्याय पर जाएं' : 'Go to Chapter',
            deeplink: `doubtnutapp://course_details?id=${data.chapter_assortment || data.assortment_id}`,
        };
    } else {
        obj.button = {
            text: studentLocale === 'hi' ? 'अध्याय पर जाएं' : 'Go to Chapter',
            action: {
                action_data: {
                    id: data.chapter_assortment || data.assortment_id,
                },
            },
        };
    }
    obj.deeplink = `doubtnutapp://course_details?id=${data.chapter_assortment || data.assortment_id}`;
    if (data.live_at > now) {
        obj.reminder_link = `https://www.google.com/calendar/render?action=TEMPLATE&text=${data.topic}&dates=${moment(data.live_at).subtract(5, 'hours').subtract(30, 'minutes').format('YYYYMMDDTHHmmSS')}Z/${moment(data.live_at).subtract(5, 'hours').subtract(30, 'minutes').add(1, 'hours')
            .format('YYYYMMDDTHHmmSS')}Z&sf=true&output=xml`;
    }
    return obj;
}

async function homepageVideoWidgetWithTabs({
    data,
    studentLocale,
    paymentCardState,
    title,
    tabs = [],
    versionCode,
    pageValue = null,
    type = null,
}) {
    const items = {};
    for (const key in data) {
        if (data[key]) {
            const tablist = [];
            for (let i = 0; i < data[key].length; i++) {
                const obj = createVideoDataObject(data[key][i], paymentCardState, studentLocale, false, versionCode, pageValue);
                if (type && type === 'mpvp') {
                    obj.duration = data[key][i].duration;
                    obj.class = data[key][i].class;
                }
                tablist.push({ type: 'live_class_carousel_card_2', data: obj });
            }
            items[key] = tablist;
        }
    }
    if (!tabs.length) {
        const tab1_items = items.ENGLISH || [];
        const tab2_items = items.HINDI || [];
        if (tab1_items.length) {
            tabs.push({
                key: 'ENGLISH',
                title: studentLocale === 'hi' ? 'अंग्रेजी माध्यम' : 'English Medium',
                is_selected: true,
            });
        }
        if (studentLocale == 'hi' && tab2_items.length) {
            if (tabs.length) {
                tabs[0].is_selected = false;
            }
            tabs.unshift({
                key: 'HINDI',
                title: studentLocale === 'hi' ? 'हिंदी माध्यम' : 'Hindi Medium',
                is_selected: true,
            });
        } else if (tab2_items.length) {
            tabs.push({
                key: 'HINDI',
                title: studentLocale === 'hi' ? 'हिंदी माध्यम' : 'Hindi Medium',
                is_selected: !tabs.length,
            });
        }
    }
    const widget = {
        title,
        is_title_bold: true,
        items,
        tabs,
    };
    return widget;
}

async function homepageVideoWidgetWithoutTabs({
    data,
    title,
    studentLocale,
    paymentCardState,
    userMarkedInsterestedData = [],
    versionCode,
    type,
}) {
    const items = [];
    // const data = await
    for (let i = 0; i < data.length; i++) {
        const obj = createVideoDataObject(data[i], paymentCardState, studentLocale, false, versionCode);
        const userData = _.find(userMarkedInsterestedData, ['resource_reference', parseInt(data[i].resource_reference)]);
        obj.is_reminder_set = userData && userData.is_interested ? 1 : 0;
        if (type && type === 'match_mpvp') {
            obj.duration = data[i].duration;
            obj.class = data[i].class;
            obj.chapter = data[i].chapter;
        }
        items.push({ type: 'live_class_carousel_card_2', data: obj });
    }
    const widget = {
        title,
        is_title_bold: true,
        items,
    };
    return widget;
}

async function booksForHomepage({
    data,
}) {
    const items = [];
    for (let i = 0; i < data.length; i++) {
        items.push({
            title: data[i].name,
            subtitle: '',
            text1: '',
            text2: '',
            show_whatsapp: true,
            show_video: false,
            image_url: data[i].image_url,
            card_width: '2x',
            aspect_ratio: '',
            deeplink: encodeURI(`doubtnutapp://playlist?playlist_id=0&playlist_title=${data[i].name}&is_last=0&package_details_id=${data[i].package_details_id}&page=LIBRARY`),
            id: data[i].playlist_id,
            is_premium: false,
            is_vip: false,
            block_content_message: '',
        });
    }
    const widgets = [];
    for (let i = 0; i < items.length; i++) {
        if (i % 2 == 0) {
            widgets.push(
                {
                    type: 'horizontal_list',
                    data: {
                        items: [items[i]],
                    },
                    extra_params: {},
                },
            );
        } else {
            widgets[widgets.length - 1].data.items.push(items[i]);
        }
    }
    return widgets;
}
async function onlineClassesBottomsheet({
    db,
    data,
    title,
    isLive = true,
    studentLocale,
    config,
    paymentCardState,
    versionCode,
    pageValue = 'homepage',
}) {
    const widgets = [];
    for (let i = 0; i < data.length; i++) {
        const obj = createVideoDataObject(data[i], paymentCardState, studentLocale, true, versionCode, pageValue);
        obj.card_width = '1.02';
        if (versionCode > 945) {
            obj.card_width = '1.25';
        }
        obj.card_ratio = '16:9';
        if (pageValue === 'camerapage') {
            obj.card_width = null;
        }
        obj.target_exam = data[i].category || '';
        // eslint-disable-next-line no-await-in-loop
        const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, data[i].answer_id, obj.id, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, false);
        if (videoResources && videoResources.length) {
            obj.video_resource = {
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
        const hr = Math.floor(data[i].duration / 3600);
        const mins = Math.floor((data[i].duration % 3600) / 60);
        obj.bottom_layout = {
            title: data[i].topic,
            title_color: '#000000',
            sub_title: data[i].duration ? `${hr > 0 ? `${hr} hr` : ''}${mins > 0 ? `${mins} mins` : ''}` : '',
            sub_title_color: '#000000',
            button: {
                text: studentLocale === 'hi' ? 'अभी ज्वाइन करें' : 'Join Now',
                text_color: '#ea532c',
                background_color: '#ffffff',
                border_color: '#ea532c',
            },
        };
        obj.deeplink = `doubtnutapp://course_details?id=${data[i].chapter_assortment}`;
        if (versionCode > 866) {
            obj.bottom_layout.button.deeplink = `doubtnutapp://course_details?id=${data[i].chapter_assortment}`;
        } else {
            obj.bottom_layout.button.action = {
                action_data: {
                    id: data[i].chapter_assortment,
                },
            };
        }
        // dont push the item if autoplay resource is empty to avoid crash
        widgets.push({
            widget_data: {
                is_live: isLive,
                live_text: 'LIVE',
                title,
                auto_play: true,
                auto_play_initiation: 500,
                auto_play_duration: 15000,
                scroll_direction: 'horizontal',
                id: obj.assortment_id,
                items: [{
                    type: 'widget_child_autoplay',
                    data: obj,
                },
                ],
            },
            widget_type: 'widget_autoplay',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
        });
    }

    return widgets;
}

async function homepageVideoWidgetWithAutoplay({
    db,
    data,
    title,
    isLive = true,
    studentLocale,
    config,
    paymentCardState,
    versionCode,
    pageValue = 'homepage',
}) {
    const items = [];
    for (let i = 0; i < data.length; i++) {
        const obj = createVideoDataObject(data[i], paymentCardState, studentLocale, true, versionCode, pageValue);
        obj.card_width = '1.02';
        if (versionCode > 945) {
            obj.card_width = '1.25';
        }
        obj.card_ratio = '16:9';
        if (pageValue === 'camerapage') {
            obj.card_width = null;
        }
        obj.target_exam = data[i].category || '';
        // eslint-disable-next-line no-await-in-loop
        const videoResources = await AnswerContainer.getAnswerVideoResource(db, config, data[i].answer_id, obj.id, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, false);
        if (videoResources && videoResources.length) {
            obj.video_resource = {
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
        const hr = Math.floor(data[i].duration / 3600);
        const mins = Math.floor((data[i].duration % 3600) / 60);
        obj.bottom_layout = {
            title: data[i].topic,
            title_color: '#000000',
            sub_title: data[i].duration ? `${hr > 0 ? `${hr} hr` : ''}${mins > 0 ? `${mins} mins` : ''}` : '',
            sub_title_color: '#000000',
            button: {
                text: studentLocale === 'hi' ? 'अभी ज्वाइन करें' : 'Join Now',
                text_color: '#ea532c',
                background_color: '#ffffff',
                border_color: '#ea532c',
            },
        };
        obj.deeplink = `doubtnutapp://course_details?id=${data[i].chapter_assortment}`;
        if (versionCode > 866) {
            obj.bottom_layout.button.deeplink = `doubtnutapp://course_details?id=${data[i].chapter_assortment}`;
        } else {
            obj.bottom_layout.button.action = {
                action_data: {
                    id: data[i].chapter_assortment,
                },
            };
        }
        // dont push the item if autoplay resource is empty to avoid crash
        items.push({ type: 'widget_child_autoplay', data: obj });
    }
    const widget = {
        is_live: isLive,
        live_text: studentLocale === 'hi' ? 'लाइव' : 'LIVE',
        title,
        auto_play: true,
        auto_play_initiation: 500,
        auto_play_duration: 15000,
        scroll_direction: 'horizontal',
        items,
    };
    return pageValue === 'explore' ? { type: 'widget_autoplay', data: widget } : widget;
}

async function homepagePaidCoursesCarousel({
    db,
    data,
    xAuthToken,
    versionCode,
    studentLocale,
    studentId,
    page,
}) {
    const paymentCardState = { isVip: true };
    const assortmentList = [];
    data.map((item) => assortmentList.push(item.course_assortment));
    const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, assortmentList, studentId, true, xAuthToken);
    const items = [];
    for (let i = 0; i < data.length; i++) {
        const obj = createVideoDataObject(data[i], paymentCardState, studentLocale, true);
        const displayPrice = assortmentPriceMapping && assortmentPriceMapping[data[i].course_assortment] ? assortmentPriceMapping[data[i].course_assortment].display_price : 0;
        obj.image_vertical_bias = 1;
        obj.card_width = 1.05;
        obj.title_text_color = '#54138a';
        obj.image_vertical_bias = 0.5;
        obj.title = data[i].display_name;
        obj.is_title_bold = true;
        obj.payment_deeplink = 'doubtnutapp://course_category?category_id=Kota%20Classes';
        obj.sub_title = studentLocale === 'hi' ? 'हिंदी और अंग्रेजी दोनों माध्यम में लेक्चर' : 'Videos available in both English and Hindi';
        obj.is_sub_title_bold = false;
        obj.is_vip = true;
        obj.vip_text = 'VIP';
        let deeplink = 'doubtnutapp://course_category?category_id=Kota%20Classes';
        if (assortmentPriceMapping && assortmentPriceMapping[parseInt(data[i].course_assortment)]) {
            // deeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[parseInt(data[i].course_assortment)].package_variant}`;
            deeplink = versionCode >= 861 ? `doubtnutapp://bundle_dialog?id=${data[i].course_assortment}&source=HOMEPAGE` : `doubtnutapp://vip?assortment_id=${data[i].course_assortment}`;
        }
        obj.bottom_layout = {
            title1: displayPrice > 0 ? `₹${assortmentPriceMapping[data[i].course_assortment].monthly_price}/Mo` : '',
            title1_color: '#292929',
            title2: '',
            title2_color: '#292929',
            title3: '',
            title3_color: '#e34c4c',
            button: {
                text: studentLocale === 'hi' ? 'अभी खरीदें' : 'BUY NOW',
                text_color: '#ffffff',
                background_color: '#ea532c',
                border_color: '#ea532c',
                action: {
                    deeplink,
                    action_data: {
                        id: data[i].assortment_id,
                    },
                },
            },
        };
        if (data[i].demo_video_thumbnail) {
            obj.color = '#ffffff00';
            obj.image_bg_card = buildStaticCdnUrl(data[i].demo_video_thumbnail);
            obj.title1 = '';
            obj.title2 = '';
            obj.subject = '';
            obj.image_url = '';
            obj.is_vip = false;
        }
        items.push({
            type: 'widget_paid_course',
            data: obj,
            extra_params: {
                be_source: page,
                widget_type: 'widget_paid_course',
            },
        });
    }
    const widget = {
        is_bottom_text_underlined: true,
        scroll_direction: 'horizontal',
        bottom_text: studentLocale === 'hi' ? 'अधिक जानकारी के लिए हमसे बात करें' : 'Need help! Talk to us',
        helpline_number: '01247158250',
        items,
    };
    return widget;
}

function getCourseTestsWidget({
    locale,
    result,
    config,
    showNewDesign,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        let actionText = locale === 'hi' ? 'शुरू करो' : 'Start Test';
        if (result[i].status && result[i].status !== 'SUBSCRIBED') {
            actionText = locale === 'hi' ? 'परिणाम देखो' : 'See Result';
        }
        if (moment().add(5, 'hours').add(30, 'minutes').isBefore(result[i].live_at)) {
            actionText = locale === 'hi' ? 'जल्द आएगा' : 'Coming Soon';
        }
        let time = '';
        if (moment().add(5, 'hours').add(30, 'minutes').isSame(moment(result[i].live_at), 'day')) {
            time = moment(result[i].live_at).format('hh:mm A');
        } else if (result[i].live_at) {
            time = moment(result[i].live_at).format('DD MMM');
        }
        const hr = Math.floor(result[i].duration_in_min / 60);
        const mins = result[i].duration_in_min % 60;
        items.push({
            type: showNewDesign ? 'widget_course_test_v2' : 'widget_course_test',
            data: {
                test_id: `${result[i].test_id || 1}`,
                id: `${result[i].test_id || 1}`,
                title: showNewDesign ? `${result[i].no_of_questions} ${locale === 'hi' ? 'प्रश्न' : 'questions'}` : result[i].test_title,
                questions_count: showNewDesign ? result[i].test_title : `${result[i].no_of_questions} ${locale === 'hi' ? 'प्रश्न' : 'questions'}`,
                duration: `${hr && hr > 0 ? `${hr} hr` : ''}${mins && mins > 0 ? `${mins} mins` : ''}`,
                action_text: actionText,
                status: result[i].status && result[i].status !== 'SUBSCRIBED' ? Data.completedText(locale) : Data.pendingText(locale),
                submit_date: time, // result[i].status && result[i].status !== 'SUBSCRIBED' ? moment(result[i].completed_at).format('DD MMM') : '',
                bottom_text: '',
                is_completed: result[i].status && result[i].status !== 'SUBSCRIBED',
                margin: true,
                image_url: result[i].status && result[i].status !== 'SUBSCRIBED' ? `${config.cdn_url}engagement_framework/73C1D5D0-8910-E78C-DDFF-3FBCF8243483.webp` : `${config.cdn_url}engagement_framework/E2C14B68-931B-9FB1-AD14-0CA2ECB1DEF9.webp`,
            },
            extra_params: {
                source: 'course_page_test_card',
            },
        });
    }
    return items;
}

async function getPostPuchaseCourseCardsWidget({
    locale,
    result,
    carousel,
    tabDetails,
    courseDetail,
    assortmentID,
    isBrowser,
    config,
    studentID,
    batchID,
    db,
    trialExpired,
    isFreeApp,
}) {
    let items = [];
    let comingSoonText = locale === 'hi' ? 'जल्द आएगा' : 'Coming Soon';
    for (let i = 0; i < result.length; i++) {
        if (tabDetails[result[i].card_id] !== -1) {
            let isContent = !!(tabDetails[result[i].card_id] && tabDetails[result[i].card_id] !== 0);
            if (result[i].card_id !== 'faq' && result[i].card_id !== 'dictionary') {
                result[i].deeplink = `${result[i].deeplink}&assortment_id=${assortmentID}`;
            }
            if (result[i].card_id === 'study_group') {
                let idToBeUsed = assortmentID;
                if (!_.isEmpty(courseDetail) && courseDetail[0].assortment_type === 'subject') {
                    const parentAssortmentId = await CourseV2Mysql.getCourseIdForSubjectAssorment(db.mysql.read, assortmentID);
                    if (!_.isEmpty(parentAssortmentId)) {
                        idToBeUsed = parentAssortmentId[0].assortment_id;
                    }
                }
                const groupId = `tg-${idToBeUsed}-${batchID}`;
                const groupData = await studyGroupMysql.getGroupId(groupId, db.mysql.read);
                if (!_.isEmpty(groupData)) {
                    const isActive = await studyGroupMysql.isMember(groupData[0].id, studentID, db.mysql.read);
                    if (!_.isEmpty(isActive) && isActive[0].EXIST) {
                        result[i].deeplink = `doubtnutapp://study_group_chat?group_id=${groupId}`;
                    }
                }
            }
            if (courseDetail[0].is_free && _.includes(['notes', 'tests', 'homework', 'books', 'previousYears', 'leaderboard'], result[i].card_id)) {
                if (isFreeApp) {
                    continue;
                }
                comingSoonText = locale === 'hi' ? 'खरीदे हुए कोर्सेस में\nउपलब्ध' : 'Available in Paid\nCourses';
                isContent = false;
            }
            if (trialExpired) {
                comingSoonText = locale === 'hi' ? 'खरीदने के बाद उपलब्ध' : 'Available after buying';
                result[i].deeplink = `doubtnutapp://bundle_dialog?id=${assortmentID}&source=PRE_PURCHASE_BUY_BUTTON||TRIAL_END_STATE`;
            }
            if (isBrowser && result[i].card_id !== 'recent') {
                // eslint-disable-next-line no-await-in-loop
                const deeplink = await CourseV2Container.getCourseDetailsBranchDeeplinkFromAppDeeplink(db, assortmentID);
                result[i].deeplink = deeplink;
            }
            if (isBrowser) {
                result[i].image_url = DataHelper.web.course_cards.image_bg[result[i].card_id] || result[i].image_url;
                result[i].grey_image_url = result[i].image_url;
                result[i].title_color = DataHelper.web.course_cards.title_color[result[i].card_id] || result[i].title_color;
            }
            if (result[i].assortment_list && !(JSON.parse(result[i].assortment_list).includes(Number(assortmentID)) || JSON.parse(result[i].assortment_list).includes(assortmentID))) {
                continue;
            }
            if (result[i].query_to_use) {
                const query = await db.mysql.read.query(`${result[i].query_to_use}`);
                const assortmentIds = [];
                query.forEach((item) => assortmentIds.push(Number(item.assortment_id)));
                if (!assortmentIds.includes(Number(assortmentID))) {
                    continue;
                }
            }
            items.push({
                id: result[i].id,
                card_id: result[i].card_id,
                bg_image: isContent ? result[i].image_url || '' : result[i].grey_image_url,
                display_name: courseDetail[0].schedule_type === 'recorded' && locale === 'hi' && result[i].card_id === 'recent' ? 'क्लास वीडियोज़' : result[i].title,
                text_font_size: result[i].title_size || (locale === 'hi' ? 20 : 19),
                display_name_color: result[i].title_color || '#ffffff',
                deeplink: result[i].deeplink || '',
                is_content_available: isContent || trialExpired,
                bottom_title: !isContent ? comingSoonText : '',
                tts_display_text: result[i].title,
                tts_text: result[i].title,
            });
        }
    }
    // course leaderboard
    for (let i = 0; i < items.length; i++) {
        if (items[i].card_id === 'leaderboard' && items[i].bottom_title === '') {
            const page = 'course_details';
            items[i].display_name_color = '#000000';
            let newId;
            if (batchID) {
                newId = `${assortmentID}_${batchID}`;
            }
            // eslint-disable-next-line no-await-in-loop
            const myRank = await CourseRedisV2.getUserCourseLeaderboardAllRank(db.redis.read, newId, studentID);
            // eslint-disable-next-line no-await-in-loop
            const score = await CourseV2Mysql.getStudentScoreAll(db.mysql.read, assortmentID, studentID);
            let myScore = 0;
            let totalMarks = 0;
            if (score && score[0]) {
                for (let j = 0; j < score.length; j++) {
                    myScore += score[j].totalscore;
                    totalMarks += score[j].totalmarks;
                }
            }
            const item = [];
            const profileData = gamificationHelper.getStudentProfile(config, null, locale, myRank, myScore, totalMarks, null, page);
            item.push(profileData[0]);
            item.push(profileData[1]);
            const rankData = {
                1: item,
            };
            items[i].data = rankData;
            break;
        }
    }
    items = _.orderBy(items, 'is_content_available', 'desc');
    if (isBrowser) {
        items = items.sort((item1, item2) => item1.id - item2.id);
    }
    return {
        type: carousel.carousel_type,
        data: {
            title: carousel.title,
            items,
        },
    };
}

function getPostPuchaseCourseSubjectsWidget({
    locale,
    result,
    carousel,
    assortmentID,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        let displayName = locale === 'hi' && DataHelper.subjectHindi[result[i].display_name.toUpperCase()] ? DataHelper.subjectHindi[result[i].display_name.toUpperCase()] : result[i].display_name;
        if (+assortmentID === 15 || +assortmentID === 16) {
            if (_.includes([180, 182, 184, 185, 186, 187], result[i].course_resource_id)) {
                displayName = `${displayName} - XI`;
            } else {
                displayName = `${displayName} - XII`;
            }
        }
        items.push({
            bg_image: Data.coursePageSubjectBackground[result[i].display_name.toUpperCase()] || Data.coursePageSubjectBackground.ALL,
            display_name: displayName,
            text_font_size: locale === 'hi' ? 20 : 18,
            deeplink: `doubtnutapp://course_detail_info?subject=${result[i].display_name}&assortment_id=${result[i].course_assortment}&tab=subject`,
            display_name_color: '#ffffff',
        });
    }
    return {
        type: carousel.carousel_type,
        data: {
            title: carousel.title,
            items,
        },
    };
}

async function getPostPuchaseLecturesWidget({
    db,
    home,
    locale,
    config,
    result,
    carousel,
    assortmentID,
    newDemoVideoExperiment,
    versionCode,
    isBrowser,
    source,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const obj = {
            title1: result[i].display,
            state: result[i].stream_status === 'ACTIVE' ? 1 : 2,
            title2: `By ${result[i].expert_name ? result[i].expert_name.toUpperCase() : Data.liveclassDefaultFaculty}`,
            top_title1: locale === 'hi' ? `${moment(result[i].live_at).format('DD-MMM-YY')} को छूटा हुआ` : `Missed on ${moment(result[i].live_at).format('DD-MMM-YY')}`,
            image_url: result[i].faculty_image || result[i].expert_image,
            question_id: result[i].resource_reference || '',
            subject: result[i].subject,
            color: liveclassHelper.getBarColorForLiveclassHomepage(result[i].subject.toUpperCase()),
            page: 'COURSE_DETAIL',
            image_bg_card: Data.getBgImageForLiveCarousel(result[i].subject.toLowerCase()),
            live_at: moment(result[i].live_at).unix() * 1000,
            live_date: moment(result[i].live_at).format('DD MMM hh:mm'),
            is_live: false,
            card_width: home ? '1.1' : '1',
            card_ratio: '16:9',
            auto_play: true,
            auto_play_initiation: 500,
            video_resource: {},
            top_title: `Lecture #${result[i].q_order}`,
        };
        if (!result[i].live_at && result[i].view_at) {
            obj.top_title1 = `Viewed On ${moment(result[i].view_at).format('DD-MMM-YY')}`;
        } else if (result[i].top_title1 === 'upNext') {
            obj.top_title1 = locale === 'hi' ? `अगला देखें - ${result[i].chapter}` : `Next Up from ${result[i].chapter}`;
        } else if (result[i].top_title1 === 'continueWatching') {
            obj.top_title1 = locale === 'hi' ? `हाल ही में देखा हुआ - ${result[i].chapter}` : `Continue Watching from ${result[i].chapter}`;
        } else if (result[i].top_title1 === 'demo') {
            obj.top_title1 = locale === 'hi' ? `${DataHelper.subjectHindi[result[i].subject.toUpperCase()] || result[i].subject} की पहली क्लास` : `1st Lecture of ${result[i].subject}`;
        } else if (!result[i].live_at) {
            obj.top_title1 = locale === 'hi' ? 'आपके लिए लेक्चर' : 'Lectures for you';
        }
        if (result[i].subject.toLowerCase() === 'announcement') {
            obj.image_bg_card = result[i].display_image_square || obj.image_bg_card;
            obj.top_title1 = locale === 'hi' ? 'महत्वपूर्ण सूचना' : 'IMPORTANT ANNOUNCEMENT';
            if (result[i].display_image_square) {
                obj.title1 = '';
                obj.title2 = '';
                obj.subject = '';
                obj.color = '';
                obj.image_url = '';
            }
        }
        const now = moment().add(5, 'hours').add(30, 'minutes');
        if ((((result[i].stream_status === 'ACTIVE' || newDemoVideoExperiment) && result[i].resource_type === 4) || (_.includes([1, 8], result[i].resource_type) && (moment(result[i].live_at).add(result[i].duration, 'seconds') > now || newDemoVideoExperiment))) && moment(result[i].live_at) < now) {
            // eslint-disable-next-line no-await-in-loop
            let offsetEnabled = false;
            let videoResources;
            if (newDemoVideoExperiment) {
                offsetEnabled = true;
                videoResources = await AnswerContainer.getAnswerVideoResource(db, config, result[i].answer_id, result[i].resource_reference, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE'], versionCode, offsetEnabled);
                obj.top_title1 = locale === 'hi' ? 'डेमो वीडियो' : 'Demo Video';
            } else {
                videoResources = await AnswerContainer.getAnswerVideoResource(db, config, result[i].answer_id, result[i].resource_reference, ['DASH', 'HLS', 'RTMP', 'BLOB', 'YOUTUBE']);
                obj.top_title1 = locale === 'hi' ? 'चल रही क्लास' : 'Playing Now';
            }
            obj.is_live = true;
            if (videoResources && videoResources.length) {
                obj.video_resource = {
                    resource: videoResources[0].resource,
                    drm_scheme: videoResources[0].drm_scheme,
                    cdn_base_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/',
                    media_type: videoResources[0].media_type,
                    drm_license_url: videoResources[0].drm_license_url,
                    fallback_url: 'https://d3cvwyf9ksu0h5.cloudfront.net/text',
                    hls_timeout: 0,
                    auto_play_duration: 150000,
                    offset: (offsetEnabled) ? videoResources[0].offset : '',
                };
            }
            items.push({
                type: 'course_video',
                data: obj,
            });
        } else if (_.includes([1, 8], result[i].resource_type)) {
            items.push({
                type: 'course_video',
                data: obj,
            });
        } else if (home && result[i].resource_type === 9) {
            const hr = Math.floor(result[i].duration_in_min / 60);
            const mins = result[i].duration_in_min % 60;
            let deeplink;
            if (isBrowser) {
                // eslint-disable-next-line no-await-in-loop
                deeplink = await CourseV2Container.getCourseDetailsBranchDeeplinkFromAppDeeplink(db, assortmentID);
            }
            items.push({
                type: 'widget_test',
                data: {
                    title: result[i].test_title,
                    is_premium: false,
                    is_vip: false,
                    color: '#0e788f',
                    id: result[i].resource_reference,
                    title2: `${result[i].no_of_questions} ${locale === 'hi' ? 'प्रश्न' : 'questions'}`,
                    duration: result[i].duration_in_min ? `${hr > 0 ? `${hr} hr` : ''}${mins > 0 ? `${mins} mins` : ''}` : '',
                    image_url: '',
                    date: moment(result[i].live_at).format('DD MMM YYYY hh:mm'),
                    bottom_title: locale === 'hi' ? 'शुरू करो' : 'Start Test',
                    is_live: false,
                    card_ratio: '16:9',
                    card_width: '1.1',
                    deeplink,
                },
            });
        } else if (result[i].resource_type === 9) {
            const testObj = getCourseTestsWidget({ locale, result: [result[i]], config });
            if (testObj.length) {
                testObj[0].extra_params = {
                    source: 'course_page_view_all_missed',
                };
                items.push(testObj[0]);
            }
        }

        if (_.includes([1, 8, 4], result[i].resource_type) && items.length) {
            items[items.length - 1].extra_params = {
                source: home ? 'course_homepage' : 'course_page_view_all_missed',
            };
            if (source === 'trial_course_page') {
                items[items.length - 1].extra_params = {
                    source,
                };
                items[items.length - 1].group_id = result[i].subject.toLowerCase();
            }
        }
    }
    if (home && !newDemoVideoExperiment && carousel.view_all_link !== '') {
        items.push({
            type: 'widget_view_all',
            data: {
                title: locale === 'hi' ? 'सभी देखें' : 'View All',
                card_width: '2.8',
                deeplink: carousel.view_all_link || `doubtnutapp://course_detail_info?assortment_id=${assortmentID}&tab=missed_classes`,
            },
        });
    }
    let title = '';
    if (result.length && !result[0].live_at) {
        title = locale === 'hi' ? 'हाल ही में देखे गए' : 'Recently watched';
    } else {
        title = carousel.title;
    }
    return {
        type: carousel.carousel_type,
        data: {
            scroll_direction: home ? 'horizontal' : 'vertical',
            title,
            auto_play: source !== 'SRP_WIDGET',
            auto_play_initiation: 500,
            items,
        },
    };
}

function getPostPuchasePaymentWidget({
    locale,
    result,
    carousel,
}) {
    const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
    const obj = {
        type: carousel.carousel_type,
        data: {
            title: carousel.title,
            title_color: '#ff0000',
            background_color: '#fff2f2',
            border_color: '#ff0000',
            subtitle: locale === 'hi' ? `इस कोर्स की वैलिडिटी बस ${moment(result[0].end_date).diff(today, 'days') + 1} दिन के लिए रह गयी है` : `Iss course ki validity sirf ${moment(result[0].end_date).diff(today, 'days') + 1} din reh gayi hai.`,
            subtitle_color: '#504949',
            button_text: locale === 'hi' ? 'पैक को रीचार्ज करें' : 'Apna package recharge karein',
            button_text_color: '#ffffff',
            button_color: '#eb532c',
            deeplink: `doubtnutapp://bundle_dialog?id=${result[0].assortment_id}&source=POST_PURCHASE`,
        },
    };
    if (carousel.view_type === 'upgrade') {
        obj.data.subtitle = locale === 'hi' ? 'तो आप हमारे इस शानदार ऑफर का लाभ उठाकर अपने कोर्स की वैधता बढ़ायें !' : 'Toh aap hamare is shaandaar offer ka use karke apne course ki validity badhaayein !';
        obj.data.button_text = locale === 'hi' ? 'वैधता अभी बढ़ायें' : 'Validity abhi badhayein';
    }
    return obj;
}

function createTitleWithtimestamps(result, locale) {
    const endStr = locale === 'hi' ? 'अंत' : 'END';
    let timeArr = result.meta_info ? result.meta_info.split('|').map((item) => parseInt(item)) : [];
    let topicsArr = result.display.split('|');
    let offsetTopics = result.name.split('|');
    let objNew = [];
    for (let i = 0; i < topicsArr.length; i++) {
        objNew.push({
            topic: topicsArr[i],
            time: timeArr[i],
            offsetTopic: offsetTopics[i],
        });
    }
    objNew = objNew.sort((a, b) => a.time - b.time);
    const newtimeArr = [];
    const newTopicsArr = [];
    const newOffsetTopics = [];
    for (let i = 0; i < objNew.length; i++) {
        newtimeArr.push(objNew[i].time);
        newTopicsArr.push(objNew[i].topic);
        newOffsetTopics.push(objNew[i].offsetTopic);
    }
    timeArr = newtimeArr;
    topicsArr = newTopicsArr;
    offsetTopics = newOffsetTopics;
    let titleNew = '';
    let startTimeTitle = '';
    let offsetsArr = [];
    timeArr.push(result.duration);
    // if offsets provided in meta info the number of topics should be equal to the number of offsets -1
    // eslint-disable-next-line no-restricted-globals
    if (timeArr.length - 1 === topicsArr.length && timeArr.length > 0 && !isNaN(timeArr[0])) {
        for (let index = 0; index < timeArr.length - 1; index++) {
            let timeStr;
            // not last timestamp
            if (index !== timeArr.length - 2) {
                // if time less than an hour then show mm:ss else show hh:mm:ss
                timeStr = timeArr[index] > 3600 || timeArr[index + 1] > 3600 ? `${moment().startOf('day').add(timeArr[index] * 1000).format('HH:mm:ss')} - ${moment().startOf('day').add(timeArr[index + 1] * 1000).format('HH:mm:ss')}` : `${moment().startOf('day').add(timeArr[index] * 1000).format('mm:ss')} - ${moment().startOf('day').add(timeArr[index + 1] * 1000).format('mm:ss')}`;
                titleNew += `${topicsArr[index]}    <font color='#0645ad'><small>${timeStr}</small></font>|`;
            } else if (!result.duration) {
                // if time duration null for the video show end
                timeStr = timeArr[index] > 3600 || timeArr[index + 1] > 3600 ? `${moment().startOf('day').add(timeArr[index] * 1000).format('HH:mm:ss')} - ${endStr}` : `${moment().startOf('day').add(timeArr[index] * 1000).format('mm:ss')} - ${endStr}`;
                titleNew += `${topicsArr[index]}    <font color='#0645ad'><small>${timeStr}</small></font>`;
            } else {
                // if time duration not null show end time
                timeStr = timeArr[index] > 3600 || timeArr[index + 1] > 3600 ? `${moment().startOf('day').add(timeArr[index] * 1000).format('HH:mm:ss')} - ${moment().startOf('day').add(timeArr[index + 1] * 1000).format('HH:mm:ss')}` : `${moment().startOf('day').add(timeArr[index] * 1000).format('mm:ss')} - ${moment().startOf('day').add(timeArr[index + 1] * 1000).format('mm:ss')}`;
                titleNew += `${topicsArr[index]}    <font color='#0645ad'><small>${timeStr}</small></font>`;
            }
            startTimeTitle += `${moment().startOf('day').add(timeArr[index] * 1000).format(`${timeArr[index] > 3600 ? 'HH:mm:ss' : 'mm:ss'}`)}|`;
        }
        // removing endtime from duration
        offsetsArr = timeArr.slice(0, -1);
    }
    return {
        offsetsArr,
        titleNew,
        startTimeTitle,
        offsetTopics,
    };
}

function getAllClassesWidget({
    locale,
    result,
    showNotes,
    chapterName,
    showHomework,
    chapterAssortment,
}) {
    const items = [];
    const singleLectureText = locale === 'hi' ? 'कक्षा' : 'lecture';
    const multiLectureText = locale === 'hi' ? 'कक्षाएं' : 'lectures';
    for (let i = 0; i < result.length; i++) {
        let state = moment().add(5, 'hours').add(30, 'minutes').isBefore(result[i].live_at) ? 0 : 2;
        if (result[i].stream_status === 'ACTIVE') {
            state = 1;
        }

        const { offsetsArr, titleNew } = createTitleWithtimestamps(result[i], locale);
        const title = result[i].display;

        items.push({
            id: result[i].resource_reference,
            state,
            assortment_id: result[i].assortment_id,
            offset: result[i].video_time,
            page: 'COURSE_DETAIL',
            live_at: moment(result[i].live_at).format('DD MMM, hh:mm A') === 'Invalid date' ? null : moment(result[i].live_at).format('DD MMM, hh:mm A'),
            is_downloadable: !!(!result[i].is_free && result[i].vdo_cipher_id && result[i].is_vdo_ready === 2),
            is_vip: false,
            is_premium: false,
            lec_title: locale === 'hi' ? `लेक्चर ${i + 1}` : `Lecture ${i + 1}`,
            title_with_timestamps: titleNew,
            offsets_arr: offsetsArr,
            progress: Math.floor(result[i].progress_status),
            title,
            title1: locale === 'hi' && DataHelper.subjectHindi[result[i].subject.toUpperCase()] ? DataHelper.subjectHindi[result[i].subject.toUpperCase()] : result[i].subject,
            title2: title,
            color: liveclassHelper.getBarColorForLiveclassHomepage(result[0].subject.toUpperCase()),
        });
    }
    const actions = [];
    if (showNotes) {
        actions.push({
            title: locale === 'hi' ? 'नोट्स' : 'Notes',
            title_text_size: '15',
            title_text_color: '#273de9',
            deeplink: `doubtnutapp://course_detail_info?tab=notes&assortment_id=${chapterAssortment}`,
        });
    }
    if (showHomework) {
        actions.push({
            title: locale === 'hi' ? 'होमवर्क' : 'Homework',
            title_text_size: '15',
            title_text_color: '#273de9',
            deeplink: `doubtnutapp://course_detail_info?tab=homework&assortment_id=${chapterAssortment}`,
        });
    }
    const data = {
        title1: locale === 'hi' && DataHelper.subjectHindi[result[0].subject.toUpperCase()] ? DataHelper.subjectHindi[result[0].subject.toUpperCase()] : result[0].subject,
        title2: chapterName,
        lecture_count: items.length === 1 ? `1 ${singleLectureText}` : `${items.length} ${multiLectureText}`,
        is_expanded: false,
        border_color: liveclassHelper.getBarColorForLiveclassHomepage(result[0].subject.toUpperCase()),
        items,
    };
    if (actions.length) {
        data.actions = actions;
    }
    return {
        type: 'all_classes',
        data,
    };
}

function getCourseHomeworkWidget({
    locale,
    result,
    config,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            id: result[i].question_id || '',
            chapter: result[i].chapter,
            subject: locale === 'hi' && DataHelper.subjectHindi[result[i].subject.toUpperCase()] ? DataHelper.subjectHindi[result[i].subject.toUpperCase()] : result[i].subject,
            title: result[i].name,
            status: !!result[i].status,
            subject_color: liveclassHelper.getBarColorForLiveclassHomepage(result[i].subject.toUpperCase()),
            status_message: result[i].status ? Data.completedText(locale) : Data.pendingText(locale),
            status_image: result[i].status ? `${config.staticCDN}engagement_framework/8ED7B8A3-375A-8FC1-6456-1E52882E9AAC.webp` : `${config.staticCDN}engagement_framework/7F718914-181A-431C-E121-7C674EC6F12B.webp`,
            color: result[i].status ? '#228B22' : '#FF6347',
            question_count_text: result[i].question_list ? `${result[i].question_list.split('|').length} ${locale === 'hi' ? 'प्रश्न' : 'Questions'}` : '0 questions',
            due_data: locale === 'hi' ? `${moment(result[i].live_at).add(1, 'days').format('DD MMM')} तक जमा करें` : `Due on ${moment(result[i].live_at).add(1, 'days').format('DD MMM')}`,
            deeplink: '',
        });
    }
    return {
        type: 'course_homework',
        data: {
            title: locale === 'hi' ? 'होमवर्क' : 'Homework',
            items,
        },
        extra_params: {
            source: 'course_card_homework',
        },
    };
}

function getCourseBooksWidget({
    result,
    locale,
    title,
    isSample,
}) {
    const widgets = [];
    let items = [];
    for (let i = 0; i < result.length; i++) {
        let isThumbanil = true;
        if (!result[i].thumbnail_url || result[i].thumbnail_url === '') {
            isThumbanil = false;
            result[i].thumbnail_url = Data.defaultThumbnailsForBooks[result[i].subject.toUpperCase()] || '';
        }
        const previousYearTitle = locale === 'hi' ? 'पिछले वर्षों के पेपर' : 'Previous Year Papers';
        const subject = locale === 'hi' && DataHelper.subjectHindi[result[i].subject.toUpperCase()] ? DataHelper.subjectHindi[result[i].subject.toUpperCase()] : result[i].subject;
        items.push({
            title: result[i].display_name,
            subtitle: '',
            text1: !isThumbanil ? subject : '',
            text2: result[i].book_type === 'Previous Year' && !isThumbanil ? previousYearTitle : '',
            show_whatsapp: true,
            show_video: false,
            image_url: result[i].thumbnail_url,
            card_width: '2x',
            aspect_ratio: '',
            deeplink: isSample ? '' : `doubtnutapp://playlist?playlist_id=${result[i].playlist_id}&package_details_id=LIBRARY_NEW_BOOK_${result[i].student_id}_${result[i].class}_${result[i].subject.toUpperCase()}&playlist_title=${result[i].display_name}&is_last=0`,
            id: result[i].playlist_id,
            is_premium: true,
            is_vip: !isSample,
            block_content_message: locale === 'hi' ? 'कोर्स खरीदने पे ये सारी किताबों का एक्सेस मिलेगा' : 'Buying the course will give you access to all these books!',
        });
        if ((items.length === 2) || (i === result.length - 1)) {
            widgets.push({
                type: 'horizontal_list',
                data: {
                    items,
                },
                layout_config: {
                    margin_top: 0,
                    margin_bottom: 0,
                },
            });
            items = [];
        }
    }
    if (widgets.length) {
        widgets[0].data.title = title;
    }
    return widgets;
}

function createTopFreeClassesObject(data, paymentCardState, studentLocale) {
    const obj = {};
    obj.id = data.question_id;
    obj.assortment_id = data.assortment_id;
    obj.page = 'TOP_FREE_CLASSES';
    obj.title1 = data.chapter;
    obj.title2 = `By ${data.expert_name ? data.expert_name.toUpperCase() : Data.liveclassDefaultFaculty}`;
    obj.image_url = buildStaticCdnUrl(data.expert_image);
    obj.subject = studentLocale === 'hi' ? Data.subjectLocaleMapping[data.subject][studentLocale] : data.subject;
    obj.color = liveclassHelper.getBarColorForRecentclassHomepage(data.subject);
    obj.player_type = 'liveclass';
    obj.image_bg_card = Data.getBgImage(data.subject.toLowerCase());
    obj.students = 13822;
    obj.interested = 13822;
    obj.state = 2;
    obj.isVip = paymentCardState.siVip;
    obj.card_width = '1.1';
    obj.card_ratio = '16:8';
    const textColors = getTextColor(data.subject.toLowerCase());
    obj.text_color_primary = textColors.text_color_primary;
    obj.text_color_secondary = textColors.text_color_secondary;
    obj.text_color_title = textColors.text_color_title;
    obj.set_width = true;
    obj.button_state = 'multiple';
    obj.image_vertical_bias = 1;
    obj.resource_type = 'video';
    if (data.player_type === 'youtube' && !_.isNull(data.meta_info)) {
        obj.id = data.meta_info;
    }
    obj.button = {
        text: studentLocale === 'hi' ? 'अध्याय पर जाएं' : 'Go to Chapter',
        deeplink: `doubtnutapp://playlist?playlist_id=${data.subject}_${data.master_chapter}&playlist_title=${data.master_chapter}&is_last=1&page=TOP_FREE_CLASSES`,
    };
    return obj;
}

function createTopTeachersClassesObject(data, paymentCardState, studentLocale) {
    const obj = {};
    obj.id = data.question_id;
    obj.page = 'TOP_TEACHERS_CLASSES';
    obj.title1 = data.question;
    obj.title2 = data.chapter;
    obj.image_url = buildStaticCdnUrl(data.expert_image);
    obj.subject = data.subject;
    obj.color = liveclassHelper.getBarColorForRecentclassHomepage(data.subject);
    obj.player_type = 'liveclass';
    obj.image_bg_card = Data.getBgImage(data.subject.toLowerCase());
    obj.students = 13822;
    obj.interested = 13822;
    obj.state = 2;
    obj.isVip = paymentCardState.isVip;
    obj.card_width = '1.1';
    obj.card_ratio = '16:8';
    const textColors = getTextColor(data.subject.toLowerCase());
    obj.text_color_primary = textColors.text_color_primary;
    obj.text_color_secondary = textColors.text_color_secondary;
    obj.text_color_title = textColors.text_color_title;
    obj.set_width = true;
    obj.button_state = 'multiple';
    obj.image_vertical_bias = 1;
    obj.resource_type = 'video';
    const masterChapter = data.master_chapter;
    const final = encodeURIComponent(masterChapter);
    obj.button = {
        text: studentLocale === 'hi' ? 'सभी क्लासेस देखें' : 'View All Classes',
        deeplink: `doubtnutapp://playlist?playlist_id=${data.subject}_${final}_${data.child_playlist_id}&playlist_title=${data.expert_name}&is_last=1&page=TOP_TEACHERS_CLASSES_ALL`,
    };
    return obj;
}

async function generateTopFreeClasses({
    db,
    allSubjects,
    studentLocale,
    studentClass,
    paymentCardState,
    title,
}) {
    const locale = Data.localeMapping[studentLocale];
    const tabs = [];
    const topFreeClassesBySubject = await Promise.all(allSubjects.map(async (item) => {
        let chapters = [];
        // * Fetch recently watched chapters of student from top free classes
        if (item.chapters && item.chapters.length) {
            chapters = await CourseV2Container.getTopFreeClassesBySubjectClassLocaleChapters(db, studentClass, locale, item.subject, item.chapters);
        }
        // * If recenlty watched chapters less than 5, add chapters from top free classes separting the watched chapters
        if (chapters.length < 5) {
            let remainingChapters = await CourseV2Container.getTopFreeClassesBySubjectClassLocale(db, studentClass, locale, item.subject);
            remainingChapters = _.differenceBy(remainingChapters, chapters, 'chapter');
            chapters = chapters.concat(remainingChapters);
            chapters = chapters.slice(0, 5);
        }
        chapters = chapters.map((chapter) => {
            const newObject = createTopFreeClassesObject(chapter, paymentCardState, studentLocale);
            return { type: 'live_class_carousel_card_2', data: newObject };
        });
        return {
            subject: item.subject,
            data: chapters,
        };
    }));
    // * Add subjects tabs which first one as selected
    allSubjects.forEach((item, index) => {
        tabs.push({
            key: item.subject,
            title: studentLocale === 'hi' ? Data.subjectLocaleMapping[item.subject][studentLocale] : item.subject,
            is_selected: index === 0,
        });
    });
    // * Reduce topFreeClassesBySubject to form subject as key and chapters as value
    const data = topFreeClassesBySubject.reduce((acc, item) => ({
        ...acc,
        [item.subject]: item.data,
    }), {});

    const widget = {
        title,
        is_title_bold: true,
        items: data,
        tabs,
    };
    return widget;
}

function generateFacultyGridData({
    carouselsData,
    data,
    config,
}) {
    const items = [];
    for (let i = 0; i < data.length; i++) {
        const o = {};
        o.id = data[i].assortment_id;
        o.bg_image = data[i].display_image_square ? buildStaticCdnUrl(data[i].display_image_square) : `${config.staticCDN}liveclass/ENGLISH_EBG.png`;
        o.image_url = '';
        o.title = '';
        o.subtitle = '';
        o.deeplink = `doubtnutapp://course_details?id=${data[i].assortment_id}`;
        items.push(o);
    }
    const obj = {
        type: carouselsData.carousel_type,
        data: {
            title: carouselsData.title,
            items,
            link_text: '',
        },
    };
    return obj;
}

async function generateRelatedClassesCarousel({
    locale,
    result,
    carousel,
    questionID,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const obj = {
            title1: result[i].display,
            state: result[i].stream_status === 'ACTIVE' ? 1 : 2,
            title2: `By ${result[i].expert_name ? result[i].expert_name.toUpperCase() : Data.liveclassDefaultFaculty}`,
            image_url: result[i].faculty_image || result[i].expert_image,
            id: result[i].resource_reference || '',
            subject: result[i].subject,
            color: liveclassHelper.getBarColorForLiveclassHomepage(result[i].subject.toUpperCase()),
            page: 'CHAPTER_SERIES_CAROUSAL',
            image_bg_card: Data.getBgImageForLiveCarousel(result[i].subject.toLowerCase()),
            live_at: moment(result[i].live_at).unix() * 1000,
            live_date: moment(result[i].live_at).format('DD MMM hh:mm'),
            card_width: '1.1',
            card_ratio: '16:9',
            player_type: 'liveclass',
            resource_type: 'video',
            set_width: true,
        };
        items.push({
            type: 'live_class_carousel_card_2',
            data: obj,
        });
    }

    if (questionID) {
        items.push({
            type: 'widget_view_all',
            data: {
                title: locale === 'hi' ? 'अगला अध्याय' : 'Next Chapter',
                card_width: '2.8',
                deeplink: `doubtnutapp://video?qid=${questionID}&page=CHAPTER_SERIES_CAROUSAL`,
            },
        });
    }
    return {
        type: carousel.carousel_type,
        data: {
            scroll_direction: 'horizontal',
            title: carousel.title,
            items,
        },
    };
}

function getCourseReviewWidget({
    locale,
    config,
    result,
    assortmentID,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            id: result[i].review_id,
            name: result[i].student_name,
            imageUrl: result[i].student_image,
            description: result[i].review_text,
            rating: `${result[i].student_rating}`,
            imageUrlTwo: `${config.staticCDN}engagement_framework/C33E9618-06D0-1A0A-E5C8-E0108B7A6FBA.webp`,
            deeplink: result[i].review_qid && result[i].review_qid !== '' ? `doubtnutapp://video_dialog?question_id=${result[i].review_qid}&orientation=portrait&page=WHATS_NEW_HOME` : '',
            extra_params: {
                qid: result[i].review_qid || '',
                review_id: `${result[i].review_id}`,
                assortment_id: `${assortmentID}`,
            },
        });
    }
    return {
        type: 'course_testimonial',
        data: {
            title: locale === 'hi' ? 'हमारे छात्र हमारे बारे में क्या कहते हैं' : 'What our students say about us',
            items,
        },
    };
}

function getRenewalNudgesWidget({
    config,
    result,
    nudgeType,
    assortmentID,
    rewardDeeplink,
}) {
    return {
        type: 'widget_nudge',
        data: {
            widget_id: assortmentID,
            nudge_type: nudgeType,
            title: result[0].text || '',
            title_color: '#de0000',
            title_size: 20,
            subtitle: result[0].subtitle_text || '',
            subtitle_color: '#000000',
            subtitle_size: 12,
            cta_text: result[0].display_text || '',
            cta_text_size: 18,
            cta_text_color: '#eb532c',
            deeplink: result[0].deeplink || rewardDeeplink || '',
            is_banner: result[0].is_banner,
            bg_image_url: result[0].display_image_rectangle,
            bg_color: result[0].background_color || '',
            close_image_url: `${config.cdn_url}engagement_framework/B8975444-0537-22E9-7F2B-97ECC3B48225.webp`,
            image_url: result[0].display_image_square || '',
            ratio: result[0].ratio || '16:9',
        },
    };
}

function getSubscriptionValidityWidget({
    result,
    locale,
}) {
    const end = moment(result.end_date).format('DD-MMM-YYYY');
    const daysRem = moment(result.end_date).diff(moment().add(5, 'hours').add(30, 'minutes'), 'days');
    return {
        type: 'text_widget',
        data: {
            title: locale === 'hi' ? `${end} तक वैलिड (${daysRem} दिन बचे हैं)` : `Valid till ${end} (${daysRem + 1} days remaining)`,
            isBold: false,
        },
        layout_config: {
            margin_left: 16,
        },
    };
}

function getTimerBannerWidget({
    result,
}) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    return {
        type: 'widget_coupon_banner',
        data: {
            id: result[0].id,
            title: result[0].text,
            image_url: result[0].display_image_rectangle,
            subtitle: result[0].subtitle_text,
            description: result[0].optional_display_text1,
            heading: result[0].display_text,
            end_time: moment(result[0].end_time).diff(now, 'days'),
            time: moment(result[0].end_time).diff(now),
            deeplink: result[0].deeplink,
            text_color: result[0].background_color,
        },
    };
}

function prePurchaseCourseOptions(courseDetail, locale, enrolledCount, batchDetails) {
    return {
        data: {
            title_one: batchDetails && batchDetails.length && batchDetails[0].start_date && batchDetails[0].end_date
                ? `${moment(batchDetails[0].start_date).format('DD-MMM-YY')} to ${moment(batchDetails[0].end_date).format('DD-MMM-YY')}`
                : `${moment(courseDetail[0].start_date).format('DD-MMM-YY')} to ${moment(courseDetail[0].end_date).format('DD-MMM-YY')}`,
            subtitle_one: locale === 'hi' ? 'कोर्स की अवधि' : 'Course Validity',
            show_icon_one: false,
            deeplink_one: '',
            title_two: DataHelper.getCourseMediumByLocale(locale)[courseDetail[0].meta_info] || courseDetail[0].meta_info,
            subtitle_two: global.t8[locale].t('Study Medium'),
            show_icon_two: false,
            deeplink_two: '',
            title_three: `${enrolledCount}K`,
            subtitle_three: global.t8[locale].t('Enrolled Students'),
            show_icon_three: false,
            deeplink_three: '',
            select_medium_data: {},
        },
        type: 'widget_course_info_widget_2',
    };
}

function prePurchaseCourseInfo(courseDetail, locale) {
    return {
        type: 'widget_course_info_v2',
        data: {
            title: courseDetail[0].display_name,
            subtitle: `Powered By ${courseDetail[0].parent === 2 ? 'VMC' : 'Doubtnut'}`,
            tag_one_text: locale === 'hi' ? 'कुछ ही सीट बाकि' : 'Seats Filling Fast',
            tag_one_bg_color: '#8064F4',
            tag_one_deeplink: `doubtnutapp://bundle_dialog?id=${courseDetail[0].assortment_id}&source=PRE_PURCHASE_BUY_BUTTON`,
            tag_two_text: locale === 'hi' ? 'एफएक्यू' : 'FAQS?',
            tag_two_bg_color: '#2F64D4',
            tag_two_deeplink: `doubtnutapp://bottom_sheet_widget?widget_type=faq&id=${courseDetail[0].assortment_id}`,
            assortment_id: courseDetail[0].assortment_id,
        },
        extra_params: {
            assortment_id: courseDetail[0].assortment_id,
        },
    };
}

function getPrePurchaseCallWidget({
    config,
    locale,
    text,
    tab,
    assortmentID,
}) {
    return {
        type: 'course_calling_widget',
        data: {
            title: text || `${locale === 'hi' ? 'अधिक जानकारी के लिए कॉल करें' : 'Discuss more details on a call'}`,
            titlle_color: '',
            icon_url: `${config.cdn_url}engagement_framework/E54435B5-629F-A8B3-515A-D60F479798FF.webp`,
            mobile: '01247158250',
        },
        extra_params: {
            assortment_id: `${assortmentID}`,
            type: 'calling_card',
            tab,
        },
    };
}

function borderButtonWidget({
    text,
    type,
    icon,
    deeplink,
    assortmentID,
}) {
    const widget = {
        data: {
            text_one: text,
            text_one_size: type === 'coupon' ? '11' : '20',
            text_one_color: type === 'coupon' ? '#ff4001' : '#eb532c',
            bg_color: '',
            bg_stroke_color: '#eb532c',
            assortment_id: assortmentID,
            deep_link: deeplink,
            is_trial_btn: type !== 'coupon' && type !== 'course_preview',
            corner_radius: type === 'coupon' ? '4.0' : '',
            elevation: type === 'coupon' ? '4.0' : '',
            min_height: type === 'coupon' ? '36' : '',
            icon: icon || '',
            icon_size: '15',
            icon_gravity: '2',
            is_offer_btn: type === 'coupon',
        },
        type: 'widget_button_border',
        extra_params: {
            type,
        },
    };
    if (type === 'course_preview') {
        widget.data.text_one_size = '14';
    }
    return widget;
}

function getCourseBuyPlansWidget({
    tab,
    locale,
    config,
    packageDetails,
    enrolledStudentsCount,
    userPackageCurrentAssortment,
}) {
    const items = [];
    // const minimumDuration = packageDetails[packageDetails.length - 1].duration_in_days / 30;
    // const oneMonthPrice = packageDetails[packageDetails.length - 1].display_price / minimumDuration;
    for (let i = 0; i < packageDetails.length; i++) {
        const duration = Math.floor(packageDetails[i].duration_in_days / 30);
        // let durationText = duration === 1 ? `${duration} Month` : `${duration} Months`;
        // if (locale === 'hi') {
        //     durationText = duration === 1 ? `${duration} महीना` : `${duration} महीने`;
        // }
        const monthlyPrice = Math.floor(packageDetails[i].display_price / duration);
        const obj = {
            duration: packageDetails[i].name,
            duration_color: DataHelper.getDurationColor(i),
            duration_size: '8',
            monthly_price: `₹${CourseHelper.numberWithCommas(monthlyPrice)}/${locale === 'hi' ? 'महीना' : 'Month'}`,
            monthly_price_color: '#223D4D',
            monthly_price_size: '11',
            emi: locale === 'hi' ? `${duration} ${duration > 1 ? 'महीनों' : 'माह'} के लिए` : `For ${duration} ${duration > 1 ? 'Months' : 'Month'}`,
            emi_color: '#808080',
            emi_size: '10',
            discount: packageDetails[i].base_price - packageDetails[i].display_price ? `Save ${Math.round(((packageDetails[i].base_price - packageDetails[i].display_price) / packageDetails[i].base_price) * 100)}%` : '',
            discount_color: '#273DE9',
            discount_size: '13',
            amount_to_pay: `₹${CourseHelper.numberWithCommas(packageDetails[i].display_price)}`,
            amount_to_pay_color: '#223D4D',
            amount_to_pay_size: '24',
            amount_strike_through: `₹${CourseHelper.numberWithCommas(packageDetails[i].base_price)}`,
            amount_strike_through_color: '#808080',
            amount_strike_through_size: '13',
            deeplink: `doubtnutapp://vip?variant_id=${packageDetails[i].variant_id}`,
        };
        if (packageDetails[i].bestseller) {
            obj.image_url = locale === 'hi' ? `${config.cdn_url}engagement_framework/04E16E1E-2413-3D96-BA49-A648E4C586DE.webp` : `${config.cdn_url}engagement_framework/6EF92D67-2EFC-4A8E-49F9-A7467EE7ADCD.webp`;
        }
        items.push(obj);
        if ([1000359, 1000360, 1067132, 1067539].includes(packageDetails[i].assortment_id)) {
            obj.emi = '';
            obj.monthly_price = '';
            obj.amount_strike_through = '';
        }
    }
    const data = {
        title: locale === 'hi' ? 'क्लिक कर अपना प्लान चुनें' : 'Click and Choose Your Plan',
        title_color: '#453d37',
        items,
    };
    if (userPackageCurrentAssortment && userPackageCurrentAssortment.length) {
        data.title = locale === 'hi' ? `${enrolledStudentsCount}k बच्चों ने इस कोर्स को खरीदा और पढ़ रहे हैं` : `${enrolledStudentsCount}k people have purchased and studying this course`;
        data.title_size = '16';
        data.image_url_one = `${config.cdn_url}engagement_framework/trial_timer_new.gif`;
        data.image_url_two = `${config.cdn_url}images/2022/01/05/17-58-11-530-PM_frame_516.webp`;
        data.image_url_three = '';
        data.time = moment(userPackageCurrentAssortment[0].end_date).subtract(5, 'hours').subtract(30, 'minutes').unix() * 1000;
        data.time_text_size = '16';
        data.time_text_color = '#ff0000';
        data.bottom_deeplink = 'doubtnutapp://coupon_list?page=explore_view';
        data.bottom_text = locale === 'hi' ? 'सारे कूपन देखें' : 'View All Coupons';
        data.bottom_text_color = '#000000';
        data.bottom_text_size = '12';
        data.bg_color_one = userPackageCurrentAssortment[0].sps_is_active ? '#fae7a3' : '#f7aeae';
        data.bg_color_two = userPackageCurrentAssortment[0].sps_is_active ? '#fff3c7' : '#ffe9e9';
        data.bg_color_one_expired = '#f7aeae';
        data.bg_color_two_expired = '#ffe9e9';
    }
    return {
        type: 'widget_course_plan',
        data,
        extra_params: {
            assortment_id: `${packageDetails[0].assortment_id}`,
            tab,
        },
    };
}

function getPrePurchaseCourseSchedule({ data, locale, carousel }) {
    const dayWiseData = _.groupBy(_.orderBy(data, 'week_number'), 'week_day');
    const timingData = _.orderBy(_.uniqBy(data, (elem) => [elem.schedule_time, elem.subject].join()), 'schedule_time');
    const firstRow = [];
    firstRow.push({ text: locale === 'hi' ? 'समय/दिन' : 'Time/Day', text_color: '#000000', is_bold: true });
    timingData.map((item) => firstRow.push({
        text: moment(item.schedule_time, 'hh:mm:ss').format('hh:mm A'), text_color: '#000000', is_bold: true, id: item.schedule_time, subject: item.subject,
    }));
    const items = [];
    items.push({ cell_list: firstRow });
    for (const key in dayWiseData) {
        if (dayWiseData[key]) {
            const row = [];
            row.push({ text: key, text_color: '#000000', is_bold: false });
            for (let i = 1; i < firstRow.length; i++) {
                let requiredClass = dayWiseData[key].filter((e) => e.schedule_time === firstRow[i].id && e.subject === firstRow[i].subject);
                if (requiredClass.length) {
                    requiredClass = requiredClass[0];
                    const reminder = requiredClass.calendar_link.replace('<calendar_title>', requiredClass.calendar_title).replace('<calendar_description>', requiredClass.calendar_description).replace('<group_week_days>', requiredClass.group_week_days);
                    row.push({
                        text: requiredClass.subject_name_localised, text_color: liveclassHelper.getBarColorForLiveclassHomepage(requiredClass.subject.toUpperCase()), is_bold: true, reminder_link: reminder,
                    });
                } else {
                    row.push({
                        text: '', text_color: '', is_bold: true, reminder_link: '',
                    });
                }
            }
            items.push({ cell_list: row });
        }
    }
    const widget = {
        type: carousel.carousel_type,
        data: {
            title: locale === 'hi' ? 'समय-दिन' : 'Time-Table',
            title_size: '18',
            title_color: '#000000',
            is_expanded: true,
            timetable_data: items,
        },
    };
    if (carousel.carousel_type === 'widget_course_time_table_v2') {
        widget.layout_config = {
            margin_top: 10,
            margin_bottom: 0,
            margin_left: 16,
            margin_right: 0,
        };
        widget.divider_config = {
            background_color: '#e4ecf1',
            height: 1,
            margin_top: 10,
            margin_bottom: 10,
            margin_left: 0,
            margin_right: 16,
        };
    }
    return widget;
}

function getPrePurchaseCourseSamplePdf({
    result,
    config,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const obj = {
            id: result[i].id,
            resource_type: 2,
            title: result[i].meta_info,
            text: result[i].topic,
            border_color: '#2376b2',
            link: result[i].resource_reference,
            is_premium: false,
            is_vip: false,
            show_emi_dialog: false,
            subject: result[i].subject,
            master_chapter: '',
            payment_details: '',
            assortment_id: 105615,
            payment_deeplink: '',
            image_url: `${config.cdn_url}engagement_framework/A6CB4B7D-24CF-84DC-9B99-F74FA8A045D9.webp`,
        };
        items.push(obj);
    }
    return {
        type: 'resource_notes_v2',
        data: {
            items,
        },
    };
}

function getContentFiltersWidget({
    result,
    value,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const obj = {
            filter_id: result[i].id,
            text: result[i].text,
            is_selected: result[i].id === value,
        };
        items.push(obj);
    }
    return {
        type: 'widget_content_filter',
        is_sticky: true,
        data: {
            items,
        },
    };
}

function getBuyCompleteWidget({
    result,
    locale,
}) {
    return {
        data: {
            text_one: locale === 'hi' ? 'पूरा कोर्स खरीदें' : 'Buy Complete Course',
            text_one_size: '15',
            text_one_color: '#111111',
            text_two: `₹${CourseHelper.numberWithCommas(result.display_price)}`,
            text_two_size: '20',
            text_two_color: '#000000',
            text_three: `₹${CourseHelper.numberWithCommas(result.base_price)}`,
            text_three_size: '12',
            text_three_color: '#000000',
            text_four: `${result.amount_saving_percentage}%`,
            text_four_size: '13',
            text_four_color: '#504949',
            text_five: 'off',
            text_five_size: '10',
            text_five_color: '#504949',
            bg_stroke_color: '#eb532c',
            bg_end_color: '#ffc700',
            deeplink: result.deeplink,
            text_one_strike_through: false,
            text_two_strike_through: false,
            text_three_strike_through: true,
            text_four_strike_through: false,
            text_five_strike_through: false,
        },
        type: 'widget_buy_complete_course',
    };
}

function getBuyCompleteWidgetV1({
    result,
    text,
    type,
    locale,
}) {
    return {
        data: {
            text_one: text,
            text_one_size: '15',
            text_one_color: type === 'trial' ? '#2c2c2c' : '#ffffff',
            text_two: `₹${CourseHelper.numberWithCommas(result.display_price)}`,
            text_two_size: '20',
            text_two_color: type === 'trial' ? '#2c2c2c' : '#ffffff',
            text_three: `₹${CourseHelper.numberWithCommas(result.base_price)}`,
            text_three_size: '12',
            text_three_color: type === 'trial' ? '#2c2c2c' : '#ffffff',
            text_four: locale === 'hi' ? 'अभी खरीदें >' : 'BUY NOW >', // `${result.amount_saving_percentage}%`,
            text_four_size: '13',
            text_four_color: type === 'trial' ? '#ffffff' : '#000000',
            text_five: '',
            text_five_size: '10',
            text_five_color: '#504949',
            bg_stroke_color: '',
            bg_color: type === 'trial' ? '#ffc700' : '#eb532c',
            bg_end_color: type === 'trial' ? '#eb532c' : '#ffc700',
            deeplink: result.deeplink,
            text_one_strike_through: false,
            text_two_strike_through: false,
            text_three_strike_through: true,
            text_four_strike_through: false,
            text_five_strike_through: false,
            is_drawable: type === 'trial',
        },
        type: 'widget_buy_complete_course',
    };
}

function getTryPaymentWidget({
    result,
    locale,
}) {
    return {
        data: {
            text_one: locale === 'hi' ? `${Math.ceil(result.duration_in_days / 30)} महीने का ट्रायल` : `Try ${Math.ceil(result.duration_in_days / 30)} Month`,
            text_one_size: '16',
            text_one_color: '#ffffff',
            text_two: `₹${CourseHelper.numberWithCommas(result.display_price)}`,
            text_two_size: '20',
            text_two_color: '#fcfcfc',
            text_three: `₹${CourseHelper.numberWithCommas(result.base_price)}`,
            text_three_size: '12',
            text_three_color: '#ffffff',
            text_three_strike_through: true,
            bg_color: '#eb532c',
            deeplink: result.deeplink,
            text_one_strike_through: false,
            text_two_strike_through: false,
        },
        type: 'widget_trial_button',
    };
}

function getPrePurchaseSyllabusWidget({
    result,
    locale,
}) {
    const items = [];
    const subjectTopicsMapping = {};
    for (let i = 0; i < result.length; i++) {
        if (subjectTopicsMapping[result[i].subject]) {
            subjectTopicsMapping[result[i].subject].push(result[i].chapter);
        } else {
            subjectTopicsMapping[result[i].subject] = [result[i].chapter];
        }
    }
    for (const key in subjectTopicsMapping) {
        if (subjectTopicsMapping[key]) {
            items.push({
                subject_title: key,
                title: locale === 'hi' && DataHelper.subjectHindi[key.toUpperCase()] ? DataHelper.subjectHindi[key.toUpperCase()] : key,
                subject_color: liveclassHelper.getBarColorForLiveclassHomepage(key),
                list: subjectTopicsMapping[key],
            });
        }
    }
    if (items.length) {
        return {
            type: 'widget_syllabus',
            data: {
                title: locale === 'hi' ? 'आप यहाँ क्या सीखेंगे?' : 'What Will I Learn?',
                toggle: true,
                items,
            },
        };
    }
}

function getTopperWidget(bannerData) {
    const bannerList = [];
    for (let i = 0; i < bannerData.length; i++) {
        const data = {
            id: bannerData[i].id.toString(),
            image: bannerData[i].img_url,
            deeplink: bannerData[i].cta_link,
            card_width: '1.3',
            card_ratio: '10:3',
        };
        const obj = {
            type: 'auto_scroll_home_banner',
            data,
        };
        bannerList.push(obj);
    }
    return {
        widget_type: 'widget_parent',
        widget_data: {
            autoplay_duration: 3000,
            scroll_direction: 'horizontal',
            items: bannerList,
        },
    };
}

function getTopperTestimonialWidget({
    carouselsData,
    result,
    locale,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            deeplink: result[i].review_qid ? `doubtnutapp://video_dialog?question_id=${result[i].review_qid}&orientation=portrait&page=WHATS_NEW_HOME` : '',
            image_url: result[i].student_image,
        });
    }
    return {
        type: 'testimonial_v2',
        data: {
            title: carouselsData.title,
            course_data: [{
                count_text: '200k+',
                benefit_text: locale === 'hi' ? 'छात्रों को पढ़ाया' : 'Students taught',
            }, {
                count_text: '50k+',
                benefit_text: locale === 'hi' ? 'छात्रों ने 90%+ स्कोर किया' : 'Students scored 90%+',
            }, {
                count_text: '200+',
                benefit_text: locale === 'hi' ? 'हर रोज लाइव क्लास' : 'Live classes everyday',
            }],
            items,
        },
    };
}

async function popularSubjectsWidget({
    carouselsData,
    result,
    locale,
    assortmentPriceMapping,
    buyWithUpiFlag,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        let ctaText = locale === 'hi' ? 'अभी खरीदें' : 'Abhi Khariden';
        let buttonDeeplink = assortmentPriceMapping[result[i].assortment_id] ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://course_details?id=${result[i].assortment_id}`;
        if (assortmentPriceMapping[result[i].assortment_id] || result[i].is_free) {
            if (result[i].is_free) {
                ctaText = locale === 'hi' ? 'अभी देखें' : 'Study Now';
            } else if (assortmentPriceMapping[result[i].assortment_id] && buyWithUpiFlag) {
                ctaText = locale === 'hi' ? 'UPI से खरीदें' : 'Buy with UPI';
                buttonDeeplink = `doubtnutapp://payment_upi_select?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}&upi_package=com`;
            }
            items.push({
                assortment_id: result[i].assortment_id,
                image_url: Data.topSellingSubjectIcons(result[i].display_name.toUpperCase()),
                subject: locale === 'hi' && DataHelper.subjectHindi[result[i].display_name.toUpperCase()] ? DataHelper.subjectHindi[result[i].display_name.toUpperCase()] : result[i].display_name,
                description: locale === 'hi' ? `${DataHelper.popular_subject_widget[result[i].category.toLowerCase()] || result[i].category.toLowerCase()} ${result[i].year_exam}` : `${result[i].category} ${result[i].year_exam}`,
                price: assortmentPriceMapping[result[i].assortment_id] ? `₹${assortmentPriceMapping[result[i].assortment_id].monthly_price}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
                strike_through_text: assortmentPriceMapping[result[i].assortment_id] ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '',
                medium: DataHelper.getCourseMediumByLocale(locale)[result[i].meta_info] || result[i].meta_info,
                cta_text: ctaText,
                deeplink: `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                button_deeplink: buttonDeeplink,
            });
        }
    }
    return {
        type: 'widget_top_selling_subject',
        data: {
            title: carouselsData.title,
            items,
        },
        extra_params: {
            widget_title: carouselsData.type,
        },
    };
}

function getTestSeriesCoursesWidget({
    config,
    carousel,
    result,
    locale,
    courseStudentEnrolledCount,
    assortmentPriceMapping,
    buyWithUpiFlag,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        let btnText = locale === 'hi' ? 'एडमिशन लें' : 'Get Admission';
        if (assortmentPriceMapping[result[i].assortment_id]) {
            let btnDeeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}`;
            if (buyWithUpiFlag) {
                btnText = locale === 'hi' ? 'UPI से खरीदें' : 'Buy with UPI';
                btnDeeplink = `doubtnutapp://payment_upi_select?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}&upi_package=com`;
            }
            items.push({
                type: 'widget_recommended_test',
                data: {
                    title: result[i].display_name,
                    image_url: result[i].demo_video_thumbnail,
                    sub_title: `${_.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]) ? _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]).count : '4K'} ${locale === 'hi' ? 'नामांकित छात्र' : 'Enrolled Students'}`,
                    sub_title_icon: `${config.cdn_url}engagement_framework/04C92295-6324-5BD8-523F-0A205016D81E.webp`,
                    sub_title_two: `${moment(result[i].end_date).diff(moment(result[i].start_date), 'months')} ${locale === 'hi' ? 'महीने' : 'months'}`,
                    sub_title_two_icon: `${config.cdn_url}engagement_framework/7A33E117-7D15-29AA-DA70-AB2EAC151BD2.webp`,
                    price: assortmentPriceMapping[result[i].assortment_id] ? `₹${assortmentPriceMapping[result[i].assortment_id].display_price}` : '',
                    btn_text: btnText,
                    deeplink: `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                    btn_deeplink: btnDeeplink,
                },
                extra_params: {
                    assortment_id: result[i].assortment_id,
                    widget_title: carousel.type,
                },
            });
        }
    }
    return {
        type: 'widget_parent',
        testWidget: true,
        link_text: '',
        deeplink: '',
        data: {
            title: carousel.title,
            title_text_size: '16',
            background_color: '#eaf3f9',
            scroll_direction: 'vertical',
            items,
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    };
}

function callingCardExplorePage({
    config, carousel, locale,
}) {
    return {
        type: 'widget_calling_big_card',
        data: {
            title: carousel.title || 'Janna Chahte hai kon sa Course hai Best aapke liye?',
            image_url: `${config.cdn_url}engagement_framework/CF50BC14-2F55-49C8-2143-950C60D82919.webp`,
            cta_text: locale === 'hi' ? 'कॉल करें' : 'Call Now',
            mobile: '01247158250',
            deeplink: '',
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    };
}

function getPopularCourseWidget({
    carousel,
    result,
    locale,
    courseFeatures,
    assortmentPriceMapping,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const courseIdDetails = [
            {
                title: locale === 'hi' ? 'अपने टारगेट एग्जाम में 9०%+ पाएं!' : 'Score 90%+ in your target exam',
                image_url: '',
            },
            {
                title: result[i].liveclass_course_id ? `${locale === 'hi' ? 'कोर्स' : 'Course'} ID #${result[i].liveclass_course_id}` : '',
                image_url: '',
            },
        ];
        if (assortmentPriceMapping[result[i].assortment_id]) {
            items.push({
                assortment_id: result[i].assortment_id,
                deeplink: result[i].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                title: result[i].display_name,
                course_details: [...courseFeatures[i], ...courseIdDetails],
                price: assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
                strike_through_text: assortmentPriceMapping[result[i].assortment_id] ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '',
                price_text_size: assortmentPriceMapping[result[i].assortment_id].monthly_price / 1000 > 0 ? '13' : '15',
                button_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
                button_one_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
                button_two_text: '',
                button_one_deeplink: assortmentPriceMapping[result[i].assortment_id] && !assortmentPriceMapping[result[i].assortment_id].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`,
                button_two_deeplink: '',
                bg_color: Data.popularCoursesCardColors(i),
                tag_data: [
                    {
                        title: DataHelper.getCourseMediumByLocale(locale)[result[i].meta_info] || result[i].meta_info,
                        bg_color: '#ffffff',
                    },
                    {
                        title: global.t8[locale].t('Seats Filling Fast'),
                        bg_color: '#8064f4',
                    },
                ],
                discount_text: '',
                discount_image: '',
                discount_image_url: '',
            });
        }
    }
    return {
        type: 'widget_course_v3',
        data: {
            title: carousel.title,
            items,
        },
        layout_config: {
            margin_top: 0,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    };
}

function getTrialCourse({
    carousel,
    result,
    locale,
    videoResources,
    assortmentPriceMapping,
    courseStudentEnrolledCount,
    page,
}) {
    const items = [];

    for (let i = 0; i < result.length; i++) {
        const price = assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}` : '';
        items.push({
            id: result[i].demo_video_qid,
            assortment_id: result[i].assortment_id,
            default_mute: true,
            video_resource: videoResources[i].length ? videoResources[i][0] : {},
            card_ratio: '16:9',
            image_url: result[i].demo_video_thumbnail,
            deeplink: result[i].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${result[i].assortment_id}`,
            button_deeplink: page === 'referral_bottom_sheet' ? (assortmentPriceMapping[result[i].assortment_id] && !assortmentPriceMapping[result[i].assortment_id].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`) : `doubtnutapp://olympiad-register?type=claim_trial&id=${result[i].assortment_id}`,
            medium_text: '',
            medium_bg_color: '#c2ffffff',
            title: '',
            course_title: result[i].display_name,
            student_count_text: `${_.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]) ? _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]).count : '4K'} ${locale === 'hi' ? 'नामांकित छात्र' : 'Enrolled Students'}`,
            student_count_image_url: '', // `${config.cdn_url}engagement_framework/04C92295-6324-5BD8-523F-0A205016D81E.webp`,
            starting_date_image_url: '', // `${config.cdn_url}engagement_framework/7A33E117-7D15-29AA-DA70-AB2EAC151BD2.webp`,
            starting_date_text: result[i].liveclass_course_id ? `${locale === 'hi' ? 'कोर्स' : 'Course'} ID #${result[i].liveclass_course_id}` : '',
            price: assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
            strike_through_text: assortmentPriceMapping[result[i].assortment_id] ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '',
            button_text: page === 'referral_bottom_sheet' ? (locale === 'hi' ? `केवल ₹${price} का खरीदें` : `Buy For ₹${price}`) : (locale === 'hi' ? 'ट्रायल चालू करें' : 'Activate Trial'),
            faculty_image: '',
            tag_data: [
                {
                    title: locale === 'hi' ? 'बेस्ट सेल्लेर' : 'Best Seller',
                    bg_color: '#e34c4c',
                },
                {
                    title: result[i].subtitle,
                    bg_color: '#8064f4',
                },
                {
                    title: '',
                    bg_color: '#8064f4',
                },
            ],
        });
    }
    if (!(['bottom_sheet', 'referral_bottom_sheet'].includes(page))) {
        return {
            type: 'widget_course_v4',
            data: {
                title: carousel.title,
                items,
                auto_scroll_time_in_sec: 3,
            },
            divider_config: {
                background_color: '#e4ecf1',
                width: 4,
            },
            extra_params: {
                widget_title: carousel.type,
            },
        };
    }
    const widgets = [];
    items.forEach((x) => widgets.push({
        type: 'widget_course_v4',
        data: {
            title: carousel.title,
            items: [x],
            auto_scroll_time_in_sec: 3,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    }));
    if (widgets.length) {
        widgets[widgets.length - 1].layout_config = {
            margin_bottom: 16,
        };
    }
    return widgets;
}

function getLatestSoldCourseWidget({
    carousel,
    result,
    locale,
    videoResources,
    assortmentPriceMapping,
    courseStudentEnrolledCount,
    page,
    source,
}) {
    const items = [];

    for (let i = 0; i < result.length; i++) {
        items.push({
            id: result[i].demo_video_qid,
            assortment_id: result[i].assortment_id,
            default_mute: true,
            video_resource: videoResources.length && videoResources[i].length ? videoResources[i][0] : {},
            card_ratio: '16:9',
            image_url: result[i].demo_video_thumbnail,
            deeplink: result[i].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${result[i].assortment_id}`,
            button_deeplink: assortmentPriceMapping[result[i].assortment_id] && !assortmentPriceMapping[result[i].assortment_id].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`,
            medium_text: '',
            medium_bg_color: '#c2ffffff',
            title: '',
            course_title: result[i].display_name,
            student_count_text: `${_.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]) ? _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]).count : '4K'} ${locale === 'hi' ? 'नामांकित छात्र' : 'Enrolled Students'}`,
            student_count_image_url: '', // `${config.cdn_url}engagement_framework/04C92295-6324-5BD8-523F-0A205016D81E.webp`,
            starting_date_image_url: '', // `${config.cdn_url}engagement_framework/7A33E117-7D15-29AA-DA70-AB2EAC151BD2.webp`,
            starting_date_text: result[i].liveclass_course_id ? `${locale === 'hi' ? 'कोर्स' : 'Course'} ID #${result[i].liveclass_course_id}` : '',
            price: assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
            strike_through_text: assortmentPriceMapping[result[i].assortment_id] ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '',
            button_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
            faculty_image: '',
            tag_data: [
                {
                    title: locale === 'hi' ? 'बेस्ट सेल्लेर' : 'Best Seller',
                    bg_color: '#e34c4c',
                },
                {
                    title: result[i].subtitle,
                    bg_color: '#8064f4',
                },
                {
                    title: '',
                    bg_color: '#8064f4',
                },
            ],
        });
    }
    if (page !== 'bottom_sheet') {
        const wid = {
            type: 'widget_course_v4',
            data: {
                title: carousel.title,
                items,
                auto_scroll_time_in_sec: 3,
            },
            extra_params: {
                widget_title: carousel.type,
            },
        };
        if (source === 'free_video_page_bottom_sheet' || source === 'free_video_page') {
            wid.extra_params.source = source;
            wid.layout_config = {
                margin_top: 8,
            };
        } else {
            wid.divider_config = {
                background_color: '#e4ecf1',
                width: 4,
            };
        }
        return wid;
    }
    const widgets = [];
    items.forEach((x) => widgets.push({
        type: 'widget_course_v4',
        data: {
            title: carousel.title,
            items: [x],
            auto_scroll_time_in_sec: 3,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    }));
    if (source === 'free_video_page_bottom_sheet' || source === 'free_video_page') {
        widgets.extra_params.source = source;
    }
    return widgets;
}

function getPdfWidgetExplorePage({
    result,
    carousel,
    locale,
    assortmentPriceMapping,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            id: `${result[i].id}`,
            assortment_id: `${result[i].assortment_id}`,
            title: result[i].name,
            title2: `By ${result[i].expert_name}, ${result[i].degree || ''}`,
            resource_text: locale === 'hi' ? 'पीडीएफ' : 'PDF',
            button_state: 'payment',
            amount_to_pay: assortmentPriceMapping[result[i].assortment_id] ? `₹${assortmentPriceMapping[result[i].assortment_id].display_price}` : '',
            amount_strike_through: assortmentPriceMapping[result[i].assortment_id] ? `₹${assortmentPriceMapping[result[i].assortment_id].base_price}` : '',
            discount: '',
            buy_text: locale === 'hi' ? 'अभी खरीदें' : 'Buy Now',
            pdf_url: result[i].resource_reference,
            resource_type: 'pdf',
            test_id: '',
            state: '',
            is_premium: true,
            is_vip: false,
            payment_deeplink: assortmentPriceMapping[result[i].assortment_id] ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://vip?assortment_id=${result[i].assortment_id}`,
            show_emi_dialog: false,
            is_onetap_payment: '',
            variant_id: '',
        });
    }
    return {
        type: 'widget_course_resource_v2',
        data: {
            title: carousel.title,
            deeplink: '',
            items,
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    };
}

function getRecommendedCoursesWidget({
    result,
    carousel,
    locale,
    hideSeeAll,
    scrollDirection,
    assortmentPriceMapping,
    courseStudentEnrolledCount,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const enrolledCount = _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]) ? _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]).count + 4000 : 4000;
        if (assortmentPriceMapping[result[i].assortment_id]) {
            items.push({
                type: 'widget_course_recommendation',
                data: {
                    deeplink: result[i].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                    title: DataHelper.getCourseMediumByLocale(locale)[result[i].meta_info] || result[i].meta_info,
                    tag: result[i].assortment_type,
                    sub_title: locale === 'hi' ? `आपके द्वारा चुनी गई ${result[i].category} परीक्षा` : `You selected ${result[i].category} Exam`,
                    image_url: result[i].demo_video_thumbnail,
                    bottom_text: assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
                    bottom_text_size: assortmentPriceMapping[result[i].assortment_id] && assortmentPriceMapping[result[i].assortment_id].monthly_price / 1000 > 0 ? '13' : '15',
                    bottom_text_one: `${enrolledCount > 4000 ? (enrolledCount / 1000).toFixed(1) : 4}K  ${locale === 'hi' ? 'नामांकित छात्र' : 'Enrolled Students'}`,
                    bottom_text_two: result[i].liveclass_course_id ? `${locale === 'hi' ? 'कोर्स' : 'Course'} ID #${result[i].liveclass_course_id}` : '',
                    bottom_text_one_icon: '', // `${config.cdn_url}engagement_framework/04C92295-6324-5BD8-523F-0A205016D81E.webp`,
                    bottom_text_two_icon: '', // `${config.cdn_url}engagement_framework/7A33E117-7D15-29AA-DA70-AB2EAC151BD2.webp`,
                    btn_text: locale === 'hi' ? 'अभी खरीदें' : 'Buy Now',
                    btn_deeplink: assortmentPriceMapping[result[i].assortment_id] && assortmentPriceMapping[result[i].assortment_id].multiple ? `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}` : `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id] ? assortmentPriceMapping[result[i].assortment_id].package_variant : 0}`,
                    see_all_text: !hideSeeAll && locale === 'hi' ? 'सभी देखें' : `${!hideSeeAll ? 'See All' : ''}`,
                    see_all_deeplink: `doubtnutapp://course_category?category_id=${result[i].category.includes('Board') ? result[i].category : result[i].category_type}`,
                },
                extra_params: {
                    assortment_id: result[i].assortment_id,
                    widget_title: carousel.type,
                },
            });
        }
    }
    return {
        type: 'widget_parent',
        data: {
            is_title_bold: true,
            title: carousel.title,
            scroll_direction: scrollDirection,
            subtitle: carousel.description || '',
            items,
        },
    };
}

function getContinueBuyingCoursesWidget({
    result,
    carousel,
    locale,
    versionCode,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        result[i].subject = '';
        const obj = createVideoDataObject(result[i], { isVip: false }, locale, false, versionCode);
        obj.subject = '';
        obj.payment_deeplink = `doubtnutapp://course_details?id=${result[i].assortment_id}`;
        obj.image_bg_card = result[i].demo_video_thumbnail;
        obj.button = {
            text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
            deeplink: `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`,
        };
        obj.button_text_color = '#ffffff';
        obj.button_bg_color = '#ea532c';
        obj.top_title = '';
        obj.tag_text = '';
        obj.tag_bg_color = '#8064f4';
        obj.tag_two_text = locale === 'hi' ? 'कुछ ही सीट बाकि' : 'Seats Filling Fast';
        obj.tag_two_text_color = '#ffffff';
        obj.tag_two_bg_color = '#8064f4';
        obj.button_state = 'continue_buying';
        obj.title2 = '';
        if (result.length === 1) {
            obj.card_width = '1';
        }
        items.push({
            type: 'live_class_carousel_card_2',
            data: obj,
            extra_params: {
                assortment_id: result[i].assortment_id,
            },
        });
    }
    return {
        type: 'widget_parent',
        data: {
            is_title_bold: true,
            title: carousel.title,
            subtitle: carousel.description || '',
            items,
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    };
}

function bannerVideoPromoList({
    carousel,
    result,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            type: 'widget_explore_promo',
            data: {
                id: `${result[i].id}`,
                deeplink: result[i].deeplink,
                image_url: result[i].image_url,
                video_resource: {},
                default_mute: true,
                promo_type: 'banner',
                promo_count: `${i + 1}/${result.length}`,
            },
        });
    }
    return {
        type: 'widget_autoplay',
        data: {
            title: ' ',
            show_item_count: true,
            auto_scroll_time_in_sec: 3,
            full_width_cards: true,
            default_mute: true,
            auto_play: true,
            id: `${carousel.id}`,
            items,
        },
        layout_config: {
            margin_top: 0,
            margin_bottom: 0,
        },
        extra_params: {
            widget_title: carousel.type,
        },
    };
}

function getWhyDoubtnutWidget({
    carousel,
    config,
}) {
    return {
        type: 'widget_parent',
        data: {
            title: carousel.title,
            is_title_bold: true,
            title_text_size: '16',
            items: [
                {
                    type: 'widget_video',
                    data: {
                        title: '',
                        title_size: '32',
                        title_color: '#9e5512',
                        deeplink: `doubtnutapp://video_dialog?question_id=${parseInt(carousel.assortment_list)}&orientation=portrait&page=WHATS_NEW_HOME`,
                        faculty_image_url: '', // `${config.cdn_url}images/dn_live_faculty_315.webp`,
                        bg_image_url: `${config.cdn_url}engagement_framework/6D044E55-79E5-2DC6-A48B-7FD0A6355974.webp`,
                    },
                },
            ],
        },
        extra_params: {
            widget_title: carousel.type,
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
    };
}

function getCoursesWithWalletWidget({
    result,
    carousel,
    locale,
    config,
    walletData,
    courseStudentEnrolledCount,
}) {
    const items = [];
    let maxAmountPayable = 0;
    for (let i = 0; i < result.length; i++) {
        let usuableRewardAmount = Math.min(DataPayment.wallet_reward_options.max_amount, DataPayment.wallet_reward_options.factor * result[i].display_price, walletData[0].reward_amount);
        if (result[i].display_price - result[i].min_limit < usuableRewardAmount) {
            usuableRewardAmount = result[i].display_price - result[i].min_limit;
        }
        const walletAmount = walletData[0].cash_amount + usuableRewardAmount;
        if (result[i].display_price - walletAmount <= 1500) {
            maxAmountPayable = Math.max(maxAmountPayable, result[i].display_price - walletAmount);
            const enrolledCount = _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]) ? _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]).count + 4000 : 4000;
            items.push({
                type: 'widget_course_wallet',
                data: {
                    deeplink: `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                    title: DataHelper.getCourseMediumByLocale(locale)[result[i].meta_info] || result[i].meta_info,
                    tag: result[i].assortment_type,
                    sub_title: '',
                    image_url: result[i].demo_video_thumbnail,
                    bottom_text: `${locale === 'hi' ? 'आपको देने हैं केवल' : 'Pay only'}\n₹${result[i].display_price > walletAmount ? result[i].display_price - walletAmount : 0}`,
                    bottom_text_one: `${enrolledCount > 4000 ? (enrolledCount / 1000).toFixed(1) : 4}K ${locale === 'hi' ? 'नामांकित छात्र' : 'Enrolled Students'}`,
                    bottom_text_two: result[i].liveclass_course_id ? `Course ID #${result[i].liveclass_course_id}` : '',
                    bottom_text_one_icon: `${config.cdn_url}engagement_framework/04C92295-6324-5BD8-523F-0A205016D81E.webp`,
                    bottom_text_two_icon: `${config.cdn_url}engagement_framework/7A33E117-7D15-29AA-DA70-AB2EAC151BD2.webp`,
                    bottom_text_strike_through: `₹${result[i].display_price}`,
                    btn_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
                    btn_deeplink: `doubtnutapp://vip?variant_id=${result[i].variant_id}`,
                    wallet_text: locale === 'hi' ? `₹${walletAmount > result[i].display_price ? result[i].display_price : walletAmount} आपके वॉलेट से कटेंगे` : `₹${walletAmount > result[i].display_price ? result[i].display_price : walletAmount} will be used from your wallet`,
                    wallet_icon: `${config.cdn_url}engagement_framework/4883EDC5-4F6B-7607-1C33-68A6196C1145.webp`,
                },
                extra_params: {
                    assortment_id: result[i].assortment_id,
                    widget_title: carousel.type,
                },
            });
        }
    }
    if (!items.length) {
        return {};
    }
    return {
        type: 'widget_parent',
        data: {
            is_title_bold: true,
            title: carousel.title.replace('100', maxAmountPayable),
            subtitle: '',
            wallet_data: {
                title: locale === 'hi' ? 'उपलब्ध वॉलेट बैलेंस' : 'Available Wallet Balance',
                bg_color: '#e1eced',
                icon_url: `${config.cdn_url}engagement_framework/4883EDC5-4F6B-7607-1C33-68A6196C1145.webp`,
                price: `₹${walletData[0].cash_amount + walletData[0].reward_amount}`,
            },
            items,
        },
        divider_config: {
            background_color: '#e4ecf1',
            width: 4,
        },
    };
}

// creates the string for time in format 9:20 PM, date in 20 Jul format and number of days passes since start date
function createDateTimeVariables(dateTime) {
    const date = dateTime.toString().split(' ').splice(1, 2);
    const time = dateTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const timePassedInDays = (moment().add(5, 'hours').add(30, 'minutes').toDate() - dateTime) / (1000 * 60 * 60 * 24);
    return { date, time, timePassedInDays };
}

// creates the items for item array in popular widgets
function createExamCornerPopularWidgetItem(data) {
    const { article, studentLocale } = data;
    const { date, time, timePassedInDays } = createDateTimeVariables(article.start_date);
    let tagText;
    let tagColor;
    if (article.is_live) {
        tagText = studentLocale === 'hi' ? 'लाइव' : 'Live';
        tagColor = '#FF4001';
    } else if (timePassedInDays < 3) {
        tagText = studentLocale === 'hi' ? 'नया' : 'New';
        tagColor = '#139C6B';
    } else {
        tagText = '';
        tagColor = '';
    }
    if (article.filter_type === 'careers') {
        tagText = '';
        tagColor = '';
    }
    const course = article.course ? `${article.course}-` : '';

    const item = {
        title: article.title,
        subtitle: article.class !== '14' && article.class !== '13' && article.class !== '0' ? `${course}${article.class}th` : `${course}`,
        image_url: article.image_url,
        exam_corner_id: article.exam_corner_id,
        date: `${date[1]} ${date[0]}`,
        time,
        deeplink: article.deeplink,
        tag_text: tagText,
        tag_color: tagColor,
    };
    return item;
}

// creates exam_corner_popular widgets using createExamCornerPopularWidgetItem
function createExamCornerPopularWidgetResponse(data) {
    const { popularWidgets, locale } = data;
    const items = [];
    popularWidgets.forEach((element) => {
        items.push(createExamCornerPopularWidgetItem({ article: element, studentLocale: locale }));
    });
    return {
        data: {
            items,
            title: locale === 'hi' ? 'लोकप्रिय Doubtnut पर' : 'Popular on Doubtnut',
        },
        type: 'exam_corner_popular',
        layout_config: {
            margin_top: 16,
            margin_left: 0,
            margin_bottom: 0,
            margin_right: 8,
        },
    };
}

// creates exam_corner_autoplay widget
// need to add video resource when this widget is supported on android side
function createExamCornerAutoplayWidget(data) {
    const { widget, isBookmarked, studentLocale } = data;
    const { date, time, timePassedInDays } = createDateTimeVariables(widget.start_date);
    let tagText;
    let tagColor;
    if (widget.is_live) {
        tagText = studentLocale === 'hi' ? 'लाइव' : 'Live';
        tagColor = '#FF4001';
    } else if (timePassedInDays < 3) {
        tagText = studentLocale === 'hi' ? 'नया' : 'New';
        tagColor = '#139C6B';
    } else {
        tagText = '';
        tagColor = '';
    } if (widget.filter_type === 'careers') {
        tagText = '';
        tagColor = '';
    }
    const course = widget.course ? `${widget.course}-` : '';
    const resp = {
        data: {
            title: widget.title,
            subtitle: widget.class !== '14' && widget.class !== '13' && widget.class !== '0' ? `${course}${widget.class}th` : `${course}`,
            image_url: widget.image_url,
            exam_corner_id: widget.exam_corner_id,
            date: `${date[1]} ${date[0]}`,
            time,
            deeplink: widget.deeplink,
            // if question id is null set image_thumbnail_deeplink to the deeplink from db else sets image_thumbnail_deeplink to video_dialog link
            image_thumbnail_deeplink: widget.question_id ? `doubtnutapp://video?qid=${widget.question_id}&page=EXAM_CORNER` : widget.deeplink,
            is_bookmarked: isBookmarked,
        },
        type: 'exam_corner_autoplay',
        layout_config: {
            margin_top: 4,
            margin_left: 0,
            margin_bottom: 0,
            margin_right: 8,
        },
    };
    if (tagText === '') {
        return resp;
    }
    resp.data.tag_text = tagText;
    resp.data.tag_color = tagColor;
    return resp;
}

// creates the exam_corner_default widget
function createExamCornerDefaultWidget(data) {
    const { widget, isBookmarked, studentLocale } = data;
    const { date, time, timePassedInDays } = createDateTimeVariables(widget.start_date);
    let tagText;
    let tagColor;
    if (widget.is_live) {
        tagText = studentLocale === 'hi' ? 'लाइव' : 'Live';
        tagColor = '#FF4001';
    } else if (timePassedInDays < 3) {
        tagText = studentLocale === 'hi' ? 'नया' : 'New';
        tagColor = '#139C6B';
    } else {
        tagText = '';
        tagColor = '';
    }
    if (widget.filter_type === 'careers') {
        tagText = '';
        tagColor = '';
    }
    const course = widget.course ? `${widget.course}-` : '';
    const resp = {
        data: {
            id: widget.id,
            title: widget.title,
            subtitle: widget.class !== '14' && widget.class !== '13' && widget.class !== '0' ? `${course}${widget.class}th` : `${course}`,
            image_url: widget.image_url,
            exam_corner_id: widget.exam_corner_id,
            date: `${date[1]} ${date[0]}`,
            time,
            deeplink: widget.deeplink,
            // if question id is null set image_thumbnail_deeplink to the deeplink from db else sets image_thumbnail_deeplink to video_dialog link
            image_thumbnail_deeplink: widget.question_id ? `doubtnutapp://video?qid=${widget.question_id}&page=EXAM_CORNER` : widget.deeplink,
            is_bookmarked: isBookmarked,
            is_playable: Boolean(widget.question_id),
            button_text: widget.button_text,
            button_deeplink: widget.button_cta_deeplink,
        },
        type: 'exam_corner_default',
        layout_config: {
            margin_top: 4,
            margin_left: 0,
            margin_bottom: 0,
            margin_right: 8,
        },
    };
    if (tagText === '') {
        return resp;
    }

    resp.data.tag_text = tagText;
    resp.data.tag_color = tagColor;
    return resp;
}

function getRecommendationStripWidget({
    carousel,
    locale,
}) {
    return {
        type: 'widget_recommendation',
        data: {
            title: carousel.title,
            title_size: '21',
            title_color: '#9e5512',
            deeplink: '',
            bg_color: '#ffd8b4',
            yes_text: locale === 'hi' ? 'हां' : 'Yes',
            yes_text_color: '#ff4001',
            no_text: locale === 'hi' ? 'नहीं' : 'No',
            no_text_color: '#ff4001',
            yes_deeplink: 'doubtnutapp://course_recommendation',
        },
        layout_config: {
            margin_top: 20,
            margin_bottom: 20,
        },
    };
}

function getVideoAdsWidget({
    result,
    carousel,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const obj = {
            type: 'video_banner_autoplay_child',
            data: {
                id: result[i].id,
                title: '',
                image_url: result[i].thumbnail_img,
                deeplink: result[i].deeplink,
                video_resource: {
                    resource: result[i].link,
                    auto_play_duration: 220000,
                },
                default_mute: false,
            },
            layout_config: {
                margin_left: 10,
                margin_right: 10,
                margin_top: 10,
            },
        };
        const resourceArr = obj.data.video_resource.resource.split('.');
        if (resourceArr[resourceArr.length - 1] === 'mpd') {
            obj.data.video_resource.drm_scheme = 'widevine';
            obj.data.video_resource.drm_license_url = '';
            obj.data.video_resource.media_type = 'DASH';
        }
        items.push(obj);
    }
    return {
        type: 'widget_autoplay',
        data: {
            title: carousel.title,
            full_width_cards: true,
            items,
            default_mute: true,
            auto_play: true,
            id: 'explore',
        },
        layout_config: {
            margin_left: 5,
            margin_right: 5,
            margin_top: 5,
        },
    };
}

function getExplorePageTopIconsWidget({
    carousel,
    data,
    circleWidget,
}) {
    const items = [];
    for (let i = 0; i < data.length; i++) {
        let deeplink = `doubtnutapp://course_category?category_id=${carousel.view_type === 'subjects' ? data[i].category : data[i].id}`;
        if (data[i].position) {
            deeplink = '';
        }
        data[i].title = circleWidget && data[i].title ? data[i].title.toUpperCase() : data[i].title;
        items.push({
            id: carousel.view_type === 'subjects' ? `${data[i].display_name[0]}${data[i].display_name.substring(1).toLowerCase()}` : data[i].id,
            title: carousel.view_type === 'subjects' ? data[i].display_name : data[i].title,
            image_url: carousel.view_type === 'subjects' ? Data.topSellingSubjectIcons(data[i].display_name.toUpperCase()) : data[i].image_url,
            deeplink,
            position: data[i].position || 0,
        });
    }
    return {
        type: carousel.carousel_type,
        data: {
            title: carousel.title,
            items,
        },
    };
}

function getLatestLaunchedCoursesWidget({
    carousel,
    result,
    locale,
    assortmentPriceMapping,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            type: 'widget_latest_launches',
            data: {
                title: result[i].display_name,
                title_two: result[i].display_name,
                deeplink: result[i].assortment_id === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                medium_text: DataHelper.getCourseMediumByLocale(locale)[result[i].meta_info] || result[i].meta_info,
                medium_bg_color: '#c2ffffff',
                faculty_image: '',
                course_title: result[i].display_name,
                card_ratio: '16:9',
                image_url: result[i].demo_video_thumbnail,
                course_id: `${global.t8[locale].t('Course')} ID #${result[i].liveclass_course_id}`,
                discount_text_one: '',
                discount_text_two: '',
                discount_text_one_color: '#2a52d1',
                discount_text_two_color: '#2a52d1',
                discount_text_color: '#2a52d1',
                discount_image_url: '',
                assortment_id: result[i].assortment_id,
                button_deeplink: assortmentPriceMapping[result[i].assortment_id] && !assortmentPriceMapping[result[i].assortment_id].multiple ? `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}` : `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`,
                price: assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '',
                strike_through_text: assortmentPriceMapping[result[i].assortment_id] ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '',
                price_text_size: assortmentPriceMapping[result[i].assortment_id] ? `${assortmentPriceMapping[result[i].assortment_id].monthly_price / 1000 > 0 ? '13' : '15'}` : '',
                button_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
                bg_color: '#FFBE99',
            },
            extra_params: {
                assortment_id: result[i].assortment_id,
                title: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
            },
        });
    }
    return {
        type: 'widget_parent',
        data: {
            title: carousel.title,
            items,
            show_indicator: true,
        },
    };
}

async function getMostViewedClassesWidget({
    db,
    config,
    carousel,
    result,
    locale,
    trialExpired,
    assortmentID,
    versionCode,
    bgColor = '#E3F3FF',
}) {
    const widget = await getPostPuchaseLecturesWidget({
        db, home: true, locale, config, result, carousel, versionCode, source: 'trial_course_page',
    });
    const groupedData = _.uniqBy(result, 'subject');
    const tabs = [];
    for (let i = 0; i < groupedData.length; i++) {
        let teacherInfo = groupedData[i].college || '';
        if (groupedData[i].degree) {
            teacherInfo = `${teacherInfo} | ${groupedData[i].degree}`;
        }
        if (teacherInfo !== '') {
            teacherInfo = `${teacherInfo} | ${groupedData[i].experience_in_hours || 5000} hours Experience in ${groupedData[i].subject}`;
        } else {
            teacherInfo = `${groupedData[i].experience_in_hours || 5000} hours Experience in ${groupedData[i].subject}`;
        }
        const obj = {
            key: groupedData[i].subject.toLowerCase(),
            title: groupedData[i].subject,
            is_selected: i === 0,
            teacher_title: groupedData[i].expert_name,
            teacher_title_size: '16',
            teacher_title_color: '#000000',
            teacher_image_url: groupedData[i].expert_image,
            teacher_title_two: teacherInfo,
            teacher_title_two_size: '12',
            teacher_title_two_color: '#504949',
            items: [
                {
                    title: `${groupedData[i].rating || 4.81} Rating`,
                    title_text_color: '#504949',
                    icon: `${config.cdn_url}images/2022/01/06/12-21-49-987-PM_icon.webp`,
                },
                {
                    title: `${groupedData[i].students_mentored || '1L+'} Students Mentored`,
                    title_text_color: '#504949',
                    icon: `${config.cdn_url}images/2022/01/06/12-21-29-104-PM_people-fill.webp`,
                },
                {
                    title: `${groupedData[i].experience_in_hours || 5000} hour of teaching`,
                    title_text_color: '#504949',
                    icon: `${config.cdn_url}images/2022/01/06/12-22-16-239-PM_hourglass-split.webp`,
                },
            ],
        };
        if (!trialExpired) {
            obj.action = {
                text_one: 'See all Topics ➝',
                text_one_size: '14',
                text_one_color: '#eb532c',
                deeplink: `doubtnutapp://course_detail_info?tab=recent&subject=${groupedData[i].subject}&assortment_id=${assortmentID}`,
            };
        }
        tabs.push(obj);
    }
    widget.data.tabs = tabs;
    widget.data.bg_color2 = bgColor;
    return widget;
}

function getBookmarkDoubtsWidget({
    locale,
    result,
    subject,
    assortmentID,
    chapterName,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            _id: result[i]._id,
            assortment_id: assortmentID,
            student_avatar: result[i].student_avatar,
            student_username: result[i].student_username,
            student_id: result[i].student_id,
            createdAt: result[i].created_at,
            message: result[i].message,
            action_two_text: 'Go to Class',
            action_two_dl: `doubtnutapp://live_class?id=${result[i].entity_id}&page=COURSE_DETAIL`,
            action_two_img: 'https://image.flaticon.com/icons/png/512/149/149125.png',
            replies_count: result[i].replies_count,
            is_bookmarked: !!result[i].is_bookmarked,
        });
    }
    const data = {
        title1: locale === 'hi' && DataHelper.subjectHindi[subject.toUpperCase()] ? DataHelper.subjectHindi[subject.toUpperCase()] : subject,
        subtitle: chapterName,
        label_one: `${result.length} bookmark`,
        color: liveclassHelper.getBarColorForLiveclassHomepage(subject.toUpperCase()),
        items,
    };
    return {
        type: 'bookmark_list',
        data,
    };
}

function getVideoTopicsOffsetWidget({
    result,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            title: result[i].title,
            offset_title: result[i].offset_title,
            offset: result[i].offset,
        });
    }
    return {
        type: 'course_lecture_offsets',
        data: {
            title: '', items, showsearch: false,
        },
    };
}

function getWidgetCourseClasses({
    locale,
    questionID,
    lectureList,
    type,
}) {
    const widgets = [];
    for (let i = 0; i < lectureList.length; i++) {
        const obj = {
            id: lectureList[i].resource_reference,
            page: 'LIVECLASS',
            title2: lectureList[i].display,
            title1: lectureList[i].topic,
            duration: lectureList[i].live_at ? `${moment(lectureList[i].live_at).format('hh:mm A')} - ${moment(lectureList[i].live_at).add(1, 'hour').format('hh:mm A')}` : '',
            is_downloadable: !!(!lectureList[i].is_free && lectureList[i].vdo_cipher_id && lectureList[i].is_vdo_ready === 2 && moment().add(5, 'hours').add(30, 'minutes').isAfter(lectureList[i].live_at)),
            live_at_date: lectureList[i].live_at ? moment(lectureList[i].live_at).format('DD MMM, hh:mm A') : '',
            batch_id: lectureList[i].batch_id,
            color: liveclassHelper.getBarColorForLiveclassHomepage(lectureList[i].subject.toUpperCase()),
            state: moment().add(5, 'hours').add(30, 'minutes').isAfter(lectureList[i].live_at) ? 2 : 0,
            course_assortment_id: lectureList[i].course_assortment_id,
            assortment_id: lectureList[i].course_assortment_id,
            // is_bookmark: !!lectureList[i].is_bookmarked,
        };
        if (type !== 'paid_video_page') {
            obj.is_bookmark = !!lectureList[i].is_bookmarked;
            obj.state = moment().add(5, 'hours').add(30, 'minutes').isAfter(lectureList[i].live_at) ? 2 : 0;
        } else if (type === 'paid_video_page') {
            obj.state = (lectureList[i].live_at === null || moment().add(5, 'hours').add(30, 'minutes').isAfter(lectureList[i].live_at)) ? 2 : 0;
        }
        if (lectureList[i].resource_reference === questionID) {
            obj.title1 = `${obj.title1} ${locale === 'hi' ? '\n(क्लास चल रही है)' : '\n(Playing Now)'}`;
        }
        widgets.push({
            type: 'widget_course_classes',
            data: obj,
            layout_config: {
                margin_right: 10,
                margin_left: 10,
            },
        });
    }
    return widgets;
}

function getWidgetImageText({
    title, image, color, deeplink, image2, subtitle, isBold, textColor, source,
}) {
    const widget = {
        type: 'widget_image_text',
        data: {
            title,
            title_bold: !!isBold,
            subtitle: subtitle || '',
            bg_color: color,
            image_url: image || '',
            image_url2: image2 || '',
            deeplink: deeplink || '',
            is_title_center: true,
        },
    };
    if (source === 'nudge_popup') {
        widget.layout_config = {
            margin_top: 54,
        };
    }
    if (title === 'आपके लिए और अधिक फ्री क्लासेस' || title === 'More FREE classes for you') {
        widget.is_sticky = true;
    }
    if (textColor) {
        widget.data.text_color = textColor;
    }
    return widget;
}

function getSubjectTabsWidget({
    result, locale, subjectList, source, subjectAssortData,
}) {
    if (subjectList !== null && subjectList !== undefined && subjectList.length > 0) {
        subjectList.forEach((item) => {
            if (item !== undefined && item !== null) {
                item = item.trim();
            }
        });
    }
    if (subjectAssortData !== null && subjectAssortData !== undefined && subjectAssortData.length > 0) {
        subjectAssortData.forEach((item) => {
            if (item.display_name !== undefined && item.display_name !== null) {
                item.display_name = item.display_name.trim();
            }
        });
    }
    const groupedData = _.groupBy(result, 'subject');
    let items = [];
    // subject videos
    for (const key in groupedData) {
        if (groupedData[key]) {
            const itemslist = [];
            const freeSubjectAsortments = [];
            for (let i = 0; i < groupedData[key].length; i++) {
                itemslist.push({
                    type: 'resource_v4',
                    data: {
                        subject_title: locale === 'hi' ? DataHelper.subjectHindi[groupedData[key][i].subject] || groupedData[key][i].subject : groupedData[key][i].subject,
                        // subject_color: liveclassHelper.getSubjectColorForSubjectCardTags(groupedData[key][i].subject.toUpperCase()),
                        subject_color: DataHelper.favClassesCardsColourCodes[i + 1].faculty_card,
                        title: groupedData[key][i].display,
                        faculty: `By ${groupedData[key][i].expert_name}`,
                        bottom_title: groupedData[key][i].likes_data || '',
                        bg_color: DataHelper.favClassesCardsColourCodes[i + 1].bg_color,
                        faculty_image: groupedData[key][i].expert_image,
                        faculty_image_bg_color: DataHelper.favClassesCardsColourCodes[i + 1].faculty_card,
                        deeplink: `doubtnutapp://video?qid=${groupedData[key][i].resource_reference}&page=CHAPTER_SERIES_CAROUSAL`,
                    },
                    extra_params: {
                        source,
                    },
                });
                if (groupedData[key][i].is_chapter_free && groupedData[key][i].subject_assortment !== undefined) {
                    freeSubjectAsortments.push(groupedData[key][i].subject_assortment);
                }
            }
            // const button = borderButtonWidget({ text: 'View All', deeplink: `doubtnutapp://course_detail_info?tab=recent&assortment_id=${groupedData[key][0].subject_assortment}`, type: 'course_preview' });
            // button.data.text_one_color = '#ffffff';
            // button.data.bg_stroke_color = '#FF4001';
            // button.data.bg_color = '#FF4001';
            // itemslist.push(button);
            let subjectPriority = -1;
            if (!_.isEmpty(subjectList) && subjectList.length > 0) {
                subjectPriority = subjectList.indexOf(key);
            }
            let deeplink;
            if (!_.isEmpty(freeSubjectAsortments)) {
                deeplink = `doubtnutapp://course_detail_info?tab=recent&assortment_id=${freeSubjectAsortments[0]}`;
            } else {
                const assortmentFiltered = _.find(subjectAssortData, { display_name: key.toUpperCase() });
                if (!_.isEmpty(assortmentFiltered)) {
                    deeplink = `doubtnutapp://course_detail_info?tab=recent&assortment_id=${assortmentFiltered.assortment_id}`;
                } else {
                    deeplink = `doubtnutapp://course_detail_info?tab=recent&assortment_id=${subjectAssortData[0].assortment_id}`;
                }
            }
            items.push({
                id: key,
                priority: subjectPriority >= 0 ? subjectPriority : 100,
                title: locale === 'hi' ? DataHelper.subjectHindi[key] || textModifier(key) : textModifier(key),
                scroll_direction: 'horizontal',
                items: itemslist,
                see_all_text: locale === 'hi' ? 'सभी देखें' : 'View All',
                deeplink,
            });
        }
    }
    items = _.orderBy(items, 'priority');
    return {
        type: 'widget_parent_tab3',
        data: {
            title: locale === 'hi' ? 'आपकी क्लास के बच्चो की पसंदीदा क्लासेस' : 'Aapki class ke bachcho ki favourite classes',
            title_text_size: 16,
            scroll_direction: 'vertical',
            items,
            // button_margin: 8,
            // remove button due to crash
            // button: {
            //     title: locale === 'hi' ? 'सभी देखें' : 'View All',
            //     button_color: '#eb532c',
            // },
        },
        extra_params: {
            source,
        },
    };
}

function getSubjectCourseCardTabsWidget({
    result, subjectPricing, courseTitle, locale, source,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        items.push({
            title: locale === 'hi' ? DataHelper.subjectHindi[result[i].display_name] || result[i].display_name : textModifier(result[i].display_name),
            scroll_direction: 'horizontal',
            items: [
                {
                    type: 'widget_subject_course_card',
                    data: {
                        medium_text: DataHelper.getCourseMediumByLocale(locale)[result[0].meta_info] || result[0].meta_info,
                        medium_text_bg_color: liveclassHelper.getSubjectColorForSubjectCardTags(result[i].display_name.toUpperCase()),
                        card_bg_color: liveclassHelper.getSubjectColorForSubjectCards(result[i].display_name.toUpperCase()),
                        title: courseTitle || '',
                        subject: locale === 'hi' ? DataHelper.subjectHindi[result[i].display_name] || result[i].display_name : result[i].display_name,
                        price: subjectPricing[result[i].assortment_id] ? `₹${subjectPricing[result[i].assortment_id].monthly_price}/Month` : '',
                        button_text: 'Buy Now',
                        button_color: '#ffffff',
                        button_text_color: '#eb532c',
                        faculty_image_url: result[i].faculty_image_url,
                        deeplink: `doubtnutapp://course_details?id=${result[i].assortment_id}`,
                    },
                    extra_params: {
                        source,
                    },
                },
            ],
        });
    }
    return {
        type: 'widget_parent_tab3',
        data: {
            title: locale === 'hi' ? 'विषय के अनुसार ट्यूशन' : 'Subject Tuitions',
            title_text_size: 16,
            scroll_direction: 'vertical',
            items,
        },
        extra_params: {
            source,
        },
    };
}

function getLiveclassCourseCard3Widget({
    result, locale, source,
}) {
    const lectureSeries = [];
    for (let i = 0; i < result.length; i++) {
        let state = moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at) || result[i].live_at === null ? 2 : 0;
        if (moment().add(5, 'hours').add(30, 'minutes').isAfter(result[i].live_at) && result[i].stream_status === 'ACTIVE') {
            state = 1;
        }
        lectureSeries.push({
            title: result[i].display,
            subject: locale === 'hi' ? DataHelper.subjectHindi[result[i].subject] || result[i].subject : result[i].subject,
            faculty: `By ${result[i].expert_name || ''}`,
            faculty_image: result[i].faculty_image || '',
            color: liveclassHelper.getColorForFreeClassVideoPage(result[i].subject.toUpperCase()),
            lecture_number: `Lecture #${i + 1}`,
            video_id: result[i].resource_reference,
            bottom_text: result[i].likes_data || '',
            text_color: '#ffffff',
            deeplink: '',
            question_id: result[i].resource_reference,
            page: 'CHAPTER_SERIES_CAROUSAL',
            live_at: result[i].live_at,
            state,
        });
    }
    return {
        type: 'live_class_carousel_card_3',
        data: {
            title: locale === 'hi' ? 'आपके लिए और अधिक फ्री क्लासेस' : 'More FREE classes for you',
            items: lectureSeries,
            view_all_text: locale === 'hi' ? 'सभी देखें >' : 'View all >',
            view_all_deeplink: 'doubtnutapp://library_tab?tag=free_classes&recreate=true',
        },
        extra_params: {
            source,
        },
    };
}

function getNotesV3Widget({
    result, lock, courseAssortment, title2, config, locale, source,
}) {
    const items = [];
    for (let i = 0; i < result.length; i++) {
        const obj = {
            resource_id: result[i].id,
            id: result[i].id,
            title: `PDF|${result[i].subject}|${result[i].topic}`,
            color: liveclassHelper.getBarColorForLiveclassHomepage(result[i].subject.toUpperCase()),
            text1: result[i].meta_info || '',
            text2: result[i].display || '',
            link: result[i].resource_reference,
            pdf_url: result[i].resource_reference,
        };
        if (lock) {
            obj.deeplink = `doubtnutapp://nudge_popup?nudge_id=${courseAssortment}||course&is_transparent=false`;
        }
        items.push(obj);
    }
    return {
        type: 'resource_notes_v3',
        data: {
            title: locale === 'hi' ? 'इस क्लास से जुडी PDFs' : 'Is class se jude PDFs',
            title2: title2 || '',
            image_url: `${config.cdn_url}engagement_framework/A716DD0C-9E16-DB59-A361-BDE3BD083B9A.webp`,
            items,
        },
        layout_config: {
            margin_top: 12,
        },
        extra_params: {
            source,
        },
    };
}

function createVideoDataObjectVideoPage(data, paymentCardState, studentLocale, live, versionCode, pageValue = null) {
    const obj = {};
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const hours = Math.round(data.duration / 3600);
    const minutes = Math.round((data.duration % 3600) / 60);
    obj.id = data.resource_reference;
    obj.assortment_id = data.assortment_id;
    if (pageValue === 'explore') {
        obj.page = 'COURSE_LANDING';
    } else if (pageValue === 'revision_class') {
        obj.page = 'HOME_PAGE_REVISION_CLASSES';
    } else {
        obj.page = 'HOME_FEED_LIVE';
    }
    obj.top_title = data.live_at ? liveclassHelper.getLiveclassStatusRecorded(data.live_at) : `${hours > 0 ? `${hours} hr ` : ''}${minutes > 0 ? `${minutes} mins ` : ''}`;
    obj.title1 = data.chapter_meta ? `${data.subject} | ${data.chapter_meta} | ${data.display}` : `${data.subject} | ${data.display}`;
    obj.title2 = `By ${data.expert_name ? data.expert_name.toUpperCase() : Data.liveclassDefaultFaculty}`;
    obj.image_url = buildStaticCdnUrl(data.expert_image) || buildStaticCdnUrl(data.image_bg_liveclass) || '';
    obj.is_live = true;
    obj.subject = data.subject;
    obj.color = live ? liveclassHelper.getBarColorForLiveclassHomepage(data.subject) : liveclassHelper.getBarColorForRecentclassHomepage(data.subject);
    obj.player_type = 'liveclass';
    obj.live_at = data.live_at ? moment(data.live_at).unix() * 1000 : moment(now).unix() * 1000;
    obj.image_bg_card = live ? buildStaticCdnUrl(Data.getBgImageForLiveCarousel(data.subject.toLowerCase())) : buildStaticCdnUrl(Data.getBgImage(data.subject.toLowerCase()));
    obj.lock_state = 0;
    obj.bottom_title = data.day_text ? `Classes on ${data.day_text}` : '';
    obj.topic = '';
    obj.students = 13822;
    obj.interested = 13822;
    obj.is_premium = !(data.is_free == 1);
    obj.is_vip = paymentCardState.isVip;
    obj.state = data.live_at > now ? 0 : 2;
    if (data.stream_status === 'ACTIVE') {
        obj.state = 1;
    }
    obj.show_reminder = liveclassHelper.showReminder(data.live_at);
    obj.reminder_message = 'Reminder has been set';
    obj.payment_deeplink = `doubtnutapp://vip?assortment_id=${data.assortment_id}`;
    obj.card_width = '1.1';
    obj.card_ratio = '16:8';
    const textColors = getTextColor(data.subject.toLowerCase());
    obj.text_color_primary = live ? '#ffffff' : textColors.text_color_primary;
    obj.text_color_secondary = live ? '#ffffff' : textColors.text_color_secondary;
    obj.text_color_title = live ? '#ffffff' : textColors.text_color_title;
    obj.set_width = true;
    obj.button_state = 'multiple';
    obj.image_vertical_bias = 1;
    obj.bg_exam_tag = obj.color;
    obj.text_color_exam_tag = '#ffffff';
    if (data.player_type === 'youtube' && !_.isNull(data.meta_info)) {
        obj.id = data.meta_info;
    }
    obj.target_exam = data.category || '';
    if (versionCode > 866) {
        obj.button = {
            text: studentLocale === 'hi' ? 'अध्याय पर जाएं' : 'Go to Chapter',
            deeplink: `doubtnutapp://course_details?id=${data.chapter_assortment || data.assortment_id}`,
        };
    } else {
        obj.button = {
            text: studentLocale === 'hi' ? 'अध्याय पर जाएं' : 'Go to Chapter',
            action: {
                action_data: {
                    id: data.chapter_assortment || data.assortment_id,
                },
            },
        };
    }
    obj.deeplink = `doubtnutapp://course_details?id=${data.chapter_assortment || data.assortment_id}`;
    if (data.live_at > now) {
        obj.reminder_link = `https://www.google.com/calendar/render?action=TEMPLATE&text=${data.topic}&dates=${moment(data.live_at).subtract(5, 'hours').subtract(30, 'minutes').format('YYYYMMDDTHHmmSS')}Z/${moment(data.live_at).subtract(5, 'hours').subtract(30, 'minutes').add(1, 'hours')
            .format('YYYYMMDDTHHmmSS')}Z&sf=true&output=xml`;
    }
    return obj;
}

async function homepageVideoWidgetWithoutTabsVideoPageOverwrite({
    data,
    title,
    studentLocale,
    paymentCardState,
    userMarkedInsterestedData = [],
    versionCode,
    type,
}) {
    const items = [];
    for (let i = 0; i < data.length; i++) {
        const obj = createVideoDataObjectVideoPage(data[i], paymentCardState, studentLocale, false, versionCode);
        const userData = _.find(userMarkedInsterestedData, ['resource_reference', parseInt(data[i].resource_reference)]);
        obj.is_reminder_set = userData && userData.is_interested ? 1 : 0;
        if (type && type === 'match_mpvp') {
            obj.duration = data[i].duration;
            obj.class = data[i].class;
        }
        items.push({ type: 'live_class_carousel_card_2', data: obj });
    }
    const widget = {
        title,
        is_title_bold: true,
        items,
    };
    return widget;
}

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
                useAlternateEsCluster: true,
            },
            timeout: 1000,
        };
        let dataFromInApp = await axioInst.iasInstEsV7(options);
        dataFromInApp = dataFromInApp.data.liveClass;
        return dataFromInApp;
    } catch (e) {
        return {};
    }
}

async function getMostWatchedLFVideoPage(obj) {
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
    if (overWriteQids.length < 10) {
        let { chapter } = obj;
        const chapterAliasResponse = await QuestionContainer.getChapterAliasData(obj.db, obj.chapter);
        if (chapterAliasResponse.length > 0 && chapterAliasResponse[0] != undefined && chapterAliasResponse[0].chapter_alias !== '' && chapterAliasResponse[0].chapter_alias != null) {
            chapter = chapterAliasResponse[0].chapter_alias.trim();
        }
        const elascticCallObj = {
            type: 'live',
            askScreen: true,
            subject: obj.subject,
            chapter,
            class: obj.classVal,
            locale: obj.locale,
            student_id: obj.student_id,
        };
        let elasticLiveData = await getLiveClass(elascticCallObj);
        if (elasticLiveData && Object.keys(elasticLiveData).length === 0) {
            elascticCallObj.chapter = obj.chapter;
            elasticLiveData = await getLiveClass(elascticCallObj);
        }
        elasticLiveData = elasticLiveData.sugg;
        if (elasticLiveData.length === 0) {
            elascticCallObj.chapter = obj.chapter;
            elasticLiveData = await getLiveClass(elascticCallObj);
            elasticLiveData = elasticLiveData.sugg;
        }
        elasticLiveData = _.orderBy(elasticLiveData, ['_extras.live_at'], ['desc']);
        for (let i = 0; i < elasticLiveData.length; i++) {
            overWriteQids.push(elasticLiveData[i].srcId);
        }
    }
    let liveQids = [];
    // live and simulated live logic
    if (overWriteQids.length < 10) {
        const ccmCourses = await CourseHelper.getCoursesFromCcmArray(obj.db, obj.ccmIdList, obj.classVal, obj.locale);
        const courses = ccmCourses;
        const liveData = await CourseHelper.getVideosDataByScheduleType(obj.db, courses, obj.classVal, obj.locale, 'live', null);
        if (liveData.length) {
            liveQids = liveData.map((item) => item.resource_reference);
        }
        if (!(overWriteQids.length + liveQids.length > 10)) {
            const playlistIdList = await SchedulerHelper.getPlaylists(obj.db, obj.ccmIdList, obj.classVal, obj.locale);
            if (playlistIdList.length > 0) {
                const qidListScheduledLive = [];
                // get qid list from redis
                for (let i = 0; i < playlistIdList.length; i++) {
                    const slotKey = SchedulerHelper.getSlotkey(playlistIdList[i]);
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
    overWriteQids = overWriteQids.splice(0, 10);
    if (obj.vertical) {
        overWriteQids = overWriteQids.splice(0, 5);
    }
    const promise = [];
    for (let i = 0; i < overWriteQids.length; i++) {
        promise.push(CourseV2Container.getAssortmentsByResourceReferenceV1(obj.db, overWriteQids[i]));
    }
    const liveClassData = await Promise.all(promise);
    for (let i = 0; i < overWriteQids.length; i++) {
        if (liveQids.includes(overWriteQids[i]) && liveClassData[i].length > 0) {
            liveClassData[i][0].replace_live_bg = true;
        }
    }
    for (let i = 0; i < liveClassData.length; i++) {
        for (let j = 0; j < liveClassData[i].length; j++) {
            if (liveClassData[i][j].stream_status === 'ACTIVE') {
                liveClassData[i][0].replace_live_bg = true;
                break;
            }
        }
    }
    const data = CourseHelper.bottomSheetDataFormatVideoPage(overWriteQids, liveClassData, 0, obj.vertical, obj.locale);
    if (data.widget_data.items.length) {
        data.widget_data.title = obj.locale === 'hi' ? obj.carousel.title_hindi : obj.carousel.title;
        data.extra_params = { source: 'mpvp_trending' };
        data.widget_data.tab_gravity_full = true;
        return [data];
    }
    return [];
}

function createSimilarWidget(similarResources, locale) {
    const widgetParent = {
        widget_type: 'widget_parent',
        widget_data: {
            title: locale === 'hi' ? 'आपके प्रश्न से संबंधित और समाधान' : 'More solutions related to your question',
            title_text_size: 16,
            is_title_bold: true,
            top_icon: `${config.staticCDN}/engagement_framework/5C6E9F95-5FA5-69CF-03F0-ACCA66B3CFD6.webp`,
            top_icon_width: 20,
            top_icon_height: 20,
            title_text_max_line: 2,
            items: [],
        },
        layout_config: {
            margin_top: 16,
            margin_right: 0,
            bg_color: '#ffffff',
        },
    };
    const itemList = [];
    for (let i = 0; i < similarResources.length; i++) {
        const widgetTemp = {
            type: 'widget_ncert_similar',
            data: {
                id: parseInt(similarResources[i].question_id),
                is_playing: true,
                type: similarResources[i].resource_type,
                title: '',
                ocr_text: similarResources[i].ocr_text === null || similarResources[i].ocr_text === undefined ? '' : similarResources[i].ocr_text,
                question: similarResources[i].ocr_text === null || similarResources[i].ocr_text === undefined ? '' : similarResources[i].ocr_text,
                question_thumbnail: (similarResources[i].ocr_text === null || similarResources[i].ocr_text === undefined) && (similarResources[i].thumbnail_image !== null && similarResources[i].thumbnail_image !== undefined) ? similarResources[i].thumbnail_image : '',
                asked_count: similarResources[i].views,
                question_id: parseInt(similarResources[i].question_id),
                deeplink: `doubtnutapp://video?qid=${similarResources[i].question_id}&page=MPVP`,
                card_width: '1.1',
                card_ratio: '16:6',
            },
            layout_config: {
                margin_top: 0,
                margin_left: 0,
                margin_right: 0,
                margin_bottom: 0,
                bg_color: '#ffffff',
            },
        };
        itemList.push(widgetTemp);
    }
    widgetParent.widget_data.items.push(...itemList);
    return widgetParent;
}

function getCampaignUserWidgetsExplore({
    carousel,
    result,
    locale,
    videoResources,
    assortmentPriceMapping,
    courseStudentEnrolledCount,
    priceFlow = false,
}) {
    const items = [];
    const filters = carousel.description !== null ? JSON.parse(carousel.description) : {};
    const { coupon } = filters;
    const timerTitle = filters.timer_title;
    const timerValue = filters.timer_end;
    const timerStart = filters.timer_start;
    const now = moment().add(5, 'hours').add(30, 'minutes').format();
    let showTimer = false;
    if (moment(timerStart).isBefore(now)) {
        showTimer = true;
    }
    for (let i = 0; i < result.length; i++) {
        let buttonDeeplink = `doubtnutapp://bundle_dialog?id=${result[i].assortment_id}`;
        if (assortmentPriceMapping[result[i].assortment_id] && !assortmentPriceMapping[result[i].assortment_id].multiple) {
            buttonDeeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[result[i].assortment_id].package_variant}`;
        }
        let deeplink = `doubtnutapp://course_details?id=${result[i].assortment_id}`;
        if (result[i].assortment_id === 138829) {
            deeplink = 'doubtnutapp://course_category?category_id=Kota%20Classes';
        }
        if (coupon) {
            buttonDeeplink = `${buttonDeeplink}&coupon_code=${coupon}`;
            deeplink = `${deeplink}||||${coupon}`;
        }
        const item = {
            id: '',
            assortment_id: result[i].assortment_id,
            default_mute: true,
            video_resource: videoResources.length && videoResources[i].length ? videoResources[i][0] : {},
            card_ratio: '16:9',
            image_url: result[i].demo_video_thumbnail,
            deeplink,
            button_deeplink: buttonDeeplink,
            medium_text: '',
            medium_bg_color: '#c2ffffff',
            title: '',
            course_title: result[i].display_name,
            student_count_text: `${_.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]) ? _.find(courseStudentEnrolledCount, ['assortment_id', result[i].assortment_id]).count : '4K'} ${locale === 'hi' ? 'नामांकित छात्र' : 'Enrolled Students'}`,
            student_count_image_url: '', // `${config.cdn_url}engagement_framework/04C92295-6324-5BD8-523F-0A205016D81E.webp`,
            starting_date_image_url: '', // `${config.cdn_url}engagement_framework/7A33E117-7D15-29AA-DA70-AB2EAC151BD2.webp`,
            starting_date_text: result[i].liveclass_course_id ? `${locale === 'hi' ? 'कोर्स' : 'Course'} ID #${result[i].liveclass_course_id}` : '',
            button_text: locale === 'hi' ? 'एडमिशन लें' : 'Get Admission',
            faculty_image: '',
            tag_data: [
                {
                    title: locale === 'hi' ? 'बेस्ट सेल्लेर' : 'Best Seller',
                    bg_color: '#e34c4c',
                },
                {
                    title: result[i].subtitle,
                    bg_color: '#8064f4',
                },
                {
                    title: '',
                    bg_color: '#8064f4',
                },
            ],
            ...(timerValue && timerTitle && showTimer
                ? {
                    widget_timer: {
                        trial_title: timerTitle,
                        trial_title_size: '12',
                        trial_title_color: '#000000',
                        time: moment(timerValue).subtract(5, 'hours').subtract(30, 'minutes').valueOf(),
                        time_text_color: '#ff0000',
                        time_text_size: '13',
                        image_url: `${config.cdn_url}engagement_framework/trial_timer_new.gif`,
                        bg_color_one: '#daf8db',
                        bg_color_two: '#daf8db',
                        remove_on_completion: true,
                        rounded_top_corners: true,
                        invisible_on_completion: true,
                    },
                } : {}),
        };
        if (!priceFlow) {
            item.price = assortmentPriceMapping[result[i].assortment_id] ? `₹${CourseHelper.numberWithCommas(assortmentPriceMapping[result[i].assortment_id].monthly_price)}/${locale === 'hi' ? 'महीना' : 'Month'}` : '';
            item.strike_through_text = assortmentPriceMapping[result[i].assortment_id] ? `<s>₹${Math.floor(assortmentPriceMapping[result[i].assortment_id].base_price / Math.floor(assortmentPriceMapping[result[i].assortment_id].duration / 30))}</s>` : '';
        }
        items.push(item);
    }
    if (result.length) {
        const wid = {
            type: 'widget_course_v4',
            data: {
                title: carousel.title.replace('*', result[0].category),
                items,
            },
            extra_params: {
                widget_title: carousel.type,
            },
        };
        return wid;
    }
    return [];
}

// eslint-disable-next-line object-curly-newline
async function generateNextChapterVideos({ db, locale, result, carousel, questionID, source }) {
    const items = []; const promise = [];
    for (let i = 0; i < result.length; i++) {
        if (result[i].resource_reference) {
            promise.push(QuestionContainer.getQidThumbnailExpData(db, result[i].resource_reference));
            const obj = {
                type: 'live_class_carousel_card_2',
                data: {
                    id: result[i].resource_reference,
                    assortment_id: result[i].assortment_id || result[i].course_assortment_id,
                    page: 'CHAPTER_SERIES_CAROUSAL',
                    title1: '',
                    title2: '',
                    image_url: '',
                    is_live: true,
                    subject: '',
                    player_type: 'livevideo',
                    live_at: 1656756000000,
                    is_vip: false,
                    is_premium: false,
                    state: 2,
                    show_reminder: false,
                    reminder_message: '',
                    payment_deeplink: `doubtnutapp://vip?assortment_id=${result[i].assortment_id || result[i].course_assortment_id}`,
                    card_width: '1.02',
                    thumbnail: `${config.staticCDN}q-thumbnail/${result[i].resource_reference}.webp`,
                    button: {
                        text: null,
                        deeplink: null,
                    },
                    set_width: true,
                    image_bg_card: `${config.staticCDN}q-thumbnail/${result[i].resource_reference}.webp`,
                    title: '',
                    color: '#750406',
                    lock_state: 0,
                    topic: '',
                    students: 13822,
                    interested: 13822,
                    card_ratio: '16:9',
                    text_color_primary: '#460600',
                    text_color_secondary: '#ffffff',
                    text_color_title: '#750406',
                },
            };
            items.push(obj);
        }
    }

    const thumbnailExpData = await Promise.all(promise);
    for (let i = 0; i < items.length; i++) {
        if (items[i].data && thumbnailExpData[i].length && thumbnailExpData[i][0].question_id && items[i].data.id === thumbnailExpData[i][0].question_id) {
            items[i].data.thumbnail = `${config.staticCDN}q-thumbnail/notif-thumb-custom-${thumbnailExpData[i][0].old_detail_id}-${thumbnailExpData[i][0].class}-${thumbnailExpData[i][0].question_id}.webp`;
            items[i].data.image_bg_card = `${config.staticCDN}q-thumbnail/notif-thumb-custom-${thumbnailExpData[i][0].old_detail_id}-${thumbnailExpData[i][0].class}-${thumbnailExpData[i][0].question_id}.webp`;
        }
    }

    const widgetData = {
        widget_type: 'widget_parent',
        data: {
            link_text: locale === 'hi' ? 'सभी देखें' : 'View all',
            deeplink: 'doubtnutapp://library_tab?tag=free_classes&recreate=true',
            title: locale === 'hi' ? 'आपके लिए और अधिक फ्री क्लासेस' : 'More FREE classes for you',
            is_title_bold: true,
            scroll_direction: 'horizontal',
            items,
        },
    };
    widgetData.data.title = carousel && carousel.title ? carousel.title : widgetData.data.title;
    if (questionID) {
        widgetData.data.link_text = locale === 'hi' ? 'अगला अध्याय' : 'Next Chapter';
        widgetData.data.deeplink = `doubtnutapp://video?qid=${questionID}&page=CHAPTER_SERIES_CAROUSAL`;
    }
    if (source) {
        widgetData.extra_params = { source };
    }
    return widgetData;
}

module.exports = {
    getNotesV3Widget,
    getLiveclassCourseCard3Widget,
    getSubjectCourseCardTabsWidget,
    getSubjectTabsWidget,
    getWidgetImageText,
    getMostViewedClassesWidget,
    getWidgetCourseClasses,
    getVideoTopicsOffsetWidget,
    getLatestLaunchedCoursesWidget,
    getBuyCompleteWidgetV1,
    getVideoAdsWidget,
    getRecommendationStripWidget,
    getCoursesWithWalletWidget,
    getWhyDoubtnutWidget,
    getContinueBuyingCoursesWidget,
    getPdfWidgetExplorePage,
    getLatestSoldCourseWidget,
    getPopularCourseWidget,
    callingCardExplorePage,
    getTestSeriesCoursesWidget,
    popularSubjectsWidget,
    getTopperTestimonialWidget,
    getTopperWidget,
    getTryPaymentWidget,
    getBuyCompleteWidget,
    borderButtonWidget,
    getTimerBannerWidget,
    getRenewalNudgesWidget,
    getAllClassesWidget,
    getCourseTestsWidget,
    getCourseBooksWidget,
    getCourseReviewWidget,
    getCourseHomeworkWidget,
    homepageVideoWidgetWithTabs,
    getPostPuchasePaymentWidget,
    homepagePaidCoursesCarousel,
    getPostPuchaseLecturesWidget,
    homepageVideoWidgetWithoutTabs,
    homepageVideoWidgetWithAutoplay,
    getPostPuchaseCourseCardsWidget,
    getPostPuchaseCourseSubjectsWidget,
    generateTopFreeClasses,
    createTopFreeClassesObject,
    generateFacultyGridData,
    generateRelatedClassesCarousel,
    getSubscriptionValidityWidget,
    createVideoDataObject,
    prePurchaseCourseOptions,
    prePurchaseCourseInfo,
    getPrePurchaseCallWidget,
    getCourseBuyPlansWidget,
    getPrePurchaseCourseSchedule,
    getPrePurchaseCourseSamplePdf,
    getContentFiltersWidget,
    getPrePurchaseSyllabusWidget,
    getRecommendedCoursesWidget,
    bannerVideoPromoList,
    createExamCornerDefaultWidget,
    createExamCornerAutoplayWidget,
    createExamCornerPopularWidgetResponse,
    booksForHomepage,
    getExplorePageTopIconsWidget,
    onlineClassesBottomsheet,
    createTitleWithtimestamps,
    getBookmarkDoubtsWidget,
    createTopTeachersClassesObject,
    getTrialCourse,
    homepageVideoWidgetWithoutTabsVideoPageOverwrite,
    getMostWatchedLFVideoPage,
    createSimilarWidget,
    getCampaignUserWidgetsExplore,
    generateNextChapterVideos,
    getTextColor,
};
