const moment = require('moment');
const _ = require('lodash');
const PaidUserChampionshipData = require('./paidUserChampionship.data');
const PaidUserChampionshipMysql = require('../../../modules/mysql/paidUserChampionship');
const PaidUserChampionshipRedis = require('../../../modules/redis/paidUserChampionship');
const PaidUserChampionshipHelper = require('../../helpers/paidUserChamionship');

const StudentContainer = require('../../../modules/containers/student');
const { getAssortmentIdParams } = require('../../../modules/containers/paidUserChampionship');
const CourseHelper = require('../../helpers/course');
const { getProgressWidget, calculatePaidUserChampionshipLeaderBoardScore } = require('../../helpers/paidUserChamionship');

function getTabDetails(has, isAnnual, locale) {
    const items = [];
    if (has[1]) {
        items.push({
            id: 1,
            title: locale === 'hi' ? 'साप्ताहिक' : 'Weekly',
        });
    }
    if (has[2]) {
        items.push({
            id: 2,
            title: locale === 'hi' ? 'महीने के' : 'Monthly',
        });
    }
    if (isAnnual && has[3]) {
        items.push({
            id: 3,
            title: locale === 'hi' ? 'साल के' : 'Anually',
        });
    }

    const widget = {
        type: 'widget_leaderboard_tabDetails',
        is_sticky: true,
        data: {
            margin: false,
            background: '#ffffff',
            elevation: '4',
            style: 1,
            items,
        },
        layout_config: {
            margin_top: 0,
            margin_left: 0,
            margin_right: 0,
        },
    };
    return widget;
}

