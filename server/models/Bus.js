const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNo: { type: String, required: true, unique: true },
  busName: { type: String, required: true },
  route: { type: String, required: true },
  status: { type: String, default: 'active' },
  currentLocation: { type: String, default: 'Garage' },
  lat: { type: Number, default: 13.0827 }, // Default Chennai lat
  lng: { type: Number, default: 80.2707 }, // Default Chennai lng
  driverName: { type: String, default: 'Unassigned' },
  driverPhone: { type: String, default: 'N/A' },
  estimatedArrival: { type: Number, default: 0 },
  trafficStatus: { type: String, default: 'Light' }, // Light, Moderate, Heavy
  dropoffTime: { type: String, default: '08:30 AM' },
  capacity: { type: Number, default: 50 }
});

module.exports = mongoose.model('Bus', busSchema);