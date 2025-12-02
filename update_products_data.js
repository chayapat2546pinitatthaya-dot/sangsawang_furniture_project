const mysql = require('mysql2/promise');

async function updateProductsData() {
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

        // อัปเดตข้อมูลสินค้า
        const products = [
            {
                id: 1,
                name: 'เก้าอี้ CEO หรูหรา',
                highlights: JSON.stringify(['หนังแท้เกรดพรีเมียม', 'ปรับระดับได้ 5 จุด', 'รับประกัน 3 ปี']),
                tags: JSON.stringify(['เก้าอี้', 'สำนักงาน']),
                price_cash_promo: 32000.00,
                price_installment: 38000.00,
                price_installment_promo: 36000.00,
                category_id: 1
            },
            {
                id: 2,
                name: 'โต๊ะทำงานไม้สัก',
                highlights: JSON.stringify(['ไม้สักแท้ทั้งแผ่น', 'เคลือบกันน้ำ', 'ลิ้นชักซ่อนสายไฟ']),
                tags: JSON.stringify(['โต๊ะ', 'งานไม้']),
                price_installment: 48000.00,
                category_id: 1
            },
            {
                id: 3,
                name: 'ตู้เสื้อผ้า 5 บาน',
                highlights: JSON.stringify(['ราวแขวนสแตนเลส 2 ชั้น', 'ชั้นวางของปรับระดับ', 'กระจกเต็มบานกลาง']),
                tags: JSON.stringify(['ตู้เสื้อผ้า', 'จัดเก็บ']),
                price_installment: 30000.00,
                category_id: 2
            },
            {
                id: 4,
                name: 'โซฟาหนังแท้ 3 ที่นั่ง',
                highlights: JSON.stringify(['หนังวัวแท้ทั้งใบ', 'โครงไม้เนื้อแข็ง', 'รองรับได้สูงสุด 350 กก.']),
                tags: JSON.stringify(['โซฟา', 'ห้องนั่งเล่น']),
                price_cash_promo: 52000.00,
                price_installment: 60000.00,
                price_installment_promo: 57000.00,
                category_id: 2
            },
            {
                id: 5,
                name: 'เตียงนอน King Size',
                highlights: JSON.stringify(['โครงเตียงเหล็กเสริม', 'หัวเตียงบุผ้านุ่ม', 'ช่องเก็บของใต้เตียง']),
                tags: JSON.stringify(['เตียงนอน', 'ห้องนอน']),
                price_installment: 45000.00,
                category_id: 2
            }
        ];

        console.log('\nกำลังอัปเดตข้อมูลสินค้า...');
        for (const product of products) {
            await connection.execute(`
                UPDATE product 
                SET 
                    product_highlights = ?,
                    tags = ?,
                    price_cash_promo = COALESCE(?, price_cash_promo),
                    price_installment = COALESCE(?, price_installment),
                    price_installment_promo = COALESCE(?, price_installment_promo),
                    category_id = ?
                WHERE product_id = ?
            `, [
                product.highlights,
                product.tags,
                product.price_cash_promo || null,
                product.price_installment || null,
                product.price_installment_promo || null,
                product.category_id,
                product.id
            ]);
            console.log(`✓ อัปเดตสินค้า ID ${product.id}: ${product.name}`);
        }

        // เพิ่ม product_tag
        console.log('\nกำลังเพิ่ม product_tag...');
        await connection.execute('DELETE FROM product_tag');
        
        for (const product of products) {
            const tags = JSON.parse(product.tags);
            for (const tag of tags) {
                try {
                    await connection.execute(
                        'INSERT INTO product_tag (product_id, tag) VALUES (?, ?)',
                        [product.id, tag]
                    );
                } catch (error) {
                    if (error.code !== 'ER_DUP_ENTRY') {
                        console.error(`✗ เกิดข้อผิดพลาดในการเพิ่ม tag ${tag} สำหรับ product ${product.id}:`, error.message);
                    }
                }
            }
        }
        console.log('✓ เพิ่ม product_tag สำเร็จ');

        // เพิ่มสินค้าเพิ่มเติมถ้ายังไม่มี
        console.log('\nกำลังตรวจสอบสินค้าเพิ่มเติม...');
        const [productCount] = await connection.execute('SELECT COUNT(*) as count FROM product');
        
        if (productCount[0].count < 6) {
            console.log('  กำลังเพิ่มสินค้าเพิ่มเติม...');
            await connection.execute(`
                INSERT INTO product (
                    product_name, product_description, category_id, product_image, 
                    price_cash, price_cash_promo, price_installment, price_installment_promo, 
                    product_highlights, tags
                ) VALUES 
                ('โต๊ะกลางไม้โอ๊ค', 'โต๊ะกลางขนาด 120 ซม. สำหรับห้องนั่งเล่น เคลือบกันรอยขีดข่วน', 2, 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=500', 18500.00, NULL, 19800.00, NULL, JSON_ARRAY('ไม้โอ๊คแท้', 'เคลือบกันน้ำ', 'น้ำหนักเบาเคลื่อนย้ายง่าย'), JSON_ARRAY('โต๊ะ', 'ห้องนั่งเล่น'))
            `);
            
            // เพิ่ม product_tag สำหรับสินค้าใหม่
            const [newProduct] = await connection.execute('SELECT product_id FROM product ORDER BY product_id DESC LIMIT 1');
            const newProductId = newProduct[0].product_id;
            await connection.execute(
                'INSERT INTO product_tag (product_id, tag) VALUES (?, ?), (?, ?)',
                [newProductId, 'โต๊ะ', newProductId, 'ห้องนั่งเล่น']
            );
            console.log('✓ เพิ่มสินค้าเพิ่มเติมสำเร็จ');
        }

        // ตรวจสอบผลลัพธ์
        console.log('\nกำลังตรวจสอบผลลัพธ์...');
        const [finalProducts] = await connection.execute(`
            SELECT 
                p.product_id, 
                p.product_name, 
                p.price_cash, 
                p.price_cash_promo,
                p.price_installment,
                p.price_installment_promo,
                p.category_id,
                c.category_name,
                JSON_LENGTH(p.tags) as tags_count,
                JSON_LENGTH(p.product_highlights) as highlights_count
            FROM product p
            LEFT JOIN category c ON p.category_id = c.category_id
            ORDER BY p.product_id
        `);
        
        console.log(`\n=== จำนวนสินค้าหลังอัปเดต: ${finalProducts.length} รายการ ===`);
        finalProducts.forEach((product, index) => {
            console.log(`  ${index + 1}. ID: ${product.product_id} - ${product.product_name}`);
            console.log(`     ราคา: ${product.price_cash} / ${product.price_cash_promo || 'N/A'} (สด) | ${product.price_installment || 'N/A'} / ${product.price_installment_promo || 'N/A'} (ผ่อน)`);
            console.log(`     Category: ${product.category_name || 'N/A'} (ID: ${product.category_id})`);
            console.log(`     Tags: ${product.tags_count || 0} รายการ, Highlights: ${product.highlights_count || 0} รายการ`);
        });

        console.log('\n✓ อัปเดตข้อมูลสินค้าสำเร็จ!');
        console.log('\nกรุณารีสตาร์ท server เพื่อให้การเปลี่ยนแปลงมีผล');

    } catch (error) {
        console.error('✗ เกิดข้อผิดพลาด:', error.message);
        console.error('  Error code:', error.code);
        if (error.code === 'ECONNREFUSED') {
            console.error('  กรุณาตรวจสอบว่า MySQL กำลังรันอยู่');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('  กรุณาตรวจสอบ username และ password');
        }
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

updateProductsData();


