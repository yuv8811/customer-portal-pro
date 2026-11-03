import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/customer_portal_pro";

declare global {
  // eslint-disable-next-line no-var
  var mongooseConnectionPromise: Promise<typeof mongoose> | undefined;
}

export async function connectMongoose(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global.mongooseConnectionPromise) {
    global.mongooseConnectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
  }

  try {
    return await global.mongooseConnectionPromise;
  } catch (error) {
    global.mongooseConnectionPromise = undefined;
    throw error;
  }
}

export default mongoose;

