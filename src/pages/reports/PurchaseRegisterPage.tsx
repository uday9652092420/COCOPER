/**
 * @file PurchaseRegisterPage.tsx
 * @description Read-only purchase register report for saved purchase invoices.
 */

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import PaginationControls from '../../components/common/PaginationControls'
import { getSuppliers, type SupplierResponse } from '../../services/supplierservices/supplier.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import { getPurchaseInvoices, type PurchaseInvoiceDTO } from '../../services/purchaseinvoiceservices/purchaseInvoice.service'
import { onScopeChange } from '../../utils/scopeEvents'
import { formatAmount, formatDate } from '../../utils/format'
import { useAuthStore } from '../../store/authStore'

const PAGE_SIZE = 20

function dateValue(value: string): number {
  const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '')
  const normalized = ddmmyyyy ? `${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}` : value
  const timestamp = new Date(normalized).getTime()
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
}

const PurchaseRegisterPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [records, setRecords] = useState<PurchaseInvoiceDTO[]>([])
  const [supplierOptions, setSupplierOptions] = useState<SupplierResponse[]>([])
  const [branchOptions, setBranchOptions] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)

  const loadData = async () => {
    setLoading(true)
    setRecords([])
    const [invoiceResult, supplierResult, branchResult] = await Promise.allSettled([
      getPurchaseInvoices(),
      getSuppliers(),
      getBranches(),
    ])

    if (invoiceResult.status === 'fulfilled') {
      setRecords(selectedOrganizationId
        ? invoiceResult.value.filter((invoice) => invoice.organizationId === selectedOrganizationId)
        : invoiceResult.value)
    } else {
      console.error(invoiceResult.reason)
      setRecords([])
    }

    if (supplierResult.status === 'fulfilled') {
      setSupplierOptions([...supplierResult.value].sort((a, b) => a.name.localeCompare(b.name)))
    } else {
      console.error(supplierResult.reason)
      setSupplierOptions([])
    }

    if (branchResult.status === 'fulfilled') {
      setBranchOptions([...branchResult.value].sort((a, b) => a.branch_name.localeCompare(b.branch_name)))
    } else {
      console.error(branchResult.reason)
      setBranchOptions([])
    }

    if (invoiceResult.status === 'rejected' || supplierResult.status === 'rejected' || branchResult.status === 'rejected') {
      toast.error('Some purchase register data could not be loaded. Please refresh.')
    }
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
    return onScopeChange(() => { void loadData() })
  }, [refreshToken, selectedOrganizationId])

  const supplierName = (id: string) => supplierOptions.find((supplier) => supplier.id === id)?.name ?? ''
  const branchName = (id: string) => branchOptions.find((branch) => branch.id === id)?.branch_name ?? ''

  const filtered = useMemo(() => records
    .filter((invoice) => {
      const query = search.toLowerCase()
      const supplier = supplierName(invoice.supplierId)
      const branch = branchName(invoice.branchId)
      const invoiceDate = dateValue(invoice.invoiceDate)
      const from = fromDate ? dateValue(fromDate) : 0
      const to = toDate ? dateValue(toDate) + 86400000 - 1 : Number.MAX_SAFE_INTEGER
      return (!query || invoice.invoiceNo.toLowerCase().includes(query) || supplier.toLowerCase().includes(query) || branch.toLowerCase().includes(query)) && (!supplierId || invoice.supplierId === supplierId) && (!branchId || invoice.branchId === branchId) && invoiceDate >= from && invoiceDate <= to
    })
    .sort((first, second) => {
      const dateDifference = dateValue(first.invoiceDate) - dateValue(second.invoiceDate)
      return dateDifference || first.invoiceNo.localeCompare(second.invoiceNo, undefined, { numeric: true })
    }), [branchId, branchOptions, fromDate, records, search, supplierId, supplierOptions, toDate])

  useEffect(() => { setCurrentPage(1) }, [branchId, fromDate, search, supplierId, toDate])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedRecords = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE)
  const exportRows = (rows: PurchaseInvoiceDTO[]) => rows.map((invoice) => [formatDate(invoice.invoiceDate), invoice.invoiceNo, supplierName(invoice.supplierId), branchName(invoice.branchId), formatAmount(Number(invoice.grandTotal ?? 0))])

  const exportToExcel = () => {
    const body = exportRows(filtered).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
    const workbook = `<html><head><meta charset="UTF-8"></head><body><h1>Purchase Register</h1><table border="1"><thead><tr><th>Date</th><th>Invoice No</th><th>Supplier</th><th>Branch</th><th>Amount</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'purchase-register.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Purchase register exported to Excel.')
  }

  const printRegister = (asPdf = false) => {
    if (!filtered.length) { toast.info('No purchase invoices to print.'); return }
    const body = exportRows(filtered).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
    const totalAmount = formatAmount(filtered.reduce((sum, invoice) => sum + Number(invoice.grandTotal ?? 0), 0))
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) { toast.error('Popup blocked. Please allow popups and try again.'); return }
    win.document.write(`<!DOCTYPE html><html><head><title>${asPdf ? 'Purchase Register PDF' : 'Purchase Register'}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}tfoot{font-weight:bold;background:#f1f5f9}</style></head><body><h1>Purchase Register</h1><table><thead><tr><th>Date</th><th>Invoice No</th><th>Supplier</th><th>Branch</th><th>Amount</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="4">Total Purchase Amount</td><td>${escapeHtml(totalAmount)}</td></tr></tfoot></table></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
    toast.success(asPdf ? 'Purchase register PDF is ready to save.' : 'Purchase register sent to print.')
  }

  return (
    <div>
      <PageHeader title="Purchase Register" breadcrumb={['Reports', 'Purchase Register']} />
      <Toolbar onExportExcel={exportToExcel} onExportPdf={() => printRegister(true)} onPrint={() => printRegister(false)} onRefresh={() => setRefreshToken((value) => value + 1)} />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by invoice, supplier, branch..." />
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs">
        <label className="font-medium text-slate-700">Supplier</label>
        <select value={supplierId} onChange={(event) => setSupplierId(event.target.value)} className="min-w-[200px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"><option value="">All Suppliers</option>{supplierOptions.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>
        <label className="font-medium text-slate-700">Branch</label>
        <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="min-w-[180px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"><option value="">All Branches</option>{branchOptions.map((branch) => <option key={branch.id} value={branch.id}>{branch.branch_name}</option>)}</select>
        <label className="font-medium text-slate-700">From Date</label>
        <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs" />
        <label className="font-medium text-slate-700">To Date</label>
        <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50"><tr>{['Date', 'Invoice No', 'Supplier', 'Branch', 'Amount'].map((label) => <th key={label} className="px-3 py-3 text-left font-medium text-slate-600">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr> : paginatedRecords.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No records found.</td></tr> : paginatedRecords.map((invoice) => <tr key={invoice.id} className="hover:bg-slate-50"><td className="px-3 py-3 text-slate-700">{formatDate(invoice.invoiceDate)}</td><td className="px-3 py-3 text-slate-700">{invoice.invoiceNo}</td><td className="px-3 py-3 text-slate-700">{supplierName(invoice.supplierId)}</td><td className="px-3 py-3 text-slate-700">{branchName(invoice.branchId)}</td><td className="px-3 py-3 text-slate-700">{formatAmount(Number(invoice.grandTotal ?? 0))}</td></tr>)}</tbody>
        </table>
      </div>
      <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800"><span className="font-semibold">Total Purchase Amount:</span> {formatAmount(filtered.reduce((sum, invoice) => sum + Number(invoice.grandTotal ?? 0), 0))}</div>
    </div>
  )
}

export default PurchaseRegisterPage