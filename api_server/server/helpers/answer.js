/* eslint-disable no-await-in-loop */

const _ = require('lodash');
const moment = require('moment');
const uuidv4 = require('uuid/v4');
const base64 = require('base-64');

const CourseV2Mysql = require('../../modules/mysql/coursev2');
const VideoViewMysql = require('../../modules/mysql/videoView');
const CouponMySQL = require('../../modules/mysql/coupon');
const StudentRedis = require('../../modules/redis/student');
const DailyViewsRedis = require('../../modules/redis/daily_views');
const TGHelper = require('./target-group');
const Data = require('../../data/data');
const CourseHelper = require('./course');
const CourseV2Container = require('../../modules/containers/coursev2');
const StudentContainer = require('../../modules/containers/student');
const QuestionMysql = require('../../modules/mysql/question');
const scholarshipHelper = require('../v1/scholarship/scholarship.helper');
const { autoScrollTime } = require('../../data/data');
const WidgetHelper = require('../widgets/liveclass');
const altAppData = require('../../data/alt-app');
// const ReferAndEarnHelper = require('./referAndEarn.helper');
// const freeLiveClassHelper = require('./freeLiveClass');

function getReferralLink(referralCodeInfo, deeplink) {
    let referralCode = '';
    if (referralCodeInfo.length) {
        referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
    }
    let shareMessage = Data.referralInfo.invite_message;
    shareMessage = shareMessage.replace(/<link_to_explore>/g, Data.referralInfo.deeplink_to_explore_url);
    shareMessage = shareMessage.replace(/<amount>/g, Data.referralInfo.couponData.value);
    shareMessage = shareMessage.replace(/<referral_code>/g, referralCode);
    return `${deeplink}${shareMessage}`;
}

async function getTargetPageForRenewalExperiment({
    db,
    assortmentId,
    studentId,
    xAuthToken,
    versionCode,
    page,
    originalDeeplink,
    videoPageFlagrResponse,
}) {
    const variantId = _.get(videoPageFlagrResponse, 'renewal_ads_target_page.variantId', null);
    const flagrEnabled = _.get(videoPageFlagrResponse, 'renewal_ads_target_page.payload.enabled', null);
    if (!flagrEnabled) {
        return {
            flagrName: 'renewal_ads_target_page',
            flagrVariantId: variantId,
            targetPageDeeplink: +assortmentId === 138829 ? 'doubtnutapp://course_category?category_id=Kota%20Classes' : originalDeeplink.replace('xxxx', assortmentId),
            flagrEnabled,
        };
    }
    const assortmentPriceMapping = await CourseHelper.generateAssortmentVariantMapping(db, [assortmentId], studentId, false, xAuthToken);
    let buyDeeplink = versionCode >= 861 ? `doubtnutapp://bundle_dialog?id=${assortmentId}&source=${page}` : `doubtnutapp://vip?assortment_id=${assortmentId}`;
    if (assortmentPriceMapping && assortmentPriceMapping[assortmentId] && !assortmentPriceMapping[assortmentId].multiple) {
        buyDeeplink = `doubtnutapp://vip?variant_id=${assortmentPriceMapping[assortmentId].package_variant}`;
    }
    return {
        flagrName: 'renewal_ads_target_page',
        flagrVariantId: variantId,
        targetPageDeeplink: buyDeeplink,
        flagrEnabled,
    };
}

async function ctaBannerFlagr(db, studentId, versionCode, finalAdData, adData) {
    try {
        let key1;
        let key2;
        let key;
        if (versionCode < 880 || (versionCode >= 880 && finalAdData.is_banner_active === 0) || finalAdData.banner_id === null) {
            if (!_.isNull(finalAdData.cta_flag)) {
                key1 = `cta_ads_${finalAdData.cta_flag}`;
                key = key1;
            }
        } else if (versionCode >= 880 && finalAdData.is_banner_active === 1) {
            if (!_.isNull(finalAdData.cta_flag)) {
                key2 = `banner_cta_ads_${finalAdData.cta_flag}`;
                key = key2;
            }
        }
        const data = await CourseV2Container.getFlagrResp(db, key, studentId);
        let variantCta = 0;
        let variantBanner = 0;
        let ctaExperiment = true;
        let bannerArray;
        const ctaArray = adData.ad_cta_text.split('||');
        const buttonctaArray = adData.ad_button_text.split('||');
        if (finalAdData.banner_id !== null) {
            bannerArray = finalAdData.banner_id.split('||');
        }
        if (typeof data !== 'undefined' && typeof data[key1] !== 'undefined' && typeof data[key1].payload !== 'undefined') {
            variantCta = (+data[key1].payload.variant) - 1;
            adData.cta_flag = key1;
            adData.variant_id_cta = data[key1].variantId;
        } else if (typeof data !== 'undefined' && typeof data[key2] !== 'undefined' && typeof data[key2].payload !== 'undefined' && typeof data[key2].payload.variant_cta !== 'undefined') {
            variantCta = (+data[key2].payload.variant_cta) - 1;
            adData.cta_flag = key2;
            adData.variant_id_cta = data[key2].variantId;
        } else if (typeof data !== 'undefined' && typeof data[key2] !== 'undefined' && typeof data[key2].payload !== 'undefined' && typeof data[key2].payload.variant_banner !== 'undefined' && finalAdData.banner_id !== null) {
            variantBanner = (+data[key2].payload.variant_banner) - 1;
            adData.cta_flag = key2;
            adData.variant_id_cta = data[key2].variantId;
            let id;
            if (variantBanner <= (bannerArray.length - 1) && bannerArray.length > 0) {
                // ctaExperiment = false;
                // const bannerDetails = await CourseV2Container.getBannersFromId(db, bannerArray[variantBanner]);
                // adData.ad_banner_image = '';
                // if (bannerDetails && bannerDetails[0]) {
                //     adData.ad_banner_image = bannerDetails[0].image_url;
                // }
                // adData.ad_cta_text = null;
                id = bannerArray[variantBanner];
            } else {
                // ctaExperiment = false;
                // const bannerDetails = await CourseV2Container.getBannersFromId(db, bannerArray[0]);
                // adData.ad_banner_image = '';
                // if (bannerDetails && bannerDetails[0]) {
                //     adData.ad_banner_image = bannerDetails[0].image_url;
                // }
                // adData.ad_cta_text = null;
                id = bannerArray[0];
            }
            ctaExperiment = false;
            const bannerDetails = await CourseV2Container.getBannersFromId(db, id);
            adData.ad_banner_image = '';
            if (bannerDetails && bannerDetails[0]) {
                adData.ad_banner_image = bannerDetails[0].image_url;
            }
            adData.ad_cta_text = null;
        } else if (versionCode >= 880 && finalAdData.is_banner_active === 1) {
            ctaExperiment = false;
            const bannerDetails = await CourseV2Container.getBannersFromId(db, bannerArray[0]);
            adData.ad_banner_image = '';
            if (bannerDetails && bannerDetails[0]) {
                adData.ad_banner_image = bannerDetails[0].image_url;
            }
            adData.ad_cta_text = null;
        }
        if (ctaExperiment && variantCta <= (ctaArray.length - 1) && variantCta <= (buttonctaArray.length - 1)) {
            adData.ad_cta_text = ctaArray[variantCta];
            adData.ad_button_text = buttonctaArray[variantCta];
        } else if (ctaExperiment) {
            adData.ad_cta_text = ctaArray[0];
            adData.ad_button_text = buttonctaArray[0];
        }
        if (finalAdData.offer_banner_is_active === 1 && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isBefore(finalAdData.offer_end_time) && moment(moment().add(5, 'h').add(30, 'm').toISOString()).isAfter(finalAdData.offer_start_time) && versionCode >= 880) {
            adData.ad_banner_image = finalAdData.offer_banner;
            adData.ad_cta_text = null;
            adData.ad_button_deeplink = finalAdData.offer_banner_deeplink;
        }
        return adData;
    } catch (e) {
        console.log(e);
    }
}

