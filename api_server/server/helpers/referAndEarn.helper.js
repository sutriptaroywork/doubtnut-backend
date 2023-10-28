const _ = require('lodash');
const StudentMysql = require('../../modules/mysql/student');
const ReferralData = require('../../data/referral.data');
const GamificationMysql = require('../../modules/mysql/gamification');
const config = require('../../config/config');
const RewardHelper = require('./rewards');
const redis = require('../../modules/redis/referAndEarn');
const Utility = require('../../modules/utility');

function makeReferralCameraWidget(referredStudents, locale) {
    if (locale !== 'en' && locale !== 'hi') {
        locale = 'other';
    }

    const obj = {
        refer_image_url: ReferralData.cameraReferralWidget.loudspeaker_img_url,
        title_text_color: ReferralData.cameraReferralWidget.title_text_color,
        title_text_size: ReferralData.cameraReferralWidget.title_text_size,
        subtitle_text_color: ReferralData.cameraReferralWidget.subtitle_text_color,
        subtitle_text_size: ReferralData.cameraReferralWidget.subtitle_text_size,
        bg_start_color: ReferralData.cameraReferralWidget.bg_start_color,
        bg_end_color: ReferralData.cameraReferralWidget.bg_end_color,
        deeplink: 'doubtnutapp://refer_and_earn',
    };

    if (referredStudents.length % 5 === 0) {
        obj.title = ReferralData.cameraReferralWidget.referAndEarn.title[locale];
        obj.subtitle = ReferralData.cameraReferralWidget.referAndEarn.subtitle[locale];
    } else {
        const studentLeftForReferral = ReferralData.cameraReferralWidget.studentsToBeReferredForBigReward - (referredStudents.length % 5);
        obj.title = ReferralData.cameraReferralWidget.referMoreFriends.title[locale].replace('xxx', studentLeftForReferral);
        obj.subtitle = ReferralData.cameraReferralWidget.referMoreFriends.subtitle[locale].replace('xxx', studentLeftForReferral);
    }

    return obj;
}

function referAndEarnWidget(locale, referralsByUser, page) {
    if (locale !== 'en' && locale !== 'hi') {
        locale = 'other';
    }

    let subtitle = '';
    if (referralsByUser.length === 0) {
        subtitle = ReferralData.referralWidget.referAndEarn.subtitle[locale];
    } else if (referralsByUser.length % 5 === 0) {
        subtitle = ReferralData.cameraReferralWidget.referMoreFriends.earn_extra[locale];
    } else {
        const studentLeftForReferral = ReferralData.cameraReferralWidget.studentsToBeReferredForBigReward - (referralsByUser.length % 5);
        const firstSubtitle = ReferralData.cameraReferralWidget.referMoreFriends.title[locale].replace('xxx', studentLeftForReferral);
        const secondSubtitle = ReferralData.cameraReferralWidget.referMoreFriends.subtitle[locale].replace('xxx', studentLeftForReferral);
        subtitle = firstSubtitle.concat(secondSubtitle);
    }

    return {
        widget_type: 'widget_refer_and_earn_header',
        layout_config: {
            margin_top: 0,
            margin_right: 0,
            margin_left: 0,
        },
        widget_data: {
            title: ReferralData.referralWidget.referAndEarn.title[locale],
            image_top: `${config.staticCDN}engagement_framework/BCF99EA3-2DF3-1089-F09F-2D4D70E7B173.webp`,
            subtitle,
            text_terms_and_conditions: page === 'faq' ? null : ReferralData.referralWidget.referAndEarn.termsAndConditions.title[locale],
            text_terms_and_conditions_deeplink: page === 'faq' ? null : 'doubtnutapp://refer_and_earn_faq',
            bg_color: '#007aff',
            cta: page === 'faq' ? { title: ReferralData.referralWidget.referAndEarn.referNow[locale] } : null,
        },
    };
}

function referAndEarnStepsWidget(locale) {
    if (locale !== 'en' && locale !== 'hi') {
        locale = 'other';
    }

    return {
        widget_type: 'widget_refer_and_earn_steps_widget',
        widget_data: {
            title: ReferralData.referralWidget.steps.title[locale],
            bg_color: '#f4f9ff',
            items: ReferralData.referralWidget.steps[locale],
        },
    };
}

async function generateBranchDeeplinkForReferAndEarn(db, studentId) {
    try {
        let data;
        if (config.caching) {
            data = await redis.getBranchDeeplinkForReferAndEarn(db.redis.read, studentId);
            if (!_.isNull(data)) {
                return JSON.parse(data);
            }
        }
        data = await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'ANDROID', 'REFERRAL', `doubtnutapp://refer_a_friend?referrer=${studentId}`);
        if (data) {
            redis.setBranchDeeplinkForReferAndEarn(db.redis.write, studentId, data.url);
        }
        return data ? data.url : null;
    } catch (e) {
        console.log(e);
        throw new Error(e);
    }
}

async function referralCodeWidget(db, locale, studentId) {
    if (locale !== 'en' && locale !== 'hi') {
        locale = 'other';
    }

    const branchDeeplink = await generateBranchDeeplinkForReferAndEarn(db, studentId);

    return {
        widget_type: 'widget_referral_code',
        widget_data: {
            referral_code: branchDeeplink,
            copy_text: ReferralData.referralWidget.copyText[locale],
            bg_color: '#f4f9ff',
        },
    };
}

