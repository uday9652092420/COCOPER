/**
 * @file UserPermissionPage.tsx
 * @description Assign permissions to roles.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Save, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import {
  getRoles,
  getPermissions,
  getRolePermissions,
  setRolePermissions,
  type Role,
  type PermissionDef,
} from '../../services/rolesservices/roles.service'

const UserPermissionPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<PermissionDef[]>([])
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [selectedCodes, setSelectedCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getRoles(), getPermissions()])
      .then(([rolesList, perms]) => {
        setRoles(rolesList)
        setPermissions(perms)
        if (rolesList.length > 0) {
          setSelectedRoleId(rolesList[0].id)
        }
      })
      .catch(() => toast.error('Failed to load permission data'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedRoleId) {
      setSelectedCodes([])
      return
    }

    getRolePermissions(selectedRoleId)
      .then(setSelectedCodes)
      .catch(() => setSelectedCodes([]))
  }, [selectedRoleId])

  const groupedPermissions = useMemo(() => {
    const map = new Map<string, PermissionDef[]>()
    permissions.forEach((p) => {
      if (!map.has(p.module)) map.set(p.module, [])
      map.get(p.module)!.push(p)
    })
    return Array.from(map.entries())
  }, [permissions])

  const togglePermission = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSave = async () => {
    if (!selectedRoleId) {
      toast.error('Please select a role')
      return
    }

    try {
      setSaving(true)
      await setRolePermissions(selectedRoleId, selectedCodes)
      toast.success('Permissions saved successfully')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to save permissions')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="User Permission" breadcrumb={['Masters', 'User Permission']} />
        <LoadingSpinner label="Loading permissions..." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="User Permission" breadcrumb={['Masters', 'User Permission']} />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Select Role</p>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="mt-1 w-full min-w-[200px] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] md:w-auto"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>

      <div className="space-y-4">
        {groupedPermissions.map(([module, perms]) => (
          <div key={module} className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-slate-800">{module}</h3>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {perms.map((p) => (
                <label
                  key={p.code}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCodes.includes(p.code)}
                    onChange={() => togglePermission(p.code)}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-[#2E7D32] focus:ring-[#2E7D32]"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UserPermissionPage
