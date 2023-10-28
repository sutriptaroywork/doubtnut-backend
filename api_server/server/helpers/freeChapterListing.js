/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const Data = require('../../data/data');
const CouponMySQL = require('../../modules/mysql/coupon');
const CourseHelper = require('./course');
const StudentContainer = require('../../modules/containers/student');
const Coursev2Container = require('../../modules/containers/coursev2');

async function createBannerData(db, studentId, finalBanners) {
    try {
        const studentData = await StudentContainer.getById(studentId, db);
        const promoWidgetItems = [];
        for (let i = 0; i < finalBanners.length; i++) {
            const item = finalBanners[i];
            let deeplink = item.action_activity ? `doubtnutapp://${item.action_activity}?` : '';
            const action_data = item.action_data && item.action_data.trim() ? JSON.parse(item.action_data) : {};
            for (const action in action_data) {
                if (item.description === 'leaderboard' && action === 'url') {
                    const base64StudentId = Buffer.from(studentId.toString()).toString('base64');
                    deeplink = `${deeplink}${action}=${action_data[action]}?student_id=${base64StudentId}&`;
                } else if ((item.id === 320 || item.id === 321) && action === 'external_url') {
                    const referralCodeInfo = await CouponMySQL.getInfoByStudentId(db.mysql.read, studentId);
                    let referralCode = '';
                    if (referralCodeInfo.length) {
                        referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
                    }
                    let shareMessage = Data.referralInfo.invite_message;
                    shareMessage = shareMessage.replace(/<link_to_explore>/g, Data.referralInfo.deeplink_to_explore_url);
                    shareMessage = shareMessage.replace(/<amount>/g, Data.referralInfo.couponData.value);
                    shareMessage = shareMessage.replace(/<referral_code>/g, referralCode);
                    deeplink = `${deeplink}${action}=${action_data[action]}${shareMessage}`;
                } else if ((item.id === 331 || item.id === 332) && action === 'external_url') {
                    const referralCodeInfo = await CouponMySQL.getInfoByStudentId(db.mysql.read, studentId);
                    let referralCode = '';
                    if (referralCodeInfo.length) {
                        referralCode = referralCodeInfo[0].coupon_code.toUpperCase();
                    }
                    const referralMessage = await CourseHelper.getReferralMessage({
                        db,
                        studentData: studentData[0],
                    });
                    let shareMessage = referralMessage.message;
                    const branchLink = await StudentContainer.getBranchDeeplink(db, studentId, referralMessage.campaign_id, referralCode);
                    shareMessage = shareMessage.replace(/<link_to_explore>/g, branchLink.url);
                    shareMessage = shareMessage.replace(/<amount>/g, Data.referralInfo.couponData.value);
                    shareMessage = shareMessage.replace(/<referral_code>/g, referralCode);
                    deeplink = `${deeplink}${action}=${action_data[action]}${shareMessage}`;
                } else {
                    deeplink = `${deeplink}${action}=${action_data[action]}&`;
                }
            }
            promoWidgetItems.push({
                id: item.id,
                extra_params: {
                    ad_id: item.id,
                },
                image_bg: item.image_url,
                deeplink_banner: deeplink,
            });
        }

        return {
            type: 'widget_popular_course',
            widget_data: {
                items: promoWidgetItems,
                ratio: '1:1',
                height: '128',
            },
            extra_params: {
                page: 'free_class_listing',
            },
        };
    } catch (err) {
        console.log(err);
    }
}

async function freeClassListingPageFlagrResp(versionCode, db, studentId) {
    if (+versionCode >= 998) {
        const flagrResp = await Coursev2Container.getFlagrResp(db, 'free_class_listing_page', studentId);
        return _.get(flagrResp, 'free_class_listing_page.payload.enabled', false);
    }
    return false;
}

module.exports = {
    freeClassListingPageFlagrResp,
    createBannerData,
};
