import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { API } from '../../config/api'
import { getOrgHeader } from '../../utils/apiHeaders'
import { formatAmount, formatCurrency, formatDate } from '../../utils/format'
import { getCustomers, type CustomerResponse } from '../../services/customerservices/customer.service'

interface CustomerReceiptRow {
  id: string
  receipt_no: string
  receipt_date: string
  customer_id: string
  customer_name?: string
  invoice_mode: 'Invoice by Invoice' | 'Cumulative'
  invoice_no?: string | null
  payment_mode: 'Cash' | 'UPI'
  amount: number
  approved?: boolean
  remarks?: string | null
}

interface CustomerReceiptFormValues {
  receipt_no: string
  receipt_date: string
  customer_id: string
  invoice_mode: 'Invoice by Invoice' | 'Cumulative'
  invoice_no?: string
  payment_mode: 'Cash' | 'UPI'
  amount: number
  attachment?: File[] | null
  remarks?: string
}

interface DirectSaleOption {
  id: string
  customerId?: string
  customer_id?: string
  directSaleNo?: string
  invoice_no?: string
  invoiceTotal?: number
  total_amount?: number
  invoiceDate?: string
  sale_date?: string
  createdAt?: string
  customerReceiptStatus?: boolean
  approved?: boolean
}

function normalizeReceiptNo(value?: string | null): string {
  const raw = (value ?? '').trim()
  if (!raw) return 'RCP-01'
  const match = /^(RCP-?)(\d+)$/i.exec(raw)
  if (!match) return raw
  return `RCP-${String(Number(match[2])).padStart(2, '0')}`
}

function parseApiDate(input?: string | null): string {
  if (!input) return new Date().toISOString().slice(0, 10)
  const isoMatch = /^\d{4}-\d{2}-\d{2}$/.exec(input)
  if (isoMatch) return input
  const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(input)
  if (match) {
    return `${match[3]}-${match[2]}-${match[1]}`
  }
  return input
}

