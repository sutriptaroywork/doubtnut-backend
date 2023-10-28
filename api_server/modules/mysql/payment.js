module.exports = class Package {
    static createPayment(database, obj) {
        const sql = 'insert into payment_info SET ?';
        return database.query(sql, [obj]);
    }

    static createExpertLinkMappingEntry(database, obj) {
        const sql = 'insert into tele_sales_expert_link_mapping SET ?';
        return database.query(sql, [obj]);
    }

    static async setPaymentInfoMeta(database, obj) {
        // Check if meta entry exists to ensure only one entry is created for a payment_info_id
        const metaEntry = await this.getPaymentInfoMeta(database, obj);
        if (metaEntry.length) {
            const sql = 'UPDATE payment_info_meta SET ? where payment_info_id = ?';
            return database.query(sql, [obj, obj.payment_info_id]);
        }
        const sql = 'insert into payment_info_meta SET ?';
        return database.query(sql, [obj]);
    }

    static getPaymentInfoMeta(database, obj) {
        const sql = 'select * from payment_info_meta where payment_info_id = ?';
        return database.singleQueryTransaction(sql, [obj.payment_info_id]);
    }

    static updatePaymentByPartnerOrderId(database, obj) {
        const sql = 'update payment_info SET ? where partner_order_id = ?';
        return database.query(sql, [obj, obj.partner_order_id]);
    }

    static updatePaymentByPaymentLinkId(database, obj) {
        const sql = 'update payment_info SET partner_order_id = ? where partner_order_id = ?';
        return database.query(sql, [obj.partner_order_id, obj.payment_link_id]);
    }

    static updatePaymentByOrderId(database, obj) {
        const sql = 'update payment_info SET ? where order_id = ?';
        return database.query(sql, [obj, obj.order_id]);
    }

    static updatePartnerOrderIdByPaymentLinkId(database, partner_order_id, payment_link) {
        const sql = 'update payment_info SET partner_order_id = ? where partner_order_id = ?';
        return database.query(sql, [partner_order_id, payment_link]);
    }

    static setRzpPaymentLink(database, obj) {
        const sql = 'insert into rzp_payment_link SET ?';
        return database.query(sql, [obj]);
    }

    static getActivePaymentLinkIdsByStudentId(database, studentId, status) {
        const sql = 'select link_id from rzp_payment_link where student_id = ? and status = ? order by id desc';
        return database.singleQueryTransaction(sql, [studentId, status]);
    }

    static updateRzpPaymentLinkStatus(database, link_id, status) {
        const sql = 'update rzp_payment_link SET status = ? where link_id = ?';
        return database.query(sql, [status, link_id]);
    }

    static getPaymentInfoByPartnerOrderId(database, partner_order_id) {
        const sql = 'select * from payment_info where partner_order_id = ? order by id desc limit 1';
        return database.singleQueryTransaction(sql, [partner_order_id]);
    }

    static getPaymentInfoByOrderId(database, order_id) {
        const sql = 'select * from payment_info where order_id = ? order by id desc limit 1';
        return database.singleQueryTransaction(sql, [order_id]);
    }

    static getPaymentInfoById(database, id) {
        const sql = 'select * from payment_info where id = ? order by id desc limit 1';
        return database.singleQueryTransaction(sql, [id]);
    }

    static getPaymentInfoByIdAndStudentId(database, id, student_id) {
        const sql = 'select * from payment_info where id = ? and student_id = ?';
        return database.singleQueryTransaction(sql, [id, student_id]);
    }

    static getPaymentInfoSuccessCountByStudentId(database, student_id) {
        const sql = 'select count(*) as count from payment_info where status = "SUCCESS" and student_id = ? order by id desc limit 1';
        return database.singleQueryTransaction(sql, [student_id]);
    }

    static getPaymentInfoOnlinePaymentStudentId(database, obj) {
        const sql = 'select * from payment_info where status = "SUCCESS" and student_id = ? and payment_for <> "wallet" and amount <> 0 and source <> "SHIPROCKET"  order by id desc limit 1';
        return database.singleQueryTransaction(sql, [obj.student_id]);
    }

    static getPaymentInfoByStudentId(database, student_id, limit, offset) {
        const sql = 'select * from (select * from payment_info where student_id = ? order by id desc limit ?, ?) as a left join (select id, name from student_package) as b on a.payment_for_id=b.id';
        return database.singleQueryTransaction(sql, [student_id, offset, limit]);
    }

    static getPaymentInfoByPaymentFor(database, payment_for, limit, offset) {
        const sql = 'select pi.*, s.mobile from payment_info pi left join students s on s.student_id = pi.student_id where pi.payment_for = ? order by pi.id desc limit ?, ?';
        return database.singleQueryTransaction(sql, [payment_for, offset, limit]);
    }

    static getTransactionHistoryByStudentId(database, student_id, limit, offset) {
        const sql = 'select updated_at, order_id, amount_to_disburse as amount,type as payment_for,"CREDIT" as type,status, partner_txn_id  from bounty_disbursement where student_id = ? and is_disbursed = 1 union all select updated_at, order_id, (amount + wallet_amount) as amount, payment_for,"DEBIT" as type, status, partner_txn_id from payment_info where student_id = ? order by updated_at desc limit ?, ?';
        return database.query(sql, [student_id, student_id, offset, limit]);
    }

    static getSuccessfulTransactionHistoryByStudentId(database, student_id, limit, offset, version_code) {
        let sql;
        if (version_code >= 913) {
            sql = 'select id, updated_at, order_id, amount_to_disburse as amount,\'padhao_aur_kamao\' as payment_for,"CREDIT" as type,status, partner_txn_id, 0 as cod_purchase, null as expiry  from bounty_disbursement where student_id = ? and status = \'SUCCESS\' and is_disbursed = 1 union all select id, updated_at, order_id, (amount + wallet_amount) as amount, payment_for,"DEBIT" as type, status, partner_txn_id, 0 as cod_purchase, null as expiry from payment_info where student_id = ? and status = \'SUCCESS\' union all select pi.id, pis.updated_at, pi.order_id, (pi.amount + pi.wallet_amount) as amount, pi.payment_for,"DEBIT" as type, pi.status, pi.partner_txn_id, 1 as cod_purchase, null as expiry from payment_info pi inner join payment_info_shiprocket pis on pis.payment_info_id = pi.id where pi.student_id = ? and pi.status = \'INITIATED\' and pis.is_active = 1 and pis.is_otp_verified = 1 union all select id, updated_at, null as order_id, if(amount is null, cash_amount + reward_amount, amount) as amount, reason as payment_for, type, \'SUCCESS\' as status, null as partner_txn_id, 0 as cod_purchase, expiry as expiry from wallet_transaction where student_id = ? and reason in (\'add_attendance_reward\', \'add_topic_booster_reward\', \'add_referral_payment\', \'khelo_jeeto_reward\', \'daily_goal_reward\',\'reward_expired\',\'dnr_reward\') order by updated_at desc limit ?, ?';
            return database.query(sql, [student_id, student_id, student_id, student_id, offset, limit]);
        }
        sql = 'select updated_at, order_id, amount_to_disburse as amount,\'padhao_aur_kamao\' as payment_for,"CREDIT" as type,status, partner_txn_id, 0 as cod_purchase  from bounty_disbursement where student_id = ? and status = \'SUCCESS\' and is_disbursed = 1 union all select updated_at, order_id, (amount + wallet_amount) as amount, payment_for,"DEBIT" as type, status, partner_txn_id, 0 as cod_purchase from payment_info where student_id = ? and status = \'SUCCESS\' union all select updated_at, null as order_id, if(amount is null, cash_amount + reward_amount, amount) as amount, reason as payment_for, type, \'SUCCESS\' as status, null as partner_txn_id, 0 as cod_purchase from wallet_transaction where student_id = ? and reason in (\'add_attendance_reward\', \'add_topic_booster_reward\', \'add_referral_payment\', \'khelo_jeeto_reward\', \'daily_goal_reward\') order by updated_at desc limit ?, ?';
        return database.query(sql, [student_id, student_id, student_id, offset, limit]);
    }

    static getFailedTransactionHistoryByStudentId(database, student_id, limit, offset) {
        const sql = 'select updated_at, order_id, (amount + wallet_amount) as amount, payment_for,"DEBIT" as type, status, partner_txn_id from payment_info where student_id = ? and (status = \'FAILURE\' or status = \'INTIATED\')  order by updated_at desc limit ?, ?';
        return database.query(sql, [student_id, offset, limit]);
    }

    static getCourseInfoByOrderId(database, orderId) {
        const sql = 'select c.name as package_name, c.assortment_id , d.demo_video_thumbnail as image_url, d.assortment_type as type, e.url as invoice_url, b.id as variant_id from payment_info a left join variants b on b.id = a.variant_id left join package c on c.id = b.package_id left join course_details d on d.assortment_id = c.assortment_id left join payment_invoice e on e.entity_id = a.id where a.order_id = ? limit 1';
        return database.query(sql, [orderId]);
    }

    static getPDFLinkByAssortmentID(database, assortment_id) {
        const sql = 'select cr.resource_reference from course_details as cd inner join course_resource_mapping as crm on crm.assortment_id=cd.assortment_id and crm.resource_type=\'resource\' inner join course_resources as cr on cr.id=crm.course_resource_id where cd.assortment_id= ?';
        return database.query(sql, [assortment_id]);
    }

    static updatePaytmPhoneByStudentId(database, student_id, phone) {
        const sql = 'insert into payment_info_paytm set student_id = ?, phone = ?, is_active = 1 on duplicate key update phone = ?';
        return database.query(sql, [student_id, phone, phone]);
    }

    static getPaytmPhoneByStudentId(database, student_id) {
        const sql = 'select phone from payment_info_paytm where student_id = ? and is_active = 1 order by id desc limit 1';
        return database.query(sql, [student_id]);
    }

    static getStudentPayoutDetails(database, student_id) {
        const sql = 'select * from student_payout_details where student_id = ?';
        return database.query(sql, [student_id]);
    }

    static setStudentPayoutDetails(database, obj) {
        const sql = 'insert ignore into student_payout_details set ?';
        console.log(sql);
        return database.query(sql, [obj]);
    }

    static getorderIDByPartnerID(database, partnerTxnID) {
        const sql = 'select * from payment_info where partner_txn_id=?';
        return database.singleQueryTransaction(sql, [partnerTxnID]);
    }

    static updatePaymentSummary(database, txnID, amount, refundId) {
        const sql = 'update payment_summary set refund_amount=?, refund_id=?, is_refunded=1 where txn_id=?';
        // console.log(sql);
        return database.query(sql, [amount, refundId, txnID]);
    }

    static setRefundDetails(database, obj) {
        const sql = 'INSERT into payment_refund set ?';
        return database.query(sql, [obj]);
    }

    static updatePaymentRefundByPaymentInfoId(database, obj) {
        const sql = 'UPDATE payment_refund set ? where payment_info_id = ?';
        return database.query(sql, [obj, obj.payment_info_id]);
    }

    static getTxnIdByPaymentInfoId(database, txnID, createdAt) {
        const sql = "select a.* from (select * from payment_info where id=? and date(created_at) = ? and partner_txn_id is not null) as a left join (select * from payment_refund where status='SUCCESS') as b on a.id=b.payment_info_id AND b.id is null";
        return database.singleQueryTransaction(sql, [txnID, createdAt]);
    }

    static getPaymentByPaymentInfoIdAndCreatedAt(database, txnID, createdAt) {
        const sql = 'select * from payment_info where id = ? and status = "SUCCESS" and date(created_at) = ?';
        return database.singleQueryTransaction(sql, [txnID, createdAt]);
    }

    static getPaymentRefund(database, insertObj) {
        const sql = 'select * from payment_refund  where payment_info_id=? and partner_txn_id=? limit 1';
        return database.singleQueryTransaction(sql, [insertObj.payment_info_id, insertObj.partner_txn_id]);
    }

    static updatePaymentRefund(database, insertObj) {
        const sql = 'update payment_refund set ? where payment_info_id= ? and partner_txn_id= ?';
        return database.query(sql, [insertObj, insertObj.payment_info_id, insertObj.partner_txn_id]);
    }

    static getPaymentRefundByPaymentId(database, payment_info_id) {
        const sql = 'SELECT * from payment_refund WHERE payment_info_id = ?';
        // console.log(sql);
        return database.singleQueryTransaction(sql, [payment_info_id]);
    }

    static deactivateSubscriptionForRefund(database, txnID) {
        const sql = 'UPDATE student_package_subscription sps left join payment_summary ps on ps.subscription_id=sps.id and ps.txn_id=? set sps.is_active=0 where ps.id is not null';
        // console.log(sql);
        return database.query(sql, [txnID]);
    }

    static deactivateSubscriptionForRefundByPaymentInfoId(database, pId) {
        const sql = 'UPDATE student_package_subscription set is_acive = 0 where payment_info_id = ?';
        return database.query(sql, [pId]);
    }

    static getWalletBalance(database, student_id) {
        const sql = 'select * from wallet_summary where student_id = ?';
        // console.log(sql);
        return database.singleQueryTransaction(sql, [student_id]);
    }

    static getPaymentInfoForPaymentLink(database, obj) {
        const params = [];
        params.push(obj.student_id);
        params.push(obj.amount);
        params.push(obj.payment_for);
        params.push(obj.coupon_code);
        params.push(obj.discount);
        params.push(obj.created_from);
        params.push(obj.status);
        const sql = 'select * from payment_info pi left join payment_link_razorpay plr on plr.payment_info_id = pi.id where pi.student_id = ? and pi.amount = ? and pi.payment_for = ? and pi.coupon_code = ? and pi.discount = ? and pi.created_from = ? and pi.status = ? order by pi.id desc limit 1 ';
        // console.log(sql);
        return database.singleQueryTransaction(sql, params);
    }

    static getActivePaypalSubscriptionByStudentId(database, student_id) {
        const sql = 'select * from payment_info_paypal where student_id = ? and status = "ACTIVE" order by id desc limit 1 ';
        // console.log(sql);
        return database.singleQueryTransaction(sql, [student_id]);
    }

    static createPaypalSubscription(database, obj) {
        const sql = 'insert into payment_info_paypal SET ?';
        return database.query(sql, [obj]);
    }

    static createPaymentQR(database, obj) {
        const sql = 'insert into payment_info_qr SET ?';
        return database.query(sql, [obj]);
    }

    static createPaymentFailure(database, obj) {
        const sql = 'insert into payment_failure SET ?';
        return database.query(sql, [obj]);
    }

    static setInAppBillingInfo(database, obj) {
        const sql = 'insert into payment_inapp_billing SET ?';
        return database.query(sql, [obj]);
    }

    static getInAppBillingInfoByStudentId(database, studentId) {
        const sql = 'select * from payment_inapp_billing where student_id = ? order by id desc limit 1';
        return database.singleQueryTransaction(sql, [studentId]);
    }

    static setBBPSMapping(database, obj) {
        const sql = 'insert into payment_info_bbps SET ?';
        return database.query(sql, [obj]);
    }

    static updateBBPSByStudent(database, obj) {
        const sql = 'update payment_info_bbps SET ? where student_id = ? and status = "ACTIVE"';
        return database.query(sql, [obj, obj.student_id]);
    }

    static setBBPSByStudentAndPaymentInfo(database, obj) {
        const sql = 'update payment_info_bbps SET ? where payment_info_id = ? and student_id= ?';
        return database.query(sql, [obj, obj.payment_info_id, obj.student_id]);
    }

    static getBBPSActivePayment(database, student_id) {
        const sql = 'select pi.* from payment_info_bbps pib join payment_info pi on pi.id= pib.payment_info_id where pib.student_id = ? and pib.status= "ACTIVE" and pi.status <> "SUCCESS" limit 1';
        return database.singleQueryTransaction(sql, [student_id]);
    }

    static getCheckoutAudio(database, obj) {
        const sql = 'select * from audio_repo where entity_type = ? and entity_id = ? and is_active = 1 limit 1';
        return database.query(sql, [obj.entity_type, obj.entity_id]);
    }

    static getUserPaymentSummaryDetailsByNextPsId(db, id, studentId) {
        const sql = 'select * from payment_summary where student_id = ? and next_ps_id = ?';
        return db.query(sql, [studentId, id]);
    }

    static getShiprocketPaymentInfoByOrderId(database, orderId) {
        const sql = 'select pis.id, pis.student_id, pis.order_status, pis.sps_id, pis.etd, pi.amount, pi.order_id, pi.variant_id, s.is_online as version_code, p.assortment_id, s.locale from payment_info_shiprocket as pis join payment_info pi on pi.id = pis.payment_info_id join student_address_mapping sap on sap.id = pis.student_address_mapping_id join students s on s.student_id = pis.student_id join variants v on v.id = pi.variant_id join package p on p.id = v.package_id where pis.is_active = 1 and pi.order_id = ? limit 1';
        return database.singleQueryTransaction(sql, [orderId]);
    }

    static getShiprocketPaymentInfo(database, payment_info_id) {
        const sql = 'select ps.*, pi.amount, pi.order_id, pi.variant_id from payment_info_shiprocket as ps left join payment_info pi on pi.id = ps.payment_info_id where ps.is_active = 1 and pi.id = ? limit 1';
        return database.singleQueryTransaction(sql, [payment_info_id]);
    }

    static getShiprocketPaymentInfoByID(database, id) {
        const sql = 'select student_id, shiprocket_order_id, sps_id, payment_info_id from payment_info_shiprocket where id = ?';
        return database.singleQueryTransaction(sql, [id]);
    }

    static createPaymentInfoShiprocket(database, obj) {
        const sql = 'insert into payment_info_shiprocket SET ?';
        return database.query(sql, [obj]);
    }

    static updatePaymentInfoShiprocket(database, obj, id) {
        const sql = 'update payment_info_shiprocket SET ? where id = ?';
        return database.query(sql, [obj, id]);
    }

    static updatePaymentInfoShiprocketByOrderId(database, obj, orderId) {
        const sql = 'update payment_info_shiprocket SET ? where shiprocket_order_id = (select partner_order_id from payment_info where order_id = ? and source = "SHIPROCKET")';
        return database.query(sql, [obj, orderId]);
    }

    static getActiveStudentPackageSubscriptionByOrderId(database, orderId) {
        const sql = 'select sps.is_active from student_package_subscription sps join payment_info_shiprocket pis on pis.sps_id = sps.id join payment_info pi on pi.partner_order_id = pis.shiprocket_order_id  where pi.order_id = ? and pi.source = "SHIPROCKET" and sps.is_active = 1';
        return database.singleQueryTransaction(sql, [orderId]);
    }

    static updateStudentPackageSubscriptionByOrderId(database, obj, orderId) {
        const sql = 'update student_package_subscription SET ? where id = (select pis.sps_id from payment_info_shiprocket pis inner join payment_info pi on pi.partner_order_id = pis.shiprocket_order_id  where pi.order_id = ? and pi.source = "SHIPROCKET")';
        return database.query(sql, [obj, orderId]);
    }

    static addShipmentTrackingActivity(database, obj) {
        const sql = 'insert into shiprocket_shipment_status SET ?';
        return database.query(sql, [obj]);
    }

    static getShipmentTrackingActivityByOrderId(database, shipment_id) {
        const sql = 'select * from shiprocket_shipment_status where order_id = ? and order_status = "IN TRANSIT" group by 8 order by id desc';
        return database.query(sql, [shipment_id]);
    }

    static checkUniqueCodeValidity(database, unique_code) {
        const sql = 'select * from payment_info_shiprocket where unique_code = ? and is_otp_verified = 1 and is_active = 1 limit 1';
        return database.query(sql, [unique_code]);
    }

    static updatePaymentInfoShiprocketSuccessfulOrder(database, obj) {
        const sql = 'Update payment_info_shiprocket SET ? where unique_code = ?';
        return database.query(sql, [obj, obj.unique_code]);
    }

    static checkActiveCODOrderWithStudentId(database, studentID) {
        const sql = 'select pis.*, pi.variant_id, pi.order_id, pi.amount from payment_info_shiprocket pis join payment_info pi on pi.id = pis.payment_info_id join variants v on v.id = pi.variant_id join package p on p.id = v.package_id where pis.student_id = ? and pis.is_active = 1 and pis.is_otp_verified = 1 limit 1';
        return database.query(sql, [studentID]);
    }

    static getAddressWithStudentId(database, studentID) {
        const sql = 'select * from student_address_mapping where student_id = ? and is_active = 1';
        return database.query(sql, [studentID]);
    }

    static getAddressByIdAndStudentId(database, id, studentID) {
        const sql = 'select * from student_address_mapping where id = ? and student_id = ? and is_active = 1';
        return database.query(sql, [id, studentID]);
    }

    static getAddressWithStudentIdAndAddressId(database, student_id, student_address_mapping_id) {
        const sql = 'select * from student_address_mapping where student_id = ? and id = ?';
        return database.query(sql, [student_id, student_address_mapping_id]);
    }

    static createAddressEntry(database, obj) {
        const sql = 'insert into student_address_mapping SET ?';
        return database.query(sql, [obj]);
    }

    static updateAddressEntry(database, obj) {
        const sql = 'update student_address_mapping SET ? where student_id = ? and id = ?';
        return database.query(sql, [obj, obj.student_id, obj.id]);
    }

    static getActiveVPAByStudentId(database, student_id) {
        const sql = 'select * from payment_info_smart_collect where student_id = ? and is_active = 1 limit 1';
        return database.singleQueryTransaction(sql, [student_id]);
    }

    static getActiveVPAByVirtualAccountId(database, virtual_account_id) {
        const sql = 'select * from payment_info_smart_collect where virtual_account_id = ? limit 1';
        return database.singleQueryTransaction(sql, [virtual_account_id]);
    }

    static setPaymentInfoSmartCollect(database, obj) {
        const sql = 'insert into payment_info_smart_collect set ?';
        return database.query(sql, [obj]);
    }

    static setInActiveVPAByVirtualAccountId(database, id) {
        const sql = 'update payment_info_smart_collect set is_active = 0 where virtual_account_id = ?';
        return database.query(sql, [id]);
    }

    static getTracebackRewardEntryByStudentIdAndAssortmentId(database, studentId, assortmentId) {
        const sql = 'select * from traceback_reward_mapping where student_id = ? and assortment_id =?';
        return database.query(sql, [studentId, assortmentId]);
    }

    static createTracebackRewardEntry(database, obj) {
        const sql = 'insert into traceback_reward_mapping SET ?';
        return database.query(sql, [obj]);
    }

    static updateTracebackRewardEntry(database, studentId, assortmentId) {
        const sql = 'update traceback_reward_mapping set traceback_reward_used = 1 where student_id = ? and assortment_id = ?';
        return database.query(sql, [studentId, assortmentId]);
    }

    static checkActiveCODWithPackageDetailsUsingStudentID(database, studentID) {
        const sql = 'select pis.*, pi.variant_id, pi.order_id,pk.name as course_name, concat(pk.duration_in_days,\' days\') as validity_days,pi.amount,pk.assortment_id from payment_info_shiprocket pis left join payment_info pi on pi.id = pis.payment_info_id left join variants as vr on pi.variant_id=vr.id left join package as pk on vr.package_id=pk.id where pis.student_id = ? and pis.is_active = 1 and pis.is_otp_verified = 1 limit 1';
        return database.singleQueryTransaction(sql, [studentID]);
    }

    static getPaymentModeByStudentId(database, studentID) {
        const sql = 'select pi.mode, pim.method from payment_info as pi left join payment_info_meta as pim on pi.id = pim.payment_info_id where pi.source=\'RAZORPAY\' and pi.student_id = ? and pi.status="SUCCESS" order by pi.id desc limit 2;';
        return database.singleQueryTransaction(sql, [studentID]);
    }

    static getSuccessfulMissingPaymentsEntryByTime(database, from, to) {
        const sql = `SELECT
                        pi.*
                    FROM
                        payment_info AS pi
                        LEFT JOIN payment_summary AS ps ON ps.txn_id = pi.partner_txn_id
                        LEFT JOIN student_package_subscription AS sps ON pi.id = sps.payment_info_id
                    WHERE
                        pi.updated_at > ?
                        AND pi.updated_at < ?
                        AND pi.status = 'SUCCESS'
                        AND sps.id is null
                        AND ps.id is null
                        and pi.payment_for in ("course_package", 'vip_offline', 'wallet')
                    ORDER BY
                        pi.id DESC`;
        return database.singleQueryTransaction(sql, [from, to]);
    }

    static updatePaymentById(database, obj, id) {
        const sql = 'update payment_info SET ? where id = ?';
        return database.query(sql, [obj, id]);
    }

    static updatePaymentInfoSmartCollect(database, obj, virtualAccountId) {
        const sql = 'update payment_info_smart_collect set ? where virtual_account_id = ? limit 1';
        return database.query(sql, [obj, virtualAccountId]);
    }

    static getWalletTransactionByPaymentInfoId(database, payment_info_id) {
        const sql = 'select * from wallet_transaction where payment_info_id = ? order by id desc';
        return database.singleQueryTransaction(sql, [payment_info_id]);
    }

    static getWalletTransactionExpiredByWalletTransactionId(database, id) {
        const sql = 'select wte.status from wallet_transaction_expiry wte join wallet_transaction wt on wt.id = wte.wallet_transaction_id where wt.id = ? order by wte.id desc limit 1';
        return database.singleQueryTransaction(sql, [id]);
    }

    static updatePaymentSalesAttributionData(database, obj) {
        const sql = 'update payment_info_sales_attribution set ? where payment_info_id = ?';
        return database.query(sql, [obj, obj.payment_info_id]);
    }

    static createResellerInfo(database, obj) {
        const sql = 'insert into reseller_info set ?';
        return database.query(sql, [obj]);
    }

    static getResellerInfoByStudentId(database, studentId) {
        const sql = 'select * from reseller_info where student_id = ?';
        return database.query(sql, [studentId]);
    }

    static getResellerInfoByMobile(database, mobile) {
        const sql = 'select * from reseller_info ri join students s on s.student_id = ri.student_id where s.mobile = ?';
        return database.query(sql, [mobile]);
    }

    static getWalletTransactionByReasonRefId(database, reasonRefId) {
        const sql = 'select wt.*, s.mobile from wallet_transaction wt left join students s on s.student_id = wt.student_id where wt.reason_ref_id = ? and wt.reason = "wallet_transfer" order by wt.id desc';
        return database.singleQueryTransaction(sql, [reasonRefId]);
    }

    static createPaymentInfoReconcile(database, obj) {
        const sql = 'insert into payment_info_reconcile set ?';
        return database.query(sql, [obj]);
    }

    static updatePaymentInfoQR(database, obj) {
        const sql = 'update payment_info_qr set ? where payment_info_id = ? limit 1';
        return database.query(sql, [obj, obj.payment_info_id]);
    }

    static getActiveQRByVirtualAccountId(database, virtual_account_id) {
        const sql = 'select * from payment_info_qr where virtual_account_id = ? limit 1';
        return database.singleQueryTransaction(sql, [virtual_account_id]);
    }

    static setInactiveQRByVirtualAccountId(database, id) {
        const sql = 'update payment_info_qr set is_active = 0 where virtual_account_id = ?';
        return database.query(sql, [id]);
    }

    static getActiveQRByPaymentInfoId(database, payment_info_id) {
        const sql = 'select * from payment_info_qr where payment_info_id = ? and is_active = 1 limit 1';
        return database.singleQueryTransaction(sql, [payment_info_id]);
    }

    static getActiveQrByStudentId(database, student_id) {
        const sql = 'select piqr.virtual_account_id from payment_info_qr piqr join payment_info pi on pi.id = piqr.payment_info_id where pi.student_id = ? and is_active = 1 and virtual_account_id is not null order by piqr.id desc';
        return database.singleQueryTransaction(sql, [student_id]);
    }

    static getPaymentInfoReconcileByPaymentInfoId(database, id) {
        const sql = 'select * from payment_info_reconcile where payment_info_id = ?';
        return database.query(sql, [id]);
    }

    static createPaymentReferralEntry(database, obj) {
        const sql = 'insert into payment_referral_entries (payment_info_id, coupon_code) values (?, ?) on duplicate key update coupon_code = VALUES(coupon_code)';
        return database.query(sql, [obj.payment_info_id, obj.coupon_code]);
    }

    static fetchPaymentReferralEntryByPaymentInfoId(database, id) {
        const sql = 'select * from payment_referral_entries where payment_info_id = ?';
        return database.query(sql, [id]);
    }

    static checkNkcOldStudent(database, studentId) {
        const sql = 'SELECT * FROM  nkc_old_students where student_id=?';
        return database.query(sql, [studentId]);
    }
};
