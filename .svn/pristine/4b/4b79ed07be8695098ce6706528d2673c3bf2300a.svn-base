/**
 * @file LabourAttendancePage.tsx
 * @description Labour attendance entry and listing. Main grid lists attendance records showing
 *              Morning OT, Evening OT, Loading Charges and Total Amount. Bulk modal lists all labour
 *              staff from master and allows editing OT values and adding new (non-staff / temporary)
 *              labour names. Record-level Edit modal edits OT breakdown and recomputes totals.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form'
import { toast } from 'sonner'
import { labourAttendances as dbAttendance, type LabourAttendance } from '../../mock/db'
import { labors, type LabourStaff } from '../../mock/labors'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'
import ResponsiveModal from '../../components/common/ResponsiveModal'

/**
 * @interface BulkEntryRow
 * @description Single row values in the bulk modal entry form. Supports either selecting a master
 *              labour (masterId) or entering a temporary name (tempName) when isTemporary is true.
 */
interface BulkEntryRow {
  isTemporary?: boolean
  masterId?: string
  tempName?: string
  morningOt: number
  eveningOt: number
  loadingCharges: number
  otRate: number
}

/**
 * @interface BulkEntryForm
 * @description Form values used in the bulk entry modal.
 */
interface BulkEntryForm {
  attendanceDate: string
  rows: BulkEntryRow[]
}

/**
 * @interface ExtendedAttendance
 * @description Local extension of LabourAttendance to keep per-row OT breakdown for editing/display.
 */
interface ExtendedAttendance extends LabourAttendance {
  morningOt: number
  eveningOt: number
  loadingCharges: number
  otRate: number
}

/**
 * @component LabourAttendancePage
 * @description Page to view labour attendance list and open a bulk modal that lists all labour staff
 *              from the Labour master. The modal allows editing OT values per labour, computing totals
 *              and adding new labour names not present in the master. Grid includes Edit/Delete actions.
 */
const LabourAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<ExtendedAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ExtendedAttendance | null>(null)

  // Edit modal
  const [editing, setEditing] = useState<ExtendedAttendance | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Default OT rate applied for calculation (can be adjusted per row)
  const DEFAULT_OT_RATE = 150

  useEffect(() => {
    const id = setTimeout(() => {
      // Map DB attendance to extended shape with default zeros for breakdown fields
      const prepared = dbAttendance.map((r) => ({
        ...r,
        morningOt: (r as any).morningOt ?? 0,
        eveningOt: (r as any).eveningOt ?? 0,
        loadingCharges: (r as any).loadingCharges ?? 0,
        otRate: (r as any).otRate ?? DEFAULT_OT_RATE,
      })) as ExtendedAttendance[]
      setRecords(prepared)
      setLoading(false)
    }, 300)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const q = search.toLowerCase()
        return !q || r.labourName.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)
      }),
    [records, search]
  )

  const columns: ColumnDef<ExtendedAttendance>[] = [
    {
      key: 'attendanceDate',
      label: 'Date',
      render: (row) => formatDate(row.attendanceDate),
    },
    { key: 'labourName', label: 'Labour Name' },
    { key: 'type', label: 'Type' },
    { key: 'shift', label: 'Shift' },
    { key: 'morningOt', label: 'Morning OT (hrs)', render: (r) => String(r.morningOt) },
    { key: 'eveningOt', label: 'Evening OT (hrs)', render: (r) => String(r.eveningOt) },
    {
      key: 'loadingCharges',
      label: 'Loading Charges',
      render: (r) => formatCurrency(Number(r.loadingCharges || 0)),
    },
    {
      key: 'totalOtAmount',
      label: 'Total Amount',
      render: (r) => formatCurrency(Number(r.totalOtAmount || 0)),
    },
  ]

  /**
   * @function computeRowTotal
   * @description Compute row total = (morningOt + eveningOt) * otRate + loadingCharges
   */
  const computeRowTotal = (r: BulkEntryRow | ExtendedAttendance) => {
    const otHours = Number((r as any).morningOt || 0) + Number((r as any).eveningOt || 0)
    const otRate = Number((r as any).otRate || DEFAULT_OT_RATE)
    const loading = Number((r as any).loadingCharges || 0)
    return otHours * otRate + loading
  }

  const monthlyOtTotal = useMemo(() => records.reduce((sum, r) => sum + Number(r.totalOtAmount || 0), 0), [records])

  /**
   * BULK MODAL FORM: initialize with labour master entries
   */
  const { register, control, handleSubmit, reset, watch } = useForm<BulkEntryForm>({
    defaultValues: {
      attendanceDate: new Date().toISOString().slice(0, 10),
      rows: labors.map((l) => ({
        isTemporary: false,
        masterId: l.id,
        tempName: '',
        morningOt: 0,
        eveningOt: 0,
        loadingCharges: l.loadingAmount || 0,
        otRate: DEFAULT_OT_RATE,
      })),
    },
  })

  const rowsField = useFieldArray({
    control,
    name: 'rows',
  })

  const watchedRows = watch('rows') || []
  const attendanceDate = watch('attendanceDate')

  /**
   * @function openAddBulk
   * @description Prepare and open the bulk modal prefilled with labors from master.
   */
  const openAddBulk = () => {
    reset({
      attendanceDate: new Date().toISOString().slice(0, 10),
      rows: labors.map((l) => ({
        isTemporary: false,
        masterId: l.id,
        tempName: '',
        morningOt: 0,
        eveningOt: 0,
        loadingCharges: l.loadingAmount || 0,
        otRate: DEFAULT_OT_RATE,
      })),
    })
    setModalOpen(true)
  }

  /**
   * @function addNewRow
   * @description Append an empty row allowing adding a name that's not in the master (temporary labour).
   */
  const addNewRow = () => {
    rowsField.append({
      isTemporary: true,
      masterId: undefined,
      tempName: '',
      morningOt: 0,
      eveningOt: 0,
      loadingCharges: 0,
      otRate: DEFAULT_OT_RATE,
    })
  }

  /**
   * @function onSubmitBulk
   * @description Transform bulk rows into LabourAttendance records and add them to the list.
   *              Supports both master-selected rows and temporary (non-staff) rows.
   */
  const onSubmitBulk = (values: BulkEntryForm) => {
    const newRecords: ExtendedAttendance[] = (values.rows || [])
      .map((row) => {
        // resolve labour name: prefer tempName if marked temporary, else use selected master
        let name = ''
        if (row.isTemporary) {
          name = (row.tempName || '').trim()
        } else {
          const master = labors.find((l) => l.id === row.masterId)
          name = master ? master.labourName : (row.tempName || '').trim()
        }
        if (!name) return null

        const morning = Number(row.morningOt || 0)
        const evening = Number(row.eveningOt || 0)
        const otHours = morning + evening
        const otRate = Number(row.otRate || DEFAULT_OT_RATE)
        const loading = Number(row.loadingCharges || 0)
        const totalOtAmount = otHours * otRate + loading
        const record: ExtendedAttendance = {
          id: `LABATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          labourName: name,
          type: 'Regular',
          attendanceDate: values.attendanceDate,
          shift: otHours > 0 ? 'Both' : 'Morning',
          inTime: '09:00',
          outTime: '18:00',
          hours: 9,
          otHours,
          otRate,
          totalOtAmount,
          morningOt: morning,
          eveningOt: evening,
          loadingCharges: loading,
        }
        return record
      })
      .filter(Boolean) as ExtendedAttendance[]

    setRecords((prev) => [...newRecords, ...prev])
    toast.success(`Saved ${newRecords.length} attendance records.`)
    setModalOpen(false)
  }

  /**
   * @function openEdit
   * @description Open the edit modal for a specific attendance record.
   */
  const openEdit = (row: ExtendedAttendance) => {
    setEditing(row)
    setEditModalOpen(true)
  }

  /**
   * @function handleDelete
   * @description Delete selected attendance record.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((r) => r.id !== confirmDelete.id))
    toast.success('Labour attendance deleted.')
    setConfirmDelete(null)
  }

  /**
   * EDIT MODAL FORM: reset when editing changes
   */
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, watch: watchEdit } = useForm<ExtendedAttendance>({
    defaultValues: editing ?? undefined,
  })

  useEffect(() => {
    if (editing) {
      resetEdit(editing)
    } else {
      resetEdit({
        id: '',
        labourName: '',
        type: 'Regular',
        attendanceDate: new Date().toISOString().slice(0, 10),
        shift: 'Morning',
        inTime: '09:00',
        outTime: '18:00',
        hours: 0,
        otHours: 0,
        otRate: DEFAULT_OT_RATE,
        totalOtAmount: 0,
        morningOt: 0,
        eveningOt: 0,
        loadingCharges: 0,
      })
    }
  }, [editing, resetEdit])

  /**
   * @function onSubmitEdit
   * @description Update a single attendance record from the edit modal.
   */
  const onSubmitEdit = (values: ExtendedAttendance) => {
    const morning = Number(values.morningOt || 0)
    const evening = Number(values.eveningOt || 0)
    const otRate = Number(values.otRate || DEFAULT_OT_RATE)
    const loading = Number(values.loadingCharges || 0)
    const otHours = morning + evening
    const total = otHours * otRate + loading

    setRecords((prev) =>
      prev.map((r) =>
        r.id === values.id
          ? {
              ...r,
              labourName: values.labourName,
              attendanceDate: values.attendanceDate,
              morningOt: morning,
              eveningOt: evening,
              loadingCharges: loading,
              otRate,
              otHours,
              totalOtAmount: total,
            }
          : r
      )
    )

    toast.success('Payment updated.')
    setEditModalOpen(false)
    setEditing(null)
  }

  const watchedEdit = watchEdit()

  return (
    <div>
      <PageHeader title="Labour Payment" breadcrumb={['Transactions', 'Labour Payment']} />
      <Toolbar
        onAddNew={openAddBulk}
        onExportExcel={() => toast.info('Exported labour attendance to Excel (mock).')}
        onExportPdf={() => toast.info('Exported labour attendance to PDF (mock).')}
        onPrint={() => toast.info('Sending labour attendance list to printer (mock).')}
        onRefresh={() => toast.success('Labour attendance list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by labour name or type..." />

      <DataGrid<ExtendedAttendance>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onEdit={(row) => openEdit(row)}
        onDelete={(row) => setConfirmDelete(row)}
      />

      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Total OT Payout:</span> {formatCurrency(monthlyOtTotal)}
      </div>

      {/* Bulk modal: list all master labour names and allow adjustments and adding new (temporary) names */}
      <ResponsiveModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
        }}
        title="Bulk Labour Payment Entry"
      >
        <form onSubmit={handleSubmit(onSubmitBulk)} className="space-y-3 text-xs">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Attendance Date</label>
              <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('attendanceDate', { required: true })} />
            </div>
            <div className="flex items-end justify-end">
              <button type="button" onClick={addNewRow} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100">
                Add Temporary Name
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="min-w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Labour Name</th>
                  <th className="px-3 py-2">Morning OT (hrs)</th>
                  <th className="px-3 py-2">Evening OT (hrs)</th>
                  <th className="px-3 py-2">Loading Charges</th>
                  <th className="px-3 py-2">OT Rate</th>
                  <th className="px-3 py-2">Total Amount</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rowsField.fields.map((field, index) => {
                  const row = watchedRows[index] || {}
                  const total = computeRowTotal(row)
                  return (
                    <tr key={field.id} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2 text-[11px]">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-200"
                              {...register(`rows.${index}.isTemporary` as const)}
                              defaultChecked={row.isTemporary}
                            />
                            Temp
                          </label>
                        </div>
                      </td>

                      <td className="px-3 py-1.5">
                        {/* If temporary, show free text; otherwise show select of master names */}
                        {row?.isTemporary ? (
                          <input
                            type="text"
                            className="w-full rounded-full border border-slate-200 px-2 py-1"
                            {...register(`rows.${index}.tempName` as const)}
                            placeholder="Temporary Name"
                          />
                        ) : (
                          <select
                            className="w-full rounded-full border border-slate-200 px-2 py-1 text-[11px]"
                            {...register(`rows.${index}.masterId` as const)}
                            defaultValue={row?.masterId}
                          >
                            <option value="">Select labour</option>
                            {labors.map((l) => (
                              <option key={l.id} value={l.id}>
                                {l.labourName}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>

                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-20 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`rows.${index}.morningOt` as const, { valueAsNumber: true })}
                          defaultValue={row?.morningOt ?? 0}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-20 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`rows.${index}.eveningOt` as const, { valueAsNumber: true })}
                          defaultValue={row?.eveningOt ?? 0}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          className="w-28 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`rows.${index}.loadingCharges` as const, { valueAsNumber: true })}
                          defaultValue={row?.loadingCharges ?? 0}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                          className="w-24 rounded-full border border-slate-200 px-2 py-1"
                          {...register(`rows.${index}.otRate` as const, { valueAsNumber: true })}
                          defaultValue={row?.otRate ?? DEFAULT_OT_RATE}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="w-28 rounded-full border border-slate-200 px-2 py-1 bg-slate-50 text-right">{formatCurrency(total)}</div>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button type="button" onClick={() => rowsField.remove(index)} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100">
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>Rows: {rowsField.fields.length}</p>
              <p>
                Modal Total: {formatCurrency((watchedRows || []).reduce((s, r) => s + computeRowTotal(r), 0))}
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setModalOpen(false) }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Close
              </button>
              <button type="submit" className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
                Save All
              </button>
            </div>
          </div>
        </form>
      </ResponsiveModal>

      {/* Edit single attendance modal */}
      <ResponsiveModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditing(null)
        }}
        title="Edit Attendance"
      >
        <form onSubmit={handleSubmitEdit(onSubmitEdit)} className="space-y-3 text-xs">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Labour Name</label>
              <input type="text" readOnly className="w-full rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-slate-700" {...registerEdit('labourName')} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Attendance Date</label>
              <input type="date" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('attendanceDate')} />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Morning OT (hrs)</label>
              <input type="number" step="0.5" min="0" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('morningOt', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Evening OT (hrs)</label>
              <input type="number" step="0.5" min="0" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('eveningOt', { valueAsNumber: true })} />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">OT Rate</label>
              <input type="number" min="0" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('otRate', { valueAsNumber: true })} />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-slate-700">Loading Charges</label>
            <input type="number" min="0" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('loadingCharges', { valueAsNumber: true })} />
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>Computed OT Hours: {(Number(watchedEdit.morningOt || 0) + Number(watchedEdit.eveningOt || 0)).toFixed(2)}</p>
              <p>
                Computed Total: {formatCurrency(((Number(watchedEdit.morningOt || 0) + Number(watchedEdit.eveningOt || 0)) * Number(watchedEdit.otRate || DEFAULT_OT_RATE)) + Number(watchedEdit.loadingCharges || 0))}
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setEditModalOpen(false); setEditing(null) }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
                Save
              </button>
            </div>
          </div>
        </form>
      </ResponsiveModal>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete labour attendance?"
        description={confirmDelete ? `Are you sure you want to delete attendance for ${confirmDelete.labourName} on ${formatDate(confirmDelete.attendanceDate)}?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default LabourAttendancePage