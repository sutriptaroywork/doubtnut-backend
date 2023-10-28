module.exports = class Class {
    static getEventsToPublishByApi(database, api) {
        const sql = 'select * from events_publishing where api_endpoint=? and is_active > 0';
        return database.query(sql, [api]);
    }
};
