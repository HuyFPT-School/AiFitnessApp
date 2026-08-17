import mongoose, { Document, Schema } from 'mongoose';

export interface IExercise extends Document {
  id?: string;
  nameVi: string;
  nameEn: string;
  category: 'Legs' | 'Chest' | 'Core' | 'Arms' | 'Shoulders' | 'Yoga' | 'FullBody';
  difficulty: 'Dễ' | 'Trung bình' | 'Nâng cao';
  caloriesPerMinute: number;
  targetMuscles: string[];
  iconName: string;
  description: string;
  keyFormRules: string[];
  commonMistakes: string[];
  defaultTargetReps: number;
  isHoldExercise?: boolean;
  idealHoldDurationSec?: number;
  cameraAdvice: string;
  gifUrl?: string;
  customBiomechanics?: {
    primaryAngle?: string;
    minAngle?: number;
    maxAngle?: number;
    repThresholdDown?: number;
    repThresholdUp?: number;
  };
  createdBy?: mongoose.Types.ObjectId;
  isCustom: boolean;
}

const ExerciseSchema = new Schema<IExercise>(
  {
    nameVi: {
      type: String,
      required: [true, 'Vui lòng nhập tên bài tập tiếng Việt'],
      trim: true
    },
    nameEn: {
      type: String,
      required: [true, 'Vui lòng nhập tên bài tập tiếng Anh'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Legs', 'Chest', 'Core', 'Arms', 'Shoulders', 'Yoga', 'FullBody'],
      default: 'Legs'
    },
    difficulty: {
      type: String,
      enum: ['Dễ', 'Trung bình', 'Nâng cao'],
      default: 'Trung bình'
    },
    caloriesPerMinute: {
      type: Number,
      default: 8
    },
    targetMuscles: {
      type: [String],
      default: []
    },
    iconName: {
      type: String,
      default: 'Dumbbell'
    },
    description: {
      type: String,
      default: ''
    },
    keyFormRules: {
      type: [String],
      default: []
    },
    commonMistakes: {
      type: [String],
      default: []
    },
    defaultTargetReps: {
      type: Number,
      default: 12
    },
    isHoldExercise: {
      type: Boolean,
      default: false
    },
    idealHoldDurationSec: {
      type: Number,
      default: 30
    },
    cameraAdvice: {
      type: String,
      default: 'Đứng cách camera 2-3m để AI quan sát toàn thân.'
    },
    gifUrl: {
      type: String
    },
    customBiomechanics: {
      primaryAngle: { type: String, default: 'leftKnee' },
      minAngle: { type: Number, default: 70 },
      maxAngle: { type: Number, default: 165 },
      repThresholdDown: { type: Number, default: 90 },
      repThresholdUp: { type: Number, default: 155 }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isCustom: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Exercise = mongoose.model<IExercise>('Exercise', ExerciseSchema);
