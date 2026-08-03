/**
 * @file DirectSalesPage.tsx
 * @description Direct sales list and entry page implementing Red-customer receipt rule.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  directSales as dbDirectSales,
  customers,
  warehouses,
  items,
  gunnyBags as masterGunnyBags,
  purchaseOrders,
  type DirectSales,
  type DirectSalesLine,
  type DirectSalesCharges,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import RowActions from '../../components/common/RowActions'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @interface DirectSalesFormValues
 * @description Form values used for direct sales modal.
 */
interface DirectSalesFormValues extends FieldValues {
  customerId: string
  warehouseId: string
  /** Optional Sales Order No selection at header level */
  salesOrderNo?: string
  invoiceDate: string
  lines: {
    itemId: string
    quantity: number
    discount: number
    actualQuantity: number
    salesPrice: number
    salesAmount: number
  }[]
  gunnyBags: {
    bagTypeId: string
    quantity: number
    rate: number
    amount: number
  }[]
  loadingCharges: number
}

/**
 * @component ReceiptPopup
 * @description Small modal prompting immediate receipt collection for Red customers.
 */
const ReceiptPopup: React.FC<{
  open: boolean
  amount: number
  onConfirm: () => void
  onCancel: () => void
}> = ({ open, amount, onConfirm, onCancel }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h2 className="text-sm font-semibold text-slate-900">Receipt Collection</h2>
        <p className="mt-2 text-xs text-slate-600">
          Customer type is <span className="font-semibold">Red</span>. Please collect cash receipt immediately for an amount of{' '}
          <span className="font-semibold text-emerald-700">{formatCurrency(amount)}</span>.
        </p>
        <div className="mt-4 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#2E7D32] px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-[#256427]"
          >
            Receipt Collected
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * @component DirectSalesModal
 * @description Modal to create or edit direct sales invoices with Tonage/Lessing mode and actual quantity.
 */
const DirectSalesModal: React.FC<{
  open: boolean
  onClose: () => void
  onSave: (invoice: DirectSales, requiresReceipt: boolean) => void
  existing?: DirectSales | null
}> = ({ open, onClose, onSave, existing }) => {
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
  } = useForm<DirectSalesFormValues>({
    defaultValues:
      existing ??
      ({
        customerId: '',
        warehouseId: '',
        salesOrderNo: '',
        invoiceDate: new Date().toISOString().slice(0, 10),
        lines: [{ itemId: '', quantity: 0, discount: 0, actualQuantity: 0, salesPrice: 0, salesAmount: 0 }],
        gunnyBags: [{ bagTypeId: '', quantity: 0, rate: 0, amount: 0 }],
        loadingCharges: 0,
      } as DirectSalesFormValues),
  })

  const linesField = useFieldArray({ control, name: 'lines' })
  const gunnyField = useFieldArray({ control, name: 'gunnyBags' })

  const lines = watch('lines') ?? []
  const gunny = watch('gunnyBags') ?? []
  const loadingCharges = watch('loadingCharges') || 0
  const customerId = watch('customerId')

  /**
   * @description Mode for actual quantity calculation. 'tonage' => (q/(1000+discount))*1000, 'lessing' => q-discount
   */
  const [mode, setMode] = useState<'tonage' | 'lessing'>('tonage')

  useEffect(() => {
    // reset when modal opens or existing changes
    reset(
      existing
        ? {
            customerId: existing.customerId,
            warehouseId: existing.warehouseId,
            salesOrderNo: (existing as any).salesOrderNo ?? '',
            invoiceDate: existing.invoiceDate,
            lines:
              existing.lines?.map((l) => ({
                itemId: l.itemId,
                quantity: l.quantity,
                discount: l.discount ?? 0,
                actualQuantity: l.salesAmount && l.salesPrice ? Number((l.salesAmount / l.salesPrice).toFixed(6)) : 0,
                salesPrice: l.salesPrice ?? 0,
                salesAmount: l.salesAmount ?? 0,
              })) ?? [
                {
                  itemId: '',
                  quantity: 0,
                  discount: 0,
                  actualQuantity: 0,
                  salesPrice: 0,
                  salesAmount: 0,
                },
              ],
            gunnyBags: [{ bagTypeId: '', quantity: 0, rate: 0, amount: 0 }],
            loadingCharges: 0,
          }
        : undefined
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open])

  /**
   * @function recalcLine
   * @description Recalculate actualQuantity and salesAmount for a given line index.
   *
   * Formula:
   * - Tonage:  actualQuantity = (quantity / (1000 + discount)) * 1000
   * - Lessing: actualQuantity = (quantity - discount)
   * SalesAmount = actualQuantity * salesPrice
   */
  const recalcLine = (index: number) => {
    const line = (watch('lines') ?? [])[index]
    if (!line) return
    const quantity = Number(line.quantity) || 0
    const discount = Number(line.discount) || 0

    let actualQuantity = 0
    if (mode === 'tonage') {
      const denom = 1000 + discount
      const safeDenom = denom === 0 ? 1 : denom
      actualQuantity = (quantity / safeDenom) * 1000
    } else {
      actualQuantity = quantity - discount
    }

    const salesPrice = Number(line.salesPrice) || 0
    const salesAmount = actualQuantity * salesPrice

    setValue(`lines.${index}.actualQuantity`, Number.isFinite(actualQuantity) ? Number(actualQuantity.toFixed(6)) : 0)
    setValue(`lines.${index}.salesAmount`, Number.isFinite(salesAmount) ? Number(salesAmount.toFixed(2)) : 0)
  }

  /**
   * @function onSalesPriceChange
   * @description Recalculate sales amount when sales price is manually changed.
   */
  const onSalesPriceChange = (index: number, value: number) => {
    const actualQuantity = Number((watch('lines') ?? [])[index]?.actualQuantity) || 0
    const salesPrice = Number(value) || 0
    const salesAmount = actualQuantity * salesPrice
    setValue(`lines.${index}.salesPrice`, Number.isFinite(salesPrice) ? Number(salesPrice) : 0)
    setValue(`lines.${index}.salesAmount`, Number.isFinite(salesAmount) ? Number(salesAmount.toFixed(2)) : 0)
  }

  /**
   * @function recalcGunny
   * @description Recalculate gunny bag rate and amount for a given index.
   */
  const recalcGunny = (index: number) => {
    const row = (watch('gunnyBags') ?? [])[index]
    if (!row) return
    const bag = masterGunnyBags.find((b) => b.id === row.bagTypeId)
    const rate = bag ? Number(bag.defaultRate) : Number(row.rate || 0)
    const qty = Number(row.quantity) || 0
    const amount = qty * rate
    setValue(`gunnyBags.${index}.rate`, Number.isFinite(rate) ? Number(rate.toFixed(2)) : 0)
    setValue(`gunnyBags.${index}.amount`, Number.isFinite(amount) ? Number(amount.toFixed(2)) : 0)
  }

  /**
   * @function submit
   * @description Assemble model and forward to parent on save.
   */
  const submit = (values: DirectSalesFormValues) => {
    const linesOut: DirectSalesLine[] = values.lines.map((l, idx) => ({
      id: existing?.lines?.[idx]?.id ?? `DSL-${Date.now()}-${idx}`,
      itemId: l.itemId,
      quantity: Number(l.quantity),
      discount: Number(l.discount),
      salesPrice: Number(l.salesPrice),
      salesAmount: Number(l.salesAmount),
    }))

    const gunnyTotal = values.gunnyBags?.reduce((s, g) => s + Number(g.amount || 0), 0) ?? 0
    const chargesOut: DirectSalesCharges = {
      gunnyBags: gunnyTotal,
      transportation: 0,
      loadingCharges: Number(values.loadingCharges || 0),
    }

    const invoiceTotal = linesOut.reduce((sum, l) => sum + l.salesAmount, 0) + gunnyTotal + Number(values.loadingCharges || 0)

    const customer = customers.find((c) => c.id === values.customerId)
    const invoice: DirectSales = {
      id: existing?.id ?? `DS-${Date.now()}`,
      customerId: values.customerId,
      customerType: (customer?.type as DirectSales['customerType']) ?? 'Local',
      warehouseId: values.warehouseId,
      invoiceDate: values.invoiceDate,
      salesOrderNo: values.salesOrderNo,
      lines: linesOut,
      charges: {
        gunnyBags: chargesOut.gunnyBags,
        transportation: chargesOut.transportation,
        loadingCharges: chargesOut.loadingCharges,
      },
      invoiceTotal,
    }

    const requiresReceipt = customer?.type === 'Red'
    onSave(invoice, requiresReceipt)
    onClose()
  }

  if (!open) return null

  const lineTotal = lines?.reduce((sum, l) => sum + Number(l.salesAmount || 0), 0) ?? 0
  const gunnyTotal = gunny?.reduce((sum, g) => sum + Number(g.amount || 0), 0) ?? 0
  const invoiceTotal = lineTotal + gunnyTotal + Number(loadingCharges || 0)

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-900">{existing ? 'Edit Direct Sales' : 'New Direct Sales'}</h2>

            {/* Mode radio buttons */}
            <div className="flex items-center gap-3 text-[11px]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="ds-mode"
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
                  name="ds-mode"
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
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Customer</label>
              <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('customerId', { required: true })}>
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
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
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Sales Order No</label>
              <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('salesOrderNo')}>
                <option value="">Select sales order</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.poNumber}>
                    {po.poNumber}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice Date</label>
              <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('invoiceDate', { required: true })} />
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-emerald-50/60 px-3 py-2 text-[11px] text-emerald-800">
              <span className="font-semibold">Customer Type</span>
              <span>
                {customerId
                  ? customers.find((c) => c.id === customerId)?.type === 'Red'
                    ? 'Red – Cash only, receipt required immediately.'
                    : customers.find((c) => c.id === customerId)?.type === 'Premium'
                    ? 'Premium – Credit allowed.'
                    : 'Local – Cash and credit permitted.'
                  : 'Select a customer to view type and business rules.'}
              </span>
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <p className="text-[11px] font-medium text-slate-700">Sales Details</p>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Discount</th>
                    <th className="px-3 py-2">Actual Quantity</th>
                    <th className="px-3 py-2">Sales Price</th>
                    <th className="px-3 py-2">Sales Amount</th>
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
                          className="w-24 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`lines.${index}.quantity` as const, {
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
                          className="w-28 rounded-full border border-slate-200 px-2 py-1 bg-slate-50"
                          {...register(`lines.${index}.actualQuantity` as const, { valueAsNumber: true })}
                          readOnly
                        />
                      </td>

                      {/* Sales Price editable */}
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          className="w-24 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`lines.${index}.salesPrice` as const, {
                            valueAsNumber: true,
                            onChange: (e) => onSalesPriceChange(index, Number(e.target.value)),
                          })}
                        />
                      </td>

                      <td className="px-3 py-1.5">
                        <input type="number" className="w-28 rounded-full border border-slate-200 px-2 py-1" {...register(`lines.${index}.salesAmount` as const, { valueAsNumber: true })} readOnly />
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
                  quantity: 0,
                  discount: 0,
                  actualQuantity: 0,
                  salesPrice: 0,
                  salesAmount: 0,
                })
              }
              className="mt-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              Add Line
            </button>
          </div>

          {/* Additional Charges Section */}
          <div className="mt-4 space-y-2">
            <p className="text-[11px] font-medium text-slate-700">Additional Charges</p>

            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Loading Charges</label>
                <input
                  type="number"
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                  {...register('loadingCharges', { valueAsNumber: true })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Gunny Bags</label>

                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Bag Type</th>
                        <th className="px-3 py-2">Quantity</th>
                        <th className="px-3 py-2">Rate</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gunnyField.fields.map((field, index) => (
                        <tr key={field.id} className="border-t border-slate-100">
                          <td className="px-3 py-1.5">
                            <select
                              className="w-full rounded-full border border-slate-200 px-2 py-1"
                              {...register(`gunnyBags.${index}.bagTypeId` as const, {
                                onChange: () => recalcGunny(index),
                              })}
                            >
                              <option value="">Select bag</option>
                              {masterGunnyBags.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.code} ({b.bharthi}kg)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              className="w-24 rounded-full border border-slate-200 px-2 py-1"
                              {...register(`gunnyBags.${index}.quantity` as const, {
                                valueAsNumber: true,
                                onChange: () => recalcGunny(index),
                              })}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input type="number" readOnly className="w-28 rounded-full border border-slate-200 px-2 py-1 bg-slate-50" {...register(`gunnyBags.${index}.rate` as const, { valueAsNumber: true })} />
                          </td>
                          <td className="px-3 py-1.5">
                            <input type="number" readOnly className="w-28 rounded-full border border-slate-200 px-2 py-1 bg-slate-50" {...register(`gunnyBags.${index}.amount` as const, { valueAsNumber: true })} />
                          </td>
                          <td className="px-3 py-1.5 text-right">
                            <button type="button" onClick={() => gunnyField.remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      gunnyField.append({
                        bagTypeId: '',
                        quantity: 0,
                        rate: 0,
                        amount: 0,
                      })
                    }
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Add Bag
                  </button>

                  <div className="ml-auto grid w-full max-w-xs gap-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Gunny Total</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(gunnyTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>Lines Total: {formatCurrency(lineTotal)}</p>
              <p>Charges Total: {formatCurrency(gunnyTotal + Number(loadingCharges || 0))}</p>
              <p className="font-semibold text-slate-800">Invoice Total: {formatCurrency(invoiceTotal)}</p>
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
 * @component DirectSalesPage
 * @description Page displaying direct sales list and entry modal with Red-customer receipt rule.
 */
const DirectSalesPage: React.FC = () => {
  const [records, setRecords] = useState<DirectSales[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DirectSales | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DirectSales | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptAmount, setReceiptAmount] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbDirectSales)
      setLoading(false)
    }, 500)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((inv) => {
        const q = search.toLowerCase()
        const customer = customers.find((c) => c.id === inv.customerId)
        const wh = warehouses.find((w) => w.id === inv.warehouseId)
        return !q || customer?.name.toLowerCase().includes(q) || wh?.name.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q)
      }),
    [records, search]
  )

  const columns: ColumnDef<DirectSales>[] = [
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      render: (row) => formatDate(row.invoiceDate),
    },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    {
      key: 'customerType',
      label: 'Type',
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (row) => warehouses.find((w) => w.id === row.warehouseId)?.name ?? '',
    },
    {
      key: 'invoiceTotal',
      label: 'Invoice Total',
      render: (row) => formatCurrency(row.invoiceTotal),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[200px]',
      render: (row) => (
        <div className="flex justify-end">
          <RowActions
            row={row as any}
            onView={(r: DirectSales) => {
              setEditing(r)
              setModalOpen(true)
            }}
            onEdit={(r: DirectSales) => {
              setEditing(r)
              setModalOpen(true)
            }}
            onPrint={(r: DirectSales) => toast.info(`Printing direct sales ${r.id} (mock).`)}
            onDelete={(r: DirectSales) => setConfirmDelete(r)}
          />
        </div>
      ),
    },
  ]

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const handleSave = (invoice: DirectSales, requiresReceipt: boolean) => {
    setRecords((prev) => {
      const exists = prev.some((x) => x.id === invoice.id)
      if (exists) {
        return prev.map((x) => (x.id === invoice.id ? invoice : x))
      }
      return [invoice, ...prev]
    })
    toast.success('Direct sales saved.')

    if (requiresReceipt) {
      setReceiptAmount(invoice.invoiceTotal)
      setReceiptOpen(true)
    } else {
      setReceiptOpen(false)
    }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((x) => x.id !== confirmDelete.id))
    toast.success('Direct sales deleted.')
    setConfirmDelete(null)
  }

  const handleReceiptCancel = () => {
    setReceiptOpen(false)
    toast.warning('Receipt not collected for Red customer. Please ensure cash collection.')
  }

  const handleReceiptConfirm = () => {
    setReceiptOpen(false)
    toast.success('Receipt collection confirmed.')
  }

  return (
    <div>
      <PageHeader title="Direct Sales" breadcrumb={['Transactions', 'Direct Sales']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported direct sales to Excel (mock).')}
        onExportPdf={() => toast.info('Exported direct sales to PDF (mock).')}
        onPrint={() => toast.info('Sending direct sales list to printer (mock).')}
        onRefresh={() => toast.success('Direct sales list refreshed.')}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by customer, warehouse, invoice id..." />
      <DataGrid<DirectSales>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
      />

      <DirectSalesModal
        open={modalOpen}
        existing={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ReceiptPopup open={receiptOpen} amount={receiptAmount} onConfirm={handleReceiptConfirm} onCancel={handleReceiptCancel} />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete direct sales?"
        description={confirmDelete ? `Are you sure you want to delete invoice dated ${formatDate(confirmDelete.invoiceDate)}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default DirectSalesPage