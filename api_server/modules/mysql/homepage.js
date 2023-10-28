const knex = require('knex')({ client: 'mysql' });
const Utility = require('../utility');
const tables = require('./tables');

module.exports = class Homepage {
    static getCaraousel(database, studentClass, limit, page, versionCode, flagVariants) {
        const sql = knex(tables.homeCarousels)
            .select('id', 'type', 'data_type', 'title', 'scroll_type', 'scroll_size', 'data_limit', 'sharing_message', 'mapped_playlist_id', 'caraousel_order')
            .where({ class: knex.raw(`cast('${studentClass}' as signed)`) })
            .andWhere({ is_active: 1 })
            .andWhere('min_version_code', '<', versionCode)
            .andWhere('max_version_code', '>=', versionCode)
            .whereIn('flagVariant', flagVariants)
            .orderBy('caraousel_order', 'asc')
            .limit(limit)
            .offset(Utility.getOffset(page, limit))
            .toQuery();
        return database.query(sql);
    }

    static getPersonalisedCaraousel(database, studentId, studentClass, studentLocale, cemString, limit, page, versionCode, flagVariants) {
        const sql = `select id,type, data_type, title, scroll_type, scroll_size, data_limit, view_all, is_active,sharing_message,mapped_playlist_id,(select min(caraousel_order)) as caraousel_order from home_caraousels where is_active = 1 and flagVariant in (?) and min_version_code < ${versionCode} and max_version_code >= ${versionCode} and ccm_id in (select ccm_id  from (select * from student_course_mapping where student_id =${studentId}) as a inner join (select * from class_course_mapping where personalisation_active =1 )as b on a.ccm_id = b.id ) group by type, data_type, title, scroll_type, scroll_size, data_limit, view_all,is_active,mapped_playlist_id order by caraousel_order asc limit 8 offset ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [flagVariants]);
    }

    static getAllActiveHomePageWidgets(database, studentClass, versionCode, page, caraouselLimit) {
        const lowerLimit = (page - 1) * caraouselLimit;
        const upperLimit = page * caraouselLimit;
        const sql = knex(tables.homeWidgetsTest)
            .select('id', 'type', 'data_type', 'default_type', 'title', 'locale', { image: 'img_url' }, 'sharing_message', 'mapped_playlist_id', ' scroll_type', 'scroll_size', 'view_all', { submit_url_endpoint: 'sub_url' }, 'data_limit', 'is_active', 'widget_order', { background_color: 'bg_color' }, { is_multi_select: knex.raw('case when multi_select=1 then TRUE else FALSE end') })
            .where({ is_active: 1 })
            .andWhere('active_classes', 'like', `%${studentClass}%`)
            .andWhere('min_version_code', '<', versionCode)
            .andWhere('widget_order', '>=', lowerLimit)
            .andWhere('widget_order', '<', upperLimit)
            .orderBy('priority', 'asc')
            .toQuery();
        return database.query(sql);
    }

    static getEtoosCaraouselClassWiseData(database, studentClass, versionCode) {
        const sql = 'Select * from etoos_course_caraousel where mapped_class=? and min_version_code <= ? and max_version_code >= ? and is_active=1 and show_home=1 order by caraousel_order,ecm_id';
        return database.query(sql, [studentClass, versionCode, versionCode]);
    }

    static getAllHindiTitlesByids(database, carouselIds) {
        const sql = 'SELECT * FROM language_translation WHERE row_id IN (?) AND table_name = \'home_caraousels\' AND locale = \'hi\'';
        return database.query(sql, [carouselIds]);
    }

    static getBannerDetails(database, type, classList, versionCode, flagVariants, todayStartDateTime, campaign) {
        if (campaign) {
            const sql = `SELECT img_url, cta_link, id, locale, ccm_id,user_days,flagr_variant FROM home_banner WHERE start_date <= CURRENT_TIMESTAMP AND end_date >= ?
                     AND is_active = 1 AND type = '${type}' AND student_class IN (?) AND flagr_variant in (?) AND min_version < ?  AND max_version >= ?
                     ORDER BY priority`;
            return database.query(sql, [todayStartDateTime, classList, flagVariants, versionCode, versionCode, campaign]);
        }
        const sql = `SELECT img_url, cta_link, id, locale, ccm_id,user_days,flagr_variant FROM home_banner WHERE start_date <= CURRENT_TIMESTAMP AND end_date >= ?
                     AND is_active = 1 AND type = '${type}' AND student_class IN (?) AND flagr_variant in (?) AND min_version < ?  AND max_version >= ? AND (campaign IS NULL OR campaign = '')
                     ORDER BY priority`;
        return database.query(sql, [todayStartDateTime, classList, flagVariants, versionCode, versionCode]);
    }

    static getHomepageCarousel(database, type, dataType, sclass, locale) {
        const sql = 'SELECT * FROM `home_caraousels` WHERE `type` = ? AND `data_type` = ? AND `class` = ? AND `locale` = ?';
        return database.query(sql, [type, dataType, sclass, locale]);
    }

    static getHomeCarouselBasedOnType(database, type, dataType, sclass, locale, versionCode) {
        const sql = 'SELECT * FROM home_caraousels WHERE type = ? AND data_type = ? AND class = ? AND locale = ? AND is_active=1 AND min_version_code < ? AND max_version_code >= ? AND campaign IS NULL';
        return database.query(sql, [type, dataType, sclass, locale, versionCode, versionCode]);
    }

    static getAdvBannerData(db, ccmArray) {
        let sql = 'SELECT * FROM dn_adv_vendor_banner_data WHERE feature_id = 1 AND is_active = 1 and ccm_id = 0 and  start_date <= CURRENT_TIMESTAMP and end_date >= CURRENT_TIMESTAMP  order by ccm_id desc';
        if (ccmArray.length) {
            sql = 'SELECT * FROM dn_adv_vendor_banner_data WHERE feature_id = 1 AND is_active = 1 and ccm_id in (?, 0) and start_date <= CURRENT_TIMESTAMP and end_date >= CURRENT_TIMESTAMP  order by ccm_id desc';
            return db.query(sql, [ccmArray]);
        }
        return db.query(sql, []);
    }
};
