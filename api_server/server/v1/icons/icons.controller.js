let db;
let config;
const _ = require('lodash');

const iconsHelper = require('./icons.helper');
const iconsContainer = require('../../../modules/containers/icons');
const BranchContainer = require('../../../modules/containers/branch');
const helper = require('../../helpers/icons');
const { getIconsDetails } = require('../../v3/tesla/tesla.utils');
const StudentRedis = require('../../../modules/redis/student');
const IconsRedis = require('../../../modules/redis/icons');
const IconsMysql = require('../../../modules/mysql/icons');
const StudentMysql = require('../../../modules/mysql/student');
const SortingManager = require('../../helpers/sorting.helper');
const IconFormattingManager = require('../../helpers/iconFormatting.helper');
const freeLiveClassHelper = require('../../helpers/freeLiveClass');
const IconsData = require('../../../data/icons.data');

const StudentContainer = require('../../../modules/containers/student');
const { packageMapping } = require('../../../data/alt-app');
const CampaignMysql = require('../../../modules/mysql/campaign');
const Data = require('../../../data/data');
const altAppData = require('../../../data/alt-app');

async function geticonsByIconOrder(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_class } = req.user;
        // let time = moment().format('YYYY-MM-DD HH:mm:ss')
        // console.log(time);
        const data = await iconsContainer.geticonsByIconOrder(db, student_class);
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getCameraScreenIcon(req, res, next) {
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        const { student_id: studentId, student_class: studentClass, locale } = req.user;
        const { version_code: versionCode } = req.headers;
        const iconCount = req.params.icon_count || 4;

        const flagVariants = [1];

        const requestData = {
            studentId,
            versionCode,
            studentLocale: locale,
            studentClass,
            flagVariants,
            type: 'new',
        };

        const iconsList = await helper.makeIconData(db, config, requestData, false);
        const showItem = parseInt(iconCount) + 1;
        let iconsDetails = await getIconsDetails(iconsList);
        iconsDetails = iconsDetails.slice(0, iconCount);

        const iconsObj = {
            widget_data: {
                show_view_all: 1,
                shown_item_count: showItem,
                items: iconsDetails,
            },
            widget_type: 'widget_top_option',
            layout_config: {
                margin_top: 16,
                bg_color: '#ffffff',
            },
            order: -9600,
        };

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: iconsObj,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function increaseIconsCounts(req, res, next) {
    try {
        db = req.app.get('db');
        const { student_id: studentId, locale } = req.user;
        const { icon_id: iconId } = req.body;
        let iconCounts = await StudentRedis.getFavoriteCategories(db.redis.read, studentId);
        if (_.isNull(iconCounts)) {
            iconCounts = {};
        } else {
            iconCounts = JSON.parse(iconCounts);
        }
        if (!iconCounts[iconId]) {
            iconCounts[iconId] = 0;
        }
        iconCounts[iconId] += 1;
        StudentRedis.setFavoriteCategories(db.redis.write, studentId, iconCounts);

        let studentCcmIds = await StudentRedis.getStudentCcmIds(db.redis.read, studentId);
        studentCcmIds = JSON.parse(studentCcmIds);
        if (_.isNull(studentCcmIds)) {
            // if not available  in redis getting from mysql and caching in redis
            studentCcmIds = await StudentMysql.getCcmIdbyStudentId(db.mysql.read, studentId);
            studentCcmIds = studentCcmIds.map((id) => id.ccm_id);
            // adding the data to student redis cache
            StudentRedis.setStudentCcmIds(db.redis.write, studentId, studentCcmIds);
        }

        for (let i = 0; i < studentCcmIds.length; i++) {
            const ccmId = studentCcmIds[i];
            // eslint-disable-next-line no-await-in-loop
            let iconCountsForCcmId = await IconsRedis.getFavoriteIconsByCCMid(db.redis.read, ccmId, locale);
            if (_.isNull(iconCountsForCcmId)) {
                iconCountsForCcmId = {};
            } else {
                iconCountsForCcmId = JSON.parse(iconCountsForCcmId);
            }
            if (!iconCountsForCcmId[iconId]) {
                iconCountsForCcmId[iconId] = 0;
            }
            iconCountsForCcmId[iconId] += 1;
            // eslint-disable-next-line no-await-in-loop
            await IconsRedis.setFavoriteIconsByCCMid(db.redis.read, ccmId, locale, iconCountsForCcmId);
        }

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

async function getCategories(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');

        const packageValue = (!_.isEmpty(req.headers.package_name)) ? packageMapping[req.headers.package_name] : 'default';
        const {
            student_id: studentId, locale, student_class: studentClass, user_assortment: userAssortment, campaign,
        } = req.user;
        const studentCategoryLocale = (locale == 'hi') ? 'hi' : 'en';

        const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
        let studentCcmIds = await StudentContainer.getStudentCcmIds(db, studentId);
        if (!studentCcmIds.length) {
            studentCcmIds = IconsData.defaultCcmIds[studentClass];
        }
        let categories = [];
        if (campaign) {
            categories = await IconsMysql.getCategoriesByCampaignAndCcmid(db, versionCode, studentCcmIds, campaign, studentCategoryLocale, packageValue);

            if (!categories.length) {
                categories = await IconsMysql.getCategoriesByCampaignIdAndClass(db, versionCode, studentClass, campaign, studentCategoryLocale, packageValue);
            }
        }

        if (!categories.length) {
            categories = await IconsMysql.getCategoriesByCcmId(db, versionCode, studentCcmIds, studentCategoryLocale, packageValue);
            if (!categories.length) {
                categories = await IconsMysql.getCategoriesByClass(db, versionCode, studentClass, studentCategoryLocale, packageValue);
            }
        }
        const packageName = req.headers.package_name;
        const isFreeApp = packageName === altAppData.freeAppPackageName;

        const widgets = await iconsHelper.getAllCategoryWidgets(db, categories, studentId, studentCategoryLocale, versionCode, userAssortment, studentClass, studentCcmIds, config, xAuthToken, isFreeApp);

        if (versionCode > 870 && studentClass != 14) {
            const ncertTitles = Data.ncertNewFlowTitleArr;
            for (let i = 0; i < widgets.length; i++) {
                const x = widgets[i];
                const ncertIndex = x.data.items.findIndex((item) => ncertTitles.includes(item.title_one));
                if (ncertIndex > -1) {
                    /* eslint-disable no-await-in-loop */
                    x.data.items = await helper.ncertTopIconDeeplinkCategorisedHomepage(db, x.data.items, studentClass, studentId, 'new_flow');
                }
            }
        }
        const data = {
            header_title: 'All Categories',
            widgets,
        };
        return next({ data });
    } catch (err) {
        return next({ err });
    }
}

async function getAllIconsByScreen(req, res, next) {
    const response = {};
    db = req.app.get('db');
    config = req.app.get('config');
    try {
        const { student_class: studentClass, locale } = req.user;
        const { version_code: versionCode } = req.headers;
        let { flagr_variation_ids: flagrVariationIds } = req.headers;
        const { screen_name: screenName } = req.params;
        const iconsList = [];

        if (!_.isNull(flagrVariationIds)) {
            flagrVariationIds = flagrVariationIds.split(',');
        }
        flagrVariationIds.unshift('1');

        const iconFormattingManager = new IconFormattingManager(req);
        const studentCourseOrClassSubcriptionDetails = iconFormattingManager.getSubscriptionDetails();

        let allIcons = await iconsContainer.getIconsByCategory(db, studentClass, locale, screenName, versionCode, flagrVariationIds, studentCourseOrClassSubcriptionDetails);
        if (allIcons.length > 0) {
            allIcons = await iconFormattingManager.getFormattedIcons(allIcons);

            const SortingHelper = new SortingManager(req);
            allIcons = await SortingHelper.getSortedItems(allIcons);

            if (allIcons.length > 0) {
                allIcons.forEach((x) => {
                    iconsList.push({
                        widget_type: 'widget_icon_cta',
                        widget_data: {
                            id: x.id,
                            title: x.title,
                            icon: x.link,
                            deepLink: x.deeplink,
                        },
                    });
                });
            }
        }

        const iconsFinalResponse = {
            title: locale === 'hi' ? 'All Options' : 'All Options',
            widgets: [
                {
                    widget_data: {
                        scroll_direction: 'grid',
                        grid_span_count: 4,
                        items: iconsList,
                    },
                    widget_type: 'widget_parent',
                    order: 1,
                },
            ],
        };
        response.data = iconsFinalResponse;
    } catch (e) {
        response.err = e;
    }
    return next(response);
}

async function getAppNavigationIcons(req, res, next) {
    try {
        db = req.app.get('db');
        config = req.app.get('config');
        const { student_id: studentId, locale, student_class: studentClass } = req.user;
        const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
        let { flagr_variation_ids: flagVariantsArr } = req.headers;
        if (flagVariantsArr) {
            flagVariantsArr = _.split(flagVariantsArr, ',');
            flagVariantsArr.unshift('1');
        } else {
            flagVariantsArr = ['1'];
        }

        let finalIconsObj = {};
        let homepageNavIcons = await iconsContainer.getIconsByCategory(db, studentClass, locale, 'APP_NAVIGATION', versionCode, flagVariantsArr);
        if (!_.isEmpty(homepageNavIcons)) {
            const SortingHelper = new SortingManager(req);
            homepageNavIcons = await SortingHelper.getSortedItems(homepageNavIcons);

            const [totalEngagementTime] = await Promise.all([
                freeLiveClassHelper.getLast30DaysEngagement(studentId),
            ]);
            const studentPackageList = await SortingHelper.getSubscriptionDetails();
            let isPaidUser = false;
            if (studentPackageList.length > 0) {
                isPaidUser = true;
            }

            let campaignUser = false;
            if (req.user.campaign) {
                const campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Feed');
                if (!_.isEmpty(campaignDetails)) {
                    campaignUser = true;
                }
            }
            if (!_.isEmpty(homepageNavIcons)) {
                homepageNavIcons = homepageNavIcons.slice(0, 4);
                finalIconsObj = helper.makeAppNavigationIconsListWidget(homepageNavIcons, totalEngagementTime, isPaidUser, campaignUser, versionCode);
            }
        }
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data: finalIconsObj,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

module.exports = {
    geticonsByIconOrder,
    getCameraScreenIcon,
    increaseIconsCounts,
    getCategories,
    getAllIconsByScreen,
    getAppNavigationIcons,
};