function createLeaderboardRow(rank, marks, studentData, tabNumber, assortmentId, locale, config, showFooter) {
    let userName;
    const sli = studentData[0].mobile.slice(0, 6);
    const phone = studentData[0].mobile.replace(sli, 'xxxxxx');

    if (studentData[0].student_fname !== null) {
        if (studentData[0].student_lname !== null) {
            userName = `${studentData[0].student_fname} ${studentData[0].student_lname}`;
            userName = userName.replace(/\n/g, ' ');
        } else {
            userName = `${studentData[0].student_fname}`;
        }
    } else {
        userName = phone;
    }
    const data = {
        rank,
        image: studentData[0].img_url ? studentData[0].img_url : null,
        name: userName,
        elevation: 3,
        marks: Number(marks).toFixed(2),
        student_id: studentData[0].student_id,
        tab: tabNumber,
        icon: `${config.staticCDN}/engagement_framework/1EE5536A-4D82-F73D-0A4C-114B401EB938.webp`,
        profile_deeplink: `doubtnutapp://dialog_widget?widget_type=paid_user_championship_profile&show_close_btn=true&student_id=${studentData[0].student_id}&assortment_id=${assortmentId}&tab_number=${tabNumber}`,
        deeplink: `doubtnutapp://dialog_widget?widget_type=paid_user_championship_profile&show_close_btn=true&student_id=${studentData[0].student_id}&assortment_id=${assortmentId}&tab_number=${tabNumber}`,
    };
    if (rank === 1) {
        if (!showFooter) {
            data.footer_title = locale === 'hi' ? 'पढो और जीतो 20% ऑफ कूपन' : 'Padho aur Jeeto 20% OFF coupon today';
        } else {
            data.footer_background = '#e1daff';
            data.footer_title = locale === 'hi' ? 'पढो और जीतो डाउटनट का टी-शर्ट रिवॉर्ड ' : 'Padho aur Jeeto Doubtnut ka T-shirt reward';
            const checkWinnersText = {
                1: {
                    hi: 'पिछले सप्ताह के विजेता देखें',
                    en: 'Check previous week\'s winners',
                },
                2: {
                    hi: 'पिछले महीने के विजेता देखें',
                    en: 'Check previous month\'s winners',

                },
                3: {
                    hi: 'पिछले साल के विजेता देखें',
                    en: 'Check previous year\'s winners',

                },
            };
            data.footer_widgets = [
                {
                    type: 'previous_winners_widget',
                    data: {
                        title_one: locale === 'hi' ? checkWinnersText[tabNumber].hi : checkWinnersText[tabNumber].en,
                        title_one_text_size: '14',
                        title_one_text_color: '#541488',
                        image_url1: `${config.staticCDN}engagement_framework/53B43DF0-2684-62F5-DE77-8307FA62143F.webp`,
                        image_url2: `${config.staticCDN}engagement_framework/B3C415FF-1C96-6066-831B-45E80D7F6BD4.webp`,
                        image_url3: `${config.staticCDN}engagement_framework/BD5CE4D2-DE06-9A5D-B652-7110135AA6E8.webp`,
                        image_url4: `${config.staticCDN}engagement_framework/7E646866-9EC2-C9F3-2D4C-AF53A26FEA05.webp`,
                        stroke_color: '#541488',
                        deeplink: `doubtnutapp://leaderboard?source=course&assortment_id=${assortmentId}&type=paid_user_championship_winners&clear_top=false&test_id=${tabNumber}`,
                        extra_params: {
                        },
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_left: 12,
                        margin_right: 12,
                    },
                },
            ];
        }
        data.footer_title_size = '14';
        data.footer_title_color = '#000000';
        data.footer_subtitle = locale === 'hi' ? 'अभी अपनी रैंक सुधारें >>' : 'Improve your rank now >>';
        data.footer_subtitle_size = '12';
        data.footer_subtitle_color = '#ea532c';
        data.footer_deeplink = 'doubtnutapp://bottom_sheet_widget?widget_type=paid_user_championship&show_close_btn=true';
        data.footer_icon = `${config.staticCDN}/engagement_framework/C8EECC26-09D9-DA64-8692-43FB6B247AB9.webp`;
    }
    return data;
}
async function createLeaderboardData(db, data, tabNumber, assortmentId, locale, config, showFooter) {
    const studentArr = [];
    const pointsArr = [];
    const items = [];
    const studentDataPromise = [];
    if (data && data[0]) {
        for (let j = 0; j < data.length; j++) {
            if (j % 2 === 0) {
                studentArr.push(data[j]);
                studentDataPromise.push(StudentContainer.getById(data[j], db));
            } else {
                pointsArr.push(data[j]);
            }
        }
    }
    const studentDataArr = await Promise.all(studentDataPromise);
    for (let i = 0; i < studentArr.length; i++) {
        items.push(createLeaderboardRow(i + 1, pointsArr[i], studentDataArr[i], tabNumber, assortmentId, locale, config, showFooter));
    }
    return items;
}
async function checkIfShowFooter(db, assortmentId, isAnnual, versionCode) {
    if (versionCode < 973) {
        return { weekly: false, monthly: false, yearly: false };
    }
    const showFooterFlags = {};
    const weeklyData = await PaidUserChampionshipMysql.getCoursePreviousWinners(db.mysql.read, assortmentId, moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss'), 'weekly');

    const monthlyData = await PaidUserChampionshipMysql.getCoursePreviousWinners(db.mysql.read, assortmentId, moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss'), 'monthly');
    if (isAnnual) {
        const year = await PaidUserChampionshipHelper.getAnnualLeaderboardYear(db, assortmentId);
        const annualData = await PaidUserChampionshipMysql.getCoursePreviousWinners(db.mysql.read, assortmentId, moment().subtract(1, 'year').year(year).startOf('year').format('YYYY-MM-DD HH:mm:ss'), 'yearly');
        showFooterFlags.yearly = !!annualData.length;
    }
    showFooterFlags.weekly = !!weeklyData.length;
    showFooterFlags.monthly = !!monthlyData.length;
    return showFooterFlags;
}
async function getLeaderboardItems(db, assortmentID, isAnnual, locale, config, versionCode) {
    const weekNumber = moment().add(5, 'hours').add(30, 'minutes').isoWeek();
    const monthNumber = moment().add(5, 'hours').add(30, 'minutes').month();
    const year = moment().add(5, 'hours').add(30, 'minutes').year();
    const { weekly: showFooterWeekly, monthly: showFooterMonthly, yearly: showFooterYearly } = await checkIfShowFooter(db, assortmentID, isAnnual, versionCode);
    const weeklyData = await PaidUserChampionshipRedis.getPaidUserChampionshipLeaderboardWeekly(db.redis.read, weekNumber, assortmentID, 0, 10);

    const items = [];
    const weeklyLeaderboard = await createLeaderboardData(db, weeklyData, 1, assortmentID, locale, config, showFooterWeekly);
    items.push(...(weeklyLeaderboard || []));

    const monthlyData = await PaidUserChampionshipRedis.getPaidUserChampionshipLeaderboardMonthly(db.redis.read, monthNumber, assortmentID, 0, 10);
    const monthlyLeaderboard = await createLeaderboardData(db, monthlyData, 2, assortmentID, locale, config, showFooterMonthly);
    items.push(...(monthlyLeaderboard || []));
    if (isAnnual) {
        const annualData = await PaidUserChampionshipRedis.getPaidUserChampionshipLeaderboardAnnual(db.redis.read, year, assortmentID, 0, 10);
        items.push(...((await createLeaderboardData(db, annualData, 3, assortmentID, locale, config, showFooterYearly)) || []));
    }
    return items;
}

async function getBottomData(db, studentID, locale, assortmentId, batchId, tab, config) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const tabTimeMap = { 1: now.isoWeek(), 2: now.month(), 3: now.year() };
    const tabgetRankMap = { 1: PaidUserChampionshipRedis.getStudentRankWeekly, 2: PaidUserChampionshipRedis.getStudentRankMontly, 3: PaidUserChampionshipRedis.getStudentRankAnnual };

    let rank = await tabgetRankMap[tab](db.redis.read, studentID, assortmentId, tabTimeMap[tab]);
    const tabGetstudentDataMap = { 1: PaidUserChampionshipRedis.getStudentWeeklyData, 2: PaidUserChampionshipRedis.getStudentMonthlyData, 3: PaidUserChampionshipRedis.getStudentAnnualData };
    let studentScoreData = JSON.parse(await tabGetstudentDataMap[tab](db.redis.read, studentID, assortmentId, tabTimeMap[tab]));

    if (_.isNull(rank)) {
        rank = 'NA';
    }
    if (_.isNull(studentScoreData)) {
        studentScoreData = {
            class_attended: 0,
            total_time_class_attended: 0,
            homework_attempted: 0,
            pdf_downloaded: 0,
            quiz_attempted: 0,
        };
    }
    const maxScores = await getAssortmentIdParams(db, assortmentId, batchId);
    const tabDurationMap = {
        1: 'weekly', 2: 'monthly', 3: 'yearly',
    };
    let score = calculatePaidUserChampionshipLeaderBoardScore(studentScoreData, maxScores[tabDurationMap[tab]]);

    // eslint-disable-next-line no-restricted-globals
    if (isNaN(score)) {
        score = 0;
    }

    const studentData = await StudentContainer.getById(studentID, db);

    let userName;
    const sli = studentData[0].mobile.slice(0, 6);
    const phone = studentData[0].mobile.replace(sli, 'xxxxxx');
    if (studentData[0].student_fname !== null) {
        if (studentData[0].student_lname !== null) {
            userName = `${studentData[0].student_fname} ${studentData[0].student_lname}`;
            userName = userName.replace(/\n/g, ' ');
        } else {
            userName = `${studentData[0].student_fname}`;
        }
    } else {
        userName = phone;
    }
    const data = [
        {
            type: 'widget_leaderboard',
            data: {
                bg_color: '#00000000',
                bg_stroke_color: '#00000000',
                item: {
                    rank: rank !== 'NA' ? rank + 1 : rank,
                    rank_text_color: '#ffffff',
                    rank_text_size: '19',
                    image: studentData[0].img_url ? studentData[0].img_url : null,
                    image_size: '40',
                    name: userName,
                    name_text_size: '14',
                    name_text_color: '#ffffff',
                    name_text_bold: false,
                    marks: `${Number(score).toFixed(2)}%`,
                    marks_text_color: '#ffffff',
                    marks_text_size: '16',
                    student_id: studentData[0].student_id,
                    icon: `${config.staticCDN}/engagement_framework/1EE5536A-4D82-F73D-0A4C-114B401EB938.webp`,
                },
            },
            layout_config: {
                margin_top: 15,
                margin_left: 20,
                margin_right: 20,
            },
        },
        {
            type: 'bullet_list_widget',
            data: {
                items: [
                    {
                        title: locale === 'hi' ? '90-100% क्लास पूरी करने पर आप टॉप रैंकर बन जाएंगे, और आपको 50% ऑफ कूपन कोड मिलेगा' : 'On completing 90-100% class will make you top ranker, and you will get 50% off coupon code.',
                        title_text_color: '#edd247',
                        title_text_size: '12',
                        icon: `${config.staticCDN}/engagement_framework/197DEE0B-01BB-CBC7-6CD0-15C2D3D0C8A6.webp`,
                        icon_size: '14',
                        layout_config: {
                            margin_top: 0,
                            margin_left: 0,
                            margin_right: 0,
                            margin_bottom: 0,
                        },
                    },
                ],
            },
            layout_config: {
                margin_top: 0,
                margin_left: 20,
                margin_right: 20,
            },
        },
        {
            type: 'widget_button_border',
            data: {
                text_one: locale === 'hi' ? 'अभी अपनी रैंक सुधारें' : 'Improve your rank now',
                text_one_size: '12',
                text_one_color: '#541488',
                bg_color: '#ffffff',
                bg_stroke_color: '#ffffff',
                assortment_id: assortmentId,
                deep_link: `doubtnutapp://course_details?id=${assortmentId}`,
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '20',
                icon: `${config.staticCDN}/engagement_framework/D9D286EF-6E2F-16CA-7179-29B032E124DA.webp`,
                icon_size: '9',
                icon_gravity: '4',
                icon_color: '#541488',
                wrap_width: true,
                gravity: 8388613,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 20,
                margin_right: 20,
            },
        },

    ];

    const fields = ['class_attended', 'total_time_class_attended', 'homework_attempted', 'pdf_downloaded', 'quiz_attempted'];
    const assortmentFields = ['video_count', 'total_time', 'homework_count', 'pdf_count', 'quiz_count'];
    for (let i = 0; i < fields.length; i++) {
        const layoutConfig = {
            margin_left: 20,
            margin_top: 12,
            margin_right: 20,
        };
        if (i === fields.length - 1) {
            layoutConfig.margin_bottom = 20;
        }
        const points = (studentScoreData[fields[i]] * 100) / maxScores[tabDurationMap[tab]][assortmentFields[i]];
        data.push(getProgressWidget(fields[i], points, layoutConfig, locale, 4));
    }
    return data;
}

async function createLeaderboard(db, studentID, locale, assortmentId, batchId, isAnnual, config, versionCode) {
    const items = await getLeaderboardItems(db, assortmentId, isAnnual, locale, config, versionCode);
    const data = {
        type: 'widget_leaderboard',
        data: {
            margin: true,
            items,
        },
    };
    return data;
}

async function getPreviousWinners(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId, locale: studentLocale } = req.user;
        const config = req.app.get('config');
        const { assortment_id: assortmentId, test_id: tabId } = req.query;
        const widgets = await getShirtWinners(db, studentId, assortmentId, tabId, studentLocale, config);

        const data = {
            title: studentLocale === 'hi' ? 'विजेता' : 'Winners',
            background: '#ffffff',
            title_text_color: '#3f3f3f',
            title_text_size: '16',
            back_icon_color: '#000000',
            leaderboardHelp: {
                title: studentLocale === 'hi' ? 'कैसे जीतें?' : 'How to win?',
                title_text_color: '#ea532c',
                title_text_size: '12',
                title_deeplink: 'doubtnutapp://bottom_sheet_widget?source=leaderboard&widget_type=paid_user_championshipØ&show_close_btn=true',
                icon: '',
            },
            widgets,
        };
        return next({ data });
    } catch (err) {
        return next({ err });
    }
}

