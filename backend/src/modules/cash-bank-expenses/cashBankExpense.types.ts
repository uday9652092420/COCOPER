export type CashBankPaymentMode = 'Cash' | 'Bank' | 'UPI';
export type CashBankTransactionType = 'Expenses' | 'Income';

export interface CashBankExpenseAttachment {
  name: string;
  mimeType: string;
  data: string;
}

export interface CashBankExpense {
  id: string;
  organizationId: string;
  branchId: string;
  branch: string;
  date: string;
  paymentMode: CashBankPaymentMode;
  transactionType: CashBankTransactionType;
  amount: number;
  description: string;
  attachments: CashBankExpenseAttachment[];
  approved: boolean;
  createdAt: string;
}

export interface CreateCashBankExpenseInput {
  branchId: string;
  date: string;
  paymentMode: CashBankPaymentMode;
  transactionType: CashBankTransactionType;
  amount: number;
  description?: string | null;
  attachments?: CashBankExpenseAttachment[];
}
