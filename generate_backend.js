const fs = require('fs');
const path = require('path');

const serverDir = path.join(__dirname, 'server');
const dirs = ['config', 'middleware', 'models', 'routes', 'controllers'];

dirs.forEach(d => fs.mkdirSync(path.join(serverDir, d), { recursive: true }));

const files = {
  '.env': `PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/college_bus_db
JWT_SECRET=supersecret123`,
  
  'server.js': `const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/bus', require('./routes/busRoutes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));`,

  'config/db.js': `const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(\`MongoDB Connected: \${conn.connection.host}\`);
  } catch (error) {
    console.error(\`Error: \${error.message}\`);
    process.exit(1);
  }
};
module.exports = connectDB;`,

  'middleware/auth.js': `const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };`,

  'models/User.js': `const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  studentId: { type: String, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  busNo: { type: String },
  parentPhone: { type: String },
  pickupLocation: { type: String }
}, { timestamps: true });

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);`,

  'models/Bus.js': `const mongoose = require('mongoose');

const busSchema = new mongoose.Schema({
  busNo: { type: String, required: true, unique: true },
  busName: { type: String, required: true },
  route: { type: String, required: true },
  status: { type: String, default: 'active' },
  currentLocation: { type: String, default: 'Garage' },
  estimatedArrival: { type: Number, default: 0 }
});

module.exports = mongoose.model('Bus', busSchema);`,

  'models/Attendance.js': `const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  busNo: { type: String, required: true },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  status: { type: String, enum: ['present', 'absent'], required: true }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', attendanceSchema);`,

  'models/Notification.js': `const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  busNo: { type: String, required: true },
  type: { type: String, required: true }, // 'absence', 'arrival'
  message: { type: String, required: true },
  recipient: { type: String, enum: ['parent', 'student'], required: true },
  read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);`,

  'routes/authRoutes.js': `const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login);

module.exports = router;`,

  'routes/adminRoutes.js': `const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const { getStudents, addStudent, updateStudent, getAttendance, getNotifications, getDashboardStats } = require('../controllers/adminController');

router.use(protect, admin);
router.route('/students').get(getStudents).post(addStudent);
router.route('/students/:id').put(updateStudent);
router.get('/attendance', getAttendance);
router.get('/notifications', getNotifications);
router.get('/stats', getDashboardStats);

module.exports = router;`,

  'routes/studentRoutes.js': `const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getProfile, getBus, getAttendance, markAttendance, getNotifications, markNotificationRead } = require('../controllers/studentController');

router.use(protect);
router.get('/profile', getProfile);
router.get('/bus', getBus);
router.route('/attendance').get(getAttendance).post(markAttendance);
router.route('/notifications').get(getNotifications);
router.put('/notifications/:id/read', markNotificationRead);

module.exports = router;`,

  'routes/busRoutes.js': `const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBusDetails, getBusArrival, addBus, getAllBuses } = require('../controllers/busController');

router.use(protect);
router.get('/', getAllBuses);
router.post('/', addBus);
router.get('/:busNo', getBusDetails);
router.get('/:busNo/arrival', getBusArrival);

module.exports = router;`,

  'controllers/authController.js': `const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        busNo: user.busNo,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`,

  'controllers/adminController.js': `const User = require('../models/User');
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
    const presentToday = await Attendance.countDocuments({ date: today, status: 'present' });
    const absentToday = await Attendance.countDocuments({ date: today, status: 'absent' });
    
    res.json({ totalStudents, totalBuses, presentToday, absentToday });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`,

  'controllers/studentController.js': `const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Bus = require('../models/Bus');

exports.getProfile = async (req, res) => {
  res.json(req.user);
};

exports.getBus = async (req, res) => {
  try {
    const bus = await Bus.findOne({ busNo: req.user.busNo });
    if (!bus) {
      return res.status(404).json({ message: 'Bus not found' });
    }
    res.json(bus);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({ studentId: req.user.studentId, busNo: req.user.busNo }).sort({ createdAt: -1 });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markAttendance = async (req, res) => {
  const { status, date } = req.body;
  try {
    const existing = await Attendance.findOne({ studentId: req.user.studentId, date });
    if (existing) {
      return res.status(400).json({ message: 'Attendance already submitted for today' });
    }
    
    const attendance = await Attendance.create({
      studentId: req.user.studentId,
      busNo: req.user.busNo,
      date,
      status
    });

    if (status === 'absent') {
      await Notification.create({
        studentId: req.user.studentId,
        busNo: req.user.busNo,
        type: 'absence',
        message: \`Your ward \${req.user.name} has marked absent for Bus \${req.user.busNo} today (\${date}).\`,
        recipient: 'parent'
      });
    }

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ studentId: req.user.studentId, recipient: 'student' }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (notification && notification.studentId === req.user.studentId) {
      notification.read = true;
      await notification.save();
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`,

  'controllers/busController.js': `const Bus = require('../models/Bus');

exports.getAllBuses = async (req, res) => {
  try {
    const buses = await Bus.find();
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
    // Student can only access their assigned bus
    if (req.user.role === 'student' && req.user.busNo !== req.params.busNo) {
      return res.status(403).json({ message: 'Access Denied. You are assigned to Bus ' + req.user.busNo + '. You cannot access Bus ' + req.params.busNo });
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
    
    // Simulate arrival calculation based on estimatedArrival field
    res.json({
      busNo: bus.busNo,
      currentLocation: bus.currentLocation,
      estimatedArrival: bus.estimatedArrival
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};`
};

for (const [relPath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(serverDir, relPath), content);
}

console.log('Backend files generated successfully.');
