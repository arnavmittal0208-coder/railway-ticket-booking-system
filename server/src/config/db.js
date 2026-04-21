const mongoose = require("mongoose");

const connectDB = async () => {
  const mongoUri = String(process.env.MONGODB_URI || "").trim();
  const configuredDbName = String(process.env.MONGODB_DB_NAME || "").trim();
  const fallbackDbName = "railwayreservation";

  if (!mongoUri) {
    throw new Error("MONGODB_URI is empty. Add your Atlas connection string in Render environment variables.");
  }

  const explicitDbMatch = mongoUri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/i);
  const explicitDbName = explicitDbMatch?.[1] ? decodeURIComponent(explicitDbMatch[1]) : "";
  const resolvedDbName = configuredDbName || explicitDbName || fallbackDbName;

  try {
    if (configuredDbName && explicitDbName && configuredDbName !== explicitDbName) {
      console.warn(
        `MongoDB database mismatch detected. Using MONGODB_DB_NAME=${configuredDbName} instead of URI database ${explicitDbName}.`
      );
    }

    if (!configuredDbName && !explicitDbName) {
      console.warn(`MongoDB database not specified. Falling back to default database: ${fallbackDbName}.`);
    }

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
