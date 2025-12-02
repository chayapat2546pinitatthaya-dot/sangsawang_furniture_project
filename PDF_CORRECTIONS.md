# 📝 รายการสิ่งที่ควรแก้ไขในเอกสาร PDF Project1

เอกสารนี้สรุปสิ่งที่ควรแก้ไขใน PDF ให้ตรงกับโปรเจกต์จริง

---

## 🔍 ข้อมูลทั่วไปที่ควรตรวจสอบ

### 1. ชื่อโปรเจกต์และข้อมูลพื้นฐาน
- ✅ ชื่อโปรเจกต์: **Sangsawang Furniture Website**
- ✅ ประเภท: เว็บไซต์ขายเฟอร์นิเจอร์ออนไลน์ระบบผ่อนชำระ
- ✅ เทคโนโลยีหลัก: React 18 + Node.js + Express.js + MySQL

---

## 📁 โครงสร้างโปรเจกต์ที่ควรอัปเดต

### โครงสร้างที่ถูกต้อง:
```
Final-Project-main/
├── server.js                    # Backend Server (2,260+ บรรทัด)
├── package.json                  # Backend Dependencies
├── .env                         # Environment Variables
│
├── database/
│   └── schema.sql               # Database Schema + Sample Data
│
├── images/                      # รูปภาพสินค้า (static files)
│   ├── โซฟา/
│   ├── ตู้เสื้อผ้า/
│   ├── เตียงนอน/
│   ├── ชั้นวางทีวี/
│   ├── โต๊ะเครื่องแป้ง/
│   ├── ฟูกนอน/
│   ├── ตู้โชว์/
│   ├── หิ้งพระ/
│   ├── ตู้กับข้าว/
│   └── เซ็ต(ตู้เสื้อผ้า+โต๊ะเครื่องแป้ง)/
│
└── client/                       # Frontend (React)
    ├── package.json
    ├── public/
    │   ├── index.html
    │   └── images/
    └── src/
        ├── App.js               # Main App Component (Routing)
        ├── index.js             # React Entry Point
        ├── App.css
        ├── index.css
        ├── components/          # Reusable Components
        │   ├── Navbar.js
        │   ├── Footer.js
        │   └── AdminHeader.js
        ├── pages/               # Page Components
        │   ├── Home.js          # หน้าแรก
        │   ├── ProductDetail.js # รายละเอียดสินค้า
        │   ├── Cart.js          # ตะกร้าสินค้า
        │   ├── Login.js         # เข้าสู่ระบบ
        │   ├── Register.js     # สมัครสมาชิก
        │   ├── Profile.js       # ข้อมูลส่วนตัว
        │   ├── Orders.js        # คำสั่งซื้อ
        │   ├── OrderDetail.js   # รายละเอียดคำสั่งซื้อ
        │   ├── Cards.js         # บัตรเครดิต (หน้าใหม่)
        │   ├── VerifyEmail.js   # ยืนยันอีเมลด้วย OTP
        │   └── admin/           # หน้า Admin
        │       ├── AdminLogin.js
        │       ├── AdminDashboard.js
        │       ├── AdminProducts.js
        │       ├── AdminOrders.js
        │       ├── AdminCustomers.js
        │       └── AdminCustomerDetail.js
        └── utils/
            └── auth.js          # Authentication utilities
```

---

## 🛠️ เทคโนโลยีที่ใช้ (ควรตรวจสอบให้ครบ)

### Frontend
- ✅ React 18.2.0
- ✅ React Router DOM 6.15.0
- ✅ Bootstrap 5.3.0
- ✅ React Bootstrap 2.8.0
- ✅ Axios 1.4.0
- ✅ cross-env 10.1.0 (dev dependency)

