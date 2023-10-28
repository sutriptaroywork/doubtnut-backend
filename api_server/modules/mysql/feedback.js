module.exports = class feedback {
    static submitFeedbackonHomepage(database, student_id, resource_type, resource_id, feed) {
        const insertObj = {};
        insertObj.resource_type = resource_type;
        insertObj.resource_id = resource_id;
        insertObj.is_like = feed;
        insertObj.student_id = student_id;
        insertObj.created_at = new Date();
        const sql = 'INSERT  IGNORE into user_engagement_feedback set ?';
        return database.query(sql, [insertObj]);
    }

    static getFeedback(database, student_id, resource_type, resource_id) {
        const sql = 'SELECT is_like from user_engagement_feedback where student_id= ? and resource_type= ? and resource_id=? order by created_at desc limit 1';
        console.log(sql);
        return database.query(sql, [student_id, resource_type, resource_id]);
    }

    static submitStudentRating(database, student_id, rating, feedbackTxt) {
        const insertObj = {};
        insertObj.student_id = student_id;
        insertObj.rating = rating;
        insertObj.feedback = feedbackTxt;
        const sql = 'INSERT into student_rating set ?';
        return database.query(sql, insertObj);
    }

    static usAppFeedback(database, obj) {
        const sql = 'INSERT into feedback_subscription set ?';
        return database.query(sql, obj);
    }

    static getUserFeedbackPopupData(database, category, locale, page) {
        const sql = `SELECT id, type, display from feedback_properties where locale = '${locale}' and page = '${page}' and category = '${category}'`;
        return database.query(sql);
    }

    static updateFeedbackSelections(database, selection, page, studentId, entityId) {
        const insertObj = {};
        insertObj.student_id = studentId;
        insertObj.entity_id = entityId;
        insertObj.page = page;
        insertObj.selection = selection;
        const sql = 'INSERT INTO feedback_selections SET ?';
        return database.query(sql, [insertObj]);
    }

    static getPrefrencesData(database, parentId, locale, page) {
        const sql = `select a.title,a.description, b.name, b.display from (select id, title, description from feedback_prefrences where locale = '${locale}' and page = '${page}' and parent_id = ${parentId}) as a join (select id,parent_id, name, display from feedback_prefrences_properties) as b on a.id=b.parent_id`;
        return database.query(sql);
    }

    static getFeedbackSelectionsId(database, student_id, entity_id, page, selection) {
        const sql = `select id from feedback_selections where student_id = ${student_id} and entity_id = ${entity_id} and page = '${page}' and selection = ${selection}`;
        return database.query(sql);
    }

    static submitUserFeedbackPrefrences(database, studentId, parent_id, selection) {
        const insertObj = {};
        insertObj.student_id = studentId;
        insertObj.parent_id = parent_id;
        insertObj.selection = selection;
        const sql = 'INSERT INTO feedback_prefrences_selections SET ?';
        return database.query(sql, [insertObj]);
    }

    static getSelectionsId(database, type) {
        const sql = `select id from feedback_properties where type = '${type}'`;
        return database.query(sql);
    }

    static getUserSelectedPrefrenceId(database, name) {
        const sql = `select id from feedback_prefrences_properties where name = '${name}'`;
        return database.query(sql);
    }
};
