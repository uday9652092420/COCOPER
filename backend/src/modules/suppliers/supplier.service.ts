/**
 * @file supplier.service.ts
 * @description Business logic layer for Supplier Master module.
 */


import {

  createSupplierRepo,

  updateSupplierRepo,

  deleteSupplierRepo,

  listSuppliersRepo,

  getSupplierByIdRepo,

  getNextSupplierCodeRepo,

  checkSupplierUsageRepo,

} from "./supplier.repository.js";


import {
  SupplierCreateDTO
} from "./supplier.types.js";


import {
  validateSupplierPayload
} from "./supplier.validation.js";





/**
 * Get Next Supplier Code
 */
export async function getNextSupplierCodeService(){

  return await getNextSupplierCodeRepo();

}








/**
 * Create Supplier
 */
export async function createSupplierService(

  payload: SupplierCreateDTO

){


  /**
   * Generate code automatically
   * if not provided
   */
  if(!payload.code?.trim()){

    payload.code =
      await getNextSupplierCodeRepo();

  }



  /**
   * Validate payload
   */
  const errors =
    validateSupplierPayload(payload);



  if(errors){

    throw new Error(
      JSON.stringify(errors)
    );

  }



  return await createSupplierRepo(payload);

}









/**
 * Update Supplier
 */
export async function updateSupplierService(

  id:string,

  payload:SupplierCreateDTO

){


  const existing =
    await getSupplierByIdRepo(id);



  if(!existing){

    throw new Error(
      "Supplier not found"
    );

  }





  /**
   * Merge existing values
   * with updated values
   */
  const updatedPayload:SupplierCreateDTO = {


    code:
      payload.code ??
      existing.code,


    name:
      payload.name ??
      existing.name,


    type:
      payload.type ??
      existing.type,


    state:
      payload.state ??
      existing.state,


    address:
      payload.address ??
      existing.address,


    mobile:
      payload.mobile ??
      existing.mobile,


    whatsapp:
      payload.whatsapp ??
      existing.whatsapp,


    contact_person:
      payload.contact_person ??
      existing.contact_person,


    contact_person1:
      payload.contact_person1 ??
      existing.contact_person1,


    contact_no1:
      payload.contact_no1 ??
      existing.contact_no1,


    contact_person2:
      payload.contact_person2 ??
      existing.contact_person2,


    contact_no2:
      payload.contact_no2 ??
      existing.contact_no2,


    opening_balance:
      payload.opening_balance ??
      existing.opening_balance,


    status:
      payload.status ??
      existing.status,


  };






  const errors =
    validateSupplierPayload(
      updatedPayload
    );



  if(errors){

    throw new Error(
      JSON.stringify(errors)
    );

  }




  return await updateSupplierRepo(
    id,
    updatedPayload
  );

}









/**
 * List Suppliers
 */
export async function listSuppliersService(){

  return await listSuppliersRepo();

}









/**
 * Get Supplier By Id
 */
export async function getSupplierService(
  id:string
){


  const supplier =
    await getSupplierByIdRepo(id);



  if(!supplier){

    throw new Error(
      "Supplier not found"
    );

  }



  return supplier;

}









/**
 * Delete Supplier
 */
export async function deleteSupplierService(
  id:string
){


  /**
   * Check dependency usage
   */
  const usedIn =
    await checkSupplierUsageRepo(id);



  if(usedIn.length){


    throw new Error(
      `Supplier is used in ${usedIn.join(", ")}`
    );


  }





  return await deleteSupplierRepo(id);

}