/**
 * @file PurchaseOrderPage.tsx
 * @description Purchase order entry and listing screen with responsive modal, editable purchase cost,
 *              and a Convert -> Sales Order workflow that expands the modal to show a Sales Order section.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, useWatch, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  purchaseOrders as dbPurchaseOrders,
  suppliers,
  warehouses,
  items,
  customers,
  type PurchaseOrder,
  type PurchaseOrderLine,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import RowActions from '../../components/common/RowActions'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'

/**
 * @description Form values for purchase order including line array.
 */
interface PurchaseOrderFormValues extends FieldValues {
  poNumber: string
  date: string
  supplierId: string
  warehouseId: string
  remarks: string
  lines: {
    itemId: string
    quantity?: string
    cost?: string
    rate?: string
    purchaseCost?: number
    amount?: number
  }[]
}

/**
 * @description Form values for sales order used in conversion UI.
 */
interface SalesOrderFormValues extends FieldValues {
  soNumber: string
  date: string
  customerId: string
  remarks: string
  lines: {
    itemId: string
    quantity?: string
    rate?: string
    price?: string
    amount?: number
  }[]
}

/**
 * @component PurchaseOrderModal
 * @description Modal dialog for creating or editing a purchase order and converting it to a sales order.
 *
 * Implementation notes:
 * - Editable numeric inputs use string values + inputMode="decimal" for fluid typing.
 * - Sales order conversion section is a separate form that is shown only after clicking Convert and when PO is Approved.
 * - Values are sanitized to numbers on blur/submit.
 */
