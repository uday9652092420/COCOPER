# Labour Attendance API (Mock)

This folder provides a lightweight mock API for labour attendance intended for frontend development.

Files:
- types.ts: TypeScript interfaces for attendance records and payloads.
- dataStore.ts: localStorage-backed async datastore with list/get/create/update/delete functions.
- handlers.ts: thin wrappers around dataStore functions, performing basic validation.

Usage:
Import handlers from `src/api/labourAttendance/handlers.ts` and use `list()`, `getById(id)`, `add(payload)`, `edit(id, payload)`, `remove(id)` in your pages or services.

Notes:
- Persistence uses localStorage key `wc_labour_attendance_v1`.
- create/add enforces a unique (labourId + attendanceDate) constraint to avoid duplicate daily records for a labour.
- This mock is intentionally simple and can be replaced by a real backend later.