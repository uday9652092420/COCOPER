import { pool } from '../../config/db.js';
import { WarehouseCreateDTO, Warehouse } from './warehouse.types.js';




export async function getNextWarehouseCodeRepo(): Promise<string> {
  const { rows } = await pool.query(`
    SELECT code
    FROM warehouses
    WHERE code LIKE 'WH-%'
    ORDER BY CAST(SUBSTRING(code FROM 4) AS INTEGER) DESC
    LIMIT 1
  `);

  if (rows.length === 0) {
    return "WH-1";
  }

  const lastCode = rows[0].code; // WH-15

  const lastNumber = parseInt(lastCode.replace("WH-", ""), 10);

  return `WH-${lastNumber + 1}`;
}
export async function createWarehouseRepo(payload: WarehouseCreateDTO): Promise<Warehouse> {
  const id = payload.id || `WH-${Date.now()}`;
 const warehouseCode =
  payload.code && payload.code.trim() !== ""
    ? payload.code
    : await getNextWarehouseCodeRepo();

const values = [
    id,
    warehouseCode,
    payload.name,
    payload.address ?? null,
    payload.manager ?? null,
    payload.contact_number ?? null,
    payload.status ?? 'Active',
  ];

  const { rows } = await pool.query(
    `INSERT INTO warehouses (id, code, name, address, manager, contact_number, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_DATE)
     RETURNING id, code, name, address, manager, contact_number, status, created_at`,
    values,
  );

  return rows[0];
}

export async function getWarehouseByIdRepo(id: string): Promise<Warehouse | null> {
  const { rows } = await pool.query(
    `SELECT id, code, name, address, manager, contact_number, status, created_at FROM warehouses WHERE id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

export async function listWarehousesRepo(): Promise<Warehouse[]> {
  const { rows } = await pool.query(
    `SELECT id, code, name, address, manager, contact_number, status, created_at FROM warehouses ORDER BY created_at DESC`,
  );
  return rows;
}
export async function updateWarehouseRepo(
  id: string,
  payload: WarehouseCreateDTO
): Promise<Warehouse | null> {
  const { rows } = await pool.query(
    `
    UPDATE warehouses
    SET
      code = $2,
      name = $3,
      address = $4,
      manager = $5,
      contact_number = $6,
      status = $7
    WHERE id = $1
    RETURNING
      id,
      code,
      name,
      address,
      manager,
      contact_number,
      status,
      created_at
    `,
    [
      id,
      payload.code,
      payload.name,
      payload.address ?? null,
      payload.manager ?? null,
      payload.contact_number ?? null,
      payload.status ?? "Active",
    ]
  );

  return rows[0] ?? null;
}