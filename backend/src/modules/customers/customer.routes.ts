import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'Customer module is ready' });
});

export default router;
