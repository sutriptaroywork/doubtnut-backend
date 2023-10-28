/* eslint-disable no-shadow */
const _ = require('lodash');
const moment = require('moment');
const StudentCourseMapping = require('../../../modules/studentCourseMapping');
const HomepageContainer = require('../../../modules/containers/homepage');
const Utility = require('../../../modules/utility');
const CourseHelper = require('../../helpers/course');
const NudgeHelper = require('../../helpers/nudge');
const NudgeMysql = require('../../../modules/mysql/nudge');
const CourseMysqlv2 = require('../../../modules/mysql/coursev2');
const BranchContainer = require('../../../modules/containers/branch');
const CourseContainer = require('../../../modules/containers/coursev2');
const config = require('../../../config/config');
const WidgetHelper = require('../../widgets/liveclass');
const TgHelper = require('../../helpers/target-group');
const { getTrendingCourseWidget } = require('../../v6/course/course.helper');
const { generateAssortmentArray } = require('../../v6/course/course.controller')
const { buildStaticCdnUrl } = require('../../helpers/buildStaticCdnUrl');
const CourseRedis = require('../../../modules/redis/coursev2');
const { getTrendingCoursesForFeed } = require('./feed.helper')

const {
    getPrevYearsData,
    getHindiTitles,
    getNcertModifiedData,
} = require('./tesla.utils');
const Data = require('../../../data/data');

const scholarshipHelper = require('../../v1/scholarship/scholarship.helper');

const HomepageDynamicHelper = require('./homepageDynamicHelper');

// Static Constants  --------------------------------

// const base_url = `${config.cdn_url}q-thumbnail/`;
// const cdn_url = `${config.cdn_url}images/`;

async function getHomeCarouselsByCampaignAndCcmid({ mysql }, flagVariants, versionCode, studentId, campaign, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
        from feed_caraousel
        where is_active = 1
            and flagVariant in (?)
            and min_version_code < ?
            and max_version_code >= ?
            and (
                ccm_id in (
                            select ccm_id  from (select * from student_course_mapping where student_id = ?) as a
                            inner join
                            (select * from class_course_mapping where personalisation_active =1) as b
                            on a.ccm_id = b.id
                        )
            )
            and locale = ?
            and package = ?
            and type in ('COURSES', 'NUDGE','TRENDING_EXAM','TRENDING_BOARD')
        group by type, data_type, title
        order by caraousel_order
        asc`;
    const params = [flagVariants, versionCode, versionCode, studentId, studentLocale, packageValue];
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsByCampaignIdAndClass({ mysql }, flagVariants, versionCode, studentClass, campaign, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
        from feed_caraousel
        where is_active = 1
            and flagVariant in (?)
            and min_version_code < ?
            and max_version_code >= ?
            and class = ?
            and locale = ?
            and package = ?
            and type in ('COURSES', 'NUDGE','TRENDING_EXAM','TRENDING_BOARD')
        group by type, data_type, title
        order by caraousel_order
        asc`;
    const params = [flagVariants, versionCode, versionCode, studentClass, studentLocale, packageValue];
    return mysql.read.query(sql, params);
}

async function getHomeCarouselsByCcmId({ mysql }, flagVariants, versionCode, studentId, studentLocale, packageValue = 'default') {
    const sql = `select id,class,type,locale,campaign, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
    from feed_caraousel
    where is_active = 1
        and locale = ?
        and package = ?
    group by type, data_type, title
    order by carousel_position
    asc`;
    const params = [studentLocale, packageValue];
    return mysql.read.query(sql, params);
}

