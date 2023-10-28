/*
* @Author: Xesloohc
* @Date:   2018-12-10 11:19:44
* @Last Modified by:   XesLoohc
* @Last Modified time: 2018-12-25 18:55:22
*/

module.exports = class TestSections {
    static getAllTestSectionByTestSeriesId(database, testId) {
        const sql = 'SELECT * FROM `testseries_sections` WHERE test_id = ? ORDER BY order_pref ASC';
        return database.query(sql, [testId]);
    }

    static getActiveTestSectionByTestSeriesId(database, testId) {
        const sql = 'SELECT * FROM `testseries_sections` WHERE test_id = ? AND is_active = 1 ORDER BY order_pref ASC';
        return database.query(sql, [testId]);
    }

    static getTestSectionByTestSeriesId(database, testId) { // 50 ms
        const sql = 'SELECT section_code,title,description FROM `testseries_sections` WHERE test_id = ? AND is_active = 1 ORDER BY order_pref ASC';
        return database.query(sql, [testId]);
    }
};
