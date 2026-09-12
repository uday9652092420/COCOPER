/**
 * @file LabourAttendancePage.tsx
 * @description Labour attendance entry and listing. Main grid lists attendance records showing
 *              Morning OT, Evening OT, loading amounts and Total Amount. Bulk modal lists all labour
 *              staff from master and allows editing OT values and adding new (non-staff / temporary)
 *              labour names. Record-level Edit modal edits OT breakdown and recomputes totals.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { getLabours, type LabourResponse } from '../../services/labourstaffservices/labour.service'
import {
  createLabourAttendances,
  deleteLabourAttendance,
  deleteLabourAttendanceGroup,
  getLabourAttendances,
  updateLabourAttendance,
  updateLabourAttendanceGroupStatus,
  type LabourAttendancePayload,
  type LabourAttendanceResponse,
} from '../../services/labourattendance.service'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatAmount, formatCurrency, formatDate } from '../../utils/format'
import ResponsiveModal from '../../components/common/ResponsiveModal'
import { CalendarDays } from 'lucide-react'

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
  loading10TonsAmount: number
  loading20TonsAmount: number
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
interface ExtendedAttendance {
  id: string
  labour_id: string | null
  labourName: string
  type: 'Regular' | 'Temporary'
  attendanceDate: string
  shift: 'Morning' | 'Evening' | 'Night' | 'Both'
  inTime: string
  outTime: string
  hours: number
  otHours: number
  otRate: number
  totalOtAmount: number
  morningOt: number
  eveningOt: number
  loading10TonsAmount: number
  loading20TonsAmount: number
  paymentGroupId: string
  paymentStatus: 'Draft' | 'Approved'
  paymentCreatedAt: string
}

interface LabourPaymentSummary {
  id: string
  attendanceDate: string
  totalAmount: number
  records: ExtendedAttendance[]
  status: 'Draft' | 'Approved'
  latestCreatedAt: string
}

const todayISODate = (): string => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const createPaymentGroupId = (): string =>
  `LP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const formatDDMMYYYY = (value: string): string => {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

/**
 * @component LabourAttendancePage
 * @description Page to view labour attendance list and open a bulk modal that lists all labour staff
 *              from the Labour master. The modal allows editing OT values per labour, computing totals
 *              and adding new labour names not present in the master. Grid includes Edit/Delete actions.
 */
