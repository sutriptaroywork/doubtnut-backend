const expiry = 60 * 60 * 24; // 1 day
module.exports = class UserProperties {
    static getByStudentID(client, studentID) {
        return client.getAsync(`user_properties_${studentID}`);
    }

    static setByStudentID(client, studentID, data) {
        return client.setAsync(`user_properties_${studentID}`, JSON.stringify(data), 'EX', expiry);
    }
};
