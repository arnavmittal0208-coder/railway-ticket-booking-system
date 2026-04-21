const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();
  const configuredDbName = String(process.env.MONGODB_DB_NAME || "").trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is empty. Add your Atlas connection string in Render environment variables.");
  }

  const explicitDbMatch = mongoUri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const explicitDbName = explicitDbMatch?.[1] ? decodeURIComponent(explicitDbMatch[1]) : "";
  const resolvedDbName = explicitDbName || configuredDbName;

  if (!resolvedDbName) {
    throw new Error(
      "MongoDB database is not specified. Add a database in MONGODB_URI (e.g. /railwayreservation) or set MONGODB_DB_NAME."
    );
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      dbName: resolvedDbName,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 20,
      minPoolSize: 0,
      maxIdleTimeMS: 30000,
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    const message = error?.message || "Unknown MongoDB connection error";
    throw new Error(`MongoDB connection failed: ${message}`);
  }
};

module.exports = connectDB;
