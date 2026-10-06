const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getStudents, addStudent, updateStudent, getAttendance, getNotifications, getDashboardStats, updateBusDriver } = require('../controllers/adminController');

router.use(protect, admin);
router.route('/students').get(getStudents).post(addStudent);
router.route('/students/:id').put(updateStudent);
router.put('/bus/:busNo/driver', updateBusDriver);
router.get('/attendance', getAttendance);
router.get('/notifications', getNotifications);
router.get('/stats', getDashboardStats);

module.exports = router;