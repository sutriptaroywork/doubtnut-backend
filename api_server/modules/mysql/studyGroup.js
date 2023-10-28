// eslint-disable-next-line no-unused-vars
const _ = require('lodash');

module.exports = class DoubtPeCharchaMysql {
    static getTotalGroupsAsAdmin(studentId, database) {
        const sql = 'SELECT count(1) as total FROM study_group_members WHERE student_id= ? and is_active=1 and is_admin=1;';
        return database.query(sql, [studentId]);
    }

    static addMember(studentId, studyGroupId, isAdmin, database) {
        const sql = 'INSERT INTO study_group_members (student_id, study_group_id, is_admin) VALUES (?, ?, ?)';
        return database.query(sql, [studentId, studyGroupId, isAdmin]);
    }

    static getActiveGroups(studentId, database) {
        const sql = `SELECT a.*, COUNT(DISTINCT b.student_id) AS subtitle FROM (SELECT s.id as pk , s.group_id, s.group_name, s.group_image,
                    s.image_updated_by, s.image_updated_at, s.created_at as group_created_at, sgm.is_admin,
                    sgm.is_left, sgm.left_at, sgm.is_blocked, sgm.blocked_by, sgm.blocked_at, sgm.is_active, sgm.muted_till FROM study_group s
                    JOIN study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id = ?) AS a INNER JOIN study_group_members b ON a.pk = b.study_group_id AND b.is_active = 1 GROUP BY a.pk`;
        return database.query(sql, [studentId]);
    }

    static getSpecificUserGroupData(studentId, groupId, database) {
        const sql = `SELECT s.id, s.group_id, s.group_name, s.group_image, s.image_updated_by, s.image_updated_at,
        s.created_at as group_created_at,sgm.is_admin, sgm.is_blocked, sgm.is_left FROM study_group s join
        study_group_members sgm ON s.id = sgm.study_group_id WHERE sgm.student_id=? AND sgm.is_active=1 AND s.is_active=1 AND s.group_id=?`;
        return database.query(sql, [studentId, groupId]);
    }

    static getGroupMembers(groupId, database) {
        const sql = 'SELECT * FROM study_group_members WHERE is_active=1 and study_group_id=?';
        return database.query(sql, [groupId]);
    }

    static deactivateGroup(studyGroupId, database) {
        const sql = 'UPDATE study_group s join study_group_members sgm ON s.id = sgm.study_group_id SET s.is_active=0, sgm.is_active=0, sgm.left_at=NOW(), s.deactivated_at =NOW(), sgm.is_left=1 WHERE s.id=?';
        return database.query(sql, [studyGroupId]);
    }

    static leaveAdmin(studyGroupId, studentId, database) {
        const sql = 'UPDATE study_group_members set is_admin=0, is_left=1, is_active=0, left_at=NOW() WHERE study_group_id=? AND student_id=? AND is_admin=1 AND is_active=1';
        return database.query(sql, [studyGroupId, studentId]);
    }

    static assignNewAdmin(studyGroupId, studentId, database) {
        const sql = 'UPDATE study_group_members set is_admin=1 WHERE study_group_id=? AND student_id=? AND is_admin=0 AND is_active=1';
        return database.query(sql, [studyGroupId, studentId]);
    }

    static leaveMember(studyGroupId, studentId, database) {
        const sql = 'UPDATE study_group_members set is_active=0, is_left=1, left_at=NOW() WHERE study_group_id=? AND student_id=? AND is_admin=0 AND is_active=1';
        return database.query(sql, [studyGroupId, studentId]);
    }

    static blockMember(blockedBy, studyGroupId, studentId, database) {
        const sql = 'UPDATE study_group_members set is_active=0, is_blocked=1, blocked_at=NOW(), blocked_by=? WHERE study_group_id=? AND student_id=? AND is_admin=0 AND is_active=1';
        return database.query(sql, [blockedBy, studyGroupId, studentId]);
    }

    static updateGroupName(groupName, studentId, studyGroupId, database) {
        const sql = 'UPDATE study_group SET group_name = ?, name_updated_by = ?, name_updated_at = NOW() WHERE id=? AND is_active=1';
        return database.query(sql, [groupName, studentId, studyGroupId]);
    }

    static updateGroupImage(groupImage, studentId, studyGroupId, database) {
        const sql = 'UPDATE study_group SET group_image = ?, image_updated_by = ?, image_updated_at = NOW() WHERE id=? AND is_active=1;';
        return database.query(sql, [groupImage, studentId, studyGroupId]);
    }

    static getGroupInfo(groupId, database) {
        const sql = `SELECT s.group_id,s.group_name,s.group_image, s.created_at AS group_created_at, st.student_id,sgm.is_blocked,
       sgm.is_admin,sgm.is_active,IFNULL(CONCAT(st.student_fname, ' ', st.student_lname), 'Doubtnut User') AS name,
       IFNULL(st.img_url,'https://d10lpgp6xz60nq.cloudfront.net/engagement_framework/9DACD18E-F46E-ED58-4B28-29B868531C28.webp') as image
        FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id JOIN students st on st.student_id = sgm.student_id
        WHERE s.is_active = 1 AND s.group_id = ?`;
        return database.query(sql, [groupId]);
    }

    static async isInvited(inviter, invitee, groupId, database) {
        const sql = 'SELECT EXISTS(SELECT * FROM study_group_invites WHERE inviter = ? AND invitee = ? AND group_id = ?) AS EXIST';
        const result = await database.query(sql, [inviter, invitee, groupId]);
        return result;
    }

    static inviteMember(inviter, invitee, groupId, isAdmin, database) {
        const sql = 'INSERT INTO study_group_invites (inviter, invitee, group_id, is_invited_by_admin) VALUES (?,?,?,?)';
        return database.query(sql, [inviter, invitee, groupId, isAdmin]);
    }

    static markInviteAccept(inviter, invitee, groupId, isAdmin, database) {
        const sql = 'UPDATE study_group_invites SET is_accepted = 1 AND accepted_at = NOW() WHERE group_id = ? AND inviter = ? AND invitee = ? AND is_accepted = 0;';
        return database.query(sql, [inviter, invitee, groupId, isAdmin]);
    }

    static getTotalGroupMembers(groupId, database) {
        const sql = 'SELECT count(1) as TOTAL FROM study_group_members WHERE is_active=1 and study_group_id=?';
        return database.query(sql, [groupId]);
    }

    static getGroupId(groupId, database) {
        const sql = 'SELECT id, group_name,group_id FROM study_group WHERE group_id=? AND is_active=1';
        return database.query(sql, [groupId]);
    }

    static isActiveOnStudyGroup(studentId, database) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM study_group_members WHERE is_active=1 AND student_id= ?) AS ACTIVE';
        return database.query(sql, [studentId]);
    }

    static isPreviouslyLeftThisStudyGroup(studentId, groupId, database) {
        const sql = 'SELECT EXISTS(SELECT * FROM study_group_members WHERE student_id=? AND study_group_id=? AND is_left=1) AS EXIST';
        return database.query(sql, [studentId, groupId]);
    }

    static reJoinMember(groupId, studentId, database) {
        const sql = 'UPDATE study_group_members set is_left=0, is_active=1, left_at=NULL WHERE study_group_id=? AND student_id=? AND is_left=1';
        return database.query(sql, [groupId, studentId]);
    }

    static getPublicGroupIdFromPk(id, database) {
        const sql = 'SELECT group_id FROM study_group WHERE id=? AND is_active=1';
        return database.query(sql, [id]);
    }

    static getStudentDetailsById(database, studentId) {
        const sql = 'SELECT gcm_reg_id, locale FROM students WHERE student_id=?';
        return database.query(sql, [studentId]);
    }

    static async isMember(groupId, studentId, database) {
        const sql = 'SELECT EXISTS(SELECT 1 FROM study_group_members WHERE study_group_id = ? AND student_id = ? AND is_active = 1) AS EXIST';
        const result = await database.query(sql, [groupId, studentId]);
        return result;
    }

    static getActiveGroupsWithMembersCount(studentId, database) {
        const sql = `SELECT a.*, COUNT(DISTINCT b.student_id) AS total_members FROM (SELECT s.id, s.group_id, s.group_name, s.group_image,
                     sgm.is_admin FROM study_group s JOIN study_group_members sgm ON s.id = sgm.study_group_id
                     WHERE sgm.student_id = ? AND sgm.is_active = 1 AND sgm.is_left=0 AND sgm.is_blocked=0) AS a
                     INNER JOIN study_group_members b ON a.id = b.study_group_id AND b.is_active = 1 GROUP BY a.id`;
        return database.query(sql, [studentId]);
    }

    static getStudentName(studentId, database) {
        const sql = 'SELECT IFNULL(CONCAT(student_fname, \' \', student_lname), \'Doubtnut User\') AS name FROM students WHERE student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getStudyGroupMembersForNotifications(groupId, activeStudents, database) {
        const sql = `SELECT s.student_id, s.student_fname, s.gcm_reg_id, sg.group_name, study_group_members.muted_till
                    FROM study_group_members
                             JOIN study_group sg ON study_group_members.study_group_id = sg.id
                             JOIN students s ON s.student_id = study_group_members.student_id
                    WHERE sg.group_id = ?
                      AND study_group_members.is_active = 1
                      AND study_group_members.student_id NOT IN (?)`;
        return database.query(sql, [groupId, activeStudents]);
    }

    static async isBlocked(studentId, groupId, database) {
        const sql = 'SELECT EXISTS(SELECT * FROM study_group_members WHERE is_blocked=1 AND student_id=? AND study_group_id=?) AS EXIST';
        const result = await database.query(sql, [studentId, groupId]);
        return result;
    }

    static async getGroupIdBySId(studentId, requiredMembers, database) {
        const sql = `SELECT b.room_id FROM (SELECT a.room_id, COUNT(m.student_id) AS members FROM
                     (SELECT s.group_id as room_id, s.id FROM study_group_members sgm JOIN study_group s ON s.id = sgm.study_group_id
                     WHERE sgm.student_id = ? AND sgm.is_active = 1) AS a INNER JOIN study_group_members m On
                     m.study_group_id = a.id AND m.is_active = 1 GROUP BY a.room_id) AS b WHERE b.members >= ? AND room_id like 'sg-%'`;
        const result = await database.query(sql, [studentId, requiredMembers]);
        const roomIds = [];
        for (const room of result) {
            roomIds.push(room.room_id);
        }
        return roomIds;
    }

    static getStudentGcmId(studentIdList, database) {
        const sql = 'SELECT student_id, gcm_reg_id FROM students WHERE student_id IN (?)';
        return database.query(sql, [studentIdList]);
    }

    static muteGroup(groupId, studentId, muteTill, database) {
        const sql = `UPDATE study_group s join study_group_members sgm ON s.id = sgm.study_group_id SET sgm.muted_till = ?
                    WHERE sgm.student_id = ? AND sgm.is_active = 1 AND s.group_id = ?`;
        return database.query(sql, [muteTill, studentId, groupId]);
    }

    static getMuteTime(groupId, studentId, database) {
        const sql = `SELECT sgm.muted_till FROM study_group s join study_group_members sgm ON s.id = sgm.study_group_id
                     WHERE sgm.student_id = ? AND sgm.is_active = 1 AND s.group_id = ?`;
        return database.query(sql, [studentId, groupId]);
    }

    static isMuteFeatureExist(studentId, database) {
        const sql = 'SELECT EXISTS (SELECT 1 FROM study_group_notification WHERE student_id = ?) AS EXIST';
        return database.query(sql, [studentId]);
    }

    static updateFeatureMute(isMute, studentId, database) {
        const sql = 'UPDATE study_group_notification set is_mute = ? WHERE student_id = ?';
        return database.query(sql, [isMute, studentId]);
    }

    static insertFeatureMute(isMute, studentId, database) {
        const sql = 'INSERT INTO study_group_notification (student_id, is_mute) VALUES (?, ?)';
        return database.query(sql, [studentId, isMute]);
    }

    static isFeatureMute(studentId, database) {
        const sql = 'SELECT is_mute FROM study_group_notification WHERE student_id = ?';
        return database.query(sql, [studentId]);
    }

    static isFeatureMuteNotification(studentIds, database) {
        const sql = 'SELECT student_id FROM study_group_notification WHERE student_id IN (?) AND is_mute = 1';
        return database.query(sql, [studentIds]);
    }

    static getLiveClassStudyGroupIds(database, courseResourcesId) {
        const sql = "select * from study_group where group_id like 'pgtf-%' and is_active=1 and created_by in (select s.student_id from course_resources cr join dashboard_users du on cr.faculty_id = du.id join students s on s.student_id=du.student_id where cr.id=?)";
        return database.query(sql, [courseResourcesId]);
    }
};
