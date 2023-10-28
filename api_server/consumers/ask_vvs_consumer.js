/* eslint-disable global-require */
require('../config/local-secret-manager');
const { Kafka } = require('kafkajs');
const { populateSecrets } = require('../config/secret-manager');

populateSecrets().then(() => {
    const config = require('../config/config');
    const app = require('../config/express');
    const clientId = 'dn-ask-vvs-consumer';
    const brokers = config.kafka.hosts;
    const topic = 'api-server.ask.vvs';
    const { updateAnswerView } = require('./vvs_update');
    const kafkaConfig = require('../config/kafka');
    const _ = require('lodash');

    const kafka = new Kafka({ clientId, brokers });
    const consumer = kafka.consumer({ groupId: clientId, sessionTimeout: 1000 * 60 * 2 });
    const db = app.get('db');
    const run = async () => {
        await consumer.connect();
        await consumer.subscribe({ topic });
        await consumer.run({
            partitionsConsumedConcurrently: 4,
            eachMessage: async (record) => {
                const req = JSON.parse(record.message.value.toString());
                const { action } = req.data;
                const retry = req.data.retry ? req.data.retry : 1;
                let partitionKey;
                try {
                    console.log(req.data);
                    if (req.data && req.data.action) {
                        switch (req.data.action) {
                            case 'ASK_UPDATE':
                                delete req.data.action;
                                delete req.data.retry;
                                partitionKey = req.data.uuid;
                                await db.mysql.write.query('UPDATE questions_new_temp_v1 SET ? WHERE uuid = ?', [req.data, req.data.uuid.toString()]);
                                break;
                            case 'VIEW_INSERT':
                                delete req.data.action;
                                delete req.data.retry;
                                if (_.get(req, 'data.parent_id', 0) != 0) {
                                    partitionKey = req.data.uuid;
                                    const result = await db.mysql.read.query('select question_id from questions_new_temp_v1 where uuid=?', [req.data.parent_id.toString()]);
                                    if (result.length > 0) {
                                        req.data.parent_id = result[0].question_id;
                                        console.log('inside');
                                        console.log(req.data);
                                        await db.mysql.write.query('INSERT INTO video_view_stats_temp_v1 SET ?', [req.data]);
                                    }
                                } else {
                                    const res = await db.mysql.write.query('INSERT INTO video_view_stats_temp_v1 SET ?', [req.data]);
                                    console.log(res);
                                }
                                break;
                            case 'VIEW_UPDATE': {
                                delete req.data.action;
                                delete req.data.retry;
                                partitionKey = req.data.viewId;
                                // if (req.data.viewId && Utility.validateUuidForAskQuestion(req.data.viewId)) {
                                const result = await db.mysql.read.query('select view_id from video_view_stats_temp_v1 where uuid=?', [req.data.viewId.toString()]);
                                if (result.length > 0) {
                                    req.data.viewId = result[0].view_id;
                                    await updateAnswerView(req.data, app);
                                } else {
                                    await updateAnswerView(req.data, app);
                                }
                                // } else {
                                //     await updateAnswerView(req.data, app);
                                // }
                                break;
                            }
                            default:
                                // action should be ASK_INSERT
                                delete req.data.action;
                                delete req.data.retry;
                                partitionKey = req.data.uuid;
                                await db.mysql.write.query('INSERT INTO questions_new_temp_v1 SET ?', [req.data]);
                        }
                    }
                } catch (e) {
                    console.log(e);
                    // Need to add logic for adding the event back to dead letter que
                    // add monitoring to dead letter que
                    req.data.retry = retry ? retry + 1 : 1;
                    req.data.action = action;
                    if (req.data.retry && req.data.retry <= 3) {
                        kafkaConfig.publish(kafkaConfig.topics.askVvs, partitionKey, req.data);
                    } else {
                        kafkaConfig.publish(kafkaConfig.topics.askVvsDL, partitionKey, req.data);
                    }
                }
            },
        });
    };

    run().catch(console.error);
});
