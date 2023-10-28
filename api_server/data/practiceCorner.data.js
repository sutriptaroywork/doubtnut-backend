/* eslint-disable no-unused-vars */
const data = {
    userName: 'Doubtnut User',
    userImage: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/91E3CF53-0C7F-55D9-E02E-0532869D455F.webp',
    recentTopicTitle: {
        en: 'Recently Studied',
        hi: 'हाल ही में अध्ययन किया',
    },
    revisionCornerTitle: {
        en: 'Revision Corner',
        hi: 'रिवीज़न कॉर्नर',
    },
    aptitudeTestHeading: {
        en: 'Test your aptitude',
        hi: 'अपनी क्षमता परखें',
    },
    subjectSelection: {
        heading: {
            en: 'Select your chapter',
            hi: 'अपने अध्याय का चयन करें',
        },
        description: {
            hi: 'जिस अध्याय पर चैलेंज करना चाहते हो, प्रतियोगी को उससे चुनें',
            en: 'Choose chapter which you want to practice',
        },
        selectChapters: {
            en: 'Choose Chapter',
            hi: 'अध्याय का चयन करें',
        },
        chooseSubject: {
            en: 'Choose your subject',
            hi: 'अपना विषय चुनें',
        },
        searchPlaceholder: {
            en: 'Search for a chapter',
            hi: 'अध्याय खोजें',
        },
    },
    colorCodes: {
        correctAnswerColor: '#228B22',
        incorrectAnswerColor: '#FF0000',
        skippedAnswerColor: '#696969',
    },
    randomChapter: {
        en: 'Play With a Random Chapter',
        hi: 'अनियमित अध्याय में से खेलें',
    },
    prev: {
        en: 'Previous',
        hi: 'पिछला',
    },
    next: {
        en: 'Next',
        hi: 'अगला',
    },
    nextCtaDeeplink: 'doubtnutapp://revision_corner/rules?widget_id=2',
    selectChapterForGame: {
        en: 'Select a chapter you want to play game with',
        hi: 'उस अध्याय का चयन करें जिससे आप गेम खेलना चाहते हैं',
    },
    startTest: {
        en: 'START TEST',
        hi: 'टेस्ट शुरू करें',
    },
    widgetIdRulesMapping: {
        1: {
            en: {
                title: 'Daily Practice Problems',
                subtitle: 'Question types and rules',
                rules: [
                    { index: 'Q1', description: 'This is a set of 10 questions which will be updated daily' },
                    { index: 'Q2', description: 'This is a multiple choice question set with only one correct answer' },
                    { index: 'Q3', description: 'There is no time limit to complete the test. But every night after 12 am, this test would end and a new daily practice problem set would be generated.' },
                    { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test' },
                    { index: 'Q5', description: 'You can check all the past solved practice problems and watch solutions also by clicking on green icon on top beside your profile' },
                    { index: 'Q6', description: 'There are no marks for these questions. This is only for the revision of your subjects.' },
                    { index: 'Q7', description: 'Questions which you will not answer will be counted as skipped' },
                ],
            },
            hi: {
                title: 'रोजाना अभ्यास के लिए',
                subtitle: 'प्रश्नों के प्रकार और नियम',
                rules: [
                    { index: 'Q1', description: 'यह 10 प्रश्नों का एक सेट है जिसे प्रतिदिन अपडेट किया जाएगा|' },
                    { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                    { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है लेकिन आपको 12 बजे से पहले इनका अभ्यास करना होगा अन्यथा यह 12 बजे के बाद टेस्ट ख़त्म हो जाएगा और एक नया टेस्ट शुरू हो जाएगा|' },
                    { index: 'Q4', description: 'आपके द्वारा टेस्ट पूरा करने के बाद सभी उत्तरों का समाधान उपलब्ध होगा|' },
                    { index: 'Q5', description: 'आप अपनी प्रोफ़ाइल के बगल में हरे रंग के आइकन पर क्लिक करके पिछली सभी हल की गई अभ्यास परीक्षा की जांच कर सकते हैं और समाधान भी देख सकते हैं|' },
                    { index: 'Q6', description: 'इस अभ्यास के लिए कोई अंकन प्रणाली नहीं है, यह सिर्फ आपके विषयों का पुनः रिवीज़न करने के लिए है|' },
                    { index: 'Q7', description: 'आप जिन प्रश्नों का आप उत्तर नहीं देंगे उन्हें छोड़े गए प्रश्नों के रूप में गिना जाएगा' },
                ],
            },
        },
        2: {
            en: {
                title: 'Topic Based Short Test',
                subtitle: 'Question types and rules',
                rules: [
                    { index: 'Q1', description: 'This test is a set of 10 questions.' },
                    { index: 'Q2', description: 'This is a multiple choice question set where only one answer is correct' },
                    { index: 'Q3', description: 'There is no time limit for completing the test.' },
                    { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test.' },
                    { index: 'Q5', description: 'You can check all the past solved practice problems and watch solutions also by clicking on green icon on top beside your profile' },
                    { index: 'Q6', description: '4 marks will be given for each correct answer and there is no negative marks for incorrect questions.' },
                    { index: 'Q7', description: 'Questions which you will not answer will be counted as skipped' },
                ],
            },
            hi: {
                title: 'विषय आधारित शॉर्ट टेस्ट',
                subtitle: 'प्रश्नों के प्रकार और नियम',
                rules: [
                    { index: 'Q1', description: 'यह 10 प्रश्नों का एक सेट' },
                    { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                    { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है' },
                    { index: 'Q4', description: 'सभी उत्तरों का समाधान आपके टेस्ट पूरा करने के बाद ही उपलब्ध होगा|' },
                    { index: 'Q5', description: 'आप पिछले सभी हल किये गए अभ्यास प्रश्नों की जांच कर सकते हैं और अपनी समस्या के बगल में हरे रंग के आइकन पर क्लिक करके समाधान भी देख सकते हैं।' },
                    { index: 'Q6', description: 'एक सही उत्तर के लिए चार अंक होंगे और कोई नकारात्मक अंकन नहीं होगा|' },
                    { index: 'Q7', description: 'जिन प्रश्नों का आप उत्तर नहीं देंगे उन्हें छोड़े गए प्रश्नों के रूप में गिना जाएगा' },
                ],
            },
        },
        4: {
            en: {
                title: 'Aptitude Test for Improving IQs',
                subtitle: 'Instructions for the test',
                rules: [
                    { index: 'Q1', description: 'This test is a set of 10 questions.' },
                    { index: 'Q2', description: 'This is a multiple choice question set where only one answer is correct' },
                    { index: 'Q3', description: 'There is no time limit for completing the test.' },
                    { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test.' },
                    { index: 'Q5', description: 'You can check all the past solved practice problems and watch solutions also by clicking on green icon on top' },
                    { index: 'Q6', description: 'Questions which you will not answer will be counted as skipped' },
                ],
            },
            hi: {
                title: 'IQ सुधारने के लिए एप्टीट्यूड टेस्ट',
                subtitle: 'परीक्षण के लिए निर्देश',
                rules: [
                    { index: 'Q1', description: 'यह 10 प्रश्नों का एक सेट |' },
                    { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                    { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है |' },
                    { index: 'Q4', description: 'सभी उत्तरों का समाधान आपके टेस्ट पूरा करने के बाद ही उपलब्ध होगा|' },
                    { index: 'Q5', description: 'आप पिछले सभी हल किये गए अभ्यास प्रश्नों की जांच कर सकते हैं और अपनी समस्या के बगल में हरे रंग के आइकन पर क्लिक करके समाधान भी देख सकते हैं।|' },
                    { index: 'Q6', description: 'जिन प्रश्नों का आप उत्तर नहीं देंगे उन्हें छोड़े गए प्रश्नों के रूप में गिना जाएगा |' },
                ],
            },
        },
    },
    dailyPracticeRules: {
        en: {
            title: 'Daily Practice Problems',
            subtitle: 'Question types and rules',
            rules: [
                { index: 'Q1', description: 'This is a set of 10 questions which will be updated daily' },
                { index: 'Q2', description: 'This is a multiple choice question set with only one correct answer' },
                { index: 'Q3', description: 'There is no time limit to complete the test. But every night after 12 am, this test would end and a new daily practice problem set would be generated.' },
                { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test' },
                { index: 'Q5', description: 'You can check all the past solved practice problems and watch solutions also by clicking on green icon on top beside your profile' },
                { index: 'Q6', description: 'There are no marks for these questions. This is only for the revision of your subjects.' },
                { index: 'Q7', description: 'Questions which you will not answer will be counted as skipped' },
            ],
        },
        hi: {
            title: 'रोजाना अभ्यास के लिए',
            subtitle: 'प्रश्नों के प्रकार और नियम',
            rules: [
                { index: 'Q1', description: 'यह 10 प्रश्नों का एक सेट है जिसे प्रतिदिन अपडेट किया जाएगा|' },
                { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है लेकिन आपको 12 बजे से पहले इनका अभ्यास करना होगा अन्यथा यह 12 बजे के बाद टेस्ट ख़त्म हो जाएगा और एक नया टेस्ट शुरू हो जाएगा|' },
                { index: 'Q4', description: 'आपके द्वारा टेस्ट पूरा करने के बाद सभी उत्तरों का समाधान उपलब्ध होगा|' },
                { index: 'Q5', description: 'आप अपनी प्रोफ़ाइल के बगल में हरे रंग के आइकन पर क्लिक करके पिछली सभी हल की गई अभ्यास परीक्षा की जांच कर सकते हैं और समाधान भी देख सकते हैं|' },
                { index: 'Q6', description: 'इस अभ्यास के लिए कोई अंकन प्रणाली नहीं है, यह सिर्फ आपके विषयों का पुनः रिवीज़न करने के लिए है|' },
                { index: 'Q7', description: 'आप जिन प्रश्नों का आप उत्तर नहीं देंगे उन्हें छोड़े गए प्रश्नों के रूप में गिना जाएगा' },
            ],
        },
    },
    aptitudeTestRules: {
        en: {
            title: 'Aptitude Test for Improving IQs',
            subtitle: 'Instructions for the test',
            rules: [
                { index: 'Q1', description: 'This test is a set of 10 questions.' },
                { index: 'Q2', description: 'This is a multiple choice question set where only one answer is correct' },
                { index: 'Q3', description: 'There is no time limit for completing the test.' },
                { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test.' },
                { index: 'Q5', description: 'You can check all the past solved practice problems and watch solutions also by clicking on green icon on top' },
                { index: 'Q6', description: 'Questions which you will not answer will be counted as skipped' },
            ],
        },
        hi: {
            title: 'IQ सुधारने के लिए एप्टीट्यूड टेस्ट',
            subtitle: 'परीक्षण के लिए निर्देश',
            rules: [
                { index: 'Q1', description: 'यह 10 प्रश्नों का एक सेट |' },
                { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है |' },
                { index: 'Q4', description: 'सभी उत्तरों का समाधान आपके टेस्ट पूरा करने के बाद ही उपलब्ध होगा|' },
                { index: 'Q5', description: 'आप पिछले सभी हल किये गए अभ्यास प्रश्नों की जांच कर सकते हैं और अपनी समस्या के बगल में हरे रंग के आइकन पर क्लिक करके समाधान भी देख सकते हैं।|' },
                { index: 'Q6', description: 'जिन प्रश्नों का आप उत्तर नहीं देंगे उन्हें छोड़े गए प्रश्नों के रूप में गिना जाएगा |' },
            ],
        },
    },
    shortTestRules: {
        en: {
            title: 'Topic Based Short Test',
            subtitle: 'Question types and rules',
            rules: [
                { index: 'Q1', description: 'This test is a set of 10 questions.' },
                { index: 'Q2', description: 'This is a multiple choice question set where only one answer is correct' },
                { index: 'Q3', description: 'There is no time limit for completing the test.' },
                { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test.' },
                { index: 'Q5', description: 'You can check all the past solved practice problems and watch solutions also by clicking on green icon on top beside your profile' },
                { index: 'Q6', description: '4 marks will be given for each correct answer and there is no negative marks for incorrect questions.' },
                { index: 'Q7', description: 'Questions which you will not answer will be counted as skipped' },
            ],
        },
        hi: {
            title: 'विषय आधारित शॉर्ट टेस्ट',
            subtitle: 'प्रश्नों के प्रकार और नियम',
            rules: [
                { index: 'Q1', description: 'यह 10 प्रश्नों का एक सेट' },
                { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है' },
                { index: 'Q4', description: 'सभी उत्तरों का समाधान आपके टेस्ट पूरा करने के बाद ही उपलब्ध होगा|' },
                { index: 'Q5', description: 'आप पिछले सभी हल किये गए अभ्यास प्रश्नों की जांच कर सकते हैं और अपनी समस्या के बगल में हरे रंग के आइकन पर क्लिक करके समाधान भी देख सकते हैं।' },
                { index: 'Q6', description: 'एक सही उत्तर के लिए चार अंक होंगे और कोई नकारात्मक अंकन नहीं होगा|' },
                { index: 'Q7', description: 'जिन प्रश्नों का आप उत्तर नहीं देंगे उन्हें छोड़े गए प्रश्नों के रूप में गिना जाएगा' },
            ],
        },
    },
    fullTestRules: {
        en: {
            title: 'Full length test on exam basis',
            subtitle: 'Question types and rules',
            rules: [
                { index: 'Q1', description: '' },
                { index: 'Q2', description: 'This is a multiple choice question set where only one answer is correct' },
                { index: 'Q3', description: 'There is no time limit to complete all questions but you have to practice these before 12 otherwise it will be gone after 12 amd there will be a new test' },
                { index: 'Q4', description: 'Solution to all the answers will be available after you have completed the test' },
                { index: 'Q5', description: 'You can check back all the past solved practice problems and watch solutions also by clicking on green icon on top beside your profile' },
                { index: 'Q6', description: 'There is no marking system for this practice, this is just to revise your subjects' },
                { index: 'Q7', description: 'You have to answer a minimum of 7 questions to get solution of all the answers and only then you will be able to submit the test' },
                { index: 'Q8', description: 'Questions which you will not answer will be counted as skipped' },
            ],
        },
        hi: {
            title: 'फुल लेंथ टेस्ट',
            subtitle: 'प्रश्नों के प्रकार और नियम',
            rules: [
                { index: 'Q1', description: '' },
                { index: 'Q2', description: 'यह एक बहुविकल्पीय प्रश्न सेट है जहाँ केवल एक उत्तर सही होगा|' },
                { index: 'Q3', description: 'सभी प्रश्नों को पूरा करने की कोई समय सीमा नहीं है लेकिन आपको 12 बजे से पहले इनका अभ्यास करना होगा अन्यथा यह 12 बजे के बाद टेस्ट समाप्त हो जाएगा, एक नया टेस्ट शुरू हो जाएगा|' },
                { index: 'Q4', description: 'आपके द्वारा टेस्ट पूरा करने के बाद सभी उत्तरों का समाधान उपलब्ध होगा|' },
                { index: 'Q5', description: 'आप पिछली सभी हल की गई अभ्यास प्रश्नों की जांच कर सकते हैं और अपनी प्रोफ़ाइल के बगल में हरे रंग के आइकन पर क्लिक करके समाधान भी देख सकते हैं|' },
                { index: 'Q6', description: 'इस अभ्यास के लिए कोई अंकन प्रणाली नहीं है, यह सिर्फ आपके विषयों को पुनः अवलोकन / रिवीज़न करने के लिए है|' },
                { index: 'Q7', description: 'सभी उत्तरों का समाधान पाने के लिए आपको कम से कम 7 प्रश्नों के उत्तर देने होंगे और उसके बाद ही आप टेस्ट जमा कर पाएंगे।' },
                { index: 'Q8', description: 'वे प्रश्न जिनका आप उत्तर नहीं देंगे, उन्हें छोड़े गए के रूप में गिना जाएगा' },
            ],
        },
    },
    dailyPracticeTitle: {
        en: 'Daily Practice Problems',
        hi: 'रोजाना प्रैक्टिस के लिए सवाल',
    },
    dailyPracticeSubTitle: {
        en: '10 Questions Set',
        hi: '10 प्रश्नों का सेट',
    },
    refreshTest: {
        en: 'Get new test at 12am',
        hi: 'Get new test at 12am',
    },
    dailyPracticeCompleted: {
        en: 'Completed',
        hi: 'Completed',
    },
    dailyPractice: {
        background_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/4CEFF3C9-D33E-4560-FEDC-95920782DE62.webp',
        icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/ED3A47B7-83F8-E118-22BC-737602F7E4B4.webp',
    },
    aptitudeTestTitle: {
        en: 'Aptitude Test for Improving IQs',
        hi: 'IQ सुधारने के लिए एप्टीट्यूड टेस्ट',
    },
    aptitudeTestSubTitle: {
        en: '10 Questions Set',
        hi: '10 प्रश्नों का सेट',
    },
    aptitudeTest: {
        background_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/522CFD69-B95A-AB48-CD9A-C96081D0F827.webp',
        icon_url: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/CA5CFD61-8D8F-3E56-8242-111754EF7A95.webp',
    },
    fomulaDeck: {
        en: {
            title: 'Formulas',
            subtitle: 'Formula Deck',
        },
        hi: {
            title: 'फ़ॉर्मूला',
            subtitle: 'फ़ॉर्मूला डेक',
        },
    },
    shortTestTitle: {
        en: {
            title: 'Start Short Test Now',
            secondary_title: ' (10 Questions)',
        },
        hi: {
            title: 'शॉर्ट टेस्ट शुरू करें',
            secondary_title: ' (10 सवाल)',
        },
    },
    fullLengthTest: {
        en: 'Full Length Test for Exam Practice',
        hi: 'परीक्षा के आधार पर फुल लेंथ टेस्ट',
    },
    testId: {
        jeeMains11: [
            {
                test_id: 1128,
                title: 'Part Test 01',
            },
            {
                test_id: 1138,
                title: 'Part Test 02',
            },
            {
                test_id: 1148,
                title: 'Part Test 03',
            },
            {
                test_id: 1158,
                title: 'Part Test 04',
            },
            {
                test_id: 1160,
                title: 'PART TEST 05',
            },
            {
                test_id: 1162,
                title: 'PART TEST 06',
            },
            {
                test_id: 1164,
                title: 'PART TEST 07',
            },
            {
                test_id: 1166,
                title: 'FULL TEST 01',
            },
            {
                test_id: 1168,
                title: 'FULL TEST 02',
            },
            {
                test_id: 1170,
                title: 'FULL TEST 03',
            },
            {
                test_id: 1172,
                title: 'FULL TEST 04',
            },
            {
                test_id: 1174,
                title: 'FULL TEST 05',
            },
            {
                test_id: 1176,
                title: 'FULL TEST 06',
            },
            {
                test_id: 1298,
                title: 'FULL TEST 07',
            },
            {
                test_id: 1308,
                title: 'FULL TEST 08',
            },
            {
                test_id: 1318,
                title: 'FULL TEST 09',
            },
            {
                test_id: 1328,
                title: 'FULL TEST 10',
            },
            {
                test_id: 3098,
                title: 'PART TEST 01 (New Pattern)',
            },
            {
                test_id: 3108,
                title: 'PART TEST 02 (New Pattern)',
            },
            {
                test_id: 3118,
                title: 'PART TEST 03 (New Pattern)',
            },
            {
                test_id: 3128,
                title: 'PART TEST 04 (New Pattern)',
            },
            {
                test_id: 3138,
                title: 'CRASH COURSE (PART TEST 1)',
            },
            {
                test_id: 3148,
                title: 'CRASH COURSE (PART TEST 2)',
            },
            {
                test_id: 3158,
                title: 'CRASH COURSE (PART TEST 3)',
            },
            {
                test_id: 3168,
                title: 'CRASH COURSE (PART TEST 4)',
            },
            {
                test_id: 3178,
                title: 'CRASH COURSE (PART TEST 5)',
            },
            {
                test_id: 3188,
                title: 'CRASH COURSE (FULL TEST 1)',
            },
            {
                test_id: 3198,
                title: 'CRASH COURSE (FULL TEST 2)',
            },
            {
                test_id: 3208,
                title: 'CRASH COURSE (FULL TEST 3)',
            },
            {
                test_id: 3218,
                title: 'CRASH COURSE (FULL TEST 4)',
            },
            {
                test_id: 3228,
                title: 'CRASH COURSE (FULL TEST 5)',
            },
            {
                test_id: 3488,
                title: '9 JAN 2020 SHIFT 2',
            },
            {
                test_id: 3498,
                title: '7 JAN 2020 SHIFT 1',
            },
            {
                test_id: 3508,
                title: '8 JAN 2020 SHIFT 1',
            },
            {
                test_id: 3518,
                title: '9 JAN 2020 SHIFT 1',
            },
            {
                test_id: 3528,
                title: '7 JAN 2020 SHIFT 2',
            },
            {
                test_id: 3538,
                title: '8 JAN 2020 SHIFT 2',
            },
        ],
        jeeMains12: [
            {
                test_id: 1127,
                title: 'Part Test 01',
            },
            {
                test_id: 1137,
                title: 'Part Test 02',
            },
            {
                test_id: 1147,
                title: 'Part Test 03',
            },
            {
                test_id: 1157,
                title: 'Part Test 04',
            },
            {
                test_id: 1159,
                title: 'PART TEST 05',
            },
            {
                test_id: 1161,
                title: 'PART TEST 06',
            },
            {
                test_id: 1163,
                title: 'PART TEST 07',
            },
            {
                test_id: 1165,
                title: 'FULL TEST 01',
            },
            {
                test_id: 1167,
                title: 'FULL TEST 02',
            },
            {
                test_id: 1169,
                title: 'FULL TEST 03',
            },
            {
                test_id: 1171,
                title: 'FULL TEST 04',
            },
            {
                test_id: 1173,
                title: 'FULL TEST 05',
            },
            {
                test_id: 1175,
                title: 'FULL TEST 06',
            },
            {
                test_id: 1297,
                title: 'FULL TEST 07',
            },
            {
                test_id: 1307,
                title: 'FULL TEST 08',
            },
            {
                test_id: 1317,
                title: 'FULL TEST 09',
            },
            {
                test_id: 1327,
                title: 'FULL TEST 10',
            },
            {
                test_id: 3097,
                title: 'PART TEST 01 (New Pattern)',
            },
            {
                test_id: 3107,
                title: 'PART TEST 02 (New Pattern)',
            },
            {
                test_id: 3117,
                title: 'PART TEST 03 (New Pattern)',
            },
            {
                test_id: 3127,
                title: 'PART TEST 04 (New Pattern)',
            },
            {
                test_id: 3137,
                title: 'CRASH COURSE (PART TEST 1)',
            },
            {
                test_id: 3147,
                title: 'CRASH COURSE (PART TEST 2)',
            },
            {
                test_id: 3157,
                title: 'CRASH COURSE (PART TEST 3)',
            },
            {
                test_id: 3167,
                title: 'CRASH COURSE (PART TEST 4)',
            },
            {
                test_id: 3177,
                title: 'CRASH COURSE (PART TEST 5)',
            },
            {
                test_id: 3187,
                title: 'CRASH COURSE (FULL TEST 1)',
            },
            {
                test_id: 3197,
                title: 'CRASH COURSE (FULL TEST 2)',
            },
            {
                test_id: 3207,
                title: 'CRASH COURSE (FULL TEST 3)',
            },
            {
                test_id: 3217,
                title: 'CRASH COURSE (FULL TEST 4)',
            },
            {
                test_id: 3227,
                title: 'CRASH COURSE (FULL TEST 5)',
            },
            {
                test_id: 3487,
                title: '9 JAN 2020 SHIFT 2',
            },
            {
                test_id: 3497,
                title: '7 JAN 2020 SHIFT 1',
            },
            {
                test_id: 3507,
                title: '8 JAN 2020 SHIFT 1',
            },
            {
                test_id: 3517,
                title: '9 JAN 2020 SHIFT 1',
            },
            {
                test_id: 3527,
                title: '7 JAN 2020 SHIFT 2',
            },
            {
                test_id: 3537,
                title: '8 JAN 2020 SHIFT 2',
            },
        ],
        jeeAdvance12: [
            {
                test_id: 1477,
                title: 'PART TEST-1 (PHYSICS)',
            },
            {
                test_id: 1487,
                title: 'PART TEST-2 (CHEMISTRY)',
            },
            {
                test_id: 1497,
                title: 'PART TEST-3 (MATHS)',
            },
            {
                test_id: 1507,
                title: 'PART TEST-4 (PHYSICS)',
            },
            {
                test_id: 1517,
                title: 'PART TEST-5 (CHEMISTRY)',
            },
            {
                test_id: 1527,
                title: 'PART TEST-6 ( MATHS)',
            },
            {
                test_id: 1537,
                title: 'PART TEST-7 ( PHYSICS)',
            },
            {
                test_id: 1547,
                title: 'PART TEST-8 ( CHEMISTRY)',
            },
            {
                test_id: 1557,
                title: 'PART TEST-9 (MATHS)',
            },
            {
                test_id: 1567,
                title: 'PART TEST-10 (PHYSICS)',
            },
            {
                test_id: 1577,
                title: 'PART TEST-11 (CHEMISTRY)',
            },
            {
                test_id: 1587,
                title: 'PART TEST-12 (MATHS)',
            },
            {
                test_id: 1597,
                title: 'PART TEST-13 (PHYSICS)',
            },
            {
                test_id: 1607,
                title: 'PART TEST-14 (CHEMISTRY)',
            },
            {
                test_id: 1617,
                title: 'PART TEST-15 (MATHS)',
            },
            {
                test_id: 1627,
                title: 'PART TEST-16 (PHYSICS)',
            },
            {
                test_id: 1647,
                title: 'PART TEST-17 (CHEMISTRY)',
            },
            {
                test_id: 1657,
                title: 'PART TEST-18 (MATHS)',
            },
            {
                test_id: 1667,
                title: 'PART TEST-19 (PHYSICS)',
            },
            {
                test_id: 1677,
                title: 'PART TEST-20 (MATHS)',
            },
            {
                test_id: 1687,
                title: 'PART TEST-21 (CHEMISTRY)',
            },
            {
                test_id: 1697,
                title: 'PART TEST-22 (PHYSICS)',
            },
            {
                test_id: 1707,
                title: 'PART TEST-23 (MATHS)',
            },
            {
                test_id: 1717,
                title: 'PART TEST-24 (MATHS)',
            },
            {
                test_id: 1727,
                title: 'PART TEST-25 (PHYSICS)',
            },
        ],
        jeeAdvance11: [
            {
                test_id: 1478,
                title: 'PART TEST-1 (PHYSICS)',
            },
            {
                test_id: 1488,
                title: 'PART TEST-2 (CHEMISTRY)',
            },
            {
                test_id: 1498,
                title: 'PART TEST-3 (MATHS)',
            },
            {
                test_id: 1508,
                title: 'PART TEST-4 (PHYSICS)',
            },
            {
                test_id: 1518,
                title: 'PART TEST-5 (CHEMISTRY)',
            },
            {
                test_id: 1528,
                title: 'PART TEST-6 ( MATHS)',
            },
            {
                test_id: 1538,
                title: 'PART TEST-7 ( PHYSICS)',
            },
            {
                test_id: 1548,
                title: 'PART TEST-8 ( CHEMISTRY)',
            },
            {
                test_id: 1558,
                title: 'PART TEST-9 (MATHS)',
            },
            {
                test_id: 1568,
                title: 'PART TEST-10 (PHYSICS)',
            },
            {
                test_id: 1578,
                title: 'PART TEST-11 (CHEMISTRY)',
            },
            {
                test_id: 1588,
                title: 'PART TEST-12 (MATHS)',
            },
            {
                test_id: 1598,
                title: 'PART TEST-13 (PHYSICS)',
            },
            {
                test_id: 1608,
                title: 'PART TEST-14 (CHEMISTRY)',
            },
            {
                test_id: 1618,
                title: 'PART TEST-15 (MATHS)',
            },
            {
                test_id: 1628,
                title: 'PART TEST-16 (PHYSICS)',
            },
            {
                test_id: 1648,
                title: 'PART TEST-17 (CHEMISTRY)',
            },
            {
                test_id: 1658,
                title: 'PART TEST-18 (MATHS)',
            },
            {
                test_id: 1668,
                title: 'PART TEST-19 (PHYSICS)',
            },
            {
                test_id: 1678,
                title: 'PART TEST-20 (MATHS)',
            },
            {
                test_id: 1688,
                title: 'PART TEST-21 (CHEMISTRY)',
            },
            {
                test_id: 1698,
                title: 'PART TEST-22 (PHYSICS)',
            },
            {
                test_id: 1708,
                title: 'PART TEST-23 (MATHS)',
            },
            {
                test_id: 1718,
                title: 'PART TEST-24 (MATHS)',
            },
            {
                test_id: 1728,
                title: 'PART TEST-25 (PHYSICS)',
            },
        ],
        neet11: [
            {
                test_id: 3238,
                title: 'ALLEEN MAJOR TEST 1 | NEET TEST SERIES',
            },
            {
                test_id: 3248,
                title: 'ALLEEN MAJOR TEST 2 | NEET TEST SERIES',
            },
            {
                test_id: 3258,
                title: 'ALLEEN MAJOR TEST 3 | NEET TEST SERIES',
            },
            {
                test_id: 3268,
                title: 'ALLEEN MAJOR TEST 4 | NEET TEST SERIES',
            },
            {
                test_id: 3278,
                title: 'ALLEEN MAJOR TEST 5 | NEET TEST SERIES',
            },
            {
                test_id: 3288,
                title: 'ALLEEN MAJOR TEST 6 | NEET TEST SERIES',
            },
            {
                test_id: 3298,
                title: 'ALLEEN MAJOR TEST 7 | NEET TEST SERIES',
            },
            {
                test_id: 3648,
                title: 'MOCK TEST 1 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3658,
                title: 'MOCK TEST 2 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3668,
                title: 'MOCK TEST 3 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3678,
                title: 'MOCK TEST 5 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3688,
                title: 'MOCK TEST 8 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3698,
                title: 'MOCK TEST 9 | NTA NEET MOCK TEST',
            },
            {
                test_id: 5787,
                title: 'TEST 3 | NEET 2022 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5797,
                title: 'TEST 3 | NEET 2022 LIVE CLASS',
            },
            {
                test_id: 6057,
                title: 'TEST 7 | NEET 2022 | लाइव क्लास | हिंदी माध्यम',
            },
            {
                test_id: 6067,
                title: 'TEST 7 | NEET 2022 | Live Class',
            },
            {
                test_id: 9567,
                title: 'TEST 11 | NEET 2022 | लाइव क्लास | हिंदी माध्यम',
            },
            {
                test_id: 9577,
                title: 'TEST 11 | NEET 2022 | Live Class',
            },
            {
                test_id: 11727,
                title: 'TEST 15 | NEET 2022 | लाइव क्लास | हिंदी माध्यम',
            },
            {
                test_id: 11737,
                title: 'TEST 15 | NEET 2022 | Live Class',
            },
            {
                test_id: 13897,
                title: 'TEST 19 | NEET 2022 | लाइव क्लास | हिंदी माध्यम',
            },
            {
                test_id: 13907,
                title: 'TEST 19 | NEET 2022 | Live Class',
            },
            {
                test_id: 100347,
                title: 'TEST 23 | NEET 2022 | Live Class',
            },
            {
                test_id: 100348,
                title: 'TEST 23 | NEET 2022 | लाइव क्लास | हिंदी माध्यम',
            },
            {
                test_id: 100349,
                title: 'TEST 4 | NEET 2023 Classes | English Medium',
            },
            {
                test_id: 100350,
                title: 'TEST 4 | NEET 2023 Classes | हिंदी माध्यम',
            },
            {
                test_id: 100361,
                title: 'TEST 1 | DN-AITS NEET 2023 | English Medium',
            },
            {
                test_id: 100362,
                title: 'TEST 1 | DN-AITS NEET 2023 | हिंदी माध्यम',
            },
            {
                test_id: 100597,
                title: 'TEST 5 | NEET 2023 Classes | English Medium',
            },
            {
                test_id: 100598,
                title: 'TEST 5 | NEET 2023 Classes | हिंदी माध्यम',
            },
            {
                test_id: 100613,
                title: 'TEST 2 | DN-AITS NEET 2023 | English Medium',
            },
            {
                test_id: 100614,
                title: 'TEST 2 | DN-AITS NEET 2023 | हिंदी माध्यम',
            },
            {
                test_id: 100945,
                title: 'TEST 27 | NEET 2022 | Live Class',
            },
            {
                test_id: 100946,
                title: 'TEST 27 | NEET 2022 | लाइव क्लास | हिंदी माध्यम',
            },
            {
                test_id: 100947,
                title: 'TEST 7 | NEET 2023 Classes | English Medium',
            },
            {
                test_id: 100948,
                title: 'TEST 7 | NEET 2023 Classes | हिंदी माध्यम',
            },
            {
                test_id: 100965,
                title: 'TEST 3 | DN-AITS NEET 2023 | English Medium',
            },
            {
                test_id: 100966,
                title: 'TEST 3 | DN-AITS NEET 2023 | हिंदी माध्यम',
            },
            {
                test_id: 101201,
                title: 'TEST 9 | NEET 2023 Classes | English Medium',
            },
            {
                test_id: 101202,
                title: 'TEST 9 | NEET 2023 Classes | हिंदी माध्यम',
            },
            {
                test_id: 101217,
                title: 'TEST 4 | DN-AITS NEET 2023 | English Medium',
            },
            {
                test_id: 101218,
                title: 'TEST 4 | DN-AITS NEET 2023 | हिंदी माध्यम',
            },
        ],
        neet12: [
            {
                test_id: 3237,
                title: 'ALLEEN MAJOR TEST 1 | NEET TEST SERIES',
            },
            {
                test_id: 3247,
                title: 'ALLEEN MAJOR TEST 2 | NEET TEST SERIES',
            },
            {
                test_id: 3257,
                title: 'ALLEEN MAJOR TEST 3 | NEET TEST SERIES',
            },
            {
                test_id: 3267,
                title: 'ALLEEN MAJOR TEST 4 | NEET TEST SERIES',
            },
            {
                test_id: 3277,
                title: 'ALLEEN MAJOR TEST 5 | NEET TEST SERIES',
            },
            {
                test_id: 3287,
                title: 'ALLEEN MAJOR TEST 6 | NEET TEST SERIES',
            },
            {
                test_id: 3297,
                title: 'ALLEEN MAJOR TEST 7 | NEET TEST SERIES',
            },
            {
                test_id: 3647,
                title: 'MOCK TEST 1 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3657,
                title: 'MOCK TEST 2 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3667,
                title: 'MOCK TEST 3 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3677,
                title: 'MOCK TEST 5 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3687,
                title: 'MOCK TEST 8 | NTA NEET MOCK TEST',
            },
            {
                test_id: 3697,
                title: 'MOCK TEST 9 | NTA NEET MOCK TEST',
            },
            {
                test_id: 5588,
                title: 'TEST 1 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5638,
                title: 'TEST 2 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5648,
                title: 'TEST 1 | NEET 2021 CRASH COURSE',
            },
            {
                test_id: 5708,
                title: 'TEST 3 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5718,
                title: 'TEST 2 | NEET 2021 CRASH COURSE',
            },
            {
                test_id: 5778,
                title: 'TEST 4 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5788,
                title: 'TEST 3 | NEET 2021 CRASH COURSE',
            },
            {
                test_id: 5848,
                title: 'TEST 5 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5858,
                title: 'TEST 4 | NEET 2021 CRASH COURSE',
            },
            {
                test_id: 5918,
                title: 'TEST 6 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5928,
                title: 'TEST 5 | NEET 2021 CRASH COURSE',
            },
            {
                test_id: 5988,
                title: 'TEST 7 | NEET 2021 LIVE CLASS (हिंदी माध्यम)',
            },
            {
                test_id: 5998,
                title: 'TEST 6 | NEET 2021 CRASH COURSE',
            },
            {
                test_id: 6048,
                title: 'TEST 8 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 6058,
                title: 'TEST 7 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 6398,
                title: 'TEST 9 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 6408,
                title: 'TEST 8 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 6918,
                title: 'TEST 10 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 6928,
                title: 'TEST 9 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 9018,
                title: 'TEST 11 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 9028,
                title: 'TEST 10 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 9558,
                title: 'TEST 12 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 9568,
                title: 'TEST 11 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 10098,
                title: 'TEST 13 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 10108,
                title: 'TEST 12 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 10638,
                title: 'TEST 14 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 10648,
                title: 'TEST 13 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 11178,
                title: 'TEST 15 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 11188,
                title: 'TEST 14 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 11718,
                title: 'TEST 16 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 11728,
                title: 'TEST 15 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 12258,
                title: 'TEST 17 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 12268,
                title: 'TEST 16 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 12798,
                title: 'TEST 18 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 12808,
                title: 'TEST 17 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 13348,
                title: 'TEST 19 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 13358,
                title: 'TEST 18 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 13888,
                title: 'TEST 20 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 13898,
                title: 'TEST 19 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 14408,
                title: 'TEST 21 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 14418,
                title: 'TEST 20 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100115,
                title: 'TEST 21 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100116,
                title: 'TEST 22 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100233,
                title: 'TEST 22 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100234,
                title: 'TEST 23 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100351,
                title: 'TEST 23 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100352,
                title: 'TEST 24 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100353,
                title: 'TEST 4 | NEET 2022 Classes | English Medium',
            },
            {
                test_id: 100354,
                title: 'TEST 4 | NEET 2022 Classes | हिंदी माध्यम',
            },
            {
                test_id: 100359,
                title: 'TEST 1 | DN-AITS NEET 2022 | English Medium',
            },
            {
                test_id: 100360,
                title: 'TEST 1 | DN-AITS NEET 2022 | हिंदी माध्यम',
            },
            {
                test_id: 100477,
                title: 'TEST 24 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100478,
                title: 'TEST 25 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100599,
                title: 'TEST 25 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100600,
                title: 'TEST 26 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100601,
                title: 'TEST 5 | NEET 2022 Classes | English Medium',
            },
            {
                test_id: 100602,
                title: 'TEST 5 | NEET 2022 Classes | हिंदी माध्यम',
            },
            {
                test_id: 100611,
                title: 'TEST 2 | DN-AITS NEET 2022 | English Medium',
            },
            {
                test_id: 100612,
                title: 'TEST 2 | DN-AITS NEET 2022 | हिंदी माध्यम',
            },
            {
                test_id: 100827,
                title: 'TEST 26 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100828,
                title: 'TEST 27 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100949,
                title: 'TEST 27 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 100950,
                title: 'TEST 28 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 100952,
                title: 'TEST 7 | NEET 2022 Classes | हिंदी माध्यम',
            },
            {
                test_id: 100958,
                title: 'TEST 7 | NEET 2022 Classes | English Medium',
            },
            {
                test_id: 100963,
                title: 'TEST 3 | DN-AITS NEET 2022 | English Medium',
            },
            {
                test_id: 100964,
                title: 'TEST 3 | DN-AITS NEET 2022 | हिंदी माध्यम',
            },
            {
                test_id: 101081,
                title: 'TEST 28 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 101082,
                title: 'TEST 29 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 101203,
                title: 'TEST 29 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 101204,
                title: 'TEST 30 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 101205,
                title: 'TEST 9 | NEET 2022 Classes | English Medium',
            },
            {
                test_id: 101206,
                title: 'TEST 9 | NEET 2022 Classes | हिंदी माध्यम',
            },
            {
                test_id: 101215,
                title: 'TEST 4 | DN-AITS NEET 2022 | English Medium',
            },
            {
                test_id: 101216,
                title: 'TEST 4 | DN-AITS NEET 2022 | हिंदी माध्यम',
            },
            {
                test_id: 101221,
                title: 'TEST 30 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 101222,
                title: 'TEST 31 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 101337,
                title: 'TEST 31 | NEET 2021 | Crash Course | English Medium',
            },
            {
                test_id: 101338,
                title: 'TEST 32 | NEET 2021 | क्रैश कोर्स | हिंदी माध्यम',
            },
            {
                test_id: 200018,
                title: 'FULL TEST 1 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200019,
                title: 'FULL TEST 2 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200020,
                title: 'FULL TEST 3 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200021,
                title: 'FULL TEST 4 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200022,
                title: 'FULL TEST 5 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200023,
                title: 'FULL TEST 6 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200024,
                title: 'FULL TEST 7 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200025,
                title: 'FULL TEST 8 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200026,
                title: 'FULL TEST 9 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200027,
                title: 'FULL TEST 10 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200028,
                title: 'FULL TEST 11 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200029,
                title: 'FULL TEST 12 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200030,
                title: 'FULL TEST 13 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200031,
                title: 'FULL TEST 14 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200032,
                title: 'FULL TEST 15 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200033,
                title: 'FULL TEST 16 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200034,
                title: 'FULL TEST 17 | DN AITS NEET 2021 | हिंदी माध्यम',
            },
            {
                test_id: 200035,
                title: 'FULL TEST 1 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200036,
                title: 'FULL TEST 2 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200037,
                title: 'FULL TEST 3 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200038,
                title: 'FULL TEST 4 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200039,
                title: 'FULL TEST 5 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200040,
                title: 'FULL TEST 6 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200041,
                title: 'FULL TEST 7 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200042,
                title: 'FULL TEST 8 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200043,
                title: 'FULL TEST 9 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200044,
                title: 'FULL TEST 10 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200045,
                title: 'FULL TEST 11 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200046,
                title: 'FULL TEST 12 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200047,
                title: 'FULL TEST 13 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200048,
                title: 'FULL TEST 14 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200049,
                title: 'FULL TEST 15 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200050,
                title: 'FULL TEST 16 | DN AITS NEET 2021 | English Medium',
            },
            {
                test_id: 200051,
                title: 'FULL TEST 17 | DN AITS NEET 2021 | English Medium',
            },
        ],
        nda: [
            {
                test_id: 100481,
                title: 'NDA Exam I 2021 | Test 1 | English Medium',
            },
            {
                test_id: 100482,
                title: 'NDA Exam I 2021 | Test 1 | Hindi Medium',
            },
            {
                test_id: 100603,
                title: 'NDA Exam I 2021 | Test 2 | English Medium',
            },
            {
                test_id: 100604,
                title: 'NDA Exam I 2021 | Test 2 | Hindi Medium',
            },
            {
                test_id: 100831,
                title: 'NDA Exam I 2021 | Test 3 | English Medium',
            },
            {
                test_id: 100832,
                title: 'NDA Exam I 2021 | Test 3 | Hindi Medium',
            },
            {
                test_id: 100953,
                title: 'NDA Exam I 2021 | Test 4 | English Medium',
            },
            {
                test_id: 100954,
                title: 'NDA Exam I 2021 | Test 4 | Hindi Medium',
            },
            {
                test_id: 101085,
                title: 'NDA Exam I 2021 | Test 5 | English Medium',
            },
            {
                test_id: 101086,
                title: 'NDA Exam I 2021 | Test 5 | Hindi Medium',
            },
            {
                test_id: 101207,
                title: 'NDA Exam I 2021 | Test 6 | English Medium',
            },
            {
                test_id: 101208,
                title: 'NDA Exam I 2021 | Test 6 | Hindi Medium',
            },
            {
                test_id: 101341,
                title: 'NDA Exam I 2021 | Test 7 | English Medium',
            },
            {
                test_id: 101342,
                title: 'NDA Exam I 2021 | Test 7 | Hindi Medium',
            },
        ],
    },
    topQuestionsTitle: {
        en: 'Top 100 questions of today',
        hi: 'आज के टॉप 100 प्रश्न',
    },
    exams: [
        { exam_title: 'JEE Mains', alias: 'jeeMains', icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/FC548EED-6BC2-F748-C55C-BC5F9A878E8A.webp' },
        { exam_title: 'JEE Advance', alias: 'jeeAdvance', icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/7191945B-F648-077A-CF17-A70A15FB52F4.webp' },
        { exam_title: 'NEET', alias: 'neet', icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/7123A15D-A3F7-7718-0EBE-18A806944933.webp' },
        { exam_title: 'NDA', alias: 'nda', icon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/343932A9-5E32-4123-742C-3F2CFB0BE3A3.webp' },
    ],
    testSeries: {
        en: 'Test Series',
        hi: 'टेस्ट सीरीज',
    },
    subjects: {
        en: [{
            title: 'Maths', subject_alias: 'maths', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/math.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=maths',
        },
        {
            title: 'Chemistry', subject_alias: 'chemistry', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/chemistry.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=chemistry',
        },
        {
            title: 'Physics', subject_alias: 'physics', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/physics.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=physics',
        },
        {
            title: 'Biology', subject_alias: 'biology', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/biology.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=biology',
        }],
        hi: [{
            title: 'गणित', subject_alias: 'maths', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/math.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=maths',
        },
        {
            title: 'रसायन विज्ञान', subject_alias: 'chemistry', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/chemistry.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=chemistry',
        },
        {
            title: 'भौतिक विज्ञान', subject_alias: 'physics', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/physics.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=physics',
        },
        {
            title: 'जीवविज्ञान', subject_alias: 'biology', icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/icons/biology.webp', deeplink: 'doubtnutapp://revision_corner/chapter?subject=biology',
        }],
    },
    quizPerformance: {
        title: {
            en: 'Quiz Performance History',
            hi: 'क्विज में आपके अब तक के प्रदर्शन का विवरण',
            hien: 'Quiz mein aapke ab tak ke performance ki history',
        },
        subtitle: {
            en: 'Recent Game History',
            hi: 'आपके द्वारा खेले गए पिछले गेम का विवरण',
            hien: 'Recent Game History',
        },
    },
    performanceReportTitle: {
        en: 'Your Performance Report',
        hi: 'आपकी परफॉरमेंस रिपोर्ट',
    },
    performanceReportDailyPractice: {
        en: {
            sheetSolved: 'Total sheets solved',
            accuracy: 'Average Accuracy',
        },
        hi: {
            sheetSolved: 'कुल हल की गई शीट',
            accuracy: 'औसतन सटीकता',
        },
    },
    accuracy: {
        en: 'Accuracy',
        hi: 'सटीकता',
    },
    marks: {
        en: 'Marks',
        hi: 'अंक',
    },
    performanceReportShortTest: {
        en: {
            title: 'Short test performance overview',
            avgScore: 'Average marks',
            highestScore: 'Highest marks',
        },
        hi: {
            title: 'शॉर्ट टेस्ट',
            avgScore: 'एवरेज अंक',
            highestScore: 'उच्चतम अंक',
        },
    },
    performanceReportFullLength: {
        en: {
            title: 'Full Length Tests',
            totalTests: 'Total Test Practiced',
        },
        hi: {
            title: 'फुल लेंथ टेस्ट',
            totalTests: 'कुल प्रैक्टिस टेस्ट',
        },
    },
    fullLengthExamNameMapping: {
        en: {
            jeeMains11: {
                title: 'JEE Mains',
                subtitle: 'Full Length Test - JEE Mains',
                avgScore: 'Average Score JEE MAINS',
                color: '#017aff',
            },
            jeeMains12: {
                title: 'JEE Mains',
                subtitle: 'Full Length Test - JEE Mains',
                avgScore: 'Average Score JEE MAINS',
                color: '#017aff',
            },
            jeeAdvance11: {
                title: 'JEE Advance',
                subtitle: 'Full Length Test - JEE Advance',
                avgScore: 'Average Score ADVANCE',
                color: '#017aff',
            },
            jeeAdvance12: {
                title: 'JEE Advance',
                subtitle: 'Full Length Test - JEE Advance',
                avgScore: 'Average Score ADVANCE',
                color: '#017aff',
            },
            nda: {
                title: 'NDA',
                subtitle: 'Full Length Test - NDA',
                avgScore: 'Average Score NDA',
                color: '#00e099',
            },
            neet11: {
                title: 'NEET',
                subtitle: 'Full Length Test - NEET',
                avgScore: 'Average Score NEET',
                color: '#00e099',
            },
            neet12: {
                title: 'NEET',
                subtitle: 'Full Length Test - NEET',
                avgScore: 'Average Score NEET',
                color: '#00e099',
            },
        },
        hi: {
            jeeMains11: {
                title: 'JEE Mains',
                avgScore: 'एवरेज अंक JEE MAINS',
                subtitle: 'Full Length Test - JEE Mains',
                color: '#017aff',
            },
            jeeMains12: {
                title: 'JEE Mains',
                avgScore: 'एवरेज अंक JEE MAINS',
                subtitle: 'Full Length Test - JEE Mains',
                color: '#017aff',
            },
            jeeAdvance11: {
                title: 'JEE Advance',
                avgScore: 'एवरेज अंक ADVANCE',
                subtitle: 'Full Length Test - JEE Advance',
                color: '#017aff',
            },
            jeeAdvance12: {
                title: 'JEE Advance',
                avgScore: 'एवरेज अंक ADVANCE',
                subtitle: 'Full Length Test - JEE Advance',
                color: '#017aff',
            },
            nda: {
                title: 'NDA',
                avgScore: 'एवरेज अंक NDA',
                subtitle: 'Full Length Test - NDA',
                color: '#00e099',
            },
            neet11: {
                title: 'NEET',
                avgScore: 'एवरेज अंक NEET',
                color: '#00e099',
                subtitle: 'Full Length Test - NEET',
            },
            neet12: {
                title: 'NEET',
                avgScore: 'एवरेज अंक NEET',
                color: '#00e099',
                subtitle: 'Full Length Test - NEET',
            },
        },
    },
    performanceReportIcon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/14A652A5-6B07-4A75-9557-ED9B220B2AE4.webp',
    infoIcon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/211BFBB2-2D50-EA0D-3EEB-72109B982CE8.webp',
    levelTitle: {
        en: 'Level',
        hien: 'Level',
        hi: 'स्तर',
    },
    tabTitleMapping: {
        en: {
            MATHS: {
                title: 'Maths', chapter_alias: 'maths', id: 4, is_active: false,
            },
            PHYSICS: {
                title: 'Physics', chapter_alias: 'physics', id: 3, is_active: false,
            },
            CHEMISTRY: {
                title: 'Chemistry', chapter_alias: 'chemistry', id: 2, is_active: false,
            },
            BIOLOGY: {
                title: 'Biology', chapter_alias: 'biology', id: 1, is_active: false,
            },
        },
        hi: {
            MATHS: {
                title: 'गणित', chapter_alias: 'maths', id: 4, is_active: false,
            },
            PHYSICS: {
                title: 'भौतिक विज्ञान', chapter_alias: 'physics', id: 3, is_active: false,
            },
            CHEMISTRY: {
                title: 'रसायन विज्ञान', chapter_alias: 'chemistry', id: 2, is_active: false,
            },
            BIOLOGY: {
                title: 'जीवविज्ञान', chapter_alias: 'biology', id: 1, is_active: false,
            },
        },
    },
    defaultTab: [{
        title: '',
        id: -1,
        is_active: false,
    }],
    tabSubjectMapping: {
        1: 'BIOLOGY',
        2: 'CHEMISTRY',
        3: 'PHYSICS',
        4: 'MATHS',
    },
    widgetIdTopicMapping: {
        1: {
            en: 'Daily Practice Problems',
            hi: 'रोजाना प्रैक्टिस के लिए सवाल',
        },
        2: {
            en: 'Topic Based Short Test',
            hi: 'विषय आधारित शॉर्ट टेस्ट',
        },
        3: {
            en: 'Full length test',
            hi: 'फुल लेंथ टेस्ट',
        },
        4: {
            en: 'Aptitude Test',
            hi: 'एप्टीट्यूड टेस्ट',
        },
    },
    viewAllPracticeSolutions: {
        en: 'View All Previous Practice Solutions',
        hi: 'पिछले सभी टेस्ट और समाधान देखें',
    },
    viewShortTestSolutions: {
        en: 'View All Previous Test and Solutions',
        hi: 'पिछले सभी टेस्ट और समाधान देखें',
    },
    noStats: {
        en: {
            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp',
            title: 'No tests taken',
            description: 'You will see your performance report for all  the tests taken and submitted by you',
            cta_text: 'Take your first test',
            deeplink: '',
        },
        hi: {
            image: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/B4A0AD62-F496-1B81-19BD-903B04C4CAB5.webp',
            title: 'कोई टेस्ट नहीं लिया गया',
            description: 'यहां आप अपनी परफॉरमेंस रिपोर्ट देखेंगे आपके द्वारा लिए गए और सबमिट किए गए सभी टेस्ट के लिए',
            cta_text: 'अपना पहला टेस्ट लें',
            deeplink: '',
        },
    },
    submitTestTitle: {
        en: 'Submit',
        hi: 'सबमिट करें',
    },
    result: {
        solutionsPlaylistId: '453978',
        en: {
            correct: 'Correct',
            incorrect: 'Incorrect',
            skipped: 'Skipped',
        },
        hi: {
            correct: 'सही',
            incorrect: 'गलत',
            skipped: 'छोड़ दिए',
        },
    },
    idOptionsMapping: {
        1: 'A',
        2: 'B',
        3: 'C',
        4: 'D',
    },
    solutionButton: {
        en: {
            watchTitle: 'Watch Solutions',
            viewTitle: 'View Solutions',
        },
        hi: {
            title: 'समाधान देखें',
        },
    },
    viewall: {
        en: 'view all',
        hi: 'सभी देखें',
    },
    category: {
        jeeMains: 'JEE MAIN',
        jeeAdvance: 'JEE ADVANCED',
        neet: 'NEET',
        nda: 'NDA',
    },
    stateBoard: {
        jeeMains: 'JEE MAINS PREVIOUS YEAR PAPER',
        jeeAdvance: 'JEE ADVANCED PREVIOUS YEAR PAPER',
        neet: 'NEET PREVIOUS YEAR PAPER',
        nda: 'NDA I PREVIOUS YEAR PAPER',

    },
    progresReportIcon: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/14A652A5-6B07-4A75-9557-ED9B220B2AE4.webp',
};
module.exports = data;
