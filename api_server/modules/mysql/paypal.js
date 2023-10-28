module.exports = class PaypalSubscription {
    static getByVariantIdAndTrial(database, variant_id, has_trial) {
        const sql = 'select * from paypal_subscription_repo where has_trial = ? and ( trial_variant_id = ? or subscription_variant_id = ?) limit 1 ';
        // console.log(sql);
        return database.query(sql, [has_trial, variant_id, variant_id]);
    }

    static getActiveSubscriptionByStudentId(database, student_id) {
        const sql = 'select * from payment_info_paypal where student_id = ? and status = "ACTIVE" ';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static getAllSubscriptionByStudentId(database, student_id) {
        const sql = 'select * from payment_info_paypal where student_id = ? order by id desc';
        // console.log(sql);
        return database.query(sql, [student_id]);
    }

    static cancelSubscriptionByStudentAndSubscriptionId(database, student_id, subscription_id) {
        const sql = 'update payment_info_paypal set status = "CANCELLED" where student_id = ? and subscription_id = ? and status = "ACTIVE" ';
        console.log(sql);
        return database.query(sql, [student_id, subscription_id]);
    }
};
