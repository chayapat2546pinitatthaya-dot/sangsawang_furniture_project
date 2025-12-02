const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
// ใช้ memory storage ก่อน แล้วค่อยย้ายไฟล์ไปยัง destination ที่ถูกต้อง
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // กำหนดโฟลเดอร์ที่จะเก็บไฟล์
        // เก็บในโฟลเดอร์ images ก่อน แล้วค่อยย้ายไปยัง category folder ตามต้องการ
        const uploadDir = path.join(__dirname, 'images');
        
        // สร้างโฟลเดอร์ถ้ายังไม่มี
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // ใช้ชื่อไฟล์เดิม (รองรับอักขระภาษาไทย)
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        // ถ้ามี category ใน request body ให้เพิ่ม category ก่อนชื่อไฟล์ (แต่จะย้ายไฟล์ไปยัง category folder ใน endpoint)
        cb(null, originalName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        // อนุญาตเฉพาะไฟล์ภาพ
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('อนุญาตเฉพาะไฟล์ภาพ (jpeg, jpg, png, gif, webp)'));
        }
    }
});

// Serve static files from images folder
// รูปภาพจะถูกดึงจากโฟลเดอร์ images โดยตรงผ่าน static file serving (ไม่ผ่าน API endpoint)
// Browser จะ encode URL ที่มีภาษาไทยอัตโนมัติ และ Express จะ decode ให้อัตโนมัติ
app.use('/images', express.static(path.join(__dirname, 'images'), {
    setHeaders: (res, filePath) => {
        // ตั้งค่า headers สำหรับรูปภาพ
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        // ตั้งค่า cache headers เพื่อเพิ่มประสิทธิภาพ
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));
app.use('/imgesfurniture', express.static(path.join(__dirname, 'imgesfurniture'), {
    setHeaders: (res, filePath) => {
        // ตั้งค่า headers สำหรับรูปภาพ
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
            res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.webp')) {
            res.setHeader('Content-Type', 'image/webp');
        } else if (filePath.endsWith('.gif')) {
            res.setHeader('Content-Type', 'image/gif');
        }
        // ตั้งค่า cache headers เพื่อเพิ่มประสิทธิภาพ
        res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
}));

// Database Configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306, // XAMPP default port
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '', // XAMPP default is empty
    database: process.env.DB_NAME || 'sangsawang_furniture'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

const ensureCustomerAltAddressesColumn = async () => {
    try {
        await pool.execute('ALTER TABLE customer ADD COLUMN customer_alt_addresses TEXT NULL');
        console.log('Added customer_alt_addresses column');
    } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
            console.warn('Failed to ensure customer_alt_addresses column:', error.message);
        }
    }
};

const ensureCustomerEmailVerificationColumns = async () => {
    try {
        await pool.execute(
            'ALTER TABLE customer ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0'
        );
        console.log('Added email_verified column');
    } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
            console.warn('Failed to add email_verified column:', error.message);
        }
    }

    try {
        await pool.execute(
            'ALTER TABLE customer ADD COLUMN email_verification_token VARCHAR(255) NULL'
        );
        console.log('Added email_verification_token column');
    } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
            console.warn('Failed to add email_verification_token column:', error.message);
        }
    }

    try {
        await pool.execute(
            'ALTER TABLE customer ADD COLUMN email_verification_expires DATETIME NULL'
        );
        console.log('Added email_verification_expires column');
    } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
            console.warn('Failed to add email_verification_expires column:', error.message);
        }
    }
};

const ensureOrderShippingAddressColumn = async () => {
    try {
        await pool.execute('ALTER TABLE `order` ADD COLUMN shipping_address TEXT NULL');
        console.log('Added shipping_address column to order');
    } catch (error) {
        if (error.code !== 'ER_DUP_FIELDNAME') {
            console.warn('Failed to ensure shipping_address column:', error.message);
        }
    }
};

