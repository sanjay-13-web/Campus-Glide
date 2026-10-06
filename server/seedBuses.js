const mongoose = require('mongoose');
const Bus = require('./models/Bus');

const buses = [
  { busNo: '104', route: 'West End Tech Park', driverName: 'Unassigned', driverPhone: 'N/A' },
  { busNo: '105', route: 'Central District Loop', driverName: 'Unassigned', driverPhone: 'N/A' },
  { busNo: '106', route: 'Blue Hills Expressway', driverName: 'Unassigned', driverPhone: 'N/A' },
  { busNo: '107', route: 'Silicon Valley Bypass', driverName: 'Unassigned', driverPhone: 'N/A' },
  { busNo: '108', route: 'Old Town Square', driverName: 'Unassigned', driverPhone: 'N/A' }
];

mongoose.connect('mongodb://127.0.0.1:27017/college_bus_db')
  .then(async () => {
    console.log('Connected to DB');
    let count = 0;
    for (const b of buses) {
      const exists = await Bus.findOne({ busNo: b.busNo });
      if (!exists) {
        await Bus.create(b);
        count++;
      }
    }
    console.log(`Added ${count} new buses!`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
