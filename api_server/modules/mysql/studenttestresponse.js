/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-22 15:36:46
*/
/*
* @Author: Xesloohc
* @Date:   2018-12-10 11:19:44
* @Last Modified by:   XesLoohc
* @Last Modified time: 2018-12-25 18:50:32
*/

module.exports = class StudentTestResponse {
    static saveStudentResponse(database, obj) {
        let sql = '';
        sql = 'INSERT IGNORE INTO `testseries_student_responses` SET ? ';
        return database.query(sql, [obj]);
    }

    static updateStudentResponse(database, obj) {
        const params = [];
        params.push(obj);
        params.push(obj.test_subscription_id);
        params.push(obj.questionbank_id);
        let sql = '';
        sql = 'UPDATE `testseries_student_responses` SET ? WHERE `test_subscription_id` = ? AND `questionbank_id` = ?';
        return database.query(sql, params);
    }

    static getStudentResponseByTestSubscribeId(database, testsubscriptionId) {
        // console.log(testsubscriptionId);
        const params = [];
        params.push(testsubscriptionId);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_responses WHERE test_subscription_id = ? ';
        // console.log(sql);
        return database.query(sql, params);
    }

    static getStudentResponse(database, testsubscriptionId, questionbankId) {
        const params = [];
        params.push(testsubscriptionId);
        params.push(questionbankId);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_responses WHERE test_subscription_id = ? AND questionbank_id = ?';
        return database.query(sql, params);
    }
};
