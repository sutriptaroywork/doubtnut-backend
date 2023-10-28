module.exports = class OneTapPosts {
    static getActiveOneTapPosts(database, versionCode, studentClass, locale, limit, offset, carouselType) {
        // query time : 48 ms
        const sql = `select id, img_url from one_tap_posts where (min_version_code is null or min_version_code <= ${versionCode}) and (max_version_code is null or max_version_code >= ${versionCode}) and is_active = 1 and (student_class is null or student_class = ${studentClass}) and (locale is null or locale = '${locale}') and carousel_type = '${carouselType}' order by rank limit ${limit} offset ${offset}`;
        return database.query(sql);
    }

    static getImageUrl(database, postId) {
        // query time : 23 ms
        const sql = `select img_url from one_tap_posts where is_active=1 and id=${postId}`;
        return database.query(sql);
    }

    static getCarouselTypeWisePosts(database, carouselTypeList, limit, offset) {
        // query time : 29 ms
        const sql = `select id, img_url from one_tap_posts where carousel_type in ('${carouselTypeList}') order by rank limit ${limit} offset ${offset}`;
        console.log(sql);
        return database.query(sql);
    }
};
