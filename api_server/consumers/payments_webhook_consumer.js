/* eslint-disable global-require */
require('../config/local-secret-manager');
const { Kafka } = require('kafkajs');
const { populateSecrets } = require('../config/secret-manager');

populateSecrets().then(() => {
    const config = require('../config/config');
    const app = require('../config/express');
    const { handlePaymentWebhook } = require('./payments_webhook');

    const clientId = 'dn-payment-webbhook-consumer';
    const brokers = config.kafka.hosts;
    const topic = 'api-server.payment.webhook';

    const kafka = new Kafka({ clientId, brokers });
    const consumer = kafka.consumer({ groupId: clientId, sessionTimeout: 1000 * 60 * 2 });
    const dlqProducer = kafka.producer();

    const run = async () => {
        await consumer.connect();
        await consumer.subscribe({ topic });
        await dlqProducer.connect();
        await consumer.run({
            partitionsConsumedConcurrently: 3,
            eachMessage: async (record) => {
                try {
                    const req = JSON.parse(record.message.value.toString());
                    console.log('payment_consumer:', req);
                    await handlePaymentWebhook(req.data, app);
                } catch (e) {
                    console.log(e);
                    await dlqProducer.send({
                        topic: `${record.topic}.dlq`,
                        messages: [{
                            ...record.message,
                            partition: 0,
                        }],
                    });
                }
            },
        });
    };

    run().catch(console.error);
});
