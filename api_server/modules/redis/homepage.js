// const _ = require('lodash')
const static_expiry = 60 * 60;

module.exports = class Homepage {
    static getCaraousel(client, student_class, limit, page, version_code, flagString) {
        console.log('get async');
        return client.getAsync(`HOMEPAGE_CARAOUSEL_${student_class}_${page}_${version_code}_${flagString}`);
    }

    static getPersonalisedCaraousel(client, student_class, student_locale, cep_string, page, version_code, flagString) {
        return client.getAsync(`HOMEPAGE_PER-CARAOUSEL_${student_class}_CEM${cep_string}_${page}_${version_code}_${flagString}`);
    }

    static setCaraousel(client, student_class, limit, page, version_code, data, flagString) {
        return client.multi()
            .set(`HOMEPAGE_CARAOUSEL_${student_class}_${page}_${version_code}_${flagString}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_CARAOUSEL_${student_class}_${page}_${version_code}_${flagString}`, parseInt((+new Date()) / 1000) + static_expiry * 2)
            .execAsync();
    }

    static setPersonalisedCaraousel(client, student_class, student_locale, cep_string, page, data, version_code, flagString) {
        return client.multi()
            .set(`HOMEPAGE_PER-CARAOUSEL_${student_class}_CEM${cep_string}_${page}_${version_code}_${flagString}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_PER-CARAOUSEL_${student_class}_CEM${cep_string}_${page}_${version_code}_${flagString}`, parseInt((+new Date()) / 1000) + static_expiry * 2)
            .execAsync();
    }

    static getCacheHomepage(student_class, page, caraousel_limit, client) {
        return client.getAsync(`HOMEPAGE_${student_class}_${page}_${caraousel_limit}`);
    }

    static setCacheHomepage(data, student_class, page, caraousel_limit, client) {
        return client.multi()
            .set(`HOMEPAGE_${student_class}_${page}_${caraousel_limit}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_${student_class}_${page}`, parseInt((+new Date()) / 1000) + static_expiry)
            .execAsync();
    }

    static getAllActiveHomePageWidgets(client) {
        return client.getAsync('HOMEPAGE_WIDGETS_ACTIVE_LIST');
    }

    static setAllActiveHomePageWidgets(client, data) {
        return client.multi()
            .set('HOMEPAGE_WIDGETS_ACTIVE_LIST', JSON.stringify(data))
            .expireat('HOMEPAGE_WIDGETS_ACTIVE_LIST', parseInt((+new Date()) / 1000) + static_expiry)
            .execAsync();
    }

    static setLocalisedCaraouselString(client, home_caraousel_id, locale, data) {
        return client.multi()
            .set(`HOMEPAGE_LOCALISATION${home_caraousel_id}_${locale}`, JSON.stringify(data))
            .expireat(`HOMEPAGE_LOCALISATION${home_caraousel_id}_${locale}`, parseInt((+new Date()) / 1000) + static_expiry)
            .execAsync();
    }

    static getLocalisedCaraouselString(client, home_caraousel_id, locale) {
        return client.getAsync(`HOMEPAGE_LOCALISATION${home_caraousel_id}_${locale}`);
    }

    static setEtoosData(client, type, ecmId, metadata, sClass, data) {
        // metadata = metadata.join('-');
        return client.setAsync(`HOMEPAGE_ETOOS_${type}_${sClass}_${ecmId}_${metadata}`, JSON.stringify(data), 'Ex', 12 * static_expiry);
    }

    static getEtoosData(client, type, ecmId, metadata, sClass) {
        // metadata = JSON.parse(metadata);
        // metadata = metadata.join('-');
        return client.getAsync(`HOMEPAGE_ETOOS_${type}_${sClass}_${ecmId}_${metadata}`);
    }

    static getUsWebHomepageSubjects(client, student_class) {
        return client.getAsync(`HOMEPAGE_US_WEB_SUBJECTS_${student_class}`);
    }

    static setUsWebHomepageSubjects(client, student_class, data) {
        return client.setAsync(`HOMEPAGE_US_WEB_SUBJECTS_${student_class}`, JSON.stringify(data), 'EX', 24 * static_expiry);
    }

    static getLibraryDataByParentId(client, parent_id) {
        return client.getAsync(`HOMEPAGE_US_WEB_LIB_ROW_${parent_id}`);
    }

    static setLibraryDataByParentId(client, parent_id, data) {
        return client.setAsync(`HOMEPAGE_US_WEB_LIB_ROW_${parent_id}`, JSON.stringify(data), 'EX', 24 * static_expiry);
    }

    static getLibraryDataByClassChapter(client, student_class, chapter, data) {
        return client.getAsync(`HOMEPAGE_US_WEB_CHAPTER_DATA_${student_class}_${chapter}`);
    }

    static setLibraryDataByClassChapter(client, student_class, chapter, data) {
        return client.setAsync(`HOMEPAGE_US_WEB_CHAPTER_DATA_${student_class}_${chapter}`, JSON.stringify(data), 'EX', 24 * static_expiry);
    }

    static getHomepageUsCaraousel(client, student_class) {
        return client.getAsync(`HOMEPAGE_WEB_US_CARAOUSEL_${student_class}`);
    }

    static setHomepageUsCaraousel(client, student_class, data) {
        return client.setAsync(`HOMEPAGE_WEB_US_CARAOUSEL_${student_class}`, JSON.stringify(data), 'EX', 24 * static_expiry);
    }

    static getHomepageUs(client) {
        return client.getAsync('HOMEPAGE_WEB_US_ALL_RESPONSE');
    }

    static setHomepageUs(client, data) {
        return client.setAsync('HOMEPAGE_WEB_US_ALL_RESPONSE', JSON.stringify(data), 'EX', 6 * static_expiry);
    }

    static setTopFreeClassesRecommended(client, studentID, studentClass, studentLocale, data) {
        return client.setAsync(`TOP_FREE_CLASSES_RECOMMENDED_HOMEPAGE:${studentID}:${studentClass}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 5);
    }

    static getTopFreeClassesRecommended(client, studentID, studentClass, studentLocale) {
        return client.getAsync(`TOP_FREE_CLASSES_RECOMMENDED_HOMEPAGE:${studentID}:${studentClass}:${studentLocale}`);
    }

    static getHomepageCarousel(client, type, dataType, sclass, locale) {
        return client.getAsync(`${type}:${dataType}:${sclass}:${locale}`);
    }

    static setHomepageCarousel(client, type, dataType, sclass, locale, data) {
        const expiry = 30 * 60;
        return client.setAsync(`${type}:${dataType}:${sclass}:${locale}`, JSON.stringify(data), 'EX', expiry);
    }

    static getThumbnailExperiment(client, oldResourceId, studentClass, qid) {
        return client.getAsync(`NEW_THUMBNAIL_EXPERIMENT:${oldResourceId}:${studentClass}:${qid}`);
    }
};
