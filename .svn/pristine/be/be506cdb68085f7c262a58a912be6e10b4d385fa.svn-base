/**
 * @file IndirectSalesPage.tsx
 * @description Indirect Sales page with a two-section modal (Supplier Transaction + Sales Transaction).
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  indirectSales as dbIndirectSales,
  suppliers,
  customers,
  items,
  purchaseInvoices,
  directSales,
  type IndirectSales,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import Toolbar from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import RowActions from '../../components/common/RowActions'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @interface LocalIndirectSales
 * @description Extended shape used locally to include selected item.
 */
interface LocalIndirectSales extends IndirectSales {
  itemId?: string
}

/**
 * @interface SupplierSectionState
 * @description Local form values for supplier (purchase) section.
 */
interface SupplierSectionState {
  supplierId: string
  itemId: string
  quantity: number
  purchaseCost: number
}

/**
 * @interface SalesSectionState
 * @description Local form values for sales section.
 */
interface SalesSectionState {
  customerId: string
  salesPrice: number
}

/**
 * @component IndirectSalesModal
 * @description Modal capturing Supplier Transaction and Sales Transaction separately.
 */
const IndirectSalesModal: React.FC<{
  open: boolean
  existing?: LocalIndirectSales | null
  onClose: () => void
  onSave: (record: LocalIndirectSales) => void
}> = ({ open, existing, onClose, onSave }) => {
  const [supplierState, setSupplierState] = useState<SupplierSectionState>({
    supplierId: '',
    itemId: '',
    quantity: 0,
    purchaseCost: 0,
  })

  const [salesState, setSalesState] = useState<SalesSectionState>({ customerId: '', salesPrice: 0 })
  const [showPriceWarning, setShowPriceWarning] = useState(false)

  /**
   * @function resetFromExisting
   * @description Populate local state when editing an existing record.
   */
  useEffect(() => {
    if (existing) {
      setSupplierState({
        supplierId: existing.supplierId,
        itemId: existing.itemId ?? '',
        quantity: existing.quantity,
        purchaseCost: existing.purchaseRate,
      })
      setSalesState({ customerId: existing.customerId, salesPrice: existing.salesRate })
    } else {
      setSupplierState({ supplierId: '', itemId: '', quantity: 0, purchaseCost: 0 })
      setSalesState({ customerId: '', salesPrice: 0 })
      setShowPriceWarning(false)
    }
  }, [existing, open])

  /**
   * @function purchaseTotal
   * @description Compute total purchase = qty * purchaseCost.
   */
  const purchaseTotal = useMemo(() => {
    const q = Number(supplierState.quantity) || 0
    const pc = Number(supplierState.purchaseCost) || 0
    return Number((q * pc).toFixed(2))
  }, [supplierState.quantity, supplierState.purchaseCost])

  /**
   * @function salesTotal
   * @description Compute total sales = qty * salesPrice.
   */
  const salesTotal = useMemo(() => {
    const q = Number(supplierState.quantity) || 0
    const sp = Number(salesState.salesPrice) || 0
    return Number((q * sp).toFixed(2))
  }, [supplierState.quantity, salesState.salesPrice])

  /**
   * @function validateAndSave
   * @description Validate business rules then emit combined record and simulate prints/bookings.
   */
  const validateAndSave = () => {
    if (!supplierState.supplierId) {
      toast.error('Select a supplier.')
      return
    }
    if (!supplierState.itemId) {
      toast.error('Select an item.')
      return
    }
    if (supplierState.quantity <= 0) {
      toast.error('Enter a valid quantity (> 0).')
      return
    }
    if (supplierState.purchaseCost <= 0) {
      toast.error('Enter a valid purchase cost (> 0).')
      return
    }
    if (!salesState.customerId) {
      toast.error('Select a customer for sales transaction.')
      return
    }
    if (salesState.salesPrice <= supplierState.purchaseCost) {
      setShowPriceWarning(true)
      toast.error('Sales price must be greater than purchase cost.')
      return
    }

    const purchaseInvoice = purchaseInvoices[0]
    const salesInvoice = directSales[0]

    const record: LocalIndirectSales = {
      id: existing?.id ?? `IS-${Date.now()}`,
      supplierId: supplierState.supplierId,
      customerId: salesState.customerId,
      itemId: supplierState.itemId,
      quantity: Number(supplierState.quantity),
      purchaseRate: Number(supplierState.purchaseCost),
      salesRate: Number(salesState.salesPrice),
      purchaseInvoiceId: purchaseInvoice.id,
      salesInvoiceId: salesInvoice.id,
      date: new Date().toISOString().slice(0, 10),
    }

    onSave(record)

    // Simulate prints and statement bookings
    toast.success('Indirect sales transaction recorded (mock).')
    toast.info(`Printing Purchase document for ${record.id} (mock).`)
    toast.info(`Printing Sales document for ${record.id} (mock).`)
    toast.info('Supplier statement updated (mock, outstanding booked).')
    toast.info('Customer statement updated (mock, outstanding booked).')

    onClose()
  }

  if (!open) return null

  const selectedItem = items.find((it) => it.id === supplierState.itemId)
  const supplier = suppliers.find((s) => s.id === supplierState.supplierId)
  const customer = customers.find((c) => c.id === salesState.customerId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-6">
      <div className="max-h-full w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Indirect Sales Transaction</h2>
          <button type="button" onClick={onClose} className="rounded-full px-3 py-1 text-xs text-slate-500 hover:bg-slate-100">
            Close
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Supplier Transaction */}
          <section className="rounded-2xl border border-slate-100 bg-slate-50/40 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Supplier Transaction</h3>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Supplier</label>
                <select
                  value={supplierState.supplierId}
                  onChange={(e) => setSupplierState((s) => ({ ...s, supplierId: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                >
                  <option value="">Select supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Item</label>
                <select
                  value={supplierState.itemId}
                  onChange={(e) => setSupplierState((s) => ({ ...s, itemId: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                >
                  <option value="">Select item</option>
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Quantity</label>
                <input
                  type="number"
                  value={supplierState.quantity}
                  onChange={(e) => setSupplierState((s) => ({ ...s, quantity: Number(e.target.value) }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Purchase Cost (per unit)</label>
                <input
                  type="number"
                  value={supplierState.purchaseCost}
                  onChange={(e) => setSupplierState((s) => ({ ...s, purchaseCost: Number(e.target.value) }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-600">
                <div>
                  Selected: <span className="font-medium text-slate-800">{selectedItem?.name ?? '-'}</span>
                </div>
                <div>
                  Supplier: <span className="font-medium text-slate-800">{supplier?.name ?? '-'}</span>
                </div>
                <div>
                  Quantity: <span className="font-medium text-slate-800">{supplierState.quantity}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white px-4 py-2 text-[12px]">
                <div className="text-slate-600">Purchase Total</div>
                <div className="mt-1 text-lg font-semibold text-emerald-700">{formatCurrency(purchaseTotal)}</div>
              </div>
            </div>
          </section>

          {/* Sales Transaction */}
          <section className="rounded-2xl border border-slate-100 bg-white p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-800">Sales Transaction</h3>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Customer</label>
                <select
                  value={salesState.customerId}
                  onChange={(e) => setSalesState((s) => ({ ...s, customerId: e.target.value }))}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Item (from Purchase)</label>
                <div className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs bg-slate-50">
                  {selectedItem ? `${selectedItem.name}` : 'No item selected'}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Quantity (from Purchase)</label>
                <div className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs bg-slate-50">
                  {supplierState.quantity}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] text-slate-700">Sales Price (per unit)</label>
                <input
                  type="number"
                  value={salesState.salesPrice}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setSalesState((s) => ({ ...s, salesPrice: val }))
                    setShowPriceWarning(val <= supplierState.purchaseCost)
                  }}
                  className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                />
                {showPriceWarning ? <p className="mt-1 text-[11px] text-rose-600">Sales price must be greater than purchase cost.</p> : null}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-600">
                <div>
                  Customer: <span className="font-medium text-slate-800">{customer?.name ?? '-'}</span>
                </div>
                <div>
                  Price: <span className="font-medium text-slate-800">{formatCurrency(salesState.salesPrice)}</span>
                </div>
                <div>
                  Quantity: <span className="font-medium text-slate-800">{supplierState.quantity}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-white px-4 py-2 text-[12px]">
                <div className="text-slate-600">Sales Total</div>
                <div className="mt-1 text-lg font-semibold text-amber-700">{formatCurrency(salesTotal)}</div>
              </div>
            </div>
          </section>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={validateAndSave} className="rounded-full bg-[#2E7D32] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#256427]">
              Confirm and Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * @component IndirectSalesPage
 * @description Page listing indirect sales and opening the modal for new/edit.
 */
const IndirectSalesPage: React.FC = () => {
  const [records, setRecords] = useState<LocalIndirectSales[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<LocalIndirectSales | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<LocalIndirectSales | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      // Map existing mock indirect sales into local shape (no itemId available in mock - keep empty)
      setRecords(dbIndirectSales.map((r) => ({ ...r, itemId: undefined })))
      setLoading(false)
    }, 400)
    return () => clearTimeout(id)
  }, [])

  const filtered = useMemo(
    () =>
      records.filter((inv) => {
        const q = search.toLowerCase()
        const supplier = suppliers.find((s) => s.id === inv.supplierId)
        const customer = customers.find((c) => c.id === inv.customerId)
        return !q || inv.id.toLowerCase().includes(q) || supplier?.name.toLowerCase().includes(q) || customer?.name.toLowerCase().includes(q)
      }),
    [records, search],
  )

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: LocalIndirectSales) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save or update local indirect sales list.
   */
  const handleSave = (invoice: LocalIndirectSales) => {
    setRecords((prev) => {
      const exists = prev.some((x) => x.id === invoice.id)
      if (exists) return prev.map((x) => (x.id === invoice.id ? invoice : x))
      return [invoice, ...prev]
    })
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((x) => x.id !== confirmDelete.id))
    toast.success('Indirect sales deleted.')
    setConfirmDelete(null)
  }

  const columns: ColumnDef<LocalIndirectSales>[] = [
    { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
    { key: 'supplier', label: 'Supplier', render: (row) => suppliers.find((s) => s.id === row.supplierId)?.name ?? '' },
    { key: 'customer', label: 'Customer', render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '' },
    { key: 'item', label: 'Item', render: (r) => items.find((it) => it.id === r.itemId)?.name ?? '-' },
    { key: 'quantity', label: 'Quantity', render: (r) => String(r.quantity) },
    { key: 'purchaseRate', label: 'Purchase Rate', render: (r) => formatCurrency(r.purchaseRate) },
    { key: 'salesRate', label: 'Sales Rate', render: (r) => formatCurrency(r.salesRate) },
    {
      key: 'actions',
      label: 'Actions',
      width: 'w-[180px]',
      render: (row) => (
        <div className="flex justify-end">
          <RowActions
            row={row as any}
            onView={(r: LocalIndirectSales) => openEdit(r)}
            onEdit={(r: LocalIndirectSales) => openEdit(r)}
            onPrint={(r: LocalIndirectSales) => toast.info(`Printing indirect sales ${r.id} (mock).`)}
            onDelete={(r: LocalIndirectSales) => setConfirmDelete(r)}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Indirect Sales" breadcrumb={['Transactions', 'Indirect Sales']} />

      <div className="flex items-center justify-between gap-3">
        <Toolbar
          onAddNew={openAdd}
          onAdd={openAdd}
          onExportExcel={() => toast.info('Exported indirect sales to Excel (mock).')}
          onExportPdf={() => toast.info('Exported indirect sales to PDF (mock).')}
          onPrint={() => toast.info('Sending indirect sales list to printer (mock).')}
          onRefresh={() => toast.success('Indirect sales list refreshed.')}
        />
        <div>
          <button type="button" onClick={openAdd} className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
            Add New
          </button>
        </div>
      </div>

      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by supplier, customer, id..." />

      <DataGrid<LocalIndirectSales> data={filtered} columns={columns} getRowId={(row) => row.id} loading={loading} onPrint={(r) => toast.info(`Printing ${r.id} (mock).`)} />

      <IndirectSalesModal
        open={modalOpen}
        existing={editing}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete indirect sales?"
        description={confirmDelete ? `Are you sure you want to delete record ${confirmDelete.id}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default IndirectSalesPage