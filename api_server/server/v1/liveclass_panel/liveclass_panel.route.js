const express = require('express');
const multer = require('multer');
const path = require('path');

const authGuard = require('../../../middlewares/auth');
const liveclassPanelCtrl = require('./liveclass_panel.controller');

const router = express.Router();

const publicPath = path.join(__dirname, '..', '..', '..', 'public');

const upload = multer({ dest: `${publicPath}/uploads/` });

const uploadFields = upload.single('file');

const imagesUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, callback) {
        if (file.mimetype.startsWith('image')) {
            callback(null, true);
        } else {
            callback(new Error('Upload image only'));
        }
    },
    limits: {
        fileSize: 20 * 1024 * 1024,
    },
});
const imagesUploadFields = imagesUpload.single('file');

// router.route('/push-quiz-question').get(validate(paramValidation.liveclass.pushQuizQuestion), authGuard, liveclassCtrl.pushQuizQuestion);
router.route('/:faculty_id/get-scheduled-classes').get(authGuard, liveclassPanelCtrl.getScheduledClasses);
router.route('/:course_resource_id/quiz-add').post(authGuard, liveclassPanelCtrl.addQuiz);
router.route('/:course_resource_id/quiz-update').post(authGuard, liveclassPanelCtrl.updateQuestion);
router.route('/:course_resource_id/meta-update').post(authGuard, liveclassPanelCtrl.updateMeta);
router.route('/detail_id/reschedule').post(authGuard, liveclassPanelCtrl.reschedule);
router.route('/detail_id/chapter_change').post(authGuard, liveclassPanelCtrl.chapterChange);
router.route('/detail_id/delete').post(authGuard, liveclassPanelCtrl.deleteDetailId);
router.route('/detail_id/youtube_update').post(authGuard, liveclassPanelCtrl.updateYoutube);
router.route('/detail_id/facultyid_update').post(authGuard, liveclassPanelCtrl.updateFacultyId);
router.route('/detail_id/courseid_update').post(authGuard, liveclassPanelCtrl.updateCourseId);
router.route('/test-add-assortment').get(liveclassPanelCtrl.testAddAssortment);
router.route('/assortment_package_generation').get(liveclassPanelCtrl.assortmentPackageGeneration);
// UPCOMING CLASSES
router.route('/:faculty_id/get-upcoming-classes').get(authGuard, liveclassPanelCtrl.getUpcomingClasses);
router.route('/:courseID/masterChapters').get(authGuard, liveclassPanelCtrl.getMasterChaptersByCourseAndSubject);
router.route('/:id/upcoming-meta-update').post(authGuard, liveclassPanelCtrl.updateUpcomingMeta);
router.route('/:courseScheduleId/upcoming-class-process').get(authGuard, liveclassPanelCtrl.processUpcomingClass);
router.route('/:masterChapterMappingId/notes-process').get(authGuard, liveclassPanelCtrl.processNotes);

router.route('/masterChapter/:chapterID').post(authGuard, liveclassPanelCtrl.addNotesMeta);
router.route('/masterChapters').get(authGuard, liveclassPanelCtrl.getAllMasterChapters);
router.route('/homework/:resourceReference').get(liveclassPanelCtrl.getHomeWorkByResourceReference);
// router.route('/test-add-assortment').get(liveclassPanelCtrl.testAddAssortment);
// router.route('/assortment_package_generation').get(liveclassPanelCtrl.assortmentPackageGeneration);

// Insert quiz
// update quiz
// render quiz

router.route('/audit-report').get(authGuard, liveclassPanelCtrl.auditReport);
router.route('/answer-video-resource').get(authGuard, liveclassPanelCtrl.getAnswerVideoResources);
router.route('/answer-video-resource').put(authGuard, liveclassPanelCtrl.updateAnswerVideoResourcesPriority);

// Previous Class Routes
router.route('/get-previous-list/:facultyID').get(authGuard, liveclassPanelCtrl.getPreviousClasses);

