import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodIngredient {
  name: string;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
}

export interface IMealLog extends Document {
  user?: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  timeStr: string;
  timestamp: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  dishName: string;
  servingPortion: number;
  calories: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  ingredients: IFoodIngredient[];
  imageBase64?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MealLogSchema = new Schema<IMealLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    timeStr: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    },
    mealType: {
      type: String,
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      required: true,
      default: 'lunch'
    },
    dishName: {
      type: String,
      required: true
    },
    servingPortion: {
      type: Number,
      default: 1.0
    },
    calories: {
      type: Number,
      required: true
    },
    macros: {
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
      fiber: { type: Number, default: 0 }
    },
    ingredients: [
      {
        name: String,
        weightGrams: Number,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number
      }
    ],
    imageBase64: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const MealLog = mongoose.model<IMealLog>('MealLog', MealLogSchema);
