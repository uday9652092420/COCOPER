/**
 * @file WarehouseMasterPage.tsx
 * @description Warehouse master maintenance screen.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import type { Warehouse } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'
import { Edit2, Trash2 } from 'lucide-react'
import {
  createWarehouse,
  type CreateWarehouseResponse,
} from "../../services/warehouseservices/warehouse.service";
import {
    getNextWarehouseCode
} from "../../services/warehouseservices/warehouse.service";
import {
  getWarehouses,
} from "../../services/warehouseservices/warehouse.service";

import {
  updateWarehouse,
  deleteWarehouse,
} from "../../services/warehouseservices/warehouse.service";
/**
 * @description Warehouse form values.
 */
interface WarehouseFormValues {
  code: string
  name: string
  address: string
  manager: string
  contactNumber: string
  status: "Active" | "Inactive"
}
// interface CreateWarehouseResponse {
//   id: string
//   code: string
//   name: string
//   address: string
//   manager: string
//   contact_number: string
//   status: "Active" | "Inactive"
//   created_at: string
// }

/**
 * @component WarehouseMasterPage
 * @description Warehouse master maintenance screen.
 */
const WarehouseMasterPage: React.FC = () => {
  const [nextCode, setNextCode] = useState("");
  const [records, setRecords] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Warehouse | null>(null)

 const loadWarehouses = async () => {
  try {
    setLoading(true);

    const rows = await getWarehouses();

    const mapped: Warehouse[] = rows.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      address: r.address ?? "",
      manager: r.manager ?? "",
      contactNumber: r.contact_number ?? "",
      status: r.status,
      createdAt: r.created_at,
    }));

    setRecords(mapped);
  } catch (error) {
    console.error(error);
    toast.error("Failed to load warehouses");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadWarehouses();
}, []);

  const filtered = useMemo(
    () =>
      records.filter((w) => {
        const q = search.toLowerCase()
        const matchesSearch =
          !q || w.code.toLowerCase().includes(q) || w.name.toLowerCase().includes(q) || w.manager.toLowerCase().includes(q)
        const matchesStatus = !statusFilter || w.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [records, search, statusFilter]
  )

  const fields: FormFieldConfig[] = [
  {
    name: 'code',
    label: 'Warehouse Code',
    type: 'text',
    required: true,
    readOnly: true,
   
  },
    { name: 'name', label: 'Warehouse Name', type: 'text', required: true },
    { name: 'address', label: 'Address', type: 'textarea', required: true },
    { name: 'manager', label: 'Manager', type: 'text', required: true },
    { name: 'contactNumber', label: 'Contact Number', type: 'text', required: true },
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

  const openAdd = async () => {
    try {
        const code = await getNextWarehouseCode();

        setNextCode(code);

        setEditing(null);

        setModalOpen(true);
    } catch {
        toast.error("Failed to generate warehouse code");
    }
}

  /**
   * @function openEdit
   * @description Prepare modal to edit selected warehouse record.
   */
  const openEdit = (row: Warehouse) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Save handler for add/edit operations.
   */
  /**
 * @function handleSave
 * @description Save handler for Add/Edit Warehouse.
 */
const handleSave = async (
  values: WarehouseFormValues,
  resetAfter: boolean
) => {
  try {
    if (editing) {
  await updateWarehouse(editing.id, {
    code: values.code,
    name: values.name,
    address: values.address,
    manager: values.manager,
    contact_number: values.contactNumber,
    status: values.status,
  });

  await loadWarehouses();

  toast.success("Warehouse updated successfully.");
}
    else {

      const payload = {
  code: values.code,
  name: values.name,
  address: values.address,
  manager: values.manager,
  contact_number: values.contactNumber,
  status: values.status,
};

console.log("REQUEST BODY", payload);

await createWarehouse(payload);
      // Create Warehouse API
  //    const created: CreateWarehouseResponse =
  // await createWarehouse({
  //       code: values.code,
  //       name: values.name,
  //       address: values.address,
  //       manager: values.manager,
  //       contact_number: values.contactNumber,
  //       status: values.status,
  //     });

//       const newRecord: Warehouse = {
//   id: created.id,
//   code: created.code,
//   name: created.name,
//   address: created.address ?? "",
//   manager: created.manager ?? "",
//   contactNumber: created.contact_number ?? "",
//   status: created.status,
//   createdAt: created.created_at.substring(0, 10),
// }

      // Keep existing mock records + newly created DB record
     
      await loadWarehouses();

      toast.success("Warehouse created successfully.");
    }

    if (!resetAfter) {
      setModalOpen(false);
      setEditing(null);
    }
  } catch (error: any) {
  console.error(error);

  toast.error(
    error?.message ||
    error?.details?.errors?.contact_number ||
    "Failed to save warehouse."
  );
}
};

  /**
   * @function handleDelete
   * @description Delete confirmed warehouse record.
   */
 const handleDelete = async () => {
  if (!confirmDelete) return;

  try {
    await deleteWarehouse(confirmDelete.id);

    toast.success("Warehouse deleted successfully.");

    await loadWarehouses();

    setConfirmDelete(null);
  } catch (error: any) {
    console.error(error);

    toast.error(
      error?.message ||
      "Unable to delete warehouse."
    );

    setConfirmDelete(null);
  }
};

  /**
   * @description Table column definitions (placed after handlers to avoid any reference issues).
   */
  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'manager', label: 'Manager' },
    { key: 'contactNumber', label: 'Contact No.' },
    {
      key: 'status',
      label: 'Status',
      render: (row: Warehouse) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row: Warehouse) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: '',
      width: '130px',
      render: (row: Warehouse) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Edit ${row.name}`}
            onClick={() => openEdit(row)}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Edit2 className="h-3 w-3" />
            Edit
          </button>

          <button
            type="button"
            aria-label={`Delete ${row.name}`}
            onClick={() => setConfirmDelete(row)}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Warehouse Master" breadcrumb={['Masters', 'Warehouse Master']} />
      <Toolbar title="Warehouse Master" onAdd={openAdd} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(r: Warehouse) => r.id} />
      <MasterFormModal<WarehouseFormValues>
        open={modalOpen}
        title={editing ? 'Edit Warehouse' : 'Add Warehouse'}
        fields={fields}
        defaultValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                address: editing.address,
                manager: editing.manager,
                contactNumber: editing.contactNumber,
                status: editing.status,
              }
            : {
               code: nextCode,
                name: '',
                address: '',
                manager: '',
                contactNumber: '',
                status: 'Active',
              }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete warehouse?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default WarehouseMasterPage