const RazorpayConsumerHelper = require('./payments_razorpay_consumer_helper');
const SlackUtility = require('../modules/Utility.Slack');
const PaymentConstants = require('../data/data.payment');

let db;
let config;

async function handlePaymentWebhook(req, app) {
    db = app.get('db');
    config = app.get('config');
    const sourceFunctionHandler = {
        RAZORPAY: RazorpayConsumerHelper.webhookHandler,
    };
    try {
        await sourceFunctionHandler[req.source](req.data, db, config);
    } catch (e) {
        console.error('error', e);
        const slackAuth = PaymentConstants.payments_team.slack_details.authKey;
        const slackUsers = PaymentConstants.payments_team.slack_details.slack_ids;
        const slackChannel = PaymentConstants.payments_team.slack_details.main_channel;
        const messageBlock = [{
            type: 'section',
            text: { type: 'mrkdwn', text: `*Payment Webhook Consumer Failure* ${slackUsers.join(' ')}:\n\`\`\`${e.stack}\`\`\`\nPlease check logs on<https://k8s-backend.internal.doubtnut.com/#/deployment/api-server/scripts-payments-webhook-consumer?namespace=api-server|Logs Url>\nand redeploy on job:<https://build.internal.doubtnut.com/job/PROD/job/BACKEND/job/GKE/job/api-server/job/scripts-payments-webhook-consumer/|Deployment Job>` },
        }];
        SlackUtility.sendMessage(slackChannel, messageBlock, slackAuth);
        throw new Error(JSON.stringify(e));
    }
    console.log('done');
}

module.exports = {
    handlePaymentWebhook,
};
