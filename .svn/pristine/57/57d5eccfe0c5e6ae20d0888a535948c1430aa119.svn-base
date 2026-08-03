# Customer Receipt Mock API

This folder contains a lightweight in-browser mock API for customer receipts used by the frontend during development.

Files:
- types.ts - TypeScript interfaces and types for receipts.
- dataStore.ts - localStorage-backed asynchronous datastore (list/get/create/update/delete).
- handlers.ts - simple wrapper functions with basic validation.

Usage:
Import from `src/api/customerReceipt/handlers.ts`:
- list() -> Promise<CustomerReceipt[]>
- getById(id) -> Promise<CustomerReceipt | undefined>
- add(payload) -> Promise<CustomerReceipt>
- edit(id, payload) -> Promise<CustomerReceipt>
- remove(id) -> Promise<void>

Notes:
- Data is persisted to localStorage under key `wc_customer_receipts_v1`.
- The mock enforces uniqueness of `receiptNo` on create and non-negative amount validation.
