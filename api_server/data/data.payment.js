module.exports = {
    api_url: 'https://api.doubtnut.com/',
    payments_team: {
        mail_details: {
            autobotMailID: 'autobot@doubtnut.com',
            paymentsTechTeamMailID: 'prashant.gupta@doubtnut.com',
            paymentsTechTeamCCID: ['dipankar@doubtnut.com', 'prakher.gaushal@doubtnut.com'],
        },
        slack_details: {
            authKey: 'xoxb-534514142867-3197106116752-AG3DIvAKcx5IsBCKYxhkfCcq',
            slack_ids: ['<@U01MJU54A21>', '<@U0273ABLEPL>', '<@ULGN432HL>'],
            dev_channel: '#payments-team-dev', // for low priority messages/logging
            main_channel: '#payments-team', // for severe errors
        },
        student_ids: [73615406, 3215112, 109149158, '73615406', '3215112', '109149158'],
        iexpert_ids: [20260, 20261, 20262, '20260', '20261', '20262'],
    },
    post_purchase: {
        whatsapp: { // Don't change these otherwise whatsapp messages won't trigger
            hsm_actions: {
                buttons: [
                    {
                        type: 'reply',
                        reply: {
                            id: '1',
                            title: 'Kya Hai CEO Reward?',
                        },
                    },
                    {
                        type: 'reply',
                        reply: {
                            id: '2',
                            title: 'Get CEO Coupon',
                        },
                    },
                ],
            },
            hsm_text: "Hi {{1}},\n🎉🎙️ Badhai ho!\nDoubtnut pe aapka Rs. {{2}} ka payment successful raha ✅\nAapka admission '{{3}}' mai ho gaya hai aur aapka package '{{4}}' tak valid hai 📚\n\n*Ab aapke liye ek aur khushkhabri hai !*\n\nApne doston ka bhi admission karvao aur jeeto har admission pe Rs. 1000, Boat Airdopes, Bluetooth Speakers & Redmi 9 Phone 🎶 ☎️ 🎧💯",
            footer_text: 'Neeche diye hue options mai se hi kuch select karein',
        },
    },
    payment_link_info(locale) {
        return {
            title: global.t8[locale].t('OTHER METHODS ⬇️'),
            payment_link_collapsed: false,
            link: {
                // title: 'Payment karne mein pareshani?',
                title: global.t8[locale].t('Recharge Shop/Gharvalon/Doston se payment'),
                action_button_text: global.t8[locale].t('Share Link'),
                text2: global.t8[locale].t('Share payment link'),
                text3: global.t8[locale].t('Pay using Cards/ UPI/ Net Banking'),
                description: [
                    global.t8[locale].t('Karvaen dusro se apni payments! Share link par click karke'),
                    global.t8[locale].t('Payment link ke madhyam se aap apne gharvalon, doston ya kirana store se apni payment karva sakte hai'),
                    global.t8[locale].t('Whatsapp se share karke aapke chune hue Video/Course ki poori jaankari bhi apne aap un tak pahonch jaayegi'),
                ],
            },
            qr: {
                text2: global.t8[locale].t('QR Code'),
                text3: global.t8[locale].t('Scan and Pay using GooglePay/PhonePe/Paytm UPI'),
                action_button_text: global.t8[locale].t('Show QR Code'),
            },
            bbps: {
                // text2: 'Recharge Shop/Bill Pay/Cash',
                text2: global.t8[locale].t('Pay In Cash | Recharge Shop'),
                // text3: 'Kisi bhi recharge shop ya bill jama kendra par hogi ab payment',
                // text3: 'Pay karna hogaya he bill bharne jitna easy',
                // text3: 'Ab payment karna hua recharge ya bill bharne jitna easy 😊! Kisi bhi recharge shop ya bill jama kendra par hogi ab Doubtnut ki payment',
                // text3: 'Jese aap apna 📞 recharge ya ⚡ bill bharte he, vese hi ab Doubtnut ki bhi hogi payment',
                text3: global.t8[locale].t('Jaise aap apna 📞 recharge ya ⚡ bill bharte he, vaise hi ab Doubtnut ki bhi hogi payment 😊'),
                action_button_text: global.t8[locale].t('know more'),
                deeplink: 'doubtnutapp://web_view?chrome_custom_tab=false&title=Pay%20Using%20Phone%20Number&url=https://api.doubtnut.com/static/bbps.html?token=',
            },
        };
    },
    payment_help(locale) {
        return {
            page_title: global.t8[locale].t('Help'),
            page_title_icon: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_help.webp',
            page_title_tooltip: global.t8[locale].t('Payment karne ke tareeko ke baare mein jaan ne ke liye yahan click kariye'),
            content: {
                title: global.t8[locale].t('Payment Options'),
                list: [{
                    name: global.t8[locale].t('All payment methods in short'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/general.mp4',
                    type: 'general',
                }, {
                    name: global.t8[locale].t('Google Pay, PhonePe, BHIM UPI, other UPI Apps'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/upi.mp4',
                    type: 'upi',
                }, {
                    name: global.t8[locale].t('Paytm and other popular wallets'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/wallet.mp4',
                    type: 'wallet',
                }, {
                    name: global.t8[locale].t('Payment Link (Recharge Shop/Gharvalon/Doston se payment)'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/payment_link.mp4',
                    type: 'payment_link',
                }, {
                    name: global.t8[locale].t('QR Code (Recharge Shop/Gharvalon/Doston se payment)'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/qr.mp4',
                    type: 'qr',
                }, {
                    name: global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/nb.mp4',
                    type: 'netbanking',
                }, {
                    name: global.t8[locale].t('Pay in Cash (Paytm App)'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/bbps_paytm.mp4',
                    type: 'bbps-paytm',
                }, {
                    name: global.t8[locale].t('Pay in Cash (PhonePe App)'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/bbps_phonepe.mp4',
                    type: 'bbps-phonepe',
                }, {
                    name: global.t8[locale].t('Pay in Cash (BHIM App)'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/bbps_bhim.mp4',
                    type: 'bbps-bhim',
                }, {
                    name: global.t8[locale].t('Cash on Delivery (Min: ₹500)'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/icon_small_play_small.webp',
                    video_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/cod_intro.mp4',
                    type: 'cod',
                },
                ],
            },
        };
    },
    checkout(locale) {
        return {
            title: global.t8[locale].t('Select and option to pay'),

            preferred_payment_title: global.t8[locale].t('PASANDEEDA VIDHI'),
            preferred_payment_hidden: true,
            preferred_payment_methods: [],

            payment_method_title: global.t8[locale].t('PAYMENT METHOD'),
            payment_method_collapsed: false,
            payment_info: [
                {
                    method: 'upi',
                    name: global.t8[locale].t('Google Pay / PhonePe / UPI'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/upi_group_icon.webp',
                    is_selected: true,
                    image_ratio: '110:32',
                },
                {
                    method: 'upi_collect',
                    name: global.t8[locale].t('UPI ID'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/upi.webp',
                    upi_hint: 'xyz@bankname',
                    description: global.t8[locale].t('UPI ID ka format name/phone number@bankname hota hai'),
                    action_button_text: global.t8[locale].t('Verify'),
                    image_ratio: '1:1',
                },
                /* {
                    method: 'COD',
                    name: global.t8[locale].t('Cash On Delivery'),
                    description: global.t8[locale].t('Aapko ek coupon code deliver hoga jisse aap apna course activate kar sakte hai'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/wallet_icon.webp',
                    image_ratio: '1:1',
                    info: {
                        title: global.t8[locale].t('Know More'),
                        image_urls: ['https://d10lpgp6xz60nq.cloudfront.net/images/payment/cod_pamphlet_2.webp', 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/cod_pamphlet_1.webp'],
                        deeplink: null,
                    },
                }, */
                {
                    method: 'card',
                    name: global.t8[locale].t('Debit / Credit / ATM Card'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/card_icon_3.webp',
                    image_ratio: '1:1',
                    card_localization: {
                        card_no_hint: global.t8[locale].t('Card Number'),
                        cvv_hint: global.t8[locale].t('CVV'),
                        expiry_hint: global.t8[locale].t('MM/YY'),
                        name_hint: global.t8[locale].t('Name on Card'),
                    },
                },
                {
                    type: 'paytm',
                    name: global.t8[locale].t('Paytm Wallet'),
                    image_url: 'https://cdn.razorpay.com/wallet-sq/paytm.png',
                    image_ratio: '1:1',
                },
                {
                    method: 'wallet',
                    name: global.t8[locale].t('Popular Wallets'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/wallet_icon.webp',
                    image_ratio: '1:1',
                    preferred_methods: [
                        {
                            name: global.t8[locale].t('Phone Pe'),
                            code: 'phonepe',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/phonepe.png',
                            image_ratio: '1:1',
                        }, {
                            name: global.t8[locale].t('Amazon Pay'),
                            code: 'amazonpay',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/amazonpay.png',
                            image_ratio: '1:1',
                        }, {
                            name: global.t8[locale].t('Airtel Money'),
                            code: 'airtelmoney',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/airtelmoney.png',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('Jio Money'),
                            code: 'jiomoney',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/jiomoney.png',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('Freecharge'),
                            code: 'freecharge',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/freecharge.png',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('MobiKwik'),
                            code: 'mobikwik',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/mobikwik.png',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('Ola Money (Postpaid + Prepaid)'),
                            code: 'olamoney',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/olamoney.png',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('PayZapp'),
                            code: 'payzapp',
                            image_url: 'https://cdn.razorpay.com/wallet-sq/payzapp.png',
                            image_ratio: '1:1',
                        },
                    ],
                },
                {
                    method: 'netbanking',
                    name: global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking'),
                    image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/netbanking_icon.webp',
                    image_ratio: '1:1',
                    preferred_methods: [
                        {
                            name: global.t8[locale].t('SBI'),
                            code: 'SBIN',
                            image_url: 'https://cdn.razorpay.com/bank/SBIN.gif',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('HDFC'),
                            code: 'HDFC',
                            image_url: 'https://cdn.razorpay.com/bank/HDFC.gif',
                            image_ratio: '1:1',
                        }, {
                            name: global.t8[locale].t('ICICI'),
                            code: 'ICIC',
                            image_url: 'https://cdn.razorpay.com/bank/ICIC.gif',
                            image_ratio: '1:1',
                        }, {
                            name: global.t8[locale].t('AXIS'),
                            code: 'UTIB',
                            image_url: 'https://cdn.razorpay.com/bank/UTIB.gif',
                            image_ratio: '1:1',
                        },
                        {
                            name: global.t8[locale].t('KOTAK'),
                            code: 'KKBK',
                            image_url: 'https://cdn.razorpay.com/bank/KKBK.gif',
                            image_ratio: '1:1',
                        }, {
                            name: global.t8[locale].t('YES'),
                            code: 'YESB',
                            image_url: 'https://cdn.razorpay.com/bank/YESB.gif',
                            image_ratio: '1:1',
                        }],
                    more_bank_text: global.t8[locale].t('Select from all other banks'),
                    more_banks_data: {
                        title: global.t8[locale].t('Apna Bank Select Karen'),
                        list: [{
                            name: global.t8[locale].t('AU Small Finance Bank'),
                            code: 'AUBL',
                        }, {
                            name: global.t8[locale].t('Airtel Payments Bank'),
                            code: 'AIRP',
                        }, {
                            name: global.t8[locale].t('Andhra Bank'),
                            code: 'ANDB',
                        }, {
                            name: global.t8[locale].t('Axis Bank'),
                            code: 'UTIB',
                        }, {
                            name: global.t8[locale].t('Bank of Bahrein and Kuwait'),
                            code: 'BBKM',
                        }, {
                            name: global.t8[locale].t('Bank of Baroda - Retail Banking'),
                            code: 'BARB_R',
                        }, {
                            name: global.t8[locale].t('Bank of India'),
                            code: 'BKID',
                        }, {
                            name: global.t8[locale].t('Bank of Maharashtra'),
                            code: 'MAHB',
                        }, {
                            name: global.t8[locale].t('Canara Bank'),
                            code: 'CNRB',
                        }, {
                            name: global.t8[locale].t('Catholic Syrian Bank'),
                            code: 'CSBK',
                        }, {
                            name: global.t8[locale].t('Central Bank of India'),
                            code: 'CBIN',
                        }, {
                            name: global.t8[locale].t('City Union Bank'),
                            code: 'CIUB',
                        }, {
                            name: global.t8[locale].t('Cosmos Co-operative Bank'),
                            code: 'COSB',
                        }, {
                            name: global.t8[locale].t('DCB Bank'),
                            code: 'DCBL',
                        }, {
                            name: global.t8[locale].t('Deutsche Bank'),
                            code: 'DEUT',
                        }, {
                            name: global.t8[locale].t('Development Bank of Singapore'),
                            code: 'DBSS',
                        }, {
                            name: global.t8[locale].t('Dhanlaxmi Bank'),
                            code: 'DLXB',
                        }, {
                            name: global.t8[locale].t('Equitas Small Finance Bank'),
                            code: 'ESFB',
                        }, {
                            name: global.t8[locale].t('Federal Bank'),
                            code: 'FDRL',
                        }, {
                            name: global.t8[locale].t('Fincare Small Finance Bank'),
                            code: 'FSFB',
                        }, {
                            name: global.t8[locale].t('HDFC Bank'),
                            code: 'HDFC',
                        }, {
                            name: global.t8[locale].t('ICICI Bank'),
                            code: 'ICIC',
                        }, {
                            name: global.t8[locale].t('IDBI'),
                            code: 'IBKL',
                        }, {
                            name: global.t8[locale].t('Indian Bank'),
                            code: 'IDIB',
                        }, {
                            name: global.t8[locale].t('IDFC FIRST Bank'),
                            code: 'IDFB',
                        }, {
                            name: global.t8[locale].t('Indian Bank (Erstwhile Allahabad Bank)'),
                            code: 'ALLA',
                        }, {
                            name: global.t8[locale].t('Indian Overseas Bank'),
                            code: 'IOBA',
                        }, {
                            name: global.t8[locale].t('Indusind Bank'),
                            code: 'INDB',
                        }, {
                            name: global.t8[locale].t('Jammu and Kashmir Bank'),
                            code: 'JAKA',
                        }, {
                            name: global.t8[locale].t('Jana Small Finance Bank'),
                            code: 'JSFB',
                        }, {
                            name: global.t8[locale].t('Janata Sahakari Bank (Pune)'),
                            code: 'JSBP',
                        }, {
                            name: global.t8[locale].t('Karnataka Bank'),
                            code: 'KARB',
                        }, {
                            name: global.t8[locale].t('Karur Vysya Bank'),
                            code: 'KVBL',
                        }, {
                            name: global.t8[locale].t('Kotak Mahindra Bank'),
                            code: 'KKBK',
                        }, {
                            name: global.t8[locale].t('Lakshmi Vilas Bank - Corporate Banking'),
                            code: 'LAVB_C',
                        }, {
                            name: global.t8[locale].t('Lakshmi Vilas Bank - Retail Banking'),
                            code: 'LAVB_R',
                        }, {
                            name: global.t8[locale].t('NKGSB Co-operative Bank'),
                            code: 'NKGS',
                        }, {
                            name: global.t8[locale].t('PNB (Erstwhile-Oriental Bank of Commerce)'),
                            code: 'ORBC',
                        }, {
                            name: global.t8[locale].t('PNB (Erstwhile-United Bank of India)'),
                            code: 'UTBI',
                        }, {
                            name: global.t8[locale].t('Punjab & Sind Bank'),
                            code: 'PSIB',
                        }, {
                            name: global.t8[locale].t('Punjab National Bank - Retail Banking'),
                            code: 'PUNB_R',
                        }, {
                            name: global.t8[locale].t('RBL Bank'),
                            code: 'RATN',
                        }, {
                            name: global.t8[locale].t('Royal Bank of Scotland N.V.'),
                            code: 'ABNA',
                        }, {
                            name: global.t8[locale].t('Saraswat Co-operative Bank'),
                            code: 'SRCB',
                        }, {
                            name: global.t8[locale].t('Shamrao Vithal Co-operative Bank'),
                            code: 'SVCB',
                        }, {
                            name: global.t8[locale].t('South Indian Bank'),
                            code: 'SIBL',
                        }, {
                            name: global.t8[locale].t('Standard Chartered Bank'),
                            code: 'SCBL',
                        }, {
                            name: global.t8[locale].t('State Bank of Bikaner and Jaipur'),
                            code: 'SBBJ',
                        }, {
                            name: global.t8[locale].t('State Bank of Hyderabad'),
                            code: 'SBHY',
                        }, {
                            name: global.t8[locale].t('State Bank of India'),
                            code: 'SBIN',
                        }, {
                            name: global.t8[locale].t('State Bank of Mysore'),
                            code: 'SBMY',
                        }, {
                            name: global.t8[locale].t('State Bank of Patiala'),
                            code: 'STBP',
                        }, {
                            name: global.t8[locale].t('State Bank of Travancore'),
                            code: 'SBTR',
                        }, {
                            name: global.t8[locale].t('Syndicate Bank'),
                            code: 'SYNB',
                        }, {
                            name: global.t8[locale].t('Tamilnadu Mercantile Bank'),
                            code: 'TMBL',
                        }, {
                            name: global.t8[locale].t('Tamilnadu State Apex Co-operative Bank'),
                            code: 'TNSC',
                        }, {
                            name: global.t8[locale].t('UCO Bank'),
                            code: 'UCBA',
                        }, {
                            name: global.t8[locale].t('Union Bank of India'),
                            code: 'UBIN',
                        }, {
                            name: global.t8[locale].t('Union Bank of India (Erstwhile Corporation Bank)'),
                            code: 'CORP',
                        }, {
                            name: global.t8[locale].t('Vijaya Bank'),
                            code: 'VIJB',
                        }, {
                            name: global.t8[locale].t('Yes Bank'),
                            code: 'YESB',
                        }],
                    },
                },
            ],
            /*
            banners: [
                {
                    type: 'APB',
                    deeplink: '',
                    banner_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/apb/apb_pay_in_cash_rectangle.webp',
                },
            ],
    */
        };
    },
    checkout_widget: {
        online_methods({
            locale,
            netAmount,
            autoProceedTime,
        }) {
            return {
                type: 'widget_parent_checkout',
                data: {
                    title: global.t8[locale].t('Online Methods'),
                    items: [
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'upi',
                                title: global.t8[locale].t('Google Pay | PhonePe | Bhim UPI'),
                                subtitle: '',
                                button_text: global.t8[locale].t('Pay ₹{{amount, number}}', { amount: netAmount }),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/upi_slide_1.gif',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                is_selected: true,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'upi_collect',
                                title: global.t8[locale].t('UPI ID'),
                                subtitle: global.t8[locale].t('Aapke UPI App pe request ayegi usko accept kariye'),
                                button_text: global.t8[locale].t('Pay ₹{{amount, number}}', { amount: netAmount }),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/upi_slide_1.gif',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                dialog_data: {
                                    title: global.t8[locale].t('Enter UPI ID'),
                                    subtitle: global.t8[locale].t('UPI ID ka format name/phone number@bankname hota hai'),
                                    upi_data: {
                                        upi_id_hint: 'xyz@bankname',
                                    },
                                    button_text: global.t8[locale].t('Verify UPI ID'),
                                },
                                is_selected: true,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'paytm',
                                title: global.t8[locale].t('Paytm'),
                                subtitle: global.t8[locale].t(''),
                                button_text: global.t8[locale].t('Pay ₹{{amount, number}}', { amount: netAmount }),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://cdn.razorpay.com/wallet-sq/paytm.png',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'card',
                                title: global.t8[locale].t('Credit | Debit | ATM Card'),
                                subtitle: global.t8[locale].t(''),
                                button_text: global.t8[locale].t('Add Card Details'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/card_icon_3.webp',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                dialog_data: {
                                    title: global.t8[locale].t('Add Credit | Debit Card Details'),
                                    subtitle: global.t8[locale].t('Apne Card par di gayi details dalain'),
                                    button_text: global.t8[locale].t('Pay ₹{{amount, number}}', { amount: netAmount }),
                                    auto_apply_timer: autoProceedTime,
                                    card_data: {
                                        info: {
                                            card_no_hint: global.t8[locale].t('Card Number'),
                                            cvv_hint: global.t8[locale].t('CVV'),
                                            expiry_hint: global.t8[locale].t('MM/YY'),
                                            name_hint: global.t8[locale].t('Name on Card'),
                                        },
                                        help: {
                                            title: global.t8[locale].t('CVV kya hai?'),
                                            subtitle: global.t8[locale].t('CVV apke card ke peche ek 3 digit ka code hai'),
                                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/card_cvv_helper.webp',
                                            image_ratio: '1:1',
                                        },
                                    },
                                },
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'wallet',
                                title: global.t8[locale].t('Other Wallets'),
                                subtitle: global.t8[locale].t('Select your preferred wallet'),
                                button_text: global.t8[locale].t('Select a Wallet'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/wallet_icon.webp',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                dialog_data: {
                                    title: global.t8[locale].t('Select a Wallet'),
                                    subtitle: global.t8[locale].t('Select your bank'),
                                    button_text: global.t8[locale].t('Pay ₹{{amount, number}}', { amount: netAmount }),
                                    auto_apply_timer: autoProceedTime,
                                    wallet_data: {
                                        items: [
                                            {
                                                name: global.t8[locale].t('Phone Pe'),
                                                code: 'phonepe',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/phonepe.png',
                                                image_ratio: '1:1',
                                            }, {
                                                name: global.t8[locale].t('Amazon Pay'),
                                                code: 'amazonpay',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/amazonpay.png',
                                                image_ratio: '1:1',
                                            }, {
                                                name: global.t8[locale].t('Airtel Money'),
                                                code: 'airtelmoney',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/airtelmoney.png',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('Jio Money'),
                                                code: 'jiomoney',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/jiomoney.png',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('Freecharge'),
                                                code: 'freecharge',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/freecharge.png',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('MobiKwik'),
                                                code: 'mobikwik',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/mobikwik.png',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('Ola Money (Postpaid + Prepaid)'),
                                                code: 'olamoney',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/olamoney.png',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('PayZapp'),
                                                code: 'payzapp',
                                                image_url: 'https://cdn.razorpay.com/wallet-sq/payzapp.png',
                                                image_ratio: '1:1',
                                            },
                                        ],
                                    },
                                },
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'netbanking',
                                title: global.t8[locale].t('Net Banking'.toUpperCase(), 'Net Banking'),
                                subtitle: global.t8[locale].t('Select your preferred bank for netbanking'),
                                button_text: global.t8[locale].t('Select a bank'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/netbanking_icon.webp',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                dialog_data: {
                                    title: global.t8[locale].t('Add Net Banking Details'),
                                    subtitle: global.t8[locale].t('Select your bank'),
                                    button_text: global.t8[locale].t('Pay ₹{{amount, number}}', { amount: netAmount }),
                                    auto_apply_timer: autoProceedTime,
                                    netbanking_data: {
                                        items: [
                                            {
                                                name: global.t8[locale].t('SBI'),
                                                code: 'SBIN',
                                                image_url: 'https://cdn.razorpay.com/bank/SBIN.gif',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('HDFC'),
                                                code: 'HDFC',
                                                image_url: 'https://cdn.razorpay.com/bank/HDFC.gif',
                                                image_ratio: '1:1',
                                            }, {
                                                name: global.t8[locale].t('ICICI'),
                                                code: 'ICIC',
                                                image_url: 'https://cdn.razorpay.com/bank/ICIC.gif',
                                                image_ratio: '1:1',
                                            }, {
                                                name: global.t8[locale].t('AXIS'),
                                                code: 'UTIB',
                                                image_url: 'https://cdn.razorpay.com/bank/UTIB.gif',
                                                image_ratio: '1:1',
                                            },
                                            {
                                                name: global.t8[locale].t('KOTAK'),
                                                code: 'KKBK',
                                                image_url: 'https://cdn.razorpay.com/bank/KKBK.gif',
                                                image_ratio: '1:1',
                                            }, {
                                                name: global.t8[locale].t('YES'),
                                                code: 'YESB',
                                                image_url: 'https://cdn.razorpay.com/bank/YESB.gif',
                                                image_ratio: '1:1',
                                            }],
                                        more_bank_text: global.t8[locale].t('Select from all other banks'),
                                        more_banks_data: {
                                            title: global.t8[locale].t('Select Bank'),
                                            subtitle: global.t8[locale].t('Search for other banks'),
                                            items: [{
                                                name: global.t8[locale].t('AU Small Finance Bank'),
                                                code: 'AUBL',
                                            }, {
                                                name: global.t8[locale].t('Airtel Payments Bank'),
                                                code: 'AIRP',
                                            }, {
                                                name: global.t8[locale].t('Andhra Bank'),
                                                code: 'ANDB',
                                            }, {
                                                name: global.t8[locale].t('Axis Bank'),
                                                code: 'UTIB',
                                            }, {
                                                name: global.t8[locale].t('Bank of Bahrein and Kuwait'),
                                                code: 'BBKM',
                                            }, {
                                                name: global.t8[locale].t('Bank of Baroda - Retail Banking'),
                                                code: 'BARB_R',
                                            }, {
                                                name: global.t8[locale].t('Bank of India'),
                                                code: 'BKID',
                                            }, {
                                                name: global.t8[locale].t('Bank of Maharashtra'),
                                                code: 'MAHB',
                                            }, {
                                                name: global.t8[locale].t('Canara Bank'),
                                                code: 'CNRB',
                                            }, {
                                                name: global.t8[locale].t('Catholic Syrian Bank'),
                                                code: 'CSBK',
                                            }, {
                                                name: global.t8[locale].t('Central Bank of India'),
                                                code: 'CBIN',
                                            }, {
                                                name: global.t8[locale].t('City Union Bank'),
                                                code: 'CIUB',
                                            }, {
                                                name: global.t8[locale].t('Cosmos Co-operative Bank'),
                                                code: 'COSB',
                                            }, {
                                                name: global.t8[locale].t('DCB Bank'),
                                                code: 'DCBL',
                                            }, {
                                                name: global.t8[locale].t('Deutsche Bank'),
                                                code: 'DEUT',
                                            }, {
                                                name: global.t8[locale].t('Development Bank of Singapore'),
                                                code: 'DBSS',
                                            }, {
                                                name: global.t8[locale].t('Dhanlaxmi Bank'),
                                                code: 'DLXB',
                                            }, {
                                                name: global.t8[locale].t('Equitas Small Finance Bank'),
                                                code: 'ESFB',
                                            }, {
                                                name: global.t8[locale].t('Federal Bank'),
                                                code: 'FDRL',
                                            }, {
                                                name: global.t8[locale].t('Fincare Small Finance Bank'),
                                                code: 'FSFB',
                                            }, {
                                                name: global.t8[locale].t('HDFC Bank'),
                                                code: 'HDFC',
                                            }, {
                                                name: global.t8[locale].t('ICICI Bank'),
                                                code: 'ICIC',
                                            }, {
                                                name: global.t8[locale].t('IDBI'),
                                                code: 'IBKL',
                                            }, {
                                                name: global.t8[locale].t('Indian Bank'),
                                                code: 'IDIB',
                                            }, {
                                                name: global.t8[locale].t('IDFC FIRST Bank'),
                                                code: 'IDFB',
                                            }, {
                                                name: global.t8[locale].t('Indian Bank (Erstwhile Allahabad Bank)'),
                                                code: 'ALLA',
                                            }, {
                                                name: global.t8[locale].t('Indian Overseas Bank'),
                                                code: 'IOBA',
                                            }, {
                                                name: global.t8[locale].t('Indusind Bank'),
                                                code: 'INDB',
                                            }, {
                                                name: global.t8[locale].t('Jammu and Kashmir Bank'),
                                                code: 'JAKA',
                                            }, {
                                                name: global.t8[locale].t('Jana Small Finance Bank'),
                                                code: 'JSFB',
                                            }, {
                                                name: global.t8[locale].t('Janata Sahakari Bank (Pune)'),
                                                code: 'JSBP',
                                            }, {
                                                name: global.t8[locale].t('Karnataka Bank'),
                                                code: 'KARB',
                                            }, {
                                                name: global.t8[locale].t('Karur Vysya Bank'),
                                                code: 'KVBL',
                                            }, {
                                                name: global.t8[locale].t('Kotak Mahindra Bank'),
                                                code: 'KKBK',
                                            }, {
                                                name: global.t8[locale].t('Lakshmi Vilas Bank - Corporate Banking'),
                                                code: 'LAVB_C',
                                            }, {
                                                name: global.t8[locale].t('Lakshmi Vilas Bank - Retail Banking'),
                                                code: 'LAVB_R',
                                            }, {
                                                name: global.t8[locale].t('NKGSB Co-operative Bank'),
                                                code: 'NKGS',
                                            }, {
                                                name: global.t8[locale].t('PNB (Erstwhile-Oriental Bank of Commerce)'),
                                                code: 'ORBC',
                                            }, {
                                                name: global.t8[locale].t('PNB (Erstwhile-United Bank of India)'),
                                                code: 'UTBI',
                                            }, {
                                                name: global.t8[locale].t('Punjab & Sind Bank'),
                                                code: 'PSIB',
                                            }, {
                                                name: global.t8[locale].t('Punjab National Bank - Retail Banking'),
                                                code: 'PUNB_R',
                                            }, {
                                                name: global.t8[locale].t('RBL Bank'),
                                                code: 'RATN',
                                            }, {
                                                name: global.t8[locale].t('Royal Bank of Scotland N.V.'),
                                                code: 'ABNA',
                                            }, {
                                                name: global.t8[locale].t('Saraswat Co-operative Bank'),
                                                code: 'SRCB',
                                            }, {
                                                name: global.t8[locale].t('Shamrao Vithal Co-operative Bank'),
                                                code: 'SVCB',
                                            }, {
                                                name: global.t8[locale].t('South Indian Bank'),
                                                code: 'SIBL',
                                            }, {
                                                name: global.t8[locale].t('Standard Chartered Bank'),
                                                code: 'SCBL',
                                            }, {
                                                name: global.t8[locale].t('State Bank of Bikaner and Jaipur'),
                                                code: 'SBBJ',
                                            }, {
                                                name: global.t8[locale].t('State Bank of Hyderabad'),
                                                code: 'SBHY',
                                            }, {
                                                name: global.t8[locale].t('State Bank of India'),
                                                code: 'SBIN',
                                            }, {
                                                name: global.t8[locale].t('State Bank of Mysore'),
                                                code: 'SBMY',
                                            }, {
                                                name: global.t8[locale].t('State Bank of Patiala'),
                                                code: 'STBP',
                                            }, {
                                                name: global.t8[locale].t('State Bank of Travancore'),
                                                code: 'SBTR',
                                            }, {
                                                name: global.t8[locale].t('Syndicate Bank'),
                                                code: 'SYNB',
                                            }, {
                                                name: global.t8[locale].t('Tamilnadu Mercantile Bank'),
                                                code: 'TMBL',
                                            }, {
                                                name: global.t8[locale].t('Tamilnadu State Apex Co-operative Bank'),
                                                code: 'TNSC',
                                            }, {
                                                name: global.t8[locale].t('UCO Bank'),
                                                code: 'UCBA',
                                            }, {
                                                name: global.t8[locale].t('Union Bank of India'),
                                                code: 'UBIN',
                                            }, {
                                                name: global.t8[locale].t('Union Bank of India (Erstwhile Corporation Bank)'),
                                                code: 'CORP',
                                            }, {
                                                name: global.t8[locale].t('Vijaya Bank'),
                                                code: 'VIJB',
                                            }, {
                                                name: global.t8[locale].t('Yes Bank'),
                                                code: 'YESB',
                                            }],
                                        },
                                    },
                                },
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                    ],
                    initial_max_length: 3,
                    toggle_title: global.t8[locale].t('Show Less'),
                    toggle_initial_title: global.t8[locale].t('More Payment Methods'),
                    hide_widget: false,
                    is_disabled: false,
                },
            };
        },
        offline_methods({
            locale,
            netAmount,
            autoProceedTime,
        }) {
            return {
                type: 'widget_parent_checkout',
                data: {
                    title: global.t8[locale].t('Offline Methods'),
                    items: [
                        /* {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'COD',
                                title: global.t8[locale].t('Cash On Delivery'),
                                subtitle: global.t8[locale].t('Aapko ek coupon code deliver hoga jisse aap apna course activate kar sakte hai'),
                                button_text: global.t8[locale].t('Pay ₹{{amount, number}} on Delivery', { amount: netAmount }),
                                auto_apply_timer: autoProceedTime,
                                image_url: '',
                                image_ratio: '1:1',
                                is_selected: false,
                                has_deeplink: true,
                                deeplink: '',
                                is_disabled: false,
                            },
                        }, */
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'payment_link',
                                title: global.t8[locale].t('Recharge Shop|Gharvalon|Doston'),
                                subtitle: global.t8[locale].t('Karvaen dusro se apni payments! Share link par click karke'),
                                button_text: global.t8[locale].t('Share Link'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: '',
                                image_ratio: '1:1',
                                is_selected: false,
                                has_deeplink: false,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'upi_intent',
                                title: global.t8[locale].t('QR Code Se'),
                                subtitle: global.t8[locale].t('Scan and Pay using GooglePay|PhonePe|Paytm UPI'),
                                button_text: global.t8[locale].t('Show QR Code'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: '',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'upi_offline',
                                title: global.t8[locale].t('123Pay'),
                                subtitle: global.t8[locale].t('A Govt. of India Initiative\n08045163666 pe call karke paise transfer karain DN wallet mein'),
                                button_text: global.t8[locale].t('Know More'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: 'NEW',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/upi.webp',
                                image_ratio: '1:1',
                                is_selected: false,
                                has_deeplink: true,
                                deeplink: '',
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'bank_transfer',
                                title: global.t8[locale].t('NEFT, RTGS and IMPS'),
                                subtitle: global.t8[locale].t('Kisi bhi bank se paise transfer karain apne DN wallet mein'),
                                button_text: global.t8[locale].t('Know More'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: '',
                                image_ratio: '1:1',
                                is_selected: false,
                                has_deeplink: true,
                                deeplink: '',
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'bbps',
                                title: global.t8[locale].t('Pay In Cash | Recharge Shop'),
                                subtitle: global.t8[locale].t('Jaise aap apna 📞 recharge ya ⚡ bill bharte he, vaise hi ab Doubtnut ki bhi hogi payment 😊'),
                                button_text: global.t8[locale].t('Know More'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: '',
                                image_ratio: '1:1',
                                is_selected: false,
                                has_deeplink: true,
                                deeplink: '',
                                is_disabled: false,
                            },
                        },
                    ],
                    initial_max_length: 4,
                    toggle_title: global.t8[locale].t('Show Less'),
                    toggle_initial_title: global.t8[locale].t('More Payment Methods'),
                    is_disabled: false,
                    hide_widget: false,
                },
            };
        },
        emi_methods({
            locale,
            netAmount,
            autoProceedTime,
        }) {
            return {
                type: 'widget_parent_checkout',
                data: {
                    title: global.t8[locale].t('EMI'),
                    items: [
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'shopse',
                                title: global.t8[locale].t('Zero-cost EMI | ShopSe'),
                                subtitle: global.t8[locale].t('Aap EMI se payment kar sakte hain'),
                                button_text: global.t8[locale].t('Buy Now'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: 'NEW',
                                image_url: 'https://static.wixstatic.com/media/0dba30_c806506abafc4591afb545cc95f15311~mv2.png/v1/fill/w_140,h_60,al_c,q_85,usm_0.66_1.00_0.01/shopse%2520logo_edited.webp',
                                image_ratio: '1:1',
                                has_deeplink: true,
                                deeplink: '',
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'payu',
                                title: global.t8[locale].t('Zero-cost EMI | PayU'),
                                subtitle: global.t8[locale].t('Aap EMI se payment kar sakte hain'),
                                button_text: global.t8[locale].t('Buy Now'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: 'NEW',
                                image_url: '',
                                image_ratio: '1:1',
                                has_deeplink: true,
                                deeplink: '',
                                is_selected: false,
                                is_disabled: false,
                            },
                        },
                    ],
                    initial_max_length: 3,
                    is_disabled: false,
                    hide_widget: false,
                },
            };
        },
        inactive_package(locale) {
            return {
                type: 'text_widget',
                data: {
                    html_title: global.t8[locale].t('This course is not active.<br>Please check our other courses we have for you.<br><span style="color:#d75c34"><u>Click here.</u></span>'),
                    alignment: 'center',
                    force_hide_right_icon: true,
                    deeplink: 'doubtnutapp://library_tab?tag=check_all_courses',
                    background_color: '#f6f6f6',
                    layout_padding: {
                        padding_start: 2,
                        padding_end: 2,
                        padding_top: 15,
                        padding_bottom: 15,
                    },
                },
                layout_config: {
                    margin_top: 100,
                    margin_bottom: 0,
                    margin_left: 10,
                    margin_right: 10,
                },
            };
        },
        gulf_countries_methods({
            locale,
            currencySymbol,
            netAmount,
            autoProceedTime,
        }) {
            return {
                type: 'widget_parent_checkout',
                data: {
                    title: global.t8[locale].t('Payment Method'),
                    items: [
                        {
                            type: 'widget_checkout_payment_method',
                            data: {
                                method: 'card',
                                title: global.t8[locale].t('Credit | Debit | ATM Card'),
                                subtitle: '',
                                button_text: global.t8[locale].t('Add Card Details'),
                                auto_apply_timer: autoProceedTime,
                                hyper_text: '',
                                image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/card_icon_3.webp',
                                image_ratio: '1:1',
                                has_deeplink: false,
                                dialog_data: {
                                    title: global.t8[locale].t('Add Credit | Debit Card Details'),
                                    subtitle: global.t8[locale].t('Add the details given on your card'),
                                    button_text: global.t8[locale].t('Pay {{currencySymbol}}{{amount, number}}', { currencySymbol, amount: netAmount }),
                                    auto_apply_timer: autoProceedTime,
                                    card_data: {
                                        info: {
                                            card_no_hint: global.t8[locale].t('Card Number'),
                                            cvv_hint: global.t8[locale].t('CVV'),
                                            expiry_hint: global.t8[locale].t('MM/YY'),
                                            name_hint: global.t8[locale].t('Name on Card'),
                                        },
                                        help: {
                                            title: global.t8[locale].t('What is CVV?'),
                                            subtitle: global.t8[locale].t('CVV is the 3 digit code on the back of your card'),
                                            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/card_cvv_helper.webp',
                                            image_ratio: '1:1',
                                        },
                                    },
                                },
                                is_selected: true,
                                is_disabled: false,
                            },
                        },
                    ],
                    initial_max_length: 3,
                    toggle_title: '',
                    toggle_initial_title: '',
                    hide_widget: false,
                    is_disabled: false,
                },

            };
        },
    },
    country_currency_mapping: {
        IN: 'INR',
        AE: 'AED',
    },
    country_currency_symbol_mapping: {
        IN: '₹',
        AE: 'AED',
    },
    coupon_info(locale) {
        return {
            title: global.t8[locale].t('COUPON CODE'),
            placeholder_text: global.t8[locale].t('Enter Coupon Code Here'),
            cta_button: global.t8[locale].t('Apply'),
            status: false,
            message: global.t8[locale].t('Please enter a valid coupon'),
            image_url: '',
            code: '',
        };
    },
    coupon_info_vc888(locale) {
        return {
            title: global.t8[locale].t('COUPON CODE'),
            placeholder_text: global.t8[locale].t('Select or Enter Coupon'),
            cta_button: global.t8[locale].t('Select Coupon'.toUpperCase(), 'Select Coupon'),
            apply_cta: global.t8[locale].t('Apply'),
            status: false,
            message: global.t8[locale].t('Please enter a valid coupon'),
            image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/coupon_code.webp',
            code: '',
        };
    },
    wallet_info(locale) {
        return {
            show_add_money: true,
            info: 'Balance: ₹',
            show_wallet: 1,
            title: global.t8[locale].t('DN Wallet'),
            deeplink_text: global.t8[locale].t('Ye kya hai'),
            total_amount: {
                name: global.t8[locale].t('Total Available Balance'),
                value: '₹',
            },
            cash_amount: {
                name: global.t8[locale].t('Cash Balance'),
                value: '₹',
                tooltip_text: global.t8[locale].t('Cash Balance in DN Wallet vo cash amount hai jo aapne khudse DN wallet mein add kiya hai and aapko kisi bhi DN program/initiative se nhi mila hai'),

            },
            reward_amount: {
                name: global.t8[locale].t('DN Reward Cash'),
                value: '₹',
                tooltip_text: global.t8[locale].t('DN Reward Cash vo amount he jo aapne Khelo & Jeeto, Daily Attendance Reward System and other Reward system se jeeta hai app pe. Aap iska kucch part app pe kucch bhi purchase karne ke liye use kar sakte hein'),
                title: global.t8[locale].t('Available Balance ₹'),
                description: global.t8[locale].t('Aap Adhiktam ₹{{reward_amount}} of Reward Cash iss payment ke liye use kar sakte hein'),
            },
        };
    },
    vpa_details(locale) {
        return {
            description: global.t8[locale].t('Kisi bhi bank account se paise transfer karein apne DN Wallet mein.\nAapki account details hain:'),
            details: [
                { name: 'A/c No', value: '' },
                { name: 'IFSC', value: '' },
                { name: 'Name', value: 'Doubtnut' },
            ],
            btn_image_url: 'https://d10lpgp6xz60nq.cloudfront.net/images/payment/wa_icon.webp',
            btn_text: global.t8[locale].t('Share Details'),
            btn_show: true,
            wa_details: '',
        };
    },
    reward_widget_info(locale) {
        return {
            title: global.t8[locale].t('Kya soch rhe hain?'),
            subtitle: global.t8[locale].t('Abhi transaction complete karen or Payen'),
            discount: global.t8[locale].t('% Off'),
            label: global.t8[locale].t('New Price'),
            newAmount: '₹1500',
            oldAmount: '₹2000',
            validityText: global.t8[locale].t('Valid Only for Next'),
            validityTime: 60,
            buttonText: global.t8[locale].t('Continue With Discount'),
        };
    },
    WALLET: {
        hi: 'वॉलेट',
    },
    'NET BANKING': {
        hi: 'नेट बैंकिंग',
    },
    PAYMENT: {
        hi: 'पेमेंट',
    },
    'PAYMENT DETAILS': {
        hi: 'भुगतान विवरण',
    },
    ORIGINAL: {
        hi: 'ओरिजनल',
    },
    DISCOUNT: {
        hi: 'डिस्काउंट',
    },
    'COUPON CODE': {
        hi: 'कूपन कोड',
    },
    COUPON: {
        hi: 'कूपन',
    },
    'DN CASH': {
        hi: 'DN कैश',
    },
    'DN REWARD BALANCE': {
        hi: 'DN रिवार्ड बैलेंस',
    },
    'ENTER/SELECT COUPON': {
        hi: 'कूपन लगाएं या चुने',
    },
    HINT: {
        hi: 'हिंट',
    },
    'DN CASH BALANCE': {
        hi: 'DN कैश बैलेंस',
    },
    'PASANDEEDA VIDHI': {
        hi: 'पसंदीदा विधि',
    },
    'PRICE BREAKUP': {
        hi: 'भुगतान विवरण',
    },
    'DN WALLET': {
        hi: 'DN वॉलेट',
    },
    'FINAL PRICE': {
        hi: 'फाइनल प्राइस',
    },
    'VIEW DETAILS': {
        hi: 'पेमेंट जानकारी',
    },
    'BUY NOW': {
        hi: 'अभी खरीदें',
    },
    'PAY NOW': {
        hi: 'अभी खरीदें',
    },
    'Padhao Aur Kamao': {
        hi: 'पढ़ाओ और कमाओ',
    },
    'WALLET TOP-UP': {
        hi: 'वॉलेट टाॅप-अप',
    },
    'VIEW DN WALLET': {
        hi: 'बैलेंस देखें',
    },
    'VIEW COURSE': {
        hi: 'कोर्स देखें',
    },
    'VIEW INVOICE': {
        hi: 'इनवाॅइस देखें',
    },
    'REFERRAL REWARD': {
        hi: 'रेैफरल रिवार्ड',
    },
    'DAILY ATTENDANCE REWARD': {
        hi: 'डेली अटेन्डेन्स रिवार्ड',
    },
    'TOPIC BOOSTER REWARD': {
        hi: 'टाॅपिक बूस्टर रिवार्ड',
    },
    'KHELO AUR JEETO': {
        hi: 'खेलो और जीतो',
    },
    'DAILY GOAL': {
        hi: 'डेली गोल',
    },
    DNR: {
        hi: 'डीएनआर',
    },
    'ORDER ID': {
        hi: 'ऑर्डर ID',
    },
    BOUNTY: {
        hi: 'बाउंटी',
    },
    'DOUBT VIP PASS': {
        hi: 'डाउट VIP पास',
    },
    'VIEW VIDEO': {
        hi: 'वीडियो देखें',
    },
    'VIEW PDF': {
        hi: 'PDF देखें',
    },
    'TRACK ORDER': {
        hi: 'ट्रैक ऑर्डर',
    },
    'DOUBTNUT PAYMENT': {
        hi: 'Doubtnut पेमेंट',
    },
    'PADHAO AUR KAMAO': {
        hi: 'पढ़ाओ और कमाओ',
    },
    REMOVE: {
        hi: 'हटाएं',
    },
    'ORDER PLACED': {
        hi: 'आपका आर्डर प्लेस हो गया है ',
    },
    SHIPPED: {
        hi: 'आपका आर्डर रास्ते में है ',
    },
    'OUT FOR DELIVERY': {
        hi: 'आज आपका ऑर्डर डेलिवर होजाएगी',
    },
    UNDELIVERED: {
        hi: 'डिलीवरी स्वीकार नहीं हो पायी',
    },
    DELIVERED: {
        hi: 'आपका ऑर्डर डिलीवर होगया है',
    },
    'COURSE ACTIVATION PENDING': {
        hi: 'अपना कोर्स एक्टिवेट करें',
    },
    AAJ: {
        hi: 'आज',
    },
    'DELIVER NAHI HO PAYA': {
        hi: 'डिलीवर नही हो पाया',
    },
    'DELIVER HOGA!': {
        hi: 'डिलीवर हो जाएगा',
    },
    'TAK DELIVER HO JAYEGA!': {
        hi: 'तक डिलीवर हो जाएगा',
    },
    'TRACK MY ORDER': {
        hi: 'अपना ऑर्डर ट्रैक करे ',
    },
    'PAY ON DELIVERY': {
        hi: 'पे ऑन डिलिवरी',
    },
    PAY: {
        hi: 'पे करें',
    },
    'EXPIRING TODAY': {
        hi: 'आज खत्म हो रहा है',
    },
    'EXPIRING TOMORROW': {
        hi: 'कल खत्म हो रहा है',
    },
    'EXPIRED ON': {
        hi: 'समाप्ति तिथि',
    },
    checkout_tooltip_threshold: 2,
    wallet_reward_options: {

        max_amount: 500,
        factor: 1,
    },
    min_limit_percentage_switch_case: 80,
    shopse_emi_min_limit: 3500,
    payu_emi_min_limit: 1000,
    payment_domain: 'https://pay.doubtnut.com',
    upi_app_package: {
        title: 'Eligible UPI Apps',
        list: ['in.amazon.mShop.android.shopping', 'com.google.android.apps.nbu.paisa.user', 'in.org.npci.upiapp', 'com.phonepe.app', 'net.one97.paytm'],
    },
    upi_intent_link: 'upi://pay?pa=##upiId##&pn=Doubtnut&tr=&tn=Doubtnut&am=##amount##&cu=INR&mc=5411',
    bank_transfer_deeplink: 'doubtnutapp://bottom_sheet_widget?widget_type=widget_vpa&title=Bank Transfer&show_close_btn=false',
    upi_offline_deeplink: 'doubtnutapp://bottom_sheet_widget?widget_type=widget_123_pay&title=Call 08045163666&show_close_btn=false',
    fintech_activation_expert_ids: [20260, 20261, 20262, 19934, 19890, 19172, 14547, '20260', '20261', '20262', '19934', '19890', '19172', '14547'],
};
