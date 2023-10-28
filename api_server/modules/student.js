const _ = require('lodash');
const moment = require('moment');
const knex = require('knex')({ client: 'mysql' });

const tables = require('./mysql/tables');
const redis = require('./redis/student');
const Utility = require('./utility');

module.exports = class Student {
    // static getStudentByUdid(udid,database){
    //   let sql = "SELECT student_id from students where udid = '"+udid +"'";
    //   return database.query(sql, {udid: udid})
    // }
    static getStudentLocale(student_id, database) {
        const sql = 'SELECT locale from students where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getStudentWithLocation(student_id, database) {
        const sql = 'select s.student_fname, s.student_lname, s.student_username as username, s.gender, s.student_class, s.locale, s.school_name, s.coaching, s.dob, s.img_url, sl.city , sl.latitude, sl.longitude from students s left join student_location sl on sl.student_id = s.student_id where s.student_id  = ?';
        return database.query(sql, [student_id]);
    }

    static getStudentLocation(student_id, database) {
        const sql = 'select city, latitude, longitude, state from student_location where student_id = ? limit 1';
        return database.query(sql, [student_id]);
    }

    static checkStudentByEmail(database, email, usFlag, isTransactional = 0) {
        let sql;
        if (usFlag) {
            sql = "select * from students where student_email = ? and clevertap_id = 'US_APP'";
        } else {
            sql = 'select * from students where student_email = ?';
        }
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [email]);
        }
        return database.query(sql, [email]);
    }

    static getStudentOptions(options, database) {
        const sql = `select * from profile_properties where type in (${options.join()}) and is_active = 1 order by priority,type desc`;
        return database.query(sql);
    }

    static getPreLoginOnboardingCheck(database, udid) {
        // console.log(database);
        // console.log(udid);
        const sql = 'SELECT * from pre_login_onboarding where udid = ?';
        return database.query(sql, [udid]);
    }

    static preLoginOnboardingUpdate(database, udid, obj) {
        const sql = 'UPDATE pre_login_onboarding  SET ? where udid = ?';
        return database.query(sql, [obj, udid]);
    }

    static preLoginOnboardingInsert(database, obj) {
        const sql = 'INSERT into pre_login_onboarding  SET  ? ';
        return database.query(sql, [obj]);
    }

    static getImgUrl(database) {
        const sql = 'select img_url from student_img_url order by rand() limit 3';
        return database.query(sql);
    }

    static convertPreOnboarding(database, udid, obj) {
        const sql = 'UPDATE pre_login_onboarding SET ? where udid = ?';
        return database.query(sql, [obj, udid]);
    }

    static getStudent(student_id, database) {
        const sql = 'SELECT * from students where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getStudentMinimal(student_id, database) {
        const sql = 'SELECT img_url, school_name, student_username from students where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getStudentClassAndCourse(student_id, database) {
        const sql = 'SELECT course_browse_history.class as student_class, course_browse_history.course from course_browse_history where course_browse_history.student_id = ? order by course_browse_history.created_at DESC limit 1';
        return database.query(sql, [student_id]);
    }

    static getStudentByUdid(udid, database, isTransactional = 0) {
        // DESC -> ASC
        const sql = 'SELECT * from students where udid = ? order by student_id asc';
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [udid]);
        }
        return database.query(sql, [udid]);
    }

    static getClevertapIdByStudentId(student_id, database) {
        const sql = 'SELECT clevertap_id from students where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static updateFcm(student_id, gcm_reg_id, app_version, database) {
        const params = {};
        if (typeof app_version !== 'undefined' && app_version) {
            params.app_version = app_version;
        }
        params.gcm_reg_id = gcm_reg_id;
        const sql = 'UPDATE students SET ?  where student_id = ?';
        return database.query(sql, [params, student_id]);
    }

    static updateAltAppGcm(database, obj, packageName, studentId) {
        const sql = 'UPDATE student_app_info SET ?  where student_id = ? and package_name=?';
        return database.query(sql, [obj, studentId, packageName]);
    }

    static updateAltAppGcmBasesOnUdid(database, obj, packageName, udid) {
        const sql = 'UPDATE student_app_info SET ?  where udid = ? and package_name=?';
        return database.query(sql, [obj, udid, packageName]);
    }

    static updateStudentByNewLogins(student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, mobile, database) {
        const params = { is_uninstalled: 0 };
        if (typeof app_version !== 'undefined' && app_version) {
            params.app_version = app_version;
        }
        if (typeof student_class !== 'undefined' && student_class) {
            params.student_class = student_class;
        }

        if (typeof language !== 'undefined' && language) {
            params.locale = language;
        }
        // if (typeof gcm_reg_id !== 'undefined' && gcm_reg_id) {
        //   params[' gcm_reg_id '] = gcm_reg_id;
        // }
        params.gcm_reg_id = gcm_reg_id;

        if (typeof clevertap_id !== 'undefined' && clevertap_id) {
            params.clevertap_id = clevertap_id;
        }
        params.mobile = mobile;

        const sql = 'UPDATE students SET ? where student_id = ?';
        return database.query(sql, [params, student_id]);
    }

    static retargetUsers(student_id, database) {
        const sql = 'SELECT * from retarget_student_churn where student_id = ? order by id Desc';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static updateCanBeTargeted(database, student_id, obj) {
        const sql = 'UPDATE retarget_student_churn SET ? where student_id = ?';
        return database.query(sql, [obj, student_id]);
    }

    static getNumForPush(database) {
        const sql = knex(tables.whatsAppPush).select('mobile_w').toQuery();
        return database.query(sql);
    }

    static delNumFromPush(database, phone) {
        const sql = knex(tables.whatsAppPush).delete().where({ mobile_w: phone }).toQuery();
        return database.query(sql);
    }

    static updateRetargetStudentChurn(database, student_id, can_be_targeted) {
        const sql = 'UPDATE retarget_student_churn SET ? where student_id= ? and reinstall_timestamp is null';
        const sqlParams = { can_be_targeted, reinstall_timestamp: moment().toISOString(), updated_at: moment().toISOString() };
        return database.query(sql, [sqlParams, student_id]);
    }

    static updateFcmByUdid(udid, gcm_reg_id, database) {
        const sql = 'UPDATE students SET ?  where udid = ?';
        return database.query(sql, [{ gcm_reg_id }, udid]);
    }

    static add(udid, language, class1, app_version, is_web, gcm_reg_id, student_username, student_email, mobile, database) {
        const sql = 'INSERT INTO students SET ?';
        const param = {};
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        } else {
            param.student_class = '12';
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        } else {
            param.locale = 'en';
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(student_username) && !_.isEmpty(student_username)) {
            param.student_username = student_username;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isNull(student_email) && !_.isEmpty(student_email)) {
            param.student_email = student_email;
        }
        if (!_.isNull(mobile) && !_.isEmpty(mobile)) {
            param.mobile = mobile;
        }
        param.is_web = is_web;
        param.udid = udid;
        param.student_fname = '';
        // param['student_email'] = ""
        param.is_online = 1;
        param.is_new_app = 1;
        // console.log('params');
        // console.log(param);
        return database.query(sql, param);
    }

    static updateSource(student_id, source, database) {
        const sql = 'UPDATE students SET ? WHERE student_id = ?';
        // console.log(sql);
        return database.query(sql, [{ fingerprints: source }, student_id]);
    }

    static addUser(data, database) {
        const {
            udid, language, class1, app_version, is_web, gcm_reg_id, student_username, student_email, mobile, clevertap_id, source,
        } = data;
        const sql = 'INSERT INTO students SET ?';
        const param = {};
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        } else {
            param.student_class = '12';
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        } else {
            param.locale = 'en';
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(student_username) && !_.isEmpty(student_username)) {
            param.student_username = student_username;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isNull(student_email) && !_.isEmpty(student_email)) {
            param.student_email = student_email;
        }
        if (!_.isNull(mobile) && !_.isEmpty(mobile)) {
            param.mobile = mobile;
        }
        if (!_.isNull(clevertap_id) && !_.isEmpty(clevertap_id)) {
            param.clevertap_id = clevertap_id;
        }
        param.is_web = is_web;
        if (!_.isNull(udid) && !_.isEmpty(udid)) {
            param.udid = udid;
        }
        if (!_.isNull(source) && !_.isEmpty(source)) {
            param.fingerprints = source;
        }
        param.student_fname = '';
        // param['student_email'] = ""
        param.is_online = 1;
        param.is_new_app = 1;
        // console.log('params');
        // console.log(param);
        return database.query(sql, param);
    }

    static checkUdid(udid, database, isTransactional = 0) {
        const sql = 'select * from student_onboard where udid = ?';
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [udid]);
        }
        return database.query(sql, [udid]);
    }

    static updateOnboard(params, database) {
        const sql = 'update student_onboard SET ? where udid = ?';
        return database.query(sql, [params, params.udid]);
    }

    static insertOnboard(params, database) {
        const sql = 'INSERT IGNORE INTO student_onboard SET ?';
        return database.query(sql, params);
    }
    // -- app version added

    static setLang(lang, student_id, database) {
        const sql = 'UPDATE students SET ? WHERE student_id = ?';
        // console.log(sql);
        return database.query(sql, [{ locale: lang }, student_id]);
    }

    static setLangUdid(lang, udid, database) {
        const sql = 'UPDATE students SET ? WHERE udid = ?';
        // console.log(sql);
        return database.query(sql, [{ locale: lang }, udid]);
    }

    static setClass(class1, is_dropped, student_id, database) {
        const sql = 'UPDATE students SET ? WHERE student_id = ?';
        return database.query(sql, { student_class: class1, is_dropped });
    }

    static checkStudentExists(phone_number, database, isTransactional = 0) {
        let sql;
        if (Utility.isInputEmailId(phone_number)) {
            sql = 'SELECT * FROM students where student_email= ?';
        } else {
            sql = 'SELECT * FROM students where mobile = ?';
        }
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [phone_number]);
        }
        return database.query(sql, [phone_number]);
    }

    static checkStudentExistsGlobal(phone_number, usFlag, database, isTransactional = 0) {
        let sql;
        if (Utility.isInputEmailId(phone_number)) {
            sql = "SELECT * FROM students where student_email=? and clevertap_id ='US_APP'";
        } else if (usFlag) {
            sql = "SELECT * FROM students where mobile =? and clevertap_id ='US_APP'";
        } else {
            sql = 'SELECT * FROM students where mobile =?';
        }
        if (isTransactional) {
            return database.singleQueryTransaction(sql, [phone_number]);
        }
        return database.query(sql, [phone_number]);
    }

    static checkInternationalStudentExists(phone_number, country_code, database, isTransactional = 0) {
        let sql;
        const param = [];
        if (country_code == '+91' || country_code == '91') {
            param.push(phone_number);
            sql = 'SELECT * FROM students where mobile= ?';
        } else {
            param.push(phone_number, country_code);
            sql = 'SELECT * FROM students where mobile= ? and country_code = ?';
        }
        if (isTransactional) {
            return database.singleQueryTransaction(sql, param);
        }
        return database.query(sql, param);
    }

    static addByMobile(phone_number, email, class1, language, app_version, gcm_reg_id, student_username, udid, is_web, database) {
        const sql = 'INSERT INTO students SET ?';
        const params = {
            mobile: phone_number,
            student_email: email,
            student_class: class1,
            locale: language,
            app_version,
            student_username,
            udid,
            is_web,
            is_new_app: 1,
        };
        if (gcm_reg_id != null) {
            params.gcm_reg_id = gcm_reg_id;
        }
        return database.query(sql, params);
    }

    static addByMobileUpdated(data, database) {
        const {
            phone_number, email, class1, language, app_version, gcm_reg_id, student_username, udid, is_web, clevertap_id, fingerprint, region, is_alt_app,
        } = data;
        const sql = 'INSERT INTO students SET ?';
        const params = {
            locale: language,
            app_version,
            student_username,
            udid,
            is_web,
            is_new_app: 1,
            clevertap_id,
        };
        if (Utility.isInputEmailId(phone_number)) {
            params.student_email = phone_number;
        } else {
            params.mobile = phone_number;
        }

        if (!_.isEmpty(gcm_reg_id)) {
            params.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isEmpty(email)) {
            params.student_email = email;
        }
        if (!_.isEmpty(class1)) {
            params.student_class = class1;
        }
        if (!_.isEmpty(fingerprint)) {
            params.fingerprints = fingerprint;
        }
        if (!_.isEmpty(region)) {
            params.clevertap_id = `${region}_APP`;
        }
        // if (is_alt_app) {
        //     params.clevertap_id = 'ALT_APP';
        // }
        params.updated_at = moment().add(5, 'h').add(30, 'minute').toISOString();
        return database.query(sql, params);
    }

    static updateStudentByMobile(email, contact, class1, language, app_version, gcm_reg_id, udid, is_web, database) {
        const sql = 'UPDATE students SET ? WHERE mobile = ?';
        const param = { is_uninstalled: 0 };
        if (!_.isNull(email) && !_.isEmpty(email)) {
            param.student_email = email;
        }
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isNull(udid) && !_.isEmpty(udid)) {
            param.udid = udid;
        }
        if (!_.isNull(is_web) && !_.isEmpty(is_web)) {
            param.is_web = is_web;
        }
        param.is_new_app = 1;
        // if (!_.isNull(student_username)) {
        //   param['student_username'] = student_username
        // }
        return database.query(sql, [param, contact]);
    }

    static async updateStudentByFirebaseLogin(student_id, gcm_reg_id, clevertap_id, class1, language, app_version, mobile, email_id, country_code, database) {
        const sql = 'UPDATE students SET ? WHERE student_id = ?';
        // console.log(sql);
        const param = {};
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        }
        if (!_.isNull(clevertap_id) && !_.isEmpty(clevertap_id)) {
            param.clevertap_id = clevertap_id;
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(mobile) && !_.isEmpty(mobile)) {
            param.mobile = mobile;
        }
        if (!_.isNull(email_id) && !_.isEmpty(email_id)) {
            param.student_email = email_id;
        }
        if (!_.isNull(country_code) && !_.isEmpty(country_code)) {
            param.country_code = country_code;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }

        if (_.size(param)) {
            return database.query(sql, [param, student_id]);
        }
        return true;
    }

    static async updateAltAppLoginStudent(database, obj) {
        const sql = 'INSERT INTO student_app_info (gcm_reg_id,udid,gaid,package_name,student_id) VALUES (?,?,?,?,?) on DUPLICATE KEY UPDATE gcm_reg_id = ?, udid=?,gaid=?';
        return database.query(sql, [obj.gcm_reg_id, obj.udid, obj.gaid, obj.package_name, obj.student_id, obj.gcm_reg_id, obj.udid, obj.gaid]);
    }

    static updateStudentByMobileLatest(data, database) {
        const {
            email, contact, class1, language, app_version, gcm_reg_id, is_web, region,
        } = data;
        const sql = 'UPDATE students SET ? WHERE mobile = ?';
        const param = { is_uninstalled: 0 };
        if (!_.isNull(email) && !_.isEmpty(email)) {
            param.student_email = email;
        }
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        // if (!_.isNull(udid) && !_.isEmpty(udid)) {
        //     param.udid = udid;
        // }
        if (!_.isNull(is_web) && !_.isEmpty(is_web)) {
            param.is_web = is_web;
        }
        if (!_.isNull(region) && !_.isEmpty(region)) {
            param.clevertap_id = `${region}_APP`;
        }
        param.is_new_app = 1;
        return database.query(sql, [param, contact]);
    }

    static async updateStudentByUdid(udid, class1, language, app_version, gcm_reg_id, email, mobile, database) {
        const sql = 'UPDATE students SET ? WHERE udid = ?';
        const param = { is_uninstalled: 0 };
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(mobile) && !_.isEmpty(mobile)) {
            if (Utility.isInputEmailId(mobile)) {
                param.student_email = mobile;
            } else {
                param.mobile = mobile;
                if (!_.isNull(email) && !_.isEmpty(email)) {
                    param.student_email = email;
                }
            }
        }

        param.is_new_app = 1;

        if (_.size(param) && udid && udid.length > 0) {
            return database.query(sql, [param, udid]);
        }
        return true;
    }

    static async updateStudentByUdidUpdated(data, database) {
        const {
            udid, class1, language, app_version, gcm_reg_id, email, mobile, clevertap_id,
        } = data;
        const sql = 'UPDATE students SET ? WHERE udid = ?';
        console.log(sql);
        const param = {};
        if (!_.isNull(class1) && !_.isEmpty(class1)) {
            param.student_class = class1;
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        }
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(mobile) && !_.isEmpty(mobile)) {
            param.mobile = mobile;
        }
        if (!_.isNull(email) && !_.isEmpty(email)) {
            param.student_email = email;
        }
        if (!_.isNull(clevertap_id) && !_.isEmpty(clevertap_id)) {
            param.clevertap_id = clevertap_id;
        }
        param.is_new_app = 1;

        if (_.size(param)) {
            return database.query(sql, [param, udid]);
        }
        return true;
    }

    static getStudentQuestionHistory(student_id, limit, database) {
        const sql = 'SELECT video_view_stats.question_id, questions.ocr_text,questions.question FROM video_view_stats,questions WHERE video_view_stats.question_id = questions.question_id AND  video_view_stats.student_id = ? order by video_view_stats.created_at DESC LIMIT ?';
        return database.query(sql, [student_id, limit]);
    }

    static getStudentQuestionHistoryList(student_id, limit, database) {
        const sql = 'select b.matched_question,a.question_id , b.question,b.ocr_text as ocr_text from (select question_id,'
            + ' max(view_id) as view_id from video_view_stats where student_id = ? group by question_id) as a left'
            + ' join (select question_id ,ocr_text,question,matched_question from questions where is_answered=1 or is_text_answered =1 ) as b on a.question_id ='
            + ' b.question_id order by a.view_id DESC limit ?';
        return database.query(sql, [student_id, limit]);
    }

    static getStudentQuestionHistoryListWithLanguage(student_id, limit, language, database) {
        // let sql = "SELECT video_view_stats.question_id, questions.ocr_text FROM video_view_stats,questions WHERE video_view_stats.question_id = questions.question_id AND  video_view_stats.student_id = '" + student_id + "' order by video_view_stats.created_at LIMIT " + limit;
        const sql = `select b.matched_question,a.question_id , case when c.${language} is null then b.ocr_text else c.${language} end as ocr_text, b.question from (select distinct question_id from video_view_stats where student_id = ? order by created_at desc LIMIT ?) as a left join (select question_id ,ocr_text,question,matched_question from questions) as b on a.question_id = b.question_id left join (select question_id,${language} from questions_localized) as c on a.question_id=c.question_id`;
        return database.query(sql, [student_id, limit]);
    }

    static subscribedStudentData(student_id, is_answered, database) {
        const sql = 'SELECT questions.question_id,questions.ocr_text,questions.question,questions.is_skipped FROM subscriptions,questions WHERE subscriptions.scheme_id <> \'NEW_REGISTER\' AND subscriptions.end_date > CURDATE() AND subscriptions.student_id = ? AND questions.question_credit = 0 AND questions.student_id = subscriptions.student_id AND is_answered = ?';
        return database.query(sql, [student_id, is_answered]);
    }

    static subscribedStudentHistory(student_id, is_answered, limit, database) {
        let sql = '';
        if (is_answered) {
            sql = 'select b.question_id, b.ocr_text,b.question,b.question_image,b.matched_question from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> \'NEW_REGISTER\' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a INNER join (select * from questions where student_id = ? AND is_answered = ? and question_credit = 0) as b on a.student_id = b.student_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as d on b.question_id = d.question_id order by d.answer_id desc limit ?';
        } else {
            sql = 'select b.question_id, b.ocr_text,b.question,b.question_image, c.skip_message,b.is_skipped from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> \'NEW_REGISTER\' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a INNER join (select * from questions where student_id = ? AND is_answered = ?  and question_credit = 0) as b on a.student_id = b.student_id left join (select skip_message,question_id from expert_skipped_question) as c on b.question_id = c.question_id order by b.question_id desc limit ?';
        }
        // console.log(sql);
        return database.query(sql, [student_id, student_id, is_answered, limit]);
    }

    static subscribedStudentHistoryWithLanguage(student_id, is_answered, limit, language, database) {
        let sql = '';
        if (is_answered) {
            sql = `select b.question_id, case when e.${language} is null then b.ocr_text else e.${language} end as ocr_text,b.question,b.question_image from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> 'NEW_REGISTER' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a INNER join (select * from questions where student_id = ? AND is_answered = ? and question_credit = 0) as b on a.student_id = b.student_id left join (select question_id, max(answer_id) as answer_id from answers group by question_id) as d on b.question_id = d.question_id left join (select question_id,max(${language}) as ${language} from questions_localized group by question_id) as e on b.question_id=e.question_id order by d.answer_id desc limit ?`;
        } else {
            sql = `select b.question_id, case when e.${language} is null then b.ocr_text else e.${language} end as ocr_text,b.question,b.question_image, c.skip_message,b.is_skipped from (select distinct student_id from subscriptions where student_id = ? AND scheme_id <> 'NEW_REGISTER' AND CURDATE() >= start_date AND CURDATE() <= end_date) as a INNER join (select * from questions where student_id = ? AND is_answered = ?  and question_credit = 0) as b on a.student_id = b.student_id left join (select skip_message,question_id from expert_skipped_question) as c on b.question_id = c.question_id left join (select question_id,max(${language}) as ${language} from questions_localized group by question_id) as e on b.question_id=e.question_id order by b.question_id desc limit ?`;
        }
        // console.log(sql);
        return database.query(sql, [student_id, student_id, is_answered, limit]);
    }

    static subscribedStudentUnansweredHistory(student_id, limit, database) {
        const sql = 'select *, questions.timestamp as question_timestamp, questions.question_id as qid,questions.student_id as sid, questions.matched_question as matched_question from questions  where questions.student_id =? and questions.is_answered=0 and questions.question_credit=0 and questions.is_skipped < 2 order by questions.timestamp desc limit ?';
        return database.query(sql, [student_id, limit]);
    }

    static getUser(user_id, database, client) {
        let flag;
        return this.getUserFromRedis(user_id, client).then((user) => {
            // console.log('2');
            // console.log('res');
            // console.log(user);
            // console.log(err)
            if ((user === null) || (typeof user === 'undefined') || user == undefined) {
                // console.log('3');
                flag = true;
                return this.getUserFromMysql(user_id, database);
            }
            // console.log('4');
            flag = false;
            return user;
        }).then((res) => {
            if (flag == true) {
                // console.log('res2');
                // console.log(res)

                // this.setUserInRedis(res, user_id, client);

                // return JSON.stringify(res)
                if (res == '[]') {
                    // this.setUserInRedis(res, user_id, client);
                    return res;
                }
                this.setUserInRedis(res, user_id, client);
                return JSON.stringify(res);

                // this.setUserInRedis(res, user_id, client);
                // return JSON.stringify(res)
            }
            // console.log('5');
            // console.log(typeof res)
            // console.log(res)
            return res;
        }).catch((error) => {
            console.log(error);
            return '[{}]';
        });
    }

    static getUserFromMysql(userid, database) {
        const sql = 'SELECT * FROM students WHERE student_id= ?';
        return database.query(sql, [userid]);
    }

    static getUserFromRedis(userid, client) {
        return redis.getById(userid, client);
    }

    static setUserInRedis(user, user_id, client) {
        return redis.setById(user_id, user, client);
    }

    static deleteUserInRedis(user_id, client) {
        // console.log('deleting user in redis');
        return redis.delById(client, user_id);
    }

    static updateUserToken(userid, token, database, client) {
        const sql = 'UPDATE students SET access_token = ? WHERE student_id=?';
        database.query(sql, [token, userid]).then(
            (res) =>
                // console.log(`hi user setted in redis${res}`);
                this.setUserInRedis(userid, database, client)
            ,
        ).catch((error) => {
            console.log(error);
        });
    }

    static getUserProfile(id, database) {
        const sql = `${'Select a.student_id, a.student_fname,a.student_lname,a.student_email,a.locale,a.img_url,a.school_name,a.student_class,a.student_username,a.pincode,a.coaching,a.dob,b.total_questions_asked, c.count_v1  as old_video_table_count, d.count_v2  as new_video_table_count, c.old_video_table_views, d.new_video_table_views,e.language,e.language_display,f.course as student_course from '
            + "(select * from students where student_id = '"}${id}') as a left JOIN `
            + `(select student_id, count(question_id) as total_questions_asked from questions where student_id = '${id}')`
            + ' as b on a.student_id=b.student_id left join '
            + `(select student_id, count(view_id) as count_v1, sum(video_time) as old_video_table_views from view_download_stats_new where student_id='${id}' and is_duplicate=0 group by student_id) `
            + 'as c on a.student_id=c.student_id left JOIN '
            + `(select student_id, count(view_id) as count_v2, sum(video_time) as new_video_table_views from video_view_stats where student_id='${id}' group by student_id)`
            + ` as d on a.student_id=d.student_id left join (select * from languages) as e on e.code = a.locale left join(select course,student_id from course_browse_history where student_id = '${id}' order by created_at desc limit 1) as f on a.student_id = f.student_id`;
        // TODO merge both tables
        return database.query(sql);
    }

    static getUserProfileNew(id, language, database) {
        const sql = 'SELECT first.*,second.student_class_display from (Select a.student_id, a.student_fname,a.student_lname,a.student_email,a.locale,a.img_url,a.school_name,a.student_class,a.student_username,a.pincode,a.coaching,a.dob,b.total_questions_asked, c.count_v1  as old_video_table_count, d.count_v2  as new_video_table_count, c.old_video_table_views, d.new_video_table_views,e.language,e.language_display,f.course as student_course from (select * from students where student_id = ?) as a left JOIN '
            + '(select student_id, count(question_id) as total_questions_asked from questions_new where student_id = ?)'
            + ' as b on a.student_id=b.student_id left join '
            + '(select student_id, count(view_id) as count_v1, sum(video_time) as old_video_table_views from view_download_stats_new where student_id=? and is_duplicate=0 group by student_id) '
            + 'as c on a.student_id=c.student_id left JOIN '
            + '(select student_id, count(view_id) as count_v2, sum(video_time) as new_video_table_views from video_view_stats where student_id=? group by student_id)'
            + ` as d on a.student_id=d.student_id left join (select * from languages) as e on e.code = a.locale left join(select course,student_id from course_browse_history where student_id = ? order by id desc limit 1) as f on a.student_id = f.student_id) as first left join (SELECT class as stu_class,${language} as student_class_display from class_display_mapping) as second on first.student_class=second.stu_class`;
        // TODO merge both tables
        // console.log(sql);
        return database.query(sql, [id, id, id, id, id]);
    }

    static updateUserProfile(id, params, database) {
        const sql = 'UPDATE students SET ? where student_id = ?';
        return database.query(sql, [params, id]);
    }

    static updateAltAppUserProfile(database, obj) {
        const sql = 'INSERT INTO student_app_info (gcm_reg_id,gaid,package_name,student_id,udid) VALUES (?,?,?,?,?) on DUPLICATE KEY UPDATE gcm_reg_id = ?, gaid=?, udid=?';
        return database.query(sql, [obj.gcm_reg_id, obj.gaid, obj.package_name, obj.student_id, obj.udid, obj.gcm_reg_id, obj.gaid, obj.udid]);
    }

    static getGcmByStudentId(student_id, database) {
        const sql = 'select gcm_reg_id, is_online, locale, mobile from students where student_id =?';
        return database.query(sql, [student_id]);
    }

    static logout(client, receivedToken) {
        return new Promise(((resolve, reject) => {
            // Do async job
            client.hdel('tokens', receivedToken, (err, res) => {
                if (err === null) {
                    return resolve(res);
                }
                return reject(err);
            });
        }));
    }

    static checkUsername(username, student_id, database) {
        const sql = 'select student_id from students where student_username = ? and student_id !=?';
        return database.query(sql, [username, student_id]);
    }

    static isSubscribed(student_id, database) {
        const sql = 'select distinct student_id from subscriptions where student_id = ? AND scheme_id <> \'NEW_REGISTER\' AND CURDATE() >= start_date AND CURDATE() <= end_date';
        return database.query(sql, [student_id]);
    }

    static addReferredUser(student_id, received_id, database) {
        const sql = 'INSERT INTO students_invites (received_id,sent_id) VALUES (?,?)';
        // console.log(sql);
        return database.query(sql, [student_id, received_id]);
    }

    static countUserReferrals(database, student_id) {
        // the referral for VIP will be counted from 2020-01-07
        const sql = 'select count(*) as count from students_invites where sent_id = ? and date(timestamp) >= \'2020-01-07\' ';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static getStudentsJoined(student_id, database) {
        const sql = 'SELECT count(*) as count FROM students_invites WHERE sent_id =? AND DATE(timestamp) = CURRENT_DATE';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static getHowItWorks(sclass, database) {
        const sql = 'SELECT key_value  FROM app_configuration WHERE class in (?,\'all\') AND key_name =\'How it works?\'';
        // console.log(sql);
        return database.query(sql, [sclass]);
    }

    static getHowItWorksSubscription(database) {
        const sql = 'SELECT key_value  FROM app_configuration WHERE class in (\'all\') AND key_name =\'subscription_referral\'';
        // console.log(sql);
        return database.query(sql);
    }

    static getReferredUsers(student_id, database) {
        const sql = 'SELECT student_id,img_url as profile_image,student_username from students INNER JOIN (select sent_id,received_id, timestamp FROM students_invites where sent_id=?) as a on a.received_id=students.student_id order by a.timestamp DESC';
        return database.query(sql, [student_id]);
    }

    static read_test(database) {
        const sql = 'SELECT * FROM health_check';
        return database.query(sql);
    }

    static write_test(time, writeDatabase) {
        const sql = 'UPDATE health_check set timestamp=?';
        // console.log(sql);
        return writeDatabase.query(sql, [time]);
    }

    static checkHistory(student_id, database) {
        const sql = 'select count(*) as show_history from video_view_stats where student_id=? and is_back=0 and source=\'android\'';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static async storeStudentData(studentId, app_data, mongodb) {
        const data = {
            student_id: studentId,
            app_data,
            created_at: moment().toDate(),
            updated_at: moment().toDate(),
        };

        const query = { student_id: studentId };
        mongodb.collection('student_app_data').find(query).limit(1).toArray((err, result) => {
            if (err || !result || !result.length) {
                console.log(err);
                return mongodb.collection('student_app_data').save(data);
            }
            const updateResult = mongodb.collection('student_app_data').updateMany({ _id: result[0]._id }, { $set: { app_data, updated_at: moment().toDate() } });
            return updateResult;
        });

        // console.log(objDataString);
        // console.log(typeof objDataString);
        // console.log('+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++');
        // sql = 'SELECT * FROM student_data_table WHERE student_id= ? and type= ?';
        // const result = await database.query(sql, [student_id, type]);
        // if (result.length == 0) {
        //     sql = 'INSERT INTO student_data_table SET ?';
        //     // console.log(sql);
        //     return database.query(sql, [obj]);
        // }

        // sql = 'UPDATE student_data_table SET data=? where student_id=? and type=?';
        // return database.query(sql, [data, student_id, type]);
    }

    static checkIfUdid(udid, database) {
        const sql = 'select * from students_web where udid = ?';
        return database.query(sql, [udid]);
    }

    static checkIfUdidWeb(udid, database) {
        const sql = 'select * from students where udid = ?';
        return database.query(sql, [udid]);
    }

    static updateGcmReg(database, gcm_reg_id, udid) {
        const sql = 'UPDATE students_web SET gcm_reg_id =? where udid=?';
        return database.query(sql, [gcm_reg_id, udid]);
    }

    static updateGcmRegWeb(database, gcm_reg_id, udid) {
        const sql = 'UPDATE students SET gcm_reg_id =? where udid=?';
        return database.query(sql, [gcm_reg_id, udid]);
    }

    static insertGcmReg(database, gcm_reg_id, udid) {
        // let sql ="INSERT INTO students_web SET (gcm_reg_id, udid) VALUES ('"+gcm_reg_id+"', '"+udid+"')"
        const sql = 'INSERT INTO `students_web` (`gcm_reg_id`, `udid`) VALUES (?, ?)';
        // console.log(sql);
        return database.query(sql, [gcm_reg_id, udid]);
    }

    static insertGcmRegWeb(database, gcm_reg_id, udid) {
        const sql = 'INSERT INTO `students` (`gcm_reg_id`, `udid`, `is_web`) VALUES (?, ?, \'1\')';
        return database.query(sql, [gcm_reg_id, udid]);
    }

    static updateEmailId(database, email, udid) {
        const sql = 'UPDATE students_web SET email_id =? where udid=?';
        return database.query(sql, [email, udid]);
    }

    static updateSocialAuthEmailId(database, student_id, obj) {
        const sql = 'UPDATE students SET ?  where student_id=?';
        return database.query(sql, [obj, student_id]);
    }

    static insertEmailId(database, email, udid) {
        // let sql ="INSERT INTO students_web SET (gcm_reg_id, udid) VALUES ('"+gcm_reg_id+"', '"+udid+"')"
        const sql = 'INSERT INTO `students_web` (`email_id`, `udid`) VALUES (?, ?)';
        // console.log(sql);
        return database.query(sql, [email, udid]);
    }

    static insertNewUser(database, obj) {
        const sql = 'INSERT INTO students SET ? ';
        return database.query(sql, [obj]);
    }

    static getWhaStudentInfo(database, studentId) {
        const sql = 'Select * from whatsapp_students where student_id = ?';
        return database.query(sql, [studentId]);
    }

    static addWhaStudent(database, obj) {
        const sql = 'INSERT INTO whatsapp_students SET ? ';
        return database.query(sql, [obj]);
    }

    static updateWhaStudent(database, params, studentId) {
        const sql = 'UPDATE whatsapp_students SET ? where student_id = ?';
        return database.query(sql, [params, studentId]);
    }

    static updateStudentByTruecallerLogin(database, student_id, gcm_reg_id, clevertap_id, student_class, language, app_version, contact, student_fname, student_lname) {
        const param = { is_uninstalled: 0 };
        if (!_.isNull(gcm_reg_id) && !_.isEmpty(gcm_reg_id)) {
            param.gcm_reg_id = gcm_reg_id;
        }
        if (!_.isNull(clevertap_id) && !_.isEmpty(clevertap_id)) {
            param.clevertap_id = clevertap_id;
        }
        if (!_.isNull(student_class) && !_.isEmpty(student_class)) {
            param.student_class = student_class;
        }
        if (!_.isNull(app_version) && !_.isEmpty(app_version)) {
            param.app_version = app_version;
        }
        if (!_.isNull(student_fname) && !_.isEmpty(student_fname) && student_fname != null && student_fname != undefined && student_fname != 'null') {
            param.student_fname = student_fname;
        }
        if (!_.isNull(student_lname) && student_lname != null && student_lname != undefined && student_lname != 'null') {
            param.student_lname = student_lname;
        }
        if (!_.isNull(language) && !_.isEmpty(language)) {
            param.locale = language;
        }
        if (!_.isNull(contact) && !_.isEmpty(contact)) {
            param.mobile = contact;
        }
        const sql = 'UPDATE students SET ? WHERE student_id = ?';
        return database.query(sql, [param, student_id]);
    }

    static updateStudentDetails(database, params, studentId) {
        const sql = 'UPDATE students SET ? where student_id = ?';
        return database.query(sql, [params, studentId]);
    }

    static null_test(date, date1, db) {
        const sql = 'SELECT count(question_id) as count FROM questions where ((question_image is NULL and ocr_text is NULL) or is_trial=3) and timestamp>= ? and timestamp <= ? and doubt not like \'web\' and doubt not like \'whatsapp%\' and student_id>100';
        // const sql = `UPDATE students SET ? where student_id =${studentId}`;
        // console.log(sql);
        return db.query(sql, [date, date1]);
    }

    static insertStudentsLoginInfo(database, obj) {
        const sql = 'INSERT INTO students_login SET ?';
        return database.query(sql, [obj]);
    }

    static updateLoginStatus(database, id, session_id) {
        const sql = `UPDATE students_login SET is_login = 1 , sess_id ='${session_id}' where id= ${id}`;
        return database.query(sql);
    }

    static updateLoginVerifyInfo(database, id) {
        const sql = `UPDATE students_login SET  is_verified = 1  where id= ${id}`;
        return database.query(sql);
    }

    static updateGuestLoginVerification(database, obj, id) {
        const sql = 'UPDATE students_login SET ? where id = ?';
        return database.query(sql, [obj, id]);
    }

    static updateVerifiedStatus(database, session_id) {
        const sql = `UPDATE students_login SET is_verified = 1  WHERE sess_id = '${session_id}' order by created_at desc limit 1`;
        return database.query(sql);
    }

    static isOldActiveUser(database, mobile) {
        // 34 ms
        const sql = 'SELECT mobile,udid,is_verified FROM students_login WHERE mobile=? and source=0 and udid IS NOT NULL order by id desc limit 1';
        return database.query(sql, [mobile]);
    }

    static updateTruecallerLoginSuccessInfo(database, id, contact) {
        const sql = 'UPDATE students_login SET is_login = 1, mobile=?  WHERE id=?';
        return database.query(sql, [contact, id]);
    }

    static insertStudentClass(database, classVal, student_id) {
        const sql = `INSERT INTO students_new_class (student_id, student_class) VALUES ('${student_id}', '${classVal}')`;
        return database.query(sql);
    }

    static updateStudentClass(database, id, student_id) {
        const sql = 'UPDATE students_new_class SET updated = 1 WHERE id = ? AND student_id = ?';
        return database.query(sql, [id, student_id]);
    }

    static getUpdatedDataBySid(database, sid) {
        const sql = 'SELECT * FROM students_new_class WHERE student_id = ? AND updated = 1';
        return database.query(sql, [sid]);
    }

    static deleteBoardAndExam(sid, database) {
        const sql = 'DELETE FROM student_course_mapping WHERE student_id = ?';
        return database.query(sql, [sid]);
    }

    static getStudentListByMobile(database, mobileList) {
        const sql = 'SELECT * from students where mobile IN (?)';
        return database.query(sql, [mobileList]);
    }

    static storeSelfieImg(database, obj) {
        const sql = 'INSERT INTO students_selfie SET ?';
        return database.query(sql, [obj]);
    }

    static addOtpRecord(obj, database) {
        const sql = 'INSERT INTO otp_records SET ?';
        return database.query(sql, [obj]);
    }

    static updateOtpRecord(obj, mobile, session_id, database) {
        const sql = 'UPDATE otp_records  SET ? WHERE mobile = ? AND session_id = ? AND status = \'PENDING\'';
        return database.query(sql, [obj, mobile, session_id]);
    }

    static insertNotificationRecord(database, obj) {
        const sql = 'INSERT INTO live_class_notification_records SET ?';
        return database.query(sql, [obj]);
    }

    static insertClassFailedOnboardingData(database, obj) {
        const sql = 'INSERT INTO class_failed_onboarding SET ?';
        return database.query(sql, [obj]);
    }

    static getErrorRate(database) {
        const sql = 'SELECT * FROM `otp_records` WHERE `time` > (now() - interval 30 minute) AND status = "ERROR"';
        return database.query(sql);
    }

    static getOtpServiceOrder(database) {
        const sql = 'SELECT * FROM `dn_property` WHERE `bucket` = "Otp_Service" AND is_active = 1 AND priority <= 3 ORDER BY priority';
        return database.query(sql);
    }

    static updateOtpServiceOrder(database, obj, nameVal) {
        const sql = 'UPDATE dn_property SET ? WHERE name = ?';
        return database.query(sql, [obj, nameVal]);
    }

    static insertWebStudentMapping(database, obj) {
        const sql = 'INSERT INTO web_student_mapping SET ?';
        return database.query(sql, [obj]);
    }

    static getLatLongByUdid(database, udid) {
        const sql = 'SELECT * FROM student_onboard WHERE udid = ? ORDER BY iD DESC LIMIT 1';
        return database.query(sql, [udid]);
    }

    static getStudentLocationDetails(database, student_id) {
        const sql = 'SELECT * FROM student_location WHERE student_id = ? ORDER BY iD DESC LIMIT 1';
        return database.query(sql, [student_id]);
    }

    static getStudentDataBySid(database, student_id) {
        const sql = 'SELECT * FROM students WHERE student_id = ?';
        return database.query(sql, [student_id]);
    }

    static getStateNameByLocale(database, stateDbId, locale, studentClass) {
        let sql = 'SELECT b.id AS id, a.course_name as state_name, b.course_meta as sub_title FROM course_display_ordering_mapping AS a LEFT JOIN class_course_mapping AS b ON a.course_name = b.course WHERE a.id = ? AND b.class = ?';
        if (locale === 'hi') {
            sql = 'SELECT b.id AS id, a.hindi_name as state_name, a.hindi_meta as sub_title FROM course_display_ordering_mapping AS a LEFT JOIN class_course_mapping AS b ON a.course_name = b.course WHERE a.id = ? AND b.class = ?';
        }
        return database.query(sql, [stateDbId, studentClass]);
    }

    static boardModificationRecord(database, obj) {
        const sql = 'INSERT INTO board_modification SET ?';
        return database.query(sql, [obj]);
    }

    static getStudentOptionsByRegion(database, options, region) {
        const sql = `select * from profile_properties where type in (${options.join()}) and region = ? and is_active = 1 order by priority,type desc`;
        return database.query(sql, [region]);
    }

    static updateStudentViaSocialLogin(database, student_id, obj) {
        const sql = 'UPDATE students SET ? where student_id = ?';
        return database.query(sql, [obj, student_id]);
    }

    static getStudentWithFacebookUserID(facebookUserID, database) {
        const sql = 'SELECT * FROM students where email_verification_code = ?';
        return database.query(sql, [facebookUserID]);
    }

    static deleteFacebookUser(studentID, deleteUserObj, database) {
        const sql = 'UPDATE students SET ?  where student_id = ?';
        return database.query(sql, [deleteUserObj, studentID]);
    }

    static insertStudentDoubtnutPayWallBucketMappingData(database, obj) {
        const sql = 'insert into student_doubtnut_paywall_bucket_mapping set ?';
        return database.query(sql, [obj]);
    }

    static insertStudentDoubtnutPaywallQuestionAskCount(database, obj) {
        const sql = 'insert into student_doubtnut_paywall_question_asked_count_mapping set ?';
        return database.query(sql, [obj]);
    }

    static checkStudentDoubtnutPayWallBucketMappingData(database, student_id) {
        const sql = 'select * from student_doubtnut_paywall_bucket_mapping where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static setStudentLocation(database, obj) {
        const sql = 'insert into student_location set ?';
        return database.query(sql, [obj]);
    }

    static updateStudentLocation(database, obj, student_id) {
        const sql = 'update student_location set ? where student_id = ?';
        return database.query(sql, [obj, student_id]);
    }
};