### Backend
- ✅ Node.js
- ✅ Express.js 4.18.2
- ✅ MySQL2 3.6.0 (Promise-based)
- ✅ bcryptjs 2.4.3 (Password hashing)
- ✅ jsonwebtoken 9.0.2 (JWT authentication)
- ✅ nodemailer 6.9.8 (Email notifications)
- ✅ multer 2.0.2 (File upload)
- ✅ cors 2.8.5 (CORS configuration)
- ✅ dotenv 16.3.1 (Environment variables)
- ✅ concurrently 8.2.0 (Run multiple commands)
- ✅ kill-port 2.0.1 (Kill port before start)
- ✅ nodemon 3.0.1 (Auto-restart server)

### Database
- ✅ MySQL / MariaDB
- ✅ Database name: `sangsawang_furniture`

---

## 📊 Database Schema ที่ควรระบุให้ชัดเจน

### ตารางทั้งหมด (8 ตาราง):

1. **admin** - ข้อมูลผู้ดูแลระบบ
   - admin_id, admin_username, admin_password, admin_fname, admin_lname, admin_email, admin_tel

2. **customer** - ข้อมูลลูกค้า
   - customer_id, customer_username, customer_password, customer_fname, customer_lname, customer_email, customer_tel, customer_address, customer_alt_addresses, email_verified, email_verification_token, email_verification_expires

3. **category** - หมวดหมู่สินค้า
   - category_id, category_name, category_description

4. **product** - ข้อมูลสินค้า
   - product_id, product_name, product_description, category_id, product_image, price_cash, price_cash_promo, price_installment, price_installment_promo, product_highlights, tags

5. **cart_item** - สินค้าในตะกร้า
   - cart_item_id, customer_id, product_id, pricing_type, pricing_label, quantity, unit_price

6. **order** - คำสั่งซื้อ
   - order_id, customer_id, order_date, order_status, total_amount, payment_method, installment_periods, monthly_payment, shipping_address

7. **order_detail** - รายละเอียดคำสั่งซื้อ
   - order_detail_id, order_id, product_id, quantity, price

8. **installment_payments** - การผ่อนชำระ
   - installment_id, order_id, installment_number, installment_amount, payment_due_date, payment_status, payment_date

---

## 🎯 คุณสมบัติที่ควรระบุให้ครบถ้วน

### สำหรับลูกค้า (Customer Features)
1. ✅ หน้าแรก (Home) - แสดงสินค้าแนะนำ + Hero section
2. ✅ ดูสินค้าทั้งหมด - พร้อมระบบค้นหาและกรองตามหมวดหมู่
3. ✅ ดูรายละเอียดสินค้า - แสดงรูปภาพหลายรูป, ราคา 4 แบบ (ซื้อสด/ซื้อสดโปรโมชัน/ซื้อผ่อน/ซื้อผ่อนโปรโมชัน)
4. ✅ ตะกร้าสินค้า - เพิ่ม/แก้ไข/ลบสินค้า, รองรับหลาย pricing type
5. ✅ สมัครสมาชิก - พร้อม validation
6. ✅ เข้าสู่ระบบ - JWT authentication
7. ✅ ยืนยันอีเมลด้วย OTP - ระบบส่ง OTP ผ่านอีเมล
8. ✅ จัดการข้อมูลส่วนตัว - แก้ไขข้อมูล, เปลี่ยนรหัสผ่าน
9. ✅ จัดการที่อยู่จัดส่ง - ที่อยู่หลัก + ที่อยู่สำรองหลายที่
10. ✅ ดูคำสั่งซื้อ - ดูคำสั่งซื้อทั้งหมด
11. ✅ รายละเอียดคำสั่งซื้อ - ดูรายละเอียด + สถานะการผ่อนชำระ
12. ✅ ยกเลิกคำสั่งซื้อ - ลูกค้าสามารถยกเลิกได้ (ถ้ายังไม่ได้รับการอนุมัติ)
13. ✅ ระบบผ่อนชำระ - 3, 6, 12 งวด

