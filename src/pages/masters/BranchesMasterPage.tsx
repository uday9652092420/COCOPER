/**
 * @file BranchesMasterPage.tsx
 * @description User Branches — assign available branches to a user and
 *              choose which of the assigned branches is the default.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { GitBranch, Save, Star, UserRound } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { getUsers, type OrgUser } from '../../services/usersservices/users.service'
import {
  getBranches,
  getUserBranches,
  setUserBranches,
  type Branch,
} from '../../services/branchesservices/branches.service'

const BranchesMasterPage: React.FC = () => {
  const [users, setUsers] = useState<OrgUser[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [assignedBranchIds, setAssignedBranchIds] = useState<string[]>([])
  const [defaultBranchId, setDefaultBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getUsers(), getBranches()])
      .then(([usersList, branchesList]) => {
        setUsers(usersList)
        setBranches(
          branchesList.filter((b) => b.status.toUpperCase() === 'ACTIVE')
        )
      })
      .catch(() => toast.error('Failed to load user branches data'))
      .finally(() => setLoading(false))
  }, [])

  // Load the selected user's current branch assignment.
  useEffect(() => {
    if (!selectedUserId) {
      setAssignedBranchIds([])
      setDefaultBranchId(null)
      return
    }

    getUserBranches(selectedUserId)
      .then((result) => {
        setAssignedBranchIds(result.branch_ids ?? [])
        setDefaultBranchId(result.default_branch_id ?? null)
      })
      .catch(() => {
        setAssignedBranchIds([])
        setDefaultBranchId(null)
      })
  }, [selectedUserId])

  const toggleBranch = (branchId: string) => {
    setAssignedBranchIds((prev) => {
      const exists = prev.includes(branchId)

      if (exists) {
        if (defaultBranchId === branchId) setDefaultBranchId(null)
        return prev.filter((id) => id !== branchId)
      }

      return [...prev, branchId]
    })
  }

  const toggleDefault = (branchId: string) => {
    setDefaultBranchId((prev) => (prev === branchId ? null : branchId))
  }

  const handleSave = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    try {
      setSaving(true)
      await setUserBranches(selectedUserId, {
        branchIds: assignedBranchIds,
        defaultBranchId,
      })
      toast.success('Branch assignment saved successfully')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to save branch assignment')
    } finally {
      setSaving(false)
    }
  }

  const assignedBranches = useMemo(
    () => branches.filter((b) => assignedBranchIds.includes(b.id)),
    [branches, assignedBranchIds]
  )

  if (loading) {
    return (
      <div>
        <PageHeader
          title="User Branches"
          breadcrumb={['Masters', 'User Branches']}
        />
        <LoadingSpinner label="Loading user branches..." />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="User Branches"
        breadcrumb={['Masters', 'User Branches']}
      />

      {/* User selector */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            <UserRound className="h-3 w-3" />
            Select User
          </p>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full min-w-[260px] rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
          >
            <option value="">Select User</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.username} ({user.username})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !selectedUserId}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" />
          {saving ? 'Saving...' : 'Save Assignment'}
        </button>
      </div>

      {!selectedUserId ? (
        <div className="rounded-2xl border border-slate-100 bg-white/90 p-8 text-center text-xs text-slate-500 shadow-sm">
          Select a user to assign branches and set a default branch.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Available branches */}
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-[#2E7D32]" />

              <h2 className="text-sm font-semibold text-slate-800">
                Branches
              </h2>

              <span className="ml-auto text-[11px] text-slate-400">
                {assignedBranchIds.length}/{branches.length} selected
              </span>
            </div>

            {branches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
                No branches available.
              </div>
            ) : (
              <div className="space-y-2">
                {branches.map((branch) => {
                  const checked = assignedBranchIds.includes(branch.id)

                  return (
                    <label
                      key={branch.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                        checked
                          ? 'border-emerald-500/60 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleBranch(branch.id)}
                        className="h-4 w-4 rounded border-slate-300 text-[#2E7D32] focus:ring-[#2E7D32]"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {branch.branch_name}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {branch.branch_code || 'No code'}
                          {branch.address ? ` · ${branch.address}` : ''}
                        </p>
                      </div>

                      {defaultBranchId === branch.id ? (
                        <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                      ) : null}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Default branches */}
          <div className="rounded-2xl border border-slate-100 bg-white/90 p-4 shadow-sm md:p-5">
            <div className="mb-3 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />

              <h2 className="text-sm font-semibold text-slate-800">
                Default Branches
              </h2>

              <span className="ml-auto text-[11px] text-slate-400">
                choose one
              </span>
            </div>

            {assignedBranches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-xs text-slate-400">
                Assign branches first, then mark one as the default branch.
              </div>
            ) : (
              <div className="space-y-2">
                {assignedBranches.map((branch) => {
                  const isDefault = defaultBranchId === branch.id

                  return (
                    <label
                      key={branch.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                        isDefault
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isDefault}
                        onChange={() => toggleDefault(branch.id)}
                        className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {branch.branch_name}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {branch.branch_code || 'No code'}
                        </p>
                      </div>

                      {isDefault ? (
                        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Default
                        </span>
                      ) : null}
                    </label>
                  )
                })}
              </div>
            )}

            <p className="mt-3 text-[11px] text-slate-400">
              The default branch is used when the user logs in or performs
              branch-specific actions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default BranchesMasterPage
