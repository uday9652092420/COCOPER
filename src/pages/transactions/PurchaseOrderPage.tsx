/**
 * @file PurchaseOrderPage.tsx
 * @description Purchase order entry and listing screen with responsive modal, editable purchase cost,
 *              and a Convert -> Sales Order workflow that expands the modal to show a Sales Order section.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch, useFormState, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  purchaseOrders as dbPurchaseOrders,
  suppliers as mockSuppliers,
  warehouses,
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
import { getItems, type ItemResponse } from '../../services/itemservices/item.service'
import { getSuppliers, type SupplierResponse } from '../../services/supplierservices/supplier.service'
import {
  getOrganizations,
  getCurrentOrganization,
  type OrganizationSummary,
} from '../../services/organizationservices/organization.service'
import { useAuthStore } from '../../store/authStore'
import { onScopeChange } from '../../utils/scopeEvents'
import { useIsMobile } from '../../hooks/use-mobile'

/**
 * @description Convert a date string to DD/MM/YYYY.
 * Accepts either an ISO (YYYY-MM-DD) value or an already-formatted value.
 */
const toDDMMYYYY = (value: string): string => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-')
    return `${d}/${m}/${y}`
  }
  return value
}

/**
 * @description Today's date formatted as DD/MM/YYYY.
 */
const todayDDMMYYYY = (): string => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/**
 * @description Organization-wise persistence for purchase orders (localStorage).
 * Each saved PO stores organizationId so records vary from organization to organization.
 */
const PO_STORAGE_KEY = 'cocoper_purchase_orders_v1'

const loadStoredPOs = (): PurchaseOrder[] | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(PO_STORAGE_KEY) : null
    return raw ? (JSON.parse(raw) as PurchaseOrder[]) : null
  } catch {
    return null
  }
}

const saveStoredPOs = (list: PurchaseOrder[]) => {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(PO_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/**
 * @description Sales order created by converting an approved purchase order.
 */
interface SalesOrder {
  id: string
  soNumber: string
  date: string
  customerId: string
  remarks: string
  sourcePOId: string
  poNumber: string
  organizationId: string | null
  lines: {
    itemId: string
    quantity: number
    rate: number
    price: number
    amount: number
  }[]
  totalAmount: number
}

const SO_STORAGE_KEY = 'cocoper_sales_orders_v1'

const loadStoredSOs = (): SalesOrder[] => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(SO_STORAGE_KEY) : null
    return raw ? (JSON.parse(raw) as SalesOrder[]) : []
  } catch {
    return []
  }
}

