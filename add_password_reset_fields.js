const mysql = require('mysql2/promise');
require('dotenv').config();

async function addPasswordResetFields() {
  let connection;
  
  try {
    // สร้าง connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sangsawang_furniture'
    });

    console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');

    // ตรวจสอบว่า fields มีอยู่แล้วหรือไม่
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'customer' 
       AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')`,
      [process.env.DB_NAME || 'sangsawang_furniture']
    );

    const existingColumns = columns.map(col => col.COLUMN_NAME);

    // เพิ่ม password_reset_token ถ้ายังไม่มี
    if (!existingColumns.includes('password_reset_token')) {
      await connection.execute(
        `ALTER TABLE customer 
         ADD COLUMN password_reset_token VARCHAR(255) DEFAULT NULL AFTER email_verification_expires`
      );
      console.log('เพิ่ม password_reset_token สำเร็จ');
    } else {
      console.log('password_reset_token มีอยู่แล้ว');
    }

    // เพิ่ม password_reset_expires ถ้ายังไม่มี
    if (!existingColumns.includes('password_reset_expires')) {
      await connection.execute(
        `ALTER TABLE customer 
         ADD COLUMN password_reset_expires DATETIME DEFAULT NULL AFTER password_reset_token`
      );
      console.log('เพิ่ม password_reset_expires สำเร็จ');
    } else {
      console.log('password_reset_expires มีอยู่แล้ว');
    }

    console.log('อัปเดตฐานข้อมูลสำเร็จ!');
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('ปิดการเชื่อมต่อฐานข้อมูล');
    }
  }
}

addPasswordResetFields();

