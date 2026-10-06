const Bus = require('../models/Bus');

// Simulate bus movement
const simulateMovement = async () => {
  try {
    const buses = await Bus.find();
    for (let bus of buses) {
      // Small random movement
      bus.lat += (Math.random() - 0.5) * 0.005;
      bus.lng += (Math.random() - 0.5) * 0.005;
      
      // Update ETA
      if (bus.estimatedArrival > 0) {
        bus.estimatedArrival -= 1; // Decrease ETA
      } else {
        bus.estimatedArrival = Math.floor(Math.random() * 20) + 5; // Reset ETA if reached
        const locations = ['North Gate', 'South City Station', 'East Campus', 'Central Library', 'Main Highway Stop'];
        bus.currentLocation = locations[Math.floor(Math.random() * locations.length)];
      }

      // Simulate Traffic Status
      const rand = Math.random();
      if (rand > 0.8) bus.trafficStatus = 'Heavy';
      else if (rand > 0.4) bus.trafficStatus = 'Moderate';
      else bus.trafficStatus = 'Light';

      await bus.save();
    }
  } catch(err) {
    console.error("Simulation error", err);
  }
};

// Simulation disabled for Vercel Serverless environment to prevent timeouts
// setInterval(simulateMovement, 30000);

const Attendance = require('../models/Attendance');

exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find().lean();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate occupied seats for each bus today
    for (let bus of buses) {
      const occupied = await Attendance.countDocuments({ busNo: bus.busNo, date: today, status: { $in: ['present', 'boarded'] } });
      bus.occupiedSeats = occupied;
    }
    
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addBus = async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBusDetails = async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.busNo !== req.params.busNo) {
      return res.status(403).json({ message: 'Access Denied. You cannot access Bus ' + req.params.busNo });
    }
    const bus = await Bus.findOne({ busNo: req.params.busNo });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getBusArrival = async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.busNo !== req.params.busNo) {
      return res.status(403).json({ message: 'Access Denied.' });
    }
    const bus = await Bus.findOne({ busNo: req.params.busNo });
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    
    res.json({
      busNo: bus.busNo,
      currentLocation: bus.currentLocation,
      estimatedArrival: bus.estimatedArrival,
      lat: bus.lat,
      lng: bus.lng,
      trafficStatus: bus.trafficStatus,
      dropoffTime: bus.dropoffTime
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};