const mysql = require('mysql2/promise');

async function setupCategories() {
    let connection;
    try {
        console.log('กำลังเชื่อมต่อฐานข้อมูล...');
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'sangsawang_furniture'
        });
        console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ\n');

        // หมวดหมู่ที่ต้องการ
        const categories = [
            { name: 'เตียงนอน', description: 'เตียงนอนและอุปกรณ์สำหรับห้องนอน' },
            { name: 'โซฟา', description: 'โซฟาและเก้าอี้นั่งสำหรับห้องนั่งเล่น' },
            { name: 'ชั้นวางทีวี', description: 'ชั้นวางทีวีและตู้โชว์สำหรับห้องนั่งเล่น' },
            { name: 'โต๊ะเครื่องแป้ง', description: 'โต๊ะเครื่องแป้งและโต๊ะแต่งตัว' },
            { name: 'ตู้เสื้อผ้า', description: 'ตู้เสื้อผ้าและตู้เก็บของ' },
            { name: 'ฟูกนอน/ที่นอน', description: 'ฟูกนอนและที่นอนคุณภาพสูง' },
            { name: 'ตู้โชว์', description: 'ตู้โชว์และตู้แสดงของตกแต่ง' },
            { name: 'หิ้งพระ', description: 'หิ้งพระและแท่นบูชา' },
            { name: 'ตู้กับข้าว', description: 'ตู้กับข้าวและตู้เก็บอาหาร' },
            { name: 'ตู้เสื้อผ้า + โต๊ะเครื่องแป้ง (เซ็ต)', description: 'เซ็ตตู้เสื้อผ้าและโต๊ะเครื่องแป้ง' }
        ];

        console.log('=== กำลังตรวจสอบหมวดหมู่ ===\n');

        // ตรวจสอบและเพิ่มหมวดหมู่
        for (const category of categories) {
            try {
                // ตรวจสอบว่ามีหมวดหมู่นี้อยู่แล้วหรือไม่
                const [existing] = await connection.execute(
                    'SELECT category_id FROM category WHERE category_name = ?',
                    [category.name]
                );

                if (existing.length > 0) {
                    console.log(`✓ มีหมวดหมู่ "${category.name}" อยู่แล้ว (ID: ${existing[0].category_id})`);
                } else {
                    // เพิ่มหมวดหมู่ใหม่
                    const [insertResult] = await connection.execute(
                        'INSERT INTO category (category_name, category_description) VALUES (?, ?)',
                        [category.name, category.description]
                    );
                    console.log(`✓ เพิ่มหมวดหมู่ "${category.name}" สำเร็จ (ID: ${insertResult.insertId})`);
                }
            } catch (error) {
                console.error(`✗ เกิดข้อผิดพลาดในการเพิ่มหมวดหมู่ "${category.name}":`, error.message);
            }
        }

        // แสดงสรุปหมวดหมู่ทั้งหมด
        console.log('\n=== สรุปหมวดหมู่ทั้งหมด ===');
        const [allCategories] = await connection.execute(
            'SELECT category_id, category_name FROM category ORDER BY category_id'
        );
        allCategories.forEach(cat => {
            console.log(`${cat.category_id}. ${cat.category_name}`);
        });

        console.log(`\n✓ ตั้งค่าหมวดหมู่เสร็จสิ้น! (ทั้งหมด ${allCategories.length} หมวดหมู่)`);

    } catch (error) {
        console.error('✗ เกิดข้อผิดพลาด:', error.message);
        console.error('  Error code:', error.code);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupCategories();


