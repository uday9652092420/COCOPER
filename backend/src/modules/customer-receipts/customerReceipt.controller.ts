import type { Request, Response } from 'express';
import { approveCustomerReceiptService, createCustomerReceiptService, deleteCustomerReceiptService, getCustomerReceiptsByCustomerService, getCustomerReceiptsService, getNextCustomerReceiptNoService, updateCustomerReceiptService } from './customerReceipt.service.js';

export async function listCustomerReceiptsHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getCustomerReceiptsService(req);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to load customer receipts.' });
  }
}

export async function getNextCustomerReceiptNoHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await getNextCustomerReceiptNoService(req);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to generate next receipt number.' });
  }
}

export async function createCustomerReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await createCustomerReceiptService(req);
    res.status(201).json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to save customer receipt.' });
  }
}

export async function updateCustomerReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await updateCustomerReceiptService(req);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to update customer receipt.' });
  }
}

export async function deleteCustomerReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    await deleteCustomerReceiptService(req);
    res.json({ success: true, message: 'Customer receipt deleted successfully.' });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to delete customer receipt.' });
  }
}

export async function approveCustomerReceiptHandler(req: Request, res: Response): Promise<void> {
  try {
    const data = await approveCustomerReceiptService(req);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to approve customer receipt.' });
  }
}

export async function getCustomerReceiptsByCustomerHandler(req: Request, res: Response): Promise<void> {
  try {
    const customerId = String(req.params.customerId ?? '');
    const data = await getCustomerReceiptsByCustomerService(customerId, req);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message ?? 'Unable to load customer receipts.' });
  }
}
