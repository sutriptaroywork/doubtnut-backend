module.exports = class Stories {
    static getAdsByCcmIds(database, ccmIds, locale) {
        const sql = `select * from course_ads_stories where ccm_id in (${ccmIds}) and locale = '${locale}' order by position asc`;
        return database.query(sql);
    }
};