const ensureCartItemsTable = async () => {
    // ตาราง cart_item ใช้เก็บสินค้าในตะกร้าของลูกค้าแต่ละคนแบบถาวรในฐานข้อมูล
    try {
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS cart_item (
                cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
                customer_id INT NOT NULL,
                product_id INT NOT NULL,
                pricing_type VARCHAR(32) NOT NULL,
                pricing_label VARCHAR(255),
                quantity INT NOT NULL DEFAULT 1,
                unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_cart_item (customer_id, product_id, pricing_type),
                CONSTRAINT fk_cart_item_customer FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON DELETE CASCADE,
                CONSTRAINT fk_cart_item_product FOREIGN KEY (product_id) REFERENCES product(product_id) ON DELETE CASCADE
            )
        `);
    } catch (error) {
        console.warn('Failed to ensure cart_item table:', error.message);
    }
};

ensureCustomerAltAddressesColumn();
ensureCustomerEmailVerificationColumns();
ensureOrderShippingAddressColumn();
ensureCartItemsTable();

// Email configuration
let mailTransporter = null;
let mailFromAddress = null;

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpSecure = process.env.SMTP_SECURE === 'true';
const smtpFrom = process.env.EMAIL_FROM;
const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3001';
const EMAIL_VERIFICATION_TTL_MINUTES = Number(process.env.EMAIL_VERIFICATION_TTL_MINUTES || 15);
const EMAIL_OTP_LENGTH = Number(process.env.EMAIL_OTP_LENGTH || 6);

if (smtpHost && smtpUser && smtpPass) {
    try {
        mailTransporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });
        mailFromAddress = smtpFrom || `Sangsawang Furniture <${smtpUser}>`;
        mailTransporter.verify().catch((err) => {
            console.error('SMTP verification failed:', err);
        });
    } catch (error) {
        console.error('Failed to initialize SMTP transporter:', error);
        mailTransporter = null;
    }
} else {
    console.info('Email notifications are disabled. Missing SMTP configuration.');
}

const sendSystemEmail = async ({ to, subject, text, html }) => {
    if (!mailTransporter) {
        console.info('Skipped sending email (email not configured):', { to, subject });
        return;
    }

    try {
        await mailTransporter.sendMail({
            from: mailFromAddress,
            to,
            subject,
            text,
            html
        });
    } catch (error) {
        console.error('Failed to send email:', error);
    }
};

const formatCurrencyTH = (value) => {
    const number = Number(value) || 0;
    return number.toLocaleString('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const buildAwaitingPaymentEmail = (order, customer) => {
    const customerName = [customer.customer_fname, customer.customer_lname].filter(Boolean).join(' ').trim() || 'ลูกค้า';
    const orderNumber = order.order_id;
    const orderDate = new Date(order.order_date).toLocaleDateString('th-TH');
    const totalAmount = formatCurrencyTH(order.total_amount);
    const paymentMethod = (order.payment_method || '').toString().toLowerCase();
    const periods = order.installment_periods || 1;
    const isInstallment = paymentMethod.includes('install') || periods > 1;
    const paymentInstruction = isInstallment
        ? `ยอดผ่อนต่อเดือน: ${formatCurrencyTH(order.monthly_payment)} (${periods} งวด)`
        : 'กรุณาชำระเต็มจำนวนภายในเวลาที่กำหนด';

    const subject = `คำสั่งซื้อ #${orderNumber} ได้รับการอนุมัติแล้ว`;
    const text = `เรียน ${customerName}

คำสั่งซื้อหมายเลข #${orderNumber} เมื่อวันที่ ${orderDate} ได้รับการอนุมัติเรียบร้อยแล้ว
ยอดรวมทั้งสิ้น ${totalAmount}
${paymentInstruction}

กรุณาดำเนินการชำระเงินผ่านช่องทางที่สะดวก และอัปโหลดหลักฐานการชำระเงินในระบบ

ขอบคุณที่ไว้วางใจแสงสว่างเฟอร์นิเจอร์`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #2a1f1a;">
            <h2 style="color:#b37a4c;">คำสั่งซื้อของคุณได้รับการอนุมัติแล้ว</h2>
            <p>เรียน ${customerName},</p>
            <p>คำสั่งซื้อหมายเลข <strong>#${orderNumber}</strong> เมื่อวันที่ <strong>${orderDate}</strong> ได้รับการอนุมัติเรียบร้อยแล้ว</p>
            <div style="background:#fdf6ed;border-radius:10px;padding:16px;margin-bottom:16px;">
                <p style="margin:0;"><strong>ยอดรวม:</strong> ${totalAmount}</p>
                <p style="margin:0;"><strong>วิธีชำระเงิน:</strong> ${isInstallment ? 'ผ่อนชำระ' : 'ชำระเต็มจำนวน'}</p>
                <p style="margin:0;">${isInstallment
                    ? `ยอดผ่อนต่อเดือน: <strong>${formatCurrencyTH(order.monthly_payment)}</strong> (${periods} งวด)`
                    : 'กรุณาชำระเต็มจำนวนภายในเวลาที่กำหนด'}</p>
            </div>
            <p>กรุณาดำเนินการชำระเงินและอัปโหลดหลักฐานในระบบเพื่อให้ทีมงานดำเนินการต่อ</p>
            <p>หากมีข้อสงสัย สามารถติดต่อทีมงานแสงสว่างเฟอร์นิเจอร์ได้ทุกเวลา</p>
            <p style="margin-top:24px;">ขอแสดงความนับถือ,<br/>ทีมงานแสงสว่างเฟอร์นิเจอร์</p>
        </div>
    `;

    return { subject, text, html };
};

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const generateEmailVerificationOtp = () => {
    const otp = Array.from({ length: EMAIL_OTP_LENGTH })
        .map(() => Math.floor(Math.random() * 10))
        .join('');
    const hashedOtp = hashValue(otp);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);
    return { otp, hashedOtp, expiresAt };
};

const buildEmailVerificationOtpEmail = (customer, otp) => {
    const customerName =
        [customer.customer_fname, customer.customer_lname].filter(Boolean).join(' ').trim() ||
        customer.customer_username ||
        'ลูกค้า';
    const subject = 'รหัส OTP สำหรับยืนยันอีเมลกับแสงสว่างเฟอร์นิเจอร์';
    const text = `เรียน ${customerName}

รหัส OTP สำหรับยืนยันอีเมลของคุณคือ: ${otp}

กรุณากรอกรหัสดังกล่าวภายใน ${EMAIL_VERIFICATION_TTL_MINUTES} นาที

หากคุณไม่ได้ทำรายการนี้สามารถละเว้นอีเมลนี้ได้

ขอบคุณที่ไว้วางใจแสงสว่างเฟอร์นิเจอร์`;

    const html = `
        <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #2a1f1a;">
            <h2 style="color:#b37a4c;">รหัส OTP สำหรับยืนยันอีเมล</h2>
            <p>เรียน ${customerName},</p>
            <p>เพื่อเปิดใช้งานบัญชีของคุณ กรุณากรอกรหัส OTP 6 หลักด้านล่างภายใน ${EMAIL_VERIFICATION_TTL_MINUTES} นาที</p>
            <p style="margin:22px 0; font-size: 2rem; letter-spacing: 8px; font-weight: 700;">${otp}</p>
            <p>หากคุณไม่ได้ทำรายการนี้สามารถละเว้นอีเมลนี้ได้</p>
            <p style="margin-top:24px;">ขอแสดงความนับถือ,<br/>ทีมงานแสงสว่างเฟอร์นิเจอร์</p>
        </div>
    `;

    return { subject, text, html };
};

const parseJsonArray = (value) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value;
    }

    try {
        if (typeof value === 'string') {
            return JSON.parse(value);
        }

        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        console.warn('Failed to parse JSON array value:', value, error);
        return [];
    }
};

const parseProductImages = (value) => {
    if (!value) {
        return [];
    }

    if (Array.isArray(value)) {
        return value.map((item) => String(item).trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            return [];
        }
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                return Array.isArray(parsed)
                    ? parsed.map((item) => String(item).trim()).filter(Boolean)
                    : [];
            } catch (error) {
                console.warn('Failed to parse product images JSON:', trimmed, error);
                return trimmed ? [trimmed] : [];
            }
        }
        return [trimmed];
    }

    return [];
};

const getPrimaryProductImage = (value, fallback = '') => {
    const images = parseProductImages(value);
    if (images.length > 0) {
        // Normalize image path: ensure it has /images/ prefix if it's a local file
        const firstImage = images[0];
        return normalizeImagePath(firstImage) || firstImage;
    }
    if (typeof value === 'string' && value.trim()) {
        return normalizeImagePath(value.trim()) || value.trim();
    }
    return fallback;
};

// Normalize image paths: ensure they have /images/ prefix if they're local files
const normalizeImagePath = (path) => {
    if (!path || typeof path !== 'string') {
        return path;
    }
    const trimmed = String(path).trim();
    if (!trimmed) {
        return trimmed;
    }
    // ถ้าเป็น URL แบบเต็ม (http://, https://, data:, blob:) ให้ใช้ตามนั้น
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || 
        trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }
    // ถ้ามี prefix /images/ อยู่แล้ว ให้ใช้ตามนั้น
    if (trimmed.startsWith('/images/')) {
        return trimmed;
    }
    // ถ้าเป็น path ที่เริ่มต้นด้วย / แต่ไม่ใช่ /images/ ให้เพิ่ม /images/
    if (trimmed.startsWith('/')) {
        return `/images${trimmed}`;
    }
    // ถ้าเป็นชื่อไฟล์ล้วน หรือ path ปกติ ให้เพิ่ม /images/
    return `/images/${trimmed}`;
};

const normalizeImagesInput = (input, fallback) => {
    const normalizeArray = (arr) => {
        return arr.map((item) => {
            const normalized = normalizeImagePath(String(item).trim());
            return normalized;
        }).filter(Boolean);
    };

    if (Array.isArray(input)) {
        return normalizeArray(input);
    }
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) {
            return [];
        }
        if (trimmed.startsWith('[')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return normalizeArray(parsed.map((item) => String(item).trim()));
                }
            } catch (error) {
                console.warn('Failed to parse images input:', trimmed, error);
            }
        }
        const normalized = normalizeImagePath(trimmed);
        return normalized ? [normalized] : [];
    }
    if (fallback !== undefined) {
        return normalizeImagesInput(fallback);
    }
    return [];
};

const DEFAULT_PRODUCT_IMAGE =
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500';

const INSTALLMENT_MIN_PERIODS = 2;
const INSTALLMENT_MAX_PERIODS = 12;
const DEFAULT_INSTALLMENT_PERIODS = 12;

const getInstallmentRateByMonths = (months = DEFAULT_INSTALLMENT_PERIODS) => {
    const normalized = Number(months);
    if (!Number.isFinite(normalized) || normalized < INSTALLMENT_MIN_PERIODS) {
        return 0;
    }
    if (normalized >= INSTALLMENT_MAX_PERIODS) {
        return 0.21;
    }
    return 0.1 + (normalized - INSTALLMENT_MIN_PERIODS) * 0.01;
};

const calculateInstallmentPrice = (basePrice, months = DEFAULT_INSTALLMENT_PERIODS) => {
    const price = Number(basePrice);
    if (!Number.isFinite(price) || price <= 0) {
        return null;
    }
    const rate = getInstallmentRateByMonths(months);
    return Math.round(price * (1 + rate));
};

const toCleanString = (value) => {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
};

const sanitizePhone = (value) => {
    const cleaned = toCleanString(value).replace(/\D+/g, '');
    return cleaned;
};

const normalizeShippingRecord = (input) => {
    const base = {
        recipientName: '',
        recipientSurname: '',
        phone: '',
        address: ''
    };

    if (!input) {
        return base;
    }

    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (!trimmed) {
            return base;
        }

        if (trimmed.startsWith('{')) {
            try {
                return normalizeShippingRecord(JSON.parse(trimmed));
            } catch (error) {
                console.warn('Failed to parse shipping record JSON:', trimmed, error);
                return { ...base, address: trimmed };
            }
        }

        return { ...base, address: trimmed };
    }

    return {
        recipientName: toCleanString(input.recipientName),
        recipientSurname: toCleanString(input.recipientSurname),
        phone: sanitizePhone(input.phone),
        address: toCleanString(input.address)
    };
};

const normalizeShippingCollection = (value) => {
    if (!value) {
        return [];
    }

    let items = [];

    if (Array.isArray(value)) {
        items = value;
    } else if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) {
            items = [];
        } else if (trimmed.startsWith('[')) {
            try {
                items = JSON.parse(trimmed);
            } catch (error) {
                console.warn('Failed to parse shipping collection JSON array:', trimmed, error);
                items = [];
            }
        } else {
            items = [trimmed];
        }
    } else {
        items = parseJsonArray(value);
    }

    return items
        .map((entry) => normalizeShippingRecord(entry))
        .filter((entry) => entry.address || entry.recipientName || entry.recipientSurname || entry.phone);
};

const CART_PRICING_LABELS = {
    cash: 'ซื้อสด',
    cashPromo: 'ซื้อสดโปรโมชัน',
    installment: 'ซื้อผ่อน',
    installmentPromo: 'ซื้อผ่อนโปรโมชัน'
};

const ORDER_STATUS_VALUES = new Set([
    'pending',
    'awaiting_payment',
    'approved',
    'waiting_for_delivery',
    'completed',
    'cancelled',
    'cancelled_by_customer'
]);

const ORDER_STATUS_LABELS = {
    pending: 'รออนุมัติ',
    awaiting_payment: 'รอชำระเงิน',
    approved: 'อนุมัติแล้ว',
    waiting_for_delivery: 'รอจัดส่ง',
    completed: 'ส่งมอบสำเร็จ',
    cancelled: 'ยกเลิกโดยผู้ดูแล',
    cancelled_by_customer: 'ลูกค้ายกเลิก'
};

const normalizeOrderStatus = (value) => String(value || '').trim().toLowerCase();

const getOrderStatusLabel = (status) => {
    const normalized = normalizeOrderStatus(status);
    return ORDER_STATUS_LABELS[normalized] || status;
};

const fetchOrderWithCustomer = async (orderId) => {
    const [rows] = await pool.execute(
        `SELECT o.*, 
                c.customer_fname, 
                c.customer_lname, 
                c.customer_email, 
                c.customer_tel
         FROM \`order\` o
         JOIN customer c ON o.customer_id = c.customer_id
         WHERE o.order_id = ?`,
        [orderId]
    );
    return rows;
};