async function getLeaderboard(req, res, next) {
    try {
        const db = req.app.get('db');
        const { student_id: studentId } = req.user;
        const config = req.app.get('config');
        const { assortment_id: assortmentId, type } = req.query;
        if (type === 'paid_user_championship_winners') {
            return await getPreviousWinners(req, res, next);
        }
        const versionCode = req.headers.version_code;
        const batchId = await CourseHelper.getBatchByAssortmentIdAndStudentId(db, studentId, assortmentId);
        const studentLocale = req.user.locale;
        const durationInDays = await PaidUserChampionshipMysql.getDurationInDaysByAssortmentId(db.mysql.read, studentId, assortmentId);
        const isAnnual = durationInDays[0].duration_in_days >= 365;
        let widgets = [getBottomData(db, studentId, studentLocale, assortmentId, batchId, 1, config), getBottomData(db, studentId, studentLocale, assortmentId, batchId, 2, config), getBottomData(db, studentId, studentLocale, assortmentId, batchId, 3, config)];
        widgets = await Promise.all(widgets);
        const data = {
            title: studentLocale === 'hi' ? 'पढो और जीतो लीडरबोर्ड' : 'Padho aur Jeeto Leaderboard',
            background: '#ffffff',
            title_text_color: '#3f3f3f',
            title_text_size: '16',
            back_icon_color: '#000000',

            leaderboardHelp: {
                title: studentLocale === 'hi' ? 'कैसे जीतें?' : 'How to win?',
                title_text_color: '#ea532c',
                title_text_size: '12',
                title_deeplink: 'doubtnutapp://bottom_sheet_widget?source=leaderboard&widget_type=paid_user_championship&show_close_btn=true',
                icon: '',
            },
            widgets: [],
            sticky_widgets: [],
            bottom_data: {
                background: '#541488',
                peek_height: 72,
                widgets: widgets[1],
            },
            bottom_tabs: [
                {
                    background: '#541488',
                    peek_height: 72,
                    widgets: widgets[0],
                    tab: 1,
                }, {
                    background: '#541488',
                    peek_height: 72,
                    widgets: widgets[1],
                    tab: 2,
                },
                {
                    background: '#541488',
                    peek_height: 72,
                    widgets: widgets[2],
                    tab: 3,
                },
            ],
        };
        const leaderboardWidget = await createLeaderboard(db, studentId, studentLocale, assortmentId, batchId, isAnnual, config, versionCode);
        const has = {
            1: false,
            2: false,
            3: false,
        };
        for (let i = 0; i < leaderboardWidget.data.items.length; i++) {
            has[leaderboardWidget.data.items[i].tab] = true;
        }
        data.sticky_widgets.push(getTabDetails(has, isAnnual, studentLocale));
        PaidUserChampionshipRedis.setStudentPaidCourseInteractionCount(db.redis.write, studentId, 0);
        data.widgets.push(leaderboardWidget);
        const responseData = {
            meta: {
                code: 200,
                message: 'success',
            },
            data,
        };
        return res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next({ err: e });
    }
}

