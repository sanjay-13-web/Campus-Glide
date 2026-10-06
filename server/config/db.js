const mongoose = require('mongoose');

const connectDB = async () => {
  // If already connected, do nothing
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  try {
    // Add Vercel serverless optimal options
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected successfully`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
  }
};
module.exports = connectDB;