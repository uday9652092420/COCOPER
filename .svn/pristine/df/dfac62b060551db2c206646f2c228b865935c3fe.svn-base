# Warehouse API (mock)

File layout:
- types.ts        -> TypeScript types for the warehouse model and payloads
- dataStore.ts    -> In-memory + localStorage backed data store (list/create/update/delete)
- handlers.ts     -> High-level async wrappers that pages/components can call

Integration:
- Use `import * as WarehouseAPI from 'src/api/warehouse/handlers'` and call:
  - WarehouseAPI.list()
  - WarehouseAPI.getById(id)
  - WarehouseAPI.add(payload)
  - WarehouseAPI.edit(id, payload)
  - WarehouseAPI.remove(id)

Notes:
- The mock datastore persists data in localStorage under key `wc_warehouses_v1`.
- These files are intended for local development and testing. Replace with real server endpoints when available.
