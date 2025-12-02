# 🪑 Sangsawang Furniture Website

เว็บไซต์ขายเฟอร์นิเจอร์ออนไลน์ระบบผ่อนชำระ พัฒนาด้วย React + Node.js + Express + MySQL

## 📑 สารบัญ

- [คุณสมบัติ](#-คุณสมบัติ)
- [ขั้นตอนการติดตั้ง](#-ขั้นตอนการติดตั้ง)
  - [Quick Start](#quick-start)
  - [ติดตั้งแบบละเอียด](#การติดตั้งแบบละเอียด)
- [ข้อมูลสำหรับทดสอบ](#-ข้อมูลสำหรับทดสอบ)
- [เอกสารเพิ่มเติม](#-เอกสารเพิ่มเติม)
- [เทคโนโลยีที่ใช้](#-เทคโนโลยีที่ใช้)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Troubleshooting](#-troubleshooting)

---

> 💡 **เพิ่งเริ่มต้น?** ดู [QUICK_START.md](QUICK_START.md) สำหรับคู่มือเริ่มต้นใช้งานเร็วภายใน 5 นาที!

## 📋 คุณสมบัติ

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

## 🚀 ขั้นตอนการติดตั้ง

### Quick Start

```bash
# 1. ติดตั้ง dependencies
npm install
cd client && npm install && cd ..

# 2. Import database
mysql -u root -p sangsawang_furniture < database/schema.sql

# 3. Copy environment file
copy .env.example .env

# 4. รันโปรเจกต์
npm run dev
```

เปิด http://localhost:3000 ในเว็บเบราว์เซอร์

---

### การติดตั้งแบบละเอียด

### 1. ติดตั้ง Prerequisites
- Node.js (v16 หรือสูงกว่า)
- MySQL (5.7 หรือสูงกว่า) หรือ XAMPP/WAMP
- npm หรือ yarn

### 2. Clone หรือดาวน์โหลดโปรเจกต์

```bash
cd sangsawang-furniture
```

### 3. ติดตั้ง Dependencies

```bash
# ติดตั้ง Backend dependencies
npm install

# ติดตั้ง Frontend dependencies
cd client
npm install
cd ..
```

### 4. ตั้งค่าฐานข้อมูล

1. เปิด MySQL (หรือ XAMPP/WAMP)
2. สร้าง database ชื่อ `sangsawang_furniture`
3. Import ไฟล์ SQL:

```bash
mysql -u root -p sangsawang_furniture < database/schema.sql
```

หรือใช้ phpMyAdmin: เลือก database แล้ว import ไฟล์ `database/schema.sql`

### 4.1 ปรับชนิดข้อมูลให้ถูกต้อง (แนะนำให้รันหากมีข้อมูลเดิม)

สคริปต์ `fix_database_types.js` จะช่วยแปลงค่าที่เป็น Text ให้กลายเป็น `DATE/DATETIME/DECIMAL/INT` ที่ระบบคาดหวัง พร้อมจัดรูปแบบวันที่อัตโนมัติ

```bash
node fix_database_types.js
```

> 📝 สคริปต์จะใช้ค่าการเชื่อมต่อจากไฟล์ `.env` (ถ้าไม่มีจะใช้ค่าเริ่มต้นของ XAMPP: `root`/ค่าว่าง)

### 5. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root directory (คัดลอกจาก `.env.example`):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sangsawang_furniture

JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

PORT=5000
```

### 6. รันโปรเจกต์

**Option 1: รัน Backend และ Frontend พร้อมกัน**
```bash
npm run dev
```

**Option 2: รันแยกกัน**

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

### 7. เปิดเว็บเบราว์เซอร์

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 ข้อมูลสำหรับทดสอบ

### ลูกค้า (Customer)
- Username: `customer1`
- Password: `customer123`

### แอดมิน (Admin)
- Username: `admin`
- Password: `admin123`

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

## 📝 API Endpoints

### Customer
- `POST /api/customer/register` - สมัครสมาชิก
- `POST /api/customer/login` - เข้าสู่ระบบ
- `GET /api/customer/profile` - ดูข้อมูลส่วนตัว
- `PUT /api/customer/profile` - แก้ไขข้อมูลส่วนตัว
- `GET /api/customer/orders` - ดูคำสั่งซื้อ

### Product
- `GET /api/products` - ดูสินค้าทั้งหมด
- `GET /api/products/:id` - ดูสินค้า 1 รายการ
- `POST /api/products` - เพิ่มสินค้า (Admin only)
- `PUT /api/products/:id` - แก้ไขสินค้า (Admin only)
- `DELETE /api/products/:id` - ลบสินค้า (Admin only)

### Order
- `GET /api/orders` - ดูคำสั่งซื้อทั้งหมด (Admin only)
- `GET /api/orders/:id` - ดูรายละเอียดคำสั่งซื้อ
- `POST /api/orders` - สร้างคำสั่งซื้อ
- `PUT /api/orders/approve/:id` - อนุมัติคำสั่งซื้อ (Admin only)

### Admin
- `POST /api/admin/login` - เข้าสู่ระบบแอดมิน

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication
- SQL injection prevention
- CORS configuration
- Role-based access control

## 📱 Responsive Design

เว็บไซต์รองรับการใช้งานบน:
- Desktop
- Tablet
- Mobile

### UI Components
- **TopBar**: แสดงข้อมูลติดต่อ (โทรศัพท์, อีเมล) และลิงก์โซเชียลมีเดีย (Facebook, Line) พร้อม QR Code dropdown
- **Navbar**: Navigation bar พร้อมเมนูและตะกร้าสินค้า
- **Footer**: Footer พร้อมข้อมูลติดต่อและลิงก์โซเชียลมีเดีย

## 🐛 Troubleshooting

### ปัญหา: ไม่สามารถเชื่อมต่อฐานข้อมูลได้
- ตรวจสอบว่า MySQL กำลังรันอยู่
- ตรวจสอบ DB_HOST, DB_USER, DB_PASSWORD ในไฟล์ .env

### ปัญหา: Port 5000 ถูกใช้แล้ว
- เปลี่ยน PORT ในไฟล์ .env

### ปัญหา: npm install error
- ลบ node_modules และ package-lock.json
- รัน `npm install` ใหม่

## 📚 เอกสารเพิ่มเติม

- [⚡ Quick Start Guide](QUICK_START.md) - เริ่มต้นใช้งานภายใน 5 นาที
- [📖 คู่มือการติดตั้งแบบละเอียด](INSTALLATION_GUIDE.md) - ขั้นตอนการติดตั้งแบบละเอียด
- [💳 คู่มือระบบผ่อนชำระ](INSTALLMENT_SYSTEM.md) - หลักการทำงานของระบบผ่อนชำระ
- [✨ รายละเอียดคุณสมบัติ](FEATURES.md) - คุณสมบัติทั้งหมดของระบบ
- [📊 สรุปโปรเจกต์](PROJECT_SUMMARY.md) - สรุปโปรเจกต์และโครงสร้างทั้งหมด
- [📈 สถิติโปรเจกต์](STATS.md) - สถิติและข้อมูลเทคนิคของโปรเจกต์

## 📄 License

MIT License

## 👨‍💻 Author

Developed for Sangsawang Furniture

## 🙏 Credit

- Bootstrap Icons
- Unsplash Images

## 📞 Support

หากพบปัญหาหรือต้องการความช่วยเหลือ:
1. ตรวจสอบ [Troubleshooting](#-troubleshooting)
2. อ่าน [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
3. ดู error logs ใน Console

