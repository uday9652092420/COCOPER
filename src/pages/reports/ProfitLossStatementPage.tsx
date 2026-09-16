/**
 * @file ProfitLossStatementPage.tsx
 * @description Profit and loss statement built from sales, purchase invoices,
 *              and cash/bank income and expense entries.
 */

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { getCashBankExpenses, type CashBankExpenseResponse } from '../../services/cashbankexpenseservices/cashBankExpense.service'
import { getDirectSales } from '../../services/directsalesservices/directSale.service'
import { getPurchaseInvoices, type PurchaseInvoiceDTO } from '../../services/purchaseinvoiceservices/purchaseInvoice.service'
import type { DirectSales } from '../../mock/db'
import { onScopeChange } from '../../utils/scopeEvents'

interface StatementRow {
  label: string
  amount: number
  emphasis?: boolean
  negative?: boolean
}

const formatCurrency = (value: number): string => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

const toIsoDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

const todayIsoDate = (): string => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const ProfitLossStatementPage: React.FC = () => {
  const [sales, setSales] = useState<DirectSales[]>([])
  const [purchases, setPurchases] = useState<PurchaseInvoiceDTO[]>([])
  const [cashBankEntries, setCashBankEntries] = useState<CashBankExpenseResponse[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState(todayIsoDate())
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      setLoading(true)
      const [salesRows, purchaseRows, cashBankRows] = await Promise.all([
        getDirectSales(),
        getPurchaseInvoices(),
        getCashBankExpenses(),
      ])
      setSales(salesRows)
      setPurchases(purchaseRows)
      setCashBankEntries(cashBankRows)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load profit and loss statement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    return onScopeChange(() => { void loadData() })
  }, [])

  const inRange = (date: string): boolean => {
    const isoDate = toIsoDate(date)
    if (!isoDate) return false
    return (!fromDate || isoDate >= fromDate) && (!toDate || isoDate <= toDate)
  }

  const summary = useMemo(() => {
    const salesIncome = sales.filter((sale) => inRange(sale.invoiceDate))
      .reduce((total, sale) => total + Number(sale.invoiceTotal || 0), 0)
    const purchaseCost = purchases.filter((invoice) => inRange(invoice.invoiceDate))
      .reduce((total, invoice) => total + Number(invoice.grandTotal || 0), 0)
    const entries = cashBankEntries.filter((entry) => entry.approved && inRange(entry.date))
    const otherIncome = entries.filter((entry) => entry.transactionType === 'Income')
      .reduce((total, entry) => total + Number(entry.amount || 0), 0)
    const operatingExpenses = entries.filter((entry) => entry.transactionType === 'Expenses')
      .reduce((total, entry) => total + Number(entry.amount || 0), 0)
    const grossProfit = salesIncome - purchaseCost
    const netProfit = grossProfit + otherIncome - operatingExpenses

    return { salesIncome, purchaseCost, otherIncome, operatingExpenses, grossProfit, netProfit }
  }, [cashBankEntries, fromDate, purchases, sales, toDate])

  const rows: StatementRow[] = [
    { label: 'Sales Revenue', amount: summary.salesIncome },
    { label: 'Less: Cost of Purchases', amount: summary.purchaseCost, negative: true },
    { label: 'Gross Profit / (Loss)', amount: summary.grossProfit, emphasis: true },
    { label: 'Other Income', amount: summary.otherIncome },
    { label: 'Operating Expenses', amount: summary.operatingExpenses, negative: true },
    { label: 'Net Profit / (Loss)', amount: summary.netProfit, emphasis: true },
  ]

  const exportToExcel = () => {
    const body = rows.map((row) => `<tr><td>${row.label}</td><td>${row.amount.toFixed(2)}</td></tr>`).join('')
    const html = `<html><body><table border="1"><thead><tr><th>Particulars</th><th>Amount (INR)</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' }))
    link.download = 'profit-loss-statement.xls'
    link.click()
    URL.revokeObjectURL(link.href)
    toast.success('Profit and loss statement exported to Excel.')
  }

  const printStatement = () => {
    const body = rows.map((row) => `<tr><td>${row.label}</td><td>${formatCurrency(row.amount)}</td></tr>`).join('')
    const html = `<html><head><title>Profit & Loss Statement</title><style>body{font-family:Arial;margin:28px;color:#0f172a}table{border-collapse:collapse;width:100%;margin-top:20px}th,td{border:1px solid #cbd5e1;padding:10px;text-align:left}th{background:#f1f5f9}td:last-child{text-align:right}</style></head><body><h1>Profit & Loss Statement</h1><p>Period: ${fromDate || 'Beginning'} to ${toDate || 'Present'}</p><table><thead><tr><th>Particulars</th><th>Amount (INR)</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast.error('Popup blocked. Please allow popups to print.'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <div>
      <PageHeader title="Profit & Loss Statement" breadcrumb={['Reports', 'Profit & Loss Statement']} />
      <Toolbar
        onRefresh={() => { void loadData() }}
        onExportExcel={exportToExcel}
        onExportPdf={printStatement}
        onPrint={printStatement}
      />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <label className="font-medium text-slate-700" htmlFor="profit-loss-from">From Date</label>
        <input id="profit-loss-from" type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs" />
        <label className="font-medium text-slate-700" htmlFor="profit-loss-to">To Date</label>
        <input id="profit-loss-to" type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs" />
      </div>
      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 p-3 text-[11px] text-slate-700 shadow-sm">
        <table className="min-w-full text-left">
          <thead className="bg-slate-50 text-slate-500"><tr><th className="px-3 py-2">Particulars</th><th className="px-3 py-2 text-right">Amount (INR)</th></tr></thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? <tr><td colSpan={2} className="px-3 py-8 text-center text-slate-500">Loading...</td></tr> : rows.map((row) => <tr key={row.label} className={row.emphasis ? 'bg-emerald-50/60 font-semibold text-slate-900' : ''}><td className="px-3 py-2">{row.label}</td><td className={`px-3 py-2 text-right ${row.negative ? 'text-rose-700' : ''}`}>{row.negative ? `(${formatCurrency(row.amount)})` : formatCurrency(row.amount)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Statement is calculated from sales revenue, purchase invoices, and approved cash/bank income and expense entries for the selected period.</p>
    </div>
  )
}

export default ProfitLossStatementPage
