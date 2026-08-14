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
};

export type ItemCreateDTO = Omit<Item, "id" | "created_at"> & {
  id?: string;
};