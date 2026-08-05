import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/warehouse.routes.js';
import itemRoutes from "../modules/item/item.routes.js";

const router = Router();


router.use('/warehouses', warehouseRoutes);
router.use("/items", itemRoutes);


export default router;
