const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');
const Bus = require('./models/Bus');

dotenv.config();
connectDB().then(async () => {
  // Auto-seed for Vercel Cloud Database if empty
  try {
    const adminExists = await User.findOne({ email: 'admin@college.edu' });
    if (!adminExists) {
      console.log('Empty database detected! Auto-seeding demo data...');
      await User.create({ name: 'System Admin', email: 'admin@college.edu', password: 'password123', role: 'admin' });
      await User.create({ name: 'Demo Student', email: 'student@college.edu', password: 'password123', role: 'student', studentId: 'STU001', busNo: '101' });
      
      const busExists = await Bus.findOne({ busNo: '101' });
      if (!busExists) {
        await Bus.create([
          { busNo: '101', route: 'North Campus Route', driverName: 'John Doe', driverPhone: '555-0101' },
          { busNo: '102', route: 'South City Route', driverName: 'Jane Smith', driverPhone: '555-0102' }
        ]);
      }
      console.log('Auto-seeding complete!');
    }
  } catch (err) {
    console.error('Auto-seed failed:', err);
  }
});

const app = express();
app.use(cors());
app.use(express.json());

// Ensure MongoDB is connected on every Vercel request
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/bus', require('./routes/busRoutes'));

// Serve Frontend
app.use(express.static(path.join(__dirname, '../client/dist')));

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;