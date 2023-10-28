/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
const rp = require('request-promise');
const Liveclass = require('../../modules/mysql/liveclass');
const AnswerMysql = require('../../modules/mysql/answer');
const AnswerRedis = require('../../modules/redis/answer');
const CourseContainer = require('../../modules/containers/course');
const CourseContainerV2 = require('../../modules/containers/coursev2');
const StudentContainer = require('../../modules/containers/student');
const PackageContainer = require('../../modules/containers/package');
const Package = require('../../modules/mysql/package');
const Data = require('../../data/liveclass.data');
const CourseMysql = require('../../modules/mysql/course');
const SchedulerContainer = require('../../modules/containers/scheduler');
const CourseMysqlV2 = require('../../modules/mysql/coursev2');
const tencentcloud = require('../../node_modules/tencentcloud-sdk-nodejs-intl-en');
const Tencent = require('../../modules/tencent/tencent');
const Utility = require('../../modules/utility');
const StudentRedis = require('../../modules/redis/student');
const { autoScrollTime } = require('../../data/data');
const { buildStaticCdnUrl } = require('./buildStaticCdnUrl');
const LiveclassContainer = require('../../modules/containers/liveclass');

async function checkEmiCounter(db, studentID) {
    const emiData = await StudentRedis.getEMiReminderCounter(db.redis.read, studentID);
    if (emiData) {
        return false;
    }
    return true;
}

// static data ; temperory requirement
function generateBannerData(config, studentID, studentClass) {
    const base64StudentId = Buffer.from(studentID.toString()).toString('base64');
    const obj = {
        type: 'promo_list',
        data: {
            auto_scroll_time_in_sec: autoScrollTime,
            items: [
                {
                    image_url: `${config.staticCDN}liveclass/Contest_Banner_2.png`,
                    deeplink: 'doubtnutapp://video?qid=386637762&page=LIVECLASS_HOME',
                },
                {
                    image_url: `${config.staticCDN}liveclass/Contest_Banner_1.png`,
                    deeplink: `doubtnutapp://external_url?url=https://doubtnut.com/contest-result?student_id=${base64StudentId}`,
                },
                // {
                //     image_url: `${config.staticCDN}engagement_framework/6A732E9A-9475-D607-7297-5F0BEDDDFAF8.webp`,
                //     deeplink: '',
                // },
                // {
                //     image_url: `${config.staticCDN}engagement_framework/32C48F75-D234-A8C6-3F69-AFAEA4709CA5.webp`,
                //     deeplink: 'doubtnutapp://external_url?url=https://doubtnut.com/contest-result',
                // },
            ],
            ratio: '16:9',
        },
    };
    if (studentClass == 10) {
        obj.data.items.unshift({
            image_url: `${config.staticCDN}images/22_20200914_live_class_launch_timetable.webp`,
            deeplink: '',
        });
        obj.data.items.unshift({
            image_url: `${config.staticCDN}images/22_20200914_live_class_launch_banner.webp`,
            deeplink: '',
        });
    }
    return obj;
}

function getVideoCaraousel(config, results) {
    const items = [];
    for (let i = 0; i < results.length; i++) {
        items.push({
            title: results[i].ocr_text,
            subtitle: null,
            show_whatsapp: true,
            show_video: true,
            image_url: buildStaticCdnUrl(`${config.staticCDN}q-thumbnail/${results[i].question_id}.png`),
            card_width: '1.5x',
            aspect_ratio: '',
            deeplink: `doubtnutapp://video?qid=${results[i].question_id}&page=LIVECLASS_HOME`,
            id: results[i].question_id,
        });
    }
    return {
        widget_data: {
            title: 'Latest from Doubtnut',
            _id: '5ede6c2105e5eac68fda3724',
            show_view_all: 0,
            caraousel_id: 645,
            items,
            deeplink: 'doubtnutapp://?live_class_home=?',
            sharing_message: 'Dekho ye video Doubtnut app pe -',
        },
        widget_type: 'horizontal_list',
        layout_config: {
            margin_top: 16,
            bg_color: '#FFFFFF',
        },
        order: -400,
    };
}

function generateCourseListFilter({ data, caraousel }) {
    const obj = {};
    obj.type = caraousel;
    obj.data = {};
    obj.data.title = 'Choose your board';
    obj.data.items = data;
    return obj;
}
function getBarColor(subject) {
    const colorMap = {
        PHYSICS: '#21ca87',
        BIOLOGY: '#6236ff',
        CHEMISTRY: '#f4ac3e',
        MATHS: '#ea532e',
        ENGLISH: '#1da0f4',
        SCIENCE: '#ff6e00',
    };
    // console.log(colorMap[subject]);
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return Data.subjectColor;
}

function getBarColorHomepage(subject) {
    const colorMap = {
        PHYSICS: '#508f17',
        BIOLOGY: '#8064f4',
        CHEMISTRY: '#b62da8',
        MATHS: '#1f3157',
        ENGLISH: '#1a99e9',
        SCIENCE: '#0E2B6D',
        GUIDANCE: '#0E2B6D',
        ALL: '#0E2B6D',
        TEST: '#54138a',
        'रसायन विज्ञान': '#b62da8',
        गणित: '#1f3157',
        'भौतिक विज्ञान': '#508f17',
        अंग्रेज़ी: '#1a99e9',
        विज्ञान: '#0E2B6D',
        'दिशा निर्देश': '#0E2B6D',
        जीवविज्ञान: '#8064f4',
        'जीव विज्ञान': '#8064f4',
        'सामाजिक विज्ञान': '#0E2B6D',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }
    if (subject.includes('अंग्रेज़ी')) {
        return colorMap['अंग्रेज़ी'];
    }

    return Data.subjectColor;
}

