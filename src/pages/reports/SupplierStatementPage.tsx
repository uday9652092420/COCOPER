/**
 * @file SupplierStatementPage.tsx
 * @description Organization-scoped supplier statement report.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { formatCurrency, formatDate } from '../../utils/format'
import { getSuppliers, type SupplierResponse } from '../../services/supplierservices/supplier.service'
import { getPurchaseInvoices, type PurchaseInvoiceDTO } from '../../services/purchaseinvoiceservices/purchaseInvoice.service'
import { getSupplierPayments, type SupplierPaymentResponse } from '../../services/supplierpaymentservices/supplierPayment.service'
import { useAuthStore } from '../../store/authStore'
import { onScopeChange } from '../../utils/scopeEvents'

interface SupplierStatementRow {
  id: string
  date: string
  voucher: string
  createdAt?: string
  purchaseInvoiceId?: string
  type: 'purchase' | 'payment'
  purchase: number
  payment: number
  balance: number
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
  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp
}

function recordCreationTimestamp(value: string): number {
  const timestampMatch = value.match(/(?:^|-)\d{12,}$/)?.[0].replace(/^-/, '')
  const timestamp = timestampMatch ? Number(timestampMatch) : Number.NaN
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER
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

const SupplierStatementPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [supplierOptions, setSupplierOptions] = useState<SupplierResponse[]>([])
  const [supplierId, setSupplierId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceDTO[]>([])
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentResponse[]>([])

  useEffect(() => {
    const loadStatementData = async () => {
      if (!selectedOrganizationId) {
        setSupplierOptions([])
        setSupplierId('')
        setPurchaseInvoices([])
        setSupplierPayments([])
        return
      }

      try {
        const [suppliersResponse, invoicesResponse, paymentsResponse] = await Promise.all([
          getSuppliers(),
          getPurchaseInvoices(),
          getSupplierPayments(),
        ])
        const scopedSuppliers = suppliersResponse
          .filter((supplier) => supplier.organization_id === selectedOrganizationId)
          .sort((first, second) => first.name.localeCompare(second.name))
        setSupplierOptions(scopedSuppliers)
        setSupplierId((current) => scopedSuppliers.some((supplier) => supplier.id === current) ? current : '')
        setPurchaseInvoices(invoicesResponse.filter((invoice) => invoice.organizationId === selectedOrganizationId))
        setSupplierPayments(paymentsResponse.filter((payment) => payment.organizationId === selectedOrganizationId))
      } catch (error) {
        console.error(error)
        setSupplierOptions([])
        setSupplierId('')
        setPurchaseInvoices([])
        setSupplierPayments([])
        toast.error('Unable to load supplier statement data.')
      }
    }

    void loadStatementData()
    return onScopeChange(() => { void loadStatementData() })
  }, [refreshToken, selectedOrganizationId])

  const rows = useMemo<SupplierStatementRow[]>(() => {
    if (!supplierId) return []

    const purchaseRows = purchaseInvoices
      .filter((invoice) => invoice.supplierId === supplierId)
      .map((invoice) => ({
        id: invoice.id,
        date: invoice.invoiceDate,
        voucher: invoice.invoiceNo,
        createdAt: invoice.createdAt,
        type: 'purchase' as const,
        purchase: Number(invoice.grandTotal ?? 0),
        payment: 0,
      }))

    const paymentRows = supplierPayments
      .filter((payment) => payment.supplierId === supplierId)
      .map((payment) => ({
        id: payment.id,
        date: payment.date,
        voucher: payment.paymentNumber,
        createdAt: payment.createdAt,
        purchaseInvoiceId: payment.purchaseInvoiceId ?? undefined,
        type: 'payment' as const,
        purchase: 0,
        payment: Number(payment.amount ?? 0),
      }))

    const combined = [...purchaseRows, ...paymentRows]
      .filter((row) => {
        const date = statementDateValue(row.date)
        const from = fromDate ? statementDateValue(fromDate) : 0
        const to = toDate ? statementDateValue(toDate) + 86400000 - 1 : Number.MAX_SAFE_INTEGER
        return date >= from && date <= to
      })
      .sort((first, second) => {
        const firstInvoice = first.type === 'purchase'
          ? first
          : purchaseRows.find((row) => row.id === first.purchaseInvoiceId)
        const secondInvoice = second.type === 'purchase'
          ? second
          : purchaseRows.find((row) => row.id === second.purchaseInvoiceId)
        const firstAnchor = firstInvoice ?? first
        const secondAnchor = secondInvoice ?? second
        const dateDifference = statementDateValue(firstAnchor.date) - statementDateValue(secondAnchor.date)
        if (dateDifference !== 0) return dateDifference
        const timestampDifference = transactionTimestamp(firstAnchor.createdAt) - transactionTimestamp(secondAnchor.createdAt)
        if (timestampDifference !== 0) return timestampDifference
        const recordCreationDifference = recordCreationTimestamp(firstAnchor.id) - recordCreationTimestamp(secondAnchor.id)
        if (recordCreationDifference !== 0) return recordCreationDifference
        if (firstAnchor.id === secondAnchor.id && first.type !== second.type) {
          return first.type === 'purchase' ? -1 : 1
        }
        return first.voucher.localeCompare(second.voucher, undefined, { numeric: true })
      })

    let balance = 0
    return combined.map((row) => {
      balance += row.purchase - row.payment
      return { ...row, balance }
    })
  }, [fromDate, purchaseInvoices, supplierId, supplierPayments, toDate])

  useEffect(() => {
    setCurrentPage(1)
  }, [supplierId, fromDate, toDate])

  const totalPages = Math.ceil(rows.length / STATEMENT_PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedRows = rows.slice(
    (safeCurrentPage - 1) * STATEMENT_PAGE_SIZE,
    safeCurrentPage * STATEMENT_PAGE_SIZE,
  )

  const totalPurchase = rows.reduce((sum, row) => sum + row.purchase, 0)
  const totalPayment = rows.reduce((sum, row) => sum + row.payment, 0)
  const closingBalance = rows.length ? rows[rows.length - 1].balance : 0
  const supplier = supplierOptions.find((item) => item.id === supplierId)
  const supplierLabel = supplier?.name ?? ''

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'voucher', label: 'Voucher' },
    { key: 'purchase', label: 'Purchase' },
    { key: 'payment', label: 'Payment' },
    { key: 'balance', label: 'Running Balance' },
  ]

  const getStatementValue = (row: SupplierStatementRow, key: string): string => {
    if (key === 'date') return formatDate(row.date)
    if (key === 'purchase') return row.purchase ? formatStatementCurrency(row.purchase) : ''
    if (key === 'payment') return row.payment ? formatStatementCurrency(row.payment) : ''
    if (key === 'balance') return formatStatementCurrency(row.balance)
    return row.voucher
  }

  const exportStatementToExcel = () => {
    const headers = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(getStatementValue(row, column.key))}</td>`).join('')}</tr>`).join('')
    const workbook = `<html><head><meta charset="UTF-8"></head><body><h1>Supplier Statement - ${escapeHtml(supplierLabel)}</h1><table border="1"><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'supplier-statement.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Supplier statement exported to Excel.')
  }

  const printStatement = (asPdf = false) => {
    if (!rows.length) {
      toast.info('No supplier statement transactions to print.')
      return
    }
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const headers = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const body = rows.map((row) => `<tr>${columns.map((column) => `<td>${escapeHtml(getStatementValue(row, column.key))}</td>`).join('')}</tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>${asPdf ? 'Supplier Statement PDF' : 'Supplier Statement'}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Supplier Statement</h1><p>Supplier: ${escapeHtml(supplierLabel || '-')}</p><table><thead><tr>${headers}</tr></thead><tbody>${body}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
    toast.success(asPdf ? 'Supplier statement PDF is ready to save.' : 'Supplier statement sent to print.')
  }

  return (
    <div>
      <PageHeader title="Supplier Statement" breadcrumb={['Reports', 'Supplier Statement']} />
      <Toolbar
        onRefresh={() => { setRefreshToken((value) => value + 1); toast.success('Supplier statement refreshed.') }}
        onExportExcel={exportStatementToExcel}
        onExportPdf={() => printStatement(true)}
        onPrint={() => printStatement(false)}
      />

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="text-[11px] font-medium text-slate-700">Supplier</label>
        <select
          value={supplierId}
          onChange={(event) => setSupplierId(event.target.value)}
          className="min-w-[200px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
        >
          <option value="">Select supplier</option>
          {supplierOptions.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
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
        {supplier ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-800">Code: {supplier.code}</span> : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2">{column.label}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {paginatedRows.map((row, index) => (
              <tr key={`${row.voucher}-${index}`}>
                {columns.map((column) => <td key={column.key} className="px-3 py-1.5">{getStatementValue(row, column.key)}</td>)}
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-100 bg-slate-50 text-slate-700">
            <tr>
              {columns.map((column) => (
                <td key={column.key} className="px-3 py-2">
                  {column.key === 'date' ? 'Totals' : column.key === 'purchase' ? formatStatementCurrency(totalPurchase) : column.key === 'payment' ? formatStatementCurrency(totalPayment) : column.key === 'balance' ? formatStatementCurrency(closingBalance) : ''}
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

export default SupplierStatementPage