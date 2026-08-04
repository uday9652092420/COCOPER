/**
 * @file TopBar.tsx
 * @description Application top navigation bar with logo, language selector and user profile.
 */

import type React from 'react'
import { Bell, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useUIStore, type LanguageCode } from '../../store/uiStore'

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
  const { user, logout } = useAuthStore()
  const { language, setLanguage } = useUIStore()

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/80 px-3 backdrop-blur md:px-5">
      <div className="flex items-center gap-2 md:gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-xs font-bold text-white shadow-md">
          CO
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-xs font-semibold text-slate-900 md:text-sm">COCOS</span>
          <span className="text-[10px] text-slate-500 md:text-[11px]">Coconut Wholesale Management System</span>
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

        <div className="flex items-center gap-2">
          <div className="hidden flex-col text-right leading-tight md:flex">
            <span className="text-[11px] font-medium text-slate-800">{user?.username ?? 'Guest'}</span>
            <span className="text-[10px] text-slate-400">Administrator</span>
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border border-emerald-100 bg-emerald-50">
            <img
              src="https://pub-cdn.sider.ai/u/U0VEH8VKN6G/web-coder/6a61c625388e2f3cd0e01060/resource/b02b3ed2-19f2-4acf-94db-7870bd977184.jpg"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

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
