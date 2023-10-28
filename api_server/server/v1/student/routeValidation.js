const Joi = require('joi');

module.exports = {
    student: {
        addPublicUserWeb: {
            body: {
                udid: Joi.string().required(),
                gcm_reg_id: Joi.string(),
            },
        },
        updateGcm: {
            body: {
                student_id: Joi.string().required(),
                gcm_reg_id: Joi.string().required(),
            },
        },
        addGcm: {
            body: {
                udid: Joi.string().required(),
                gcm_reg_id: Joi.string().required(),
            },
        },
        saveEmail: {
            body: {
                udid: Joi.string().required(),
            },
        },
        getAskHistory: {
            params: {
                student_id: Joi.string().required(),
            },
            query: {
                limit: Joi.string(),
            },
        },
        postStudentOnboarding: {
            params: {
                type: Joi.string().required(),
                code: Joi.array().items(Joi.string()).required(),
                title: Joi.array().items(Joi.string()).required(),
            },
        },
        liveClassNotification: {
            body: {
                sid: Joi.string().required(),
                title: Joi.string().required(),
                msg: Joi.string().allow(''),
                qid: Joi.string().required(),
                img: Joi.string().required(),
                btn_txt: Joi.string().required(),
                trigger: Joi.string().required(),
                action: Joi.string().required(),
                s_class: Joi.string().required(),
                lang: Joi.string().required(),
                type: Joi.string().required(),
            },
        },
        autoPlayData: {
            body: {
                answer_video: Joi.string().required(),
                video_time: Joi.required(),
            },
        },
        storeOnBoardLanguage: {
            body: {
                gcm_id: Joi.string().required(),
                locale: Joi.string().required(),
            },
        },
        storePin: {
            body: {
                pin: Joi.string().required(),
            },
        },
        getOtpDeliveryDetails: {
            params: {
                mobile_no: Joi.string().required(),
            },
        },
        loginWithPin: {
            body: {
                pin: Joi.string().required(),
                identifier: Joi.string().required(),
                identifier_type: Joi.string().allow('').default('mobile'),
            },
        },
        getSurveyDetails: {
            params: {
                surveyId: Joi.number().required(),
            },
        },
        storeSurveyFeedback: {
            body: {
                survey_id: Joi.number().required(),
                question_id: Joi.number(),
                feedback: Joi.string(),
            },
        },
        ncertLastWatchedDetails: {
            body: {
                question_id: Joi.number().required(),
            },
        },
        doubtnutFeedParams: {
            body: {
                topic_id: Joi.string(),
            },
        },
        doubtFeedProgress: {
            body: {
                topic_id: Joi.string().required(),
            },
        },
        doubtCompletion: {
            body: {
                type_id: Joi.string().required(),
            },
        },
        noticeBoard: {
            params: {
                type: Joi.string(),
            },
        },
        doubtfeedVideoBanner: {
            body: {
                chapter: Joi.string().required(),
            },
        },
        storingReferrerId: {
            body: {
                referrer_id: Joi.number().required(),
            },
        },
    },
};
