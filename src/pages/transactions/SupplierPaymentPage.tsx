/**
 * @file SupplierPaymentPage.tsx
 * @description Supplier payment entry and listing with optional purchase invoice selection,
 *              showing invoice total & outstanding and supporting partial payments.
 */

import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { SupplierPayment } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatCurrency, formatDate } from '../../utils/format'
import { getSuppliers, type SupplierResponse } from '../../services/supplierservices/supplier.service'
import { getPurchaseInvoices, updatePurchaseInvoice, type PurchaseInvoiceDTO } from '../../services/purchaseinvoiceservices/purchaseInvoice.service'
import {
  approveSupplierPayment,
  createSupplierPayment,
  deleteSupplierPayment,
  getNextSupplierPaymentNo,
  getSupplierPayments,
  updateSupplierPayment,
} from '../../services/supplierpaymentservices/supplierPayment.service'
import { useAuthStore } from '../../store/authStore'

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function toDisplayDate(value?: string | null): string {
  if (!value) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value
}

function toApiDate(value?: string | null): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value ?? '')
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value ?? ''
}

function formatDateInputText(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function formatAmountInputText(value: string | number): string {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return ''
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(digits))}/-`
}

function toNumericAmount(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0
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

interface SupplierPaymentAttachment {
  name: string
  data: string
  type: string
}

/**
 * @component SupplierPaymentPage
 * @description Supplier payment page component that lets users optionally select a purchase invoice,
 *              shows invoice total and outstanding, and allows partial payments. Remarks capture payment info.
 */
const SupplierPaymentPage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const [records, setRecords] = useState<SupplierPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<SupplierPayment | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SupplierPayment | null>(null)
  const [supplierOptions, setSupplierOptions] = useState<SupplierResponse[]>([])
  const [purchaseInvoiceOptions, setPurchaseInvoiceOptions] = useState<PurchaseInvoiceDTO[]>([])
  const [attachments, setAttachments] = useState<SupplierPaymentAttachment[]>([])
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const [columnChooserOpen, setColumnChooserOpen] = useState(false)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(['paymentNumber', 'date', 'supplierId', 'invoiceMode', 'paymentMode', 'amount'])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<SupplierPaymentFormValues>()

  // Watch fields for reactive UI
  const watchedSupplierId = watch('supplierId')
  const watchedInvoiceId = watch('purchaseInvoiceId')
  const watchedInvoiceMode = watch('invoiceMode')
  const watchedAmount = Number(watch('amount') ?? 0)

  const loadSupplierPayments = useCallback(async () => {
    try {
      setLoading(true)
      const [supplierResult, invoiceResult, paymentResult] = await Promise.allSettled([getSuppliers(), getPurchaseInvoices(), getSupplierPayments()])
      if (supplierResult.status === 'rejected') {
        throw supplierResult.reason
      }
      const suppliers = supplierResult.value
      const supplierIds = new Set(suppliers.map((supplier) => supplier.id))
      const invoices = invoiceResult.status === 'fulfilled' ? invoiceResult.value : []
      let serverPayments = paymentResult.status === 'fulfilled' ? paymentResult.value : []
      if (invoiceResult.status === 'rejected') {
        console.error(invoiceResult.reason)
        toast.error('Unable to load purchase invoices. Supplier payments are still available.')
      }
      if (paymentResult.status === 'fulfilled' && serverPayments.length === 0) {
        const legacyKeys = [
          `cocoper_supplier_payments_${selectedOrganizationId ?? 'all'}`,
          'cocoper_supplier_payments_all',
        ]
        const legacyPayments = legacyKeys
          .flatMap((key) => {
            try {
              const value = localStorage.getItem(key)
              return value ? JSON.parse(value) as SupplierPayment[] : []
            } catch {
              return []
            }
          })
          .filter((payment, index, payments) => payments.findIndex((item) => item.id === payment.id) === index)
          .filter((payment) => supplierIds.has(payment.supplierId) && toNumericAmount(payment.amount) > 0)

        const importedPayments = await Promise.all(legacyPayments.map(async (payment) => {
          try {
            return await createSupplierPayment({
              id: payment.id,
              paymentNumber: payment.paymentNumber,
              supplierId: payment.supplierId,
              supplierName: suppliers.find((supplier) => supplier.id === payment.supplierId)?.name ?? null,
              invoiceMode: payment.invoiceMode ?? 'Invoice by Invoice',
              date: toApiDate(payment.date),
              paymentMode: payment.paymentMode,
              amount: toNumericAmount(payment.amount),
              purchaseInvoiceId: payment.purchaseInvoiceId ?? null,
              remarks: payment.remarks ?? null,
            })
          } catch {
            return null
          }
        }))
        serverPayments = importedPayments.filter((payment) => payment !== null)
      }
      const payments = paymentResult.status === 'fulfilled' ? serverPayments : []
      const scopedPayments = payments
        .filter((payment) => supplierIds.has(payment.supplierId))
        .map((payment) => ({ ...payment, amount: toNumericAmount(payment.amount), organizationId: selectedOrganizationId })) as SupplierPayment[]
      setRecords(scopedPayments)
      setSupplierOptions(suppliers)
      setPurchaseInvoiceOptions(invoices)
      if (paymentResult.status === 'rejected') {
        console.error(paymentResult.reason)
        toast.error('Unable to load saved supplier payments.')
      }
    } catch (error) {
      console.error(error)
      toast.error('Unable to load suppliers from Supplier Master.')
    } finally {
      setLoading(false)
    }
  }, [selectedOrganizationId])

  useEffect(() => {
    void loadSupplierPayments()
  }, [loadSupplierPayments])

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
      render: (row) => formatCurrency(toNumericAmount(row.amount)),
    },
  ]

  const visibleColumns = columns.filter((column) => visibleColumnKeys.includes(String(column.key)))

  const getExportValue = (row: SupplierPayment, key: string): string => {
    if (key === 'date') return formatDate(row.date)
    if (key === 'supplierId') return supplierOptions.find((supplier) => supplier.id === row.supplierId)?.name ?? ''
    if (key === 'invoiceMode') return row.invoiceMode ?? 'Invoice by Invoice'
    if (key === 'amount') return formatCurrency(toNumericAmount(row.amount))
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
  const openAdd = async () => {
    setEditing(null)
    setAttachments([])
    const nextPaymentNumber = await getNextSupplierPaymentNo().catch(() => {
      const next = records.reduce((highest, payment) => {
        const match = /^SP-(\d+)$/i.exec(payment.paymentNumber.trim())
        return Math.max(highest, match ? Number(match[1]) : 0)
      }, 0) + 1
      return `SP-${String(next).padStart(2, '0')}`
    })
    reset({
      paymentNumber: nextPaymentNumber,
      supplierId: '',
      invoiceMode: 'Invoice by Invoice',
      date: toDisplayDate(new Date().toISOString().slice(0, 10)),
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
  const openEdit = (row: SupplierPayment & { attachmentNames?: string | null; attachmentFiles?: string | null }) => {
    setEditing(row)
    let names: string[] = []
    let files: string[] = []
    try { names = row.attachmentNames ? JSON.parse(row.attachmentNames) : [] } catch { names = [] }
    try { files = row.attachmentFiles ? JSON.parse(row.attachmentFiles) : [] } catch { files = [] }
    setAttachments(files.map((data, index) => ({
      name: names[index] ?? `Attachment ${index + 1}`,
      data,
      type: data.startsWith('data:application/pdf') ? 'application/pdf' : 'image/*',
    })))
    reset({
      paymentNumber: row.paymentNumber,
      supplierId: row.supplierId,
      invoiceMode: row.invoiceMode ?? 'Invoice by Invoice',
      date: toDisplayDate(row.date),
      paymentMode: row.paymentMode,
      amount: toNumericAmount(row.amount),
      remarks: row.remarks ?? '',
      attachments: [],
      purchaseInvoiceId: (row as any).purchaseInvoiceId ?? undefined,
    })
    setModalOpen(true)
  }

  /**
   * @function onSubmit
  * @description Save a supplier payment through the backend API.
   */
  const onSubmit = async (values: SupplierPaymentFormValues) => {
    if (!values.supplierId || toNumericAmount(values.amount) <= 0) {
      toast.error('Supplier and amount greater than zero are required.')
      return
    }
    const supplier = supplierOptions.find((item) => item.id === values.supplierId)
    const payload = {
      paymentNumber: values.paymentNumber,
      supplierId: values.supplierId,
      supplierName: supplier?.name ?? null,
      invoiceMode: values.invoiceMode,
      date: toApiDate(values.date),
      paymentMode: values.paymentMode,
      amount: toNumericAmount(values.amount),
      remarks: values.remarks || null,
      purchaseInvoiceId: values.purchaseInvoiceId || null,
      attachmentNames: JSON.stringify(attachments.map((file) => file.name)),
      attachmentFiles: JSON.stringify(attachments.map((file) => file.data)),
    }

    try {
      const saved = editing
        ? await updateSupplierPayment(editing.id, payload)
        : await createSupplierPayment(payload)
      const nextRecords = editing
        ? records.map((payment) => payment.id === saved.id ? saved as SupplierPayment : payment)
        : [saved as SupplierPayment, ...records]
      setRecords(nextRecords)
      toast.success(editing ? 'Supplier payment updated.' : 'Supplier payment recorded.')

    if (values.purchaseInvoiceId) {
      const invoice = purchaseInvoiceOptions.find((item) => item.id === values.purchaseInvoiceId)
      const paidAmount = nextRecords
        .filter((payment) => payment.purchaseInvoiceId === values.purchaseInvoiceId)
        .reduce((sum, payment) => sum + toNumericAmount(payment.amount), 0)
      const isFullyPaid = invoice ? paidAmount >= Number(invoice.grandTotal ?? 0) : false

      try {
        await updatePurchaseInvoice(values.purchaseInvoiceId, {
          supplierPaymentReceiptStatus: isFullyPaid,
        })
        setPurchaseInvoiceOptions((current) => current.map((item) => item.id === values.purchaseInvoiceId
          ? { ...item, supplierPaymentReceiptStatus: isFullyPaid }
          : item))
      } catch (error) {
        console.error(error)
        toast.error('Payment saved, but invoice receipt status could not be updated.')
      }
    }
    setModalOpen(false)
    setEditing(null)
    setAttachments([])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save supplier payment.')
    }
  }

  /**
   * @function handleDelete
  * @description Delete a supplier payment through the backend API.
   */
  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteSupplierPayment(confirmDelete.id)
      setRecords(records.filter((p) => p.id !== confirmDelete.id))
      toast.success('Supplier payment deleted.')
      setConfirmDelete(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete supplier payment.')
    }
  }

  const handleAttachmentSelection = async (fileList: FileList | null) => {
    if (!fileList) return
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
    const selectedFiles = Array.from(fileList).filter((file) => {
      const lowerName = file.name.toLowerCase()
      return allowedExtensions.some((extension) => lowerName.endsWith(extension))
    })
    if (selectedFiles.length !== fileList.length) {
      toast.error('Attachments must be JPG, PNG, or PDF files.')
    }
    const encodedFiles = await Promise.all(selectedFiles.map((file) => new Promise<SupplierPaymentAttachment>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ name: file.name, data: String(reader.result ?? ''), type: file.type })
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}`))
      reader.readAsDataURL(file)
    })))
    setAttachments((current) => [...current, ...encodedFiles])
  }

  const handleApprove = async (row: SupplierPayment) => {
    try {
      await approveSupplierPayment(row.id)
      setRecords(records.map((payment) => payment.id === row.id ? { ...payment, approved: true } : payment))
      toast.success(`${row.paymentNumber} approved.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve supplier payment.')
    }
  }

  const printSupplierPayment = (row: SupplierPayment) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }
    const supplier = supplierOptions.find((item) => item.id === row.supplierId)?.name ?? row.supplierId
    win.document.write(`<!DOCTYPE html><html><head><title>Supplier Payment ${escapeHtml(row.paymentNumber)}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#172033}h1{font-size:24px}.card{border:1px solid #dbe2ea;border-radius:12px;padding:16px;margin-top:18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfe7f0;padding:9px;text-align:left;font-size:12px}th{background:#f8fafc}.right{text-align:right;font-size:16px;font-weight:700}</style></head><body><h1>Supplier Payment</h1><div class="card"><table><tbody><tr><th>Payment No</th><td>${escapeHtml(row.paymentNumber)}</td></tr><tr><th>Date</th><td>${escapeHtml(formatDate(row.date))}</td></tr><tr><th>Supplier</th><td>${escapeHtml(supplier)}</td></tr><tr><th>Invoice Mode</th><td>${escapeHtml(row.invoiceMode ?? 'Invoice by Invoice')}</td></tr><tr><th>Payment Mode</th><td>${escapeHtml(row.paymentMode)}</td></tr><tr><th>Amount</th><td class="right">${escapeHtml(formatCurrency(toNumericAmount(row.amount)))}</td></tr><tr><th>Remarks</th><td>${escapeHtml(row.remarks ?? '-')}</td></tr></tbody></table></div></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  /**
   * @description Approved invoices for the currently selected supplier.
   */
  const approvedInvoicesForSupplier = useMemo<PurchaseInvoiceDTO[]>(
    () => (watchedSupplierId
      ? purchaseInvoiceOptions.filter((inv) => inv.supplierId === watchedSupplierId && inv.status === 'Approved')
      : []),
    [purchaseInvoiceOptions, watchedSupplierId]
  )

  const supplierInvoiceBalances = useMemo(() => {
    if (!watchedSupplierId) return []

    const invoices = [...approvedInvoicesForSupplier].sort((a, b) => {
      const dateA = new Date(a.invoiceDate ?? '').getTime()
      const dateB = new Date(b.invoiceDate ?? '').getTime()
      return dateA - dateB || String(a.id).localeCompare(String(b.id))
    })
    const invoiceIds = new Set(invoices.map((invoice) => invoice.id))
    const paidByInvoice = new Map<string, number>()
    let cumulativePaid = 0

    records
      .filter((payment) => payment.supplierId === watchedSupplierId)
      .forEach((payment) => {
        const amount = Number(payment.amount ?? 0)
        const purchaseInvoiceId = (payment as SupplierPayment & { purchaseInvoiceId?: string }).purchaseInvoiceId
        if (purchaseInvoiceId && invoiceIds.has(purchaseInvoiceId)) {
          paidByInvoice.set(purchaseInvoiceId, (paidByInvoice.get(purchaseInvoiceId) ?? 0) + amount)
        } else if (payment.invoiceMode === 'Cumulative') {
          cumulativePaid += amount
        }
      })

    return invoices.map((invoice) => {
      const total = Number(invoice.grandTotal ?? 0)
      const directPaid = Number(paidByInvoice.get(invoice.id) ?? 0)
      const cumulativeApplied = Math.min(cumulativePaid, Math.max(0, total - directPaid))
      cumulativePaid = Math.max(0, cumulativePaid - cumulativeApplied)
      const paid = Math.min(total, directPaid + cumulativeApplied)
      return { invoice, total, paid, outstanding: Math.max(0, total - paid) }
    })
  }, [approvedInvoicesForSupplier, records, watchedSupplierId])

  /**
   * @description Show approved invoices that still have an outstanding balance.
   */
  const invoicesForSupplier = useMemo<PurchaseInvoiceDTO[]>(() => {
    const outstandingByInvoiceId = new Map(
      supplierInvoiceBalances.map((entry) => [entry.invoice.id, entry.outstanding])
    )
    return approvedInvoicesForSupplier.filter((invoice) =>
      (outstandingByInvoiceId.get(invoice.id) ?? Number(invoice.outstandingAmount ?? invoice.grandTotal ?? 0)) > 0
    )
  }, [approvedInvoicesForSupplier, supplierInvoiceBalances])

  /**
   * @description Selected invoice and computed outstanding amounts.
   */
  const selectedInvoice = useMemo<PurchaseInvoiceDTO | undefined>(() => {
    return invoicesForSupplier.find((inv) => inv.id === watchedInvoiceId)
  }, [invoicesForSupplier, watchedInvoiceId])

  const selectedInvoiceBalance = useMemo(
    () => supplierInvoiceBalances.find((entry) => entry.invoice.id === watchedInvoiceId),
    [supplierInvoiceBalances, watchedInvoiceId]
  )

  const paidBefore = selectedInvoiceBalance?.paid ?? 0
  const outstandingBefore = selectedInvoiceBalance?.outstanding ?? 0

  const outstandingAfter = useMemo(() => {
    return Math.max(0, outstandingBefore - Number(watchedAmount || 0))
  }, [outstandingBefore, watchedAmount])

  const cumulativeSupplierSummary = useMemo(() => {
    if (!watchedSupplierId) return { total: 0, paid: 0, outstanding: 0 }

    const total = supplierInvoiceBalances.reduce((sum, entry) => sum + entry.total, 0)
    const paid = supplierInvoiceBalances.reduce((sum, entry) => sum + entry.paid, 0)

    return { total, paid, outstanding: Math.max(0, total - paid) }
  }, [supplierInvoiceBalances, watchedSupplierId])

  const cumulativeOutstandingAfter = useMemo(() => {
    return Math.max(0, cumulativeSupplierSummary.outstanding - Number(watchedAmount || 0))
  }, [cumulativeSupplierSummary.outstanding, watchedAmount])

  return (
    <div>
      <PageHeader title="Supplier Payment" breadcrumb={['Transactions', 'Supplier Payment']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={exportSupplierPaymentsToExcel}
        onExportPdf={printSupplierPayments}
        onPrint={printSupplierPayments}
        onRefresh={() => { void loadSupplierPayments(); toast.success('Supplier payment list refreshed.') }}
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
        onPrint={printSupplierPayment}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {editing ? 'Edit Supplier Payment' : 'New Supplier Payment'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  setEditing(null)
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
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
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      className="w-full rounded-full border border-slate-200 px-3 py-1.5 pr-9"
                      {...register('date', {
                        required: true,
                        onChange: (event) => {
                          event.target.value = formatDateInputText(event.target.value)
                        },
                      })}
                    />
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="sr-only"
                      value={toApiDate(watch('date'))}
                      onChange={(event) => setValue('date', toDisplayDate(event.target.value), { shouldDirty: true })}
                    />
                    <button
                      type="button"
                      aria-label="Select date"
                      onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                      className="absolute inset-y-0 right-2 flex items-center justify-center text-slate-500 hover:text-slate-700"
                    >
                      <span aria-hidden="true">&#128197;</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">
                    Supplier
                  </label>
                  <select
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    {...register('supplierId', {
                      required: true,
                      onChange: () => setValue('purchaseInvoiceId', undefined, { shouldDirty: true }),
                    })}
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
                  {watchedInvoiceMode === 'Cumulative' && watchedSupplierId ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Total Invoices: <span className="font-medium">{formatCurrency(cumulativeSupplierSummary.total)}</span>
                      {' • '}
                      Paid: <span className="font-medium text-slate-700">{formatCurrency(cumulativeSupplierSummary.paid)}</span>
                      {' • '}
                      Outstanding: <span className="font-semibold text-rose-600">{formatCurrency(cumulativeSupplierSummary.outstanding)}</span>
                    </p>
                  ) : null}
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
                        {inv.invoiceNo} — {formatCurrency(inv.grandTotal ?? 0)}
                      </option>
                    ))}
                  </select>

                  {selectedInvoice ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Invoice Total: <span className="font-medium">{formatCurrency(selectedInvoice.grandTotal ?? 0)}</span>
                      {' • '}
                      Paid: <span className="font-medium text-slate-700">{formatCurrency(paidBefore)}</span>
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
                  <Controller
                    name="amount"
                    control={control}
                    rules={{ required: true, min: 0.01 }}
                    render={({ field }) => (
                      <input
                        type="text"
                        inputMode="numeric"
                        className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                        value={toNumericAmount(field.value) > 0 ? formatAmountInputText(field.value) : ''}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(event) => {
                          const rawValue = event.target.value.replace(/[^\d]/g, '')
                          field.onChange(rawValue ? Number(rawValue) : 0)
                        }}
                      />
                    )}
                  />
                  {selectedInvoice ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Outstanding after this payment:{' '}
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(outstandingAfter)}
                      </span>
                    </p>
                  ) : null}
                  {watchedInvoiceMode === 'Cumulative' && watchedSupplierId ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Outstanding after this payment:{' '}
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(cumulativeOutstandingAfter)}
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
                          <button
                            type="button"
                            onClick={() => {
                              const preview = window.open('', '_blank', 'width=900,height=700')
                              if (!preview) {
                                toast.error('Popup blocked. Please allow popups to view the attachment.')
                                return
                              }
                              if (file.type === 'application/pdf') {
                                preview.location.href = file.data
                              } else {
                                preview.document.write(`<html><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#111"><img src="${file.data}" alt="${escapeHtml(file.name)}" style="max-width:100%;max-height:100vh;object-fit:contain" /></body></html>`)
                                preview.document.close()
                              }
                            }}
                            className="ml-2 text-sky-700 hover:text-sky-900"
                          >
                            View
                          </button>
                          <button type="button" onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="ml-2 text-rose-600 hover:text-rose-700">Delete</button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <input ref={attachmentInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf" className="hidden" onChange={(event) => handleAttachmentSelection(event.target.files)} />
                </div>
              </div>

              <div className="mt-3 flex justify-end border-t border-slate-100 pt-3 text-xs">
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