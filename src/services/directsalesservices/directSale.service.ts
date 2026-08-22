import { API } from '../../config/api'
import { getOrgHeader } from '../../utils/apiHeaders'
import type { DirectSales } from '../../mock/db'

export async function getDirectSales(): Promise<DirectSales[]> {
  const response = await fetch(`${API}/direct-sales`, { headers: getOrgHeader() })
  if (!response.ok) throw new Error('Failed to load direct sales')
  return response.json()
}

export async function createDirectSale(payload: DirectSales): Promise<DirectSales> {
  const response = await fetch(`${API}/direct-sales`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getOrgHeader() },
    body: JSON.stringify(payload),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.message ?? 'Failed to save direct sale')
  return data
}

export async function approveDirectSale(id: string): Promise<void> {
  const response = await fetch(`${API}/direct-sales/${id}/approve`, {
    method: 'POST',
    headers: getOrgHeader(),
  })
  if (!response.ok) throw new Error('Failed to approve direct sale')
}