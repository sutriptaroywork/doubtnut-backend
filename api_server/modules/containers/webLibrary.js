const _ = require('lodash');
const config = require('../../config/config');
const mysql = require('../mysql/webLibrary');
const redis = require('../redis/webLibrary');

const hashExpiry = 60 * 60;

module.exports = class webLibrary {
    static async getWebBooksLandingPageData(db, stClass) {
        try {
            let data;
            const redisKey = `WEB_LIBRARY_BOOKS_LANDING_PAGE_${stClass}`;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, redisKey);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebBooksLandingPageData(db.mysql.read, stClass);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, redisKey, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebBooksLandingPageData(db.mysql.read, stClass);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebBooksDetailsByClass(db, stClass, language) {
        try {
            let data;
            language = language || 'en';
            const redisKey = `WEB_LIBRARY_BOOKS_LANDING_PAGE_CLASS_TITLE_${stClass}_${language}`;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, redisKey);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebBooksDetailsByClass(db.mysql.read, stClass, language);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, redisKey, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebBooksDetailsByClass(db.mysql.read, stClass, language);
        } catch (e) {
            console.log(e);
        }
    }

    static async getFilteredWebBooksData(db, stClass, medium, subject) {
        try {
            let data;
            let redisKey = 'WEB_LIBRARY_BOOKS';
            redisKey = stClass ? `${redisKey}_${stClass}` : redisKey;
            redisKey = medium ? `${redisKey}_${medium}` : redisKey;
            redisKey = subject ? `${redisKey}_${subject}` : redisKey;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, redisKey);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getFilteredWebBooksData(db.mysql.read, stClass, medium, subject);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, redisKey, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getFilteredWebBooksData(db.mysql.read, stClass, medium, subject);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebLibraryFilters(db, stClass, medium, subject) {
        try {
            let data;
            let redisKey = 'WEB_LIBRARY_BOOKS_FILTERS';
            redisKey = stClass ? `${redisKey}_${stClass}` : redisKey;
            redisKey = medium ? `${redisKey}_${medium}` : redisKey;
            redisKey = subject ? `${redisKey}_${subject}` : redisKey;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, redisKey);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebLibraryFilters(db.mysql.read, stClass, medium, subject);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, redisKey, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebLibraryFilters(db.mysql.read, stClass, medium, subject);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebBookData(db, redisKey) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, `WEB_LIBRARY_BOOKS_DATA_${redisKey}`);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebBookData(db.mysql.read, redisKey);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, `WEB_LIBRARY_BOOKS_DATA_${redisKey}`, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebBookData(db.mysql.read, redisKey);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebChapterUrlData(db, sId, stClass, subject) {
        try {
            let data;
            const redisKey = `WEB_LIBRARY_BOOKS_CHAPTER_URL_DATA_${sId}_${stClass}_${subject}`;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, redisKey);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebChapterUrlData(db.mysql.read, sId, stClass, subject);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, redisKey, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebChapterUrlData(db.mysql.read, sId, stClass, subject);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebBookChapterData(db, redisKey) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, `WEB_LIBRARY_BOOKS_CHAPTER_DATA_${redisKey}`);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebBookChapterData(db.mysql.read, redisKey);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, `WEB_LIBRARY_BOOKS_CHAPTER_DATA_${redisKey}`, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebBookChapterData(db.mysql.read, redisKey);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebChapterExerciseUrlData(db, sId, stClass, subject, chapter) {
        try {
            let data;
            const redisKey = `WEB_LIBRARY_BOOKS_CHAPTER_EXERCISE_URL_DATA_${sId}_${stClass}_${subject}_${chapter}`;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, redisKey);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebChapterExerciseUrlData(db.mysql.read, sId, stClass, subject, chapter);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, redisKey, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebChapterExerciseUrlData(db.mysql.read, sId, stClass, subject, chapter);
        } catch (e) {
            console.log(e);
        }
    }

    static async getWebBookChapterExerciseData(db, redisKey) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getWebBooksData(db.redis.read, `WEB_LIBRARY_BOOKS_CHAPTER_EXERCISE_DATA_${redisKey}`);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }

                data = await mysql.getWebBookChapterExerciseData(db.mysql.read, redisKey);
                if (data.length) {
                    redis.setWebBooksData(db.redis.write, `WEB_LIBRARY_BOOKS_CHAPTER_EXERCISE_DATA_${redisKey}`, data, hashExpiry * 2);
                }
                return data;
            }
            return mysql.getWebBookChapterExerciseData(db.mysql.read, redisKey);
        } catch (e) {
            console.log(e);
        }
    }
};
