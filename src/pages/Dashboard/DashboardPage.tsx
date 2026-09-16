/**
 * @file DashboardPage.tsx
 * @description Main analytics dashboard for COCOS.
 */

import type React from 'react'
import { useMemo, useState, useEffect } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DirectSales } from '../../mock/db'
import { StatCard } from '../../components/common/StatCard'
import { ChartCard } from '../../components/common/ChartCard'
import { PageHeader } from '../../components/common/PageHeader'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/format'
import { Factory, UserCircle2, ShoppingBag, ReceiptIndianRupee, Truck, CircleDollarSign } from 'lucide-react'
import { getSuppliers } from '../../services/supplierservices/supplier.service'
import { getCustomers } from '../../services/customerservices/customer.service'
import { getPurchaseInvoices, type PurchaseInvoiceDTO } from '../../services/purchaseinvoiceservices/purchaseInvoice.service'
import { getDirectSales } from '../../services/directsalesservices/directSale.service'
import { getLoadingDispatches } from '../../services/loadingdispatch.service'
import { API } from '../../config/api'
import { getOrgHeader } from '../../utils/apiHeaders'
import { onScopeChange } from '../../utils/scopeEvents'
import { useAuthStore } from '../../store/authStore'

interface CustomerReceipt {
  customer_id: string
  amount: number
  organization_id?: string | null
}

interface DashboardStats {
  suppliers: number
  customers: number
  todaysPurchase: number
  todaysSales: number
  pendingDispatch: number
  customerOutstanding: number
}

interface RankedDashboardRow {
  name: string
  value: number
}

const normalizeDate = (value: string): string => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  return match ? `${match[3]}-${match[2]}-${match[1]}` : ''
}

const todayLocalDate = (): string => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * @component DashboardPage
 * @description Dashboard page component with KPIs and charts.
 */
const DashboardPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    suppliers: 0,
    customers: 0,
    todaysPurchase: 0,
    todaysSales: 0,
    pendingDispatch: 0,
    customerOutstanding: 0,
  })
  const [topCustomers, setTopCustomers] = useState<RankedDashboardRow[]>([])
  const [topSuppliers, setTopSuppliers] = useState<RankedDashboardRow[]>([])
  const [purchaseInvoices, setPurchaseInvoices] = useState<PurchaseInvoiceDTO[]>([])
  const [directSales, setDirectSales] = useState<DirectSales[]>([])

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true)
        const [supplierRows, customerRows, purchaseRows, salesRows, dispatchRows, receiptsResponse] = await Promise.all([
          getSuppliers(),
          getCustomers(),
          getPurchaseInvoices(),
          getDirectSales(),
          getLoadingDispatches(),
          fetch(`${API}/customer-receipts`, { headers: getOrgHeader() }),
        ])
        if (!receiptsResponse.ok) throw new Error('Unable to load customer receipts.')
        const receiptPayload = await receiptsResponse.json()
        const receipts: CustomerReceipt[] = Array.isArray(receiptPayload.data) ? receiptPayload.data : []
        setPurchaseInvoices(purchaseRows)
        setDirectSales(salesRows)
        const today = todayLocalDate()
        const scopedReceipts = selectedOrganizationId
          ? receipts.filter((receipt) => receipt.organization_id === selectedOrganizationId)
          : receipts
        const customerOutstanding = salesRows
          .filter((sale) => sale.approved === true && (!selectedOrganizationId || sale.organizationId === selectedOrganizationId))
          .reduce((total, sale) => total + Number(sale.invoiceTotal || 0), 0)
          - scopedReceipts.reduce((total, receipt) => total + Number(receipt.amount || 0), 0)

        const customerSales = new Map<string, number>()
        salesRows.forEach((sale) => {
          if (selectedOrganizationId && sale.organizationId !== selectedOrganizationId) return
          customerSales.set(sale.customerId, (customerSales.get(sale.customerId) ?? 0) + Number(sale.invoiceTotal || 0))
        })
        setTopCustomers(
          customerRows
            .map((customer) => ({ name: customer.name, value: (customerSales.get(customer.id) ?? 0) / 1000 }))
            .sort((first, second) => second.value - first.value)
            .slice(0, 5),
        )

        const supplierPurchases = new Map<string, number>()
        purchaseRows.forEach((invoice) => {
          if (selectedOrganizationId && invoice.organizationId !== selectedOrganizationId) return
          supplierPurchases.set(invoice.supplierId, (supplierPurchases.get(invoice.supplierId) ?? 0) + Number(invoice.grandTotal || 0))
        })
        setTopSuppliers(
          supplierRows
            .map((supplier) => ({ name: supplier.name, value: (supplierPurchases.get(supplier.id) ?? 0) / 1000 }))
            .sort((first, second) => second.value - first.value)
            .slice(0, 5),
        )

        setDashboardStats({
          suppliers: supplierRows.length,
          customers: customerRows.length,
          todaysPurchase: purchaseRows
            .filter((invoice) => normalizeDate(invoice.invoiceDate) === today)
            .reduce((total, invoice) => total + Number(invoice.grandTotal || 0), 0),
          todaysSales: salesRows
            .filter((sale) => normalizeDate(sale.invoiceDate) === today)
            .reduce((total, sale) => total + Number(sale.invoiceTotal || 0), 0),
          pendingDispatch: dispatchRows.filter((dispatch) => dispatch.dispatchStatus !== 'Dispatched').length,
          customerOutstanding,
        })
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboardStats()
    return onScopeChange(() => { void loadDashboardStats() })
  }, [selectedOrganizationId])

  const monthlyPurchase = useMemo(
    () => monthLabels.map((month, idx) => ({
        month,
        value: purchaseInvoices
          .filter((invoice) => (!selectedOrganizationId || invoice.organizationId === selectedOrganizationId) && new Date(normalizeDate(invoice.invoiceDate)).getMonth() === idx)
          .reduce((sum, invoice) => sum + Number(invoice.grandTotal || 0), 0) / 1000,
      })),
    [purchaseInvoices, selectedOrganizationId]
  )

  const monthlySales = useMemo(
    () => monthLabels.map((month, idx) => ({
        month,
        value: directSales
          .filter((sale) => (!selectedOrganizationId || sale.organizationId === selectedOrganizationId) && new Date(normalizeDate(sale.invoiceDate)).getMonth() === idx)
          .reduce((sum, sale) => sum + Number(sale.invoiceTotal || 0), 0) / 1000,
      })),
    [directSales, selectedOrganizationId]
  )

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
        <StatCard label="Total Suppliers" value={dashboardStats.suppliers.toString()} icon={<Factory className="h-4 w-4" />} accentClassName="bg-emerald-100 text-emerald-700" />
        <StatCard label="Total Customers" value={dashboardStats.customers.toString()} icon={<UserCircle2 className="h-4 w-4" />} accentClassName="bg-lime-100 text-lime-700" />
        <StatCard label="Today's Purchase" value={formatCurrency(dashboardStats.todaysPurchase)} icon={<ShoppingBag className="h-4 w-4" />} accentClassName="bg-blue-100 text-blue-700" />
        <StatCard label="Today's Sales" value={formatCurrency(dashboardStats.todaysSales)} icon={<ReceiptIndianRupee className="h-4 w-4" />} accentClassName="bg-amber-100 text-amber-700" />
        <StatCard label="Pending Dispatch" value={dashboardStats.pendingDispatch.toString()} icon={<Truck className="h-4 w-4" />} accentClassName="bg-violet-100 text-violet-700" />
        <StatCard label="Customer Outstanding Amount" value={formatCurrency(dashboardStats.customerOutstanding)} icon={<CircleDollarSign className="h-4 w-4" />} accentClassName="bg-rose-100 text-rose-700" />
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
