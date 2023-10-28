const Joi = require('joi');

module.exports = {
    student: {
        addPublicUserWeb: {
            body: {
                udid: Joi.string().required(),
                gcm_reg_id: Joi.string().allow('').default(null),
                class: Joi.string().default('12'),
                language: Joi.string().default('en'),
                app_version: Joi.string().default(null),
                email: Joi.string().allow('').trim().replace(/\s/g, '')
                    .default(null),
                clevertap_id: Joi.string().default(null).allow(''),
            },
        },
        updateGcm: {
            body: {
                student_id: Joi.string().allow('').required(),
                app_version: Joi.string(),
                gcm_reg_id: Joi.string().required(),
            },
        },
        setLanguage: {
            body: {
                language_code: Joi.string().required(),
                student_id: Joi.string().required(),
            },
        },
        setClass: {
            body: {
                student_class: Joi.string().required(),
                student_id: Joi.string().required(),
            },
        },
        login: {
            body: {
                phone_number: Joi.string().required(),
                email: Joi.string().email().default(null),
                class: Joi.string().allow('').default('12'),
                language: Joi.string().allow('').default('en'),
                app_version: Joi.string().default(null),
                gcm_reg_id: Joi.string().allow('').default(null),
                udid: Joi.string().default(''),

            },
        },
        verify: {
            body: {
                otp: Joi.string().required(),
                session_id: Joi.string().required(),

            },
        },
        browse: {
            body: {
                student_class: Joi.string().required(),
                student_course: Joi.string().required(),
            },
        },
        getProfile: {
            params: {
                student_id: Joi.string().required(),
            },
        },
        updateProfile: {
            body: {
                username: Joi.string(),
                student_course: Joi.string().allow(''),
                student_fname: Joi.string().allow(''),
                student_lname: Joi.string().allow(''),
                img_url: Joi.string().allow(''),
                school_name: Joi.string().allow(''),
                student_class: Joi.string().allow(''),
                locale: Joi.string().allow(''),
                email: Joi.string().allow(''),
                coaching: Joi.string().allow(''),
                pincode: Joi.string().allow(''),
                dob: Joi.date(),
            },
        },
        storeContacts: {
            contacts: Joi.string().required(),
        },
        logout: {
            params: {},
        },
        username_check: {
            body: {
                username: Joi.string().required(),
            },
        },
        recreated_token: {
            params: {
                student_id: Joi.string().required(),
            },
        },
        addReferredUser: {
            referred_id: Joi.string().required(),
        },
        getReferredUsers: {

        },
    },
};
