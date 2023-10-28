module.exports = class BountyDisbursement {
    static insertBountyToDisburse(database, obj) {
        const sql = 'INSERT ignore INTO bounty_disbursement SET ?';
        return database.query(sql, [obj]);
    }

    static getPhone(database, student_id) {
        const sql = 'select * from payment_info_paytm where student_id =?';
        return database.query(sql, [student_id]);
    }
};
