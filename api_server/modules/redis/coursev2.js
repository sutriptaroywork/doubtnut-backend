const hashExpiryHourly = 60 * 60;
const keys = require('./keys');

module.exports = class Course {
    static setCaraouselDataLandingPage(client, studentClass, locale, category, data) {
        return client.setAsync(`course_carousel_${studentClass}_${locale}_${category}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getCaraouselDataLandingPage(client, studentClass, locale, category) {
        return client.getAsync(`course_carousel_${studentClass}_${locale}_${category}`);
    }

    static setAssortmentDetailsFromId(client, assortmentId, studentClass, data) {
        return client.setAsync(`course_assortment_${studentClass}_${assortmentId}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getAssortmentDetailsFromId(client, assortmentId, studentClass) {
        return client.getAsync(`course_assortment_${studentClass}_${assortmentId}`);
    }

    static setAssortmentsByResourceReference(client, resourceReference, studentClass, data) {
        return client.setAsync(`${keys.courseAssortmentResource}:${resourceReference}_${studentClass}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getAssortmentsByResourceReference(client, resourceReference, studentClass) {
        return client.getAsync(`${keys.courseAssortmentResource}:${resourceReference}_${studentClass}`);
    }

    static setAssortmentsByResourceReferenceV1(client, resourceReference, data) {
        return client.setAsync(`${keys.courseAssortmentResource}:${resourceReference}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getAssortmentsByResourceReferenceV1(client, resourceReference) {
        return client.getAsync(`${keys.courseAssortmentResource}:${resourceReference}`);
    }

    static setChapterAssortment(client, assortmentId, data) {
        return client.setAsync(`course_chapter_assortment_${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 3);
    }

    static getChapterAssortment(client, assortmentId) {
        return client.getAsync(`course_chapter_assortment_${assortmentId}`);
    }

    static setVariantDetails(client, variantId, data) {
        return client.setAsync(`package_variant_${variantId}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getVariantDetails(client, variantId) {
        return client.getAsync(`package_variant_${variantId}`);
    }

    static setEmiVariantOfPackage(client, variantId, data) {
        return client.setAsync(`package_emi_variant_${variantId}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getEmiVariantOfPackage(client, variantId) {
        return client.getAsync(`package_emi_variant_${variantId}`);
    }

    static setDefaultVariantFromAssortmentId(client, assortmentId, data) {
        return client.setAsync(`assortment_price_details_${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 12);
    }

    static getDefaultVariantFromAssortmentId(client, assortmentId) {
        return client.getAsync(`assortment_price_details_${assortmentId}`);
    }

    static setDefaultVariantFromAssortmentIdHome(client, assortmentId, data) {
        return client.setAsync(`assortment_price_details_home1_${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 2);
    }

    static getDefaultVariantFromAssortmentIdHome(client, assortmentId) {
        return client.getAsync(`assortment_price_details_home1_${assortmentId}`);
    }

    static setDefaultVariantFromAssortmentReferral(client, assortmentId, data) {
        return client.setAsync(`assortment_price_details_referral_${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 2);
    }

    static getDefaultVariantFromAssortmentReferral(client, assortmentId) {
        return client.getAsync(`assortment_price_details_referral_${assortmentId}`);
    }

    static setDefaultVariantFromAssortmentAutosalesCampaign(client, assortmentId, data) {
        return client.setAsync(`${keys.assortment_price_details_autosales_campaign}:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 2);
    }

    static getDefaultVariantFromAssortmentAutosalesCampaign(client, assortmentId) {
        return client.getAsync(`${keys.assortment_price_details_autosales_campaign}:${assortmentId}`);
    }

    static setAllVariantFromAssortmentIdHome(client, assortmentId, keyID, data) {
        return client.setAsync(`assortment_price_details_by_flagrkey_${assortmentId}_${keyID}`, JSON.stringify(data), 'Ex', 60 * 60 * 12);
    }

    static getAllVariantFromAssortmentIdHome(client, assortmentId, keyID) {
        return client.getAsync(`assortment_price_details_by_flagrkey_${assortmentId}_${keyID}`);
    }

    static setChildAssortments(client, assortmentId, data) {
        return client.setAsync(`course_child_assortment_${assortmentId}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getChildAssortments(client, assortmentId) {
        return client.getAsync(`course_child_assortment_${assortmentId}`);
    }

    static setChildAssortmentsFromParent(client, assortmentId, data) {
        return client.setAsync(`course_child_assortments_${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 30);
    }

    static getChildAssortmentsFromParent(client, assortmentId) {
        return client.getAsync(`course_child_assortments_${assortmentId}`);
    }

    static setResourceDetailsFromAssortmentId(client, assortmentId, offset, subject, studentClass, batchID, data) {
        return client.setAsync(`course_recent_classes_${assortmentId}_${offset}_${subject}_${studentClass}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 30);
    }

    static getResourceDetailsFromAssortmentId(client, assortmentId, offset, subject, studentClass, batchID) {
        return client.getAsync(`course_recent_classes_${assortmentId}_${offset}_${subject}_${studentClass}_${batchID}`);
    }

    static deleteResourceDetailsFromAssortmentId(client, assortmentId) {
        return client.getAsync(`course_recent_classes_${assortmentId}_*`);
    }

    static setUpcomingResourceDetailsFromAssortmentId(client, assortmentId, offset, subject, studentClass, batchID, data) {
        return client.setAsync(`course_upcoming_classes_${assortmentId}_${offset}_${subject}_${studentClass}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 30);
    }

    static getUpcomingResourceDetailsFromAssortmentId(client, assortmentId, offset, subject, studentClass, batchID) {
        return client.getAsync(`course_upcoming_classes_${assortmentId}_${offset}_${subject}_${studentClass}_${batchID}`);
    }

    static setAllAssortments(client, assortmentList, _studentClass, data) {
        return client.setAsync(`course_all_assortments_${assortmentList}`, JSON.stringify(data), 'Ex', 60 * 30);
    }

    // eslint-disable-next-line no-unused-vars
    static getAllAssortments(client, assortmentList, studentClass) {
        return client.getAsync(`course_all_assortments_${assortmentList}`);
    }

    static setRecentCorrectAnswer(client, courseID, studentID, date, data) {
        return client.setAsync(`course_recent_correct_answer_${courseID}_${studentID}_${date}`, data, 'Ex', 60 * 60 * 24);
    }

    static getRecentCorrectAnswer(client, courseID, studentID, date) {
        return client.getAsync(`course_recent_correct_answer_${courseID}_${studentID}_${date}`);
    }

    static setNotesFromAssortmentId(client, assortmentId, offset, subject, notesType, studentClass, data) {
        return client.setAsync(`course_notes_${assortmentId}_${offset}_${subject}_${notesType}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 5);
    }

    static getNotesFromAssortmentId(client, assortmentId, offset, subject, notesType, studentClass) {
        return client.getAsync(`course_notes_${assortmentId}_${offset}_${subject}_${notesType}_${studentClass}`);
    }

    static setUserEmiPackages(client, studentID, data) {
        return client.setAsync(`user_emi_reminder_data_${studentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getUserEmiPackages(client, studentID) {
        return client.getAsync(`user_emi_reminder_data_${studentID}`);
    }

    static setPerviosContestWinner(client, date, data) {
        return client.setAsync(`previous_winner_list_data__${date}`, JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getPerviosContestWinner(client, date) {
        return client.getAsync(`previous_winner_list_data__${date}`);
    }

    static deleteUserEmiPackages(client, studentID) {
        return client.delAsync(`user_emi_reminder_data_${studentID}`);
    }

    static setChildAssortmentsByResourceType(client, category, studentClass, resourceTypes, subject, free, sort, offset, data) {
        return client.setAsync(`course_child_resource_assortment_${category}_${studentClass}_${resourceTypes}_${subject}_${free}_${sort}_${offset}`, JSON.stringify(data), 'Ex', 60 * 30);
    }

    static getChildAssortmentsByResourceType(client, category, studentClass, resourceTypes, subject, free, sort, offset) {
        return client.getAsync(`course_child_resource_assortment_${category}_${studentClass}_${resourceTypes}_${subject}_${free}_${sort}_${offset}`);
    }

    static setLivestreamDetails(client, resourceReference, data) {
        return client.setAsync(`course_class_status:${resourceReference}`, JSON.stringify(data), 'Ex', hashExpiryHourly);
    }

    static getLivestreamDetails(client, resourceReference) {
        return client.getAsync(`course_class_status:${resourceReference}`);
    }

    static setLiveSectionFromAssortmentHome(client, parentAssortmentID, _studentClass, subject, batchID, data) {
        return client.setAsync(`course_live_section_home:${parentAssortmentID}_${subject}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 minute
    }

    static getLiveSectionFromAssortmentHome(client, parentAssortmentID, _studentClass, subject, batchID) {
        return client.getAsync(`course_live_section_home:${parentAssortmentID}_${subject}_${batchID}`);
    }

    static setLiveSectionFromAssortment(client, parentAssortmentID, studentClass, subject, batchID, data) {
        return client.setAsync(`course_live_section_detail_page:${parentAssortmentID}_${studentClass}_${subject}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 2); // 2 minute
    }

    static getLiveSectionFromAssortment(client, parentAssortmentID, studentClass, subject, batchID) {
        return client.getAsync(`course_live_section_detail_page:${parentAssortmentID}_${studentClass}_${subject}_${batchID}`);
    }

    static setSubjectsList(client, parentAssortmentID, studentClass, data) {
        return client.setAsync(`course_subject_list:${parentAssortmentID}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 3);
    }

    static getSubjectsList(client, parentAssortmentID, studentClass) {
        return client.getAsync(`course_subject_list:${parentAssortmentID}_${studentClass}`);
    }

    static setCheckNextEmiPaid(client, studentId, newPackageID, data) {
        return client.setAsync(`course_next_user_emi:${studentId}_${newPackageID}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 minute
    }

    static checkNextEmiPaid(client, studentId, newPackageID) {
        return client.getAsync(`course_next_user_emi:${studentId}_${newPackageID}`);
    }

    static setAllAssortments2(client, assortmentID, data) {
        return client.setAsync(`course_all_assortments:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 minute
    }

    static getAllAssortments2(client, assortmentID) {
        return client.getAsync(`course_all_assortments:${assortmentID}`);
    }

    static setUserActivePackages(client, studentID, data) {
        return client.setAsync(`user_active_packages:${studentID}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 minute
    }

    static getUserActivePackages(client, studentID) {
        return client.getAsync(`user_active_packages:${studentID}`);
    }

    static setUserExpiredPackages(client, studentID, data) {
        return client.setAsync(`${keys.userExpiredPackages}:${studentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 5); // 5 minute
    }

    static getUserExpiredPackages(client, studentID) {
        return client.getAsync(`${keys.userExpiredPackages}:${studentID}`);
    }

    static setUserExpiredPackagesIncludingTrial(client, studentID, data) {
        return client.setAsync(`${keys.userExpiredPackagesIncludingTrial}:${studentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 10); // 10 minute
    }

    static getUserExpiredPackagesIncludingTrial(client, studentID) {
        return client.getAsync(`${keys.userExpiredPackagesIncludingTrial}:${studentID}`);
    }

    static setUserAllPurchasedPackages(client, studentID, data) {
        return client.setAsync(`user_all_purchased_packages:${studentID}`, JSON.stringify(data), 'Ex', 60 * 5); // 5 minutes
    }

    static getUserAllPurchasedPackages(client, studentID) {
        return client.getAsync(`user_all_purchased_packages:${studentID}`);
    }

    static deleteUserActivePackages(client, studentID) {
        return Promise.all([client.delAsync(`user_active_packages:${studentID}`), client.delAsync(`user_active_assortments:${studentID}`)]);
    }

    static setNotesByQuestionID(client, questionID, data) {
        return client.setAsync(`course_notes:${questionID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getNotesByQuestionID(client, questionID) {
        return client.getAsync(`course_notes:${questionID}`);
    }

    static setHomeworkByQuestionID(client, questionID, data) {
        return client.setAsync(`course_homework::${questionID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getHomeworkByQuestionID(client, questionID) {
        return client.getAsync(`course_homework::${questionID}`);
    }

    static setHomeworkByQuestionIDNew(client, questionID, data) {
        return client.setAsync(`course_homework_new::${questionID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getHomeworkByQuestionIDNew(client, questionID) {
        return client.getAsync(`course_homework_new::${questionID}`);
    }

    static setHomeworkByQuestionIDWithBatchCheck(client, questionID, data) {
        return client.setAsync(`course_homework_with_batch::${questionID}`, JSON.stringify(data), 'Ex', 60 * 60); // 2 hours
    }

    static getHomeworkByQuestionIDWithBatchCheck(client, questionID) {
        return client.getAsync(`course_homework_with_batch::${questionID}`);
    }

    static setHomeworkQuestionDetails(client, questionIdList, data) {
        return client.setAsync(`course_homework_details:${questionIdList}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getHomeworkQuestionDetails(client, questionIdList) {
        return client.getAsync(`course_homework_details:${questionIdList}`);
    }

    static setAssortments(client, assortmentID, size, offset, data) {
        return client.setAsync(`course_homework_assortments:${assortmentID}_${size}_${offset}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getAssortments(client, assortmentID, size, offset) {
        return client.getAsync(`course_homework_assortments:${assortmentID}_${size}_${offset}`);
    }

    static setFullHomeworkResponse(client, studentID, data) {
        return client.setAsync(`course_homework_response:${studentID}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getFullHomeworkResponse(client, studentID) {
        return client.getAsync(`course_homework_response:${studentID}`);
    }

    static deleteFullHomeworkResponse(client, studentID) {
        return client.delAsync(`course_homework_response:${studentID}`);
    }

    static setHomeworkByAssortmentID(client, assortmentID, limit, offset, subject, batchID, data) {
        return client.setAsync(`course_homework_homepage:${assortmentID}_${limit}_${offset}_${subject}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 min
    }

    static getHomeworkByAssortmentID(client, assortmentID, limit, offset, subject, batchID) {
        return client.getAsync(`course_homework_homepage:${assortmentID}_${limit}_${offset}_${subject}_${batchID}`);
    }

    static setHomeworkByAssortmentIDHomepage(client, assortmentID, batchID, limit, offset, data) {
        return client.setAsync(`course_homework_homepage_new:${assortmentID}_${batchID}_${limit}_${offset}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 min
    }

    static getHomeworkByAssortmentIDHomepage(client, assortmentID, batchID, limit, offset) {
        return client.getAsync(`course_homework_homepage_new:${assortmentID}_${batchID}_${limit}_${offset}`);
    }

    static setResourcesCountFromAssortment(client, assortmentID, batchID, data) {
        return client.setAsync(`course_resource_count:${assortmentID}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static getResourcesCountFromAssortment(client, assortmentID, batchID) {
        return client.getAsync(`course_resource_count:${assortmentID}_${batchID}`);
    }

    static getRecentLecturesByClass(client, studentClass, category, ccmTitle) {
        return client.getAsync(`course_recent_lectures_home:${studentClass}_${category}_${ccmTitle}`);
    }

    static setRecentLecturesByClass(client, studentClass, category, ccmTitle, data) {
        return client.setAsync(`course_recent_lectures_home:${studentClass}_${category}_${ccmTitle}`, JSON.stringify(data), 'Ex', 60 * 15); // 15 minute
    }

    static getOnboardingItems(client, studentLocale, sessionCount) {
        return client.getAsync(`onboarding_items:${studentLocale}_${sessionCount}`);
    }

    static setOnboardingItems(client, studentLocale, sessionCount, data) {
        return client.setAsync(`onboarding_items:${studentLocale}_${sessionCount}`, JSON.stringify(data), 'Ex', 60 * 60 * 3); // 3 hours
    }

    static getTG(client, tgID) {
        return client.getAsync(`target_group_info_${tgID}`);
    }

    static setTG(client, tgID, data) {
        return client.setAsync(`target_group_info_${tgID}`, JSON.stringify(data), 'Ex', 60); // 1 min
    }

    static getDailyAdsLimit(client) {
        return client.getAsync('daily_ads_limit');
    }

    static setDailyAdsLimit(client, data) {
        return client.setAsync('daily_ads_limit', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static getAdsPlayArray(client) {
        return client.getAsync('daily_ads_array');
    }

    static setAdsPlayArray(client, data) {
        return client.setAsync('daily_ads_array', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static getvideoViewExperiment(client) {
        return client.getAsync('video_view_experiment');
    }

    static setvideoViewExperiment(client, data) {
        return client.setAsync('video_view_experiment', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static setpaymentPendingDetails(client, studentId, data) {
        return client.setAsync(`payment_pending:${studentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 30); // 30 days
    }

    static getpaymentPendingDetails(client, studentId) {
        return client.getAsync(`payment_pending:${studentId}`);
    }

    static setCallingCardWidgetData(client, studentId, data) {
        return client.setAsync(`${keys.callingCard}${studentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 3); // 3 days;
    }

    static getCallingCardWidgetData(client, studentId) {
        return client.getAsync(`${keys.callingCard}${studentId}`);
    }

    static setCallingCardDismissData(client, studentId, assortmentId) {
        return client.setAsync(`calling_card_dismiss:${studentId}:${assortmentId}`, '1', 'Ex', 60 * 60 * 24); // 1 days;
    }

    static getCallingCardDismissData(client, studentId, assortmentId) {
        return client.getAsync(`calling_card_dismiss:${studentId}:${assortmentId}`);
    }

    static deletepaymentPendingDetails(client, studentId) {
        return client.delAsync(`payment_pending:${studentId}`);
    }

    static setCourseDetailsFromVariantId(client, variantId, data) {
        return client.setAsync(`package_info_by_variantId:${variantId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static getCourseDetailsFromVariantId(client, variantId) {
        return client.getAsync(`package_info_by_variantId:${variantId}`);
    }

    static getLiveNowLecturesByClass(client, studentClass) {
        return client.getAsync(`course_live_lectures_home:${studentClass}}`);
    }

    static getBooksBySubjectClassAndLocale(client, studentClass, subject, locale) {
        return client.getAsync(`books_for_homepage_icon:${studentClass}:${subject}:${locale}`);
    }

    static setPreviousYearBooksByCcmId(client, ccmArray, page, studentClass, data) {
        if ((Number(studentClass) >= 6 && Number(studentClass) <= 10) || Number(studentClass) === 14) {
            return client.setAsync(`previous_year_for_homepage_by_class:${studentClass}:${page}`, JSON.stringify(data), 'Ex', 5 * 60 * 1);// 5 minutes
        }
        return client.setAsync(`previous_year_for_homepage:${ccmArray.join()}:${page}`, JSON.stringify(data), 'Ex', 5 * 60 * 1);// 5 minutes
    }

    static getPreviousYearBooksByCcmId(client, ccmArray, page, studentClass) {
        if ((Number(studentClass) >= 6 && Number(studentClass) <= 10) || Number(studentClass) === 14) {
            return client.getAsync(`previous_year_for_homepage_by_class:${studentClass}:${page}`);// 5 minutes
        }
        return client.getAsync(`previous_year_for_homepage:${ccmArray.join()}:${page}`);// 5 minutes
    }

    static setBooksByCcmId(client, ccmArray, subject, locale, page, data, studentClass) {
        return client.setAsync(`books_for_homepage_icon:${subject}:${locale}:${ccmArray.join()}:${page}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 15); // 15 minutes
    }

    static getBooksByCcmId(client, ccmArray, subject, locale, page, studentClass) {
        return client.getAsync(`books_for_homepage_icon:${subject}:${locale}:${ccmArray.join()}:${page}:${studentClass}`);
    }

    static setLiveNowLecturesByClass(client, studentClass, data) {
        return client.setAsync(`course_live_lectures_home:${studentClass}}`, JSON.stringify(data), 'Ex', 60 * 1); // 1 minute
    }

    static getReplayLecturesByClass(client, studentClass) {
        return client.getAsync(`course_replay_lectures_home:${studentClass}}`);
    }

    static setReplayLecturesByClass(client, studentClass, data) {
        return client.setAsync(`course_replay_lectures_home:${studentClass}}`, JSON.stringify(data), 'Ex', 60 * 1); // 1 minute
    }

    static getUpcomingLecturesByClass(client, studentClass) {
        return client.getAsync(`course_upcoming_lectures_home:${studentClass}}`);
    }

    static setUpcomingLecturesByClass(client, studentClass, data) {
        return client.setAsync(`course_upcoming_lectures_home:${studentClass}}`, JSON.stringify(data), 'Ex', 60 * 2); // 2 minute
    }

    static getDistinctNotesType(client, assortmentID) {
        return client.getAsync(`course_notes_filters:${assortmentID}`);
    }

    static setDistinctNotesType(client, assortmentID, data) {
        return client.setAsync(`course_notes_filters:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static setDistinctSubjectByLocaleClass(client, studentClass, locale, data) {
        return client.setAsync(`TOP_FREE_CLASSES_DISTINCT_SUBJECTS:${locale}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 6);
    }

    static getDistinctSubjectByLocaleClass(client, studentClass, locale) {
        return client.getAsync(`TOP_FREE_CLASSES_DISTINCT_SUBJECTS:${locale}:${studentClass}`);
    }

    static setTopFreeClassesBySubjectClassLocale(client, studentClass, studentLocale, subject, data) {
        return client.setAsync(`TOP_FREE_CLASSES:${studentClass}:${studentLocale}:${subject}`, JSON.stringify(data), 'Ex', 60 * 60 * 6);
    }

    static getTopFreeClassesBySubjectClassLocale(client, studentClass, studentLocale, subject) {
        return client.getAsync(`TOP_FREE_CLASSES:${studentClass}:${studentLocale}:${subject}`);
    }

    static getDemoVideoExperiment(client, assortmentID) {
        return client.getAsync(`${keys.course_demo_video}:${assortmentID}`);
    }

    static setDemoVideoExperiment(client, assortmentID, data) {
        return client.setAsync(`${keys.course_demo_video}:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static getPaidCoursesExcludingUsersPurchased(client, assortmentID) {
        return client.getAsync(`course_etoos_homepage:${assortmentID}`);
    }

    static setPaidCoursesExcludingUsersPurchased(client, assortmentID, data) {
        return client.setAsync(`course_etoos_homepage:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // 1 hr
    }

    static getAssortmentDataForExploreCarousel(client, carouselID) {
        return client.getAsync(`explore_page_caoursel_data:${carouselID}`);
    }

    static setAssortmentDataForExploreCarousel(client, carouselID, data) {
        return client.setAsync(`explore_page_caoursel_data:${carouselID}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // 1 hr
    }

    static getFreeResourceDetailsFromAssortmentId(client, assortmentId) {
        return client.getAsync(`free_videos_by_assortment:${assortmentId}`);
    }

    static setFreeResourceDetailsFromAssortmentId(client, assortmentId, data) {
        return client.setAsync(`free_videos_by_assortment:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 12); // 12 hr
    }

    static getPostPurchaseExplainer(client, studentID) {
        return client.hgetAsync(`${keys.userProfileData}:${studentID}`, 'POST_PURCHASE_EXPLAINER_VIDEO');
    }

    static setPostPurchaseExplainer(client, studentID, explainerArray) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentID}`, 'POST_PURCHASE_EXPLAINER_VIDEO', JSON.stringify(explainerArray))
            .expire(`${keys.userProfileData}:${studentID}`, hashExpiryHourly * 24 * 30)
            .execAsync();
    }

    static getPlaylistForEtoos(client, studentID) {
        return client.hgetAsync(`${keys.userProfileData}:${studentID}`, 'STUDENT_ETOOS_PLAYLIST');
    }

    static setPlaylistForEtoos(client, studentID, assortmentList) {
        return client.multi()
            .hset(`${keys.userProfileData}:${studentID}`, 'STUDENT_ETOOS_PLAYLIST', JSON.stringify(assortmentList))
            .expire(`${keys.userProfileData}:${studentID}`, hashExpiryHourly * 24 * 30)
            .execAsync();
    }

    static getCoursesClassCourseMapping(client, studentId) {
        return client.getAsync(`courses_class_course_mapping:${studentId}`);
    }

    static setCoursesClassCourseMapping(client, studentId, data) {
        return client.setAsync(`courses_class_course_mapping:${studentId}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 Minutes
    }

    static getCoursesForHomepageByCategory(client, studentClass, studentLocale) {
        return client.getAsync(`home_page_courses_by_categories:${studentClass}:${studentLocale}`);
    }

    static setCoursesForHomepageByCategory(client, studentClass, studentLocale, data) {
        return client.setAsync(`home_page_courses_by_categories:${studentClass}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 60 * 3); // 30 Minutes
    }

    static getCoursesForHomepageIcons(client, studentClass, category, studentLocale) {
        return client.getAsync(`homepage_courses_for_icon:${studentClass}:${category.join()}:${studentLocale}`);
    }

    static setCoursesForHomepageIcons(client, studentClass, category, studentLocale, data) {
        return client.setAsync(`homepage_courses_for_icon:${studentClass}:${category.join()}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 30); // 30 Minutes
    }

    static getCategoriesByCcmId(client, ccmArray) {
        return client.getAsync(`category_of_ccm_id:${ccmArray.join()}`);
    }

    static setCategoriesByCcmId(client, ccmArray, data) {
        return client.setAsync(`category_of_ccm_id:${ccmArray.join()}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getFreeCourseByCcmId(client, ccmArray, locale) {
        return client.getAsync(`free_courses:${ccmArray.join()}:${locale}`);
    }

    static setFreeCourseByCcmId(client, ccmArray, locale, data) {
        return client.setAsync(`free_courses:${ccmArray.join()}:${locale}`, JSON.stringify(data), 'Ex', 60 * 60); // 1 hour
    }

    static getUserActivePackagesByClass(client, studentID, studentClass) {
        return client.getAsync(`user_active_packages:${studentID}:${studentClass}`);
    }

    static setUserActivePackagesByClass(client, studentID, studentClass, data) {
        return client.setAsync(`user_active_packages:${studentID}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 5); // * 5 Minutes
    }

    static setNewUserInterval(client, data) {
        return client.setAsync('new_user_interval', JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static getNewUserInterval(client) {
        return client.getAsync('new_user_interval');
    }

    static getChapterListOfAssortmentVodWithoutOffset(client, assortmentID) {
        return client.getAsync(`chapter_assortments_vod:${assortmentID}`);
    }

    static setChapterListOfAssortmentVodWithoutOffset(client, assortmentID, data) {
        return client.setAsync(`chapter_assortments_vod:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 Day
    }

    static getChapterListOfAssortmentWithoutOffset(client, assortmentID) {
        return client.getAsync(`chapter_assortments:${assortmentID}`);
    }

    static setChapterListOfAssortmentWithoutOffset(client, assortmentID, data) {
        return client.setAsync(`chapter_assortments:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 Day
    }

    static getStudentAssortmentProgress(client, studentID, assortmentID) {
        return client.getAsync(`STUDENT_ASSORTMENT_PROGRESS:${studentID}:${assortmentID}`);
    }

    static setStudentAssortmentProgress(client, studentID, assortmentID, data) {
        return client.setAsync(`STUDENT_ASSORTMENT_PROGRESS:${studentID}:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 2); // * 2 Hours
    }

    static getWidgetMyCoursesDetails(client, studentID, assortmentID) {
        return client.getAsync(`WIDGET_MY_COURSES:${studentID}:${assortmentID}`);
    }

    static setWidgetMyCoursesDetails(client, studentID, assortmentID, data) {
        return client.setAsync(`WIDGET_MY_COURSES:${studentID}:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // * 1 Hour
    }

    static getStudentRecordFromBNBClickersTable(client, studentID) {
        return client.getAsync(`BNB_CLICKERS:STUDENT:${studentID}`);
    }

    static setStudentRecordFromBNBClickersTable(client, studentID, data) {
        return client.setAsync(`BNB_CLICKERS:STUDENT:${studentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 2); // * 2 hours
    }

    static getFiltersFromCourseDetails(client, filterClass) {
        return client.getAsync(`Category_page_filters:${filterClass}`);
    }

    static setFiltersFromCourseDetails(client, filterClass, data) {
        return client.setAsync(`Category_page_filters:${filterClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 2); // * 2 Days
    }

    static getFreeAssortmentsByCategory(client, category, studentClass) {
        return client.getAsync(`free_assortment_by_category:${category}_${studentClass}`);
    }

    static setFreeAssortmentsByCategory(client, category, studentClass, data) {
        return client.setAsync(`free_assortment_by_category:${category}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 1); // * 1 Day
    }

    static getCourseDetailsFromQuestionId(client, questionID) {
        return client.getAsync(`course_resource_detail_by_qid:${questionID}`);
    }

    static setCourseDetailsFromQuestionId(client, questionID, data) {
        return client.setAsync(`course_resource_detail_by_qid:${questionID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 1); // * 1 Day
    }

    static getBannersFromId(client, bannerId) {
        return client.getAsync(`ads_banner:${bannerId}`);
    }

    static setBannersFromId(client, bannerId, data) {
        return client.setAsync(`ads_banner:${bannerId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 Day
    }

    static getCourseAdDataQid(client, studentClass, subject) {
        return client.getAsync(`QID_ads:${studentClass}:${subject}`);
    }

    static setCourseAdDataQid(client, studentClass, subject, data) {
        return client.setAsync(`QID_ads:${studentClass}:${subject}`, JSON.stringify(data), 'Ex', 60 * 30); // * 30 min
    }

    static getCoursesList(client, category, studentClass) {
        return client.getAsync(`ads_course_list:${studentClass}:${category}`);
    }

    static setCoursesList(client, category, studentClass, data) {
        return client.setAsync(`ads_course_list:${studentClass}:${category}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 day
    }

    static getAssortmentSubject(client, courseAssortment, subject) {
        return client.getAsync(`ads_assortment_subject:${courseAssortment}:${subject}`);
    }

    static setAssortmentSubject(client, courseAssortment, subject, data) {
        return client.setAsync(`ads_assortment_subject:${courseAssortment}:${subject}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 day
    }

    static getDemoVideoSubject(client, assortmentID) {
        return client.getAsync(`${keys.subject_demo_video}:${assortmentID}`);
    }

    static setDemoVideoSubject(client, assortmentID, data) {
        return client.setAsync(`${keys.subject_demo_video}:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 24 hrs
    }

    static getLFAdData(client, studentClass, subject) {
        return client.getAsync(`LF_ads:${studentClass}:${subject}`);
    }

    static setLFAdData(client, studentClass, subject, data) {
        return client.setAsync(`LF_ads:${studentClass}:${subject}`, JSON.stringify(data), 'Ex', 60 * 30); // * 30 min
    }

    static getUserSachetWidgetDetails(client, studentID) {
        return client.getAsync(`USER_SACHET_HOMEPAGE_WIDGET:${studentID}`);
    }

    static setUserSachetWidgetDetails(client, studentID, data) {
        return client.setAsync(`USER_SACHET_HOMEPAGE_WIDGET:${studentID}`, JSON.stringify(data), 'Ex', 60 * 15); // * 15 minutes
    }

    static getCoursesForHomepageWeb(client) {
        return client.getAsync('COURSE_WEB');
    }

    static setCoursesForHomepageWeb(client, data) {
        return client.setAsync('COURSE_WEB', JSON.stringify(data), 'Ex', 60 * 60 * 24 * 1); // * 1 Day
    }

    static getCourseDetailsBranchDeeplinkFromAppDeeplink(client, assortmentId) {
        return client.getAsync(`BRANCH_COURSE_DETAILS_DEEPLINK:${assortmentId}`);
    }

    static getAutomatedReplyBranchDeeplinkFromAppDeeplink(client) {
        return client.getAsync('BRANCH_AUTOMATED_REPLY_DEEPLINK');
    }

    static setCourseDetailsBranchDeeplinkFromAppDeeplink(client, assortmentId, data) {
        return client.setAsync(`BRANCH_COURSE_DETAILS_DEEPLINK:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 7); // * 7 Days
    }

    static getCourseDetailInfoBranchDeeplinkFromAppDeeplink(client, assortmentId, subject) {
        return client.getAsync(`BRANCH_COURSE_DETAIL_INFO_DEEPLINK:${assortmentId}:${subject}`);
    }

    static setCourseDetailInfoBranchDeeplinkFromAppDeeplink(client, assortmentId, subject, data) {
        return client.setAsync(`BRANCH_COURSE_DETAIL_INFO_DEEPLINK:${assortmentId}:${subject}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 7); // * 7 Days
    }

    static setAutomatedReplyBranchDeeplinkFromAppDeeplink(client, data) {
        return client.setAsync('BRANCH_AUTOMATED_REPLY_DEEPLINK', JSON.stringify(data), 'Ex', 60 * 60 * 24 * 30); // * 30 Days
    }

    static getCoursesListForWeb(client, key) {
        return client.getAsync(`WEB_COURSES_LIST:${key}`);
    }

    static setCoursesListForWeb(client, key, data) {
        return client.setAsync(`WEB_COURSES_LIST:${key}`, JSON.stringify(data), 'Ex', 60 * 60 * 3); // * 3 Hours
    }

    static getScholarshipExams(client) {
        return client.getAsync('SCHOLARSHIP_EXAM_LIST');
    }

    static setScholarshipExams(client, data) {
        return client.setAsync('SCHOLARSHIP_EXAM_LIST', JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getScholarshipPopularCourseCoupon(client, assortmentId, couponCode) {
        return client.getAsync(`SCHOLARSHIP_COURSE_COUPON:${assortmentId}:${couponCode}`);
    }

    static setScholarshipPopularCourseCoupon(client, assortmentId, data, couponCode) {
        return client.setAsync(`SCHOLARSHIP_COURSE_COUPON:${assortmentId}:${couponCode}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getScholarshipPopularCourse(client, assortmentId) {
        return client.getAsync(`SCHOLARSHIP_COURSE:${assortmentId}`);
    }

    static setScholarshipPopularCourse(client, assortmentId, data) {
        return client.setAsync(`SCHOLARSHIP_COURSE:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getScholarshipLeaderByTest(client, testId) {
        return client.getAsync(`SCHOLARSHIP_LEADERBOARD:${testId}`);
    }

    static setScholarshipLeaderByTest(client, testId, data) {
        return client.setAsync(`SCHOLARSHIP_LEADERBOARD:${testId}`, JSON.stringify(data), 'Ex', 60 * 15); // * 15 min
    }

    static getScholarshipResultBanner(client, couponCode, locale) {
        return client.getAsync(`SCHOLARSHIP_DISCOUNT_BANNER:${couponCode}:${locale}`);
    }

    static setScholarshipResultBanner(client, couponCode, locale, data) {
        return client.setAsync(`SCHOLARSHIP_DISCOUNT_BANNER:${couponCode}:${locale}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getAppConfigurationContent(client, keyName) {
        return client.getAsync(`APP_CONFIGURATION:${keyName}`);
    }

    static setAppConfigurationContent(client, keyName, data) {
        return client.setAsync(`APP_CONFIGURATION:${keyName}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 24 Hours
    }

    static getScholarshipAppGeneralBanner(client, testId, locale, progress) {
        return client.getAsync(`SCHOLARSHIP_GENERAL_BANNER:${testId}:${progress}:${locale}`);
    }

    static setScholarshipAppGeneralBanner(client, testId, locale, progress, data) {
        return client.setAsync(`SCHOLARSHIP_GENERAL_BANNER:${testId}:${progress}:${locale}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getFlagrResp(client, experiment, studentId) {
        return client.getAsync(`flagr:${experiment}:${studentId}`);
    }

    static setFlagrResp(client, experiment, studentId, data) {
        return client.setAsync(`flagr:${experiment}:${studentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 2); // * 2 hour
    }

    static getFlagrRespWithClassVersionCode(client, experiment, studentId, studentClass, versionCode) {
        return client.getAsync(`flagr:${experiment}:${studentId}:${studentClass}:${versionCode}`);
    }

    static setFlagrRespWithClassVersionCode(client, experiment, studentId, studentClass, versionCode, data) {
        return client.setAsync(`flagr:${experiment}:${studentId}:${studentClass}:${versionCode}`, data, 'Ex', 60 * 60 * 2); // * 2 hour
    }

    static getOtherLanguageCourse(client, assortmentId) {
        return client.getAsync(`OTHER_LANG_COURSE:${assortmentId}`);
    }

    static setOtherLanguageCourse(client, assortmentId, data) {
        return client.setAsync(`OTHER_LANG_COURSE:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 24 hours
    }

    static getCourseChangeRequestData(client, studentId, assortmentId) {
        return client.getAsync(`course_change_request:${studentId}:${assortmentId}`);
    }

    static setCourseChangeRequestData(client, studentId, assortmentId) {
        return client.setAsync(`course_change_request:${studentId}:${assortmentId}`, '1', 'Ex', 60 * 60 * 25); // 25 hours;
    }

    static getLibraryDataCacheOnHomepage(client, studentId, studentClass) {
        return client.getAsync(`LIBRARY_DATA_HOMEPAGE:${studentId}:${studentClass}`);
    }

    static setLibraryDataCacheOnHomepage(client, studentId, studentClass, data) {
        return client.setAsync(`LIBRARY_DATA_HOMEPAGE:${studentId}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 10); // * 10 mins
    }

    static getPreviousYearPdf(client, ccmId) {
        return client.getAsync(`PREVIOUS_YEARS_PDF_${ccmId}`);
    }

    static getSamplePaperPdfData(client, ccmId) {
        return client.getAsync(`SAMPLE_PAPERS_PDF_${ccmId}`);
    }

    static getPreviousYearExamWisePdfData(client, ccmId) {
        return client.getAsync(`PREVIOUS_YEARS_PDF_EXAM_WISE_${ccmId}`);
    }

    static setCurrentAffairCarousel(client, studentId, studentLocale, data) {
        return client.setAsync(`CURRENT_AFFAIR_CAROUSEL_${studentId}_${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 10); // * 10 Minutes
    }

    static getCurrentAffairCarousel(client, studentId, studentLocale) {
        return client.getAsync(`CURRENT_AFFAIR_CAROUSEL_${studentId}_${studentLocale}`);
    }

    static getAllAssortmentsByQuestionId(client, questionID) {
        return client.getAsync(`all_course_assortments_by_qId:${questionID}`);
    }

    static setAllAssortmentsByQuestionId(client, questionID, data) {
        return client.setAsync(`all_course_assortments_by_qId:${questionID}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // * 1 hour
    }

    static getPastResourceDetailsFromAssortmentId(client, carouseID, batchID) {
        return client.getAsync(`explore_page_carousel_data:${carouseID}_${batchID}`);
    }

    static setPastResourceDetailsFromAssortmentId(client, carouseID, batchID, data) {
        return client.setAsync(`explore_page_carousel_data:${carouseID}_${batchID}`, JSON.stringify(data), 'Ex', 60 * 30); // * 30 mins
    }

    static getLastestBatchByAssortment(client, assortmentID) {
        return client.getAsync(`course_latest_batch_id:${assortmentID}`);
    }

    static setLastestBatchByAssortment(client, assortmentID, data) {
        return client.setAsync(`course_latest_batch_id:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 30); // * 30 mins
    }

    static setCourseLeaderboardWeekly(client, assortmentId, points, studentID) {
        client.multi()
            .zadd(`leaderboard:tests:weekly:${assortmentId}`, points, studentID)
            .expire(`leaderboard:tests:weekly:${assortmentId}`, 60 * 60 * 24 * 7)
            .execAsync();
    }

    static getCourseLeaderboardWeekly(client, assortmentId, min, max) {
        return client.zrevrangeAsync(`leaderboard:tests:weekly:${assortmentId}`, min, max, 'WITHSCORES');
    }

    static getUserCourseLeaderboardWeeklyRank(client, assortmentId, studentID) {
        return client.zrevrankAsync(`leaderboard:tests:weekly:${assortmentId}`, studentID);
    }

    static getUserCourseLeaderboardWeeklyScore(client, assortmentId, studentID) {
        return client.zscoreAsync(`leaderboard:tests:weekly:${assortmentId}`, studentID);
    }

    static setCourseLeaderboardMonthly(client, assortmentId, points, studentID) {
        client.multi()
            .zadd(`leaderboard:tests:monthly:${assortmentId}`, points, studentID)
            .expire(`leaderboard:tests:monthly:${assortmentId}`, 60 * 60 * 24 * 3)
            .execAsync();
    }

    static getCourseLeaderboardMonthly(client, assortmentId, min, max) {
        return client.zrevrangeAsync(`leaderboard:tests:monthly:${assortmentId}`, min, max, 'WITHSCORES');
    }

    static getUserCourseLeaderboardMonthlyRank(client, assortmentId, studentID) {
        return client.zrevrankAsync(`leaderboard:tests:monthly:${assortmentId}`, studentID);
    }

    static getUserCourseLeaderboardMonthlyScore(client, assortmentId, studentID) {
        return client.zscoreAsync(`leaderboard:tests:monthly:${assortmentId}`, studentID);
    }

    static setCourseLeaderboardAll(client, assortmentId, points, studentID) {
        client.multi()
            .zadd(`leaderboard:tests:all:${assortmentId}`, points, studentID)
            .expire(`leaderboard:tests:all:${assortmentId}`, 60 * 60 * 24 * 60)
            .execAsync();
    }

    static getCourseLeaderboardAll(client, assortmentId, min, max) {
        return client.zrevrangeAsync(`leaderboard:tests:all:${assortmentId}`, min, max, 'WITHSCORES');
    }

    static getUserCourseLeaderboardAllRank(client, assortmentId, studentID) {
        return client.zrevrankAsync(`leaderboard:tests:all:${assortmentId}`, studentID);
    }

    static getUserCourseLeaderboardAllScore(client, assortmentId, studentID) {
        return client.zscoreAsync(`leaderboard:tests:all:${assortmentId}`, studentID);
    }

    static setTestLeaderboard(client, testId, points, studentID) {
        client.multi()
            .zadd(`leaderboard:tests:${testId}`, points, studentID)
            .expireat(`leaderboard:tests:${testId}`, parseInt((+new Date()) / 1000) + 60 * 60 * 24 * 3)
            .execAsync();
    }

    static getTestLeaderboardAll(client, testId, min, max) {
        return client.zrevrangeAsync(`leaderboard:tests:${testId}`, min, max, 'WITHSCORES');
    }

    static getTestLeaderboardAllRank(client, testId, studentID) {
        return client.zrevrankAsync(`leaderboard:tests:${testId}`, studentID);
    }

    static getTestLeaderboardAllScore(client, testId, studentID) {
        return client.zscoreAsync(`leaderboard:tests:${testId}`, studentID);
    }

    static getEnrolledStudentsInCourse(client, assortmentID) {
        return client.getAsync(`course_enrolled_students:${assortmentID}`);
    }

    static setEnrolledStudentsInCourse(client, assortmentID, data) {
        return client.setAsync(`course_enrolled_students:${assortmentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 5); // * 5 hours
    }

    static getSubjectFiltersByEcm(client, ecmId, studentClass, course) {
        return client.getAsync(`course_subjects:${ecmId}:${studentClass}:${course}`);
    }

    static setSubjectFiltersByEcm(client, ecmId, studentClass, course, data) {
        return client.setAsync(`course_subjects:${ecmId}:${studentClass}:${course}`, JSON.stringify(data), 'Ex', 60 * 60 * 6); // * 6 hours
    }

    static setLiveSectionPastAndLive(client, courseID, courseType, subject, studentClass, data) {
        return client.setAsync(`course_livesection_past_live:${courseID}:${courseType}:${subject}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 15); // 15 min
    }

    static getLiveSectionPastAndLive(client, courseID, courseType, subject, studentClass) {
        return client.getAsync(`course_livesection_past_live:${courseID}:${courseType}:${subject}:${studentClass}`);
    }

    static setLiveSectionUpcoming(client, courseID, courseType, subject, studentClass, data) {
        return client.setAsync(`course_livesection_upcoming:${courseID}:${courseType}:${subject}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 15); // 15 min
    }

    static getLiveSectionUpcoming(client, courseID, courseType, subject, studentClass) {
        return client.getAsync(`course_livesection_upcoming:${courseID}:${courseType}:${subject}:${studentClass}`);
    }

    static getScholarshipAppStripBanner(client, testId, locale, progress) {
        return client.getAsync(`SCHOLARSHIP_STRIP_BANNER:${testId}:${progress}:${locale}`);
    }

    static setScholarshipAppStripBanner(client, testId, locale, progress, data) {
        return client.setAsync(`SCHOLARSHIP_STRIP_BANNER:${testId}:${progress}:${locale}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static setTrendingCourses(client, points, studentClass, category, expiry) {
        return client.multi()
            .zincrby(`course_trending:${studentClass}`, points, category)
            .expireat(`course_trending:${studentClass}`, parseInt((+new Date()) / 1000) + 60 * expiry)
            .execAsync();
    }

    static getTrendingCourses(client, studentClass) {
        return client.zrevrangeAsync(`course_trending:${studentClass}`, 0, 9);
    }

    static getScholarshipExamsOld(client) {
        return client.getAsync('SCHOLARSHIP_EXAM_LIST_OLD');
    }

    static setScholarshipExamsOld(client, data) {
        return client.setAsync('SCHOLARSHIP_EXAM_LIST_OLD', JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getScholarshipLeaderByTestSmall(client, testId) {
        return client.getAsync(`SCHOLARSHIP_LEADERBOARD_SMALL:${testId}`);
    }

    static setScholarshipLeaderByTestSmall(client, testId, data) {
        return client.setAsync(`SCHOLARSHIP_LEADERBOARD_SMALL:${testId}`, JSON.stringify(data), 'Ex', 60 * 15); // * 15 min
    }

    static getStudentIdTargetGroupCourseTag(client, targetGroupID, studentID) {
        return client.hgetAsync(`TARGET_GROUP_CRON:${targetGroupID}`, studentID);
    }

    static getCourseTargetGroupsForThumbnailTags(client, assortmentId) {
        return client.getAsync(`COURSE_THUMBNAIL_TAG:${assortmentId}`);
    }

    static setCourseTargetGroupsForThumbnailTags(client, assortmentId, data) {
        return client.setAsync(`COURSE_THUMBNAIL_TAG:${assortmentId}`, JSON.stringify(data), 'Ex', 60 * 60 * 6); // * 6 hours
    }

    static getContineBuyingCoursesData(client, studentID) {
        return client.getAsync(`${keys.courseContinueBuying}:${studentID}`);
    }

    static setContineBuyingCoursesData(client, studentID, data) {
        return client.setAsync(`${keys.courseContinueBuying}:${studentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 4); // * 4 days
    }

    static getPrePurchaseCourseHighlights(client, assortmentId, locale, limit) {
        return client.getAsync(`course_pre_purchase_highlights:${assortmentId}_${locale}_${limit}`);
    }

    static setPrePurchaseCourseHighlights(client, assortmentId, locale, limit, data) {
        return client.setAsync(`course_pre_purchase_highlights:${assortmentId}_${locale}_${limit}`, JSON.stringify(data), 'Ex', 60 * 60 * 6); // * 6 hours
    }

    static getBatchDetailsByAssortment(client, assortmentId, batchId) {
        return client.getAsync(`COURSE_BATCH_DETAILS:${assortmentId}:${batchId}`);
    }

    static setBatchDetailsByAssortment(client, assortmentId, batchId, data) {
        return client.setAsync(`COURSE_BATCH_DETAILS:${assortmentId}:${batchId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 24 hours
    }

    static getLiveClassesByAssortmentID(client, assortmentId, batchId) {
        return client.getAsync(`course_live_section:${assortmentId}:${batchId}`);
    }

    static setLatestLauncedCourses(client, studentClass, locale, data) {
        return client.setAsync(`course_latest_launches:${studentClass}:${locale}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 24 hours
    }

    static getLatestLauncedCourses(client, studentClass, locale) {
        return client.getAsync(`course_latest_launches:${studentClass}:${locale}`);
    }

    static getScholarshipWebBanner(client, testId, progress, locale) {
        return client.getAsync(`SCHOLARSHIP_WEB_BANNER:${testId}:${progress}:${locale}`);
    }

    static setScholarshipWebBanner(client, testId, progress, locale, data) {
        return client.setAsync(`SCHOLARSHIP_WEB_BANNER:${testId}:${progress}:${locale}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getScholarshipViewAll(client, coupon) {
        return client.getAsync(`SCHOLARSHIP_VIEW_ALL_BUTTON:${coupon}`);
    }

    static setScholarshipViewAll(client, coupon, data) {
        return client.setAsync(`SCHOLARSHIP_VIEW_ALL_BUTTON:${coupon}`, JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getUserWatchedTopicsFromSRP(client, studentID) {
        return client.getAsync(`user_watched_topic_srp:${studentID}`);
    }

    static setUserWatchedTopicsFromSRP(client, studentID, data) {
        return client.setAsync(`user_watched_topic_srp:${studentID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 30); // * 30 days
    }

    static getChapterRelatedVideosFromResourceID(client, questionID) {
        return client.getAsync(`course_chapter_carousel:${questionID}`);
    }

    static setChapterRelatedVideosFromResourceID(client, questionID, data) {
        return client.setAsync(`course_chapter_carousel:${questionID}`, JSON.stringify(data), 'Ex', 60 * 60 * 24 * 5); // 5 days
    }

    static getLastDNST(client) {
        return client.getAsync('SCHOLARSHIP_LAST_DNST');
    }

    static setLastDNST(client, data) {
        return client.setAsync('SCHOLARSHIP_LAST_DNST', JSON.stringify(data), 'Ex', 60 * 60); // * 60 min
    }

    static getPastVideoResourcesOfChapter(client, assortmentId, batchID, subject) {
        return client.getAsync(`course_all_classes:${assortmentId}_${batchID}_${subject}`);
    }

    static setPastVideoResourcesOfChapter(client, assortmentId, batchID, subject, data) {
        return client.setAsync(`course_all_classes:${assortmentId}_${batchID}_${subject}`, JSON.stringify(data), 'Ex', 60 * 60 * 2); // * 2 hrs
    }

    static getParentAssortmentListV1(client, assortmentId, studentClass) {
        return client.getAsync(`parent_assortments_of_video_assortment:${assortmentId}_${studentClass}`);
    }

    static setParentAssortmentListV1(client, assortmentId, studentClass, data) {
        return client.setAsync(`parent_assortments_of_video_assortment:${assortmentId}_${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 12); // * 12 hrs
    }

    static getLibraryObjects(client, libraryPlaylistId) {
        return client.getAsync(`TOP_TEACHERS_PLAYLIST:${libraryPlaylistId}`);
    }

    static getParentPlaylistId(client, studentLocale, ccmId) {
        return client.getAsync(`TOP_TEACHERS_PLAYLIST_ID:${studentLocale}:${ccmId}`);
    }

    static setParentPlaylistId(client, studentLocale, ccmId, data) {
        return client.setAsync(`TOP_TEACHERS_PLAYLIST_ID:${studentLocale}:${ccmId}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 Days
    }

    static getParentPlaylistIdByClass(client, studentClass, studentLocale) {
        return client.getAsync(`TOP_TEACHERS_PLAYLIST_ID_CLASS:${studentClass}:${studentLocale}`);
    }

    static setParentPlaylistIdByClass(client, studentClass, studentLocale, data) {
        return client.setAsync(`TOP_TEACHERS_PLAYLIST_ID_CLASS:${studentClass}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // * 1 Days
    }

    static getFreeLiveClassCaraousel(client, stClass, locale, versionCode, page, limit) {
        return client.getAsync(`LIVE_CLASS_FREE_CARAOUSEL_${stClass}_${locale}_${versionCode}_${page}_${limit}`);
    }

    static setFreeLiveClassCaraousel(client, stClass, locale, versionCode, page, limit, data) {
        return client.setAsync(`LIVE_CLASS_FREE_CARAOUSEL_${stClass}_${locale}_${versionCode}_${page}_${limit}`, JSON.stringify(data), 'Ex', 60 * 60 * 4); // * 4 hrs
    }

    static getFreeAssortmentListData(client, key) {
        return client.getAsync(`${key}`);
    }

    static setFreeAssortmentListData(client, key, data) {
        return client.setAsync(`${key}`, JSON.stringify(data), 'Ex', 60 * 60 * 4); // * 4 hrs
    }

    static getRedisDataUsingKey(client, key) {
        return client.getAsync(`${key}`);
    }

    static setRedisDataUsingKey(client, key, data) {
        return client.setAsync(`${key}`, JSON.stringify(data), 'Ex', 60 * 60 * 4); // * 4 hrs
    }

    static getFacultyPriorityByClassAndLocale(client, studentClass, studentLocale) {
        return client.getAsync(`liveclass_faculty_ordering:${studentClass}:${studentLocale}`);
    }

    static setFacultyPriorityByClassAndLocale(client, studentClass, studentLocale, data) {
        return client.setAsync(`liveclass_faculty_ordering:${studentClass}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static setSubjectAssortmentByQid(client, data, qId) {
        return client.setAsync(`LF_DATA_${qId}`, JSON.stringify(data), 'Ex', 60 * 60 * 2);
    }

    static getSubjectAssortmentByQid(client, qId) {
        return client.getAsync(`LF_DATA_${qId}`);
    }

    static setPracticeEnglishBottomsheetData(client, data) {
        return client.setAsync('practice_english_bottomsheet_data', JSON.stringify(data), 'Ex', 60 * 60 * 24);
    }

    static getPracticeEnglishBottomsheetData(client) {
        return client.getAsync('practice_english_bottomsheet_data');
    }

    static setClassLocaleAssortments(client, data, studentClass, studentLocale) {
        return client.setAsync(`CLASS_LOCALE:${studentClass}:${studentLocale}`, JSON.stringify(data), 'Ex', 60 * 60 * 12); // 12 hours
    }

    static getClassLocaleAssortments(client, studentClass, studentLocale) {
        return client.getAsync(`CLASS_LOCALE:${studentClass}:${studentLocale}`);
    }

    static getSubjectsListWithTeachersByCourseAssortment(client, courseAssortment) {
        return client.getAsync(`SUBJECTS_LIST_FREE_CLASS_VIDEO_PAGE:${courseAssortment}`);
    }

    static setSubjectsListWithTeachersByCourseAssortment(client, data, courseAssortment) {
        return client.setAsync(`SUBJECTS_LIST_FREE_CLASS_VIDEO_PAGE:${courseAssortment}`, JSON.stringify(data), 'Ex', 60 * 60 * 24); // 1 day
    }

    static setTopFreeClassesBySubjectClassLocaleChapter(client, subject, classId, locale, chapter, data) {
        return client.setAsync(`TOP_FREE_CLASSES_SCLC:${subject}:${classId}:${locale}:${chapter}`, JSON.stringify(data), 'Ex', 60 * 60 * 6); // 6 hours
    }

    static getTopFreeClassesBySubjectClassLocaleChapter(client, subject, classId, locale, chapter) {
        return client.getAsync(`TOP_FREE_CLASSES_SCLC:${subject}:${classId}:${locale}:${chapter}`);
    }

    static getDataByKey(client, key) {
        return client.getAsync(key);
    }

    static setDataByKey(client, key, data, exTime) {
        return client.setAsync(key, JSON.stringify(data), 'Ex', exTime);
    }

    static getAssortmentPriceMapping(client, assortment) {
        return client.getAsync(`ASSORTMENT_MAPPING_${assortment}`);
    }

    static setAssortmentPriceMapping(client, assortmentPriceMapping) {
        for (const key of Object.keys(assortmentPriceMapping)) {
            client.setAsync(`ASSORTMENT_MAPPING_${key}`, JSON.stringify(assortmentPriceMapping[key]), 'Ex', 60 * 60);
        }
    }

    static getTGAds(client, tgID) {
        return client.getAsync(`tgi_${tgID}`);
    }

    static setTGAds(client, tgID, data) {
        return client.setAsync(`tgi_${tgID}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // 1 hr
    }

    static getByTypeAndEvent(client, type, event, studentClass) {
        return client.getAsync(`nudge:${type}:${event}:${studentClass}`);
    }

    static setByTypeAndEvent(client, type, event, studentClass, data) {
        return client.setAsync(`nudge:${type}:${event}:${studentClass}`, JSON.stringify(data), 'Ex', 60 * 60 * 1); // 1 hr
    }

    static getCourseNotificationData(client, key, field) {
        return client.hgetAsync(key, field);
    }

    static setCourseNotificationData(client, key, feild, data, exTime) {
        if (!exTime) {
            const todayEnd = new Date().setHours(23, 59, 59, 999);
            return client.multi()
                .hset(key, feild, JSON.stringify(data))
                .expireat(key, parseInt(todayEnd / 1000))
                .execAsync();
        }
        return client.multi()
            .hset(key, feild, JSON.stringify(data))
            .expire(key, exTime)
            .execAsync();
    }

    static deleteCourseNotificationData(client, key, feild) {
        return client.hdelAsync(key, feild);
    }

    static sismember(client, key, field) {
        return client.sismemberAsync(key, field);
    }

    static sadd(client, key, member) {
        const todayEnd = new Date().setHours(23, 59, 59, 999);
        return client.multi()
            .sadd(key, member)
            .expireat(key, parseInt(todayEnd / 1000))
            .execAsync();
    }

    static setLiveStreamDetailsByQuestionID(client, questionID, data) {
        return client.setAsync(`lsd:${questionID}`, JSON.stringify(data), 'Ex', 60); // 5 min
    }

    static getLiveStreamDetailsByQuestionID(client, questionID) {
        return client.getAsync(`lsd:${questionID}`);
    }

    static delLiveStreamDetailsByQuestionID(client, questionID) {
        return client.delAsync(`lsd:${questionID}`);
    }

    static getLiveClassTopTeachersDataNewClp(client, stClass, language, categoryfinal) {
        return client.getAsync(`lctopteachers_newclp_${stClass}_${language}_${categoryfinal}`);
    }

    static setLiveClassTopTeachersDataNewClp(client, stClass, language, categoryfinal, data) {
        return client.setAsync(`lctopteachers_newclp_${stClass}_${language}_${categoryfinal}`, JSON.stringify(data), 'Ex', 60 * 60 * 12); // 12 hrs
    }
};
