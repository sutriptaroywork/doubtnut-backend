const moment = require('moment');

module.exports = class Scheduler {
    static checkQid(database, questionId) {
        const sql = 'SELECT id FROM liveclass_scheduler_logs WHERE question_id = ? and created_at > now() - interval 1 day and is_active = 1';
        return database.query(sql, [questionId]);
    }

    static markInActive(database, questionId) {
        const sql = 'update liveclass_scheduler_logs set is_active = 0 where question_id = ? and created_at > now() - interval 1 day';
        return database.query(sql, [questionId]);
    }

    static checkQidInCurrentHour(database, questionId) {
        const sql = `SELECT id FROM liveclass_scheduler_logs WHERE question_id = ${questionId} and is_active = 1 and created_at > '${moment().add(5, 'h').add(30, 'minutes').format('YYYY-MM-DD HH:00:00')}'`;
        return database.query(sql);
    }

    static checkEntityId(database, entityId) {
        const sql = 'SELECT cd.is_free  from (SELECT * FROM course_resources where resource_type in (1,4,8) and resource_reference  = ? ) as cr left JOIN (select * from course_resource_mapping where resource_type  = \'resource\') as crm on cr.id = crm.course_resource_id left join (select * from course_details ) as cd on cd.assortment_id = crm.assortment_id';
        return database.query(sql, [entityId]);
    }
    
    static checkEntityIdForLiveClass(database, entityId) {
        const sql = `SELECT stream_status  FROM classzoo1.course_resources where resource_type in (1,4,8) and 
        resource_reference = ?`
        return database.query(sql, [entityId])
    }

};
