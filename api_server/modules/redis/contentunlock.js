module.exports = class UnlockContent {
    static getUnlockStatus(client, student_id, content) {
        return client.getAsync(`unlock_${student_id}_${content}`);
    }

    static setUnlockStatus(client, student_id, content) {
        console.log('set question in redis');
        return client.set(`unlock_${student_id}_${content}`, '1');
    }
};
