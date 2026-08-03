# Gunny Bag API (Mock)

This folder contains a lightweight mock API used by the frontend for Gunny Bag master data.

Files:
- types.ts — TypeScript interfaces for GunnyBag and payloads.
- dataStore.ts — In-browser async datastore persisted to localStorage. Provides: listGunnyBags, getGunnyBag, createGunnyBag, updateGunnyBag, deleteGunnyBag.
- handlers.ts — Simple wrappers exposing: list, getById, add, edit, remove.

Usage:
import * as GunnyBagAPI from 'src/api/gunnyBag/handlers'
const bags = await GunnyBagAPI.list()
const created = await GunnyBagAPI.add({ code: 'GB-100', name: 'New Bag' })

Notes:
- Persistence key: localStorage 'wc_gunny_bags_v1'
- Simulates small network delay to allow UI loading states.
