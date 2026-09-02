/**
 * @file DataGrid.tsx
 * @description Generic, lightweight data grid used across the app. Provides column definitions,
 *              loading state, and common row actions (view / edit / print / delete) with enhanced
 *              visual styling for action buttons. Exports both a default component and named types
 *              to remain compatible with existing imports.
 */

import React from 'react'
import { Check, Eye, Edit2, Trash2, Printer } from 'lucide-react'

/**
 * @interface ColumnDef
 * @description Definition for a single column in the grid.
 */
export interface ColumnDef<T> {
  /** Key to identify the column; also used to access simple values from row objects */
  key: keyof T | string
  /** Header label shown for the column */
  label: string
  /** Optional custom renderer for complex cells */
  render?: ((row: T) => React.ReactNode) | React.ReactNode
  /** Optional width class for column (Tailwind width utility) */
  width?: string
}

/**
 * @description Backwards-compatible Column alias used in many pages.
 */
export type Column<T = any> = ColumnDef<T>

/**
 * @interface DataGridProps
 * @description Props for the DataGrid component.
 */
export interface DataGridProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  /**
   * @description Primary row id accessor used by newer pages.
   */
  getRowId?: (row: T) => string
  /**
   * @description Backwards-compatible row id accessor used by older pages.
   */
  rowKey?: (row: T) => string
  loading?: boolean
  onView?: (row: T) => void
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
  onPrint?: (row: T) => void
  onApprove?: (row: T) => void
  isRowApproved?: (row: T) => boolean
  getRowClassName?: (row: T) => string
}

/**
 * @component DataGrid
 * @description Generic table component with responsive layout and action buttons.
 *              Action buttons are styled to be clear and prominent while remaining compact.
 */
export function DataGrid<T>({
  data,
  columns,
  getRowId,
  rowKey,
  loading = false,
  onView,
  onEdit,
  onDelete,
  onPrint,
  onApprove,
  isRowApproved,
  getRowClassName,
}: DataGridProps<T>) {
  /**
   * @function resolveRowId
   * @description Provide a stable row id resolver supporting both getRowId and legacy rowKey props.
   */
  const resolveRowId = (row: T) => {
    const resolver = getRowId ?? rowKey
    if (typeof resolver === 'function') return resolver(row)
    // Fallback: try common id props
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const candidate = (row as any).id ?? (row as any).ID ?? (row as any).key
    if (candidate != null) return String(candidate)
    // Last resort: JSON snapshot (not ideal but prevents crashes)
    return JSON.stringify(row)
  }

  /**
   * @function renderCell
   * @description Render a cell using either the column renderer or a fallback property lookup.
   *              Safely handles cases where `render` may be provided as a ReactNode (accidental)
   *              or as a function.
   */
  const renderCell = (col: ColumnDef<T>, row: T) => {
    try {
      if (typeof col.render === 'function') {
        return col.render(row)
      }
      if (col.render != null) {
        // If render is provided as a node (not a function), show it directly.
        return col.render as React.ReactNode
      }
      const key = col.key as keyof T
      const val = row[key] as unknown
      return val == null ? '' : String(val)
    } catch (err) {
      // Defensive: render safe fallback to avoid UI crash
      // eslint-disable-next-line no-console
      console.error('DataGrid renderCell error', err)
      return ''
    }
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-3 py-2 text-left font-medium text-slate-600 ${col.width ?? ''}`}
              >
                {col.label}
              </th>
            ))}
            {(onView || onEdit || onApprove || onPrint || onDelete) ? (
              <th className="w-40 px-3 py-2 text-right font-medium text-slate-600">Actions</th>
            ) : null}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length + (onView || onEdit || onApprove || onPrint || onDelete ? 1 : 0)} className="px-4 py-8 text-center text-slate-500">
                Loading...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onView || onEdit || onApprove || onPrint || onDelete ? 1 : 0)} className="px-4 py-8 text-center text-slate-500">
                No records found.
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={resolveRowId(row)} className={`${getRowClassName?.(row) ?? ''} hover:bg-slate-50`}>
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-3 py-3 align-middle text-slate-700">
                    {renderCell(col, row)}
                  </td>
                ))}

                {(onView || onEdit || onApprove || onPrint || onDelete) ? (
                  <td className="px-3 py-3 text-right">
                  <div className="inline-flex items-center gap-2">
                    {onView ? (
                      <button
                        title="View"
                        onClick={() => onView(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    ) : null}

                    {onEdit && !isRowApproved?.(row) ? (
                      <button
                        title="Edit"
                        onClick={() => onEdit(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700 hover:bg-sky-100"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    ) : null}

                    {onApprove && !isRowApproved?.(row) ? (
                      <button
                        title="Approve"
                        onClick={() => onApprove(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    ) : null}

                    {onPrint ? (
                      <button
                        title="Print"
                        onClick={() => onPrint(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    ) : null}

                    {onDelete && !isRowApproved?.(row) ? (
                      <button
                        title="Delete"
                        onClick={() => onDelete(row)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

/**
 * @note Provide a default export for compatibility with files importing DataGrid as default.
 */
export default DataGrid