const setOrderStatus = async (orderId, desiredStatus, options = {}) => {
    const { sendNotification = true, allowedCurrentStatuses } = options || {};
    const normalizedTargetStatus = normalizeOrderStatus(desiredStatus);

    if (!ORDER_STATUS_VALUES.has(normalizedTargetStatus)) {
        return { success: false, code: 'INVALID_STATUS', newStatus: normalizedTargetStatus };
    }

    const orderRows = await fetchOrderWithCustomer(orderId);
    if (orderRows.length === 0) {
        return { success: false, code: 'NOT_FOUND', newStatus: normalizedTargetStatus };
    }

    const order = orderRows[0];
    const currentStatus = normalizeOrderStatus(order.order_status);

    if (Array.isArray(allowedCurrentStatuses) && allowedCurrentStatuses.length > 0) {
        const normalizedAllowed = allowedCurrentStatuses.map(normalizeOrderStatus);
        if (!normalizedAllowed.includes(currentStatus)) {
            return {
                success: false,
                code: 'INVALID_TRANSITION',
                previousStatus: currentStatus,
                newStatus: normalizedTargetStatus,
                order
            };
        }
    }

    if (currentStatus === normalizedTargetStatus) {
        order.order_status = normalizedTargetStatus;
        return {
            success: true,
            statusChanged: false,
            previousStatus: currentStatus,
            newStatus: normalizedTargetStatus,
            order
        };
    }

    await pool.execute('UPDATE `order` SET order_status = ? WHERE order_id = ?', [
        normalizedTargetStatus,
        orderId
    ]);

    order.order_status = normalizedTargetStatus;

    if (sendNotification && normalizedTargetStatus === 'awaiting_payment') {
        try {
            const emailPayload = buildAwaitingPaymentEmail(order, order);
            if (order.customer_email) {
                await sendSystemEmail({
                    to: order.customer_email,
                    subject: emailPayload.subject,
                    text: emailPayload.text,
                    html: emailPayload.html
                });
            }
        } catch (notificationError) {
            console.error('Failed to send awaiting payment notification:', notificationError);
        }
    }

    return {
        success: true,
        statusChanged: true,
        previousStatus: currentStatus,
        newStatus: normalizedTargetStatus,
        order
    };
};

const resolveCartBasePrice = (row) => {
    if (!row) {
        return null;
    }
    if (row.pricing_type === 'cashPromo') {
        return row.price_cash != null ? Number(row.price_cash) || null : null;
    }
    if (row.pricing_type === 'installmentPromo') {
        return row.price_installment != null ? Number(row.price_installment) || null : null;
    }
    return null;
};

const normalizeCartItemRow = (row) => {
    const images = parseProductImages(row.product_image);
    return {
        id: row.cart_item_id,
        product_id: row.product_id,
        product_name: row.product_name,
        product_image: getPrimaryProductImage(row.product_image),
        product_images: images,
        quantity: Number(row.quantity) || 0,
        unitPrice: Number(row.unit_price) || 0,
        pricingType: row.pricing_type,
        pricingLabel: row.pricing_label || CART_PRICING_LABELS[row.pricing_type] || '',
        product_price: Number(row.unit_price) || 0,
        basePrice: resolveCartBasePrice(row)
    };
};

const getCartItemsForCustomer = async (customerId) => {
    const [rows] = await pool.execute(
        `SELECT 
            ci.cart_item_id,
            ci.product_id,
            ci.quantity,
            ci.pricing_type,
            ci.pricing_label,
            ci.unit_price,
            p.product_name,
            p.product_image,
            p.price_cash,
            p.price_cash_promo,
            p.price_installment,
            p.price_installment_promo
         FROM cart_item ci
         INNER JOIN product p ON p.product_id = ci.product_id
         WHERE ci.customer_id = ?
         ORDER BY ci.cart_item_id DESC`,
        [customerId]
    );
    return rows.map((row) => normalizeCartItemRow(row));
};

const calculateCartCount = (items) =>
    Array.isArray(items) ? items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) : 0;

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Sangsawang Furniture API is running' });
});

// ==================== CUSTOMER ROUTES ====================

