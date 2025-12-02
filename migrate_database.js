const mysql = require('mysql2/promise');

async function migrateDatabase() {
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
        console.log('✓ เชื่อมต่อฐานข้อมูลสำเร็จ');

        // 1. สร้างตาราง category ถ้ายังไม่มี
        console.log('\n1. กำลังสร้างตาราง category...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS category (
                    category_id INT AUTO_INCREMENT PRIMARY KEY,
                    category_name VARCHAR(200) NOT NULL UNIQUE,
                    category_description TEXT
                )
            `);
            console.log('✓ สร้างตาราง category สำเร็จ');

            // เพิ่มข้อมูล category
            const [existingCategories] = await connection.execute('SELECT COUNT(*) as count FROM category');
            if (existingCategories[0].count === 0) {
                await connection.execute(`
                    INSERT INTO category (category_name, category_description) VALUES
                    ('สำนักงาน', 'เฟอร์นิเจอร์สำหรับสำนักงานและพื้นที่ทำงาน'),
                    ('บ้านพักอาศัย', 'เฟอร์นิเจอร์สำหรับใช้ในบ้านและที่พักอาศัย')
                `);
                console.log('✓ เพิ่มข้อมูล category สำเร็จ');
            }
        } catch (error) {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                console.error('✗ เกิดข้อผิดพลาดในการสร้างตาราง category:', error.message);
            }
        }

        // 2. ตรวจสอบโครงสร้างตาราง product ปัจจุบัน
        console.log('\n2. กำลังตรวจสอบโครงสร้างตาราง product...');
        const [columns] = await connection.execute('DESCRIBE product');
        const columnNames = columns.map(col => col.Field);
        console.log('  Columns:', columnNames.join(', '));

        // 3. เพิ่ม columns ที่ขาดหายไป
        console.log('\n3. กำลังเพิ่ม columns ที่ขาดหายไป...');
        
        const requiredColumns = [
            { name: 'category_id', sql: 'category_id INT' },
            { name: 'price_cash', sql: 'price_cash DECIMAL(10, 2)' },
            { name: 'price_cash_promo', sql: 'price_cash_promo DECIMAL(10, 2)' },
            { name: 'price_installment', sql: 'price_installment DECIMAL(10, 2)' },
            { name: 'price_installment_promo', sql: 'price_installment_promo DECIMAL(10, 2)' },
            { name: 'product_highlights', sql: 'product_highlights JSON' },
            { name: 'tags', sql: 'tags JSON' }
        ];

        for (const col of requiredColumns) {
            if (!columnNames.includes(col.name)) {
                try {
                    await connection.execute(`ALTER TABLE product ADD COLUMN ${col.sql}`);
                    console.log(`✓ เพิ่ม column ${col.name} สำเร็จ`);
                } catch (error) {
                    if (error.code !== 'ER_DUP_FIELDNAME') {
                        console.error(`✗ เกิดข้อผิดพลาดในการเพิ่ม column ${col.name}:`, error.message);
                    }
                }
            } else {
                console.log(`✓ column ${col.name} มีอยู่แล้ว`);
            }
        }

        // 4. Migrate ข้อมูลจาก product_price ไป price_cash
        console.log('\n4. กำลัง migrate ข้อมูลราคา...');
        if (columnNames.includes('product_price') && !columnNames.includes('price_cash')) {
            // ถ้ายังไม่มี price_cash แต่มี product_price ให้ migrate
            console.log('  กำลัง migrate จาก product_price ไป price_cash...');
            await connection.execute(`
                UPDATE product 
                SET price_cash = product_price 
                WHERE price_cash IS NULL AND product_price IS NOT NULL
            `);
            console.log('✓ migrate ข้อมูลราคาสำเร็จ');
        } else if (columnNames.includes('product_price') && columnNames.includes('price_cash')) {
            // ถ้ามีทั้งสอง ให้ update price_cash จาก product_price ถ้า price_cash ว่าง
            await connection.execute(`
                UPDATE product 
                SET price_cash = product_price 
                WHERE (price_cash IS NULL OR price_cash = 0) AND product_price IS NOT NULL
            `);
            console.log('✓ อัปเดตข้อมูลราคาสำเร็จ');
        }

        // 5. สร้างตาราง product_tag ถ้ายังไม่มี
        console.log('\n5. กำลังสร้างตาราง product_tag...');
        try {
            await connection.execute(`
                CREATE TABLE IF NOT EXISTS product_tag (
                    product_id INT NOT NULL,
                    tag VARCHAR(100) NOT NULL,
                    PRIMARY KEY (product_id, tag),
                    FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
                )
            `);
            console.log('✓ สร้างตาราง product_tag สำเร็จ');
        } catch (error) {
            if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
                console.error('✗ เกิดข้อผิดพลาดในการสร้างตาราง product_tag:', error.message);
            }
        }

        // 6. เพิ่มข้อมูลสินค้าจาก schema.sql ถ้ายังไม่มี
        console.log('\n6. กำลังตรวจสอบข้อมูลสินค้า...');
        const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM product');
        console.log(`  จำนวนสินค้าในฐานข้อมูล: ${productCount[0].count} รายการ`);

        if (productCount[0].count === 0) {
            console.log('  กำลังเพิ่มข้อมูลสินค้าตัวอย่าง...');
            await connection.execute(`
                INSERT INTO product (
                    product_name, product_description, category_id, product_image, 
                    price_cash, price_cash_promo, price_installment, price_installment_promo, 
                    product_highlights, tags
                ) VALUES 
                ('เก้าอี้ CEO หรูหรา', 'เก้าอี้บริหารระดับ CEO ทำจากหนังแท้คุณภาพสูง รองรับสรีระศาสตร์', 1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 35000.00, 32000.00, 38000.00, 36000.00, JSON_ARRAY('หนังแท้เกรดพรีเมียม', 'ปรับระดับได้ 5 จุด', 'รับประกัน 3 ปี'), JSON_ARRAY('เก้าอี้', 'สำนักงาน')),
                ('โต๊ะทำงานไม้สัก', 'โต๊ะทำงานทำจากไม้สักแท้ 100% ผลิตด้วยมือจากช่างฝีมือไทย', 1, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 45000.00, NULL, 48000.00, NULL, JSON_ARRAY('ไม้สักแท้ทั้งแผ่น', 'เคลือบกันน้ำ', 'ลิ้นชักซ่อนสายไฟ'), JSON_ARRAY('โต๊ะ', 'งานไม้')),
                ('ตู้เสื้อผ้า 5 บาน', 'ตู้เสื้อผ้าสีขาวหน้ารีด 5 บาน พื้นที่เก็บของกว้าง พร้อมกระจกบานใหญ่', 2, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 28000.00, NULL, 30000.00, NULL, JSON_ARRAY('ราวแขวนสแตนเลส 2 ชั้น', 'ชั้นวางของปรับระดับ', 'กระจกเต็มบานกลาง'), JSON_ARRAY('ตู้เสื้อผ้า', 'จัดเก็บ')),
                ('โซฟาหนังแท้ 3 ที่นั่ง', 'โซฟาหนังสีน้ำตาล 3 ที่นั่ง พื้นที่กว้างขวาง นั่งสบาย', 2, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 55000.00, 52000.00, 60000.00, 57000.00, JSON_ARRAY('หนังวัวแท้ทั้งใบ', 'โครงไม้เนื้อแข็ง', 'รองรับได้สูงสุด 350 กก.'), JSON_ARRAY('โซฟา', 'ห้องนั่งเล่น')),
                ('เตียงนอน King Size', 'เตียงนอน King Size พร้อมหัวเตียงนุ่ม รับประกันความนุ่ม 10 ปี', 2, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', 42000.00, NULL, 45000.00, NULL, JSON_ARRAY('โครงเตียงเหล็กเสริม', 'หัวเตียงบุผ้านุ่ม', 'ช่องเก็บของใต้เตียง'), JSON_ARRAY('เตียงนอน', 'ห้องนอน')),
                ('โต๊ะกลางไม้โอ๊ค', 'โต๊ะกลางขนาด 120 ซม. สำหรับห้องนั่งเล่น เคลือบกันรอยขีดข่วน', 2, 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=500', 18500.00, NULL, 19800.00, NULL, JSON_ARRAY('ไม้โอ๊คแท้', 'เคลือบกันน้ำ', 'น้ำหนักเบาเคลื่อนย้ายง่าย'), JSON_ARRAY('โต๊ะ', 'ห้องนั่งเล่น'))
            `);
            console.log('✓ เพิ่มข้อมูลสินค้าตัวอย่างสำเร็จ');

            // เพิ่ม product_tag
            await connection.execute(`
                INSERT INTO product_tag (product_id, tag)
                SELECT product_id, tag
                FROM product,
                JSON_TABLE(product.tags, '$[*]' COLUMNS(tag VARCHAR(100) PATH '$')) AS parsed_tags
            `);
            console.log('✓ เพิ่ม product_tag สำเร็จ');
        } else {
            // อัปเดตข้อมูลสินค้าที่มีอยู่
            console.log('  กำลังอัปเดตข้อมูลสินค้าที่มีอยู่...');
            // อัปเดต price_cash จาก product_price ถ้ามี
            if (columnNames.includes('product_price')) {
                await connection.execute(`
                    UPDATE product 
                    SET price_cash = product_price 
                    WHERE (price_cash IS NULL OR price_cash = 0) AND product_price IS NOT NULL
                `);
            }
            // อัปเดต category_id สำหรับสินค้าทั้งหมดเป็น 1 (สำนักงาน) หรือ 2 (บ้านพักอาศัย) ถ้ายังไม่มี
            await connection.execute(`
                UPDATE product 
                SET category_id = 1 
                WHERE category_id IS NULL
            `);
            console.log('✓ อัปเดตข้อมูลสินค้าสำเร็จ');
        }

        // 7. ตรวจสอบผลลัพธ์
        console.log('\n7. กำลังตรวจสอบผลลัพธ์...');
        const [finalProducts] = await connection.execute(`
            SELECT product_id, product_name, price_cash, category_id 
            FROM product 
            LIMIT 10
        `);
        console.log(`\n=== จำนวนสินค้าหลัง migrate: ${finalProducts.length} รายการ ===`);
        finalProducts.forEach((product, index) => {
            console.log(`  ${index + 1}. ID: ${product.product_id} - ${product.product_name} - ราคา: ${product.price_cash || 'N/A'} - Category: ${product.category_id || 'N/A'}`);
        });

        console.log('\n✓ Migrate database สำเร็จ!');
        console.log('\nกรุณารีสตาร์ท server เพื่อให้การเปลี่ยนแปลงมีผล');

    } catch (error) {
        console.error('✗ เกิดข้อผิดพลาด:', error.message);
        console.error('  Error code:', error.code);
        if (error.code === 'ECONNREFUSED') {
            console.error('  กรุณาตรวจสอบว่า MySQL กำลังรันอยู่');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('  กรุณาตรวจสอบ username และ password');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('  ไม่พบ database กรุณาสร้าง database ก่อน');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

migrateDatabase();


