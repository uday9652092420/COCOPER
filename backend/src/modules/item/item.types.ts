export type Item = {
  id: string;
  code: string;
  name: string;
  category?: string;
 uom?: string;
  status?: "Active" | "Inactive";
  created_at?: string;
  organization_id?: string | null;
  branch_id?: string | null;
  branch_wise_stock?: number;
};

export type ItemCreateDTO = Omit<Item, "id" | "created_at"> & {
  id?: string;
};

export interface ItemBranchStock {
  id: string;
  organization_id: string;
  item_id: string;
  item_code: string;
  branch_id: string;
  branch_name: string;
  stock: number;
}

export interface ItemBranchStockInput {
  branch_id: string;
  branch_name: string;
  stock: number;
}