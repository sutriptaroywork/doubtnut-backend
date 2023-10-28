module.exports = class BountyBookMarkingDetail {
    static getMyBookMarkingDetail(database, student_id, limit, order, filters) {
        const sql = `select a.*, now() as curr_time, bpd.*, count(bad.answer_id) as answer_counts, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username, c.img_url, 'all' as type, 'Favourites' as tag from bounty_book_marking a left join bounty_post_detail bpd on a.bounty_id = bpd.bounty_id join students c on c.student_id = bpd.student_id left join bounty_answer_detail bad on a.bounty_id = bad.bounty_id  where a.student_id = ? and a.is_bookmark = 1 ${filters} group by a.bounty_id order by ${order} limit ?`;
        // console.log(sql);
        return database.query(sql, [student_id, limit]);
    }

    static getMyBookMarkingDetailNext(database, student_id, limit, last_id, order, filters) {
        // const sql = `select * from bounty_book_marking a left join bounty_post_detail b on a.bounty_id = b.bounty_id where a.student_id = ? and a.isBookMark = 1 and a.bookmark_id > ? order by ? limit ?`;
        const sql = `select a.*, now() as curr_time, bpd.*, count(bad.answer_id) as answer_counts, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'all' as type, 'Favourites' as tag from bounty_book_marking a left join bounty_post_detail bpd on a.bounty_id = bpd.bounty_id join students c on c.student_id = bpd.student_id left join bounty_answer_detail bad on a.bounty_id = bad.bounty_id  where a.student_id = ? and a.is_bookmark = 1 and a.bookmark_id < ? ${filters} group by a.bounty_id order by ${order} limit ?`;
        // console.log('Ssssssssss', sql);
        return database.query(sql, [student_id, last_id, limit]);
    }

    static getMyBookMarkingDetailForSolvedNext(database, student_id, limit, last_id, order, filters) {
        const sql = `select a.*, now() as curr_time, bpd.*, count(bad.answer_id) as answer_counts, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'all' as type, 'Favourites' as tag from bounty_book_marking a left join bounty_post_detail bpd on a.bounty_id = bpd.bounty_id join students c on c.student_id = bpd.student_id join bounty_answer_detail bad on a.bounty_id = bad.bounty_id  where a.student_id = ? and a.is_bookmark = 1 and bpd.is_answered = 1 and a.bookmark_id < ? ${filters} group by a.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, last_id, limit]);
    }

    static getMyBookMarkingDetailForSolved(database, student_id, limit, order, filters) {
        const sql = `select a.*, now() as curr_time, bpd.*, count(bad.answer_id) as answer_counts, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'all' as type, 'Favourites' as tag from bounty_book_marking a left join bounty_post_detail bpd on a.bounty_id = bpd.bounty_id join students c on c.student_id = bpd.student_id join bounty_answer_detail bad on a.bounty_id = bad.bounty_id  where a.student_id = ?   ${filters} and bpd.is_answered = 1 and a.is_bookmark = 1 group by a.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static getMyBookMarkingDetailForNoSolutionNext(database, student_id, limit, last_id, order, filters) {
        const sql = `select a.*, now() as curr_time, bpd.*, 0 as answer_count, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'all' as type, 'Favourites' as tag from bounty_book_marking a left join bounty_post_detail bpd on a.bounty_id = bpd.bounty_id join students c on c.student_id = bpd.student_id where a.student_id = ? and a.is_bookmark = 1 and bpd.is_answered = 0 and a.bookmark_id < ? ${filters} group by a.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, last_id, limit]);
    }

    static getMyBookMarkingDetailForNoSolution(database, student_id, limit, order, filters) {
        const sql = `select a.*, now() as curr_time, bpd.*, 0 as answer_count, concat(c.student_fname, ' ', c.student_lname) as student_name, c.student_username , c.img_url, 'all' as type, 'Favourites' as tag from bounty_book_marking a left join bounty_post_detail bpd on a.bounty_id = bpd.bounty_id join students c on c.student_id = bpd.student_id where a.student_id = ? and bpd.is_answered = 0 and a.is_bookmark = 1 ${filters} group by a.bounty_id order by ${order} limit ?`;
        return database.query(sql, [student_id, limit]);
    }

    static upsertBookMark(database, obj) {
        const sql = 'INSERT INTO bounty_book_marking ( bounty_id, student_id, bounty_amount, is_bookmark ) VALUES ( ?, ?, ?, ?) on duplicate KEY UPDATE is_bookmark = ?';
        console.log('sqllllllllll', sql);
        return database.query(sql, [obj.bounty_id, obj.student_id, obj.bounty_amount, obj.isBookMark, obj.isBookMark]);
    }

    static checkForBookMark(database, student_id, bounty_ids) {
        const sql = 'select bounty_id, is_bookmark from bounty_book_marking where student_id = ? and bounty_id in (?)';
        return database.query(sql, [student_id, bounty_ids]);
    }
};
