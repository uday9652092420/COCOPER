/**
 * @file bagpurchase.types.ts
 * @description Types used by Bag Purchase module.
 */

/**
 * ============================================================
 * Bag Purchase Line Payload
 * ============================================================
 *
 * Matches the bag_purchase_lines table.
 *
 * bag_type_id
 * quantity
 * rate
 *
 * bag_code and amount are derived by the backend.
 */
export interface BagPurchaseLinePayload {
  /**
   * ID of the Gunny Bag Master record.
   *
   * Stored in bag_purchase_lines.bag_type_id.
   */
  bag_type_id: string;

  /**
   * Optional Bharthi value.
   *
   * Stored in bag_purchase_lines.bharthi.
   */
  bharthi?: number | string | null;

  quantity: number | string;
gunny_bag_id: string;



  rate: number | string;
}

/**
 * ============================================================
 * Bag Purchase Create / Update Payload
 * ============================================================
 */
export interface BagPurchaseCreatePayload {
  purchase_date: string;

  supplier_id: string;

  remarks?: string | null;

  lines: BagPurchaseLinePayload[];
}

/**
 * ============================================================
 * Database Purchase Line Response
 * ============================================================
 *
 * Represents a purchase line together with
 * Gunny Bag Master information.
 */
export interface BagPurchaseLineResponse {
  id: string;

  purchase_id: string;

  /**
   * Original database field.
   *
   * Maps to bag_purchase_lines.bag_type_id.
   */
  bag_type_id: string;

  /**
   * Gunny Bag Master ID.
   *
   * This is the same ID as bag_type_id, exposed using
   * the more descriptive frontend/backend field name.
   */
  gunny_bag_id: string;

  /**
   * Gunny Bag Master code.
   */
  gunny_bag_code?: string | null;

  /**
   * Gunny Bag Master name.
   */
  gunny_bag_name?: string | null;

  /**
   * Backward-compatible Gunny Bag code.
   */
  bag_code?: string | null;

  /**
   * Backward-compatible Gunny Bag name.
   */
  bag_name?: string | null;

  /**
   * Bharthi stored against this purchase line.
   */
  bharthi?: number | null;

  quantity: number;

  rate: number;

  amount: number;
}

/**
 * ============================================================
 * Bag Purchase Response
 * ============================================================
 */
export interface BagPurchaseResponse {
  id: string;

  purchase_no: string;

  purchase_date: string;

  supplier_id: string;

  /**
   * Supplier Master code.
   */
  supplier_code?: string | null;

  /**
   * Supplier Master name.
   */
  supplier_name?: string | null;

  remarks?: string | null;

  total_amount: number;

  created_at: string;

  lines: BagPurchaseLineResponse[];
}