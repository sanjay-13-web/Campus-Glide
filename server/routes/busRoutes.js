const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBusDetails, getBusArrival, addBus, getAllBuses } = require('../controllers/busController');

router.use(protect);
router.get('/', getAllBuses);
router.post('/', addBus);
router.get('/:busNo', getBusDetails);
router.get('/:busNo/arrival', getBusArrival);

module.exports = router;