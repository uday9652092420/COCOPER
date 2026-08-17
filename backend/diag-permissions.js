const { Client } = require('pg');

async function main() {
  const c = new Client({
    host: 'localhost',
    port: 5432,
    database: 'CoconutCocktailDB',
    user: 'postgres',
    password: 'NewPassword@123',
  });
  await c.connect();

  const cols = await c.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'user_permissions'
     ORDER BY ordinal_position`
  );
  console.log('USER_PERMISSIONS COLS:', JSON.stringify(cols.rows, null, 2));

  const ou = await c.query(
    `SELECT column_name, data_type
     FROM information_schema.columns
     WHERE table_name = 'organization_users'
     ORDER BY ordinal_position`
  );
  console.log('ORG_USERS COLS:', JSON.stringify(ou.rows, null, 2));

  const up = await c.query('SELECT * FROM user_permissions LIMIT 20');
  console.log('USER_PERMISSIONS ROWS:', JSON.stringify(up.rows, null, 2));

  const users = await c.query(
    'SELECT id, username, role, organization_id FROM organization_users ORDER BY created_at DESC LIMIT 10'
  );
  console.log('USERS:', JSON.stringify(users.rows, null, 2));

  await c.end();
}

main().catch((e) => {
  console.error('ERR', e.message);
  process.exit(1);
});
