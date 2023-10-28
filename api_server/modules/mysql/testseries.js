/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-11 13:33:31
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-09-26T19:18:47+05:30
*/
const Utility = require('../utility');

module.exports = class TestSeries {
    static getTestSeriesEligibleScoreStatus(database, testId) {
        const sql = 'select (CASE WHEN `unpublish_time`>= NOW() AND publish_time <= NOW() THEN 1 ELSE 0 END) as eligible_status FROM testseries WHERE test_id = ?';
        return database.query(sql, [testId]);
    }

    static isTestStarted(database, testId) {
        const sql = 'select (CASE WHEN  publish_time <= NOW() THEN 1 ELSE 0 END) as eligible_status,publish_time,now() as now FROM testseries WHERE test_id = ?';
        return database.query(sql, [testId]);
    }

    static getActiveTestsByAppModuleWithCompletedSubscriptionData(database, class_code, type, student_id) {
        let sql = '';
        sql = "SELECT  t1.*,t2.id,t2.student_id,t2.status FROM (SELECT * FROM testseries where is_active=1 and class_code = ? and app_module = ? ) as t1 LEFT JOIN (SELECT * FROM testseries_student_subscriptions where student_id = ? and status = 'COMPLETED') as t2 ON t1.test_id = t2.test_id  ORDER BY `test_id` DESC";
        return database.query(sql, [class_code, type, student_id, class_code]);
    }

    static getTestSeriesById(database, testId) {
        let sql = '';
        sql = 'SELECT * FROM testseries WHERE test_id = ?';
        return database.query(sql, [testId]);
    }

    static getActiveByType(database, class_code, type) {
        let sql = '';
        sql = 'SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND type = ? ORDER BY test_id DESC';
        return database.query(sql, [class_code, type]);
    }

    static getActiveByAppModule(database, class_code, type) {
        let sql = '';
        sql = 'SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module = ? ORDER BY test_id DESC';
        return database.query(sql, [class_code, type]);
    }

    static getActiveByAppModuleNew(database, class_code, type, limit, page) {
        let sql = '';
        sql = `SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module = ? ORDER BY test_id DESC LIMIT ${limit} OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [class_code, type]);
    }

    static getActiveByAppModuleWithMatrix(database, class_code, type) {
        let sql = '';
        sql = 'SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN ?  ORDER BY test_id DESC';
        return database.query(sql, [class_code, [type]]);
    }

    static getActiveByAppModuleWithMatrixByCourse(database, class_code, type) {
        const sql = 'SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN ?  GROUP BY course ';
        return database.query(sql, [class_code, [type]]);
    }

    static getActiveByAppModuleWithMatrixPaid(database, class_code, type, student_id) {
        const sql = "Select a.* from (SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN('COURSE')) as a left join`course_details` as b on a.course_id = b.assortment_id left join`package` as c on b.assortment_id = c.assortment_id left join student_package_subscription as d on c.id = d.new_package_id where d.is_active = 1 and d.start_date < now() and d.end_date > now() and d.student_id = ? UNION SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN ? ORDER BY`test_id` DESC";
        return database.query(sql, [class_code, student_id, class_code, [type]]);
    }

    static getActiveByAppModuleWithMatrixPaidByCourse(database, class_code, type, student_id) {
        // const sql = "Select a.test_id , a.class_code, a.app_module, a.course, a.subject_code, a.chapter_code, a.title, a.description , a.duration_in_min, a.publish_time , a.unpublish_time, a.is_active, a.difficulty_type , a.type ,a.rule_id, a.is_sectioned, a.is_deleted, a.created_on, a.no_of_questions, a.is_reward, a.is_shuffle, a.solution_pdf, a.solution_playlist, b.demo_video_thumbnail as image_url ,a.course_id, a.is_free, a.category, count(*) as total_tests from (SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN('COURSE')) as a left join`course_details` as b on a.course_id = b.assortment_id left join`package` as c on b.assortment_id = c.assortment_id left join student_package_subscription as d on c.id = d.new_package_id where d.is_active = 1 and d.start_date < now() and d.end_date > now() and d.student_id = ? GROUP BY test_id UNION SELECT *, count(*) as total_tests FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN ? GROUP BY test_id ORDER BY`test_id` DESC";
        const sql = "Select a.test_id , a.class_code, a.app_module, a.course, a.subject_code, a.chapter_code, a.title, a.description , a.duration_in_min, a.publish_time , a.unpublish_time, a.is_active, a.difficulty_type , a.type ,a.rule_id, a.is_sectioned, a.is_deleted, a.created_on, a.no_of_questions, a.is_reward, a.is_shuffle, a.solution_pdf, a.solution_playlist, b.demo_video_thumbnail as image_url ,a.course_id, a.is_free, a.category,a.created_at,a.updated_at, count(*) as total_tests from (SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN('COURSE')) as a left join`course_details` as b on a.course_id = b.assortment_id left join`package` as c on b.assortment_id = c.assortment_id left join student_package_subscription as d on c.id = d.new_package_id where d.is_active = 1 and d.start_date < now() and d.end_date > now() and d.student_id = ? GROUP BY test_id UNION SELECT *, count(*) as total_tests FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN ? GROUP BY test_id ORDER BY`test_id` DESC";
        return database.query(sql, [class_code, student_id, class_code, [type]]);
    }

    static getSingleByAppModuleWithMatrix(database, class_code, type, testId) {
        let sql = '';
        sql = 'SELECT * FROM testseries WHERE is_active = 1 AND class_code = ? AND app_module IN ? AND test_id= ?';
        return database.query(sql, [class_code, [type], testId]);
    }

    static getSingleByAppModuleWithMatrixNew(database, type, testId) {
        let sql = '';
        sql = 'SELECT * FROM testseries WHERE is_active = 1 AND  app_module IN ? AND test_id= ?';
        return database.query(sql, [[type], testId]);
    }

    static getAll(database, class_code) {
        let sql = '';
        sql = 'SELECT * FROM `testseries` WHERE `is_active` = 1 AND class_code = ? ORDER BY test_id DESC';
        return database.query(sql, [class_code]);
    }

    // static getAllNew(database,class_code,limit,page){
    // 	let sql = "";
    // 	sql =  "SELECT * FROM `testseries` WHERE `is_active` = 1 AND class_code = ? ORDER BY test_id DESC LIMIT "+ limit + " OFFSET " + Utility.getOffset(page, limit);
    // 	return database.query(sql,[class_code]);

    // }

    static getUpcoming(database, class_code) {
        let sql = '';
        sql = 'SELECT * FROM `testseries` WHERE `publish_time` > NOW() AND is_active = 1 AND class_code = ? ORDER BY test_id DESC';
        console.log(sql);
        return database.query(sql, [class_code]);
    }

    // static getUpcomingNew(database,class_code,limit,page){
    // 	let sql = "";
    // 	sql =  "SELECT * FROM `testseries` WHERE `publish_time` > NOW() AND is_active = 1 AND class_code = ? ORDER BY test_id DESC LIMIT "+ limit + " OFFSET " + Utility.getOffset(page, limit);
    // 	console.log(sql);
    //   return database.query(sql,[class_code]);
    // }

    static getActive(database, class_code) {
        let sql = '';
        sql = 'SELECT * FROM `testseries` WHERE `is_active` = 1 AND class_code = ? ORDER BY test_id DESC';
        return database.query(sql, [class_code]);
    }

    static getDailyQuizDataType(student_class, limit, database) {
        let sql = '';
        sql = `SELECT  * FROM \`testseries\` WHERE \`is_active\` = 1 AND class_code = ? and app_module like '%QUIZ%' ORDER BY test_id DESC limit ${limit}`;
        return database.query(sql, [student_class]);
    }

    // static getActiveWithSubs(database,class_code){
    // 	let sql =  "SELECT a.* FROM (select * from testseries WHERE is_active = 1 AND class_code = ? AND type='DAILY_QUIZ' ORDER BY test_id DESC) as a left join testseries_student_subscriptions as b on a.test_id=b.test_id where b.test_id is null  Limit 5";
    // 	console.log(sql);
    //    return database.query(sql,[class_code]);

    // }
    static getTestSeriesDataById(database, testId) {
        let sql = '';
        sql = 'SELECT * FROM `testseries` WHERE `test_id` = ?';
        return database.query(sql, [testId]);
    }

    static insertStudentSubscription(database, obj) {
        let sql = '';
        sql = 'INSERT INTO `testseries_student_subscriptions` SET ?';
        return database.query(sql, obj);
    }

    static getTestSubscriptionByStatusAndStudentIdAndTestId(database, testId, studentId) {
        const params = [];
        params.push(testId);
        params.push(studentId);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_subscriptions WHERE test_id = ? AND student_id= ?';
        return database.query(sql, params);
    }

    static getTestSubscriptionById(database, testsubscriptionId) {
        const params = [];
        params.push(testsubscriptionId);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_subscriptions WHERE id = ?';
        return database.query(sql, params);
    }

    static getTestSubscriptionByTestId(database, testid) {
        const params = [];
        params.push(testid);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_subscriptions where test_id = ? ';
        return database.query(sql, params);
    }

    static updateTestSubscriptionStatus(database, testsubscriptionId, status) {
        const params = [];
        params.push(status);
        params.push(testsubscriptionId);
        let sql = '';
        sql = 'UPDATE testseries_student_subscriptions SET status = ? WHERE id = ?';
        return database.query(sql, params);
    }

    static saveReportcard(database, obj) {
        let sql = '';
        sql = 'INSERT INTO `testseries_student_reportcards` SET ?';
        return database.query(sql, obj);
    }

    static updateReportcard(database, obj) {
        console.log(obj);
        const params = [];
        params.push(obj);
        params.push(obj.obj1);
        let sql = '';
        sql = 'UPDATE `testseries_student_reportcards` SET ?  WHERE `test_subscription_id` = ?';
        return database.query(sql, params);
    }

    static updateSimpleclasscode(database, obj) {
        const params = [];
        // obj.class_code = 40
        params.push(obj.class_code);
        params.push(obj.id);
        // console.log(obj.id);
        let sql = '';
        sql = 'UPDATE `testseries_student_subscriptions` SET class_code = ? WHERE `id` = ?';
        return database.query(sql, params);
    }

    static getResultByTestSubscriptionId(database, testsubscriptionId) {
        const params = [];
        params.push(testsubscriptionId);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_results WHERE test_subscription_id = ?';
        return database.query(sql, params);
    }

    static getRepostCardByTestSubscriptionId(database, testsubscriptionId) {
        const params = [];
        params.push(testsubscriptionId);
        let sql = '';
        sql = 'SELECT * FROM testseries_student_reportcards WHERE test_subscription_id = ?';
        return database.query(sql, params);
    }

    static getleaderboardByTestId(database, testId) {
        const sql = "Select d.test_id, d.score_s as eligiblescore, d.submit_time as created_at,  Case when length(e.student_fname)>1 then concat(e.student_fname,' ',case when e.student_lname is NULL then '' else student_lname end) else e.student_username end as student_username, e.student_fname,e.img_url from (Select b.test_id, b.score_s, c.student_id, c.score_i, c.submit_time, c.taken_from from (Select a.test_id, a.eligiblescore as score_s from (SELECT test_id, student_id, eligiblescore, created_at FROM `testseries_student_reportcards` where test_id = ? UNION SELECT quiz_id, student_id, sum(score) as eligiblescore, max(created_at) as created_at FROM `quiz_student_question` where quiz_id = ? and eligible = 1 group by quiz_id, student_id) as a order by score_s DESC limit 1) as b left JOIN (SELECT test_id, student_id, eligiblescore as score_i, created_at as submit_time, 'TEST' as taken_from FROM `testseries_student_reportcards` where test_id = ?  UNION SELECT quiz_id, student_id, sum(score) as score_i, max(created_at) as submit_time, 'QUIZ' as taken_from FROM `quiz_student_question` where quiz_id = ?  and eligible = 1  group by quiz_id, student_id) as c on b.test_id = c.test_id and b.score_s=c.score_i) as d left join students as e on d.student_id = e.student_id left join testseries as f on d.test_id = f.test_id order by d.score_s desc, d.submit_time ASC";
        return database.query(sql, [testId, testId, testId, testId]);
    }
    // static getleaderboardByQuizId(database,quiz_id){
    // 	let params = []
    // 	params.push(quiz_id)
    // 	let sql = ""
    // 	sql = "SELECT quiz_id , Q.student_id, sum(score) as eligiblescore, max(created_at) as created_at,ST.student_username,ST.img_url FROM `quiz_student_question` AS Q LEFT JOIN students AS ST ON Q.student_id = ST.student_id WHERE quiz_id = ? group by quiz_id, student_id ORDER BY eligiblescore desc, created_at ASC LIMIT 10"
    // 	return database.query(sql,params)
    // }

    static getTestSeriesData(database, studentId, testId) {
        const sql = 'select * from testseries_student_subscriptions where student_id = ? and test_id = ?';
        return database.query(sql, [studentId, testId]);
    }

    static getReportCardByTestSubscriptionId(database, testsubscriptionId) { // 40 ms
        const params = [];
        params.push(testsubscriptionId);
        let sql = '';
        sql = 'SELECT section_code,title,desciption FROM testseries_student_reportcards WHERE test_subscription_id = ?';
        return database.query(sql, params);
    }

    static getReportCardByTestIdandStudentId(database, studentId, testId) {
        const sql = 'SELECT * from testseries_student_reportcards WHERE test_id = ? and student_id = ?';
        return database.query(sql, [testId, studentId]);
    }

    static getMicroConceptFromQuestionId(database, questionIds) {
        const sql = 'SELECT question_id as questionId, target_course as target, microconcept as mcId from questions_meta WHERE question_id in (?) ';
        return database.query(sql, [questionIds]);
    }

    static getQidFromMcId(database, mcId, target) {
        const sql = 'SELECT question_id, mc_id as mcId, target_group as target FROM pzn_similar WHERE mc_id in (?) and target_group in (?) group by mc_id, target_group';
        return database.query(sql, [mcId, target]);
    }

    static getMcCourseMappingFromMcId(database, mcId) {
        const sql = 'select * from mc_course_mapping where mc_id in (?)';
        return database.query(sql, [mcId]);
    }

    static getSubscribedTestsForCourse(database, course, studentId) {
        // const sql = 'SELECT a.*, b.status FROM testseries as a left join testseries_student_subscriptions as b on a.test_id = b.test_id WHERE a.course = ? and a.is_active = 1 and student_id = ? group by a.test_id';
        // return database.query(sql, [course, studentId]);

        const sql = 'SELECT a.*, b.status FROM testseries as a left join (SELECT * from testseries_student_subscriptions where student_id = ?) as b on a.test_id = b.test_id WHERE a.course = ? and a.is_active = 1 group by a.test_id';
        return database.query(sql, [studentId, course]);
    }

    static getUnsubscribedAvailableTestsIfSubForCourse(database, course, subscribedIds, studentClass) {
        const tests = ['TEST', 'TEST1', 'DNST'];
        const sql = 'SELECT * FROM testseries WHERE is_active = 1 AND course = ? AND app_module in (?) AND test_id NOT in (?) and class_code = ? group by test_id order by publish_time ASC';
        return database.query(sql, [course, tests, subscribedIds, studentClass]);
    }

    static getUnsubscribedAvailableTestsForCourse(database, course, studentClass) {
        const sql = 'SELECT * FROM testseries WHERE is_active = 1 AND course = ?  and app_module in (\'TEST\',\'TEST1\',\'DNST\') and class_code = ? group by test_id';
        return database.query(sql, [course, studentClass]);
    }

    static getUnsubscribedPaidAvailableTestsIfSubForCourse(database, course, subscribedIds, studentId, studentClass) {
        const tests = 'COURSE';
        const sql = 'SELECT * FROM testseries  as a left join course_details as b on a.course_id = b.assortment_id left join package as c on b.assortment_id = c.assortment_id left join student_package_subscription as d on c.id = d.new_package_id where d.is_active = 1 and d.start_date < now() and d.end_date > now() and d.student_id = ? and a.course = ? AND a.app_module = ? AND a.test_id not in (?) and a.class_code = ? and a.is_active=1 group by a.test_id order by a.publish_time asc';
        return database.query(sql, [studentId, course, tests, subscribedIds, studentClass]);
    }

    static getUnsubscribedPaidAvailableTestsForCourse(database, course, studentId, studentClass) {
        const tests = 'COURSE';
        const sql = 'SELECT * FROM testseries  as a left join course_details as b on a.course_id = b.assortment_id left join package as c on b.assortment_id = c.assortment_id left join student_package_subscription as d on c.id = d.new_package_id where d.is_active = 1 and d.start_date < now() and d.end_date > now() and d.student_id = ? and a.course = ? AND a.app_module = ? and a.class_code = ? and a.is_active=1 group by a.test_id order by a.publish_time asc';
        return database.query(sql, [studentId, course, tests, studentClass]);
    }

    static getQuestionIdsFromTestBank(database, testQuestionIds) {
        const sql = 'SELECT doubtnut_questionid as qid, id as testId FROM testseries_question_bank WHERE id in (?) and doubtnut_questionid is not null';
        return database.query(sql, [testQuestionIds]);
    }

    static getDiagTestData(database, studentId) {
        const sql = 'select * from (SELECT *  FROM `testseries` WHERE `difficulty_type` LIKE \'DIAG_TEST\') as a inner join testseries_student_subscriptions as b on a.test_id=b.test_id and b.student_id=? order by a.test_id DESC limit 5';
        return database.query(sql, [studentId]);
    }

    static getQuestionDataByTestId(database, testId) {
        const sql = 'select section_code, count(questionbank_id) as noq from testseries_questions where test_id=? and is_active=1 group by section_code';
        return database.query(sql, [testId]);
    }

    static getResultDataByTestIdSectionWise(database, testId, studentId) {
        const sql = 'select * from testseries_student_results where test_id=? and student_id=?';
        return database.query(sql, [testId, studentId]);
    }

    static getTimeForTestRegistration(database, testId, studentId, subscriptionId) {
        // const sql = 'select tss.test_id ,tss.student_id ,(case when (t.publish_time >tss.registered_at) then t.publish_time else tss.registered_at end) as registered_at from testseries_student_subscriptions tss left join testseries t on tss.test_id =t.test_id  where tss.student_id =? and tss.id = ? and t.test_id = ?';
        const sql = 'select tss.test_id ,tss.student_id ,tss.registered_at ,t.publish_time from testseries_student_subscriptions tss left join testseries t on tss.test_id =t.test_id  where tss.student_id =? and tss.id = ? and t.test_id = ?';
        return database.query(sql, [studentId, subscriptionId, testId]);
    }

    static getTestSeriesEligibleScoreStatusScholarship(database, testId, registerTime) {
        const sql = 'select (CASE WHEN unpublish_time >= NOW() AND publish_time <= NOW() and NOW() >= ? and NOW() <= DATE_ADD(?, INTERVAL duration_in_min MINUTE) THEN 1 ELSE 0 END) as eligible_status FROM testseries WHERE test_id = ?';
        return database.query(sql, [registerTime, registerTime, testId]);
    }
};
