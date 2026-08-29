/**
 * @file gunnybag.types.ts
 * @description Types for Gunny Bag Master and Bharthi child records.
 */

export type GunnyBagBharthiType = {
  id: string;
  gunny_bag_id: string;
  bharthi: string;
  stock: number;
  created_at?: string;
};

export type GunnyBagBharthiTypeCreateDTO = {
  bharthi: string;
  stock: number;
};

export type GunnyBag = {
  id: string;
  code: string;
  name: string;
  size?: string;
  rate_per_bag?: number;
  opening_stock?: number;
  status?: "Active" | "Inactive";
  created_at?: string;
  organization_id?: string | null;
  branch_id?: string | null;
  branch_stock?: Record<string, number> | null;

  bharthi_types?: GunnyBagBharthiType[];
};

export type GunnyBagCreateDTO = Omit<
  GunnyBag,
  "id" | "created_at" | "bharthi_types"
> & {
  id?: string;
  bharthi_types?: GunnyBagBharthiTypeCreateDTO[];
  branch_stock?: Record<string, number>;
};