const moment = require('moment');

const hashExpiry = 60 * 60 * 24;

const keys = require('./keys');

module.exports = class Liveclass {
    static getStatusByScheduleIdLC(client, scheduleId) {
        return client.hgetAsync('LIVECLASS:PROCESSES', `${scheduleId}`);
    }

    // status 1 - processing, 2 - processed
    static setStatusByScheduleIdLC(client, scheduleId, status) {
        return client.multi()
            .hset('LIVECLASS:PROCESSES', `${scheduleId}`, status)
            .expire('LIVECLASS:PROCESSES', hashExpiry)
            .execAsync();
    }

    static getStatusByScheduleIdVOD(client, scheduleId) {
        return client.hgetAsync('VOD:PROCESSES', `${scheduleId}`);
    }

    // status 1 - processing, 2 - processed
    static setStatusByScheduleIdVOD(client, scheduleId, status) {
        return client.multi()
            .hset('VOD:PROCESSES', `${scheduleId}`, status)
            .expire('VOD:PROCESSES', hashExpiry)
            .execAsync();
    }

    static getJeeMainsAndAdvCarshCourse(client) {
        return client.getAsync('jee_mains_adv_crash_course');
    }

    static setJeeMainsAndAdvCarshCourse(client, data) {
        return client.multi()
            .set('jee_mains_adv_crash_course', JSON.stringify(data))
            .expire('jee_mains_adv_crash_course', 60 * 60)
            .execAsync();
    }

    static mgetCategoryByExams(client, cols) {
        const {
            key: hashName,
        } = keys.examCategoryMapping;
        return client.hmgetAsync(hashName, [...cols]);
    }

    static msetCategoryByExams(client, data) {
        const {
            key: hashName,
        } = keys.examCategoryMapping;
        return client.multi()
            .hset(hashName, ...Object.entries(data))
            .expireat(hashName, moment().add(5, 'hours').add(30, 'minutes').endOf('day')
                .unix())
            .execAsync();
    }

    static getTeacherBySubject(client, subjectName) {
        const keyName = `TEACHERS_IMAGE:${subjectName}`;
        return client.srandmember(keyName);
    }

    static setTeacherBySubject(client, subjectName, data) {
        const keyName = `TEACHERS_IMAGE:${subjectName}`;
        data.forEach((x) => {
            client.sadd(keyName, x.image_url);
        });
        return true;
    }

    static setExpiryForSubjectWiseTeacherImages(client, subjectName) {
        const keyName = `TEACHERS_IMAGE:${subjectName}`;
        client.expire(keyName, 60 * 60 * 24);
    }

    static getFacultyImgById(client, facultyId) {
        return client.getAsync(`TEACHERS:DU:${facultyId}`);
    }

    static setFacultyImgById(client, facultyId, data) {
        return client.multi()
            .set(`TEACHERS:DU:${facultyId}`, JSON.stringify(data))
            .expire(`TEACHERS:DU:${facultyId}`, 60 * 60 * 24)
            .execAsync();
    }
};
