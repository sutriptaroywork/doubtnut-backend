const querystring = require('querystring');
const _ = require('lodash');
const moment = require('moment');

const GamesMysql = require('../../../modules/mysql/games');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const LiveClassMysql = require('../../../modules/mysql/liveclass');
const CourseHelper = require('../../helpers/course');
const StaticData = require('../../../data/data');

async function getGamesDataForNudge(db, experiment, studentLocale) {
    const gamesData = await GamesMysql.getList(db.mysql.read, 'profile_order');
    const listSize = 5;
    if (gamesData.length === 0) {
        return {};
    }
    let gamesDataModified = gamesData.sort((a, b) => b.id - a.id);
    if (experiment !== '') {
        gamesDataModified = gamesDataModified.slice(0, listSize);
    }
    const itemList = [];
    gamesDataModified.forEach((item) => {
        const title = querystring.escape(item.title);
        const obj = {
            type: 'image_card',
            data: {
                id: item.id,
                image_url: item.profile_image !== '' ? item.profile_image : item.image_url,
                deeplink: `doubtnutapp://games?game_title=${title}&game_url=${item.fallback_url}&game_id=${item.id}`,
                card_width: '4',
                card_ratio: '1:1',
                is_circle: true,
            },
        };
        itemList.push(obj);
    });

    if (experiment === '') {
        return itemList;
    }

    const finalData = {
        type: 'widget_parent',
        data: {
            title: StaticData.gamesHeadText(studentLocale),
            items: itemList,
            title_text_size: 14,
            is_title_bold: true,
        },
        extra_params: {
            widget_name: 'game',
            experiment,
        },
    };
    return finalData;
}

async function getLiveDataForNudge(db, config, studentId, studentClass, studentLocale, experiment) {
    let ccmArray = [];
    let finalData = {};
    const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
    if (Array.isArray(checkForPersonalisation) && checkForPersonalisation.length) {
        ccmArray = checkForPersonalisation.map((x) => x.ccm_id);
    }
    const libraryData = await CourseHelper.getLiveclassCarouselLatest(db, config, ccmArray, studentId, studentClass, studentLocale);

    if (libraryData.length > 0) {
        let freeDataList = [];
        libraryData.forEach((item) => {
            const freeData = item.items.filter((x) => x.data.is_free === 1);
            freeDataList = [...freeDataList, ...freeData];
        });

        const promise = [];
        freeDataList.forEach((item) => {
            promise.push(LiveClassMysql.getLiveDataByQid(db.mysql.read, item.data.id));
        });
        const allLiveData = await Promise.all(promise);
        const lectureLocale = studentLocale === 'hi' ? 'HINDI' : 'ENGLISH';
        const allLiveDataLocaleWise = allLiveData.filter((x) => x[0].meta_info === lectureLocale);

        const d = new Date();
        const currentTimeStamp = d.getTime();
        const hourMiliSeconds = 3600000; // 1 hour = 3600000ms

        const onGoing = [];
        const past = [];
        allLiveDataLocaleWise.forEach((item) => {
            item.forEach((i) => {
                if ((i.resource_type == 4 && i.stream_status === 'ACTIVE') || (i.resource_type == 1 && i.live_at_timestamp < currentTimeStamp && (i.live_at_timestamp + hourMiliSeconds) > currentTimeStamp)) {
                    onGoing.push(i);
                } else if (i.resource_type == 8 || (i.resource_type == 4 && i.live_at_timestamp != null && i.live_at_timestamp < (currentTimeStamp - hourMiliSeconds))) {
                    past.push(i);
                }
            });
        });

        let allItems = [...onGoing, ...past];
        // eslint-disable-next-line new-cap
        allItems = _.sortBy(allItems, (x) => new moment(x.live_at_timestamp)).reverse();
        allItems = _.uniqBy(allItems, (x) => parseInt(x.resource_reference));
        const listSize = 3;
        allItems = allItems.slice(0, listSize);

        const finalItems = [];
        allItems.forEach((item) => {
            const mainItem = freeDataList.filter((x) => x.data.id === item.resource_reference);
            delete mainItem[0].data.detail_id;
            finalItems.push(mainItem[0]);
        });

        if (finalItems.length != 0) {
            finalData = {
                type: 'widget_parent',
                widget_data: {
                    title: StaticData.liveClassHeadText(studentLocale),
                    items: finalItems,
                    is_vip: false,
                    title_text_size: 14,
                    is_title_bold: true,
                },
                extra_params: {
                    widget_name: 'live_class',
                    experiment,
                },
                layout_config: {
                    margin_top: 16,
                    bg_color: '#ffffff',
                },
                order: -1000,
            };
        }
    }
    return finalData;
}

module.exports = {
    getGamesDataForNudge,
    getLiveDataForNudge,
};
