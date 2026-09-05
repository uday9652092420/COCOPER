import { pool } from '../../config/db.js'

type SalePayload = {
  id?: string
  directSaleNo?: string
  salesOrderNo?: string
  organizationId?: string
  customerId: string
  branchId: string
  invoiceDate: string
  mode?: string
  invoiceTotal?: number
  charges?: { gunnyBags?: number; transportation?: number; loadingCharges?: number }
  lines?: Array<{ id?: string; itemId: string; quantity: number; discount: number; actualQuantity?: number; salesPrice: number; salesAmount: number }>
  gunnyBags?: Array<{ bagTypeId: string; bagBharthi?: string; bharthiTypeId?: string; quantity: number; rate: number; amount: number }>
}

export async function listDirectSales(organizationId?: string | null) {
  const params: string[] = []
  const where = organizationId
    ? (params.push(organizationId), 'WHERE ds.organization_id = $1')
    : ''
  const { rows } = await pool.query(
    `SELECT
       ds.id,
      ds.invoice_no,
       CASE
         WHEN ds.invoice_no ~ '^DS-[0-9]{10,}$' THEN CONCAT(
           UPPER(LEFT(COALESCE(NULLIF(TRIM(o.organization_name), ''), 'M'), 1)),
           'SO-',
           LPAD(ROW_NUMBER() OVER (
             PARTITION BY ds.organization_id
             ORDER BY ds.created_at, ds.id
           )::text, 2, '0')
         )
         ELSE ds.invoice_no
       END AS "directSaleNo",
       ds.sales_order_no AS "salesOrderNo",
       ds.organization_id AS "organizationId",
       ds.branch_id AS "branchId",
       ds.customer_id AS "customerId",
      TO_CHAR(ds.created_at, 'YYYY-MM-DD HH24:MI:SS') AS "createdAt",
      c.type AS "customerType",
      TO_CHAR(ds.sale_date, 'YYYY-MM-DD') AS "invoiceDate",
       ds.total_amount AS "invoiceTotal",
       ds.customer_receipt_status AS "customerReceiptStatus",
      ds.approved,
       json_build_object(
         'gunnyBags', ds.gunny_bags_total,
         'transportation', ds.transportation_charges,
         'loadingCharges', ds.loading_charges
       ) AS charges,
       ds.mode,
       COALESCE(SUM(dsi.qty), 0) AS quantity,
       COALESCE(
         json_agg(
           json_build_object(
             'id', dsi.id,
             'itemId', dsi.item_id,
             'quantity', dsi.qty,
             'discount', dsi.discount,
             'actualQuantity', dsi.actual_quantity,
             'salesPrice', dsi.rate,
             'salesAmount', dsi.amount
           ) ORDER BY dsi.created_at
         ) FILTER (WHERE dsi.id IS NOT NULL),
         '[]'
       ) AS lines
       , COALESCE(
         (SELECT json_agg(json_build_object(
           'bagTypeId', dsgb.gunny_bag_id,
           'bagBharthi', dsgb.bag_bharthi,
           'bharthiTypeId', dsgb.bharthi_type_id,
           'quantity', dsgb.quantity,
           'rate', dsgb.rate,
           'amount', dsgb.amount
         ) ORDER BY dsgb.id) FROM direct_sale_gunny_bags dsgb WHERE dsgb.direct_sale_id = ds.id),
         '[]'
       ) AS "gunnyBags"
     FROM direct_sales ds
    LEFT JOIN customers c ON c.id = ds.customer_id
    LEFT JOIN organizations o ON o.id = ds.organization_id
     LEFT JOIN direct_sale_items dsi ON dsi.direct_sale_id = ds.id
     ${where}
    GROUP BY ds.id, c.type, o.organization_name
    ORDER BY ds.created_at DESC, ds.id DESC, ds.sale_date DESC`,
    params
  )
  return rows
}

function parseDate(value: string): string {
  const match = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/.exec(value ?? '')
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value
}

