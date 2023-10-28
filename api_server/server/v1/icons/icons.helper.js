/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const iconsMysql = require('../../../modules/mysql/icons');
const scholarshipHelper = require('../scholarship/scholarship.helper');
const HomepageWidgetHelper = require('../../widgets/homepage');
const CourseContainer = require('../../../modules/containers/coursev2');
const StudentContainer = require('../../../modules/containers/student');
const IconsData = require('../../../data/icons.data');
const IconsRedis = require('../../../modules/redis/icons');
const StudentRedis = require('../../../modules/redis/student');
const IconsContainer = require('../../../modules/containers/icons');
const config = require('../../../config/config');
const dnExamRewardsHelper = require('../dn_exam_rewards/dn_exam_rewards.helper');

async function getDnCeoIcon(db, studentId, versionCode = 970) {
    const iconData = await IconsContainer.getDnCeoIcon(db, versionCode);
    if (iconData.length > 0) {
        return {
            icon_id: iconData[0].id,
            icon: iconData[0].image_url,
            title_one: iconData[0].title,
            title_one_text_size: '10',
            title_one_text_color: '#250440',
            deeplink: iconData[0].deeplink,
        };
    }
}

async function getMyCoursesIcon(db, studentId, userAssortment, locale, config) {
    let deeplink;
    if (userAssortment) {
        deeplink = +userAssortment === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : `doubtnutapp://course_details?id=${userAssortment}`;
    }

    const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
    const packageType = userActivePackages.filter((e) => e.assortment_type === 'course' && e.assortment_id !== 138829);
    const etoosAssortment = userActivePackages.filter((e) => e.assortment_id === 138829);
    if (!packageType.length) {
        return null;
    }
    if (!deeplink) {
        deeplink = ((packageType.length > 1) || (etoosAssortment.length && packageType.length)) ? 'doubtnutapp://course_select' : `doubtnutapp://course_details?id=${packageType[packageType.length - 1].assortment_id}`;
    }
    return {
        icon_id: 339,
        icon: `${config.staticCDN}engagement_framework/35454CD4-CD82-99C2-3053-733F809BE9ED.webp`,
        title_one: locale === 'hi' ? 'मेरा कोर्स' : 'My Courses',
        title_one_text_size: '10',
        title_one_text_color: '#250440',
        deeplink,
    };
}

function getViewAllIcon(locale) {
    const deeplink = 'doubtnutapp://icons';
    return {
        icon_id: 340,
        icon: `${config.staticCDN}engagement_framework/7EAEC3DC-B4BB-3316-4617-C4A3D7861285.webp`,
        title_one: locale === 'hi' ? 'सभी देखें' : 'View All',
        title_one_text_size: '10',
        title_one_text_color: '#250440',
        deeplink,
    };
}

