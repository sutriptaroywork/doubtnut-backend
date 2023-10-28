const _ = require('lodash');
const ranks = require('./ranks');
const config = require('../../config/config');

module.exports = {
    rank: (test_id, score) => {
        const tests = [4177, 4178, 4179, 4180, 4181, 4182, 4183, 4184, 4185, 4186, 4187, 4188];
        if (_.includes(tests, test_id)) {
            let rank = ranks.filter((check_set) => {
                if (score >= check_set.min_marks && score <= check_set.max_marks) {
                    return check_set;
                }
                return 0;
            });
            rank = rank[0];
            const message = {
                notification_type: 'SILENT_GAMIFICATION',
                popup_direction: 'BOTTOM',
                popup_type: 'popup_badge',
                message: 'Your Estimated Rank is',
                description: ` ${rank.min_rank} ${rank.max_rank} `,
                img_url: `${config.staticCDN}engagement_framework/FACA336B-425B-5B20-EE55-1BDAA70E8EB4.webp`,
                duration: '5000',
            };
            return message;
        }
        return 0;
    },

};