async function getAdsToShow({
    db,
    studentId,
    questionWithAnswer,
    locale,
    studentClass,
    config,
    xAuthToken,
    time,
    versionCode,
    isDropper,
    variant,
    adId,
    // lastAdWatched,
    page,
    videoPageFlagrResponse,
    pznElasticSearchInstance,
}) {
    try {
        // const studentPackageId = questionWithAnswer.student_id;
        const videoSubject = questionWithAnswer.subject || 'MATH';
        let adData = null;
        let tgCheck = false;
        if (studentClass === '12' && isDropper) {
            studentClass = '13';
        }
        const promises1 = await Promise.allSettled([CourseV2Mysql.getCourseAdData(db.mysql.read, studentClass, videoSubject), CourseV2Container.getUserAllPurchasedPackages(db, studentId), StudentContainer.getStudentCcmIds(db, studentId)]);
        // eslint-disable-next-line prefer-const
        let [adDetails, studentSubscriptionDetails, studentCCM] = promises1.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        // let adDetails = await CourseV2Mysql.getCourseAdData(db.mysql.read, studentClass, videoSubject);
        const activeSubscription = studentSubscriptionDetails.filter((subscription) => subscription.is_active == 1);
        if (page === 'SRP') {
            adDetails = adDetails.filter((ad) => ad.show_srp_non_srp === 1 || ad.show_srp_non_srp === 2);
        } else {
            adDetails = adDetails.filter((ad) => ad.show_srp_non_srp === 0 || ad.show_srp_non_srp === 2);
        }
        const repeatedAd = false;
        // let repeatedAdId;
        let finalAdData = null;
        let targetPageRenewalFlagrDetails = null;
        if (adDetails && adDetails.length > 0) {
            adDetails = adDetails.filter(Boolean);
            adDetails = adDetails.filter((item) => item.ad_type !== 'QID');
            const subjectAd = adDetails.filter((e) => e.target_video_subject == videoSubject);
            if (subjectAd.length > 0) {
                adDetails = subjectAd;
            }
            // const studentSubscriptionDetails = await CourseV2Container.getUserAllPurchasedPackages(db, studentId);
            const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
            // * Get all the user packages which are less than 7 days to expire and also get the expired packages from last 7 days, then sort it on basis of date
            const renewalPackages = studentSubscriptionDetails.filter((e) => ((moment(e.end_date).subtract(7, 'days') < now && moment(e.end_date) >= now) || (moment(e.end_date).add(7, 'days') > now && moment(e.end_date) < now)) && e.type === 'subscription' && e.amount > -1).sort((a, b) => (new Date(b.end_date) - new Date(a.end_date)));
            // * Check if paid user's expiry of a package is more than 20 days
            const paidMoreThanTwentyDaysLeft = activeSubscription.filter((e) => (moment(e.end_date).subtract(20, 'days') > now) && e.type === 'subscription' && e.amount > -1);
            if (activeSubscription && activeSubscription.length > 0) {
                adDetails = adDetails.filter((e) => e.show_paid_users != 0);
            }
            if (paidMoreThanTwentyDaysLeft && paidMoreThanTwentyDaysLeft.length > 0) {
                adDetails = adDetails.filter((e) => e.show_paid_users != 1);
            }
            // pzn stuff
            // const lastwatched = await pznElasticSearchInstance.getLatestWatchedVideoDetails(studentId);
            const pznAds = adDetails.filter((item) => item.studentid_package_mapping !== null);
            adDetails = adDetails.filter((item) => item.studentid_package_mapping === null);
            const packageNumberThirty = [];
            const packageNumberFifteen = [];
            // let packageNameThirty;
            // let packageNameFifteen;
            if (pznAds && pznAds[0]) {
                const packagesThirty = pznAds.filter((e) => e.time_period === 30);
                const packagesFifteen = pznAds.filter((e) => e.time_period === 15);
                packagesThirty.forEach((item) => {
                    packageNumberThirty.push(item.studentid_package_mapping);
                });
                packagesFifteen.forEach((item) => {
                    packageNumberFifteen.push(item.studentid_package_mapping);
                });
                const promises2 = [];
                if (packageNumberThirty.length) {
                    // packageNameThirty = await CourseV2Mysql.getPackageNameFromId(db.mysql.read, packageNumberThirty);
                    promises2.push(CourseV2Mysql.getPackageNameFromId(db.mysql.read, packageNumberThirty));
                } else {
                    promises2.push([]);
                }
                if (packageNumberFifteen.length) {
                    // packageNameFifteen = await CourseV2Mysql.getPackageNameFromId(db.mysql.read, packageNumberFifteen);
                    promises2.push(CourseV2Mysql.getPackageNameFromId(db.mysql.read, packageNumberFifteen));
                } else {
                    promises2.push([]);
                }
                const promises2Setteled = await Promise.allSettled(promises2);
                const [packageNameThirty, packageNameFifteen] = promises2Setteled.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
                // let packagesWatchedThirty;
                // let packagesWatchedFifteen;
                const promises3 = [];
                if (packageNameThirty && packageNameThirty.length > 0) {
                    const packages = [];
                    packageNameThirty.forEach((item) => {
                        packages.push(item.package);
                    });
                    const date = moment().add(5, 'hours').add(30, 'minutes').subtract(30, 'days');
                    const foramt = moment(date).format('YYYY-MM-DD');
                    // packagesWatchedThirty = await pznElasticSearchInstance.getLatestWatchedVideoByPackageAndInterval(studentId, foramt, packages);
                    promises3.push(pznElasticSearchInstance.getLatestWatchedVideoByPackageAndInterval(studentId, foramt, packages));
                } else {
                    promises3.push([]);
                }
                if (packageNameFifteen && packageNameFifteen.length > 0) {
                    const packages = [];
                    packageNameFifteen.forEach((item) => {
                        packages.push(item.package);
                    });
                    const date = moment().add(5, 'hours').add(30, 'minutes').subtract(15, 'days');
                    const foramt = moment(date).format('YYYY-MM-DD');
                    // packagesWatchedFifteen = await pznElasticSearchInstance.getLatestWatchedVideoByPackageAndInterval(studentId, foramt, packages);
                    promises3.push(pznElasticSearchInstance.getLatestWatchedVideoByPackageAndInterval(studentId, foramt, packages));
                } else {
                    promises3.push([]);
                }
                const promises3Setteled = await Promise.allSettled(promises3);
                const [packagesWatchedThirty, packagesWatchedFifteen] = promises3Setteled.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
                const packagesAdsThirty = [];
                const packagesAdsFifteen = [];
                let adsWatchedHistoryThirty;
                let adsWatchedHistoryFifteen;
                if (packagesWatchedThirty && packagesWatchedThirty.aggregations && packagesWatchedThirty.aggregations.group_by_package && packagesWatchedThirty.aggregations.group_by_package.buckets && packagesWatchedThirty.aggregations.group_by_package.buckets.length) {
                    packagesWatchedThirty.aggregations.group_by_package.buckets.forEach((item) => {
                        packagesAdsThirty.push(item.key);
                    });
                    if (packagesAdsThirty.length) {
                        const packagesNumberThirty = [];
                        packageNameThirty.forEach((item) => {
                            if (packagesAdsThirty.includes(item.package)) {
                                packagesNumberThirty.push(item.student_id);
                            }
                        });
                        adsWatchedHistoryThirty = pznAds.filter((e) => packagesNumberThirty.includes(e.studentid_package_mapping) && e.time_period === 30);
                        if (adsWatchedHistoryThirty && adsWatchedHistoryThirty.length) {
                            adDetails = adDetails.concat(adsWatchedHistoryThirty);
                        }
                    }
                }
                if (packagesWatchedFifteen && packagesWatchedFifteen.aggregations && packagesWatchedFifteen.aggregations.group_by_package && packagesWatchedFifteen.aggregations.group_by_package.buckets && packagesWatchedFifteen.aggregations.group_by_package.buckets.length) {
                    packagesWatchedFifteen.aggregations.group_by_package.buckets.forEach((item) => {
                        packagesAdsFifteen.push(item.key);
                    });
                    if (packagesAdsFifteen.length) {
                        const packagesNumberFifteen = [];
                        packageNameFifteen.forEach((item) => {
                            if (packagesAdsFifteen.includes(item.package)) {
                                packagesNumberFifteen.push(item.student_id);
                            }
                        });
                        adsWatchedHistoryFifteen = pznAds.filter((e) => packagesNumberFifteen.includes(e.studentid_package_mapping) && e.time_period === 15);
                        if (adsWatchedHistoryFifteen && adsWatchedHistoryFifteen.length) {
                            adDetails = adDetails.concat(adsWatchedHistoryFifteen);
                        }
                    }
                }
            }
            adDetails.sort((ad1, ad2) => {
                if (ad1.priority < ad2.priority) return 1;
                if (ad1.priority > ad2.priority) return -1;
                return 0;
            });
            let i = 0;
            const index = adDetails.map((o) => o.ad_id).indexOf(+adId);
            if (+index < (adDetails.length - 1)) {
                i = (+index) + 1;
            }
            let checkifRenewed = [];
            if (renewalPackages.length) {
                checkifRenewed = studentSubscriptionDetails.filter((e) => e.assortment_id === renewalPackages[0].assortment_id && e.end_date > now);
            }
            // new ads check
            // let userNewAdWatchCount;
            // let newAdCheck = false;
            // for (let j = 0; j < adDetails.length; j++) {
            //     if (adDetails[j].is_new_ad === 1) {
            //         if (variant === 1) {
            //             userNewAdWatchCount = await StudentRedis.getVideoAdsWatchCounter(db.redis.read, studentId, adDetails[j].ad_id);
            //         } else if (variant === 2) {
            //             userNewAdWatchCount = await StudentRedis.getVideoAdsWatchCounterThree(db.redis.read, studentId, adDetails[j].ad_id);
            //         } else if (variant === 3) {
            //             userNewAdWatchCount = await StudentRedis.getVideoAdsWatchCounterWeekly(db.redis.read, studentId, adDetails[j].ad_id);
            //         }
            //         // * This is for renewal ads, renewal ads should be expired on daily basis
            //         if (adDetails[j].ad_type === 'renewal') {
            //             userNewAdWatchCount = await StudentRedis.getVideoAdsWatchCounter(db.redis.read, studentId, adDetails[j].ad_id);
            //         }
            //         if (userNewAdWatchCount === null || +userNewAdWatchCount < adDetails[j].ad_limit) {
            //             newAdCheck = await TGHelper.targetGroupCheckAds({
            //                 db, studentId, tgID: adDetails[j].target_group_id, studentClass, locale, adType: adDetails[j].ad_type,
            //             });
            //             if (newAdCheck) {
            //                 i = j;
            //                 break;
            //             }
            //         }
            //     }
            // }

            // if (adId && lastAdWatched && lastAdWatched.length && lastAdWatched[0] && +adId !== lastAdWatched[0].ad_id) {
            //     const lastAdIndex = adDetails.map((o) => o.ad_id).indexOf(+adId);
            //     if (+lastAdIndex < adDetails.length && +lastAdIndex !== -1) {
            //         i = (+lastAdIndex);
            //         repeatedAd = true;
            //         repeatedAdId = +adId;
            //     }
            // }
            let rotation = 0;
            let isLastAvailableAd = false;
            for (i; i < adDetails.length; i++) {
                if (rotation > 0 && i > index) {
                    break;
                }
                if (i === adDetails.length - 1) {
                    isLastAvailableAd = true;
                    rotation += 1;
                }
                const adWatch = (await CourseV2Mysql.getAdLifetimeWatch(db.mysql.read, adDetails[i].ad_id, studentId))[0].watch_count;
                if (adWatch >= adDetails[i].max_ad_limit) {
                    continue;
                }
                let userWatchCount;
                if (variant === 1) {
                    userWatchCount = await StudentRedis.getVideoAdsWatchCounter(db.redis.read, studentId, adDetails[i].ad_id);
                } else if (variant === 2) {
                    userWatchCount = await StudentRedis.getVideoAdsWatchCounterThree(db.redis.read, studentId, adDetails[i].ad_id);
                } else if (variant === 3) {
                    userWatchCount = await StudentRedis.getVideoAdsWatchCounterWeekly(db.redis.read, studentId, adDetails[i].ad_id);
                }
                if (adDetails[i].ad_type === 'renewal') {
                    userWatchCount = await StudentRedis.getVideoAdsWatchCounter(db.redis.read, studentId, adDetails[i].ad_id);
                }
                // const interval = +((await CourseV2Container.getNewUserInterval(db))[0].key_value);
                const interval = 1;
                const start = moment(time).format();
                const end = moment().subtract(interval, 'day');
                const newUser = (moment(start).isBefore(end)) ? 0 : 1;
                const showAd = false;
                // if (repeatedAd && repeatedAdId === adDetails[i].ad_id) {
                //     showAd = true;
                // }
                if (((!userWatchCount || userWatchCount < adDetails[i].ad_limit) || showAd) && (newUser === 0 || adDetails[i].show_new_user === newUser)) {
                    if (adDetails[i].target_group_id) {
                        tgCheck = await TGHelper.targetGroupCheckAds({
                            db, studentId, tgID: adDetails[i].target_group_id, studentClass, locale, adType: adDetails[i].ad_type, studentCCM,
                        });
                        if (tgCheck) {
                            if (adDetails[i].ad_type === 'renewal') {
                                if (!renewalPackages.length || checkifRenewed.length) {
                                    continue;
                                }
                                const {
                                    targetPageDeeplink,
                                    flagrName,
                                    flagrVariantId,
                                    flagrEnabled,
                                } = await getTargetPageForRenewalExperiment({
                                    db,
                                    studentId,
                                    xAuthToken,
                                    page,
                                    assortmentId: renewalPackages[0].assortment_id,
                                    originalDeeplink: adDetails[i].target_page,
                                    versionCode,
                                    cta_text: adDetails[i].cta,
                                    button_cta: adDetails[i].button_cta,
                                    banner_id: adDetails[i].banner_id,
                                    videoPageFlagrResponse,
                                });
                                adDetails[i].target_page = targetPageDeeplink;
                                if (flagrVariantId) {
                                    targetPageRenewalFlagrDetails = {
                                        flagrName,
                                        flagrVariantId,
                                        flagrEnabled,
                                    };
                                }
                                finalAdData = adDetails[i];
                            } else {
                                finalAdData = adDetails[i];
                            }
                        }
                    } else {
                        tgCheck = true;
                        finalAdData = adDetails[i];
                    }
                    if (tgCheck) {
                        finalAdData.watch_count = userWatchCount;
                        break;
                    }
                }
                if (isLastAvailableAd && rotation === 1) {
                    isLastAvailableAd = false;
                    i = -1;
                }
            }
        }
        if (finalAdData !== null && tgCheck) {
            adData = {
                ad_id: finalAdData.ad_id,
                ad_url: `${config.cdn_video_url}${finalAdData.resource}`,
                ad_skip_duration: finalAdData.skip_enable_at,
                ad_position: finalAdData.ad_position,
                mid_ad_content_start_duration: 20,
                ad_button_deeplink: finalAdData.target_page,
                ad_cta_text: finalAdData.cta,
                ad_button_text: finalAdData.button_cta,
                ad_button_color: '#eb532c',
                ad_text_color: '#54138a',
                ad_cta_bg_color: '#e0eaff',
            };
            if (finalAdData.ad_type === 'renewal') {
                const ctaTextArray = finalAdData.cta.split('||');
                const buttonCTAArray = finalAdData.button_cta.split('||');
                if ((targetPageRenewalFlagrDetails && !targetPageRenewalFlagrDetails.flagrEnabled) || !targetPageRenewalFlagrDetails) {
                    adData.ad_cta_text = ctaTextArray[0];
                    adData.ad_button_text = buttonCTAArray[0];
                } else {
                    adData.ad_cta_text = ctaTextArray[1] || ctaTextArray[0];
                    adData.ad_button_text = buttonCTAArray[1] || buttonCTAArray[0];
                }
                if (versionCode >= 880 && finalAdData.is_banner_active === 1) {
                    const bannerId = finalAdData.banner_id;
                    const bannerIdArray = bannerId.split('||');
                    if (bannerIdArray.length) {
                        let bannerImage;
                        if ((targetPageRenewalFlagrDetails && !targetPageRenewalFlagrDetails.flagrEnabled) || !targetPageRenewalFlagrDetails) {
                            const bannerDetails = await CourseV2Mysql.getBannersFromId(db.mysql.read, [bannerIdArray[0]]);
                            bannerImage = bannerDetails[0].image_url;
                        } else {
                            const bannerDetails = await CourseV2Mysql.getBannersFromId(db.mysql.read, [bannerIdArray[1] || bannerIdArray[0]]);
                            bannerImage = bannerDetails[0].image_url;
                        }
                        adData.ad_cta_text = null;
                        adData.ad_banner_image = bannerImage;
                    }
                }
            } else {
                if (finalAdData.ad_type === 'referral') {
                    const referralCodeInfo = await CouponMySQL.getInfoByStudentId(db.mysql.read, studentId);
                    if (referralCodeInfo.length) {
                        adData.ad_button_deeplink = getReferralLink(referralCodeInfo, finalAdData.target_page);
                    }
                }
                adData = await ctaBannerFlagr(db, studentId, versionCode, finalAdData, adData);
            }
            if (finalAdData.ad_type.includes('scholarship')) {
                const type = finalAdData.ad_type.split(' ')[1];
                adData.ad_button_deeplink = await scholarshipHelper.scholarshipDeeplink(versionCode, db, type, xAuthToken, studentId);
            }
            if (!_.isNull(adData)) {
                await StudentRedis.setAdIdForStudent(db.redis.write, studentId, finalAdData.ad_id);
                // repeatedAd && repeatedAdId === adData.ad_id
                if (!finalAdData.watch_count && !(repeatedAd)) {
                    if (variant === 1) {
                        StudentRedis.setVideoAdsWatchCounter(db.redis.write, studentId, finalAdData.ad_id);
                        StudentRedis.setAdIdForStudentDaily(db.redis.write, studentId, finalAdData.ad_id);
                    } else if (variant === 2) {
                        StudentRedis.setVideoAdsWatchCounterThree(db.redis.write, studentId, finalAdData.ad_id);
                        StudentRedis.setAdIdForStudentThree(db.redis.write, studentId, finalAdData.ad_id);
                    } else if (variant === 3) {
                        StudentRedis.setVideoAdsWatchCounterWeekly(db.redis.write, studentId, finalAdData.ad_id);
                        StudentRedis.setAdIdForStudentWeekly(db.redis.write, studentId, finalAdData.ad_id);
                    }
                    if (finalAdData.ad_type === 'renewal') {
                        StudentRedis.setVideoAdsWatchCounter(db.redis.write, studentId, finalAdData.ad_id);
                    }
                } else if (finalAdData.watch_count < finalAdData.ad_limit && !(repeatedAd)) {
                    if (variant === 1) {
                        StudentRedis.updateVideoAdsWatchCounter(db.redis.write, studentId, finalAdData.ad_id);
                        StudentRedis.setAdIdForStudentDaily(db.redis.write, studentId, finalAdData.ad_id);
                    } else if (variant === 2) {
                        StudentRedis.updateVideoAdsWatchCounterThree(db.redis.write, studentId, finalAdData.ad_id);
                        StudentRedis.setAdIdForStudentThree(db.redis.write, studentId, finalAdData.ad_id);
                    } else if (variant === 3) {
                        StudentRedis.updateVideoAdsWatchCounterWeekly(db.redis.write, studentId, finalAdData.ad_id);
                        StudentRedis.setAdIdForStudentWeekly(db.redis.write, studentId, finalAdData.ad_id);
                    }
                    if (finalAdData.ad_type === 'renewal') {
                        StudentRedis.updateVideoAdsWatchCounter(db.redis.write, studentId, finalAdData.ad_id);
                    }
                }
            }
            if (targetPageRenewalFlagrDetails) {
                adData.targetPageRenewalFlagr = targetPageRenewalFlagrDetails;
            }
        }
        if (!_.isNull(adData)) {
            if (versionCode > 853) {
                adData.uuid = uuidv4();
            } else {
                adData.uuid = null;
            }
        }
        return adData;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function updateBottomSheetDeeplinks(popularCourseItems) {
    const assortmentIds = popularCourseItems
        .filter((item) => item.assortment_id && item.assortment_id !== 138829)
        .map((item) => item.assortment_id);
    popularCourseItems.forEach((item) => {
        if (item.assortment_id && item.assortment_id !== 138829) {
            const index = assortmentIds.indexOf(item.assortment_id);
            item.deeplink_button = `doubtnutapp://course_details_bottom_sheet?ids=${assortmentIds.join(',')}&position=${index}`;
            item.deeplink_banner = `doubtnutapp://course_details_bottom_sheet?ids=${assortmentIds.join(',')}&position=${index}`;
        }
    });
    return popularCourseItems;
}

async function getPopularCoursesCarousel({
    db,
    studentClass,
    config,
    versionCode,
    studentId,
    studentLocale,
    xAuthToken,
    page,
    eventPage,
    pznElasticSearchInstance,
    hitFlagr,
    prevFlagrResponse,
    studentID,
}) {
    const popularCourseItems = await CourseHelper.getPaidAssortmentsData({
        db,
        studentClass,
        config,
        versionCode,
        studentId,
        studentLocale,
        xAuthToken,
        page,
        eventPage,
        pznElasticSearchInstance,
        hitFlagr,
        prevFlagrResponse,
    });
    if (!popularCourseItems) return {};
    if (versionCode >= 927 && popularCourseItems.items && (page === 'SRP' || page === 'MPVP_BOTTOM_SHEET')) {
        popularCourseItems.items = updateBottomSheetDeeplinks(popularCourseItems.items);
    }
    const suggestedCoursesFlagrIndex = popularCourseItems.variantInfo.findIndex((item) => item.flag_name === 'suggested_courses_for_you');
    const suggestedFlagrID = suggestedCoursesFlagrIndex >= 0 ? popularCourseItems.variantInfo[suggestedCoursesFlagrIndex].flag_name : null;
    const suggestedFlagrVariant = suggestedCoursesFlagrIndex >= 0 ? popularCourseItems.variantInfo[suggestedCoursesFlagrIndex].variant_id : null;
    const popularCourseWidget = {
        resource_type: 'widget',
        widget_data: {
            type: versionCode > 872 && popularCourseItems && popularCourseItems.new_widget_type ? 'widget_popular_course' : 'widget_parent',
            data: {
                title: (studentLocale === 'hi') ? 'लोकप्रिय कोर्सेस' : 'Popular Courses',
                link_text: '',
                deeplink: '',
                flagr_id: suggestedFlagrID,
                variant_id: suggestedFlagrVariant,
                auto_scroll_time_in_sec: Data.popular_courses_carousel.auto_scroll_time_in_sec,
                items: popularCourseItems ? popularCourseItems.items : [],
            },
            extra_params: {
                be_source: page === 'SRP' || page === 'MPVP_BOTTOM_SHEET' ? 'MPVP' : 'SIMILAR',
                widget_type: versionCode > 872 && popularCourseItems && popularCourseItems.new_widget_type ? 'widget_popular_course' : 'widget_parent',
            },
        },
    };
    if (versionCode > 872 && popularCourseItems && popularCourseItems.items && popularCourseItems.items.length > 0 && popularCourseItems.new_widget_type) {
        if (page === 'SRP') {
            const now = moment().add(5, 'hours').add(30, 'minutes');
            const popularCourseBanners = Data.popular_course_discount_banners;
            popularCourseBanners.forEach((item) => {
                const dateFrom = moment(item.date_from);
                const dateTo = moment(item.date_to);
                const startDiff = now >= dateFrom;
                const endDiff = now <= dateTo;
                if (startDiff && endDiff) {
                    popularCourseItems.items.unshift({
                        image_bg: item.banner,
                        deeplink_banner: item.deeplink,
                        deeplink_button: item.deeplink,
                        button_background_color: '#FFFEFF',
                        button_text_color: '#027D3F',
                        button_cta: studentLocale === 'hi' ? 'ऑफ़र देखें' : 'GET OFFER',
                        banner_type: 2,
                        amount_to_pay: '',
                        amount_to_pay_color: '',
                        amount_strike_through: '',
                        strikethrough_text_color: '',
                        strikethrough_color: '',
                        text: '',
                        text_color: '',
                        assortment_id: null,
                    });
                }
            });
            const scholarshipTime = moment('2021-08-21 15:00:00').format();
            if (now.isBefore(scholarshipTime)) {
                let progressID = await CourseV2Mysql.getScholarshipTestProgress(db.mysql.read, studentID);
                const currentTests = [400027, 400028, 400029, 400030, 400031, 400032, 400033, 400034, 400035, 400036, 400037, 400038, 400039, 400040, 400041, 400042, 400043, 400044, 400045, 400046, 400047, 400048, 400049, 400050, 400051, 400052, 400053, 400054];
                progressID = progressID.filter((e) => currentTests.includes(e.test_id));
                if (!progressID || !progressID.length) {
                    let banner;
                    if (studentLocale === 'hi') {
                        banner = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/73243AD9-F8CD-F1F5-C9DE-6F6A11A0ABA5.webp';
                    } else {
                        banner = 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/7FAC9012-B4EB-03BD-688D-8A896264B728.webp';
                    }
                    const auth = base64.encode(xAuthToken);
                    const deeplink = `doubtnutapp://web_view?chrome_custom_tab=true&url=https://app.doubtnut.com/DNST3/registered?token=${auth}/1/DNST5`;
                    popularCourseItems.items.unshift({
                        image_bg: banner,
                        deeplink_banner: deeplink,
                        deeplink_button: deeplink,
                        button_background_color: '#ea232a',
                        button_text_color: '#FFFEFF',
                        button_cta: studentLocale === 'hi' ? 'अभी रजिस्टर करें' : 'Register Now',
                        banner_type: 2,
                        amount_to_pay: '',
                        amount_to_pay_color: '',
                        amount_strike_through: '',
                        strikethrough_text_color: '',
                        strikethrough_color: '',
                        text: '',
                        text_color: '',
                        assortment_id: null,
                    });
                }
            }
        }
        popularCourseWidget.widget_data.data.background_color = '#ffffff';
    }
    return {
        popularCourseWidget,
        widget_position: popularCourseItems.widget_position,
        variantInfo: popularCourseItems.variantInfo,
        new_widget_type: popularCourseItems.new_widget_type,
        disabled: popularCourseItems.disabled,
        widget_placement: popularCourseItems.widget_placement,
    };
}

async function widgetHandler(req, res, next) {
    try {
        // get popular course carousel
        // console.log('widgetHandler');
        const packageValue = req.headers.package_name;
        const isFreeApp = packageValue === altAppData.freeAppPackageName;
        if (isFreeApp) {
            const { data } = res;
            return next({ data });
        }

        if (typeof res.data !== 'undefined') {
            const { data } = res;
            const db = req.app.get('db');
            const config = req.app.get('config');
            const pznElasticSearchInstance = req.app.get('pznElasticSearchInstance');
            const { student_class: studentClass, student_id: studentID, locale: studentLocale } = req.user;
            const { version_code: versionCode, 'x-auth-token': xAuthToken } = req.headers;
            const { page = 'DEFAULT' } = req.body;
            let variantInfo = [];
            // const oldSimilarFlagrVariant = _.get(oldSimilarFlagrResponse, 'old_similar_logic_ab.payload', null);
            // const oldSimilarFlagrEnabled = _.get(oldSimilarFlagrResponse, 'old_similar_logic_ab.payload.enabled', null);

            if (versionCode >= 852) {
                // * Fetch user active packages
                const studentSubscriptionDetails = await CourseV2Container.getUserActivePackages(db, studentID);
                // * Filter out course or class assortment from (studentSubscriptionDetails) object array for my_courses carousel on home page
                const studentCourseOrClassSubcriptionDetails = studentSubscriptionDetails.filter((item) => (item.assortment_type === 'course' || item.assortment_type === 'class') && item.class === +studentClass && item.amount !== -1);
                const userHasActivePages = studentCourseOrClassSubcriptionDetails.length > 0;
                if (!userHasActivePages) {
                    const curPage = (page === 'SRP' || page === 'MPVP' || page === 'WATCH-HISTORY') ? 'SRP' : 'SIMILAR';
                    const popularCourseCarousel = await getPopularCoursesCarousel({
                        db,
                        studentClass,
                        config,
                        versionCode,
                        studentId: studentID,
                        studentLocale,
                        xAuthToken,
                        page: curPage,
                        eventPage: page,
                        pznElasticSearchInstance,
                        studentID,
                    });
                    // * Any other page apart from SRP, if page is SRP, then widget_placement should be similar for popular course carousel
                    const isPopularCoursesAvailable = _.get(popularCourseCarousel, 'popularCourseWidget.widget_data.data', null) && popularCourseCarousel.popularCourseWidget.widget_data.data.items.length > 0;
                    if (versionCode > 872 && isPopularCoursesAvailable && popularCourseCarousel.new_widget_type && ((page !== 'SRP' && page !== 'MPVP' && page !== 'WATCH-HISTORY') || (page === 'SRP' && popularCourseCarousel.widget_placement === 'similar'))) {
                        data.similar_video.splice(popularCourseCarousel.widget_position, 0, popularCourseCarousel.popularCourseWidget);
                    } else if (typeof data.similar_video !== 'undefined' && isPopularCoursesAvailable && curPage !== 'SRP' && !popularCourseCarousel.disabled) {
                        data.similar_video.splice(popularCourseCarousel.widget_position, 0, popularCourseCarousel.popularCourseWidget);
                    }
                    if (popularCourseCarousel.variantInfo && popularCourseCarousel.variantInfo.length) {
                        variantInfo = popularCourseCarousel.variantInfo;
                    }
                }
            }

            /* if (versionCode >= 1000 && page === 'SRP') {
                if (req.headers.version_code <= 1009) {
                    if (!_.isNull(req.headers.flagr_variation_ids) && !_.isEmpty(req.headers.flagr_variation_ids)) {
                        const flagVariantsArray = req.headers.flagr_variation_ids.split(',');
                        if (flagVariantsArray.includes('1716')) {
                            const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(studentID);
                            if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                                const referralBanner = await ReferAndEarnHelper.getReferralBannerWidget(db, studentLocale, studentID, 'MPVP');
                                data.similar_video.splice(0, 0, referralBanner);
                            }
                        }
                    }
                } else  {
                    if (req.headers.d0_qa_count >= 5) {
                        const referralBanner = await ReferAndEarnHelper.getReferralBannerWidget(db, studentLocale, studentID, 'MPVP');
                        data.similar_video.splice(0, 0, referralBanner);
                    } else {
                        const questionAskedLast30Days = await freeLiveClassHelper.getLast30DaysQaCount(studentID);
                        if (questionAskedLast30Days && questionAskedLast30Days.total_questions_asked >= 5) {
                            const referralBanner = await ReferAndEarnHelper.getReferralBannerWidget(db, studentLocale, studentID, 'MPVP');
                            data.similar_video.splice(0, 0, referralBanner);
                        }
                    }
                }
            } */

            const studentRecentAdID = await StudentRedis.getAdIdForStudent(db.redis.read, studentID);
            const carouselsData = {
                carousel_type: 'promo_list',
                resource_types: '6:1',
            };
            if (!_.isNull(studentRecentAdID) && +versionCode < 862 && +versionCode >= 852) {
                const [
                    watchedAds,
                    dailyLimitAds,
                ] = await Promise.all([
                    CourseV2Mysql.getStudentAdsWatchedToday(db.mysql.read, studentID),
                    CourseV2Container.getDailyAdsLimit(db, studentID),
                ]);
                if (+watchedAds[0].watch_count < +dailyLimitAds[0].key_value) {
                    const banners = [];
                    const banner = await CourseV2Mysql.getBannerDetailsFromAdId(db.mysql.read, +studentRecentAdID);
                    const bannerArray = (banner.length && banner[0].banner_id) ? banner[0].banner_id.split('||') : [];
                    if (bannerArray.length) {
                        banners.push(bannerArray[0]);
                        banners.push(banner[0].banner_id);
                        const bannerDetails = await CourseV2Mysql.getBannersFromId(db.mysql.read, banners);
                        const bannerResponse = await CourseHelper.generateBannerData({
                            db,
                            carouselsData,
                            result: bannerDetails,
                            studentID,
                            locale: studentLocale,
                            studentClass,
                            versionCode,
                        });

                        const promo_list = {
                            resource_type: 'widget',
                            widget_data: {
                                type: 'promo_list',
                                data: bannerResponse.data,
                            },
                        };
                        promo_list.widget_data.data.auto_scroll_time_in_sec = autoScrollTime;
                        data.similar_video.unshift(promo_list);
                    }
                }
            } else {
                await StudentRedis.deleteAdIdForStudent(db.redis.read, studentID);
            }

            // * Add variant info for flagr
            // if (oldSimilarFlagrVariant) {
            // variantInfo.push({
            //     flag_name: 'old_similar_logic_ab',
            //     variant_id: oldSimilarFlagrResponse.old_similar_logic_ab.variantId,
            // });
            // }

            const responseData = {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data,
            };
            if (variantInfo && variantInfo.length) {
                responseData.meta.analytics = {
                    varaint_info: variantInfo,
                };
            }
            return res.status(responseData.meta.code).json(responseData);
        }
        next();
    } catch (e) {
        next(e);
    }
}

// daily views count for views greater than 30 seconds
async function dailyViewsHandler(db, viewID, studentID) {
    try {
        // check if this is fresh view or repeated view
        const recentViewID = await StudentRedis.getLatestViewID(db.redis.read, studentID);
        // check wheather to increase the view count or not
        if (!_.isNull(viewID) && viewID != recentViewID) {
            // increase view count
            const currentDate = moment().format('YYYY-MM-DD');
            await Promise.all([
                DailyViewsRedis.setDailyViews(db.redis.write, currentDate, 1, studentID),
                StudentRedis.setLatestViewID(db.redis.write, studentID, viewID),
            ]);
        }
    } catch (e) {
        console.log(e);
    }
}

function undefinedChecks(liveclassStreamDetails, questionWithAnswer) {
    if (_.isNull(questionWithAnswer.duration) || _.isEmpty(questionWithAnswer.duration) || questionWithAnswer.duration == 0 || typeof liveclassStreamDetails === 'undefined' || _.isEmpty(liveclassStreamDetails) || _.isNull(liveclassStreamDetails[0].live_at)) {
        return true;
    }
    return false;
}
function isLiveclassOngoing(liveclassStreamDetails, questionWithAnswer) {
    const now = moment().add(5, 'hours').add(30, 'minutes');
    if (now.isBetween(moment(liveclassStreamDetails[0].live_at), moment(liveclassStreamDetails[0].live_at).add(parseInt(questionWithAnswer.duration), 'seconds'))) {
        return true;
    }
    return false;
}

function blockForwardingHandler(liveclassStreamDetails, questionWithAnswer) {
    let block = false;
    // check edge case
    if (undefinedChecks(liveclassStreamDetails, questionWithAnswer)) {
        return block;
    }
    if (liveclassStreamDetails[0].state === 1) {
        block = true;
    }
    // if current time is inbetween live at and live end (live at time + video duration)
    if (isLiveclassOngoing(liveclassStreamDetails, questionWithAnswer)) {
        block = true;
    }
    return block;
}

function offsetHandler(data) {
    const {
        data: responseData,
        liveclassStreamDetails,
        questionWithAnswer,
    } = data;
    // check edge case
    if (undefinedChecks(liveclassStreamDetails, questionWithAnswer)) {
        return responseData;
    }
    // if current time is inbetween live at and live end (live at time + video duration)
    // const now = moment().add(5, 'hours').add(30, 'minutes');
    const now = moment().add(5, 'hours').add(30, 'minutes');
    if (isLiveclassOngoing(liveclassStreamDetails, questionWithAnswer)) {
        // get offset time
        const offset = now.diff(moment(liveclassStreamDetails[0].live_at), 'seconds');
        // add this offset in answer video resource
        responseData.video_resources[0].offset = offset;
    }
    return responseData;
}

function labelMaker(doubt) {
    let label = '';
    const exerciseArr = doubt.split('_');
    const exerciseCode = exerciseArr[exerciseArr.length - 2];
    if (!_.isEmpty(exerciseCode) && !_.isNull(exerciseCode)) {
        let exercise = '';
        if (exerciseCode === 'SLV') {
            exercise = 'Solved Ex';
        } else if (exerciseCode === 'MEX') {
            exercise = 'Misc Ex';
        } else if (exerciseCode.includes('E', 0)) {
            const exerciseNumber = exerciseCode.slice(-2);
            if (exerciseNumber.includes('0', 0)) {
                exercise = `Ex ${exerciseNumber.slice(-1)}`;
            } else {
                exercise = `Ex ${exerciseNumber}`;
            }
        }
        let qno = exerciseArr[exerciseArr.length - 1];
        if (qno.charAt(0) == '0') {
            qno = qno.substring(1);
        }
        label = `${exercise} Question ${qno}`;
    }
    return label;
}

async function makeLocalisedQuestion(db, questionList, locale) {
    const { localeValues: localeArr } = Data;
    const { languageValues: languageArr } = Data;
    const fieldName = languageArr[localeArr.indexOf(locale)];
    const localisedQuestionPromise = [];
    questionList.forEach((x) => {
        localisedQuestionPromise.push(QuestionMysql.getLocalisedOcr(db.mysql.read, x.question_id));
    });
    const localisedQuestions = await Promise.all(localisedQuestionPromise);

    questionList.forEach((item, index) => {
        if (localisedQuestions[index] && localisedQuestions[index].length > 0) {
            const localisedText = localisedQuestions[index][0][`${fieldName}`];
            if (localisedText != '' && localisedText != null) {
                item.ocr_text = localisedText;
            }
        }
    });
    return questionList;
}

async function getOcr(db, qList) {
    // as getTotalLikesShare function removing ocr_text for question_id = 501988217, 501988218, 118958189 ..... as so on we are again calling for ocr_text
    let similarQids = qList.filter((x) => !_.isNull(x.question_id) && !_.isEmpty(x.question_id)).map((x) => x.question_id);
    similarQids = similarQids.join();
    if (similarQids != '') {
        const similarData = await QuestionMysql.getSimilarQuestionsByIds(db.mysql.read, similarQids);

        qList.forEach((item) => {
            const qDetails = similarData.filter((x) => x.question_id === item.question_id);
            if (qDetails.length == 1) {
                item.ocr_text = qDetails[0].ocr_text;
            }
        });
    }
    return qList;
}

async function getAdsToShowQid({
    db,
    studentId,
    questionWithAnswer,
    studentClass,
    locale,
    config,
    time,
    versionCode,
    isDropper,
}) {
    try {
        if (studentClass === '12' && isDropper) {
            studentClass = '13';
        }
        let defaultAd = false;
        let subject;
        let type;
        const subjectArray = ['BIOLOGY', 'CHEMISTRY', 'ENGLISH', 'PHYSICS', 'SOCIAL SCIENCE', 'SCIENCE', 'MATHS'];
        if (!questionWithAnswer.subject || !(subjectArray.includes(questionWithAnswer.subject))) {
            subject = 'PHYSICS';
            defaultAd = true;
        } else {
            subject = questionWithAnswer.subject;
        }
        if (questionWithAnswer.student_id !== null) {
            const targetType = await VideoViewMysql.getBookNameBySid(db.mysql.read, questionWithAnswer.student_id);
            if (targetType && targetType[0] && targetType[0].target_group) {
                type = (targetType[0].target_group === 'IIT JEE' || targetType[0].target_group === 'NEET') ? targetType[0].target_group : 'BOARDS';
            } else {
                type = 'BOARDS';
            }
        } else {
            type = 'BOARDS';
        }
        const localeSubject = (locale === 'hi') ? 'hi' : 'en';

        let adData = null;
        let finalAdData = null;
        if (defaultAd) {
            subject = 'DEFAULT';
        }
        const promises = await Promise.allSettled([CourseV2Container.getCourseAdDataQid(db, studentClass, subject), CourseV2Mysql.getOfferAds(db.mysql.read, studentClass), CourseV2Container.getUserAllPurchasedPackages(db, studentId), TGHelper.targetGroupSubject({
            db, studentId, studentClass, type, localeSubject, subject,
        }), StudentContainer.getStudentCcmIds(db, studentId)]);
        // get offer ads for QID variant
        // eslint-disable-next-line prefer-const
        let [adDetails, offerAds, studentSubscriptionDetails, targetAssortment, studentCCM] = promises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        const activeSubscription = studentSubscriptionDetails.filter((subscription) => subscription.is_active == 1);
        const subjectAssortment = targetAssortment[0];
        const courseAssortment = targetAssortment[1];
        if (offerAds && offerAds[0]) {
            offerAds.sort((ad1, ad2) => {
                if (ad1.priority < ad2.priority) return -1;
                if (ad1.priority > ad2.priority) return 1;
                return 0;
            });
            for (let i = 0; i < offerAds.length; i++) {
                adDetails.unshift(offerAds[i]);
            }
        }
        const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        // * Check if paid user's expiry of a package is more than 20 days
        const paidMoreThanTwentyDaysLeft = activeSubscription.filter((e) => (moment(e.end_date).subtract(20, 'days') > now) && e.type === 'subscription' && e.amount > -1);
        if (activeSubscription && activeSubscription.length > 0) {
            adDetails = adDetails.filter((e) => e.show_paid_users != 0);
        }
        if (paidMoreThanTwentyDaysLeft && paidMoreThanTwentyDaysLeft.length > 0) {
            adDetails = adDetails.filter((e) => e.show_paid_users != 1);
        }

        if (adDetails && adDetails.length > 0) {
            adDetails = adDetails.filter(Boolean);
            for (let i = 0; i < adDetails.length; i++) {
                const adWatch = (await CourseV2Mysql.getAdLifetimeWatch(db.mysql.read, adDetails[0].ad_id, studentId))[0].watch_count;
                if (!(adWatch >= adDetails[i].max_ad_limit)) {
                    const interval = 1;
                    const start = moment(time).format();
                    const end = moment().subtract(interval, 'day');
                    const newUser = (moment(start).isBefore(end)) ? 0 : 1;
                    const newPromises = await Promise.allSettled([StudentRedis.getVideoAdsWatchCounterWeekly(db.redis.read, studentId, adDetails[i].ad_id), TGHelper.targetGroupCheckAds({
                        db, studentId, tgID: adDetails[i].target_group_id, studentClass, locale, adType: adDetails[i].ad_type, studentCCM,
                    })]);
                    const [userWatchCount, tgCheck] = newPromises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
                    if ((!userWatchCount || userWatchCount < adDetails[i].ad_limit) && (newUser === 0 || adDetails[i].show_new_user === newUser) && tgCheck) {
                        finalAdData = adDetails[i];
                        finalAdData.watch_count = userWatchCount;
                        break;
                    }
                }
            }
        }
        if (finalAdData !== null) {
            let deeplink;
            // take deeplink form table in offer ads
            if (finalAdData.ad_type != 'QID_offer') {
                if (subjectAssortment && subjectAssortment[0]) {
                    deeplink = `doubtnutapp://course_details?id=${subjectAssortment[0].course_resource_id}`;
                } else if (courseAssortment) {
                    deeplink = `doubtnutapp://course_details?id=${courseAssortment}`;
                }
            }
            adData = {
                ad_id: finalAdData.ad_id,
                ad_url: `${config.cdn_video_url}${finalAdData.resource}`,
                ad_skip_duration: finalAdData.skip_enable_at,
                ad_position: finalAdData.ad_position,
                mid_ad_content_start_duration: 20,
                ad_cta_text: finalAdData.cta,
                ad_button_text: finalAdData.button_cta,
                ad_button_color: '#eb532c',
                ad_text_color: '#54138a',
                ad_cta_bg_color: '#e0eaff',
                ad_button_deeplink: deeplink || finalAdData.target_page,
            };
            adData = await ctaBannerFlagr(db, studentId, versionCode, finalAdData, adData);
            if (!_.isNull(adData)) {
                if (!finalAdData.watch_count) {
                    StudentRedis.setVideoAdsWatchCounterWeekly(db.redis.write, studentId, finalAdData.ad_id);
                    StudentRedis.setAdIdForStudentWeekly(db.redis.write, studentId, finalAdData.ad_id);
                } else if (finalAdData.watch_count < finalAdData.ad_limit) {
                    StudentRedis.updateVideoAdsWatchCounterWeekly(db.redis.write, studentId, finalAdData.ad_id);
                    StudentRedis.setAdIdForStudentWeekly(db.redis.write, studentId, finalAdData.ad_id);
                }
            }
        }

        if (!_.isNull(adData)) {
            if (versionCode > 853) {
                adData.uuid = uuidv4();
            } else {
                adData.uuid = null;
            }
        }
        return adData;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function getAdsToShowLF({
    db,
    studentId,
    questionWithAnswer,
    studentClass,
    locale,
    config,
    versionCode,
    isDropper,
}) {
    try {
        const videoSubject = questionWithAnswer.subject || 'MATHS';
        let adData = null;
        let tgCheck = false;
        if (studentClass === '12' && isDropper) {
            studentClass = '13';
        }
        const promises = await Promise.allSettled([CourseV2Container.getLFAdData(db, studentClass, videoSubject), CourseV2Container.getUserAllPurchasedPackages(db, studentId), StudentContainer.getStudentCcmIds(db, studentId)]);
        // eslint-disable-next-line prefer-const
        let [adDetails, studentSubscriptionDetails, studentCCM] = promises.map((value) => (value.status === 'fulfilled' ? value.value : undefined));
        const activeSubscription = studentSubscriptionDetails.filter((subscription) => subscription.is_active == 1);
        let finalAdData = null;
        const now = moment().add(5, 'hours').add(30, 'minutes').startOf('day');
        // * Check if paid user's expiry of a package is more than 20 days
        const paidMoreThanTwentyDaysLeft = activeSubscription.filter((e) => (moment(e.end_date).subtract(20, 'days') > now) && e.type === 'subscription' && e.amount > -1);
        if (activeSubscription && activeSubscription.length > 0) {
            adDetails = adDetails.filter((e) => e.show_paid_users != 0);
        }
        if (paidMoreThanTwentyDaysLeft && paidMoreThanTwentyDaysLeft.length > 0) {
            adDetails = adDetails.filter((e) => e.show_paid_users != 1);
        }
        if (adDetails && adDetails.length > 0) {
            adDetails = adDetails.filter(Boolean);
            for (let i = 0; i < adDetails.length; i++) {
                const adWatch = (await CourseV2Mysql.getAdLifetimeWatchLF(db.mysql.read, adDetails[0].ad_id, studentId))[0].watch_count;
                if (!(adWatch >= adDetails[i].max_ad_limit)) {
                    const userWatchCount = await StudentRedis.getLFAdsWatchCounter(db.redis.read, studentId, adDetails[i].ad_id);
                    tgCheck = await TGHelper.targetGroupCheckAds({
                        db, studentId, tgID: adDetails[i].target_group_id, studentClass, locale, adType: adDetails[i].ad_type, studentCCM,
                    });
                    if ((!userWatchCount || userWatchCount < adDetails[i].ad_limit) && tgCheck) {
                        finalAdData = adDetails[i];
                        finalAdData.watch_count = userWatchCount;
                        break;
                    }
                }
            }
        }
        if (finalAdData !== null) {
            adData = {
                ad_id: finalAdData.ad_id,
                ad_url: `${config.cdn_video_url}${finalAdData.resource}`,
                ad_skip_duration: finalAdData.skip_enable_at,
                ad_position: finalAdData.ad_position,
                mid_ad_content_start_duration: 20,
                ad_button_deeplink: finalAdData.target_page ? finalAdData.target_page : '',
                ad_cta_text: finalAdData.cta ? finalAdData.cta : '',
                ad_button_text: finalAdData.button_cta ? finalAdData.button_cta : '',
                ad_button_color: '#eb532c',
                ad_text_color: '#54138a',
                ad_cta_bg_color: '#e0eaff',
            };
            adData = await ctaBannerFlagr(db, studentId, versionCode, finalAdData, adData);
            if (!_.isNull(adData)) {
                if (!(finalAdData.watch_count) || (finalAdData.watch_count < finalAdData.ad_limit)) {
                    StudentRedis.setLFAdsWatchCounter(db.redis.write, studentId, finalAdData.ad_id);
                }
            }
        }

        if (!_.isNull(adData)) {
            if (versionCode > 853) {
                adData.uuid = uuidv4();
            } else {
                adData.uuid = null;
            }
        }
        return adData;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

function createNkcResponse(widgetData, title, type = null) {
    const returnObj = {
        widget_data: {
            title,
            is_title_bold: true,
            items: type === 'nkc' ? widgetData.items[136674] : widgetData.items,
        },
        widget_type: 'widget_parent',
        layout_config: {
            margin_top: 16,
            bg_color: '#FFFFFF',
        },
    };

    returnObj.widget_data.items.forEach((x, i) => {
        const { title1: classTopic } = x.data;
        const cdnPrefix = 'https://d10lpgp6xz60nq.cloudfront.net/';

        let classTopicArr = [];
        if (classTopic.includes('||')) {
            classTopicArr = classTopic.split('||');
        } else if (classTopic.includes('|')) {
            classTopicArr = classTopic.split('|');
        } else {
            classTopicArr = [classTopic];
        }

        if (classTopicArr.length >= 2) {
            x.data.class_topic = classTopicArr[2] ? classTopicArr[2].trim() : classTopicArr[1].trim();
        } else if (classTopicArr.length === 1) {
            x.data.class_topic = classTopicArr[0].trim();
        }
        const duration = Math.round(x.data.duration / 60);

        const watchingStudents = Math.floor(Math.random() * 50000) + 10000;

        let liveTimeStamp = x.data.live_at;
        if (x.data.live_at.toString().length === 13) {
            liveTimeStamp /= 1000;
        }
        const upperLim = liveTimeStamp + 2400;
        const lowerLim = liveTimeStamp - 2400;
        const currentTime = Math.round(new Date().getTime() / 1000);

        let durationText = `${watchingStudents} attended | ${duration} Min`;
        if (lowerLim <= currentTime && upperLim >= currentTime) {
            durationText = `${watchingStudents} watching | ${duration} Min`;
        } else if (currentTime < lowerLim) {
            durationText = `${duration} Min`;
        }

        let backgroundUrl = `${cdnPrefix}${Data.mpvp_recommended_backgrounds.one}`;
        let topBgClr = Data.mpvp_recommended_background_colors.one;
        if (i % 3 === 1) {
            backgroundUrl = `${cdnPrefix}${Data.mpvp_recommended_backgrounds.two}`;
            topBgClr = Data.mpvp_recommended_background_colors.two;
        } else if (i % 3 === 2) {
            backgroundUrl = `${cdnPrefix}${Data.mpvp_recommended_backgrounds.three}`;
            topBgClr = Data.mpvp_recommended_background_colors.three;
        }

        x.data.card_width = '2.1';
        x.data.card_ratio = '16:10';
        x.data.text_color_title = '#17181f';
        x.data.text_color_primary = '#17181f';
        x.data.text_color_secondary = '#ffffff';
        x.data.button_state = 'join_now';
        x.data.button = null;
        x.data.is_reminder_set = 0;
        x.data.class_topic_size = '10';
        x.data.video_duration_text = durationText;
        x.data.video_duration_text_size = '9';
        x.data.top_heading_text = `${x.data.subject} Class ${x.data.class}`;
        x.data.top_heading_text_color = '#fda589';
        x.data.image_bg_card = backgroundUrl;
        x.data.top_background_text_color = topBgClr;
        x.data.title1_size = '16';
        x.data.guideline_constraint_begin = '6';
        x.data.recommended_class = {
            chapter_name: classTopicArr[1] ? classTopicArr[1].trim() : classTopicArr[0].trim(),
            teacher_name: x.data.title2,
        };
        x.extra_params = {
            widget_name: 'mpvp_classes_carousel',
            assortment_id: x.data.assortment_id,
        };

        if (title === 'JEE/NEET Foundation Classes') {
            x.data.recommended_class.chapter_name = classTopic;
        }

        delete x.data.top_title;
        delete x.data.subject;
        delete x.data.title1;
        delete x.data.title2;
    });

    let { items } = returnObj.widget_data;
    items = _.shuffle(items);
    returnObj.widget_data.items = items;

    return returnObj;
}

async function makeNkcData(db, supportedData) {
    let data = {};
    const {
        ccm_list: ccmIdList, student_ccm: studentCcmData, student_id: studentId, student_class: studentClass, locale, version_code: versionCode,
    } = supportedData;
    const assortmentList = {
        iit: '136682|136674|136675',
        neet: '136674|137715|137706',
    };
    const studentCcmDataModified = studentCcmData;
    if (!ccmIdList.includes(11101) && !ccmIdList.includes(11103)) {
        studentCcmDataModified.unshift({
            id: 11101,
            ccm_category: 'exam',
            course: 'IIT JEE',
            category: 'IIT JEE',
        });
    }

    const { demoVideos, tabs, category } = await CourseHelper.getDemoVideosForEtoosFacultyCourse(db, assortmentList, studentId, studentClass, studentCcmDataModified);
    if (tabs.length) {
        const widgetData = await WidgetHelper.homepageVideoWidgetWithTabs({
            tabs,
            title: `Nkc Sir Videos for ${category}`,
            versionCode,
            studentLocale: locale,
            data: demoVideos,
            paymentCardState: { isVip: true },
            type: 'mpvp',
        });

        if (widgetData.items[136674] && widgetData.items[136674].length > 0) {
            data = createNkcResponse(widgetData, 'NKC Sir Videos', 'nkc');
        }
    }

    return data;
}

module.exports = {
    getAdsToShow,
    widgetHandler,
    dailyViewsHandler,
    blockForwardingHandler,
    offsetHandler,
    labelMaker,
    makeLocalisedQuestion,
    getOcr,
    getAdsToShowQid,
    getAdsToShowLF,
    getPopularCoursesCarousel,
    makeNkcData,
    createNkcResponse,
};
