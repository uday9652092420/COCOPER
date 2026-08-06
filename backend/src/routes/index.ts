import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/warehouse.routes.js';
import itemRoutes from "../modules/item/item.routes.js";
import gunnyBagRoutes from "../modules/gunnybag/gunnybag.routes.js";
import supplierRoutes from "../modules/suppliers/supplier.routes.js";

const router = Router();


router.use('/warehouses', warehouseRoutes);
router.use("/items", itemRoutes);
router.use("/gunny-bags", gunnyBagRoutes);
router.use("/suppliers", supplierRoutes);

export default router;