### สำหรับแอดมิน (Admin Features)
1. ✅ เข้าสู่ระบบแอดมิน
2. ✅ แดชบอร์ด - แสดงสถิติ (จำนวนคำสั่งซื้อ, ลูกค้า, สินค้า)
3. ✅ จัดการสินค้า - เพิ่ม/แก้ไข/ลบสินค้า, อัปโหลดรูปภาพ
4. ✅ จัดการคำสั่งซื้อ - ดูทั้งหมด, อนุมัติ/ปฏิเสธ, เปลี่ยนสถานะ
5. ✅ จัดการลูกค้า - ดูรายชื่อลูกค้า, ดูรายละเอียดลูกค้า, ประวัติการสั่งซื้อ
6. ✅ Notification System - แจ้งเตือนคำสั่งซื้อใหม่, ลูกค้าใหม่

---

## 🔌 API Endpoints ที่ควรระบุให้ครบถ้วน

### Public APIs
```
GET  /api/health                # Health check
GET  /api/products              # ดึงสินค้าทั้งหมด
GET  /api/products/:id          # ดึงสินค้า 1 รายการ
GET  /api/categories            # ดึงหมวดหมู่ทั้งหมด
```

### Customer APIs
```
POST /api/customer/register              # สมัครสมาชิก
POST /api/customer/login                 # เข้าสู่ระบบ
GET  /api/customer/profile                # ดูข้อมูลส่วนตัว
PUT  /api/customer/profile               # แก้ไขข้อมูลส่วนตัว
PUT  /api/customer/password              # เปลี่ยนรหัสผ่าน
POST /api/customer/verify-email           # ยืนยันอีเมลด้วย OTP
POST /api/customer/resend-verification    # ส่ง OTP ใหม่
GET  /api/customer/orders                 # ดูคำสั่งซื้อของตัวเอง
```

### Cart APIs
```
GET    /api/cart                  # ดึงสินค้าในตะกร้า
PUT    /api/cart/items            # เพิ่ม/แก้ไขสินค้าในตะกร้า
DELETE /api/cart/items             # ลบสินค้าออกจากตะกร้า
DELETE /api/cart                   # ล้างตะกร้าทั้งหมด
```

### Order APIs
```
POST /api/orders                  # สร้างคำสั่งซื้อ
GET  /api/orders                  # ดูคำสั่งซื้อทั้งหมด (Admin only)
GET  /api/orders/:id              # ดูรายละเอียดคำสั่งซื้อ
PUT  /api/orders/:id/status       # เปลี่ยนสถานะคำสั่งซื้อ (Admin)
PUT  /api/orders/approve/:id      # อนุมัติคำสั่งซื้อ (Admin)
PUT  /api/orders/reject/:id       # ปฏิเสธคำสั่งซื้อ (Admin)
PUT  /api/orders/cancel/:id       # ยกเลิกคำสั่งซื้อ (Customer)
```

### Product APIs (Admin only)
```
POST   /api/products              # เพิ่มสินค้า
PUT    /api/products/:id          # แก้ไขสินค้า
DELETE /api/products/:id          # ลบสินค้า
POST   /api/upload                 # อัปโหลดรูปภาพ
```

### Admin APIs
```
POST /api/admin/login                     # เข้าสู่ระบบแอดมิน
GET  /api/admin/customers                 # ดูรายชื่อลูกค้าทั้งหมด
GET  /api/admin/customers/:id              # ดูรายละเอียดลูกค้า
GET  /api/admin/notification-summary      # สรุปการแจ้งเตือน
```

---

## 🔒 Security Features ที่ควรระบุ

1. ✅ **Password Hashing** - ใช้ bcryptjs (salt rounds: 10)
2. ✅ **JWT Authentication** - Token หมดอายุ 24 ชั่วโมง
3. ✅ **SQL Injection Prevention** - ใช้ parameterized queries
4. ✅ **CORS Configuration** - อนุญาตเฉพาะ origin ที่กำหนด
5. ✅ **Role-based Access Control** - แยกสิทธิ์ Customer และ Admin
6. ✅ **Email Verification** - ระบบ OTP สำหรับยืนยันอีเมล
7. ✅ **File Upload Security** - จำกัดประเภทไฟล์และขนาด (10MB)

