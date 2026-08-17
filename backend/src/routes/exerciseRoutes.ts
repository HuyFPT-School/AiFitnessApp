import { Router } from 'express';
import {
  getExercises,
  createExercise,
  updateExercise,
  deleteExercise
} from '../controllers/exerciseController';
import { protect, authorizeAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getExercises);
router.post('/', protect, authorizeAdmin, createExercise);
router.put('/:id', protect, authorizeAdmin, updateExercise);
router.delete('/:id', protect, authorizeAdmin, deleteExercise);

export default router;
