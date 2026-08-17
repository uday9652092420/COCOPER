import { API } from "../../config/api";
import { getOrgHeader, getBranchHeader } from "../../utils/apiHeaders";

export interface ItemResponse {
  id: string;
  code: string;
  name: string;
  category: string;
  uom: string;
  status: "Active" | "Inactive";
  created_at: string;
}

/**
 * Create Item
 */
export async function createItem(payload: {
  code: string;
  name: string;
  category: string;
  uom: string;
  status: "Active" | "Inactive";
}): Promise<ItemResponse> {
  const response = await fetch(`${API}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getOrgHeader(),
      ...getBranchHeader(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}

/**
 * Get Next Item Code
 */
export async function getNextItemCode(): Promise<string> {
  const response = await fetch(`${API}/items/next-code`, {
    headers: { ...getOrgHeader(), ...getBranchHeader() },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch item code");
  }

  const data = await response.json();

  return data.code;
}

/**
 * Get All Items
 */
export async function getItems(): Promise<ItemResponse[]> {
  const response = await fetch(`${API}/items`, { headers: { ...getOrgHeader(), ...getBranchHeader() } });

  if (!response.ok) {
    throw new Error("Failed to load items");
  }

  return response.json();
}

/**
 * Get Item By Id
 */
export async function getItem(id: string): Promise<ItemResponse> {
  const response = await fetch(`${API}/items/${id}`);

  if (!response.ok) {
    throw new Error("Failed to load item");
  }

  return response.json();
}

/**
 * Update Item
 */
export async function updateItem(
  id: string,
  payload: {
    code: string;
    name: string;
    category: string;
    uom: string;
    status: "Active" | "Inactive";
  }
): Promise<ItemResponse> {
  const response = await fetch(`${API}/items/${id}`, {
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

  return data;
}

/**
 * Delete Item
 */
export async function deleteItem(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(`${API}/items/${id}`, {
    method: "DELETE",
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}