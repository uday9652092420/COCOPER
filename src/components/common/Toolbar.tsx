/**
 * @file Toolbar.tsx
 * @description Common toolbar used on master pages (actions + search slot). Accepts multiple
 *              action props used across pages (onAddNew, onExportExcel, onExportPdf, onPrint, onRefresh, onColumnChooser)
 *              while remaining backward compatible with older prop names.
 */

import type React from 'react'
import { Plus } from 'lucide-react'

/**
 * @interface ToolbarProps
 * @description Props used by the Toolbar component.
 */
export interface ToolbarProps {
  title?: string
  /**
   * @description Primary add handler used by older pages.
   */
  onAdd?: () => void
  /**
   * @description Primary add handler used by newer pages (alias of onAdd).
   */
  onAddNew?: () => void
  /**
   * @description Export to Excel handler (optional).
   */
  onExportExcel?: () => void
  /**
   * @description Export to PDF handler (optional).
   */
  onExportPdf?: () => void
  /**
   * @description Print handler (optional).
   */
  onPrint?: () => void
  /**
   * @description Refresh handler (optional).
   */
  onRefresh?: () => void
  /**
   * @description Column chooser handler (optional).
   */
  onColumnChooser?: () => void
  children?: React.ReactNode
}

/**
 * @component Toolbar
 * @description Displays page actions and an optional right-side area for custom controls.
 *              Keeps backward compatibility by supporting both onAdd and onAddNew.
 */
export const Toolbar: React.FC<ToolbarProps> = ({
  title,
  onAdd,
  onAddNew,
  onExportExcel,
  onExportPdf,
  onPrint,
  onRefresh,
  onColumnChooser,
  children,
}) => {
  /**
   * @function handleAdd
   * @description Normalize add handler to support both prop names.
   */
  const handleAdd = () => {
    if (onAddNew) return onAddNew()
    if (onAdd) return onAdd()
    return undefined
  }

  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        {title ? <h2 className="text-sm font-semibold text-slate-900">{title}</h2> : null}
      </div>

      <div className="flex items-center gap-2">
        {/* Optional custom controls slot */}
        {children}

        {/* Small utility buttons */}
        {onColumnChooser ? (
          <button
            type="button"
            onClick={onColumnChooser}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Columns
          </button>
        ) : null}

        {onRefresh ? (
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        ) : null}

        {onExportExcel ? (
          <button
            type="button"
            onClick={onExportExcel}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Excel
          </button>
        ) : null}

        {onExportPdf ? (
          <button
            type="button"
            onClick={onExportPdf}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            PDF
          </button>
        ) : null}

        {onPrint ? (
          <button
            type="button"
            onClick={onPrint}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Print
          </button>
        ) : null}

        {/* Primary Add button (uses onAddNew if provided, falls back to onAdd) */}
        {(onAddNew || onAdd) ? (
          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Add New
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default Toolbar