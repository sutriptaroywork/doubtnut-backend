module.exports = class PracticeCorner {
    static setRecentTopics(client, studentClass, studentId, topic) {
        return client.multi()
            .lpush(`PC_${studentClass}_${studentId}`, topic)
            .ltrim(`PC_${studentClass}_${studentId}`, 0, 20)
            .expire(`PC_${studentClass}_${studentId}`, 30 * 86400)
            .execAsync();
    }

    static getRecentTopics(client, studentClass, studentId) {
        return client.lrangeAsync(`PC_${studentClass}_${studentId}`, 0, -1);
    }
};
