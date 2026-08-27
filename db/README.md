# COCOPER ERP — Database Deployment Guide

This folder contains the complete PostgreSQL schema for the COCOPER ERP
application (database: `CoconutCocktailDB`).

The files are maintained as a PostgreSQL deployment set for the current
backend schema. Use the checked-in runner files for a repeatable R&D release.

## Prerequisites

- PostgreSQL 13+ (pgcrypto extension is used for `gen_random_uuid()`).
- A database named `CoconutCocktailDB` (or adjust the target database).

## Quick start

```bash
# R&D / release schema only
psql -v ON_ERROR_STOP=1 -U postgres -d CoconutCocktailDB -f db/deploy_fresh.sql

# Optional local/demo environment with sample master and branch data
psql -v ON_ERROR_STOP=1 -U postgres -d CoconutCocktailDB -f db/deploy_demo.sql
```

`deploy_fresh.sql` is the supported fresh-install entry point. It includes the
following files in dependency order:

1. Core types and extensions
2. Organizations, users, roles, branches, permissions and profile documents
3. Master tables and their child tables
4. Direct Sales base tables
5. `06_transaction_tables.sql` for Purchase Orders, Purchase Invoices, Sales Orders and direct-sale gunny bags
6. Loading & Dispatch, Customer Receipts and Supplier Payments

## Optional / legacy files

- `01_organization_scoping.sql`, `03_branch_scoping.sql` and
  `05_purchase_order_organization_scoping.sql` are upgrade migrations for old
  databases. Do not run them as part of a fresh deployment.
- `06_purchase_invoice_sales_tables.sql` is an old destructive migration that
  drops transaction tables. Do not use it for releases; use the canonical
  `06_transaction_tables.sql` instead.
- `purchase_order.sql` and `purchase_invoice.sql` are legacy transaction
  definitions and are intentionally excluded from the runners.
- `02_master_sample_data.sql` and `04_sample_branches.sql` are optional demo
  data and are included by `deploy_demo.sql`.

## Notes

- Schema scripts use `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`
  and guarded enum types. The fresh runner stops on the first error through
  `ON_ERROR_STOP=1`.
- The live database has **no custom functions, procedures, views or triggers**;
  `updated_at` is maintained by application code. See `common_functions.sql`.
