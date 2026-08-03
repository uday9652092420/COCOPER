/**
 * @file CustomerReceiptPage.tsx
 * @description Page to list and create customer receipts. Seeds mock data for grid view and supports add/edit via modal.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Link } from 'react-router'
import {
  customers,
  directSales,
  type DirectSales,
  type Customer,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @interface CustomerReceipt
 * @description Local model for a customer receipt record.
 */
interface CustomerReceipt {
  id: string
  receiptNumber: string
  date: string
  customerId: string
  invoiceId?: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  remarks?: string
}

/**
 * @interface CustomerReceiptFormValues
 * @description Form values used by react-hook-form for the modal.
 */
interface CustomerReceiptFormValues {
  receiptNumber: string
  date: string
  customerId: string
  invoiceId?: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  remarks?: string
}

/**
 * @component CustomerReceiptPage
 * @description Page component to list and create customer receipts. Add/Edit via modal,
 *              seeded with mock receipts to demonstrate grid + action buttons.
 */
const CustomerReceiptPage: React.FC = () => {
  const [records, setRecords] = useState<CustomerReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerReceipt | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CustomerReceipt | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerReceiptFormValues>()

  // Watch fields for reactive UI
  const watchedCustomerId = watch('customerId')
  const watchedInvoiceId = watch('invoiceId')
  const watchedAmount = Number(watch('amount') ?? 0)

  useEffect(() => {
    /**
     * @description Seed a few mock receipts for the grid to demonstrate actions.
     */
    const id = setTimeout(() => {
      const sampleCustomers = customers.slice(0, 3)
      const samples: CustomerReceipt[] = sampleCustomers.map((c, idx) => {
        const inv = directSales.find((d) => d.customerId === c.id)
        const total = inv?.invoiceTotal ?? 1200 + idx * 100
        const partial = Math.round(total * (idx === 0 ? 0.5 : idx === 1 ? 0.25 : 1))
        return {
          id: `CR-${Date.now()}-${idx}`,
          receiptNumber: `RCPT-${(1000 + idx).toString().padStart(4, '0')}`,
          date: new Date(Date.now() - idx * 24 * 3600 * 1000).toISOString().slice(0, 10),
          customerId: c.id,
          invoiceId: inv?.id,
          paymentMode: idx === 2 ? 'Bank' : 'Cash',
          amount: partial,
          remarks: inv ? 'Partial payment against invoice' : 'Advance / No invoice',
        }
      })
      setRecords(samples)
      setLoading(false)
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * @description Filtered grid data based on search.
   */
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return records.filter((r) => {
      const cust = customers.find((c) => c.id === r.customerId)
      return (
        !q ||
        r.receiptNumber.toLowerCase().includes(q) ||
        cust?.name.toLowerCase().includes(q)
      )
    })
  }, [records, search])

  const columns: ColumnDef<CustomerReceipt>[] = [
    { key: 'receiptNumber', label: 'Receipt No' },
    {
      key: 'date',
      label: 'Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'customerId',
      label: 'Customer',
      render: (row) => customers.find((c) => c.id === row.customerId)?.name ?? '',
    },
    {
      key: 'invoiceId',
      label: 'Invoice No',
      render: (row) => row.invoiceId ?? '-',
    },
    { key: 'paymentMode', label: 'Mode' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
  ]

  /**
   * @function openAdd
   * @description Prepare modal for a new receipt.
   */
  const openAdd = () => {
    setEditing(null)
    reset({
      receiptNumber: `RCPT-${(Math.floor(Math.random() * 9000) + 1000)
        .toString()
        .padStart(4, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      customerId: '',
      invoiceId: undefined,
      paymentMode: 'Cash',
      amount: 0,
      remarks: '',
    })
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Load an existing receipt into the form for editing.
   */
  const openEdit = (row: CustomerReceipt) => {
    setEditing(row)
    reset({
      receiptNumber: row.receiptNumber,
      date: row.date,
      customerId: row.customerId,
      invoiceId: row.invoiceId,
      paymentMode: row.paymentMode,
      amount: row.amount,
      remarks: row.remarks,
    })
    setModalOpen(true)
  }

  /**
   * @function onSubmit
   * @description Save new or updated receipt into local state (mock persist).
   */
  const onSubmit = (values: CustomerReceiptFormValues) => {
    if (editing) {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === editing.id ? { ...r, ...values, amount: Number(values.amount) } : r
        )
      )
      toast.success('Customer receipt updated.')
    } else {
      const rec: CustomerReceipt = {
        id: `CR-${Date.now()}`,
        receiptNumber: values.receiptNumber,
        date: values.date,
        customerId: values.customerId,
        invoiceId: values.invoiceId,
        paymentMode: values.paymentMode,
        amount: Number(values.amount),
        remarks: values.remarks,
      }
      setRecords((prev) => [rec, ...prev])
      toast.success('Customer receipt recorded.')
    }
    setModalOpen(false)
    setEditing(null)
  }

  /**
   * @function handleDelete
   * @description Remove a receipt record from the local list.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((r) => r.id !== confirmDelete.id))
    toast.success('Receipt deleted.')
    setConfirmDelete(null)
  }

  /**
   * @description Invoices for the currently selected customer (sales invoices).
   */
  const invoicesForCustomer = useMemo<DirectSales[]>(
    () => (watchedCustomerId ? directSales.filter((inv) => inv.customerId === watchedCustomerId) : []),
    [watchedCustomerId]
  )

  /**
   * @description Compute selected invoice and outstanding (consider receipts recorded in this session).
   */
  const selectedInvoice = useMemo<DirectSales | undefined>(() => {
    return invoicesForCustomer.find((inv) => inv.id === watchedInvoiceId)
  }, [invoicesForCustomer, watchedInvoiceId])

  const outstandingBefore = useMemo(() => {
    if (!selectedInvoice) return 0
    const total = selectedInvoice.invoiceTotal ?? 0
    // sum of receipts recorded against this invoice in local state
    const paid = records
      .filter((r) => r.invoiceId === selectedInvoice.id)
      .reduce((s, r) => s + r.amount, 0)
    return Math.max(0, total - paid)
  }, [selectedInvoice, records])

  const outstandingAfter = useMemo(() => {
    return Math.max(0, outstandingBefore - Number(watchedAmount || 0))
  }, [outstandingBefore, watchedAmount])

  /**
   * @description When an invoice is selected, prefill amount with outstanding (editable).
   */
  useEffect(() => {
    if (selectedInvoice) {
      const currentAmount = Number(watch('amount') ?? 0)
      if (!currentAmount) {
        setValue('amount', Number(outstandingBefore))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInvoice])

  return (
    <div>
      <PageHeader title="Customer Receipt" breadcrumb={['Transactions', 'Customer Receipt']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported receipts to Excel (mock).')}
        onExportPdf={() => toast.info('Exported receipts to PDF (mock).')}
        onPrint={() => toast.info('Printing receipt list (mock).')}
        onRefresh={() => toast.success('Receipt list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel
        onSearchChange={setSearch}
        searchPlaceholder="Search by receipt no or customer..."
      />

      <DataGrid<CustomerReceipt>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={openEdit}
        onEdit={openEdit}
        onDelete={(row) => setConfirmDelete(row)}
        onPrint={(row) => toast.info(`Printing receipt ${row.receiptNumber} (mock).`)}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-slate-900">
              {editing ? 'Edit Customer Receipt' : 'New Customer Receipt'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Receipt Number
                  </label>
                  <input
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('receiptNumber', { required: true })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('date', { required: true })}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Customer
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('customerId', { required: true })}
                  >
                    <option value="">Select customer</option>
                    {customers.map((c: Customer) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.customerId ? (
                    <p className="mt-1 text-[10px] text-rose-500">Required</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Invoice No (optional)
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                    {...register('invoiceId')}
                  >
                    <option value="">-- No invoice --</option>
                    {invoicesForCustomer.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.id} — {formatCurrency(inv.invoiceTotal ?? 0)}
                      </option>
                    ))}
                  </select>

                  {selectedInvoice ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Invoice Total: <span className="font-medium">{formatCurrency(selectedInvoice.invoiceTotal ?? 0)}</span>
                      {' • '}
                      Outstanding: <span className="font-semibold text-rose-600">{formatCurrency(outstandingBefore)}</span>
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Payment Mode
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('paymentMode', { required: true })}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Amount (partial allowed)
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('amount', { required: true, valueAsNumber: true })}
                  />
                  {selectedInvoice ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Outstanding after this payment:{' '}
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(outstandingAfter)}
                      </span>
                    </p>
                  ) : null}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Remarks
                  </label>
                  <input
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('remarks')}
                  />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false)
                    setEditing(null)
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#0B70F0] px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-[#095fc7]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete customer receipt?"
        description={
          confirmDelete
            ? `Are you sure you want to delete ${confirmDelete.receiptNumber}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default CustomerReceiptPage