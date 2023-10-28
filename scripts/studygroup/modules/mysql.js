module.exports = class StudyGroupSQL {
    static async getActiveGroupsByMembers(operator, memberCount, database) {
        try {
            const sql = `SELECT DISTINCT a.group_id FROM (SELECT sg.group_id, COUNT(DISTINCT sgm.student_id) AS members FROM study_group sg
                     INNER JOIN study_group_members sgm on sgm.study_group_id = sg.id AND sgm.is_active = 1
                     GROUP BY sg.id) as a WHERE a.members ${operator} ${memberCount}`;
            console.log(sql);
            const result = await database.query(sql);
            return result.map((item) => item.group_id);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async getActiveGroupsByCreatedAt(operator, timestamp, database) {
        try {
            const sql = `SELECT group_id FROM study_group WHERE created_at ${operator} '${timestamp}' AND is_active = 1`;
            console.log(sql);
            const result = await database.query(sql);
            return result.map((item) => item.group_id);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async getAllGroups(database) {
        try {
            const sql = 'SELECT group_id FROM study_group WHERE is_active = 1';
            console.log(sql);
            const result = await database.query(sql);
            return result.map((item) => item.group_id);
        } catch (e) {
            console.error(e);
            return false;
        }
    }

    static async getMemberData(roomIdList, database) {
        // This query is to get details of all the students present in the list of roomIds
        try {
            const sql = `SELECT sg.group_id AS room_id, sg.group_name, sgm.student_id, s.gcm_reg_id FROM study_group sg
                     INNER JOIN study_group_members sgm on sgm.study_group_id = sg.id AND sgm.is_active = 1
                     JOIN students s on s.student_id = sgm.student_id
                     WHERE sg.group_id IN (?)`;
            return await database.query(sql, [roomIdList])
                .then((res) => res[0]);
        } catch (e) {
            console.log(e);
            return false;
        }
    }
};
