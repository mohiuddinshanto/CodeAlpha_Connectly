import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

export const AUTH_COOKIE_NAME = 'connectly_token';

export interface AuthRequest extends Request {
  userId?: string;
}

interface JwtPayload {
  userId: string;
}

export function signAuthToken(userId: string): string {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: '7d' });
}

export function setAuthCookie(req: Request, res: Response, token: string): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    env.nodeEnv === 'production';

  res.cookie(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    env.nodeEnv === 'production';

  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
  });
}

function extractUserIdFromRequest(req: Request): string | null {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token || typeof token !== 'string') return null;
  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    return decoded?.userId || null;
  } catch {
    return null;
  }
}

export function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const userId = extractUserIdFromRequest(req);
  if (!userId) {
    next(new AppError('Authentication required. Please sign in.', 401, 'UNAUTHORIZED'));
    return;
  }
  req.userId = userId;
  next();
}

export function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const userId = extractUserIdFromRequest(req);
  if (userId) {
    req.userId = userId;
  }
  next();
}
