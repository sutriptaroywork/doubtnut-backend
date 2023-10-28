const moment = require('moment');
const uuid = require('uuid');

const config = require('../../config/config');

module.exports = class Events {
    /**
     *
     * @param {Object} db
     * @param {Object} eventInfo
     * @returns {void}
     */
    static async putEventIntoMongo(db, eventInfo) {
        try {
            console.log('Storing the event into mongo');
            console.log(eventInfo);
            // * Check if connected to events mongo
            if (config.events_mongo.connect) {
                db.events_mongo.collection(eventInfo.collection_name).insertOne(eventInfo.data);
            }
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    /**
     * @param {*} db
     * @param {*} data
     * @returns {void}
     */
    static async putEventIntoMongoWrapper(db, data) {
        try {
            // * Store event in mongo
            const eventInfo = {
                collection_name: 'events',
                data: {
                    name: data.event_name,
                    data: {
                        student_id: data.student_id,
                        assortment_id: data.assortment_id,
                        source: data.source,
                        coupon_code: data.coupon_code,
                    },
                    timestamp: moment().unix().toString(),
                    timestamp2: moment().format('YYYY-MM-DD HH:mm:ss'),
                    environment: 'web',
                    event_id: uuid.v4(),
                    ip: data.ip,
                    user_attributes: {
                        locale: data.student_locale,
                        class: data.student_class,
                    },
                    device_info: {
                        hostname: data.hostname,
                    },
                    schema_version: 1,
                },
            };
            this.putEventIntoMongo(db, eventInfo);
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
};
