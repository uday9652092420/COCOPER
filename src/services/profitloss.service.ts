import { API } from '../config/api'
import { getOrgHeader } from '../utils/apiHeaders'

export interface ProfitLossStockSnapshot {
  openingUnits: number
  openingAmount: number
  closingUnits: number
  closingAmount: number
}

export async function getProfitLossStockSnapshot(fromDate: string, toDate: string): Promise<ProfitLossStockSnapshot> {
  const query = new URLSearchParams({ fromDate, toDate })
  const response = await fetch(`${API}/profit-loss/stock-snapshot?${query}`, {
    headers: getOrgHeader(),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message ?? 'Failed to load stock valuation.')
  return result.data as ProfitLossStockSnapshot
}
