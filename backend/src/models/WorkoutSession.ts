import mongoose, { Document, Schema } from 'mongoose';

export interface IRepRecord {
  repNumber: number;
  durationMs: number;
  minPrimaryAngle: number;
  maxPrimaryAngle: number;
  formScore: number;
  status: 'perfect' | 'acceptable' | 'imperfect';
  mistakes: string[];
  timestamp: number;
}

export interface IGeminiAnalysis {
  summary: string;
  score: number;
  grade: 'Xuất sắc' | 'Tốt' | 'Cần cải thiện';
  strengths: string[];
  criticalMistakes: string[];
  actionableFixes: string[];
  injuryRiskAlert: string;
  nextWorkoutAdvice: string;
}

export interface IWorkoutSession extends Document {
  user?: mongoose.Types.ObjectId;
  exerciseId: string;
  exerciseName: string;
  date: string;
  reps: number;
  durationSeconds: number;
  accuracyScore: number;
  caloriesBurned: number;
  mistakes: string[];
  repRecords: IRepRecord[];
  analysis?: IGeminiAnalysis;
  snapshotBase64?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSessionSchema = new Schema<IWorkoutSession>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    exerciseId: {
      type: String,
      required: true,
      index: true
    },
    exerciseName: {
      type: String,
      required: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    reps: {
      type: Number,
      required: true,
      default: 0
    },
    durationSeconds: {
      type: Number,
      required: true,
      default: 0
    },
    accuracyScore: {
      type: Number,
      required: true,
      default: 85
    },
    caloriesBurned: {
      type: Number,
      required: true,
      default: 0
    },
    mistakes: {
      type: [String],
      default: []
    },
    repRecords: {
      type: [
        {
          repNumber: Number,
          durationMs: Number,
          minPrimaryAngle: Number,
          maxPrimaryAngle: Number,
          formScore: Number,
          status: String,
          mistakes: [String],
          timestamp: Number
        }
      ],
      default: []
    },
    analysis: {
      summary: String,
      score: Number,
      grade: String,
      strengths: [String],
      criticalMistakes: [String],
      actionableFixes: [String],
      injuryRiskAlert: String,
      nextWorkoutAdvice: String
    },
    snapshotBase64: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const WorkoutSession = mongoose.model<IWorkoutSession>('WorkoutSession', WorkoutSessionSchema);
