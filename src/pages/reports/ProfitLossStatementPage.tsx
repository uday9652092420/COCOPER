/**
 * @file ProfitLossStatementPage.tsx
 * @description Profit and loss statement built from sales, purchase invoices,
 *              and cash/bank income and expense entries.
 */

import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'
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

interface ProfitLossSummary {
  openingUnits: number
  openingAmount: number
  purchaseUnits: number
  purchaseAmount: number
  salesUnits: number
  salesAmount: number
  closingUnits: number
  closingAmount: number
  otherIncome: number
  expenses: number
  costOfGoodsSold: number
  grossProfit: number
  netProfit: number
}

const formatCurrency = (value: number): string => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value)

const formatStatementAmount = (value: number): string => {
  const amount = Number(value || 0)
  return amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)
}

const toIsoDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

const toDisplayDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const DateField: React.FC<{
  id: string
  value: string
  onChange: (value: string) => void
}> = ({ id, value, onChange }) => {
  const datePickerRef = useRef<HTMLInputElement | null>(null)

  return (
    <div className="relative flex items-center">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        maxLength={10}
        value={value}
        onChange={(event) => onChange(formatDateInput(event.target.value))}
        className="w-[132px] rounded-full border border-slate-200 bg-white px-3 py-1.5 pr-8 text-xs"
      />
      <button
        type="button"
        aria-label={`Select date for ${id}`}
        onClick={() => datePickerRef.current?.showPicker()}
        className="absolute right-2 text-slate-500 hover:text-slate-800"
      >
        <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <input
        ref={datePickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={toIsoDate(value)}
        onChange={(event) => onChange(toDisplayDate(event.target.value))}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
    </div>
  )
}

const todayIsoDate = (): string => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const defaultFromDate = (): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const lineQuantity = (line: { actualQuantity?: number; quantityTons?: number; quantity?: number }): number =>
  Number(line.actualQuantity ?? line.quantityTons ?? line.quantity ?? 0)

const ProfitLossStatementPage: React.FC = () => {
  const [sales, setSales] = useState<DirectSales[]>([])
  const [purchases, setPurchases] = useState<PurchaseInvoiceDTO[]>([])
  const [cashBankEntries, setCashBankEntries] = useState<CashBankExpenseResponse[]>([])
  const [fromDate, setFromDate] = useState(() => toDisplayDate(defaultFromDate()))
  const [toDate, setToDate] = useState(() => toDisplayDate(todayIsoDate()))
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
    const fromIsoDate = toIsoDate(fromDate)
    const toIsoDateValue = toIsoDate(toDate)
    if (!isoDate) return false
    return (!fromIsoDate || isoDate >= fromIsoDate) && (!toIsoDateValue || isoDate <= toIsoDateValue)
  }

  const summary = useMemo<ProfitLossSummary>(() => {
    const salesInRange = sales.filter((sale) => inRange(sale.invoiceDate))
    const purchasesInRange = purchases.filter((invoice) => inRange(invoice.invoiceDate))
    const salesAmount = salesInRange.reduce((total, sale) => total + Number(sale.invoiceTotal || 0), 0)
    const purchaseAmount = purchasesInRange.reduce((total, invoice) => total + Number(invoice.grandTotal || 0), 0)
    const salesUnits = salesInRange.reduce((total, sale) => total + sale.lines.reduce((lineTotal, line) => lineTotal + lineQuantity(line), 0), 0)
    const purchaseUnits = purchasesInRange.reduce((total, invoice) => total + invoice.lines.reduce((lineTotal, line) => lineTotal + lineQuantity(line), 0), 0)
    const entries = cashBankEntries.filter((entry) => entry.approved && inRange(entry.date))
    const otherIncome = entries.filter((entry) => entry.transactionType === 'Income')
      .reduce((total, entry) => total + Number(entry.amount || 0), 0)
    const expenses = entries.filter((entry) => entry.transactionType === 'Expenses')
      .reduce((total, entry) => total + Number(entry.amount || 0), 0)
    const costOfGoodsSold = purchaseAmount
    const grossProfit = salesAmount - costOfGoodsSold
    const netProfit = grossProfit + otherIncome - expenses

    return {
      openingUnits: 0,
      openingAmount: 0,
      purchaseUnits,
      purchaseAmount,
      salesUnits,
      salesAmount,
      closingUnits: 0,
      closingAmount: 0,
      otherIncome,
      expenses,
      costOfGoodsSold,
      grossProfit,
      netProfit,
    }
  }, [cashBankEntries, fromDate, purchases, sales, toDate])

  const rows: StatementRow[] = [
    { label: 'Total Sales', amount: summary.salesAmount },
    { label: 'Opening Stock', amount: summary.openingAmount },
    { label: 'Add: Purchases', amount: summary.purchaseAmount },
    { label: 'Less: Closing Stock', amount: summary.closingAmount, negative: true },
    { label: 'Cost of Goods Sold (COGS)', amount: summary.costOfGoodsSold, emphasis: true },
    { label: 'Gross Profit', amount: summary.grossProfit },
    { label: 'Less: Expenses', amount: summary.expenses, negative: true },
    { label: 'Add: Other Income', amount: summary.otherIncome },
    { label: summary.netProfit < 0 ? 'Net Loss' : 'Net Profit', amount: summary.netProfit, emphasis: true },
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
    <div className="space-y-3">
      <PageHeader title="Profit & Loss Statement" breadcrumb={['Reports', 'Profit & Loss Statement']} />
      <Toolbar
        onRefresh={() => { void loadData() }}
        onExportExcel={exportToExcel}
        onExportPdf={printStatement}
        onPrint={printStatement}
      />
      <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
        <label className="font-medium text-slate-700" htmlFor="profit-loss-from">From Date</label>
        <DateField id="profit-loss-from" value={fromDate} onChange={setFromDate} />
        <label className="font-medium text-slate-700" htmlFor="profit-loss-to">To Date</label>
        <DateField id="profit-loss-to" value={toDate} onChange={setToDate} />
      </div>
      {loading ? <div className="rounded-3xl border border-slate-100 bg-white/80 px-3 py-10 text-center text-xs text-slate-500 shadow-sm">Loading...</div> : <>
        <section className="rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
          <h2 className="mb-2 text-xs font-semibold text-slate-800">Stock &amp; Movement</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-600"><p>Opening Stock</p><p>{summary.openingUnits.toLocaleString('en-IN')} units</p><p>Rate: {formatCurrency(summary.openingUnits ? summary.openingAmount / summary.openingUnits : 0)}</p><p>Amount: {formatCurrency(summary.openingAmount)}</p></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-600"><p>Purchases (In Range)</p><p>Amount: {formatCurrency(summary.purchaseAmount)}</p></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-600"><p>Sales (In Range)</p><p>Amount: {formatCurrency(summary.salesAmount)}</p></div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 text-[11px] text-slate-600"><p>Closing Stock</p><p>{summary.closingUnits.toLocaleString('en-IN')} units</p><p>Rate: {formatCurrency(summary.closingUnits ? summary.closingAmount / summary.closingUnits : 0)}</p><p>Amount: {formatCurrency(summary.closingAmount)}</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
          <h2 className="mb-2 text-xs font-semibold text-slate-800">Expenses &amp; Other Income</h2>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-3 text-[11px] text-rose-700"><p>Total Expenses (In Range)</p><p className="font-semibold">{formatCurrency(summary.expenses)}</p></div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 text-[11px] text-emerald-700"><p>Total Other Income (In Range)</p><p className="font-semibold">{formatCurrency(summary.otherIncome)}</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-100 bg-white/80 p-3 text-[11px] text-slate-700 shadow-sm">
          <div className="divide-y divide-slate-100">
            {rows.map((row) => {
              const amount = row.negative ? -Math.abs(row.amount) : row.amount
              const isNegative = amount < 0
              return <div key={row.label} className={`flex items-center justify-between gap-4 px-2 py-2 ${row.emphasis ? `font-semibold ${isNegative ? 'text-rose-700' : 'text-emerald-700'}` : ''}`}><span className={isNegative ? 'text-rose-700' : ''}>{row.label}</span><span className={isNegative ? 'text-rose-700' : ''}>{formatStatementAmount(amount)}</span></div>
            })}
          </div>
        </section>
      </>}
      <p className="text-[11px] text-slate-500">Statement is calculated from sales invoices, purchase invoices, and approved cash/bank income and expense entries for the selected period.</p>
    </div>
  )
}

export default ProfitLossStatementPage
