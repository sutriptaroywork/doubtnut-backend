/**
 * @Author: xesloohc
 * @Date:   2019-05-06T15:04:29+05:30
 * @Email:  god@xesloohc.com
 * @Last modified by:   xesloohc
 * @Last modified time: 2019-05-12T13:25:09+05:30
 */



const mongoose = require('mongoose');
const moment = require('moment');
let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
let GroupChatMessageSchema = new Schema({
  student_id: {type: String, index: true,required:true},
  student_username: {type: String, index: true,required:true},
  student_avatar: {type: String},
  question_id: {type: String, index: true},
  entity_type: {type: String, index: true,required:true},
  entity_id: {type: String, index: true,required:true},
  message: {type: String,trim:true,default:""},
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
GroupChatMessageSchema.pre('save', function (next) {
  // this._update.updated_at *= 1000;
  console.log("this")
  console.log(this)
  this.createdAt = moment(this.createdAt).add(5, 'h').add(30,'m').toISOString()
  this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30,'m').toISOString()
  next();
});
let GroupChatMessageModel = mongoose.model('GroupChatMessage', GroupChatMessageSchema);
GroupChatMessageModel.on('index', function(error) {
  console.log(error.message);
});

module.exports = GroupChatMessageModel
