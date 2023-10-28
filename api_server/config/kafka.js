const { Kafka, CompressionTypes } = require('kafkajs');
const config = require('./config');
const KafkaBkpMsgModel = require('../modules/mongo/kafka-backup');

const topics = {
    vvsNotification: {
        name: 'vvs.notification',
        partition: 4,
    },
    vvsUpdate: {
        name: 'vvs.update',
        partition: 4,
    },
    championshipCoupon: {
        name: 'championship.coupon',
        partition: 4,
    },
    newtonNotifications: {
        name: 'push.notification',
        partition: 4,
    },
    askVvs: {
        name: 'ask.vvs',
        partition: 4,
    },
    askVvsDL: {
        name: 'ask.vvs.dl',
        partition: 1,
    },
    mongoS3GlobalSearchLogs: {
        name: 'mongo.s3.global.search.logs',
        partition: 1,
    },
    practiceEnglishFeedPost: {
        name: 'practice-english.feed.post',
        partition: 1,
    },
    mlmReferral: {
        name: 'mlm.referral',
        partition: 1,
    },
    dailyGoal: {
        name: 'store.daily.goal',
        partition: 10,
    },
    doubtnutPaywallQuestionCount: {
        name: 'doubtnut-paywall.question.count',
        partition: 1,
    },
    youtubeVideoUpload: {
        name: 'youtube-video.upload',
        partition: 1,
    },
    paymentWebhook: {
        name: 'payment.webhook',
        partition: 1,
    },
    ytIntroOutroAnswerUpload: {
        name: 'yt-answer.upload',
        partition: 1,
    },
    dialerDbLeadUpdate: {
        name: 'dialer.lead.update',
        partition: 1,
    },
    userQuestionsMongoSnap: {
        name: 'user-questions.log',
        partition: 1,
    },
};

const kafka = new Kafka({
    clientId: 'producer-api-server',
    brokers: config.kafka.hosts,
});

const producer = kafka.producer();
let connected = false;
producer.connect().then(() => {
    connected = true;
});

producer.on('producer.disconnect', () => {
    connected = false;
});

async function publish(topic, partitionKey, data, meta) {
    const value = { meta: { ...meta, ts: Date.now() }, data };
    try {
        if (!connected) {
            await producer.connect();
            connected = true;
        }
        console.log('kafka publish', topic.name, partitionKey);
        await producer.send({
            topic: `api-server.${topic.name}`,
            compression: CompressionTypes.GZIP,
            messages: [{
                partition: (parseInt(partitionKey) || 0) % topic.partition,
                value: JSON.stringify(value),
            }],
        });
    } catch (e) {
        console.error(e);
        new KafkaBkpMsgModel({ topic: `api-server.${topic.name}`, msg: value }).save();
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

async function newtonNotification(data) {
    const value = { meta: { studentId: data.studentId, gcmId: data.to, ts: Date.now() }, data: data.data };
    try {
        if (!connected) {
            await producer.connect();
            connected = true;
        }
        await producer.send({
            topic: `api-server.${topics.newtonNotifications.name}`,
            compression: CompressionTypes.GZIP,
            messages: [{
                value: JSON.stringify(value),
            }],
        });
    } catch (e) {
        console.error(e);
    }
}

module.exports = {
    topics,
    publish,
    newtonNotification,
    publishIasLogs,
};
