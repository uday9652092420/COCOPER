/**
 * @file SalesRegisterPage.tsx
 * @description Sales register report listing direct sales.
 */

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import PaginationControls from '../../components/common/PaginationControls'
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import { getDirectSales } from '../../services/directsalesservices/directSale.service'
import type { DirectSales } from '../../mock/db'
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

/**
 * @component SalesRegisterPage
 * @description Sales register page component.
 */
const SalesRegisterPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [records, setRecords] = useState<DirectSales[]>([])
  const [customerOptions, setCustomerOptions] = useState<CustomerResponse[]>([])
  const [branchOptions, setBranchOptions] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [branchId, setBranchId] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [refreshToken, setRefreshToken] = useState(0)

  const loadData = async () => {
    setLoading(true)
    setRecords([])
    const [salesResult, customerResult, branchResult] = await Promise.allSettled([getDirectSales(), getCustomers(), getBranches()])
    if (salesResult.status === 'fulfilled') {
      setRecords(selectedOrganizationId
        ? salesResult.value.filter((sale) => sale.organizationId === selectedOrganizationId)
        : salesResult.value)
    }
    else { console.error(salesResult.reason); setRecords([]) }
    if (customerResult.status === 'fulfilled') setCustomerOptions([...customerResult.value].sort((a, b) => a.name.localeCompare(b.name)))
    else { console.error(customerResult.reason); setCustomerOptions([]) }
    if (branchResult.status === 'fulfilled') setBranchOptions([...branchResult.value].sort((a, b) => a.branch_name.localeCompare(b.branch_name)))
    else { console.error(branchResult.reason); setBranchOptions([]) }
    if (salesResult.status === 'rejected' || customerResult.status === 'rejected' || branchResult.status === 'rejected') toast.error('Some sales register data could not be loaded. Please refresh.')
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
    return onScopeChange(() => { void loadData() })
  }, [refreshToken, selectedOrganizationId])

  const customerName = (id: string) => customerOptions.find((customer) => customer.id === id)?.name ?? ''
  const branchName = (sale: DirectSales) => branchOptions.find((branch) => branch.id === (sale.branchId ?? sale.warehouseId))?.branch_name ?? ''

  const filtered = useMemo(() => records.filter((sale) => {
    const query = search.toLowerCase()
    const customer = customerName(sale.customerId)
    const branch = branchName(sale)
    const saleDate = dateValue(sale.invoiceDate)
    const from = fromDate ? dateValue(fromDate) : 0
    const to = toDate ? dateValue(toDate) + 86400000 - 1 : Number.MAX_SAFE_INTEGER
    return (!query || customer.toLowerCase().includes(query) || branch.toLowerCase().includes(query) || (sale.directSaleNo ?? '').toLowerCase().includes(query)) && (!customerId || sale.customerId === customerId) && (!customerType || sale.customerType === customerType) && (!branchId || (sale.branchId ?? sale.warehouseId) === branchId) && saleDate >= from && saleDate <= to
  }).sort((first, second) => dateValue(first.invoiceDate) - dateValue(second.invoiceDate)), [branchId, branchOptions, customerId, customerOptions, customerType, fromDate, records, search, toDate])

  useEffect(() => { setCurrentPage(1) }, [branchId, customerId, customerType, fromDate, search, toDate])
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedRecords = filtered.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE)
  const exportRows = (rows: DirectSales[]) => rows.map((sale) => [formatDate(sale.invoiceDate), customerName(sale.customerId), sale.customerType, branchName(sale), formatAmount(Number(sale.invoiceTotal ?? 0))])

  const exportToExcel = () => {
    const body = exportRows(filtered).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
    const workbook = `<html><head><meta charset="UTF-8"></head><body><h1>Sales Register</h1><table border="1"><thead><tr><th>Date</th><th>Customer</th><th>Type</th><th>Branch</th><th>Amount</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a'); link.href = url; link.download = 'sales-register.xls'; link.click(); URL.revokeObjectURL(url)
    toast.success('Sales register exported to Excel.')
  }

  const printRegister = (asPdf = false) => {
    if (!filtered.length) { toast.info('No sales to print.'); return }
    const body = exportRows(filtered).map((row) => `<tr>${row.map((value) => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`).join('')
    const totalAmount = formatAmount(filtered.reduce((sum, sale) => sum + Number(sale.invoiceTotal ?? 0), 0))
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) { toast.error('Popup blocked. Please allow popups and try again.'); return }
    win.document.write(`<!DOCTYPE html><html><head><title>${asPdf ? 'Sales Register PDF' : 'Sales Register'}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}tfoot{font-weight:bold;background:#f1f5f9}</style></head><body><h1>Sales Register</h1><table><thead><tr><th>Date</th><th>Customer</th><th>Type</th><th>Branch</th><th>Amount</th></tr></thead><tbody>${body}</tbody><tfoot><tr><td colspan="4">Total Sales Amount</td><td>${escapeHtml(totalAmount)}</td></tr></tfoot></table></body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
    toast.success(asPdf ? 'Sales register PDF is ready to save.' : 'Sales register sent to print.')
  }

  return (
    <div>
      <PageHeader title="Sales Register" breadcrumb={['Reports', 'Sales Register']} />
      <Toolbar onExportExcel={exportToExcel} onExportPdf={() => printRegister(true)} onPrint={() => printRegister(false)} onRefresh={() => setRefreshToken((value) => value + 1)} />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by customer, branch..." />
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs lg:flex-nowrap">
        <label className="whitespace-nowrap text-[11px] font-medium text-slate-700">Customer</label>
        <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="w-[160px] min-w-0 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="">All Customers</option>{customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select>
        <label className="whitespace-nowrap text-[11px] font-medium text-slate-700">Type</label>
        <select value={customerType} onChange={(event) => setCustomerType(event.target.value)} className="w-[95px] min-w-0 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="">All Types</option><option value="Local">Local</option><option value="Red">Red</option><option value="Premium">Premium</option></select>
        <label className="whitespace-nowrap text-[11px] font-medium text-slate-700">Branch</label>
        <select value={branchId} onChange={(event) => setBranchId(event.target.value)} className="w-[155px] min-w-0 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-xs"><option value="">All Branches</option>{branchOptions.map((branch) => <option key={branch.id} value={branch.id}>{branch.branch_name}</option>)}</select>
        <label className="whitespace-nowrap text-[11px] font-medium text-slate-700">From Date</label><input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => setFromDate(event.target.value)} className="w-[132px] min-w-0 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-xs" />
        <label className="whitespace-nowrap text-[11px] font-medium text-slate-700">To Date</label><input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => setToDate(event.target.value)} className="w-[132px] min-w-0 rounded-full border border-slate-200 bg-white px-2 py-1.5 text-xs" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm"><table className="min-w-full divide-y divide-slate-100 text-sm"><thead className="bg-slate-50"><tr>{['Date', 'Customer', 'Type', 'Branch', 'Amount'].map((label) => <th key={label} className="px-3 py-3 text-left font-medium text-slate-600">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading...</td></tr> : paginatedRecords.length === 0 ? <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No records found.</td></tr> : paginatedRecords.map((sale) => <tr key={sale.id} className="hover:bg-slate-50"><td className="px-3 py-3 text-slate-700">{formatDate(sale.invoiceDate)}</td><td className="px-3 py-3 text-slate-700">{customerName(sale.customerId)}</td><td className="px-3 py-3 text-slate-700">{sale.customerType}</td><td className="px-3 py-3 text-slate-700">{branchName(sale)}</td><td className="px-3 py-3 text-slate-700">{formatAmount(Number(sale.invoiceTotal ?? 0))}</td></tr>)}</tbody></table></div>
      <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Total Sales Amount:</span> {formatAmount(filtered.reduce((sum, sale) => sum + Number(sale.invoiceTotal ?? 0), 0))}
      </div>
    </div>
  )
}

export default SalesRegisterPage