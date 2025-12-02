const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixProductImagePaths() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'sangsawang_furniture'
        });

        console.log('=== แก้ไข product_image paths ===\n');

        // ดึงสินค้าทั้งหมด
        const [products] = await connection.execute(
            'SELECT product_id, product_name, product_image FROM product'
        );

        console.log(`พบสินค้า ${products.length} รายการ\n`);

        let updatedCount = 0;

        for (const product of products) {
            if (!product.product_image) {
                console.log(`⚠ Product ID ${product.product_id}: ไม่มี product_image`);
                continue;
            }

            let imagePath = product.product_image;
            let needsUpdate = false;
            let newImagePath = null;

            // ตรวจสอบว่าเป็น JSON array หรือ string
            try {
                const parsed = JSON.parse(product.product_image);
                if (Array.isArray(parsed)) {
                    // แก้ไขแต่ละ path ใน array
                    const fixedPaths = parsed.map(p => {
                        const trimmed = String(p).trim();
                        // ถ้าเป็นชื่อไฟล์ล้วน หรือ path ที่ไม่มี /images/ prefix
                        if (trimmed && !trimmed.startsWith('/images/') && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
                            // ถ้าเป็น path ที่มี / หรือ \ ให้เพิ่ม /images/ หน้า
                            if (trimmed.includes('/') || trimmed.includes('\\')) {
                                const normalized = trimmed.replace(/\\/g, '/');
                                return normalized.startsWith('/') ? `/images${normalized}` : `/images/${normalized}`;
                            } else {
                                // ถ้าเป็นชื่อไฟล์ล้วน ให้เพิ่ม /images/
                                return `/images/${trimmed}`;
                            }
                        }
                        return trimmed;
                    });
                    newImagePath = JSON.stringify(fixedPaths);
                    // ตรวจสอบว่ามีการเปลี่ยนแปลงหรือไม่
                    if (JSON.stringify(parsed) !== JSON.stringify(fixedPaths)) {
                        needsUpdate = true;
                    }
                } else {
                    imagePath = product.product_image;
                }
            } catch (e) {
                // ไม่ใช่ JSON, ใช้ค่าเดิม
                imagePath = product.product_image;
            }

            // ถ้ายังไม่ได้แก้ไข (กรณีเป็น string)
            if (!needsUpdate && !newImagePath) {
                const trimmed = String(imagePath).trim();
                // ถ้าเป็นชื่อไฟล์ล้วน หรือ path ที่ไม่มี /images/ prefix
                if (trimmed && !trimmed.startsWith('/images/') && !trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
                    // ถ้าเป็น path ที่มี / หรือ \ ให้เพิ่ม /images/ หน้า
                    if (trimmed.includes('/') || trimmed.includes('\\')) {
                        const normalized = trimmed.replace(/\\/g, '/');
                        newImagePath = normalized.startsWith('/') ? `/images${normalized}` : `/images/${normalized}`;
                    } else {
                        // ถ้าเป็นชื่อไฟล์ล้วน ให้เพิ่ม /images/
                        newImagePath = `/images/${trimmed}`;
                    }
                    needsUpdate = true;
                }
            }

            if (needsUpdate && newImagePath) {
                // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
                let relativePath = newImagePath.replace(/^\/images\//, '').replace(/^images\//, '');
                // ถ้าเป็น JSON array ให้ใช้ path แรก
                try {
                    const parsed = JSON.parse(newImagePath);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        relativePath = parsed[0].replace(/^\/images\//, '').replace(/^images\//, '');
                    }
                } catch (e) {
                    // ไม่ใช่ JSON
                }

                const imageFullPath = path.join(__dirname, 'images', relativePath);
                const exists = fs.existsSync(imageFullPath);

                if (exists) {
                    await connection.execute(
                        'UPDATE product SET product_image = ? WHERE product_id = ?',
                        [newImagePath, product.product_id]
                    );
                    console.log(`✓ Product ID ${product.product_id} (${product.product_name}):`);
                    console.log(`  เดิม: ${product.product_image}`);
                    console.log(`  ใหม่: ${newImagePath}`);
                    updatedCount++;
                } else {
                    console.log(`⚠ Product ID ${product.product_id} (${product.product_name}):`);
                    console.log(`  ไม่พบไฟล์: ${imageFullPath}`);
                    console.log(`  path ใน DB: ${product.product_image}`);
                }
            }
        }

        console.log(`\n=== สรุป ===`);
        console.log(`อัปเดต ${updatedCount} รายการ`);

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

fixProductImagePaths();


