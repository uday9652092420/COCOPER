/**
 * @file db.ts
 * @description Clean in-memory mock database for the COCOS Coconut Wholesale Management System.
 *
 * This file provides typed mock data used across pages (warehouses, items, gunnyBags,
 * suppliers, customers, purchaseOrders, purchaseInvoices, directSales, indirectSales,
 * dispatches, supplierPayments, labourAttendances).
 */

export type Status = 'Active' | 'Inactive'

/**
 * @description Warehouse master record.
 */
export interface Warehouse {
  id: string
  code: string
  name: string
  address: string
  manager: string
  contactNumber: string
  status: Status
  createdAt: string
}

/**
 * @description Item master record.
 */
export interface Item {
  id: string
  code: string
  name: string
  category: string
  uom: string
  status: Status
  createdAt: string
}

/**
 * @description Gunny bag master record.
 */
export interface GunnyBag {
  id: string
  code: string
  bharthi: number
  freeNuts: number
  defaultRate: number
  status: Status
  createdAt: string
}

/**
 * @description Supplier master record.
 */
export interface Supplier {
  id: string
  code: string
  name: string
  gst: string
  address: string
  mobile: string
  whatsapp: string
  creditDays: number
  status: Status
  createdAt: string
}

/**
 * @description Customer type options.
 */
export type CustomerType = 'Premium' | 'Local' | 'Red'

/**
 * @description Customer master record.
 */
export interface Customer {
  id: string
  code: string
  name: string
  type: CustomerType
  state: string
  address: string
  mobile: string
  whatsapp: string
  creditLimit: number
  status: Status
  createdAt: string
}

/**
 * @description Purchase order line item.
 */
export interface PurchaseOrderLine {
  id: string
  itemId: string
  quantity: number
  discount: number
  actualQuantity?: number
  purchaseCost: number
  purchaseAmount?: number
  amount: number
  rate?: number
}

/**
 * @description Purchase order header.
 */
export interface PurchaseOrder {
  id: string
  poNumber: string
  date: string
  supplierId: string
  warehouseId: string
  remarks: string
  status: 'Draft' | 'Approved'
  organizationId?: string | null
  mode?: 'tonage' | 'lessing'
  lines: PurchaseOrderLine[]
}

/**
 * @description Purchase invoice line item.
 */
export interface PurchaseInvoiceLine {
  id: string
  itemId: string
  quantityTons: number
  discount: number
  purchaseCost: number
  purchaseAmount: number
}

/**
 * @description Purchase invoice gunny bag line.
 */
export interface PurchaseInvoiceGunny {
  id: string
  bagTypeId: string
  quantity: number
  rate: number
  amount: number
}

/**
 * @description Purchase invoice header.
 */
export interface PurchaseInvoice {
  id: string
  supplierId: string
  warehouseId: string
  invoiceNo: string
  invoiceDate: string
  lines: PurchaseInvoiceLine[]
  gunnyBags: PurchaseInvoiceGunny[]
  grandTotal: number

  /**
   * @description Friendly invoice number (duplicate of invoiceNo) for UI usage.
   */
  invoiceNumber?: string

  /**
   * @description Total amount for invoice (same as grandTotal) - added for clarity.
   */
  totalAmount?: number

  /**
   * @description Amount already paid against this invoice (used to compute outstanding).
   */
  paidAmount?: number
}

/**
 * @description Direct sales detail line.
 */
export interface DirectSalesLine {
  id: string
  itemId: string
  quantity: number
  discount: number
  salesPrice: number
  salesAmount: number
}

/**
 * @description Direct sales invoice.
 */
export interface DirectSales {
  id: string
  customerId: string
  customerType: CustomerType
  warehouseId: string
  invoiceDate: string
  /** Optional linked sales order number for reference */
  salesOrderNo?: string
  lines: DirectSalesLine[]
  charges: {
    gunnyBags: number
    transportation: number
    loadingCharges: number
  }
  invoiceTotal: number
}

/**
 * @description Indirect sales combined transaction.
 */
export interface IndirectSales {
  id: string
  supplierId: string
  customerId: string
  purchaseRate: number
  salesRate: number
  quantity: number
  purchaseInvoiceId: string
  salesInvoiceId: string
  date: string
}

/**
 * @description Loading and dispatch line item.
 */
export interface DispatchLine {
  id: string
  warehouseId: string
  date: string
  itemId: string
  bharthi: number
  gunnyBagId: string
  quantity: number
  loadedQuantity: number
  pendingQuantity: number
}

/**
 * @description Loading and dispatch header.
 */
