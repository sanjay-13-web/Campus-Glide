const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Bus = require('../models/Bus');

exports.getProfile = async (req, res) => {
  res.json(req.user);
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.parentPhone) user.parentPhone = req.body.parentPhone;
    if (req.body.password) user.password = req.body.password;
    await user.save();
    res.json({ message: 'Profile updated successfully', user });
  } catch(err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ busNo: req.user.busNo });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ studentId: req.user.studentId, busNo: req.user.busNo }).sort({ createdAt: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  const { status, date } = req.body;
  try {
    let attendance = await Attendance.findOne({ studentId: req.user.studentId, date });
    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = await Attendance.create({
        studentId: req.user.studentId,
        busNo: req.user.busNo,
        date,
        status
      });
    }

    if (status === 'absent' || status === 'missed') {
      await Notification.create({
        studentId: req.user.studentId,
        busNo: req.user.busNo,
        type: 'absence',
        message: `ALERT: Your ward ${req.user.name} has marked ${status.toUpperCase()} for Bus ${req.user.busNo} today (${date}).`,
        recipient: 'parent'
      });
    }

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendSOS = async (req, res) => {
  try {
    await Notification.create({
      studentId: req.user.studentId,
      busNo: req.user.busNo,
      type: 'sos',
      message: `🆘 EMERGENCY SOS from ${req.user.name} (ID: ${req.user.studentId}). Immediate attention required.`,
      recipient: 'admin'
    });
    res.json({ message: 'SOS Alert Sent Successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ studentId: req.user.studentId, recipient: 'student' }).sort({ createdAt: -1 });
    
    // Inject dynamic bus arrival notification
    const bus = await Bus.findOne({ busNo: req.user.busNo });
    if (bus) {
      let arrivalMessage = '';
      if (bus.estimatedArrival <= 1) arrivalMessage = `🚌 Bus ${bus.busNo} is arriving at your pickup location.`;
      else if (bus.estimatedArrival <= 5) arrivalMessage = `🚌 Bus ${bus.busNo} will arrive at your pickup location in approximately ${bus.estimatedArrival} minutes. Please be ready.`;
      else if (bus.estimatedArrival <= 10) arrivalMessage = `🚌 Bus ${bus.busNo} will arrive at your pickup location in approximately ${bus.estimatedArrival} minutes.`;

      if (arrivalMessage) {
        notifications.unshift({
          _id: 'dynamic_' + Date.now(),
          type: 'arrival',
          message: arrivalMessage,
          read: false,
          createdAt: new Date()
        });
      }
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification && notification.studentId === req.user.studentId) {
      notification.read = true;
      await notification.save();
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};