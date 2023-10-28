const mongoose = require('mongoose');

const { Schema } = mongoose;
/** **
 *
 *  schema for mongo collection
 *  questionID:
 *  questionText:
 *  optionA:
 *  optionB:
 *  optionC:
 *  optionD:
 *  correctOption:
 *  startTime:
 *  endTime:
 *  subject:
 *  class:
 *  lang:
 *
 */
const QuizTfsSchema = new Schema({
    questionID: { type: String, index: true, required: true },
    subject: { type: String, index: true, required: true },
    language: { type: String, index: true, required: true },
    class: { type: String, index: true, required: true },
    questionTest: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, index: true, required: true },
    optionA: { type: String, required: true },
    optionB: { type: String, required: true },
    optionC: { type: String, required: true },
    optionD: { type: String, required: true },
    correctOption: { type: String, required: true },
    mappingStudentId: { type: Number, required: true },
    mappingPackage: { type: String, required: true },
    mappingPackageLanguage: { type: String, require: true },
    mappingVideoLanguage: { type: String, required: true },
    mappingTargetGroup: { type: String, required: true },
    mappingContentFormat: { type: String, required: true },
    mappingVendorId: { type: Number, required: true },
    mappingTargetGoupType: { type: String, required: true },
});

const QuizTfsModel = mongoose.model('QuizTfs', QuizTfsSchema);
QuizTfsModel.on('index', (error) => {
    console.log(error.message);
});

module.exports = QuizTfsModel;