export interface Dispatch {
  id: string
  dispatchNumber: string
  customerId: string
  lorryNumber: string
  driverName: string
  driverMobile: string
  dispatchStatus: 'Pending' | 'Confirmed' | 'Dispatched'
  lines: DispatchLine[]
  invoiceGenerated: boolean
}

/**
 * @description Supplier payment record.
 */
export interface SupplierPayment {
  id: string
  paymentNumber: string
  supplierId: string
  date: string
  paymentMode: 'Cash' | 'Bank' | 'UPI'
  amount: number
  remarks: string
  /**
   * @description Optional related purchase invoice id for this payment (supports partial payments).
   */
  purchaseInvoiceId?: string
}

/**
 * @description Labour attendance record.
 */
export interface LabourAttendance {
  id: string
  labourName: string
  type: 'Regular' | 'Temporary'
  attendanceDate: string
  shift: 'Morning' | 'Evening' | 'Night'
  inTime: string
  outTime: string
  hours: number
  otHours: number
  otRate: number
  totalOtAmount: number
}

/**
 * @description Utility to generate ISO date string with offset.
 */
const daysFromNow = (offset: number): string => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

/**
 * @description Utility to generate random integer between min and max.
 */
const rand = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min

/**
 * @description Mock warehouses.
 */
export const warehouses: Warehouse[] = Array.from({ length: 10 }).map((_, idx) => ({
  id: `WH${idx + 1}`,
  code: `WH-${idx + 1}`,
  name: `Warehouse ${idx + 1}`,
  address: `No. ${idx + 1}, Main Road, Coconut City`,
  manager: `Manager ${idx + 1}`,
  contactNumber: `90000${(10000 + idx).toString().slice(-5)}`,
  status: idx % 7 === 0 ? 'Inactive' : 'Active',
  createdAt: daysFromNow(-rand(10, 90)),
}))

/**
 * @description Mock items.
 */
export const items: Item[] = [
  'Coconut Premium',
  'Medium Coconut',
  'Small Coconut',
  'Dry Coconut',
  'Tender Coconut',
].map((name, idx) => ({
  id: `IT${idx + 1}`,
  code: `IT-${idx + 1}`,
  name,
  category: idx === 3 ? 'Dry' : idx === 4 ? 'Tender' : 'Fresh',
  uom: 'Kg',
  status: 'Active',
  createdAt: daysFromNow(-rand(10, 120)),
}))

/**
 * @description Mock gunny bags.
 */
export const gunnyBags: GunnyBag[] = [120, 150, 180, 200].map((bharthi, idx) => ({
  id: `GB${idx + 1}`,
  code: `GB-${bharthi}`,
  bharthi,
  freeNuts: rand(5, 20),
  defaultRate: bharthi * 0.5,
  status: 'Active',
  createdAt: daysFromNow(-rand(5, 60)),
}))

/**
 * @description Mock suppliers.
 */
export const suppliers: Supplier[] = Array.from({ length: 25 }).map((_, idx) => ({
  id: `SUP${idx + 1}`,
  code: `SUP-${(idx + 1).toString().padStart(3, '0')}`,
  name: `Supplier ${idx + 1}`,
  gst: `29ABCDE${(1000 + idx).toString()}Z5`,
  address: `Supplier Address ${idx + 1}, Coconut District`,
  mobile: `91000${(10000 + idx).toString().slice(-5)}`,
  whatsapp: `91000${(10000 + idx).toString().slice(-5)}`,
  creditDays: rand(7, 45),
  status: idx % 9 === 0 ? 'Inactive' : 'Active',
  createdAt: daysFromNow(-rand(20, 200)),
}))

const states = ['Tamil Nadu', 'Karnataka', 'Andhra Pradesh', 'Kerala', 'Telangana']

/**
 * @description Mock customers.
 */
export const customers: Customer[] = Array.from({ length: 50 }).map((_, idx) => {
  const type: CustomerType = idx % 7 === 0 ? 'Red' : idx % 3 === 0 ? 'Premium' : 'Local'
  const baseLimit = type === 'Premium' ? 500000 : type === 'Local' ? 200000 : 0

  return {
    id: `CUST${idx + 1}`,
    code: `CUST-${(idx + 1).toString().padStart(3, '0')}`,
    name: `Customer ${idx + 1}`,
    type,
    state: states[idx % states.length],
    address: `Customer Street ${idx + 1}, Coconut Market`,
    mobile: `92000${(10000 + idx).toString().slice(-5)}`,
    whatsapp: `92000${(10000 + idx).toString().slice(-5)}`,
    creditLimit: baseLimit,
    status: idx % 11 === 0 ? 'Inactive' : 'Active',
    createdAt: daysFromNow(-rand(10, 365)),
  }
})