// get promo images
router.route('/upload-promo-images').post(uploadFields, authGuard, liveclassPanelCtrl.uploadPromoImages);
router.route('/get-promo-images').get(authGuard, liveclassPanelCtrl.getPromoImages);
router.route('/:qid/promoImages').get(authGuard, liveclassPanelCtrl.getPromoImagesbyQid);

// new course upload/edit
router.route('/getCourseFilters').get(authGuard, liveclassPanelCtrl.getCourseFilters);
router.route('/getListAll').get(authGuard, liveclassPanelCtrl.getListAll);
router.route('/:assortment_id/getCourseDetailsAll').get(authGuard, liveclassPanelCtrl.getCourseDetailsAll);

router.route('/:assortment_id/courseMeta/timetable').post(authGuard, liveclassPanelCtrl.courseMetaTimetable);
router.route('/:assortment_id/courseMeta/faq').post(authGuard, liveclassPanelCtrl.courseMetaFaq);
router.route('/:assortment_id/courseMeta/prepurchase').post(authGuard, liveclassPanelCtrl.courseMetaPrePurchase);
router.route('/:assortment_id/courseMeta/student-package').post(authGuard, liveclassPanelCtrl.courseMetaStudentPackage);

router.route('/updateCourse').post(authGuard, liveclassPanelCtrl.updateCourseInfo);

router.route('/:assortment_id/markAllActive').get(authGuard, liveclassPanelCtrl.markCourseActiveAll);
router.route('/:assortment_id/markSingleActive').get(authGuard, liveclassPanelCtrl.markCourseActiveSingle);
router.route('/:assortment_id/markVideoDemo').get(authGuard, liveclassPanelCtrl.markVideoDemo);

router.route('/:assortment_id/createBatch').post(authGuard, liveclassPanelCtrl.createBatch);
router.route('/:assortment_id/createPackage/:batch_id').post(authGuard, liveclassPanelCtrl.createPackage);
router.route('/get-upload-url').get(authGuard, liveclassPanelCtrl.getUploadSignedUrl);

// router.route('/:assortment_id/uploadImages').post(imagesUploadFields, authGuard, liveclassPanelCtrl.uploadImages);
router.route('/:assortment_id/updateImageUrl').post(imagesUploadFields, authGuard, liveclassPanelCtrl.uploadImages);

router.route('/:assortment_id/markBatchActive/:batch_id').get(authGuard, liveclassPanelCtrl.markBatchActive);
router.route('/:assortment_id/markPackageActive/:package_id').get(authGuard, liveclassPanelCtrl.markPackageActive);
router.route('/:assortment_id/markPackageDefault/:package_id').get(authGuard, liveclassPanelCtrl.markPackageDefault);
router.route('/:package_id/createVariant').post(authGuard, liveclassPanelCtrl.createPackageVariant);
router.route('/:package_id/markVariantActive/:variant_id').get(authGuard, liveclassPanelCtrl.markVariantActive);
router.route('/:package_id/markVariantDefault/:variant_id').get(authGuard, liveclassPanelCtrl.markVariantDefault);

router.route('/:assortment_id/getDemoVideos').get(authGuard, liveclassPanelCtrl.getVideos);

// study groups and course banners
router.route('/:assortmentId/uploadBatchBanner').post(authGuard, liveclassPanelCtrl.uploadCourseBatchBanner);
// router.route('/:assortmentId/updateStudyGroup/:batchId').post(authGuard, liveclassPanelCtrl.updateStudyGroup);

// youtube panel
router.route('/get-youtube-events').get(authGuard, liveclassPanelCtrl.getYoutubeEvents);
router.route('/:eventId/update-youtube-meta').post(authGuard, liveclassPanelCtrl.updateYoutubeEventsMeta);
router.route('/:eventId/process-youtube-event').post(authGuard, liveclassPanelCtrl.processYoutubeEvent);
router.route('/:eventId/get-youtube-videos').get(authGuard, liveclassPanelCtrl.getYoutubeVideos);
router.route('/get-youtube-channels').get(authGuard, liveclassPanelCtrl.getYoutubeChannels);

module.exports = router;
