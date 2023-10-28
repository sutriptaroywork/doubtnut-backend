const _ = require('lodash');
const bl = require('./camera.bl');
// const libraryHelper = require('../../helpers/library');
// const UtilityFlagr = require('../../../modules/Utility.flagr');
const { isStudyGroupEnabled } = require('../../v1/studyGroup/studyGroup.controller');
const CameraHelper = require('../../helpers/camera');
const Utility = require('../../../modules/utility');
const freeLiveClassHelper = require('../../helpers/freeLiveClass');
const SortingManager = require('../../helpers/sorting.helper');
const iconsContainer = require('../../../modules/containers/icons');
const D0UserManager = require('../../helpers/d0User.helper');
const CampaignMysql = require('../../../modules/mysql/campaign');
const StudentMysql = require('../../../modules/mysql/student');
const ReferAndEarnHelper = require('../../helpers/referAndEarn.helper');
const { CameraTooltipStrategyManager } = require('../../helpers/question/CameraTooltip.helper');
const ExperimentHelper = require('../../helpers/question/experiments.helper');
const dnShortsData = require('../../../data/dnShorts.data');
const CourseV2 = require('../../../modules/containers/coursev2');
const altAppData = require('../../../data/alt-app');

let db;
let config;

async function getShortsTimeoutFlagrResp(flagrName, studentId) {
    const obj = {};
    obj[`${flagrName}`] = {};
    const shortsTimeoutFlagrResp = await CourseV2.getFlagrResp(db, flagrName, studentId);
    if (_.get(shortsTimeoutFlagrResp, `${flagrName}.payload.enabled`, false)) {
        return shortsTimeoutFlagrResp[flagrName].payload.timeout;
    }
    return 30000;
}

