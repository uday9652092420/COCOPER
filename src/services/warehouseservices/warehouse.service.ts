import { API } from "../../config/api";

export interface CreateWarehouseResponse {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: string;
  contact_number: string;
  status: "Active" | "Inactive";
  created_at: string;
}

export async function createWarehouse(payload: {
  code: string;
  name: string;
  address: string;
  manager: string;
  contact_number: string;
  status: "Active" | "Inactive";
}): Promise<CreateWarehouseResponse> {

  console.log("Sending Payload", payload);

  const response = await fetch(`${API}/warehouses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  console.log("Response", data);

  if (!response.ok) {
    throw data;
  }

  return data;
}

export async function getNextWarehouseCode(): Promise<string> {
  const response = await fetch(`${API}/warehouses/next-code`);

  if (!response.ok) {
    throw new Error("Failed to fetch warehouse code");
  }

  const data = await response.json();

  return data.code;
}

export interface WarehouseResponse {
  id: string;
  code: string;
  name: string;
  address: string;
  manager: string;
 contact_number: string;
  status: "Active" | "Inactive";
  created_at: string;
}




export async function getWarehouses(): Promise<WarehouseResponse[]> {
  const response = await fetch(`${API}/warehouses`);

  if (!response.ok) {
    throw new Error("Failed to load warehouses");
  }

  return response.json();
}