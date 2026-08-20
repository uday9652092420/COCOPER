/**
 * @file PurchaseInvoicePage.tsx
 * @description Purchase invoice entry and listing screen.
 *
 * Notes:
 * - Org-scoped suppliers / items / branches (dynamic, from master modules).
 * - Branch replaces the old Warehouse field.
 * - Date field is DD/MM/YYYY.
 * - Tonage / Lessing quantity mode (same as Purchase Order).
 * - Line fields: Item, Quantity, Discount, Actual Quantity (auto), Purchase Cost (input),
 *   Purchase Amount (auto = Purchase Cost × Actual Quantity).
 * - Additional charges (Loading Cost, Market Cess, Bags & Sticks, Freight).
 * - View / Edit / Print / Delete actions + organization-wise persistence (localStorage).
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  suppliers as mockSuppliers,
  branches as mockBranches,
  items as mockItems,
  type PurchaseInvoice,
  type PurchaseInvoiceLine,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import RowActions from '../../components/common/RowActions'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency } from '../../utils/format'
import { getSuppliers, type SupplierResponse } from '../../services/supplierservices/supplier.service'
import { getItems, type ItemResponse } from '../../services/itemservices/item.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import {
  getPurchaseInvoices,
  createPurchaseInvoice,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
} from '../../services/purchaseinvoiceservices/purchaseInvoice.service'
import {
  getOrganizations,
  getCurrentOrganization,
  type OrganizationSummary,
} from '../../services/organizationservices/organization.service'
import { useAuthStore } from '../../store/authStore'
import { onScopeChange } from '../../utils/scopeEvents'
import { useIsMobile } from '../../hooks/use-mobile'

/**
 * @description Convert a date string to DD/MM/YYYY (accepts ISO YYYY-MM-DD).
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
 * @interface PurchaseInvoiceFormValues
 * @description Form shape used inside purchase invoice modal.
 */
