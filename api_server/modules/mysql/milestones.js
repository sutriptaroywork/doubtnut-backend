const _ = require('lodash');
const Utility = require('../utility');

module.exports = class Milestones {
    static addMilestone(type, student_id, count, database) {
        const sql = 'INSERT INTO `milestones`(`type`, `student_id`, `count`) VALUES (?,?,?)';
        // console.log(sql);
        return database.query(sql, [type, student_id, count]);
    }

    static getMilestone(limit, page_no, database) {
        const sql = `select 'milestones' as type,a.id as id,a.type as view_type,a.text,a.count,a.created_at, b.student_username,b.student_class,b.img_url as profile_pic from (SELECT * FROM \`milestones\` ORDER BY created_at DESC LIMIT 1 ) as a left join (select * from students where is_new_app=1) as b on a.student_id=b.student_id limit ? OFFSET ${Utility.getOffset(page_no, limit)}`;
        // console.log(sql);
        return database.query(sql, [limit]);
    }
};
