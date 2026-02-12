import mongoose from "mongoose";
import { env } from "./env";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      dbName: env.DB_NAME,
    });

    console.log(
      `🍃 MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`
    );
  } catch (error) {
    console.error(
      `❌ Database Connection Error: ${(error as Error).message}`
    );
    process.exit(1);
  }
};

export default connectDB;
