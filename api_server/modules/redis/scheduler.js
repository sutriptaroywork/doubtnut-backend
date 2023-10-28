module.exports = class Scheduler {
    static getPlaylists(client, studentClass, locale) {
        return client.getAsync(`SIMULATED:${studentClass}:${locale}`);
    }

    static setPlaylists(client, studentClass, locale, data) {
        return client.setAsync(`SIMULATED:${studentClass}:${locale}`, JSON.stringify(data), 'Ex', 60 * 30);
    }

    static getQidCheck(client, qid) {
        return client.getAsync(`qcs:${qid}`);
    }

    static setQidCheck(client, qid, data) {
        // qid_check_scheduler
        return client.setAsync(`qcs:${qid}`, JSON.stringify(data), 'EX', 60 * 60 * 12); // 12 hours
    }
};