/**
 * @description Mock purchase orders.
 */
export const purchaseOrders: PurchaseOrder[] = Array.from({ length: 100 }).map((_, idx) => {
  const supplier = suppliers[idx % suppliers.length]
  const warehouse = warehouses[idx % warehouses.length]
  const lines: PurchaseOrderLine[] = Array.from({ length: rand(1, 4) }).map((__, lidx) => {
    const item = items[(idx + lidx) % items.length]
    const qty = rand(1000, 5000)
    const discount = rand(0, 50)
    const cost = rand(10, 35)
    const amount = qty * cost

    return {
      id: `POL${idx + 1}-${lidx + 1}`,
      itemId: item.id,
      quantity: qty,
      discount,
      purchaseCost: cost,
      amount,
    }
  })

  return {
    id: `PO${idx + 1}`,
    poNumber: `PO-${(idx + 1).toString().padStart(4, '0')}`,
    date: daysFromNow(-rand(1, 120)),
    supplierId: supplier.id,
    warehouseId: warehouse.id,
    remarks: `Auto-generated PO ${idx + 1}`,
    status: idx % 5 === 0 ? 'Draft' : 'Approved',
    lines,
  }
})

/**
 * @description Mock purchase invoices with totalAmount and paidAmount (for outstanding computation).
 */
export const purchaseInvoices: PurchaseInvoice[] = Array.from({ length: 100 }).map((_, idx) => {
  const supplier = suppliers[idx % suppliers.length]
  const warehouse = warehouses[idx % warehouses.length]

  const lines: PurchaseInvoiceLine[] = Array.from({ length: rand(1, 4) }).map((__, lidx) => {
    const item = items[(idx + lidx) % items.length]
    const qty = rand(1000, 6000)
    const discount = rand(0, 50)
    const cost = rand(10, 40)
    const purchaseAmount = qty * cost

    return {
      id: `PIL${idx + 1}-${lidx + 1}`,
      itemId: item.id,
      quantityTons: qty,
      discount,
      purchaseCost: cost,
      purchaseAmount,
    }
  })

  const gunny: PurchaseInvoiceGunny[] = Array.from({ length: rand(1, 2) }).map((__, gidx) => {
    const bag = gunnyBags[(idx + gidx) % gunnyBags.length]
    const quantity = rand(50, 200)
    const rate = bag.defaultRate
    const amount = quantity * rate

    return {
      id: `PIG${idx + 1}-${gidx + 1}`,
      bagTypeId: bag.id,
      quantity,
      rate,
      amount,
    }
  })

  const totalLines = lines.reduce((sum, l) => sum + l.purchaseAmount, 0)
  const totalGunny = gunny.reduce((sum, g) => sum + g.amount, 0)
  const grandTotal = totalLines + totalGunny

  // random paid amount between 0 and grandTotal (mock)
  const paidAmount = rand(0, Math.max(0, Math.floor(grandTotal)))

  return {
    id: `PINV${idx + 1}`,
    supplierId: supplier.id,
    warehouseId: warehouse.id,
    invoiceNo: `PI-${(idx + 1).toString().padStart(4, '0')}`,
    invoiceDate: daysFromNow(-rand(1, 120)),
    lines,
    gunnyBags: gunny,
    grandTotal,
    // friendly fields for UI
    invoiceNumber: `PI-${(idx + 1).toString().padStart(4, '0')}`,
    totalAmount: grandTotal,
    paidAmount,
  }
})

/**
 * @description Mock direct sales.
 */
export const directSales: DirectSales[] = Array.from({ length: 100 }).map((_, idx) => {
  const customer = customers[idx % customers.length]
  const warehouse = warehouses[idx % warehouses.length]

  const lines: DirectSalesLine[] = Array.from({ length: rand(1, 3) }).map((__, lidx) => {
    const item = items[(idx + lidx) % items.length]
    const quantity = rand(1000, 5000)
    const discount = rand(0, 50)
    const salesPrice = rand(20, 60)
    const salesAmount = quantity * salesPrice

    return {
      id: `DSL${idx + 1}-${lidx + 1}`,
      itemId: item.id,
      quantity,
      discount,
      salesPrice,
      salesAmount,
    }
  })

  const charges = {
    gunnyBags: rand(500, 2000),
    transportation: rand(1000, 5000),
    loadingCharges: rand(500, 2500),
  }

  const invoiceTotal = lines.reduce((sum, l) => sum + l.salesAmount, 0) + charges.gunnyBags + charges.transportation + charges.loadingCharges

  return {
    id: `DS${idx + 1}`,
    customerId: customer.id,
    customerType: customer.type,
    warehouseId: warehouse.id,
    invoiceDate: daysFromNow(-rand(1, 120)),
    lines,
    charges,
    invoiceTotal,
  }
})

