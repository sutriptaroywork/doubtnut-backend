const config = require('../config/config');

module.exports = class Constants {
    static getIntro() {
        return 'https://youtu.be/4kUgO47pFco';
    }

    static getBlobIntro() {
        return `${config.staticCDN}intro-video/NewAppTutorial02-720p-02.mp4`;
    }

    static getBlobIntroObject() {
        return [
            {
                question_id: 2116599,
                video: `${config.staticCDN}intro-video/NewAppTutorial02-720p-02.mp4`,
                type: 'intro',
            },
            {
                question_id: 2200030,
                video: `${config.staticCDN}intro-video/NewAppTutorial03-720p-02.mp4`,
                type: 'community',
            },
        ];
    }

    static cropToEquation() {
        return 2169870;
    }

    static getUpdateAppUrl() {
        return 'https://play.google.com/store/apps/details?id=com.doubtnutapp';
    }

    static getWrongOTPMaxLimit() {
        return 5;
    }

    static getWrongOTPMaxLimitForTeacher() {
        return 10;
    }
};
