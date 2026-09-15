import { API } from '../../config/api'
import { getOrgHeader } from '../../utils/apiHeaders'

export type CashBankPaymentMode = 'Cash' | 'Bank' | 'UPI'
export type CashBankTransactionType = 'Expenses' | 'Income'

export interface CashBankExpenseAttachment {
  name: string
  mimeType: string
  data: string
}

export interface CashBankExpenseResponse {
  id: string
  organizationId: string
  branchId: string
  branch: string
  date: string
  paymentMode: CashBankPaymentMode
  transactionType: CashBankTransactionType
  amount: number
  description: string
  attachments: CashBankExpenseAttachment[]
  approved: boolean
  createdAt: string
}

export interface CashBankExpensePayload {
  branchId: string
  date: string
  paymentMode: CashBankPaymentMode
  transactionType: CashBankTransactionType
  amount: number
  description?: string
  attachments?: CashBankExpenseAttachment[]
}

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Cash / Bank expense request failed.')
  return data.data as T
}

export async function getCashBankExpenses(): Promise<CashBankExpenseResponse[]> {
  return parseResponse<CashBankExpenseResponse[]>(await fetch(`${API}/cash-bank-expenses`, { headers: getOrgHeader() }))
}

export async function createCashBankExpense(payload: CashBankExpensePayload): Promise<CashBankExpenseResponse> {
  return parseResponse<CashBankExpenseResponse>(await fetch(`${API}/cash-bank-expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getOrgHeader() },
    body: JSON.stringify(payload),
  }))
}

export async function updateCashBankExpense(id: string, payload: CashBankExpensePayload): Promise<CashBankExpenseResponse> {
  return parseResponse<CashBankExpenseResponse>(await fetch(`${API}/cash-bank-expenses/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', ...getOrgHeader() }, body: JSON.stringify(payload),
  }))
}

export async function approveCashBankExpense(id: string): Promise<CashBankExpenseResponse> {
  return parseResponse<CashBankExpenseResponse>(await fetch(`${API}/cash-bank-expenses/${id}/approve`, { method: 'POST', headers: getOrgHeader() }))
}

export async function deleteCashBankExpense(id: string): Promise<void> {
  await parseResponse(await fetch(`${API}/cash-bank-expenses/${id}`, { method: 'DELETE', headers: getOrgHeader() }))
}
