/**
 * @file auth.controller.ts
 * @description Controller for application authentication.
 */

import type { NextFunction, Request, Response } from 'express';
import { loginService } from './auth.service.js';

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginService(req.body);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
}
