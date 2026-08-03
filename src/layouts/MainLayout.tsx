/**
 * @file MainLayout.tsx
 * @description Primary authenticated layout with top bar and sidebar.
 */

import type React from 'react'
import { Outlet } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { TopBar } from '../components/layout/TopBar'
import { Sidebar } from '../components/layout/Sidebar'
import { useUIStore } from '../store/uiStore'

/**
 * @component MainLayout
 * @description Main application layout used for all authenticated pages.
 */
export const MainLayout: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()

  return (
    <div className="flex h-screen w-full flex-col bg-slate-50">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <div className="relative flex h-full">
          <Sidebar />
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-3 top-4 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50"
          >
            {sidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>
        </div>
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-emerald-50/40 to-lime-50/60 px-3 pb-6 pt-4 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
