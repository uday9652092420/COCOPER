# Direct Sales API (Mock)

This folder provides a small in-browser mock API for Direct Sales.

Files:
- types.ts - TypeScript types used by the API.
- dataStore.ts - localStorage-backed async datastore that implements CRUD operations and simulates latency.
- handlers.ts - high-level wrapper functions (list, getById, add, edit, remove) intended for frontend use.

Notes:
- Data is persisted under localStorage key: `wc_direct_sales_v1`.
- create/update enforce unique invoice numbers and compute totalAmount from provided line items.
- This mock is designed to be replaced easily by a real backend later.