// Customer Register
app.post('/api/customer/register', async (req, res) => {
    try {
        const { username, password, fname, lname, email, tel, address } = req.body;
        const sanitizedTel = sanitizePhone(tel);

        // Check if user exists
        const [existingUser] = await pool.execute(
            'SELECT * FROM customer WHERE customer_username = ? OR customer_email = ?',
            [username, email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert customer
        const [result] = await pool.execute(
            'INSERT INTO customer (customer_username, customer_password, customer_fname, customer_lname, customer_email, customer_tel, customer_address, customer_alt_addresses) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [username, hashedPassword, fname, lname, email, sanitizedTel, address, JSON.stringify([])]
        );

        const customerId = result.insertId;

        res.json({
            message: 'Registration successful',
            customer_id: customerId,
            verificationRequired: false
        });
    } catch (error) {
        console.error('Register error:', error);
        const sqlMessage = error?.sqlMessage || error?.message;
        const statusCode =
            error?.statusCode && Number.isInteger(error.statusCode)
                ? error.statusCode
                : error?.code === 'ER_DUP_ENTRY'
                ? 400
                : 500;
        const message =
            error?.code === 'ER_DUP_ENTRY'
                ? 'Username or email already exists'
                : sqlMessage || 'Registration failed';
        res.status(statusCode).json({ error: message });
    }
});

// Customer Login
app.post('/api/customer/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [users] = await pool.execute(
            'SELECT * FROM customer WHERE customer_username = ? OR customer_email = ? LIMIT 1',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.customer_password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.customer_id, username: user.customer_username, role: 'customer' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        const normalizedAddress = normalizeShippingRecord(user.customer_address);
        res.json({
            token,
            user: {
                id: user.customer_id,
                username: user.customer_username,
                name: `${toCleanString(user.customer_fname)} ${toCleanString(user.customer_lname)}`.trim(),
                firstName: toCleanString(user.customer_fname) || normalizedAddress.recipientName,
                lastName: toCleanString(user.customer_lname) || normalizedAddress.recipientSurname,
                customer_fname: toCleanString(user.customer_fname),
                customer_lname: toCleanString(user.customer_lname),
                email: user.customer_email,
                phone: sanitizePhone(user.customer_tel) || normalizedAddress.phone,
                address: normalizedAddress.address,
                role: 'customer',
                emailVerified: Boolean(user.email_verified)
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Customer Profile
app.post('/api/customer/verify-email', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'กรุณาระบุอีเมลและรหัส OTP' });
        }

        const trimmedEmail = String(email).trim().toLowerCase();
        const hashedOtp = hashValue(String(otp).trim());

        const [customers] = await pool.execute(
            `SELECT customer_id, email_verified, email_verification_token, email_verification_expires, customer_email
             FROM customer 
             WHERE LOWER(customer_email) = ?`,
            [trimmedEmail]
        );

        if (customers.length === 0) {
            return res.status(400).json({ error: 'ไม่พบข้อมูลอีเมลนี้ในระบบ' });
        }

        const customer = customers[0];

        if (customer.email_verified) {
            return res.json({ message: 'อีเมลนี้ได้รับการยืนยันแล้ว', alreadyVerified: true });
        }

        if (!customer.email_verification_token) {
            return res.status(400).json({ error: 'ยังไม่มีรหัส OTP สำหรับอีเมลนี้ กรุณาขอรหัสใหม่' });
        }

        if (customer.email_verification_expires && new Date(customer.email_verification_expires) < new Date()) {
            return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่' });
        }

        if (customer.email_verification_token !== hashedOtp) {
            return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
        }

        await pool.execute(
            `UPDATE customer 
             SET email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL 
             WHERE customer_id = ?`,
            [customer.customer_id]
        );

        res.json({ message: 'ยืนยันอีเมลสำเร็จ' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'ไม่สามารถยืนยันอีเมลได้' });
    }
});

app.post('/api/customer/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'กรุณาระบุอีเมล' });
        }

        const [customers] = await pool.execute(
            `SELECT customer_id, customer_fname, customer_lname, customer_username, email_verified 
             FROM customer WHERE customer_email = ?`,
            [email]
        );

        if (customers.length === 0) {
            // ไม่เปิดเผยข้อมูลว่ามีอีเมลนี้หรือไม่
            return res.json({ message: 'หากอีเมลนี้อยู่ในระบบ เราได้ส่งรหัส OTP ใหม่ให้แล้ว' });
        }

        const customer = customers[0];

        if (customer.email_verified) {
            return res.status(400).json({ error: 'อีเมลนี้ได้รับการยืนยันแล้ว' });
        }

        const { otp, hashedOtp, expiresAt } = generateEmailVerificationOtp();
        await pool.execute(
            'UPDATE customer SET email_verification_token = ?, email_verification_expires = ?, email_verified = 0 WHERE customer_id = ?',
            [hashedOtp, expiresAt, customer.customer_id]
        );

        const emailPayload = buildEmailVerificationOtpEmail(customer, otp);

        await sendSystemEmail({
            to: email,
            subject: emailPayload.subject,
            text: emailPayload.text,
            html: emailPayload.html
        });

        res.json({ message: 'ส่งรหัส OTP สำหรับยืนยันอีเมลแล้ว' });
    } catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'ไม่สามารถส่งรหัส OTP ได้' });
    }
});

app.get('/api/customer/profile', authenticateToken, async (req, res) => {
    try {
        const [customers] = await pool.execute(
            `SELECT customer_id, customer_username, customer_fname, customer_lname, customer_email, customer_tel, 
                    customer_address, customer_alt_addresses, email_verified 
             FROM customer WHERE customer_id = ?`,
            [req.user.id]
        );

        if (customers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const customer = customers[0];
        const primaryShipping = normalizeShippingRecord(customer.customer_address);
        const alternativeAddresses = normalizeShippingCollection(customer.customer_alt_addresses);

        res.json({
            customer_id: customer.customer_id,
            customer_username: customer.customer_username,
            customer_fname: customer.customer_fname,
            customer_lname: customer.customer_lname,
            customer_email: customer.customer_email,
            customer_tel: customer.customer_tel,
            customer_address: primaryShipping.address,
            alternativeAddresses,
            shipping_profile: {
                primary: primaryShipping,
                alternatives: alternativeAddresses
            },
            email_verified: Boolean(customer.email_verified)
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

// Update Customer Profile
app.put('/api/customer/profile', authenticateToken, async (req, res) => {
    try {
        const {
            fname,
            lname,
            email,
            tel,
            primaryShipping,
            alternativeAddresses,
            address // legacy field
        } = req.body;
        const sanitizedTel = sanitizePhone(tel);

        const primaryShippingInput = primaryShipping ?? address ?? null;
        const normalizedPrimaryShipping = normalizeShippingRecord(
            primaryShippingInput || {
                recipientName: fname,
                recipientSurname: lname,
                phone: sanitizedTel,
                address: ''
            }
        );

        const normalizedAlternativeAddresses = normalizeShippingCollection(
            alternativeAddresses ?? req.body.alternativeAddresses ?? []
        );

        const [currentCustomers] = await pool.execute(
            'SELECT customer_email, customer_fname, customer_lname, customer_username FROM customer WHERE customer_id = ?',
            [req.user.id]
        );

        if (currentCustomers.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const currentCustomer = currentCustomers[0];
        const emailChanged = currentCustomer.customer_email !== email;

        const updateFields = [
            fname,
            lname,
            email,
            sanitizedTel,
            JSON.stringify(normalizedPrimaryShipping),
            JSON.stringify(normalizedAlternativeAddresses)
        ];
        let updateQuery =
            'UPDATE customer SET customer_fname = ?, customer_lname = ?, customer_email = ?, customer_tel = ?, customer_address = ?, customer_alt_addresses = ?';

        let verificationPayload = null;

        if (emailChanged) {
            const { otp, hashedOtp, expiresAt } = generateEmailVerificationOtp();
            updateQuery += ', email_verified = 0, email_verification_token = ?, email_verification_expires = ?';
            updateFields.push(hashedOtp, expiresAt);
            verificationPayload = {
                otp,
                customer: {
                    customer_fname: fname,
                    customer_lname: lname,
                    customer_username: currentCustomer.customer_username
                },
                email
            };
        }

        updateQuery += ' WHERE customer_id = ?';
        updateFields.push(req.user.id);

        await pool.execute(updateQuery, updateFields);

        if (verificationPayload) {
            const emailPayload = buildEmailVerificationOtpEmail(verificationPayload.customer, verificationPayload.otp);

            await sendSystemEmail({
                to: verificationPayload.email,
                subject: emailPayload.subject,
                text: emailPayload.text,
                html: emailPayload.html
            });
        }

        res.json({
            message: emailChanged
                ? `อัปเดตข้อมูลสำเร็จ กรุณากรอกรหัส OTP ที่ส่งไปยัง ${email} ภายใน ${EMAIL_VERIFICATION_TTL_MINUTES} นาที`
                : 'Profile updated successfully',
            emailVerificationRequired: emailChanged
        });
    } catch (error) {
        console.error('Update profile error:', error);
        const errorMessage = error?.sqlMessage || error?.message || 'Failed to update profile';
        res.status(500).json({ error: errorMessage });
    }
});

// Update Customer Password
app.put('/api/customer/password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านให้ครบถ้วน' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ควรมีความยาวอย่างน้อย 6 ตัวอักษร' });
        }

        const [users] = await pool.execute(
            'SELECT customer_password FROM customer WHERE customer_id = ?',
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        const user = users[0];
        const isCurrentValid = await bcrypt.compare(currentPassword, user.customer_password);

        if (!isCurrentValid) {
            return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await pool.execute(
            'UPDATE customer SET customer_password = ? WHERE customer_id = ?',
            [hashedNewPassword, req.user.id]
        );

        res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'มีข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
});

// API: ดึงรายการสินค้าในตะกร้าของผู้ใช้ที่ล็อกอิน (ใช้ตอนเปิดหน้า /cart หรือ Navbar)
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const items = await getCartItemsForCustomer(req.user.id);
        res.json({ items, count: calculateCartCount(items) });
    } catch (error) {
        console.error('Fetch cart error:', error);
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลตะกร้าได้' });
    }
});

// API: เพิ่ม/แก้จำนวนสินค้าในตะกร้า (mode=set หรือ increment) จากฝั่งเว็บ
app.put('/api/cart/items', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const {
            productId,
            pricingType,
            quantity = 1,
            unitPrice,
            pricingLabel,
            mode = 'set'
        } = req.body || {};

        const productIdNumber = Number(productId);
        if (!productIdNumber || Number.isNaN(productIdNumber)) {
            return res.status(400).json({ error: 'ต้องระบุรหัสสินค้าให้ถูกต้อง' });
        }
        if (!pricingType) {
            return res.status(400).json({ error: 'ต้องระบุรูปแบบราคา' });
        }

        const normalizedPricingType = String(pricingType).trim().slice(0, 32) || 'cash';
        const normalizedMode = String(mode).toLowerCase() === 'increment' ? 'increment' : 'set';
        const parsedQuantity = Number(quantity);
        const quantityValue = Number.isFinite(parsedQuantity) ? parsedQuantity : 1;

        const [existingRows] = await pool.execute(
            'SELECT quantity, unit_price, pricing_label FROM cart_item WHERE customer_id = ? AND product_id = ? AND pricing_type = ? LIMIT 1',
            [customerId, productIdNumber, normalizedPricingType]
        );
        const existing = existingRows.length > 0 ? existingRows[0] : null;
        const existingQuantity = existing ? Number(existing.quantity) || 0 : 0;

        let nextQuantity;
        if (normalizedMode === 'increment') {
            const incrementBy = Number.isFinite(quantityValue) ? quantityValue : 1;
            nextQuantity = existingQuantity + (incrementBy || 1);
        } else {
            nextQuantity = Number.isFinite(quantityValue) ? quantityValue : 1;
        }

        if (nextQuantity <= 0) {
            await pool.execute(
                'DELETE FROM cart_item WHERE customer_id = ? AND product_id = ? AND pricing_type = ?',
                [customerId, productIdNumber, normalizedPricingType]
            );
        } else {
            const providedUnitPrice = Number(unitPrice);
            const resolvedUnitPrice = Number.isFinite(providedUnitPrice)
                ? providedUnitPrice
                : existing
                ? Number(existing.unit_price) || 0
                : 0;
            const resolvedPricingLabel =
                pricingLabel !== undefined && pricingLabel !== null && String(pricingLabel).trim() !== ''
                    ? String(pricingLabel)
                    : existing?.pricing_label || CART_PRICING_LABELS[normalizedPricingType] || '';

            await pool.execute(
                `INSERT INTO cart_item (customer_id, product_id, pricing_type, quantity, unit_price, pricing_label)
                 VALUES (?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), unit_price = VALUES(unit_price), pricing_label = VALUES(pricing_label)`,
                [
                    customerId,
                    productIdNumber,
                    normalizedPricingType,
                    Math.max(1, Math.round(nextQuantity)),
                    resolvedUnitPrice,
                    resolvedPricingLabel || null
                ]
            );
        }

        const items = await getCartItemsForCustomer(customerId);
        res.json({ items, count: calculateCartCount(items) });
    } catch (error) {
        console.error('Upsert cart item error:', error);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตตะกร้าได้' });
    }
});

// API: ลบสินค้า 1 รายการออกจากตะกร้า
app.delete('/api/cart/items', authenticateToken, async (req, res) => {
    try {
        const customerId = req.user.id;
        const { productId, pricingType } = req.body || {};
        const productIdNumber = Number(productId);

        if (!productIdNumber || Number.isNaN(productIdNumber) || !pricingType) {
            return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วนสำหรับการลบสินค้าออกจากตะกร้า' });
        }

        await pool.execute(
            'DELETE FROM cart_item WHERE customer_id = ? AND product_id = ? AND pricing_type = ?',
            [customerId, productIdNumber, String(pricingType).trim().slice(0, 32)]
        );

        const items = await getCartItemsForCustomer(customerId);
        res.json({ items, count: calculateCartCount(items) });
    } catch (error) {
        console.error('Delete cart item error:', error);
        res.status(500).json({ error: 'ไม่สามารถลบสินค้าออกจากตะกร้าได้' });
    }
});

// API: ล้างตะกร้าทั้งหมด (ใช้หลังส่งคำสั่งซื้อสำเร็จ)
app.delete('/api/cart', authenticateToken, async (req, res) => {
    try {
        await pool.execute('DELETE FROM cart_item WHERE customer_id = ?', [req.user.id]);
        res.json({ items: [], count: 0 });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'ไม่สามารถล้างตะกร้าได้' });
    }
});

