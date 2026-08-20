/**
 * @file purchaseInvoice.service.ts
 * @description Business logic layer for Purchase Invoice module.
 */

import {
  createPurchaseInvoiceRepo,
  updatePurchaseInvoiceRepo,
  deletePurchaseInvoiceRepo,
  listPurchaseInvoicesRepo,
  getPurchaseInvoiceByIdRepo,
} from "./purchaseInvoice.repository.js";
import {
  PurchaseInvoiceCreateDTO,
  PurchaseInvoiceUpdateDTO,
} from "./purchaseInvoice.types.js";

export async function listPurchaseInvoices(organizationId?: string | null) {
  return listPurchaseInvoicesRepo(organizationId ?? null);
}

export async function getPurchaseInvoiceById(id: string) {
  return getPurchaseInvoiceByIdRepo(id);
}

export async function createPurchaseInvoice(payload: PurchaseInvoiceCreateDTO) {
  if (!payload.invoiceNo || !payload.supplierId) {
    throw new Error("invoiceNo and supplierId are required");
  }
  return createPurchaseInvoiceRepo(payload);
}

export async function updatePurchaseInvoice(
  id: string,
  payload: PurchaseInvoiceUpdateDTO
) {
  return updatePurchaseInvoiceRepo(id, payload);
}

export async function deletePurchaseInvoice(id: string) {
  return deletePurchaseInvoiceRepo(id);
}
