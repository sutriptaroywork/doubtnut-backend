/* eslint-disable prefer-const */
const moment = require('moment');
const { pznLanguagesToLocaleMapping } = require('../../../data/data');
const boardData = require('../../../data/data');
const Data = require('../../../data/data');
const pzn = require('../../../modules/containers/pzn');
const courseHelper = require('../../v6/course/course.helper');
const CourseMysqlV2 = require('../../../modules/mysql/coursev2');
const StudentHelper = require('../../../modules/containers/student');
const CourseHelper = require('../../helpers/course');
const CourseContainerv2 = require('../../../modules/containers/coursev2');

function getProgressWidget(progress, locale) {
    const widget = {
        type: 'widget_progress',
        data: {
            title_text_size: '12',
            title_text_color: '#272727',
            highlight_color: '#56bd5b',
            items: [{
                title: locale === 'hi' ? 'रजिस्टर' : 'Register',
                is_selected: false,
            },
            {
                title: locale === 'hi' ? 'लाइव टेस्ट दें' : 'Take live Test',
                is_selected: false,
            },
            {
                title: locale === 'hi' ? 'स्कॉलरशिप जीतें' : 'Win Scholarship',
                is_selected: false,
            }],
        },
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
            margin_bottom: 0,
        },
    };
    for (let i = 0; i < widget.data.items.length; i++) {
        if (i < (progress - 1)) {
            widget.data.items[i].is_selected = true;
        }
    }
    return widget;
}

function getTileData(studentId, filterdTest, locale, bgColor) {
    return {
        bg_color: bgColor,
        deeplink: `doubtnutapp://dialog_widget?widget_type=widget_scholarship_test&show_close_btn=true&student_id=${studentId}&test_id=${filterdTest.test_id}`,
        test_id: filterdTest.test_id,
        divider_bg_color: '#ff006e',
        title1: filterdTest.test_name.replace(/\n/g, ' '),
        title1_text_color: '#541388',
        title1_text_size: '22',
        title2: filterdTest.test_time,
        title2_text_color: '#ff006e',
        title2_text_size: '16',
        title3: filterdTest.test_date,
        title3_text_color: '#541388',
        title3_text_size: '16',
        action_text: locale === 'hi' ? 'रजिस्टर करें' : 'Register Now',
        action_text_color: '#ff0202',
        action_text_size: '14',
        action_deep_link: `doubtnutapp://dialog_widget?widget_type=widget_scholarship_test&show_close_btn=true&student_id=${studentId}&test_id=${filterdTest.test_id}`,
    };
}

