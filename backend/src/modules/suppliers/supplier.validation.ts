/**
 * @file supplier.validation.ts
 * @description Validation rules for Supplier Master module.
 */

import { SupplierCreateDTO } from "./supplier.types.js";


/**
 * Validate Supplier Payload
 */
export function validateSupplierPayload(
  payload: Partial<SupplierCreateDTO>
) {

  const errors: Record<string,string> = {};


  /**
   * Supplier Code
   */
  if(!payload.code?.trim()){

    errors.code =
      "Supplier code is required";

  }


  /**
   * Supplier Name
   */
  if(!payload.name?.trim()){

    errors.name =
      "Supplier name is required";

  }


  /**
   * Supplier Type
   */
  if(
    payload.type &&
    ![
      "Local",
      "National",
      "International"
    ].includes(payload.type)
  ){

    errors.type =
      "Invalid supplier type";

  }



  /**
   * Mobile Validation
   */
  if(
    payload.mobile &&
    !/^[0-9]{10}$/.test(payload.mobile)
  ){

    errors.mobile =
      "Mobile number must be 10 digits";

  }



  /**
   * Whatsapp Validation
   */
  if(
    payload.whatsapp &&
    !/^[0-9]{10}$/.test(payload.whatsapp)
  ){

    errors.whatsapp =
      "Whatsapp number must be 10 digits";

  }



  /**
   * Opening Balance
   */
  if(
    payload.opening_balance !== undefined &&
    Number(payload.opening_balance) < 0
  ){

    errors.opening_balance =
      "Opening balance cannot be negative";

  }



  /**
   * Status
   */
  if(
    payload.status &&
    ![
      "Active",
      "Inactive"
    ].includes(payload.status)
  ){

    errors.status =
      "Invalid supplier status";

  }



  return Object.keys(errors).length
    ? errors
    : null;

}