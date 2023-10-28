const _ = require('lodash');

const staticData = require('./data');

module.exports = {
    ContextType: {
        ASK: 1,
        RANDOM: 2,
        SALUTATION: 3,
        CAMPAIGN: 4,
        FACTS: 5,
        ASK_TEXT: 6,
    },
    TEXT_QUESTION_MIN_LENGTH: 50,
    optin: {
        event: 'optin',
        msg: 'optin_msg',
    },
    searchingForSoln: {
        event: 'searching-for-solution',
        msg: 'Good question 😇 🤖 \n\nSearching solution...in 10 secs.. 🔍',
    },
    askFailure: {
        event: 'ask-failure',
        msg: [
            'Oh no! 😔\n\nLagta hai system mai kuch problem hai.',
            'I am fixing it. Pls kuch der mai try karein! 🙂',
        ],
    },
    unhandledMessageType: {
        event: 'unhandled-message-type',
        msg: staticData.unhandledMessageReply,
    },
    multiMessage: {
        event: 'multi-message',
        msg: async (params) => ({
            mediaId: params.mediaId,
            caption: 'Please wait! Mai aapke iss 👆 question ka solution search karr raha hun! 🧐 \n\nMujhe ek baar me ek hi question bheje. Thanks 🤖',
        }),
    },
    solution: {
        event: 'solution',
        msg: async (params) => (params.solnType === 'video' ? `*Play* *Video* *Solution* ⏯ : 👉 ${params.url}` : `*Open* *text* *solution* 🗒 : 👉${params.url}`),
        preview: true,
    },
    solnFeedback: {
        event: 'solution-feedback',
        msg: 'Kya aapko solution mila? 🤖\n*Yes* OR *No* message karein.',
        delay: 20000,
        retries: [{
            event: 'solution-feedback',
            msg: 'Sirf Yes OR No message karein 😊 \n\nYa phir ek aur question pooche. 🤖 📚 ',
        }],
    },
    solnNotView: {
        event: 'solution-not-view',
        delay: 300000,
        msg: async (params) => {
            if (!params.context || (params.dailyCountData[module.exports.ContextType.ASK] && params.dailyCountData[module.exports.ContextType.ASK] > 1)) {
                return null;
            }
            const resp = await params.condition(params.db.redis.read, params.studentId);
            if (!resp || parseInt(resp) !== params.context.questionId) {
                return {
                    mediaId: '6fbe9b0c-03d9-4bad-a591-eb700a109cde',
                    caption: 'Kya aapne sawaal poochne ke baad video dekhi? 🤖☝',
                };
            }
        },
    },
    solnFeedbackYesNo: {
        yes: [{
            event: 'solution-feedback-yes',
            msg: 'Great! 😊 Pls mere baare mai apne dosto ko bataye. \n\nEk aur question pooche. 📚',
        }, {
            event: 'solution-feedback-yes',
            msg: [
                'Great! 😇 \nAsk one more question 🤖',
                'Kya aapko mere solutions helpful lage? 😇  \n\nPls apne friends ko mere baare mai batao. Forward this message 🙂',
                '*600-300-8001* par message karo aur apne saare mushkil se mushkil doubts solve karo! \n\n✅ 10 secs mei solution! 🏆 💯 \n\n✅ IITJEE, CBSE & Boards \n\n❌ No Groups  ❌ No Spam\n\n*Maths*, *Physics*, *Chemistry* & *Biology* doubt? 🤔 *600-300-8001* pe WhatsApp karo!\n\nYa phir, is link par click karo aur doubt poocho 👉 - https://doubtnut.app/whatsapp_nt',
            ],
        }, {
            event: 'solution-feedback-yes',
            msg: [
                'Great! 😇 \nAsk one more question 🤖',
            ],
        }, {
            event: 'solution-feedback-yes',
            msg: 'Great! 😇 \nAsk one more question 🤖',
        }],
        no: [{
            event: 'solution-feedback-no',
            msg: async (params) => `Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe feedback dein.  🙇‍♂   \nI will improve 😊 \n\nfeedback link 👉 -  https://doubtnut.com/whatsapp-rating?qid=${params.questionId}&sid=${params.studentId}`,
        }, {
            event: 'solution-feedback-no',
            msg: [
                'Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe ek aur chance dein.\nI will learn 😊 \n\nMujhse ek aur question puche.',
                'Explore more on the app. \nDownload now : 👉 https://doubtnut.app.link/RD1Swe7UsZ',
            ],
        }, {
            event: 'solution-feedback-no',
            msg: [
                'Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe ek aur chance dein.\nI will learn 😊 \n\nMujhse ek aur question puche.',
                'Explore more on the app. \nDownload now : 👉 https://doubtnut.app.link/RD1Swe7UsZ',
            ],
        }, {
            event: 'solution-feedback-no',
            msg: [
                'Oops! Sorry. I am a learning Robot 🤖 \n\nPls mujhe ek aur chance dein.\nI will learn 😊 \n\nMujhse ek aur question puche.',
                'Explore more on the app. \nDownload now : 👉 https://doubtnut.app.link/RD1Swe7UsZ',
            ],
        }],
    },
    salutation: staticData.salutations.map((x) => ({
        [x]: [
            ..._.times(5, () => ({
                event: 'salutation',
                msg: [
                    `${_.startCase(x)}! I am a Robot. 🤖\n\nAap mujhse *Maths*, *Physics*, *Chemistry* & *Biology* ke questions pooch sakte hai.`,
                    'How? 🤔 \n\nStep 1⃣ - Question ki 📸 photo kheeche \n\nStep 2⃣ - Sirf one question crop karke send karein',
                    'Bas 2 steps!\n\nTake photo now 📷  🙂',
                ],
            })),
            ..._.times(5, () => ({
                event: 'salutation',
                msg: [
                    'Oops, yeh to *Maths*, *Physics*, *Chemistry* & *Biology* questions nahi hain! 🤔 🤖\nMai sirf *PCM* doubts solve karr sakta hun. 🤓\n\nAap new cheezein explore karne ke liye meri app try kijiye! 🙂\nDownload Link :👉 https://doubtnut.app.link/RD1Swe7UsZ',
                ],
            })), {
                event: 'salutation',
                msg: 'Lagta hai aap confused hain. 😛\nAb mai sirf *Maths*, *Physics*, *Chemistry* & *Biology* doubts parr response dunga. 🤖\n\nBook se question ki photo kheeche aur mujhe bheje. Aapko instant solutions mil jaayega. 🔎📚',
            },
        ],
    })).reduce((total, curr) => ({ ...total, ...curr }), {}),
    randomMessageReply: [
        ..._.times(8, () => ({
            event: 'random',
            msg: staticData.unhandledMessageReply,
        })),
        ..._.times(5, () => ({
            event: 'random',
            msg: [
                'Oops, yeh to *Maths*, *Physics*, *Chemistry* & *Biology* questions nahi hain! 🤔 🤖\nMai sirf *PCM* doubts solve karr sakta hun. 🤓\n\nAap new cheezein explore karne ke liye meri app try kijiye! 🙂\nDownload Link :👉 https://doubtnut.app.link/RD1Swe7UsZ',
            ],
        })), {
            event: 'random',
            msg: 'Lagta hai aap confused hain. 😛\nAb mai sirf *Maths*, *Physics*, *Chemistry* & *Biology* doubts parr response dunga. 🤖\n\nBook se question ki photo kheeche aur mujhe bheje. Aapko instant solutions mil jaayega. 🔎📚',
        },
    ],
    facts: [
        ..._.times(5, () => ({
            event: 'facts',
            msg: async (params) => {
                const facts = await params.condition('whatsapp_nt', 1, params.studentId, params.config);
                if (!facts || !facts.body || !facts.body.data || !facts.body.data.length) {
                    return;
                }
                return {
                    mediaId: facts.body.data[0],
                    caption: '',
                };
            },
        })), {
            event: 'facts',
            msg: 'Oops! Lagta hai mai aapko aaj 5 facts bhej chuka hun. 🤖\n\nAise aur interesting facts ke liye kal phir se mujhe *#Facts* likh ke bheje 😇',
        },
    ],
    longText: {
        event: 'long-text',
        msg: 'Kya ye ek question hai? 🤖\n\nYes OR No message karein.',
        retries: [{
            event: 'long-text',
            msg: 'Sirf Yes OR No message karein 😊 \n\nYa phir ek aur question pooche. 🤖 📚 ',
        }],
    },
    longTextTrue: {
        yes: {
            event: 'long-text-true',
        },
    },
    longTextFalse: {
        no: {
            event: 'long-text-false',
            msg: 'Aap mujhse *Maths*, *Physics*, *Chemistry* & *Biology* ke questions pooch sakte hai.\n\nHow?🤔\n\nStep 1⃣ - Question ki 📸 photo kheeche\n\nStep 2⃣ - Sirf one question crop karke send karein',
        },
    },
};
