/**
 * @file CustomerStatementPage.tsx
 * @description Customer statement report showing organization-scoped sales and receipts.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { API } from '../../config/api'
import { getOrgHeader } from '../../utils/apiHeaders'
import { formatCurrency, formatDate } from '../../utils/format'
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'
import { getDirectSales } from '../../services/directsalesservices/directSale.service'
import { useAuthStore } from '../../store/authStore'
import { onScopeChange } from '../../utils/scopeEvents'

/**
 * @description Customer statement row.
 */
interface CustomerStatementRow {
  date: string
  voucher: string
  createdAt?: string
  transactionType: 'sale' | 'receipt'
  sales: number
  receipt: number
  balance: number
}

interface CustomerReceiptStatementRow {
  receipt_no: string
  receipt_date: string
  customer_id: string
  amount: number
  invoice_no?: string | null
  created_at?: string
  organization_id?: string | null
}

const STATEMENT_PAGE_SIZE = 15

function statementDateValue(value: string): number {
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '')
  const normalized = ddmmyyyy ? `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}` : value
  const timestamp = new Date(normalized).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function transactionTimestamp(value?: string): number {
  const timestamp = value ? new Date(value).getTime() : 0
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatStatementCurrency(value: number): string {
  const amount = Number(value || 0)
  return amount < 0 ? `(${formatCurrency(Math.abs(amount))})` : formatCurrency(amount)
}

/**
 * @component CustomerStatementPage
 * @description Customer statement page component.
 */
const CustomerStatementPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [customerOptions, setCustomerOptions] = useState<CustomerResponse[]>([])
  const [customerId, setCustomerId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)
  const [sales, setSales] = useState<Array<{
    id: string
    directSaleNo?: string
    invoiceNo?: string
    customerId: string
    invoiceDate: string
    invoiceTotal: number
    approved?: boolean
    createdAt?: string
    organizationId?: string | null
  }>>([])
  const [receipts, setReceipts] = useState<CustomerReceiptStatementRow[]>([])

  const loadCustomers = async () => {
    try {
      const response = await getCustomers()
      const allCustomers = Array.from(
        new Map(response.map((customer) => [customer.id, customer])).values()
      ).sort((first, second) => first.name.localeCompare(second.name))
      setCustomerOptions(allCustomers)
      setCustomerId((current) => allCustomers.some((customer) => customer.id === current) ? current : '')
    } catch (error) {
      console.error(error)
      setCustomerOptions([])
      setCustomerId('')
      toast.error('Unable to load customers from Customer Master.')
    }
  }

  useEffect(() => {
    void loadCustomers()
    return onScopeChange(() => { void loadCustomers() })
  }, [refreshToken, selectedOrganizationId])

  useEffect(() => {
    const loadStatementData = async () => {
      try {
        if (!selectedOrganizationId) {
          setSales([])
          setReceipts([])
          return
        }

        const [salesResponse, receiptsResponse] = await Promise.all([
          getDirectSales(),
          fetch(`${API}/customer-receipts`, { headers: getOrgHeader() }),
        ])
        if (!receiptsResponse.ok) throw new Error('Unable to load customer receipts.')
        const receiptPayload = await receiptsResponse.json()
        setSales(salesResponse.filter((sale) => sale.organizationId === selectedOrganizationId).map((sale) => ({
          id: sale.id,
          directSaleNo: sale.directSaleNo,
          invoiceNo: (sale as any).invoice_no,
          customerId: sale.customerId,
          invoiceDate: sale.invoiceDate,
          invoiceTotal: Number(sale.invoiceTotal ?? 0),
          approved: sale.approved,
          createdAt: (sale as typeof sale & { createdAt?: string }).createdAt,
          organizationId: sale.organizationId,
        })))
        setReceipts(
          Array.isArray(receiptPayload.data)
            ? receiptPayload.data.filter((receipt: CustomerReceiptStatementRow) => receipt.organization_id === selectedOrganizationId)
            : []
        )
      } catch (error) {
        console.error(error)
        setSales([])
        setReceipts([])
        toast.error('Unable to load customer statement transactions.')
      }
    }

    void loadStatementData()
    return onScopeChange(() => { void loadStatementData() })
  }, [refreshToken, selectedOrganizationId])

  const rows = useMemo<CustomerStatementRow[]>(() => {
    if (!customerId) return []
    const salesRows = sales
      .filter((sale) => sale.customerId === customerId && sale.approved === true)
      .map((s) => ({
        date: s.invoiceDate,
        voucher: s.directSaleNo ?? s.invoiceNo ?? s.id,
        createdAt: s.createdAt,
        transactionType: 'sale' as const,
        sales: Number(s.invoiceTotal ?? 0),
        receipt: 0,
      }))
    const receiptRows = receipts
      .filter((receipt) => receipt.customer_id === customerId)
      .map((receipt) => ({
        date: receipt.receipt_date,
        voucher: receipt.receipt_no,
        createdAt: receipt.created_at,
        transactionType: 'receipt' as const,
        sales: 0,
        receipt: Number(receipt.amount ?? 0),
      }))

    const combined = [...salesRows, ...receiptRows]
      .filter((row) => {
        const date = statementDateValue(row.date)
        const from = fromDate ? statementDateValue(fromDate) : 0
        const to = toDate ? statementDateValue(toDate) + 86400000 - 1 : Number.MAX_SAFE_INTEGER
        return date >= from && date <= to
      })
      .sort((a, b) => {
        const dateDifference = statementDateValue(a.date) - statementDateValue(b.date)
        if (dateDifference !== 0) return dateDifference
        const timestampDifference = transactionTimestamp(a.createdAt) - transactionTimestamp(b.createdAt)
        if (timestampDifference !== 0) return timestampDifference
        if (a.transactionType !== b.transactionType) return a.transactionType === 'receipt' ? -1 : 1
        return a.voucher.localeCompare(b.voucher, undefined, { numeric: true })
      })

    return combined.reduce<CustomerStatementRow[]>((statementRows, row, index) => {
      const previousRunningBalance = statementRows.at(-1)?.balance ?? 0
      const balance = index === 0
        ? Number(row.sales || 0) - Number(row.receipt || 0)
        : previousRunningBalance + Number(row.sales || 0) - Number(row.receipt || 0)
      statementRows.push({ ...row, balance })
      return statementRows
    }, [])
  }, [customerId, fromDate, receipts, sales, toDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [customerId, fromDate, toDate])

  const totalPages = Math.ceil(rows.length / STATEMENT_PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedRows = rows.slice(
    (safeCurrentPage - 1) * STATEMENT_PAGE_SIZE,
    safeCurrentPage * STATEMENT_PAGE_SIZE,
  )

  const totalSales = rows.reduce((sum, r) => sum + r.sales, 0)
  const totalReceipt = rows.reduce((sum, r) => sum + r.receipt, 0)
  const closingBalance = rows.length ? rows[rows.length - 1].balance : 0

  const customer = customerOptions.find((c) => c.id === customerId)
  const selectedCustomerLabel = customer?.name ?? ''
  const statementColumns = [
    { key: 'date', label: 'Date' },
    { key: 'voucher', label: 'Voucher' },
    { key: 'sales', label: 'Sales' },
    { key: 'receipt', label: 'Receipt' },
    { key: 'balance', label: 'Running Balance' },
  ]
  const visibleColumns = statementColumns

  const getStatementValue = (row: CustomerStatementRow, key: string): string => {
    if (key === 'date') return formatDate(row.date)
    if (key === 'sales') return row.sales ? formatStatementCurrency(row.sales) : ''
    if (key === 'receipt') return row.receipt ? formatStatementCurrency(row.receipt) : ''
    if (key === 'balance') return formatStatementCurrency(row.balance)
    return row.voucher
  }

  const exportStatementToExcel = () => {
    const headers = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const body = rows.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(getStatementValue(row, column.key))}</td>`).join('')}</tr>`).join('')
    const workbook = `<html><head><meta charset="UTF-8"></head><body><h1>Customer Statement - ${escapeHtml(selectedCustomerLabel)}</h1><table border="1"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'customer-statement.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Customer statement exported to Excel.')
  }

  const printStatement = (asPdf = false) => {
    if (!rows.length) {
      toast.info('No customer statement transactions to print.')
      return
    }
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const headers = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const body = rows.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(getStatementValue(row, column.key))}</td>`).join('')}</tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>${asPdf ? 'Customer Statement PDF' : 'Customer Statement'}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Customer Statement</h1><p>Customer: ${escapeHtml(selectedCustomerLabel || '-')}</p><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
    toast.success(asPdf ? 'Customer statement PDF is ready to save.' : 'Customer statement sent to print.')
  }

  return (
    <div>
      <PageHeader title="Customer Statement" breadcrumb={['Reports', 'Customer Statement']} />
      <Toolbar
        title="Customer Statement"
        onRefresh={() => { setRefreshToken((value) => value + 1); toast.success('Customer statement refreshed.') }}
        onExportExcel={exportStatementToExcel}
        onExportPdf={() => printStatement(true)}
        onPrint={() => printStatement(false)}
      />
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="text-[11px] font-medium text-slate-700">Customer</label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="min-w-[200px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
        >
          <option value="">Select customer</option>
          {customerOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type}{c.status === 'Inactive' ? ', Inactive' : ''})
            </option>
          ))}
        </select>
        <label className="text-[11px] font-medium text-slate-700">From Date</label>
        <input
          type="date"
          value={fromDate}
          max={toDate || undefined}
          onChange={(event) => setFromDate(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
        />
        <label className="text-[11px] font-medium text-slate-700">To Date</label>
        <input
          type="date"
          value={toDate}
          min={fromDate || undefined}
          onChange={(event) => setToDate(event.target.value)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
        />
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              {visibleColumns.map((column) => <th key={column.key} className="px-3 py-2">{column.label}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedRows.map((row, idx) => (
              <tr key={`${row.voucher}-${idx}`}>
                {visibleColumns.map((column) => <td key={column.key} className="px-3 py-1.5">{getStatementValue(row, column.key)}</td>)}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-100 bg-slate-50 text-slate-700">
            <tr>
              {visibleColumns.map((column) => (
                <td key={column.key} className="px-3 py-2">
                  {column.key === 'date' ? 'Totals' : column.key === 'sales' ? formatStatementCurrency(totalSales) : column.key === 'receipt' ? formatStatementCurrency(totalReceipt) : column.key === 'balance' ? formatStatementCurrency(closingBalance) : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-1 border-t border-slate-100 px-3 py-3 text-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={safeCurrentPage === 1}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                aria-current={safeCurrentPage === page ? 'page' : undefined}
                className={`min-w-8 rounded-md px-2 py-1.5 ${safeCurrentPage === page ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {page}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
              disabled={safeCurrentPage === totalPages}
              className="rounded-md px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default CustomerStatementPage