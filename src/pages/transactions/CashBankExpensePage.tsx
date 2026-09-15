/**
 * @file CashBankExpensePage.tsx
 * @description Cash & Bank Expense entries with a list grid and add modal.
 */

import type React from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { CalendarDays, Eye, Trash2, Upload } from 'lucide-react'
import { DataGrid, type ColumnDef } from '../../components/common/DataGrid'
import { PageHeader } from '../../components/common/PageHeader'
import { ResponsiveModal } from '../../components/common/ResponsiveModal'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import PaginationControls from '../../components/common/PaginationControls'
import { getBranches, type Branch } from '../../services/branchesservices/branches.service'
import { approveCashBankExpense, createCashBankExpense, deleteCashBankExpense, getCashBankExpenses, updateCashBankExpense, type CashBankExpenseAttachment } from '../../services/cashbankexpenseservices/cashBankExpense.service'
import { useAuthStore } from '../../store/authStore'
import { usePermissions } from '../../hooks/usePermissions'
import { onScopeChange } from '../../utils/scopeEvents'

interface CashBankExpenseRecord {
  id: string
  branchId: string
  date: string
  branch: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  transactionType: 'Income' | 'Expenses'
  amount: number
  description: string
  approved: boolean
  attachments: CashBankExpenseAttachment[]
}

interface CashBankExpenseFormValues {
  date: string
  branch: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  transactionType: 'Income' | 'Expenses'
  amount: string
  description: string
}

