export type Warehouse = {
  id: string;
  code: string;
  name: string;
  address?: string;
  manager?: string;
  contact_number?: string;
  status?: 'Active' | 'Inactive';
  created_at?: string;
  organization_id?: string | null;
};

export type WarehouseCreateDTO = Omit<Warehouse, 'id' | 'created_at'> & { id?: string };
