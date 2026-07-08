import mongoose from "mongoose";

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI;

  if (!mongoUri) {
    console.warn("MongoDB URI not configured. Skipping database connection.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected");
  } catch (error) {
    console.warn("MongoDB unavailable. Falling back to local JSON storage.");
    console.warn(error instanceof Error ? error.message : error);
  }
};
