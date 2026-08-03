# Customer mock API

Files:
- types.ts: TypeScript interfaces for Customer, NewCustomer, UpdateCustomer.
- dataStore.ts: Async localStorage-backed datastore with seeded data and CRUD functions.
- handlers.ts: Thin wrappers (fetchCustomers, fetchCustomer, addCustomer, editCustomer, removeCustomer).

Usage (example):
import { fetchCustomers, addCustomer } from '@/api/customer/handlers'

const customers = await fetchCustomers()
await addCustomer({ code: 'CUST-100', name: 'New Co', type: 'Local', creditLimit: 0 })

Notes:
- The datastore persists to localStorage under key "mock_customers".
- Business rule: customers with type 'Red' automatically have creditLimit forced to 0.
- These handlers simulate network latency and can be replaced by real HTTP calls later.