const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  busNo: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent', 'boarded', 'missed'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);