import 'express-async-errors';
import * as dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cloudinary from 'cloudinary';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import connectDB from './db.js';
import cors from 'cors'; // 🔥 ADDED CORS

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();

// routers
import jobRouter from './routes/jobRouter.js';
import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';

// middleware
import errorHandlerMiddleware from './middleware/errorHandlerMiddleware.js';
import { authenticateUser } from './middleware/authMiddleware.js';

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// 🔥 CORS setup (Vercel (Frontend) se Render (Backend) API call karne aur Cookies bhejane ke liye)
app.use(cors({
  origin: [
    'http://localhost:5173', // Local frontend ke liye (Vite default)
    'http://localhost:3000', // Local frontend ke liye (React default)
    process.env.FRONTEND_URL // Vercel link ke liye
  ], 
  credentials: true, // Important: Iske bina frontend par JWT cookies set nahi hongi
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(cookieParser());
app.use(express.json());
app.use(helmet());
app.use(mongoSanitize());

// ✅ Welcome Route (Backend Check karne ke liye)
app.get('/', (req, res) => {
  res.send('Jobify Backend is Running perfectly! 🚀');
});

app.get('/api/v1/test', (req, res) => {
  res.json({ msg: 'test route' });
});

// API Routes
app.use('/api/v1/jobs', authenticateUser, jobRouter);
app.use('/api/v1/users', authenticateUser, userRouter);
app.use('/api/v1/auth', authRouter);

// Undefined API routes ke liye 404
app.use('*', (req, res) => {
  res.status(404).json({ msg: 'Route not found' });
});

// Error handling middleware
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 5100;

try {
  await connectDB();
  app.listen(port, () => {
    console.log(`server running on PORT ${port}...`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}