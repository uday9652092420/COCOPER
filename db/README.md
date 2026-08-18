# COCOPER ERP — Database Deployment Guide

This folder contains the complete PostgreSQL schema for the COCOPER ERP
application (database: `CoconutCocktailDB`).

The files were generated to match the **live database schema** so that a fresh
server can be provisioned by running them in order with `psql`.

## Prerequisites

- PostgreSQL 13+ (pgcrypto extension is used for `gen_random_uuid()`).
- A database named `CoconutCocktailDB` (or adjust the target database).

## Quick start (single command)

```bash
# Linux / macOS
psql -U postgres -d CoconutCocktailDB -f db/00_types_and_extensions.sql
psql -U postgres -d CoconutCocktailDB -f db/organizations_master.sql
psql -U postgres -d CoconutCocktailDB -f db/organization_details.sql
psql -U postgres -d CoconutCocktailDB -f db/app_users.sql
psql -U postgres -d CoconutCocktailDB -f db/organization_users.sql
psql -U postgres -d CoconutCocktailDB -f db/user_access.sql
psql -U postgres -d CoconutCocktailDB -f db/user_permissions.sql
psql -U postgres -d CoconutCocktailDB -f db/user_branches.sql
psql -U postgres -d CoconutCocktailDB -f db/profile_docs.sql
psql -U postgres -d CoconutCocktailDB -f db/warehouse_master.sql
psql -U postgres -d CoconutCocktailDB -f db/item_master.sql
psql -U postgres -d CoconutCocktailDB -f db/gunny_bag_master.sql
psql -U postgres -d CoconutCocktailDB -f db/gunny_bag_bharthi_types.sql
psql -U postgres -d CoconutCocktailDB -f db/supplier_master.sql
psql -U postgres -d CoconutCocktailDB -f db/customer_master.sql
psql -U postgres -d CoconutCocktailDB -f db/labour_master.sql
psql -U postgres -d CoconutCocktailDB -f db/labour_attendance.sql
psql -U postgres -d CoconutCocktailDB -f db/bag_purchase.sql
psql -U postgres -d CoconutCocktailDB -f db/purchase_order.sql
psql -U postgres -d CoconutCocktailDB -f db/purchase_invoice.sql
psql -U postgres -d CoconutCocktailDB -f db/direct_sales.sql
psql -U postgres -d CoconutCocktailDB -f db/loading_dispatch.sql
psql -U postgres -d CoconutCocktailDB -f db/customer_receipt.sql
psql -U postgres -d CoconutCocktailDB -f db/supplier_payment.sql
```

## Required run order

| # | File | Purpose |
|---|------|---------|
| 1 | `00_types_and_extensions.sql` | pgcrypto + all enum types + `organization_code_seq` |
| 2 | `organizations_master.sql` | organizations table |
| 3 | `organization_details.sql` | organization profile details |
| 4 | `app_users.sql` | application super users (+ seed `Uday`) |
| 5 | `organization_users.sql` | organization users |
| 6 | `user_access.sql` | roles, branches, role_permissions (+ seed roles) |
| 7 | `user_permissions.sql` | per-user permissions |
| 8 | `user_branches.sql` | user ↔ branch assignment |
| 9 | `profile_docs.sql` | profile pictures + organization documents |
| 10 | `warehouse_master.sql` | warehouses |
| 11 | `item_master.sql` | items |
| 12 | `gunny_bag_master.sql` | gunny bags |
| 13 | `gunny_bag_bharthi_types.sql` | gunny bag bharthi child rows |
| 14 | `supplier_master.sql` | suppliers |
| 15 | `customer_master.sql` | customers |
| 16 | `labour_master.sql` | labour staff |
| 17 | `labour_attendance.sql` | labour attendance |
| 18 | `bag_purchase.sql` | bag purchases + lines |
| 19 | `purchase_order.sql` | purchase orders + items |
| 20 | `purchase_invoice.sql` | purchase invoices + items |
| 21 | `direct_sales.sql` | direct sales + items |
| 22 | `loading_dispatch.sql` | loading & dispatch + items |
| 23 | `customer_receipt.sql` | customer receipts |
| 24 | `supplier_payment.sql` | supplier payments |

## Optional / legacy files

- `01_organization_scoping.sql`, `03_branch_scoping.sql` — legacy ALTER
  migrations. The `organization_id` / `branch_id` columns are already included
  in the base table definitions above, so these are **not required** for a
  fresh deployment (they are idempotent if you still run them).
- `02_master_sample_data.sql`, `04_sample_branches.sql` — optional sample /
  demo data.

## Notes

- All scripts are idempotent (`CREATE TABLE IF NOT EXISTS`,
  `CREATE INDEX IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, guarded enum types),
  so re-running them is safe.
- The live database has **no custom functions, procedures, views or triggers**;
  `updated_at` is maintained by application code. See `common_functions.sql`.
