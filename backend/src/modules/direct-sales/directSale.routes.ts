import { Router } from 'express'
import { requireModulePermission } from '../../middleware/modulePermission.js'
import { approveDirectSaleHandler, createDirectSaleHandler, deleteDirectSaleHandler, listDirectSalesHandler } from './directSale.controller.js'

const router = Router()
router.get('/', requireModulePermission('sales', 'read'), listDirectSalesHandler)
router.post('/', requireModulePermission('sales', 'create'), createDirectSaleHandler)
router.post('/:id/approve', requireModulePermission('sales', 'approve'), approveDirectSaleHandler)
router.delete('/:id', requireModulePermission('sales', 'delete'), deleteDirectSaleHandler)

export default router