async function getHomeCaraouselByClass({ mysql }, flagVariants, versionCode, studentClass, studentLocale, packageValue) {
    const sql = `select id,class,type,locale, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id, secondary_data
                from feed_caraousel
                where is_active = 1
                    and flagVariant in (?)
                    and min_version_code < ?
                    and max_version_code >= ?
                    and class = ?
                    and locale = ?
                    and package = ?
                    and campaign is NULL
                    and type in ('COURSES', 'NUDGE','TRENDING_EXAM','TRENDING_BOARD')
                    order by caraousel_order asc`;
    const params = [flagVariants, versionCode, versionCode, studentClass, studentLocale, packageValue];
    return mysql.read.query(sql, params);
}
async function getCaraouselId({ mysql }, locale, campaign, type, studentClass) {
    const sql = 'select id from home_caraousels where locale = ? and campaign = ? and type = ? limit 1 ';
    return mysql.read.query(sql, [locale, campaign, type]);
}

async function getLandingCaraousel({ mysql }, studentClass, studentLocale) {
    const sql = 'select * from course_carousel where class=? and is_active=1 and locale=? order by carousel_order';
    return mysql.read.query(sql, [studentClass, studentLocale]);
}

async function getNudgeByTG(db, studentId, studentClass, studentLocale, nudges) {
    if (nudges.length) {
        let i = 0;
        while (i < nudges.length) {
            let tgCheck = true;
            if (nudges[i].target_group) {
                // eslint-disable-next-line no-await-in-loop
                tgCheck = await TgHelper.targetGroupCheck({
                    db, studentId, tgID: nudges[i].target_group, studentClass, locale: studentLocale,
                });
            }
            if (tgCheck === false) {
                nudges.splice(i, 1);
                --i;
            }
            ++i;
        }
    }
    return nudges;
}

async function getCoursesForFeedCarousel(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate) {
    const widgetAttributes = {
        widget_type: 'widget_parent',
        layout_config: {
            margin_top: 16,
            bg_color: '#ffffff',
        },
        order: carousel.caraousel_order,
    };
    // * If flagVariant is 982 and class is not 14 then dont display old popular courses for home page as it will come on top of camera v1/course/widgets
    if (flagVariants.indexOf('982') >= 0 && +studentClass !== 14) {
        return;
    }
    let nonTrials = 0;
    for (let i = 0; i < studentCourseOrClassSubcriptionDetails.length; i++) {
        if (studentCourseOrClassSubcriptionDetails[i].amount != -1) {
            nonTrials++;
        }
    }
    let paidCourses = await CourseHelper.getPaidAssortmentsData({
        db,
        studentClass,
        config,
        versionCode,
        studentId,
        studentLocale,
        xAuthToken,
        page: 'HOMEPAGE',
        pznElasticSearchInstance,
    });
    paidCourses = paidCourses ? paidCourses.items : [];
    if (paidCourses.length) {
        return {
            widget_data: {
                title: studentLocale === 'hi' ? 'अतिरिक्त अंक के लिए पाठ्यक्रम' : 'Courses for Extra Marks',
                items: [...paidCourses],
                id: `${carousel.carousel_id}`,
                is_et_reorder: true,
            },
            ...widgetAttributes,
        };
    }
}

async function getWidgetNudgeForFeedCarousel(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper) {
    let nudges = await CourseContainer.getByTypeAndEvent(db, 'widget_nudge', 'homepage', studentClass);
    if (!nudges.length) {
        nudges = await NudgeMysql.getByTypeAndEventFeed(db.mysql.read, 'widget_nudge', 'homepage', studentClass);
    }
    if (nudges.length) {
        const checkLastShownTime = await NudgeHelper.checkEligiblityForRenewalNudge({
            db,
            studentID: studentId,
            assortmentID: nudges[0].id,
        });
        if (checkLastShownTime) {
            nudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, nudges);
            if (nudges.length) {
                let rewardDeeplink;
                if (nudges[0].coupon_id === 'REWARD') {
                    if (isDropper) return;
                    if (studentLocale === 'hi' && (nudges[0].id === 149 || nudges[0].id === 147)) {
                        nudges[0] = nudges[1] || nudges[0];
                    } else if (studentLocale !== 'hi' && (nudges[0].id === 148 || nudges[0].id === 150)) {
                        nudges[0] = nudges[1] || nudges[0];
                    }
                    rewardDeeplink = await CourseHelper.getRewardBannerDeeplink(db, studentId);
                    if (_.isNull(rewardDeeplink)) return;
                }
                nudges[0].is_banner = !nudges[0].text;
                const nudgeWidget = WidgetHelper.getRenewalNudgesWidget({
                    config,
                    result: nudges,
                    locale: studentLocale,
                    nudgeType: 'nudge',
                    assortmentID: nudges[0].id,
                    rewardDeeplink,
                });
                if (nudgeWidget.data.deeplink.includes('scholarship')) {
                    const type = nudges[0].deeplink.replace('doubtnutapp://course_details?id=scholarship_test_', '');
                    const scholarshipLandingDeeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentId);
                    nudgeWidget.data.deeplink = scholarshipLandingDeeplink;
                }
                return {
                    widget_data: nudgeWidget.data,
                    widget_type: 'widget_nudge',
                    layout_config: {
                        margin_top: 16,
                        bg_color: '#ffffff',
                    },
                    order: carousel.caraousel_order,
                };
            }
        }
    }
}

