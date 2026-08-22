import { Router } from 'express';
import warehouseRoutes from '../modules/warehouse/warehouse.routes.js';
import itemRoutes from "../modules/item/item.routes.js";
import gunnyBagRoutes from "../modules/gunnybag/gunnybag.routes.js";
import supplierRoutes from "../modules/suppliers/supplier.routes.js";
import customerRoutes from "../modules/customer/customer.routes.js";
import labourStaffRoutes from "../modules/labourstaff/labourstaff.routes.js";
import bagPurchaseRoutes from "../modules/bagpurchase/bagpurchase.routes.js";
import registerRoutes from "../modules/register/register.routes.js";
import organizationRoutes from "../modules/organization/organization.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import rolesRoutes from "../modules/roles/roles.routes.js";
import branchesRoutes from "../modules/branches/branches.routes.js";
import usersRoutes from "../modules/users/users.routes.js";
import profileRoutes from "../modules/profile/profile.routes.js";
import purchaseOrderRoutes from "../modules/purchase-orders/purchaseOrder.routes.js";
import purchaseInvoiceRoutes from "../modules/purchase-invoices/purchaseInvoice.routes.js";
import salesOrderRoutes from "../modules/sales-orders/salesOrder.routes.js";
import directSaleRoutes from "../modules/direct-sales/directSale.routes.js";

const router = Router();


router.use('/warehouses', warehouseRoutes);
router.use("/items", itemRoutes);
router.use("/gunny-bags", gunnyBagRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/customers", customerRoutes);
router.use( "/labour-staff",labourStaffRoutes);
router.use(
  "/bag-purchases",
  bagPurchaseRoutes
);
router.use(
  "/auth",
  registerRoutes
);
router.use(
  "/auth",
  authRoutes
);
router.use(
  "/organizations",
  organizationRoutes
);
router.use(
  "/roles",
  rolesRoutes
);
router.use(
  "/branches",
  branchesRoutes
);
router.use(
  "/users",
  usersRoutes
);
router.use(
  "/profile",
  profileRoutes
);
router.use(
  "/purchase-orders",
  purchaseOrderRoutes
);
router.use(
  "/purchase-invoices",
  purchaseInvoiceRoutes
);
router.use(
  "/sales-orders",
  salesOrderRoutes
);
router.use("/direct-sales", directSaleRoutes);
export default router;
