/* eslint-disable key-spacing */
const _ = require('lodash');
const moment = require('moment');
const PaidUserChampionshipRedis = require('../../modules/redis/paidUserChampionship');
const PaidUserChampionshipMysql = require('../../modules/mysql/paidUserChampionship');
const PaidUserChampionshipContainer = require('../../modules/containers/paidUserChampionship');
const StudentContainer = require('../../modules/containers/student');
const { getAssortmentIdParams } = require('../../modules/containers/paidUserChampionship');
const CourseContainerv2 = require('../../modules/containers/coursev2');
const CourseMysqlv2 = require('../../modules/mysql/coursev2');
const config = require('../../config/config');

async function getAnnualLeaderboardYear(db, assortmentId) {
    const startDate = await PaidUserChampionshipContainer.getCourseStartDate(db, config, assortmentId);
    return moment(startDate).year() + moment().diff(moment(startDate), 'year');
}

function getEventDateRelativeToCourseStartDate(courseStartDate, resourseDate) {
    return moment(courseStartDate).year() + moment(resourseDate).diff(moment(courseStartDate), 'year');
}
async function getStudentScore(db, studentId, assortmentId, number, duration) {
    if (duration === 'weekly') {
        return PaidUserChampionshipRedis.getStudentWeeklyData(db.redis.read, studentId, assortmentId, number);
    }
    if (duration === 'monthly') {
        return PaidUserChampionshipRedis.getStudentMonthlyData(db.redis.read, studentId, assortmentId, number);
    } if (duration === 'annual') {
        return PaidUserChampionshipRedis.getStudentAnnualData(db.redis.read, studentId, assortmentId, number);
    }
}

function calculatePaidUserChampionshipLeaderBoardScore(studentData, assortmentData) {
    const fields = ['class_attended', 'total_time_class_attended', 'homework_attempted', 'pdf_downloaded', 'quiz_attempted'];
    const assortmentFields = ['video_count', 'total_time', 'homework_count', 'pdf_count', 'quiz_count'];
    let sum = 0;
    for (let i = 0; i < fields.length; i++) {
        sum += (+assortmentData[assortmentFields[i]] ? (studentData[fields[i]] * 100) / assortmentData[assortmentFields[i]] : 0);
    }

    return sum / 5;
}

async function getBatchByAssortmentIdAndStudentId(db, studentID, assortmentID) {
    if (assortmentID) {
        const [
            checkPurchaseHistory,
            checkActiveSubscriptions,
        ] = await Promise.all([
            CourseContainerv2.getUserExpiredPackages(db, studentID),
            CourseContainerv2.getUserActivePackages(db, studentID),
        ]);
        const currentAssortmentPurchaseHistory = _.find(checkActiveSubscriptions, ['assortment_id', +assortmentID]) || _.find(checkPurchaseHistory, ['assortment_id', +assortmentID]);
        if (currentAssortmentPurchaseHistory) {
            return currentAssortmentPurchaseHistory.batch_id;
        }
        const latestBatch = await CourseContainerv2.getLastestBatchByAssortment(db, assortmentID);
        return latestBatch.length ? latestBatch[0].batch_id : 1;
    }
    return 1;
}

async function getStudentScoreForMyCourses(db, studentId, assortmentId) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const durationInDays = await PaidUserChampionshipMysql.getDurationInDaysByAssortmentId(db.mysql.read, studentId, assortmentId);
    const batchId = await getBatchByAssortmentIdAndStudentId(db, studentId, assortmentId);
    const assortmentParams = await getAssortmentIdParams(db, assortmentId, batchId);

    if (durationInDays.length && durationInDays[0].duration_in_days >= 365) {
        const scores = JSON.parse(await getStudentScore(db, studentId, assortmentId, now.year(), 'annual'));
        if (_.isNull(scores)) {
            return 0;
        }
        return (scores.class_attended * 100) / assortmentParams.yearly.video_count;
    }

    const scores = JSON.parse(await getStudentScore(db, studentId, assortmentId, now.month(), 'monthly'));
    if (_.isNull(scores)) {
        return 0;
    }

    return (scores.class_attended * 100) / assortmentParams.monthly.video_count;
}

