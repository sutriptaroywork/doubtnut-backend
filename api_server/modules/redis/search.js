const hash_expiry = 60 * 60 * 24;
const keys = require('./keys');

module.exports = class Search {
    static getSugg(student_class, limit, language, client) {
        return client.getAsync(`get_suggestion_${student_class}_${limit}_${language}`);
    }

    static setSugg(student_class, limit, language, data, client) {
        return client.setAsync(`get_suggestion_${student_class}_${limit}_${language}`, JSON.stringify(data));
    }

    static getIasTopTags(client, sClass) {
        return client.getAsync(`IAS_TOP_TAGS_${sClass}`);
    }

    static setIasTopTags(client, sClass, data) {
        return client.setAsync(`IAS_TOP_TAGS_${sClass}`, JSON.stringify(data), 'Ex', hash_expiry * 2);
    }

    static getIasPopularOnDoubtnut(client, sClass, locale, flag, isFreeApp = false) {
        return client.getAsync(`${keys.IAS_POPULAR_ON_DOUBTNUT}_${sClass}_${locale}_${flag}_${isFreeApp}`);
    }

    static setIasPopularOnDoubtnut(client, sClass, data, locale, flag, isFreeApp = false) {
        return client.setAsync(`${keys.IAS_POPULAR_ON_DOUBTNUT}_${sClass}_${locale}_${flag}_${isFreeApp}`, JSON.stringify(data), 'Ex', hash_expiry * 2);
    }

    static getIasTopBooks(client, sClass) {
        return client.getAsync(`IAS_TOP_BOOKS_${sClass}`);
    }

    static setIasTopBooks(client, sClass, data) {
        return client.setAsync(`IAS_TOP_BOOKS_${sClass}`, JSON.stringify(data), 'Ex', hash_expiry * 2);
    }

    static getIasTopExams(client, sClass) {
        return client.getAsync(`IAS_TOP_EXAMS_${sClass}`);
    }

    static setIasTopExams(client, sClass, data) {
        return client.setAsync(`IAS_TOP_EXAMS_${sClass}`, JSON.stringify(data), 'Ex', hash_expiry * 2);
    }

    static getIasTopCourse(client, sClass) {
        return client.getAsync(`IAS_TOP_COURSE_${sClass}`);
    }

    static setIasTopCourse(client, sClass, data) {
        return client.setAsync(`IAS_TOP_COURSE_${sClass}`, JSON.stringify(data), 'Ex', hash_expiry * 2);
    }

    static getTrendingplaylist(client, sClass, limit, flag) {
        return client.getAsync(`IAS_TRENDING_PLAYLIST_${sClass}_${limit}_${flag}`);
    }

    static setTrendingplaylist(client, sClass, limit, data, flag) {
        return client.setAsync(`IAS_TRENDING_PLAYLIST_${sClass}_${limit}_${flag}`, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getRecentWatchedVideo(client, sClass, flag, locale) {
        return client.getAsync(`IAS_RECENT_WATCHED_VIDEO_${sClass}_${flag}_${locale}`);
    }

    static setRecentWatchedVideo(client, sClass, flag, locale, data) {
        return client.setAsync(`IAS_RECENT_WATCHED_VIDEO_${sClass}_${flag}_${locale}`, JSON.stringify(data), 'Ex', hash_expiry / 12);
    }
};
