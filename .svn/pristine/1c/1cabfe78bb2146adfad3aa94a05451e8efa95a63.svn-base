/**
 * @file CustomerStatementPage.tsx
 * @description Customer statement report showing sales and running balance (no receipts in mock).
 */

import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { directSales, customers } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @description Customer statement row.
 */
interface CustomerStatementRow {
  date: string
  voucher: string
  sales: number
  receipt: number
  balance: number
}

/**
 * @component CustomerStatementPage
 * @description Customer statement page component.
 */
const CustomerStatementPage: React.FC = () => {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? '')

  const rows = useMemo<CustomerStatementRow[]>(() => {
    if (!customerId) return []
    const salesRows = directSales
      .filter((s) => s.customerId === customerId)
      .map((s) => ({
        date: s.invoiceDate,
        voucher: s.id,
        sales: s.invoiceTotal,
        receipt: 0,
      }))

    const combined = [...salesRows].sort((a, b) => a.date.localeCompare(b.date))

    let balance = 0
    return combined.map((row) => {
      balance += row.sales - row.receipt
      return { ...row, balance }
    })
  }, [customerId])

  const totalSales = rows.reduce((sum, r) => sum + r.sales, 0)
  const totalReceipt = rows.reduce((sum, r) => sum + r.receipt, 0)
  const closingBalance = rows.length ? rows[rows.length - 1].balance : 0

  const customer = customers.find((c) => c.id === customerId)

  return (
    <div>
      <PageHeader title="Customer Statement" breadcrumb={['Reports', 'Customer Statement']} />
      <Toolbar
        title="Customer Statement"
        onAdd={undefined}
      />
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="text-[11px] font-medium text-slate-700">Customer</label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="min-w-[200px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
        >
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {customer ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-800">Type: {customer.type}</span> : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Voucher</th>
              <th className="px-3 py-2">Sales</th>
              <th className="px-3 py-2">Receipt</th>
              <th className="px-3 py-2">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, idx) => (
              <tr key={`${row.voucher}-${idx}`}>
                <td className="px-3 py-1.5">{formatDate(row.date)}</td>
                <td className="px-3 py-1.5">{row.voucher}</td>
                <td className="px-3 py-1.5">{row.sales ? formatCurrency(row.sales) : ''}</td>
                <td className="px-3 py-1.5">{row.receipt ? formatCurrency(row.receipt) : ''}</td>
                <td className="px-3 py-1.5">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-100 bg-slate-50 text-slate-700">
            <tr>
              <td className="px-3 py-2" colSpan={2}>
                Totals
              </td>
              <td className="px-3 py-2">{formatCurrency(totalSales)}</td>
              <td className="px-3 py-2">{formatCurrency(totalReceipt)}</td>
              <td className="px-3 py-2">{formatCurrency(closingBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default CustomerStatementPage