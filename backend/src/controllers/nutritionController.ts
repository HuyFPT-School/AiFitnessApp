import { Response } from 'express';
import { MealLog } from '../models/MealLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { isDbConnected } from '../config/db';

const inMemoryMeals: any[] = [];

// @desc    Log a new meal
// @route   POST /api/nutrition/meals
export const logMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      date,
      timeStr,
      timestamp,
      mealType,
      dishName,
      servingPortion,
      calories,
      macros,
      ingredients,
      imageBase64
    } = req.body;

    const now = new Date();
    const mealData = {
      user: req.user?._id,
      date: date || now.toISOString().split('T')[0],
      timeStr: timeStr || now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      timestamp: timestamp || Date.now(),
      mealType: mealType || 'lunch',
      dishName,
      servingPortion: servingPortion || 1.0,
      calories: Number(calories) || 0,
      macros: macros || { protein: 0, carbs: 0, fat: 0, fiber: 0 },
      ingredients: ingredients || [],
      imageBase64
    };

    if (isDbConnected) {
      try {
        const meal = await MealLog.create(mealData);
        res.status(201).json({ success: true, data: meal });
        return;
      } catch (dbErr) {
        console.warn('DB meal write failed, fallback in-memory:', dbErr);
      }
    }

    const mockMeal = { ...mealData, _id: 'mem_meal_' + Date.now(), createdAt: new Date() };
    inMemoryMeals.unshift(mockMeal);
    res.status(201).json({ success: true, data: mockMeal });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all meals history
// @route   GET /api/nutrition/meals
export const getMeals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let meals = [];
    const userId = req.user?._id;
    const filter = userId ? { user: userId } : { user: null };

    if (isDbConnected) {
      try {
        meals = await MealLog.find(filter).sort({ timestamp: -1 }).limit(100);
      } catch {
        meals = inMemoryMeals.filter(m => (userId ? String(m.user) === String(userId) : !m.user));
      }
    } else {
      meals = inMemoryMeals.filter(m => (userId ? String(m.user) === String(userId) : !m.user));
    }

    res.json({ success: true, count: meals.length, data: meals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get daily nutrition summary and breakdown
// @route   GET /api/nutrition/daily?date=YYYY-MM-DD
export const getDailyNutrition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetDate = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const userId = req.user?._id;
    const filter: any = { date: targetDate, user: userId ? userId : null };

    let dayMeals = [];
    if (isDbConnected) {
      try {
        dayMeals = await MealLog.find(filter).sort({ timestamp: -1 });
      } catch {
        dayMeals = inMemoryMeals.filter(m => m.date === targetDate && (userId ? String(m.user) === String(userId) : !m.user));
      }
    } else {
      dayMeals = inMemoryMeals.filter(m => m.date === targetDate && (userId ? String(m.user) === String(userId) : !m.user));
    }

    const totalCalories = dayMeals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const consumedProtein = dayMeals.reduce((sum, m) => sum + (m.macros?.protein || 0), 0);
    const consumedCarbs = dayMeals.reduce((sum, m) => sum + (m.macros?.carbs || 0), 0);
    const consumedFat = dayMeals.reduce((sum, m) => sum + (m.macros?.fat || 0), 0);
    const consumedFiber = dayMeals.reduce((sum, m) => sum + (m.macros?.fiber || 0), 0);

    const targetCalories = req.user?.dailyCalorieTarget || 2000;
    const targetProtein = req.user?.dailyProteinTarget || 130;
    const targetCarbs = req.user?.dailyCarbsTarget || 220;
    const targetFat = req.user?.dailyFatTarget || 55;

    res.json({
      success: true,
      data: {
        date: targetDate,
        targetCalories,
        totalCalories,
        remainingCalories: Math.max(0, targetCalories - totalCalories),
        targetMacros: {
          protein: targetProtein,
          carbs: targetCarbs,
          fat: targetFat
        },
        consumedMacros: {
          protein: Math.round(consumedProtein * 10) / 10,
          carbs: Math.round(consumedCarbs * 10) / 10,
          fat: Math.round(consumedFat * 10) / 10,
          fiber: Math.round(consumedFiber * 10) / 10
        },
        meals: dayMeals
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a meal log
// @route   DELETE /api/nutrition/meals/:id
export const deleteMeal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (isDbConnected) {
      try {
        await MealLog.findByIdAndDelete(id);
      } catch {
        // Fallback
      }
    }
    const idx = inMemoryMeals.findIndex(m => m._id === id);
    if (idx !== -1) inMemoryMeals.splice(idx, 1);

    res.json({ success: true, message: 'Đã xóa bữa ăn khỏi nhật ký.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
