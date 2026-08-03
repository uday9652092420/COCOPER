/**
 * @file ConfirmDialog.tsx
 * @description Simple confirm dialog component used across the app.
 */

import type React from 'react'

/**
 * @interface ConfirmDialogProps
 * @description Props for the ConfirmDialog component.
 */
export interface ConfirmDialogProps {
  open: boolean
  title?: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * @component ConfirmDialog
 * @description Modal dialog that requests user confirmation for destructive actions.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Confirm',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="mb-2 text-lg font-semibold text-slate-900">{title}</h3>
        {description ? <p className="mb-4 text-sm text-slate-600">{description}</p> : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-[#B91C1C] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#991B1B]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog