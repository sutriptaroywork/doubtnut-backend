module.exports = class AppConstants {
    constructor() {
        this.trendingVideoCount = 50;
    }

    static getCdnPath(database) {
        const sql = "SELECT value FROM app_constants WHERE constant_key = 'cdn_static'";
        return database.query(sql);
    }
    // static getTrendingVideoCount() {
    //   return this.trendingVideoCount
    // }
};
