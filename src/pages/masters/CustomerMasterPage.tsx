/**
 * @file CustomerMasterPage.tsx
 * @description Customer master maintenance screen with business rules for customer type.
 */

import type React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  getCustomers,
  createCustomer,
 updateCustomer,
  deleteCustomer,
  getNextCustomerCode,
} from "../../services/customerservices/customer.service";

import type {
  CustomerResponse,
} from "../../services/customerservices/customer.service";

import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'
import { usePermissions } from '../../hooks/usePermissions'
import { INDIAN_STATES } from '../../constants/indianStates'

/**
 * @description Customer form values including two additional contact persons and numbers.
 */
interface CustomerFormValues {
  code: string
  name: string
  type: CustomerType
  state: string
  address: string
  mobile: string
  whatsapp: string
  creditLimit?: number | string
  status: string
  contactPerson1?: string
  contactNo1?: string
  contactPerson2?: string
  contactNo2?: string
  contactPerson3?: string
  contactNo3?: string
}
interface Customer {
  id: string;
  code: string;
  name: string;

  type: "Premium" | "Local" | "Red";

  state: string;
  address: string;
  mobile: string;
  whatsapp: string;

  contactPerson1: string;
  contactNo1: string;
  contactPerson2: string;
  contactNo2: string;
  contactPerson3: string;
  contactNo3: string;

  creditLimit: number;

  status: "Active" | "Inactive";

  createdAt: string;
}
type CustomerType =
  | "Premium"
  | "Local"
  | "Red";
const mapCustomer = (
  item: CustomerResponse
): Customer => ({

  id: item.id,

  code: item.code,

  name: item.name,

  type: item.type,

  state: item.state ?? "",

  address: item.address ?? "",

  mobile: item.mobile ?? "",

  whatsapp: item.whatsapp ?? "",

  contactPerson1: item.contact_person1 ?? "",

  contactNo1: item.contact_no1 ?? "",

  contactPerson2: item.contact_person2 ?? "",

  contactNo2: item.contact_no2 ?? "",

  contactPerson3: item.contact_person3 ?? "",

  contactNo3: item.contact_no3 ?? "",

  creditLimit: item.credit_limit ?? 0,

  status: item.status,

  createdAt: item.created_at,

});

/**
 * @description Helper describing business rule for customer type.
 */
const customerTypeHint = (type: CustomerType | ''): string => {
  if (type === 'Premium') return 'Credit allowed'
  if (type === 'Local') return 'Cash and credit allowed'
  if (type === 'Red') return 'Cash only – no credit allowed'
  return 'Select a customer type to view business rule.'
}

const escapeHtml = (value: string | number): string =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

/**
 * @component CustomerMasterPage
 * @description Customer master page component.
 */
