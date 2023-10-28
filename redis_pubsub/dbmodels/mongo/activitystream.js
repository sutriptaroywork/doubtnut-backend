/*
* @Author: XesLoohc
* @Email: god@xesloohc.com
* @Date:   2019-01-02 15:43:30
* @Last Modified by:   XesLoohc
* @Last Modified time: 2019-01-15 16:32:56
*/
const mongoose = require("mongoose");
const moment = require("moment");
let Schema = mongoose.Schema;
ObjectId = Schema.ObjectId;

let ActivityStreamSchema = new Schema({
        actor_id:  {type: String, index: true},
        actor_type:{type: String, index: true},
        actor:{type: Object,index:true},
        verb:{type: String, index: true},
        object:{type: Object, index: true},
        object_id:{type: String, index : true},
        object_type:{type: String, index : true},
        target_id:{type: String,index : true},
        target_type:{type:String,index:true},
        target:{type:Object,index:true},
        relevancy:{type:Number,index:true},
        is_deleted:{type: Boolean,index:true},
        is_feed: {type:Boolean,index:true, default:false},
        is_processed:{type:Boolean,index:true,default:false}
    },{
        timestamps: true
    }
);

ActivityStreamSchema.pre('save', function (next) {
    this.relevancy = moment(this.createdAt).add(5, 'h').add(30,'m').valueOf()
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30,'m').toISOString()
    this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30,'m').toISOString()
    next();
})
let ActivityStreamModel = mongoose.model('ActivityStream', ActivityStreamSchema);
ActivityStreamModel.on('index', function(error) {
    console.log(error.message);
})
module.exports = ActivityStreamModel;