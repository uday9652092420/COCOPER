import { WarehouseCreateDTO } from './warehouse.types';

export function validateWarehousePayload(payload: Partial<WarehouseCreateDTO>) {
  const errors: Record<string, string> = {};

  if (!payload.code || String(payload.code).trim() === '') {
    errors.code = 'Warehouse code is required';
  }
  if (!payload.name || String(payload.name).trim() === '') {
    errors.name = 'Warehouse name is required';
  }
  if (!payload.address || String(payload.address).trim() === '') {
    errors.address = 'Address is required';
  }
  if (!payload.manager || String(payload.manager).trim() === '') {
    errors.manager = 'Manager is required';
  }
  if (!payload.contact_number || String(payload.contact_number).trim() === '') {
    errors.contact_number = 'Contact number is required';
  }

  return Object.keys(errors).length ? errors : null;
}
