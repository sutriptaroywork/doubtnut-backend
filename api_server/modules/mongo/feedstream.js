/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-17 16:50:31
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-17 19:41:23
*/
const mongoose = require("mongoose");
const moment = require("moment");
let Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

let FeedStreamSchema = new Schema({
	feed_group : {type : String, index : true},
	class:{type:String},
	entity_type : {type : String},
	entity_id : {type: String},
	entity_data: {type: Object},
	relevancy : {type:Number},
	activity_id:{type:String},
	activity_type:{type:String},
	timetaken:{type:Number},
	visible_from:{type:Date,default:moment(this.createdAt).add(5, 'h').add(30,'m').toISOString()},
	visible_to:{type:Date},
	topcomment:{type:Object},
	commentcount:{type:Number},
	likecount:{type:Number},
	recent_likedBy:{type:String},
	is_deleted:{type:Boolean,default : false},
	is_past:{type:Boolean,default : false},
	is_active:{type:Boolean,default:true}
    },{
        timestamps: true
    }
);

FeedStreamSchema.pre('save', function (next) {
    this.createdAt = moment(this.createdAt).toISOString()
    this.updatedAt = moment(this.updatedAt).toISOString()
    next();
})
let FeedStreamModel = mongoose.model('FeedStream', FeedStreamSchema);
FeedStreamModel.on('index', function(error) {
    console.log(error.message);
})
module.exports = FeedStreamModel;