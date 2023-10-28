const monthlyExpiry = 60 * 60 * 24 * 30;

module.exports = class Studygroup {
    static setStudyGroupDetail(groupId, field, data, client) {
        return client.multi()
            .hset(groupId, field, JSON.stringify(data))
            .expire(groupId, monthlyExpiry)
            .execAsync();
    }

    static getStudyGroupDetail(groupId, field, client) {
        return client.hgetAsync(groupId, field);
    }

    static delStudyGroupDetail(groupId, field, client) {
        return client.hdelAsync(groupId, field);
    }

    static delStudyGroupCache(hashKey, field, client) {
        return client.hdelAsync(hashKey, field);
    }
};
