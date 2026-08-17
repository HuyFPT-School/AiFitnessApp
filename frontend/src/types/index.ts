export type ExerciseId =
  | 'squat'
  | 'pushup'
  | 'plank'
  | 'lunge'
  | 'bicep_curl'
  | 'jumping_jack'
  | 'shoulder_press'
  | 'warrior_yoga';

export type ExerciseCategory = 'Legs' | 'Chest' | 'Core' | 'Arms' | 'Shoulders' | 'Yoga';

export interface ExerciseInfo {
  id: ExerciseId;
  nameVi: string;
  nameEn: string;
  category: ExerciseCategory;
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
}

export interface Landmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export interface JointAngles {
  leftKnee?: number;
  rightKnee?: number;
  leftHip?: number;
  rightHip?: number;
  leftElbow?: number;
  rightElbow?: number;
  leftShoulder?: number;
  rightShoulder?: number;
  torsoAngle?: number;
  spineStraightness?: number;
  stanceWidthRatio?: number;
  [key: string]: number | undefined;
}

export type ExercisePhase = 'idle' | 'up' | 'down' | 'inflection' | 'holding';

export interface AnalysisFeedback {
  text: string;
  status: 'good' | 'warning' | 'bad';
  score: number;
  repCount: number;
  phase: ExercisePhase;
  holdTimeSeconds?: number;
  keyAngles: JointAngles;
  errorsDetected: string[];
  guidanceTip?: string;
}

export interface RepRecord {
  repNumber: number;
  durationMs: number;
  minPrimaryAngle: number;
  maxPrimaryAngle: number;
  formScore: number;
  status: 'perfect' | 'acceptable' | 'imperfect';
  mistakes: string[];
  timestamp: number;
}

export interface WorkoutSessionSummary {
  exerciseId: ExerciseId;
  exerciseName: string;
  reps: number;
  durationSeconds: number;
  accuracyScore: number;
  mistakes: string[];
  repRecords: RepRecord[];
  snapshotBase64?: string;
}

export interface GeminiAnalysisResult {
  summary: string;
  score: number;
  grade: 'Xuất sắc' | 'Tốt' | 'Cần cải thiện';
  strengths: string[];
  criticalMistakes: string[];
  actionableFixes: string[];
  injuryRiskAlert: string;
  nextWorkoutAdvice: string;
}

export interface WorkoutHistoryItem {
  id: string;
  exerciseId: ExerciseId;
  exerciseName: string;
  date: string;
  reps: number;
  durationSeconds: number;
  accuracyScore: number;
  caloriesBurned: number;
  analysis?: GeminiAnalysisResult;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
}

export interface UserSettings {
  geminiApiKey: string;
  voiceCoachEnabled: boolean;
  repSoundEnabled: boolean;
  voiceSpeed: number;
  voicePitch: number;
  cameraMirror: boolean;
  countdownSeconds: number;
  skeletonLineColor: string;
  skeletonJointColor: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
}

/* ==========================================================================
   NUTRITION & FOOD SCANNER TYPES
   ========================================================================== */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodIngredient {
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface ExerciseBurnEstimate {
  exerciseId: ExerciseId;
  exerciseNameVi: string;
  durationMinutes: number;
  repsEstimate?: number;
}

export interface FoodScanResult {
  dishName: string;
  dishNameEn?: string;
  confidenceScore: number;
  totalCalories: number;
  servingSize: string; // e.g. "1 đĩa tiêu chuẩn (~420g)"
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar?: number;
    sodiumMg?: number;
  };
  ingredients: FoodIngredient[];
  burnEstimates: ExerciseBurnEstimate[];
  dietaryAdvice: {
    muscleBuilding: string;
    fatLoss: string;
    overallAssessment: string;
    healthierAlternative?: string;
  };
  healthScore: number; // 1-100
  glycemicIndex?: 'Thấp' | 'Trung bình' | 'Cao';
  imageBase64?: string;
}

export interface MealLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
  timestamp: number;
  mealType: MealType;
  dishName: string;
  servingPortion: number; // multiplier e.g. 1.0, 1.5, 0.5
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients: FoodIngredient[];
  imageBase64?: string;
}

export interface DailyNutritionSummary {
  date: string;
  targetCalories: number;
  totalCalories: number;
  remainingCalories: number;
  targetMacros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  consumedMacros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  meals: MealLogItem[];
}

/* ==========================================================================
   USER & AUTH TYPES
   ========================================================================== */

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: 'user' | 'admin';
  heightCm: number;
  weightKg: number;
  fitnessGoal?: 'hypertrophy' | 'fat_loss' | 'endurance' | 'mobility';
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  token?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: UserProfile;
}

/* ==========================================================================
   AI WORKOUT ROUTINE GENERATOR TYPES
   ========================================================================== */

export interface WorkoutRoutineInput {
  goal: 'hypertrophy' | 'hiit' | 'posture' | 'abs' | 'mobility';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  focusArea: 'fullbody' | 'lower' | 'upper' | 'core';
}

export interface WarmUpItem {
  name: string;
  durationSeconds: number;
  instruction: string;
}

export interface RoutineExerciseItem {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEn: string;
  sets: number;
  reps: number;
  isHold?: boolean;
  restSeconds: number;
  formCue: string;
  targetMuscle: string;
  gifUrl?: string;
}

export interface CoolDownItem {
  name: string;
  durationSeconds: number;
  instruction: string;
}

export interface WorkoutRoutine {
  title: string;
  goal: string;
  level: string;
  durationMinutes: number;
  estimatedCalories: number;
  overview: string;
  warmUp: WarmUpItem[];
  mainRoutine: RoutineExerciseItem[];
  coolDown: CoolDownItem[];
  coachTip: string;
}


