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
  getItemBranchStock,
  saveItemBranchStock,
  type ItemResponse,
} from "../../services/itemservices/item.service";
import { getBranches, type Branch } from "../../services/branchesservices/branches.service";
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
  branchWiseStock: number
}

interface BranchStockRow {
  branchId: string
  stock: string
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
 const [branches, setBranches] = useState<Branch[]>([])
 const [branchStockRows, setBranchStockRows] = useState<BranchStockRow[]>([])
 const [branchWiseStockTotal, setBranchWiseStockTotal] = useState(0)

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
  getBranches().then(setBranches).catch(() => setBranches([]));

  // Re-fetch when the organization or branch changes in the header.
  return onScopeChange(() => loadItems());
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

useEffect(() => {
  if (!modalOpen) return;
  if (!editing?.id) {
    setBranchStockRows([]);
    setBranchWiseStockTotal(0);
    return;
  }
  getItemBranchStock(editing.id)
    .then((rows) => {
      setBranchStockRows(rows.map((row) => ({ branchId: row.branch_id, stock: String(row.stock) })));
      setBranchWiseStockTotal(rows.reduce((sum, row) => sum + Number(row.stock || 0), 0));
    })
    .catch(() => {
      setBranchStockRows([]);
      setBranchWiseStockTotal(0);
    });
}, [editing, modalOpen]);

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

  const fields: FormFieldConfig[] = [
    { name: 'code', label: 'Item Code', type: 'text', required: true },
    { name: 'name', label: 'Item Name', type: 'text', required: true },
    { name: 'category', label: 'Category', type: 'text', required: true },
    { name: 'uom', label: 'UOM', type: 'text', required: true },
    { name: 'branchWiseStock', label: 'Opening Stock', type: 'number', required: true },
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
  setBranchStockRows([]);
  setBranchWiseStockTotal(0);

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
  setBranchStockRows([]);
  setBranchWiseStockTotal(Number(row.branch_wise_stock) || 0);
  setEditing(row);
  setModalOpen(true);
};

  const handleSave = async (
  values: ItemFormValues,
  resetAfter: boolean
) => {
  try {
    const stockTotal = branchStockRows.reduce((sum, row) => sum + (Number(row.stock) || 0), 0);
    const declaredStock = Number(values.branchWiseStock) || 0;
    if (Math.abs(stockTotal - declaredStock) > 0.000001) {
      toast.error("Opening stock must equal the total branch stock.");
      return;
    }

    let savedItem: ItemResponse;
    if (editing?.id) {
      savedItem = await updateItem(editing.id, {
        code: values.code,
        name: values.name,
        category: values.category,
        uom: values.uom,
        status: values.status as "Active" | "Inactive",
          branchWiseStock: declaredStock,
      });

    } else {
      savedItem = await createItem({
        code: values.code,
        name: values.name,
        category: values.category,
        uom: values.uom,
        status: values.status as "Active" | "Inactive",
          branchWiseStock: declaredStock,
      });

    }

    await saveItemBranchStock(
      savedItem.id,
      branchStockRows
        .filter((row) => row.branchId)
        .map((row) => ({ branch_id: row.branchId, stock: Number(row.stock) || 0 }))
    );

    toast.success(editing?.id ? "Item updated successfully" : "Item created successfully");

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
      setBranchStockRows([]);
      setBranchWiseStockTotal(0);
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
        title={editing?.id ? 'Edit Item' : 'New Item'}
        fields={fields}
        defaultValues={
          editing
            ? {
                code: editing.code,
                name: editing.name,
                category: editing.category,
                uom: editing.uom,
                status: editing.status,
                branchWiseStock: branchWiseStockTotal,
              }
                  : { code: '', name: '', category: '', uom: '', status: 'Active', branchWiseStock: 0 }
        }
                customSection={
                  <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700">Stock <span className="text-rose-500">*</span></label>
                        <p className="mt-1 text-[10px] text-slate-500">Enter stock for each branch. The row total must match this value.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBranchStockRows((rows) => [...rows, { branchId: '', stock: '' }])}
                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100"
                      >
                        Add Branch
                      </button>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-[11px]">
                        <thead className="bg-slate-100 text-slate-600">
                          <tr>
                            <th className="px-3 py-2">Branch</th>
                            <th className="px-3 py-2">Stock</th>
                            <th className="px-3 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {branchStockRows.map((row, index) => (
                            <tr key={`${row.branchId}-${index}`} className="border-t border-slate-100">
                              <td className="px-3 py-2">
                                <select
                                  value={row.branchId}
                                  onChange={(event) => setBranchStockRows((rows) => rows.map((current, rowIndex) => rowIndex === index ? { ...current, branchId: event.target.value } : current))}
                                  className="w-full rounded-full border border-slate-200 px-2 py-1 text-[11px]"
                                >
                                  <option value="">Select branch</option>
                                  {branches.filter((branch) => branch.status?.toUpperCase() !== 'INACTIVE').map((branch) => (
                                    <option key={branch.id} value={branch.id}>{branch.branch_name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-3 py-2">
                                <input
                                  type="number"
                                  min="0"
                                  value={row.stock}
                                  onChange={(event) => setBranchStockRows((rows) => rows.map((current, rowIndex) => rowIndex === index ? { ...current, stock: event.target.value } : current))}
                                  className="w-full rounded-full border border-slate-200 px-2 py-1 text-[11px]"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button type="button" disabled={!!editing?.id} onClick={() => setBranchStockRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] text-rose-700 disabled:cursor-not-allowed disabled:opacity-50">Remove</button>
                              </td>
                            </tr>
                          ))}
                          {!branchStockRows.length && <tr><td colSpan={3} className="px-3 py-3 text-center text-slate-400">No branch stock rows</td></tr>}
                        </tbody>
                        <tfoot className="border-t border-slate-200 bg-slate-50">
                          <tr>
                            <td className="px-3 py-2 font-semibold text-slate-700">Total branch stock</td>
                            <td className="px-3 py-2 font-semibold text-slate-700">{branchStockRows.reduce((sum, row) => sum + (Number(row.stock) || 0), 0)}</td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
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