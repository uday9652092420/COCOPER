/**
 * @file LabourMasterPage.tsx
 * @description Labour Staff Master Screen
 */

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "../../components/common/PageHeader";
import { Toolbar } from "../../components/common/Toolbar";
import { SearchFilterPanel } from "../../components/common/SearchFilterPanel";
import DataGrid, { type ColumnDef } from "../../components/common/DataGrid";
import MasterFormModal, {
  type FormFieldConfig,
} from "./components/MasterFormModal";
import { ConfirmDialog } from "../../components/common/ConfirmDialog";
import { formatDate } from "../../utils/format";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuthStore } from "../../store/authStore";
import { onScopeChange } from "../../utils/scopeEvents";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatLabourTime(value?: string): string {
  if (!value) return "";
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value.trim());
  if (!match) return value;

  const hour = Number(match[1]);
  const minute = match[2];
  if (hour > 23) return value;

  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${suffix}`;
}

import {
  getLabours,
  createLabour,
  updateLabour,
  deleteLabour,
  type LabourResponse,
} from "../../services/labourstaffservices/labour.service";

/**
 * Form Values
 */
interface LabourFormValues {
  labourName: string;
  gender: "Male" | "Female";
  contactNumber: string;
  address: string;
  inTime: string;
  outTime: string;

  overtime_5_8: number;
  overtime_6_8: number;
  overtime_7_8: number;
  overtime_7p_9p: number;
  overtime_7p_10p: number;

  loading10TonsAmount: number;
  loading20TonsAmount: number;

  status: "Active" | "Inactive";
}

const LabourMasterPage: React.FC = () => {
  const { can } = usePermissions();
  const { selectedOrganizationId } = useAuthStore();
  const [records, setRecords] = useState<LabourResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);

  const [editing, setEditing] = useState<LabourResponse | null>(null);

  const [confirmDelete, setConfirmDelete] =
    useState<LabourResponse | null>(null);

  /**
   * Load Data
   */
  useEffect(() => {
    void loadLabours();
    return onScopeChange(() => { void loadLabours(); });
  }, [selectedOrganizationId]);

  /**
   * Load Labour List
   */
  const loadLabours = async () => {
    try {
      setLoading(true);

      const response = await getLabours();

      setRecords(selectedOrganizationId
        ? response.filter((row) => row.organization_id === selectedOrganizationId)
        : response);
    } catch (error: any) {
      toast.error(error.message ?? "Failed to load labour staff");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Search & Filter
   */
  const filtered = useMemo(() => {
    return records.filter((row) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        keyword === "" ||
        row.labour_name.toLowerCase().includes(keyword) ||
        row.contact_number?.toLowerCase().includes(keyword) ||
        row.address?.toLowerCase().includes(keyword);

      const matchesStatus =
        statusFilter === "" || row.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  /**
   * Grid Columns
   */
  const columns: ColumnDef<LabourResponse>[] = [
    {
      key: "labour_name",
      label: "Labour Name",
    },

    {
      key: "gender",
      label: "Gender",
    },

    {
      key: "contact_number",
      label: "Contact",
    },

    {
      key: "address",
      label: "Address",
    },

    {
      key: "status",
      label: "Status",
      render: (row: LabourResponse) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${
            row.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {row.status}
        </span>
      ),
    },

  ];
    /**
   * Form Fields
   */
  const fields: FormFieldConfig[] = [
    {
      name: "labourName",
      label: "Labour Name",
      type: "text",
      required: true,
    },

    {
      name: "gender",
      label: "Gender",
      type: "select",
      required: true,
      options: [
        { label: "Male", value: "Male" },
        { label: "Female", value: "Female" },
      ],
    },

    {
      name: "contactNumber",
      label: "Contact Number",
      type: "text",
      required: true,
    },

    {
      name: "address",
      label: "Address",
      type: "textarea",
      required: true,
    },

    {
      name: "inTime",
      label: "In Time",
      type: "time",
      required: true,
    },

    {
      name: "outTime",
      label: "Out Time",
      type: "time",
      required: true,
    },

    {
      name: "overtime_5_8",
      label: "5AM - 8AM",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "overtime_6_8",
      label: "6AM - 8AM",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "overtime_7_8",
      label: "7AM - 8AM",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "overtime_7p_9p",
      label: "7PM - 9PM",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "overtime_7p_10p",
      label: "7PM - 10PM",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "loading10TonsAmount",
      label: "Loading 10 Tons Amount",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "loading20TonsAmount",
      label: "Loading 20 Tons Amount",
      type: "number",
      section: "Overtime Loading Charges Amount",
    },

    {
      name: "status",
      label: "Status",
      type: "select",
      section: "__status",
      required: true,
      options: [
        { label: "Active", value: "Active" },
        { label: "Inactive", value: "Inactive" },
      ],
    },

  ];

  /**
   * Open New
   */
  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  /**
   * Open Edit
   */
  const openEdit = (row: LabourResponse) => {
    setEditing(row);
    setModalOpen(true);
  };

  /**
   * Create / Update Labour
   */
  const handleSave = async (
    values: LabourFormValues,
    resetAfter: boolean
  ) => {
    try {
      const payload = {
        labour_name: values.labourName,
        gender: values.gender,

        contact_number: values.contactNumber,
        address: values.address,

        in_time: values.inTime,
        out_time: values.outTime,

        overtime_5_8: Number(values.overtime_5_8),
        overtime_6_8: Number(values.overtime_6_8),
        overtime_7_8: Number(values.overtime_7_8),
        overtime_7p_9p: Number(values.overtime_7p_9p),
        overtime_7p_10p: Number(values.overtime_7p_10p),

        loading_10_tons_amount: Number(values.loading10TonsAmount),
        loading_20_tons_amount: Number(values.loading20TonsAmount),

        status: values.status,
      };

      if (editing) {
        await updateLabour(editing.id, payload);

        toast.success("Labour updated successfully.");
      } else {
        await createLabour(payload);

        toast.success("Labour created successfully.");
      }

      await loadLabours();

      if (resetAfter) {
        setEditing(null);
        setModalOpen(true);
        toast.success("Ready for a new labour.");

        return;
      }

      setModalOpen(false);
      setEditing(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save labour.");
    }
  };
    /**
   * Delete Labour
   */
  const handleDelete = async () => {
    if (!confirmDelete) return;

    try {
      await deleteLabour(confirmDelete.id);

      toast.success("Labour deleted successfully.");

      setConfirmDelete(null);

      await loadLabours();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete labour.");
    }
  };

  const getLabourListRows = () => filtered.map((row) => ({
    name: row.labour_name,
    gender: row.gender,
    contact: row.contact_number ?? "-",
    address: row.address ?? "-",
    status: row.status,
  }));

  const exportLabourToExcel = () => {
    const rows = getLabourListRows();
    const tableRows = rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.gender)}</td><td>${escapeHtml(row.contact)}</td><td>${escapeHtml(row.address)}</td><td>${escapeHtml(row.status)}</td></tr>`).join("");
    const workbook = `<html><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr><th>Labour Name</th><th>Gender</th><th>Contact Number</th><th>Address</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`;
    const url = URL.createObjectURL(new Blob([workbook], { type: "application/vnd.ms-excel" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "labour-staff.xls";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Labour staff exported to Excel.");
  };

  const printLabourList = (asPdf = false) => {
    const rows = getLabourListRows();
    if (!rows.length) {
      toast.info("No labour staff to print.");
      return;
    }
    const win = window.open("", "_blank", "width=1100,height=750");
    if (!win) {
      toast.error("Popup blocked. Please allow popups and try again.");
      return;
    }
    const tableRows = rows.map((row) => `<tr><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.gender)}</td><td>${escapeHtml(row.contact)}</td><td>${escapeHtml(row.address)}</td><td>${escapeHtml(row.status)}</td></tr>`).join("");
    win.document.write(`<!DOCTYPE html><html><head><title>${asPdf ? "Labour Staff PDF" : "Labour Staff"}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#172033}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#e2e8f0}</style></head><body><h1>Labour Staff</h1><p>Generated on ${escapeHtml(formatDate(new Date().toISOString()))}</p><table><thead><tr><th>Labour Name</th><th>Gender</th><th>Contact Number</th><th>Address</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
    toast.success(asPdf ? "Labour staff PDF is ready to save." : "Labour staff sent to print.");
  };

  return (
    <>
      <PageHeader
        title="Labour Staff"
        breadcrumb={["Masters", "Labour Staff"]}
      />

      <Toolbar
        onAddNew={can("labour", "create") ? openAdd : undefined}
        onRefresh={() => { void loadLabours(); toast.success("Labour staff list refreshed."); }}
        onExportExcel={exportLabourToExcel}
        onExportPdf={() => printLabourList(true)}
        onPrint={() => printLabourList(false)}
      />

      <div className="mt-4">

        <SearchFilterPanel
          onSearch={setSearch}
          onClear={() => {
            setSearch("");
            setStatusFilter("");
          }}
        />

        <DataGrid<LabourResponse>
          data={filtered}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.id}
          onEdit={(row) => openEdit(row)}
          onDelete={(row) => setConfirmDelete(row)}
        />

        <MasterFormModal<LabourFormValues>
          open={modalOpen}
          title={editing ? "Edit Labour" : "New Labour"}
          fields={fields}
          defaultValues={
            editing
              ? {
                  labourName: editing.labour_name,
                  gender: editing.gender,

                  contactNumber: editing.contact_number ?? "",
                  address: editing.address ?? "",

                  inTime: editing.in_time ?? "",
                  outTime: editing.out_time ?? "",

                  overtime_5_8: editing.overtime_5_8,
                  overtime_6_8: editing.overtime_6_8,
                  overtime_7_8: editing.overtime_7_8,
                  overtime_7p_9p: editing.overtime_7p_9p,
                  overtime_7p_10p: editing.overtime_7p_10p,

                  loading10TonsAmount: editing.loading_10_tons_amount,
                  loading20TonsAmount: editing.loading_20_tons_amount,

                  status: editing.status,
                }
              : {
                  labourName: "",
                  gender: "Male",

                  contactNumber: "",
                  address: "",

                  inTime: "",
                  outTime: "",

                  overtime_5_8: 0,
                  overtime_6_8: 0,
                  overtime_7_8: 0,
                  overtime_7p_9p: 0,
                  overtime_7p_10p: 0,

                  loading10TonsAmount: 0,
                  loading20TonsAmount: 0,

                  status: "Active",
                }
          }
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />

        <ConfirmDialog
          open={!!confirmDelete}
          title="Delete Labour"
          description={
            confirmDelete
              ? `Are you sure you want to delete "${confirmDelete.labour_name}"?`
              : ""
          }
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />

      </div>
    </>
  );
};

export default LabourMasterPage;