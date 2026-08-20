/**
 * @file salesOrder.service.ts
 * @description API service for Sales Orders (organization-scoped).
 */

import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface SalesOrderLineDTO {
  id?: string;
  itemId: string;
  quantity: number;
  discount: number;
  actualQuantity: number;
  saleCost: number;
  saleAmount: number;
  amount: number;
}

export interface SalesOrderDTO {
  id: string;
  soNumber: string;
  organizationId?: string | null;
  customerId: string;
  date: string;
  remarks: string;
  sourcePOId: string;
  poNumber: string;
  mode: string;
  status?: 'Draft' | 'Approved';
  totalAmount: number;
  lines: SalesOrderLineDTO[];
}

export interface SalesOrderPayload {
  id?: string;
  soNumber: string;
  organizationId?: string | null;
  customerId?: string;
  date?: string;
  remarks?: string;
  sourcePOId?: string;
  poNumber?: string;
  mode?: string;
  status?: 'Draft' | 'Approved';
  totalAmount?: number;
  lines: SalesOrderLineDTO[];
}

export async function getSalesOrders(): Promise<SalesOrderDTO[]> {
  const response = await fetch(`${API}/sales-orders`, { headers: getOrgHeader() });
  if (!response.ok) throw new Error("Failed to load sales orders");
  return response.json();
}

export async function getSalesOrder(id: string): Promise<SalesOrderDTO> {
  const response = await fetch(`${API}/sales-orders/${id}`, { headers: getOrgHeader() });
  if (!response.ok) throw new Error("Failed to load sales order");
  return response.json();
}

export async function createSalesOrder(
  payload: SalesOrderPayload
): Promise<SalesOrderDTO> {
  const response = await fetch(`${API}/sales-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to create sales order");
  return response.json();
}

export async function updateSalesOrder(
  id: string,
  payload: SalesOrderPayload
): Promise<SalesOrderDTO> {
  const response = await fetch(`${API}/sales-orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Failed to update sales order");
  return response.json();
}

export async function deleteSalesOrder(id: string): Promise<void> {
  const response = await fetch(`${API}/sales-orders/${id}`, {
    method: "DELETE",
    headers: getOrgHeader(),
  });
  if (!response.ok) throw new Error("Failed to delete sales order");
}