---

## 📧 Email System ที่ควรระบุ

1. ✅ **Email Verification OTP** - ส่ง OTP 6 หลักเพื่อยืนยันอีเมล
2. ✅ **Order Approval Notification** - แจ้งเตือนเมื่อคำสั่งซื้อได้รับการอนุมัติ
3. ✅ **SMTP Configuration** - รองรับการตั้งค่า SMTP ผ่าน environment variables

---

## 🚀 Port Configuration ที่ควรระบุ

- ✅ **Backend Port**: 7100 (default) - กำหนดใน .env
- ✅ **Frontend Port**: 3001 (default) - กำหนดใน package.json
- ✅ **Database Port**: 3306 (default MySQL) หรือ 8889 (MAMP)

---

## 📝 Environment Variables ที่ควรระบุ

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sangsawang_furniture

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server
PORT=7100

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=Sangsawang Furniture <your-email@gmail.com>
APP_BASE_URL=http://localhost:3001
EMAIL_VERIFICATION_TTL_MINUTES=15
EMAIL_OTP_LENGTH=6
```

---

## 🎨 UI/UX Features ที่ควรระบุ

1. ✅ **Responsive Design** - รองรับ Desktop, Tablet, Mobile
2. ✅ **Bootstrap 5** - ใช้สำหรับ styling
3. ✅ **React Bootstrap** - Components ที่พร้อมใช้
4. ✅ **Image Gallery** - แสดงรูปภาพสินค้าหลายรูป
5. ✅ **Search & Filter** - ค้นหาสินค้าและกรองตามหมวดหมู่
6. ✅ **Price Display** - แสดงราคา 4 แบบ (ซื้อสด/โปรโมชัน/ผ่อน/ผ่อนโปรโมชัน)
7. ✅ **Cart Badge** - แสดงจำนวนสินค้าในตะกร้า
8. ✅ **Loading States** - แสดง loading indicator
9. ✅ **Error Handling** - แสดง error messages ที่เหมาะสม
10. ✅ **Form Validation** - Validation ทั้งฝั่ง client และ server

---

## 📊 Order Status ที่ควรระบุ

1. **pending** - รออนุมัติ
2. **awaiting_payment** - รอชำระเงิน
3. **approved** - อนุมัติแล้ว
4. **waiting_for_delivery** - รอจัดส่ง
5. **completed** - ส่งมอบสำเร็จ
6. **cancelled** - ยกเลิกโดยผู้ดูแล
7. **cancelled_by_customer** - ลูกค้ายกเลิก

---

## 💳 Payment Methods ที่ควรระบุ

1. **cash** - ซื้อสด
2. **cashPromo** - ซื้อสดโปรโมชัน
3. **installment** - ซื้อผ่อน
4. **installmentPromo** - ซื้อผ่อนโปรโมชัน

---

## 📈 สถิติโปรเจกต์ที่ควรระบุ

### Backend (server.js)
- **Lines**: ~2,260 บรรทัด
- **Endpoints**: 25+ API endpoints
- **Features**: Authentication, Product CRUD, Order management, Installment system, Cart management, Email notifications

### Frontend (React)
- **Pages**: 17+ pages
- **Components**: 3+ reusable components
- **Lines**: ~3,000+ บรรทัด
- **Features**: Customer pages (10), Admin pages (6), Responsive design, Form validation

### Database Schema
- **Tables**: 8 tables
- **Relationships**: Multiple foreign keys
- **Features**: Cart persistence, Multiple shipping addresses, Email verification, Installment tracking

---

## 🔄 Flow การทำงานที่สำคัญ

### 1. Customer Registration Flow
1. กรอกข้อมูลสมัครสมาชิก
2. ระบบสร้างบัญชี
3. (ถ้ามีการตั้งค่า SMTP) ส่ง OTP ไปยังอีเมล
4. ยืนยันอีเมลด้วย OTP

### 2. Order Flow
1. เพิ่มสินค้าในตะกร้า
2. ไปที่หน้า Cart
3. เลือกที่อยู่จัดส่ง
4. เลือกวิธีการชำระเงิน (ซื้อสด/ผ่อน)
5. สร้างคำสั่งซื้อ (status: pending)
6. Admin อนุมัติคำสั่งซื้อ (status: awaiting_payment)
7. ส่งอีเมลแจ้งเตือนลูกค้า
8. (ถ้าผ่อน) สร้าง installment_payments records

### 3. Installment System Flow
1. เลือกวิธีการชำระเงินเป็น "ผ่อน"
2. เลือกจำนวนงวด (3, 6, 12)
3. ระบบคำนวณ monthly_payment = total_amount / periods
4. สร้าง installment_payments records ตามจำนวนงวด
5. แต่ละ record มี payment_due_date ที่ต่างกัน

---

## ⚠️ สิ่งที่อาจขาดหายไปใน PDF

1. ❓ **Email Verification System** - ระบบ OTP สำหรับยืนยันอีเมล
2. ❓ **Multiple Shipping Addresses** - รองรับที่อยู่สำรองหลายที่
3. ❓ **Cart Persistence** - ตะกร้าสินค้าถูกเก็บในฐานข้อมูล
4. ❓ **Admin Customer Management** - หน้า AdminCustomers และ AdminCustomerDetail
5. ❓ **Notification System** - ระบบแจ้งเตือนสำหรับ Admin
6. ❓ **Order Status Management** - ระบบจัดการสถานะคำสั่งซื้อที่ละเอียด
7. ❓ **File Upload System** - ระบบอัปโหลดรูปภาพสินค้า
8. ❓ **Image Management** - รองรับรูปภาพหลายรูปต่อสินค้า
9. ❓ **Price Types** - ราคา 4 แบบ (ซื้อสด/โปรโมชัน/ผ่อน/ผ่อนโปรโมชัน)
10. ❓ **Cards Page** - หน้า Cards.js (อาจเป็นหน้าใหม่)

---

## ✅ Checklist สำหรับการแก้ไข PDF

- [ ] ตรวจสอบโครงสร้างโปรเจกต์ให้ตรงกับจริง
- [ ] ระบุเทคโนโลยีที่ใช้ให้ครบถ้วน
- [ ] อธิบาย Database Schema ทั้ง 8 ตาราง
- [ ] ระบุคุณสมบัติทั้งหมด (Customer + Admin)
- [ ] ระบุ API Endpoints ทั้งหมด (25+ endpoints)
- [ ] อธิบาย Security Features
- [ ] อธิบาย Email System
- [ ] ระบุ Port Configuration
- [ ] ระบุ Environment Variables
- [ ] อธิบาย Order Status ทั้ง 7 สถานะ
- [ ] อธิบาย Payment Methods ทั้ง 4 แบบ
- [ ] ระบุสถิติโปรเจกต์ (Lines, Endpoints, Features)
- [ ] อธิบาย Flow การทำงานที่สำคัญ
- [ ] เพิ่มส่วนที่ขาดหายไป (Email Verification, Multiple Addresses, etc.)

---

## 📌 หมายเหตุ

เอกสาร PDF ควรอัปเดตให้ตรงกับโปรเจกต์จริง โดยเฉพาะ:
1. **โครงสร้างไฟล์** - ต้องตรงกับโครงสร้างจริง
2. **คุณสมบัติ** - ต้องระบุให้ครบถ้วน
3. **API Endpoints** - ต้องระบุทั้งหมด
4. **Database Schema** - ต้องอธิบายทุกตาราง
5. **Flow การทำงาน** - ต้องอธิบายให้ชัดเจน

หาก PDF มีข้อมูลที่ล้าสมัยหรือไม่ตรงกับโปรเจกต์จริง ควรแก้ไขให้ตรงกับเอกสารนี้


