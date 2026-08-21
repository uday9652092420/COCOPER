/**
 * @file purchaseInvoice.service.ts
 * @description API service for Purchase Invoices (organization-scoped).
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface PurchaseInvoiceLineDTO {
  id?: string;
  itemId: string;
  quantityTons: number;
  discount: number;
  actualQuantity: number;
  purchaseCost: number;
  purchaseAmount: number;
}

export interface PurchaseInvoiceDTO {
  id: string;
  invoiceNo: string;
  organizationId?: string | null;
  supplierId: string;
  branchId: string;
  purchaseOrderId?: string | null;
  invoiceDate: string;
  mode: string;
  loadingCost: number;
  marketCess: number;
  bagsAndSticks: number;
  freight: number;
  grandTotal: number;
  status?: "Draft" | "Approved";
  lines: PurchaseInvoiceLineDTO[];
}

export interface PurchaseInvoicePayload {
  id?: string;
  invoiceNo: string;
  organizationId?: string | null;
  supplierId: string;
  branchId?: string;
  purchaseOrderId?: string | null;
  invoiceDate?: string;
  mode?: string;
  loadingCost?: number;
  marketCess?: number;
  bagsAndSticks?: number;
  freight?: number;
  grandTotal?: number;
  status?: "Draft" | "Approved";
  lines: PurchaseInvoiceLineDTO[];
}

export async function getPurchaseInvoices(): Promise<PurchaseInvoiceDTO[]> {
  const response = await fetch(`${API}/purchase-invoices`, { headers: getOrgHeader() });
  if (!response.ok) throw new Error("Failed to load purchase invoices");
  return response.json();
}

export async function getPurchaseInvoice(id: string): Promise<PurchaseInvoiceDTO> {
  const response = await fetch(`${API}/purchase-invoices/${id}`, { headers: getOrgHeader() });
  if (!response.ok) throw new Error("Failed to load purchase invoice");
  return response.json();
}

export async function createPurchaseInvoice(
  payload: PurchaseInvoicePayload
): Promise<PurchaseInvoiceDTO> {
  const response = await fetch(`${API}/purchase-invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create purchase invoice");
  return response.json();
}

export async function updatePurchaseInvoice(
  id: string,
  payload: Partial<PurchaseInvoicePayload>
): Promise<PurchaseInvoiceDTO> {
  const response = await fetch(`${API}/purchase-invoices/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update purchase invoice");
  return response.json();
}

export async function deletePurchaseInvoice(id: string): Promise<void> {
  const response = await fetch(`${API}/purchase-invoices/${id}`, {
    method: "DELETE",
    headers: getOrgHeader(),
  });
  if (!response.ok) throw new Error("Failed to delete purchase invoice");
}
