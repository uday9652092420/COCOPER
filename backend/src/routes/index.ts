import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/warehouse.routes';



const router = Router();

router.use('/warehouses', warehouseRoutes);


export default router;
