/**
 * @file OutstandingReportPage.tsx
 * @description Outstanding report summarising supplier and customer balances.
 */

import type React from 'react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { purchaseInvoices, supplierPayments, suppliers, directSales, customers } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { formatCurrency } from '../../utils/format'

/**
 * @description Single outstanding row.
 */
interface OutstandingRow {
  name: string
  type: 'Supplier' | 'Customer'
  code: string
  outstanding: number
}

/**
 * @component OutstandingReportPage
 * @description Outstanding report page component.
 */
const OutstandingReportPage: React.FC = () => {
  const rows = useMemo<OutstandingRow[]>(() => {
    const supplierRows: OutstandingRow[] = suppliers.map((s) => {
      const totalPurchases = purchaseInvoices.filter((p) => p.supplierId === s.id).reduce((sum, p) => sum + p.grandTotal, 0)
      const totalPayments = supplierPayments.filter((p) => p.supplierId === s.id).reduce((sum, p) => sum + p.amount, 0)
      return {
        name: s.name,
        code: s.code,
        type: 'Supplier',
        outstanding: totalPurchases - totalPayments,
      }
    })

    const customerRows: OutstandingRow[] = customers.map((c) => {
      const totalSales = directSales.filter((s) => s.customerId === c.id).reduce((sum, s) => sum + s.invoiceTotal, 0)
      // No receipts in mock DB, so full amount remains outstanding.
      return {
        name: c.name,
        code: c.code,
        type: 'Customer',
        outstanding: totalSales,
      }
    })

    return [...supplierRows, ...customerRows].filter((r) => r.outstanding !== 0)
  }, [])

  const totalOutstanding = rows.reduce((sum, r) => sum + r.outstanding, 0)

  return (
    <div>
      <PageHeader title="Outstanding Report" breadcrumb={['Reports', 'Outstanding Report']} />
      <Toolbar
        onExportExcel={() => toast.info('Exported outstanding report to Excel (mock).')}
        onExportPdf={() => toast.info('Exported outstanding report to PDF (mock).')}
        onPrint={() => toast.info('Sending outstanding report to printer (mock).')}
        onRefresh={() => toast.success('Outstanding report refreshed.')}
        onColumnChooser={undefined}
      />

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white/80 p-3 text-[11px] text-slate-700 shadow-sm">
        <table className="min-w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Code</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={`${row.type}-${row.code}`}>
                <td className="px-3 py-1.5">{row.type}</td>
                <td className="px-3 py-1.5">{row.code}</td>
                <td className="px-3 py-1.5">{row.name}</td>
                <td className="px-3 py-1.5">{formatCurrency(row.outstanding)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-slate-100 bg-slate-50 text-slate-700">
            <tr>
              <td className="px-3 py-2" colSpan={3}>
                Total Outstanding
              </td>
              <td className="px-3 py-2">{formatCurrency(totalOutstanding)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default OutstandingReportPage