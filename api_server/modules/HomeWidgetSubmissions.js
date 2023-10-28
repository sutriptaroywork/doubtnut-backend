module.exports = class HomeWidgetSubmissions {
    static insertUserResponse(database, obj) {
        const sql = 'insert into home_widget_submissions  SET ? ';
        return database.query(sql, obj);
    }

    static getAllUserSubmissionByWidgetType(database, studentId, widgetType) {
        const sql = 'SELECT * FROM home_widget_submissions where student_id = ? and widget_name = ?';
        return database.query(sql, [studentId, widgetType]);
    }
};
