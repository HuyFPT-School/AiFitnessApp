import { Response } from 'express';
import { WorkoutSession } from '../models/WorkoutSession';
import { AuthRequest } from '../middleware/authMiddleware';
import { isDbConnected } from '../config/db';

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

    if (isDbConnected) {
      try {
        const workout = await WorkoutSession.create(workoutData);
        res.status(201).json({ success: true, data: workout });
        return;
      } catch (dbErr) {
        console.warn('DB write failed, fallback in-memory:', dbErr);
      }
    }

    const mockItem = { ...workoutData, _id: 'mem_' + Date.now(), createdAt: new Date() };
    inMemoryWorkouts.unshift(mockItem);
    res.status(201).json({ success: true, data: mockItem });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all workout history
// @route   GET /api/workouts
export const getWorkoutHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let workouts = [];
    const userId = req.user?._id;

    if (isDbConnected) {
      try {
        const filter: any = userId ? { $or: [{ user: userId }, { user: null }] } : {};
        workouts = await WorkoutSession.find(filter).sort({ createdAt: -1 }).limit(100);
      } catch {
        workouts = inMemoryWorkouts.filter(w => (userId ? String(w.user) === String(userId) : true));
      }
    } else {
      workouts = inMemoryWorkouts.filter(w => (userId ? String(w.user) === String(userId) : true));
    }

    res.json({ success: true, count: workouts.length, data: workouts });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get overall workout statistics
// @route   GET /api/workouts/stats
export const getWorkoutStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let workouts = [];
    const userId = req.user?._id;

    if (isDbConnected) {
      try {
        const filter: any = userId ? { $or: [{ user: userId }, { user: null }] } : {};
        workouts = await WorkoutSession.find(filter);
      } catch {
        workouts = inMemoryWorkouts.filter(w => (userId ? String(w.user) === String(userId) : true));
      }
    } else {
      workouts = inMemoryWorkouts.filter(w => (userId ? String(w.user) === String(userId) : true));
    }

    const totalWorkouts = workouts.length;
    const totalReps = workouts.reduce((sum, w) => sum + (w.reps || 0), 0);
    const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalDurationSeconds = workouts.reduce((sum, w) => sum + (w.durationSeconds || 0), 0);
    const avgScore = totalWorkouts > 0
      ? Math.round(workouts.reduce((sum, w) => sum + (w.accuracyScore || 85), 0) / totalWorkouts)
      : 85;

    const uniqueDates = Array.from(new Set(workouts.map(w => w.date || w.createdAt?.toISOString?.().split('T')[0]))).filter(Boolean);

    res.json({
      success: true,
      data: {
        totalWorkouts,
        totalReps,
        totalCalories,
        totalDurationSeconds,
        averageAccuracyScore: avgScore,
        streakDays: uniqueDates.length || 1,
        activeDates: uniqueDates
      }
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
    if (isDbConnected) {
      try {
        await WorkoutSession.findByIdAndDelete(id);
      } catch {
        // Fallback
      }
    }
    const idx = inMemoryWorkouts.findIndex(w => w._id === id);
    if (idx !== -1) inMemoryWorkouts.splice(idx, 1);

    res.json({ success: true, message: 'Đã xóa buổi tập thành công.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
