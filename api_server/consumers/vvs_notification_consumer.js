/* eslint-disable global-require */
require('../config/local-secret-manager');
const { Kafka } = require('kafkajs');
const { populateSecrets } = require('../config/secret-manager');

populateSecrets().then(() => {
    const config = require('../config/config');
    const app = require('../config/express');
    const { updateAnswerView } = require('./vvs_notification');

    const clientId = 'dn-vvs-notification-consumer';
    const brokers = config.kafka.hosts;
    const topic = 'api-server.vvs.notification';

    const kafka = new Kafka({ clientId, brokers });
    const consumer = kafka.consumer({ groupId: clientId, sessionTimeout: 1000 * 60 * 2 });

    const run = async () => {
        await consumer.connect();
        await consumer.subscribe({ topic });
        await consumer.run({
            partitionsConsumedConcurrently: 3,
            eachMessage: async (record) => {

                try {
                    const req = JSON.parse(record.message.value.toString())
                    await updateAnswerView(req.data, app);
                }
                catch(e) {
                    console.log(e)
                }
                

            },
        });
    };

    run().catch(console.error);
});
