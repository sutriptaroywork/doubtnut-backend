// eslint-disable-next-line no-unused-vars
const _ = require('lodash');
const Utility = require('../utility');

module.exports = class Library {
    static getPlaylistAll(database, student_class, student_id, page, limit) {
        const sql = `select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type='playlist' and is_active=1 and is_delete=0 and student_class in (?,'all') and subject='MATHS' order by playlist_order asc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_class, limit]);
    }

    static getPlaylistAllWithVersionCode(database, student_class, student_id, page, limit, version_code) {
        const sql = `select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type='playlist' and is_active=1 and is_delete=0 and student_class in (?,'all') and subject='MATHS' and  min_version_code < ? and max_version_code >= ? order by playlist_order asc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_class, version_code, version_code, limit]);
    }

    static getPlaylistTab(database, student_class) {
        const sql = 'select * from new_library_tab_config where is_active=1 and class in (?,\'all\') order by tab_order asc ';
        // console.log(sql);
        return database.query(sql, [student_class]);
    }

    // eslint-disable-next-line no-unused-vars
    static getPlaylistAllNew(database, student_class, student_id, page, limit, app_version) {
        const sql = `select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in ('playlist','pdf') and is_delete=0 and student_class in (?,'all') and is_active=1 and subject='MATHS') as a left join (select * from mapped_icon_library where class in (?,'all')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_class, student_class, limit]);
    }

    static getPlaylistAllNewWithVersionCode(database, student_class, student_id, page, limit, version_code) {
        const sql = `select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in ('playlist','pdf') and is_delete=0 and student_class in (?,'all') and is_active=1 and subject='MATHS' and min_version_code < ? and max_version_code >= ?) as a left join (select * from mapped_icon_library where class in (?,'all')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_class, version_code, version_code, student_class, limit]);
    }

    static getPlaylistAllNewWithPCM(database, student_class, student_id, page, limit) {
        const sql = `select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in ('playlist','pdf') and is_delete=0 and student_class in (?,'all') and is_active=1 ) as a left join (select * from mapped_icon_library where class in (?,'all')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;

        return database.query(sql, [student_class, student_class, limit]);
    }

    static getLibraryLandingInfo(database, student_class) {
        const sql = 'select a.id,a.name,a.view_type,a.description,a.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in (\'playlist\',\'pdf\') and is_delete=0 and student_class in (?,\'all\') and is_active=1 ) as a left join (select * from mapped_icon_library where class in (?,\'all\')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC';

        // console.log(sql);
        return database.query(sql, [student_class, student_class]);
    }

    static getLibraryLandingInfoWithVersionCode(database, student_class, version_code) {
        const sql = 'select a.id,a.name,a.view_type,a.description,a.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in (\'playlist\',\'pdf\') and is_delete=0 and student_class in (?,\'all\') and is_active=1 and min_version_code< ? and max_version_code>=? ) as a left join (select * from mapped_icon_library where class in (?,\'all\')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC';
        // console.log(sql);
        return database.query(sql, [student_class, version_code, version_code, student_class]);
    }

    static getLibraryLandingInfoForV9(database, student_class, version_code) {
        // 115ms
        const sql = 'select a.id,a.name,a.name as original_name,a.view_type,a.description,a.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.new_student_course,a.playlist_order,a.new_playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in (\'playlist\',\'pdf\') and is_delete=0 and student_class in (?,\'all\') and is_active=1 and min_version_code< ? and max_version_code>=? and new_playlist_order is not null) as a left join (select * from mapped_icon_library where class in (?,\'all\')) as b on a.id=b.mapped_playlist_id ORDER BY a.new_playlist_order ASC';
        return database.query(sql, [student_class, version_code, version_code, student_class]);
    }

    static getTopNavigation(database, playlist_id) {
        const sql = 'select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where parent=? and is_active=1 and is_delete=0 order by id asc';

        // console.log(sql);
        return database.query(sql, [playlist_id]);
    }

    static getPlaylistWithId(database, playlist_id) {
        const sql = 'select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where id=? and is_active=1 and is_delete=0 order by id asc';

        // console.log(sql);
        return database.query(sql, [playlist_id]);
    }

    static getPlaylistAllWithPCMUpdated(student_class, page, limit, database) {
        const sql = `select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in ('playlist','pdf') and is_delete=0 and student_class in (?,'all') and id != 100779 and is_active=1 ) as a left join (select * from mapped_icon_library where class in (?,'all')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [student_class, student_class, limit]);
    }

    static getPlaylistAllWithPCMUpdatedWithVersionCode(student_class, page, limit, database, version_code) {
        const sql = `select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.resource_path,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in ('playlist','pdf') and is_delete=0 and student_class in (?,'all' ) and min_version_code < ? and max_version_code>=? and id != 100779 and is_active=1 ) as a left join (select * from mapped_icon_library where class in (?,'all')) as b on a.id=b.mapped_playlist_id ORDER BY a.playlist_order ASC LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [student_class, version_code, version_code, student_class, limit]);
    }

    static getPlaylist(database, student_class, student_id, page, limit, playlist_id) {
        const sql = `select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where parent=? and is_active=1 and is_delete=0 and subject='MATHS' order by id asc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        return database.query(sql, [playlist_id, limit]);
    }

    static getPlaylistWithPCM(database, student_class, student_id, page, limit, playlist_id) {
        const sql = `select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where parent=? and is_active=1 and is_delete=0 order by id asc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [playlist_id, limit]);
    }

    static getPlaylistWithView(database, student_class, student_id, page, limit, playlist_id, versionCode, flagData = false) {
        playlist_id = `${playlist_id}`;
        let sql = `select id,name,view_type,main_description as description,image_url,is_first,is_last,empty_text,resource_type, case when resource_type='playlist' then null else resource_path end as resource_path from new_library where parent=? and min_version_code < ? and max_version_code>=? and is_active=1 and is_delete=0 order by playlist_order,id asc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        if (flagData && (playlist_id == 110499 || playlist_id == 110503)) {
            sql = `select id,name,view_type,main_description as description,image_url,is_first,is_last,empty_text,resource_type, case when resource_type='playlist' then null else resource_path end as resource_path from new_library where parent=? and is_active=1 and is_delete=0 order by playlist_order,id asc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
            return database.query(sql, [playlist_id, limit]);
        }
        return database.query(sql, [playlist_id, versionCode, versionCode, limit]);
    }

    static getPlaylistIdWithClassNameSubject(database, bookName, studentClass, subject) {
        // 90 ms
        const sql = 'select * from new_library where is_active =1 and is_delete = 0 and subject = ? and student_class = ? and name = ? and view_type = "BOOK" order by playlist_order asc';
        return database.query(sql, [subject, studentClass, bookName]);
    }

    static getPlaylistHeader(database, playlist_id, version_code) {
        // 36ms
        playlist_id = `${playlist_id}`;
        const sql = 'select id,name,view_type,main_description as description,image_url,is_first,is_last,empty_text,resource_type, case when resource_type=\'playlist\' then null else resource_path end as resource_path from new_library where parent=? and min_version_code < ? and max_version_code>=? and is_active=1 and is_delete=0 and view_type = "HEADER"order by playlist_order,id asc';
        return database.query(sql, [playlist_id, version_code, version_code]);
    }

    static getExamTabData(database, playlist_id, version_code, student_class) {
        // 245ms
        playlist_id = `${playlist_id}`;
        const sql = 'select a.id as header_id, a.name as header_name, b.id as filter_id, b.name as filter_name from (select * from new_library where parent=? and min_version_code < ? and max_version_code>=? and is_active=1 and is_delete=0 and student_class = ? and view_type = "FILTER" order by playlist_order,id asc) a left join (select * from new_library where min_version_code < ? and max_version_code>=? and is_active=1 and is_delete=0 and student_class = ? and name in ("BY YEAR", "BY CHAPTER") order by playlist_order,id asc) b on b.parent = a.id';
        return database.query(sql, [playlist_id, version_code, version_code, student_class, version_code, version_code, student_class]);
    }

    static getPlaylistIdByClassAndNewStudentCourse(database, student_class, student_course) {
        // need to index new_student_course 1.6s
        const sql = 'select * from new_library where student_class = ?  and is_active = 1 and is_delete = 0 and new_student_course = ? order by new_playlist_order asc';
        return database.query(sql, [student_class, student_course]);
    }

    static getPlaylistByNameAndStudentClass(database, playlist_name, student_class) {
        const sql = 'select id,name,view_type,description,image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where name= ? and student_class in ("all",?) and is_active=1 and is_delete=0 and is_admin_created = 1 order by playlist_order,id asc LIMIT 1';
        // console.log(sql);
        return database.query(sql, [playlist_name, student_class]);
    }

    static getPlaylistByViewType(database, playlist_id, view_type) {
        playlist_id = `${playlist_id}`;
        const sql = 'select id,name,view_type,description,image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path from new_library where parent=? and view_type  = ? and is_active=1 and is_delete=0 order by id asc';
        // console.log(sql);
        return database.query(sql, [playlist_id, view_type]);
    }

    static getPlaylistHomepage(playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, database) {
        const sql = `select id,'${type}' as type,subject,image_url,name as title,'' as description,'${page}' as page,'${capsule_bg_color}' as capsule_bg_color, '${capsule_text_color}' as capsule_text_color,'${gradient[0]}' as start_gradient,'${gradient[1]}' as mid_gradient,'${gradient[2]}' as end_gradient,'${duration_text_color}' as duration_text_color,'${duration_bg_color}' as duration_bg_color,is_last,resource_type,playlist_order,master_parent from new_library where parent='${playlist_id}' and is_active=1 and is_delete=0 order by rand() LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getParentPlaylistHomepage(locale, playlist_id, gradient, type, page, capsule_bg_color, capsule_text_color, student_class, limit, duration_text_color, duration_bg_color, database) {
        const sql = `select id,'${type}' as type,subject,image_url,name as title,'' as description,'${page}' as page,'${capsule_bg_color}' as capsule_bg_color, '${capsule_text_color}' as capsule_text_color,'${gradient[0]}' as start_gradient,'${gradient[1]}' as mid_gradient,'${gradient[2]}' as end_gradient,'${duration_text_color}' as duration_text_color,'${duration_bg_color}' as duration_bg_color,is_last,resource_type,playlist_order,master_parent, case when resource_type='web_view' then resource_path else '' end as resource_path from new_library where parent in ('${playlist_id}') and is_active=1 and is_delete=0 order by rand() LIMIT ${limit}`;
        console.log(sql);
        return database.query(sql);
    }

    static getParentData(database, student_class, id) {
        let params = [];
        let sql = '';
        if (id === null) {
            sql = 'select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type=\'playlist\' and is_active=1 and is_delete=0 and student_class in (?,\'all\') and subject=\'MATHS\' order by playlist_order asc ';
            params = [student_class];
        } else {
            sql = 'select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,resource_path,student_class,student_id,is_active,is_delete,playlist_order,master_parent from new_library where parent=? and is_active=1 and is_delete=0 and subject=\'MATHS\' order by playlist_order asc ';
            params = [id];
        }
        // console.log(sql);
        return database.query(sql, params);
    }

    // eslint-disable-next-line no-unused-vars
    static getParentDataNew(database, student_class, id, limit, page) {
        let params = [];
        let sql = '';
        if (id === null) {
            sql = 'select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size,a.subject from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in (\'playlist\',\'pdf\') and is_delete=0 and is_active=1 and student_class in (?,\'all\') and id != 100779 and subject=\'MATHS\') as a left join (select * from mapped_icon_library where class in (?,\'all\') and is_active=1) as b on a.id=b.mapped_playlist_id ORDER by a.playlist_order ';
            params = [student_class, student_class];
        } else {
            sql = 'select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,resource_path,student_class,student_id,is_active,is_delete,playlist_order,master_parent,subject from new_library where parent=? and is_active=1 and is_delete=0 and subject=\'MATHS\' order by playlist_order asc ';
            params = [id];
        }
        console.log(sql);
        return database.query(sql, params);
    }

    // eslint-disable-next-line no-unused-vars
    static getParentDataNewWithPCM(database, student_class, id, limit, page) {
        let params = [];
        let sql = '';
        if (id === null) {
            sql = 'select a.id,a.name,a.description,b.image_url,a.is_first,a.is_last,a.empty_text,a.is_admin_created,a.parent,a.resource_type,a.resource_description,a.student_class,a.student_course,a.playlist_order,a.student_id,a.empty_playlist_id,a.master_parent,a.size,a.subject from (select * from new_library where is_first=1 and parent is null and is_admin_created=1 and resource_type in (\'playlist\',\'pdf\') and is_delete=0 and is_active=1 and student_class in (?,\'all\') and id != 100779 ) as a left join (select * from mapped_icon_library where class in (?,\'all\') and is_active=1) as b on a.id=b.mapped_playlist_id ORDER by a.playlist_order ';
            params = [student_class, student_class];
        } else {
            sql = 'select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,resource_path,student_class,student_id,is_active,is_delete,playlist_order,master_parent,subject from new_library where parent=? and is_active=1 and is_delete=0 order by playlist_order asc ';
            params = [id];
        }
        return database.query(sql, params);
    }

    static getcheckPlaylist(database, student_class, student_id, playlist_id) {
        const sql = 'select * from new_library where id=?';
        return database.query(sql, [playlist_id]);
    }

    static getcheckPlaylistWithActive(database, student_class, student_id, playlist_id) {
        const sql = 'select * from new_library where id= ? and is_delete=0 and is_active=1';
        // console.log(sql);
        return database.query(sql, [playlist_id]);
    }

    // eslint-disable-next-line no-unused-vars
    static getcustomPlaylistHeader(database, student_class, student_id, page, limit, playlist_id) {
        const sql = `select id,name,description,null as image_url,is_first,is_last,empty_text,is_admin_created,parent,resource_path,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent from new_library where parent=0 and is_active=1 and is_delete=0 and student_id=? order by created_at desc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    // eslint-disable-next-line no-unused-vars
    static getcustomPlaylist(database, student_class, student_id, page, limit, playlist_id) {
        const sql = `select id,name,main_description as description,view_type,null as image_url,is_last,empty_text,resource_type,case when resource_type='playlist' then null else resource_path end as resource_path from new_library where parent=0 and is_active=1 and is_delete=0 and student_id=? order by created_at desc LIMIT ? OFFSET ${Utility.getOffset(page, limit)}`;
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getResource(database, student_class, student_id, id) {
        const sql = 'select id,is_last,name, name as original_name,resource_path, view_type,resource_type from new_library where id=? and is_delete=0';
        // console.log(sql);
        return database.query(sql, [id]);
    }

    static getPlaylistId(database, student_class, name) {
        const sql = 'select * from new_library where description like ? and is_active=1 and is_delete=0 and student_class in (\'all\',?)';
        // console.log(sql)
        return database.query(sql, [`%${name}%`, student_class]);
    }

    static getPlaylistIdNew(database, student_class, name) {
        const sql = 'select * from (select * from new_library where description like ? and is_delete=0 and student_class in (\'all\',?)) as a left join (select * from mapped_icon_library where title like ? and is_active=1 and class in (\'all\',?)) as b on a.id=b.b.mapped_playlist_id';
        // console.log(sql)
        return database.query(sql, [`%${name}%`, student_class, `%${name}%`, student_class]);
    }

    static getPDFPlaylistId(database, student_class, name) {
        const sql = 'select * from new_library where description like ? and is_active=1 and is_delete=0 and resource_type=\'pdf\' and student_class=?';
        // console.log(sql)
        return database.query(sql, [`%${name}%`, student_class]);
    }

    static getPDFParentPlaylistId(database, student_class, parent_id, name) {
        const sql = 'select * from new_library where description like ? and is_active=1 and is_delete=0 and parent=? and resource_type=\'pdf\' and student_class=?';
        // console.log(sql)
        return database.query(sql, [`%${name}%`, parent_id, student_class]);
    }

    static getParentPlaylistId(database, student_class, id, name) {
        const sql = 'select * from new_library where name like ? and parent=? and is_active=1 and is_delete=0 and student_class=?';
        // console.log(sql)
        return database.query(sql, [`%${name}%`, id, student_class]);
    }

    static getHistoryPlaylist(database, description) {
        const sql = 'select * from new_library where description=? and is_active=1 and is_delete=0 ';
        // console.log(sql)
        return database.query(sql, [description]);
    }

    static getInfoFromAnnouncementByTableNameAndLibraryId(database, table, library_id) {
        const sql = `select * from new_content_announcement where from_table = ? and row_id IN (?) and is_active = 1 and valid_till > '${new Date().toISOString().slice(0, 10)}' `;
        // console.log(sql);
        return database.query(sql, [table, library_id]);
    }

    static isAnnouncementPresent(database, id) {
        const sql = 'select nca.* from new_content_announcement nca join new_library nl on nl.id = nca.row_id join library_parent_child_mapping lpcm on nca.row_id = lpcm.child_id where lpcm.parent_id = ? and nca.from_table = "new_library" and NOW() < nca.valid_till and NOW() > nca.valid_from and nl.is_active = 1';
        // console.log(sql);
        return database.query(sql, [id]);
    }

    static getAllAnnouncements(database) {
        const sql = 'select nca.* from new_content_announcement nca join new_library nl on nl.id = nca.row_id join library_parent_child_mapping lpcm on nca.row_id = lpcm.child_id where nca.from_table = "new_library" and NOW() < nca.valid_till and NOW() > nca.valid_from and nl.is_active = 1';
        // console.log(sql);
        return database.query(sql);
    }

    static getUserBoughtBooks(database, student_id) {
        const sql = 'select * from new_library where id in (select gri.resource_id from gamification_redeem_inventory gri  join gamification_redeem_transactions grt on gri.id = grt.item_id where grt.user_id = ? and gri.is_active = 1 and grt.is_redeemed = 1) and is_active = 1 and is_delete =0';
        return database.query(sql, [student_id]);
    }

    static getNCERTNextContinuedVideo(database, doubt) {
        const sql = 'select question_id,class,chapter,concat(\'Chapter \',chapter_order,\' | \',substring_index(question_tag,\'Ques\',1)) as playlist_title,ocr_text,question,subject,parent_id,question_tag,thumbnail_img_url ,thumbnail_img_url_hindi,doubt from ncert_video_all where doubt>? limit 1';
        return database.query(sql, [doubt]);
    }

    static getChaperDetails(database, id) {
        const sql = 'select name, student_class from new_library where id = ?';
        return database.query(sql, [id]);
    }

    static getDistinctMcQuestionsByClassAndCourse(chapter_class, chapter, database) {
        const sql = "select b.question_id, b.ocr_text from (select distinct(microconcept) from questions_meta where chapter=? and class=?  and microconcept is not null and microconcept <> '') as a left join (select * from questions where student_id=99) as b on a.microconcept=b.doubt where b.question_id is not null";
        return database.query(sql, [chapter, chapter_class]);
    }

    static getMostViewedMicroconcept(chapter_class, chapter, database) {
        const sql = 'select * from student_chapter_coverage where chapter=? and class = ?';
        return database.query(sql, [chapter, chapter_class]);
    }

    static getPlaylistWithParentId(database, student_class, student_id, parent_id) {
        // console.log('fetching data from the mysql for parentlist for tabs');
        const sql = `select id as tab_playlist_id,name as tabTitle,description, image_url,is_first,is_last,empty_text,is_admin_created,
        parent,student_class,student_id,is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path
        from new_library where parent=?`;
        // console.log(sql);
        return database.query(sql, [parent_id]);
    }

    static getBooklistWithCcmId(database, ccmArray) {
        const ccmList = ccmArray.join(',', ccmArray);
        const sql = 'select * from ccmid_book_mapping where ccmid in (?)';
        return database.query(sql, [ccmList]);
    }

    static getPlaylistWithStudentId(database, student_class, bookArray) {
        const bookList = bookArray.join("','");

        const sql = `select id as book_playlist_id,name as title,description,
            image_url,is_first,is_last,empty_text,is_admin_created,parent,student_class,student_id,
            is_active,is_delete,resource_type,playlist_order,master_parent,subject,resource_path
            from new_library
            where is_last=0 and student_class= ? and description IN (?) and image_url IS NOT NULL`;
        // console.log(sql);
        return database.query(sql, [student_class, bookList]);
    }

    static getActiveSubjectsByClass(database, student_class) {
        const sql = `select *
                      from new_library
                      where is_first = 1
                        and
                          is_admin_created =1
                        and
                          student_class =?
                        and
                          is_active=1
                        and
                          student_course = 'Subjects'
                    `;
        return database.query(sql, [student_class]);
    }

    static getNcertLibraryDataByParentId(database, parent_id) {
        const sql = "select * from new_library where parent = ? and resource_type = 'playlist' and name = 'NCERT Solutions' and is_last =0";
        console.log('dsdsdsd', parent_id);
        return database.query(sql, [parent_id]);
    }

    static getLibraryRowByParentId(database, parent_id) {
        const sql = 'select * from new_library where parent = ?';
        return database.query(sql, [parent_id]);
    }

    static getLibraryNcertDataNewFlow(database, studentClass, locale) {
        const sql = 'SELECT id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',class, \'_\', subject) as package_details_id FROM studentid_package_details WHERE class=? and package_language in (?) and package_type="ncert" and is_active > 0 order by book_order desc';
        return database.query(sql, [studentClass, locale]);
    }

    static getLibraryBooksDataNewFlow(database, studentId, studentClass, locale, subject) {
        const sql = 'SELECT a.id, case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, a.class as student_class, a.subject, "BOOK_INDEX" as view_type, null as empty_text, a.thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', a.student_id,\'_\',a.class, \'_\', a.subject) as package_details_id FROM studentid_package_details as a left join (SELECT course, class from class_course_mapping WHERE id in (SELECT ccm_id from student_course_mapping WHERE student_id=?) and is_active=1) as b on a.target_group=b.course and a.class=b.class WHERE a.package_type="books" and a.class=? and a.package_language in (?) and a.subject=? and a.is_active > 0 and b.course is not null order by a.book_order desc';
        return database.query(sql, [studentId, studentClass, locale, subject]);
    }

    static getLibraryBookDataNewFlowByClass(database, studentClass, locale, subject) {
        const sql = 'SELECT id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',class, \'_\', subject) as package_details_id FROM studentid_package_details WHERE class=? and package_language in (?) and package_type="books" and subject=? and is_active > 0 order by book_order desc';
        return database.query(sql, [studentClass, locale, subject]);
    }

    static getLibraryBookDetailsByQid(database, qid) {
        const sql = 'SELECT * FROM book_questions_details WHERE question_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, [qid]);
    }

    static geLibraryBookFirstVideoDetails(database, bookPlaylistId) {
        const sql = 'SELECT * FROM book_questions_details WHERE book_playlist_id = ? ORDER BY id LIMIT 1';
        return database.query(sql, [bookPlaylistId]);
    }

    static getNewFlowNcertBooks(database, studentClassArr, localeArr) {
        let sql = '';
        if (!localeArr) {
            // 100 ms
            sql = 'SELECT distinct book_name,book_playlist_id as id,book_img_url as image_url,subject FROM `books_details` WHERE student_class IN (?)';
            return database.query(sql, [studentClassArr]);
        }
        // 90 ms
        sql = 'SELECT distinct book_name,book_playlist_id as id,book_img_url as image_url,subject FROM `books_details` WHERE student_class IN (?) AND locale In (?) ORDER BY FIELD (locale,?)';
        return database.query(sql, [studentClassArr, localeArr, localeArr]);
    }

    static getBookDetailsById(database, id) {
        const sql = 'SELECT * FROM book_questions_details WHERE id > ? ORDER BY id LIMIT 1';
        return database.query(sql, [id]);
    }

    static getPlaylistDetailsByids(database, idArr) {
        const sql = 'SELECT id, name FROM new_library WHERE id IN (?)';
        return database.query(sql, [idArr]);
    }

    static getPlaylistTranslationDetailsByids(database, idArr) {
        const sql = 'SELECT row_id AS id, translation AS name FROM language_translation WHERE table_name = "new_library" AND column_name = "name" AND locale = "hi" AND is_active = 1 AND row_id IN (?)';
        return database.query(sql, [idArr]);
    }

    static getChapterList(database, bookPlaylistid) {
        const sql = 'SELECT id, name FROM new_library WHERE parent = ?';
        return database.query(sql, [bookPlaylistid]);
    }

    static getExerciseList(database, chapterPlaylist) {
        const sql = 'SELECT DISTINCT exercise_playlist_id AS exercise_playlist_id FROM book_questions_details WHERE chapter_playlist_id = ?';
        return database.query(sql, [chapterPlaylist]);
    }

    static getQuestionList(database, playlistId, type = 'exercise') {
        let sql = '';
        if (type === 'exercise') {
            sql = 'SELECT e.*, MAX(f.answer_id) AS answer_id FROM (SELECT c.*, d.video_language, d.package_language FROM (SELECT a.id, a.question_id, b.question, b.ocr_text, b.student_id FROM book_questions_details AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.exercise_playlist_id = ? ORDER BY a.id) AS c LEFT JOIN studentid_package_mapping_new AS d ON c.student_id = d.student_id) AS e LEFT JOIN answers AS f ON e.question_id = f.question_id WHERE f.duration <> "" AND f.duration IS NOT NULL GROUP BY f.question_id';
        } else if (type === 'chapter') {
            sql = 'SELECT e.*, MAX(f.answer_id) AS answer_id FROM (SELECT c.*, d.video_language, d.package_language FROM (SELECT a.id, a.question_id, b.question, b.ocr_text, b.student_id FROM book_questions_details AS a LEFT JOIN questions AS b ON a.question_id = b.question_id WHERE a.chapter_playlist_id = ? ORDER BY a.id) AS c LEFT JOIN studentid_package_mapping_new AS d ON c.student_id = d.student_id) AS e LEFT JOIN answers AS f ON e.question_id = f.question_id WHERE f.duration <> "" AND f.duration IS NOT NULL GROUP BY f.question_id';
        }
        return database.query(sql, [playlistId]);
    }

    static getProperBookId(database, bookId, sclass) {
        let sql = `SELECT id, name FROM new_library WHERE parent = ? AND name = 'Class ${sclass}'`;
        if (bookId == 110514 || bookId == 110517) {
            if (sclass == 11) {
                sclass = 1;
            } else {
                sclass = 2;
            }
            sql = `SELECT id, name FROM new_library WHERE parent = ? AND name = 'Volume ${sclass}'`;
        }
        return database.query(sql, [bookId]);
    }

    static getChapterIdByExId(database, exId) {
        const sql = 'SELECT chapter_playlist_id FROM `book_questions_details` WHERE `exercise_playlist_id` = ? LIMIT 1';
        return database.query(sql, [exId]);
    }

    static getPreviousYearBooksByCcmId(database, ccmArray, page, studentClass) {
        const offset = page ? Number(page) * 10 : 0;
        if ((Number(studentClass) >= 6 && Number(studentClass) <= 10) || Number(studentClass) === 14) {
            const sql = 'SELECT spd.id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, spd.class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',spd.class, \'_\', subject) as package_details_id from studentid_package_details spd   where class = ? and book_type = "Reference - Previous Year" and package_type in ("ncert","books", "Coaching") and spd.is_active > 0 and thumbnail_url is not null limit 10 offset ?'; // 30 ms
            return database.query(sql, [studentClass, offset]);
        }

        const sql = 'SELECT spd.id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, spd.class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',spd.class, \'_\', subject) as package_details_id, ccm.id as ccm_id from studentid_package_details spd   left join class_course_mapping ccm on ccm.course = spd.target_group  and  spd.class = ccm.class where book_type = "Reference - Previous Year" and package_type in ("ncert","books", "Coaching") and ccm.id is not null and ccm.id in (?) and spd.is_active > 0 and thumbnail_url is not null limit 10 offset ?';// 70 ms
        return database.query(sql, [ccmArray, offset]);
    }

    static getBooksByCcmId(database, ccmArray, subject, locale, page, studentClass) {
        const packageLanguages = ['en'];
        packageLanguages.push(locale);
        const offset = page ? Number(page) * 10 : 0;
        if (Number(studentClass) === 14) {
            const sql = 'SELECT spd.id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, spd.class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',spd.class, \'_\', subject) as package_details_id from studentid_package_details spd where  class =14 and book_type != "Reference - Previous Year" and package_type in ("ncert","books","Coaching") and package_language in (?) and spd.is_active > 0 and thumbnail_url is not null limit 10 offset ?';// 30 ms
            return database.query(sql, [packageLanguages, offset]);
        }
        if (subject !== 'science') {
            if (ccmArray.length != 0) {
                const sql = 'SELECT spd.id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, spd.class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',spd.class, \'_\', subject) as package_details_id, ccm.id as ccm_id from studentid_package_details spd left join class_course_mapping ccm on ccm.course = spd.target_group  and  spd.class = ccm.class where book_type != "Reference - Previous Year" and package_type in ("ncert","books", "Coaching") and ((ccm.id is not null and ccm.id in (?)) or package_type = "ncert") and package_language in (?) and subject = ? and spd.is_active > 0  and thumbnail_url is not null limit 10 offset ?';// 30 ms
                return database.query(sql, [ccmArray, packageLanguages, subject, offset]);
            }
        }
        const sql = 'SELECT spd.id,case when original_book_name is null then target_group else original_book_name end as name, null as description, 0 as is_last, 0 as is_first, "playlist" as resource_type, spd.class as student_class, subject, "BOOK_INDEX" as view_type, null as empty_text, thumbnail_url as image_url, concat(\'LIBRARY_NEW_BOOK_\', student_id,\'_\',spd.class, \'_\', subject) as package_details_id from studentid_package_details spd where spd.class = ? and book_type != "Reference - Previous Year" and package_type in ("ncert","books", "Coaching") and subject in ("BIOLOGY","CHEMISTRY","PHYSICS") and spd.is_active > 0 and package_language in (?) and thumbnail_url is not null limit 10 offset ?';// 30 ms
        return database.query(sql, [studentClass, packageLanguages, offset]);
    }

    static getPlaylistWithNameAndVersionCode(database, version_code, name) {
        // 65ms
        const sql = 'SELECT * from new_library where is_active = 1 and is_delete = 0 and min_version_code < ? and max_version_code>=? and name = ?';
        return database.query(sql, [version_code, version_code, name]);
    }

    static getPlaylistIdByClassAndLocale(database, studentClass, locale) {
        const sql = 'SELECT class, locale, ccm_id, playlist_id from library_playlists_ccm_mapping where is_active = 1 and class = ? and locale = ? AND flag_id = 1';
        return database.query(sql, [studentClass, locale]);
    }
};