function getTestDetails(studentId, filterdTest, locale) {
    const timeEnd = moment.duration('05:30:00');
    const start = moment(filterdTest[0].publish_time).subtract(timeEnd).format();
    let colorChange = false;
    let registrationText;
    if (moment().isAfter(start)) {
        registrationText = locale === 'hi' ? 'रजिस्ट्रेशन बंद ।\n रजिस्टर कर परीक्षा दे और पाएं 10% की स्कॉलरशिप' : 'Registration closed.\n Register kar test de aur paaye 10% ki scholarship';
        colorChange = true;
    } else {
        registrationText = locale === 'hi' ? 'रजिस्टर करने के लिए अपना टेस्ट चुने' : 'Select your test to register';
    }
    const item = [];
    const bgArray = ['#aae5bb', '#aae0e5', '#e5e4aa', '#e5caaa'];
    for (const value of filterdTest) {
        if (item.some((el) => el.title === value.tile_tab)) {
            const index = item.map((e) => e.title).indexOf(value.tile_tab);
            const number = item[index].items.length;
            const color = number % 6;
            let bgIndex;
            if (color === 1 || color === 3) bgIndex = 0;
            if (color === 2 || color === 4) bgIndex = 1;
            if (color === 5) bgIndex = 2;
            if (color === 0) bgIndex = 3;
            const data = getTileData(studentId, value, locale, bgArray[bgIndex]);
            item[index].items.push(data);
        } else {
            const data = getTileData(studentId, value, locale, bgArray[0]);
            item.push({
                title: value.tile_tab,
                items: [data],
            });
        }
    }
    item[0].is_selected = true;
    const widget = {
        type: 'widget_register_test',
        data: {
            title: registrationText,
            title_text_size: '16',
            title_text_color: colorChange ? '#ff0000' : '#272727',
            items: item,
        },
        layout_config: {
            margin_top: 15,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };
    return widget;
}

function getReferralWidget(filterdTest, locale) {
    const shareBranchLink = filterdTest[0].share_branchlink;
    let shareLink;
    const shareMessageObj = {
        locale,
        shareLink: shareBranchLink,
        testDate: filterdTest[0].test_date,
    };
    if (filterdTest[0].type.includes('DNST')) {
        shareLink = boardData.scholarshipShareMessage(shareMessageObj).DNST;
    } else {
        shareLink = boardData.scholarshipShareMessage(shareMessageObj).OTHER;
    }
    // overriding share message for NKC tests
    let title = locale === 'hi' ? 'अपने दोस्तों को भी बनाए इस स्कॉलरशिप टेस्ट का हिस्सा ।' : 'Apne dosto ko bhi banaiyae iss scholarship test ka hissa';
    if (filterdTest[0].type.includes('NKC')) {
        shareLink = boardData.scholarshipShareMessage(shareMessageObj).NKC;
        title = 'Invite your friends and also make them part of this Scholarship Test';
    }
    return {
        type: 'widget_referral',
        data: {
            deeplink: '',
            bg_color: '',
            image_url: boardData.scholarshipReferralFriends,
            title,
            title_text_color: '#272727',
            title_text_size: '18',
            action_one_text: locale === 'hi' ? 'इनवाइट' : 'INVITE',
            action_one_text_size: '16',
            action_one_text_color: '#ffffff',
            action_one_icon: boardData.scholarshipReferralWhatsapp,
            action_one_icon_gravity: '2',
            action_one_icon_size: '18',
            action_one_icon_color: '',
            action_one_bg_color: '#00dc0c',
            action_one_deeplink: '',
            action_one_share_data: {
                shareable_message: shareLink,
                control_params: {},
                feature_name: '',
                channel: '',
                campaign_id: '',
                package_name: 'com.whatsapp',
                share_image: locale === 'hi' ? filterdTest[0].video_thumbnail.split('||')[0] : filterdTest[0].video_thumbnail.split('||')[1],
                skip_branch: true,
                app_name: locale === 'hi' ? 'व्हाट्सएप' : 'Whatsapp',
            },
            action_two_text: locale === 'hi' ? 'इनवाइट' : 'INVITE',
            action_two_text_size: '16',
            action_two_text_color: '#ffffff',
            action_two_icon: boardData.scholarshipReferralTelegram,
            action_two_icon_gravity: '2',
            action_two_icon_size: '18',
            action_two_icon_color: '',
            action_two_bg_color: '#00b8fc',
            action_two_deeplink: '',
            action_two_share_data: {
                shareable_message: shareLink,
                control_params: {},
                feature_name: '',
                channel: '',
                campaign_id: '',
                package_name: 'org.telegram.messenger',
                share_image: locale === 'hi' ? filterdTest[0].video_thumbnail.split('||')[0] : filterdTest[0].video_thumbnail.split('||')[1],
                skip_branch: true,
                app_name: locale === 'hi' ? 'टेलीग्राम' : 'Telegram',
            },
        },
        layout_config: {
            margin_top: 24,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };
}

function getTextWidget(filterdTest, locale, progress, heading, mobile) {
    let text;
    let color;
    let align = 'center';
    let size = '13';
    let top = 12;
    let left = 24;
    let right = 24;
    if (progress === 2) {
        const timeEnd = moment.duration('05:30:00');
        const endtime = moment(filterdTest[0].unpublish_time).subtract(timeEnd).format();
        if (moment().isAfter(endtime)) {
            text = locale === 'hi' ? 'टेस्ट दें और पाएं 5% की स्कॉलरशिप' : 'Test de aur paaye 5% ki scholarship';
        } else if (filterdTest[0].type.includes('NKC')) {
            text = 'You have successfully registered for Target JEE 2023 Scholarship Test';
        } else {
            text = locale === 'hi' ? `आप ${filterdTest[0].test_name.replace(/\n/g, ' ')} परीक्षा के लिए सफलतापूर्वक रजिस्टर है ।` : `Aap ${filterdTest[0].test_name.replace(/\n/g, ' ')} Scholarship Test ke liye successfully register hai`;
        }
        color = '#2c9031';
    } else if (progress === 3 && heading === 'popular') {
        text = (locale === 'hi') ? 'आपके लिए उत्तम कोर्स के सुझाव' : 'Best recommended courses for you';
        color = '#272727';
        align = '';
        size = '16';
        top = 20;
    } else if (progress === 3) {
        if (filterdTest[0].type.includes('NKC')) {
            text = 'You have successfully completed Target JEE 2023 Scholarship Test';
        } else {
            text = locale === 'hi' ? `आपने ${filterdTest[0].test_name.replace(/\n/g, ' ')} स्कॉलरशिप परीक्षा सफलतापूर्वक पूरी की ।` : `Aapne ${filterdTest[0].test_name.replace(/\n/g, ' ')} Scholarship Test successfully complete kiya !`;
        }
        color = '#541388';
        top = 16;
        left = 16;
        right = 16;
    } else if (progress === 4) {
        if (heading === 'date') {
            const date = moment(filterdTest[0].result_time).format('Do MMMM, YYYY');
            text = locale === 'hi' ? `परीक्षा की तारीख :- ${date}` : `Test Date:- ${date}`;
        }
        if (heading === 'number') {
            const sli = mobile.slice(0, 6);
            const phone = mobile.replace(sli, 'xxxxxx');
            text = locale === 'hi' ? `पंजीकृत फ़ोन नंबर :- ${phone} \n कृपया अपना अद्यतन परिणाम नीचे देखें` : `Registered mobile number:- ${phone} \nPlease check your updated result below`;
        }
    }
    return {
        type: 'text_widget',
        data: {
            title: text,
            text_color: color,
            text_size: size,
            background_color: '',
            isBold: true,
            alignment: align,
            linkify: false,
        },
        layout_config: {
            margin_top: top,
            margin_left: left,
            margin_right: right,
            margin_bottom: 0,
        },
    };
}

function getProgressCardWidget(filterdTest, locale, progress, studentId) {
    const time = moment.duration('05:45:00');
    const timeEnd = moment.duration('05:30:00');
    if (progress === 2) {
        let deeplink = '';
        const startTime = moment(filterdTest[0].publish_time).subtract(timeEnd).format();
        const endtime = moment(filterdTest[0].unpublish_time).subtract(timeEnd).format();
        const start = moment(filterdTest[0].publish_time).subtract(time).format();
        let changeTest = false;
        let canStartTest = true;
        let testStartText = locale === 'hi' ? 'टेस्ट अभी लाइव है' : 'Test is live now';
        const buttonText = locale === 'hi' ? 'टेस्ट शुरू करें' : 'Start Test';
        let changeText = '';
        if (moment().isAfter(endtime)) {
            deeplink = `doubtnutapp://mock_test_subscribe?id=${filterdTest[0].test_id}`;
        } else if (moment().isAfter(startTime) && moment().isBefore(endtime)) {
            deeplink = `doubtnutapp://mock_test_subscribe?id=${filterdTest[0].test_id}`;
        } else if (moment().isAfter(start) && moment().isBefore(startTime)) {
            deeplink = `doubtnutapp://dialog_widget?widget_type=widget_scholarship_start_test&show_close_btn=true&student_id=${studentId}&test_id=${filterdTest[0].test_id}&source=SCHOLARSHIP_PAGE`;
        } else {
            canStartTest = false;
            changeTest = true;
            testStartText = locale === 'hi' ? 'आपकी परीक्षा शुरू होगी' : 'Aapka test start hoga';
            if (filterdTest[0].type.includes('NKC')) {
                testStartText = 'Test will start in';
            }
            changeText = locale === 'hi' ? 'टेस्ट बदलें' : 'Change test';
        }
        let reload = start;
        if (moment().isAfter(start)) {
            reload = startTime;
        }
        return {
            type: 'widget_scholarship_progress_card',
            data: {
                bg_color: '#aae5bb',
                deeplink: '',
                title: filterdTest[0].test_name.replace(/\n/g, ' '),
                title_text_color: '#541388',
                title_text_size: '20',
                show_divider: !canStartTest,
                divider_color: '#ff006e',
                title2: testStartText,
                title2_text_color: '#541388',
                title2_text_size: '14',
                title3: changeText,
                title3_text_color: '#ffffff',
                title3_text_size: '10',
                change_test: changeTest,
                start_time_in_millis: moment(reload).diff(moment()),
                title4: (moment().isAfter(start)) ? buttonText : '',
                title4_text_color: '#ffffff',
                title4_text_size: '19',
                title4_text_bg_color: '#ea532c',
                title4_text_deeplink: deeplink,
                linkify: false,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
                margin_right: 16,
                margin_bottom: 1,
            },
        };
    }
    if (progress === 3) {
        const testStartText = locale === 'hi' ? 'परिणाम घोषित होगा' : 'Results will be declared in';
        const resultTime = moment(filterdTest[0].result_time).subtract(timeEnd).format();
        return {
            type: 'widget_scholarship_progress_card',
            data: {
                bg_color: '#aae5bb',
                deeplink: '',
                title: filterdTest[0].test_name.replace(/\n/g, ' '),
                title_text_color: '#541388',
                title_text_size: '20',
                show_divider: true,
                divider_color: '#ff006e',
                title2: testStartText,
                title2_text_color: '#541388',
                title2_text_size: '14',
                title3: '',
                title3_text_color: '#ffffff',
                title3_text_size: '10',
                change_test: false,
                start_time_in_millis: moment(resultTime).diff(moment()),
                title4: '',
                title4_text_color: '',
                title4_text_size: '',
                title4_text_bg_color: '',
                title4_text_deeplink: '',
                linkify: false,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 16,
                margin_right: 16,
                margin_bottom: 1,
            },
        };
    }
}

function getPracticeWidget(filterdTest, locale) {
    const timeEnd = moment.duration('05:30:00');
    const endtime = moment(filterdTest[0].unpublish_time).subtract(timeEnd).format();
    let practiceList = [];
    let practiceResourceList = [];
    if (filterdTest && filterdTest[0] && filterdTest[0].resources_titles) {
        practiceList = filterdTest[0].resources_titles.split('||');
        practiceResourceList = filterdTest[0].resources_deeplink.split('||');
    }
    const practiceResources = [];
    const diff = moment(endtime).diff(moment(), 'days');
    let today;
    let incr = 1;
    for (let i = 0; i < practiceList.length; i++) {
        if ((i !== 0)) {
            if (i > practiceList.length - diff - 1) {
                today = moment().add(1 * incr, 'days').format('LL');
                incr += 1;
            }
        }
        practiceResources.push({
            bg_color: '',
            deeplink: today ? '' : practiceResourceList[i],
            title1: practiceList[i],
            title1_text_color: '#541388',
            title1_text_size: '21',
            title2: today ? `Available on ${today}` : 'Opened',
            title2_text_color: '#333333',
            title2_text_size: '11',
            icon: today ? boardData.scholarshipPracticeLocked : boardData.scholarshipPracticeUnlocked,
        });
    }
    if (practiceResources && practiceResources[0]) {
        const bgArray = ['#aae0e5', '#e5e4aa', '#e5caaa'];
        for (let i = 0; i < practiceResources.length; i++) {
            const index = i % 3;
            practiceResources[i].bg_color = bgArray[index];
        }
        return {
            type: 'widget_practice_test',
            data: {
                title: locale === 'hi' ? 'अभ्यास परीक्षण' : 'Practice Test',
                title_text_size: '18',
                title_text_color: '#272727',
                bg_color: '',
                items: practiceResources,
            },
            layout_config: {
                margin_top: 16,
                margin_left: 16,
                margin_right: 16,
                margin_bottom: 0,
            },
        };
    }
    return [];
}

function getViewAllBranchLink(coupon) {
    if (coupon[0].coupon_code === null || coupon[0].coupon_code === '') {
        const deeplink = 'doubtnutapp://course_explore?id=0';
        return deeplink;
    }
    const id = 'Apke liye Courses';
    let filter;
    if (coupon[0].coupon_code.includes('C6')) {
        filter = `6,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C7')) {
        filter = `7,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C8')) {
        filter = `8,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C9')) {
        filter = `9,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C10')) {
        filter = `10,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C11')) {
        filter = `11,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C12B')) {
        filter = `12,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('C12M')) {
        filter = `12,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('I22')) {
        filter = `IIT JEE_CT,12,2022,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('I23')) {
        filter = `IIT JEE_CT,11,2023,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('N22')) {
        filter = `NEET_CT,12,2022,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('N23')) {
        filter = `NEET_CT,11,2023,$$${coupon[0].coupon_code}`;
    } else if (coupon[0].coupon_code.includes('NDA')) {
        filter = `DEFENCE/NDA/NAVY_CT,12,$$${coupon[0].coupon_code}`;
    }
    const deeplink = `doubtnutapp://course_category?title=${id}&filters=${filter}`;
    return deeplink;
}

function getButtonWidget(filterdTest, locale, progress, studentResult, studentId) {
    const time = moment.duration('05:45:00');
    const timeEnd = moment.duration('05:30:00');
    const startTime = moment(filterdTest[0].publish_time).subtract(timeEnd).format();
    const endtime = moment(filterdTest[0].unpublish_time).subtract(timeEnd).format();
    if (progress === 2) {
        const timeText = moment(filterdTest[0].publish_time).subtract(15, 'minutes').format("h:mm A, Do MMM'YY");
        let deeplink = '';
        let buttonText = locale === 'hi' ? 'टेस्ट शुरू करें' : 'Start Test';
        let color = '#ea532c';
        if (moment().isAfter(endtime)) {
            deeplink = `doubtnutapp://mock_test_subscribe?id=${filterdTest[0].test_id}`;
        } else {
            const start = moment(filterdTest[0].publish_time).subtract(time).format();
            if (moment().isAfter(startTime) && moment().isBefore(endtime)) {
                deeplink = `doubtnutapp://mock_test_subscribe?id=${filterdTest[0].test_id}`;
            } else if (moment().isAfter(start) && moment().isBefore(startTime)) {
                deeplink = `doubtnutapp://dialog_widget?widget_type=widget_scholarship_start_test&show_close_btn=true&student_id=${studentId}&test_id=${filterdTest[0].test_id}`;
            } else {
                buttonText = locale === 'hi' ? `टेस्ट शुरू करें (${timeText})` : `Start Test (${timeText})`;
                color = '#c5c1c1';
            }
        }
        const wid = {
            type: 'widget_button_border',
            data: {
                text_one: buttonText,
                text_one_size: '20',
                text_one_color: '#ffffff',
                bg_color: color,
                bg_stroke_color: color,
                assortment_id: '',
                deep_link: deeplink,
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '49',
            },
            layout_config: {
                margin_top: 0,
                margin_left: 0,
                margin_right: 0,
                margin_bottom: 0,
            },
        };
        if (color === '#c5c1c1') {
            wid.data.ripple = '#00000000';
        }
        return wid;
    }
    if (progress === 3) {
        if (moment().isAfter(endtime) && filterdTest[0].solution_deeplink !== null) {
            const buttonText = locale === 'hi' ? 'उत्तर देखें' : 'View Answer Key';
            return {
                type: 'widget_button_border',
                data: {
                    text_one: buttonText,
                    text_one_size: '14',
                    text_one_color: '#ffffff',
                    bg_color: '#ea532c',
                    bg_stroke_color: '#ea532c',
                    assortment_id: '',
                    deep_link: filterdTest[0].solution_deeplink,
                    corner_radius: '4.0',
                    elevation: '4.0',
                    min_height: '36',
                    icon: '',
                    icon_size: '',
                    icon_gravity: '',
                    icon_color: '',
                },
                layout_config: {
                    margin_top: 16,
                    margin_left: 12,
                    margin_right: 16,
                    margin_bottom: 0,
                },
            };
        }
        return [];
    }
    if (progress === 4) {
        const deeplink = getViewAllBranchLink(studentResult);
        const buttonText = locale === 'hi' ? 'सभी कोर्स देखें' : 'View All Courses';
        return {
            type: 'widget_button_border',
            data: {
                text_one: buttonText,
                text_one_size: '20',
                text_one_color: '#ffffff',
                bg_color: '#ea532c',
                bg_stroke_color: '#ea532c',
                assortment_id: '',
                deep_link: deeplink,
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '49',
            },
            layout_config: {
                margin_top: 0,
                margin_left: 0,
                margin_right: 0,
                margin_bottom: 0,
            },
        };
    }
}

function getPopularCoursesWidget(popularCourses, filterdTest) {
    const item = [];
    for (const value of popularCourses) {
        value.data.set_width = false;
        value.extra_params.test_id = filterdTest[0].test_id;
        value.extra_params.scholarship_test_id = filterdTest[0].type;
        value.layout_config = {
            margin_top: 12,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        };
        if (item.some((el) => el.title === value.tab)) {
            const index = item.map((e) => e.title).indexOf(value.tab);
            item[index].widgets.push(value);
        } else {
            item.push({
                title: value.tab,
                widgets: [value],
            });
        }
    }
    if (item && item[0] && item[0].widgets && item[0].widgets.length) {
        item[0].is_selected = true;
        const widget = {
            type: 'widget_scholarship_tabs',
            data: {
                items: item,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 0,
                margin_right: 0,
                margin_bottom: 0,
            },
        };
        return widget;
    }
    return [];
}

async function getFreeClassCarouselWidget(db, filteredTest, studentClass, studentId, locale, studentLocale, versionCode, subjectWise) {
    const lang = locale === 'hi' ? ['HINDI'] : ['ENGLISH'];
    // let subjectList = await pzn.getSubjectListByTotalEt(studentId, moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'), moment().format('YYYY-MM-DD HH:mm:ss'));
    let subjectList = studentClass >= 6 && studentClass <= 10 ? ['SCIENCE'] : ['PHYSICS', 'CHEMISTRY'];
    let { subject } = filteredTest[0];
    let [exam, mathBio] = subject.split('_');
    if (studentClass >= 11) {
        if (exam == 'IIT JEE') {
            exam = 'IIT';
            mathBio = 'MATHS';
        }
        if (exam == 'NEET') {
            mathBio = 'BIOLOGY';
        }
        if (exam == 'BOARDS' && !mathBio) {
            subjectList.push('BIOLOGY');
            mathBio = 'MATHS';
        }
    }
    if (!mathBio) {
        mathBio = 'MATHS';
    }
    subjectList.push(mathBio);
    const freeClassQids = await pzn.getQuestionByMaxEngageTime({
        class: +studentClass, subjects: subjectList, languages: lang, start_date: moment().subtract(7, 'days').format('YYYY-MM-DD HH:mm:ss'), end_date: moment().format('YYYY-MM-DD HH:mm:ss'), target_group: exam, resource_types: ['1', '4', '8'],
    });
    const promise = [];
    for (let i = 0; i < freeClassQids.length; i++) {
        promise.push(CourseContainerv2.getAssortmentsByResourceReferenceV1(db, freeClassQids[i]));
    }
    let freeClassData = await Promise.all(promise);
    freeClassData = CourseHelper.bottomSheetDataFormat(freeClassQids, freeClassData, 0);
    let widgetData = [];
    let widget;

    if (subjectWise && freeClassData.widget_data.items.length) {
        freeClassData.widget_data.title = studentLocale === 'hi' ? '100% स्कॉलरशिप जीतने की तैयारी करें' : 'Prepare to win 100% scholarship';
        const widgetTabs = {};
        delete freeClassData.widget_data.items[0].group_id;
        freeClassData.widget_data.items[0].data.page = 'SCHOLARSHIP_TEST_COD';
        widget = {
            type: 'widget_autoplay',
            widget_data: {
                title: studentLocale === 'hi' ? 'आज की क्लास' : 'Class of the Day', ...Data.freeLiveClassTab.widget_autoplay.widget_extra_data, items: [freeClassData.widget_data.items[0]], page: 'SCHOLARSHIP_TEST_COD',
            },
            divider_config: Data.freeLiveClassTab.widget_autoplay.divider_config,
            layout_config: {
                margin_top: 30,
            },
        };
        widget.widget_data.bg_color = '#ffffff';
        freeClassData.widget_data.items.splice(0, 1);
        for (let i = 0; i < freeClassData.widget_data.items.length; i++) {
            freeClassData.widget_data.items[i].data.subject = locale === 'hi' ? Data.freeLiveClassTab.localisedData[freeClassData.widget_data.items[i].data.subject.toLowerCase()] : freeClassData.widget_data.items[i].data.subject;
            freeClassData.widget_data.items[i].data.page = 'SCHOLARSHIP_TEST';
            freeClassData.widget_data.items[i].data.views = locale === 'hi' ? `${freeClassData.widget_data.items[i].data.bottom_layout.sub_title_replace} स्टूडेंट्स ने देखा` : `${freeClassData.widget_data.items[i].data.bottom_layout.sub_title_replace} students watched`;
            if (+versionCode <= 971) {
                freeClassData.widget_data.items[i].data.views = null;
                freeClassData.widget_data.items[i].data.bottom_layout.title = freeClassData.widget_data.items[i].data.bottom_layout.title_replace || '';
                freeClassData.widget_data.items[i].data.bottom_layout.sub_title = locale === 'hi' ? `${freeClassData.widget_data.items[i].data.bottom_layout.sub_title_replace} स्टूडेंट्स ने देखा` : `${freeClassData.widget_data.items[i].data.bottom_layout.sub_title_replace} students watched`;
            }
        }
        freeClassData.widget_data.tabs.forEach((x) => {
            widgetTabs[x.key] = x;
        });
        const finalTabs = [];
        for (let i = 0; i < subjectList.length; i++) {
            if (widgetTabs[subjectList[i].toLowerCase()]) {
                finalTabs.push({
                    key: widgetTabs[subjectList[i].toLowerCase()].key,
                    title: locale === 'hi' ? Data.freeLiveClassTab.localisedData[subjectList[i].toLowerCase()] : widgetTabs[subjectList[i].toLowerCase()].title,
                    is_selected: false,
                });
            }
        }
        finalTabs[0].is_selected = true;
        freeClassData.widget_data.tabs = finalTabs;
        freeClassData.extra_params = { source: 'SCHOLARSHIP_TEST' };
        return [widget, freeClassData];
    }
    const items = [];
    for (let i = 0; i < freeClassData.widget_data.items.length; i++) {
        const item = {};
        item.type = freeClassData.widget_data.items[i].type;
        item.data = freeClassData.widget_data.items[i].data;
        item.data.page = 'SCHOLARSHIP_TEST';
        items.push(item);
    }
    items[0].data.page = 'SCHOLARSHIP_TEST_COD';
    freeClassData.widget_data.items = items;
    await courseHelper.addViewLikeDuration(db, freeClassData);
    freeClassData.widget_data.items.sort((a, b) => subjectList.indexOf(a.subject) - subjectList.indexOf(b.subject));
    widget = {
        type: 'widget_autoplay',
        widget_data: {
            title: studentLocale === 'hi' ? 'आज की क्लास' : 'Class of the Day', ...Data.freeLiveClassTab.widget_autoplay.widget_extra_data, items: [freeClassData.widget_data.items[0]], page: 'SCHOLARSHIP_TEST_COD',
        },
        divider_config: Data.freeLiveClassTab.widget_autoplay.divider_config,
        layout_config: {
            margin_top: 30,
        },
    };
    widget.widget_data.bg_color = '#ffffff';
    widgetData.push(widget);

    if (freeClassData.widget_data.items.length > 1) {
        widget = {
            type: 'widget_autoplay',
            widget_data: {
                title: studentLocale === 'hi' ? '100% स्कॉलरशिप जीतने की तैयारी करें' : 'Prepare to win 100% scholarship', ...Data.freeLiveClassTab.widget_autoplay.widget_extra_data, items: freeClassData.widget_data.items.slice(1, freeClassData.length), page: 'SCHOLARSHIP_TEST',
            },
            divider_config: Data.freeLiveClassTab.widget_autoplay.divider_config,
            layout_config: {
                margin_top: 30,
            },
        };
        widget.widget_data.bg_color = '#ffffff';
        widgetData.push(widget);
    }
    return widgetData;
}

function getReportCardWidget(filterdTest, reportCardData, locale, isCompleted) {
    let actionButton;
    if (isCompleted) {
        actionButton = (locale === 'hi') ? 'उत्तर देखें' : 'View Answer Key';
    } else {
        actionButton = (locale === 'hi') ? 'टेस्ट शुरू करें' : 'Start Test';
    }
    const sectionHeading = locale === 'hi' ? ['सही', 'गलत', 'छोड़े गए', 'अंक'] : ['Correct', 'Incorrect', 'Skipped', 'Score'];
    const item = [[
        '',
        sectionHeading[0],
        sectionHeading[1],
        sectionHeading[2],
        sectionHeading[3],
    ]];
    for (let i = 0; i < reportCardData.sections.length; i++) {
        item.push([
            reportCardData.sections[i].description,
            reportCardData.sections[i].correct,
            reportCardData.sections[i].incorrect,
            reportCardData.sections[i].skipped,
            reportCardData.sections[i].marks_scored,
        ]);
    }
    return {
        type: 'widget_report_card',
        data: {
            title1: (locale === 'hi') ? 'आपका परिणाम' : 'Your Result',
            title1_text_size: '12',
            title1_text_color: '#626262',
            title2: actionButton,
            title2_text_color: '#ea532c',
            title2_text_size: '12',
            title2_deeplink: isCompleted ? filterdTest[0].solution_deeplink : `doubtnutapp://mock_test_subscribe?id=${filterdTest[0].test_id}`,
            items_colors: ['#515152', '#56bd5b', '#e34c4c', '#515152', '#515152'],
            items: item,
            footer_bg_color: '#ea532c',
            footer_title1: `${reportCardData.eligibleSection[0].time_heading}${reportCardData.eligibleSection[0].time}`,
            footer_title1_text_color: '#ffffff',
            footer_title1_text_size: '12',
            footer_title2: `${reportCardData.eligibleSection[0].score_heading}${reportCardData.eligibleSection[0].score}`,
            footer_title2_text_color: '#ffffff',
            footer_title2_text_size: '12',
        },
        layout_config: {
            margin_top: 12,
            margin_left: 16,
            margin_right: 16,
            margin_bottom: 0,
        },
    };
}

function getLeaderboardWidget(leaderboardData) {
    const item1 = [];
    const item2 = [];
    for (let i = 0; i < leaderboardData.length; i++) {
        if (i < 3) {
            item1.push({
                rank: leaderboardData[i].rank,
                image: leaderboardData[i].image,
                name: leaderboardData[i].name,
                marks: leaderboardData[i].marks,
                student_id: leaderboardData[i].studentId,
                icon: boardData.leaderboardImage,
                profile_deeplink: '',
                elevation: 3,
            });
            if (i === 0) {
                item1[0].show_footer_divider = true;
            }
        } else {
            item2.push({
                type: 'widget_leaderboard',
                data: {
                    item: {
                        padding_start: 20,
                        padding_end: 0,
                        rank: leaderboardData[i].rank,
                        image: leaderboardData[i].image,
                        name: leaderboardData[i].name,
                        marks: leaderboardData[i].marks,
                        student_id: leaderboardData[i].studentId,
                        icon: boardData.leaderboardImage,
                        profile_deeplink: '',
                        elevation: 3,
                    },
                },
                layout_config: {
                    margin_top: 8,
                    margin_left: 14,
                    margin_right: 14,
                    margin_bottom: 0,
                },
            });
        }
    }
    const widget1 = {
        type: 'widget_leaderboard_top_three',
        data: {
            items: item1,
        },
    };
    return [widget1, item2];
}

function getBottomDataWidget(leaderboardData, studentId) {
    if (leaderboardData && leaderboardData[0]) {
        return {
            background: '#541488',
            peek_height: 80,
            widgets: [{
                type: 'widget_leaderboard',
                data: {
                    bg_color: '#00000000',
                    bg_stroke_color: '#00000000',
                    item: {
                        padding_top: 0,
                        padding_bottom: 0,
                        rank: leaderboardData[0].rank,
                        rank_text_color: '#ffffff',
                        rank_text_size: '19',
                        image: leaderboardData[0].image,
                        image_size: '40',
                        name: leaderboardData[0].name,
                        name_text_size: '14',
                        name_text_color: '#ffffff',
                        name_text_bold: false,
                        marks: leaderboardData[0].marks.split('||')[0],
                        marks_text_color: '#ffffff',
                        marks_text_size: '14',
                        student_id: studentId,
                        text_footer_end: leaderboardData[0].marks.split('||')[1],
                        text_footer_end_color: '#ffffff',
                        text_footer_end_size: '8',
                        icon: leaderboardData[0].marks.split('||')[1] ? '' : boardData.leaderboardImage,
                    },
                },
                layout_config: {
                    margin_top: 14,
                    margin_left: 20,
                    margin_right: 12,
                    margin_bottom: 14,
                },
            }],
        };
    }
    return [];
}

function getFaqFinalWidget(faqWidget) {
    faqWidget.data.bg_color = '#ddeaff';
    faqWidget.layout_config = {
        margin_top: 24,
        margin_left: 0,
        margin_right: 0,
        margin_bottom: 0,
    };
    faqWidget.data.bottom_text = '';
    faqWidget.data.see_more_text = '';
    return faqWidget;
}

module.exports = {
    getProgressWidget,
    getTestDetails,
    getReferralWidget,
    getTextWidget,
    getProgressCardWidget,
    getPracticeWidget,
    getButtonWidget,
    getPopularCoursesWidget,
    getReportCardWidget,
    getLeaderboardWidget,
    getBottomDataWidget,
    getFaqFinalWidget,
    getFreeClassCarouselWidget,
};
