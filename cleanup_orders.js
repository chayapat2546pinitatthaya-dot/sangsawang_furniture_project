const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'sangsawang_furniture'
};

async function cleanupOrders() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('เชื่อมต่อฐานข้อมูลสำเร็จ');

    const tables = ['installment_payments', 'order_detail', '`order`'];

    console.log('กำลังปิดการตรวจสอบ Foreign Key...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');

    for (const table of tables) {
      console.log(`กำลังล้างข้อมูลตาราง ${table}...`);
      await connection.execute(`TRUNCATE TABLE ${table}`);
    }

    console.log('กำลังเปิดการตรวจสอบ Foreign Key...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('ลบคำสั่งซื้อทั้งหมดและรีเซ็ต AUTO_INCREMENT เรียบร้อยแล้ว');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบคำสั่งซื้อ:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

cleanupOrders();
