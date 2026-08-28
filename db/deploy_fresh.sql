-- COCOPER ERP - fresh database deployment
-- Run from the repository root with:
--   psql -v ON_ERROR_STOP=1 -U postgres -d CoconutCocktailDB -f db/deploy_fresh.sql
-- This script creates schema only. It does not load demo transactions.

\set ON_ERROR_STOP on

\ir 00_types_and_extensions.sql
\ir organizations_master.sql
\ir organization_details.sql
\ir app_users.sql
\ir organization_users.sql
\ir user_access.sql
\ir 08_owner_role_registration.sql
\ir user_permissions.sql
\ir 09_email_login.sql
\ir user_branches.sql
\ir profile_docs.sql
\ir warehouse_master.sql
\ir item_master.sql
\ir gunny_bag_master.sql
\ir gunny_bag_bharthi_types.sql
\ir supplier_master.sql
\ir 10_customer_supplier_organization_scoping.sql
\ir customer_master.sql
\ir labour_master.sql
\ir labour_attendance.sql
\ir bag_purchase.sql
\ir direct_sales.sql
\ir 06_transaction_tables.sql
\ir loading_dispatch.sql
\ir customer_receipt.sql
\ir supplier_payment.sql
