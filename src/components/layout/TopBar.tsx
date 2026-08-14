/**
 * @file TopBar.tsx
 * @description Application top navigation bar with logo, language selector and user profile.
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import { Bell, Building2, LogOut, Network } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore, type LanguageCode } from '../../store/uiStore'
import {
  getOrganizations,
  type OrganizationSummary,
} from '../../services/organizationservices/organization.service'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import { ProfileMenu } from './ProfileMenu'

/**
 * @description Language option representation.
 */
const languageOptions: { code: LanguageCode; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'Telugu' },
  { code: 'ta', label: 'Tamil' },
  { code: 'kn', label: 'Kannada' },
  { code: 'hi', label: 'Hindi' },
]

/**
 * @component TopBar
 * @description Top navigation bar used inside MainLayout.
 */
export const TopBar: React.FC = () => {
  const {
    user,
    logout,
    selectedOrganizationId,
    setSelectedOrganization,
  } = useAuthStore()

  const { language, setLanguage } = useUIStore()

  const [organizations, setOrganizations] = useState<
    OrganizationSummary[]
  >([])

  const [branches, setBranches] = useState<Branch[]>([])

  const [selectedBranchId, setSelectedBranchId] = useState<string>(
    () => localStorage.getItem('cocoper_branch_id') ?? ''
  )

  useEffect(() => {
    if (!user?.isSuperAdmin) return

    getOrganizations()
      .then(setOrganizations)
      .catch(() => setOrganizations([]))
  }, [user?.isSuperAdmin])

  useEffect(() => {
    if (!user) return

    getBranches()
      .then(setBranches)
      .catch(() => setBranches([]))
  }, [user?.id])

  const handleBranchChange = (value: string) => {
    setSelectedBranchId(value)

    if (value) {
      localStorage.setItem('cocoper_branch_id', value)
    } else {
      localStorage.removeItem('cocoper_branch_id')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/80 px-3 backdrop-blur md:px-5">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Logo */}
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md">
          <img
            src="/logo.jpg"
            alt="COCOPER Logo"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-slate-900 md:text-sm">
            COCOPER
          </span>
          <span className="text-[10px] text-slate-500 md:text-[11px]">
            Coconut Wholesale Management System
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as LanguageCode)}
          className="hidden rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-sm focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32] md:block"
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shadow-sm hover:bg-emerald-100"
        >
          <Bell className="h-4 w-4" />

          <span className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500 text-[8px] text-white">
            3
          </span>
        </button>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
          <Network className="h-3.5 w-3.5 text-emerald-600" />

          <select
            value={selectedBranchId}
            onChange={(e) => handleBranchChange(e.target.value)}
            className="max-w-[180px] rounded-full border-0 bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none"
            title="Select branch"
          >
            <option value="">All Branches</option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
        </div>

        {user?.isSuperAdmin ? (
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/60 px-2 py-1">
            <Building2 className="h-3.5 w-3.5 text-emerald-600" />

            <select
              value={selectedOrganizationId ?? ''}
              onChange={(e) =>
                setSelectedOrganization(
                  e.target.value || null
                )
              }
              className="max-w-[220px] rounded-full border-0 bg-transparent text-[11px] font-medium text-slate-700 focus:outline-none"
              title="Select organization"
            >
              <option value="">
                All Organizations
              </option>

              {organizations.map((org) => (
                <option
                  key={org.id}
                  value={org.id}
                >
                  {org.organization_code} -{' '}
                  {org.organization_name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="hidden flex-col text-right leading-tight md:flex">
          <span className="text-[11px] font-medium text-slate-800">
            {user?.username ?? 'Guest'}
          </span>

          <span className="text-[10px] text-slate-400">
            {user?.isSuperAdmin
              ? 'Super Admin'
              : user?.role ?? 'Administrator'}
          </span>
        </div>

        <ProfileMenu />

        <button
          type="button"
          onClick={logout}
          className="ml-1 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm hover:bg-slate-50 md:px-3 md:text-xs"
        >
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </button>
      </div>
    </header>
  )
}