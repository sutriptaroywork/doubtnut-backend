const { ObjectID } = require('mongodb');
const rp = require('request-promise');
const moment = require('moment');

class PopupNotificationsHelper {
    constructor(req) {
        this.req = req;
        this.db = req.app.get('db');
        this.currentDate = moment().add(5, 'hours').add(30, 'minutes').toDate();
    }

    async createNotification() {
        this.db.mongo.write.collection('popup_notification').insertOne({
            heading: this.req.body.heading,
            heading_hi: this.req.body.heading_hi,
            thumbnail_url: this.req.body.thumbnail_url,
            cta_text: this.req.body.cta_text,
            deeplink: this.req.body.deeplink,
            logo_url: this.req.body.logo_url,
            is_skippable: Boolean(parseInt(this.req.body.is_skippable)),
            is_active: true,
            notification_date: new Date(this.req.body.notification_date),
            created_by: this.req.body.created_by,
            created_at: this.currentDate,
            csv_url: this.req.body.csv_url,
        }, (err, res) => {
            if (err) {
                console.error(err);
            }
            console.log(res);
            const objectId = res.ops[0]._id;
            this.getCsvData(this.req.body.csv_url, objectId);
        });
        return {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
    }

    async updateNotification() {
        const data = {
            heading: this.req.body.heading,
            heading_hi: this.req.body.heading_hi,
            thumbnail_url: this.req.body.thumbnail_url,
            cta_text: this.req.body.cta_text,
            deeplink: this.req.body.deeplink,
            logo_url: this.req.body.logo_url,
            is_skippable: Boolean(parseInt(this.req.body.is_skippable)),
            is_active: Boolean(parseInt(this.req.body.is_active)),
            notification_date: new Date(this.req.body.notification_date),
            csv_url: this.req.body.csv_url,
            updated_at: this.currentDate,
        };
        this.db.mongo.write.collection('popup_notification').update({ _id: ObjectID(this.req.body.id) }, { $set: data }, (err, result) => {
            if (err) {
                console.log(err);
            } else {
                console.log(result);
            }
        });
        return {
            meta: {
                code: 200,
                success: true,
                message: 'SUCCESS',
            },
        };
    }

    async getNotifications() {
        const data = [];
        try {
            const cursor = this.db.mongo.read.collection('popup_notification').find({}, { sort: { _id: -1 } }).limit(parseInt(this.req.body.limit)).skip(parseInt(this.req.body.skip));
            await cursor.forEach((doc) => {
                data.push(doc);
            });
            return {
                meta: {
                    code: 200,
                    success: true,
                    message: 'SUCCESS',
                },
                data: {
                    quiz_data: data,
                },
            };
        } catch (e) {
            console.error(e);
            throw (e);
        }
    }

    async getCsvData(csvUrl, objectId) {
        const buf = await rp.get(csvUrl);
        const data = buf.split('\n');
        const rowHeader = data[0].trim().replace(/(\r\n|\n|\r)/gm, '');
        if (rowHeader === 'student_id') {
            console.log('student_id');
            for (let i = 1; i < data.length; i++) {
                await this.db.mongo.write.collection('temp_popup_notification').updateOne({ student_id: parseInt(data[i].trim().replace(/(\r\n|\n|\r)/gm, '')) }, {
                    $set: {
                        updatedAt: this.currentDate,
                        popup_id: ObjectID(objectId),
                        notification_date: new Date(this.req.body.notification_date),
                    },
                    $setOnInsert: {
                        createdAt: this.currentDate,
                        student_id: parseInt(data[i].trim().replace(/(\r\n|\n|\r)/gm, '')),
                    },
                }, { upsert: true }, (err, res) => {
                    if (err) {
                        console.error(err);
                    }
                    console.log(res);
                });
            }
        } else if (rowHeader === 'ccm_id') {
            console.log('ccm_id');
            for (let i = 1; i < data.length; i++) {
                await this.db.mongo.write.collection('temp_popup_notification').updateOne({ ccm_id: parseInt(data[i].trim().replace(/(\r\n|\n|\r)/gm, '')) }, {
                    $set: {
                        updatedAt: this.currentDate,
                        popup_id: ObjectID(objectId),
                        notification_date: new Date(this.req.body.notification_date),
                    },
                    $setOnInsert: {
                        createdAt: this.currentDate,
                        ccm_id: parseInt(data[i].trim().replace(/(\r\n|\n|\r)/gm, '')),
                    },
                }, { upsert: true }, (err, res) => {
                    if (err) {
                        console.error(err);
                    }
                    console.log(res);
                });
            }
        } else if (rowHeader === 'student_class') {
            console.log('student class');
            for (let i = 1; i < data.length; i++) {
                await this.db.mongo.write.collection('temp_popup_notification').updateOne({ student_class: parseInt(data[i].trim().replace(/(\r\n|\n|\r)/gm, '')) }, {
                    $set: {
                        updatedAt: this.currentDate,
                        popup_id: ObjectID(objectId),
                        notification_date: new Date(this.req.body.notification_date),
                    },
                    $setOnInsert: {
                        createdAt: this.currentDate,
                        student_class: parseInt(data[i].trim().replace(/(\r\n|\n|\r)/gm, '')),
                    },
                }, { upsert: true }, (err, res) => {
                    if (err) {
                        console.error(err);
                    }
                    console.log(res);
                });
            }
        }
    }
}

module.exports = PopupNotificationsHelper;
