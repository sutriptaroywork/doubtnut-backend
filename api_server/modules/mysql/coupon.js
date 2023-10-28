module.exports = class Coupon {
    static getCouponByCode(couponcode, database) {
        couponcode = couponcode.toLowerCase();
        const sql = 'select * from coupons_new where coupon_code = ? ';
        console.log(sql);
        return database.query(sql, [couponcode]);
    }

    static insert_coupon_package_id_mapping(package_id, coupon_code, database) {
        try {
            const data = {};
            data.coupon_code = coupon_code;
            data.package_id = package_id;
            data.updated_by = 'system';
            const sectionsql = 'INSERT INTO coupon_course_mapping set ?';
            console.log(sectionsql);
            return database.query(sectionsql, data);
        } catch (e) {
            console.log(e);
        }
    }

    static insert_coupon_student_id_mapping(
        student_id,
        coupon_code,
        coupon_applicability_type,
        database,
    ) {
        console.log('insert_coupon_student_id_mapping');
        const data = {};
        data.coupon_code = coupon_code;
        data.value = student_id;
        data.type = coupon_applicability_type;
        const sectionsql = 'INSERT INTO coupon_applicability set ?';
        return database.query(sectionsql, data);
    }

    static insert_coupon_student_id_mapping_obj(
        database, obj,
    ) {
        const sectionsql = 'INSERT INTO coupon_applicability set ?';
        return database.query(sectionsql, obj);
    }

    static insert_coupon_assortment_mapping(
        database,
        couponCodeAssortmentData,
    ) {
        const sql = 'INSERT into coupon_applicability set ?';
        return database.query(sql, couponCodeAssortmentData);
    }

    static insert_coupon_target_group_id_mapping(
        database,
        couponCodeTargetData,
    ) {
        const sql = 'INSERT into coupon_applicability set ?';
        return database.query(sql, couponCodeTargetData);
    }

    static insert_coupon(database, couponData) {
        const sql = 'INSERT into coupons_new set ?';
        return database.query(sql, couponData);
    }

    static getTargetGroupCouponByCode(couponcode, database) {
        couponcode = couponcode.toLowerCase();
        const sql = `SELECT tg.*, ca.type,ca.coupon_code
        FROM coupon_applicability AS ca
           INNER JOIN
           target_group AS tg
           ON ca.value = tg.id
          where ca.coupon_code = ? AND type = "target-group" AND is_active = 1;`;
        return database.query(sql, [couponcode]);
    }

    static postTargetGroupCouponByCode(targetGroupData, database) {
        targetGroupData.sql = targetGroupData.sql.replace(/'/g, "'");
        console.log(`targetGroupData.sql${targetGroupData.sql}`);
        const sql = 'update `target_group` SET `user_exam` = ?, `user_class` = ?, `user_locale` = ?, `sql` = ?, `updated_by`= ? WHERE `id` = ?';
        console.log(sql);
        return database.query(sql, [targetGroupData.user_exam, targetGroupData.user_class, targetGroupData.user_locale, targetGroupData.sql, targetGroupData.updated_by, targetGroupData.id]);
    }

    static TargetGroupByid(id, database) {
        const sql = 'select * from target_group where id = ? ';
        console.log(sql);
        return database.query(sql, [id]);
    }

    static getPckagesByCouponCode(couponcode, database) {
        couponcode = couponcode.toLowerCase();
        const sql = 'select * from coupon_course_mapping where coupon_code = ? and is_active = 1';
        return database.query(sql, [couponcode]);
    }

    static insertPackageMapping(database, packageData) {
        const sql = 'INSERT into coupon_course_mapping (coupon_code, package_id, updated_by) VALUES ?';
        return database.query(sql, [packageData]);
    }

    static getInfoByStudentReferalCoupons(database, coupon_code) {
        const sql = 'SELECT * FROM student_referral_course_coupons where coupon_code = ? and is_active = 1';
        return database.query(sql, [coupon_code]);
    }

    static getInfoByStudentId(database, student_id) {
        const sql = 'SELECT * FROM student_referral_course_coupons where student_id = ? and is_active=1';
        return database.query(sql, [student_id]);
    }

    static setInfoByStudentReferalCoupons(database, obj) {
        const sql = 'INSERT INTO student_referral_course_coupons set ?';
        return database.query(sql, [obj]);
    }

    static getApplicableCoupons(database, version_code, assortment_type, student_id) {
        const sql = `select cn.coupon_code, cn.end_date, cn.value_type, cn.value, cn.max_limit, cn.is_show , cn.type, cn.description from coupon_applicability ca
            left join (select * from coupons_new where created_by <> 'referral') cn on cn.coupon_code = ca.coupon_code where (ca.type = 'generic' or
            (ca.type = 'specific' and ca.value = ?) or (ca.type = 'assortment-type' and ca.value = ?)) and ca.is_active =1 and
            cn.start_date <= CURDATE() and cn.end_date >= CURDATE() and cn.min_version_code <= ? and cn.max_version_code >= ?
            and cn.is_active = 1 order by end_date`;
        return database.query(sql, [student_id, assortment_type, version_code, version_code]);
    }

    static getActiveTgCoupons(database, version_code, locale, sclass) {
        const sql = `select tg.*, cn.coupon_code, cn.end_date, cn.value_type, cn.value, cn.max_limit, cn.is_show, cn.type, cn.description from coupon_applicability ca left join target_group tg on tg.id = ca.value
                     left join (select * from coupons_new where created_by <> 'referral') cn on cn.coupon_code = ca.coupon_code
                     where ca.type = 'target-group' and ca.is_active =1 and cn.start_date <= CURDATE() and cn.end_date >= CURDATE()
                     and cn.min_version_code <= ? and cn.max_version_code >= ? and cn.is_active = 1
                     and (tg.user_locale = ? or tg.user_locale is null or tg.user_locale = '')
                     and (tg.user_class = ? or tg.user_class is null or tg.user_class = '' or tg.user_class = 0)
                     order by cn.value desc`;
        return database.query(sql, [version_code, version_code, locale, sclass]);
    }

    static getStudentDetailsByStudentReferralCoupons(database, coupon_code) {
        const sql = 'SELECT a.*, b.mobile FROM (SELECT * from student_referral_course_coupons where coupon_code = ? and is_active = 1) as a left join students as b on a.student_id=b.student_id where b.student_id is not null';
        return database.query(sql, [coupon_code]);
    }

    static isTimerPromoStudent(database, student_id) {
        const sql = 'select student_id from coupon_timer_temp where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static addReferrerStudentIdForPaytmDisburse(database, data) {
        const sql = 'INSERT into student_referral_paytm_disbursement set ?';
        return database.query(sql, [data]);
    }

    static updateReferrerMobileForPaytmDisburse(database, data) {
        const sql = 'update student_referral_paytm_disbursement set mobile_retry=?, is_paytm_disbursed=? where id=?';
        return database.query(sql, [data.mobile, data.is_paytm_disbursed, data.id]);
    }

    static getCouponCodeByTargetGroupId(database, id) {
        const sql = 'select * from coupon_applicability where type="target-group" and value=?';
        return database.query(sql, [parseInt(id).toString()]); // Id is coming with an extra space
    }

    static insertCouponResellerMapping(database, obj) {
        const sql = 'INSERT into coupon_reseller_mapping set ?';
        return database.query(sql, obj);
    }

    static getResellerCouponHistory(database, reseller_student_id) {
        const sql = 'select crm.coupon_code, crm.variant_id, crm.buyer_mobile, p.name as package_name, crm.package_amount, crm.cash_collected, crm.created_at, crm.is_direct_activation from coupon_reseller_mapping crm join package p on crm.package_id = p.id where crm.reseller_student_id = ? order by crm.id desc';
        return database.query(sql, [reseller_student_id]);
    }

    static async getUserForCEOReferralProgramWithStudentId(database, studentId, tgId = 1710) {
        /**
         * Referral CEO Program TG id is 1710
         */
        const tgSql = 'select tg.sql from target_group tg where tg.id =?';
        const resultTgSql = await database.query(tgSql, [tgId]);
        /**
         * First case assuming there exists a ps table in the tg query on which we check for user -79ms
         * Second case someone changed the query and there no longer exists a ps table in tg query running the scan through whole list for student_id - 1.2s
         */
        let result;
        console.log(resultTgSql);
        try {
            const userSql = `${resultTgSql[0].sql} and ps.student_id = ?`;
            result = await database.query(userSql, [studentId]).then((value) => value);
        } catch (e) {
            const userSql = `SELECT * from (${resultTgSql[0].sql}) as a where a.student_id = ?`;
            result = await database.query(userSql, [studentId]).then((value) => value);
        }
        console.log(result);
        return result;
    }

    static updateCouponDetailsByCode(database, couponCode, obj) {
        const sql = 'update coupons_new set ? where coupon_code = ?';
        return database.query(sql, [obj, couponCode]);
    }

    static getCeoReferralEntryFromCampaign(database, studentId) {
        const sql = 'select * from campaign_sid_mapping where student_id = ? and campaign like "CEO_REFERRAL%;;;%" and is_active = 1 order by id desc limit 1';
        return database.singleQueryTransaction(sql, [studentId]);
    }
};