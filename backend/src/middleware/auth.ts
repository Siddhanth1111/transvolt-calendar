import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
  };
}

interface JwtPayload {
  userId: string;
}

const auth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = { userId: decoded.userId };
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export default auth;