// ==================== ADMIN ROUTES ====================

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const [admins] = await pool.execute(
            'SELECT * FROM admin WHERE admin_username = ?',
            [username]
        );

        if (admins.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const admin = admins[0];
        const storedPassword = admin.admin_password || '';
        let validPassword = false;

        if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$')) {
            validPassword = await bcrypt.compare(password, storedPassword);
        } else {
            // fallback for legacy plaintext passwords
            if (password === storedPassword) {
                validPassword = true;
                try {
                    const newHash = await bcrypt.hash(password, 10);
                    await pool.execute(
                        'UPDATE admin SET admin_password = ? WHERE admin_id = ?',
                        [newHash, admin.admin_id]
                    );
                    admin.admin_password = newHash;
                } catch (hashErr) {
                    console.warn('Failed to rehash legacy admin password:', hashErr);
                }
            } else {
                validPassword = false;
            }
        }

        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: admin.admin_id, username: admin.admin_username, role: 'admin' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: admin.admin_id,
                username: admin.admin_username,
                name: `${admin.admin_fname} ${admin.admin_lname}`,
                email: admin.admin_email,
                role: 'admin'
            }
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Access denied. Admin only.' });
    }
};

// Admin notification summary (new orders & customers)
app.get('/api/admin/notification-summary', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orderRows] = await pool.execute(
            'SELECT MAX(order_id) AS latest_order_id, SUM(order_status = "pending") AS pending_orders FROM `order`'
        );
        const [customerRows] = await pool.execute(
            'SELECT MAX(customer_id) AS latest_customer_id, COUNT(*) AS total_customers FROM customer'
        );

        const orderRow = orderRows[0] || {};
        const customerRow = customerRows[0] || {};

        res.json({
            latestOrderId: Number(orderRow.latest_order_id) || 0,
            pendingOrders: Number(orderRow.pending_orders) || 0,
            latestCustomerId: Number(customerRow.latest_customer_id) || 0,
            totalCustomers: Number(customerRow.total_customers) || 0
        });
    } catch (error) {
        console.error('Admin notification summary error:', error);
        res.status(500).json({ error: 'Failed to load notification summary' });
    }
});

// ==================== PRODUCT ROUTES ====================

// Upload image file (Admin only)
app.post('/api/upload', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'ไม่มีไฟล์ที่อัปโหลด' });
        }

        // สร้าง path สำหรับไฟล์ที่อัปโหลด
        const category = req.body.category || '';
        let imagePath = '';
        let finalFilePath = req.file.path;
        
        // ถ้ามี category ให้ย้ายไฟล์ไปยัง category folder
        if (category && category.trim()) {
            const categoryDir = path.join(__dirname, 'images', category.trim());
            // สร้างโฟลเดอร์ category ถ้ายังไม่มี
            if (!fs.existsSync(categoryDir)) {
                fs.mkdirSync(categoryDir, { recursive: true });
            }
            
            // ย้ายไฟล์ไปยัง category folder
            const newFilePath = path.join(categoryDir, req.file.filename);
            try {
                await fs.promises.rename(req.file.path, newFilePath);
                finalFilePath = newFilePath;
                imagePath = `/images/${category.trim()}/${req.file.filename}`;
            } catch (moveError) {
                console.error('Error moving file to category folder:', moveError);
                // ถ้าย้ายไม่ได้ ให้ใช้ไฟล์เดิม
                imagePath = `/images/${req.file.filename}`;
            }
        } else {
            // ถ้าไม่มี category ให้ใช้ path ในโฟลเดอร์ images โดยตรง
            imagePath = `/images/${req.file.filename}`;
        }

        res.json({
            message: 'อัปโหลดไฟล์สำเร็จ',
            filename: req.file.filename,
            path: imagePath,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ error: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)' });
            }
        }
        res.status(500).json({ error: error.message || 'อัปโหลดไฟล์ไม่สำเร็จ' });
    }
});

// Get categories
app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(
            'SELECT category_id, category_name, category_description FROM category ORDER BY category_name ASC'
        );
        res.json(categories);
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to get categories' });
    }
});

