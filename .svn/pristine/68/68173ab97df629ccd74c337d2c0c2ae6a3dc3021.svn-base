/**
 * @file PurchaseRegisterPage.tsx
 * @description Purchase register report listing purchase invoices.
 */

import type React from 'react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { purchaseInvoices, suppliers, warehouses, type PurchaseInvoice } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type Column } from '../../components/common/DataGrid'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @component PurchaseRegisterPage
 * @description Purchase register page component.
 */
const PurchaseRegisterPage: React.FC = () => {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      purchaseInvoices.filter((inv) => {
        const q = search.toLowerCase()
        const supplier = suppliers.find((s) => s.id === inv.supplierId)
        const wh = warehouses.find((w) => w.id === inv.warehouseId)
        return (
          !q ||
          inv.invoiceNo.toLowerCase().includes(q) ||
          supplier?.name.toLowerCase().includes(q) ||
          wh?.name.toLowerCase().includes(q)
        )
      }),
    [search]
  )

  const columns: Column<PurchaseInvoice>[] = [
    {
      key: 'invoiceDate',
      label: 'Date',
      render: (row) => formatDate(row.invoiceDate),
    },
    { key: 'invoiceNo', label: 'Invoice No' },
    {
      key: 'supplierId',
      label: 'Supplier',
      render: (row) => suppliers.find((s) => s.id === row.supplierId)?.name ?? '',
    },
    {
      key: 'warehouseId',
      label: 'Warehouse',
      render: (row) => warehouses.find((w) => w.id === row.warehouseId)?.name ?? '',
    },
    {
      key: 'grandTotal',
      label: 'Amount',
      render: (row) => formatCurrency(row.grandTotal),
    },
  ]

  const totalAmount = useMemo(() => filtered.reduce((sum, inv) => sum + inv.grandTotal, 0), [filtered])

  return (
    <div>
      <PageHeader title="Purchase Register" breadcrumb={['Reports', 'Purchase Register']} />
      <Toolbar
        onExportExcel={() => toast.info('Exported purchase register to Excel (mock).')}
        onExportPdf={() => toast.info('Exported purchase register to PDF (mock).')}
        onPrint={() => toast.info('Sending purchase register to printer (mock).')}
        onRefresh={() => toast.success('Purchase register refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by invoice, supplier, warehouse..." />
      <DataGrid<PurchaseInvoice>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={false}
        onView={undefined}
        onEdit={undefined}
        onDelete={undefined}
        onPrint={(row) => toast.info(`Printing invoice ${row.invoiceNo} (mock).`)}
      />
      <div className="mt-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[11px] text-emerald-800">
        <span className="font-semibold">Total Purchase:</span> {formatCurrency(totalAmount)}
      </div>
    </div>
  )
}

export default PurchaseRegisterPage