/*
* @Author: Xesloohc
* @Date:   2018-12-10 11:19:44
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-08-06T21:06:56+05:30
*/
const Utility = require('../utility');

module.exports = class StudentTestsSubsriptions {

    static updateStartTime(database,testSubscriptionId,studentId){
        let sql = 'update testseries_student_subscriptions set registered_at = NOW() where id = ? and student_id = ?'
        return database.query(sql,[testSubscriptionId,studentId])
    }
    static updateCompleteTime(database,testSubscriptionId,studentId){
        let sql = 'update testseries_student_subscriptions set completed_at = NOW() where id = ? and student_id = ?'
        return database.query(sql,[testSubscriptionId,studentId])
    }
    static getStudentTestsSubsriptionsByStudentIdAndTestId(database, studentId, testId) {
        const params = [];
        params.push(studentId, testId);
        let sql = '';
        sql = 'SELECT id,student_id,test_id,class_code,status FROM testseries_student_subscriptions WHERE student_id = ? AND test_id = ? ORDER BY id DESC';
        return database.query(sql, params);
    }

    static getStudentTestsSubsriptionsByStudentId(database, studentId) {
        const params = [];
        params.push(studentId);
        let sql = '';
        sql = 'SELECT id,student_id,test_id,class_code,status FROM testseries_student_subscriptions WHERE student_id = ? ORDER BY id DESC';
        return database.query(sql, params);
    }

    static getStudentTestsSubsriptionsByStudentIdNew(database, studentId, limit, page) {
        const params = [];
        params.push(studentId);
        params.push(limit);
        let sql = '';
        sql = `SELECT id,student_id,test_id,class_code,status FROM testseries_student_subscriptions WHERE student_id = ? ORDER BY id DESC LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, params);
    }

    // due to limit we added another query
    static get1StudentTestsSubsriptionsByStudentId(database, studentId) {
        const params = [];
        params.push(studentId);
        let sql = '';
        sql = 'SELECT  id,student_id,test_id,class_code,status FROM testseries_student_subscriptions WHERE student_id = ? ORDER BY id DESC limit 5';
        return database.query(sql, params);
    }

    static getCompletedTestSubIds(database, testId) {
        const sql = 'SELECT  id,student_id,test_id,class_code,status FROM testseries_student_subscriptions WHERE test_id = ? AND status = \'COMPLETED\'';
        return database.query(sql, [testId]);
    }

    // static insertStudentTestSubscription(database,studentId,testId,status){
    // 	let params = []
    // 	params.push(testId)
    // 	params.push(studentId)
    // 	let sql = ""
    // 	sql = ""
    // 	return database.query(sql,params)
    // }
};
