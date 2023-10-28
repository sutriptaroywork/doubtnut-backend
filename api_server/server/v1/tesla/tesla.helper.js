const moment = require('moment');
const _ = require('lodash');

const CourseContainer = require('../../../modules/containers/coursev2');
const PznContainer = require('../../../modules/containers/pzn');
const CourseHelper = require('../../helpers/course');
const Data = require('../../../data/data');

async function getTopVideosBySubject(db, studentId, stClass, locale, ccmIdList, versionCode, page = 'STUDENT_PROFILE') {
    const etStartDate = moment().subtract(30, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD');
    const etEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD');
    const subjectStartDate = moment().subtract(10, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD hh:mm:ss');
    const subjectEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');
    const qidStartDate = moment().subtract(2, 'days').add(5, 'h').add(30, 'minutes')
        .format('YYYY-MM-DD hh:mm:ss');
    const qidEndDate = moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD hh:mm:ss');

    const [engageData, subjectList] = await Promise.all([
        PznContainer.getUserTotalEngageTimeBuketForRange(+studentId, etStartDate, etEndDate),
        PznContainer.getSubjectListByTotalEt(studentId, subjectStartDate, subjectEndDate),
    ]);

    if ((engageData.total_engage_time < 1200 || page === 'MPVP') && +versionCode >= 967) {
        const profileMostWatchedSubjectOrder = {
            '6_10': ['MATHS', 'SCIENCE', 'ENGLISH', 'SOCIAL SCIENCE', 'ENGLISH GRAMMAR'],
            '11_12': ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH', 'ENGLISH GRAMMAR', 'COMPUTER'],
            14: ['MATHS', 'REASONING', 'ENGLISH', 'SCIENCE', 'POLITY', 'HISTORY', 'ECONOMICS', 'GEOGRAPHY', 'GENERAL AWARENESS', 'GENERAL STUDIES'],
        };
        const dataObj = {
            class: +stClass || 12,
            start_date: `${qidStartDate}`,
            end_date: `${qidEndDate}`,
            languages: locale === 'hi' ? ['HINDI'] : ['ENGLISH'],
        };
        if (ccmIdList.length) {
            dataObj.ccm_ids = ccmIdList;
        }
        dataObj.subjects = profileMostWatchedSubjectOrder['11_12'];
        if (_.includes([6, 7, 8, 9, 10], +stClass)) {
            dataObj.subjects = profileMostWatchedSubjectOrder['6_10'];
        } else if (+stClass === 14) {
            dataObj.subjects = profileMostWatchedSubjectOrder['14'];
        }

        const mostWatchedData = await PznContainer.getQuestionByMaxEngageTime(dataObj);
        if (mostWatchedData !== null) {
            const promise = [];
            for (let i = 0; i < mostWatchedData.length; i++) {
                promise.push(CourseContainer.getAssortmentsByResourceReferenceV1(db, mostWatchedData[i]));
            }
            const liveClassData = await Promise.all(promise);
            const data = CourseHelper.bottomSheetDataFormat(mostWatchedData, liveClassData, 0);
            if (data.widget_data.items.length) {
                data.extra_params = { source: 'homepage_continue_watching' };
                data.widget_data.title = locale === 'hi' ? '<b>आपके लिए ट्रेंडिंग <font color="#e34c4c">फ्री</font> क्लासेस</b>' : 'Trending <font color="#e34c4c"><b>FREE</b></font> classes for you';
                const widgetTabs = {};
                for (let i = 0; i < data.widget_data.items.length; i++) {
                    data.widget_data.items[i].data.subject = locale === 'hi' ? Data.freeLiveClassTab.localisedData[data.widget_data.items[i].data.subject.toLowerCase()] : data.widget_data.items[i].data.subject;
                    data.widget_data.items[i].data.page = page;
                    data.widget_data.items[i].data.views = locale === 'hi' ? `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} स्टूडेंट्स ने देखा` : `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} students watched`;
                    if (+versionCode <= 971) {
                        data.widget_data.items[i].data.views = null;
                        data.widget_data.items[i].data.bottom_layout.title = data.widget_data.items[i].data.bottom_layout.title_replace || '';
                        data.widget_data.items[i].data.bottom_layout.sub_title = locale === 'hi' ? `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} स्टूडेंट्स ने देखा` : `${data.widget_data.items[i].data.bottom_layout.sub_title_replace} students watched`;
                    }
                }
                data.widget_data.tabs.forEach((x) => {
                    widgetTabs[x.key] = x;
                });
                const finalTabs = [];
                const actions = [];

                if (subjectList && subjectList.length) {
                    for (let i = 0; i < subjectList.length; i++) {
                        if (widgetTabs[subjectList[i].toLowerCase()]) {
                            finalTabs.push({
                                key: widgetTabs[subjectList[i].toLowerCase()].key,
                                title: locale === 'hi' ? Data.freeLiveClassTab.localisedData[subjectList[i].toLowerCase()] : widgetTabs[subjectList[i].toLowerCase()].title,
                                is_selected: false,
                            });
                            actions.push({
                                group_id: widgetTabs[subjectList[i].toLowerCase()].key,
                                text_one: locale === 'hi' ? 'फ्री क्लासेस देखें' : 'Explore Free classes  >',
                                text_one_size: '12',
                                text_one_color: '#eb532c',
                                bg_stroke_color: '#eb532c',
                                deeplink: 'doubtnutapp://library_tab?id=1&tag=free_classes',
                            });
                            delete widgetTabs[subjectList[i].toLowerCase()];
                        }
                    }
                }
                for (let i = 0; i < dataObj.subjects.length; i++) {
                    if (widgetTabs[dataObj.subjects[i].toLowerCase()]) {
                        finalTabs.push({
                            key: widgetTabs[dataObj.subjects[i].toLowerCase()].key,
                            title: locale === 'hi' ? Data.freeLiveClassTab.localisedData[dataObj.subjects[i].toLowerCase()] : widgetTabs[dataObj.subjects[i].toLowerCase()].title,
                            is_selected: false,
                        });
                        actions.push({
                            group_id: widgetTabs[dataObj.subjects[i].toLowerCase()].key,
                            text_one: locale === 'hi' ? 'फ्री क्लासेस देखें' : 'Explore Free classes  >',
                            text_one_size: '12',
                            text_one_color: '#eb532c',
                            bg_stroke_color: '#eb532c',
                            deeplink: 'doubtnutapp://library_tab?id=1&tag=free_classes',
                        });
                    }
                }
                finalTabs[0].is_selected = true;
                data.widget_data.tabs = finalTabs;
                data.widget_data.actions = actions;
                data.extra_params = { source: 'free_class_profile' };
                return [data];
            }
        }
    }
    return null;
}

module.exports = {
    getTopVideosBySubject,
};
