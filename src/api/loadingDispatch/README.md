# Loading Dispatch API (Mock)

This directory contains a simple in-browser mock API for loading dispatch records.

Files:
- types.ts: TypeScript interfaces for dispatch and items.
- dataStore.ts: localStorage-backed async datastore with list/get/create/update/delete operations.
- handlers.ts: thin wrappers that perform basic validation and expose list/getById/add/edit/remove functions.

Notes:
- Data persisted in localStorage under key `wc_loading_dispatch_v1`.
- Create/update functions enforce unique dispatchNo and compute totalQuantity/totalWeight from items.
- Intended for frontend development and can be replaced by real backend endpoints later.