/**
 * @file SalesRegisterPage.tsx
 * @description Sales register report listing direct sales.
 */

import type React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { directSales, customers, warehouses, type DirectSales } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type Column } from '../../components/common/DataGrid'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @component SalesRegisterPage
 * @description Sales register page component.
 */
const SalesRegisterPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      directSales.filter((inv) => {
        const q = search.toLowerCase()
        const customer = customers.find((c) => c.id === inv.customerId)
        const wh = warehouses.find((w) => w.id === inv.warehouseId)
        return !q || customer?.name.toLowerCase().includes(q) || wh?.name.toLowerCase().includes(q)
      }),
    [search]
  )

  const columns: Column<DirectSales>[] = [
    {
      key: 'invoiceDate',
      label: 'Date',
      render: (row) => formatDate(row.invoiceDate),
    },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    { key: 'customerType', label: 'Type' },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (row) => warehouses.find((w) => w.id === row.warehouseId)?.name ?? '',
    },
    {
      key: 'invoiceTotal',
      label: 'Amount',
      render: (row) => formatCurrency(row.invoiceTotal),
    },
  ]

  const totalAmount = useMemo(() => filtered.reduce((sum, inv) => sum + inv.invoiceTotal, 0), [filtered])

  return (
    <div>
      <PageHeader title="Sales Register" breadcrumb={['Reports', 'Sales Register']} />
      <Toolbar
        onExportExcel={() => toast.info('Exported sales register to Excel (mock).')}
        onExportPdf={() => toast.info('Exported sales register to PDF (mock).')}
        onPrint={() => toast.info('Sending sales register to printer (mock).')}
        onRefresh={() => toast.success('Sales register refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by customer or warehouse..." />
      <DataGrid<DirectSales>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={false}
        onView={undefined}
        onEdit={undefined}
        onDelete={undefined}
        onPrint={(row) => toast.info(`Printing direct sales ${row.id} (mock).`)}
      />
      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Total Sales:</span> {formatCurrency(totalAmount)}
      </div>
    </div>
  )
}

export default SalesRegisterPage