/**
 * @description Mock indirect sales.
 */
export const indirectSales: IndirectSales[] = Array.from({ length: 50 }).map((_, idx) => {
  const supplier = suppliers[idx % suppliers.length]
  const customer = customers[idx % customers.length]
  const purchaseRate = rand(15, 30)
  const salesRate = purchaseRate + rand(3, 15)
  const quantity = rand(1000, 5000)

  return {
    id: `IS${idx + 1}`,
    supplierId: supplier.id,
    customerId: customer.id,
    purchaseRate,
    salesRate,
    quantity,
    purchaseInvoiceId: purchaseInvoices[idx % purchaseInvoices.length].id,
    salesInvoiceId: directSales[idx % directSales.length].id,
    date: daysFromNow(-rand(1, 90)),
  }
})

/**
 * @description Mock dispatches.
 */
export const dispatches: Dispatch[] = Array.from({ length: 50 }).map((_, idx) => {
  const customer = customers[idx % customers.length]
  const lines: DispatchLine[] = Array.from({ length: rand(1, 3) }).map((__, lidx) => {
    const warehouse = warehouses[(idx + lidx) % warehouses.length]
    const item = items[(idx + lidx) % items.length]
    const bag = gunnyBags[(idx + lidx) % gunnyBags.length]
    const quantity = rand(500, 4000)
    const loaded = rand(0, quantity)
    const pending = quantity - loaded

    return {
      id: `DL${idx + 1}-${lidx + 1}`,
      warehouseId: warehouse.id,
      date: daysFromNow(-rand(0, 30)),
      itemId: item.id,
      bharthi: bag.bharthi,
      gunnyBagId: bag.id,
      quantity,
      loadedQuantity: loaded,
      pendingQuantity: pending,
    }
  })

  const statusIndex = idx % 3
  const dispatchStatus: Dispatch['dispatchStatus'] = statusIndex === 0 ? 'Pending' : statusIndex === 1 ? 'Confirmed' : 'Dispatched'

  return {
    id: `DISP${idx + 1}`,
    dispatchNumber: `DISP-${(idx + 1).toString().padStart(4, '0')}`,
    customerId: customer.id,
    lorryNumber: `KA-01-${(1000 + idx).toString()}`,
    driverName: `Driver ${idx + 1}`,
    driverMobile: `93000${(10000 + idx).toString().slice(-5)}`,
    dispatchStatus,
    lines,
    invoiceGenerated: dispatchStatus === 'Dispatched',
  }
})

/**
 * @description Mock supplier payments.
 */
export const supplierPayments: SupplierPayment[] = Array.from({ length: 50 }).map((_, idx) => {
  const supplier = suppliers[idx % suppliers.length]
  const modes: SupplierPayment['paymentMode'][] = ['Cash', 'Bank', 'UPI']
  const mode = modes[idx % modes.length]

  return {
    id: `SP${idx + 1}`,
    paymentNumber: `PAY-${(idx + 1).toString().padStart(4, '0')}`,
    supplierId: supplier.id,
    date: daysFromNow(-rand(0, 60)),
    paymentMode: mode,
    amount: rand(10000, 150000),
    remarks: `Payment ${idx + 1} via ${mode}`,
  }
})

/**
 * @description Mock labour attendances.
 */
export const labourAttendances: LabourAttendance[] = Array.from({ length: 100 }).map((_, idx) => {
  const type: LabourAttendance['type'] = idx % 3 === 0 ? 'Temporary' : 'Regular'
  const otRate = type === 'Regular' ? 150 : 100
  const otHours = rand(0, 4)
  const totalOtAmount = otHours * otRate

  const shifts: LabourAttendance['shift'][] = ['Morning', 'Evening', 'Night']
  const shift = shifts[idx % shifts.length]

  return {
    id: `LAB${idx + 1}`,
    labourName: `Labour ${idx + 1}`,
    type,
    attendanceDate: daysFromNow(-rand(0, 60)),
    shift,
    inTime: '09:00',
    outTime: '18:00',
    hours: 9,
    otHours,
    otRate,
    totalOtAmount,
  }
})