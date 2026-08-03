# Purchase Invoice Mock API

This folder contains a small in-browser mock API used by frontend pages to manage purchase invoices.

Files:
- types.ts — TypeScript interfaces for invoices and items.
- dataStore.ts — localStorage-backed async datastore exposing CRUD functions.
- handlers.ts — thin wrappers around dataStore with basic validation.

Notes:
- Data persists to localStorage under the key `wc_purchase_invoices_v1`.
- Create and update operations enforce unique invoice numbers and compute totals from line items.
- Designed for development/demo usage only.