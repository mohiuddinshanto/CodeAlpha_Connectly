import type { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  const maybeMongo = err as { code?: number; message?: string; keyPattern?: Record<string, number> };
  if (maybeMongo?.code === 11000) {
    const field = Object.keys(maybeMongo.keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: `That ${field} is already taken.`,
      code: 'DUPLICATE_KEY',
    });
    return;
  }

  console.error('[Server Error]', err);
  res.status(500).json({
    success: false,
    error: 'An unexpected server error occurred. Please try again.',
  });
}
