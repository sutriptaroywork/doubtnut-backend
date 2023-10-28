const config = require('../config/config');

module.exports = {
    onboarding(cdnUrl) {
        return {
            en: {
                hello_message: 'Hello Teacher',
                welcome_meesage: 'Welcome to doubtnut',
                top_title: 'Ab Doubtnut par padhao aur kamao',
                steps: ['Khud ko as a teacher register karein', 'Apna personal, teaching aur payment details update karein', 'Apne banae hue study materials upload karke bacho ko padhana shuru kre'],
                login_message: 'Login with phone number',
                tnc_message: 'By continuing you agree to our T & Cand our Privacy Policy',
                sample_avatar_list: [`${cdnUrl}engagement_framework/841BFADD-2E17-C32B-0B9B-83B68442CAFB.webp`, `${cdnUrl}engagement_framework/765C27EE-14E2-BFF1-F749-B41CDADD75E8.webp`, `${cdnUrl}engagement_framework/178A5B4C-B886-70B3-149A-350F5BB0574B.webp`],
                current_message: 'Currently more than 10000 are teaching through doubtnut',
            },
            hi: {
                hello_message: 'हैलो टीचर',
                welcome_meesage: 'डाउटनट में आपका स्वागत है',
                top_title: 'अब डाउटनट पर पढाओ और कमाओ',
                steps: ['खुद को टीचर के रूप में रजिस्टर करें', 'अपनी निजी, टीचिंग और पेमेंट संबंधित जानकारी अपडेट करें', 'अपने बनाए हुए स्टडी मटेरियल अपलोड कर बच्चों को पढ़ाना शुरू करें'],
                login_message: 'फ़ोन नंबर से लॉग इन करें',
                tnc_message: 'जारी रखकर आप हमारे नियम व शर्तों और हमारी प्राइवेसी पॉलिसी से सहमत होते हैं',
                sample_avatar_list: [`${cdnUrl}engagement_framework/841BFADD-2E17-C32B-0B9B-83B68442CAFB.webp`, `${cdnUrl}engagement_framework/765C27EE-14E2-BFF1-F749-B41CDADD75E8.webp`, `${cdnUrl}engagement_framework/178A5B4C-B886-70B3-149A-350F5BB0574B.webp`],
                current_message: 'वर्तमान में 10000 से अधिक शिक्षक डाउटनट पर पढ़ा रहे हैं',
            },
        };
    },
    localeSidTeacherModuleMapping: {
        en: '-395',
        hi: '-396',
        bn: '-397',
        gu: '-398',
        kn: '-399',
        ml: '-400',
        mr: '-401',
        ne: '-402',
        pa: '-403',
        ta: '-404',
        te: '-405',
        ur: '-406',
    },
    myProfileIcon: `${config.staticCDN}engagement_framework/867AECDB-D3DD-D5B4-5600-53795D731EF4.webp`,
    leaderboardFaqBanner: `${config.staticCDN}engagement_framework/90964726-43FC-0955-8485-32E0363442EF.webp`,
    checkout_en: {
        title: 'Select an option to pay',

        preferred_payment_title: 'PASANDEEDA VIDHI',
        preferred_payment_hidden: true,
        preferred_payment_methods: [],

        payment_method_title: 'PAYMENT METHOD',
        payment_method_collapsed: false,
        payment_info: [
            {
                method: 'netbanking',
                name: 'Net Banking',
                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/netbanking_icon.webp',
                image_ratio: '1:1',
                preferred_methods: [
                    {
                        name: 'SBI',
                        code: 'SBIN',
                        image_url: 'https://cdn.razorpay.com/bank/SBIN.gif',
                        image_ratio: '1:1',
                    },
                    // {
                    //     name: 'HDFC',
                    //     code: 'HDFC',
                    //     image_url: 'https://cdn.razorpay.com/bank/HDFC.gif',
                    //     image_ratio: '1:1',
                    // }, {
                    //     name: 'ICICI',
                    //     code: 'ICIC',
                    //     image_url: 'https://cdn.razorpay.com/bank/ICIC.gif',
                    //     image_ratio: '1:1',
                    // }, {
                    //     name: 'AXIS',
                    //     code: 'UTIB',
                    //     image_url: 'https://cdn.razorpay.com/bank/UTIB.gif',
                    //     image_ratio: '1:1',
                    // },
                    {
                        name: 'KOTAK',
                        code: 'KKBK',
                        image_url: 'https://cdn.razorpay.com/bank/KKBK.gif',
                        image_ratio: '1:1',
                    }, {
                        name: 'YES',
                        code: 'YESB',
                        image_url: 'https://cdn.razorpay.com/bank/YESB.gif',
                        image_ratio: '1:1',
                    }, {
                        name: 'IDBI',
                        code: 'IBKL',
                        image_url: 'https://cdn.razorpay.com/bank/IBKL.gif',
                        image_ratio: '1:1',
                    }, {
                        name: 'BOB',
                        code: 'BARB_R',
                        image_url: 'https://cdn.razorpay.com/bank/BARB_R.gif',
                        image_ratio: '1:1',
                    }, {
                        name: 'PNB',
                        code: 'PUNB_R',
                        image_url: 'https://cdn.razorpay.com/bank/PUNB_R.gif',
                        image_ratio: '1:1',
                    }],
                more_bank_text: 'Select from all other banks',
                more_banks_data: {
                    title: 'Apna Bank Select Karen',
                    list: [{
                        name: 'AU Small Finance Bank',
                        code: 'AUBL',
                    }, {
                        name: 'Airtel Payments Bank',
                        code: 'AIRP',
                    }, {
                        name: 'Andhra Bank',
                        code: 'ANDB',
                    }, {
                        name: 'Axis Bank',
                        code: 'UTIB',
                    }, {
                        name: 'Bank of Bahrein and Kuwait',
                        code: 'BBKM',
                    }, {
                        name: 'Bank of Baroda - Retail Banking',
                        code: 'BARB_R',
                    }, {
                        name: 'Bank of India',
                        code: 'BKID',
                    }, {
                        name: 'Bank of Maharashtra',
                        code: 'MAHB',
                    }, {
                        name: 'Canara Bank',
                        code: 'CNRB',
                    }, {
                        name: 'Catholic Syrian Bank',
                        code: 'CSBK',
                    }, {
                        name: 'Central Bank of India',
                        code: 'CBIN',
                    }, {
                        name: 'City Union Bank',
                        code: 'CIUB',
                    }, {
                        name: 'Cosmos Co-operative Bank',
                        code: 'COSB',
                    }, {
                        name: 'DCB Bank',
                        code: 'DCBL',
                    }, {
                        name: 'Deutsche Bank',
                        code: 'DEUT',
                    }, {
                        name: 'Development Bank of Singapore',
                        code: 'DBSS',
                    }, {
                        name: 'Dhanlaxmi Bank',
                        code: 'DLXB',
                    }, {
                        name: 'Equitas Small Finance Bank',
                        code: 'ESFB',
                    }, {
                        name: 'Federal Bank',
                        code: 'FDRL',
                    }, {
                        name: 'Fincare Small Finance Bank',
                        code: 'FSFB',
                    }, {
                        name: 'HDFC Bank',
                        code: 'HDFC',
                    }, {
                        name: 'ICICI Bank',
                        code: 'ICIC',
                    }, {
                        name: 'IDBI',
                        code: 'IBKL',
                    }, {
                        name: 'Indian Bank',
                        code: 'IDIB',
                    }, {
                        name: 'IDFC FIRST Bank',
                        code: 'IDFB',
                    }, {
                        name: 'Indian Bank (Erstwhile Allahabad Bank)',
                        code: 'ALLA',
                    }, {
                        name: 'Indian Overseas Bank',
                        code: 'IOBA',
                    }, {
                        name: 'Indusind Bank',
                        code: 'INDB',
                    }, {
                        name: 'Jammu and Kashmir Bank',
                        code: 'JAKA',
                    }, {
                        name: 'Jana Small Finance Bank',
                        code: 'JSFB',
                    }, {
                        name: 'Janata Sahakari Bank (Pune)',
                        code: 'JSBP',
                    }, {
                        name: 'Karnataka Bank',
                        code: 'KARB',
                    }, {
                        name: 'Karur Vysya Bank',
                        code: 'KVBL',
                    }, {
                        name: 'Kotak Mahindra Bank',
                        code: 'KKBK',
                    }, {
                        name: 'Lakshmi Vilas Bank - Corporate Banking',
                        code: 'LAVB_C',
                    }, {
                        name: 'Lakshmi Vilas Bank - Retail Banking',
                        code: 'LAVB_R',
                    }, {
                        name: 'NKGSB Co-operative Bank',
                        code: 'NKGS',
                    }, {
                        name: 'PNB (Erstwhile-Oriental Bank of Commerce)',
                        code: 'ORBC',
                    }, {
                        name: 'PNB (Erstwhile-United Bank of India)',
                        code: 'UTBI',
                    }, {
                        name: 'Punjab & Sind Bank',
                        code: 'PSIB',
                    }, {
                        name: 'Punjab National Bank - Retail Banking',
                        code: 'PUNB_R',
                    }, {
                        name: 'RBL Bank',
                        code: 'RATN',
                    }, {
                        name: 'Royal Bank of Scotland N.V.',
                        code: 'ABNA',
                    }, {
                        name: 'Saraswat Co-operative Bank',
                        code: 'SRCB',
                    }, {
                        name: 'Shamrao Vithal Co-operative Bank',
                        code: 'SVCB',
                    }, {
                        name: 'South Indian Bank',
                        code: 'SIBL',
                    }, {
                        name: 'Standard Chartered Bank"',
                        code: 'SCBL',
                    }, {
                        name: 'State Bank of Bikaner and Jaipur',
                        code: 'SBBJ',
                    }, {
                        name: 'State Bank of Hyderabad',
                        code: 'SBHY',
                    }, {
                        name: 'State Bank of India',
                        code: 'SBIN',
                    }, {
                        name: 'State Bank of Mysore',
                        code: 'SBMY',
                    }, {
                        name: 'State Bank of Patiala',
                        code: 'STBP',
                    }, {
                        name: 'State Bank of Travancore',
                        code: 'SBTR',
                    }, {
                        name: 'Syndicate Bank',
                        code: 'SYNB',
                    }, {
                        name: 'Tamilnadu Mercantile Bank',
                        code: 'TMBL',
                    }, {
                        name: 'Tamilnadu State Apex Co-operative Bank',
                        code: 'TNSC',
                    }, {
                        name: 'UCO Bank',
                        code: 'UCBA',
                    }, {
                        name: 'Union Bank of India',
                        code: 'UBIN',
                    }, {
                        name: 'Union Bank of India (Erstwhile Corporation Bank)',
                        code: 'CORP',
                    }, {
                        name: 'Vijaya Bank',
                        code: 'VIJB',
                    }, {
                        name: 'Yes Bank',
                        code: 'YESB',
                    }],
                },
            },
        ],
    },
    myVideosIcon: `${config.staticCDN}engagement_framework/D3988A58-B365-0FC0-5A98-386852603A1B.webp`,
    announcement1: `${config.staticCDN}engagement_framework/5C7C1BEB-D311-4DAD-EB38-A776652FD1B4.webp`,
    defaultCcmIds: {
        9: [{ id: 901, course: 'CBSE' }],
        10: [{ id: 1001, course: 'CBSE' }],
        11: [{ id: 1101, course: 'CBSE' }],
        12: [{ id: 1201, course: 'CBSE' }],
        13: [{ id: 11301, course: 'IIT JEE' }, { id: 11303, course: 'NEET' }],
    },
};
