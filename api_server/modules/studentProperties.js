module.exports = class StudentProperties {
    static getWidgetTypeContent(database, widget_type, student_locale) {
        const sql = 'SELECT * FROM profile_properties where type =? and locale =?';
        return database.query(sql, [widget_type, student_locale]);
    }
};
