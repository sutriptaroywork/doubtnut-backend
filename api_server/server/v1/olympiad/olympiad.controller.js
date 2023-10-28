/* eslint-disable no-restricted-globals */
/* eslint-disable no-await-in-loop */
const axios = require('axios');
const { ValidationError } = require('express-validation');
const _ = require('lodash');
const crypto = require('crypto');
const OlympiadMysql = require('../../../modules/mysql/olympiad');
const PackageContainer = require('../../../modules/containers/package');
const Utility = require('../../../modules/utility');
const { sendError } = require('./olympiad.helper');
const {
    stateAbbreviationMapping, classPackageMapping, prodAPI: htApi, paramKey,
} = require('../../../data/olympiad');
const TrialHelper = require('../../helpers/trial');
const CourseMysql = require('../../../modules/mysql/course');
const OlympiadControllerV2 = require('../../v2/olympiad/olympiad.controller');

const ENCRYPTION_KEY = crypto.scryptSync(paramKey, 'doubtnut', 32);

const algorithm = 'aes-256-ctr';

const IV_LENGTH = 16;

function encrypt(text) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(text) {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

function checkIfAlphaNumericWithSpace(str) {
    return _.isNull(str.match(/^[\w\-\s]+$/));
}

function checkIfAlphaNumericWithoutSpace(str) {
    return _.isNull(str.match(/^[0-9A-Za-z]+$/));
}
async function getUserDetailsFromHTServer(config, username) {
    return axios.post(htApi, { username },
        {
            headers: {
                authorization: config.ht_olympiad_auth,
            },
        });
}
async function getDetails(req, res, next) {
    try {
        const { student_id: studentId, locale } = req.user;
        const config = req.app.get('config');
        const db = req.app.get('db');
        const { is_web: isWeb, params } = req.query;
        let {
            type, id,
        } = req.query;
        if (type === 'claim_trial') {
            return await TrialHelper.giveTrial(req, res, next);
        }
        if (isWeb) {
            if (!params) {
                return sendError(res, 401, 'invalid username');
            }
            const paramsParsed = JSON.parse(decrypt(params));
            ({ type, id } = paramsParsed);
            if (!type || !id) {
                return sendError(res, 401, 'invalid username');
            }
        }
        // TODO: check if user already registered on the app
        const assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudent(db.mysql.read, studentId);
        let respData;

        // TODO: add call to the HT server
        // if the student has already paid for the course on ht's platform
        if (type === 'paid_user_from_ht_website' && id) {
            const details = await getUserDetailsFromHTServer(config, id);
            const {
                user_exists: userExists, email, class: studentClass, school, phone, state, district, name,
            } = details.data.data;
            if (!userExists) {
                throw new ValidationError('invalid student id');
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
                    // mobile, user_exists: userExists, email, class: studentClass, school, phone, state, district, name,

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
                    // TODO: add hindustan times link here.
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
                    // TODO: add deeplink here
                    deeplink: '',
                },
                // ...(!Number(isWeb) && { deeplink: `doubtnutapp://course_details?id=${assortmentDetails[0].assortment_id}` }),
                // ...(Number(isWeb) && assortmentDetails[0] && { assortment_id: assortmentDetails[0].assortment_id }),

                extra_params: {
                },
            };
            return next({ data: respData });
        }

        if (assortmentDetails.length >= 1) {
            respData = {
                ...(!Number(isWeb) && { deeplink: `doubtnutapp://course_details?id=${assortmentDetails[0].assortment_id}` }),
                ...(Number(isWeb) && { assortment_id: assortmentDetails[0].assortment_id }),
                finish_activity: true,
            };
            return next({ data: respData });
        }
        const registrationData = await OlympiadMysql.getRegistrationData(db.mysql.read, studentId);
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
                    // mobile, user_exists: userExists, email, class: studentClass, school, phone, state, district, name,

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
                    // TODO: add hindustan times link here.
                    ...(!Number(isWeb) && { deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in' }),
                    ...(Number(isWeb) && { link: 'https://www.hindustanolympiad.in/' }),
                },
                cta: {
                    title_one: 'Register on Doubtnut',
                    title_text_size: '14',
                    title_text_color: '#ffffff',
                    bg_color: '#eb532c',
                    // TODO: add deeplink here
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

                extra_params: {
                },
            };
            return next({ data: respData });
        }
        if (Number(isWeb)) {
            throw new ValidationError('invalid token');
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
                // mobile, user_exists: userExists, email, class: studentClass, school, phone, state, district, name,

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
                // TODO: add hindustan times link here.
                ...(!Number(isWeb) && { deeplink: 'doubtnutapp://web_view?chrome_custom_tab=true&url=https://www.hindustanolympiad.in' }),
                ...(Number(isWeb) && { link: 'https://www.hindustanolympiad.in/' }),
            },
            cta: {
                title_one: 'Register on Doubtnut',
                title_text_size: '14',
                title_text_color: '#ffffff',
                bg_color: '#eb532c',
                // TODO: add deeplink here
            },
            cta_info: {
                title_one: locale === 'hi' ? '"रजिस्टर" पर क्लिक करने पर आप पेमेंट पेज पर पहुंच जाएंगे, जहां आपको ओलंपियाड के रजिस्ट्रेशन के लिए हिंदुस्तान टाइम्स को रु 200 का पेमेंट करना होगा।' : '"Register" par click karne par aap Payment page par jayenge, jahan aapko Olympiad ke registration ke liye Hindustan Times ko Rs 200 ka payment karna hoga.',
                title_one_text_size: '14',
                title_one_text_color: '#54138a',
                bg_color: '#f3e4ff',
            },
            extra_params: {},
        };
        return next({ data: respData });
    } catch (err) {
        return next({ err });
    }
}