const formatDateForDisplay = (value: string): string => {
  if (!value) return '-'
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

const todayIsoDate = (): string => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatDateInput = (value: string): string => {
  if (!value) return ''
  const [year, month, day] = value.split('-')
  if (!year || !month || !day) return ''
  return `${day}/${month}/${year}`
}

const CASH_BANK_EXPENSE_PAGE_SIZE = 15

const CashBankExpensePage: React.FC = () => {
  const { selectedOrganizationId } = useAuthStore()
  const { can } = usePermissions()
  const canCreate = can('cash-bank-expense', 'create')
  const canEdit = can('cash-bank-expense', 'edit')
  const canApprove = can('cash-bank-expense', 'approve')
  const canPrint = can('cash-bank-expense', 'print')
  const canDelete = can('cash-bank-expense', 'delete')
  const [records, setRecords] = useState<CashBankExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [branchOptions, setBranchOptions] = useState<Branch[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CashBankExpenseRecord | null>(null)
  const [viewing, setViewing] = useState<CashBankExpenseRecord | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<CashBankExpenseRecord | null>(null)
  const dateInputRef = useRef<HTMLInputElement | null>(null)
  const attachmentInputRef = useRef<HTMLInputElement | null>(null)
  const [attachments, setAttachments] = useState<CashBankExpenseAttachment[]>([])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CashBankExpenseFormValues>({
    defaultValues: {
      date: todayIsoDate(),
      branch: '',
      paymentMode: 'Cash',
      transactionType: 'Expenses',
      amount: '',
      description: '',
    },
  })

  useEffect(() => {
    getBranches()
      .then((branches) => {
        setBranchOptions(branches)
        if (branches.length && !watch('branch')) {
          setValue('branch', branches[0].id)
        }
      })
      .catch(() => setBranchOptions([]))
  }, [setValue, watch])

  const selectedDate = watch('date') || todayIsoDate()
  const dateLabel = formatDateInput(selectedDate)
  const dateRegistration = register('date', { required: 'Date is required' })

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const query = searchQuery.trim().toLowerCase()
      return !query || [record.branch, record.paymentMode, record.transactionType, record.description, formatDateForDisplay(record.date)]
        .some((value) => value.toLowerCase().includes(query))
    })
  }, [records, searchQuery])

  const totalPages = Math.ceil(filteredRecords.length / CASH_BANK_EXPENSE_PAGE_SIZE)
  const safeCurrentPage = Math.min(currentPage, Math.max(totalPages, 1))
  const paginatedRecords = filteredRecords.slice(
    (safeCurrentPage - 1) * CASH_BANK_EXPENSE_PAGE_SIZE,
    safeCurrentPage * CASH_BANK_EXPENSE_PAGE_SIZE,
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const loadRecords = useCallback(async () => {
    if (!selectedOrganizationId) {
      setRecords([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await getCashBankExpenses()
      setRecords(response.filter((record) => record.organizationId === selectedOrganizationId))
    } catch (error) {
      console.error(error)
      setRecords([])
      toast.error(error instanceof Error ? error.message : 'Unable to load cash / bank expenses.')
    } finally {
      setLoading(false)
    }
  }, [selectedOrganizationId])

  useEffect(() => {
    void loadRecords()
    return onScopeChange(() => { void loadRecords() })
  }, [loadRecords, selectedOrganizationId])

  const openAddModal = () => {
    setEditing(null)
    setAttachments([])
    const defaultDate = todayIsoDate()
    reset({
      date: defaultDate,
      branch: branchOptions[0]?.id ?? '',
      paymentMode: 'Cash',
      transactionType: 'Expenses',
      amount: '',
      description: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (record: CashBankExpenseRecord) => {
    setEditing(record)
    setAttachments(record.attachments ?? [])
    reset({ date: record.date, branch: record.branchId, paymentMode: record.paymentMode, transactionType: record.transactionType, amount: String(record.amount), description: record.description })
    setModalOpen(true)
  }

  const handleAttachmentSelection = (files: FileList | null) => {
    if (!files?.length) return
    const allowedTypes = new Set(['image/png', 'image/jpeg', 'application/pdf'])
    const selectedFiles = Array.from(files)
    const invalid = selectedFiles.find((file) => !allowedTypes.has(file.type))
    if (invalid) { toast.error('Only PNG, JPG, and PDF files are allowed.'); return }
    const oversized = selectedFiles.find((file) => file.size > 5 * 1024 * 1024)
    if (oversized) { toast.error('Each attachment must be 5 MB or smaller.'); return }
    if (attachments.length + selectedFiles.length > 5) { toast.error('You can attach up to 5 files.'); return }

    Promise.all(selectedFiles.map((file) => new Promise<CashBankExpenseAttachment>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ name: file.name, mimeType: file.type, data: String(reader.result) })
      reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`))
      reader.readAsDataURL(file)
    }))).then((newAttachments) => setAttachments((current) => [...current, ...newAttachments]))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to attach file.'))
    if (attachmentInputRef.current) attachmentInputRef.current.value = ''
  }

  const viewAttachment = (attachment: CashBankExpenseAttachment) => {
    const windowRef = window.open('', '_blank', 'width=1000,height=750')
    if (!windowRef) { toast.error('Popup blocked. Please allow popups to view attachments.'); return }
    windowRef.document.write(attachment.mimeType === 'application/pdf'
      ? `<iframe src="${attachment.data}" title="${attachment.name}" style="width:100%;height:100vh;border:0"></iframe>`
      : `<img src="${attachment.data}" alt="${attachment.name}" style="max-width:100%;max-height:100vh;display:block;margin:auto" />`)
    windowRef.document.close()
  }

  const onSubmit = async (values: CashBankExpenseFormValues) => {
    const amount = Number(values.amount || 0)

    if (!values.date) {
      toast.error('Please select a date.')
      return
    }

    if (!values.branch) {
      toast.error('Please select a branch.')
      return
    }

    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than zero.')
      return
    }

    try {
      const payload = {
        branchId: values.branch,
        date: values.date,
        paymentMode: values.paymentMode,
        transactionType: values.transactionType,
        amount,
        description: values.description || '',
        attachments,
      }
      const saved = editing ? await updateCashBankExpense(editing.id, payload) : await createCashBankExpense(payload)
      setRecords((previous) => editing ? previous.map((record) => record.id === saved.id ? saved : record) : [saved, ...previous])
      setModalOpen(false)
      setEditing(null)
      setAttachments([])
      toast.success(editing ? 'Cash / Bank expense updated.' : 'Cash / Bank expense saved.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save cash / bank expense.')
    }
  }

  const approveRecord = async (record: CashBankExpenseRecord) => {
    try {
      const approved = await approveCashBankExpense(record.id)
      setRecords((previous) => previous.map((item) => item.id === approved.id ? approved : item))
      toast.success('Cash / Bank expense approved.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to approve expense.') }
  }

  const deleteRecord = async () => {
    if (!confirmDelete) return
    try {
      await deleteCashBankExpense(confirmDelete.id)
      setRecords((previous) => previous.filter((record) => record.id !== confirmDelete.id))
      toast.success('Cash / Bank expense deleted.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to delete expense.') }
    setConfirmDelete(null)
  }

  const printRecords = (rows: CashBankExpenseRecord[], title = 'Cash & Bank Expenses') => {
    if (!rows.length) { toast.info('No expenses to print.'); return }
    const body = rows.map((row) => `<tr><td>${formatDateForDisplay(row.date)}</td><td>${row.branch}</td><td>${row.paymentMode}</td><td>${row.transactionType}</td><td>${formatCurrency(row.amount)}</td><td>${row.approved ? 'Approved' : 'Draft'}</td></tr>`).join('')
    const win = window.open('', '_blank', 'width=1100,height=750')
    if (!win) { toast.error('Popup blocked. Please allow popups and try again.'); return }
    win.document.write(`<html><head><title>${title}</title><style>body{font-family:Arial;margin:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>${title}</h1><table><thead><tr><th>Date</th><th>Branch</th><th>Payment Mode</th><th>Transaction</th><th>Amount</th><th>Status</th></tr></thead><tbody>${body}</tbody></table></body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 300)
  }

  const exportToExcel = () => {
    const body = filteredRecords.map((row) => `<tr><td>${formatDateForDisplay(row.date)}</td><td>${row.branch}</td><td>${row.paymentMode}</td><td>${row.transactionType}</td><td>${formatCurrency(row.amount)}</td><td>${row.approved ? 'Approved' : 'Draft'}</td></tr>`).join('')
    const url = URL.createObjectURL(new Blob([`<table><tr><th>Date</th><th>Branch</th><th>Payment Mode</th><th>Transaction</th><th>Amount</th><th>Status</th></tr>${body}</table>`], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a'); link.href = url; link.download = 'cash-bank-expenses.xls'; link.click(); URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<CashBankExpenseRecord>[] = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => formatDateForDisplay(row.date),
    },
    { key: 'branch', label: 'Branch' },
    {
      key: 'paymentMode',
      label: 'Payment Mode',
      render: (row) => row.paymentMode,
    },
    {
      key: 'transactionType',
      label: 'Transaction',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-medium ${
            row.transactionType === 'Income'
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {row.transactionType}
        </span>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'approved', label: 'Status', render: (row) => <span className={row.approved ? 'text-emerald-700' : 'text-amber-700'}>{row.approved ? 'Approved' : 'Draft'}</span> },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Cash & Bank Expenses" breadcrumb={['Transactions', 'Cash & Bank Expenses']} />

      <Toolbar
        onAddNew={canCreate ? openAddModal : undefined}
        onRefresh={() => { void loadRecords() }}
        onExportExcel={canPrint ? exportToExcel : undefined}
        onExportPdf={canPrint ? () => printRecords(filteredRecords, 'Cash & Bank Expenses PDF') : undefined}
        onPrint={canPrint ? () => printRecords(filteredRecords) : undefined}
      />
      <SearchFilterPanel
        searchPlaceholder="Search by branch, payment mode, or transaction..."
        onSearchChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
      />

      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <DataGrid<CashBankExpenseRecord>
          data={paginatedRecords}
          columns={columns}
          getRowId={(row) => row.id}
          loading={loading}
          onView={setViewing}
          onEdit={canEdit ? openEditModal : undefined}
          onApprove={canApprove ? (row) => { void approveRecord(row) } : undefined}
          onPrint={canPrint ? (row) => printRecords([row], 'Cash / Bank Expense') : undefined}
          onDelete={canDelete ? setConfirmDelete : undefined}
          isRowApproved={(row) => row.approved}
        />
      </div>

      <PaginationControls currentPage={safeCurrentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      <ResponsiveModal
        open={modalOpen}
        title={editing ? 'Edit Cash / Bank Expense' : 'New Cash / Bank Expense'}
        onClose={() => { setModalOpen(false); setEditing(null); setAttachments([]) }}
        maxWidth="max-w-3xl"
        maxHeight="90vh"
        scrollable={false}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Date</label>
              <div className="relative">
                <input
                  readOnly
                  value={dateLabel}
                  className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-emerald-500"
                  placeholder="dd/mm/yyyy"
                />
                <input
                  type="date"
                  {...dateRegistration}
                  ref={(element) => {
                    dateRegistration.ref(element)
                    dateInputRef.current = element
                  }}
                  onChange={(event) => {
                    void dateRegistration.onChange(event)
                    setValue('date', event.target.value)
                  }}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <CalendarDays
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                />
              </div>
              {errors.date ? <p className="mt-1 text-xs text-rose-600">{errors.date.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Branch</label>
              <select
                {...register('branch', { required: 'Branch is required' })}
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                {branchOptions.length === 0 ? <option value="">No branches found</option> : branchOptions.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
              {errors.branch ? <p className="mt-1 text-xs text-rose-600">{errors.branch.message}</p> : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mode of Payment</label>
              <select
                {...register('paymentMode', { required: true })}
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Mode of Transaction</label>
              <select
                {...register('transactionType', { required: true })}
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
              >
                <option value="Expenses">Expenses</option>
                <option value="Income">Income</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0"
                {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than zero' } })}
                className="w-full rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
              />
              {errors.amount ? <p className="mt-1 text-xs text-rose-600">{errors.amount.message}</p> : null}
            </div>

            <div />

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                {...register('description')}
                placeholder="Enter description"
                rows={3}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-slate-700">Attachments</label>
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-3">
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
                  multiple
                  onChange={(event) => handleAttachmentSelection(event.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => attachmentInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="h-4 w-4" />
                  Attach Files
                </button>
                <span className="ml-3 text-xs text-slate-500">PNG, JPG, or PDF. Maximum 5 files.</span>
                {attachments.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {attachments.map((attachment, index) => (
                      <div key={`${attachment.name}-${index}`} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                        <span className="truncate text-slate-700">{attachment.name}</span>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <button type="button" title="View attachment" onClick={() => viewAttachment(attachment)} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><Eye className="h-4 w-4" /></button>
                          <button type="button" title="Delete attachment" onClick={() => setAttachments((current) => current.filter((_, attachmentIndex) => attachmentIndex !== index))} className="rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-2 text-xs text-slate-500">No files attached.</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => { setModalOpen(false); setEditing(null); setAttachments([]) }}
              className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {editing ? 'Save Changes' : 'Save'}
            </button>
          </div>
        </form>
      </ResponsiveModal>

      <ResponsiveModal open={Boolean(viewing)} title="Cash / Bank Expense Details" onClose={() => setViewing(null)} maxWidth="max-w-lg" scrollable={false}>
        {viewing ? (
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
            <div><span className="text-xs text-slate-500">Date</span><p>{formatDateForDisplay(viewing.date)}</p></div>
            <div><span className="text-xs text-slate-500">Branch</span><p>{viewing.branch}</p></div>
            <div><span className="text-xs text-slate-500">Payment Mode</span><p>{viewing.paymentMode}</p></div>
            <div><span className="text-xs text-slate-500">Transaction</span><p>{viewing.transactionType}</p></div>
            <div><span className="text-xs text-slate-500">Amount</span><p>{formatCurrency(viewing.amount)}</p></div>
            <div><span className="text-xs text-slate-500">Status</span><p>{viewing.approved ? 'Approved' : 'Draft'}</p></div>
            <div className="col-span-2"><span className="text-xs text-slate-500">Description</span><p>{viewing.description || '-'}</p></div>
          </div>
        ) : null}
      </ResponsiveModal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Delete Cash / Bank Expense"
        description="Are you sure you want to delete this expense?"
        confirmLabel="Delete"
        onConfirm={() => { void deleteRecord() }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default CashBankExpensePage