// Get all products
app.get('/api/products', async (req, res) => {
    try {
        const [products] = await pool.execute(
            `SELECT p.*, c.category_name
             FROM product p
             LEFT JOIN category c ON p.category_id = c.category_id
             ORDER BY p.product_id DESC`
        );

        const formattedProducts = products.map(product => {
            const images = parseProductImages(product.product_image);
            const primaryImage = getPrimaryProductImage(product.product_image);
            return {
                ...product,
                product_image: primaryImage,
                product_images: images,
                tags: parseJsonArray(product.tags),
                highlights: parseJsonArray(product.product_highlights)
            };
        });

        res.json(formattedProducts);
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ error: 'Failed to get products' });
    }
});

// Get single product
app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.execute(
            `SELECT p.*, c.category_name
             FROM product p
             LEFT JOIN category c ON p.category_id = c.category_id
             WHERE p.product_id = ?`,
            [req.params.id]
        );
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const product = products[0];
        const images = parseProductImages(product.product_image);
        const primaryImage = getPrimaryProductImage(product.product_image);
        res.json({
            ...product,
            product_image: primaryImage,
            product_images: images,
            tags: parseJsonArray(product.tags),
            highlights: parseJsonArray(product.product_highlights)
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ error: 'Failed to get product' });
    }
});

// Create product (Admin only)
app.post('/api/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            categoryId,
            tags = [],
            highlights = [],
            priceCash,
            priceCashPromo = null,
            image,
            images
        } = req.body;

        const normaliseList = (input) =>
            Array.isArray(input)
                ? input
                : typeof input === 'string' && input.trim().length > 0
                ? input.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
                : [];

        const tagsArray = normaliseList(tags);
        const highlightsArray = normaliseList(highlights);
        const imageList = normalizeImagesInput(images ?? image, image);
        const limitedImages = imageList.slice(0, 4);
        const heroImage = limitedImages[0] || (typeof image === 'string' && image.trim() ? image.trim() : DEFAULT_PRODUCT_IMAGE);
        const storedImageValue = limitedImages.length > 1 ? JSON.stringify(limitedImages) : heroImage;

        const normalizedPriceCash = priceCash != null ? Number(priceCash) : null;
        const normalizedPriceCashPromo = priceCashPromo != null ? Number(priceCashPromo) : null;
        const autoInstallmentPrice = calculateInstallmentPrice(normalizedPriceCash);
        const autoInstallmentPromoPrice =
            normalizedPriceCashPromo != null
                ? calculateInstallmentPrice(normalizedPriceCashPromo)
                : null;

        const [insertResult] = await pool.execute(
            `INSERT INTO product (
                product_name,
                product_description,
                category_id,
                product_image,
                price_cash,
                price_cash_promo,
                price_installment,
                price_installment_promo,
                product_highlights,
                tags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description,
                categoryId || null,
                storedImageValue,
                normalizedPriceCash,
                normalizedPriceCashPromo,
                autoInstallmentPrice,
                autoInstallmentPromoPrice,
                JSON.stringify(highlightsArray),
                JSON.stringify(tagsArray)
            ]
        );

        const productId = insertResult.insertId;

        if (tagsArray.length > 0) {
            const tagValues = tagsArray.map(tag => [productId, tag]);
            await pool.query('INSERT INTO product_tag (product_id, tag) VALUES ?', [tagValues]);
        }

        res.json({ message: 'Product created successfully', product_id: productId });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product (Admin only)
app.put('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const {
            name,
            description,
            categoryId,
            tags = [],
            highlights = [],
            priceCash,
            priceCashPromo = null,
            image,
            images
        } = req.body;

        const normaliseList = (input) =>
            Array.isArray(input)
                ? input
                : typeof input === 'string' && input.trim().length > 0
                ? input.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
                : [];

        const tagsArray = normaliseList(tags);
        const highlightsArray = normaliseList(highlights);
        const imageList = normalizeImagesInput(images ?? image, image);
        const limitedImages = imageList.slice(0, 4);
        const heroImage = limitedImages[0] || (typeof image === 'string' && image.trim() ? image.trim() : DEFAULT_PRODUCT_IMAGE);
        const storedImageValue = limitedImages.length > 1 ? JSON.stringify(limitedImages) : heroImage;

        const normalizedPriceCash = priceCash != null ? Number(priceCash) : null;
        const normalizedPriceCashPromo = priceCashPromo != null ? Number(priceCashPromo) : null;
        const autoInstallmentPrice = calculateInstallmentPrice(normalizedPriceCash);
        const autoInstallmentPromoPrice =
            normalizedPriceCashPromo != null
                ? calculateInstallmentPrice(normalizedPriceCashPromo)
                : null;

        await pool.execute(
            `UPDATE product SET
                product_name = ?,
                product_description = ?,
                category_id = ?,
                product_image = ?,
                price_cash = ?,
                price_cash_promo = ?,
                price_installment = ?,
                price_installment_promo = ?,
                product_highlights = ?,
                tags = ?
             WHERE product_id = ?`,
            [
                name,
                description,
                categoryId || null,
                storedImageValue,
                normalizedPriceCash,
                normalizedPriceCashPromo,
                autoInstallmentPrice,
                autoInstallmentPromoPrice,
                JSON.stringify(highlightsArray),
                JSON.stringify(tagsArray),
                req.params.id
            ]
        );

        await pool.execute('DELETE FROM product_tag WHERE product_id = ?', [req.params.id]);

        if (tagsArray.length > 0) {
            const tagValues = tagsArray.map(tag => [req.params.id, tag]);
            await pool.query('INSERT INTO product_tag (product_id, tag) VALUES ?', [tagValues]);
        }

        res.json({ message: 'Product updated successfully' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (Admin only)
app.delete('/api/products/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await pool.execute('DELETE FROM product WHERE product_id = ?', [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ==================== ORDER ROUTES ====================

// Get all orders (Admin only)
app.get('/api/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [orders] = await pool.execute(
            'SELECT o.*, c.customer_fname, c.customer_lname, c.customer_email, c.customer_tel\n' +
            'FROM `order` o\n' +
            'JOIN customer c ON o.customer_id = c.customer_id\n' +
            'ORDER BY o.order_date DESC'
        );
        res.json(orders);
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

// Admin: Customer overview
app.get('/api/admin/customers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [customers] = await pool.execute(
            'SELECT c.customer_id,\n' +
            '       c.customer_fname,\n' +
            '       c.customer_lname,\n' +
            '       c.customer_username,\n' +
            '       c.customer_email,\n' +
            '       c.customer_tel,\n' +
            '       c.customer_address,\n' +
            '       c.created_at,\n' +
            '       COUNT(o.order_id) AS orders_count,\n' +
            '       COALESCE(SUM(o.total_amount), 0) AS total_spent,\n' +
            '       MAX(o.order_date) AS last_order_date,\n' +
            "       SUM(CASE WHEN o.order_status = 'awaiting_payment' THEN 1 ELSE 0 END) AS awaiting_count,\n" +
            "       SUM(CASE WHEN o.order_status = 'pending' THEN 1 ELSE 0 END) AS pending_count\n" +
            'FROM customer c\n' +
            'LEFT JOIN `order` o ON o.customer_id = c.customer_id\n' +
            'GROUP BY c.customer_id\n' +
            'ORDER BY c.created_at DESC'
        );

        const normalized = customers.map((row) => {
            const shipping = normalizeShippingRecord(row.customer_address);
            return {
                id: row.customer_id,
                firstName: toCleanString(row.customer_fname),
                lastName: toCleanString(row.customer_lname),
                username: toCleanString(row.customer_username),
                email: toCleanString(row.customer_email),
                phone: toCleanString(row.customer_tel),
                address: shipping,
                ordersCount: Number(row.orders_count) || 0,
                awaitingCount: Number(row.awaiting_count) || 0,
                pendingCount: Number(row.pending_count) || 0,
                totalSpent: Number(row.total_spent) || 0,
                lastOrderDate: row.last_order_date,
                createdAt: row.created_at
            };
        });

        res.json(normalized);
    } catch (error) {
        console.error('Get admin customers error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดข้อมูลลูกค้าได้' });
    }
});

app.get('/api/admin/customers/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const customerId = req.params.id;

        const [customerRows] = await pool.execute(
            'SELECT customer_id, customer_fname, customer_lname, customer_username, customer_email, customer_tel, customer_address, created_at\n' +
                'FROM customer WHERE customer_id = ?',
            [customerId]
        );

        if (customerRows.length === 0) {
            return res.status(404).json({ error: 'ไม่พบลูกค้า' });
        }

        const customerRow = customerRows[0];
        const customer = {
            id: customerRow.customer_id,
            firstName: toCleanString(customerRow.customer_fname),
            lastName: toCleanString(customerRow.customer_lname),
            username: toCleanString(customerRow.customer_username),
            email: toCleanString(customerRow.customer_email),
            phone: toCleanString(customerRow.customer_tel),
            address: normalizeShippingRecord(customerRow.customer_address),
            createdAt: customerRow.created_at
        };

        const [orderRows] = await pool.execute(
            `SELECT o.*, od.order_detail_id, od.product_id, od.quantity, od.price, p.product_name, p.product_image\n` +
                'FROM `order` o\n' +
                'LEFT JOIN order_detail od ON od.order_id = o.order_id\n' +
                'LEFT JOIN product p ON od.product_id = p.product_id\n' +
                'WHERE o.customer_id = ?\n' +
                'ORDER BY o.order_date DESC, od.order_detail_id ASC',
            [customerId]
        );

        const ordersMap = new Map();
        orderRows.forEach((row) => {
            let order = ordersMap.get(row.order_id);
            if (!order) {
                order = {
                    order_id: row.order_id,
                    customer_id: row.customer_id,
                    order_date: row.order_date,
                    order_status: row.order_status,
                    total_amount: Number(row.total_amount) || 0,
                    payment_method: row.payment_method,
                    installment_periods: row.installment_periods,
                    monthly_payment: Number(row.monthly_payment) || 0,
                    shipping_address: normalizeShippingRecord(row.shipping_address),
                    items: []
                };
                ordersMap.set(row.order_id, order);
            }

            if (row.product_id) {
                order.items.push({
                    order_detail_id: row.order_detail_id,
                    product_id: row.product_id,
                    product_name: toCleanString(row.product_name),
                    quantity: Number(row.quantity) || 0,
                    price: Number(row.price) || 0,
                    product_image: getPrimaryProductImage(row.product_image)
                });
            }
        });

        const orders = Array.from(ordersMap.values());

        if (orders.length > 0) {
            const orderIds = orders.map((order) => order.order_id);
            const placeholders = orderIds.map(() => '?').join(',');
            const [installmentRows] = await pool.execute(
                `SELECT * FROM installment_payments WHERE order_id IN (${placeholders}) ORDER BY order_id, installment_number`,
                orderIds
            );

            const installmentMap = installmentRows.reduce((acc, row) => {
                const existing = acc.get(row.order_id) || [];
                existing.push({
                    installment_id: row.installment_id,
                    installment_number: row.installment_number,
                    installment_amount: Number(row.installment_amount) || 0,
                    payment_due_date: row.payment_due_date,
                    payment_status: row.payment_status,
                    payment_date: row.payment_date
                });
                acc.set(row.order_id, existing);
                return acc;
            }, new Map());

            orders.forEach((order) => {
                const installments = installmentMap.get(order.order_id) || [];
                order.installments = installments;
                const paidCount = installments.filter((installment) => installment.payment_status === 'paid').length;
                const totalPeriods = order.installment_periods || installments.length || 0;
                order.installmentSummary = {
                    totalPeriods,
                    paidCount,
                    remainingPeriods: totalPeriods > 0 ? Math.max(totalPeriods - paidCount, 0) : 0,
                    nextDue:
                        installments.find((installment) => installment.payment_status !== 'paid')?.payment_due_date || null
                };
            });
        }

        const summary = orders.reduce(
            (acc, order) => {
                acc.totalOrders += 1;
                acc.totalSpent += Number(order.total_amount) || 0;
                const status = (order.order_status || '').toString().toLowerCase();
                if (status === 'awaiting_payment') {
                    acc.awaitingCount += 1;
                }
                if (status === 'pending') {
                    acc.pendingCount += 1;
                }
                const method = (order.payment_method || '').toString().toLowerCase();
                if (method === 'installment') {
                    acc.installmentOrders += 1;
                }
                return acc;
            },
            { totalOrders: 0, totalSpent: 0, awaitingCount: 0, pendingCount: 0, installmentOrders: 0 }
        );

        // Aggregate product history
        const productMap = new Map();
        orders.forEach((order) => {
            order.items.forEach((item) => {
                const key = item.product_id || `${item.product_name}-${item.price}`;
                const existing = productMap.get(key) || {
                    product_id: item.product_id,
                    product_name: item.product_name,
                    total_quantity: 0,
                    total_spent: 0,
                    order_count: 0
                };
                existing.total_quantity += Number(item.quantity) || 0;
                existing.total_spent += Number(item.price) * (Number(item.quantity) || 0);
                existing.order_count += 1;
                productMap.set(key, existing);
            });
        });

        const products = Array.from(productMap.values()).sort((a, b) => b.total_quantity - a.total_quantity);

        res.json({
            customer,
            summary,
            orders,
            products
        });
    } catch (error) {
        console.error('Get admin customer detail error:', error);
        res.status(500).json({ error: 'ไม่สามารถโหลดรายละเอียดลูกค้าได้' });
    }
});

// Get customer orders
app.get('/api/customer/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, od.product_id, od.quantity, p.product_name, p.product_image, p.category_id
             FROM \`order\` o
             LEFT JOIN order_detail od ON o.order_id = od.order_id
             LEFT JOIN product p ON od.product_id = p.product_id
             WHERE o.customer_id = ?
             ORDER BY o.order_date DESC`,
            [req.user.id]
        );

        const grouped = orders.reduce((acc, row) => {
            const existing = acc.get(row.order_id) || {
                order_id: row.order_id,
                customer_id: row.customer_id,
                order_date: row.order_date,
                order_status: row.order_status,
                total_amount: row.total_amount,
                payment_method: row.payment_method,
                installment_periods: row.installment_periods,
                monthly_payment: row.monthly_payment,
                shipping_address: normalizeShippingRecord(row.shipping_address),
                items: []
            };
            if ((!existing.shipping_address || !existing.shipping_address.address) && row.shipping_address) {
                existing.shipping_address = normalizeShippingRecord(row.shipping_address);
            }
                if (row.product_id) {
                const itemImages = parseProductImages(row.product_image);
                existing.items.push({
                    product_id: row.product_id,
                    quantity: row.quantity,
                    product_name: row.product_name,
                        product_image: getPrimaryProductImage(row.product_image),
                        product_images: itemImages,
                    category_id: row.category_id
                });
            }
            acc.set(row.order_id, existing);
            return acc;
        }, new Map());

        res.json(Array.from(grouped.values()));
    } catch (error) {
        console.error('Get customer orders error:', error);
        res.status(500).json({ error: 'Failed to get orders' });
    }
});

