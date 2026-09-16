/**
 * @file PendingDispatchReportPage.tsx
 * @description Pending dispatch report using dispatch data.
 */

import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CalendarDays } from 'lucide-react'
import type { Dispatch } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import DataGrid, { type Column } from '../../components/common/DataGrid'
import PaginationControls from '../../components/common/PaginationControls'
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'
import { getLoadingDispatches } from '../../services/loadingdispatch.service'
import { onScopeChange } from '../../utils/scopeEvents'
import { useAuthStore } from '../../store/authStore'

const formatDateInputText = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

const normalizeFilterDate = (value: string): string => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

const toIsoDate = (value: string): string => normalizeFilterDate(value)

const toDisplayDate = (value: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

const normalizeDispatchDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  return normalizeFilterDate(value)
}

const PENDING_DISPATCH_PAGE_SIZE = 15

/**
 * @component PendingDispatchReportPage
 * @description Pending dispatch report page component.
 */
const PendingDispatchReportPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [customerFilter, setCustomerFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('Pending')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const fromDatePickerRef = useRef<HTMLInputElement | null>(null)
  const toDatePickerRef = useRef<HTMLInputElement | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [dispatchRows, customerRows] = await Promise.all([getLoadingDispatches(), getCustomers()])
      setDispatches(dispatchRows)
      setCustomers(customerRows)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load pending dispatches.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    return onScopeChange(() => { void loadData() })
  }, [])

  const scopedDispatches = useMemo(() => {
    if (!selectedOrganizationId) return dispatches
    return dispatches.filter((dispatch) => {
      const organizationId = (dispatch as any).organizationId ?? (dispatch as any).organization_id
      return !organizationId || organizationId === selectedOrganizationId
    })
  }, [dispatches, selectedOrganizationId])

  const pending = useMemo(
    () => scopedDispatches.filter((dispatch) => {
      const displayStatus = dispatch.dispatchStatus === 'Dispatched' ? 'Dispatched' : 'Pending'
      if (customerFilter && dispatch.customerId !== customerFilter) return false
      if (statusFilter && displayStatus !== statusFilter) return false
      const dispatchDate = normalizeDispatchDate(dispatch.dispatchDate || dispatch.lines[0]?.date || '')
      const normalizedFromDate = normalizeFilterDate(fromDate)
      const normalizedToDate = normalizeFilterDate(toDate)
      if (normalizedFromDate && (!dispatchDate || dispatchDate < normalizedFromDate)) return false
      if (normalizedToDate && (!dispatchDate || dispatchDate > normalizedToDate)) return false
      return true
    }),
    [customerFilter, fromDate, scopedDispatches, statusFilter, toDate],
  )

  const displayStatus = (dispatch: Dispatch) => dispatch.dispatchStatus === 'Dispatched' ? 'Dispatched' : 'Pending'

  const totalPages = Math.ceil(pending.length / PENDING_DISPATCH_PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedPending = pending.slice(
    (safeCurrentPage - 1) * PENDING_DISPATCH_PAGE_SIZE,
    safeCurrentPage * PENDING_DISPATCH_PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [customerFilter, fromDate, statusFilter, toDate])

  const columns: Column<Dispatch>[] = [
    { key: 'dispatchNumber', label: 'Dispatch No' },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    { key: 'lorryNumber', label: 'Lorry No' },
    { key: 'driverName', label: 'Driver Name' },
    { key: 'driverMobile', label: 'Driver Mobile' },
    {
      key: 'dispatchStatus',
      label: 'Status',
      render: (row) => displayStatus(row),
    },
  ]

  const totalPending = useMemo(() => pending.length, [pending])

  const escapeHtml = (value: unknown) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const printDispatches = (rows: Dispatch[]) => {
    if (!rows.length) { toast.info('No pending dispatches to print.'); return }
    const body = rows.map((dispatch) => `<tr><td>${escapeHtml(dispatch.dispatchNumber)}</td><td>${escapeHtml(customers.find((customer) => customer.id === dispatch.customerId)?.name)}</td><td>${escapeHtml(dispatch.lorryNumber)}</td><td>${escapeHtml(dispatch.driverName)}</td><td>${escapeHtml(dispatch.driverMobile)}</td><td>${escapeHtml(displayStatus(dispatch))}</td></tr>`).join('')
    const html = `<html><head><title>Pending Dispatch</title><style>body{font-family:Arial;margin:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Pending Dispatch</h1><table><thead><tr><th>Dispatch No</th><th>Customer</th><th>Lorry No</th><th>Driver Name</th><th>Driver Mobile</th><th>Status</th></tr></thead><tbody>${body}</tbody></table><p><strong>Pending Dispatch Count: ${rows.length}</strong></p></body></html>`
    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) { toast.error('Popup blocked. Please allow popups to print.'); return }
    win.document.write(html); win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
  }

  const exportToExcel = () => {
    if (!pending.length) { toast.info('No dispatches to export.'); return }
    const body = pending.map((dispatch) => `<tr><td>${escapeHtml(dispatch.dispatchNumber)}</td><td>${escapeHtml(customers.find((customer) => customer.id === dispatch.customerId)?.name)}</td><td>${escapeHtml(dispatch.lorryNumber)}</td><td>${escapeHtml(dispatch.driverName)}</td><td>${escapeHtml(dispatch.driverMobile)}</td><td>${escapeHtml(displayStatus(dispatch))}</td></tr>`).join('')
    const html = `<html><body><table border="1"><thead><tr><th>Dispatch No</th><th>Customer</th><th>Lorry No</th><th>Driver Name</th><th>Driver Mobile</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' })); link.download = 'pending-dispatch.xls'; link.click(); URL.revokeObjectURL(link.href); toast.success('Pending dispatches exported to Excel.')
  }

  const printDispatchDetail = (dispatch: Dispatch) => {
    const customerName = customers.find((customer) => customer.id === dispatch.customerId)?.name ?? '-'
    const dateValue = dispatch.dispatchDate || dispatch.lines[0]?.date || ''
    const rows = (dispatch.lines ?? []).map((line) => `
      <tr>
        <td>${escapeHtml(line.date || dateValue || '-')}</td>
        <td>${escapeHtml(line.itemId || '-')}</td>
        <td>${escapeHtml(line.bharthi || '-')}</td>
        <td>${escapeHtml(line.quantity ?? 0)}</td>
        <td>${escapeHtml(line.loadedQuantity ?? 0)}</td>
        <td>${escapeHtml(line.pendingQuantity ?? 0)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>Dispatch ${escapeHtml(dispatch.dispatchNumber)}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 28px; color: #0f172a; }
          h1 { font-size: 26px; margin-bottom: 12px; }
          .meta { margin: 12px 0 20px; display: grid; grid-template-columns: 180px 1fr; row-gap: 8px; font-size: 13px; }
          .meta div:nth-child(odd) { font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; font-size: 12px; }
          th { background: #f8fafc; }
          .footer { margin-top: 24px; font-size: 12px; color: #475569; }
        </style>
      </head>
      <body>
        <h1>Dispatch Details</h1>
        <div class="meta">
          <div>Dispatch No</div><div>${escapeHtml(dispatch.dispatchNumber)}</div>
          <div>Customer</div><div>${escapeHtml(customerName)}</div>
          <div>Lorry No</div><div>${escapeHtml(dispatch.lorryNumber)}</div>
          <div>Driver Name</div><div>${escapeHtml(dispatch.driverName)}</div>
          <div>Driver Mobile</div><div>${escapeHtml(dispatch.driverMobile)}</div>
          <div>Status</div><div>${escapeHtml(displayStatus(dispatch))}</div>
          <div>Date</div><div>${escapeHtml(dateValue)}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Item</th>
              <th>Bharthi</th>
              <th>Quantity</th>
              <th>Loaded</th>
              <th>Pending</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="6">No line items available</td></tr>'}</tbody>
        </table>

        <div class="footer">
          <div>Pending Dispatch Count: ${rows ? dispatch.lines.length : 0}</div>
        </div>
      </body>
      </html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast.error('Popup blocked. Please allow popups and try again.'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <div>
      <PageHeader title="Pending Dispatch" breadcrumb={['Reports', 'Pending Dispatch']} />
      <Toolbar
        onExportExcel={exportToExcel}
        onExportPdf={() => printDispatches(pending)}
        onPrint={() => printDispatches(pending)}
        onRefresh={() => { void loadData(); toast.success('Pending dispatches refreshed.') }}
        onColumnChooser={undefined}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-[11px] font-medium text-slate-700">
          Customer
          <select value={customerFilter} onChange={(event) => setCustomerFilter(event.target.value)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-normal">
            <option value="">All Customers</option>
            {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-[11px] font-medium text-slate-700">
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-full border border-slate-200 px-3 py-2 text-sm font-normal">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Dispatched">Dispatched</option>
          </select>
        </label>
        <label className="flex min-w-[145px] flex-1 flex-col gap-1 text-[11px] font-medium text-slate-700">
          From Date
          <div className="relative">
            <input type="text" inputMode="numeric" value={fromDate} placeholder="dd/mm/yyyy" maxLength={10} onChange={(event) => setFromDate(formatDateInputText(event.target.value))} className="w-full rounded-full border border-slate-200 px-3 py-2 pr-10 text-sm font-normal" />
            <input
              ref={fromDatePickerRef}
              type="date"
              value={toIsoDate(fromDate)}
              onChange={(event) => setFromDate(toDisplayDate(event.target.value))}
              className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0"
              tabIndex={-1}
            />
            <button type="button" aria-label="Select from date" onClick={() => fromDatePickerRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600">
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </label>
        <label className="flex min-w-[145px] flex-1 flex-col gap-1 text-[11px] font-medium text-slate-700">
          To Date
          <div className="relative">
            <input type="text" inputMode="numeric" value={toDate} placeholder="dd/mm/yyyy" maxLength={10} onChange={(event) => setToDate(formatDateInputText(event.target.value))} className="w-full rounded-full border border-slate-200 px-3 py-2 pr-10 text-sm font-normal" />
            <input
              ref={toDatePickerRef}
              type="date"
              value={toIsoDate(toDate)}
              onChange={(event) => setToDate(toDisplayDate(event.target.value))}
              className="pointer-events-none absolute right-2 top-1/2 h-5 w-5 -translate-y-1/2 opacity-0"
              tabIndex={-1}
            />
            <button type="button" aria-label="Select to date" onClick={() => toDatePickerRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-600">
              <CalendarDays className="h-4 w-4" />
            </button>
          </div>
        </label>
        <button type="button" onClick={() => { setCustomerFilter(''); setStatusFilter('Pending'); setFromDate(''); setToDate('') }} className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
          Clear Filters
        </button>
      </div>

      <DataGrid<Dispatch>
        data={paginatedPending}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={undefined}
        onEdit={undefined}
        onDelete={undefined}
        onPrint={printDispatchDetail}
      />

      <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Pending Dispatch Count:</span> {totalPending}
      </div>
    </div>
  )
}

export default PendingDispatchReportPage