/**
 * @file purchaseOrder.service.ts
 * @description Business logic layer for Purchase Order module.
 */

import {
  createPurchaseOrderRepo,
  updatePurchaseOrderRepo,
  deletePurchaseOrderRepo,
  listPurchaseOrdersRepo,
  getPurchaseOrderByIdRepo,
} from "./purchaseOrder.repository.js";
import {
  PurchaseOrderCreateDTO,
  PurchaseOrderUpdateDTO,
} from "./purchaseOrder.types.js";

export async function listPurchaseOrders(organizationId?: string | null) {
  return listPurchaseOrdersRepo(organizationId ?? null);
}

export async function getPurchaseOrderById(id: string) {
  return getPurchaseOrderByIdRepo(id);
}

export async function createPurchaseOrder(payload: PurchaseOrderCreateDTO) {
  if (!payload.poNumber || !payload.supplierId) {
    throw new Error("poNumber and supplierId are required");
  }
  return createPurchaseOrderRepo(payload);
}

export async function updatePurchaseOrder(
  id: string,
  payload: PurchaseOrderUpdateDTO
) {
  return updatePurchaseOrderRepo(id, payload);
}

export async function deletePurchaseOrder(id: string) {
  return deletePurchaseOrderRepo(id);
}
