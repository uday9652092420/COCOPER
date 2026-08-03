/**
 * @file SupplierPaymentPage.tsx
 * @description Supplier payment entry and listing with optional purchase invoice selection,
 *              showing invoice total & outstanding and supporting partial payments.
 */

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  supplierPayments as dbPayments,
  suppliers,
  purchaseInvoices,
  type SupplierPayment,
  type PurchaseInvoice,
} from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'

/**
 * @description Supplier payment form values.
 */
interface SupplierPaymentFormValues {
  paymentNumber: string
  supplierId: string
  date: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  remarks: string
  purchaseInvoiceId?: string
}

/**
 * @component SupplierPaymentPage
 * @description Supplier payment page component that lets users optionally select a purchase invoice,
 *              shows invoice total and outstanding, and allows partial payments. Remarks capture payment info.
 */
const SupplierPaymentPage: React.FC = () => {
  const [records, setRecords] = useState<SupplierPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierPayment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SupplierPayment | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SupplierPaymentFormValues>()

  // Watch fields for reactive UI
  const watchedSupplierId = watch('supplierId')
  const watchedInvoiceId = watch('purchaseInvoiceId')
  const watchedAmount = Number(watch('amount') ?? 0)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbPayments)
      setLoading(false)
    }, 400)
    return () => clearTimeout(id)
  }, [])

  /**
   * @description Filter list by search query.
   */
  const filtered = useMemo(
    () =>
      records.filter((p) => {
        const q = search.toLowerCase()
        const supplier = suppliers.find((s) => s.id === p.supplierId)
        const matchesSearch =
          !q ||
          p.paymentNumber.toLowerCase().includes(q) ||
          supplier?.name.toLowerCase().includes(q)
        return matchesSearch
      }),
    [records, search]
  )

  const columns: ColumnDef<SupplierPayment>[] = [
    { key: 'paymentNumber', label: 'Payment No' },
    {
      key: 'date',
      label: 'Date',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'supplierId',
      label: 'Supplier',
      render: (row) => suppliers.find((s) => s.id === row.supplierId)?.name ?? '',
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
   * @description Prepare form for a new payment.
   */
  const openAdd = () => {
    setEditing(null)
    reset({
      paymentNumber: `PAY-${(Math.floor(Math.random() * 9000) + 1000)
        .toString()
        .padStart(4, '0')}`,
      supplierId: '',
      date: new Date().toISOString().slice(0, 10),
      paymentMode: 'Cash',
      amount: 0,
      remarks: '',
      purchaseInvoiceId: undefined,
    })
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Load existing payment into form for editing.
   */
  const openEdit = (row: SupplierPayment) => {
    setEditing(row)
    reset({
      paymentNumber: row.paymentNumber,
      supplierId: row.supplierId,
      date: row.date,
      paymentMode: row.paymentMode,
      amount: row.amount,
      remarks: row.remarks ?? '',
      // invoice id may be stored on mock row as optional
      // @ts-expect-error allow optional field
      purchaseInvoiceId: (row as any).purchaseInvoiceId ?? undefined,
    })
    setModalOpen(true)
  }

  /**
   * @function onSubmit
   * @description Persist payment (mock upsert). Supports partial payments and optional invoice link.
   */
  const onSubmit = (values: SupplierPaymentFormValues) => {
    if (editing) {
      setRecords((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? ({ ...p, ...values, amount: Number(values.amount) } as SupplierPayment)
            : p
        )
      )
      toast.success('Supplier payment updated.')
    } else {
      const record: SupplierPayment & { purchaseInvoiceId?: string } = {
        id: `SP-${Date.now()}`,
        paymentNumber: values.paymentNumber,
        supplierId: values.supplierId,
        date: values.date,
        paymentMode: values.paymentMode,
        amount: Number(values.amount),
        remarks: values.remarks,
        purchaseInvoiceId: values.purchaseInvoiceId,
      }
      setRecords((prev) => [record as SupplierPayment, ...prev])
      toast.success('Supplier payment recorded.')
    }
    setModalOpen(false)
    setEditing(null)
  }

  /**
   * @function handleDelete
   * @description Delete a payment record (mock).
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((p) => p.id !== confirmDelete.id))
    toast.success('Supplier payment deleted.')
    setConfirmDelete(null)
  }

  /**
   * @description Invoices for currently selected supplier.
   */
  const invoicesForSupplier = useMemo<PurchaseInvoice[]>(
    () => (watchedSupplierId ? purchaseInvoices.filter((inv) => inv.supplierId === watchedSupplierId) : []),
    [watchedSupplierId]
  )

  /**
   * @description Selected invoice and computed outstanding amounts.
   */
  const selectedInvoice = useMemo<PurchaseInvoice | undefined>(() => {
    return invoicesForSupplier.find((inv) => inv.id === watchedInvoiceId)
  }, [invoicesForSupplier, watchedInvoiceId])

  const outstandingBefore = useMemo(() => {
    if (!selectedInvoice) return 0
    const total = selectedInvoice.totalAmount ?? selectedInvoice.grandTotal ?? 0
    const paid = selectedInvoice.paidAmount ?? 0
    return Math.max(0, total - paid)
  }, [selectedInvoice])

  const outstandingAfter = useMemo(() => {
    return Math.max(0, outstandingBefore - Number(watchedAmount || 0))
  }, [outstandingBefore, watchedAmount])

  /**
   * @description Pre-fill amount with outstanding when an invoice is selected (but allow edits for partial payment).
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
      <PageHeader title="Supplier Payment" breadcrumb={['Transactions', 'Supplier Payment']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={() => toast.info('Exported supplier payments to Excel (mock).')}
        onExportPdf={() => toast.info('Exported supplier payments to PDF (mock).')}
        onPrint={() => toast.info('Sending supplier payment list to printer (mock).')}
        onRefresh={() => toast.success('Supplier payment list refreshed.')}
        onColumnChooser={() => toast.info('Column chooser not configurable in mock grid.')}
      />
      <SearchFilterPanel
        onSearchChange={setSearch}
        searchPlaceholder="Search by payment no or supplier..."
      />
      <DataGrid<SupplierPayment>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={openEdit}
        onEdit={openEdit}
        onDelete={(row) => setConfirmDelete(row)}
        onPrint={(row) => toast.info(`Printing payment ${row.paymentNumber} (mock).`)}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <h2 className="text-sm font-semibold text-slate-900">
              {editing ? 'Edit Supplier Payment' : 'New Supplier Payment'}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-3 space-y-3 text-xs">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Payment Number
                  </label>
                  <input
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('paymentNumber', { required: true })}
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
                    Supplier
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('supplierId', { required: true })}
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId ? (
                    <p className="mt-1 text-[10px] text-rose-500">Required</p>
                  ) : null}
                </div>

                {/* Purchase Invoice selector - shows invoices for selected supplier */}
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Purchase Invoice (optional)
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs"
                    {...register('purchaseInvoiceId')}
                  >
                    <option value="">-- No invoice --</option>
                    {invoicesForSupplier.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber ?? inv.invoiceNo} — {formatCurrency(inv.totalAmount ?? inv.grandTotal ?? 0)}
                      </option>
                    ))}
                  </select>

                  {selectedInvoice ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Invoice Total: <span className="font-medium">{formatCurrency(selectedInvoice.totalAmount ?? selectedInvoice.grandTotal ?? 0)}</span>
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
                  className="rounded-full bg-[#2E7D32] px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-[#256427]"
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
        title="Delete supplier payment?"
        description={
          confirmDelete
            ? `Are you sure you want to delete ${confirmDelete.paymentNumber}? This cannot be undone.`
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

export default SupplierPaymentPage