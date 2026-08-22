import { NextFunction, Request, Response } from 'express'
import { AppError } from '../../utils/AppError.js'
import { approveDirectSale, createDirectSale, listDirectSales } from './directSale.repository.js'

export async function listDirectSalesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const organizationId = req.query.organizationId as string | undefined || req.header('x-organization-id')
    return res.status(200).json(await listDirectSales(organizationId))
  } catch (error) {
    return next(new AppError(error instanceof Error ? error.message : 'Failed to list direct sales', 500, { cause: error }))
  }
}

export async function createDirectSaleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const organizationId = req.header('x-organization-id') || req.body.organizationId
    const sale = await createDirectSale({ ...req.body, organizationId })
    return res.status(201).json(sale)
  } catch (error) {
    return next(new AppError(error instanceof Error ? error.message : 'Failed to create direct sale', 400, { cause: error }))
  }
}

export async function approveDirectSaleHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const organizationId = req.header('x-organization-id')
    return res.status(200).json(await approveDirectSale(String(req.params.id), organizationId))
  } catch (error) {
    return next(new AppError(error instanceof Error ? error.message : 'Failed to approve direct sale', 400, { cause: error }))
  }
}