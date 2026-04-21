const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();
  if (!mongoUri) {
    throw new Error("MONGODB_URI is empty. Add your Atlas connection string in Render environment variables.");
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    const message = error?.message || "Unknown MongoDB connection error";
    throw new Error(`MongoDB connection failed: ${message}`);
  }
};

module.exports = connectDB;
