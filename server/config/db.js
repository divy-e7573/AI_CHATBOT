import mongoose from "mongoose";

/**
 * Connect to MongoDB using the connection string in MONGO_URI.
 * Throws if the connection fails so the caller can decide how to handle it.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
  return conn;
};

export default connectDB;
