import { Router } from 'express'
import { approveDirectSaleHandler, createDirectSaleHandler, deleteDirectSaleHandler, listDirectSalesHandler } from './directSale.controller.js'

const router = Router()
router.get('/', listDirectSalesHandler)
router.post('/', createDirectSaleHandler)
router.post('/:id/approve', approveDirectSaleHandler)
router.delete('/:id', deleteDirectSaleHandler)

export default router