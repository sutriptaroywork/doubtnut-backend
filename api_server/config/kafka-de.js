const { Kafka, CompressionTypes } = require('kafkajs');
const config = require('./config');
const KafkaBkpMsgModel = require('../modules/mongo/kafka-backup');

const topics = {
    preLoginOnboarding: {
        name: 'warehouse.queue.pre-login-onboarding',
        partition: 1,
    },
    globalSearchLogs: {
        name: 'warehouse.queue.global-search-logs',
        partition: 1,
    },
};

const kafka = new Kafka({
    clientId: 'de-api-server',
    brokers: config.kafka.de_hosts,
});

const producer = kafka.producer();
let connected = false;
producer.connect().then(() => {
    connected = true;
});

producer.on('producer.disconnect', () => {
    connected = false;
});

async function publish(topic, partitionKey, data) {
    const value = { ...data };
    try {
        if (!connected) {
            await producer.connect();
            connected = true;
        }
        await producer.send({
            topic: `${topic.name}`,
            compression: CompressionTypes.GZIP,
            messages: [{
                partition: (parseInt(partitionKey) || 0) % topic.partition,
                value: JSON.stringify(value),
            }],
        });
    } catch (e) {
        console.error(e);
    }
}

async function publishIasLogs(topic, partitionKey, data) {
    try {
        if (!connected) {
            await producer.connect();
            connected = true;
        }
        console.log('kafka publish IasLogs', topic.name, partitionKey);
        await producer.send({
            topic: `${topic.name}`,
            compression: CompressionTypes.GZIP,
            messages: [{
                partition: (parseInt(partitionKey) || 0) % topic.partition,
                value: JSON.stringify(data),
            }],
        });
    } catch (e) {
        console.error(e);
        new KafkaBkpMsgModel({ topic: `${topic.name}`, msg: data }).save();
    }
}

module.exports = {
    topics,
    publish,
    publishIasLogs,
};
