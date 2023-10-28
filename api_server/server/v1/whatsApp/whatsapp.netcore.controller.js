const fs = require('fs');
const bluebird = require('bluebird');
const moment = require('moment');

const whatsappData = require('../../../data/whatsapp.data');
const netcoreBl = require('./whatsapp.netcore.bl');

bluebird.promisifyAll(fs);

const handledType = ['IMAGE', 'TEXT'];

async function netcoreWebhook(req, _res, next) {
    next({});
    const staticParams = {
        db: req.app.get('db'),
        s3: req.app.get('s3'),
        sns: req.app.get('sns'),
        elasticSearchInstance: req.app.get('elasticSearchInstance'),
        elasticSearchTestInstance: req.app.get('elasticSearchTestInstance'),
        kinesisClient: req.app.get('kinesis'),
        translate2: req.app.get('translate2'),
        config: req.app.get('config'),
        host: `${req.protocol}://${req.headers.host}`,
        publicPath: req.app.get('publicPath'),
    };
    try {
        if (!req.body.incoming_message) {
            return;
        }
        const event = req.body.incoming_message[0];
        console.log('Netcore handling', event);
        const [student, dailyCountData, context] = await Promise.all([
            netcoreBl.addAndGetUser(staticParams, event.from, event.text_type),
            netcoreBl.getDailyCount(staticParams, event.from),
            netcoreBl.getConversationContext(staticParams, event.from),
        ]);
        const lock = context && context.active && context.createdAt && ((moment().add('5:30') - moment(context.createdAt)) < 600000);
        if (!student) {
            if (!lock) {
                netcoreBl.sendMsg(staticParams.config, event.from, whatsappData.askFailure, { event: { ...event[`${event.message_type.toLowerCase()}_type`], messageId: event.message_id }, context });
            }
            throw new Error('Unable to add user');
        }
        if (!handledType.includes(event.message_type)) {
            if (!lock) {
                netcoreBl.sendMsg(staticParams.config, event.from, whatsappData.unhandledMessageType, { event: { ...event[`${event.message_type.toLowerCase()}_type`], messageId: event.message_id }, context });
            }
            throw new Error(event.message_type);
        }
        let obj = {
            debounce: req.body.incoming_message.slice(lock ? 0 : 1).map((x) => ({
                phone: event.from,
                studentId: student.studentId,
                dailyCountData,
                context,
                messageId: x.message_id,
                mediaId: x.message_type === 'IMAGE' ? x.image_type.id : null,
                mimeType: x.message_type === 'IMAGE' ? x.image_type.mime_type : null,
                messageType: x.message_type,
            })),
            // reply: !lock,
        };
        netcoreBl.debounceMessages(staticParams, obj);
        if (lock) {
            return;
        }
        if (event.message_type === 'IMAGE') {
            obj = {
                phone: event.from,
                messageId: event.message_id,
                studentId: student.studentId,
                mediaId: event.image_type.id,
                mimeType: event.image_type.mime_type,
                dailyCountData,
                context,
            };
            netcoreBl.handleNetcoreImage(staticParams, obj);
            return;
        }
        obj = {
            phone: event.from,
            messageId: event.message_id,
            studentId: student.studentId,
            text: event.text_type.text,
            textLower: event.text_type.text.toLowerCase(),
            dailyCountData,
            context,
        };
        netcoreBl.handleNetcoreText(staticParams, obj);
    } catch (err) {
        console.error(err);
    }
}

module.exports = { netcoreWebhook };
