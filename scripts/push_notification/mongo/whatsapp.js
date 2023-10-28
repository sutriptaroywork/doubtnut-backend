const mongoose = require('mongoose');
const moment = require('moment');
let Schema = mongoose.Schema,
  ObjectId = Schema.ObjectId;
let WhatsAppSchema = new Schema({
  phone: {type: String, index: true,required:true},
  data: {type: Object, index: true,required:true}},
  {
    timestamps: true
  }
);
let WhatsAppModel = mongoose.model('whatsapp', WhatsAppSchema);
WhatsAppSchema.on('index', function(error) {
  console.log(error.message);
});


WhatsAppSchema.pre('save', function (next) {
  // this._update.updated_at *= 1000;
  console.log("this")
  console.log(this)
  this.createdAt = moment(this.createdAt).add(5, 'h').add(30,'m').toISOString()
  this.updatedAt = moment(this.updatedAt).add(5, 'h').add(30,'m').toISOString()
  next();
});


module.exports = WhatsAppModel
