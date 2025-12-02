const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function checkProductImages() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'sangsawang_furniture'
        });

        console.log('=== ตรวจสอบข้อมูลภาพสินค้าในฐานข้อมูล ===\n');

        // ดึงข้อมูลสินค้าล่าสุด 10 รายการ
        const [products] = await connection.execute(
            'SELECT product_id, product_name, product_image FROM product ORDER BY product_id DESC LIMIT 10'
        );

        console.log(`พบสินค้า ${products.length} รายการ:\n`);

        for (const product of products) {
            console.log(`--- Product ID: ${product.product_id} ---`);
            console.log(`ชื่อสินค้า: ${product.product_name}`);
            console.log(`product_image ใน DB: ${product.product_image || '(null)'}`);
            
            // ตรวจสอบว่า product_image เป็น JSON array หรือ string
            let imagePath = null;
            try {
                const parsed = JSON.parse(product.product_image);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    imagePath = parsed[0];
                    console.log(`  → เป็น JSON array, รูปแรก: ${imagePath}`);
                } else {
                    imagePath = product.product_image;
                }
            } catch (e) {
                // ไม่ใช่ JSON, ใช้ค่าเดิม
                imagePath = product.product_image;
                console.log(`  → เป็น string: ${imagePath}`);
            }

            // ตรวจสอบว่าไฟล์มีอยู่จริงหรือไม่
            if (imagePath) {
                // ลบ /images/ prefix ถ้ามี
                let relativePath = imagePath.replace(/^\/images\//, '').replace(/^images\//, '');
                
                // ตรวจสอบในโฟลเดอร์ images
                const imageFullPath = path.join(__dirname, 'images', relativePath);
                const exists = fs.existsSync(imageFullPath);
                
                console.log(`  → Path ที่ใช้: ${relativePath}`);
                console.log(`  → Full path: ${imageFullPath}`);
                console.log(`  → ไฟล์มีอยู่: ${exists ? '✓' : '✗'}`);
                
                if (!exists) {
                    // ลองหาไฟล์ในโฟลเดอร์ย่อย
                    const imagesDir = path.join(__dirname, 'images');
                    if (fs.existsSync(imagesDir)) {
                        const files = fs.readdirSync(imagesDir, { recursive: true, withFileTypes: true });
                        const matchingFiles = files.filter(file => {
                            if (file.isFile()) {
                                const fileName = path.basename(file.name);
                                return fileName === path.basename(relativePath) || 
                                       fileName === path.basename(imagePath);
                            }
                            return false;
                        });
                        
                        if (matchingFiles.length > 0) {
                            console.log(`  → พบไฟล์ที่คล้ายกัน:`);
                            matchingFiles.forEach(file => {
                                const fullPath = path.join(file.path || imagesDir, file.name);
                                const relPath = path.relative(__dirname, fullPath);
                                console.log(`    - ${relPath}`);
                            });
                        }
                    }
                }
            }
            console.log('');
        }

        // ตรวจสอบโครงสร้างโฟลเดอร์ images
        console.log('=== ตรวจสอบโฟลเดอร์ images ===\n');
        const imagesDir = path.join(__dirname, 'images');
        if (fs.existsSync(imagesDir)) {
            console.log(`✓ โฟลเดอร์ images มีอยู่: ${imagesDir}\n`);
            
            // นับจำนวนไฟล์และโฟลเดอร์
            const files = fs.readdirSync(imagesDir, { recursive: true, withFileTypes: true });
            const fileCount = files.filter(f => f.isFile()).length;
            const dirCount = files.filter(f => f.isDirectory()).length;
            
            console.log(`  - จำนวนไฟล์: ${fileCount}`);
            console.log(`  - จำนวนโฟลเดอร์: ${dirCount}\n`);
            
            // แสดงตัวอย่างไฟล์
            console.log('ตัวอย่างไฟล์ในโฟลเดอร์ images:');
            const imageFiles = files.filter(f => f.isFile()).slice(0, 10);
            imageFiles.forEach(file => {
                const fullPath = path.join(file.path || imagesDir, file.name);
                const relPath = path.relative(imagesDir, fullPath);
                console.log(`  - ${relPath}`);
            });
        } else {
            console.log(`✗ โฟลเดอร์ images ไม่มีอยู่: ${imagesDir}`);
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
    }
}

checkProductImages();


