const _ = require('lodash');
const Razorpay = require('razorpay');

const PaymentController = require('../server/v1/payment/payment.controller');
const PayMySQL = require('../modules/mysql/payment');

async function webhookHandler(webhookData, db, config) {
    if (webhookData.event == 'payment.captured' && !webhookData.payload.payment.entity.invoice_id) {
        const razorpay_order_id = webhookData.payload.payment.entity.order_id;
        const razorpay_payment_id = webhookData.payload.payment.entity.id;
        const { notes } = webhookData.payload.payment.entity;
        let plink_postfix = webhookData.payload.payment.entity.description;
        // exclusively for payment links
        if (!_.isEmpty(webhookData.payload.payment.entity.description) && webhookData.payload.payment.entity.description.charAt(0) == '#') {
            plink_postfix = plink_postfix.substring(1);
            await PayMySQL.updatePartnerOrderIdByPaymentLinkId(db.mysql.write, razorpay_order_id, `plink_${plink_postfix}`);
        }
        await PaymentController.razorPayPaymentComplete({ razorpay_order_id, razorpay_payment_id }, notes, false, db, config);
    } else if (webhookData.event == 'payment.authorized') {
        const rzp = new Razorpay({
            key_id: config.RAZORPAY_KEY_ID,
            key_secret: config.RAZORPAY_KEY_SECRET,
        });
        rzp.payments.capture(webhookData.payload.payment.entity.id, webhookData.payload.payment.entity.amount, webhookData.payload.payment.entity.currency);
    } else if (webhookData.event == 'payment.failed') {
        const razorpay_payment_id = webhookData.payload.payment.entity.id;
        const razorpay_order_id = webhookData.payload.payment.entity.order_id;
        let plink_postfix = webhookData.payload.payment.entity.description;
        // exclusively for payment links
        if (!_.isEmpty(webhookData.payload.payment.entity.description) && webhookData.payload.payment.entity.description.charAt(0) == '#') {
            plink_postfix = plink_postfix.substring(1);
            await PayMySQL.updatePartnerOrderIdByPaymentLinkId(db.mysql.write, razorpay_order_id, `plink_${plink_postfix}`);
        }
        await PaymentController.razorPayPaymentComplete({ razorpay_order_id, razorpay_payment_id }, '', false, db, config);
    } else if (webhookData.event == 'payment_link.paid') {
        const razorpay_order_id = webhookData.payload.order.entity.id;
        const payment_link_id = webhookData.payload.payment_link.entity.id;
        const razorpay_payment_id = webhookData.payload.payment.entity.id;

        const { notes } = webhookData.payload.order.entity;
        await Promise.all([
            PayMySQL.updatePaymentByPaymentLinkId(db.mysql.write, { partner_order_id: razorpay_order_id, payment_link_id }),
            PayMySQL.updateRzpPaymentLinkStatus(db.mysql.write, payment_link_id, 'PAID'),
        ]);
        await PaymentController.razorPayPaymentComplete({ razorpay_order_id, razorpay_payment_id }, notes, false, db, config);
    }
    // for virtual accounts credited
    if (webhookData.event == 'virtual_account.credited') {
        const { notes } = webhookData.payload.virtual_account.entity;
        await PaymentController.razorPayPaymentCompleteVPA(webhookData, notes, false, db, config);
    }

    // for virtual accounts closed
    if (webhookData.event == 'virtual_account.closed') {
        const virtual_account_id = webhookData.payload.virtual_account.entity.id;
        const [activeVPA, activeQR] = await Promise.all([
            PayMySQL.getActiveVPAByVirtualAccountId(db.mysql.read, virtual_account_id),
            PayMySQL.getActiveQRByVirtualAccountId(db.mysql.read, virtual_account_id),
        ]);
        if (activeVPA.length) {
            PayMySQL.setInActiveVPAByVirtualAccountId(db.mysql.write, virtual_account_id);
        } else if (activeQR.length) {
            PayMySQL.setInactiveQRByVirtualAccountId(db.mysql.write, virtual_account_id);
        }
    }

    if (_.includes(['refund.created', 'refund.processed', 'refund.failed'], webhookData.event)) {
        await PaymentController.handleRazorPayRefund(webhookData, db, config);
    }
}

module.exports = {
    webhookHandler,
};
