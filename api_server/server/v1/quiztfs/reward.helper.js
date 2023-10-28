const _ = require('lodash');
const QuizTfsMysql = require('../../../modules/mysql/QuizTfs');
const config = require('./config');

function sendData(item) {
    const acceptable = new Set(['SCRATCHED', 'REDEEMED', 'EXPIRED']);
    const flag = acceptable.has(item.dialog_data.status);
    const structure = {
        image_url: item.image_url,
        text: flag ? item.dialog_data.scratch_description : item.text,
        level: item.level,
        value: item.value,
        dialog_data: {
            value: item.dialog_data.value,
            description: flag ? item.dialog_data.scratch_description : 'Congrats! Scratch to see your reward!',
            image_url: item.dialog_data.image_url,
            coupon_code: flag ? item.dialog_data.coupon_code : null,
            top_button_text: flag ? item.dialog_data.top_button_text : null,
            bottom_button_text: flag ? item.dialog_data.bottom_button_text : null,
            share_deeplink: flag ? item.dialog_data.share_deeplink : null,
            scratched_image_link: item.dialog_data.scratched_image_link,
            locked_short_description: 'locked_short_description',
            locked_subtitle: 'locked_subtitle',
            locked_Long_description: 'locked_Long_description',
            is_scratched: false,
            is_unlocked: true,
            reward_type: 'coupon',
            level: '',
            status: item.dialog_data.status,
        },
    };
    return structure;
}
function sendHindiData(item) {
    const acceptable = new Set(['SCRATCHED', 'REDEEMED', 'EXPIRED']);
    const flag = acceptable.has(item.dialog_data.status);
    const structure = {
        image_url: item.image_url,
        text: flag ? item.dialog_data.scratch_description_hi : item.text_hi,
        level: item.level,
        value: item.value,
        dialog_data: {
            value: item.dialog_data.value,
            description: flag ? item.dialog_data.scratch_description_hi : 'Congrats! Scratch to see your reward!',
            image_url: item.dialog_data.image_url,
            coupon_code: flag ? item.dialog_data.coupon_code : null,
            top_button_text: flag ? item.dialog_data.top_button_text_hi : null,
            bottom_button_text: flag ? item.dialog_data.bottom_button_text_hi : null,
            share_deeplink: flag ? item.dialog_data.share_deeplink : null,
            scratched_image_link: item.dialog_data.scratched_image_link,
            locked_short_description: 'locked_short_description',
            locked_subtitle: 'locked_subtitle',
            locked_Long_description: 'locked_Long_description',
            is_scratched: false,
            is_unlocked: true,
            reward_type: 'coupon',
            level: '',
            status: item.dialog_data.status,
        },
    };
    return structure;
}

