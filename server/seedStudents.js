const mongoose = require('mongoose');
const User = require('./models/User');

const students = [
  { name: 'Priya Sharma', studentId: 'STU002', email: 'priya@college.edu', busNo: '101', parentPhone: '9876543211', pickupLocation: 'North City Station' },
  { name: 'Rahul Verma', studentId: 'STU003', email: 'rahul@college.edu', busNo: '102', parentPhone: '9876543212', pickupLocation: 'South Market' },
  { name: 'Ananya Patel', studentId: 'STU004', email: 'ananya@college.edu', busNo: '103', parentPhone: '9876543213', pickupLocation: 'East Gate' },
  { name: 'Vikram Singh', studentId: 'STU005', email: 'vikram@college.edu', busNo: '101', parentPhone: '9876543214', pickupLocation: 'Park Avenue' },
  { name: 'Neha Gupta', studentId: 'STU006', email: 'neha@college.edu', busNo: '102', parentPhone: '9876543215', pickupLocation: 'Central Mall' },
  { name: 'Karan Malhotra', studentId: 'STU007', email: 'karan@college.edu', busNo: '103', parentPhone: '9876543216', pickupLocation: 'University Road' },
  { name: 'Sneha Reddy', studentId: 'STU008', email: 'sneha@college.edu', busNo: '101', parentPhone: '9876543217', pickupLocation: 'Lake View' },
  { name: 'Aditya Iyer', studentId: 'STU009', email: 'aditya@college.edu', busNo: '102', parentPhone: '9876543218', pickupLocation: 'Tech Park' },
  { name: 'Pooja Desai', studentId: 'STU010', email: 'pooja@college.edu', busNo: '103', parentPhone: '9876543219', pickupLocation: 'Garden City' },
  { name: 'Rohan Joshi', studentId: 'STU011', email: 'rohan@college.edu', busNo: '101', parentPhone: '9876543220', pickupLocation: 'Hill Station' }
];

mongoose.connect('mongodb://127.0.0.1:27017/college_bus_db')
  .then(async () => {
    console.log('Connected to DB');
    let count = 0;
    for (const s of students) {
      const exists = await User.findOne({ email: s.email });
      if (!exists) {
        await User.create({
          ...s,
          password: 'password123',
          role: 'student'
        });
        count++;
      }
    }
    console.log(`Successfully added ${count} students!`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
