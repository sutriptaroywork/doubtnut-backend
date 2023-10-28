const _ = require('lodash');
const redis = require('redis');

module.exports = class Icons {
    static setIconData(client, data, studentClass) {
        return client.set(`homepage_icons_${studentClass}`, JSON.stringify(data));
    }

    static getIconData(client, studentClass) {
        return client.getAsync(`homepage_icons_${studentClass}`);
    }

    static setFavoriteIconsByCCMid(client, ccmId, locale, data) {
        return client.setAsync(`favorite_icons_of_ccm:${ccmId}:${locale}`, JSON.stringify(data));
    }

    static getFavoriteIconsByCCMid(client, ccmId, locale) {
        return client.getAsync(`favorite_icons_of_ccm:${ccmId}:${locale}`);
    }

    static setCategoriesByClass(client, studentClass, studentLocale, data) {
        return client.setAsync(`icon_categories:${studentClass}:${studentLocale}`, JSON.stringify(data), 'EX', 60 * 60);
    }

    static getCategoriesByClass(client, studentClass, studentLocale) {
        return client.getAsync(`icon_categories:${studentClass}:${studentLocale}`);
    }

    static getcheckForDoubtnutCeoDisplay(client, studentId) {
        return client.getAsync(`show_doubtnut_ceo_icon:${studentId}`);
    }

    static setcheckForDoubtnutCeoDisplay(client, studentId, data) {
        return client.setAsync(`show_doubtnut_ceo_icon:${studentId}`, data, 'EX', 60 * 5);// 5 minutes
    }

    static setIconListByCategories(client, cacheKey, data) {
        return client.setAsync(cacheKey, JSON.stringify(data), 'EX', 60 * 5);// 5 minutes
    }

    static getDnCeoIcon(client, versionCode) {
        return client.getAsync(`doubtnut_ceo_icon:${versionCode}`);
    }

    static setDnCeoIcon(client, versionCode, data) {
        return client.setAsync(`doubtnut_ceo_icon:${versionCode}`, JSON.stringify(data), 'EX', 24 * 60 * 60);// 2 hour
    }

    static getIconListByCategories(client, cacheKey) {
        return client.getAsync(cacheKey);
    }
};
