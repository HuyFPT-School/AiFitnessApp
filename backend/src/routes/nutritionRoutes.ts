import { Router } from 'express';
import {
  logMeal,
  getMeals,
  getDailyNutrition,
  deleteMeal
} from '../controllers/nutritionController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/meals', protect, logMeal);
router.get('/meals', protect, getMeals);
router.get('/daily', protect, getDailyNutrition);
router.delete('/meals/:id', protect, deleteMeal);

export default router;
