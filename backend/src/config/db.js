import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'CoconutCocktailDB',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'NewPassword@123',
  connectionString: process.env.DATABASE_URL || undefined,
});

let databaseReady = false;
let usingFallback = false;

const fallbackCustomers = [
  {
    id: 'CUST-1',
    code: 'CUST-001',
    name: 'Apex Traders',
    type: 'Premium',
    state: 'Karnataka',
    address: '12 Market Road, Bangalore',
    mobile: '9000100001',
    whatsapp: '9000100001',
    contactPerson: 'Ramesh',
    contactPerson1: 'Sakthi',
    contactNo1: '9000100101',
    contactPerson2: 'Kumar',
    contactNo2: '9000100201',
    creditLimit: 500000,
    status: 'Active',
    createdAt: '2026-07-01',
  },
  {
    id: 'CUST-2',
    code: 'CUST-002',
    name: 'Local Fresh',
    type: 'Local',
    state: 'Tamil Nadu',
    address: '5 Street Lane, Chennai',
    mobile: '9000100002',
    whatsapp: '9000100002',
    contactPerson: 'Meena',
    contactPerson1: '',
    contactNo1: '',
    contactPerson2: '',
    contactNo2: '',
    creditLimit: 20000,
    status: 'Active',
    createdAt: '2026-07-15',
  },
];

const toCustomer = (row) => ({
  id: row.id,
  code: row.code,
  name: row.name,
  type: row.type,
  state: row.state ?? '',
  address: row.address ?? '',
  mobile: row.mobile ?? '',
  whatsapp: row.whatsapp ?? '',
  contactPerson: row.contact_person ?? '',
  contactPerson1: row.contact_person1 ?? '',
  contactNo1: row.contact_no1 ?? '',
  contactPerson2: row.contact_person2 ?? '',
  contactNo2: row.contact_no2 ?? '',
  creditLimit: Number(row.credit_limit || 0),
  status: row.status,
  createdAt: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '',
});

export const initializeDatabase = async () => {
  try {
    await pool.query('SELECT 1');
    databaseReady = true;
    usingFallback = false;

    const schemaSql = fs.readFileSync(path.resolve(__dirname, '../../../db/customer_master.sql'), 'utf8');
    await pool.query(schemaSql);

    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM customers');
    if (rows[0].count === 0) {
      await pool.query(`
        INSERT INTO customers (id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, credit_limit, status, created_at)
        VALUES
          ('CUST-1', 'CUST-001', 'Apex Traders', 'Premium', 'Karnataka', '12 Market Road, Bangalore', '9000100001', '9000100001', 'Ramesh', 'Sakthi', '9000100101', 'Kumar', '9000100201', 500000, 'Active', CURRENT_DATE - INTERVAL '60 days'),
          ('CUST-2', 'CUST-002', 'Local Fresh', 'Local', 'Tamil Nadu', '5 Street Lane, Chennai', '9000100002', '9000100002', 'Meena', NULL, NULL, NULL, NULL, 20000, 'Active', CURRENT_DATE - INTERVAL '30 days')
      `);
    }

    console.log('Database connection ready.');
  } catch (error) {
    databaseReady = false;
    usingFallback = true;
    console.warn('PostgreSQL is not available, using in-memory fallback data.', error.message);
  }
};

export const listCustomers = async () => {
  if (!databaseReady) {
    return fallbackCustomers;
  }

  const { rows } = await pool.query(`
    SELECT id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, credit_limit, status, created_at
    FROM customers
    ORDER BY created_at DESC, name ASC
  `);

  return rows.map(toCustomer);
};

export const getCustomer = async (id) => {
  if (!databaseReady) {
    return fallbackCustomers.find((item) => item.id === id);
  }

  const { rows } = await pool.query(
    `
      SELECT id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, credit_limit, status, created_at
      FROM customers
      WHERE id = $1
    `,
    [id],
  );

  return rows[0] ? toCustomer(rows[0]) : undefined;
};

export const createCustomer = async (payload) => {
  const newId = payload.id || `CUST-${Date.now()}`;

  if (!databaseReady) {
    const record = {
      id: newId,
      ...payload,
      creditLimit: Number(payload.creditLimit || 0),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    fallbackCustomers.unshift(record);
    return record;
  }

  const { rows } = await pool.query(
    `
      INSERT INTO customers (id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, credit_limit, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, CURRENT_DATE)
      RETURNING id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, credit_limit, status, created_at
    `,
    [
      newId,
      payload.code,
      payload.name,
      payload.type,
      payload.state ?? '',
      payload.address ?? '',
      payload.mobile ?? '',
      payload.whatsapp ?? '',
      payload.contactPerson ?? '',
      payload.contactPerson1 ?? '',
      payload.contactNo1 ?? '',
      payload.contactPerson2 ?? '',
      payload.contactNo2 ?? '',
      Number(payload.creditLimit || 0),
      payload.status ?? 'Active',
    ],
  );

  return toCustomer(rows[0]);
};

export const updateCustomer = async (id, payload) => {
  if (!databaseReady) {
    const index = fallbackCustomers.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }

    const merged = { ...fallbackCustomers[index], ...payload, creditLimit: Number(payload.creditLimit ?? fallbackCustomers[index].creditLimit) };
    fallbackCustomers[index] = merged;
    return merged;
  }

  const { rows } = await pool.query(
    `
      UPDATE customers
      SET code = COALESCE($2, code),
          name = COALESCE($3, name),
          type = COALESCE($4, type),
          state = COALESCE($5, state),
          address = COALESCE($6, address),
          mobile = COALESCE($7, mobile),
          whatsapp = COALESCE($8, whatsapp),
          contact_person = COALESCE($9, contact_person),
          contact_person1 = COALESCE($10, contact_person1),
          contact_no1 = COALESCE($11, contact_no1),
          contact_person2 = COALESCE($12, contact_person2),
          contact_no2 = COALESCE($13, contact_no2),
          credit_limit = COALESCE($14, credit_limit),
          status = COALESCE($15, status)
      WHERE id = $1
      RETURNING id, code, name, type, state, address, mobile, whatsapp, contact_person, contact_person1, contact_no1, contact_person2, contact_no2, credit_limit, status, created_at
    `,
    [
      id,
      payload.code,
      payload.name,
      payload.type,
      payload.state,
      payload.address,
      payload.mobile,
      payload.whatsapp,
      payload.contactPerson,
      payload.contactPerson1,
      payload.contactNo1,
      payload.contactPerson2,
      payload.contactNo2,
      payload.creditLimit,
      payload.status,
    ],
  );

  if (!rows[0]) {
    throw new Error('Customer not found');
  }

  return toCustomer(rows[0]);
};

export const deleteCustomer = async (id) => {
  if (!databaseReady) {
    const index = fallbackCustomers.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Customer not found');
    }
    fallbackCustomers.splice(index, 1);
    return;
  }

  const result = await pool.query('DELETE FROM customers WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw new Error('Customer not found');
  }
};
