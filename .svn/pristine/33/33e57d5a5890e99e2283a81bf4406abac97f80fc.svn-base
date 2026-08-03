/**
 * @file LabourAttendanceReportPage.tsx
 * @description Labour attendance report with monthly attendance and OT summary.
 */

import React, { useMemo } from 'react'
import { toast } from 'sonner'
import { labourAttendances } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { formatCurrency } from '../../utils/format'

/**
 * @component LabourAttendanceReportPage
 * @description Labour attendance report page component.
 */
const LabourAttendanceReportPage: React.FC = () => {
  const monthly = useMemo(() => {
    const map = new Map<string, { days: number; ot: number; amount: number }>()
    labourAttendances.forEach((r) => {
      const month = r.attendanceDate.slice(0, 7)
      const entry = map.get(month) ?? { days: 0, ot: 0, amount: 0 }
      entry.days += 1
      entry.ot += r.otHours
      entry.amount += r.totalOtAmount
      map.set(month, entry)
    })
    return Array.from(map.entries()).map(([month, v]) => ({
      month,
      ...v,
    }))
  }, [])

  const totalOt = labourAttendances.reduce((sum, r) => sum + r.totalOtAmount, 0)

  return (
    <div>
      <PageHeader title="Labour Attendance Report" breadcrumb={['Reports', 'Labour Attendance']} />
      <Toolbar
        onExportExcel={() => toast.info('Exported labour attendance report to Excel (mock).')}
        onExportPdf={() => toast.info('Exported labour attendance report to PDF (mock).')}
        onPrint={() => toast.info('Sending labour attendance report to printer (mock).')}
        onRefresh={() => toast.success('Labour attendance report refreshed.')}
      />

      <div className="mb-3 rounded-3xl border border-slate-100 bg-white/80 p-3 text-[11px] text-slate-700 shadow-sm">
        <p className="mb-1 font-semibold text-slate-800">Monthly Attendance Summary</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2">Month</th>
                <th className="px-3 py-2">Attendance Days</th>
                <th className="px-3 py-2">OT Hours</th>
                <th className="px-3 py-2">OT Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthly.map((m) => (
                <tr key={m.month}>
                  <td className="px-3 py-1.5">{m.month}</td>
                  <td className="px-3 py-1.5">{m.days}</td>
                  <td className="px-3 py-1.5">{m.ot}</td>
                  <td className="px-3 py-1.5">{formatCurrency(m.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Total OT Payout:</span> {formatCurrency(totalOt)}
      </div>
    </div>
  )
}

export default LabourAttendanceReportPage
