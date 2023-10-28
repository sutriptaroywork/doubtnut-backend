module.exports = class WebBanner {
    static getWebBanners(db, qid) {
        let sql;
        if (qid) {
            sql = `select ab.image_url, ab.action_activity as action_type, ab.action_data from (select * from questions WHERE question_id = ?) as q
        left join studentid_package_mapping_new spmn on q.student_id = spmn.student_id 
        left join app_banners ab on (spmn.target_group= ab.target_category or ab.target_category is null or ab.target_category = '' or ab.target_category = 'all') and (q.class=ab.class or ab.class is null or ab.class = 'all' or ab.class = '') and (q.locale=ab.locale or ab.locale is null or ab.locale = '' or ab.locale= 'all')
        and start_date< NOW() and end_date> NOW() and ab.is_active and ab.page_type like '%web' order by banner_order`;// 40 ms
            return db.query(sql, [qid]);
        }
        sql = 'select ab.image_url, ab.action_activity as action_type, ab.action_data from  app_banners ab WHERE start_date< NOW() and end_date> NOW() and ab.is_active and ab.page_type like \'%web_default\' order by banner_order'; // 57 ms
        return db.query(sql);
    }
};
