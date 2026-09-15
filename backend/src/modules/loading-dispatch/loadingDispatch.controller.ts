import { Request, Response } from "express";
import { deleteLoadingDispatchRepo, listLoadingDispatchesRepo, saveLoadingDispatchRepo, updateLoadingDispatchStatusRepo } from "./loadingDispatch.repository.js";
const requireOrg = (req: Request) => {
	const organizationId = (req.query.organizationId as string) || req.header('x-organization-id')
	if (!organizationId) throw { status: 400, message: 'Organization ID is required' }
	return organizationId
}
export async function listLoadingDispatches(req: Request,res: Response){ try { res.json({success:true,data:await listLoadingDispatchesRepo(requireOrg(req))}); } catch(e:any){res.status(e.status || 500).json({success:false,message:e.message});} }
export async function saveLoadingDispatch(req: Request,res: Response){ try { res.json({success:true,data:await saveLoadingDispatchRepo(req.body,requireOrg(req))}); } catch(e:any){res.status(e.status || 500).json({success:false,message:e.message});} }
export async function deleteLoadingDispatch(req: Request<{id:string}>,res: Response){ try { res.json({success:true,data:await deleteLoadingDispatchRepo(req.params.id,requireOrg(req))}); } catch(e:any){res.status(e.status || 500).json({success:false,message:e.message});} }
export async function updateLoadingDispatchStatus(req: Request<{id:string}>,res: Response){ try { const status = String(req.body?.status || 'Draft'); const data = await updateLoadingDispatchStatusRepo(req.params.id, requireOrg(req), status, req.body?.dispatchDate); if (!data) return res.status(404).json({success:false,message:'Dispatch not found'}); res.json({success:true,data}); } catch(e:any){res.status(e.status || 500).json({success:false,message:e.message});} }