const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, updateProfile, getBus, getAttendance, markAttendance, getNotifications, markNotificationRead, sendSOS } = require('../controllers/studentController');

router.use(protect);
router.route('/profile').get(getProfile).put(updateProfile);
router.get('/bus', getBus);
router.route('/attendance').get(getAttendance).post(markAttendance);
router.post('/sos', sendSOS);
router.route('/notifications').get(getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;