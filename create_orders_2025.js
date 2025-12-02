const mysql = require('mysql2/promise');
const http = require('http');
require('dotenv').config();

const customers = [
  { username: 'customer3', password: 'customer123', id: 7, name: 'ประเสริฐ ดีงาม', address: '123 ถนนสุขุมวิท แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330', tel: '081-234-5678' },
  { username: 'customer4', password: 'customer123', id: 8, name: 'วิไล สวยงาม', address: '456 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500', tel: '082-345-6789' },
  { username: 'customer5', password: 'customer123', id: 9, name: 'สมศักดิ์ รวยทรัพย์', address: '789 ถนนเพชรบุรี แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400', tel: '083-456-7890' },
  { username: 'customer6', password: 'customer123', id: 10, name: 'มาลี ใจดี', address: '321 ถนนสุขุมวิท แขวงคลองตัน เขตคลองตัน กรุงเทพฯ 10110', tel: '084-567-8901' },
  { username: 'customer7', password: 'customer123', id: 11, name: 'วิทยา เก่งมาก', address: '654 ถนนพหลโยธิน แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900', tel: '085-678-9012' },
  { username: 'customer8', password: 'customer123', id: 12, name: 'สุภาพ น่ารัก', address: '987 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310', tel: '086-789-0123' },
  { username: 'customer9', password: 'customer123', id: 13, name: 'ชาญชัย ฉลาดมาก', address: '147 ถนนลาดพร้าว แขวงลาดพร้าว เขตลาดพร้าว กรุงเทพฯ 10230', tel: '087-890-1234' },
  { username: 'customer10', password: 'customer123', id: 14, name: 'รัตนา สวยใส', address: '258 ถนนบางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพฯ 10260', tel: '088-901-2345' },
  { username: 'customer11', password: 'customer123', id: 15, name: 'ธีรพงษ์ เก่งกาจ', address: '369 ถนนรามคำแหง แขวงพลับพลา เขตวังทองหลาง กรุงเทพฯ 10310', tel: '089-012-3456' },
  { username: 'customer12', password: 'customer123', id: 16, name: 'ปิยะ ดีใจ', address: '741 ถนนพระราม 2 แขวงบางมด เขตทุ่งครุ กรุงเทพฯ 10140', tel: '090-123-4567' }
];

const BASE_URL = 'http://localhost:7100';
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'sangsawang_furniture'
};

const statuses = [
  'pending',
  'awaiting_payment',
  'approved',
  'waiting_for_delivery',
  'completed',
  'cancelled',
  'cancelled_by_customer'
];

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = data ? JSON.stringify(data) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || responseData || `HTTP ${res.statusCode}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function loginCustomer(customer) {
  const response = await makeRequest('POST', '/api/customer/login', {
    username: customer.username,
    password: customer.password
  });
  return response.token;
}

async function getProducts() {
  const products = await makeRequest('GET', '/api/products');
  return products.filter((p) => Number(p.price_cash) > 0);
}

function randomStatus() {
  const idx = Math.floor(Math.random() * statuses.length);
  return statuses[idx];
}

async function createOrder(customer, token, products) {
  const itemsCount = Math.floor(Math.random() * 3) + 1;
  const selectedProducts = [];

  for (let i = 0; i < itemsCount; i++) {
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const pricingTypes = ['cash', 'cashPromo', 'installment', 'installmentPromo'];
    const pricingType = pricingTypes[Math.floor(Math.random() * pricingTypes.length)];

    let price = product.price_cash;
    if (pricingType === 'cashPromo' && product.price_cash_promo) {
      price = product.price_cash_promo;
    } else if (pricingType === 'installment' && product.price_installment) {
      price = product.price_installment;
    } else if (pricingType === 'installmentPromo' && product.price_installment_promo) {
      price = product.price_installment_promo;
    }

    selectedProducts.push({
      product_id: product.product_id,
      quantity,
      price,
      pricingType
    });
  }

  const paymentMethod = Math.random() > 0.5 ? 'cash' : 'installment';
  const installmentPeriods = paymentMethod === 'installment' ? Math.floor(Math.random() * 10) + 3 : 1;

  const nameParts = customer.name.split(' ');
  const shippingAddress = {
    recipientName: nameParts[0] || customer.name,
    recipientSurname: nameParts.slice(1).join(' ') || '',
    phone: customer.tel.replace(/-/g, ''),
    address: customer.address
  };

  const response = await makeRequest('POST', '/api/orders', {
    items: selectedProducts,
    paymentMethod,
    installmentPeriods,
    shippingAddress
  }, token);

  return response.order_id;
}

function randomDate(year, month) {
  const day = Math.floor(Math.random() * 28) + 1;
  return new Date(year, month - 1, day);
}

(async () => {
  const months = [1,2,3,4,5,6,7,8,9,10,11];
  let totalCreated = 0;
  const pool = await mysql.createPool(dbConfig);
  const products = await getProducts();

  for (const month of months) {
    const orderCount = Math.floor(Math.random() * 21) + 10; // 10-30
    console.log(`\nเดือน ${month}/2025 - สร้างคำสั่งซื้อ ${orderCount} รายการ`);

    for (let i = 0; i < orderCount; i++) {
      const customer = customers[(totalCreated + i) % customers.length];
      try {
        const token = await loginCustomer(customer);
        const orderId = await createOrder(customer, token, products);
        const date = randomDate(2025, month);
        const status = randomStatus();

        await pool.execute('UPDATE `order` SET order_date = ?, order_status = ? WHERE order_id = ?', [
          date.toISOString().split('T')[0],
          status,
          orderId
        ]);

        console.log(`  - Order #${orderId} (${customer.name}) ${date.toISOString().split('T')[0]} | ${status}`);
        totalCreated++;
      } catch (error) {
        console.error('  ! สร้างคำสั่งซื้อไม่สำเร็จ:', error.message);
      }

      await new Promise((r) => setTimeout(r, 200));
    }
  }

  await pool.end();
  console.log(`\nสร้างคำสั่งซื้อรวมทั้งหมด ${totalCreated} รายการเรียบร้อย`);
})();