function getBarColorForLiveclassHomepage(subject) {
    const colorMap = {
        PHYSICS: '#622abd',
        BIOLOGY: '#139c6b',
        HINDI: '#139c6b',
        CHEMISTRY: '#c07a27',
        MATHS: '#2376b2',
        MATHEMATICS: '#2376b2',
        ENGLISH: '#b02727',
        'ENVIRONMENTAL STUDIES': '#cea644',
        'ENVIRONMENT STUDIES': '#cea644',
        'GENERAL KNOWLEDGE': '#8235d6',
        'STATIC GK': '#8235d6',
        SCIENCE: '#00a167',
        GUIDANCE: '#3f8aaa',
        'WEEKLY TEST': '#3f8aaa',
        'SOCIAL SCIENCE': '#4852db',
        GEOGRAPHY: '#4852db',
        HISTORY: '#4852db',
        'CHILD DEVELOPMENT PEDAGOGY': '#d35882',
        BOTANY: '#71ba66',
        POLITY: '#71ba66',
        COMPUTER: '#71ba66',
        REASONING: '#3f8aaa',
        'GENERAL SCIENCE': '#cf7d4a',
        'GENERAL POLITY': '#139c6b',
        ECONOMICS: '#4852db',
        AGRICULTURE: '#71ba66',
        EDUCATION: '#3f8aaa',
        'TECHNICAL MATHS': '#2376b2',
        'ARITHMETIC MATH': '#2376b2',
        'CHILD DEVELOPMENT AND PEDAGOGY': '#d35882',
        ALL: '#8235d6',
        // TEST: '#54138a',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return '#b02727';
}

function getColorForFreeClassVideoPage(subject) {
    const colorMap = {
        MATHS: '#D5EDFF',
        PHYSICS: '#DFCCFF',
        BIOLOGY: '#DAFFF2',
        CHEMISTRY: '#FCCBBC',
        SCIENCE: '#C7F7F3',
        ENGLISH: '#FDCCFF',
        'SOCIAL SCIENCE': '#B0D2FF',
        'ENGLISH GRAMMAR': '#FFD5C0',
        'GENERAL SCIENCE': '#FFEDD2',
        COMPUTER: '#FFEFB7',
        REASONING: '#FCB4FF',
        GEOGRAPHY: '#98D2FF',
        'GENERAL AWARENESS': '#FCAAFF',
        'POLITICAL SCIENCE': '#FF9898',
        HISTORY: '#9E8968',
        ECONOMICS: '#FFB88C',
        SST: '#B0D2FF',
        POLITY: '#FF9898',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return '#FFC5B2';
}

function getBarColorForRecentclassHomepage(subject) {
    const colorMap = {
        PHYSICS: '#6f0477',
        BIOLOGY: '#097704',
        CHEMISTRY: '#c85201',
        MATHS: '#047b79',
        // ENGLISH: '#1a99e9',
        // SCIENCE: '#0E2B6D',
        // GUIDANCE: '#0E2B6D',
        // ALL: '#0E2B6D',
        // TEST: '#54138a',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return '#750406';
}

function getSubjectColorForSubjectCards(subject) {
    const colorMap = {
        PHYSICS: '#854ce3',
        BIOLOGY: '#2dca91',
        HINDI: '#2dca91',
        CHEMISTRY: '#f3754d',
        MATHS: '#4ca4e3',
        MATHEMATICS: '#4ca4e3',
        ENGLISH: '#9f4da2',
        'ENGLISH GRAMMAR': '#f68b57',
        'ENVIRONMENTAL STUDIES': '#0098db',
        'ENVIRONMENT STUDIES': '#0098db',
        'GENERAL KNOWLEDGE': '#8235d6',
        'STATIC GK': '#8235d6',
        SCIENCE: '#066666',
        GUIDANCE: '#3f8aaa',
        'WEEKLY TEST': '#3f8aaa',
        'SOCIAL SCIENCE': '#1c57a5',
        GEOGRAPHY: '#4796d3',
        HISTORY: '#583d13',
        'CHILD DEVELOPMENT PEDAGOGY': '#d35882',
        BOTANY: '#169f79',
        POLITY: '#f25858',
        COMPUTER: '#71ba66',
        REASONING: '#3f8aaa',
        'GENERAL SCIENCE': '#d873dc',
        'GENERAL POLITY': '#139c6b',
        ECONOMICS: '#4852db',
        AGRICULTURE: '#71ba66',
        EDUCATION: '#3f8aaa',
        'TECHNICAL MATHS': '#2376b2',
        'ARITHMETIC MATH': '#2376b2',
        'CHILD DEVELOPMENT AND PEDAGOGY': '#d35882',
        ALL: '#8235d6',
        // TEST: '#54138a',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return '#169f79';
}

function getSubjectColorForSubjectCardTags(subject) {
    const colorMap = {
        PHYSICS: '#B385FF',
        BIOLOGY: '#006742',
        HINDI: '#006742',
        CHEMISTRY: '#8E4730',
        MATHS: '#2376B2',
        MATHEMATICS: '#2376B2',
        ENGLISH: '#D873DC',
        'ENGLISH GRAMMAR': '#D873DC',
        'ENVIRONMENTAL STUDIES': '#005276',
        'ENVIRONMENT STUDIES': '005276',
        'GENERAL KNOWLEDGE': '#8B0090',
        'STATIC GK': '#B385FF',
        SCIENCE: '#05B4B4',
        GUIDANCE: '#582200',
        'WEEKLY TEST': '#A8E0F9',
        'SOCIAL SCIENCE': '#448FF3',
        GEOGRAPHY: '#005FA8',
        HISTORY: '#9E8968',
        'CHILD DEVELOPMENT PEDAGOGY': '#372000',
        BOTANY: '#004733',
        POLITY: '#C71F1F',
        COMPUTER: '#227516',
        REASONING: '#FCB4FF',
        'GENERAL SCIENCE': '#8B0090',
        'GENERAL POLITY': '#004733',
        ECONOMICS: '#8C94FA',
        AGRICULTURE: '#71BA66',
        EDUCATION: '#3F8AAA',
        'TECHNICAL MATHS': '#57A9E4',
        'ARITHMETIC MATH': '#57A9E4',
        'CHILD DEVELOPMENT AND PEDAGOGY': '#372000',
        ALL: '#B67AFE',
        TEST: '#54138A',
    };
    if (colorMap[subject]) {
        return colorMap[subject];
    }

    return '#B67AFE';
}

function generateStaticFilter() {
    const obj = {};
    obj.type = 'course_tabs';
    obj.data = {};
    obj.data.items = [
        {
            type: 'free',
            display: 'Upcoming Live Classes',
        },
        // {
        //     type: 'my',
        //     display: 'My Courses',
        // },
    ];
    return obj;
}
function getLiveclassStatus(liveAt) {
    const momentObj = moment(liveAt);
    return (momentObj.isSame(moment().add(5, 'hours').add(30, 'minutes'), 'day')) ? `TODAY ${momentObj.format('h:mm A')}` : `LIVE AT ${momentObj.format('MMM Do, h:mm A')}`;
}

function getLiveclassStatusRecorded(liveAt) {
    const momentObj = moment(liveAt);
    if (moment().add(5, 'hours').add(30, 'minutes').isAfter(liveAt)) {
        return (momentObj.isSame(moment().add(5, 'hours').add(30, 'minutes'), 'day')) ? `TODAY ${momentObj.format('h:mm A')}` : `${momentObj.format('MMM Do, h:mm A')}`;
    }
    return (momentObj.isSame(moment().add(5, 'hours').add(30, 'minutes'), 'day')) ? `TODAY ${momentObj.format('h:mm A')}` : `LIVE AT ${momentObj.format('MMM Do, h:mm A')}`;
}

function checkLiveclassResource(obj) {
    if (_.isNull(obj.is_active) && obj.resource_type !== 8) {
        return true;
    }
    if (!((moment(obj.live_at) < moment().add(5, 'hours').add(30, 'minutes')) && obj.is_active == 0) && obj.resource_type !== 8) {
        return true;
    }
    if (obj.is_replay) {
        return true;
    }
    return false;
}

function showReminder(time) {
    return moment().add(5, 'hours').add(30, 'minutes').isBefore(time);
}

async function generateFreeclassGrid({
    data,
    caraousel,
    db,
    config,
    bottomInfo = 1,
    paymentCardState,
    actionActivity = 'liveclass_course_page',
}) {
    try {
        const obj = {};
        obj.type = caraousel;
        obj.data = {};
        obj.data.items = [];
        // console.log(data);
        for (let i = 0; i < data.length; i++) {
            const o = {};
            o.id = data[i].id;
            o.detail_id = data[i].detail_id;
            o.board_name = (!_.isEmpty(data[i].board_name)) ? data[i].board_name : null;
            o.top_title = getLiveclassStatus(data[i].live_at);
            o.date = moment(data[i].live_at).format('Do MMM	ddd');
            o.remaining = 'Starts Soon';
            o.player_type = data[i].player_type;
            o.image_url = data[i].image_bg_liveclass;
            o.subject = data[i].subject;
            o.is_live = false;
            o.page = 'LIVECLASS';
            if (data[i].resource_type == 4 && data[i].player_type === 'liveclass') {
                o.is_live = (_.isNull(data[i].is_active)) ? false : !!(data[i].is_active);
            }
            if (data[i].resource_type == 1 && data[i].player_type === 'livevideo') {
                o.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
                o.page = 'STRUCTURED';
            }
            o.bottom_title = 'Classes on Mon, Wed, Fri 7:00 pm';
            o.image_bg_card = `${config.staticCDN}liveclass/${data[i].subject}_LBG.png`;
            o.live_text = 'LIVE';
            o.is_premium = (data[i].is_free == 0);
            o.is_vip = paymentCardState.isVip;
            o.title1 = data[i].topic;
            o.title2 = `By ${data[i].faculty_name ? data[i].faculty_name.toUpperCase() : Data.liveclassDefaultFaculty}`;
            o.students = `${(await CourseContainer.getRandomSubsViews({
                db,
                type: 'liveclass_faculty',
                id: data[i].faculty_id,
            })).subs} registered`;
            o.color = getBarColor(data[i].subject);
            o.start_gd = '#8967ff';
            o.mid_gd = '#8967ff';
            o.end_gd = '#01235b';
            o.show_reminder = showReminder(data[i].live_at);
            o.reminder_message = 'Reminder has been set';
            if (bottomInfo) {
                o.reminder_link = `https://www.google.com/calendar/render?action=TEMPLATE&text=${data[i].topic}&dates=${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').format('YYYYMMDDTHHmmSS')}Z/${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').add(1, 'hours')
                    .format('YYYYMMDDTHHmmSS')}Z&sf=true&output=xml`;
                o.button = {};
                o.button.text = Data.freeClassButtonText;
                o.button.action = {};
                o.button.action.action_activity = actionActivity;
                o.button.action.action_data = actionActivity === 'liveclass_course_page' ? { id: data[i].detail_id } : { id: data[i].liveclass_course_id };
            }
            const interested = await Liveclass.getSubscribers(db.mysql.read, data[i].id);
            if (interested) o.interested = `INTERESTED ${interested[0].length + 20000} STUDENTS`;
            if (data[i].is_replay) {
                o.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
            }
            if (checkLiveclassResource(data[i])) {
                obj.data.items.push(o);
            }
        }
        return obj;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function generateBanner({ data, studentID }) {
    const obj = {};
    obj.type = 'banner_image';
    const base64StudentId = Buffer.from(studentID.toString()).toString('base64');
    const dataObject = {};
    obj.action = {};
    dataObject.image_url = data[0].image_url;
    if (!_.isNull(data[0].action_data)) {
        obj.action.action_data = JSON.parse(data[0].action_data);
        obj.action.action_activity = data[0].action_activity;
        if (data[0].action_activity === 'external_url') {
            obj.action.action_data.url = `${obj.action.action_data.url}?student_id=${base64StudentId}`;
        }
    }
    obj.data = dataObject;
    return obj;
}

async function generateVerticalCourseList({
    data,
    caraousel,
    paymentCardState,
    config,
    db,
    categoryID,
    courseType,
}) {
    try {
        const obj = {};
        obj.type = caraousel;
        obj.data = {};
        obj.data.title = 'Courses';
        obj.data.parent = {};
        obj.data.parent.id = data[0].master_course_id;
        // obj.data.parent.is_vip = isVip;
        obj.data.parent.is_vip = paymentCardState.isVip;
        obj.data.parent.image_url = Data.courseImage(config.staticCDN);
        obj.data.parent.title1 = 'Learn from the best'; // (paymentCardState.isVip) ? data[0].master_course_title : `GET ${data[0].master_course_title}`;
        obj.data.parent.title2 = Data.allSubjectText; // data[0].medium;
        obj.data.parent.title3 = '';
        obj.data.parent.title4 = data[0].master_course_title; // (paymentCardState.isVip) ? Data.subjects : Data.paymentButtonText;
        obj.data.parent.completetion_percent = '';
        // obj.data.parent.reminder_link = 'https://www.google.com/calendar/render?action=TEMPLATE&text=Your+Event+Name&dates=20140127T224000Z/20140320T221500Z&details=For+details,+link+here:+http://www.example.com&location=Waldorf+Astoria,+301+Park+Ave+,+New+York,+NY+10022&sf=true&output=xml';
        // if (!isVip) {
        obj.data.parent.button = {};
        // eslint-disable-next-line no-nested-ternary
        obj.data.parent.button.text = data[0].is_free ? 'Learn For Free' : ((paymentCardState.isVip) ? 'CHECK YOUR PLAN' : 'BUY NOW');
        obj.data.parent.button.cross_text = '';
        obj.data.parent.button.action = {};
        obj.data.parent.button.action.action_activity = 'payment_page';
        obj.data.parent.button.action.action_data = {
            page_type: paymentCardState.isVip ? 'my' : 'buy',
            category_id: categoryID,
            course_type: courseType,
            // id: data[0].master_course_id,
        };
        if (data[0].is_free === 0) obj.data.parent.button.action.action_data.id = data[0].master_course_id;
        obj.data.items = [];
        for (let i = 0; i < data.length; i++) {
            const o = {};
            o.id = data[i].detail_id;
            o.faculty_name = data[i].faculty_name ? data[i].faculty_name.toUpperCase() : Data.liveclassDefaultFaculty;
            o.image_url_faculty = data[i].image_url;
            o.image_url_bg = `${config.staticCDN}liveclass/${data[i].subject}_bg.png`;
            o.subject = data[i].subject;
            o.color = getBarColor(data[i].subject);
            o.title1 = data[0].master_course_title;
            o.title2 = data[i].master_chapter;
            o.is_vip = paymentCardState.isVip;
            o.views = `${(await CourseContainer.getRandomSubsViews({
                db,
                type: 'liveclass_course',
                id: data[i].detail_id,
            })).views}1k views`;
            obj.data.items.push(o);
        }
        return obj;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function generateStreamObject(data, db, config, isVip) {
    const obj = {};
    obj.id = data.resource_reference;
    obj.is_vip = true;
    obj.detail_id = data.detail_id;
    obj.top_title = getLiveclassStatus(data.live_at);
    obj.start_gd = '#8967ff';
    obj.mid_gd = '#8967ff';
    obj.end_gd = '#01235b';
    obj.image_bg = data.image_bg_liveclass;
    obj.subject = data.subject;
    obj.topic = data.subject;
    obj.color = getBarColor(data.subject);
    obj.is_live = !!(data.is_active);
    obj.live_text = 'LIVE';
    obj.image_bg_card = `${config.staticCDN}liveclass/${data.subject}_LBG.png`;
    obj.is_premium = (data.is_free == 0);
    obj.is_vip = isVip;
    obj.title1 = data.topic;
    obj.title2 = `By ${data.mapped_faculty_name ? data.mapped_faculty_name.toUpperCase() : Data.liveclassDefaultFaculty}`;
    obj.students = `${(await CourseContainer.getRandomSubsViews({
        db,
        type: 'liveclass_course',
        id: data.detail_id,
    })).subs} students`;
    obj.interested = 0;
    const interested = await Liveclass.getSubscribers(db.mysql.read, data.resource_reference);
    if (interested) obj.interested = `INTERESTED ${interested[0].length} STUDENTS`;
    // console.log(obj);
    // obj.topic = data.chapter;
    return obj;
}

function generateStreamObjectResourcePage(data, db, config, isVip, page) {
    const obj = {};
    obj.id = data.resource_reference;
    obj.detail_id = data.detail_id;
    obj.top_title = getLiveclassStatusRecorded(data.live_at);
    obj.image_url = buildStaticCdnUrl(data.image_bg_liveclass);
    obj.subject = `${data.subject} ${data.liveclass_course_id > 8 ? data.title.split('-')[0] : `${data.class ? `,CLASS ${data.class}` : ''}`}`;
    if (data.class === 14) {
        obj.subject = `${data.subject}, ${data.category || ''}`;
    }
    obj.topic = data.subject;
    obj.color = getBarColorHomepage(data.subject);
    obj.is_live = !!(data.is_active);
    obj.player_type = data.player_type;
    obj.live_text = 'LIVE';
    obj.live_at = moment(data.live_at).unix() * 1000;
    obj.image_bg_card = buildStaticCdnUrl(`${config.staticCDN}liveclass/${data.subject}_LBG_HOME.png`);
    if (!_.includes(['MATHS', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'], data.subject.toUpperCase())) {
        obj.image_bg_card = buildStaticCdnUrl(`${config.staticCDN}liveclass/ENGLISH_LBG_HOME.png`);
    }
    obj.is_premium = !(data.is_free == 1);
    obj.is_vip = isVip;
    obj.is_last_resource = (page === 'COURSE_RESOURCE');
    obj.bottom_title = data.day_text ? `Classes on ${data.day_text}` : '';
    obj.title1 = `${data.topic} ${data.chapter}`;
    obj.title2 = `By ${data.mapped_faculty_name ? data.mapped_faculty_name.toUpperCase() : Data.liveclassDefaultFaculty} ${data.degree ? `,${data.degree}` : ''}`;
    // eslint-disable-next-line no-nested-ternary
    obj.bottom_title = data.liveclass_course_id <= 8 ? (data.day_text ? `Classes on ${data.day_text}` : '') : '';
    obj.page = page || 'LIVECLASS';
    obj.state = 2;
    const payDetails = {
        page_ref: 'detail',
        category_id: data.category_id,
        course_type: data.course_type,
    };
    obj.payment_details = JSON.stringify(payDetails);
    if (obj.is_premium && data.vdo_cipher_id && data.is_vdo_ready === 2) {
        obj.is_downloadable = true;
    }
    if (data.resource_type == 4 && data.player_type === 'liveclass') {
        obj.is_live = (_.isNull(data.is_active)) ? false : !!(data.is_active);
        if (obj.is_live) obj.state = 1;
        if (_.isNull(data.is_active)) obj.state = 0;
    }

    if (data.resource_type == 8 && data.player_type === 'liveclass' && data.is_vdo_ready === 2) {
        obj.player_type = 'video';
    }

    if (data.resource_type == 1 && data.player_type === 'livevideo') {
        if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data.live_at) && data.is_active) {
            obj.is_live = true;
            obj.state = 1;
        } else if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data.live_at) && !data.is_active) {
            obj.is_live = false;
            obj.player_type = 'video';
        }
    }
    if (moment().add(5, 'hours').add(30, 'minutes').isAfter(data.live_at) && moment().add(5, 'hours')
        .add(30, 'minutes').subtract(1, 'hours')
        .isBefore(data.live_at)) {
        obj.state = 1;
    }
    if (data.resource_type === 1 && data.player_type === 'youtube' && !_.isNull(data.meta_info)) {
        obj.id = data.meta_info;
        obj.player_type = 'video';
    }
    if (moment().add(5, 'hours').add(30, 'minutes').isBefore(data.live_at)) {
        obj.state = 0;
    }
    obj.students = (typeof data.students !== 'undefined') ? data.students : '20000+ students';
    // obj.interested = 0;
    // const interested = await CourseContainer.getSubscribers(db, data.resource_reference);
    obj.interested = (typeof data.interested !== 'undefined') ? data.interested : '50000+ interested';
    // obj.topic = data.chapter;
    return obj;
}

async function getHomeData(data) {
    try {
        const {
            db,
            entities,
            courseID,
            versionCode,
            paymentCardState,
            config,
            categoryID,
            courseType,
            studentID,
            studentClass,
        } = data;
        const homeData = [];
        const promises = [];
        for (let i = 0; i < entities.length; i++) {
            if (entities[i] === 'static_filters') {
                promises.push((async () => generateStaticFilter())());
            }
            if (entities[i] === 'freeclass_grid') {
                promises.push(Liveclass.getFreeClass(db.mysql.read, courseID));
            }
            if (entities[i] === 'banner') {
                promises.push(Liveclass.getBanner(db.mysql.read, versionCode));
            }
            if (entities[i] === 'vertical_course_list') {
                promises.push(Liveclass.getLiveclassCourseList(db.mysql.read, courseID));
            }
            if (entities[i] === 'home_banner') {
                promises.push((async () => generateBannerData(config, studentID, studentClass))());
            }
            if (entities[i] === 'video_caraousel') {
                promises.push(Liveclass.getCaraouselQids(db.mysql.read));
            }
        }
        const result = await Promise.all(promises);
        for (let i = 0; i < entities.length; i++) {
            if (entities[i] === 'static_filters' || entities[i] === 'home_banner') {
                homeData.push(result[i]);
            }
            if (entities[i] === 'freeclass_grid') {
                homeData.push(await generateFreeclassGrid({
                    data: result[i],
                    caraousel: entities[i],
                    db,
                    config,
                    paymentCardState,
                }));
            }
            if (entities[i] === 'banner' && result[i].length > 0) {
                homeData.push(generateBanner({ data: result[i], caraousel: entities[i], studentID }));
            }
            if (entities[i] === 'vertical_course_list' && result[i].length > 0) {
                homeData.push(await generateVerticalCourseList({
                    data: result[i],
                    caraousel: entities[i],
                    isVip: false,
                    paymentCardState,
                    config,
                    db,
                    categoryID,
                    courseType,
                }));
            }
            if (entities[i] === 'video_caraousel' && result[i].length > 0) {
                homeData.push(getVideoCaraousel(config, result[i]));
            }
        }
        return homeData;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function generateResourceObject(value, paymentCardState) {
    const obj = {};
    // if (key == 1) {
    //     obj.resource_type = key;
    //     obj.display = `${value.length} videos`;
    // }
    if (value.resource_type == 2) {
        obj.resource_type = value.resource_type;
        obj.text = value.topic;
        obj.data = value.resource_reference;
        obj.is_premium = (value.is_free == 0);
        obj.is_vip = paymentCardState.isVip;
    }
    // if (key == 3) {
    //     obj.resource_type = key;
    //     obj.display = `${value.length} assignments`;
    // }
    // if (key == 5) {
    //     obj.resource_type = key;
    //     obj.display = `${value.length} mock Test`;
    // }
    // if (key == 6) {
    //     obj.resource_type = key;
    //     obj.display = `${value.length} Doubts`;
    // }
    return obj;
}

function generateResponse(courseDetailsObj, isVip, button, streamList, reminderCard, resourceDetails, masterChapter, courseID, isPremium) {
    const resp = {};
    resp.widgets = [];
    resp.event_data = {
        board: courseDetailsObj.board,
        teacher: courseDetailsObj.faculty_name,
        subject: courseDetailsObj.subject,
    };
    const liveClassDetailSegment = {};
    liveClassDetailSegment.type = 'live_class_detail_segment';
    liveClassDetailSegment.data = {};
    liveClassDetailSegment.data.title = masterChapter;
    liveClassDetailSegment.data.master_chapter = masterChapter;
    liveClassDetailSegment.data.whatsapp_share_message = Data.whatsAppShare;
    liveClassDetailSegment.data.course_details = courseDetailsObj;
    liveClassDetailSegment.data.scroll_direction = 'vertical';
    liveClassDetailSegment.data.is_vip = isPremium ? isVip : true;
    liveClassDetailSegment.data.is_premium = isPremium;
    liveClassDetailSegment.data.course_id = courseID;
    if (isPremium) {
        liveClassDetailSegment.data.payment_button = button;
    }
    liveClassDetailSegment.data.items = streamList;
    resp.widgets.push(liveClassDetailSegment);
    const reminderCardObject = {};
    reminderCardObject.type = 'reminder_card';
    reminderCardObject.data = reminderCard;
    // resp.widgets.push(reminderCardObject);
    const liveClassResourceObject = {};
    liveClassResourceObject.type = 'live_class_resource';
    liveClassResourceObject.data = {};
    liveClassResourceObject.data.items = {};
    liveClassResourceObject.data.course_id = courseID;
    liveClassResourceObject.data.is_vip = isPremium ? isVip : true;
    liveClassResourceObject.data.is_vip = (courseID == 22 ? isVip : true);
    liveClassResourceObject.data.items = resourceDetails;
    resp.widgets.push(liveClassResourceObject);
    return resp;
}

function generateResourceDetails(key, value, paymentCardState) {
    const obj = {};
    obj.chapter = {};
    obj.chapter.name = value[0].chapter;
    obj.resources = {};
    obj.resources.icons = [];
    obj.resources.videos = [];
    obj.chapter.is_premium = (value[0].is_free == 0);
    obj.is_vip = (value[0].is_free == 0) ? paymentCardState.isVip : true;

    for (let i = 0; i < value.length; i++) {
        const o = {};
        if (value[i].resource_type == 1 || value[i].resource_type == 8) {
            o.resource_type = 1;
            o.data = {};
            o.data.id = value[i].resource_reference;
            o.data.page = 'LIVECLASS_RESOURCE';
            o.data.title = value[i].topic;
            o.data.player_type = value[i].player_type;
            o.data.time = value[i].live_at;
            o.data.is_live = false;
            o.data.is_premium = (value[i].is_free == 0);
            o.data.is_vip = (value[i].is_free == 0) ? paymentCardState.isVip : true;
            if (value[i].player_type === 'livevideo') {
                o.data.is_live = moment().add(5, 'hours').add(30, 'minutes').isSame(value[i].live_at, 'day');
                o.data.page = 'STRUCTURED';
            }
            if (value[i].resource_type === 1 && value[i].player_type === 'youtube' && !_.isNull(value[i].meta_info)) {
                o.data.id = value[i].meta_info;
                o.data.player_type = 'video';
            }
            o.data.is_live = value[i].live_at;
            if (value[i].resource_type == 8) {
                o.data.page = 'TS_VOD';
            }
            obj.resources.videos.push(o);
        } else {
            // if (value[i].resource_type == 2) {
            //     o.resource_type = value[i].resource_type;
            //     o.text = 'Notes';
            //     o.data = value[i].resource_reference;
            // }
            if (value[i].resource_type == 3) {
                o.resource_type = value[i].resource_type;
                o.text = 'Assignment';
                o.data = value[i].resource_reference;
            }
            if (value[i].resource_type == 9) {
                o.resource_type = 5;
                o.text = 'Mock Test';
                o.data = parseInt(value[i].resource_reference);
            }
            if (value[i].resource_type == 6) {
                o.resource_type = value[i].resource_type;
                o.text = 'Doubts';
                o.data = value[i].resource_reference;
            }
            if (!_.isEmpty(o)) {
                obj.resources.icons.push(o);
            }
        }
    }
    return obj;
}

function generateReminderCard(reminderLink) {
    const reminderCard = {};
    reminderCard.title = Data.reminderCardTitle1;
    reminderCard.title2 = Data.reminderCardTitle2;
    reminderCard.button = {};
    reminderCard.button.text = Data.reminderCardButtonText;
    reminderCard.button.action = {};
    reminderCard.button.action.action_activity = 'remind_action';
    reminderCard.button.action.action_data = { url: reminderLink };
    return reminderCard;
}

function generateButton(text, actionActivity, actionData) {
    const button = {};
    button.text = text;
    button.cross_text = ''; // to be removed
    button.action = {};
    button.action.action_activity = actionActivity;
    button.action.action_data = actionData;
    return button;
}
async function fetchDefaultPackages(db, studentId, showSelection, flagrResponse, config, courseID) {
    const { variantAttachment } = flagrResponse;
    console.log('variant_attachment', variantAttachment);
    let durationInDaysList;

    if (!_.isEmpty(variantAttachment) && typeof variantAttachment.package_duration !== 'undefined') {
        durationInDaysList = variantAttachment.package_duration;
    } else {
        durationInDaysList = config.default_package_duration_list;
    }
    const packageList = await Package.getLiveclassPackagesByDuration(db.mysql.read, durationInDaysList, courseID);
    console.log('packageList');
    console.log(packageList);
    for (let i = 0; i < packageList.length; i++) {
        packageList[i].offer_amount = parseInt(variantAttachment.final_price[i]);
        packageList[i].original_amount = parseInt(packageList[i].original_amount);
        packageList[i].duration = PackageContainer.parseDuration(packageList[i].duration_in_days);
        packageList[i].off = `${parseInt(Math.ceil((1 - (variantAttachment.final_price[i] / packageList[i].original_amount)) * 100))}%\noff`;
        packageList[packageList.length - 1].selected = false;
    }
    if (showSelection) {
        packageList[packageList.length - 1].selected = true;
    }
    return packageList;
}

async function fetchInfoForUserOnSubscription(db, studentPackage, now, flagrResponse, config, courseID) {
    const response = {};
    const main = {};
    main.subscription = true;
    main.description = `Your Plan is Valid till ${moment(studentPackage.end_date).format('Do MMMM YYYY')}`;
    const daysLeft = moment(studentPackage.end_date).diff(now, 'days');
    const selectedPackage = await Package.getPackageById(db.mysql.read, studentPackage.student_package_id);
    main.title = 'Apka current plan';
    let checkSelected = 0;
    main.package_list = await fetchDefaultPackages(db, studentPackage.student_id, true, flagrResponse, config, courseID);
    for (let i = 0; i < main.package_list.length; i++) {
        main.package_list[i].offer_amount = parseInt(main.package_list[i].offer_amount);
        main.package_list[i].original_amount = parseInt(main.package_list[i].original_amount);
        main.package_list[i].duration = PackageContainer.parseDuration(main.package_list[i].duration_in_days);
        main.package_list[i].off = `${parseInt(Math.ceil((1 - (main.package_list[i].offer_amount / main.package_list[i].original_amount)) * 100))}%\noff`;
        main.package_list[i].selected = false;
        if (main.package_list[i].id == selectedPackage[0].id) {
            main.package_list[i].selected = true;
            checkSelected = 1;
        }
    }
    if (!checkSelected) {
        main.package_list[0].selected = true;
    }

    main.cta_text = 'UPGRADE PLAN';

    if (daysLeft <= config.subscription_threshold) {
        main.renewal = true;
        main.title = 'Apna Plan Select karo';
        main.cta_text = 'RENEW NOW';
        if (daysLeft) {
            main.description = `Your Plan expires in ${PackageContainer.parseDuration(daysLeft)}`;
        } else {
            main.description = `Your Plan expires ${PackageContainer.parseDuration(daysLeft)}`;
        }
    }
    response.main = main;
    return response;
}

async function fetchSubscriptionDetails(db, studentId, flagrResponse, config, courseID) {
    const response = {};

    const main = {};

    main.subscription = false;
    main.trial = false;
    main.title = 'Apna Plan Select karo';
    main.description = 'Get access to live classes and many more...';
    main.cta_text = 'BUY PLAN';
    main.package_list = await fetchDefaultPackages(db, studentId, true, flagrResponse, config, courseID);
    response.main = main;
    return response;
}

async function generateFreeclassGridHomepage({
    data,
    caraousel,
    db,
    config,
    bottomInfo = 1,
    studentClass,
    paymentCardState,
    versionCode,
    actionActivity = 'liveclass_course_page',
}) {
    try {
        const obj = {};
        obj.type = caraousel;
        obj.data = {};
        obj.data.items = [];
        const promises = [];
        for (let i = 0; i < data.length; i++) {
            promises.push(CourseContainerV2.getAssortmentsByResourceReference(db, data[i].id, studentClass));
        }
        const assortments = await Promise.all(promises);
        for (let i = 0; i < data.length; i++) {
            const o = {};
            o.id = data[i].id;
            o.detail_id = data[i].detail_id;
            o.board_name = (!_.isEmpty(data[i].board_name)) ? data[i].board_name : null;
            o.date = moment(data[i].live_at).format('Do MMM	ddd');
            // o.remaining = 'Starts Soon';
            o.player_type = data[i].player_type;
            o.image_url = data[i].image_bg_liveclass;
            o.subject = `${data[i].subject}, Class ${data[i].class}`;
            o.is_live = false;
            o.live_at = moment(data[i].live_at).unix() * 1000;
            o.is_last_resource = false;
            o.page = 'HOME_FEED_LIVE';
            o.state = 1;
            o.is_premium = (data[i].is_free == 0);
            o.is_vip = paymentCardState.isVip;
            o.show_emi_dialog = paymentCardState.emiDialog;
            if (data[i].resource_type == 8 && data[i].player_type === 'liveclass' && data[i].is_vdo_ready === 2) {
                obj.player_type = 'video';
                if (o.is_premium && data[i].vdo_cipher_id) {
                    o.is_downloadable = true;
                }
            }
            if (data[i].resource_type == 4 && data[i].player_type === 'liveclass') {
                o.is_live = (_.isNull(data[i].is_active)) ? false : !!(data[i].is_active);
            }
            if (data[i].resource_type == 1 && data[i].player_type === 'livevideo') {
                o.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
                o.page = 'STRUCTURED';
            }
            if (data[i].resource_type === 1 && data[i].player_type === 'youtube' && !_.isNull(data[i].meta_info)) {
                o.id = data[i].meta_info;
                o.player_type = 'video';
            }
            if (o.is_live) {
                o.state = 1;
            }
            o.bottom_title = data[i].day_text ? `Classes on ${data[i].day_text}` : `Classes on MON | WED | FRI ${moment(data[i].live_at).format('hh:mm A')}`;
            o.image_bg_card = `${config.staticCDN}liveclass/${data[i].subject}_LBG_HOME.png`;
            o.live_text = 'LIVE';
            o.title1 = data[i].topic;
            o.title2 = `By ${data[i].faculty_name ? data[i].faculty_name.toUpperCase() : Data.liveclassDefaultFaculty}, ${data[i].degree_obtained ? data[i].degree_obtained : ''}`;
            const payDetails = {
                page_ref: 'detail',
                category_id: data[i].category_id,
                course_type: data[i].course_type,
            };
            obj.payment_details = JSON.stringify(payDetails);
            o.students = `${(await CourseContainer.getRandomSubsViews({
                db,
                type: 'liveclass_faculty',
                id: data[i].faculty_id,
            })).subs} registered`;
            o.color = getBarColorHomepage(data[i].subject);
            o.start_gd = '#8967ff';
            o.mid_gd = '#8967ff';
            o.end_gd = '#01235b';
            o.show_reminder = showReminder(data[i].live_at);
            o.reminder_message = 'Reminder has been set';
            if (assortments[i] && assortments[i][0] && assortments[i][0].assortment_id) {
                o.payment_deeplink = `doubtnutapp://vip?assortment_id=${assortments[i][0].assortment_id}`;
                o.assortment_id = assortments[i][0].assortment_id;
            }
            if (bottomInfo) {
                if (!o.is_live) {
                    o.reminder_link = `https://www.google.com/calendar/render?action=TEMPLATE&text=${data[i].topic}&dates=${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').format('YYYYMMDDTHHmmSS')}Z/${moment(data[i].live_at).subtract(5, 'hours').subtract(30, 'minutes').add(1, 'hours')
                        .format('YYYYMMDDTHHmmSS')}Z&sf=true&output=xml`;
                }
                o.button = {};
                o.button.text = Data.resourcePageButtonText;
                o.button.action = {};
                o.button.action.action_activity = actionActivity;
                if (versionCode > 866) {
                    const actionData = actionActivity === 'liveclass_course_page' ? { id: assortments[i] && assortments[i][0] ? assortments[i][0].chapter_assortment : data[i].liveclass_course_id } : { id: data[i].liveclass_course_id };
                    o.button.deeplink = `doubtnutapp://course_details?id=${actionData}`;
                } else if (versionCode >= 787) {
                    o.button.action.action_data = actionActivity === 'liveclass_course_page' ? { id: assortments[i] && assortments[i][0] ? assortments[i][0].chapter_assortment : data[i].liveclass_course_id } : { id: data[i].liveclass_course_id };
                } else {
                    o.button.action.action_data = actionActivity === 'liveclass_course_page' ? { id: data[i].detail_id } : { id: data[i].liveclass_course_id };
                }
            }
            o.top_title = moment(data[i].live_at).format('Do MMM hh:mm A');
            const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            const liveDate = moment(data[i].live_at, 'DD-MM-YYYY');
            o.diff = today.diff(liveDate, 'days') + 1;
            if (o.diff == 1) {
                o.top_title = `Today ${moment(data[i].live_at).format('hh:mm A')}`;
            } else if (o.diff == 0) {
                o.top_title = `Tomorrow ${moment(data[i].live_at).format('hh:mm A')}`;
            }
            o.top_title = o.is_live ? 'LIVE NOW' : o.top_title;
            const interested = await CourseContainer.getSubscribers(db, data[i].id);
            if (interested && interested.length) o.interested = `${interested[0].length + 20000} interested`;
            if (data[i].is_replay) {
                o.is_live = moment().add(5, 'hours').add(30, 'minutes').isAfter(data[i].live_at);
            }
            if (moment().add(5, 'hours').add(30, 'minutes').isBefore(data[i].live_at)) {
                o.state = 0;
            }
            if (checkLiveclassResource(data[i])) {
                obj.data.items.push(o);
            }
            obj.deeplink = actionActivity === 'liveclass_course_page' ? { id: assortments[i] && assortments[i][0] ? assortments[i][0].chapter_assortment : data[i].liveclass_course_id } : { id: data[i].liveclass_course_id };
        }
        return obj;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getLiveclassCarousel(db, config, ccmArray, studentId, studentClass, versionCode) {
    try {
        // let ecmId = [13];
        console.log(ccmArray);
        let courses = [];
        if (ccmArray.length > 0) {
            courses = await CourseMysql.getEcmIdFromCcm(db.mysql.read, ccmArray, studentClass, studentId);
            if (courses.length === 0) {
                courses = await CourseMysql.getEcmIdFromClass(db.mysql.read, studentClass, studentId);
            }
        } else {
            courses = await CourseMysql.getEcmIdFromClass(db.mysql.read, studentClass, studentId);
        }
        // if (!ecmIds) {
        //     ecmIds = await CourseMysql.getEcmIdFromCcm(db.mysql.read, studentClass);
        //     ecmIds.forEach((e) => { ecmId.push(e.ecm_id) });
        // }
        // const courses = await Liveclass.getCourseByEcmID(db.mysql.read, 13, studentClass);
        // console.log('courses');
        // console.log(courses);
        const userSubscriptionData = await CourseMysql.getUserSubscription(db.mysql.read, studentId);
        const caraousel = [];
        for (let i = 0; i < courses.length; i++) {
            const result = await CourseContainer.getLiveSectionHome(db, courses[i].id, courses[i].course_type, 'ALL', studentClass);
            console.log(result.length);
            let paymentCardState = await CourseContainer.getPaymentCardStateV2({
                data: userSubscriptionData,
                courseType: courses[i].course_type,
                categoryID: courses[i].category_id,
            });
            if (versionCode >= 787) {
                const userPackagesByAssortment = await CourseMysqlV2.getUserActivePackagesByAssortment(db.mysql.read, studentId, courses[i].assortment_id);
                if (userPackagesByAssortment.length) {
                    paymentCardState = {
                        isVip: true,
                        emiDialog: false,
                    };
                    const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
                    const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
                        .endOf('day');
                    if (userPackagesByAssortment[0].type === 'emi' && userPackagesByAssortment[0].end_date >= now && userPackagesByAssortment[0].end_date <= end) {
                        const nextEmiPaid = await CourseMysqlV2.checkNextEmiPaid(db.mysql.read, studentId, userPackagesByAssortment[0].new_package_id);
                        const emiCheck = await checkEmiCounter(db, studentId);
                        if (!nextEmiPaid.length && emiCheck) {
                            paymentCardState.emiDialog = true;
                        }
                    }
                }
            }
            if (result.length) {
                const grid = await generateFreeclassGridHomepage({
                    data: result,
                    caraousel: 'live_class_carousel',
                    db,
                    config,
                    studentClass,
                    versionCode,
                    paymentCardState,
                });
                caraousel.push({ title: courses[i].home_carousel_title ? courses[i].home_carousel_title : courses[i].title, items: grid.data.items });
            }
        }
        return caraousel;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function updateFirebase(resourceID, fireBaseInstance) {
    const masterObj = {};
    masterObj[resourceID] = { ended: true };
    fireBaseInstance.update(masterObj);
}
// get liveclass stream state
function getStreamState(resourceId, config, callback) {
    const secretID = config.tencent_secret_id;
    const secretKey = config.tencent_secret_key;
    const { Credential } = tencentcloud.common;
    const cred = new Credential(secretID, secretKey);
    const LiveClient = tencentcloud.live.v20180801.Client;
    // const models = tencentcloud.live.v20180801.Models;
    const client = new LiveClient(cred, 'ap-mumbai');
    // const req1 = new Tencent.SearchMediaRequest({ StreamId: resourceID });
    const req1 = new Tencent.DescribeLiveStreamStateRequest({ AppName: config.liveclass.appName, DomainName: config.liveclass.pushDomainName, StreamName: resourceId });
    client.DescribeLiveStreamState(req1, (err, response) => {
        console.log(err);
        if (err) {
            console.log(err);
            return callback({ StreamState: 'errored' });
        }
        callback(response);
    });
}

function getVodUrl(resourceID, config, callback) {
    // console.log('resourceID')
    // console.log(resourceID)
    const vodUrl = {};
    vodUrl.m3u8 = '';
    vodUrl.mp4 = [];
    const secretID = config.tencent_secret_id;
    const secretKey = config.tencent_secret_key;
    const VodClient = tencentcloud.vod.v20180717.Client;
    // const models = tencentcloud.vod.v20180717.Models;
    const { Credential } = tencentcloud.common;
    const cred = new Credential(secretID, secretKey);
    const client = new VodClient(cred, 'ap-mumbai');
    const req1 = new Tencent.SearchMediaRequest({ StreamId: resourceID });
    client.SearchMedia(req1, (err, response) => {
        // The request is returned exceptionally, and the exception information is printed
        // The request is returned normally, and the response object is printed
        // console.log("response.MediaInfoSet");
        // console.log(response.MediaInfoSet);
        if (err) {
            return callback(vodUrl);
        }
        for (let j = 0; j < response.MediaInfoSet.length; j++) {
            const resourceIDPattern = new RegExp(resourceID, 'g');
            if (response.MediaInfoSet[j].BasicInfo.Name.match(resourceIDPattern) && response.MediaInfoSet[j].BasicInfo.Type === 'm3u8') {
                vodUrl.m3u8 = response.MediaInfoSet[j].BasicInfo.MediaUrl;
            }
            if (response.MediaInfoSet[j].BasicInfo.Name.match(resourceIDPattern) && response.MediaInfoSet[j].BasicInfo.Type === 'mp4') {
                vodUrl.mp4.push(response.MediaInfoSet[j].BasicInfo.MediaUrl);
            }
        }
        vodUrl.mp4 = _.reverse(vodUrl.mp4);
        vodUrl.requestId = response.requestId;
        vodUrl.TotalCount = response.TotalCount;
        return callback(vodUrl);
    });
}
function getLiveQuizPoints(isCorrect, isFastest) {
    if (isCorrect === 1 && isFastest) {
        return Data.liveQuizContestParams.Y;
    }
    if (isCorrect === 1) {
        return Data.liveQuizContestParams.X;
    }
    return 0;
}
async function checkFastest(db, quizQuestionID, detailID) {
    try {
        const result = await Liveclass.getFastCorrectAnswer(db.mysql.read, quizQuestionID, detailID);
        if (result.length === 0) {
            return true;
        }
        return false;
    } catch (e) {
        throw new Error(e);
    }
}

function sendGamificationTrigger(points, studentID, fcmID) {
    if (points > 0) {
        const data = {
            notification_type: 'SILENT_GAMIFICATION',
            popup_direction: 'TOP_RIGHT',
            popup_type: 'popup_points_achieved',
            message: 'Congratulations',
            description: `${points} quiz points Earned`,
            img_url: '',
            duration: '2000',
            firebase_eventtag: 'liveclass_quiz_gamification_trigger',
        };
        Utility.sendFcm(studentID, fcmID, data);
    }
}
// async function _asyncForEach(array, callback) {
//     for (let index = 0; index < array.length; index++) {
//         await callback(array[index], index, array);
//     }
// }
function replaceChar(origString, replaceC, index) {
    const firstPart = origString.substr(0, index);
    const lastPart = origString.substr(index + 1);
    const newString = firstPart + replaceC + lastPart;
    return newString;
}
function replaceWithHash(mobile) {
    if (_.isNull(mobile)) {
        return '######0000';
    }
    for (let i = 0; i < mobile.length; i++) {
        if (i < mobile.length - 4) {
            mobile = replaceChar(mobile, '#', i);
        }
    }
    return mobile;
}
async function generateLeaderBoard(db, leaderBoardList) {
    try {
        const leaderBoard = [];
        const studentArr = [];
        const pointsArr = [];
        for (let i = 0; i < leaderBoardList.length; i++) {
            if (i % 2 === 0) {
                studentArr.push(leaderBoardList[i]);
            } else {
                pointsArr.push(leaderBoardList[i]);
            }
        }
        for (let i = 0; i < studentArr.length; i++) {
            const obj = {};
            obj.rank = i + 1;
            obj.student_id = parseInt(studentArr[i]);
            const studentDetails = await StudentContainer.getById(studentArr[i], db);
            obj.username = studentDetails[0].student_fname ? studentDetails[0].student_fname : studentDetails[0].student_username;
            obj.avatar = studentDetails[0].img_url;
            obj.mobile = replaceWithHash(studentDetails[0].mobile);
            obj.points = parseInt(pointsArr[i]);
            obj.hexcode = (obj.rank < 14) ? '#000000' : '#808080';
            leaderBoard.push(obj);
        }
        return leaderBoard;
    } catch (e) {
        throw Error(e);
    }
}
function getPoints(userPointsLogs, points, questionClass) {
    if (userPointsLogs.length > 0) {
        const totalPoints = _.maxBy(userPointsLogs, 'total_point_class');
        // check same points of class
        const groupedByPoints = _.groupBy(userPointsLogs, 'points');
        if (typeof groupedByPoints[totalPoints.total_point_class] !== 'undefined' && groupedByPoints[totalPoints.total_point_class].length > 1) {
            // console.log('same score different class')
            // two class has same score. Need to calculate score
            return totalPoints.total_point_class + points;
        }
        // one class has top score
        if (totalPoints.class == questionClass) {
            // console.log('same class top score')
            return totalPoints.total_point_class + points;
        }
        // console.log('different class top score')
        return totalPoints.total_point_class;
    }
    // console.log('no logs')
    return points;
}

function isFutureStream(streamObject, versionCode) {
    let flag = false;
    if (versionCode >= Data.socketAppVersion) {
        if (streamObject.resource_type === 4) {
            if (moment().add(5, 'hours').add(30, 'minutes').isBefore(streamObject.live_at) && _.isNull(streamObject.stream_start_time) && (_.isNull(streamObject.stream_status))) {
                flag = true;
            }
        }
        if ((moment().add(5, 'hours').add(30, 'minutes').isBefore(streamObject.live_at))
            && (streamObject.resource_type === 1 || streamObject.resource_type === 8)) {
            flag = true;
        }
    } else {
        if (streamObject.resource_type === 4) {
            if (moment().add(5, 'hours').add(30, 'minutes').isBefore(streamObject.live_at) && _.isNull(streamObject.start_time) && (_.isNull(streamObject.is_active) || (streamObject.is_active === 0))) {
                flag = true;
            }
        }
        if ((moment().add(5, 'hours').add(30, 'minutes').isBefore(streamObject.live_at))
            && (streamObject.resource_type === 1 || streamObject.resource_type === 8)) {
            flag = true;
        }
    }

    return flag;
}

function quotesEscape(string) {
    return string.replace(/'/g, '\\\'').replace(/"/g, '\\"').trim();
}

function handleOptions(string) {
    return string.replace(/'/g, '').replace(/"/g, '\\"').trim();
}

async function getStatus(db, liveclassObject, versionCode) {
    let state = 0;
    if (liveclassObject.length === 0) {
        return 2;
    }
    if (versionCode >= Data.socketAppVersion) {
        if (liveclassObject[0].schedule_type === 'recorded') {
            state = 2;
        } else if (liveclassObject[0].resource_type === 4) {
            if (_.isNull(liveclassObject[0].stream_end_time) && liveclassObject[0].stream_status === 'ACTIVE') {
                state = 1;
            }
            if (!_.isNull(liveclassObject[0].stream_start_time) && liveclassObject[0].stream_status === 'INACTIVE') {
                state = 2;
            }
        } else {
            state = 2;
        }
        //  else if (moment().add(5, 'hours').add(30, 'minutes').isAfter(liveclassObject[0].live_at)) {
        //     console.log('1111');
        //     state = 1;
        // }
    } else if (liveclassObject[0].resource_type === 4) {
        if (_.isNull(liveclassObject[0].end_time) && liveclassObject[0].is_active === 1) {
            state = 1;
        }
        if (!_.isNull(liveclassObject[0].start_time) && liveclassObject[0].is_active === 0) {
            state = 2;
        }
    } else {
        state = 2;
    }
    // if (moment().add(5, 'hours').add(30, 'minutes').isAfter(liveclassObject[0].live_at)) {
    //     console.log('3333');

    //     state = 1;
    // }
    // check for scheduler
    const isExist = await SchedulerContainer.checkQid(db, +liveclassObject[0].resource_reference);
    if (isExist.length > 0) {
        state = 1;
    }
    // if (versionCode >= Data.videoAlltypeHandlingVersionCode) {
    //     state = Data.statusMap[state];
    // }
    return state;
}

function getCourseTabsWidget(courses, activeCourseID) {
    const tabsWidget = [];
    for (let i = 0; i < courses.length; i++) {
        tabsWidget.push({
            course_id: courses[i].course_id,
            class: courses[i].class,
            course_name: courses[i].display_name,
            is_active: (courses[i].course_id == activeCourseID) ? 1 : 0,
        });
    }
    return tabsWidget;
}
function generateLeaderBoardV2(leaderBoardList, courseID) {
    const leaderBoard = [];
    const studentArr = [];
    const pointsArr = [];
    for (let i = 0; i < leaderBoardList.length; i++) {
        if (i % 2 === 0) {
            studentArr.push(leaderBoardList[i]);
        } else {
            pointsArr.push(leaderBoardList[i]);
        }
    }
    for (let i = 0; i < studentArr.length; i++) {
        const obj = {};
        obj.rank = i + 1;
        obj.student_id = parseInt(studentArr[i]);
        obj.points = parseInt(pointsArr[i]);
        obj.course_id = courseID;
        leaderBoard.push(obj);
    }
    return leaderBoard;
}

async function handleAnswerVideoResource(db, answerID, insertedData, inActive = false) {
    try {
        // check for duplicate
        const result = await AnswerMysql.getAnswerVideoResourceByAnswerIDResourceType(db.mysql.read, answerID, insertedData.resource_type);
        if (result.length === 0) {
            await AnswerMysql.updateAnswerVideoResourceOrder(db.mysql.write, answerID);
            await AnswerMysql.addAnswerVideoResource(db.mysql.write, insertedData);
            await AnswerRedis.deleteAnswerVideoResource(db.redis.write, answerID);
            if (inActive) {
                await AnswerMysql.inActiveAnswerVideoResource(db.mysql.write, answerID, 'RTMP');
            }
        }
    } catch (e) {
        throw new Error(e);
    }
}

async function startFermiTranscode(config, questionId, streamUrl) {
    try {
        await rp.put({
            baseUrl: config.microUrlLegacy,
            url: '/api/fermi/rtmp/start',
            body: {
                questionId,
                streamUrl: streamUrl.split('&')[0],
                delegate: true,
            },
            json: true,
            timeout: 10000,
        });
    } catch (e) {
        console.error(e);
    }
}

async function stopFermiTranscode(config, questionId) {
    try {
        await rp.put({
            baseUrl: config.microUrlLegacy,
            url: '/api/fermi/rtmp/stop',
            body: {
                questionId,
            },
            json: true,
            timeout: 10000,
        });
    } catch (e) {
        console.error(e);
    }
}

async function responseBuilding(db, reqRes, resourceRefs, classVal) {
    // filtering result for required class
    let resultArr = [];
    const resToGetQids = [];
    reqRes.forEach((x, i) => {
        const resForReqCls = x.filter((y) => parseInt(y.class) === classVal);
        if (!_.isEmpty(resForReqCls)) {
            // adding resuts into an array
            resForReqCls[0].resource_id = resForReqCls[0].id;
            delete resForReqCls[0].id;
            resForReqCls[0].chapter_meta = resForReqCls[0].chapter;
            delete resForReqCls[0].chapter;
            resultArr.push(resForReqCls[0]);
        } else {
            // adding qids, for which we don't get results, into an array
            resultArr.push([]);
            resToGetQids.push(resourceRefs[i]);
        }
    });

    if (!_.isEmpty(resToGetQids)) {
        // getting data from mysql for which we don't get data from redis function
        let liveClassData = await Liveclass.getLiveVideoFullDetailsByResId(db.mysql.read, resToGetQids);
        if (liveClassData.length > 0) {
            let lvDataForReqClass = liveClassData.filter((x) => parseInt(x.class) === classVal);
            if (lvDataForReqClass.length > 0) {
                lvDataForReqClass = _.uniqBy(liveClassData, 'resource_reference');
            }
            liveClassData = lvDataForReqClass;
        }
        resultArr.forEach((x, i) => {
            if (_.isEmpty(x)) {
                const resData = liveClassData.filter((y) => y.resource_reference == resourceRefs[i]);
                if (!_.isEmpty(resData)) {
                    resultArr[i] = resData[0];
                }
            }
        });
        resultArr = resultArr.filter((x) => x.resource_reference != undefined);
    }

    return resultArr;
}

async function addFacultyDetails(db, reqRes) {
    // getting faculty details
    const facultyImgDetails = [];
    reqRes.forEach((x) => {
        if (x.faculty_id != undefined && x.faculty_id != null && x.faculty_id !== '') {
            facultyImgDetails.push(LiveclassContainer.getFacultyImgById(db, x.faculty_id));
        }
    });
    const facultyDetails = await Promise.all(facultyImgDetails);

    reqRes.forEach((x) => {
        const facultyData = facultyDetails.filter((y) => y[0].id == x.faculty_id);
        if (facultyData.length > 0 && facultyData[0].length > 0) {
            x.image_bg_liveclass = facultyData[0][0].image_bg_liveclass;
            x.image_url = facultyData[0][0].image_url;
        }
    });

    reqRes = reqRes.filter((x) => x.image_url && x.image_bg_liveclass);

    return reqRes;
}

async function getLiveclassData(db, resourceRefs, classVal) {
    // getting result from redis
    const reqPromise = [];
    resourceRefs.forEach((x) => reqPromise.push(CourseContainerV2.getAssortmentsByResourceReferenceV1(db, x)));
    let reqRes = await Promise.all(reqPromise);

    reqRes = await responseBuilding(db, reqRes, resourceRefs, classVal);
    reqRes = await addFacultyDetails(db, reqRes);
    return reqRes;
}

module.exports = {
    getHomeData,
    showReminder,
    generateVerticalCourseList,
    generateStreamObject,
    generateCourseListFilter,
    generateStaticFilter,
    generateResourceObject,
    generateResponse,
    generateResourceDetails,
    generateReminderCard,
    generateButton,
    fetchInfoForUserOnSubscription,
    fetchSubscriptionDetails,
    generateFreeclassGrid,
    getLiveclassStatus,
    getLiveclassCarousel,
    generateFreeclassGridHomepage,
    updateFirebase,
    getVodUrl,
    getLiveQuizPoints,
    checkFastest,
    sendGamificationTrigger,
    generateLeaderBoard,
    replaceWithHash,
    generateStreamObjectResourcePage,
    getPoints,
    getBarColorHomepage,
    isFutureStream,
    quotesEscape,
    handleOptions,
    getStatus,
    generateBannerData,
    getCourseTabsWidget,
    generateLeaderBoardV2,
    getLiveclassStatusRecorded,
    handleAnswerVideoResource,
    getBarColorForLiveclassHomepage,
    checkEmiCounter,
    getBarColorForRecentclassHomepage,
    startFermiTranscode,
    stopFermiTranscode,
    getStreamState,
    getSubjectColorForSubjectCards,
    getColorForFreeClassVideoPage,
    getSubjectColorForSubjectCardTags,
    getLiveclassData,
};
