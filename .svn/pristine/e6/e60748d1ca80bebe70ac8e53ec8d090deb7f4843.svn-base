/**
 * @file BagPurchaseModal.tsx
 * @description Modal used to create / edit a Bag Purchase. Header includes Date, Supplier and Remarks.
 *              Details section allows adding multiple lines each selecting a Gunny Bag, Quantity, Rate and
 *              computed Amount. Exposes onSave callback with the composed purchase object.
 */

import React, { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import ResponsiveModal from '../../../components/common/ResponsiveModal'
import { suppliers, gunnyBags, type Supplier } from '../../../mock/db'
import { toast } from 'sonner'

/**
 * @interface BagPurchaseLine
 * @description Single detail line in a Bag Purchase.
 */
export interface BagPurchaseLine {
  id: string
  bagId: string
  bagName?: string
  quantity: number
  rate: number
  amount: number
}

/**
 * @interface BagPurchase
 * @description Bag Purchase header + lines.
 */
export interface BagPurchase {
  id: string
  date: string
  supplierId: string
  supplierName?: string
  remarks?: string
  lines: BagPurchaseLine[]
  totalAmount: number
}

/**
 * @interface BagPurchaseModalProps
 * @description Props for BagPurchaseModal component.
 */
export interface BagPurchaseModalProps {
  open: boolean
  onClose: () => void
  onSave: (purchase: BagPurchase, resetAfter: boolean) => void
  defaultValues?: Partial<BagPurchase>
}

/**
 * @component BagPurchaseModal
 * @description Modal form to add / edit bag purchase with multiple lines.
 */
export const BagPurchaseModal: React.FC<BagPurchaseModalProps> = ({ open, onClose, onSave, defaultValues }) => {
  const { register, control, handleSubmit, reset, watch, setValue, formState } = useForm<FieldValues>({
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      supplierId: '',
      remarks: '',
      lines: [],
      ...defaultValues,
    },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'lines',
  })

  useEffect(() => {
    // initialize with at least one empty row when opening
    if (open) {
      const initial = defaultValues?.lines && defaultValues?.lines.length ? defaultValues.lines : [
        { id: String(Date.now()), bagId: '', bagName: '', quantity: 0, rate: 0, amount: 0 },
      ]
      replace(initial)
      reset({
        date: defaultValues?.date ?? new Date().toISOString().slice(0, 10),
        supplierId: defaultValues?.supplierId ?? '',
        remarks: defaultValues?.remarks ?? '',
        lines: initial,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const watchedLines = watch('lines') as BagPurchaseLine[] | undefined
  const watchedDate = watch('date') as string
  const watchedSupplierId = watch('supplierId') as string

  /**
   * @function computeLineAmount
   * @description Compute amount for a single line and update form value.
   */
  const computeLineAmount = (index: number) => {
    const l = (watch('lines') as BagPurchaseLine[])[index]
    const qty = Number(l?.quantity || 0)
    const rate = Number(l?.rate || 0)
    const amt = qty * rate
    setValue(`lines.${index}.amount`, amt, { shouldValidate: true, shouldDirty: true })
  }

  useEffect(() => {
    // recompute all line amounts when lines change
    (watchedLines || []).forEach((_, i) => computeLineAmount(i))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch('lines')])

  const modalTotal = useMemo(() => {
    return (watchedLines || []).reduce((s, r) => s + Number(r?.amount || 0), 0)
  }, [watchedLines])

  /**
   * @function addLine
   * @description Append a new empty detail line.
   */
  const addLine = () => {
    append({ id: String(Date.now()) + Math.random().toString(36).slice(2, 8), bagId: '', bagName: '', quantity: 0, rate: 0, amount: 0 })
  }

  /**
   * @function handleBagSelect
   * @description When bag is selected, populate rate from gunny master.
   */
  const handleBagSelect = (index: number, bagId: string) => {
    const bag = gunnyBags.find((b) => b.id === bagId)
    if (bag) {
      setValue(`lines.${index}.rate`, bag.defaultRate ?? 0, { shouldDirty: true })
      setValue(`lines.${index}.bagName`, (bag as any).code ?? (bag as any).id ?? '', { shouldDirty: true })
      // compute amount after setting rate
      setTimeout(() => computeLineAmount(index), 0)
    }
  }

  /**
   * @function submit
   * @description Validates and emits the composed BagPurchase object.
   */
  const submit = (values: FieldValues, resetAfter = false) => {
    const supplier = suppliers.find((s) => s.id === values.supplierId) as Supplier | undefined
    if (!values.supplierId) {
      toast.error('Please choose a supplier.')
      return
    }
    const lines: BagPurchaseLine[] = (values.lines || [])
      .map((ln: any) => {
        const bag = gunnyBags.find((b) => b.id === ln.bagId)
        const qty = Number(ln.quantity || 0)
        if (!ln.bagId || qty <= 0) return null
        return {
          id: ln.id ?? String(Date.now()) + Math.random().toString(36).slice(2, 8),
          bagId: ln.bagId,
          bagName: bag ? (bag as any).code ?? (bag as any).id : '',
          quantity: qty,
          rate: Number(ln.rate || 0),
          amount: Number((qty * Number(ln.rate || 0)) || 0),
        } as BagPurchaseLine
      })
      .filter(Boolean) as BagPurchaseLine[]

    if (lines.length === 0) {
      toast.error('Add at least one line with a bag and positive quantity.')
      return
    }

    const total = lines.reduce((s, l) => s + l.amount, 0)
    const purchase: BagPurchase = {
      id: `BP-${Date.now()}`,
      date: values.date ?? new Date().toISOString().slice(0, 10),
      supplierId: values.supplierId,
      supplierName: supplier?.name ?? '',
      remarks: values.remarks ?? '',
      lines,
      totalAmount: total,
    }
    onSave(purchase, resetAfter)
    if (resetAfter) {
      // reset to a fresh form for new entry
      reset({
        date: new Date().toISOString().slice(0, 10),
        supplierId: '',
        remarks: '',
        lines: [{ id: String(Date.now()), bagId: '', bagName: '', quantity: 0, rate: 0, amount: 0 }],
      })
    }
  }

  if (!open) return null

  return (
    <ResponsiveModal open={open} onClose={onClose} title="Bag Purchase">
      <form
        onSubmit={handleSubmit((vals) => submit(vals, false))}
        className="space-y-3 text-xs"
      >
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700">Date</label>
            <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('date', { required: true })} />
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700">Supplier</label>
            <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-[13px]" {...register('supplierId', { required: true })} defaultValue={defaultValues?.supplierId ?? ''}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
            <input type="text" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('remarks')} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 overflow-x-auto">
          <table className="min-w-full text-[12px]">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Bag</th>
                <th className="px-3 py-2 text-left w-28">Qty</th>
                <th className="px-3 py-2 text-left w-28">Rate</th>
                <th className="px-3 py-2 text-left w-36">Amount</th>
                <th className="px-3 py-2 text-right w-28">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, idx) => {
                const line = (watchedLines && watchedLines[idx]) || {}
                return (
                  <tr key={f.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded-full border border-slate-200 px-2 py-1 text-[13px]"
                        {...register(`lines.${idx}.bagId` as const)}
                        defaultValue={line?.bagId ?? ''}
                        onChange={(e) => handleBagSelect(idx, e.target.value)}
                      >
                        <option value="">Select bag</option>
                        {gunnyBags.map((b) => (
                          <option key={b.id} value={b.id}>
                            {(b as any).code ?? b.id} - {b.bharthi} bharthi
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        className="w-20 rounded-full border border-slate-200 px-2 py-1"
                        {...register(`lines.${idx}.quantity` as const, { valueAsNumber: true })}
                        defaultValue={line?.quantity ?? 0}
                        onBlur={() => computeLineAmount(idx)}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-24 rounded-full border border-slate-200 px-2 py-1"
                        {...register(`lines.${idx}.rate` as const, { valueAsNumber: true })}
                        defaultValue={line?.rate ?? 0}
                        onBlur={() => computeLineAmount(idx)}
                      />
                    </td>

                    <td className="px-3 py-2">
                      <div className="w-28 rounded-full border border-slate-200 px-2 py-1 bg-slate-50 text-right">
                        {Number(line?.amount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </div>
                    </td>

                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => remove(idx)} className="rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] text-rose-700 hover:bg-rose-100">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="text-[12px] text-slate-600">
            <div>Lines: {(watchedLines || []).length}</div>
            <div className="mt-1 font-medium">Total: ₹ {modalTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={addLine} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100">
              Add Line
            </button>

            <button type="button" onClick={handleSubmit((vals) => submit(vals, true))} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100">
              Save & New
            </button>

            <button type="submit" className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
              Save
            </button>

            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Close
            </button>
          </div>
        </div>
      </form>
    </ResponsiveModal>
  )
}

export default BagPurchaseModal