module.exports = {
    quizColors: {
        0: ['#e34c4c', '#ffadad'], 1: ['#e34c4c', '#ffadad'], 2: ['#e3a92a', '#ffeeca'], 3: ['#bd59dc', '#ecb0ff'], 5: ['#ABDCFF', '#4CA4E3'], 10: ['#93FFDC', '#05C789 '],
    },
    availableclassesforlangauge: {
        hi: ['6', '7', '8', '9', '10', '11', '12', '14'],
        en: ['6', '7', '8', '9', '10', '11', '12', '14'],
        te: ['9', '10'],
        ta: ['10', '11', '12'],
        bn: ['11', '12'],
        gu: ['12'],
    },
    availablelabguageforclasses: {
        6: ['hi', 'en'],
        7: ['hi', 'en'],
        8: ['hi', 'en'],
        9: ['hi', 'en', 'te'],
        10: ['hi', 'en', 'ta', 'te'],
        11: ['hi', 'en', 'bn', 'ta'],
        12: ['hi', 'gu', 'en', 'ta', 'bn'],
        14: ['hi', 'en'],
    },
    languageMapping: {
        en: 'English Medium',
        bn: 'Bengali Medium',
        gu: 'Gujurati Medium',
        hi: 'Hindi Medium',
        kn: 'Karnataka Medium',
        ta: 'Tamil Medium',
        te: 'Teulugu Medium',
    },
    subjectIconMapping: {
        ENGLISH: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B753D6F9-ADD6-06F6-AAAC-15091F2B3BEA.webp',
        MATHS: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B1F6833A-206B-C036-FCE9-49036E85E005.webp',
        PHYSICS: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B5440B60-92A2-FE01-5461-6A619C81F89A.webp',
        CHEMISTRY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/D2B83FE6-F53F-02D0-9A49-1889859A7413.webp',
        BIOLOGY: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2AB492DE-A223-D5D0-7D97-DEA98848EB20.webp',
        DEFAULT: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/1F043ABC-7EC5-9249-08AF-E541802989CF.webp',
    },

    subjectColorMappingDetails: {
        BIOLOGY: '#a19a30',
        CHEMISTRY: ' #00a167',
        ENGLISH: '#e34c4c',
        MATHS: '#4ca4e3',
        SCIENCE: '#00a167',
        PHYSICS: '#854ce3',
        'SOCIAL SCIENCE': '#4852db',
        BOTANY: '#71ba66',
        'CHILD DEVELOPMENT PEDAGOGY': '#d35882',
        'GENERAL KNOWLEDGE': '#8235d6',
        'GENERAL SCIENCE': '#cf7d4a',
        GUIDANCE: '#3f8aaa',
        REASONING: '#3f8aaa',
        'ENVIRONMENTAL STUDIES': '#cea644',
    },

    subjectFilterColorMappingDetails: {
        MATHS: '#2376B2',
        PHYSICS: '#622ABD',
        BIOLOGY: '#139C6B',
        CHEMISTRY: '#C07A27',
        ENGLISH: '#B02727',
        GUIDANCE: '#3F8AAA',
    },
    emptyDataWidget: {
        meta: {
            code: 200,
            success: true,
            message: 'SUCCESS',
        },
        data: {
            widgets: [
                {
                    type: 'text_widget',
                    data: {
                        title: 'No Data found',
                        isBold: false,
                    },
                    layout_config: {
                        margin_top: 12,
                        margin_left: 16,
                    },
                }],
        },
    },
    streakMultiplier: {
        1: 1,
        2: 2,
        3: 3,
        4: 3,
        5: 5,
        6: 5,
        7: 10,
        8: 10,
        9: 3,
    },
    winner(value) {
        return `🎓${value[0].student_fname} just won scholarship upto worth 40%! Apko chahiye? 🎯`;
    },
    noWinner: () => 'Din ki pehli scholarship kariye apne naam! 🎓 🥳',
    tagColor: {
        CORRECT: '#64864A',
        SKIPPED: '#FFA700',
        WRONG: '#FF7E5A',
        सही: '#64864A',
        गलत: '#FF7E5A',
        'छोड़ा हुआ': '#FFA700',
    },

    rewardIconMapping: {
        1: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl1_achieved.webp',
        10: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl2_achieved.webp',
        500: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl3_achieved.webp',
        600: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl4_achieved.webp',
        900: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl5_achieved.webp',
        1200: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl6_achieved.webp',
        1500: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl7_achieved.webp',
        2000: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl8_achieved.webp',
        3000: 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/quiztfs_lvl9_achieved.webp',
    },
    waitTitle: '🔍Preparing the pitch...\n📚 Books Ready...\n✏️ Pen Ready...\n📔 Notebook ready...\n📺 Umpires ready…',
    waitSubTitle: 'Bano MAN OF THE MATCH!',
    pastSessionFilter: (state, locale) => ({
        type: 'subject_filters',
        data: {
            items:
                [{
                    filter_id: locale === 'hi' ? 'गलत' : 'WRONG',
                    text: locale === 'hi' ? 'गलत' : 'WRONG',
                    color: '#FF7E5A',
                    is_selected: locale === 'hi' ? state === 'गलत' : state === 'WRONG',
                },
                {
                    filter_id: locale === 'hi' ? 'सही' : 'CORRECT',
                    text: locale === 'hi' ? 'सही' : 'CORRECT',
                    color: '#64864A',
                    is_selected: locale === 'hi' ? state === 'सही' : state === 'CORRECT',
                },
                {
                    filter_id: locale === 'hi' ? 'छोड़ा हुआ' : 'SKIPPED',
                    text: locale === 'hi' ? 'छोड़ा हुआ' : 'SKIPPED',
                    color: '#FFA700',
                    is_selected: locale === 'hi' ? 'छोड़ा हुआ' : state === 'SKIPPED',
                },
                ],
        },
    }),
    transitionResponseCreator: (objects) => {
        const toReturn = [];
        for (let i = 0; i < objects.length; i++) {
            const item = objects[i];
            const struct = {
                rank: `${i}`,
                image: item.img_url,
                name: `${item.student_fname} ${item.student_lname}`,
                marks: `${item.pts_received}`,
                student_id: item.student_id,
                icon: 'https://d10lpgp6xz60nq.cloudfront.net//engagement_framework/9FACB6B1-B6D5-262D-0F55-7787D99F175C.webp',
                profile_deeplink: `doubtnutapp://profile?student_id=${item.student_id}source=leaderboard`,
                elevation: 3,
            };
            toReturn.push(struct);
        }
        return toReturn;
    },
    hindiPageTitle: (studentClass, subject) => `${studentClass === '14' ? 'सरकारी परीक्षाओं' : 'Class '.concat(studentClass)} ke ${subject[0] + subject.substring(1, subject.length).toLowerCase()} के मैदान-ए-जंग में आपका स्वागत है\n अब होगा दंगल`,
    pageTitle: (studentClass, subject) => `${studentClass === '14' ? 'Sarkari Exams' : 'Class '.concat(studentClass)} ke ${subject[0] + subject.substring(1, subject.length).toLowerCase()} ke maidan-e-jung mein aapka swagat hai\n Ab hoga dangal!`,
    firstSubmitNotification: (locale) => ({
        title: locale === 'hi' ? 'DPL में दोस्त बन गए दुश्मन !' : 'DPL me dost ban gaye dushman !',
        message: locale === 'hi' ? 'आपके दोस्त DPL खेल रहे हैं.. आपको नहीं बताए ना ? हम बता रहे हैं ...' : 'Aapke dost DPL khel rahe hain.. aapko nahin bataye na? Hum bata rahe hain..',
        event: 'daily_practice',
        image: locale === 'hi' ? 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/engagement_framework/dpl_champion_copy_hi_16_9.webp' : 'https://doubtnut-static.s3.ap-south-1.amazonaws.com/engagement_framework/dpl_champion_copy_en_16_9.webp',
        firebase_eventtag: 'QUIZTFS_SUBMIT',
        data: {},
    }),

};