async function getCategory(db, carousel, studentId, studentCcmIds, studentLocale, versionCode, userAssortment, config, xAuthToken, isFreeApp) {
    if ((carousel.ccmid_list && carousel.ccmid_list.trim() && !studentCcmIds.some((item) => carousel.ccmid_list.split(',').map(Number).includes(item)))) {
        return;
    }
    let data;
    const iconsList = carousel.icons_list ? carousel.icons_list.split(',').map(Number) : [];// allowed icons for favorite carousel and icons list for category carousel
    if (iconsList.length) {
        data = await iconsMysql.getCategoryIconsForHomepage(db.mysql.read, iconsList, null, versionCode);
    } else {
        return;
    }
    // filtering icons which are allowed for specific ccm_ids
    data = data.filter((item) => studentCcmIds.some((a) => !item.ccmid_list || item.ccmid_list.split(',').map(Number).includes(a)));
    data.sort((a, b) => iconsList.map(Number).indexOf(a.id) - iconsList.map(Number).indexOf(b.id));

    if (!_.isNull(data) && data.length) {
        for (let i = 0; i < data.length; i++) {
            if (!_.isEmpty(data) && data[i].description && data[i].description.includes('scholarship_test_')) {
                const type = data[i].description.replace('scholarship_test_', '');
                data[i].deeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentId);
            }

            if (!_.isEmpty(data) && data[i].description && data[i].description.includes('dn_exam_rewards')) {
                data[i].deeplink = await dnExamRewardsHelper.redirect(12, versionCode, studentLocale, xAuthToken);
            }

            if (!_.isEmpty(data) && data[i].description && data[i].description.includes('invite_and_earn')) {
                if (versionCode >= 988) {
                    data[i].deeplink = 'doubtnutapp://referral';
                } else {
                    data[i].deeplink = 'doubtnutapp://referral_page';
                }
            }
        }
        if (data.length) {
            const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
            const ceoIcon = isFreeApp ? null : await getDnCeoIcon(db, studentId, versionCode);
            if (userActivePackages.length >= 1) {
                if (carousel.sharing_message.includes('Prepar') || carousel.title.includes('Prepar') || carousel.title === 'Favourite Categories For You') {
                    const myCoursesIcon = await getMyCoursesIcon(db, studentId, userAssortment, studentLocale, config);
                    return HomepageWidgetHelper.getCategoryIconsWidget({
                        studentLocale,
                        data,
                        carousel,
                        myCoursesIcon,
                        ceoIcon,
                    });
                }
            }
            if (carousel.sharing_message.includes('Prepar') || carousel.title.includes('Prepar') || carousel.title === 'Favourite Categories For You') {
                return HomepageWidgetHelper.getCategoryIconsWidget({
                    studentLocale,
                    data,
                    carousel,
                    ceoIcon,
                });
            }

            return HomepageWidgetHelper.getCategoryIconsWidget({
                studentLocale,
                data,
                carousel,
            });
        }
    }
}
async function getAllCategoryWidgets(db, categoriesForClass, studentId, studentLocale, versionCode, userAssortment, studentClass, studentCcmIds, confix, xAuthToken, isFreeApp) {
    const widgetPromises = [];
    categoriesForClass.forEach((carousel) => widgetPromises.push(getCategory(db, carousel, studentId, studentCcmIds, studentLocale, versionCode, userAssortment, confix, xAuthToken, isFreeApp)));
    const widgets = await Promise.all(widgetPromises);
    return widgets.filter(Boolean);
}
async function getFavoriteIconsForCcmIds(db, studentCcmIds, iconsList, studentClass, versionCode, locale) {
    const iconCounts = {};

    for (let i = 0; i < studentCcmIds.length; i++) {
        let temp = await IconsRedis.getFavoriteIconsByCCMid(db.redis.read, studentCcmIds[i], locale);
        if (!_.isNull(temp)) {
            temp = JSON.parse(temp);
            Object.keys(temp).forEach((x) => { iconCounts[x] = iconCounts[x] ? temp[x] : iconCounts[x] + temp[x]; });
        }
    }
    // making sure icons are part of possible icons in caraousel for this class
    Object.keys(iconCounts).forEach((item) => {
        if (!iconsList.map(Number).includes(Number(item))) {
            delete iconCounts[item];
        }
    });
    // get icons from table
    let data;
    if (Object.keys(iconCounts).length > 0) {
        data = await iconsMysql.getCategoryIconsForHomepage(db.mysql.read, Object.keys(iconCounts), studentClass, versionCode);
    } else {
        return [];
    }
    data = data.filter((item) => studentCcmIds.some((a) => !item.ccmid_list || item.ccmid_list.split(',').map(Number).includes(a)));

    const result = Object.keys(iconCounts);
    result.sort((a, b) => iconCounts[a] - iconCounts[b]);
    result.reverse();
    data.sort((a, b) => result.map(Number).indexOf(a.id) - result.map(Number).indexOf(b.id));
    return data;
}

async function getFavoriteIconsForStudent(db, studentId, studentCcmIds, studentClass, iconsList, versionCode) {
    let iconCounts = await StudentRedis.getFavoriteCategories(db.redis.read, studentId);
    if (_.isNull(iconCounts)) {
        iconCounts = {};
    } else {
        iconCounts = JSON.parse(iconCounts);
    }
    Object.keys(iconCounts).forEach((item) => {
        if (!iconsList.map(Number).includes(Number(item))) {
            delete iconCounts[item];
        }
    });

    let data = [];
    if (Object.keys(iconCounts).length > 0) {
        data = await iconsMysql.getCategoryIconsForHomepage(db.mysql.read, Object.keys(iconCounts), studentClass, versionCode);
    }
    data = data.filter((item) => studentCcmIds.some((a) => !item.ccmid_list || item.ccmid_list.split(',').map(Number).includes(a)));

    const result = Object.keys(iconCounts);
    result.sort((a, b) => iconCounts[a] - iconCounts[b]);
    result.reverse();
    // sorting based on count
    data.sort((a, b) => result.map(Number).indexOf(a.id) - result.map(Number).indexOf(b.id));
    return data;
}

async function getOnlineClassesIcons(db, studentClass, studentCcmIds, versionCode) {
    let data = await iconsMysql.getIconsByTitleAndClass(db.mysql.read, 'Online Classes', studentClass, versionCode);
    // filtering icons which are allowed in specific ccm_ids only
    data = data.filter((item) => studentCcmIds.some((a) => !item.ccmid_list || item.ccmid_list.split(',').map(Number).includes(a)));
    return data;
}

