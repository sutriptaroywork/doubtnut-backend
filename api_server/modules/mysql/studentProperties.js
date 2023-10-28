module.exports = class StudentProperties {
    static getHomePageWidgetContentByType(database, widgetType, studentLocale) {
        // need to check the order by priority before taking to production
        const sql = 'SELECT option_id as id,type as name,img_url , title as display, meta_1 as type FROM profile_properties where type =? and locale = ?';
        return database.query(sql, [widgetType, studentLocale]);
    }
};
