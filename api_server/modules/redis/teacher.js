const dailyExpiry = 60 * 60 * 24;

module.exports = class Teacher {
    static getById(client, teacherId) {
        return client.getAsync(`TEACHER:${teacherId}`);
    }

    static setById(client, teacherId, data) {
        return client.setAsync(`TEACHER:${teacherId}`, JSON.stringify(data), 'Ex', dailyExpiry);
    }

    static delById(client, teacherId) {
        return client.delAsync(`TEACHER:${teacherId}`);
    }

    static getNewUser(client, mobile) {
        return client.getAsync(`TEACHER:${mobile}`);
    }

    static setNewUser(client, mobile, data) {
        return client.setAsync(`TEACHER:${mobile}`, data.toString(), 'Ex', dailyExpiry);
    }

    static getTeacherByCCMBoard(client, ccm, studentClass) {
        return client.getAsync(`TEACHER:CCMBOARD:${ccm}:${studentClass}`);
    }

    static setTeacherByCCMBoard(client, ccm, studentClass, data) {
        return client.setAsync(`TEACHER:CCMBOARD:${ccm}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 min
    }

    static getTeacherByCCMExam(client, ccm, studentClass) {
        return client.getAsync(`TEACHER:CCMEXAM:${ccm}:${studentClass}`);
    }

    static setTeacherByCCMExam(client, ccm, studentClass, data) {
        return client.setAsync(`TEACHER:CCMEXAM:${ccm}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 min
    }

    static getTeacherVideos(client, teacherId) {
        return client.getAsync(`TEACHER:VIDEO:${teacherId}`);
    }

    static setTeacherVideos(client, teacherId, data) {
        return client.setAsync(`TEACHER:VIDEO:${teacherId}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 min
    }

    static getTeacherVideosNew(client, teacherId) {
        return client.getAsync(`TEACHER:VIDEONEW:${teacherId}`);
    }

    static setTeacherVideosNew(client, teacherId, data) {
        return client.setAsync(`TEACHER:VIDEONEW:${teacherId}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 min
    }

    static getTeacherByClassLocale(client, studentClass, studentLocale) {
        return client.getAsync(`TEACHER:CLASSLOCALE:${studentClass}:${studentLocale}`);
    }

    static setTeacherByClassLocale(client, studentClass, studentLocale, data) {
        return client.setAsync(`TEACHER:CLASSLOCALE:${studentClass}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 min
    }

    static getSubsTotal(client, teacherId) {
        return client.getAsync(`TEACHER:SUBSTOTAL:${teacherId}`);
    }

    static setSubsTotal(client, teacherId, data) {
        return client.setAsync(`TEACHER:SUBSTOTAL:${teacherId}`, data, 'Ex', 60 * 60); // 1 hr
    }

    static incrSubsTotal(client, teacherId) {
        return client.incrAsync(`TEACHER:SUBSTOTAL:${teacherId}`);
    }

    static decrSubsTotal(client, teacherId) {
        return client.decrAsync(`TEACHER:SUBSTOTAL:${teacherId}`);
    }

    static getTeacherVideoLikeStats(client, questionId) {
        return client.getAsync(`TEACHER:VIDEO:LIKESTATS:${questionId}`);
    }

    static setTeacherVideoLikeStats(client, questionId, data) {
        return client.setAsync(`TEACHER:VIDEO:LIKESTATS:${questionId}`, data, 'Ex', 60 * 60 * 24); // 1 day
    }

    static incrTeacherVideoLikeStats(client, questionId) {
        return client.incrAsync(`TEACHER:VIDEO:LIKESTATS:${questionId}`);
    }

    static decrTeacherVideoLikeStats(client, questionId) {
        return client.decrAsync(`TEACHER:VIDEO:LIKESTATS:${questionId}`);
    }

    static getTeacherVideoDislikeStats(client, questionId) {
        return client.getAsync(`TEACHER:VIDEO:DISLIKESTATS:${questionId}`);
    }

    static setTeacherVideoDislikeStats(client, questionId, data) {
        return client.setAsync(`TEACHER:VIDEO:DISLIKESTATS:${questionId}`, data, 'Ex', 60 * 60 * 24); // 1 day
    }

    static incrTeacherVideoDislikeStats(client, questionId) {
        return client.incrAsync(`TEACHER:VIDEO:DISLIKESTATS:${questionId}`);
    }

    static decrTeacherVideoDislikeStats(client, questionId) {
        return client.decrAsync(`TEACHER:VIDEO:DISLIKESTATS:${questionId}`);
    }

    static getTeacherVideoShareStats(client, questionId) {
        return client.getAsync(`TEACHER:VIDEO:SHARESTATS:${questionId}`);
    }

    static setTeacherVideoShareStats(client, questionId, data) {
        return client.setAsync(`TEACHER:VIDEO:SHARESTATS:${questionId}`, data, 'Ex', 60 * 60 * 24); // 1 day
    }

    static incrTeacherVideoShareStats(client, questionId) {
        return client.incrAsync(`TEACHER:VIDEO:SHARESTATS:${questionId}`);
    }

    static getTeacherLeaderboardAll(client, type, min, max) {
        return client.zrevrangeAsync(`leaderboard:teachers:${type}`, min, max, 'WITHSCORES');
    }

    static getTeacherLeaderboardRank(client, type, teacherID) {
        return client.zrevrankAsync(`leaderboard:teachers:${type}`, teacherID);
    }

    static getTeacherLeaderboardViews(client, type, teacherID) {
        return client.zscoreAsync(`leaderboard:teachers:${type}`, teacherID);
    }

    static getTotalViews(client, teacherId) {
        return client.getAsync(`TEACHER:VIEWS:ALLTIME:${teacherId}`);
    }

    static getNewVidCount(client, teacherId) {
        return client.getAsync(`TEACHER:VIDEOS:NEW:${teacherId}`);
    }

    static getDistinctSubjectsByTeacherAndClass(client, teacherId, studentClass) {
        return client.getAsync(`TEACHER:SUBJECTS:${teacherId}:${studentClass}`);
    }

    static setDistinctSubjectsByTeacherAndClass(client, teacherId, studentClass, data) {
        return client.setAsync(`TEACHER:SUBJECTS:${teacherId}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hr
    }

    static getInternalDistinctSubjectsByTeacherAndClass(client, teacherId, studentClass) {
        return client.getAsync(`INTERNAL_TEACHER:SUBJECTS:${teacherId}:${studentClass}`);
    }

    static setInternalDistinctSubjectsByTeacherAndClass(client, teacherId, studentClass, data) {
        return client.setAsync(`INTERNAL_TEACHER:SUBJECTS:${teacherId}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hr
    }

    static getFreeCourseAndFacultyByClass(client, studentClass) {
        return client.getAsync(`INTERNAL:TEACHERS:${studentClass}`);
    }

    static setFreeCourseAndFacultyByClass(client, studentClass, data) {
        return client.setAsync(`INTERNAL:TEACHERS:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getAssortmentDetails(client, assortmentId) {
        return client.getAsync(`INTERNAL:TEACHERS:ASSORTMENT:${assortmentId}`);
    }

    static setAssortmentDetails(client, assortmentId, data) {
        return client.setAsync(`INTERNAL:TEACHERS:ASSORTMENT:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getSubsTotalInternal(client, teacherId) {
        return client.getAsync(`INTERNAL:TEACHER:SUBSTOTAL:${teacherId}`);
    }

    static setSubsTotalInternal(client, teacherId, data) {
        return client.setAsync(`INTERNAL:TEACHER:SUBSTOTAL:${teacherId}`, data, 'Ex', 60 * 60); // 1 hr
    }

    static incrSubsTotalInternal(client, teacherId) {
        return client.incrAsync(`INTERNAL:TEACHER:SUBSTOTAL:${teacherId}`);
    }

    static decrSubsTotalInternal(client, teacherId) {
        return client.decrAsync(`INTERNAL:TEACHER:SUBSTOTAL:${teacherId}`);
    }

    static getTotalViewsInternal(client, teacherId) {
        return client.getAsync(`INTERNAL:TEACHER:VIEWS:ALLTIME:${teacherId}`);
    }

    static getNewVidCountInternal(client, teacherId) {
        return client.getAsync(`INTERNAL:TEACHER:VIDEOS:NEW:${teacherId}`);
    }

    static getTeacherVideosInternal(client, teacherId, studentClass) {
        return client.getAsync(`INTERNAL:TEACHER:VIDEO:${teacherId}:${studentClass}`);
    }

    static setTeacherVideosInternal(client, teacherId, studentClass, data) {
        return client.setAsync(`INTERNAL:TEACHER:VIDEO:${teacherId}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60); // 60 min
    }

    static checkTeacherIsInternal(client, teacherId) {
        return client.getAsync(`INTERNAL:TEACHER:DETAILS:${teacherId}`);
    }

    static setTeacherIsInternal(client, teacherId, data) {
        return client.setAsync(`INTERNAL:TEACHER:DETAILS:${teacherId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getDinstinctSubjectAppInternal(client, teacherId, studentClass) {
        return client.getAsync(`INTERNAL:TEACHER:SUBJECT:${teacherId}:${studentClass}`);
    }

    static setDinstinctSubjectAppInternal(client, teacherId, studentClass, data) {
        return client.setAsync(`INTERNAL:TEACHER:SUBJECT:${teacherId}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getDinstinctCategoriesAppInternal(client, teacherId, studentClass) {
        return client.getAsync(`INTERNAL:TEACHER:CATEGORY:${teacherId}:${studentClass}`);
    }

    static setDinstinctCategoriesAppInternal(client, teacherId, studentClass, data) {
        return client.setAsync(`INTERNAL:TEACHER:CATEGORY:${teacherId}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getDistinctTeachingDetails(client, teacherId) {
        return client.getAsync(`INTERNAL:TEACHER:TEACHINGDETAILS:${teacherId}`);
    }

    static setDistinctTeachingDetails(client, teacherId, data) {
        return client.setAsync(`INTERNAL:TEACHER:TEACHINGDETAILS:${teacherId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getAllInternalTeacherRatingList(client, min, max) {
        return client.zrevrangeAsync('teacher_rating', min, max, 'WITHSCORES');
    }
};
