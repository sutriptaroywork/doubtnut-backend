const notification = {
    notification_payment_failure: {
        title: 'VIP Member banne mein lag raha hai time❓',
        message: 'Dubara Payment ke liye try karein abhi🔥',
        event: 'payment_package',
        // image: `${config.staticCDN}engagement_framework/E6C8E5CE-D391-8291-E7E4-4FB01B38EAE4.webp`,
    },

    notification_payment_success: {
        title: 'Congrats! Ab Aap VIP Member Hai!',
        message: 'Dekhe Unlimited VMC class Lectures',
        event: 'payment_package',
        // image: `${config.staticCDN}engagement_framework/FA8D798D-23A5-1AE5-BF7A-BFEE829EC086.webp`,
    },
    notification_referral_extend: {
        title: 'Congrats! Aapko mila hai <days> ki membership refer karne pe !',
        message: 'Apne aur friends ko bhi refer kare and paye aur bhi jaada benifits.',
        event: 'payment_package',
    },
    notification_successful_refund: {
        title: 'Apka refund successfully hogaya hai!',
        message: '##amount## apke original payment method mai 5-10 days me refund hojaega',
        event: 'payment_package',
    },

};

const liveclassNotification = {
    notification_payment_failure: {
        title: 'Liveclass Member banne mein lag raha hai time❓',
        message: 'Dubara Payment ke liye try karein abhi🔥',
        event: 'payment_package',
        // image: `${config.staticCDN}engagement_framework/E6C8E5CE-D391-8291-E7E4-4FB01B38EAE4.webp`,
    },

    notification_payment_success: {
        title: 'Congrats! Ab Aap Liveclass VIP Member Hai!',
        message: 'Dekhe Unlimited Live Lectures',
        event: 'payment_package',
        // image: `${config.staticCDN}engagement_framework/FA8D798D-23A5-1AE5-BF7A-BFEE829EC086.webp`,
    },
    notification_referral_extend: {
        title: 'Congrats! Aapko mila hai <days> ki membership refer karne pe !',
        message: 'Apne aur friends ko bhi refer kare and paye aur bhi jaada benifits.',
        event: 'payment_package',
    },

};
const referralInfo = {
    bucket: 'referral_vip',
    name: 'days_to_extend',
};


const constants = {

    doubt_time_prefix: 'DOUBT_LIMIT_TIMER_',
    vip_prompt_prefix: 'PACKAGE_PROMPT_',
    timer_value: 60 * 60 * 24,
    question_asked_interval_in_hours: 24,
    mongoDocument: 'student_package_bucket',
    paymentMailID: 'payments@doubtnut.com',
    autobotMailID: 'autobot@doubtnut.com',
    feedbackSubject: 'VIP | User Feedback From App | Student ID : ',

};

function getPaymentSuccessMessage(course) {
    const notification_payment_success = {
        title: 'Congrats! Ab Aap VIP Member Hai!',
        message: `Dekhe Unlimited ${course} Lectures`,
        event: 'payment_package',
    };
    return notification_payment_success;
};

const walletConstants = {

    notification_payment_success: {
        title: 'SUCCESS! ₹<amount> aapke wallet me add hogaye he!',
        message: 'Now buy in seconds using DN Wallet',
        event: 'wallet',
    },
};

module.exports = {
    notification,
    referralInfo,
    constants,
    liveclassNotification,
    getPaymentSuccessMessage,
    walletConstants,
};
