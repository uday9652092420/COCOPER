/**
 * @file BagPurchasePage.tsx
 * @description Master screen to manage Bag Purchases.
 */

import React, {
  useCallback,
  useEffect,
  useState,
} from "react";

import { toast } from "sonner";

import { PageHeader } from "../../components/common/PageHeader";
import Toolbar from "../../components/common/Toolbar";

import DataGrid, {
  type ColumnDef,
} from "../../components/common/DataGrid";

import { ConfirmDialog } from "../../components/common/ConfirmDialog";

import BagPurchaseModal from "./components/BagPurchaseModal";

import {
  getBagPurchases,
  deleteBagPurchase,
  type BagPurchaseResponse,
} from "../../services/bagpurchaseservices/bagpurchase.service";
const BagPurchasePage: React.FC = () => {
  const [purchases, setPurchases] = useState<
    BagPurchaseResponse[]
  >([]);

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingPurchase, setEditingPurchase] =
    useState<BagPurchaseResponse | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<BagPurchaseResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  /**
   * Load purchases from backend.
   */
  const loadPurchases = useCallback(
    async () => {
      try {
        setLoading(true);

        const data = await getBagPurchases();

        setPurchases(data);
      } catch (error: unknown) {
        console.error(
          "Load Bag Purchases error:",
          error
        );

        const message =
          error instanceof Error
            ? error.message
            : "Failed to load Bag Purchases";

        toast.error(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /**
   * Initial load.
   */
  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  /**
   * Open Add.
   */
  const handleAdd = () => {
    setEditingPurchase(null);
    setModalOpen(true);
  };

  /**
   * Open Edit.
   */
  const handleEdit = (
    purchase: BagPurchaseResponse
  ) => {
    setEditingPurchase(purchase);
    setModalOpen(true);
  };

  /**
   * Called after modal successfully saves.
   */
  const handleSave = async (
    resetAfter: boolean
  ) => {
    await loadPurchases();

    toast.success(
      editingPurchase
        ? "Bag purchase updated."
        : "Bag purchase saved."
    );

    if (!resetAfter) {
      setModalOpen(false);
      setEditingPurchase(null);
    }
  };

  /**
   * Delete purchase.
   */
  const handleDelete = async () => {
    if (!confirmDelete) {
      return;
    }

    try {
      await deleteBagPurchase(
        confirmDelete.id
      );

      toast.success(
        "Purchase deleted."
      );

      setConfirmDelete(null);

      await loadPurchases();
    } catch (error: unknown) {
      console.error(
        "Delete Bag Purchase error:",
        error
      );

      const message =
        error instanceof Error
          ? error.message
          : "Failed to delete purchase";

      toast.error(message);
    }
  };

  /**
   * DataGrid columns.
   *
   * IMPORTANT:
   * ColumnDef is generic, so it must receive
   * BagPurchaseResponse as its type argument.
   */
  const columns: ColumnDef<BagPurchaseResponse>[] = [
    {
      key: "purchase_no",
      label: "Purchase No",
      render: (
        r: BagPurchaseResponse
      ) => r.purchase_no,
    },

    {
  key: "purchase_date",
  label: "Date",
  render: (
    r: BagPurchaseResponse
  ) =>
    r.purchase_date
      ? new Date(r.purchase_date).toLocaleDateString("en-IN")
      : "",
},

    {
      key: "supplier",
      label: "Supplier",
      render: (
        r: BagPurchaseResponse
      ) =>
        r.supplier_name ??
        r.supplier_code ??
        r.supplier_id,
    },

    {
      key: "remarks",
      label: "Remarks",
      render: (
        r: BagPurchaseResponse
      ) =>
        r.remarks
          ? String(r.remarks).slice(
              0,
              80
            )
          : "",
    },

    {
      key: "lines",
      label: "Lines",
      render: (
        r: BagPurchaseResponse
      ) =>
        String(
          r.lines?.length ?? 0
        ),
    },

    {
      key: "total_amount",
      label: "Total Amount",
      render: (
        r: BagPurchaseResponse
      ) =>
        `₹ ${Number(
          r.total_amount ?? 0
        ).toLocaleString("en-IN", {
          maximumFractionDigits: 2,
        })}`,
    },

    {
      key: "actions",
      label: "Actions",
      render: (
        r: BagPurchaseResponse
      ) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              handleEdit(r)
            }
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() =>
              setConfirmDelete(r)
            }
            className="rounded-full bg-rose-600 px-2 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Bag Purchase"
        breadcrumb={[
          "Masters",
          "Bag Purchase",
        ]}
      />

      <Toolbar
        title="Bag Purchase"
        onAdd={handleAdd}
      />

      <DataGrid<BagPurchaseResponse>
        data={purchases}
        columns={columns}
        rowKey={(
          r: BagPurchaseResponse
        ) => r.id}
        loading={loading}
      />

      <BagPurchaseModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPurchase(null);
        }}
        onSave={handleSave}
        purchase={editingPurchase}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete purchase?"
        description={
          confirmDelete
            ? `Delete purchase ${confirmDelete.purchase_no}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() =>
          setConfirmDelete(null)
        }
      />
    </div>
  );
};

export default BagPurchasePage;