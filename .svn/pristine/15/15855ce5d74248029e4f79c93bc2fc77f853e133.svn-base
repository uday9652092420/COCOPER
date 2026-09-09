/**
 * @file RolesMasterPage.tsx
 * @description Roles Master maintenance screen.
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
import { formatDate } from '../../utils/format'
import { usePermissions } from '../../hooks/usePermissions'
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  type Role,
} from '../../services/rolesservices/roles.service'

interface RoleFormValues {
  roleName: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

const RolesMasterPage: React.FC = () => {
  const { can } = usePermissions()
  const [records, setRecords] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null)
  const [modalKey, setModalKey] = useState(0)

  const loadRoles = async () => {
    try {
      setLoading(true)
      setRecords(await getRoles())
    } catch (error) {
      console.error(error)
      toast.error('Failed to load roles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRoles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const q = search.toLowerCase()
        return !q || r.role_name.toLowerCase().includes(q) || (r.description ?? '').toLowerCase().includes(q)
      }),
    [records, search]
  )

  const fields: FormFieldConfig[] = [
    { name: 'roleName', label: 'Role Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
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

  const handleSave = async (values: RoleFormValues, resetAfter: boolean) => {
    try {
      if (editing) {
        await updateRole(editing.id, {
          role_name: values.roleName,
          description: values.description,
          status: values.status,
        })
        toast.success('Role updated successfully')
      } else {
        await createRole({
          role_name: values.roleName,
          description: values.description,
          status: values.status,
        })
        toast.success('Role created successfully')
      }

      await loadRoles()

      if (!resetAfter) {
        setModalOpen(false)
        setEditing(null)
        return
      }

      setEditing(null)
      setModalKey((key) => key + 1)
      setModalOpen(true)
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to save role')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteRole(confirmDelete.id)
      toast.success('Role deleted successfully')
      setConfirmDelete(null)
      await loadRoles()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to delete role')
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'role_name', label: 'Role Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Role) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created Date',
      render: (row: Role) => formatDate(row.created_at),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      render: (row: Role) => (
        <div className="flex items-center gap-2">
          {can('roles', 'edit') ? (
            <button
              type="button"
              onClick={() => {
                setEditing(row)
                setModalKey((key) => key + 1)
                setModalOpen(true)
              }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
          ) : null}
          {can('roles', 'delete') && !row.is_system_role ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(row)}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Roles Master" breadcrumb={['Masters', 'Roles Master']} />
      <Toolbar title="Roles Master" onAdd={can('roles', 'create') ? () => { setEditing(null); setModalKey((key) => key + 1); setModalOpen(true) } : undefined} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(r: Role) => r.id} loading={loading} />
      <MasterFormModal<RoleFormValues>
        key={`role-modal-${modalKey}`}
        open={modalOpen}
        title={editing ? 'Edit Role' : 'Add Role'}
        fields={fields}
        defaultValues={
          editing
            ? { roleName: editing.role_name, description: editing.description ?? '', status: (editing.status as 'ACTIVE' | 'INACTIVE') || 'ACTIVE' }
            : { roleName: '', description: '', status: 'ACTIVE' }
        }
        onClose={() => { setModalOpen(false); setEditing(null); setModalKey((key) => key + 1) }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete role?"
        description={confirmDelete ? `Are you sure you want to delete "${confirmDelete.role_name}"?` : ''}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default RolesMasterPage