async function getCameraSettings(req, _res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    try {
        const { student_id: studentId } = req.user;
        const packageValue = req.headers.package_name;

        const isFreeApp = packageValue === altAppData.freeAppPackageName;

        let { locale } = req.user;
        if (_.isEmpty(locale)) {
            locale = 'en';
        }
        const { version_code: versionCode, 'x-auth-token': xAuthToken, flagr_variation_ids: flagrVariationIds } = req.headers;
        const featureIds = _.split(flagrVariationIds, ',');
        const mappedLocale = (locale === 'hi') ? 'HINDI' : 'ENGLISH';

        let studentClass;
        studentClass = +(req.user.student_class) || 12;
        if (req.headers.country && req.headers.country.toLowerCase() == 'us') {
            studentClass = +(req.user.student_class) || 27;
        }
        const tooltipAttachment = await ExperimentHelper.getAttachment('camera_tooltip', {
            studentId,
            studentInfo: {
                xAuthToken,
                versionCode,
            },
        });
        const cameraTooltipLStrategyManager = new CameraTooltipStrategyManager();
        const cameraTooltipStrategy = cameraTooltipLStrategyManager.getStrategy(tooltipAttachment);
        const country = req.headers.country || 'IN';
        // eslint-disable-next-line prefer-const
        let { openCount, questionAskCount } = req.query;
        const twoExampleClassList = [6, 7, 8, 14];

        if (!req.query.openCount) {
            throw new Error('Open count is null');
        }
        let openCountModified = openCount;
        if (openCount > 3) {
            openCountModified = 3;
        }
        if (twoExampleClassList.includes(studentClass) && openCount > 2) {
            openCountModified = 2;
        }
        const settings = {
            cameraButtonHint: cameraTooltipStrategy.setCameraButtonHintData(country, locale),
            bottomOverlay: {
                info: bl.getCameraBottomOverlayInfo(studentClass),
                subjectList: await bl.getCameraBottomOverlaySubjectListNew(db, config, studentClass, locale, openCountModified, studentId),
            },

        };
        settings.camera_back_widgets = [];
        if (versionCode < 988) {
            if (versionCode > 917 && _.includes(featureIds, '1259')) {
                settings.camera_back_widgets = await CameraHelper.getCameraBackWidgets({
                    db,
                    config,
                    studentId,
                    studentClass,
                    studentLocale: locale,
                    openCount,
                    questionAskCount,
                    bottomOverlayData: settings.bottomOverlay,
                    mappedLocale,
                    versionCode,
                    xAuthToken,
                });
            }
        } else {
            settings.deeplink = isFreeApp ? '' : `doubtnutapp://bottom_sheet_widget?widget_type=camera_page_bottom_sheet&show_close_btn=true&openCount=${openCount}&questionAskCount=${questionAskCount}`;
        }

        let localeToBeUsed = locale;
        if (locale !== 'en' && locale !== 'hi') {
            localeToBeUsed = 'other';
        }
        const shortsData = {
            show_shorts: false,
            show_shorts_animation: false,
            shorts_animation_title: dnShortsData.camera_animation[localeToBeUsed],
            shorts_animation_timeout: 30000,
        };

        /* if (versionCode >= 1000 && versionCode <= 1010 && featureIds.includes('1716')) {
            // 20 ms
            const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(studentId);
            if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                const referralsByUser = await StudentMysql.getStudentsReferredByUser(db.mysql.read, studentId);
                settings.referral_widget_data = ReferAndEarnHelper.makeReferralCameraWidget(referralsByUser, locale);
            }
        } */
        let addCameraCount = false;
        if (versionCode >= 1010) {
            const d0UserManager = new D0UserManager(req);
            if (isFreeApp) {
                addCameraCount = true;
                settings.deeplink = '';
            } else if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                settings.d0_user_data = d0UserManager.getCameraSettingsResponse();
                addCameraCount = true;
                settings.camera_back_widgets = d0UserManager.getCtaForSampeQuestionWidget(settings.camera_back_widgets);
                settings.deeplink = `doubtnutapp://bottom_sheet_widget?widget_type=camera_page_bottom_sheet&show_close_btn=true&openCount=${openCount}&questionAskCount=${questionAskCount}`;
            } else if (req.headers.shorts_viewed_count < 3) {
                const shortsAnimationTimeout = await getShortsTimeoutFlagrResp('dn_shorts_animation_timeout', studentId);
                shortsData.show_shorts = true;
                shortsData.show_shorts_animation = true;
                shortsData.shorts_animation_timeout = shortsAnimationTimeout;
            } else {
                shortsData.show_shorts = true;
                shortsData.show_shorts_animation = false;
                /* if (req.headers.d0_qa_count >= 5) {
                            const referralsByUser = await StudentMysql.getStudentsReferredByUser(db.mysql.read, studentId);
                            if (referralsByUser.length < 5) {
                                settings.referral_widget_data = ReferAndEarnHelper.makeReferralCameraWidget(referralsByUser, locale);
                            }
                        } else {
                            const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(studentId);
                            if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                                const referralsByUser = await StudentMysql.getStudentsReferredByUser(db.mysql.read, studentId);
                                if (referralsByUser.length < 5) {
                                    settings.referral_widget_data = ReferAndEarnHelper.makeReferralCameraWidget(referralsByUser, locale);
                                }
                            }
                        } */
            }
        }

        settings.shorts_data = shortsData;
        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'Success',
            },
            data: settings,
        };
        if (addCameraCount) {
            responseData.meta.increment_keys = {
                camera_open_count: 1,
            };
        }
        _res.status(responseData.meta.code).json(responseData);
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

// async function getDeeplinkForLiveClassIconAB(xAuthToken, studentID) {
//     const flagData = { xAuthToken, body: { capabilities: { camera_page_live_class_icon: {} } } };
//     const flagrResponse = await UtilityFlagr.getFlagrResp(flagData);
//     const variant = _.get(flagrResponse, 'camera_page_live_class_icon.payload.variant', null);
//     const studentCcmData = await CourseMysqlV2.getCoursesClassCourseMapping(db.mysql.read, studentID);
//     if (variant === 2 && studentCcmData.length) {
//         return 'doubtnutapp://course_details?id=xxxx';
//     }
//     if (variant === 3 && studentCcmData.length) {
//         return 'doubtnutapp://course_category?category_id=xxxx&title=Apke liye Courses';
//     }
//     return 'doubtnutapp://library_tab';
// }

