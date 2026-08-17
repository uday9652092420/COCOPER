/**
 * @file ItemMasterPage.tsx
 * @description Item master maintenance screen.
 */


import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'
import { Edit2, Trash2 } from 'lucide-react'
import {
  getItems,
  getNextItemCode,
  createItem,
  updateItem,
  deleteItem,
  type ItemResponse,
} from "../../services/itemservices/item.service";
import { onScopeChange } from "../../utils/scopeEvents";
import { usePermissions } from "../../hooks/usePermissions";


/**
 * @description Item form values.
 */
interface ItemFormValues {
  code: string
  name: string
  category: string
  uom: string
  status: string
}

/**
 * @component ItemMasterPage
 * @description Item master maintenance screen.
 */
const ItemMasterPage: React.FC = () => {
  const { can } = usePermissions()
  const [records, setRecords] = useState<ItemResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
 const [editing, setEditing] = useState<ItemResponse | null>(null)
 const [confirmDelete, setConfirmDelete] = useState<ItemResponse | null>(null)

  const loadItems = async () => {
  try {
    setLoading(true);

    const data = await getItems();

    setRecords(data);
  } catch (error: any) {
    toast.error(error.message || "Failed to load items");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  loadItems();

  // Re-fetch when the organization or branch changes in the header.
  return onScopeChange(() => loadItems());
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const filtered = useMemo(
    () =>
      records.filter((it) => {
        const q = search.toLowerCase()
        const matchesSearch = !q || it.code.toLowerCase().includes(q) || it.name.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
        const matchesStatus = !statusFilter || it.status === statusFilter
        return matchesSearch && matchesStatus
      }),
    [records, search, statusFilter]
  )

  const columns = [
    { key: 'code', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { key: 'uom', label: 'UOM' },
    {
      key: 'status',
      label: 'Status',
      render: (row: ItemResponse) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row: ItemResponse) => formatDate(row.created_at)
    },
    {
      key: 'actions',
      label: 'Actions',
      width: '180px',
      render: (row: ItemResponse) => (
        <div className="flex items-center gap-2">
          {can('item', 'edit') ? (
            <button
              type="button"
              aria-label={`Edit ${row.name}`}
              onClick={() => openEdit(row)}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <Edit2 className="h-3 w-3" />
              Edit
            </button>
          ) : null}

          {can('item', 'delete') ? (
            <button
              type="button"
              aria-label={`Delete ${row.name}`}
              onClick={() => setConfirmDelete(row)}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  const fields: FormFieldConfig[] = [
    { name: 'code', label: 'Item Code', type: 'text', required: true },
    { name: 'name', label: 'Item Name', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'uom', label: 'UOM', type: 'text', required: true },
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
  setEditing(null);

  const code = await getNextItemCode();

  setEditing({
    id: "",
    code,
    name: "",
    category: "",
    uom: "",
    status: "Active",
    created_at: "",
  });

  setModalOpen(true);
};

const openEdit = (row: ItemResponse) => {
  setEditing(row);
  setModalOpen(true);
};

  const handleSave = async (
  values: ItemFormValues,
  resetAfter: boolean
) => {
  try {
    if (editing?.id) {
      await updateItem(editing.id, {
        code: values.code,
        name: values.name,
        category: values.category,
        uom: values.uom,
        status: values.status as "Active" | "Inactive",
      });

      toast.success("Item updated successfully");
    } else {
      await createItem({
        code: values.code,
        name: values.name,
        category: values.category,
        uom: values.uom,
        status: values.status as "Active" | "Inactive",
      });

      toast.success("Item created successfully");
    }

    await loadItems();

    if (!resetAfter) {
      setModalOpen(false);
      setEditing(null);
    } else {
      const code = await getNextItemCode();

      setEditing({
        id: "",
        code,
        name: "",
        category: "",
        uom: "",
        status: "Active",
        created_at: "",
      });
    }
  } catch (error: any) {
    toast.error(error.message || "Operation failed");
  }
};

 const handleDelete = async () => {
  if (!confirmDelete) return;

  try {
    await deleteItem(confirmDelete.id);

    toast.success("Item deleted successfully");

    await loadItems();

    setConfirmDelete(null);
  } catch (error: any) {
    toast.error(error.message || "Delete failed");
  }
};
  return (
    <div>
      <PageHeader title="Item Master" breadcrumb={['Masters', 'Item Master']} />
      <Toolbar title="Item Master" onAdd={can('item', 'create') ? openAdd : undefined} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(r: ItemResponse)=>r.id}
      
    />
      <MasterFormModal<ItemFormValues>
        open={modalOpen}
        title={editing ? 'Edit Item' : 'Add Item'}
        fields={fields}
        defaultValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                category: editing.category,
                uom: editing.uom,
                status: editing.status,
              }
            : { code: '', name: '', category: '', uom: '', status: 'Active' }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete item?"
        description={confirmDelete ? `Are you sure you want to delete ${confirmDelete.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default ItemMasterPage;