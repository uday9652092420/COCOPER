export type CustomerReceiptInvoiceMode = 'Invoice by Invoice' | 'Cumulative';
export type CustomerReceiptPaymentMode = 'Cash' | 'UPI';

export interface CustomerReceipt {
  id: string;
  receipt_no: string;
  customer_id: string;
  customer_name?: string | null;
  receipt_date: string;
  invoice_mode: CustomerReceiptInvoiceMode;
  invoice_no?: string | null;
  amount: number;
  payment_mode: CustomerReceiptPaymentMode;
  remarks?: string | null;
  approved?: boolean;
  attachment_names?: string | null;
  attachment_files?: string | null;
  organization_id?: string | null;
  created_at?: string;
}

export interface CreateCustomerReceiptInput {
  receipt_no: string;
  customer_id: string;
  receipt_date: string;
  invoice_mode?: CustomerReceiptInvoiceMode;
  invoice_no?: string | null;
  amount: number;
  payment_mode?: CustomerReceiptPaymentMode;
  remarks?: string | null;
  approved?: boolean;
  attachment_names?: string | null;
  attachment_files?: string | null;
  organization_id?: string | null;
}

export interface UpdateCustomerReceiptInput extends CreateCustomerReceiptInput {}