async function getBottomIcons(req, _res, next) {
    config = req.app.get('config');
    db = req.app.get('db');
    const { version_code: versionCode } = req.headers;
    const { student_id: studentID, student_class: studentClass } = req.user;
    let { flagr_variation_ids: flagrVariationIds } = req.headers;
    const packageValue = req.headers.package_name;

    try {
        if (flagrVariationIds && !_.isNull(flagrVariationIds)) {
            flagrVariationIds = flagrVariationIds.split(',');
            flagrVariationIds.unshift('1');
        }
        if (!flagrVariationIds) {
            flagrVariationIds = [1];
        }
        let { locale } = req.user;
        locale = locale === 'hi' ? 'hi' : 'en';
        const [totalEngagementTime] = await Promise.all([
            freeLiveClassHelper.getLast30DaysEngagement(studentID),
        ]);

        let campaignUser = false;
        if (req.user.campaign) {
            const campaignDetails = await CampaignMysql.getCampaignByName(db.mysql.read, req.user.campaign, 'Camera');
            if (!_.isEmpty(campaignDetails)) {
                campaignUser = true;
            }
        }

        const SortingHelper = new SortingManager(req);
        const studentPackageList = await SortingHelper.getSubscriptionDetails();
        let isPaidUser = false;
        if (studentPackageList.length > 0) {
            isPaidUser = true;
        }

        let finalIconsList = [];

        if (versionCode >= 1010) {
            const d0UserManager = new D0UserManager(req);
            if (!d0UserManager.checkingifCampaignedUser() && d0UserManager.checkD0Status() && d0UserManager.checkForFeatureShow()) {
                return next({ data: finalIconsList });
            }
        }

        let allIcons = packageValue === altAppData.freeAppPackageName ? await iconsContainer.getIconsByCategory(db, studentClass, locale, 'CAMERA_NAVIGATION_BUNIYAD', versionCode, flagrVariationIds) : await iconsContainer.getIconsByCategory(db, studentClass, locale, 'CAMERA_NAVIGATION', versionCode, flagrVariationIds);
        if (allIcons.length > 0) {
            allIcons = await SortingHelper.getSortedItems(allIcons);
        }
        let skipFeedIcon = false;
        for (let i = 0; i < allIcons.length; i++) {
            let iconIsToBeAdded = true;
            const iconsObj = {
                id: allIcons[i].feature_type,
                title: allIcons[i].title,
                deeplink: allIcons[i].deeplink,
                icon: allIcons[i].new_link ? allIcons[i].new_link : allIcons[i].link,
            };
            if (allIcons[i].feature_type === 'navigate_live_class') {
                if (isPaidUser && versionCode <= 891) {
                    allIcons[i].deeplink = `${allIcons[i].deeplink}${studentPackageList[0].assortment_id}`;
                }
                iconsObj.deeplink = (!isPaidUser && totalEngagementTime < 1200 && !campaignUser) ? 'doubtnutapp://library_tab?id=1&tag=free_classes&recreate=true' : allIcons[i].deeplink;
            }

            if (allIcons[i].feature_type === 'navigate_studygroup' && !Utility.isDnBrainlyPackageCloneAppRequestOrigin(req.headers) && versionCode <= 946) {
                const isStudyGroup = await isStudyGroupEnabled(req);
                if (isStudyGroup.enabled) {
                    skipFeedIcon = true;
                    iconsObj.deeplink = `${allIcons[i].deeplink}${isStudyGroup.isGroupExist}`;
                } else {
                    iconIsToBeAdded = false;
                }
            }

            if (allIcons[i].feature_type === 'navigate_feed' && skipFeedIcon) { continue; } else if (iconIsToBeAdded) {
                finalIconsList.push(iconsObj);
            }
        }
        finalIconsList = finalIconsList.slice(0, 4); /// as we can show only 4 navigation icons
        next({ data: finalIconsList });
    } catch (err) {
        console.log(err);
        next({ err });
    }
}

module.exports = {
    getCameraSettings,
    getBottomIcons,
};
