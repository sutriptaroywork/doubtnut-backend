const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();
const commentCtrl = require('./comment.controller');

const publicPath = path.join(__dirname, '..', '..', '..', 'public');
const upload = multer({ dest: `${publicPath}/uploads/` });
// const limits = {
//     files: 1, // allow only 1 file per request
//     fileSize: 1024 * 1024 * 25 *10, // 1 MB (max file size)
// };
const uploadFields = upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]);
// router.route('/get-list-by-entity/:entity_type/:entity_id').get(commentCtrl.getListByEntity);
// router.route('/get-by-parent/:parent_id').get(commentCtrl.getByParent);
router.route('/add').post(uploadFields, commentCtrl.add);
// router.route('/remove').post(commentCtrl.remove);
// router.route('/report').post(commentCtrl.report);
// router.route('/like').post(commentCtrl.like);
router.route('/update_top_comment').post(commentCtrl.updateTopComment);

router.route('/update_doubt_as_comment').post(commentCtrl.updateDoubtAsComment);
router.route('/update_comment_as_doubt').post(commentCtrl.updateCommentAsDoubt);
router.route('/alldoubts').get(commentCtrl.getDoubts);
router.route('/alldoubts/getFacultyNames').get(commentCtrl.getFacultyNames);
router.route('/alldoubts/getVideo').get(commentCtrl.getVideoByQid);

router.route('/alldoubts/mark-doubt-suggestion').post(commentCtrl.markDoubtAsSuggestion);

router.route('/doubts/:facultyId').get(commentCtrl.getDoubtsByFaculty);
router.route('/replies').get(commentCtrl.getRepliesByEntity);

router.route('/doubts/:facultyId/:entityid').get(commentCtrl.getDoubtsByFacultyByEntityId);
router.route('/answereddoubts/:facultyId').get(commentCtrl.getAnsweredDoubtsByFaculty);
router.route('/answered/:commentID').get(commentCtrl.getAnswerByCommentID);
router.route('/answers').get(commentCtrl.getAnswersByEntityIdNew);
module.exports = router;
