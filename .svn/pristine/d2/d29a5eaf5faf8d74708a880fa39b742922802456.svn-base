/**
 * @file MasterFormModal.tsx
 * @description Generic modal form used by master screens (Add / Edit).
 */

import React, { useEffect } from 'react'
import { useForm, type FieldValues } from 'react-hook-form'
import { X } from 'lucide-react'

/**
 * @description Configuration for a single form field.
 */
export interface FormFieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select'
  required?: boolean
  options?: { label: string; value: string | number }[]
}

/**
 * @description Props for the MasterFormModal generic component.
 */
export interface MasterFormModalProps<TValues extends FieldValues> {
  open: boolean
  title: string
  fields: FormFieldConfig[]
  defaultValues?: Partial<TValues>
  onClose: () => void
  onSave: (values: TValues, resetAfter: boolean) => void
}

/**
 * @component MasterFormModal
 * @description Reusable modal form used by master pages to add / edit records.
 */
export const MasterFormModal = <TValues extends FieldValues>({
  open,
  title,
  fields,
  defaultValues,
  onClose,
  onSave,
}: MasterFormModalProps<TValues>) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TValues>({
    defaultValues: defaultValues as TValues,
  })

  /**
   * @function submit
   * @description Standard save handler that forwards values.
   */
  const submit = (values: TValues) => {
    onSave(values, false)
  }

  /**
   * @function submitAndNew
   * @description Save and reset to add a new record immediately.
   */
  const submitAndNew = (values: TValues) => {
    onSave(values, true)
    reset({})
  }

  useEffect(() => {
    reset(defaultValues as TValues)
  }, [defaultValues, reset])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-slate-500 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(submit)} className="grid max-h-[70vh] grid-rows-[1fr_auto] gap-3 overflow-y-auto px-4 py-4">
          <div className="grid gap-3 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className="text-xs">
                <label className="mb-1 block text-[11px] font-medium text-slate-700">
                  {field.label}
                  {field.required ? <span className="text-rose-500"> *</span> : null}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    {...register(field.name as keyof TValues, { required: field.required })}
                  />
                ) : field.type === 'select' ? (
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    {...register(field.name as keyof TValues, { required: field.required })}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((opt) => (
                      <option key={String(opt.value)} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="w-full rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
                    {...register(field.name as keyof TValues, { required: field.required })}
                  />
                )}

                {errors[field.name as keyof TValues] ? <p className="mt-1 text-[10px] text-rose-500">Required</p> : null}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
            <button type="button" onClick={() => reset(defaultValues as TValues)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
              Reset
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={handleSubmit(submitAndNew)} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                Save &amp; New
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
      </div>
    </div>
  )
}

export default MasterFormModal