async function updateCountInLeaderboard(db, field, incrementCount, studentID, assortmentId, homeworkDate) {
    const durationInDays = await PaidUserChampionshipMysql.getDurationInDaysByAssortmentId(db.mysql.read, studentID, assortmentId);
    const isAnnual = durationInDays[0].duration_in_days >= 365;
    const batchId = await getBatchByAssortmentIdAndStudentId(db, studentID, assortmentId);
    const maxScores = await getAssortmentIdParams(db, assortmentId, batchId);
    const fields = ['class_attended', 'total_time_class_attended', 'homework_attempted', 'pdf_downloaded', 'quiz_attempted'];
    const assortmentFields = ['video_count', 'total_time', 'homework_count', 'pdf_count', 'quiz_count'];

    const now = moment().add(5, 'hours').add(30, 'minutes');
    if (field === 'homework_attempted') {
        now.add(1, 'days');
    }
    const fieldIndex = fields.findIndex((item) => item === field);
    const hwtime = moment(homeworkDate);
    if (now.isoWeek() === hwtime.isoWeek()) {
        let studentWeeklyData = await PaidUserChampionshipRedis.getStudentWeeklyData(db.redis.read, studentID, assortmentId, now.isoWeek());
        if (_.isNull(studentWeeklyData)) {
            studentWeeklyData = {
                class_attended: 0,
                total_time_class_attended: 0,
                homework_attempted: 0,
                pdf_downloaded: 0,
                quiz_attempted: 0,
            };
            studentWeeklyData[field] = Math.min(Number(studentWeeklyData[field]) + Number(incrementCount), maxScores.weekly[assortmentFields[fieldIndex]]);
            PaidUserChampionshipRedis.setStudentWeeklyData(db.redis.write, studentID, assortmentId, now.isoWeek(), studentWeeklyData);
        } else {
            studentWeeklyData = JSON.parse(studentWeeklyData);
            studentWeeklyData[field] = Math.min(Number(studentWeeklyData[field]) + Number(incrementCount), maxScores.weekly[assortmentFields[fieldIndex]]);
            PaidUserChampionshipRedis.setStudentWeeklyData(db.redis.write, studentID, assortmentId, now.isoWeek(), studentWeeklyData);
        }
        let sum = 0;
        for (let i = 0; i < fields.length; i++) {
            sum += +maxScores.weekly[assortmentFields[i]] === 0 ? 0 : (studentWeeklyData[fields[i]] * 100) / maxScores.weekly[assortmentFields[i]];
        }
        PaidUserChampionshipRedis.setPaidUserChampionshipLeaderboardWeekly(db.redis.read, studentID, assortmentId, now.isoWeek(), sum / 5);
    }

    if (now.month() === hwtime.month()) {
        let studentMonthlyData = await PaidUserChampionshipRedis.getStudentMonthlyData(db.redis.read, studentID, assortmentId, now.month());
        if (_.isNull(studentMonthlyData)) {
            studentMonthlyData = {
                class_attended: 0,
                total_time_class_attended: 0,
                homework_attempted: 0,
                pdf_downloaded: 0,
                quiz_attempted: 0,
            };
            studentMonthlyData[field] = Math.min(Number(studentMonthlyData[field]) + Number(incrementCount), maxScores.monthly[assortmentFields[fieldIndex]]);
            PaidUserChampionshipRedis.setStudentMonthlyData(db.redis.write, studentID, assortmentId, now.month(), studentMonthlyData);
        } else {
            studentMonthlyData = JSON.parse(studentMonthlyData);
            studentMonthlyData[field] = Math.min(Number(studentMonthlyData[field]) + Number(incrementCount), maxScores.monthly[assortmentFields[fieldIndex]]);
            PaidUserChampionshipRedis.setStudentMonthlyData(db.redis.write, studentID, assortmentId, now.month(), studentMonthlyData);
        }
        let sum = 0;
        for (let i = 0; i < fields.length; i++) {
            sum += +maxScores.monthly[assortmentFields[i]] === 0 ? 0 : (studentMonthlyData[fields[i]] * 100) / maxScores.monthly[assortmentFields[i]];
        }
        PaidUserChampionshipRedis.setPaidUserChampionshipLeaderboardMonthly(db.redis.read, studentID, assortmentId, now.month(), sum / 5);
    }

    if (now.year() === hwtime.year() && isAnnual) {
        let studentAnnualData = await PaidUserChampionshipRedis.getStudentAnnualData(db.redis.read, studentID, assortmentId, now.year());
        if (_.isNull(studentAnnualData)) {
            studentAnnualData = {
                class_attended: 0,
                total_time_class_attended: 0,
                homework_attempted: 0,
                pdf_downloaded: 0,
                quiz_attempted: 0,
            };
            studentAnnualData[field] = Math.min(Number(studentAnnualData[field]) + Number(incrementCount), maxScores.yearly[assortmentFields[fieldIndex]]);

            PaidUserChampionshipRedis.setStudentAnnualData(db.redis.write, studentID, assortmentId, now.year(), studentAnnualData);
        } else {
            studentAnnualData = JSON.parse(studentAnnualData);
            studentAnnualData[field] = Math.min(Number(studentAnnualData[field]) + Number(incrementCount), maxScores.yearly[assortmentFields[fieldIndex]]);
            PaidUserChampionshipRedis.setStudentAnnualData(db.redis.write, studentID, assortmentId, now.year(), studentAnnualData);
        }
        let sum = 0;
        for (let i = 0; i < fields.length; i++) {
            sum += +maxScores.yearly[assortmentFields[i]] === 0 ? 0 : (studentAnnualData[fields[i]] * 100) / maxScores.yearly[assortmentFields[i]];
        }
        PaidUserChampionshipRedis.setPaidUserChampionshipLeaderboardAnnual(db.redis.read, studentID, assortmentId, now.year(), sum / 5);
    }
}
function getProgressWidget(field, score, layoutConfig, locale, elevation) {
    const titleMap = {
        hi: {
            class_attended: 'कक्षा में भाग लिया',
            total_time_class_attended: 'कुल समय कक्षा में भाग लिया',
            homework_attempted: 'होमवर्क का प्रयास किया',
            pdf_downloaded: 'पीडीएफ खोला गया',
            quiz_attempted: 'प्रश्नोत्तरी का प्रयास किया गया',
        },
        en: {
            class_attended: 'Class attended',
            total_time_class_attended: 'Total time class attended',
            homework_attempted: 'Homework attempted',
            pdf_downloaded: 'PDF Downloaded',
            quiz_attempted: 'Quiz attempted',
        },
    };
    const widget = {
        type: 'widget_leader_board_progress',
        data: {
            background: '#ffffff',
            elevation,
            padding: '8',
            title: locale === 'hi' ? titleMap.hi[field] : titleMap.en[field],
            title_text_size: '12',
            title_text_color: '#541488',
            // eslint-disable-next-line no-restricted-globals
            progress_text: !isNaN(score) ? `${Number(score).toFixed(2)}%` : '0.00%',
            progress_text_size: '12',
            progress_text_color: '#000000',
            progress_total_text: '100%',
            progress_total_text_size: '12',
            progress_total_text_color: '#000000',
            // eslint-disable-next-line no-restricted-globals
            progress: !isNaN(score) ? score : 0,
            progress_bar_color: '#541488',
            progress_bar_background_color: '#cfd8dc',
        },
        layout_config: layoutConfig,
    };
    return widget;
}
async function getUserScores(db, studentId, assortmentId, locale, batchId, tabNumber, config) {
    const fields = ['class_attended', 'total_time_class_attended', 'homework_attempted', 'pdf_downloaded', 'quiz_attempted'];
    const assortmentFields = ['video_count', 'total_time', 'homework_count', 'pdf_count', 'quiz_count'];
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const tabTimeMap = { 1: now.isoWeek(), 2: now.month(), 3: now.year() };
    const tabgetRankMap = { 1: PaidUserChampionshipRedis.getStudentRankWeekly, 2: PaidUserChampionshipRedis.getStudentRankMontly, 3: PaidUserChampionshipRedis.getStudentRankAnnual };
    const tabDurationMap = {
        1: 'weekly', 2: 'monthly', 3: 'yearly',
    };
    const rank = await tabgetRankMap[tabNumber](db.redis.read, studentId, assortmentId, tabTimeMap[tabNumber]);

    const tabGetstudentDataMap = { 1: PaidUserChampionshipRedis.getStudentWeeklyData, 2: PaidUserChampionshipRedis.getStudentMonthlyData, 3: PaidUserChampionshipRedis.getStudentAnnualData };
    const studentScoreData = JSON.parse(await tabGetstudentDataMap[tabNumber](db.redis.read, studentId, assortmentId, tabTimeMap[tabNumber]));

    const studentData = await StudentContainer.getById(studentId, db);

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
        show_close_btn: true,
        widgets: [{
            type: 'widget_leaderboard',
            data: {
                bg_color: '#ffffff',
                bg_stroke_color: '#ffffff',
                item: {
                    rank: rank + 1,
                    rank_text_color: '#000000',
                    rank_text_size: '19',
                    image: studentData[0].img_url ? studentData[0].img_url : null,
                    image_size: '40',
                    name: userName,
                    name_text_size: '14',
                    name_text_color: '#000000',
                    name_text_bold: true,
                    marks: '',
                    marks_text_color: '#000000',
                    marks_text_size: '16',
                    student_id: studentData[0].student_id,
                    icon: `${config.staticCDN}/engagement_framework/1EE5536A-4D82-F73D-0A4C-114B401EB938.webp`,
                },
            },
            layout_config: {
                margin_top: 24,
                margin_left: 10,
                margin_right: 10,
            },
        },
        {
            type: 'bullet_list_widget',
            data: {
                items: [
                    {
                        title: locale === 'hi' ? 'पढो और जीतो छात्रवृत्ति के रूप में भुगतान की गई कुल फीस का 25% शुल्क वापस' : 'Padho aur Jeeto 25% fees back of total fees paid as scholarship.',
                        title_text_color: '#ea532c',
                        title_text_size: '12',
                        icon: `${config.staticCDN}/engagement_framework/1F5C4172-2F71-8054-1427-98AB2F64C937.webp`,
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
                margin_left: 10,
                margin_right: 10,
            },
        },
        {
            type: 'widget_button_border',
            data: {
                text_one: locale === 'hi' ? 'अभी अपनी रैंक सुधारें' : 'Improve your rank now',
                text_one_size: '12',
                text_one_color: '#ffffff',
                bg_color: '#541488',
                bg_stroke_color: '#541488',
                assortment_id: assortmentId,
                deep_link: `doubtnutapp://course_details?id=${assortmentId}`,
                corner_radius: '4.0',
                elevation: '4.0',
                min_height: '20',
                icon: `${config.staticCDN}/engagement_framework/7D23D209-EE87-80E0-0448-FB26412E5165.webp`,
                icon_size: '9',
                icon_gravity: '4',
                icon_color: '#ffffff',
                wrap_width: true,
                gravity: 8388613,
            },
            layout_config: {
                margin_top: 12,
                margin_left: 10,
                margin_right: 10,
            },
        },
        ],
    };

    const maxScores = await getAssortmentIdParams(db, assortmentId, batchId);
    const percentages = [];
    for (let i = 0; i < fields.length; i++) {
        if (+maxScores[tabDurationMap[tabNumber]][assortmentFields[i]]) {
            percentages.push((studentScoreData[fields[i]] * 100) / (maxScores[tabDurationMap[tabNumber]][assortmentFields[i]]));
        } else {
            percentages.push(0);
        }
        const layoutConfig = {
            margin_left: 10,
            margin_top: 12,
            margin_right: 10,
        };
        if (i === fields.length - 1) {
            layoutConfig.margin_bottom = 12;
        }
        data.widgets.push(getProgressWidget(fields[i], percentages[percentages.length - 1], layoutConfig, locale, 4));
    }

    let sum = 0;
    for (let i = 0; i < percentages.length; i++) {
        sum += +percentages[i] || 0;
    }
    const avg = (sum / (percentages.length)).toFixed(2);
    data.widgets[0].data.item.marks = `${avg}%`;
    return data;
}

async function checkIfLeaderboardsHasEntry(db, assortmentId, batchId) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    const nowYear = await getAnnualLeaderboardYear(db, assortmentId);
    const promises = [PaidUserChampionshipRedis.getCountInWeekLeaderboard(db.redis.read, assortmentId, now.isoWeek()), PaidUserChampionshipRedis.getCountInMonthLeaderboard(db.redis.read, assortmentId, now.month()), PaidUserChampionshipRedis.getCountInYearLeaderboard(db.redis.read, assortmentId, nowYear)];
    const resolvedPromises = await Promise.all(promises);
    return resolvedPromises.reduce((a, b) => a + b, 0) > 0;
}
async function getShirtFlow(db, studentId, locale) {
    const data = await PaidUserChampionshipMysql.getUnSeenTshirts(db.mysql.read, studentId);
    return {
        show_close_btn: true,
        dialog_width_padding: 90,
        widgets: [
            {
                type: 'promo_list',
                data: {
                    items: [
                        {
                            image_url: `${config.staticCDN}engagement_framework/C00A031C-6FC4-91D6-0D5A-993C6C802E7E.webp`,
                            scale_type: 'FIT_CENTER',
                            width: '212',
                            height: '212',
                        },
                    ],
                    ratio: '1:1',
                    height: '212',
                },
                layout_config: {
                    margin_top: 18,
                    margin_left: 24,
                    margin_right: 24,
                },
            },
            {
                type: 'text_widget',
                data: {
                    title: locale === 'hi' ? 'वू हू! आपने जीत लिया है डाउटनट का टी-शर्ट रिवॉर्ड।' : 'Woohoo! Aapne jeet liya hai Doubtnut ka T-shirt reward',
                    text_color: '#2f2f2f',
                    text_size: '14',
                    background_color: '',
                    isBold: 'false',
                    alignment: 'center',
                },
                layout_config: {
                    margin_top: 6,
                    margin_left: 24,
                    margin_right: 24,
                },
            },
            {
                data: {
                    text_one: 'Abhi pao',
                    text_one_size: '14',
                    text_one_color: '#ffffff',
                    bg_color: '#eb532c',
                    bg_stroke_color: '#eb532c',
                    assortment_id: '',
                    deep_link: `doubtnutapp://submit_address_dialog?type=paid_user_championship_reward&id=${data[0].id}`,
                    corner_radius: '4.0',
                    elevation: '4.0',
                    min_height: '36',
                },
                type: 'widget_button_border',
                layout_config: {
                    margin_top: 12,
                    margin_left: 49,
                    margin_right: 49,
                    margin_bottom: 21,
                },
            },
        ],
    };
}