function createWinnersWidgets(studentData, winners, config, studentLocale, title) {
    const data = [];
    const subtitle = studentLocale === 'hi' ? 'आज ही पढो और जीतो छात्रवृत्ति और कूपन्स अपने अगले कोर्स की खरीद के लिए।' : 'Aaj hi Padho aur Jeeto scholarship or coupons apne agle course purchase k liye.';
    data.push({
        type: 'text_widget',
        data: {
            title,
            text_color: '#000000',
            text_size: '16',
            background_color: '',
            isBold: 'true',
            alignment: '',
        },
        layout_config: {
            margin_top: 30,
            margin_left: 16,
            margin_right: 16,
        },
    });
    data.push({
        type: 'text_widget',
        data: {
            title: subtitle,
            text_color: '#000000',
            text_size: '14',
            background_color: '',
            isBold: 'false',
            alignment: '',
        },
        layout_config: {
            margin_top: 8,
            margin_left: 16,
            margin_right: 16,
        },
    });
    studentData.forEach((item, index) => {
        let userName;
        const sli = item[0].mobile.slice(0, 6);
        const phone = item[0].mobile.replace(sli, 'xxxxxx');

        if (item[0].student_fname !== null) {
            if (item[0].student_lname !== null) {
                userName = `${item[0].student_fname} ${item[0].student_lname}`;
            } else {
                userName = `${item[0].student_fname}`;
            }
        } else {
            userName = phone;
        }
        data.push({
            type: 'winners_card_widget',
            data: {
                rank: winners[index].rank,
                title1: winners[index].rank,
                title1_text_size: '14',
                title1_text_color: '#ffffff',
                title2: userName,
                title2_text_size: '15',
                title2_text_color: '#541488',
                title3: `${winners[index].percentage}%`,
                title3_text_size: '16',
                title3_text_color: '#3f3f3f',
                title4: studentLocale === 'hi' ? `${winners[index].reward} प्राप्त किया।` : `Received ${winners[index].reward}`,
                title4_text_size: '12',
                title4_text_color: '#000000',
                image_url1: item.img_url ? item.img_url : null,
                image_url2: `${config.staticCDN}/engagement_framework/1EE5536A-4D82-F73D-0A4C-114B401EB938.webp`,
                image_url3: `${config.staticCDN}/engagement_framework/C8EECC26-09D9-DA64-8692-43FB6B247AB9.webp`,
                deeplink: '',
                extra_params: {
                },
            },
            layout_config: {
                margin_top: 22,
                margin_left: 12,
                margin_right: 13,
            },
        });
    });
    return data;
}

