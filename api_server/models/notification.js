const mongoose = require('mongoose');
var NotificationSchema = new mongoose.Schema({
  student_id: String,
  data: {
    event: String,
    title: String,
    message: String,
    image: String,
    data: String
  },
  status: String,
  type: String,
  response: String,
  time: { type: Date, default: Date.now },
});

