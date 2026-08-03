# Purchase Order Mock API

This folder provides a local, in-browser mock API for purchase orders.

Files:
- types.ts: TypeScript types for PurchaseOrder and payloads.
- dataStore.ts: localStorage-backed asynchronous datastore with functions:
  - listPurchaseOrders()
  - getPurchaseOrder(id)
  - createPurchaseOrder(payload)
  - updatePurchaseOrder(payload)
  - deletePurchaseOrder(id)
- handlers.ts: lightweight wrappers with basic validation suitable for use in pages.

Persistence:
- Data persisted under localStorage key "wc_purchase_orders_v1".
- Seed data added automatically when no persisted data is present.

Notes:
- create/update compute line amounts and totals.
- orderNo uniqueness is enforced by the datastore.
- This mock API is intended for development and UI wiring; replace with real backend endpoints when available.