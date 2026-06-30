import { readFile } from 'fs/promises';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from 'mongoose';
import { hashPassword } from './utils/passwordUtils.js';
import User from './models/User.js';
import Job from './models/Job.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: resolve(__dirname, '.env') });

try {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/jobify';
  await mongoose.connect(mongoURI);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ email: 'john@gmail.com' });
  if (!user) {
    const hashedPassword = await hashPassword('password123');
    user = new User({
      name: 'John Doe',
      email: 'john@gmail.com',
      password: hashedPassword,
      location: 'my city',
      lastName: 'Doe',
      role: 'admin',
    });
    await user.save();
  }

  const jsonJobs = JSON.parse(
    await readFile(new URL('./utils/mockData.json', import.meta.url))
  );

  await Job.deleteMany({ createdBy: user._id });

  const jobs = jsonJobs.map((job) => ({
    company: job.company,
    position: job.position,
    jobStatus: job.jobStatus,
    jobType: job.jobType,
    jobLocation: job.jobLocation,
    createdBy: user._id,
  }));

  await Job.insertMany(jobs);

  console.log('Success!!!');
  await mongoose.connection.close();
  process.exit(0);
} catch (error) {
  console.log(error);
  process.exit(1);
}

