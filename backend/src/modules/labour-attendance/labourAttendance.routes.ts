import express from "express";
import { requireModulePermission } from "../../middleware/modulePermission.js";
import {
  createLabourAttendanceHandler,
  deleteLabourAttendanceHandler,
  listLabourAttendanceHandler,
  updateLabourAttendanceGroupStatusHandler,
  deleteLabourAttendanceGroupHandler,
  updateLabourAttendanceHandler,
  listLabourAttendanceDetailsHandler,
} from "./labourAttendance.controller.js";

const router = express.Router();
router.get("/", requireModulePermission("labour-attendance", "read"), listLabourAttendanceHandler);
router.get("/details", requireModulePermission("labour-attendance-report", "read"), listLabourAttendanceDetailsHandler);
router.post("/", requireModulePermission("labour-attendance", "create"), createLabourAttendanceHandler);
router.patch("/group/:groupId/status", requireModulePermission("labour-attendance", "approve"), updateLabourAttendanceGroupStatusHandler);
router.delete("/group/:groupId", requireModulePermission("labour-attendance", "delete"), deleteLabourAttendanceGroupHandler);
router.put("/:id", requireModulePermission("labour-attendance", "edit"), updateLabourAttendanceHandler);
router.delete("/:id", requireModulePermission("labour-attendance", "delete"), deleteLabourAttendanceHandler);

export default router;
