-- ============================================================
-- 04_sample_branches.sql
-- Sample branches for the first organization in the database.
--
-- Run AFTER user_access.sql (branches table).
-- Idempotent: ON CONFLICT DO NOTHING.
-- ============================================================

BEGIN;

INSERT INTO branches (organization_id, branch_code, branch_name, address, contact_no, status)
SELECT organizations.id, samples.branch_code, samples.branch_name, samples.address, samples.contact_no, samples.status
FROM (VALUES
	('BR-001', 'Head Office Branch', 'No. 1, Main Road, Coconut City', '9000000001', 'ACTIVE'),
	('BR-002', 'City Center Branch', 'No. 2, Market Street, Coconut City', '9000000002', 'ACTIVE'),
	('BR-003', 'North Depot Branch', 'No. 3, North Road, Coconut City', '9000000003', 'INACTIVE'),
	('BR-004', 'South Terminal Branch', 'No. 4, South Avenue, Coconut City', '9000000004', 'ACTIVE'),
	('BR-005', 'Port Warehouse Branch', 'No. 5, Port Road, Coconut City', '9000000005', 'ACTIVE')
) AS samples(branch_code, branch_name, address, contact_no, status)
CROSS JOIN LATERAL (
	SELECT id FROM organizations ORDER BY created_at, id LIMIT 1
) AS organizations
WHERE NOT EXISTS (
	SELECT 1 FROM branches existing
	WHERE existing.organization_id = organizations.id
		AND existing.branch_code = samples.branch_code
);

COMMIT;
