const _ = require('lodash');
const moment = require('moment');

const Data = require('../../data/dnShorts.data');

module.exports = class DnShortsVideos {
    static getVideosToQc(database, limit, videosFetched, offset, flag) {
        let sql;
        if (videosFetched.length > 0) {
            if (flag) {
                sql = 'SELECT * FROM dn_shorts_videos WHERE (is_approved = 1 and is_discarded = 0 and class = 0 and created_at < "2022-08-22 12:00:00") and id not in (?) ORDER BY RAND() LIMIT ? OFFSET ?';
                return database.query(sql, [videosFetched.join(','), limit, offset]);
            }
            sql = 'SELECT * FROM dn_shorts_videos WHERE (is_approved = 0 and is_discarded = 0) and id not in (?) ORDER BY RAND() LIMIT ? OFFSET ?';
            return database.query(sql, [videosFetched.join(','), limit, offset]);
        }
        if (flag) {
            sql = 'SELECT * FROM dn_shorts_videos WHERE (is_approved = 1 and is_discarded = 0 and class = 0 and created_at < "2022-08-22 12:00:00") ORDER BY RAND() LIMIT ? OFFSET ?';
        } else {
            sql = 'SELECT * FROM dn_shorts_videos WHERE (is_approved = 0 and is_discarded = 0) ORDER BY RAND() LIMIT ? OFFSET ?';
        }
        return database.query(sql, [limit, offset]);
    }

    static updateVideoReviewStatus(database, video_id, update_obj) {
        const sql = 'UPDATE dn_shorts_videos SET ?  WHERE id = ?';
        return database.query(sql, [update_obj, video_id]);
    }

    static getById(database, id) {
        const sql = 'SELECT * FROM dn_shorts_videos WHERE id = ?';
        return database.query(sql, id);
    }

    static getVideos(database, videosWatched, lastId) {
        const showSchedule = moment().add(5, 'hours').add(30, 'minutes').format('YYYY-MM-DD');
        let sql = `SELECT * FROM dn_shorts_videos WHERE show_schedule='${showSchedule}' AND is_approved = 1 AND question_id is not NULL `;
        if (!_.isEmpty(videosWatched)) {
            sql += ` AND question_id not in (${videosWatched.map((x) => parseInt(x)).join(',')})`;
        }

        if (typeof lastId !== 'undefined') {
            sql += ` AND id > ${lastId}`;
        }

        sql += ` ORDER BY id ASC LIMIT ${Data.feed_videos_limit}`;
        return database.query(sql);
    }

    static getVideosNewUser(database, lastId, flag) {
        let sql;
        if (flag === 0) {
            sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "et_vv"`;
        } else if (flag === 1) {
            sql = `SELECT * FROM dn_shorts_videos where dn_shorts_videos.source = "DN_SHORTS" and is_approved = 1 and updated_at > "2022-07-04 21:57:14"`;
        }

        if (typeof lastId !== 'undefined') {
            if (flag === 0) {
                sql += ` AND dn_shorts_new_user.id > ${lastId}`;
            } else if (flag === 1) {
                sql += ` AND dn_shorts_videos.id > ${lastId}`;
            }
        }
        if (flag === 1) {
            sql += ` ORDER BY views DESC`;
        }
        sql += ` LIMIT 5`;
        return database.query(sql);
    }

    static getVideosEvCombi(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "et_vv"`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_new_user.id > ?`;
        }
        sql += ` LIMIT 3`;
        return database.query(sql, lastId);
    }

    static getVideosDnCombi(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_videos where dn_shorts_videos.source = "DN_SHORTS" and is_approved = 1 and updated_at > "2022-07-04 21:57:14"`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_videos.id > ?`;
        }
        sql += ` ORDER BY views DESC LIMIT 1`;
        return database.query(sql, lastId);
    }

    static getVideosCcmCombi(database, stClass, lastId) {
        let sql = `SELECT * FROM dn_shorts_videos where class = ? and is_approved = 1`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_videos.id > ?`;
        }
        sql += ` LIMIT 1`;
        return database.query(sql, [stClass, lastId]);
    }

    static getVideosPcCombi(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_percent_completion INNER JOIN dn_shorts_videos on dn_shorts_percent_completion.question_id = dn_shorts_videos.question_id`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_percent_completion.id > ?`;
        }
        sql += ` LIMIT 3`;
        return database.query(sql, lastId);
    }

    static getVideosPCWise(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_percent_completion INNER JOIN dn_shorts_videos on dn_shorts_percent_completion.question_id = dn_shorts_videos.question_id`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_percent_completion.id > ${lastId}`;
        }
        sql += ` LIMIT 5`;
        return database.query(sql);
    }

    static getVideosEPMWise(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "et_vv_per_comp"`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_new_user.id > ?`;
        }
        sql += ` LIMIT 5`;
        return database.query(sql, lastId);
    }

    static getVideosMCEEVWise(database, lastId, flag) {
        let sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "category_mix_exp" and dn_shorts_new_user.source = "et_pc_new"`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_new_user.id > ?`;
        }
        if (flag === 1) {
            sql += ` LIMIT 4`;
        } else {
            sql += ` LIMIT 2`;
        }
        return database.query(sql, lastId);
    }

    static getVideosMCEDnWise(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "category_mix_exp" and dn_shorts_new_user.source = "DN_SHORTS"`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_new_user.id > ?`;
        }
        sql += ` LIMIT 1`;
        return database.query(sql, lastId);
    }

    static getVideosMCECCMWise(database, studentClass, lastId) {
        let sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "category_mix_exp" and dn_shorts_new_user.source = "ccm" and dn_shorts_new_user.class = ?`;
        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_new_user.id > ?`;
        }
        sql += ` LIMIT 2`;
        return database.query(sql, [studentClass, lastId]);
    }

    static getVideosCCMwise(database, stClass, lastId) {
        let sql = `SELECT * FROM dn_shorts_videos where class = ? and is_approved = 1`;

        if (typeof lastId !== 'undefined') {
            sql += ` AND dn_shorts_videos.id > ?`;
        }
        sql += ` LIMIT 5`;
        return database.query(sql, [stClass, lastId]);
    }

    static getLastIdNewUserSet(database, flag) {
        let sql;
        if (flag === 0) {
            sql = `select id from dn_shorts_new_user where experiment  = "et_vv" order by id DESC LIMIT 1`;
        } else if (flag === 1) {
            sql = `select id from dn_shorts_videos where source = "DN_SHORTS" and is_approved = 1 order by id DESC LIMIT 1`;
        }        
        return database.query(sql);
    }

    static getLastIdCCMSet(database, stClass) {
        const sql = `select id from dn_shorts_videos where class = ? and is_approved = 1 order by id DESC LIMIT 1`;
        return database.query(sql, stClass);
    }

    static getLastIdPCSet(database) {
        const sql = `select id from dn_shorts_percent_completion order by id DESC LIMIT 1`;
        return database.query(sql);
    }

    static getLastIdEPMSet(database) {
        const sql = `select id from dn_shorts_new_user where experiment = "et_vv_per_comp" order by id DESC LIMIT 1`;
        return database.query(sql);
    }
    
    static getIdsMCEevSet(database) {
        const sql = `select id from dn_shorts_new_user where experiment = "category_mix_exp" and source = "et_pc_new" order by id ASC`;
        return database.query(sql);
    }

    static getIdsMCEDnSet(database) {
        const sql = `select id from dn_shorts_new_user where experiment = "category_mix_exp" and source = "DN_SHORTS" order by id ASC`;
        return database.query(sql);
    }

    static getIdsMCECCMSet(database, studentClass) {
        const sql = `select id from dn_shorts_new_user where experiment = "category_mix_exp" and source = "ccm" and class = ? order by id ASC`;
        return database.query(sql, studentClass);
    }

    static getfirstIdEPMSet(database) {
        const sql = `select id from dn_shorts_new_user where experiment = "et_vv_per_comp" order by id ASC LIMIT 1`;
        return database.query(sql);
    }

    static checkNewUser(database, studentId) {
        const sql = `select * from video_view_stats where student_id = ? and view_from='SHORTS' LIMIT 1`;
        return database.query(sql, studentId);
    }

    static getSavedVideos(database, studentId) {
        const sql = `SELECT * FROM dn_shorts_videos WHERE question_id IN (
            SELECT b.question_id FROM (
                (SELECT * FROM new_library WHERE student_id = ${studentId} AND name = '${Data.custom_playlist_name}')
                    AS a
                        INNER JOIN
                (SELECT * FROM playlist_questions_mapping WHERE is_active = 1)
                    AS b ON a.id = b.playlist_id))`;
        return database.query(sql);
    }

    static getVideoByQuestionId(database, questionId) {
        const sql = 'SELECT * from dn_shorts_videos where question_id = ?';
        return database.query(sql, questionId);
    }

    static getDnShortsCategories(database) {
        const sql = 'SELECT * from dn_shorts_category';
        return database.query(sql);
    }

    static getDnShortsSubCategories(database, categoryId) {
        const sql = 'SELECT * from dn_shorts_subcategory where category_id = ?';
        return database.query(sql, categoryId);
    }

    static getLastIdOldUserSet(database) {
        const sql = `select id from dn_shorts_new_user where experiment = "et_pc_mix_old_user" order by id ASC`;      
        return database.query(sql);
    }

    static getVideosOldUserEPM(database, lastId) {
        let sql = `SELECT * FROM dn_shorts_new_user INNER JOIN dn_shorts_videos on dn_shorts_new_user.question_id = dn_shorts_videos.question_id where experiment = "et_pc_mix_old_user"`;
        if (typeof lastId !== 'undefined') {
                sql += ` AND dn_shorts_new_user.id > ?`;
        }
        sql += ` LIMIT 5`;
        return database.query(sql, lastId);
    }
};