async function getCarouselsForFeed(db, config, studentId, versionCode, flagVariants, studentClass, studentLocale, { source, home_page_experiment }, { country = null, 'x-auth-token': xAuthToken }, isDropper, pznElasticSearchInstance, registeredDate, mobile, forceShowAllCategories, showHomepageCategories, userAssortment, packageValue, campaign) {
    let ccmArray = [];
    let homeCarouselsData = [];
    const base_url = `${config.staticCDN}q-thumbnail/`;
    // Check For Personalization
    const checkForPersonalisation = await StudentCourseMapping.checkForActiveStudentPersonalisationOptin(db.mysql.read, studentId);
    // check for package

    const carouselsLocale = (studentLocale === 'hi') ? 'hi' : 'en';
    homeCarouselsData = await getHomeCarouselsByCcmId(db, flagVariants, versionCode, studentId, carouselsLocale, packageValue);
    const showFavoriteCount = 7;
    // Over write homeCarouselsData If source Is Non Home To Render Only App_Banners if not return empty array
    // return 'test';
    if (studentLocale !== 'en') {
        const localisation_promises = [];
        for (let m = 0; m < homeCarouselsData.length; m++) {
            if ('id' in homeCarouselsData[m]) {
                localisation_promises.push(HomepageContainer.getHomeCaraouselStringsLocalised(db, config, versionCode, homeCarouselsData[m].id, studentLocale));
            }
        }
        const resolvedLocalisationPromises = await Promise.all(localisation_promises);
        for (let n = 0, l = 0; n < homeCarouselsData.length; n++) {
            if ('id' in homeCarouselsData[n]) {
                if (!_.isEmpty(resolvedLocalisationPromises[l])) {
                    homeCarouselsData[n].title = (resolvedLocalisationPromises[l].translation !== '') ? resolvedLocalisationPromises[l].translation : homeCarouselsData[n].title;
                }
                l++;
            }
        }
    }
    for (let i = 0; i < homeCarouselsData.length; i++) {
        // eslint-disable-next-line no-await-in-loop
        let idIn = await getCaraouselId(db, homeCarouselsData[i].locale, homeCarouselsData[i].campaign, homeCarouselsData[i].type, studentClass);
        if (idIn) {
            homeCarouselsData[i].id = idIn[0].id;
        }

    }

    const homeCarouselsGroupedById = _.groupBy(homeCarouselsData, 'id');
    const carouselIdsArray = _.map(_.keys(homeCarouselsGroupedById), (key) => parseInt(key));
    /* eslint-disable quote-props */
    let carouselsArray = await db.mongo.read.collection('homepage_feed_test').find({ 'carousel_id': { $in: carouselIdsArray } }).sort({ caraousel_order: 1 }).toArray();
    // console.log(carouselsArray)
    carouselsArray = carouselsArray.map((carousel) => {
        // eslint-disable-next-line no-prototype-builtins
        if (carousel.hasOwnProperty('items')) {
            carousel.items = carousel.items.map((item) => {
                // item.image_url = buildStaticCdnUrl(item.image_url);
                item.image_url = buildStaticCdnUrl(Utility.convertoWebP(item.image_url));
                return item;
            });
        }
        return carousel;
    });
    let prevYearsArr = [];
    let newTypesArr = [];
    let hindiTitles = [];
    if (home_page_experiment === 'true' && versionCode > 846) {
        const removeTypeArr = ['LATEST_FROM_DOUBTNUT', 'DAILY_CONTEST', 'BOOKS_93', 'BOOKS_94', 'APP_BANNER', 'PERSONALIZATION_CHAPTER', 'REVISION_SERIES', 'BOOKS_43', 'BOOKS_3', 'NDA_solutions', 'CHEMISTRY'];
        const removeByTitleEn = ['NCERT Revision for NEET', 'NEET 2020 - Revision', 'JEE 2020 - 30 DAY REVISION', 'Formula Sheet', 'NCERT Book Solutions Class 12', 'NCERT Book Solutions Class 11', 'UP Board Prashna Patra Solutions', 'Biology Books Solutions', 'Physics Books Solutions', 'Maths Books Solutions'];
        const removeByTitleHi = ['NCERT किताबों का हल (कक्षा ११)', 'NCERT किताबों का हल (कक्षा १२)', 'UP Board प्रश्पत्र के वीडियो जवाब', 'JEE 2020 -30 दिन का रिवीजन', 'फॉर्मूला शीट', 'NEET के लिए NCERT रिवीजन', 'NEET 2020 - रिवीजन', 'जीवविज्ञान किताबो का हल', 'भौतिक विज्ञान किताबो का हल', 'गणित किताबो का हल'];
        carouselsArray = carouselsArray.filter((carousel) => !removeTypeArr.includes(carousel.type) && !removeByTitleEn.includes(carousel.title) && !removeByTitleHi.includes(carousel.title));
        if (versionCode > 848) {
            const prevYearsExamsType = ['10_BOARDS_PY', '12_BOARDS_PY', 'JEE_MAINS_PY', 'JEE_ADV_PY', 'NEET 2019 SOLUTIONS'];
            prevYearsArr = await getPrevYearsData(db, carouselsArray, prevYearsExamsType, studentLocale);
            carouselsArray = carouselsArray.filter((carousel) => !removeTypeArr.includes(carousel.type) && !removeByTitleEn.includes(carousel.title) && !removeByTitleHi.includes(carousel.title) && !prevYearsExamsType.includes(carousel.type));
        }
        newTypesArr = ['PLAYLIST', 'CHANNELS', 'HOMEPAGE_GAMES_LIST', 'VIDEO_ADS', 'PREVIOUS_YEAR_SOLUTIONS'];
        hindiTitles = await getHindiTitles(db, carouselsArray, newTypesArr);
    }
    let carouselData;
    let examCornerData;

    // * Fetch user active packages
    const studentCurrentSubscriptionDetails = await CourseContainer.getUserActivePackages(db, studentId);

    let studentCourseOrClassSubcriptionDetails = studentCurrentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || (versionCode >= 893 && item.assortment_type === 'subject')));
    if (versionCode >= 893) {
        const today = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        let expiredPackages = await CourseContainer.getUserExpiredPackagesIncludingTrial(db, studentId);
        expiredPackages = expiredPackages.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class' || item.assortment_type === 'subject') && today.diff(moment(item.end_date), 'days') <= 30 && (versionCode > 966 || item.amount > -1));
        expiredPackages = expiredPackages.filter((item) => !_.find(studentCourseOrClassSubcriptionDetails, ['assortment_id', item.assortment_id]));
        studentCourseOrClassSubcriptionDetails = [...studentCourseOrClassSubcriptionDetails, ...expiredPackages];
    }

    const ccmCourses = await CourseHelper.getCoursesFromCcmArray(db, ccmArray, studentClass, studentLocale);
    const studentCcmData = await CourseMysqlv2.getCoursesClassCourseMappingWithCategory(db.mysql.read, studentId);
    const iitNeetCourses = [];
    let ccmTitle = null;
    CourseHelper.getCategoryByStudentCCM(studentCcmData);
    if (_.find(studentCcmData, ['category', 'IIT JEE'])) {
        ccmTitle = 'IIT JEE';
        const freeIitCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
        freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
    }
    if (_.find(studentCcmData, ['category', 'NEET'])) {
        ccmTitle = ccmTitle ? 'IIT JEE / NEET' : 'NEET';
        const freeNeetCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
        freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
    }
    if (!iitNeetCourses.length && _.includes([11, 12, 13], +studentClass)) {
        ccmTitle = 'IIT JEE / NEET';
        const freeIitCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'IIT JEE', studentClass);
        freeIitCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
        const freeNeetCourses = await CourseContainer.getFreeAssortmentsByCategory(db, 'NEET', studentClass);
        freeNeetCourses.map((item) => iitNeetCourses.push({ assortment_id: item.assortment_id }));
    }
    let trendingWidgets = [];
    let popularCourses = [];
    const carouselsPromises = [];
    const categorizedTopIconPromises = [];
    const tempCarouselData = [];
    const carouselsMapping = {
        'COURSES': getCoursesForFeedCarousel,
        'WIDGET_NUDGE': getWidgetNudgeForFeedCarousel,
    };
    const emiPackages = await CourseContainer.getUserEmiPackages(db, studentId);
    const userValues = await HomepageDynamicHelper.generateUserDataForAddtionalChecks(db, studentId, carouselsArray);
    let flagCourse = 1;
    let flagNudge = 1;
    for (const carousel of carouselsArray) {
        // if (!HomepageDynamicHelper.checkIfCarouselToBeShown(carousel, userValues)) {
        //     continue;
        // }
        let titleForNewCarousals;
        if (home_page_experiment === 'true' && newTypesArr.includes(carousel.type)) {
            const titleEn = carousel.title;
            let titleHi = '';
            hindiTitles.forEach((item) => {
                if (carousel.type === item.type) {
                    titleHi = item.hindi_title;
                }
            });
            titleForNewCarousals = studentLocale === 'hi' ? titleHi : titleEn;
        }
        else if (carousel.type === 'NUDGE') {
            const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            // eslint-disable-next-line no-await-in-loop
            const renewalPackages = await CourseHelper.checkUserPackageRenewals({
                db,
                studentID: studentId,
                studentSubscriptionDetails: studentCurrentSubscriptionDetails,
            });
            const event = 'data_watch_time';
            // get active nudges for homepage
            // eslint-disable-next-line no-await-in-loop
            let nudges = await NudgeMysql.getByEvent(db.mysql.read, event, studentClass);
            if (nudges.length) {
                // eslint-disable-next-line no-await-in-loop
                nudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, nudges);
                if (nudges.length) {
                    const nudgeWidget = NudgeHelper.getWidget(nudges, config, 0);
                    const tempCarousel = carousel;
                    tempCarousel.items = nudgeWidget.data.items;
                    tempCarousel.show_view_all = 0;
                    tempCarousel.title = nudgeWidget.data.title;
                    tempCarousel.deeplink = '';
                    tempCarouselData.push({
                        widget_data: tempCarousel,
                        widget_type: 'nudges',
                        layout_config: {
                            'margin_top': 16,
                            'bg_color': '#ffffff',
                        },
                        order: carousel.caraousel_order,
                    });
                }
            }
            // eslint-disable-next-line no-await-in-loop
            let renewalNudges = await NudgeMysql.getByEvent(db.mysql.read, 'renewal_campaign', studentClass);
            if (renewalNudges.length) {
                // eslint-disable-next-line no-await-in-loop
                renewalNudges = await getNudgeByTG(db, studentId, studentClass, studentLocale, renewalNudges);
                if (renewalNudges.length) {
                    const thisMonthRenewalPackages = studentCurrentSubscriptionDetails.filter((item) => moment(item.end_date) < moment('2021-11-01'));
                    if (thisMonthRenewalPackages.length) {
                        renewalNudges[0].deeplink = thisMonthRenewalPackages.length > 1 ? `doubtnutapp://course_select?page=renewal_widget||${renewalNudges[0].coupon_id}` : `doubtnutapp://bundle_dialog?id=${thisMonthRenewalPackages[0].assortment_id}&source=POST_PURCHASE_RENEWAL||${renewalNudges[0].coupon_id}`;
                        const renewalNudgeWidget = NudgeHelper.getWidget(renewalNudges, config, 0);
                        const nudgeCarousel = JSON.parse(JSON.stringify(carousel));
                        nudgeCarousel.items = renewalNudgeWidget.data.items;
                        nudgeCarousel.show_view_all = 0;
                        nudgeCarousel.title = renewalNudgeWidget.data.title;
                        nudgeCarousel.deeplink = '';
                        tempCarouselData.push({
                            widget_data: nudgeCarousel,
                            widget_type: 'nudges',
                            layout_config: {
                                'margin_top': 16,
                                'bg_color': '#ffffff',
                            },
                            order: carousel.caraousel_order,
                        });
                    }
                }
            }
            if (emiPackages.length) {
                const lastEmi = emiPackages[emiPackages.length - 1];
                const end = moment().add(5, 'hours').add(30, 'minutes').add(2, 'days')
                    .endOf('day');
                if (moment(lastEmi.end_date) >= now && moment(lastEmi.end_date) <= end && !lastEmi.is_last) {
                    const event = 'emi_reminder';
                    // eslint-disable-next-line no-await-in-loop
                    const nudges = await NudgeMysql.getByEvent(db.mysql.read, event, studentClass);
                    const nudgeWidget = NudgeHelper.getWidget(nudges, config, lastEmi.next_variant_id);
                    const tempCarousel = carousel;
                    tempCarousel.items = nudgeWidget.data.items;
                    tempCarousel.show_view_all = 0;
                    tempCarousel.title = nudgeWidget.data.title;
                    tempCarousel.deeplink = '';
                    tempCarouselData.push({
                        widget_data: tempCarousel,
                        widget_type: 'nudges',
                        layout_config: {
                            'margin_top': 16,
                            'bg_color': '#ffffff',
                        },
                        order: carousel.caraousel_order,
                    });
                }
            }
            if (renewalPackages.length) {
                if (versionCode < 872) {
                    // eslint-disable-next-line no-await-in-loop
                    const renewalnudges = await NudgeMysql.getByEvent(db.mysql.read, 'validity_reminder', studentClass);
                    const nudgeWidget = NudgeHelper.getWidget(renewalnudges, config, renewalPackages[0].assortment_id);
                    const tempCarousel = carousel;
                    tempCarousel.items = nudgeWidget.data.items;
                    tempCarousel.show_view_all = 0;
                    tempCarousel.title = nudgeWidget.data.title;
                    tempCarousel.deeplink = '';
                    tempCarouselData.push({
                        widget_data: tempCarousel,
                        widget_type: 'nudges',
                        layout_config: {
                            'margin_top': 16,
                            'bg_color': '#ffffff',
                        },
                        order: carousel.caraousel_order,
                    });
                } else {
                    carousel.title = studentLocale === 'hi' ? 'इस कोर्स की वैलिडिटी ख़तम होने वाली है !' : 'Course ki validity khatam hone wali hai !';
                    const widgetData = WidgetHelper.getPostPuchasePaymentWidget({
                        locale: studentLocale,
                        result: renewalPackages,
                        carousel,
                    });
                    tempCarouselData.push({
                        widget_data: widgetData.data,
                        widget_type: 'validity_widget',
                        layout_config: {
                            'margin_top': 16,
                            'bg_color': '#ffffff',
                        },
                        order: carousel.caraousel_order,
                    });
                }
            }
        }
        else if ((carousel.type === 'TRENDING_EXAM' || carousel.type === 'TRENDING_BOARD') && versionCode > 872) {
            trendingWidgets = await getTrendingCoursesForFeed(db, carousel.type, studentCcmData, studentLocale, studentClass, studentCourseOrClassSubcriptionDetails, config, studentId, versionCode, xAuthToken)     
        } else {
            try {
                if (flagCourse) {
                    carouselsPromises.push(carouselsMapping.COURSES(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign));
                    flagCourse = 0;
                }
                if (flagNudge) {
                    carouselsPromises.push(carouselsMapping.WIDGET_NUDGE(carousel, studentId, ccmArray, studentClass, studentLocale, db, base_url, homeCarouselsGroupedById, versionCode, flagVariants, studentCourseOrClassSubcriptionDetails, xAuthToken, pznElasticSearchInstance, studentCcmData, iitNeetCourses, ccmCourses, home_page_experiment, titleForNewCarousals, prevYearsArr, studentCurrentSubscriptionDetails, isDropper, registeredDate, checkForPersonalisation, mobile, forceShowAllCategories, showHomepageCategories, showFavoriteCount, campaign));
                    flagNudge = 0;
                }
            } catch {
                undefined;
            }
        }
    }
    carouselData = await Promise.allSettled(carouselsPromises);
    // return res.send()
    // return 'test';
    let categorizedTopIcon = await Promise.all(categorizedTopIconPromises);
    // return 'true';
    categorizedTopIcon = categorizedTopIcon.filter((item) => Boolean(item));
    carouselData = carouselData.map((x) => { if (x.value !== undefined) return x.value; });
    if (tempCarouselData.some((el) => el.widget_type === 'nudges')) {
        carouselData = [...tempCarouselData, ...carouselData];
    } else {
        carouselData = [...carouselData, ...tempCarouselData];
    }
    carouselData = carouselData.filter((x) => x != undefined);
    carouselData = carouselData.filter((item) => item.length !== 0);
    if (versionCode > 870) {
        const ncertTitles = Data.ncertTitleArr;
        const ncertData = carouselData.filter((x) => x.widget_data && ncertTitles.includes(x.widget_data.title));
        if (ncertData.length == 1 && studentClass != 14 && ncertData[0].widget_data.items) {
            const ncertModifiedData = await getNcertModifiedData(db, ncertData[0].widget_data.items, studentId, studentClass);
            if (ncertModifiedData.length == ncertData[0].widget_data.items.length) {
                carouselData.forEach((item) => {
                    if (item.widget_data && item.widget_data.title === ncertData[0].widget_data.title) {
                        item.widget_data.show_view_all = 0;
                        item.widget_data.items = ncertModifiedData;
                    }
                });
            }
        }
    }
    if (examCornerData) {
        carouselData.push(examCornerData);
    }
    carouselData.push(...trendingWidgets);
    carouselData.sort((a, b) => a.order - b.order);

    const studentActiveCourses = studentCurrentSubscriptionDetails.filter((item) => item.assortment_type === 'course' || item.assortment_type === 'subject');
    if (!studentActiveCourses.length) {
        const freeCarousels = [];
        let index = 0;
        let campaignScreenTypes = [];
        if (!_.isNull(campaign) && !_.isUndefined(campaign)) {
            campaignScreenTypes = await BranchContainer.getScreenTypeByCampaign(db, campaign);
            campaignScreenTypes = campaignScreenTypes.map((x) => x.screen_type);
        }

        carouselData = [...freeCarousels, ...carouselData];

        if (campaignScreenTypes.includes('Home')) {
            while (index < carouselData.length) {
                if (carouselData[index].widget_data && carouselData[index].widget_data.is_liveclass_carousel) {
                    freeCarousels.push(carouselData[index]);
                    carouselData.splice(index, 1);
                } else {
                    index++;
                }
            }
        }
    }
    for (const carousel of carouselData) {
        if (carousel.widget_data && carousel.widget_data.carousel_id) {
            carousel.id = carousel.widget_data.carousel_id;
        }
    }

    carouselData = [...carouselData];
    return carouselData;
}

module.exports = { getCarouselsForFeed };
