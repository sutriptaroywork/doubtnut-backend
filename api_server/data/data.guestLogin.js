module.exports = {
    config: {
        restrictred_routes: [
            '/v10/questions/ask',
            '/v13/answers/view-answer-by-question-id',
        ],
        only_action_disabled_routes: [
            '/v3/tesla/feed',
            '/v3/search/get-animation',
            '/api/dnr/home',
            '/api/study-group/v2/list-groups',
            '/v1/tesla/profile/:student_id',
        ],
        students_login_source_val: 4,
        students_table_fingerprint_val: 'login',
    },
    pop_up_data: {
        title: {
            en: 'You have already asked two questions from your guest account',
            hi: 'आप पहले ही अपने गेस्ट अकाउंट से दो प्रश्न पूछ चुके हैं',
        },
        subtitle: {
            en: 'Login on Doubtnut first to start using all our features and start asking all your doubts',
            hi: 'हमारे सभी सुविधाएँ का उपयोग शुरू करने के लिए सबसे पहले डाउटनट पर लॉग इन करें',
        },
        image_url: {
            en: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8A3CA1EA-ADC2-BDDD-B990-08A5063B67CA.webp',
            hi: 'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/8A3CA1EA-ADC2-BDDD-B990-08A5063B67CA.webp',
        },
        button: {
            en: 'Login',
            hi: 'लॉग इन करें',
        },

    },
    guest_login_timestamp_tracking_collection: 'guest_user_logins',
};