function emptyReferredFriendsWidget(locale) {
    if (locale !== 'en' && locale !== 'hi') {
        locale = 'other';
    }
    return {
        widget_type: 'widget_referred_friends',
        widget_data: {
            title: ReferralData.referralWidget.emptyReferredFriendsWidget.title[locale],
            bg_color: '#f4f9ff',
            empty_state_text: ReferralData.referralWidget.emptyReferredFriendsWidget.subtitle[locale],
            empty_state_img_url: `${config.staticCDN}engagement_framework/AB9408EA-B44D-8B98-B9B5-708748F37437.webp`,
        },
    };
}

async function referredFriendsListWidget(db, referredStudentList, locale) {
    try {
        if (locale !== 'en' && locale !== 'hi') {
            locale = 'other';
        }
        const studentIds = _.map(referredStudentList, (item) => item.invitee_id);
        const studentsData = await GamificationMysql.getStudentByIds(db.mysql.read, studentIds);
        const referralsForBigReward = ReferralData.cameraReferralWidget.studentsToBeReferredForBigReward;
        const items = [];
        for (let i = 0; i < studentsData.length; i++) {
            items.push({
                image_url: studentsData[i].img_url ? studentsData[i].img_url : `${config.staticCDN}engagement_framework/feed_profile.png`,
                title: studentsData[i].student_fname ? studentsData[i].student_fname : studentsData[i].student_username,
                title_text_size: 16,
                subtitle: ReferralData.referralWidget.referredFriends.reward_earned_10.title[locale],
                subtitle_text_size: 15,
                text_points_earned: ReferralData.referralWidget.referredFriends.reward_earned_10.text_points_earned,
            });

            if (i !== 0 && i % referralsForBigReward === referralsForBigReward - 1) {
                items.push({
                    image_url: `${config.staticCDN}engagement_framework/D9D92F84-280B-5C38-356E-1EB0FD1E3E1E.webp`,
                    title: `${ReferralData.cameraReferralWidget.studentsToBeReferredForBigReward}`.concat(ReferralData.referralWidget.referredFriends.referralsCompleted[locale]),
                    subtitle: ReferralData.referralWidget.referredFriends.reward_earned_50.title[locale],
                    text_points_earned: ReferralData.referralWidget.referredFriends.reward_earned_50.text_points_earned,
                    title_text_size: 16,
                    subtitle_text_size: 15,
                });
            }
        }
        return {
            widget_type: 'widget_referred_friends',
            widget_data: {
                title: 'Your referred friends',
                bg_color: '#f4f9ff',
                items,
            },
        };
    } catch (e) {
        throw new Error(e);
    }
}

function makeFaqListWidget(locale) {
    if (locale !== 'en' && locale !== 'hi') {
        locale = 'other';
    }
    const items = [];
    const faqList = ReferralData.referralWidget.faq.faqList[locale];

    for (let i = 0; i < faqList.length; i++) {
        items.push({
            id: i + 1,
            bucket: 'feature_explainer',
            question: faqList[i].question,
            type: 'text',
            answer: faqList[i].answer,
            question_id: null,
            thumbnail: null,
            video_orientation: 'portrait',
            priority: 14,
            video_resources: [],
            page: 'COURSE_FAQ',
            video_icon_url: null,
            is_expand: i === 0,
        });
    }
    return {
        widget_type: 'faq',
        widget_data: {
            faq_list: items,
        },
    };
}

async function getReferralBannerWidget(db, locale, studentId, page) {
    const referralsByUser = await StudentMysql.getStudentsReferredByUser(db.mysql.read, studentId);
    const referralsCount = referralsByUser.length;

    let imageUrl = locale === 'hi' ? ReferralData.referrals_count_banner_mapping.hi[referralsCount % 5] : ReferralData.referrals_count_banner_mapping.en[referralsCount % 5];
    if (page === 'MPVP') {
        let localeToBeUsed = locale;
        if (locale !== 'en' && locale !== 'hi') {
            localeToBeUsed = 'other';
        }
        imageUrl = ReferralData.mpvp_referral_banner_mapping[localeToBeUsed][referralsCount % 5];
    }

    return {
        resource_type: 'widget',
        widget_data: {
            widget_data: {
                _id: 1,
                image_url: imageUrl,
                deeplink: 'doubtnutapp://refer_and_earn',
                card_ratio: page === 'MPVP' ? '4:1' : '16:9',
            },
            widget_type: 'banner_image',
            layout_config: {
                margin_top: 0,
                margin_bottom: 0,
                margin_left: 0,
                margin_right: 0,
                bg_color: '#FFFFFF',
            },
        },
    };
}

async function referralRewarding(db, obj) {
    const referredUserData = await StudentMysql.getReferredUserData(db.mysql.read, obj.invitee_id);
    if (!_.isEmpty(referredUserData) && !referredUserData[0].question_asked) {
        obj.inviter_id = referredUserData[0].inviter_id;

        const inviterCurrentReferralCount = await StudentMysql.getStudentsReferredByUser(db.mysql.read, obj.inviter_id);

        obj.inviter_referral_count = inviterCurrentReferralCount.length;
        RewardHelper.dnrRewardForReferral(db, obj);
        StudentMysql.updateInviteeQuestionAskedStatus(db.mysql.write, obj.invitee_id);
    }
    return true;
}

module.exports = {
    makeReferralCameraWidget,
    referAndEarnWidget,
    referAndEarnStepsWidget,
    referralCodeWidget,
    emptyReferredFriendsWidget,
    referredFriendsListWidget,
    makeFaqListWidget,
    getReferralBannerWidget,
    referralRewarding,
    generateBranchDeeplinkForReferAndEarn,
};
