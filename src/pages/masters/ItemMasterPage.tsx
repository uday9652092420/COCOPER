/**
 * @file ItemMasterPage.tsx
 * @description Item master maintenance screen.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { items as dbItems, type Item } from '../../mock/db'
import { PageHeader } from '../../components/common/PageHeader'
import { Toolbar } from '../../components/common/Toolbar'
import { SearchFilterPanel } from '../../components/common/SearchFilterPanel'
import DataGrid from '../../components/common/DataGrid'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import { formatDate } from '../../utils/format'
import { Edit2, Trash2 } from 'lucide-react'

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
  const [records, setRecords] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null)

  useEffect(() => {
    const id = setTimeout(() => {
      setRecords(dbItems)
      setLoading(false)
    }, 400)
    return () => clearTimeout(id)
  }, [])

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
      render: (row: Item) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] ${row.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created Date',
      render: (row: Item) => formatDate(row.createdAt),
    },
    {
      key: 'actions',
      label: '',
      width: '110px',
      render: (row: Item) => (
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

  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (row: Item) => {
    setEditing(row)
    setModalOpen(true)
  }

  const handleSave = (values: ItemFormValues, resetAfter: boolean) => {
    if (editing) {
      setRecords((prev) => prev.map((it) => (it.id === editing.id ? { ...it, ...values } : it)))
      toast.success('Item updated.')
    } else {
      const newRecord: Item = {
        id: `IT-${Date.now()}`,
        code: values.code,
        name: values.name,
        category: values.category,
        uom: values.uom,
        status: values.status as Item['status'],
        createdAt: new Date().toISOString().slice(0, 10),
      }
      setRecords((prev) => [newRecord, ...prev])
      toast.success('Item added.')
    }
    if (!resetAfter) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    setRecords((prev) => prev.filter((it) => it.id !== confirmDelete.id))
    toast.success('Item deleted.')
    setConfirmDelete(null)
  }

  return (
    <div>
      <PageHeader title="Item Master" breadcrumb={['Masters', 'Item Master']} />
      <Toolbar title="Item Master" onAdd={openAdd} />
      <SearchFilterPanel onSearch={setSearch} onClear={() => setSearch('')} />
      <DataGrid columns={columns} data={filtered} rowKey={(r: Item) => r.id} />
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

export default ItemMasterPage