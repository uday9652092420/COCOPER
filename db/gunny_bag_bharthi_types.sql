/**
 * @file gunny_bag_bharthi_types.sql
 * @description PostgreSQL script to create the Gunny Bag Bharthi Types
 *              child table.
 *
 * Business Purpose:
 * - A Gunny Bag can support multiple Bharthi types.
 * - Bharthi represents the number of coconuts that can be packed
 *   into a particular type of Gunny Bag.
 * - Each Bharthi type maintains its own opening stock.
 * - Bharthi Code is automatically generated from the Bharthi value.
 *
 * Example:
 * Gunny Bag: GB1
 *
 * Bharthi | Bharthi Code | Stock
 * --------|--------------|------
 * 120     | B120         | 30
 * 150     | B150         | 20
 * 180     | B180         | 40
 * 200     | B200         | 10
 *
 * The relationship is:
 *
 * gunny_bags
 *      |
 *      | 1
 *      |
 *      | many
 *      v
 * gunny_bag_bharthi_types
 *
 * Intended for PostgreSQL (pgAdmin / psql).
 */

BEGIN;

-- ============================================================
-- Create Gunny Bag Bharthi Types Child Table
-- ============================================================

CREATE TABLE IF NOT EXISTS gunny_bag_bharthi_types (
    id TEXT PRIMARY KEY,

    gunny_bag_id TEXT NOT NULL,

    bharthi TEXT NOT NULL,

    stock INTEGER NOT NULL DEFAULT 0,

    created_at DATE NOT NULL DEFAULT CURRENT_DATE,

    CONSTRAINT uq_gunny_bag_bharthi
        UNIQUE (gunny_bag_id, bharthi),

    CONSTRAINT chk_gunny_bag_bharthi_stock
        CHECK (stock >= 0),

    CONSTRAINT fk_gunny_bag_bharthi_types_gunny_bag
        FOREIGN KEY (gunny_bag_id)
        REFERENCES gunny_bags(id)
        ON DELETE CASCADE
);

-- ============================================================
-- Indexes
-- ============================================================

-- Faster lookup of Bharthi types belonging to a Gunny Bag
CREATE INDEX IF NOT EXISTS idx_gunny_bag_bharthi_types_gunny_bag_id
    ON gunny_bag_bharthi_types(gunny_bag_id);

-- Faster lookup by Bharthi
CREATE INDEX IF NOT EXISTS idx_gunny_bag_bharthi_types_bharthi
    ON gunny_bag_bharthi_types(bharthi);

-- ============================================================
-- Sample Data
-- ============================================================
-- Sample Bharthi details for Gunny Bag GB1.
--
-- These represent:
-- 120 Bharthi -> 30 bags
-- 150 Bharthi -> 20 bags
-- 180 Bharthi -> 40 bags
-- 200 Bharthi -> 10 bags
--
-- Total Opening Stock = 100

INSERT INTO gunny_bag_bharthi_types
(
    id,
    gunny_bag_id,
    bharthi,
    stock,
    created_at
)
VALUES
(
    'GB1-B120',
    'GB1',
    '120',
    30,
    CURRENT_DATE
),
(
    'GB1-B150',
    'GB1',
    '150',
    20,
    CURRENT_DATE
),
(
    'GB1-B180',
    'GB1',
    '180',
    40,
    CURRENT_DATE
),
(
    'GB1-B200',
    'GB1',
    '200',
    10,
    CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;

COMMIT;