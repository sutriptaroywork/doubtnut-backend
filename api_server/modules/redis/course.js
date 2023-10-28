const hash_expiry = 60 * 60 * 24 * 30;
const hash_six_expiry = 60 * 60;
const hashExpirySeven = 60 * 60 * 24 * 7; // 7 days
const moment = require('moment');

// function to get minutes for which expiry is to be set.
function getExpireTime() {
    const now = moment().add(5, 'hours').add(30, 'minutes');

    // get difference between current value of minute and next closest minute value which is multiple of 5 to expire key at every minute which mutiple of 5
    // example :- if it is 12:11 pm then, current minute = 11 and next closest minute is 15. So, 5 - (11%5) = 4. set expiry for 4 minutes.
    const minutes = 5 - (now.minute() % 5);

    // cache for 30 secs when minute value is multiple of 10.
    if (minutes == 5) {
        return 30;
    }
    return minutes * 60;
}

module.exports = class Course {
    static setFacultyDetails(client, faculty_id, data) {
        return client.hsetAsync('et_faculty_by_faculty_id', faculty_id, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getFacultyDetails(client, faculty_id) {
        return client.hgetAsync('et_faculty_by_faculty_id', faculty_id);
    }

    static setChapterDetails(client, faculty_id, ecm_id, data) {
        return client.hsetAsync('et_chapters_by_faculty_id_ecm_id', `${faculty_id}_${ecm_id}`, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getChapterDetails(client, faculty_id, ecm_id) {
        return client.hgetAsync('et_chapters_by_faculty_id_ecm_id', `${faculty_id}_${ecm_id}`);
    }

    static setFacultyDetailsUsingChapterId(client, chapterId, data) {
        return client.hsetAsync('et_faculty_by_chapter_id', chapterId, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getFacultyDetailsUsingChapterId(client, chapterId) {
        return client.hgetAsync('et_faculty_by_chapter_id', chapterId);
    }

    static setLectures(client, chapterId, data) {
        return client.hsetAsync('et_lectures_by_chapter_id', chapterId, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getLectures(client, chapterId) {
        return client.hgetAsync('et_lectures_by_chapter_id', chapterId);
    }

    static setTopFacultyFromLectureId(client, lectureId, data) {
        return client.hsetAsync('et_top_lectures_by_lecture_id', lectureId, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getTopFacultyFromLectureId(client, lectureId) {
        return client.hgetAsync('et_top_lectures_by_lecture_id', lectureId);
    }

    static setLectureIdFromQuestionId(client, questionId, data) {
        return client.hsetAsync('et_lecture_by_question_id', questionId, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getLectureIdFromQuestionId(client, questionId) {
        return client.hgetAsync('et_lecture_by_question_id', questionId);
    }

    static setChapterDetailsUsingChapterId(client, chapterId, data) {
        return client.hsetAsync('et_chapters_by_chapter_id', chapterId, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getChapterDetailsUsingChapterId(client, chapterId) {
        return client.hgetAsync('et_chapters_by_chapter_id', chapterId);
    }

    static getEResourcesFromChapterId(client, chapterId, data) {
        return client.hsetAsync('et_resources_by_chapter_id', chapterId, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static setEResourcesFromChapterId(client, chapterId) {
        return client.hgetAsync('et_resources_by_chapter_id', chapterId);
    }

    static setEcmByIdAndClass(client, ecmId, studentClass, data) {
        return client.setAsync(`et_ecm_data_${ecmId}_${studentClass}`, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getEcmByIdAndClass(client, ecmId, studentClass) {
        return client.getAsync(`et_ecm_data_${ecmId}_${studentClass}`);
    }

    static setChapterDetailsV2(client, facultyId, ecmId, data) {
        return client.setAsync(`et_chapter_details_v2_${facultyId}_${ecmId}`, JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getChapterDetailsV2(client, facultyId, ecmId) {
        return client.getAsync(`et_chapter_details_v2_${facultyId}_${ecmId}`);
    }

    static setFacultyDetailsUsingChapterIdV2(client, chapterId, studentClass, data) {
        return client.setAsync(`et_lecture_page_v2_${chapterId}_${studentClass}`, JSON.stringify(data), 'Ex', hash_six_expiry);
    }

    static getFacultyDetailsUsingChapterIdV2(client, chapterId, studentClass) {
        return client.getAsync(`et_lecture_page_v2_${chapterId}_${studentClass}`);
    }

    static setFacultyGrid(client, ecmId, studentClass, data) {
        return client.setAsync(`et_faculty_grid_${ecmId}_${studentClass}`, JSON.stringify(data), 'Ex', hash_six_expiry);
    }

    static getFacultyGrid(client, ecmId, studentClass) {
        return client.getAsync(`et_faculty_grid_${ecmId}_${studentClass}`);
    }

    static setFacultyGridBySubject(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`et_faculty_grid_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', hash_six_expiry);
    }

    static getFacultyGridBySubject(client, ecmId, studentClass, subject) {
        return client.getAsync(`et_faculty_grid_${ecmId}_${studentClass}_${subject}`);
    }

    static setTopCourses(client, ecmId, studentClass, data) {
        return client.setAsync(`et_top_courses_${ecmId}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getTopCourses(client, ecmId, studentClass) {
        return client.getAsync(`et_top_courses_${ecmId}_${studentClass}`);
    }

    static setPopularCourses(client, ecmId, studentClass, data) {
        return client.setAsync(`et_popular_courses_${ecmId}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getPopularCourses(client, ecmId, studentClass) {
        return client.getAsync(`et_popular_courses_${ecmId}_${studentClass}`);
    }

    static setStructuredFreeCourse(client, ecmId, studentClass, data) {
        return client.setAsync(`et_free_courses_${ecmId}_${studentClass}`, JSON.stringify(data), 'Ex', hash_six_expiry);
    }

    static getStructuredFreeCourse(client, ecmId, studentClass) {
        return client.getAsync(`et_free_courses_${ecmId}_${studentClass}`);
    }

    static setAllStructuredCourse(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`vmc_courses_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getAllStructuredCourse(client, ecmId, studentClass, subject) {
        return client.getAsync(`vmc_courses_${ecmId}_${studentClass}_${subject}`);
    }

    static setAllStructuredCourseV2(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`vmc_courses_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getAllStructuredCourseV2(client, ecmId, studentClass, subject) {
        return client.getAsync(`vmc_courses_${ecmId}_${studentClass}_${subject}`);
    }

    static getLiveSectionVideos(client, ecmId, studentClass, subject) {
        return client.getAsync(`et_free_courses_${ecmId}_${studentClass}_${subject}`);
    }

    static setLiveSectionVideos(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`vmc_courses_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static setCoursesByFaculty(client, ecmId, studentClass, facultyId, data) {
        return client.setAsync(`vmc_courses_${ecmId}_${studentClass}_${facultyId}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getCoursesByFaculty(client, ecmId, studentClass, facultyId) {
        return client.getAsync(`vmc_courses_${ecmId}_${studentClass}_${facultyId}`);
    }

    static setSyllabusByFaculty(client, ecmId, studentClass, facultyId, data) {
        return client.setAsync(`vmc_courses_${ecmId}_${studentClass}_${facultyId}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getSyllabusByFaculty(client, ecmId, studentClass, facultyId) {
        return client.getAsync(`vmc_courses_${ecmId}_${studentClass}_${facultyId}`);
    }

    static setCourseList(client, ecmId, studentClass, subject, page, data) {
        return client.setAsync(`et_courses_list_${ecmId}_${studentClass}_${subject}_${page}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getCourseList(client, ecmId, studentClass, subject, page) {
        return client.getAsync(`et_courses_list_${ecmId}_${studentClass}_${subject}_${page}`);
    }

    static setDistinctSubject(client, ecmId, studentClass, data) {
        return client.setAsync(`et_subject_list_${ecmId}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getDistinctSubject(client, ecmId, studentClass) {
        return client.getAsync(`et_subject_list_${ecmId}_${studentClass}`);
    }

    static setTestimonials(client, data) {
        return client.setAsync('et_testimonials', JSON.stringify(data), 'Ex', hash_expiry);
    }

    static getTestimonials(client) {
        return client.getAsync('et_testimonials');
    }

    static setRandomSubsViews(client, type, id, data) {
        return client.setAsync(`${type}:${id}`, JSON.stringify(data), 'Ex', hash_expiry * 2);
    }

    static getRandomSubsViews(client, type, id) {
        return client.getAsync(`${type}:${id}`);
    }

    static setAllMasterChaptersEtoos(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`et_subject_list_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getAllMasterChaptersEtoos(client, ecmId, studentClass, subject) {
        return client.getAsync(`et_subject_list_${ecmId}_${studentClass}_${subject}`);
    }

    static setAllMasterChaptersEtoosV1(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`et_master_chapter_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getAllMasterChaptersEtoosV1(client, ecmId, studentClass, subject) {
        return client.getAsync(`et_master_chapter_${ecmId}_${studentClass}_${subject}`);
    }

    static setAllMasterChapters(client, ecmId, studentClass, subject, data) {
        return client.setAsync(`et_subject_list_${ecmId}_${studentClass}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getAllMasterChapters(client, ecmId, studentClass, subject) {
        return client.getAsync(`et_subject_list_${ecmId}_${studentClass}_${subject}`);
    }

    static setPromoSection(client, ecmId, data) {
        return client.setAsync(`et_subject_list_${ecmId}`, JSON.stringify(data), 'Ex', 60 * 60);
    }

    static getPromoSection(client, ecmId) {
        return client.getAsync(`et_subject_list_${ecmId}`);
    }

    static setAllCourse(client, data) {
        return client.setAsync('course_details_leaderboard3', JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getAllCourse(client) {
        return client.getAsync('course_details_leaderboard3');
    }

    static getLeaderBoard(client, courseID, date, slicedCount) {
        return client.getAsync(`course_leaderboard_data:${courseID}_${date}_${slicedCount}`);
    }

    static setLeaderBoard(client, courseID, date, slicedCount, data) {
        return client.setAsync(`course_leaderboard_data:${courseID}_${date}_${slicedCount}`, JSON.stringify(data), 'Ex', 60 * 5);
    }

    static getFastestAnswer(client, studentID, date) {
        return client.getAsync(`course_student_fastest_answer:${studentID}_${date}`);
    }

    static setFastestAnswer(client, studentID, date, data) {
        return client.setAsync(`course_student_fastest_answer:${studentID}_${date}`, JSON.stringify(data), 'Ex', 60 * 60 * 6);
    }

    static setDailyLeaderboardByDate(client, date, points, studentID) {
        console.log(`liveclass:leaderboard:${date}`);
        client.multi()
            .zadd(`liveclass:leaderboard:${date}`, points, studentID)
            .expireat(`liveclass:leaderboard:${date}`, parseInt((+new Date()) / 1000) + hashExpirySeven)
            .execAsync();
    }

    static setDailyLeaderboardByDateAndCourse(client, date, points, courseID, studentID) {
        console.log(`liveclass:leaderboard:${courseID}:${date}`);
        return client.multi()
            .zadd(`liveclass:leaderboard:${courseID}:${date}`, 'INCR', points, studentID)
            .expireat(`liveclass:leaderboard:${courseID}:${date}`, parseInt((+new Date()) / 1000) + hashExpirySeven)
            .execAsync();
    }

    static getLeaderboardByDateAndCourse(client, date, courseID, min, max) {
        console.log(`liveclass:leaderboard:${courseID}:${date}`);
        return client.zrevrangeAsync(`liveclass:leaderboard:${courseID}:${date}`, min, max, 'WITHSCORES');
    }

    static getLeaderboardByDate(client, date, min, max) {
        return client.zrevrangeAsync(`liveclass:leaderboard:${date}`, min, max, 'WITHSCORES');
    }

    static getUserRankByDateAndCourse(client, date, courseID, studentID) {
        return client.zrevrankAsync(`liveclass:leaderboard:${courseID}:${date}`, studentID);
    }

    static getUserRankByDate(client, date, studentID) {
        return client.zrevrankAsync(`liveclass:leaderboard:${date}`, studentID);
    }

    static getUserScoreByDate(client, date, studentID) {
        return client.zscoreAsync(`liveclass:leaderboard:${date}`, studentID);
    }

    static setSubscribers(client, resourceId, data) {
        return client.setAsync(`liveclass_subscribers_${resourceId}`, JSON.stringify(data), 'Ex', 60 * 5);
    }

    static getSubscribers(client, resourceId) {
        return client.getAsync(`liveclass_subscribers_${resourceId}`);
    }

    static setViewSubscribers(client, resourceId, data) {
        return client.setAsync(`liveclass_view_subscribers_${resourceId}`, JSON.stringify(data), 'Ex', 30);
    }

    static getViewSubscribers(client, resourceId) {
        return client.getAsync(`liveclass_view_subscribers_${resourceId}`);
    }

    static getUserScoreByDateAndCourse(client, date, courseID, studentID) {
        console.log(`liveclass:leaderboard:${courseID}:${date}`);
        return client.zscoreAsync(`liveclass:leaderboard:${courseID}:${date}`, studentID);
    }

    static setLiveSectionHome(client, coursesId, courseType, subject, studentClass, data) {
        return client.setAsync(`liveclass_home_page_${coursesId}_${courseType}_${subject}_${studentClass}`, JSON.stringify(data), 'Ex', getExpireTime());
    }

    static getLiveSectionHome(client, coursesId, courseType, subject, studentClass) {
        return client.getAsync(`liveclass_home_page_${coursesId}_${courseType}_${subject}_${studentClass}`);
    }

    static setAssortmentIDFromCcm(client, ccmArray, studentClass, userLocale, data) {
        return client.setAsync(`course_assortment_ccm_${JSON.stringify(ccmArray)}_${studentClass}_${userLocale}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 min
    }

    static getAssortmentIDFromCcm(client, ccmArray, studentClass, userLocale) {
        return client.getAsync(`course_assortment_ccm_${JSON.stringify(ccmArray)}_${studentClass}_${userLocale}`);
    }

    static setAssortmentIDFromClass(client, studentClass, userLocale, data) {
        return client.setAsync(`course_assortment_class_${studentClass}_${userLocale}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 min
    }

    static getAssortmentIDFromClass(client, studentClass, userLocale) {
        return client.getAsync(`course_assortment_class_${studentClass}_${userLocale}`);
    }

    static getReferralV2RedmiWinners(client) {
        return client.getAsync(`get_referral_redmi_winners`);
    }

    static setReferralV2RedmiWinners(client, count) {
        return client.setAsync(`get_referral_redmi_winners`, count, 'Ex', 60 * 60); // 60 min
    }

    static getCourseCategoryTypes(client) {
        return client.getAsync('admin_panel:course_category_types');
    }

    static setCourseCategoryTypes(client, data) {
        return client.setAsync('admin_panel:course_category_types', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getCourseMetaTypes(client) {
        return client.getAsync('admin_panel:course_meta_types');
    }

    static setCourseMetaTypes(client, data) {
        return client.setAsync('admin_panel:course_meta_types', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getCourseYears(client) {
        return client.getAsync('admin_panel:course_years');
    }

    static setCourseYears(client, data) {
        return client.setAsync('admin_panel:course_years', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getCourseFilters(client) {
        return client.getAsync('admin_panel:course_filters');
    }

    static setCourseFilters(client, data) {
        return client.setAsync('admin_panel:course_filters', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getCourseCategories(client, categoryType) {
        return client.getAsync(`admin_panel:course_categories:${categoryType}`);
    }

    static setCourseCategories(client, categoryType, data) {
        return client.setAsync(`admin_panel:course_categories:${categoryType}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }
};
