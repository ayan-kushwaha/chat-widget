import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME;

  if (!uri) {
    throw new Error("❌ MONGO_URI not defined in environment variables");
  }

  try {
    await mongoose.connect(uri, { dbName });
    console.log(`✅ MongoDB connected to: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
};
