
import { API } from "../../config/api";

/**
 * ============================================================
 * Gunny Bag Master
 * ============================================================
 */
export interface GunnyBagResponse {
  id: string;
  code: string;
  name: string;
  size: string;
  rate_per_bag: number;
  opening_stock: number;
  status: "Active" | "Inactive";
  created_at: string;
  bharthi_types?: GunnyBagBharthiType[];
}

/**
 * ============================================================
 * Gunny Bag Bharthi Type
 * ============================================================
 *
 * Backend example:
 *
 * {
 *   id: "GB1-B120",
 *   gunny_bag_id: "GB1",
 *   bharthi: "120-Bharthi",
 *   bharthi_code: "B120-Bharthi",
 *   stock: 30,
 *   created_at: "2026-08-08"
 * }
 *
 * bharthi_code is NOT displayed in the UI.
 */
export interface GunnyBagBharthiType {
  id: string;
  gunny_bag_id: string;
  bharthi: string;
  bharthi_code?: string;
  stock: number;
  created_at: string;
}

/**
 * ============================================================
 * Gunny Bag Details Response
 * ============================================================
 *
 * Used by:
 *
 * GET /gunny-bags/:id
 *
 * This is different from GunnyBagResponse because
 * the details endpoint also contains bharthi_types.
 */
export interface GunnyBagDetailsResponse
  extends GunnyBagResponse {
  bharthi_types: GunnyBagBharthiType[];
}

/**
 * ============================================================
 * Bharthi Create Payload
 * ============================================================
 *
 * Frontend sends:
 *
 * {
 *   bharthi: "200-Bharthi",
 *   stock: 30
 * }
 */
export interface GunnyBagBharthiTypeCreatePayload {
  bharthi: string;
  stock: number;
}

/**
 * ============================================================
 * Bharthi Update Payload
 * ============================================================
 */
export interface GunnyBagBharthiTypeUpdatePayload {
  bharthi: string;
  stock: number;
}

/**
 * ============================================================
 * Gunny Bag Save Payload
 * ============================================================
 */
export interface GunnyBagSavePayload {
  code: string;
  name: string;
  size: string;
  rate_per_bag: number;
  opening_stock: number;
  status: "Active" | "Inactive";

  /**
   * Bharthi details.
   *
   * Example:
   *
   * [
   *   {
   *     bharthi: "200-Bharthi",
   *     stock: 30
   *   }
   * ]
   */
  bharthi_types: GunnyBagBharthiTypeCreatePayload[];
}

/**
 * ============================================================
 * API Helper
 * ============================================================
 */
async function parseResponse(
  response: Response
): Promise<any> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      message: text,
    };
  }
}

/**
 * ============================================================
 * Create Gunny Bag
 * ============================================================
 *
 * POST /api/gunny-bags
 */
export async function createGunnyBag(
  payload: GunnyBagSavePayload
): Promise<GunnyBagDetailsResponse> {
  const response = await fetch(
    `${API}/gunny-bags`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Get Next Gunny Bag Code
 * ============================================================
 *
 * GET /api/gunny-bags/next-code
 */
export async function getNextGunnyBagCode(): Promise<string> {
  const response = await fetch(
    `${API}/gunny-bags/next-code`
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Get All Gunny Bags
 * ============================================================
 *
 * GET /api/gunny-bags
 */
export async function getGunnyBags(): Promise<
  GunnyBagResponse[]
> {
  const response = await fetch(
    `${API}/gunny-bags`
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Get Gunny Bag By Id
 * ============================================================
 *
 * GET /api/gunny-bags/:id
 *
 * IMPORTANT:
 *
 * Return type is GunnyBagDetailsResponse,
 * NOT GunnyBagResponse.
 *
 * This fixes:
 *
 * Property 'bharthi_types' does not exist
 * on type 'GunnyBagResponse'.
 */
export async function getGunnyBag(
  id: string
): Promise<GunnyBagDetailsResponse> {
  const response = await fetch(
    `${API}/gunny-bags/${id}`
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Update Gunny Bag
 * ============================================================
 *
 * PUT /api/gunny-bags/:id
 */
export async function updateGunnyBag(
  id: string,
  payload: GunnyBagSavePayload
): Promise<GunnyBagDetailsResponse> {
  const response = await fetch(
    `${API}/gunny-bags/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Delete Gunny Bag
 * ============================================================
 *
 * DELETE /api/gunny-bags/:id
 */
export async function deleteGunnyBag(
  id: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API}/gunny-bags/${id}`,
    {
      method: "DELETE",
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data;
}

/**
 * ============================================================
 * BHARTHI TYPES
 * ============================================================
 */

/**
 * Get all Bharthi Types for a Gunny Bag
 *
 * GET /api/gunny-bags/:gunnyBagId/bharthi-types
 */
export async function getGunnyBagBharthiTypes(
  gunnyBagId: string
): Promise<GunnyBagBharthiType[]> {
  const response = await fetch(
    `${API}/gunny-bags/${gunnyBagId}/bharthi-types`
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Create Bharthi Type
 * ============================================================
 *
 * POST /api/gunny-bags/:gunnyBagId/bharthi-types
 *
 * Example:
 *
 * {
 *   bharthi: "200-Bharthi",
 *   stock: 30
 * }
 */
export async function createGunnyBagBharthiType(
  gunnyBagId: string,
  payload: GunnyBagBharthiTypeCreatePayload
): Promise<GunnyBagBharthiType> {
  const response = await fetch(
    `${API}/gunny-bags/${gunnyBagId}/bharthi-types`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Update Bharthi Type
 * ============================================================
 *
 * PUT /api/gunny-bags/:gunnyBagId/bharthi-types/:id
 */
export async function updateGunnyBagBharthiType(
  gunnyBagId: string,
  id: string,
  payload: GunnyBagBharthiTypeUpdatePayload
): Promise<GunnyBagBharthiType> {
  const response = await fetch(
    `${API}/gunny-bags/${gunnyBagId}/bharthi-types/${id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data.data;
}

/**
 * ============================================================
 * Delete Bharthi Type
 * ============================================================
 *
 * DELETE /api/gunny-bags/:gunnyBagId/bharthi-types/:id
 */
export async function deleteGunnyBagBharthiType(
  gunnyBagId: string,
  id: string
): Promise<{ message: string }> {
  const response = await fetch(
    `${API}/gunny-bags/${gunnyBagId}/bharthi-types/${id}`,
    {
      method: "DELETE",
    }
  );

  const data =
    await parseResponse(response);

  if (!response.ok) {
    throw data;
  }

  return data;
}
