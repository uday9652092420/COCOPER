import { Router } from 'express'
import { approveDirectSaleHandler, createDirectSaleHandler, listDirectSalesHandler } from './directSale.controller.js'

const router = Router()
router.get('/', listDirectSalesHandler)
router.post('/', createDirectSaleHandler)
router.post('/:id/approve', approveDirectSaleHandler)

export default router