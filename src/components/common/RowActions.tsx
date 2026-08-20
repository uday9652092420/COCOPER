/**
 * @file RowActions.tsx
 * @description Small reusable row action button group used in tables to present common actions
 *              (view, edit, print, delete, approve, convert). Uses lucide-react icons and
 *              simple Tailwind styles to match the app look-and-feel.
 */

import React from 'react'
import { Eye, Edit, Trash2, Printer, Check, FileText } from 'lucide-react'
import type { PurchaseOrder } from '../../mock/db'

/**
 * @interface RowActionsProps
 * @description Props accepted by RowActions component.
 */
export interface RowActionsProps {
  /** Row object the actions operate on. */
  row: PurchaseOrder
  /** Callback when the row should be viewed. */
  onView?: (row: PurchaseOrder) => void
  /** Callback when the row should be edited. */
  onEdit?: (row: PurchaseOrder) => void
  /** Callback when the row should be printed. */
  onPrint?: (row: PurchaseOrder) => void
  /** Callback when the row should be deleted (usually opens confirm). */
  onDelete?: (row: PurchaseOrder) => void
  /** Callback when the row should be approved. */
  onApprove?: (row: PurchaseOrder) => void
  /** Callback when the row should be converted (eg. PO -> Invoice). */
  onConvert?: (row: PurchaseOrder) => void
}

/**
 * @component RowActions
 * @description Render a compact inline button group for row-level actions.
 */
export const RowActions: React.FC<RowActionsProps> = ({ row, onView, onEdit, onPrint, onDelete, onApprove, onConvert }) => {
  /**
   * @function handle
   * @description Helper to call callbacks safely.
   */
  const handle = (fn?: (r: PurchaseOrder) => void) => {
    if (!fn) return
    fn(row)
  }

  const canApprove = !!onApprove && row.status !== 'Approved'
  const canConvert = !!onConvert && row.status === 'Approved'

  return (
    <div className="inline-flex items-center gap-2">
      {onView ? (
        <button type="button" title="View" onClick={() => handle(onView)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
          <Eye className="h-4 w-4" />
        </button>
      ) : null}

      {onEdit ? (
        <button type="button" title="Edit" onClick={() => handle(onEdit)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
          <Edit className="h-4 w-4" />
        </button>
      ) : null}

      {onPrint ? (
        <button type="button" title="Print" onClick={() => handle(onPrint)} className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50">
          <Printer className="h-4 w-4" />
        </button>
      ) : null}

      {canApprove ? (
        <button type="button" title="Approve" onClick={() => handle(onApprove)} className="rounded-full border border-emerald-200 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100">
          <Check className="h-4 w-4" />
        </button>
      ) : null}

      {canConvert ? (
        <button type="button" title="Convert" onClick={() => handle(onConvert)} className="rounded-full border border-amber-200 bg-amber-50 p-2 text-amber-700 hover:bg-amber-100">
          <FileText className="h-4 w-4" />
        </button>
      ) : null}

      {onDelete ? (
        <button type="button" title="Delete" onClick={() => handle(onDelete)} className="rounded-full border border-rose-100 bg-rose-50 p-2 text-rose-600 hover:bg-rose-100">
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )
}

export default RowActions