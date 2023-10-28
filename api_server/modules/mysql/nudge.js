module.exports = class Nudge {
    static getByEvent(database, event, studentClass) {
        const sql = 'SELECT * FROM nudges WHERE is_active=1 and trigger_events = ? and end_time >= CURRENT_TIMESTAMP and start_time <=CURRENT_TIMESTAMP and (class=? or class=0) order by nudge_order asc';
        return database.query(sql, [event, studentClass]);
    }

    static getByEventAndNoResource(database, event, studentClass) {
        const sql = 'SELECT * FROM nudges WHERE is_active = 1 and trigger_events = ? and end_time >= CURRENT_TIMESTAMP and start_time <=CURRENT_TIMESTAMP and (class=? or class=0) and resource_id is null order by nudge_order asc';
        return database.query(sql, [event, studentClass]);
    }

    static getByEventAndResourceId(database, event, studentClass, id) {
        const sql = 'SELECT * FROM nudges WHERE is_active = 1 and trigger_events = ? and resource_id = ? and end_time >= CURRENT_TIMESTAMP and start_time <=CURRENT_TIMESTAMP and (class=? or class=0) order by nudge_order asc';
        return database.query(sql, [event, id, studentClass]);
    }

    static getByID(database, id) {
        const sql = 'SELECT * FROM nudges WHERE is_active = 1 and id = ?';
        return database.query(sql, [id]);
    }

    static getByTypeAndEvent(database, type, event, studentClass) {
        const sql = 'SELECT * FROM nudges WHERE is_active = 1 and type = ? and trigger_events = ? and end_time >= CURRENT_TIMESTAMP and start_time <=CURRENT_TIMESTAMP and (class=? or class=0) order by nudge_order';
        return database.query(sql, [type, event, studentClass]);
    }

    static getByTypeAndEventFeed(database, type, event, studentClass) {
        const sql = 'SELECT * FROM nudges WHERE is_active = 1 and type=? and trigger_events = ? and  (class=? or class=0) order by nudge_order limit 1';
        return database.query(sql, [type, event, studentClass]);
    }

    static getSurveyByTypeAndEvent(database, event, locale, studentClass) {
        const sql = "SELECT * FROM survey_details WHERE is_active = 1 and trigger_event = ? and (locale=? or locale='all') and (class=? or class=0)";
        return database.query(sql, [event, locale, studentClass]);
    }

    static getInAppPopUpData(database, page, studentClass, versionCode) { // 0.0003 sec
        const sql = 'select * from inapp_popup where student_class in ("all", ?) and page=? and ((end_time >= CURRENT_TIMESTAMP and start_time <=CURRENT_TIMESTAMP) or end_time is null) and min_version_code <= ? and max_version_code >= ? and is_active=1 order by priority';
        return database.query(sql, [studentClass, page, versionCode, versionCode]);
    }

    static getInAppPopUpDnPropertyData(database, bucket, name) { // 0.0003 sec
        const sql = 'SELECT * from dn_property WHERE bucket=? and name=? and is_active=1 limit 1';
        return database.query(sql, [bucket, name]);
    }
};
