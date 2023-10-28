const config = require('../../config/config');

const notification = {
    newton_url: config.NEWTON_NOTIFICATION_URL,
    newton_url_notification_cohort: 'http://newton.doubtnut.internal:3000/notification/cohort/{studentId}',
};

module.exports = { notification };
