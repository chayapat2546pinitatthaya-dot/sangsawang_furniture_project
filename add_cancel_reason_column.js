const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sangsawang_furniture',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function addCancelReasonColumn() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // ตรวจสอบว่ามีคอลัมน์ cancel_reason อยู่แล้วหรือไม่
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'order' 
       AND COLUMN_NAME = 'cancel_reason'`,
      [process.env.DB_NAME || 'sangsawang_furniture']
    );

    if (columns.length === 0) {
      // เพิ่มคอลัมน์ cancel_reason
      await connection.execute(
        `ALTER TABLE \`order\` 
         ADD COLUMN \`cancel_reason\` TEXT DEFAULT NULL 
         AFTER \`order_status\``
      );
      console.log('✅ เพิ่มคอลัมน์ cancel_reason สำเร็จ');
    } else {
      console.log('ℹ️  คอลัมน์ cancel_reason มีอยู่แล้ว');
    }
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

addCancelReasonColumn()
  .then(() => {
    console.log('เสร็จสิ้น');
    process.exit(0);
  })
  .catch((error) => {
    console.error('เกิดข้อผิดพลาด:', error);
    process.exit(1);
  });