const saveStoredSOs = (list: SalesOrder[]) => {
  try {
    if (typeof window !== 'undefined') localStorage.setItem(SO_STORAGE_KEY, JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

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
    discount?: string
    actualQuantity?: number
    purchaseCost?: string
    purchaseAmount?: number
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
  suppliers: SupplierResponse[]
  items: ItemResponse[]
  generatePONumber: () => string
}> = ({ open, onClose, onSave, existing, suppliers, items, generatePONumber }) => {
  const { selectedOrganizationId } = useAuthStore()

  /**
   * @description Mode for actual quantity calculation.
   * 'tonage'  => actualQuantity = (quantity * 1000) / (discount + 1000)
   * 'lessing' => actualQuantity = (quantity - discount)
   */
  const [mode, setMode] = useState<'tonage' | 'lessing'>(existing?.mode ?? 'tonage')

  /**
   * @description Render only ONE line-items view at a time (desktop table or
   * mobile list). Rendering both (hidden via CSS) would register the same
   * react-hook-form field names twice and break input value binding.
   */
  const isMobile = useIsMobile()

  /**
   * @description Build initial/default form values with string fields for editable inputs.
   */
  const buildInitial = (): PurchaseOrderFormValues => {
    if (existing) {
      return {
        poNumber: existing.poNumber,
        date: toDDMMYYYY(existing.date),
        supplierId: existing.supplierId,
        warehouseId: existing.warehouseId ?? '',
        remarks: existing.remarks ?? '',
        lines:
          existing.lines?.map((l) => ({
            itemId: l.itemId ?? '',
            quantity: String(l.quantity ?? ''),
            discount: String(l.discount ?? ''),
            actualQuantity: l.actualQuantity ?? 0,
            purchaseCost: l.purchaseCost !== undefined ? String(l.purchaseCost) : '',
            purchaseAmount: l.purchaseAmount ?? 0,
            amount: l.amount ?? 0,
          })) ?? [
            {
              itemId: '',
              quantity: '',
              discount: '',
              actualQuantity: 0,
              purchaseCost: '',
              purchaseAmount: 0,
              amount: 0,
            },
          ],
      }
    }

    return {
      poNumber: generatePONumber(),
      date: todayDDMMYYYY(),
      supplierId: '',
      warehouseId: '',
      remarks: '',
      lines: [{ itemId: '', quantity: '', discount: '', actualQuantity: 0, purchaseCost: '', purchaseAmount: 0, amount: 0 }],
    }
  }

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
  } = useForm<PurchaseOrderFormValues>({
    defaultValues: buildInitial(),
  })

  /**
   * Targeted form-state subscription (only poNumber/date). Subscribing to the
   * full formState can break useFieldArray + register value binding in
   * react-hook-form, so we keep it scoped to the header fields only.
   */
  const { errors } = useFormState({ control, name: ['poNumber', 'date'] })

  useEffect(() => {
    // Reset form whenever modal opens or existing changes to ensure string-mapped values are loaded
    setMode(existing?.mode ?? 'tonage')
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
  const watchedLines = (watch('lines') ?? []) as PurchaseOrderFormValues['lines']

  /**
   * @description Recalculate Actual Quantity (auto from formula) and Purchase Amount (auto).
   *
   * Formula:
   * - Tonage:  actualQuantity = (quantity * 1000) / (discount + 1000)
   * - Lessing: actualQuantity = (quantity - discount)
   * Purchase Cost is USER INPUT (editable) — never overwritten here.
   * Purchase Amount = Purchase Cost × Actual Quantity (auto).
   */
  const recalcLine = (index: number, modeOverride?: 'tonage' | 'lessing') => {
    // Read LIVE values from the react-hook-form store (not the render-time snapshot),
    // so the formula always uses the just-typed quantity/discount/purchaseCost.
    const line = (watch('lines') ?? [])[index] || (fields[index] as any)
    if (!line) return
    const quantity = Number(line.quantity ?? 0) || 0
    const discount = Number(line.discount ?? 0) || 0
    const activeMode = modeOverride ?? mode

    let actualQuantity = 0
    if (activeMode === 'tonage') {
      const denom = 1000 + discount
      const safeDenom = denom === 0 ? 1 : denom
      actualQuantity = (quantity * 1000) / safeDenom
    } else {
      actualQuantity = quantity - discount
    }

    // Purchase Cost is USER INPUT — preserved. Purchase Amount = Purchase Cost × Actual Quantity.
    const purchaseCost = Number(line.purchaseCost ?? 0) || 0
    const purchaseAmount = purchaseCost * actualQuantity

    setValue(`lines.${index}.actualQuantity`, Number.isFinite(actualQuantity) ? Number(actualQuantity.toFixed(6)) : 0)
    setValue(`lines.${index}.purchaseAmount`, Number.isFinite(purchaseAmount) ? Number(purchaseAmount.toFixed(2)) : 0)
  }

  /**
   * @description Ensure internal numeric fields are synced on blur for purchase lines.
   */
  const syncLineOnBlur = (index: number) => {
    // Read LIVE values from the react-hook-form store so blur normalizes the current input.
    const line = (watch('lines') ?? [])[index] || (fields[index] as any)
    if (!line) return
    const quantityNum = Number(line.quantity ?? 0) || 0
    // recalcLine already syncs actualQuantity/purchaseAmount (auto).
    recalcLine(index)
    setValue(`lines.${index}.quantity`, quantityNum === 0 ? '' : String(quantityNum))
  }

  /**
   * @description Normalize the user-entered Purchase Cost field on blur.
   */
  const syncPurchaseCostOnBlur = (index: number) => {
    const line = (watch('lines') ?? [])[index] || (fields[index] as any)
    if (!line) return
    const costNum = Number(line.purchaseCost ?? 0) || 0
    setValue(`lines.${index}.purchaseCost`, costNum === 0 ? '' : String(costNum))
    recalcLine(index)
  }

  /**
   * @description Compute totals for current purchase line items using watched values.
   * NOTE: computed inline (NOT useMemo) because react-hook-form mutates the `lines`
   * array in place on setValue, so the array reference never changes and a useMemo
   * keyed on [watchedLines] would stay stale (footer totals stuck at 0).
   */
  const arr = Array.isArray(watchedLines) ? watchedLines : []
  const totalQuantity = arr.reduce((s, l) => s + (Number(l?.quantity) || 0), 0)
  // Total Lines Amount = sum of all lines' Purchase Amount (auto).
  const totalAmount = arr.reduce((s, l) => s + (Number((l as any)?.purchaseAmount) || 0), 0)
  const totals = { totalQuantity, totalAmount }

  /**
   * @description Submit handler to sanitize purchase order lines and create/update PO.
   */
  const submit = (values: PurchaseOrderFormValues) => {
    const sanitizedLines: PurchaseOrderLine[] = (values.lines || []).map((l, idx) => {
      const quantity = Number(l.quantity) || 0
      const discount = Number(l.discount) || 0
      const actualQuantity = Number(l.actualQuantity) || 0
      const purchaseCost = (Number(l.purchaseCost) || 0)
      const purchaseAmount = (Number(l.purchaseAmount) || 0)
      return {
        id: existing?.lines?.[idx]?.id ?? `POL-${Date.now()}-${idx}`,
        itemId: l.itemId,
        quantity,
        discount,
        actualQuantity: Number(actualQuantity.toFixed(6)),
        purchaseCost: Number(purchaseCost.toFixed(2)),
        purchaseAmount: Number(purchaseAmount.toFixed(2)),
        // Amount = auto Purchase Amount for the line.
        amount: Number(purchaseAmount.toFixed(2)),
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
      organizationId: selectedOrganizationId ?? null,
      mode,
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
        rate: Number(l.rate) || 0,
        price: Number(p.toFixed(2)),
        amount: Number((q * p).toFixed(2)),
      }
    })
    const so: SalesOrder = {
      id: `SO-${Date.now()}`,
      soNumber: values.soNumber,
      date: values.date,
      customerId: values.customerId,
      remarks: values.remarks,
      sourcePOId: existing?.id ?? '',
      poNumber: existing?.poNumber ?? '',
      organizationId: selectedOrganizationId ?? null,
      lines: sanitized,
      totalAmount: sanitized.reduce((s, l) => s + l.amount, 0),
    }
    saveStoredSOs([so, ...loadStoredSOs()])
    toast.success(`Sales order ${so.soNumber} created with ${sanitized.length} lines.`)
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
      const rate = '' // Rate removed from PO lines; sales rate is editable.
      const priceVal = String((l as any)?.purchaseCost ?? '')
      const amountVal = Number((l as any)?.purchaseAmount) || 0
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
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Date (DD/MM/YYYY)</label>
              <input
                placeholder="DD/MM/YYYY"
                className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                {...register('date', {
                  required: true,
                  pattern: {
                    value: /^\d{2}\/\d{2}\/\d{4}$/,
                    message: 'Use DD/MM/YYYY',
                  },
                })}
              />
              {errors.date ? <p className="mt-1 text-[10px] text-rose-500">{errors.date.message || 'Required'}</p> : null}
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
          </div>

          {/* Tonnage / Lessing mode (below the 3 header fields, above Remarks) */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px]">
            <span className="font-semibold text-slate-700">Quantity Mode</span>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="po-mode"
                checked={mode === 'tonage'}
                onChange={() => {
                  setMode('tonage')
                  ;(fields || []).forEach((_, idx) => recalcLine(idx, 'tonage'))
                }}
              />
              <span>Tonnage</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="po-mode"
                checked={mode === 'lessing'}
                onChange={() => {
                  setMode('lessing')
                  ;(fields || []).forEach((_, idx) => recalcLine(idx, 'lessing'))
                }}
              />
              <span>Lessing</span>
            </label>
            <span className="text-slate-500">
              {mode === 'tonage' ? 'Quantity in Tons' : 'Quantity in Pieces'}
            </span>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
            <textarea rows={2} className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-xs" {...register('remarks')} />
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
                    discount: '',
                    actualQuantity: 0,
                    purchaseCost: '',
                    purchaseAmount: 0,
                    amount: 0,
                  } as any)
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Add Line
              </button>
            </div>

            {/* Desktop table (only rendered on non-mobile to avoid duplicate field registration) */}
            {!isMobile && (
            <div className="max-h-[20rem] overflow-auto">
              <table className="min-w-full text-left text-[11px] rounded-2xl border border-slate-100">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">{mode === 'tonage' ? 'Quantity (Tons)' : 'Quantity (Pieces)'}</th>
                    <th className="px-3 py-2">Discount</th>
                    <th className="px-3 py-2">Actual Quantity</th>
                    <th className="px-3 py-2">Purchase Cost</th>
                    <th className="px-3 py-2">Purchase Amount</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
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
                            {...register(`lines.${index}.quantity` as const, {
                              onChange: () => recalcLine(index),
                            })}
                            onBlur={() => syncLineOnBlur(index)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="w-20 rounded-full border border-slate-200 px-2 py-1"
                            {...register(`lines.${index}.discount` as const, {
                              onChange: () => recalcLine(index),
                            })}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            readOnly
                            className="w-24 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                            {...register(`lines.${index}.actualQuantity` as const)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            className="w-24 rounded-full border border-slate-200 px-2 py-1"
                            {...register(`lines.${index}.purchaseCost` as const, {
                              onChange: () => recalcLine(index),
                            })}
                            onBlur={() => syncPurchaseCostOnBlur(index)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            readOnly
                            className="w-24 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                            {...register(`lines.${index}.purchaseAmount` as const)}
                          />
                        </td>

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
                    <td className="px-3 py-2 font-semibold text-slate-700">Total Lines Amount</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">{totals.totalQuantity}</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-semibold text-slate-700">{totals.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
            )}

            {/* Mobile stacked list (only rendered on mobile to avoid duplicate field registration) */}
            {isMobile && (
            <div className="max-h-[20rem] space-y-2 overflow-y-auto">
              {fields.map((field, index) => {
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

                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-700">
                        {mode === 'tonage' ? 'Quantity (Tons)' : 'Quantity (Pieces)'}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-full rounded-full border border-slate-200 px-3 py-1"
                        {...register(`lines.${index}.quantity` as const, {
                          onChange: () => recalcLine(index),
                        })}
                        onBlur={() => syncLineOnBlur(index)}
                      />
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">Discount</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-full rounded-full border border-slate-200 px-3 py-1"
                          {...register(`lines.${index}.discount` as const, {
                            onChange: () => recalcLine(index),
                          })}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">Actual Quantity</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          readOnly
                          className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                          {...register(`lines.${index}.actualQuantity` as const)}
                        />
                      </div>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">Purchase Cost</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-full rounded-full border border-slate-200 px-3 py-1"
                          {...register(`lines.${index}.purchaseCost` as const, {
                            onChange: () => recalcLine(index),
                          })}
                          onBlur={() => syncPurchaseCostOnBlur(index)}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">Purchase Amount</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          readOnly
                          className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1"
                          {...register(`lines.${index}.purchaseAmount` as const)}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                        Remove
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Mobile lines total */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                  <span>Total Quantity</span>
                  <span>{totals.totalQuantity}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[13px] font-semibold text-slate-700">
                  <span>Total Lines Amount</span>
                  <span>{totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            )}
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
 * @component ViewPurchaseOrderModal
 * @description Read-only view of a purchase order (header, line items, totals) with a Print button.
 */
const ViewPurchaseOrderModal: React.FC<{
  open: boolean
  onClose: () => void
  onPrint: () => void
  order: PurchaseOrder | null
  suppliers: SupplierResponse[]
  items: ItemResponse[]
  resolveSupplierName: (id: string) => string
}> = ({ open, onClose, onPrint, order, suppliers, items, resolveSupplierName }) => {
  if (!open || !order) return null

  const totalQty = order.lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0)
  const totalAmount = order.lines.reduce((s, l) => s + Number(l.purchaseAmount ?? l.amount ?? 0), 0)
  const supplier = suppliers.find((s) => s.id === order.supplierId) ?? mockSuppliers.find((s) => s.id === order.supplierId)
  const wh = warehouses.find((w) => w.id === order.warehouseId)

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 px-3 py-4">
      <div className="w-full max-w-3xl md:rounded-2xl rounded-t-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Purchase Order Details</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500">PO Number</div>
              <div className="font-semibold text-slate-900">{order.poNumber}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Date</div>
              <div className="font-semibold text-slate-900">{toDDMMYYYY(order.date)}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Supplier</div>
              <div className="font-semibold text-slate-900">{supplier?.name ?? order.supplierId}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Warehouse</div>
              <div className="font-semibold text-slate-900">{wh?.name ?? '-'}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Status</div>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${
                  order.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}
              >
                {order.status}
              </span>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Quantity Mode</div>
              <div className="font-semibold text-slate-900">{order.mode === 'lessing' ? 'Lessing' : 'Tonnage'}</div>
            </div>
            <div className="md:col-span-3">
              <div className="text-[11px] font-medium text-slate-500">Remarks</div>
              <div className="text-slate-700">{order.remarks || '-'}</div>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Discount</th>
                  <th className="px-3 py-2">Actual Qty</th>
                  <th className="px-3 py-2">Purchase Cost</th>
                  <th className="px-3 py-2 text-right">Purchase Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.lines.map((l, i) => {
                  const item = items.find((it) => it.id === l.itemId)
                  const amount = Number(l.purchaseAmount ?? l.amount ?? 0)
                  return (
                    <tr key={l.id ?? i} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 font-medium text-slate-800">{item?.name ?? l.itemId}</td>
                      <td className="px-3 py-1.5">{l.quantity}</td>
                      <td className="px-3 py-1.5">{l.discount ?? 0}</td>
                      <td className="px-3 py-1.5">{l.actualQuantity ?? 0}</td>
                      <td className="px-3 py-1.5">{Number(l.purchaseCost ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{amount.toFixed(2)}</td>
                    </tr>
                  )
                })}
                {order.lines.length === 0 && (
                  <tr className="border-t border-slate-100">
                    <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                      No line items
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t bg-slate-50">
                  <td className="px-3 py-2 font-semibold text-slate-700" colSpan={2}>
                    Total Quantity
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-700">{totalQty}</td>
                  <td className="px-3 py-2 font-semibold text-slate-700">Total Lines Amount</td>
                  <td className="px-3 py-2" />
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <button type="button" onClick={onClose} className="rounded-full bg-[#E0E7D9] px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
            Close
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="rounded-full bg-[#1E40AF] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#12337a]"
          >
            Print
          </button>
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
  const { selectedOrganizationId } = useAuthStore()
  const [records, setRecords] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PurchaseOrder | null>(null)

  // Persistence guard so the org-wise seed runs only once.
  const seededRef = useRef(false)

  // Org-scoped item / supplier master data + organizations for PO number generation.
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [items, setItems] = useState<ItemResponse[]>([])
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([])

  const loadSuppliers = async () => {
    try {
      setSuppliers(await getSuppliers())
    } catch {
      setSuppliers([])
    }
  }

  const loadItems = async () => {
    try {
      setItems(await getItems())
    } catch {
      setItems([])
    }
  }

  const loadOrganizations = async () => {
    try {
      const list = await getOrganizations()
      setOrganizations(list)
    } catch {
      // Organization users fall back to their own organization.
      try {
        const org = await getCurrentOrganization(selectedOrganizationId)
        setOrganizations([
          { id: org.id, organization_code: org.organization_code, organization_name: org.organization_name },
        ])
      } catch {
        setOrganizations([])
      }
    }
  }

  useEffect(() => {
    loadSuppliers()
    loadItems()
    loadOrganizations()

    // Re-fetch master data when the organization changes in the header.
    const unsubscribe = onScopeChange(() => {
      loadSuppliers()
      loadItems()
      loadOrganizations()
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Seed purchase orders organization-wise (once organizations are known):
  // use persisted records if present, else assign mock POs across organizations.
  useEffect(() => {
    if (seededRef.current) return
    const stored = loadStoredPOs()
    if (stored) {
      seededRef.current = true
      setRecords(stored)
      setLoading(false)
      return
    }
    // Wait until organizations are loaded to assign org-wise seed.
    if (organizations.length === 0) return
    const orgIds = organizations.map((o) => o.id)
    const seeded = dbPurchaseOrders.map((po, idx) => ({
      ...po,
      organizationId: orgIds.length ? orgIds[idx % orgIds.length] : null,
    }))
    seededRef.current = true
    setRecords(seeded)
    saveStoredPOs(seeded)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizations])

  const currentOrg = organizations.find((o) => o.id === selectedOrganizationId) ?? null

  /**
   * @description Generate an organization-wise PO number.
   * Format: `<FirstLetterOfOrgName>P-<NN>` e.g. "Maiprosoft" -> MP-01.
   */
  const generatePONumber = (): string => {
    const orgName = currentOrg?.organization_name ?? ''
    const firstLetter = orgName.match(/[A-Za-z]/)?.[0]
    const prefix = firstLetter ? `${firstLetter.toUpperCase()}P` : 'PO'
    const count = records.filter((r) => r.organizationId === selectedOrganizationId).length
    return `${prefix}-${String(count + 1).padStart(2, '0')}`
  }

  const resolveSupplierName = (id: string): string =>
    suppliers.find((s) => s.id === id)?.name ?? mockSuppliers.find((s) => s.id === id)?.name ?? ''

  // Organization-wise: only show the selected organization's purchase orders.
  const orgScopedRecords = useMemo(() => {
    if (!selectedOrganizationId) return records
    return records.filter((po) => po.organizationId === selectedOrganizationId)
  }, [records, selectedOrganizationId])

  const filtered = useMemo(
    () =>
      orgScopedRecords.filter((po) => {
        const q = search.toLowerCase()
        const supplierName = resolveSupplierName(po.supplierId)
        const wh = warehouses.find((w) => w.id === po.warehouseId)
        const matchesSearch =
          !q || po.poNumber.toLowerCase().includes(q) || supplierName.toLowerCase().includes(q) || wh?.name.toLowerCase().includes(q)
        return matchesSearch
      }),
    [orgScopedRecords, search, suppliers]
  )

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: PurchaseOrder) => {
    setEditing(row)
    setModalOpen(true)
  }

  const persistRecords = (next: PurchaseOrder[]) => {
    setRecords(next)
    saveStoredPOs(next)
  }

  const handleSave = (order: PurchaseOrder) => {
    const exists = records.some((p) => p.id === order.id)
    const next = exists ? records.map((p) => (p.id === order.id ? order : p)) : [order, ...records]
    persistRecords(next)
    toast.success('Purchase order saved.')
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    persistRecords(records.filter((p) => p.id !== confirmDelete.id))
    toast.success('Purchase order deleted.')
    setConfirmDelete(null)
  }

  const approveOrder = (row: PurchaseOrder) => {
    if (row.status === 'Approved') {
      toast.info('Purchase order already approved.')
      return
    }
    persistRecords(records.map((p) => (p.id === row.id ? { ...p, status: 'Approved' } : p)))
    toast.success('Purchase order approved.')
  }

  /**
   * @description Convert an approved PO into a sales order (persisted org-wise).
   */
  const convertToSalesOrder = (row: PurchaseOrder) => {
    if (row.status !== 'Approved') {
      toast.warning('Only approved purchase orders can be converted to sales orders.')
      return
    }
    const soNumber = `SO-${(Math.floor(Math.random() * 9000) + 1000).toString()}`
    const lines = row.lines.map((l) => ({
      itemId: l.itemId,
      quantity: l.quantity,
      rate: l.purchaseCost ?? 0,
      price: l.purchaseCost ?? 0,
      amount: Number(l.purchaseAmount ?? l.amount ?? 0),
    }))
    const so: SalesOrder = {
      id: `SO-${Date.now()}`,
      soNumber,
      date: new Date().toISOString().slice(0, 10),
      customerId: '',
      remarks: `Converted from ${row.poNumber}`,
      sourcePOId: row.id,
      poNumber: row.poNumber,
      organizationId: row.organizationId ?? null,
      lines,
      totalAmount: lines.reduce((s, l) => s + l.amount, 0),
    }
    saveStoredSOs([so, ...loadStoredSOs()])
    toast.success(`Sales order ${soNumber} created from ${row.poNumber}.`)
  }

  /**
   * @description Print a purchase order in a new window (printable document).
   */
  const printPurchaseOrder = (row: PurchaseOrder) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const lineRows = row.lines
      .map((l, i) => {
        const item = items.find((it) => it.id === l.itemId)
        const amount = Number(l.purchaseAmount ?? l.amount ?? 0)
        return `<tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${item?.name ?? l.itemId}</td>
          <td class="right">${l.quantity}</td>
          <td class="right">${l.discount ?? 0}</td>
          <td class="right">${l.actualQuantity ?? 0}</td>
          <td class="right">${Number(l.purchaseCost ?? 0).toFixed(2)}</td>
          <td class="right">${amount.toFixed(2)}</td>
        </tr>`
      })
      .join('')
    const total = row.lines.reduce((s, l) => s + Number(l.purchaseAmount ?? l.amount ?? 0), 0)
    const supplier = resolveSupplierName(row.supplierId)
    const wh = warehouses.find((w) => w.id === row.warehouseId)?.name ?? ''

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Purchase Order ${row.poNumber}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .muted { color: #555; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
    th { background: #f3f4f6; }
    .right { text-align: right; }
    .total { font-weight: bold; font-size: 14px; }
    .sign { margin-top: 40px; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="head">
    <div>
      <h1>Purchase Order</h1>
      <div class="muted">PO No: ${row.poNumber}</div>
      <div class="muted">Date: ${toDDMMYYYY(row.date)}</div>
    </div>
    <div class="muted" style="text-align:right">
      <div>Supplier: <b>${supplier}</b></div>
      <div>Warehouse: ${wh}</div>
      <div>Status: ${row.status}</div>
    </div>
  </div>
  ${row.remarks ? `<p class="muted">Remarks: ${row.remarks}</p>` : ''}
  <table>
    <thead>
      <tr>
        <th style="width:32px">#</th>
        <th>Item</th>
        <th class="right">Qty</th>
        <th class="right">Discount</th>
        <th class="right">Actual Qty</th>
        <th class="right">Purchase Cost</th>
        <th class="right">Purchase Amount</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="6" class="right">Total Lines Amount</td>
        <td class="right total">${total.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="sign">
    <div>Prepared By: ______________________</div>
    <div>Authorized Signature: ______________________</div>
  </div>
</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const columns: ColumnDef<PurchaseOrder>[] = [
    { key: 'poNumber', label: 'PO Number' },
    {
      key: 'date',
      label: 'Date',
      render: (row) => toDDMMYYYY(row.date),
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      render: (row) => resolveSupplierName(row.supplierId),
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
          onView={(r) => setViewing(r)}
          onEdit={openEdit}
          onPrint={printPurchaseOrder}
          onDelete={(r) => setConfirmDelete(r)}
          onApprove={approveOrder}
          onConvert={convertToSalesOrder}
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
        suppliers={suppliers}
        items={items}
        generatePONumber={generatePONumber}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ViewPurchaseOrderModal
        open={!!viewing}
        order={viewing}
        suppliers={suppliers}
        items={items}
        resolveSupplierName={resolveSupplierName}
        onClose={() => setViewing(null)}
        onPrint={() => viewing && printPurchaseOrder(viewing)}
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