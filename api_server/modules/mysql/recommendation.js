module.exports = class Recommendation {
    static getMessage(database, messageOrderGroup, locale, isBack, page, versionCode) {
        let sql = 'select * from recommendation_messages where message_order_group= ? and locale = ? and page = ? and is_active = 1 and min_version_code <= ? and max_version_code >= ? order by message_order asc';
        if (isBack) {
            sql = 'select *, backpress_message as message from recommendation_messages where message_order_group= ? and locale = ? and page = ? and is_active = 1 and min_version_code <= ? and max_version_code >= ? order by message_order asc';
        }
        return database.query(sql, [messageOrderGroup, locale, page, versionCode, versionCode]);
    }

    static getByMessageId(database, messageId) {
        const sql = 'select * from recommendation_messages where id = ?';
        return database.query(sql, [messageId]);
    }

    static addSubmitLog(database, data) {
        const sql = 'insert ignore into recommendation_message_submit_logs SET ?';
        return database.query(sql, [data]);
    }

    static getRecommendedCourse(database, packageClass, categoryType, year, medium, category) {
        const sql = 'select * from course_details where class = ? and category_type = ? and year = ? and meta_info = ? and category = ? and is_active=1 and is_free <> 1 group by assortment_id';
        return database.query(sql, [packageClass, categoryType, year, medium, category]);
    }

    static getRecommendedCourseByCCM(database, packageClass, categoryType, year, medium, category) {
        const sql = 'select ccm.course,ccm.class,cd.*, ccm.id as ccm_id2 from class_course_mapping ccm inner join course_details cd on ccm.class=cd.class and ccm.course=cd.category where cd.is_active=1 and lower(cd.assortment_type) like \'%course%\' and cd.is_free=0 order by 1,2,3';
        return database.query(sql, [packageClass, categoryType, year, medium, category]);
    }

    static getRecommendedCourseByCCMValues(database, ccmArray, studentClass) {
        console.log(ccmArray);
        const sql = 'select ccm.course,ccm.class,cd.*, ccm.id as ccm_id2 from class_course_mapping ccm inner join course_details cd on ccm.class=cd.class and ccm.course=cd.category where cd.is_active=1 and lower(cd.assortment_type) like \'%course%\' and cd.is_free=0 and cd.category in (?) and cd.class = ? order by created_at desc';
        return database.query(sql, [ccmArray, studentClass]);
    }
};
