const _ = require('lodash');
const mysql = require('../mysql/eventsPublisher');

const redis = require('../redis/eventsPublisher');
const config = require('../../config/config');

module.exports = class EventPublisher {
    static async getEventsToPublishByApi(db, api) {
        try {
            let data;
            if (config.caching) {
                data = await redis.getEventsToPublishByApi(db.redis.read, api);
                if (!_.isNull(data)) {
                    return JSON.parse(data);
                }
            }
            data = await mysql.getEventsToPublishByApi(db.mysql.read, api);
            const events = [];
            const attributes = [];
            // creating an processed object to store in redis so the data stored is low
            data.forEach((row) => {
                if (row.field_type === 'event') {
                    events.push(row);
                }
                if (row.field_type === 'attribute') {
                    attributes.push(row);
                }
            });
            const eventsJson = {};
            eventsJson.platforms = _.uniq(events.map((event) => event.platform));
            eventsJson.fields = _.uniq(events.map((event) => event.field));
            eventsJson.screen_name = _.uniq(events.map((event) => event.event_name))[0];

            const attributeJson = [];
            const groupedAttributes = _.groupBy(attributes, 'field');
            for (const key in groupedAttributes) {
                if (Object.prototype.hasOwnProperty.call(groupedAttributes, key)) {
                    attributeJson.push({ platforms: _.uniq(groupedAttributes[key].map((attribute) => attribute.platform)), field: key });
                }
            }
            data = {
                events: eventsJson,
                attributes: attributeJson,
            };
            if (data) {
                redis.setEventsToPublishByApi(db.redis.write, api, data);
            }
            return data;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }
};
