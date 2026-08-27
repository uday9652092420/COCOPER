import { pool } from '../../config/db.js'

type SalePayload = {
  id?: string
  directSaleNo?: string
  organizationId?: string
  customerId: string
  branchId: string
  invoiceDate: string
  mode?: string
  invoiceTotal?: number
  lines?: Array<{ id?: string; itemId: string; quantity: number; discount: number; actualQuantity?: number; salesPrice: number; salesAmount: number }>
  gunnyBags?: Array<{ bagTypeId: string; bharthiTypeId?: string; quantity: number; rate: number; amount: number }>
}

function parseDate(value: string): string {
  const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(value ?? '')
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value
}

export async function listDirectSales(organizationId?: string) {
  const result = await pool.query(
    `SELECT id, invoice_no AS "directSaleNo", organization_id AS "organizationId",
            branch_id AS "branchId", customer_id AS "customerId", sale_date AS "invoiceDate",
            total_amount AS "invoiceTotal", status, mode
       FROM direct_sales
      WHERE ($1::uuid IS NULL OR organization_id = $1::uuid)
      ORDER BY sale_date DESC, created_at DESC`,
    [organizationId || null]
  )
  return result.rows
}

export async function approveDirectSale(id: string, organizationId?: string | null) {
  const result = await pool.query(
    `UPDATE direct_sales
        SET status = 'Posted'
      WHERE id = $1
        AND ($2::uuid IS NULL OR organization_id = $2::uuid)
      RETURNING id, invoice_no AS "directSaleNo", organization_id AS "organizationId",
                branch_id AS "branchId", customer_id AS "customerId", sale_date AS "invoiceDate",
                total_amount AS "invoiceTotal", status, mode`,
    [id, organizationId || null]
  )
  if (!result.rows[0]) throw new Error('Direct sale not found')
  return result.rows[0]
}

export async function deleteDirectSale(id: string, organizationId?: string | null) {
  const result = await pool.query(
    `DELETE FROM direct_sales
      WHERE id = $1
        AND ($2::uuid IS NULL OR organization_id = $2::uuid)`,
    [id, organizationId || null]
  )
  if (result.rowCount === 0) throw new Error('Direct sale not found')
}

export async function createDirectSale(payload: SalePayload) {
  if (!payload.organizationId || !payload.branchId) throw new Error('Organization and branch are required')
  if (!payload.customerId || !payload.lines?.length) throw new Error('Customer and at least one item line are required')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const id = payload.id || `DS-${Date.now()}`
    const invoiceNo = payload.directSaleNo || id
    await client.query(
      `INSERT INTO direct_sales (id, invoice_no, organization_id, branch_id, customer_id, sale_date, total_amount, status, mode)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'Posted',$8)`,
      [id, invoiceNo, payload.organizationId, payload.branchId, payload.customerId, parseDate(payload.invoiceDate), payload.invoiceTotal ?? 0, payload.mode ?? 'tonage']
    )

    for (const [index, line] of payload.lines.entries()) {
      const actualQuantity = Number(line.actualQuantity ?? 0)
      if (!line.itemId || actualQuantity <= 0) throw new Error('Each sale line must have a valid actual quantity')
      const item = await client.query(
        `SELECT id, code FROM items WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL) FOR UPDATE`,
        [line.itemId, payload.organizationId]
      )
      if (!item.rows[0]) throw new Error(`Item not found: ${line.itemId}`)

      const branchStock = await client.query(
        `SELECT stock FROM item_branch_stock WHERE organization_id = $1 AND item_id = $2 AND branch_id = $3 FOR UPDATE`,
        [payload.organizationId, line.itemId, payload.branchId]
      )
      if (!branchStock.rows[0] || Number(branchStock.rows[0].stock) < actualQuantity) {
        throw new Error(`Insufficient branch stock for item ${item.rows[0].code}`)
      }
      await client.query(
        `UPDATE item_branch_stock SET stock = stock - $1, updated_at = NOW()
         WHERE organization_id = $2 AND item_id = $3 AND branch_id = $4`,
        [actualQuantity, payload.organizationId, line.itemId, payload.branchId]
      )
      const itemStockUpdate = await client.query(
        `UPDATE items SET branch_wise_stock = branch_wise_stock - $1
         WHERE id = $2 AND branch_wise_stock >= $1`,
        [actualQuantity, line.itemId]
      )
      if (itemStockUpdate.rowCount !== 1) throw new Error(`Insufficient total stock for item ${item.rows[0].code}`)
      await client.query(
        `INSERT INTO direct_sale_items (id, direct_sale_id, item_id, qty, discount, actual_quantity, rate, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [line.id || `DSL-${Date.now()}-${index}`, id, line.itemId, line.quantity, line.discount, actualQuantity, line.salesPrice, line.salesAmount]
      )
    }

    for (const [index, bag] of (payload.gunnyBags ?? []).entries()) {
      if (!bag.bagTypeId || Number(bag.quantity) <= 0) continue
      await client.query(
        `INSERT INTO direct_sale_gunny_bags (id, direct_sale_id, gunny_bag_id, bharthi_type_id, quantity, rate, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [`DSGB-${Date.now()}-${index}`, id, bag.bagTypeId, bag.bharthiTypeId || null, bag.quantity, bag.rate, bag.amount]
      )
    }
    await client.query('COMMIT')
    return payload
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}