module.exports = class Reward {
    constructor(myPoint) {
        this.pointMilestones = [
            {
                value: 300,
                display_text: '300 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl1.webp',
            },
            {
                value: 400,
                display_text: '400 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl2.webp',
            },
            {
                value: 500,
                display_text: '500 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl3.webp',
            },
            {
                value: 600,
                display_text: '600 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl4.webp',
            },
            {
                value: 900,
                display_text: '900 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl5.webp',
            },
            {
                value: 1200,
                display_text: '1200 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl6.webp',
            },
            {
                value: 1500,
                display_text: '1500 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl7.webp',
            },
            {
                value: 2000,
                display_text: '2000 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl8.webp',
            },
            {
                value: 3000,
                display_text: '3000 Points',
                image_url: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl9.webp',
            },

        ];
        this.rewardMilestones = [
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '1',
                value: 300,
                dialog_data: {
                    value: 300,
                    scratch_description: 'Apko milta hai flat 5% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 5% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 5% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    short_description_hi: 'आपको मिलता है flat 5% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2429218B-B3B3-A6B3-9826-62FBBA68FCB7.webp',
                    coupon_code: 5,
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B9A85BB4-9730-8D67-68CA-2C1FF902A0E6.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '2',
                value: 400,
                dialog_data: {
                    value: 400,
                    scratch_description: 'Apko milta hai flat 10% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 10% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description_hi: 'आपको मिलता है flat 10% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 10% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B52BD107-B49B-EA5E-DD2A-F2FEF69F0FD7.webp',
                    coupon_code: 10,
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/DF7228CB-F1EE-9E99-E4F6-214CEEB2211B.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '3',
                value: 500,
                dialog_data: {
                    value: 500,
                    scratch_description: 'Apko milta hai flat 15% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 15% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 15% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    short_description_hi: 'आपको मिलता है flat 15% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/59FE4B83-ECA3-6AC3-323D-E172D5C649BB.webp',
                    coupon_code: 15,
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/96F94298-2E4F-8957-12AF-E8E0CC315D71.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '4',
                value: 600,
                dialog_data: {
                    value: 600,
                    scratch_description: 'Apko milta hai flat 20% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 20% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 20% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    short_description_hi: 'आपको मिलता है flat 20% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/E38138BB-4BB9-91FF-FE2A-404B277935BF.webp',
                    coupon_code: 20,
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4265D6DA-4E82-DC60-DC1E-8A7AE5E6C757.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '5',
                value: 700,
                dialog_data: {
                    value: 700,
                    scratch_description: 'Apko milta hai 1 hafte ke liye apki choice ke course ka FREE ACCESS!',
                    scratch_description_hi: 'आपको मिलता है 1 हफ्ते के लिए आपके पसंद का कोई भी कोर्स मुफ्त में ',
                    short_description: 'Apko milta hai 1 hafte ke liye apki choice ke course ka FREE ACCESS!',
                    short_description_hi: 'आपको मिलता है 1 हफ्ते के लिए आपके पसंद का कोई भी कोर्स मुफ्त में ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/15A36DBB-7B36-9298-D5BD-A31372096BC8.webp',
                    coupon_code: 'GETFREE7',
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2663DB62-BCEE-7FAC-0BB6-45EA8781020D.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'trial',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '6',
                value: 1200,
                dialog_data: {
                    value: 1200,
                    scratch_description: 'Apko milta hai flat 25% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 25% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 25% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    short_description_hi: 'आपको मिलता है flat 25% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/88AF2FCB-D7D8-BEE5-A347-F8D431F1ABEF.webp',
                    coupon_code: '25',
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/26E513CB-4789-8B86-2D2D-6CB9E6A53104.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '7',
                value: 1500,
                dialog_data: {
                    value: 1500,
                    scratch_description: 'Apko milta hai flat 30% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 30% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 30% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    short_description_hi: 'आपको मिलता है flat 30% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CC997C26-386A-468D-A83D-99EC678DDB07.webp',
                    coupon_code: 30,
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CA1DF75B-4BA4-2512-EEB5-30933942EC58.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '8',
                value: 2000,
                dialog_data: {
                    value: 2000,
                    scratch_description: 'Apko milta hai flat 40% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    scratch_description_hi: 'आपको मिलता है flat 40% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    short_description: 'Apko milta hai flat 40% discount on paid course, iss code ko course khareedne ke liye payment ke samay apply kar sakte hain, max off upto Rs.5000.',
                    short_description_hi: 'आपको मिलता है flat 40% डिस्काउंट जिसे आप कोर्स खरीदने के लिए पेमेंट के समय इस्तेमाल कर सकते हैं, अधिकतम Rs.5000 तक ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/02A28D16-6E99-58AD-0309-810406BE0791.webp',
                    coupon_code: 40,
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CBB62860-5DC1-9290-F32C-E64FE7E4D86D.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'coupon',
                    level: '',
                },
            },
            {
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/56DDBBD7-9C77-E8F9-E4CA-9D84C7B6E3BB.webp',
                text: 'Scratch this card to see what you have won',
                text_hi: 'इस कार्ड को स्क्रैच करें और देखें आपने क्या जीता है',
                level: '9',
                value: 3000,
                dialog_data: {
                    value: 3000,
                    scratch_description: 'Apko milta hai 1 mahine ke liye apki choice ke course ka FREE ACCESS!',
                    scratch_description_hi: 'आपको मिलता है 1 महीने के लिए आपके पसंद का कोई भी कोर्स मुफ्त में ',
                    short_description: 'Apko milta hai 1 mahine ke liye apki choice ke course ka FREE ACCESS!',
                    short_description_hi: 'आपको मिलता है 1 महीने के लिए आपके पसंद का कोई भी कोर्स मुफ्त में ',
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/15A36DBB-7B36-9298-D5BD-A31372096BC8.webp',
                    coupon_code: 'GETFREE30',
                    top_button_text: 'Check Courses',
                    top_button_text_hi: 'कोर्सेस देखें',
                    bottom_button_text: 'Share with Friends',
                    bottom_button_text_hi: 'शेयर करें',
                    share_deeplink: `doubtnutapp://whatsapp?external_url=https://api.whatsapp.com/send?text=${encodeURI('DOUBTNUT PREMIER LEAGUE se maine jeeta ye inaam! Aajao saath khelein aur jeetein Doubtnut par aur bhi rewards! https://doubtnut.app.link/scC2Pul5Ijb')}`,
                    scratched_image_link: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2663DB62-BCEE-7FAC-0BB6-45EA8781020D.webp',
                    locked_short_description: 'locked_short_description',
                    locked_subtitle: 'locked_subtitle',
                    locked_Long_description: 'locked_Long_description',
                    is_scratched: false,
                    is_unlocked: true,
                    reward_type: 'trial',
                    level: '',
                },
            },
        ];
        this.myPoint = myPoint;
    }

    pointWidget() {
        return this.pointMilestones.map((pointMilestone) => {
            pointMilestone.is_achieved = 0;
            if (pointMilestone.value <= this.myPoint) {
                pointMilestone.is_achieved = 1;
                pointMilestone.image_url = config.rewardIconMapping[pointMilestone.value];
            }
            return pointMilestone;
        });
    }

    async rewardWidget(db, studentId, locale) {
        const toReturn = [];
        const allScratchedCoupons = await QuizTfsMysql.getAllScratchedCoupForStudentToday(db, studentId);
        const allScratchedCouponsGrouped = _.groupBy(allScratchedCoupons, 'milestone_score');
        for (let i = 0; i < this.rewardMilestones.length; i++) {
            const rewardMilestone = this.rewardMilestones[i];
            rewardMilestone.dialog_data.status = 'LOCKED';
            if (rewardMilestone.dialog_data.value <= this.myPoint) {
                rewardMilestone.dialog_data.status = 'UNSCRATCHED';
                if (allScratchedCouponsGrouped[rewardMilestone.dialog_data.value]) {
                    rewardMilestone.dialog_data.status = allScratchedCouponsGrouped[rewardMilestone.dialog_data.value][0].is_redeemed ? 'REDEEMED' : 'SCRATCHED';
                    rewardMilestone.image_url = rewardMilestone.dialog_data.image_url;
                    rewardMilestone.dialog_data.image_url = rewardMilestone.dialog_data.scratched_image_link;
                    rewardMilestone.text = rewardMilestone.dialog_data.short_description;
                    rewardMilestone.dialog_data.coupon_code = allScratchedCouponsGrouped[rewardMilestone.dialog_data.value][0].coupon_code;
                }
            }
            const toPush = locale === 'hi' ? sendHindiData(rewardMilestone) : sendData(rewardMilestone);
            toReturn.push(toPush);
        }
        return toReturn;
    }

    async getCoupon(value, locale) {
        const groupedByValue = _.groupBy(this.rewardMilestones, 'value');
        if (this.myPoint >= value && groupedByValue[value]) {
            groupedByValue[value][0].dialog_data.status = 'SCRATCHED';
            return (locale === 'hi' ? sendHindiData(groupedByValue[value][0]) : sendData(groupedByValue[value][0]));
        }
        // create unique coupon code
        return false;
    }

    redeemedRewardsWidget(redeemedRewards, locale) {
        const groupedByValue = _.groupBy(this.rewardMilestones, 'value');
        return redeemedRewards.map((redeemReward) => {
            if (groupedByValue[redeemReward.milestone_score]) {
                const redeemRewardWidgetItem = groupedByValue[redeemReward.milestone_score][0];
                const expiryDate = new Date(redeemReward.valid_till);
                const now = new Date();
                redeemRewardWidgetItem.dialog_data.status = 'EXPIRED';
                redeemRewardWidgetItem.dialog_data.coupon_code = redeemReward.coupon_code;
                if (now.valueOf() < expiryDate.valueOf()) {
                    redeemRewardWidgetItem.image_url = redeemRewardWidgetItem.dialog_data.image_url;
                    redeemRewardWidgetItem.dialog_data.image_url = redeemRewardWidgetItem.dialog_data.scratched_image_link;
                    redeemRewardWidgetItem.dialog_data.status = 'SCRATCHED';
                    if (redeemRewardWidgetItem.is_redeemed) redeemRewardWidgetItem.dialog_data.status = 'REDEEMED';
                }
                const toReturn = locale === 'hi' ? sendHindiData(redeemRewardWidgetItem) : sendData(redeemRewardWidgetItem);
                return { ...toReturn, ...redeemReward };
            }
            return false;
        });
    }
};