function formatDateForInput(dateValue?: string | null): string {
  const value = parseApiDate(dateValue)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(dateValue?: string | null): string {
  const value = parseApiDate(dateValue)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function formatDateInputText(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (!digits) return ''
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function formatAmountInputText(value: string | number): string {
  const digits = String(value ?? '').replace(/[^\d]/g, '')
  if (!digits) return ''
  const numeric = Number(digits)
  if (!Number.isFinite(numeric)) return ''
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(numeric)}/-`
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function resolveCustomerInvoiceBalances(
  customerId: string,
  allSales: DirectSaleOption[],
  allReceipts: CustomerReceiptRow[],
) {
  const customerSales = allSales
    .filter((sale) => (sale.customerId ?? sale.customer_id) === customerId && sale.approved === true)
    .sort((a, b) => {
      const dateA = new Date(a.invoiceDate ?? a.sale_date ?? '1970-01-01').getTime()
      const dateB = new Date(b.invoiceDate ?? b.sale_date ?? '1970-01-01').getTime()
      if (dateA !== dateB) return dateA - dateB
      const createdA = new Date(a.createdAt ?? '1970-01-01').getTime()
      const createdB = new Date(b.createdAt ?? '1970-01-01').getTime()
      if (createdA !== createdB) return createdA - createdB
      return String(a.id).localeCompare(String(b.id))
    })

  let remainingCumulativeReceipts = allReceipts
    .filter((receipt) => receipt.customer_id === customerId && receipt.invoice_mode === 'Cumulative')
    .reduce((sum, receipt) => sum + Number(receipt.amount ?? 0), 0)

  return customerSales.map((sale) => {
    const invoiceNo = sale.directSaleNo ?? sale.invoice_no ?? sale.id
    const invoiceKeys = new Set([sale.directSaleNo, sale.invoice_no, sale.id].filter(Boolean))
    const total = Number(sale.invoiceTotal ?? sale.total_amount ?? 0)
    const directInvoicePaid = allReceipts
      .filter((receipt) => receipt.customer_id === customerId && receipt.invoice_no && invoiceKeys.has(receipt.invoice_no))
      .reduce((sum, receipt) => sum + Number(receipt.amount ?? 0), 0)

    let outstanding = Math.max(0, total - directInvoicePaid)
    if (remainingCumulativeReceipts > 0) {
      const applied = Math.min(remainingCumulativeReceipts, outstanding)
      outstanding = Math.max(0, outstanding - applied)
      remainingCumulativeReceipts = Math.max(0, remainingCumulativeReceipts - applied)
    }

    return {
      id: sale.id ?? invoiceNo,
      invoiceNo,
      storedInvoiceNo: sale.invoice_no,
      total,
      paid: Math.max(0, total - outstanding),
      outstanding,
      customerReceiptStatus: sale.customerReceiptStatus,
    }
  })
}

const CustomerReceiptPage: React.FC = () => {
  const [records, setRecords] = useState<CustomerReceiptRow[]>([])
  const [customers, setCustomers] = useState<CustomerResponse[]>([])
  const [directSales, setDirectSales] = useState<DirectSaleOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerReceiptRow | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CustomerReceiptRow | null>(null)
  const [columnChooserOpen, setColumnChooserOpen] = useState(false)
  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>([
    'receipt_no',
    'receipt_date',
    'customer_id',
    'invoice_no',
    'payment_mode',
    'amount',
  ])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CustomerReceiptFormValues>()

  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const [isDraggingAttachment, setIsDraggingAttachment] = useState(false)
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null)
  const [attachmentFileInfo, setAttachmentFileInfo] = useState<{ name: string; type: string } | null>(null)

  const watchedCustomerId = watch('customer_id')
  const watchedInvoiceMode = watch('invoice_mode')
  const watchedInvoiceNo = watch('invoice_no')
  const watchedAmount = Number.isFinite(Number(watch('amount'))) ? Number(watch('amount')) : 0
  const watchedAttachment = watch('attachment')
  const selectedAttachmentName = attachmentFileInfo ? attachmentFileInfo.name : (watchedAttachment && watchedAttachment.length > 0 ? watchedAttachment[0].name : 'No file chosen')

  const handleAttachmentSelection = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) {
      setAttachmentPreviewUrl(null)
      setAttachmentFileInfo(null)
      setValue('attachment', [], { shouldDirty: true })
      return
    }

    const files = Array.from(fileList)
    const file = files[0]
    setAttachmentFileInfo({ name: file.name, type: file.type })

    if (attachmentPreviewUrl) {
      URL.revokeObjectURL(attachmentPreviewUrl)
    }

    const nextPreview = file.type.startsWith('image/') || file.type === 'application/pdf' ? URL.createObjectURL(file) : null
    setAttachmentPreviewUrl(nextPreview)
    setValue('attachment', files, { shouldDirty: true })
  }

  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) {
        URL.revokeObjectURL(attachmentPreviewUrl)
      }
    }
  }, [attachmentPreviewUrl])

  async function loadData() {
    try {
      setLoading(true)
      const [customerList, receiptsResponse, directSalesResponse] = await Promise.all([
        getCustomers(),
        fetch(`${API}/customer-receipts`, { headers: getOrgHeader() }),
        fetch(`${API}/direct-sales`, { headers: getOrgHeader() }),
      ])

      setCustomers(customerList)

      const receiptData = await receiptsResponse.json().catch(() => ({ data: [] }))
      const directSaleData = await directSalesResponse.json().catch(() => [])

      setRecords(Array.isArray(receiptData.data) ? receiptData.data : [])
      setDirectSales(Array.isArray(directSaleData) ? directSaleData : Array.isArray(directSaleData.data) ? directSaleData.data : [])
    } catch (error) {
      console.error(error)
      toast.error('Unable to load customer receipts data.')
      setRecords([])
      setCustomers([])
      setDirectSales([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return records.filter((receipt) => {
      const customer = customers.find((item) => item.id === receipt.customer_id)
      const label = `${receipt.receipt_no} ${customer?.name ?? ''}`.toLowerCase()
      return !q || label.includes(q)
    })
  }, [records, customers, search])

  const columns: ColumnDef<CustomerReceiptRow>[] = [
    { key: 'receipt_no', label: 'Receipt No' },
    {
      key: 'receipt_date',
      label: 'Date',
      render: (row) => formatDisplayDate(row.receipt_date),
    },
    {
      key: 'customer_id',
      label: 'Customer',
      render: (row) => row.customer_name ?? customers.find((customer) => customer.id === row.customer_id)?.name ?? '',
    },
    {
      key: 'invoice_no',
      label: 'Invoice No',
      render: (row) => row.invoice_no ?? '-',
    },
    { key: 'payment_mode', label: 'Mode' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(Number(row.amount ?? 0)),
    },
  ]

  const visibleColumns = columns.filter((column) => visibleColumnKeys.includes(String(column.key)))

  const getExportValue = (row: CustomerReceiptRow, key: string): string => {
    if (key === 'receipt_date') return formatDisplayDate(row.receipt_date)
    if (key === 'customer_id') return row.customer_name ?? customers.find((customer) => customer.id === row.customer_id)?.name ?? ''
    if (key === 'invoice_no') return row.invoice_no ?? '-'
    if (key === 'amount') return formatCurrency(Number(row.amount ?? 0))
    return String(row[key as keyof CustomerReceiptRow] ?? '')
  }

  const exportCustomerReceiptsToExcel = () => {
    const headers = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const rows = filtered.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(getExportValue(row, String(column.key)))}</td>`).join('')}</tr>`).join('')
    const workbook = `<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([workbook], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'customer-receipts.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Customer receipts exported to Excel.')
  }

  const printCustomerReceipts = () => {
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }

    const headers = visibleColumns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')
    const rows = filtered.map((row) => `<tr>${visibleColumns.map((column) => `<td>${escapeHtml(getExportValue(row, String(column.key)))}</td>`).join('')}</tr>`).join('')
    win.document.write(`<!DOCTYPE html><html><head><title>Customer Receipts</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:11px}th,td{border:1px solid #cbd5e1;padding:7px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Customer Receipts</h1><p>Generated on ${escapeHtml(formatDisplayDate(new Date().toISOString()))}</p><table><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table></body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  const customerInvoiceBalances = useMemo(() => {
    if (!watchedCustomerId) return []
    return resolveCustomerInvoiceBalances(watchedCustomerId, directSales, records)
  }, [directSales, records, watchedCustomerId])

  const invoicesForCustomer = useMemo(() => {
    if (!watchedCustomerId) return []
    return customerInvoiceBalances
      .filter((invoice) => Number.isFinite(invoice.outstanding) && invoice.outstanding > 0.01)
      .map((invoice) => ({
        ...invoice,
        directSaleNo: invoice.invoiceNo,
        invoice_no: invoice.storedInvoiceNo ?? invoice.invoiceNo,
        invoiceTotal: invoice.total,
      }))
  }, [customerInvoiceBalances, watchedCustomerId])

  const selectedInvoice = useMemo(() => {
    const value = watchedInvoiceNo || ''
    return invoicesForCustomer.find((sale) => (sale.invoice_no ?? sale.directSaleNo ?? sale.id) === value)
  }, [invoicesForCustomer, watchedInvoiceNo])

  const outstandingBefore = useMemo(() => {
    if (!selectedInvoice) return 0
    return Number(selectedInvoice.outstanding ?? 0)
  }, [selectedInvoice])

  const paidAmountBefore = useMemo(() => {
    if (!selectedInvoice) return 0
    return Number(selectedInvoice.paid ?? 0)
  }, [selectedInvoice])

  const customerUnpaidInvoices = useMemo(() => {
    if (!watchedCustomerId) return []
    return customerInvoiceBalances.filter((invoice) => invoice.outstanding > 0)
  }, [customerInvoiceBalances, watchedCustomerId])

  const cumulativeCustomerSummary = useMemo(() => {
    if (!watchedCustomerId) return { totalInvoices: 0, paid: 0, outstanding: 0 }

    const totalInvoices = directSales
      .filter((sale) => (sale.customerId ?? sale.customer_id) === watchedCustomerId && sale.approved === true)
      .reduce((sum, sale) => sum + Number(sale.invoiceTotal ?? sale.total_amount ?? 0), 0)

    const paid = customerInvoiceBalances.reduce((sum, invoice) => sum + invoice.paid, 0)
    const outstanding = customerInvoiceBalances.reduce((sum, invoice) => sum + invoice.outstanding, 0)

    return {
      totalInvoices,
      paid,
      outstanding,
    }
  }, [customerInvoiceBalances, directSales, watchedCustomerId])

  const outstandingAfter = useMemo(() => Math.max(0, outstandingBefore - watchedAmount), [outstandingBefore, watchedAmount])

  const cumulativeOutstandingAfter = useMemo(() => {
    if (!watchedCustomerId) return cumulativeCustomerSummary.outstanding
    return Math.max(0, cumulativeCustomerSummary.outstanding - watchedAmount)
  }, [cumulativeCustomerSummary.outstanding, watchedCustomerId, watchedAmount])

  const openAdd = async () => {
    try {
      const response = await fetch(`${API}/customer-receipts/next-no`, { headers: getOrgHeader() })
      const payload = await response.json().catch(() => ({ data: 'RCP-01' }))
      const nextNo = normalizeReceiptNo(payload.data ?? 'RCP-01')
      setEditing(null)
      setAttachmentPreviewUrl(null)
      setAttachmentFileInfo(null)
      reset({
        receipt_no: nextNo,
        receipt_date: formatDisplayDate(new Date().toISOString()),
        customer_id: '',
        invoice_mode: 'Invoice by Invoice',
        invoice_no: '',
        payment_mode: 'Cash',
        amount: 0,
        attachment: null,
        remarks: '',
      })
      setModalOpen(true)
    } catch (error) {
      toast.error('Unable to generate next receipt number.')
    }
  }

  const openEdit = (row: CustomerReceiptRow) => {
    setEditing(row)
    setAttachmentPreviewUrl(null)
    setAttachmentFileInfo(null)
    reset({
      receipt_no: normalizeReceiptNo(row.receipt_no),
      receipt_date: formatDisplayDate(row.receipt_date),
      customer_id: row.customer_id,
      invoice_mode: row.invoice_mode,
      invoice_no: row.invoice_no ?? '',
      payment_mode: row.payment_mode,
      amount: Number(row.amount ?? 0),
      attachment: null,
      remarks: row.remarks ?? '',
    })
    setModalOpen(true)
  }

  const onSubmit = async (values: CustomerReceiptFormValues) => {
    const attachmentFiles = values.attachment && values.attachment.length > 0 ? values.attachment : []
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']

    if (attachmentFiles.length > 0) {
      const invalidFile = attachmentFiles.find((file) => {
        const fileName = file.name.toLowerCase()
        const fileType = file.type.toLowerCase()
        const isAllowedExtension = allowedExtensions.some((ext) => fileName.endsWith(ext))
        const isAllowedType = allowedTypes.includes(fileType)
        return !isAllowedExtension && !isAllowedType
      })

      if (invalidFile) {
        toast.error('Attachment must be a JPG, PNG or PDF file.')
        return
      }
    }

    const attachmentData = await Promise.all(
      attachmentFiles.map(async (file) => {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result ?? ''))
          reader.onerror = () => reject(new Error('Failed to read attachment file.'))
          reader.readAsDataURL(file)
        })

        return {
          name: file.name,
          data: base64,
        }
      })
    )

    const payload = {
      receipt_no: normalizeReceiptNo(values.receipt_no),
      customer_id: values.customer_id,
      receipt_date: parseApiDate(values.receipt_date),
      invoice_mode: values.invoice_mode,
      invoice_no: values.invoice_mode === 'Cumulative' ? null : (values.invoice_no || null),
      payment_mode: values.payment_mode,
      amount: Number(values.amount),
      attachment_names: attachmentData.length > 0 ? JSON.stringify(attachmentData.map((item) => item.name)) : null,
      attachment_files: attachmentData.length > 0 ? JSON.stringify(attachmentData.map((item) => item.data)) : null,
      remarks: values.remarks || null,
    }

    if (!values.customer_id) {
      toast.error('Please select a customer.')
      return
    }

    if (values.invoice_mode === 'Invoice by Invoice' && !values.invoice_no) {
      toast.error('Please select an invoice number.')
      return
    }

    if (!Number(values.amount) || Number(values.amount) <= 0) {
      toast.error('Amount must be greater than zero.')
      return
    }

    try {
      const response = await fetch(editing ? `${API}/customer-receipts/${editing.id}` : `${API}/customer-receipts`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...getOrgHeader() },
        body: JSON.stringify(payload),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message ?? 'Unable to save receipt')

      toast.success(editing ? 'Customer receipt updated.' : 'Customer receipt recorded.')
      setModalOpen(false)
      setEditing(null)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save receipt.')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      const response = await fetch(`${API}/customer-receipts/${confirmDelete.id}`, {
        method: 'DELETE',
        headers: getOrgHeader(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message ?? 'Unable to delete receipt')
      toast.success('Receipt deleted.')
      setConfirmDelete(null)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete receipt.')
    }
  }

  const handleApprove = async (row: CustomerReceiptRow) => {
    try {
      const response = await fetch(`${API}/customer-receipts/${row.id}/approve`, {
        method: 'POST',
        headers: getOrgHeader(),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.message ?? 'Unable to approve receipt')
      toast.success(`${row.receipt_no} approved.`)
      await loadData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to approve receipt.')
    }
  }

  const printCustomerReceipt = (row: CustomerReceiptRow) => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) {
      toast.error('Popup blocked. Please allow popups and try again.')
      return
    }

    const customer = customers.find((item) => item.id === row.customer_id)
    const invoiceLabel = row.invoice_no || 'Cumulative'
    const paymentLabel = row.payment_mode || 'Cash'

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Customer Receipt ${row.receipt_no}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; margin: 32px; color: #111827; }
    h1 { margin: 0 0 6px; font-size: 24px; }
    .meta { font-size: 12px; color: #475569; line-height: 1.8; }
    .card { border: 1px solid #dbe2ea; border-radius: 12px; padding: 16px; margin-top: 18px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #dfe7f0; padding: 8px 10px; text-align: left; font-size: 12px; }
    th { background: #f8fafc; }
    .right { text-align: right; }
    .total { font-size: 16px; font-weight: 700; }
    .foot { margin-top: 30px; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <h1>Customer Receipt</h1>
  <div class="meta">
    <div>Receipt No: <b>${row.receipt_no}</b></div>
    <div>Date: ${formatDisplayDate(row.receipt_date)}</div>
    <div>Customer: ${customer?.name ?? row.customer_name ?? '-'}</div>
  </div>

  <div class="card">
    <table>
      <tbody>
        <tr>
          <th style="width:180px">Invoice Mode</th>
          <td>${row.invoice_mode}</td>
        </tr>
        <tr>
          <th>Invoice No</th>
          <td>${invoiceLabel}</td>
        </tr>
        <tr>
          <th>Payment Mode</th>
          <td>${paymentLabel}</td>
        </tr>
        <tr>
          <th>Amount</th>
          <td class="right total">${formatAmount(Number(row.amount ?? 0))}</td>
        </tr>
        <tr>
          <th>Remarks</th>
          <td>${row.remarks || '-'}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="foot">
    <div>Generated on: ${formatDisplayDate(new Date().toISOString())}</div>
  </div>
</body>
</html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 300)
  }

  return (
    <div>
      <PageHeader title="Customer Receipt" breadcrumb={['Transactions', 'Customer Receipt']} />
      <Toolbar
        onAddNew={openAdd}
        onExportExcel={exportCustomerReceiptsToExcel}
        onExportPdf={printCustomerReceipts}
        onPrint={printCustomerReceipts}
        onRefresh={() => { void loadData() }}
        onColumnChooser={() => setColumnChooserOpen((open) => !open)}
      />
      {columnChooserOpen ? (
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
          <span className="font-medium text-slate-700">Show columns:</span>
          {columns.map((column) => {
            const key = String(column.key)
            return (
              <label key={key} className="inline-flex items-center gap-1.5 text-slate-600">
                <input
                  type="checkbox"
                  checked={visibleColumnKeys.includes(key)}
                  disabled={visibleColumnKeys.length === 1 && visibleColumnKeys.includes(key)}
                  onChange={() => setVisibleColumnKeys((keys) => keys.includes(key) ? keys.filter((item) => item !== key) : [...keys, key])}
                />
                {column.label}
              </label>
            )
          })}
        </div>
      ) : null}
      <SearchFilterPanel onSearchChange={setSearch} searchPlaceholder="Search by receipt no or customer..." />

      <DataGrid<CustomerReceiptRow>
        data={filtered}
        columns={visibleColumns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={openEdit}
        onEdit={openEdit}
        onApprove={(row) => { void handleApprove(row) }}
        isRowApproved={(row) => row.approved === true}
        onDelete={(row) => setConfirmDelete(row)}
        onPrint={(row) => printCustomerReceipt(row)}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3 py-6">
          <div className="w-full max-w-lg max-h-[85vh] overflow-hidden rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900">
                {editing ? 'Edit Customer Receipt' : 'New Customer Receipt'}
              </h2>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setEditing(null) }}
                className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-3 max-h-[72vh] overflow-y-auto pr-1 text-xs">
              <div className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Receipt Number</label>
                  <input className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('receipt_no', { required: true })} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Date</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="dd/mm/yyyy"
                      className="w-full rounded-full border border-slate-200 px-3 py-1.5 pr-9"
                      {...register('receipt_date', {
                        required: true,
                        onChange: (event) => {
                          const formatted = formatDateInputText(event.target.value)
                          if (formatted !== event.target.value) {
                            event.target.value = formatted
                          }
                        },
                      })}
                    />
                    <input
                      ref={dateInputRef}
                      type="date"
                      className="sr-only"
                      value={watch('receipt_date') ? formatDateForInput(watch('receipt_date')) : ''}
                      onChange={(event) => {
                        const formatted = formatDisplayDate(event.target.value)
                        setValue('receipt_date', formatted, { shouldDirty: true })
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Select date"
                      onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
                      className="absolute inset-y-0 right-2 flex items-center justify-center text-slate-500 hover:text-slate-700"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="5" width="18" height="16" rx="2" />
                        <path d="M8 3v4M16 3v4M3 10h18" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Customer</label>
                  <select className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('customer_id', { required: true })}>
                    <option value="">Select customer</option>
                    {customers.map((customer) => {
                      const customerType = customer.type === 'Red' ? 'National' : customer.type
                      return <option key={customer.id} value={customer.id}>{customer.name} ({customerType})</option>
                    })}
                  </select>
                  {errors.customer_id ? <p className="mt-1 text-[10px] text-rose-500">Required</p> : null}
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice Mode</label>
                  <select className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('invoice_mode', { required: true })}>
                    <option value="Invoice by Invoice">Invoice by Invoice</option>
                    <option value="Cumulative">Cumulative</option>
                  </select>

                  {watchedInvoiceMode === 'Cumulative' && watchedCustomerId ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Total Invoices: <span className="font-medium">{formatAmount(cumulativeCustomerSummary.totalInvoices)}</span>
                      {' • '}
                      Paid: <span className="font-medium text-slate-700">{formatAmount(cumulativeCustomerSummary.paid)}</span>
                      {' • '}
                      Outstanding: <span className="font-semibold text-rose-600">{formatAmount(cumulativeCustomerSummary.outstanding)}</span>
                    </p>
                  ) : null}

                </div>

                {watchedInvoiceMode === 'Invoice by Invoice' ? (
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[11px] font-medium text-slate-700">Invoice No</label>
                    <select className="w-full rounded-full border border-slate-200 px-3 py-1.5 text-xs" {...register('invoice_no')}>
                      <option value="">Select invoice</option>
                      {invoicesForCustomer.map((invoice) => {
                        const invoiceNo = invoice.directSaleNo ?? invoice.invoice_no ?? invoice.id
                        const invoiceValue = invoice.invoice_no ?? invoiceNo
                        return <option key={invoice.id} value={invoiceValue}>{invoiceNo} - {formatAmount(Number(invoice.invoiceTotal ?? invoice.total ?? 0))}</option>
                      })}
                    </select>
                    {selectedInvoice ? (
                      <p className="mt-1 text-[11px] text-slate-600">
                        Invoice Total: <span className="font-medium">{formatAmount(Number(selectedInvoice.invoiceTotal ?? selectedInvoice.total ?? 0))}</span>
                        {' • '}
                        Paid: <span className="font-medium text-slate-700">{formatAmount(paidAmountBefore)}</span>
                        {' • '}
                        Outstanding: <span className="font-semibold text-rose-600">{formatAmount(outstandingBefore)}</span>
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Payment Mode</label>
                  <select className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('payment_mode', { required: true })}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-slate-700">Amount</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-full border border-slate-200 px-3 py-1.5"
                    value={watch('amount') && Number(watch('amount')) > 0 ? formatAmountInputText(Number(watch('amount'))) : ''}
                    onChange={(event) => {
                      const rawValue = event.target.value.replace(/[^\d]/g, '')
                      const numericValue = rawValue ? Number(rawValue) : 0
                      setValue('amount', numericValue, { shouldDirty: true })
                    }}
                  />
                  {watchedInvoiceMode === 'Invoice by Invoice' && selectedInvoice ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Outstanding after this payment: <span className="font-semibold text-emerald-700">{formatAmount(outstandingAfter)}</span>
                    </p>
                  ) : null}
                  {watchedInvoiceMode === 'Cumulative' && watchedCustomerId ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Outstanding after this payment: <span className="font-semibold text-emerald-700">{formatAmount(cumulativeOutstandingAfter)}</span>
                    </p>
                  ) : null}
                </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Payment Screenshot</label>
                <div
                  onClick={() => attachmentInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDraggingAttachment(true)
                  }}
                  onDragLeave={() => setIsDraggingAttachment(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDraggingAttachment(false)
                    handleAttachmentSelection(event.dataTransfer.files)
                  }}
                  className={`cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-3 py-2 ${isDraggingAttachment ? 'border-green-400 bg-green-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <button type="button" className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-300">
                      Choose file
                    </button>
                    <span className="ml-3 truncate text-[11px] text-slate-600">{selectedAttachmentName}</span>
                  </div>

                  {watchedAttachment && watchedAttachment.length > 0 ? (
                    <div className="mt-3 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                      <div className="space-y-2">
                        {watchedAttachment.map((file, index) => {
                          const url = file.type.startsWith('image/') || file.type === 'application/pdf' ? URL.createObjectURL(file) : null
                          return (
                            <div key={`${file.name}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-2">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="truncate text-[11px] text-slate-700">{file.name}</span>
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      if (url) {
                                        window.open(url, '_blank', 'noopener,noreferrer')
                                      }
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-slate-100"
                                  >
                                    View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      setValue('attachment', watchedAttachment.filter((_, fileIndex) => fileIndex !== index), { shouldDirty: true })
                                    }}
                                    className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-medium text-rose-700 hover:bg-rose-100"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                              {url ? (
                                file.type.startsWith('image/') ? (
                                  <img src={url} alt={file.name} className="max-h-28 w-full rounded-md object-contain" />
                                ) : (
                                  <embed src={url} type="application/pdf" className="h-28 w-full rounded-md" />
                                )
                              ) : (
                                <div className="rounded-md border border-dashed border-slate-200 bg-white p-3 text-[10px] text-slate-500">Preview unavailable for this file type.</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  <input
                    ref={(element) => {
                      attachmentInputRef.current = element
                      const { ref } = register('attachment')
                      if (typeof ref === 'function') {
                        ref(element)
                      }
                    }}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    className="hidden"
                    multiple
                    onChange={(event) => {
                      handleAttachmentSelection(event.target.files)
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">Accepted formats: JPG, PNG, PDF</p>
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium text-slate-700">Remarks</label>
                <input className="w-full rounded-full border border-slate-200 px-3 py-1.5" {...register('remarks')} />
              </div>

              <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-3 text-xs">
                <button type="submit" className="rounded-full bg-green-600 px-4 py-1.5 font-semibold text-white shadow-sm hover:bg-green-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete customer receipt?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.receipt_no}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default CustomerReceiptPage