const LabourAttendancePage: React.FC = () => {
  const [records, setRecords] = useState<ExtendedAttendance[]>([])
  const [labours, setLabours] = useState<LabourResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<ExtendedAttendance | null>(null)
  const [confirmDeleteSummary, setConfirmDeleteSummary] = useState<LabourPaymentSummary | null>(null)
  const [bulkMode, setBulkMode] = useState<'create' | 'view' | 'edit'>('create')
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null)
  const attendanceDateInputRef = React.useRef<HTMLInputElement | null>(null)

  // Edit modal
  const [editing, setEditing] = useState<ExtendedAttendance | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  // Default OT rate applied for calculation (can be adjusted per row)
  const DEFAULT_OT_RATE = 150

  const mapAttendance = (row: LabourAttendanceResponse): ExtendedAttendance => ({
    id: row.id,
    labour_id: row.labour_id,
    labourName: row.labour_name,
    type: row.type,
    attendanceDate: row.attendance_date,
    shift: row.shift,
    inTime: row.in_time,
    outTime: row.out_time,
    hours: Number(row.hours || 0),
    otHours: Number(row.ot_hours || 0),
    otRate: Number(row.ot_rate || DEFAULT_OT_RATE),
    totalOtAmount: Number(row.total_ot_amount || 0),
    morningOt: Number(row.morning_ot || 0),
    eveningOt: Number(row.evening_ot || 0),
    loading10TonsAmount: Number(row.loading_10_tons_amount || 0),
    loading20TonsAmount: Number(row.loading_20_tons_amount || 0),
    paymentGroupId: row.payment_group_id || row.id,
    paymentStatus: String(row.payment_status || 'Draft').toLowerCase() === 'approved' ? 'Approved' : 'Draft',
    paymentCreatedAt: row.payment_created_at || row.created_at || '',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [labourRows, attendanceRows] = await Promise.all([getLabours(), getLabourAttendances()])
      setLabours(labourRows)
      setRecords(attendanceRows.map(mapAttendance))
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load labour staff and payments.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const summaries = useMemo<LabourPaymentSummary[]>(() => {
    const grouped = new Map<string, LabourPaymentSummary>()
    records.forEach((record) => {
      const existing = grouped.get(record.paymentGroupId)
      if (existing) {
        existing.records.push(record)
        existing.totalAmount += record.totalOtAmount
      } else {
        grouped.set(record.paymentGroupId, {
          id: record.paymentGroupId,
          attendanceDate: record.attendanceDate,
          totalAmount: record.totalOtAmount,
          records: [record],
          status: record.paymentStatus,
          latestCreatedAt: record.paymentCreatedAt,
        })
      }
    })
    return Array.from(grouped.values()).sort((a, b) => {
      const dateOrder = b.attendanceDate.localeCompare(a.attendanceDate)
      return dateOrder || b.latestCreatedAt.localeCompare(a.latestCreatedAt)
    })
  }, [records])

  const filtered = useMemo(
    () => summaries.filter((summary) => {
      const q = search.toLowerCase()
      return !q || summary.attendanceDate.includes(q) || summary.records.some((record) => record.labourName.toLowerCase().includes(q))
    }),
    [summaries, search]
  )

  const columns: ColumnDef<LabourPaymentSummary>[] = [
    {
      key: 'attendanceDate',
      label: 'Date',
      render: (row) => formatDDMMYYYY(row.attendanceDate),
    },
    { key: 'status', label: 'Status' },
    {
      key: 'totalAmount',
      label: 'Total Amount',
      render: (row) => formatAmount(row.totalAmount),
    },
  ]

  /**
   * @function computeRowTotal
  * @description Compute row total = (morningOt + eveningOt) * otRate + both loading amounts
   */
  const computeRowTotal = (r: BulkEntryRow | ExtendedAttendance) => {
    const otHours = Number((r as any).morningOt || 0) + Number((r as any).eveningOt || 0)
    const otRate = Number((r as any).otRate || DEFAULT_OT_RATE)
    const loading10Tons = Number((r as any).loading10TonsAmount || 0)
    const loading20Tons = Number((r as any).loading20TonsAmount || 0)
    return otHours * otRate + loading10Tons + loading20Tons
  }

  const monthlyOtTotal = useMemo(() => records.reduce((sum, r) => sum + Number(r.totalOtAmount || 0), 0), [records])
  const totalLabourPayment = useMemo(() => summaries.reduce((sum, payment) => sum + payment.totalAmount, 0), [summaries])

  /**
   * BULK MODAL FORM: initialize with labour master entries
   */
  const { register, control, handleSubmit, reset, watch } = useForm<BulkEntryForm>({
    defaultValues: {
      attendanceDate: todayISODate(),
      rows: [
        ...labours.map((l) => ({
          isTemporary: false,
          masterId: l.id,
          tempName: l.labour_name,
          morningOt: 0,
          eveningOt: 0,
          loading10TonsAmount: l.loading_10_tons_amount || 0,
          loading20TonsAmount: l.loading_20_tons_amount || 0,
          otRate: DEFAULT_OT_RATE,
        })),
        {
          isTemporary: true,
          masterId: undefined,
          tempName: '',
          morningOt: 0,
          eveningOt: 0,
          loading10TonsAmount: 0,
          loading20TonsAmount: 0,
          otRate: DEFAULT_OT_RATE,
        },
      ],
    },
  })

  const rowsField = useFieldArray({
    control,
    name: 'rows',
  })

  const watchedRows = watch('rows') || []
  const attendanceDateField = register('attendanceDate', { required: true })

  /**
   * @function openAddBulk
   * @description Prepare and open the bulk modal prefilled with labors from master.
   */
  const openAddBulk = () => {
    setBulkMode('create')
    reset({
      attendanceDate: todayISODate(),
      rows: [
        ...labours.map((l) => ({
          isTemporary: false,
          masterId: l.id,
          tempName: l.labour_name,
          morningOt: 0,
          eveningOt: 0,
          loading10TonsAmount: l.loading_10_tons_amount || 0,
          loading20TonsAmount: l.loading_20_tons_amount || 0,
          otRate: DEFAULT_OT_RATE,
        })),
        {
          isTemporary: true,
          masterId: undefined,
          tempName: '',
          morningOt: 0,
          eveningOt: 0,
          loading10TonsAmount: 0,
          loading20TonsAmount: 0,
          otRate: DEFAULT_OT_RATE,
        },
      ],
    })
    setModalOpen(true)
  }

  const openPaymentDetails = (payment: LabourPaymentSummary, mode: 'view' | 'edit') => {
    setBulkMode(mode)
    setActivePaymentId(payment.id)
    reset({
      attendanceDate: payment.attendanceDate,
      rows: payment.records.map((record) => ({
        isTemporary: record.type === 'Temporary',
        masterId: record.labour_id || undefined,
        tempName: record.labourName,
        morningOt: record.morningOt,
        eveningOt: record.eveningOt,
        loading10TonsAmount: record.loading10TonsAmount,
        loading20TonsAmount: record.loading20TonsAmount,
        otRate: record.otRate,
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
      loading10TonsAmount: 0,
      loading20TonsAmount: 0,
      otRate: DEFAULT_OT_RATE,
    })
  }

  /**
   * @function onSubmitBulk
   * @description Transform bulk rows into LabourAttendance records and add them to the list.
   *              Supports both master-selected rows and temporary (non-staff) rows.
   */
  const onSubmitBulk = async (values: BulkEntryForm) => {
    const payloads: LabourAttendancePayload[] = (values.rows || [])
      .map((row) => {
        const master = labours.find((labour) => labour.id === row.masterId)
        const name = row.isTemporary ? (row.tempName || '').trim() : master?.labour_name || ''
        if (!name) return null

        const morning = Number(row.morningOt || 0)
        const evening = Number(row.eveningOt || 0)
        const otHours = morning + evening
        const otRate = Number(row.otRate || DEFAULT_OT_RATE)
        const loading10Tons = Number(row.loading10TonsAmount || 0)
        const loading20Tons = Number(row.loading20TonsAmount || 0)
        return {
          labour_id: row.isTemporary ? null : row.masterId,
          labour_name: name,
          type: row.isTemporary ? 'Temporary' : 'Regular',
          shift: otHours > 0 ? 'Both' : 'Morning',
          attendance_date: values.attendanceDate,
          in_time: '09:00',
          out_time: '18:00',
          hours: 9,
          morning_ot: morning,
          evening_ot: evening,
          ot_rate: otRate,
          loading_10_tons_amount: loading10Tons,
          loading_20_tons_amount: loading20Tons,
        }
      })
      .filter(Boolean) as LabourAttendancePayload[]

    if (!payloads.length) {
      toast.error('Add at least one labour before saving.')
      return
    }

    try {
      if (bulkMode === 'edit') {
        const existing = summaries.find((summary) => summary.id === activePaymentId)
        const updates = existing?.records || []
        const updated = await Promise.all(payloads.map((payload, index) => updateLabourAttendance(updates[index].id, payload)))
        setRecords((prev) => prev.map((record) => updated.find((item) => item.id === record.id) ? mapAttendance(updated.find((item) => item.id === record.id)!) : record))
        toast.success('Labour payment updated in the database.')
      } else {
        const paymentGroupId = createPaymentGroupId()
        const created = await createLabourAttendances(payloads.map((payload) => ({ ...payload, payment_group_id: paymentGroupId })))
        setRecords((prev) => [...created.map(mapAttendance), ...prev])
        toast.success(`Saved ${created.length} labour payment records to the database.`)
      }
      setModalOpen(false)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save labour payments.')
    }
  }

  const handleApprove = async (payment: LabourPaymentSummary) => {
    try {
      const updated = await updateLabourAttendanceGroupStatus(payment.id, 'Approved')
      const updatedById = new Map(updated.map((row) => [row.id, mapAttendance(row)]))
      setRecords((prev) => prev.map((record) => updatedById.get(record.id) || record))
      toast.success('Labour payment approved.')
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve labour payment.')
    }
  }

  const handleDeleteSummary = async () => {
    if (!confirmDeleteSummary) return
    try {
      await deleteLabourAttendanceGroup(confirmDeleteSummary.id)
      setRecords((prev) => prev.filter((record) => record.paymentGroupId !== confirmDeleteSummary.id))
      toast.success('Labour payment deleted.')
      setConfirmDeleteSummary(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete labour payment.')
    }
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
  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteLabourAttendance(confirmDelete.id)
      setRecords((prev) => prev.filter((r) => r.id !== confirmDelete.id))
      toast.success('Labour attendance deleted.')
      setConfirmDelete(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete labour attendance.')
    }
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
        loading10TonsAmount: 0,
        loading20TonsAmount: 0,
      })
    }
  }, [editing, resetEdit])

  /**
   * @function onSubmitEdit
   * @description Update a single attendance record from the edit modal.
   */
  const onSubmitEdit = async (values: ExtendedAttendance) => {
    const morning = Number(values.morningOt || 0)
    const evening = Number(values.eveningOt || 0)
    const otRate = Number(values.otRate || DEFAULT_OT_RATE)
    const loading10Tons = Number(values.loading10TonsAmount || 0)
    const loading20Tons = Number(values.loading20TonsAmount || 0)
    const otHours = morning + evening
    try {
      const updated = await updateLabourAttendance(values.id, {
        labour_id: values.labour_id,
        labour_name: values.labourName,
        type: values.type,
        attendance_date: values.attendanceDate,
        shift: values.shift,
        in_time: values.inTime,
        out_time: values.outTime,
        hours: values.hours,
        morning_ot: morning,
        evening_ot: evening,
        ot_rate: otRate,
        loading_10_tons_amount: loading10Tons,
        loading_20_tons_amount: loading20Tons,
      })
      setRecords((prev) => prev.map((record) => record.id === values.id ? mapAttendance(updated) : record))
      toast.success('Payment updated in the database.')
      setEditModalOpen(false)
      setEditing(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update labour payment.')
    }
  }

  const watchedEdit = watchEdit()

  const exportRows = filtered.flatMap((summary) => summary.records.map((row) => ({
    date: formatDate(row.attendanceDate),
    labourName: row.labourName,
    type: row.type,
    shift: row.shift,
    morningOt: row.morningOt,
    eveningOt: row.eveningOt,
    loading10: row.loading10TonsAmount,
    loading20: row.loading20TonsAmount,
    total: row.totalOtAmount,
  })))

  const escapeHtml = (value: unknown) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

  const exportToExcel = () => {
    if (!exportRows.length) {
      toast.info('No labour payments to export.')
      return
    }

    const body = exportRows.map((row) => `<tr>
      <td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.labourName)}</td>
      <td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.shift)}</td>
      <td>${escapeHtml(row.morningOt)}</td><td>${escapeHtml(row.eveningOt)}</td>
      <td>${escapeHtml(formatCurrency(row.loading10))}</td><td>${escapeHtml(formatCurrency(row.loading20))}</td>
      <td>${escapeHtml(formatCurrency(row.total))}</td>
    </tr>`).join('')
    const workbook = `<html><head><meta charset="UTF-8"></head><body><table border="1">
      <thead><tr><th>Date</th><th>Labour Name</th><th>Type</th><th>Shift</th><th>Morning OT (hrs)</th><th>Evening OT (hrs)</th><th>Loading 10 Tons Amount</th><th>Loading 20 Tons Amount</th><th>Total Amount</th></tr></thead>
      <tbody>${body}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'labour-payments.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Labour payments exported to Excel.')
  }

  const printPayments = (asPdf = false) => {
    if (!exportRows.length) {
      toast.info('No labour payments to print.')
      return
    }
    const win = window.open('', '_blank', 'width=1200,height=800')
    if (!win) {
      toast.error('Popup blocked. Please allow popups to print or save PDF.')
      return
    }
    const body = exportRows.map((row) => `<tr>
      <td>${escapeHtml(row.date)}</td><td>${escapeHtml(row.labourName)}</td><td>${escapeHtml(row.type)}</td><td>${escapeHtml(row.shift)}</td>
      <td>${escapeHtml(row.morningOt)}</td><td>${escapeHtml(row.eveningOt)}</td><td>${escapeHtml(formatCurrency(row.loading10))}</td>
      <td>${escapeHtml(formatCurrency(row.loading20))}</td><td>${escapeHtml(formatCurrency(row.total))}</td>
    </tr>`).join('')
    win.document.write(`<!doctype html><html><head><title>${asPdf ? 'Labour Payments PDF' : 'Labour Payments'}</title>
      <style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style>
      </head><body><h1>Labour Payments</h1><p>Generated on ${escapeHtml(formatDate(new Date().toISOString()))}</p>
      <table><thead><tr><th>Date</th><th>Labour Name</th><th>Type</th><th>Shift</th><th>Morning OT (hrs)</th><th>Evening OT (hrs)</th><th>Loading 10 Tons Amount</th><th>Loading 20 Tons Amount</th><th>Total Amount</th></tr></thead><tbody>${body}</tbody></table>
      <p><strong>Total Labour Payment Amount: ${escapeHtml(formatAmount(totalLabourPayment))}</strong></p></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
    toast.success(asPdf ? 'Labour payment PDF is ready to save.' : 'Labour payments sent to print.')
  }

  return (
    <div>
      <PageHeader title="Labour Payment" breadcrumb={['Transactions', 'Labour Payment']} />
      <Toolbar
        onAddNew={openAddBulk}
        onExportExcel={exportToExcel}
        onExportPdf={() => printPayments(true)}
        onPrint={() => printPayments(false)}
        onRefresh={() => {
          void loadData()
          toast.success('Labour payments refreshed.')
        }}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by labour name or type..." />

      <DataGrid<LabourPaymentSummary>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={(row) => openPaymentDetails(row, 'view')}
        onEdit={(row) => openPaymentDetails(row, 'edit')}
        onApprove={(row) => void handleApprove(row)}
        isRowApproved={(row) => row.status === 'Approved'}
        onDelete={(row) => setConfirmDeleteSummary(row)}
      />

      <div className="mt-3 flex flex-wrap gap-x-8 gap-y-1 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span><span className="font-semibold">Total OT Payout:</span> {formatCurrency(monthlyOtTotal)}</span>
        <span><span className="font-semibold">Total Labour Payment:</span> {formatAmount(totalLabourPayment)}</span>
      </div>

      {/* Bulk modal: list all master labour names and allow adjustments and adding new (temporary) names */}
      <ResponsiveModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
        }}
        title={bulkMode === 'view' ? 'View Labour Payment' : bulkMode === 'edit' ? 'Edit Labour Payment' : 'Bulk Labour Payment Entry'}
        maxWidth="max-w-7xl"
        maxHeight="95vh"
        contentMaxHeight="84vh"
      >
        <form onSubmit={handleSubmit(onSubmitBulk)} className="space-y-3 text-xs">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="relative max-w-[240px]">
              <label className="mb-1 block text-[11px] font-medium text-slate-700">Attendance Date</label>
              <div className="flex items-center rounded-full border border-slate-200">
                <div className="pointer-events-none flex-1 px-3 py-1.5 text-sm text-slate-800">
                  {formatDDMMYYYY(watch('attendanceDate') || todayISODate())}
                </div>
                <button
                  type="button"
                  aria-label="Open attendance date calendar"
                  title="Select attendance date"
                  disabled={bulkMode === 'view'}
                  onClick={() => {
                    const input = attendanceDateInputRef.current
                    if (!input) return
                    if (input.showPicker) input.showPicker()
                    else input.click()
                  }}
                  className="rounded-r-full px-3 py-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  <CalendarDays className="h-4 w-4" />
                </button>
              </div>
              <input
                type="date"
                aria-label="Select attendance date"
                disabled={bulkMode === 'view'}
                defaultValue={todayISODate()}
                className="absolute bottom-0 left-0 h-0 w-0 opacity-0"
                {...attendanceDateField}
                ref={(element) => {
                  attendanceDateInputRef.current = element
                  attendanceDateField.ref(element)
                }}
              />
            </div>
            <div className="flex items-end justify-end">
              <button type="button" onClick={addNewRow} disabled={bulkMode === 'view'} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
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
                  <th className="px-3 py-2">Loading 10 Tons Amount</th>
                  <th className="px-3 py-2">Loading 20 Tons Amount</th>
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
                              disabled={bulkMode === 'view'}
                              {...register(`rows.${index}.isTemporary` as const)}
                              defaultChecked={row.isTemporary}
                            />
                            Temporary
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
                            disabled={bulkMode === 'view'}
                            placeholder="Temporary Name"
                          />
                        ) : (
                          <input
                            type="text"
                            readOnly
                            className="w-full rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-slate-700"
                            value={row?.tempName || labours.find((labour) => labour.id === row?.masterId)?.labour_name || ''}
                            aria-label="Labour name"
                          />
                        )}
                      </td>

                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-24 rounded-full border border-slate-200 px-2 py-1"
                          disabled={bulkMode === 'view'}
                          {...register(`rows.${index}.morningOt` as const, { valueAsNumber: true })}
                          defaultValue={row?.morningOt ?? 0}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          className="w-24 rounded-full border border-slate-200 px-2 py-1"
                          disabled={bulkMode === 'view'}
                          {...register(`rows.${index}.eveningOt` as const, { valueAsNumber: true })}
                          defaultValue={row?.eveningOt ?? 0}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                            className="w-32 rounded-full border border-slate-200 px-2 py-1"
                            readOnly={!row?.isTemporary}
                            disabled={bulkMode === 'view'}
                            {...register(`rows.${index}.loading10TonsAmount` as const, { valueAsNumber: true })}
                            defaultValue={row?.loading10TonsAmount ?? 0}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="number"
                          min="0"
                            className="w-28 rounded-full border border-slate-200 px-2 py-1"
                            readOnly={!row?.isTemporary}
                            disabled={bulkMode === 'view'}
                            {...register(`rows.${index}.loading20TonsAmount` as const, { valueAsNumber: true })}
                            defaultValue={row?.loading20TonsAmount ?? 0}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number"
                            min="0"
                            className="w-28 rounded-full border border-slate-200 px-2 py-1"
                            disabled={bulkMode === 'view'}
                            {...register(`rows.${index}.otRate` as const, { valueAsNumber: true })}
                            defaultValue={row?.otRate ?? DEFAULT_OT_RATE}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <div className="w-32 rounded-full border border-slate-200 px-2 py-1 bg-slate-50 text-right">{formatCurrency(total)}</div>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <button type="button" onClick={() => rowsField.remove(index)} disabled={bulkMode === 'view'} className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-100 disabled:opacity-50">
                          Delete
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
              <p>Total Labours : {rowsField.fields.length}</p>
              <p>
                Total Labour Amount = {formatCurrency((watchedRows || []).reduce((s, r) => s + computeRowTotal(r), 0))}
              </p>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => { setModalOpen(false) }} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                Close
              </button>
              {bulkMode !== 'view' ? (
                <button type="submit" className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
                  {bulkMode === 'edit' ? 'Save Changes' : 'Save All'}
                </button>
              ) : null}
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
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Loading 10 Tons Amount</label>
                <input type="number" min="0" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('loading10TonsAmount', { valueAsNumber: true })} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Loading 20 Tons Amount</label>
                <input type="number" min="0" className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...registerEdit('loading20TonsAmount', { valueAsNumber: true })} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <div className="space-y-1 text-[11px] text-slate-600">
              <p>Computed OT Hours: {(Number(watchedEdit.morningOt || 0) + Number(watchedEdit.eveningOt || 0)).toFixed(2)}</p>
              <p>
                Computed Total: {formatCurrency(((Number(watchedEdit.morningOt || 0) + Number(watchedEdit.eveningOt || 0)) * Number(watchedEdit.otRate || DEFAULT_OT_RATE)) + Number(watchedEdit.loading10TonsAmount || 0) + Number(watchedEdit.loading20TonsAmount || 0))}
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
      <ConfirmDialog
        open={!!confirmDeleteSummary}
        title="Delete labour payment?"
        description={confirmDeleteSummary ? `Delete the labour payment for ${formatDDMMYYYY(confirmDeleteSummary.attendanceDate)}?` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteSummary}
        onCancel={() => setConfirmDeleteSummary(null)}
      />
    </div>
  )
}

export default LabourAttendancePage