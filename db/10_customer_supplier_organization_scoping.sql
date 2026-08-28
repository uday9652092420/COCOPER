-- Strict organization ownership for customer and supplier masters.

CREATE INDEX IF NOT EXISTS idx_customers_organization_code
ON customers (organization_id, code);

CREATE INDEX IF NOT EXISTS idx_suppliers_organization_code
ON suppliers (organization_id, code);

-- New records must belong to an organization. Existing legacy NULL rows are
-- retained for historical access by super-admin workflows.
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_organization_code
ON customers (organization_id, code)
WHERE organization_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_organization_code
ON suppliers (organization_id, code)
WHERE organization_id IS NOT NULL;