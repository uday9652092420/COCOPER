/**
 * @file DirectSalesPage.tsx
 * @description Direct sales list and entry page implementing Red-customer receipt rule.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import {
  directSales as dbDirectSales,
  customers as mockCustomers,
  type DirectSales,
  type DirectSalesLine,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import RowActions from '../../components/common/RowActions'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatAmount, formatCurrency, formatDate } from '../../utils/format'
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import { getItems, type ItemResponse } from '../../services/itemservices/item.service'
import { getSalesOrders, type SalesOrderDTO } from '../../services/salesorderservices/salesOrder.service'
import { getGunnyBags, type GunnyBagResponse } from '../../services/gunnybagservices/gunnybag.service'
import { approveDirectSale, createDirectSale, deleteDirectSale, getDirectSales } from '../../services/directsalesservices/directSale.service'
import { getCurrentOrganization } from '../../services/organizationservices/organization.service'
import { useAuthStore } from '../../store/authStore'
import { onScopeChange } from '../../utils/scopeEvents'

const todayDDMMYYYY = (): string => {
  const date = new Date()
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

/**
 * @interface DirectSalesFormValues
 * @description Form values used for direct sales modal.
 */
interface DirectSalesFormValues extends FieldValues {
  directSaleNo: string
  customerId: string
  branchId: string
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
    bagBharthi?: string
    bharthiTypeId?: string
    quantity: number
    rate: number
    amount: number
  }[]
  loadingCharges: number
}

