import express from "express";
import {
  createLabourAttendanceHandler,
  deleteLabourAttendanceHandler,
  listLabourAttendanceHandler,
  updateLabourAttendanceGroupStatusHandler,
  deleteLabourAttendanceGroupHandler,
  updateLabourAttendanceHandler,
} from "./labourAttendance.controller.js";

const router = express.Router();
router.get("/", listLabourAttendanceHandler);
router.post("/", createLabourAttendanceHandler);
router.patch("/group/:groupId/status", updateLabourAttendanceGroupStatusHandler);
router.delete("/group/:groupId", deleteLabourAttendanceGroupHandler);
router.put("/:id", updateLabourAttendanceHandler);
router.delete("/:id", deleteLabourAttendanceHandler);

export default router;
