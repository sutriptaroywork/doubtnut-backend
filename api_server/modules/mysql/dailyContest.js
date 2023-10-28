/**
 * @Author: xesloohc
 * @Date:   2019-05-06T15:04:29+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-07-29T19:02:07+05:30
 */

module.exports = class Quiz {
    static getDailyContestDataType(type, button, limit, student_class, database) {
        const sql = `select cast(id as char(50)) as id, '${type}' as type,contest_name as title, logo as image_url, headline as description, '${button[0]}' as button_text,'${button[2]}' as button_bg_color,'${button[1]}' as button_text_color from contest_details LIMIT ${limit}`;
        return database.query(sql);
    }
};
