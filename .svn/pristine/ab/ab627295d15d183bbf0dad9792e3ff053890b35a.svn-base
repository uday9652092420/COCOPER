/**
 * @file SupplierMasterPage.tsx
 * @description Supplier master maintenance screen. Adds extended contact fields in the modal form.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { suppliers as dbSuppliers, type Supplier } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'

/**
 * @description Supplier form values including two additional contact persons and numbers.
 */
interface SupplierFormValues {
  code: string
  name: string
  gst: string
  address: string
  mobile: string
  whatsapp: string
  contactPerson?: string
  creditDays: number
  status: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
}

/**
 * @component SupplierMasterPage
 * @description Supplier master maintenance screen.
 */
const SupplierMasterPage: React.FC = () => {
  const [records, setRecords] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Supplier | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbSuppliers)
      setLoading(false)
    }, 400)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((sup) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q ||
          sup.code.toLowerCase().includes(q) ||
          sup.name.toLowerCase().includes(q) ||
          sup.mobile.includes(search)
        const matchesStatus = !statusFilter || sup.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [records, search, statusFilter]
  )

  /**
   * @description Table columns including actions column that provides Edit/Delete buttons.
   */
  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'mobile', label: 'Mobile' },
    { key: 'creditDays', label: 'Credit Days' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Supplier) => (
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
      label: 'Created Date',
      render: (row: Supplier) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Supplier) => (
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
    { name: 'code', label: 'Supplier Code', type: 'text', required: true },
    { name: 'name', label: 'Supplier Name', type: 'text', required: true },
    { name: 'contactPerson', label: 'Contact Person', type: 'text', required: false },
    // New extended contact fields
    { name: 'contactPerson1', label: 'Contact Person 1', type: 'text', required: false },
    { name: 'contactNo1', label: 'Contact No 1', type: 'text', required: false },
    { name: 'contactPerson2', label: 'Contact Person 2', type: 'text', required: false },
    { name: 'contactNo2', label: 'Contact No 2', type: 'text', required: false },
    { name: 'gst', label: 'GST', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'mobile', label: 'Mobile', type: 'text', required: true },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text', required: true },
    { name: 'creditDays', label: 'Credit Days', type: 'number', required: true },
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

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Open the modal with selected supplier data for editing.
   */
  const openEdit = (row: Supplier) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save or update supplier record. Supports reset-after-add behavior.
   */
  const handleSave = (values: SupplierFormValues, resetAfter: boolean) => {
    if (editing) {
      // Update existing - merge incoming values, ensure numeric conversion for creditDays
      setRecords((prev) =>
        prev.map((s) =>
          s.id === editing.id
            ? ({ ...s, ...(values as any), creditDays: Number(values.creditDays) } as Supplier)
            : s
        )
      )
      toast.success('Supplier updated.')
    } else {
      // Add new record. Include optional contact details if provided.
      const newRecord = {
        id: `SUP-${Date.now()}`,
        code: values.code,
        name: values.name,
        contactPerson: values.contactPerson ?? '',
        contactPerson1: values.contactPerson1 ?? '',
        contactNo1: values.contactNo1 ?? '',
        contactPerson2: values.contactPerson2 ?? '',
        contactNo2: values.contactNo2 ?? '',
        gst: values.gst,
        address: values.address,
        mobile: values.mobile,
        whatsapp: values.whatsapp,
        creditDays: Number(values.creditDays),
        status: values.status,
        createdAt: new Date().toISOString().slice(0, 10),
      } as Supplier & {
        contactPerson?: string
        contactPerson1?: string
        contactNo1?: string
        contactPerson2?: string
        contactNo2?: string
      }

      setRecords((prev) => [newRecord as unknown as Supplier, ...prev])
      toast.success('Supplier added.')
    }
    if (!resetAfter) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  /**
   * @function handleDelete
   * @description Deletes the supplier stored in confirmDelete state.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((s) => s.id !== confirmDelete.id))
    toast.success('Supplier deleted.')
    setConfirmDelete(null)
  }

  return (
    <div>
      <PageHeader title="Supplier Master" breadcrumb={['Masters', 'Supplier Master']} />
      <Toolbar title="Supplier Master" onAdd={openAdd} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(r: Supplier) => r.id} />
      <MasterFormModal<SupplierFormValues>
        open={modalOpen}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        fields={fields}
        defaultValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                contactPerson: (editing as any).contactPerson ?? '',
                contactPerson1: (editing as any).contactPerson1 ?? '',
                contactNo1: (editing as any).contactNo1 ?? '',
                contactPerson2: (editing as any).contactPerson2 ?? '',
                contactNo2: (editing as any).contactNo2 ?? '',
                gst: editing.gst,
                address: editing.address,
                mobile: editing.mobile,
                whatsapp: editing.whatsapp,
                creditDays: editing.creditDays,
                status: editing.status,
              }
            : {
                code: '',
                name: '',
                contactPerson: '',
                contactPerson1: '',
                contactNo1: '',
                contactPerson2: '',
                contactNo2: '',
                gst: '',
                address: '',
                mobile: '',
                whatsapp: '',
                creditDays: 30,
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
        title="Delete supplier?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default SupplierMasterPage