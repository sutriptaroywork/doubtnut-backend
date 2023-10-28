const mongoose = require('mongoose');
let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
let CommentSchema = new Schema({
  student_id: {type: String, index: true},
  question_id: {type: String, index: true},
  entity_type: {type: String, index: true},
  entity_id: {type: String, index: true},
  message: {type: String,trim:true},
  parent_id: {type: ObjectId, index: true},
  image: { type:String, index: true },
  reporter_id: {type: [String]},
  liked_by: {type: [String], index: true},
  is_deleted: {type: Boolean, index: true}
}, {
  timestamps: true
});
let CommentModel = mongoose.model('Comment', CommentSchema);
CommentModel.on('index', function(error) {
  console.log(error.message);
});
module.exports = CommentModel