const PurchaseOrderModal: React.FC<{
  open: boolean
  onClose: () => void
  onSave: (order: PurchaseOrder) => void
  existing?: PurchaseOrder | null
}> = ({ open, onClose, onSave, existing }) => {
  /**
   * @description Build initial/default form values with string fields for editable inputs.
   */
  const buildInitial = (): PurchaseOrderFormValues => {
    if (existing) {
      return {
        poNumber: existing.poNumber,
        date: existing.date,
        supplierId: existing.supplierId,
        warehouseId: existing.warehouseId ?? '',
        remarks: existing.remarks ?? '',
        lines:
          existing.lines?.map((l) => ({
            itemId: l.itemId ?? '',
            quantity: String(l.quantity ?? ''),
            cost: String((typeof l.purchaseCost === 'number' ? l.purchaseCost : l.amount) ?? ''),
            rate: l.rate !== undefined ? String(l.rate) : '',
            purchaseCost: l.purchaseCost ?? 0,
            amount: l.amount ?? 0,
          })) ?? [
            {
              itemId: '',
              quantity: '',
              cost: '',
              rate: '',
              purchaseCost: 0,
              amount: 0,
            },
          ],
      }
    }

    return {
      poNumber: `PO-${(Math.floor(Math.random() * 9000) + 1000).toString()}`,
      date: new Date().toISOString().slice(0, 10),
      supplierId: '',
      warehouseId: '',
      remarks: '',
      lines: [{ itemId: '', quantity: '', cost: '', rate: '', purchaseCost: 0, amount: 0 }],
    }
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PurchaseOrderFormValues>({
    defaultValues: buildInitial(),
  })

  useEffect(() => {
    // Reset form whenever modal opens or existing changes to ensure string-mapped values are loaded
    reset(buildInitial())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open])

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines',
  })

  /**
   * @description Watch lines to compute derived UI values without writing back during typing.
   */
  const watchedLines = useWatch({
    control,
    name: 'lines',
  }) as PurchaseOrderFormValues['lines'] | undefined

  /**
   * @description Ensure internal numeric fields are synced on blur for purchase lines.
   */
  const syncLineOnBlur = (index: number) => {
    const line = (watchedLines && watchedLines[index]) || (fields[index] as any)
    if (!line) return
    const quantityNum = Number(line.quantity ?? 0) || 0
    const costNum = Number(line.cost ?? line.purchaseCost ?? 0) || 0
    setValue(`lines.${index}.purchaseCost`, Number(costNum.toFixed(2)))
    setValue(`lines.${index}.amount`, Number((quantityNum * costNum).toFixed(2)))
    setValue(`lines.${index}.cost`, costNum === 0 ? '' : String(costNum))
    setValue(`lines.${index}.quantity`, quantityNum === 0 ? '' : String(quantityNum))
  }

  /**
   * @description Compute totals for current purchase line items using watched values.
   */
  const totals = useMemo(() => {
    const arr = Array.isArray(watchedLines) ? watchedLines : []
    const totalQuantity = arr.reduce((s, l) => s + (Number(l?.quantity) || 0), 0)
    const totalAmount = arr.reduce((s, l) => {
      const qty = Number(l?.quantity) || 0
      const cost = (Number(l?.cost ?? (l as any)?.purchaseCost) || 0)
      return s + qty * cost
    }, 0)
    return {
      totalQuantity,
      totalAmount,
    }
  }, [watchedLines])

  /**
   * @description Submit handler to sanitize purchase order lines and create/update PO.
   */
  const submit = (values: PurchaseOrderFormValues) => {
    const sanitizedLines: PurchaseOrderLine[] = (values.lines || []).map((l, idx) => {
      const quantity = Number(l.quantity) || 0
      const cost = (Number(l.cost ?? l.purchaseCost) || 0)
      return {
        id: existing?.lines?.[idx]?.id ?? `POL-${Date.now()}-${idx}`,
        itemId: l.itemId,
        quantity,
        purchaseCost: Number(cost.toFixed(2)),
        amount: Number((quantity * cost).toFixed(2)),
        ...(l.rate !== undefined && l.rate !== '' ? { rate: Number(l.rate) } : {}),
      } as any as PurchaseOrderLine
    })

    const order: PurchaseOrder = {
      id: existing?.id ?? `PO-${Date.now()}`,
      poNumber: values.poNumber,
      date: values.date,
      supplierId: values.supplierId,
      warehouseId: values.warehouseId ?? '',
      remarks: values.remarks,
      status: existing?.status ?? 'Draft',
      lines: sanitizedLines,
    }
    onSave(order)
    onClose()
  }

  // ----------------- Sales Order conversion logic -----------------
  /**
   * @description Build initial sales form using PO lines if present.
   */
  const buildSalesInitial = (): SalesOrderFormValues => {
    if (existing) {
      return {
        soNumber: `SO-${(Math.floor(Math.random() * 9000) + 1000).toString()}`,
        date: new Date().toISOString().slice(0, 10),
        customerId: '',
        remarks: `Converted from ${existing.poNumber}`,
        lines:
          existing.lines?.map((l) => ({
            itemId: l.itemId ?? '',
            quantity: String(l.quantity ?? ''),
            rate: l.rate !== undefined ? String(l.rate) : '',
            price: String(l.purchaseCost ?? l.amount ?? ''),
            amount: l.amount ?? 0,
          })) ?? [{ itemId: '', quantity: '', rate: '', price: '', amount: 0 }],
      }
    }
    return {
      soNumber: `SO-${(Math.floor(Math.random() * 9000) + 1000).toString()}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: '',
      remarks: '',
      lines: [{ itemId: '', quantity: '', rate: '', price: '', amount: 0 }],
    }
  }

  const {
    register: registerS,
    handleSubmit: handleSubmitS,
    control: controlS,
    setValue: setValueS,
    reset: resetS,
    formState: { errors: salesErrors },
  } = useForm<SalesOrderFormValues>({
    defaultValues: buildSalesInitial(),
  })

  const { fields: salesFields, append: salesAppend, remove: salesRemove } = useFieldArray({
    control: controlS,
    name: 'lines',
  })

  const watchedSalesLines = useWatch({
    control: controlS,
    name: 'lines',
  }) as SalesOrderFormValues['lines'] | undefined

  const salesTotals = useMemo(() => {
    const arr = Array.isArray(watchedSalesLines) ? watchedSalesLines : []
    const totalQuantity = arr.reduce((s, l) => s + (Number(l?.quantity) || 0), 0)
    const totalAmount = arr.reduce((s, l) => {
      const qty = Number(l?.quantity) || 0
      const price = Number(l?.price) || 0
      return s + qty * price
    }, 0)
    return { totalQuantity, totalAmount }
  }, [watchedSalesLines])

  /**
   * @description Sync sales line numeric fields on blur.
   */
  const syncSalesLineOnBlur = (index: number) => {
    const line = (watchedSalesLines && watchedSalesLines[index]) || (salesFields[index] as any)
    if (!line) return
    const quantityNum = Number(line.quantity ?? 0) || 0
    const priceNum = Number(line.price ?? 0) || 0
    setValueS(`lines.${index}.amount`, Number((quantityNum * priceNum).toFixed(2)))
    setValueS(`lines.${index}.price`, priceNum === 0 ? '' : String(priceNum))
    setValueS(`lines.${index}.quantity`, quantityNum === 0 ? '' : String(quantityNum))
  }

  /**
   * @description Handle sales order save (mock) - sanitizes values and shows toast.
   */
  const onSaveSales = (values: SalesOrderFormValues) => {
    const sanitized = (values.lines || []).map((l, idx) => {
      const q = Number(l.quantity) || 0
      const p = Number(l.price) || 0
      return {
        id: `SOL-${Date.now()}-${idx}`,
        itemId: l.itemId,
        quantity: q,
        price: Number(p.toFixed(2)),
        amount: Number((q * p).toFixed(2)),
      }
    })
    // Mock save: show toast with summary
    toast.success(`Sales order ${values.soNumber} created (mock) with ${sanitized.length} lines.`)
    // After creating sales order, collapse conversion section
    setConvertOpen(false)
  }

  // Conversion UI state
  const [convertOpen, setConvertOpen] = useState(false)

  useEffect(() => {
    // Reset sales form whenever modal opens or existing changes (but keep conversion collapsed)
    resetS(buildSalesInitial())
    setConvertOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open])

  /**
   * @description Trigger conversion UI, populating sales form from current PO values.
   */
  const openConversionFromPO = () => {
    // Only allow conversion when PO exists and is Approved
    if (!existing || existing.status !== 'Approved') {
      toast.warning('Only approved purchase orders can be converted to sales orders.')
      return
    }
    // Build sales initial from current watched purchase lines to capture live edits
    const poLines = Array.isArray(watchedLines) ? watchedLines : []
    const mapped = poLines.map((l) => {
      const itemId = l.itemId ?? ''
      const quantity = l.quantity ?? ''
      const rate = l.rate ?? ''
      const priceVal = l.cost ?? String((l as any).purchaseCost ?? '')
      const amountVal = (Number(l.quantity ?? 0) * (Number(l.cost ?? (l as any).purchaseCost) || 0)) || 0
      return { itemId, quantity, rate, price: priceVal, amount: amountVal }
    })
    resetS({
      soNumber: `SO-${(Math.floor(Math.random() * 9000) + 1000).toString()}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: '',
      remarks: `Converted from ${existing.poNumber}`,
      lines: mapped.length ? mapped : [{ itemId: '', quantity: '', rate: '', price: '', amount: 0 }],
    })
    setConvertOpen(true)
  }

  // ----------------- End conversion logic -----------------

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 px-3 py-4 touch-pan-y">
      <div className={`w-full max-w-4xl md:rounded-3xl rounded-t-3xl bg-white shadow-2xl md:max-h-[85vh] max-h-[94vh] flex flex-col overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{existing ? 'Edit Purchase Order' : 'New Purchase Order'}</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit(submit)} className="flex-1 overflow-y-auto px-4 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">PO Number</label>
              <input className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('poNumber', { required: true })} />
              {errors.poNumber ? <p className="mt-1 text-[10px] text-rose-500">Required</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Date</label>
              <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('date', { required: true })} />
            </div>

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

            <div className="md:col-span-3">
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
              <textarea rows={2} className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-xs" {...register('remarks')} />
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
              <span>Line Items</span>
              <button
                type="button"
                onClick={() =>
                  append({
                    itemId: '',
                    quantity: '',
                    rate: '',
                    cost: '',
                    purchaseCost: 0,
                    amount: 0,
                  } as any)
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Add Line
              </button>
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="min-w-full text-left text-[11px] rounded-2xl border border-slate-100">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Quantity</th>
                    <th className="px-3 py-2">Cost</th>
                    <th className="px-3 py-2">Line Total</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const qty = Number(watchedLines?.[index]?.quantity) || 0
                    const cost = (Number(watchedLines?.[index]?.cost ?? watchedLines?.[index]?.purchaseCost) || 0)
                    const lineTotal = Number((qty * cost).toFixed(2))
                    return (
                      <tr key={field.id} className="border-t border-slate-100">
                        <td className="px-3 py-1.5">
                          <select className="w-full rounded-full border border-slate-200 px-2 py-1 text-[11px]" {...register(`lines.${index}.itemId` as const, { required: true })}>
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
                            type="text"
                            inputMode="decimal"
                            className="w-24 rounded-full border border-slate-200 px-2 py-1"
                            {...register(`lines.${index}.rate` as const)}
                            onBlur={() => syncLineOnBlur(index)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="w-24 rounded-full border border-slate-200 px-2 py-1"
                            {...register(`lines.${index}.quantity` as const)}
                            onBlur={() => syncLineOnBlur(index)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="w-28 rounded-full border border-slate-200 px-2 py-1"
                            {...register(`lines.${index}.cost` as const)}
                            onBlur={() => syncLineOnBlur(index)}
                          />
                        </td>

                        <td className="px-3 py-1.5 font-semibold">{lineTotal.toFixed(2)}</td>

                        <td className="px-3 py-1.5 text-right">
                          <button type="button" onClick={() => remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                <tfoot>
                  <tr className="border-t bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-700">Totals</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-semibold text-slate-700">{totals.totalQuantity}</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-semibold text-slate-700">{totals.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile stacked list */}
            <div className="md:hidden space-y-2">
              {fields.map((field, index) => {
                const qty = Number(watchedLines?.[index]?.quantity) || 0
                const cost = (Number(watchedLines?.[index]?.cost ?? watchedLines?.[index]?.purchaseCost) || 0)
                const lineTotal = Number((qty * cost).toFixed(2))
                return (
                  <div key={field.id} className="rounded-xl border border-slate-100 bg-white p-3">
                    <div className="mb-2">
                      <label className="mb-1 block text-[11px] font-medium text-slate-700">Item</label>
                      <select className="w-full rounded-full border border-slate-200 px-3 py-1 text-[11px]" {...register(`lines.${index}.itemId` as const, { required: true })}>
                        <option value="">Select item</option>
                        {items.map((it) => (
                          <option key={it.id} value={it.id}>
                            {it.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">Rate</label>
                        <input type="text" inputMode="decimal" className="w-full rounded-full border border-slate-200 px-3 py-1" {...register(`lines.${index}.rate` as const)} onBlur={() => syncLineOnBlur(index)} />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">Qty</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-full rounded-full border border-slate-200 px-3 py-1"
                          {...register(`lines.${index}.quantity` as const)}
                          onBlur={() => syncLineOnBlur(index)}
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="mb-1 block text-[11px] font-medium text-slate-700">Cost</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-full rounded-full border border-slate-200 px-3 py-1"
                        {...register(`lines.${index}.cost` as const)}
                        onBlur={() => syncLineOnBlur(index)}
                      />
                    </div>

                    <div className="mt-3 text-sm font-semibold text-slate-700">Line Total: {lineTotal.toFixed(2)}</div>

                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Mobile totals */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Totals</span>
                  <span>{totals.totalQuantity} items</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-slate-700">
                  <span>Total Amount</span>
                  <span>{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Order Conversion Section (expands modal when open) */}
          {convertOpen && (
            <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Sales Order (Conversion)</h3>
                <button type="button" onClick={() => setConvertOpen(false)} className="text-xs text-slate-500 hover:text-slate-700">
                  Close Sales Order
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">SO Number</label>
                  <input className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...registerS('soNumber')} />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Date</label>
                  <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...registerS('date')} />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Customer</label>
                  <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...registerS('customerId', { required: true })}>
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
                  <input className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-xs" {...registerS('remarks')} />
                </div>
              </div>

              {/* Sales lines: mirror of PO lines but editable */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                  <span>Sales Line Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      salesAppend({
                        itemId: '',
                        quantity: '',
                        rate: '',
                        price: '',
                        amount: 0,
                      } as any)
                    }
                    className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    Add Line
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[11px] rounded-2xl border border-slate-100">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">Rate</th>
                        <th className="px-3 py-2">Quantity</th>
                        <th className="px-3 py-2">Price</th>
                        <th className="px-3 py-2">Line Total</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesFields.map((field, index) => {
                        const qty = Number(watchedSalesLines?.[index]?.quantity) || 0
                        const price = Number(watchedSalesLines?.[index]?.price) || 0
                        const lineTotal = Number((qty * price).toFixed(2))
                        return (
                          <tr key={field.id} className="border-t border-slate-100">
                            <td className="px-3 py-1.5">
                              <select className="w-full rounded-full border border-slate-200 px-2 py-1 text-[11px]" {...registerS(`lines.${index}.itemId` as const, { required: true })}>
                                <option value="">Select item</option>
                                {items.map((it) => (
                                  <option key={it.id} value={it.id}>
                                    {it.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" className="w-24 rounded-full border border-slate-200 px-2 py-1" {...registerS(`lines.${index}.rate` as const)} onBlur={() => syncSalesLineOnBlur(index)} />
                            </td>

                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" className="w-24 rounded-full border border-slate-200 px-2 py-1" {...registerS(`lines.${index}.quantity` as const)} onBlur={() => syncSalesLineOnBlur(index)} />
                            </td>

                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" className="w-28 rounded-full border border-slate-200 px-2 py-1" {...registerS(`lines.${index}.price` as const)} onBlur={() => syncSalesLineOnBlur(index)} />
                            </td>

                            <td className="px-3 py-1.5 font-semibold">{lineTotal.toFixed(2)}</td>

                            <td className="px-3 py-1.5 text-right">
                              <button type="button" onClick={() => salesRemove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                                Remove
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    <tfoot>
                      <tr className="border-t bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-700">Totals</td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 font-semibold text-slate-700">{salesTotals.totalQuantity}</td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 font-semibold text-slate-700">{salesTotals.totalAmount.toFixed(2)}</td>
                        <td className="px-3 py-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                <button type="button" onClick={() => setConvertOpen(false)} className="rounded-full bg-[#E0E7D9] px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                  Cancel
                </button>
                <button type="button" onClick={handleSubmitS(onSaveSales)} className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#12337a]">
                  Save Sales Order
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
          <div className="text-[11px] text-slate-500">Save to keep PO as draft or approve when final, then convert to Sales Order.</div>
          <div className="flex gap-2">
            <button type="button" onClick={() => {}} className="rounded-full bg-[#E0E7D9] px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hidden">
              Draft
            </button>

            {/* Convert Sales Order button: enabled only when editing an approved PO */}
            {existing && existing.status === 'Approved' && (
              <button
                type="button"
                onClick={openConversionFromPO}
                className="rounded-full bg-[#0EA5A4] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0b8b89]"
              >
                Convert Sales Order
              </button>
            )}

            <button type="button" onClick={handleSubmit(submit)} className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @component PurchaseOrderPage
 * @description Purchase order list and entry page with Convert -> Sales Order feature inside modal.
 */
const PurchaseOrderPage: React.FC = () => {
  const [records, setRecords] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PurchaseOrder | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbPurchaseOrders)
      setLoading(false)
    }, 500)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((po) => {
        const q = search.toLowerCase()
        const supplier = suppliers.find((s) => s.id === po.supplierId)
        const wh = warehouses.find((w) => w.id === po.warehouseId)
        const matchesSearch =
          !q || po.poNumber.toLowerCase().includes(q) || supplier?.name.toLowerCase().includes(q) || wh?.name.toLowerCase().includes(q)
        return matchesSearch
      }),
    [records, search]
  )

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: PurchaseOrder) => {
    setEditing(row)
    setModalOpen(true)
  }

  const handleSave = (order: PurchaseOrder) => {
    setRecords((prev) => {
      const exists = prev.some((p) => p.id === order.id)
      if (exists) {
        return prev.map((p) => (p.id === order.id ? order : p))
      }
      return [order, ...prev]
    })
    toast.success('Purchase order saved.')
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((p) => p.id !== confirmDelete.id))
    toast.success('Purchase order deleted.')
    setConfirmDelete(null)
  }

  const approveOrder = (row: PurchaseOrder) => {
    if (row.status === 'Approved') {
      toast.info('Purchase order already approved.')
      return
    }
    setRecords((prev) => prev.map((p) => (p.id === row.id ? { ...p, status: 'Approved' } : p)))
    toast.success('Purchase order approved.')
  }

  const convertToInvoice = (row: PurchaseOrder) => {
    if (row.status !== 'Approved') {
      toast.warning('Only approved POs can be converted to invoices.')
      return
    }
    toast.success('Purchase invoice created from PO (mock).')
  }

  const columns: ColumnDef<PurchaseOrder>[] = [
    { key: 'poNumber', label: 'PO Number' },
    {
      key: 'date',
      label: 'Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      render: (row) => suppliers.find((s) => s.id === row.supplierId)?.name ?? '',
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (row) => warehouses.find((w) => w.id === row.warehouseId)?.name ?? '',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[220px]',
      render: (row) => (
        <RowActions
          row={row}
          onView={openEdit}
          onEdit={openEdit}
          onPrint={(r) => toast.info(`Printing PO ${r.poNumber} (mock).`)}
          onDelete={(r) => setConfirmDelete(r)}
          onApprove={approveOrder}
          onConvert={convertToInvoice}
        />
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Purchase Order" breadcrumb={['Transactions', 'Purchase Order']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported purchase orders to Excel (mock).')}
        onExportPdf={() => toast.info('Exported purchase orders to PDF (mock).')}
        onPrint={() => toast.info('Sending PO list to printer (mock).')}
        onRefresh={() => toast.success('Purchase order list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by PO number, supplier, warehouse..." />
      <DataGrid<PurchaseOrder> data={filtered} columns={columns} getRowId={(row) => row.id} loading={loading} />

      <PurchaseOrderModal
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
        title="Delete purchase order?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.poNumber}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <div className="mt-3 grid gap-2 text-[11px] text-slate-500 md:grid-cols-3">
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
          <p className="font-semibold text-slate-700">Workflow</p>
          <p className="mt-1">Save as draft, approve when final, then convert to Purchase Invoice.</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
          <p className="font-semibold text-slate-700">Quick Actions</p>
          <p className="mt-1">Use the row actions to approve a PO or convert it to a Purchase Invoice (mock).</p>
        </div>
        <div className="rounded-2xl bg-white/70 p-3 shadow-sm">
          <p className="font-semibold text-slate-700">Approval Hint</p>
          <p className="mt-1">Only approved POs can be converted to orders, ensuring clean downstream documents.</p>
        </div>
      </div>
    </div>
  )
}

export default PurchaseOrderPage