interface PurchaseInvoiceFormValues extends FieldValues {
  supplierId: string
  branchId: string
  invoiceNo: string
  invoiceDate: string
  lines: {
    itemId: string
    quantity?: string
    discount?: string
    actualQuantity?: number
    purchaseCost?: string
    purchaseAmount?: number
  }[]
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
  suppliers: SupplierResponse[]
  items: ItemResponse[]
  branches: Branch[]
  generatePINumber: () => string
}> = ({ open, onClose, onSave, existing, suppliers, items, branches, generatePINumber }) => {
  const { selectedOrganizationId } = useAuthStore()
  const isMobile = useIsMobile()

  /**
   * @description Mode for actual quantity calculation.
   * 'tonage'  => actualQuantity = (quantity * 1000) / (discount + 1000)
   * 'lessing' => actualQuantity = (quantity - discount)
   */
  const [mode, setMode] = useState<'tonage' | 'lessing'>(existing?.mode ?? 'tonage')

  /**
   * @description Build initial/default form values with string fields for editable inputs.
   */
  const buildInitial = (): PurchaseInvoiceFormValues => {
    if (existing) {
      return {
        supplierId: existing.supplierId,
        branchId: existing.branchId ?? '',
        invoiceNo: existing.invoiceNo,
        invoiceDate: toDDMMYYYY(existing.invoiceDate),
        lines:
          existing.lines?.map((l) => ({
            itemId: l.itemId ?? '',
            quantity: String(l.quantityTons ?? ''),
            discount: String(l.discount ?? ''),
            actualQuantity: l.actualQuantity ?? 0,
            purchaseCost: l.purchaseCost !== undefined ? String(l.purchaseCost) : '',
            purchaseAmount: l.purchaseAmount ?? 0,
          })) ?? [
            { itemId: '', quantity: '', discount: '', actualQuantity: 0, purchaseCost: '', purchaseAmount: 0 },
          ],
        loadingCost: Number(existing.loadingCost) || 0,
        marketCess: Number(existing.marketCess) || 0,
        bagsAndSticks: Number(existing.bagsAndSticks) || 0,
        freight: Number(existing.freight) || 0,
      }
    }
    return {
      supplierId: '',
      branchId: '',
      invoiceNo: generatePINumber(),
      invoiceDate: todayDDMMYYYY(),
      lines: [{ itemId: '', quantity: '', discount: '', actualQuantity: 0, purchaseCost: '', purchaseAmount: 0 }],
      loadingCost: 0,
      marketCess: 0,
      bagsAndSticks: 0,
      freight: 0,
    }
  }

  const {
    register,
    control,
    watch,
    setValue,
    getValues,
    handleSubmit,
    reset,
  } = useForm<PurchaseInvoiceFormValues>({
    defaultValues: buildInitial(),
  })

  useEffect(() => {
    // Reset form whenever modal opens or existing changes
    setMode(existing?.mode ?? 'tonage')
    reset(buildInitial())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open])

  const linesField = useFieldArray({ control, name: 'lines' })
  const watchedLines = (watch('lines') ?? []) as PurchaseInvoiceFormValues['lines']

  /**
   * @description Recalculate Actual Quantity (auto from formula) and Purchase Amount (auto).
   * Purchase Cost is USER INPUT — never overwritten here.
   * Purchase Amount = Purchase Cost × Actual Quantity.
   */
  const recalcLine = (index: number, modeOverride?: 'tonage' | 'lessing') => {
    const line = (getValues('lines') ?? [])[index] || (linesField.fields[index] as any)
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

    const purchaseCost = Number(line.purchaseCost ?? 0) || 0
    const purchaseAmount = purchaseCost * actualQuantity

    setValue(`lines.${index}.actualQuantity`, Number.isFinite(actualQuantity) ? Number(actualQuantity.toFixed(6)) : 0)
    setValue(`lines.${index}.purchaseAmount`, Number.isFinite(purchaseAmount) ? Number(purchaseAmount.toFixed(2)) : 0)
  }

  /**
   * @description Normalize quantity on blur.
   */
  const syncLineOnBlur = (index: number) => {
    const line = (getValues('lines') ?? [])[index] || (linesField.fields[index] as any)
    if (!line) return
    const q = Number(line.quantity ?? 0) || 0
    recalcLine(index)
    setValue(`lines.${index}.quantity`, q === 0 ? '' : String(q))
  }

  /**
   * @description Normalize the user-entered Purchase Cost field on blur.
   */
  const syncPurchaseCostOnBlur = (index: number) => {
    const line = (getValues('lines') ?? [])[index] || (linesField.fields[index] as any)
    if (!line) return
    const c = Number(line.purchaseCost ?? 0) || 0
    setValue(`lines.${index}.purchaseCost`, c === 0 ? '' : String(c))
    recalcLine(index)
  }

  /**
   * @description Compute totals (inline, NOT useMemo — same lesson as Purchase Order page).
   */
  const arr = Array.isArray(watchedLines) ? watchedLines : []
  const totalQuantity = arr.reduce((s, l) => s + (Number(l?.quantity) || 0), 0)
  const totalAmount = arr.reduce((s, l) => s + (Number((l as any)?.purchaseAmount) || 0), 0)

  const loadingCost = Number(watch('loadingCost') || 0)
  const marketCess = Number(watch('marketCess') || 0)
  const bagsAndSticks = Number(watch('bagsAndSticks') || 0)
  const freight = Number(watch('freight') || 0)
  const additionalTotal = loadingCost + marketCess + bagsAndSticks + freight
  const grandTotal = totalAmount + additionalTotal

  /**
   * @description Submit handler to sanitize lines and create/update invoice.
   */
  const submit = (values: PurchaseInvoiceFormValues) => {
    const linesOut: PurchaseInvoiceLine[] = values.lines.map((l, idx) => ({
      id: existing?.lines?.[idx]?.id ?? `PIL-${Date.now()}-${idx}`,
      itemId: l.itemId,
      quantityTons: Number(l.quantity) || 0,
      discount: Number(l.discount) || 0,
      actualQuantity: Number(l.actualQuantity) || 0,
      purchaseCost: Number(l.purchaseCost) || 0,
      purchaseAmount: Number(l.purchaseAmount) || 0,
    }))

    const linesTotal = linesOut.reduce((sum, l) => sum + l.purchaseAmount, 0)
    const additionalTotalVal =
      (Number(values.loadingCost) || 0) +
      (Number(values.marketCess) || 0) +
      (Number(values.bagsAndSticks) || 0) +
      (Number(values.freight) || 0)

    const invoice: PurchaseInvoice = {
      id: existing?.id ?? `PINV-${Date.now()}`,
      supplierId: values.supplierId,
      branchId: values.branchId,
      invoiceNo: values.invoiceNo,
      invoiceDate: values.invoiceDate,
      lines: linesOut,
      gunnyBags: [],
      grandTotal: linesTotal + additionalTotalVal,
      organizationId: selectedOrganizationId ?? null,
      mode,
      loadingCost: Number(values.loadingCost) || 0,
      marketCess: Number(values.marketCess) || 0,
      bagsAndSticks: Number(values.bagsAndSticks) || 0,
      freight: Number(values.freight) || 0,
    }

    onSave(invoice)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 px-3 py-4 touch-pan-y">
      <div className="w-full max-w-5xl md:rounded-3xl rounded-t-3xl bg-white shadow-2xl md:max-h-[90vh] max-h-[94vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-900">{existing ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}</h2>

            {/* Tonnage / Lessing mode */}
            <div className="flex items-center gap-2 text-[11px]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'tonage'}
                  onChange={() => {
                    setMode('tonage')
                    ;(linesField.fields || []).forEach((_, idx) => recalcLine(idx, 'tonage'))
                  }}
                />
                <span>Tonnage</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === 'lessing'}
                  onChange={() => {
                    setMode('lessing')
                    ;(linesField.fields || []).forEach((_, idx) => recalcLine(idx, 'lessing'))
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

        <form onSubmit={handleSubmit(submit)} className="flex-1 overflow-y-auto px-4 py-4 text-xs">
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
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Branch</label>
              <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('branchId', { required: true })}>
                <option value="">Select branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branch_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice No</label>
              <input className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('invoiceNo', { required: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Date (DD/MM/YYYY)</label>
              <input
                placeholder="DD/MM/YYYY"
                className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                {...register('invoiceDate', {
                  required: true,
                  pattern: { value: /^\d{2}\/\d{2}\/\d{4}$/, message: 'Use DD/MM/YYYY' },
                })}
              />
              {(() => {
                // No formState subscription kept cheap here; validation handled on submit.
                return null
              })()}
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
              <span>Line Items</span>
              <button
                type="button"
                onClick={() =>
                  linesField.append({
                    itemId: '',
                    quantity: '',
                    discount: '',
                    actualQuantity: 0,
                    purchaseCost: '',
                    purchaseAmount: 0,
                  } as any)
                }
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
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
                  {linesField.fields.map((field, index) => (
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
                          className="w-28 rounded-full border border-slate-200 px-2 py-1"
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
                          className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
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
                          className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1"
                          {...register(`lines.${index}.purchaseAmount` as const)}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button type="button" onClick={() => linesField.remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                  {linesField.fields.length === 0 && (
                    <tr className="border-t border-slate-100">
                      <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                        No line items
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-700">Total Lines Amount</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">{totalQuantity}</td>
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2" />
                    <td className="px-3 py-2 font-semibold text-slate-700">{totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
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

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
            <div className="space-y-1 text-[11px] text-slate-500">
              <p>Lines Total: {formatCurrency(totalAmount)}</p>
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
 * @component ViewPurchaseInvoiceModal
 * @description Read-only view of a purchase invoice with a Print button.
 */
const ViewPurchaseInvoiceModal: React.FC<{
  open: boolean
  onClose: () => void
  onPrint: () => void
  invoice: PurchaseInvoice | null
  suppliers: SupplierResponse[]
  items: ItemResponse[]
  branches: Branch[]
}> = ({ open, onClose, onPrint, invoice, suppliers, items, branches }) => {
  if (!open || !invoice) return null

  const supplier = suppliers.find((s) => s.id === invoice.supplierId) ?? mockSuppliers.find((s) => s.id === invoice.supplierId)
  const branch = branches.find((b) => b.id === invoice.branchId) ?? mockBranches.find((b) => b.id === invoice.branchId)
  const linesTotal = invoice.lines.reduce((s, l) => s + Number(l.purchaseAmount ?? 0), 0)
  const charges =
    (Number(invoice.loadingCost) || 0) +
    (Number(invoice.marketCess) || 0) +
    (Number(invoice.bagsAndSticks) || 0) +
    (Number(invoice.freight) || 0)

  return (
    <div className="fixed inset-0 z-40 flex items-end md:items-center justify-center bg-black/40 px-3 py-4">
      <div className="w-full max-w-3xl md:rounded-2xl rounded-t-2xl bg-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Purchase Invoice Details</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <div className="text-[11px] font-medium text-slate-500">Invoice No</div>
              <div className="font-semibold text-slate-900">{invoice.invoiceNo}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Date</div>
              <div className="font-semibold text-slate-900">{toDDMMYYYY(invoice.invoiceDate)}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Supplier</div>
              <div className="font-semibold text-slate-900">{supplier?.name ?? invoice.supplierId}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Branch</div>
              <div className="font-semibold text-slate-900">{branch?.branch_name ?? '-'}</div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500">Quantity Mode</div>
              <div className="font-semibold text-slate-900">{invoice.mode === 'lessing' ? 'Lessing' : 'Tonnage'}</div>
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
                {invoice.lines.map((l, i) => {
                  const item = items.find((it) => it.id === l.itemId) ?? mockItems.find((it) => it.id === l.itemId)
                  return (
                    <tr key={l.id ?? i} className="border-t border-slate-100">
                      <td className="px-3 py-1.5 font-medium text-slate-800">{item?.name ?? l.itemId}</td>
                      <td className="px-3 py-1.5">{l.quantityTons}</td>
                      <td className="px-3 py-1.5">{l.discount ?? 0}</td>
                      <td className="px-3 py-1.5">{l.actualQuantity ?? 0}</td>
                      <td className="px-3 py-1.5">{Number(l.purchaseCost ?? 0).toFixed(2)}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{Number(l.purchaseAmount ?? 0).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t bg-slate-50">
                  <td className="px-3 py-2 font-semibold text-slate-700" colSpan={5}>
                    Lines Total
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-700">{linesTotal.toFixed(2)}</td>
                </tr>
                {charges > 0 && (
                  <tr className="border-t bg-slate-50">
                    <td className="px-3 py-2 font-semibold text-slate-700" colSpan={5}>
                      Additional Charges
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-700">{charges.toFixed(2)}</td>
                  </tr>
                )}
                <tr className="border-t bg-slate-100">
                  <td className="px-3 py-2 font-bold text-slate-800" colSpan={5}>
                    Grand Total
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-slate-800">{Number(invoice.grandTotal ?? 0).toFixed(2)}</td>
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
 * @component PurchaseInvoicePage
 * @description Purchase invoice list and entry page with View / Edit / Print / Delete and org-wise persistence.
 */
const PurchaseInvoicePage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [records, setRecords] = useState<PurchaseInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PurchaseInvoice | null>(null)
  const [viewing, setViewing] = useState<PurchaseInvoice | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<PurchaseInvoice | null>(null)

  // Org-scoped master data + organizations for invoice number generation.
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([])
  const [items, setItems] = useState<ItemResponse[]>([])
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

  const loadBranches = async () => {
    try {
      setBranches(await getBranches())
    } catch {
      setBranches([])
    }
  }

  const loadOrganizations = async () => {
    try {
      setOrganizations(await getOrganizations())
    } catch {
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
   * @description Load purchase invoices from the backend (org-scoped via x-organization-id header).
   */
  const loadRecords = async () => {
    try {
      setRecords((await getPurchaseInvoices()) as unknown as PurchaseInvoice[])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSuppliers()
    loadItems()
    loadBranches()
    loadOrganizations()
    loadRecords()

    const unsubscribe = onScopeChange(() => {
      loadSuppliers()
      loadItems()
      loadBranches()
      loadOrganizations()
      loadRecords()
    })

    return () => unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentOrg = organizations.find((o) => o.id === selectedOrganizationId) ?? null

  /**
   * @description Generate an organization-wise invoice number.
   * Format: `<FirstLetterOfOrgName>I-<NN>` e.g. "Maiprosoft" -> MI-01.
   */
  const generatePINumber = (): string => {
    const orgName = currentOrg?.organization_name ?? ''
    const firstLetter = orgName.match(/[A-Za-z]/)?.[0]
    const prefix = firstLetter ? `${firstLetter.toUpperCase()}I` : 'PI'
    const count = records.filter((r) => r.organizationId === selectedOrganizationId).length
    return `${prefix}-${String(count + 1).padStart(2, '0')}`
  }

  const resolveSupplierName = (id: string): string =>
    suppliers.find((s) => s.id === id)?.name ?? mockSuppliers.find((s) => s.id === id)?.name ?? ''

  const resolveBranchName = (id: string): string =>
    branches.find((b) => b.id === id)?.branch_name ?? mockBranches.find((b) => b.id === id)?.branch_name ?? ''

  // Organization-wise: only show the selected organization's invoices.
  const orgScopedRecords = useMemo(() => {
    if (!selectedOrganizationId) return records
    return records.filter((inv) => inv.organizationId === selectedOrganizationId)
  }, [records, selectedOrganizationId])

  const filtered = useMemo(
    () =>
      orgScopedRecords.filter((inv) => {
        const q = search.toLowerCase()
        const supplier = resolveSupplierName(inv.supplierId)
        const branch = resolveBranchName(inv.branchId)
        return !q || inv.invoiceNo.toLowerCase().includes(q) || supplier.toLowerCase().includes(q) || branch.toLowerCase().includes(q)
      }),
    [orgScopedRecords, search, suppliers, branches]
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
   * @description Save (create/update) a purchase invoice to the backend, org-scoped.
   */
  const handleSave = async (invoice: PurchaseInvoice) => {
    try {
      const payload = {
        invoiceNo: invoice.invoiceNo,
        organizationId: invoice.organizationId ?? null,
        supplierId: invoice.supplierId,
        branchId: invoice.branchId ?? '',
        invoiceDate: invoice.invoiceDate,
        mode: invoice.mode ?? 'tonage',
        loadingCost: invoice.loadingCost ?? 0,
        marketCess: invoice.marketCess ?? 0,
        bagsAndSticks: invoice.bagsAndSticks ?? 0,
        freight: invoice.freight ?? 0,
        grandTotal: invoice.grandTotal,
        lines: invoice.lines.map((l) => ({
          id: l.id,
          itemId: l.itemId,
          quantityTons: l.quantityTons,
          discount: l.discount,
          actualQuantity: l.actualQuantity ?? 0,
          purchaseCost: l.purchaseCost,
          purchaseAmount: l.purchaseAmount,
        })),
      }
      if (invoice.id && records.some((x) => x.id === invoice.id)) {
        await updatePurchaseInvoice(invoice.id, payload)
      } else {
        await createPurchaseInvoice({ ...payload, id: invoice.id })
      }
      await loadRecords()
      toast.success('Purchase invoice saved.')
    } catch {
      toast.error('Failed to save purchase invoice.')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deletePurchaseInvoice(confirmDelete.id)
      setConfirmDelete(null)
      await loadRecords()
      toast.success('Purchase invoice deleted.')
    } catch {
      toast.error('Failed to delete purchase invoice.')
    }
  }

  /**
   * @description Print a purchase invoice in a new window (printable document).
   */
  const printPurchaseInvoice = (row: PurchaseInvoice) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const lineRows = row.lines
      .map((l, i) => {
        const item = items.find((it) => it.id === l.itemId) ?? mockItems.find((it) => it.id === l.itemId)
        return `<tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${item?.name ?? l.itemId}</td>
          <td class="right">${l.quantityTons}</td>
          <td class="right">${l.discount ?? 0}</td>
          <td class="right">${l.actualQuantity ?? 0}</td>
          <td class="right">${Number(l.purchaseCost ?? 0).toFixed(2)}</td>
          <td class="right">${Number(l.purchaseAmount ?? 0).toFixed(2)}</td>
        </tr>`
      })
      .join('')
    const linesTotal = row.lines.reduce((s, l) => s + Number(l.purchaseAmount ?? 0), 0)
    const charges =
      (Number(row.loadingCost) || 0) + (Number(row.marketCess) || 0) + (Number(row.bagsAndSticks) || 0) + (Number(row.freight) || 0)
    const supplier = resolveSupplierName(row.supplierId)
    const branch = resolveBranchName(row.branchId)

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Purchase Invoice ${row.invoiceNo}</title>
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
      <h1>Purchase Invoice</h1>
      <div class="muted">Invoice No: ${row.invoiceNo}</div>
      <div class="muted">Date: ${toDDMMYYYY(row.invoiceDate)}</div>
    </div>
    <div class="muted" style="text-align:right">
      <div>Supplier: <b>${supplier}</b></div>
      <div>Branch: ${branch}</div>
      <div>Mode: ${row.mode === 'lessing' ? 'Lessing' : 'Tonnage'}</div>
    </div>
  </div>
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
        <td colspan="6" class="right">Lines Total</td>
        <td class="right total">${linesTotal.toFixed(2)}</td>
      </tr>
      ${
        charges > 0
          ? `<tr>
        <td colspan="6" class="right">Additional Charges</td>
        <td class="right">${charges.toFixed(2)}</td>
      </tr>`
          : ''
      }
      <tr>
        <td colspan="6" class="right">Grand Total</td>
        <td class="right total">${Number(row.grandTotal ?? 0).toFixed(2)}</td>
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

  const columns: ColumnDef<PurchaseInvoice>[] = [
    { key: 'invoiceNo', label: 'Invoice No', width: 'w-[180px]' },
    {
      key: 'invoiceDate',
      label: 'Invoice Date',
      render: (row) => toDDMMYYYY(row.invoiceDate),
      width: 'w-[120px]',
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      render: (row) => resolveSupplierName(row.supplierId),
      width: 'w-[220px]',
    },
    {
      key: 'branchId',
      label: 'Branch',
      render: (row) => resolveBranchName(row.branchId),
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
            row={row as any}
            onView={(r: any) => setViewing(r)}
            onEdit={(r: any) => openEdit(r)}
            onPrint={(r: any) => printPurchaseInvoice(r)}
            onDelete={(r: any) => setConfirmDelete(r)}
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
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by invoice no, supplier, branch..." />
      <DataGrid<PurchaseInvoice> data={filtered} columns={columns} getRowId={(row) => row.id} loading={loading} />

      <PurchaseInvoiceModal
        open={modalOpen}
        existing={editing}
        suppliers={suppliers}
        items={items}
        branches={branches}
        generatePINumber={generatePINumber}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ViewPurchaseInvoiceModal
        open={!!viewing}
        invoice={viewing}
        suppliers={suppliers}
        items={items}
        branches={branches}
        onClose={() => setViewing(null)}
        onPrint={() => viewing && printPurchaseInvoice(viewing)}
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
