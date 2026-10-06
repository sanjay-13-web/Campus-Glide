const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Bus = require('../models/Bus');

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addStudent = async (req, res) => {
  const { name, studentId, email, password, busNo, parentPhone, pickupLocation } = req.body;
  try {
    const userExists = await User.findOne({ $or: [{ email }, { studentId }] });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({
      name, studentId, email, password, role: 'student', busNo, parentPhone, pickupLocation
    });
    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.busNo = req.body.busNo || user.busNo;
      user.parentPhone = req.body.parentPhone || user.parentPhone;
      if (req.body.password) {
        user.password = req.body.password;
      }
      await user.save();
      res.json({ message: 'Student updated' });
    } else {
      res.status(404).json({ message: 'Student not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find().sort({ createdAt: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalBuses = await Bus.countDocuments();
    
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await Attendance.countDocuments({ date: today, status: { $in: ['present', 'boarded'] } });
    const absentToday = await Attendance.countDocuments({ date: today, status: { $in: ['absent', 'missed'] } });
    
    res.json({ totalStudents, totalBuses, presentToday, absentToday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBusDriver = async (req, res) => {
  try {
    const { driverName, driverPhone } = req.body;
    const bus = await Bus.findOneAndUpdate(
      { busNo: req.params.busNo }, 
      { driverName, driverPhone },
      { new: true }
    );
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ message: 'Driver details updated successfully', bus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};