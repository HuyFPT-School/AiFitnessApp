import { Response } from 'express';
import { WorkoutSession } from '../models/WorkoutSession';
import { AuthRequest } from '../middleware/authMiddleware';
import { isDbConnected } from '../config/db';
import { getCache, setCache, flushCachePattern } from '../config/redis';

const inMemoryWorkouts: any[] = [];

// @desc    Create a new workout session record
// @route   POST /api/workouts
export const createWorkoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      exerciseId,
      exerciseName,
      date,
      reps,
      durationSeconds,
      accuracyScore,
      caloriesBurned,
      mistakes,
      repRecords,
      analysis,
      snapshotBase64
    } = req.body;

    const workoutData = {
      user: req.user?._id,
      exerciseId,
      exerciseName,
      date: date || new Date().toISOString().split('T')[0],
      reps: Number(reps) || 0,
      durationSeconds: Number(durationSeconds) || 0,
      accuracyScore: Number(accuracyScore) || 85,
      caloriesBurned: Number(caloriesBurned) || 0,
      mistakes: mistakes || [],
      repRecords: repRecords || [],
      analysis,
      snapshotBase64
    };

    const userId = req.user?._id ? String(req.user._id) : 'guest';

    if (isDbConnected) {
      try {
        const workout = await WorkoutSession.create(workoutData);
        await flushCachePattern(`cache:workout*:${userId}*`);
        await flushCachePattern('cache:workouts:*');
        res.status(201).json({ success: true, data: workout });
        return;
      } catch (dbErr) {
        console.warn('DB write failed, fallback in-memory:', dbErr);
      }
    }

    const mockItem = { ...workoutData, _id: 'mem_' + Date.now(), createdAt: new Date() };
    inMemoryWorkouts.unshift(mockItem);
    await flushCachePattern(`cache:workout*:${userId}*`);
    res.status(201).json({ success: true, data: mockItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all workout history (with Redis Caching)
// @route   GET /api/workouts
export const getWorkoutHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id ? String(req.user._id) : 'guest';
    const cacheKey = `cache:workouts:${userId}`;

    // 1. Check Redis Cache
    const cachedWorkouts = await getCache<any[]>(cacheKey);
    if (cachedWorkouts && Array.isArray(cachedWorkouts)) {
      res.json({ success: true, count: cachedWorkouts.length, data: cachedWorkouts, cached: true });
      return;
    }

    let workouts = [];

    if (isDbConnected) {
      try {
        const filter: any = req.user?._id ? { $or: [{ user: req.user._id }, { user: null }] } : {};
        workouts = await WorkoutSession.find(filter).sort({ createdAt: -1 }).limit(100);
      } catch {
        workouts = inMemoryWorkouts.filter(w => (req.user?._id ? String(w.user) === String(req.user._id) : true));
      }
    } else {
      workouts = inMemoryWorkouts.filter(w => (req.user?._id ? String(w.user) === String(req.user._id) : true));
    }

    // Cache for 300 seconds
    await setCache(cacheKey, workouts, 300);

    res.json({ success: true, count: workouts.length, data: workouts, cached: false });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get overall workout statistics (with Redis Caching)
// @route   GET /api/workouts/stats
export const getWorkoutStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id ? String(req.user._id) : 'guest';
    const cacheKey = `cache:workout_stats:${userId}`;

    const cachedStats = await getCache<any>(cacheKey);
    if (cachedStats) {
      res.json({ success: true, data: cachedStats, cached: true });
      return;
    }

    let workouts = [];

    if (isDbConnected) {
      try {
        const filter: any = req.user?._id ? { $or: [{ user: req.user._id }, { user: null }] } : {};
        workouts = await WorkoutSession.find(filter);
      } catch {
        workouts = inMemoryWorkouts.filter(w => (req.user?._id ? String(w.user) === String(req.user._id) : true));
      }
    } else {
      workouts = inMemoryWorkouts.filter(w => (req.user?._id ? String(w.user) === String(req.user._id) : true));
    }

    const totalWorkouts = workouts.length;
    const totalReps = workouts.reduce((sum, w) => sum + (w.reps || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalDurationSeconds = workouts.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);
    const avgScore = totalWorkouts > 0
      ? Math.round(workouts.reduce((sum, w) => sum + (w.accuracyScore || 85), 0) / totalWorkouts)
      : 85;

    const uniqueDates = Array.from(new Set(workouts.map(w => w.date || w.createdAt?.toISOString?.().split('T')[0]))).filter(Boolean);

    const statsData = {
      totalWorkouts,
      totalReps,
      totalCalories,
      totalDurationSeconds,
      averageAccuracyScore: avgScore,
      streakDays: uniqueDates.length || 1,
      activeDates: uniqueDates
    };

    // Cache stats for 300 seconds
    await setCache(cacheKey, statsData, 300);

    res.json({
      success: true,
      data: statsData,
      cached: false
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a workout session
// @route   DELETE /api/workouts/:id
export const deleteWorkoutSession = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id ? String(req.user._id) : 'guest';

    if (isDbConnected) {
      try {
        await WorkoutSession.findByIdAndDelete(id);
      } catch {
        // Fallback
      }
    }
    const idx = inMemoryWorkouts.findIndex(w => w._id === id);
    if (idx !== -1) inMemoryWorkouts.splice(idx, 1);

    await flushCachePattern(`cache:workout*:${userId}*`);
    await flushCachePattern('cache:workouts:*');

    res.json({ success: true, message: 'Đã xóa buổi tập thành công.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
