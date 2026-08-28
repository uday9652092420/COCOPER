/**
 * @file supplier.controller.ts
 * @description Controller layer for Supplier Master module.
 */


import { Request, Response } from "express";


import {

  createSupplierService,

  updateSupplierService,

  deleteSupplierService,

  listSuppliersService,

  getSupplierService,

  getNextSupplierCodeService,

} from "./supplier.service.js";





/**
 * Route Params
 */
interface IdParams {

  id:string;

}


function resolveOrganizationId(req: Request): string | undefined {
  return (
    (req.query.organizationId as string | undefined) ||
    req.header("x-organization-id")
  );
}









/**
 * Get Next Supplier Code
 *
 * GET /api/suppliers/next-code
 */
export async function getNextSupplierCodeHandler(

  req:Request,

  res:Response

):Promise<Response>{


  try{


    const code =
      await getNextSupplierCodeService(
        resolveOrganizationId(req)
      );



    return res.status(200).json({

      success:true,

      data:code

    });



  }catch(error:any){


    return res.status(error.status || 500).json({

      success:false,

      message:
        error.message ||
        "Failed to generate supplier code"

    });


  }

}









/**
 * Create Supplier
 *
 * POST /api/suppliers
 */
export async function createSupplierHandler(

  req:Request,

  res:Response

):Promise<Response>{


  try{


    const organizationId = requireOrganizationId(req);

    const supplier =
      await createSupplierService(
        {
          ...req.body,
          organization_id: organizationId,
        }
      );



    return res.status(201).json({

      success:true,

      message:
        "Supplier created successfully",

      data:supplier

    });



  }catch(error:any){



    return res.status(
      error.status || 500
    ).json({

      success:false,

      message:
        error.message ||
        "Failed to create Supplier",

      errors:
        error.errors ?? null

    });


  }

}









/**
 * List Suppliers
 *
 * GET /api/suppliers
 */
export async function listSuppliersHandler(

  req:Request,

  res:Response

):Promise<Response>{


  try{


    const suppliers =
      await listSuppliersService(
        requireOrganizationId(req)
      );



    return res.status(200).json({

      success:true,

      data:suppliers

    });



  }catch(error:any){


    return res.status(error.status || 500).json({

      success:false,

      message:
        error.message ||
        "Failed to fetch Suppliers"

    });


  }

}









/**
 * Get Supplier By Id
 *
 * GET /api/suppliers/:id
 */
export async function getSupplierHandler(

  req:Request<IdParams>,

  res:Response

):Promise<Response>{


  try{


    const supplier =
      await getSupplierService(
        req.params.id,
        requireOrganizationId(req)
      );



    return res.status(200).json({

      success:true,

      data:supplier

    });



  }catch(error:any){



    return res.status(
      error.status || 404
    ).json({

      success:false,

      message:
        error.message ||
        "Supplier not found"

    });


  }

}









/**
 * Update Supplier
 *
 * PUT /api/suppliers/:id
 */
export async function updateSupplierHandler(

  req:Request<IdParams>,

  res:Response

):Promise<Response>{


  try{


    const supplier =
      await updateSupplierService(

        req.params.id,

        requireOrganizationId(req),

        req.body

      );



    return res.status(200).json({

      success:true,

      message:
        "Supplier updated successfully",

      data:supplier

    });



  }catch(error:any){


    return res.status(
      error.status || 500
    ).json({

      success:false,

      message:
        error.message ||
        "Failed to update Supplier",

      errors:
        error.errors ?? null

    });


  }

}









/**
 * Delete Supplier
 *
 * DELETE /api/suppliers/:id
 */
export async function deleteSupplierHandler(

  req:Request<IdParams>,

  res:Response

):Promise<Response>{


  try{


    const result =
      await deleteSupplierService(
        req.params.id,
        requireOrganizationId(req)
      );



    return res.status(200).json({

      success:true,

      ...result

    });



  }catch(error:any){



    return res.status(
      error.status || 500
    ).json({

      success:false,

      message:
        error.message ||
        "Failed to delete Supplier"

    });


  }

}

function requireOrganizationId(req: Request<any>): string {
  const organizationId = resolveOrganizationId(req);
  if (!organizationId) throw { status: 400, message: "Organization ID is required" };
  return organizationId;
}