app.put('/api/orders/:id/status', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body || {};
        if (!status) {
            return res.status(400).json({ error: 'กรุณาระบุสถานะใหม่' });
        }

        const result = await setOrderStatus(req.params.id, status, { sendNotification: true });

        if (!result.success) {
            if (result.code === 'NOT_FOUND') {
                return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
            }
            if (result.code === 'INVALID_STATUS') {
                return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
            }
            if (result.code === 'INVALID_TRANSITION') {
                return res.status(400).json({
                    error: `ไม่สามารถเปลี่ยนสถานะจาก ${getOrderStatusLabel(result.previousStatus)} เป็น ${getOrderStatusLabel(
                        result.newStatus
                    )} ได้`
                });
            }
            return res.status(400).json({ error: 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้' });
        }

        res.json({
            message: result.statusChanged
                ? `อัปเดตสถานะเป็น ${getOrderStatusLabel(result.newStatus)} เรียบร้อยแล้ว`
                : `สถานะคำสั่งซื้อนี้เป็น ${getOrderStatusLabel(result.newStatus)} อยู่แล้ว`,
            status: result.newStatus,
            previousStatus: result.previousStatus,
            order: result.order
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ error: 'ไม่สามารถอัปเดตสถานะคำสั่งซื้อได้' });
    }
});

