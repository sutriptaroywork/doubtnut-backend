const freeClassListingPageMysql = require('../mysql/clp');
const freeChapterListingPageRedis = require('../redis/freeClassListingPage');

const oneDay = 60 * 60 * 24;
const config = require('../../config/config');
const _ = require('lodash');

async function getLatestChapterBySubject(client, studentClass, metaInfo, subject) {
    metaInfo.sort();
    if (config.caching) {
        const result = await freeChapterListingPageRedis.getLatestChapterBySubject(client.redis.read, studentClass, metaInfo, subject);
        if (!_.isNull(result)) {
            return JSON.parse(result);
        }
    }
    const result = await freeClassListingPageMysql.getLatestChapterBySubject(client.mysql.read, studentClass, metaInfo, subject);
    if (config.caching) {
        freeChapterListingPageRedis.setLatestChapterBySubject(client.redis.write, studentClass, metaInfo, subject, result);
    }
    return result;
}

async function getSubjectsForLocaleAndClass(db, studentClass, metaInfo) {
    const a = await freeChapterListingPageRedis.getSubjectsList(db.redis.read, studentClass, metaInfo);
    return JSON.parse(a);
}

async function getTeachersListForSubject(db, studentClass, metaInfo, subject, chapter) {
    return JSON.parse(await freeChapterListingPageRedis.getTeachersList(db.redis.read, studentClass, metaInfo, subject, chapter));
}

async function getChaptersList(db, studentClass, metaInfo, subject) {
    return JSON.parse(await freeChapterListingPageRedis.gettChaptersList(db.redis.read, studentClass, metaInfo, subject));
}

async function getSubjectAssortmentIds(db, studentClass, metaInfo, subject) {
    return JSON.parse(await freeChapterListingPageRedis.getSubjectAssortmentIds(db.redis.read, studentClass, metaInfo, subject));
}

module.exports = {
    getSubjectsForLocaleAndClass,
    getTeachersListForSubject,
    getChaptersList,
    getLatestChapterBySubject,
    getSubjectAssortmentIds,
};
