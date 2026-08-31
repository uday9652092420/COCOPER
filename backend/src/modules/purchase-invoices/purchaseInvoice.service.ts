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

export async function getPurchaseInvoiceById(id: string, organizationId?: string | null) {
  return getPurchaseInvoiceByIdRepo(id, organizationId);
}

export async function createPurchaseInvoice(payload: PurchaseInvoiceCreateDTO) {
  if (!payload.invoiceNo || !payload.supplierId) {
    throw new Error("invoiceNo and supplierId are required");
  }
  return createPurchaseInvoiceRepo(payload);
}

export async function updatePurchaseInvoice(
  id: string,
  payload: PurchaseInvoiceUpdateDTO,
  organizationId?: string | null
) {
  return updatePurchaseInvoiceRepo(id, payload, organizationId ?? null);
}

export async function deletePurchaseInvoice(
  id: string,
  organizationId?: string | null
) {
  return deletePurchaseInvoiceRepo(id, organizationId ?? null);
}
