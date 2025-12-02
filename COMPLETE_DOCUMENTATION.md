# 🪑 Sangsawang Furniture Website - เอกสารรวมทั้งหมด

เว็บไซต์ขายเฟอร์นิเจอร์ออนไลน์ระบบผ่อนชำระ พัฒนาด้วย React + Node.js + Express + MySQL

---

## 📑 สารบัญ

1. [ภาพรวมโปรเจกต์](#-ภาพรวมโปรเจกต์)
2. [Quick Start Guide](#-quick-start-guide)
3. [คู่มือการติดตั้งแบบละเอียด](#-คู่มือการติดตั้งแบบละเอียด)
4. [คุณสมบัติทั้งหมด](#-คุณสมบัติทั้งหมด)
5. [ระบบผ่อนชำระ](#-ระบบผ่อนชำระ)
6. [สรุปโปรเจกต์](#-สรุปโปรเจกต์)
7. [สถิติโปรเจกต์](#-สถิติโปรเจกต์)
8. [API Endpoints](#-api-endpoints)
9. [Troubleshooting](#-troubleshooting)

---

# 📋 ภาพรวมโปรเจกต์

## คุณสมบัติ

### สำหรับลูกค้า
- ✅ หน้าแรกแสดงสินค้าแนะนำ
- ✅ ดูสินค้าทั้งหมด พร้อมระบบค้นหา
- ✅ ดูรายละเอียดสินค้า
- ✅ ตะกร้าสินค้า
- ✅ สมัครสมาชิก / เข้าสู่ระบบ
- ✅ จัดการข้อมูลส่วนตัว
- ✅ ดูคำสั่งซื้อ
- ✅ ระบบผ่อนชำระ (2-12 เดือน)
- ✅ Top Bar แสดงข้อมูลติดต่อและลิงก์โซเชียลมีเดีย
- ✅ QR Code สำหรับ Line และ Facebook

### สำหรับแอดมิน
- ✅ แดชบอร์ดแสดงสถิติ
- ✅ จัดการสินค้า (เพิ่ม/แก้ไข/ลบ)
- ✅ อนุมัติคำสั่งซื้อ
- ✅ ดูคำสั่งซื้อทั้งหมด

## 📁 โครงสร้างโปรเจกต์

```
sangsawang-furniture/
├── client/                 # Frontend (React)
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── TopBar.js   # Top bar with contact info and social links
│   │   │   ├── Navbar.js   # Navigation bar
│   │   │   └── Footer.js   # Footer component
│   │   ├── pages/          # Pages
│   │   │   ├── Home.js
│   │   │   ├── ProductDetail.js
│   │   │   ├── Cart.js
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   └── admin/      # Admin pages
│   │   ├── App.js          # Main App Component (Routing)
│   │   └── index.js        # React Entry Point
│   └── package.json
├── database/
│   └── schema.sql          # Database schema
├── server.js               # Backend server
├── package.json
└── README.md
```

## 🛠️ เทคโนโลยีที่ใช้

### Frontend
- React 18
- React Router 6
- Bootstrap 5
- React Bootstrap
- Axios

### Backend
- Node.js
- Express.js
- MySQL2
- bcryptjs (เข้ารหัสรหัสผ่าน)
- JSON Web Token (JWT)

### Database
- MySQL

---

# ⚡ Quick Start Guide

## 🎯 เริ่มต้นใช้งานภายใน 5 นาที

### Step 1: ตรวจสอบ Prerequisites

ต้องมี:
- ✅ Node.js (version 16+) - [Download](https://nodejs.org/)
- ✅ MySQL หรือ XAMPP/WAMP
- ✅ npm (มาพร้อมกับ Node.js)

ตรวจสอบว่า Node.js ติดตั้งแล้ว:
```bash
node --version
npm --version
```

### Step 2: ติดตั้ง Dependencies

เปิด Terminal/PowerShell ไปที่โฟลเดอร์โปรเจกต์:

```bash
# ติดตั้ง Backend dependencies
npm install

# ติดตั้ง Frontend dependencies
cd client
npm install
cd ..
```

⏱️ ใช้เวลาประมาณ 2-3 นาที

### Step 3: ตั้งค่าฐานข้อมูล

#### 3.1 เปิด MySQL

**ถ้าใช้ XAMPP:**
- เปิด XAMPP Control Panel
- Start Apache และ MySQL

**ถ้าใช้ MAMP:**
- เปิด MAMP
- Start MySQL (port 8889)

**ถ้าใช้ WAMP:**
- เปิด WAMP Server
- รอจนไอคอนเป็นสีเขียว

#### 3.2 สร้าง Database

**วิธีที่ 1: phpMyAdmin**
1. เปิด http://localhost/phpmyadmin (XAMPP/WAMP) หรือ http://localhost:8888/phpMyAdmin (MAMP)
2. สร้าง database ใหม่ ชื่อ `sangsawang_furniture`

**วิธีที่ 2: Command Line**
```bash
mysql -u root -p
```

ใน MySQL prompt:
```sql
CREATE DATABASE sangsawang_furniture;
EXIT;
```

#### 3.3 Import Schema

**phpMyAdmin:**
1. เลือก database `sangsawang_furniture`
2. คลิกแท็บ "Import"
3. เลือกไฟล์ `database/schema.sql` หรือ `database/import_from_phpmyadmin.sql`
4. คลิก "Go"

**Command Line:**
```bash
mysql -u root -p sangsawang_furniture < database/schema.sql
```

### Step 4: ตั้งค่า Environment

สร้างไฟล์ `.env` ใน root directory:

**สำหรับ MAMP:**
```env
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=sangsawang_furniture

JWT_SECRET=my_super_secret_jwt_key_for_sangsawang_furniture_2024

PORT=7100

APP_BASE_URL=http://localhost:3001
```

**สำหรับ XAMPP/WAMP:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sangsawang_furniture

JWT_SECRET=my_super_secret_jwt_key_for_sangsawang_furniture_2024

PORT=7100

APP_BASE_URL=http://localhost:3001
```

### Step 5: รันโปรเจกต์

```bash
npm run dev
```

คำสั่งนี้จะรัน:
- Backend server ที่ http://localhost:7100
- Frontend app ที่ http://localhost:3001

### Step 6: ทดสอบใช้งาน

เปิดเว็บเบราว์เซอร์:
```
http://localhost:3001
```

#### ทดสอบ Login

**ลูกค้า:**
- Username: `customer1`
- Password: `customer123`

**แอดมิน:**
- ไปที่ http://localhost:3001/admin/login
- Username: `admin`
- Password: `admin123`

## ✅ Checklist

- [ ] Node.js ติดตั้งแล้ว
- [ ] npm install สำเร็จ
- [ ] MySQL เปิดอยู่
- [ ] Database สร้างแล้ว
- [ ] Import schema สำเร็จ
- [ ] สร้างไฟล์ .env แล้ว
- [ ] npm run dev สำเร็จ
- [ ] เปิดเว็บได้
- [ ] Login ได้

---

# 📖 คู่มือการติดตั้งแบบละเอียด

## 📝 สรุปขั้นตอนด่วน (สำหรับเปิดใช้งานครั้งถัดไป)

1. เปิด XAMPP/MAMP แล้วกด **Start** ที่ MySQL (ถ้าเพิ่งติดตั้งให้นำเข้า `database/schema.sql` ผ่าน phpMyAdmin ก่อน)
2. ไปที่โฟลเดอร์โปรเจ็กต์ แล้วสร้าง/ตรวจไฟล์ `.env` ให้เชื่อมกับฐานข้อมูล `sangsawang_furniture`
3. รันเซิร์ฟเวอร์ด้วย `npm run dev` (หรือ `npm run server` + `npm start` ใน `client/`)
4. เปิดเว็บที่ `http://localhost:3001` แล้วล็อกอินด้วยบัญชีตัวอย่าง  
   - ลูกค้า: `customer1` / `customer123`  
   - แอดมิน: `admin` / `admin123`

> ถ้ายังไม่เคยนำเข้าฐานข้อมูล ให้ดูขั้นตอนที่ 4.3 ด้านล่าง

## ข้อกำหนดเบื้องต้น (Prerequisites)

1. **Node.js** - ดาวน์โหลดจาก https://nodejs.org/ (แนะนำ version 16.x หรือสูงกว่า)
2. **MySQL** - ติดตั้ง MySQL หรือ XAMPP/WAMP/MAMP
3. **Git** (ถ้าต้องการ clone จาก repository)

## ขั้นตอนการติดตั้งแบบทีละขั้นตอน

### ขั้นตอนที่ 1: ตรวจสอบการติดตั้ง Node.js

เปิด Command Prompt หรือ PowerShell แล้วพิมพ์:

```bash
node --version
npm --version
```

ควรแสดง version ของ Node.js และ npm

### ขั้นตอนที่ 2: ติดตั้ง Dependencies

เปิด Command Prompt หรือ PowerShell แล้วไปที่โฟลเดอร์โปรเจกต์:

```bash
cd /path/to/Final-Project-main
npm install
```

รอให้ติดตั้งเสร็จ ใช้เวลาประมาณ 2-3 นาที

### ขั้นตอนที่ 3: ติดตั้ง Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### ขั้นตอนที่ 4: ตั้งค่าฐานข้อมูล MySQL

#### 4.1 เปิด MySQL

**ถ้าใช้ XAMPP:**
1. เปิด XAMPP Control Panel
2. คลิก Start ที่ Apache และ MySQL

**ถ้าใช้ MAMP:**
1. เปิด MAMP
2. Start MySQL (port 8889)

**ถ้าใช้ WAMP:**
1. เปิด WAMP Server
2. รอจนไอคอนเป็นสีเขียว

#### 4.2 สร้าง Database

เปิด phpMyAdmin: http://localhost/phpmyadmin (XAMPP/WAMP) หรือ http://localhost:8888/phpMyAdmin (MAMP)

หรือใช้ MySQL Command Line:

```bash
mysql -u root -p
```

ใน MySQL prompt:

```sql
CREATE DATABASE sangsawang_furniture;
EXIT;
```

#### 4.3 Import Schema

**วิธีที่ 1: ใช้ phpMyAdmin**
1. เปิด phpMyAdmin
2. คลิกเลือก database `sangsawang_furniture`
3. คลิกแท็บ "Import"
4. เลือกไฟล์ `database/schema.sql` หรือ `database/import_from_phpmyadmin.sql`
5. คลิก "Go"

**วิธีที่ 2: ใช้ Command Line**
```bash
mysql -u root -p sangsawang_furniture < database/schema.sql
```

### ขั้นตอนที่ 5: ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root directory:

**สำหรับ MAMP:**
```env
DB_HOST=localhost
DB_PORT=8889
DB_USER=root
DB_PASSWORD=root
DB_NAME=sangsawang_furniture

JWT_SECRET=my_super_secret_jwt_key_for_sangsawang_furniture_2024

PORT=7100

APP_BASE_URL=http://localhost:3001
```

**สำหรับ XAMPP/WAMP:**
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=sangsawang_furniture

JWT_SECRET=my_super_secret_jwt_key_for_sangsawang_furniture_2024

PORT=7100

APP_BASE_URL=http://localhost:3001
```

**หมายเหตุ:** หาก MySQL ของคุณมี password ให้ใส่ใน `DB_PASSWORD`

### ขั้นตอนที่ 6: รันโปรเจกต์

#### วิธีที่ 1: รันพร้อมกัน (แนะนำ)

เปิด Terminal/PowerShell ที่โฟลเดอร์โปรเจกต์:

```bash
npm run dev
```

คำสั่งนี้จะรัน Backend (port 7100) และ Frontend (port 3001) พร้อมกัน

#### วิธีที่ 2: รันแยกกัน

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### ขั้นตอนที่ 7: เปิดเว็บเบราว์เซอร์

- Frontend: http://localhost:3001
- Backend API: http://localhost:7100

## 🧪 การทดสอบ

### ทดสอบ Login เป็นลูกค้า

1. ไปที่ http://localhost:3001
2. คลิก "เข้าสู่ระบบ"
3. ใช้ข้อมูล:
   - Username: `customer1`
   - Password: `customer123`
4. คลิก "เข้าสู่ระบบ"

### ทดสอบ Login เป็นแอดมิน

1. ไปที่ http://localhost:3001/admin/login
2. ใช้ข้อมูล:
   - Username: `admin`
   - Password: `admin123`
3. ควรเห็นแดชบอร์ดแอดมิน

## 🐛 แก้ไขปัญหาที่พบบ่อย

### ปัญหา: npm install ไม่สำเร็จ

**วิธีแก้:**
```bash
# ลบ node_modules และ lock files
rmdir /s node_modules
rmdir /s client\node_modules
del package-lock.json
del client\package-lock.json

# ติดตั้งใหม่
npm install
cd client
npm install
```

### ปัญหา: ไม่สามารถเชื่อมต่อ MySQL ได้

1. ตรวจสอบว่า MySQL กำลังรันอยู่
2. ตรวจสอบไฟล์ `.env` ว่า DB_USER และ DB_PASSWORD ถูกต้อง
3. สำหรับ MAMP: ตรวจสอบว่าใช้ port 8889
4. ทดสอบเชื่อมต่อ MySQL:
```bash
mysql -u root -p
```

### ปัญหา: Port 7100 หรือ 3001 ถูกใช้แล้ว

แก้ไขในไฟล์ `.env`:
```env
PORT=7101  # เปลี่ยนเป็น port อื่น
```

แก้ไขใน `client/package.json`:
```json
"scripts": {
  "start": "npx cross-env PORT=3002 react-scripts start"
}
```

### ปัญหา: EACCES Error

ใน Windows, ถ้า Permission denied:
1. Run Command Prompt as Administrator
2. ลองรัน `npm install` อีกครั้ง

### ปัญหา: หน้าเว็บเป็นสีขาว/ไม่แสดงผล

1. เปิด Developer Tools (F12)
2. ดู Console tab เพื่อดู error
3. ตรวจสอบว่า Backend รันอยู่ที่ port 7100
4. ตรวจสอบ `client/package.json` มี `"proxy": "http://localhost:7100"` หรือไม่

### ปัญหา: HtmlWebpackPlugin localStorage error (Node.js v25+)

แก้ไขใน `client/package.json`:
```json
"scripts": {
  "start": "npx cross-env PORT=3001 NODE_OPTIONS=--localstorage-file=/tmp/localstorage.json react-scripts start"
}
```

## 📊 ตรวจสอบ Database

### ดูข้อมูลสินค้า

```sql
SELECT * FROM product;
```

### ดูข้อมูลลูกค้า

```sql
SELECT customer_id, customer_username, customer_fname, customer_lname FROM customer;
```

### ดูคำสั่งซื้อ

```sql
SELECT * FROM `order`;
```

## 🔄 การ Build สำหรับ Production

### Build Frontend

```bash
cd client
npm run build
```

ไฟล์ที่ build จะอยู่ใน `client/build/`

### รัน Backend แบบ Production

```bash
# ติดตั้ง PM2 (ถ้ายังไม่มี)
npm install -g pm2

# รัน server ด้วย PM2
pm2 start server.js --name sangsawang-furniture
```

---

# ✨ คุณสมบัติทั้งหมด

## 🎯 ภาพรวม

เว็บไซต์ขายเฟอร์นิเจอร์ออนไลน์ที่มาพร้อมกับระบบผ่อนชำระแบบครบวงจร พัฒนาด้วยเทคโนโลยีสมัยใหม่

## 👥 สำหรับลูกค้า (Customer)

### 🏠 หน้าหลัก
- แสดงสินค้าแนะนำ 6 รายการ
- Hero section พร้อมปุ่ม call-to-action
- ส่วนแสดงคุณสมบัติพิเศษ (ส่งฟรี, ผ่อนได้, รับประกัน)

### 🛍️ สินค้า
- ดูสินค้าทั้งหมดพร้อมฟิลเตอร์
- ระบบค้นหาสินค้าแบบ real-time
- ดูรายละเอียดสินค้าแต่ละรายการ:
  - รูปภาพสินค้า
  - คำอธิบาย
  - ราคา
  - จำนวนคงคลัง

### 🛒 ตะกร้าสินค้า
- เพิ่ม/ลบสินค้าออกจากตะกร้า
- แก้ไขจำนวนสินค้า
- คำนวณยอดรวมอัตโนมัติ
- ระบบสั่งซื้อพร้อมเลือก:
  - วิธีการชำระเงิน (เงินสด, เครดิต, โอนเงิน)
  - จำนวนงวดการผ่อน (3, 6, 12 งวด)
  - แสดงยอดผ่อนต่อเดือน

### 👤 บัญชีผู้ใช้
- สมัครสมาชิก
- เข้าสู่ระบบ/ออกจากระบบ
- ดูและแก้ไขข้อมูลส่วนตัว:
  - ชื่อ-นามสกุล
  - อีเมล
  - เบอร์โทรศัพท์
  - ที่อยู่

### 📋 คำสั่งซื้อ
- ดูรายการคำสั่งซื้อทั้งหมด
- ดูรายละเอียดแต่ละคำสั่ง:
  - สินค้าที่สั่ง
  - ยอดรวม
  - จำนวนงวด
  - ยอดผ่อนต่อเดือน
  - สถานะการอนุมัติ

## 👨‍💼 สำหรับแอดมิน (Admin)

### 📊 แดชบอร์ด
- สถิติรวม:
  - จำนวนสินค้าทั้งหมด
  - จำนวนคำสั่งซื้อรออนุมัติ
  - จำนวนคำสั่งซื้อทั้งหมด
  - จำนวนลูกค้าทั้งหมด
- Navigation ไปยังหน้า Admin อื่นๆ

### 🎁 จัดการสินค้า
- ดูรายการสินค้าทั้งหมดในตาราง
- เพิ่มสินค้าใหม่:
  - ชื่อสินค้า
  - คำอธิบาย
  - ราคา
  - จำนวนคงคลัง
  - URL รูปภาพ
- แก้ไขสินค้า
- ลบสินค้า

### ✅ อนุมัติคำสั่งซื้อ
- ดูรายการคำสั่งซื้อทั้งหมด
- ดูข้อมูลลูกค้าแต่ละคำสั่ง
- อนุมัติคำสั่งซื้อที่รอการอนุมัติ
- ดูสถานะการอนุมัติ

## 🔐 ระบบความปลอดภัย

### Authentication
- JWT (JSON Web Token) สำหรับ authentication
- Password hashing ด้วย bcrypt
- Protected routes:
  - ลูกค้าต้อง login เพื่อสั่งซื้อ
  - แอดมินต้อง login เพื่อเข้าหน้า admin

### Authorization
- Role-based access:
  - Customer: เข้าถึงหน้า customer เท่านั้น
  - Admin: เข้าถึงหน้า admin และตรวจสอบสิทธิ์ทุก API

### Data Security
- SQL injection prevention
- CORS configuration
- Environment variables สำหรับ sensitive data

## 🎨 UI/UX Design

### Framework & Libraries
- Bootstrap 5: สำหรับ component พื้นฐาน
- React Bootstrap: React components
- Bootstrap Icons: ไอคอน

### Responsive Design
- รองรับทุกขนาดหน้าจอ:
  - Mobile (< 768px)
  - Tablet (768px - 991px)
  - Desktop (> 992px)

### User Experience
- Navigation ง่าย
- Loading states
- Error handling
- Success messages
- Confirmation dialogs

---

# 💳 ระบบการผ่อนชำระ

## ภาพรวม

ระบบผ่อนชำระของ Sangsawang Furniture ช่วยให้ลูกค้าสามารถซื้อเฟอร์นิเจอร์ด้วยการผ่อนชำระได้ โดยไม่ต้องจ่ายเงินเต็มจำนวนในครั้งเดียว

## คุณสมบัติ

### สำหรับลูกค้า

1. **เลือกจำนวนงวดผ่อนชำระ**
   - 3 งวด (3 เดือน)
   - 6 งวด (6 เดือน)
   - 12 งวด (12 เดือน)

2. **การคำนวณ**
   - ยอดผ่อนต่อเดือน = ยอดรวม ÷ จำนวนงวด
   - ไม่มีดอกเบี้ย (0%)
   - ผ่อนเท่าเท่ากันทุกงวด

3. **กระบวนการสั่งซื้อ**
   - เลือกสินค้าใส่ตะกร้า
   - ไปที่หน้า Cart
   - คลิก "สั่งซื้อสินค้า"
   - เลือกวิธีการชำระเงิน
   - เลือกจำนวนงวด
   - ยืนยันการสั่งซื้อ
   - รอการอนุมัติจากแอดมิน

### สำหรับแอดมิน

1. **อนุมัติคำสั่งซื้อ**
   - ดูรายการคำสั่งซื้อที่รออนุมัติ
   - ตรวจสอบรายละเอียดลูกค้า
   - คลิก "อนุมัติ" เพื่อยืนยัน

2. **ติดตามการชำระเงิน**
   - ดูงวดที่ชำระแล้ว
   - ดูงวดที่ยังไม่ได้ชำระ
   - ติดตามวันครบกำหนด

## ตัวอย่างการคำนวณ

### ตัวอย่างที่ 1: ซื้อโซฟา 55,000 บาท

**เลือก 6 งวด:**
- ยอดรวม: 55,000 บาท
- จำนวนงวด: 6 งวด
- **ผ่อนชำระต่อเดือน: 9,166.67 บาท**

**ตารางผ่อนชำระ:**

| งวด | วันที่ครบกำหนด | ยอดชำระ | สถานะ |
|-----|---------------|---------|-------|
| 1 | เดือนที่ 1 | ฿9,166.67 | รออนุมัติ |
| 2 | เดือนที่ 2 | ฿9,166.67 | รออนุมัติ |
| 3 | เดือนที่ 3 | ฿9,166.67 | รออนุมัติ |
| 4 | เดือนที่ 4 | ฿9,166.67 | รออนุมัติ |
| 5 | เดือนที่ 5 | ฿9,166.67 | รออนุมัติ |
| 6 | เดือนที่ 6 | ฿9,166.67 | รออนุมัติ |

### ตัวอย่างที่ 2: ซื้อชุดเฟอร์นิเจอร์ 120,000 บาท

**เลือก 12 งวด:**
- ยอดรวม: 120,000 บาท
- จำนวนงวด: 12 งวด
- **ผ่อนชำระต่อเดือน: 10,000 บาท**

**ตารางผ่อนชำระ:**
- เดือนที่ 1-12: ฿10,000 ต่อเดือน

## โครงสร้างฐานข้อมูล

### ตาราง `order`
เก็บข้อมูลคำสั่งซื้อ:

```sql
CREATE TABLE `order` (
    order_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    order_status VARCHAR(50) DEFAULT 'pending',
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    installment_periods INT NOT NULL,
    monthly_payment DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
);
```

**ฟิลด์ที่สำคัญ:**
- `installment_periods`: จำนวนงวดที่เลือก
- `monthly_payment`: ยอดผ่อนต่อเดือน
- `order_status`: สถานะ ('pending', 'approved', 'cancelled')

### ตาราง `installment_payments`
เก็บข้อมูลรายละเอียดการผ่อนชำระแต่ละงวด:

```sql
CREATE TABLE installment_payments (
    installment_id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    installment_number INT NOT NULL,
    installment_amount DECIMAL(10, 2) NOT NULL,
    payment_due_date DATE NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_date DATE,
    FOREIGN KEY (order_id) REFERENCES `order`(order_id)
);
```

**ฟิลด์ที่สำคัญ:**
- `installment_number`: งวดที่ (1, 2, 3, ...)
- `payment_due_date`: วันครบกำหนดชำระ
- `payment_status`: สถานะ ('pending', 'paid', 'overdue')

---

# 📊 สรุปโปรเจกต์

## 🎯 วัตถุประสงค์ของโปรเจกต์

พัฒนาเว็บไซต์ E-commerce สำหรับขายเฟอร์นิเจอร์ออนไลน์พร้อมระบบผ่อนชำระแบบครบวงจร เพื่ออำนวยความสะดวกให้ลูกค้าในการสั่งซื้อและผ่อนชำระสินค้า

## 🗄️ โครงสร้างฐานข้อมูล

### Tables

#### 1. admin
| Column | Type | Description |
|--------|------|-------------|
| admin_id | INT | Primary key |
| admin_username | VARCHAR(50) | Username |
| admin_password | VARCHAR(255) | Hashed password |
| admin_fname | VARCHAR(50) | First name |
| admin_lname | VARCHAR(50) | Last name |
| admin_email | VARCHAR(100) | Email |
| admin_tel | VARCHAR(20) | Phone |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Update date |

#### 2. customer
| Column | Type | Description |
|--------|------|-------------|
| customer_id | INT | Primary key |
| customer_username | VARCHAR(50) | Username |
| customer_password | VARCHAR(255) | Hashed password |
| customer_fname | VARCHAR(50) | First name |
| customer_lname | VARCHAR(50) | Last name |
| customer_email | VARCHAR(100) | Email |
| customer_tel | VARCHAR(20) | Phone |
| customer_address | TEXT | Address |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Update date |

#### 3. category
| Column | Type | Description |
|--------|------|-------------|
| category_id | INT | Primary key |
| category_name | VARCHAR(200) | Category display name |
| category_description | TEXT | Optional description |

#### 4. product
| Column | Type | Description |
|--------|------|-------------|
| product_id | INT | Primary key |
| product_name | VARCHAR(200) | Product name |
| product_description | TEXT | Description |
| category_id | INT | Foreign key → category |
| product_image | VARCHAR(500) | Hero image URL |
| price_cash | DECIMAL(10,2) | Standard cash price |
| price_cash_promo | DECIMAL(10,2) | Promotional cash price (nullable) |
| price_installment | DECIMAL(10,2) | Standard installment price per period |
| price_installment_promo | DECIMAL(10,2) | Promotional installment price per period |
| product_highlights | JSON | Bullet list of selling points |
| tags | JSON | Array of keyword tags |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Update date |

#### 5. order
| Column | Type | Description |
|--------|------|-------------|
| order_id | INT | Primary key |
| customer_id | INT | Foreign key → customer |
| order_date | DATE | Order date |
| order_status | VARCHAR(50) | Status (pending/approved/cancelled) |
| total_amount | DECIMAL(10,2) | Total amount |
| payment_method | VARCHAR(50) | Payment method |
| installment_periods | INT | Number of installments |
| monthly_payment | DECIMAL(10,2) | Monthly payment amount |

#### 6. order_detail
| Column | Type | Description |
|--------|------|-------------|
| order_detail_id | INT | Primary key |
| order_id | INT | Foreign key → order |
| product_id | INT | Foreign key → product |
| quantity | INT | Quantity |
| price | DECIMAL(10,2) | Price at time of order |

#### 7. installment_payments
| Column | Type | Description |
|--------|------|-------------|
| installment_id | INT | Primary key |
| order_id | INT | Foreign key → order |
| installment_number | INT | Installment number (1,2,3...) |
| installment_amount | DECIMAL(10,2) | Installment amount |
| payment_due_date | DATE | Due date |
| payment_status | VARCHAR(50) | Status (pending/paid/overdue) |
| payment_date | DATE | Actual payment date |

#### 8. cart_item
| Column | Type | Description |
|--------|------|-------------|
| cart_item_id | INT | Primary key |
| customer_id | INT | Foreign key → customer |
| product_id | INT | Foreign key → product |
| pricing_type | VARCHAR(32) | Pricing type (cash, cashPromo, installment, installmentPromo) |
| pricing_label | VARCHAR(255) | Pricing label |
| quantity | INT | Quantity |
| unit_price | DECIMAL(10,2) | Unit price |
| created_at | TIMESTAMP | Creation date |
| updated_at | TIMESTAMP | Update date |

---

# 📈 สถิติโปรเจกต์

## 📝 สรุปโค้ด

### Backend (server.js)
- **Lines**: ~2262 lines
- **Endpoints**: 15+ API endpoints
- **Features**:
  - Authentication (JWT)
  - Product CRUD
  - Order management
  - Installment system
  - Database transactions
  - Cart management

### Frontend (React)
- **Components**: 13+ pages
- **Lines**: ~2000+ lines
- **Features**:
  - Customer pages (8)
  - Admin pages (4)
  - Responsive design
  - Form validation
  - State management

### Database Schema
- **Tables**: 8 tables
- **Relationships**: Multiple foreign keys
- **Indexes**: Multiple indexes for performance

## 🎯 Features Breakdown

### Customer Features (8)
1. Home - หน้าแรก + Featured products
2. Products - รายการสินค้าทั้งหมด + ค้นหา
3. Product Detail - รายละเอียดสินค้า
4. Cart - ตะกร้าสินค้า + Checkout
5. Login - เข้าสู่ระบบ
6. Register - สมัครสมาชิก
7. Profile - ข้อมูลส่วนตัว
8. Orders - คำสั่งซื้อ

### Admin Features (4)
1. Admin Login - เข้าสู่ระบบแอดมิน
2. Dashboard - สถิติและ overview
3. Products Management - CRUD สินค้า
4. Orders Management - อนุมัติคำสั่งซื้อ

---

# 📝 API Endpoints

## Public APIs
```
GET  /api/health                # Health check
GET  /api/products              # Get all products
GET  /api/products/:id         # Get single product
```

## Customer APIs
```
POST /api/customer/register     # Register
POST /api/customer/login        # Login
GET  /api/customer/profile      # Get profile
PUT  /api/customer/profile      # Update profile
GET  /api/customer/orders       # Get orders
PUT  /api/customer/password     # Change password
POST /api/customer/verify-email  # Verify email
GET  /api/cart                  # Get cart items
POST /api/cart                  # Add to cart
PUT  /api/cart/:id              # Update cart item
DELETE /api/cart/:id            # Remove from cart
DELETE /api/cart                # Clear cart
```

## Product APIs (Admin only)
```
POST   /api/products            # Create product
PUT    /api/products/:id        # Update product
DELETE /api/products/:id        # Delete product
```

## Order APIs
```
GET  /api/orders                # Get all orders (Admin)
GET  /api/orders/:id            # Get order details
POST /api/orders                # Create order
PUT  /api/orders/approve/:id    # Approve order (Admin)
```

## Admin APIs
```
POST /api/admin/login           # Admin login
GET  /api/admin/customers       # Get all customers (Admin)
GET  /api/admin/customers/:id   # Get customer details (Admin)
```

---

# 🐛 Troubleshooting

## ปัญหาที่พบบ่อย

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูลได้
- ตรวจสอบว่า MySQL กำลังรันอยู่
- ตรวจสอบ DB_HOST, DB_USER, DB_PASSWORD ในไฟล์ .env
- สำหรับ MAMP: ตรวจสอบว่าใช้ port 8889 และ password = root

### ปัญหา: Port 7100 หรือ 3001 ถูกใช้แล้ว
- เปลี่ยน PORT ในไฟล์ .env
- หรือปิดแอปอื่นที่ใช้ port นั้น

### ปัญหา: npm install error
- ลบ node_modules และ package-lock.json
- รัน `npm install` ใหม่

### ปัญหา: Invalid credentials
- ตรวจสอบว่า password ใน database เป็น bcrypt hash
- ใช้ username/password ที่ถูกต้อง:
  - Customer: `customer1` / `customer123`
  - Admin: `admin` / `admin123`

### ปัญหา: HtmlWebpackPlugin localStorage error (Node.js v25+)
- แก้ไขใน `client/package.json`:
```json
"scripts": {
  "start": "npx cross-env PORT=3001 NODE_OPTIONS=--localstorage-file=/tmp/localstorage.json react-scripts start"
}
```

---

# 🔐 ข้อมูลสำหรับทดสอบ

## ลูกค้า (Customer)
- **Username:** `customer1`
- **Password:** `customer123`

- **Username:** `customer2`
- **Password:** `customer123`

## แอดมิน (Admin)
- **Username:** `admin`
- **Password:** `admin123`

---

# 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ Troubleshooting section ด้านบน
2. ดู error logs ใน Console
3. ตรวจสอบว่า dependencies ติดตั้งครบหรือไม่
4. ลอง restart MySQL และ Node.js

---

# 📄 License

MIT License

## 👨‍💻 Author

Developed for Sangsawang Furniture

## 🙏 Credit

- Bootstrap Icons
- Unsplash Images

---

**Last Updated**: November 2024

**Happy Coding! 🚀**

