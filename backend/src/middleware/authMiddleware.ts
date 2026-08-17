import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { isDbConnected } from '../config/db';
import { inMemoryUsers } from '../controllers/authController';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'aifitcoach_super_secret_jwt_key_2026_jwt_token';
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    if (isDbConnected) {
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch {
        // Fallback
      }
    }

    const memUser = inMemoryUsers.find(u => u._id === decoded.id);
    if (memUser) {
      const { password, ...safeUser } = memUser;
      req.user = safeUser;
    }

    next();
  } catch (err) {
    next();
  }
};

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập với tài khoản Quản Trị Viên (Admin).'
    });
    return;
  }

  // Admin whitelist / check
  const isAdmin =
    req.user.role === 'admin' ||
    req.user.email === 'luumynhathuy@gmail.com' ||
    req.user.email === 'admin@fitcoach.ai';

  if (!isAdmin) {
    res.status(403).json({
      success: false,
      message: 'Bạn không có quyền thực hiện tính năng Quản Trị này (Yêu cầu quyền Admin).'
    });
    return;
  }

  next();
};
