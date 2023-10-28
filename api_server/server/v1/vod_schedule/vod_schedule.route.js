const express = require('express');
// const multer = require('multer');
// const multers3 = require('multer-s3');
// const { S3 } = require('aws-sdk');
// const path = require('path');
// const moment = require('moment');

// const videoSize = require('../../../data/vod');

// const s3 = new S3({
//     region: 'ap-south-1',
//     signatureVersion: 'v4',
// });
const authGuard = require('../../../middlewares/auth');

const router = express.Router();

const vodScheduleCtrl = require('./vod_schedule.controller');

router.route('/:facultyId/list').get(authGuard, vodScheduleCtrl.list);
router.route('/:facultyId/:questionId/listWithQuestionId').get(authGuard, vodScheduleCtrl.listWithQuestionId);
router.route('/subjects').get(authGuard, vodScheduleCtrl.getSubjects);
router.route('/:subject/classes').get(authGuard, vodScheduleCtrl.getClasses);
router.route('/:subject/:classCode/states').get(authGuard, vodScheduleCtrl.getStates);
router.route('/:subject/:classCode/:state/languages').get(authGuard, vodScheduleCtrl.getLanguages);
router.route('/:subject/:classCode/:state/:language/chapters').get(authGuard, vodScheduleCtrl.getChapters);
router.route('/multi_state_map').post(authGuard, vodScheduleCtrl.updateMultiStateMeta);
router.route('/schedule_meta').post(authGuard, vodScheduleCtrl.updateVodScheduleMeta);
router.route('/add_topic').post(authGuard, vodScheduleCtrl.addTopic);
router.route('/topic/:topicMapId/delete').post(authGuard, vodScheduleCtrl.deleteTopic);
router.route('/:scheduleId/topics').get(authGuard, vodScheduleCtrl.getTopicsByScheduleId);
router.route('/:scheduleId/widgets').get(authGuard, vodScheduleCtrl.getWidgetsByScheduleId);
router.route('/:scheduleId/addWidget').post(authGuard, vodScheduleCtrl.addWidget);
router.route('/widget/:widgetMapId/delete').post(authGuard, vodScheduleCtrl.deleteWidget);
router.route('/:scheduleId/process').get(authGuard, vodScheduleCtrl.processClass);
router.route('/liveclass/meta').get(authGuard, vodScheduleCtrl.liveClassMeta);
router.route('/process/bulk_five').get(authGuard, vodScheduleCtrl.processAllVodsClass);
router.route('/lecture-types').get(authGuard, vodScheduleCtrl.getLectureTypes);

// upload middleware
// const upload = multer({
//     limits: { fileSize: 2000 * 1024 * 1024 },
//     storage: multers3({
//         s3,
//         bucket: 'dn-original-studio-videos',
//         contentType(req, file, cb) {
//             let contentType;
//             if (req.body.entity_type === 'image') {
//                 contentType = 'image/png';
//             } else if (req.body.entity_type === 'video') {
//                 contentType = 'video/mp4';
//             }
//             cb(null, contentType);
//         },
//         metadata: (req, file, cb) => {
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: (req, file, cb) => {
//             console.log('req');
//             console.log(req.file);
//             console.log(req.files);
//             console.log(req.params);
//             console.log(file);
//             const ext = path.extname(file.originalname);
//             const fileName = `vod-${req.params.vod_id}${ext}`;
//             const prefix = `SCHEDULED-VOD/${moment().format('YYYY/MM/DD/')}`;
//             cb(null, `${prefix}${fileName}`);
//         },
//     }),
// });
router.route('/generate-qid/:vod_id').get(authGuard, vodScheduleCtrl.generateQid);

// upload file routes
router.route('/:scheduleId/getVodVideo').get(authGuard, vodScheduleCtrl.getVodVideo);
router.route('/get-signed-upload-url').get(authGuard, vodScheduleCtrl.getSignedUrl);
router.route('/:scheduleId/updateVodUrl').post(authGuard, vodScheduleCtrl.updateVodUrl);
router.route('/:scheduleId/qualifyVod').post(authGuard, vodScheduleCtrl.qualifyVodVideo);

router.route('/markQa').post(authGuard, vodScheduleCtrl.markAsQa);
router.route('/markStudentFeedback').post(authGuard, vodScheduleCtrl.markAsStudentFeedback);

// notes upload
router.route('/:scheduleId/getNotes').get(authGuard, vodScheduleCtrl.getNotesByScheduleId);
router.route('/get-pdf-upload-url').get(authGuard, vodScheduleCtrl.getPdfUploadSignedUrl);

router.route('/:scheduleId/addNotesQid').post(authGuard, vodScheduleCtrl.addNotesByQid);
router.route('/:scheduleId/addNotesPdf').post(authGuard, vodScheduleCtrl.addNotesByPdf);

module.exports = router;
