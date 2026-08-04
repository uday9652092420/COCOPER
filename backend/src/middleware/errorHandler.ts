import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details ?? null,
    });
  }

  const status = typeof err === 'object' && err !== null && 'statusCode' in err ? (err as any).statusCode : 500;
  const message = typeof err === 'object' && err !== null && 'message' in err ? (err as any).message : 'Internal server error';

  res.status(status).json({
    status: 'error',
    message,
  });
};
