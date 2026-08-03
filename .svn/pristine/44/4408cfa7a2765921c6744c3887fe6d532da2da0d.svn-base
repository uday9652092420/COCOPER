# Supplier API (Mock)

This folder provides a simple in-browser mock API for supplier master records.

Files:
- types.ts — TypeScript interfaces for Supplier, NewSupplier, UpdateSupplier.
- dataStore.ts — localStorage-backed async datastore exposing list/create/get/update/delete.
- handlers.ts — clean handler wrappers used by frontend pages.

Usage example:

import * as SupplierAPI from 'src/api/supplier/handlers'

const suppliers = await SupplierAPI.fetchSuppliers()
const created = await SupplierAPI.addSupplier({ code: 'SUP-100', name: 'New Supplier' })
await SupplierAPI.editSupplier({ id: created.id, name: 'Updated Name' })
await SupplierAPI.removeSupplier(created.id)

Notes:
- Data persists to localStorage under key "mock_suppliers".
- This mock simulates network delay but is intentionally lightweight so it can be replaced by a real backend later.