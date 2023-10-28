/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const OlympiadMysql = require('../../../modules/mysql/olympiad');
const PackageContainer = require('../../../modules/containers/package');
const { sendError, sendSuccess } = require('../../v1/olympiad/olympiad.helper');
const OlympiadData = require('../../../data/olympiad');
const TrialHelper = require('../../helpers/trial');
const CourseMysql = require('../../../modules/mysql/course');
const Utility = require('../../../modules/utility');
const OlympiadHelper = require('./olympiad.helper');

const packageMapping = process.env.NODE_ENV === 'production' ? OlympiadData.classPackageMapping : OlympiadData.testClassPackageMapping;
const assortmentList = process.env.NODE_ENV === 'production' ? OlympiadData.prodAssortment : OlympiadData.testAssortment;

async function getDetails(req, res, next) {
    try {
        const config = req.app.get('config');
        const db = req.app.get('db');

        const { student_id: studentId, locale } = req.user;
        const { is_web: isWeb, params } = req.query;

        let { type, id } = req.query;

        if (type === 'claim_trial') {
            return await TrialHelper.giveTrial(req, res, next);
        }

        if (isWeb) {
            if (!params) {
                return sendError(res, 401, 'invalid username');
            }
            const paramsParsed = JSON.parse(OlympiadHelper.decrypt(params));
            ({ type, id } = paramsParsed);
            if (!type || !id) {
                return sendError(res, 401, 'invalid username');
            }
        }

        const assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudentByList(db.mysql.read, studentId, assortmentList);
        let respData;

        // if the student has already paid for the course on ht's platform
        if (type === 'paid_user_from_ht_website' && id) {
            const details = await OlympiadHelper.getUserDetailsFromHTServer(config, id);
            const {
                user_exists: userExists, email, class: studentClass, school, phone, state, district, name,
            } = details.data.data;
            if (!userExists) {
                return sendError(res, 401, 'invalid student_id');
            }
            respData = {
                header_title: locale !== 'hi' ? 'Hindustan Times Olympiad 2022' : 'हिंदुस्तान ओलंपियाड 2022',
                highlight_color: '#eb532c',
                finish_activity: false,
                top_container: {
                    title_one: locale !== 'hi' ? 'Olympiad ki taiyaari karein Doubtnut ke saath' : 'ओलंपियाड की तैयारी करें डाउटनट के साथ',
                    title_one_text_size: '18',
                    title_one_text_color: '#2f2f2f',
                    image_url: `${config.staticCDN}engagement_framework/86E1A29E-119E-0DEB-02F3-CEA4B74D1CD0.webp`,
                    bg_color: '#fff1ed',
                },
                details_container: {
                    title_one: locale !== 'hi' ? 'HT Olympiad ke liye aapki registration details' : 'एचटी ओलंपियाड के लिए आपकी रजिस्ट्रेशन जानकारी',
                    title_one_text_size: '16',
                    title_one_text_color: '#2f2f2f',
                    title_two: '',
                    title_two_text_size: '16',
                    title_two_text_color: '#2f2f2f',
                    label_text_size: '14',
                    label_text_color: '#969696',
                    value_text_size: '16',
                    value_text_color: '#2f2f2f',
                    hint_text_color: '#cbcbcb',
                    label_edit_text_size: '12',
                    label_edit_text_color: '#7f7f7f',
                    value_edit_text_size: '14',
                    value_edit_text_color: '#2f2f2f',

                    items: [
                        {
                            key: 'name',
                            label: locale === 'hi' ? 'स्टूडेंट का नाम' : 'Student ka naam',
                            value: name,
                            is_editable: false,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'स्टूडेंट का नाम टाइप करें' : 'Student ka naam type karein',
                        },
                        {
                            key: 'class',
                            label: locale === 'hi' ? 'आपकी कक्षा' : 'Aapki class',
                            value: studentClass,
                            is_editable: false,
                            input_type: 3,
                            max_length: 2,
                            hint: locale === 'hi' ? 'आपकी कक्षा टाइप करें' : 'Aapki class type karein',
                        },
                        {
                            key: 'mobile',
                            label: locale === 'hi' ? 'माता-पिता का फ़ोन' : 'Parents ka phone number',
                            value: phone,
                            is_editable: false,
                            hint: locale === 'hi' ? 'माता-पिता का फ़ोन टाइप करें' : 'Parents ka phone number type karein',
                            input_type: 3,
                            max_length: 10,

                        },
                        {
                            key: 'email',
                            label: locale === 'hi' ? 'माता-पिता का ईमेल' : 'Parents ka Email Address',
                            value: email,
                            is_editable: false,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'माता-पिता का ईमेल टाइप करें' : 'Parents ka Email Address type karein',
                        },
                        {
                            key: 'school_name',
                            label: locale === 'hi' ? 'स्कूल का नाम' : 'School ka naam',
                            value: school,
                            is_editable: false,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'स्कूल का नाम टाइप करें' : 'School ka naam type karein',
                        },
                        {
                            key: 'state',
                            label: locale === 'hi' ? 'स्टेट' : 'State',
                            value: state,
                            is_editable: false,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'स्टेट टाइप करें' : 'State type karein',
                        },
                        {
                            key: 'district',
                            label: locale === 'hi' ? 'जिला' : 'District',
                            value: district,
                            is_editable: false,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'जिला टाइप करें' : 'District type karein',
                        },
                        {
                            key: 'username',
                            label: 'Username',
                            value: id,
                            is_editable: false,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'Username टाइप करें' : 'Username type karein',
                        },
                    ],
                },
                know_more: {
                    title_one: locale === 'hi' ? 'हिंदुस्तान ओलंपियाड के बारे में और जानें >>' : 'Hindustan Times Olympiad ke baare mein aur jaanein >>',
                    title_text_size: '14',
                    title_text_color: '#eb532c',
                    ...(!Number(isWeb) && { deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in' }),
                    ...(Number(isWeb) && { link: 'https://www.hindustanolympiad.in/' }),
                },
                term_and_condition: {
                    title_one: locale === 'hi' ? 'कृपया ओलंपियाड रजिस्ट्रेशन से संबंधित सभी जानकारी कन्फर्म कर, डाउटनट पर रजिस्टर करें' : 'Olympiad registration se sambandhit sabhi details confirm kar, Doubtnut par register karein',
                    title_text_size: '14',
                    title_text_color: '#2f2f2f',
                    deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in',
                },
                cta: {
                    title_one: 'Register on Doubtnut',
                    title_text_size: '14',
                    title_text_color: '#ffffff',
                    bg_color: '#eb532c',
                    deeplink: '',
                },

                extra_params: {},
            };
            return sendSuccess(res, respData);
        }

        if (assortmentDetails.length >= 1) {
            respData = {
                ...(!Number(isWeb) && { deeplink: `doubtnutapp://course_details?id=${assortmentDetails[0].assortment_id}` }),
                ...(Number(isWeb) && { assortment_id: assortmentDetails[0].assortment_id }),
                finish_activity: true,
            };
            return sendSuccess(res, respData);
        }

        const registrationData = await OlympiadMysql.getRegisteredStudentByStudentId(db.mysql.read, studentId);
        if (registrationData.length > 0) {
            const {
                name, email, mobile: phone, state, district, class: studentClass, school_name: school, username,
            } = registrationData[0];
            respData = {
                header_title: locale !== 'hi' ? 'Hindustan Times Olympiad 2022' : 'हिंदुस्तान ओलंपियाड 2022',
                highlight_color: '#eb532c',
                finish_activity: false,
                top_container: {
                    title_one: locale !== 'hi' ? 'Olympiad ki taiyaari karein Doubtnut ke saath' : 'ओलंपियाड की तैयारी करें डाउटनट के साथ',
                    title_one_text_size: '18',
                    title_one_text_color: '#2f2f2f',
                    image_url: `${config.staticCDN}engagement_framework/86E1A29E-119E-0DEB-02F3-CEA4B74D1CD0.webp`,
                    bg_color: '#fff1ed',
                },
                details_container: {
                    title_one: locale === 'hi' ? 'डाउटनट ऐप पर रजिस्टर कर अपने ओलंपियाड की तैयारी करें' : 'Doubtnut App par register kar apne olympiad exam ki taiyari karein',
                    title_one_text_size: '16',
                    title_one_text_color: '#2f2f2f',
                    title_two: locale === 'hi' ? 'प्रीमियम कोर्स का एक्सेस पाने के लिए खुद को रजिस्टर कर अपने ओलंपियाड की तैयारी करें' : 'Premium course ka access pane k lie khud ko register kar taiyari shuru karein',
                    title_two_text_size: '16',
                    title_two_text_color: '#2f2f2f',
                    label_text_size: '14',
                    label_text_color: '#969696',
                    value_text_size: '16',
                    value_text_color: '#2f2f2f',
                    hint_text_color: '#cbcbcb',
                    label_edit_text_size: '12',
                    label_edit_text_color: '#7f7f7f',
                    value_edit_text_size: '14',
                    value_edit_text_color: '#2f2f2f',

                    items: [
                        {
                            key: 'name',
                            label: locale === 'hi' ? 'स्टूडेंट का नाम' : 'Student ka naam',
                            value: name,
                            is_editable: true,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'स्टूडेंट का नाम टाइप करें' : 'Student ka naam type karein',
                        },
                        {
                            key: 'class',
                            label: locale === 'hi' ? 'आपकी कक्षा' : 'Aapki class',
                            value: studentClass,
                            is_editable: true,
                            input_type: 3,
                            max_length: 2,
                            hint: locale === 'hi' ? 'आपकी कक्षा टाइप करें' : 'Aapki class type karein',
                        },
                        {
                            key: 'mobile',
                            label: locale === 'hi' ? 'माता-पिता का फ़ोन' : 'Parents ka phone number',
                            value: phone,
                            is_editable: true,
                            hint: locale === 'hi' ? 'माता-पिता का फ़ोन टाइप करें' : 'Parents ka phone number type karein',
                            input_type: 3,
                            max_length: 10,

                        },
                        {
                            key: 'email',
                            label: locale === 'hi' ? 'माता-पिता का ईमेल' : 'Parents ka Email Address',
                            value: email,
                            is_editable: true,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'माता-पिता का ईमेल टाइप करें' : 'Parents ka Email Address type karein',
                        },
                        {
                            key: 'school_name',
                            label: locale === 'hi' ? 'स्कूल का नाम' : 'School ka naam',
                            value: school,
                            is_editable: true,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'स्कूल का नाम टाइप करें' : 'School ka naam type karein',
                        },
                        {
                            key: 'state',
                            label: locale === 'hi' ? 'स्टेट' : 'State',
                            value: state,
                            is_editable: true,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'स्टेट टाइप करें' : 'State type karein',
                        },
                        {
                            key: 'district',
                            label: locale === 'hi' ? 'जिला' : 'District',
                            value: district,
                            is_editable: true,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'जिला टाइप करें' : 'District type karein',
                        },
                        {
                            key: 'username',
                            label: 'Username',
                            value: username,
                            is_editable: true,
                            input_type: 524432,
                            hint: locale === 'hi' ? 'Username टाइप करें' : 'Username type karein',
                        },
                    ],
                },
                know_more: {
                    title_one: locale === 'hi' ? 'हिंदुस्तान ओलंपियाड के बारे में और जानें >>' : 'Hindustan Times Olympiad ke baare mein aur jaanein >>',
                    title_text_size: '14',
                    title_text_color: '#eb532c',
                    ...(!Number(isWeb) && { deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in' }),
                    ...(Number(isWeb) && { link: 'https://www.hindustanolympiad.in/' }),
                },
                cta: {
                    title_one: 'Register on Doubtnut',
                    title_text_size: '14',
                    title_text_color: '#ffffff',
                    bg_color: '#eb532c',
                    deeplink: '',
                },
                term_and_condition: {
                    title_one: "I agree to <font color='#eb532c'>Terms and Conditions</font>",
                    title_text_size: '14',
                    title_text_color: '#2f2f2f',
                    deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in',
                },
                cta_info: {
                    title_one: locale === 'hi' ? '"रजिस्टर" पर क्लिक करने पर आप पेमेंट पेज पर पहुंच जाएंगे, जहां आपको ओलंपियाड के रजिस्ट्रेशन के लिए हिंदुस्तान टाइम्स को रु 200 का पेमेंट करना होगा।' : '"Register" par click karne par aap Payment page par jayenge, jahan aapko Olympiad ke registration ke liye Hindustan Times ko Rs 200 ka payment karna hoga.',
                    title_one_text_size: '14',
                    title_one_text_color: '#54138a',
                    bg_color: '#f3e4ff',
                },
                // ...(!Number(isWeb) && { deeplink: `doubtnutapp://course_details?id=${assortmentDetails[0].assortment_id}` }),
                ...(Number(isWeb) && { assortment_id: assortmentDetails[0].assortment_id }),

                extra_params: {},
            };
            return sendSuccess(res, respData);
        }

        if (Number(isWeb)) {
            return sendError(res, 401, 'invalid token');
        }

        respData = {
            header_title: locale !== 'hi' ? 'Hindustan Times Olympiad 2022' : 'हिंदुस्तान ओलंपियाड 2022',
            highlight_color: '#eb532c',
            finish_activity: false,
            top_container: {
                title_one: locale !== 'hi' ? 'Olympiad ki taiyaari karein Doubtnut ke saath' : 'ओलंपियाड की तैयारी करें डाउटनट के साथ',
                title_one_text_size: '18',
                title_one_text_color: '#2f2f2f',
                image_url: `${config.staticCDN}engagement_framework/86E1A29E-119E-0DEB-02F3-CEA4B74D1CD0.webp`,
                bg_color: '#fff1ed',
            },
            details_container: {
                title_one: locale === 'hi' ? 'डाउटनट ऐप पर रजिस्टर कर अपने ओलंपियाड की तैयारी करें' : 'Doubtnut App par register kar apne olympiad exam ki taiyari karein',
                title_one_text_size: '16',
                title_one_text_color: '#2f2f2f',
                title_two: locale === 'hi' ? 'प्रीमियम कोर्स का एक्सेस पाने के लिए खुद को रजिस्टर कर अपने ओलंपियाड की तैयारी करें' : 'Premium course ka access pane k lie khud ko register kar taiyari shuru karein',
                title_two_text_color: '#2f2f2f',
                label_text_size: '14',
                label_text_color: '#969696',
                value_text_size: '16',
                value_text_color: '#2f2f2f',
                hint_text_color: '#cbcbcb',
                label_edit_text_size: '12',
                label_edit_text_color: '#7f7f7f',
                value_edit_text_size: '14',
                value_edit_text_color: '#2f2f2f',

                items: [
                    {
                        key: 'name',
                        label: locale === 'hi' ? 'स्टूडेंट का नाम' : 'Student ka naam',
                        value: '',
                        is_editable: true,
                        input_type: 524432,
                        hint: locale === 'hi' ? 'स्टूडेंट का नाम टाइप करें' : 'Student ka naam type karein',
                    },
                    {
                        key: 'class',
                        label: locale === 'hi' ? 'आपकी कक्षा' : 'Aapki class',
                        value: '',
                        is_editable: true,
                        input_type: 3,
                        max_length: 2,
                        hint: locale === 'hi' ? 'आपकी कक्षा टाइप करें' : 'Aapki class type karein',
                    },
                    {
                        key: 'mobile',
                        label: locale === 'hi' ? 'माता-पिता का फ़ोन' : 'Parents ka phone number',
                        value: '',
                        is_editable: true,
                        hint: locale === 'hi' ? 'माता-पिता का फ़ोन टाइप करें' : 'Parents ka phone number type karein',
                        input_type: 3,
                        max_length: 10,

                    },
                    {
                        key: 'email',
                        label: locale === 'hi' ? 'माता-पिता का ईमेल' : 'Parents ka Email Address',
                        value: '',
                        is_editable: true,
                        input_type: 524432,
                        hint: locale === 'hi' ? 'माता-पिता का ईमेल टाइप करें' : 'Parents ka Email Address type karein',
                    },
                    {
                        key: 'school_name',
                        label: locale === 'hi' ? 'स्कूल का नाम' : 'School ka naam',
                        value: '',
                        is_editable: true,
                        input_type: 524432,
                        hint: locale === 'hi' ? 'स्कूल का नाम टाइप करें' : 'School ka naam type karein',
                    },
                    {
                        key: 'state',
                        label: locale === 'hi' ? 'स्टेट' : 'State',
                        value: '',
                        is_editable: true,
                        input_type: 524432,
                        hint: locale === 'hi' ? 'स्टेट टाइप करें' : 'State type karein',
                    },
                    {
                        key: 'district',
                        label: locale === 'hi' ? 'जिला' : 'District',
                        value: '',
                        is_editable: true,
                        input_type: 524432,
                        hint: locale === 'hi' ? 'जिला टाइप करें' : 'District type karein',
                    },
                    {
                        key: 'username',
                        label: 'Username',
                        value: '',
                        is_editable: true,
                        input_type: 524432,
                        hint: locale === 'hi' ? 'Username टाइप करें' : 'Username type karein',
                    },
                ],
            },
            term_and_condition: {
                title_one: "I agree to <font color='#eb532c'>Terms and Conditions</font>",
                title_text_size: '14',
                title_text_color: '#2f2f2f',
                deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in',
            },
            know_more: {
                title_one: locale === 'hi' ? 'हिंदुस्तान ओलंपियाड के बारे में और जानें >>' : 'Hindustan Times Olympiad ke baare mein aur jaanein >>',
                title_text_size: '14',
                title_text_color: '#eb532c',
                ...(!Number(isWeb) && { deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in' }),
                ...(Number(isWeb) && { link: 'https://www.hindustanolympiad.in/' }),
            },
            cta: {
                title_one: 'Register on Doubtnut',
                title_text_size: '14',
                title_text_color: '#ffffff',
                bg_color: '#eb532c',
            },
            cta_info: {
                title_one: locale === 'hi' ? '"रजिस्टर" पर क्लिक करने पर आप पेमेंट पेज पर पहुंच जाएंगे, जहां आपको ओलंपियाड के रजिस्ट्रेशन के लिए हिंदुस्तान टाइम्स को रु 200 का पेमेंट करना होगा।' : '"Register" par click karne par aap Payment page par jayenge, jahan aapko Olympiad ke registration ke liye Hindustan Times ko Rs 200 ka payment karna hoga.',
                title_one_text_size: '14',
                title_one_text_color: '#54138a',
                bg_color: '#f3e4ff',
            },
            extra_params: {},
        };
        return sendSuccess(res, respData);
    } catch (err) {
        return next({ err });
    }
}

async function register(req, res, next) {
    try {
        const { student_id: studentId } = req.user;
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { payload, type, id } = req.body;

        if (type === 'paid_user_from_ht_website' && id) {
            const details = await OlympiadHelper.getUserDetailsFromHTServer(config, id);
            const {
                user_exists: userExists,
                email,
                class: studentClassHt,
                school,
                phone,
                state,
                district,
                name,
                payment_status: paymentStatus,
            } = details.data.data;
            if (!userExists || !paymentStatus) {
                return sendError(res, 401, `invalid username, user_exists: ${userExists} & payment_status: ${paymentStatus}`);
            }
            const studentClass = studentClassHt.split(' ')[0];
            const studentData = await OlympiadMysql.getRegisteredStudentByUsername(db.mysql.read, id);
            if (studentData.length === 0) {
                await PackageContainer.createSubscriptionEntryForStudentIdByPackageId(db, studentId, packageMapping[studentClass], 0);

                await OlympiadHelper.registerNewUser(db, {
                    username: id, name, email, phone, class: studentClass, state, district, school,
                }, studentId, false);
            }
            const data = {
                deeplink: 'doubtnutapp://olympiad/success',
            };
            return sendSuccess(res, data);
        }

        const params = OlympiadHelper.parseInputPayload(payload);

        const {
            district, name, mobile, school_name: schoolName, state, class: studentClass, email, username,
        } = params;
        let errorMessage = '';
        if (!state || !Object.keys(OlympiadData.stateAbbreviationMapping).includes(state.toUpperCase())) {
            errorMessage = 'Invalid State';
        } else if (_.isNaN(studentClass) || studentClass < 1 || studentClass > 12) {
            errorMessage = 'Invalid Class';
        } else if (!OlympiadHelper.validateEmail(email)) {
            errorMessage = 'Invalid Email';
        } else if (!mobile || mobile.length !== 10 || _.isNaN(mobile)) {
            errorMessage = 'Invalid Mobile';
        } else if (!schoolName) {
            errorMessage = 'Enter School Name';
        } else if (OlympiadHelper.checkIfAlphaNumericWithSpace(schoolName)) {
            errorMessage = 'School Name should not have special characters';
        } else if (!district) {
            errorMessage = 'Enter District Name';
        } else if (OlympiadHelper.checkIfAlphaNumericWithSpace(district)) {
            errorMessage = 'District should not have special characters';
        } else if (!username) {
            errorMessage = 'Enter username';
        } else if (username.length < 6) {
            errorMessage = 'Username should be atleast 6 characters long';
        } else if (OlympiadHelper.checkIfAlphaNumericWithoutSpace(username)) {
            errorMessage = 'Username should not have special characters';
        } else {
            const details = await OlympiadHelper.getUserDetailsFromHTServer(config, username);
            const { user_exists: userExists } = details.data.data;
            if (userExists) {
                errorMessage = 'Username not available';
            }
            const userData = await OlympiadMysql.getRegisteredStudentByUsername(db.mysql.read, username);
            if (userData.length && userData[0].student_id !== studentId) {
                errorMessage = 'Username not available';
            }
        }
        if (errorMessage) {
            return next({ data: { error_message: errorMessage } });
        }
        const registrationData = await OlympiadMysql.getRegisteredStudentByUsername(db.mysql.read, username);
        const userData = {
            username, name, email, phone: mobile, class: studentClass, state: OlympiadData.stateAbbreviationMapping[state.toUpperCase()], district, school: schoolName,
        };
        if (registrationData.length) {
            await OlympiadHelper.updateRegisteredUser(db, userData, studentId, true);
        } else {
            await OlympiadHelper.registerNewUser(db, userData, studentId, true);
        }
        const variantData = await CourseMysql.getVariantsByPackage(db.mysql.read, packageMapping[studentClass]);
        const data = {
            deeplink: `doubtnutapp://vip?variant_id=${variantData[0].id}`,
            finish_activity: true,
        };
        return sendSuccess(res, data);
    } catch (err) {
        return next({ err });
    }
}

async function getSuccess(req, res, next) {
    try {
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { student_id: studentId, locale } = req.user;
        const { is_web: isWeb, params } = req.query;
        let type;
        let id;
        let assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudentByList(db.mysql.read, studentId, assortmentList);

        if (Number(isWeb)) {
            if (!params) {
                return sendError(res, 401, 'invalid username');
            }
            const paramsParsed = JSON.parse(OlympiadHelper.decrypt(params));
            ({ type, id } = paramsParsed);
            if (!type || !id) {
                return sendError(res, 401, 'invalid username');
            }
            const userData = await OlympiadMysql.getRegisteredStudentByUsername(db.mysql.read, id);
            if (type === 'paid_user_from_ht_website' && id && userData.length === 0) {
                const details = await OlympiadHelper.getUserDetailsFromHTServer(config, id);
                const {
                    user_exists: userExists, email, class: studentClassHt, school, phone, state, district, name,
                } = details.data.data;
                if (!userExists) {
                    return sendError(res, 401, 'invalid username');
                }
                const studentClass = studentClassHt.split(' ')[0];
                await PackageContainer.createSubscriptionEntryForStudentIdByPackageId(db, studentId, packageMapping[studentClass], 0);

                await OlympiadHelper.registerNewUser(db, {
                    username: id, name, email, phone, class: studentClassHt, state, district, school,
                }, studentId, true);
            }
        }
        if (Number(isWeb)) {
            assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudentByList(db.mysql.read, studentId, assortmentList);
        }
        const data = {
            header_title: locale === 'hi' ? 'हिंदुस्तान ओलंपियाड 2022' : 'Hindustan Times Olympiad 2022',
            message_text_size: '16',
            message_text_color: '#2f2f2f',
            success_image_url: `${config.staticCDN}engagement_framework/7CD5021D-4027-01A0-B5FB-A03CBCDFDDAB.webp`,
            image_url: `${config.staticCDN}engagement_framework/86E1A29E-119E-0DEB-02F3-CEA4B74D1CD0.webp`,
            message: locale === 'hi' ? 'बधाई हो, आपका रजिस्ट्रेशन सफलतापूर्वक पूरा हो गया है! \nहिंदुस्तान टाइम्स की वेबसाइट पर ही परीक्षा कंडक्ट की जाएगी।\nलॉगिन की जानकारी शीघ्र ही एसएमएस द्वारा आपको दी जाएगी।'
                : 'Congratulations, Aapka registration successfully pura ho gaya hai!\n Exam Hindustan Times ki website par hi conduct kiya jayega. \nAapki login details SMS ke through jald aapse share kii jayengi. \nScreen reader support enabled.',
            auto_redirect: 5,
            cta: {
                title_one: locale === 'hi' ? 'ओलंपियाड प्रिपरेटरी किट, डाउटनट पर चेक करें' : 'Olympiad Preparatory Kit, Doubtnut par check karein',
                title_text_size: '14',
                title_text_color: '#ffffff',
                bg_color: '#eb532c',
                ...(!Number(isWeb) && { deeplink: `doubtnutapp://course_details?id=${assortmentDetails[0].assortment_id}` }),
                ...(Number(isWeb) && { assortment_id: assortmentDetails[0].assortment_id }),
            },
        };
        return sendSuccess(res, data);
    } catch (err) {
        return next({ err });
    }
}

async function getUserDetails(req, res, next) {
    try {
        const { username } = req.query;
        const db = req.app.get('db');

        const data = await OlympiadMysql.getRegisteredStudentByUsername(db.mysql.read, username);
        if (data.length === 0) {
            const respData = {
                user_exists: 0,
            };
            return sendSuccess(res, respData);
        }
        const { student_id: studentId } = data[0];
        const assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudentByList(db.mysql.read, studentId, assortmentList);

        const respData = {
            user_exists: data.length > 0,
            ...(data.length > 0 && {
                name: data[0].name,
                email: data[0].email,
                phone: data[0].mobile,
                state: data[0].state,
                district: data[0].district,
                school: data[0].school_name,
                class: data[0].class,
                registered_on_doubtnut: true,
                is_app_downloaded: Boolean(data[0].is_registered_dn),
                payment_status: assortmentDetails.length >= 1,
            }
            ),
        };
        return sendSuccess(res, respData);
    } catch (err) {
        return next({ err });
    }
}

async function addUsers(req, res, next) {
    try {
        const db = req.app.get('db');

        if (!OlympiadHelper.isHTOfficialStudentId(req.user.student_id)) {
            return sendError(res, 403, 'Access Forbidden');
        }

        const userData = req.body.users;
        let newEntryCount = 0;
        let duplicateEntryCount = 0;

        for (const user of userData) {
            let isAlreadyRegistered = true;
            let student = await OlympiadMysql.isStudentRegistered(db.mysql.read, user.phone);
            if (!student.length) {
                // make entry in students table
                const name = user.name.split(' ');
                const studentData = await OlympiadMysql.addNewStudent(db.mysql.write, {
                    studentFname: name.length > 0 ? name[0] : '',
                    studentLname: name.length > 1 ? name[1] : '',
                    schoolName: user.school,
                    mobile: user.phone,
                    studentClass: user.class.split(' ')[0],
                    username: user.username,
                });
                student = [{ student_id: studentData.insertId }];
                isAlreadyRegistered = false;
            }
            const studentId = student[0].student_id;
            const htUser = await OlympiadHelper.registerNewUser(db, user, studentId, isAlreadyRegistered);

            if (htUser && htUser.code === 'ER_DUP_ENTRY') {
                duplicateEntryCount++;
            }

            if (htUser && htUser.insertId) {
                newEntryCount++;
            }
        }
        return sendSuccess(res, { entries_received: userData.length, entries_registered: newEntryCount, duplicate_entries: duplicateEntryCount });
    } catch (err) {
        return next({ err });
    }
}

async function getUserLinks(req, res, next) {
    try {
        const config = req.app.get('config');
        const { username } = req.query;
        const paramsEncrypted = OlympiadHelper.encrypt(JSON.stringify({
            type: 'paid_user_from_ht_website',
            id: username,
        }));
        const data = {
            web_link: `https://www.doubtnut.com/ht-olympiad/${paramsEncrypted}`,
            android_link: (await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'HT', 'OLYMPIAD', `doubtnutapp://olympiad-register?type=paid_user_from_ht_website&id=${username}`)).url,
        };
        return sendSuccess(res, data);
    } catch (err) {
        return next({ err });
    }
}

module.exports = {
    getDetails,
    register,
    getSuccess,
    getUserDetails,
    addUsers,
    getUserLinks,
};
