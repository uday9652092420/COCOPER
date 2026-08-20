import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";

export interface ItemResponse {
  id: string;
  code: string;
  name: string;
  category: string;
  uom: string;
  status: "Active" | "Inactive";
  created_at: string;
    branch_wise_stock?: number;
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
    branchWiseStock?: number;
}): Promise<ItemResponse> {
  const response = await fetch(`${API}/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getOrgHeader(),
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
    headers: getOrgHeader(),
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
  const response = await fetch(`${API}/items`, { headers: getOrgHeader() });

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
      branchWiseStock?: number;
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
  stock: number;
}

export async function getItemBranchStock(itemId: string): Promise<ItemBranchStock[]> {
  const response = await fetch(`${API}/items/${itemId}/stock`, { headers: getOrgHeader() });
  if (!response.ok) throw await response.json().catch(() => ({ message: "Failed to load item branch stock" }));
  return response.json();
}

export async function saveItemBranchStock(itemId: string, rows: ItemBranchStockInput[]): Promise<ItemBranchStock[]> {
  const response = await fetch(`${API}/items/${itemId}/stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getOrgHeader() },
    body: JSON.stringify({ rows }),
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
}