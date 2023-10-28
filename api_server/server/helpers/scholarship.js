/* eslint-disable key-spacing */
const moment = require('moment');
const CourseContainerv2 = require('../../modules/containers/coursev2');
const CourseMysqlv2 = require('../../modules/mysql/coursev2');

async function registerWidget(db, testId, locale) {
    let dataTest = await CourseContainerv2.getScholarshipExams(db);
    dataTest = dataTest.filter((item) => item.test_id === +testId);
    const data = {
        show_close_btn: true,
        test_id: +testId,
        scholarship_test_id: dataTest[0].type,
        widgets: [{
            type: 'text_widget',
            data: {
                title: dataTest[0].test_name.replace(/\n/g, ' '),
                text_color: '#541388',
                text_size: '32',
                background_color: '#ffffff',
                isBold: true,
                alignment: '',
                linkify: false,
            },
            layout_config: {
                margin_top: 20,
                margin_left: 19,
                margin_right: 32,
                margin_bottom: 0,
            },
        },
        {
            type: 'text_widget',
            data: {
                html_title: dataTest[0].registration_rules.replace(/\n/g, '<br/>'),
                text_color: '#000000',
                text_size: '14',
                background_color: '',
                isBold: false,
                alignment: '',
                linkify: false,
            },
            layout_config: {
                margin_top: 23,
                margin_left: 19,
                margin_right: 16,
                margin_bottom: 0,
            },
        },
        {
            type: 'widget_button_border',
            data: {
                text_one: locale === 'hi' ? 'रजिस्टर करें' : 'Register Now',
                text_one_size: '16',
                text_one_color: '#ffffff',
                bg_color: '#ea532c',
                bg_stroke_color: '#ea532c',
                assortment_id: '',
                deep_link: '',
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '36',
                register_test_btn: true,
                test_id: +testId,
            },
            layout_config: {
                margin_top: 25,
                margin_left: 28,
                margin_right: 28,
                margin_bottom: 24,
            },
        }],
    };
    if (dataTest[0].type.includes('NKC')) {
        data.widgets[2].data.text_one = 'Register Now';
    }
    return data;
}

async function startWidget(db, testId, locale) {
    let dataTest = await CourseContainerv2.getScholarshipExams(db);
    dataTest = dataTest.filter((item) => item.test_id === +testId);
    const rules = await CourseMysqlv2.getScholarshipRules(db.mysql.read, testId);
    const startFaq = `${rules[0].rule_text.replace(/#!#/g, '<br/><br/>•').replace(/\n/g, '')}`;
    const time = moment(dataTest[0].publish_time).subtract(5, 'hours').subtract(30, 'minutes').format();
    const testStart2 = moment(dataTest[0].publish_time).format('h:mm A, Do MMM');
    let change = false;
    let startText = locale === 'hi' ? `टेस्ट शुरू करें (${testStart2})` : `Start Test (${testStart2})`;
    if (dataTest[0].type.includes('NKC')) {
        startText = `Start Test (${testStart2})`;
    }
    if (moment().isAfter(time)) {
        change = true;
        startText = locale === 'hi' ? 'टेस्ट शुरू करें' : 'Start Test';
        if (dataTest[0].type.includes('NKC')) {
            startText = 'Start Test';
        }
    }
    const data = {
        start_time_in_millis: moment(time).diff(moment()),
        show_close_btn: true,
        test_id: +testId,
        scholarship_test_id: dataTest[0].type,
        widgets: [{
            type: 'text_widget',
            data: {
                title: dataTest[0].test_name.replace(/\n/g, ' '),
                text_color: '#541388',
                text_size: '32',
                background_color: '#ffffff',
                isBold: true,
                alignment: '',
                linkify: false,
            },
            layout_config: {
                margin_top: 20,
                margin_left: 19,
                margin_right: 32,
                margin_bottom: 0,
            },
        },
        {
            type: 'text_widget',
            data: {
                html_title: startFaq,
                text_color: '#000000',
                text_size: '14',
                background_color: '',
                isBold: false,
                alignment: '',
                linkify: false,
            },
            layout_config: {
                margin_top: 23,
                margin_left: 19,
                margin_right: 16,
                margin_bottom: 0,
            },
        },
        {
            type: 'widget_button_border',
            data: {
                text_one: startText,
                text_one_size: '16',
                text_one_color: '#ffffff',
                bg_color: change ? '#ea532c' : '#c5c1c1',
                bg_stroke_color: change ? '#ea532c' : '#c5c1c1',
                assortment_id: '',
                deep_link: change ? `doubtnutapp://mock_test_subscribe?id=${dataTest[0].test_id}` : '',
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '36',
            },
            layout_config: {
                margin_top: 9,
                margin_left: 41,
                margin_right: 41,
                margin_bottom: 22,
            },
        }],
    };
    if (moment().isBefore(time)) {
        const item = {
            type: 'text_widget',
            data: {
                title: '',
                html_title: locale === 'hi' ? 'आपकी परीक्षा शुरू होगी <big><b>__placeholder__m:s__ मिनट में</b></big>' : 'The test will start in <big><b>__placeholder__m:s__ Min</b></big>',
                text_color: '#000000',
                text_size: '14',
                background_color: '',
                isBold: 'false',
                alignment: 'center',
                start_time_in_millis: moment(time).diff(moment()),
            },
            layout_config: {
                margin_top: 18,
                margin_left: 16,
                margin_right: 16,
                margin_bottom: 0,
            },
        };
        if (dataTest[0].type.includes('NKC')) {
            item.data.html_title = 'The test will start in <big><b>__placeholder__m:s__ Min</b></big>';
        }
        data.widgets.splice(2, 0, item);
    }
    if (!change) {
        data.widgets[3].data.ripple = '#00000000';
    }
    return data;
}

module.exports = {
    registerWidget,
    startWidget,
};
