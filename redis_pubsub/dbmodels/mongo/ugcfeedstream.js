/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 18:09:12
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-03 16:51:31
*/
// const mongoose = require("mongoose")
// const moment = require("moment")
// let Schema = mongoose.Schema

// let ugcFeedStreamSchema = new Schema({
// 	feed_group : {type : String},
// 	feed_entity_type : {type : String},
// 	feed_entity_id : {type: String},
// 	relevancy : {type:Number},
// 	activity_id:{type:String}
// },{
// 	timestamps : true
// })

// let UgcFeedStreamModel = mongoose.model('UgcFeedStream',ugcFeedStreamSchema)
// UgcFeedStreamModel.on('index',function(error){
// 	console.log(error.message)
// })
// ugcFeedStreamSchema.pre('save',function(next){
// 	this.createdAt = moment(this.createdAt).toISOString();
//     this.updatedAt = moment(this.updatedAt).toISOString();
// })