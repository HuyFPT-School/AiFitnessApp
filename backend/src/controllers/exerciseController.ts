import { Request, Response } from 'express';
import { Exercise, IExercise } from '../models/Exercise';
import { AuthRequest } from '../middleware/authMiddleware';
import { isDbConnected } from '../config/db';

const inMemoryExercises: any[] = [];

// @desc    Get all exercises
// @route   GET /api/exercises
export const getExercises = async (req: Request, res: Response): Promise<void> => {
  try {
    if (isDbConnected) {
      const exercises = await Exercise.find().sort({ createdAt: -1 });
      res.json({ success: true, count: exercises.length, data: exercises });
      return;
    }

    res.json({ success: true, count: inMemoryExercises.length, data: inMemoryExercises });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new AI FitCoach exercise (Admin only)
// @route   POST /api/exercises
export const createExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      nameVi,
      nameEn,
      category,
      difficulty,
      caloriesPerMinute,
      targetMuscles,
      iconName,
      description,
      keyFormRules,
      commonMistakes,
      defaultTargetReps,
      isHoldExercise,
      idealHoldDurationSec,
      cameraAdvice,
      gifUrl,
      customBiomechanics
    } = req.body;

    if (!nameVi || !nameEn) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập tên bài tập tiếng Việt và tiếng Anh.' });
      return;
    }

    const exerciseData = {
      nameVi,
      nameEn,
      category: category || 'Legs',
      difficulty: difficulty || 'Trung bình',
      caloriesPerMinute: Number(caloriesPerMinute) || 8,
      targetMuscles: Array.isArray(targetMuscles)
        ? targetMuscles
        : (targetMuscles || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      iconName: iconName || 'Dumbbell',
      description: description || '',
      keyFormRules: Array.isArray(keyFormRules)
        ? keyFormRules
        : (keyFormRules || '').split('\n').map((s: string) => s.trim()).filter(Boolean),
      commonMistakes: Array.isArray(commonMistakes)
        ? commonMistakes
        : (commonMistakes || '').split('\n').map((s: string) => s.trim()).filter(Boolean),
      defaultTargetReps: Number(defaultTargetReps) || 12,
      isHoldExercise: Boolean(isHoldExercise),
      idealHoldDurationSec: Number(idealHoldDurationSec) || 30,
      cameraAdvice: cameraAdvice || 'Đứng cách camera 2-3m để AI nhận diện tư thế.',
      gifUrl: gifUrl || undefined,
      customBiomechanics: customBiomechanics || {
        primaryAngle: 'leftKnee',
        minAngle: 70,
        maxAngle: 165,
        repThresholdDown: 90,
        repThresholdUp: 155
      },
      createdBy: req.user?._id,
      isCustom: true
    };

    if (isDbConnected) {
      const newExercise = await Exercise.create(exerciseData);
      res.status(201).json({
        success: true,
        message: 'Tạo bài tập AI FitCoach mới thành công!',
        data: newExercise
      });
      return;
    }

    // In-memory fallback
    const memExercise = {
      _id: 'ex_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      ...exerciseData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryExercises.unshift(memExercise);

    res.status(201).json({
      success: true,
      message: 'Tạo bài tập AI FitCoach mới thành công!',
      data: memExercise
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update an exercise (Admin only)
// @route   PUT /api/exercises/:id
export const updateExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.targetMuscles && typeof updates.targetMuscles === 'string') {
      updates.targetMuscles = updates.targetMuscles.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    if (updates.keyFormRules && typeof updates.keyFormRules === 'string') {
      updates.keyFormRules = updates.keyFormRules.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
    if (updates.commonMistakes && typeof updates.commonMistakes === 'string') {
      updates.commonMistakes = updates.commonMistakes.split('\n').map((s: string) => s.trim()).filter(Boolean);
    }
    if (updates.caloriesPerMinute) updates.caloriesPerMinute = Number(updates.caloriesPerMinute);
    if (updates.defaultTargetReps) updates.defaultTargetReps = Number(updates.defaultTargetReps);
    if (updates.idealHoldDurationSec) updates.idealHoldDurationSec = Number(updates.idealHoldDurationSec);

    if (isDbConnected) {
      let updated = await Exercise.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) {
        updated = await Exercise.findOneAndUpdate({ $or: [{ nameVi: id }, { nameEn: id }] }, updates, { new: true });
      }
      if (!updated) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bài tập.' });
        return;
      }
      res.json({ success: true, message: 'Cập nhật bài tập thành công!', data: updated });
      return;
    }

    const index = inMemoryExercises.findIndex(e => e._id === id || e.id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài tập.' });
      return;
    }
    inMemoryExercises[index] = { ...inMemoryExercises[index], ...updates, updatedAt: new Date() };
    res.json({ success: true, message: 'Cập nhật bài tập thành công!', data: inMemoryExercises[index] });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete an exercise (Admin only)
// @route   DELETE /api/exercises/:id
export const deleteExercise = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (isDbConnected) {
      const deleted = await Exercise.findByIdAndDelete(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Không tìm thấy bài tập.' });
        return;
      }
      res.json({ success: true, message: 'Đã xóa bài tập thành công!' });
      return;
    }

    const index = inMemoryExercises.findIndex(e => e._id === id);
    if (index === -1) {
      res.status(404).json({ success: false, message: 'Không tìm thấy bài tập.' });
      return;
    }
    inMemoryExercises.splice(index, 1);
    res.json({ success: true, message: 'Đã xóa bài tập thành công!' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
