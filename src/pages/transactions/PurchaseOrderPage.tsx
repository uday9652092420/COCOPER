/**
 * @file PurchaseOrderPage.tsx
 * @description Purchase order entry and listing screen with responsive modal, editable purchase cost,
 *              and a Convert -> Sales Order workflow that expands the modal to show a Sales Order section.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, useWatch, useFormState, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  suppliers as mockSuppliers,
  warehouses,
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
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import {
  getPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from '../../services/purchaseorderservices/purchaseOrder.service'
import { createSalesOrder, getSalesOrders, updateSalesOrder } from '../../services/salesorderservices/salesOrder.service'
import {
  getOrganizations,
  getCurrentOrganization,
  type OrganizationSummary,
} from '../../services/organizationservices/organization.service'
import { useAuthStore } from '../../store/authStore'
import { onScopeChange } from '../../utils/scopeEvents'
import { useIsMobile } from '../../hooks/use-mobile'
import { formatAmount } from '../../utils/format'

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

const toISODate = (value: string): string => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [d, m, y] = value.split('/')
    return `${y}-${m}-${d}`
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

const roundValue = (value: number, digits = 0): number => {
  if (!Number.isFinite(value)) return 0
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
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
  mode?: 'tonage' | 'lessing'
  status?: 'Draft' | 'Approved'
  lines: {
    itemId: string
    quantity: number
    discount: number
    actualQuantity: number
    saleCost: number
    saleAmount: number
    amount: number
  }[]
  totalAmount: number
}

/**
 * @description Form values for purchase order including line array.
 */
