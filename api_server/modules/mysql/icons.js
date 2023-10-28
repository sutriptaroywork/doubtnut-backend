module.exports = class Icons {
    // eslint-disable-next-line no-unused-vars
    static getIconData(database, student_class) {
        const sql = 'SELECT position, 4 as notification_count,feature_type,updated_at as time,is_show FROM icons where is_active=1 order by position ';
        return database.query(sql);
    }


    static getCategoriesByCampaignAndCcmid({ mysql }, versionCode, ccmIds, campaign, studentLocale, packageValue = 'default') {
        const sql = `select * from home_caraousels
        where is_active = 1
            and min_version_code < ?
            and max_version_code >= ?
            and ccm_id in (?)
            and locale = ?
            and package = ?
            and campaign = ?
            and type ='CATEGORY_ICONS' and data_type ='homepage_category_icons' 
        group by type, data_type, title
        order by caraousel_order
        asc`;
        const params = [versionCode, versionCode, ccmIds, studentLocale, packageValue, campaign];
        return mysql.read.query(sql, params);
    }

    static getCategoriesByCampaignIdAndClass({ mysql }, versionCode, studentClass, campaign, studentLocale, packageValue = 'default') {
        const sql = `select * from home_caraousels
        where is_active = 1
            and min_version_code < ?
            and max_version_code >= ?
            and class = ?
            and locale = ?
            and package = ?
            and campaign = ?
            and type ='CATEGORY_ICONS' and data_type ='homepage_category_icons' 
        group by type, data_type, title
        order by caraousel_order
        asc`;
        const params = [versionCode, versionCode, studentClass, studentLocale, packageValue, campaign];
        return mysql.read.query(sql, params);
    }

    static getCategoriesByCcmId({ mysql }, versionCode, ccmIds, studentLocale, packageValue = 'default') {
        const sql = `select * from home_caraousels
        where is_active = 1
            and min_version_code < ?
            and max_version_code >= ?
            and ccm_id in (?)
            and locale = ?
            and package = ?
            and campaign is NULL
            and type ='CATEGORY_ICONS' and data_type ='homepage_category_icons'
        group by type, data_type, title
        order by caraousel_order
        asc`;
        const params = [versionCode, versionCode, ccmIds, studentLocale, packageValue];
        return mysql.read.query(sql, params);
    }

    static getCategoriesByClass({ mysql }, versionCode, studentClass, studentLocale, packageValue = 'default') {
        const sql = `select * from home_caraousels
                where is_active = 1
                    and min_version_code < ?
                    and max_version_code >= ?
                    and class = ?
                    and locale = ?
                    and package = ?
                    and campaign is NULL
                    and type ='CATEGORY_ICONS' and data_type ='homepage_category_icons'
                    order by caraousel_order asc`;
        const params = [versionCode, versionCode, studentClass, studentLocale, packageValue];
        return mysql.read.query(sql, params);
    }

    static getIconDataByClass(database, student_class, app_version) {
        const sql = 'SELECT  position,feature_type,title,updated_at as time,is_show,link FROM icons_latest where is_active=1 and class in (?,\'all\') and app_version=? and version_flag=0 order by position ';
        return database.query(sql, [student_class, app_version]);
    }

    static getIconDataByClassNew(database, student_class, app_version) {
        const sql = 'SELECT  position,feature_type,title,updated_at as time,is_show,link,case when data is null then \'\' else data end as playlist_details FROM icons_latest where is_active=1 and class in (?,\'all\') and app_version=? and version_flag=1 order by position ';
        return database.query(sql, [student_class, app_version]);
    }

    static getInfoFromAnnouncementByTableNameAndLibraryId(database, table, library_id) {
        const sql = `select * from new_content_announcement where from_table = ? and row_id IN (?) and is_active = 1 and valid_till > '${new Date().toISOString().slice(0, 10)}'`;
        return database.query(sql, [table, library_id]);
    }

    static getIconDataByClassv4(database, student_class, app_version) {
        const sql = "SELECT  position,feature_type,title,updated_at as time,is_show,link,case when data is null then '' else data end as playlist_details FROM icons_latest where is_active=1 and class in (?,'all') and version_flag=1 and app_version=? order by position ";
        return database.query(sql, [student_class, app_version]);
    }

    static getIconDataByClassUsingVersionCode(database, student_class, version_code) {
        const sql = "SELECT  position,feature_type,title,updated_at as time,is_show,link,case when data is null then '' else data end as playlist_details FROM icons_latest where is_active=1 and class in (?,'all') and min_version_code<? and max_version_code>=? order by position ";
        return database.query(sql, [student_class, version_code, version_code]);
    }

    static getIconDataByClassUsingVersionCodeByLanguage(database, studentClass, versionCode, locale) {
        const sql = "select a.id,case when b.translation is null then a.title else b.translation end as title, a.position, a.feature_type, a.time , a.is_show,link, a.playlist_details from (SELECT id, position,feature_type,title,updated_at as time,is_show,link,case when data is null then '' else data end as playlist_details FROM icons_latest where is_active=1 and class in (?,'all') and min_version_code<? and max_version_code>=? and flag_variants=1) as a left join (select * from language_translation where table_name='icons_latest' and locale=? and column_name='title' and is_active=1) as b on a.id=b.row_id order by a.position";
        return database.query(sql, [studentClass, versionCode, versionCode, locale]);
    }

    static getTopIconsByLangVersionVariant(database, studentClass, versionCode, locale, variantIds) {
        const sql = "select a.id,case when b.translation is null then a.title else b.translation end as title, a.position, a.feature_type, a.time , a.is_show, link, deeplink, new_link, a.playlist_details from (SELECT id, position,feature_type,title,updated_at as time,is_show,link, deeplink, new_link, case when data is null then '' else data end as playlist_details FROM icons_latest where is_active=1 and screen_type = '' and class in (?,'all') and min_version_code<? and max_version_code>=? and flag_variants in (?)) as a left join (select * from language_translation where table_name='icons_latest' and locale=? and column_name='title' and is_active=1) as b on a.id=b.row_id order by a.position";
        return database.query(sql, [studentClass, versionCode, versionCode, variantIds, locale]);
    }

    static getCategoryIconsForHomepage(database, iconIds, studentClass, versionCode) {
        if (!studentClass) {
            const sql = 'select * from homepage_category_icons where is_active >0 and id in (?) and ?<=max_version_code and ?>=min_version_code';// 10-15 ms
            return database.query(sql, [iconIds, versionCode, versionCode]);
        }
        console.log({ iconIds, studentClass: Number(studentClass) });
        const sql = 'select * from homepage_category_icons where is_active > 0 and id in (?) and (class = ? or class is null) and ?<=max_version_code and ?>=min_version_code'; // 10-15 ms
        return database.query(sql, [iconIds, Number(studentClass), versionCode, versionCode]);
    }

    static getIconsByTitleAndClass(database, iconTitle, studentClass, versionCode) {
        const sql = 'select * from homepage_category_icons where title = ? and class = ? and is_active>0 and ?<=max_version_code and ?>=min_version_code';
        return database.query(sql, [iconTitle, Number(studentClass), versionCode, versionCode]);
    }

    static getCheckForDoubtnutCeo(database, studentId) {
        const sql = 'select ps.student_id from classzoo1.payment_summary as ps LEFT JOIN classzoo1.package as p on p.id = ps.new_package_id LEFT JOIN classzoo1.course_details as cd on p.assortment_id = cd.assortment_id WHERE cd.assortment_type = \'course\' and student_id= ? and amount_paid >=0';
        return database.query(sql, [studentId]);
    }

    static getIcons(database, studentClass, locale, screen, versionCode, flagrVariationIds) {
        const sql = 'SELECT * FROM icons_latest WHERE screen_type = ? AND class IN (?) AND locale = ? AND min_version_code < ? AND max_version_code >= ? AND (flag_variants IN (?) OR flagr_name <> "") AND is_active = 1';
        return database.query(sql, [screen, ['all', studentClass], locale, versionCode, versionCode, flagrVariationIds]);
    }

    static getDnCeoIcon(database, versionCode) {
        const sql = 'Select * from homepage_category_icons where description = \'dn_ceo\' and is_active = 1 and min_version_code <= ? and max_version_code >= ?';
        return database.query(sql, [+versionCode, +versionCode]);
    }
};
