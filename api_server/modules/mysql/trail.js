module.exports = class Trail {
    static getStudentTrail(database) {
        const sql = `select  sps.student_id,sps.start_date,sps.new_package_id,stu.student_fname,stu.student_email,stu.mobile, pkg.name from  student_package_subscription as sps
        LEFT JOIN
        students as stu
        ON sps.student_id = stu.student_id
        LEFT JOIN
        package as pkg
        ON pkg.id = sps.student_id
        where  start_date > NOW() - INTERVAL 48 HOUR AND amount = -1`;
        // console.log(sql);
        return database.query(sql);
    }

    static getpackageQuestion(database, packageId) {
        const sql = `select b.resource_reference from (select course_resource_id,live_at,assortment_id from course_resource_mapping where assortment_id in
            (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from
            course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in
            (select assortment_id from package where id= ?) and resource_type='assortment') and resource_type='assortment') and
            resource_type='assortment')and resource_type='resource') as a inner join (select resource_reference,id from
            course_resources where resource_type in (1,4,8)) as b on b.id=a.course_resource_id GROUP by b.resource_reference`;
        // console.log(sql);
        return database.query(sql, [packageId]);
    }

    static getTotalEngTime(database, questionIds, studentId) {
        const sql = 'SELECT SUM(engage_time) as totalTime FROM video_view_stats where question_id in (?) and student_id = ? and created_at > NOW() - INTERVAL 48 HOUR';
        // console.log(sql);
        return database.query(sql, [questionIds, studentId]);
    }

    static getTotalEngTimEeach(database, questionIds, studentId) {
        const sql = 'SELECT * FROM video_view_stats where question_id in (?) and student_id=? and created_at > NOW() - INTERVAL 48 HOUR ';
        // console.log(sql);
        return database.query(sql, [questionIds, studentId]);
    }

    static getAssortmentForStudent(database, studentId, studentClass) {
        const sql = 'SELECT * from course_details cd where category in (select ecm.category from class_course_mapping as ccm left join exam_category_mapping ecm on ccm.course = ecm.exam where ccm.id in (select ccm_id from student_course_mapping scm WHERE student_id =? ) ) and is_active and is_free =0 and class =? and assortment_type =\'course\' and meta_info =\'ENGLISH\' and parent =1 order by FIELD(category, \'IIT JEE|NEET|FOUNDATION\', \'NEET\',\'IIT JEE | NEET\',\'IIT JEE\') desc,assortment_id desc limit 1';// 25 ms
        return database.query(sql, [studentId, studentClass]);
    }

    static insertTrialStudents(database, studentId) {
        const sql = 'insert into student_renewal_target_group (student_id, coupon, is_active) VALUES (?,?,?);';
        return database.query(sql, [studentId, 'TRIALFLOW', 1]);
    }

    static getAssortmentListForStudentByClass(database, studentClass, studentLocale) {
        let sql;
        if (studentLocale === 'hi') {
            sql = `select
            a.*,
            cdlcm.liveclass_course_id
        from
            (
            SELECT
                *,
                case
                    when meta_info in ('HINDI', 'ENGLISH') then meta_info
                    else 'HINDI'
                end as course_language
            from
                course_details cd
            where is_active>0
                and is_free = 0
                and class =?
                and assortment_type = 'course'
                and parent = 1
                and category_type not in ('SPOKEN ENGLISH', 'ENGLISH GRAMMAR')
                and meta_info in ('HINDI', 'HINGLISH')
                and cd.is_active = 1
                and is_free = 0
                and parent <> 4
                and cd.assortment_id not in (15, 16)
                    ) as a
        left join course_details_liveclass_course_mapping cdlcm on
            cdlcm.assortment_id = a.assortment_id
        order by
            a.sub_assortment_type,
            a.course_language desc,
            FIELD(category, 'IIT JEE', 'NEET'),
            a.created_at desc`;// 80 ms
            return database.query(sql, [studentClass]);
        }

        sql = `select
        a.*,
        cdlcm.liveclass_course_id
    from
        (
        SELECT
            *,
            case
                when meta_info in ('HINDI', 'ENGLISH') then meta_info
                else 'ENGLISH'
            end as course_language
        from
            course_details cd
        where is_active >0
            and is_free = 0
            and assortment_type = 'course'
            and parent = 1
            and category_type not in ('SPOKEN ENGLISH', 'ENGLISH GRAMMAR')
            and meta_info in ('ENGLISH', 'HINGLISH')
            and cd.class = ?
            and cd.is_active = 1
            and is_free = 0
            and parent <> 4
            and cd.assortment_id not in (15, 16)
            ) as a
    left join course_details_liveclass_course_mapping cdlcm on
        cdlcm.assortment_id = a.assortment_id
    order by
        a.sub_assortment_type,
        a.course_language desc,
        FIELD(category, 'IIT JEE', 'NEET'),
        a.created_at desc`;// 80 ms
        return database.query(sql, [studentClass]);
    }

    static getAssortmentListForStudent(database, studentId, studentClass, studentLocale) {
        let sql;
        if (studentLocale === 'hi') {
            sql = `select
            a.*,
            cdlcm.liveclass_course_id
        from
            ( SELECT *,case
                when meta_info in ('HINDI', 'ENGLISH') then meta_info
                else 'HINDI'
            end as course_language from course_details cd where category in (select ecm.category from class_course_mapping as ccm left join exam_category_mapping ecm on ccm.course = ecm.exam where ccm.id in (select ccm_id from student_course_mapping scm WHERE student_id =?) ) and is_active and is_free =0 and class =? and assortment_type ='course' and parent =1 and category_type not in ('SPOKEN ENGLISH','ENGLISH GRAMMAR') and meta_info in ('HINDI','HINGLISH') and cd.class = ?
            and cd.is_active = 1
            and is_free = 0
            and parent <> 4
            and cd.assortment_id not in (15, 16)
            ) as a
            left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id = a.assortment_id
        order by
            a.sub_assortment_type,
            a.course_language desc,
            FIELD(category, 'IIT JEE', 'NEET'),
            a.created_at desc`;// 60 ms
            return database.query(sql, [studentId, studentClass, studentClass]);
        }
        sql = `select
        a.*,
        cdlcm.liveclass_course_id
    from
        ( SELECT *,case
            when meta_info in ('HINDI', 'ENGLISH') then meta_info
            else 'ENGLISH'
        end as course_language from course_details cd where category in (select ecm.category from class_course_mapping as ccm left join exam_category_mapping ecm on ccm.course = ecm.exam where ccm.id in (select ccm_id from student_course_mapping scm WHERE student_id =?) ) and is_active and is_free =0 and class =? and assortment_type =\'course\' and parent =1 and category_type not in (\'SPOKEN ENGLISH\',\'ENGLISH GRAMMAR\') and meta_info in ('ENGLISH','HINGLISH') and cd.class = ?
        and cd.is_active = 1
        and is_free = 0
        and parent <> 4
        and cd.assortment_id not in (15, 16)
        ) as a
        left join course_details_liveclass_course_mapping cdlcm on cdlcm.assortment_id = a.assortment_id
    order by
        a.sub_assortment_type,
        a.course_language desc,
        FIELD(category, 'IIT JEE', 'NEET'),
        a.created_at desc`;// 60 ms
        return database.query(sql, [studentId, studentClass, studentClass]);
    }
};
