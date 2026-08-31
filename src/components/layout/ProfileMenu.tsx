/**
 * @file ProfileMenu.tsx
 * @description Profile dropdown shown when the user taps their avatar.
 *              Allows viewing user details, updating profile and changing password.
 */

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ChevronDown, KeyRound, UserRound } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import {
  getProfile,
  type Profile,
} from '../../services/profileservices/profile.service'

const DEFAULT_AVATAR =
  'https://pub-cdn.sider.ai/u/U0VEH8VKN6G/web-coder/6a61c625388e2f3cd0e01060/resource/b02b3ed2-19f2-4acf-94db-7870bd977184.jpg'

/**
 * @component ProfileMenu
 * @description Avatar + dropdown menu with profile actions.
 */
export const ProfileMenu: React.FC = () => {
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [open, setOpen] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    getProfile(user.id, user.isSuperAdmin ? 'super' : 'org')
      .then(setProfile)
      .catch(() => setProfile(null))
  }, [user])

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!user) return null

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2"
      >
        <div className="h-8 w-8 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
          <img
            src={profile?.profile_picture || DEFAULT_AVATAR}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        </div>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl">
          <div className="border-b border-slate-100 pb-3">
            <p className="text-sm font-semibold text-slate-900">
              {profile?.full_name || user.fullName || (user.username ? user.username.split('@')[0] : 'User')}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {user.isSuperAdmin ? 'Super Admin' : user.role}
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                navigate('/profile')
              }}
              className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
            >
              <UserRound className="h-3.5 w-3.5 text-slate-400" />
              Edit Profile
            </button>

            {!user.isSuperAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/profile/password')
                }}
                className="flex w-full items-center gap-2 rounded-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                Change Password
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

    </div>
  )
}

export default ProfileMenu
