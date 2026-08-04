import { pool } from '../../config/db.js';
import { WarehouseCreateDTO, Warehouse } from './warehouse.types.js';

export async function createWarehouseRepo(payload: WarehouseCreateDTO): Promise<Warehouse> {
  const id = payload.id || `WH-${Date.now()}`;
  const values = [
    id,
    payload.code,
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