async function couponPopUp(locale, couponCode) {
    let reward;
    if (couponCode === 'PAIDCHAMPIONSHIP10') {
        reward = 10;
    } else if (couponCode === 'PAIDCHAMPIONSHIP25') {
        reward = 25;
    } else if (couponCode === 'PAIDCHAMPIONSHIP50') {
        reward = 50;
    } else {
        throw new Error('invalid coupon code');
    }
    const images = {
        10: `${config.staticCDN}engagement_framework/77E8C811-CF5D-0052-C81B-3AE75B9E5054.webp`,
        25: `${config.staticCDN}engagement_framework/91D3E6DF-65A2-EBF2-2B3D-6DB37AB4D3FC.webp`,
        50: `${config.staticCDN}engagement_framework/9E2ED389-3402-7386-32E0-7426937C5099.webp`,
    };

    const text = locale === 'hi' ? `आपने जीता है ${reward}% डिस्काउंट कूपन..इस छूट का लुत्फ उठाने के लिए कोर्स खरीदें और चेकआउट के टाइम इस कोड को यूज करें` : `Aapne jeeta hai ${reward}% discount coupon..Is discount ka lutf uthane ke liye course khareedein aur checkout ke time is code ko use karein`;
    return {
        show_close_btn: true,
        dialog_width_padding: 90,
        widgets: [
            {
                type: 'promo_list',
                data: {
                    items: [
                        {
                            image_url: images[reward],
                            scale_type: 'FIT_CENTER',
                            width: '212',
                            height: '212',
                        },
                    ],
                    ratio: '1:1',
                    height: '212',
                },
                layout_config: {
                    margin_top: 18,
                    margin_left: 24,
                    margin_right: 24,
                },
            },
            {
                type: 'text_widget',
                data: {
                    title: text,
                    text_color: '#2f2f2f',
                    text_size: '14',
                    background_color: '',
                    isBold: 'false',
                    alignment: 'center',
                },
                layout_config: {
                    margin_top: 6,
                    margin_left: 24,
                    margin_right: 24,
                },
            },
            {
                type: 'widget_copy_text',
                data: {
                    title_one: couponCode,
                    title_one_text_size: '12',
                    title_one_text_color: '#000000',
                    title_two: 'Copy',
                    title_two_text_size: '12',
                    title_two_text_color: '#ffffff',
                    bg_stroke_color: '#2f2f2f',
                    toast_message: 'code copied',
                    deeplink: '',
                },
                layout_config: {
                    margin_top: 6,
                    margin_left: 24,
                    margin_right: 24,
                },
            },
            {
                data: {
                    text_one: 'Check Courses',
                    text_one_size: '14',
                    text_one_color: '#ffffff',
                    bg_color: '#eb532c',
                    bg_stroke_color: '#eb532c',
                    assortment_id: '',
                    deep_link: 'doubtnutapp://library_course',
                    corner_radius: '4.0',
                    elevation: '4.0',
                    min_height: '36',
                },
                type: 'widget_button_border',
                layout_config: {
                    margin_top: 12,
                    margin_left: 49,
                    margin_right: 49,
                    margin_bottom: 21,
                },
            },
        ],
    };
}

module.exports = {
    updateCountInLeaderboard,
    getUserScores,
    getStudentScore,
    getStudentScoreForMyCourses,
    getBatchByAssortmentIdAndStudentId,
    getProgressWidget,
    calculatePaidUserChampionshipLeaderBoardScore,
    checkIfLeaderboardsHasEntry,
    getAnnualLeaderboardYear,
    getEventDateRelativeToCourseStartDate,
    getShirtFlow,
    couponPopUp,
};
