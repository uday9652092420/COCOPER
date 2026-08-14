-- ============================================================
-- 02_master_sample_data.sql
-- Additional dummy/sample records for all master modules.
--
-- All rows are inserted with organization_id = NULL so they are
-- globally visible to every organization.
-- Idempotent: ON CONFLICT (id) DO NOTHING.
--
-- Run AFTER 01_organization_scoping.sql.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- Warehouses
-- ------------------------------------------------------------
INSERT INTO warehouses (id, code, name, address, manager, contact_number, status, created_at) VALUES
('WH4', 'WH-4', 'East Coast Warehouse', 'No. 4, East Coast Road, Chennai', 'Manager D', '9000012348', 'Active', CURRENT_DATE - INTERVAL '12 days'),
('WH5', 'WH-5', 'West Zone Warehouse', 'No. 5, West Avenue, Pune', 'Manager E', '9000012349', 'Active', CURRENT_DATE - INTERVAL '8 days'),
('WH6', 'WH-6', 'North East Depot', 'No. 6, NE Lane, Guwahati', 'Manager F', '9000012350', 'Inactive', CURRENT_DATE - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Items
-- ------------------------------------------------------------
INSERT INTO items (id, code, name, category, uom, status, created_at) VALUES
('IT4', 'IT-4', 'Tender Coconut', 'Fresh', 'Piece', 'Active', CURRENT_DATE - INTERVAL '10 days'),
('IT5', 'IT-5', 'Coconut Copra', 'Dry', 'Kg', 'Active', CURRENT_DATE - INTERVAL '6 days'),
('IT6', 'IT-6', 'Coconut Oil', 'Processed', 'Litre', 'Active', CURRENT_DATE - INTERVAL '2 days'),
('IT10', 'IT-10', 'Desiccated Coconut', 'Dry', 'Kg', 'Active', CURRENT_DATE - INTERVAL '20 days'),
('IT11', 'IT-11', 'Coconut Milk Powder', 'Processed', 'Kg', 'Active', CURRENT_DATE - INTERVAL '18 days'),
('IT12', 'IT-12', 'Coconut Shell Charcoal', 'By-product', 'Kg', 'Active', CURRENT_DATE - INTERVAL '16 days')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Gunny Bags
-- ------------------------------------------------------------
INSERT INTO gunny_bags (id, code, name, size, rate_per_bag, opening_stock, status, created_at) VALUES
('GB4', 'GB-004', 'Heavy Duty Bag', '40x60 cm', 55, 120, 'Active', CURRENT_DATE - INTERVAL '9 days'),
('GB5', 'GB-005', 'Mesh Bag', '30x45 cm', 40, 80, 'Active', CURRENT_DATE - INTERVAL '5 days'),
('GB6', 'GB-006', 'Woven Sack', '35x50 cm', 48, 60, 'Inactive', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO gunny_bag_bharthi_types (id, gunny_bag_id, bharthi, stock, created_at) VALUES
('GB4-B120', 'GB4', '120', 35, CURRENT_DATE),
('GB4-B150', 'GB4', '150', 45, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Suppliers
-- ------------------------------------------------------------
INSERT INTO suppliers (id, code, name, type, state, address, mobile, whatsapp, contact_person, opening_balance, status, created_at) VALUES
('SUP-4', 'SUP-004', 'Western Traders', 'National', 'Maharashtra', '22 Trade Park, Pune', '9000200004', '9000200004', 'Ravi', 50000.00, 'Active', CURRENT_DATE - INTERVAL '15 days'),
('SUP-5', 'SUP-005', 'Coastal Exports', 'International', 'Kerala', '8 Port Road, Kochi', '9000200005', '9000200005', 'Nina', 200000.00, 'Active', CURRENT_DATE - INTERVAL '7 days'),
('SUP-6', 'SUP-006', 'Neighbourhood Supply Co', 'Local', 'Karnataka', '3 Local Street, Mysuru', '9000200006', '9000200006', 'Arun', 0.00, 'Inactive', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Customers
-- ------------------------------------------------------------
INSERT INTO customers (id, code, name, type, state, address, mobile, whatsapp, contact_person, credit_limit, status, created_at) VALUES
('CUST-4', 'CUST-004', 'Green Grocers', 'Premium', 'Karnataka', '45 Garden Road, Bangalore', '9000100004', '9000100004', 'Divya', 250000, 'Active', CURRENT_DATE - INTERVAL '14 days'),
('CUST-5', 'CUST-005', 'Village Store', 'Local', 'Tamil Nadu', '1 Main Bazaar, Madurai', '9000100005', '9000100005', 'Suresh', 30000, 'Active', CURRENT_DATE - INTERVAL '5 days'),
('CUST-6', 'CUST-006', 'Budget Mart', 'Red', 'Kerala', '7 Old Road, Thrissur', '9000100006', '9000100006', 'Latha', 0, 'Active', CURRENT_DATE - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Labour Staff
-- ------------------------------------------------------------
INSERT INTO labours (id, labour_name, gender, contact_number, address, in_time, out_time, overtime_5_8, overtime_6_8, overtime_7_8, overtime_7p_9p, overtime_7p_10p, loading_amount, status, created_at) VALUES
('LABS4', 'Mohan Das', 'Male', '980000004', 'No 4, Worker Lane', '09:00', '18:00', 100, 70, 50, 120, 150, 380, 'Active', CURRENT_DATE - INTERVAL '6 days'),
('LABS5', 'Lakshmi', 'Female', '980000005', 'No 5, Worker Lane', '08:30', '17:30', 60, 50, 30, 80, 90, 300, 'Active', CURRENT_DATE - INTERVAL '4 days'),
('LABS6', 'Kannan', 'Male', '980000006', 'No 6, Worker Lane', '09:00', '18:00', 40, 30, 20, 50, 60, 180, 'Inactive', CURRENT_DATE - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------
-- Bag Purchase (sample header + lines)
-- ------------------------------------------------------------
INSERT INTO bag_purchases (id, purchase_no, supplier_id, supplier_name, purchase_date, total_amount, remarks, created_at)
VALUES
('BP2', 'BP-2026-0002', 'SUP-1', 'Global Supplies Co.', CURRENT_DATE - INTERVAL '4 days', 27000, 'Second sample purchase', CURRENT_DATE - INTERVAL '4 days')
ON CONFLICT DO NOTHING;

INSERT INTO bag_purchase_lines (id, purchase_id, bag_type_id, bharthi, quantity, rate, amount)
VALUES
('BPL3', 'BP2', 'GB1', 120, 60, 150, 9000),
('BPL4', 'BP2', 'GB1', 150, 120, 150, 18000)
ON CONFLICT DO NOTHING;

COMMIT;
