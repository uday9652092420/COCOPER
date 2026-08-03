# Item API (Mock)

This folder implements a small mock API for the Item master with the following structure:

- `types.ts` - TypeScript interfaces for Item, create and update payloads.
- `dataStore.ts` - In-memory + localStorage backed datastore that simulates async operations (list, get, create, update, delete).
- `handlers.ts` - Thin wrappers exposing the datastore functions for frontend usage.

Usage example:

```ts
import * as ItemAPI from 'src/api/item/handlers'

const items = await ItemAPI.list()
const item = await ItemAPI.getById('IT1')
const created = await ItemAPI.add({ code: 'IT-10', name: 'New Item' })
await ItemAPI.edit(created.id, { name: 'Updated' })
await ItemAPI.remove(created.id)
```

Notes:
- Persistence is via `localStorage` key `wc_items_v1`. This can be replaced with real API calls later.
- All functions simulate network latency with small timeouts for a realistic UX experience.