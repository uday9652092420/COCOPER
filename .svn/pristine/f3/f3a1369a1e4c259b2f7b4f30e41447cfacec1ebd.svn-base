# Supplier Payment API (mock)

This folder provides a small mock API for supplier payments backed by localStorage.

Files:
- types.ts - TypeScript interfaces for SupplierPayment and payloads.
- dataStore.ts - In-browser async datastore (localStorage) exposing CRUD functions.
- handlers.ts - Lightweight handlers that wrap datastore functions and perform simple validation.

Usage (example):
import { list, add, edit, remove, getById } from './src/api/supplierPayment/handlers'

Notes:
- Data is persisted to localStorage under the key "wc_supplier_payments_v1".
- Payment numbers are enforced unique in the mock store.
- To integrate with purchase invoices for paid/paidAmount updates, call the purchaseInvoice handlers accordingly (not done automatically to avoid cross-API side effects in the mock).
