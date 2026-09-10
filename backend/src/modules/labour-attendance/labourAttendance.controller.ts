import { Request, Response } from "express";
import {
  createLabourAttendanceRepository,
  deleteLabourAttendanceRepository,
  listLabourAttendanceRepository,
  updateLabourAttendanceRepository,
} from "./labourAttendance.repository.js";
import type { LabourAttendancePayload } from "./labourAttendance.types.js";

function requireOrganizationId(req: Pick<Request, "query" | "header">): string {
  const organizationId =
    (req.query.organizationId as string | undefined) || req.header("x-organization-id");
  if (!organizationId) throw { status: 400, message: "Organization ID is required" };
  return organizationId;
}

export async function listLabourAttendanceHandler(req: Request, res: Response) {
  try {
    res.json({ success: true, data: await listLabourAttendanceRepository(requireOrganizationId(req)) });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to fetch labour payments" });
  }
}

export async function createLabourAttendanceHandler(req: Request, res: Response) {
  try {
    const organizationId = requireOrganizationId(req);
    const rows = Array.isArray(req.body?.records) ? req.body.records : [req.body];
    const created = [];
    for (const row of rows as LabourAttendancePayload[]) {
      if (!row.labour_name || !row.attendance_date) {
        throw { status: 400, message: "Labour name and attendance date are required" };
      }
      created.push(await createLabourAttendanceRepository(row, organizationId));
    }
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to save labour payments" });
  }
}

export async function updateLabourAttendanceHandler(req: Request<{ id: string }>, res: Response) {
  try {
    const row = await updateLabourAttendanceRepository(req.params.id, req.body, requireOrganizationId(req));
    if (!row) {
      res.status(404).json({ success: false, message: "Labour payment not found" });
      return;
    }
    res.json({ success: true, data: row });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to update labour payment" });
  }
}

export async function deleteLabourAttendanceHandler(req: Request<{ id: string }>, res: Response) {
  try {
    const deleted = await deleteLabourAttendanceRepository(req.params.id, requireOrganizationId(req));
    if (!deleted) {
      res.status(404).json({ success: false, message: "Labour payment not found" });
      return;
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(error.status || 500).json({ success: false, message: error.message || "Failed to delete labour payment" });
  }
}
