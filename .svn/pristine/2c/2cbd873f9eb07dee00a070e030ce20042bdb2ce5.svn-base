/**
 * @file GunnyBagMasterPage.tsx
 * @description Gunny Bag Master CRUD Page
 */

import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/common/PageHeader";
import Toolbar from "../../components/common/Toolbar";
import DataGrid, { type Column } from "../../components/common/DataGrid";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import MasterFormModal, {
  type FormFieldConfig,
} from "./components/MasterFormModal";

import {
  getGunnyBags,
  getNextGunnyBagCode,
  createGunnyBag,
  updateGunnyBag,
  deleteGunnyBag,
  type GunnyBagResponse,
} from "../../services/gunnybagservices/gunnybag.service";

/**
 * Form Values
 */
interface GunnyBagFormValues {
  code: string;
  name: string;
  size: string;
  rate_per_bag: number | string;
  opening_stock: number | string;
  status: "Active" | "Inactive";
}

const GunnyBagMasterPage: React.FC = () => {
  const [items, setItems] = useState<GunnyBagResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] =
    useState<GunnyBagResponse | null>(null);

  const [selectedToDelete, setSelectedToDelete] =
    useState<GunnyBagResponse | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);

  /**
   * Load Gunny Bags
   */
  const loadGunnyBags = async () => {
    try {
      setLoading(true);

      const data = await getGunnyBags();

      setItems(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load Gunny Bags");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGunnyBags();
  }, []);

  /**
   * Form Fields
   */
  const fields: FormFieldConfig[] = [
    {
      name: "code",
      label: "Code",
      type: "text",
      required: true,
    },
    {
      name: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      name: "size",
      label: "Size",
      type: "text",
      required: true,
    },
    {
      name: "opening_stock",
      label: "Opening Stock",
      type: "number",
    },
    {
      name: "rate_per_bag",
      label: "Rate / Bag",
      type: "number",
      required: true,
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      required: true,
      options: [
        {
          label: "Active",
          value: "Active",
        },
        {
          label: "Inactive",
          value: "Inactive",
        },
      ],
    },
  ];

  /**
   * Add
   */
  const openAdd = async () => {
    try {
      const code = await getNextGunnyBagCode();

      setEditing({
        id: "",
        code,
        name: "",
        size: "",
        rate_per_bag: 0,
        opening_stock: 0,
        status: "Active",
        created_at: "",
      });

      setModalOpen(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  /**
   * Edit
   */
  const openEdit = (row: GunnyBagResponse) => {
    setEditing(row);
    setModalOpen(true);
  };

  /**
   * Save
   */
  const handleSave = async (
    values: GunnyBagFormValues,
    resetAfter: boolean
  ) => {
    try {
      if (editing?.id) {
        await updateGunnyBag(editing.id, {
          code: values.code,
          name: values.name,
          size: values.size,
          rate_per_bag: Number(values.rate_per_bag),
          opening_stock: Number(values.opening_stock),
          status: values.status,
        });

        toast.success("Gunny Bag updated successfully");
      } else {
        await createGunnyBag({
          code: values.code,
          name: values.name,
          size: values.size,
          rate_per_bag: Number(values.rate_per_bag),
          opening_stock: Number(values.opening_stock),
          status: values.status,
        });

        toast.success("Gunny Bag created successfully");
      }

      await loadGunnyBags();

      if (!resetAfter) {
        setModalOpen(false);
        setEditing(null);
      } else {
        const code = await getNextGunnyBagCode();

        setEditing({
          id: "",
          code,
          name: "",
          size: "",
          rate_per_bag: 0,
          opening_stock: 0,
          status: "Active",
          created_at: "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };
    /**
   * Delete
   */
  const handleDelete = (row: GunnyBagResponse) => {
    setSelectedToDelete(row);
    setConfirmOpen(true);
  };

  /**
   * Confirm Delete
   */
  const confirmDelete = async () => {
    if (!selectedToDelete) return;

    try {
      await deleteGunnyBag(selectedToDelete.id);

      toast.success("Gunny Bag deleted successfully");

      await loadGunnyBags();

      setSelectedToDelete(null);
      setConfirmOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Delete failed");
    }
  };

  /**
   * Grid Columns
   */
  const columns: Column<GunnyBagResponse>[] = [
    {
      key: "code",
      label: "Code",
      width: "12%",
    },
    {
      key: "name",
      label: "Name",
      width: "22%",
    },
    {
      key: "size",
      label: "Size",
      width: "18%",
    },
    {
      key: "opening_stock",
      label: "Opening Stock",
      width: "12%",
      render: (r) => String(r.opening_stock),
    },
    {
      key: "rate_per_bag",
      label: "Rate / Bag",
      width: "12%",
      render: (r) => `₹ ${r.rate_per_bag}`,
    },
    {
      key: "status",
      label: "Status",
      width: "10%",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.status === "Active"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      width: "14%",
      render: (row) => (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs hover:bg-slate-100"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleDelete(row)}
            className="rounded-full bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gunny Bag Master"
        breadcrumb={["Masters", "Gunny Bag Master"]}
      />

      <Toolbar
        title="Gunny Bags"
        onAdd={openAdd}
      />

      <DataGrid
        loading={loading}
        columns={columns}
        data={items}
        rowKey={(r) => r.id}
      />

      <MasterFormModal<GunnyBagFormValues>
        open={modalOpen}
        title={editing?.id ? "Edit Gunny Bag" : "Add Gunny Bag"}
        fields={fields}
        defaultValues={{
          code: editing?.code ?? "",
          name: editing?.name ?? "",
          size: editing?.size ?? "",
          opening_stock: editing?.opening_stock ?? 0,
          rate_per_bag: editing?.rate_per_bag ?? 0,
          status: editing?.status ?? "Active",
        }}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Gunny Bag"
        description={
          selectedToDelete
            ? `Are you sure you want to delete "${selectedToDelete.name}"?`
            : ""
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setConfirmOpen(false);
          setSelectedToDelete(null);
        }}
      />
    </div>
  );
};

export default GunnyBagMasterPage;