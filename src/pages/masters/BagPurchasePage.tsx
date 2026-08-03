/**
 * @file BagPurchasePage.tsx
 * @description Master screen to manage Bag Purchases. Allows creating purchases via a modal
 *              (multiple lines) and viewing the list in a grid with row actions.
 */

import React, { useState } from 'react'
import { PageHeader } from '../../components/common/PageHeader'
import Toolbar from '../../components/common/Toolbar'
import DataGrid, { type ColumnDef } from '../../components/common/DataGrid'
import { ConfirmDialog } from '../../components/common/ConfirmDialog'
import BagPurchaseModal, { type BagPurchase } from './components/BagPurchaseModal'
import { toast } from 'sonner'

/**
 * @component BagPurchasePage
 * @description Page that lists bag purchases and provides Add New flow using BagPurchaseModal.
 */
const BagPurchasePage: React.FC = () => {
  const [purchases, setPurchases] = useState<BagPurchase[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<BagPurchase | null>(null)

  /**
   * @function handleSave
   * @description Save a new bag purchase to local state.
   */
  const handleSave = (purchase: BagPurchase, resetAfter: boolean) => {
    setPurchases((prev) => [purchase, ...prev])
    toast.success('Bag purchase saved.')
    if (!resetAfter) {
      setModalOpen(false)
    }
  }

  /**
   * @function handleDelete
   * @description Delete a purchase after confirmation.
   */
  const handleDelete = () => {
    if (!confirmDelete) return
    setPurchases((prev) => prev.filter((p) => p.id !== confirmDelete.id))
    toast.success('Purchase deleted.')
    setConfirmDelete(null)
  }

  const columns: ColumnDef<BagPurchase>[] = [
    { key: 'date', label: 'Date', render: (r) => r.date },
    { key: 'supplier', label: 'Supplier', render: (r) => r.supplierName ?? r.supplierId },
    { key: 'remarks', label: 'Remarks', render: (r) => (r.remarks ? String(r.remarks).slice(0, 80) : '') },
    { key: 'lines', label: 'Lines', render: (r) => String((r.lines || []).length) },
    { key: 'totalAmount', label: 'Total Amount', render: (r) => `₹ ${Number(r.totalAmount || 0).toLocaleString('en-IN')}` },
    {
      key: 'actions',
      label: 'Actions',
      render: (r: BagPurchase) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => toast.info(`Viewing ${r.id} (mock).`)}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(r)}
            className="rounded-full bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Bag Purchase" breadcrumb={['Masters', 'Bag Purchase']} />
      <Toolbar title="Bag Purchase" onAdd={() => setModalOpen(true)} />
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={() => setModalOpen(true)} className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
          New Purchase
        </button>
      </div>

      <DataGrid<BagPurchase> data={purchases} columns={columns} rowKey={(r) => r.id} />

      <BagPurchaseModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete purchase?"
        description={confirmDelete ? `Delete purchase ${confirmDelete.id}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}

export default BagPurchasePage