function validateEmail(email) {
    // const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    // const re = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;
    const re = /^[a-z0-9][a-z0-9-_\.]+@([a-z]|[a-z0-9]?[a-z0-9-]+[a-z0-9])\.[a-z0-9]{2,10}(?:\.[a-z]{2,10})?$/;
    return re.test(email);
}
async function register(req, res, next) {
    try {
        const { student_id: studentId } = req.user;
        const db = req.app.get('db');
        const config = req.app.get('config');
        const { payload, type, id } = req.body;
        const params = {};
        //
        if (type === 'paid_user_from_ht_website' && id) {
            const details = await getUserDetailsFromHTServer(config, id);
            const {
                user_exists: userExists, email, class: studentClassHt, school, phone, state, district, name, payment_status: paymentStatus,
            } = details.data.data;
            if (!userExists || !paymentStatus) {
                throw new ValidationError('invalid username');
            }
            const studentClass = studentClassHt.split(' ')[0];
            const studentData = await OlympiadMysql.getStudent(db.mysql.read, id);
            if (studentData.length === 0) {
                await PackageContainer.createSubscriptionEntryForStudentIdByPackageId(db, studentId, classPackageMapping[studentClass], 0);

                await OlympiadMysql.registerOlympiad({
                    database: db.mysql.write, name, email, mobile: phone, studentClass, state, district, schoolName: school, username: id, studentId, registeredOnDoubtnut: 0,
                });
            }
            const data = {
                deeplink: 'doubtnutapp://olympiad/success',
            };
            return next({ data });
        }
        payload.replace('}', '').replace('{', '').split(',').map((item) => item.split('=').map((e) => e.trim()))
            .forEach((pair) => { params[pair[0]] = pair[1]; });
        const {
            district, name, mobile, school_name: schoolName, state, class: studentClass, email, username,
        } = params;
        let errorMessage = '';
        if (!state || !Object.keys(stateAbbreviationMapping).includes(state.toUpperCase())) {
            errorMessage = 'Invalid State';
        } else if (isNaN(studentClass) || studentClass < 1 || studentClass > 12) {
            errorMessage = 'Invalid Class';
        } else if (!validateEmail(email)) {
            errorMessage = 'Invalid Email';
        } else if (!mobile || mobile.length !== 10 || isNaN(mobile)) {
            errorMessage = 'Invalid Mobile';
        } else if (!schoolName) {
            errorMessage = 'Enter School Name';
        } else if (checkIfAlphaNumericWithSpace(schoolName)) {
            errorMessage = 'School Name should not have special characters';
        } else if (!district) {
            errorMessage = 'Enter District Name';
        } else if (checkIfAlphaNumericWithSpace(district)) {
            errorMessage = 'District should not have special characters';
        } else if (!username) {
            errorMessage = 'Enter username';
        } else if (username.length < 6) {
            errorMessage = 'Username should be atleast 6 characters long';
        } else if (checkIfAlphaNumericWithoutSpace(username)) {
            errorMessage = 'Username should not have special characters';
        } else {
            const details = await getUserDetailsFromHTServer(config, username);
            const { user_exists: userExists } = details.data.data;
            if (userExists) {
                errorMessage = 'Username not available';
            }
            const userData = await OlympiadMysql.getStudent(db.mysql.read, username);
            if (userData.length && userData[0].student_id !== studentId) {
                errorMessage = 'Username not available';
            }
        }
        if (errorMessage) {
            return next({ data: { error_message: errorMessage } });
        }
        const registrationData = await OlympiadMysql.getRegistrationData(db.mysql.read, studentId);
        if (registrationData.length) {
            await OlympiadMysql.updateStudentOlympiadRegistration({
                database: db.mysql.write, name, email, mobile, studentClass, state: stateAbbreviationMapping[state.toUpperCase()], district, schoolName, username, studentId, registeredOnDoubtnut: 1,
            });
        } else {
            await OlympiadMysql.registerOlympiad({
                database: db.mysql.write, name, email, mobile, studentClass, state: stateAbbreviationMapping[state.toUpperCase()], district, schoolName, username, studentId, registeredOnDoubtnut: 1,
            });
        }
        const variantData = await CourseMysql.getVariantsByPackage(db.mysql.read, classPackageMapping[studentClass]);
        const data = {
            deeplink: `doubtnutapp://vip?variant_id=${variantData[0].id}`,
            finish_activity: true,
        };

        return next({ data });
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
        let assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudent(db.mysql.read, studentId);

        if (Number(isWeb)) {
            if (!params) {
                return sendError(res, 401, 'invalid username');
            }
            const paramsParsed = JSON.parse(decrypt(params));
            ({ type, id } = paramsParsed);
            if (!type || !id) {
                return sendError(res, 401, 'invalid username');
            }
            const userData = await OlympiadMysql.getStudent(db.mysql.read, id);
            if (type === 'paid_user_from_ht_website' && id && userData.length === 0) {
                const details = await getUserDetailsFromHTServer(config, id);
                const {
                    user_exists: userExists, email, class: studentClassHt, school, phone, state, district, name,
                } = details.data.data;
                if (!userExists) {
                    throw new ValidationError('invalid username');
                }
                const studentClass = studentClassHt.split(' ')[0];
                await PackageContainer.createSubscriptionEntryForStudentIdByPackageId(db, studentId, classPackageMapping[studentClass], 0);

                await OlympiadMysql.registerOlympiad({
                    database: db.mysql.write, name, email, mobile: phone, studentClass, state, district, schoolName: school, username: id, studentId, registeredOnDoubtnut: 0,
                });
            }
        }
        if (Number(isWeb)) {
            assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudent(db.mysql.read, studentId);
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
        return next({ data });
    } catch (err) {
        return next({ err });
    }
}

async function getUserLinks(req, res, next) {
    try {
        const config = req.app.get('config');
        const { username } = req.query;
        const paramsEncrypted = encrypt(JSON.stringify({
            type: 'paid_user_from_ht_website',
            id: username,
        }));
        const data = {
            web_link: `https://www.doubtnut.com/ht-olympiad/${paramsEncrypted}`,
            android_link: (await Utility.generateDeeplinkFromAppDeeplink(config.branch_key, 'HT', 'OLYMPIAD', `doubtnutapp://olympiad-register?type=paid_user_from_ht_website&id=${username}`)).url,
        };
        return next({ data });
    } catch (err) {
        return next({ err });
    }
}

async function getUserDetails(req, res, next) {
    try {
        const { username } = req.query;
        const db = req.app.get('db');

        const data = await OlympiadMysql.getStudent(db.mysql.read, username);
        if (data.length === 0) {
            const respDat = {
                user_exists: 0,
            };
            return next({ data: respDat });
        }
        const { student_id: studentId, registered_on_doubtnut: registeredOnDoubtnut } = data[0];
        const assortmentDetails = await OlympiadMysql.getAssortmentIdsOfStudent(db.mysql.read, studentId);

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
                is_app_downloaded: true,
                payment_status: assortmentDetails.length >= 1 && registeredOnDoubtnut,
            }
            ),
        };
        return next({ data: respData });
    } catch (err) {
        return next({ err });
    }
}

module.exports = {
    getDetails,
    register,
    getSuccess,
    getUserLinks,
    getUserDetails,
    getDetailsV2: OlympiadControllerV2.getDetails,
    registerV2: OlympiadControllerV2.register,
    getSuccessV2: OlympiadControllerV2.getSuccess,
};
