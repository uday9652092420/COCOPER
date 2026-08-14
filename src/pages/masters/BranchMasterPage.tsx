/**
 * @file BranchMasterPage.tsx
 * @description Branch Master maintenance screen (branch CRUD).
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Edit2, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import {
  getBranches,
  getNextBranchCode,
  createBranch,
  updateBranch,
  deleteBranch,
  type Branch,
} from '../../services/branchesservices/branches.service'

interface BranchFormValues {
  branchCode: string
  branchName: string
  address: string
  contactNo: string
  status: 'ACTIVE' | 'INACTIVE'
}

const BranchMasterPage: React.FC = () => {
  const [records, setRecords] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Branch | null>(null)
  const [nextCode, setNextCode] = useState('')

  const loadBranches = async () => {
    try {
      setLoading(true)
      setRecords(await getBranches())
    } catch (error) {
      console.error(error)
      toast.error('Failed to load branches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBranches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((b) => {
        const q = search.toLowerCase()
        return (
          !q ||
          b.branch_name.toLowerCase().includes(q) ||
          (b.branch_code ?? '').toLowerCase().includes(q)
        )
      }),
    [records, search]
  )

  const fields: FormFieldConfig[] = [
    { name: 'branchCode', label: 'Branch Code', type: 'text', readOnly: true },
    { name: 'branchName', label: 'Branch Name', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea' },
    { name: 'contactNo', label: 'Contact No', type: 'text' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
      ],
    },
  ]

  const handleAdd = async () => {
    setEditing(null)

    try {
      setNextCode(await getNextBranchCode())
    } catch {
      setNextCode('')
    }

    setModalOpen(true)
  }

  const handleSave = async (values: BranchFormValues) => {
    try {
      if (editing) {
        await updateBranch(editing.id, {
          branch_code: values.branchCode,
          branch_name: values.branchName,
          address: values.address,
          contact_no: values.contactNo,
          status: values.status,
        })
        toast.success('Branch updated successfully')
      } else {
        await createBranch({
          branch_code: values.branchCode,
          branch_name: values.branchName,
          address: values.address,
          contact_no: values.contactNo,
          status: values.status,
        })
        toast.success('Branch created successfully')
      }

      setModalOpen(false)
      setEditing(null)
      await loadBranches()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to save branch')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteBranch(confirmDelete.id)
      toast.success('Branch deleted successfully')
      setConfirmDelete(null)
      await loadBranches()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to delete branch')
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'branch_code', label: 'Branch Code' },
    { key: 'branch_name', label: 'Branch Name' },
    { key: 'address', label: 'Address' },
    { key: 'contact_no', label: 'Contact No.' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Branch) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${String(row.status).toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      render: (row: Branch) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setEditing(row); setModalOpen(true) }}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(row)}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Branch Master" breadcrumb={['Masters', 'Branch Master']} />
      <Toolbar title="Branch Master" onAdd={handleAdd} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(b: Branch) => b.id} loading={loading} />
      <MasterFormModal<BranchFormValues>
        open={modalOpen}
        title={editing ? 'Edit Branch' : 'Add Branch'}
        fields={fields}
        defaultValues={
          editing
            ? {
                branchCode: editing.branch_code ?? '',
                branchName: editing.branch_name,
                address: editing.address ?? '',
                contactNo: editing.contact_no ?? '',
                status: String(editing.status).toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              }
            : { branchCode: nextCode, branchName: '', address: '', contactNo: '', status: 'ACTIVE' }
        }
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete branch?"
        description={confirmDelete ? `Are you sure you want to delete "${confirmDelete.branch_name}"?` : ''}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default BranchMasterPage
