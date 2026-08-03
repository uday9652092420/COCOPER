/**
 * @file PurchaseInvoicePage.tsx
 * @description Purchase invoice list and entry page with modal, grid and actions.
 *
 * Notes:
 * - Tonage / Lessing mode selection at modal header.
 * - "Actual Quantity" column between Discount and Purchase Cost.
 * - Purchase Cost is editable manually; Purchase Amount = Actual Quantity * Purchase Cost.
 * - Gunny Bags section removed.
 * - Additional charges: Loading Cost, Market Cess, Bags & Sticks, Freight.
 * - Grand total includes lines total + additional charges.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  purchaseInvoices as dbPurchaseInvoices,
  suppliers,
  warehouses,
  items,
  type PurchaseInvoice,
  type PurchaseInvoiceLine,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import RowActions from '../../components/common/RowActions'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @interface PurchaseInvoiceFormValues
 * @description Form shape used inside purchase invoice modal.
 */
interface PurchaseInvoiceFormValues extends FieldValues {
  supplierId: string
  warehouseId: string
  invoiceNo: string
  invoiceDate: string
  // lines now include actualQuantity
  lines: {
    itemId: string
    quantityTons: number
    discount: number
    actualQuantity: number
    purchaseCost: number
    purchaseAmount: number
  }[]
  // Additional charges
  loadingCost: number
  marketCess: number
  bagsAndSticks: number
  freight: number
}

/**
 * @component PurchaseInvoiceModal
 * @description Modal for creating/editing a purchase invoice including lines and additional charges.
 */
