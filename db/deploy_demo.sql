-- COCOPER ERP - fresh database deployment with optional demo master data
-- Run from the repository root with:
--   psql -v ON_ERROR_STOP=1 -U postgres -d CoconutCocktailDB -f db/deploy_demo.sql
-- This includes the fresh schema plus additional master and branch samples.

\set ON_ERROR_STOP on
\ir deploy_fresh.sql
\ir 02_master_sample_data.sql
\ir 04_sample_branches.sql
