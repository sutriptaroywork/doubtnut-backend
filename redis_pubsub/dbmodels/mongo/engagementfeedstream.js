/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 18:08:48
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-14 20:19:37
*/

const mongoose = require("mongoose");
const moment = require("moment");
let Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

let EngagementFeedStreamSchema = new Schema({
	feed_group : {type : String, index : true},
	class:{type:String},
	entity_type : {type : String},
	entity_id : {type: String},
	entity_data: {type: Object},
	relevancy : {type:Number},
	activity_id:{type:String},
	activity_type:{type:String},
	timetaken:{type:Number},
	visible_from:{type:Date,default:moment(this.createdAt).toISOString()},
	visible_to:{type:Date},
	is_deleted:{type:Boolean,default : false},
	is_active:{type:Boolean,default:true}
    },{
        timestamps: true
    }
);

EngagementFeedStreamSchema.pre('save', function (next) {
    this.createdAt = moment(this.createdAt).toISOString()
    this.updatedAt = moment(this.updatedAt).toISOString()
    next();
})

let EngagementFeedStreamModel = mongoose.model('EngagementFeedStream', EngagementFeedStreamSchema);
EngagementFeedStreamModel.on('index', function(error) {
    console.log(error.message);
})

module.exports = EngagementFeedStreamModel;