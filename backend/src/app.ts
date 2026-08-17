import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import workoutRoutes from './routes/workoutRoutes';
import nutritionRoutes from './routes/nutritionRoutes';
import aiRoutes from './routes/aiRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Connect to MongoDB
connectDB().catch(err => console.warn('DB connect error:', err));

// Middleware
app.use(
  cors({
    origin: '*',
    credentials: true
  })
);
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Router that handles both /api/xxx and direct /xxx routes
const apiRouter = express.Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: '🚀 AI FitCoach Backend API is running smoothly',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

apiRouter.use('/auth', authRoutes);
apiRouter.use('/workouts', workoutRoutes);
apiRouter.use('/nutrition', nutritionRoutes);
apiRouter.use('/ai', aiRoutes);
apiRouter.use('/exercises', exerciseRoutes);

// Mount router on both /api and root /
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Catch all unmatched routes to prevent hanging
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.method} ${req.originalUrl || req.url} not found`
  });
});

// Error Handling Middleware
app.use(errorHandler);

export default app;
