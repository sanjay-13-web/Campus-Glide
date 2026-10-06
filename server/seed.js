const mongoose = require('mongoose');
const User = require('./models/User');
const Bus = require('./models/Bus');
require('dotenv').config({ path: './.env' });

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/college_bus_db')
  .then(async () => {
    console.log('Connected to DB');

    // Create Admin
    const adminExists = await User.findOne({ email: 'admin@college.edu' });
    if (!adminExists) {
      await User.create({
        name: 'System Admin',
        email: 'admin@college.edu',
        password: 'password123',
        role: 'admin'
      });
      console.log('Admin user created: admin@college.edu / password123');
    }

    // Create Buses
    const buses = [
      { busNo: '101', busName: 'College Bus 101', route: 'North City Route', currentLocation: 'Main Stop A', estimatedArrival: 10 },
      { busNo: '102', busName: 'College Bus 102', route: 'South City Route', currentLocation: 'South Market', estimatedArrival: 15 },
      { busNo: '103', busName: 'College Bus 103', route: 'East Campus', currentLocation: 'East Gate', estimatedArrival: 5 }
    ];

    for (let b of buses) {
      const exists = await Bus.findOne({ busNo: b.busNo });
      if (!exists) {
        await Bus.create(b);
        console.log("Bus " + b.busNo + " created");
      }
    }

    console.log('Seed complete.');
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
