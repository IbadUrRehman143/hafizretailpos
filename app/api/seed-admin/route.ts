// @ts-nocheck
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
  let client;
  try {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
      return NextResponse.json(
        { success: false, error: 'DATABASE_URL .env file mein nahi mila!' },
        { status: 500 }
      );
    }

    const { Client } = await import('pg');
    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // 1. Fetch exact table names
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    const branchTable = tables.find(t => t.toLowerCase() === 'branch' || t.toLowerCase() === 'branches');
    const roleTable = tables.find(t => t.toLowerCase() === 'role' || t.toLowerCase() === 'roles');
    const userTable = tables.find(t => t.toLowerCase() === 'appuser' || t.toLowerCase() === 'app_user' || t.toLowerCase() === 'users' || t.toLowerCase() === 'user');

    if (!branchTable || !roleTable || !userTable) {
      return NextResponse.json({
        success: false,
        error: `Database tables match nahi hoi. Available tables: ${tables.join(', ')}`,
      }, { status: 500 });
    }

    // Helper: get column names and types
    const getTableColumns = async (tableName) => {
      const res = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tableName]);
      return res.rows;
    };

    const userCols = await getTableColumns(userTable);
    const userColMap = new Set(userCols.map(c => c.column_name));

    const branchCols = await getTableColumns(branchTable);
    const branchColMap = new Set(branchCols.map(c => c.column_name));
    const branchIdType = branchCols.find(c => c.column_name === 'id')?.data_type;

    const roleCols = await getTableColumns(roleTable);
    const roleColMap = new Set(roleCols.map(c => c.column_name));
    const roleIdType = roleCols.find(c => c.column_name === 'id')?.data_type;

    const userIdType = userCols.find(c => c.column_name === 'id')?.data_type;

    // Detect column names dynamically
    const passwordCol = [...userColMap].find(c => 
      ['password', 'passwordhash', 'password_hash', 'pass'].includes(c.toLowerCase())
    ) || 'password';

    const activeCol = [...userColMap].find(c => 
      ['isactive', 'active', 'status', 'is_active'].includes(c.toLowerCase())
    );

    // 2. Branch Check / Insert
    let branchRes = await client.query(`SELECT id FROM "${branchTable}" LIMIT 1`);
    let branchId = branchRes.rows[0]?.id;

    if (!branchId) {
      const bFields = ['"name"', '"code"'];
      const bVals = ["'Main Branch'", "'MAIN01'"];

      if (branchColMap.has('createdAt')) { bFields.push('"createdAt"'); bVals.push('NOW()'); }
      if (branchColMap.has('updatedAt')) { bFields.push('"updatedAt"'); bVals.push('NOW()'); }

      if (branchIdType !== 'integer' && branchIdType !== 'bigint') {
        bFields.unshift('"id"');
        bVals.unshift("'br_main_01'");
      }

      const newBranch = await client.query(
        `INSERT INTO "${branchTable}" (${bFields.join(', ')}) VALUES (${bVals.join(', ')}) RETURNING id`
      );
      branchId = newBranch.rows[0].id;
    }

    // 3. Role Check / Insert
    let roleRes = await client.query(`SELECT id FROM "${roleTable}" WHERE "name" = 'SUPER_ADMIN' LIMIT 1`);
    let roleId = roleRes.rows[0]?.id;

    if (!roleId) {
      const rFields = ['"name"'];
      const rVals = ["'SUPER_ADMIN'"];

      if (roleColMap.has('description')) { rFields.push('"description"'); rVals.push("'Super Admin Access'"); }
      if (roleColMap.has('createdAt')) { rFields.push('"createdAt"'); rVals.push('NOW()'); }
      if (roleColMap.has('updatedAt')) { rFields.push('"updatedAt"'); rVals.push('NOW()'); }

      if (roleIdType !== 'integer' && roleIdType !== 'bigint') {
        rFields.unshift('"id"');
        rVals.unshift("'role_super_admin'");
      }

      const newRole = await client.query(
        `INSERT INTO "${roleTable}" (${rFields.join(', ')}) VALUES (${rVals.join(', ')}) RETURNING id`
      );
      roleId = newRole.rows[0].id;
    }

    // 4. Admin User Insert / Upsert
    const hashedPassword = await bcrypt.hash('12345678', 10);

    const userColsToInsert = [];
    const userValsToInsert = [];
    const params = [hashedPassword, roleId, branchId];
    let paramIndex = 4;

    if (userIdType !== 'integer' && userIdType !== 'bigint') {
      userColsToInsert.push('"id"');
      userValsToInsert.push("'user_super_admin'");
    }

    userColsToInsert.push('"name"', '"email"', `"${passwordCol}"`, '"roleId"', '"branchId"');
    userValsToInsert.push("'Ibad Khan'", "'ibadurrehman010@gmail.com'", '$1', '$2', '$3');

    if (activeCol) {
      userColsToInsert.push(`"${activeCol}"`);
      userValsToInsert.push(userCols.find(c => c.column_name === activeCol)?.data_type === 'boolean' ? 'true' : "'ACTIVE'");
    }

    if (userColMap.has('createdAt')) {
      userColsToInsert.push('"createdAt"');
      userValsToInsert.push('NOW()');
    }
    if (userColMap.has('updatedAt')) {
      userColsToInsert.push('"updatedAt"');
      userValsToInsert.push('NOW()');
    }

    let updateClause = `"${passwordCol}" = $1`;
    if (userColMap.has('updatedAt')) {
      updateClause += `, "updatedAt" = NOW()`;
    }

    await client.query(
      `INSERT INTO "${userTable}" (${userColsToInsert.join(', ')})
       VALUES (${userValsToInsert.join(', ')})
       ON CONFLICT ("email") DO UPDATE SET ${updateClause}`,
      params
    );

    await client.end();

    return NextResponse.json({
      success: true,
      message: 'Super Admin successfully created/updated!',
      detectedPasswordColumn: passwordCol,
      user: 'ibadurrehman010@gmail.com',
    });
  } catch (error: any) {
    if (client) await client.end();
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}