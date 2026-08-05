export type Item = {
  id: string;
  code: string;
  name: string;
  category?: string;
 uom?: string;
  status?: "Active" | "Inactive";
  created_at?: string;
};

export type ItemCreateDTO = Omit<Item, "id" | "created_at"> & {
  id?: string;
};