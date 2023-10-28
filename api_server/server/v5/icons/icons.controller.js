const _ = require('lodash');
const axios = require('axios');

let config;
let db;
const iconsMysql = require('../../../modules/mysql/icons');
const RedisUtil = require('../../../modules/redis/utility.redis');
const FlagrUtility = require('../../../modules/Utility.flagr');
const StaticData = require('../../../data/data');

async function geticonsByIconOrderByClass(req, res, next) {
    async function hasUserVisitedAnnouncement(studentId, announcementId, valid_from, valid_till) {
        console.log('studentId', studentId);
        const query = {
            user_id: studentId,
            announcement_id: parseInt(announcementId),
            seen: { $gte: valid_from, $lte: valid_till },
        };
        const result = await db.mongo.read.collection('announcement_activity').find(query).toArray();

        if (result.length) return true;
        return false;
    }

   /* async function checkForNewContentForUser(data, student_id) {
        if (data.playlist_id.length) {
            const announcementInfo = await iconsMysql.getInfoFromAnnouncementByTableNameAndLibraryId(db.mysql.read, 'new_library', data.playlist_id);

            if (announcementInfo.length) {
                if (await hasUserVisitedAnnouncement(student_id, announcementInfo[0].id, announcementInfo[0].valid_from, announcementInfo[0].valid_till)) return true;

                const announcement = {};
                announcement.type = announcementInfo[0].type;
                announcement.state = true;
                data.announcement = announcement;
            }
        }
    }*/

    try {
        db = req.app.get('db');
        config = req.app.get('config');
        let { student_class, locale, student_id } = req.user;
        let { version_code } = req.headers;
        if (!version_code) {
            version_code = 604;
        }
        locale = (locale === 'hi') ? locale : 'en';
        if (req.params.class) {
            student_class = req.params.class;
        }
        if (req.user.isDropper) {
            student_class = 13;
        }

        const livClass = StaticData.livClass;

        console.log(student_class);
        console.log(version_code);
        console.log(locale);
        let data = await iconsMysql.getIconDataByClassUsingVersionCodeByLanguage(db.mysql.read, student_class, version_code, locale);

        const isGupShupUser = !!(await RedisUtil.sismember(db.redis.read, 'gupshup_show', student_id));

        let bounty_flag_index = -1;
        let gupshup_flag = -1;
        let daily_topper_index = -1;

        for (let i = 0; i < data.length; i++) {
            if (data[i].playlist_details.length > 0) {
                const temp = JSON.parse(data[i].playlist_details);
                data[i].playlist_id = temp.playlist_id;
                data[i].playlist_title = temp.name;
                data[i].external_url = temp.external_url;
                data[i].is_last = temp.is_last;
            } else {
                data[i].playlist_id = '';
                data[i].playlist_title = '';
                data[i].external_url = '';
                data[i].is_last = '';
            }
            // await checkForNewContentForUser(data[i], req.user.student_id);
            delete data[i].playlist_details;

            if (data[i].feature_type === 'bounty_feed') {
                bounty_flag_index = i;
            }

            if (data[i].feature_type === 'gupshup' && !isGupShupUser) gupshup_flag = i;

            if (data[i].feature_type === 'daily_topper') daily_topper_index = i;
        }

        if (student_id % config.bounty_mod_factor !== 0 && version_code > 685 && bounty_flag_index > -1) {
            data.splice(bounty_flag_index, 1);
            // IMP if bounty has been removed then gupshup index has changed.
            if (bounty_flag_index < gupshup_flag) gupshup_flag--;
        }
        if (gupshup_flag > -1) {
            data.splice(gupshup_flag, 1);
        }
        // for versions greater >= 745  send all icons, condition here otherwise
        if (req.headers.version_code < 746 && data.length > 8) data = data.slice(0, 8);


        for (let i = 0; i < data.length; i++) data[i].position = i + 1;

        const responseData = {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
            data,
        };
        res.status(responseData.meta.code).json(responseData);
    } catch (e) {
        next(e);
    }
}

module.exports = { geticonsByIconOrderByClass };
