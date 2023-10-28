module.exports = class EventsPublisher {
    static getEventsToPublishByApi(client, api) {
        return client.getAsync(`events_to_publish_${api}`);
    }

    static setEventsToPublishByApi(client, api, data) {
        return client.setAsync(`events_to_publish_${api}`, JSON.stringify(data), 'EX', 60 * 60);
    }
};
