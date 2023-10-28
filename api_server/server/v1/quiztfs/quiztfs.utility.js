const _ = require('lodash');
const QuizTfsRedis = require('../../../modules/redis/QuizTfs');
const QuizTfsMysql = require('../../../modules/mysql/QuizTfs');

async function getCourseSuggestionDeeplink(db, studentId, locale) {
    let suggestedAssortmentId = '';

    const alreadyPaidSql = `select p.assortment_id
                from student_package_subscription sps
                left join package p on sps.new_package_id = p.id
                where sps.student_id = ?
                and p.assortment_id in (SELECT distinct cd.assortment_id FROM classzoo1.course_details cd where cd.assortment_type ='course' and cd.category_type = 'SPOKEN ENGLISH')
                and sps.is_active = 1 order by sps.created_at desc`;

    const alreadyPaidData = await db.mysql.read.query(alreadyPaidSql, [studentId]);

    if (_.get(alreadyPaidData, '[0].assortment_id', null)) {
        suggestedAssortmentId = alreadyPaidData[0].assortment_id;

        return {
            courseDeeplink: `doubtnutapp://course_details?id=${suggestedAssortmentId}`,
            courseOpenText: locale === 'hi' ? 'स्पोकन इंग्लिश की क्लासेस में भाग लें' : 'Attend Spoken English classes to improve',
            eventId: 'course_post',
        };
    }
    const newAvailableSql = `SELECT distinct cd.assortment_id FROM classzoo1.course_details cd
        where cd.assortment_type ='course'
        and cd.category_type = 'SPOKEN ENGLISH'
        and is_active = 1`;

    const newAvailableData = await db.mysql.read.query(newAvailableSql);
    if (_.get(newAvailableData, '[0].assortment_id', null)) {
        suggestedAssortmentId = newAvailableData[0].assortment_id;
    }

    if (suggestedAssortmentId) {
        return {
            courseDeeplink: `doubtnutapp://course_details?id=${suggestedAssortmentId}`,
            courseOpenText: locale === 'hi' ? 'और जल्दी बेहतर होने के लिए स्पोकन इंग्लिश कोर्स को आज़मा कर देखो !' : 'Aur zyaada achhe se seekhne ke liye Spoken English course try karo !',
            eventId: 'course_pre',
        };
    }
    return {
        courseDeeplink: '',
        courseOpenText: '',
        eventId: '',
    };
}

