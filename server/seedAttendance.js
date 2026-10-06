const mongoose = require('mongoose');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');

mongoose.connect('mongodb://127.0.0.1:27017/college_bus_db')
  .then(async () => {
    console.log('Connected to DB');
    const students = await User.find({ role: 'student' });
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    for (const student of students) {
      // Yesterday's attendance
      const status1 = Math.random() > 0.2 ? 'present' : 'absent';
      await Attendance.findOneAndUpdate(
        { studentId: student.studentId, date: yesterday },
        { studentId: student.studentId, busNo: student.busNo, date: yesterday, status: status1 },
        { upsert: true }
      );

      // Today's attendance
      const status2 = Math.random() > 0.1 ? 'present' : (Math.random() > 0.5 ? 'missed' : 'absent');
      await Attendance.findOneAndUpdate(
        { studentId: student.studentId, date: today },
        { studentId: student.studentId, busNo: student.busNo, date: today, status: status2 },
        { upsert: true }
      );

      // Random notifications for missed/absent today
      if (status2 === 'missed' || status2 === 'absent') {
        await Notification.create({
          studentId: student.studentId,
          busNo: student.busNo,
          type: 'absence',
          message: `ALERT: Your ward ${student.name} has marked ${status2.toUpperCase()} for Bus ${student.busNo} today (${today}).`,
          recipient: 'parent'
        });
      }
    }
    console.log('Seeded attendance and notifications!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
