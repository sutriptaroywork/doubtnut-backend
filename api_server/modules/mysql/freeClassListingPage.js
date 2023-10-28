module.exports = class FreeClassListing {
    static getSubjectDataFromChapterAssortmentId(database, assortmentId) {
        // TODO: add assortment list to check for in this query
        const sql = 'SELECT * from course_details cd left join course_resource_mapping crm on cd.assortment_id  =crm.assortment_id  where crm.course_resource_id  = ? and assortment_type  in (\'subject\',\'course\')';
        return database.query(sql, [assortmentId]);// 20 ms
    }

    static getPastVideoResourcesOfChapter(db, chapterAssortments, batchID) {
        const sql = 'select b.*,a.assortment_id,a.live_at,cd.is_free,cd.parent,cd.display_image_square,ans.* from (select course_resource_id,assortment_id,live_at from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (?) and resource_type=\'assortment\') and resource_type=\'resource\' and (live_at < now() or live_at is null) and batch_id=? group by course_resource_id) as a left join (select id,resource_reference, resource_type, stream_status ,expert_name,expert_image,faculty_id,subject,topic,display,meta_info,case when player_type=\'youtube\' then meta_info else resource_reference end as resource_reference_id from course_resources where resource_type in (1,4,8)) as b on b.id=a.course_resource_id left join (select assortment_id, is_free, parent, display_image_square from course_details) as cd on cd.assortment_id=a.assortment_id left join (select is_vdo_ready,vdo_cipher_id,question_id, duration from answers where question_id<>0) as ans on ans.question_id=b.resource_reference_id group by cd.assortment_id order by a.live_at';// 10 ms
        return db.query(sql, [chapterAssortments, batchID]);
    }

    static getUpcomingVideoResourcesOfChapter(db, chapterAssortments, batchID) {
        const sql = `select b.*,
        a.assortment_id,
        a.live_at,cd.is_free,cd.parent,cd.display_image_square,
        ans.* from
        (
            select course_resource_id,assortment_id,live_at
            from course_resource_mapping
            where assortment_id in
            (
                select course_resource_id
                from course_resource_mapping
                where assortment_id in (?) and resource_type= 'assortment'
            ) and resource_type='resource'
            and (
                    (live_at > now() and live_at < now() + interval 30 day) or live_at is null
                ) and batch_id=?
        )as a
        Left  join
        (
            select id,resource_reference,expert_name,
            expert_image,faculty_id,subject,topic,
            display,meta_info,case when player_type='youtube' then meta_info else resource_reference end as resource_reference_id
            from course_resources
            where resource_type in (1,4,8)
        ) as b on b.id=a.course_resource_id
        Left join
            (
                select assortment_id, is_free, parent,
                display_image_square from course_details
            ) as cd on cd.assortment_id=a.assortment_id
        left join
            (
                    select is_vdo_ready,vdo_cipher_id,question_id,
                    duration from answers where question_id<>0
            ) as ans on ans.question_id=b.resource_reference_id
            group by cd.assortment_id order by a.live_at`;
        return db.query(sql, [chapterAssortments, batchID]);// 20 ms
    }

    static getVvsDataForStudent(db, studentId, qids) {
        const sql = 'select * from video_view_stats where student_id = ? and question_id in (?) order by view_id desc';
        return db.query(sql, [studentId, qids]);
    }

    static getReminderSetData(db, studentId, qids) {
        const sql = 'select * from liveclass_subscribers where student_id = ? and is_interested > 0 and resource_reference in (?)';// 10 ms
        return db.query(sql, [studentId, qids]);
    }

    static getBanners(db, versionCode, studentClass, locale) {
        const sql = 'select * from app_banners where page_type = \'free_class_listing\' and max_version_code >=? and min_version_code<=? and is_active>0 and (class = \'all\' or class = \'?\') and start_date< NOW() and end_date> NOW() and (locale = ? or locale is null) order by banner_order';// 120 ms
        return db.query(sql, [versionCode, versionCode, +studentClass, locale]);
    }
};
