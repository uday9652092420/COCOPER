import { WarehouseCreateDTO, Warehouse } from './warehouse.types.js';
import {
  createWarehouseRepo,
  getWarehouseByIdRepo,
  listWarehousesRepo,
  updateWarehouseRepo,
} from "./warehouse.repository.js";
import {
  getNextWarehouseCodeRepo,
} from './warehouse.repository.js';

export async function createWarehouse(payload: WarehouseCreateDTO): Promise<Warehouse> {
  // business rules could go here (e.g., normalize code)
  payload.code = String(payload.code).trim();
  payload.name = String(payload.name).trim();
  return createWarehouseRepo(payload);
}

export async function updateWarehouse(
  id: string,
  payload: WarehouseCreateDTO
): Promise<Warehouse | null> {
  // Business rules
  payload.code = String(payload.code).trim();
  payload.name = String(payload.name).trim();

  return updateWarehouseRepo(id, payload);
}

export async function getWarehouseById(id: string): Promise<Warehouse | null> {
  return getWarehouseByIdRepo(id);
}

export async function listWarehouses(): Promise<Warehouse[]> {
  return listWarehousesRepo();
}
export async function getNextWarehouseCode(): Promise<string> {
  return getNextWarehouseCodeRepo();
}