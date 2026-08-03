/**
 * @file Sidebar.tsx
 * @description Application sidebar navigation with global collapse/expand support.
 */

import type React from 'react'
import {
  Home,
  LayoutDashboard,
  Warehouse,
  Package,
  PackageOpen,
  Users,
  ShoppingCart,
  ReceiptIndianRupee,
  FileText,
  ClipboardList,
  BarChart3,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { useUIStore } from '../../store/uiStore'

/**
 * @interface NavItem
 * @description Single navigation item configuration.
 */
interface NavItem {
  /** Target route path */
  to: string
  /** Display label */
  label: string
  /** Icon element */
  icon: React.ReactNode
}

/**
 * @constant primaryItems
 * @description Top-level navigation items.
 */
const primaryItems: NavItem[] = [
  { to: '/', label: 'Home', icon: <Home className="h-4 w-4" /> },
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
]

/**
 * @constant masterItems
 * @description Master data section items.
 */
const masterItems: NavItem[] = [
  { to: '/masters/warehouses', label: 'Warehouses', icon: <Warehouse className="h-4 w-4" /> },
  { to: '/masters/items', label: 'Items', icon: <Package className="h-4 w-4" /> },
  { to: '/masters/gunny-bags', label: 'Gunny Bags', icon: <PackageOpen className="h-4 w-4" /> },
  { to: '/masters/suppliers', label: 'Suppliers', icon: <Users className="h-4 w-4" /> },
  { to: '/masters/customers', label: 'Customers', icon: <Users className="h-4 w-4" /> },
  { to: '/masters/labors', label: 'Labor Staff', icon: <Users className="h-4 w-4" /> },
  { to: '/masters/bag-purchase', label: 'Bag Purchase', icon: <Users className="h-4 w-4" /> },
]

/**
 * @constant transactionItems
 * @description Transaction section items.
 */
const transactionItems: NavItem[] = [
  { to: '/transactions/purchase-order', label: 'Purchase Order', icon: <ShoppingCart className="h-4 w-4" /> },
  { to: '/transactions/purchase-invoice', label: 'Purchase Invoice', icon: <ReceiptIndianRupee className="h-4 w-4" /> },
  { to: '/transactions/direct-sales', label: 'Sales', icon: <ShoppingCart className="h-4 w-4" /> },
  { to: '/transactions/loading-dispatch', label: 'Loading & Dispatch', icon: <ClipboardList className="h-4 w-4" /> },
  { to: '/transactions/customer-receipt', label: 'Customer Receipt', icon: <ReceiptIndianRupee className="h-4 w-4" /> },
  { to: '/transactions/supplier-payment', label: 'Supplier Payment', icon: <ReceiptIndianRupee className="h-4 w-4" /> },
  { to: '/transactions/labour-attendance', label: 'Labor Payment', icon: <ClipboardList className="h-4 w-4" /> },

  
]

/**
 * @constant reportItems
 * @description Reporting section items.
 */
const reportItems: NavItem[] = [
  { to: '/reports/purchase-register', label: 'Purchase Register', icon: <FileText className="h-4 w-4" /> },
  { to: '/reports/sales-register', label: 'Sales Register', icon: <FileText className="h-4 w-4" /> },
  { to: '/reports/supplier-statement', label: 'Supplier Statement', icon: <BarChart3 className="h-4 w-4" /> },
  { to: '/reports/customer-statement', label: 'Customer Statement', icon: <BarChart3 className="h-4 w-4" /> },
  { to: '/reports/labour-attendance', label: 'Labour Attendance', icon: <FileText className="h-4 w-4" /> },
  { to: '/reports/pending-dispatch', label: 'Pending Dispatch', icon: <ClipboardList className="h-4 w-4" /> },
  { to: '/reports/outstanding', label: 'Outstanding', icon: <BarChart3 className="h-4 w-4" /> },
]

/**
 * @function isItemActive
 * @description Checks if a navigation item is active for the current path.
 */
const isItemActive = (currentPath: string, targetPath: string): boolean =>
  currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)

/**
 * @component Sidebar
 * @description Collapsible sidebar navigation that reacts to global UI store state.
 */
export const Sidebar: React.FC = () => {
  const location = useLocation()
  const { sidebarCollapsed } = useUIStore()

  const baseItemClasses =
    'group flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors'
  const baseIconClasses =
    'flex h-7 w-7 items-center justify-center rounded-full border text-slate-500 border-transparent bg-transparent group-hover:border-emerald-500/40 group-hover:bg-emerald-50'

  return (
    <aside
      className={`flex h-full flex-col border-r border-slate-100 bg-white/90 pb-4 pt-3 shadow-sm backdrop-blur transition-[width] duration-200 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo area (small when collapsed) */}
      <div className="mb-3 flex items-center justify-center px-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-lime-400 text-xs font-bold text-white shadow-md">
          CO
        </div>
        {!sidebarCollapsed && (
          <div className="ml-2 flex flex-col leading-tight">
            <span className="text-[11px] font-semibold text-slate-900">COCOS</span>
            <span className="text-[10px] text-slate-500">Coconut Management</span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2">
        {/* Primary */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Main</p>
          )}
          {primaryItems.map((item) => {
            const active = isItemActive(location.pathname, item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${baseItemClasses} ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span
                  className={`${baseIconClasses} ${
                    active ? 'border-emerald-500/60 bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Masters */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Masters</p>
          )}
          {masterItems.map((item) => {
            const active = isItemActive(location.pathname, item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${baseItemClasses} ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span
                  className={`${baseIconClasses} ${
                    active ? 'border-emerald-500/60 bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Transactions */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Transactions</p>
          )}
          {transactionItems.map((item) => {
            const active = isItemActive(location.pathname, item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${baseItemClasses} ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span
                  className={`${baseIconClasses} ${
                    active ? 'border-emerald-500/60 bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Reports */}
        <div className="space-y-1">
          {!sidebarCollapsed && (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Reports</p>
          )}
          {reportItems.map((item) => {
            const active = isItemActive(location.pathname, item.to)
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`${baseItemClasses} ${
                  active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span
                  className={`${baseIconClasses} ${
                    active ? 'border-emerald-500/60 bg-emerald-50 text-emerald-700' : ''
                  }`}
                >
                  {item.icon}
                </span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar
