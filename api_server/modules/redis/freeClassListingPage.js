const twoHours = 60 * 60 * 2;
const thirtyMinutes = 60 * 30;
const oneDay = 60 * 60 * 24;
module.exports = class FREE_CLASS_LISTING {
    // static setLanguagesListForFreeChapters(client, studentClass, data) {
    //     return client.setAsync(`FCLP:LANGUAGES:${studentClass}`, JSON.stringify(data), 'Ex', oneDay); // 1 day
    // }

    // static getLanguageListForFreeChapters(client, studentClass) {
    //     return client.getAsync(`FCLP:LANGUAGES:${studentClass}`);
    // }

    // static getSubjectsListForFreeChapters(client, studentClass, metaInfo) {
    //     metaInfo.sort();
    //     return client.getAsync(`FCLP:SUBJECTS:${studentClass}:${metaInfo.join()}`);
    // }

    // static setSubjectsListForFreeChapters(client, studentClass, metaInfo, data) {
    //     metaInfo.sort();
    //     return client.setAsync(`FCLP:SUBJECTS:${studentClass}:${metaInfo.join()}`, JSON.stringify(data), 'Ex', oneDay); // 1 day
    // }

    // static getTeachersListForFreeChapters(client, studentClass, metaInfo, subject) {
    //     metaInfo.sort();
    //     return client.getAsync(`FCLP:TEACHERS:${studentClass}:${metaInfo.join()}:${subject.join()}`);
    // }

    // static setTeachersListForFreeChapters(client, studentClass, metaInfo, subject, data) {
    //     metaInfo.sort();
    //     return client.setAsync(`FCLP:TEACHERS:${studentClass}:${metaInfo.join()}:${subject.join()}`, JSON.stringify(data), 'Ex', oneDay); // 1 day
    // }

    // static getFreeChapters(client, studentClass, metaInfo, subject, teacher) {
    //     metaInfo.sort();
    //     teacher.sort();
    //     return client.getAsync(`FCLP:CHAPTER:${studentClass}:${metaInfo.join()}:${subject.join()}:${teacher.join()}`);
    // }

    // static setFreeChapters(client, studentClass, metaInfo, subject, teacher, data) {
    //     metaInfo.sort();
    //     teacher.sort();
    //     return client.setAsync(`FCLP:CHAPTER:${studentClass}:${metaInfo.join()}:${subject.join()}:${teacher.join()}`, JSON.stringify(data), 'Ex', oneDay); // 1 day
    // }

    // static getFreeChapterData(client, studentClass, metaInfo, subject, teacher, chapter) {
    //     metaInfo.sort();
    //     teacher.sort();
    //     return client.getAsync(`FCLP:CHAPTER:${studentClass}:${metaInfo.join()}:${subject.join()}:${teacher.join()}:${chapter}`);
    // }

    // static setFreeChapterData(client, studentClass, metaInfo, subject, teacher, chapter, data) {
    //     metaInfo.sort();
    //     teacher.sort();
    //     return client.setAsync(`FCLP:CHAPTER:${studentClass}:${metaInfo.join()}:${subject.join()}:${teacher.join()}:${chapter}`, JSON.stringify(data), 'Ex', oneDay); // 1 day
    // }

    static getLatestChapterBySubject(client, studentClass, metaInfo, subject) {
        metaInfo.sort();
        return client.getAsync(`FCLP:LATEST:${studentClass}:${metaInfo.join()}:${subject}`);
    }

    static setLatestChapterBySubject(client, studentClass, metaInfo, subject, data) {
        metaInfo.sort();
        return client.setAsync(`FCLP:LATEST:${studentClass}:${metaInfo.join()}:${subject}`, JSON.stringify(data), 'Ex', thirtyMinutes); // 30 day
    }

    // static getFreeChapterDataFromChapterName(client, studentClass, metaInfo, subject, chapter) {
    //     metaInfo.sort();
    //     return client.getAsync(`FCLP:CHAPTER_NAME:${studentClass}:${metaInfo.join()}:${subject}:${chapter}`);
    // }

    // static setFreeChapterDataFromChapterName(client, studentClass, metaInfo, subject, chapter, data) {
    //     metaInfo.sort();
    //     return client.setAsync(`FCLP:CHAPTER_NAME:${studentClass}:${metaInfo.join()}:${subject}:${chapter}`, JSON.stringify(data), 'Ex', thirtyMinutes); // 30 day
    // }

    static getSubjectsList(client, studentClass, metaInfo) {
        return client.getAsync(`FCLP:SUBJECTS:${studentClass}:${metaInfo}`);
    }

    static getTeachersList(client, studentClass, metaInfo, subject, chapter) {
        return client.getAsync(`FCLP:TEACHERS:${studentClass}:${metaInfo}:${subject}:${chapter}`);
    }

    static gettChaptersList(client, studentClass, metaInfo, subject) {
        return client.getAsync(`FCLP:CHAPTERS:${studentClass}:${metaInfo}:${subject}`);
    }

    static getSubjectAssortmentIds(client, studentClass, metaInfo, subject) {
        return client.getAsync(`FCLP:SUBJECT_ASSORTMENTS:${studentClass}:${metaInfo}:${subject}`);// 1 day
    }
};
