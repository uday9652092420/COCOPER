import { API } from '../../config/api'
import { getOrgHeader } from '../../utils/apiHeaders'

export interface SupplierPaymentResponse {
  id: string
  paymentNumber: string
  supplierId: string
  supplierName?: string | null
  date: string
  invoiceMode: 'Invoice by Invoice' | 'Cumulative'
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  purchaseInvoiceId?: string | null
  remarks?: string | null
  attachmentNames?: string | null
  attachmentFiles?: string | null
  approved?: boolean
  organizationId?: string | null
  createdAt?: string
}

export type SupplierPaymentPayload = Omit<SupplierPaymentResponse, 'id' | 'approved' | 'organizationId' | 'createdAt' | 'supplierName'> & {
  id?: string
  supplierName?: string | null
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Supplier payment request failed.')
  return data.data as T
}

export async function getNextSupplierPaymentNo(): Promise<string> {
  return parseResponse<string>(await fetch(`${API}/supplier-payments/next-no`, { headers: getOrgHeader() }))
}

export async function getSupplierPayments(): Promise<SupplierPaymentResponse[]> {
  return parseResponse<SupplierPaymentResponse[]>(await fetch(`${API}/supplier-payments`, { headers: getOrgHeader() }))
}

export async function createSupplierPayment(payload: SupplierPaymentPayload): Promise<SupplierPaymentResponse> {
  return parseResponse<SupplierPaymentResponse>(await fetch(`${API}/supplier-payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getOrgHeader() },
    body: JSON.stringify(payload),
  }))
}

export async function updateSupplierPayment(id: string, payload: SupplierPaymentPayload): Promise<SupplierPaymentResponse> {
  return parseResponse<SupplierPaymentResponse>(await fetch(`${API}/supplier-payments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...getOrgHeader() },
    body: JSON.stringify(payload),
  }))
}

export async function approveSupplierPayment(id: string): Promise<void> {
  await parseResponse(await fetch(`${API}/supplier-payments/${id}/approve`, { method: 'POST', headers: getOrgHeader() }))
}

export async function deleteSupplierPayment(id: string): Promise<void> {
  await parseResponse(await fetch(`${API}/supplier-payments/${id}`, { method: 'DELETE', headers: getOrgHeader() }))
}
