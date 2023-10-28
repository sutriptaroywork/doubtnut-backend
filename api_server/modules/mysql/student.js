module.exports = class Student {
    static getById(student_id, database) {
        const sql = 'select * from students where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getInviteBySclass(sclass, database) {
        const sql = 'SELECT key_value  FROM app_configuration WHERE class = ? AND key_name =\'invite\' AND is_active =1';
        // console.log(sql);
        return database.query(sql, [sclass]);
    }

    static getInviteVIPBySclass(sclass, database) {
        const sql = 'SELECT key_value  FROM app_configuration WHERE class = ? AND key_name =\'invite_vip\' AND is_active =1';
        // console.log(sql);
        return database.query(sql, [sclass]);
    }

    static getLastDayVideoCountByStudentId(database, student_id) {
        const sql = 'select student_id,count(view_id) as counter from video_view_stats where created_at>=DATE_SUB(CURRENT_DATE, INTERVAl 1 DAY) and created_at<CURRENT_DATE and view_from like \'SRP\' and student_id=?';
        return database.query(sql, student_id);
    }

    static subscribedStudentHistory(student_id, is_answered, limit, database) {
        let sql = '';
        if (is_answered) {
            sql = 'select b.question_id, b.ocr_text,b.question,b.question_image from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> \'NEW_REGISTER\' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a INNER join (select * from questions where student_id = ? AND is_answered = ? and question_credit = 0) as b on a.student_id = b.student_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as d on b.question_id = d.question_id order by d.answer_id desc limit ?';
        } else {
            sql = 'select b.question_id, b.ocr_text,b.question,b.question_image, c.skip_message,b.is_skipped from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> \'NEW_REGISTER\' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a INNER join (select * from questions where student_id = ? AND is_answered = ?  and question_credit = 0) as b on a.student_id = b.student_id left join (select skip_message,question_id from expert_skipped_question) as c on b.question_id = c.question_id order by b.question_id desc limit ?';
        }
        // console.log(sql);
        return database.query(sql, [student_id, student_id, is_answered, limit]);
    }

    static getStudentQuestionHistoryList(student_id, limit, database) {
    // let sql = "SELECT video_view_stats.question_id, questions.ocr_text FROM video_view_stats,questions WHERE video_view_stats.question_id = questions.question_id AND  video_view_stats.student_id = '" + student_id + "' order by video_view_stats.created_at LIMIT " + limit;
        const sql = 'select a.question_id , b.ocr_text, b.question from (select distinct question_id from video_view_stats where student_id = ? order by created_at desc LIMIT ?) as a left join (select question_id ,ocr_text,question from questions) as b on a.question_id = b.question_id';
        return database.query(sql, [student_id, limit]);
    }

    static getStudentId(entity_id, entity_type, student_id, database) {
        const sql = 'select * from user_unsubscribe_posts where entity_id =? and entity_type =? and student_id = ?';
        return database.query(sql, [entity_id, entity_type, student_id]);
    }

    static getStudentByPhone(phone, database) {
        const sql = 'SELECT student_id, app_version from students where mobile = ? order by student_id asc limit 1';
        return database.query(sql, [phone]);
    }

    static getAllStudentsByPhone(phone, database) {
        const sql = 'SELECT * from students where mobile = ? order by student_id asc';
        return database.query(sql, [phone]);
    }

    static getAllStudentsByPhoneGlobally(phone, usFlag, database, isTransactional = 0) {
        let sql;
        if (usFlag) {
            sql = 'SELECT * from students where mobile = ? and clevertap_id = \'US_APP\' order by student_id asc';
        } else {
            sql = 'SELECT * from students where mobile = ? order by student_id asc';
        }
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [phone]);
        }
        return database.query(sql, [phone]);
    }

    static getAllStudentsByEmailId(email, database, usFlag, isTransactional = 0) {
        let sql;
        if (usFlag) {
            sql = 'SELECT * from students where student_email = ? and clevertap_id = \'US_APP\' order by student_id asc';
        } else {
            sql = 'SELECT * from students where student_email = ? order by student_id asc';
        }
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [email]);
        }
        return database.query(sql, [email]);
    }

    static updatePhone(phone, student_id, database) {
        const sql = 'update students set mobile=? where student_id=?';
        return database.query(sql, [phone, student_id]);
    }

    static updateQuestions(lowestStudentId, student_id, database) {
        const sql = 'update questions set student_id=? where student_id=?';
        return database.query(sql, [lowestStudentId, student_id]);
    }

    static updateVideos(lowestStudentId, student_id, database) {
        const sql = 'update video_view_stats set student_id=? where student_id=?';
        return database.query(sql, [lowestStudentId, student_id]);
    }

    static insertWhatsappMapping(wha_student_id, student_id, database) {
        const sql = 'insert into wha_students_mapping (wha_student_id, ref_student_id) VALUES (?, ?)';
        return database.query(sql, [wha_student_id, student_id]);
    }

    static checkAndTriggerProfileComplete(database, student_id) {
        const q = `select s.student_fname, s.gender, s.student_class, s.school_name, s.dob, sl.city , scm.ccm_id, ccm.category from students s
    left join student_location sl  on sl.student_id  = s.student_id
    left join student_course_mapping scm on scm.student_id  = s.student_id
    left join class_course_mapping ccm on ccm.id  = scm.ccm_id
    where s.student_id = ? group by ccm.category`;

        return database.query(q, [student_id]);
    }

    static getExamsBoardsDetails(database, studentClass, categoryType) {
        const sql = 'SELECT id,course as title, category as type, id as code, 0 as is_active, course_meta as sub_title FROM class_course_mapping where category=? and on_boarding_status=1 and class=? and is_active=1 order by priority';
        return database.query(sql, [categoryType, studentClass]);
    }

    static getExamsBoardsDetailsLocalised(database, studentClass, categoryType, lang, examOrdering) {
        let sql;
        if (lang == 'hindi') {
            sql = `SELECT a.id, b.${lang}_name as title, a.category as type, a.id as code, 0 as is_active, b.${lang}_meta as sub_title, a.course AS english_title FROM class_course_mapping AS a LEFT JOIN course_display_ordering_mapping AS b ON a.course = b.course_name where a.category=? and a.class=? and a.on_boarding_status=1 and a.is_active=1 AND (a.parent_ccm_id = 0 OR a.parent_ccm_id = a.id)`;
            if (examOrdering === '') {
                if (studentClass == 14) {
                    sql += ` AND b.${lang}_order != 0 order by b.${lang}_order`;
                } else {
                    sql += ` AND a.course <> 'OTHER EXAM' AND b.${lang}_order != 0 order by b.${lang}_order`;
                }
            } else {
                sql += ` AND a.course <> 'OTHER EXAM' AND b.${examOrdering}_order != 0 order by b.${examOrdering}_order`;
            }
        } else {
            sql = `SELECT a.id, a.course as title, a.category as type, a.id as code, 0 as is_active, a.course_meta as sub_title FROM class_course_mapping AS a LEFT JOIN course_display_ordering_mapping AS b ON a.course = b.course_name where a.category=? and a.class=? and a.on_boarding_status=1 and a.is_active=1 AND b.${lang}_order != 0 AND (a.parent_ccm_id = 0 OR a.parent_ccm_id = a.id)`;
            if (examOrdering === '') {
                if (studentClass == 14) {
                    sql += ` order by b.${lang}_order`;
                } else {
                    sql += ` AND a.course <> 'OTHER EXAM' order by b.${lang}_order`;
                }
            } else {
                sql += ` AND a.course <> 'OTHER EXAM' order by b.${examOrdering}_order`;
            }
        }
        return database.query(sql, [categoryType, studentClass]);
    }

    static getExamsBoardsDetailsLocalisedNew(database, studentClass, categoryType, lang) {
        const sql = `SELECT a.id,b.${lang}_name as title, a.category as type, a.id as code, 0 as is_active, b.${lang}_meta as sub_title FROM class_course_mapping AS a LEFT JOIN course_display_ordering_mapping AS b ON a.course = b.course_name where a.category=? and a.class=? and a.on_boarding_status=1 and a.is_active=1 AND b.${lang}_order != 0 order by b.${lang}_order`;
        return database.query(sql, [categoryType, studentClass]);
    }

    static getStudentImages(leave, limit, database) {
        const sql = 'SELECT img_url FROM students WHERE img_url IS NOT NULL AND img_url <> \'\' ORDER BY student_id DESC LIMIT ?, ?';
        return database.query(sql, [leave, limit]);
    }

    static getActiveSubscriptions(database, student_id) {
        const sql = 'select DISTINCT a.*, sps.is_active, p.name, p.assortment_id as subcategory_id,p.duration_in_days, p.id as package_id, p.type as package_type, p.is_last as last_emi_package, q.pdf_url, cd.assortment_type, p.batch_id, cd.meta_info, concat("https://d10lpgp6xz60nq.cloudfront.net/", pin.url) as invoice_url from (select id, amount_paid,master_subscription_start_date,master_subscription_end_date,next_part_payment_amount,next_part_payment_date,type,payment_type,student_id,package_amount,master_variant_id,new_package_id,package_duration,emi_order,new_package_id as master_package_id, package_validity, subscription_id, total_amount, created_at, next_package_id, next_ps_id, is_refunded, refund_amount, coupon_code from classzoo1.payment_summary where student_id = ? and next_package_id is null and CURRENT_DATE <= DATE_ADD(package_validity, INTERVAL 30 DAY)) as a left join student_package_subscription as sps on a.subscription_id=sps.id left join package as p on p.id=a.new_package_id left join course_details as cd on p.assortment_id=cd.assortment_id left join course_details_banners as q on p.assortment_id=q.assortment_id and p.batch_id=q.batch_id left join payment_invoice pin on pin.entity_id = sps.payment_info_id where cd.assortment_type in ("course","subject", "chapter") group by a.id';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static getPlansToUpgrade(database, assortmentId, durationIndays) {
        const sql = 'select *,assortment_id as subcategory_id from package where (emi_order=1 or type=\'subscription\') and assortment_id=? and duration_in_days >= ? and is_active=1';
        return database.query(sql, [assortmentId, durationIndays]);
    }

    static getAllActiveSubscriptions(database) {
        const sql = 'select a.*,v.package_id,v.base_price as original_amount, (v.base_price - v.display_price) as offer_amount, v.display_price as final_amount from (select *,assortment_id as subcategory_id from package where is_active=1 and  (emi_order=1 or type=\'subscription\')) as a inner join (select distinct assortment_id from course_details where (assortment_type = \'course\' or (assortment_type = \'subject\' and category in (\'State Boards\',\'CBSE Boards\')))) as b on a.assortment_id=b.assortment_id inner join (select distinct package_id, base_price, display_price,id from variants where is_show_panel <> 0) as v on v.package_id=a.id';
        return database.query(sql);
    }

    static getPaymentInfoData(database, studentId) {
        const sql = 'select a.*,b.status as refund_status, b.updated_by, b.reason from (select * from payment_info where status=\'SUCCESS\' and student_id=?) a left join payment_refund b on a.id=b.payment_info_id';
        // console.log(sql);
        return database.query(sql, [studentId]);
    }

    static getStudentByPhoneV1(phone, database) {
        const sql = 'SELECT student_id, app_version, is_online,student_class, locale, timestamp, coaching, school_name, student_lname, student_fname, img_url from students where mobile = ? and app_version is not null order by student_id asc limit 1';
        return database.query(sql, [phone]);
    }

    static getStudentByPhoneV2(phone, database) {
        const sql = 'SELECT student_id, app_version, is_online,student_class, locale, timestamp, coaching, school_name, student_lname, student_fname, img_url from students where mobile = ?  order by student_id asc limit 1';
        return database.query(sql, [phone]);
    }

    static storeOnBoardLanguageData(database, obj) {
        const sql = 'INSERT INTO on_board_language SET ?';
        return database.query(sql, [obj]);
    }

    static getLastMinuteOtps(database, mobile) {
        const sql = 'SELECT * FROM otp_records WHERE mobile = ? AND time > (now() - interval 1 minute)';
        return database.query(sql, [mobile]);
    }

    static storePin(database, obj) {
        const sql = 'INSERT INTO students_pin SET ?';
        return database.query(sql, [obj]);
    }

    static updatePin(database, pin, mobile, usFlag) {
        let sql;
        if (usFlag) {
            sql = 'UPDATE students_pin SET pin = ?, updated_at = CURRENT_TIMESTAMP WHERE mobile = ? AND app_country = \'US_APP\'';
        } else {
            sql = 'UPDATE students_pin SET pin = ?, updated_at = CURRENT_TIMESTAMP WHERE mobile = ?';
        }
        return database.query(sql, [pin, mobile]);
    }

    static getPin(database, mobile, usFlag) {
        let sql;
        if (usFlag) {
            sql = 'SELECT * FROM students_pin WHERE mobile = ? and app_country =\'US_APP\'';
        } else {
            sql = 'SELECT * FROM students_pin WHERE mobile = ?';
        }
        return database.query(sql, [mobile]);
    }

    static checkPin(database, mobile, isUsFlag) {
        let sql;
        if (isUsFlag) {
            sql = 'SELECT * FROM students_pin WHERE mobile = ? and app_country =\'US_APP\'';
        } else {
            sql = 'SELECT * FROM students_pin WHERE mobile = ?';
        }
        return database.query(sql, [mobile]);
    }

    static verifyStudentByPin(database, identifier, pin, isUsFlag) {
        let sql;
        if (isUsFlag) {
            sql = 'SELECT * from students_pin where mobile = ? and pin = ? and app_country =\'US_APP\'';
        } else {
            sql = 'SELECT * from students_pin where mobile = ? and pin = ?';
        }
        return database.query(sql, [identifier, pin]);
    }

    static storePinMetrics(database, obj) {
        const sql = 'INSERT INTO students_pin_metrics SET ?';
        return database.query(sql, [obj]);
    }

    static getLast24HoursData(database, mobile, status) {
        const sql = 'SELECT * FROM students_pin_metrics WHERE time > NOW() - INTERVAL 24 HOUR AND mobile = ? AND status = ?';
        return database.query(sql, [mobile, status]);
    }

    static getOtpDeliveryReport(database, mobile) {
        const sql = 'SELECT * FROM otp_delivery_status WHERE time > NOW() - INTERVAL 15 SECOND AND number = ? AND (error_code IN (\'001\', \'008\', \'010\', \'017\', \'109\') OR status IN (\'FAILED\', \'INVALID_NO\', \'NOT_SUPPORTED\', \'UNDELIV\', \'Unknown\', \'EXPIRED\')) ORDER BY time DESC LIMIT 1';
        return database.query(sql, [mobile]);
    }

    static storeOtpDeliveryReport(database, obj) {
        const sql = 'INSERT INTO otp_delivery_status SET ?';
        return database.query(sql, [obj]);
    }

    static getAllSurveyByUser(database, sid) {
        const sql = 'SELECT id, locale, target_group FROM survey_details WHERE (id IN (SELECT DISTINCT survey_id FROM `survey_users` WHERE student_id = ? AND created_at >= (CURRENT_TIMESTAMP - INTERVAL 30 DAY) AND is_active = 1) AND is_active = 1) OR (target_group is not null and trigger_event=\'homepage\') ORDER BY id DESC';
        return database.query(sql, sid);
    }

    static getSurveyFeedbackDataForUser(database, studentId) {
        const sql = 'SELECT DISTINCT survey_id FROM `survey_feedback` WHERE student_id = ?';
        return database.query(sql, [studentId]);
    }

    static executeUserData(database, sql) {
        return database.query(sql);
    }

    static getSurveyDetails(database, survey_id) {
        const sql = 'SELECT * FROM survey_details WHERE id = ?';
        return database.query(sql, [survey_id]);
    }

    static getSurveyQuestions(database, survey_id) {
        const sql = 'SELECT * FROM survey_questions WHERE survey_id = ? ORDER BY question_order ASC';
        return database.query(sql, [survey_id]);
    }

    static getSurveyOptions(database, questionIds) {
        const sql = `SELECT * FROM survey_options WHERE question_id IN (${questionIds})`;
        return database.query(sql);
    }

    static getSurveyFeedback(database, surveyId, studentId, questionId) {
        const sql = 'SELECT * FROM survey_feedback WHERE survey_id = ? AND student_id = ? AND question_id = ? AND type = "feedback"';
        return database.query(sql, [surveyId, studentId, questionId]);
    }

    static insertSurveyFeedback(database, obj) {
        const sql = 'INSERT INTO survey_feedback SET ?';
        return database.query(sql, [obj]);
    }

    static updateSurveyFeedback(database, obj, surveyId, studentId, questionId) {
        const sql = 'UPDATE survey_feedback SET ? WHERE survey_id = ? AND student_id = ? AND question_id = ? AND type = "feedback"';
        return database.query(sql, [obj, surveyId, studentId, questionId]);
    }

    static getChannelsByCcmId(database, studentId, className, versionCode) {
        const sql = 'SELECT * FROM channels WHERE min_version_code < ? AND is_active = 1 AND ((ccm_id IN (SELECT ccm_id FROM student_course_mapping WHERE student_id = ?) AND class = \'\') OR (ccm_id = \'all\' AND (class = ? OR class = \'all\'))) AND item_order <> 0 ORDER BY item_order';
        return database.query(sql, [versionCode, studentId, className]);
    }

    static getLastFeedbackBySurveyId(database, surveyId, studentId) {
        const sql = 'SELECT * FROM survey_feedback WHERE survey_id = ? AND student_id = ? ORDER BY id DESC LIMIT 1';
        return database.query(sql, [surveyId, studentId]);
    }

    static getStudentActivePackages(studentId, database) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM student_package_subscription WHERE student_id = ? AND is_active = 1) AS EXIST';
        return database.query(sql, [studentId]);
    }

    static getCcmIdbyStudentId(database, studentId) {
        const sql = 'SELECT ccm_id,type FROM student_course_mapping WHERE student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getStudentImage(studentId, database) {
        const sql = 'SELECT img_url FROM students WHERE student_id = ? AND img_url IS NOT NULL';
        return database.query(sql, [studentId]);
    }

    static updateClass(database, studentId, studentClass) {
        const sql = `UPDATE students SET student_class = ${studentClass} WHERE student_id = ?`;
        return database.query(sql, studentId);
    }

    static deleteBoardExam(database, studentId) {
        const sql = 'DELETE FROM student_course_mapping WHERE student_id = ?';
        return database.query(sql, studentId);
    }

    static getBoardExamId(database, studentClass, boardExamName, surveyId, type) {
        let sql = 'SELECT ccm.*, cdom.course_name, cdom.hindi_name FROM class_course_mapping ccm LEFT JOIN course_display_ordering_mapping cdom ON ccm.course = cdom.course_name WHERE ccm.class = ? AND ccm.category = ?';
        if (surveyId == 9) {
            sql += ' AND cdom.course_name = ?';
        } else if (surveyId == 10) {
            sql += ' AND cdom.hindi_name = ?';
        }
        return database.query(sql, [studentClass, type, boardExamName]);
    }

    static insertBoardExam(database, studentId, ccmId) {
        const obj = {
            student_id: studentId,
            ccm_id: ccmId,
        };
        const sql = 'INSERT INTO student_course_mapping SET ?';
        return database.query(sql, obj);
    }

    static getStudentScholarshipRegistered(database, studentId) { // * 50-80ms
        const sql = 'select student_id, test_id, progress_id from scholarship_test where student_id = ? and is_active = 1';
        return database.query(sql, [studentId]);
    }

    static getArchivedVideoWatched(database, studentId) {
        const sql = 'select view_id, question_id, parent_id, created_at, engage_time from video_view_stats_archive where student_id=?  order by view_id DESC';
        return database.query(sql, [studentId]);
    }

    static getArchivedQuestionsAsked(database, studentId) {
        const sql = 'select  question_id, question_image, timestamp from questions where student_id=? order by question_id DESC';
        return database.query(sql, [studentId]);
    }

    static getLast30DaysVideoWatched(database, studentId) {
        const sql = 'select view_id, question_id, parent_id, created_at, engage_time from video_view_stats where student_id=?  order by view_id DESC';
        return database.query(sql, [studentId]);
    }

    static getLast30DaysQuestionsAsked(database, studentId) {
        const sql = 'select  question_id, timestamp, question_image from questions_new where student_id=? order by question_id DESC';
        return database.query(sql, [studentId]);
    }

    static getWalletBalance(database, studentId) {
        const sql = 'select * from wallet_summary where student_id=?';
        return database.query(sql, [studentId]);
    }

    static getCCMID(database, studentId) {
        const sql = 'select group_concat(b.course) as list_course from (select * from student_course_mapping where student_id=?) as a left join class_course_mapping as b on a.ccm_id=b.id group by student_id';
        return database.query(sql, [studentId]);
    }

    static getStudentLocation(database, studentId) {
        const sql = 'select city, state from student_location where student_id = ? limit 1';
        return database.query(sql, [studentId]);
    }

    static getStudentAlternateNumbers(database, studentId) {
        const sql = 'select alternate_number, relation from students_alternate_numbers where student_id = ? and is_active=1';
        return database.query(sql, [studentId]);
    }

    static setStudentAlternateNumbers(database, numberList) {
        const sql = 'INSERT into students_alternate_numbers (student_id, alternate_number, relation) VALUES ? ';
        return database.query(sql, [numberList]);
    }

    static checkStudentPracticeEnglishParticipation(database, studentId) {
        const sql = 'select * from practice_english_sessions where student_id = ? and status =1 and created_at > CURRENT_DATE()';// 10-15 ms
        return database.query(sql, [studentId]);
    }

    static checkR2V2Student(database, studentId) { // 20 ms
        const sql = 'select student_id from r2v2_students where student_id = ? and is_active = 1';
        return database.query(sql, [studentId]);
    }

    static getBiharUpActiveCCMData(database) { // 30 ms
        const sql = 'select * from class_course_mapping where course in ("Bihar Board","UP Board") and is_active = 1';
        return database.query(sql);
    }

    static getUpActiveCCMData(database) { // 30 ms
        const sql = 'select * from class_course_mapping where course in ("UP Board") and is_active = 1';
        return database.query(sql);
    }

    static getStudentsReferredByUser(db, studentId) {
        const sql = 'select inviter_id,invitee_id from refer_and_earn where inviter_id= ? and question_asked=1';
        return db.query(sql, [studentId]);
    }

    static getReferredUserData(db, inviteeId) {
        const sql = 'SELECT inviter_id,invitee_id,question_asked FROM refer_and_earn WHERE invitee_id = ?';
        return db.query(sql, [inviteeId]);
    }

    static updateInviteeQuestionAskedStatus(db, inviteeId) {
        const sql = 'UPDATE refer_and_earn SET question_asked=1 WHERE invitee_id =?';
        return db.query(sql, [inviteeId]);
    }

    static storingReferrerId(db, obj) {
        const sql = 'INSERT INTO refer_and_earn SET  ?';
        return db.query(sql, [obj]);
    }

    static getGoogleAdsData(database, page) {
        const sql = 'select page,type,ads_url,cust_params from google_ads_details where page=? and is_active=1';
        return database.query(sql, [page]);
    }
};
