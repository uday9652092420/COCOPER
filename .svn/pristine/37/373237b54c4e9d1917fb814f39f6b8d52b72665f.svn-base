/**
 * @file CustomerMasterPage.tsx
 * @description Customer master maintenance screen with business rules for customer type.
 */

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { customers as dbCustomers, type Customer, type CustomerType } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'

/**
 * @description Customer form values including two additional contact persons and numbers.
 */
interface CustomerFormValues {
  code: string
  name: string
  type: CustomerType
  state: string
  address: string
  mobile: string
  whatsapp: string
  contactPerson?: string
  creditLimit: number
  status: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
}

/**
 * @description Helper describing business rule for customer type.
 */
const customerTypeHint = (type: CustomerType | ''): string => {
  if (type === 'Premium') return 'Credit allowed'
  if (type === 'Local') return 'Cash and credit allowed'
  if (type === 'Red') return 'Cash only – no credit allowed'
  return 'Select a customer type to view business rule.'
}

/**
 * @component CustomerMasterPage
 * @description Customer master page component.
 */
const CustomerMasterPage: React.FC = () => {
  const [records, setRecords] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null)
  const [currentType, setCurrentType] = useState<CustomerType | ''>('')

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbCustomers)
      setLoading(false)
    }, 400)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((c) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.mobile.includes(search)
        const matchesStatus = !statusFilter || c.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [records, search, statusFilter]
  )

  const columns: ColumnDef<Customer>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'type', label: 'Type' },
    { key: 'state', label: 'State' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'creditLimit',
      label: 'Credit Limit',
      render: (row) => row.creditLimit.toLocaleString('en-IN'),
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
      label: 'Created Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Customer) => (
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
    { name: 'code', label: 'Customer Code', type: 'text', required: true },
    { name: 'name', label: 'Customer Name', type: 'text', required: true },
    { name: 'contactPerson', label: 'Contact Person', type: 'text', required: false },
    // New extended contact fields
    { name: 'contactPerson1', label: 'Contact Person 1', type: 'text', required: false },
    { name: 'contactNo1', label: 'Contact No 1', type: 'text', required: false },
    { name: 'contactPerson2', label: 'Contact Person 2', type: 'text', required: false },
    { name: 'contactNo2', label: 'Contact No 2', type: 'text', required: false },
    {
      name: 'type',
      label: 'Customer Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Premium', value: 'Premium' },
        { label: 'Local', value: 'Local' },
        { label: 'Red', value: 'Red' },
      ],
    },
    { name: 'state', label: 'State', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'mobile', label: 'Mobile', type: 'text', required: true },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text', required: true },
    { name: 'creditLimit', label: 'Credit Limit', type: 'number', required: true },
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
   * @description Open modal to add a new customer.
   */
  const openAdd = () => {
    setEditing(null)
    setCurrentType('')
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Open modal to edit an existing customer.
   */
  const openEdit = (row: Customer) => {
    setEditing(row)
    setCurrentType(row.type)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save or update customer record. Supports reset-after-add behavior.
   */
  const handleSave = (values: CustomerFormValues, resetAfter: boolean) => {
    if (values.type === 'Red' && values.creditLimit > 0) {
      toast.warning('Red customers are cash-only. Credit limit will be set to 0.')
      // Enforce rule: Red = cash only.
      // eslint-disable-next-line no-param-reassign
      values.creditLimit = 0
    }

    if (editing) {
      setRecords((prev) =>
        prev.map((c) =>
          c.id === editing.id
            ? {
                ...c,
                ...values,
                contactPerson: (values as any).contactPerson ?? (c as any).contactPerson ?? '',
                contactPerson1: (values as any).contactPerson1 ?? (c as any).contactPerson1 ?? '',
                contactNo1: (values as any).contactNo1 ?? (c as any).contactNo1 ?? '',
                contactPerson2: (values as any).contactPerson2 ?? (c as any).contactPerson2 ?? '',
                contactNo2: (values as any).contactNo2 ?? (c as any).contactNo2 ?? '',
                creditLimit: Number(values.creditLimit),
              }
            : c
        )
      )
      toast.success('Customer updated.')
    } else {
      const newRecord: Customer = {
        id: `CUST-${Date.now()}`,
        code: values.code,
        name: values.name,
        type: values.type,
        state: values.state,
        address: values.address,
        mobile: values.mobile,
        whatsapp: values.whatsapp,
        contactPerson: values.contactPerson ?? '',
        contactPerson1: values.contactPerson1 ?? '',
        contactNo1: values.contactNo1 ?? '',
        contactPerson2: values.contactPerson2 ?? '',
        contactNo2: values.contactNo2 ?? '',
        creditLimit: Number(values.creditLimit),
        status: values.status as Customer['status'],
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setRecords((prev) => [newRecord, ...prev])
      toast.success('Customer added.')
    }

    if (!resetAfter) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  /**
   * @function handleDelete
   * @description Delete the customer stored in confirmDelete state.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((c) => c.id !== confirmDelete.id))
    toast.success('Customer deleted.')
    setConfirmDelete(null)
  }

  return (
    <div>
      <PageHeader title="Customer Master" breadcrumb={['Masters', 'Customer Master']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported customers to Excel (mock).')}
        onExportPdf={() => toast.info('Exported customers to PDF (mock).')}
        onPrint={() => toast.info('Sending customer list to printer (mock).')}
        onRefresh={() => toast.success('Customer list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />

      {/* Add New button (non-destructive addition to existing toolbar behavior) */}
      <div className="flex justify-end mb-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          Add New
        </button>
      </div>

      <SearchFilterPanel onSearchChange={setSearch} onStatusChange={setStatusFilter} searchPlaceholder="Search by code, name, mobile..." />

      <DataGrid<Customer>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={(row) => openEdit(row)}
        onEdit={(row) => openEdit(row)}
        onDelete={(row) => setConfirmDelete(row)}
        onPrint={(row) => toast.info(`Printing details for ${row.name} (mock).`)}
      />

      <MasterFormModal<CustomerFormValues>
        open={modalOpen}
        title={editing ? 'Edit Customer' : 'Add Customer'}
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
                type: editing.type,
                state: editing.state,
                address: editing.address,
                mobile: editing.mobile,
                whatsapp: editing.whatsapp,
                creditLimit: editing.creditLimit,
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
                type: 'Local',
                state: '',
                address: '',
                mobile: '',
                whatsapp: '',
                creditLimit: 0,
                status: 'Active',
              }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          setCurrentType('')
        }}
        onSave={handleSave}
      />

      <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
        <span className="font-semibold">Business Rule:</span> {customerTypeHint(currentType)}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete customer?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default CustomerMasterPage