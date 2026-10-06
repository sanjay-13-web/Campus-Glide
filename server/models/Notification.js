const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  busNo: { type: String, required: true },
  type: { type: String, required: true }, // 'absence', 'arrival'
  message: { type: String, required: true },
  recipient: { type: String, enum: ['parent', 'student'], required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);