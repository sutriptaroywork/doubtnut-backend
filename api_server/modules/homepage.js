module.exports = class Homepage {
    // --------- HOMEPAGE - WIDGETS table  ----------//

    static getAllActiveHomePageWidgets(database, student_locale) {
    // let sql = "select * from homepage_widgets_test where locale ='" + student_locale + "' and is_active = 1 ";
        const sql = 'select * from homepage_widgets where locale =? and is_active = 1 ';
        return database.query(sql, [student_locale]);
    }
};
