/**
 * @file SupplierPaymentPage.tsx
 * @description Supplier payment entry and listing with optional purchase invoice selection,
 *              showing invoice total & outstanding and supporting partial payments.
 */

import type React from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  supplierPayments as dbPayments,
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
import { getSuppliers, type SupplierResponse } from '../../services/supplierservices/supplier.service'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * @description Supplier payment form values.
 */
interface SupplierPaymentFormValues {
  paymentNumber: string
  supplierId: string
  invoiceMode: 'Invoice by Invoice' | 'Cumulative'
  date: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  remarks: string
  purchaseInvoiceId?: string
  attachments?: File[]
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
  const [supplierOptions, setSupplierOptions] = useState<SupplierResponse[]>([])
  const [attachments, setAttachments] = useState<File[]>([])
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const [columnChooserOpen, setColumnChooserOpen] = useState(false)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(['paymentNumber', 'date', 'supplierId', 'invoiceMode', 'paymentMode', 'amount'])

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
  const watchedInvoiceMode = watch('invoiceMode')
  const watchedAmount = Number(watch('amount') ?? 0)

  useEffect(() => {
    const loadSupplierPayments = async () => {
      try {
        setRecords(dbPayments)
        setSupplierOptions(await getSuppliers())
      } catch (error) {
        console.error(error)
        toast.error('Unable to load suppliers from Supplier Master.')
      } finally {
        setLoading(false)
      }
    }
    void loadSupplierPayments()
  }, [])

  /**
   * @description Filter list by search query.
   */
  const filtered = useMemo(
    () =>
      records.filter((p) => {
        const q = search.toLowerCase()
        const supplier = supplierOptions.find((s) => s.id === p.supplierId)
        const matchesSearch =
          !q ||
          p.paymentNumber.toLowerCase().includes(q) ||
          supplier?.name.toLowerCase().includes(q)
        return matchesSearch
      }),
    [records, search, supplierOptions]
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
      render: (row) => supplierOptions.find((s) => s.id === row.supplierId)?.name ?? '',
    },
    { key: 'invoiceMode', label: 'Invoice Mode', render: (row) => row.invoiceMode ?? 'Invoice by Invoice' },
    { key: 'paymentMode', label: 'Mode' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
  ]

  const visibleColumns = columns.filter((column) => visibleColumnKeys.includes(String(column.key)))

  const getExportValue = (row: SupplierPayment, key: string): string => {
    if (key === 'date') return formatDate(row.date)
    if (key === 'supplierId') return supplierOptions.find((supplier) => supplier.id === row.supplierId)?.name ?? ''
    if (key === 'invoiceMode') return row.invoiceMode ?? 'Invoice by Invoice'
    if (key === 'amount') return formatCurrency(row.amount)
    return String(row[key as keyof SupplierPayment] ?? '')
  }

