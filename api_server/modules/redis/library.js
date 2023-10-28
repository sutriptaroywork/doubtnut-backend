// const _ = require('lodash');
// let Utility = require('./utility');
const hash_expiry = 60 * 60;

module.exports = class Icons {
    static setPlaylistTab(student_class, data, client) {
    // console.log(JSON.stringify(data));
        return client.multi()
            .set(`LIBRARY_PLAYLIST_TABS${student_class}`, JSON.stringify(data))
            .expireat(`LIBRARY_PLAYLIST_TABS${student_class}`, parseInt((+new Date()) / 1000) + hash_expiry)
            .execAsync();
    // console.log(client.getAsync("homepage_icons"));
    }

    static getPlaylistTab(student_class, client) {
        return client.getAsync(`LIBRARY_PLAYLIST_TABS${student_class}`);
    }

    static setPlaylistAllWithPCMUpdated(student_class, page, limit, data, client) {
    // console.log(JSON.stringify(data));
        return client.multi()
            .set(`LIBRARY_PLAYLIST_${student_class}_${page}_${limit}`, JSON.stringify(data))
            .expireat(`LIBRARY_PLAYLIST_${student_class}_${page}_${limit}`, parseInt((+new Date()) / 1000) + hash_expiry * 2)
            .execAsync();
    // console.log(client.getAsync("homepage_icons"));
    }

    static setPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, data, client, version_code) {
    // console.log(JSON.stringify(data));
        return client.multi()
            .set(`LIBRARY_PLAYLIST_${student_class}_${page}_${limit}_${version_code}`, JSON.stringify(data))
            .expireat(`LIBRARY_PLAYLIST_${student_class}_${page}_${limit}`, parseInt((+new Date()) / 1000) + hash_expiry * 2)
            .execAsync();
    // console.log(client.getAsync("homepage_icons"));
    }

    static getPlaylistAllWithPCMUpdated(student_class, page, limit, client) {
        return client.getAsync(`LIBRARY_PLAYLIST_${student_class}_${page}_${limit}`);
    }

    static getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, client, version_code) {
        return client.getAsync(`LIBRARY_PLAYLIST_${student_class}_${page}_${limit}_${version_code}`);
    }

    static setPlaylistWithPCM(student_class, id, page, data, client) {
    // console.log(JSON.stringify(data));
        return client.multi()
            .set(`LIBRARY_PLAYLIST_GENERAL_${student_class}_${id}_${page}`, JSON.stringify(data))
            .expireat(`LIBRARY_PLAYLIST_GENERAL_${student_class}_${id}_${page}`, parseInt((+new Date()) / 1000) + hash_expiry * 2)
            .execAsync();
    // console.log(client.getAsync("homepage_icons"));
    }

    static getPlaylistWithPCM(student_class, id, page, client) {
        return client.getAsync(`LIBRARY_PLAYLIST_GENERAL_${student_class}_${id}_${page}`);
    }

    static setIsAnnouncementPresent(client, id, data) {
        return client.multi()
            .set(`LIBRARY_RED_DOT_${id}`, JSON.stringify(data))
            .expireat(`LIBRARY_RED_DOT_${id}`, parseInt((+new Date()) / 1000) + hash_expiry)
            .execAsync();
    }

    static getIsAnnouncementPresent(client, id) {
        return client.getAsync(`LIBRARY_RED_DOT_${id}`);
    }

    static setPlaylistHomepagePCM(type, student_class, data, client) {
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type}_${student_class}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type}_${student_class}`, parseInt((+new Date()) / 1000) + hash_expiry * 2)
            .execAsync();
    }

    static getPlaylistHomepagePCM(type, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type}_${student_class}`);
    }

    static setLocalisedPlaylistHomepagePCM(id, locale, type, student_class, data, client) {
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_${type}_${student_class}_${locale}_${id}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_${type}_${student_class}_${locale}_${id}`, parseInt((+new Date()) / 1000) + hash_expiry * 2)
            .execAsync();
    }

    static getLocalisedPlaylistHomepagePCM(id, locale, type, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_${type}_${student_class}_${locale}_${id}`);
    }

    static setAllCache(key_name, value, client) {
        return client.multi()
            .set(key_name, JSON.stringify(value))
            .expire(key_name, 4 * 60 * 60)
            .execAsync();
    }

    static getByKey(key, client) {
        return client.getAsync(key);
    }

    static delByKey(key, client) {
        return client.delAsync(key);
    }

    static setByKey(key, value, ttl, client) {
        return client.multi()
            .set(key, JSON.stringify(value))
            .expire(key, ttl)
            .execAsync();
    }

    static setAnnouncementCache(key_name, value, client) {
        return client.multi()
            .set(key_name, JSON.stringify(value))
            .expire(key_name, 10 * 60 * 60)
            .execAsync();
    }

    static setParentPlaylistHomepagePCM(id, locale, type, student_class, data, client) {
        return client.multi()
            .set(`HOMEPAGE_WITH_TEXT_PARENT_${type}_${student_class}_${locale}_${id}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_WITH_TEXT_PARENT_${type}_${student_class}_${locale}_${id}`, parseInt((+new Date()) / 1000) + hash_expiry * 2)
            .execAsync();
    }

    static getParentPlaylistHomepagePCM(id, locale, type, student_class, client) {
        return client.getAsync(`HOMEPAGE_WITH_TEXT_PARENT_${type}_${student_class}_${locale}_${id}`);
    }

    static getResourceData(client, id, lang, versionCode, pageNo) {
        return client.getAsync(`LIBRARY_RESOURCE_DATA_${id}_${versionCode}_${pageNo}_${lang}`);
    }

    static setResourceData(client, data, id, lang, versionCode, pageNo) {
        return client.set(`LIBRARY_RESOURCE_DATA_${id}_${versionCode}_${pageNo}_${lang}`, JSON.stringify(data), 'EX', hash_expiry * 24 * 7);
    }

    static setVikramSirResourseData(client, data, id, lang, versionCode, pageNo) {
        return client.set(`VIKRAM_SIR_RESOURCE_DATA${id}_${versionCode}_${pageNo}_${lang}`, JSON.stringify(data), 'EX', 60 * 10);
    }

    static getVikramSirResourseData(client, id, lang, versionCode, pageNo) {
        return client.getAsync(`VIKRAM_SIR_RESOURCE_DATA${id}_${versionCode}_${pageNo}_${lang}`);
    }

    static getNcertBooksLibraryDataNew(client, key) {
        return client.getAsync(key);
    }

    static libraryBookLastView(client, key, studentId) {
        return client.hgetAsync(`USER:PROFILE:${studentId}`, key);
    }

    static getNcertPlayList(client, key) {
        return client.getAsync(key);
    }

    static setPlaylistWithView(client, key, data) {
        return client.set(key, JSON.stringify(data), 'EX', hash_expiry * 24);
    }

    static getPlaylistWithView(client, key) {
        return client.getAsync(key);
    }
};