async function getShirtWinners(db, studentId, assortmentId, tabId, studentLocale, config) {
    let winningDate;
    let duration;
    let title;
    if (!tabId) {
        throw Error('Invalid Duration');
    }
    if (+tabId === 1) {
        duration = 'weekly';
        winningDate = moment().subtract(1, 'week').startOf('isoWeek').format('YYYY-MM-DD HH:mm:ss');
        title = studentLocale !== 'hi' ? 'Pichle Hafte k Toppers' : 'पिचले हफ्ते के टॉपर्स';
    } else if (+tabId === 2) {
        duration = 'monthly';
        winningDate = moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD HH:mm:ss');
        title = studentLocale !== 'hi' ? 'Pichle Mahine k Toppers' : 'पिचले महीने के टॉपर्स';
    } else if (+tabId === 3) {
        duration = 'yearly';
        winningDate = moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD HH:mm:ss');
        title = studentLocale !== 'hi' ? 'Pichle sal k Toppers' : 'पिचले साल के टॉपर्स';
    }
    const winners = await PaidUserChampionshipMysql.getCoursePreviousWinners(db.mysql.read, assortmentId, winningDate, duration);
    const studentDataPromises = [];
    winners.forEach((item) => {
        studentDataPromises.push(StudentContainer.getById(item.student_id, db));
    });
    const studentData = await Promise.all(studentDataPromises);
    return createWinnersWidgets(studentData, winners, config, studentLocale, title);
}


module.exports = {
    getLeaderboard,
    getPreviousWinners,
};
