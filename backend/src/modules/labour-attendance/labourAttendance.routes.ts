import express from "express";
import {
  createLabourAttendanceHandler,
  deleteLabourAttendanceHandler,
  listLabourAttendanceHandler,
  updateLabourAttendanceHandler,
} from "./labourAttendance.controller.js";

const router = express.Router();
router.get("/", listLabourAttendanceHandler);
router.post("/", createLabourAttendanceHandler);
router.put("/:id", updateLabourAttendanceHandler);
router.delete("/:id", deleteLabourAttendanceHandler);

export default router;