export async function createDirectSale(payload: SalePayload) {
  if (!payload.organizationId || !payload.branchId) throw new Error('Organization and branch are required')
  if (!payload.customerId || !payload.lines?.length) throw new Error('Customer and at least one item line are required')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const id = payload.id || `DS-${Date.now()}`
    const requestedInvoiceNo =
      payload.directSaleNo && !/^DS-[0-9]{10,}$/.test(payload.directSaleNo)
        ? payload.directSaleNo
        : null
    const invoiceMatch = /^([A-Za-z]+-)(\d+)$/.exec(requestedInvoiceNo ?? '')
    let invoiceNo = requestedInvoiceNo
    if (!invoiceNo) {
      const prefixResult = await client.query(
        `SELECT CONCAT(
           UPPER(LEFT(COALESCE(NULLIF(TRIM(organization_name), ''), 'M'), 1)),
           'SO-'
         ) AS prefix
         FROM organizations
         WHERE id = $1`,
        [payload.organizationId]
      )
      const prefix = prefixResult.rows[0]?.prefix ?? 'SO-'
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [prefix])
      const existingInvoices = await client.query(
        'SELECT invoice_no FROM direct_sales WHERE invoice_no LIKE $1',
        [`${prefix}%`]
      )
      const usedNumbers = existingInvoices.rows
        .map((row) => new RegExp(`^${prefix.replace('-', '\\-')}(\\d+)$`).exec(row.invoice_no)?.[1])
        .map(Number)
        .filter(Number.isFinite)
      let nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : 1
      invoiceNo = `${prefix}${String(nextNumber).padStart(2, '0')}`
      while (existingInvoices.rows.some((row) => row.invoice_no === invoiceNo)) {
        nextNumber += 1
        invoiceNo = `${prefix}${String(nextNumber).padStart(2, '0')}`
      }
    }
    if (invoiceMatch) {
      const prefix = invoiceMatch[1]
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [prefix])
      const existingInvoices = await client.query(
        'SELECT invoice_no FROM direct_sales WHERE invoice_no LIKE $1',
        [`${prefix}%`]
      )
      const usedNumbers = existingInvoices.rows
        .map((row) => new RegExp(`^${prefix.replace('-', '\\-')}(\\d+)$`).exec(row.invoice_no)?.[1])
        .map(Number)
        .filter(Number.isFinite)
      let nextNumber = usedNumbers.length ? Math.max(...usedNumbers) + 1 : Number(invoiceMatch[2])
      invoiceNo = `${prefix}${String(nextNumber).padStart(invoiceMatch[2].length, '0')}`
      while (existingInvoices.rows.some((row) => row.invoice_no === invoiceNo)) {
        nextNumber += 1
        invoiceNo = `${prefix}${String(nextNumber).padStart(invoiceMatch[2].length, '0')}`
      }
    }
    await client.query(
      `INSERT INTO direct_sales (id, invoice_no, sales_order_no, organization_id, branch_id, customer_id, sale_date, total_amount, gunny_bags_total, transportation_charges, loading_charges, status, mode, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Posted',$12,CURRENT_TIMESTAMP)`,
      [id, invoiceNo, payload.salesOrderNo || null, payload.organizationId, payload.branchId, payload.customerId, parseDate(payload.invoiceDate), payload.invoiceTotal ?? 0, payload.charges?.gunnyBags ?? 0, payload.charges?.transportation ?? 0, payload.charges?.loadingCharges ?? 0, payload.mode ?? 'tonage']
    )

    for (const [index, line] of payload.lines.entries()) {
      const stockQuantity = Number(line.quantity) || 0
      const actualQuantity = Number(line.actualQuantity ?? 0)
      if (!line.itemId || stockQuantity <= 0) throw new Error('Each sale line must have a valid quantity')
      const item = await client.query(
        `SELECT id, code FROM items WHERE id = $1 AND (organization_id = $2 OR organization_id IS NULL) FOR UPDATE`,
        [line.itemId, payload.organizationId]
      )
      if (!item.rows[0]) throw new Error(`Item not found: ${line.itemId}`)

      if (!payload.salesOrderNo) {
        const branchStock = await client.query(
          `SELECT stock FROM item_branch_stock WHERE organization_id = $1 AND item_id = $2 AND branch_id = $3 FOR UPDATE`,
          [payload.organizationId, line.itemId, payload.branchId]
        )
        if (!branchStock.rows[0] || Number(branchStock.rows[0].stock) < stockQuantity) {
          throw new Error(`Insufficient branch stock for item ${item.rows[0].code}`)
        }
        await client.query(
          `UPDATE item_branch_stock SET stock = stock - $1, updated_at = NOW()
           WHERE organization_id = $2 AND item_id = $3 AND branch_id = $4`,
          [stockQuantity, payload.organizationId, line.itemId, payload.branchId]
        )
        const itemStockUpdate = await client.query(
          `UPDATE items SET branch_wise_stock = branch_wise_stock - $1
           WHERE id = $2 AND branch_wise_stock >= $1`,
          [stockQuantity, line.itemId]
        )
        if (itemStockUpdate.rowCount !== 1) throw new Error(`Insufficient total stock for item ${item.rows[0].code}`)
      }
      await client.query(
        `INSERT INTO direct_sale_items (id, direct_sale_id, item_id, qty, discount, actual_quantity, rate, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [line.id || `DSL-${Date.now()}-${index}`, id, line.itemId, line.quantity, line.discount, actualQuantity, line.salesPrice, line.salesAmount]
      )
    }

    if (payload.salesOrderNo) {
      await client.query(
        `UPDATE sales_orders
         SET sales_invoice_status = TRUE
         WHERE so_number = $1 AND (organization_id = $2 OR organization_id IS NULL)`,
        [payload.salesOrderNo, payload.organizationId]
      )
    }

    for (const [index, bag] of (payload.gunnyBags ?? []).entries()) {
      if (!bag.bagTypeId || Number(bag.quantity) <= 0) continue
      if (!payload.salesOrderNo) {
        const bagQuantity = Number(bag.quantity)
        const bagStock = await client.query(
          `SELECT gb.id, gb.code, gb.branch_id, gb.opening_stock,
                  gbbs.stock AS branch_stock
           FROM gunny_bags gb
           LEFT JOIN gunny_bag_branch_stock gbbs
             ON gbbs.gunny_bag_id = gb.id
            AND gbbs.branch_id = $3
           WHERE gb.id = $1
             AND gb.organization_id = $2
             AND COALESCE(gbbs.stock,
                          CASE WHEN gb.branch_id = $3 THEN gb.opening_stock END,
                          0) >= $4
           FOR UPDATE OF gb`,
          [bag.bagTypeId, payload.organizationId, payload.branchId, bagQuantity]
        )
        if (!bagStock.rows[0]) {
          const bagDetails = await client.query(
            `SELECT code FROM gunny_bags WHERE id = $1 AND organization_id = $2`,
            [bag.bagTypeId, payload.organizationId]
          )
          const bagLabel = bagDetails.rows[0]?.code ?? bag.bagTypeId
          throw new Error(`Insufficient gunny bag stock for ${bagLabel}`)
        }

        if (bag.bharthiTypeId) {
          const bharthiStock = await client.query(
            `SELECT id
             FROM gunny_bag_bharthi_types
             WHERE id = $1 AND gunny_bag_id = $2 AND stock >= $3
             FOR UPDATE`,
            [bag.bharthiTypeId, bag.bagTypeId, bagQuantity]
          )
          if (!bharthiStock.rows[0]) throw new Error(`Insufficient bharthi stock for ${bag.bharthiTypeId}`)
          await client.query(
            `UPDATE gunny_bag_bharthi_types SET stock = stock - $1 WHERE id = $2`,
            [bagQuantity, bag.bharthiTypeId]
          )
        }

        if (bagStock.rows[0].branch_stock !== null) {
          await client.query(
            `UPDATE gunny_bag_branch_stock
             SET stock = stock - $1, updated_at = NOW()
             WHERE gunny_bag_id = $2 AND organization_id = $3 AND branch_id = $4`,
            [bagQuantity, bag.bagTypeId, payload.organizationId, payload.branchId]
          )
        } else {
          await client.query(
            `UPDATE gunny_bags SET opening_stock = opening_stock - $1
             WHERE id = $2 AND organization_id = $3 AND branch_id = $4`,
            [bagQuantity, bag.bagTypeId, payload.organizationId, payload.branchId]
          )
        }
      }
      await client.query(
        `INSERT INTO direct_sale_gunny_bags (id, direct_sale_id, gunny_bag_id, bag_bharthi, bharthi_type_id, quantity, rate, amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [`DSGB-${Date.now()}-${index}`, id, bag.bagTypeId, bag.bagBharthi ?? null, bag.bharthiTypeId || null, bag.quantity, bag.rate, bag.amount]
      )
    }
    await client.query('COMMIT')
    return { ...payload, directSaleNo: invoiceNo, approved: false }
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function approveDirectSale(id: string, organizationId?: string | null) {
  const result = await pool.query(
    `UPDATE direct_sales
     SET approved = TRUE
     WHERE id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
     RETURNING id`,
    [id, organizationId ?? null]
  )
  if (!result.rowCount) throw new Error('Direct sale not found')
  return { approved: true }
}

export async function deleteDirectSale(id: string, organizationId?: string | null) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const saleResult = await client.query(
      `SELECT sales_order_no AS "salesOrderNo", branch_id AS "branchId", approved
       FROM direct_sales
       WHERE id = $1 AND ($2::uuid IS NULL OR organization_id = $2)
       FOR UPDATE`,
      [id, organizationId ?? null]
    )
    const sale = saleResult.rows[0]
    if (!sale) throw new Error('Direct sale not found')
    if (sale.approved) throw new Error('Approved direct sales cannot be deleted')

    if (!sale.salesOrderNo) {
      const itemLines = await client.query(
        'SELECT item_id AS "itemId", qty FROM direct_sale_items WHERE direct_sale_id = $1',
        [id]
      )
      for (const line of itemLines.rows) {
        await client.query(
          `UPDATE item_branch_stock
           SET stock = stock + $1, updated_at = NOW()
           WHERE organization_id = $2 AND item_id = $3 AND branch_id = $4`,
          [Number(line.qty) || 0, organizationId, line.itemId, sale.branchId]
        )
        await client.query(
          `UPDATE items SET branch_wise_stock = COALESCE(branch_wise_stock, 0) + $1
           WHERE id = $2 AND (organization_id = $3 OR organization_id IS NULL)`,
          [Number(line.qty) || 0, line.itemId, organizationId]
        )
      }

      const bagLines = await client.query(
        'SELECT gunny_bag_id AS "bagTypeId", bharthi_type_id AS "bharthiTypeId", quantity FROM direct_sale_gunny_bags WHERE direct_sale_id = $1',
        [id]
      )
      for (const bag of bagLines.rows) {
        const quantity = Number(bag.quantity) || 0
        await client.query(
          `UPDATE gunny_bags SET opening_stock = opening_stock + $1
           WHERE id = $2 AND organization_id = $3 AND branch_id = $4`,
          [quantity, bag.bagTypeId, organizationId, sale.branchId]
        )
        if (bag.bharthiTypeId) {
          await client.query(
            'UPDATE gunny_bag_bharthi_types SET stock = stock + $1 WHERE id = $2 AND gunny_bag_id = $3',
            [quantity, bag.bharthiTypeId, bag.bagTypeId]
          )
        }
      }
    }

    await client.query('DELETE FROM direct_sales WHERE id = $1', [id])
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}