/**
 * @file LabourMasterPage.tsx
 * @description Labour Staff master maintenance screen with add / edit modal.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'
import { labors, type LabourStaff } from '../../mock/labors'

/**
 * @interface LabourFormValues
 * @description Form values used by the labour modal (keeps flat shape for MasterFormModal).
 */
interface LabourFormValues {
  labourName: string
  gender: 'Male' | 'Female'
  contactNumber: string
  address: string
  inTime: string
  outTime: string
  overtime_5_8: number
  overtime_6_8: number
  overtime_7_8: number
  overtime_7p_9p: number
  overtime_7p_10p: number
  loadingAmount: number
  status: 'Active' | 'Inactive'
}

/**
 * @component LabourMasterPage
 * @description Page to manage labour staff. Supports New / Edit modal using MasterFormModal.
 */
const LabourMasterPage: React.FC = () => {
  const [records, setRecords] = useState<LabourStaff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LabourStaff | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<LabourStaff | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(labors)
      setLoading(false)
    }, 300)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          r.labourName.toLowerCase().includes(q) ||
          r.contactNumber.toLowerCase().includes(q) ||
          r.address.toLowerCase().includes(q)
        const matchesStatus = !statusFilter || r.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [records, search, statusFilter]
  )

  const columns: ColumnDef<LabourStaff>[] = [
    { key: 'labourName', label: 'Name' },
    { key: 'gender', label: 'Gender' },
    { key: 'contactNumber', label: 'Contact' },
    {
      key: 'inOut',
      label: 'In / Out',
      render: (row) => `${row.inTime} - ${row.outTime}`,
    },
    {
      key: 'loadingAmount',
      label: 'Loading',
      render: (row) => row.loadingAmount.toLocaleString(),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: LabourStaff) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            className="rounded-full bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  const fields: FormFieldConfig[] = [
    { name: 'labourName', label: 'Labour Name', type: 'text', required: true },
    {
      name: 'gender',
      label: 'Gender',
      type: 'select',
      required: true,
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'Female', value: 'Female' },
      ],
    },
    { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'inTime', label: 'In Time', type: 'text', required: true },
    { name: 'outTime', label: 'Out Time', type: 'text', required: true },

    // Overtime fields
    { name: 'overtime_5_8', label: '5AM - 8AM', type: 'number', required: false },
    { name: 'overtime_6_8', label: '6AM - 8AM', type: 'number', required: false },
    { name: 'overtime_7_8', label: '7AM - 8AM', type: 'number', required: false },
    { name: 'overtime_7p_9p', label: '7PM - 9PM', type: 'number', required: false },
    { name: 'overtime_7p_10p', label: '7PM - 10PM', type: 'number', required: false },

    // Loading amount
    { name: 'loadingAmount', label: 'Loading 10 Ton', type: 'number', required: false },
    { name: 'loadingAmount20', label: 'Loading 20 Ton', type: 'number', required: false },

    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
  ]

  /**
   * @function openAdd
   * @description Open modal to create a new labour record.
   */
  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Open modal to edit an existing labour record.
   */
  const openEdit = (row: LabourStaff) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save or update labour record.
   */
  const handleSave = (values: LabourFormValues, resetAfter: boolean) => {
    if (editing) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editing.id
            ? {
                ...r,
                ...values,
                loadingAmount: Number(values.loadingAmount || 0),
                overtime_5_8: Number(values.overtime_5_8 || 0),
                overtime_6_8: Number(values.overtime_6_8 || 0),
                overtime_7_8: Number(values.overtime_7_8 || 0),
                overtime_7p_9p: Number(values.overtime_7p_9p || 0),
                overtime_7p_10p: Number(values.overtime_7p_10p || 0),
              }
            : r
        )
      )
      toast.success('Labour updated.')
    } else {
      const newRecord: LabourStaff = {
        id: `LABS-${Date.now()}`,
        labourName: values.labourName,
        gender: values.gender,
        contactNumber: values.contactNumber,
        address: values.address,
        inTime: values.inTime,
        outTime: values.outTime,
        overtime_5_8: Number(values.overtime_5_8 || 0),
        overtime_6_8: Number(values.overtime_6_8 || 0),
        overtime_7_8: Number(values.overtime_7_8 || 0),
        overtime_7p_9p: Number(values.overtime_7p_9p || 0),
        overtime_7p_10p: Number(values.overtime_7p_10p || 0),
        loadingAmount: Number(values.loadingAmount || 0),
        status: values.status as LabourStaff['status'],
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setRecords((prev) => [newRecord, ...prev])
      toast.success('Labour added.')
    }

    if (!resetAfter) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  /**
   * @function handleDelete
   * @description Delete selected labour record.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((r) => r.id !== confirmDelete.id))
    toast.success('Labour deleted.')
    setConfirmDelete(null)
  }

  return (
    <div>
      <PageHeader title="Labour Staff" breadcrumb={['Masters', 'Labour Staff']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported labour list to Excel (mock).')}
        onExportPdf={() => toast.info('Exported labour list to PDF (mock).')}
        onPrint={() => toast.info('Sending labour list to printer (mock).')}
        onRefresh={() => toast.success('Labour list refreshed.')}
      />

      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          New
        </button>
      </div>

     <SearchFilterPanel
    onSearch={setSearch}
    onClear={() => {
        setSearch("")
        setStatusFilter("")
    }}
/>

      <DataGrid<LabourStaff>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={(row) => openEdit(row)}
        onEdit={(row) => openEdit(row)}
        onDelete={(row) => setConfirmDelete(row)}
        onPrint={(row) => toast.info(`Printing details for ${row.labourName} (mock).`)}
      />

      <MasterFormModal<LabourFormValues>
        open={modalOpen}
        title={editing ? 'Edit Labour' : 'New Labour'}
        fields={fields}
        defaultValues={
          editing
            ? {
                labourName: editing.labourName,
                gender: editing.gender,
                contactNumber: editing.contactNumber,
                address: editing.address,
                inTime: editing.inTime,
                outTime: editing.outTime,
                overtime_5_8: editing.overtime_5_8,
                overtime_6_8: editing.overtime_6_8,
                overtime_7_8: editing.overtime_7_8,
                overtime_7p_9p: editing.overtime_7p_9p,
                overtime_7p_10p: editing.overtime_7p_10p,
                loadingAmount: editing.loadingAmount,
                status: editing.status,
              }
            : {
                labourName: '',
                gender: 'Male',
                contactNumber: '',
                address: '',
                inTime: '09:00',
                outTime: '18:00',
                overtime_5_8: 0,
                overtime_6_8: 0,
                overtime_7_8: 0,
                overtime_7p_9p: 0,
                overtime_7p_10p: 0,
                loadingAmount: 0,
                status: 'Active',
              }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete labour?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.labourName}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default LabourMasterPage