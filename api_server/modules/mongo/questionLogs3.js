const mongoose = require('mongoose');
const moment = require('moment');
let Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;
let QuestionLogSchema = new Schema({
    student_id: { type: String, index: true, required: true },
    isAbEligible: { type: String, index: true, required: true },
    qid: { type: String, index: true, required: true },
    ocr_type: { type: String, index: true, required: true },
    elastic_index: { type: String, index: true, required: true },
    qid_matches_array: { type: [String], index: true, required: true },
    meta_index: { type: String, trim: true, default: "" },
    iteration_name: { type: String, index: true, default: null },
    request_version: { type: String, default: "" },
    is_match :{type:Number,default:0},
    question_image: {type: String, default:null},
    ocr:{type: String, default:null},
    subject:{type: String, default:null},
    user_locale: {type: String, default: null},
    relevance_score: {type : Object, default: []},
    tags: { type: Array, default: [] }
    },{
    timestamps: true
});
QuestionLogSchema.pre('save', function (next) {
    this.createdAt = moment(this.createdAt).add(5, 'h').add(30, 'm').toISOString()
    this.updatedAt = moment(this.updatedAt).add(5, "h").add(30, "m").toISOString();
    next();
});
let QuestionLogModel = mongoose.model('QuestionLogs3', QuestionLogSchema);
QuestionLogModel.on('index', function (error) {
    console.log(error.message);
});

function isMatchUpdateMongo(parent_id){
    return QuestionLogModel.findOneAndUpdate({'qid':parent_id},{$set:{'is_match':1}});
}

function findBySid(sid, limit){
    limit = parseInt(limit)
    return QuestionLogModel.find({"student_id":sid}).sort( { createdAt: -1 } ).limit(limit);
}

module.exports = {QuestionLogModel,isMatchUpdateMongo, findBySid}