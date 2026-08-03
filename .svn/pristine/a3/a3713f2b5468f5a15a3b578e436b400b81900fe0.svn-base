/**
 * @file SupplierStatementPage.tsx
 * @description Supplier statement report showing purchases, payments and running balance.
 */

import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { purchaseInvoices, supplierPayments, suppliers } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @description Combined supplier statement row.
 */
interface SupplierStatementRow {
  date: string
  voucher: string
  purchase: number
  payment: number
  balance: number
}

/**
 * @component SupplierStatementPage
 * @description Supplier statement page component.
 */
const SupplierStatementPage: React.FC = () => {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? '')

  const rows = useMemo<SupplierStatementRow[]>(() => {
    if (!supplierId) return []
    const purchaseRows = purchaseInvoices
      .filter((p) => p.supplierId === supplierId)
      .map((p) => ({
        date: p.invoiceDate,
        voucher: p.invoiceNo,
        purchase: p.grandTotal,
        payment: 0,
      }))

    const paymentRows = supplierPayments
      .filter((p) => p.supplierId === supplierId)
      .map((p) => ({
        date: p.date,
        voucher: p.paymentNumber,
        purchase: 0,
        payment: p.amount,
      }))

    const combined = [...purchaseRows, ...paymentRows].sort((a, b) => a.date.localeCompare(b.date))

    let balance = 0
    return combined.map((row) => {
      balance += row.purchase - row.payment
      return { ...row, balance }
    })
  }, [supplierId])

  const totalPurchase = rows.reduce((sum, r) => sum + r.purchase, 0)
  const totalPayment = rows.reduce((sum, r) => sum + r.payment, 0)
  const closingBalance = rows.length ? rows[rows.length - 1].balance : 0

  const supplier = suppliers.find((s) => s.id === supplierId)

  return (
    <div>
      <PageHeader title="Supplier Statement" breadcrumb={['Reports', 'Supplier Statement']} />
      <Toolbar
        onExportExcel={() => toast.info('Exported supplier statement to Excel (mock).')}
        onExportPdf={() => toast.info('Exported supplier statement to PDF (mock).')}
        onPrint={() => toast.info('Sending supplier statement to printer (mock).')}
        onRefresh={() => toast.success('Supplier statement refreshed.')}
      />

      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
        <label className="text-[11px] font-medium text-slate-700">Supplier</label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="min-w-[200px] rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs"
        >
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {supplier ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] text-emerald-800">Code: {supplier.code}</span> : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 p-3 shadow-sm">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Voucher</th>
              <th className="px-3 py-2">Purchase</th>
              <th className="px-3 py-2">Payment</th>
              <th className="px-3 py-2">Running Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row, idx) => (
              <tr key={`${row.voucher}-${idx}`}>
                <td className="px-3 py-1.5">{formatDate(row.date)}</td>
                <td className="px-3 py-1.5">{row.voucher}</td>
                <td className="px-3 py-1.5">{row.purchase ? formatCurrency(row.purchase) : ''}</td>
                <td className="px-3 py-1.5">{row.payment ? formatCurrency(row.payment) : ''}</td>
                <td className="px-3 py-1.5">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-100 bg-slate-50 text-slate-700">
            <tr>
              <td className="px-3 py-2" colSpan={2}>
                Totals
              </td>
              <td className="px-3 py-2">{formatCurrency(totalPurchase)}</td>
              <td className="px-3 py-2">{formatCurrency(totalPayment)}</td>
              <td className="px-3 py-2">{formatCurrency(closingBalance)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default SupplierStatementPage
