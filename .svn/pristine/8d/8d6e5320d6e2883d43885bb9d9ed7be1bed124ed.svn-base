# Labour API (Mock)

This folder implements a lightweight in-browser mock API for the Labour master.

Files:
- types.ts: TypeScript interfaces for Labour records and payloads.
- dataStore.ts: localStorage-backed async datastore with seeded sample data and functions:
  - listLabours()
  - getLabour(id)
  - createLabour(payload)
  - updateLabour(id, payload)
  - deleteLabour(id)
- handlers.ts: simple wrappers exported as list/getById/add/edit/remove for frontend usage.

Usage example:
import * as LabourAPI from 'src/api/labour/handlers'
const rows = await LabourAPI.list()
const created = await LabourAPI.add({ labourName: 'New', gender: 'Male' })

Notes:
- This is a mock implementation intended for the frontend. Replace with a real backend when available.
