/**
 * @file LoadingDispatchPage.tsx
 * @description Loading and Dispatch management screen with modal-based create/edit.
 *              Provides "Add New" to open a modal and includes Actions (View/Edit/Print/Delete)
 *              in grid. Lines editor includes: Warehouse, Item, Gunny Bag (bharthi) selection,
 *              Date and Quantity. Lines are displayed as compact rows under a single header row.
 */

import React, { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  customers as mockCustomers,
  warehouses,
  items,
  type Dispatch,
  type DispatchLine,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { formatDate } from '../../utils/format'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import PaginationControls from '../../components/common/PaginationControls'
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import { getItems, type ItemResponse } from '../../services/itemservices/item.service'
import { deleteLoadingDispatch, getLoadingDispatches, saveLoadingDispatch, updateLoadingDispatchStatus } from '../../services/loadingdispatch.service'
import { onScopeChange } from '../../utils/scopeEvents'
import { useAuthStore } from '../../store/authStore'
import { CalendarDays } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'

const formatDispatchDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

const todayISODate = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const LOADING_DISPATCH_PAGE_SIZE = 15

/**
 * @component LoadingDispatchModal
 * @description Modal used for adding or editing a dispatch. Contains header fields and
 *              a compact lines editor rendered as a table (single header row + input rows).
 *              Each line now captures a date. A separate "Save Draft" button is placed
 *              in the header area to clearly separate it from the final Save action.
 */
const LoadingDispatchModal: React.FC<{
  open: boolean
  initial?: Dispatch | null
  onClose: () => void
  onSave: (d: Dispatch) => void | Promise<void>
  onSaveDraft?: (d: Dispatch) => void | Promise<void>
  readOnly?: boolean
  viewOnly?: boolean
  onDispatch?: (d: Dispatch) => void | Promise<void>
  customers: CustomerResponse[]
  branches: Branch[]
  items: ItemResponse[]
}> = ({ open, initial, onClose, onSave, onSaveDraft, customers, branches, items: masterItems, readOnly = false, viewOnly = false, onDispatch }) => {
  const dateInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [header, setHeader] = useState({
    id: initial?.id ?? `D-${Date.now()}`,
    dispatchNumber: initial?.dispatchNumber ?? `DISP-${Date.now() % 10000}`,
    customerId: initial?.customerId ?? '',
    lorryNumber: initial?.lorryNumber ?? '',
    driverName: initial?.driverName ?? '',
    driverMobile: initial?.driverMobile ?? '',
    dispatchStatus: initial?.dispatchStatus ?? 'Pending',
    invoiceGenerated: initial?.invoiceGenerated ?? false,
  })
  const [lines, setLines] = useState<DispatchLine[]>(
    initial?.lines?.length
      ? initial.lines
      : [
          {
            id: `DL-${Date.now()}`,
            warehouseId: branches[0]?.id ?? warehouses[0]?.id ?? '',
            date: new Date().toISOString().slice(0, 10),
            itemId: masterItems[0]?.id ?? items[0]?.id ?? '',
            bharthi: '',
            gunnyBagId: '',
            quantity: 0,
            loadedQuantity: 0,
            pendingQuantity: 0,
          },
        ],
  )

  React.useEffect(() => {
    if (open) {
      setHeader({
        id: initial?.id ?? `D-${Date.now()}`,
        dispatchNumber: initial?.dispatchNumber ?? `DISP-${Date.now() % 10000}`,
        customerId: initial?.customerId ?? '',
        lorryNumber: initial?.lorryNumber ?? '',
        driverName: initial?.driverName ?? '',
        driverMobile: initial?.driverMobile ?? '',
        dispatchStatus: initial?.dispatchStatus ?? 'Pending',
        invoiceGenerated: initial?.invoiceGenerated ?? false,
      })
      setLines(
        initial?.lines?.length
          ? initial.lines
          : [
              {
                id: `DL-${Date.now()}`,
                warehouseId: branches[0]?.id ?? warehouses[0]?.id ?? '',
                date: new Date().toISOString().slice(0, 10),
                itemId: masterItems[0]?.id ?? items[0]?.id ?? '',
                bharthi: '',
                gunnyBagId: '',
                quantity: 0,
                loadedQuantity: 0,
                pendingQuantity: 0,
              },
            ],
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial])

  /**
   * @function save
   * @description Validate and emit the dispatch record as final save.
   */
  const save = async () => {
    if (!header.customerId) {
      toast.error('Select customer.')
      return
    }
    if (!lines.length) {
      toast.error('Add at least one loading line.')
      return
    }
    const hasInvalid = lines.some((l) => l.quantity <= 0)
    if (hasInvalid) {
      toast.error('Enter valid quantity for all lines.')
      return
    }
    const newDispatch: Dispatch = {
      id: header.id,
      dispatchNumber: header.dispatchNumber,
      customerId: header.customerId,
      lorryNumber: header.lorryNumber,
      driverName: header.driverName,
      driverMobile: header.driverMobile,
      dispatchDate: lines[0]?.date || todayISODate(),
      dispatchStatus: header.dispatchStatus as any,
      invoiceGenerated: !!header.invoiceGenerated,
      lines: lines.map((l) => ({ ...l, pendingQuantity: l.quantity - (l.loadedQuantity ?? 0) })),
    }
    await onSave(newDispatch)
    toast.success('Dispatch saved.')
    onClose()
  }

  /**
   * @function saveDraft
   * @description Save the dispatch as a draft and return to the saved dispatch list.
   */
  const saveDraft = async () => {
    if (!header.customerId) {
      toast.error('Select customer before saving draft.')
      return
    }
    const newDispatch: Dispatch = {
      id: header.id,
      dispatchNumber: header.dispatchNumber,
      customerId: header.customerId,
      lorryNumber: header.lorryNumber,
      driverName: header.driverName,
      driverMobile: header.driverMobile,
      dispatchDate: lines[0]?.date || todayISODate(),
      dispatchStatus: 'Draft' as any,
      invoiceGenerated: !!header.invoiceGenerated,
      lines: lines.map((l) => ({ ...l, pendingQuantity: l.quantity - (l.loadedQuantity ?? 0) })),
    }
    if (onSaveDraft) await onSaveDraft(newDispatch)
    else await onSave(newDispatch)
    toast.success('Draft saved.')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Add Dispatch</h2>
          <div className="flex items-center gap-2">
            {/* Separate Draft Save button placed in header */}
            
            <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              Close
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <fieldset disabled={readOnly} className="contents">
          <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Dispatch Header</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Customer</label>
                <select
                  value={header.customerId}
                  onChange={(e) => setHeader((h) => ({ ...h, customerId: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Lorry Number</label>
                <input
                  value={header.lorryNumber}
                  onChange={(e) => setHeader((h) => ({ ...h, lorryNumber: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Driver Name</label>
                <input
                  value={header.driverName}
                  onChange={(e) => setHeader((h) => ({ ...h, driverName: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Driver Mobile</label>
                <input
                  value={header.driverMobile}
                  onChange={(e) => setHeader((h) => ({ ...h, driverMobile: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                />
              </div>
            </div>
          </section>

          {/* Lines editor rendered as a compact table: single header row + input rows without repeating labels */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Loading Lines</h3>
              <button
                type="button"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    {
                      id: `DL-${Date.now()}`,
                      warehouseId: branches[0]?.id ?? warehouses[0]?.id ?? '',
                      date: new Date().toISOString().slice(0, 10),
                      itemId: masterItems[0]?.id ?? items[0]?.id ?? '',
                      bharthi: '',
                      gunnyBagId: '',
                      quantity: 0,
                      loadedQuantity: 0,
                      pendingQuantity: 0,
                    },
                  ])
                }
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Gunny Bag (Bharthi)</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="px-3 py-2 align-top">
                        <select
                          value={l.warehouseId}
                          onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, warehouseId: e.target.value } : x)))}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                        >
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.branch_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2 align-top">
                        <div className="relative flex items-center rounded-full border border-slate-200 px-2 py-1 text-xs">
                          <span className="flex-1">{formatDispatchDate(l.date?.slice(0, 10) ?? todayISODate())}</span>
                          <button
                            type="button"
                            aria-label="Select loading line date"
                            title="Select date"
                            disabled={readOnly}
                            onClick={() => {
                              const input = dateInputRefs.current[l.id]
                              if (!input) return
                              if (input.showPicker) input.showPicker()
                              else input.click()
                            }}
                            className="text-slate-600 hover:text-emerald-700 disabled:opacity-50"
                          >
                            <CalendarDays className="h-4 w-4" />
                          </button>
                          <input
                            ref={(input) => { dateInputRefs.current[l.id] = input }}
                            type="date"
                            value={l.date?.slice(0, 10) ?? todayISODate()}
                            onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, date: e.target.value } : x)))}
                            disabled={readOnly}
                            className="pointer-events-none absolute bottom-0 left-0 h-0 w-0 opacity-0"
                            tabIndex={-1}
                          />
                        </div>
                      </td>

                      <td className="px-3 py-2 align-top">
                        <select
                          value={l.itemId}
                          onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, itemId: e.target.value } : x)))}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                        >
                          {masterItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2 align-top">
                        <input
                          type="text"
                          value={l.bharthi}
                          placeholder="e.g. jute bag 120"
                          onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, bharthi: e.target.value, gunnyBagId: '' } : x)))}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>

                      <td className="px-3 py-2 align-top">
                        <input
                          type="number"
                          value={l.quantity}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) =>
                                i === idx
                                  ? {
                                      ...x,
                                      quantity: Number(e.target.value),
                                      pendingQuantity: Number(e.target.value) - (x.loadedQuantity ?? 0),
                                    }
                                  : x,
                              ),
                            )
                          }
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>

                      <td className="px-3 py-2 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setLines((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-xs text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </section>

          </fieldset>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-600">
              <div>
                Drafts are saved via the "Save Draft" button in the header.
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              {!readOnly ? (
                <button type="button" onClick={saveDraft} className="rounded-full border border-slate-200 bg-amber-500 px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-600">
                  {initial ? 'Save Changes' : 'Save Draft'}
                </button>
              ) : null}
              {initial?.dispatchStatus === 'Approved' && onDispatch ? (
                <button
                  type="button"
                  onClick={() => void onDispatch({
                    id: header.id,
                    dispatchNumber: header.dispatchNumber,
                    customerId: header.customerId,
                    lorryNumber: header.lorryNumber,
                    driverName: header.driverName,
                    driverMobile: header.driverMobile,
                    dispatchDate: lines[0]?.date || todayISODate(),
                    dispatchStatus: 'Dispatched',
                    invoiceGenerated: !!header.invoiceGenerated,
                    lines: lines.map((line) => ({ ...line, pendingQuantity: line.quantity - (line.loadedQuantity ?? 0) })),
                  })}
                  className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Dispatch
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @component LoadingDispatchPage
 * @description Page that lists dispatches and allows adding/editing via modal.
 */
const LoadingDispatchPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const { can } = usePermissions()
  const canCreate = can('loading-dispatch', 'create')
  const canEdit = can('loading-dispatch', 'edit')
  const canApprove = can('loading-dispatch', 'approve')
  const canPrint = can('loading-dispatch', 'print')
  const canDelete = can('loading-dispatch', 'delete')
  const [records, setRecords] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [customerOptions, setCustomerOptions] = useState<CustomerResponse[]>([])
  const [branchOptions, setBranchOptions] = useState<Branch[]>([])
  const [itemOptions, setItemOptions] = useState<ItemResponse[]>([])
  const [selected, setSelected] = useState<Dispatch | null>(records[0] ?? null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Dispatch | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Dispatch | null>(null)
  const [searchText, setSearchText] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewing, setViewing] = useState(false)

  const loadMasterData = () => {
    Promise.all([getCustomers(), getBranches(), getItems()])
      .then(([customersResult, branchesResult, itemsResult]) => {
        setCustomerOptions(customersResult)
        setBranchOptions(branchesResult)
        setItemOptions(itemsResult)
      })
      .catch((error) => toast.error(error?.message || 'Failed to load dispatch master data.'))
  }

  React.useEffect(() => {
    loadMasterData()
    return onScopeChange(loadMasterData)
  }, [])

  const loadRecords = async () => {
    try { setLoading(true); const dispatches = await getLoadingDispatches(); setRecords(dispatches); setSelected(dispatches[0] ?? null) }
    catch (error: any) { toast.error(error?.message || 'Failed to load dispatches.') }
    finally { setLoading(false) }
  }

  React.useEffect(() => {
    void loadRecords()
    return onScopeChange(() => { void loadRecords() })
  }, [])

  /**
   * @function openAdd
   * @description Open modal to create a new dispatch.
   */
  const openAdd = () => {
    setEditing(null)
    setViewing(false)
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Open modal to edit an existing dispatch.
   */
  const openEdit = (row: Dispatch) => {
    setEditing(row)
    setViewing(false)
    setModalOpen(true)
  }

  const updateStatus = async (dispatch: Dispatch, status: Dispatch['dispatchStatus']) => {
    try {
      await updateLoadingDispatchStatus(dispatch.id, status, dispatch.dispatchDate || dispatch.lines[0]?.date)
      await loadRecords()
      setModalOpen(false)
      setEditing(null)
      toast.success(`Dispatch ${status.toLowerCase()}.`)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update dispatch status.')
    }
  }

  /**
   * @function handleSave
   * @description Insert or update dispatch in the local records.
   */
  const handleSave = async (d: Dispatch) => {
    await saveLoadingDispatch(d)
    await loadRecords()
  }

  /**
   * @function handleDraftSave
  * @description Save draft records (upsert), refresh the database list, and close the modal.
   */
  const handleDraftSave = async (d: Dispatch) => {
    await handleSave(d)
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteLoadingDispatch(confirmDelete.id)
    setRecords((prev) => prev.filter((x) => x.id !== confirmDelete.id))
    toast.success('Dispatch deleted.')
    setConfirmDelete(null)
    if (selected?.id === confirmDelete.id) setSelected(null)
  }

  const printDispatchDetail = (row: Dispatch) => {
    const customerName = customerOptions.find((customer) => customer.id === row.customerId)?.name ?? mockCustomers.find((customer) => customer.id === row.customerId)?.name ?? '-'
    const rows = (row.lines ?? []).map((line) => `
      <tr>
        <td>${formatDispatchDate(line.date || row.dispatchDate || todayISODate())}</td>
        <td>${itemOptions.find((item) => item.id === line.itemId)?.name ?? items.find((it) => it.id === line.itemId)?.name ?? line.itemId}</td>
        <td>${line.bharthi || '-'}</td>
        <td>${line.quantity}</td>
        <td>${line.loadedQuantity ?? 0}</td>
        <td>${line.pendingQuantity ?? 0}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <title>Dispatch ${row.dispatchNumber}</title>
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
          <div>Dispatch No</div><div>${row.dispatchNumber}</div>
          <div>Customer</div><div>${customerName}</div>
          <div>Lorry No</div><div>${row.lorryNumber}</div>
          <div>Driver Name</div><div>${row.driverName}</div>
          <div>Driver Mobile</div><div>${row.driverMobile}</div>
          <div>Status</div><div>${row.dispatchStatus}</div>
          <div>Date</div><div>${formatDispatchDate(row.dispatchDate || row.lines[0]?.date || todayISODate())}</div>
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
          <div>Total records: ${row.lines.length}</div>
        </div>
      </body>
      </html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const exportDispatches = (mode: 'excel' | 'pdf' | 'print', only?: Dispatch) => {
    if (only) {
      printDispatchDetail(only)
      return
    }
    const rows = records
    if (!rows.length) { toast.info('No dispatches to export.'); return }
    const body = rows.map((dispatch) => `<tr><td>${dispatch.dispatchNumber}</td><td>${customerOptions.find((customer) => customer.id === dispatch.customerId)?.name ?? ''}</td><td>${dispatch.lorryNumber}</td><td>${dispatch.driverName}</td><td>${dispatch.driverMobile}</td><td>${dispatch.dispatchStatus}</td></tr>`).join('')
    const html = `<html><head><title>Loading & Dispatch</title><style>body{font-family:Arial;margin:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Loading & Dispatch</h1><table><thead><tr><th>Dispatch No</th><th>Customer</th><th>Lorry No</th><th>Driver</th><th>Driver Mobile</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></body></html>`
    if (mode === 'excel') { const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([html], { type: 'application/vnd.ms-excel' })); link.download = 'loading-dispatch.xls'; link.click(); toast.success('Dispatches exported to Excel.'); return }
    const win = window.open('', '_blank', 'width=1200,height=800'); if (!win) { toast.error('Popup blocked.'); return }; win.document.write(html); win.document.close(); win.focus(); if (mode === 'print' || mode === 'pdf') setTimeout(() => win.print(), 300)
  }

  const columns: ColumnDef<Dispatch>[] = [
    { key: 'dispatchNumber', label: 'Dispatch No' },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customerOptions.find((c) => c.id === row.customerId)?.name ?? mockCustomers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    { key: 'lorryNumber', label: 'Lorry No' },
    { key: 'driverName', label: 'Driver' },
    { key: 'driverMobile', label: 'Driver Mobile' },
    {
      key: 'dispatchStatus',
      label: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            row.dispatchStatus === 'Pending' ? 'bg-amber-50 text-amber-700' : row.dispatchStatus === 'Confirmed' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {row.dispatchStatus}
        </span>
      ),
    },
  ]

  const scopedRecords = useMemo(() => {
    if (!selectedOrganizationId) return records
    return records.filter((dispatch) => {
      const organizationId = (dispatch as any).organizationId ?? (dispatch as any).organization_id
      return !organizationId || organizationId === selectedOrganizationId
    })
  }, [records, selectedOrganizationId])

  const filteredRecords = scopedRecords.filter((dispatch) => {
    const query = appliedSearch.trim().toLowerCase()
    if (!query) return true
    const customerName = customerOptions.find((customer) => customer.id === dispatch.customerId)?.name ?? mockCustomers.find((customer) => customer.id === dispatch.customerId)?.name ?? ''
    return [dispatch.dispatchNumber, customerName, dispatch.lorryNumber, dispatch.driverName, dispatch.driverMobile]
      .some((value) => value.toLowerCase().includes(query))
  })

  const totalPages = Math.ceil(filteredRecords.length / LOADING_DISPATCH_PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedRecords = filteredRecords.slice(
    (safeCurrentPage - 1) * LOADING_DISPATCH_PAGE_SIZE,
    safeCurrentPage * LOADING_DISPATCH_PAGE_SIZE,
  )

  React.useEffect(() => {
    setCurrentPage(1)
  }, [appliedSearch])

  const lines = useMemo<DispatchLine[]>(() => selected?.lines ?? [], [selected])
  const totalPending = lines.reduce((sum, l) => sum + (l.pendingQuantity ?? 0), 0)

  return (
    <div className="space-y-4">
      <PageHeader title="Loading & Dispatch" breadcrumb={['Transactions', 'Loading & Dispatch']} />
      <Toolbar
        onAddNew={canCreate ? openAdd : undefined}
        onExportExcel={canPrint ? () => exportDispatches('excel') : undefined}
        onExportPdf={canPrint ? () => exportDispatches('pdf') : undefined}
        onPrint={canPrint ? () => exportDispatches('print') : undefined}
        onRefresh={() => void loadRecords()}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by dispatch no, customer, lorry, driver or mobile..."
          aria-label="Search dispatches"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-200"
        />
        <button
          type="button"
          onClick={() => setAppliedSearch(searchText.trim())}
          className="rounded-full bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-700"
        >
          Search
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchText('')
            setAppliedSearch('')
          }}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>

      <DataGrid<Dispatch> data={paginatedRecords} columns={columns} getRowId={(row) => row.id} loading={loading} onView={(r: any) => { setEditing(r as Dispatch); setViewing(true); setModalOpen(true) }} onEdit={canEdit ? (r: any) => openEdit(r as Dispatch) : undefined} onApprove={canApprove ? (r: any) => void updateStatus(r as Dispatch, 'Approved') : undefined} isRowApproved={(row) => row.dispatchStatus === 'Approved' || row.dispatchStatus === 'Dispatched'} onDelete={canDelete ? (r: any) => setConfirmDelete(r as Dispatch) : undefined} onPrint={canPrint ? (r: any) => printDispatchDetail(r as Dispatch) : undefined} />

      <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {false && selected ? (
        <div className="grid gap-3 md:grid-cols-[2fr,3fr]">
          <div className="space-y-2 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-800">Dispatch Header</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
              <dt className="font-medium">Dispatch No</dt>
              <dd>{selected?.dispatchNumber}</dd>
              <dt className="font-medium">Customer</dt>
              <dd>{customerOptions.find((c) => c.id === selected?.customerId)?.name ?? mockCustomers.find((c) => c.id === selected?.customerId)?.name ?? ''}</dd>
              <dt className="font-medium">Lorry No</dt>
              <dd>{selected?.lorryNumber}</dd>
              <dt className="font-medium">Driver</dt>
              <dd>{selected?.driverName}</dd>
              <dt className="font-medium">Driver Mobile</dt>
              <dd>{selected?.driverMobile}</dd>
              <dt className="font-medium">Status</dt>
              <dd>{selected?.dispatchStatus}</dd>
              <dt className="font-medium">Invoice Generated</dt>
              <dd>{selected?.invoiceGenerated ? 'Yes' : 'No'}</dd>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-800">Loading Details</h2>
            <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Branch</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Bharthi</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Loaded</th>
                    <th className="px-3 py-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">{branchOptions.find((branch) => branch.id === l.warehouseId)?.branch_name ?? warehouses.find((w) => w.id === l.warehouseId)?.name ?? ''}</td>
                      <td className="px-3 py-1.5">{formatDispatchDate(l.date)}</td>
                      <td className="px-3 py-1.5">{itemOptions.find((item) => item.id === l.itemId)?.name ?? items.find((it) => it.id === l.itemId)?.name ?? ''}</td>
                      <td className="px-3 py-1.5">{l.bharthi}</td>
                      <td className="px-3 py-1.5">{l.quantity}</td>
                      <td className="px-3 py-1.5">{l.loadedQuantity}</td>
                      <td className="px-3 py-1.5">{l.pendingQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] text-slate-600">
              Total pending quantity: 
              <span className="font-semibold text-emerald-700">{totalPending}</span>
            </p>
          </div>
        </div>
      ) : null}

      <LoadingDispatchModal
        open={modalOpen}
        initial={editing}
        customers={customerOptions}
        branches={branchOptions}
        items={itemOptions}
        readOnly={viewing || editing?.dispatchStatus === 'Approved' || editing?.dispatchStatus === 'Dispatched'}
        viewOnly={viewing}
        onDispatch={(dispatch) => updateStatus(dispatch, 'Dispatched')}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          setViewing(false)
        }}
        onSave={async (d) => {
          await handleSave(d)
          setModalOpen(false)
          setEditing(null)
        }}
        onSaveDraft={handleDraftSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete dispatch?"
        description={confirmDelete ? `Are you sure you want to delete dispatch ${confirmDelete.dispatchNumber}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default LoadingDispatchPage