const PurchaseInvoiceModal: React.FC<{
  open: boolean
  onClose: () => void
  onSave: (invoice: PurchaseInvoice) => void
  existing?: PurchaseInvoice | null
}> = ({ open, onClose, onSave, existing }) => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
  } = useForm<PurchaseInvoiceFormValues>({
    defaultValues:
      existing ??
      ({
        supplierId: '',
        warehouseId: '',
        invoiceNo: `PI-${(Math.floor(Math.random() * 9000) + 1000).toString().padStart(4, '0')}`,
        invoiceDate: new Date().toISOString().slice(0, 10),
        lines: [
          {
            itemId: '',
            quantityTons: 0,
            discount: 0,
            actualQuantity: 0,
            purchaseCost: 0,
            purchaseAmount: 0,
          },
        ],
        loadingCost: 0,
        marketCess: 0,
        bagsAndSticks: 0,
        freight: 0,
      } as PurchaseInvoiceFormValues),
  })

  const linesField = useFieldArray({ control, name: 'lines' })
  const lines = watch('lines') ?? []

  /**
   * @description Mode for actual quantity calculation. 'tonage' => denom = 1000 + discount, 'lessing' => denom = 1000 - discount
   */
  const [mode, setMode] = useState<'tonage' | 'lessing'>('tonage')

  useEffect(() => {
    // reset when modal opens or existing changes
    reset(
      existing
        ? {
            supplierId: existing.supplierId,
            warehouseId: existing.warehouseId,
            invoiceNo: existing.invoiceNo,
            invoiceDate: existing.invoiceDate,
            lines:
              existing.lines?.map((l) => ({
                itemId: l.itemId,
                quantityTons: l.quantityTons,
                discount: l.discount ?? 0,
                actualQuantity: l.purchaseAmount && l.purchaseCost ? Number((l.purchaseAmount / l.purchaseCost).toFixed(6)) : 0,
                purchaseCost: l.purchaseCost ?? 0,
                purchaseAmount: l.purchaseAmount ?? 0,
              })) ?? [
                {
                  itemId: '',
                  quantityTons: 0,
                  discount: 0,
                  actualQuantity: 0,
                  purchaseCost: 0,
                  purchaseAmount: 0,
                },
              ],
            loadingCost: 0,
            marketCess: 0,
            bagsAndSticks: 0,
            freight: 0,
          }
        : undefined
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open])

  /**
   * @function recalcLine
   * @description Recalculate actualQuantity and purchaseAmount for a specific line index.
   *
   * Formula:
   * - Tonage:  actualQuantity = (quantity / (1000 + discount)) * 1000
   * - Lessing: actualQuantity = (quantity - discount)
   */
  const recalcLine = (index: number) => {
    const line = (watch('lines') ?? [])[index]
    if (!line) return
    const quantity = Number(line.quantityTons) || 0
    const discount = Number(line.discount) || 0

    let actualQuantity = 0
    if (mode === 'tonage') {
      const denom = 1000 + discount
      const safeDenom = denom === 0 ? 1 : denom
      // Tonage formula scaled by 1000
      actualQuantity = (quantity / safeDenom) * 1000
    } else {
      // Lessing formula: actualQuantity = quantity - discount
      actualQuantity = quantity - discount
    }

    const purchaseCost = Number(line.purchaseCost) || 0
    const purchaseAmount = actualQuantity * purchaseCost

    setValue(
      `lines.${index}.actualQuantity`,
      Number.isFinite(actualQuantity) ? Number(actualQuantity.toFixed(6)) : 0
    )
    setValue(
      `lines.${index}.purchaseAmount`,
      Number.isFinite(purchaseAmount) ? Number(purchaseAmount.toFixed(2)) : 0
    )
  }

  /**
   * @function submit
   * @description Collect form values, build PurchaseInvoice model and call onSave.
   */
  const submit = (values: PurchaseInvoiceFormValues) => {
    const linesOut: PurchaseInvoiceLine[] = values.lines.map((l, idx) => ({
      id: existing?.lines?.[idx]?.id ?? `PIL-${Date.now()}-${idx}`,
      itemId: l.itemId,
      quantityTons: Number(l.quantityTons),
      discount: Number(l.discount),
      purchaseCost: Number(l.purchaseCost),
      purchaseAmount: Number(l.purchaseAmount),
      // Note: actualQuantity not persisted separately in the legacy model; purchaseAmount and purchaseCost saved.
    }))

    const linesTotal = linesOut.reduce((sum, l) => sum + l.purchaseAmount, 0)
    const additionalTotal =
      (Number(values.loadingCost) || 0) +
      (Number(values.marketCess) || 0) +
      (Number(values.bagsAndSticks) || 0) +
      (Number(values.freight) || 0)

    const grandTotal = linesTotal + additionalTotal

    const invoice: PurchaseInvoice = {
      id: existing?.id ?? `PINV-${Date.now()}`,
      supplierId: values.supplierId,
      warehouseId: values.warehouseId,
      invoiceNo: values.invoiceNo,
      invoiceDate: values.invoiceDate,
      lines: linesOut,
      gunnyBags: [], // removed gunny bag section; keep empty array for compatibility
      grandTotal,
    }

    onSave(invoice)
    onClose()
  }

  if (!open) return null

  const linesTotal = lines?.reduce((sum, l) => sum + Number(l.purchaseAmount || 0), 0) ?? 0
  const loadingCost = Number(watch('loadingCost') || 0)
  const marketCess = Number(watch('marketCess') || 0)
  const bagsAndSticks = Number(watch('bagsAndSticks') || 0)
  const freight = Number(watch('freight') || 0)
  const additionalTotal = loadingCost + marketCess + bagsAndSticks + freight
  const grandTotal = linesTotal + additionalTotal

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-900">{existing ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h2>

            {/* Mode radio buttons */}
            <div className="flex items-center gap-2 text-[11px]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'tonage'}
                  onChange={() => {
                    setMode('tonage')
                    // recalc all lines
                    ;(linesField.fields || []).forEach((_, idx) => recalcLine(idx))
                  }}
                />
                <span>Tonage</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'lessing'}
                  onChange={() => {
                    setMode('lessing')
                    ;(linesField.fields || []).forEach((_, idx) => recalcLine(idx))
                  }}
                />
                <span>Lessing</span>
              </label>
            </div>
          </div>

          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid max-h-[80vh] grid-rows-[auto,1fr,auto] gap-3 overflow-y-auto px-5 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Supplier</label>
              <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('supplierId', { required: true })}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Warehouse</label>
              <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('warehouseId', { required: true })}>
                <option value="">Select warehouse</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice No</label>
              <input className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('invoiceNo', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice Date</label>
              <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('invoiceDate', { required: true })} />
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <p className="text-[11px] font-medium text-slate-700">Purchase Details</p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Quantity (Tons)</th>
                    <th className="px-3 py-2">Discount</th>
                    <th className="px-3 py-2">Actual Quantity</th>
                    <th className="px-3 py-2">Purchase Cost</th>
                    <th className="px-3 py-2">Purchase Amount</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {linesField.fields.map((field, index) => (
                    <tr key={field.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        <select className="w-full rounded-full border border-slate-200 px-2 py-1" {...register(`lines.${index}.itemId` as const, { required: true })}>
                          <option value="">Select item</option>
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="w-28 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`lines.${index}.quantityTons` as const, {
                            valueAsNumber: true,
                            onChange: () => recalcLine(index),
                          })}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="w-20 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`lines.${index}.discount` as const, {
                            valueAsNumber: true,
                            onChange: () => recalcLine(index),
                          })}
                        />
                      </td>

                      {/* Actual Quantity */}
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="w-28 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`lines.${index}.actualQuantity` as const, { valueAsNumber: true })}
                          readOnly
                        />
                      </td>

                      {/* Purchase Cost editable */}
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="w-24 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`lines.${index}.purchaseCost` as const, {
                            valueAsNumber: true,
                            onChange: () => recalcLine(index),
                          })}
                        />
                      </td>

                      <td className="px-3 py-1.5">
                        <input type="number" className="w-28 rounded-full border border-slate-200 px-2 py-1" {...register(`lines.${index}.purchaseAmount` as const, { valueAsNumber: true })} readOnly />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button type="button" onClick={() => linesField.remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              onClick={() =>
                linesField.append({
                  itemId: '',
                  quantityTons: 0,
                  discount: 0,
                  actualQuantity: 0,
                  purchaseCost: 0,
                  purchaseAmount: 0,
                })
              }
              className="mt-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Add Line
            </button>
          </div>

          {/* Additional Charges */}
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Loading Cost</label>
              <input type="number" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('loadingCost', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Market Cess</label>
              <input type="number" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('marketCess', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Bags & Sticks</label>
              <input type="number" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('bagsAndSticks', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Freight</label>
              <input type="number" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('freight', { valueAsNumber: true })} />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <div className="space-y-1 text-[11px] text-slate-500">
              <p>Lines Total: {formatCurrency(linesTotal)}</p>
              <p>Additional Charges: {formatCurrency(additionalTotal)}</p>
              <p className="font-semibold text-slate-700">Grand Total: {formatCurrency(grandTotal)}</p>
            </div>
            <button type="submit" className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * @component PurchaseInvoicePage
 * @description Page displaying purchase invoice list with actions and entry modal.
 */
const PurchaseInvoicePage: React.FC = () => {
  const [records, setRecords] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseInvoice | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PurchaseInvoice | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbPurchaseInvoices)
      setLoading(false)
    }, 500)
    return () => clearTimeout(id)
  }, [])

  /**
   * @function filtered
   * @description Memoized filtered records based on search input.
   */
  const filtered = useMemo(
    () =>
      records.filter((inv) => {
        const q = search.toLowerCase()
        const supplier = suppliers.find((s) => s.id === inv.supplierId)
        const wh = warehouses.find((w) => w.id === inv.warehouseId)
        const matchesSearch = !q || inv.invoiceNo.toLowerCase().includes(q) || supplier?.name.toLowerCase().includes(q) || wh?.name.toLowerCase().includes(q)
        return matchesSearch
      }),
    [records, search]
  )

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: PurchaseInvoice) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save or update invoice in local state.
   */
  const handleSave = (invoice: PurchaseInvoice) => {
    setRecords((prev) => {
      const exists = prev.some((x) => x.id === invoice.id)
      if (exists) {
        return prev.map((x) => (x.id === invoice.id ? invoice : x))
      }
      return [invoice, ...prev]
    })
    toast.success('Purchase invoice saved.')
  }

  /**
   * @function handleDelete
   * @description Remove confirmed invoice from list.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((x) => x.id !== confirmDelete.id))
    toast.success('Purchase invoice deleted.')
    setConfirmDelete(null)
  }

  const columns: ColumnDef<PurchaseInvoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', width: 'w-[180px]' },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      render: (row) => formatDate(row.invoiceDate),
      width: 'w-[120px]',
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      render: (row) => suppliers.find((s) => s.id === row.supplierId)?.name ?? '',
      width: 'w-[220px]',
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (row) => warehouses.find((w) => w.id === row.warehouseId)?.name ?? '',
      width: 'w-[160px]',
    },
    {
      key: 'grandTotal',
      label: 'Grand Total',
      render: (row) => formatCurrency(row.grandTotal),
      width: 'w-[140px]',
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[200px]',
      render: (row) => (
        <div className="flex justify-end">
          <RowActions
            row={row}
            onView={(r: PurchaseInvoice) => openEdit(r)}
            onEdit={(r: PurchaseInvoice) => openEdit(r)}
            onPrint={(r: PurchaseInvoice) => toast.info(`Printing invoice ${r.invoiceNo} (mock).`)}
            onDelete={(r: PurchaseInvoice) => setConfirmDelete(r)}
          />
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Purchase Invoice" breadcrumb={['Transactions', 'Purchase Invoice']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported purchase invoices to Excel (mock).')}
        onExportPdf={() => toast.info('Exported purchase invoices to PDF (mock).')}
        onPrint={() => toast.info('Sending invoice list to printer (mock).')}
        onRefresh={() => toast.success('Purchase invoice list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by invoice no, supplier, warehouse..." />
      <DataGrid<PurchaseInvoice>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
      />

      <PurchaseInvoiceModal
        open={modalOpen}
        existing={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete purchase invoice?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.invoiceNo}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default PurchaseInvoicePage