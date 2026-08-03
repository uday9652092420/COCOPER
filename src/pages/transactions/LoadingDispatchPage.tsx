/**
 * @file LoadingDispatchPage.tsx
 * @description Loading and Dispatch management screen with modal-based create/edit.
 *              Provides "Add New" to open a modal and includes Actions (View/Edit/Print/Delete)
 *              in grid. Lines editor includes: Warehouse, Item, Gunny Bag (bharthi) selection,
 *              Date and Quantity. Lines are displayed as compact rows under a single header row.
 */

import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  dispatches as dbDispatches,
  customers,
  warehouses,
  items,
  gunnyBags,
  type Dispatch,
  type DispatchLine,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { formatDate } from '../../utils/format'
import RowActions from '../../components/common/RowActions'
import ConfirmDialog from '../../components/common/ConfirmDialog'

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
  onSave: (d: Dispatch) => void
  onSaveDraft?: (d: Dispatch) => void
}> = ({ open, initial, onClose, onSave, onSaveDraft }) => {
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
            warehouseId: warehouses[0]?.id ?? '',
            date: new Date().toISOString().slice(0, 10),
            itemId: items[0]?.id ?? '',
            bharthi: gunnyBags[0]?.bharthi ?? 0,
            gunnyBagId: gunnyBags[0]?.id ?? '',
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
                warehouseId: warehouses[0]?.id ?? '',
                date: new Date().toISOString().slice(0, 10),
                itemId: items[0]?.id ?? '',
                bharthi: gunnyBags[0]?.bharthi ?? 0,
                gunnyBagId: gunnyBags[0]?.id ?? '',
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
  const save = () => {
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
      dispatchStatus: header.dispatchStatus as any,
      invoiceGenerated: !!header.invoiceGenerated,
      lines: lines.map((l) => ({ ...l, pendingQuantity: l.quantity - (l.loadedQuantity ?? 0) })),
    }
    onSave(newDispatch)
    toast.success('Dispatch saved (mock).')
    onClose()
  }

  /**
   * @function saveDraft
   * @description Save the dispatch as a draft. Draft save does not close the modal.
   */
  const saveDraft = () => {
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
      dispatchStatus: 'Draft' as any,
      invoiceGenerated: !!header.invoiceGenerated,
      lines: lines.map((l) => ({ ...l, pendingQuantity: l.quantity - (l.loadedQuantity ?? 0) })),
    }
    if (onSaveDraft) onSaveDraft(newDispatch)
    else onSave(newDispatch)
    toast.success('Draft saved (mock).')
    // intentionally keep modal open so users can continue editing drafts
  }

  if (!open) return null

  const selectedCustomer = customers.find((c) => c.id === header.customerId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Add / Edit Dispatch</h2>
          <div className="flex items-center gap-2">
            {/* Separate Draft Save button placed in header */}
            
            <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100">
              Close
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 text-xs">
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
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
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
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Loading Lines</h3>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Warehouse</th>
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
                          {warehouses.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2 align-top">
                        <input
                          type="date"
                          value={l.date?.slice(0, 10) ?? new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, date: e.target.value } : x)))}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                        />
                      </td>

                      <td className="px-3 py-2 align-top">
                        <select
                          value={l.itemId}
                          onChange={(e) => setLines((prev) => prev.map((x, i) => (i === idx ? { ...x, itemId: e.target.value } : x)))}
                          className="w-full rounded-full border border-slate-200 px-2 py-1 text-xs"
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-3 py-2 align-top">
                        <div className="flex gap-2">
                          <select
                            value={l.gunnyBagId}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x, i) =>
                                  i === idx
                                    ? {
                                        ...x,
                                        gunnyBagId: e.target.value,
                                        bharthi: gunnyBags.find((g) => g.id === e.target.value)?.bharthi ?? x.bharthi,
                                      }
                                    : x,
                                ),
                              )
                            }
                            className="rounded-full border border-slate-200 px-2 py-1 text-xs"
                          >
                            {gunnyBags.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.code}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center rounded-full border border-slate-200 px-3 text-[11px]">
                            {l.bharthi}
                          </div>
                        </div>
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

            <div className="mt-3 flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() =>
                    setLines((prev) => [
                      ...prev,
                      {
                        id: `DL-${Date.now()}`,
                        warehouseId: warehouses[0]?.id ?? '',
                        date: new Date().toISOString().slice(0, 10),
                        itemId: items[0]?.id ?? '',
                        bharthi: gunnyBags[0]?.bharthi ?? 0,
                        gunnyBagId: gunnyBags[0]?.id ?? '',
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

              <div className="text-[11px] text-slate-600">
                <div>
                  Customer: <span className="font-medium text-slate-800">{selectedCustomer?.name ?? '-'}</span>
                </div>
              </div>
            </div>
          </section>

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
<button
              type="button"
              onClick={saveDraft}
              className="rounded-full border border-slate-200 bg-amber-500 / hover:bg-amber-600 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
            >
              Save Draft
            </button>
              <button type="button" onClick={save} className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
                Dispatch
              </button>
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
  const [records, setRecords] = useState<Dispatch[]>(dbDispatches)
  const [selected, setSelected] = useState<Dispatch | null>(records[0] ?? null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Dispatch | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Dispatch | null>(null)

  /**
   * @function openAdd
   * @description Open modal to create a new dispatch.
   */
  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Open modal to edit an existing dispatch.
   */
  const openEdit = (row: Dispatch) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Insert or update dispatch in the local records.
   */
  const handleSave = (d: Dispatch) => {
    setRecords((prev) => {
      const exists = prev.some((x) => x.id === d.id)
      if (exists) return prev.map((x) => (x.id === d.id ? d : x))
      return [d, ...prev]
    })
    setSelected(d)
  }

  /**
   * @function handleDraftSave
   * @description Save draft records (upsert) but keep modal open by caller.
   */
  const handleDraftSave = (d: Dispatch) => {
    setRecords((prev) => {
      const exists = prev.some((x) => x.id === d.id)
      if (exists) return prev.map((x) => (x.id === d.id ? d : x))
      return [d, ...prev]
    })
    setSelected(d)
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((x) => x.id !== confirmDelete.id))
    toast.success('Dispatch deleted.')
    setConfirmDelete(null)
    if (selected?.id === confirmDelete.id) setSelected(null)
  }

  const columns: ColumnDef<Dispatch>[] = [
    { key: 'dispatchNumber', label: 'Dispatch No' },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    { key: 'lorryNumber', label: 'Lorry No' },
    { key: 'driverName', label: 'Driver' },
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
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[180px]',
      render: (row) => (
        <div className="flex justify-end">
          <RowActions
            row={row as any}
            onView={(r: Dispatch) => setSelected(r)}
            onEdit={(r: Dispatch) => openEdit(r)}
            onPrint={(r: Dispatch) => toast.info(`Printing dispatch ${r.dispatchNumber} (mock).`)}
            onDelete={(r: Dispatch) => setConfirmDelete(r)}
          />
        </div>
      ),
    },
  ]

  const lines = useMemo<DispatchLine[]>(() => selected?.lines ?? [], [selected])
  const totalPending = lines.reduce((sum, l) => sum + (l.pendingQuantity ?? 0), 0)

  return (
    <div className="space-y-4">
      <PageHeader title="Loading & Dispatch" breadcrumb={['Transactions', 'Loading & Dispatch']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported dispatches to Excel (mock).')}
        onExportPdf={() => toast.info('Exported dispatches to PDF (mock).')}
        onPrint={() => toast.info('Sending dispatch list to printer (mock).')}
        onRefresh={() => toast.success('Dispatch list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />

      <div className="flex justify-end">
        <button type="button" onClick={openAdd} className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
          Add New
        </button>
      </div>

      <DataGrid<Dispatch> data={records} columns={columns} getRowId={(row) => row.id} loading={false} onView={(r) => setSelected(r)} onEdit={(r) => openEdit(r)} onDelete={(r) => setConfirmDelete(r)} onPrint={(r) => toast.info(`Printing ${r.dispatchNumber} (mock).`)} />

      {selected ? (
        <div className="grid gap-3 md:grid-cols-[2fr,3fr]">
          <div className="space-y-2 rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-800">Dispatch Header</h2>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-600">
              <dt className="font-medium">Dispatch No</dt>
              <dd>{selected.dispatchNumber}</dd>
              <dt className="font-medium">Customer</dt>
              <dd>{customers.find((c) => c.id === selected.customerId)?.name ?? ''}</dd>
              <dt className="font-medium">Lorry No</dt>
              <dd>{selected.lorryNumber}</dd>
              <dt className="font-medium">Driver</dt>
              <dd>{selected.driverName}</dd>
              <dt className="font-medium">Driver Mobile</dt>
              <dd>{selected.driverMobile}</dd>
              <dt className="font-medium">Status</dt>
              <dd>{selected.dispatchStatus}</dd>
              <dt className="font-medium">Invoice Generated</dt>
              <dd>{selected.invoiceGenerated ? 'Yes' : 'No'}</dd>
            </dl>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white/80 p-4 shadow-sm">
            <h2 className="text-xs font-semibold text-slate-800">Loading Details</h2>
            <div className="mt-2 overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Warehouse</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Bharthi</th>
                    <th className="px-3 py-2">Gunny Bag</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Loaded</th>
                    <th className="px-3 py-2">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">{warehouses.find((w) => w.id === l.warehouseId)?.name ?? ''}</td>
                      <td className="px-3 py-1.5">{formatDate(l.date)}</td>
                      <td className="px-3 py-1.5">{items.find((it) => it.id === l.itemId)?.name ?? ''}</td>
                      <td className="px-3 py-1.5">{l.bharthi}</td>
                      <td className="px-3 py-1.5">{gunnyBags.find((g) => g.id === l.gunnyBagId)?.code ?? ''}</td>
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
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={(d) => {
          handleSave(d)
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