async function getLandingScreenWidget(db, type, studentId, locale, versionCode, config) {
    let widgetData = {};
    if (type == 'quiztfs') {
        const studentRank = await QuizTfsRedis.getTestLeaderboardAllRank(db.redis.read, studentId);
        const studentScore = await QuizTfsRedis.getTestLeaderboardScore(db.redis.read, studentId);
        const faqLocale = locale === 'hi' ? locale : 'en';
        const faqData = await QuizTfsMysql.getFaqs(db.mysql.read, faqLocale);
        const faqs = [];

        faqData.forEach((item) => {
            const faq = {
                title: item.question,
                description: item.answer,
            };
            faqs.push(faq);
        });

        const quiztfsData = {
            page_title: locale === 'hi' ? 'DOUBTNUT प्रीमियर लीग' : 'DOUBTNUT PREMIER LEAGUE',
            widgets: [
                {
                    data: {
                        title: locale === 'hi' ? ' खेल शुरू करो' : 'Play Quiz War',
                        sub_title: locale === 'hi' ? 'खेलोगे, तभी जीतोगे!' : 'Kheloge, tabhi jeetoge',
                        deeplink: 'doubtnutapp://quiz_tfs_selection',
                        image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/069B0138-7F75-8BDE-D81C-DA4412270A93.webp',
                    },
                    type: 'widget_24x7',
                },
                {
                    data: {
                        title: locale === 'hi' ? 'लाइव लीडरबोर्ड' : 'Live Leaderboard',
                        sub_title: locale === 'hi' ? 'आपके आज के अंक और रैंक' : 'Apki aaj ki rank & points',
                        deeplink: 'doubtnutapp://leaderboard?source=quiztfs',
                        student_rank: studentRank !== null ? parseInt(studentRank) + 1 : '--',
                        student_score: studentScore || 0,
                        image_url_rank: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1CACECC5-E4B1-C5F5-06F9-C54F2231971A.webp',
                        image_url_points: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5012E796-75DF-3C74-1045-C1D047C5BE7A.webp',
                        title_rank: locale === 'hi' ? 'मेरी रैंक' : 'My Rank',
                        title_point: locale === 'hi' ? 'मेरा स्कोर' : 'My Points',
                    },
                    type: 'widget_24x7_rank',
                },
                {
                    data: {
                        title: locale === 'hi' ? 'पुरस्कार' : 'Rewards',
                        sub_title: locale === 'hi' ? 'फ्री कोर्स जीतने का मौका' : 'Chance to win FREE course',
                        deeplink: 'doubtnutapp://quiz_tfs_rewards',
                        image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B5D00D20-29CB-FDE3-BFFC-931AE684ECFB.webp',
                    },
                    type: 'widget_24x7',
                },
                {
                    data: {
                        title: locale === 'hi' ? 'प्रदर्शन रिपोर्ट' : 'Performance Report',
                        sub_title: locale === 'hi' ? 'अपने जवाब और सोलूशन्स देखें ' : 'Apne answers aur solutions dekhein',
                        deeplink: 'doubtnutapp://quiz_tfs_history',
                        image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B603C403-8012-326C-359C-4B5867A8B43B.webp',
                    },
                    type: 'widget_24x7',
                },
                {
                    data: {
                        title: locale === 'hi' ? 'दोस्त को न्योता' : 'Invite friend',
                        sub_title: locale === 'hi' ? 'अपने दोस्तों को भी DPL का हिस्सा बनाओ' : 'Apne dosto ko bhi DPL ka hissa banao',
                        deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DJ sir ne challenge diya hai.. Mujhse jeet sakte ho? Aajao saath mil kar DOUBTNUT PREMIER LEAGUE khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/fyFxC9ro6jb')}`,
                        image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/58801CAE-BD83-A5CF-A3B7-81C82928603E.webp',
                    },
                    type: 'widget_24x7',
                },
                {
                    data: {
                        title: locale === 'hi' ? 'फीडबैक दें' : 'Give feedback',
                        sub_title: locale === 'hi' ? 'मज़ा आ रहा है? जो भी है, हमें बताओ' : 'Maza aa raha hai? Jo bhi hai, humein batao',
                        deeplink: 'doubtnutapp://app_survey?survey_id=13',
                        image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/5D7C76DB-026F-C0B7-7EFA-DBC3274368EF.webp',
                    },
                    type: 'widget_24x7',
                },
                {
                    data: {
                        title: locale === 'hi' ? 'और जानकारी' : 'FAQs',
                        items: faqs,
                    },
                    type: 'widget_faq',
                },
            ],
        };
        widgetData = { ...quiztfsData };
    } else {
        const { courseOpenText, courseDeeplink, eventId } = await getCourseSuggestionDeeplink(db, studentId, locale);
        const wpMsg = 'Doubtnut par chal raha hai English Bolna Seekho game! 😍  \nJahan bas 5 minute me 5 sawaal practice karke ek chota sa concept seekh sakte ho!! 🤳🏻 \nAur kisi se sharmaane ki bhi zaroorat nahi!!! 😇 \n\nAb English bolna bhi hua asaan! Aajao!! - https://doubtnut.app.link/fyFxC9ro6jb';

        const practiceEnglishData = {
            page_title: 'English Seekho Game',
            toolbar_title: 'FAQs',
            toolbar_deeplink: 'doubtnutapp://faq?bucket=practice_english',
            bg_color: '#E0EAFF',
            widgets: [
                {
                    type: 'english_quiz_info_widget',
                    data: {
                        title: 'English Seekho Game',
                        title_size: 24,
                        subtitle: locale === 'hi'
                            ? 'बनो English के मास्टर अब गेम खेलते खेलते। \nरोज़ 15 मिनट खेलो और देखो अपनी English बेटर होते हुए ! '
                            : 'Bano english ke master ab game khelte khelte.\nRoz 15 mins khelo aur dekho apni english better hote hue!',
                        subtitle_size: 14,
                        image_url: `${config.staticCDN}images/2022/02/18/04-47-14-620-AM_english_seekho_banner_04_1.webp`,
                        cta_image_url: `${config.staticCDN}images/2022/02/18/04-47-51-401-AM_icon_small_play_small.webp`,
                        deeplink: `doubtnutapp://video_url?url=${config.cdn_video_url}answer-1645425463.mp4`,
                        cta_text: 'Dekho Kaise',
                        cta_text_size: 16,
                    },
                },
                {
                    type: 'next_screen_widget',
                    data: {
                        title: locale === 'hi' ? 'English Seekho Game शुरू करो' : 'Start English Seekho Game',
                        title_size: 18,
                        subtitle: '',
                        subtitle_size: 14,
                        title_color: '#ffffff',
                        subtitle_color: '#BEC4F8',
                        image_url: `${config.staticCDN}images/2022/02/18/04-47-21-244-AM_frame_501.webp`,
                        arrow_image_url: `${config.staticCDN}images/2022/02/18/04-48-33-164-AM_white_icon_small_right_long.webp`,
                        deeplink: 'doubtnutapp://practice_english',
                        bg_color: '#273DE9',
                        is_expanded: true,
                    },
                    layout_config: {
                        margin_top: 16,
                        margin_bottom: 6,
                    },
                    extra_params: {
                        id: 'start_game',
                    },
                },
                {
                    type: 'next_screen_widget',
                    data: {
                        title: locale === 'hi' ? 'प्रतियोगिता के विजेता' : 'Contest Winners',
                        title_size: 18,
                        subtitle: locale === 'hi' ? 'देखो किस किस ने इनाम जीते' : 'See who won prizes',
                        subtitle_size: 14,
                        title_color: '#000000',
                        subtitle_color: '#504949',
                        image_url: `${config.staticCDN}images/2022/02/18/04-47-33-736-AM_icon_footer_gift.webp`,
                        arrow_image_url: `${config.staticCDN}images/2022/02/18/04-48-39-533-AM_black_icon_small_right_long.webp`,
                        deeplink: 'doubtnutapp://quiz_tfs_rewards?type=english_quiz',
                        bg_color: '',
                    },
                    extra_params: {
                        id: 'winners',
                    },
                },
                {
                    type: 'widget_share',
                    data: {
                        title: locale === 'hi' ? 'दोस्तों को बुलाएं' : 'Invite Friends',
                        image_url: '',
                        deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI(wpMsg)}`,
                        share_icon_url: `${config.staticCDN}images/2022/02/18/04-48-09-089-AM_icon_small_share_filled.webp`,
                    },
                },
            ],
        };
        if (courseOpenText) {
            const courseOpenWidget = {
                type: 'next_screen_widget',
                data: {
                    title: courseOpenText,
                    title_size: 14,
                    subtitle: '',
                    subtitle_size: 14,
                    title_color: '#000000',
                    subtitle_color: '#504949',
                    image_url: '',
                    arrow_image_url: `${config.staticCDN}images/2022/02/18/04-48-39-533-AM_black_icon_small_right_long.webp`,
                    deeplink: courseDeeplink,
                    bg_color: '',
                },
                extra_params: {
                    id: eventId,
                },
            };
            practiceEnglishData.widgets.splice(3, 0, courseOpenWidget);
        }
        widgetData = { ...practiceEnglishData };
    }
    return widgetData;
}
module.exports = {
    getLandingScreenWidget,
};
