import { API } from "../../config/api";

export interface GunnyBagResponse {
  id: string;
  code: string;
  name: string;
  size: string;
  rate_per_bag: number;
  opening_stock: number;
  status: "Active" | "Inactive";
  created_at: string;
}

/**
 * Create Gunny Bag
 */
export async function createGunnyBag(payload: {
  code: string;
  name: string;
  size: string;
  rate_per_bag: number;
  opening_stock: number;
  status: "Active" | "Inactive";
}): Promise<GunnyBagResponse> {
  const response = await fetch(`${API}/gunny-bags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get Next Gunny Bag Code
 */
export async function getNextGunnyBagCode(): Promise<string> {
  const response = await fetch(`${API}/gunny-bags/next-code`);

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get All Gunny Bags
 */
export async function getGunnyBags(): Promise<GunnyBagResponse[]> {
  const response = await fetch(`${API}/gunny-bags`);

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Get Gunny Bag By Id
 */
export async function getGunnyBag(
  id: string
): Promise<GunnyBagResponse> {
  const response = await fetch(`${API}/gunny-bags/${id}`);

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Update Gunny Bag
 */
export async function updateGunnyBag(
  id: string,
  payload: {
    code: string;
    name: string;
    size: string;
    rate_per_bag: number;
    opening_stock: number;
    status: "Active" | "Inactive";
  }
): Promise<GunnyBagResponse> {
  const response = await fetch(`${API}/gunny-bags/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * Delete Gunny Bag
 */
export async function deleteGunnyBag(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`${API}/gunny-bags/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}