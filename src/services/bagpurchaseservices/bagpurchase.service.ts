import { API } from "../../config/api";
import { getOrgHeader, getBranchHeader } from "../../utils/apiHeaders";

/**
 * Bag Purchase line sent to backend.
 */
export interface BagPurchaseLinePayload {
  id?: string;

  gunny_bag_id: string;

  /**
   * Bharthi value selected for the Gunny Bag.
   */
  bharthi?: number;

  quantity: number;

  rate: number;
}

/**
 * Bag Purchase create/update payload.
 */
export interface BagPurchaseSavePayload {
  purchase_date: string;

  supplier_id: string;

  remarks?: string;
  organization_id?: string | null;
  branch_id: string;

  lines: BagPurchaseLinePayload[];
}

/**
 * Bag Purchase line returned by backend.
 */
export interface BagPurchaseLineResponse {
  id: string;

  purchase_id?: string;

  /**
   * Current API name.
   */
  gunny_bag_id: string;

  gunny_bag_code?: string | null;

  gunny_bag_name?: string | null;

  /**
   * Bharthi value returned by backend.
   */
  bharthi?: number | string | null;

  /**
   * Bharthi code returned by backend.
   */
  bharthi_code?: string | null;

  /**
   * Backward-compatible aliases.
   */
  bag_type_id?: string;

  bag_code?: string | null;

  bag_name?: string | null;

  quantity: number;

  rate: number;

  amount: number;
}

/**
 * Bag Purchase returned by backend.
 */
export interface BagPurchaseResponse {
  id: string;

  purchase_no: string;

  purchase_date: string;

  supplier_id: string;

  supplier_code?: string | null;

  supplier_name?: string | null;

  remarks?: string | null;

  total_amount: number;

  created_at: string;
  organization_id?: string | null;
  branch_id?: string | null;

  /**
   * Optional because the current backend
   * does not necessarily return updated_at.
   */
  updated_at?: string | null;

  lines: BagPurchaseLineResponse[];
}

/**
 * Generic API response.
 */
interface ApiResponse<T = unknown> {
  success?: boolean;

  message?: string;

  data?: T;
}

/**
 * Safely parse API response.
 */
async function parseResponse<T = unknown>(
  response: Response
): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      message: text,
    };
  }
}

/**
 * Get next Bag Purchase number.
 */
export async function getNextBagPurchaseNo(): Promise<string> {
  const response = await fetch(
    `${API}/bag-purchases/next-no`,
    { headers: { ...getOrgHeader(), ...getBranchHeader() } }
  );

  const data = await parseResponse<string>(
    response
  );

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Failed to generate purchase number"
    );
  }

  return String(data.data ?? "");
}

/**
 * Get all Bag Purchases.
 */
export async function getBagPurchases(): Promise<
  BagPurchaseResponse[]
> {
  const response = await fetch(
    `${API}/bag-purchases`,
    { headers: { ...getOrgHeader(), ...getBranchHeader() } }
  );

  const data =
    await parseResponse<BagPurchaseResponse[]>(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Failed to load Bag Purchases"
    );
  }

  return Array.isArray(data.data)
    ? data.data
    : [];
}

/**
 * Get single Bag Purchase.
 */
export async function getBagPurchase(
  id: string
): Promise<BagPurchaseResponse> {
  const response = await fetch(
    `${API}/bag-purchases/${id}`,
    { headers: { ...getOrgHeader(), ...getBranchHeader() } }
  );

  const data =
    await parseResponse<BagPurchaseResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Failed to load Bag Purchase"
    );
  }

  if (!data.data) {
    throw new Error(
      "Bag Purchase not found"
    );
  }

  return data.data;
}

/**
 * Create Bag Purchase.
 */
export async function createBagPurchase(
  payload: BagPurchaseSavePayload
): Promise<BagPurchaseResponse> {
  const response = await fetch(
    `${API}/bag-purchases`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getOrgHeader(),
        ...getBranchHeader(),
      },
      body: JSON.stringify(payload),
    }
  );

  const data =
    await parseResponse<BagPurchaseResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Failed to create Bag Purchase"
    );
  }

  if (!data.data) {
    throw new Error(
      "Bag Purchase was not returned by server"
    );
  }

  return data.data;
}

/**
 * Update Bag Purchase.
 */
export async function updateBagPurchase(
  id: string,
  payload: BagPurchaseSavePayload
): Promise<BagPurchaseResponse> {
  const response = await fetch(
    `${API}/bag-purchases/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data =
    await parseResponse<BagPurchaseResponse>(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Failed to update Bag Purchase"
    );
  }

  if (!data.data) {
    throw new Error(
      "Bag Purchase was not returned by server"
    );
  }

  return data.data;
}

/**
 * Delete Bag Purchase.
 */
export async function deleteBagPurchase(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API}/bag-purchases/${id}`,
    {
      method: "DELETE",
    }
  );

  const data =
    await parseResponse<{ message: string }>(
      response
    );

  if (!response.ok) {
    throw new Error(
      data.message ??
        "Failed to delete purchase"
    );
  }

  return {
    message:
      data.message ??
      "Bag Purchase deleted successfully",
  };
}