module.exports = class Recommendation {
    static getUserResponseBySessionId(client, studentId, sessionId) {
        return client.hgetallAsync(`recommendation:${studentId}:${sessionId}`);
    }

    static setUserResponse(client, studentId, sessionId, data) {
        return client.multi()
            .hset(`recommendation:${studentId}:${sessionId}`, data.message_id, JSON.stringify(data))
            .expire(`recommendation:${studentId}:${sessionId}`, 60 * 15)
            .execAsync();
    }

    static getRecommendedCourseByCCM(client) {
        return client.getAsync('recommendation:course_by_ccm');
    }

    static setRecommendedCourseByCCM(client, data) {
        return client.setAsync('recommendation:course_by_ccm', JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getRecommendedCourseByCCMValues(client, ccm) {
        return client.getAsync(`recommendation:course_by_ccm:${ccm}`);
    }

    static setRecommendedCourseByCCMValues(client, data, ccm) {
        return client.setAsync(`recommendation:course_by_ccm:${ccm}`, JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }
};
