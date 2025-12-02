const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password:
    process.env.DB_PASSWORD !== undefined && process.env.DB_PASSWORD !== ''
      ? process.env.DB_PASSWORD
      : '',
  database: process.env.DB_NAME || 'sangsawang_furniture'
};

const DATE_PATTERNS = [
  { regex: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$', format: '%Y-%m-%d' },
  { regex: '^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?$', format: '%Y-%m-%d %H:%i:%s' },
  { regex: '^[0-9]{4}/[0-9]{2}/[0-9]{2}$', format: '%Y/%m/%d' },
  { regex: '^[0-9]{4}/[0-9]{2}/[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?$', format: '%Y/%m/%d %H:%i:%s' },
  { regex: '^[0-9]{2}/[0-9]{2}/[0-9]{4}$', format: '%d/%m/%Y' },
  { regex: '^[0-9]{2}/[0-9]{2}/[0-9]{4}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?$', format: '%d/%m/%Y %H:%i:%s' },
  { regex: '^[0-9]{2}-[0-9]{2}-[0-9]{4}$', format: '%d-%m-%Y' },
  { regex: '^[0-9]{2}-[0-9]{2}-[0-9]{4}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2})?$', format: '%d-%m-%Y %H:%i:%s' }
];

const columnDefinitions = [
  // Admin timestamps
  {
    table: 'admin',
    column: 'created_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    convert: 'date'
  },
  {
    table: 'admin',
    column: 'updated_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    extra: 'ON UPDATE CURRENT_TIMESTAMP',
    convert: 'date'
  },
  // Cart item timestamps
  {
    table: 'cart_item',
    column: 'created_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    convert: 'date'
  },
  {
    table: 'cart_item',
    column: 'updated_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    extra: 'ON UPDATE CURRENT_TIMESTAMP',
    convert: 'date'
  },
  // Customer timestamps + verification expiry
  {
    table: 'customer',
    column: 'created_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    convert: 'date'
  },
  {
    table: 'customer',
    column: 'updated_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    extra: 'ON UPDATE CURRENT_TIMESTAMP',
    convert: 'date'
  },
  {
    table: 'customer',
    column: 'email_verification_expires',
    type: 'DATETIME',
    allowNull: true,
    defaultValue: null,
    convert: 'date'
  },
  // Orders
  {
    table: 'order',
    column: 'order_date',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    convert: 'date'
  },
  {
    table: 'order',
    column: 'total_amount',
    type: 'DECIMAL(12,2)',
    allowNull: false,
    defaultValue: '0.00',
    convert: 'numeric',
    fallbackValue: '0.00'
  },
  {
    table: 'order',
    column: 'monthly_payment',
    type: 'DECIMAL(12,2)',
    allowNull: false,
    defaultValue: '0.00',
    convert: 'numeric',
    fallbackValue: '0.00'
  },
  {
    table: 'order',
    column: 'installment_periods',
    type: 'INT',
    allowNull: false,
    defaultValue: 1,
    convert: 'integer',
    fallbackValue: 1
  },
  // Installment payments
  {
    table: 'installment_payments',
    column: 'payment_due_date',
    type: 'DATE',
    allowNull: false,
    defaultValue: null,
    convert: 'date',
    dateOnly: true
  },
  {
    table: 'installment_payments',
    column: 'payment_date',
    type: 'DATE',
    allowNull: true,
    defaultValue: null,
    convert: 'date',
    dateOnly: true
  },
  {
    table: 'installment_payments',
    column: 'installment_amount',
    type: 'DECIMAL(12,2)',
    allowNull: false,
    defaultValue: '0.00',
    convert: 'numeric',
    fallbackValue: '0.00'
  },
  // Order detail price
  {
    table: 'order_detail',
    column: 'price',
    type: 'DECIMAL(12,2)',
    allowNull: false,
    defaultValue: '0.00',
    convert: 'numeric',
    fallbackValue: '0.00'
  },
  // Product timestamps
  {
    table: 'product',
    column: 'created_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    convert: 'date'
  },
  {
    table: 'product',
    column: 'updated_at',
    type: 'DATETIME',
    allowNull: false,
    defaultValue: 'CURRENT_TIMESTAMP',
    extra: 'ON UPDATE CURRENT_TIMESTAMP',
    convert: 'date'
  }
];

const wrapId = (value) => `\`${value}\``;

const buildColumnDefinition = (def) => {
  const nullClause = def.allowNull ? 'NULL' : 'NOT NULL';
  let defaultClause = '';
  if (def.defaultValue !== undefined) {
    if (def.defaultValue === null) {
      defaultClause = 'DEFAULT NULL';
    } else if (def.defaultValue === 'CURRENT_TIMESTAMP') {
      defaultClause = 'DEFAULT CURRENT_TIMESTAMP';
    } else {
      defaultClause = `DEFAULT '${def.defaultValue}'`;
    }
  }
  const extraClause = def.extra ? ` ${def.extra}` : '';
  return `${def.type} ${nullClause}${defaultClause ? ` ${defaultClause}` : ''}${extraClause}`;
};

const normalizeDateColumn = async (connection, def) => {
  const table = wrapId(def.table);
  const column = wrapId(def.column);
  const targetFormat = def.dateOnly ? '%Y-%m-%d' : '%Y-%m-%d %H:%i:%s';

  await connection.execute(
    `UPDATE ${table}
     SET ${column} = NULL
     WHERE ${column} IS NOT NULL
       AND TRIM(${column}) IN ('', '0000-00-00', '0000-00-00 00:00:00', 'null', 'NULL')`
  );

  for (const pattern of DATE_PATTERNS) {
    await connection.execute(
      `UPDATE ${table}
       SET ${column} = DATE_FORMAT(STR_TO_DATE(${column}, ?), ?)
       WHERE ${column} IS NOT NULL
         AND ${column} REGEXP ?
         AND STR_TO_DATE(${column}, ?) IS NOT NULL`,
      [pattern.format, targetFormat, pattern.regex, pattern.format]
    );
  }
};

const normalizeNumericColumn = async (connection, def) => {
  const table = wrapId(def.table);
  const column = wrapId(def.column);
  const fallback =
    def.fallbackValue !== undefined
      ? def.fallbackValue
      : def.defaultValue !== undefined && def.defaultValue !== 'CURRENT_TIMESTAMP'
      ? def.defaultValue
      : 0;

  await connection.execute(
    `UPDATE ${table}
     SET ${column} = REPLACE(${column}, ',', '')
     WHERE ${column} IS NOT NULL
       AND ${column} REGEXP ','`
  );

  await connection.execute(
    `UPDATE ${table}
     SET ${column} = ?
     WHERE ${column} IS NULL
        OR TRIM(CAST(${column} AS CHAR)) IN ('', '-', 'null', 'NULL', 'N/A')`,
    [fallback]
  );
};

const normalizeIntegerColumn = async (connection, def) => {
  const table = wrapId(def.table);
  const column = wrapId(def.column);
  const fallback =
    def.fallbackValue !== undefined
      ? def.fallbackValue
      : Number.isInteger(def.defaultValue)
      ? def.defaultValue
      : 0;

  await connection.execute(
    `UPDATE ${table}
     SET ${column} = ?
     WHERE ${column} IS NULL
        OR TRIM(CAST(${column} AS CHAR)) IN ('', '-', 'null', 'NULL', 'N/A')`,
    [fallback]
  );
};

const columnExists = async (connection, table, column) => {
  const [rows] = await connection.execute(
    `SHOW COLUMNS FROM ${wrapId(table)} LIKE ?`,
    [column]
  );
  return rows.length > 0;
};

async function fixColumn(connection, def) {
  const exists = await columnExists(connection, def.table, def.column);
  if (!exists) {
    console.warn(`⚠️  Column ${def.table}.${def.column} ไม่พบในฐานข้อมูล ข้ามการแก้ไข`);
    return;
  }

  if (def.convert === 'date') {
    await normalizeDateColumn(connection, def);
  } else if (def.convert === 'numeric') {
    await normalizeNumericColumn(connection, def);
  } else if (def.convert === 'integer') {
    await normalizeIntegerColumn(connection, def);
  }

  const columnDefinition = buildColumnDefinition(def);
  const sql = `ALTER TABLE ${wrapId(def.table)} MODIFY COLUMN ${wrapId(
    def.column
  )} ${columnDefinition}`;
  console.log(`→ กำลังปรับ ${def.table}.${def.column} เป็น ${columnDefinition}`);
  await connection.execute(sql);
  console.log(`✓ ปรับ ${def.table}.${def.column} สำเร็จ`);
}

async function run() {
  let connection;
  try {
    console.log('เชื่อมต่อฐานข้อมูล...', dbConfig);
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ เชื่อมต่อสำเร็จ\n');

    for (const def of columnDefinitions) {
      await fixColumn(connection, def);
    }

    console.log('\n🎉 ปรับปรุงชนิดข้อมูลเรียบร้อยแล้ว');
    console.log('กรุณารีสตาร์ตเซิร์ฟเวอร์หรือรันสคริปต์ migrate หากจำเป็น');
  } catch (error) {
    console.error('✗ เกิดข้อผิดพลาดในการปรับปรุงข้อมูล:', error.message);
    console.error(error);
    process.exitCode = 1;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

run();

