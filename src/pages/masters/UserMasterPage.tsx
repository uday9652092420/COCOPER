/**
 * @file UserMasterPage.tsx
 * @description User Master maintenance screen (organization users).
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
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  type OrgUser,
} from '../../services/usersservices/users.service'
import { getRoles, type Role } from '../../services/rolesservices/roles.service'
import { getStoredOrganizationId } from '../../services/organizationservices/organization.service'
import { usePermissions } from '../../hooks/usePermissions'

interface UserFormValues {
  username: string
  password: string
  fullName: string
  email: string
  mobileNo: string
  role: string
  status: 'ACTIVE' | 'INACTIVE'
}

const UserMasterPage: React.FC = () => {
  const { can } = usePermissions()
  const [records, setRecords] = useState<OrgUser[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<OrgUser | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<OrgUser | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [users, rolesList] = await Promise.all([
        getUsers(),
        getRoles(),
      ])
      setRecords(users)
      setRoles(rolesList)
    } catch (error) {
      console.error(error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((u) => {
        const q = search.toLowerCase()
        return (
          !q ||
          u.username.toLowerCase().includes(q) ||
          (u.full_name ?? '').toLowerCase().includes(q) ||
          (u.email ?? '').toLowerCase().includes(q)
        )
      }),
    [records, search]
  )

  const fields: FormFieldConfig[] = [
    { name: 'username', label: 'Username', type: 'text', required: true, readOnly: Boolean(editing) },
    { name: 'password', label: editing ? 'Password (leave blank to keep)' : 'Password', type: 'text' },
    { name: 'fullName', label: 'Full Name', type: 'text' },
    { name: 'email', label: 'Email', type: 'text' },
    { name: 'mobileNo', label: 'Mobile No', type: 'text' },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: roles.map((r) => ({ label: r.role_name, value: r.role_name })),
    },
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

  const handleSave = async (values: UserFormValues) => {
    const organizationId = getStoredOrganizationId()

    try {
      if (editing) {
        await updateUser(editing.id, {
          full_name: values.fullName,
          email: values.email,
          mobile_no: values.mobileNo,
          role: values.role,
          status: values.status,
          password: values.password || undefined,
        })
        toast.success('User updated successfully')
      } else {
        if (!organizationId) {
          toast.error('Please select an organization first')
          return
        }
        if (!values.password || values.password.length < 6) {
          toast.error('Password must be at least 6 characters')
          return
        }
        await createUser({
          organization_id: organizationId,
          username: values.username,
          password: values.password,
          full_name: values.fullName,
          email: values.email,
          mobile_no: values.mobileNo,
          role: values.role,
          status: values.status,
        })
        toast.success('User created successfully')
      }

      setModalOpen(false)
      setEditing(null)
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to save user')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteUser(confirmDelete.id)
      toast.success('User deleted successfully')
      setConfirmDelete(null)
      await loadData()
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to delete user')
      setConfirmDelete(null)
    }
  }

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      render: (row: OrgUser) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${String(row.status).toUpperCase() === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created Date',
      render: (row: OrgUser) => formatDate(row.created_at),
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      render: (row: OrgUser) => (
        <div className="flex items-center gap-2">
          {can('users', 'edit') ? (
            <button
              type="button"
              onClick={() => { setEditing(row); setModalOpen(true) }}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
          ) : null}
          {can('users', 'delete') ? (
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
      <PageHeader title="User Master" breadcrumb={['Masters', 'User Master']} />
      <Toolbar title="User Master" onAdd={can('users', 'create') ? () => { setEditing(null); setModalOpen(true) } : undefined} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(u: OrgUser) => u.id} loading={loading} />
      <MasterFormModal<UserFormValues>
        open={modalOpen}
        title={editing ? 'Edit User' : 'Add User'}
        fields={fields}
        defaultValues={
          editing
            ? {
                username: editing.username,
                password: '',
                fullName: editing.full_name ?? '',
                email: editing.email ?? '',
                mobileNo: editing.mobile_no ?? '',
                role: editing.role ?? '',
                status: String(editing.status).toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
              }
            : {
                username: '',
                password: '',
                fullName: '',
                email: '',
                mobileNo: '',
                role: roles[0]?.role_name ?? '',
                status: 'ACTIVE',
              }
        }
        onClose={() => { setModalOpen(false); setEditing(null) }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete user?"
        description={confirmDelete ? `Are you sure you want to delete "${confirmDelete.username}"?` : ''}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default UserMasterPage