// Get order details
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(
            `SELECT o.*, c.customer_fname, c.customer_lname, c.customer_email, c.customer_tel
             FROM \`order\` o
             JOIN customer c ON o.customer_id = c.customer_id
             WHERE o.order_id = ?`,
            [req.params.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        // Check if customer owns this order or is admin
        if (req.user.role !== 'admin' && order.customer_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Get order details
        const [orderDetails] = await pool.execute(
            `SELECT od.*, p.product_name, p.product_image
             FROM order_detail od
             JOIN product p ON od.product_id = p.product_id
             WHERE od.order_id = ?`,
            [req.params.id]
        );

        // Get installment payments
        const [installments] = await pool.execute(
            'SELECT * FROM installment_payments WHERE order_id = ? ORDER BY installment_number',
            [req.params.id]
        );

        const normalizedDetails = orderDetails.map((detail) => ({
            ...detail,
            product_image: getPrimaryProductImage(detail.product_image),
            product_images: parseProductImages(detail.product_image),
            price: Number(detail.price) || 0,
            quantity: Number(detail.quantity) || 0
        }));

        const normalizedInstallments = installments.map((row) => ({
            ...row,
            installment_amount: Number(row.installment_amount) || 0
        }));

        res.json({
            ...order,
            shipping_address: normalizeShippingRecord(order.shipping_address),
            details: normalizedDetails,
            installments: normalizedInstallments
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ error: 'Failed to get order' });
    }
});

// Cancel order (customer)
app.put('/api/orders/cancel/:id', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const orderId = req.params.id;
        const [orders] = await connection.execute('SELECT * FROM `order` WHERE order_id = ?', [orderId]);

        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const order = orders[0];

        if (order.customer_id !== req.user.id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (order.order_status === 'approved' || order.order_status === 'awaiting_payment') {
            return res.status(400).json({ error: 'คำสั่งซื้อนี้ได้รับการอนุมัติแล้ว ไม่สามารถยกเลิกได้' });
        }

        if (order.order_status === 'cancelled' || order.order_status === 'cancelled_by_customer') {
            return res.status(400).json({ error: 'คำสั่งซื้อนี้ยกเลิกไปแล้ว' });
        }

        await connection.execute(
            'UPDATE `order` SET order_status = ? WHERE order_id = ?',
            ['cancelled_by_customer', orderId]
        );

        res.json({ message: 'ยกเลิกคำสั่งซื้อสำเร็จ', status: 'cancelled_by_customer' });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ error: 'ไม่สามารถยกเลิกคำสั่งซื้อได้' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Create order
app.post('/api/orders', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        const [customers] = await connection.execute(
            'SELECT customer_id FROM customer WHERE customer_id = ? LIMIT 1',
            [req.user.id]
        );

        if (customers.length === 0) {
            return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้นี้' });
        }

        await connection.beginTransaction();
        transactionStarted = true;

        const { items, paymentMethod, installmentPeriods, shippingAddress } = req.body;
        const customerId = req.user.id;

        const normalizedShipping = normalizeShippingRecord(shippingAddress);

        if (!normalizedShipping.address) {
            return res.status(400).json({ error: 'กรุณาระบุที่อยู่จัดส่ง' });
        }

        // Calculate total
        let totalAmount = 0;
        const pricingColumnMap = {
            cash: 'price_cash',
            cashPromo: 'price_cash_promo',
            installment: 'price_installment',
            installmentPromo: 'price_installment_promo'
        };

        const resolvedItems = [];
        for (const item of items) {
            const [products] = await connection.execute(
                'SELECT price_cash, price_cash_promo, price_installment, price_installment_promo FROM product WHERE product_id = ?',
                [item.product_id]
            );

            if (products.length === 0) {
                throw new Error(`Product ${item.product_id} not found`);
            }

            const product = products[0];
            let unitPrice = item.price;

            if (unitPrice == null && item.pricingType && pricingColumnMap[item.pricingType]) {
                unitPrice = product[pricingColumnMap[item.pricingType]];
            }

            if (unitPrice == null) {
                unitPrice = product.price_cash;
            }

            totalAmount += unitPrice * item.quantity;
            resolvedItems.push({ ...item, unitPrice });
        }

        // Calculate monthly payment
        const normalizedMethod = (paymentMethod || '').toLowerCase();
        const isInstallmentMethod = normalizedMethod.includes('install');
        const periods =
            isInstallmentMethod
                ? Math.min(Math.max(Number(installmentPeriods) || 1, 1), 12)
                : 1;
        const monthlyPayment = totalAmount / periods;

        // Insert order
        const [orderResult] = await connection.execute(
            'INSERT INTO `order` (customer_id, order_date, order_status, total_amount, payment_method, installment_periods, monthly_payment, shipping_address) VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?)',
            [customerId, 'pending', totalAmount, paymentMethod, periods, monthlyPayment, JSON.stringify(normalizedShipping)]
        );

        const orderId = orderResult.insertId;

        // Insert order details and update stock
        for (const item of resolvedItems) {
            await connection.execute(
                'INSERT INTO order_detail (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, item.unitPrice]
            );
        }

        // Create installment payments only for installment orders
        if (isInstallmentMethod && periods > 0) {
            for (let i = 1; i <= periods; i++) {
                const dueDate = new Date();
                dueDate.setMonth(dueDate.getMonth() + i);

                await connection.execute(
                    'INSERT INTO installment_payments (order_id, installment_number, installment_amount, payment_due_date, payment_status) VALUES (?, ?, ?, ?, ?)',
                    [orderId, i, monthlyPayment, dueDate.toISOString().split('T')[0], 'pending']
                );
            }
        }

        await connection.commit();
        res.json({
            message: 'Order created successfully',
            order_id: orderId,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            installment_periods: periods,
            monthly_payment: monthlyPayment,
            shipping_address: normalizedShipping
        });
    } catch (error) {
        if (transactionStarted) {
            await connection.rollback();
        }
        console.error('Create order error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to create order' });
        }
    } finally {
        connection.release();
    }
});

// Approve order (Admin only)
app.put('/api/orders/approve/:id', authenticateToken, isAdmin, async (req, res) => {
    const orderId = req.params.id;
    try {
        const result = await setOrderStatus(orderId, 'approved', {
            sendNotification: true,
            allowedCurrentStatuses: ['pending']
        });

        if (!result.success) {
            if (result.code === 'NOT_FOUND') {
                return res.status(404).json({ error: 'Order not found' });
            }
            if (result.code === 'INVALID_TRANSITION') {
                return res.status(400).json({ error: 'คำสั่งซื้อนี้ถูกดำเนินการไปแล้ว' });
            }
            if (result.code === 'INVALID_STATUS') {
                return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
            }
            return res.status(400).json({ error: 'ไม่สามารถอนุมัติคำสั่งซื้อได้' });
        }

        res.json({
            message: result.statusChanged
                ? 'คำสั่งซื้อได้รับการอนุมัติแล้ว'
                : 'คำสั่งซื้อนี้ถูกอนุมัติไปก่อนหน้านี้แล้ว',
            status: result.newStatus
        });
    } catch (error) {
        console.error('Approve order error:', error);
        res.status(500).json({ error: 'Failed to approve order' });
    }
});

// Reject order (Admin only)
app.put('/api/orders/reject/:id', authenticateToken, isAdmin, async (req, res) => {
    const orderId = req.params.id;
    try {
        const result = await setOrderStatus(orderId, 'cancelled', { sendNotification: false });
        if (!result.success) {
            if (result.code === 'NOT_FOUND') {
                return res.status(404).json({ error: 'Order not found' });
            }
            if (result.code === 'INVALID_STATUS') {
                return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
            }
            return res.status(400).json({ error: 'ไม่สามารถไม่อนุมัติคำสั่งซื้อได้' });
        }
        res.json({
            message: result.statusChanged
                ? 'ไม่อนุมัติคำสั่งซื้อเรียบร้อยแล้ว'
                : 'คำสั่งซื้อนี้ถูกยกเลิกไปก่อนแล้ว',
            status: result.newStatus
        });
    } catch (error) {
        console.error('Reject order error:', error);
        res.status(500).json({ error: 'ไม่สามารถไม่อนุมัติคำสั่งซื้อได้' });
    }
});

// ==================== START SERVER ====================

const PORT = Number(process.env.PORT) || 7100;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

