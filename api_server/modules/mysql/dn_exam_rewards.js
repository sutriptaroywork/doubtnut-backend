module.exports = class dnExam {
    static getResultTesimonials(database, carouselId, locale, count = -1) { // -1 for all and 26.0ms
        let sql = 'SELECT student_name, student_exam_display_name, student_photo, percentage, percentile, AIR, marks, district_rank, state_rank, other_rank, video_testimonial, text_testimonial, state from dn_exam_rewards_testimonial where carousel_id = ? and is_active = 1 and is_show = 1 and locale = ? order by priority desc';
        if (count > 0) {
            sql += ' limit ?';
        }
        return database.query(sql, [carouselId, locale, count]);
    }

    static getStudentData(database, studentId, examId) { // 37.9ms
        const sql = 'SELECT * from dn_exam_rewards_students_data s join dn_exam_rewards_student_exam_data e on s.student_id = e.student_id where e.dn_exam_id = ? and s.student_id = ? and s.is_active = 1 and e.is_active = 1';
        return database.query(sql, [examId, studentId]);
    }

    static getStudentProfileData(database, studentId) { // 35.7ms
        const sql = 'SELECT * from dn_exam_rewards_students_data where student_id = ? and is_active = 1';
        return database.query(sql, [studentId]);
    }

    static getStudentExamData(database, studentId, examId) { // 36.1ms
        const sql = 'SELECT * from dn_exam_rewards_student_exam_data where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [studentId, examId]);
    }

    static getStudentExamAllData(database, studentId) { // 68.6ms
        const sql = 'SELECT * from dn_exam_rewards_student_exam_data e join dn_exam_rewards_flow f on e.dn_exam_id = f.id where e.student_id = ? and f.class and e.is_active = 1 and f.is_active = 1';
        return database.query(sql, [studentId]);
    }

    static createStudentData(database, data) {
        const sql = 'INSERT into dn_exam_rewards_students_data (student_id, exam_list, is_active) VALUES (?, ?, 1)';
        return database.query(sql, [data.studentId, data.examList]);
    }

    static createStudentExamData(database, studentId, examId) {
        const sql = 'INSERT into dn_exam_rewards_student_exam_data (student_id, dn_exam_id, is_active) VALUES (?, ?, 1)';
        return database.query(sql, [studentId, examId]);
    }

    static getCarousels(database, examId, locale) { // 36.2ms
        const sql = 'SELECT id, carousel_name, display_title_name, banner_link, priority from dn_exam_reward_carousel where is_active = 1 and locale = ? and dn_exam_id = ? order by priority asc';
        return database.query(sql, [locale, examId]);
    }

    static getFAQData(database, bucket, locale = 'en') { // 64.2ms
        const sql = 'SELECT question, answer, priority from faq where bucket = ? and locale = ? and is_active = 1 order by priority asc';
        return database.query(sql, [bucket, locale]);
    }

    static getStudentExams(database, studentId) { // 32.5ms
        const sql = 'SELECT exam_list from dn_exam_rewards_students_data where student_id = ? and is_active = 1';
        return database.query(sql, [studentId]);
    }

    static getClassesFromExams(database, todayDate) { // 34.3ms
        const sql = 'SELECT class from dn_exam_rewards_flow where ((is_active = 1 and registration_start_date <= ?) or (is_active = 2)) and not id = 0 ';
        return database.query(sql, [todayDate]);
    }

    static setExamList(database, studentId, examList) {
        const sql = 'UPDATE dn_exam_rewards_students_data SET exam_list = ? where student_id = ? and is_active = 1';
        return database.query(sql, [examList, studentId]);
    }

    static getCompetitiveExams(database, studentClass, todayDate) { // 32.3ms
        const classStudent = `%${studentClass}%`;
        const sql = 'SELECT id, english_display_name, hindi_display_name from dn_exam_rewards_flow where class like ? and is_active = 1 and is_competitive = 1 and registration_start_date <= ? and not id = 0';
        return database.query(sql, [classStudent, todayDate]);
    }

    static getBoardExams(database, studentClass, todayDate) { // 33.4ms
        const classStudent = `%${studentClass}%`;
        const sql = 'SELECT id, english_display_name, hindi_display_name from dn_exam_rewards_flow where class like ? and is_active = 1 and is_competitive = 0 and registration_start_date <= ? and not id = 0';
        return database.query(sql, [classStudent, todayDate]);
    }

    static getExamData(database, examId) { // 35.8ms
        const sql = 'SELECT * from dn_exam_rewards_flow where id = ? and (is_active = 1 or is_active = 2)';
        return database.query(sql, [examId]);
    }

    static getDummyExamByClass(database, studentClass) { // 37.3ms
        const sql = 'SELECT id from dn_exam_rewards_flow where class like ? and is_active = 2';
        return database.query(sql, [`%${studentClass}%`]);
    }

    static setUpdateTime(database, studentId, examId, registrationDate, applicationDate, admitDate) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET registration_update_date = ?, application_number_update_date = ?, admit_card_update_date = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [registrationDate, applicationDate, admitDate, studentId, examId]);
    }

    static setResultImage(database, imageName, studentId, examId) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET result_image = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [imageName, studentId, examId]);
    }

    static getAvailableBuckets(database, examId) { // 35.6ms
        const sql = 'select all_india_rank_lower, state_rank_lower, district_rank_lower, marks_lower, percentile_lower, percentage_lower from dn_exam_reward_prizes where dn_exam_id = ? and is_active = 1';
        return database.query(sql, [examId]);
    }

    static getStudentReward(database, studentId, examId, score) { // 33.4ms
        let sql = 'select p.cash_reward, p.merchandise_category, p.share_result_template, p.share_result_message from dn_exam_rewards_student_exam_data e join dn_exam_reward_prizes p on e.dn_exam_id = p.dn_exam_id where e.all_india_rank >= p.all_india_rank_lower and e.all_india_rank <= p.all_india_rank_upper and p.is_active = 1 and e.is_active = 1 and e.dn_exam_id = ? and e.student_id = ?';
        if (score == 1) {
            sql = 'select p.cash_reward, p.merchandise_category, p.share_result_template, p.share_result_message from dn_exam_rewards_student_exam_data e join dn_exam_reward_prizes p on e.dn_exam_id = p.dn_exam_id where e.district_rank >= p.district_lower and e.district_rank <= p.district_rank_upper and p.is_active = 1 and e.is_active = 1 and e.dn_exam_id = ? and e.student_id = ?';
        }
        if (score == 2) {
            sql = 'select p.cash_reward, p.merchandise_category, p.share_result_template, p.share_result_message from dn_exam_rewards_student_exam_data e join dn_exam_reward_prizes p on e.dn_exam_id = p.dn_exam_id where e.state_rank >= p.astate_rank_lower and e.state_rank <= p.state_rank_upper and p.is_active = 1 and e.is_active = 1 and e.dn_exam_id = ? and e.student_id = ?';
        }
        if (score == 3) {
            sql = 'select p.cash_reward, p.merchandise_category, p.share_result_template, p.share_result_message from dn_exam_rewards_student_exam_data e join dn_exam_reward_prizes p on e.dn_exam_id = p.dn_exam_id where e.marks >= p.marks_lower and e.marks_rank <= p.marks_upper and p.is_active = 1 and e.is_active = 1 and e.dn_exam_id = ? and e.student_id = ?';
        }
        if (score == 4) {
            sql = 'select p.cash_reward, p.merchandise_category, p.share_result_template, p.share_result_message from dn_exam_rewards_student_exam_data e join dn_exam_reward_prizes p on e.dn_exam_id = p.dn_exam_id where e.percentile >= p.percentile_lower and e.percentile_rank <= p.percentile_upper and p.is_active = 1 and e.is_active = 1 and e.dn_exam_id = ? and e.student_id = ?';
        }
        if (score == 5) {
            sql = 'select p.cash_reward, p.merchandise_category, p.share_result_template, p.share_result_message from dn_exam_rewards_student_exam_data e join dn_exam_reward_prizes p on e.dn_exam_id = p.dn_exam_id where e.percentage >= p.percentage_lower and e.percentage <= p.percentage_upper and p.is_active = 1 and e.is_active = 1 and e.dn_exam_id = ? and e.student_id = ?';
        }
        return database.query(sql, [examId, studentId]);
    }

    static setReward(database, studentId, examId, reward) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET reward = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [reward, studentId, examId]);
    }

    static postFormData(database, data) {
        const sql = 'UPDATE dn_exam_rewards_students_data SET student_name = ?, student_photo = ?, date_of_birth = ?, account_number = ?, account_holder_name = ?, IFSC_code = ?, shirt_size = ? where student_id = ? and is_active = 1';
        return database.query(sql, [data.student_name, data.student_photo, data.date_of_birth, data.account_number, data.account_holder_name, data.IFSC_Code, data.shirt_size, data.studentId]);
    }

    static postFormExamData(database, examId, data) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET application_number = ?, application_photo_url = ?, admit_card_photo_url = ?, result_photo_url = ?, marks = ?, percentage = ?, percentile = ?, grade = ?, all_india_rank = ?, state_rank = ?, district_rank = ?, category_rank = ?, other_rank = ?, other_rank_comment = ?, text_testimonial = ?, video_testimonial_qid = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [data.application_number, data.application_photo_url, data.admit_card_photo_url, data.result_photo_url, data.marks, data.percentage, data.percentile, data.grade, data.all_india_rank, data.state_rank, data.district_rank, data.category_rank, data.other_rank, data.other_rank_comment, data.text_testimonial, data.video_testimonial_qid, data.studentId, examId]);
    }

    static createFormData(database, data) {
        const sql = 'INSERT INTO dn_exam_rewards_students_data (student_id, student_name, student_photo, date_of_birth, account_number, account_holder_name, IFSC_code, shirt_size, student_id, exam_list, is_active) VALUES (?, ?, ?, ?, ?, ?, ? ,?, ?, ?, 1)';
        return database.query(sql, [data.studentId, data.student_name, data.student_photo, data.date_of_birth, data.account_number, data.account_holder_name, data.IFSC_Code, data.shirt_size, data.student_id, data.examList]);
    }

    static createFormExamData(database, examId, data) {
        const sql = 'INSERT INTO dn_exam_rewards_student_exam_data (application_number, application_photo_url, admit_card_photo_url, result_photo_url, marks, percentage, percentile, grade, all_india_rank, state_rank, district_rank, category_rank, other_rank, other_rank_comment, text_testimonial, video_testimonial_qid, student_id, dn_exam_id, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)';
        return database.query(sql, [data.application_number, data.application_photo_url, data.admit_card_photo_url, data.result_photo_url, data.marks, data.percentage, data.percentile, data.grade, data.all_india_rank, data.state_rank, data.district_rank, data.category_rank, data.other_rank, data.other_rank_comment, data.text_testimonial, data.video_testimonial_qid, data.studentId, examId]);
    }

    static setPrizeFormData(database, data, studentId, examId) {
        let array = [data.account_holder_name, data.account_number, data.IFSC_code, studentId];
        let sql = 'UPDATE dn_exam_rewards_students_data SET account_holder_name = ?, account_number = ?, IFSC_code = ? where student_id = ? and is_active = 1';
        if (data.address_line_1) {
            sql = 'UPDATE dn_exam_rewards_students_data SET shirt_size = ?, address_student_name = ?, mobile = ?, address_line_1 = ?, address_line_2 = ?, address_line_3 = ?, city = ?, state = ?, pincode = ? where student_id = ? and is_active = 1';
            array = [data.shirt_size, data.address_student_name, data.mobile, data.address_line_1, data.address_line_2, data.address_line_3, data.city, data.state, data.pincode, studentId];
        }
        database.query(sql, array);
        sql = 'UPDATE dn_exam_rewards_student_exam_data SET is_address_filled = 1 where student_id = ? and is_active = 1 and dn_exam_id = ?';
        return database.query(sql, [studentId, examId]);
    }

    static setTestimonialFormData(database, studentId, examId, qid, text) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET text_testimonial = ?, video_testimonial_qid = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [text, qid, studentId, examId]);
    }

    static setResultFormData(database, studentId, examId, data) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET result_photo_url = ?, marks = ?, percentage = ?, percentile = ?, grade = ?, all_india_rank = ?, state_rank = ?, district_rank = ?, category_rank = ?, other_rank = ?, other_rank_comment = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [data.result_photo_url, data.marks, data.percentage, data.percentile, data.grade, data.all_india_rank, data.state_rank, data.district_rank, data.category_rank, data.other_rank, data.other_rank_comment, studentId, examId]);
    }

    static setAdmitFormData(database, studentId, examId, admitPhoto) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET admit_card_photo_url = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [admitPhoto, studentId, examId]);
    }

    static setApplicationFormData(database, studentId, examId, applicationNumber, applicationPhoto) {
        const sql = 'UPDATE dn_exam_rewards_student_exam_data SET application_number = ?, application_photo_url = ? where student_id = ? and dn_exam_id = ? and is_active = 1';
        return database.query(sql, [applicationNumber, applicationPhoto, studentId, examId]);
    }

    static setRegistrationFormData(database, studentId, examId, studentName, studentPhoto, dateOfBirth) {
        let sql = 'UPDATE dn_exam_rewards_students_data SET student_name = ?, student_photo = ?, date_of_birth = ? where student_id = ? and is_active = 1';
        database.query(sql, [studentName, studentPhoto, dateOfBirth, studentId, examId]);
        sql = 'UPDATE dn_exam_rewards_student_exam_data SET is_registration_filled = 1 where student_id = ? and is_active = 1 and dn_exam_id = ?';
        return database.query(sql, [studentId, examId]);
    }

    static getQuestionData(database, questionId) { // 37.5ms
        const sql = 'select q.question_image, a.answer_video from questions q join answers a on q.question_id = a.question_id where a.question_id = ?';
        return database.query(sql, [questionId]);
    }

    static getFromDNProperty(database, bucket, name) { // 41.3ms
        const sql = 'select value from dn_property where bucket = ? and name = ? and is_active = 1';
        return database.query(sql, [bucket, name]);
    }
};
