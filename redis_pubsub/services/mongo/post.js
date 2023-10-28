/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-03 16:22:18
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-03 16:50:49
*/
const mongoose = require('mongoose');
const commentModel = require('./comment');
const commentSchema = commentModel.schema

const moment = require('moment');
let Schema = mongoose.Schema
let PostSchema = new Schema({
  type: {type: String, index: true,required:true},
  student_id: {type: String, index: true,required:true},
  text: {type: String},
  url: {type: String},
  image:{type: String},
  audio:{type: String},
  video:{type: String},
  contain_text:{type:Boolean,default:false},
  contain_image:{type:Boolean,default:false},
  contain_audio:{type:Boolean,default:false},
  contain_video:{type:Boolean,default:false},
  class_group: {type:String,index:true},
  student_username: {type: String},
  student_avatar: {type: String},
  comments: [commentSchema],
  likes: [{student_id:{type: String, index:true},student_username:{type: String, index:true},student_avatar:{type: String, index:true}}],
  reports: [{student_id:{type: String, index:true},student_username:{type: String, index:true},student_avatar:{type: String, index:true}}],
  is_deleted: {type: Boolean, index: true, default:false},
  is_visible:{type: Boolean, index: true, default:true},
  is_moderated: {type:Boolean,index: true, default: false},
  moderated_by:{student_id:{type: String, index:true},student_username:{type: String, index:true},student_avatar:{type: String, index:true}},
  child_id:{type:Schema.ObjectId ,index:true},
  og_title: {type:String,default:''},
  og_des: {type:String,default:''},
  og_url: {type:String,default:''},
  og_image: {type:String,default:''}
}, {
  timestamps: true
});
PostSchema.pre('save', function (next) {
  // this._update.updated_at *= 1000;
  this.createdAt = moment(this.createdAt).add(5, 'h').add(30,'m').toISOString()
  this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30,'m').toISOString()
  next();
});
let PostModel = mongoose.model('Post', PostSchema);
PostModel.on('index', function(error) {
  console.log(error.message);
});

module.exports = PostModel
