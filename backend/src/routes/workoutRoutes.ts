import { Router } from 'express';
import {
  createWorkoutSession,
  getWorkoutHistory,
  getWorkoutStats,
  deleteWorkoutSession
} from '../controllers/workoutController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, createWorkoutSession);
router.get('/', protect, getWorkoutHistory);
router.get('/stats', protect, getWorkoutStats);
router.delete('/:id', protect, deleteWorkoutSession);

export default router;
