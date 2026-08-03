/**
 * @file Home.tsx
 * @description Landing page shown after login with shortcut to Dashboard.
 */

import type React from 'react'
import { useNavigate } from 'react-router'
import { ArrowRightCircle } from 'lucide-react'

/**
 * @component HomePage
 * @description Simple welcome panel with app logo and link to dashboard.
 */
export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 rounded-3xl border border-emerald-50 bg-white/80 p-6 text-center shadow-sm backdrop-blur">
      <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-lime-400 text-2xl font-bold text-white shadow-lg">
        CO
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">COCOS</h1>
        <p className="mt-1 text-xs text-slate-500">Coconut Wholesale Management System</p>
      </div>
      <p className="max-w-xl text-xs text-slate-500">
        Manage warehouses, suppliers, customers, purchases, sales, loading and dispatches in a
        modern, lightweight application designed specifically for coconut wholesalers.
      </p>
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="inline-flex items-center gap-2 rounded-full bg-[#2E7D32] px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-[#256427]"
      >
        Go to Dashboard
        <ArrowRightCircle className="h-4 w-4" />
      </button>
    </div>
  )
}
