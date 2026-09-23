/**
 * @file LabourAttendanceReportPage.tsx
 * @description Labour attendance report with monthly attendance and OT summary.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { LoadingSpinner } from '../../components/common/LoadingSpinner'
import {
  getMobileAttendanceDetails,
  type MobileAttendanceDetails,
} from '../../services/mobileattendance.service'

/**
 * @component LabourAttendanceReportPage
 * @description Mobile labour attendance details report page component.
 */
const LabourAttendanceReportPage: React.FC = () => {
  const [rows, setRows] = useState<MobileAttendanceDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadRows = useCallback(async () => {
    try {
      setLoading(true)
      setRows(await getMobileAttendanceDetails())
    } catch (error: any) {
      toast.error(error?.message || 'Failed to load labour attendance details')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRows()
  }, [loadRows])

  const formatDate = (value: string) =>
    value ? new Date(`${value}T00:00:00`).toLocaleDateString() : '-'
  const formatTime = (value: string | null) =>
    value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'

  return (
    <div>
      <PageHeader title="Labour Attendance Details" breadcrumb={['Reports', 'Labour Attendance Details']} />
      <Toolbar
        onExportExcel={() => toast.info('Export is not available for this report yet.')}
        onExportPdf={() => toast.info('Export is not available for this report yet.')}
        onPrint={() => window.print()}
        onRefresh={() => void loadRows()}
      />

      {loading ? <LoadingSpinner label="Loading attendance details..." /> : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white/90 shadow-sm">
          <table className="w-full min-w-[680px] border-collapse text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Attendance Date</th>
                <th className="px-4 py-3">Labour Name</th>
                <th className="px-4 py-3">In Time</th>
                <th className="px-4 py-3">Out Time</th>
                <th className="px-4 py-3">Total Working Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="text-slate-700">
                  <td className="px-4 py-3">{formatDate(row.attendance_date)}</td>
                  <td className="px-4 py-3 font-medium">{row.labour_name}</td>
                  <td className="px-4 py-3">{formatTime(row.in_time)}</td>
                  <td className="px-4 py-3">{formatTime(row.out_time)}</td>
                  <td className="px-4 py-3">{row.total_working_hours.toFixed(2)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No mobile labour attendance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default LabourAttendanceReportPage
