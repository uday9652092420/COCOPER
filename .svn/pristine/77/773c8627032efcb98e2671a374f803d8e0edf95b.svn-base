/**
 * @file ChangePasswordPage.tsx
 * @description Full-page screen for changing the current user's password.
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/common/PageHeader'
import { useAuthStore } from '../../store/authStore'
import { changePassword } from '../../services/profileservices/profile.service'

/**
 * @component ChangePasswordPage
 * @description Dedicated screen for changing the current user's password.
 */
const ChangePasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState({ old: false, next: false, confirm: false })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!oldPassword) {
      toast.error('Please enter your current password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    try {
      setSaving(true)
      await changePassword(user.id, user.isSuperAdmin ? 'super' : 'org', oldPassword, newPassword)
      toast.success('Password changed successfully')
      navigate('/dashboard')
    } catch (error: any) {
      console.error(error)
      toast.error(error?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title="Change Password"
        breadcrumb={['Profile', 'Change Password']}
        extra={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
        }
      />

      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Update your password</h2>
            <p className="text-[11px] text-slate-500">
              For @{user?.username ?? ''}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Current Password</label>
            <div className="relative">
            <input
              type={visiblePasswords.old ? 'text' : 'password'}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 pr-9 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
            <button type="button" aria-label={visiblePasswords.old ? 'Hide password' : 'Show password'} onClick={() => setVisiblePasswords((current) => ({ ...current, old: !current.old }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">{visiblePasswords.old ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">New Password</label>
            <div className="relative">
            <input
              type={visiblePasswords.next ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 pr-9 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
            <button type="button" aria-label={visiblePasswords.next ? 'Hide password' : 'Show password'} onClick={() => setVisiblePasswords((current) => ({ ...current, next: !current.next }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">{visiblePasswords.next ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-700">Confirm New Password</label>
            <div className="relative">
            <input
              type={visiblePasswords.confirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 pr-9 text-xs text-slate-900 focus:border-[#2E7D32] focus:outline-none focus:ring-1 focus:ring-[#2E7D32]"
            />
            <button type="button" aria-label={visiblePasswords.confirm ? 'Hide password' : 'Show password'} onClick={() => setVisiblePasswords((current) => ({ ...current, confirm: !current.confirm }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700">{visiblePasswords.confirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChangePasswordPage
