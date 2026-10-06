const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBusDetails, getBusArrival, addBus, getAllBuses, updateLocation } = require('../controllers/busController');

// Public route for driver's phone GPS updates
router.put('/:busNo/location', updateLocation);

router.use(protect);
router.get('/', getAllBuses);
router.post('/', addBus);
router.get('/:busNo', getBusDetails);
router.get('/:busNo/arrival', getBusArrival);

module.exports = router;