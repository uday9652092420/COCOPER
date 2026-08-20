/**
 * @file purchaseOrder.service.ts
 * @description API service for Purchase Orders (organization-scoped).
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface PurchaseOrderLineDTO {
  id?: string;
  itemId: string;
  quantity: number;
  discount: number;
  actualQuantity: number;
  purchaseCost: number;
  purchaseAmount: number;
  amount: number;
  rate?: number;
}

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string;
  organizationId?: string | null;
  supplierId: string;
  branchId?: string;
  warehouseId: string;
  date: string;
  remarks: string;
  status: string;
  purchaseOrderInvoiceStatus?: boolean;
  mode: string;
  lines: PurchaseOrderLineDTO[];
}

export interface PurchaseOrderPayload {
  id?: string;
  poNumber: string;
  organizationId?: string | null;
  supplierId: string;
  branchId?: string;
  warehouseId?: string;
  date?: string;
  remarks?: string;
  status?: string;
  purchaseOrderInvoiceStatus?: boolean;
  mode?: string;
  lines: PurchaseOrderLineDTO[];
}

export async function getPurchaseOrders(): Promise<PurchaseOrderDTO[]> {
  const response = await fetch(`${API}/purchase-orders`, { headers: getOrgHeader() });
  if (!response.ok) throw new Error("Failed to load purchase orders");
  return response.json();
}

export async function getPurchaseOrder(id: string): Promise<PurchaseOrderDTO> {
  const response = await fetch(`${API}/purchase-orders/${id}`, { headers: getOrgHeader() });
  if (!response.ok) throw new Error("Failed to load purchase order");
  return response.json();
}

export async function createPurchaseOrder(
  payload: PurchaseOrderPayload
): Promise<PurchaseOrderDTO> {
  const response = await fetch(`${API}/purchase-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create purchase order");
  return response.json();
}

export async function updatePurchaseOrder(
  id: string,
  payload: Partial<PurchaseOrderPayload>
): Promise<PurchaseOrderDTO> {
  const response = await fetch(`${API}/purchase-orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update purchase order");
  return response.json();
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  const response = await fetch(`${API}/purchase-orders/${id}`, {
    method: "DELETE",
    headers: getOrgHeader(),
  });
  if (!response.ok) throw new Error("Failed to delete purchase order");
}
