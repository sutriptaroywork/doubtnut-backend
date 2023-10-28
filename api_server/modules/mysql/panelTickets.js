module.exports = class panelTickets {
    static fetchPackageDetails(database, studentId) {
        const sql = "select DISTINCT a.*, sps.is_active, p.name, p.assortment_id as subcategory_id,p.duration_in_days, p.id as package_id, p.type as package_type, p.is_last as last_emi_package, q.pdf_url, cd.assortment_type, p.batch_id, cd.meta_info from (select id, amount_paid,master_subscription_start_date,master_subscription_end_date,next_part_payment_amount,next_part_payment_date,type,payment_type,student_id,package_amount,master_variant_id,new_package_id,package_duration,emi_order,new_package_id as master_package_id, package_validity, subscription_id, total_amount, created_at, next_package_id, next_ps_id, is_refunded, refund_amount, coupon_code from classzoo1.payment_summary where student_id =? and next_package_id is null  and CURRENT_DATE <= package_validity) as a left join student_package_subscription as sps on a.subscription_id=sps.id  left join package as p on p.id=a.new_package_id left join course_details as cd on p.assortment_id=cd.assortment_id left join course_details_banners as q on p.assortment_id=q.assortment_id and p.batch_id=q.batch_id  where cd.assortment_type in ('course','subject', 'chapter') group by a.id";
        return database.query(sql, [studentId]);
    }

    static getPackageDetailsFromPackageId(database, packageId) {
        const sql = 'select * from package where id=?';
        return database.query(sql, [packageId]);
    }

    static fetchCatDetails(database) {
        const sql = 'select id,name from panel_student_query_category where is_active=1';
        return database.query(sql);
    }

    static fetchSubCatDetails(database, categoryId) {
        const sql = 'select id,name from panel_student_query_subcategory where category_id =? and is_active=1';
        return database.query(sql, [categoryId]);
    }

    static fetchAllTickets(database) {
        const sql = "select a.*,psqc.name as category,psqs.name as subcategory  from  panel_student_query_ticket as a  left join panel_student_query_category as psqc on a.category_id=psqc.id left join panel_student_query_subcategory as psqs on psqs.id=a.subcategory_id where a.status <> 'RESOLVED' ORDER BY a.id DESC";
        return database.query(sql);
    }

    static insertTicket(database, data) {
        const sql = 'INSERT into panel_student_query_ticket set ?';
        return database.query(sql, data);
    }

    static updateTicket(database, data, ticketId) {
        const sql = 'UPDATE panel_student_query_ticket set ? where id=?';
        return database.query(sql, [data, ticketId]);
    }

    static insertActionIntoActivity(database, data) {
        const sql = 'INSERT into panel_student_query_activity set ?';
        return database.query(sql, data);
    }

    static insertSpocsIntoAssignedSpocs(database, data) {
        const sql = 'INSERT into panel_student_query_assigned_spocs set ?';
        return database.query(sql, data);
    }

    static fetchSpocUsingSubCategoryId(database, subcategoryId) {
        const sql = 'SELECT spoc_email from panel_student_query_subcategory_spoc_mapping where subcategory_id =?';
        return database.query(sql, [subcategoryId]);
    }

    static getAssignedSpocsEmail(database, ticketId) {
        const sql = 'SELECT distinct email_id from panel_student_query_assigned_spocs where ticket_id =?';
        return database.query(sql, [ticketId]);
    }

    static getMailIdByWhichTicketCreated(database, ticketId) {
        const sql = "SELECT email_id from panel_student_query_activity where ticket_id =? and action ='CREATE'";
        return database.query(sql, [ticketId]);
    }

    static getResolvedSpoc(database, ticketId) {
        const sql = "SELECT email_id,comments from panel_student_query_activity where action='RESOLVE' and entity_type ='SPOC' and ticket_id =?";
        return database.query(sql, [ticketId]);
    }

    static updateStatusIntoTicket(database, status, ticketId) {
        const sql = 'UPDATE panel_student_query_ticket SET status =?  WHERE id =?';
        return database.query(sql, [status, ticketId]);
    }

    static updateIsActivePSQAS(database, ticketId) {
        const sql = 'UPDATE panel_student_query_assigned_spocs set is_active =0 WHERE ticket_id=?';
        return database.query(sql, [ticketId]);
    }

    static ticketAssignedToSpocs(database, data) {
        const sql = 'INSERT into panel_student_query_activity set ?';
        return database.query(sql, data);
    }

    static fetchSpocTickets(database, emailId) {
        const sql = "select a.*,psqc.name as category,psqs.name as subcategory,psqa.email_id as email  from (select distinct ticket_id as ticket_id, email_id from panel_student_query_assigned_spocs where email_id =? AND is_active=1 AND ticket_id NOT IN (select distinct ticket_id as ticket_id from panel_student_query_activity where email_id = ? and action='CREATE')) as psqa left join panel_student_query_ticket as a on a.id=psqa.ticket_id left join panel_student_query_category as psqc on a.category_id=psqc.id left join panel_student_query_subcategory as psqs on psqs.id=a.subcategory_id where a.status not in ('RESOLVED') ORDER BY a.id DESC";
        return database.query(sql, [emailId, emailId]);
    }

    static fetchTicketsCreatedBySpoc(database, emailId) {
        const sql = 'select a.*,psqc.name as category,psqs.name as subcategory,psqa.email_id as email  from (select distinct ticket_id as ticket_id, email_id from panel_student_query_activity where email_id = ? and action="CREATE") as psqa left join panel_student_query_ticket as a on a.id=psqa.ticket_id left join panel_student_query_category as psqc on a.category_id=psqc.id left join panel_student_query_subcategory as psqs on psqs.id=a.subcategory_id where (a.status <> "RESOLVED" || (a.status = "RESOLVED" and  a.updated_at >= NOW() - INTERVAL 48 HOUR)) ORDER BY a.id DESC';
        return database.query(sql, [emailId]);
    }

    static fetchBdaTickets(database, emailId) {
        const sql = 'select a.*,psqc.name as category,psqs.name as subcategory,psqa.email_id as email  from (select distinct ticket_id as ticket_id, email_id from panel_student_query_activity where email_id = ? and action="CREATE") as psqa left join panel_student_query_ticket as a on a.id=psqa.ticket_id left join panel_student_query_category as psqc on a.category_id=psqc.id left join panel_student_query_subcategory as psqs on psqs.id=a.subcategory_id where (a.status <> "RESOLVED" || (a.status = "RESOLVED" and  a.updated_at >= NOW() - INTERVAL 48 HOUR)) ORDER BY a.id DESC';
        return database.query(sql, [emailId]);
    }

    static ticketMsgAdded(database, resolvedMsg, status, ticketId, spocEmail) {
        const sql = 'UPDATE panel_student_query_activity SET resolved_msg =?, action =? WHERE ticket_id =? AND email_id =?';
        return database.query(sql, [resolvedMsg, status, ticketId, spocEmail]);
    }

    static fetchSingleTicket(database, ticketId) {
        const sql = 'select a.*,psqc.name as category,psqs.name as subcategory  from panel_student_query_ticket AS a left join panel_student_query_category as psqc on a.category_id=psqc.id left join panel_student_query_subcategory as psqs on psqs.id=a.subcategory_id where a.id =?';
        return database.query(sql, [ticketId]);
    }

    static fetchTicketActions(database, ticketId) {
        const sql = 'select email_id as email,created_at as assigned,action,updated_at as updated_by_spoc,resolved_msg  from panel_student_query_activity where ticket_id =?';
        return database.query(sql, [ticketId]);
    }

    static fetchTicketActivity(database, ticketId) {
        const sql = 'select * from panel_student_query_activity where ticket_id =?';
        return database.query(sql, [ticketId]);
    }

    static fetchTicketSpocsUsingTicketID(database, ticketId) {
        const sql = 'select * from panel_student_query_assigned_spocs where ticket_id =?';
        return database.query(sql, [ticketId]);
    }

    static fetchActionsUsingStatusAndEntityType(database, status, entityType) {
        const sql = 'select action from panel_student_query_ticket_actions where status =? and entity_type =?';
        return database.query(sql, [status, entityType]);
    }

    static CheckActionUsingSpocEmail(
        database,
        ticketId,
        emailId,
        entityType,
        id,
    ) {
        const sql = 'select * from panel_student_query_activity where ticket_id =? and email_id =? and entity_type =? and action=? and id>? order by id desc';
        return database.query(sql, [
            ticketId,
            emailId,
            entityType,
            'RESOLVE',
            id,
        ]);
    }

    static fetchLastAssignedRow(database, ticketId) {
        const sql = 'select id from panel_student_query_activity where ticket_id =? and action=?  order by id desc';
        return database.query(sql, [ticketId, 'ASSIGN']);
    }

    static fetchAssignedSpocUsingActivtyId(database, activityId) {
        const sql = 'select email_id from panel_student_query_assigned_spocs where activity_id=?';
        return database.query(sql, [activityId]);
    }

    static fetchActivityByAction(database, ticketId, action) {
        const sql = 'select * from panel_student_query_activity where ticket_id=? and action=?';
        return database.query(sql, [ticketId, action]);
    }
};
