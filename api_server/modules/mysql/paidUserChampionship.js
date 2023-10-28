module.exports = class PaidUserChampionship {
    static getStartAndEndDatesForCourseByAssortmentId(db, studentId, assortmentId) {
        const sql = 'select a.start_date as start_date, a.end_date as end_date from (select * from student_package_subscription where student_id = ? and start_date < now() and end_date > now() and is_active=1 order by id desc) as a inner join  (select * from package where reference_type in (\'v3\', \'onlyPanel\', \'default\')) as b on a.new_package_id = b.id where b.assortment_id = ?';// 40 ms
        return db.query(sql, [studentId, assortmentId]);
    }

    static getDurationInDaysByAssortmentId(db, studentId, assortmentId) {
        const sql = 'select duration_in_days from (SELECT * from student_package_subscription sps where student_id = ?) as a JOIN package p  on a.new_package_id = p.id WHERE assortment_id = ? limit 1';// 100 ms
        return db.query(sql, [studentId, assortmentId]);
    }

    static getResourcesCountFromCourseAssortment(database, assortmentId, batchID, startTime, endTime) {
        // 70 ms
        const sql = 'SELECT d.assortment_type,count(distinct d.assortment_id) as count from (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping where assortment_id=? and resource_type = \'assortment\') as a left join (SELECT assortment_id, course_resource_id,resource_type,name FROM course_resource_mapping) as b on a.course_resource_id=b.assortment_id left join course_resource_mapping as c on b.course_resource_id = c.assortment_id and c.resource_type=\'assortment\' left join course_details as d on c.course_resource_id = d.assortment_id left join course_resource_mapping e on c.course_resource_id=e.assortment_id and e.resource_type = \'resource\' where d.assortment_type is NOT NULL and e.batch_id=? and e.live_at > ? and e.live_at < ? group by d.assortment_type';
        // console.log(sql);
        return database.query(sql, [assortmentId, batchID, startTime, endTime]);
    }

    static getHomeworkCountFromAssortment(database, assortmentId, batchID, startTime, endTime) {
        const sql = 'select count(*) as count from (select b.live_at from (select * from course_resources cr where meta_info like \'homework\' and resource_type in (2,3)) as a inner join (select * from course_resource_mapping where resource_type=\'resource\' and batch_id=?) as b on b.course_resource_id=a.id inner join (select course_resource_id,assortment_id from course_resource_mapping where resource_type=\'assortment\') as c on c.course_resource_id=b.assortment_id and c.assortment_id in (select course_resource_id from course_resource_mapping where assortment_id in (select course_resource_id from course_resource_mapping where assortment_id=?)) left join liveclass_homework as e on e.liveclass_detail_id=a.old_detail_id where b.live_at > ? and b.live_at < ?) as a'; // 50 ms
        return database.query(sql, [batchID, assortmentId, startTime, endTime]);
    }

    static getTotalVideoTimeFromAssortmentId(database, assortmentId, batchId, startTime, endTime) {
        const sql = `select
        sum(ans.duration) as total_time
    from
        (
            SELECT
            case
                    when player_type = 'youtube'
                    and meta_info is not null then meta_info
                    ELSE resource_reference
                end as question_id
            ,
                MAX(answers.answer_id) as answer_id
            from
                (
                    SELECT
                        assortment_id,
                        course_resource_id,
                        resource_type,
                        name,
                        batch_id
                    FROM
                        course_resource_mapping
                    where
                        assortment_id = ?
                        and resource_type = 'assortment'
                ) as a
                left join (
                    SELECT
                        assortment_id,
                        course_resource_id,
                        resource_type,
                        name
                    FROM
                        course_resource_mapping
                ) as b on a.course_resource_id = b.assortment_id
                left join course_resource_mapping as c on b.course_resource_id = c.assortment_id
                and c.resource_type = 'assortment'
                left join course_resource_mapping e on c.course_resource_id = e.assortment_id
                and e.resource_type = 'resource'
                left join course_resources as f on f.id = e.course_resource_id
                and f.resource_type in (1, 4, 8)
                left join answers on case
                    when player_type = 'youtube'
                    and meta_info is not null then meta_info
                    ELSE resource_reference
                end = answers.question_id
            where
                 e.batch_id = ? and
                 e.live_at > ? and e.live_at< ?
            group by
                question_id 
                ) as a
        left join answers as ans on a.answer_id = ans.answer_id  `;
        // 150 ms
        return database.query(sql, [assortmentId, batchId, startTime, endTime]);
    }

    static getVideoCountByAssortmentId(database, assortmentId, batchId, startTime, endTime) {
        const sql = `select count(*) as count from (SELECT
            case
            
                    when player_type = 'youtube'
                    and meta_info is not null then meta_info
                    ELSE resource_reference
                end as question_id
            ,
                MAX(answers.answer_id) as answer_id
            from
                (
                    SELECT
                        assortment_id,
                        course_resource_id,
                        resource_type,
                        name,
                        batch_id
                    FROM
                        course_resource_mapping
                    where
                        assortment_id = ?
                        and resource_type = 'assortment'
                ) as a
                left join (
                    SELECT
                        assortment_id,
                        course_resource_id,
                        resource_type,
                        name
                    FROM
                        course_resource_mapping
                ) as b on a.course_resource_id = b.assortment_id
                left join course_resource_mapping as c on b.course_resource_id = c.assortment_id
                and c.resource_type = 'assortment'
                left join course_resource_mapping e on c.course_resource_id = e.assortment_id
                and e.resource_type = 'resource'
                left join course_resources as f on f.id = e.course_resource_id
                and f.resource_type in (1, 4, 8)
                left join answers on case
                    when player_type = 'youtube'
                    and meta_info is not null then meta_info
                    ELSE resource_reference
                end = answers.question_id
            where
                 e.batch_id = ? and
                 e.live_at > ? and e.live_at< ?
            group by
                question_id 
                )as a`;
        // 120 ms
        return database.query(sql, [assortmentId, batchId, startTime, endTime]);
    }

    static getLiveAtFromResourceId(database, resourceId) {
        const sql = 'select live_at from course_resource_mapping where course_resource_id = ? order by live_at desc limit 1';
        // 100 ms
        return database.query(sql, [resourceId]);
    }

    static getLiveAtFromQuestionId(database, qid) {
        const sql = 'select live_at from (select * from course_resources where resource_reference  = \'?\') as a left join course_resource_mapping crm on crm.course_resource_id = a.id where live_at is not null order by live_at desc';
        // 150-200 ms
        return database.query(sql, [+qid]);
    }

    static getCouseStartDate(database, assortmentId) {
        const sql = 'select start_date from course_details where assortment_id = ?';
        return database.query(sql, [assortmentId]);
    }

    static getUnclaimedTshirts(database, studentId) {
        const sql = 'select * from paid_user_championship_shirt_winners where student_id = ? and is_claimed =0 and created_at> NOW() - INTERVAL 30 day';
        return database.query(sql, [studentId]);
    }

    static getUnSeenTshirts(database, studentId) {
        const sql = 'select * from paid_user_championship_shirt_winners where student_id = ? and is_seen = 0 and is_claimed =0 and created_at> NOW() - INTERVAL 30 day';
        return database.query(sql, [studentId]);
    }

    static updateIsSeen(database, id) {
        const sql = 'update paid_user_championship_shirt_winners set is_seen=1 where id=?';
        return database.query(sql, [id]);
    }

    static getCoursePreviousWinners(database, assortmentId, winningDate, duration) {
        const sql = 'select student_id, rank, percentage, reward from paid_user_championship_shirt_winners where assortment_id = ? and winning_date = ? and duration = ? order by rank';
        return database.query(sql, [assortmentId, winningDate, duration]);
    }

    static claimReward(database, addressOne, addressTwo, city, countryCode, landmark, mobile, pincode, state, fullname, id, sizeId) {
        const sql = ' update paid_user_championship_shirt_winners set is_claimed=1, address_line_1=?, address_line_2=?, city=?, state=?,address_line_3=?, mobile= ?, full_name=?, pincode=?, shirt_size=?  where id = ?';
        return database.query(sql, [addressOne, addressTwo, city, state, landmark, countryCode + mobile, fullname, pincode, sizeId, id]);
    }

    static updateSeenTshirtReward(database, id) {
        const sql = 'update paid_user_championship_shirt_winners set is_seen=1 where id = ?';
        return database.query(sql, [id]);
    }

    static getTshirtRewardDataById(database, id) {
        const sql = ' select * from  paid_user_championship_shirt_winners where id = ?';
        return database.query(sql, [id]);
    }

    static getStudentsCouponsForChampionship(database, studentId, shownIdList) {
        if (shownIdList.length) {
            const sql = 'select * from student_renewal_target_group where student_id =? and coupon like \'PAIDCHAMPIONSHIP%\' and id not in (?) limit 1';
            return database.query(sql, [studentId, shownIdList]);
        }
        const sql = 'select * from student_renewal_target_group where student_id =? and coupon like \'PAIDCHAMPIONSHIP%\' limit 1';
        return database.query(sql, [studentId]);
    }
};