const CustomerMasterPage: React.FC = () => {
  const { can } = usePermissions()
  const [records, setRecords] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Customer | null>(null)
  const [currentType, setCurrentType] = useState<CustomerType | ''>('')

 const loadCustomers = async () => {

  try {

    setLoading(true);

    const response =
      await getCustomers();

    setRecords(
      response.map(mapCustomer)
    );

  } catch {

    toast.error(
      "Failed to load customers"
    );

  } finally {

    setLoading(false);

  }

};

useEffect(() => {

  loadCustomers();

}, []);

  const filtered = useMemo(
    () => 
      records.filter((c) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.mobile.includes(search)
        const matchesStatus = !statusFilter || c.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [records, search, statusFilter]
  )

  const exportCustomersToExcel = () => {
    const rows = records.map((customer) => `
      <tr>
        <td>${escapeHtml(customer.code)}</td>
        <td>${escapeHtml(customer.name)}</td>
        <td>${escapeHtml(customer.contactPerson1)}</td>
        <td>${escapeHtml(customer.contactNo1)}</td>
        <td>${escapeHtml(customer.contactPerson2)}</td>
        <td>${escapeHtml(customer.contactNo2)}</td>
        <td>${escapeHtml(customer.contactPerson3)}</td>
        <td>${escapeHtml(customer.contactNo3)}</td>
        <td>${escapeHtml(customer.type)}</td>
        <td>${escapeHtml(customer.state)}</td>
        <td>${escapeHtml(customer.mobile)}</td>
        <td>${escapeHtml(customer.whatsapp)}</td>
        <td>${escapeHtml(customer.creditLimit.toString())}</td>
        <td>${escapeHtml(customer.status)}</td>
        <td>${escapeHtml(formatDate(customer.createdAt))}</td>
      </tr>`).join('')
    const sheet = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Customers</title></head><body>
      <table border="1"><thead><tr>
        <th>Code</th><th>Name</th><th>Contact Person 1</th><th>Contact No</th>
        <th>Contact Person 2</th><th>Contact No</th><th>Contact Person 3</th><th>Contact No</th><th>Type</th><th>State</th>
        <th>Mobile</th><th>WhatsApp</th><th>Credit Limit</th><th>Status</th><th>Created Date</th>
      </tr></thead><tbody>${rows}</tbody></table></body></html>`
    const url = URL.createObjectURL(new Blob([sheet], { type: 'application/vnd.ms-excel' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'customers.xls'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Customer sheet downloaded')
  }

  const exportCustomersToPdf = () => {
    const rows = records.map((customer) => `
      <tr>
        <td>${escapeHtml(customer.code)}</td>
        <td>${escapeHtml(customer.name)}</td>
        <td>${escapeHtml(customer.contactPerson1)}</td>
        <td>${escapeHtml(customer.contactNo1)}</td>
        <td>${escapeHtml(customer.contactPerson2)}</td>
        <td>${escapeHtml(customer.contactNo2)}</td>
        <td>${escapeHtml(customer.contactPerson3)}</td>
        <td>${escapeHtml(customer.contactNo3)}</td>
        <td>${escapeHtml(customer.type)}</td>
        <td>${escapeHtml(customer.state)}</td>
        <td>${escapeHtml(customer.mobile)}</td>
        <td>${escapeHtml(customer.creditLimit.toLocaleString('en-IN'))}</td>
        <td>${escapeHtml(customer.status)}</td>
        <td>${escapeHtml(formatDate(customer.createdAt))}</td>
      </tr>`).join('')
    const printWindow = window.open('', '_blank')

    if (!printWindow) {
      toast.error('Allow pop-ups to export the PDF')
      return
    }

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Customer Master</title><style>
      @page { size: landscape; margin: 12mm; }
      body { font-family: Arial, sans-serif; color: #172033; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { color: #64748b; font-size: 11px; margin: 0 0 14px; }
      table { border-collapse: collapse; width: 100%; font-size: 9px; }
      th { background: #e2e8f0; text-align: left; }
      th, td { border: 1px solid #cbd5e1; padding: 5px; }
    </style></head><body><h1>Customer Master</h1><p>Saved customers</p>
      <table><thead><tr><th>Code</th><th>Name</th><th>Contact Person 1</th><th>Contact No</th>
      <th>Contact Person 2</th><th>Contact No</th><th>Contact Person 3</th><th>Contact No</th><th>Type</th><th>State</th><th>Mobile</th>
      <th>Credit Limit</th><th>Status</th><th>Created Date</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const columns: ColumnDef<Customer>[] = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'contactPerson1', label: 'Contact Person 1' },
    { key: 'type', label: 'Type' },
    { key: 'state', label: 'State' },
    { key: 'mobile', label: 'Mobile' },
    {
      key: 'creditLimit',
      label: 'Credit Limit',
      render: (row) => row.creditLimit.toLocaleString('en-IN'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] ${
            row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: Customer) => (
        <div className="flex gap-2">
          {can('customer', 'edit') ? (
            <button
              type="button"
              onClick={() => openEdit(row)}
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
          ) : null}
          {can('customer', 'delete') ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(row)}
              className="rounded-full bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
            >
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  const fields: FormFieldConfig[] = [
    { name: 'code', label: 'Customer Code', type: 'text', required: true, readOnly:true},
    { name: 'name', label: 'Customer Name', type: 'text', required: true },
    { name: 'contactPerson1', label: 'Contact Person 1', type: 'text', required: false },
    { name: 'contactNo1', label: 'Contact No', type: 'text', required: false },
    { name: 'contactPerson2', label: 'Contact Person 2', type: 'text', required: false },
    { name: 'contactNo2', label: 'Contact No', type: 'text', required: false },
    { name: 'contactPerson3', label: 'Contact Person 3', type: 'text', required: false },
    { name: 'contactNo3', label: 'Contact No', type: 'text', required: false },
    {
      name: 'type',
      label: 'Customer Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Premium', value: 'Premium' },
        { label: 'Local', value: 'Local' },
        { label: 'Red', value: 'Red' },
      ],
    },
    {
      name: 'state',
      label: 'State',
      type: 'select',
      required: true,
      options: INDIAN_STATES.map((state) => ({ label: state, value: state })),
    },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'mobile', label: 'Mobile', type: 'text', required: true },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text', required: true },
    { name: 'creditLimit', label: 'Credit Limit', type: 'number', required: false },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
      ],
    },
  ]

  /**
   * @function openAdd
   * @description Open modal to add a new customer.
   */
  const openAdd = async () => {

  try {

    setEditing(null);

    const code =
      await getNextCustomerCode();

    setEditing({

      id: "",

      code,

      name: "",

      type: "Local",

      state: "",

      address: "",

      mobile: "",

      whatsapp: "",

      contactPerson1: "",

      contactNo1: "",

      contactPerson2: "",

      contactNo2: "",

      contactPerson3: "",

      contactNo3: "",

      creditLimit: 0,

      status: "Active",

      createdAt: "",

    });

    setCurrentType("Local");

    setModalOpen(true);

  }

  catch (e: any) {

    toast.error(
      e.message
    );

  }

};

  /**
   * @function openEdit
   * @description Open modal to edit an existing customer.
   */
  const openEdit = (row: Customer) => {
    setEditing(row)
    setCurrentType(row.type)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save or update customer record. Supports reset-after-add behavior.
   */
 const handleSave = async (
  values: CustomerFormValues,
  resetAfter: boolean
) => {

  try {

    const payload = {

      code: values.code,

      name: values.name,

      type: values.type,

      state: values.state,

      address: values.address,

      mobile: values.mobile,

      whatsapp: values.whatsapp,

      contact_person1:
        values.contactPerson1,

      contact_no1:
        values.contactNo1,

      contact_person2:
        values.contactPerson2,

      contact_no2:
        values.contactNo2,

      contact_person3:
        values.contactPerson3,

      contact_no3:
        values.contactNo3,

      credit_limit: values.type === "Red" ? 0 : Number(values.creditLimit || 0),

      status:
        values.status as
          | "Active"
          | "Inactive",

    };

    if (editing?.id) {

      await updateCustomer(
        editing.id,
        payload
      );

      toast.success(
        "Customer updated successfully"
      );

    } else {

      await createCustomer(
        payload
      );

      toast.success(
        "Customer created successfully"
      );

    }

    await loadCustomers();

    if (!resetAfter) {

      setModalOpen(false);

      setEditing(null);

      setCurrentType("");

    } else {

      const code =
        await getNextCustomerCode();

      setEditing({

        id: "",

        code,

        name: "",

        type: "Local",

        state: "",

        address: "",

        mobile: "",

        whatsapp: "",

        contactPerson1: "",

        contactNo1: "",

        contactPerson2: "",

        contactNo2: "",

        contactPerson3: "",

        contactNo3: "",

        creditLimit: 0,

        status: "Active",

        createdAt: "",

      });

    }

  } catch (e: any) {

    toast.error(
      e.message ??
      "Customer save failed"
    );

  }

};

  /**
   * @function handleDelete
   * @description Delete the customer stored in confirmDelete state.
   */
  const handleDelete = async () => {

  if (!confirmDelete)
    return;

  try {

    await deleteCustomer(
      confirmDelete.id
    );

    toast.success(
      "Customer deleted"
    );

    setConfirmDelete(null);

    loadCustomers();

  }

  catch (e: any) {

    toast.error(
      e.message ??
      "Delete failed"
    );

  }

};
  return (
    <div>
      <PageHeader title="Customer Master" breadcrumb={['Masters', 'Customer Master']} />
      <Toolbar
        onAddNew={can('customer', 'create') ? openAdd : undefined}
        onExportExcel={exportCustomersToExcel}
        onExportPdf={exportCustomersToPdf}
        onPrint={exportCustomersToPdf}
        onRefresh={loadCustomers}
      />

      {/* Add New button (non-destructive addition to existing toolbar behavior) */}
     

      <SearchFilterPanel onSearchChange={setSearch} onStatusChange={setStatusFilter} searchPlaceholder="Search by code, name, mobile..." />

      <DataGrid<Customer>
        data={filtered}
        columns={columns}
        getRowId={(row) => row.id}
        loading={loading}
        onView={(row) => openEdit(row)}
        onEdit={(row) => openEdit(row)}
        onDelete={(row) => setConfirmDelete(row)}
      />

      <MasterFormModal<CustomerFormValues>
        open={modalOpen}
        title={editing?.id ? 'Edit Customer' : 'Add Customer'}
        fields={fields}
        defaultValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                contactPerson1: (editing as any).contactPerson1 ?? '',
                contactNo1: (editing as any).contactNo1 ?? '',
                contactPerson2: (editing as any).contactPerson2 ?? '',
                contactNo2: (editing as any).contactNo2 ?? '',
                contactPerson3: (editing as any).contactPerson3 ?? '',
                contactNo3: (editing as any).contactNo3 ?? '',
                type: editing.type,
                state: editing.state,
                address: editing.address,
                mobile: editing.mobile,
                whatsapp: editing.whatsapp,
                creditLimit: editing.creditLimit,
                status: editing.status,
              }
            : {
                code: '',
                name: '',
                contactPerson1: '',
                contactNo1: '',
                contactPerson2: '',
                contactNo2: '',
                contactPerson3: '',
                contactNo3: '',
                type: 'Local',
                state: '',
                address: '',
                mobile: '',
                whatsapp: '',
                creditLimit: 0,
                status: 'Active',
              }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          setCurrentType('')
        }}
        onSave={handleSave}
      />

      <div className="mt-2 rounded-2xl border border-amber-100 bg-amber-50/60 px-3 py-2 text-[11px] text-amber-800">
        <span className="font-semibold">Business Rule:</span> {customerTypeHint(currentType)}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete customer?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default CustomerMasterPage