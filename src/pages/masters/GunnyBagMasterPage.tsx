/**
 * @file GunnyBagMasterPage.tsx
 * @description Master page for managing gunny bag types with a modal form (Add / Edit) and delete confirmation.
 */

import React, { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import Toolbar from '../../components/common/Toolbar'
import DataGrid, { type Column } from '../../components/common/DataGrid'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import MasterFormModal, { type FormFieldConfig } from './components/MasterFormModal'

/**
 * @interface GunnyBag
 * @description Data shape for a gunny bag master record.
 */
interface GunnyBag {
  id: string
  name: string
  size: string
  ratePerBag: number
  openingStock: number
}

/**
 * @interface GunnyBagFormValues
 * @description Form values used in the gunny bag modal.
 */
interface GunnyBagFormValues {
  name: string
  size: string
  ratePerBag: number | string
  openingStock: number | string
}

/**
 * @component GunnyBagMasterPage
 * @description CRUD-lite master page for gunny bags using local state and a modal form.
 */
const GunnyBagMasterPage: React.FC = () => {
  const [items, setItems] = useState<GunnyBag[]>([
    { id: 'g1', name: 'Jute Bag', size: '25x40 cm', ratePerBag: 45, openingStock: 100 },
    { id: 'g2', name: 'Jamindar', size: '30x50 cm', ratePerBag: 60, openingStock: 50 },
    { id: 'g2', name: 'COCOS', size: '30x50 cm', ratePerBag: 60, openingStock: 50 },
    { id: 'g2', name: 'Sai Ram', size: '30x50 cm', ratePerBag: 60, openingStock: 50 },
    { id: 'g2', name: 'Innner Bag', size: '30x50 cm', ratePerBag: 60, openingStock: 50 },
  ])

  const [selectedToDelete, setSelectedToDelete] = useState<GunnyBag | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<GunnyBag | null>(null)

  /**
   * @description Field configuration for gunny bag modal.
   */
  const fields: FormFieldConfig[] = [
    { name: 'name', label: 'Name', type: 'text', required: true },
    { name: 'size', label: 'Size', type: 'text', required: true },
    { name: 'openingStock', label: 'Opening Stock', type: 'number', required: false },
    { name: 'ratePerBag', label: 'Rate / Bag', type: 'number', required: true },
  ]

  /**
   * @function openAdd
   * @description Open modal to add a new gunny bag.
   */
  const openAdd = () => {
    setEditing(null)
    setModalOpen(true)
  }

  /**
   * @function openEdit
   * @description Open modal to edit an existing gunny bag.
   */
  const openEdit = (row: GunnyBag) => {
    setEditing(row)
    setModalOpen(true)
  }

  /**
   * @function handleSave
   * @description Handle save from modal for both add and edit.
   * @param values - form values from modal
   * @param resetAfter - whether to reset form for continuous entry
   */
  const handleSave = (values: GunnyBagFormValues, resetAfter: boolean) => {
    const name = values.name?.toString().trim()
    const size = values.size?.toString().trim()
    const rate = Number(values.ratePerBag ?? 0)
    const opening = Number(values.openingStock ?? 0)

    if (!name || !size) return

    if (editing) {
      // Update existing item
      setItems((prev) =>
        prev.map((it) =>
          it.id === editing.id ? { ...it, name, size, ratePerBag: rate, openingStock: opening } : it,
        ),
      )
    } else {
      // Add new item
      const newItem: GunnyBag = {
        id: `g${Date.now()}`,
        name,
        size,
        ratePerBag: rate,
        openingStock: opening,
      }
      setItems((prev) => [newItem, ...prev])
    }

    if (!resetAfter) {
      setModalOpen(false)
      setEditing(null)
    }
  }

  /**
   * @function handleDelete
   * @description Initiate delete flow by opening confirmation dialog.
   */
  const handleDelete = (row: GunnyBag) => {
    setSelectedToDelete(row)
    setConfirmOpen(true)
  }

  /**
   * @function confirmDelete
   * @description Perform deletion after confirmation.
   */
  const confirmDelete = () => {
    if (!selectedToDelete) return
    setItems((s) => s.filter((r) => r.id !== selectedToDelete.id))
    setSelectedToDelete(null)
    setConfirmOpen(false)
  }

  const columns: Column<GunnyBag>[] = [
    { key: 'name', label: 'Name', width: '30%' },
    { key: 'size', label: 'Size', width: '20%', render: (r) => r.size },
    { key: 'openingStock', label: 'Opening Stock', width: '15%', render: (r) => String(r.openingStock) },
    { key: 'ratePerBag', label: 'Rate/Bag', width: '15%', render: (r) => `₹ ${r.ratePerBag}` },
    {
      key: 'actions',
      label: 'Actions',
      width: '20%',
      render: (r) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(r)}
            className="rounded-full bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <PageHeader title="Gunny Bag Master" breadcrumb={['Home', 'Masters', 'Gunny Bag']} />

      <Toolbar title="Gunny Bags" onAdd={openAdd} />

      <DataGrid columns={columns} data={items} rowKey={(r) => r.id} />

      <MasterFormModal<GunnyBagFormValues>
        open={modalOpen}
        title={editing ? 'Edit Gunny Bag' : 'Add Gunny Bag'}
        fields={fields}
        defaultValues={
          editing
            ? {
                name: editing.name,
                size: editing.size,
                ratePerBag: editing.ratePerBag,
                openingStock: editing.openingStock,
              }
            : {
                name: '',
                size: '25x40 cm',
                ratePerBag: 50,
                openingStock: 0,
              }
        }
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Gunny Bag"
        description={`Delete "${selectedToDelete?.name}"? This action cannot be undone.`}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  )
}

export default GunnyBagMasterPage