async function getCourseIcons(db, studentClass, studentCcmIds, versionCode) {
    let data = await iconsMysql.getIconsByTitleAndClass(db.mysql.read, 'Courses', studentClass, versionCode);
    // filtering icons which are allowed in specific ccm_ids only
    data = data.filter((item) => studentCcmIds.some((a) => !item.ccmid_list || item.ccmid_list.split(',').map(Number).includes(a)));
    return data;
}

async function getFixedIconsForClass(db, studentClass, variant, versionCode) {
    let iconIds;
    if (+variant === 4) {
        iconIds = IconsData.fixedIconsIdByClass[studentClass];
    } else {
        iconIds = IconsData.fixedIconsIdByClassFor8IconsVariant[studentClass];
    }
    return iconsMysql.getCategoryIconsForHomepage(db.mysql.read, iconIds, studentClass, versionCode);
}
async function countOfIconsInFavouriteCategory(versionCode, db, studentId) {
    if (versionCode >= 955) {
        const flagrResp = await CourseContainer.getFlagrResp(db, 'favourite_icons_for_you_size_experiment', studentId);
        // static async getFlagrResp(db, exp, studentId) {

        return _.get(flagrResp, 'favourite_icons_for_you_size_experiment.payload.count', 4);
    }
    return 4;
}
async function getFavoriteIcons(db, carousel, userAssortment, studentId, locale, studentClass, iconsList, versionCode, config, xAuthToken, isFreeApp) {
    const studentCcmIds = await StudentContainer.getStudentCcmIds(db, studentId);

    const countOfIconsRequired = await countOfIconsInFavouriteCategory(versionCode, db, studentId);
    let finalIconData;
    if (+countOfIconsRequired === 4) {
        const promises = [getFixedIconsForClass(db, studentClass, countOfIconsRequired, versionCode), getFavoriteIconsForStudent(db, studentId, studentCcmIds, studentClass, iconsList, versionCode), getFavoriteIconsForCcmIds(db, studentCcmIds, iconsList, studentClass, versionCode, locale)];
        const resolvedPromises = await Promise.all(promises);
        const fixedIcons = resolvedPromises[0];
        const studentFavoriteIcons = resolvedPromises[1];
        const ccmIdFavouriteIcons = resolvedPromises[2];
        // overwriting fixed icons with online classes and courses icons, refer VIP-1138
        if (studentFavoriteIcons.length < 3) {
            const [onlineClassesIcons, coursesIcons] = await Promise.all([getOnlineClassesIcons(db, studentClass, studentCcmIds, versionCode), isFreeApp ? [] : getCourseIcons(db, studentClass, studentCcmIds, versionCode)]);
            finalIconData = _.uniqBy([...onlineClassesIcons.slice(0, 1), ...coursesIcons.slice(0, 1), ...fixedIcons, ...studentFavoriteIcons.slice(0, 3), ...ccmIdFavouriteIcons], 'id');
        } else {
            finalIconData = _.uniqBy([...fixedIcons, ...studentFavoriteIcons.slice(0, 3), ...ccmIdFavouriteIcons], 'id');
        }
        finalIconData = [...finalIconData.splice(0, 3)];
        const onlineClassesInFavorites = finalIconData.filter((item) => item.title === 'Online Classes');
        const coursesInFavorites = finalIconData.filter((item) => item.title === 'Courses');
        if (onlineClassesInFavorites.length > 2) {
            const onlineIconsInFinal = finalIconData.filter((item) => item.title === 'Online Classes');
            const rest = finalIconData.filter((item) => item.title !== 'Online Classes');
            const ccmIdFavouriteIconsWithoutOnlineClass = ccmIdFavouriteIcons.filter((item) => item.title !== 'Online Classes');
            finalIconData = [...rest, ...onlineIconsInFinal.splice(0, 2), ...ccmIdFavouriteIconsWithoutOnlineClass];
            finalIconData = _.uniqBy(finalIconData, 'id');
            finalIconData = [...finalIconData.splice(0, 3)];
        }
        if (coursesInFavorites.length > 2) {
            const coursesInFinal = finalIconData.filter((item) => item.title === 'Courses');
            const rest = finalIconData.filter((item) => item.title !== 'Courses');
            const ccmIdFavouriteIconsWithoutCourses = ccmIdFavouriteIcons.filter((item) => item.title !== 'Courses');
            finalIconData = [...rest, ...coursesInFinal.splice(0, 2), ...ccmIdFavouriteIconsWithoutCourses];
            finalIconData = _.uniqBy(finalIconData, 'id');
            finalIconData = [...finalIconData.splice(0, 3)];
        }
    } else {
        const promises = [getFixedIconsForClass(db, studentClass, countOfIconsRequired, versionCode), getFavoriteIconsForStudent(db, studentId, studentCcmIds, studentClass, iconsList, versionCode), getFavoriteIconsForCcmIds(db, studentCcmIds, iconsList, studentClass, versionCode, locale), getOnlineClassesIcons(db, studentClass, studentCcmIds, versionCode), isFreeApp ? [] : getCourseIcons(db, studentClass, studentCcmIds, versionCode)];
        const resolvedPromises = await Promise.all(promises);
        const fixedIcons = resolvedPromises[0];
        const studentFavoriteIcons = resolvedPromises[1];
        const ccmIdFavouriteIcons = resolvedPromises[2];
        const onlineClassesIcons = resolvedPromises[3];
        const coursesIcons = resolvedPromises[4];
        finalIconData = _.uniqBy([...fixedIcons, ...onlineClassesIcons.slice(0, 1), ...coursesIcons.slice(0, 1), ...studentFavoriteIcons.slice(0, 3), ...ccmIdFavouriteIcons], 'id');
        finalIconData = [...finalIconData.splice(0, 7)];

        const onlineClassesInFavorites = finalIconData.filter((item) => item.title === 'Online Classes');
        const coursesInFavorites = finalIconData.filter((item) => item.title === 'Courses');
        if (onlineClassesInFavorites.length > 2) {
            const onlineIconsInFinal = finalIconData.filter((item) => item.title === 'Online Classes');
            const rest = finalIconData.filter((item) => item.title !== 'Online Classes');
            const ccmIdFavouriteIconsWithoutOnlineClass = ccmIdFavouriteIcons.filter((item) => item.title !== 'Online Classes');
            finalIconData = [...rest, ...onlineIconsInFinal.splice(0, 2), ...ccmIdFavouriteIconsWithoutOnlineClass];
            finalIconData = _.uniqBy(finalIconData, 'id');
            finalIconData = [...finalIconData.splice(0, 7)];
        }
        if (coursesInFavorites.length > 2) {
            const coursesInFinal = finalIconData.filter((item) => item.title === 'Courses');
            const rest = finalIconData.filter((item) => item.title !== 'Courses');
            const ccmIdFavouriteIconsWithoutCourses = ccmIdFavouriteIcons.filter((item) => item.title !== 'Courses');
            finalIconData = [...rest, ...coursesInFinal.splice(0, 2), ...ccmIdFavouriteIconsWithoutCourses];
            finalIconData = _.uniqBy(finalIconData, 'id');
            finalIconData = [...finalIconData.splice(0, 7)];
        }
    }

    if (isFreeApp) {
        finalIconData = finalIconData.filter((item) => (!['Courses', 'Khelo and Jeeto', 'Daily Attendance Reward', 'Daily Goal', 'Daily Attendance Reward'].includes(item.title)));
        finalIconData = finalIconData.filter((item) => (!(item.description && item.description.includes('scholarship_test_'))));
    }

    if (finalIconData.length) {
        for (let i = 0; i < finalIconData.length; i++) {
            if (!_.isEmpty(finalIconData) && finalIconData[i].description && finalIconData[i].description.includes('scholarship_test_')) {
                const type = finalIconData[i].description.replace('scholarship_test_', '');
                finalIconData[i].deeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentId);
            }

            if (!_.isEmpty(finalIconData) && finalIconData[i].description && finalIconData[i].description.includes('invite_and_earn')) {
                finalIconData[i].deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://doubtnut.com/referral?sid=${studentId}`;
            }
        }
        const userActivePackages = await CourseContainer.getUserActivePackages(db, studentId);
        const ceoIcon = isFreeApp ? null : await getDnCeoIcon(db, studentId, versionCode);
        if (userActivePackages.length >= 1) {
            if (carousel.sharing_message.includes('Prepar') || carousel.title.includes('Prepar') || carousel.title === 'Favourite Categories For You') {
                const myCoursesIcon = await getMyCoursesIcon(db, studentId, userAssortment, locale, config);
                return HomepageWidgetHelper.getCategoryIconsWidget({
                    studentLocale: locale,
                    data: finalIconData,
                    carousel,
                    myCoursesIcon,
                    viewAllIcon: getViewAllIcon(locale, config),
                    maxlength: countOfIconsRequired,
                    versionCode,
                    ceoIcon,
                });
            }
        }
        return HomepageWidgetHelper.getCategoryIconsWidget({
            studentLocale: locale,
            data: finalIconData,
            carousel,
            myCoursesIcon: null,
            viewAllIcon: getViewAllIcon(locale, config),
            maxlength: countOfIconsRequired,
            versionCode,
            ceoIcon,
        });
    }
    // return finalIconData;

    // filtering icons which are allowed in specific ccm_ids only
}

module.exports = {
    getCategory,
    getMyCoursesIcon,
    getAllCategoryWidgets,
    getFavoriteIcons,
    getDnCeoIcon,
};
