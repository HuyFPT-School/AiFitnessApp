import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarUrl?: string;
  googleId?: string;
  authProvider: 'local' | 'google';
  role: 'user' | 'admin';
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: 'hypertrophy' | 'fat_loss' | 'maintenance' | 'endurance';
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbsTarget: number;
  dailyFatTarget: number;
  voiceCoachEnabled: boolean;
  voiceSpeed: number;
  cameraMirror: boolean;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true
    },
    avatarUrl: {
      type: String
    },
    googleId: {
      type: String
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local'
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    password: {
      type: String,
      required: function (this: any) {
        return this.authProvider === 'local';
      },
      minlength: 6,
      select: false
    },
    heightCm: {
      type: Number,
      default: 172
    },
    weightKg: {
      type: Number,
      default: 68
    },
    fitnessGoal: {
      type: String,
      enum: ['hypertrophy', 'fat_loss', 'maintenance', 'endurance'],
      default: 'hypertrophy'
    },
    dailyCalorieTarget: {
      type: Number,
      default: 2000
    },
    dailyProteinTarget: {
      type: Number,
      default: 130
    },
    dailyCarbsTarget: {
      type: Number,
      default: 220
    },
    dailyFatTarget: {
      type: Number,
      default: 55
    },
    voiceCoachEnabled: {
      type: Boolean,
      default: true
    },
    voiceSpeed: {
      type: Number,
      default: 1.05
    },
    cameraMirror: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
