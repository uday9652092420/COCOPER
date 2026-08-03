/**
 * @file DashboardPage.tsx
 * @description Main analytics dashboard for COCOS.
 */

import type React from 'react'
import { useMemo, useState, useEffect } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { warehouses, suppliers, customers, purchaseInvoices, directSales } from '../../mock/db'
import { StatCard } from '../../components/common/StatCard'
import { ChartCard } from '../../components/common/ChartCard'
import { PageHeader } from '../../components/common/PageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/format'
import { Factory, UserCircle2, ShoppingBag, ReceiptIndianRupee, Truck, AlertTriangle } from 'lucide-react'

/**
 * @component DashboardPage
 * @description Dashboard page component with KPIs and charts.
 */
const DashboardPage: React.FC = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 600)
    return () => clearTimeout(id)
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const stats = useMemo(() => {
    const todaysPurchase = purchaseInvoices.filter((p) => p.invoiceDate === today).reduce((sum, p) => sum + p.grandTotal, 0)
    const todaysSales = directSales.filter((s) => s.invoiceDate === today).reduce((sum, s) => sum + s.invoiceTotal, 0)
    const pendingDispatch = 12
    const outstandingAmount = 1250000

    return {
      suppliers: suppliers.length,
      customers: customers.length,
      todaysPurchase,
      todaysSales,
      pendingDispatch,
      outstandingAmount,
    }
  }, [])

  const monthlyPurchase = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => ({
        month: `M${idx + 1}`,
        value: purchaseInvoices.filter((p) => new Date(p.invoiceDate).getMonth() === idx).reduce((sum, p) => sum + p.grandTotal, 0) / 1000,
      })),
    []
  )

  const monthlySales = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, idx) => ({
        month: `M${idx + 1}`,
        value: directSales.filter((s) => new Date(s.invoiceDate).getMonth() === idx).reduce((sum, s) => sum + s.invoiceTotal, 0) / 1000,
      })),
    []
  )

  const topCustomers = useMemo(() => {
    const map = new Map<string, number>()
    directSales.forEach((s) => {
      map.set(s.customerId, (map.get(s.customerId) ?? 0) + s.invoiceTotal)
    })
    return customers
      .map((c) => ({ name: c.name, value: (map.get(c.id) ?? 0) / 1000 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [])

  const topSuppliers = useMemo(() => {
    const map = new Map<string, number>()
    purchaseInvoices.forEach((p) => {
      map.set(p.supplierId, (map.get(p.supplierId) ?? 0) + p.grandTotal)
    })
    return suppliers
      .map((s) => ({ name: s.name, value: (map.get(s.id) ?? 0) / 1000 }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [])

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" breadcrumb={['Home', 'Dashboard']} />
        <LoadingSpinner label="Loading dashboard metrics..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Dashboard" breadcrumb={['Home', 'Dashboard']} />

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Suppliers" value={stats.suppliers.toString()} icon={<Factory className="h-4 w-4" />} accentClassName="bg-emerald-100 text-emerald-700" />
        <StatCard label="Total Customers" value={stats.customers.toString()} icon={<UserCircle2 className="h-4 w-4" />} accentClassName="bg-lime-100 text-lime-700" />
        <StatCard label="Today's Purchase" value={formatCurrency(stats.todaysPurchase)} icon={<ShoppingBag className="h-4 w-4" />} accentClassName="bg-blue-100 text-blue-700" />
        <StatCard label="Today's Sales" value={formatCurrency(stats.todaysSales)} icon={<ReceiptIndianRupee className="h-4 w-4" />} accentClassName="bg-amber-100 text-amber-700" />
        <StatCard label="Pending Dispatch" value={stats.pendingDispatch.toString()} icon={<Truck className="h-4 w-4" />} accentClassName="bg-violet-100 text-violet-700" />
        <StatCard label="Outstanding Amount" value={formatCurrency(stats.outstandingAmount)} icon={<AlertTriangle className="h-4 w-4" />} accentClassName="bg-rose-100 text-rose-700" />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Monthly Purchase (₹ in thousands)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyPurchase}>
              <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
              <Bar dataKey="value" radius={6} fill="#2E7D32" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Sales (₹ in thousands)">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySales}>
              <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(52,211,153,0.08)' }} />
              <Bar dataKey="value" radius={6} fill="#66BB6A" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartCard title="Top Customers (₹ in thousands)">
          <div className="space-y-2 text-xs">
            {topCustomers.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-2xl bg-white/80 p-2 shadow-sm">
                <span className="truncate text-slate-700">{row.name}</span>
                <span className="font-semibold text-emerald-700">{row.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top Suppliers (₹ in thousands)">
          <div className="space-y-2 text-xs">
            {topSuppliers.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-2xl bg-white/80 p-2 shadow-sm">
                <span className="truncate text-slate-700">{row.name}</span>
                <span className="font-semibold text-emerald-700">{row.value.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

export default DashboardPage
