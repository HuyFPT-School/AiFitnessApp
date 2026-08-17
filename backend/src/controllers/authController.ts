import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';
import { isDbConnected } from '../config/db';

export const inMemoryUsers: any[] = [];

const generateToken = (id: string): string => {
  const secret = process.env.JWT_SECRET || 'aifitcoach_super_secret_jwt_key_2026_jwt_token';
  return jwt.sign({ id }, secret, { expiresIn: '30d' });
};

// Check if user is admin
const determineRole = (email: string, role?: string): 'user' | 'admin' => {
  const adminEmails = ['luumynhathuy@gmail.com', 'admin@fitcoach.ai', 'admin@fitnessapp.vn'];
  if (adminEmails.includes(email.toLowerCase().trim())) {
    return 'admin';
  }
  return role === 'admin' ? 'admin' : 'user';
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, heightCm, weightKg, fitnessGoal, role } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userRole = determineRole(normalizedEmail, role);

    if (isDbConnected) {
      try {
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
          res.status(400).json({ success: false, message: 'Email này đã được đăng ký.' });
          return;
        }

        const user = await User.create({
          name,
          email: normalizedEmail,
          password,
          role: userRole,
          authProvider: 'local',
          heightCm: heightCm || 172,
          weightKg: weightKg || 68,
          fitnessGoal: fitnessGoal || 'hypertrophy'
        });

        res.status(201).json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatarUrl: user.avatarUrl,
            heightCm: user.heightCm,
            weightKg: user.weightKg,
            dailyCalorieTarget: user.dailyCalorieTarget,
            dailyProteinTarget: user.dailyProteinTarget,
            dailyCarbsTarget: user.dailyCarbsTarget,
            dailyFatTarget: user.dailyFatTarget,
            token: generateToken(user._id.toString())
          }
        });
        return;
      } catch (dbErr) {
        console.warn('MongoDB query failed, using in-memory mode:', dbErr);
      }
    }

    // In-memory fallback
    const memUserExists = inMemoryUsers.find(u => u.email === normalizedEmail);
    if (memUserExists) {
      res.status(400).json({ success: false, message: 'Email này đã được đăng ký.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      _id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole,
      authProvider: 'local',
      heightCm: Number(heightCm) || 172,
      weightKg: Number(weightKg) || 68,
      fitnessGoal: fitnessGoal || 'hypertrophy',
      dailyCalorieTarget: 2000,
      dailyProteinTarget: 130,
      dailyCarbsTarget: 220,
      dailyFatTarget: 55,
      createdAt: new Date()
    };

    inMemoryUsers.push(newUser);

    res.status(201).json({
      success: true,
      data: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatarUrl: undefined,
        heightCm: newUser.heightCm,
        weightKg: newUser.weightKg,
        dailyCalorieTarget: newUser.dailyCalorieTarget,
        dailyProteinTarget: newUser.dailyProteinTarget,
        dailyCarbsTarget: newUser.dailyCarbsTarget,
        dailyFatTarget: newUser.dailyFatTarget,
        token: generateToken(newUser._id)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (isDbConnected) {
      try {
        const user = await User.findOne({ email: normalizedEmail }).select('+password');
        if (user) {
          if (user.authProvider === 'google' && !user.password) {
            res.status(400).json({
              success: false,
              message: 'Tài khoản này được đăng ký qua Google. Vui lòng nhấn "Tiếp tục với Google" để đăng nhập.'
            });
            return;
          }

          if (await user.matchPassword(password)) {
            // Update admin role if matching admin email
            const effectiveRole = determineRole(user.email, user.role);
            if (user.role !== effectiveRole) {
              user.role = effectiveRole;
              await user.save();
            }

            res.json({
              success: true,
              data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: effectiveRole,
                avatarUrl: user.avatarUrl,
                heightCm: user.heightCm,
                weightKg: user.weightKg,
                dailyCalorieTarget: user.dailyCalorieTarget,
                dailyProteinTarget: user.dailyProteinTarget,
                dailyCarbsTarget: user.dailyCarbsTarget,
                dailyFatTarget: user.dailyFatTarget,
                token: generateToken(user._id.toString())
              }
            });
            return;
          }
        }
      } catch (dbErr) {
        console.warn('MongoDB query failed, using in-memory mode:', dbErr);
      }
    }

    // In-memory fallback
    const memUser = inMemoryUsers.find(u => u.email === normalizedEmail);
    if (!memUser || !(await bcrypt.compare(password, memUser.password))) {
      // Demo user auto-login convenience
      if (normalizedEmail === 'athlete@fitcoach.ai' && password === 'fitcoach2026') {
        const demoUser = {
          _id: 'user_demo_2026',
          name: 'Vận Động Viên FitCoach',
          email: 'athlete@fitcoach.ai',
          role: 'user',
          heightCm: 178,
          weightKg: 72,
          fitnessGoal: 'hypertrophy',
          dailyCalorieTarget: 2200,
          dailyProteinTarget: 140,
          dailyCarbsTarget: 240,
          dailyFatTarget: 60
        };
        res.json({
          success: true,
          data: {
            ...demoUser,
            token: generateToken(demoUser._id)
          }
        });
        return;
      }

      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng.' });
      return;
    }

    res.json({
      success: true,
      data: {
        _id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        role: determineRole(memUser.email, memUser.role),
        avatarUrl: memUser.avatarUrl,
        heightCm: memUser.heightCm,
        weightKg: memUser.weightKg,
        dailyCalorieTarget: memUser.dailyCalorieTarget,
        dailyProteinTarget: memUser.dailyProteinTarget,
        dailyCarbsTarget: memUser.dailyCarbsTarget,
        dailyFatTarget: memUser.dailyFatTarget,
        token: generateToken(memUser._id)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
export const getUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    res.json({
      success: true,
      data: req.user
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Update user profile & targets
// @route   PUT /api/auth/profile
export const updateUserProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      return;
    }

    const {
      name,
      heightCm,
      weightKg,
      fitnessGoal,
      dailyCalorieTarget,
      dailyProteinTarget,
      dailyCarbsTarget,
      dailyFatTarget
    } = req.body;

    if (isDbConnected) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.name = name || user.name;
        user.heightCm = heightCm || user.heightCm;
        user.weightKg = weightKg || user.weightKg;
        user.fitnessGoal = fitnessGoal || user.fitnessGoal;
        if (dailyCalorieTarget) user.dailyCalorieTarget = dailyCalorieTarget;
        if (dailyProteinTarget) user.dailyProteinTarget = dailyProteinTarget;
        if (dailyCarbsTarget) user.dailyCarbsTarget = dailyCarbsTarget;
        if (dailyFatTarget) user.dailyFatTarget = dailyFatTarget;

        const updated = await user.save();
        res.json({ success: true, data: updated });
        return;
      }
    }

    // In-memory fallback update
    const memUser = inMemoryUsers.find(u => u._id === req.user._id);
    if (memUser) {
      if (name) memUser.name = name;
      if (heightCm) memUser.heightCm = heightCm;
      if (weightKg) memUser.weightKg = weightKg;
      if (fitnessGoal) memUser.fitnessGoal = fitnessGoal;
      if (dailyCalorieTarget) memUser.dailyCalorieTarget = dailyCalorieTarget;
      if (dailyProteinTarget) memUser.dailyProteinTarget = dailyProteinTarget;
      if (dailyCarbsTarget) memUser.dailyCarbsTarget = dailyCarbsTarget;
      if (dailyFatTarget) memUser.dailyFatTarget = dailyFatTarget;

      res.json({ success: true, data: memUser });
      return;
    }

    res.json({ success: true, data: req.user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Authenticate or Register via Google OAuth
// @route   POST /api/auth/google
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, avatarUrl, googleId } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Google Email is required.' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userName = name || normalizedEmail.split('@')[0] || 'Google Athlete';
    const userRole = determineRole(normalizedEmail);

    if (isDbConnected) {
      try {
        let user = await User.findOne({ email: normalizedEmail });

        if (!user) {
          // Create new user from Google profile WITHOUT password
          user = await User.create({
            name: userName,
            email: normalizedEmail,
            avatarUrl: avatarUrl || undefined,
            googleId: googleId || undefined,
            authProvider: 'google',
            role: userRole,
            heightCm: 175,
            weightKg: 70,
            fitnessGoal: 'hypertrophy'
          });
        } else {
          // Clean up password if existed and update role
          const updates: any = { authProvider: 'google', role: userRole };
          if (avatarUrl) updates.avatarUrl = avatarUrl;
          await User.updateOne({ _id: user._id }, { $unset: { password: 1 }, $set: updates });
          user.role = userRole;
          if (avatarUrl) user.avatarUrl = avatarUrl;
        }

        res.json({
          success: true,
          data: {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: userRole,
            avatarUrl: user.avatarUrl || avatarUrl,
            heightCm: user.heightCm,
            weightKg: user.weightKg,
            dailyCalorieTarget: user.dailyCalorieTarget,
            dailyProteinTarget: user.dailyProteinTarget,
            dailyCarbsTarget: user.dailyCarbsTarget,
            dailyFatTarget: user.dailyFatTarget,
            token: generateToken(user._id.toString())
          }
        });
        return;
      } catch (dbErr) {
        console.warn('MongoDB Google Auth query failed, falling back to in-memory mode:', dbErr);
      }
    }

    // In-memory fallback
    let memUser = inMemoryUsers.find(u => u.email === normalizedEmail);
    if (!memUser) {
      memUser = {
        _id: 'user_google_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        name: userName,
        email: normalizedEmail,
        avatarUrl: avatarUrl || undefined,
        role: userRole,
        authProvider: 'google',
        heightCm: 175,
        weightKg: 70,
        fitnessGoal: 'hypertrophy',
        dailyCalorieTarget: 2000,
        dailyProteinTarget: 130,
        dailyCarbsTarget: 220,
        dailyFatTarget: 55,
        createdAt: new Date()
      };
      inMemoryUsers.push(memUser);
    } else {
      memUser.role = userRole;
      if (avatarUrl) memUser.avatarUrl = avatarUrl;
    }

    res.json({
      success: true,
      data: {
        _id: memUser._id,
        name: memUser.name,
        email: memUser.email,
        role: userRole,
        avatarUrl: memUser.avatarUrl || avatarUrl,
        heightCm: memUser.heightCm,
        weightKg: memUser.weightKg,
        dailyCalorieTarget: memUser.dailyCalorieTarget,
        dailyProteinTarget: memUser.dailyProteinTarget,
        dailyCarbsTarget: memUser.dailyCarbsTarget,
        dailyFatTarget: memUser.dailyFatTarget,
        token: generateToken(memUser._id)
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
