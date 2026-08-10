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

    -- Parent Gunny Bag
    gunny_bag_id TEXT NOT NULL,

    -- Bharthi value.
    -- Stored as VARCHAR because the business value is represented
    -- as a string such as "120", "150", "180", "200".
    bharthi VARCHAR(50) NOT NULL,

    -- Automatically generated code such as:
    -- 120 -> B120
    -- 150 -> B150
    -- 180 -> B180
    -- 200 -> B200
    bharthi_code VARCHAR(50),

    -- Opening stock for this particular Bharthi type
    stock INTEGER NOT NULL DEFAULT 0,

    -- Record creation date
    created_at DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Foreign key relationship with Gunny Bag Master
    CONSTRAINT fk_gunny_bag_bharthi_gunny_bag
        FOREIGN KEY (gunny_bag_id)
        REFERENCES gunny_bags(id)
        ON DELETE CASCADE
);

-- ============================================================
-- Indexes
-- ============================================================

-- Faster lookup of Bharthi types belonging to a Gunny Bag
CREATE INDEX IF NOT EXISTS idx_gunny_bag_bharthi_gunny_bag_id
    ON gunny_bag_bharthi_types(gunny_bag_id);

-- Faster lookup by Bharthi
CREATE INDEX IF NOT EXISTS idx_gunny_bag_bharthi_bharthi
    ON gunny_bag_bharthi_types(bharthi);

-- Faster lookup by Bharthi Code
CREATE INDEX IF NOT EXISTS idx_gunny_bag_bharthi_code
    ON gunny_bag_bharthi_types(bharthi_code);

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
    bharthi_code,
    stock,
    created_at
)
VALUES
(
    'GB1-B120',
    'GB1',
    '120',
    'B120',
    30,
    CURRENT_DATE
),
(
    'GB1-B150',
    'GB1',
    '150',
    'B150',
    20,
    CURRENT_DATE
),
(
    'GB1-B180',
    'GB1',
    '180',
    'B180',
    40,
    CURRENT_DATE
),
(
    'GB1-B200',
    'GB1',
    '200',
    'B200',
    10,
    CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;

COMMIT;