interface DirectSalesCharges {
  gunnyBags: number
  transportation: number
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
  onSave: (invoice: DirectSales, requiresReceipt: boolean) => Promise<void>
  onApprove?: (invoice: DirectSales) => Promise<void> | void
  onPrint?: (invoice: DirectSales) => void
  existing?: DirectSales | null
  viewOnly?: boolean
  customers: CustomerResponse[]
  branches: Branch[]
  items: ItemResponse[]
  salesOrders: SalesOrderDTO[]
  gunnyBags: GunnyBagResponse[]
  generateDirectSaleNo: () => string
}> = ({ open, onClose, onSave, onApprove, onPrint, existing, viewOnly = false, customers, branches, items, salesOrders, gunnyBags, generateDirectSaleNo }) => {
  const {
    register,
    control,
    watch,
    getValues,
    setValue,
    handleSubmit,
    reset,
  } = useForm<DirectSalesFormValues>({
    defaultValues:
      existing ??
      ({
        directSaleNo: generateDirectSaleNo(),
        customerId: '',
        branchId: '',
        salesOrderNo: '',
        invoiceDate: todayDDMMYYYY(),
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
  const customerId = watch('customerId') ?? ''
  const selectedSalesOrderNo = watch('salesOrderNo') ?? ''
  const isApproved = !!existing?.approved || viewOnly
  const isReadOnly = viewOnly || isApproved
  const availableSalesOrders = salesOrders.filter(
    (order) =>
      Boolean(order.sourcePOId) &&
      order.salesInvoiceStatus !== true &&
      Boolean(customerId) &&
      order.customerId === customerId
  )

  /**
   * @description Mode for actual quantity calculation. 'tonage' => (q/(1000+discount))*1000, 'lessing' => q-discount
   */
  const [mode, setMode] = useState<'tonage' | 'lessing'>('tonage')

  useEffect(() => {
    // reset when modal opens or existing changes
    reset(
      existing
        ? {
            directSaleNo: existing.directSaleNo ?? generateDirectSaleNo(),
            customerId: existing.customerId,
            branchId: existing.branchId ?? '',
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
            gunnyBags: existing.gunnyBags?.length
              ? existing.gunnyBags.map((bag) => ({
                  bagTypeId: bag.bagTypeId ?? '',
                  bagBharthi: bag.bagBharthi ?? '',
                  bharthiTypeId: bag.bharthiTypeId ?? '',
                  quantity: Number(bag.quantity ?? 0),
                  rate: Number(bag.rate ?? 0),
                  amount: Number(bag.amount ?? 0),
                }))
              : [{ bagTypeId: '', bagBharthi: '', quantity: 0, rate: 0, amount: 0 }],
            loadingCharges: Number(existing.charges?.loadingCharges ?? 0),
          }
        : {
            directSaleNo: generateDirectSaleNo(),
            customerId: '',
            branchId: '',
            salesOrderNo: '',
            invoiceDate: todayDDMMYYYY(),
            lines: [{ itemId: '', quantity: 0, discount: 0, actualQuantity: 0, salesPrice: 0, salesAmount: 0 }],
            gunnyBags: [{ bagTypeId: '', bagBharthi: '', quantity: 0, rate: 0, amount: 0 }],
            loadingCharges: 0,
          }
    )
    setMode(existing?.mode === 'lessing' ? 'lessing' : 'tonage')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing, open])

  const invoiceDatePickerRef = useRef<HTMLInputElement>(null)
  const applySalesOrder = (salesOrderNo: string) => {
    const order = salesOrders.find((candidate) => candidate.soNumber === salesOrderNo)
    setValue('salesOrderNo', salesOrderNo)
    if (!order) return
    setValue('customerId', order.customerId)
    setMode(order.mode === 'lessing' ? 'lessing' : 'tonage')
    setValue('invoiceDate', order.date ? order.date.split('-').reverse().join('/') : todayDDMMYYYY())
    linesField.replace(order.lines.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantity,
      discount: line.discount,
      actualQuantity: line.actualQuantity,
      salesPrice: line.saleCost,
      salesAmount: line.saleAmount,
    })))
  }

  const handleCustomerChange = (nextCustomerId: string) => {
    if (!selectedSalesOrderNo) return
    const selectedOrder = salesOrders.find((order) => order.soNumber === selectedSalesOrderNo)
    if (selectedOrder && selectedOrder.customerId !== nextCustomerId) {
      setValue('salesOrderNo', '')
    }
  }

  /**
   * @function recalcLine
   * @description Recalculate actualQuantity and salesAmount for a given line index.
   *
   * Formula:
   * - Tonage:  actualQuantity = (quantity / (1000 + discount)) * 1000
   * - Lessing: actualQuantity = (quantity - discount)
   * SalesAmount = actualQuantity * salesPrice
   */
  const recalcLine = (index: number, modeOverride: 'tonage' | 'lessing' = mode) => {
    const line = (watch('lines') ?? [])[index]
    if (!line) return
    const quantity = Number(line.quantity) || 0
    const discount = Number(line.discount) || 0

    let actualQuantity = 0
    if (modeOverride === 'tonage') {
      const denom = 1000 + discount
      const safeDenom = denom === 0 ? 1 : denom
      actualQuantity = (quantity * 1000) / safeDenom
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
  const recalcGunny = (index: number, useDefaultRate = false) => {
    const row = (getValues('gunnyBags') ?? [])[index]
    if (!row) return
    const bag = gunnyBags.find((b) => b.id === row.bagTypeId)
    const rate = useDefaultRate && bag ? Number(bag.rate_per_bag) : Number(row.rate || 0)
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
      actualQuantity: Number(l.actualQuantity),
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
      directSaleNo: values.salesOrderNo ? undefined : values.directSaleNo,
      branchId: values.branchId,
      invoiceDate: values.invoiceDate,
      salesOrderNo: values.salesOrderNo,
      lines: linesOut,
      mode,
      gunnyBags: values.gunnyBags.map((g) => ({
        bagTypeId: g.bagTypeId,
        bagBharthi: g.bagBharthi ?? '',
        bharthiTypeId: g.bharthiTypeId ?? '',
        quantity: Number(g.quantity || 0),
        rate: Number(g.rate || 0),
        amount: Number(g.amount || 0),
      })),
      charges: {
        gunnyBags: chargesOut.gunnyBags,
        transportation: chargesOut.transportation,
        loadingCharges: chargesOut.loadingCharges,
      },
      invoiceTotal,
    }

    const requiresReceipt = customer?.type === 'Red'
    void onSave(invoice, requiresReceipt).then(onClose)
  }

  if (!open) return null

  const lineTotal = lines?.reduce((sum, l) => sum + Number(l.salesAmount || 0), 0) ?? 0
  const calculatedGunnyTotal = gunny?.reduce((sum, g) => sum + Number(g.amount || 0), 0) ?? 0
  const gunnyTotal = calculatedGunnyTotal || Number(existing?.charges?.gunnyBags ?? 0)
  const gunnyQuantityTotal = gunny?.reduce((sum, g) => sum + Number(g.quantity || 0), 0) ?? 0
  const calculatedInvoiceTotal = lineTotal + gunnyTotal + Number(loadingCharges || 0)
  const invoiceTotal = existing ? Number(existing.invoiceTotal ?? calculatedInvoiceTotal) : calculatedInvoiceTotal
  const getItemName = (itemId: string) => items.find((it) => it.id === itemId)?.name ?? (itemId || 'Select item')

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-slate-900">{existing ? 'Edit Direct Sales' : 'New Direct Sales'}</h2>

          </div>

          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid max-h-[80vh] grid-rows-[auto,1fr,auto] gap-3 overflow-y-auto px-5 py-4 text-xs">
          <div className="grid gap-3 md:grid-cols-5">
            {!selectedSalesOrderNo && <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Direct Sale No</label>
              <input readOnly className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs" {...register('directSaleNo', { required: !selectedSalesOrderNo })} />
            </div>}
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice Date</label>
              <div className="relative">
                <input placeholder="DD/MM/YYYY" readOnly={isReadOnly} className="w-full rounded-full border border-slate-200 px-3 py-1.5 pr-10 text-xs disabled:bg-slate-100" {...register('invoiceDate', { required: true })} />
                <input ref={invoiceDatePickerRef} type="date" className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 cursor-pointer opacity-0" onChange={(event) => setValue('invoiceDate', event.target.value.split('-').reverse().join('/'))} />
                <button type="button" onClick={() => invoiceDatePickerRef.current?.showPicker?.()} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600" aria-label="Open invoice date picker">&#128197;</button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Customer</label>
              <select
                disabled={isReadOnly}
                className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:bg-slate-100"
                {...register('customerId', {
                  required: true,
                  onChange: (event) => {
                    const nextCustomerId = event.target.value
                    setValue('customerId', nextCustomerId)
                    handleCustomerChange(nextCustomerId)
                  },
                })}
              >
                <option value="">Select customer</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Sales Order No</label>
              <select
                className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:bg-slate-100 disabled:text-slate-400"
                disabled={!customerId || isReadOnly}
                {...register('salesOrderNo', {
                  onChange: (event) => {
                    const value = event.target.value
                    if (!value) {
                      setValue('salesOrderNo', '')
                      return
                    }
                    applySalesOrder(value)
                  },
                })}
              >
                <option value="">{customerId ? 'Select sales order' : 'Select customer first'}</option>
                {availableSalesOrders.map((order) => (
                  <option key={order.id} value={order.soNumber}>
                    {order.soNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Branch</label>
              <select disabled={isReadOnly} className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:bg-slate-100" {...register('branchId', { required: true })}>
                <option value="">Select branch</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.branch_name}</option>)}
              </select>
            </div>
          </div>

          {!selectedSalesOrderNo && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-[11px]">
            <span className="font-semibold text-slate-700">Quantity Mode</span>
            <label className="inline-flex items-center gap-2"><input type="radio" name="ds-mode" disabled={isReadOnly} checked={mode === 'tonage'} onChange={() => { if (isReadOnly) return; setMode('tonage'); linesField.fields.forEach((_, idx) => recalcLine(idx, 'tonage')) }} /><span>Tonnage</span></label>
            <label className="inline-flex items-center gap-2"><input type="radio" name="ds-mode" disabled={isReadOnly} checked={mode === 'lessing'} onChange={() => { if (isReadOnly) return; setMode('lessing'); linesField.fields.forEach((_, idx) => recalcLine(idx, 'lessing')) }} /><span>Lessing</span></label>
          </div>}

          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-medium text-slate-700">Sales Details</p>
              {!selectedSalesOrderNo && !isReadOnly && <button
                type="button"
                onClick={() => linesField.append({ itemId: '', quantity: 0, discount: 0, actualQuantity: 0, salesPrice: 0, salesAmount: 0 })}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
              >
                Add Line
              </button>}
            </div>
            <div className="max-h-[28vh] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Item</th>
                    <th className="px-3 py-2">{mode === 'tonage' ? 'Quantity (Tons)' : 'Quantity (Pieces)'}</th>
                    <th className="px-3 py-2">{mode === 'tonage' ? 'Discount (Kgs)' : 'Discount (Pieces)'}</th>
                    <th className="px-3 py-2">Actual Quantity</th>
                    <th className="px-3 py-2">Sales Price</th>
                    <th className="px-3 py-2">Sales Amount</th>
                    {!selectedSalesOrderNo && <th className="px-3 py-2 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {linesField.fields.map((field, index) => (
                    <tr key={field.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        {Boolean(selectedSalesOrderNo) || isReadOnly ? (
                          <div className="w-full rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700">
                            {getItemName(String(lines[index]?.itemId ?? ''))}
                          </div>
                        ) : (
                          <select className="w-full rounded-full border border-slate-200 px-2 py-1" {...register(`lines.${index}.itemId` as const, { required: true })}>
                            <option value="">Select item</option>
                            {items.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          disabled={Boolean(selectedSalesOrderNo) || isApproved}
                          className="w-24 rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                          {...register(`lines.${index}.quantity` as const, {
                            valueAsNumber: true,
                            onChange: () => recalcLine(index),
                          })}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          disabled={Boolean(selectedSalesOrderNo) || isApproved}
                          className="w-20 rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                          {...register(`lines.${index}.discount` as const, {
                            valueAsNumber: true,
                            onChange: () => recalcLine(index),
                          })}
                        />
                      </td>

                      {/* Actual Quantity */}
                      <td className="px-3 py-1.5">
                        <div className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          {Math.round(Number(lines[index]?.actualQuantity ?? 0))}
                        </div>
                        <input type="hidden" {...register(`lines.${index}.actualQuantity` as const, { valueAsNumber: true })} />
                      </td>

                      {/* Sales Price editable */}
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="any"
                          disabled={Boolean(selectedSalesOrderNo) || isApproved}
                          className="w-24 rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                          {...register(`lines.${index}.salesPrice` as const, {
                            valueAsNumber: true,
                            onChange: (e) => onSalesPriceChange(index, Number(e.target.value)),
                          })}
                        />
                      </td>

                      <td className="px-3 py-1.5">
                        <div className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                          {formatAmount(Number(lines[index]?.salesAmount ?? 0))}
                        </div>
                        <input type="hidden" {...register(`lines.${index}.salesAmount` as const, { valueAsNumber: true })} />
                      </td>
                      {!selectedSalesOrderNo && !isReadOnly && <td className="px-3 py-1.5 text-right">
                        <button type="button" onClick={() => linesField.remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                          Remove
                        </button>
                      </td>}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-slate-50">
                    <td colSpan={selectedSalesOrderNo ? 5 : 5} className="px-3 py-2 font-semibold text-slate-700">Total Sales Line Amount</td>
                    <td className="px-3 py-2 font-semibold text-slate-700">{formatAmount(lineTotal)}</td>
                    {!selectedSalesOrderNo && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Charges Section */}
          <div className="mt-4 space-y-2">
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-[11px] font-medium text-slate-700">Gunny Bags</label>
                  {!isReadOnly && <button
                    type="button"
                    onClick={() => gunnyField.append({ bagTypeId: '', bagBharthi: '', quantity: 0, rate: 0, amount: 0 })}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    Add Bag
                  </button>}
                </div>

                <div className="max-h-[22vh] overflow-y-auto overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="min-w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Bag Type</th>
                        <th className="px-3 py-2">Bag Bharthi</th>
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
                              disabled={isApproved}
                              className="w-full rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                              {...register(`gunnyBags.${index}.bagTypeId` as const, {
                                onChange: () => recalcGunny(index, true),
                              })}
                            >
                              <option value="">Select bag</option>
                              {gunnyBags.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name} ({b.size})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="text"
                              disabled={isApproved}
                              className="w-28 rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                              placeholder="Bag Bharthi"
                              {...register(`gunnyBags.${index}.bagBharthi` as const)}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              disabled={isApproved}
                              className="w-24 rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                              {...register(`gunnyBags.${index}.quantity` as const, {
                                valueAsNumber: true,
                                onChange: () => recalcGunny(index),
                              })}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <input
                              type="number"
                              step="any"
                              disabled={isApproved}
                              className="w-28 rounded-full border border-slate-200 px-2 py-1 disabled:bg-slate-100"
                              {...register(`gunnyBags.${index}.rate` as const, {
                                valueAsNumber: true,
                                onChange: () => recalcGunny(index),
                              })}
                            />
                          </td>
                          <td className="px-3 py-1.5">
                            <div className="w-28 rounded-full border border-slate-200 bg-slate-50 px-2 py-1">
                              {formatAmount(Number(gunny[index]?.amount ?? 0))}
                            </div>
                            <input type="hidden" {...register(`gunnyBags.${index}.amount` as const, { valueAsNumber: true })} />
                          </td>
                          {!isReadOnly && <td className="px-3 py-1.5 text-right">
                            <button type="button" onClick={() => gunnyField.remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                              Remove
                            </button>
                          </td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-700"> </td>
                        <td className="px-3 py-2 font-semibold text-slate-700">Total Gunnybags Quantity = {gunnyQuantityTotal}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700"> </td>
                        <td className="px-3 py-2 font-semibold text-slate-700"> </td>
                        <td className="px-3 py-2 font-semibold text-slate-700">Total Lines Amount = {formatAmount(gunnyTotal)}</td>
                        <td className="px-3 py-2 font-semibold text-slate-700"> </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div className="max-w-xs">
                <p className="mb-1 text-[11px] font-medium text-slate-700">Additional Charges</p>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Loading Charges</label>
                <input
                  type="number"
                  step="any"
                  disabled={isReadOnly}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs disabled:bg-slate-100"
                  {...register('loadingCharges', { valueAsNumber: true })}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>Total Sales Lines Amount: {formatAmount(lineTotal)}</p>
              <p>Total Gunny Bags Line Amount: {formatAmount(gunnyTotal)}</p>
              <p>Charges Total: {formatAmount(Number(loadingCharges || 0))}</p>
              <p className="font-semibold text-slate-800">Invoice Total: {formatAmount(invoiceTotal)}</p>
            </div>
            {viewOnly ? (
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => onPrint?.(existing!)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Print
                </button>
                <button type="button" onClick={onClose} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  Close
                </button>
              </div>
            ) : existing ? (
              <div className="flex items-center gap-2">
                {!existing.approved && (
                  <button type="button" onClick={() => onApprove?.(existing)} className="rounded-full bg-[#0EA5A4] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0b8b89]">
                    Approve
                  </button>
                )}
                <button type="submit" disabled={existing.approved} className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427] disabled:cursor-not-allowed disabled:bg-slate-300">
                  {existing.approved ? 'Approved' : 'Update'}
                </button>
              </div>
            ) : (
              <button type="submit" className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
                Save
              </button>
            )}
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
  const { selectedOrganizationId } = useAuthStore()
  const [records, setRecords] = useState<DirectSales[]>([])
  const [organizationName, setOrganizationName] = useState('')
  const [masterCustomers, setMasterCustomers] = useState<CustomerResponse[]>([])
  const [masterBranches, setMasterBranches] = useState<Branch[]>([])
  const [masterItems, setMasterItems] = useState<ItemResponse[]>([])
  const [convertedSalesOrders, setConvertedSalesOrders] = useState<SalesOrderDTO[]>([])
  const [masterGunnyBags, setMasterGunnyBags] = useState<GunnyBagResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<DirectSales | null>(null)
  const [viewing, setViewing] = useState<DirectSales | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DirectSales | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [receiptAmount, setReceiptAmount] = useState(0)

  const loadRecords = async () => {
    try {
      setLoading(true)
      const directSales = await getDirectSales()
      setRecords(directSales as DirectSales[])
    } catch {
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getCustomers().then(setMasterCustomers).catch(() => setMasterCustomers([]))
    getBranches().then(setMasterBranches).catch(() => setMasterBranches([]))
    getItems().then(setMasterItems).catch(() => setMasterItems([]))
    getSalesOrders().then(setConvertedSalesOrders).catch(() => setConvertedSalesOrders([]))
    getGunnyBags(undefined, false).then(setMasterGunnyBags).catch(() => setMasterGunnyBags([]))
    getCurrentOrganization(selectedOrganizationId).then((organization) => setOrganizationName(organization.organization_name)).catch(() => setOrganizationName(''))
    loadRecords()

    const unsubscribe = onScopeChange(() => {
      getCurrentOrganization(selectedOrganizationId).then((organization) => setOrganizationName(organization.organization_name)).catch(() => setOrganizationName(''))
      loadRecords()
    })

    return () => unsubscribe()
  }, [selectedOrganizationId])

  const generateDirectSaleNo = (): string => {
    const next = records.length + 1
    const firstLetter = organizationName.match(/[A-Za-z]/)?.[0]?.toUpperCase() ?? 'M'
    return `${firstLetter}DSO-${String(next).padStart(2, '0')}`
  }

  const orgScopedRecords = useMemo(() => {
    if (!selectedOrganizationId) return records
    return records.filter((inv) => inv.organizationId === selectedOrganizationId)
  }, [records, selectedOrganizationId])

  const filtered = useMemo(
    () =>
      orgScopedRecords.filter((inv) => {
        const q = search.toLowerCase()
        const customer = masterCustomers.find((c) => c.id === inv.customerId) ?? mockCustomers.find((c) => c.id === inv.customerId)
        const branch = masterBranches.find((b) => b.id === inv.branchId)
        return !q || customer?.name.toLowerCase().includes(q) || branch?.branch_name.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q)
      }),
    [orgScopedRecords, search, masterCustomers, masterBranches]
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
      render: (row) => masterCustomers.find((c) => c.id === row.customerId)?.name ?? mockCustomers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    {
      key: 'customerType',
      label: 'Type',
    },
    {
      key: 'branchId',
      label: 'Branch',
      render: (row) => masterBranches.find((b) => b.id === row.branchId)?.branch_name ?? '',
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
            onView={(r: any) => {
              setViewing(r)
              setEditing(null)
              setModalOpen(true)
            }}
            onEdit={row.approved ? undefined : ((r: any) => {
              setEditing(r)
              setViewing(null)
              setModalOpen(true)
            })}
            onPrint={(r: any) => printDirectSale(r)}
            onDelete={row.approved ? undefined : ((r: any) => setConfirmDelete(r))}
            onApprove={row.approved ? undefined : ((r: any) => { void handleApprove(r) })}
          />
        </div>
      ),
    },
  ]

  const openAdd = () => {
    setEditing(null)
    setViewing(null)
    setModalOpen(true)
  }

  const handleSave = async (invoice: DirectSales, requiresReceipt: boolean) => {
    try {
      if (!editing) {
        invoice = await createDirectSale(invoice)
      } else {
        invoice = { ...editing, ...invoice, id: editing.id }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save direct sale')
      return
    }
    setRecords((prev) => {
      const exists = prev.some((x) => x.id === invoice.id)
      if (exists) {
        return prev.map((x) => (x.id === invoice.id ? invoice : x))
      }
      return [invoice, ...prev]
    })
    toast.success(editing ? 'Direct sales updated.' : 'Direct sales saved.')

    if (requiresReceipt) {
      setReceiptAmount(invoice.invoiceTotal)
      setReceiptOpen(true)
    } else {
      setReceiptOpen(false)
    }
  }

  const handleApprove = async (row: DirectSales) => {
    try {
      await approveDirectSale(row.id)
      setRecords((prev) => prev.map((item) => item.id === row.id ? { ...item, approved: true } : item))
      toast.success('Direct sales approved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve direct sale')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteDirectSale(confirmDelete.id)
      setRecords((prev) => prev.filter((x) => x.id !== confirmDelete.id))
      toast.success('Direct sales deleted.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete direct sale')
      return
    } finally {
      setConfirmDelete(null)
    }
  }

  const printDirectSale = (row: DirectSales) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }

    const customer = masterCustomers.find((c) => c.id === row.customerId) ?? mockCustomers.find((c) => c.id === row.customerId)
    const branch = masterBranches.find((b) => b.id === row.branchId)?.branch_name ?? '-'
    const customerExtra = customer as (Partial<CustomerResponse> & { city?: string; pincode?: string }) | undefined
    const customerAddress = [
      customer?.address,
      customerExtra?.city,
      customer?.state,
      customerExtra?.pincode,
    ]
      .filter(Boolean)
      .join(', ')
    const itemRows = row.lines.map((line, index) => {
      const item = masterItems.find((it) => it.id === line.itemId)
      const amount = Number(line.salesAmount ?? 0)
      return `<tr>
        <td style="text-align:center">${index + 1}</td>
        <td>${item?.name ?? line.itemId}</td>
        <td style="text-align:right">${Number(line.quantity ?? 0)}</td>
        <td style="text-align:right">${Number(line.discount ?? 0)}</td>
        <td style="text-align:right">${Number(line.actualQuantity ?? 0).toFixed(2)}</td>
        <td style="text-align:right">${Number(line.salesPrice ?? 0).toFixed(2)}</td>
        <td style="text-align:right">${formatAmount(amount)}</td>
      </tr>`
    }).join('')

    const lineTotal = row.lines.reduce((sum, line) => sum + Number(line.salesAmount ?? 0), 0)
    const gunnyTotal = Number(row.charges?.gunnyBags ?? 0)
    const otherCharges = Number(row.charges?.loadingCharges ?? 0) + Number(row.charges?.transportation ?? 0)
    const total = lineTotal + gunnyTotal + otherCharges

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Sales Invoice ${row.directSaleNo ?? row.id}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 32px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .muted { color: #555; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; }
    .info { font-size: 12px; line-height: 1.8; }
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
      <h1>Sales Invoice</h1>
      <div class="muted">Invoice No: ${row.directSaleNo ?? row.id}</div>
      <div class="muted">Date: ${formatDate(row.invoiceDate)}</div>
    </div>
    <div class="info muted" style="text-align:right">
      <div>Customer: <b>${customer?.name ?? '-'}</b></div>
      <div>Address: ${customerAddress || '-'}</div>
      <div>Branch: ${branch}</div>
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
        <th class="right">Sales Price</th>
        <th class="right">Sales Amount</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="6" class="right">Total Sales Lines Amount</td>
        <td class="right total">${formatAmount(lineTotal)}</td>
      </tr>
      <tr>
        <td colspan="6" class="right">Gunny Bags Line Amount</td>
        <td class="right">${formatAmount(gunnyTotal)}</td>
      </tr>
      <tr>
        <td colspan="6" class="right">Other Charges</td>
        <td class="right">${formatAmount(otherCharges)}</td>
      </tr>
      <tr>
        <td colspan="6" class="right">Invoice Total</td>
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
        onPrint={() => {
          if (filtered.length) {
            printDirectSale(filtered[0])
            return
          }
          toast.info('No direct sales to print.')
        }}
        onRefresh={loadRecords}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by customer, branch, direct sale no..." />
      <DataGrid<DirectSales>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
      />

      <DirectSalesModal
        open={modalOpen}
        existing={editing ?? viewing}
        viewOnly={!!viewing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          setViewing(null)
        }}
        onSave={handleSave}
        onApprove={async (invoice) => {
          await handleApprove(invoice)
          setModalOpen(false)
          setEditing(null)
          setViewing(null)
        }}
        onPrint={(invoice) => printDirectSale(invoice)}
        customers={masterCustomers}
        branches={masterBranches}
        items={masterItems}
        salesOrders={convertedSalesOrders}
        gunnyBags={masterGunnyBags}
        generateDirectSaleNo={generateDirectSaleNo}
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