export interface LoadingDispatchLine {
  id?: string; branchId: string; date: string; itemId: string; bharthi: string; quantity: number; loadedQuantity?: number; pendingQuantity?: number;
}
export interface LoadingDispatchPayload {
  id?: string; dispatchNumber: string; customerId: string; lorryNumber: string; driverName: string; driverMobile: string; dispatchStatus: string; dispatchDate?: string; invoiceGenerated?: boolean; lines: LoadingDispatchLine[];
}