const http = require('http');

// ข้อมูลลูกค้า 10 คน
const customers = [
  { username: 'customer3', password: 'customer123', id: 7, name: 'ประเสริฐ ดีงาม', address: '123 ถนนราชดำริ แขวงลุมพินี เขตปทุมวัน กรุงเทพฯ 10330', tel: '081-234-5678' },
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

// ฟังก์ชันสำหรับทำ HTTP request
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.error || `HTTP ${res.statusCode}: ${responseData}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// ฟังก์ชัน login
async function loginCustomer(customer) {
  try {
    const response = await makeRequest('POST', '/api/customer/login', {
      username: customer.username,
      password: customer.password
    });
    return response.token;
  } catch (error) {
    throw new Error(`Login failed for ${customer.username}: ${error.message}`);
  }
}

// ฟังก์ชันดึงข้อมูลสินค้า
async function getProducts() {
  try {
    const products = await makeRequest('GET', '/api/products');
    // กรองเฉพาะสินค้าที่มีราคา
    return products.filter(p => p.price_cash && p.price_cash > 0);
  } catch (error) {
    throw new Error(`Failed to get products: ${error.message}`);
  }
}

// ฟังก์ชันสร้างคำสั่งซื้อ
async function createOrder(customer, token, products) {
  // สุ่มจำนวนสินค้าในคำสั่งซื้อ (1-3 รายการ)
  const numItems = Math.floor(Math.random() * 3) + 1;
  const selectedProducts = [];
  
  // สุ่มสินค้า
  for (let i = 0; i < numItems; i++) {
    const randomProduct = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 ชิ้น
    
    // สุ่มเลือก pricing type
    const pricingTypes = ['cash', 'cashPromo', 'installment', 'installmentPromo'];
    const pricingType = pricingTypes[Math.floor(Math.random() * pricingTypes.length)];
    
    // หาราคาตาม pricing type
    let price = null;
    if (pricingType === 'cash' || pricingType === 'cashPromo') {
      price = pricingType === 'cashPromo' && randomProduct.price_cash_promo 
        ? randomProduct.price_cash_promo 
        : randomProduct.price_cash;
    } else {
      price = pricingType === 'installmentPromo' && randomProduct.price_installment_promo 
        ? randomProduct.price_installment_promo 
        : randomProduct.price_installment || randomProduct.price_cash;
    }
    
    selectedProducts.push({
      product_id: randomProduct.product_id,
      quantity: quantity,
      price: price,
      pricingType: pricingType
    });
  }

  // สุ่ม payment method
  const paymentMethods = ['cash', 'installment'];
  const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  
  // ถ้าเป็น installment สุ่มจำนวนงวด (3-12 งวด)
  const installmentPeriods = paymentMethod === 'installment' 
    ? Math.floor(Math.random() * 10) + 3 
    : 1;

  // สร้าง shipping address
  const nameParts = customer.name.split(' ');
  const shippingAddress = {
    recipientName: nameParts[0] || customer.name,
    recipientSurname: nameParts.slice(1).join(' ') || '',
    phone: customer.tel.replace(/-/g, ''),
    address: customer.address
  };

  try {
    const response = await makeRequest('POST', '/api/orders', {
      items: selectedProducts,
      paymentMethod: paymentMethod,
      installmentPeriods: installmentPeriods,
      shippingAddress: shippingAddress
    }, token);

    return response;
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
}

// ฟังก์ชันหลัก
async function createOrders() {
  console.log('เริ่มต้นการสร้างคำสั่งซื้อ 20 คำสั่งซื้อ...\n');
  
  try {
    // ดึงข้อมูลสินค้า
    console.log('กำลังดึงข้อมูลสินค้า...');
    const products = await getProducts();
    console.log(`พบสินค้า ${products.length} รายการ\n`);

    if (products.length === 0) {
      throw new Error('ไม่พบสินค้าในระบบ');
    }

    // สร้างคำสั่งซื้อ 20 คำสั่งซื้อ
    const totalOrders = 20;
    let successCount = 0;
    let failCount = 0;
    const ordersByCustomer = {};

    // กระจายคำสั่งซื้อให้ลูกค้า (แต่ละคนจะได้ 2 คำสั่งซื้อ)
    for (let i = 0; i < totalOrders; i++) {
      const customerIndex = i % customers.length;
      const customer = customers[customerIndex];
      
      try {
        // Login เพื่อได้ token
        const token = await loginCustomer(customer);
        
        // สร้างคำสั่งซื้อ
        const order = await createOrder(customer, token, products);
        
        if (!ordersByCustomer[customer.username]) {
          ordersByCustomer[customer.username] = [];
        }
        ordersByCustomer[customer.username].push(order);
        
        const totalAmount = order.total_amount.toLocaleString('th-TH', {
          style: 'currency',
          currency: 'THB',
          minimumFractionDigits: 2
        });
        
        console.log(`✅ [${i + 1}/${totalOrders}] สร้างคำสั่งซื้อสำเร็จ`);
        console.log(`   ลูกค้า: ${customer.name} (${customer.username})`);
        console.log(`   Order ID: ${order.order_id}`);
        console.log(`   ยอดรวม: ${totalAmount}`);
        console.log(`   วิธีชำระ: ${order.payment_method === 'installment' ? `ผ่อนชำระ ${order.installment_periods} งวด` : 'ชำระเต็มจำนวน'}`);
        console.log(`   สถานะ: pending\n`);
        
        successCount++;
      } catch (error) {
        console.log(`❌ [${i + 1}/${totalOrders}] สร้างคำสั่งซื้อไม่สำเร็จ`);
        console.log(`   ลูกค้า: ${customer.name} (${customer.username})`);
        console.log(`   ข้อผิดพลาด: ${error.message}\n`);
        failCount++;
      }
      
      // รอสักครู่เพื่อไม่ให้ server รับ request มากเกินไป
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('\n=== สรุปผล ===');
    console.log(`✅ สร้างคำสั่งซื้อสำเร็จ: ${successCount} คำสั่งซื้อ`);
    console.log(`❌ สร้างคำสั่งซื้อไม่สำเร็จ: ${failCount} คำสั่งซื้อ`);
    console.log(`📊 รวมทั้งหมด: ${totalOrders} คำสั่งซื้อ\n`);

    console.log('=== สรุปคำสั่งซื้อตามลูกค้า ===');
    for (const [username, orders] of Object.entries(ordersByCustomer)) {
      const customer = customers.find(c => c.username === username);
      const totalAmount = orders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);
      console.log(`${customer.name} (${username}): ${orders.length} คำสั่งซื้อ, รวม ${totalAmount.toLocaleString('th-TH', { style: 'currency', currency: 'THB' })}`);
    }

  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
}

// รันสคริปต์
createOrders().catch(error => {
  console.error('เกิดข้อผิดพลาด:', error.message);
  process.exit(1);
});

