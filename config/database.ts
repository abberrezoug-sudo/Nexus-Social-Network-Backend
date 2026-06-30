import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MongoDB URI not configured. Skipping database connection.");
    return;
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};
