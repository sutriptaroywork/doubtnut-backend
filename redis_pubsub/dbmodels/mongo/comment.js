/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-03 18:11:21
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-03 18:11:27
*/
const mongoose = require('mongoose');
const moment = require('moment');
let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
let CommentSchema = new Schema({
  student_id: {type: String, index: true,required:true},
  student_username: {type: String, index: true,required:true},
  student_avatar: {type: String},
  question_id: {type: String, index: true},
  entity_type: {type: String, index: true,required:true},
  entity_id: {type: String, index: true,required:true},
  message: {type: String,trim:true,required:true},
  parent_id: {type: ObjectId, index: true,default : null},
  image: { type:String , default: ""},
  audio: { type:String , default: ""},
  // is_reported: {type: String, index: true},
  reported_by: {type: [Number], index: true},
  liked_by: {type: [Number], index: true},
  is_deleted: {type: Boolean, index: true, default:false}
}, {
  timestamps: true
});
let CommentModel = mongoose.model('Comment', CommentSchema);
CommentModel.on('index', function(error) {
  console.log(error.message);
});
CommentSchema.pre('save', function (next) {
  // this._update.updated_at *= 1000;
  console.log("this")
  console.log(this)
  this.createdAt = moment(this.createdAt).add(5, 'h').add(30,'m').toISOString()
  this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30,'m').toISOString()
  next();
});
module.exports = CommentModel