interface PurchaseOrderFormValues extends FieldValues {
  poNumber: string
  date: string
  supplierId: string
  branchId: string
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
    discount?: string
    actualQuantity?: number
    saleCost?: string
    saleAmount?: number
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
  onPrintPurchaseOrder?: (order: PurchaseOrder) => void
  onApprove?: (order: PurchaseOrder) => void
  onApproveSalesOrder?: (order: SalesOrder) => void
  onSalesOrderSaved?: (order: SalesOrder) => void
  salesOrder?: SalesOrder | null
  existing?: PurchaseOrder | null
  suppliers: SupplierResponse[]
  items: ItemResponse[]
  customers: CustomerResponse[]
  branches: Branch[]
  generatePONumber: () => string
  generateSONumber: () => string
}> = ({ open, onClose, onSave, onPrintPurchaseOrder, onApprove, onApproveSalesOrder, onSalesOrderSaved, salesOrder, existing, suppliers, items, customers, branches, generatePONumber, generateSONumber }) => {
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
        date: toISODate(existing.date || todayDDMMYYYY()),
        supplierId: existing.supplierId,
        branchId: existing.branchId ?? '',
        warehouseId: existing.warehouseId ?? '',
        remarks: existing.remarks ?? '',
        lines:
          existing.lines?.map((l) => ({
            itemId: l.itemId ?? '',
            quantity: String(roundValue(Number(l.quantity ?? 0), 0) || ''),
            discount: String(roundValue(Number(l.discount ?? 0), 0) || ''),
            actualQuantity: roundValue(Number(l.actualQuantity ?? 0), 0),
            purchaseCost: l.purchaseCost !== undefined ? String(l.purchaseCost) : '',
            purchaseAmount: roundValue(Number(l.purchaseAmount ?? 0), 2),
            amount: roundValue(Number(l.amount ?? 0), 2),
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
      date: new Date().toISOString().slice(0, 10),
      supplierId: '',
      branchId: '',
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

  const purchaseDateValue = watch('date') ?? ''
  const purchaseDatePickerRef = useRef<HTMLInputElement>(null)
  const quantityColumnLabel = mode === 'tonage' ? 'Quantity (Tons)' : 'Quantity (Pieces)'

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

    setValue(`lines.${index}.actualQuantity`, Number.isFinite(actualQuantity) ? roundValue(actualQuantity, 0) : 0)
    setValue(`lines.${index}.purchaseAmount`, Number.isFinite(purchaseAmount) ? roundValue(purchaseAmount, 0) : 0)
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
      branchId: values.branchId || '',
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
    if (salesOrder) {
      return {
        soNumber: salesOrder.soNumber,
        date: toDDMMYYYY(salesOrder.date),
        customerId: salesOrder.customerId,
        remarks: salesOrder.remarks,
        lines:
          salesOrder.lines.map((l) => ({
            itemId: l.itemId,
            quantity: String(l.quantity ?? ''),
            discount: String(l.discount ?? ''),
            actualQuantity: l.actualQuantity ?? 0,
            saleCost: String(l.saleCost ?? ''),
            saleAmount: l.saleAmount ?? l.amount ?? 0,
            amount: l.amount ?? l.saleAmount ?? 0,
          })) ?? [],
      }
    }
    if (existing) {
      return {
        soNumber: generateSONumber(),
        date: todayDDMMYYYY(),
        customerId: '',
        remarks: `Converted from ${existing.poNumber}`,
        lines:
          existing.lines?.map((l) => ({
            itemId: l.itemId ?? '',
            quantity: String(l.quantity ?? ''),
            discount: String(l.discount ?? ''),
            actualQuantity: l.actualQuantity ?? 0,
            saleCost: l.purchaseCost !== undefined ? String(l.purchaseCost) : '',
            saleAmount: l.purchaseAmount ?? l.amount ?? 0,
            amount: l.purchaseAmount ?? l.amount ?? 0,
          })) ?? [{ itemId: '', quantity: '', discount: '', actualQuantity: 0, saleCost: '', saleAmount: 0, amount: 0 }],
      }
    }
    return {
      soNumber: generateSONumber(),
      date: todayDDMMYYYY(),
      customerId: '',
      remarks: '',
      lines: [{ itemId: '', quantity: '', discount: '', actualQuantity: 0, saleCost: '', saleAmount: 0, amount: 0 }],
    }
  }

  const {
    register: registerS,
    handleSubmit: handleSubmitS,
    control: controlS,
    setValue: setValueS,
    reset: resetS,
    getValues: getValuesS,
    formState: { errors: salesErrors },
  } = useForm<SalesOrderFormValues>({
    defaultValues: buildSalesInitial(),
  })

  const salesDateValue = useWatch({ control: controlS, name: 'date' }) as string
  const salesDatePickerRef = useRef<HTMLInputElement>(null)

  const { fields: salesFields, append: salesAppend, remove: salesRemove } = useFieldArray({
    control: controlS,
    name: 'lines',
  })

  const watchedSalesLines = useWatch({
    control: controlS,
    name: 'lines',
  }) as SalesOrderFormValues['lines'] | undefined

  /**
   * @description Recalculate sales Actual Quantity (auto from formula) and Sale Amount (auto).
   * Sale Cost is USER INPUT — never overwritten here.
   * Sale Amount = Sale Cost × Actual Quantity.
   */
  const recalcSalesLine = (index: number, modeOverride?: 'tonage' | 'lessing') => {
    const line = (getValuesS('lines') as any)?.[index] || (salesFields[index] as any)
    if (!line) return
    const quantity = Number(line.quantity ?? 0) || 0
    const discount = Number(line.discount ?? 0) || 0
    const activeMode = modeOverride ?? salesMode

    let actualQuantity = 0
    if (activeMode === 'tonage') {
      const denom = 1000 + discount
      const safeDenom = denom === 0 ? 1 : denom
      actualQuantity = (quantity * 1000) / safeDenom
    } else {
      actualQuantity = quantity - discount
    }

    const saleCost = Number(line.saleCost ?? 0) || 0
    const saleAmount = saleCost * actualQuantity

    setValueS(`lines.${index}.actualQuantity`, Number.isFinite(actualQuantity) ? Number(actualQuantity.toFixed(6)) : 0)
    setValueS(`lines.${index}.saleAmount`, Number.isFinite(saleAmount) ? Number(saleAmount.toFixed(2)) : 0)
  }

  const salesTotals = useMemo(() => {
    const arr = Array.isArray(watchedSalesLines) ? watchedSalesLines : []
    const totalQuantity = arr.reduce((s, l) => s + (Number(l?.quantity) || 0), 0)
    // Total Sale Amount = sum of all lines' Sale Amount (auto).
    const totalAmount = arr.reduce((s, l) => s + (Number((l as any)?.saleAmount) || 0), 0)
    return { totalQuantity, totalAmount }
  }, [watchedSalesLines])
  const profitLossAmount = salesTotals.totalAmount - totals.totalAmount

  /**
   * @description Sync sales line numeric fields on blur.
   */
  const syncSalesLineOnBlur = (index: number) => {
    const line = (watchedSalesLines && watchedSalesLines[index]) || (salesFields[index] as any)
    if (!line) return
    const quantityNum = Number(line.quantity ?? 0) || 0
    const costNum = Number(line.saleCost ?? 0) || 0
    recalcSalesLine(index)
    setValueS(`lines.${index}.quantity`, quantityNum === 0 ? '' : String(quantityNum))
    setValueS(`lines.${index}.saleCost`, costNum === 0 ? '' : String(costNum))
  }

  /**
   * @description Handle sales order save (mock) - sanitizes values and shows toast.
   */
  const onSaveSales = (values: SalesOrderFormValues) => {
    const sanitized = (values.lines || []).map((l, idx) => {
      const quantity = Number(l.quantity) || 0
      const discount = Number(l.discount) || 0
      const actualQuantity = Number(l.actualQuantity) || 0
      const saleCost = Number(l.saleCost) || 0
      const saleAmount = Number(l.saleAmount) || 0
      return {
        id: `SOL-${Date.now()}-${idx}`,
        itemId: l.itemId,
        quantity,
        discount,
        actualQuantity: Number(actualQuantity.toFixed(6)),
        saleCost: Number(saleCost.toFixed(2)),
        saleAmount: Number(saleAmount.toFixed(2)),
        amount: Number(saleAmount.toFixed(2)),
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
      mode: salesMode,
      lines: sanitized,
      totalAmount: sanitized.reduce((s, l) => s + l.amount, 0),
      status: 'Draft',
    }
    createSalesOrder({
      soNumber: so.soNumber,
      organizationId: so.organizationId,
      customerId: so.customerId,
      date: so.date,
      remarks: so.remarks,
      sourcePOId: so.sourcePOId,
      poNumber: so.poNumber,
      mode: so.mode,
      status: so.status,
      totalAmount: so.totalAmount,
      lines: so.lines,
    })
      .then((created) => {
        onSalesOrderSaved?.({ ...so, id: created.id, status: 'Draft' })
        toast.success(`Sales order ${so.soNumber} saved as draft.`)
      })
      .catch(() => toast.error('Failed to create sales order.'))
  }

  // Conversion UI state
  const [convertOpen, setConvertOpen] = useState(false)
  const isSalesLocked = salesOrder?.status === 'Approved'
  const isPurchaseLocked = existing?.status === 'Approved' || !!salesOrder || convertOpen
  // Sales order conversion mode (tonage/lessing).
  const [salesMode, setSalesMode] = useState<'tonage' | 'lessing'>(existing?.mode ?? 'tonage')
  const discountLabel = mode === 'tonage' ? 'Discount (Kgs)' : 'Discount (Pieces)'

  const printSalesOrder = (order: SalesOrder) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const customerName = customers.find((customer) => customer.id === order.customerId)?.name ?? '-'
    const lineRows = order.lines.map((line, index) => {
      const itemName = items.find((item) => item.id === line.itemId)?.name ?? line.itemId
      return `<tr>
        <td>${index + 1}</td>
        <td>${itemName}</td>
        <td class="right">${line.quantity}</td>
        <td class="right">${line.discount ?? 0}</td>
        <td class="right">${Math.round(Number(line.actualQuantity ?? 0))}</td>
        <td class="right">${Number(line.saleCost ?? 0).toFixed(2)}</td>
        <td class="right">${formatAmount(Number(line.saleAmount ?? line.amount ?? 0))}</td>
      </tr>`
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head><title>Sales Order ${order.soNumber}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px}h1{font-size:20px;margin:0 0 4px}.muted{color:#555}.head{display:flex;justify-content:space-between;align-items:flex-start}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}th{background:#f3f4f6}.right{text-align:right}.total{font-weight:bold;font-size:14px}.sign{margin-top:40px;display:flex;justify-content:space-between}</style>
      </head><body><div class="head"><div><h1>Sales Order</h1><div class="muted">SO No: ${order.soNumber}</div><div class="muted">Date: ${toDDMMYYYY(order.date)}</div></div><div class="muted" style="text-align:right"><div>Customer: <b>${customerName}</b></div><div>PO No: ${order.poNumber ?? '-'}</div><div>Status: ${order.status}</div></div></div>
      ${order.remarks ? `<p class="muted">Remarks: ${order.remarks}</p>` : ''}<table><thead><tr><th>#</th><th>Item</th><th class="right">Qty</th><th class="right">Discount</th><th class="right">Actual Qty</th><th class="right">Sale Cost</th><th class="right">Sale Amount</th></tr></thead><tbody>${lineRows}</tbody><tfoot><tr><td colspan="6" class="right">Total Lines Amount</td><td class="right total">${formatAmount(order.totalAmount)}</td></tr></tfoot></table><div class="sign"><div>Prepared By: ______________________</div><div>Authorized Signature: ______________________</div></div></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  useEffect(() => {
    // Reset sales form whenever modal opens or existing changes (but keep conversion collapsed)
    setSalesMode(existing?.mode ?? 'tonage')
    resetS(buildSalesInitial())
    setConvertOpen(Boolean(salesOrder))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open, salesOrder])

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
      const discount = l.discount ?? ''
      const actualQuantity = Number((l as any)?.actualQuantity) || 0
      const saleCostVal = String((l as any)?.purchaseCost ?? '')
      const saleAmountVal = Number((l as any)?.purchaseAmount) || 0
      return { itemId, quantity, discount, actualQuantity, saleCost: saleCostVal, saleAmount: saleAmountVal, amount: saleAmountVal }
    })
    setSalesMode(existing?.mode ?? 'tonage')
    resetS({
      soNumber: generateSONumber(),
      date: todayDDMMYYYY(),
      customerId: '',
      remarks: `Converted from ${existing.poNumber}`,
      lines: mapped.length ? mapped : [{ itemId: '', quantity: '', discount: '', actualQuantity: 0, saleCost: '', saleAmount: 0, amount: 0 }],
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
          <div className="rounded-2xl border border-pink-200 bg-pink-50/70 p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-pink-800">Purchase Order</h3>
              {existing?.status === 'Approved' ? (
                <span className="rounded-full border border-pink-300 bg-pink-100 px-2 py-0.5 text-[10px] font-semibold text-pink-700">Approved</span>
              ) : null}
            </div>

          <div className="grid gap-3 md:grid-cols-4">
            <div className="max-w-[220px]">
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                PO Number <span className="text-rose-500">*</span>
              </label>
              <input disabled={isPurchaseLocked} className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-slate-100" {...register('poNumber', { required: true })} />
              {errors.poNumber ? <p className="mt-1 text-[10px] text-rose-500">Required</p> : null}
            </div>

            <div className="max-w-[220px]">
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  disabled={isPurchaseLocked}
                  value={toDDMMYYYY(purchaseDateValue || new Date().toISOString().slice(0, 10))}
                  onChange={(e) => setValue('date', e.target.value, { shouldDirty: true })}
                  onBlur={(e) => setValue('date', toISODate(e.target.value) || e.target.value, { shouldDirty: true })}
                  placeholder="DD/MM/YYYY"
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 pr-10 text-xs disabled:cursor-not-allowed disabled:bg-slate-100"
                />
                <input
                  ref={purchaseDatePickerRef}
                  type="date"
                  disabled={isPurchaseLocked}
                  value={toISODate(purchaseDateValue || new Date().toISOString().slice(0, 10))}
                  onChange={(e) => setValue('date', e.target.value, { shouldDirty: true })}
                  className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  aria-label="Select purchase order date"
                />
                <button type="button" disabled={isPurchaseLocked} onClick={() => purchaseDatePickerRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 disabled:cursor-not-allowed" aria-label="Open purchase order date picker">
                  &#128197;
                </button>
              </div>
              {errors.date ? <p className="mt-1 text-[10px] text-rose-500">Required</p> : null}
            </div>

            <div className="max-w-[220px]">
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Branch
              </label>
              <select disabled={isPurchaseLocked} className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-slate-100" {...register('branchId')}>
                <option value="">Select branch</option>
                {branches.filter((b) => b.status?.toUpperCase() !== 'INACTIVE').map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-w-[220px]">
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Supplier <span className="text-rose-500">*</span>
              </label>
              <select disabled={isPurchaseLocked} className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-slate-100" {...register('supplierId', { required: true })}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tonnage / Lessing mode (below the header fields, above Remarks) */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px]">
            <span className="font-semibold text-slate-700">Quantity Mode</span>
            <label className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="po-mode"
                checked={mode === 'tonage'}
                disabled={isPurchaseLocked}
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
                disabled={isPurchaseLocked}
                onChange={() => {
                  setMode('lessing')
                  ;(fields || []).forEach((_, idx) => recalcLine(idx, 'lessing'))
                }}
              />
              <span>Lessing</span>
            </label>
          </div>

          <div className="mt-3">
            <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
            <textarea rows={2} disabled={isPurchaseLocked} className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-slate-100" {...register('remarks')} />
          </div>

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
              <span>
                Line Items <span className="text-rose-500">*</span>
              </span>
              {!isPurchaseLocked && (
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
              )}
            </div>

            {/* Desktop table (only rendered on non-mobile to avoid duplicate field registration) */}
            {!isMobile && (
            <div className="max-h-[20rem] overflow-auto">
              <table className="min-w-full text-left text-[11px] rounded-2xl border border-slate-100">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">{quantityColumnLabel}</th>
                    <th className="px-3 py-2">{discountLabel}</th>
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
                          <select disabled={isPurchaseLocked} className="w-full rounded-full border border-slate-200 px-2 py-1 text-[11px] disabled:cursor-not-allowed disabled:bg-slate-100" {...register(`lines.${index}.itemId` as const, { required: true })}>
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
                            disabled={isPurchaseLocked}
                            className="w-20 rounded-full border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                            disabled={isPurchaseLocked}
                            className="w-20 rounded-full border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:bg-slate-100"
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
                            className="w-20 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                            {...register(`lines.${index}.actualQuantity` as const)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            inputMode="decimal"
                            disabled={isPurchaseLocked}
                            className="w-20 rounded-full border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:bg-slate-100"
                            {...register(`lines.${index}.purchaseCost` as const, {
                              onChange: () => recalcLine(index),
                            })}
                            onBlur={() => syncPurchaseCostOnBlur(index)}
                          />
                        </td>

                        <td className="px-3 py-1.5">
                          <div className="w-24 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                            {formatAmount(Number(watchedLines[index]?.purchaseAmount ?? 0))}
                          </div>
                        </td>

                        <td className="px-3 py-1.5 text-right">
                          {!isPurchaseLocked && (
                            <button type="button" onClick={() => remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                              Remove
                            </button>
                          )}
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
                    <td className="px-3 py-2 font-semibold text-slate-700">{formatAmount(totals.totalAmount)}</td>
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
                      <label className="mb-1 block text-[11px] font-medium text-slate-700">{quantityColumnLabel}</label>
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
                        <label className="mb-1 block text-[11px] font-medium text-slate-700">{discountLabel}</label>
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
                          <div className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1">
                            {formatAmount(Number(watchedLines[index]?.purchaseAmount ?? 0))}
                          </div>
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
                  <span>{formatAmount(totals.totalAmount)}</span>
                </div>
              </div>
            </div>
            )}
            {existing && onPrintPurchaseOrder ? (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => onPrintPurchaseOrder(existing)}
                  className="rounded-full bg-pink-700 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-pink-800"
                >
                  Print
                </button>
              </div>
            ) : null}

          </div>

          </div>

          {/* Sales Order Conversion Section (expands modal when open) */}
          {(convertOpen || salesOrder) && (
            <div className="mt-4 rounded-2xl border border-[#8bc53f]/50 bg-[#fff8e8] p-4 shadow-inner">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#00534f]">Sales Order (Conversion)</h3>
                  {salesOrder?.status === 'Approved' ? (
                    <span className="rounded-full border border-[#8bc53f] bg-[#e8f4c8] px-2 py-0.5 text-[10px] font-semibold text-[#00534f]">Approved</span>
                  ) : (
                    <span className="rounded-full border border-[#ff7043]/40 bg-[#fff0e8] px-2 py-0.5 text-[10px] font-semibold text-[#c94f2d]">Draft</span>
                  )}
                </div>
                <button type="button" onClick={() => setConvertOpen(false)} className="text-xs text-slate-500 hover:text-slate-700">
                  Close Sales Order
                </button>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">SO Number</label>
                  <input disabled={isSalesLocked} className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-[#e8f4c8]" {...registerS('soNumber')} />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Date (DD/MM/YYYY)</label>
                  <div className="relative">
                    <input
                      placeholder="DD/MM/YYYY"
                      disabled={isSalesLocked}
                      value={salesDateValue ?? ''}
                      onChange={(e) => setValueS('date', e.target.value, { shouldDirty: true })}
                      onBlur={(e) => setValueS('date', toDDMMYYYY(e.target.value), { shouldDirty: true })}
                      className="w-full rounded-full border border-slate-200 px-3 py-1.5 pr-10 text-xs disabled:cursor-not-allowed disabled:bg-[#e8f4c8]"
                    />
                    <input
                      ref={salesDatePickerRef}
                      type="date"
                      disabled={isSalesLocked}
                      value={toISODate(salesDateValue ?? '')}
                      onChange={(e) => setValueS('date', toDDMMYYYY(e.target.value), { shouldDirty: true })}
                      className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                      aria-label="Select sales order date"
                    />
                    <button type="button" disabled={isSalesLocked} onClick={() => salesDatePickerRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 disabled:cursor-not-allowed" aria-label="Open sales order date picker">
                      &#128197;
                    </button>
                  </div>
                  {salesErrors.date ? <p className="mt-1 text-[10px] text-rose-500">{salesErrors.date.message || 'Required'}</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Customer</label>
                  <select disabled={isSalesLocked} className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-[#e8f4c8]" {...registerS('customerId', { required: true })}>
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
                  <input disabled={isSalesLocked} className="w-full rounded-2xl border border-slate-200 px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:bg-[#e8f4c8]" {...registerS('remarks')} />
                </div>
              </div>

              {/* Sales lines: mirror of PO lines but editable */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                  <span>Sales Line Items</span>
                  {!isSalesLocked && <button
                    type="button"
                    onClick={() =>
                      salesAppend({
                        itemId: '',
                        quantity: '',
                        discount: '',
                        actualQuantity: 0,
                        saleCost: '',
                        saleAmount: 0,
                        amount: 0,
                      } as any)
                    }
                    className="rounded-full border border-[#8bc53f] bg-[#e8f4c8] px-3 py-1 text-[11px] font-semibold text-[#00534f] hover:bg-[#d9edaa]"
                  >
                    Add Line
                  </button>}
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-[11px] rounded-2xl border border-slate-100">
                    <thead className="bg-[#e8f4c8] text-[#00534f]">
                      <tr>
                        <th className="px-3 py-2">Item</th>
                        <th className="px-3 py-2">{salesMode === 'tonage' ? 'Quantity (Tons)' : 'Quantity (Pieces)'}</th>
                        <th className="px-3 py-2">{salesMode === 'tonage' ? 'Discount (Kgs)' : 'Discount (Pieces)'}</th>
                        <th className="px-3 py-2">Actual Quantity</th>
                        <th className="px-3 py-2">Sale Cost</th>
                        <th className="px-3 py-2">Sale Amount</th>
                        <th className="px-3 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesFields.map((field, index) => {
                        return (
                          <tr key={field.id} className="border-t border-slate-100">
                            <td className="px-3 py-1.5">
                              <select
                                aria-disabled="true"
                                tabIndex={-1}
                                onMouseDown={(event) => event.preventDefault()}
                                onKeyDown={(event) => event.preventDefault()}
                                className="pointer-events-none w-full rounded-full border border-slate-200 bg-[#e8f4c8] px-2 py-1 text-[11px]"
                                {...registerS(`lines.${index}.itemId` as const, { required: true })}
                              >
                                <option value="">Select item</option>
                                {items.map((it) => (
                                  <option key={it.id} value={it.id}>
                                    {it.name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" disabled className="w-24 rounded-full border border-slate-200 bg-[#e8f4c8] px-2 py-1" {...registerS(`lines.${index}.quantity` as const)} />
                            </td>

                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" disabled={isSalesLocked} className="w-20 rounded-full border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:bg-[#e8f4c8]" {...registerS(`lines.${index}.discount` as const, { onChange: () => recalcSalesLine(index) })} />
                            </td>

                            <td className="px-3 py-1.5">
                              <div className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                                {Math.round(Number(watchedSalesLines?.[index]?.actualQuantity ?? 0))}
                              </div>
                              <input type="hidden" {...registerS(`lines.${index}.actualQuantity` as const)} />
                            </td>

                            <td className="px-3 py-1.5">
                              <input type="text" inputMode="decimal" disabled={isSalesLocked} className="w-24 rounded-full border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:bg-[#e8f4c8]" {...registerS(`lines.${index}.saleCost` as const, { onChange: () => recalcSalesLine(index) })} onBlur={() => syncSalesLineOnBlur(index)} />
                            </td>

                            <td className="px-3 py-1.5">
                              <div className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                                {formatAmount(Number(watchedSalesLines?.[index]?.saleAmount ?? 0))}
                              </div>
                            </td>

                            <td className="px-3 py-1.5 text-right">
                              {!isSalesLocked && <button type="button" onClick={() => salesRemove(index)} className="rounded-full border border-[#ff7043]/30 bg-[#fff0e8] px-2 py-1 text-[10px] text-[#c94f2d] hover:bg-[#ffe0d2]">
                                Remove
                              </button>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>

                    <tfoot>
                      <tr className="border-t bg-[#fff8e8]">
                        <td className="px-3 py-2 font-semibold text-slate-700">Total Lines Amount</td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{salesTotals.totalQuantity}</td>
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2" />
                        <td className="px-3 py-2 font-semibold text-slate-700">{formatAmount(salesTotals.totalAmount)}</td>
                        <td className="px-3 py-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className={`text-left text-2xl font-bold ${profitLossAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {profitLossAmount < 0
                    ? `Loss Amount = ${formatAmount(Math.abs(profitLossAmount))}`
                    : `Profit Amount = ${formatAmount(profitLossAmount)}`}
                </div>
              </div>

              <div className="mt-3 flex justify-end gap-2">
                {salesOrder?.status === 'Approved' ? (
                  <button type="button" onClick={() => printSalesOrder(salesOrder)} className="rounded-full bg-[#00534f] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003f3b]">
                    Print
                  </button>
                ) : salesOrder ? (
                  onApproveSalesOrder ? (
                    <button type="button" onClick={() => onApproveSalesOrder(salesOrder)} className="rounded-full bg-[#00534f] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003f3b]">
                      Approve
                    </button>
                  ) : null
                ) : (
                  <>
                    <button type="button" onClick={() => setConvertOpen(false)} className="rounded-full bg-[#E0E7D9] px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                      Cancel
                    </button>
                    <button type="button" onClick={handleSubmitS(onSaveSales)} className="rounded-full bg-[#00534f] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#003f3b]">
                      Save
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
          <div className="text-[11px] text-slate-500">Save to keep PO as draft or approve when final, then convert to Sales Order.</div>
          <div className="flex gap-2">
            {existing && existing.status !== 'Approved' && (
              <button
                type="button"
                onClick={() => {
                  if (onApprove) onApprove(existing)
                }}
                className="rounded-full bg-[#0EA5A4] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0b8b89]"
              >
                Approve
              </button>
            )}

            {existing && existing.status === 'Approved' && !convertOpen && !salesOrder && (
              <button
                type="button"
                onClick={openConversionFromPO}
                className="rounded-full bg-[#0EA5A4] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0b8b89]"
              >
                Convert Sales Order
              </button>
            )}

            {!isPurchaseLocked && (
              <button type="button" onClick={handleSubmit(submit)} className="rounded-full bg-[#8bc53f] px-4 py-1.5 text-xs font-semibold text-[#00534f] shadow-sm hover:bg-[#79ad30]">
                Save
              </button>
            )}
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
  branches: Branch[]
  resolveSupplierName: (id: string) => string
}> = ({ open, onClose, onPrint, order, suppliers, items, branches, resolveSupplierName }) => {
  if (!open || !order) return null

  const totalQty = order.lines.reduce((s, l) => s + Number(l.quantity ?? 0), 0)
  const totalAmount = order.lines.reduce((s, l) => s + Number(l.purchaseAmount ?? l.amount ?? 0), 0)
  const supplier = suppliers.find((s) => s.id === order.supplierId) ?? mockSuppliers.find((s) => s.id === order.supplierId)
  const branchName = order.branchId ? branches.find((b) => b.id === order.branchId)?.branch_name ?? order.branchId : ''
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
              <div className="text-[11px] font-medium text-slate-500">Branch</div>
              <div className="font-semibold text-slate-900">{branchName || '-'}</div>
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
                            <td className="px-3 py-1.5 text-right font-semibold">{formatAmount(amount)}</td>
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
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{formatAmount(totalAmount)}</td>
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
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseOrder | null>(null)
  const [editingSalesOrder, setEditingSalesOrder] = useState<SalesOrder | null>(null)
  const [viewing, setViewing] = useState<PurchaseOrder | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PurchaseOrder | null>(null)
  const [printSelection, setPrintSelection] = useState<PurchaseOrder | null>(null)

  // Org-scoped item / supplier / customer master data + organizations for PO number generation.
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [items, setItems] = useState<ItemResponse[]>([])
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
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

  const loadCustomers = async () => {
    try {
      setCustomers(await getCustomers())
    } catch {
      setCustomers([])
    }
  }

  const loadBranches = async () => {
    try {
      setBranches(await getBranches())
    } catch {
      setBranches([])
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

  /**
   * @description Load purchase orders from the backend (org-scoped via x-organization-id header).
   */
  const loadRecords = async () => {
    try {
      setRecords((await getPurchaseOrders()) as unknown as PurchaseOrder[])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  const loadSalesOrders = async () => {
    try {
      setSalesOrders((await getSalesOrders()) as unknown as SalesOrder[])
    } catch {
      setSalesOrders([])
    }
  }

  useEffect(() => {
    loadSuppliers()
    loadItems()
    loadCustomers()
    loadBranches()
    loadOrganizations()
    loadRecords()
    loadSalesOrders()

    // Re-fetch master data + records when the organization changes in the header.
    const unsubscribe = onScopeChange(() => {
      loadSuppliers()
      loadItems()
      loadCustomers()
      loadBranches()
      loadOrganizations()
      loadRecords()
      loadSalesOrders()
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentOrg = organizations.find((o) => o.id === selectedOrganizationId) ?? null

  /**
   * @description Generate an organization-wise PO number.
  * Format: `<FirstLetterOfOrgName>PO-<NN>` e.g. "Maiprosoft" -> MPO-01.
   */
  const generatePONumber = (): string => {
    const orgName = currentOrg?.organization_name ?? ''
    const firstLetter = orgName.match(/[A-Za-z]/)?.[0]
    const prefix = firstLetter ? `${firstLetter.toUpperCase()}PO` : 'PO'
    const count = records.filter((r) => r.organizationId === selectedOrganizationId).length
    return `${prefix}-${String(count + 1).padStart(2, '0')}`
  }

  const generateSONumber = (): string => {
    const orgName = currentOrg?.organization_name ?? ''
    const firstLetter = orgName.match(/[A-Za-z]/)?.[0]
    const prefix = firstLetter ? `${firstLetter.toUpperCase()}SO` : 'SO'
    const numbers = salesOrders
      .filter((order) => order.organizationId === selectedOrganizationId && order.soNumber.startsWith(`${prefix}-`))
      .map((order) => Number(order.soNumber.slice(prefix.length + 1)))
      .filter((number) => Number.isFinite(number))
    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1
    return `${prefix}-${String(nextNumber).padStart(2, '0')}`
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
    setEditingSalesOrder(salesOrders.find((so) => so.sourcePOId === row.id) ?? null)
    setModalOpen(true)
  }

  /**
   * @description Save (create/update) a purchase order to the backend, org-scoped.
   */
  const handleSave = async (order: PurchaseOrder) => {
    try {
      const payload = {
        poNumber: order.poNumber,
        organizationId: order.organizationId ?? null,
        supplierId: order.supplierId,
        branchId: order.branchId ?? '',
        warehouseId: order.warehouseId ?? '',
        date: order.date,
        remarks: order.remarks ?? '',
        status: order.status,
        mode: order.mode ?? 'tonage',
        lines: order.lines.map((l) => ({
          id: l.id,
          itemId: l.itemId,
          quantity: l.quantity,
          discount: l.discount,
          actualQuantity: l.actualQuantity ?? 0,
          purchaseCost: l.purchaseCost,
          purchaseAmount: l.purchaseAmount ?? 0,
          amount: l.amount,
          rate: l.rate,
        })),
      }
      if (order.id && records.some((p) => p.id === order.id)) {
        await updatePurchaseOrder(order.id, payload)
      } else {
        await createPurchaseOrder({ ...payload, id: order.id })
      }
      await loadRecords()
      toast.success('Purchase order saved.')
    } catch {
      toast.error('Failed to save purchase order.')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deletePurchaseOrder(confirmDelete.id)
      setConfirmDelete(null)
      await loadRecords()
      toast.success('Purchase order deleted.')
    } catch {
      toast.error('Failed to delete purchase order.')
    }
  }

  const approveOrder = async (row: PurchaseOrder) => {
    if (row.status === 'Approved') {
      toast.info('Purchase order already approved.')
      return
    }
    try {
      await updatePurchaseOrder(row.id, { status: 'Approved' })
      await loadRecords()
      setEditing((prev) => (prev && prev.id === row.id ? { ...prev, status: 'Approved' } : prev))
      toast.success('Purchase order approved.')
    } catch {
      toast.error('Failed to approve purchase order.')
    }
  }

  const approveSalesOrder = async (row: SalesOrder) => {
    const updated = { ...row, status: 'Approved' as const }
    try {
      await updateSalesOrder(row.id, { soNumber: row.soNumber, status: 'Approved', lines: row.lines })
      setSalesOrders((prev) => prev.map((so) => (so.id === row.id ? updated : so)))
      setEditingSalesOrder(updated)
      toast.success(`Sales order ${row.soNumber} approved.`)
    } catch {
      toast.error('Failed to approve sales order.')
    }
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
      discount: l.discount ?? 0,
      actualQuantity: l.actualQuantity ?? 0,
      saleCost: l.purchaseCost ?? 0,
      saleAmount: Number(l.purchaseAmount ?? l.amount ?? 0),
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
      mode: row.mode ?? 'tonage',
      status: 'Draft',
      lines,
      totalAmount: lines.reduce((s, l) => s + l.amount, 0),
    }
    createSalesOrder({
      soNumber: so.soNumber,
      organizationId: so.organizationId,
      customerId: so.customerId,
      date: so.date,
      remarks: so.remarks,
      sourcePOId: so.sourcePOId,
      poNumber: so.poNumber,
      mode: so.mode,
      totalAmount: so.totalAmount,
      lines: so.lines,
    })
      .then(() => {
        setSalesOrders((prev) => [so, ...prev])
        setEditingSalesOrder(so)
        toast.success(`Sales order ${soNumber} created from ${row.poNumber}.`)
      })
      .catch(() => toast.error('Failed to create sales order.'))
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
          <td class="right">${formatAmount(amount)}</td>
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
        <td class="right total">${formatAmount(total)}</td>
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

  const printSalesOrder = (order: SalesOrder) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const customerName = customers.find((customer) => customer.id === order.customerId)?.name ?? '-'
    const lineRows = order.lines.map((line, index) => {
      const itemName = items.find((item) => item.id === line.itemId)?.name ?? line.itemId
      return `<tr>
        <td>${index + 1}</td>
        <td>${itemName}</td>
        <td class="right">${line.quantity}</td>
        <td class="right">${line.discount ?? 0}</td>
        <td class="right">${Math.round(Number(line.actualQuantity ?? 0))}</td>
        <td class="right">${Number(line.saleCost ?? 0).toFixed(2)}</td>
        <td class="right">${formatAmount(Number(line.saleAmount ?? line.amount ?? 0))}</td>
      </tr>`
    }).join('')

    win.document.write(`<!DOCTYPE html><html><head><title>Sales Order ${order.soNumber}</title>
      <style>body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:32px}h1{font-size:20px;margin:0 0 4px}.muted{color:#555}.head{display:flex;justify-content:space-between;align-items:flex-start}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px;text-align:left}th{background:#f3f4f6}.right{text-align:right}.total{font-weight:bold;font-size:14px}.sign{margin-top:40px;display:flex;justify-content:space-between}</style>
      </head><body><div class="head"><div><h1>Sales Order</h1><div class="muted">SO No: ${order.soNumber}</div><div class="muted">Date: ${toDDMMYYYY(order.date)}</div></div><div class="muted" style="text-align:right"><div>Customer: <b>${customerName}</b></div><div>PO No: ${order.poNumber ?? '-'}</div><div>Status: ${order.status}</div></div></div>
      ${order.remarks ? `<p class="muted">Remarks: ${order.remarks}</p>` : ''}<table><thead><tr><th>#</th><th>Item</th><th class="right">Qty</th><th class="right">Discount</th><th class="right">Actual Qty</th><th class="right">Sale Cost</th><th class="right">Sale Amount</th></tr></thead><tbody>${lineRows}</tbody><tfoot><tr><td colspan="6" class="right">Total Lines Amount</td><td class="right total">${formatAmount(order.totalAmount)}</td></tr></tfoot></table><div class="sign"><div>Prepared By: ______________________</div><div>Authorized Signature: ______________________</div></div></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const printSavedOrder = async (row: PurchaseOrder, type: 'purchase' | 'sales') => {
    setPrintSelection(null)
    if (type === 'purchase') {
      printPurchaseOrder(row)
      return
    }

    let salesOrder = salesOrders.find(
      (order) => order.sourcePOId === row.id || order.poNumber === row.poNumber
    )
    if (!salesOrder) {
      try {
        const refreshedSalesOrders = (await getSalesOrders()) as unknown as SalesOrder[]
        setSalesOrders(refreshedSalesOrders)
        salesOrder = refreshedSalesOrders.find(
          (order) => order.sourcePOId === row.id || order.poNumber === row.poNumber
        )
      } catch {
        salesOrder = undefined
      }
    }
    if (!salesOrder) {
      toast.info('No Sales Order has been saved for this Purchase Order.')
      return
    }
    printSalesOrder(salesOrder)
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
      key: 'branchId',
      label: 'Branch',
      render: (row) => (row.branchId ? branches.find((b) => b.id === row.branchId)?.branch_name ?? row.branchId : '-'),
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
          onPrint={(row) => setPrintSelection(row)}
          onDelete={((row as unknown) as { status: string; purchaseOrderInvoiceStatus?: boolean }).status !== 'Approved' &&
          ((row as unknown) as { status: string; purchaseOrderInvoiceStatus?: boolean }).status !== 'Invoiced' &&
          !((row as unknown) as { status: string; purchaseOrderInvoiceStatus?: boolean }).purchaseOrderInvoiceStatus
            ? (r) => setConfirmDelete(r)
            : undefined}
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
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by PO number, supplier, branch..." />
      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/30 p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-emerald-800">Purchase Orders</h3>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{filtered.length} records</span>
        </div>
        <DataGrid<PurchaseOrder> data={filtered} columns={columns} getRowId={(row) => row.id} loading={loading} />
      </div>

      <PurchaseOrderModal
        open={modalOpen}
        existing={editing}
        salesOrder={editingSalesOrder}
        suppliers={suppliers}
        items={items}
        customers={customers}
        branches={branches}
        generatePONumber={generatePONumber}
        generateSONumber={generateSONumber}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          setEditingSalesOrder(null)
        }}
        onPrintPurchaseOrder={printPurchaseOrder}
        onApprove={approveOrder}
        onApproveSalesOrder={approveSalesOrder}
        onSalesOrderSaved={(order) => {
          setSalesOrders((prev) => [order, ...prev])
          setEditingSalesOrder(order)
        }}
        onSave={handleSave}
      />

      <ViewPurchaseOrderModal
        open={!!viewing}
        order={viewing}
        suppliers={suppliers}
        items={items}
        branches={branches}
        resolveSupplierName={resolveSupplierName}
        onClose={() => setViewing(null)}
        onPrint={() => viewing && printPurchaseOrder(viewing)}
      />

      {printSelection ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Select Print Document</h3>
              <button type="button" onClick={() => setPrintSelection(null)} className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">
                Close
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">Choose a document to print for {printSelection.poNumber}.</p>
            <div className="mt-4 grid gap-2">
              <button
                type="button"
                onClick={() => printSavedOrder(printSelection, 'purchase')}
                className="rounded-full bg-[#1E40AF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12337a]"
              >
                Print Purchase Order
              </button>
              <button
                type="button"
                onClick={() => printSavedOrder(printSelection, 'sales')}
                className="rounded-full bg-[#00534f] px-4 py-2 text-xs font-semibold text-white hover:bg-[#003f3b]"
              >
                Print Sales Order
              </button>
            </div>
          </div>
        </div>
      ) : null}

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