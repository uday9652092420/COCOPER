import { API } from "../../config/api";
import { getOrgHeader } from "../../utils/apiHeaders";


export interface SupplierResponse {
  id: string;

  code: string;

  name: string;

  type:
    | "Local"
    | "National"
    | "International";

  state?: string;

  address?: string;

  mobile?: string;

  whatsapp?: string;

  contact_person?: string;

  contact_person1?: string;

  contact_no1?: string;

  contact_person2?: string;

  contact_no2?: string;

  opening_balance: number;

  status:
    | "Active"
    | "Inactive";

  created_at: string;
}


/**
 * Create Supplier
 */
export async function createSupplier(
  payload: {
    code: string;
    name: string;

    type:
      | "Local"
      | "National"
      | "International";

    state?: string;

    address?: string;

    mobile?: string;

    whatsapp?: string;

    contact_person?: string;

    contact_person1?: string;

    contact_no1?: string;

    contact_person2?: string;

    contact_no2?: string;

    opening_balance:number;

    status:
      | "Active"
      | "Inactive";
  }
): Promise<SupplierResponse> {


  const response = await fetch(
    `${API}/suppliers`,
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json",
        ...getOrgHeader(),
      },

      body:JSON.stringify(payload),
    }
  );


  const data = await response.json();


  if(!response.ok){
    throw data;
  }


  return data.data;
}



/**
 * Get Next Supplier Code
 *
 * Example:
 * SUP-001
 * SUP-002
 */
export async function getNextSupplierCode()
:Promise<string>{


  const response = await fetch(
    `${API}/suppliers/next-code`,
    { headers: getOrgHeader() }
  );


  const data = await response.json();


  if(!response.ok){
    throw data;
  }


  return data.data;
}



/**
 * Get All Suppliers
 */
export async function getSuppliers()
:Promise<SupplierResponse[]>{


  const response = await fetch(
    `${API}/suppliers`,
    { headers: getOrgHeader() }
  );


  const data = await response.json();


  if(!response.ok){
    throw data;
  }


  return data.data;
}



/**
 * Get Supplier By Id
 */
export async function getSupplier(
 id:string
):Promise<SupplierResponse>{


 const response = await fetch(
   `${API}/suppliers/${id}`
 );


 const data = await response.json();


 if(!response.ok){
   throw data;
 }


 return data.data;

}



/**
 * Update Supplier
 */
export async function updateSupplier(
 id:string,

 payload:{
    code:string;

    name:string;

    type:
    | "Local"
    | "National"
    | "International";

    state?:string;

    address?:string;

    mobile?:string;

    whatsapp?:string;

    contact_person?:string;

    contact_person1?:string;

    contact_no1?:string;

    contact_person2?:string;

    contact_no2?:string;

    opening_balance:number;

    status:
    | "Active"
    | "Inactive";
 }

):Promise<SupplierResponse>{


 const response = await fetch(
    `${API}/suppliers/${id}`,
    {
      method:"PUT",

      headers:{
        "Content-Type":"application/json",
      },

      body:JSON.stringify(payload),
    }
 );


 const data = await response.json();


 if(!response.ok){
    throw data;
 }


 return data.data;

}



/**
 * Delete Supplier
 */
export async function deleteSupplier(
 id:string
):Promise<{message:string}>{


 const response = await fetch(
    `${API}/suppliers/${id}`,
    {
      method:"DELETE",
    }
 );


 const data = await response.json();


 if(!response.ok){
    throw data;
 }


 return data;

}