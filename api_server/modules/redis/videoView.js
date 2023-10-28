// let Utility = require('./utility');
module.exports = class videoView {
    static getVideoViews(student_id, client) {
        return client.hgetAsync('student_video_views', student_id);
    }

    static setVideoViews(student_id, feedback, client) {
        return client.hsetAsync('student_video_views', student_id, JSON.stringify(feedback));
    }

    static getStudentId() {
        return null;
    }

    static setStudentId() {
    }

    static getLiveClassIncomplete(student_id, client) {
        return client.getAsync(`live_class_incomplete_${student_id}`);
    }

    static setLiveClassIncomplete(student_id, data, expiry, client) {
        return client.setAsync(`live_class_incomplete_${student_id}`, data, 'Ex', expiry);
    }
};
