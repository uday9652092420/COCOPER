-- ============================================================
-- 04_sample_branches.sql
-- Sample branches for the first organization (ORG-001).
--
-- Run AFTER user_access.sql (branches table).
-- Idempotent: ON CONFLICT DO NOTHING.
-- ============================================================

BEGIN;

INSERT INTO branches (organization_id, branch_code, branch_name, address, contact_no, status)
VALUES
('f6801834-3759-4585-a27a-7c692bb89a3c', 'BR-001', 'Head Office Branch', 'No. 1, Main Road, Coconut City', '9000000001', 'ACTIVE'),
('f6801834-3759-4585-a27a-7c692bb89a3c', 'BR-002', 'City Center Branch', 'No. 2, Market Street, Coconut City', '9000000002', 'ACTIVE'),
('f6801834-3759-4585-a27a-7c692bb89a3c', 'BR-003', 'North Depot Branch', 'No. 3, North Road, Coconut City', '9000000003', 'INACTIVE'),
('f6801834-3759-4585-a27a-7c692bb89a3c', 'BR-004', 'South Terminal Branch', 'No. 4, South Avenue, Coconut City', '9000000004', 'ACTIVE'),
('f6801834-3759-4585-a27a-7c692bb89a3c', 'BR-005', 'Port Warehouse Branch', 'No. 5, Port Road, Coconut City', '9000000005', 'ACTIVE')
ON CONFLICT DO NOTHING;

COMMIT;
