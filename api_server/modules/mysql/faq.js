module.exports = class Faq {
    static getByLocale(database, bucketNames, locale, versionCode) {
        let sql = '';
        let params;
        if (bucketNames[0] === 'all') {
            sql = 'select id, bucket, question, type, answer, question_id, thumbnail, video_orientation, priority from faq where locale = ? and is_active=1 and min_version_code <= ? and max_version_code >= ? order by bucket_priority, priority';
            params = [locale, versionCode, versionCode];
        } else {
            sql = 'select id, bucket, question, type, answer, question_id, thumbnail, video_orientation, priority from faq where locale = ? and is_active=1 and bucket in (?) and min_version_code <= ? and max_version_code >= ? order by bucket_priority, priority';
            params = [locale, bucketNames, versionCode, versionCode];
        }
        return database.query(sql, params);
    }
};
