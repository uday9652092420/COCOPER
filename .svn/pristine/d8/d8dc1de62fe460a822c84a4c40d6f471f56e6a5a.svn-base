/**
 * @file PendingDispatchReportPage.tsx
 * @description Pending dispatch report using dispatch data.
 */

import type React from 'react'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { dispatches, customers, type Dispatch } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import DataGrid, { type Column } from '../../components/common/DataGrid'

/**
 * @component PendingDispatchReportPage
 * @description Pending dispatch report page component.
 */
const PendingDispatchReportPage: React.FC = () => {
  const pending = useMemo(() => dispatches.filter((d) => d.dispatchStatus !== 'Dispatched'), [])

  const columns: Column<Dispatch>[] = [
    { key: 'dispatchNumber', label: 'Dispatch No' },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    { key: 'lorryNumber', label: 'Lorry No' },
    {
      key: 'dispatchStatus',
      label: 'Status',
    },
    {
      key: 'invoiceGenerated',
      label: 'Invoice Generated',
      render: (row) => (row.invoiceGenerated ? 'Yes' : 'No'),
    },
  ]

  const totalPending = useMemo(() => pending.length, [pending])

  return (
    <div>
      <PageHeader title="Pending Dispatch" breadcrumb={['Reports', 'Pending Dispatch']} />
      <Toolbar
        onExportExcel={() => toast.info('Exported pending dispatch report to Excel (mock).')}
        onExportPdf={() => toast.info('Exported pending dispatch report to PDF (mock).')}
        onPrint={() => toast.info('Sending pending dispatch report to printer (mock).')}
        onRefresh={() => toast.success('Pending dispatch report refreshed.')}
        onColumnChooser={undefined}
      />

      <DataGrid<Dispatch>
        data={pending}
        columns={columns}
        getRowId={(row) => row.id}
        loading={false}
        onView={undefined}
        onEdit={undefined}
        onDelete={undefined}
        onPrint={(row) => toast.info(`Printing dispatch ${row.dispatchNumber} (mock).`)}
      />

      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Pending Dispatch Count:</span> {totalPending}
      </div>
    </div>
  )
}

export default PendingDispatchReportPage