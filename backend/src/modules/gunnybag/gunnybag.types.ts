export type GunnyBag = {
  id: string;
  code: string;
  name: string;
  size?: string;
  rate_per_bag?: number;
  opening_stock?: number;
  status?: "Active" | "Inactive";
  created_at?: string;
};

export type GunnyBagCreateDTO = Omit<GunnyBag, "id" | "created_at"> & {
  id?: string;
};