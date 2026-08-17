import mongoose from 'mongoose';

export let isDbConnected = false;

const ATLAS_URI =
  'mongodb://huylmnse181744_db_user:HvqaBt0DKPNwl2Ac@ac-jlbdfux-shard-00-00.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-01.zkxc7w1.mongodb.net:27017,ac-jlbdfux-shard-00-02.zkxc7w1.mongodb.net:27017/FitnessApp?ssl=true&authSource=admin';

let cachedPromise: Promise<typeof mongoose | null> | null = null;

export const connectDB = async (): Promise<typeof mongoose | null> => {
  if (mongoose.connection.readyState >= 1) {
    isDbConnected = true;
    return mongoose;
  }

  const mongoUri = process.env.MONGO_URI || ATLAS_URI;

  if (!cachedPromise) {
    mongoose.set('strictQuery', false);
    cachedPromise = mongoose
      .connect(mongoUri, {
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 6000
      })
      .then(m => {
        isDbConnected = true;
        console.log('✅ MongoDB Connected successfully');
        return m;
      })
      .catch((err: any) => {
        cachedPromise = null;
        isDbConnected = false;
        console.warn('⚠️ MongoDB connection warning:', err.message);
        return null;
      });
  }

  return cachedPromise;
};
