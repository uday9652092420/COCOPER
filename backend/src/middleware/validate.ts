import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError.js';

export function validatePayload(schema: (payload: unknown) => { success: boolean; errors?: unknown }) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema(req.body);
    if (!result.success) {
      return next(new AppError('Validation failed', 400, result.errors));
    }
    next();
  };
}
