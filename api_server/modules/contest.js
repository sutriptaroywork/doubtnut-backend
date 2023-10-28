module.exports = class Contest {
    static getActiveContests(database) {
        const sql = 'SELECT * FROM contest_details where date_from<=curdate() && date_till>=curdate()';
        return database.query(sql);
    }

    static getContestRules(contest_type, parameter, database) {
        const sql = 'SELECT * FROM contest_rules WHERE type=? and parameter=?';
        // console.log(sql);
        return database.query(sql, [contest_type, parameter]);
    }

    static getCurrentWinnerList(contest_type, contest_id, parameter, count, student_id, database) {
        let sql = '';
        if (contest_type == 'top') {
            if (parameter == 'max_views') {
                sql = `Select b.student_username,b.student_id, b.student_fname, b.img_url as profile_image,a.video_count from
                    +"(SELECT student_id, count(view_id) as video_count, sum(engage_time) as total_engagement_time FROM video_view_stats where created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 and source like 'android' and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id=?) group by student_id order by count(view_id) desc, sum(engage_time) desc limit ?) as a left join students as b on a.student_id=b.student_id `;
                // console.log(sql);
                return database.query(sql, [contest_id, count]);
            }
        }
    }

    static getCurrentWinnerListFromDailyViews(contestType, contestID, parameter, count, studentID, database) {
        if (contestType == 'top') {
            if (parameter == 'max_views') {
                const sql = 'Select b.student_username,b.student_id, b.student_fname, b.img_url as profile_image,a.view_count as video_count from (SELECT student_id, view_count, 0 as total_engagement_time FROM daily_views where cur_date=CURRENT_DATE and student_id not in (SELECT student_id from contest_debarred_students WHERE contest_id=?)  order by view_count desc limit ?) as a left join students as b on a.student_id=b.student_id';
                // console.log(sql);
                return database.query(sql, [contestID, count]);
            }
        }
    }

    static checkDebarred(database, studentID, contestID) {
        const sql = 'select a.*, case when b.student_id is null then false else true end as debarred from (select * from students where student_id=?) as a left join (SELECT student_id from contest_debarred_students WHERE contest_id=\'?\' and student_id=?) as b on a.student_id=b.student_id';
        console.log(sql);
        return database.query(sql, [studentID, contestID, studentID]);
    }

    static getView(database, studentID, viewID) {
        const sql = 'select * from daily_views where student_id = ? and view_id = ? and cur_date = CURDATE()';
        // console.log(sql);
        return database.query(sql, [studentID, viewID]);
    }

    static updateDailyViewAndCount(database, studentID, viewID) {
        const sql = 'update daily_views set view_id=?, view_count=view_count+1 where student_id=? and cur_date = CURDATE()';
        // console.log(sql);
        return database.query(sql, [viewID, studentID]);
    }

    static insertView(database, studentID, viewID, viewCount) {
        const sql = 'insert into daily_views set student_id=?, cur_date=CURDATE(), view_id=?, view_count=?';
        // console.log(sql);
        return database.query(sql, [studentID, viewID, viewCount]);
    }

    static getPreviousViews(database, studentID) {
        // const sql = `SELECT count(view_id) as video_count FROM video_view_stats where created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 and source like 'android' and student_id=${studentID}`;
        const sql = 'SELECT count(view_id) as video_count FROM video_view_stats where created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 and source like \'android\' and student_id=? group by student_id';
        // console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getPreviousWinnerList(contestType, parameter, count, studentId, database) {
        let sql = '';
        if (contestType === 'top' && parameter === 'max_referral') {
            sql = 'Select * from (Select amount,count as total_referral,student_id,date,position,contest_id,type,parameter from contest_winners where type =\'?\' && parameter=\'?\' && date=date_sub(CURRENT_DATE, INTERVAL 1 DAY))as b left join (select student_id,student_fname,student_username,img_url as profile_image from students) as a on b.student_id=a.student_id';
        } else {
            sql = 'Select * from (Select amount,count as video_count,student_id,date,position,contest_id,type,parameter from contest_winners where type =\'?\' && parameter=\'?\' && date=date_sub(CURRENT_DATE, INTERVAL 1 DAY))as b left join (select student_id,student_fname,student_username,img_url as profile_image from students) as a on b.student_id=a.student_id';
        }

        console.log(sql);
        return database.query(sql);
    }

    // Saayon code_______________________________________________________________________________________________________
    /*
  static getPreviousWinnersListTopMax(database){
    let sql = "SELECT 'contest_winners' as type, a.contest_id as id,a.date as created_at,b.img_url,a.parameter,a.amount,case when c.like_count is null then 0 else c.like_count end as like_count FROM (SELECT amount, count as video_count,student_id,date,position,contest_id,type,parameter FROM contest_winners where type='top' && parameter = 'max_views' && date = date_sub(CURRENT_DATE,INTERVAL 1 DAY)) AS a LEFT JOIN (SELECT student_id,student_fname,student_username,img_url FROM students) as b ON a.student_id =b.student_id left join (select count(*) as like_count,is_like,resource_id from user_engagement_feedback where is_like=1) as c on a.contest_id=c.resource_id LIMIT 5";
    console.log(sql);
    return database.query(sql);
  }
  */
    /*
  static getPreviousWinnersListTopMax(database){
    let sql = "select b.student_username ,a.student_id,a.amount,a.contest_id from (select * from contest_winners where type='top' && parameter='max_views' && date=date_sub(CURRENT_DATE,INTERVAL 1 DAY) LIMIT 5) as a left join (select student_username,student_id from students) as b on a.student_id=b.student_id";
    console.log(sql);
    return database.query(sql);
  }
  */
    static getPreviousWinnersListTopMax(database) {
        const sql = "select a.type as type,c.student_username,c.student_id as student_id,c.img_url as profile_image,a.data as contest_id,b.date,a.start_date as created_at,case when d.like_count is null then 0 else d.like_count end as like_count,d.is_like as is_like from (select data,start_date,type from engagement where type = 'contest_winners' order by id desc limit 1) as a left join (select * from contest_winners where type ='top' && parameter = 'max_views' && date = date_sub(CURRENT_DATE,INTERVAL 1 DAY)) as b on a.data = b.contest_id left join (select student_username,student_id,img_url from students where is_new_app=1) as c on c.student_id =b.student_id left join (select count(*) as like_count,is_like,resource_id from user_engagement_feedback) as d on a.data=d.resource_id LIMIT 5";
        console.log(sql);
        return database.query(sql);
    }
    // ___________________________________________________________________________________________________________________

    static checkUserEligibility(contestType, parameter, studentID, database) {
        let sql = '';
        if (contestType === 'lottery') {
            if (parameter === 'min_views') {
                sql = 'SELECT student_id, count(view_id) as video_count,sum(engage_time) as total_engagement_time, case when count(view_id)>=20 then 1 else 0 end as student_eligible  FROM video_view_stats where student_id = ? and created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 and source = \'android\' group by student_id';
            } else if (parameter === 'min_referral') {
                sql = 'SELECT sent_id, count(received_id), case when count(received_id)>=5 then 1 else 0 end as student_eligible from students_invites where sent_id =? and date(timestamp)=CURRENT_DATE group by sent_id';
            }
        } else if (contestType === 'streak') {
            sql = 'Select a.student_id, case when sum(a.student_eligible)=5 then 1 else 0 end as student_eligible from (SELECT student_id, date(created_at), count(view_id) as video_count, sum(engage_time) as total_engagement_time, case when count(view_id)>=5 then 1 else 0 end as student_eligible FROM video_view_stats where student_id =? and date(created_at)>=date_sub(CURRENT_DATE, INTERVAL 4 DAY) and date(created_at)<=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id, date(created_at)) as a group by a.student_id';
        }
        return database.query(sql, [studentID]);
    }

    static getCurrentStats(contestType, parameter, studentID, database) {
        let sql = '';
        if (contestType === 'top') {
            if (parameter === 'max_views') {
                sql = 'SELECT student_id, count(view_id) as video_count,sum(engage_time) as total_engagement_time FROM video_view_stats where student_id = ? and created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id';
            }
        } else if (contestType === 'lottery') {
            if (parameter === 'min_views') {
                sql = 'SELECT student_id, count(view_id) as video_count,sum(engage_time) as total_engagement_time, case when count(view_id)>=10 then 1 else 0 end as student_eligible  FROM video_view_stats where student_id = ? and created_at>=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id';
            } else if (parameter === 'min_referral') {
                sql = 'SELECT sent_id, count(received_id) as total_referral,case when count(received_id)>=5 then 1 else 0 end as student_eligible from students_invites where sent_id = ? and date(timestamp)=CURRENT_DATE group by sent_id';
            }
        } else if (contestType === 'streak') {
            sql = 'SELECT student_id, date(created_at), count(view_id) as video_count, sum(engage_time) as total_engagement_time, case when count(view_id)>=5 then 1 else 0 end as student_eligible FROM video_view_stats where student_id =? and date(created_at)>=date_sub(CURRENT_DATE, INTERVAL 4 DAY) and date(created_at)<=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id, date(created_at)';
        }
        // console.log(sql);
        return database.query(sql, [studentID]);
    }

    static getCurrentStreak(student_id, database) {
        const sql = 'Select GROUP_CONCAT(c.student_streak) as streak from (Select a.date_c, b.student_id,  b.video_count, b.total_engagement_time, case when b.student_eligible is null then 0 else b.student_eligible end as student_streak from (Select distinct date(created_at) as date_c from video_view_stats where date(created_at)>=date_sub(CURRENT_DATE, INTERVAL 4 DAY) and date(created_at)<=CURRENT_DATE) as a left join ( SELECT student_id, date(created_at) as date_C, count(view_id) as video_count, sum(engage_time) as total_engagement_time, case when count(view_id)>=5 then 1 else 0 end as student_eligible FROM video_view_stats where student_id =? and date(created_at)>=date_sub(CURRENT_DATE, INTERVAL 4 DAY) and date(created_at)<=CURRENT_DATE and engage_time >=30 and refer_id=0 group by student_id, date(created_at)) as b on a.date_c=b.date_c order by a.date_c ASC) as c';
        return database.query(sql, [student_id]);
    }

    static getContestById(contest_id, database) {
        const sql = 'SELECT * FROM contest_details WHERE id=?';
        return database.query(sql, [contest_id]);
    }

    static getContestWinnerDetailsByParameter(database, parameter, offset) {
        const sql = 'select * from (SELECT * FROM contest_details WHERE parameter=?) as a left join (select * from contest_winners where date=date_sub(CURRENT_DATE, INTERVAL ? DAY) and position in (1,2,3,4,5)) as b on a.id=b.contest_id left join (select student_id, student_username, student_fname, img_url, mobile from students) as c on b.student_id=c.student_id order by b.position asc';
        // console.log(sql);
        return database.query(sql, [parameter, offset]);
    }

    static getWinnersByParameter(database, parameter, date, courseID) {
        const sql = 'select * from (SELECT * FROM contest_details WHERE parameter=?) as a left join (select * from contest_winners where date=? and amount=50 and course_id=?) as b on a.id=b.contest_id left join (select student_id, student_username, student_fname, img_url, mobile from students) as c on b.student_id=c.student_id left join (select * from liveclass_course) as d on b.course_id=d.id order by b.position asc';
        // console.log(sql);
        return database.query(sql, [parameter, date, courseID]);
    }

    static getAllWinnersByParameter(database, parameter, date) {
        const sql = 'select * from (SELECT * FROM contest_details WHERE parameter=?) as a left join (select * from contest_winners where date=? and amount=500) as b on a.id=b.contest_id left join (select student_id, student_username, student_fname, img_url, mobile from students) as c on b.student_id=c.student_id left join (select * from liveclass_course) as d on b.course_id=d.id order by b.id asc';
        // console.log(sql);
        return database.query(sql, [parameter, date]);
    }

    static getLuckyDrawDetailsByParameter(database, parameter, date) {
        const sql = 'select * from (SELECT * FROM contest_details WHERE parameter=?) as a left join (select * from contest_winners where date=? and amount=5000) as b on a.id=b.contest_id left join (select student_id, student_username, student_fname, img_url, mobile from students) as c on b.student_id=c.student_id left join (select * from liveclass_course) as d on b.course_id=d.id order by b.position asc';
        // console.log(sql);
        return database.query(sql, [parameter, date]);
    }

    static getContestWinnerTransactionDetails(database, contestWinnerID) {
        const sql = 'select * from contest_winners where id=? and payment_status=\'FAILED\' and payment_try_count=1';
        // console.log(sql);
        return database.query(sql, [contestWinnerID]);
    }

    static updateContestWinners(mysql, obj, contestWinnersID) {
        const sql = 'UPDATE contest_winners SET ? where id = ?';
        return mysql.query(sql, [obj, contestWinnersID]);
    }

    static getLuckyDrawWinners(mysql, date, limit, points) {
        const sql = 'select a.* from (Select t1.student_id, max(t1.total_point_class) as max_point, t1.course_id from (select a.student_id, c.id as course_id, sum(a.points) as total_point_class from (select * from liveclass_quiz_response where date(created_at) = ?) as a left join (select * from liveclass_course_details) as b on a.detail_id=b.id left join (select * from liveclass_course) as c on b.liveclass_course_id=c.id where date(b.live_at)=? group by a.student_id,c.id) as t1 group by t1.student_id having max(t1.total_point_class)>? order by rand() limit ?) as a left join (select student_id from contest_winners where date>=date_sub(\'2020-09-04\', INTERVAL 7 DAY) and amount=10000) as b on a. student_id = b.student_id where b.student_id is null';
        return mysql.query(sql, [date, date, points, limit]);
    }

    static checkForDisbursementValidity(mysql, studentId, disbursementId) {
        const sql = 'select * from student_referral_paytm_disbursement where invitor_student_id=? and id=? and is_paytm_disbursed in (0, 2, 1)';
        return mysql.query(sql, [studentId, disbursementId]);
    }

    static updateDisbursements(mysql, validityRow, is_paytm_disbursed, result, paytmNumber) {
        const sql = 'update student_referral_paytm_disbursement set is_paytm_disbursed=?, paytm_response_retry = ?, mobile_retry=? where id=?';
        return mysql.query(sql, [is_paytm_disbursed, JSON.stringify(result), paytmNumber, validityRow.id]);
    }
};
