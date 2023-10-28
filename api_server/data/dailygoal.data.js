const config = require('../config/config');

const benefitsImageLinks = [
    `${config.staticCDN}engagement_framework/1752A54A-B63E-E2AF-21FE-51DA2F454628.webp`,
    `${config.staticCDN}engagement_framework/8B58C35F-F53D-7D95-5A79-DDAE318DE818.webp`,
    `${config.staticCDN}engagement_framework/1DF3B9F8-DB03-8F78-1332-C018B49A10BB.webp`,
];
const createGoalImageLinks = [
    `${config.staticCDN}engagement_framework/565CE654-D09F-9183-0230-90E5E0BF092D.webp`,
    `${config.staticCDN}engagement_framework/0C13011D-5C75-F6DF-C2F5-AD8EBB7889C0.webp`,
    `${config.staticCDN}engagement_framework/D5277F56-CE4C-B724-281D-BE8920EFC9E5.webp`,
];

module.exports = {
    userName: 'Doubtnut User',
    userImage: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/91E3CF53-0C7F-55D9-E02E-0532869D455F.webp',

    knowMoreEn: {
        heading: 'How to earn scratch cards by completing daily goals',
        notes: {
            title: 'What is Daily Goal?',
            description: 'Daily goal is a new feature designed for you to help you prepare for exams topic wise and get better marks. Best part about daily goal is that you can prepare a'
                + 'complete topic in a single place. You just have to ask a question from any topic/subject you want to study and watch the solution to that video, that’s it. Then you'
                + 'can check all related tasks to that topic in a single place which is daily goal and once you start practicing daily goal regularly, your probability of getting better marks will increase by up to 20%.\n'
                + '1. You will earn scratch cards on the basis of your daily streak in completing the daily goal.\n'
                + '2. If you miss completing your daily goal on a day, your streak would break and you will start from the beginning.\n'
                + '3. Only goals completed on the day they are generated will be considered for the scratch cards.\n'
                + '4. Previous Goals are shown for your practice. Completing them will not lead to earning scratch cards.',
        },
    },

    knowMoreHi: {
        heading: 'ज़्यादा स्क्रैच कार्ड कैसे कमाएं?',
        notes: {
            title: 'डेली गोल क्या है?',
            description: 'डेली गोल डाउटनट का एक नया फीचर है जिसे आपकी पढ़ाई में सहायता करने के लिए बनाया गया है| विषय के अनुसार परीक्षा की तैयारी करें और बेहतर अंक प्राप्त करें।'
                + 'डेली गोल के बारे में सबसे अच्छी बात यह है कि आप एक ही स्थान पर पूरा विषय तैयार कर सकते हैं। आप जिस विषय का अध्ययन करना चाहते हैं उसमें से आपको बस एक प्रश्न पूछना है और उस वीडियो का समाधान देखना है।'
                + 'फिर आप उस विषय के सभी संबंधित टास्क एक ही स्थान पर देख सकते हैं, जो कि आपका डेली गोल है। अगर एक बार आप नियमित रूप से डेली गोल का अभ्यास करना शुरू कर दें, आपके बेहतर अंक आने की संभावना 20% तक बढ़ जाएगी।\n'
                + '1. आप डेली गोल को पूरा करने में अपनी दैनिक स्ट्रीक के आधार पर स्क्रैच कार्ड अर्जित करेंगे।\n'
                + '2. यदि आप किसी दिन अपने डेली गोल को पूरा करने से चूक जाते हैं, तो आपकी लकीर टूट जाएगी और आप शुरुआत से ही शुरुआत कर देंगे।\n'
                + '3. स्क्रैच कार्ड के लिए केवल उसी दिन पूरे किए गए लक्ष्यों पर विचार किया जाएगा, जिस दिन वे जेनरेट किए जाएंगे।\n'
                + '4. आपके अभ्यास के लिए पिछले लक्ष्य दिखाए गए हैं। उन्हें पूरा करने से स्क्रैच कार्ड नहीं मिलेंगे।',
        },
    },

    shareTextHi: 'हेलो, चेक करें कि मैंने डेली गोल ईनाम से क्या जीता है। आप भी जीत सकते हैं, बस डेली गोल को पूरा करने के लिए रोजाना डाउटनट का उपयोग करें।\nhttps://doubtnut.app.link/62MkmckR2hb',
    shareTextEn: 'Hey, Check what I won from daily goal reward at doubtnut. You can also win, just use doubtnut daily to complete daily goal.\nhttps://doubtnut.app.link/62MkmckR2hb',

    lockedSubtitleEn: 'Get Rewards Like',
    lockedSubtitleHi: 'कुछ ऐसे रिवार्ड्स जीतें',
    prevDoubtsHeading: {
        en: 'Previous Doubts',
        hi: 'पिछले सवाल',
    },
    leaderboard: {
        title: {
            en: 'Daily Goal Leaderboard',
            hi: 'डेली गोल लीडरबोर्ड',
        },
        deeplink: 'doubtnutapp://doubt_feed_2/leaderboard',
        icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/2AD3A6C6-667C-C3E5-C90C-17E6B92CC35E.webp',
        tabs: {
            en: [{ title: 'Weekly', id: 1 }, { title: 'Monthly', id: 2 }],
            hi: [{ title: 'साप्ताहिक', id: 1 }, { title: 'मासिक', id: 2 }],
        },
        weeklyTitle: {
            en: 'Current Weekly Toppers',
            hi: 'वर्तमान साप्ताहिक टॉपर्स',
        },
        monthlyTitle: {
            en: 'Current Monthly Toppers',
            hi: 'वर्तमान मासिक टॉपर्स',
        },
        rank: {
            hi: 'आपका रैंक: ',
            en: 'Your Rank: ',
        },
        homeTitle: {
            en: 'Iss week ke Champions!',
            hi: 'इस सप्ताह के चैंपियंस!',
        },
        homeSubtitle: {
            en: 'Complete maximum daily goals and you can also become champion.',
            hi: 'अधिकतम डेली गोल पूरे करें और आप चैंपियन भी बन सकते हैं।',
        },
        view_all: {
            en: 'View Leaderboard',
            hi: 'लीडरबोर्ड देखें',
        },
    },

    reward: {
        scratch_title: {
            en: 'Unlock Rewards by practicing daily goals',
            hi: 'डेली गोल का अभ्यास करके पुरस्कार अनलॉक करें',
        },
        info: {
            title: {
                en: 'Dail Goal Reward System',
                hi: 'डेली गोल पुरस्कार प्रणाली',
            },
            description: {
                en: 'Ye reward system daily goal complete krne k basis chalta hai, iska Daily attendance reward system se koi relation nhi',
                hi: 'ये इनाम प्रणाली डेली गोल पूर्ण करने के आधार चलता है, इस्का दैनिक उपस्थिति इनाम प्रणाली से कोई संबंध नहीं',
            },
        },
        title: {
            en: 'Current Streak',
            hi: 'वर्तमान धारा',
        },
        subtitle: {
            en: 'It’s DAY <>',
            hi: 'यह दिन <> है',
        },
        knowMore: {
            en: 'Know More',
            hi: 'अधिक जाने',
        },
        deeplink: 'doubtnutapp://doubt_feed_2/rewards',
        incomplete: {
            en: 'This is your %d day streak of daily goal, keep completing goals daily to win rewards',
            hi: 'यह आपके लगातार दैनिक लक्ष्य को पूरा करने का दिन %d है, पुरस्कार जीतने के लिए पूरा करते रहो डेली गोल',
        },
    },
    submit: {
        title: {
            en: 'Congratulations, you have just completed your daily goal',
            hi: 'बधाई हो आपने अभी-अभी अपना डेली गोल पूरा किया है',
        },
        description: {
            en: 'This has helped you improve your overall rankings',
            hi: 'इससे आपकी रैंकिंग में सुधार आया है',
        },
        buttonText: {
            en: 'Check Your Ranking',
            hi: 'अपनी रैंक देखें',
        },
        allTaskCompletedImage: `${config.staticCDN}daily_feed_resources/all-tasks-completed.webp`,
    },
    benefits: {
        title: {
            en: 'Benefits of completing daily goal',
            hi: 'डेली गोल पूरा करने के लाभ',
        },
        dataEn: [{
            description: 'Get upto 20% more marks, if you complete daily goals regularly',
            image: benefitsImageLinks[0],
        }, {
            description: 'Get All topic revision materials at a single place',
            image: benefitsImageLinks[1],
        }, {
            description: 'Win rewards by completing daily goals regularly',
            image: benefitsImageLinks[2],
        }],
        dataHi: [{
            description: 'यदि आप नियमित रूप से डेली गोल को पूरा करते हैं, तो 20% अधिक अंक प्राप्त करें',
            image: benefitsImageLinks[0],
        }, {
            description: 'विषय के रिवीज़न के लिए मटेरियल, एक ही जगह पर',
            image: benefitsImageLinks[1],
        }, {
            description: 'डेली गोल को नियमित रूप से पूरा करके पुरस्कार जीतें',
            image: benefitsImageLinks[2],
        }],
    },
    createGoal: {
        title: {
            en: 'How to setup a daily goal for any topic you want to study for?',
            hi: 'किसी भी विषय का डेली गोल कैसे निर्धारित करें, जो आप पढना चाहते हैं?',
        },
        subTitle: {
            en: 'Ask a question to set goal for the day and start studying',
            hi: 'रोज का लक्ष्य निर्धारित करने क लिए प्रश्न पूछें और पढाई करना शुरू करें',
        },
        dataEn: [{
            description: 'Ask a question from any topic you want to set goal for.',
            image: createGoalImageLinks[0],
        }, {
            description: 'Watch video/text solution of that question',
            image: createGoalImageLinks[1],
        }, {
            description: 'Come back to daily goal and that\'s it, your daily goal for that topic is ready.',
            image: createGoalImageLinks[2],
        }],
        dataHi: [{
            description: 'आप जिस भी विषय के लिए लक्ष्य निर्धारित करना चाहते हैं, उसका एक प्रश्न पूछें।',
            image: createGoalImageLinks[0],
        }, {
            description: 'उस प्रश्न का वीडियो या लिखित समाधान देखें',
            image: createGoalImageLinks[1],
        }, {
            description: 'उसके बाद डेली गोल पर वापस आएं और उस विषय के लिए आपका डेली गोल तैयार है।',
            image: createGoalImageLinks[2],
        }],
    },
    completedTodayGoal: {
        title: {
            en: 'Set a new daily goal now to continue with your daily streak and get rewarded',
            hi: 'अपने रोज़ के स्ट्रीक को जारी रखने और पुरस्कृत होने के लिए अभी एक नया डेली गोल निर्धारित करें|',

        },
    },
    yesterdayGoal: {
        title: {
            en: 'No Daily Goal',
            hi: 'कोई डेली गोल नहीं है',
        },
        subTitle: {
            en: 'Ask a question to set goal for the day and start studying',
            hi: 'रोज का लक्ष्य निर्धारित करने क लिए प्रश्न पूछें और पढाई करना शुरू करें',
        },
    },
    notInterested: {
        en: 'Not interested in {topic} ?\nGet a new feed by asking question from the topic you want to study.',
        hi: 'क्या आप {topic} में इच्छुक नहीं हैं ?\nअपने पसंदीदा विषय में से सवाल पूछें और नया फीड पाएं|',
    },
    progressButton: {
        en: 'Ask Question',
        hi: 'प्रश्न पूछें',
    },
    backpressBottomLine: {
        en: 'I don’t want to study',
        hi: 'मुझे नहीं पढना',
    },
    setGoal: {
        title: {
            en: 'Set a daily goal now',
            hi: 'डेली गोल निर्धारित करें',
        },
    },
    rankWarning: {
        en: `Your ranking may go down, ${Math.floor(Math.random() * (15000 - 5000 + 1) + 5000)} students have already set their daily goal, set now.`,
        hi: `आपकी रैंकिंग नीचे जा सकती है, ${Math.floor(Math.random() * (15000 - 5000 + 1) + 5000)}  छात्र पहले ही अपना डेली गोल सेट कर चुके हैं, आप भी करें तुरंत।`,
    },
    noFeedImage: `${config.staticCDN}daily_feed_resources/no-daily-feed-heading.webp`,
    cameraDeeplink: 'doubtnutapp://camera',

    mainheading: {
        en: 'Your Doubts',
        hi: 'आपके सवाल/डाउट',
    },
    mainCompletedheading: {
        en: 'Your Completed Doubts',
        hi: 'आपके पूरा हो चुका सवाल/डाउट',
    },
    mainheadingOld: {
        en: 'Previous Doubts',
        hi: 'पिछले सवाल/ डाउट',
    },
    studentSection: {
        heading: {
            en: 'Start your practice',
            hi: 'अभ्यास शुरू करें',
        },
        subHeading: {
            en: 'students studying now',
            hi: 'छात्र अभी पढ़ रहे हैं',
        },
    },
    pdf: {
        title: {
            en: 'Notes on',
            hi: 'के नोट्स',
        },
        subTitle: {
            en: 'May take up to 15 minutes',
            hi: '15 मिनट तक लग सकते हैं',
        },
    },
    formulaSheet: {
        title: {
            en: 'Formula Sheet',
            hi: 'फार्मूला/फ़ॉर्म्युला शीट',
        },
        subTitle: {
            en: 'May take upto 10 minutes',
            hi: '10 मिनट तक लग सकते हैं',
        },
    },
    topicVideos: {
        title: {
            en: 'Topic Videos',
            hi: 'टॉपिक वीडियोज़',
        },
        subTitle: {
            en: 'Will take up to',
            hi: 'मिनट तक लग सकते हैं',
        },
    },
    liveClass: {
        title: {
            en: 'Recommended Live Class',
            hi: 'आपके लिए सुझावित लाइव क्लास?',
        },
        subTitle: {
            en: 'Will take',
            hi: 'मिनट लगेंगे',
        },
    },
    topicBooster: {
        title: {
            en: 'Khelo Aur Jeeto',
            hi: 'खेलो और जीतो',
        },
        subTitle: {
            en: 'Will take up to 5 minutes',
            hi: '5 मिनट तक लग सकते हैं',
        },
    },
    todayGoal: {
        title: {
            en: 'Daily Goal',
            hi: 'डेली गोल',
        },
        completedTitle: {
            en: 'Daily Goal Completed',
            hi: 'डेली गोल पूरा हो चुका है',
        },
        subTitle: {
            en: 'Introducing daily task habits to help you get ready for your goal',
            hi: 'पेश हैं आपके लिए रोज़ के टास्क जो आपको लक्ष्य हासिल करने में मदद करेंगे|',
        },
        completedSubTitle: {
            en: 'Congratulations. You completed all your task for today’s goal. If you want to regenerate your feed with a new topic ask a question',
            hi: 'बधाई हो, आज का लक्ष्य पूरा हो चुका है, अगर आप नए विषय से दोबारा फीड बनाना चाहते हैं तो सवाल पूछें|',
        },
    },
    completedTaskButtonText: {
        en: 'Start Next Task',
        hi: 'अगला टास्क शुरू करें',
    },
    allCompletedTaskButtonText: {
        en: 'Done',
        hi: 'हो गया',
    },
    noDoubtBackpressHeding: {
        en: 'Get a new feed by asking question from the topic you want to study',
        hi: 'अपने पसंदीदा विषय में से सवाल पूछें और नया फीड पाएं',
    },
    defaultTopicTitle: {
        en: 'No Daily Goal Set',
        hi: 'डेली गोल सेट नहीं है',
    },
    previousDoubtDeeplink: 'doubtnutapp://doubt_feed_2/previous',
    previousDoubt: {
        en: 'Check Previous Doubts',
        hi: 'पिछला संदेह देखें',
    },
};