  const exportSupplierPaymentsToExcel = () => {
    const headers = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const rows = filtered.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(getExportValue(row, String(column.key)))}</td>`).join('')}</tr>`).join('')
    const url = URL.createObjectURL(new Blob([`<html><body><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'supplier-payments.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Supplier payments exported to Excel.')
  }

  const printSupplierPayments = () => {
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const headers = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const rows = filtered.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(getExportValue(row, String(column.key)))}</td>`).join('')}</tr>`).join('')
    win.document.write(`<html><head><title>Supplier Payments</title><style>body{font-family:Arial,sans-serif;margin:24px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Supplier Payments</h1><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  /**
   * @function openAdd
   * @description Prepare form for a new payment.
   */
  const openAdd = () => {
    setEditing(null)
    setAttachments([])
    reset({
      paymentNumber: `PAY-${String(records.reduce((highest, payment) => {
        const number = Number(payment.paymentNumber.match(/(\d+)$/)?.[1] ?? 0)
        return Math.max(highest, number)
      }, 0) + 1).padStart(4, '0')}`,
      supplierId: '',
      invoiceMode: 'Invoice by Invoice',
      date: new Date().toISOString().slice(0, 10),
      paymentMode: 'Cash',
      amount: 0,
      remarks: '',
      purchaseInvoiceId: undefined,
      attachments: [],
    })
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Load existing payment into form for editing.
   */
  const openEdit = (row: SupplierPayment) => {
    setEditing(row)
    setAttachments([])
    reset({
      paymentNumber: row.paymentNumber,
      supplierId: row.supplierId,
      invoiceMode: row.invoiceMode ?? 'Invoice by Invoice',
      date: row.date,
      paymentMode: row.paymentMode,
      amount: row.amount,
      remarks: row.remarks ?? '',
      attachments: [],
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
        invoiceMode: values.invoiceMode,
        date: values.date,
        paymentMode: values.paymentMode,
        amount: Number(values.amount),
        remarks: values.remarks,
        approved: false,
        attachments,
        purchaseInvoiceId: values.purchaseInvoiceId,
      }
      setRecords((prev) => [record as SupplierPayment, ...prev])
      toast.success('Supplier payment recorded.')
    }
    setModalOpen(false)
    setEditing(null)
    setAttachments([])
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

  const handleAttachmentSelection = (fileList: FileList | null) => {
    if (!fileList) return
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
    const selectedFiles = Array.from(fileList).filter((file) => {
      const lowerName = file.name.toLowerCase()
      return allowedExtensions.some((extension) => lowerName.endsWith(extension))
    })
    if (selectedFiles.length !== fileList.length) {
      toast.error('Attachments must be JPG, PNG, or PDF files.')
    }
    setAttachments((current) => [...current, ...selectedFiles])
  }

  const handleApprove = (row: SupplierPayment) => {
    setRecords((prev) => prev.map((payment) => payment.id === row.id ? { ...payment, approved: true } : payment))
    toast.success(`${row.paymentNumber} approved.`)
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
        onExportExcel={exportSupplierPaymentsToExcel}
        onExportPdf={printSupplierPayments}
        onPrint={printSupplierPayments}
        onRefresh={() => { setRecords(dbPayments); toast.success('Supplier payment list refreshed.') }}
        onColumnChooser={() => setColumnChooserOpen((open) => !open)}
      />
      {columnChooserOpen ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <span className="font-medium text-slate-700">Show columns:</span>
          {columns.map((column) => {
            const key = String(column.key)
            return <label key={key} className="inline-flex items-center gap-1.5 text-slate-600"><input type="checkbox" checked={visibleColumnKeys.includes(key)} disabled={visibleColumnKeys.length === 1 && visibleColumnKeys.includes(key)} onChange={() => setVisibleColumnKeys((keys) => keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key])} />{column.label}</label>
          })}
        </div>
      ) : null}
      <SearchFilterPanel
        onSearchChange={setSearch}
        searchPlaceholder="Search by payment no or supplier..."
      />
      <DataGrid<SupplierPayment>
        data={filtered}
        columns={visibleColumns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={openEdit}
        onEdit={openEdit}
        onApprove={handleApprove}
        isRowApproved={(row) => row.approved === true}
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
                    readOnly
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
                    {supplierOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.supplierId ? (
                    <p className="mt-1 text-[10px] text-rose-500">Required</p>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Invoice Mode
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('invoiceMode', {
                      required: true,
                      onChange: (event) => {
                        if (event.target.value === 'Cumulative') {
                          setValue('purchaseInvoiceId', undefined, { shouldDirty: true })
                        }
                      },
                    })}
                  >
                    <option value="Invoice by Invoice">Invoice by Invoice</option>
                    <option value="Cumulative">Cumulative</option>
                  </select>
                </div>

                {watchedInvoiceMode === 'Invoice by Invoice' ? (
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
                ) : null}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
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
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
                <input className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('remarks')} />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Attachment</label>
                <div
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault()
                    handleAttachmentSelection(event.dataTransfer.files)
                  }}
                  className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <button type="button" onClick={() => attachmentInputRef.current?.click()} className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-300">Choose files</button>
                    <span className="text-[10px] text-slate-500">JPG, PNG, PDF</span>
                  </div>
                  {attachments.length > 0 ? (
                    <div className="mt-2 max-h-20 space-y-1 overflow-y-auto">
                      {attachments.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md bg-white px-2 py-1 text-[10px] text-slate-600">
                          <span className="truncate">{file.name}</span>
                          <button type="button" onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="ml-2 text-rose-600 hover:text-rose-700">Delete</button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <input ref={attachmentInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" onChange={(event) => handleAttachmentSelection(event.target.files)} />
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