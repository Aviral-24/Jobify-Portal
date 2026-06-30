import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '.env') });

export const connectDB = async () => {
  try {
    // 'localhost' ki jagah '127.0.0.1' ka use karna modern Node.js versions ke liye best practice hai
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/jobify';
    
    const conn = await mongoose.connect(mongoURI);
    
    // Ye console.log tumhe exactly batayega ki connection local par hai ya Cloud (Atlas) par
    console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

export default connectDB;